/**
 * PROTEC LIVE - GESTIONNAIRE DÉPARTEMENTAL APC (ASSOCIATION DE PROTECTION CIVILE)
 * 
 * Gestion de la gouvernance, des élections bimensuelles (13 du mois / veille du 1er),
 * des finances départementales (cotisation journalière, dette), des conventions-cadres,
 * du parc matériel mutualisé et du fonds de solidarité.
 */

window.ProtecAPC = {
  activeTab: 'tableau_bord', // 'tableau_bord', 'elections', 'politique', 'materiel', 'finances'
  cachedAPC: null,
  deptPlayersCache: [],
  lastFetchTime: 0,

  // Définition du parc de matériel lourd d'appui mutualisé pouvant être acheté par l'APC
  CATALOGUE_MATERIEL: [
    {
      id: 'apc_pcm',
      name: 'PCM - Poste de Commandement Mobile',
      category: 'Commandement',
      type: 'PCM',
      icon: 'radio',
      price: 18000,
      description: 'Véhicule lourd équipé pour coordonner les colonnes de secours départementales et les plans ORSEC.',
      bonus: '+25% vitesse chantiers & réduction fatigue',
      dailyMaintenance: 45
    },
    {
      id: 'apc_vahu',
      name: 'VAHU - Véhicule d’Appui & Hébergement d’Urgence',
      category: 'Soutien des Populations',
      type: 'VAHU',
      icon: 'truck',
      price: 12000,
      description: 'Fourgon logistique transportant tentes gonflables, 50 lits picot et ravitaillement pour CAI.',
      bonus: 'Déploie un CAI complet en 2x moins de temps',
      dailyMaintenance: 30
    },
    {
      id: 'apc_remorque_pompage',
      name: 'Remorque Moto-Pompe Haute Capacité (MPGC)',
      category: 'Inondations / Pompage',
      type: 'REMORQUE_POMPAGE',
      icon: 'droplets',
      price: 7500,
      description: 'Remorque équipée de motopompes submersibles industrielles (150 m³/h) pour crues et inondations.',
      bonus: '+40% gains sur missions météo / inondations',
      dailyMaintenance: 15
    },
    {
      id: 'apc_vlhr',
      name: 'VLHR - Véhicule de Liaison Hors Route 4x4',
      category: 'Reconnaissance',
      type: 'VLHR',
      icon: 'navigation',
      price: 9500,
      description: 'Véhicule tout-terrain pour missions de recherche de personnes égarées et reconnaissances météo.',
      bonus: 'Accès pistes difficiles et battues cyno/drones',
      dailyMaintenance: 20
    }
  ],

  // Définition des conventions-cadres départementales déblocables par le bureau APC
  CONVENTIONS_APC: [
    {
      id: 'prefecture_partenariat',
      name: 'Convention-Cadre Préfecture & SIDPC',
      cost: 4500,
      multiplier: 1.10, // +10%
      reputationBonus: 15,
      description: 'Partenariat officiel pour la gestion des crises ORSEC et réquisitions d’urgence.',
      effect: '+10% sur les rétributions de réquisitions et DPS pour toutes les antennes du département.'
    },
    {
      id: 'samu_partenariat',
      name: 'Convention Cadre SAMU 15 & GHT',
      cost: 6000,
      multiplier: 1.15, // +15%
      reputationBonus: 20,
      description: 'Accréditation départementale pour les gardes ambulancières et missions d’appui SUAP.',
      effect: '+15% sur les indemnités d’astreintes et transports sanitaires d’urgence.'
    },
    {
      id: 'grands_evenements',
      name: 'Convention Événementielle Départementale',
      cost: 3500,
      multiplier: 1.08, // +8%
      reputationBonus: 10,
      description: 'Mandat exclusif négocié auprès des collectivités pour les festivals, marathons et concerts majeurs.',
      effect: '+8% sur tous les devis DPS associatifs et municipaux du département.'
    }
  ],

  // Calcule les dates des scrutins et la phase électorale selon la date du jeu (game.clock)
  getElectionSchedule(clock) {
    const year = clock.year || 2026;
    const month = clock.month ?? 9; // 0-indexed (9 = Octobre)
    const day = clock.day || 5;

    // Nombre de jours dans le mois en cours
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lastDayOfMonth = daysInMonth;

    // Phase 1 : Scrutin de mi-mois
    // Vote : le 13 du mois
    // Prise de fonction : le 14 du mois
    // Phase 2 : Scrutin de fin de mois
    // Vote : la veille du 1er (jour = lastDayOfMonth)
    // Prise de fonction : le 1er du mois suivant

    let isVotingDay = false;
    let electionSession = null; // 'mi_mois' ou 'fin_mois'
    let nextVoteDateStr = '';
    let takeOfficeDateStr = '';

    if (day === 13) {
      isVotingDay = true;
      electionSession = 'mi_mois';
      nextVoteDateStr = `Aujourd'hui (13 ${clock.monthsNames?.[month] || 'mois'})`;
      takeOfficeDateStr = `Demain 14 ${clock.monthsNames?.[month] || 'mois'} à 00h00`;
    } else if (day === lastDayOfMonth) {
      isVotingDay = true;
      electionSession = 'fin_mois';
      const nextMonthName = clock.monthsNames?.[(month + 1) % 12] || 'mois prochain';
      nextVoteDateStr = `Aujourd'hui (${lastDayOfMonth} ${clock.monthsNames?.[month] || 'mois'})`;
      takeOfficeDateStr = `Demain 1er ${nextMonthName} à 00h00`;
    } else {
      isVotingDay = false;
      if (day < 13) {
        electionSession = 'mi_mois';
        nextVoteDateStr = `13 ${clock.monthsNames?.[month] || 'mois'}`;
        takeOfficeDateStr = `14 ${clock.monthsNames?.[month] || 'mois'}`;
      } else {
        electionSession = 'fin_mois';
        const nextMonthName = clock.monthsNames?.[(month + 1) % 12] || 'mois prochain';
        nextVoteDateStr = `${lastDayOfMonth} ${clock.monthsNames?.[month] || 'mois'}`;
        takeOfficeDateStr = `1er ${nextMonthName}`;
      }
    }

    return {
      isVotingDay,
      electionSession,
      currentDay: day,
      daysInMonth,
      lastDayOfMonth,
      nextVoteDateStr,
      takeOfficeDateStr
    };
  },

  // Récupération de l'état départemental de l'APC (avec fallback de calcul local)
  async getAPCData(game, forceRefresh = false) {
    const deptCode = String(game.player?.departmentCode || game.currentDepartmentCode || '54').trim().toUpperCase();
    const now = Date.now();

    if (!forceRefresh && this.cachedAPC && this.cachedAPC.departmentCode === deptCode && (now - this.lastFetchTime < 10000)) {
      return this.cachedAPC;
    }

    let apc = null;

    // 1. Essai de lecture depuis la table Supabase `apc_departments`
    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      try {
        const { data, error } = await window.ProtecSupabase.client
          .from('apc_departments')
          .select('*')
          .eq('department_code', deptCode)
          .maybeSingle();

        if (!error && data) {
          apc = {
            id: data.id,
            departmentCode: data.department_code,
            name: data.name || `APC ${deptCode}`,
            presidentId: data.president_id,
            presidentName: data.president_name,
            treasurerId: data.treasurer_id,
            treasurerName: data.treasurer_name,
            secretaryId: data.secretary_id,
            secretaryName: data.secretary_name,
            treasury: Number(data.treasury || 0),
            dailyContribution: Number(data.daily_contribution || 50),
            astreinteBonus: Number(data.astreinte_bonus || 20),
            conventions: data.conventions || [],
            mutualEquipment: data.mutual_equipment || [],
            electionHistory: data.election_history || [],
            currentVotes: data.current_votes || {},
            debts: data.debts || {},
            solidarityFund: data.solidarity_fund || [],
            crisisAutonomousRequisition: data.crisis_autonomous_requisition || data.crisisAutonomousRequisition || {
              title: "Engagement Autonome Inter-Antennes en Temps de Crise",
              description: "Autoriser l'engagement en autonomie d'un engin avec équipage complet d'un confrère sans validation préalable, exclusivement lors des crises majeures.",
              votes: {}
            },
            crisisAlertStrategy: data.crisis_alert_strategy || data.crisisAlertStrategy || 'proche', // 'proche' | 'astreinte' | 'tous'
            crisisAckTimeoutSeconds: Number(data.crisis_ack_timeout_seconds || data.crisisAckTimeoutSeconds || 45),
            lastProcessedDay: data.last_processed_day || null,
            updatedAt: data.updated_at
          };
        }
      } catch (e) {
        console.warn('Avertissement lecture APC Supabase:', e);
      }
    }

    // 2. Fallback depuis la base locale (db.js / localStorage / game cache)
    if (!apc) {
      let localAPC = null;
      try {
        localAPC = JSON.parse(localStorage.getItem(`protec_apc_${deptCode}`) || 'null');
      } catch (e) {}

      if (localAPC) {
        apc = localAPC;
        if (!apc.crisisAutonomousRequisition) {
          apc.crisisAutonomousRequisition = {
            title: "Engagement Autonome Inter-Antennes en Temps de Crise",
            description: "Autoriser l'engagement en autonomie d'un engin avec équipage complet d'un confrère sans validation préalable, exclusivement lors des crises majeures.",
            votes: {}
          };
        }
        if (!apc.crisisAlertStrategy) apc.crisisAlertStrategy = 'proche';
        if (!apc.crisisAckTimeoutSeconds) apc.crisisAckTimeoutSeconds = 45;
      } else {
        // Création initiale : le premier joueur en devient automatiquement le Président
        const defaultPresidentId = game.player?.id || 'usr_player';
        const defaultPresidentName = game.player?.name || 'Directeur';

        apc = {
          id: `apc-${deptCode}`,
          departmentCode: deptCode,
          name: `Association Départementale de Protection Civile (${deptCode})`,
          presidentId: defaultPresidentId,
          presidentName: defaultPresidentName,
          treasurerId: null,
          treasurerName: null,
          secretaryId: null,
          secretaryName: null,
          treasury: 12500, // Dotation initiale de l'APC
          dailyContribution: 50, // 50 € / jour par antenne
          astreinteBonus: 25, // +25 € par vacation d'astreinte
          conventions: ['prefecture_partenariat'], // Convention préfecture initiale
          mutualEquipment: [
            {
              id: 'pcm_initial',
              type: 'PCM',
              name: 'PCM 69 - Poste de Commandement Mobile',
              borrowedByStationId: null,
              borrowedByPlayerId: null,
              borrowedUntil: null,
              condition: 100
            }
          ],
          electionHistory: [],
          currentVotes: {},
          debts: {}, // { playerId: amount }
          solidarityFund: [],
          crisisAutonomousRequisition: {
            title: "Engagement Autonome Inter-Antennes en Temps de Crise",
            description: "Autoriser l'engagement en autonomie d'un engin avec équipage complet d'un confrère sans validation préalable, exclusivement lors des crises majeures.",
            votes: {}
          },
          crisisAlertStrategy: 'proche', // 'proche' | 'astreinte' | 'tous'
          crisisAckTimeoutSeconds: 45,
          lastProcessedDay: null,
          updatedAt: new Date().toISOString()
        };
        try {
          localStorage.setItem(`protec_apc_${deptCode}`, JSON.stringify(apc));
        } catch (e) {}
      }
    }

    // 3. Charger la liste des joueurs du même département
    await this.fetchDepartmentPlayers(game, deptCode);

    // 4. Si un seul joueur est présent dans le département, vérifier qu'il est bien Président et cumule
    if (this.deptPlayersCache.length <= 1) {
      if (apc.presidentId !== game.player?.id && game.player?.id) {
        apc.presidentId = game.player.id;
        apc.presidentName = game.player.name;
      }
      // Cumul automatique des fonctions si non pourvues
      if (!apc.treasurerId) apc.treasurerName = `${apc.presidentName} (Président)`;
      if (!apc.secretaryId) apc.secretaryName = `${apc.presidentName} (Président)`;
    }

    this.cachedAPC = apc;
    this.lastFetchTime = now;
    return apc;
  },

  // Récupération de tous les directeurs rattachés au département
  async fetchDepartmentPlayers(game, deptCode) {
    let list = [];

    // Priorité Supabase
    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      try {
        const { data, error } = await window.ProtecSupabase.client
          .from('players')
          .select('id, username, station_name, city, department_code, created_at, last_login')
          .eq('department_code', deptCode);

        if (!error && data && data.length > 0) {
          list = data.map(p => ({
            id: p.id,
            name: p.username,
            stationName: p.station_name,
            city: p.city,
            departmentCode: p.department_code
          }));
        }
      } catch (e) {}
    }

    // Si la liste est vide ou en offline, inclure au moins le joueur courant
    if (list.length === 0) {
      list = [{
        id: game.player?.id || 'usr_player',
        name: game.player?.name || 'Directeur',
        stationName: game.stations?.[0]?.name || 'Antenne Principale',
        city: game.stations?.[0]?.city || 'Chef-Lieu',
        departmentCode: deptCode
      }];
    }

    this.deptPlayersCache = list;
    return list;
  },

  // Sauvegarde de l'APC dans Supabase et en cache local
  async saveAPC(apc) {
    this.cachedAPC = apc;
    this.lastFetchTime = Date.now();

    try {
      localStorage.setItem(`protec_apc_${apc.departmentCode}`, JSON.stringify(apc));
    } catch (e) {}

    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      try {
        const payload = {
          department_code: apc.departmentCode,
          name: apc.name,
          president_id: apc.presidentId,
          president_name: apc.presidentName,
          treasurer_id: apc.treasurerId,
          treasurer_name: apc.treasurerName,
          secretary_id: apc.secretaryId,
          secretary_name: apc.secretaryName,
          treasury: apc.treasury,
          daily_contribution: apc.dailyContribution,
          astreinte_bonus: apc.astreinteBonus,
          conventions: apc.conventions,
          mutual_equipment: apc.mutualEquipment,
          election_history: apc.electionHistory,
          current_votes: apc.currentVotes,
          debts: apc.debts,
          solidarity_fund: apc.solidarityFund,
          crisis_autonomous_requisition: apc.crisisAutonomousRequisition,
          crisis_alert_strategy: apc.crisisAlertStrategy || 'proche',
          crisis_ack_timeout_seconds: apc.crisisAckTimeoutSeconds || 45,
          last_processed_day: apc.lastProcessedDay,
          updated_at: new Date().toISOString()
        };
        // Recherche d'un enregistrement existant sans dépendre d'une contrainte ON CONFLICT stricte
        const { data: existing } = await window.ProtecSupabase.client
          .from('apc_departments')
          .select('id')
          .eq('department_code', apc.departmentCode)
          .maybeSingle();

        if (existing && existing.id) {
          const res = await window.ProtecSupabase.client
            .from('apc_departments')
            .update(payload)
            .eq('id', existing.id);

          if (res && res.error) {
            delete payload.crisis_autonomous_requisition;
            delete payload.crisis_alert_strategy;
            delete payload.crisis_ack_timeout_seconds;
            await window.ProtecSupabase.client
              .from('apc_departments')
              .update(payload)
              .eq('id', existing.id);
          }
        } else {
          const res = await window.ProtecSupabase.client
            .from('apc_departments')
            .insert(payload);

          if (res && res.error) {
            delete payload.crisis_autonomous_requisition;
            delete payload.crisis_alert_strategy;
            delete payload.crisis_ack_timeout_seconds;
            await window.ProtecSupabase.client
              .from('apc_departments')
              .insert(payload);
          }
        }
      } catch (e) {
        console.warn('Avertissement sauvegarde APC Supabase:', e);
      }
    }
  },

  // Cycle quotidien automatique : prélèvement de la cotisation et application des pénalités
  async processDailyCycle(game) {
    if (!game || !game.clock) return;
    const apc = await this.getAPCData(game);
    const dayKey = `${game.clock.year}-${game.clock.month}-${game.clock.day}`;

    // Éviter les doubles prélèvements le même jour simulé
    if (apc.lastProcessedDay === dayKey) return;

    const contribution = Number(apc.dailyContribution || 0);
    const playerId = game.player?.id;

    if (contribution > 0 && playerId) {
      const currentMoney = Number(game.resources?.money || 0);

      if (currentMoney >= contribution) {
        // Paiement nominal
        game.resources.money -= contribution;
        apc.treasury = (apc.treasury || 0) + contribution;

        // Si le joueur avait une dette antérieure, tenter de la réduire s'il a du surplus
        if (apc.debts && apc.debts[playerId] > 0) {
          const debt = apc.debts[playerId];
          const repayment = Math.min(debt, Math.max(0, game.resources.money - 500));
          if (repayment > 0) {
            game.resources.money -= repayment;
            apc.debts[playerId] -= repayment;
            apc.treasury += repayment;
            if (apc.debts[playerId] <= 0) {
              delete apc.debts[playerId];
              game.showToast('Dette Soldée !', 'Votre antenne est de nouveau en règle avec l’APC départementale.', 'green');
            }
          }
        }
      } else {
        // Insolvabilité : mise en dette
        if (!apc.debts) apc.debts = {};
        apc.debts[playerId] = (apc.debts[playerId] || 0) + contribution;
        game.showToast('Cotisation Impayée', `Fonds insuffisants pour la cotisation journalière (${contribution} €). Antenne déclarée en dette auprès de l’APC.`, 'red');
      }

      game.updateStatsUI();
    }

    // Gestion de l'élection au changement de jour
    this.checkElectionResults(game, apc);

    apc.lastProcessedDay = dayKey;
    await this.saveAPC(apc);
  },

  // Vérifie et valide le dépouillement si l'heure de prise de fonction est atteinte
  checkElectionResults(game, apc) {
    const clock = game.clock;
    const schedule = this.getElectionSchedule(clock);
    const day = clock.day;

    // Prise de fonction le 14 (après vote du 13) ou le 1er (après vote du dernier jour)
    const isTakeOfficeDay = (day === 14) || (day === 1);

    if (isTakeOfficeDay && Object.keys(apc.currentVotes || {}).length > 0) {
      // Dépouillement des votes
      const voteCounts = {};
      Object.values(apc.currentVotes).forEach(candId => {
        voteCounts[candId] = (voteCounts[candId] || 0) + 1;
      });

      let winnerId = null;
      let maxVotes = -1;
      for (const [candId, votes] of Object.entries(voteCounts)) {
        if (votes > maxVotes) {
          maxVotes = votes;
          winnerId = candId;
        }
      }

      if (winnerId) {
        const winner = this.deptPlayersCache.find(p => p.id === winnerId) || { id: winnerId, name: 'Directeur Élu' };
        const previousPresident = apc.presidentName;

        apc.presidentId = winner.id;
        apc.presidentName = winner.name;

        // Historique
        if (!apc.electionHistory) apc.electionHistory = [];
        apc.electionHistory.unshift({
          date: `${day} ${clock.monthsNames?.[clock.month]} ${clock.year}`,
          winnerId: winner.id,
          winnerName: winner.name,
          votesCount: maxVotes,
          session: schedule.electionSession === 'mi_mois' ? 'Scrutin de Mi-Mois' : 'Scrutin de Fin de Mois'
        });

        // Remise à zéro des votes en cours pour le prochain scrutin
        apc.currentVotes = {};

        game.showToast('Nouveau Président Élu !', `${winner.name} prend officiellement ses fonctions à la tête de l’APC départementale.`, 'purple');
      }
    }
  },

  // Contrôle si le joueur est en situation de dette
  isPlayerInDebt(game, apc) {
    const pid = game.player?.id;
    if (!pid || !apc || !apc.debts) return false;
    return (Number(apc.debts[pid] || 0) > 0);
  },

  // Multiplicateur effectif de gains apporté par l'APC (0 si dette)
  getEffectiveMultiplier(game) {
    if (!this.cachedAPC) return 1.0;
    if (this.isPlayerInDebt(game, this.cachedAPC)) return 1.0; // Perte des bonus si endetté

    let mult = 1.0;
    const activeConventions = this.cachedAPC.conventions || [];
    this.CONVENTIONS_APC.forEach(c => {
      if (activeConventions.includes(c.id)) {
        mult += (c.multiplier - 1.0);
      }
    });
    return mult;
  },

  // Bonus financier d'astreinte départementale (0 si dette)
  getAstreinteBonus(game) {
    if (!this.cachedAPC) return 0;
    if (this.isPlayerInDebt(game, this.cachedAPC)) return 0;
    return Number(this.cachedAPC.astreinteBonus || 0);
  },

  // =========================================================================
  // ACTIONS DU BUREAU & ÉLECTIONS
  // =========================================================================

  // Voter pour un candidat présidentiel
  async voteForPresident(candidateId, game) {
    const apc = await this.getAPCData(game);
    const schedule = this.getElectionSchedule(game.clock);

    if (!schedule.isVotingDay) {
      await window.ProtecDialog.alert(`Le scrutin n'est pas ouvert aujourd'hui. Prochain jour de vote : le ${schedule.nextVoteDateStr}.`, 'Scrutin Fermé');
      return;
    }

    const voterId = game.player?.id;
    if (!voterId) return;

    if (!apc.currentVotes) apc.currentVotes = {};
    apc.currentVotes[voterId] = candidateId;

    await this.saveAPC(apc);
    game.showToast('Bulletin Déposé !', 'Votre vote pour la présidence départementale a été enregistré dans l’urne numérique.', 'green');
    this.renderModal(game);
  },

  // Nomination du Trésorier par le Président
  async appointTreasurer(targetPlayerId, game) {
    const apc = await this.getAPCData(game);
    if (apc.presidentId !== game.player?.id) {
      await window.ProtecDialog.alert('Seul le Président de l’APC peut nommer les membres du bureau.', 'Action Interdite');
      return;
    }

    const player = this.deptPlayersCache.find(p => p.id === targetPlayerId);
    if (!player) return;

    apc.treasurerId = player.id;
    apc.treasurerName = player.name;
    await this.saveAPC(apc);
    game.showToast('Nomination Validée', `${player.name} a été nommé Trésorier départemental.`, 'blue');
    this.renderModal(game);
  },

  // Nomination du Secrétaire par le Président
  async appointSecretary(targetPlayerId, game) {
    const apc = await this.getAPCData(game);
    if (apc.presidentId !== game.player?.id) {
      await window.ProtecDialog.alert('Seul le Président de l’APC peut nommer les membres du bureau.', 'Action Interdite');
      return;
    }

    const player = this.deptPlayersCache.find(p => p.id === targetPlayerId);
    if (!player) return;

    apc.secretaryId = player.id;
    apc.secretaryName = player.name;
    await this.saveAPC(apc);
    game.showToast('Nomination Validée', `${player.name} a été nommé Secrétaire général départemental.`, 'blue');
    this.renderModal(game);
  },

  // Démission volontaire d'un membre du bureau
  async resignOffice(officeRole, game) {
    const apc = await this.getAPCData(game);
    const pid = game.player?.id;

    if (officeRole === 'tresorier' && apc.treasurerId === pid) {
      apc.treasurerId = null;
      apc.treasurerName = `${apc.presidentName} (Président par intérim)`;
      await this.saveAPC(apc);
      game.showToast('Démission Enregistrée', 'Vous avez démissionné de vos fonctions de Trésorier.', 'orange');
    } else if (officeRole === 'secretaire' && apc.secretaryId === pid) {
      apc.secretaryId = null;
      apc.secretaryName = `${apc.presidentName} (Président par intérim)`;
      await this.saveAPC(apc);
      game.showToast('Démission Enregistrée', 'Vous avez démissionné de vos fonctions de Secrétaire.', 'orange');
    }
    this.renderModal(game);
  },

  // Modification du montant de cotisation journalière (par le Trésorier ou Président par intérim)
  async updateDailyContribution(newAmount, game) {
    const apc = await this.getAPCData(game);
    const pid = game.player?.id;
    const isTreasurer = (apc.treasurerId === pid);
    const isPresidentSolo = (apc.presidentId === pid && !apc.treasurerId);

    if (!isTreasurer && !isPresidentSolo) {
      await window.ProtecDialog.alert('La fixation de la cotisation départementale est réservée au Trésorier.', 'Accès Réservé');
      return;
    }

    const cleanVal = Math.max(0, Math.min(250, Number(newAmount || 0)));
    apc.dailyContribution = cleanVal;
    await this.saveAPC(apc);
    game.showToast('Cotisation Modifiée', `La cotisation journalière par antenne est désormais de ${cleanVal} €.`, 'green');
    this.renderModal(game);
  },

  // Modification du barème de défraiement / indemnité de déplacement pour les renforts (APC départementale)
  async updateRenfortIndemnite(newAmount, game) {
    const apc = await this.getAPCData(game);
    const pid = game.player?.id;
    const isTreasurer = (apc.treasurerId === pid);
    const isPresidentSolo = (apc.presidentId === pid && !apc.treasurerId);

    if (!isTreasurer && !isPresidentSolo) {
      if (window.ProtecDialog) await window.ProtecDialog.alert('La fixation du barème départemental de renfort est réservée au Trésorier.', 'Accès Réservé');
      return;
    }

    const cleanVal = Math.max(50, Math.min(2000, Number(newAmount || 150)));
    apc.renfortIndemniteBase = cleanVal;
    await this.saveAPC(apc);
    game.showToast('Barème Renfort APC Actualisé', `L'indemnité de base fixée par l'APC pour les renforts départementaux est désormais de ${cleanVal} €.`, 'green');
    this.renderModal(game);
  },

  // Récupère l'indemnité de déplacement de base fixée par l'APC pour un renfort
  getDeptRenfortIndemniteBase(game, options = {}) {
    const deptCode = String(game?.player?.departmentCode || game?.currentDepartmentCode || '54').trim().toUpperCase();
    let apc = this.cachedAPC;
    if (!apc || apc.departmentCode !== deptCode) {
      try {
        apc = JSON.parse(localStorage.getItem(`protec_apc_${deptCode}`) || 'null');
      } catch (e) {}
    }
    const baseFixed = (apc && Number(apc.renfortIndemniteBase) > 0) ? Number(apc.renfortIndemniteBase) : 150;

    const targetStation = options.targetStation;
    const myStation = game?.stations?.[0];
    const destination = options.destination || 'base'; // 'base' (sur la base locale) ou 'site' (sur site mission)
    let distKm = 0;

    if (targetStation && targetStation.lat && targetStation.lng) {
      if (destination === 'base' && myStation && myStation.lat && myStation.lng) {
        distKm = (window.ProtecDepartements && typeof window.ProtecDepartements.calculateDistance === 'function')
          ? window.ProtecDepartements.calculateDistance(targetStation.lat, targetStation.lng, myStation.lat, myStation.lng)
          : Math.hypot((targetStation.lat - myStation.lat) * 111, (targetStation.lng - myStation.lng) * 75);
      } else if (destination === 'site' && options.mission && options.mission.lat && options.mission.lng) {
        distKm = (window.ProtecDepartements && typeof window.ProtecDepartements.calculateDistance === 'function')
          ? window.ProtecDepartements.calculateDistance(targetStation.lat, targetStation.lng, options.mission.lat, options.mission.lng)
          : Math.hypot((targetStation.lat - options.mission.lat) * 111, (targetStation.lng - options.mission.lng) * 75);
      } else if (myStation && myStation.lat && myStation.lng) {
        distKm = (window.ProtecDepartements && typeof window.ProtecDepartements.calculateDistance === 'function')
          ? window.ProtecDepartements.calculateDistance(targetStation.lat, targetStation.lng, myStation.lat, myStation.lng)
          : Math.hypot((targetStation.lat - myStation.lat) * 111, (targetStation.lng - myStation.lng) * 75);
      }
    }

    // Barème kilométrique APC : Base forfaitaire + indemnité kilométrique au-delà de 8 km (0.45 €/km A/R)
    let totalComputed = baseFixed;
    if (distKm > 8) {
      const extraKm = Math.round(distKm * 2);
      totalComputed += Math.round(extraKm * 0.45);
    }

    const rounded = Math.round(totalComputed / 10) * 10;
    return {
      baseFixed: baseFixed,
      computed: rounded,
      distKm: Math.round(distKm),
      destination: destination,
      deptCode: deptCode
    };
  },

  // Achat d'un matériel lourd mutualisé par la caisse départementale
  async buyMutualEquipment(materialId, game) {
    const apc = await this.getAPCData(game);
    const pid = game.player?.id;
    const isPresident = (apc.presidentId === pid);

    if (!isPresident) {
      await window.ProtecDialog.alert('L’acquisition de matériel mutualisé d’appui relève de la décision du Président.', 'Accès Réservé');
      return;
    }

    const item = this.CATALOGUE_MATERIEL.find(m => m.id === materialId);
    if (!item) return;

    if (apc.treasury < item.price) {
      await window.ProtecDialog.alert(`Fonds départementaux insuffisants. Requis : ${item.price.toLocaleString('fr-FR')} € (Trésorerie APC : ${apc.treasury.toLocaleString('fr-FR')} €).`, 'Trésorerie Insuffisante');
      return;
    }

    apc.treasury -= item.price;
    if (!apc.mutualEquipment) apc.mutualEquipment = [];
    apc.mutualEquipment.push({
      id: `apc_${item.type.toLowerCase()}_${Date.now()}`,
      type: item.type,
      name: `${item.name} (${apc.departmentCode})`,
      borrowedByStationId: null,
      borrowedByPlayerId: null,
      borrowedUntil: null,
      condition: 100
    });

    await this.saveAPC(apc);
    game.showToast('Matériel Acquis !', `Le ${item.name} a été acheté par l’APC et rejoint le parc départemental mutualisé.`, 'green');
    this.renderModal(game);
  },

  // Emprunt temporaire d'un matériel mutualisé par une antenne non endettée
  async borrowEquipment(equipId, game) {
    const apc = await this.getAPCData(game);
    if (this.isPlayerInDebt(game, apc)) {
      await window.ProtecDialog.alert('Votre antenne est en situation d’endettement. Vous devez solder votre dette envers l’APC pour pouvoir emprunter du matériel mutualisé.', 'Dette Active');
      return;
    }

    const eq = (apc.mutualEquipment || []).find(e => e.id === equipId);
    if (!eq) return;

    if (eq.borrowedByPlayerId) {
      await window.ProtecDialog.alert('Ce matériel est actuellement déployé auprès d’une autre antenne.', 'Déjà Emprunté');
      return;
    }

    const station = game.stations?.[0];
    eq.borrowedByPlayerId = game.player?.id;
    eq.borrowedByStationId = station?.id || 'st_local';
    eq.borrowedUntil = Date.now() + (3 * 24 * 3600 * 1000); // Emprunt pour 3 jours

    // Ajouter le véhicule à la flotte active du joueur
    if (!game.vehicles) game.vehicles = [];
    game.vehicles.push({
      id: eq.id,
      name: `[APC] ${eq.name}`,
      type: eq.type,
      isMutualApc: true,
      condition: eq.condition || 100,
      status: 'disponible',
      stationId: station?.id
    });

    await this.saveAPC(apc);
    game.showToast('Matériel Mis à Disposition', `Le ${eq.name} a été affecté à votre antenne pour appui opérationnel.`, 'green');
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Restitution d'un matériel mutualisé
  async returnEquipment(equipId, game) {
    const apc = await this.getAPCData(game);
    const eq = (apc.mutualEquipment || []).find(e => e.id === equipId);
    if (!eq) return;

    eq.borrowedByPlayerId = null;
    eq.borrowedByStationId = null;
    eq.borrowedUntil = null;

    // Retirer de la flotte du joueur
    game.vehicles = (game.vehicles || []).filter(v => v.id !== equipId);

    await this.saveAPC(apc);
    game.showToast('Matériel Restitué', 'Le matériel a réintégré le parc d’appui départemental.', 'blue');
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Déblocage d'une convention-cadre départementale
  async unlockConvention(convId, game) {
    const apc = await this.getAPCData(game);
    const pid = game.player?.id;
    const isPresident = (apc.presidentId === pid);

    if (!isPresident) {
      await window.ProtecDialog.alert('Seul le Président peut signer les conventions-cadres départementales.', 'Accès Réservé');
      return;
    }

    const conv = this.CONVENTIONS_APC.find(c => c.id === convId);
    if (!conv) return;

    if ((apc.conventions || []).includes(conv.id)) {
      await window.ProtecDialog.alert('Cette convention est déjà active dans le département.', 'Déjà Active');
      return;
    }

    if (apc.treasury < conv.cost) {
      await window.ProtecDialog.alert(`Trésorerie départementale insuffisante. Coût : ${conv.cost.toLocaleString('fr-FR')} €.`, 'Trésorerie Insuffisante');
      return;
    }

    apc.treasury -= conv.cost;
    if (!apc.conventions) apc.conventions = [];
    apc.conventions.push(conv.id);

    await this.saveAPC(apc);
    game.showToast('Convention Signée !', `La convention « ${conv.name} » est entrée en vigueur pour tout le département.`, 'purple');
    this.renderModal(game);
  },

  // Solder manuellement sa dette envers l'APC
  async payOffDebt(game) {
    const apc = await this.getAPCData(game);
    const pid = game.player?.id;
    if (!pid || !apc.debts || !apc.debts[pid]) return;

    const debt = Number(apc.debts[pid]);
    const currentMoney = Number(game.resources?.money || 0);

    if (currentMoney < debt) {
      await window.ProtecDialog.alert(`Vous ne disposez pas des fonds nécessaires pour solder votre dette de ${debt.toLocaleString('fr-FR')} € (Trésorerie actuelle : ${currentMoney.toLocaleString('fr-FR')} €).`, 'Fonds Insuffisants');
      return;
    }

    game.resources.money -= debt;
    apc.treasury = (apc.treasury || 0) + debt;
    delete apc.debts[pid];

    await this.saveAPC(apc);
    game.updateStatsUI();
    game.showToast('Dette Soldée !', 'Votre antenne est de nouveau en règle avec l’APC départementale.', 'green');
    this.renderModal(game);
  },

  // =========================================================================
  // DÉCISIONS DE DIRECTION DU DÉPARTEMENT (DÉLIBÉRATIONS & VOTES)
  // =========================================================================

  // Récupère l'état d'adoption de la décision d'engagement autonome en crise
  getCrisisAutonomousStatus(apc, game) {
    const defaultRes = { isAdopted: false, pourCount: 0, contreCount: 0, totalVotes: 0, totalPlayers: 1, isSolo: true, myVote: null };
    if (!apc) return defaultRes;

    const dec = apc.crisisAutonomousRequisition || {};
    const votes = dec.votes || {};
    const entries = Object.entries(votes);

    let pourCount = 0;
    let contreCount = 0;
    entries.forEach(([pid, vObj]) => {
      const val = typeof vObj === 'string' ? vObj : vObj?.vote;
      if (val === 'pour') pourCount++;
      else if (val === 'contre') contreCount++;
    });

    const myId = game?.player?.id || 'usr_player';
    const myVoteObj = votes[myId];
    const myVote = typeof myVoteObj === 'string' ? myVoteObj : myVoteObj?.vote || null;

    const totalPlayers = (this.deptPlayersCache && this.deptPlayersCache.length) || 1;
    const isSolo = totalPlayers <= 1;

    // En solo, le vote du joueur fait loi. À plusieurs, majorité des suffrages exprimés (pour > contre)
    let isAdopted = false;
    if (isSolo) {
      isAdopted = (myVote === 'pour');
    } else {
      isAdopted = (pourCount > contreCount);
    }

    return {
      isAdopted,
      pourCount,
      contreCount,
      totalVotes: pourCount + contreCount,
      totalPlayers,
      isSolo,
      myVote
    };
  },

  // Voter pour ou contre la décision d'engagement autonome en crise
  async voteCrisisAutonomousRequisition(choice, game) {
    if (!['pour', 'contre'].includes(choice)) return;
    const apc = await this.getAPCData(game);
    const playerId = game.player?.id || 'usr_player';
    const playerName = game.player?.name || 'Directeur';

    if (!apc.crisisAutonomousRequisition) {
      apc.crisisAutonomousRequisition = {
        title: "Engagement Autonome Inter-Antennes en Temps de Crise",
        description: "Autoriser l'engagement en autonomie d'un engin avec équipage complet d'un confrère sans validation préalable, exclusivement lors des crises majeures.",
        votes: {}
      };
    }
    if (!apc.crisisAutonomousRequisition.votes) apc.crisisAutonomousRequisition.votes = {};

    apc.crisisAutonomousRequisition.votes[playerId] = {
      vote: choice,
      voterName: playerName,
      stationName: game.stations?.[0]?.name || 'Antenne Locale',
      votedAt: new Date().toISOString()
    };

    await this.saveAPC(apc);
    const label = choice === 'pour' ? 'POUR (Autonomie autorisée en crise)' : 'CONTRE (Accord individuel obligatoire)';
    game.showToast(
      'Suffrage Enregistré 🗳️',
      `Votre vote « ${label} » a été consigné au registre des décisions de direction de l'APC.`,
      choice === 'pour' ? 'green' : 'orange'
    );
    this.renderModal(game);
  },

  // Définir la stratégie d'alerte en cas de crise départementale (Arbitrage du Président de l'APC)
  async setCrisisAlertStrategy(strategy, game) {
    if (!['proche', 'astreinte', 'tous'].includes(strategy)) return;
    const apc = await this.getAPCData(game);
    const pid = game.player?.id;
    const isPresident = (apc.presidentId === pid) || (this.deptPlayersCache.length <= 1);

    if (!isPresident) {
      if (window.ProtecDialog) {
        await window.ProtecDialog.alert('Seul le Président de l’APC départementale peut modifier la stratégie d’alerte de crise.', 'Action Réservée au Président');
      } else {
        alert('Seul le Président de l’APC départementale peut modifier la stratégie d’alerte de crise.');
      }
      return;
    }

    apc.crisisAlertStrategy = strategy;
    await this.saveAPC(apc);

    // Diffusion temps réel aux directeurs du département
    if (window.ProtecSupabase && typeof window.ProtecSupabase.broadcastDepartmentCrisisUpdate === 'function') {
      window.ProtecSupabase.broadcastDepartmentCrisisUpdate({
        departmentCode: apc.departmentCode,
        status: 'apc_strategy_update',
        crisisAlertStrategy: strategy,
        presidentName: apc.presidentName
      });
    }

    const labels = {
      proche: 'Antenne la plus proche en priorité',
      astreinte: 'Astreinte Départementale en priorité',
      tous: 'Alerte générale simultanée (Tous les joueurs)'
    };

    game.showToast(
      'Décision Présidentielle Enregistrée ⚖️',
      `La stratégie d'alerte de crise départementale est désormais : « ${labels[strategy]} ».`,
      'green'
    );

    this.renderModal(game);
  },

  // =========================================================================
  // RENDU INTERFACE UTILISATEUR & MODALE APC
  // =========================================================================

  async renderModal(game) {
    const apc = await this.getAPCData(game, true);
    const schedule = this.getElectionSchedule(game.clock);
    const pid = game.player?.id;
    const isPresident = (apc.presidentId === pid);
    const isTreasurer = (apc.treasurerId === pid);
    const isSecretary = (apc.secretaryId === pid);
    const hasDebt = this.isPlayerInDebt(game, apc);
    const debtAmount = hasDebt ? apc.debts[pid] : 0;
    const players = this.deptPlayersCache || [];
    const isSolo = (players.length <= 1);

    const titleEl = document.getElementById('modal-title');
    const subtitleEl = document.getElementById('modal-subtitle');
    const iconEl = document.getElementById('modal-icon');
    const bodyEl = document.getElementById('modal-body');

    if (titleEl) titleEl.textContent = `APC ${apc.departmentCode} • Gouvernance Départementale`;
    if (subtitleEl) subtitleEl.textContent = `Association de Protection Civile du Département ${apc.departmentCode} • Autonomie des Antennes & Coordination Fédérale`;
    if (iconEl) iconEl.setAttribute('data-lucide', 'landmark');

    const subnavClass = (tab) => this.activeTab === tab 
      ? 'px-3.5 py-2 rounded-xl text-xs font-black bg-pc-blue text-white shadow-sm transition cursor-pointer flex items-center gap-1.5'
      : 'px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5';

    let content = `
      <div class="space-y-4">
        <!-- BANDEAU ÉTAT GÉNÉRAL APC & DETTE -->
        <div class="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-pc-blue-dark to-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
              🏛️
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-base font-black tracking-wide">${apc.name}</h4>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${isSolo ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'}">
                  ${isSolo ? '1 Antenne (Solo)' : `${players.length} Antennes Conventionnées`}
                </span>
              </div>
              <p class="text-xs text-slate-300 font-medium">Président : <strong class="text-white">${apc.presidentName}</strong> • Trésorerie APC : <strong class="text-emerald-400 mono-num">${Number(apc.treasury || 0).toLocaleString('fr-FR')} €</strong></p>
            </div>
          </div>
          <div class="flex items-center gap-2 self-end sm:self-center">
            ${hasDebt ? `
              <div class="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center gap-2">
                <span>⚠️ Dette : ${debtAmount} €</span>
                <button onclick="window.ProtecAPC.payOffDebt(window.game)" class="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] transition cursor-pointer">
                  Régulariser
                </button>
              </div>
            ` : `
              <div class="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <span>✓ Antenne à jour de cotisation</span>
              </div>
            `}
          </div>
        </div>

        <!-- NAVIGATION SOUS-ONGLETS APC -->
        <div class="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto no-scrollbar">
          <button onclick="window.ProtecAPC.switchTab('tableau_bord', window.game)" class="${subnavClass('tableau_bord')}">
            <span>📊 Tableau de Bord</span>
          </button>
          <button onclick="window.ProtecAPC.switchTab('elections', window.game)" class="${subnavClass('elections')}">
            <span>🗳️ Scrutin Bimensuel</span>
            ${schedule.isVotingDay ? '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>' : ''}
          </button>
          <button onclick="window.ProtecAPC.switchTab('politique', window.game)" class="${subnavClass('politique')}">
            <span>📜 Conventions & Décisions</span>
          </button>
          <button onclick="window.ProtecAPC.switchTab('materiel', window.game)" class="${subnavClass('materiel')}">
            <span>🚛 Parc Matériel d’Appui</span>
          </button>
          <button onclick="window.ProtecAPC.switchTab('finances', window.game)" class="${subnavClass('finances')}">
            <span>💶 Cotisation & Caisse</span>
          </button>
        </div>

        <!-- CONTENU DYNAMIQUE DE L'ONGLET SÉLECTIONNÉ -->
    `;

    if (this.activeTab === 'tableau_bord') {
      content += this.renderTabDashboard(game, apc, isPresident, isTreasurer, isSecretary, isSolo, players);
    } else if (this.activeTab === 'elections') {
      content += this.renderTabElections(game, apc, schedule, players, isSolo);
    } else if (this.activeTab === 'politique') {
      content += this.renderTabPolicy(game, apc, isPresident);
    } else if (this.activeTab === 'materiel') {
      content += this.renderTabEquipment(game, apc, isPresident, hasDebt);
    } else if (this.activeTab === 'finances') {
      content += this.renderTabFinances(game, apc, isTreasurer, isPresident, hasDebt, debtAmount);
    }

    content += `</div>`;

    if (bodyEl) {
      bodyEl.innerHTML = content;
      if (window.lucide) window.lucide.createIcons();
    }
  },

  switchTab(tab, game) {
    this.activeTab = tab;
    this.renderModal(game);
  },

  // 1. Onglet Tableau de bord (Bureau et Antennes)
  renderTabDashboard(game, apc, isPresident, isTreasurer, isSecretary, isSolo, players) {
    return `
      <div class="space-y-4">
        <!-- COMPOSITION DU BUREAU DÉPARTEMENTAL -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>🏛️ Bureau Départemental Élu & Nommé</span>
            </h5>
            <span class="text-[10px] text-slate-400 font-bold">Mandat bimensuel en cours</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- Président -->
            <div class="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-col justify-between">
              <div>
                <span class="text-[10px] font-black uppercase text-indigo-700 block mb-1">Président (Élu par scrutin)</span>
                <strong class="text-sm font-black text-slate-900 block">${apc.presidentName}</strong>
                <span class="text-[10px] text-slate-500 font-medium">${apc.presidentId === game.player?.id ? '👑 C’est vous' : 'Directeur élu'}</span>
              </div>
              <div class="mt-2 text-[10px] text-indigo-900 font-semibold bg-white/80 p-1.5 rounded-lg border border-indigo-100">
                Pouvoirs : Présidence du bureau, nomination Trésorier/Secrétaire, signature des conventions et achats lourds.
              </div>
            </div>

            <!-- Trésorier -->
            <div class="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
              <div>
                <span class="text-[10px] font-black uppercase text-emerald-700 block mb-1">Trésorier Départemental</span>
                <strong class="text-sm font-black text-slate-900 block">${apc.treasurerName || 'Non pourvu (Cumul Président)'}</strong>
                <span class="text-[10px] text-slate-500 font-medium">${apc.treasurerId === game.player?.id ? '💼 C’est vous' : (apc.treasurerId ? 'Nommé par le Président' : 'Assuré par le Président')}</span>
              </div>
              <div class="mt-2 text-[10px] text-emerald-900 font-semibold bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                Pouvoirs : Fixation de la cotisation journalière, gestion des dettes, contrôle de la caisse départementale.
              </div>
              ${isPresident && !isSolo ? `
                <div class="mt-2 pt-2 border-t border-emerald-200/60">
                  <select onchange="window.ProtecAPC.appointTreasurer(this.value, window.game)" class="w-full text-[10px] font-bold p-1 rounded-lg border border-slate-300 bg-white">
                    <option value="">Nommer un Trésorier...</option>
                    ${players.map(p => `<option value="${p.id}" ${p.id === apc.treasurerId ? 'selected' : ''}>${p.name}</option>`).join('')}
                  </select>
                </div>
              ` : ''}
              ${isTreasurer && !isPresident ? `
                <button onclick="window.ProtecAPC.resignOffice('tresorier', window.game)" class="mt-2 px-2 py-1 rounded text-[10px] font-bold bg-rose-100 text-rose-800 hover:bg-rose-200">
                  Démissionner
                </button>
              ` : ''}
            </div>

            <!-- Secrétaire Général -->
            <div class="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 flex flex-col justify-between">
              <div>
                <span class="text-[10px] font-black uppercase text-sky-700 block mb-1">Secrétaire Général</span>
                <strong class="text-sm font-black text-slate-900 block">${apc.secretaryName || 'Non pourvu (Cumul Président)'}</strong>
                <span class="text-[10px] text-slate-500 font-medium">${apc.secretaryId === game.player?.id ? '📝 C’est vous' : (apc.secretaryId ? 'Nommé par le Président' : 'Assuré par le Président')}</span>
              </div>
              <div class="mt-2 text-[10px] text-sky-900 font-semibold bg-white/80 p-1.5 rounded-lg border border-sky-100">
                Pouvoirs : Tenue du registre des antennes, organisation des votes bimensuels, rapports de coordination.
              </div>
              ${isPresident && !isSolo ? `
                <div class="mt-2 pt-2 border-t border-sky-200/60">
                  <select onchange="window.ProtecAPC.appointSecretary(this.value, window.game)" class="w-full text-[10px] font-bold p-1 rounded-lg border border-slate-300 bg-white">
                    <option value="">Nommer un Secrétaire...</option>
                    ${players.map(p => `<option value="${p.id}" ${p.id === apc.secretaryId ? 'selected' : ''}>${p.name}</option>`).join('')}
                  </select>
                </div>
              ` : ''}
              ${isSecretary && !isPresident ? `
                <button onclick="window.ProtecAPC.resignOffice('secretaire', window.game)" class="mt-2 px-2 py-1 rounded text-[10px] font-bold bg-rose-100 text-rose-800 hover:bg-rose-200">
                  Démissionner
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- LISTE DES ANTENNES LOCALES DU DÉPARTEMENT -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>📍 Antennes Départementales Rattachées (${players.length})</span>
            </h5>
            <span class="text-[10px] text-slate-400 font-bold">Autonomie opérationnelle garantie</span>
          </div>

          <div class="divide-y divide-slate-100">
            ${players.map(p => {
              const pDebt = (apc.debts && apc.debts[p.id]) || 0;
              const isPres = (p.id === apc.presidentId);
              const isTres = (p.id === apc.treasurerId);
              const isSecr = (p.id === apc.secretaryId);

              return `
                <div class="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div class="flex items-center gap-1.5">
                      <strong class="font-extrabold text-slate-900">${p.name}</strong>
                      ${isPres ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-100 text-indigo-800">Président</span>' : ''}
                      ${isTres ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">Trésorier</span>' : ''}
                      ${isSecr ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-sky-100 text-sky-800">Secrétaire</span>' : ''}
                    </div>
                    <span class="text-[11px] text-slate-500">${p.stationName || 'Antenne'} • ${p.city || apc.departmentCode}</span>
                  </div>
                  <div class="text-right">
                    ${pDebt > 0 ? `
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Dette : ${pDebt} €</span>
                    ` : `
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">À jour (Cotisation OK)</span>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // 2. Onglet Élections Bimensuelles
  renderTabElections(game, apc, schedule, players, isSolo) {
    const userVote = apc.currentVotes?.[game.player?.id];

    return `
      <div class="space-y-4">
        <!-- BANDEAU CALENDRIER BIMENSUEL OFFICIEL -->
        <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-black text-xs uppercase flex items-center gap-1.5">
              <span>📅 Calendrier Électoral Bimensuel Strict</span>
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black ${schedule.isVotingDay ? 'bg-emerald-600 text-white animate-pulse' : 'bg-amber-200 text-amber-900'}">
              ${schedule.isVotingDay ? 'URNE OUVERTE (VOTE EN COURS)' : 'SCRUTIN FERMÉ'}
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div class="p-2.5 rounded-xl bg-white border border-amber-200/80">
              <strong class="block text-slate-900 font-extrabold">1. Scrutin de Mi-Mois</strong>
              <span class="text-[11px] text-slate-600">Vote : <strong>Le 13 du mois</strong> (00h00 - 23h59)</span><br/>
              <span class="text-[11px] text-slate-600">Prise de fonction : <strong>Le 14 du mois à 00h00</strong></span>
            </div>
            <div class="p-2.5 rounded-xl bg-white border border-amber-200/80">
              <strong class="block text-slate-900 font-extrabold">2. Scrutin de Fin de Mois</strong>
              <span class="text-[11px] text-slate-600">Vote : <strong>La veille du 1er</strong> (dernier jour du mois)</span><br/>
              <span class="text-[11px] text-slate-600">Prise de fonction : <strong>Le 1er du mois suivant à 00h00</strong></span>
            </div>
          </div>
          <p class="text-[11px] text-amber-800">
            Règle fédérale : Les joueurs votent uniquement pour le <strong>Président</strong> (1 antenne = 1 voix). Le Président élu nomme ensuite son Trésorier et son Secrétaire.
          </p>
        </div>

        ${isSolo ? `
          <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <span class="text-3xl">👤</span>
            <h5 class="text-sm font-black text-slate-800">Antenne Unique dans le Département</h5>
            <p class="text-xs text-slate-500 max-w-md mx-auto">
              Vous êtes actuellement la seule antenne implantée dans le département ${apc.departmentCode}. Aucun vote contradictoire n'est déclenché : vous conservez automatiquement votre mandat présidentiel et assurez le plein cumul des rôles.
            </p>
          </div>
        ` : `
          <!-- BULLETINS ET VOTE EN COURS -->
          <div class="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
            <div class="flex items-center justify-between">
              <h5 class="text-xs font-black uppercase tracking-wider text-slate-800">Vote pour la Présidence Départementale</h5>
              <span class="text-[10px] text-slate-500">Prochaine prise de fonction : <strong>${schedule.takeOfficeDateStr}</strong></span>
            </div>

            <div class="space-y-2">
              ${players.map(p => {
                const isSelected = (userVote === p.id);
                const isCurrentPres = (p.id === apc.presidentId);

                return `
                  <div class="p-3 rounded-xl border ${isSelected ? 'border-pc-blue bg-blue-50/50 ring-2 ring-pc-blue/20' : 'border-slate-200 bg-slate-50/50'} flex items-center justify-between">
                    <div>
                      <strong class="text-xs font-extrabold text-slate-900">${p.name}</strong>
                      <span class="text-[10px] text-slate-500 block">${p.stationName} ${isCurrentPres ? '• (Président sortant)' : ''}</span>
                    </div>
                    <div>
                      ${schedule.isVotingDay ? `
                        <button onclick="window.ProtecAPC.voteForPresident('${p.id}', window.game)" class="px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${isSelected ? 'bg-pc-blue text-white shadow-sm' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}">
                          ${isSelected ? '✓ Votre Choix' : 'Voter'}
                        </button>
                      ` : `
                        <span class="text-[10px] font-bold text-slate-400">Scrutin fermé</span>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `}

        <!-- HISTORIQUE DES MANDATS PRÉCÉDENTS -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
          <h5 class="text-xs font-black uppercase tracking-wider text-slate-700">Historique des Élections Départementales</h5>
          <div class="divide-y divide-slate-100 max-h-48 overflow-y-auto">
            ${(apc.electionHistory || []).length === 0 ? `
              <div class="text-[11px] text-slate-400 italic py-2">Aucune élection archivée (Mandat d'implantation initial en cours).</div>
            ` : apc.electionHistory.map(h => `
              <div class="py-2 flex items-center justify-between text-xs">
                <div>
                  <strong class="text-slate-800">${h.session}</strong>
                  <span class="text-[10px] text-slate-400 block">${h.date}</span>
                </div>
                <div class="text-right">
                  <span class="font-bold text-indigo-700">Élu : ${h.winnerName}</span>
                  <span class="text-[10px] text-slate-400 block">${h.votesCount} voix</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // 3. Onglet Conventions-Cadres & Décisions de Direction
  renderTabPolicy(game, apc, isPresident) {
    const activeConventions = apc.conventions || [];
    const status = this.getCrisisAutonomousStatus(apc, game);
    const totalVotes = status.totalVotes || 0;
    const pourPct = totalVotes > 0 ? Math.round((status.pourCount / totalVotes) * 100) : 0;
    const contrePct = totalVotes > 0 ? Math.round((status.contreCount / totalVotes) * 100) : 0;

    return `
      <div class="space-y-5">
        <!-- 1. DÉCISIONS DE DIRECTION DÉPARTEMENTALE & DÉLIBÉRATIONS DU CONSEIL -->
        <div class="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl shrink-0">
                🗳️
              </div>
              <div>
                <h5 class="text-xs font-black uppercase tracking-wider text-slate-800">
                  Décisions de Direction Départementale • Délibérations du Conseil
                </h5>
                <p class="text-[11px] text-slate-500">
                  Suffrages des directeurs d'antenne du département (${status.totalPlayers} antenne(s) avec droit de vote • 1 antenne = 1 voix)
                </p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              status.isAdopted 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }">
              ${status.isAdopted ? '✓ Décision Adoptée & En Vigueur' : '✕ Décision Non Adoptée'}
            </span>
          </div>

          <!-- CARTE DÉLIBÉRATION ENGAGEMENT EN CRISE -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
                  Crises Majeures Uniquement
                </span>
                <strong class="text-xs sm:text-sm font-black text-slate-900">
                  Engagement en autonomie d'un engin avec personnel d'un autre joueur sans validation
                </strong>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">
                <strong>Objet du vote :</strong> Décider si une antenne départementale confrontée à une <strong>situation de crise majeure</strong> (inondations, catastrophes naturelles, plan NOVI, tempêtes) est autorisée à <strong>engager d'office et en autonomie un véhicule avec son personnel complet d'une autre antenne sans devoir attendre sa validation manuelle</strong>.
              </p>
              <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start sm:items-center gap-2">
                <span class="text-base shrink-0">⚠️</span>
                <span>Règle de sauvegarde : Cette mesure d'exception s'applique <strong>strictement et uniquement lors des crises</strong>. Sur les DPS réguliers, l'accord individuel du directeur reste formellement obligatoire.</span>
              </div>
            </div>

            <!-- JAUGE DE VOTE DES DIRECTEURS -->
            <div class="space-y-1.5 pt-2">
              <div class="flex items-center justify-between text-xs font-bold text-slate-700">
                <span class="text-emerald-700 flex items-center gap-1">
                  <span>👍 Pour (Favorable à l'autonomie) :</span>
                  <strong>${status.pourCount} voix ${totalVotes > 0 ? `(${pourPct}%)` : ''}</strong>
                </span>
                <span class="text-rose-700 flex items-center gap-1">
                  <span>👎 Contre (Accord préalable obligatoire) :</span>
                  <strong>${status.contreCount} voix ${totalVotes > 0 ? `(${contrePct}%)` : ''}</strong>
                </span>
              </div>
              <div class="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                <div class="bg-emerald-500 transition-all duration-300" style="width: ${totalVotes > 0 ? pourPct : 0}%"></div>
                <div class="bg-rose-500 transition-all duration-300" style="width: ${totalVotes > 0 ? contrePct : 0}%"></div>
              </div>
              <div class="text-[10px] text-slate-400 flex items-center justify-between flex-wrap gap-1">
                <span>${status.totalVotes} vote(s) exprimé(s) / ${status.totalPlayers} directeur(s)</span>
                <span class="font-bold ${status.isAdopted ? 'text-emerald-700' : 'text-slate-500'}">
                  ${status.isAdopted 
                    ? '🟢 Majorité Pour : Réquisition autonome d\'urgence autorisée sur les crises' 
                    : '🔴 Majorité non atteinte : Accord préalable individuel maintenu'}
                </span>
              </div>
            </div>

            <!-- BOUTONS D'ACTION POUR VOTER -->
            <div class="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div class="text-xs">
                <span class="font-bold text-slate-700">Votre suffrage :</span>
                ${status.myVote === 'pour' ? `
                  <span class="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black ml-1.5 inline-flex items-center gap-1">
                    <span>✓</span> <span>Vous avez voté POUR</span>
                  </span>
                ` : (status.myVote === 'contre' ? `
                  <span class="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-black ml-1.5 inline-flex items-center gap-1">
                    <span>✕</span> <span>Vous avez voté CONTRE</span>
                  </span>
                ` : `
                  <span class="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-600 font-bold ml-1.5">
                    Aucun vote exprimé
                  </span>
                `)}
              </div>

              <div class="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  type="button" 
                  onclick="window.ProtecAPC.voteCrisisAutonomousRequisition('pour', window.game)" 
                  class="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    status.myVote === 'pour'
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs active:scale-95'
                  }">
                  <span>👍</span>
                  <span>Voter POUR</span>
                </button>

                <button 
                  type="button" 
                  onclick="window.ProtecAPC.voteCrisisAutonomousRequisition('contre', window.game)" 
                  class="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    status.myVote === 'contre'
                      ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs active:scale-95'
                  }">
                  <span>👎</span>
                  <span>Voter CONTRE</span>
                </button>
              </div>
            </div>
          </div>

          <!-- CARTE DÉCISION PRÉSIDENTIELLE : STRATÉGIE D'ALERTE EN CAS DE CRISE -->
          <div class="p-4 rounded-2xl bg-gradient-to-br from-amber-500/5 via-slate-50 to-orange-500/5 border border-slate-200 space-y-3.5">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2 py-0.5 rounded text-[10px] font-black bg-pc-orange text-white uppercase tracking-wider">
                  Décision Présidentielle APC
                </span>
                <strong class="text-xs sm:text-sm font-black text-slate-900">
                  Stratégie d'Alerte et d'Escalade en Cas de Crise Départementale
                </strong>
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-900 border border-indigo-200">
                ${isPresident ? '⚙️ Arbitrage du Président' : '🔒 Règle Fédérale Fixée'}
              </span>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed">
              En cas d'accident ferroviaire, plan NOVI, catastrophe météo ou réquisition préfectorale d'urgence, définissez à quel échelon l'alerte opérationnelle est envoyée en première intention.
            </p>

            <!-- Les 3 options de stratégie d'alerte -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              
              <!-- Option 1 : Proche en priorité -->
              ${(() => {
                const currentStrat = apc.crisisAlertStrategy || 'proche';
                const isSelected = currentStrat === 'proche';
                return `
                  <div class="p-3.5 rounded-2xl border transition-all ${
                    isSelected 
                      ? 'border-pc-orange bg-orange-50/70 shadow-sm ring-2 ring-orange-300/60' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  } flex flex-col justify-between space-y-2.5">
                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between">
                        <span class="text-xl">📍</span>
                        ${isSelected ? '<span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-pc-orange text-white uppercase">✓ En Vigueur</span>' : ''}
                      </div>
                      <h6 class="text-xs font-black text-slate-900">1. Antenne la plus proche en priorité</h6>
                      <p class="text-[11px] text-slate-600 leading-snug">
                        L'alerte prioritaire est adressée au directeur le plus proche géographiquement du sinistre (délai de 45s).
                      </p>
                      <div class="text-[10px] text-slate-500 pt-1 border-t border-slate-100 space-y-0.5 font-semibold">
                        <div>⏱️ Escalade 1 : Astreinte Départementale</div>
                        <div>📢 Escalade 2 : Tous les Directeurs</div>
                      </div>
                    </div>
                    ${isPresident ? `
                      <button 
                        type="button" 
                        onclick="window.ProtecAPC.setCrisisAlertStrategy('proche', window.game)" 
                        class="w-full py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected 
                            ? 'bg-pc-orange text-white shadow-xs' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }">
                        ${isSelected ? '✓ Règle Active' : 'Choisir cette règle'}
                      </button>
                    ` : ''}
                  </div>
                `;
              })()}

              <!-- Option 2 : Astreinte Départementale en priorité -->
              ${(() => {
                const currentStrat = apc.crisisAlertStrategy || 'proche';
                const isSelected = currentStrat === 'astreinte';
                return `
                  <div class="p-3.5 rounded-2xl border transition-all ${
                    isSelected 
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-300/60' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  } flex flex-col justify-between space-y-2.5">
                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between">
                        <span class="text-xl">🛡️</span>
                        ${isSelected ? '<span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white uppercase">✓ En Vigueur</span>' : ''}
                      </div>
                      <h6 class="text-xs font-black text-slate-900">2. Astreinte Départementale en priorité</h6>
                      <p class="text-[11px] text-slate-600 leading-snug">
                        L'alerte est transmise au cadre de permanence d'astreinte départementale en service.
                      </p>
                      <div class="text-[10px] text-slate-500 pt-1 border-t border-slate-100 space-y-0.5 font-semibold">
                        <div>⏱️ Si vacante/expirée : Antenne la plus proche</div>
                        <div>📢 Escalade 2 : Tous les Directeurs</div>
                      </div>
                    </div>
                    ${isPresident ? `
                      <button 
                        type="button" 
                        onclick="window.ProtecAPC.setCrisisAlertStrategy('astreinte', window.game)" 
                        class="w-full py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }">
                        ${isSelected ? '✓ Règle Active' : 'Choisir cette règle'}
                      </button>
                    ` : ''}
                  </div>
                `;
              })()}

              <!-- Option 3 : Tous les directeurs du département -->
              ${(() => {
                const currentStrat = apc.crisisAlertStrategy || 'proche';
                const isSelected = currentStrat === 'tous';
                return `
                  <div class="p-3.5 rounded-2xl border transition-all ${
                    isSelected 
                      ? 'border-red-600 bg-red-50/70 shadow-sm ring-2 ring-red-300/60' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  } flex flex-col justify-between space-y-2.5">
                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between">
                        <span class="text-xl">📢</span>
                        ${isSelected ? '<span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-600 text-white uppercase">✓ En Vigueur</span>' : ''}
                      </div>
                      <h6 class="text-xs font-black text-slate-900">3. Tous les Joueurs du Département</h6>
                      <p class="text-[11px] text-slate-600 leading-snug">
                        Alerte générale simultanée. Le premier directeur qui acquitte prend la main sur la gestion de crise.
                      </p>
                      <div class="text-[10px] text-slate-500 pt-1 border-t border-slate-100 space-y-0.5 font-semibold">
                        <div>⚡ Alerte instantanée sans délai d'attente</div>
                        <div>🤝 Possibilité de laisser la main ensuite</div>
                      </div>
                    </div>
                    ${isPresident ? `
                      <button 
                        type="button" 
                        onclick="window.ProtecAPC.setCrisisAlertStrategy('tous', window.game)" 
                        class="w-full py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected 
                            ? 'bg-red-600 text-white shadow-xs' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }">
                        ${isSelected ? '✓ Règle Active' : 'Choisir cette règle'}
                      </button>
                    ` : ''}
                  </div>
                `;
              })()}

            </div>
          </div>
        </div>

        <!-- 2. CONVENTIONS-CADRES DÉPARTEMENTALES -->
        <div class="space-y-3">
          <div class="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 space-y-1">
            <h5 class="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <span>📜 Conventions-Cadres Départementales (Effet de Réseau)</span>
            </h5>
            <p class="text-[11px] text-purple-800">
              Financées par la trésorerie commune de l'APC, les conventions-cadres renforcent les liens avec l'État et apportent des <strong>multiplicateurs financiers et de réputation</strong> à toutes les antennes non endettées du département.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-3">
            ${this.CONVENTIONS_APC.map(c => {
              const isUnlocked = activeConventions.includes(c.id);

              return `
                <div class="p-4 rounded-2xl bg-white border ${isUnlocked ? 'border-purple-300 ring-2 ring-purple-100' : 'border-slate-200'} shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div class="space-y-1 max-w-xl">
                    <div class="flex items-center gap-2">
                      <h6 class="text-xs font-black text-slate-900">${c.name}</h6>
                      ${isUnlocked ? '<span class="px-2 py-0.2 rounded-full text-[9px] font-black bg-purple-100 text-purple-800">✓ En Vigueur</span>' : ''}
                    </div>
                    <p class="text-[11px] text-slate-500">${c.description}</p>
                    <span class="text-[11px] font-bold text-emerald-700 block">${c.effect}</span>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    ${isUnlocked ? `
                      <span class="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-extrabold text-xs">Active</span>
                    ` : (isPresident ? `
                      <button onclick="window.ProtecAPC.unlockConvention('${c.id}', window.game)" class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md transition cursor-pointer">
                        Signer (${c.cost.toLocaleString('fr-FR')} €)
                      </button>
                    ` : `
                      <span class="text-[11px] text-slate-400 font-bold">Réservé au Président (${c.cost.toLocaleString('fr-FR')} €)</span>
                    `)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // 4. Onglet Parc Matériel Mutualisé
  renderTabEquipment(game, apc, isPresident, hasDebt) {
    const fleet = apc.mutualEquipment || [];
    const pid = game.player?.id;

    return `
      <div class="space-y-4">
        <div class="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 space-y-1">
          <h5 class="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <span>🚛 Véhicules d'Appui & Matériels Lourds Mutualisés</span>
          </h5>
          <p class="text-[11px] text-sky-800">
            Achetés par la caisse départementale et mis à disposition temporaire des antennes. Tout membre à jour de cotisation peut emprunter un vecteur disponible.
          </p>
        </div>

        <!-- FLOTTE ACTUELLE DE L'APC -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h6 class="text-xs font-black uppercase tracking-wider text-slate-800">Véhicules Détenus par l'APC (${fleet.length})</h6>
            <span class="text-[10px] text-slate-400 font-bold">Affectation temporaire</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${fleet.length === 0 ? `
              <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center col-span-2 text-xs text-slate-400 italic">
                Aucun véhicule lourd mutualisé détenu par l'APC. Le Président peut en acquérir via le catalogue ci-dessous.
              </div>
            ` : fleet.map(eq => {
              const isBorrowedByMe = (eq.borrowedByPlayerId === pid);
              const isBorrowedByOther = (eq.borrowedByPlayerId && !isBorrowedByMe);

              return `
                <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
                  <div>
                    <div class="flex items-center justify-between">
                      <strong class="text-xs font-black text-slate-900">${eq.name}</strong>
                      <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase ${isBorrowedByMe ? 'bg-emerald-100 text-emerald-800' : (isBorrowedByOther ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800')}">
                        ${isBorrowedByMe ? 'Affecté chez vous' : (isBorrowedByOther ? 'En mission allié' : 'Disponible en parc')}
                      </span>
                    </div>
                    <span class="text-[10px] text-slate-500 block mt-0.5">Type : ${eq.type} • État : ${eq.condition || 100}%</span>
                  </div>

                  <div class="pt-2 border-t border-slate-100 flex items-center justify-end">
                    ${isBorrowedByMe ? `
                      <button onclick="window.ProtecAPC.returnEquipment('${eq.id}', window.game)" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer">
                        Restituer à l’APC
                      </button>
                    ` : (isBorrowedByOther ? `
                      <span class="text-[10px] text-slate-400 font-bold">Emprunté jusqu’au ${eq.borrowedUntil ? new Date(eq.borrowedUntil).toLocaleDateString('fr-FR') : 'bientôt'}</span>
                    ` : `
                      <button onclick="window.ProtecAPC.borrowEquipment('${eq.id}', window.game)" class="px-3.5 py-1.5 rounded-xl bg-pc-blue hover:bg-blue-700 text-white font-black text-xs shadow-xs transition cursor-pointer">
                        Emprunter pour mon antenne
                      </button>
                    `)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- CATALOGUE D'ACQUISITION PRÉSIDENT -->
        ${isPresident ? `
          <div class="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
            <h6 class="text-xs font-black uppercase tracking-wider text-slate-800">Catalogue d'Acquisition (Caisse APC : ${Number(apc.treasury || 0).toLocaleString('fr-FR')} €)</h6>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${this.CATALOGUE_MATERIEL.map(m => `
                <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
                  <div>
                    <strong class="text-xs font-extrabold text-slate-900 block">${m.name}</strong>
                    <span class="text-[11px] text-slate-500 block leading-tight mt-0.5">${m.description}</span>
                    <span class="text-[10px] text-emerald-700 font-bold block mt-1">${m.bonus}</span>
                  </div>
                  <div class="flex items-center justify-between pt-1">
                    <span class="text-xs font-black text-slate-900 mono-num">${m.price.toLocaleString('fr-FR')} €</span>
                    <button onclick="window.ProtecAPC.buyMutualEquipment('${m.id}', window.game)" class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] shadow-xs transition cursor-pointer">
                      Acheter pour l’APC
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  // 5. Onglet Finances & Cotisation
  renderTabFinances(game, apc, isTreasurer, isPresident, hasDebt, debtAmount) {
    const isMasterOfFinance = (isTreasurer || (isPresident && !apc.treasurerId));

    return `
      <div class="space-y-4">
        <!-- SITUATION FINANCIÈRE DE L'ANTENNE DU JOUEUR -->
        <div class="p-4 rounded-2xl ${hasDebt ? 'bg-rose-50 border border-rose-300' : 'bg-emerald-50 border border-emerald-200'} space-y-2">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black uppercase tracking-wider ${hasDebt ? 'text-rose-900' : 'text-emerald-900'}">
              ${hasDebt ? '⚠️ Situation d’Endettement Active' : '✓ Situation en Règle'}
            </h5>
            <span class="text-xs font-extrabold mono-num ${hasDebt ? 'text-rose-700' : 'text-emerald-700'}">
              Cotisation journalière : ${apc.dailyContribution} € / jour
            </span>
          </div>
          <p class="text-[11px] ${hasDebt ? 'text-rose-800' : 'text-emerald-800'}">
            ${hasDebt ? `
              Votre antenne doit <strong>${debtAmount} €</strong> à l’APC suite à un prélèvement journalier non honoré. Tant que cette dette n'est pas soldée, vous perdez les bonus de conventions départementales et l'accès au parc matériel partagé.
            ` : `
              Votre antenne honore régulièrement sa cotisation. Vous bénéficiez du plein accès aux conventions et au matériel partagé.
            `}
          </p>
          ${hasDebt ? `
            <div class="pt-1">
              <button onclick="window.ProtecAPC.payOffDebt(window.game)" class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-sm transition cursor-pointer">
                Régulariser la Dette (${debtAmount} €)
              </button>
            </div>
          ` : ''}
        </div>

        <!-- GESTION DE LA COTISATION (RÉSERVÉE AU TRÉSORIER / PRÉSIDENT) -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black uppercase tracking-wider text-slate-800">Paramétrage de la Cotisation Départementale</h5>
            <span class="text-[10px] text-slate-400 font-bold">Rôle Trésorier</span>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-3">
            <div class="flex-1 w-full">
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Montant prélevé chaque jour par antenne (€) :</label>
              <input type="number" id="apc-input-contribution" min="0" max="250" value="${apc.dailyContribution}" ${isMasterOfFinance ? '' : 'disabled'}
                class="w-full px-3 py-2 rounded-xl border border-slate-300 font-extrabold text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none" />
            </div>
            ${isMasterOfFinance ? `
              <button onclick="window.ProtecAPC.updateDailyContribution(document.getElementById('apc-input-contribution').value, window.game)" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition cursor-pointer self-end sm:self-auto">
                Appliquer le Tarif
              </button>
            ` : `
              <span class="text-[10px] text-slate-400 italic">Modification réservée au Trésorier élu ou au Président.</span>
            `}
          </div>
        </div>

        <!-- BARÈME OFFICIEL APC : INDEMNITÉ DE DÉPLACEMENT POUR LES RENFORTS -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black uppercase tracking-wider text-slate-800">Barème d'Indemnité de Déplacement Renfort (APC)</h5>
            <span class="text-[10px] text-slate-400 font-bold">Base Départementale</span>
          </div>
          <p class="text-[11px] text-slate-500">
            Défraiement de base préconisé par l'APC pour un renfort inter-antennes (déplacement vers la base ou sur le dispositif). Chaque antenne reste libre d'ajuster ce montant lors de la demande.
          </p>

          <div class="flex flex-col sm:flex-row items-center gap-3">
            <div class="flex-1 w-full">
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Base forfaitaire par défaut (€) :</label>
              <input type="number" id="apc-input-renfort-indemnite" min="50" max="1000" step="10" value="${apc.renfortIndemniteBase || 150}" ${isMasterOfFinance ? '' : 'disabled'}
                class="w-full px-3 py-2 rounded-xl border border-slate-300 font-extrabold text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none" />
            </div>
            ${isMasterOfFinance ? `
              <button onclick="window.ProtecAPC.updateRenfortIndemnite(document.getElementById('apc-input-renfort-indemnite').value, window.game)" class="px-5 py-2.5 rounded-xl bg-pc-blue hover:brightness-110 text-white font-black text-xs shadow-md transition cursor-pointer self-end sm:self-auto">
                Enregistrer la Base APC
              </button>
            ` : `
              <span class="text-[10px] text-slate-400 italic">Modification réservée au Trésorier élu ou au Président.</span>
            `}
          </div>
        </div>

        <!-- RÉSUMÉ DE CAISSE DÉPARTEMENTALE -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span class="text-[10px] font-bold text-slate-400 block uppercase">Solde Caisse APC</span>
            <strong class="text-base font-black text-emerald-700 mono-num">${Number(apc.treasury || 0).toLocaleString('fr-FR')} €</strong>
          </div>
          <div>
            <span class="text-[10px] font-bold text-slate-400 block uppercase">Prime Astreinte Fédérale</span>
            <strong class="text-base font-black text-pc-blue mono-num">+${apc.astreinteBonus || 0} € / vacation</strong>
          </div>
        </div>
      </div>
    `;
  }
};
