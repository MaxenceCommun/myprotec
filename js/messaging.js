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
  currentChannel: 'interne', // 'interne' | 'institutions' | 'national' | 'regional' | 'departemental' | 'mp'
  selectedRegionName: null,
  selectedMpRecipientId: null,
  filterMissionId: null,
  currentInstitutionFilter: 'all',
  isRecipientTyping: false,

  DEFAULT_MP_RECIPIENTS: [
    {
      id: 'npc-luneville',
      name: 'Directeur Julien Bertin',
      stationName: 'Antenne de Lunéville',
      dept: '54',
      city: 'Lunéville',
      role: 'Directeur Opérationnel',
      welcomeMsg: 'Salut confrère ! Belle progression sur ton antenne. Si tu as besoin d’un coup de main en soutien logistique ou d’un VPSP en double pour une grosse garde de week-end, fais-moi signe sur la radio !'
    },
    {
      id: 'npc-nancy',
      name: 'Directeur Thomas Vasseur',
      stationName: 'Antenne de Nancy',
      dept: '54',
      city: 'Nancy',
      role: 'Directeur d’Antenne',
      welcomeMsg: 'Bonjour camarade ! Je vois que tes équipes tournent bien. Pense à renouveler tes habilitations VPSP et tes DSA si tu prépares des gros DPS avec la préfecture. Amitiés secouristes !'
    },
    {
      id: 'npc-paris',
      name: 'Directrice Sophie Martin',
      stationName: 'Antenne de Paris Centre',
      dept: '75',
      city: 'Paris',
      role: 'Directrice Territoriale',
      welcomeMsg: 'Bien reçu ton indicatif sur le réseau fédéral. La coordination en Île-de-France est intense en ce moment, contente de t’avoir en soutien opérationnel sur la zone !'
    },
    {
      id: 'npc-lyon',
      name: 'Directeur Maxime Roux',
      stationName: 'Antenne du Rhône',
      dept: '69',
      city: 'Lyon',
      role: 'Directeur d’Antenne',
      welcomeMsg: 'Salut collègue ! On prépare un grand rassemblement régional le mois prochain. Tiens-moi au courant si tes secouristes sont disponibles pour du renfort zonal.'
    },
    {
      id: 'npc-marseille',
      name: 'Directeur Paul Lambert',
      stationName: 'Antenne Bouches-du-Rhône',
      dept: '13',
      city: 'Marseille',
      role: 'Chef de Dispositif',
      welcomeMsg: 'Salut à toute ton équipe ! C’est toujours un plaisir de voir le réseau grandir. Bonne chance pour tes prochaines gardes SAMU.'
    },
    {
      id: 'npc-bordeaux',
      name: 'Directeur Alexandre Mercier',
      stationName: 'Antenne Gironde',
      dept: '33',
      city: 'Bordeaux',
      role: 'Directeur d’Antenne',
      welcomeMsg: 'Bonjour confrère ! La saison des festivals approche à grands pas, le réseau d’entraide entre antennes va tourner à plein régime !'
    },
    {
      id: 'npc-lille',
      name: 'Directrice Camille Leroy',
      stationName: 'Antenne Nord',
      dept: '59',
      city: 'Lille',
      role: 'Directrice Adjointe',
      welcomeMsg: 'Bienvenue sur la liaison directe ! Ici dans le Nord, nous restons à l’écoute pour toute entraide matérielle ou logistique.'
    },
    {
      id: 'npc-strasbourg',
      name: 'Directeur Lucas Schmitt',
      stationName: 'Antenne Bas-Rhin',
      dept: '67',
      city: 'Strasbourg',
      role: 'Directeur d’Antenne',
      welcomeMsg: 'Bonjour ! Bravo pour la gestion de tes moyens. N’hésite pas si tu as des questions sur le protocole des postes de secours transfrontaliers.'
    },
    {
      id: 'npc-nantes',
      name: 'Directrice Élodie Moreau',
      stationName: 'Antenne Loire-Atlantique',
      dept: '44',
      city: 'Nantes',
      role: 'Directrice d’Antenne',
      welcomeMsg: 'Bonjour cher confrère ! Bon courage pour le déploiement de tes équipages. Nous veillons sur la fréquence côtière et fluviale.'
    }
  ],

  getAvailableRecipients(game) {
    const list = [];
    const seenIds = new Set();
    const myPlayerId = game?.player?.id || 'me';

    // 1. Directeurs réels de l'alliance (stations enregistrées dans Supabase)
    if (Array.isArray(game?.allianceStations)) {
      game.allianceStations.forEach(st => {
        if (!st || !st.playerId || st.playerId === myPlayerId || seenIds.has(st.playerId)) return;
        seenIds.add(st.playerId);
        list.push({
          id: st.playerId,
          name: st.playerName || `Directeur ${st.city || 'Confrère'}`,
          stationName: st.name || `Antenne Protection Civile ${st.deptCode || ''}`,
          dept: st.deptCode || 'ADPC',
          city: st.city || 'Partenaire',
          role: 'Directeur d’Antenne Alliée',
          isRealPlayer: true,
          welcomeMsg: `Bonjour cher confrère ! Antenne ${st.name || 'alliée'} à l’écoute. Ravi d’échanger en direct avec vous.`
        });
      });
    }

    // 2. Directeurs du réseau fédéral (confrères départementaux)
    this.DEFAULT_MP_RECIPIENTS.forEach(r => {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        list.push(r);
      }
    });

    return list;
  },

  injectState(game) {
    if (!game.messagesHistory || Array.isArray(game.messagesHistory) || typeof game.messagesHistory !== 'object') {
      const oldArr = Array.isArray(game.messagesHistory) ? game.messagesHistory : [];
      game.messagesHistory = {
        interne: oldArr,
        institutions: [],
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
    if (!Array.isArray(game.messagesHistory.institutions)) {
      game.messagesHistory.institutions = [];
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

    // Initialisation proactive des conversations MP pour chaque interlocuteur
    const recipients = this.getAvailableRecipients(game);
    if (!this.selectedMpRecipientId && recipients.length > 0) {
      this.selectedMpRecipientId = recipients[0].id;
    }

    recipients.forEach(r => {
      if (!game.messagesHistory.mp[r.id] || !Array.isArray(game.messagesHistory.mp[r.id]) || game.messagesHistory.mp[r.id].length === 0) {
        game.messagesHistory.mp[r.id] = [
          {
            id: `init-mp-${r.id}`,
            senderId: r.id,
            senderName: r.name,
            deptCode: r.dept,
            channel: 'mp',
            text: r.welcomeMsg || 'Bonjour confrère ! Bienvenue sur la fréquence de messagerie privée.',
            time: '08:30'
          }
        ];
      }
    });

    if (game.messagesHistory.institutions.length === 0) {
      game.messagesHistory.institutions.push({
        id: 'msg-inst-init-1',
        channel: 'institutions',
        institution: 'prefecture',
        senderName: 'Préfecture (SIDPC)',
        senderRole: 'Bureau de la Sécurité Civile',
        sentiment: 'positif',
        badge: 'Agrément Opérationnel',
        subject: 'Maintien de l’Agrément National de Sécurité Civile',
        text: 'Monsieur le Directeur, les services préfectoraux confirment la validité de l’agrément de votre antenne. Nous comptons sur votre réactivité pour les futurs dispositifs et réquisitions.',
        date: 'Aujourd’hui',
        time: '08:30',
        read: true
      });
      game.messagesHistory.institutions.push({
        id: 'msg-inst-init-2',
        channel: 'institutions',
        institution: 'samu',
        senderName: 'SAMU 15 • Régulation Médicale',
        senderRole: 'Cadre de Santé Régulateur',
        sentiment: 'positif',
        badge: 'Liaison Sanitaire',
        subject: 'Canal de coordination ouvert',
        text: 'Le Centre 15 accuse réception de votre mise en service opérationnelle. Vos équipages et vecteurs sanitaires sont intégrés à la veille pour les renforts urgents.',
        date: 'Aujourd’hui',
        time: '09:15',
        read: true
      });
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

    // Émission du son notif.mp3 pour les messages des bénévoles
    if (window.ProtecAudio && typeof window.ProtecAudio.playVolunteerMessageSound === 'function') {
      window.ProtecAudio.playVolunteerMessageSound();
    }
  },

  // Ouvrir la messagerie filtrée sur un poste précis
  openForMission(missionId, game) {
    if (!game) game = window.game;
    this.currentChannel = 'interne';
    this.filterMissionId = missionId;
    this.renderModal(game);
  },

  // Ouvrir directement la messagerie sur les partenaires & institutions
  openInstitutionsChannel(game) {
    if (!game) game = window.game;
    this.currentChannel = 'institutions';
    if (game?.openModule) {
      game.openModule('tchat');
    } else {
      this.renderModal(game);
    }
  },

  setInstitutionFilter(filterKey, game) {
    this.currentInstitutionFilter = filterKey || 'all';
    this.renderModal(game);
  },

  // Enregistrer un retour institutionnel ou courrier officiel d'un partenaire
  logInstitutionalFeedback(gameOrData, maybeData = null) {
    let game = window.game;
    let data = maybeData;
    if (gameOrData && typeof gameOrData === 'object' && !gameOrData.messagesHistory && !gameOrData.stations && !gameOrData.resources) {
      data = gameOrData;
      game = window.game;
    } else if (gameOrData && typeof gameOrData === 'object') {
      game = gameOrData;
      data = maybeData || {};
    } else {
      data = maybeData || {};
    }
    if (!game) game = window.game;
    if (!game || !data) return;
    this.injectState(game);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = game.clock ? `${game.clock.day} ${game.clock.monthsShort?.[game.clock.month] || 'Oct.'}` : 'Aujourd’hui';

    const entry = {
      id: `msg-inst-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      time: timeStr,
      date: dateStr,
      channel: 'institutions',
      institution: data.institution || 'organisateur', // 'samu' | 'sdis' | 'sncf' | 'commune' | 'organisateur' | 'prefecture'
      senderName: data.senderName || 'Partenaire Institutionnel',
      senderRole: data.senderRole || 'Direction',
      sentiment: data.sentiment || 'positif', // 'positif' | 'negatif'
      badge: data.badge || (data.sentiment === 'negatif' ? 'Rappel à l’ordre' : 'Félicitations'),
      subject: data.subject || 'Retour d’expérience mission',
      text: data.text || '',
      missionTitle: data.missionTitle || null,
      missionId: data.missionId || null,
      read: false
    };

    game.messagesHistory.institutions.unshift(entry);
    if (game.messagesHistory.institutions.length > 100) {
      game.messagesHistory.institutions.length = 100;
    }

    // Alerte toast visuelle immédiate
    const toastTitle = `${entry.badge} • ${entry.senderName}`;
    const toastColor = entry.sentiment === 'negatif' ? 'red' : 'green';
    if (typeof game.showToast === 'function') {
      const summaryText = entry.subject ? `${entry.subject} : ${entry.text.slice(0, 80)}...` : entry.text.slice(0, 100);
      game.showToast(toastTitle, summaryText, toastColor);
    }

    // Signal sonore
    if (window.ProtecAudio && typeof window.ProtecAudio.playVolunteerMessageSound === 'function') {
      window.ProtecAudio.playVolunteerMessageSound();
    }

    // Mise à jour du badge dock
    const badgeSubmenu = document.getElementById('badge-submenu-tchat');
    if (badgeSubmenu) {
      badgeSubmenu.textContent = (game.messagesHistory.institutions.length || 0);
      badgeSubmenu.classList.remove('hidden');
    }

    // Rafraîchir la modale si actuellement ouverte sur ce canal
    const histBox = document.getElementById('messaging-history-box');
    if (histBox && this.currentChannel === 'institutions') {
      this.renderModal(game);
    }

    if (typeof game.saveGame === 'function') {
      game.saveGame();
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
      senderDiscord: game.player?.discord || (window.ProtecAuth?.currentUser?.discord) || null,
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
      const recipients = this.getAvailableRecipients(game);
      const recipient = recipients.find(r => r.id === this.selectedMpRecipientId) || { name: 'Directeur Confrère', dept: deptCode, city: 'France' };
      msgObj.recipientId = this.selectedMpRecipientId;
      if (!game.messagesHistory.mp[this.selectedMpRecipientId]) {
        game.messagesHistory.mp[this.selectedMpRecipientId] = [];
      }
      game.messagesHistory.mp[this.selectedMpRecipientId].push(msgObj);

      const recipientId = this.selectedMpRecipientId;
      const playerTextLower = text.toLowerCase();

      // Déterminer une réponse contextuelle réaliste de la Protection Civile
      let replyText = '';
      if (playerTextLower.includes('renfort') || playerTextLower.includes('vpsp') || playerTextLower.includes('vtu') || playerTextLower.includes('véhicule') || playerTextLower.includes('vehicule') || playerTextLower.includes('ambulance') || playerTextLower.includes('matériel') || playerTextLower.includes('materiel')) {
        const replies = [
          `Bien reçu pour les moyens ! Mes équipages sont actuellement sur le secteur, mais dès qu'un VPSP est libéré à la base, je pourrai te le détacher si ton dispositif est sous tension.`,
          `Message bien noté cher confrère ! Côté flotte, nous avons un VPSP et un VTU en réserve opérationnelle ce week-end. Fais-moi signe si tu as besoin d'un départ en renfort.`,
          `C'est bien noté pour les véhicules. Pense aussi à passer une demande formelle dans l'onglet Alliance si tu as besoin que d'autres antennes se joignent à l'effort !`
        ];
        replyText = replies[Math.floor(Math.random() * replies.length)];
      } else if (playerTextLower.includes('secouriste') || playerTextLower.includes('bénévole') || playerTextLower.includes('benevole') || playerTextLower.includes('effectif') || playerTextLower.includes('formation') || playerTextLower.includes('pse') || playerTextLower.includes('recrutement')) {
        const replies = [
          `Exactement ! La gestion des effectifs est primordiale. En ce moment, nous organisons une formation interne PSE2 pour gonfler les rangs de nos équipages. Bon courage pour tes plannings !`,
          `C'est une bonne démarche. Pour motiver les secouristes, rien de tel que de les envoyer sur des gardes SAMU/SDIS le week-end, ils adorent le terrain.`,
          `Bien reçu ! De notre côté, la campagne de recrutement a bien fonctionné ce mois-ci. Si tes bénévoles veulent passer des qualifs spécifiques, on peut mutualiser les sessions.`
        ];
        replyText = replies[Math.floor(Math.random() * replies.length)];
      } else if (playerTextLower.includes('argent') || playerTextLower.includes('euro') || playerTextLower.includes('finance') || playerTextLower.includes('budget') || playerTextLower.includes('subvention') || playerTextLower.includes('trésorerie') || playerTextLower.includes('tresorerie')) {
        const replies = [
          `Côté finances, le nerf de la guerre reste les conventions de DPS et les subventions municipales. Dès que la trésorerie le permet, investis dans du bon matériel de bilan, c'est vite rentabilisé !`,
          `Bien d'accord avec toi. Nous venons de renouveler notre convention avec le SDIS, ça apporte une stabilité financière appréciable pour l'antenne.`
        ];
        replyText = replies[Math.floor(Math.random() * replies.length)];
      } else if (playerTextLower.includes('bonjour') || playerTextLower.includes('salut') || playerTextLower.includes('hello') || playerTextLower.includes('ça va') || playerTextLower.includes('ca va') || playerTextLower.includes('comment')) {
        const replies = [
          `Salut cher confrère ! Tout va pour le mieux par chez nous, l'antenne tourne à plein régime et les secouristes sont motivés. Et de ton côté, comment se passe la prise en main de l'antenne ?`,
          `Bonjour ! Très heureux d'échanger avec toi. La météo est clémente aujourd'hui, les interventions sont calmes mais on reste vigilants sur la radio !`,
          `Salut camarade ! Tout roule, merci. N'hésite pas si tu as la moindre question sur la gestion opérationnelle des équipes.`
        ];
        replyText = replies[Math.floor(Math.random() * replies.length)];
      } else if (playerTextLower.includes('merci') || playerTextLower.includes('super') || playerTextLower.includes('top') || playerTextLower.includes('d\'accord') || playerTextLower.includes('daccord') || playerTextLower.includes('ok')) {
        const replies = [
          `Avec grand plaisir mon cher confrère ! La solidarité entre antennes de la Protection Civile, c'est notre plus grande force. À très vite sur les ondes !`,
          `À ton service ! Prends bien soin de tes équipages et bonne continuation pour la suite de tes missions.`
        ];
        replyText = replies[Math.floor(Math.random() * replies.length)];
      } else {
        const replies = [
          `Message bien reçu cher confrère ! C'est parfaitement noté de mon côté. Nous restons en veille radio permanente sur la zone. Fais bon usage de tes moyens et transmets le bonjour à tes équipages !`,
          `Bien reçu ta transmission ! On garde le contact sur ce canal privé. Bon courage pour les prochaines interventions sur ton secteur !`,
          `Affirmatif, transmission 5/5 reçue. N'hésite pas si une urgence survient ou si tu as besoin d'un appui technique sur le terrain.`
        ];
        replyText = replies[Math.floor(Math.random() * replies.length)];
      }

      // Simulation visuelle "Le directeur est en train d'écrire..."
      this.isRecipientTyping = true;
      if (this.currentChannel === 'mp') this.renderModal(game);

      setTimeout(() => {
        this.isRecipientTyping = false;
        const now2 = new Date();
        const timeStr2 = `${String(now2.getHours()).padStart(2, '0')}:${String(now2.getMinutes()).padStart(2, '0')}`;
        const reply = {
          id: `msg-${Date.now()}`,
          senderId: recipientId,
          senderName: recipient.name,
          deptCode: recipient.dept,
          channel: 'mp',
          text: replyText,
          time: timeStr2
        };
        if (!game.messagesHistory.mp[recipientId]) {
          game.messagesHistory.mp[recipientId] = [];
        }
        game.messagesHistory.mp[recipientId].push(reply);

        if (window.ProtecAudio && typeof window.ProtecAudio.playVolunteerMessageSound === 'function') {
          window.ProtecAudio.playVolunteerMessageSound();
        }
        if (typeof game.saveGame === 'function') game.saveGame();

        if (this.currentChannel === 'mp' && this.selectedMpRecipientId === recipientId) {
          this.renderModal(game);
        } else {
          game.showToast?.('Nouveau Message Privé 🔒', `${recipient.name} vous a répondu.`, 'blue');
        }
      }, 900 + Math.random() * 500);
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

  parseRenfortMessage(text) {
    if (!text || typeof text !== 'string') return null;
    if (!text.includes('DEMANDE DE RENFORT')) return null;

    const zoneMatch = text.match(/DEMANDE DE RENFORT\s+([A-ZÀ-ÿ]+)/i);
    const zoneLabel = zoneMatch ? zoneMatch[1].trim() : 'DÉPARTEMENTALE';

    const unitMatch = text.match(/Besoin urgent\s*:\s*(.*?)\s+pour\s*[«"“]/i);
    const unitRequested = unitMatch ? unitMatch[1].trim() : 'Effectifs & Matériel';

    const titleMatch = text.match(/[«"“](.*?)[»"”]/i);
    let missionTitle = titleMatch ? titleMatch[1].trim() : 'Mission opérationnelle';
    missionTitle = missionTitle.replace(/^\[(ALERTE ACTIVE|PRE-ALERTE|CRITIQUE|URGENCE)\]\s*/i, '');

    const indemnMatch = text.match(/Indemnité proposée\s*:\s*\+?(\d+)/i);
    const indemnite = indemnMatch ? indemnMatch[1] : '200';

    return {
      zoneLabel,
      unitRequested,
      missionTitle,
      indemnite
    };
  },

  renderRenfortCard(m, isMe, game) {
    const parsed = this.parseRenfortMessage(m.text) || {};
    const zoneLabel = (m.zoneLabel || parsed.zoneLabel || 'DÉPARTEMENTALE').toUpperCase();
    const unitRequested = m.unitRequested || parsed.unitRequested || '5 Secouriste(s) + 1 Ambulance VPSP';
    let missionTitle = m.missionTitle || parsed.missionTitle || 'Dispositif de secours';
    missionTitle = missionTitle.replace(/^\[(ALERTE ACTIVE|PRE-ALERTE|CRITIQUE|URGENCE)\]\s*/i, '');
    const indemnite = m.indemnite || parsed.indemnite || 200;
    const missionId = m.missionId;
    const hasMission = missionId && (game.missions || []).some(mis => mis.id === missionId);

    // Décomposer unitRequested pour un affichage visuel distinct
    const volsMatch = unitRequested.match(/(\d+)\s*(?:secouriste|bénévole)/i);
    const vehsMatch = unitRequested.match(/(\d+\s*(?:Ambulance|VPSP|VTU|VL|VLHR|Véhicule)[^,]*)/i);
    const volsStr = volsMatch ? `${volsMatch[1]} Secouriste(s) requis` : (m.requestedVolunteersCount ? `${m.requestedVolunteersCount} Secouriste(s)` : null);
    const vehsStr = vehsMatch ? vehsMatch[1] : (Array.isArray(m.requestedVehicles) && m.requestedVehicles.length > 0 ? m.requestedVehicles.join(', ') : null);

    return `
      <div class="rounded-2xl max-w-lg w-full overflow-hidden border border-amber-300/90 bg-gradient-to-br from-amber-500/10 via-white to-orange-500/10 shadow-md ${isMe ? 'rounded-tr-none ring-2 ring-pc-orange/30' : 'rounded-tl-none ring-1 ring-amber-300'} text-left transition hover:shadow-lg">
        <!-- Bandeau d'en-tête dynamique -->
        <div class="px-4 py-2.5 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white flex items-center justify-between gap-2 shadow-xs">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
            <span class="font-black text-xs uppercase tracking-wider">📢 Appel à Renfort ${zoneLabel}</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full bg-black/20 text-white font-extrabold text-[10px] border border-white/20">
            +${indemnite} € d’indemnité
          </span>
        </div>

        <!-- Corps de la carte -->
        <div class="p-4 space-y-3">
          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Dispositif & Intervention</span>
            <h4 class="text-xs sm:text-sm font-black text-slate-900 leading-snug flex items-center gap-1.5 mt-0.5">
              <span>🚨</span>
              <span>${missionTitle}</span>
            </h4>
          </div>

          <!-- Puces visuelles des besoins -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div class="p-2.5 rounded-xl bg-orange-50/90 border border-orange-200 flex items-center gap-2.5 shadow-2xs">
              <div class="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                👥
              </div>
              <div class="min-w-0">
                <span class="text-[9px] font-bold text-orange-950 uppercase tracking-tight block">Moyens Humains</span>
                <span class="text-xs font-black text-orange-900 truncate block">${volsStr || unitRequested}</span>
              </div>
            </div>

            <div class="p-2.5 rounded-xl bg-blue-50/90 border border-blue-200 flex items-center gap-2.5 shadow-2xs">
              <div class="w-8 h-8 rounded-lg bg-pc-blue text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                🚑
              </div>
              <div class="min-w-0">
                <span class="text-[9px] font-bold text-pc-blue-dark uppercase tracking-tight block">Vecteurs & Flotte</span>
                <span class="text-xs font-black text-pc-blue truncate block">${vehsStr || '1 Ambulance VPSP'}</span>
              </div>
            </div>
          </div>

          <!-- Pied de carte opérationnelle -->
          <div class="pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div class="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <span>📍 Émis par :</span>
              <strong class="text-slate-800">${m.senderName} (${m.deptCode || '75'})</strong>
            </div>

            ${hasMission ? `
              <button onclick="window.game.openMissionDetails('${missionId}')" class="px-3 py-1.5 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white font-extrabold text-[11px] shadow-sm transition flex items-center gap-1 cursor-pointer">
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                <span>Consulter le Dispositif</span>
              </button>
            ` : (isMe ? `
              <span class="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200">
                ✓ En cours de diffusion sur le réseau
              </span>
            ` : `
              <button onclick="window.game.openModule('alliance')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pc-orange to-amber-600 hover:brightness-110 text-white font-extrabold text-[11px] shadow-sm transition flex items-center gap-1 cursor-pointer">
                <i data-lucide="handshake" class="w-3.5 h-3.5"></i>
                <span>Détacher des Renforts</span>
              </button>
            `)}
          </div>
        </div>
      </div>
    `;
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

    // Liste des directeurs disponibles pour les MP
    const availableRecipients = this.getAvailableRecipients(game);

    if (!this.selectedMpRecipientId && availableRecipients.length > 0) {
      this.selectedMpRecipientId = availableRecipients[0].id;
    }

    const currentRecipient = availableRecipients.find(r => r.id === this.selectedMpRecipientId) || availableRecipients[0];

    // Récupération des messages selon le canal
    let currentMessages = [];
    if (this.currentChannel === 'interne') {
      const allInternal = game.messagesHistory.interne || [];
      if (this.filterMissionId) {
        currentMessages = allInternal.filter(m => m.missionId === this.filterMissionId);
      } else {
        currentMessages = allInternal;
      }
    } else if (this.currentChannel === 'institutions') {
      const allInst = game.messagesHistory.institutions || [];
      if (this.currentInstitutionFilter && this.currentInstitutionFilter !== 'all') {
        currentMessages = allInst.filter(m => m.institution === this.currentInstitutionFilter);
      } else {
        currentMessages = allInst;
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

        <!-- Onglets des 6 canaux officiels -->
        <div class="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto custom-scrollbar">
          <button onclick="window.ProtecMessaging.setChannel('interne', window.game)" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${this.currentChannel === 'interne' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
            <span>📢</span>
            <span>Convocations & Bénévoles (Interne)</span>
            ${(game.messagesHistory.interne || []).length > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[10px] ${this.currentChannel === 'interne' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'} font-extrabold">${(game.messagesHistory.interne || []).length}</span>` : ''}
          </button>
          <button onclick="window.ProtecMessaging.setChannel('institutions', window.game)" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${this.currentChannel === 'institutions' ? 'bg-pc-blue text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
            <span>🏛️</span>
            <span>Partenaires & Institutions</span>
            ${(game.messagesHistory.institutions || []).length > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[10px] ${this.currentChannel === 'institutions' ? 'bg-white/20 text-white' : 'bg-blue-100 text-pc-blue'} font-extrabold">${(game.messagesHistory.institutions || []).length}</span>` : ''}
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

        <!-- Sous-barre spécifique pour les Partenaires & Institutions -->
        ${this.currentChannel === 'institutions' ? `
          <div class="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div class="flex items-center gap-2">
              <span class="text-base">🏛️</span>
              <div>
                <span class="font-black text-slate-900 block">Courriers & Retours Officiels des Partenaires</span>
                <span class="text-[10px] text-slate-500 font-medium">Évaluations et notes reçues : SAMU 15, SDIS 18, SNCF, Mairies et Organisateurs</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-[11px] font-bold text-slate-600 flex-shrink-0">Filtrer par :</label>
              <select onchange="window.ProtecMessaging.setInstitutionFilter(this.value, window.game)" class="px-3 py-1.5 rounded-xl bg-white border border-blue-300 font-bold text-xs text-slate-800 focus:ring-2 focus:ring-pc-blue shadow-xs">
                <option value="all" ${this.currentInstitutionFilter === 'all' ? 'selected' : ''}>Tous les partenaires</option>
                <option value="samu" ${this.currentInstitutionFilter === 'samu' ? 'selected' : ''}>🚑 SAMU 15</option>
                <option value="sdis" ${this.currentInstitutionFilter === 'sdis' ? 'selected' : ''}>🚒 SDIS 18 (Pompiers)</option>
                <option value="sncf" ${this.currentInstitutionFilter === 'sncf' ? 'selected' : ''}>🚆 SNCF Réseau & Gares</option>
                <option value="commune" ${this.currentInstitutionFilter === 'commune' ? 'selected' : ''}>🏛️ Mairies & Collectivités</option>
                <option value="organisateur" ${this.currentInstitutionFilter === 'organisateur' ? 'selected' : ''}>🎪 Organisateurs de DPS</option>
                <option value="prefecture" ${this.currentInstitutionFilter === 'prefecture' ? 'selected' : ''}>⚖️ Préfecture (SIDPC)</option>
              </select>
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
          <div class="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border border-slate-700/60">
            <div class="flex items-center gap-3 min-w-0">
              <div class="relative flex-shrink-0">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pc-blue to-pc-blue-light text-white flex items-center justify-center font-black text-xs shadow-sm border border-white/20">
                  ${currentRecipient ? currentRecipient.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('') : 'DIR'}
                </div>
                <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" title="En veille opérationnelle"></span>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="font-black text-white text-xs truncate">${currentRecipient ? currentRecipient.name : 'Directeur Confrère'}</h4>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-white/15 text-slate-200 border border-white/10">
                    Dept ${currentRecipient ? currentRecipient.dept : '54'}
                  </span>
                </div>
                <span class="text-[10px] text-emerald-400 font-semibold block truncate mt-0.5">
                  🟢 En veille radio • ${currentRecipient ? currentRecipient.stationName || currentRecipient.city : 'France'}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
              <label class="text-[11px] font-bold text-slate-300">Changer d’interlocuteur :</label>
              <select onchange="window.ProtecMessaging.selectMpRecipient(this.value, window.game)" class="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-600 font-bold text-xs text-white focus:ring-2 focus:ring-pc-blue shadow-xs">
                ${availableRecipients.map(r => `
                  <option value="${r.id}" ${r.id === this.selectedMpRecipientId ? 'selected' : ''}>
                    ${r.name} (${r.city})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        ` : ''}

        <!-- Zone d'affichage des messages -->
        <div id="messaging-history-box" class="h-96 overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          ${currentMessages.length === 0 ? `
            <div class="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-1">
              <i data-lucide="message-circle" class="w-8 h-8 opacity-40"></i>
              <span>${this.currentChannel === 'interne' && this.filterMissionId ? 'Aucune notification enregistrée pour ce poste.' : (this.currentChannel === 'institutions' ? 'Aucun courrier ou retour pour le moment dans cette catégorie.' : 'Aucun message pour le moment sur ce canal.')}</span>
            </div>
          ` : currentMessages.map(m => {
            // Rendu dédié pour les partenaires & institutions
            if (this.currentChannel === 'institutions') {
              const isNeg = m.sentiment === 'negatif';
              const instIcons = {
                samu: '🚑',
                sdis: '🚒',
                sncf: '🚆',
                commune: '🏛️',
                organisateur: '🎪',
                prefecture: '⚖️'
              };
              const instIcon = instIcons[m.institution] || '🏛️';
              const badgeBg = isNeg ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300';
              const cardBorder = isNeg ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-white';

              return `
                <div class="p-4 rounded-2xl border ${cardBorder} shadow-xs space-y-2.5 transition hover:shadow-sm">
                  <div class="flex items-start justify-between gap-3 flex-wrap">
                    <div class="flex items-center gap-2.5">
                      <span class="text-xl p-2 rounded-xl bg-slate-100 shadow-2xs">${instIcon}</span>
                      <div>
                        <div class="flex items-center gap-2 flex-wrap">
                          <strong class="text-xs font-black text-slate-900">${m.senderName}</strong>
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-black border ${badgeBg}">
                            ${isNeg ? '⚠️ ' : '✓ '}${m.badge || (isNeg ? 'Rappel à l’ordre' : 'Félicitations')}
                          </span>
                        </div>
                        <span class="text-[10px] text-slate-500 font-semibold block mt-0.5">${m.senderRole || 'Direction'}</span>
                      </div>
                    </div>
                    <div class="text-[10px] text-slate-400 font-mono font-bold flex-shrink-0">
                      ${m.date ? `${m.date} à ` : ''}${m.time || ''}
                    </div>
                  </div>

                  <div class="pt-1.5 border-t border-slate-100">
                    ${m.subject ? `<h6 class="text-xs font-extrabold text-slate-900 mb-1">${m.subject}</h6>` : ''}
                    <p class="text-xs text-slate-700 leading-relaxed font-normal">${m.text}</p>
                  </div>

                  ${m.missionTitle ? `
                    <div class="text-[10px] text-slate-500 pt-1 flex items-center gap-1.5 border-t border-slate-100/60">
                      <span class="font-bold">Mission concernée :</span>
                      <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold truncate max-w-[280px]">
                        🎯 ${m.missionTitle}
                      </span>
                    </div>
                  ` : ''}
                </div>
              `;
            }

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
            const discordTag = m.senderDiscord?.username || m.discord?.username || (isMe && (game.player?.discord?.username || window.ProtecAuth?.currentUser?.discord?.username));
            const isRenfort = m.type === 'renfort_request' || (m.text && typeof m.text === 'string' && m.text.includes('DEMANDE DE RENFORT'));

            if (isRenfort) {
              return `
                <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'} my-1 w-full">
                  <div class="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                    <strong class="${isMe ? 'text-pc-orange' : 'text-slate-700'}">${m.senderName}</strong>
                    ${m.deptCode ? `<span class="px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 font-bold text-[9px]">Dép. ${m.deptCode}</span>` : ''}
                    ${m.regionName ? `<span class="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-bold text-[9px]">${m.regionName}</span>` : ''}
                    <span>${m.time || ''}</span>
                  </div>
                  ${this.renderRenfortCard(m, isMe, game)}
                </div>
              `;
            }

            return `
              <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                <div class="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 px-1">
                  <strong class="${isMe ? 'text-pc-blue' : 'text-slate-700'}">${m.senderName}</strong>
                  ${discordTag ? `
                    <span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20" title="Discord: @${discordTag}">
                      <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                      @${discordTag}
                    </span>
                  ` : ''}
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
          ${(this.currentChannel === 'mp' && this.isRecipientTyping) ? `
            <div class="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-200/80 text-slate-700 text-xs w-fit animate-pulse shadow-xs">
              <div class="flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:0.15s]"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:0.3s]"></span>
              </div>
              <span class="text-[11px] font-bold text-slate-600">${currentRecipient ? currentRecipient.name : 'Le directeur'} écrit...</span>
            </div>
          ` : ''}
        </div>

        <!-- Zone de saisie d'envoi ou bandeau d'information réceptif -->
        ${this.currentChannel === 'institutions' ? `
          <div class="p-3.5 rounded-2xl bg-slate-100/90 border border-slate-200 text-slate-600 text-xs flex items-center justify-between gap-3 shadow-2xs">
            <div class="flex items-center gap-2">
              <span class="text-base">📬</span>
              <span>Canal de correspondance officielle : les courriers et avis sont émis directement par les services de l'État, mairies et organisateurs après vos interventions.</span>
            </div>
            <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">Réception Automatique</span>
          </div>
        ` : `
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
        `}

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
