/**
 * MYPROTEC - Module Messages Antenne (Messagerie Interne & Doléances Bénévoles)
 * Canaux : Opérationnel, Formation, Logistique et Conversations 1-à-1 par bénévole.
 * 
 * Règles :
 * - Mode consultation/visuel (le joueur ne peut pas écrire de message direct).
 * - Conversations bénévoles : apparaît UNIQUEMENT au premier message reçu (aucun message = pas de conversation affichée).
 * - Les bénévoles envoient des doléances (logistique, manque d'affectation, poste mal dimensionné, forfait repas bas)
 *   ou des demandes (formations, matériel, repos).
 * - Configuration du forfait repas bénévole de l'antenne (défaut 15€).
 */

window.ProtecAntenneMessages = {
  activeTab: 'operationnel', // 'operationnel', 'formation', 'logistique', 'volunteers'
  selectedVolunteerId: null,
  
  // Initialisation de la structure de données
  initData(game) {
    if (!game) return;
    if (!game.mealAllowancePerVolunteer) {
      game.mealAllowancePerVolunteer = 15;
    }
    if (!game.antenneMessagesData) {
      game.antenneMessagesData = {
        operationnel: [],
        formation: [],
        logistique: [],
        volunteers: {} // { [volunteerId]: [ { id, text, timestamp, timeStr, category, isComplaint, moodImpact } ] }
      };
      // Injection de messages d'ambiance initiaux
      this.seedInitialMessages(game);
    }
  },

  seedInitialMessages(game) {
    const data = game.antenneMessagesData;
    const nowStr = this.formatTimeString(game);

    if (data.operationnel.length === 0) {
      data.operationnel.push({
        id: 'msg-op-init-1',
        sender: 'Serveur Opérationnel AASC',
        senderRole: 'Pôle Opérationnel',
        icon: 'radio',
        badgeColor: 'blue',
        text: 'Système de gestion des renforts et des convocations opérationnelles initialisé.',
        time: nowStr,
        unread: false
      });
    }

    if (data.formation.length === 0) {
      data.formation.push({
        id: 'msg-form-init-1',
        sender: 'Marc V. (Formateur National)',
        senderRole: 'Pôle Pédagogique',
        icon: 'graduation-cap',
        badgeColor: 'violet',
        text: 'Planning des formations de l’antenne à jour. Les recyclages PSE1/PSE2 sont consultables dans l’onglet RH.',
        time: nowStr,
        unread: false
      });
    }

    if (data.logistique.length === 0) {
      data.logistique.push({
        id: 'msg-log-init-1',
        sender: 'Atelier & Pharmacie d’Antenne',
        senderRole: 'Responsable Matériel',
        icon: 'package',
        badgeColor: 'teal',
        text: 'Inventaire des lots A et trousses d’urgence conforme. N’oubliez pas de programmer les réarmements après les DPS.',
        time: nowStr,
        unread: false
      });
    }
  },

  formatTimeString(game) {
    if (game?.clock) {
      const h = String(game.clock.hour || 12).padStart(2, '0');
      const m = String(game.clock.minute || 0).padStart(2, '0');
      const d = String(game.clock.day || 1).padStart(2, '0');
      const mo = String((game.clock.month || 0) + 1).padStart(2, '0');
      return `${d}/${mo} à ${h}:${m}`;
    }
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} à ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  // Ajouter un message au canal Opérationnel
  addOperationnelMessage(game, sender, text, senderRole = 'Secouriste', icon = 'bell', extra = {}) {
    this.initData(game);
    const msg = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender,
      senderRole,
      icon,
      badgeColor: extra.badgeColor || 'blue',
      text,
      time: this.formatTimeString(game),
      unread: true,
      ...extra
    };
    game.antenneMessagesData.operationnel.unshift(msg);
    if (game.antenneMessagesData.operationnel.length > 80) game.antenneMessagesData.operationnel.pop();
    this.updateDockBadges(game);
  },

  // Ajouter un message au canal Formation
  addFormationMessage(game, sender, text, senderRole = 'Pôle Formation', icon = 'graduation-cap', extra = {}) {
    this.initData(game);
    const msg = {
      id: `form-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender,
      senderRole,
      icon,
      badgeColor: extra.badgeColor || 'violet',
      text,
      time: this.formatTimeString(game),
      unread: true,
      ...extra
    };
    game.antenneMessagesData.formation.unshift(msg);
    if (game.antenneMessagesData.formation.length > 60) game.antenneMessagesData.formation.pop();
    this.updateDockBadges(game);
  },

  // Ajouter un message au canal Logistique
  addLogistiqueMessage(game, sender, text, senderRole = 'Parc & Matériel', icon = 'truck', extra = {}) {
    this.initData(game);
    const msg = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender,
      senderRole,
      icon,
      badgeColor: extra.badgeColor || 'teal',
      text,
      time: this.formatTimeString(game),
      unread: true,
      ...extra
    };
    game.antenneMessagesData.logistique.unshift(msg);
    if (game.antenneMessagesData.logistique.length > 60) game.antenneMessagesData.logistique.pop();
    this.updateDockBadges(game);
  },

  // Ajouter un message 1-à-1 d'un bénévole (crée la conversation si première fois)
  addVolunteerMessage(game, volunteerId, text, options = {}) {
    this.initData(game);
    const vol = (game.volunteers || []).find(v => v.id === volunteerId);
    if (!vol) return;

    if (!game.antenneMessagesData.volunteers[volunteerId]) {
      game.antenneMessagesData.volunteers[volunteerId] = [];
    }

    const msg = {
      id: `volmsg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text,
      time: this.formatTimeString(game),
      category: options.category || 'doleance', // 'plainte_repas', 'plainte_materiel', 'inactivite', 'sous_dimensionnement', 'demande_formation', 'fatigue'
      isComplaint: !!options.isComplaint,
      moodImpact: options.moodImpact || 0,
      unread: true
    };

    game.antenneMessagesData.volunteers[volunteerId].unshift(msg);

    // Ajustement de l'humeur si précisé
    if (options.moodImpact) {
      vol.humeur = Math.max(5, Math.min(100, (vol.humeur || 80) + options.moodImpact));
      vol.moral = vol.humeur;
    }

    this.updateDockBadges(game);

    if (options.showToast) {
      game.showToast('Nouveau Message d’Antenne', `${vol.name} : « ${text.substring(0, 50)}... »`, options.isComplaint ? 'orange' : 'blue');
    }
  },

  // Nombre total de messages non lus
  getUnreadCount(game) {
    if (!game?.antenneMessagesData) return 0;
    const d = game.antenneMessagesData;
    let count = 0;
    count += (d.operationnel || []).filter(m => m.unread).length;
    count += (d.formation || []).filter(m => m.unread).length;
    count += (d.logistique || []).filter(m => m.unread).length;
    Object.values(d.volunteers || {}).forEach(list => {
      count += (list || []).filter(m => m.unread).length;
    });
    return count;
  },

  updateDockBadges(game) {
    const unread = this.getUnreadCount(game);
    const badgeSubmenu = document.getElementById('badge-submenu-antenne-messages');
    if (badgeSubmenu) {
      if (unread > 0) {
        badgeSubmenu.textContent = unread;
        badgeSubmenu.classList.remove('hidden');
      } else {
        badgeSubmenu.classList.add('hidden');
      }
    }
  },

  // Réglage du forfait repas par le joueur
  setMealAllowance(game, value) {
    const val = parseInt(value, 10);
    if (isNaN(val) || val < 5 || val > 30) return;
    game.mealAllowancePerVolunteer = val;
    game.saveGame();
    
    let feedback = '';
    let color = 'green';
    if (val >= 15) {
      feedback = 'Tarif idéal (≥15€). Les bénévoles sont totalement défrayés et satisfaits.';
      color = 'green';
    } else if (val >= 12) {
      feedback = 'Tarif modéré (12-14€). Acceptable mais de légers restes à charge sont possibles.';
      color = 'blue';
    } else if (val >= 8) {
      feedback = 'Attention ! Tarif bas (<12€). Risque de mécontentement et de baisse d’humeur sur les postes.';
      color = 'orange';
    } else {
      feedback = 'Alerte ! Tarif très insuffisant (<8€). Dégradation sévère du moral des bénévoles !';
      color = 'red';
    }

    game.showToast(`Forfait Repas : ${val}€ / bénévole`, feedback, color);
    
    // Rafraîchir la modale si ouverte
    if (game.currentModalKey === 'antenne_messages' || game.currentModalKey === 'messages') {
      this.renderModal(game);
    }
  },

  // Vérification périodique des doléances bénévoles
  checkVolunteerDoleances(game) {
    this.initData(game);
    const vols = game.volunteers || [];
    if (vols.length === 0) return;

    // 1. Manque d'affectation (bénévole dispo sans mission depuis longtemps)
    vols.forEach(v => {
      if (v.status === 'dispo' && (v.consecutiveRestDays || 0) >= 3 && Math.random() < 0.25) {
        const convs = game.antenneMessagesData.volunteers[v.id] || [];
        const hasRecent = convs.some(m => m.category === 'inactivite');
        if (!hasRecent) {
          const texts = [
            `Bonjour chef, je suis disponible depuis plusieurs jours mais je ne vois aucune affectation de DPS pour moi sur le planning. Vous m'avez oublié ?`,
            `Salut, je voulais savoir s'il y avait bientôt des postes prévus où je pourrais être positionné(e) ? J'aimerais faire des heures de terrain.`,
            `Bonjour l'antenne, disponible pour intervenir dès que possible sur les prochains DPS ! N'hésitez pas à me mobiliser.`
          ];
          const pick = texts[Math.floor(Math.random() * texts.length)];
          this.addVolunteerMessage(game, v.id, pick, {
            category: 'inactivite',
            isComplaint: true,
            moodImpact: -4
          });
        }
      }

      // 2. Épuisement / fatigue persistante
      if ((v.energy !== undefined && v.energy < 25) || (v.fatigue !== undefined && v.fatigue > 75)) {
        const convs = game.antenneMessagesData.volunteers[v.id] || [];
        const hasRecent = convs.some(m => m.category === 'fatigue');
        if (!hasRecent && Math.random() < 0.3) {
          this.addVolunteerMessage(game, v.id, `J'ai enchaîné beaucoup d'interventions ces derniers temps, je me sens vraiment très fatigué(e). Je vais avoir besoin d'un temps de repos pour récupérer.`, {
            category: 'fatigue',
            isComplaint: true,
            moodImpact: -6
          });
        }
      }

      // 3. Demandes de formation spontanées (si PSE1 sans PSE2 ou PSE2 sans CE)
      if (v.rank === 'PSE1' && Math.random() < 0.08) {
        const convs = game.antenneMessagesData.volunteers[v.id] || [];
        const hasRecent = convs.some(m => m.category === 'demande_formation');
        if (!hasRecent) {
          this.addVolunteerMessage(game, v.id, `Bonjour ! J'aimerais beaucoup m'inscrire à la prochaine session PSE2 pour monter en compétences et pouvoir participer aux évacuations d'urgence.`, {
            category: 'demande_formation',
            isComplaint: false,
            moodImpact: 2
          });
        }
      }
    });
  },

  // Vérification de la logistique d'antenne pour le canal Logistique
  checkLogistiqueAlerts(game) {
    this.initData(game);
    const vehs = game.vehicles || [];

    vehs.forEach(v => {
      // Carburant bas
      if (v.fuel !== undefined && v.fuel <= 20 && !v._fuelAlertSent) {
        v._fuelAlertSent = true;
        this.addLogistiqueMessage(
          game,
          'Superviseur Flotte',
          `⚠️ Alerte Réserve Carburant : Le véhicule « ${v.name || v.immat || v.type} » n'a plus que ${v.fuel}% de carburant. Ravitaillement nécessaire avant réengagement.`,
          'Gestion Flotte',
          'fuel',
          { badgeColor: 'orange' }
        );
      }

      // Révision requise
      if (v.km !== undefined && v.kmNextRevision && v.km >= v.kmNextRevision && !v._revisionAlertSent) {
        v._revisionAlertSent = true;
        this.addLogistiqueMessage(
          game,
          'Atelier Mécanique',
          `🔧 Révision Garage Dépassée : « ${v.name || v.immat || v.type} » (${v.km} km) doit être orienté au garage pour son entretien périodique.`,
          'Entretien Flotte',
          'wrench',
          { badgeColor: 'rose' }
        );
      }
    });
  },

  // Rendu complet de la modale dans l'onglet Antenne
  renderModal(game) {
    this.initData(game);

    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    if (title) title.textContent = "Messagerie & Échanges d'Antenne";
    if (subtitle) subtitle.textContent = "Flux opérationnels, messages formateurs, alertes logistiques et doléances directes des bénévoles";
    if (icon) icon.setAttribute('data-lucide', 'message-square');

    // Bénévoles ayant au moins 1 message (RÈGLE : apparaît au 1er message, pas de message = pas de conv)
    const activeVolunteerConvs = Object.entries(game.antenneMessagesData.volunteers || {})
      .filter(([volId, msgs]) => msgs && msgs.length > 0)
      .map(([volId, msgs]) => {
        const vol = (game.volunteers || []).find(v => v.id === volId) || { id: volId, name: 'Ancien Bénévole', rank: 'PSE', humeur: 70 };
        const lastMsg = msgs[0];
        const unreadCount = msgs.filter(m => m.unread).length;
        return {
          vol,
          msgs,
          lastMsg,
          unreadCount
        };
      });

    // Si le bénévole sélectionné n'existe plus ou n'est plus valide, sélectionner le premier
    if (this.activeTab === 'volunteers' && (!this.selectedVolunteerId || !game.antenneMessagesData.volunteers[this.selectedVolunteerId])) {
      this.selectedVolunteerId = activeVolunteerConvs.length > 0 ? activeVolunteerConvs[0].vol.id : null;
    }

    const unreadOp = (game.antenneMessagesData.operationnel || []).filter(m => m.unread).length;
    const unreadForm = (game.antenneMessagesData.formation || []).filter(m => m.unread).length;
    const unreadLog = (game.antenneMessagesData.logistique || []).filter(m => m.unread).length;
    const unreadVolsTotal = activeVolunteerConvs.reduce((acc, c) => acc + c.unreadCount, 0);

    const allowance = game.mealAllowancePerVolunteer || 15;
    let allowanceBadge = {
      color: 'emerald',
      text: 'Conforme barème (15€) — Humeur garantie',
      impact: '+2 moral'
    };
    if (allowance < 8) {
      allowanceBadge = { color: 'rose', text: 'Scandaleusement bas (<8€) — Plaintes sévères & démissions', impact: '-18 moral' };
    } else if (allowance < 12) {
      allowanceBadge = { color: 'amber', text: 'Insuffisant (<12€) — Doléances & baisse de motivation', impact: '-8 moral' };
    } else if (allowance < 15) {
      allowanceBadge = { color: 'sky', text: 'Modéré (12-14€) — Petits restes à charge', impact: '-3 moral' };
    }

    body.innerHTML = `
      <div class="space-y-4">
        
        <!-- BANDEAU GESTION DU TARIF REPAS D'ANTENNE & NDF -->
        <div class="p-4 rounded-2xl glass-card bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-pc-blue/10 border border-amber-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold text-sm">🍽️</span>
              <span class="text-xs font-black uppercase tracking-wider text-slate-800">Tarif Repas d'Antenne & Forfait Bénévoles</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-${allowanceBadge.color}-100 text-${allowanceBadge.color}-800 border border-${allowanceBadge.color}-200">
                ${allowanceBadge.text}
              </span>
            </div>
            <p class="text-[11px] text-slate-600 leading-relaxed">
              Sur les DPS non pris en charge par l'organisateur (~1 sur 2), une <strong>Note de Frais (10€ à 15€)</strong> est générée par secouriste présent à <strong>12h00</strong> ou <strong>19h00</strong>, plafonnée à votre tarif antenne.
            </p>
          </div>

          <div class="flex items-center gap-3 bg-white/90 p-2.5 rounded-xl border border-slate-200 flex-shrink-0">
            <div class="text-right">
              <span class="text-[9px] uppercase font-bold text-slate-400 block">Plafond Forfait</span>
              <span class="text-xl font-black font-mono text-slate-900">${allowance} € <span class="text-[10px] text-slate-500 font-normal">/ repas</span></span>
            </div>
            <div class="flex flex-col gap-1">
              <input 
                type="range" 
                min="5" 
                max="25" 
                step="1" 
                value="${allowance}" 
                onchange="window.ProtecAntenneMessages.setMealAllowance(window.game, this.value)"
                class="w-32 accent-amber-600 cursor-pointer"
                title="Ajuster le tarif repas par bénévole (défaut 15€)"
              />
              <div class="flex justify-between text-[9px] font-bold text-slate-400">
                <span>5€ (Crise)</span>
                <span class="text-amber-700 font-extrabold">15€</span>
                <span>25€ (Luxe)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- LAYOUT MESSAGERIE : COLONNE GAUCHE (CANAUX + BÉNÉVOLES) & COLONNE DROITE (MESSAGES) -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[480px]">
          
          <!-- COLONNE GAUCHE : NAVIGATION CANAUX & LISTE DES CONVERSATIONS ACTIVES -->
          <div class="md:col-span-4 lg:col-span-4 flex flex-col gap-3">
            
            <!-- Canaux Institutionnels -->
            <div class="p-2.5 rounded-2xl glass-card border border-slate-200/80 space-y-1">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2 py-1 block">Canaux Généraux</span>
              
              <!-- Canal Opérationnel -->
              <button 
                onclick="window.ProtecAntenneMessages.switchTab('operationnel')"
                class="w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2.5 ${this.activeTab === 'operationnel' ? 'bg-pc-blue text-white shadow-sm font-black' : 'hover:bg-slate-100 text-slate-700 font-bold'}">
                <div class="flex items-center gap-2.5 truncate">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center ${this.activeTab === 'operationnel' ? 'bg-white/20 text-white' : 'bg-blue-100 text-pc-blue'}">
                    <i data-lucide="radio" class="w-4 h-4"></i>
                  </div>
                  <div class="truncate">
                    <span class="text-xs block">Opérationnel</span>
                    <span class="text-[10px] opacity-75 font-normal block truncate">Renforts & retours missions</span>
                  </div>
                </div>
                ${unreadOp > 0 ? `<span class="px-1.5 py-0.5 rounded-full text-[9px] font-black ${this.activeTab === 'operationnel' ? 'bg-white text-pc-blue' : 'bg-red-500 text-white'}">${unreadOp}</span>` : ''}
              </button>

              <!-- Canal Formation -->
              <button 
                onclick="window.ProtecAntenneMessages.switchTab('formation')"
                class="w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2.5 ${this.activeTab === 'formation' ? 'bg-violet-600 text-white shadow-sm font-black' : 'hover:bg-slate-100 text-slate-700 font-bold'}">
                <div class="flex items-center gap-2.5 truncate">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center ${this.activeTab === 'formation' ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'}">
                    <i data-lucide="graduation-cap" class="w-4 h-4"></i>
                  </div>
                  <div class="truncate">
                    <span class="text-xs block">Formation</span>
                    <span class="text-[10px] opacity-75 font-normal block truncate">Sessions, PAE & recyclages</span>
                  </div>
                </div>
                ${unreadForm > 0 ? `<span class="px-1.5 py-0.5 rounded-full text-[9px] font-black ${this.activeTab === 'formation' ? 'bg-white text-violet-700' : 'bg-red-500 text-white'}">${unreadForm}</span>` : ''}
              </button>

              <!-- Canal Logistique -->
              <button 
                onclick="window.ProtecAntenneMessages.switchTab('logistique')"
                class="w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2.5 ${this.activeTab === 'logistique' ? 'bg-teal-700 text-white shadow-sm font-black' : 'hover:bg-slate-100 text-slate-700 font-bold'}">
                <div class="flex items-center gap-2.5 truncate">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center ${this.activeTab === 'logistique' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-700'}">
                    <i data-lucide="package" class="w-4 h-4"></i>
                  </div>
                  <div class="truncate">
                    <span class="text-xs block">Logistique</span>
                    <span class="text-[10px] opacity-75 font-normal block truncate">Flotte, pannes & réarmement</span>
                  </div>
                </div>
                ${unreadLog > 0 ? `<span class="px-1.5 py-0.5 rounded-full text-[9px] font-black ${this.activeTab === 'logistique' ? 'bg-white text-teal-700' : 'bg-red-500 text-white'}">${unreadLog}</span>` : ''}
              </button>
            </div>

            <!-- Section Conversations Bénévoles (Apparaît au 1er message uniquement) -->
            <div class="p-2.5 rounded-2xl glass-card border border-slate-200/80 flex-1 flex flex-col min-h-[220px]">
              <div class="flex items-center justify-between px-2 py-1 mb-1">
                <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Bénévoles (${activeVolunteerConvs.length})</span>
                ${unreadVolsTotal > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">${unreadVolsTotal} non lu(s)</span>` : ''}
              </div>

              ${activeVolunteerConvs.length === 0 ? `
                <div class="flex-1 flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-2">
                  <i data-lucide="inbox" class="w-8 h-8 opacity-40"></i>
                  <p class="text-[11px] leading-relaxed">
                    Aucune conversation active pour le moment.<br/>
                    <em>Les discussions s'ouvrent dès qu'un bénévole envoie une doléance ou une demande.</em>
                  </p>
                </div>
              ` : `
                <div class="space-y-1 overflow-y-auto max-h-[300px] pr-1">
                  ${activeVolunteerConvs.map(item => {
                    const isSelected = this.activeTab === 'volunteers' && this.selectedVolunteerId === item.vol.id;
                    const moodColor = (item.vol.humeur || 80) >= 60 ? 'emerald' : ((item.vol.humeur || 80) >= 40 ? 'amber' : 'rose');
                    return `
                      <button 
                        onclick="window.ProtecAntenneMessages.selectVolunteer('${item.vol.id}')"
                        class="w-full p-2 rounded-xl text-left transition-all border flex items-center justify-between gap-2 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white/80 hover:bg-slate-100 border-slate-200/60 text-slate-700'}">
                        <div class="flex items-center gap-2 truncate">
                          <div class="relative">
                            <span class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 overflow-hidden">
                              ${item.vol.avatar || '👤'}
                            </span>
                            <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-${moodColor}-500 ring-2 ring-white" title="Humeur : ${item.vol.humeur || 80}%"></span>
                          </div>
                          <div class="truncate">
                            <div class="flex items-center gap-1.5">
                              <span class="text-xs font-bold truncate">${item.vol.name}</span>
                              <span class="text-[9px] px-1 rounded font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}">${item.vol.rank || 'PSE'}</span>
                            </div>
                            <span class="text-[10px] opacity-75 font-normal block truncate">${item.lastMsg.text}</span>
                          </div>
                        </div>
                        ${item.unreadCount > 0 ? `<span class="px-1.5 py-0.5 rounded-full text-[9px] font-black ${isSelected ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white'}">${item.unreadCount}</span>` : ''}
                      </button>
                    `;
                  }).join('')}
                </div>
              `}
            </div>
          </div>

          <!-- COLONNE DROITE : CONTENU DES MESSAGES (LECTURE SEULE) -->
          <div class="md:col-span-8 lg:col-span-8 flex flex-col">
            <div class="p-4 rounded-2xl glass-card border border-slate-200 flex-1 flex flex-col">
              
              <!-- En-tête du canal ou de la conversation active -->
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div class="flex items-center gap-3">
                  ${this.activeTab === 'operationnel' ? `
                    <div class="w-9 h-9 rounded-xl bg-blue-100 text-pc-blue flex items-center justify-center">
                      <i data-lucide="radio" class="w-5 h-5"></i>
                    </div>
                    <div>
                      <h4 class="text-sm font-black text-slate-900">Canal Opérationnel</h4>
                      <p class="text-[11px] text-slate-500">Demandes de renforts inter-antennes et réponses automatiques des secouristes</p>
                    </div>
                  ` : (this.activeTab === 'formation' ? `
                    <div class="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                      <i data-lucide="graduation-cap" class="w-5 h-5"></i>
                    </div>
                    <div>
                      <h4 class="text-sm font-black text-slate-900">Canal Pédagogique & Formations</h4>
                      <p class="text-[11px] text-slate-500">Communications des formateurs certifiés et recyclages d'équipe</p>
                    </div>
                  ` : (this.activeTab === 'logistique' ? `
                    <div class="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                      <i data-lucide="package" class="w-5 h-5"></i>
                    </div>
                    <div>
                      <h4 class="text-sm font-black text-slate-900">Canal Logistique & Flotte</h4>
                      <p class="text-[11px] text-slate-500">Alertes véhicules, usure matériel, carburant et réarmement sanitaire</p>
                    </div>
                  ` : `
                    ${(() => {
                      const vol = (game.volunteers || []).find(v => v.id === this.selectedVolunteerId) || { name: 'Secouriste', rank: 'PSE', humeur: 80 };
                      const moodColor = (vol.humeur || 80) >= 60 ? 'emerald' : ((vol.humeur || 80) >= 40 ? 'amber' : 'rose');
                      return `
                        <div class="relative">
                          <span class="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-700">
                            ${vol.avatar || '👤'}
                          </span>
                          <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-${moodColor}-500 ring-2 ring-white"></span>
                        </div>
                        <div>
                          <div class="flex items-center gap-2">
                            <h4 class="text-sm font-black text-slate-900">${vol.name}</h4>
                            <span class="px-2 py-0.2 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">${vol.rank || 'PSE'}</span>
                            <span class="text-[11px] font-bold text-${moodColor}-600">Humeur : ${vol.humeur || 80}%</span>
                          </div>
                          <p class="text-[11px] text-slate-500">Fil direct de communication et retours du bénévole</p>
                        </div>
                      `;
                    })()}
                  `))}
                </div>

                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                    <i data-lucide="lock" class="w-3 h-3"></i> Mode Consultation
                  </span>
                </div>
              </div>

              <!-- Flux des messages (Lecture seule) -->
              <div class="flex-1 overflow-y-auto space-y-3 pr-2 min-h-[300px] max-h-[420px]">
                ${this.renderActiveMessagesList(game)}
              </div>

              <!-- Bas de modale : mention informative joueur -->
              <div class="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span class="flex items-center gap-1.5">
                  <i data-lucide="info" class="w-3.5 h-3.5 text-slate-400"></i>
                  Boîte de réception d'antenne (les réponses et doléances sont générées par les secouristes virtuels du jeu).
                </span>
                <button 
                  onclick="window.ProtecAntenneMessages.markAllAsRead(window.game)"
                  class="text-pc-blue font-bold hover:underline flex items-center gap-1">
                  <i data-lucide="check-check" class="w-3.5 h-3.5"></i> Tout marquer comme lu
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  renderActiveMessagesList(game) {
    if (this.activeTab === 'operationnel') {
      const msgs = game.antenneMessagesData.operationnel || [];
      if (msgs.length === 0) return this.emptyMessagesPlaceholder("Aucun message opérationnel.");
      return msgs.map(m => this.renderMessageCard(m, 'blue')).join('');
    }

    if (this.activeTab === 'formation') {
      const msgs = game.antenneMessagesData.formation || [];
      if (msgs.length === 0) return this.emptyMessagesPlaceholder("Aucun message pédagogique pour le moment.");
      return msgs.map(m => this.renderMessageCard(m, 'violet')).join('');
    }

    if (this.activeTab === 'logistique') {
      const msgs = game.antenneMessagesData.logistique || [];
      if (msgs.length === 0) return this.emptyMessagesPlaceholder("Aucune alerte logistique.");
      return msgs.map(m => this.renderMessageCard(m, 'teal')).join('');
    }

    if (this.activeTab === 'volunteers') {
      if (!this.selectedVolunteerId) return this.emptyMessagesPlaceholder("Sélectionnez un bénévole dans la colonne de gauche.");
      const msgs = game.antenneMessagesData.volunteers[this.selectedVolunteerId] || [];
      if (msgs.length === 0) return this.emptyMessagesPlaceholder("Aucun message de ce bénévole.");
      const vol = (game.volunteers || []).find(v => v.id === this.selectedVolunteerId) || { name: 'Secouriste' };
      
      return msgs.map(m => `
        <div class="p-3.5 rounded-2xl border transition-all ${m.isComplaint ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'} space-y-1.5 shadow-sm">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="font-black text-slate-800">${vol.name}</span>
              ${m.isComplaint ? `<span class="px-2 py-0.2 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-200">Doléance / Plainte</span>` : `<span class="px-2 py-0.2 rounded-full text-[9px] font-black bg-blue-100 text-blue-800 border border-blue-200">Demande</span>`}
              ${m.moodImpact ? `<span class="text-[10px] font-bold ${m.moodImpact < 0 ? 'text-rose-600' : 'text-emerald-600'}">(${m.moodImpact > 0 ? '+' : ''}${m.moodImpact} humeur)</span>` : ''}
            </div>
            <span class="text-[10px] font-mono text-slate-400">${m.time}</span>
          </div>
          <p class="text-xs text-slate-700 leading-relaxed">${m.text}</p>
        </div>
      `).join('');
    }

    return '';
  },

  renderMessageCard(m, defaultColor = 'blue') {
    const isUnread = !!m.unread;
    return `
      <div class="p-3.5 rounded-2xl border transition-all ${isUnread ? 'bg-white border-pc-blue/50 shadow-sm ring-1 ring-pc-blue/20' : 'bg-white/80 border-slate-200'} space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-${m.badgeColor || defaultColor}-100 text-${m.badgeColor || defaultColor}-700 flex items-center justify-center font-bold text-xs">
              <i data-lucide="${m.icon || 'bell'}" class="w-3.5 h-3.5"></i>
            </span>
            <span class="font-black text-slate-800">${m.sender}</span>
            <span class="text-[10px] text-slate-500 font-normal">(${m.senderRole || 'Interne'})</span>
            ${isUnread ? `<span class="px-1.5 py-0.2 rounded-full text-[8px] font-black bg-pc-blue text-white uppercase tracking-wider">Nouveau</span>` : ''}
          </div>
          <span class="text-[10px] font-mono text-slate-400">${m.time}</span>
        </div>
        <p class="text-xs text-slate-700 leading-relaxed">${m.text}</p>
      </div>
    `;
  },

  emptyMessagesPlaceholder(text) {
    return `
      <div class="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
        <i data-lucide="message-square-off" class="w-10 h-10 opacity-30"></i>
        <p class="text-xs">${text}</p>
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    if (tab !== 'volunteers') {
      // Marquer comme lus
      if (window.game?.antenneMessagesData?.[tab]) {
        window.game.antenneMessagesData[tab].forEach(m => m.unread = false);
        this.updateDockBadges(window.game);
      }
    }
    this.renderModal(window.game);
  },

  selectVolunteer(volId) {
    this.activeTab = 'volunteers';
    this.selectedVolunteerId = volId;
    if (window.game?.antenneMessagesData?.volunteers?.[volId]) {
      window.game.antenneMessagesData.volunteers[volId].forEach(m => m.unread = false);
      this.updateDockBadges(window.game);
    }
    this.renderModal(window.game);
  },

  markAllAsRead(game) {
    if (!game?.antenneMessagesData) return;
    (game.antenneMessagesData.operationnel || []).forEach(m => m.unread = false);
    (game.antenneMessagesData.formation || []).forEach(m => m.unread = false);
    (game.antenneMessagesData.logistique || []).forEach(m => m.unread = false);
    Object.values(game.antenneMessagesData.volunteers || {}).forEach(list => {
      (list || []).forEach(m => m.unread = false);
    });
    this.updateDockBadges(game);
    this.renderModal(game);
    game.showToast('Messages Lus', 'Tous les messages de l’antenne ont été marqués comme consultés.', 'blue');
  }
};
