/**
 * PROTEC LIVE - CONVENTION OFFICIELLE AASC & CUMP (SAMU 15)
 * 
 * Doctrine & Règles opérationnelles réelles :
 * 1. La convention CUMP est réservée aux AASC de grande capacité pour garantir une astreinte H24/365.
 * 2. C'est le SAMU / CUMP qui sollicite l'antenne si elle dispose des prérequis stricts :
 *    - Effectif : au moins 10 bénévoles actifs.
 *    - Agréments nationaux de Sécurité Civile : type A (SAMU/Secours à personnes) ET type B (Action Sociale/Soutien).
 *    - Flotte : au moins 2 véhicules d'intervention.
 * 3. Une fois la convention signée, l'antenne dispose d'un délai strict de 48 heures pour se mettre aux normes.
 *    Sans quoi la convention est annulée automatiquement par le SAMU !
 * 4. Cahier des charges de mise aux normes (conditionné en lots et malles pré-conditionnées identifiées) :
 *    - Matériel de confort et d'accueil (lits picots, tables, chaises, couvertures)
 *    - Moyens modulaires / abris (tente modulaire / barnum d'accueil)
 *    - Moyens étiquetés pour la CUMP (VTU logistique, VTP transport impliqués, VPSP sanitaire)
 *    - Lot CHU (Centre d'Hébergement d'Urgence)
 *    - Lot CAI (Centre d'Accueil des Impliqués)
 *    - Kit de réconfort et convivialité (boissons chaudes, encas, eau)
 *    - Kit petite enfance et distraction (doudous, coloriages, jeux pour enfants choqués)
 *    - Outils d'émargement et traçabilité (fiches SINUS, registres d'accueil)
 * 5. Résiliation : possible à tout moment par le joueur (avec préavis) ou par la CUMP en cas d'irrégularités.
 */

