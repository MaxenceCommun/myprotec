/**
 * PROTEC LIVE - PANEL ADMINISTRATEUR (GESTION DE TOUS LES JOUEURS)
 * Permet à l'administrateur de superviser la base de données,
 * modifier les trésoreries, réinitialiser des mots de passe,
 * gérer les bannissements et diffuser des alertes globales.
 */

window.ProtecAdmin = {
  usersCache: [],
  archivesCache: [],
  activeTab: 'joueurs',
  searchFilter: '',

  getAuthHeaders() {
    const token = localStorage.getItem('protec_auth_token') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-admin-key': 'protec_admin_secret_2026'
    };
  },

  async openAdminModal(game) {
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
    const tabArchivesBtn = document.getElementById('admin-tab-archives-btn');
    const tabMissionsBtn = document.getElementById('admin-tab-missions-btn');
    const viewPlayers = document.getElementById('admin-view-players');
    const viewArchives = document.getElementById('admin-view-archives');
    const viewMissions = document.getElementById('admin-view-missions');

    const defaultClass = 'px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition';
    const activeClass = 'px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-sm transition';

    if (tabPlayersBtn) tabPlayersBtn.className = (tab === 'joueurs' ? activeClass : defaultClass);
    if (tabArchivesBtn) tabArchivesBtn.className = (tab === 'archives' ? activeClass : defaultClass);
    if (tabMissionsBtn) tabMissionsBtn.className = (tab === 'missions' ? activeClass : defaultClass);

    if (viewPlayers) viewPlayers.classList.toggle('hidden', tab !== 'joueurs');
    if (viewArchives) viewArchives.classList.toggle('hidden', tab !== 'archives');
    if (viewMissions) viewMissions.classList.toggle('hidden', tab !== 'missions');

    if (tab === 'archives') {
      this.loadResetArchives();
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
    if (!confirm(`Voulez-vous restaurer cette archive de sauvegarde pour le joueur « ${username} » ? Sa partie actuelle sera remplacée par cette sauvegarde.`)) {
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
        alert(`Succès : La sauvegarde a été réattribuée à ${username}. Le joueur peut recharger sa partie depuis le Cloud.`);
        await this.loadAdminData(window.game);
        this.switchTab('joueurs');
      } else {
        alert(data.error || 'Erreur lors de la restitution.');
      }
    } catch (e) {
      alert('Erreur réseau lors de la restauration.');
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
      tableBody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-xs text-slate-500 font-semibold animate-pulse">Chargement de la base de données des directeurs...</td></tr>`;
    }

    try {
      // 1. Récupération des stats globales
      const statsRes = await fetch('/api/admin/stats', { headers: this.getAuthHeaders() });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        this.renderStats(statsData.stats);
      }

      // 2. Récupération des utilisateurs
      const usersRes = await fetch('/api/admin/users', { headers: this.getAuthHeaders() });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        this.usersCache = usersData.users || [];
        this.renderUsersTable(game);
      } else {
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-xs text-rose-600 font-bold">Accès refusé. Vous devez être connecté avec un compte Administrateur.</td></tr>`;
        }
      }
    } catch (e) {
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-xs text-rose-500 font-semibold">Erreur de communication avec le serveur BDD.</td></tr>`;
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
      u.username.toLowerCase().includes(term) ||
      (u.stationName && u.stationName.toLowerCase().includes(term)) ||
      (u.city && u.city.toLowerCase().includes(term))
    );

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-xs text-slate-400 font-semibold">Aucun joueur ne correspond à la recherche.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map(u => {
      const isOnline = !!(game && game.player && game.player.id === u.id);
      const isBanned = u.isBanned;
      const isAdmin = u.role === 'admin';

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/70 transition text-xs">
          <!-- Nom & Statut -->
          <td class="py-3 px-3">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-xl ${isAdmin ? 'bg-indigo-100 text-indigo-700 font-black' : 'bg-slate-100 text-slate-700 font-bold'} flex items-center justify-center text-[10px]">
                ${isAdmin ? '👑' : '👤'}
              </div>
              <div>
                <div class="font-extrabold text-slate-800 flex items-center gap-1">
                  ${u.username}
                  ${isAdmin ? '<span class="text-[9px] bg-indigo-100 text-indigo-800 px-1 py-0.2 rounded font-black">ADMIN</span>' : ''}
                  ${isBanned ? '<span class="text-[9px] bg-red-100 text-red-800 px-1 py-0.2 rounded font-black">BANNI</span>' : ''}
                </div>
                <div class="text-[10px] text-slate-400">ID: ${u.id.substring(0, 10)}...</div>
              </div>
            </div>
          </td>

          <!-- Antenne & Ville -->
          <td class="py-3 px-3">
            <div class="font-semibold text-slate-700">${u.stationName}</div>
            <div class="text-[10px] text-slate-400 uppercase font-bold">${u.city}</div>
          </td>

          <!-- Trésorerie -->
          <td class="py-3 px-3 font-extrabold text-emerald-600 mono-num">
            ${Number(u.money || 0).toLocaleString('fr-FR')} €
          </td>

          <!-- Effectif & Véhicules -->
          <td class="py-3 px-3 text-slate-600">
            <span class="font-bold text-pc-blue">${u.volunteersCount || 0}</span> secouristes • 
            <span class="font-bold text-slate-700">${u.vehiclesCount || 0}</span> véh.
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
              <!-- +10k € rapide -->
              <button onclick="window.ProtecAdmin.quickAddMoney('${u.id}', 10000)" title="+10 000 €" class="px-2 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition">
                +10k€
              </button>
              <!-- Modifier trésorerie -->
              <button onclick="window.ProtecAdmin.promptEditMoney('${u.id}', ${u.money || 0})" title="Changer Trésorerie" class="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition">
                💶
              </button>
              <!-- Réinitialiser MdP -->
              <button onclick="window.ProtecAdmin.promptResetPassword('${u.id}', '${u.username}')" title="Réinitialiser Mot de passe" class="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition">
                🔑
              </button>
              <!-- Bannir / Débannir -->
              <button onclick="window.ProtecAdmin.toggleBan('${u.id}', ${!isBanned})" title="${isBanned ? 'Débannir' : 'Bannir'}" class="px-2 py-1 rounded-lg text-[10px] font-bold ${isBanned ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} transition">
                ${isBanned ? 'Débannir' : 'Bannir'}
              </button>
              <!-- Rôle Admin -->
              <button onclick="window.ProtecAdmin.toggleAdminRole('${u.id}', '${isAdmin ? 'user' : 'admin'}')" title="Changer Rôle" class="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 transition">
                👑
              </button>
              <!-- Supprimer joueur -->
              <button onclick="window.ProtecAdmin.confirmDeleteUser('${u.id}', '${u.username}')" title="Supprimer joueur" class="p-1 rounded-lg text-red-500 hover:bg-red-50 transition">
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

  async quickAddMoney(userId, amount) {
    const user = this.usersCache.find(u => u.id === userId);
    if (!user) return;
    const newAmount = Number(user.money || 0) + amount;
    await this.updateUser(userId, { money: newAmount }, `+${amount} € crédités à ${user.username}`);
  },

  async promptEditMoney(userId, currentMoney) {
    const user = this.usersCache.find(u => u.id === userId);
    if (!user) return;
    const input = prompt(`Définir la trésorerie de ${user.username} (actuel : ${currentMoney} €) :`, currentMoney);
    if (input !== null && !isNaN(input)) {
      await this.updateUser(userId, { money: Number(input) }, `Trésorerie de ${user.username} fixée à ${input} €`);
    }
  },

  async promptResetPassword(userId, username) {
    const newPwd = prompt(`Nouveau mot de passe pour ${username} (min. 4 car.) :`);
    if (newPwd && newPwd.trim().length >= 4) {
      await this.updateUser(userId, { newPassword: newPwd.trim() }, `Mot de passe de ${username} réinitialisé.`);
    }
  },

  async toggleBan(userId, shouldBan) {
    const user = this.usersCache.find(u => u.id === userId);
    if (!user) return;
    if (confirm(`Confirmez-vous la suspension du compte de ${user.username} ?`)) {
      await this.updateUser(userId, { isBanned: shouldBan }, shouldBan ? `${user.username} a été banni.` : `${user.username} a été réactivé.`);
    }
  },

  async toggleAdminRole(userId, newRole) {
    const user = this.usersCache.find(u => u.id === userId);
    if (!user) return;
    await this.updateUser(userId, { role: newRole }, `Rôle de ${user.username} changé en ${newRole}.`);
  },

  async updateUser(userId, payload, successToast) {
    try {
      const res = await fetch('/api/admin/user/update', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ userId, ...payload })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (window.game) window.game.showToast('Administration', successToast || 'Modifications enregistrées en BDD.', 'green');
        await this.loadAdminData(window.game);
      } else {
        alert(data.error || 'Erreur lors de la modification.');
      }
    } catch (e) {
      alert('Erreur réseau avec le serveur.');
    }
  },

  async confirmDeleteUser(userId, username) {
    if (!confirm(`ATTENTION : Voulez-vous définitivement supprimer le compte de ${username} et toutes ses données de jeu ? Cette action est irréversible.`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/user/delete', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (window.game) window.game.showToast('Joueur Supprimé', `Le compte de ${username} a été purgé de la BDD.`, 'blue');
        await this.loadAdminData(window.game);
      } else {
        alert(data.error || 'Erreur lors de la suppression.');
      }
    } catch (e) {
      alert('Erreur réseau.');
    }
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
      alert('Erreur envoi broadcast.');
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
              <p class="text-xs text-indigo-600 font-bold">Gestion globale de la Base de Données des Directeurs</p>
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
            <div class="text-[9px] font-black uppercase text-slate-400">Parties Cloud BDD</div>
            <div class="text-lg font-black text-slate-800" id="admin-stat-saves">-</div>
          </div>
          <div class="p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-sm">
            <div class="text-[9px] font-black uppercase text-slate-400">Alliances Actives</div>
            <div class="text-lg font-black text-indigo-600" id="admin-stat-alliances">-</div>
          </div>
        </div>

        <!-- Onglets Directeurs / Archives / Déclencheur Missions -->
        <div class="flex items-center gap-2 mb-3 border-b border-slate-200/80 pb-2 flex-shrink-0">
          <button id="admin-tab-players-btn" onclick="window.ProtecAdmin.switchTab('joueurs')" class="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-sm transition">
            👥 Directeurs & Comptes
          </button>
          <button id="admin-tab-archives-btn" onclick="window.ProtecAdmin.switchTab('archives')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5">
            📦 Archives & Remises à Zéro
          </button>
          <button id="admin-tab-missions-btn" onclick="window.ProtecAdmin.switchTab('missions')" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5">
            🚀 Déclencheur de Missions (Tests)
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
                  <th class="py-2.5 px-3">Joueur / ID</th>
                  <th class="py-2.5 px-3">Antenne & Ville</th>
                  <th class="py-2.5 px-3">Trésorerie</th>
                  <th class="py-2.5 px-3">Moyens</th>
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
  }
};
