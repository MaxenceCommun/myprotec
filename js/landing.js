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
    stations: 54,
    volunteers: 1428,
    fleet: 312,
    dps: 84
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

  // Barème officiel des points selon le niveau de rareté
  rarityWeights: {
    historique: 5,
    epique: 3,
    rare: 2,
    commun: 1
  },

  // Données des vitrines d'antennes de secours classées par niveau de rareté cumulé
  antennesShowcases: [
    {
      id: 'showcase-1',
      name: 'Antenne Métropolitaine de Nancy',
      director: 'Directeur Thomas',
      department: 'Meurthe-et-Moselle (54)',
      badges: [
        { id: 'b1', code: 'renf_fondateur', name: 'Membre Fondateur', cat: 'renfort', rarity: 'historique', icon: 'crown', desc: 'Attribué aux directeurs membres fondateurs ayant ouvert leur premier centre de secours territorial.', imageUrl: 'images/badges/membre_fondateur.png' },
        { id: 'b2', code: 'renf_colonne_crue', name: 'Colonne Nationale Crues & Inondations', cat: 'renfort', rarity: 'historique', icon: 'droplets', desc: 'Distinction officielle suite aux opérations majeures de pompage lourd et d’évacuation de population.' },
        { id: 'b3', code: 'spec_pma', name: 'Poste Médical Avancé (PMA)', cat: 'specialite', rarity: 'epique', icon: 'plus-square', desc: 'Aptitude certifiée au déploiement rapide d’une chaîne médicale avancée de tri d’urgence.' },
        { id: 'b4', code: 'dept_54', name: 'Protection Civile 54 • Meurthe-et-Moselle', cat: 'departement', rarity: 'commun', icon: 'map-pin', desc: 'Insigne officiel des unités de secours et d’action citoyenne de Meurthe-et-Moselle.', imageUrl: 'images/badges/badge_meurthe_et_moselle_54.png' }
      ]
    },
    {
      id: 'showcase-2',
      name: 'Compagnie d’Intervention de Paris',
      director: 'Commandant Leroy',
      department: 'Paris (75)',
      badges: [
        { id: 'b5', code: 'miss_14_juillet', name: 'Dispositif Fête Nationale 14 Juillet', cat: 'mission', rarity: 'epique', icon: 'sparkles', desc: 'Délivré lors du commandement des dispositifs de grande ampleur lors des célébrations républicaines.' },
        { id: 'b6', code: 'renf_dps_ge', name: 'Grande Envergure • Renfort Inter-Antennes', cat: 'renfort', rarity: 'epique', icon: 'users', desc: 'Décerné lors de l’envoi d’équipages complets VPSP en détachement d’appui hors département.' },
        { id: 'b7', code: 'spec_aep', name: 'Soutien Psychologique d’Urgence (AEP)', cat: 'specialite', rarity: 'rare', icon: 'heart-pulse', desc: 'Cellule habilitée à la prise en charge immédiate du choc émotionnel post-catastrophe.' },
        { id: 'b8', code: 'dept_75', name: 'Protection Civile de Paris', cat: 'departement', rarity: 'rare', icon: 'landmark', desc: 'Écusson territorial des brigades de secours engagées au cœur de la capitale.' }
      ]
    },
    {
      id: 'showcase-3',
      name: 'Unité Littorale des Bouches-du-Rhône',
      director: 'Capitaine Marchand',
      department: 'Bouches-du-Rhône (13)',
      badges: [
        { id: 'b9', code: 'spec_aqua', name: 'Sauvetage Aquatique & Inondations', cat: 'specialite', rarity: 'rare', icon: 'waves', desc: 'Reconnaissance des équipages spécialisés en secours aquatique, fleuves et zones inondables.' },
        { id: 'b10', code: 'spec_cyno', name: 'Unité Cynotechnique de Recherche', cat: 'specialite', rarity: 'rare', icon: 'paw-print', desc: 'Équipes de recherche de personnes égarées et victimes de décombres en zone difficile.' },
        { id: 'b11', code: 'miss_marathon', name: 'Grands Événements Sportifs Nationaux', cat: 'mission', rarity: 'commun', icon: 'trophy', desc: 'Sécurisation et chaîne médicale continue sur marathons et courses d’endurance.' },
        { id: 'b12', code: 'dept_13', name: 'Protection Civile 13 • Méditerranée', cat: 'departement', rarity: 'rare', icon: 'flame', desc: 'Insigne des équipages engagés sur le littoral provençal et en veille de massifs forestiers.' }
      ]
    },
    {
      id: 'showcase-4',
      name: 'Délégation Territoriale de Gironde',
      director: 'Lieutenant Moreau',
      department: 'Gironde (33)',
      badges: [
        { id: 'b13', code: 'spec_formateur', name: 'Corps National des Formateurs', cat: 'specialite', rarity: 'rare', icon: 'graduation-cap', desc: 'Distinction des antennes disposant de formateurs certifiés (PICF / PAE).' },
        { id: 'b14', code: 'miss_festival', name: 'Sécurité Festivals & Musique', cat: 'mission', rarity: 'rare', icon: 'music', desc: 'Encadrement préventif et secours d’urgence sur événements musicaux.' },
        { id: 'b15', code: 'dept_33', name: 'Protection Civile de Gironde', cat: 'departement', rarity: 'commun', icon: 'map-pin', desc: 'Distinction territoriale des secouristes du littoral aquitain.' }
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
    this.syncLeaderboardWithDatabase().then(() => {
      this.renderShowcaseGrid('all');
    });
    this.init3DTilt();
    this.initTooltip();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  // Décision de visibilité : Sur la page index.html, la landing page reste TOUJOURS visible
  checkLandingVisibility() {
    const landingEl = document.getElementById('myprotec-landing-page');
    if (!landingEl) return;

    // Ne jamais masquer le contenu sur la landing page
    landingEl.classList.remove('is-hidden');
    landingEl.scrollTop = 0;
  },

  // Ouvrir le simulateur opérationnel en direct
  enterGame() {
    window.location.href = 'jeu.html';
  },

  // Réafficher la landing page (ex: depuis le profil ou déconnexion)
  showLanding() {
    const landingEl = document.getElementById('myprotec-landing-page');
    if (landingEl) {
      landingEl.classList.remove('is-hidden');
      landingEl.scrollTop = 0;
    }
  },

  // Déclencher la modal d'authentification dans le mode souhaité ("Ouvrir mon antenne" ou "Se connecter")
  openAuth(mode = 'login') {
    if (window.ProtecAuth) {
      window.ProtecAuth.openAuthModal(false);
      window.ProtecAuth.renderModalContent(mode, false);
      if (window.lucide) window.lucide.createIcons();
    }
  },

  // 1. TÉLÉMÉTRIE EN DIRECT RÉELLE (DONNÉES DU RÉSEAU SUPABASE)
  async initDynamicCounters() {
    const elStations = document.getElementById('lp-stat-stations');
    const elVols = document.getElementById('lp-stat-volunteers');
    const elFleet = document.getElementById('lp-stat-fleet');
    const elDps = document.getElementById('lp-stat-dps');

    const updateStatsFromData = (stats) => {
      if (!stats) return;
      this.telemetry.stations = stats.stations || this.telemetry.stations || 54;
      this.telemetry.volunteers = stats.volunteers || this.telemetry.volunteers || 1428;
      this.telemetry.fleet = stats.fleet || this.telemetry.fleet || 312;
      this.telemetry.dps = stats.dps || this.telemetry.dps || 84;

      if (elStations) elStations.textContent = this.telemetry.stations.toLocaleString('fr-FR');
      if (elVols) elVols.textContent = this.telemetry.volunteers.toLocaleString('fr-FR');
      if (elFleet) elFleet.textContent = this.telemetry.fleet.toLocaleString('fr-FR');
      if (elDps) elDps.textContent = this.telemetry.dps.toLocaleString('fr-FR');
    };

    // Rendu initial immédiat avec les données de base
    updateStatsFromData(this.telemetry);

    const fetchRealData = async () => {
      if (window.ProtecSupabase && typeof window.ProtecSupabase.getOperationalTelemetry === 'function') {
        try {
          const stats = await window.ProtecSupabase.getOperationalTelemetry();
          updateStatsFromData(stats);
        } catch (e) {
          console.warn('Erreur télémétrie réelle:', e);
        }
      }
    };

    // Chargement immédiat des statistiques réelles depuis Supabase
    await fetchRealData();

    // Actualisation périodique de fond toutes les 12 secondes
    if (this.counterTimer) clearInterval(this.counterTimer);
    this.counterTimer = setInterval(fetchRealData, 12000);
  },

  // 2. CONSOLE DE TÉLÉSCRIPTEUR (MAIN COURANTE DES OPÉRATIONS 100% RÉELLE)
  async initLiveTicker() {
    const feed = document.getElementById('lp-ticker-feed');
    if (!feed) return;

    // Rendu d'une ligne de main courante réelle
    const renderRow = (item, prepend = true) => {
      if (!item) return;
      const row = document.createElement('div');
      row.className = 'lp-ticker-item p-3 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex items-start gap-3 text-xs mb-2.5 transition animate-fade-in';
      row.innerHTML = `
        <span class="font-mono text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg flex-shrink-0 mt-0.5">
          ${item.time || new Date().toLocaleTimeString('fr-FR')}
        </span>
        <div class="w-6 h-6 rounded-lg ${item.bg || 'bg-blue-50'} ${item.color || 'text-blue-600'} border ${item.border || 'border-blue-200'} flex items-center justify-center flex-shrink-0 mt-0.5">
          <i data-lucide="${item.icon || 'radio'}" class="w-3.5 h-3.5"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-slate-700 leading-snug font-medium break-words">
            ${item.text || ''}
          </p>
        </div>
      `;

      if (prepend) {
        // Retirer les éventuels messages d'attente initiaux si un vrai log arrive
        const emptyNotice = feed.querySelector('.lp-ticker-empty');
        if (emptyNotice) feed.removeChild(emptyNotice);

        feed.insertBefore(row, feed.firstChild);
      } else {
        feed.appendChild(row);
      }

      if (window.lucide) window.lucide.createIcons();

      // Conserver un maximum de 18 lignes visibles
      while (feed.children.length > 18) {
        feed.removeChild(feed.lastChild);
      }
    };

    feed.innerHTML = '';

    // Chargement initial des vrais événements opérationnels enregistrés
    if (window.ProtecSupabase && typeof window.ProtecSupabase.getOperationalLogs === 'function') {
      try {
        const logs = await window.ProtecSupabase.getOperationalLogs(15);
        if (logs && logs.length > 0) {
          logs.forEach(logItem => renderRow(logItem, false));
        } else {
          // Si aucune opération n'a encore été enregistrée dans la BDD (état vierge)
          const nowStr = new Date().toLocaleTimeString('fr-FR');
          feed.innerHTML = `
            <div class="lp-ticker-empty py-8 text-center text-xs text-slate-400 font-medium">
              Aucune transmission en cours.
            </div>
          `;
          if (window.lucide) window.lucide.createIcons();
        }
      } catch (err) {
        console.warn('Erreur chargement logs opérationnels réels:', err);
      }
    }

    // Connexion au flux temps réel Supabase Realtime (< 50ms)
    if (window.ProtecSupabase && typeof window.ProtecSupabase.subscribeOperationalStream === 'function') {
      window.ProtecSupabase.subscribeOperationalStream(
        (updatedStats) => {
          if (updatedStats) {
            const elVols = document.getElementById('lp-stat-volunteers');
            const elDps = document.getElementById('lp-stat-dps');
            const elFleet = document.getElementById('lp-stat-fleet');
            const elPatients = document.getElementById('lp-stat-patients');
            if (elVols) elVols.textContent = (updatedStats.volunteers || 0).toLocaleString('fr-FR');
            if (elDps) elDps.textContent = (updatedStats.dps || 0).toLocaleString('fr-FR');
            if (elFleet) elFleet.textContent = (updatedStats.fleet || 0).toLocaleString('fr-FR');
            if (elPatients) elPatients.textContent = (updatedStats.patients || 0).toLocaleString('fr-FR');
          }
        },
        (newLogItem) => {
          renderRow(newLogItem, true);
        }
      );
    }
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

  // Calcul du score de collection selon la somme des niveaux de rareté
  calculateAntenneScore(badges) {
    if (!badges || !Array.isArray(badges)) return 0;
    return badges.reduce((sum, b) => {
      const r = b.rarity || b.rarete || 'commun';
      const weight = this.rarityWeights[r] || 1;
      return sum + weight;
    }, 0);
  },

  // Synchronisation avec la base Supabase et la partie locale si existante
  async syncLeaderboardWithDatabase() {
    try {
      // 1. Vérifier si une partie locale du joueur possède des écussons
      const localRaw = localStorage.getItem('protec_save') || localStorage.getItem('myprotec_save');
      if (localRaw) {
        const lSave = JSON.parse(localRaw);
        const lEcussons = lSave.localEcussons || lSave.ecussons || [];
        if (lEcussons.length > 0) {
          const stationName = lSave.stations?.[0]?.name || lSave.player?.stationName || 'Mon Antenne';
          const dept = lSave.stations?.[0]?.departmentCode || lSave.player?.departmentCode || '54';
          const city = lSave.stations?.[0]?.city || lSave.player?.city || 'Nancy';
          const playerName = lSave.player?.name || 'Directeur';

          // Transformer les écussons locaux
          const catalog = window.ProtecEcussons?.catalog || [];
          const badges = lEcussons.map(le => {
            const catItem = catalog.find(c => c.code === (le.code || le.id) || c.id === (le.id || le.code)) || {};
            let code = le.code || catItem.code;
            let name = catItem.nom || le.name || 'Écusson';
            let imgUrl = catItem.imageUrl || le.imageUrl;

            if (code === 'renf_fondateur' || name.includes('Pionnier')) {
              name = 'Membre Fondateur';
              imgUrl = 'images/badges/membre_fondateur.png';
            } else if (code === 'dept_54') {
              name = 'Protection Civile 54 • Meurthe-et-Moselle';
              imgUrl = 'images/badges/badge_meurthe_et_moselle_54.png';
            }

            return {
              id: le.id || le.code,
              code: code,
              name: name,
              cat: catItem.categorie || le.cat || 'specialite',
              rarity: catItem.rarete || le.rarity || 'commun',
              icon: catItem.icon || le.icon || 'shield',
              imageUrl: imgUrl,
              desc: catItem.description || ''
            };
          });

          // Ajouter ou mettre à jour la vitrine du joueur dans le classement
          const existingIdx = this.antennesShowcases.findIndex(a => a.id === 'player-station');
          const playerShowcase = {
            id: 'player-station',
            name: stationName,
            director: playerName,
            department: `${city} (${dept})`,
            badges: badges
          };

          if (existingIdx >= 0) {
            this.antennesShowcases[existingIdx] = playerShowcase;
          } else {
            this.antennesShowcases.push(playerShowcase);
          }
        }
      }

      // 2. Interroger Supabase si la table antenne_ecussons a des données
      if (window.ProtecSupabase && window.ProtecSupabase.client) {
        const { data: supaAntennes, error } = await window.ProtecSupabase.client
          .from('antenne_ecussons')
          .select('antenne_id, quantite, ecusson:ecussons(*)');

        if (!error && supaAntennes && supaAntennes.length > 0) {
          // Grouper par antenne_id
          const groups = {};
          supaAntennes.forEach(item => {
            if (!groups[item.antenne_id]) groups[item.antenne_id] = [];
            if (item.ecusson) {
              const code = item.ecusson.code;
              let name = item.ecusson.nom || 'Écusson';
              let imgUrl = item.ecusson.badge_url || item.ecusson.imageUrl;

              if (code === 'renf_fondateur' || (name && name.includes('Pionnier'))) {
                name = 'Membre Fondateur';
                imgUrl = 'images/badges/membre_fondateur.png';
              } else if (code === 'dept_54') {
                name = 'Protection Civile 54 • Meurthe-et-Moselle';
                imgUrl = 'images/badges/badge_meurthe_et_moselle_54.png';
              } else if (!imgUrl && window.ProtecEcussons?.FALLBACK_CATALOG) {
                const fb = window.ProtecEcussons.FALLBACK_CATALOG.find(f => f.code === code);
                if (fb && fb.imageUrl) imgUrl = fb.imageUrl;
              }

              groups[item.antenne_id].push({
                id: item.ecusson.id,
                code: code,
                name: name,
                cat: item.ecusson.categorie,
                rarity: item.ecusson.rarete,
                icon: item.ecusson.icon || 'shield',
                imageUrl: imgUrl,
                desc: item.ecusson.description
              });
            }
          });

          // Mettre à jour les données réelles
          const dynamicList = [];
          for (const [antId, bList] of Object.entries(groups)) {
            dynamicList.push({
              id: `supa-${antId}`,
              name: `Antenne Territoriale (${antId.slice(0, 8)})`,
              director: 'Direction d’Antenne',
              department: 'Réseau National FNPC',
              badges: bList
            });
          }

          if (dynamicList.length > 0) {
            this.antennesShowcases = dynamicList;
          }
        }
      }
    } catch (e) {
      console.warn('Erreur synchronisation classement écussons:', e);
    }
  },

  // 4. VITRINE DES ÉCUSSONS : CLASSEMENT STRICT PAR SOMME DES NIVEAUX DE RARETÉ
  renderShowcaseGrid(filter = 'all') {
    this.activeFilter = filter;
    const container = document.getElementById('lp-showcase-grid');
    if (!container) return;

    // 1. Calculer pour chaque antenne la somme exacte des niveaux de rareté
    const rankedAntennes = this.antennesShowcases.map(antenne => {
      const score = this.calculateAntenneScore(antenne.badges);
      return {
        ...antenne,
        rarityScore: score
      };
    });

    // 2. Classer les joueurs / antennes par ordre strictement décroissant du score de rareté
    rankedAntennes.sort((a, b) => b.rarityScore - a.rarityScore);

    // 3. Assigner les rangs officiels
    rankedAntennes.forEach((antenne, idx) => {
      antenne.rank = idx + 1;
    });

    // 4. Rendu des cartes de vitrine classées
    const htmlCards = rankedAntennes.map(antenne => {
      // Filtrer les badges par catégorie si demandé
      const displayBadges = antenne.badges.filter(b => {
        if (filter === 'all') return true;
        return b.cat === filter;
      });

      // Comptage précis par palier de rareté
      const histoCount = antenne.badges.filter(b => (b.rarity || b.rarete) === 'historique').length;
      const epiCount = antenne.badges.filter(b => (b.rarity || b.rarete) === 'epique').length;
      const rareCount = antenne.badges.filter(b => (b.rarity || b.rarete) === 'rare').length;
      const comCount = antenne.badges.filter(b => (b.rarity || b.rarete) === 'commun').length;

      // Badge de classement
      let rankBadgeHTML = '';
      if (antenne.rank === 1) {
        rankBadgeHTML = `
          <span class="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-sm">
            🥇 1er National
          </span>
        `;
      } else if (antenne.rank === 2) {
        rankBadgeHTML = `
          <span class="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-200 text-slate-800 flex items-center gap-1.5 shadow-2xs">
            🥈 2ème
          </span>
        `;
      } else if (antenne.rank === 3) {
        rankBadgeHTML = `
          <span class="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-700/15 text-amber-900 border border-amber-600/30 flex items-center gap-1.5">
            🥉 3ème
          </span>
        `;
      } else {
        rankBadgeHTML = `
          <span class="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-600 border border-slate-200/80">
            Rang #${antenne.rank}
          </span>
        `;
      }

      return `
        <div class="showcase-grid-card">
          <div class="showcase-inner-card p-6 flex flex-col justify-between h-full bg-white/90 rounded-3xl border border-slate-200/80 shadow-md">
            
            <!-- En-tête : Rang officiel & Collection -->
            <div class="space-y-3 pb-4 border-b border-slate-200/70">
              <div class="flex items-center justify-between">
                ${rankBadgeHTML}
                <div class="text-right">
                  <div class="text-xs font-black text-slate-700">
                    <span class="text-sm font-black text-slate-900 mono-num">${antenne.badges.length}</span> écusson${antenne.badges.length > 1 ? 's' : ''}
                  </div>
                  <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Collection Officielle</span>
                </div>
              </div>

              <div>
                <h4 class="text-base font-black text-slate-900 tracking-tight leading-snug">
                  ${antenne.name}
                </h4>
                <div class="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                  <span>${antenne.director || 'Direction d’Antenne'}</span>
                  <span>•</span>
                  <span>${antenne.department}</span>
                </div>
              </div>
            </div>

            <!-- Grille des écussons de l'antenne -->
            <div class="grid grid-cols-2 gap-3 my-5">
              ${displayBadges.length > 0 ? displayBadges.map(badge => {
                const r = badge.rarity || badge.rarete || 'commun';
                const imgSrc = badge.imageUrl || (badge.badge_url && (badge.badge_url.includes('/') || badge.badge_url.includes('.')) ? badge.badge_url : null);
                return `
                  <div 
                    class="patch-badge-item group relative p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col items-center text-center cursor-pointer overflow-hidden transition hover:shadow-md"
                    onmouseenter="window.MyProtecLanding.showBadgeTooltip(event, '${badge.name}', '${badge.desc || ''}', '${r.toUpperCase()}')"
                    onmouseleave="window.MyProtecLanding.hideBadgeTooltip()"
                  >
                    <!-- Couche Foil Holographique -->
                    <div class="foil-shiny-layer ${
                      r === 'historique' ? 'foil-historique' :
                      (r === 'epique' ? 'foil-epique' :
                      (r === 'rare' ? 'foil-rare' : ''))
                    }"></div>

                    <!-- Visuel Écusson : Image PNG Réelle ou Icône vectorielle -->
                    ${imgSrc ? `
                      <div class="w-14 h-16 flex items-center justify-center mb-2 filter drop-shadow-md group-hover:scale-105 transition-transform">
                        <img src="${imgSrc}" alt="${badge.name}" class="w-full h-full object-contain pointer-events-none" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                        <div class="hidden w-11 h-11 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 items-center justify-center shadow-2xs">
                          <i data-lucide="shield" class="w-5 h-5"></i>
                        </div>
                      </div>
                    ` : `
                      <div class="w-11 h-11 rounded-xl ${
                        r === 'historique' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        (r === 'epique' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                        (r === 'rare' ? 'bg-cyan-50 text-cyan-600 border border-cyan-200' : 'bg-slate-100 text-slate-600 border border-slate-200'))
                      } flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                        <i data-lucide="${(badge.icon && !badge.icon.includes('/') && !badge.icon.includes('.')) ? badge.icon : 'shield'}" class="w-5 h-5"></i>
                      </div>
                    `}

                    <strong class="text-[11px] font-black text-slate-800 leading-tight block truncate max-w-full">
                      ${badge.name}
                    </strong>
                    
                    <span class="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide mt-1.5 ${
                      r === 'historique' ? 'bg-amber-100 text-amber-900' :
                      (r === 'epique' ? 'bg-purple-100 text-purple-900' :
                      (r === 'rare' ? 'bg-cyan-100 text-cyan-900' : 'bg-slate-100 text-slate-600'))
                    }">
                      ${r}
                    </span>
                  </div>
                `;
              }).join('') : `
                <div class="col-span-2 py-8 text-center text-xs text-slate-400 font-medium">
                  Aucun écusson dans cette catégorie.
                </div>
              `}
            </div>

            <!-- Pied de carte : Répartition des distinctions -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold">
              <span>${antenne.badges.length} écussons</span>
              <span class="text-slate-400 font-medium">
                ${histoCount > 0 ? `${histoCount} Hist. ` : ''}${epiCount > 0 ? `${epiCount} Épi. ` : ''}${rareCount > 0 ? `${rareCount} Rare ` : ''}${comCount > 0 ? `${comCount} Com.` : ''}
              </span>
            </div>

          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = htmlCards;

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