window.ProtecCump = {
  // Liste des exigences d'équipement de mise aux normes CUMP (48h)
  NORMS_REQUIREMENTS: [
    {
      id: 'malles_confort',
      label: 'Matériel de Confort & Accueil',
      desc: '10 lits de camp pliants (picots), 4 tables d\'accueil, 16 chaises et 30 couvertures thermiques.',
      cost: 450,
      icon: 'bed'
    },
    {
      id: 'moyens_modulaires',
      label: 'Moyens Modulaires / Abris',
      desc: 'Tente d\'intervention modulaire gonflable ou barnum 24m² avec éclairage autonome LED.',
      cost: 750,
      icon: 'tent'
    },
    {
      id: 'moyens_etiquettes',
      label: 'Moyens Roulants Étiquetés CUMP',
      desc: 'Flocage & identification opérationnelle dédiée sur VTU, VTP ou VPSP.',
      cost: 200,
      icon: 'truck'
    },
    {
      id: 'lot_chu',
      label: 'Lot CHU (Centre d\'Hébergement d\'Urgence)',
      desc: 'Kits literie d\'urgence, paravents d\'intimité et nécessaire pour nuitée sinistrés.',
      cost: 500,
      icon: 'home'
    },
    {
      id: 'lot_cai',
      label: 'Lot CAI (Centre d\'Accueil des Impliqués)',
      desc: 'Signalétique d\'accueil, sas de décompression psychologique et badges sécurisés.',
      cost: 350,
      icon: 'shield-alert'
    },
    {
      id: 'kit_reconfort',
      label: 'Kit de Réconfort & Convivialité',
      desc: 'Malles thermo-isolées, bouilloires 230V/gaz, thermos, café, thé et collations réconfortantes.',
      cost: 180,
      icon: 'coffee'
    },
    {
      id: 'kit_petite_enfance',
      label: 'Kit Petite Enfance & Distraction',
      desc: 'Peluches de secours (doudous), kits de dessin, jeux calmes et layettes bébés.',
      cost: 150,
      icon: 'smile'
    },
    {
      id: 'outils_emargement',
      label: 'Outils d\'Émargement & Traçabilité SINUS',
      desc: 'Bracelets SINUS, fiches de suivi des impliqués, ordinateurs durcis et registres officiels.',
      cost: 280,
      icon: 'clipboard-list'
    }
  ],

  SCENARIOS: [
    {
      id: 'cump-bus',
      title: 'Accident Collectif d\'Autocar & Prise en Charge Impliqués',
      desc: 'Sortie de route d\'un autocar scolaire. 28 impliqués indemnes ou choqués en état de sidération aiguë. La CUMP active l\'armement immédiat d\'un CAI.',
      locationName: 'Salle des Fêtes Municipale',
      doctor: 'Dr. Valérie Mercier (Médecin Coordinateur CUMP)',
      involvedCount: 18,
      reward: 750
    },
    {
      id: 'cump-incendie',
      title: 'Incendie Nocturne d\'Immeuble & Évacuation Massive',
      desc: 'Feu nocturne d\'habitation collective. 40 résidents évacués en pyjama, enfants en pleurs et détresse psychique intense. Déclenchement CUMP immédiat.',
      locationName: 'Gymnase Pierre de Coubertin',
      doctor: 'Dr. Karim Benali (Praticien Hospitalier SAMU / CUMP)',
      involvedCount: 20,
      reward: 800
    },
    {
      id: 'cump-train',
      title: 'Accident Ferroviaire Majeur : Choc Psychologique Témoins',
      desc: 'Collision en gare périurbaine. Voyageurs choqués et témoins directs de scènes traumatisantes. La CUMP requiert le CAI dans le hall annexe.',
      locationName: 'Hall Annexe Gare SNCF',
      doctor: 'Dr. Sophie Laurent (Médecin Psychiatre Référent CUMP)',
      involvedCount: 16,
      reward: 720
    }
  ],

  injectState(game) {
    if (!game.cumpConvention) {
      game.cumpConvention = {
        proposed: false,
        proposedAt: null,
        signed: false,
        signedAt: null,
        normDeadlineHour: null, // Horloge jeu : heure de début + 48h
        normComplianceDeadline: null,
        normCompliant: false,
        verifiedMalles: {}, // id -> true/false
        lastVerificationDate: null,
        irregularitiesCount: 0,
        totalMissions: 0,
        successfulMissions: 0,
        complianceScore: 100,
        noticeDaysLeft: null // Préavis si résiliation par le joueur
      };
    }
    if (!game.cumpConvention.verifiedMalles) {
      game.cumpConvention.verifiedMalles = {};
    }
  },

  // Vérifier si le SAMU peut proposer la convention CUMP à l'AASC
  checkPrerequisites(game) {
    this.injectState(game);
    const totalVols = game.volunteers ? game.volunteers.length : 0;
    const hasAgrementA = !!(game.resources?.agrements?.A);
    const hasAgrementB = !!(game.resources?.agrements?.B);
    const vehCount = game.vehicles ? game.vehicles.length : 0;

    const reasons = [];
    if (totalVols < 10) {
      reasons.push(`Effectif insuffisant : 10 secouristes minimum requis pour l'astreinte H24 (${totalVols}/10 actuellement).`);
    }
    if (!hasAgrementA) {
      reasons.push('Agrément A (SAMU 15 / Secours d\'urgence) obligatoire.');
    }
    if (!hasAgrementB) {
      reasons.push('Agrément B (Action Sociale & Soutien aux populations) obligatoire.');
    }
    if (vehCount < 2) {
      reasons.push(`Flotte insuffisante : au moins 2 véhicules requis (${vehCount}/2).`);
    }

    const isEligible = reasons.length === 0;

    // Si les prérequis sont atteints, le SAMU propose officiellement la convention
    if (isEligible && !game.cumpConvention.proposed && !game.cumpConvention.signed) {
      game.cumpConvention.proposed = true;
      game.cumpConvention.proposedAt = Date.now();
      if (window.ProtecNotifications) {
        window.ProtecNotifications.recordNotification({
          title: '🏥 PROPOSITION DE CONVENTION CUMP / SAMU 15',
          message: 'Votre antenne remplit les critères de puissance et d\'agréments. Le SAMU 15 vous propose officiellement la Convention CUMP départementale !',
          category: 'cump',
          level: 'alert'
        });
      }
      game.showToast(
        '🏥 Proposition Convention CUMP',
        'Le SAMU 15 vous sollicite officiellement pour conventionner votre antenne ! Consultez l\'onglet Conventions.',
        'purple'
      );
    }

    return {
      eligible: isEligible,
      reasons,
      totalVols,
      hasAgrementA,
      hasAgrementB,
      vehCount
    };
  },

  // Signature de la convention suite à la sollicitation du SAMU
  signConvention(game) {
    this.injectState(game);
    const prereq = this.checkPrerequisites(game);
    if (!prereq.eligible) {
      game.showToast('Convention Non Éligible', prereq.reasons.join('\n• '), 'orange');
      return;
    }

    if (!confirm('Confirmez-vous la signature de la Convention CUMP avec le SAMU 15 ?\n\n⚠️ RÈGLE OFFICIELLE : Vous disposez de 48 HEURES pour acquérir et conditionner les malles et lots d\'accueil aux normes de la CUMP.\nSi tout n\'est pas prêt sous 48h, le SAMU annulera immédiatement la convention.')) {
      return;
    }

    const now = Date.now();
    game.cumpConvention.signed = true;
    game.cumpConvention.signedAt = now;
    // 48h virtuelles de jeu (ou 48 heures de compte à rebours in-game)
    game.cumpConvention.normComplianceDeadline = now + (48 * 3600 * 1000);
    game.cumpConvention.normCompliant = false;

    // Dotation d'accueil de la convention (1 200 €)
    const dotation = 1200;
    game.resources.money += dotation;
    game.resources.reputationScore = (game.resources.reputationScore || 0) + 20;

    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(game, dotation, 'Dotation Initiale Conventionnement CUMP / SAMU (Mise aux normes 48h)', 'subvention');
    }

    game.showToast(
      'Convention CUMP Signée !',
      `Convention CUMP paraphée (+${dotation} €). Vous avez 48 heures pour conditionner toutes vos malles aux normes du SAMU !`,
      'green'
    );

    game.saveGame();
    game.updateStatsUI();
    this.renderCumpTab(game);
  },

  // Conditionner / acheter une malle aux normes
  equipNormMalle(game, malleId) {
    this.injectState(game);
    const req = this.NORMS_REQUIREMENTS.find(r => r.id === malleId);
    if (!req) return;

    if (game.cumpConvention.verifiedMalles[malleId]) {
      game.showToast('Déjà Conforme', 'Cette malle est déjà conditionnée et vérifiée en réserve.', 'blue');
      return;
    }

    if (game.resources.money < req.cost) {
      game.showToast('Fonds Insuffisants', `L'équipement de cette malle requiert ${req.cost} €.`, 'orange');
      return;
    }

    game.resources.money -= req.cost;
    game.cumpConvention.verifiedMalles[malleId] = true;

    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(game, -req.cost, `Achat / Conditionnement Malle CUMP : ${req.label}`, 'materiel');
    }

    // Vérifier si toutes les malles sont désormais prêtes
    const allReady = this.NORMS_REQUIREMENTS.every(r => game.cumpConvention.verifiedMalles[r.id]);
    if (allReady) {
      game.cumpConvention.normCompliant = true;
      game.showToast(
        '🎉 Antenne 100% Conforme CUMP !',
        'Toutes les malles et lots sont pré-conditionnés, vérifiés et prêts à charger. Votre antenne est officiellement opérationnelle H24 pour la CUMP !',
        'green'
      );
    } else {
      game.showToast('Malle Validée', `Malle « ${req.label} » conditionnée et inspectée (-${req.cost} €).`, 'green');
    }

    game.saveGame();
    game.updateStatsUI();
    this.renderCumpTab(game);
  },

  // Vérifier la conformité des 48h (appelé par le loop de jeu)
  checkComplianceTimer(game) {
    this.injectState(game);
    const conv = game.cumpConvention;
    if (!conv.signed || conv.normCompliant) return;

    if (conv.normComplianceDeadline && Date.now() > conv.normComplianceDeadline) {
      // Échéance des 48h dépassée sans mise aux normes complète !
      conv.signed = false;
      conv.normCompliant = false;
      conv.irregularitiesCount = (conv.irregularitiesCount || 0) + 1;

      game.resources.reputationScore = Math.max(0, (game.resources.reputationScore || 0) - 25);

      game.showToast(
        '🚫 CONVENTION CUMP ANNULÉE !',
        'Délai de 48h dépassé : votre antenne ne s\'est pas mise aux normes requises (malles et lots manquants). Le SAMU 15 a résilié d\'office la convention !',
        'red'
      );

      if (window.ProtecNotifications) {
        window.ProtecNotifications.recordNotification({
          title: '🚫 Annulation Convention CUMP',
          message: 'Défaut de mise aux normes sous 48h. Convention résiliée par le SAMU 15 (-25 réputation).',
          category: 'cump',
          level: 'alert'
        });
      }

      game.saveGame();
      game.updateStatsUI();
    }
  },

  // Résiliation de la convention par le joueur (avec préavis officiel)
  terminateConventionByPlayer(game) {
    this.injectState(game);
    if (!game.cumpConvention.signed) return;

    if (!confirm('Dénonciation de la Convention CUMP :\n\nConformément au cadre légal, la résiliation par l\'AASC est soumise à un préavis de résiliation. Confirmez-vous la transmission de votre préavis au SAMU ?')) {
      return;
    }

    game.cumpConvention.signed = false;
    game.cumpConvention.normCompliant = false;
    game.cumpConvention.proposed = false;
    game.resources.reputationScore = Math.max(0, (game.resources.reputationScore || 0) - 10);

    game.showToast(
      'Convention CUMP Résiliée',
      'Votre antenne a résilié sa convention avec la CUMP. Vos équipages ne seront plus sollicités.',
      'slate'
    );

    game.saveGame();
    game.updateStatsUI();
    this.renderCumpTab(game);
  },

  // Rendu de l'interface CUMP
  renderCumpTab(game) {
    this.injectState(game);
    const prereq = this.checkPrerequisites(game);
    const conv = game.cumpConvention;
    const body = document.getElementById('modal-body');
    if (!body) return;

    const allReady = this.NORMS_REQUIREMENTS.every(r => conv.verifiedMalles[r.id]);
    const timeLeftHours = conv.normComplianceDeadline 
      ? Math.max(0, Math.round((conv.normComplianceDeadline - Date.now()) / (3600 * 1000)))
      : 48;

    body.innerHTML = `
      <div class="space-y-6">

        <!-- Bandeau d'en-tête officiel SAMU / CUMP -->
        <div class="p-4 rounded-3xl bg-gradient-to-r from-red-700 via-rose-800 to-indigo-950 text-white shadow-xl flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
              🏥
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-base font-black">Convention AASC & CUMP (SAMU 15)</h4>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${conv.normCompliant ? 'bg-emerald-500 text-white' : conv.signed ? 'bg-amber-400 text-amber-950' : 'bg-white/20 text-white'}">
                  ${conv.normCompliant ? 'Active & Conforme H24' : conv.signed ? `Mise aux normes (${timeLeftHours}h rest.)` : 'En attente d\'éligibilité'}
                </span>
              </div>
              <p class="text-xs text-white/80 mt-0.5">Cellule d'Urgence Médico-Psychologique • Déploiement CAI sous 2 heures • Astreinte 24h/24 & 365j/an</p>
            </div>
          </div>
        </div>

        <!-- Section 1 : Statut d'Éligibilité & Sollicitation du SAMU -->
        <div class="p-4 rounded-2xl glass-card space-y-3">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black uppercase text-slate-800 tracking-wider">Prérequis Réglementaires pour la Convention</h5>
            <span class="text-xs font-bold ${prereq.eligible ? 'text-emerald-600' : 'text-amber-600'}">
              ${prereq.eligible ? '✅ Antenne Reconnue Apte par le SAMU' : '⚠️ Prérequis Incomplets'}
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold">
            <div class="p-2.5 rounded-xl border ${prereq.totalVols >= 10 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}">
              <span class="block text-[9px] uppercase font-black text-slate-400">Effectif H24</span>
              <strong>${prereq.totalVols} / 10 bénévoles</strong>
            </div>
            <div class="p-2.5 rounded-xl border ${prereq.hasAgrementA ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}">
              <span class="block text-[9px] uppercase font-black text-slate-400">Agrément A</span>
              <strong>${prereq.hasAgrementA ? '✅ Valide' : '❌ Requis'}</strong>
            </div>
            <div class="p-2.5 rounded-xl border ${prereq.hasAgrementB ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}">
              <span class="block text-[9px] uppercase font-black text-slate-400">Agrément B</span>
              <strong>${prereq.hasAgrementB ? '✅ Valide' : '❌ Requis'}</strong>
            </div>
            <div class="p-2.5 rounded-xl border ${prereq.vehCount >= 2 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}">
              <span class="block text-[9px] uppercase font-black text-slate-400">Flotte Opérationnelle</span>
              <strong>${prereq.vehCount} / 2 véhicules</strong>
            </div>
          </div>

          ${!conv.signed ? `
            <div class="pt-2 flex items-center justify-between">
              <p class="text-[11px] text-slate-500 max-w-md">
                ${prereq.eligible 
                  ? 'Le SAMU 15 a validé les capacités de votre antenne et propose officiellement la signature de la convention.' 
                  : 'La CUMP ne sollicite que les antennes puissantes capables d\'armer une astreinte opérationnelle permanente.'}
              </p>
              ${prereq.eligible ? `
                <button onclick="window.ProtecCump.signConvention(window.game)" class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition">
                  Accepter la Demande & Signer
                </button>
              ` : `
                <button disabled class="px-4 py-2 rounded-xl bg-slate-200 text-slate-400 font-extrabold text-xs cursor-not-allowed">
                  Critères Insuffisants
                </button>
              `}
            </div>
          ` : `
            <div class="pt-2 flex items-center justify-between">
              <span class="text-xs text-slate-600 font-bold">Convention Signée • Partenariat avec le SAMU 15 en cours</span>
              <button onclick="window.ProtecCump.terminateConventionByPlayer(window.game)" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 font-bold text-xs transition border border-slate-200">
                Résiliation avec Préavis
              </button>
            </div>
          `}
        </div>

        <!-- Section 2 : MISE AUX NORMES EN 48H (MALLES ET LOTS PRÉ-CONDITIONNÉS) -->
        ${conv.signed ? `
          <div class="p-4 rounded-2xl glass-card space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h5 class="text-xs font-black uppercase text-slate-800 tracking-wider">Cahier des Charges & Malles Pré-conditionnées</h5>
                <p class="text-[11px] text-slate-500">Lots étiquetés, vérifiés et prêts à charger dès l'appel du SAMU. Délai strict de 48h dès la signature !</p>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-black ${conv.normCompliant ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900 animate-pulse'}">
                ${conv.normCompliant ? 'Conformité Validée ✅' : `Délai restant : ${timeLeftHours}h`}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${this.NORMS_REQUIREMENTS.map(r => {
                const isReady = !!conv.verifiedMalles[r.id];
                return `
                  <div class="p-3.5 rounded-2xl border ${isReady ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between space-y-2">
                    <div>
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-black ${isReady ? 'text-emerald-900' : 'text-slate-900'}">${r.label}</span>
                        <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase ${isReady ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-800'}">
                          ${isReady ? 'Conforme' : 'Non Équipé'}
                        </span>
                      </div>
                      <p class="text-[10px] text-slate-500 mt-1">${r.desc}</p>
                    </div>

                    <div class="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span class="text-xs font-black mono-num text-slate-700">${r.cost} €</span>
                      ${isReady ? `
                        <span class="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          ✅ Prêt au local
                        </span>
                      ` : `
                        <button onclick="window.ProtecCump.equipNormMalle(window.game, '${r.id}')" class="px-3 py-1.5 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white font-extrabold text-xs shadow-sm transition">
                          Conditionner & Acheter
                        </button>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // Décompte périodique pour la convention CUMP et conformité 48h
  updateCumpMissionsClock(game) {
    if (typeof this.checkComplianceTimer === 'function') {
      this.checkComplianceTimer(game);
    }
  },

  // Déclenchement d'alerte CUMP / CAI par le SAMU 15
  triggerCumpAlert(game) {
    if (!game.cumpConvention || !game.cumpConvention.signed || !game.cumpConvention.normCompliant) return;
    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory(
        'alertes',
        '🚨 Réquisition SAMU : Urgence CUMP',
        'Le SAMU sollicite l’antenne pour l’ouverture et l’armement immédiat d’un Centre d’Accueil des Impliqués (CAI).',
        `cump-alert-${Date.now()}`
      );
    }
  },

  // Rendu de la carte résumé de convention CUMP pour la vue Devis / Conventions
  renderConventionCardHTML(game) {
    this.injectState(game);
    const conv = game.cumpConvention;
    const prereq = this.checkPrerequisites(game);

    return `
      <div class="p-4 rounded-2xl glass-card border border-slate-200 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-black">
              🏥
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-xs font-black text-slate-900">Convention SAMU 15 / CUMP</h4>
                <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase ${conv.signed ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'}">
                  ${conv.signed ? (conv.normCompliant ? 'Convention Active ✅' : 'Mise aux normes (48h) ⏳') : (prereq.eligible ? 'Sollicitation reçue 📩' : 'Non éligible 🔒')}
                </span>
              </div>
              <p class="text-[11px] text-slate-500">Mise à disposition de lots d’accueil, CAI et matériel de confort psychologique d’urgence.</p>
            </div>
          </div>
          <button onclick="window.game.openModule('conventions')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-pc-blue text-white hover:bg-pc-blue-light transition shadow-sm">
            ${conv.signed ? 'Gérer la Convention' : 'Voir les Détails'}
          </button>
        </div>
      </div>
    `;
  }
};
