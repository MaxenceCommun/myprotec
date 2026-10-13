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

    const viewPlayers = document.getElementById('admin-view-players');
    const viewAnnouncements = document.getElementById('admin-view-announcements');
    const viewSuspicion = document.getElementById('admin-view-suspicion');
    const viewSupport = document.getElementById('admin-view-support');
    const viewVehicles = document.getElementById('admin-view-vehicules');
    const viewEquipment = document.getElementById('admin-view-materiel');
    const viewArchives = document.getElementById('admin-view-archives');
    const viewMissions = document.getElementById('admin-view-missions');
    const viewEvents = document.getElementById('admin-view-events');

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

    if (viewPlayers) viewPlayers.classList.toggle('hidden', tab !== 'joueurs');
    if (viewAnnouncements) viewAnnouncements.classList.toggle('hidden', tab !== 'annonces');
    if (viewSuspicion) viewSuspicion.classList.toggle('hidden', tab !== 'suspicion');
    if (viewSupport) viewSupport.classList.toggle('hidden', tab !== 'support');
    if (viewVehicles) viewVehicles.classList.toggle('hidden', tab !== 'vehicules');
    if (viewEquipment) viewEquipment.classList.toggle('hidden', tab !== 'materiel');
    if (viewArchives) viewArchives.classList.toggle('hidden', tab !== 'archives');
    if (viewMissions) viewMissions.classList.toggle('hidden', tab !== 'missions');
    if (viewEvents) viewEvents.classList.toggle('hidden', tab !== 'events');

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

      // 2. Récupération des utilisateurs (Fusion intelligente : Serveur Local + Supabase Cloud + Compte Joueur Actif)
      const usersMap = new Map();

      // A. Récupération depuis le serveur local Node.js
      try {
        const usersRes = await fetch('/api/admin/users', { headers: this.getAuthHeaders() });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          (usersData.users || []).forEach(u => {
            if (u && u.id) usersMap.set(u.id, u);
          });
        }
      } catch (e) {}

      // B. Récupération depuis Supabase Cloud (comptes en ligne persistés)
      if (window.ProtecSupabase && window.ProtecSupabase.getAllPlayersForAdmin) {
        try {
          const supaPlayers = await window.ProtecSupabase.getAllPlayersForAdmin();
          if (Array.isArray(supaPlayers)) {
            supaPlayers.forEach(p => {
              if (p && p.id) {
                const existing = usersMap.get(p.id);
                if (existing) {
                  usersMap.set(p.id, { ...existing, ...p });
                } else {
                  usersMap.set(p.id, p);
                }
              }
            });
          }
        } catch (supaErr) {
          console.warn('Erreur lecture Supabase admin players:', supaErr);
        }
      }

      // C. Injection du Compte Joueur Actif (pour garantir qu'il figure toujours au tableau)
      const activePlayerId = game?.player?.id || window.ProtecAuth?.currentUser?.id || localStorage.getItem('protec_player_id');
      const activePlayerName = game?.player?.name || window.ProtecAuth?.currentUser?.username || localStorage.getItem('protec_player_name');

      if (activePlayerId || activePlayerName) {
        let matchedKey = null;
        for (const [id, u] of usersMap.entries()) {
          if (id === activePlayerId || (activePlayerName && u.username && u.username.toLowerCase() === activePlayerName.toLowerCase())) {
            matchedKey = id;
            break;
          }
        }

        const primaryStation = (game?.stations && game.stations[0]) || null;
        const currentMoney = (game?.resources?.money !== undefined) ? game.resources.money : ((game?.resources?.budget !== undefined) ? game.resources.budget : 15000);
        const currentVolunteers = game?.volunteers?.length || 4;
        const currentVehicles = game?.vehicles?.length || 1;
        const currentMissions = game?.missions?.length || 0;
        const currentCity = primaryStation?.city || window.ProtecAuth?.currentUser?.city || game?.currentCityKey || 'Paris';
        const currentStationName = primaryStation?.name || window.ProtecAuth?.currentUser?.stationName || 'Antenne Locale';
        const currentDept = primaryStation?.departmentCode || game?.player?.departmentCode || window.ProtecAuth?.currentUser?.departmentCode || '75';

        const localUserData = {
          id: activePlayerId || ('usr_local_' + (activePlayerName || 'joueur')),
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
          lastSaved: Date.now(),
          isLocalPlayer: true
        };

        if (matchedKey) {
          const ex = usersMap.get(matchedKey);
          usersMap.set(matchedKey, {
            ...ex,
            ...localUserData,
            id: ex.id,
            isLocalPlayer: true
          });
        } else {
          usersMap.set(localUserData.id, localUserData);
        }
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

    const term = (this.searchFilter || '').toLowerCase();
    const filtered = this.usersCache.filter(u =>
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.stationName && u.stationName.toLowerCase().includes(term)) ||
      (u.city && u.city.toLowerCase().includes(term))
    );

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-xs text-slate-400 font-semibold">Aucun joueur ne correspond à la recherche.</td></tr>`;
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
      container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400 italic">Sélectionnez un joueur ci-dessus pour inspecter et réparer sa partie.</div>`;
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

    const vehicles = sData?.vehicles || [];
    const missions = sData?.missions || [];

    container.innerHTML = `
      <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <h4 class="text-xs font-black text-slate-900">${user.username}</h4>
          <p class="text-[10px] text-slate-500">${user.stationName} • ${user.city} • Solde: <strong class="text-emerald-700">${Number(user.money || 0).toLocaleString('fr-FR')} €</strong></p>
        </div>
        <div class="flex gap-1.5">
          <button onclick="window.ProtecAdmin.supportAddVehicle('${user.id}', 'VPSP')" class="px-2.5 py-1.5 rounded-xl bg-pc-blue text-white font-extrabold text-[10px] shadow-xs cursor-pointer">
            + Ajouter VPSP
          </button>
          <button onclick="window.ProtecAdmin.supportAddVehicle('${user.id}', 'VTU')" class="px-2.5 py-1.5 rounded-xl bg-slate-700 text-white font-extrabold text-[10px] shadow-xs cursor-pointer">
            + Ajouter VTU
          </button>
          <button onclick="window.ProtecAdmin.supportClearStuckMissions('${user.id}')" class="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white font-extrabold text-[10px] shadow-xs cursor-pointer">
            🧹 Débloquer Missions
          </button>
        </div>
      </div>

      <!-- Véhicules du joueur -->
      <div class="border border-slate-200 rounded-2xl p-3 bg-white space-y-2">
        <span class="text-xs font-black text-slate-800 block">Flotte de Véhicules (${vehicles.length})</span>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${vehicles.length === 0 ? '<div class="text-[11px] text-slate-400 italic col-span-2">Aucun véhicule enregistré.</div>' : vehicles.map(v => `
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <strong class="text-slate-900">${v.name || v.type}</strong>
                <span class="text-[10px] text-slate-400 block">${v.immat || 'Sans plaque'} • État: ${v.condition || 100}%</span>
              </div>
              <button onclick="window.ProtecAdmin.supportRemoveVehicle('${user.id}', '${v.id}')" class="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px] cursor-pointer">
                Retirer
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Missions en cours -->
      <div class="border border-slate-200 rounded-2xl p-3 bg-white space-y-2">
        <span class="text-xs font-black text-slate-800 block">Missions & DPS en Cours (${missions.length})</span>
        <div class="space-y-1.5">
          ${missions.length === 0 ? '<div class="text-[11px] text-slate-400 italic">Aucune mission active.</div>' : missions.map(m => `
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <strong class="text-slate-900">${m.title}</strong>
                <span class="text-[10px] text-slate-500 block">Statut: ${m.status || 'En cours'} • ID: ${m.id}</span>
              </div>
              <div class="flex gap-1">
                <button onclick="window.ProtecAdmin.supportForceCompleteMission('${user.id}', '${m.id}')" class="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] cursor-pointer">
                  Valider (+Gain)
                </button>
                <button onclick="window.ProtecAdmin.supportCancelMission('${user.id}', '${m.id}')" class="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer">
                  Annuler
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  async supportAddVehicle(userId, vehicleType) {
    const user = (this.usersCache || []).find(u => u.id === userId);
    if (!user) return;

    let sData = user.saveData || {};
    if (!sData.vehicles) sData.vehicles = [];

    const newVeh = {
      id: `veh-admin-${Date.now()}`,
      type: vehicleType,
      name: `${vehicleType} Antenne`,
      immat: `PC-${Math.floor(100 + Math.random() * 900)}-FR`,
      condition: 100,
      inService: true,
      stationId: sData.stations?.[0]?.id || 'st-default'
    };

    sData.vehicles.push(newVeh);
    await this.updateUser(userId, { saveData: sData }, `Véhicule ${vehicleType} ajouté au joueur ${user.username}`);
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
    await this.updateUser(userId, { saveData: sData }, `Toutes les missions de ${user.username} ont été réinitialisées.`);
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

  createAdminModalDOM() {
    if (document.getElementById('admin-modal')) return;
    const div = document.createElement('div');
    div.id = 'admin-modal';
    div.className = 'hidden fixed inset-0 z-[65] items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in';
    div.innerHTML = `
      <div class="w-full max-w-5xl rounded-3xl glass-panel-heavy border-2 border-indigo-500/50 p-5 sm:p-7 shadow-2xl relative text-left max-h-[92vh] flex flex-col">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-4 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-600/30">
              👑
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-black text-slate-900 leading-tight">Panel Administrateur Protec Live</h3>
              <p class="text-xs text-indigo-600 font-bold">Gestion globale des Directeurs & Antennes</p>
            </div>
          </div>
          <button onclick="window.ProtecAdmin.closeAdminModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- 4 Cartes de Statistiques -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 flex-shrink-0">
          <div class="p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-sm">
            <div class="text-[9px] font-black uppercase text-slate-400">Directeurs Inscrits</div>
            <div class="text-lg font-black text-slate-800" id="admin-stat-total-users">-</div>
          </div>
          <div class="p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-sm">
            <div class="text-[9px] font-black uppercase text-emerald-600 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              En Ligne Multi
            </div>
            <div class="text-lg font-black text-emerald-600" id="admin-stat-online">-</div>
          </div>
          <div class="p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-sm">
            <div class="text-[9px] font-black uppercase text-slate-400">Parties Sauvegardées</div>
            <div class="text-lg font-black text-slate-800" id="admin-stat-saves">-</div>
          </div>
          <div class="p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-sm">
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
        </div>

        <!-- Vue 1 : Directeurs & Comptes -->
        <div id="admin-view-players" class="flex flex-col flex-1 min-h-0">
          <!-- Message Flash Broadcast -->
          <form onsubmit="window.ProtecAdmin.sendGlobalBroadcast(event)" class="mb-3 flex gap-2 flex-shrink-0">
            <input type="text" id="admin-broadcast-input" placeholder="📢 Diffuser une annonce flash à tous les joueurs connectés..." 
              class="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            <button type="submit" class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm">
              <span>Diffuser</span>
            </button>
          </form>

          <!-- Recherche & Barre d'outils -->
          <div class="flex items-center justify-between gap-3 mb-2 flex-shrink-0">
            <input type="text" oninput="window.ProtecAdmin.onSearchInput(this.value)" placeholder="🔍 Rechercher un joueur, antenne, ville..." 
              class="w-72 px-3 py-1.5 rounded-xl border border-slate-200 bg-white/80 text-xs font-semibold focus:outline-none" />
            <button onclick="window.ProtecAdmin.loadAdminData(window.game)" class="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
              🔄 Rafraîchir
            </button>
          </div>

          <!-- Table des Joueurs (Scrollable) -->
          <div class="overflow-y-auto overflow-x-auto flex-1 rounded-2xl border border-slate-200/80 bg-white/60 no-scrollbar">
            <table class="w-full text-left border-collapse">
              <thead class="sticky top-0 bg-slate-100/90 backdrop-blur-md text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th class="py-2.5 px-3">Joueur / Rôle</th>
                  <th class="py-2.5 px-3">Antenne & Ville</th>
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
        desc: 'Cellule sanitaire grand volume aux normes EN 1789, brancard 3 points, oxygénothérapie et armoire d’urgence SUAP.',
        cost: 28500,
        capacity: 5,
        licenseRequired: 'B',
        licenseLabel: 'Permis B (+ Habilitation P.VPSP)',
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
        name: 'Fourgon Lourd d’Intervention Technique (FLIT)',
        category: 'Technique & Soutien Lourd',
        desc: 'Poids Lourd de soutien lourd type FPTL/FPTSR (> 12 tonnes) avec mât d’éclairage télescopique, groupe électrogène de puissance et motopompes grande capacité.',
        cost: 95000,
        capacity: 3,
        licenseRequired: 'C',
        licenseLabel: 'Permis C (Poids Lourd) Requis 🚚',
        speedKmH: 70,
        hasTowHitch: true,
        image: 'images/vehicles/FLIT.png'
      },
      {
        type: 'PCM',
        name: 'Poste de Commandement Mobile (PCM)',
        category: 'Commandement Lourd',
        desc: 'Centre opérationnel mobile de crise avec baie de transmissions VHF/UHF, liaisons satellites et salle de crise embarquée.',
        cost: 45000,
        capacity: 3,
        licenseRequired: 'C',
        licenseLabel: 'Permis C (Poids Lourd) Requis 🚚',
        speedKmH: 65,
        hasTowHitch: false,
        image: 'images/vehicles/PCM.png'
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
    const userId = document.getElementById('adm-award-user')?.value;
    const qty = parseInt(document.getElementById('adm-award-qty')?.value || '1', 10);
    if (!userId) return;

    const user = (this.usersCache || []).find(u => u.id === userId);
    const badge = (this.badgesCache || []).find(b => b.code === badgeCode);

    try {
      const res = await fetch('/api/admin/badges/award', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ userId, badgeCode, quantity: qty })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        document.getElementById('admin-award-badge-modal')?.classList.add('hidden');
        if (window.game) window.game.showToast('Écusson Décerné !', `L'écusson « ${badge.name} » a été remis à ${user?.username || 'le joueur'}.`, 'green');
      } else {
        alert(data.error || "Erreur lors de l'attribution.");
      }
    } catch (e) {
      alert("Erreur réseau lors de l'attribution de l'écusson.");
    }
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
  }
};

