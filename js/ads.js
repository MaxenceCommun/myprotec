// js/ads.js - Système de Mécénat Vidéo & Publicités Récompensées
window.ProtecAds = {
  maxAds: 5,
  rewardAmount: 500, // 500 € virtuels par visionnage
  cooldownPeriodMs: 2 * 60 * 60 * 1000, // 2 heures pour recharger le pack complet de 5 pubs (ou 24 min par pub)
  singleAdRegenMs: 24 * 60 * 1000, // 24 minutes par pub

  currentAdIndex: 0,
  isPlaying: false,
  timerInterval: null,
  currentRemainingSeconds: 15,

  // Liste de spots publicitaires immersifs et réalistes
  adSpots: [
    {
      sponsor: 'Gruau & Renault Tech',
      tag: 'Ambulances & Véhicules de Secours',
      title: 'Nouveau Master VPSP Sécurité Civile',
      description: 'Découvrez la cellule sanitaire grand volume avec suspension pneumatique optimisée et rampe de gyrophares LED ultra-lumineuse.',
      badge: 'Partenaire Mobilité',
      color: 'from-amber-600 to-orange-500',
      icon: 'ambulance',
      duration: 15
    },
    {
      sponsor: 'Draeger Médical France',
      tag: 'Dispositifs Médicaux & Réanimation',
      title: 'Défibrillateur DSA & Moniteur Multiparamétrique',
      description: 'Matériel certifié pour les postes de secours avancés (PMA) et les équipages de prompt secours de la Protection Civile.',
      badge: 'Mécène Santé',
      color: 'from-blue-600 to-cyan-500',
      icon: 'activity',
      duration: 15
    },
    {
      sponsor: 'Protection Civile - Campagne Nationale',
      tag: 'Appel aux Dons & Engagement',
      title: 'Aidez-nous à Aider : Engagez-vous !',
      description: 'Grâce au soutien des donateurs et mécènes, nos antennes locales s’équipent et forment plus de 100 000 secouristes par an.',
      badge: 'Sensibilisation Fédérale',
      color: 'from-pc-blue to-pc-orange',
      icon: 'heart-handshake',
      duration: 15
    },
    {
      sponsor: 'Decathlon Pro & BatiSecur',
      tag: 'Équipements de Protection Individuelle',
      title: 'Parkas Réfléchissantes & Bottes d’Intervention',
      description: 'Haute visibilité Classe 3 pour toutes les conditions météo, tempêtes et inondations.',
      badge: 'Équipementier',
      color: 'from-emerald-600 to-teal-500',
      icon: 'shield-alert',
      duration: 15
    },
    {
      sponsor: 'MAIF & Fondation Solidarité',
      tag: 'Assurance & Prévention des Risques',
      title: 'Soutien aux Associations Agrées de Sécurité Civile',
      description: 'Financement des actions solidaires, maraudes hivernales et plans communaux de sauvegarde.',
      badge: 'Partenaire Solidaire',
      color: 'from-purple-600 to-indigo-600',
      icon: 'award',
      duration: 15
    }
  ],

  init(game) {
    // Initialise l'état des pubs dans l'objet jeu
    if (!game.adRewards) {
      game.adRewards = {
        available: this.maxAds,
        lastRefill: Date.now(),
        totalWatched: 0
      };
    }

    this.checkRegen(game);

    // Mettre à jour l'affichage régulièrement (pour le compte à rebours)
    setInterval(() => {
      this.checkRegen(game);
      this.updateUI(game);
    }, 1000);

    this.updateUI(game);
  },

  checkRegen(game) {
    if (!game.adRewards) return;
    const now = Date.now();
    const elapsed = now - (game.adRewards.lastRefill || now);

    if (game.adRewards.available < this.maxAds) {
      const regeneratedCount = Math.floor(elapsed / this.singleAdRegenMs);
      if (regeneratedCount > 0) {
        game.adRewards.available = Math.min(this.maxAds, game.adRewards.available + regeneratedCount);
        game.adRewards.lastRefill = now - (elapsed % this.singleAdRegenMs);
        game.saveGame();
      }
    } else {
      game.adRewards.lastRefill = now;
    }
  },

  getTimeUntilNextAd(game) {
    if (!game.adRewards || game.adRewards.available >= this.maxAds) return null;
    const elapsed = Date.now() - (game.adRewards.lastRefill || Date.now());
    const remainingMs = Math.max(0, this.singleAdRegenMs - elapsed);
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  },

  updateUI(game) {
    const badgeCount = document.getElementById('ad-count-badge');
    const timerText = document.getElementById('ad-timer-text');
    const widgetBtn = document.getElementById('ad-reward-widget');

    if (!game.adRewards) return;

    if (badgeCount) {
      badgeCount.textContent = `${game.adRewards.available}/${this.maxAds}`;
      if (game.adRewards.available > 0) {
        badgeCount.className = 'text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md';
      } else {
        badgeCount.className = 'text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded-md';
      }
    }

    const badgeCountMobile = document.getElementById('ad-count-badge-mobile');
    if (badgeCountMobile) {
      badgeCountMobile.textContent = `${game.adRewards.available}/${this.maxAds}`;
      if (game.adRewards.available > 0) {
        badgeCountMobile.className = 'text-[9px] font-black bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded';
      } else {
        badgeCountMobile.className = 'text-[9px] font-black bg-slate-200 text-slate-600 px-1 py-0.2 rounded';
      }
    }

    if (timerText) {
      if (game.adRewards.available >= this.maxAds) {
        timerText.textContent = 'Prêt (+500 €)';
        timerText.className = 'text-xs font-black text-emerald-600 flex items-center gap-1';
      } else if (game.adRewards.available > 0) {
        timerText.textContent = `+500 € (${game.adRewards.available} dispo)`;
        timerText.className = 'text-xs font-black text-emerald-600 flex items-center gap-1';
      } else {
        const remaining = this.getTimeUntilNextAd(game);
        timerText.textContent = `Recharge : ${remaining}`;
        timerText.className = 'text-xs font-bold text-slate-500 mono-num flex items-center gap-1';
      }
    }

    if (widgetBtn) {
      if (game.adRewards.available > 0) {
        widgetBtn.classList.remove('opacity-60');
      } else {
        widgetBtn.classList.add('opacity-80');
      }
    }
  },

  openAdModal(game) {
    this.checkRegen(game);
    const modal = document.getElementById('ad-modal');
    if (!modal) return;

    if (game.adRewards.available <= 0) {
      const remaining = this.getTimeUntilNextAd(game);
      game.showToast('Limite atteinte', `Vous avez visionné vos 5 spots partenaires. Prochaine pub disponible dans ${remaining}.`, 'orange');
      return;
    }

    // Choisir le spot publicitaire
    const spot = this.adSpots[this.currentAdIndex % this.adSpots.length];
    this.currentAdIndex++;

    this.renderAdScreen(spot, game);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();

    // Démarrer la lecture du spot (15s)
    this.startAdPlayback(spot, game);
  },

  closeAdModal() {
    if (this.isPlaying) {
      // Si la pub est en cours, confirmer ou empêcher la triche
      if (!confirm('Voulez-vous interrompre le spot publicitaire ? La subvention de 500 € ne sera pas attribuée.')) {
        return;
      }
    }
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.isPlaying = false;
    const modal = document.getElementById('ad-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  renderAdScreen(spot, game) {
    const container = document.getElementById('ad-modal-body');
    if (!container) return;

    this.currentRemainingSeconds = spot.duration;

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Bannière Sponsor / Mécène -->
        <div class="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${spot.color} text-white shadow-lg">
          <div class="absolute -right-6 -bottom-6 opacity-20">
            <i data-lucide="tv" class="w-36 h-36"></i>
          </div>

          <div class="relative z-10 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                ${spot.badge}
              </span>
              <span id="ad-countdown-pill" class="text-xs font-mono font-black bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                00:${this.currentRemainingSeconds.toString().padStart(2, '0')}
              </span>
            </div>

            <div class="pt-2">
              <p class="text-xs uppercase font-extrabold tracking-wider text-white/80">${spot.sponsor}</p>
              <h3 class="text-lg font-black tracking-tight text-white mt-0.5">${spot.title}</h3>
              <p class="text-xs text-white/90 leading-relaxed mt-1">${spot.description}</p>
            </div>
          </div>
        </div>

        <!-- Simulation d'animation vidéo et barre de progression -->
        <div class="space-y-2">
          <div class="flex justify-between items-center text-xs">
            <span class="font-bold text-slate-700 flex items-center gap-1.5" id="ad-status-label">
              <span class="inline-block animate-spin">📺</span> Diffusion du spot en cours...
            </span>
            <span class="text-slate-500 font-mono font-bold" id="ad-progress-text">0%</span>
          </div>

          <div class="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner relative">
            <div id="ad-progress-bar" class="h-full bg-gradient-to-r from-pc-blue to-pc-orange transition-all duration-1000 ease-linear rounded-full w-0"></div>
          </div>
        </div>

        <!-- Notification de récompense -->
        <div class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
              💶
            </div>
            <div>
              <span class="text-xs font-extrabold text-slate-800 block">Subvention Mécénat Partenaire</span>
              <span class="text-[11px] text-slate-500 font-medium">Crédit immédiat sur la trésorerie de votre antenne</span>
            </div>
          </div>
          <span class="text-sm font-black text-emerald-600">+${this.rewardAmount} €</span>
        </div>

        <!-- Bouton d'action Réclamer (Désactivé au début, s'active à la fin) -->
        <div class="pt-1">
          <button id="ad-claim-reward-btn" disabled onclick="window.ProtecAds.claimReward(window.game)" class="w-full py-3.5 rounded-2xl text-xs font-black bg-slate-200 text-slate-400 cursor-not-allowed transition flex items-center justify-center gap-2">
            <i data-lucide="lock" class="w-4 h-4"></i>
            Regardez le spot pour débloquer la subvention (15s)
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  startAdPlayback(spot, game) {
    this.isPlaying = true;
    let secondsLeft = spot.duration;
    const totalDuration = spot.duration;

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      secondsLeft--;
      this.currentRemainingSeconds = Math.max(0, secondsLeft);

      const countdownPill = document.getElementById('ad-countdown-pill');
      const progressBar = document.getElementById('ad-progress-bar');
      const progressText = document.getElementById('ad-progress-text');
      const statusLabel = document.getElementById('ad-status-label');
      const claimBtn = document.getElementById('ad-claim-reward-btn');

      const percent = Math.min(100, Math.round(((totalDuration - secondsLeft) / totalDuration) * 100));

      if (countdownPill) {
        countdownPill.innerHTML = `<span class="w-2 h-2 rounded-full ${secondsLeft > 0 ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}"></span> 00:${this.currentRemainingSeconds.toString().padStart(2, '0')}`;
      }

      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressText) progressText.textContent = `${percent}%`;

      if (secondsLeft <= 0) {
        clearInterval(this.timerInterval);
        this.isPlaying = false;

        if (statusLabel) {
          statusLabel.innerHTML = '✅ <span class="text-emerald-600 font-extrabold">Spot validé avec succès !</span>';
        }

        if (claimBtn) {
          claimBtn.disabled = false;
          claimBtn.className = 'w-full py-3.5 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/25 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer animate-bounce';
          claimBtn.innerHTML = `<i data-lucide="gift" class="w-4 h-4"></i> Réclamer ma subvention de +${this.rewardAmount} €`;
          if (window.lucide) window.lucide.createIcons();
        }

        // Jouer un petit signal audio de fin
        if (game.playSound) {
          game.playSound('success');
        }
      }
    }, 1000);
  },

  claimReward(game) {
    if (this.isPlaying) return;

    if (game.adRewards.available <= 0) {
      game.showToast('Erreur', 'Aucune pub disponible actuellement.', 'orange');
      this.closeAdModal();
      return;
    }

    // Décrémente le stock disponible
    game.adRewards.available = Math.max(0, game.adRewards.available - 1);
    game.adRewards.totalWatched = (game.adRewards.totalWatched || 0) + 1;
    game.adRewards.lastRefill = Date.now();

    // Crédite l'argent virtuel
    game.resources.money += this.rewardAmount;

    // Toast de confirmation et mise à jour
    game.showToast('Subvention Mécénat Perçue !', `Votre antenne a perçu +${this.rewardAmount} € grâce au spot partenaire. (${game.adRewards.available}/${this.maxAds} restants)`, 'green');
    game.updateStatsUI();
    this.updateUI(game);

    // Sauvegarde en BDD
    game.saveGame();

    this.closeAdModal();
  }
};
