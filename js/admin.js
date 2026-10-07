/**
 * PROTEC LIVE - PANEL ADMINISTRATEUR (GESTION DE TOUS LES JOUEURS)
 * Permet à l'administrateur de superviser la base de données,
 * modifier les trésoreries, réinitialiser des mots de passe,
 * gérer les bannissements et diffuser des alertes globales.
 */

window.ProtecAdmin = {
  usersCache: [],
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

        <!-- Message Flash Broadcast -->
        <form onsubmit="window.ProtecAdmin.sendGlobalBroadcast(event)" class="mb-4 flex gap-2 flex-shrink-0">
          <input type="text" id="admin-broadcast-input" placeholder="📢 Diffuser une annonce flash à tous les joueurs connectés..." 
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
          <button type="submit" class="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm">
            <span>Diffuser</span>
          </button>
        </form>

        <!-- Recherche & Barre d'outils -->
        <div class="flex items-center justify-between gap-3 mb-3 flex-shrink-0">
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
    `;
    document.body.appendChild(div);
  }
};
