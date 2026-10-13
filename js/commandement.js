/**
 * PROTEC LIVE - SYSTÈME DE COMMANDEMENT MOBILE & VL COMMANDEMENT (VLC)
 * 
 * Permet d'équiper une VL / VLHR avec le matériel « Poste de Commandement Mobile »
 * pour la transformer en VL Commandement (VLC) capable de :
 * 1. Piloter et gérer les crises majeures, plans NOVI, ORSEC et alertes préfectorales.
 * 2. Remplir le rôle d'un Poste de Commandement Mobile (PCM) sans nécessiter de poids lourd.
 * 3. Être mise en gestion directe pour un Chef de Dispositif (CD) ou un Chef de Poste (CP).
 */

window.ProtecCommandement = {
  KIT_ID: 'lot_poste_commandement_mobile',
  KIT_PRICE: 2800,

  /**
   * Vérifie si un véhicule est éligible pour recevoir le Poste de Commandement Mobile
   */
  isEligible(veh) {
    if (!veh) return false;
    if (veh.isCommandement || veh.hasCommandementKit) return true;
    const t = (veh.type || '').toUpperCase();
    return ['VL', 'VLHR', 'VLTT', 'VLC'].includes(t);
  },

  /**
   * Vérifie si un véhicule peut agir en tant que Poste de Commandement Mobile (PCM)
   */
  canActAsPCM(veh) {
    if (!veh) return false;
    return veh.type === 'PCM' || veh.isCommandement === true || veh.hasCommandementKit === true;
  },

  /**
   * Calcule le nombre de kits "Poste de Commandement Mobile" disponibles en stock
   */
  getAvailableKitsCount(game, stationId = null) {
    if (!game) game = window.game;
    const station = stationId 
      ? (game.stations || []).find(s => s.id === stationId) 
      : (game.stations || [])[0];

    const stationStock = (station && station.stock) ? (station.stock[this.KIT_ID] || 0) : 0;
    const globalStock = (game.workplaceEquipment) ? (game.workplaceEquipment[this.KIT_ID] || 0) : 0;
    const totalOwned = Math.max(stationStock, globalStock);

    const installedCount = (game.vehicles || []).filter(v => v.hasCommandementKit).length;
    return Math.max(0, totalOwned - installedCount);
  },

  /**
   * Récupère le bénévole chef en gestion d'un véhicule
   */
  getLeader(game, veh) {
    if (!game || !veh || !veh.assignedLeaderId) return null;
    return (game.volunteers || []).find(v => v.id === veh.assignedLeaderId) || null;
  },

  /**
   * Récupère la liste des bénévoles qualifiés pour être Chefs en gestion (CD ou CP)
   */
  getQualifiedLeaders(game, stationId = null) {
    if (!game) game = window.game;
    let vols = game.volunteers || [];
    if (stationId) {
      vols = vols.filter(v => v.stationId === stationId);
    }

    return vols.filter(v => {
      const rank = (v.rank || '').toUpperCase();
      const skills = Array.isArray(v.skills) ? v.skills.map(s => String(s).toLowerCase()) : [];
      const isCD = rank === 'CD' || rank.includes('DISPOSITIF') || skills.includes('cd') || skills.includes('chef_dispositif');
      const isCP = rank === 'CP' || rank.includes('POSTE') || skills.includes('cp') || skills.includes('chef_poste');
      const isCE = rank === 'CE' || rank.includes('ÉQUIPE') || skills.includes('ce') || skills.includes('chef_equipe');
      return isCD || isCP || isCE;
    });
  },

  /**
   * Équipe un véhicule avec le kit Poste de Commandement Mobile
   */
  async equipVehicle(game, vehicleId) {
    if (!game) game = window.game;
    const veh = (game.vehicles || []).find(v => v.id === vehicleId);
    if (!veh) return;

    if (veh.hasCommandementKit) {
      game.showToast('Déjà Équipée', `${veh.name} dispose déjà du Poste de Commandement Mobile.`, 'blue');
      return;
    }

    let availableKits = this.getAvailableKitsCount(game, veh.stationId);

    // Si aucun kit en stock, proposer l'acquisition immédiate
    if (availableKits <= 0) {
      if (game.resources.money < this.KIT_PRICE) {
        game.showToast(
          'Kit Non Disponible',
          `Aucun Poste de Commandement Mobile en réserve. L'achat requiert ${this.KIT_PRICE.toLocaleString('fr-FR')} € (Trésorerie insuffisante).`,
          'orange'
        );
        return;
      }

      const confirmBuy = await window.ProtecDialog.confirm(
        `Aucun kit Poste de Commandement Mobile n'est disponible en réserve.\n\nSouhaitez-vous acheter un kit immédiatement pour ${this.KIT_PRICE.toLocaleString('fr-FR')} € afin d'équiper ${veh.name} et la convertir en VL Commandement ?`,
        'Acquisition Poste de Commandement Mobile',
        { confirmText: `Acheter & Équiper (-${this.KIT_PRICE} €)`, cancelText: 'Annuler' }
      );
      if (!confirmBuy) return;

      // Débit financier
      game.resources.money -= this.KIT_PRICE;

      // Enregistrement stock
      if (!game.workplaceEquipment) game.workplaceEquipment = {};
      game.workplaceEquipment[this.KIT_ID] = (game.workplaceEquipment[this.KIT_ID] || 0) + 1;

      const station = (game.stations || []).find(s => s.id === veh.stationId) || game.stations[0];
      if (station) {
        if (!station.stock) station.stock = {};
        station.stock[this.KIT_ID] = (station.stock[this.KIT_ID] || 0) + 1;
      }

      // Enregistrement Grand Livre
      if (window.ProtecFinances && typeof window.ProtecFinances.recordTransaction === 'function') {
        window.ProtecFinances.recordTransaction(
          game,
          -this.KIT_PRICE,
          `Acquisition Matériel : Poste de Commandement Mobile (${veh.name})`,
          'equipement',
          `ACHAT-PCM-${Date.now()}`,
          'Centrale d’Achat Réseau'
        );
      }
    }

    // Application de la transformation en VL Commandement
    veh.hasCommandementKit = true;
    veh.isCommandement = true;
    veh.previousLabel = veh.previousLabel || veh.label || veh.type;
    veh.previousModel = veh.previousModel || veh.model || 'Véhicule de Liaison';
    veh.previousSpecialty = veh.previousSpecialty || veh.specialty || 'Liaison & Reconnaissance';

    veh.label = 'VL Commandement (VLC)';
    veh.specialty = 'Poste de Commandement Mobile & Coordination de Crise';
    if (!veh.model.includes('Commandement')) {
      veh.model = `${veh.previousModel} • Commandement`;
    }

    // Ajout dans les options installées si présent
    if (!Array.isArray(veh.installedOptions)) veh.installedOptions = [];
    if (!veh.installedOptions.includes('Poste de Commandement Mobile (Pack PC Embarqué)')) {
      veh.installedOptions.push('Poste de Commandement Mobile (Pack PC Embarqué)');
    }

    game.saveGame();
    game.updateStatsUI();

    game.showToast(
      '📡 VL Commandement Opérationnelle !',
      `« ${veh.name} » est maintenant configurée en VL Commandement (VLC). Éligible aux crises NOVI et équivalence PCM !`,
      'green'
    );

    this.openCommandModal(game, vehicleId);
  },

  /**
   * Retire le Poste de Commandement Mobile du véhicule
   */
  unequipVehicle(game, vehicleId) {
    if (!game) game = window.game;
    const veh = (game.vehicles || []).find(v => v.id === vehicleId);
    if (!veh || !veh.hasCommandementKit) return;

    if (veh.status !== 'dispo') {
      game.showToast('Véhicule Engagé', 'Impossible de modifier l’équipement d’un véhicule actuellement en mission.', 'orange');
      return;
    }

    veh.hasCommandementKit = false;
    veh.isCommandement = false;
    veh.label = veh.previousLabel || 'Véhicule de Liaison';
    veh.model = veh.previousModel || veh.model.replace(' • Commandement', '');
    veh.specialty = veh.previousSpecialty || 'Liaison & Reconnaissance';
    veh.assignedLeaderId = null;

    if (Array.isArray(veh.installedOptions)) {
      veh.installedOptions = veh.installedOptions.filter(o => o !== 'Poste de Commandement Mobile (Pack PC Embarqué)');
    }

    game.saveGame();
    game.updateStatsUI();

    game.showToast(
      'Matériel Démonté',
      `Le Poste de Commandement Mobile a été retiré de ${veh.name} et réintégré au stock de réserve de l'antenne.`,
      'blue'
    );

    this.openCommandModal(game, vehicleId);
  },

  /**
   * Assigne un Chef de Dispositif ou Chef de Poste en gestion du véhicule
   */
  assignLeader(game, vehicleId, leaderId) {
    if (!game) game = window.game;
    const veh = (game.vehicles || []).find(v => v.id === vehicleId);
    if (!veh) return;

    const leader = (game.volunteers || []).find(v => v.id === leaderId);
    if (!leader) {
      this.unassignLeader(game, vehicleId);
      return;
    }

    // Retirer ce chef s'il était déjà en gestion d'un autre véhicule
    (game.vehicles || []).forEach(otherVeh => {
      if (otherVeh.id !== veh.id && otherVeh.assignedLeaderId === leader.id) {
        otherVeh.assignedLeaderId = null;
      }
    });

    veh.assignedLeaderId = leader.id;

    // Bonus de fierté et moral pour le cadre nommé
    leader.moral = Math.min(100, (leader.moral || 80) + 15);
    leader.motivation = leader.moral;

    game.saveGame();
    game.updateStatsUI();

    game.showToast(
      '🎖️ Responsable en Gestion Nommé !',
      `${leader.name} (${leader.rank}) est désormais en gestion de la ${veh.name} ! Bonus de coordination activé.`,
      'green'
    );

    this.openCommandModal(game, vehicleId);
  },

  /**
   * Retire l'assignation du responsable
   */
  unassignLeader(game, vehicleId) {
    if (!game) game = window.game;
    const veh = (game.vehicles || []).find(v => v.id === vehicleId);
    if (!veh) return;

    veh.assignedLeaderId = null;
    game.saveGame();
    game.updateStatsUI();

    game.showToast('Gestion Révoquée', `La ${veh.name} n'a plus de responsable désigné attitré.`, 'blue');
    this.openCommandModal(game, vehicleId);
  },

  /**
   * Modale interactive complète de gestion du Poste de Commandement Mobile
   */
  openCommandModal(game, vehicleId) {
    if (!game) game = window.game;
    const veh = (game.vehicles || []).find(v => v.id === vehicleId);
    if (!veh) return;

    const station = (game.stations || []).find(s => s.id === veh.stationId) || game.stations[0];
    const availableKits = this.getAvailableKitsCount(game, station?.id);
    const isEquipped = Boolean(veh.hasCommandementKit && veh.isCommandement);
    const assignedLeader = this.getLeader(game, veh);
    const qualifiedLeaders = this.getQualifiedLeaders(game, station?.id);

    const modalId = 'protec-commandement-modal';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = modalId;
      overlay.className = 'fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3.5 animate-in fade-in duration-200 overflow-y-auto';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 text-slate-100 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
        
        <!-- Header -->
        <div class="flex items-start justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
              📡
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-black text-white">Poste de Commandement Mobile</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isEquipped ? 'bg-indigo-500 text-white shadow-xs' : 'bg-slate-800 text-slate-400 border border-slate-700'}">
                  ${isEquipped ? 'VL Commandement (VLC) Active' : 'Configuration Disponible'}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                Véhicule cible : <strong class="text-white">${veh.name}</strong> • ${veh.model} (${station?.name || 'Antenne'})
              </p>
            </div>
          </div>
          <button onclick="document.getElementById('${modalId}').remove()" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer">
            ✕
          </button>
        </div>

        <!-- Section 1 : État de l'Équipement -->
        <div class="p-4 rounded-2xl ${isEquipped ? 'bg-indigo-950/40 border border-indigo-500/40 ring-1 ring-indigo-500/20' : 'bg-slate-800/60 border border-slate-700'} space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider ${isEquipped ? 'text-indigo-400' : 'text-slate-400'}">
                Matériel Embarqué
              </span>
              <h4 class="text-sm font-black text-white flex items-center gap-2">
                <span>${isEquipped ? '✅ Pack PC Mobile Installé & Opérationnel' : '📦 Aucun Kit de Commandement Installé'}</span>
              </h4>
            </div>

            <div>
              ${isEquipped ? `
                <button 
                  type="button"
                  onclick="window.ProtecCommandement.unequipVehicle(window.game, '${veh.id}')"
                  class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-700/60 border border-slate-700 text-slate-300 transition cursor-pointer"
                >
                  Démonter le Kit
                </button>
              ` : `
                <button 
                  type="button"
                  onclick="window.ProtecCommandement.equipVehicle(window.game, '${veh.id}')"
                  class="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-pc-blue hover:brightness-110 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>⚡ Installer le Kit</span>
                  <span>(${availableKits > 0 ? 'En Stock' : `${this.KIT_PRICE.toLocaleString('fr-FR')} €`})</span>
                </button>
              `}
            </div>
          </div>

          <p class="text-xs text-slate-300 leading-relaxed">
            Le <strong>Poste de Commandement Mobile</strong> comprend une baie radio multi-bandes (ANTARES/VHF/UHF), une valise informatique durcie avec cartographie opérationnelle (SINUS / SYNERGI / SIG), un modem satellite 4G/5G, une table SITAC et une alimentation 230V autonome.
          </p>

          <div class="flex items-center gap-4 text-[11px] pt-1 text-slate-400 border-t border-slate-800/80">
            <span>📦 Réserve antenne : <strong class="text-white">${availableKits} kit(s) libre(s)</strong></span>
            <span>💰 Coût d'acquisition : <strong class="text-indigo-400">${this.KIT_PRICE.toLocaleString('fr-FR')} €</strong></span>
            <span>🎯 Qualification véhicule : <strong class="text-emerald-400">${isEquipped ? 'Équivalence PCM Validée' : 'Véhicule de Liaison'}</strong></span>
          </div>
        </div>

        <!-- Section 2 : Mise en Gestion pour un Chef de Dispositif ou Chef de Poste -->
        <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Gouvernance Tactique & Attribution
              </span>
              <h4 class="text-sm font-black text-white">Mise en Gestion du Véhicule</h4>
            </div>

            ${assignedLeader ? `
              <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                🎖️ En Gestion Active
              </span>
            ` : `
              <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                Non Attribué
              </span>
            `}
          </div>

          <p class="text-xs text-slate-400">
            Désignez un <strong>Chef de Dispositif</strong> ou un <strong>Chef de Poste</strong> comme responsable attitré de cette VL Commandement. Le cadre bénéficie d'une priorité d'engagement et d'un bonus de motivation (+15 moral).
          </p>

          <!-- Sélection du Cadre -->
          <div class="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <select 
              id="cmd-leader-select"
              class="w-full sm:flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Aucun Responsable Désigné --</option>
              ${qualifiedLeaders.map(l => {
                const isSelected = assignedLeader && assignedLeader.id === l.id;
                return `
                  <option value="${l.id}" ${isSelected ? 'selected' : ''}>
                    ${l.name} (${l.rank}) ${isSelected ? '★ [Actuel]' : ''}
                  </option>
                `;
              }).join('')}
            </select>

            <button 
              type="button"
              onclick="
                const sel = document.getElementById('cmd-leader-select');
                window.ProtecCommandement.assignLeader(window.game, '${veh.id}', sel.value);
              "
              class="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black bg-slate-700 hover:bg-slate-600 text-white transition cursor-pointer flex-shrink-0"
            >
              Valider la Gestion
            </button>
          </div>

          ${assignedLeader ? `
            <div class="p-3 rounded-xl bg-amber-950/30 border border-amber-600/30 flex items-center justify-between text-xs text-amber-200">
              <div class="flex items-center gap-2.5">
                <span class="text-lg">👤</span>
                <div>
                  <strong class="font-black text-amber-300">${assignedLeader.name}</strong>
                  <span class="text-[10px] text-amber-400 block">${assignedLeader.rank} • Prêt au commandement opérationnel</span>
                </div>
              </div>
              <button 
                type="button"
                onclick="window.ProtecCommandement.unassignLeader(window.game, '${veh.id}')"
                class="text-[10.5px] font-bold text-amber-400 hover:text-white underline cursor-pointer"
              >
                Retirer l'attribution
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Section 3 : Capacités Opérationnelles & Déblocages -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/70 space-y-1">
            <span class="text-sm">🚨</span>
            <h5 class="font-black text-white text-[11.5px]">Pilotage de Crises</h5>
            <p class="text-[10.5px] text-slate-400">Éligible comme PC de crise sur les plans NOVI, ORSEC, recherches de disparus et inondations.</p>
          </div>

          <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/70 space-y-1">
            <span class="text-sm">🚚</span>
            <h5 class="font-black text-white text-[11.5px]">Équivalence PCM</h5>
            <p class="text-[10.5px] text-slate-400">Valide les créneaux exigeant un Poste de Commandement Mobile sans acheter un camion à 45 000 €.</p>
          </div>

          <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/70 space-y-1">
            <span class="text-sm">🎖️</span>
            <h5 class="font-black text-white text-[11.5px]">Grands Dispositifs</h5>
            <p class="text-[10.5px] text-slate-400">Permet au Chef de Dispositif de coordonner plusieurs postes et PAPS simultanés avec bonus préfectoral.</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span class="text-[11px] text-slate-500 font-medium">Protection Civile • Module Transmissions & Crises</span>
          <button 
            type="button"
            onclick="document.getElementById('${modalId}').remove()"
            class="px-5 py-2 rounded-xl text-xs font-black bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    `;
  }
};
