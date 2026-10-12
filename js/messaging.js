/**
 * PROTEC LIVE - MESSAGERIE MULTIJOUEUR ET LIAISONS OPÉRATIONNELLES
 * 
 * 5 Canaux de communication :
 * 1. Convocations & Bénévoles (Interne Antenne : sollicitations, relances, ordres de mission)
 * 2. National (toute la communauté des directeurs d'antenne de France)
 * 3. Régional (les 18 vraies régions administratives de France)
 * 4. Départemental (directeurs du département d'affectation)
 * 5. Messages Privés (MP) directs 1-à-1
 */

window.ProtecMessaging = {
  currentChannel: 'interne', // 'interne' | 'national' | 'regional' | 'departemental' | 'mp'
  selectedRegionName: null,
  selectedMpRecipientId: null,
  filterMissionId: null,

  injectState(game) {
    if (!game.messagesHistory || Array.isArray(game.messagesHistory) || typeof game.messagesHistory !== 'object') {
      const oldArr = Array.isArray(game.messagesHistory) ? game.messagesHistory : [];
      game.messagesHistory = {
        interne: oldArr,
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
        regional: {},
        departemental: [],
        mp: {}
      };
    }

    if (!Array.isArray(game.messagesHistory.interne)) {
      game.messagesHistory.interne = [];
    }
    if (!Array.isArray(game.messagesHistory.national)) {
      game.messagesHistory.national = [];
    }
    if (!Array.isArray(game.messagesHistory.departemental)) {
      game.messagesHistory.departemental = [];
    }
    if (!game.messagesHistory.regional || typeof game.messagesHistory.regional !== 'object' || Array.isArray(game.messagesHistory.regional)) {
      const oldRegional = Array.isArray(game.messagesHistory.regional) ? game.messagesHistory.regional : [];
      game.messagesHistory.regional = {};
      const dept = game.stations?.[0]?.departmentCode || game.currentDepartmentCode || game.player?.departmentCode || '75';
      const reg = window.ProtecDepartements?.getRegion(dept) || 'Île-de-France';
      if (oldRegional.length > 0) {
        game.messagesHistory.regional[reg] = oldRegional;
      }
    }
    if (!game.messagesHistory.mp || typeof game.messagesHistory.mp !== 'object' || Array.isArray(game.messagesHistory.mp)) {
      game.messagesHistory.mp = {};
    }

    if (game.messagesHistory.interne.length === 0) {
      game.messagesHistory.interne.push({
        id: 'msg-int-init',
        type: 'info',
        time: '08:00',
        date: 'Aujourd’hui',
        senderName: 'Pôle Opérationnel & Secours',
        recipientName: 'Tous les Bénévoles',
        text: 'Canal interne des convocations opérationnelles ouvert. Les appels à disponibilité, relances et ordres de mission sont centralisés ici.'
      });
    }

    // Déterminer la région active par défaut (celle de l'antenne du joueur)
    const myDeptCode = game.stations?.[0]?.departmentCode || game.currentDepartmentCode || game.player?.departmentCode || '75';
    const myRegion = window.ProtecDepartements?.getRegion(myDeptCode) || 'Île-de-France';
    if (!this.selectedRegionName) {
      this.selectedRegionName = myRegion;
    }

    // Assurer l'existence du canal pour la région active avec un message initial de l'état-major
    if (!game.messagesHistory.regional[this.selectedRegionName] || !Array.isArray(game.messagesHistory.regional[this.selectedRegionName]) || game.messagesHistory.regional[this.selectedRegionName].length === 0) {
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

  // Enregistrer un événement dans le fil de messagerie interne fictive
  logInternalMessage(game, data) {
    if (!game) game = window.game;
    if (!game) return;
    this.injectState(game);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = game.clock ? `${game.clock.day} ${game.clock.monthsShort?.[game.clock.month] || 'Oct.'}` : 'Aujourd’hui';

    const entry = {
      id: `msg-int-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      time: timeStr,
      date: dateStr,
      type: data.type || 'info', // 'appel_dispo' | 'reponse_dispo' | 'reponse_indispo' | 'convocation' | 'relance' | 'info'
      missionId: data.missionId || null,
      missionTitle: data.missionTitle || null,
      senderName: data.senderName || 'Pôle Opérationnel',
      recipientName: data.recipientName || 'Bénévoles d’antenne',
      text: data.text || '',
      badge: data.badge || null
    };

    game.messagesHistory.interne.unshift(entry);
    if (game.messagesHistory.interne.length > 250) {
      game.messagesHistory.interne.length = 250;
    }

    // Si la modale est actuellement ouverte sur le canal interne, rafraîchir l'affichage
    const histBox = document.getElementById('messaging-internal-history-box');
    if (histBox && this.currentChannel === 'interne') {
      this.renderModal(game);
    }
  },

  // Ouvrir la messagerie filtrée sur un poste précis
  openForMission(missionId, game) {
    if (!game) game = window.game;
    this.currentChannel = 'interne';
    this.filterMissionId = missionId;
    this.renderModal(game);
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

  setFilterMission(missionId, game) {
    this.filterMissionId = missionId || null;
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

    if (this.currentChannel === 'interne') {
      // Consigne ou note de service envoyée par le Directeur d'Antenne aux bénévoles
      this.logInternalMessage(game, {
        type: 'info',
        senderName: `${game.player?.name || 'Directeur d’Antenne'} (Direction)`,
        recipientName: 'Tous les Bénévoles de l’Antenne',
        text: text
      });
      game.showToast('Note Transmise 📢', 'Votre message interne a été diffusé à l’ensemble des secouristes de l’antenne.', 'blue');
      game.saveGame?.();
      this.renderModal(game);
      return;
    }

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

    game.saveGame?.();
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
    title.textContent = 'Messagerie Interne & Liaisons Opérationnelles';
    subtitle.textContent = 'Convocations des bénévoles, relances d’effectifs, ordres de mission et canaux inter-antennes';
    icon.setAttribute('data-lucide', 'message-square');

    const myDeptCode = game.stations?.[0]?.departmentCode || game.currentDepartmentCode || game.player?.departmentCode || '75';
    const myRegion = window.ProtecDepartements?.getRegion(myDeptCode) || 'Île-de-France';
    const activeRegion = this.selectedRegionName || myRegion;
    const allRegions = window.ProtecDepartements?.REGIONS || [];

    // Liste des interlocuteurs pour les MP (vrais joueurs d'abord, puis réseau fédéral)
    const availableRecipients = [];
    const seenIds = new Set();

    // 1. Vrais directeurs d'antenne (autres joueurs réels enregistrés)
    if (Array.isArray(game.allianceStations)) {
      game.allianceStations.forEach(st => {
        if (!st || !st.playerId || st.playerId === game.player?.id || seenIds.has(st.playerId)) return;
        seenIds.add(st.playerId);
        availableRecipients.push({
          id: st.playerId,
          name: `${st.playerName || 'Directeur'} • ${st.name || 'Antenne'}`,
          dept: st.deptCode || 'ADPC',
          city: st.city || 'Partenaire',
          isRealPlayer: true
        });
      });
    }

    // 2. Directeurs départementaux du réseau
    const defaultRecipients = [
      { id: 'npc-lyon', name: 'Directeur PC Rhône (69)', dept: '69', city: 'Lyon' },
      { id: 'npc-marseille', name: 'Directeur PC Bouches-du-Rhône (13)', dept: '13', city: 'Marseille' },
      { id: 'npc-bordeaux', name: 'Directeur PC Gironde (33)', dept: '33', city: 'Bordeaux' },
      { id: 'npc-lille', name: 'Directeur PC Nord (59)', dept: '59', city: 'Lille' },
      { id: 'npc-strasbourg', name: 'Directeur PC Bas-Rhin (67)', dept: '67', city: 'Strasbourg' },
      { id: 'npc-nantes', name: 'Directeur PC Loire-Atlantique (44)', dept: '44', city: 'Nantes' }
    ];
    defaultRecipients.forEach(r => {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        availableRecipients.push(r);
      }
    });

    if (!this.selectedMpRecipientId && availableRecipients.length > 0) {
      this.selectedMpRecipientId = availableRecipients[0].id;
    }

    // Récupération des messages selon le canal
    let currentMessages = [];
    if (this.currentChannel === 'interne') {
      const allInternal = game.messagesHistory.interne || [];
      if (this.filterMissionId) {
        currentMessages = allInternal.filter(m => m.missionId === this.filterMissionId);
      } else {
        currentMessages = allInternal;
      }
    } else if (this.currentChannel === 'mp') {
      currentMessages = (game.messagesHistory.mp && game.messagesHistory.mp[this.selectedMpRecipientId]) || [];
    } else if (this.currentChannel === 'regional') {
      currentMessages = (game.messagesHistory.regional && game.messagesHistory.regional[activeRegion]) || [];
    } else {
      currentMessages = game.messagesHistory[this.currentChannel] || [];
    }

    const filteredMission = this.filterMissionId ? (game.missions || []).find(m => m.id === this.filterMissionId) : null;

    body.innerHTML = `
      <div class="space-y-4">

        <!-- Onglets des 5 canaux officiels -->
        <div class="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto custom-scrollbar">
          <button onclick="window.ProtecMessaging.setChannel('interne', window.game)" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${this.currentChannel === 'interne' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
            <span>📢</span>
            <span>Convocations & Bénévoles (Interne)</span>
            ${(game.messagesHistory.interne || []).length > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[10px] ${this.currentChannel === 'interne' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'} font-extrabold">${(game.messagesHistory.interne || []).length}</span>` : ''}
          </button>
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
          <button onclick="window.ProtecMessaging.setChannel('mp', window.game)" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${this.currentChannel === 'mp' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
            <span>🔒</span>
            <span>Messages Privés (MP)</span>
          </button>
        </div>

        <!-- Sous-barre spécifique pour le Canal INTERNE (Convocations & Bénévoles) -->
        ${this.currentChannel === 'interne' ? `
          <div class="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div class="flex items-center gap-2">
              <span class="text-base">📢</span>
              <div>
                <span class="font-black text-indigo-950 block">Fil Opérationnel Interne des Bénévoles</span>
                <span class="text-[10px] text-indigo-800 font-medium">Historique des appels à dispo, confirmations d'équipes, relances et ordres de mission</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-[11px] font-bold text-slate-600 flex-shrink-0">Filtrer par poste :</label>
              <select onchange="window.ProtecMessaging.setFilterMission(this.value, window.game)" class="px-3 py-1.5 rounded-xl bg-white border border-indigo-300 font-bold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-400 max-w-[200px] truncate">
                <option value="">Tous les postes & sollicitations</option>
                ${(game.missions || []).map(m => `
                  <option value="${m.id}" ${m.id === this.filterMissionId ? 'selected' : ''}>
                    ${m.title} (${(m.registeredVolunteers || []).length}/${m.requiredVolunteers})
                  </option>
                `).join('')}
              </select>
              ${this.filterMissionId ? `
                <button onclick="window.ProtecMessaging.setFilterMission(null, window.game)" class="px-2 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[10px] font-black" title="Voir tout">✕</button>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Sous-barre spécifique pour le Canal Régional -->
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
          <div class="p-3 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-between gap-3 text-xs">
            <span class="font-bold text-slate-800 flex items-center gap-1.5">
              <i data-lucide="user" class="w-4 h-4"></i>
              Discuter en privé avec :
            </span>
            <select onchange="window.ProtecMessaging.selectMpRecipient(this.value, window.game)" class="px-3 py-1.5 rounded-xl bg-white border border-slate-300 font-bold text-xs text-slate-800 focus:ring-2 focus:ring-slate-400">
              ${availableRecipients.map(r => `
                <option value="${r.id}" ${r.id === this.selectedMpRecipientId ? 'selected' : ''}>
                  ${r.name} (${r.city})
                </option>
              `).join('')}
            </select>
          </div>
        ` : ''}

        <!-- Zone d'affichage des messages -->
        <div id="messaging-history-box" class="h-96 overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          ${currentMessages.length === 0 ? `
            <div class="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-1">
              <i data-lucide="message-circle" class="w-8 h-8 opacity-40"></i>
              <span>${this.currentChannel === 'interne' && this.filterMissionId ? 'Aucune notification enregistrée pour ce poste.' : 'Aucun message pour le moment sur ce canal.'}</span>
            </div>
          ` : currentMessages.map(m => {
            // Rendu dédié pour les messages internes
            if (this.currentChannel === 'interne') {
              let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
              let badgeLabel = 'Information Interne';
              let cardBg = 'bg-white border-slate-200';
              let icon = 'ℹ️';

              if (m.type === 'appel_dispo') {
                badgeColor = 'bg-blue-100 text-blue-900 border-blue-200';
                badgeLabel = 'Appel à Disponibilité';
                cardBg = 'bg-blue-50/60 border-blue-200';
                icon = '📱';
              } else if (m.type === 'reponse_dispo') {
                badgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-300';
                badgeLabel = 'Disponibilité Confirmée';
                cardBg = 'bg-emerald-50/60 border-emerald-200';
                icon = '✅';
              } else if (m.type === 'reponse_indispo') {
                badgeColor = 'bg-rose-100 text-rose-900 border-rose-200';
                badgeLabel = 'Indisponible';
                cardBg = 'bg-rose-50/40 border-rose-200';
                icon = '❌';
              } else if (m.type === 'convocation') {
                badgeColor = 'bg-indigo-100 text-indigo-900 border-indigo-300';
                badgeLabel = 'Ordre de Mission & Convocation';
                cardBg = 'bg-indigo-50/70 border-indigo-200 ring-1 ring-indigo-200';
                icon = '📜';
              } else if (m.type === 'relance') {
                badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
                badgeLabel = 'Relance d’Effectif';
                cardBg = 'bg-amber-50/60 border-amber-200';
                icon = '🔔';
              }

              return `
                <div class="p-3.5 rounded-2xl border ${cardBg} shadow-xs space-y-1.5 transition hover:shadow-sm">
                  <div class="flex items-center justify-between text-[11px] gap-2">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-base">${icon}</span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-black border ${badgeColor}">${badgeLabel}</span>
                      ${m.missionTitle ? `
                        <button onclick="window.ProtecMessaging.setFilterMission('${m.missionId}', window.game)" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-800 border border-slate-300 hover:border-pc-blue transition truncate max-w-[200px]">
                          🎯 ${m.missionTitle}
                        </button>
                      ` : ''}
                    </div>
                    <div class="text-[10px] text-slate-400 font-mono font-bold flex-shrink-0">
                      ${m.date ? `${m.date} à ` : ''}${m.time || ''}
                    </div>
                  </div>

                  <div class="flex items-start justify-between gap-3 pt-0.5">
                    <div class="text-xs text-slate-800 font-medium leading-relaxed">
                      ${m.text}
                    </div>
                  </div>

                  <div class="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span>Émetteur : <strong class="text-slate-600">${m.senderName}</strong></span>
                    ${m.recipientName ? `<span>Destinataire : <strong class="text-slate-600">${m.recipientName}</strong></span>` : ''}
                  </div>
                </div>
              `;
            }

            // Rendu canaux multijoueur (national, regional, dept, mp)
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
            placeholder="${this.currentChannel === 'interne' ? 'Diffuser une consigne ou note de service aux bénévoles...' : (this.currentChannel === 'mp' ? 'Envoyer un message privé direct...' : (this.currentChannel === 'regional' ? `Transmettre sur le canal régional (${activeRegion})...` : 'Transmettre sur la fréquence du canal...'))}" 
            onkeydown="if(event.key === 'Enter') window.ProtecMessaging.sendMessage(window.game);"
            class="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pc-blue shadow-sm"
          />
          <button onclick="window.ProtecMessaging.sendMessage(window.game);" class="px-4 py-2.5 rounded-2xl bg-pc-blue hover:bg-pc-blue-light text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="send" class="w-4 h-4"></i>
            <span>${this.currentChannel === 'interne' ? 'Diffuser' : 'Envoyer'}</span>
          </button>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Auto-scroll vers le bas pour les canaux de discussion, ou vers le haut pour le journal interne
    const box = document.getElementById('messaging-history-box');
    if (box) {
      if (this.currentChannel === 'interne') {
        box.scrollTop = 0;
      } else {
        box.scrollTop = box.scrollHeight;
      }
    }
  }
};
