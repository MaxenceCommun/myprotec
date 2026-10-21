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
  activeEngine: 'speechSynthesis', // 'speechSynthesis' ou 'piper'
  preferredEngine: 'speechSynthesis', // Défini par défaut sur SpeechSynthesis
  selectedVoiceName: null,
  selectedVoiceIndex: 0,
  frenchVoices: [],
  activeUtterance: null,
  selectedModel: 'mls',  // 'mls' (48 voix d'élite filtrées sans souffle), 'siwis' (studio pro), 'upmc' (homme/femme)

  // =========================================================================
  // 1. ATTRIBUTION DES VOIX NATURELLES & CLAIRES (SÉLECTION D'ÉLITE DU MODÈLE fr_FR-mls-medium)
  // =========================================================================
  
  // 48 voix françaises natives filtrées par audit pour leur diction fluide, naturelle et dynamique
  CLEAR_SPEAKERS: [
    70, 85, 91, 30, 75, 95, 46, 33, 28, 13, 50, 11, 36, 9, 21, 54, 41, 3, 88, 38,
    29, 45, 55, 39, 72, 37, 82, 67, 86, 78, 34, 0, 104, 122, 2, 60, 20, 17, 31, 56,
    123, 4, 26, 52, 57, 63, 64, 73
  ],

  // Voix fixes optimisées pour les autorités et partenaires régaliens
  INSTITUTIONAL_SPEAKERS: {
    // 🏛️ Voix d'Élite #3 : PC de Crise, Annonces Principales, Commandement & Régulation
    'pc_crise': 3,                // Voix #3 (Choisie pour sa clarté, son naturel et son timbre net)
    'pc_operationnel': 3,
    'centre_operationnel': 3,
    'commandement': 3,
    'pc_regulation': 3,
    'regulation': 3,
    'main_courante': 3,
    'sidpc': 3,                   // Service Interministériel de Défense et de Protection Civile
    'siras': 3,
    'cellule_crise': 3,
    'cod': 3,                     // Centre Opérationnel Départemental
    'prefecture': 3,              // Annonces et communiqués préfectoraux

    // 🏛️ Préfet (Autorité solennelle)
    'prefet': 70,                 // Voix posée, autoritaire et calme
    'cabinet_prefet': 70,
    
    // 🚑 Régulation Médicale & Secours Publics
    'samu': 30,                   // Régulateur médical SAMU / Centre 15 (Dynamique et nette)
    'medecin_regulateur': 30,
    'codis': 28,                  // Centre Opérationnel Départemental d'Incendie et de Secours (18/112)
    'sdis': 28,
    'cos': 78,                    // Commandant des Opérations de Secours sur site (Ferme et précis)
    'cump': 85,                   // Cellule d'Urgence Médico-Psychologique (Voix douce et posée)
    
    // 🏢 Collectivités & Partenaires Opérationnels
    'mairie': 88,                 // Permanence communale / Gestion du gymnase / CAI
    'police': 75,                 // Police Nationale / Gendarmerie (sécurisation)
    'gendarmerie': 75,
    'sncf': 38,                   // Permanence de crise ferroviaire
    
    // 🛡️ Cadres de permanence et coordination interne Protection Civile
    'cadre_astreinte': 52,        // Cadre de permanence départementale Protec
    'chef_dispositif': 78,        // Chef de dispositif associatif
    'officier_liaison': 52,       // Officier de liaison Protec auprès du préfet
    'coordinateur_cai': 88        // Responsable du Centre d'Accueil des Impliqués
  },

  /**
   * Calcule un identifiant de voix persistant et unique pour un bénévole
   * Garanti d'appartenir exclusivement au pool d'élite des voix françaises naturelles et claires.
   */
  getVolunteerSpeakerId(volunteer) {
    const pool = this.CLEAR_SPEAKERS;
    if (!volunteer) return pool[0];
    const rawKey = String(
      volunteer.id || 
      volunteer.matricule || 
      `${volunteer.firstName || ''}_${volunteer.lastName || ''}` || 
      volunteer.name || 
      'vol_def'
    );
    
    // Algorithme de hachage djb2 pour répartir équitablement sur les voix d'élite
    let hash = 5381;
    for (let i = 0; i < rawKey.length; i++) {
      hash = ((hash << 5) + hash) + rawKey.charCodeAt(i);
      hash |= 0;
    }
    
    const index = Math.abs(hash) % pool.length;
    return pool[index];
  },

  /**
   * Résout l'identifiant de voix selon la source, le rôle ou le bénévole
   */
  resolveSpeakerId(source, volunteer = null) {
    if (volunteer) {
      return this.getVolunteerSpeakerId(volunteer);
    }
    // Par défaut : Voix #3 (PC de crise & régulation principale)
    if (!source) return this.INSTITUTIONAL_SPEAKERS['pc_crise'];

    const s = String(source).toLowerCase();

    // 1. Voix d'Élite #3 : PC Crise, Centre Opérationnel, Main Courante, Cellule de Crise & SIDPC
    if (
      s.includes('pc') || 
      s.includes('crise') || 
      s.includes('centre opérationnel') || 
      s.includes('cellule') || 
      s.includes('sidpc') || 
      s.includes('cod') || 
      s.includes('main courante') || 
      s.includes('siras')
    ) {
      return this.INSTITUTIONAL_SPEAKERS['pc_crise']; // Voix #3
    }

    // 2. Partenaires de secours régaliens
    if (s.includes('préfet') || s.includes('prefet') || s.includes('cabinet')) return this.INSTITUTIONAL_SPEAKERS['prefet'];
    if (s.includes('samu') || s.includes('15') || s.includes('médical')) return this.INSTITUTIONAL_SPEAKERS['samu'];
    if (s.includes('codis') || s.includes('sdis') || s.includes('pompier') || s.includes('18')) return this.INSTITUTIONAL_SPEAKERS['codis'];
    if (s.includes('cos') || s.includes('commandement terrain') || s.includes('chef de dispositif')) return this.INSTITUTIONAL_SPEAKERS['cos'];
    if (s.includes('cadre') || s.includes('astreinte')) return this.INSTITUTIONAL_SPEAKERS['cadre_astreinte'];
    if (s.includes('cump') || s.includes('psy')) return this.INSTITUTIONAL_SPEAKERS['cump'];
    if (s.includes('mairie') || s.includes('communal') || s.includes('cai')) return this.INSTITUTIONAL_SPEAKERS['mairie'];
    if (s.includes('sncf') || s.includes('gare')) return this.INSTITUTIONAL_SPEAKERS['sncf'];
    if (s.includes('police') || s.includes('gendarmerie')) return this.INSTITUTIONAL_SPEAKERS['police'];

    // 3. Repli général par défaut : Voix #3 (la préférée)
    return this.INSTITUTIONAL_SPEAKERS['pc_crise'];
  },

  // =========================================================================
  // 2. INITIALISATION ET GESTION DU TOGGLE FACULTATIF
  // =========================================================================

  init() {
    try {
      const stored = localStorage.getItem('protec_crisis_radio_enabled');
      // Activé par défaut si non spécifié
      this.enabled = stored !== null ? stored === 'true' : true;
      const storedModel = localStorage.getItem('protec_crisis_voice_model');
      if (storedModel) this.selectedModel = storedModel;
      const storedEngine = localStorage.getItem('protec_tts_engine');
      if (storedEngine) this.preferredEngine = storedEngine;
      const storedVoice = localStorage.getItem('protec_speech_voice_name');
      if (storedVoice) this.selectedVoiceName = storedVoice;
    } catch (e) {
      this.enabled = true;
      this.preferredEngine = 'speechSynthesis';
    }

    // Préchargement du son start_radio.mp3
    try {
      this.startRadioAudio = new Audio('sons/start_radio.mp3');
      this.startRadioAudio.preload = 'auto';
      this.startRadioAudio.volume = 0.85;
    } catch (e) {}

    // Détection et écoute des voix SpeechSynthesis natives du système
    if ('speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
          this.updateHudState();
        };
      }
    }

    // Vérification asynchrone uniquement en local si Piper TTS est explicitement demandé
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

    if (this.preferredEngine === 'piper' && isLocalhost && !isHttps) {
      this.checkServerStatus();
    } else {
      // Mode standard SpeechSynthesis natif du navigateur (Web Speech API) sans aucune requête vers 8080
      this.activeEngine = 'speechSynthesis';
      this.serverStatus.checked = true;
      this.serverStatus.available = false;
    }

    // Montage du HUD radio flottant
    this.injectRadioHud();
  },

  /**
   * Charge et trie les voix françaises de SpeechSynthesis du système
   */
  loadVoices() {
    if (!('speechSynthesis' in window)) return [];
    try {
      const all = window.speechSynthesis.getVoices() || [];
      const fr = all.filter(v => v.lang && v.lang.toLowerCase().startsWith('fr'));
      
      // Trier pour mettre les voix de meilleure diction en premier
      fr.sort((a, b) => {
        const score = (v) => {
          const n = (v.name || '').toLowerCase();
          let s = 0;
          if (n.includes('natural')) s += 50;
          if (n.includes('online')) s += 30;
          if (n.includes('google')) s += 20;
          if (n.includes('denise') || n.includes('henri')) s += 15;
          if (n.includes('paul') || n.includes('julie') || n.includes('hortense')) s += 10;
          return s;
        };
        return score(b) - score(a);
      });

      this.frenchVoices = fr;

      if (this.selectedVoiceName && fr.length > 0) {
        const foundIdx = fr.findIndex(v => v.name === this.selectedVoiceName);
        if (foundIdx !== -1) {
          this.selectedVoiceIndex = foundIdx;
        }
      }
    } catch (e) {
      console.warn('Erreur détection voix SpeechSynthesis:', e);
    }
    return this.frenchVoices;
  },

  getFrenchVoices() {
    if (!this.frenchVoices || this.frenchVoices.length === 0) {
      return this.loadVoices();
    }
    return this.frenchVoices;
  },

  /**
   * Détecte intelligemment l'URL du serveur Piper TTS :
   * Fonctionne que le jeu soit ouvert sur http://localhost:8080, http://localhost:5500 (Live Server),
   * http://127.0.0.1:3000, ou tout autre port local de dev.
   */
  async resolveApiBaseUrl() {
    if (this.apiBaseUrl !== null) return this.apiBaseUrl;

    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

    // En environnement Web / HTTPS (ex: https://myprotec.fr) ou si SpeechSynthesis est le moteur actif :
    // Utilisation directe de SpeechSynthesis SANS aucune requête réseau vers localhost:8080
    if (this.preferredEngine === 'speechSynthesis' || !isLocalhost || isHttps) {
      this.apiBaseUrl = '';
      this.serverStatus.checked = true;
      this.serverStatus.available = false;
      this.activeEngine = 'speechSynthesis';
      return this.apiBaseUrl;
    }

    // Seulement en développement local HTTP sur machine dédiée si server.js est lancé :
    const candidates = [
      '',
      'http://localhost:8080',
      'http://127.0.0.1:8080'
    ];

    for (const base of candidates) {
      try {
        const testUrl = `${base}/api/crisis/tts/status`;
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 800);
        const res = await fetch(testUrl, { signal: controller.signal }).catch(() => null);
        clearTimeout(tid);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
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
            console.log(`🎙️ [Piper TTS] Moteur connecté (${base || 'local'}).`);
            return this.apiBaseUrl;
          }
        }
      } catch (err) {}
    }

    this.apiBaseUrl = '';
    this.serverStatus.checked = true;
    this.serverStatus.available = false;
    this.activeEngine = 'speechSynthesis';
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
   * Filtre radio tactique clair et haute intelligibilité :
   * Conserve la chaleur des voix humaines (dès 220 Hz) et la netteté des consonnes (jusqu'à 4500 Hz)
   * sans aucune distorsion destructive.
   */
  connectRadioFx(ctx, sourceNode, destNode) {
    // 1. Coupe-bas doux à 220 Hz pour éliminer les grondements sans étouffer la voix
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 220;
    highpass.Q.value = 0.7;

    // 2. Coupe-haut doux à 4500 Hz pour préserver les consonnes et la clarté
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 4500;
    lowpass.Q.value = 0.8;

    // 3. Légère présence vocale radio à 2400 Hz (+1.5 dB)
    const peaking = ctx.createBiquadFilter();
    peaking.type = 'peaking';
    peaking.frequency.value = 2400;
    peaking.Q.value = 1.0;
    peaking.gain.value = 1.5;

    // 4. Gain final
    const gainNode = ctx.createGain();
    gainNode.gain.value = this.volume || 0.9;

    sourceNode.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(peaking);
    peaking.connect(gainNode);
    gainNode.connect(destNode);

    return { highpass, lowpass, peaking, gainNode };
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

  setVoiceModel(modelKey) {
    this.selectedModel = modelKey || 'mls';
    try {
      localStorage.setItem('protec_crisis_voice_model', this.selectedModel);
    } catch (e) {}
    this.updateHudState();
    if (window.game && typeof window.game.showToast === 'function') {
      const labels = {
        'mls': 'Multilocuteur Élite (48 voix pures sans souffle)',
        'siwis': 'Studio Siwis (Voix féminine cristalline)',
        'upmc': 'Studio UPMC (Voix radio Sorbonne)',
        'tom': 'Studio Tom (Voix masculine nette)'
      };
      window.game.showToast('Profil Vocal Piper', labels[this.selectedModel] || this.selectedModel, 'blue');
    }
  },

  cycleVoiceModel() {
    const frVoices = this.getFrenchVoices();

    // 1. Si nous sommes en mode SpeechSynthesis
    if (this.preferredEngine === 'speechSynthesis' || this.activeEngine === 'speechSynthesis') {
      if (frVoices.length > 1 && this.selectedVoiceIndex < frVoices.length - 1) {
        // Voix française suivante du système
        this.selectedVoiceIndex++;
        const nextVoice = frVoices[this.selectedVoiceIndex];
        this.selectedVoiceName = nextVoice.name;
        try { localStorage.setItem('protec_speech_voice_name', nextVoice.name); } catch (e) {}
        this.updateHudState();
        if (window.game && typeof window.game.showToast === 'function') {
          window.game.showToast('Voix SpeechSynthesis', `${nextVoice.name} (${this.selectedVoiceIndex + 1}/${frVoices.length}) 🔊`, 'cyan');
        }
        return;
      } else {
        // Fin des voix SpeechSynthesis -> Basculer sur le moteur Piper TTS si disponible
        this.preferredEngine = 'piper';
        try { localStorage.setItem('protec_tts_engine', 'piper'); } catch (e) {}
        this.activeEngine = 'piper';
        this.updateHudState();
        if (window.game && typeof window.game.showToast === 'function') {
          window.game.showToast('Moteur TTS', 'Bascule vers Piper TTS (Modèle local) 🎙️', 'blue');
        }
        return;
      }
    } else {
      // 2. Si nous étions sur Piper, revenir sur SpeechSynthesis première voix
      this.preferredEngine = 'speechSynthesis';
      this.selectedVoiceIndex = 0;
      if (frVoices.length > 0) {
        this.selectedVoiceName = frVoices[0].name;
        try { localStorage.setItem('protec_speech_voice_name', frVoices[0].name); } catch (e) {}
      }
      try { localStorage.setItem('protec_tts_engine', 'speechSynthesis'); } catch (e) {}
      this.activeEngine = 'speechSynthesis';
      this.updateHudState();
      const firstVoice = frVoices[0]?.name || 'Voix native';
      if (window.game && typeof window.game.showToast === 'function') {
        window.game.showToast('Moteur TTS', `Bascule vers SpeechSynthesis (${firstVoice}) 🔊`, 'cyan');
      }
    }
  },

  /**
   * Teste immédiatement la synthèse vocale avec la voix active
   */
  testSpeech(customText = null) {
    const text = customText || "PC de crise à toutes les unités, test de transmission radio sur le réseau tactique. Message 5 sur 5.";
    
    // Débloquer le contexte audio si nécessaire
    this.getAudioContext();

    if (!this.enabled) {
      this.enabled = true;
      try { localStorage.setItem('protec_crisis_radio_enabled', 'true'); } catch (e) {}
    }

    if (this.isProcessing) {
      this.skip();
    }

    const frVoices = this.getFrenchVoices();
    const curVoice = frVoices[this.selectedVoiceIndex]?.name || 'Voix par défaut';
    const isSpeech = (this.preferredEngine === 'speechSynthesis');
    const engineLabel = isSpeech ? `SpeechSynthesis [${curVoice}]` : `Piper TTS [${(this.selectedModel || 'mls').toUpperCase()}]`;

    if (window.game && typeof window.game.showToast === 'function') {
      window.game.showToast('Test Vocal Radio', `Écoute avec : ${engineLabel} 🎙️`, 'blue');
    }

    this.transmit({
      text: text,
      source: 'PC de Crise (Test)',
      role: 'Commandement',
      priority: true,
      channel: 'TEST TACTIQUE'
    });
  },

  /**
   * Synthétise et diffuse le message vocal :
   * Priorité à SpeechSynthesis (API native du navigateur) comme demandé par l'utilisateur,
   * avec possibilité de bascule vers Piper TTS.
   */
  async speakWithRadioEffect(tx) {
    const text = tx.cleanText;
    const speakerId = tx.speakerId;

    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

    // A. Synthèse vocale native SpeechSynthesis (Web Speech API) par défaut ou en environnement Web
    if (this.preferredEngine === 'speechSynthesis' || !isLocalhost || isHttps || !this.serverStatus?.available) {
      this.activeEngine = 'speechSynthesis';
      this.updateHudState();
      await this.speakViaWebSpeechRadio(text, speakerId, tx);
      return;
    }

    // B. Sinon appel API Piper TTS local officiel
    const model = this.selectedModel || 'mls';
    let playedViaServer = false;
    try {
      const base = await this.resolveApiBaseUrl();
      const url = `${base}/api/crisis/tts?speaker=${speakerId}&text=${encodeURIComponent(text)}&model=${model}`;
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
            console.log(`🎙️ [Radio de Crise] Diffusion via Piper TTS [${model.toUpperCase()}] : "${text.slice(0, 45)}..."`);
            await this.playDecodedAudioBuffer(audioBuffer);
            playedViaServer = true;
          }
        }
      }
    } catch (e) {
      playedViaServer = false;
    }

    if (playedViaServer) return;

    // Repli instantané sur SpeechSynthesis si échec serveur
    this.activeEngine = 'speechSynthesis';
    this.updateHudState();
    await this.speakViaWebSpeechRadio(text, speakerId, tx);
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
   * Synthèse vocale SpeechSynthesis native ultra-claire et sans bruit de souffle parasite
   */
  speakViaWebSpeechRadio(text, speakerId, tx = null) {
    return new Promise(resolve => {
      if (!('speechSynthesis' in window)) {
        console.warn('SpeechSynthesis non supporté sur ce navigateur.');
        setTimeout(resolve, 1200);
        return;
      }

      // Interrompre toute synthèse en cours
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';

      // Recherche et attribution de la voix française sélectionnée
      const frVoices = this.getFrenchVoices();
      let chosenVoice = null;
      if (frVoices.length > 0) {
        if (this.selectedVoiceName) {
          chosenVoice = frVoices.find(v => v.name === this.selectedVoiceName) || frVoices[0];
        } else if (this.selectedVoiceIndex >= 0 && this.selectedVoiceIndex < frVoices.length) {
          chosenVoice = frVoices[this.selectedVoiceIndex];
        } else {
          chosenVoice = frVoices[0];
        }
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      // Nuance subtile et réaliste sans distorsion robotique
      const pitchOffset = ((speakerId % 5) - 2) * 0.015;
      utterance.pitch = Math.max(0.95, Math.min(1.05, 1.0 + pitchOffset));
      utterance.rate = 1.02; // Débit posé et naturel
      utterance.volume = 1.0;

      // Note : AUCUN souffle blanc ni bruit d'aspiration artificiel pour une voix limpide et intelligible

      // Conserver une référence d'instance pour contrer le bug de Garbage Collection de Chrome
      this.activeUtterance = utterance;

      let isFinished = false;
      const finish = () => {
        if (!isFinished) {
          isFinished = true;
          this.activeUtterance = null;
          resolve();
        }
      };

      utterance.onend = finish;
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis utterance event error:', e);
        finish();
      };

      // Si le moteur était suspendu par le navigateur, reprendre
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);

      // Timeout de sécurité proportionnel à la longueur du texte
      const maxDuration = Math.max(3000, (text.length / 7) * 1000);
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
        <!-- En-tête HUD épuré et immersif -->
        <div class="flex items-center justify-between gap-3 border-b border-cyan-500/30 pb-2 mb-2">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400">TX RADIO</span>
            <span id="crisis-radio-hud-channel" class="text-slate-400 font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60">CANAL CRISE</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span id="crisis-radio-hud-queue-badge" class="hidden text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              +0 en attente
            </span>
            <button onclick="window.ProtecCrisisRadio.skip()" class="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-bold text-slate-300 hover:text-white transition border border-slate-700/80 cursor-pointer active:scale-95 flex items-center gap-1" title="Passer ce message vocal">
              <span>Passer</span>
              <span class="text-xs">⏭</span>
            </button>
            <button onclick="window.ProtecCrisisRadio.toggle()" class="w-6 h-6 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700/80 cursor-pointer active:scale-95" title="Fermer la radio">
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
        if (this.preferredEngine === 'speechSynthesis' || this.activeEngine === 'speechSynthesis') {
          const frVoices = this.getFrenchVoices();
          const curVoice = frVoices[this.selectedVoiceIndex];
          let vName = curVoice ? curVoice.name.replace(/Microsoft |Google |\(France\)|\(fr-FR\)/gi, '').trim() : 'Système';
          if (vName.length > 16) vName = vName.substring(0, 15) + '…';
          engineEl.textContent = `🔊 Speech: ${vName}`;
          engineEl.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition cursor-pointer active:scale-95 shadow-2xs';
          engineEl.title = `Moteur actif : SpeechSynthesis natif (${curVoice?.name || 'Voix par défaut'}). Cliquez pour changer de voix ou de moteur.`;
        } else {
          const spk = this.currentTransmission.speakerId !== undefined ? this.currentTransmission.speakerId : '?';
          const modelLabel = (this.selectedModel || 'mls').toUpperCase();
          engineEl.textContent = `🎙️ Piper [${modelLabel}] (#${spk})`;
          engineEl.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 transition cursor-pointer active:scale-95 shadow-2xs';
          engineEl.title = `Moteur actif : Piper TTS local. Cliquez pour basculer sur SpeechSynthesis.`;
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