const fs = require('fs');

let code = fs.readFileSync('js/locaux.js', 'utf8');

// 1. Définition des méthodes modulaires de gestion des locaux
const modularMethods = `
  // Initialisation et rétrocompatibilité modulaire des locaux de l'antenne
  ensureModularPremises(station, game) {
    if (!station) return null;
    if (!station.premises) {
      station.premises = {};
    }
    const p = station.premises;
    p.name = p.name || ('Base Opérationnelle - ' + (station.name || 'Antenne Locale'));
    p.address = p.address || ((station.city || 'Nancy') + ' Centre');
    p.commune = p.commune || station.city || 'Nancy';

    // 2. Statut d'occupation réaliste : mise_a_disposition_mairie | location_privee | pleine_propriete
    if (!p.occupationType) {
      p.occupationType = p.tenure === 'owned' ? 'pleine_propriete' : 'mise_a_disposition_mairie';
    }
    p.monthlyRent = p.occupationType === 'location_privee' ? (p.monthlyRent || 850) : 0;
    p.buyoutPrice = p.buyoutPrice || 55000;
    p.evictionNotice = p.evictionNotice || false;
    p.chargesImposed = p.chargesImposed || false;

    // 4. Charges de fluides, isolation & conformité ERP
    if (p.fluidesBaseCost === undefined) p.fluidesBaseCost = 180;
    if (p.isolationLevel === undefined) p.isolationLevel = 2; // 1: Passoire, 2: Standard, 3: BBC
    if (p.heatingWorking === undefined) p.heatingWorking = true;
    if (p.maintenanceState === undefined) p.maintenanceState = 90;
    if (p.erpStatus === undefined) p.erpStatus = 'conforme';
    if (p.erpSecurityScore === undefined) p.erpSecurityScore = 90;
    if (p.erpExtincteursChecked === undefined) p.erpExtincteursChecked = true;
    if (p.erpBaesChecked === undefined) p.erpBaesChecked = true;
    if (p.erpRegisterUpToDate === undefined) p.erpRegisterUpToDate = true;

    // 1. Les 5 Pièces / Modules spécialisés
    p.rooms = p.rooms || {};

    // 1.1 Garage & Remisage
    if (!p.rooms.garage_remisage) {
      p.rooms.garage_remisage = {
        id: 'garage_remisage',
        name: 'Garage & Remisage Véhicules',
        icon: '🚑',
        level: 1, // 1: 2 places, 2: 4 places, 3: 8 places
        capacity: 2,
        hasAtelierMecanique: false,
        state: 90,
        craftsmanCost: 2200,
        volunteerMatCost: 750,
        reqVolunteers: 3
      };
    }

    // 1.2 Sas Désinfection & Pharmacie
    if (!p.rooms.sas_desinfection_pharmacie) {
      p.rooms.sas_desinfection_pharmacie = {
        id: 'sas_desinfection_pharmacie',
        name: 'Sas Désinfection & Pharmacie',
        icon: '🧪',
        level: 1, // 1: Standard, 2: Point d'eau VPSP rapide (-50% temps), 3: Pharmacie sécurisée grand stock
        hasWaterPoint: false,
        state: 85,
        craftsmanCost: 1600,
        volunteerMatCost: 550,
        reqVolunteers: 3
      };
    }

    // 1.3 Salle de Formation PSC1
    if (!p.rooms.salle_formation_psc1) {
      p.rooms.salle_formation_psc1 = {
        id: 'salle_formation_psc1',
        name: 'Salle Pédagogique PSC1',
        icon: '🎓',
        level: 1, // 0: 0p, 1: 10p, 2: 20p, 3: 30p
        capacity: 10,
        hasVideoprojecteur: false,
        hasQcprMannequins: false,
        state: 90,
        craftsmanCost: 2500,
        volunteerMatCost: 850,
        reqVolunteers: 4
      };
    }

    // 1.4 Foyer Vie Associative
    if (!p.rooms.foyer_vie_associative) {
      p.rooms.foyer_vie_associative = {
        id: 'foyer_vie_associative',
        name: 'Foyer & Vie Associative',
        icon: '☕',
        level: 1, // 1: Basique, 2: Convivial (+moral passif), 3: Espace détente premium (+moral & cohésion)
        state: 95,
        hasCuisineEquipee: false,
        craftsmanCost: 1200,
        volunteerMatCost: 400,
        reqVolunteers: 3
      };
    }

    // 1.5 Bureau Direction & PC Radio
    if (!p.rooms.bureau_pc_radio) {
      p.rooms.bureau_pc_radio = {
        id: 'bureau_pc_radio',
        name: 'Bureau Direction & PC Radio',
        icon: '📡',
        level: 1, // 1: 1 DPS, 2: 3 DPS simultanés, 3: Coordination illimitée / Salle COD
        state: 85,
        craftsmanCost: 1800,
        volunteerMatCost: 600,
        reqVolunteers: 3
      };
    }

    p.ongoingWorks = p.ongoingWorks || [];
    return p;
  },

  // Calcul des véhicules abrités vs stationnés dehors
  getVehiclesShelterStatus(game, stationId) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return { shelteredVehicles: [], unshelteredVehicles: [], capacity: 0 };
    const premises = this.ensureModularPremises(station, game);
    const capacity = premises.rooms?.garage_remisage?.capacity || 2;
    const stationVehicles = (game.vehicles || []).filter(v => v.stationId === station.id);

    const shelteredVehicles = stationVehicles.slice(0, capacity);
    const unshelteredVehicles = stationVehicles.slice(capacity);

    shelteredVehicles.forEach(v => { v.isSheltered = true; });
    unshelteredVehicles.forEach(v => { v.isSheltered = false; });

    return {
      shelteredVehicles,
      unshelteredVehicles,
      capacity,
      totalCount: stationVehicles.length
    };
  },

  // Amélioration d'une pièce : Artisans vs Chantier Bénévoles
  upgradeRoom(game, stationId, roomId, mode) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;
    const premises = this.ensureModularPremises(station, game);
    const room = premises.rooms?.[roomId];
    if (!room) return;

    if (room.level >= 3) {
      game.showToast('Niveau Maximum', room.name + ' a déjà atteint son niveau maximal d\\'aménagement.', 'blue');
      return;
    }

    if (mode === 'artisan') {
      const cost = room.craftsmanCost || 2000;
      if (game.resources.money < cost) {
        game.showToast('Trésorerie Insuffisante', 'L\\'intervention des artisans requiert ' + cost + ' €.', 'orange');
        return;
      }
      game.resources.money -= cost;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, -cost, 'Travaux d\\'artisans : ' + room.name + ' Niveau ' + (room.level + 1), 'locaux');
      }

      room.level += 1;
      room.state = 100;
      if (roomId === 'garage_remisage') {
        room.capacity = room.level === 2 ? 4 : 8;
      } else if (roomId === 'salle_formation_psc1') {
        room.capacity = room.level === 2 ? 20 : 30;
      }
      room.craftsmanCost = Math.round(room.craftsmanCost * 1.5);
      room.volunteerMatCost = Math.round(room.volunteerMatCost * 1.5);

      game.showToast('Travaux Artisans Terminés 👷✓', room.name + ' a été agrandi et modernisé au Niveau ' + room.level + ' !', 'green');
    } else if (mode === 'chantier_benevole') {
      const matCost = room.volunteerMatCost || 700;
      if (game.resources.money < matCost) {
        game.showToast('Fonds Insuffisants', 'L\\'achat des matériaux de construction requiert ' + matCost + ' €.', 'orange');
        return;
      }

      const reqCount = room.reqVolunteers || 3;
      const availableVols = (game.volunteers || []).filter(v => (v.status === 'dispo' || v.status === 'sdis_caserne') && (!v.fatigue || v.fatigue < 80));
      if (availableVols.length < reqCount) {
        game.showToast(
          'Effectif Insuffisant',
          'Le chantier participatif requiert au moins ' + reqCount + ' bénévoles disponibles et en forme (' + availableVols.length + '/' + reqCount + ' prêts).',
          'orange'
        );
        return;
      }

      game.resources.money -= matCost;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, -matCost, 'Achat matériaux - Chantier Bénévoles : ' + room.name, 'locaux');
      }

      // Mobilisation des bénévoles
      const mobilised = availableVols.slice(0, reqCount);
      mobilised.forEach(v => {
        v.fatigue = Math.min(100, (v.fatigue || 20) + 16);
        v.energy = Math.max(0, 100 - v.fatigue);
        v.moral = Math.min(100, (v.moral || 70) + 25); // Boost de cohésion collective !
        v.motivation = v.moral;
        v.humeur = v.moral;
        v.exp = (v.exp || 0) + 20;
      });

      room.level += 1;
      room.state = 100;
      if (roomId === 'garage_remisage') {
        room.capacity = room.level === 2 ? 4 : 8;
      } else if (roomId === 'salle_formation_psc1') {
        room.capacity = room.level === 2 ? 20 : 30;
      }
      room.craftsmanCost = Math.round(room.craftsmanCost * 1.5);
      room.volunteerMatCost = Math.round(room.volunteerMatCost * 1.5);

      game.showToast(
        '🎉 Week-End Travaux Réussi !',
        room.name + ' monté au Niveau ' + room.level + ' par ' + mobilised.map(v => v.name).join(', ') + ' ! Coût réduit (' + matCost + ' €), cohésion d\\'équipe renforcée (+25 moral) !',
        'green'
      );
    }

    game.updateStatsUI();
    game.saveGame();
    this.renderModal(game);
  },

  // Installation d'une extension optionnelle
  installRoomExtension(game, stationId, roomId, extensionKey, mode) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;
    const premises = this.ensureModularPremises(station, game);
    const room = premises.rooms?.[roomId];
    if (!room) return;

    let cost = 0;
    let label = '';

    if (roomId === 'garage_remisage' && extensionKey === 'atelier_mecanique') {
      cost = mode === 'artisan' ? 1500 : 500;
      label = 'Atelier Mécanique Interne (Entretien flotte -50%)';
      room.hasAtelierMecanique = true;
    } else if (roomId === 'sas_desinfection_pharmacie' && extensionKey === 'point_d_eau_vpsp') {
      cost = mode === 'artisan' ? 1200 : 400;
      label = 'Centrale de Bionettoyage & Point d\\'Eau VPSP (-50% temps réarmement)';
      room.hasWaterPoint = true;
    } else if (roomId === 'salle_formation_psc1' && extensionKey === 'videoprojecteur') {
      cost = 650;
      label = 'Vidéoprojecteur Interactif HD Pédagogique';
      room.hasVideoprojecteur = true;
    } else if (roomId === 'salle_formation_psc1' && extensionKey === 'mannequins_qcpr') {
      cost = 1400;
      label = 'Pack Mannequins Connectés QCPR (Qualité Massage & Notoriété)';
      room.hasQcprMannequins = true;
    } else if (roomId === 'foyer_vie_associative' && extensionKey === 'cuisine_equipee') {
      cost = mode === 'artisan' ? 1600 : 550;
      label = 'Cuisine Aménagée Conviviale & Machine à Café Pro';
      room.hasCuisineEquipee = true;
    }

    if (game.resources.money < cost) {
      game.showToast('Trésorerie Insuffisante', 'L\\'installation requiert ' + cost + ' €.', 'orange');
      return;
    }

    game.resources.money -= cost;
    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(game, -cost, 'Installation extension : ' + label, 'locaux');
    }

    game.showToast('Extension Opérationnelle ✓', label + ' est désormais installée dans ' + room.name + ' !', 'green');
    game.updateStatsUI();
    game.saveGame();
    this.renderModal(game);
  },

  // Changement du statut d'occupation (Mairie vs Location privée vs Pleine propriété)
  changeOccupationType(game, stationId, newType) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;
    const premises = this.ensureModularPremises(station, game);
    const city = station.city || 'Nancy';
    const repCity = (game.reputation_villes && game.reputation_villes[city] !== undefined) ? game.reputation_villes[city] : 50;

    if (newType === 'mise_a_disposition_mairie') {
      if (repCity < 40) {
        game.showToast('Refus Municipal 🏛️', 'La Mairie de ' + city + ' exige une réputation d\\'au moins 40/100 pour accorder un local gracieux (' + repCity + '/100 actuel).', 'orange');
        return;
      }
      premises.occupationType = 'mise_a_disposition_mairie';
      premises.monthlyRent = 0;
      premises.evictionNotice = false;
      premises.chargesImposed = false;
      game.showToast('Convention Mairie Signée ✓', 'La Mairie de ' + city + ' met gracieusement à disposition votre bâtiment (0 € de loyer mensuel) !', 'green');
    } else if (newType === 'location_privee') {
      premises.occupationType = 'location_privee';
      premises.monthlyRent = 850;
      premises.evictionNotice = false;
      premises.chargesImposed = false;
      game.showToast('Bail Commercial Privé', 'Vous avez signé un bail dans le secteur privé (loyer 850 €/mois). Vous êtes 100% indépendant de la Mairie.', 'blue');
    } else if (newType === 'pleine_propriete') {
      const price = premises.buyoutPrice || 55000;
      if (game.resources.money < price) {
        game.showToast('Fonds Insuffisants', 'L\\'acquisition définitive des murs requiert ' + price.toLocaleString('fr-FR') + ' €.', 'orange');
        return;
      }
      game.resources.money -= price;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, -price, 'Acquisition définitive des murs - Pleine Propriété', 'locaux');
      }
      premises.occupationType = 'pleine_propriete';
      premises.monthlyRent = 0;
      premises.tenure = 'owned';
      premises.evictionNotice = false;
      premises.chargesImposed = false;
      game.showToast('🎉 Félicitations : Pleine Propriété !', 'L\\'antenne est propriétaire définitive de son bâtiment ! Loyer supprimé à vie et patrimoine valorisé.', 'green');
    }

    game.updateStatsUI();
    game.saveGame();
    this.renderModal(game);
  },

  // Audit & Maintenance de sécurité ERP (Établissement Recevant du Public)
  conductErpAuditAndMaintenance(game, stationId) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;
    const premises = this.ensureModularPremises(station, game);

    const cost = 220;
    if (game.resources.money < cost) {
      game.showToast('Fonds Insuffisants', 'Le contrôle réglementaire ERP (extincteurs, BAES, registre) requiert ' + cost + ' €.', 'orange');
      return;
    }

    game.resources.money -= cost;
    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(game, -cost, 'Maintenance réglementaire ERP (Extincteurs & Blocs BAES)', 'locaux');
    }

    premises.erpStatus = 'conforme';
    premises.erpSecurityScore = 100;
    premises.erpExtincteursChecked = true;
    premises.erpBaesChecked = true;
    premises.erpRegisterUpToDate = true;
    premises.lastErpAuditTimestamp = Date.now();

    game.showToast('Audit & Registre ERP Validés ✓', 'Extincteurs vérifiés, blocs de secours opérationnels et registre de sécurité visé. Salle de formation 100% conforme !', 'green');
    game.updateStatsUI();
    game.saveGame();
    this.renderModal(game);
  },

  // Travaux d'isolation thermique (BBC)
  upgradeInsulation(game, stationId, mode) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;
    const premises = this.ensureModularPremises(station, game);

    if (premises.isolationLevel >= 3) {
      game.showToast('Déjà Isolé', 'Le bâtiment bénéficie déjà du standard d\\'isolation BBC haute performance.', 'blue');
      return;
    }

    if (mode === 'artisan') {
      const cost = 3500;
      if (game.resources.money < cost) {
        game.showToast('Fonds Insuffisants', 'Les travaux d\\'isolation par artisans requièrent ' + cost + ' €.', 'orange');
        return;
      }
      game.resources.money -= cost;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, -cost, 'Travaux d\\'isolation thermique BBC (Artisans)', 'locaux');
      }
      premises.isolationLevel = 3;
      game.showToast('Isolation BBC Terminée ✓', 'Bâtiment isolé standard BBC ! Factures de chauffage réduites de 30% et protection intégrale contre le gel.', 'green');
    } else {
      const matCost = 1200;
      if (game.resources.money < matCost) {
        game.showToast('Fonds Insuffisants', 'L\\'achat de laine de verre et double vitrage requiert ' + matCost + ' €.', 'orange');
        return;
      }
      const availableVols = (game.volunteers || []).filter(v => v.status === 'dispo' && (!v.fatigue || v.fatigue < 80));
      if (availableVols.length < 4) {
        game.showToast('Bénévoles Manquants', 'Le chantier d\\'isolation requiert au moins 4 bénévoles disponibles.', 'orange');
        return;
      }
      game.resources.money -= matCost;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, -matCost, 'Matériaux isolation thermique - Chantier Bénévoles', 'locaux');
      }
      availableVols.slice(0, 4).forEach(v => {
        v.fatigue = Math.min(100, (v.fatigue || 20) + 18);
        v.energy = Math.max(0, 100 - v.fatigue);
        v.moral = Math.min(100, (v.moral || 70) + 20);
        v.motivation = v.moral;
        v.humeur = v.moral;
      });
      premises.isolationLevel = 3;
      game.showToast('🎉 Chantier Isolation Réussi !', '4 bénévoles ont isolé les combles et posé les doubles vitrages ! Factures réduites de 30%.', 'green');
    }

    game.updateStatsUI();
    game.saveGame();
    this.renderModal(game);
  },

  // Tableau de bord modulaire principal (les 5 pièces spécialisées, statut d'occupation et garage)
  renderModulaireTab(game, station, premises, stats) {
    const shelter = this.getVehiclesShelterStatus(game, station.id);
    const repCity = (game.reputation_villes && game.reputation_villes[station.city]) !== undefined ? game.reputation_villes[station.city] : 55;
    const isMairie = premises.occupationType === 'mise_a_disposition_mairie';
    const isPrive = premises.occupationType === 'location_privee';
    const isOwner = premises.occupationType === 'pleine_propriete';

    const fluidesEstimate = Math.round(
      (premises.fluidesBaseCost || 180) * 
      (premises.isolationLevel === 1 ? 1.8 : (premises.isolationLevel === 3 ? 0.7 : 1.0))
    );

    const rooms = premises.rooms || {};
    const garage = rooms.garage_remisage;
    const sas = rooms.sas_desinfection_pharmacie;
    const psc1 = rooms.salle_formation_psc1;
    const foyer = rooms.foyer_vie_associative;
    const pcRadio = rooms.bureau_pc_radio;

    return \`
      <div class="space-y-4">
        <!-- 1. CARTE D'IDENTITÉ & STATUT D'OCCUPATION DU BÂTIMENT -->
        <div class="p-4 rounded-3xl glass-card border border-indigo-200/80 shadow-xs space-y-3.5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xl">\${isOwner ? '🏛️' : (isMairie ? '🏢' : '🏭')}</span>
                <h4 class="text-sm font-black text-slate-900 leading-tight">\${premises.name}</h4>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase \${isOwner ? 'bg-emerald-100 text-emerald-800' : (isMairie ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')}">
                  \${isOwner ? 'Pleine Propriété' : (isMairie ? 'Mise à Disposition Mairie' : 'Location Privée')}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">📍 \${premises.address} • Commune : <strong>\${station.city}</strong></p>
            </div>

            <!-- Indicateurs Économiques du Bâtiment -->
            <div class="flex items-center gap-3 text-xs">
              <div class="text-right">
                <div class="text-[10px] text-slate-400 font-semibold">Loyer Mensuel</div>
                <strong class="font-mono \${premises.monthlyRent === 0 ? 'text-emerald-700' : 'text-slate-800'}">
                  \${premises.monthlyRent === 0 ? '0 € (Gratuit)' : (premises.monthlyRent + ' € / mois')}
                </strong>
              </div>
              <div class="text-right border-l border-slate-200 pl-3">
                <div class="text-[10px] text-slate-400 font-semibold">Fluides & Énergie</div>
                <strong class="font-mono text-slate-800">~\${fluidesEstimate} € / mois</strong>
              </div>
            </div>
          </div>

          <!-- Alertes Politiques & Aléa Mairie si réputation fragile -->
          \${isMairie ? \`
            <div class="p-3 rounded-2xl \${repCity < 30 ? 'bg-red-50 border-2 border-red-300 ring-2 ring-red-100 text-red-900' : 'bg-slate-50 border border-slate-200 text-slate-700'} text-xs space-y-1.5">
              <div class="flex items-center justify-between font-bold">
                <span class="flex items-center gap-1.5">
                  <span>🏛️</span> Relations Mairie de \${station.city} :
                  <strong class="\${repCity < 30 ? 'text-red-700' : 'text-slate-900'} font-mono">\${repCity}/100</strong>
                </span>
                \${repCity < 30 ? '<span class=\"px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white animate-pulse\">⚠️ PRÉAVIS EXPULSION ACTIF</span>' : '<span class=\"text-[10px] text-emerald-700 font-extrabold\">✓ Soutien communal maintenu</span>'}
              </div>
              <p class="text-[11px] \${repCity < 30 ? 'text-red-800 font-semibold' : 'text-slate-500'}">
                \${repCity < 30 ? 'Alerte : Le Maire et les élus exigent 650 € d\\'indemnité d\\'occupation et menacent de reprendre les clés sous 30 jours ! Redressez votre réputation sur les DPS ou louez dans le privé.' : 'Tant que votre réputation reste au-dessus de 30 pts, la municipalité maintient la gratuité intégrale du local.'}
              </p>
            </div>
          \` : ''}

          <!-- Conformité ERP & Isolation Thermique -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div class="p-3 rounded-2xl bg-white/90 border border-slate-200 flex items-center justify-between">
              <div>
                <div class="flex items-center gap-1.5 font-extrabold text-slate-800">
                  <span>🧯</span> Conformité ERP (\${premises.erpSecurityScore}%)
                </div>
                <span class="text-[10px] text-slate-500">
                  \${premises.erpStatus === 'conforme' ? 'Extincteurs & Blocs BAES vérifiés ✓' : '🚨 Salle PSC1 suspendue par la sécurité'}
                </span>
              </div>
              <button onclick="window.ProtecLocaux.conductErpAuditAndMaintenance(window.game, '\${station.id}')" class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[10.5px] transition">
                Audit (220 €)
              </button>
            </div>

            <div class="p-3 rounded-2xl bg-white/90 border border-slate-200 flex items-center justify-between">
              <div>
                <div class="flex items-center gap-1.5 font-extrabold text-slate-800">
                  <span>🌡️</span> Isolation : \${premises.isolationLevel === 3 ? 'BBC Double Vitrage ✓' : (premises.isolationLevel === 2 ? 'Standard' : 'Passoire thermique ⚠️')}
                </div>
                <span class="text-[10px] text-slate-500">
                  \${premises.isolationLevel === 3 ? 'Factures de chauffage -30%' : (premises.isolationLevel === 1 ? 'Surconsommation hiver +80%' : 'Isolation intermédiaire')}
                </span>
              </div>
              \${premises.isolationLevel < 3 ? \`
                <div class="flex gap-1.5">
                  <button onclick="window.ProtecLocaux.upgradeInsulation(window.game, '\${station.id}', 'chantier_benevole')" class="px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-black text-[10px] transition" title="Chantier participatif bénévoles (1 200 €)">
                    Chantier (1,2k€)
                  </button>
                  <button onclick="window.ProtecLocaux.upgradeInsulation(window.game, '\${station.id}', 'artisan')" class="px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] transition" title="Entreprise isolation (3 500 €)">
                    Artisans
                  </button>
                </div>
              \` : '<span class=\"px-2 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800\">Isolé BBC</span>'}
            </div>
          </div>

          <!-- Actions de Changement de Statut Juridique -->
          <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            \${!isOwner ? \`
              <button onclick="window.ProtecLocaux.changeOccupationType(window.game, '\${station.id}', 'pleine_propriete')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black hover:brightness-110 shadow transition flex items-center gap-1">
                <span>🏛️</span> Racheter les Murs (\${(premises.buyoutPrice || 55000).toLocaleString('fr-FR')} €)
              </button>
            \` : ''}
            \${!isPrive && !isOwner ? \`
              <button onclick="window.ProtecLocaux.changeOccupationType(window.game, '\${station.id}', 'location_privee')" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition">
                Bail Privé Indépendant (850 €/mois)
              </button>
            \` : ''}
            \${isPrive ? \`
              <button onclick="window.ProtecLocaux.changeOccupationType(window.game, '\${station.id}', 'mise_a_disposition_mairie')" class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-[11px] font-extrabold transition">
                Demander Convention Mairie Gratuite (≥40 pts réputation)
              </button>
            \` : ''}
          </div>
        </div>

        <!-- 2. VOLET GARAGE & REMISAGE FLOTTE : VÉHICULES ABRITÉS VS DEHORS -->
        <div class="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">🚑</span>
              <div>
                <h4 class="text-xs font-black text-slate-900 uppercase tracking-wider">Capacité de Remisage Véhicules</h4>
                <p class="text-[11px] text-slate-500">\${shelter.capacity} place(s) couverte(s) protégée(s) • \${shelter.totalCount} véhicule(s) à l\\'antenne</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              \${garage.hasAtelierMecanique ? \`
                <span class="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  🔧 Atelier Mécanique Actif (-50% garage)
                </span>
              \` : \`
                <button onclick="window.ProtecLocaux.installRoomExtension(window.game, '\${station.id}', 'garage_remisage', 'atelier_mecanique', 'chantier_benevole')" class="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition">
                  + Créer Atelier Interne (500 € chantier)
                </button>
              \`}
            </div>
          </div>

          <!-- Liste des véhicules abrités vs stationnés dehors -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div class="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-black text-emerald-900">
                <span>🛡️ À l\\'Abri dans le Garage (\${shelter.shelteredVehicles.length}/\${shelter.capacity})</span>
                <span class="text-emerald-700">Protégés du gel & météo</span>
              </div>
              \${shelter.shelteredVehicles.length === 0 ? '<span class=\"text-[10px] text-slate-400 italic\">Aucun véhicule</span>' : \`
                <div class="flex flex-wrap gap-1.5">
                  \${shelter.shelteredVehicles.map(v => \`
                    <span class="px-2 py-0.5 rounded-lg bg-white border border-emerald-200 text-[10.5px] font-extrabold text-emerald-900 shadow-2xs">
                      \${v.name} (\${v.type})
                    </span>
                  \`).join('')}
                </div>
              \`}
            </div>

            <div class="p-3 rounded-2xl \${shelter.unshelteredVehicles.length > 0 ? 'bg-amber-50/70 border border-amber-300' : 'bg-slate-50 border border-slate-200'} space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-black \${shelter.unshelteredVehicles.length > 0 ? 'text-amber-900' : 'text-slate-600'}">
                <span>🌧️ Stationnés Dehors (\${shelter.unshelteredVehicles.length})</span>
                <span class="\${shelter.unshelteredVehicles.length > 0 ? 'text-amber-700' : 'text-slate-400'}">Usure accrue carrosserie & batterie</span>
              </div>
              \${shelter.unshelteredVehicles.length === 0 ? '<span class=\"text-[10px] text-emerald-600 font-semibold\">Tous vos véhicules dorment à l\\'abri ! ✓</span>' : \`
                <div class="flex flex-wrap gap-1.5">
                  \${shelter.unshelteredVehicles.map(v => \`
                    <span class="px-2 py-0.5 rounded-lg bg-white border border-amber-300 text-[10.5px] font-extrabold text-amber-900 shadow-2xs">
                      ⚠️ \${v.name}
                    </span>
                  \`).join('')}
                </div>
              \`}
            </div>
          </div>
        </div>

        <!-- 3. GRILLE DES 5 PIÈCES / MODULES SPÉCIALISÉS DE L'ANTENNE -->
        <div class="space-y-3">
          <div class="flex items-center justify-between text-xs font-black text-slate-700">
            <span>Zonage Modulaire & Salles Opérationnelles</span>
            <span class="text-[11px] text-slate-500 font-semibold">2 modes d\\'aménagement : Artisans (instantané) vs Chantier Bénévoles (matériaux & moral)</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <!-- PIÈCE 1 : GARAGE & REMISAGE -->
            <div class="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">\${garage.icon}</span>
                  <div>
                    <h5 class="text-xs font-black text-slate-900 leading-tight">\${garage.name}</h5>
                    <span class="text-[10px] font-bold text-slate-500">Niveau \${garage.level} • Capacité : \${garage.capacity} véhicules couverts</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-800">
                  Remisage
                </span>
              </div>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Protège les ambulances VPSP et vecteurs contre la pluie, la canicule et le gel. \${garage.hasAtelierMecanique ? '✓ Atelier mécanique intégré réduisant de 50% les frais d\\'entretien garage.' : 'Possibilité d\\'installer un atelier pour réparations internes.'}
              </p>
              \${garage.level < 3 ? \`
                <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <button onclick="window.ProtecLocaux.upgradeRoom(window.game, '\${station.id}', 'garage_remisage', 'chantier_benevole')" class="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10.5px] font-black shadow-xs transition" title="Achète les matériaux (750 €) et mobilise 3 bénévoles le week-end (+25 moral)">
                    🔨 Chantier (\${garage.volunteerMatCost} €)
                  </button>
                  <button onclick="window.ProtecLocaux.upgradeRoom(window.game, '\${station.id}', 'garage_remisage', 'artisan')" class="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-extrabold transition" title="Artisans du bâtiment (2 200 €)">
                    👷 Artisans (\${garage.craftsmanCost} €)
                  </button>
                </div>
              \` : '<div class=\"p-2 rounded-xl bg-emerald-50 text-emerald-800 font-black text-center text-xs\">Garage Agrandissement Maximum (8 places) ✓</div>'}
            </div>

            <!-- PIÈCE 2 : SAS DÉSINFECTION & PHARMACIE -->
            <div class="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">\${sas.icon}</span>
                  <div>
                    <h5 class="text-xs font-black text-slate-900 leading-tight">\${sas.name}</h5>
                    <span class="text-[10px] font-bold text-slate-500">Niveau \${sas.level} • Stockage Lots A/B & Oxygène</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-50 text-teal-800">
                  Hygiène & O2
                </span>
              </div>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Stockage sécurisé des consommables de secours. \${sas.hasWaterPoint ? '✓ Point d\\'eau chaude et centrale de désinfection VPSP : temps de réarmement post-mission divisé par 2 !' : 'Installation recommandée d\\'un point d\\'eau chaude pour accélérer le réarmement VPSP.'}
              </p>
              <div class="space-y-2 pt-1 border-t border-slate-100">
                \${!sas.hasWaterPoint ? \`
                  <button onclick="window.ProtecLocaux.installRoomExtension(window.game, '\${station.id}', 'sas_desinfection_pharmacie', 'point_d_eau_vpsp', 'chantier_benevole')" class="w-full py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-[10.5px] font-extrabold border border-teal-200 transition">
                    + Installer Centrale Désinfection VPSP (400 € chantier / 3 bénév.)
                  </button>
                \` : ''}
                \${sas.level < 3 ? \`
                  <div class="grid grid-cols-2 gap-2">
                    <button onclick="window.ProtecLocaux.upgradeRoom(window.game, '\${station.id}', 'sas_desinfection_pharmacie', 'chantier_benevole')" class="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10.5px] font-black shadow-xs transition">
                      🔨 Chantier (\${sas.volunteerMatCost} €)
                    </button>
                    <button onclick="window.ProtecLocaux.upgradeRoom(window.game, '\${station.id}', 'sas_desinfection_pharmacie', 'artisan')" class="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-extrabold transition">
                      👷 Artisans (\${sas.craftsmanCost} €)
                    </button>
                  </div>
                \` : '<div class=\"p-2 rounded-xl bg-emerald-50 text-emerald-800 font-black text-center text-xs\">Pharmacie & Bionettoyage Conforme ARS ✓</div>'}
              </div>
            </div>

            <!-- PIÈCE 3 : SALLE DE FORMATION PSC1 -->
            <div class="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">\${psc1.icon}</span>
                  <div>
                    <h5 class="text-xs font-black text-slate-900 leading-tight">\${psc1.name}</h5>
                    <span class="text-[10px] font-bold text-slate-500">Niveau \${psc1.level} • Capacité : \${psc1.capacity} apprenants</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-800">
                  Pôle Formation
                </span>
              </div>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Conditionne les sessions de formation citoyenne PSC1/GQS. \${psc1.hasVideoprojecteur ? '✓ Vidéoprojecteur interactif actif (+20% inscrits).' : ''} \${psc1.hasQcprMannequins ? '✓ Mannequins connectés QCPR actifs (+30% réputation, +15 €/personne).' : ''}
              </p>
              <div class="space-y-2 pt-1 border-t border-slate-100">
                <div class="flex flex-wrap gap-2">
                  \${!psc1.hasVideoprojecteur ? \`
                    <button onclick="window.ProtecLocaux.installRoomExtension(window.game, '\${station.id}', 'salle_formation_psc1', 'videoprojecteur')" class="py-1 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-[10px] font-extrabold border border-purple-200 transition">
                      + Vidéoprojecteur (650 €)
                    </button>
                  \` : ''}
                  \${!psc1.hasQcprMannequins ? \`
                    <button onclick="window.ProtecLocaux.installRoomExtension(window.game, '\${station.id}', 'salle_formation_psc1', 'mannequins_qcpr')" class="py-1 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-[10px] font-extrabold border border-purple-200 transition">
                      + Mannequins QCPR (1 400 €)
                    </button>
                  \` : ''}
                </div>
                \${psc1.level < 3 ? \`
                  <div class="grid grid-cols-2 gap-2">
                    <button onclick="window.ProtecLocaux.upgradeRoom(window.game, '\${station.id}', 'salle_formation_psc1', 'chantier_benevole')" class="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10.5px] font-black shadow-xs transition">
                      🔨 Chantier (\${psc1.volunteerMatCost} €)
                    </button>
                    <button onclick="window.ProtecLocaux.upgradeRoom(window.game, '\${station.id}', 'salle_formation_psc1', 'artisan')" class="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-extrabold transition">
                      👷 Artisans (\${psc1.craftsmanCost} €)
                    </button>
                  </div>
                \` : '<div class=\"p-2 rounded-xl bg-emerald-50 text-emerald-800 font-black text-center text-xs\">Amphithéâtre PSC1 30 Places Validé ✓</div>'}
              </div>
            </div>

            <!-- PIÈCE 4 : FOYER & VIE ASSOCIATIVE -->
            <div class="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">\${foyer.icon}</span>
                  <div>
                    <h5 class="text-xs font-black text-slate-900 leading-tight">\${foyer.name}</h5>
                    <span class="text-[10px] font-bold text-slate-500">Niveau \${foyer.level} • Régénération passive du moral</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800">
                  Cohésion
                </span>
              </div>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Espace détente (canapés, cuisine, café). Régénère passivement le moral des secouristes présents au local (+3 à +8 pts/cycle) et réduit l\\'attrition/départ des membres.
              </p>
              \${foyer.level < 3 ? \`
                <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <button onclick="window.ProtecLocaux.upgradeRoom(window.game, '\${station.id}', 'foyer_vie_associative', 'chantier_benevole')" class="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10.5px] font-black shadow-xs transition">
                    🔨 Chantier (\${foyer.volunteerMatCost} €)
                  </button>
                  <button onclick="window.ProtecLocaux.upgradeRoom(window.game, '\${station.id}', 'foyer_vie_associative', 'artisan')" class="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-extrabold transition">
                    👷 Artisans (\${foyer.craftsmanCost} €)
                  </button>
                </div>
              \` : '<div class=\"p-2 rounded-xl bg-emerald-50 text-emerald-800 font-black text-center text-xs\">Foyer Convivial Haut de Gamme ✓</div>'}
            </div>

            <!-- PIÈCE 5 : BUREAU PC RADIO & COMMANDEMENT -->
            <div class="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 md:col-span-2">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">\${pcRadio.icon}</span>
                  <div>
                    <h5 class="text-xs font-black text-slate-900 leading-tight">\${pcRadio.name}</h5>
                    <span class="text-[10px] font-bold text-slate-500">Niveau \${pcRadio.level} • Régulation & Coordination multi-DPS</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-800">
                  Commandement
                </span>
              </div>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Poste de commandement radio et régulation opérationnelle. Permet la coordination simultanée de plusieurs dispositifs de secours (\${pcRadio.level === 1 ? '1 DPS majeur' : (pcRadio.level === 2 ? '3 DPS simultanés sans pénalité' : 'Coordination illimitée / Salle de crise COD')}).
              </p>
              \${pcRadio.level < 3 ? \`
                <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 max-w-md">
                  <button onclick="window.ProtecLocaux.upgradeRoom(window.game, '\${station.id}', 'bureau_pc_radio', 'chantier_benevole')" class="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10.5px] font-black shadow-xs transition">
                    🔨 Chantier (\${pcRadio.volunteerMatCost} €)
                  </button>
                  <button onclick="window.ProtecLocaux.upgradeRoom(window.game, '\${station.id}', 'bureau_pc_radio', 'artisan')" class="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-extrabold transition">
                    👷 Artisans (\${pcRadio.craftsmanCost} €)
                  </button>
                </div>
              \` : '<div class=\"p-2 rounded-xl bg-emerald-50 text-emerald-800 font-black text-center text-xs\">Poste de Commandement de Crise (Niveau COD) ✓</div>'}
            </div>
          </div>
        </div>
      </div>
    \`;
  },
`;

