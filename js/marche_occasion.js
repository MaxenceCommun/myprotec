/**
 * PROTEC LIVE - MARCHÉ DE L'OCCASION & BOURSE D'ÉCHANGE INTER-ANTENNES
 * 
 * Système complet de vente et revente de véhicules révisés, matériel opérationnel de secours
 * et mobilier de bâtiment entre directeurs d'antenne de la Protection Civile.
 * 
 * 1. Véhicules d'occasion (VPSP, VL, VTU, Vélos, Remorques, Bateaux...)
 * 2. Matériel & Aménagement (Lots A/B/C, Mannequins RCP, DAE, Radios, Mobilier de locaux)
 * 3. Mes Annonces en cours & Gestion des retraits
 * 4. Mises en vente depuis le garage ou l'inventaire avec calcul de décote
 * 5. Persistance BDD Supabase Cloud (table market_listings) & Transactions RPC atomiques
 */

window.ProtecMarcheOccasion = {
  activeTab: 'vehicules', // 'vehicules' | 'materiel' | 'mes_annonces'
  searchQuery: '',
  subFilterVehicle: 'all', // 'all', 'VPSP', 'VL', 'VTU', 'specialite'
  subFilterMaterial: 'all', // 'all', 'secours', 'formation', 'logistique', 'mobilier'
  sortOption: 'recent', // 'recent', 'price_asc', 'price_desc', 'km_asc'
  
  cachedListings: [],
  isLoading: false,
  hasFetched: false,
  lastFetchTime: 0,

  // Le marché de l'occasion est 100% entre joueurs (aucune annonce générée par le jeu / PNJ)
  INITIAL_MARKET_SEED: [],

  // Récupération des annonces depuis Supabase ou fallback local
  async fetchListings(force = false) {
    const now = Date.now();
    if (!force && this.hasFetched && (now - this.lastFetchTime < 10000)) {
      return this.cachedListings;
    }

    this.isLoading = true;
    try {
      let remoteListings = [];
      if (window.ProtecSupabase && window.ProtecSupabase.client) {
        remoteListings = await window.ProtecSupabase.fetchMarketListings('all', 'all');
      }

      // Filtrer les annonces pour garantir qu'aucun seed système résiduel ne subsiste
      const validRemote = (Array.isArray(remoteListings) ? remoteListings : []).filter(item => 
        !String(item.id).startsWith('seed-') && 
        !String(item.id).startsWith('mkt-init-') && 
        !String(item.seller_user_id).startsWith('fed-antenne-') &&
        !String(item.seller_user_id).startsWith('system-')
      );

      const localListings = this.loadLocalSeedStorage();
      const combined = [...validRemote];

      // Ajouter les annonces locales publiées par les joueurs si non déjà présentes
      localListings.forEach(item => {
        if (!combined.some(existing => existing.id === item.id)) {
          combined.push(item);
        }
      });

      this.cachedListings = combined;
      this.hasFetched = true;
      this.lastFetchTime = now;
    } catch (e) {
      console.warn('Erreur chargement annonces marché:', e);
      if (this.cachedListings.length === 0) {
        this.cachedListings = this.loadLocalSeedStorage();
      }
    } finally {
      this.isLoading = false;
    }

    return this.cachedListings;
  },

  // Gestion du cache local de stockage (annonces créées par les joueurs en mode hors-ligne)
  loadLocalSeedStorage() {
    try {
      const raw = localStorage.getItem('protec_market_local_listings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => 
            !String(item.id).startsWith('seed-') && 
            !String(item.id).startsWith('mkt-init-') && 
            !String(item.seller_user_id).startsWith('fed-antenne-') &&
            !String(item.seller_user_id).startsWith('system-')
          );
        }
      }
    } catch (e) {}
    return [];
  },

  saveLocalSeedStorage(list) {
    try {
      const cleanList = (Array.isArray(list) ? list : []).filter(item => 
        !String(item.id).startsWith('seed-') && 
        !String(item.id).startsWith('mkt-init-') && 
        !String(item.seller_user_id).startsWith('fed-antenne-') &&
        !String(item.seller_user_id).startsWith('system-')
      );
      localStorage.setItem('protec_market_local_listings', JSON.stringify(cleanList));
    } catch (e) {}
  },

  // Événement temps réel reçu depuis Supabase Realtime
  handleRealtimeEvent(payload, game) {
    console.log('⚡ Événement Marché de l’Occasion reçu:', payload);
    const eventType = payload.eventType || payload.type;
    
    // Notification si une de mes annonces a été achetée par un autre joueur
    const currentUserId = game?.player?.id || window.ProtecAuth?.currentUser?.id;
    if (eventType === 'UPDATE' && payload.new && payload.new.status === 'sold') {
      if (payload.new.seller_user_id === currentUserId) {
        const itemNom = payload.new.item_data?.name || 'Votre bien';
        const gain = Number(payload.new.price || 0);
        game.showToast('Vente Conclue ! 💶', `Votre annonce « ${itemNom} » a été achetée par ${payload.new.buyer_name || 'une antenne'} pour ${gain.toLocaleString('fr-FR')} €. Crédit versé en trésorerie.`, 'green');
        if (game.resources) {
          game.resources.money = (game.resources.money || 0) + gain;
          game.updateStatsUI();
        }
      }
    }

    // Rafraîchir les annonces si la modale est active
    this.fetchListings(true).then(() => {
      if (this.isModalOpen()) {
        this.renderBodyContent(game || window.game);
      }
    });
  },

  handleBroadcastEvent(payload, game) {
    this.fetchListings(true).then(() => {
      if (this.isModalOpen()) {
        this.renderBodyContent(game || window.game);
      }
    });
  },

  isModalOpen() {
    const modal = document.getElementById('main-modal');
    if (!modal || modal.classList.contains('hidden')) return false;
    const title = document.getElementById('modal-title');
    return title && title.textContent.includes('Occasion');
  },

  // =========================================================================
  // RENDU PRINCIPAL DE LA MODALE
  // =========================================================================
  async renderModal(game) {
    const modal = document.getElementById('main-modal');
    const titleEl = document.getElementById('modal-title');
    const subtitleEl = document.getElementById('modal-subtitle');
    const iconEl = document.getElementById('modal-icon');
    const bodyEl = document.getElementById('modal-body');

    if (modal) modal.classList.remove('hidden');
    if (titleEl) titleEl.textContent = 'Marché de l’Occasion entre Joueurs';
    if (subtitleEl) subtitleEl.textContent = 'Achat et vente directe de véhicules révisés et matériel entre directeurs d’antenne';
    if (iconEl) iconEl.setAttribute('data-lucide', 'tag');

    // Affichage temporaire de chargement
    bodyEl.innerHTML = `
      <div class="py-16 text-center space-y-3">
        <div class="w-10 h-10 border-4 border-pc-orange border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs font-bold text-slate-500">Connexion au marché de l'occasion entre joueurs...</p>
      </div>
    `;

    await this.fetchListings();
    this.renderBodyContent(game);

    if (window.lucide) window.lucide.createIcons();
  },

  // Rendu du corps dynamique de la modale
  renderBodyContent(game) {
    const bodyEl = document.getElementById('modal-body');
    if (!bodyEl) return;

    const currentUserId = game.player?.id || window.ProtecAuth?.currentUser?.id || 'usr_local';
    const money = Number(game.resources?.money || 0);

    const activeVehiclesCount = this.cachedListings.filter(l => l.category === 'vehicle' && l.status === 'active').length;
    const activeEquipmentCount = this.cachedListings.filter(l => l.category === 'equipment' && l.status === 'active').length;
    const myListingsCount = this.cachedListings.filter(l => l.seller_user_id === currentUserId && l.status === 'active').length;

    const tabBtnClass = (tab) => this.activeTab === tab
      ? 'px-4 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-pc-blue to-pc-blue-light text-white shadow-md transition cursor-pointer flex items-center gap-2'
      : 'px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer flex items-center gap-2';

    bodyEl.innerHTML = `
      <div class="space-y-4">
        
        <!-- BANDEAU SUPÉRIEUR RÉCAPITULATIF & TRÉSORERIE -->
        <div class="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-pc-blue text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-xl shadow-inner">
              🏷️
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-black tracking-wide text-white">Marché de l'Occasion entre Joueurs</h4>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Temps Réel Actif
                </span>
              <p class="text-xs text-slate-300">
                Trésorerie disponible : <strong class="text-emerald-400 font-mono text-sm">${money.toLocaleString('fr-FR')} €</strong> • Achetez et revendez directement entre antennes joueuses.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 self-stretch sm:self-auto">
            <button onclick="window.ProtecMarcheOccasion.openSellModal()" class="flex-1 sm:flex-initial px-4 py-2 rounded-2xl bg-gradient-to-r from-pc-orange to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              Vendre sur le Marché
            </button>
            <button onclick="window.ProtecMarcheOccasion.refreshListings(window.game)" class="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer" title="Rafraîchir les annonces">
              <i data-lucide="rotate-cw" class="w-4 h-4 ${this.isLoading ? 'animate-spin' : ''}"></i>
            </button>
          </div>
        </div>

        <!-- NAVIGATION PAR LES 3 ONGLETS PRINCIPAUX -->
        <div class="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
          <button onclick="window.ProtecMarcheOccasion.switchTab('vehicules', window.game)" class="${tabBtnClass('vehicules')}">
            <span>🚗 Véhicules d'Occasion</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono ${this.activeTab === 'vehicules' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'}">${activeVehiclesCount}</span>
          </button>
          <button onclick="window.ProtecMarcheOccasion.switchTab('materiel', window.game)" class="${tabBtnClass('materiel')}">
            <span>📦 Matériel & Mobilier</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono ${this.activeTab === 'materiel' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'}">${activeEquipmentCount}</span>
          </button>
          <button onclick="window.ProtecMarcheOccasion.switchTab('mes_annonces', window.game)" class="${tabBtnClass('mes_annonces')}">
            <span>🏷️ Mes Annonces en Vente</span>
            ${myListingsCount > 0 ? `
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-400 text-slate-950 font-black">${myListingsCount}</span>
            ` : ''}
          </button>
        </div>

        <!-- BARRE DE FILTRES ET RECHERCHE TEXTUELLE -->
        ${this.renderFiltersBar()}

        <!-- CONTENU DE L'ONGLET SÉLECTIONNÉ -->
        <div id="market-listings-container" class="min-h-[320px]">
          ${this.renderTabContent(game)}
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // Barre d'outils avec recherche, sous-filtres et sélecteur de tri
  renderFiltersBar() {
    if (this.activeTab === 'mes_annonces') return '';

    return `
      <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        
        <!-- Recherche instantanée -->
        <div class="relative flex-1">
          <input 
            type="text" 
            id="market-search-input"
            value="${this.searchQuery || ''}" 
            oninput="window.ProtecMarcheOccasion.setSearchQuery(this.value, window.game)"
            placeholder="${this.activeTab === 'vehicules' ? '🔍 Rechercher un véhicule (ex: VPSP, Master, Trafic, Duster, VTT...)' : '🔍 Rechercher un équipement (ex: Mannequin, DAE, Bureau, Lit, Outillage...)'}"
            class="w-full pl-3 pr-8 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pc-blue font-semibold"
          />
          ${this.searchQuery ? `
            <button onclick="window.ProtecMarcheOccasion.setSearchQuery('', window.game)" class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 font-bold">✕</button>
          ` : ''}
        </div>

        <!-- Sous-catégories selon l'onglet actif -->
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          ${this.activeTab === 'vehicules' ? `
            <button onclick="window.ProtecMarcheOccasion.setVehicleFilter('all', window.game)" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] ${this.subFilterVehicle === 'all' ? 'bg-pc-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">Tous</button>
            <button onclick="window.ProtecMarcheOccasion.setVehicleFilter('VPSP', window.game)" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] ${this.subFilterVehicle === 'VPSP' ? 'bg-pc-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">VPSP (Ambulances)</button>
            <button onclick="window.ProtecMarcheOccasion.setVehicleFilter('VTU', window.game)" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] ${this.subFilterVehicle === 'VTU' ? 'bg-pc-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">VTU (Logistique)</button>
            <button onclick="window.ProtecMarcheOccasion.setVehicleFilter('VL', window.game)" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] ${this.subFilterVehicle === 'VL' ? 'bg-pc-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">VL / 4x4</button>
            <button onclick="window.ProtecMarcheOccasion.setVehicleFilter('specialite', window.game)" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] ${this.subFilterVehicle === 'specialite' ? 'bg-pc-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">Vélos & Spécialités</button>
          ` : `
            <button onclick="window.ProtecMarcheOccasion.setMaterialFilter('all', window.game)" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] ${this.subFilterMaterial === 'all' ? 'bg-pc-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">Tout</button>
            <button onclick="window.ProtecMarcheOccasion.setMaterialFilter('secours', window.game)" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] ${this.subFilterMaterial === 'secours' ? 'bg-pc-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">Secours & Lots</button>
            <button onclick="window.ProtecMarcheOccasion.setMaterialFilter('formation', window.game)" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] ${this.subFilterMaterial === 'formation' ? 'bg-pc-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">Formation (Mannequins, DAE)</button>
            <button onclick="window.ProtecMarcheOccasion.setMaterialFilter('mobilier', window.game)" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] ${this.subFilterMaterial === 'mobilier' ? 'bg-pc-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">Mobilier & Bâtiment</button>
            <button onclick="window.ProtecMarcheOccasion.setMaterialFilter('logistique', window.game)" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] ${this.subFilterMaterial === 'logistique' ? 'bg-pc-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">Outillage & Éclairage</button>
          `}
        </div>

        <!-- Options de tri -->
        <div class="flex items-center gap-1.5">
          <span class="text-slate-400 font-bold text-[11px]">Trier :</span>
          <select 
            onchange="window.ProtecMarcheOccasion.setSortOption(this.value, window.game)"
            class="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="recent" ${this.sortOption === 'recent' ? 'selected' : ''}>Plus récents</option>
            <option value="price_asc" ${this.sortOption === 'price_asc' ? 'selected' : ''}>Prix croissant €</option>
            <option value="price_desc" ${this.sortOption === 'price_desc' ? 'selected' : ''}>Prix décroissant €</option>
            ${this.activeTab === 'vehicules' ? `
              <option value="km_asc" ${this.sortOption === 'km_asc' ? 'selected' : ''}>Kilométrage le plus faible</option>
            ` : ''}
          </select>
        </div>

      </div>
    `;
  },

  // Rendu selon l'onglet courant
  renderTabContent(game) {
    if (this.activeTab === 'vehicules') {
      return this.renderVehiclesList(game);
    } else if (this.activeTab === 'materiel') {
      return this.renderEquipmentList(game);
    } else {
      return this.renderMyListingsView(game);
    }
  },

  // 1. ONGLET 1 : LISTE DES VÉHICULES D'OCCASION
  renderVehiclesList(game) {
    const currentUserId = game.player?.id || window.ProtecAuth?.currentUser?.id || 'usr_local';
    let list = this.cachedListings.filter(l => l.category === 'vehicle' && l.status === 'active');

    // Filtre textuel
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(l => {
        const d = l.item_data || {};
        return (d.name || '').toLowerCase().includes(q) ||
               (d.model || '').toLowerCase().includes(q) ||
               (d.label || '').toLowerCase().includes(q) ||
               (l.seller_name || '').toLowerCase().includes(q) ||
               (l.seller_station_name || '').toLowerCase().includes(q) ||
               (l.item_type || '').toLowerCase().includes(q);
      });
    }

    // Sous-filtre type de véhicule
    if (this.subFilterVehicle !== 'all') {
      if (this.subFilterVehicle === 'specialite') {
        list = list.filter(l => !['VPSP', 'VTU', 'VL'].includes(l.item_type?.toUpperCase()));
      } else {
        list = list.filter(l => l.item_type?.toUpperCase() === this.subFilterVehicle);
      }
    }

    // Tri
    list = this.sortListings(list);

    if (list.length === 0) {
      return `
        <div class="py-16 text-center space-y-3 bg-white rounded-3xl border border-dashed border-slate-300 p-6">
          <span class="text-4xl block">🚗</span>
          <h5 class="text-sm font-black text-slate-800">Aucun véhicule disponible avec ces critères</h5>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">Toutes les offres ont été acquises ou aucun directeur n'a publié d'annonce correspondant à votre recherche. Vous pouvez mettre en vente un de vos véhicules ou revenir plus tard.</p>
          <button onclick="window.ProtecMarcheOccasion.openSellModal('vehicle')" class="px-4 py-2 rounded-xl bg-pc-blue text-white font-black text-xs shadow-sm hover:brightness-110 transition">
            + Publier un Véhicule en Vente
          </button>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        ${list.map(listing => this.renderVehicleCard(listing, game, currentUserId)).join('')}
      </div>
    `;
  },

  renderVehicleCard(listing, game, currentUserId) {
    const d = listing.item_data || {};
    const isMyListing = (listing.seller_user_id === currentUserId);
    const userMoney = Number(game.resources?.money || 0);
    const canAfford = userMoney >= listing.price;
    const newPriceRef = Number(d.newPriceRef || 28000);
    const discountPct = newPriceRef > 0 ? Math.round(((newPriceRef - listing.price) / newPriceRef) * 100) : 0;
    const mechanicalPct = Number(d.mechanical || 85);

    // Couleur de santé mécanique
    let healthColor = 'bg-emerald-500';
    if (mechanicalPct < 70) healthColor = 'bg-amber-500';
    if (mechanicalPct < 50) healthColor = 'bg-rose-500';

    return `
      <div class="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-pc-blue/40 transition flex flex-col justify-between gap-4">
        
        <div>
          <!-- En-tête de la carte : Image et Infos principales -->
          <div class="flex items-start gap-3.5">
            <div class="w-20 h-16 rounded-2xl bg-slate-100 border border-slate-200/80 p-1 flex items-center justify-center flex-shrink-0 shadow-inner">
              <img 
                src="${d.image || game.getVehicleImage?.(listing.item_type) || 'images/vehicles/VPSP.png'}" 
                alt="${d.name || listing.item_type}" 
                class="max-h-full max-w-full object-contain"
                onerror="this.src='images/vehicles/VPSP.png'"
              />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  ${listing.item_type || 'VÉHICULE'}
                </span>
                ${discountPct > 0 ? `
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    -${discountPct}% vs Neuf
                  </span>
                ` : ''}
              </div>

              <h4 class="text-sm font-black text-slate-900 truncate mt-1 leading-tight">${d.name || listing.item_type}</h4>
              <p class="text-[11px] text-slate-500 truncate">${d.model || d.label || 'Véhicule de premiers secours'}</p>
            </div>
          </div>

          <!-- Métriques techniques : Kilométrage, Année, État mécanique -->
          <div class="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-center">
            <div>
              <span class="text-[9px] font-bold text-slate-400 block uppercase">Kilométrage</span>
              <strong class="text-xs font-mono font-black text-slate-800">${Number(d.mileage || 120000).toLocaleString('fr-FR')} km</strong>
            </div>
            <div>
              <span class="text-[9px] font-bold text-slate-400 block uppercase">Année</span>
              <strong class="text-xs font-mono font-black text-slate-800">${d.year || 2017}</strong>
            </div>
            <div>
              <span class="text-[9px] font-bold text-slate-400 block uppercase">Mécanique</span>
              <div class="flex items-center justify-center gap-1 mt-0.5">
                <div class="w-10 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div class="${healthColor} h-full rounded-full" style="width: ${mechanicalPct}%"></div>
                </div>
                <strong class="text-xs font-mono font-black text-slate-800">${mechanicalPct}%</strong>
              </div>
            </div>
          </div>

          <!-- Description et équipements installés -->
          <p class="text-xs text-slate-600 leading-relaxed line-clamp-2">${d.desc || 'Véhicule opérationnel entièrement révisé, prêt pour engagement immédiat.'}</p>

          ${d.options && d.options.length > 0 ? `
            <div class="flex flex-wrap gap-1 mt-2">
              ${d.options.map(opt => `
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-pc-blue border border-blue-200/60">
                  ✓ ${opt}
                </span>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Pied de la carte : Vendeur, Prix et Bouton Acheter -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <span class="text-[10px] text-slate-400 block font-medium">Vendu par</span>
            <span class="text-xs font-black text-slate-800 truncate block">
              ${listing.seller_name} <span class="text-slate-400 text-[10px] font-normal">(${listing.seller_station_name || 'Antenne'})</span>
            </span>
          </div>

          <div class="flex items-center gap-3 flex-shrink-0">
            <div class="text-right">
              ${newPriceRef > listing.price ? `
                <span class="text-[10px] text-slate-400 line-through block leading-none">${newPriceRef.toLocaleString('fr-FR')} €</span>
              ` : ''}
              <span class="text-base font-black font-mono text-pc-blue leading-tight">${Number(listing.price).toLocaleString('fr-FR')} €</span>
            </div>

            ${isMyListing ? `
              <span class="px-3 py-2 rounded-xl text-xs font-black bg-amber-50 text-amber-800 border border-amber-300">
                Votre Annonce
              </span>
            ` : `
              <button 
                onclick="window.ProtecMarcheOccasion.confirmPurchase('${listing.id}', window.game)" 
                ${!canAfford ? 'disabled' : ''}
                class="px-4 py-2 rounded-xl font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${canAfford ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}"
                title="${canAfford ? 'Acheter et intégrer à mon antenne' : 'Fonds insuffisants'}"
              >
                <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                Acheter
              </button>
            `}
          </div>
        </div>

      </div>
    `;
  },

  // 2. ONGLET 2 : LISTE DU MATÉRIEL & MOBILIER
  renderEquipmentList(game) {
    const currentUserId = game.player?.id || window.ProtecAuth?.currentUser?.id || 'usr_local';
    let list = this.cachedListings.filter(l => l.category === 'equipment' && l.status === 'active');

    // Filtre textuel
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(l => {
        const d = l.item_data || {};
        return (d.name || '').toLowerCase().includes(q) ||
               (d.label || '').toLowerCase().includes(q) ||
               (d.desc || '').toLowerCase().includes(q) ||
               (l.seller_name || '').toLowerCase().includes(q) ||
               (l.item_type || '').toLowerCase().includes(q);
      });
    }

    // Sous-filtre matériel
    if (this.subFilterMaterial !== 'all') {
      list = list.filter(l => {
        const catType = (l.item_data?.categoryType || '').toLowerCase();
        return catType.includes(this.subFilterMaterial);
      });
    }

    // Tri
    list = this.sortListings(list);

    if (list.length === 0) {
      return `
        <div class="py-16 text-center space-y-3 bg-white rounded-3xl border border-dashed border-slate-300 p-6">
          <span class="text-4xl block">📦</span>
          <h5 class="text-sm font-black text-slate-800">Aucun matériel ni meuble disponible</h5>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">Aucun article ne correspond à votre filtre. Vendez vos surplus d'équipement ou vos meubles non utilisés pour renflouer votre trésorerie.</p>
          <button onclick="window.ProtecMarcheOccasion.openSellModal('equipment')" class="px-4 py-2 rounded-xl bg-pc-blue text-white font-black text-xs shadow-sm hover:brightness-110 transition">
            + Vendre du Matériel ou Meuble
          </button>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${list.map(listing => this.renderEquipmentCard(listing, game, currentUserId)).join('')}
      </div>
    `;
  },

  renderEquipmentCard(listing, game, currentUserId) {
    const d = listing.item_data || {};
    const isMyListing = (listing.seller_user_id === currentUserId);
    const userMoney = Number(game.resources?.money || 0);
    const canAfford = userMoney >= listing.price;
    const newPriceRef = Number(d.newPriceRef || 150);
    const discountPct = newPriceRef > 0 ? Math.round(((newPriceRef - listing.price) / newPriceRef) * 100) : 0;

    return `
      <div class="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-pc-blue/40 transition flex flex-col justify-between gap-3">
        
        <div>
          <!-- En-tête : Icône, Badge et Réduction -->
          <div class="flex items-start justify-between gap-2">
            <div class="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
              ${d.icon || '📦'}
            </div>

            <div class="flex flex-col items-end gap-1">
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                ${d.categoryType || 'ÉQUIPEMENT'}
              </span>
              ${discountPct > 0 ? `
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  -${discountPct}%
                </span>
              ` : ''}
            </div>
          </div>

          <h4 class="text-sm font-black text-slate-900 mt-2.5 leading-tight">${d.name || listing.item_type}</h4>
          <span class="text-[10px] font-bold text-slate-400 block">${d.conditionLabel || 'Très Bon État'}</span>

          <!-- Bonus apporté -->
          ${d.bonus ? `
            <div class="my-2.5 p-2 rounded-xl bg-indigo-50/80 border border-indigo-200/60 text-[11px] text-indigo-900 font-bold flex items-center gap-1.5">
              <span>⚡</span>
              <span class="line-clamp-2">${d.bonus}</span>
            </div>
          ` : ''}

          <p class="text-xs text-slate-600 leading-relaxed line-clamp-2 mt-1">${d.desc || 'Matériel de réserve prêt à être intégré à votre inventaire.'}</p>
        </div>

        <!-- Bas de carte : Vendeur, Prix et Action -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <span class="text-[10px] text-slate-400 block font-medium">Vendeur</span>
            <span class="text-xs font-black text-slate-800 truncate block">${listing.seller_name}</span>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <div class="text-right">
              ${newPriceRef > listing.price ? `
                <span class="text-[10px] text-slate-400 line-through block leading-none">${newPriceRef.toLocaleString('fr-FR')} €</span>
              ` : ''}
              <span class="text-sm font-black font-mono text-pc-blue leading-tight">${Number(listing.price).toLocaleString('fr-FR')} €</span>
            </div>

            ${isMyListing ? `
              <span class="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-300">
                Votre Annonce
              </span>
            ` : `
              <button 
                onclick="window.ProtecMarcheOccasion.confirmPurchase('${listing.id}', window.game)" 
                ${!canAfford ? 'disabled' : ''}
                class="px-3 py-1.5 rounded-xl font-black text-xs shadow-md transition flex items-center gap-1 cursor-pointer active:scale-95 ${canAfford ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}"
                title="${canAfford ? 'Acheter ce matériel' : 'Fonds insuffisants'}"
              >
                Acheter
              </button>
            `}
          </div>
        </div>

      </div>
    `;
  },

  // 3. ONGLET 3 : MES ANNONCES EN COURS & VENTES
  renderMyListingsView(game) {
    const currentUserId = game.player?.id || window.ProtecAuth?.currentUser?.id || 'usr_local';
    const myListings = this.cachedListings.filter(l => l.seller_user_id === currentUserId);

    if (myListings.length === 0) {
      return `
        <div class="py-16 text-center space-y-3 bg-white rounded-3xl border border-dashed border-slate-300 p-6">
          <span class="text-4xl block">🏷️</span>
          <h5 class="text-sm font-black text-slate-800">Vous n'avez aucune annonce en vente</h5>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">Vendez un véhicule en doublon ou du matériel excédentaire sur le marché de l'occasion pour récupérer de la trésorerie immédiate.</p>
          <button onclick="window.ProtecMarcheOccasion.openSellModal()" class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pc-orange to-amber-500 hover:brightness-110 text-white font-black text-xs shadow-md transition cursor-pointer">
            + Mettre un bien en Vente Maintenant
          </button>
        </div>
      `;
    }

    return `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-black text-slate-700 uppercase tracking-wider">Vos annonces actives & historiques (${myListings.length})</span>
          <button onclick="window.ProtecMarcheOccasion.openSellModal()" class="px-3 py-1.5 rounded-xl bg-pc-blue text-white font-black text-xs shadow-sm hover:brightness-110 transition flex items-center gap-1">
            + Nouvelle Annonce
          </button>
        </div>

        <div class="space-y-2.5">
          ${myListings.map(l => this.renderMyListingItem(l, game)).join('')}
        </div>
      </div>
    `;
  },

  renderMyListingItem(listing, game) {
    const d = listing.item_data || {};
    const isSold = (listing.status === 'sold');
    const isCancelled = (listing.status === 'cancelled');
    const isActive = (listing.status === 'active');

    let badgeStatus = '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">En Vente</span>';
    if (isSold) badgeStatus = `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300">Vendu à ${listing.buyer_name || 'Antenne'} ✓</span>`;
    if (isCancelled) badgeStatus = '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-600">Retiré de la vente</span>';

    return `
      <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl flex-shrink-0">
            ${listing.category === 'vehicle' ? '🚗' : (d.icon || '📦')}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h5 class="text-xs font-black text-slate-900">${d.name || listing.item_type}</h5>
              ${badgeStatus}
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">
              Type : <strong>${listing.category === 'vehicle' ? 'Véhicule de flotte' : 'Matériel / Meuble'}</strong> • Publié le ${new Date(listing.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-4 self-end sm:self-center">
          <div class="text-right">
            <span class="text-[10px] text-slate-400 block font-medium">Prix fixé</span>
            <span class="text-sm font-black font-mono text-pc-blue">${Number(listing.price).toLocaleString('fr-FR')} €</span>
          </div>

          ${isActive ? `
            <button 
              onclick="window.ProtecMarcheOccasion.cancelListing('${listing.id}', window.game)" 
              class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs border border-slate-200 transition cursor-pointer flex items-center gap-1"
              title="Retirer cette annonce et réintégrer l'objet immédiatement dans votre antenne"
            >
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
              Retirer de la Vente
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  // =========================================================================
  // ACTIONS : ACHAT D'UNE ANNONCE D'OCCASION
  // =========================================================================
  async confirmPurchase(listingId, game) {
    const listing = this.cachedListings.find(l => l.id === listingId);
    if (!listing) return;

    const d = listing.item_data || {};
    const itemNom = d.name || listing.item_type;
    const price = Number(listing.price);
    const userMoney = Number(game.resources?.money || 0);

    if (userMoney < price) {
      if (window.ProtecDialog) {
        await window.ProtecDialog.alert(`Vous ne disposez pas des fonds nécessaires pour acheter ce bien (${price.toLocaleString('fr-FR')} € requis, solde actuel : ${userMoney.toLocaleString('fr-FR')} €).`, 'Trésorerie Insuffisante');
      } else {
        game.showToast('Trésorerie Insuffisante', `Il vous manque ${(price - userMoney).toLocaleString('fr-FR')} € pour cet achat.`, 'orange');
      }
      return;
    }

    let ok = false;
    if (window.ProtecDialog) {
      ok = await window.ProtecDialog.confirm(`Confirmez-vous l'achat de « ${itemNom} » pour ${price.toLocaleString('fr-FR')} € ?\nLe bien sera immédiatement transféré et rattaché à votre antenne.`, 'Achat d’Occasion');
    } else {
      ok = window.confirm(`Acheter « ${itemNom} » pour ${price.toLocaleString('fr-FR')} € ?`);
    }

    if (!ok) return;

    const currentUserId = game.player?.id || window.ProtecAuth?.currentUser?.id || 'usr_local';
    const currentUserName = game.player?.name || window.ProtecAuth?.currentUser?.username || 'Directeur';

    // 1. Transaction Supabase Cloud
    let purchaseResult = { success: true };
    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      purchaseResult = await window.ProtecSupabase.buyMarketListing(listingId, currentUserId, currentUserName);
    }

    if (purchaseResult.error) {
      if (window.ProtecDialog) {
        await window.ProtecDialog.alert(purchaseResult.error, 'Achat Impossible');
      } else {
        game.showToast('Erreur Achat', purchaseResult.error, 'red');
      }
      return;
    }

    // 2. Débit de l'acheteur côté local
    game.resources.money -= price;

    // 3. Transfert du bien dans l'inventaire du joueur
    if (listing.category === 'vehicle') {
      this.integratePurchasedVehicle(listing, game);
    } else {
      this.integratePurchasedEquipment(listing, game);
    }

    // 4. Mettre à jour l'annonce localement
    listing.status = 'sold';
    listing.buyer_antenne_id = currentUserId;
    listing.buyer_name = currentUserName;
    listing.sold_at = new Date().toISOString();
    this.saveLocalSeedStorage(this.cachedListings);

    // 5. Sauvegarde générale de la partie
    game.updateStatsUI();
    game.saveGame();

    game.showToast('Acquisition Réussie ! 🚗', `« ${itemNom} » a été ajouté à votre antenne pour ${price.toLocaleString('fr-FR')} €.`, 'green');
    this.renderBodyContent(game);
  },

  // Intégration d'un véhicule acheté dans la flotte du joueur
  integratePurchasedVehicle(listing, game) {
    const d = listing.item_data || {};
    const primaryStation = (game.stations && game.stations[0]) || { id: 'st_primary', name: 'Antenne' };
    
    // Génération du nouvel indicatif adapté à la ville/antenne de l'acheteur (seul le propriétaire change)
    const vehicleType = (listing.item_type || 'VPSP').toUpperCase();
    const newCallsign = game.generateVehicleCallsign ? game.generateVehicleCallsign(vehicleType, primaryStation.id, primaryStation) : `${vehicleType} Occasion`;

    // Préservation stricte du kilométrage réel d'origine
    const km = Number(d.mileage !== undefined ? d.mileage : (d.kilometrage !== undefined ? d.kilometrage : 118400));
    // Préservation stricte des options, kits et équipements achetés par le vendeur
    const hasTowHitch = Boolean(d.hasTowHitch || d.options?.includes('Attelage remorque'));
    const isPCM = Boolean(d.isCommandement || d.hasCommandementKit || d.options?.some(opt => typeof opt === 'string' && (opt.includes('Commandement') || opt.includes('PCM'))));
    const preservedOptions = Array.isArray(d.options) && d.options.length > 0 ? [...d.options] : [
      ...(hasTowHitch ? ['Attelage remorque'] : []),
      ...(isPCM ? ['Poste de commandement Mobile'] : []),
      'Équipement réglementaire'
    ];

    const newVehicle = {
      id: `v_occ_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: newCallsign,
      type: vehicleType,
      label: d.label || d.name || 'Véhicule d’Occasion',
      model: d.model || 'Modèle Révisé',
      year: d.year || 2017,
      mileage: km,
      kilometrage: km,
      mechanical: d.mechanical !== undefined ? d.mechanical : 88,
      fuel: 100,
      status: 'dispo',
      ctStatus: d.ctStatus || 'valide',
      ctExpiryTimestamp: Date.now() + (160 * 24 * 3600 * 1000),
      insuranceStatus: 'assure',
      insuranceMonthlyCost: 90,
      stationId: primaryStation.id,
      capacity: d.capacity || 5,
      seatsCount: d.seatsCount || d.capacity || 5,
      image: d.image || (game.getVehicleImage ? game.getVehicleImage(vehicleType) : 'images/vehicles/VPSP.png'),
      hasTowHitch: hasTowHitch,
      isCommandement: isPCM,
      hasCommandementKit: isPCM,
      options: preservedOptions,
      upgrades: d.upgrades ? { ...d.upgrades } : {},
      speedKmH: d.speedKmH || 80,
      immat: d.immat || null,
      requiresTrailer: false,
      reqSkills: vehicleType === 'VPSP' ? ['permis_vpsp'] : ['permis_b']
    };

    if (!game.vehicles) game.vehicles = [];
    game.vehicles.push(newVehicle);

    if (primaryStation.vehicles && !primaryStation.vehicles.includes(newVehicle.id)) {
      primaryStation.vehicles.push(newVehicle.id);
    }
  },

  // Intégration d'un matériel ou meuble acheté
  integratePurchasedEquipment(listing, game) {
    const d = listing.item_data || {};
    const itemType = listing.item_type;

    // Si c'est un meuble pour les locaux
    if (d.categoryType === 'mobilier' || ['bureau', 'table_formation', 'lit_garde', 'canape_detente', 'chaise', 'tableau_blanc', 'machine_cafe'].includes(itemType)) {
      if (window.ProtecLocaux && typeof window.ProtecLocaux.getArchitectModel === 'function') {
        const model = window.ProtecLocaux.getArchitectModel();
        const room = (model.rooms && model.rooms[0]) || { id: 'room_1', x: 2, y: 2, w: 4, h: 4 };
        const newFurn = {
          id: `f_occ_${Date.now()}`,
          roomId: room.id,
          type: itemType,
          x: room.x + 1,
          y: room.y + 1,
          w: 1.5,
          d: 0.9,
          color: '#3b82f6',
          label: d.name || 'Meuble Occasion',
          rotation: 0
        };
        if (!model.furniture) model.furniture = [];
        model.furniture.push(newFurn);
      }
    } else {
      // Équipement opérationnel ou pédagogique
      if (!game.workplaceEquipment) game.workplaceEquipment = {};
      game.workplaceEquipment[itemType] = (game.workplaceEquipment[itemType] || 0) + 1;

      // Amélioration de Tier si le matériel acheté est d'un tier supérieur
      if (d.tier && game.equipmentTiers) {
        if ((game.equipmentTiers[itemType] || 1) < d.tier) {
          game.equipmentTiers[itemType] = d.tier;
        }
      }
    }
  },

  // =========================================================================
  // ACTIONS : RETRAIT / ANNULATION D'UNE ANNONCE PAR LE VENDEUR
  // =========================================================================
  async cancelListing(listingId, game) {
    const listing = this.cachedListings.find(l => l.id === listingId);
    if (!listing) return;

    let ok = false;
    if (window.ProtecDialog) {
      ok = await window.ProtecDialog.confirm(`Souhaitez-vous retirer « ${listing.item_data?.name || 'ce bien'} » de la vente ?\nIl sera immédiatement réintégré dans votre garage ou inventaire d'antenne.`, 'Retirer de la Vente');
    } else {
      ok = window.confirm('Retirer cette annonce et récupérer le bien ?');
    }

    if (!ok) return;

    const currentUserId = game.player?.id || window.ProtecAuth?.currentUser?.id || 'usr_local';

    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      await window.ProtecSupabase.cancelMarketListing(listingId, currentUserId);
    }

    // Réintégration de l'objet dans la flotte ou inventaire du joueur
    if (listing.category === 'vehicle') {
      this.integratePurchasedVehicle(listing, game);
    } else {
      this.integratePurchasedEquipment(listing, game);
    }

    // Mettre à jour l'annonce
    listing.status = 'cancelled';
    this.saveLocalSeedStorage(this.cachedListings);

    game.updateStatsUI();
    game.saveGame();

    game.showToast('Bien Récupéré ✓', 'L’annonce a été retirée et le bien est de nouveau disponible dans votre antenne.', 'blue');
    this.renderBodyContent(game);
  },

  // =========================================================================
  // MODALE DE MISE EN VENTE D'UN BIEN (VÉHICULE OU MEUBLE)
  // =========================================================================
  openSellModal(preselectedCategory = 'vehicle', preselectedItemId = null) {
    let sellModal = document.getElementById('market-sell-modal');
    if (!sellModal) {
      sellModal = document.createElement('div');
      sellModal.id = 'market-sell-modal';
      sellModal.className = 'fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4';
      document.body.appendChild(sellModal);
    }

    sellModal.innerHTML = `
      <div class="glass-panel-heavy bg-white/95 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-white/80 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-200 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-pc-orange text-white flex items-center justify-center font-black">
              🏷️
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900">Mettre un Bien en Vente</h3>
              <p class="text-xs text-slate-500">Revente d'occasion sécurisée entre directeurs d'antenne</p>
            </div>
          </div>
          <button onclick="document.getElementById('market-sell-modal').remove()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black">✕</button>
        </div>

        <div id="sell-form-content">
          ${this.renderSellForm(window.game, preselectedCategory, preselectedItemId)}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  renderSellForm(game, category = 'vehicle', selectedItemId = null) {
    // Liste des véhicules éligibles (status === 'dispo', non engagés en mission active)
    const availableVehicles = (game.vehicles || []).filter(v => v.status === 'dispo');
    
    // Liste des meubles et équipements éligibles
    let availableFurniture = [];
    if (window.ProtecLocaux && typeof window.ProtecLocaux.getArchitectModel === 'function') {
      const model = window.ProtecLocaux.getArchitectModel();
      availableFurniture = (model.furniture || []).map(f => ({
        id: f.id,
        name: f.label || f.type,
        type: f.type,
        categoryType: 'mobilier',
        estimatedPrice: 150
      }));
    }

    return `
      <form id="market-sell-form" onsubmit="window.ProtecMarcheOccasion.handleSellSubmit(event, window.game)" class="space-y-4 text-xs">
        
        <!-- Choix du type de bien -->
        <div>
          <label class="font-extrabold text-slate-700 block mb-1.5 uppercase text-[10px] tracking-wider">Type de bien à revendre :</label>
          <div class="grid grid-cols-2 gap-2">
            <button 
              type="button" 
              onclick="document.getElementById('sell-form-content').innerHTML = window.ProtecMarcheOccasion.renderSellForm(window.game, 'vehicle'); if (window.lucide) window.lucide.createIcons();"
              class="p-3 rounded-2xl font-black flex items-center justify-center gap-2 border transition cursor-pointer ${category === 'vehicle' ? 'bg-pc-blue text-white border-pc-blue shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}"
            >
              <span>🚗 Véhicule de Flotte</span>
            </button>
            <button 
              type="button" 
              onclick="document.getElementById('sell-form-content').innerHTML = window.ProtecMarcheOccasion.renderSellForm(window.game, 'equipment'); if (window.lucide) window.lucide.createIcons();"
              class="p-3 rounded-2xl font-black flex items-center justify-center gap-2 border transition cursor-pointer ${category === 'equipment' ? 'bg-pc-blue text-white border-pc-blue shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}"
            >
              <span>📦 Matériel ou Mobilier</span>
            </button>
          </div>
        </div>

        <input type="hidden" id="sell-category" value="${category}" />

        <!-- Sélection de l'objet possédé -->
        <div>
          <label class="font-extrabold text-slate-700 block mb-1.5 uppercase text-[10px] tracking-wider">Sélectionner dans votre inventaire :</label>
          
          ${category === 'vehicle' ? `
            ${availableVehicles.length === 0 ? `
              <div class="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                ⚠️ Aucun véhicule disponible pour la vente (vos véhicules sont actuellement engagés sur des missions ou en réparation).
              </div>
            ` : `
              <select 
                id="sell-item-select" 
                required 
                onchange="window.ProtecMarcheOccasion.onSellItemChange(this.value, 'vehicle', window.game)"
                class="w-full p-2.5 rounded-xl bg-white border border-slate-300 font-bold text-xs text-slate-800 cursor-pointer"
              >
                <option value="">-- Choisissez un véhicule de votre garage --</option>
                ${availableVehicles.map(v => `
                  <option value="${v.id}" ${v.id === selectedItemId ? 'selected' : ''}>
                    ${v.name} (${v.model || v.type} • ${Number(v.mileage || 100000).toLocaleString('fr-FR')} km • Santé : ${v.mechanical || 90}%)
                  </option>
                `).join('')}
              </select>
            `}
          ` : `
            ${availableFurniture.length === 0 ? `
              <div class="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                ⚠️ Aucun meuble ou équipement disponible à la revente dans votre base.
              </div>
            ` : `
              <select 
                id="sell-item-select" 
                required 
                onchange="window.ProtecMarcheOccasion.onSellItemChange(this.value, 'equipment', window.game)"
                class="w-full p-2.5 rounded-xl bg-white border border-slate-300 font-bold text-xs text-slate-800 cursor-pointer"
              >
                <option value="">-- Choisissez un meuble ou matériel --</option>
                ${availableFurniture.map(f => `
                  <option value="${f.id}">
                    ${f.name} (Mobilier de base)
                  </option>
                `).join('')}
              </select>
            `}
          `}
        </div>

        <!-- Encadré récapitulatif du bien sélectionné -->
        <div id="sell-preview-card" class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <span class="text-slate-400 font-bold block text-[11px]">Sélectionnez un article ci-dessus pour prévisualiser ses données officielles et le prix neuf indicatif.</span>
        </div>

        <!-- Saisie du prix de vente souhaité -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider">Prix de vente souhaité (€) :</label>
            <span id="sell-discount-tag" class="text-[10px] font-black text-emerald-700"></span>
          </div>
          <div class="relative">
            <input 
              type="number" 
              id="sell-price-input" 
              required 
              min="10" 
              step="10" 
              placeholder="Ex: 12500"
              oninput="window.ProtecMarcheOccasion.updateSellDiscountIndicator(this.value)"
              class="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-pc-blue"
            />
            <span class="absolute right-3 top-2.5 font-black text-slate-400">€</span>
          </div>
          <span class="text-[10px] text-slate-400 mt-1 block">Prix libre fixé par vous-même. Vous toucherez 100% de la somme dès l'achat par un joueur.</span>
        </div>

        <!-- Avertissement de retrait immédiat de l'inventaire -->
        <div class="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-[11px] text-pc-blue leading-relaxed">
          ℹ️ <strong>Règle de mise en vente :</strong> Le bien sera immédiatement retiré de votre garage/base pour être placé en dépôt-vente sécurisé sur le marché. Vous pourrez annuler la mise en vente à tout moment si l'objet n'a pas encore été acheté.
        </div>

        <!-- Boutons d'action -->
        <div class="pt-2 flex items-center justify-end gap-2">
          <button type="button" onclick="document.getElementById('market-sell-modal').remove()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition">
            Annuler
          </button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pc-orange to-amber-500 hover:brightness-110 active:scale-95 text-white font-black shadow-md transition cursor-pointer">
            Publier sur le Marché
          </button>
        </div>

      </form>
    `;
  },

  // Mise à jour de l'aperçu lors du changement de sélection
  onSellItemChange(itemId, category, game) {
    const previewEl = document.getElementById('sell-preview-card');
    const priceInput = document.getElementById('sell-price-input');
    if (!previewEl || !itemId) return;

    if (category === 'vehicle') {
      const v = (game.vehicles || []).find(veh => veh.id === itemId);
      if (!v) return;

      const newRef = 28000;
      const suggestedPrice = Math.round(newRef * (v.mechanical || 85) / 100 * 0.65);
      if (priceInput && !priceInput.value) {
        priceInput.value = suggestedPrice;
        this.updateSellDiscountIndicator(suggestedPrice);
      }

      previewEl.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-12 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center flex-shrink-0">
            <img src="${v.image || 'images/vehicles/VPSP.png'}" class="max-h-full max-w-full object-contain" />
          </div>
          <div>
            <h5 class="font-black text-slate-900">${v.name}</h5>
            <p class="text-[10px] text-slate-500">${v.model || v.label} • ${Number(v.mileage || 100000).toLocaleString('fr-FR')} km • Santé : ${v.mechanical || 90}%</p>
          </div>
        </div>
        <div class="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/80">
          <span class="text-slate-500">Prix d'achat neuf à titre indicatif :</span>
          <strong class="font-mono text-slate-800">${newRef.toLocaleString('fr-FR')} €</strong>
        </div>
      `;
    } else {
      const model = window.ProtecLocaux?.getArchitectModel?.() || { furniture: [] };
      const f = (model.furniture || []).find(item => item.id === itemId);
      if (!f) return;

      const newRef = 200;
      const suggestedPrice = 110;
      if (priceInput && !priceInput.value) {
        priceInput.value = suggestedPrice;
        this.updateSellDiscountIndicator(suggestedPrice);
      }

      previewEl.innerHTML = `
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">📦</span>
          <div>
            <h5 class="font-black text-slate-900">${f.label || f.type}</h5>
            <p class="text-[10px] text-slate-500">Mobilier d'antenne en très bon état</p>
          </div>
        </div>
        <div class="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/80">
          <span class="text-slate-500">Prix neuf indicatif :</span>
          <strong class="font-mono text-slate-800">${newRef.toLocaleString('fr-FR')} €</strong>
        </div>
      `;
    }
  },

  updateSellDiscountIndicator(val) {
    const tag = document.getElementById('sell-discount-tag');
    if (!tag) return;
    const price = Number(val);
    if (!price || price <= 0) {
      tag.textContent = '';
      return;
    }
    tag.textContent = `Prix fixé : ${price.toLocaleString('fr-FR')} €`;
  },

  // Soumission et enregistrement de l'annonce
  async handleSellSubmit(e, game) {
    e.preventDefault();
    const category = document.getElementById('sell-category')?.value || 'vehicle';
    const itemId = document.getElementById('sell-item-select')?.value;
    const price = Number(document.getElementById('sell-price-input')?.value);

    if (!itemId) {
      alert('Veuillez sélectionner un objet à vendre.');
      return;
    }
    if (!price || price < 10) {
      alert('Veuillez indiquer un prix de vente valide.');
      return;
    }

    const currentUserId = game.player?.id || window.ProtecAuth?.currentUser?.id || 'usr_local';
    const currentUserName = game.player?.name || window.ProtecAuth?.currentUser?.username || 'Directeur';
    const station = game.stations?.[0] || { id: 'st_primary', name: 'Antenne Locale', city: 'Nancy' };

    let itemData = {};
    let itemType = 'VPSP';

    if (category === 'vehicle') {
      const vIndex = (game.vehicles || []).findIndex(veh => veh.id === itemId);
      if (vIndex === -1) {
        alert('Véhicule introuvable dans votre garage.');
        return;
      }
      const vehicle = game.vehicles[vIndex];
      itemType = vehicle.type || 'VPSP';
      const km = Number(vehicle.mileage !== undefined ? vehicle.mileage : (vehicle.kilometrage !== undefined ? vehicle.kilometrage : 118400));
      const hasTowHitch = Boolean(vehicle.hasTowHitch);
      const isPCM = Boolean(vehicle.isCommandement || vehicle.hasCommandementKit);
      const optionsList = [];
      if (Array.isArray(vehicle.options)) {
        vehicle.options.forEach(opt => {
          if (!optionsList.includes(opt)) optionsList.push(opt);
        });
      }
      if (hasTowHitch && !optionsList.includes('Attelage remorque')) optionsList.push('Attelage remorque');
      if (isPCM && !optionsList.some(o => typeof o === 'string' && (o.includes('Commandement') || o.includes('PCM')))) {
        optionsList.push('Poste de commandement Mobile');
      }
      if (optionsList.length === 0) optionsList.push('Équipement réglementaire');

      itemData = {
        name: vehicle.name,
        label: vehicle.label || vehicle.name,
        model: vehicle.model || vehicle.type,
        year: vehicle.year || 2017,
        mileage: km,
        kilometrage: km,
        mechanical: vehicle.mechanical !== undefined ? vehicle.mechanical : 88,
        ctStatus: vehicle.ctStatus || 'valide',
        ctDaysLeft: 180,
        capacity: vehicle.capacity || 5,
        seatsCount: vehicle.seatsCount || vehicle.capacity || 5,
        image: vehicle.image,
        newPriceRef: vehicle.newPriceRef || 28000,
        hasTowHitch: hasTowHitch,
        isCommandement: isPCM,
        hasCommandementKit: isPCM,
        options: optionsList,
        upgrades: vehicle.upgrades ? { ...vehicle.upgrades } : {},
        immat: vehicle.immat || null,
        speedKmH: vehicle.speedKmH || 80,
        desc: `Véhicule cédé par l'${station.name} (${station.city || 'Territoire'}). Révision effectuée, prêt pour service.`
      };

      // Retrait immédiat du véhicule du garage
      game.vehicles.splice(vIndex, 1);
      if (station.vehicles) {
        station.vehicles = station.vehicles.filter(id => id !== itemId);
      }
    } else {
      // Meuble
      const model = window.ProtecLocaux?.getArchitectModel?.() || { furniture: [] };
      const fIndex = (model.furniture || []).findIndex(f => f.id === itemId);
      if (fIndex === -1) {
        alert('Meuble introuvable dans vos locaux.');
        return;
      }
      const furn = model.furniture[fIndex];
      itemType = furn.type || 'bureau';
      itemData = {
        name: furn.label || furn.type,
        label: furn.label || furn.type,
        categoryType: 'mobilier',
        conditionLabel: 'Très Bon État',
        newPriceRef: 200,
        icon: '📦',
        bonus: 'Équipement d’antenne révisé',
        desc: `Cédé par l'${station.name}. Nettoyé et disponible immédiatement.`
      };

      // Retrait immédiat des locaux
      model.furniture.splice(fIndex, 1);
    }

    const newListing = {
      id: `mkt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      seller_user_id: currentUserId,
      seller_antenne_id: station.id,
      seller_name: currentUserName,
      seller_station_name: station.name,
      seller_dept: game.player?.departmentCode || '54',
      category: category,
      item_type: itemType,
      item_data: itemData,
      price: price,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // Enregistrement dans Supabase Cloud
    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      await window.ProtecSupabase.createMarketListing(newListing);
    }

    // Ajout local et persistance
    this.cachedListings.unshift(newListing);
    this.saveLocalSeedStorage(this.cachedListings);

    game.updateStatsUI();
    game.saveGame();

    // Fermeture du modal de mise en vente
    document.getElementById('market-sell-modal')?.remove();

    game.showToast('Annonce Publiée ! 🏷️', `Votre annonce pour « ${itemData.name} » est maintenant visible sur le marché pour ${price.toLocaleString('fr-FR')} €.`, 'green');

    // Basculer sur l'onglet Mes Annonces
    this.activeTab = 'mes_annonces';
    this.renderBodyContent(game);
  },

  // =========================================================================
  // GESTIONNAIRES D'ONGLETS, DE FILTRES ET DE TRI
  // =========================================================================
  switchTab(tabKey, game) {
    this.activeTab = tabKey;
    this.renderBodyContent(game);
  },

  setSearchQuery(query, game) {
    this.searchQuery = (query || '').trim();
    const container = document.getElementById('market-listings-container');
    if (container) {
      container.innerHTML = this.renderTabContent(game);
      if (window.lucide) window.lucide.createIcons();
    }
  },

  setVehicleFilter(filter, game) {
    this.subFilterVehicle = filter;
    this.renderBodyContent(game);
  },

  setMaterialFilter(filter, game) {
    this.subFilterMaterial = filter;
    this.renderBodyContent(game);
  },

  setSortOption(sortKey, game) {
    this.sortOption = sortKey;
    this.renderBodyContent(game);
  },

  sortListings(list) {
    const sorted = [...list];
    if (this.sortOption === 'price_asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (this.sortOption === 'price_desc') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (this.sortOption === 'km_asc') {
      sorted.sort((a, b) => (a.item_data?.mileage || 0) - (b.item_data?.mileage || 0));
    } else {
      // 'recent'
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return sorted;
  },

  async refreshListings(game) {
    await this.fetchListings(true);
    this.renderBodyContent(game);
    game.showToast('Marché Actualisé', 'Les annonces inter-antennes sont synchronisées.', 'blue');
  }
};
