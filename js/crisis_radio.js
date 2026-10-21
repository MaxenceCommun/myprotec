/**
 * PROTEC LIVE - IMMERSION AUDIO & RADIO DE CRISE (PIPER TTS - FR_FR-MLS-MEDIUM)
 * 
 * Système complet de messages vocaux tactiques pour la gestion de crise :
 * - Bip radio d'ouverture de canal (start_radio.mp3)
 * - Traitement DSP Web Audio (filtre passe-bande VHF 420Hz-3200Hz, distorsion harmonique, squelch de fin de transmission)
 * - Moteur hybride : Piper TTS serveur (125 identifiants locuteurs) avec cache disque + Web Speech API radio fallback
 * - Attribution des voix : IDs fixes pour les autorités institutionnelles, IDs uniques persistants pour chaque bénévole (modulo 125)
 * - Scénarios : Points de situation préfectoraux, briefings d'ordres d'opération, appels individuels d'astreinte
 * - File d'attente asynchrone (FIFO) anti-chevauchement avec bandeau HUD radio et sous-titres en direct
 * - Option 100% facultative avec persistance localStorage
 */

window.ProtecCrisisRadio = {
  enabled: true,
  volume: 0.9,
  isProcessing: false,
  currentTransmission: null,
  queue: [],
  audioCtx: null,
  radioBuffer: null,
  startRadioAudio: null,
  serverStatus: { checked: false, available: false, model: 'fr_FR-mls-medium', speakersCount: 125 },

  apiBaseUrl: null,
  activeEngine: 'piper', // 'piper' ou 'webspeech'

  // =========================================================================
  // 1. ATTRIBUTION DES VOIX (MODÈLE fr_FR-mls-medium : 125 IDENTIFIANTS)
  // =========================================================================
  
  // Voix fixes pour les autorités institutionnelles et les partenaires régaliens
  INSTITUTIONAL_SPEAKERS: {
    // 🏛️ Autorités Préfectorales & Gouvernance
    'prefet': 10,                 // Voix grave, autoritaire et solennelle
    'prefecture': 10,
    'cabinet_prefet': 10,
    'sidpc': 3,                   // Service Interministériel de Défense et de Protection Civile
    'siras': 3,
    'cellule_crise': 3,
    'cod': 3,                     // Centre Opérationnel Départemental
    
    // 🚑 Régulation Médicale & Secours Publics
    'samu': 24,                   // Régulateur médical SAMU / Centre 15
    'medecin_regulateur': 24,
    'codis': 28,                  // Centre Opérationnel Départemental d'Incendie et de Secours (18/112)
    'sdis': 28,
    'cos': 78,                    // Commandant des Opérations de Secours sur site
    'cump': 42,                   // Cellule d'Urgence Médico-Psychologique
    
    // 🏢 Collectivités & Partenaires Opérationnels
    'mairie': 14,                 // Permanence communale / Gestion du gymnase / CAI
    'police': 66,                 // Police Nationale / Gendarmerie (sécurisation des périmètres)
    'gendarmerie': 66,
    'sncf': 88,                   // Permanence de crise ferroviaire
    
    // 🛡️ Cadres de permanence et coordination interne Protection Civile
    'cadre_astreinte': 52,        // Cadre de permanence départementale Protec
    'chef_dispositif': 78,        // Chef de dispositif associatif
    'officier_liaison': 52,       // Officier de liaison Protec auprès du préfet
    'coordinateur_cai': 14        // Responsable du Centre d'Accueil des Impliqués
  },

  /**
   * Calcule un identifiant de voix persistant et unique pour un bénévole (modulo 125)
   * Le même bénévole garde systématiquement la même voix tout au long du jeu.
   */
  getVolunteerSpeakerId(volunteer) {
    if (!volunteer) return 5;
    const rawKey = String(
      volunteer.id || 
      volunteer.matricule || 
      `${volunteer.firstName || ''}_${volunteer.lastName || ''}` || 
      volunteer.name || 
      'vol_def'
    );
    
    // Algorithme de hachage djb2 robuste pour répartir uniformément sur les 125 locuteurs
    let hash = 5381;
    for (let i = 0; i < rawKey.length; i++) {
      hash = ((hash << 5) + hash) + rawKey.charCodeAt(i);
      hash |= 0;
    }
    
    // Modulo 125 garanti positif : renvoie un entier entre 0 et 124
    return Math.abs(hash) % 125;
  },

  /**
   * Résout l'identifiant de voix selon la source, le rôle ou le bénévole
   */
  resolveSpeakerId(source, volunteer = null) {
    if (volunteer) {
      return this.getVolunteerSpeakerId(volunteer);
    }
    if (!source) return 3;

    const s = String(source).toLowerCase();
    if (s.includes('préfet') || s.includes('prefet') || s.includes('cabinet')) return this.INSTITUTIONAL_SPEAKERS['prefet'];
    if (s.includes('sidpc') || s.includes('cod') || s.includes('cellule de crise')) return this.INSTITUTIONAL_SPEAKERS['sidpc'];
    if (s.includes('samu') || s.includes('15') || s.includes('régulation') || s.includes('regulation')) return this.INSTITUTIONAL_SPEAKERS['samu'];
    if (s.includes('codis') || s.includes('sdis') || s.includes('pompier') || s.includes('18')) return this.INSTITUTIONAL_SPEAKERS['codis'];
    if (s.includes('cos') || s.includes('commandement terrain') || s.includes('chef de dispositif')) return this.INSTITUTIONAL_SPEAKERS['cos'];
    if (s.includes('cadre') || s.includes('astreinte')) return this.INSTITUTIONAL_SPEAKERS['cadre_astreinte'];
    if (s.includes('cump') || s.includes('psy')) return this.INSTITUTIONAL_SPEAKERS['cump'];
    if (s.includes('mairie') || s.includes('communal') || s.includes('cai')) return this.INSTITUTIONAL_SPEAKERS['mairie'];
    if (s.includes('sncf') || s.includes('gare')) return this.INSTITUTIONAL_SPEAKERS['sncf'];
    if (s.includes('police') || s.includes('gendarmerie')) return this.INSTITUTIONAL_SPEAKERS['police'];

    // Hachage textuel générique si source inconnue
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 125;
  },

  // =========================================================================
  // 2. INITIALISATION ET GESTION DU TOGGLE FACULTATIF
  // =========================================================================

  init() {
    try {
      const stored = localStorage.getItem('protec_crisis_radio_enabled');
      // Activé par défaut si non spécifié
      this.enabled = stored !== null ? stored === 'true' : true;
    } catch (e) {
      this.enabled = true;
    }

    // Préchargement du son start_radio.mp3
    try {
      this.startRadioAudio = new Audio('sons/start_radio.mp3');
      this.startRadioAudio.preload = 'auto';
      this.startRadioAudio.volume = 0.85;
    } catch (e) {}

    // Vérification asynchrone et résolution automatique du serveur Piper TTS
    this.checkServerStatus();

    // Montage du HUD radio flottant
    this.injectRadioHud();
  },

  /**
   * Détecte intelligemment l'URL du serveur Piper TTS :
   * Fonctionne que le jeu soit ouvert sur http://localhost:8080, http://localhost:5500 (Live Server),
   * http://127.0.0.1:3000, ou tout autre port local de dev.
   */
  async resolveApiBaseUrl() {
    if (this.apiBaseUrl !== null) return this.apiBaseUrl;

    const candidates = [
      '', // Relatif : si le client est servi directement par server.js
      'http://localhost:8080',
      'http://127.0.0.1:8080'
    ];

    for (const base of candidates) {
      try {
        const testUrl = `${base}/api/crisis/tts/status`;
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(testUrl, { signal: controller.signal });
        clearTimeout(tid);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.piperInstalled && data.modelPresent) {
            this.apiBaseUrl = base;
            this.activeEngine = 'piper';
            this.serverStatus = {
              checked: true,
              available: true,
              modelPresent: true,
              model: data.model || 'fr_FR-mls-medium',
              speakersCount: data.speakersCount || 125,
              cachedFilesCount: data.cachedFilesCount || 0
            };
            console.log(`🎙️ [Piper TTS] Moteur officiel fr_FR-mls-medium connecté avec succès (${base || 'origine locale'}). 125 voix haute fidélité actives.`);
            return this.apiBaseUrl;
          }
        }
      } catch (err) {}
    }

    this.apiBaseUrl = '';
    this.serverStatus.checked = true;
    this.serverStatus.available = false;
    this.activeEngine = 'webspeech';
    console.warn('⚠️ [Radio de Crise] Serveur Piper TTS non joint sur le port 8080. Fallback vocal actif. (Assurez-vous que "node server.js" est lancé)');
    return this.apiBaseUrl;
  },

  async checkServerStatus() {
    return await this.resolveApiBaseUrl();
  },

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('protec_crisis_radio_enabled', this.enabled ? 'true' : 'false');
    } catch (e) {}

    if (!this.enabled) {
      this.clearQueue();
    }

    if (window.game) {
      window.game.showToast(
        'Radio Vocale de Crise',
        this.enabled ? 'Vocalises tactiques activées 🎙️📻' : 'Radio de crise muette 🔇',
        this.enabled ? 'blue' : 'slate'
      );
    }

    // Rafraîchir les boutons d'en-tête du PC Crise si ouvert
    if (window.ProtecCriseLogistique && typeof window.ProtecCriseLogistique.refreshPcCriseModalIfOpen === 'function') {
      window.ProtecCriseLogistique.refreshPcCriseModalIfOpen(window.game);
    }
    this.updateHudState();
    return this.enabled;
  },

  // =========================================================================
  // 3. EFFETS DSP AUDIO (TRAITEMENT RADIO PMR/VHF & SQUELCH)
  // =========================================================================

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  },

  /**
   * Crée la courbe de distorsion harmonique pour le filtre radio analogique
   */
  makeDistortionCurve(amount = 22) {
    const k = typeof amount === 'number' ? amount : 22;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  },

  /**
   * Applique le graphe de filtres radio analogique (Walkie-talkie / VHF / PMR)
   * Coupe les sous-basses < 420 Hz, coupe les aigus > 3200 Hz, accentue les médiums et sature légèrement
   */
  connectRadioFx(ctx, sourceNode, destNode) {
    // 1. Coupe-bas (Passe-haut) à 420 Hz
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 420;
    highpass.Q.value = 0.9;

    // 2. Coupe-haut (Passe-bas) à 3200 Hz
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3200;
    lowpass.Q.value = 1.1;

    // 3. Résonance micro radio à 1800 Hz
    const peaking = ctx.createBiquadFilter();
    peaking.type = 'peaking';
    peaking.frequency.value = 1800;
    peaking.Q.value = 1.2;
    peaking.gain.value = 4.0;

    // 4. Distorsion analogique harmonique
    const waveshaper = ctx.createWaveShaper();
    waveshaper.curve = this.makeDistortionCurve(18);
    waveshaper.oversample = '2x';

    // 5. Gain final
    const gainNode = ctx.createGain();
    gainNode.gain.value = this.volume || 0.9;

    sourceNode.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(peaking);
    peaking.connect(waveshaper);
    waveshaper.connect(gainNode);
    gainNode.connect(destNode);

    return { highpass, lowpass, peaking, waveshaper, gainNode };
  },

  /**
   * Bip sonore d'ouverture radio (utilise start_radio.mp3 avec fallback synthétique)
   */
  async playStartRadioBeep() {
    return new Promise(resolve => {
      try {
        const audio = new Audio('sons/start_radio.mp3');
        audio.volume = 0.85;
        let resolved = false;
        const doResolve = () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };
        audio.onended = doResolve;
        audio.onerror = () => {
          this.playSyntheticStartBeep();
          setTimeout(doResolve, 280);
        };
        const p = audio.play();
        if (p !== undefined) {
          p.catch(() => {
            this.playSyntheticStartBeep();
            setTimeout(doResolve, 280);
          });
        }
        // Sécurité timeout max de 1.2s au cas où
        setTimeout(doResolve, 1200);
      } catch (e) {
        this.playSyntheticStartBeep();
        setTimeout(resolve, 280);
      }
    });
  },

  playSyntheticStartBeep() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  },

  /**
   * Bruit de fin de transmission radio (Squelch PTT release de 75ms)
   */
  playRadioSquelch() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const duration = 0.075;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400;
      filter.Q.value = 2.2;
      const gain = ctx.createGain();
      gain.gain.value = 0.08;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) {}
  },

  // =========================================================================
  // 4. FILE D'ATTENTE ASYNCHRONE ET MOTEUR DE DIFFUSION
  // =========================================================================

  /**
   * Enfile une transmission radio vocale
   */
  transmit(item) {
    if (!this.enabled) return;
    if (!item || !item.text) return;

    // Normalisation de l'élément de transmission
    const transmission = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      text: item.text,
      cleanText: this.cleanTextForSpeech(item.text),
      source: item.source || 'PC Régulation',
      role: item.role || 'Régulateur',
      speakerId: item.speakerId !== undefined ? item.speakerId : this.resolveSpeakerId(item.source, item.volunteer),
      volunteer: item.volunteer || null,
      priority: !!item.priority,
      channel: item.channel || 'CANAL CRISE',
      icon: item.icon || this.getTransmissionIcon(item.source, item.volunteer),
      timestamp: Date.now()
    };

    if (transmission.priority) {
      // Priorité haute : inséré immédiatement après le message en cours
      this.queue.unshift(transmission);
    } else {
      this.queue.push(transmission);
    }

    this.updateHudState();

    if (!this.isProcessing) {
      this.processQueue();
    }
  },

  cleanTextForSpeech(text) {
    if (!text) return '';
    return String(text)
      .replace(/<[^>]*>/g, '') // Retirer HTML
      .replace(/[^\w\sàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ',.!?:\-–—]/g, ' ') // Nettoyer caractères spéciaux
      .replace(/\s+/g, ' ')
      .trim();
  },

  getTransmissionIcon(source = '', volunteer = null) {
    if (volunteer) return 'user-check';
    const s = String(source).toLowerCase();
    if (s.includes('préfet') || s.includes('prefet') || s.includes('sidpc')) return 'landmark';
    if (s.includes('samu') || s.includes('15') || s.includes('médical')) return 'heart-pulse';
    if (s.includes('codis') || s.includes('sdis') || s.includes('pompier')) return 'flame';
    if (s.includes('cos') || s.includes('commandement')) return 'shield-alert';
    if (s.includes('mairie') || s.includes('cai')) return 'home';
    if (s.includes('cadre') || s.includes('astreinte')) return 'radio';
    return 'radio';
  },

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0 || !this.enabled) {
      if (this.queue.length === 0) {
        this.currentTransmission = null;
        this.updateHudState();
      }
      return;
    }

    this.isProcessing = true;
    const current = this.queue.shift();
    this.currentTransmission = current;
    this.updateHudState();

    try {
      // 1. Émission du bip radio d'ouverture (start_radio.mp3)
      await this.playStartRadioBeep();

      // 2. Léger silence radio de 80ms
      await new Promise(r => setTimeout(r, 80));

      // 3. Diffusion de la parole (avec effet radio)
      await this.speakWithRadioEffect(current);

      // 4. Bruit de fin de transmission (Squelch release)
      this.playRadioSquelch();

      // 5. Blanc inter-messages de 380ms pour un réalisme parfait
      await new Promise(r => setTimeout(r, 380));
    } catch (err) {
      console.warn('Erreur lors de la transmission radio:', err);
    } finally {
      this.isProcessing = false;
      this.currentTransmission = null;
      this.updateHudState();
      
      // Enchaîner sur la file d'attente
      if (this.queue.length > 0 && this.enabled) {
        this.processQueue();
      }
    }
  },

  /**
   * Synthétise et diffuse le message vocal :
   * Tente d'abord le serveur Piper TTS (modèle fr_FR-mls-medium avec 125 locuteurs et cache),
   * sinon bascule instantanément sur la synthèse Web Speech API passée dans les filtres radio.
   */
  async speakWithRadioEffect(tx) {
    const text = tx.cleanText;
    const speakerId = tx.speakerId;

    // A. Tenter la requête API Piper TTS officielle
    let playedViaServer = false;
    try {
      const base = await this.resolveApiBaseUrl();
      const url = `${base}/api/crisis/tts?speaker=${speakerId}&text=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('audio')) {
          const arrayBuffer = await res.arrayBuffer();
          const ctx = this.getAudioContext();
          if (ctx) {
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            this.activeEngine = 'piper';
            this.updateHudState();
            console.log(`🎙️ [Radio de Crise] Diffusion réussie via Piper TTS fr_FR-mls-medium (Voix #${speakerId}) : "${text.slice(0, 45)}..."`);
            await this.playDecodedAudioBuffer(audioBuffer);
            playedViaServer = true;
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ [Radio de Crise] Échec appel Piper TTS serveur, bascule fallback:', e);
      playedViaServer = false;
    }

    if (playedViaServer) return;

    // B. Fallback Web Speech API avec modulation de timbre
    this.activeEngine = 'webspeech';
    this.updateHudState();
    console.warn(`⚠️ [Radio de Crise] Diffusion en mode Fallback WebSpeech (Voix #${speakerId})`);
    await this.speakViaWebSpeechRadio(text, speakerId);
  },

  currentAudioSourceNode: null,

  playDecodedAudioBuffer(audioBuffer) {
    return new Promise(resolve => {
      const ctx = this.getAudioContext();
      if (!ctx) return resolve();

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      this.currentAudioSourceNode = source;
      this.connectRadioFx(ctx, source, ctx.destination);

      source.onended = () => {
        this.currentAudioSourceNode = null;
        resolve();
      };
      source.start(0);
    });
  },

  /**
   * Fallback Web Speech API calibré avec paramètres vocaux persistants selon le locuteur
   */
  speakViaWebSpeechRadio(text, speakerId) {
    return new Promise(resolve => {
      if (!('speechSynthesis' in window)) {
        setTimeout(resolve, 1500);
        return;
      }

      // Interrompre une synthèse précédente résiduelle
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';

      // Modulation déterministe du pitch (timbre) et du débit selon les 125 voix
      // Permet de simuler 125 voix distinctes même sans Piper
      const pitchMod = 0.85 + (speakerId % 9) * 0.05; // 0.85 à 1.25
      const rateMod = 0.95 + ((speakerId * 7) % 5) * 0.04; // 0.95 à 1.15

      utterance.pitch = pitchMod;
      utterance.rate = rateMod;

      // Recherche d'une voix française disponible
      const voices = window.speechSynthesis.getVoices();
      const frVoices = voices.filter(v => v.lang && (v.lang.startsWith('fr') || v.lang.startsWith('FR')));
      if (frVoices.length > 0) {
        utterance.voice = frVoices[speakerId % frVoices.length];
      }

      // Générer un très léger souffle radio de fond pendant que la synthèse parle
      const stopNoise = this.playContinuousRadioStatic();

      let isFinished = false;
      const finish = () => {
        if (!isFinished) {
          isFinished = true;
          if (stopNoise) stopNoise();
          resolve();
        }
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      window.speechSynthesis.speak(utterance);

      // Sécurité timeout calculée sur la longueur du texte
      const maxDuration = Math.max(2500, (text.length / 10) * 1000);
      setTimeout(finish, maxDuration);
    });
  },

  /**
   * Génère un souffle radio PMR subtil en continu pendant la parole
   */
  playContinuousRadioStatic() {
    const ctx = this.getAudioContext();
    if (!ctx) return () => {};
    try {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.015; // Souffle très faible
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1600;
      filter.Q.value = 1.0;

      const gain = ctx.createGain();
      gain.gain.value = 0.04;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      return () => {
        try {
          noise.stop();
          noise.disconnect();
        } catch (e) {}
      };
    } catch (e) {
      return () => {};
    }
  },

  skip() {
    if (this.currentAudioSourceNode) {
      try {
        this.currentAudioSourceNode.stop();
        this.currentAudioSourceNode.disconnect();
      } catch (e) {}
      this.currentAudioSourceNode = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isProcessing = false;
    this.currentTransmission = null;
    this.updateHudState();
    if (this.queue.length > 0) {
      this.processQueue();
    }
  },

  clearQueue() {
    this.queue = [];
    this.skip();
  },

  /**
   * Réécoute instantanée d'un message radio de la main courante
   * Compatible avec encodage URI ou texte brut
   */
  replay(rawText, rawSource, speakerId = null) {
    if (!rawText) return;
    let text = String(rawText);
    try {
      if (text.includes('%')) text = decodeURIComponent(text);
    } catch (e) {}

    let source = rawSource ? String(rawSource) : 'PC Opérationnel';
    try {
      if (source.includes('%')) source = decodeURIComponent(source);
    } catch (e) {}

    // S'assurer que le contexte Web Audio est débloqué suite au clic utilisateur
    this.getAudioContext();

    // Si la radio globale était sur "mute", on active temporairement
    if (!this.enabled) {
      this.enabled = true;
    }

    // Interrompt le message en cours pour jouer la réécoute immédiatement
    if (this.isProcessing) {
      this.skip();
    }

    const resolvedSpeaker = (speakerId !== null && speakerId !== undefined) 
      ? speakerId 
      : this.resolveSpeakerId(source);

    this.transmit({
      text: text,
      source: source,
      speakerId: resolvedSpeaker,
      priority: true,
      channel: 'RÉÉCOUTE RADIO'
    });

    if (window.game && typeof window.game.showToast === 'function') {
      window.game.showToast('Radio Tactique', `Réécoute du message [${source}] 🎙️`, 'blue');
    }
  },

  // =========================================================================
  // 5. SCÉNARIOS VOCAUX PRÉ-INTÉGRÉS (POINTS SITUATION, BRIEFINGS, ASTREINTE)
  // =========================================================================

  /**
   * 1. Points de situation préfectoraux & alertes institutionnelles
   */
  transmitCrisisLog(entry, crisis) {
    if (!entry || !entry.text) return;
    
    // Déterminer la source et le rôle
    const source = entry.source || 'PC Régulation';
    const isPriority = entry.type === 'alert' || entry.type === 'ordre';

    this.transmit({
      text: entry.text,
      source: source,
      priority: isPriority,
      channel: `CANAL ${crisis?.niveau_alerte || 'ORSEC'}`
    });
  },

  /**
   * 2. Briefings d'ordres d'opération (Départ des vecteurs, consignes de sécurité, relève)
   */
  speakOperationalOrder(subMission, vehicleNames, volunteersCount) {
    const text = `Ordre d'opération validé. Départ du dispositif pour ${subMission.titre}. Effectif engagé : ${volunteersCount} secouristes avec les moyens ${vehicleNames}. Port des équipements de protection obligatoire et passage en veille sur le canal tactique.`;
    this.transmit({
      text: text,
      source: 'Chef de Dispositif Protec',
      role: 'Commandement',
      speakerId: this.INSTITUTIONAL_SPEAKERS['cos'],
      priority: true,
      channel: 'ORDRE OPÉRATION'
    });
  },

  /**
   * Annonce de trajet individuel d'un bénévole en transit
   */
  speakVolunteerTransit(vol, travelMinutes) {
    if (!vol) return;
    const replies = [
      `Bien reçu l'ordre d'antenne, je prends la route vers le local. Comptez environ ${travelMinutes} minutes de trajet.`,
      `Message reçu ! Je suis en route, j'arrive à la base dans ${travelMinutes} minutes.`,
      `C'est noté pour le rassemblement à l'antenne, arrivée estimée dans ${travelMinutes} minutes.`
    ];
    const text = replies[Math.abs(vol.id ? vol.id.charCodeAt(0) : 0) % replies.length];

    this.transmit({
      text: text,
      source: `${vol.name || 'Bénévole'} (${vol.rank || 'PSE2'})`,
      role: 'Secouriste',
      volunteer: vol,
      channel: 'LIAISON D’ASTREINTE'
    });
  },

  /**
   * 3. Simulation des appels individuels d'astreinte lors de la mobilisation
   * Comprend des confirmations de disponibilité avec temps de trajet et des refus motivés réalistes
   */
  simulateMobilisationCalls(game, crisis, mode, deltaMax, availableVolunteers, countAdded) {
    if (!availableVolunteers || availableVolunteers.length === 0) return;

    // A. Échantillonner 1 ou 2 confirmations de disponibilité
    const confirmedVols = availableVolunteers.slice(0, Math.min(2, countAdded));
    confirmedVols.forEach((vol, idx) => {
      const travelTime = vol.temps_trajet_base_minutes || vol.travelTimeToStationMin || 15;
      const firstName = (vol.name || '').split(' ')[0] || 'Ici le secouriste';
      
      const confirmPhrases = [
        `Ici ${firstName}, bien reçu le message d'alerte ! Je prends mon sac d'intervention et je serai au local d'ici ${travelTime} minutes.`,
        `Bonjour, ${firstName} à l'appareil. Je confirme ma disponibilité pour le plan de crise. Arrivée à l'antenne dans ${travelTime} minutes.`,
        `Bien reçu la convocation, je suis disponible immédiatement. Je rejoins le local d'ici ${travelTime} minutes pour l'armement.`
      ];
      const text = confirmPhrases[(idx + (vol.id ? vol.id.charCodeAt(0) : 0)) % confirmPhrases.length];

      this.transmit({
        text: text,
        source: `${vol.name} (${vol.rank || 'PSE2'})`,
        role: 'Astreinte Opérationnelle',
        volunteer: vol,
        channel: 'APPEL ASTREINTE'
      });
    });

    // B. Échantillonner 1 refus motivé réaliste parmi les bénévoles non mobilisés ou en réserve
    const unmobilised = (game.volunteers || []).filter(v => !availableVolunteers.some(av => av.id === v.id));
    if (unmobilised.length > 0 && Math.random() > 0.3) {
      const refusedVol = unmobilised[Math.floor(Math.random() * unmobilised.length)];
      const firstName = (refusedVol.name || '').split(' ')[0] || 'Le bénévole';
      const refusalPhrases = [
        `Bonjour le PC, ici ${firstName}. Désolé, je suis retenu professionnellement au travail et impossible de me libérer pour ce départ. Bon courage à l'équipe.`,
        `Ici ${firstName}, désolé je suis actuellement hors département pour raisons familiales, indisponible pour cette crise.`,
        `Bien reçu l'alerte mais indisponible actuellement, je suis en garde d'enfants à domicile. Prenez soin de vous.`
      ];
      const text = refusalPhrases[Math.floor(Math.random() * refusalPhrases.length)];

      this.transmit({
        text: text,
        source: `${refusedVol.name} (Indisponible)`,
        role: 'Réponse Astreinte',
        volunteer: refusedVol,
        channel: 'APPEL ASTREINTE'
      });
    }
  },

  // =========================================================================
  // 6. HUD FLOTTANT RADIO (TRANSMISSION EN DIRECT, SOUS-TITRES & CONTRÔLE)
  // =========================================================================

  injectRadioHud() {
    if (document.getElementById('crisis-radio-hud')) return;

    const hud = document.createElement('div');
    hud.id = 'crisis-radio-hud';
    hud.className = 'fixed bottom-4 right-4 z-[10000] max-w-sm sm:max-w-md w-[92%] sm:w-auto transition-all duration-300 transform translate-y-32 opacity-0 pointer-events-none';
    hud.innerHTML = `
      <div class="glass-panel p-3.5 rounded-2xl bg-slate-950/95 border-2 border-cyan-500/80 shadow-2xl backdrop-blur-xl text-white">
        <!-- En-tête HUD -->
        <div class="flex items-center justify-between gap-3 border-b border-cyan-500/30 pb-2 mb-2">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
            <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <span>● TX RADIO ACTIVE</span>
              <span id="crisis-radio-hud-channel" class="text-slate-400 font-mono text-[9px]">CANAL CRISE</span>
            </span>
            <span id="crisis-radio-hud-engine-badge" class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
              🎙️ Piper TTS
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <span id="crisis-radio-hud-queue-badge" class="hidden text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              +0 en attente
            </span>
            <button onclick="window.ProtecCrisisRadio.skip()" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 hover:text-white transition border border-slate-700" title="Passer ce message vocal">
              Passer ⏭️
            </button>
            <button onclick="window.ProtecCrisisRadio.toggle()" class="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700" title="Couper la radio">
              ✕
            </button>
          </div>
        </div>

        <!-- Corps de transmission -->
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-black flex-shrink-0 shadow-inner">
            <i data-lucide="radio" class="w-5 h-5 animate-pulse"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <h4 id="crisis-radio-hud-source" class="text-xs font-black text-cyan-200 truncate">
                PC Régulation
              </h4>
              <!-- Onde sonore animée (Equalizer) -->
              <div class="flex items-end gap-0.5 h-3">
                <span class="w-0.5 bg-cyan-400 rounded-full animate-bounce h-2" style="animation-delay: 0.1s"></span>
                <span class="w-0.5 bg-cyan-300 rounded-full animate-bounce h-3" style="animation-delay: 0.3s"></span>
                <span class="w-0.5 bg-cyan-400 rounded-full animate-bounce h-1.5" style="animation-delay: 0.2s"></span>
                <span class="w-0.5 bg-emerald-400 rounded-full animate-bounce h-2.5" style="animation-delay: 0.4s"></span>
              </div>
            </div>
            <p id="crisis-radio-hud-text" class="text-[11px] text-slate-300 leading-snug mt-1 italic font-medium max-h-16 overflow-y-auto pr-1">
              Transmission radio en cours...
            </p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(hud);
    if (window.lucide) window.lucide.createIcons();
  },

  updateHudState() {
    const hud = document.getElementById('crisis-radio-hud');
    if (!hud) return;

    if (!this.enabled || (!this.currentTransmission && this.queue.length === 0)) {
      hud.classList.add('translate-y-32', 'opacity-0', 'pointer-events-none');
      hud.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
      return;
    }

    // Afficher le HUD
    hud.classList.remove('translate-y-32', 'opacity-0', 'pointer-events-none');
    hud.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');

    const srcEl = document.getElementById('crisis-radio-hud-source');
    const textEl = document.getElementById('crisis-radio-hud-text');
    const chanEl = document.getElementById('crisis-radio-hud-channel');
    const queueEl = document.getElementById('crisis-radio-hud-queue-badge');
    const engineEl = document.getElementById('crisis-radio-hud-engine-badge');

    if (this.currentTransmission) {
      if (srcEl) srcEl.textContent = this.currentTransmission.source;
      if (textEl) textEl.textContent = `« ${this.currentTransmission.text} »`;
      if (chanEl) chanEl.textContent = this.currentTransmission.channel || 'CANAL CRISE';
      if (engineEl) {
        const spk = this.currentTransmission.speakerId !== undefined ? this.currentTransmission.speakerId : '?';
        if (this.activeEngine === 'piper') {
          engineEl.textContent = `🎙️ Piper TTS (#${spk})`;
          engineEl.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40';
        } else {
          engineEl.textContent = `⚠️ Fallback WebSpeech`;
          engineEl.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40';
        }
      }
    }

    if (queueEl) {
      if (this.queue.length > 0) {
        queueEl.textContent = `+${this.queue.length} en attente`;
        queueEl.classList.remove('hidden');
      } else {
        queueEl.classList.add('hidden');
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }
};

// Auto-démarrage dès chargement du script
window.ProtecCrisisRadio.init();