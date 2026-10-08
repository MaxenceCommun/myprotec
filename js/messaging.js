/**
 * PROTEC LIVE - MESSAGERIE MULTIJOUEUR ET LIAISONS OPÉRATIONNELLES
 * 
 * 4 Canaux de communication distincts :
 * 1. National (toute la communauté des directeurs d'antenne de France)
 * 2. Régional (les 18 vraies régions administratives de France avec sélection libre et région d'antenne par défaut)
 * 3. Départemental (directeurs du département d'affectation)
 * 4. Messages Privés (MP) directs 1-à-1 entre deux directeurs d'antenne
 */

window.ProtecMessaging = {
  currentChannel: 'national', // 'national' | 'regional' | 'departemental' | 'mp'
  selectedRegionName: null,
  selectedMpRecipientId: null,

  injectState(game) {
    if (!game.messagesHistory) {
      game.messagesHistory = {
        national: [
          {
            id: 'init-1',
            senderId: 'sys-dir',
            senderName: 'Direction Fédérale FNPC',
            deptCode: '75',
            channel: 'national',
            text: 'Bienvenue sur la fréquence nationale inter-antennes de la Protection Civile.',
            time: '08:00'
          }
        ],
        regional: {}, // Mapping par nom de vraie région de France
        departemental: [],
        mp: {} // recipientId -> [ messages ]
      };
    } else {
      // Assurer la compatibilité si regional était un simple tableau
      if (Array.isArray(game.messagesHistory.regional)) {
        const oldRegional = game.messagesHistory.regional;
        game.messagesHistory.regional = {};
        const myDeptCode = game.stations?.[0]?.departmentCode || game.currentDepartmentCode || game.player?.departmentCode || '75';
        const myRegion = window.ProtecDepartements?.getRegion(myDeptCode) || 'Île-de-France';
        if (oldRegional.length > 0) {
          game.messagesHistory.regional[myRegion] = oldRegional;
        }
      }
    }

    // Déterminer la région active par défaut (celle de l'antenne du joueur)
    const myDeptCode = game.stations?.[0]?.departmentCode || game.currentDepartmentCode || game.player?.departmentCode || '75';
    const myRegion = window.ProtecDepartements?.getRegion(myDeptCode) || 'Île-de-France';
    if (!this.selectedRegionName) {
      this.selectedRegionName = myRegion;
    }

    // Assurer l'existence du canal pour la région active avec un message initial de l'état-major
    if (!game.messagesHistory.regional[this.selectedRegionName] || game.messagesHistory.regional[this.selectedRegionName].length === 0) {
      game.messagesHistory.regional[this.selectedRegionName] = [
        {
          id: `init-reg-${this.selectedRegionName}`,
          senderId: 'sys-dir-reg',
          senderName: `État-Major Régional (${this.selectedRegionName})`,
          deptCode: 'DIRR',
          channel: 'regional',
          regionName: this.selectedRegionName,
          text: `Fréquence opérationnelle de la région ${this.selectedRegionName} active. Veille inter-antennes et coordination zonale de Sécurité Civile.`,
          time: '08:00'
        }
      ];
    }
  },

  setChannel(channelKey, game) {
    this.currentChannel = channelKey;
    this.renderModal(game);
  },

  selectRegion(regionName, game) {
    this.selectedRegionName = regionName;
    this.injectState(game);
    this.renderModal(game);
  },

  selectMpRecipient(recipientId, game) {
    this.selectedMpRecipientId = recipientId;
    this.renderModal(game);
  },

  sendMessage(game) {
    this.injectState(game);
    const input = document.getElementById('messaging-input');
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    input.value = '';

    const deptCode = game.stations?.[0]?.departmentCode || game.currentDepartmentCode || game.player?.departmentCode || '75';
    const myRegion = window.ProtecDepartements?.getRegion(deptCode) || 'Île-de-France';
    const targetRegion = this.selectedRegionName || myRegion;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const msgObj = {
      id: `msg-${Date.now()}`,
      senderId: game.player?.id || 'me',
      senderName: game.player?.name || 'Directeur d’Antenne',
      deptCode: deptCode,
      channel: this.currentChannel,
      text: text,
      time: timeStr
    };

    if (this.currentChannel === 'mp') {
      if (!this.selectedMpRecipientId) {
        game.showToast('Destinataire Requis', 'Veuillez sélectionner un directeur d’antenne pour envoyer un message privé.', 'orange');
        return;
      }
      msgObj.recipientId = this.selectedMpRecipientId;
      if (!game.messagesHistory.mp[this.selectedMpRecipientId]) {
        game.messagesHistory.mp[this.selectedMpRecipientId] = [];
      }
      game.messagesHistory.mp[this.selectedMpRecipientId].push(msgObj);

      // Simulation de réponse courtoise si NPC simulé
      if (this.selectedMpRecipientId.startsWith('npc-')) {
        setTimeout(() => {
          const reply = {
            id: `msg-${Date.now()}`,
            senderId: this.selectedMpRecipientId,
            senderName: 'Directeur Confrère',
            deptCode: deptCode,
            channel: 'mp',
            text: 'Bien reçu votre message confraternel. Nous restons en veille radio sur votre secteur.',
            time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
          };
          game.messagesHistory.mp[this.selectedMpRecipientId].push(reply);
          if (this.currentChannel === 'mp') this.renderModal(game);
        }, 1200);
      }
    } else if (this.currentChannel === 'regional') {
      msgObj.regionName = targetRegion;
      if (!game.messagesHistory.regional[targetRegion]) {
        game.messagesHistory.regional[targetRegion] = [];
      }
      game.messagesHistory.regional[targetRegion].push(msgObj);

      if (window.ProtecSupabase && window.ProtecSupabase.client) {
        window.ProtecSupabase.sendChatMessage({
          channel: 'regional',
          deptCode: deptCode,
          regionName: targetRegion,
          senderName: game.player?.name,
          message: text
        });
      }
    } else {
      if (!game.messagesHistory[this.currentChannel]) {
        game.messagesHistory[this.currentChannel] = [];
      }
      game.messagesHistory[this.currentChannel].push(msgObj);

      // Synchronisation Supabase si disponible
      if (window.ProtecSupabase && window.ProtecSupabase.client) {
        window.ProtecSupabase.sendChatMessage({
          channel: this.currentChannel,
          deptCode: deptCode,
          regionName: myRegion,
          senderName: game.player?.name,
          message: text
        });
      }
    }

    game.saveGame();
    this.renderModal(game);
  },

  renderModal(game) {
    this.injectState(game);
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');
    title.textContent = 'Messagerie & Canaux Inter-Antennes';
    subtitle.textContent = 'Échanges entre directeurs de Protection Civile : National, Régional, Départemental et Messages Privés (MP)';
    icon.setAttribute('data-lucide', 'message-square');

    const myDeptCode = game.stations?.[0]?.departmentCode || game.currentDepartmentCode || game.player?.departmentCode || '75';
    const myRegion = window.ProtecDepartements?.getRegion(myDeptCode) || 'Île-de-France';
    const activeRegion = this.selectedRegionName || myRegion;
    const allRegions = window.ProtecDepartements?.REGIONS || [];

    // Liste des interlocuteurs pour les MP (autres directeurs de la fédération ou alliés)
    const availableRecipients = [
      { id: 'npc-lyon', name: 'Directeur PC Rhône (69)', dept: '69', city: 'Lyon' },
      { id: 'npc-marseille', name: 'Directeur PC Bouches-du-Rhône (13)', dept: '13', city: 'Marseille' },
      { id: 'npc-bordeaux', name: 'Directeur PC Gironde (33)', dept: '33', city: 'Bordeaux' },
      { id: 'npc-lille', name: 'Directeur PC Nord (59)', dept: '59', city: 'Lille' },
      { id: 'npc-toulouse', name: 'Directeur PC Haute-Garonne (31)', dept: '31', city: 'Toulouse' },
      { id: 'npc-strasbourg', name: 'Directeur PC Bas-Rhin (67)', dept: '67', city: 'Strasbourg' },
      { id: 'npc-rennes', name: 'Directeur PC Ille-et-Vilaine (35)', dept: '35', city: 'Rennes' },
      { id: 'npc-nantes', name: 'Directeur PC Loire-Atlantique (44)', dept: '44', city: 'Nantes' }
    ];

    if (!this.selectedMpRecipientId && availableRecipients.length > 0) {
      this.selectedMpRecipientId = availableRecipients[0].id;
    }

    // Récupération des messages selon le canal
    let currentMessages = [];
    if (this.currentChannel === 'mp') {
      currentMessages = (game.messagesHistory.mp && game.messagesHistory.mp[this.selectedMpRecipientId]) || [];
    } else if (this.currentChannel === 'regional') {
      currentMessages = (game.messagesHistory.regional && game.messagesHistory.regional[activeRegion]) || [];
    } else {
      currentMessages = game.messagesHistory[this.currentChannel] || [];
    }

    body.innerHTML = `
      <div class="space-y-4">

        <!-- Onglets des 4 canaux officiels -->
        <div class="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto custom-scrollbar">
          <button onclick="window.ProtecMessaging.setChannel('national', window.game)" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${this.currentChannel === 'national' ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
            <span>🇫🇷</span>
            <span>National</span>
          </button>
          <button onclick="window.ProtecMessaging.setChannel('regional', window.game)" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${this.currentChannel === 'regional' ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
            <span>🗺️</span>
            <span>Régional (${activeRegion})</span>
          </button>
          <button onclick="window.ProtecMessaging.setChannel('departemental', window.game)" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${this.currentChannel === 'departemental' ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
            <span>📍</span>
            <span>Département (${myDeptCode})</span>
          </button>
          <button onclick="window.ProtecMessaging.setChannel('mp', window.game)" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${this.currentChannel === 'mp' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
            <span>🔒</span>
            <span>Messages Privés (MP)</span>
          </button>
        </div>

        <!-- Sous-barre spécifique pour le Canal Régional : Vraies régions de France -->
        ${this.currentChannel === 'regional' ? `
          <div class="p-3 rounded-2xl bg-sky-50/80 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div class="flex items-center gap-2">
              <span class="text-base">🗺️</span>
              <div>
                <span class="font-black text-slate-900 block">Canal Régional Officiel : <strong class="text-pc-blue">${activeRegion}</strong></span>
                <span class="text-[10px] text-slate-500 font-medium">Fréquence zonale de coordination des antennes Protection Civile</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-[11px] font-bold text-slate-600 flex-shrink-0">Changer de région :</label>
              <select onchange="window.ProtecMessaging.selectRegion(this.value, window.game)" class="px-3 py-1.5 rounded-xl bg-white border border-sky-300 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-pc-blue shadow-xs">
                ${allRegions.map(reg => `
                  <option value="${reg}" ${reg === activeRegion ? 'selected' : ''}>
                    ${reg} ${reg === myRegion ? '⭐ (Votre Antenne)' : ''}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        ` : ''}

        <!-- Sous-barre spécifique pour les Messages Privés -->
        ${this.currentChannel === 'mp' ? `
          <div class="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex items-center justify-between gap-3 text-xs">
            <span class="font-bold text-indigo-900 flex items-center gap-1.5">
              <i data-lucide="user" class="w-4 h-4"></i>
              Discuter en privé avec :
            </span>
            <select onchange="window.ProtecMessaging.selectMpRecipient(this.value, window.game)" class="px-3 py-1.5 rounded-xl bg-white border border-indigo-300 font-bold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-400">
              ${availableRecipients.map(r => `
                <option value="${r.id}" ${r.id === this.selectedMpRecipientId ? 'selected' : ''}>
                  ${r.name} (${r.city})
                </option>
              `).join('')}
            </select>
          </div>
        ` : ''}

        <!-- Zone d'affichage des messages -->
        <div id="messaging-history-box" class="h-80 overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          ${currentMessages.length === 0 ? `
            <div class="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-1">
              <i data-lucide="message-circle" class="w-8 h-8 opacity-40"></i>
              <span>Aucun message pour le moment sur ce canal.</span>
            </div>
          ` : currentMessages.map(m => {
            const isMe = m.senderId === (game.player?.id || 'me');
            return `
              <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                <div class="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 px-1">
                  <strong class="${isMe ? 'text-pc-blue' : 'text-slate-700'}">${m.senderName}</strong>
                  ${m.deptCode ? `<span class="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-bold text-[9px]">${m.deptCode}</span>` : ''}
                  ${m.regionName ? `<span class="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-bold text-[9px]">${m.regionName}</span>` : ''}
                  <span>${m.time || ''}</span>
                </div>
                <div class="p-3 rounded-2xl text-xs max-w-md ${isMe ? 'bg-pc-blue text-white rounded-tr-none' : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none shadow-sm'}">
                  ${m.text}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Zone de saisie d'envoi -->
        <div class="flex items-center gap-2 pt-1">
          <input 
            id="messaging-input" 
            type="text" 
            placeholder="${this.currentChannel === 'mp' ? 'Envoyer un message privé direct...' : (this.currentChannel === 'regional' ? `Transmettre sur le canal régional (${activeRegion})...` : 'Transmettre sur la fréquence du canal...')}" 
            onkeydown="if(event.key === 'Enter') window.ProtecMessaging.sendMessage(window.game);"
            class="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pc-blue shadow-sm"
          />
          <button onclick="window.ProtecMessaging.sendMessage(window.game);" class="px-4 py-2.5 rounded-2xl bg-pc-blue hover:bg-pc-blue-light text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="send" class="w-4 h-4"></i>
            <span>Envoyer</span>
          </button>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Auto-scroll vers le bas
    const box = document.getElementById('messaging-history-box');
    if (box) box.scrollTop = box.scrollHeight;
  }
};
