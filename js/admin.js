/**
 * PROTEC LIVE - PANEL ADMINISTRATEUR (GESTION DE TOUS LES JOUEURS)
 * Permet à l'administrateur de superviser la base de données,
 * modifier les trésoreries, réinitialiser des mots de passe,
 * gérer les bannissements et diffuser des alertes globales.
 */

window.ProtecAdmin = {
  usersCache: [],
  archivesCache: [],
  eventsCache: [],
  vehiclesCache: [],
  equipmentCache: [],
  badgesCache: [],
  activeTab: 'joueurs',
  searchFilter: '',
  vehiclesFilter: '',
  equipmentFilter: '',
  badgesFilter: '',
  isAnalyticsCollapsed: false,

  getAuthHeaders() {
    const token = localStorage.getItem('protec_auth_token') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-admin-key': 'protec_admin_secret_2026'
    };
  },

  async openAdminModal(game) {
    const isActuallyAdmin = !!(
      (window.ProtecAuth?.currentUser?.isAdmin) ||
      (window.ProtecAuth?.currentUser?.role === 'admin') ||
      (game?.player?.isAdmin) ||
      (game?.player?.role === 'admin')
    );

    if (!isActuallyAdmin) {
      if (game && typeof game.showToast === 'function') {
        game.showToast('Accès Restreint', 'Accès réservé exclusivement aux comptes Administrateurs certifiés en BDD.', 'red');
      }
      return;
    }

    let modal = document.getElementById('admin-modal');
    if (!modal) {
      this.createAdminModalDOM();
      modal = document.getElementById('admin-modal');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();

    await this.loadAdminData(game);
  },

  switchTab(tab) {
    this.activeTab = tab;
    const tabPlayersBtn = document.getElementById('admin-tab-players-btn');
    const tabAnnouncementsBtn = document.getElementById('admin-tab-announcements-btn');
    const tabSuspicionBtn = document.getElementById('admin-tab-suspicion-btn');
    const tabSupportBtn = document.getElementById('admin-tab-support-btn');
    const tabVehiclesBtn = document.getElementById('admin-tab-vehicles-btn');
    const tabEquipmentBtn = document.getElementById('admin-tab-equipment-btn');
    const tabArchivesBtn = document.getElementById('admin-tab-archives-btn');
    const tabMissionsBtn = document.getElementById('admin-tab-missions-btn');
    const tabEventsBtn = document.getElementById('admin-tab-events-btn');
    const tabReferralsBtn = document.getElementById('admin-tab-referrals-btn');
    const tabBalancingBtn = document.getElementById('admin-tab-balancing-btn');

    const viewPlayers = document.getElementById('admin-view-players');
    const viewAnnouncements = document.getElementById('admin-view-announcements');
    const viewSuspicion = document.getElementById('admin-view-suspicion');
    const viewSupport = document.getElementById('admin-view-support');
    const viewVehicles = document.getElementById('admin-view-vehicules');
    const viewEquipment = document.getElementById('admin-view-materiel');
    const viewArchives = document.getElementById('admin-view-archives');
    const viewMissions = document.getElementById('admin-view-missions');
    const viewEvents = document.getElementById('admin-view-events');
    const viewReferrals = document.getElementById('admin-view-referrals');
    const viewBalancing = document.getElementById('admin-view-balancing');

    const defaultClass = 'px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer';
    const activeClass = 'px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer';

    if (tabPlayersBtn) tabPlayersBtn.className = (tab === 'joueurs' ? activeClass : defaultClass);
    if (tabAnnouncementsBtn) tabAnnouncementsBtn.className = (tab === 'annonces' ? activeClass : defaultClass);
    if (tabSuspicionBtn) tabSuspicionBtn.className = (tab === 'suspicion' ? activeClass : defaultClass);
    if (tabSupportBtn) tabSupportBtn.className = (tab === 'support' ? activeClass : defaultClass);
    if (tabVehiclesBtn) tabVehiclesBtn.className = (tab === 'vehicules' ? activeClass : defaultClass);
    if (tabEquipmentBtn) tabEquipmentBtn.className = (tab === 'materiel' ? activeClass : defaultClass);
    if (tabArchivesBtn) tabArchivesBtn.className = (tab === 'archives' ? activeClass : defaultClass);
    if (tabMissionsBtn) tabMissionsBtn.className = (tab === 'missions' ? activeClass : defaultClass);
    if (tabEventsBtn) tabEventsBtn.className = (tab === 'events' ? activeClass : defaultClass);
    if (tabReferralsBtn) tabReferralsBtn.className = (tab === 'parrainages' ? activeClass : defaultClass);
    if (tabBalancingBtn) tabBalancingBtn.className = (tab === 'balancing' ? activeClass : defaultClass);

    if (viewPlayers) viewPlayers.classList.toggle('hidden', tab !== 'joueurs');
    if (viewAnnouncements) viewAnnouncements.classList.toggle('hidden', tab !== 'annonces');
    if (viewSuspicion) viewSuspicion.classList.toggle('hidden', tab !== 'suspicion');
    if (viewSupport) viewSupport.classList.toggle('hidden', tab !== 'support');
    if (viewVehicles) viewVehicles.classList.toggle('hidden', tab !== 'vehicules');
    if (viewEquipment) viewEquipment.classList.toggle('hidden', tab !== 'materiel');
    if (viewArchives) viewArchives.classList.toggle('hidden', tab !== 'archives');
    if (viewMissions) viewMissions.classList.toggle('hidden', tab !== 'missions');
    if (viewEvents) viewEvents.classList.toggle('hidden', tab !== 'events');
    if (viewReferrals) viewReferrals.classList.toggle('hidden', tab !== 'parrainages');
    if (viewBalancing) viewBalancing.classList.toggle('hidden', tab !== 'balancing');

    if (tab === 'archives') {
      this.loadResetArchives();
    } else if (tab === 'events') {
      this.loadEventsData();
      this.loadBadgesCatalogData();
    } else if (tab === 'vehicules') {
      this.loadVehiclesCatalogData();
    } else if (tab === 'materiel') {
      this.loadEquipmentCatalogData();
    } else if (tab === 'suspicion') {
      this.renderSuspiciousAlerts();
    } else if (tab === 'support') {
      this.renderSupportPlayerSelect();
    } else if (tab === 'parrainages') {
      this.loadReferralsData();
    } else if (tab === 'balancing') {
      this.renderBalancingView();
    }
  },

  async loadResetArchives() {
    const tbody = document.getElementById('admin-archives-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-xs text-slate-500 font-semibold animate-pulse">Chargement des archives de sauvegarde...</td></tr>`;

    try {
      const res = await fetch('/api/admin/reset-archives', { headers: this.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        this.archivesCache = data.archives || [];
        this.renderArchivesTable();
      } else {
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-xs text-red-500 font-bold">Impossible de récupérer les archives.</td></tr>`;
      }
    } catch (e) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-xs text-red-500 font-bold">Erreur de connexion.</td></tr>`;
    }
  },

  renderArchivesTable() {
    const tbody = document.getElementById('admin-archives-tbody');
    if (!tbody) return;

    if (this.archivesCache.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-xs text-slate-400 font-semibold">Aucune archive de remise à zéro enregistrée en BDD.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.archivesCache.map(arc => {
      const dateStr = new Date(arc.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
      const moneyStr = arc.money !== null ? `${Number(arc.money).toLocaleString('fr-FR')} €` : 'N/A';

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/70 transition text-xs">
          <td class="py-3 px-3">
            <span class="font-mono text-[11px] text-slate-500 font-bold">${arc.id}</span>
            <div class="text-[10px] text-slate-400">${dateStr}</div>
          </td>
          <td class="py-3 px-3">
            <div class="font-black text-slate-900">${arc.username}</div>
            <div class="text-[10px] text-slate-400 font-mono">ID: ${arc.userId}</div>
          </td>
          <td class="py-3 px-3 font-extrabold text-emerald-600 mono-num">
            ${moneyStr}
          </td>
          <td class="py-3 px-3 text-slate-600">
            <span class="font-bold text-pc-blue">${arc.volunteersCount}</span> secouristes • 
            <span class="font-bold text-slate-700">${arc.stationsCount}</span> antenne(s)
          </td>
          <td class="py-3 px-3 text-[11px] text-slate-500 italic">
            ${arc.reason}
          </td>
          <td class="py-3 px-3 text-right">
            <button onclick="window.ProtecAdmin.confirmRestoreArchive('${arc.id}', '${arc.userId}', '${arc.username}')" class="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center gap-1 ml-auto">
              <span>Restituer au Joueur</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  async confirmRestoreArchive(archiveId, userId, username) {
    const confirmed = await window.ProtecDialog.confirm(
      `Voulez-vous restaurer cette archive de sauvegarde pour le joueur « ${username} » ? Sa partie actuelle sera remplacée par cette sauvegarde.`,
      'Restitution de Sauvegarde',
      { isDestructive: true, confirmText: 'Restaurer la partie', cancelText: 'Annuler' }
    );
    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch('/api/admin/restore-archive', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ archiveId, targetUserId: userId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (window.game) window.game.showToast('Partie Restituée !', `L'archive a été restaurée pour ${username}.`, 'green');
        await window.ProtecDialog.alert(`Succès : La sauvegarde a été réattribuée à ${username}. Le joueur peut recharger sa partie depuis le Cloud.`, 'Sauvegarde Restituée');
        await this.loadAdminData(window.game);
        this.switchTab('joueurs');
      } else {
        await window.ProtecDialog.alert(data.error || 'Erreur lors de la restitution.', 'Erreur Restitution');
      }
    } catch (e) {
      await window.ProtecDialog.alert('Erreur réseau lors de la restauration.', 'Erreur Réseau');
    }
  },

  async loadEventsData() {
    const container = document.getElementById('admin-events-list-container');
    if (container) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-slate-500 font-semibold animate-pulse">Chargement des événements proposés...</div>`;
    }

    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        this.eventsCache = data.communityEvents || [];
      } else {
        this.eventsCache = (window.game && window.game.communityEvents) || [];
      }
    } catch (e) {
      this.eventsCache = (window.game && window.game.communityEvents) || [];
    }

    if (window.game && window.game.communityEvents) {
      window.game.communityEvents.forEach(ge => {
        if (!this.eventsCache.some(ce => ce.id === ge.id)) {
          this.eventsCache.push(ge);
        }
      });
    }

    this.renderEventsTable();
  },

  renderEventsTable() {
    const container = document.getElementById('admin-events-list-container');
    if (!container) return;

    if (!this.eventsCache || this.eventsCache.length === 0) {
      container.innerHTML = `
        <div class="p-8 rounded-2xl glass-card text-center text-slate-400 text-xs italic">
          Aucun événement proposé par les directeurs dans la base de données.
        </div>
      `;
      return;
    }

    const sorted = [...this.eventsCache].sort((a, b) => {
      if (a.status === 'pending_approval' && b.status !== 'pending_approval') return -1;
      if (a.status !== 'pending_approval' && b.status === 'pending_approval') return 1;
      return (new Date(b.createdAt || 0)) - (new Date(a.createdAt || 0));
    });

    container.innerHTML = sorted.map(ev => {
      const b = ev.badge || {};
      const isPending = ev.status === 'pending_approval';
      const isOpen = ev.status === 'open' || !ev.status;
      const isRejected = ev.status === 'rejected';

      const statusBadge = isPending 
        ? `<span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> En Attente de Validation</span>`
        : isOpen
        ? `<span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">✓ Validé & En Ligne</span>`
        : `<span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">✕ Refusé</span>`;

      return `
        <div class="p-4 rounded-2xl bg-white border ${isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'} shadow-sm space-y-3" id="admin-event-row-${ev.id}">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800 uppercase">${ev.category || 'Événement'}</span>
                ${statusBadge}
              </div>
              <h4 class="text-sm font-black text-slate-900">${ev.title}</h4>
              <p class="text-xs text-slate-500 font-medium">
                Organisateur : <strong class="text-slate-700">${ev.organizerPlayerName}</strong> (${ev.stationName || 'Antenne'} • ${ev.city || 'Ville'})
              </p>
            </div>
            <div class="text-right">
              <span class="text-xs font-black text-emerald-700 mono-num">+${ev.rewardMoney} €</span>
              <div class="text-[10px] text-slate-400">ID: ${ev.id}</div>
            </div>
          </div>

          <!-- LOCALISATION & ADRESSE OBLIGATOIRE -->
          <div class="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200 text-xs text-sky-950 flex items-center justify-between">
            <div class="flex items-center gap-1.5 min-w-0">
              <i data-lucide="map-pin" class="w-4 h-4 text-sky-600 flex-shrink-0"></i>
              <span class="truncate">Adresse : <strong class="text-slate-900">${ev.address || (ev.lat && ev.lng ? `Point GPS: ${ev.lat.toFixed(4)}, ${ev.lng.toFixed(4)}` : `${ev.locationName}, ${ev.city}`)}</strong></span>
            </div>
            <span class="text-[10px] font-mono font-bold text-sky-700 flex-shrink-0 ml-2">GPS : ${Number(ev.lat || 0).toFixed(4)}, ${Number(ev.lng || 0).toFixed(4)}</span>
          </div>

          <!-- EFFECTIF, DURÉE, INDEMNISATION BASÉE SUR PERSONNEL & MOYENS -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600">
            <div>Public : <strong class="text-slate-800">${Number(ev.publicCount || 0).toLocaleString('fr-FR')} pers.</strong></div>
            <div>Effectif : <strong class="text-slate-800">${ev.requiredVolunteers} secouristes</strong></div>
            <div>Durée : <strong class="text-slate-800">${ev.durationHours}h</strong></div>
            <div>Indemnité : <strong class="text-emerald-700">${ev.rewardMoney} € (15€/h + moyens)</strong></div>
          </div>

          <!-- ÉCUSSON : LIEN D'IMAGE, UNITÉS ET RARETÉ STRICTE -->
          ${b.name ? `
            <div class="p-3 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 to-indigo-900 text-white flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                  ${b.imageUrl ? `
                    <img src="${b.imageUrl}" alt="${b.name}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                    <div class="hidden w-full h-full items-center justify-center">
                      <i data-lucide="${b.icon || 'award'}" class="w-5 h-5 text-white"></i>
                    </div>
                  ` : `
                    <i data-lucide="${b.icon || 'award'}" class="w-5 h-5"></i>
                  `}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs font-black text-purple-950">${b.name}</span>
                    <span class="text-[9px] font-black px-1.5 py-0.2 rounded-full ${b.rarityColor || 'bg-purple-100 text-purple-800'}">${b.rarityTier}</span>
                    <span class="text-[9px] font-bold text-purple-700 bg-white/80 px-1.5 py-0.2 rounded border border-purple-200">
                      ${b.accessType === 'mission_ouverte' ? 'Mission Ouverte (Commun)' : `${b.availableUnits || 4} antenne(s) max`}
                    </span>
                  </div>
                  <div class="text-[10px] text-purple-700 truncate mt-0.5">
                    ${b.imageUrl ? `Lien image : <a href="${b.imageUrl}" target="_blank" class="underline text-indigo-700 font-bold">${b.imageUrl}</a>` : 'Aucun lien d\'image fourni (icône vectorielle)'}
                  </div>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="text-xs font-black text-purple-950">⭐ ${b.rarityScore}/100</div>
                <div class="text-[9px] text-purple-600 uppercase font-bold">Rareté</div>
              </div>
            </div>
          ` : ''}

          ${isRejected ? `
            <div class="text-[11px] text-rose-700 font-semibold p-2 rounded-lg bg-rose-50 border border-rose-200">
              Motif du refus : <em>${ev.rejectionReason || 'Non conforme aux critères'}</em>
            </div>
          ` : ''}

          <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <span class="text-[10px] text-slate-400">Date prévue : ${ev.eventDate?.day}/${ev.eventDate?.month}/${ev.eventDate?.year || 2026} à ${ev.eventDate?.hour || 14}h</span>
            <div class="flex items-center gap-2">
              <!-- POUVOIR DE L'ADMIN : MODIFIER TOUTES LES INFORMATIONS -->
              <button onclick="window.ProtecAdmin.openEditEventModal('${ev.id}')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition flex items-center gap-1 cursor-pointer" title="Modifier l'adresse, l'indemnisation, l'écusson et l'effectif">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                Modifier Tout
              </button>

              ${isPending ? `
                <button onclick="window.ProtecAdmin.promptRejectEvent('${ev.id}')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer">
                  ✕ Refuser
                </button>
                <button onclick="window.ProtecAdmin.approveEvent('${ev.id}')" class="px-4 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center gap-1 cursor-pointer">
                  ✓ Valider & Publier
                </button>
              ` : isOpen ? `
                <button onclick="window.ProtecAdmin.promptRejectEvent('${ev.id}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer">
                  Suspendre / Retirer
                </button>
              ` : `
                <button onclick="window.ProtecAdmin.approveEvent('${ev.id}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer">
                  Réexaminer & Valider
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  // MODALE D'ÉDITION ADMINISTRATIVE COMPLÈTE D'UN ÉVÉNEMENT
  openEditEventModal(eventId) {
    const ev = (this.eventsCache || []).find(e => e.id === eventId);
    if (!ev) return;

    let modal = document.getElementById('admin-edit-event-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-edit-event-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto';
      document.body.appendChild(modal);
    }

    const b = ev.badge || {};
    const bImg = b.imageUrl || '';
    const accessType = (b.accessType && b.accessType !== 'en_attente') ? b.accessType : 'dps_departemental';
    const units = b.availableUnits || 4;

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800 my-8">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <i data-lucide="edit-3" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 leading-tight">Modifier l'Événement (Pouvoir Administrateur)</h3>
              <p class="text-xs text-slate-500 font-semibold">Ajustez l'adresse, l'indemnisation, les moyens et l'écusson avant ou après validation</p>
            </div>
          </div>
          <button onclick="document.getElementById('admin-edit-event-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer">✕</button>
        </div>

        <form id="admin-edit-event-form" onsubmit="event.preventDefault(); window.ProtecAdmin.saveEventEdit('${ev.id}');" class="space-y-3.5 text-xs">
          <!-- Titre & Catégorie -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Intitulé de l'Événement :</label>
              <input type="text" id="adm-evt-title" value="${ev.title}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black text-slate-800 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Catégorie :</label>
              <input type="text" id="adm-evt-category" value="${ev.category || 'Festival & Concert'}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
            </div>
          </div>

          <!-- ADRESSE & LOCALISATION -->
          <div class="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-black text-sky-950 flex items-center gap-1.5">
                <i data-lucide="map-pin" class="w-4 h-4 text-sky-600"></i>
                Adresse & Point sur la Carte (Obligatoire)
              </span>
              <button type="button" onclick="window.ProtecAdmin.pickEventLocationOnMap()" class="px-3 py-1.5 rounded-xl bg-pc-blue hover:bg-blue-700 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1.5 cursor-pointer" title="Cliquer directement sur la carte pour définir la position de l'événement">
                <i data-lucide="map-pin" class="w-3.5 h-3.5 text-amber-300"></i>
                <span>Placer un point sur la map</span>
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div class="sm:col-span-2">
                <label class="block font-bold text-slate-700 text-[11px] mb-0.5">Adresse postale :</label>
                <input type="text" id="adm-evt-address" value="${ev.address || ev.locationName || ''}" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
              </div>
              <div>
                <label class="block font-bold text-slate-700 text-[11px] mb-0.5">Ville :</label>
                <input type="text" id="adm-evt-city" value="${ev.city || 'Paris'}" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label class="block font-semibold text-slate-600 mb-0.5">Latitude (GPS) :</label>
                <input type="number" step="0.0001" id="adm-evt-lat" value="${ev.lat || 48.8566}" class="w-full px-2.5 py-1 rounded-lg border border-slate-300 font-mono text-slate-800 bg-white text-xs" required />
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-0.5">Longitude (GPS) :</label>
                <input type="number" step="0.0001" id="adm-evt-lng" value="${ev.lng || 2.3522}" class="w-full px-2.5 py-1 rounded-lg border border-slate-300 font-mono text-slate-800 bg-white text-xs" required />
              </div>
            </div>
          </div>

          <!-- EFFECTIF, DURÉE, MOYENS ET INDEMNISATION -->
          <div class="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-black text-emerald-950 flex items-center gap-1.5">
                <i data-lucide="badge-euro" class="w-4 h-4 text-emerald-700"></i>
                Indemnisation & Moyens Engagés (Modifiable par l'Admin)
              </span>
              <button type="button" onclick="window.ProtecAdmin.recalcIndemnisationInEditModal()" class="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] cursor-pointer">
                ⚖️ Recalculer selon Barème
              </button>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block font-bold text-slate-700 text-[11px] mb-0.5">Secouristes Requis :</label>
                <input type="number" id="adm-evt-volunteers" value="${ev.requiredVolunteers}" min="2" max="40" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-black text-slate-800 bg-white" required />
              </div>
              <div>
                <label class="block font-bold text-slate-700 text-[11px] mb-0.5">Durée (Heures) :</label>
                <input type="number" id="adm-evt-duration" value="${ev.durationHours}" min="1" max="48" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-black text-slate-800 bg-white" required />
              </div>
              <div>
                <label class="block font-bold text-slate-700 text-[11px] mb-0.5">Indemnisation Totale (€) :</label>
                <input type="number" id="adm-evt-reward" value="${ev.rewardMoney}" min="50" max="25000" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-black text-emerald-700 bg-white" required />
              </div>
            </div>
            <div>
              <label class="block font-bold text-slate-700 text-[11px] mb-0.5">Véhicules & Moyens Engagés :</label>
              <input type="text" id="adm-evt-vehicles" value="${(ev.requiredVehicles || []).join(', ')}" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-medium text-slate-800 bg-white" />
            </div>
          </div>

          <!-- ÉCUSSON : LIEN D'IMAGE ET RARETÉ STRICTE -->
          <div class="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-2">
            <span class="font-black text-purple-950 flex items-center gap-1.5">
              <i data-lucide="award" class="w-4 h-4 text-purple-700"></i>
              Écusson : Obtention, Quotas & Rareté Administrative
            </span>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div class="sm:col-span-2">
                <label class="block font-bold text-slate-700 text-[11px] mb-0.5">Lien / URL de l'image de l'écusson :</label>
                <div class="flex gap-2 items-center">
                  <input type="url" id="adm-badge-url" value="${bImg}" placeholder="https://..." oninput="window.ProtecAdmin.previewBadgeInEditModal()" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-medium text-slate-800 bg-white" />
                  <button type="button" onclick="window.ProtecAIBadgeGenerator && window.ProtecAIBadgeGenerator.openModal('adm-badge-url', document.getElementById('adm-event-title')?.value || '${ev.title}')" class="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-white font-black text-[10px] whitespace-nowrap shadow-xs transition flex items-center gap-1 cursor-pointer" title="Créer un écusson personnalisé par IA (Imagen 3)">
                    ✨ IA
                  </button>
                  <div id="adm-badge-preview-thumb" class="w-9 h-9 rounded-xl bg-purple-100 border border-purple-300 flex items-center justify-center flex-shrink-0 overflow-hidden text-[9px] font-bold text-purple-700">
                    ${bImg ? `<img src="${bImg}" class="w-full h-full object-cover" onerror="this.parentElement.textContent='Erreur';" />` : 'Aperçu'}
                  </div>
                </div>
              </div>
              <div>
                <label class="block font-bold text-slate-700 text-[11px] mb-0.5">Nom de l'Écusson :</label>
                <input type="text" id="adm-badge-name" value="${b.name || `Écusson ${ev.title}`}" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label class="block font-bold text-slate-700 text-[11px] mb-0.5">Mode d'obtention de l'écusson :</label>
                <select id="adm-badge-access-type" onchange="window.ProtecAdmin.updateRarityInEditModal()" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white">
                  <option value="mission_ouverte" ${accessType === 'mission_ouverte' ? 'selected' : ''}>Accès libre ordinaire (Commun - Tous participants)</option>
                  <option value="dps_departemental" ${accessType === 'dps_departemental' ? 'selected' : ''}>DPS départemental standard (Peu Commun)</option>
                  <option value="evenement_regional" ${accessType === 'evenement_regional' ? 'selected' : ''}>Événement régional (Rare)</option>
                  <option value="evenement_special" ${accessType === 'evenement_special' ? 'selected' : ''}>Événement spécial (Très Rare - Quota d'antennes)</option>
                  <option value="evenement_unique" ${accessType === 'evenement_unique' ? 'selected' : ''}>Événement unique / historique (Légendaire)</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 text-[11px] mb-0.5">Unités disponibles / Antennes autorisées :</label>
                <input type="number" id="adm-badge-units" value="${units}" min="1" max="50" oninput="window.ProtecAdmin.updateRarityInEditModal()" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-black text-slate-800 bg-white" required />
              </div>
            </div>

            <div class="flex items-center justify-between p-2 rounded-xl bg-white border border-purple-200">
              <span class="text-[11px] text-purple-900 font-bold">Rareté finale calculée :</span>
              <span id="adm-badge-rarity-badge" class="px-2.5 py-0.5 rounded-full text-[10px] font-black border ${b.rarityColor || 'bg-purple-100 text-purple-800'}">
                ${b.rarityTier || 'Très Rare'} (⭐ ${b.rarityScore || 85}/100)
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-100">
            <select id="adm-evt-status" class="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50">
              <option value="pending_approval" ${ev.status === 'pending_approval' ? 'selected' : ''}>⏳ En Attente de Validation</option>
              <option value="open" ${ev.status === 'open' ? 'selected' : ''}>✓ Validé & En Ligne</option>
              <option value="rejected" ${ev.status === 'rejected' ? 'selected' : ''}>✕ Refusé</option>
            </select>

            <div class="flex items-center gap-2">
              <button type="button" onclick="document.getElementById('admin-edit-event-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">
                Annuler
              </button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="check" class="w-4 h-4"></i>
                Enregistrer les Modifications
              </button>
            </div>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
    this.updateRarityInEditModal();
  },

  pickEventLocationOnMap() {
    if (!window.game) return;

    const latInput = document.getElementById('adm-evt-lat');
    const lngInput = document.getElementById('adm-evt-lng');
    const addrInput = document.getElementById('adm-evt-address');
    const cityInput = document.getElementById('adm-evt-city');

    window.game.startLocationPicker({
      title: "Positionnement de l'Événement (Admin)",
      subtitle: "Cliquez sur la carte à l'emplacement exact où déployer l'événement",
      onConfirm: (loc) => {
        if (latInput) latInput.value = loc.lat.toFixed(4);
        if (lngInput) lngInput.value = loc.lng.toFixed(4);
        if (loc.address && addrInput) addrInput.value = loc.address;
        if (loc.city && cityInput) cityInput.value = loc.city;
        window.game.showToast('Emplacement Enregistré', `Position GPS validée : ${loc.address ? loc.address + ', ' : ''}${loc.city || ''} (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`, 'green');
      }
    });
  },

  geocodeAddressInEditModal() {
    const addr = document.getElementById('adm-evt-address')?.value || '';
    const city = document.getElementById('adm-evt-city')?.value || '';
    const query = `${addr} ${city}`.trim();
    if (!query) return;

    fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.features && data.features.length > 0) {
          const feat = data.features[0];
          const coords = feat.geometry.coordinates;
          const latInput = document.getElementById('adm-evt-lat');
          const lngInput = document.getElementById('adm-evt-lng');
          const addrInput = document.getElementById('adm-evt-address');
          const cityInput = document.getElementById('adm-evt-city');
          if (latInput) latInput.value = coords[1].toFixed(4);
          if (lngInput) lngInput.value = coords[0].toFixed(4);
          if (addrInput && feat.properties.name) addrInput.value = feat.properties.name;
          if (cityInput && feat.properties.city) cityInput.value = feat.properties.city;
          if (window.game) window.game.showToast('Adresse Localisée', `GPS : ${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`, 'green');
        }
      })
      .catch(() => {});
  },

  recalcIndemnisationInEditModal() {
    const vol = parseInt(document.getElementById('adm-evt-volunteers')?.value || '8', 10);
    const dur = parseInt(document.getElementById('adm-evt-duration')?.value || '6', 10);
    const veh = (document.getElementById('adm-evt-vehicles')?.value || '').split(',');
    if (window.ProtecMultiplayer) {
      const calc = window.ProtecMultiplayer.calculateEventIndemnisation(vol, dur, veh);
      const rewInput = document.getElementById('adm-evt-reward');
      if (rewInput) rewInput.value = calc.total;
      if (window.game) window.game.showToast('Indemnisation Recalculée', `Total : ${calc.total} € (${vol} sec. × ${dur}h × 15€ + moyens)`, 'blue');
    }
  },

  previewBadgeInEditModal() {
    const url = document.getElementById('adm-badge-url')?.value.trim() || '';
    const thumb = document.getElementById('adm-badge-preview-thumb');
    if (!thumb) return;
    if (url.length > 5) {
      thumb.innerHTML = `<img src="${url}" class="w-full h-full object-cover" onerror="this.parentElement.textContent='Erreur';" />`;
    } else {
      thumb.textContent = 'Aperçu';
    }
  },

  updateRarityInEditModal() {
    const access = document.getElementById('adm-badge-access-type')?.value || 'evenement_special';
    const units = parseInt(document.getElementById('adm-badge-units')?.value || '4', 10);
    const badgeEl = document.getElementById('adm-badge-rarity-badge');
    if (!badgeEl || !window.ProtecMultiplayer) return;

    const rarity = window.ProtecMultiplayer.calculateBadgeRarity(access, units);
    badgeEl.textContent = `${rarity.tier} (⭐ ${rarity.score}/100)`;
    badgeEl.className = `px-2.5 py-0.5 rounded-full text-[10px] font-black border ${rarity.color}`;
  },

  saveEventEdit(eventId) {
    const ev = (this.eventsCache || []).find(e => e.id === eventId);
    if (!ev) return;

    const title = document.getElementById('adm-evt-title')?.value.trim() || ev.title;
    const category = document.getElementById('adm-evt-category')?.value.trim() || ev.category;
    const address = document.getElementById('adm-evt-address')?.value.trim() || ev.address;
    const city = document.getElementById('adm-evt-city')?.value.trim() || ev.city;
    const lat = parseFloat(document.getElementById('adm-evt-lat')?.value || ev.lat || 48.8566);
    const lng = parseFloat(document.getElementById('adm-evt-lng')?.value || ev.lng || 2.3522);
    const volunteers = parseInt(document.getElementById('adm-evt-volunteers')?.value || ev.requiredVolunteers, 10);
    const duration = parseInt(document.getElementById('adm-evt-duration')?.value || ev.durationHours, 10);
    const reward = parseInt(document.getElementById('adm-evt-reward')?.value || ev.rewardMoney, 10);
    const vehicles = (document.getElementById('adm-evt-vehicles')?.value || '').split(',').map(v => v.trim()).filter(Boolean);
    const status = document.getElementById('adm-evt-status')?.value || ev.status;

    const badgeName = document.getElementById('adm-badge-name')?.value.trim() || ev.badge?.name;
    const badgeUrl = document.getElementById('adm-badge-url')?.value.trim() || '';
    const badgeAccess = document.getElementById('adm-badge-access-type')?.value || 'evenement_special';
    const badgeUnits = parseInt(document.getElementById('adm-badge-units')?.value || '4', 10);

    const rarity = window.ProtecMultiplayer ? window.ProtecMultiplayer.calculateBadgeRarity(badgeAccess, badgeUnits) : { score: 85, tier: 'Très Rare', color: 'bg-purple-100 text-purple-800' };

    const updatedBadge = {
      ...(ev.badge || {}),
      name: badgeName,
      imageUrl: badgeUrl,
      accessType: badgeAccess,
      availableUnits: badgeUnits,
      rarityScore: rarity.score,
      rarityTier: rarity.tier,
      rarityColor: rarity.color,
      desc: rarity.desc
    };

    const updatedData = {
      title,
      category,
      address,
      locationName: address.split(',')[0] || address,
      city,
      lat,
      lng,
      requiredVolunteers: volunteers,
      durationHours: duration,
      rewardMoney: reward,
      requiredVehicles: vehicles.length > 0 ? vehicles : ev.requiredVehicles,
      status,
      badge: updatedBadge
    };

    if (window.ProtecMultiplayer && window.game) {
      window.ProtecMultiplayer.updateCommunityEvent(window.game, eventId, updatedData);
    }

    Object.assign(ev, updatedData);
    const modal = document.getElementById('admin-edit-event-modal');
    if (modal) modal.classList.add('hidden');

    if (window.game) window.game.showToast('Événement Mis à Jour !', `Toutes les informations de « ${title} » ont été enregistrées avec succès.`, 'green');
    this.renderEventsTable();
  },

  approveEvent(eventId) {
    if (window.ProtecMultiplayer && window.game) {
      window.ProtecMultiplayer.approveCommunityEvent(window.game, eventId);
      const ev = this.eventsCache.find(e => e.id === eventId);
      if (ev) ev.status = 'open';
      this.renderEventsTable();
    }
  },

  async promptRejectEvent(eventId) {
    const reason = await window.ProtecDialog.prompt(
      "Précisez le motif du refus (ex: effectif irréaliste, intitulé non conforme...) :",
      "Critères de sécurité non respectés",
      "Refus d'Événement Communautaire",
      { confirmText: 'Refuser l’événement', isDestructive: true }
    );
    if (reason !== null && reason.trim()) {
      if (window.ProtecMultiplayer && window.game) {
        window.ProtecMultiplayer.rejectCommunityEvent(window.game, eventId, reason.trim());
        const ev = this.eventsCache.find(e => e.id === eventId);
        if (ev) {
          ev.status = 'rejected';
          ev.rejectionReason = reason.trim();
        }
        this.renderEventsTable();
      }
    }
  },

  closeAdminModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  async loadAdminData(game) {
    const tableBody = document.getElementById('admin-players-tbody');
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-xs text-slate-500 font-semibold animate-pulse">Chargement de la base de données des directeurs...</td></tr>`;
    }

    try {
      // 1. Récupération des stats globales
      let statsLoaded = false;
      try {
        const statsRes = await fetch('/api/admin/stats', { headers: this.getAuthHeaders() });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          this.renderStats(statsData.stats);
          statsLoaded = true;
        }
      } catch (e) {}

      // 2. Récupération et Déduplication des utilisateurs (Serveur Local + Supabase Cloud + Compte Joueur Actif)
      const usersMap = new Map();

      // Fonction d'ajout ou de fusion stricte par ID ou par Pseudo insensible à la casse
      const addOrMergeUser = (u) => {
        if (!u) return;
        const cleanName = (u.username || '').trim().toLowerCase();
        const candidateId = u.id ? String(u.id).trim() : '';
        if (!cleanName && !candidateId) return;

        // Chercher une entrée existante par son ID ou son pseudo (insensible à la casse)
        let matchedKey = null;
        for (const [key, existing] of usersMap.entries()) {
          const exName = (existing.username || '').trim().toLowerCase();
          const exId = existing.id ? String(existing.id).trim() : '';
          if ((candidateId && exId && candidateId === exId) || (cleanName && exName && cleanName === exName)) {
            matchedKey = key;
            break;
          }
        }

        if (matchedKey) {
          const ex = usersMap.get(matchedKey);
          // Si le nouveau candidat a un vrai UUID Supabase, on remplace l'id fictif (ex: usr_admin_master)
          const isCandidateUUID = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(candidateId);
          const finalId = isCandidateUUID ? candidateId : (ex.id || candidateId);

          usersMap.set(matchedKey, {
            ...ex,
            ...u,
            id: finalId,
            username: u.username || ex.username,
            role: (u.role === 'admin' || ex.role === 'admin') ? 'admin' : (u.role || ex.role),
            money: u.money !== undefined ? u.money : ex.money,
            volunteersCount: u.volunteersCount !== undefined ? u.volunteersCount : ex.volunteersCount,
            vehiclesCount: u.vehiclesCount !== undefined ? u.vehiclesCount : ex.vehiclesCount,
            timeTracking: u.timeTracking || ex.timeTracking,
            platformStats: u.platformStats || ex.platformStats || u.saveData?.platformStats || ex.saveData?.platformStats || null,
            lastDevice: u.lastDevice || ex.lastDevice || u.saveData?.lastDevice || ex.saveData?.lastDevice || null,
            saveData: u.saveData || ex.saveData || null,
            lastSaved: u.lastSaved || ex.lastSaved,
            isLocalPlayer: ex.isLocalPlayer || u.isLocalPlayer
          });
        } else {
          const entryKey = cleanName || candidateId;
          usersMap.set(entryKey, {
            ...u,
            id: candidateId,
            platformStats: u.platformStats || u.saveData?.platformStats || null,
            lastDevice: u.lastDevice || u.saveData?.lastDevice || null,
            saveData: u.saveData || null
          });
        }
      };

      // A. Récupération depuis le serveur local Node.js
      try {
        const usersRes = await fetch('/api/admin/users', { headers: this.getAuthHeaders() });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          (usersData.users || []).forEach(u => addOrMergeUser(u));
        }
      } catch (e) {}

      // B. Récupération depuis Supabase Cloud (comptes en ligne persistés officiels)
      if (window.ProtecSupabase && window.ProtecSupabase.getAllPlayersForAdmin) {
        try {
          const supaPlayers = await window.ProtecSupabase.getAllPlayersForAdmin();
          if (Array.isArray(supaPlayers)) {
            supaPlayers.forEach(p => addOrMergeUser(p));
          }
        } catch (supaErr) {
          console.warn('Erreur lecture Supabase admin players:', supaErr);
        }
      }

      // C. Injection / Rafraîchissement du Compte Joueur Actif de la session en cours
      const activePlayerId = game?.player?.id || window.ProtecAuth?.currentUser?.id || localStorage.getItem('protec_player_id');
      const activePlayerName = game?.player?.name || window.ProtecAuth?.currentUser?.username || localStorage.getItem('protec_player_name');

      if (activePlayerId || activePlayerName) {
        const primaryStation = (game?.stations && game.stations[0]) || null;
        const currentMoney = (game?.resources?.money !== undefined) ? game.resources.money : ((game?.resources?.budget !== undefined) ? game.resources.budget : 40000);
        const currentVolunteers = game?.volunteers?.length || 4;
        const currentVehicles = game?.vehicles?.length || 1;
        const currentMissions = game?.missions?.length || 0;
        const currentCity = primaryStation?.city || window.ProtecAuth?.currentUser?.city || game?.currentCityKey || 'Paris';
        const currentStationName = primaryStation?.name || window.ProtecAuth?.currentUser?.stationName || 'Antenne Protection Civile';
        const currentDept = primaryStation?.departmentCode || game?.player?.departmentCode || window.ProtecAuth?.currentUser?.departmentCode || '75';

        addOrMergeUser({
          id: activePlayerId,
          username: activePlayerName || 'Directeur d’Antenne',
          role: game?.player?.role || window.ProtecAuth?.currentUser?.role || 'directeur',
          isBanned: false,
          stationName: currentStationName,
          city: currentCity,
          departmentCode: currentDept,
          money: currentMoney,
          volunteersCount: currentVolunteers,
          vehiclesCount: currentVehicles,
          stationsCount: (game?.stations && game.stations.length) || 1,
          missionsCount: currentMissions,
          reputationScore: game?.resources?.reputationScore || 50,
          timeTracking: game?.connectionTimeTracker ? {
            activeSeconds: game.connectionTimeTracker.activeSeconds || 0,
            idleSeconds: game.connectionTimeTracker.idleSeconds || 0,
            lastSeen: Date.now()
          } : null,
          platformStats: window.ProtecPlatformAnalytics?.recordSession(game?.player, game) || game?.platformStats || null,
          lastDevice: window.ProtecPlatformAnalytics?.getCurrentDevice() || game?.lastDevice || null,
          saveData: game ? {
            resources: game.resources,
            vehicles: game.vehicles,
            missions: game.missions,
            samuConvention: game.samuConvention,
            sdisConvention: game.sdisConvention,
            sdisGarde: game.sdisGarde,
            sncfConvention: game.sncfConvention,
            cumpConvention: game.cumpConvention,
            pcsConventions: game.pcsConventions,
            aascConvention: game.aascConvention,
            prefectureState: game.prefectureState,
            stations: game.stations,
            volunteers: game.volunteers
          } : null,
          lastSaved: Date.now(),
          isLocalPlayer: true
        });
      }

      this.usersCache = Array.from(usersMap.values());
      const usersLoaded = this.usersCache.length > 0;

      // Recalcul des statistiques avec tous les joueurs fusionnés
      this.renderStats({
        totalUsers: this.usersCache.length,
        activeOnline: this.usersCache.filter(p => p.isLocalPlayer || (p.timeTracking && (Date.now() - (p.timeTracking.lastSeen || 0) < 120000))).length || 1,
        totalSavedGames: this.usersCache.filter(p => p.lastSaved).length,
        alliancesCount: 1
      });

      if (usersLoaded) {
        this.renderUsersTable(game);
        this.scanForSuspiciousActivities();
        this.updateReferralFraudBadge();
      } else {
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-xs text-rose-600 font-bold">Impossible de charger les données des directeurs. Vérifiez la connexion serveur ou Supabase.</td></tr>`;
        }
      }
    } catch (e) {
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-xs text-rose-500 font-semibold">Erreur de communication avec la BDD.</td></tr>`;
      }
    }
  },

  renderStats(stats) {
    if (!stats) return;
    const sUsers = document.getElementById('admin-stat-total-users');
    const sOnline = document.getElementById('admin-stat-online');
    const sSaves = document.getElementById('admin-stat-saves');
    const sAlliances = document.getElementById('admin-stat-alliances');

    if (sUsers) sUsers.textContent = stats.totalUsers || 0;
    if (sOnline) sOnline.textContent = stats.activeOnline || 0;
    if (sSaves) sSaves.textContent = stats.totalSavedGames || 0;
    if (sAlliances) sAlliances.textContent = stats.alliancesCount || 0;
  },

  renderUsersTable(game) {
    const tableBody = document.getElementById('admin-players-tbody');
    if (!tableBody) return;

    // Mise à jour du bandeau Analytics Global
    const analyticsContainer = document.getElementById('admin-global-platform-analytics-container');
    if (analyticsContainer && window.ProtecPlatformAnalytics) {
      analyticsContainer.innerHTML = window.ProtecPlatformAnalytics.renderGlobalPlatformAnalyticsHTML(this.usersCache);
      if (this.isAnalyticsCollapsed) {
        analyticsContainer.classList.add('hidden');
      }
    }

    const term = (this.searchFilter || '').toLowerCase();
    const filtered = this.usersCache.filter(u =>
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.stationName && u.stationName.toLowerCase().includes(term)) ||
      (u.city && u.city.toLowerCase().includes(term))
    );

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" class="p-6 text-center text-xs text-slate-400 font-semibold">Aucun joueur ne correspond à la recherche.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map(u => {
      const isCurrentPlayer = !!(
        u.isLocalPlayer ||
        (game && game.player && (game.player.id === u.id || (game.player.name && u.username && game.player.name.toLowerCase() === u.username.toLowerCase()))) ||
        (window.ProtecAuth?.currentUser && (window.ProtecAuth.currentUser.id === u.id || (window.ProtecAuth.currentUser.username && u.username && window.ProtecAuth.currentUser.username.toLowerCase() === u.username.toLowerCase())))
      );
      const isOnline = isCurrentPlayer || !!(game && game.player && game.player.id === u.id) || (u.timeTracking && (Date.now() - (u.timeTracking.lastSeen || 0) < 120000));
      const isBanned = u.isBanned;
      const isAdmin = u.role === 'admin';

      // Support & Détection Plateforme du joueur
      const stats = u.platformStats || u.saveData?.platformStats || null;
      const dev = u.lastDevice || u.saveData?.lastDevice || stats?.lastDevice || (isCurrentPlayer && window.ProtecPlatformAnalytics ? window.ProtecPlatformAnalytics.getCurrentDevice() : null);
      const isInstalled = Boolean((dev && dev.isInstalled) || (stats && stats.installations?.installed > 0));
      const curPlatform = dev?.platform || (stats && Object.keys(stats.platforms || {})[0]) || 'Inconnu';
      const curStyle = window.ProtecPlatformAnalytics ? window.ProtecPlatformAnalytics.getPlatformStyle(curPlatform) : { icon: '💻' };

      // Calcul des durées de connexion
      const tt = u.timeTracking || {};
      const actSec = Number(tt.activeSeconds || 0);
      const idleSec = Number(tt.idleSeconds || 0);
      const totalSec = actSec + idleSec;

      const formatSec = (sec) => {
        if (!sec || sec < 60) return `${sec || 0}s`;
        const m = Math.floor(sec / 60);
        if (m < 60) return `${m}m`;
        const h = Math.floor(m / 60);
        return `${h}h ${m % 60}m`;
      };

      const activeStr = formatSec(actSec);
      const idleStr = formatSec(idleSec);

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/70 transition text-xs ${isCurrentPlayer ? 'bg-indigo-50/40' : ''}">
          <!-- Nom & Statut -->
          <td class="py-3 px-3">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-xl ${isAdmin ? 'bg-indigo-100 text-indigo-700 font-black' : (isCurrentPlayer ? 'bg-emerald-100 text-emerald-700 font-black' : 'bg-slate-100 text-slate-700 font-bold')} flex items-center justify-center text-[10px]">
                ${isAdmin ? '👑' : (isCurrentPlayer ? '⭐' : '👤')}
              </div>
              <div>
                <div class="font-extrabold text-slate-800 flex items-center gap-1.5 flex-wrap">
                  ${u.username}
                  ${isCurrentPlayer ? '<span class="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded-full font-black">Mon Compte</span>' : ''}
                  ${isAdmin ? '<span class="text-[9px] bg-indigo-100 text-indigo-800 px-1 py-0.2 rounded font-black">ADMIN</span>' : ''}
                  ${isBanned ? '<span class="text-[9px] bg-red-100 text-red-800 px-1 py-0.2 rounded font-black">BANNI</span>' : ''}
                </div>
                <div class="text-[10px] text-slate-400 font-mono">ID: ${u.id ? (u.id.substring(0, 12) + (u.id.length > 12 ? '...' : '')) : 'local'}</div>
              </div>
            </div>
          </td>

          <!-- Antenne & Ville -->
          <td class="py-3 px-3">
            <div class="font-semibold text-slate-700">${u.stationName}</div>
            <div class="text-[10px] text-slate-400 uppercase font-bold">${u.city} (${u.departmentCode || 'FR'})</div>
          </td>

          <!-- Support & App (Statut d'Installation & Plateforme) -->
          <td class="py-3 px-3">
            <div class="flex items-center gap-1.5 flex-wrap">
              ${isInstalled ? `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-[10px] border border-emerald-300 shadow-xs" title="Application installée sur ${curPlatform}">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>📱 App (${curPlatform})</span>
                </span>
              ` : `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200" title="Navigateur Web sur ${curPlatform}">
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>🌐 Web (${curPlatform})</span>
                </span>
              `}
              <button onclick="window.ProtecAdmin.showPlayerPlatformModal('${u.id}')" title="Voir le graphique des plateformes de ce joueur" class="px-1.5 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[10px] border border-indigo-200 transition cursor-pointer flex items-center gap-0.5">
                📊
              </button>
            </div>
          </td>

          <!-- Temps de Connexion (Actif vs Veille) -->
          <td class="py-3 px-3">
            <div class="flex items-center gap-1.5">
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]" title="Temps actif (onglet au premier plan)">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Actif: ${activeStr}
              </span>
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px]" title="Temps en veille (onglet en arrière-plan)">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Veille: ${idleStr}
              </span>
            </div>
          </td>

          <!-- Trésorerie -->
          <td class="py-3 px-3 font-extrabold text-emerald-600 mono-num">
            ${Number(u.money || 0).toLocaleString('fr-FR')} €
          </td>

          <!-- Avancement & Moyens -->
          <td class="py-3 px-3 text-slate-600">
            <div class="font-bold text-slate-800">${u.volunteersCount || 0} sec. • ${u.vehiclesCount || 0} véh.</div>
            <div class="text-[10px] text-slate-400">${u.missionsCount || 0} missions • Réput: ${u.reputationScore || 50}/100</div>
          </td>

          <!-- Dernière Sauvegarde -->
          <td class="py-3 px-3 text-[10px] text-slate-400">
            ${u.lastSaved ? new Date(u.lastSaved).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'Jamais'}
          </td>

          <!-- Statut Compte -->
          <td class="py-3 px-3">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isBanned ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}">
              ${isBanned ? 'Suspendu' : 'Actif'}
            </span>
          </td>

          <!-- Actions d'administration -->
          <td class="py-3 px-3 text-right">
            <div class="flex items-center justify-end gap-1">
              <!-- Tester Notifications Joueur -->
              <button onclick="window.ProtecAdmin.openNotificationTester('${u.id}')" title="Envoyer une Notification Test (Push Mobile OS - Fonctionne même application fermée !)" class="p-1 rounded-lg text-amber-600 hover:bg-amber-100 transition cursor-pointer font-bold relative">
                🔔
                ${u.hasPushSubscription ? '<span class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white animate-pulse" title="Push Mobile Actif (App Fermée)"></span>' : ''}
              </button>
              <!-- Gérer & Attribuer Écussons (Admin, Zones de Défense...) -->
              <button onclick="window.ProtecAdmin.openBadgeManagerForPlayer('${u.id}')" title="Gérer & Attribuer les Écussons (Admin, Zones de Défense...)" class="p-1 rounded-lg text-pc-blue hover:bg-blue-100 transition cursor-pointer font-bold">
                🛡️
              </button>
              <!-- Modifier Pseudo -->
              <button onclick="window.ProtecAdmin.promptEditUsername('${u.id}', '${u.username}')" title="Modifier le Pseudo" class="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer">
                ✏️
              </button>
              <!-- +10k € rapide -->
              <button onclick="window.ProtecAdmin.quickAddMoney('${u.id}', 10000)" title="+10 000 €" class="px-2 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer">
                +10k€
              </button>
              <!-- Modifier trésorerie -->
              <button onclick="window.ProtecAdmin.promptEditMoney('${u.id}', ${u.money || 0})" title="Changer Trésorerie" class="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer">
                💶
              </button>
              <!-- Réinitialiser MdP -->
              <button onclick="window.ProtecAdmin.promptResetPassword('${u.id}', '${u.username}')" title="Réinitialiser Mot de passe" class="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer">
                🔑
              </button>
              <!-- Support Flotte & Missions -->
              <button onclick="window.ProtecAdmin.openSupportForPlayer('${u.id}')" title="Dépanner Véhicules & Missions" class="p-1 rounded-lg text-amber-600 hover:bg-amber-50 transition cursor-pointer">
                🛠️
              </button>
              <!-- Bannir / Débannir -->
              <button onclick="window.ProtecAdmin.toggleBan('${u.id}', ${!isBanned})" title="${isBanned ? 'Débannir' : 'Bannir'}" class="px-2 py-1 rounded-lg text-[10px] font-bold ${isBanned ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} transition cursor-pointer">
                ${isBanned ? 'Débannir' : 'Bannir'}
              </button>
              <!-- Rôle Admin -->
              <button onclick="window.ProtecAdmin.toggleAdminRole('${u.id}', '${isAdmin ? 'user' : 'admin'}')" title="Changer Rôle" class="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 transition cursor-pointer">
                👑
              </button>
              <!-- Supprimer joueur -->
              <button onclick="window.ProtecAdmin.confirmDeleteUser('${u.id}', '${u.username}')" title="Supprimer joueur" class="p-1 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  onSearchInput(val) {
    this.searchFilter = val;
    this.renderUsersTable(window.game);
  },

  async promptEditUsername(userId, currentUsername) {
    const newName = await window.ProtecDialog.prompt(
      `Modifier le pseudo de ${currentUsername} (min. 3 caractères) :`,
      currentUsername,
      'Changement de Pseudo',
      { inputType: 'text', placeholder: 'Nouveau pseudo...' }
    );
    if (newName && newName.trim().length >= 3 && newName.trim() !== currentUsername) {
      await this.updateUser(userId, { newUsername: newName.trim() }, `Pseudo mis à jour en « ${newName.trim()} »`);
    }
  },

  async quickAddMoney(userId, amount) {
    const user = this.usersCache.find(u => u.id === userId);
    if (!user) return;
    const newAmount = Number(user.money || 0) + amount;
    await this.updateUser(userId, { money: newAmount }, `+${amount} € crédités à ${user.username}`);
  },

  async promptEditMoney(userId, currentMoney) {
    const user = this.usersCache.find(u => u.id === userId);
    if (!user) return;
    const input = await window.ProtecDialog.prompt(
      `Définir la trésorerie de ${user.username} (actuel : ${currentMoney} €) :`,
      currentMoney,
      'Modification Trésorerie',
      { inputType: 'number', confirmText: 'Enregistrer' }
    );
    if (input !== null && !isNaN(input)) {
      await this.updateUser(userId, { money: Number(input) }, `Trésorerie de ${user.username} fixée à ${input} €`);
    }
  },

  async promptResetPassword(userId, username) {
    const newPwd = await window.ProtecDialog.prompt(
      `Nouveau mot de passe pour ${username} (min. 4 car.) :`,
      '',
      'Réinitialisation Mot de Passe',
      { inputType: 'text', placeholder: 'Nouveau mot de passe...' }
    );
    if (newPwd && newPwd.trim().length >= 4) {
      await this.updateUser(userId, { newPassword: newPwd.trim() }, `Mot de passe de ${username} réinitialisé.`);
    }
  },

  async toggleBan(userId, shouldBan) {
    const user = this.usersCache.find(u => u.id === userId);
    if (!user) return;
    const confirmed = await window.ProtecDialog.confirm(
      `Confirmez-vous la suspension du compte de ${user.username} ?`,
      'Suspension de Compte',
      { isDestructive: true, confirmText: 'Confirmer la suspension', cancelText: 'Annuler' }
    );
    if (confirmed) {
      await this.updateUser(userId, { isBanned: shouldBan }, shouldBan ? `${user.username} a été banni.` : `${user.username} a été réactivé.`);
    }
  },

  async toggleAdminRole(userId, newRole) {
    const user = this.usersCache.find(u => u.id === userId);
    if (!user) return;
    await this.updateUser(userId, { role: newRole }, `Rôle de ${user.username} changé en ${newRole}.`);
  },

  async updateUser(userId, payload, successToast) {
    let success = false;
    try {
      const res = await fetch('/api/admin/user/update', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ userId, ...payload })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) success = true;
      }
    } catch (e) {}

    // Fallback Supabase si le backend Node est hors ligne
    if (!success && window.ProtecSupabase && window.ProtecSupabase.updatePlayerByAdmin) {
      const supaRes = await window.ProtecSupabase.updatePlayerByAdmin(userId, {
        username: payload.newUsername,
        role: payload.role,
        isBanned: payload.isBanned,
        stationName: payload.stationName,
        city: payload.city,
        newPassword: payload.newPassword,
        money: payload.money,
        saveData: payload.saveData
      });
      if (supaRes.success) success = true;
    }

    // Répercussion immédiate sur l'instance de jeu locale si l'utilisateur modifié est le joueur en cours
    if (window.game) {
      const g = window.game;
      const isCur = (g.player && g.player.id === userId) || (window.ProtecAuth?.currentUser && window.ProtecAuth.currentUser.id === userId);
      if (isCur) {
        if (payload.money !== undefined && g.resources) {
          g.resources.money = Number(payload.money);
          g.resources.budget = Number(payload.money);
          g.resources.funds = Number(payload.money);
          if (typeof g.updateHeader === 'function') g.updateHeader();
        }
        if (payload.newUsername && g.player) {
          g.player.name = payload.newUsername;
          if (window.ProtecAuth?.currentUser) window.ProtecAuth.currentUser.username = payload.newUsername;
          if (typeof window.ProtecAuth?.updateHeaderUI === 'function') window.ProtecAuth.updateHeaderUI();
        }
        if (payload.role && g.player) {
          g.player.role = payload.role;
          if (window.ProtecAuth?.currentUser) window.ProtecAuth.currentUser.role = payload.role;
        }
        if (payload.saveData) {
          if (payload.saveData.resources?.agrements && g.resources) {
            g.resources.agrements = { ...payload.saveData.resources.agrements };
          }
          if (payload.saveData.prefectureState) {
            g.prefectureState = { ...payload.saveData.prefectureState };
          }
          if (payload.saveData.samuConvention) g.samuConvention = { ...payload.saveData.samuConvention };
          if (payload.saveData.sdisConvention) g.sdisConvention = { ...payload.saveData.sdisConvention };
          if (payload.saveData.sncfConvention) g.sncfConvention = { ...payload.saveData.sncfConvention };
          if (payload.saveData.cumpConvention) g.cumpConvention = { ...payload.saveData.cumpConvention };
          if (payload.saveData.aascConvention) g.aascConvention = { ...payload.saveData.aascConvention };
          if (payload.saveData.vehicles && Array.isArray(payload.saveData.vehicles)) g.vehicles = [...payload.saveData.vehicles];
          if (payload.saveData.missions && Array.isArray(payload.saveData.missions)) g.missions = [...payload.saveData.missions];
        }
        if (typeof g.saveGame === 'function') g.saveGame(true);
        success = true;
      }
    }

    if (success) {
      if (window.game) window.game.showToast('Administration', successToast || 'Modifications enregistrées en BDD.', 'green');
      await this.loadAdminData(window.game);
    } else {
      await window.ProtecDialog.alert('Erreur lors de la modification du joueur.', 'Erreur Administration');
    }
  },

  async confirmDeleteUser(userId, username) {
    const confirmed = await window.ProtecDialog.confirm(
      `ATTENTION : Voulez-vous définitivement supprimer le compte de ${username} et toutes ses données de jeu ? Cette action est irréversible.`,
      'Suppression Définitive de Joueur',
      { isDestructive: true, confirmText: 'Supprimer Définitivement', cancelText: 'Annuler' }
    );
    if (!confirmed) {
      return;
    }

    let success = false;
    try {
      const res = await fetch('/api/admin/user/delete', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) success = true;
      }
    } catch (e) {}

    if (!success && window.ProtecSupabase && window.ProtecSupabase.deletePlayerByAdmin) {
      const supaDel = await window.ProtecSupabase.deletePlayerByAdmin(userId);
      if (supaDel.success) success = true;
    }

    if (success) {
      if (window.game) window.game.showToast('Joueur Supprimé', `Le compte de ${username} a été purgé de la BDD.`, 'blue');
      await this.loadAdminData(window.game);
    } else {
      await window.ProtecDialog.alert('Erreur lors de la suppression.', 'Erreur Suppression');
    }
  },

  // =========================================================================
  // GESTION DES ANNONCES & MESSAGES FLASH EN TEMPS RÉEL
  // =========================================================================
  broadcastsHistory: [],

  async handlePublishAnnouncement(e) {
    e.preventDefault();
    const titleInput = document.getElementById('adm-ann-title');
    const catSelect = document.getElementById('adm-ann-category');
    const msgInput = document.getElementById('adm-ann-message');
    const popupCheck = document.getElementById('adm-ann-popup');

    if (!titleInput || !msgInput) return;
    const title = titleInput.value.trim();
    const message = msgInput.value.trim();
    const category = catSelect ? catSelect.value : 'update';
    const showPopup = popupCheck ? popupCheck.checked : true;

    if (!title || !message) return;

    const payload = {
      title,
      message,
      category,
      showPopup,
      type: category === 'urgent' ? 'red' : (category === 'maintenance' ? 'orange' : 'blue'),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('fr-FR')
    };

    let sent = false;
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) sent = true;
    } catch (e) {}

    // Diffusion via Supabase Realtime si connecté
    if (window.ProtecSupabase && window.ProtecSupabase.broadcastAdminAnnouncement) {
      window.ProtecSupabase.broadcastAdminAnnouncement(payload);
      sent = true;
    }

    // Affichage local immédiat pour l'administrateur
    if (window.game && window.game.handleMultiplayerEvent) {
      window.game.handleMultiplayerEvent('admin_broadcast', payload);
    }

    this.broadcastsHistory.unshift(payload);
    this.renderBroadcastHistory();

    titleInput.value = '';
    msgInput.value = '';

    if (window.game) window.game.showToast('Annonce Diffusée !', `L'annonce « ${title} » a été transmise à tous les joueurs connectés.`, 'green');
  },

  renderBroadcastHistory() {
    const container = document.getElementById('admin-broadcast-history');
    if (!container) return;

    if (this.broadcastsHistory.length === 0) {
      container.innerHTML = `<div class="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] italic">Aucune annonce diffusée durant cette session.</div>`;
      return;
    }

    container.innerHTML = this.broadcastsHistory.map(b => `
      <div class="p-3 rounded-xl border border-slate-200 bg-white shadow-xs flex items-start justify-between gap-2">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase ${b.category === 'urgent' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'}">
              ${b.category}
            </span>
            <span class="text-[10px] text-slate-400 font-semibold">${b.date} à ${b.timestamp}</span>
          </div>
          <div class="font-bold text-slate-800 text-xs">${b.title}</div>
          <p class="text-[11px] text-slate-600 mt-0.5 leading-snug">${b.message}</p>
        </div>
        <span class="text-xs">📢</span>
      </div>
    `).join('');
  },

  displayBroadcastPopup(data) {
    if (!data.showPopup && data.category !== 'urgent') return;

    let pop = document.getElementById('admin-broadcast-modal');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'admin-broadcast-modal';
      pop.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in';
      document.body.appendChild(pop);
    }

    const catLabels = {
      update: { label: 'Mise à Jour Déployée', icon: '🚀', color: 'bg-indigo-600', text: 'text-indigo-600' },
      event: { label: 'Événement Fédéral Spécial', icon: '🎪', color: 'bg-purple-600', text: 'text-purple-600' },
      maintenance: { label: 'Maintenance du Réseau', icon: '🛠️', color: 'bg-amber-600', text: 'text-amber-600' },
      urgent: { label: 'Ordre Fédéral & Consigne Urgente', icon: '🚨', color: 'bg-rose-600', text: 'text-rose-600' }
    };

    const cfg = catLabels[data.category] || catLabels.update;

    pop.innerHTML = `
      <div class="w-full max-w-lg rounded-3xl bg-white border-2 border-indigo-500/40 p-6 shadow-2xl relative text-left">
        <div class="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <div class="w-12 h-12 rounded-2xl ${cfg.color} text-white flex items-center justify-center text-2xl shadow-md">
            ${cfg.icon}
          </div>
          <div>
            <span class="text-[10px] font-black uppercase tracking-wider ${cfg.text}">${cfg.label}</span>
            <h3 class="text-base font-black text-slate-900 leading-tight">${data.title}</h3>
            <span class="text-[10px] text-slate-400 font-semibold">${data.date || 'Aujourd’hui'} à ${data.timestamp || 'Direct'}</span>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5">
          <p class="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">${data.message}</p>
        </div>

        <div class="flex items-center justify-end">
          <button onclick="document.getElementById('admin-broadcast-modal').remove()" class="px-5 py-2.5 rounded-xl ${cfg.color} text-white font-black text-xs hover:brightness-110 shadow-md transition cursor-pointer">
            J'ai pris connaissance
          </button>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // DÉTECTION DES MOUVEMENTS SUSPECTS & ANTI-TRICHE
  // =========================================================================
  suspiciousAlerts: [],

  scanForSuspiciousActivities() {
    this.suspiciousAlerts = [];
    const users = this.usersCache || [];

    users.forEach(u => {
      const money = Number(u.money || 0);
      const missions = Number(u.missionsCount || 0);
      const volunteers = Number(u.volunteersCount || 0);
      const vehicles = Number(u.vehiclesCount || 0);
      const tt = u.timeTracking || {};
      const totalSec = Number(tt.activeSeconds || 0) + Number(tt.idleSeconds || 0);

      // Règle 1 : Trésorerie massive avec peu de missions et peu d'heures de jeu
      if (money > 60000 && missions < 5) {
        this.suspiciousAlerts.push({
          id: `susp-${u.id}-money`,
          userId: u.id,
          username: u.username,
          type: 'money_spike',
          severity: 'critical',
          title: 'Trésorerie Anormale',
          description: `Solde de ${money.toLocaleString('fr-FR')} € avec seulement ${missions} mission(s) réalisée(s).`,
          recommendation: 'Inspecter ou réajuster le solde à 15 000 €.'
        });
      }

      // Règle 2 : Flotte démesurée sans base financière
      if (vehicles > 6 && missions < 3) {
        this.suspiciousAlerts.push({
          id: `susp-${u.id}-fleet`,
          userId: u.id,
          username: u.username,
          type: 'fleet_spike',
          severity: 'warning',
          title: 'Flotte Véhicules Incohérente',
          description: `${vehicles} véhicules déclarés avec ${missions} mission(s) effectuée(s).`,
          recommendation: 'Vérifier la sauvegarde dans l’onglet Support.'
        });
      }

      // Règle 3 : Temps de jeu extrêmement faible avec progression majeure
      if (money > 35000 && totalSec < 300 && totalSec > 0) {
        this.suspiciousAlerts.push({
          id: `susp-${u.id}-speed`,
          userId: u.id,
          username: u.username,
          type: 'fast_progress',
          severity: 'high',
          title: 'Progression Éclair Suspecte',
          description: `Gain rapide de fonds en moins de 5 minutes de connexion (${totalSec}s).`,
          recommendation: 'Surveiller les logs ou réinitialiser le compte.'
        });
      }
    });

    this.renderSuspiciousAlerts();
  },

  renderSuspiciousAlerts() {
    const list = document.getElementById('admin-suspicion-list');
    const badge = document.getElementById('admin-suspicion-badge');
    const countText = document.getElementById('admin-suspicion-count-text');

    const count = this.suspiciousAlerts.length;
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle('hidden', count === 0);
    }
    if (countText) countText.textContent = `${count} alerte(s) détectée(s)`;

    if (!list) return;

    if (count === 0) {
      list.innerHTML = `<div class="p-6 text-center text-xs text-slate-400 italic">Aucun mouvement suspect détecté. Tout est conforme.</div>`;
      return;
    }

    list.innerHTML = this.suspiciousAlerts.map(a => {
      const colorBg = a.severity === 'critical' ? 'bg-rose-50 border-rose-300 text-rose-900' : (a.severity === 'high' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-300 text-slate-900');
      const badgeSev = a.severity === 'critical' ? '<span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white">Critique</span>' : '<span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white">Attention</span>';

      return `
        <div class="p-3.5 rounded-2xl border ${colorBg} shadow-xs space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-lg">🚨</span>
              <strong class="text-xs font-black">${a.title} : ${a.username}</strong>
              ${badgeSev}
            </div>
            <div class="flex items-center gap-1">
              <button onclick="window.ProtecAdmin.openSupportForPlayer('${a.userId}')" class="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-[10px] hover:bg-slate-100 cursor-pointer">
                Inspecter
              </button>
              <button onclick="window.ProtecAdmin.quickAddMoney('${a.userId}', -25000)" class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] cursor-pointer">
                -25k €
              </button>
            </div>
          </div>
          <p class="text-[11px] leading-snug">${a.description} <em class="block text-[10px] opacity-80 mt-0.5">Conseil : ${a.recommendation}</em></p>
        </div>
      `;
    }).join('');
  },

  // =========================================================================
  // OUTILS DE SUPPORT : GESTION DES VÉHICULES ET MISSIONS
  // =========================================================================
  selectedSupportUserId: null,

  renderSupportPlayerSelect() {
    const sel = document.getElementById('adm-support-player-select');
    if (!sel) return;

    const currentVal = sel.value;
    sel.innerHTML = '<option value="">-- Choisir un joueur à assister --</option>' +
      (this.usersCache || []).map(u => `
        <option value="${u.id}" ${u.id === currentVal ? 'selected' : ''}>${u.username} (${u.stationName} • ${Number(u.money || 0).toLocaleString('fr-FR')} €)</option>
      `).join('');
  },

  openSupportForPlayer(userId) {
    this.switchTab('support');
    const sel = document.getElementById('adm-support-player-select');
    if (sel) {
      sel.value = userId;
      this.onSupportPlayerSelected(userId);
    }
  },

  onSupportPlayerSelected(userId) {
    this.selectedSupportUserId = userId;
    this.refreshSupportPlayerView();
  },

  async refreshSupportPlayerView() {
    const container = document.getElementById('adm-support-player-content');
    if (!container) return;

    if (!this.selectedSupportUserId) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400 italic">Sélectionnez un joueur ci-dessus pour inspecter et gérer sa partie.</div>`;
      return;
    }

    const user = (this.usersCache || []).find(u => u.id === this.selectedSupportUserId);
    if (!user) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-rose-500 font-bold">Joueur introuvable.</div>`;
      return;
    }

    // Récupérer la sauvegarde complète
    let sData = user.saveData;
    if (!sData && window.ProtecSupabase) {
      const supaSave = await window.ProtecSupabase.loadGameState(user.id, user.username);
      sData = supaSave ? supaSave.save_data : null;
    }
    if (!sData) sData = {};
    if (!sData.resources) sData.resources = {};
    if (!sData.resources.agrements) sData.resources.agrements = { A: false, B: false, C: false, D: false };
    if (!sData.prefectureState) sData.prefectureState = { trustScore: 85, agrementSuspended: false, warningsCount: 0 };

    const agrements = sData.resources.agrements || { A: false, B: false, C: false, D: false };
    const prefState = sData.prefectureState || { trustScore: 85, agrementSuspended: false, warningsCount: 0 };
    const vehicles = sData.vehicles || [];
    const missions = sData.missions || [];

    // Conventions
    const convAasc = !!sData.aascConvention?.signed;
    const convSamu = !!sData.samuConvention?.signed;
    const convSdis = !!sData.sdisConvention?.signed;
    const convSncf = !!sData.sncfConvention?.signed;
    const convCump = !!sData.cumpConvention?.signed;
    const convPcs = !!sData.pcsConventions?.signed;

    const uDept = user.departmentCode || sData.player?.departmentCode || '75';
    const uCity = user.city || sData.player?.city || '';
    const pompiersAuth = window.ProtecDepartements?.getPompiersAuthority ? window.ProtecDepartements.getPompiersAuthority(uDept, uCity) : { shortName: 'SDIS' };

    // Graphique plateforme individuel
    const platformChartHTML = window.ProtecPlatformAnalytics?.renderPlayerPlatformChartHTML
      ? window.ProtecPlatformAnalytics.renderPlayerPlatformChartHTML(user, 'adm-support-player-platform-chart')
      : '';

    container.innerHTML = `
      <!-- En-tête Directeur -->
      <div class="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div>
          <div class="flex items-center gap-2">
            <h4 class="text-sm font-black text-white">${user.username}</h4>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${user.role === 'admin' ? 'bg-amber-400 text-slate-950' : 'bg-indigo-600 text-white'}">${user.role || 'Directeur'}</span>
          </div>
          <p class="text-[11px] text-slate-300 mt-0.5">Antenne: <strong class="text-white">${user.stationName || 'N/A'}</strong> • Ville: <strong>${user.city || 'N/A'}</strong> • Trésorerie: <strong class="text-emerald-400">${Number(user.money || 0).toLocaleString('fr-FR')} €</strong></p>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button onclick="window.ProtecAdmin.showPlayerPlatformModal('${user.id}')" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] border border-white/20 transition cursor-pointer flex items-center gap-1">
            <span>📊 Stats Support</span>
          </button>
          <button onclick="window.ProtecAdmin.supportClearStuckMissions('${user.id}')" class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] shadow-xs cursor-pointer flex items-center gap-1">
            <span>🧹 Débloquer Missions</span>
          </button>
        </div>
      </div>

      <!-- Graphique du support & plateforme du joueur -->
      ${platformChartHTML}

      <!-- BLOC 1 : GESTION DES AGRÉMENTS DE SÉCURITÉ CIVILE (A, B, C, D) -->
      <div class="border border-slate-200 rounded-2xl p-3.5 bg-white space-y-3 shadow-2xs">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div>
            <span class="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>📜 Agréments de Sécurité Civile (Ministère / Préfecture)</span>
            </span>
            <p class="text-[10px] text-slate-500">Activez ou retirez instantanément les 4 habilitations opérationnelles pour ce directeur.</p>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="window.ProtecAdmin.supportToggleAllAgrements('${user.id}', true)" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer">
              Tout Accorder
            </button>
            <button onclick="window.ProtecAdmin.supportToggleAllAgrements('${user.id}', false)" class="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] cursor-pointer">
              Tout Retirer
            </button>
          </div>
        </div>

        <!-- État préfectoral & Suspension -->
        <div class="p-2.5 rounded-xl ${prefState.agrementSuspended ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50 border border-slate-200'} flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="text-base">${prefState.agrementSuspended ? '⛔' : '🏛️'}</span>
            <div>
              <span class="font-extrabold ${prefState.agrementSuspended ? 'text-rose-800' : 'text-slate-800'}">
                ${prefState.agrementSuspended ? 'Agrément Préfectoral Actuellement SUSPENDU' : 'Agrément Préfectoral en Règle'}
              </span>
              <span class="text-[10px] text-slate-500 block">Score Confiance: <strong>${prefState.trustScore || 85}%</strong> • Avertissements: <strong>${prefState.warningsCount || 0}/3</strong></span>
            </div>
          </div>
          <div>
            ${prefState.agrementSuspended ? `
              <button onclick="window.ProtecAdmin.supportLiftAgrementSuspension('${user.id}', true)" class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] shadow-xs cursor-pointer">
                ✅ Lever la Suspension
              </button>
            ` : `
              <button onclick="window.ProtecAdmin.supportLiftAgrementSuspension('${user.id}', false)" class="px-3 py-1 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 font-bold text-[10px] cursor-pointer">
                ⛔ Suspendre l'Agrément
              </button>
            `}
          </div>
        </div>

        <!-- Grille des 4 agréments A, B, C, D -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <!-- Agrément A -->
          <div class="p-2.5 rounded-xl border ${agrements.A ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'} flex items-center justify-between">
            <div class="pr-2">
              <div class="flex items-center gap-1.5">
                <span class="w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] ${agrements.A ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}">A</span>
                <strong class="text-slate-900 text-xs">Secours à Personnes</strong>
              </div>
              <p class="text-[10px] text-slate-500 mt-0.5">Prompt secours, évacuation d'urgence, missions SAMU</p>
            </div>
            <button onclick="window.ProtecAdmin.supportToggleAgrement('${user.id}', 'A', ${!agrements.A})" class="px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${agrements.A ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'}">
              ${agrements.A ? 'Retirer' : 'Accorder'}
            </button>
          </div>

          <!-- Agrément B -->
          <div class="p-2.5 rounded-xl border ${agrements.B ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'} flex items-center justify-between">
            <div class="pr-2">
              <div class="flex items-center gap-1.5">
                <span class="w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] ${agrements.B ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}">B</span>
                <strong class="text-slate-900 text-xs">Soutien aux Populations</strong>
              </div>
              <p class="text-[10px] text-slate-500 mt-0.5">Hébergement d'urgence, ravitaillement sinistrés, crises</p>
            </div>
            <button onclick="window.ProtecAdmin.supportToggleAgrement('${user.id}', 'B', ${!agrements.B})" class="px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${agrements.B ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'}">
              ${agrements.B ? 'Retirer' : 'Accorder'}
            </button>
          </div>

          <!-- Agrément C -->
          <div class="p-2.5 rounded-xl border ${agrements.C ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'} flex items-center justify-between">
            <div class="pr-2">
              <div class="flex items-center gap-1.5">
                <span class="w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] ${agrements.C ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}">C</span>
                <strong class="text-slate-900 text-xs">Encadrement Bénévoles</strong>
              </div>
              <p class="text-[10px] text-slate-500 mt-0.5">Coordination de bénévoles spontanés en temps de crise</p>
            </div>
            <button onclick="window.ProtecAdmin.supportToggleAgrement('${user.id}', 'C', ${!agrements.C})" class="px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${agrements.C ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'}">
              ${agrements.C ? 'Retirer' : 'Accorder'}
            </button>
          </div>

          <!-- Agrément D -->
          <div class="p-2.5 rounded-xl border ${agrements.D ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'} flex items-center justify-between">
            <div class="pr-2">
              <div class="flex items-center gap-1.5">
                <span class="w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] ${agrements.D ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}">D</span>
                <strong class="text-slate-900 text-xs">Dispositifs de Secours (DPS)</strong>
              </div>
              <p class="text-[10px] text-slate-500 mt-0.5">Postes de secours PAPS, DPS-PE, DPS-ME, DPS-GE</p>
            </div>
            <button onclick="window.ProtecAdmin.supportToggleAgrement('${user.id}', 'D', ${!agrements.D})" class="px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${agrements.D ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'}">
              ${agrements.D ? 'Retirer' : 'Accorder'}
            </button>
          </div>
        </div>
      </div>

      <!-- BLOC 2 : GESTION DES CONVENTIONS OPÉRATIONNELLES -->
      <div class="border border-slate-200 rounded-2xl p-3.5 bg-white space-y-3 shadow-2xs">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div>
            <span class="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>🤝 Conventions Opérationnelles & Partenariats</span>
            </span>
            <p class="text-[10px] text-slate-500">Signer ou résilier les partenariats institutionnels et d'urgence pour cette antenne.</p>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="window.ProtecAdmin.supportSignAllConventions('${user.id}', true)" class="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] cursor-pointer">
              Tout Valider
            </button>
            <button onclick="window.ProtecAdmin.supportSignAllConventions('${user.id}', false)" class="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] cursor-pointer">
              Tout Résilier
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          <!-- Convention AASC -->
          <div class="p-2.5 rounded-xl border ${convAasc ? 'bg-indigo-50/70 border-indigo-300' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between space-y-2">
            <div>
              <div class="flex items-center justify-between">
                <strong class="text-slate-900 text-xs">AASC Préfecture</strong>
                <span class="px-1.5 py-0.5 rounded-md text-[9px] font-black ${convAasc ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}">${convAasc ? 'Signée' : 'Non signée'}</span>
              </div>
              <p class="text-[10px] text-slate-500 mt-0.5 leading-snug">Convention cadre d'Association Agréée de Sécurité Civile.</p>
            </div>
            <button onclick="window.ProtecAdmin.supportToggleConvention('${user.id}', 'aascConvention', ${!convAasc})" class="w-full py-1 rounded-lg font-bold text-[10px] cursor-pointer ${convAasc ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'}">
              ${convAasc ? 'Résilier Convention' : 'Signer Convention'}
            </button>
          </div>

          <!-- Convention SAMU 15 -->
          <div class="p-2.5 rounded-xl border ${convSamu ? 'bg-sky-50/70 border-sky-300' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between space-y-2">
            <div>
              <div class="flex items-center justify-between">
                <strong class="text-slate-900 text-xs">SAMU 15 (Hôpitaux)</strong>
                <span class="px-1.5 py-0.5 rounded-md text-[9px] font-black ${convSamu ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'}">${convSamu ? 'Signée' : 'Non signée'}</span>
              </div>
              <p class="text-[10px] text-slate-500 mt-0.5 leading-snug">Évacuations sanitaires d'urgence et gardes réflexes 15.</p>
            </div>
            <button onclick="window.ProtecAdmin.supportToggleConvention('${user.id}', 'samuConvention', ${!convSamu})" class="w-full py-1 rounded-lg font-bold text-[10px] cursor-pointer ${convSamu ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-sky-600 text-white hover:bg-sky-700 shadow-xs'}">
              ${convSamu ? 'Résilier Convention' : 'Signer Convention'}
            </button>
          </div>

          <!-- Convention Pompiers (BSPP / BMPM / SDIS) -->
          <div class="p-2.5 rounded-xl border ${convSdis ? 'bg-orange-50/70 border-orange-300' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between space-y-2">
            <div>
              <div class="flex items-center justify-between">
                <strong class="text-slate-900 text-xs">${pompiersAuth.shortName} (Pompiers)</strong>
                <span class="px-1.5 py-0.5 rounded-md text-[9px] font-black ${convSdis ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'}">${convSdis ? 'Signée' : 'Non signée'}</span>
              </div>
              <p class="text-[10px] text-slate-500 mt-0.5 leading-snug">Départs réflexes secours à victimes et gardes caserne.</p>
            </div>
            <button onclick="window.ProtecAdmin.supportToggleConvention('${user.id}', 'sdisConvention', ${!convSdis})" class="w-full py-1 rounded-lg font-bold text-[10px] cursor-pointer ${convSdis ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-orange-600 text-white hover:bg-orange-700 shadow-xs'}">
              ${convSdis ? `Résilier Convention ${pompiersAuth.shortName}` : `Signer Convention ${pompiersAuth.shortName}`}
            </button>
          </div>

          <!-- Convention SNCF -->
          <div class="p-2.5 rounded-xl border ${convSncf ? 'bg-purple-50/70 border-purple-300' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between space-y-2">
            <div>
              <div class="flex items-center justify-between">
                <strong class="text-slate-900 text-xs">SNCF Réseau & Gares</strong>
                <span class="px-1.5 py-0.5 rounded-md text-[9px] font-black ${convSncf ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'}">${convSncf ? 'Signée' : 'Non signée'}</span>
              </div>
              <p class="text-[10px] text-slate-500 mt-0.5 leading-snug">Assistance voyageurs, canicule et naufragés du rail.</p>
            </div>
            <button onclick="window.ProtecAdmin.supportToggleConvention('${user.id}', 'sncfConvention', ${!convSncf})" class="w-full py-1 rounded-lg font-bold text-[10px] cursor-pointer ${convSncf ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-xs'}">
              ${convSncf ? 'Résilier Convention' : 'Signer Convention'}
            </button>
          </div>

          <!-- Convention CUMP -->
          <div class="p-2.5 rounded-xl border ${convCump ? 'bg-red-50/70 border-red-300' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between space-y-2">
            <div>
              <div class="flex items-center justify-between">
                <strong class="text-slate-900 text-xs">CUMP (Cellule Psy)</strong>
                <span class="px-1.5 py-0.5 rounded-md text-[9px] font-black ${convCump ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}">${convCump ? 'Signée' : 'Non signée'}</span>
              </div>
              <p class="text-[10px] text-slate-500 mt-0.5 leading-snug">Cellule d'Urgence Médico-Psychologique post-traumatique.</p>
            </div>
            <button onclick="window.ProtecAdmin.supportToggleConvention('${user.id}', 'cumpConvention', ${!convCump})" class="w-full py-1 rounded-lg font-bold text-[10px] cursor-pointer ${convCump ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-red-600 text-white hover:bg-red-700 shadow-xs'}">
              ${convCump ? 'Résilier Convention' : 'Signer Convention'}
            </button>
          </div>

          <!-- Convention PCS Mairies -->
          <div class="p-2.5 rounded-xl border ${convPcs ? 'bg-teal-50/70 border-teal-300' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between space-y-2">
            <div>
              <div class="flex items-center justify-between">
                <strong class="text-slate-900 text-xs">PCS Mairies & Communes</strong>
                <span class="px-1.5 py-0.5 rounded-md text-[9px] font-black ${convPcs ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}">${convPcs ? 'Signée' : 'Non signée'}</span>
              </div>
              <p class="text-[10px] text-slate-500 mt-0.5 leading-snug">Plans Communaux de Sauvegarde & Crises Locales.</p>
            </div>
            <button onclick="window.ProtecAdmin.supportToggleConvention('${user.id}', 'pcsConventions', ${!convPcs})" class="w-full py-1 rounded-lg font-bold text-[10px] cursor-pointer ${convPcs ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-xs'}">
              ${convPcs ? 'Résilier Convention' : 'Signer Convention'}
            </button>
          </div>
        </div>
      </div>

      <!-- BLOC 3 : GESTION DE LA FLOTTE DE VÉHICULES -->
      <div class="border border-slate-200 rounded-2xl p-3.5 bg-white space-y-3 shadow-2xs">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div>
            <span class="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>🚑 Flotte de Véhicules & Équipements (${vehicles.length})</span>
            </span>
            <p class="text-[10px] text-slate-500">Attribuez ou retirez n'importe quel modèle de véhicule de la Protection Civile.</p>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="window.ProtecAdmin.supportAddVehicle('${user.id}', 'VPSP')" class="px-2.5 py-1 rounded-lg bg-pc-blue text-white font-bold text-[10px] shadow-xs cursor-pointer">
              + VPSP Rapide
            </button>
            <button onclick="window.ProtecAdmin.supportAddVehicle('${user.id}', 'VTU')" class="px-2.5 py-1 rounded-lg bg-slate-700 text-white font-bold text-[10px] shadow-xs cursor-pointer">
              + VTU Rapide
            </button>
          </div>
        </div>

        <!-- Attribution spécifique avec sélecteur complet -->
        <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-2">
          <label class="text-[11px] font-bold text-slate-700 whitespace-nowrap">Attribuer un véhicule :</label>
          <select id="adm-support-new-vehicle-type" class="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-xs text-slate-800 focus:outline-none">
            <option value="VPSP">🚑 VPSP - Véhicule Premiers Secours à Personnes</option>
            <option value="VTU">🚚 VTU - Véhicule Tout Usage / Logistique</option>
            <option value="VL">🚗 VL - Véhicule Léger de Liaison</option>
            <option value="VTP">🚐 VTP - Transport de Personnel (9 places)</option>
            <option value="VLM">⚕️ VLM - Véhicule Léger Médicalisé</option>
            <option value="PMA">⛺ PMA - Remorque / Poste Médical Avancé</option>
            <option value="Quad">🏍️ QUAD - Reconnaissance & Terrains Difficiles</option>
            <option value="BRS">🚤 BRS - Bateau Reconnaissance & Sauvetage</option>
            <option value="VSR">🚒 VSR - Véhicule de Secours Routier</option>
            <option value="MOTO">🛵 MOTO - Prompt Secours Urbain</option>
            <option value="VELO">🚲 VTT - Équipe Secours VTT Événementiel</option>
          </select>
          <button onclick="const sel = document.getElementById('adm-support-new-vehicle-type'); if (sel) window.ProtecAdmin.supportAddSpecificVehicle('${user.id}', sel.value);" class="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer whitespace-nowrap">
            + Attribuer à l'antenne
          </button>
        </div>

        <!-- Liste des véhicules du joueur -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          ${vehicles.length === 0 ? '<div class="text-[11px] text-slate-400 italic col-span-3 p-4 text-center">Aucun véhicule enregistré pour cette antenne.</div>' : vehicles.map(v => `
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div class="pr-2 truncate">
                <strong class="text-slate-900 block truncate">${v.name || v.type}</strong>
                <span class="text-[10px] text-slate-400 block">${v.immat || 'Sans plaque'} • État: <b class="text-emerald-700">${v.condition || 100}%</b></span>
              </div>
              <button onclick="window.ProtecAdmin.supportRemoveVehicle('${user.id}', '${v.id}')" title="Retirer ce véhicule" class="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px] border border-rose-200 cursor-pointer flex-shrink-0">
                Retirer
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- BLOC 4 : MISSIONS EN COURS & ASSISTANCE -->
      <div class="border border-slate-200 rounded-2xl p-3.5 bg-white space-y-2 shadow-2xs">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2">
          <span class="text-xs font-black text-slate-900">Missions & DPS en Cours (${missions.length})</span>
          ${missions.length > 0 ? `
            <button onclick="window.ProtecAdmin.supportClearStuckMissions('${user.id}')" class="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer">
              Purger toutes les missions
            </button>
          ` : ''}
        </div>
        <div class="space-y-1.5">
          ${missions.length === 0 ? '<div class="text-[11px] text-slate-400 italic p-3 text-center">Aucune mission active actuellement.</div>' : missions.map(m => `
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <strong class="text-slate-900">${m.title}</strong>
                <span class="text-[10px] text-slate-500 block">Statut: ${m.status || 'En cours'} • Réf: ${m.id}</span>
              </div>
              <div class="flex gap-1">
                <button onclick="window.ProtecAdmin.supportForceCompleteMission('${user.id}', '${m.id}')" class="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold text-[10px] cursor-pointer">
                  Valider (+Gain)
                </button>
                <button onclick="window.ProtecAdmin.supportCancelMission('${user.id}', '${m.id}')" class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-[10px] cursor-pointer">
                  Annuler
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  async supportToggleAgrement(userId, code, isEnabled) {
    const user = (this.usersCache || []).find(u => u.id === userId);
    if (!user) return;

    let sData = user.saveData || {};
    if (!sData.resources) sData.resources = {};
    if (!sData.resources.agrements) sData.resources.agrements = { A: false, B: false, C: false, D: false };

    sData.resources.agrements[code] = !!isEnabled;
    if (isEnabled && sData.prefectureState) {
      sData.prefectureState.agrementSuspended = false;
      sData.prefectureState.trustScore = Math.max(sData.prefectureState.trustScore || 85, 75);
    }

    const labels = {
      A: "Agrément A (Secours à Personnes)",
      B: "Agrément B (Soutien aux Populations)",
      C: "Agrément C (Encadrement Bénévoles)",
      D: "Agrément D (Dispositifs de Secours)"
    };

    await this.updateUser(userId, { saveData: sData }, `${labels[code] || code} ${isEnabled ? 'accordé' : 'retiré'} à ${user.username}`);
    this.refreshSupportPlayerView();
  },

  async supportToggleAllAgrements(userId, isEnabled) {
    const user = (this.usersCache || []).find(u => u.id === userId);
    if (!user) return;

    let sData = user.saveData || {};
    if (!sData.resources) sData.resources = {};
    sData.resources.agrements = {
      A: !!isEnabled,
      B: !!isEnabled,
      C: !!isEnabled,
      D: !!isEnabled
    };

    if (!sData.prefectureState) sData.prefectureState = { trustScore: 85, agrementSuspended: false, warningsCount: 0 };
    if (isEnabled) {
      sData.prefectureState.agrementSuspended = false;
      sData.prefectureState.trustScore = 100;
      sData.prefectureState.warningsCount = 0;
    }

    await this.updateUser(userId, { saveData: sData }, `Tous les agréments A, B, C, D ${isEnabled ? 'accordés' : 'révoqués'} pour ${user.username}`);
    this.refreshSupportPlayerView();
  },

  async supportLiftAgrementSuspension(userId, lift = true) {
    const user = (this.usersCache || []).find(u => u.id === userId);
    if (!user) return;

    let sData = user.saveData || {};
    if (!sData.prefectureState) sData.prefectureState = { trustScore: 85, agrementSuspended: false, warningsCount: 0 };

    sData.prefectureState.agrementSuspended = !lift;
    sData.prefectureState.trustScore = lift ? 100 : 20;
    sData.prefectureState.warningsCount = lift ? 0 : 3;

    if (lift && sData.resources?.agrements) {
      sData.resources.agrements.A = true;
    }

    await this.updateUser(userId, { saveData: sData }, lift ? `Suspension préfectorale levée pour ${user.username} (Confiance 100%)` : `Agrément préfectoral suspendu pour ${user.username}`);
    this.refreshSupportPlayerView();
  },

  async supportToggleConvention(userId, convKey, isSigned) {
    const user = (this.usersCache || []).find(u => u.id === userId);
    if (!user) return;

    let sData = user.saveData || {};
    const existing = sData[convKey] || {};

    if (isSigned) {
      sData[convKey] = {
        ...existing,
        signed: true,
        signedAt: Date.now(),
        requestStatus: 'accepted'
      };
    } else {
      sData[convKey] = {
        ...existing,
        signed: false,
        signedAt: null,
        requestStatus: null
      };
    }

    const convNames = {
      aascConvention: "Convention AASC",
      samuConvention: "Convention SAMU 15",
      sdisConvention: "Convention SDIS",
      sncfConvention: "Convention SNCF",
      cumpConvention: "Convention CUMP",
      pcsConventions: "Convention PCS Mairies"
    };

    await this.updateUser(userId, { saveData: sData }, `${convNames[convKey] || convKey} ${isSigned ? 'signée et activée' : 'résiliée'} pour ${user.username}`);
    this.refreshSupportPlayerView();
  },

  async supportSignAllConventions(userId, isSigned = true) {
    const user = (this.usersCache || []).find(u => u.id === userId);
    if (!user) return;

    let sData = user.saveData || {};
    const convKeys = ['aascConvention', 'samuConvention', 'sdisConvention', 'sncfConvention', 'cumpConvention', 'pcsConventions'];

    convKeys.forEach(k => {
      const existing = sData[k] || {};
      sData[k] = isSigned ? {
        ...existing,
        signed: true,
        signedAt: Date.now(),
        requestStatus: 'accepted'
      } : {
        ...existing,
        signed: false,
        signedAt: null,
        requestStatus: null
      };
    });

    await this.updateUser(userId, { saveData: sData }, `Toutes les conventions opérationnelles ont été ${isSigned ? 'signées' : 'résiliées'} pour ${user.username}`);
    this.refreshSupportPlayerView();
  },

  async supportAddSpecificVehicle(userId, vehicleType) {
    return this.supportAddVehicle(userId, vehicleType);
  },

  async supportAddVehicle(userId, vehicleType) {
    const user = (this.usersCache || []).find(u => u.id === userId);
    if (!user) return;

    let sData = user.saveData || {};
    if (!sData.vehicles) sData.vehicles = [];

    const names = {
      VPSP: "Ambulance VPSP",
      VTU: "Fourgon VTU Logistique",
      VL: "VL Liaison",
      VTP: "VTP Transport Personnel",
      VLM: "VLM Intervention Médicale",
      PMA: "Remorque Poste Médical Avancé",
      Quad: "Quad Reconnaissance",
      BRS: "Bateau BRS Sauvetage",
      VSR: "VSR Secours Routier",
      MOTO: "Moto Prompt Secours",
      VELO: "Vélo Tout Terrain Secours"
    };

    const newVeh = {
      id: `veh-admin-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: vehicleType,
      name: `${names[vehicleType] || vehicleType} Antenne`,
      immat: `PC-${Math.floor(100 + Math.random() * 900)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      condition: 100,
      inService: true,
      stationId: sData.stations?.[0]?.id || 'st-default'
    };

    sData.vehicles.push(newVeh);
    await this.updateUser(userId, { saveData: sData }, `Véhicule ${newVeh.name} (${newVeh.immat}) attribué à ${user.username}`);
    this.refreshSupportPlayerView();
  },

  async supportRemoveVehicle(userId, vehicleId) {
    const user = (this.usersCache || []).find(u => u.id === userId);
    if (!user) return;

    let sData = user.saveData || {};
    if (!sData.vehicles) return;

    sData.vehicles = sData.vehicles.filter(v => v.id !== vehicleId);
    await this.updateUser(userId, { saveData: sData }, `Véhicule retiré de la flotte de ${user.username}`);
    this.refreshSupportPlayerView();
  },

  async supportClearStuckMissions(userId) {
    const user = (this.usersCache || []).find(u => u.id === userId);
    if (!user) return;

    let sData = user.saveData || {};
    sData.missions = [];
    await this.updateUser(userId, { saveData: sData }, `Toutes les missions de ${user.username} ont été purgées et débloquées.`);
    this.refreshSupportPlayerView();
  },

  async supportForceCompleteMission(userId, missionId) {
    const user = (this.usersCache || []).find(u => u.id === userId);
    if (!user) return;

    let sData = user.saveData || {};
    const m = (sData.missions || []).find(x => x.id === missionId);
    const reward = m?.rewardMoney || 500;

    sData.missions = (sData.missions || []).filter(x => x.id !== missionId);
    const newMoney = Number(user.money || 0) + reward;

    await this.updateUser(userId, { money: newMoney, saveData: sData }, `Mission validée avec succès (+${reward} € pour ${user.username})`);
    this.refreshSupportPlayerView();
  },

  async supportCancelMission(userId, missionId) {
    const user = (this.usersCache || []).find(u => u.id === userId);
    if (!user) return;

    let sData = user.saveData || {};
    sData.missions = (sData.missions || []).filter(x => x.id !== missionId);
    await this.updateUser(userId, { saveData: sData }, `Mission annulée sans pénalité pour ${user.username}`);
    this.refreshSupportPlayerView();
  },

  showPlayerPlatformModal(userId) {
    const user = (this.usersCache || []).find(u => u.id === userId);
    if (!user) return;

    const modalId = 'adm-player-platform-modal';
    let modalEl = document.getElementById(modalId);
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = modalId;
      modalEl.className = 'fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in';
      document.body.appendChild(modalEl);
    }

    const chartHTML = window.ProtecPlatformAnalytics?.renderPlayerPlatformChartHTML
      ? window.ProtecPlatformAnalytics.renderPlayerPlatformChartHTML(user, 'adm-modal-platform-chart')
      : '<p class="text-xs text-slate-400">Statistiques indisponibles.</p>';

    modalEl.innerHTML = `
      <div class="w-full max-w-xl rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-2xl relative text-left">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">
              📊
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 leading-tight">Support & Plateformes : ${user.username}</h3>
              <p class="text-[11px] text-slate-500">${user.stationName || 'Antenne'} • ${user.city || 'Ville'}</p>
            </div>
          </div>
          <button onclick="document.getElementById('${modalId}').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black text-xs cursor-pointer">
            ✕
          </button>
        </div>

        <div class="space-y-4">
          ${chartHTML}
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <button onclick="document.getElementById('${modalId}').classList.add('hidden'); window.ProtecAdmin.openSupportForPlayer('${user.id}');" class="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs border border-indigo-200 cursor-pointer">
            🛠️ Ouvrir dans l'Outil de Support
          </button>
          <button onclick="document.getElementById('${modalId}').classList.add('hidden')" class="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer">
            Fermer
          </button>
        </div>
      </div>
    `;

    modalEl.classList.remove('hidden');
  },

  async sendGlobalBroadcast(e) {
    e.preventDefault();
    const input = document.getElementById('admin-broadcast-input');
    if (!input || !input.value.trim()) return;

    const message = input.value.trim();
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          title: '🚨 DIRECTION NATIONALE (Message Flash)',
          message: message,
          type: 'orange'
        })
      });
      if (res.ok) {
        if (window.game) window.game.showToast('Message Diffusé', 'Alerte transmise en direct à tous les joueurs connectés.', 'green');
        input.value = '';
      }
    } catch (e) {
      await window.ProtecDialog.alert('Erreur envoi broadcast.', 'Erreur Diffusion');
    }
  },

  toggleAnalytics() {
    this.isAnalyticsCollapsed = !this.isAnalyticsCollapsed;
    const container = document.getElementById('admin-global-platform-analytics-container');
    const txt = document.getElementById('admin-analytics-toggle-text');
    const icon = document.getElementById('admin-analytics-toggle-icon');
    if (container) {
      if (this.isAnalyticsCollapsed) {
        container.classList.add('hidden');
      } else {
        container.classList.remove('hidden');
      }
    }
    if (txt) txt.textContent = this.isAnalyticsCollapsed ? 'Afficher le Dashboard PWA' : 'Masquer le tableau';
    if (icon) icon.textContent = this.isAnalyticsCollapsed ? '▼' : '▲';
  },

  notificationScenarios: {
    samu: {
      name: 'RÉQUISITION SAMU 15',
      badge: 'Urgence Vitale',
      badgeColor: 'bg-red-100 text-red-800',
      title: '🚨 RÉQUISITION SAMU 15 : Départ Réflexe',
      message: 'Engagement immédiat VPSP en renfort SUAP. Détresse respiratoire régulée en cours à domicile.',
      type: 'red',
      category: 'urgences',
      sound: true,
      vibrate: true,
      push: true
    },
    dps_devis: {
      name: 'DEVIS DPS VALIDÉ',
      badge: 'Finances & Recettes',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      title: '💶 Devis DPS Accepté (+14 500 €)',
      message: 'L’organisateur du Festival Municipal a validé la convention de secours. Virement bancaire émis.',
      type: 'green',
      category: 'finances',
      sound: true,
      vibrate: false,
      push: true
    },
    recrutement: {
      name: 'CANDIDATURE BÉNÉVOLE',
      badge: 'Ressources Humaines',
      badgeColor: 'bg-blue-100 text-blue-800',
      title: '👥 Nouvelle Recrue Bénévole',
      message: 'Thomas L. (Diplômé PSE2, Permis B) a déposé sa candidature auprès de votre antenne.',
      type: 'blue',
      category: 'rh',
      sound: true,
      vibrate: false,
      push: true
    },
    meteo: {
      name: 'VIGILANCE MÉTÉO ORANGE',
      badge: 'Crise & Crues',
      badgeColor: 'bg-amber-100 text-amber-800',
      title: '⚠️ Vigilance Météo Orange (Inondations)',
      message: 'Météo France place votre secteur en vigilance crues. Préparez motopompes et embarcations.',
      type: 'orange',
      category: 'meteo',
      sound: true,
      vibrate: true,
      push: true
    },
    ecusson: {
      name: 'ÉCUSSON NATIONAL DÉBLOQUÉ',
      badge: 'Fédéral FNPC',
      badgeColor: 'bg-purple-100 text-purple-800',
      title: '🏆 Nouvel Écusson Fédéral Débloqué !',
      message: 'Félicitations ! Votre antenne a débloqué l’insigne d’Excellence Opérationnelle de la FNPC.',
      type: 'purple',
      category: 'badges',
      sound: true,
      vibrate: true,
      push: true
    },
    ordre_mission: {
      name: 'ORDRE NATIONAL FNPC',
      badge: 'Alerte Extra-Dép.',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      title: '📢 Ordre de Mission National FNPC',
      message: 'Alerte mobilisation extra-départementale : renfort demandé pour le Plan NOVI en cours.',
      type: 'orange',
      category: 'fnpc',
      sound: true,
      vibrate: true,
      push: true
    }
  },

  currentTesterUserId: null,

  openNotificationTester(userId = 'all') {
    this.currentTesterUserId = userId;
    const modalId = 'adm-notification-tester-modal';
    let modalEl = document.getElementById(modalId);
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = modalId;
      modalEl.className = 'fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in overflow-y-auto';
      document.body.appendChild(modalEl);
    }

    this.renderNotificationTesterContent();
    modalEl.classList.remove('hidden');
    modalEl.classList.add('flex');
  },

  closeNotificationTester() {
    const modalEl = document.getElementById('adm-notification-tester-modal');
    if (modalEl) {
      modalEl.classList.add('hidden');
      modalEl.classList.remove('flex');
    }
  },

  onTesterTargetChange(newUserId) {
    this.currentTesterUserId = newUserId;
    this.renderNotificationTesterContent();
  },

  renderNotificationTesterContent() {
    const modalEl = document.getElementById('adm-notification-tester-modal');
    if (!modalEl) return;

    const users = this.usersCache || [];
    const currentId = this.currentTesterUserId || 'all';
    const isAll = currentId === 'all';
    const targetUser = isAll ? null : users.find(u => u.id === currentId);

    // Options pour la liste déroulante des directeurs cibles
    const userOptions = [
      `<option value="all" ${isAll ? 'selected' : ''}>📢 Tous les Directeurs connectés (Diffusion Globale)</option>`,
      ...users.map(u => {
        const isCurrent = !!(
          u.isLocalPlayer ||
          (window.game?.player && window.game.player.id === u.id) ||
          (window.ProtecAuth?.currentUser && window.ProtecAuth.currentUser.id === u.id)
        );
        const pushTag = u.hasPushSubscription ? ' [📲 Push Mobile Actif]' : '';
        return `<option value="${u.id}" ${u.id === currentId ? 'selected' : ''}>
          ${isCurrent ? '⭐ (Moi-même) ' : '👤 '}${u.username || 'Directeur'}${pushTag} — ${u.stationName || 'Antenne'} (${u.city || 'Ville'})
        </option>`;
      })
    ].join('');

    modalEl.innerHTML = `
      <div class="w-full max-w-2xl rounded-3xl bg-white border-2 border-amber-400/50 p-5 sm:p-6 shadow-2xl relative text-left max-h-[90vh] flex flex-col my-auto animate-in zoom-in-95">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3.5 border-b border-slate-100 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
              🔔
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 leading-tight">Testeur de Notifications Joueur</h3>
              <p class="text-xs text-amber-600 font-bold">Vérification de réception en direct (Push OS même app fermée, Sons, Toasts, Vibreur)</p>
            </div>
          </div>
          <button onclick="window.ProtecAdmin.closeNotificationTester()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-black text-xs cursor-pointer transition">
            ✕
          </button>
        </div>

        <!-- Corps scrollable du testeur -->
        <div class="overflow-y-auto pr-1 py-3 space-y-4 flex-1 min-h-0 text-xs">
          
          <!-- Sélecteur de Directeur Cible -->
          <div class="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <div class="flex items-center justify-between flex-wrap gap-1">
              <label for="adm-test-target-select" class="font-extrabold text-amber-950 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <span>🎯 Joueur / Cible du test opérationnel :</span>
              </label>
              ${targetUser ? `
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-white border border-amber-300 text-amber-900 shadow-2xs">
                    ${targetUser.city || 'Secteur'} • ${targetUser.volunteersCount || 0} bénév.
                  </span>
                  ${targetUser.hasPushSubscription ? `
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 📲 Push Mobile Actif (App Fermée)
                    </span>
                  ` : `
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      🌐 Réception En Ligne
                    </span>
                  `}
                </div>
              ` : `
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 shadow-2xs">
                  Diffusion Générale Multi
                </span>
              `}
            </div>
            <select id="adm-test-target-select" onchange="window.ProtecAdmin.onTesterTargetChange(this.value)" class="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer">
              ${userOptions}
            </select>
          </div>

          <!-- Section 1 : Scénarios Opérationnels Prédéfinis (1 Clic) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡ Scénarios Prédéfinis Réalistes</span>
              </span>
              <span class="text-[10px] text-slate-400 font-bold">1 clic pour tester</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              ${Object.entries(this.notificationScenarios).map(([key, sc]) => `
                <div class="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-amber-300 hover:shadow-xs transition space-y-2 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between gap-1.5 mb-1">
                      <span class="font-black text-slate-900 text-xs truncate">${sc.name}</span>
                      <span class="px-2 py-0.5 rounded text-[9px] font-black ${sc.badgeColor} whitespace-nowrap">${sc.badge}</span>
                    </div>
                    <p class="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-normal">${sc.message}</p>
                    <div class="flex items-center gap-1.5 mt-2 flex-wrap text-[9px] font-bold text-slate-500">
                      ${sc.sound ? '<span class="bg-slate-200/80 px-1.5 py-0.5 rounded">🔊 Son</span>' : ''}
                      ${sc.vibrate ? '<span class="bg-slate-200/80 px-1.5 py-0.5 rounded">📳 Vibreur</span>' : ''}
                      ${sc.push ? '<span class="bg-slate-200/80 px-1.5 py-0.5 rounded">📲 Push OS</span>' : ''}
                      <span class="bg-slate-200/80 px-1.5 py-0.5 rounded">💬 Toast</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                    <button onclick="window.ProtecAdmin.sendScenarioNotification('${key}')" class="flex-1 py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] transition cursor-pointer shadow-2xs text-center">
                      📡 Envoyer au joueur
                    </button>
                    <button onclick="window.ProtecAdmin.previewScenarioNotification('${key}')" title="Tester le son et l'affichage sur mon propre écran" class="py-1.5 px-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] transition cursor-pointer text-center">
                      🎧 Moi
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 2 : Notification Sur-Mesure (Studio Personnalisé) -->
          <div class="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-3">
            <span class="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>✍️ Notification Sur-Mesure (Studio Admin)</span>
            </span>

            <div class="space-y-2">
              <div>
                <label for="adm-test-custom-title" class="text-[10px] font-black uppercase text-slate-500 block mb-1">Titre de la notification</label>
                <input type="text" id="adm-test-custom-title" value="🔔 Alerte Administrateur Protec Live" placeholder="Ex: Ravitaillement Logistique, Avis de Mission..." class="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-semibold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" />
              </div>

              <div>
                <label for="adm-test-custom-message" class="text-[10px] font-black uppercase text-slate-500 block mb-1">Corps du message</label>
                <textarea id="adm-test-custom-message" rows="2" placeholder="Saisissez le texte que le directeur recevra..." class="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-semibold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none">Ceci est un test de notification officiel émis par l'Administration Fédérale Protec Live.</textarea>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label for="adm-test-custom-type" class="text-[10px] font-black uppercase text-slate-500 block mb-1">Couleur / Thème</label>
                  <select id="adm-test-custom-type" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 font-bold text-xs bg-white focus:outline-none">
                    <option value="orange">Orange (Alerte / Météo)</option>
                    <option value="red">Rouge (Urgence Vitale)</option>
                    <option value="green">Vert (Succès / Finances)</option>
                    <option value="blue">Bleu (RH / Information)</option>
                    <option value="purple">Violet (Écusson / Fédéral)</option>
                  </select>
                </div>
                <div>
                  <label for="adm-test-custom-category" class="text-[10px] font-black uppercase text-slate-500 block mb-1">Catégorie</label>
                  <select id="adm-test-custom-category" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 font-bold text-xs bg-white focus:outline-none">
                    <option value="admin-test">Test Administrateur</option>
                    <option value="urgences">Urgences (SAMU/SDIS)</option>
                    <option value="finances">Finances & Devis</option>
                    <option value="rh">Ressources Humaines</option>
                    <option value="meteo">Vigilance Météo</option>
                    <option value="badges">Écussons & Succès</option>
                  </select>
                </div>
              </div>

              <!-- Options des canaux actifs -->
              <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 flex-wrap text-[11px] font-bold text-slate-700">
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" id="adm-test-chk-toast" checked class="rounded text-amber-600 focus:ring-0">
                  <span>Toast Écran</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" id="adm-test-chk-sound" checked class="rounded text-amber-600 focus:ring-0">
                  <span>Audio & Carillon</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" id="adm-test-chk-push" checked class="rounded text-amber-600 focus:ring-0">
                  <span>Notification Push OS</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" id="adm-test-chk-vibrate" checked class="rounded text-amber-600 focus:ring-0">
                  <span>Vibreur Mobile</span>
                </label>
              </div>

              <!-- Boutons de transmission sur mesure -->
              <div class="flex items-center gap-2 pt-2">
                <button onclick="window.ProtecAdmin.sendCustomNotification()" class="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer text-center">
                  🚀 Envoyer la notification au joueur
                </button>
                <button onclick="window.ProtecAdmin.previewCustomNotification()" title="Tester sur mon propre écran" class="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer text-center">
                  🎧 Tester sur moi
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <span class="text-[10px] text-slate-400">
            Cible : <strong>${isAll ? 'Tous les directeurs' : (targetUser?.username || 'Ce directeur')}</strong>
          </span>
          <button onclick="window.ProtecAdmin.closeNotificationTester()" class="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer">
            Fermer
          </button>
        </div>
      </div>
    `;
  },

  async sendScenarioNotification(key) {
    const scen = this.notificationScenarios[key];
    if (!scen) return;
    await this.triggerTestNotification(this.currentTesterUserId, {
      title: scen.title,
      message: scen.message,
      type: scen.type,
      category: scen.category,
      sound: scen.sound,
      vibrate: scen.vibrate,
      push: scen.push
    });
  },

  previewScenarioNotification(key) {
    const scen = this.notificationScenarios[key];
    if (!scen) return;
    this.previewTestNotificationLocally({
      title: scen.title,
      message: scen.message,
      type: scen.type,
      category: scen.category,
      sound: scen.sound,
      vibrate: scen.vibrate,
      push: scen.push
    });
  },

  async sendCustomNotification() {
    const titleInput = document.getElementById('adm-test-custom-title');
    const msgInput = document.getElementById('adm-test-custom-message');
    const typeSelect = document.getElementById('adm-test-custom-type');
    const catSelect = document.getElementById('adm-test-custom-category');
    const chkSound = document.getElementById('adm-test-chk-sound');
    const chkVibrate = document.getElementById('adm-test-chk-vibrate');
    const chkPush = document.getElementById('adm-test-chk-push');

    const title = titleInput ? titleInput.value.trim() : '🔔 Alerte Administrateur';
    const message = msgInput ? msgInput.value.trim() : '';
    if (!message) {
      if (window.game && typeof window.game.showToast === 'function') {
        window.game.showToast('Message requis', 'Veuillez saisir un texte pour la notification.', 'red');
      }
      return;
    }

    await this.triggerTestNotification(this.currentTesterUserId, {
      title: title || '🔔 Notification de test',
      message: message,
      type: typeSelect ? typeSelect.value : 'orange',
      category: catSelect ? catSelect.value : 'admin-test',
      sound: chkSound ? chkSound.checked : true,
      vibrate: chkVibrate ? chkVibrate.checked : true,
      push: chkPush ? chkPush.checked : true
    });
  },

  previewCustomNotification() {
    const titleInput = document.getElementById('adm-test-custom-title');
    const msgInput = document.getElementById('adm-test-custom-message');
    const typeSelect = document.getElementById('adm-test-custom-type');
    const catSelect = document.getElementById('adm-test-custom-category');
    const chkSound = document.getElementById('adm-test-chk-sound');
    const chkVibrate = document.getElementById('adm-test-chk-vibrate');
    const chkPush = document.getElementById('adm-test-chk-push');

    const title = titleInput ? titleInput.value.trim() : '🔔 Alerte Administrateur';
    const message = msgInput ? msgInput.value.trim() : 'Ceci est un test de notification officiel.';

    this.previewTestNotificationLocally({
      title: title,
      message: message,
      type: typeSelect ? typeSelect.value : 'orange',
      category: catSelect ? catSelect.value : 'admin-test',
      sound: chkSound ? chkSound.checked : true,
      vibrate: chkVibrate ? chkVibrate.checked : true,
      push: chkPush ? chkPush.checked : true
    });
  },

  async triggerTestNotification(targetUserId, payload = {}) {
    const defaultPayload = {
      targetUserId: targetUserId || 'all',
      title: payload.title || '🔔 Notification de test Protec Live',
      message: payload.message || 'Ceci est un test de notification administrateur.',
      type: payload.type || 'orange',
      category: payload.category || 'admin-test',
      sound: payload.sound !== false,
      vibrate: payload.vibrate !== false,
      push: payload.push !== false,
      timestamp: Date.now()
    };

    // 1. Appel du backend API SSE & Web Push OS (Même application fermée)
    let pushDispatched = 0;
    try {
      const res = await fetch('/api/admin/notify-player', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(defaultPayload)
      });
      if (res.ok) {
        const json = await res.json();
        pushDispatched += Number(json.pushDispatchedCount || 0);
      }
    } catch (e) {
      // Backend local non joint (ex: hébergement statique GitHub Pages)
    }

    // 1b. Tentative via l'Edge Function Supabase officielle send-push si disponible
    if (window.ProtecSupabase?.client?.functions) {
      try {
        const edgeRes = await window.ProtecSupabase.client.functions.invoke('send-push', {
          body: defaultPayload
        });
        if (edgeRes?.data?.count) {
          pushDispatched += Number(edgeRes.data.count);
        }
      } catch (eEdge) {}
    }

    // 2. Broadcast temps réel Supabase & Enregistrement en base de données
    if (window.ProtecSupabase) {
      try {
        if (typeof window.ProtecSupabase.broadcastAdminPlayerNotification === 'function') {
          window.ProtecSupabase.broadcastAdminPlayerNotification(defaultPayload);
        }
        if (typeof window.ProtecSupabase.queuePlayerNotification === 'function') {
          window.ProtecSupabase.queuePlayerNotification(targetUserId, defaultPayload);
        }
      } catch (e) {
        console.warn('Erreur broadcast/file Supabase:', e);
      }
    }

    // 3. Déclenchement local si la cible est soi-même ou "all"
    const isMe = !targetUserId || targetUserId === 'all' || 
                 (window.game?.player?.id && window.game.player.id === targetUserId) ||
                 (window.ProtecAuth?.currentUser?.id && window.ProtecAuth.currentUser.id === targetUserId);
    if (isMe) {
      if (window.game && typeof window.game.handleMultiplayerEvent === 'function') {
        window.game.handleMultiplayerEvent('admin_player_notification', defaultPayload);
      }
      if (defaultPayload.push !== false && window.ProtecNotifications && typeof window.ProtecNotifications.sendPushNotification === 'function') {
        window.ProtecNotifications.sendPushNotification(defaultPayload.title, defaultPayload.message, {
          category: defaultPayload.category,
          color: defaultPayload.type
        });
      }
    }

    const targetName = targetUserId === 'all' 
      ? 'tous les directeurs' 
      : ((this.usersCache || []).find(u => u.id === targetUserId)?.username || 'ce directeur');

    if (window.game && typeof window.game.showToast === 'function') {
      if (pushDispatched > 0) {
        window.game.showToast('Push W3C Délivré', `Alerte transmise à ${targetName} (${pushDispatched} push W3C envoyé même app fermée).`, 'green');
      } else {
        window.game.showToast('Notification Émise', `Alerte envoyée à ${targetName} (flux en direct).`, 'green');
      }
    }
  },


  previewTestNotificationLocally(payload = {}) {
    const notifPayload = {
      targetUserId: window.game?.player?.id || window.ProtecAuth?.currentUser?.id || 'local',
      title: payload.title || '🔔 Aperçu Notification (Admin)',
      message: payload.message || 'Test direct sur votre écran et vos haut-parleurs.',
      type: payload.type || 'orange',
      category: payload.category || 'admin-test',
      sound: payload.sound !== false,
      vibrate: payload.vibrate !== false,
      push: payload.push !== false,
      timestamp: Date.now()
    };

    if (window.game && typeof window.game.handleMultiplayerEvent === 'function') {
      window.game.handleMultiplayerEvent('admin_player_notification', notifPayload);
    } else {
      if (window.game && typeof window.game.showToast === 'function') {
        window.game.showToast(notifPayload.title, notifPayload.message, notifPayload.type);
      }
      if (window.ProtecNotifications && typeof window.ProtecNotifications.sendPushNotification === 'function') {
        window.ProtecNotifications.sendPushNotification(notifPayload.title, notifPayload.message, { category: notifPayload.category });
      }
    }
  },

  // =========================================================================
  // GESTIONNAIRE D'ÉCUSSONS & DISTINCTIONS JOUEURS (Admin, Zones de Défense)
  // =========================================================================
  currentBadgeTargetUserId: 'all',

  openBadgeManagerForPlayer(userId = 'all') {
    this.currentBadgeTargetUserId = userId;
    const modalId = 'adm-badge-manager-modal';
    let modalEl = document.getElementById(modalId);
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = modalId;
      modalEl.className = 'fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in';
      document.body.appendChild(modalEl);
    }

    this.renderBadgeManagerModalContent();
    modalEl.classList.remove('hidden');
  },

  closeBadgeManagerModal() {
    const modalEl = document.getElementById('adm-badge-manager-modal');
    if (modalEl) modalEl.classList.add('hidden');
  },

  onBadgeTargetChange(newUserId) {
    this.currentBadgeTargetUserId = newUserId;
    this.renderBadgeManagerModalContent();
  },

  renderBadgeManagerModalContent() {
    const modalEl = document.getElementById('adm-badge-manager-modal');
    if (!modalEl) return;

    const users = this.usersCache || [];
    let targetUser = users.find(u => u.id === this.currentBadgeTargetUserId);
    if (!targetUser && users.length > 0 && this.currentBadgeTargetUserId !== 'all') {
      targetUser = users[0];
      this.currentBadgeTargetUserId = targetUser.id;
    }

    const userOptions = `
      <option value="all" ${this.currentBadgeTargetUserId === 'all' ? 'selected' : ''}>📢 Tous les Directeurs (Attribution Globale Fédérale)</option>
      ${users.map(u => `
        <option value="${u.id}" ${u.id === this.currentBadgeTargetUserId ? 'selected' : ''}>
          👤 ${u.username} (${u.stationName || 'Antenne'} • ${u.city || u.departmentCode || '75'})
        </option>
      `).join('')}
    `;

    // Écussons actuels du joueur
    let ownedBadgesHTML = '';
    if (targetUser) {
      const sData = targetUser.saveData || {};
      const localEcs = sData.localEcussons || [];
      const ecsList = sData.ecussons || [];
      
      const catalog = (window.ProtecEcussons?.catalog?.length ? window.ProtecEcussons.catalog : (window.ProtecEcussons?.FALLBACK_CATALOG || []));
      const badgeMap = new Map();
      
      localEcs.forEach(le => {
        if (le && le.code) {
          const catB = catalog.find(c => c.code === le.code) || {};
          badgeMap.set(le.code, {
            code: le.code,
            quantite: Number(le.quantite || 1),
            badge: catB
          });
        }
      });

      ecsList.forEach(ec => {
        if (ec && ec.code && !badgeMap.has(ec.code)) {
          const catB = catalog.find(c => c.code === ec.code) || ec;
          badgeMap.set(ec.code, {
            code: ec.code,
            quantite: Number(ec.quantite || 1),
            badge: catB
          });
        }
      });

      if (badgeMap.size === 0) {
        ownedBadgesHTML = `
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
            Ce directeur ne possède aucun écusson pour l'instant. Utilisez les boutons ci-dessous pour lui en attribuer.
          </div>
        `;
      } else {
        ownedBadgesHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            ${Array.from(badgeMap.values()).map(item => {
              const b = item.badge;
              const nom = b.nom || item.code;
              const imgSvg = window.ProtecEcussons?.renderBadgeIconSvg ? window.ProtecEcussons.renderBadgeIconSvg(b, 28) : '🛡️';
              return `
                <div class="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition flex items-center justify-between gap-2 shadow-2xs">
                  <div class="flex items-center gap-2 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      ${imgSvg}
                    </div>
                    <div class="min-w-0">
                      <h5 class="text-xs font-bold text-slate-900 truncate leading-tight">${nom}</h5>
                      <span class="text-[9px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                        x${item.quantite} exemplaire(s)
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button onclick="window.ProtecAdmin.updateBadgeQuantity('${targetUser.id}', '${item.code}', 1)" title="+1 exemplaire" class="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-black text-xs flex items-center justify-center cursor-pointer transition">
                      +
                    </button>
                    <button onclick="window.ProtecAdmin.updateBadgeQuantity('${targetUser.id}', '${item.code}', -1)" title="-1 exemplaire" class="w-6 h-6 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 font-black text-xs flex items-center justify-center cursor-pointer transition">
                      -
                    </button>
                    <button onclick="window.ProtecAdmin.revokeBadgeFromPlayer('${targetUser.id}', '${item.code}', true)" title="Supprimer cet écusson" class="w-6 h-6 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 font-black text-[11px] flex items-center justify-center cursor-pointer transition">
                      ✕
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    } else {
      ownedBadgesHTML = `
        <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold text-center">
          Mode diffusion globale : l'écusson sélectionné sera distribué à <strong>tous les directeurs</strong> enregistrés.
        </div>
      `;
    }

    // Écussons spécifiques mis en avant
    const highlightBadges = [
      { code: 'badge_admin', name: 'Admin (État-Major National)', subtitle: 'Réservé aux administrateurs & créateurs', file: 'badge_admin.png', color: 'from-rose-500 to-red-600', badgeColor: 'bg-red-100 text-red-800' },
      { code: 'badge_def_est', name: 'Zone EST', subtitle: 'Grand Est, Bourgogne-Franche-Comté', file: 'badge_def_est.png', color: 'from-blue-600 to-indigo-700', badgeColor: 'bg-blue-100 text-blue-800' },
      { code: 'badge_def_nord', name: 'Zone NORD', subtitle: 'Hauts-de-France', file: 'badge_def_nord.png', color: 'from-sky-600 to-blue-700', badgeColor: 'bg-sky-100 text-sky-800' },
      { code: 'badge_def_ouest', name: 'Zone OUEST', subtitle: 'Bretagne, Normandie, Pays de la Loire...', file: 'badge_def_ouest.png', color: 'from-teal-600 to-emerald-700', badgeColor: 'bg-teal-100 text-teal-800' },
      { code: 'badge_def_sudest', name: 'Zone SUD-EST', subtitle: 'Auvergne-Rhône-Alpes', file: 'badge_def_sudest.png', color: 'from-indigo-600 to-purple-700', badgeColor: 'bg-indigo-100 text-indigo-800' },
      { code: 'badge_def_sud', name: 'Zone SUD', subtitle: 'PACA, Occitanie, Corse', file: 'badge_def_sud.png', color: 'from-amber-600 to-orange-700', badgeColor: 'bg-orange-100 text-orange-800' },
      { code: 'badge_def_paris', name: 'Zone PARIS', subtitle: 'Île-de-France & Préfecture de Police', file: 'badge_def_paris.png', color: 'from-blue-700 to-slate-800', badgeColor: 'bg-slate-100 text-slate-800' },
      { code: 'badge_def_sudouest', name: 'Zone SUD-OUEST', subtitle: 'Nouvelle-Aquitaine', file: 'badge_def_sudouest.png', color: 'from-cyan-600 to-blue-700', badgeColor: 'bg-cyan-100 text-cyan-800' },
      { code: 'badge_chat_noir', name: 'Écusson Chat Noir', subtitle: 'Distinction Opérationnelle • Situations Complexes', file: 'ecusson_chat_noir.png', color: 'from-zinc-800 to-black', badgeColor: 'bg-zinc-800 text-zinc-100' },
      { code: 'badge_chat_blanc', name: 'Écusson Chat Blanc', subtitle: 'Distinction Opérationnelle • Baraka & Bienveillance', file: 'ecusson_chat_blanc.png', color: 'from-slate-100 to-slate-300 text-slate-900', badgeColor: 'bg-white text-slate-900 border border-slate-300' }
    ];

    // Options du catalogue complet
    const catalog = (window.ProtecEcussons?.catalog?.length ? window.ProtecEcussons.catalog : (window.ProtecEcussons?.FALLBACK_CATALOG || []));
    const catalogOptions = catalog.map(c => `
      <option value="${c.code}">
        [${(c.categorie || 'renfort').toUpperCase()}] ${c.nom} (${c.rarete || 'commun'})
      </option>
    `).join('');

    modalEl.innerHTML = `
      <div class="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-slate-200 p-4 sm:p-6 shadow-2xl relative text-left overflow-hidden">
        
        <!-- En-tête -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-pc-blue text-white flex items-center justify-center font-black text-base shadow-md">
              🛡️
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 leading-tight">Gestionnaire des Écussons & Distinctions</h3>
              <p class="text-xs text-pc-blue font-bold">Attribution manuelle aux directeurs d'antennes</p>
            </div>
          </div>
          <button onclick="window.ProtecAdmin.closeBadgeManagerModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-black text-xs cursor-pointer transition">
            ✕
          </button>
        </div>

        <!-- Corps scrollable -->
        <div class="overflow-y-auto pr-1 py-3 space-y-4 flex-1 min-h-0 text-xs">
          
          <!-- Sélecteur de Joueur Cible -->
          <div class="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
            <div class="flex items-center justify-between flex-wrap gap-1">
              <label for="adm-badge-target-select" class="font-extrabold text-blue-950 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <span>🎯 Directeur d'Antenne Cible :</span>
              </label>
              ${targetUser ? `
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-white border border-blue-300 text-blue-900 shadow-2xs">
                  ${targetUser.city || 'Secteur'} • ${targetUser.volunteersCount || 0} bénévoles
                </span>
              ` : `
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 shadow-2xs">
                  Diffusion Fédérale Globale
                </span>
              `}
            </div>
            <select id="adm-badge-target-select" onchange="window.ProtecAdmin.onBadgeTargetChange(this.value)" class="w-full px-3 py-2 rounded-xl border border-blue-300 bg-white font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
              ${userOptions}
            </select>
          </div>

          <!-- Section 1 : Écussons Détenus par ce Joueur -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>📌 Écussons Détenus par le Directeur</span>
              </span>
              <span class="text-[10px] text-slate-400 font-bold">Gestion des exemplaires</span>
            </div>
            ${ownedBadgesHTML}
          </div>

          <!-- Section 2 : Distribution 1 Clic (Admin & Zones de Défense) -->
          <div class="space-y-2 pt-1 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <span class="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡ Nouveaux Écussons : Admin & Zones de Défense</span>
              </span>
              <span class="text-[10px] text-amber-600 font-bold">Attribution en 1 clic</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              ${highlightBadges.map(item => `
                <div class="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 hover:shadow-xs transition space-y-2 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between gap-1.5 mb-1">
                      <span class="font-black text-slate-900 text-xs truncate">${item.name}</span>
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-black ${item.badgeColor} whitespace-nowrap">${item.code === 'badge_admin' ? 'HISTORIQUE' : 'ÉPIQUE'}</span>
                    </div>
                    <p class="text-[10px] text-slate-500 line-clamp-1 leading-snug">${item.subtitle}</p>
                    <div class="text-[9px] text-slate-400 font-mono mt-0.5">Fichier : ${item.file}</div>
                  </div>
                  <button onclick="window.ProtecAdmin.awardBadgeToPlayer('${this.currentBadgeTargetUserId}', '${item.code}')" class="w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r ${item.color} text-white font-extrabold text-[10px] hover:brightness-110 active:scale-95 transition cursor-pointer shadow-2xs text-center flex items-center justify-center gap-1">
                    <span>➕ Décerner l'Écusson</span>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 3 : Tout le Catalogue MyProtec -->
          <div class="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-3">
            <span class="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>📖 Autre Écusson du Catalogue MyProtec</span>
            </span>

            <div class="flex flex-col sm:flex-row items-center gap-2">
              <select id="adm-badge-catalog-select" class="w-full sm:flex-1 px-3 py-2 rounded-xl border border-slate-200 font-semibold text-xs bg-white focus:outline-none">
                ${catalogOptions}
              </select>
              <div class="flex items-center gap-2 w-full sm:w-auto">
                <input type="number" id="adm-badge-catalog-qty" value="1" min="1" max="99" class="w-16 px-2.5 py-2 rounded-xl border border-slate-200 font-bold text-center text-xs" />
                <button onclick="window.ProtecAdmin.awardCustomBadgeFromSelect()" class="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition cursor-pointer whitespace-nowrap">
                  Distribuer
                </button>
              </div>
            </div>
          </div>

          <!-- Section 4 : Options de Transmission -->
          <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <label class="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
              <input type="checkbox" id="adm-badge-notify-check" checked class="w-4 h-4 text-pc-blue rounded cursor-pointer" />
              <span>Diffuser une alerte en direct au joueur connecté (Toast + Son + Notification)</span>
            </label>
          </div>

        </div>

        <!-- Pied de page -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <span class="text-[10px] text-slate-400">Les écussons sont enregistrés directement en base et synchronisés au tableau en liège.</span>
          <button onclick="window.ProtecAdmin.closeBadgeManagerModal()" class="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer">
            Fermer
          </button>
        </div>

      </div>
    `;
  },

  async awardBadgeToPlayer(userId, badgeCode, quantity = 1, notify = null) {
    if (notify === null) {
      const check = document.getElementById('adm-badge-notify-check');
      notify = check ? check.checked : true;
    }

    const catalog = (window.ProtecEcussons?.catalog?.length ? window.ProtecEcussons.catalog : (window.ProtecEcussons?.FALLBACK_CATALOG || []));
    let badge = catalog.find(b => b.code === badgeCode);
    if (!badge && this.badgesCache) {
      const bFromCache = this.badgesCache.find(b => b.code === badgeCode);
      if (bFromCache) {
        badge = {
          id: bFromCache.id,
          code: bFromCache.code,
          nom: bFromCache.name || bFromCache.nom || badgeCode,
          name: bFromCache.name || bFromCache.nom || badgeCode,
          rarete: bFromCache.rarity || bFromCache.rarete || 'epique',
          imageUrl: bFromCache.image_url || bFromCache.imageUrl
        };
      }
    }
    if (!badge) {
      badge = {
        code: badgeCode,
        nom: badgeCode,
        name: badgeCode,
        rarete: badgeCode === 'badge_admin' ? 'historique' : 'epique'
      };
    }

    const qty = Number(quantity || 1);
    let success = false;

    // 1. Tenter l'appel au backend local sans jamais bloquer s'il est hors-ligne
    try {
      const res = await fetch('/api/admin/badges/award', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          userId,
          badge,
          quantity: qty,
          notify: !!notify
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) success = true;
      }
    } catch (e) {
      // Ignorer silencieusement en mode Cloud Supabase
    }

    // 2. Persistance directe dans Supabase Cloud (table game_saves & antenne_ecussons)
    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      try {
        const supaOk = await window.ProtecSupabase.awardBadge(userId, badge, qty, notify);
        if (supaOk) success = true;
      } catch (errSupa) {
        console.warn('Persistance Supabase Cloud écusson:', errSupa);
      }
    }

    // 3. Répercussion locale & cache administrateur
    const users = this.usersCache || [];
    const applyToUser = (u) => {
      if (!u.saveData) u.saveData = {};
      if (!u.saveData.localEcussons) u.saveData.localEcussons = [];
      const ex = u.saveData.localEcussons.find(l => l.code === badgeCode);
      if (ex) ex.quantite = (ex.quantite || 1) + qty;
      else u.saveData.localEcussons.push({ code: badgeCode, quantite: qty });
    };

    if (userId === 'all') {
      users.forEach(applyToUser);
      success = true;
    } else {
      const u = users.find(x => x.id === userId);
      if (u) {
        applyToUser(u);
        success = true;
      }
    }

    // 4. Si le joueur modifié est le joueur en cours (ou 'all')
    if (window.game) {
      const g = window.game;
      const isCur = (userId === 'all') || (g.player && g.player.id === userId) || (window.ProtecAuth?.currentUser && window.ProtecAuth.currentUser.id === userId);
      if (isCur) {
        if (window.ProtecEcussons && typeof window.ProtecEcussons.attribuerEcusson === 'function') {
          for (let i = 0; i < qty; i++) {
            await window.ProtecEcussons.attribuerEcusson(badgeCode, null, (i === 0 && notify));
          }
        } else {
          if (!g.localEcussons) g.localEcussons = [];
          const loc = g.localEcussons.find(l => l.code === badgeCode);
          if (loc) loc.quantite = (loc.quantite || 1) + qty;
          else g.localEcussons.push({ code: badgeCode, quantite: qty });
          if (typeof g.saveGame === 'function') g.saveGame();
        }
        success = true;
      }
    }

    // 5. Diffusion broadcast Realtime si pas déjà fait par ProtecSupabase
    if (window.ProtecSupabase && typeof window.ProtecSupabase.broadcastBadgeAwarded === 'function') {
      window.ProtecSupabase.broadcastBadgeAwarded({
        userId,
        badge,
        quantity: qty,
        notify: !!notify
      });
    }

    if (success) {
      const targetUser = (this.usersCache || []).find(u => u.id === userId);
      const targetName = userId === 'all' ? 'tous les directeurs' : (targetUser?.username || 'le joueur');
      const badgeTitle = badge.nom || badge.name || badgeCode;
      if (window.game) {
        window.game.showToast('Écusson Distribué !', `L'écusson « ${badgeTitle} » (x${qty}) a été remis à ${targetName}.`, 'green');
      }
      this.renderBadgeManagerModalContent();
    } else {
      await window.ProtecDialog.alert('Erreur lors de l’attribution de l’écusson.', 'Erreur Écusson');
    }
  },

  async revokeBadgeFromPlayer(userId, badgeCode, removeAll = false) {
    let success = false;
    try {
      const res = await fetch('/api/admin/badges/revoke', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          userId,
          badgeCode,
          quantity: 1,
          removeAll: !!removeAll
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) success = true;
      }
    } catch (e) {
      console.warn('Erreur /api/admin/badges/revoke:', e);
    }

    // Persistance directe dans Supabase Cloud
    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      try {
        await window.ProtecSupabase.revokeBadge(userId, badgeCode, removeAll);
        success = true;
      } catch (errSupa) {
        console.warn('Erreur Supabase revokeBadge:', errSupa);
      }
    }

    // Mise à jour cache local
    const u = (this.usersCache || []).find(x => x.id === userId);
    if (u && u.saveData?.localEcussons) {
      const loc = u.saveData.localEcussons.find(l => l.code === badgeCode);
      if (loc) {
        if (removeAll || loc.quantite <= 1) {
          u.saveData.localEcussons = u.saveData.localEcussons.filter(l => l.code !== badgeCode);
        } else {
          loc.quantite -= 1;
        }
      }
      success = true;
    }

    // Si c'est le joueur en cours
    if (window.game) {
      const g = window.game;
      const isCur = (g.player && g.player.id === userId) || (window.ProtecAuth?.currentUser && window.ProtecAuth.currentUser.id === userId);
      if (isCur && g.localEcussons) {
        if (removeAll) g.localEcussons = g.localEcussons.filter(l => l.code !== badgeCode);
        else {
          const l = g.localEcussons.find(x => x.code === badgeCode);
          if (l) {
            if (l.quantite <= 1) g.localEcussons = g.localEcussons.filter(x => x.code !== badgeCode);
            else l.quantite -= 1;
          }
        }
        if (window.ProtecEcussons?.refreshPlayerEcussons) window.ProtecEcussons.refreshPlayerEcussons(g);
        success = true;
      }
    }

    // Broadcast Supabase Realtime
    if (window.ProtecSupabase && typeof window.ProtecSupabase.broadcastBadgeRevoked === 'function') {
      window.ProtecSupabase.broadcastBadgeRevoked({
        userId,
        badgeCode,
        removeAll: !!removeAll
      });
    }

    if (window.game) window.game.showToast('Écusson Modifié', `L'écusson a été mis à jour pour ce directeur.`, 'blue');
    this.renderBadgeManagerModalContent();
  },

  async updateBadgeQuantity(userId, badgeCode, delta) {
    if (delta > 0) {
      await this.awardBadgeToPlayer(userId, badgeCode, delta, false);
    } else {
      await this.revokeBadgeFromPlayer(userId, badgeCode, false);
    }
  },

  awardCustomBadgeFromSelect() {
    const sel = document.getElementById('adm-badge-catalog-select');
    const qtyInput = document.getElementById('adm-badge-catalog-qty');
    if (!sel || !sel.value) return;
    const qty = parseInt(qtyInput?.value || '1', 10) || 1;
    this.awardBadgeToPlayer(this.currentBadgeTargetUserId, sel.value, qty);
  },

  createAdminModalDOM() {
    if (document.getElementById('admin-modal')) return;
    const div = document.createElement('div');
    div.id = 'admin-modal';
    div.className = 'hidden fixed inset-0 z-[65] items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-in fade-in overflow-y-auto';
    div.innerHTML = `
      <div class="w-full max-w-5xl rounded-3xl glass-panel-heavy border-2 border-indigo-500/50 p-4 sm:p-6 shadow-2xl relative text-left max-h-[92vh] flex flex-col my-auto">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200/80 mb-3 sm:mb-4 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-600/30 text-lg">
              👑
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-black text-slate-900 leading-tight">Panel Administrateur Protec Live</h3>
              <p class="text-xs text-indigo-600 font-bold">Gestion globale des Directeurs & Antennes</p>
            </div>
          </div>
          <button onclick="window.ProtecAdmin.closeAdminModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- 4 Cartes de Statistiques -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-3 sm:mb-4 flex-shrink-0">
          <div class="p-2.5 sm:p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-sm">
            <div class="text-[9px] font-black uppercase text-slate-400">Directeurs Inscrits</div>
            <div class="text-lg font-black text-slate-800" id="admin-stat-total-users">-</div>
          </div>
          <div class="p-2.5 sm:p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-sm">
            <div class="text-[9px] font-black uppercase text-emerald-600 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              En Ligne Multi
            </div>
            <div class="text-lg font-black text-emerald-600" id="admin-stat-online">-</div>
          </div>
          <div class="p-2.5 sm:p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-sm">
            <div class="text-[9px] font-black uppercase text-slate-400">Parties Sauvegardées</div>
            <div class="text-lg font-black text-slate-800" id="admin-stat-saves">-</div>
          </div>
          <div class="p-2.5 sm:p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-sm">
            <div class="text-[9px] font-black uppercase text-slate-400">Alliances Actives</div>
            <div class="text-lg font-black text-indigo-600" id="admin-stat-alliances">-</div>
          </div>
        </div>

        <!-- Onglets Directeurs / Annonces / Anti-Triche / Support / Archives / Tests Missions / Événements -->
        <div class="flex items-center gap-2 mb-3 border-b border-slate-200/80 pb-2 flex-shrink-0 flex-wrap">
          <button id="admin-tab-players-btn" onclick="window.ProtecAdmin.switchTab('joueurs')" class="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer">
            👥 Directeurs & Comptes
          </button>
          <button id="admin-tab-announcements-btn" onclick="window.ProtecAdmin.switchTab('annonces')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer">
            📢 Annonces & Alertes Flash
          </button>
          <button id="admin-tab-suspicion-btn" onclick="window.ProtecAdmin.switchTab('suspicion')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer">
            🚨 Mouvements Suspects <span id="admin-suspicion-badge" class="hidden px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white animate-pulse">0</span>
          </button>
          <button id="admin-tab-referrals-btn" onclick="window.ProtecAdmin.switchTab('parrainages')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer">
            🎁 Sécurité & Parrainages <span id="admin-referral-fraud-badge" class="hidden px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white animate-pulse">0</span>
          </button>
          <button id="admin-tab-support-btn" onclick="window.ProtecAdmin.switchTab('support')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer">
            🛠️ Support Flotte & Missions
          </button>
          <button id="admin-tab-vehicles-btn" onclick="window.ProtecAdmin.switchTab('vehicules')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer">
            🚑 Véhicules
          </button>
          <button id="admin-tab-equipment-btn" onclick="window.ProtecAdmin.switchTab('materiel')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer">
            🎒 Matériel
          </button>
          <button id="admin-tab-events-btn" onclick="window.ProtecAdmin.switchTab('events')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer">
            🏅 Événements & Écussons
          </button>
          <button id="admin-tab-archives-btn" onclick="window.ProtecAdmin.switchTab('archives')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer">
            📦 Archives Sauvegardes
          </button>
          <button id="admin-tab-missions-btn" onclick="window.ProtecAdmin.switchTab('missions')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer">
            🚀 Recette & Tests
          </button>
          <button id="admin-tab-balancing-btn" onclick="window.ProtecAdmin.switchTab('balancing')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer" title="Gestion des probabilités et variables d'équilibrage du jeu">
            ⚙️ Équilibrage Gameplay
          </button>
        </div>

        <!-- Vue 1 : Directeurs & Comptes -->
        <div id="admin-view-players" class="flex flex-col flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
          <!-- Message Flash Broadcast -->
          <form onsubmit="window.ProtecAdmin.sendGlobalBroadcast(event)" class="flex gap-2 flex-shrink-0">
            <input type="text" id="admin-broadcast-input" placeholder="📢 Diffuser une annonce flash à tous les joueurs connectés..." 
              class="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            <button type="submit" class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm cursor-pointer">
              <span>Diffuser</span>
            </button>
          </form>

          <!-- Bandeau Analytics Global des Plateformes & Installations PWA (Repliable) -->
          <div class="flex-shrink-0 border border-slate-200/80 rounded-2xl bg-white/60 p-2 shadow-2xs">
            <div class="flex items-center justify-between px-2 py-1">
              <span class="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>📊 Dashboard Matériel & PWA</span>
              </span>
              <button type="button" id="admin-analytics-toggle-btn" onclick="window.ProtecAdmin.toggleAnalytics()" class="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1">
                <span id="admin-analytics-toggle-text">Masquer le tableau</span>
                <span id="admin-analytics-toggle-icon">▲</span>
              </button>
            </div>
            <div id="admin-global-platform-analytics-container" class="mt-1 transition-all duration-200"></div>
          </div>

          <!-- Recherche & Barre d'outils -->
          <div class="flex items-center justify-between gap-3 flex-shrink-0 pt-1">
            <input type="text" oninput="window.ProtecAdmin.onSearchInput(this.value)" placeholder="🔍 Rechercher un joueur, antenne, ville..." 
              class="w-72 px-3 py-1.5 rounded-xl border border-slate-200 bg-white/80 text-xs font-semibold focus:outline-none" />
            <div class="flex items-center gap-2">
              <button onclick="window.ProtecAdmin.openNotificationTester('all')" title="Tester les notifications sur un joueur ou en global" class="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs">
                <span>🔔 Test Notifications</span>
              </button>
              <button onclick="window.ProtecAdmin.openBadgeManagerForPlayer('all')" title="Gérer et distribuer des écussons aux directeurs (Admin, Zones de Défense...)" class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-pc-blue border border-blue-300 font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs">
                <span>🛡️ Distribution Écussons</span>
              </button>
              <button onclick="window.ProtecAdmin.loadAdminData(window.game)" class="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer">
                🔄 Rafraîchir
              </button>
            </div>
          </div>

          <!-- Table des Joueurs (Scrollable & Hauteur garantie) -->
          <div class="overflow-y-auto overflow-x-auto flex-1 min-h-[360px] rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm">
            <table class="w-full text-left border-collapse">
              <thead class="sticky top-0 bg-slate-100/95 backdrop-blur-md text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10">
                <tr>
                  <th class="py-2.5 px-3">Joueur / Rôle</th>
                  <th class="py-2.5 px-3">Antenne & Ville</th>
                  <th class="py-2.5 px-3">Support & App</th>
                  <th class="py-2.5 px-3">Temps de Connexion</th>
                  <th class="py-2.5 px-3">Trésorerie</th>
                  <th class="py-2.5 px-3">Avancement & Flotte</th>
                  <th class="py-2.5 px-3">Sauvegarde</th>
                  <th class="py-2.5 px-3">Statut</th>
                  <th class="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="admin-players-tbody">
                <!-- Rempli dynamiquement -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Vue : Annonces & Alertes Flash -->
        <div id="admin-view-announcements" class="hidden flex flex-col flex-1 min-h-0 overflow-y-auto space-y-4">
          <div class="p-4 rounded-3xl bg-indigo-50 border border-indigo-200">
            <h4 class="text-xs font-black text-indigo-950 uppercase mb-1 flex items-center gap-1.5">
              <span>📢 Diffusion d'Annonces & Ordres Généraux</span>
            </h4>
            <p class="text-[11px] text-indigo-700 leading-relaxed mb-3">
              Diffusez un message officiel en temps réel à l'ensemble des directeurs connectés. Le message apparaît immédiatement sur leur écran sous forme de bandeau d'alerte ou de fenêtre modale fédérale avec carillon d'urgence.
            </p>
            <form onsubmit="window.ProtecAdmin.handlePublishAnnouncement(event)" class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div class="sm:col-span-2">
                  <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Titre de l'annonce :</label>
                  <input type="text" id="adm-ann-title" placeholder="Ex: [MAJ 2.4] Nouvelles fonctionnalités disponibles !" required
                    class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Catégorie :</label>
                  <select id="adm-ann-category" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none">
                    <option value="update">🚀 Mise à jour</option>
                    <option value="event">🎪 Événement Spécial</option>
                    <option value="maintenance">🛠️ Maintenance Prévue</option>
                    <option value="urgent">🚨 Consigne Fédérale Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Message détaillé :</label>
                <textarea id="adm-ann-message" rows="3" placeholder="Saisissez ici les consignes, détails de mise à jour ou instructions fédérales transmises en direct à tous les joueurs..." required
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"></textarea>
              </div>

              <div class="flex items-center justify-between pt-1">
                <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-semibold">
                  <input type="checkbox" id="adm-ann-popup" checked class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span>Ouvrir une fenêtre modale d'alerte obligatoire à l'écran</span>
                </label>
                <button type="submit" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
                  <span>Diffuser l'Annonce Fédérale</span>
                </button>
              </div>
            </form>
          </div>

          <div class="p-3.5 rounded-2xl bg-white border border-slate-200">
            <h5 class="text-xs font-black text-slate-800 mb-2">Historique récent des diffusions administratives</h5>
            <div id="admin-broadcast-history" class="space-y-2 text-xs text-slate-500">
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] italic">Aucune annonce diffusée durant cette session.</div>
            </div>
          </div>
        </div>

        <!-- Vue : Alertes Mouvements Suspects & Anti-Triche -->
        <div id="admin-view-suspicion" class="hidden flex flex-col flex-1 min-h-0 overflow-y-auto space-y-4">
          <div class="p-4 rounded-3xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3">
            <div>
              <h4 class="text-xs font-black text-rose-950 uppercase mb-1 flex items-center gap-1.5">
                <span>🚨 Surveillance des Mouvements Suspects & Intégrité</span>
              </h4>
              <p class="text-[11px] text-rose-700 leading-relaxed">
                Détection automatique des hausses d'argent anormales (> 20 000 € d'un coup sans mission), du spam d'actions et des incohérences de trésorerie ou de véhicules dans les sauvegardes.
              </p>
            </div>
            <button onclick="window.ProtecAdmin.scanForSuspiciousActivities()" class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 cursor-pointer flex-shrink-0">
              <span>🔍 Scanner la BDD</span>
            </button>
          </div>

          <div class="flex-1 rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div class="p-3 bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-700 flex items-center justify-between">
              <span>Journal des Alertes & Incohérences Détectées</span>
              <span id="admin-suspicion-count-text" class="text-[10px] text-slate-500">0 alerte</span>
            </div>
            <div id="admin-suspicion-list" class="p-3 space-y-2 max-h-[380px] overflow-y-auto no-scrollbar">
              <div class="p-6 text-center text-xs text-slate-400 italic">Aucun mouvement suspect détecté. Tout est conforme.</div>
            </div>
          </div>
        </div>

        <!-- Vue : Support Flotte & Missions Joueur (Débogage) -->
        <div id="admin-view-support" class="hidden flex flex-col flex-1 min-h-0 overflow-y-auto space-y-4">
          <div class="p-4 rounded-3xl bg-amber-50 border border-amber-200">
            <h4 class="text-xs font-black text-amber-950 uppercase mb-1 flex items-center gap-1.5">
              <span>🛠️ Outils de Débogage & Assistance aux Joueurs</span>
            </h4>
            <p class="text-[11px] text-amber-800 leading-relaxed">
              Corrigez les situations de blocage pour un joueur spécifique : débloquer des missions bloquées, ajouter un véhicule d'urgence (VPSP, VTU, VLHR) ou réajuster un état de partie.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
            <label class="block text-xs font-bold text-slate-700">Sélectionnez le directeur à assister :</label>
            <div class="flex gap-2">
              <select id="adm-support-player-select" onchange="window.ProtecAdmin.onSupportPlayerSelected(this.value)" class="flex-1 px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 text-slate-800 focus:outline-none">
                <option value="">-- Choisir un joueur --</option>
              </select>
              <button onclick="window.ProtecAdmin.refreshSupportPlayerView()" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
                Actualiser
              </button>
            </div>
            <div id="adm-support-player-content" class="mt-3 space-y-3">
              <div class="p-6 text-center text-xs text-slate-400 italic">Sélectionnez un joueur ci-dessus pour inspecter et réparer sa partie.</div>
            </div>
          </div>
        </div>

        <!-- Vue 2 : Archives des Remises à Zéro (Restitution Joueur) -->
        <div id="admin-view-archives" class="hidden flex flex-col flex-1 min-h-0">
          <div class="p-3 mb-2 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span>🛡️ <strong>Registre de sécurité :</strong> Toutes les parties réinitialisées à zéro sont automatiquement archivées ici. Vous pouvez restituer la sauvegarde intégrale à un joueur en un clic.</span>
            <button onclick="window.ProtecAdmin.loadResetArchives()" class="px-2.5 py-1 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700">
              🔄 Actualiser
            </button>
          </div>

          <div class="overflow-y-auto overflow-x-auto flex-1 rounded-2xl border border-slate-200/80 bg-white/60 no-scrollbar">
            <table class="w-full text-left border-collapse">
              <thead class="sticky top-0 bg-slate-100/90 backdrop-blur-md text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th class="py-2.5 px-3">Archive / Date</th>
                  <th class="py-2.5 px-3">Directeur</th>
                  <th class="py-2.5 px-3">Trésorerie archivée</th>
                  <th class="py-2.5 px-3">Moyens sauvegardés</th>
                  <th class="py-2.5 px-3">Motif</th>
                  <th class="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody id="admin-archives-tbody">
                <!-- Rempli dynamiquement -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Vue 3 : Déclencheur Universel de Missions (Tests & Sandbox) -->
        <div id="admin-view-missions" class="hidden flex flex-col flex-1 min-h-0 overflow-y-auto space-y-4">
          <div class="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between">
            <div>
              <span class="font-extrabold block">🛠️ Outil de Recette & Simulation Opérationnelle</span>
              <span class="text-[11px] text-indigo-700">Déclenchez instantanément n'importe quel type de mission sur la carte pour tester l'engagement, les alertes, les effectifs et les lots.</span>
            </div>
          </div>

          <!-- SECTION TESTEUR DE NOTIFICATIONS ADMIN -->
          <div class="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border-2 border-amber-300 space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md text-base">
                  🔔
                </div>
                <div>
                  <h4 class="text-xs font-black text-slate-900 uppercase tracking-wide">Laboratoire de Recette : Notifications & Alertes Joueurs</h4>
                  <p class="text-[11px] text-slate-600">Testez le déclenchement des push système OS, carillons audio, toasts d'écran et vibrations haptiques sur n'importe quel directeur.</p>
                </div>
              </div>
              <button onclick="window.ProtecAdmin.openNotificationTester('all')" class="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5">
                <span>🔔 Ouvrir le Studio de Test des Notifications</span>
              </button>
            </div>

            <!-- Boutons de test rapide direct -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
              <button onclick="window.ProtecAdmin.previewScenarioNotification('samu')" title="Aperçu direct sur mon écran" class="p-2.5 rounded-2xl bg-white border border-rose-200 hover:border-rose-400 hover:bg-rose-50/50 shadow-2xs transition flex flex-col items-center text-center gap-1 group cursor-pointer">
                <span class="text-lg">🚨</span>
                <span class="text-[11px] font-black text-rose-900 leading-tight">SAMU 15</span>
                <span class="text-[9px] text-slate-500">Urgence vitale</span>
              </button>
              <button onclick="window.ProtecAdmin.previewScenarioNotification('dps_devis')" title="Aperçu direct sur mon écran" class="p-2.5 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-2xs transition flex flex-col items-center text-center gap-1 group cursor-pointer">
                <span class="text-lg">💶</span>
                <span class="text-[11px] font-black text-emerald-900 leading-tight">Devis DPS</span>
                <span class="text-[9px] text-slate-500">+14 500 €</span>
              </button>
              <button onclick="window.ProtecAdmin.previewScenarioNotification('recrutement')" title="Aperçu direct sur mon écran" class="p-2.5 rounded-2xl bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 shadow-2xs transition flex flex-col items-center text-center gap-1 group cursor-pointer">
                <span class="text-lg">👥</span>
                <span class="text-[11px] font-black text-blue-900 leading-tight">Bénévole</span>
                <span class="text-[9px] text-slate-500">Recrue PSE2</span>
              </button>
              <button onclick="window.ProtecAdmin.previewScenarioNotification('meteo')" title="Aperçu direct sur mon écran" class="p-2.5 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 shadow-2xs transition flex flex-col items-center text-center gap-1 group cursor-pointer">
                <span class="text-lg">⚠️</span>
                <span class="text-[11px] font-black text-amber-900 leading-tight">Météo Orange</span>
                <span class="text-[9px] text-slate-500">Crues / Crise</span>
              </button>
              <button onclick="window.ProtecAdmin.previewScenarioNotification('ecusson')" title="Aperçu direct sur mon écran" class="p-2.5 rounded-2xl bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50/50 shadow-2xs transition flex flex-col items-center text-center gap-1 group cursor-pointer">
                <span class="text-lg">🏆</span>
                <span class="text-[11px] font-black text-purple-900 leading-tight">Écusson</span>
                <span class="text-[9px] text-slate-500">Déblocage FNPC</span>
              </button>
              <button onclick="window.ProtecAdmin.previewScenarioNotification('ordre_mission')" title="Aperçu direct sur mon écran" class="p-2.5 rounded-2xl bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 shadow-2xs transition flex flex-col items-center text-center gap-1 group cursor-pointer">
                <span class="text-lg">📢</span>
                <span class="text-[11px] font-black text-indigo-900 leading-tight">Ordre National</span>
                <span class="text-[9px] text-slate-500">Alerte renfort</span>
              </button>
            </div>
          </div>

          <!-- SECTION DISTRIBUTION D'ÉCUSSONS & DISTINCTIONS FÉDÉRALES -->
          <div class="p-4 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-2 border-blue-300 space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-2xl bg-pc-blue text-white flex items-center justify-center font-black shadow-md text-base">
                  🛡️
                </div>
                <div>
                  <h4 class="text-xs font-black text-slate-900 uppercase tracking-wide">Attribution Fédérale d'Écussons (Admin & Zones de Défense)</h4>
                  <p class="text-[11px] text-slate-600">Décerné à la main par l'Administration : Écusson Admin suprême et les 7 écussons territoriaux des Zones de Défense et de Sécurité.</p>
                </div>
              </div>
              <button onclick="window.ProtecAdmin.openBadgeManagerForPlayer('all')" class="px-3.5 py-1.5 rounded-xl bg-pc-blue hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5">
                <span>🛡️ Ouvrir le Gestionnaire d'Écussons</span>
              </button>
            </div>

            <!-- Raccourcis de distribution rapide en 1 clic -->
            <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1 text-center">
              <button onclick="window.ProtecAdmin.awardBadgeToPlayer('all', 'badge_admin')" title="Décerner l'écusson Admin à tous les directeurs" class="p-2.5 rounded-2xl bg-white border border-rose-200 hover:border-rose-400 hover:bg-rose-50/50 shadow-2xs transition flex flex-col items-center gap-1 cursor-pointer">
                <span class="text-base">👑</span>
                <span class="text-[10px] font-black text-rose-900 leading-tight">Admin Fédéral</span>
                <span class="text-[8px] text-slate-500">badge_admin.png</span>
              </button>
              <button onclick="window.ProtecAdmin.awardBadgeToPlayer('all', 'badge_def_est')" title="Décerner Zone Est" class="p-2.5 rounded-2xl bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 shadow-2xs transition flex flex-col items-center gap-1 cursor-pointer">
                <span class="text-base">🧭</span>
                <span class="text-[10px] font-black text-blue-900 leading-tight">Zone EST</span>
                <span class="text-[8px] text-slate-500">badge_def_est.png</span>
              </button>
              <button onclick="window.ProtecAdmin.awardBadgeToPlayer('all', 'badge_def_nord')" title="Décerner Zone Nord" class="p-2.5 rounded-2xl bg-white border border-sky-200 hover:border-sky-400 hover:bg-sky-50/50 shadow-2xs transition flex flex-col items-center gap-1 cursor-pointer">
                <span class="text-base">🧭</span>
                <span class="text-[10px] font-black text-sky-900 leading-tight">Zone NORD</span>
                <span class="text-[8px] text-slate-500">badge_def_nord.png</span>
              </button>
              <button onclick="window.ProtecAdmin.awardBadgeToPlayer('all', 'badge_def_ouest')" title="Décerner Zone Ouest" class="p-2.5 rounded-2xl bg-white border border-teal-200 hover:border-teal-400 hover:bg-teal-50/50 shadow-2xs transition flex flex-col items-center gap-1 cursor-pointer">
                <span class="text-base">🧭</span>
                <span class="text-[10px] font-black text-teal-900 leading-tight">Zone OUEST</span>
                <span class="text-[8px] text-slate-500">badge_def_ouest.png</span>
              </button>
              <button onclick="window.ProtecAdmin.awardBadgeToPlayer('all', 'badge_def_sudest')" title="Décerner Zone Sud-Est" class="p-2.5 rounded-2xl bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 shadow-2xs transition flex flex-col items-center gap-1 cursor-pointer">
                <span class="text-base">🧭</span>
                <span class="text-[10px] font-black text-indigo-900 leading-tight">Zone SUD-EST</span>
                <span class="text-[8px] text-slate-500">badge_def_sudest.png</span>
              </button>
              <button onclick="window.ProtecAdmin.awardBadgeToPlayer('all', 'badge_def_sud')" title="Décerner Zone Sud" class="p-2.5 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 shadow-2xs transition flex flex-col items-center gap-1 cursor-pointer">
                <span class="text-base">🧭</span>
                <span class="text-[10px] font-black text-amber-900 leading-tight">Zone SUD</span>
                <span class="text-[8px] text-slate-500">badge_def_sud.png</span>
              </button>
              <button onclick="window.ProtecAdmin.awardBadgeToPlayer('all', 'badge_def_paris')" title="Décerner Zone Paris" class="p-2.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50/50 shadow-2xs transition flex flex-col items-center gap-1 cursor-pointer">
                <span class="text-base">🧭</span>
                <span class="text-[10px] font-black text-slate-900 leading-tight">Zone PARIS</span>
                <span class="text-[8px] text-slate-500">badge_def_paris.png</span>
              </button>
            </div>
          </div>

          <!-- ORDRES DE MISSION NATIONAUX FNPC (DÉCLENCHEMENT EXCLUSIF ADMIN) -->
          <div class="p-4 rounded-3xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-purple-500/10 border-2 border-orange-300 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">🌐</span>
                <div>
                  <h4 class="text-xs font-black text-slate-900 uppercase tracking-wide">Ordres de Mission Nationaux FNPC (Zone Nationale)</h4>
                  <p class="text-[11px] text-slate-600">Réservé à l'administration : diffuse un appel national extra-départemental en temps réel à toutes les antennes connectées.</p>
                </div>
              </div>
              <button onclick="window.ProtecAdmin.clearNationalRenforts()" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-xs transition border border-slate-200">
                Clôturer Renforts Nationaux
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
              <button onclick="window.ProtecAdmin.triggerNationalRenfort('novi')" class="p-2.5 rounded-2xl bg-white border border-rose-200 hover:border-rose-400 hover:bg-rose-50/50 shadow-xs transition flex flex-col items-center text-center gap-1 group cursor-pointer">
                <span class="text-lg">🚨</span>
                <span class="text-[11px] font-black text-rose-900 leading-tight">Plan NOVI (21)</span>
                <span class="text-[9px] text-slate-500">6 places • +920 €</span>
              </button>

              <button onclick="window.ProtecAdmin.triggerNationalRenfort('inondation')" class="p-2.5 rounded-2xl bg-white border border-cyan-200 hover:border-cyan-400 hover:bg-cyan-50/50 shadow-xs transition flex flex-col items-center text-center gap-1 group cursor-pointer">
                <span class="text-lg">🌊</span>
                <span class="text-[11px] font-black text-cyan-900 leading-tight">ORSEC Crues (62)</span>
                <span class="text-[9px] text-slate-500">6 places • +780 €</span>
              </button>

              <button onclick="window.ProtecAdmin.triggerNationalRenfort('feux')" class="p-2.5 rounded-2xl bg-white border border-orange-200 hover:border-orange-400 hover:bg-orange-50/50 shadow-xs transition flex flex-col items-center text-center gap-1 group cursor-pointer">
                <span class="text-lg">🚒</span>
                <span class="text-[11px] font-black text-orange-900 leading-tight">Feux de Forêt (83)</span>
                <span class="text-[9px] text-slate-500">6 places • +720 €</span>
              </button>

              <button onclick="window.ProtecAdmin.triggerNationalRenfort('festival')" class="p-2.5 rounded-2xl bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 shadow-xs transition flex flex-col items-center text-center gap-1 group cursor-pointer">
                <span class="text-lg">🎪</span>
                <span class="text-[11px] font-black text-indigo-900 leading-tight">DPS Festival (29)</span>
                <span class="text-[9px] text-slate-500">8 places • +840 €</span>
              </button>

              <button onclick="window.ProtecAdmin.triggerNationalRenfort('maraude')" class="p-2.5 rounded-2xl bg-white border border-sky-200 hover:border-sky-400 hover:bg-sky-50/50 shadow-xs transition flex flex-col items-center text-center gap-1 group cursor-pointer">
                <span class="text-lg">❄️</span>
                <span class="text-[11px] font-black text-sky-900 leading-tight">Grand Froid (59)</span>
                <span class="text-[9px] text-slate-500">6 places • +580 €</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <!-- 1. DPS PAPS -->
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">DPS PAPS (2 pers.)</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-blue-100 text-pc-blue">Brocante</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Poste à pied modeste, idéal pour début de partie sans véhicule.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('dps_paps')" class="w-full py-2 rounded-xl text-xs font-black bg-pc-blue text-white hover:bg-pc-blue-light transition">
                Générer PAPS
              </button>
            </div>

            <!-- 2. DPS Moyen PE -->
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">DPS-PE (4 sec. + VPSP)</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-blue-100 text-pc-blue">Tournoi</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Dispositif standard avec 1 ambulance et 1 Chef d'Équipe.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('dps_pe')" class="w-full py-2 rounded-xl text-xs font-black bg-pc-blue text-white hover:bg-pc-blue-light transition">
                Générer DPS-PE
              </button>
            </div>

            <!-- 3. DPS Grand Rassemblement GE -->
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">DPS-GE (10 sec. + 2 VPSP)</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-purple-100 text-purple-700">Festival</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Grande envergure nécessitant Chef de Dispositif et Lot C.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('dps_ge')" class="w-full py-2 rounded-xl text-xs font-black bg-purple-600 text-white hover:bg-purple-700 transition">
                Générer DPS-GE
              </button>
            </div>

            <!-- 4. SAMU 15 -->
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Urgence SAMU 15</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 text-pc-orange">Départ Réflexe</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Malaise grave à domicile ou détresse respiratoire régulée 15.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('samu')" class="w-full py-2 rounded-xl text-xs font-black bg-pc-orange text-white hover:brightness-110 transition">
                Déclencher SAMU 15
              </button>
            </div>

            <!-- 5. Pompiers SDIS -->
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Garde SDIS 18</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-700">Renfort CODIS</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Accident de circulation carambolage ou renfort caserne.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('pompiers')" class="w-full py-2 rounded-xl text-xs font-black bg-red-600 text-white hover:bg-red-700 transition">
                Déclencher SDIS
              </button>
            </div>

            <!-- 6. Crise NOVI -->
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Plan NOVI / Catastrophe</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-800 animate-pulse">ORSEC</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Accident collectif ferroviaire, PMA, chaîne de tri et noria.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('crise_novi')" class="w-full py-2 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-700 text-white hover:brightness-110 transition">
                Déclencher Plan NOVI
              </button>
            </div>

            <!-- 7. Alerte CUMP & CAI -->
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Alerte CUMP & CAI</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-purple-100 text-purple-700">Soutien Psy</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Convention CUMP : montage sous 2h d'un Centre d'Accueil des Impliqués.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('cump_cai')" class="w-full py-2 rounded-xl text-xs font-black bg-purple-700 text-white hover:bg-purple-800 transition">
                Déclencher CAI CUMP
              </button>
            </div>

            <!-- 8. Crise Ferroviaire SNCF -->
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Convention SNCF Réseau</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800">TGV Bloqué</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Rupture caténaire et déploiement CHU en gare.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('sncf')" class="w-full py-2 rounded-xl text-xs font-black bg-amber-600 text-white hover:bg-amber-700 transition">
                Déclencher Préalerte SNCF
              </button>
            </div>

            <!-- 9. Maraude Sociale -->
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Maraude Sociale 115</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-purple-100 text-purple-700">Pôle Social</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Tournée de nuit avec boissons chaudes et duvets.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('social')" class="w-full py-2 rounded-xl text-xs font-black bg-purple-600 text-white hover:bg-purple-700 transition">
                Lancer Maraude
              </button>
            </div>

            <!-- 10. Formation Grand Public -->
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Formation PSC1 / SST</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">Pédagogie</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Session payante grand public avec formateurs de l'antenne.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('formation')" class="w-full py-2 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 transition">
                Ouvrir Session Formation
              </button>
            </div>

            <!-- 11. Météo Crues / Inondations -->
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Alerte Intempéries Météo</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-sky-100 text-sky-800">Pompage / Crues</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Intervention motopompes et reconnaissance de voiries inondées.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('meteo')" class="w-full py-2 rounded-xl text-xs font-black bg-sky-600 text-white hover:bg-sky-700 transition">
                Générer Alerte Météo
              </button>
            </div>

            <!-- 12. Devis DPS Immédiat -->
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Nouvelle Demande Devis</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800">Finances</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Sollicitation par une mairie ou un club avec dimensionnement libre.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('devis')" class="w-full py-2 rounded-xl text-xs font-black bg-amber-500 text-white hover:bg-amber-600 transition">
                Recevoir un Devis
              </button>
            </div>

            <!-- 13. Aléa de Sécurité Bâtiment -->
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Incident Sécurité Bâtiment</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-800">Aléa / Risque</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Déclenche une tentative de vol ou de dégradation pour tester vos défenses.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('securite')" class="w-full py-2 rounded-xl text-xs font-black bg-rose-600 text-white hover:bg-rose-700 transition">
                Simuler Effraction / Vol
              </button>
            </div>

            <!-- 14. Livraison Rapide des Chantiers -->
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Livrer les Chantiers</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-teal-100 text-teal-800">Locaux</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Achève instantanément tous les travaux d'aménagement de pièces en cours.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('finish_works')" class="w-full py-2 rounded-xl text-xs font-black bg-teal-600 text-white hover:bg-teal-700 transition">
                Achever Tous les Travaux
              </button>
            </div>

            <!-- 15. Scénario Réel : Recherche Disparu Gendarmerie -->
            <div class="p-3.5 rounded-2xl glass-card border border-indigo-200 bg-indigo-50/20 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Recherche Gendarmerie</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-800">Drone / Cyno</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Battue en forêt : réquisition PC, télépilote drone thermique, chiens et 4x4.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('scen_recherche_disparu')" class="w-full py-2 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 transition">
                Déclencher Battue Gendarmerie
              </button>
            </div>

            <!-- 16. Scénario Réel : Crash Aérien & CAI CUMP -->
            <div class="p-3.5 rounded-2xl glass-card border border-rose-200 bg-rose-50/20 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Crash Aérien & CUMP</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-800 animate-pulse">50 Impliqués</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Plan catastrophe : CAI sous astreinte CUMP, secrétariat SINUS et réconfort.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('scen_crash_aerien')" class="w-full py-2 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-700 text-white hover:brightness-110 transition">
                Déclencher Crash Aérien CAI
              </button>
            </div>

            <!-- 17. Scénario Réel : Incendie EHPAD -->
            <div class="p-3.5 rounded-2xl glass-card border border-amber-200 bg-amber-50/20 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Incendie EHPAD</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800">Évacuation</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Évacuation sanitaire collective : noria d'ambulances VPSP et transport VTP.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('scen_incendie_ehpad')" class="w-full py-2 rounded-xl text-xs font-black bg-amber-600 text-white hover:bg-amber-700 transition">
                Déclencher Incendie EHPAD
              </button>
            </div>

            <!-- 18. Scénario Réel : Manifestation Étudiante SDIS -->
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Manifestation & Garde SDIS</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-slate-100 text-slate-700">Préalerte J-1</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Astreinte H-12 et renfort VPSP en caserne pour tension urbaine.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('scen_manifestation_etudiante')" class="w-full py-2 rounded-xl text-xs font-black bg-slate-800 text-white hover:bg-slate-900 transition">
                Déclencher Garde Manif
              </button>
            </div>

            <!-- 19. Scénario Réel : Vigilance Canicule SNCF -->
            <div class="p-3.5 rounded-2xl glass-card border border-sky-200 bg-sky-50/20 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Canicule SNCF Gares</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-sky-100 text-sky-800">Convention</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Distribution d'eau et brumisateurs en gare et voies lors de blocages TGV.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('scen_canicule_sncf')" class="w-full py-2 rounded-xl text-xs font-black bg-sky-600 text-white hover:bg-sky-700 transition">
                Déclencher Canicule SNCF
              </button>
            </div>

            <!-- 20. Scénario Réel : Tempête Alerte Rouge -->
            <div class="p-3.5 rounded-2xl glass-card border border-red-300 bg-red-50/20 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Tempête Alerte Rouge</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-800">Interdépartemental</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Renforts 10 départements : CHU isolé, tronçonnage, bâchage et CHU.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('scen_tempete_rouge')" class="w-full py-2 rounded-xl text-xs font-black bg-red-700 text-white hover:bg-red-800 transition">
                Déclencher Tempête Rouge
              </button>
            </div>

            <!-- 21. Scénario Réel : Grand Froid & Verglas -->
            <div class="p-3.5 rounded-2xl glass-card border border-cyan-200 bg-cyan-50/20 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Grand Froid : 2 VPSP SDIS</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-cyan-100 text-cyan-800">Verglas / SUAP</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Chutes et carambolages : engagement de 2 ambulances en renfort pompiers.</p>
              </div>
              <button onclick="window.ProtecAdmin.triggerTestMission('scen_grand_froid')" class="w-full py-2 rounded-xl text-xs font-black bg-cyan-700 text-white hover:bg-cyan-800 transition">
                Déclencher Grand Froid (2 VPSP)
              </button>
            </div>
          </div>
        </div>

        <!-- Vue : Gestion du Catalogue des Véhicules (Prix, Photos, Caractéristiques) -->
        <div id="admin-view-vehicules" class="hidden flex flex-col flex-1 min-h-0 overflow-y-auto space-y-3">
          <div class="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span class="font-extrabold block text-sm flex items-center gap-1.5">
                <span>🚑</span> Gestion & Configuration de Tous les Véhicules
              </span>
              <span class="text-[11px] text-indigo-700">Ajustez en direct les prix d'achat, les photos, capacités en équipiers, vitesses, permis requis et options (attelage, gyros) de chaque véhicule.</span>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" onclick="window.ProtecAdmin.openCreateVehicleModal()" class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
                <span>➕</span> Nouveau Véhicule
              </button>
              <button type="button" onclick="window.ProtecAdmin.resetVehiclesCatalog()" class="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer" title="Réinitialiser au catalogue d'origine">
                🔄 Réinitialiser
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3 flex-wrap">
            <input type="text" oninput="window.ProtecAdmin.filterVehicles(this.value)" placeholder="🔍 Rechercher un véhicule (nom, type, catégorie)..." class="w-72 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white" />
            <span id="admin-vehicles-count" class="text-xs font-bold text-slate-500"></span>
          </div>

          <div id="admin-vehicles-list-container" class="grid grid-cols-1 md:grid-cols-2 gap-3.5 pb-4">
            <!-- Rempli dynamiquement -->
          </div>
        </div>

        <!-- Vue : Gestion du Catalogue de Matériel & Lots -->
        <div id="admin-view-materiel" class="hidden flex flex-col flex-1 min-h-0 overflow-y-auto space-y-3">
          <div class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span class="font-extrabold block text-sm flex items-center gap-1.5">
                <span>🎒</span> Gestion & Configuration de Tout le Matériel & Lots
              </span>
              <span class="text-[11px] text-amber-800">Modifiez les prix, les lots d'intervention (Lot A, B, C, PCM, etc.), les photos/icônes, les tailles d'encombrement et les bonus opérationnels.</span>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" onclick="window.ProtecAdmin.openCreateEquipmentModal()" class="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
                <span>➕</span> Nouveau Matériel / Lot
              </button>
              <button type="button" onclick="window.ProtecAdmin.resetEquipmentCatalog()" class="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer" title="Réinitialiser au catalogue d'origine">
                🔄 Réinitialiser
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3 flex-wrap">
            <input type="text" oninput="window.ProtecAdmin.filterEquipment(this.value)" placeholder="🔍 Rechercher un matériel (nom, id, catégorie)..." class="w-72 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white" />
            <span id="admin-equipment-count" class="text-xs font-bold text-slate-500"></span>
          </div>

          <div id="admin-equipment-list-container" class="grid grid-cols-1 md:grid-cols-2 gap-3.5 pb-4">
            <!-- Rempli dynamiquement -->
          </div>
        </div>

        <!-- Vue 4 : Modération des Événements & Écussons Proposés -->
        <div id="admin-view-events" class="hidden flex flex-col flex-1 min-h-0 overflow-y-auto space-y-4">
          <div class="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span class="font-extrabold block flex items-center gap-1.5 text-sm">
                <i data-lucide="award" class="w-4 h-4 text-purple-700"></i>
                Modération & Gestion des Événements Fédéraux
              </span>
              <span class="text-[11px] text-purple-700">Créez des événements officiels sur la carte, examinez les propositions des directeurs, ou validez les déploiements de crise.</span>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <button type="button" onclick="window.ProtecAdmin.openCreateEventModal()" class="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
                <span>➕</span> Créer un Événement Officiel
              </button>
              <button type="button" onclick="window.ProtecAIBadgeGenerator && window.ProtecAIBadgeGenerator.openModal()" class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
                <span>🎨</span> Générateur d’Écussons IA (Gemini)
              </button>
              <button onclick="window.ProtecAdmin.loadEventsData()" class="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition cursor-pointer">
                🔄 Actualiser
              </button>
            </div>
          </div>

          <!-- Liste des Événements Proposés / En Cours -->
          <div>
            <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🎪</span> Événements Fédéraux en Cours & Proposés
            </h4>
            <div id="admin-events-list-container" class="space-y-3">
              <!-- Rempli dynamiquement -->
            </div>
          </div>

          <!-- Section 2 : Catalogue & Attribution des Écussons Officiels -->
          <div class="pt-5 border-t border-purple-200 space-y-3">
            <div class="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white flex items-center justify-between flex-wrap gap-2 shadow-md">
              <div>
                <span class="font-extrabold text-sm block flex items-center gap-1.5">
                  <span>🏅</span> Gestion de Tous les Écussons & Attribution aux Joueurs
                </span>
                <span class="text-[11px] text-purple-200">Gérez le catalogue officiel des écussons (images PNG, noms, raretés) et décernez-les directement aux directeurs méritants.</span>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" onclick="window.ProtecAdmin.openCreateBadgeModal()" class="px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs shadow-sm transition flex items-center gap-1 cursor-pointer">
                  <span>➕</span> Nouvel Écusson
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3 flex-wrap">
              <input type="text" oninput="window.ProtecAdmin.filterBadges(this.value)" placeholder="🔍 Rechercher un écusson par nom, catégorie, département..." class="w-72 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white" />
              <span id="admin-badges-count" class="text-xs font-bold text-slate-500"></span>
            </div>

            <div id="admin-badges-list-container" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pb-6">
              <!-- Rempli dynamiquement -->
            </div>
          </div>
        </div>

        <!-- Vue : Sécurité & Parrainages (Contrôle Anti-Triche Réseau & Logs de Fraude) -->
        <div id="admin-view-referrals" class="hidden flex flex-col flex-1 min-h-0 overflow-y-auto space-y-4">
          <!-- Bannière informative -->
          <div class="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-rose-950 border border-rose-500/30 text-white flex items-center justify-between flex-wrap gap-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white uppercase tracking-wider">Sécurité Opérationnelle</span>
                <span class="text-xs font-black text-rose-300">Contrôle Anti-Fraude IP & Liaison Parrain</span>
              </div>
              <h4 class="text-sm font-black text-white">Supervision des Parrainages & Détection d'Anomalies IP</h4>
              <p class="text-[11px] text-slate-300">Auditez les tentatives de doublons d'adresse IP (même IP parrain/filleul ou filleuls partagés). Les récidivistes (≥ 2 tentatives) sont mis en surbrillance rouge.</p>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="window.ProtecAdmin.loadReferralsData()" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-1.5 border border-white/20 cursor-pointer">
                <span>🔄 Actualiser</span>
              </button>
            </div>
          </div>

          <!-- Section 1 : Tableau des Incidents de Fraude (fraud_logs) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <h4 class="text-xs font-black text-slate-900 uppercase tracking-wide">Journal des Incidents de Fraude Détectés (fraud_logs)</h4>
              </div>
              <span id="admin-fraud-logs-count" class="text-xs font-bold text-slate-500">0 incident(s)</span>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th class="py-2.5 px-3">Date</th>
                      <th class="py-2.5 px-3">Parrain (Pseudo + ID)</th>
                      <th class="py-2.5 px-3">Filleul Tenté</th>
                      <th class="py-2.5 px-3">IP Détectée</th>
                      <th class="py-2.5 px-3">Raison du Blocage</th>
                      <th class="py-2.5 px-3">Statut</th>
                      <th class="py-2.5 px-3 text-right">Actions Rapides</th>
                    </tr>
                  </thead>
                  <tbody id="admin-fraud-logs-tbody" class="divide-y divide-slate-100 font-medium text-slate-700">
                    <tr>
                      <td colspan="7" class="py-6 text-center text-xs text-slate-400">Chargement des données de sécurité...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Section 2 : Tableau des Parrainages Actifs & Réussis (referral_logs) -->
          <div class="space-y-2 pt-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h4 class="text-xs font-black text-slate-900 uppercase tracking-wide">Historique des Parrainages Conformes (referral_logs)</h4>
              </div>
              <span id="admin-referrals-count" class="text-xs font-bold text-slate-500">0 parrainage(s)</span>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th class="py-2.5 px-3">Date</th>
                      <th class="py-2.5 px-3">Parrain</th>
                      <th class="py-2.5 px-3">Filleul</th>
                      <th class="py-2.5 px-3">Statut Palier</th>
                      <th class="py-2.5 px-3">Bonus Filleul (+1 500 €)</th>
                      <th class="py-2.5 px-3">Prime Parrain (+2 500 €)</th>
                    </tr>
                  </thead>
                  <tbody id="admin-referrals-tbody" class="divide-y divide-slate-100 font-medium text-slate-700">
                    <tr>
                      <td colspan="6" class="py-6 text-center text-xs text-slate-400">Aucun parrainage enregistré.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Vue : Équilibrage Gameplay (Tuning Live & Déclencheurs de Test) -->
        <div id="admin-view-balancing" class="hidden flex flex-col flex-1 min-h-0 overflow-y-auto space-y-4 pr-1"></div>

      </div>
    `;
    document.body.appendChild(div);
  },

  // Déclencheur universel de missions pour test
  triggerTestMission(type) {
    const game = window.game;
    if (!game) return;
    const base = game.stations[0] || { lat: 48.8566, lng: 2.3522, name: 'Antenne Principale' };
    let m = null;
    const now = Date.now();

    if (type === 'dps_paps') {
      const loc = game.calculateRealisticMissionLocation(base, 'dps');
      m = {
        id: `test-dps-${now}`,
        title: 'DPS PAPS : Brocante de Printemps',
        desc: 'Poste de secours pour 800 chineurs. PAPS à pied 2 secouristes.',
        type: 'dps',
        scale: 'PAPS (2 secouristes)',
        urgency: 'normale',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 2,
        requiredRanks: ['PSE1', 'PSE2'],
        requiredVehicles: [],
        rewardMoney: 280,
        rewardReputation: 15,
        durationSeconds: 180,
        durationHours: '3.0',
        eventDate: { ...game.clock },
        status: 'planifie',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    } else if (type === 'dps_pe') {
      const loc = game.calculateRealisticMissionLocation(base, 'dps');
      m = {
        id: `test-dps-${now}`,
        title: 'DPS-PE : Tournoi Régional de Handball',
        desc: 'Dispositif prévisionnel de secours petite envergure pour 2 500 spectateurs.',
        type: 'dps',
        scale: 'DPS-PE (4 secouristes + VPSP)',
        urgency: 'normale',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 4,
        requiredRanks: ['CE', 'PSE2', 'PSE1'],
        requiredVehicles: ['VPSP'],
        rewardMoney: 540,
        rewardReputation: 25,
        durationSeconds: 240,
        durationHours: '4.5',
        eventDate: { ...game.clock },
        status: 'planifie',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    } else if (type === 'dps_ge') {
      const loc = game.calculateRealisticMissionLocation(base, 'dps');
      m = {
        id: `test-dps-${now}`,
        title: 'DPS-GE : Festival Électro & Son en Plein Air',
        desc: 'Dispositif de grande envergure pour 12 000 festivaliers avec poste fixe et ambulances.',
        type: 'dps',
        scale: 'DPS-GE (10 secouristes + 2 VPSP + VTU)',
        urgency: 'normale',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 10,
        requiredRanks: ['CD', 'CE', 'PSE2', 'PSE1'],
        requiredVehicles: ['VPSP', 'VPSP', 'VTU'],
        rewardMoney: 1650,
        rewardReputation: 55,
        durationSeconds: 360,
        durationHours: '7.0',
        eventDate: { ...game.clock },
        status: 'planifie',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    } else if (type === 'samu') {
      const loc = game.calculateRealisticMissionLocation(base, 'samu');
      m = {
        id: `test-samu-${now}`,
        title: 'SAMU 15 : Malaise Cardiaque à Domicile',
        desc: 'Départ réflexe VPSP sur demande du médecin régulateur SAMU 15. Oxygénothérapie et transport CH.',
        type: 'samu',
        urgency: 'critique',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 3,
        requiredRanks: ['CE', 'PSE2', 'PSE1'],
        requiredVehicles: ['VPSP'],
        rewardMoney: 320,
        rewardReputation: 35,
        durationSeconds: 90,
        durationHours: '0.8',
        eventDate: { ...game.clock },
        status: 'declenche',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    } else if (type === 'pompiers') {
      const loc = game.calculateRealisticMissionLocation(base, 'pompiers');
      m = {
        id: `test-sdis-${now}`,
        title: 'SDIS 18 : Renfort Évacuation AVP Voie Rapide',
        desc: 'Le CTA-CODIS sollicite un VPSP Protection Civile en renfort des sapeurs-pompiers suite à accident.',
        type: 'pompiers',
        urgency: 'haute',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 3,
        requiredRanks: ['PSE2', 'PSE1'],
        requiredVehicles: ['VPSP'],
        rewardMoney: 380,
        rewardReputation: 30,
        durationSeconds: 100,
        durationHours: '1.2',
        eventDate: { ...game.clock },
        status: 'declenche',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    } else if (type === 'crise_novi') {
      const loc = game.calculateRealisticMissionLocation(base, 'crise');
      m = {
        id: `test-novi-${now}`,
        title: 'CRISE NOVI : Déraillement Train Express & 35 Impliqués',
        desc: 'Plan NOVI activé par la Préfecture. Montage d’un Poste Médical Avancé (PMA), CAI et noria de VPSP.',
        type: 'crise',
        scale: 'PLAN NOVI (8 secouristes + PMA + VPSP)',
        urgency: 'critique',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 8,
        requiredRanks: ['CD', 'CE', 'PSE2', 'PSE1'],
        requiredVehicles: ['VPSP', 'VTU'],
        rewardMoney: 1800,
        rewardReputation: 70,
        durationSeconds: 300,
        durationHours: '5.0',
        eventDate: { ...game.clock },
        status: 'declenche',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    } else if (type === 'cump_cai') {
      if (typeof game.generateCumpCaiMission === 'function') {
        game.generateCumpCaiMission();
        game.showToast('Test CUMP Déclenché', 'Mission Cellule d’Accueil des Impliqués générée avec succès.', 'green');
        return;
      }
    } else if (type === 'sncf') {
      if (typeof game.triggerSncfRailCrisis === 'function') {
        game.triggerSncfRailCrisis();
        game.showToast('Test SNCF Déclenché', 'Préalerte rupture caténaire générée avec succès.', 'green');
        return;
      }
    } else if (type === 'social') {
      const loc = game.calculateRealisticMissionLocation(base, 'social');
      m = {
        id: `test-social-${now}`,
        title: 'Social : Maraude Nocturne & Urgence 115',
        desc: 'Distribution de duvets, repas chauds et écoute des personnes sans-abri en centre-ville.',
        type: 'social',
        urgency: 'normale',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 3,
        requiredRanks: ['PSE1', 'Secouriste'],
        requiredVehicles: ['VTU'],
        rewardMoney: 210,
        rewardReputation: 35,
        durationSeconds: 150,
        durationHours: '3.0',
        eventDate: { ...game.clock },
        status: 'planifie',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    } else if (type === 'formation') {
      const loc = game.calculateRealisticMissionLocation(base, 'dps');
      m = {
        id: `test-form-${now}`,
        title: 'Formation : Session PSC1 Grand Public (10 élèves)',
        desc: 'Formation aux gestes qui sauvent et délivrance des attestations officielles.',
        type: 'formation',
        urgency: 'normale',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 2,
        requiredRanks: ['Formateur', 'PSE1'],
        requiredVehicles: [],
        rewardMoney: 600,
        rewardReputation: 30,
        durationSeconds: 180,
        durationHours: '4.0',
        eventDate: { ...game.clock },
        status: 'planifie',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    } else if (type === 'meteo') {
      const loc = game.calculateRealisticMissionLocation(base, 'meteo');
      m = {
        id: `test-meteo-${now}`,
        title: 'Intempéries : Reconnaissance & Épuisement Crues',
        desc: 'Inondations subites de caves et voiries. Déploiement des motopompes et soutien population.',
        type: 'meteo',
        urgency: 'haute',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 4,
        requiredRanks: ['CE', 'PSE2', 'PSE1'],
        requiredVehicles: ['VTU'],
        rewardMoney: 490,
        rewardReputation: 40,
        durationSeconds: 180,
        durationHours: '3.5',
        eventDate: { ...game.clock },
        status: 'declenche',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    } else if (type === 'devis') {
      if (typeof game.generateRandomDevis === 'function') {
        game.generateRandomDevis();
        game.showToast('Devis Généré', 'Une nouvelle demande de devis est arrivée dans vos Finances !', 'green');
        return;
      }
    } else if (type === 'securite') {
      const prem = game.stations[0]?.premises;
      if (!prem) {
        game.showToast('Locaux Requis', 'Choisissez d’abord vos locaux d’antenne pour tester la sécurité.', 'orange');
        return;
      }
      if (window.ProtecLocaux) {
        window.ProtecLocaux.checkSecurityEvents(game, prem, true);
      }
      return;
    } else if (type === 'finish_works') {
      const prem = game.stations[0]?.premises;
      if (!prem || !prem.ongoingWorks || prem.ongoingWorks.length === 0) {
        game.showToast('Aucun Chantier', 'Il n’y a aucun chantier de travaux en cours sur vos locaux.', 'blue');
        return;
      }
      const count = prem.ongoingWorks.length;
      prem.ongoingWorks.forEach(w => {
        prem.grid[w.tileIndex] = w.targetType;
      });
      prem.ongoingWorks = [];
      game.saveGame();
      game.updateStatsUI();
      game.showToast('Chantiers Livrés !', `${count} travaux de pièces ont été achevés instantanément !`, 'green');
      return;
    } else if (type.startsWith('scen_')) {
      const scenarioKey = type.replace('scen_', '');
      if (window.ProtecCriseLogistique && typeof window.ProtecCriseLogistique.createScenarioMission === 'function') {
        window.ProtecCriseLogistique.createScenarioMission(game, scenarioKey);
        return;
      }
    }

    if (m) {
      if (m.type === 'social') {
        m.isSector = true;
        m.sector = 'Secteur Maraude : Centre Urbain & Gares';
        m.address = m.sector;
      } else if (!m.address) {
        m.address = game.generateRealisticStreetAddress ? game.generateRealisticStreetAddress(base?.city || 'Paris', m.lat, m.lng) : '10 Place de la République, Paris';
        m.isSector = false;
      }
      if (game.enrichMissionLocationWithCity) game.enrichMissionLocationWithCity(m);
      game.missions.push(m);
      game.renderMissions();
      game.updateStatsUI();
      game.saveGame();
      game.showToast('Mission Test Générée', `« ${m.title} » ajoutée sur la carte !`, 'green');
      if (window.ProtecNotifications) {
        window.ProtecNotifications.recordNotification({ title: m.title, message: m.desc, color: 'blue' });
      }
    }
  },

  // Déclencher un Ordre de Mission National FNPC (Zone Nationale) par un Administrateur
  triggerNationalRenfort(templateKey) {
    const game = window.game;
    if (!game) return;

    const templates = {
      novi: {
        id: `renf-nat-novi-${Date.now()}`,
        isExtraDept: true,
        zone: 'national',
        isNationalAdmin: true,
        typeCategory: 'novi',
        typeTitle: 'PLAN NOVI / CATASTROPHE ROUTIÈRE',
        iconEmoji: '🚨',
        colorClass: 'text-rose-700',
        address: '21000 Dijon, Côte-d’Or (21)',
        addressDisplay: '21000 Dijon, Rocade Est A31',
        deptCode: '21',
        lat: 47.322,
        lng: 5.041,
        needLabel: '1 VPSP + 1 PMA Mobile + 6 Secouristes',
        demandeur: 'SAMU 21 & Cellule Zonale de Crise',
        requiredVehType: 'VPSP',
        requiredVolsCount: 6,
        slotsCommitted: 0,
        contributions: [],
        indemnite: 920,
        alliancePoints: 120,
        status: 'open',
        description: 'Accident routier collectif à nombreuses victimes. Déploiement urgent d’un Poste Médical Avancé et évacuations sanitaires.',
        createdAt: new Date().toISOString()
      },
      inondation: {
        id: `renf-nat-crue-${Date.now()}`,
        isExtraDept: true,
        zone: 'national',
        isNationalAdmin: true,
        typeCategory: 'inondation',
        typeTitle: 'PLAN ORSEC / CRUES MAJEURES',
        iconEmoji: '🌊',
        colorClass: 'text-cyan-700',
        address: '62500 Saint-Omer, Pas-de-Calais (62)',
        addressDisplay: '62500 Saint-Omer, Bassin de l’Aa',
        deptCode: '62',
        lat: 50.750,
        lng: 2.256,
        needLabel: '1 Lot Sauvetage Aquatique + 6 Secouristes',
        demandeur: 'Préfecture 62 & Zone Nord',
        requiredVehType: 'VTU',
        requiredVolsCount: 6,
        slotsCommitted: 0,
        contributions: [],
        indemnite: 780,
        alliancePoints: 100,
        status: 'open',
        description: 'Crue majeure et évacuation de riverains. Mise en place et armement d’un Centre d’Accueil des Impliqués (CAI).',
        createdAt: new Date().toISOString()
      },
      feux: {
        id: `renf-nat-feux-${Date.now()}`,
        isExtraDept: true,
        zone: 'national',
        isNationalAdmin: true,
        typeCategory: 'incendie',
        typeTitle: 'INCENDIE / COLONNE FEUX DE FORÊT',
        iconEmoji: '🚒',
        colorClass: 'text-orange-600',
        address: '83390 Cuers, Var (83)',
        addressDisplay: '83390 Cuers, Massif des Maures',
        deptCode: '83',
        lat: 43.237,
        lng: 6.071,
        needLabel: '1 VTU Logistique + 6 Secouristes',
        demandeur: 'SDIS 83 - CODIS',
        requiredVehType: 'VTU',
        requiredVolsCount: 6,
        slotsCommitted: 0,
        contributions: [],
        indemnite: 720,
        alliancePoints: 90,
        status: 'open',
        description: 'Mobilisation de la colonne Sud pour ravitaillement, soutien sanitaire et logistique des sapeurs-pompiers en ligne de feu.',
        createdAt: new Date().toISOString()
      },
      festival: {
        id: `renf-nat-fest-${Date.now()}`,
        isExtraDept: true,
        zone: 'national',
        isNationalAdmin: true,
        typeCategory: 'dps',
        typeTitle: 'DPS RENFORT FESTIVAL NATIONAL',
        iconEmoji: '🎪',
        colorClass: 'text-indigo-600',
        address: '29270 Carhaix-Plouguer, Finistère (29)',
        addressDisplay: '29270 Carhaix-Plouguer, Site de Kerampuilh',
        deptCode: '29',
        lat: 48.276,
        lng: -3.574,
        needLabel: '2 VPSP + 8 Secouristes PSE2',
        demandeur: 'Protection Civile 29 / FNPC',
        requiredVehType: 'VPSP',
        requiredVolsCount: 8,
        slotsCommitted: 0,
        contributions: [],
        indemnite: 840,
        alliancePoints: 110,
        status: 'open',
        description: 'Grand rassemblement musical national. Renfort interdépartemental pour armer les postes de secours de nuit.',
        createdAt: new Date().toISOString()
      },
      maraude: {
        id: `renf-nat-froid-${Date.now()}`,
        isExtraDept: true,
        zone: 'national',
        isNationalAdmin: true,
        typeCategory: 'maraude',
        typeTitle: 'PLAN GRAND FROID & URGENCE SOCIALE',
        iconEmoji: '❄️',
        colorClass: 'text-sky-600',
        address: '59000 Lille, Nord (59)',
        addressDisplay: '59000 Lille, Secteur Flandres',
        deptCode: '59',
        lat: 50.629,
        lng: 3.057,
        needLabel: '1 VTU Maraude Sociale + 6 Équipiers',
        demandeur: 'SIAO 115 & DDETS',
        requiredVehType: 'VTU',
        requiredVolsCount: 6,
        slotsCommitted: 0,
        contributions: [],
        indemnite: 580,
        alliancePoints: 70,
        status: 'open',
        description: 'Plan Grand Froid niveau 2 activé. Maraude sociale de nuit et orientation d’urgence vers les centres d’hébergement temporaires.',
        createdAt: new Date().toISOString()
      }
    };

    const renfort = templates[templateKey] || templates.novi;
    if (!game.renforts) game.renforts = [];
    game.renforts.unshift(renfort);

    if (window.ProtecSupabase && window.ProtecSupabase.broadcastRenfortCreated) {
      window.ProtecSupabase.broadcastRenfortCreated(renfort);
    }

    game.showToast('Ordre de Mission National Déclenché !', `L'ordre de mission national « ${renfort.typeTitle} » a été diffusé en direct à l'ensemble des directeurs connectés.`, 'purple');
    game.updateStatsUI();
  },

  // Clôturer tous les renforts nationaux en cours
  clearNationalRenforts() {
    const game = window.game;
    if (!game) return;
    const count = (game.renforts || []).filter(r => r.isExtraDept || r.zone === 'national').length;
    game.renforts = (game.renforts || []).filter(r => !r.isExtraDept && r.zone !== 'national');
    game.showToast('Renforts Nationaux Clôturés', `${count} renfort(s) national(aux) ont été clôturés.`, 'blue');
    game.updateStatsUI();
  },

  // =========================================================================
  // GESTION ET CONFIGURATION ADMINISTRATIVE DU CATALOGUE DES VÉHICULES
  // =========================================================================
  async loadVehiclesCatalogData() {
    const container = document.getElementById('admin-vehicles-list-container');
    if (container) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-slate-500 font-semibold animate-pulse col-span-2">Chargement du catalogue des véhicules...</div>`;
    }

    try {
      const res = await fetch('/api/admin/catalogs', { headers: this.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.vehicles && Array.isArray(data.vehicles) && data.vehicles.length > 0) {
          this.vehiclesCache = data.vehicles;
        }
      }
    } catch (e) {}

    if (!this.vehiclesCache || this.vehiclesCache.length === 0) {
      const local = localStorage.getItem('protec_custom_vehicle_catalog');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) this.vehiclesCache = parsed;
        } catch (e) {}
      }
    }

    if (!this.vehiclesCache || this.vehiclesCache.length === 0) {
      const base = window.ProtecAdvanced?.vehicleCatalog || [];
      this.vehiclesCache = JSON.parse(JSON.stringify(base));
    }

    this.renderVehiclesTable();
  },

  filterVehicles(q) {
    this.vehiclesFilter = (q || '').toLowerCase();
    this.renderVehiclesTable();
  },

  renderVehiclesTable() {
    const container = document.getElementById('admin-vehicles-list-container');
    const countEl = document.getElementById('admin-vehicles-count');
    if (!container) return;

    const list = this.vehiclesCache || [];
    const q = this.vehiclesFilter || '';
    const filtered = list.filter(v => 
      !q ||
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.type && v.type.toLowerCase().includes(q)) ||
      (v.category && v.category.toLowerCase().includes(q))
    );

    if (countEl) countEl.textContent = `${filtered.length} / ${list.length} véhicule(s)`;

    if (filtered.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400 col-span-2 italic">Aucun véhicule ne correspond à la recherche.</div>`;
      return;
    }

    container.innerHTML = filtered.map((v, idx) => {
      const realIndex = this.vehiclesCache.indexOf(v);
      const img = v.image || 'images/vehicles/VL.png';
      const hitch = v.hasTowHitch ? '✓ Oui' : '✕ Non';
      return `
        <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div class="space-y-2">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-16 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img src="${img}" alt="${v.name}" class="w-full h-full object-contain" onerror="this.src='images/vehicles/VL.png'" />
                </div>
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800 uppercase">${v.type || 'VL'}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${v.category || 'Général'}</span>
                  </div>
                  <h4 class="text-sm font-black text-slate-900 mt-0.5">${v.name}</h4>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <span class="text-sm font-black text-emerald-700 mono-num">${Number(v.cost || 0).toLocaleString('fr-FR')} €</span>
              </div>
            </div>

            <p class="text-[11px] text-slate-500 leading-snug line-clamp-2">${v.desc || 'Pas de description renseignée.'}</p>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 text-[10px]">
              <div class="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <span class="text-slate-400 font-bold block">Capacité</span>
                <strong class="text-slate-800">${v.capacity || 2} secouriste(s)</strong>
              </div>
              <div class="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <span class="text-slate-400 font-bold block">Vitesse max</span>
                <strong class="text-slate-800">${v.speedKmH || 80} km/h</strong>
              </div>
              <div class="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <span class="text-slate-400 font-bold block">Permis requis</span>
                <strong class="text-slate-800">${v.licenseLabel || v.licenseRequired || 'Permis B'}</strong>
              </div>
              <div class="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <span class="text-slate-400 font-bold block">Boule d'attelage</span>
                <strong class="${v.hasTowHitch ? 'text-indigo-700' : 'text-slate-500'}">${hitch}</strong>
              </div>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <span class="text-[10px] text-slate-400 truncate max-w-[200px]" title="${v.image}">📷 ${v.image}</span>
            <div class="flex items-center gap-1.5">
              <button onclick="window.ProtecAdmin.openEditVehicleModal(${realIndex})" class="px-2.5 py-1 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer flex items-center gap-1">
                ✏️ Modifier
              </button>
              <button onclick="window.ProtecAdmin.deleteVehicle(${realIndex})" class="px-2 py-1 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer" title="Supprimer">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  openEditVehicleModal(index) {
    const v = this.vehiclesCache[index];
    if (!v) return;

    let modal = document.getElementById('admin-edit-vehicle-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-edit-vehicle-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800 my-8">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">🚑</div>
            <div>
              <h3 class="text-base font-black text-slate-900 leading-tight">Modifier le Véhicule : ${v.name}</h3>
              <p class="text-xs text-slate-500 font-semibold">Modifiez les tarifs, caractéristiques et photo du modèle</p>
            </div>
          </div>
          <button onclick="document.getElementById('admin-edit-vehicle-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer">✕</button>
        </div>

        <form onsubmit="event.preventDefault(); window.ProtecAdmin.saveVehicleEdit(${index});" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Identifiant / Type :</label>
              <input type="text" id="adm-veh-type" value="${v.type || ''}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black uppercase text-slate-800 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Catégorie :</label>
              <input type="text" id="adm-veh-category" value="${v.category || 'Secours'}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Nom d'affichage complet :</label>
            <input type="text" id="adm-veh-name" value="${v.name || ''}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Prix d'achat (€) :</label>
              <input type="number" id="adm-veh-cost" value="${v.cost || 10000}" min="0" step="100" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black text-emerald-700 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Capacité (secouristes) :</label>
              <input type="number" id="adm-veh-capacity" value="${v.capacity || 2}" min="1" max="15" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black text-slate-800 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Vitesse max (km/h) :</label>
              <input type="number" id="adm-veh-speed" value="${v.speedKmH || 80}" min="10" max="160" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black text-slate-800 bg-white" required />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Permis requis :</label>
              <select id="adm-veh-license" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white">
                <option value="B" ${v.licenseRequired === 'B' ? 'selected' : ''}>Permis B (VL Standard)</option>
                <option value="C" ${v.licenseRequired === 'C' ? 'selected' : ''}>Permis C (Poids Lourd > 3.5t)</option>
                <option value="Moto" ${v.licenseRequired === 'Moto' ? 'selected' : ''}>Permis Moto (MPS)</option>
                <option value="None" ${v.licenseRequired === 'None' ? 'selected' : ''}>Aucun permis (Vélo/VTT)</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Boule d'attelage remorque :</label>
              <select id="adm-veh-hitch" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white">
                <option value="true" ${v.hasTowHitch ? 'selected' : ''}>✓ Équipé d'une boule d'attelage</option>
                <option value="false" ${!v.hasTowHitch ? 'selected' : ''}>✕ Pas d'attelage</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Chemin ou URL de l'image :</label>
            <input type="text" id="adm-veh-image" value="${v.image || ''}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-800 bg-white" required />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Description opérationnelle :</label>
            <textarea id="adm-veh-desc" rows="2" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white">${v.desc || ''}</textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onclick="document.getElementById('admin-edit-vehicle-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">Annuler</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer">✓ Sauvegarder</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  async saveVehicleEdit(index) {
    const v = this.vehiclesCache[index];
    if (!v) return;

    v.type = document.getElementById('adm-veh-type').value.trim();
    v.category = document.getElementById('adm-veh-category').value.trim();
    v.name = document.getElementById('adm-veh-name').value.trim();
    v.cost = parseInt(document.getElementById('adm-veh-cost').value || '10000', 10);
    v.capacity = parseInt(document.getElementById('adm-veh-capacity').value || '2', 10);
    v.speedKmH = parseInt(document.getElementById('adm-veh-speed').value || '80', 10);
    v.licenseRequired = document.getElementById('adm-veh-license').value;
    v.licenseLabel = v.licenseRequired === 'C' ? 'Permis C (Poids Lourd)' : (v.licenseRequired === 'Moto' ? 'Permis Moto' : (v.licenseRequired === 'None' ? 'Aucun Permis' : 'Permis B'));
    v.hasTowHitch = document.getElementById('adm-veh-hitch').value === 'true';
    v.image = document.getElementById('adm-veh-image').value.trim();
    v.desc = document.getElementById('adm-veh-desc').value.trim();

    document.getElementById('admin-edit-vehicle-modal')?.classList.add('hidden');
    await this.saveVehiclesCatalog();
    this.renderVehiclesTable();
    if (window.game) window.game.showToast('Véhicule Modifié', `Les modifications sur « ${v.name} » ont été enregistrées.`, 'green');
  },

  openCreateVehicleModal() {
    let modal = document.getElementById('admin-create-vehicle-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-create-vehicle-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800 my-8">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">➕</div>
            <div>
              <h3 class="text-base font-black text-slate-900 leading-tight">Ajouter un Nouveau Véhicule</h3>
              <p class="text-xs text-slate-500 font-semibold">Créez un modèle sur mesure pour la boutique du jeu</p>
            </div>
          </div>
          <button onclick="document.getElementById('admin-create-vehicle-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer">✕</button>
        </div>

        <form onsubmit="event.preventDefault(); window.ProtecAdmin.saveNewVehicle();" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Identifiant / Type (ex: VPSP, VL, PCM) :</label>
              <input type="text" id="adm-new-veh-type" placeholder="Ex: VLM" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black uppercase text-slate-800 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Catégorie :</label>
              <input type="text" id="adm-new-veh-category" placeholder="Ex: Secours d'Urgence" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Nom d'affichage complet :</label>
            <input type="text" id="adm-new-veh-name" placeholder="Ex: VLM - Véhicule Léger Médicalisé" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Prix d'achat (€) :</label>
              <input type="number" id="adm-new-veh-cost" value="25000" min="0" step="100" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black text-emerald-700 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Capacité (secouristes) :</label>
              <input type="number" id="adm-new-veh-capacity" value="3" min="1" max="15" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black text-slate-800 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Vitesse max (km/h) :</label>
              <input type="number" id="adm-new-veh-speed" value="90" min="10" max="160" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black text-slate-800 bg-white" required />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Permis requis :</label>
              <select id="adm-new-veh-license" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white">
                <option value="B">Permis B (VL Standard)</option>
                <option value="C">Permis C (Poids Lourd > 3.5t)</option>
                <option value="Moto">Permis Moto (MPS)</option>
                <option value="None">Aucun permis (Vélo/VTT)</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Boule d'attelage remorque :</label>
              <select id="adm-new-veh-hitch" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white">
                <option value="true">✓ Équipé d'une boule d'attelage</option>
                <option value="false">✕ Pas d'attelage</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Chemin ou URL de l'image :</label>
            <input type="text" id="adm-new-veh-image" value="images/vehicles/VL.png" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-800 bg-white" required />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Description opérationnelle :</label>
            <textarea id="adm-new-veh-desc" rows="2" placeholder="Décrivez le rôle et les spécificités du véhicule..." class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white"></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onclick="document.getElementById('admin-create-vehicle-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">Annuler</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer">✓ Créer le Véhicule</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  async saveNewVehicle() {
    const lic = document.getElementById('adm-new-veh-license').value;
    const newVeh = {
      type: document.getElementById('adm-new-veh-type').value.trim().toUpperCase(),
      category: document.getElementById('adm-new-veh-category').value.trim(),
      name: document.getElementById('adm-new-veh-name').value.trim(),
      cost: parseInt(document.getElementById('adm-new-veh-cost').value || '10000', 10),
      capacity: parseInt(document.getElementById('adm-new-veh-capacity').value || '2', 10),
      speedKmH: parseInt(document.getElementById('adm-new-veh-speed').value || '80', 10),
      licenseRequired: lic,
      licenseLabel: lic === 'C' ? 'Permis C (Poids Lourd)' : (lic === 'Moto' ? 'Permis Moto' : (lic === 'None' ? 'Aucun Permis' : 'Permis B')),
      hasTowHitch: document.getElementById('adm-new-veh-hitch').value === 'true',
      image: document.getElementById('adm-new-veh-image').value.trim() || 'images/vehicles/VL.png',
      desc: document.getElementById('adm-new-veh-desc').value.trim()
    };

    this.vehiclesCache.push(newVeh);
    document.getElementById('admin-create-vehicle-modal')?.classList.add('hidden');
    await this.saveVehiclesCatalog();
    this.renderVehiclesTable();
    if (window.game) window.game.showToast('Nouveau Véhicule Créé', `« ${newVeh.name} » a été ajouté au catalogue.`, 'green');
  },

  async deleteVehicle(index) {
    const v = this.vehiclesCache[index];
    if (!v) return;

    const ok = confirm(`Êtes-vous sûr de vouloir supprimer définitivement le véhicule « ${v.name} » ?`);
    if (!ok) return;

    this.vehiclesCache.splice(index, 1);
    await this.saveVehiclesCatalog();
    this.renderVehiclesTable();
    if (window.game) window.game.showToast('Véhicule Supprimé', `Le véhicule a été retiré du catalogue.`, 'orange');
  },

  async resetVehiclesCatalog() {
    const ok = confirm("Réinitialiser le catalogue de véhicules aux modèles d'origine du jeu ?");
    if (!ok) return;

    localStorage.removeItem('protec_custom_vehicle_catalog');
    const base = [
      {
        type: 'VPSP',
        name: 'Véhicule de Premiers Secours à Personnes (VPSP)',
        category: 'Secours d’Urgence',
        desc: 'Cellule sanitaire grand volume aux normes EN 1789, brancard 3 points, oxygénothérapie et armoire d’urgence SUAP. Conduite autorisée avec le Permis B.',
        cost: 28500,
        capacity: 5,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
        speedKmH: 85,
        hasTowHitch: false,
        image: 'images/vehicles/master3_vpsp.png'
      },
      {
        type: 'VL',
        name: 'Véhicule de Liaison (VL)',
        category: 'Reconnaissance Rapide',
        desc: 'Véhicule léger avec rampe lumineuse, équipement radio et crochet d’attelage pour reconnaissance, commandement et remorquage.',
        cost: 11500,
        capacity: 4,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
        speedKmH: 100,
        hasTowHitch: true,
        image: 'images/vehicles/VL.png'
      },
      {
        type: 'VTU',
        name: 'Véhicule Tout Usage (VTU)',
        category: 'Logistique & Soutien',
        desc: 'Fourgon utilitaire tôlé grand volume pour acheminement de matériel, tentes, lits de camp et logistique de crise.',
        cost: 17500,
        capacity: 3,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
        speedKmH: 75,
        hasTowHitch: true,
        image: 'images/vehicles/master3_vtu_log.png'
      },
      {
        type: 'VTP',
        name: 'Véhicule de Transport de Personnel (VTP)',
        category: 'Transport d’Équipes',
        desc: 'Minibus grand confort 9 places vitré pour acheminement d’équipes complètes et relèves d’astreinte.',
        cost: 21000,
        capacity: 9,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
        speedKmH: 85,
        hasTowHitch: true,
        image: 'images/vehicles/master3_vtp.png'
      },
      {
        type: 'VLHR',
        name: 'Véhicule Léger Hors Route (VLHR)',
        category: 'Tout-Terrain',
        desc: 'Pick-up 4x4 tout-terrain pour zones accidentées, massifs forestiers, franchissement et remorquage lourd.',
        cost: 19500,
        capacity: 4,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
        speedKmH: 90,
        hasTowHitch: true,
        image: 'images/vehicles/VLHR.png'
      },
      {
        type: 'FLIT',
        name: 'Fourgon Lourd d’Intervention Technique & Soutien Pop (FLIT)',
        category: 'Technique & Soutien Lourd',
        desc: 'Poids Lourd de soutien lourd type FPTL/FPTSR (> 12 tonnes) avec mât d’éclairage télescopique, groupe électrogène de puissance et motopompes grande capacité.',
        cost: 95000,
        capacity: 3,
        licenseRequired: 'C',
        licenseLabel: 'Permis C (Poids Lourd)',
        speedKmH: 70,
        hasTowHitch: true,
        image: 'images/vehicles/flit_pop.png'
      },
      {
        type: 'PCM',
        name: 'Poste de Commandement Mobile (PCM Renault Midlum)',
        category: 'Commandement Lourd',
        desc: 'Centre opérationnel mobile de crise sur châssis Renault Midlum avec baie de transmissions VHF/UHF, liaisons satellites et salle de crise embarquée.',
        cost: 55000,
        capacity: 3,
        licenseRequired: 'C',
        licenseLabel: 'Permis C (Poids Lourd)',
        speedKmH: 70,
        hasTowHitch: false,
        image: 'images/vehicles/midlum_pc.png'
      },
      {
        type: 'ERS',
        name: 'Embarcation de Reconnaissance et Sauvetage (ERS)',
        category: 'Sauvetage Aquatique',
        desc: 'Bateau pneumatique rigide (4 places) avec remorque routière fournie. Se tracte avec un véhicule à attelage.',
        cost: 13500,
        capacity: 4,
        licenseRequired: 'B',
        licenseLabel: 'Permis Bateau & SSA',
        speedKmH: 45,
        hasTowHitch: false,
        image: 'images/vehicles/ERS.png'
      },
      {
        type: 'MPS',
        name: 'Moto de Premiers Secours (MPS)',
        category: 'Vecteur Rapide',
        desc: 'Moto de premiers secours d’urgence pour circulation rapide en trafic dense.',
        cost: 8500,
        capacity: 2,
        licenseRequired: 'Moto',
        licenseLabel: 'Permis Moto Requis 🏍️',
        speedKmH: 110,
        hasTowHitch: false,
        image: 'images/vehicles/Moto.png'
      },
      {
        type: 'QUAD',
        name: 'Quad Tout-Terrain d’Intervention',
        category: 'Tout-Terrain Agile',
        desc: 'Quad d’intervention pour sentiers étroits avec remorque de transport fournie.',
        cost: 7200,
        capacity: 2,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
        speedKmH: 50,
        hasTowHitch: false,
        image: 'images/vehicles/QUAD.png'
      },
      {
        type: 'VELO',
        name: 'Binôme Vélo / VTT Premiers Secours',
        category: 'Dispositif Mobile',
        desc: 'Vélos équipés de sacoches de secours et DAE pour patrouilles douces sur berges et parcs.',
        cost: 2500,
        capacity: 2,
        licenseRequired: 'None',
        licenseLabel: 'Aucun Permis Requis 🚲',
        speedKmH: 25,
        hasTowHitch: false,
        image: 'images/vehicles/VELO.png'
      },
      {
        type: 'VAHU',
        name: 'Véhicule d’Accueil & Hébergement d’Urgence (VAHU)',
        category: 'Action Sociale',
        desc: 'Aménagé pour maraudes, collations chaudes, distribution de couvertures et écoute sociale.',
        cost: 16000,
        capacity: 3,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
        speedKmH: 70,
        hasTowHitch: false,
        image: 'images/vehicles/VAHU.png'
      },
      {
        type: 'VCYN',
        name: 'Véhicule Cynotechnique USAR (VCYN)',
        category: 'USAR / Cyno',
        desc: 'Fourgon cynotechnique USAR avec 2 boxes canins intégrés pour chiens de sauvetage en décombres.',
        cost: 22500,
        capacity: 3,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
        speedKmH: 80,
        hasTowHitch: false,
        image: 'images/vehicles/VCYN.png'
      },
      {
        type: 'REM',
        name: 'Remorque Lot PMA & Éclairage',
        category: 'Remorque Spécialisée',
        desc: 'Remorque équipée d’un groupe électrogène haute puissance, tente gonflable et mâts d’éclairage nocturne.',
        cost: 4900,
        capacity: 0,
        licenseRequired: 'B',
        licenseLabel: 'Permis B (Tractée avec attelage)',
        speedKmH: 70,
        hasTowHitch: false,
        image: 'images/vehicles/REM.png'
      }
    ];

    this.vehiclesCache = base;
    await this.saveVehiclesCatalog();
    this.renderVehiclesTable();
    if (window.game) window.game.showToast('Catalogue Réinitialisé', 'Le catalogue des véhicules a été restauré par défaut.', 'blue');
  },

  async saveVehiclesCatalog() {
    try {
      localStorage.setItem('protec_custom_vehicle_catalog', JSON.stringify(this.vehiclesCache));
      if (window.ProtecAdvanced) {
        window.ProtecAdvanced.vehicleCatalog = this.vehiclesCache;
      }
      await fetch('/api/admin/catalogs/save', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ type: 'vehicles', catalog: this.vehiclesCache })
      });
    } catch (e) {
      console.warn('Erreur sauvegarde catalogue véhicules:', e);
    }
  },

  // =========================================================================
  // GESTION ET CONFIGURATION ADMINISTRATIVE DU CATALOGUE DE MATÉRIEL
  // =========================================================================
  async loadEquipmentCatalogData() {
    const container = document.getElementById('admin-equipment-list-container');
    if (container) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-slate-500 font-semibold animate-pulse col-span-2">Chargement du catalogue de matériel...</div>`;
    }

    try {
      const res = await fetch('/api/admin/catalogs', { headers: this.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.equipment && Array.isArray(data.equipment) && data.equipment.length > 0) {
          this.equipmentCache = data.equipment;
        }
      }
    } catch (e) {}

    if (!this.equipmentCache || this.equipmentCache.length === 0) {
      const local = localStorage.getItem('protec_custom_equipment_catalog');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) this.equipmentCache = parsed;
        } catch (e) {}
      }
    }

    if (!this.equipmentCache || this.equipmentCache.length === 0) {
      const base = window.ProtecEquipements?.LOTS_CATALOG || [];
      this.equipmentCache = JSON.parse(JSON.stringify(base));
    }

    this.renderEquipmentTable();
  },

  filterEquipment(q) {
    this.equipmentFilter = (q || '').toLowerCase();
    this.renderEquipmentTable();
  },

  renderEquipmentTable() {
    const container = document.getElementById('admin-equipment-list-container');
    const countEl = document.getElementById('admin-equipment-count');
    if (!container) return;

    const list = this.equipmentCache || [];
    const q = this.equipmentFilter || '';
    const filtered = list.filter(item => 
      !q ||
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.id && item.id.toLowerCase().includes(q)) ||
      (item.badge && item.badge.toLowerCase().includes(q))
    );

    if (countEl) countEl.textContent = `${filtered.length} / ${list.length} matériel(s)`;

    if (filtered.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400 col-span-2 italic">Aucun matériel ne correspond à la recherche.</div>`;
      return;
    }

    container.innerHTML = filtered.map((item, idx) => {
      const realIndex = this.equipmentCache.indexOf(item);
      const icon = item.icon || '🎒';
      return `
        <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div class="space-y-2">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-lg flex items-center justify-center flex-shrink-0">
                  ${icon}
                </div>
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-800 font-mono">${item.id}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">${item.badge || 'Lot'}</span>
                  </div>
                  <h4 class="text-sm font-black text-slate-900 mt-0.5">${item.name}</h4>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <span class="text-sm font-black text-emerald-700 mono-num">${Number(item.price || 0).toLocaleString('fr-FR')} €</span>
                <span class="text-[10px] text-slate-400 block font-semibold">Taille: ${item.storageSize || 1} emplacement(s)</span>
              </div>
            </div>

            <p class="text-[11px] text-slate-600 leading-snug line-clamp-3">${item.desc || 'Pas de description.'}</p>

            ${item.bonus ? `
              <div class="p-2 rounded-xl bg-amber-50/60 border border-amber-200 text-[10.5px] text-amber-950 font-medium">
                <strong class="text-amber-900 block text-[9px] uppercase font-black">Bonus Opérationnel :</strong>
                ${item.bonus}
              </div>
            ` : ''}
          </div>

          <div class="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
            <button onclick="window.ProtecAdmin.openEditEquipmentModal(${realIndex})" class="px-2.5 py-1 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer flex items-center gap-1">
              ✏️ Modifier
            </button>
            <button onclick="window.ProtecAdmin.deleteEquipment(${realIndex})" class="px-2 py-1 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer" title="Supprimer">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  openEditEquipmentModal(index) {
    const item = this.equipmentCache[index];
    if (!item) return;

    let modal = document.getElementById('admin-edit-equipment-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-edit-equipment-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800 my-8">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">🎒</div>
            <div>
              <h3 class="text-base font-black text-slate-900 leading-tight">Modifier le Matériel : ${item.name}</h3>
              <p class="text-xs text-slate-500 font-semibold">Modifiez le prix, le volume, la description et les bonus</p>
            </div>
          </div>
          <button onclick="document.getElementById('admin-edit-equipment-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer">✕</button>
        </div>

        <form onsubmit="event.preventDefault(); window.ProtecAdmin.saveEquipmentEdit(${index});" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Identifiant unique (ID) :</label>
              <input type="text" id="adm-eq-id" value="${item.id || ''}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-800 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Icône Emoji ou Symbole :</label>
              <input type="text" id="adm-eq-icon" value="${item.icon || '🎒'}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white" required />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Nom du Matériel ou du Lot :</label>
            <input type="text" id="adm-eq-name" value="${item.name || ''}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Prix d'achat (€) :</label>
              <input type="number" id="adm-eq-price" value="${item.price || 500}" min="0" step="50" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black text-emerald-700 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Taille / Encombrement :</label>
              <input type="number" id="adm-eq-size" value="${item.storageSize || 1}" min="1" max="10" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Catégorie / Badge court :</label>
            <input type="text" id="adm-eq-badge" value="${item.badge || 'Secours'}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Description détaillée :</label>
            <textarea id="adm-eq-desc" rows="3" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white">${item.desc || ''}</textarea>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Bonus Opérationnel / Utilité en mission :</label>
            <textarea id="adm-eq-bonus" rows="2" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white">${item.bonus || ''}</textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onclick="document.getElementById('admin-edit-equipment-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">Annuler</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md transition cursor-pointer">✓ Sauvegarder</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  async saveEquipmentEdit(index) {
    const item = this.equipmentCache[index];
    if (!item) return;

    item.id = document.getElementById('adm-eq-id').value.trim();
    item.icon = document.getElementById('adm-eq-icon').value.trim();
    item.name = document.getElementById('adm-eq-name').value.trim();
    item.price = parseInt(document.getElementById('adm-eq-price').value || '500', 10);
    item.storageSize = parseInt(document.getElementById('adm-eq-size').value || '1', 10);
    item.badge = document.getElementById('adm-eq-badge').value.trim();
    item.desc = document.getElementById('adm-eq-desc').value.trim();
    item.bonus = document.getElementById('adm-eq-bonus').value.trim();

    document.getElementById('admin-edit-equipment-modal')?.classList.add('hidden');
    await this.saveEquipmentCatalog();
    this.renderEquipmentTable();
    if (window.game) window.game.showToast('Matériel Mis à Jour', `« ${item.name} » a été enregistré.`, 'green');
  },

  openCreateEquipmentModal() {
    let modal = document.getElementById('admin-create-equipment-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-create-equipment-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800 my-8">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">➕</div>
            <div>
              <h3 class="text-base font-black text-slate-900 leading-tight">Ajouter un Nouveau Matériel / Lot</h3>
              <p class="text-xs text-slate-500 font-semibold">Créez un nouvel équipement ou kit spécialisé pour les antennes</p>
            </div>
          </div>
          <button onclick="document.getElementById('admin-create-equipment-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer">✕</button>
        </div>

        <form onsubmit="event.preventDefault(); window.ProtecAdmin.saveNewEquipment();" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Identifiant unique (ID) :</label>
              <input type="text" id="adm-new-eq-id" placeholder="Ex: lot_drone_thermique" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-800 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Icône Emoji :</label>
              <input type="text" id="adm-new-eq-icon" value="🚁" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white" required />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Nom du Matériel :</label>
            <input type="text" id="adm-new-eq-name" placeholder="Ex: Lot Drone Reconnaissance Thermique" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Prix d'achat (€) :</label>
              <input type="number" id="adm-new-eq-price" value="2200" min="0" step="50" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black text-emerald-700 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Taille / Emplacements :</label>
              <input type="number" id="adm-new-eq-size" value="2" min="1" max="10" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Catégorie / Badge :</label>
            <input type="text" id="adm-new-eq-badge" value="Recherche & Tech" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Description complète :</label>
            <textarea id="adm-new-eq-desc" rows="2" placeholder="Détaillez la composition et l'équipement contenu dans ce lot..." class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white" required></textarea>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Bonus Opérationnel :</label>
            <textarea id="adm-new-eq-bonus" rows="2" placeholder="Indiquez les avantages en mission ou en gestion de crise..." class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white"></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onclick="document.getElementById('admin-create-equipment-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">Annuler</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md transition cursor-pointer">✓ Créer le Matériel</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  async saveNewEquipment() {
    const newItem = {
      id: document.getElementById('adm-new-eq-id').value.trim(),
      icon: document.getElementById('adm-new-eq-icon').value.trim() || '🎒',
      name: document.getElementById('adm-new-eq-name').value.trim(),
      price: parseInt(document.getElementById('adm-new-eq-price').value || '500', 10),
      storageSize: parseInt(document.getElementById('adm-new-eq-size').value || '1', 10),
      badge: document.getElementById('adm-new-eq-badge').value.trim(),
      desc: document.getElementById('adm-new-eq-desc').value.trim(),
      bonus: document.getElementById('adm-new-eq-bonus').value.trim()
    };

    this.equipmentCache.push(newItem);
    document.getElementById('admin-create-equipment-modal')?.classList.add('hidden');
    await this.saveEquipmentCatalog();
    this.renderEquipmentTable();
    if (window.game) window.game.showToast('Matériel Ajouté', `« ${newItem.name} » a été ajouté au catalogue.`, 'green');
  },

  async deleteEquipment(index) {
    const item = this.equipmentCache[index];
    if (!item) return;

    const ok = confirm(`Supprimer définitivement le matériel « ${item.name} » ?`);
    if (!ok) return;

    this.equipmentCache.splice(index, 1);
    await this.saveEquipmentCatalog();
    this.renderEquipmentTable();
    if (window.game) window.game.showToast('Matériel Supprimé', `Le lot a été retiré.`, 'orange');
  },

  async resetEquipmentCatalog() {
    const ok = confirm("Réinitialiser le catalogue de matériel aux lots par défaut ?");
    if (!ok) return;

    localStorage.removeItem('protec_custom_equipment_catalog');
    if (window.ProtecEquipements?.LOTS_CATALOG) {
      this.equipmentCache = JSON.parse(JSON.stringify(window.ProtecEquipements.LOTS_CATALOG));
    }
    await this.saveEquipmentCatalog();
    this.renderEquipmentTable();
    if (window.game) window.game.showToast('Catalogue Matériel Réinitialisé', 'Les lots ont été restaurés.', 'blue');
  },

  async saveEquipmentCatalog() {
    try {
      localStorage.setItem('protec_custom_equipment_catalog', JSON.stringify(this.equipmentCache));
      if (window.ProtecEquipements) {
        window.ProtecEquipements.LOTS_CATALOG = this.equipmentCache;
      }
      await fetch('/api/admin/catalogs/save', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ type: 'equipment', catalog: this.equipmentCache })
      });
    } catch (e) {
      console.warn('Erreur sauvegarde catalogue matériel:', e);
    }
  },

  // =========================================================================
  // GESTION DU CATALOGUE DES ÉCUSSONS & ATTRIBUTION AUX JOUEURS
  // =========================================================================
  async loadBadgesCatalogData() {
    const container = document.getElementById('admin-badges-list-container');
    if (container) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-slate-500 font-semibold animate-pulse col-span-3">Chargement des écussons...</div>`;
    }

    try {
      const res = await fetch('/api/admin/catalogs', { headers: this.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.badges && Array.isArray(data.badges) && data.badges.length > 0) {
          this.badgesCache = data.badges;
        }
      }
    } catch (e) {}

    if (!this.badgesCache || this.badgesCache.length === 0) {
      const local = localStorage.getItem('protec_custom_badges_catalog');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) this.badgesCache = parsed;
        } catch (e) {}
      }
    }

    if (!this.badgesCache || this.badgesCache.length === 0) {
      const base = window.ProtecEcussons?.catalog || [];
      this.badgesCache = JSON.parse(JSON.stringify(base));
    }

    this.renderBadgesCatalogTable();
  },

  filterBadges(q) {
    this.badgesFilter = (q || '').toLowerCase();
    this.renderBadgesCatalogTable();
  },

  renderBadgesCatalogTable() {
    const container = document.getElementById('admin-badges-list-container');
    const countEl = document.getElementById('admin-badges-count');
    if (!container) return;

    const list = this.badgesCache || [];
    const q = this.badgesFilter || '';
    const filtered = list.filter(b => 
      !q ||
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.code && b.code.toLowerCase().includes(q)) ||
      (b.category && b.category.toLowerCase().includes(q)) ||
      (b.rarityTier && b.rarityTier.toLowerCase().includes(q))
    );

    if (countEl) countEl.textContent = `${filtered.length} / ${list.length} écusson(s)`;

    if (filtered.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400 col-span-3 italic">Aucun écusson ne correspond à la recherche.</div>`;
      return;
    }

    container.innerHTML = filtered.map((b, idx) => {
      const realIndex = this.badgesCache.indexOf(b);
      const isCustomPng = !!b.imageUrl;
      return `
        <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <div class="w-14 h-16 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center overflow-hidden flex-shrink-0 relative shadow-inner">
                ${isCustomPng ? `
                  <img src="${b.imageUrl}" alt="${b.name}" class="w-full h-full object-contain drop-shadow" onerror="this.parentElement.innerHTML='<span class=\\'text-lg\\'>🛡️</span>'" />
                ` : `
                  <div class="w-full h-full flex items-center justify-center text-xl">🛡️</div>
                `}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-indigo-100 text-indigo-800">${b.category || 'Insigne'}</span>
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-black ${b.rarityColor || 'bg-amber-100 text-amber-800'}">${b.rarityTier || 'Rare'}</span>
                </div>
                <h4 class="text-xs font-black text-slate-900 truncate mt-0.5">${b.name}</h4>
                <span class="text-[10px] text-slate-400 font-mono block">Code: ${b.code}</span>
              </div>
            </div>

            <p class="text-[10.5px] text-slate-600 leading-snug line-clamp-2">${b.desc || 'Écusson officiel.'}</p>
          </div>

          <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
            <button onclick="window.ProtecAdmin.openAwardBadgeModal('${b.code}')" class="px-2.5 py-1 rounded-xl text-[11px] font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 shadow-xs transition cursor-pointer flex items-center gap-1">
              🎁 Attribuer
            </button>
            <div class="flex items-center gap-1">
              <button onclick="window.ProtecAdmin.openEditBadgeModal(${realIndex})" class="px-2 py-1 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer">
                ✏️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  openEditBadgeModal(index) {
    const b = this.badgesCache[index];
    if (!b) return;

    let modal = document.getElementById('admin-edit-badge-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-edit-badge-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800 my-8">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold">🏅</div>
            <div>
              <h3 class="text-base font-black text-slate-900 leading-tight">Modifier l'Écusson : ${b.name}</h3>
              <p class="text-xs text-slate-500 font-semibold">Ajustez le visuel PNG, le titre et la rareté</p>
            </div>
          </div>
          <button onclick="document.getElementById('admin-edit-badge-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer">✕</button>
        </div>

        <form onsubmit="event.preventDefault(); window.ProtecAdmin.saveBadgeEdit(${index});" class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Code unique :</label>
            <input type="text" id="adm-bdg-code" value="${b.code || ''}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-800 bg-white" required />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Nom de l'écusson :</label>
            <input type="text" id="adm-bdg-name" value="${b.name || ''}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Catégorie :</label>
              <input type="text" id="adm-bdg-cat" value="${b.category || 'Special'}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Rareté :</label>
              <select id="adm-bdg-rarity" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white">
                <option value="Commun" ${b.rarityTier === 'Commun' ? 'selected' : ''}>Commun</option>
                <option value="Peu Commun" ${b.rarityTier === 'Peu Commun' ? 'selected' : ''}>Peu Commun</option>
                <option value="Rare" ${b.rarityTier === 'Rare' ? 'selected' : ''}>Rare</option>
                <option value="Très Rare" ${b.rarityTier === 'Très Rare' ? 'selected' : ''}>Très Rare</option>
                <option value="Épique" ${b.rarityTier === 'Épique' ? 'selected' : ''}>Épique</option>
                <option value="Légendaire" ${b.rarityTier === 'Légendaire' ? 'selected' : ''}>Légendaire</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Chemin ou URL de l'image (PNG découpé) :</label>
            <input type="text" id="adm-bdg-image" value="${b.imageUrl || ''}" placeholder="Ex: images/badges/membre_fondateur.png" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-800 bg-white" />
            <p class="text-[10px] text-slate-400 mt-1">Vous pouvez aussi utiliser le Générateur IA pour générer un nouvel écusson et coller son chemin ici.</p>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Description & Contexte d'obtention :</label>
            <textarea id="adm-bdg-desc" rows="3" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white">${b.desc || ''}</textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onclick="document.getElementById('admin-edit-badge-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">Annuler</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-md transition cursor-pointer">✓ Sauvegarder</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  async saveBadgeEdit(index) {
    const b = this.badgesCache[index];
    if (!b) return;

    b.code = document.getElementById('adm-bdg-code').value.trim();
    b.name = document.getElementById('adm-bdg-name').value.trim();
    b.category = document.getElementById('adm-bdg-cat').value.trim();
    b.rarityTier = document.getElementById('adm-bdg-rarity').value;
    b.imageUrl = document.getElementById('adm-bdg-image').value.trim();
    b.desc = document.getElementById('adm-bdg-desc').value.trim();

    document.getElementById('admin-edit-badge-modal')?.classList.add('hidden');
    await this.saveBadgesCatalog();
    this.renderBadgesCatalogTable();
    if (window.game) window.game.showToast('Écusson Modifié', `« ${b.name} » a été mis à jour.`, 'green');
  },

  openCreateBadgeModal() {
    let modal = document.getElementById('admin-create-badge-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-create-badge-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800 my-8">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">➕</div>
            <div>
              <h3 class="text-base font-black text-slate-900 leading-tight">Créer un Nouvel Écusson</h3>
              <p class="text-xs text-slate-500 font-semibold">Ajoutez un insigne commémoratif ou départemental au jeu</p>
            </div>
          </div>
          <button onclick="document.getElementById('admin-create-badge-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer">✕</button>
        </div>

        <form onsubmit="event.preventDefault(); window.ProtecAdmin.saveNewBadge();" class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Code unique (ex: dept_75, pionnier_2026) :</label>
            <input type="text" id="adm-new-bdg-code" placeholder="Ex: dept_54" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-800 bg-white" required />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Nom complet de l'écusson :</label>
            <input type="text" id="adm-new-bdg-name" placeholder="Ex: Meurthe-et-Moselle (54)" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Catégorie :</label>
              <input type="text" id="adm-new-bdg-cat" value="Départemental" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Rareté :</label>
              <select id="adm-new-bdg-rarity" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white">
                <option value="Commun">Commun</option>
                <option value="Peu Commun">Peu Commun</option>
                <option value="Rare" selected>Rare</option>
                <option value="Très Rare">Très Rare</option>
                <option value="Légendaire">Légendaire</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Chemin ou URL de l'image PNG :</label>
            <input type="text" id="adm-new-bdg-image" placeholder="images/badges/mon_ecusson.png" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-800 bg-white" />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Description :</label>
            <textarea id="adm-new-bdg-desc" rows="2" placeholder="Description de l'insigne..." class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white" required></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onclick="document.getElementById('admin-create-badge-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">Annuler</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer">✓ Créer l'Écusson</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  async saveNewBadge() {
    const newBadge = {
      code: document.getElementById('adm-new-bdg-code').value.trim(),
      name: document.getElementById('adm-new-bdg-name').value.trim(),
      category: document.getElementById('adm-new-bdg-cat').value.trim(),
      rarityTier: document.getElementById('adm-new-bdg-rarity').value,
      imageUrl: document.getElementById('adm-new-bdg-image').value.trim(),
      desc: document.getElementById('adm-new-bdg-desc').value.trim()
    };

    this.badgesCache.push(newBadge);
    document.getElementById('admin-create-badge-modal')?.classList.add('hidden');
    await this.saveBadgesCatalog();
    this.renderBadgesCatalogTable();
    if (window.game) window.game.showToast('Nouvel Écusson Créé', `« ${newBadge.name} » a rejoint le catalogue.`, 'green');
  },

  async saveBadgesCatalog() {
    try {
      localStorage.setItem('protec_custom_badges_catalog', JSON.stringify(this.badgesCache));
      if (window.ProtecEcussons) {
        window.ProtecEcussons.catalog = this.badgesCache;
      }
      await fetch('/api/admin/catalogs/save', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ type: 'badges', catalog: this.badgesCache })
      });
    } catch (e) {
      console.warn('Erreur sauvegarde catalogue écussons:', e);
    }
  },

  // Modal d'attribution directe d'un écusson à un directeur
  openAwardBadgeModal(badgeCode) {
    const badge = (this.badgesCache || []).find(b => b.code === badgeCode);
    if (!badge) return;

    let modal = document.getElementById('admin-award-badge-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-award-badge-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto';
      document.body.appendChild(modal);
    }

    const players = this.usersCache || [];

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800 my-8">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">🎁</div>
            <div>
              <h3 class="text-base font-black text-slate-900 leading-tight">Décerner l'Écusson</h3>
              <p class="text-xs text-slate-500 font-semibold">Attribuez directement cet insigne à un directeur</p>
            </div>
          </div>
          <button onclick="document.getElementById('admin-award-badge-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer">✕</button>
        </div>

        <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
          <div class="w-12 h-14 rounded-xl bg-slate-900 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
            ${badge.imageUrl ? `<img src="${badge.imageUrl}" class="w-full h-full object-contain" />` : `<span>🛡️</span>`}
          </div>
          <div>
            <h4 class="text-xs font-black text-slate-900">${badge.name}</h4>
            <span class="text-[10px] text-slate-500 block">${badge.category} • ${badge.rarityTier}</span>
          </div>
        </div>

        <form onsubmit="event.preventDefault(); window.ProtecAdmin.submitAwardBadge('${badge.code}');" class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Sélectionner le Directeur bénéficiaire :</label>
            <select id="adm-award-user" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required>
              <option value="">-- Choisir un directeur dans la base --</option>
              <option value="all">🌟 TOUS LES DIRECTEURS (Distribution Fédérale Globale)</option>
              ${players.map(p => `
                <option value="${p.id}">${p.username} (${p.stationName || 'Antenne'} - ${p.city || 'Ville'})</option>
              `).join('')}
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Quantité attribuée :</label>
            <input type="number" id="adm-award-qty" value="1" min="1" max="10" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onclick="document.getElementById('admin-award-badge-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">Annuler</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition cursor-pointer">✓ Décerner Officiellement</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  async submitAwardBadge(badgeCode) {
    const userSelect = document.getElementById('adm-award-user');
    const userId = userSelect?.value;
    const qty = parseInt(document.getElementById('adm-award-qty')?.value || '1', 10) || 1;
    if (!userId) {
      if (window.ProtecDialog) {
        await window.ProtecDialog.alert("Veuillez sélectionner un directeur destinataire.", "Destinataire Requis");
      } else {
        alert("Veuillez sélectionner un directeur destinataire.");
      }
      return;
    }

    // Fermer la modale
    document.getElementById('admin-award-badge-modal')?.classList.add('hidden');

    // Déléguer au système officiel (persistance Supabase, Realtime, Cache, Backend local)
    await this.awardBadgeToPlayer(userId, badgeCode, qty, true);
  },

  // =========================================================================
  // CRÉATION D'ÉVÉNEMENT OFFICIEL DEPUIS LE PANEL ADMIN
  // =========================================================================
  openCreateEventModal() {
    let modal = document.getElementById('admin-create-event-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-create-event-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto';
      document.body.appendChild(modal);
    }

    const badges = this.badgesCache || [];

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800 my-8">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold">🎪</div>
            <div>
              <h3 class="text-base font-black text-slate-900 leading-tight">Créer un Nouvel Événement Fédéral Officiel</h3>
              <p class="text-xs text-slate-500 font-semibold">Publiez une mission événementielle ouverte sur la carte de France</p>
            </div>
          </div>
          <button onclick="document.getElementById('admin-create-event-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer">✕</button>
        </div>

        <form onsubmit="event.preventDefault(); window.ProtecAdmin.saveNewEvent();" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Titre de l'événement :</label>
              <input type="text" id="adm-new-evt-title" placeholder="Ex: Marathon International 2026" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Catégorie :</label>
              <select id="adm-new-evt-cat" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white">
                <option value="Grand Rassemblement">Grand Rassemblement</option>
                <option value="DPS National">DPS National</option>
                <option value="Plan NOVI">Plan NOVI / Crise</option>
                <option value="Sportif">Événement Sportif</option>
                <option value="Culturel">Festival / Concert</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Adresse du dispositif :</label>
              <input type="text" id="adm-new-evt-addr" placeholder="Ex: Stade de France" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Ville & Département :</label>
              <input type="text" id="adm-new-evt-city" placeholder="Ex: Saint-Denis (93)" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Latitude GPS :</label>
              <input type="number" id="adm-new-evt-lat" value="48.9244" step="0.0001" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-800 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Longitude GPS :</label>
              <input type="number" id="adm-new-evt-lng" value="2.3601" step="0.0001" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-800 bg-white" required />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Bénévoles requis :</label>
              <input type="number" id="adm-new-evt-vols" value="8" min="2" max="50" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Durée (heures) :</label>
              <input type="number" id="adm-new-evt-dur" value="6" min="1" max="48" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" required />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-0.5">Indemnité (€) :</label>
              <input type="number" id="adm-new-evt-reward" value="1200" min="100" step="50" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black text-emerald-700 bg-white" required />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Écusson commémoratif associé :</label>
            <select id="adm-new-evt-badge" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white">
              <option value="">-- Aucun écusson particulier --</option>
              ${badges.map(b => `<option value="${b.code}">${b.name} (${b.rarityTier})</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-0.5">Description et consignes fédérales :</label>
            <textarea id="adm-new-evt-desc" rows="2" placeholder="Détaillez le dispositif et l'objectif de la mission..." class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white" required></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onclick="document.getElementById('admin-create-event-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">Annuler</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-xs font-black bg-purple-700 hover:bg-purple-800 text-white shadow-md transition cursor-pointer">✓ Publier l'Événement</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  async saveNewEvent() {
    const bCode = document.getElementById('adm-new-evt-badge').value;
    const badgeObj = (this.badgesCache || []).find(b => b.code === bCode);

    const newEvent = {
      id: `evt-adm-${Date.now()}`,
      title: document.getElementById('adm-new-evt-title').value.trim(),
      category: document.getElementById('adm-new-evt-cat').value,
      address: document.getElementById('adm-new-evt-addr').value.trim(),
      city: document.getElementById('adm-new-evt-city').value.trim(),
      lat: parseFloat(document.getElementById('adm-new-evt-lat').value || '48.8566'),
      lng: parseFloat(document.getElementById('adm-new-evt-lng').value || '2.3522'),
      volunteersNeeded: parseInt(document.getElementById('adm-new-evt-vols').value || '8', 10),
      durationHours: parseInt(document.getElementById('adm-new-evt-dur').value || '6', 10),
      indemnisation: parseInt(document.getElementById('adm-new-evt-reward').value || '1200', 10),
      description: document.getElementById('adm-new-evt-desc').value.trim(),
      badge: badgeObj ? {
        name: badgeObj.name,
        code: badgeObj.code,
        rarityTier: badgeObj.rarityTier,
        imageUrl: badgeObj.imageUrl
      } : null,
      status: 'open',
      createdAt: new Date().toISOString()
    };

    try {
      await fetch('/api/admin/events/create', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(newEvent)
      });
    } catch (e) {}

    if (window.game) {
      if (!window.game.communityEvents) window.game.communityEvents = [];
      window.game.communityEvents.unshift(newEvent);
      window.game.showToast('Événement Publié !', `« ${newEvent.title} » a été mis en ligne sur la carte.`, 'purple');
    }

    document.getElementById('admin-create-event-modal')?.classList.add('hidden');
    this.loadEventsData();
  },

  // Chargement des données de Sécurité & Parrainages
  async loadReferralsData() {
    const tbodyFraud = document.getElementById('admin-fraud-logs-tbody');
    const tbodyRef = document.getElementById('admin-referrals-tbody');
    const badgeCount = document.getElementById('admin-referral-fraud-badge');
    const countFraud = document.getElementById('admin-fraud-logs-count');
    const countRef = document.getElementById('admin-referrals-count');

    if (tbodyFraud) tbodyFraud.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-xs text-slate-400 font-semibold animate-pulse">Chargement des données de sécurité...</td></tr>`;

    let data = null;
    try {
      const res = await fetch('/api/admin/referrals', { headers: this.getAuthHeaders() });
      if (res.ok) {
        data = await res.json();
      }
    } catch (e) {}

    if (!data && window.ProtecSupabase) {
      data = await window.ProtecSupabase.getReferralAdminDataSupabase();
    }

    if (!data) {
      if (tbodyFraud) tbodyFraud.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-xs text-rose-500 font-bold">Impossible de récupérer les données de parrainage.</td></tr>`;
      return;
    }

    const unreviewedCount = (data.fraudLogs || []).filter(f => !f.reviewed).length;
    if (badgeCount) {
      if (unreviewedCount > 0) {
        badgeCount.textContent = unreviewedCount;
        badgeCount.classList.remove('hidden');
      } else {
        badgeCount.classList.add('hidden');
      }
    }

    if (countFraud) countFraud.textContent = `${(data.fraudLogs || []).length} incident(s)`;
    if (countRef) countRef.textContent = `${(data.referralLogs || []).length} parrainage(s)`;

    // Rendu des logs de fraude
    if (tbodyFraud) {
      if (!data.fraudLogs || data.fraudLogs.length === 0) {
        tbodyFraud.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-xs text-slate-400 font-medium">Aucun incident de fraude détecté. Tous les parrainages respectent les règles IP.</td></tr>`;
      } else {
        tbodyFraud.innerHTML = data.fraudLogs.map(f => {
          const dateStr = new Date(f.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
          const isRecidivist = f.is_recidivist || f.total_fraud_attempts >= 2;
          const rowBg = isRecidivist ? 'bg-rose-50/70' : 'hover:bg-slate-50/80';

          const reasonMap = {
            'SAME_IP_AS_REFERRER': { label: 'Même IP que le Parrain', color: 'bg-rose-100 text-rose-800 border-rose-300' },
            'IP_ALREADY_USED_BY_ANOTHER_REFERRAL': { label: 'IP déjà utilisée par un autre Filleul', color: 'bg-orange-100 text-orange-900 border-orange-300' },
            'SELF_REFERRAL': { label: 'Auto-Parrainage', color: 'bg-amber-100 text-amber-900 border-amber-300' },
            'REFERRAL_SUSPENDED': { label: 'Parrain Suspendu', color: 'bg-slate-100 text-slate-800 border-slate-300' }
          };
          const reasonInfo = reasonMap[f.reason] || { label: f.reason, color: 'bg-slate-100 text-slate-800 border-slate-200' };

          return `
            <tr class="${rowBg} transition border-b border-slate-100">
              <td class="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">${dateStr}</td>
              <td class="py-3 px-3">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-extrabold text-slate-900">${f.referrer_username}</span>
                  ${isRecidivist ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white uppercase tracking-wider animate-pulse" title="Ce parrain a accumulé ${f.total_fraud_attempts} tentatives suspectes">⚠️ Récidiviste (${f.total_fraud_attempts})</span>` : ''}
                  ${f.referrer_suspended ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">Code Suspendu</span>` : ''}
                  ${f.referrer_is_banned ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-100 text-rose-900 border border-rose-300">Banni</span>` : ''}
                </div>
                <div class="text-[10px] text-slate-400 font-mono">${f.referrer_id}</div>
              </td>
              <td class="py-3 px-3 font-bold text-slate-800">${f.attempted_referee_username}</td>
              <td class="py-3 px-3">
                <code class="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200">${f.ip_detected}</code>
              </td>
              <td class="py-3 px-3">
                <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${reasonInfo.color}">${reasonInfo.label}</span>
              </td>
              <td class="py-3 px-3">
                ${f.reviewed ? `
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">✓ Classé</span>
                ` : `
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">À Traiter</span>
                `}
              </td>
              <td class="py-3 px-3 text-right">
                <div class="flex items-center justify-end gap-1 flex-wrap">
                  ${!f.reviewed ? `
                    <button onclick="window.ProtecAdmin.executeReferralAction('review_fraud', '${f.id}')" class="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer" title="Marquer cet incident comme examiné">
                      Classer
                    </button>
                  ` : ''}
                  <button onclick="window.ProtecAdmin.promptWarnReferrer('${f.referrer_id}', '${f.referrer_username}')" class="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer" title="Envoyer une alerte officielle au joueur">
                    Avertir
                  </button>
                  ${f.referrer_suspended ? `
                    <button onclick="window.ProtecAdmin.executeReferralAction('reactivate_referrer', '${f.referrer_id}')" class="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition cursor-pointer" title="Lever la suspension de son code de parrainage">
                      Réactiver
                    </button>
                  ` : ''}
                  ${!f.referrer_is_banned ? `
                    <button onclick="window.ProtecAdmin.promptBanReferrer('${f.referrer_id}', '${f.referrer_username}')" class="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition cursor-pointer" title="Bannir définitivement ce joueur">
                      Bannir
                    </button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Rendu des parrainages conformes
    if (tbodyRef) {
      if (!data.referralLogs || data.referralLogs.length === 0) {
        tbodyRef.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-xs text-slate-400 font-medium">Aucun parrainage certifié pour le moment.</td></tr>`;
      } else {
        tbodyRef.innerHTML = data.referralLogs.map(r => {
          const dateStr = new Date(r.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
          const isDone = r.status === 'completed';

          return `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
              <td class="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">${dateStr}</td>
              <td class="py-2.5 px-3 font-bold text-slate-900">${r.referrer_username} <span class="text-[10px] font-mono text-slate-400">(${r.referrer_id})</span></td>
              <td class="py-2.5 px-3 font-bold text-slate-900">${r.referee_username} <span class="text-[10px] font-mono text-slate-400">(${r.referee_id})</span></td>
              <td class="py-2.5 px-3">
                ${isDone ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ Validé (1ère intervention)
                  </span>
                ` : `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    ⏳ En attente de réalisation du 1er DPS
                  </span>
                `}
              </td>
              <td class="py-2.5 px-3 font-bold text-emerald-700">+1 500 € (Accordé)</td>
              <td class="py-2.5 px-3 font-bold ${r.reward_referrer_granted ? 'text-emerald-700' : 'text-slate-400'}">
                ${r.reward_referrer_granted ? '+2 500 € (Versée)' : 'En attente palier'}
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  },

  async executeReferralAction(action, targetId, extra = {}) {
    try {
      let res = await fetch('/api/admin/referrals/action', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ action, targetId, extra })
      }).catch(() => null);

      if (res && res.ok) {
        window.game?.showToast?.('Action Validée', 'Action administrative enregistrée avec succès.', 'green');
      } else if (window.ProtecSupabase) {
        await window.ProtecSupabase.processAdminReferralActionSupabase(action, targetId, extra);
        window.game?.showToast?.('Action Validée', 'Action administrative appliquée sur Supabase.', 'green');
      }
      this.loadReferralsData();
      this.loadAdminData(window.game);
    } catch (e) {
      window.game?.showToast?.('Erreur', e.message, 'red');
    }
  },

  promptWarnReferrer(referrerId, username) {
    const msg = prompt(`Message d'avertissement pour ${username} :`, "Avertissement Administrateur : Des irrégularités réseau (doublons IP) ont été détectées sur votre code de parrainage. Veillez à respecter les règles sous peine de suspension définitive.");
    if (msg) {
      this.executeReferralAction('warn_referrer', referrerId, { message: msg });
    }
  },

  promptBanReferrer(referrerId, username) {
    if (confirm(`Confirmez-vous le bannissement immédiat du parrain ${username} ? Le joueur sera déconnecté et ses accès coupés.`)) {
      this.executeReferralAction('ban_referrer', referrerId);
    }
  },

  async updateReferralFraudBadge() {
    try {
      const badge = document.getElementById('admin-referral-fraud-badge');
      if (!badge) return;
      let data = null;
      try {
        const res = await fetch('/api/admin/referrals', { headers: this.getAuthHeaders() });
        if (res.ok) data = await res.json();
      } catch (e) {}
      if (!data && window.ProtecSupabase) {
        data = await window.ProtecSupabase.getReferralAdminDataSupabase();
      }
      if (data && Array.isArray(data.fraudLogs)) {
        const unreviewed = data.fraudLogs.filter(f => !f.reviewed).length;
        if (unreviewed > 0) {
          badge.textContent = unreviewed;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    } catch (e) {}
  },

  // ============================================================
  // MODULE GESTION & ÉQUILIBRAGE GAMEPLAY (TUNING LIVE ADMIN)
  // ============================================================
  balancingCategoryFilter: 'all',
  balancingSearchQuery: '',

  setBalancingCategory(cat) {
    this.balancingCategoryFilter = cat;
    this.renderBalancingView();
  },

  onBalancingSearch(val) {
    this.balancingSearchQuery = (val || '').toLowerCase().trim();
    this.renderBalancingView();
  },

  updateBalancingValue(key, val) {
    if (!window.ProtecGameplayConfig) return;
    const num = parseFloat(val);
    if (!isNaN(num)) {
      window.ProtecGameplayConfig.set(key, num);
      const rangeEl = document.getElementById(`balancing-range-${key}`);
      const numEl = document.getElementById(`balancing-num-${key}`);
      const valBadge = document.getElementById(`balancing-val-${key}`);
      if (rangeEl && rangeEl.value != num) rangeEl.value = num;
      if (numEl && numEl.value != num) numEl.value = num;
      if (valBadge) {
        const schema = window.ProtecGameplayConfig.SCHEMA[key] || {};
        valBadge.textContent = `${num} ${schema.unit || ''}`;
      }
      if (window.game) {
        window.ProtecGameplayConfig.applyLive(window.game);
      }
    }
  },

  resetSingleBalancingValue(key) {
    if (!window.ProtecGameplayConfig) return;
    const schema = window.ProtecGameplayConfig.SCHEMA[key];
    if (schema) {
      this.updateBalancingValue(key, schema.default);
      this.renderBalancingView();
      if (window.game?.showToast) {
        window.game.showToast('Paramètre Réinitialisé', `« ${schema.label} » remis à sa valeur par défaut (${schema.default}).`, 'blue');
      }
    }
  },

  resetBalancingToDefaults() {
    if (!window.ProtecGameplayConfig) return;
    if (confirm('Voulez-vous rétablir TOUS les paramètres de jeu et probabilités à leurs valeurs officielles par défaut ?')) {
      window.ProtecGameplayConfig.resetToDefaults();
      if (window.game) window.ProtecGameplayConfig.applyLive(window.game);
      this.renderBalancingView();
      if (window.game?.showToast) {
        window.game.showToast('⚙️ Valeurs Rétablies', 'Tous les paramètres de jeu ont été réinitialisés aux valeurs par défaut.', 'green');
      }
    }
  },

  applyAllBalancing() {
    if (!window.ProtecGameplayConfig) return;
    window.ProtecGameplayConfig.applyLive(window.game);
    if (window.game?.showToast) {
      window.game.showToast('✅ Paramètres Sauvegardés', 'Toutes les modifications d\'équilibrage sont enregistrées et actives en jeu.', 'green');
    }
  },

  exportBalancingConfig() {
    if (!window.ProtecGameplayConfig) return;
    const jsonStr = window.ProtecGameplayConfig.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protec_balancing_tuning_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (window.game?.showToast) {
      window.game.showToast('📥 Export Réussi', 'Fichier JSON d\'équilibrage téléchargé.', 'blue');
    }
  },

  triggerImportBalancingFile() {
    const input = document.getElementById('admin-balancing-import-file');
    if (input) input.click();
  },

  handleBalancingFileImport(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      if (window.ProtecGameplayConfig && window.ProtecGameplayConfig.importJSON(content)) {
        if (window.game) window.ProtecGameplayConfig.applyLive(window.game);
        this.renderBalancingView();
        if (window.game?.showToast) {
          window.game.showToast('📤 Import Réussi', 'Tous les paramètres d\'équilibrage ont été importés et appliqués !', 'green');
        }
      } else {
        alert('Erreur lors de l\'import : format JSON non valide.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  },

  renderBalancingView() {
    const container = document.getElementById('admin-view-balancing');
    if (!container) return;
    if (!window.ProtecGameplayConfig) {
      container.innerHTML = `<div class="p-8 text-center text-rose-500 font-bold">Module d'équilibrage non disponible.</div>`;
      return;
    }

    const cfg = window.ProtecGameplayConfig;
    const schema = cfg.SCHEMA;
    const currentValues = cfg.getAll();
    const categories = cfg.CATEGORIES;

    const activeCategory = this.balancingCategoryFilter || 'all';
    const query = this.balancingSearchQuery || '';

    const entries = Object.entries(schema).filter(([key, def]) => {
      if (activeCategory !== 'all' && def.category !== activeCategory) return false;
      if (query) {
        const text = `${def.label} ${def.desc} ${def.category} ${key}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });

    container.innerHTML = `
      <!-- En-tête avec Actions Globales -->
      <div class="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white flex items-center justify-between flex-wrap gap-3 shadow-md">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500 text-white uppercase tracking-wider">ADMINISTRATION SYSTÈME</span>
            <span class="text-xs font-black text-indigo-300">Ajustement Live & Équilibrage Réel</span>
          </div>
          <h3 class="text-base font-black text-white flex items-center gap-2">
            <span>⚙️ Centre de Gestion de l'Équilibrage Gameplay</span>
          </h3>
          <p class="text-[11px] text-slate-300 max-w-2xl">
            Modifiez en direct les probabilités d'alertes, ratios économiques, flux de candidats et délais de réponse sans recharger le jeu. Vos tests prennent effet immédiatement.
          </p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <input type="file" id="admin-balancing-import-file" class="hidden" accept=".json" onchange="window.ProtecAdmin.handleBalancingFileImport(event)" />
          <button onclick="window.ProtecAdmin.triggerImportBalancingFile()" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/20 cursor-pointer flex items-center gap-1.5" title="Importer un fichier JSON de configuration">
            <span>📤 Importer</span>
          </button>
          <button onclick="window.ProtecAdmin.exportBalancingConfig()" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/20 cursor-pointer flex items-center gap-1.5" title="Télécharger la configuration en JSON">
            <span>📥 Exporter</span>
          </button>
          <button onclick="window.ProtecAdmin.resetBalancingToDefaults()" class="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm" title="Rétablir toutes les valeurs par défaut du jeu">
            <span>🔄 Par Défaut</span>
          </button>
          <button onclick="window.ProtecAdmin.applyAllBalancing()" class="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md" title="Appliquer et sauvegarder immédiatement">
            <span>💾 Sauvegarder Live</span>
          </button>
        </div>
      </div>

      <!-- BOÎTE À OUTILS : TESTS & DÉCLENCHEMENTS FORCÉS IMMÉDIATS -->
      <div class="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <h4 class="text-xs font-black text-slate-800 uppercase tracking-wide">⚡ Déclencheurs de Test Forcé Immédiat</h4>
          </div>
          <span class="text-[10px] text-slate-500 font-medium">Bypass les minuteurs et déclenche les scénarios instantanément pour vérifier vos réglages</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
          <button onclick="window.ProtecGameplayConfig.forceSamuEmergency(window.game)" class="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold transition flex flex-col items-center text-center gap-1 cursor-pointer">
            <span class="text-base">🚨</span>
            <span class="text-[11px] leading-tight">Urgence SAMU 15</span>
          </button>
          <button onclick="window.ProtecGameplayConfig.forceSdisEmergency(window.game)" class="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 font-bold transition flex flex-col items-center text-center gap-1 cursor-pointer">
            <span class="text-base">🚒</span>
            <span class="text-[11px] leading-tight">Départ SDIS Pompiers</span>
          </button>
          <button onclick="window.ProtecGameplayConfig.forceSncfAlert(window.game)" class="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold transition flex flex-col items-center text-center gap-1 cursor-pointer">
            <span class="text-base">🚆</span>
            <span class="text-[11px] leading-tight">Alerte SNCF Gares</span>
          </button>
          <button onclick="window.ProtecGameplayConfig.forceAascPrealert(window.game)" class="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold transition flex flex-col items-center text-center gap-1 cursor-pointer">
            <span class="text-base">🏛️</span>
            <span class="text-[11px] leading-tight">Préalerte AASC</span>
          </button>
          <button onclick="window.ProtecGameplayConfig.forceCrisis(window.game)" class="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 font-bold transition flex flex-col items-center text-center gap-1 cursor-pointer">
            <span class="text-base">⚠️</span>
            <span class="text-[11px] leading-tight">Crise Plan NOVI</span>
          </button>
          <button onclick="window.ProtecGameplayConfig.forceCandidature(window.game)" class="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold transition flex flex-col items-center text-center gap-1 cursor-pointer">
            <span class="text-base">🙋‍♂️</span>
            <span class="text-[11px] leading-tight">Candidature Bénévole</span>
          </button>
          <button onclick="window.ProtecGameplayConfig.forceDevis(window.game, 'PAPS')" class="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 font-bold transition flex flex-col items-center text-center gap-1 cursor-pointer">
            <span class="text-base">📋</span>
            <span class="text-[11px] leading-tight">Devis PAPS</span>
          </button>
          <button onclick="window.ProtecGameplayConfig.forceDevis(window.game, 'DPS-PE')" class="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-bold transition flex flex-col items-center text-center gap-1 cursor-pointer">
            <span class="text-base">📋</span>
            <span class="text-[11px] leading-tight">Devis DPS-PE</span>
          </button>
          <button onclick="window.ProtecGameplayConfig.forceDevis(window.game, 'DPS-ME')" class="p-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 font-bold transition flex flex-col items-center text-center gap-1 cursor-pointer">
            <span class="text-base">📋</span>
            <span class="text-[11px] leading-tight">Devis DPS-ME</span>
          </button>
          <button onclick="window.ProtecGameplayConfig.forceDevis(window.game, 'DPS-GE')" class="p-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 font-bold transition flex flex-col items-center text-center gap-1 cursor-pointer">
            <span class="text-base">📋</span>
            <span class="text-[11px] leading-tight">Devis DPS-GE</span>
          </button>
          <button onclick="window.ProtecGameplayConfig.forceFormationDemand(window.game, 'PSC')" class="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold transition flex flex-col items-center text-center gap-1 cursor-pointer">
            <span class="text-base">🎓</span>
            <span class="text-[11px] leading-tight">Demande PSC</span>
          </button>
          <button onclick="window.ProtecGameplayConfig.forceFormationDemand(window.game, 'SST')" class="p-2 rounded-xl bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-200 font-bold transition flex flex-col items-center text-center gap-1 cursor-pointer">
            <span class="text-base">🎓</span>
            <span class="text-[11px] leading-tight">Demande SST B2B</span>
          </button>
        </div>
      </div>

      <!-- Barre de recherche & Filtres de Catégories -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div class="relative flex-1">
          <input type="text" placeholder="🔍 Rechercher une variable (ex: samu, sncf, dps, moral, rep, délai)..."
            value="${this.balancingSearchQuery || ''}"
            oninput="window.ProtecAdmin.onBalancingSearch(this.value)"
            class="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
          ${this.balancingSearchQuery ? `
            <button onclick="window.ProtecAdmin.onBalancingSearch('')" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs">✕</button>
          ` : ''}
        </div>
        <div class="text-[11px] font-bold text-slate-500 self-center">
          ${entries.length} paramètre(s) affiché(s)
        </div>
      </div>

      <!-- Filtres par pilules de catégorie -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 flex-nowrap text-xs">
        <button onclick="window.ProtecAdmin.setBalancingCategory('all')"
          class="px-3 py-1 rounded-xl font-bold cursor-pointer transition whitespace-nowrap ${activeCategory === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">
          Toutes (${Object.keys(schema).length})
        </button>
        ${Object.entries(categories).map(([catKey, catDef]) => {
          const count = Object.values(schema).filter(s => s.category === catKey).length;
          const isActive = activeCategory === catKey;
          return `
            <button onclick="window.ProtecAdmin.setBalancingCategory('${catKey}')"
              class="px-3 py-1 rounded-xl font-bold cursor-pointer transition whitespace-nowrap ${isActive ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">
              ${catDef.label} (${count})
            </button>
          `;
        }).join('')}
      </div>

      <!-- Grille des Cartes de Réglages -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${entries.length === 0 ? `
          <div class="col-span-2 p-8 text-center text-slate-400 text-xs font-semibold bg-white rounded-2xl border border-slate-200">
            Aucun paramètre ne correspond à votre recherche « ${this.balancingSearchQuery} ».
          </div>
        ` : entries.map(([key, def]) => {
          const curVal = currentValues[key] !== undefined ? currentValues[key] : def.default;
          const isModified = Math.abs(curVal - def.default) > 0.0001;
          const catInfo = categories[def.category] || { label: def.category };

          return `
            <div class="p-3.5 rounded-2xl bg-white border ${isModified ? 'border-indigo-400 shadow-indigo-100' : 'border-slate-200'} shadow-xs flex flex-col justify-between space-y-2.5 transition">
              <div>
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${isModified ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}">
                        ${catInfo.label}
                      </span>
                      ${isModified ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-white">Modifié</span>' : ''}
                    </div>
                    <h5 class="text-xs font-black text-slate-900 mt-1">${def.label}</h5>
                  </div>
                  <button onclick="window.ProtecAdmin.resetSingleBalancingValue('${key}')"
                    class="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer text-xs"
                    title="Rétablir la valeur par défaut (${def.default})">
                    🔄
                  </button>
                </div>
                <p class="text-[10px] text-slate-500 mt-1 leading-snug">${def.desc}</p>
              </div>

              <!-- Ligne de contrôle : Slider + Input numérique + Badge de valeur -->
              <div class="pt-2 border-t border-slate-100 space-y-1.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-slate-400 font-mono text-[10px]">${key}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-slate-400 text-[10px]">Défaut: <strong>${def.default} ${def.unit || ''}</strong></span>
                    <span id="balancing-val-${key}" class="px-2 py-0.5 rounded-md font-black mono-num text-xs ${isModified ? 'bg-indigo-100 text-indigo-900' : 'bg-slate-100 text-slate-800'}">
                      ${curVal} ${def.unit || ''}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <input type="range" id="balancing-range-${key}"
                    min="${def.min !== undefined ? def.min : 0}"
                    max="${def.max !== undefined ? def.max : 100}"
                    step="${def.step || 1}"
                    value="${curVal}"
                    oninput="window.ProtecAdmin.updateBalancingValue('${key}', this.value)"
                    class="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg" />

                  <input type="number" id="balancing-num-${key}"
                    min="${def.min !== undefined ? def.min : 0}"
                    max="${def.max !== undefined ? def.max : 100}"
                    step="${def.step || 1}"
                    value="${curVal}"
                    onchange="window.ProtecAdmin.updateBalancingValue('${key}', this.value)"
                    class="w-20 px-2 py-1 rounded-lg border border-slate-200 text-xs font-black mono-num text-right focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};