// 2. Insérer modularMethods juste avant getStationPremises
const pGetStationPremises = code.indexOf('getStationPremises(game, stationId) {');
if (pGetStationPremises === -1) {
  throw new Error('Cannot find getStationPremises in locaux.js');
}

code = code.substring(0, pGetStationPremises) + modularMethods + '\n  ' + code.substring(pGetStationPremises);

// 3. Adapter getStationPremises pour utiliser ensureModularPremises
const pOldGetPremises = code.indexOf('getStationPremises(game, stationId) {');
const pEndOldGetPremises = code.indexOf('// Affecter un layout prédéfini à une antenne', pOldGetPremises);
if (pOldGetPremises !== -1 && pEndOldGetPremises !== -1) {
  const newGetPremisesLogic = `getStationPremises(game, stationId) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return null;
    return this.ensureModularPremises(station, game);
  },
`;
  code = code.substring(0, pOldGetPremises) + newGetPremisesLogic + code.substring(pEndOldGetPremises);
}

// 4. Mettre à jour renderModal pour afficher l'onglet modulaire par défaut et ajouter le bouton d'onglet
const pRenderModalStart = code.indexOf('renderModal(game) {');
if (pRenderModalStart !== -1) {
  const pTabContentCall = code.indexOf('${this.renderActiveTabContent(game, station, premises, stats)}', pRenderModalStart);
  const pTabBar = code.indexOf('<!-- Barre d\'onglets du module -->', pRenderModalStart);

  if (pTabBar !== -1 && pTabContentCall !== -1) {
    // Bouton de l'onglet modulaire
    const newTabBtn = `<button onclick="window.ProtecLocaux.setTab('modulaire', window.game)" class="px-3.5 py-1.5 rounded-xl transition flex-shrink-0 flex items-center gap-1.5 \${(this.activeTab === 'modulaire' || !this.activeTab) ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="layout-dashboard" class="w-3.5 h-3.5"></i>
            Tableau de Bord Modulaire
          </button>\n          `;

    code = code.substring(0, pTabBar + '<!-- Barre d\'onglets du module -->\n        <div class="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">\n          '.length) +
           newTabBtn +
           code.substring(pTabBar + '<!-- Barre d\'onglets du module -->\n        <div class="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">\n          '.length);
  }
}

// 5. Mettre à jour renderActiveTabContent pour rediriger vers renderModulaireTab si modulaire
const pActiveTabContent = code.indexOf('renderActiveTabContent(game, station, premises, stats) {');
if (pActiveTabContent !== -1) {
  const checkModulaire = `renderActiveTabContent(game, station, premises, stats) {
    if (this.activeTab === 'modulaire' || !this.activeTab) {
      return this.renderModulaireTab(game, station, premises, stats);
    }`;

  code = code.substring(0, pActiveTabContent) + checkModulaire + code.substring(pActiveTabContent + 'renderActiveTabContent(game, station, premises, stats) {'.length);
}

fs.writeFileSync('js/locaux.js', code, 'utf8');
console.log('Successfully updated js/locaux.js! New length:', code.length);
