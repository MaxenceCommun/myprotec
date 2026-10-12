/**
 * MYPROTEC - MOTEUR INTERACTIF DE LA PAGE D'ACCUEIL (LANDING PAGE)
 * Gestion de la télémétrie en direct, téléscripteur opérationnel, accordéon des 6 pôles,
 * vitrine des écussons avec 3D Tilt dynamique, reflets holographiques Foil et sas d'authentification.
 */

window.MyProtecLanding = {
  isInitialized: false,
  tickerTimer: null,
  counterTimer: null,
  activeFilter: 'all',

  // Données de base de télémétrie opérationnelle
  telemetry: {
    volunteers: 1428,
    dps: 84,
    fleet: 312,
    patients: 12870
  },

  // Flux de dépêches pour le téléscripteur opérationnel
  tickerLogPreset: [
    { type: 'samu', icon: 'activity', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'Régulation SAMU 15 • VPSP Antenne Nancy engagé sur urgence à domicile (Détresse respiratoire).' },
    { type: 'dps', icon: 'shield-check', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'Dispositif DPS • Marathon Régional validé : 14 secouristes et 2 VPSP en place au km 21.' },
    { type: 'formation', icon: 'graduation-cap', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'Pôle Formation • 8 nouveaux équipiers certifiés PSE2 (Reconnaissance officielle SUAP).' },
    { type: 'logistique', icon: 'truck', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'Logistique Opérationnelle • Réarmement d’urgence : 6 bouteilles O2 rechargées & révision VPSP-02 conforme.' },
    { type: 'crise', icon: 'siren', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', text: 'Alerte Vigilance Crues • Pré-alerte COD Préfecture : Colonne motopompes en astreinte 30 min.' },
    { type: 'samu', icon: 'heart-pulse', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'Bilan Transmis • Équipage VPSP évacue victime stable vers le Centre Hospitalier Universitaire.' },
    { type: 'rh', icon: 'users', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', text: 'Astreinte Opérationnelle • 12 secouristes volontaires positionnés en renfort de nuit.' },
    { type: 'dps', icon: 'calendar', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'Convention Validée • Signature DPS Festival des Musiques Actuelles (3 500 spectateurs).' }
  ],

  // Données des vitrines d'antennes de joueurs pour le Mur des Traditions
  antennesShowcases: [
    {
      id: 'showcase-1',
      name: 'Antenne Métropolitaine de Nancy',
      department: 'Meurthe-et-Moselle (54)',
      rankTitle: 'Antenne Historique Fondatrice',
      prestigeLevel: 'historique', // Pour algorithme de tri en arrière-plan
      badges: [
        { id: 'b1', code: 'renf_fondateur', name: 'Pionnier FNPC • Fondation d’Antenne', cat: 'renfort', rarity: 'historique', icon: 'crown', copies: '12 exemplaires en service', desc: 'Attribué aux directeurs pionniers ayant ouvert leur premier centre de secours territorial.' },
        { id: 'b2', code: 'renf_colonne_crue', name: 'Colonne Nationale Crues & Inondations', cat: 'crise', rarity: 'historique', icon: 'droplets', copies: '28 exemplaires décernés', desc: 'Distinction officielle suite aux opérations majeures de pompage lourd et d’évacuation de population.' },
        { id: 'b3', code: 'spec_pma', name: 'Poste Médical Avancé (PMA)', cat: 'specialite', rarity: 'epique', icon: 'plus-square', copies: '64 exemplaires certifiés', desc: 'Aptitude certifiée au déploiement rapide d’une chaîne médicale avancée de tri d’urgence.' },
        { id: 'b4', code: 'dept_54', name: 'Territoire 54 • Meurthe-et-Moselle', cat: 'specialite', rarity: 'commun', icon: 'map-pin', copies: 'En dotation territoriale', desc: 'Insigne officiel des unités de secours et d’action citoyenne de Meurthe-et-Moselle.' }
      ]
    },
    {
      id: 'showcase-2',
      name: 'Compagnie d’Intervention de Paris',
      department: 'Paris (75)',
      rankTitle: 'Compagnie Opérationnelle d’Élite',
      prestigeLevel: 'epique',
      badges: [
        { id: 'b5', code: 'miss_14_juillet', name: 'Dispositif Fête Nationale 14 Juillet', cat: 'evenements', rarity: 'epique', icon: 'sparkles', copies: '45 exemplaires attribués', desc: 'Délivré lors du commandement des dispositifs de grande ampleur lors des célébrations républicaines.' },
        { id: 'b6', code: 'renf_dps_ge', name: 'Grande Envergure • Renfort Inter-Antennes', cat: 'evenements', rarity: 'epique', icon: 'users', copies: '82 exemplaires en circulation', desc: 'Décerné lors de l’envoi d’équipages complets VPSP en détachement d’appui hors département.' },
        { id: 'b7', code: 'spec_aep', name: 'Soutien Psychologique d’Urgence (AEP)', cat: 'specialite', rarity: 'rare', icon: 'heart-pulse', copies: '110 exemplaires homologués', desc: 'Cellule habilitée à la prise en charge immédiate du choc émotionnel post-catastrophe.' },
        { id: 'b8', code: 'dept_75', name: 'Protection Civile de Paris', cat: 'specialite', rarity: 'rare', icon: 'landmark', copies: 'Corps d’intervention capitale', desc: 'Écusson territorial des brigades de secours engagées au cœur de la capitale.' }
      ]
    },
    {
      id: 'showcase-3',
      name: 'Unité Littorale des Bouches-du-Rhône',
      department: 'Bouches-du-Rhône (13)',
      rankTitle: 'Unité Spécialisée Territoriale',
      prestigeLevel: 'rare',
      badges: [
        { id: 'b9', code: 'spec_aqua', name: 'Sauvetage Aquatique & Inondations', cat: 'crise', rarity: 'rare', icon: 'waves', copies: '95 unités dotées', desc: 'Reconnaissance des équipages spécialisés en secours aquatique, fleuves et zones inondables.' },
        { id: 'b10', code: 'spec_cyno', name: 'Unité Cynotechnique de Recherche', cat: 'specialite', rarity: 'rare', icon: 'paw-print', copies: '74 chiens brevetés', desc: 'Équipes de recherche de personnes égarées et victimes de décombres en zone difficile.' },
        { id: 'b11', code: 'miss_marathon', name: 'Grands Événements Sportifs Nationaux', cat: 'evenements', rarity: 'commun', icon: 'trophy', copies: 'Dotation d’expérience', desc: 'Sécurisation et chaîne médicale continue sur marathons et courses d’endurance.' },
        { id: 'b12', code: 'dept_13', name: 'Protection Civile 13 • Méditerranée', cat: 'specialite', rarity: 'rare', icon: 'flame', copies: 'Peloton feux et calanques', desc: 'Insigne des équipages engagés sur le littoral provençal et en veille de massifs forestiers.' }
      ]
    }
  ],

  // Initialisation au chargement de la page
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.checkLandingVisibility();
    this.initLiveTicker();
    this.initDynamicCounters();
    this.initAccordion();
    this.renderShowcaseGrid('all');
    this.init3DTilt();
    this.initTooltip();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  // Décision de visibilité : Afficher la landing page si non connecté
  checkLandingVisibility() {
    const landingEl = document.getElementById('myprotec-landing-page');
    if (!landingEl) return;

    const token = localStorage.getItem('protec_auth_token');
    const user = localStorage.getItem('protec_user');

    // Si le joueur n'est pas authentifié, la landing page est impérativement visible
    if (!token || !user) {
      landingEl.classList.remove('is-hidden');
      landingEl.scrollTop = 0;
    } else {
      // Si déjà connecté, on peut masquer ou laisser le choix
      landingEl.classList.add('is-hidden');
    }
  },

  // Ouvrir le simulateur opérationnel en direct
  enterGame() {
    const token = localStorage.getItem('protec_auth_token');
    const user = localStorage.getItem('protec_user');

    if (token && user) {
      // Déjà connecté : transition fluide vers le simulateur
      const landingEl = document.getElementById('myprotec-landing-page');
      if (landingEl) {
        landingEl.classList.add('is-hidden');
      }
      if (window.game && typeof window.game.renderStations === 'function') {
        window.game.renderStations();
      }
    } else {
      // Non connecté : ouvrir le sas d'authentification
      this.openAuth('login');
    }
  },

  // Réafficher la landing page (ex: depuis le profil ou déconnexion)
  showLanding() {
    const landingEl = document.getElementById('myprotec-landing-page');
    if (landingEl) {
      landingEl.classList.remove('is-hidden');
      landingEl.scrollTop = 0;
    }
  },

  // Déclencher la modal d'authentification dans le mode souhaité
  openAuth(mode = 'login') {
    if (window.ProtecAuth) {
      window.ProtecAuth.openAuthModal(false);
      window.ProtecAuth.renderModalContent(mode, false);
      if (window.lucide) window.lucide.createIcons();
    }
  },

  // 1. TÉLÉMÉTRIE EN DIRECT (COMPTEURS DYNAMIQUES)
  initDynamicCounters() {
    const updateStats = () => {
      // Légères variations réalistes
      this.telemetry.volunteers += Math.floor(Math.random() * 3) - 1;
      this.telemetry.dps += Math.random() < 0.3 ? (Math.random() < 0.5 ? 1 : -1) : 0;
      this.telemetry.fleet += Math.random() < 0.2 ? (Math.random() < 0.5 ? 1 : -1) : 0;
      this.telemetry.patients += Math.random() < 0.6 ? 1 : 0;

      const elVols = document.getElementById('lp-stat-volunteers');
      const elDps = document.getElementById('lp-stat-dps');
      const elFleet = document.getElementById('lp-stat-fleet');
      const elPatients = document.getElementById('lp-stat-patients');

      if (elVols) elVols.textContent = this.telemetry.volunteers.toLocaleString('fr-FR');
      if (elDps) elDps.textContent = this.telemetry.dps.toLocaleString('fr-FR');
      if (elFleet) elFleet.textContent = this.telemetry.fleet.toLocaleString('fr-FR');
      if (elPatients) elPatients.textContent = this.telemetry.patients.toLocaleString('fr-FR');
    };

    updateStats();
    if (this.counterTimer) clearInterval(this.counterTimer);
    this.counterTimer = setInterval(updateStats, 4500);
  },

  // 2. CONSOLE DE TÉLÉSCRIPTEUR (MAIN COURANTE EN DIRECT)
  initLiveTicker() {
    const feed = document.getElementById('lp-ticker-feed');
    if (!feed) return;

    const addTickerLine = () => {
      const now = new Date();
      const timeStr = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0')
      ].join(':');

      const item = this.tickerLogPreset[Math.floor(Math.random() * this.tickerLogPreset.length)];

      const row = document.createElement('div');
      row.className = 'lp-ticker-item p-3 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex items-start gap-3 text-xs mb-2.5 transition';
      row.innerHTML = `
        <span class="font-mono text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg flex-shrink-0 mt-0.5">
          ${timeStr}
        </span>
        <div class="w-6 h-6 rounded-lg ${item.bg} ${item.color} border ${item.border} flex items-center justify-center flex-shrink-0 mt-0.5">
          <i data-lucide="${item.icon}" class="w-3.5 h-3.5"></i>
        </div>
        <p class="text-slate-700 leading-snug flex-1 font-medium">
          ${item.text}
        </p>
      `;

      feed.insertBefore(row, feed.firstChild);

      if (window.lucide) window.lucide.createIcons();

      // Conserver un maximum de 12 lignes visibles
      while (feed.children.length > 12) {
        feed.removeChild(feed.lastChild);
      }
    };

    // Remplissage initial de 4 dépêches
    feed.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      addTickerLine();
    }

    if (this.tickerTimer) clearInterval(this.tickerTimer);
    this.tickerTimer = setInterval(addTickerLine, 3800);
  },

  // 3. ACCORDÉON DES 6 PÔLES D'ANTENNE
  initAccordion() {
    const items = document.querySelectorAll('.pole-accordion-item');
    if (!items || items.length === 0) return;

    items.forEach((item, index) => {
      // Sur mobile : clic pour déplier
      item.addEventListener('click', () => {
        items.forEach(el => {
          if (el !== item) el.classList.remove('is-expanded');
        });
        item.classList.toggle('is-expanded');
      });

      // Déplier le premier pôle par défaut
      if (index === 0) {
        item.classList.add('is-expanded');
      }
    });
  },

  // 4. MUR DES COLLECTIONS : TRI PAR PRESTIGE & RENDU DE LA VITRINE
  renderShowcaseGrid(filter = 'all') {
    this.activeFilter = filter;
    const container = document.getElementById('lp-showcase-grid');
    if (!container) return;

    // Classement par prestige en arrière-plan (historique > epique > rare > commun)
    // AUCUN SCORE NI CHIFFRE N'EST VISIBLE
    const prestigeWeight = { historique: 4, epique: 3, rare: 2, commun: 1 };
    const sorted = [...this.antennesShowcases].sort((a, b) => {
      const wA = prestigeWeight[a.prestigeLevel] || 0;
      const wB = prestigeWeight[b.prestigeLevel] || 0;
      return wB - wA;
    });

    // Filtre des écussons selon la catégorie
    const htmlCards = sorted.map(antenne => {
      const filteredBadges = antenne.badges.filter(b => {
        if (filter === 'all') return true;
        return b.cat === filter;
      });

      // Si aucun écusson ne correspond au filtre, afficher les écussons généraux
      const displayBadges = filteredBadges.length > 0 ? filteredBadges : antenne.badges;

      return `
        <div class="showcase-grid-card" data-tilt>
          <div class="showcase-inner-card p-6 flex flex-col justify-between h-full">
            
            <!-- En-tête de la vitrine d'antenne -->
            <div class="space-y-2 pb-4 border-b border-slate-200/60">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider ${
                  antenne.prestigeLevel === 'historique' ? 'bg-amber-100/90 text-amber-900 border border-amber-300' :
                  (antenne.prestigeLevel === 'epique' ? 'bg-purple-100/90 text-purple-900 border border-purple-300' :
                  'bg-blue-100/90 text-blue-900 border border-blue-200')
                }">
                  ${antenne.rankTitle}
                </span>
                <span class="text-xs font-semibold text-slate-400">
                  ${antenne.department}
                </span>
              </div>
              <h4 class="text-base font-black text-slate-900 tracking-tight">
                ${antenne.name}
              </h4>
            </div>

            <!-- Grille des écussons de tradition de l'antenne -->
            <div class="grid grid-cols-2 gap-3.5 my-6">
              ${displayBadges.map(badge => `
                <div 
                  class="patch-badge-item group relative p-4 rounded-2xl bg-white/95 border border-slate-200/90 shadow-sm flex flex-col items-center text-center cursor-pointer overflow-hidden"
                  onmouseenter="window.MyProtecLanding.showBadgeTooltip(event, '${badge.name}', '${badge.desc}', '${badge.copies}')"
                  onmouseleave="window.MyProtecLanding.hideBadgeTooltip()"
                >
                  <!-- Couche Foil Holographique dynamique pour patchs rares/historiques -->
                  <div class="foil-shiny-layer ${
                    badge.rarity === 'historique' ? 'foil-historique' :
                    (badge.rarity === 'epique' ? 'foil-epique' :
                    (badge.rarity === 'rare' ? 'foil-rare' : ''))
                  }"></div>

                  <!-- Visuel vectoriel épuré de l'écusson -->
                  <div class="w-12 h-12 rounded-2xl ${
                    badge.rarity === 'historique' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                    (badge.rarity === 'epique' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                    (badge.rarity === 'rare' ? 'bg-cyan-50 text-cyan-600 border border-cyan-200' : 'bg-slate-100 text-slate-600 border border-slate-200'))
                  } flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                    <i data-lucide="${badge.icon}" class="w-6 h-6"></i>
                  </div>

                  <strong class="text-xs font-black text-slate-800 leading-tight block truncate max-w-full">
                    ${badge.name}
                  </strong>
                  <span class="text-[10px] text-slate-400 font-medium mt-0.5">
                    ${badge.copies}
                  </span>
                </div>
              `).join('')}
            </div>

            <!-- Pied de carte épuré -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Collection officielle vérifiée</span>
              <span class="text-pc-blue font-bold flex items-center gap-1">
                <i data-lucide="shield" class="w-3.5 h-3.5"></i> Actif
              </span>
            </div>

          </div>
        </div>
      `;
    }).join('');

    // Carte finale incitative : vitrine vide avec contours lumineux
    const incentiveCardHTML = `
      <div class="showcase-grid-card">
        <div class="showcase-inner-card p-6 flex flex-col justify-between h-full bg-slate-50/70 border-dashed border-2 border-slate-300">
          
          <div class="space-y-2 pb-4 border-b border-slate-200/80">
            <span class="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-700">
              Votre Future Antenne
            </span>
            <h4 class="text-base font-black text-slate-800 tracking-tight">
              Emplacements disponibles
            </h4>
          </div>

          <!-- Silhouettes d'écussons vides à forger -->
          <div class="grid grid-cols-2 gap-3.5 my-6">
            ${[1, 2, 3, 4].map(idx => `
              <div class="p-4 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition py-6">
                <div class="w-10 h-10 rounded-xl bg-slate-200/70 text-slate-400 flex items-center justify-center mb-2">
                  <i data-lucide="plus" class="w-5 h-5"></i>
                </div>
                <span class="text-[10px] font-bold text-slate-400">Écusson à conquérir</span>
              </div>
            `).join('')}
          </div>

          <div class="pt-2 text-center">
            <button onclick="window.MyProtecLanding.openAuth('register')" class="w-full py-3 rounded-2xl bg-pc-orange hover:bg-pc-orange-hover text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
              Forgez vos propres traditions — Créer mon antenne
            </button>
          </div>

        </div>
      </div>
    `;

    container.innerHTML = htmlCards + incentiveCardHTML;

    // Actualiser le style des boutons de filtre
    const buttons = document.querySelectorAll('.lp-filter-btn');
    buttons.forEach(btn => {
      const f = btn.getAttribute('data-filter');
      if (f === filter) {
        btn.className = 'lp-filter-btn px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer bg-slate-900 text-white shadow-sm flex items-center gap-1.5';
      } else {
        btn.className = 'lp-filter-btn px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer bg-white/80 text-slate-600 hover:bg-white border border-slate-200 flex items-center gap-1.5';
      }
    });

    if (window.lucide) window.lucide.createIcons();
    this.init3DTilt();
  },

  // 5. EFFET 3D TILT DYNAMIQUE À LA SOURIS
  init3DTilt() {
    const cards = document.querySelectorAll('[data-tilt]');
    if (!cards || cards.length === 0) return;

    cards.forEach(card => {
      const inner = card.querySelector('.showcase-inner-card');
      if (!inner) return;

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -9; // Max 9 deg
        const rotateY = ((x - centerX) / centerX) * 9;

        inner.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(8px)`;
      });

      card.addEventListener('mouseleave', () => {
        inner.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px)';
      });
    });
  },

  // 6. GESTION DE L'INFOBULLE FLOTTANTE D'ÉCUSSON
  initTooltip() {
    if (document.getElementById('lp-ecusson-tooltip')) return;

    const tooltip = document.createElement('div');
    tooltip.id = 'lp-ecusson-tooltip';
    document.body.appendChild(tooltip);
  },

  showBadgeTooltip(e, name, desc, copies) {
    const tooltip = document.getElementById('lp-ecusson-tooltip');
    if (!tooltip) return;

    tooltip.innerHTML = `
      <div class="space-y-1.5 text-xs">
        <div class="flex items-center justify-between pb-1 border-b border-slate-700">
          <strong class="font-black text-white text-xs">${name}</strong>
          <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">Insigne Officiel</span>
        </div>
        <p class="text-[11px] text-slate-300 leading-relaxed font-normal">${desc}</p>
        <div class="text-[10px] text-amber-400 font-bold pt-1 flex items-center gap-1">
          <span>Rarete en jeu :</span>
          <span class="text-slate-300 font-medium">${copies}</span>
        </div>
      </div>
    `;

    const x = Math.min(window.innerWidth - 340, Math.max(10, e.clientX + 16));
    const y = Math.min(window.innerHeight - 150, Math.max(10, e.clientY - 20));

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.classList.add('is-visible');
  },

  hideBadgeTooltip() {
    const tooltip = document.getElementById('lp-ecusson-tooltip');
    if (tooltip) {
      tooltip.classList.remove('is-visible');
    }
  }
};

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  window.MyProtecLanding.init();
});
