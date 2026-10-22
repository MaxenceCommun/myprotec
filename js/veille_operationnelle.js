/**
 * PROTEC LIVE - MODULE OFFICIEL DE VEILLE OPÉRATIONNELLE & ASTREINTES
 * 
 * Gestion des 3 échelles de veille opérationnelle :
 * 1. "Protection Civile" (National)
 * 2. "Zone de Défense et de Sécurité" (Zonal)
 * 3. "Département" (Départemental)
 * 
 * Système de créneaux de 4h (6 créneaux par 24h) avec règle d'équité :
 * - Un joueur peut s'inscrire sur n'importe quel créneau.
 * - Premier arrivé, premier servi par défaut.
 * - Règle anti-enchaînement : Si un joueur est titulaire sur un créneau et s'inscrit aussi sur le suivant,
 *   son statut sur le créneau suivant est "Enchaînement (Non-prioritaire / Disponible au vol)".
 * - Si un autre joueur arrive pour s'inscrire sur cette 2e garde, il prend directement la place titulaire !
 * - Le joueur initial qui enchaînait bascule automatiquement en réserve / remplaçant.
 * - Si personne d'autre ne s'inscrit, le joueur enchaîne normalement sans pénalité.
 */

window.ProtecVeille = {
  // Définition des 3 échelons opérationnels
  ECHELONS: [
    {
      id: 'departemental',
      title: 'Département',
      scopeName: 'Départemental',
      icon: 'map-pin',
      theme: 'emerald',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      bgGradient: 'from-emerald-700 to-teal-900',
      indemniteHourly: 120, // 480 € par créneau de 4h
      reputationPoints: 10,
      getLabel: (dept) => `Département ${dept.code} - ${dept.name}`,
      getSubLabel: (dept) => `Préfecture : ${dept.chefLieu || dept.name}`,
      description: 'Supervision des dispositifs locaux, coordination des moyens et alertes prioritaires du département.'
    },
    {
      id: 'zonal',
      title: 'Zone de Défense',
      scopeName: 'Zone de Défense et de Sécurité',
      icon: 'shield',
      theme: 'sky',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
      bgGradient: 'from-sky-700 to-indigo-950',
      indemniteHourly: 250, // 1 000 € par créneau de 4h
      reputationPoints: 20,
      getLabel: (dept) => dept.zoneDefense.name,
      getSubLabel: (dept) => `Siège zonal : ${dept.zoneDefense.siege || 'EMIZ'} (${dept.zoneDefense.regions.join(', ')})`,
      description: 'Coordination zonale EMIZ, validation des colonnes de renforts inter-départementales.'
    },
    {
      id: 'national',
      title: 'Protection Civile',
      scopeName: 'National (Fédération)',
      icon: 'flag',
      theme: 'indigo',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      bgGradient: 'from-indigo-800 to-slate-950',
      indemniteHourly: 500, // 2 000 € par créneau de 4h
      reputationPoints: 35,
      getLabel: () => 'Protection Civile (National)',
      getSubLabel: () => 'Centre Opérationnel National (COPC) • Fédération Nationale',
      description: 'Veille opérationnelle nationale, supervision des crises majeures NOVI et renforts zonaux.'
    }
  ],

  // 6 créneaux de 4h par jour pour couvrir 24h
  SLOTS_CONFIG: [
    { index: 0, startHour: 0, endHour: 4, label: '00h00 - 04h00', name: 'Nuit profonde', icon: 'moon' },
    { index: 1, startHour: 4, endHour: 8, label: '04h00 - 08h00', name: 'Aube & Matinée', icon: 'sunrise' },
    { index: 2, startHour: 8, endHour: 12, label: '08h00 - 12h00', name: 'Matinée', icon: 'sun' },
    { index: 3, startHour: 12, endHour: 16, label: '12h00 - 16h00', name: 'Après-midi', icon: 'sun-medium' },
    { index: 4, startHour: 16, endHour: 20, label: '16h00 - 20h00', name: 'Soirée', icon: 'sunset' },
    { index: 5, startHour: 20, endHour: 24, label: '20h00 - 00h00', name: 'Nuit', icon: 'moon-star' }
  ],

  activeEchelonId: 'departemental',
  activeDayOffset: 0, // 0 = Aujourd'hui, 1 = Demain

  // Initialisation du module
  init(game) {
    if (!game) game = window.game;
    if (!game) return;
    if (!game.veilleOperationnelle) {
      game.veilleOperationnelle = this.getDefaultState();
    }
    this.ensureStateIntegrity(game);
    this.syncFromSharedStorage(game);
    this.checkSlotsLifecycle(game);

    if (!this._lifecycleInterval) {
      this._lifecycleInterval = setInterval(() => {
        this.checkSlotsLifecycle(window.game);
      }, 10000);
    }
  },

  // État par défaut
  getDefaultState() {
    return {
      departemental: { slots: {}, currentOfficer: null, history: {}, journal: [] },
      zonal: { slots: {}, currentOfficer: null, history: {}, journal: [] },
      national: { slots: {}, currentOfficer: null, history: {}, journal: [] }
    };
  },

  ensureStateIntegrity(game) {
    if (!game.veilleOperationnelle) game.veilleOperationnelle = {};
    this.ECHELONS.forEach(ech => {
      if (!game.veilleOperationnelle[ech.id]) {
        game.veilleOperationnelle[ech.id] = { slots: {}, currentOfficer: null, history: {}, journal: [] };
      }
      if (!game.veilleOperationnelle[ech.id].slots) {
        game.veilleOperationnelle[ech.id].slots = {};
      }
      if (!game.veilleOperationnelle[ech.id].journal) {
        game.veilleOperationnelle[ech.id].journal = [];
      }
      if (!game.veilleOperationnelle[ech.id].history) {
        game.veilleOperationnelle[ech.id].history = {};
      }
    });
  },

  // Récupère les métadonnées de localisation de l'antenne du joueur
  getDeptContext(game) {
    const deptCode = game.currentDepartmentCode || game.stations?.[0]?.departmentCode || '54';
    const deptObj = (window.ProtecDepartements && window.ProtecDepartements.getByCode(deptCode)) || {
      code: deptCode,
      name: 'Meurthe-et-Moselle',
      chefLieu: 'Nancy',
      region: 'Grand Est'
    };
    const zoneDef = (window.ProtecDepartements && window.ProtecDepartements.getZoneDefense)
      ? window.ProtecDepartements.getZoneDefense(deptCode)
      : {
          id: 'est',
          code: 'EST',
          name: 'Zone de Défense et de Sécurité Est',
          siege: 'Metz / Strasbourg',
          regions: ['Grand Est']
        };

    return {
      ...deptObj,
      zoneDefense: zoneDef
    };
  },

  formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  getDateByOffset(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  },

  formatDateFr(date) {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const str = date.toLocaleDateString('fr-FR', options);
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  getSlotKey(dateStr, slotIndex) {
    return `${dateStr}_${slotIndex}`;
  },

  getPrevSlotKey(dateStr, slotIndex) {
    if (slotIndex > 0) {
      return `${dateStr}_${slotIndex - 1}`;
    }
    // Jour précédent, créneau 5
    const [y, m, d] = dateStr.split('-').map(Number);
    const prevDate = new Date(y, m - 1, d);
    prevDate.setDate(prevDate.getDate() - 1);
    return `${this.formatDateKey(prevDate)}_5`;
  },

  getNextSlotKey(dateStr, slotIndex) {
    if (slotIndex < 5) {
      return `${dateStr}_${slotIndex + 1}`;
    }
    // Jour suivant, créneau 0
    const [y, m, d] = dateStr.split('-').map(Number);
    const nextDate = new Date(y, m - 1, d);
    nextDate.setDate(nextDate.getDate() + 1);
    return `${this.formatDateKey(nextDate)}_0`;
  },

  // Synchronisation partagée (LocalStorage départemental/zonal/national + Realtime)
  getSharedStorageKey(game, echelonId) {
    const deptCtx = this.getDeptContext(game);
    if (echelonId === 'departemental') return `protec_veille_dept_${deptCtx.code}`;
    if (echelonId === 'zonal') return `protec_veille_zone_${deptCtx.zoneDefense.id}`;
    return 'protec_veille_national';
  },

  syncFromSharedStorage(game) {
    this.ECHELONS.forEach(ech => {
      const key = this.getSharedStorageKey(game, ech.id);
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.slots) {
            // Fusionner avec la mémoire locale
            game.veilleOperationnelle[ech.id].slots = {
              ...game.veilleOperationnelle[ech.id].slots,
              ...parsed.slots
            };
          }
          if (parsed && Array.isArray(parsed.journal)) {
            game.veilleOperationnelle[ech.id].journal = parsed.journal;
          }
        }
      } catch (e) {}
    });
  },

  saveSharedStorage(game, echelonId) {
    const key = this.getSharedStorageKey(game, echelonId);
    const data = {
      slots: game.veilleOperationnelle[echelonId]?.slots || {},
      journal: game.veilleOperationnelle[echelonId]?.journal || []
    };
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}

    // Broadcast Realtime Supabase si disponible
    if (window.ProtecSupabase && typeof window.ProtecSupabase.broadcastDepartmentCrisisUpdate === 'function') {
      try {
        const deptCtx = this.getDeptContext(game);
        window.ProtecSupabase.broadcastDepartmentCrisisUpdate({
          type: 'veille_slot_update',
          echelonId: echelonId,
          departmentCode: deptCtx.code,
          slots: data.slots
        });
      } catch (e) {}
    }
  },

  // Recalcule tous les statuts d'enchaînement et de priorité
  recomputeChains(game, echelonId) {
    this.ensureStateIntegrity(game);
    const state = game.veilleOperationnelle[echelonId];
    const slots = state.slots || {};

    // Trier les clés de créneaux par ordre chronologique
    const sortedKeys = Object.keys(slots).sort();

    sortedKeys.forEach(slotKey => {
      const slot = slots[slotKey];
      if (!slot || !slot.titular) return;

      const [dateStr, slotIdxStr] = slotKey.split('_');
      const slotIndex = parseInt(slotIdxStr, 10);
      const prevKey = this.getPrevSlotKey(dateStr, slotIndex);
      const prevSlot = slots[prevKey];

      const isChained = !!(prevSlot && prevSlot.titular && prevSlot.titular.playerId === slot.titular.playerId);
      slot.titular.isChained = isChained;

      // Si le titulaire actuel est enchaîné et qu'il y a un remplaçant disponible qui lui n'enchaîne pas :
      // le remplaçant prend automatiquement la place titulaire !
      if (isChained && slot.substitute) {
        const substituteIsChained = !!(prevSlot && prevSlot.titular && prevSlot.titular.playerId === slot.substitute.playerId);
        if (!substituteIsChained) {
          const oldTitular = slot.titular;
          slot.titular = {
            ...slot.substitute,
            isChained: false
          };
          slot.substitute = oldTitular;
        }
      }
    });

    this.updateCurrentOfficers(game);
  },

  // Mettre à jour les officiers en cours pour chaque échelon
  updateCurrentOfficers(game) {
    if (!game) game = window.game;
    if (!game) return;
    this.ECHELONS.forEach(ech => {
      const off = this.getCurrentOfficer(game, ech.id);
      if (game.veilleOperationnelle?.[ech.id]) {
        game.veilleOperationnelle[ech.id].currentOfficer = off;
      }
    });
  },

  // Récupère l'officier en service à l'instant présent pour un échelon
  getCurrentOfficer(game, echelonId) {
    if (!game) game = window.game;
    if (!game) return null;
    this.ensureStateIntegrity(game);

    const now = new Date();
    const dateStr = this.formatDateKey(now);
    const currentHour = now.getHours();
    const slotIndex = Math.floor(currentHour / 4);
    const slotKey = this.getSlotKey(dateStr, slotIndex);

    const slot = game.veilleOperationnelle?.[echelonId]?.slots?.[slotKey];
    if (slot && slot.titular) {
      const startHour = slotIndex * 4;
      const endHour = startHour + 4;
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, 0, 0).getTime();
      const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, 0, 0).getTime();

      return {
        playerId: slot.titular.playerId,
        playerName: slot.titular.playerName,
        stationName: slot.titular.stationName || 'Cadre d’Astreinte',
        startedAt: startTime,
        endsAt: endTime,
        shiftHours: 4,
        isChained: !!slot.titular.isChained,
        isLocal: (slot.titular.playerId === game.player?.id)
      };
    }
    return null;
  },

  // Inscription sur un créneau
  registerSlot(game, echelonId, dateStr, slotIndex) {
    this.ensureStateIntegrity(game);
    const myId = game.player?.id || 'directeur-local';
    const myName = game.player?.name || 'Directeur d’Antenne';
    const myStation = game.stations?.[0]?.name || 'Antenne Locale';

    const slotKey = this.getSlotKey(dateStr, slotIndex);
    const state = game.veilleOperationnelle[echelonId];
    if (!state.slots[slotKey]) {
      state.slots[slotKey] = {
        dateStr,
        slotIndex,
        titular: null,
        substitute: null,
        rewardPaid: false
      };
    }
    const slot = state.slots[slotKey];
    const prevKey = this.getPrevSlotKey(dateStr, slotIndex);
    const prevSlot = state.slots[prevKey];
    const isMeChained = !!(prevSlot && prevSlot.titular && prevSlot.titular.playerId === myId);

    const slotConfig = this.SLOTS_CONFIG.find(s => s.index === slotIndex) || { label: `${slotIndex * 4}h - ${(slotIndex + 1) * 4}h` };
    const ech = this.ECHELONS.find(e => e.id === echelonId);

    // Cas 1 : Créneau libre
    if (!slot.titular) {
      slot.titular = {
        playerId: myId,
        playerName: myName,
        stationName: myStation,
        registeredAt: Date.now(),
        isChained: isMeChained
      };

      if (isMeChained) {
        game.showToast(
          'Astreinte Enregistrée (Enchaînement) ⚠️',
          `Vous êtes inscrit sur le créneau ${slotConfig.label}. Comme vous enchaînez 2 gardes, un autre joueur pourra prendre la titularité s'il s'inscrit.`,
          'amber'
        );
      } else {
        game.showToast(
          'Astreinte Confirmée ✓',
          `Vous êtes titulaire prioritaire pour le créneau ${slotConfig.label} (${ech.title}).`,
          'green'
        );
      }

      state.journal.unshift({
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        text: `Inscription de ${myName} sur le créneau ${slotConfig.label} (${ech.title}) - ${isMeChained ? 'Enchaînement' : 'Titulaire'}.`
      });

      // Si le créneau est déjà en cours au moment de l'inscription, déclencher immédiatement la notification push
      const nowReg = new Date();
      const todayRegStr = this.formatDateKey(nowReg);
      const curHourReg = nowReg.getHours();
      const curSlotIdxReg = Math.floor(curHourReg / 4);
      if (dateStr === todayRegStr && slotIndex === curSlotIdxReg && !slot.startNotified) {
        slot.startNotified = true;
        this.triggerAstreinteStartPush(game, ech, slotConfig);
      }
    }
    // Cas 2 : Déjà inscrit
    else if (slot.titular.playerId === myId) {
      game.showToast('Déjà Titulaire', `Vous êtes déjà titulaire de ce créneau ${slotConfig.label}.`, 'blue');
      return;
    }
    // Cas 3 : Titulaire existant mais ENCHAÎNÉ -> Le nouveau joueur prend la titularité prioritaire !
    else if (slot.titular.isChained) {
      const oldTitular = slot.titular;

      slot.titular = {
        playerId: myId,
        playerName: myName,
        stationName: myStation,
        registeredAt: Date.now(),
        isChained: isMeChained
      };
      // L'ancien joueur qui enchaînait devient le remplaçant (réserve)
      slot.substitute = oldTitular;

      game.showToast(
        '⚡ Place Attribuée (Priorité Équité)',
        `Vous êtes devenu titulaire prioritaire sur ${slotConfig.label} ! ${oldTitular.playerName} enchaînait deux gardes et bascule en remplaçant.`,
        'green'
      );

      state.journal.unshift({
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        text: `Relève prioritaire : ${myName} devient titulaire du créneau ${slotConfig.label} face à ${oldTitular.playerName} (règle anti-enchaînement).`
      });

      // Si le créneau est déjà en cours, déclencher la notification push de prise de poste
      const nowReg = new Date();
      const todayRegStr = this.formatDateKey(nowReg);
      const curHourReg = nowReg.getHours();
      const curSlotIdxReg = Math.floor(curHourReg / 4);
      if (dateStr === todayRegStr && slotIndex === curSlotIdxReg && !slot.startNotified) {
        slot.startNotified = true;
        this.triggerAstreinteStartPush(game, ech, slotConfig);
      }
    }
    // Cas 4 : Titulaire existant NON enchaîné -> Premier arrivé premier servi
    else {
      if (slot.substitute && slot.substitute.playerId === myId) {
        game.showToast('Déjà en Réserve', `Vous êtes déjà inscrit en remplaçant sur ce créneau.`, 'blue');
        return;
      }

      slot.substitute = {
        playerId: myId,
        playerName: myName,
        stationName: myStation,
        registeredAt: Date.now()
      };

      game.showToast(
        'Inscrit en Réserve 🛡️',
        `Créneau ${slotConfig.label} déjà pourvu par ${slot.titular.playerName}. Vous êtes placé en remplaçant en cas de désistement.`,
        'sky'
      );

      state.journal.unshift({
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        text: `${myName} s'est inscrit en réserviste pour le créneau ${slotConfig.label} (${slot.titular.playerName} titulaire).`
      });
    }

    this.recomputeChains(game, echelonId);
    this.saveSharedStorage(game, echelonId);
    game.saveGame();
    this.renderModal(game);
  },

  // Désinscription d'un créneau
  unregisterSlot(game, echelonId, dateStr, slotIndex) {
    this.ensureStateIntegrity(game);
    const myId = game.player?.id || 'directeur-local';
    const myName = game.player?.name || 'Directeur d’Antenne';
    const slotKey = this.getSlotKey(dateStr, slotIndex);
    const state = game.veilleOperationnelle[echelonId];
    const slot = state.slots[slotKey];
    if (!slot) return;

    const slotConfig = this.SLOTS_CONFIG.find(s => s.index === slotIndex) || { label: `${slotIndex * 4}h` };
    const ech = this.ECHELONS.find(e => e.id === echelonId);

    if (slot.titular && slot.titular.playerId === myId) {
      if (slot.substitute) {
        // Le remplaçant monte en titulaire
        const newTitular = slot.substitute;
        slot.titular = newTitular;
        slot.substitute = null;
        game.showToast('Désinscription Confirmée', `Vous vous êtes retiré du créneau ${slotConfig.label}. ${newTitular.playerName} prend votre place.`, 'blue');
        state.journal.unshift({
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          text: `Désistement de ${myName} sur ${slotConfig.label} (${ech.title}) : ${newTitular.playerName} devient titulaire.`
        });
      } else {
        slot.titular = null;
        game.showToast('Désinscription Confirmée', `Vous avez libéré le créneau ${slotConfig.label}.`, 'blue');
        state.journal.unshift({
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          text: `Désistement de ${myName} sur ${slotConfig.label} (${ech.title}) : Créneau vacant.`
        });
      }
    } else if (slot.substitute && slot.substitute.playerId === myId) {
      slot.substitute = null;
      game.showToast('Désinscription de la Réserve', `Vous n'êtes plus réserviste sur le créneau ${slotConfig.label}.`, 'blue');
    }

    this.recomputeChains(game, echelonId);
    this.saveSharedStorage(game, echelonId);
    game.saveGame();
    this.renderModal(game);
  },

  // Vérification et versement des rémunérations pour les créneaux terminés
  checkAndRewardCompletedSlots(game) {
    if (!game) game = window.game;
    if (!game) return;
    this.ensureStateIntegrity(game);
    const myId = game.player?.id;
    const now = new Date();

    this.ECHELONS.forEach(ech => {
      const state = game.veilleOperationnelle[ech.id];
      const slots = state.slots || {};

      Object.keys(slots).forEach(slotKey => {
        const slot = slots[slotKey];
        if (!slot || !slot.titular || slot.rewardPaid) return;

        const [dateStr, slotIdxStr] = slotKey.split('_');
        const slotIndex = parseInt(slotIdxStr, 10);
        const [y, m, d] = dateStr.split('-').map(Number);
        const endHour = (slotIndex + 1) * 4;
        const endTime = new Date(y, m - 1, d, endHour, 0, 0).getTime();

        // Le créneau est terminé
        if (now.getTime() >= endTime) {
          slot.rewardPaid = true;

          // Si c'est le joueur local
          if (slot.titular.playerId === myId) {
            const gain = 4 * ech.indemniteHourly;
            if (game.resources) {
              game.resources.money = (game.resources.money || 0) + gain;
              game.resources.reputationScore = (game.resources.reputationScore || 0) + ech.reputationPoints;
            }
            state.history[myId] = (state.history[myId] || 0) + 1;

            const slotConfig = this.SLOTS_CONFIG.find(s => s.index === slotIndex) || { label: '' };
            game.showToast(
              'Vacation d’Astreinte Achevée 💰',
              `Créneau ${slotConfig.label} (${ech.title}) complété avec succès ! Indemnités perçues : +${gain.toLocaleString('fr-FR')} € et +${ech.reputationPoints} pts de réputation.`,
              'green'
            );

            state.journal.unshift({
              time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              text: `Vacation achevée : ${slot.titular.playerName} a assuré l’astreinte ${slotConfig.label} (+${gain} €).`
            });
          }
        }
      });
    });
  },

  // Déclenche une push notification OS / Service Worker / In-App pour le début d'une astreinte
  triggerAstreinteStartPush(game, ech, slotCfg) {
    const title = `🚨 Début d'Astreinte : ${ech.title}`;
    const body = `Votre vacation d'astreinte (${slotCfg.label}) commence maintenant. Vous êtes le Cadre de Permanence officiel. Restez attentif aux alertes !`;

    // 1. Notification Push Système (Service Worker & Notification OS)
    if (window.ProtecNotifications && typeof window.ProtecNotifications.sendPushNotification === 'function') {
      window.ProtecNotifications.sendPushNotification(title, body, {
        tag: `astreinte-start-${ech.id}-${slotCfg.index}`,
        category: 'crise',
        customSound: 'alerte_crise.mp3',
        customVolume: 0.95,
        requireInteraction: true,
        data: {
          type: 'astreinte_start',
          echelonId: ech.id,
          slotIndex: slotCfg.index,
          timestamp: Date.now()
        }
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: 'badge-monochrome.png',
          badge: 'badge-monochrome.png',
          tag: `astreinte-start-${ech.id}-${slotCfg.index}`,
          requireInteraction: true
        });
      } catch (e) {}
    }

    // 2. Journalisation dans le centre de notifications in-app
    if (window.ProtecNotifications && typeof window.ProtecNotifications.recordNotification === 'function') {
      window.ProtecNotifications.recordNotification({
        title: title,
        message: body,
        color: 'red',
        category: 'crise',
        level: 'urgent'
      });
    }

    // 3. Alerte toast visuelle in-app
    if (game && typeof game.showToast === 'function') {
      game.showToast(
        `🚨 PRISE D'ASTREINTE EN COURS (${ech.title.toUpperCase()})`,
        `Votre vacation ${slotCfg.label} commence maintenant. Vous êtes le Cadre de Permanence officiel !`,
        'red'
      );
    }
  },

  // Cycle de vie complet des créneaux (vérification toutes les 10s : démarrages, fins, officiers)
  checkSlotsLifecycle(game) {
    if (!game) game = window.game;
    if (!game) return;
    this.ensureStateIntegrity(game);

    const now = new Date();
    const todayStr = this.formatDateKey(now);
    const curHour = now.getHours();
    const curSlotIdx = Math.floor(curHour / 4);
    const myId = game.player?.id;

    this.ECHELONS.forEach(ech => {
      const state = game.veilleOperationnelle[ech.id];
      const slots = state.slots || {};

      // 1. Vérification du créneau actif actuel : envoyer la push notif dès le début
      const activeKey = this.getSlotKey(todayStr, curSlotIdx);
      const activeSlot = slots[activeKey];

      if (activeSlot && activeSlot.titular && activeSlot.titular.playerId === myId) {
        if (!activeSlot.startNotified) {
          activeSlot.startNotified = true;
          const slotCfg = this.SLOTS_CONFIG.find(s => s.index === curSlotIdx) || { label: `${curSlotIdx * 4}h - ${(curSlotIdx + 1) * 4}h` };
          this.triggerAstreinteStartPush(game, ech, slotCfg);
          this.saveSharedStorage(game, ech.id);
        }
      }
    });

    // 2. Contrôle des créneaux terminés pour verser les indemnités
    this.checkAndRewardCompletedSlots(game);

    // 3. Mise à jour des cadres d'astreinte actuels
    this.updateCurrentOfficers(game);
  },

  // Rendu de la modale complète
  renderModal(game) {
    if (!game) game = window.game;
    this.init(game);

    let modal = document.getElementById('veille-operationnelle-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'veille-operationnelle-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in overflow-y-auto';
      document.body.appendChild(modal);
    }

    const deptCtx = this.getDeptContext(game);
    const myId = game.player?.id;
    const currentEch = this.ECHELONS.find(e => e.id === this.activeEchelonId) || this.ECHELONS[0];
    const viewingDate = this.getDateByOffset(this.activeDayOffset);
    const viewingDateStr = this.formatDateKey(viewingDate);
    const viewingDateLabel = this.formatDateFr(viewingDate);

    const now = new Date();
    const isToday = this.activeDayOffset === 0;
    const currentHour = now.getHours();
    const activeSlotIndex = isToday ? Math.floor(currentHour / 4) : -1;

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-5xl rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 bg-white border border-slate-200 text-slate-800 my-auto max-h-[92vh] overflow-y-auto">
        
        <!-- En-tête -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pc-blue to-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/20">
              <i data-lucide="shield-alert" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-black text-slate-900 leading-tight">Veille Opérationnelle & Astreintes des Cadres</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">Créneaux de 4h • Équité Fédérale</span>
              </div>
              <p class="text-xs text-slate-500 font-semibold">
                Permanent d'astreinte aux 3 échelons : Département (${deptCtx.code}), Zone de Défense et National
              </p>
            </div>
          </div>
          <button onclick="document.getElementById('veille-operationnelle-modal').classList.add('hidden')" class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer transition">
            ✕
          </button>
        </div>

        <!-- Onglets Échelons & Sélecteur de Date -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <!-- 3 Échelons -->
          <div class="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            ${this.ECHELONS.map(ech => {
              const isSelected = ech.id === this.activeEchelonId;
              const off = this.getCurrentOfficer(game, ech.id);
              return `
                <button 
                  type="button" 
                  onclick="window.ProtecVeille.setActiveEchelon('${ech.id}')"
                  class="px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected 
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                      : 'text-slate-600 hover:text-slate-900'
                  }">
                  <i data-lucide="${ech.icon}" class="w-3.5 h-3.5 ${isSelected ? 'text-pc-blue' : 'text-slate-400'}"></i>
                  <span>${ech.title}</span>
                  ${off ? '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Cadre en veille active"></span>' : '<span class="w-2 h-2 rounded-full bg-amber-400" title="Poste vacant"></span>'}
                </button>
              `;
            }).join('')}
          </div>

          <!-- Sélecteur Aujourd'hui / Demain -->
          <div class="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-end sm:self-auto">
            <button 
              type="button" 
              onclick="window.ProtecVeille.setActiveDayOffset(0)"
              class="px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                this.activeDayOffset === 0 
                  ? 'bg-pc-blue text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }">
              <span>Aujourd'hui</span>
            </button>
            <button 
              type="button" 
              onclick="window.ProtecVeille.setActiveDayOffset(1)"
              class="px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                this.activeDayOffset === 1 
                  ? 'bg-pc-blue text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }">
              <span>Demain</span>
            </button>
          </div>
        </div>

        <!-- Bannière descriptive de l'échelon sélectionné -->
        <div class="p-4 rounded-2xl bg-gradient-to-r ${currentEch.bgGradient} text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-full font-black bg-white/20 uppercase tracking-wider text-[10px]">
                Échelon ${currentEch.scopeName}
              </span>
              <span class="text-xs font-bold text-white/90">
                📅 ${viewingDateLabel}
              </span>
            </div>
            <h4 class="text-base font-black">${currentEch.getLabel(deptCtx)}</h4>
            <p class="text-xs text-white/80 leading-relaxed">${currentEch.description}</p>
          </div>
          <div class="flex items-center gap-3 shrink-0 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
            <div>
              <span class="block text-[9.5px] uppercase font-bold text-white/70">Indemnité</span>
              <strong class="text-sm font-black text-white">${currentEch.indemniteHourly * 4} € <span class="text-[10px] font-normal text-white/80">/ créneau (4h)</span></strong>
            </div>
            <div class="w-px h-8 bg-white/20"></div>
            <div>
              <span class="block text-[9.5px] uppercase font-bold text-white/70">Réputation</span>
              <strong class="text-sm font-black text-amber-300">+${currentEch.reputationPoints} pts</strong>
            </div>
          </div>
        </div>

        <!-- Règle de fonctionnement & Règle d'enchaînement -->
        <div class="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
          <span class="text-base">⚖️</span>
          <div class="space-y-0.5 leading-snug">
            <strong class="font-black text-amber-900">Règle d'équité des créneaux de 4 heures :</strong>
            <p class="text-[11px] text-amber-800">
              Vous pouvez vous inscrire sur autant de créneaux que vous le souhaitez. 
              <strong>Règle anti-enchaînement :</strong> si vous êtes inscrit sur deux gardes consécutives, vous n'êtes pas prioritaire sur la seconde : 
              tout autre joueur qui clique prend immédiatement la place titulaire (vous basculez alors en réserve). 
              Si personne d'autre ne s'inscrit, vous enchaînez vos deux créneaux normalement.
            </p>
          </div>
        </div>

        <!-- GRILLE DES 6 CRÉNEAUX DE LA JOURNÉE -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-extrabold text-slate-700">
            <span class="uppercase tracking-wider">Planning des 6 créneaux de 4h (${viewingDateLabel}) :</span>
            <span class="text-[11px] text-slate-500 font-normal">Cliquez pour vous inscrire ou prendre la main</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            ${this.SLOTS_CONFIG.map(slotCfg => {
              const slotKey = this.getSlotKey(viewingDateStr, slotCfg.index);
              const slot = game.veilleOperationnelle[currentEch.id]?.slots?.[slotKey] || {
                titular: null,
                substitute: null
              };

              const isCurrentActive = (isToday && slotCfg.index === activeSlotIndex);
              const isPast = isToday ? (slotCfg.endHour <= currentHour) : (this.activeDayOffset < 0);

              const titular = slot.titular;
              const substitute = slot.substitute;
              const isMeTitular = titular && titular.playerId === myId;
              const isMeSubstitute = substitute && substitute.playerId === myId;
              const isChained = titular && titular.isChained;

              return `
                <div class="p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${
                  isCurrentActive
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-200'
                    : isPast
                      ? 'border-slate-200 bg-slate-50/70 opacity-75'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                }">
                  
                  <!-- En-tête créneau -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-xl ${isCurrentActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'} flex items-center justify-center font-bold">
                        <i data-lucide="${slotCfg.icon}" class="w-4 h-4"></i>
                      </div>
                      <div>
                        <strong class="text-xs font-black text-slate-900 block leading-tight">${slotCfg.label}</strong>
                        <span class="text-[10px] text-slate-500">${slotCfg.name}</span>
                      </div>
                    </div>

                    ${isCurrentActive ? `
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white animate-pulse">
                        🔴 EN COURS
                      </span>
                    ` : isPast ? `
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 text-slate-600">
                        Terminé
                      </span>
                    ` : `
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                        À venir
                      </span>
                    `}
                  </div>

                  <!-- Titulaire du créneau -->
                  <div class="p-2.5 rounded-xl ${
                    titular 
                      ? (isMeTitular 
                          ? (isChained ? 'bg-amber-50 border border-amber-300' : 'bg-emerald-50 border border-emerald-300')
                          : (isChained ? 'bg-amber-50 border border-amber-300' : 'bg-sky-50 border border-sky-200'))
                      : 'bg-slate-50 border border-dashed border-slate-300'
                  } space-y-1">
                    <div class="flex items-center justify-between text-[10px]">
                      <span class="font-bold text-slate-500">Cadre Titulaire :</span>
                      ${titular ? (
                        isChained ? `
                          <span class="px-1.5 py-0.2 rounded font-black text-[9px] bg-amber-200 text-amber-950 flex items-center gap-1" title="Ce joueur enchaîne deux créneaux consécutifs : disponible au vol par un autre joueur !">
                            <span>⚠️ Enchaînement</span>
                            <span>(Volable)</span>
                          </span>
                        ` : `
                          <span class="px-1.5 py-0.2 rounded font-black text-[9px] bg-emerald-200 text-emerald-950">
                            ✓ Prioritaire
                          </span>
                        `
                      ) : `
                        <span class="px-1.5 py-0.2 rounded font-bold text-[9px] bg-slate-200 text-slate-600">
                          Vacant
                        </span>
                      `}
                    </div>

                    ${titular ? `
                      <div class="flex items-center gap-2 pt-0.5 truncate">
                        <div class="w-6 h-6 rounded-lg ${isMeTitular ? 'bg-pc-blue text-white' : 'bg-slate-700 text-white'} flex items-center justify-center font-black text-[10px] shrink-0">
                          ${(titular.playerName || 'CP').substring(0, 2).toUpperCase()}
                        </div>
                        <div class="truncate text-xs">
                          <strong class="text-slate-900 block truncate leading-tight">
                            ${titular.playerName} ${isMeTitular ? '<span class="text-pc-blue font-black">(VOUS)</span>' : ''}
                          </strong>
                          <span class="text-[9.5px] text-slate-500 block truncate">${titular.stationName || 'Antenne'}</span>
                        </div>
                      </div>
                    ` : `
                      <p class="text-[11px] text-slate-500 italic py-0.5">Aucun titulaire inscrit pour le moment.</p>
                    `}
                  </div>

                  <!-- Réserviste / Remplaçant (si existant) -->
                  ${substitute ? `
                    <div class="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10.5px] space-y-0.5">
                      <div class="flex items-center justify-between text-[9px] text-slate-500 font-bold">
                        <span>Réserviste (Remplaçant) :</span>
                        <span class="text-pc-blue">En réserve</span>
                      </div>
                      <div class="truncate text-slate-700 font-semibold">
                        ${substitute.playerName} ${isMeSubstitute ? '<strong class="text-pc-blue font-black">(VOUS)</strong>' : ''}
                      </div>
                    </div>
                  ` : ''}

                  <!-- Boutons d'Action -->
                  <div class="pt-1 border-t border-slate-100">
                    ${isPast ? `
                      <button disabled class="w-full py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed">
                        Créneau expiré
                      </button>
                    ` : isMeTitular ? `
                      <button 
                        type="button" 
                        onclick="window.ProtecVeille.unregisterSlot(window.game, '${currentEch.id}', '${viewingDateStr}', ${slotCfg.index})"
                        class="w-full py-2 rounded-xl text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer flex items-center justify-center gap-1">
                        <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                        <span>Se désinscrire</span>
                      </button>
                    ` : isMeSubstitute ? `
                      <button 
                        type="button" 
                        onclick="window.ProtecVeille.unregisterSlot(window.game, '${currentEch.id}', '${viewingDateStr}', ${slotCfg.index})"
                        class="w-full py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer">
                        ✕ Quitter la réserve
                      </button>
                    ` : !titular ? `
                      <button 
                        type="button" 
                        onclick="window.ProtecVeille.registerSlot(window.game, '${currentEch.id}', '${viewingDateStr}', ${slotCfg.index})"
                        class="w-full py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5">
                        <i data-lucide="check" class="w-3.5 h-3.5"></i>
                        <span>S'inscrire sur ce créneau</span>
                      </button>
                    ` : isChained ? `
                      <!-- LE TITULAIRE ENCHAÎNE -> LE JOUEUR PEUT PRENDRE LA TITULARITÉ DIRECTEMENT ! -->
                      <button 
                        type="button" 
                        onclick="window.ProtecVeille.registerSlot(window.game, '${currentEch.id}', '${viewingDateStr}', ${slotCfg.index})"
                        class="w-full py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white shadow-md transition cursor-pointer flex items-center justify-center gap-1 animate-pulse">
                        <i data-lucide="zap" class="w-3.5 h-3.5"></i>
                        <span>⚡ Prendre ce créneau (Priorité)</span>
                      </button>
                    ` : !substitute ? `
                      <!-- Titulaire non-enchaîné -> Inscription en réserve -->
                      <button 
                        type="button" 
                        onclick="window.ProtecVeille.registerSlot(window.game, '${currentEch.id}', '${viewingDateStr}', ${slotCfg.index})"
                        class="w-full py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center justify-center gap-1">
                        <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                        <span>S'inscrire en réserve</span>
                      </button>
                    ` : `
                      <button disabled class="w-full py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed">
                        Complet (Titulaire + Réserve)
                      </button>
                    `}
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Main courante combinée -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <i data-lucide="clipboard-list" class="w-4 h-4 text-indigo-600"></i>
              Main Courante de Veille & Relèves Opérationnelles
            </h5>
            <span class="text-[10px] text-slate-400 font-bold">Historique en temps réel</span>
          </div>
          <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
            ${this.renderCombinedJournalHTML(game)}
          </div>
        </div>

      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  setActiveEchelon(echelonId) {
    this.activeEchelonId = echelonId;
    this.renderModal(window.game);
  },

  setActiveDayOffset(offset) {
    this.activeDayOffset = offset;
    this.renderModal(window.game);
  },

  // Rendu du journal combiné
  renderCombinedJournalHTML(game) {
    const combined = [];
    this.ECHELONS.forEach(ech => {
      const journal = game.veilleOperationnelle?.[ech.id]?.journal || [];
      journal.forEach(j => {
        combined.push({
          echelon: ech.title,
          color: ech.theme,
          time: j.time,
          text: j.text
        });
      });
    });

    if (combined.length === 0) {
      return `<p class="text-slate-400 text-center py-2 italic text-[11px]">Aucun mouvement consigné pour le moment. Inscrivez-vous sur votre premier créneau d'astreinte !</p>`;
    }

    return combined.slice(0, 10).map(c => `
      <div class="flex items-center gap-2 text-[11px] text-slate-700 py-0.5 border-b border-slate-100 last:border-0">
        <span class="font-mono text-slate-400 text-[10px]">${c.time}</span>
        <span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-${c.color}-100 text-${c.color}-800">[${c.echelon}]</span>
        <span class="truncate">${c.text}</span>
      </div>
    `).join('');
  }
};
