/**
 * PROTEC LIVE - MODULE MULTIJOUEUR AVANCÉ & RÉSEAU FÉDÉRAL
 * 
 * 1. Renforts Zonaux Inter-Antennes :
 *    - Zone Départementale : accessible sans restriction de taille de mission, avec quota hebdomadaire (3 max/semaine).
 *    - Zone Régionale : verrouillée, réservée aux DPS de grande envergure (DPS-GE, 4000+ public, crises régionales).
 *    - Zone Nationale : verrouillée, réservée exclusivement aux événements majeurs et catastrophes IRL (JO, Coupe du Monde, Tempête Chido/Ciaran, Plan NOVI).
 * 
 * 2. Formations Spécifiques Inter-Antennes :
 *    - L'hôte configure la formation (catalogue officiel : PSE1, PSE2, CE, CD, SST, EPI Extincteur, PIC F, etc.).
 *    - Paramétrage du nombre de places ouvertes pour les autres antennes.
 *    - Paramétrage du tarif par candidat : Gratuit (0 € - solidarité) OU Payant (X € encaissés par l'hôte).
 * 
 * 3. Bourse Fédérale (Véhicules & Matériel) :
 *    - Vente (prix fixé par le vendeur).
 *    - Don solidaire (cession gratuite 0 € : boost de réputation et points d'alliance).
 *    - Échange (troc direct de véhicules ou matériel contre d'autres équipements).
 */

window.ProtecMultiplayer = {
  // Constantes de Quota
  MAX_WEEKLY_DEPT_RENFORTS: 3,

  // Initialisation de l'état multijoueur
  injectState(game) {
    if (!game.weeklyDeptRenforts) {
      game.weeklyDeptRenforts = {
        weekKey: this.getWeekKey(game.clock),
        count: 0
      };
    } else {
      const curKey = this.getWeekKey(game.clock);
      if (game.weeklyDeptRenforts.weekKey !== curKey) {
        game.weeklyDeptRenforts.weekKey = curKey;
        game.weeklyDeptRenforts.count = 0;
      }
    }

    if (!game.marketplace) {
      game.marketplace = this.getInitialMarketplaceOffers();
    }

    if (!game.badgesCollection) {
      game.badgesCollection = this.getInitialBadges();
    }

    if (!game.communityEvents) {
      game.communityEvents = this.getInitialCommunityEvents();
    }
  },

  // Calcul d'une clé de semaine unique
  getWeekKey(clock) {
    const y = clock?.year || 2026;
    const m = (clock?.month || 0) + 1;
    const d = clock?.day || 1;
    const dateObj = new Date(y, m - 1, d);
    const startYear = new Date(y, 0, 1);
    const weekNum = Math.ceil((((dateObj - startYear) / 86400000) + startYear.getDay() + 1) / 7);
    return `${y}-W${weekNum}`;
  },

  // Offres de démarrage réalistes pour animer la Bourse
  getInitialMarketplaceOffers() {
    return [
      {
        id: 'mkt-init-1',
        sellerPlayerId: 'system-ant-lyon',
        sellerPlayerName: 'Antenne Lyon Centre',
        stationName: 'Protection Civile du Rhône',
        category: 'vehicule',
        type: 'VPSP',
        title: 'VPSP Master Sanitaire 120 000 km',
        desc: 'Ambulance de secours révisée, cellule capitonnée, brancard 3 points et attelage homologué.',
        dealType: 'vente',
        price: 5200,
        tradeWanted: null,
        createdAt: '08/10/2026',
        vehicleData: {
          name: 'VPSP Réformé Lyon',
          type: 'VPSP',
          icon: 'ambulance',
          hasTowHitch: true,
          capacity: 3,
          fuel: 90,
          wear: 80
        }
      },
      {
        id: 'mkt-init-2',
        sellerPlayerId: 'system-ant-bordeaux',
        sellerPlayerName: 'Antenne Bordeaux Métropole',
        stationName: 'Protection Civile de Gironde',
        category: 'materiel',
        type: 'tente_pma',
        title: 'Lot Poste Médical Avancé (Tente PMA 30m²)',
        desc: 'Abri gonflable d’urgence complet avec gonfleur électrique et mât d’éclairage LED autonome.',
        dealType: 'don',
        price: 0,
        tradeWanted: null,
        createdAt: '08/10/2026',
        materialData: {
          itemKey: 'tente_pma',
          label: 'Tente PMA Gonflable 30m²',
          quantity: 1
        }
      },
      {
        id: 'mkt-init-3',
        sellerPlayerId: 'system-ant-marseille',
        sellerPlayerName: 'Antenne Marseille Littoral',
        stationName: 'Protection Civile des Bouches-du-Rhône',
        category: 'vehicule',
        type: 'QUAD',
        title: 'Quad Tout-Terrain d’Intervention avec Remorque',
        desc: 'Véhicule de reconnaissance pour zones accidentées ou plages. Remorque de route incluse.',
        dealType: 'echange',
        price: 0,
        tradeWanted: '1 VTU Logistique ou 2 DAE opérationnels',
        createdAt: '07/10/2026',
        vehicleData: {
          name: 'Quad Reconnaissance BRS',
          type: 'QUAD',
          icon: 'bike',
          hasTowHitch: false,
          hasTrailer: true,
          capacity: 2,
          fuel: 100,
          wear: 90
        }
      },
      {
        id: 'mkt-init-4',
        sellerPlayerId: 'system-ant-lille',
        sellerPlayerName: 'Antenne Lille Flandres',
        stationName: 'Protection Civile du Nord',
        category: 'materiel',
        type: 'dae',
        title: 'Lot de 2 Défibrillateurs DAE Zoll AED Plus',
        desc: 'Appareils contrôlés et révisés avec électrodes adultes et sacoche de transport d’intervention.',
        dealType: 'vente',
        price: 750,
        tradeWanted: null,
        createdAt: '08/10/2026',
        materialData: {
          itemKey: 'dae',
          label: 'Défibrillateur Automatisé Externe (DAE)',
          quantity: 2
        }
      }
    ];
  },

  // =========================================================================
  // 1. GESTION DES RENFORTS PAR ZONES (Départemental, Régional, National)
  // =========================================================================

  checkMissionZoneEligibility(game, mission) {
    this.injectState(game);
    const title = (mission?.title || '').toLowerCase();
    const desc = (mission?.desc || '').toLowerCase();
    const type = mission?.type || '';
    const scale = mission?.scale || '';
    const publicCount = mission?.publicCount || 0;
    const reqVol = mission?.requiredVolunteers || 0;

    // 1. Zone Départementale : Toujours éligible (sujet au quota hebdomadaire)
    const deptCount = game.weeklyDeptRenforts.count || 0;
    const deptAvailable = deptCount < this.MAX_WEEKLY_DEPT_RENFORTS;

    // 2. Zone Régionale : Réservée aux gros DPS / crises régionales
    const isRegionalEligible = 
      scale === 'DPS-GE' || 
      scale === 'DPS-ME' || 
      publicCount >= 4000 || 
      reqVol >= 6 || 
      ['crise', 'sinistre', 'pompiers', 'samu', 'meteo'].includes(type) ||
      /(festival|marathon|concert|carnaval|tournoi|région|salon|crise|inondation|tempête|sinistre|foule|triathlon)/i.test(title + ' ' + desc);

    // 3. Zone Nationale : Réservée exclusivement aux événements majeurs et catastrophes IRL
    const isNationalEligible = 
      /(jeux\s+olympiques|jo\b|coupe\s+du\s+monde|mondial|tempête\s+(chido|ciaran|xynthia|eleanor)|ouragan|chido|ciaran|plan\s+novi|novi\b|catastrophe|sommet|tour\s+de\s+france|attentat|centennale|séisme|fédéral)/i.test(title + ' ' + desc) ||
      publicCount >= 15000 ||
      (mission?.isCrisis && (mission?.severity === 'haute' || reqVol >= 12));

    return {
      departemental: {
        eligible: true,
        canRequest: deptAvailable,
        used: deptCount,
        max: this.MAX_WEEKLY_DEPT_RENFORTS,
        reason: deptAvailable ? `Quota : ${deptCount}/${this.MAX_WEEKLY_DEPT_RENFORTS} cette semaine` : `Quota hebdomadaire atteint (${deptCount}/${this.MAX_WEEKLY_DEPT_RENFORTS}). Réinitialisation lundi.`
      },
      regional: {
        eligible: isRegionalEligible,
        reason: isRegionalEligible 
          ? 'Autorisé : Dispositif de grande envergure ou crise régionale.' 
          : 'Verrouillé : Réservé aux DPS de grande envergure et crises régionales (Affluence ≥ 4 000 ou 6+ secouristes ou alerte météo).'
      },
      national: {
        eligible: isNationalEligible,
        reason: isNationalEligible 
          ? 'Autorisé : Événement majeur national ou catastrophe IRL.' 
          : 'Verrouillé : Réservé aux événements majeurs et catastrophes IRL (Jeux Olympiques, Coupe du Monde, Tempête Chido/Ciaran, Plan NOVI).'
      }
    };
  },

    getDynamicVehiclesCatalog() {
    const raw = window.ProtecAdvanced?.vehicleCatalog || window.ProtecSystems?.vehicleCatalog || [];
    let custom = [];
    try {
      const stored = localStorage.getItem('protec_custom_vehicle_catalog');
      if (stored) custom = JSON.parse(stored);
    } catch (e) {}
    const list = [...raw];
    if (Array.isArray(custom)) {
      custom.forEach(cv => {
        if (!list.find(v => v.type === cv.type)) list.push(cv);
      });
    }
    return list;
  },

  getDynamicLotsCatalog() {
    let lots = window.ProtecEquipements?.LOTS_CATALOG || [];
    try {
      const stored = localStorage.getItem('protec_custom_equipment_catalog');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) lots = parsed;
      }
    } catch (e) {}
    return lots;
  },

  updateCarriedLotsLogCalculation() {
    let totalLogNeeded = 0;
    const checked = document.querySelectorAll('input[name="renfort-carry-stock-lot"]:checked');
    checked.forEach(cb => {
      totalLogNeeded += parseInt(cb.dataset.size || 2);
    });
    const logInput = document.getElementById('renfort-log-slots-count');
    if (logInput) {
      logInput.value = totalLogNeeded;
    }
    const badge = document.getElementById('renfort-log-slots-summary-badge');
    if (badge) {
      badge.textContent = totalLogNeeded + ' place(s) LOG requise(s) pour charger votre stock';
    }
    if (totalLogNeeded > 0) {
      const radioBase = document.querySelector('input[name="renfort-consigne-route"][value="base"]');
      if (radioBase) {
        radioBase.checked = true;
        this.updateApcTariffSuggestion('base');
      }
      const notice = document.getElementById('renfort-consigne-auto-notice');
      if (notice) notice.classList.remove('hidden');
    }
  },

  setRequestedLogSlots(count) {
    const logInput = document.getElementById('renfort-log-slots-count');
    if (logInput) logInput.value = Math.max(0, count);
    if (count > 0) {
      const radioBase = document.querySelector('input[name="renfort-consigne-route"][value="base"]');
      if (radioBase) {
        radioBase.checked = true;
        this.updateApcTariffSuggestion('base');
      }
      const notice = document.getElementById('renfort-consigne-auto-notice');
      if (notice) notice.classList.remove('hidden');
    }
  },

  updateApcTariffSuggestion(route) {
    const game = window.game;
    if (!game) return;
    const dest = (route === 'base') ? 'base' : 'site';
    const mission = this._currentRenfortMission;
    const apcData = window.ProtecAPC ? window.ProtecAPC.getDeptRenfortIndemniteBase(game, {
      mission: mission,
      destination: dest
    }) : { baseDept: 150, travelAllowance: 20, distanceKm: 15, destination: dest, kmRate: 0.65, computed: 170 };

    const infoSpan = document.getElementById('renfort-apc-base-info');
    if (infoSpan) {
      infoSpan.innerHTML = `Barème APC : <strong>${apcData.baseDept} €</strong> forfait + trajet <strong>${apcData.travelAllowance} €</strong> (${apcData.distanceKm} km A/R à ${apcData.kmRate} €/km) = <strong>${apcData.computed} €</strong>`;
    }
    const btnReset = document.getElementById('renfort-reset-apc-btn');
    if (btnReset) {
      btnReset.onclick = () => {
        const inp = document.getElementById('renfort-custom-tariff');
        if (inp) inp.value = apcData.computed;
      };
      btnReset.textContent = `🏛️ Rétablir base APC (${apcData.computed} €)`;
    }
  },

  changeRenfortVehQty(vehType, delta) {
    const input = document.getElementById('renfort-veh-' + vehType + '-count');
    if (input) {
      const cur = parseInt(input.value || 0);
      input.value = Math.max(0, Math.min(20, cur + delta));
    }
  },

  changeRenfortLotQty(lotId, delta) {
    const input = document.getElementById('renfort-lot-' + lotId + '-count');
    if (input) {
      const cur = parseInt(input.value || 0);
      input.value = Math.max(0, Math.min(20, cur + delta));
    }
  },

  openRenfortZoneModal(game, missionId, preset = {}) {
    let mission = (game.missions || []).find(m => String(m.id) === String(missionId)) || (game.activeCrises || []).find(c => String(c.id) === String(missionId));
    if (!mission) {
      const devisPrevi = (game.devis || []).find(d => String(d.id) === String(missionId));
      if (devisPrevi) {
        const reqVols = devisPrevi.configuredVolunteers || devisPrevi.requiredVolunteers || 4;
        mission = {
          id: devisPrevi.id,
          title: devisPrevi.eventName || devisPrevi.title || 'Dispositif en Option',
          desc: devisPrevi.desc || `Dispositif prévisionnel pour ${devisPrevi.eventName || 'DPS'}.`,
          type: 'dps',
          scale: devisPrevi.configuredScale || devisPrevi.scale || 'DPS-PE',
          publicCount: devisPrevi.publicCount || 0,
          isPrevisionnel: true,
          eventDate: devisPrevi.eventDate,
          requiredVolunteers: reqVols,
          registeredVolunteers: devisPrevi.previsionnelVolunteers || [],
          requiredVehicles: devisPrevi.configuredVehicles || devisPrevi.requiredVehicles || ['VPSP'],
          configuredLots: devisPrevi.configuredLots || [],
          lat: devisPrevi.lat,
          lng: devisPrevi.lng,
          address: devisPrevi.address || devisPrevi.locationAddress || 'Secteur Opérationnel',
          departmentCode: String(devisPrevi.departmentCode || game.stations?.[0]?.departmentCode || '54')
        };
      }
    }
    if (!mission) return;

    this.injectState(game);
    const eligibility = this.checkMissionZoneEligibility(game, mission);
    const reqVols = mission.requiredVolunteers || 4;
    const regVols = mission.registeredVolunteers?.length || 0;
    const needed = (preset && typeof preset.volunteersCount === 'number')
      ? preset.volunteersCount
      : Math.max(1, reqVols - regVols);

    const myDept = game.player?.departmentCode || game.stations?.[0]?.departmentCode || '54';
    const zoneDef = window.ProtecDepartements?.getZoneDefense(myDept) || { name: 'Zone de Défense et de Sécurité', shortName: 'Zone Zonale' };
    const isAdmin = (game.player?.role === 'admin') || (localStorage.getItem('protec_admin_auth') === 'true');

    // Récupération dynamique des catalogues complets
    const vehiclesCatalog = this.getDynamicVehiclesCatalog();
    const lotsCatalog = this.getDynamicLotsCatalog();

    // Analyse du stock de lots possédé par l'antenne locale
    const stockLots = [];
    lotsCatalog.forEach(lot => {
      const ownedCount = game.workplaceEquipment?.[lot.id] || 0;
      if (ownedCount > 0) {
        stockLots.push({
          ...lot,
          ownedCount: ownedCount
        });
      }
    });

    // Analyse des besoins de la mission pour affichage visuel
    const reqVehicles = Array.isArray(mission.requiredVehicles) && mission.requiredVehicles.length > 0 
      ? mission.requiredVehicles 
      : (mission.isCrisis ? ['VTU', 'VPSP'] : ['VPSP']);

    // Déduction des lots recommandés selon le type d'intervention
    const expectedLotsList = [];
    const t = ((mission.title || '') + ' ' + (mission.type || '') + ' ' + (mission.crisisType || '')).toLowerCase();
    if (t.includes('inond') || t.includes('crue') || t.includes('eau')) {
      expectedLotsList.push({ id: 'lot_pompage', name: 'Lot Pompage', reason: 'Évacuation des eaux' });
      expectedLotsList.push({ id: 'remorque_motopompe', name: 'Remorque Motopompe', reason: 'Pompage gros débit' });
      expectedLotsList.push({ id: 'lot_bachage', name: 'Lot Bâchage', reason: 'Mise hors d’eau' });
    }
    if (t.includes('temp') || t.includes('vent') || t.includes('arbr') || t.includes('dégag')) {
      expectedLotsList.push({ id: 'lot_tronconnage', name: 'Lot Tronçonnage', reason: 'Dégagement d’arbres' });
      expectedLotsList.push({ id: 'lot_bachage', name: 'Lot Bâchage', reason: 'Protection toitures' });
      expectedLotsList.push({ id: 'lot_eclairage', name: 'Lot Éclairage', reason: 'Travail nocturne' });
    }
    if (t.includes('recherch') || t.includes('disparu') || t.includes('égaré')) {
      expectedLotsList.push({ id: 'lot_drone_thermique', name: 'Pack Drone Thermique', reason: 'Reconnaissance thermique' });
      expectedLotsList.push({ id: 'lot_drone_reco', name: 'Pack Drone 4K', reason: 'Cartographie aérienne' });
    }
    if (t.includes('accueil') || t.includes('sinistr') || t.includes('froid') || t.includes('héberg') || t.includes('cai') || t.includes('psy')) {
      expectedLotsList.push({ id: 'lot_hebergement', name: 'Kit CHU (Lits Picots)', reason: 'Hébergement d’urgence' });
      expectedLotsList.push({ id: 'lot_ravitaillement', name: 'Lot Ravitaillement', reason: 'Repas chauds' });
      expectedLotsList.push({ id: 'lot_soutien_psy', name: 'Lot CAI / Psy', reason: 'Accueil des sinistrés' });
    }
    if (t.includes('novi') || t.includes('pma') || t.includes('poste') || t.includes('dps')) {
      expectedLotsList.push({ id: 'lot_secours_a', name: 'Lot A (Poste / PMA)', reason: 'Tente NOVI & Triage' });
      expectedLotsList.push({ id: 'lot_secours_b', name: 'Lot B (Secours)', reason: 'Soin d’urgence' });
      expectedLotsList.push({ id: 'lot_secours_c', name: 'Lot C (Relevage)', reason: 'Brancardage' });
    }
    if (expectedLotsList.length === 0) {
      expectedLotsList.push({ id: 'lot_secours_b', name: 'Lot B (Secours d’Urgence)', reason: 'Dotation secourisme' });
    }

    this._currentRenfortMission = mission;
    const apcIndemniteData = window.ProtecAPC ? window.ProtecAPC.getDeptRenfortIndemniteBase(game, {
      mission,
      destination: 'site'
    }) : { baseDept: 150, travelAllowance: 32, distanceKm: 25, destination: 'site', kmRate: 0.65, computed: 182 };

    // Modal DOM
    let modal = document.getElementById('renfort-zone-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'renfort-zone-modal';
      modal.className = 'fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-4xl lg:max-w-5xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 bg-white border border-slate-200 text-slate-800 max-h-[94vh] overflow-y-auto">
        <!-- HEADER -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <i data-lucide="handshake" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-black text-slate-900 leading-tight">Demande de Renfort Opérationnel Personnalisée</h3>
              <p class="text-xs text-slate-500 font-semibold leading-relaxed flex items-center gap-1.5 flex-wrap">
                ${mission.isPrevisionnel ? '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 uppercase">⏳ Option Prévisionnelle</span>' : ''}
                <span class="font-extrabold text-slate-800">${mission.title}</span> • Date : ${game.formatShortDate(mission.eventDate)} • ${mission.address || mission.city || 'Secteur'}
              </p>
            </div>
          </div>
          <button onclick="document.getElementById('renfort-zone-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer">✕</button>
        </div>

        <!-- 0. VISUEL COMPLET SUR LES BESOINS DE LA MISSION -->
        <div class="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-sky-50/60 to-white border border-indigo-200 shadow-xs space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                <i data-lucide="clipboard-list" class="w-4 h-4"></i>
              </span>
              <h4 class="text-xs font-black text-indigo-950 uppercase tracking-wider">Tableau de Bord des Besoins de la Mission</h4>
            </div>
            <span class="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Antenne d'attache : ${game.stations?.[0]?.name || 'Nancy'} (Dpt ${myDept})
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <!-- Besoins Humains -->
            <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 block">👥 Effectifs Secouristes</span>
              <div class="flex items-baseline justify-between">
                <span class="text-lg font-black text-slate-900">${reqVols} <span class="text-xs font-normal text-slate-500">requis</span></span>
                <span class="text-xs font-black ${needed > 0 ? 'text-amber-600' : 'text-emerald-600'}">
                  ${needed > 0 ? 'Déficit : ' + needed : 'Complet'}
                </span>
              </div>
              <p class="text-[10px] text-slate-500">${regVols} secouriste(s) déjà inscrit(s) ou engagé(s).</p>
            </div>

            <!-- Besoins Véhicules -->
            <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 block">🚑 Véhicules Opérationnels</span>
              <div class="font-black text-slate-900 text-xs truncate">
                ${(window.game && typeof window.game.formatVehicleSummary === 'function' ? window.game.formatVehicleSummary(reqVehicles) : (reqVehicles).join(', '))}
              </div>
              <p class="text-[10px] text-slate-500">VPSP pour transport sanitaire, VTU/VLHR pour soutien logistique.</p>
            </div>

            <!-- Besoins Spéciaux / Lots -->
            <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 block">📦 Spécialités & Lots Recommandés</span>
              <div class="flex flex-wrap gap-1">
                ${expectedLotsList.slice(0, 3).map(el => {
                  const hasStock = (game.workplaceEquipment?.[el.id] || 0) > 0;
                  return `
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold ${hasStock ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-amber-50 text-amber-900 border border-amber-300'}" title="${el.reason}">
                      ${hasStock ? '✓' : '⚠️'} ${el.name}
                    </span>
                  `;
                }).join('')}
              </div>
              <p class="text-[10px] text-slate-500">✓ = Possédé en stock • ⚠️ = À demander en renfort.</p>
            </div>
          </div>
        </div>

        <div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-300 text-xs text-amber-950 font-bold flex items-center gap-2.5">
          <span class="text-lg">🤝</span>
          <div>
            <span class="font-black text-amber-900 block">Doctrine Opérationnelle de Renfort</span>
            <span class="text-[11px] text-amber-800 font-medium">Vous pouvez demander un véhicule avec places LOG pour transporter vos lots en stock, demander directement des lots non possédés, ou solliciter des types de véhicules spécialisés.</span>
          </div>
        </div>

        <!-- 1. EFFECTIF SECOURISTE DEMANDÉ -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <label class="block text-xs font-black text-slate-800 uppercase tracking-wider">1. Effectif Secouriste Demandé :</label>
          <div class="flex items-center gap-3">
            <button onclick="const el=document.getElementById('renfort-vols-count'); el.value=Math.max(1, parseInt(el.value||1)-1);" class="w-9 h-9 rounded-xl bg-white border border-slate-300 text-slate-800 font-black text-base hover:bg-slate-100 transition shadow-xs cursor-pointer">-</button>
            <div class="flex-1 max-w-[120px]">
              <input type="number" id="renfort-vols-count" value="${needed}" min="1" max="50" class="w-full py-2 px-3 text-center text-sm font-black font-mono rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500">
            </div>
            <button onclick="const el=document.getElementById('renfort-vols-count'); el.value=Math.min(50, parseInt(el.value||1)+1);" class="w-9 h-9 rounded-xl bg-white border border-slate-300 text-slate-800 font-black text-base hover:bg-slate-100 transition shadow-xs cursor-pointer">+</button>
            <span class="text-xs font-bold text-slate-600">secouriste(s)</span>
          </div>
          <p class="text-[11px] text-slate-500">Déficit calculé pour cet événement : <strong>${needed}</strong> personne(s).</p>
        </div>

        <!-- 2. DEMANDE DE VÉHICULES PAR TYPE (CATALOGUE DYNAMIQUE) -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <label class="block text-xs font-black text-slate-800 uppercase tracking-wider">2. Types de Véhicules Spécialisés Demandés :</label>
              <p class="text-[11px] text-slate-500">Issus du catalogue officiel dynamique (PS, VL, VTP, VTU, Cyno, Drone, PCM...).</p>
            </div>
            <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Catalogue Dynamique</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs max-h-60 overflow-y-auto pr-1">
            ${vehiclesCatalog.map(veh => {
              const initQty = (veh.type === 'VPSP' && mission.requiredVehicles?.includes('VPSP')) ? 1 : 0;
              return `
                <div class="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2">
                  <div class="flex items-start gap-2">
                    <div class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden text-base">
                      ${veh.icon ? veh.icon : '🚒'}
                    </div>
                    <div class="min-w-0 flex-1">
                      <span class="font-black text-slate-900 block text-xs truncate" title="${veh.name}">${veh.name}</span>
                      <div class="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">${veh.type}</span>
                        <span class="text-[10px] text-slate-500 font-semibold">${veh.capacity || 2} pers. • ${veh.capacity_log || 0} LOG</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span class="text-[10px] font-bold text-slate-500">Quantité :</span>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <button type="button" onclick="window.ProtecMultiplayer.changeRenfortVehQty('${veh.type}', -1)" class="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center cursor-pointer transition">-</button>
                      <input type="number" id="renfort-veh-${veh.type}-count" data-renfort-veh-type="${veh.type}" data-renfort-veh-name="${veh.name}" value="${initQty}" min="0" max="20" class="w-9 py-0.5 text-center font-mono font-black text-xs rounded border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500">
                      <button type="button" onclick="window.ProtecMultiplayer.changeRenfortVehQty('${veh.type}', 1)" class="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center cursor-pointer transition">+</button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 3. TRANSPORT DES LOTS EN STOCK DANS MON ANTENNE (DEMANDER VÉHICULE AVEC PLACES LOG) -->
        <div class="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <label class="block text-xs font-black text-indigo-950 uppercase tracking-wider">
                3. Transport de Mes Lots en Stock (Demander un véhicule avec X places LOG) :
              </label>
              <p class="text-[11px] text-indigo-900/80">
                Vous possédez du matériel à l'antenne mais pas de fourgon disponible ? Demandez un véhicule allié pour venir charger vos lots.
              </p>
            </div>
            <span id="renfort-log-slots-summary-badge" class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-200 text-indigo-900">
              0 place(s) LOG requise(s)
            </span>
          </div>

          <!-- Lots en Stock à l'Antenne -->
          ${stockLots.length === 0 ? `
            <div class="p-3 rounded-xl bg-white/80 border border-indigo-200/60 text-slate-600 text-xs font-semibold">
              ℹ️ Aucun lot logistique stocké dans votre antenne actuellement. Vous pouvez demander directement des lots non possédés à la section 4.
            </div>
          ` : `
            <div class="space-y-1.5">
              <span class="text-[11px] font-bold text-slate-700 block">Cochez les lots en stock à faire emporter :</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                ${stockLots.map(sl => {
                  const size = sl.storageSize || 2;
                  return `
                    <label class="p-2.5 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 flex items-center justify-between gap-2 cursor-pointer shadow-2xs transition">
                      <div class="flex items-center gap-2 min-w-0">
                        <input type="checkbox" name="renfort-carry-stock-lot" value="${sl.id}" data-name="${sl.name}" data-size="${size}" onchange="window.ProtecMultiplayer.updateCarriedLotsLogCalculation()" class="rounded text-indigo-600 focus:ring-0 cursor-pointer">
                        <div class="min-w-0">
                          <span class="font-black text-slate-900 block truncate">${sl.name}</span>
                          <span class="text-[10px] text-slate-500">${sl.ownedCount} en stock à votre antenne</span>
                        </div>
                      </div>
                      <span class="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black shrink-0 border border-indigo-200">
                        ${size} places LOG
                      </span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          `}

          <!-- Sélecteur de places LOG demandées -->
          <div class="pt-2 border-t border-indigo-200/60 flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-black text-slate-800">Places LOG demandées :</span>
              <div class="flex items-center gap-1.5">
                <button type="button" onclick="const el=document.getElementById('renfort-log-slots-count'); el.value=Math.max(0, parseInt(el.value||0)-1); window.ProtecMultiplayer.setRequestedLogSlots(parseInt(el.value));" class="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 font-black text-xs flex items-center justify-center cursor-pointer transition">-</button>
                <input type="number" id="renfort-log-slots-count" value="0" min="0" max="30" onchange="window.ProtecMultiplayer.setRequestedLogSlots(parseInt(this.value||0))" class="w-12 py-1 text-center font-mono font-black text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500">
                <button type="button" onclick="const el=document.getElementById('renfort-log-slots-count'); el.value=Math.min(30, parseInt(el.value||0)+1); window.ProtecMultiplayer.setRequestedLogSlots(parseInt(el.value));" class="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 font-black text-xs flex items-center justify-center cursor-pointer transition">+</button>
              </div>
            </div>

            <!-- Boutons de présélection de véhicules porteurs -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] font-bold text-slate-500">Gabarits rapides :</span>
              <button type="button" onclick="window.ProtecMultiplayer.setRequestedLogSlots(2)" class="px-2 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-300 text-[10px] font-black text-slate-700 cursor-pointer">2 LOG (VLHR)</button>
              <button type="button" onclick="window.ProtecMultiplayer.setRequestedLogSlots(4)" class="px-2 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-300 text-[10px] font-black text-slate-700 cursor-pointer">4 LOG (Fourgon)</button>
              <button type="button" onclick="window.ProtecMultiplayer.setRequestedLogSlots(6)" class="px-2 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-300 text-[10px] font-black text-slate-700 cursor-pointer">6 LOG (VTU)</button>
              <button type="button" onclick="window.ProtecMultiplayer.setRequestedLogSlots(12)" class="px-2 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-300 text-[10px] font-black text-slate-700 cursor-pointer">12 LOG (FLIT)</button>
            </div>
          </div>
        </div>

        <!-- 4. DEMANDE DIRECTE DE LOTS MATÉRIELS (NON POSSÉDÉS EN STOCK OU COMPLÉMENTAIRES) -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <label class="block text-xs font-black text-slate-800 uppercase tracking-wider">4. Demande Directe de Lots Matériels (Non Possédés ou Complémentaires) :</label>
              <p class="text-[11px] text-slate-500">Demandez directement ces lots aux antennes alliées si vous ne les possédez pas dans votre stock.</p>
            </div>
            <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Catalogue Matériel</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs max-h-64 overflow-y-auto pr-1">
            ${lotsCatalog.map(lot => {
              const owned = (game.workplaceEquipment?.[lot.id] || 0);
              const isRecommended = expectedLotsList.some(el => el.id === lot.id);
              const initCount = (isRecommended && owned === 0) ? 1 : 0;

              return `
                <div class="p-2.5 rounded-xl bg-white border ${isRecommended ? 'border-amber-300 ring-1 ring-amber-300/40' : 'border-slate-200'} shadow-2xs flex flex-col justify-between space-y-2">
                  <div class="space-y-1">
                    <div class="flex items-start justify-between gap-1.5">
                      <span class="font-black text-slate-900 block text-xs leading-tight">${lot.name}</span>
                      <span class="px-1.5 py-0.2 rounded text-[9px] font-black shrink-0 ${owned > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'}">
                        ${owned > 0 ? 'En stock (x' + owned + ')' : 'Non possédé'}
                      </span>
                    </div>
                    <p class="text-[10.5px] text-slate-500 leading-snug line-clamp-2">${lot.desc || ''}</p>
                  </div>

                  <div class="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span class="text-[10px] font-bold text-slate-500">Demander :</span>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <button type="button" onclick="window.ProtecMultiplayer.changeRenfortLotQty('${lot.id}', -1)" class="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center cursor-pointer transition">-</button>
                      <input type="number" id="renfort-lot-${lot.id}-count" data-renfort-lot-id="${lot.id}" data-renfort-lot-name="${lot.name}" value="${initCount}" min="0" max="20" class="w-9 py-0.5 text-center font-mono font-black text-xs rounded border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500">
                      <button type="button" onclick="window.ProtecMultiplayer.changeRenfortLotQty('${lot.id}', 1)" class="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center cursor-pointer transition">+</button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 5. CONSIGNE D'ACHEMINEMENT (SUR PLACE OU PASSER PAR LA BASE) -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-black text-slate-800 uppercase tracking-wider">5. Consigne d'Acheminement des Renforts :</label>
            <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">Ralliement</span>
          </div>

          <div id="renfort-consigne-auto-notice" class="hidden p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-bold">
            ℹ️ Consigne « Passer par la base » automatiquement recommandée car vous demandez le transport de matériel en stock à votre antenne.
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label class="flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer bg-white border-slate-200 hover:border-indigo-400 shadow-xs transition">
              <input type="radio" name="renfort-consigne-route" value="sur_place" checked onchange="window.ProtecMultiplayer.updateApcTariffSuggestion(this.value)" class="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
              <div>
                <span class="font-black text-slate-900 block">📍 Directement sur place</span>
                <p class="text-[11px] text-slate-500 leading-tight mt-0.5">Les renforts convergent directement sur le lieu d'intervention sans détour.</p>
              </div>
            </label>
            <label class="flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer bg-white border-slate-200 hover:border-indigo-400 shadow-xs transition">
              <input type="radio" name="renfort-consigne-route" value="base" onchange="window.ProtecMultiplayer.updateApcTariffSuggestion(this.value)" class="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
              <div>
                <span class="font-black text-slate-900 block">🏢 Passer par la base</span>
                <p class="text-[11px] text-slate-500 leading-tight mt-0.5">Les renforts font halte à notre antenne locale (charger matériel en stock / départ groupé).</p>
              </div>
            </label>
          </div>
        </div>

        <!-- 6. TARIF D'INDEMNISATION DE DÉPLACEMENT (€) -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div class="flex items-center justify-between flex-wrap gap-1">
            <label class="block text-xs font-black text-slate-800 uppercase tracking-wider">6. Indemnité de Déplacement Proposée (€) :</label>
            <span class="text-[10px] text-slate-500 font-semibold">Fixé par l'APC ou personnalisé</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative rounded-xl shadow-xs flex-1">
              <input type="number" id="renfort-custom-tariff" value="${apcIndemniteData.computed}" min="20" max="10000" step="5" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-mono font-black text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500">
              <span class="absolute right-3.5 top-2.5 text-slate-400 font-bold">€</span>
            </div>
            <button type="button" id="renfort-reset-apc-btn" onclick="const inp=document.getElementById('renfort-custom-tariff'); if(inp) inp.value=${apcIndemniteData.computed};" class="px-3 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-black transition cursor-pointer flex items-center gap-1 shrink-0" title="Rétablir le barème officiel calculé par l'APC départementale">
              🏛️ Rétablir base APC (${apcIndemniteData.computed} €)
            </button>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2 pt-0.5">
            <span id="renfort-apc-base-info">
              Barème APC : <strong>${apcIndemniteData.baseDept} €</strong> forfait + trajet <strong>${apcIndemniteData.travelAllowance} €</strong> (${apcIndemniteData.distanceKm} km A/R à ${apcIndemniteData.kmRate} €/km) = <strong>${apcIndemniteData.computed} €</strong>
            </span>
            <span class="text-[10px] font-bold text-slate-400">Modifiable librement</span>
          </div>
        </div>

        <!-- 7. SÉLECTION DE L'ÉCHELON DE MOBILISATION -->
        <div class="space-y-3 pt-1">
          <label class="block text-xs font-black text-slate-800 uppercase tracking-wider">7. Échelon de Mobilisation & Envoi :</label>

          <!-- ÉCHELON DÉPARTEMENTAL -->
          <div class="p-3.5 rounded-2xl border ${eligibility.departemental.canRequest ? 'border-sky-300 bg-sky-50/60' : 'border-slate-200 bg-slate-50 opacity-70'} flex flex-col justify-between gap-2 transition">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-600 text-white uppercase tracking-wider">Échelon Départemental</span>
                <span class="text-xs font-bold text-slate-700">Antennes du département (${myDept})</span>
              </div>
              <span class="text-[11px] font-extrabold ${eligibility.departemental.canRequest ? 'text-sky-800' : 'text-rose-600'}">
                ${eligibility.departemental.used} / ${eligibility.departemental.max} utilisés cette semaine
              </span>
            </div>
            <div class="flex items-center justify-between pt-1">
              <span class="text-[10px] text-slate-500 font-semibold">${eligibility.departemental.reason}</span>
              ${eligibility.departemental.canRequest ? `
                <button onclick="window.ProtecMultiplayer.submitRenfortRequest(window.game, '${mission.id}', 'departemental')" class="px-4 py-2 rounded-xl text-xs font-black bg-sky-600 hover:bg-sky-700 text-white transition shadow-sm flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="send" class="w-3.5 h-3.5"></i>
                  Mobiliser le Département
                </button>
              ` : `
                <button disabled class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-400 cursor-not-allowed">
                  Quota épuisé
                </button>
              `}
            </div>
          </div>

          <!-- ZONE DE DÉFENSE ET DE SÉCURITÉ -->
          <div class="p-3.5 rounded-2xl border ${eligibility.regional.eligible ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-200 bg-slate-100 opacity-60'} flex flex-col justify-between gap-2 transition">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white uppercase tracking-wider">Zone de Défense & Sécurité</span>
                <span class="text-xs font-bold text-slate-700">${zoneDef.name}</span>
              </div>
              <span class="text-[11px] font-bold ${eligibility.regional.eligible ? 'text-emerald-700' : 'text-slate-400'}">
                ${eligibility.regional.eligible ? '✓ Éligible' : '🔒 Requiert DPS-ME / DPS-GE'}
              </span>
            </div>
            <div class="flex items-center justify-between pt-1">
              <span class="text-[10px] text-slate-500 font-semibold max-w-xs">${eligibility.regional.reason}</span>
              ${eligibility.regional.eligible ? `
                <button onclick="window.ProtecMultiplayer.submitRenfortRequest(window.game, '${mission.id}', 'regional')" class="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="send" class="w-3.5 h-3.5"></i>
                  Mobiliser la Zone de Défense
                </button>
              ` : `
                <button disabled class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-400 cursor-not-allowed">
                  Non Éligible (Besoin ≥ 6 secouristes)
                </button>
              `}
            </div>
          </div>

          <!-- ZONE NATIONALE (FNPC) -->
          <div class="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/40 flex flex-col justify-between gap-2 transition">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-700 text-white uppercase tracking-wider">Zone Nationale FNPC</span>
                <span class="text-xs font-bold text-purple-900">Ordre Fédéral ORSEC</span>
              </div>
              <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}">
                ${isAdmin ? '👑 Mode Admin Actif' : '🔒 Réservé Admin / FNPC'}
              </span>
            </div>
            <div class="flex items-center justify-between pt-1">
              <span class="text-[10px] text-slate-500 font-semibold max-w-xs">Crises majeures nationales ou NOVI</span>
              ${isAdmin ? `
                <button onclick="window.ProtecMultiplayer.submitRenfortRequest(window.game, '${mission.id}', 'national')" class="px-4 py-2 rounded-xl text-xs font-black bg-purple-700 hover:bg-purple-800 text-white transition shadow-md flex items-center gap-1.5 cursor-pointer animate-pulse">
                  <i data-lucide="siren" class="w-3.5 h-3.5"></i>
                  Déclencher (Admin)
                </button>
              ` : `
                <span class="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                  <span>🔒</span> Réservé Direction Nationale
                </span>
              `}
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2 border-t border-slate-100">
          <button onclick="document.getElementById('renfort-zone-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer">
            Fermer
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  submitRenfortRequest(game, missionId, zone) {
    let mission = (game.missions || []).find(m => String(m.id) === String(missionId)) || (game.activeCrises || []).find(c => String(c.id) === String(missionId));
    if (!mission) {
      const devisPrevi = (game.devis || []).find(d => String(d.id) === String(missionId));
      if (devisPrevi) {
        const reqVols = devisPrevi.configuredVolunteers || devisPrevi.requiredVolunteers || 4;
        mission = {
          id: devisPrevi.id,
          title: devisPrevi.eventName || devisPrevi.title || 'Dispositif en Option',
          desc: devisPrevi.desc || `Dispositif prévisionnel pour ${devisPrevi.eventName || 'DPS'}.`,
          type: 'dps',
          scale: devisPrevi.configuredScale || devisPrevi.scale || 'DPS-PE',
          publicCount: devisPrevi.publicCount || 0,
          isPrevisionnel: true,
          eventDate: devisPrevi.eventDate,
          requiredVolunteers: reqVols,
          registeredVolunteers: devisPrevi.previsionnelVolunteers || [],
          requiredVehicles: devisPrevi.configuredVehicles || devisPrevi.requiredVehicles || ['VPSP'],
          configuredLots: devisPrevi.configuredLots || [],
          lat: devisPrevi.lat,
          lng: devisPrevi.lng,
          address: devisPrevi.address || devisPrevi.locationAddress || 'Secteur Opérationnel',
          departmentCode: String(devisPrevi.departmentCode || game.stations?.[0]?.departmentCode || '54')
        };
      }
    }
    if (!mission) return;

    this.injectState(game);
    const defaultNeeded = Math.max(1, (mission.requiredVolunteers || 4) - (mission.registeredVolunteers?.length || 0));
    const isAdmin = (game.player?.role === 'admin') || (localStorage.getItem('protec_admin_auth') === 'true');

    if (zone === 'national' && !isAdmin) {
      game.showToast('Accès Restreint', 'Les renforts nationaux sont exclusivement déclenchés par les administrateurs FNPC.', 'orange');
      return;
    }

    // Récupération des paramètres saisis par le joueur
    const customVolsInput = document.getElementById('renfort-vols-count');
    const customTariffInput = document.getElementById('renfort-custom-tariff');

    const requestedVols = customVolsInput ? (parseInt(customVolsInput.value) || defaultNeeded) : defaultNeeded;
    const requestedTariff = customTariffInput ? (parseFloat(customTariffInput.value) || (zone === 'national' ? 450 : zone === 'regional' ? 300 : 200)) : (zone === 'national' ? 450 : zone === 'regional' ? 300 : 200);

    // 1. Récupération des véhicules demandés par type dynamique
    const requestedVehicles = [];
    const requestedVehicleSummary = [];
    document.querySelectorAll('input[data-renfort-veh-type]').forEach(input => {
      const qty = parseInt(input.value || 0);
      if (qty > 0) {
        const vType = input.dataset.renfortVehType;
        const vName = input.dataset.renfortVehName || vType;
        requestedVehicles.push({ type: vType, name: vName, qty: qty });
        requestedVehicleSummary.push(qty > 1 ? qty + ' ' + vType : '1 ' + vType);
      }
    });

    // 2. Récupération des places LOG demandées (pour transporter stock local)
    const logSlotsInput = document.getElementById('renfort-log-slots-count');
    const requestedLogSlots = logSlotsInput ? (parseInt(logSlotsInput.value) || 0) : 0;

    const carriedStockLots = [];
    document.querySelectorAll('input[name="renfort-carry-stock-lot"]:checked').forEach(cb => {
      carriedStockLots.push({
        id: cb.value,
        name: cb.dataset.name,
        storageSize: parseInt(cb.dataset.size || 2)
      });
    });

    // 3. Récupération des lots demandés directement
    const requestedLots = [];
    const requestedLotsSummary = [];
    document.querySelectorAll('input[data-renfort-lot-id]').forEach(input => {
      const qty = parseInt(input.value || 0);
      if (qty > 0) {
        const lId = input.dataset.renfortLotId;
        const lName = input.dataset.renfortLotName || lId;
        requestedLots.push({ id: lId, name: lName, qty: qty });
        requestedLotsSummary.push(qty > 1 ? qty + ' Lots ' + lName : '1 Lot ' + lName);
      }
    });

    // 4. Consigne d'acheminement choisie
    const consigneRadios = document.getElementsByName('renfort-consigne-route');
    let routeConsigne = 'sur_place';
    for (const r of consigneRadios) { if (r.checked) { routeConsigne = r.value; break; } }
    if (requestedLogSlots > 0 && carriedStockLots.length > 0) {
      routeConsigne = 'base'; // Requis si chargement de lots à la base
    }

    // Gestion du quota départemental
    if (zone === 'departemental') {
      if (game.weeklyDeptRenforts.count >= this.MAX_WEEKLY_DEPT_RENFORTS) {
        game.showToast('Quota Atteint', 'Vous avez atteint la limite de ' + this.MAX_WEEKLY_DEPT_RENFORTS + ' renforts départementaux par semaine.', 'orange');
        return;
      }
      game.weeklyDeptRenforts.count += 1;
    }

    const myDept = game.player?.departmentCode || game.stations?.[0]?.departmentCode || '54';
    const zoneDef = window.ProtecDepartements?.getZoneDefense(myDept) || { name: 'Zone de Défense', shortName: 'Zonale' };

    const zoneLabels = {
      departemental: 'Départementale',
      regional: 'Zone de Défense (' + zoneDef.shortName + ')',
      national: 'Nationale FNPC'
    };

    // Construction propre du résumé textuel
    const parts = [requestedVols + ' secouriste(s)'];
    if (requestedVehicleSummary.length > 0) parts.push(requestedVehicleSummary.join(', '));
    if (requestedLogSlots > 0) {
      const carriedNames = carriedStockLots.map(l => l.name).join(', ');
      parts.push('Véhicule avec ' + requestedLogSlots + ' place(s) LOG' + (carriedNames ? ' (transport stock : ' + carriedNames + ')' : ''));
    }
    if (requestedLotsSummary.length > 0) parts.push(requestedLotsSummary.join(', '));

    const unitRequestedStr = parts.join(' + ');

    const myPlayerId = game.player?.id || window.ProtecAuth?.currentUser?.id || localStorage.getItem('protec_player_id') || 'directeur-local';
    const myPlayerName = game.player?.name || window.ProtecAuth?.currentUser?.username || localStorage.getItem('protec_player_name') || 'Responsable d’antenne';

    const renfortData = {
      id: 'renf-' + Date.now(),
      isMine: true,
      requesterPlayerId: myPlayerId,
      requesterName: myPlayerName,
      stationName: game.stations?.[0]?.name || 'Antenne Locale',
      departmentCode: String(myDept || '54'),
      missionId: mission.id,
      missionTitle: mission.title,
      missionLat: mission.lat || null,
      missionLng: mission.lng || null,
      missionAddress: mission.address || mission.city || 'Secteur Opérationnel',
      lat: mission.lat || null,
      lng: mission.lng || null,
      address: mission.address || mission.city || 'Secteur Opérationnel',
      addressDisplay: mission.address || mission.city || 'Secteur Opérationnel',
      allianceId: game.player?.allianceId || 'alliance-fnpc',
      allianceTag: 'UFSC',
      zone: zone,
      zoneLabel: zoneLabels[zone],
      title: '[' + zoneLabels[zone].toUpperCase() + '] Renfort pour ' + mission.title,
      desc: 'Dispositif prévu le ' + game.formatShortDate(mission.eventDate) + '. Besoin de ' + unitRequestedStr + '.',
      unitRequested: unitRequestedStr,
      requestedVolunteersCount: requestedVols,
      requiredVolsCount: requestedVols,
      requestedVehicles: requestedVehicles,
      requestedLogSlots: requestedLogSlots,
      carriedStockLots: carriedStockLots,
      requestedLots: requestedLots,
      consigne: routeConsigne,
      consigneLabel: routeConsigne === 'base' ? 'Passer d\'abord par la base' : 'Ralliement direct sur place',
      needLabel: requestedVehicleSummary.length > 0 ? requestedVehicleSummary.join(', ') : (requestedVols + ' secouristes'),
      slotsCommitted: 0,
      indemnite: requestedTariff,
      createdAt: new Date().toISOString(),
      status: 'open'
    };

    if (!game.mySentRenfortIds) game.mySentRenfortIds = new Set();
    game.mySentRenfortIds.add(renfortData.id);

    // Diffusion dans le bon canal de messagerie si le système est actif
    if (window.ProtecMessaging) {
      window.ProtecMessaging.injectState(game);
      const msgText = '📢 [DEMANDE DE RENFORT ' + zoneLabels[zone].toUpperCase() + '] Besoin urgent : ' + renfortData.unitRequested + ' pour « ' + mission.title + ' ». Consigne : ' + renfortData.consigneLabel + '. Indemnité proposée : +' + renfortData.indemnite + ' €.';
      const timeStr = String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0');
      
      const newMsg = {
        id: 'renf-msg-' + Date.now(),
        type: 'renfort_request',
        senderId: myPlayerId,
        senderName: game.stations?.[0]?.name || 'Antenne Locale',
        deptCode: game.stations?.[0]?.departmentCode || '75',
        channel: zone === 'national' ? 'national' : zone === 'regional' ? 'regional' : 'departemental',
        zone: zone,
        zoneLabel: zoneLabels[zone].toUpperCase(),
        missionId: mission.id,
        missionTitle: mission.title,
        unitRequested: renfortData.unitRequested,
        requestedVolunteersCount: renfortData.requestedVolunteersCount,
        requestedVehicles: renfortData.requestedVehicles,
        requestedLogSlots: renfortData.requestedLogSlots,
        requestedLots: renfortData.requestedLots,
        consigneLabel: renfortData.consigneLabel,
        indemnite: renfortData.indemnite,
        text: msgText,
        time: timeStr
      };

      if (zone === 'national') {
        game.messagesHistory.national.push(newMsg);
      } else if (zone === 'regional') {
        const myDept = game.stations?.[0]?.departmentCode || '75';
        const myReg = window.ProtecDepartements?.getRegion(myDept) || 'Île-de-France';
        if (!game.messagesHistory.regional[myReg]) game.messagesHistory.regional[myReg] = [];
        game.messagesHistory.regional[myReg].push(newMsg);
      } else {
        game.messagesHistory.departemental.push(newMsg);
      }
    }

    // Envoi au serveur ou stockage local
    fetch('/api/alliances/renfort/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(renfortData)
    }).then(res => res.json()).then(data => {
      const saved = data.renfort || renfortData;
      saved.isMine = true;
      game.mySentRenfortIds.add(saved.id);
      game.renforts.unshift(saved);
    }).catch(() => {
      game.renforts.unshift(renfortData);
    });

    // Diffusion en temps réel à toutes les antennes connectées
    if (window.ProtecSupabase && window.ProtecSupabase.broadcastRenfortCreated) {
      window.ProtecSupabase.broadcastRenfortCreated(renfortData);
    }

    const modal = document.getElementById('renfort-zone-modal');
    if (modal) modal.classList.add('hidden');

    game.showToast('Appel à Renfort Diffusé', 'Mobilisation ' + zoneLabels[zone] + ' transmise sur le réseau avec succès !', 'green');
    game.save();
    game.updateStatsUI();
    if (typeof game.renderMissions === 'function') game.renderMissions();
  },

  // =========================================================================
  // 2. GESTION DES FORMATIONS SPÉCIFIQUES OUVERTES AUX AUTRES ANTENNES
  // =========================================================================

  openCreateSpecialFormationModal(game) {
    let modal = document.getElementById('create-special-formation-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'create-special-formation-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in';
      document.body.appendChild(modal);
    }

    const catalogOptions = [
      { id: 'PSE1', label: 'PSE1 - Premiers Secours en Équipe 1 (Secouriste)', baseCost: 180 },
      { id: 'PSE2', label: 'PSE2 - Premiers Secours en Équipe 2 (Équipier Secouriste)', baseCost: 220 },
      { id: 'CE', label: 'CE - Formation Chef d’Équipe Opérationnel', baseCost: 250 },
      { id: 'CD', label: 'CD - Chef de Dispositif & Commandement', baseCost: 350 },
      { id: 'SST', label: 'SST - Sauveteur Secouriste du Travail', baseCost: 150 },
      { id: 'EXTINCTEUR', label: 'Manipulation Extincteurs (EPI Incendie)', baseCost: 80 },
      { id: 'PIC_F', label: 'PIC F - Pédagogie Initiale Commune de Formateur', baseCost: 280 },
      { id: 'FORMATEUR_PSC', label: 'Formateur PSC (Pédagogie)', baseCost: 200 },
      { id: 'P_VPSP', label: 'P. VPSP - Conduite d’Urgence & Gyrophare', baseCost: 140 },
      { id: 'SSA', label: 'SSA - Sauvetage et Sécurité Aquatique', baseCost: 260 }
    ];

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <i data-lucide="graduation-cap" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 leading-tight">Ouvrir un Stage Spécifique aux Alliés</h3>
              <p class="text-xs text-slate-500 font-semibold">Accueil de candidats extérieurs d'autres antennes</p>
            </div>
          </div>
          <button onclick="document.getElementById('create-special-formation-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Module de Formation :</label>
            <select id="form-module-select" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600 bg-slate-50">
              ${catalogOptions.map(opt => `
                <option value="${opt.id}" data-cost="${opt.baseCost}">${opt.label}</option>
              `).join('')}
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Nombre de Places Ouvertes aux Alliés :</label>
            <select id="form-capacity-select" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600 bg-slate-50">
              <option value="2">2 candidats extérieurs</option>
              <option value="4" selected>4 candidats extérieurs</option>
              <option value="6">6 candidats extérieurs</option>
              <option value="8">8 candidats extérieurs</option>
            </select>
          </div>

          <!-- Choix Gratuit vs Payant -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label class="block font-black text-slate-900">Tarification pour les Antennes Clientes :</label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-300 bg-white cursor-pointer hover:border-emerald-500 transition">
                <input type="radio" name="form-pricing-type" value="free" onchange="document.getElementById('form-custom-cost-box').classList.add('hidden')" checked />
                <div>
                  <span class="block font-black text-emerald-700">GRATUIT (0 €)</span>
                  <span class="block text-[10px] text-slate-500">Solidarité inter-antennes</span>
                </div>
              </label>

              <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-300 bg-white cursor-pointer hover:border-indigo-500 transition">
                <input type="radio" name="form-pricing-type" value="paid" onchange="document.getElementById('form-custom-cost-box').classList.remove('hidden')" />
                <div>
                  <span class="block font-black text-indigo-700">PAYANT (€)</span>
                  <span class="block text-[10px] text-slate-500">Recette pour l'antenne hôte</span>
                </div>
              </label>
            </div>

            <div id="form-custom-cost-box" class="hidden pt-2 border-t border-slate-200 space-y-1">
              <label class="block text-[11px] font-bold text-slate-700">Montant d'inscription facturé par candidat (€) :</label>
              <input type="number" id="form-custom-cost" min="10" max="800" value="150" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black text-slate-800 text-sm bg-white" />
              <p class="text-[10px] text-slate-500 italic">Ce montant sera directement crédité sur la trésorerie de votre antenne à chaque inscription validée.</p>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button onclick="document.getElementById('create-special-formation-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
            Annuler
          </button>
          <button onclick="window.ProtecMultiplayer.submitSpecialFormation(window.game)" class="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition flex items-center gap-1.5">
            <i data-lucide="check" class="w-3.5 h-3.5"></i>
            Publier le Stage Fédéral
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  submitSpecialFormation(game) {
    const moduleSelect = document.getElementById('form-module-select');
    const capacitySelect = document.getElementById('form-capacity-select');
    const pricingRadio = document.querySelector('input[name="form-pricing-type"]:checked');
    const customCostInput = document.getElementById('form-custom-cost');

    if (!moduleSelect || !capacitySelect) return;

    const modId = moduleSelect.value;
    const optText = moduleSelect.options[moduleSelect.selectedIndex].text;
    const capacity = parseInt(capacitySelect.value, 10) || 4;
    const isFree = pricingRadio ? pricingRadio.value === 'free' : true;
    const cost = isFree ? 0 : Math.max(10, parseInt(customCostInput?.value || '150', 10));

    const payload = {
      id: `form-spec-${Date.now()}`,
      organizerPlayerId: game.player?.id || 'directeur-local',
      organizerName: game.player?.name || 'Responsable d’antenne',
      stationName: game.stations?.[0]?.name || 'Antenne Locale',
      allianceId: game.player?.allianceId || 'alliance-fnpc',
      title: `Stage Fédéral : ${optText.split(' - ')[0]}`,
      type: modId,
      desc: `Session mutualisée de formation ${optText}. Hébergée et encadrée par l'antenne locale.`,
      costPerCandidate: cost,
      maxCandidates: capacity,
      registeredCandidates: [],
      createdAt: new Date().toISOString()
    };

    fetch('/api/alliances/formation/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
      game.formationsSpeciales.unshift(data.formation || payload);
    }).catch(() => {
      game.formationsSpeciales.unshift(payload);
    });

    const modal = document.getElementById('create-special-formation-modal');
    if (modal) modal.classList.add('hidden');

    game.showToast('Stage Fédéral Publié', `Votre stage de ${modId} (${cost === 0 ? 'GRATUIT' : cost + ' €/candidat'}) est désormais ouvert aux antennes alliées !`, 'green');
    game.save();
    game.openModule('alliance');
  },

  openRegisterVolunteerModal(game, formationId) {
    const form = game.formationsSpeciales.find(f => f.id === formationId);
    if (!form) return;

    const eligibleVolunteers = (game.volunteers || []).filter(v => v.status === 'dispo');
    if (eligibleVolunteers.length === 0) {
      game.showToast('Aucun bénévole disponible', 'Tous vos secouristes sont actuellement en mission ou indisponibles.', 'orange');
      return;
    }

    let modal = document.getElementById('register-volunteer-formation-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'register-volunteer-formation-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-base font-black text-slate-900 leading-tight">Inscrire un Secouriste</h3>
            <p class="text-xs text-slate-500 font-semibold">${form.title} (${form.costPerCandidate === 0 ? 'GRATUIT' : form.costPerCandidate + ' €'})</p>
          </div>
          <button onclick="document.getElementById('register-volunteer-formation-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
        </div>

        <div class="space-y-2 text-xs">
          <label class="block font-bold text-slate-700">Sélectionnez le bénévole à détacher en formation :</label>
          <select id="select-vol-to-form" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600 bg-slate-50">
            ${eligibleVolunteers.map(v => `
              <option value="${v.id}">${v.name} (${v.rank || 'Secouriste'} - ${v.role || 'Bénévole'})</option>
            `).join('')}
          </select>
        </div>

        <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex justify-between items-center">
          <span>Coût d'inscription :</span>
          <strong class="${form.costPerCandidate === 0 ? 'text-emerald-700' : 'text-slate-900'} font-black text-xs">
            ${form.costPerCandidate === 0 ? '0 € (Prise en charge solidaire)' : form.costPerCandidate + ' €'}
          </strong>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button onclick="document.getElementById('register-volunteer-formation-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
            Annuler
          </button>
          <button onclick="window.ProtecMultiplayer.confirmVolunteerRegistration(window.game, '${form.id}')" class="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition">
            Confirmer Inscription
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  confirmVolunteerRegistration(game, formationId) {
    const form = game.formationsSpeciales.find(f => f.id === formationId);
    const select = document.getElementById('select-vol-to-form');
    if (!form || !select) return;

    const volId = select.value;
    const volunteer = game.volunteers.find(v => v.id === volId);
    if (!volunteer) return;

    const cost = form.costPerCandidate || 0;
    if (cost > 0 && game.resources.money < cost) {
      game.showToast('Fonds Insuffisants', `Cette formation requiert ${cost} € de droits d'inscription.`, 'orange');
      return;
    }

    if (cost > 0) {
      game.resources.money -= cost;
    }

    volunteer.status = 'formation';

    // Validation des compétences selon le module
    if (form.type === 'PSE1' && !volunteer.skills?.includes('pse1')) {
      volunteer.skills = [...(volunteer.skills || []), 'pse1'];
      volunteer.rank = 'PSE1';
      volunteer.role = 'Secouriste';
    } else if (form.type === 'PSE2') {
      volunteer.skills = [...new Set([...(volunteer.skills || []), 'pse1', 'pse2'])];
      volunteer.rank = 'PSE2';
      volunteer.role = 'Équipier Secouriste';
    } else if (form.type === 'CE') {
      volunteer.skills = [...new Set([...(volunteer.skills || []), 'ce', 'commandement'])];
      volunteer.rank = 'CE';
      volunteer.role = 'Chef d’Équipe';
    } else if (form.type === 'CD') {
      volunteer.skills = [...new Set([...(volunteer.skills || []), 'cd', 'gestion_crise'])];
      volunteer.rank = 'CD';
      volunteer.role = 'Chef de Dispositif';
    } else if (form.type === 'P_VPSP') {
      volunteer.skills = [...new Set([...(volunteer.skills || []), 'permis_vpsp'])];
    } else if (form.type === 'SST') {
      volunteer.skills = [...new Set([...(volunteer.skills || []), 'sst'])];
    } else if (form.type === 'EXTINCTEUR') {
      volunteer.skills = [...new Set([...(volunteer.skills || []), 'epi_incendie'])];
    }

    form.registeredCandidates = form.registeredCandidates || [];
    form.registeredCandidates.push({
      volunteerId: volunteer.id,
      volunteerName: volunteer.name,
      playerName: game.player?.name || 'Responsable d’antenne'
    });

    const modal = document.getElementById('register-volunteer-formation-modal');
    if (modal) modal.classList.add('hidden');

    game.showToast('Inscription Validée !', `${volunteer.name} est inscrit au ${form.title} (${cost === 0 ? 'Gratuit' : '-' + cost + ' €'}).`, 'green');
    game.save();
    game.updateStatsUI();
    game.openModule('alliance');
  },

  // =========================================================================
  // 3. BOURSE FÉDÉRALE : VENTES, DONS ET ÉCHANGES DE VÉHICULES ET MATÉRIEL
  // =========================================================================

  renderMarketplaceTabHTML(game) {
    this.injectState(game);
    const offers = game.marketplace || [];
    const myPlayerId = game.player?.id || 'directeur-local';

    return `
      <div class="space-y-4">
        <!-- Bannière d'en-tête de la Bourse -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shadow-md">
          <div class="space-y-1">
            <h4 class="text-sm font-black flex items-center gap-2">
              <i data-lucide="repeat" class="w-4 h-4"></i>
              Bourse Fédérale aux Véhicules & Matériel
            </h4>
            <p class="text-xs text-white/90">
              Cessions de matériel réformé, dons solidaires et échanges d’équipements entre antennes de la Protection Civile.
            </p>
          </div>
          <button onclick="window.ProtecMultiplayer.openPublishOfferModal(window.game)" class="px-4 py-2 rounded-xl text-xs font-black bg-white text-emerald-800 hover:bg-emerald-50 transition shadow-sm flex items-center gap-1.5 cursor-pointer flex-shrink-0">
            <i data-lucide="plus-circle" class="w-4 h-4 text-emerald-700"></i>
            + Publier une Offre
          </button>
        </div>

        <!-- Barre de recherche et Filtres de la bourse -->
        <div class="space-y-2 border-b border-slate-200 pb-2">
          <div class="relative">
            <input 
              type="text" 
              id="mkt-search-input" 
              placeholder="🔍 Rechercher dans les annonces (titre, VPSP, matériel, don, vendeur...)" 
              oninput="window.ProtecMultiplayer.searchMarketplace(this.value)"
              class="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
            <button type="button" onclick="const inp=document.getElementById('mkt-search-input'); if(inp){inp.value=''; window.ProtecMultiplayer.searchMarketplace('');}" class="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
          </div>

          <div class="flex flex-wrap items-center justify-between text-xs gap-2">
            <div class="flex items-center gap-2 font-bold text-slate-600">
              <span>Filtres :</span>
              <button onclick="window.ProtecMultiplayer.filterMarketplace('all')" id="mkt-btn-all" class="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black">Tous (${offers.length})</button>
              <button onclick="window.ProtecMultiplayer.filterMarketplace('vehicule')" id="mkt-btn-veh" class="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-700">Véhicules</button>
              <button onclick="window.ProtecMultiplayer.filterMarketplace('materiel')" id="mkt-btn-mat" class="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-700">Matériel</button>
              <button onclick="window.ProtecMultiplayer.filterMarketplace('don')" id="mkt-btn-don" class="px-2.5 py-1 rounded-lg hover:bg-purple-100 text-purple-700 font-extrabold">Dons Solidaires (0 €)</button>
            </div>
            <span class="text-slate-400 font-semibold text-[11px]">${offers.length} offre(s) en ligne</span>
          </div>
        </div>

        <!-- Grille des offres -->
        <div id="mkt-offers-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${offers.length === 0 ? `
            <div class="col-span-2 p-8 rounded-2xl glass-card text-center text-slate-500 text-xs italic">
              Aucune annonce disponible sur la bourse actuellement. Soyez le premier à publier un véhicule ou équipement !
            </div>
          ` : offers.map(o => {
            const isMine = o.sellerPlayerId === myPlayerId;
            const isVehicle = o.category === 'vehicule';
            const searchText = `${o.title || ''} ${o.desc || ''} ${o.sellerPlayerName || ''} ${o.stationName || ''} ${o.category || ''} ${o.dealType || ''} ${o.tradeWanted || ''}`.toLowerCase();

            return `
              <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition" data-cat="${o.category}" data-deal="${o.dealType}" data-search-text="${searchText}">
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <span class="px-2 py-0.5 rounded text-[10px] font-black ${
                        o.dealType === 'don' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                        o.dealType === 'echange' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }">
                        ${o.dealType === 'don' ? '🎁 DON SOLIDAIRE' : o.dealType === 'echange' ? '🔄 ÉCHANGE' : '🏷️ VENTE'}
                      </span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        ${isVehicle ? 'Véhicule' : 'Équipement'}
                      </span>
                    </div>
                    <strong class="text-xs font-black mono-num ${o.dealType === 'don' ? 'text-purple-700' : 'text-emerald-700'}">
                      ${o.dealType === 'don' ? '0 € (Gratuit)' : o.dealType === 'echange' ? 'Troc' : o.price + ' €'}
                    </strong>
                  </div>

                  <div>
                    <h5 class="text-sm font-extrabold text-slate-900">${o.title}</h5>
                    <p class="text-xs text-slate-600 mt-0.5">${o.desc}</p>
                    ${o.tradeWanted ? `
                      <div class="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold mt-1.5">
                        Souhaité en échange : <strong>${o.tradeWanted}</strong>
                      </div>
                    ` : ''}
                  </div>

                  <div class="text-[10px] text-slate-400 font-semibold pt-1 flex items-center justify-between flex-wrap gap-1">
                    <span class="flex items-center gap-1.5 flex-wrap">
                      <span>Cédé par : <strong class="text-slate-700">${o.sellerPlayerName}</strong> (${o.stationName})</span>
                      ${(o.sellerDiscord?.username || (isMine && (game.player?.discord?.username || window.ProtecAuth?.currentUser?.discord?.username))) ? `
                        <span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20" title="Discord: @${(o.sellerDiscord?.username || game.player?.discord?.username || window.ProtecAuth?.currentUser?.discord?.username)}">
                          <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                          @${(o.sellerDiscord?.username || game.player?.discord?.username || window.ProtecAuth?.currentUser?.discord?.username)}
                        </span>
                      ` : ''}
                    </span>
                  </div>
                </div>

                <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span class="text-[10px] text-slate-400">${o.createdAt || 'Récent'}</span>
                  ${isMine ? `
                    <button onclick="window.ProtecMultiplayer.deleteMarketplaceOffer(window.game, '${o.id}')" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition">
                      Retirer l'annonce
                    </button>
                  ` : o.dealType === 'don' ? `
                    <button onclick="window.ProtecMultiplayer.claimDonation(window.game, '${o.id}')" class="px-4 py-1.5 rounded-xl text-xs font-black bg-purple-700 hover:bg-purple-800 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer">
                      <i data-lucide="gift" class="w-3.5 h-3.5"></i>
                      Accepter le Don
                    </button>
                  ` : o.dealType === 'echange' ? `
                    <button onclick="window.ProtecMultiplayer.openProposeTradeModal(window.game, '${o.id}')" class="px-4 py-1.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer">
                      <i data-lucide="repeat" class="w-3.5 h-3.5"></i>
                      Proposer Échange
                    </button>
                  ` : `
                    <button onclick="window.ProtecMultiplayer.buyMarketplaceItem(window.game, '${o.id}')" class="px-4 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer">
                      <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                      Acheter (${o.price} €)
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  currentMarketplaceFilter: 'all',
  currentMarketplaceSearch: '',

  filterMarketplace(filterType) {
    this.currentMarketplaceFilter = filterType;
    this.applyMarketplaceFilters();
  },

  searchMarketplace(query) {
    this.currentMarketplaceSearch = (query || '').toLowerCase().trim();
    this.applyMarketplaceFilters();
  },

  applyMarketplaceFilters() {
    const grid = document.getElementById('mkt-offers-grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('[data-cat]');
    const filterType = this.currentMarketplaceFilter || 'all';
    const q = this.currentMarketplaceSearch || '';

    ['all', 'veh', 'mat', 'don'].forEach(k => {
      const btn = document.getElementById(`mkt-btn-${k}`);
      if (btn) btn.className = 'px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-700';
    });
    const activeBtn = document.getElementById(`mkt-btn-${filterType === 'vehicule' ? 'veh' : filterType === 'materiel' ? 'mat' : filterType}`);
    if (activeBtn) activeBtn.className = 'px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black';

    cards.forEach(card => {
      const cat = card.getAttribute('data-cat');
      const deal = card.getAttribute('data-deal');
      const text = card.getAttribute('data-search-text') || '';

      const matchCategory = (filterType === 'all') || (filterType === 'don' && deal === 'don') || (cat === filterType);
      const matchSearch = !q || text.includes(q);

      card.style.display = (matchCategory && matchSearch) ? '' : 'none';
    });
  },

  openPublishOfferModal(game) {
    let modal = document.getElementById('publish-marketplace-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'publish-marketplace-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in';
      document.body.appendChild(modal);
    }

    const availableVehicles = (game.vehicles || []).filter(v => v.status === 'dispo');

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <i data-lucide="tag" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 leading-tight">Publier une Offre sur la Bourse</h3>
              <p class="text-xs text-slate-500 font-semibold">Cession, don solidaire ou échange entre antennes</p>
            </div>
          </div>
          <button onclick="document.getElementById('publish-marketplace-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          
          <!-- Choix Catégorie : Véhicule ou Matériel -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Que souhaitez-vous céder ?</label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-300 bg-white cursor-pointer hover:border-emerald-500 transition">
                <input type="radio" name="mkt-pub-cat" value="vehicule" onchange="window.ProtecMultiplayer.togglePublishCategory('vehicule')" checked />
                <span class="font-black text-slate-800">Un Véhicule du Garage</span>
              </label>
              <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-300 bg-white cursor-pointer hover:border-emerald-500 transition">
                <input type="radio" name="mkt-pub-cat" value="materiel" onchange="window.ProtecMultiplayer.togglePublishCategory('materiel')" />
                <span class="font-black text-slate-800">Un Lot de Matériel</span>
              </label>
            </div>
          </div>

          <!-- Sélection Véhicule -->
          <div id="mkt-veh-selection-box">
            <label class="block font-bold text-slate-700 mb-1">Véhicule à céder :</label>
            ${availableVehicles.length === 0 ? `
              <p class="text-rose-600 font-bold p-2 bg-rose-50 rounded-xl">Aucun véhicule disponible au garage actuellement.</p>
            ` : `
              <select id="mkt-select-vehicle" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 bg-slate-50">
                ${availableVehicles.map(v => `
                  <option value="${v.id}">${v.name} (${v.type || 'Véhicule'} - Carburant: ${v.fuel || 100}%)</option>
                `).join('')}
              </select>
            `}
          </div>

          <!-- Sélection Matériel -->
          <div id="mkt-mat-selection-box" class="hidden">
            <label class="block font-bold text-slate-700 mb-1">Matériel / Équipement :</label>
            <select id="mkt-select-material" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 bg-slate-50">
              <option value="dae">1 Défibrillateur Automatisé DAE</option>
              <option value="sac_ps">2 Sacs Premiers Secours PS Complets</option>
              <option value="oxygene">3 Bouteilles d'Oxygène Médical (O2)</option>
              <option value="tente_pma">1 Tente PMA Gonflable de Crise</option>
              <option value="radios">Lot de 4 Postes Radio Portatifs VHF</option>
              <option value="cump">1 Malle de Soutien Psychologique CUMP</option>
            </select>
          </div>

          <!-- Modalité de transaction : Vente, Don, Échange -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Modalité de la Cession :</label>
            <div class="grid grid-cols-3 gap-1.5">
              <label class="p-2 rounded-xl border border-slate-300 bg-white cursor-pointer hover:border-emerald-500 text-center">
                <input type="radio" name="mkt-pub-deal" value="vente" onchange="window.ProtecMultiplayer.togglePublishDeal('vente')" checked />
                <span class="block font-black text-emerald-800 text-[11px] mt-0.5">Vente (€)</span>
              </label>
              <label class="p-2 rounded-xl border border-slate-300 bg-white cursor-pointer hover:border-purple-500 text-center">
                <input type="radio" name="mkt-pub-deal" value="don" onchange="window.ProtecMultiplayer.togglePublishDeal('don')" />
                <span class="block font-black text-purple-800 text-[11px] mt-0.5">Don (0 €)</span>
              </label>
              <label class="p-2 rounded-xl border border-slate-300 bg-white cursor-pointer hover:border-amber-500 text-center">
                <input type="radio" name="mkt-pub-deal" value="echange" onchange="window.ProtecMultiplayer.togglePublishDeal('echange')" />
                <span class="block font-black text-amber-800 text-[11px] mt-0.5">Échange</span>
              </label>
            </div>
          </div>

          <!-- Champ Prix (si vente) -->
          <div id="mkt-price-box">
            <label class="block font-bold text-slate-700 mb-1">Prix de Cession (€) :</label>
            <input type="number" id="mkt-input-price" min="50" max="50000" value="4000" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black text-slate-800 text-sm bg-white" />
          </div>

          <!-- Champ Échange Souhaité (si échange) -->
          <div id="mkt-trade-box" class="hidden">
            <label class="block font-bold text-slate-700 mb-1">Contrepartie souhaitée :</label>
            <input type="text" id="mkt-input-trade" placeholder="Ex: 1 VTU Logistique, ou 4 DAE opérationnels..." class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-xs bg-white" />
          </div>

          <!-- Description de l'annonce -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Détails & État du matériel :</label>
            <input type="text" id="mkt-input-desc" placeholder="Ex: Véhicule entretenu en concession, contrôle technique vierge." class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 text-xs bg-white" />
          </div>

        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button onclick="document.getElementById('publish-marketplace-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
            Annuler
          </button>
          <button onclick="window.ProtecMultiplayer.confirmPublishOffer(window.game)" class="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition flex items-center gap-1.5">
            <i data-lucide="check" class="w-3.5 h-3.5"></i>
            Valider et Publier
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  togglePublishCategory(cat) {
    const vehBox = document.getElementById('mkt-veh-selection-box');
    const matBox = document.getElementById('mkt-mat-selection-box');
    const priceInput = document.getElementById('mkt-input-price');

    if (cat === 'vehicule') {
      if (vehBox) vehBox.classList.remove('hidden');
      if (matBox) matBox.classList.add('hidden');
      if (priceInput) priceInput.value = '4500';
    } else {
      if (vehBox) vehBox.classList.add('hidden');
      if (matBox) matBox.classList.remove('hidden');
      if (priceInput) priceInput.value = '600';
    }
  },

  togglePublishDeal(deal) {
    const priceBox = document.getElementById('mkt-price-box');
    const tradeBox = document.getElementById('mkt-trade-box');

    if (deal === 'vente') {
      if (priceBox) priceBox.classList.remove('hidden');
      if (tradeBox) tradeBox.classList.add('hidden');
    } else if (deal === 'don') {
      if (priceBox) priceBox.classList.add('hidden');
      if (tradeBox) tradeBox.classList.add('hidden');
    } else if (deal === 'echange') {
      if (priceBox) priceBox.classList.add('hidden');
      if (tradeBox) tradeBox.classList.remove('hidden');
    }
  },

  confirmPublishOffer(game) {
    const cat = document.querySelector('input[name="mkt-pub-cat"]:checked')?.value || 'vehicule';
    const deal = document.querySelector('input[name="mkt-pub-deal"]:checked')?.value || 'vente';
    const descInput = document.getElementById('mkt-input-desc');
    const desc = descInput?.value.trim() || 'Matériel vérifié et disponible immédiatement.';

    let title = '';
    let price = 0;
    let tradeWanted = null;
    let vehicleData = null;
    let materialData = null;

    if (cat === 'vehicule') {
      const select = document.getElementById('mkt-select-vehicle');
      const vehId = select?.value;
      const vehicle = game.vehicles.find(v => v.id === vehId);
      if (!vehicle) {
        game.showToast('Erreur', 'Veuillez sélectionner un véhicule disponible.', 'orange');
        return;
      }
      title = `${vehicle.name} (${vehicle.type || 'Véhicule'})`;
      vehicleData = { ...vehicle };

      // Retirer temporairement le véhicule du garage car mis en vente sur la bourse
      game.vehicles = game.vehicles.filter(v => v.id !== vehId);
    } else {
      const select = document.getElementById('mkt-select-material');
      const matKey = select?.value || 'dae';
      const matNames = {
        dae: '1 Défibrillateur Automatisé DAE',
        sac_ps: '2 Sacs Premiers Secours PS Complets',
        oxygene: '3 Bouteilles d’Oxygène Médical O2',
        tente_pma: '1 Tente PMA Gonflable de Crise',
        radios: 'Lot de 4 Postes Radio Portatifs VHF',
        cump: '1 Malle Soutien Psychologique CUMP'
      };
      title = matNames[matKey] || 'Lot d’Équipements de Secours';
      materialData = { itemKey: matKey, label: title, quantity: 1 };
    }

    if (deal === 'vente') {
      const priceInput = document.getElementById('mkt-input-price');
      price = Math.max(10, parseInt(priceInput?.value || '1000', 10));
    } else if (deal === 'echange') {
      const tradeInput = document.getElementById('mkt-input-trade');
      tradeWanted = tradeInput?.value.trim() || 'Matériel équivalent';
    }

    const newOffer = {
      id: `mkt-${Date.now()}`,
      sellerPlayerId: game.player?.id || 'directeur-local',
      sellerPlayerName: game.player?.name || 'Responsable d’antenne',
      sellerDiscord: game.player?.discord || (window.ProtecAuth?.currentUser?.discord) || null,
      stationName: game.stations?.[0]?.name || 'Antenne Locale',
      category: cat,
      title: title,
      desc: desc,
      dealType: deal,
      price: price,
      tradeWanted: tradeWanted,
      vehicleData: vehicleData,
      materialData: materialData,
      createdAt: new Date().toLocaleDateString('fr-FR')
    };

    game.marketplace = game.marketplace || [];
    game.marketplace.unshift(newOffer);

    // Diffusion via API
    fetch('/api/alliances/marketplace/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOffer)
    }).catch(() => {});

    const modal = document.getElementById('publish-marketplace-modal');
    if (modal) modal.classList.add('hidden');

    game.showToast('Offre Publiée !', `Votre annonce pour « ${title} » est visible par toutes les antennes du réseau.`, 'green');
    game.save();
    game.openModule('alliance');
  },

  deleteMarketplaceOffer(game, offerId) {
    const offer = (game.marketplace || []).find(o => o.id === offerId);
    if (!offer) return;

    // Si c'était un véhicule, le réintégrer dans notre flotte
    if (offer.vehicleData) {
      game.vehicles.push(offer.vehicleData);
    }

    game.marketplace = (game.marketplace || []).filter(o => o.id !== offerId);

    fetch('/api/alliances/marketplace/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId })
    }).catch(() => {});

    game.showToast('Annonce Retirée', 'L’offre a été retirée de la bourse.', 'blue');
    game.save();
    game.openModule('alliance');
  },

  buyMarketplaceItem(game, offerId) {
    const offer = (game.marketplace || []).find(o => o.id === offerId);
    if (!offer) return;

    if (game.resources.money < offer.price) {
      game.showToast('Fonds Insuffisants', `L’achat requiert ${offer.price} € de trésorerie.`, 'orange');
      return;
    }

    game.resources.money -= offer.price;

    // Réception du véhicule ou matériel
    if (offer.vehicleData) {
      const newVeh = {
        ...offer.vehicleData,
        id: `veh-${Date.now()}`,
        status: 'dispo',
        stationId: game.stations?.[0]?.id || 'station-1'
      };
      game.vehicles.push(newVeh);
      if (game.stations?.[0] && !game.stations[0].vehicles.includes(newVeh.id)) {
        game.stations[0].vehicles.push(newVeh.id);
      }
    }

    // Retirer l'offre de la bourse
    game.marketplace = game.marketplace.filter(o => o.id !== offerId);

    game.showToast('Acquisition Validée !', `Vous avez acheté « ${offer.title} » pour ${offer.price} €. Il est désormais disponible dans votre inventaire.`, 'green');
    game.save();
    game.updateStatsUI();
    game.openModule('alliance');
  },

  claimDonation(game, offerId) {
    const offer = (game.marketplace || []).find(o => o.id === offerId);
    if (!offer) return;

    if (offer.vehicleData) {
      const newVeh = {
        ...offer.vehicleData,
        id: `veh-${Date.now()}`,
        status: 'dispo',
        stationId: game.stations?.[0]?.id || 'station-1'
      };
      game.vehicles.push(newVeh);
      if (game.stations?.[0] && !game.stations[0].vehicles.includes(newVeh.id)) {
        game.stations[0].vehicles.push(newVeh.id);
      }
    }

    // Bonus de solidarité au receveur et donateur
    game.resources.reputationScore = Math.min(100, (game.resources.reputationScore || 50) + 10);
    game.resources.alliancePoints = (game.resources.alliancePoints || 0) + 25;

    game.marketplace = game.marketplace.filter(o => o.id !== offerId);

    game.showToast('Don Solidaire Accepté !', `Vous recevez à titre gracieux « ${offer.title} » offert par ${offer.sellerPlayerName} ! (+25 pts d’alliance)`, 'green');
    game.save();
    game.updateStatsUI();
    game.openModule('alliance');
  },

  openProposeTradeModal(game, offerId) {
    const offer = (game.marketplace || []).find(o => o.id === offerId);
    if (!offer) return;

    const availableVehicles = (game.vehicles || []).filter(v => v.status === 'dispo');

    let modal = document.getElementById('propose-trade-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'propose-trade-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-base font-black text-slate-900 leading-tight">Proposer un Échange</h3>
            <p class="text-xs text-slate-500 font-semibold">Pour : ${offer.title}</p>
          </div>
          <button onclick="document.getElementById('propose-trade-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
        </div>

        <div class="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          Souhait du cédant : <strong>${offer.tradeWanted || 'Matériel équivalent'}</strong>
        </div>

        <div class="space-y-2 text-xs">
          <label class="block font-bold text-slate-700">Sélectionnez le moyen à échanger en contrepartie :</label>
          ${availableVehicles.length === 0 ? `
            <p class="text-rose-600 font-bold p-2 bg-rose-50 rounded-xl">Aucun véhicule disponible à proposer en échange.</p>
          ` : `
            <select id="trade-select-my-vehicle" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 bg-slate-50">
              ${availableVehicles.map(v => `
                <option value="${v.id}">${v.name} (${v.type || 'Véhicule'})</option>
              `).join('')}
            </select>
          `}
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button onclick="document.getElementById('propose-trade-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
            Annuler
          </button>
          ${availableVehicles.length > 0 ? `
            <button onclick="window.ProtecMultiplayer.confirmTrade(window.game, '${offer.id}')" class="px-5 py-2 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md transition">
              Valider l'Échange
            </button>
          ` : ''}
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  confirmTrade(game, offerId) {
    const offer = (game.marketplace || []).find(o => o.id === offerId);
    const select = document.getElementById('trade-select-my-vehicle');
    if (!offer || !select) return;

    const myVehId = select.value;
    const myVehicle = game.vehicles.find(v => v.id === myVehId);
    if (!myVehicle) return;

    // Retrait de notre véhicule et réception du véhicule échangé
    game.vehicles = game.vehicles.filter(v => v.id !== myVehId);

    if (offer.vehicleData) {
      const newVeh = {
        ...offer.vehicleData,
        id: `veh-${Date.now()}`,
        status: 'dispo',
        stationId: game.stations?.[0]?.id || 'station-1'
      };
      game.vehicles.push(newVeh);
      if (game.stations?.[0] && !game.stations[0].vehicles.includes(newVeh.id)) {
        game.stations[0].vehicles.push(newVeh.id);
      }
    }

    game.marketplace = game.marketplace.filter(o => o.id !== offerId);

    const modal = document.getElementById('propose-trade-modal');
    if (modal) modal.classList.add('hidden');

    game.showToast('Échange Réussi !', `Vous avez échangé votre ${myVehicle.name} contre « ${offer.title} » !`, 'green');
    game.save();
    game.openModule('alliance');
  },

  // =========================================================================
  // 4. ÉVÉNEMENTS PROPOSÉS PAR LES JOUEURS & ÉCUSSONS COMMÉMORATIFS
  // =========================================================================

  getInitialBadges() {
    return [
      {
        id: 'badge-init-fondateur',
        name: 'Écusson Fondateur d’Antenne 2026',
        icon: 'shield',
        colorTheme: 'blue',
        rarityScore: 42,
        rarityTier: 'Rare',
        rarityColor: 'text-sky-700 bg-sky-100 border-sky-300',
        desc: 'Remis à l’ouverture officielle de votre antenne locale de la Protection Civile.',
        obtainedAt: '01/01/2026',
        eventName: 'Fondation d’Antenne',
        originalOrganizer: 'Direction Fédérale'
      },
      {
        id: 'badge-init-grand-froid',
        name: 'Écusson Dispositif Grand Froid',
        icon: 'snowflake',
        colorTheme: 'cyan',
        rarityScore: 58,
        rarityTier: 'Rare',
        rarityColor: 'text-sky-700 bg-sky-100 border-sky-300',
        desc: 'Délivré pour la mobilisation solidaire lors de la vigilance hivernale extrême.',
        obtainedAt: '15/02/2026',
        eventName: 'Plan Grand Froid DDETS',
        originalOrganizer: 'Préfecture de Secteur'
      },
      {
        id: 'badge-init-14juillet',
        name: 'Écusson Fête Nationale 14 Juillet',
        icon: 'sparkles',
        colorTheme: 'purple',
        rarityScore: 78,
        rarityTier: 'Épique',
        rarityColor: 'text-purple-700 bg-purple-100 border-purple-300',
        desc: 'Distinction commémorative remise pour le dispositif de sécurisation des festivités du 14 Juillet.',
        obtainedAt: '14/07/2026',
        eventName: 'DPS Fête Nationale',
        originalOrganizer: 'Direction des Opérations'
      }
    ];
  },

  getInitialCommunityEvents(game = null) {
    const curYear = game?.clock?.year || 2026;
    const curMonth = (game?.clock?.month !== undefined) ? (game.clock.month + 1) : (new Date().getMonth() + 1);
    const curDay = game?.clock?.day || new Date().getDate();

    return [
      {
        id: 'evt-comm-1',
        organizerPlayerId: 'system-ant-lyon',
        organizerPlayerName: 'Marc V. (Antenne Lyon)',
        stationName: 'Protection Civile du Rhône',
        title: 'Triathlon International du Grand Parc',
        category: 'Sportif & Nautique',
        locationName: 'Base de Loisirs & Berges du Lac',
        city: 'Lyon',
        departmentCode: '69',
        eventDate: { day: curDay + 3, month: curMonth, year: curYear, hour: 8 },
        durationHours: 8,
        publicCount: 6500,
        requiredVolunteers: 10,
        requiredVehicles: ['VPSP', 'Quad / Bateau', 'VTU'],
        rewardMoney: 1600,
        rewardReputation: 40,
        desc: 'Dispositif mixte nautique et terrestre encadrant 1 200 compétiteurs et 5 000 spectateurs.',
        badge: {
          id: 'badge-triathlon-2026',
          name: 'Écusson Triathlon du Lac 2026',
          icon: 'waves',
          colorTheme: 'cyan',
          rarityScore: 68,
          rarityTier: 'Épique',
          rarityColor: 'text-purple-700 bg-purple-100 border-purple-300',
          desc: 'Décerné aux équipiers ayant assuré la couverture sanitaire et le secours nautique du Triathlon.'
        },
        registeredAntennas: [
          { playerId: 'system-ant-lyon', stationName: 'Protection Civile du Rhône', volunteersCount: 4 }
        ],
        status: 'open'
      },
      {
        id: 'evt-comm-2',
        organizerPlayerId: 'system-ant-bordeaux',
        organizerPlayerName: 'Hélène D. (Antenne Bordeaux)',
        stationName: 'Protection Civile de Gironde',
        title: 'Nuit des Étoiles & Fête du Fleuve',
        category: 'Festival & Grand Public',
        locationName: 'Quais de Garonne',
        city: 'Bordeaux',
        departmentCode: '33',
        eventDate: { day: curDay + 6, month: curMonth, year: curYear, hour: 18 },
        durationHours: 7,
        publicCount: 14000,
        requiredVolunteers: 14,
        requiredVehicles: ['2 VPSP', 'PMA Mobile'],
        rewardMoney: 2400,
        rewardReputation: 60,
        desc: 'Grand rassemblement festif sur les quais : postes de secours avancés, patrouilles et évacuations CHU.',
        badge: {
          id: 'badge-etoiles-bordeaux',
          name: 'Écusson Nuit des Étoiles 2026',
          icon: 'star',
          colorTheme: 'purple',
          rarityScore: 82,
          rarityTier: 'Épique',
          rarityColor: 'text-purple-700 bg-purple-100 border-purple-300',
          desc: 'Écusson d’honneur commémorant le dispositif festif des Quais de Garonne.'
        },
        registeredAntennas: [
          { playerId: 'system-ant-bordeaux', stationName: 'Protection Civile de Gironde', volunteersCount: 6 }
        ],
        status: 'open'
      },
      {
        id: 'evt-comm-3',
        organizerPlayerId: 'system-ant-lille',
        organizerPlayerName: 'Thomas D. (Antenne Lille)',
        stationName: 'Protection Civile du Nord',
        title: 'Grande Manœuvre Fédérale Plan NOVI Catastrophe',
        category: 'Exercice Crise & NOVI',
        locationName: 'Gare de Triage & Zone Industrielle',
        city: 'Lille',
        departmentCode: '59',
        eventDate: { day: curDay + 10, month: curMonth, year: curYear, hour: 10 },
        durationHours: 10,
        publicCount: 1500,
        requiredVolunteers: 18,
        requiredVehicles: ['3 VPSP', 'Tente PMA', 'VLM'],
        rewardMoney: 3200,
        rewardReputation: 90,
        desc: 'Simulation grandeur nature d’accident ferroviaire multi-victimes en coordination SAMU/SDIS/Gendarmerie.',
        badge: {
          id: 'badge-novi-2026',
          name: 'Écusson Bouclier NOVI National',
          icon: 'shield-alert',
          colorTheme: 'gold',
          rarityScore: 94,
          rarityTier: 'Légendaire',
          rarityColor: 'text-amber-800 bg-amber-100 border-amber-300 shadow-sm font-black',
          desc: 'Prestigieux patch commémoratif d’intervention et commandement sur exercice majeur NOVI.'
        },
        registeredAntennas: [
          { playerId: 'system-ant-lille', stationName: 'Protection Civile du Nord', volunteersCount: 8 }
        ],
        status: 'open'
      }
    ];
  },

  // Calcul strict de la Rareté de l'Écusson selon les critères réglementaires :
  // Catalogue officiel exhaustif des types d'événements de la Protection Civile
  OFFICIAL_EVENT_CATEGORIES: [
    {
      key: 'Festival & Concert',
      label: '🎪 Festival, Concert & Scène Musicale',
      keywords: ['festival', 'festiv', 'concert', 'musique', 'scene', 'dj', 'techno', 'rock', 'rap', 'son', 'chanson', 'orchestre', 'live']
    },
    {
      key: 'Course & Événement Sportif',
      label: '🏃 Course & Événement Sportif (Marathon, Trail, Cyclisme, Tournoi...)',
      keywords: ['sport', 'marathon', 'course', 'trail', 'velo', 'cyclisme', 'foot', 'football', 'rugby', 'natation', 'triathlon', 'athletisme', 'tournoi', 'match', 'stade', 'combat', 'judo', 'boxe']
    },
    {
      key: 'Fête Municipale & Rassemblement Populaire',
      label: '🎉 Fête Municipale & Rassemblement Populaire (Fête de ville, Carnaval, Feux d’artifice...)',
      keywords: ['fete', 'carnaval', 'kermesse', 'artifice', 'populaire', 'village', 'commune', 'foire', 'ducasse', 'parade', 'boulodrome', 'brocante', 'vide grenier']
    },
    {
      key: 'Foire, Salon & Exposition',
      label: '🏛️ Foire, Salon & Congrès d’Exposition (Parc des expos, Salons...)',
      keywords: ['salon', 'foire', 'expo', 'exposition', 'congres', 'convention', 'stand', 'comptoir', 'foire expo']
    },
    {
      key: 'Grand Événement International',
      label: '🌐 Grand Événement International (JO, Sommet d’État, Mondial...)',
      keywords: ['international', 'jo', 'olympique', 'sommet', 'otan', 'mondial', 'coupe du monde', 'chef detat', 'g7', 'g20']
    },
    {
      key: 'Culture, Spectacle & Théâtre',
      label: '🎭 Culture, Spectacle & Arts de Rue (Son & Lumière, Danse...)',
      keywords: ['culture', 'spectacle', 'theatre', 'danse', 'lumiere', 'medieval', 'historique', 'opera', 'musee', 'art']
    },
    {
      key: 'Exercice de Sécurité Civile & Plan NOVI',
      label: '🚨 Exercice de Sécurité Civile & Plan NOVI (Sinistre simulé, Manœuvre zonale...)',
      keywords: ['exercice', 'novi', 'manoeuvre', 'crise', 'catastrophe', 'sinistre', 'attentat', 'simulation', 'sdis', 'pompiers', 'samu', 'orsec']
    },
    {
      key: 'Soutien aux Populations & Sinistres',
      label: '⛺ Soutien aux Populations & Accueil de Sinistrés (CAI, Hébergement...)',
      keywords: ['soutien', 'population', 'sinistre', 'accueil', 'cai', 'chu', 'hebergement', 'inondation', 'evacuation', 'tempete', 'ravitaillement']
    },
    {
      key: 'Maraude Sociale d’Urgence',
      label: '❄️ Maraude Sociale d’Urgence & Plan Grand Froid / Canicule',
      keywords: ['maraude', 'social', 'grand froid', 'canicule', 'sdf', 'precarite', 'soupe', 'samu social', '115']
    },
    {
      key: 'Cérémonie & Commémoration Officielle',
      label: '🎖️ Cérémonie & Commémoration Officielle (14 Juillet, Défilés...)',
      keywords: ['ceremonie', 'commemoration', '14 juillet', 'defile', '8 mai', '11 novembre', 'monument', 'patriotique']
    }
  ],

  // Recherche de similarité (fuzzy matching) entre la saisie personnalisée et les types officiels
  findSimilarCategory(input) {
    if (!input || input.trim().length < 3) return null;
    const clean = input.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    for (const cat of this.OFFICIAL_EVENT_CATEGORIES) {
      for (const kw of cat.keywords) {
        const cleanKw = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (clean.includes(cleanKw) || cleanKw.includes(clean)) {
          return cat.key;
        }
        if (clean.length >= 4 && cleanKw.length >= 4 && (clean.startsWith(cleanKw.slice(0, 4)) || cleanKw.startsWith(clean.slice(0, 4)))) {
          return cat.key;
        }
      }
    }
    return null;
  },

  // Calcul réglementaire de la rareté d'un écusson (déterminé par l'accessibilité et les unités disponibles)
  calculateBadgeRarity(accessType = 'evenement_special', availableUnits = 4) {
    if (accessType === 'mission_ouverte') {
      return {
        score: 25,
        tier: 'Commun',
        color: 'text-slate-800 bg-slate-100 border-slate-300 font-bold',
        desc: 'Récupérable par tous dans une mission ordinaire (Accès Libre)'
      };
    }
    if (accessType === 'dps_departemental') {
      return {
        score: 45,
        tier: 'Peu Commun',
        color: 'text-emerald-800 bg-emerald-100 border-emerald-300 font-bold',
        desc: 'Participation à un DPS ou rassemblement ordinaire'
      };
    }
    if (accessType === 'evenement_regional') {
      return {
        score: 65,
        tier: 'Rare',
        color: 'text-sky-800 bg-sky-100 border-sky-300 font-extrabold',
        desc: 'Événement régional ouvert aux antennes participantes'
      };
    }
    if (accessType === 'evenement_unique') {
      return {
        score: 100,
        tier: 'Légendaire',
        color: 'text-amber-900 bg-gradient-to-r from-amber-100 to-yellow-200 border-amber-400 font-black shadow-md ring-1 ring-amber-400',
        desc: 'Événement unique ou historique (Écusson d’exception légendaire)'
      };
    }

    // evenement_special : calcul selon le quota d'unités / antennes participantes
    const units = parseInt(availableUnits, 10) || 4;
    if (units <= 3) {
      return {
        score: 95,
        tier: 'Très Rare',
        color: 'text-purple-900 bg-purple-100 border-purple-400 font-black shadow-sm ring-1 ring-purple-300',
        desc: `Événement d'exception restreint à seulement ${units} antenne(s) participante(s)`
      };
    } else if (units <= 7) {
      return {
        score: 85,
        tier: 'Très Rare',
        color: 'text-purple-800 bg-purple-100 border-purple-300 font-black',
        desc: `Événement très sélectif limité à ${units} antennes`
      };
    } else if (units <= 15) {
      return {
        score: 65,
        tier: 'Rare',
        color: 'text-sky-800 bg-sky-100 border-sky-300 font-extrabold',
        desc: `Événement spécial limité à ${units} antennes`
      };
    } else {
      return {
        score: 45,
        tier: 'Peu Commun',
        color: 'text-emerald-800 bg-emerald-100 border-emerald-300 font-bold',
        desc: `Événement ouvert à un large contingent (${units} antennes)`
      };
    }
  },

  // Alias rétro-compatible
  calculateRarityScore(publicCount, reqVol, durationHours, isCrisis = false, accessType = 'evenement_special', availableUnits = 4) {
    return this.calculateBadgeRarity(accessType, availableUnits);
  },

  // Gestion interactive de la sélection de catégorie et suggestions en direct
  onEventCategoryChange(val) {
    const customBox = document.getElementById('evt-custom-category-box');
    const customInput = document.getElementById('evt-input-custom-category');
    const suggBox = document.getElementById('evt-category-suggestion-box');
    if (!customBox) return;

    if (val === 'custom') {
      customBox.classList.remove('hidden');
      if (customInput) customInput.focus();
    } else {
      customBox.classList.add('hidden');
      if (suggBox) suggBox.classList.add('hidden');
    }
  },

  onCustomCategoryInput(val) {
    const suggBox = document.getElementById('evt-category-suggestion-box');
    if (!suggBox) return;

    const matchedKey = this.findSimilarCategory(val);
    if (matchedKey) {
      const catObj = this.OFFICIAL_EVENT_CATEGORIES.find(c => c.key === matchedKey);
      suggBox.innerHTML = `
        <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div class="flex items-center gap-1.5">
            <span class="text-base">💡</span>
            <span>Votre saisie ressemble au type officiel : <strong class="text-amber-900">${catObj ? catObj.label : matchedKey}</strong></span>
          </div>
          <button type="button" onclick="window.ProtecMultiplayer.applySuggestedCategory('${matchedKey}')" class="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-[11px] shadow-xs cursor-pointer whitespace-nowrap">
            Sélectionner ce type
          </button>
        </div>
      `;
      suggBox.classList.remove('hidden');
    } else {
      suggBox.classList.add('hidden');
      suggBox.innerHTML = '';
    }
  },

  applySuggestedCategory(catKey) {
    const catSelect = document.getElementById('evt-select-category');
    const customBox = document.getElementById('evt-custom-category-box');
    const suggBox = document.getElementById('evt-category-suggestion-box');
    if (catSelect) {
      catSelect.value = catKey;
    }
    if (customBox) customBox.classList.add('hidden');
    if (suggBox) {
      suggBox.classList.add('hidden');
      suggBox.innerHTML = '';
    }
    if (window.game) {
      window.game.showToast('Type Appliqué', `Catégorie officielle alignée sur « ${catKey} ».`, 'blue');
    }
  },

  // Calcul réglementaire de l'Indemnisation d'un Événement (personnel × durée + moyens engagés)
  calculateEventIndemnisation(volunteers = 8, durationHours = 6, vehiclesList = ['1 VPSP']) {
    const hourlyRate = 15; // 15 € / heure / secouriste
    const volNum = parseInt(volunteers, 10) || 0;
    const durNum = parseInt(durationHours, 10) || 0;
    const basePersonnel = volNum * durNum * hourlyRate;

    let totalMoyens = 0;
    const vehArray = Array.isArray(vehiclesList) ? vehiclesList : [vehiclesList];
    vehArray.forEach(v => {
      const str = String(v).toLowerCase();
      if (str.includes('vpsp')) totalMoyens += 120;
      else if (str.includes('vtu')) totalMoyens += 55;
      else if (str.includes('vl')) totalMoyens += 35;
      else if (str.includes('pma') || str.includes('tente')) totalMoyens += 150;
      else if (str.includes('bateau') || str.includes('nautique') || str.includes('quad')) totalMoyens += 90;
      else if (str.trim().length > 0) totalMoyens += 40;
    });

    const total = basePersonnel + totalMoyens;
    return {
      volunteers: volNum,
      durationHours: durNum,
      hourlyRate,
      basePersonnel,
      totalMoyens,
      total
    };
  },

  // Rendu visuel d'un Écusson brodé (Supporte les images fournies sous forme de lien)
  renderBadgeCardHTML(badge, isInteractive = true) {
    const themeGradients = {
      blue: 'from-blue-700 via-indigo-800 to-slate-900 border-blue-400 text-blue-200',
      cyan: 'from-cyan-600 via-sky-800 to-indigo-950 border-cyan-300 text-cyan-200',
      purple: 'from-purple-700 via-fuchsia-900 to-slate-950 border-purple-400 text-purple-200',
      gold: 'from-amber-500 via-yellow-600 to-amber-900 border-yellow-300 text-amber-100 shadow-md ring-2 ring-amber-300/60',
      green: 'from-emerald-600 via-teal-800 to-slate-950 border-emerald-400 text-emerald-200',
      red: 'from-red-600 via-rose-800 to-slate-950 border-red-400 text-rose-200',
      orange: 'from-orange-500 via-amber-700 to-slate-950 border-orange-400 text-orange-200'
    };

    const gradientClass = themeGradients[badge.colorTheme] || themeGradients.blue;
    const hasImage = Boolean(badge.imageUrl && badge.imageUrl.trim().length > 5);

    return `
      <div class="relative group p-3 rounded-2xl bg-gradient-to-br ${gradientClass} border-2 border-dashed shadow-md flex flex-col items-center justify-between text-center transition-all duration-200 hover:scale-105 select-none" style="min-height: 155px;">
        <!-- Badge Rareté -->
        <div class="w-full flex items-center justify-center text-[9px] mb-1">
          <span class="px-2 py-0.5 rounded-full font-black ${badge.rarityColor || 'bg-white/20 text-white'} shadow-2xs">
            ${badge.rarityTier || 'Commémoratif'}
          </span>
        </div>

        <!-- Emblème central : Image du lien ou icône vectorielle -->
        <div class="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center my-1 shadow-inner overflow-hidden group-hover:scale-105 transition-transform flex-shrink-0">
          ${hasImage ? `
            <img src="${badge.imageUrl}" alt="${badge.name}" class="w-full h-full object-cover rounded-full" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="hidden w-full h-full items-center justify-center">
              <i data-lucide="${badge.icon || 'shield'}" class="w-6 h-6 text-white drop-shadow"></i>
            </div>
          ` : `
            <i data-lucide="${badge.icon || 'shield'}" class="w-6 h-6 text-white drop-shadow"></i>
          `}
        </div>

        <!-- Titre & Info -->
        <div class="w-full mt-1">
          <span class="block text-[11px] font-black text-white leading-tight truncate" title="${badge.name}">${badge.name}</span>
          <span class="block text-[9px] text-white/70 truncate mt-0.5">${badge.eventName || 'Mission Spéciale'}</span>
          <span class="block text-[8px] text-white/80 font-bold mt-0.5">${badge.accessType === 'mission_ouverte' ? 'Mission Ouverte' : (badge.availableUnits ? `${badge.availableUnits} antenne(s) max` : 'Événement Spécial')}</span>
        </div>

        ${isInteractive ? `
          <div class="w-full pt-1.5 mt-1 border-t border-white/20 flex items-center justify-center gap-1">
            <button onclick="window.ProtecMultiplayer.openGiveBadgeModal(window.game, '${badge.id}')" class="px-2 py-0.5 rounded text-[9px] font-bold bg-white/20 hover:bg-white/30 text-white transition" title="Faire don de cet écusson à une antenne alliée">
              🎁 Donner
            </button>
            <button onclick="window.ProtecMultiplayer.openTradeBadgeModal(window.game, '${badge.id}')" class="px-2 py-0.5 rounded text-[9px] font-bold bg-white/20 hover:bg-white/30 text-white transition" title="Échanger cet écusson">
              🔄 Troc
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  // Rendu de la Galerie d'Écussons dans le Profil Directeur
  renderBadgesCollectionHTML(game) {
    this.injectState(game);
    const badges = game.badgesCollection || [];

    return `
      <div class="p-4 rounded-2xl glass-card space-y-3 border border-slate-200">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <i data-lucide="award" class="w-4 h-4"></i>
            </div>
            <div>
              <h5 class="text-xs font-black text-slate-900 leading-tight">Collection d’Écussons de Mission</h5>
              <p class="text-[10px] text-slate-500 font-semibold">${badges.length} écusson(s) commémoratif(s) débloqué(s)</p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-[9px] font-bold text-slate-400 block uppercase">Distinctions</span>
            <span class="text-xs font-black text-indigo-700">Officielles</span>
          </div>
        </div>

        ${badges.length === 0 ? `
          <p class="text-xs text-slate-500 py-4 text-center italic">
            Aucun écusson pour l’instant. Participez aux événements communautaires ou organisez des dispositifs pour remporter des écussons exclusifs !
          </p>
        ` : `
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
            ${badges.map(b => this.renderBadgeCardHTML(b, true)).join('')}
          </div>
        `}
      </div>
    `;
  },

  // Modal de Création d'un Événement par le Joueur
  openCreateCommunityEventModal(game) {
    let modal = document.getElementById('create-community-event-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'create-community-event-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto';
      document.body.appendChild(modal);
    }

    const curDay = (game.clock?.day || 1) + 2;
    const curMonth = (game.clock?.month || 0) + 1;
    const curYear = game.clock?.year || 2026;
    const myStation = game.stations?.[0];
    const defaultCity = myStation?.city || 'Paris';
    const defaultLat = myStation?.lat || 48.8566;
    const defaultLng = myStation?.lng || 2.3522;

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800 my-8">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <i data-lucide="calendar-plus" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 leading-tight">Proposer un Événement Multijoueur</h3>
              <p class="text-xs text-slate-500 font-semibold">Créez un grand DPS communautaire avec écusson exclusif (Validation par un Admin)</p>
            </div>
          </div>
          <button onclick="document.getElementById('create-community-event-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
        </div>

        <div class="space-y-3.5 text-xs">
          
          <!-- Titre & Catégorie Développée -->
          <div class="space-y-2.5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Intitulé de l'Événement :</label>
                <input type="text" id="evt-input-title" placeholder="Ex: Marathon de la Métropole" value="Grand Rassemblement Festif" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-black text-slate-800 bg-slate-50" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Type d'Événement :</label>
                <select id="evt-select-category" onchange="window.ProtecMultiplayer.onEventCategoryChange(this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 bg-slate-50">
                  <option value="Festival & Concert" selected>🎪 Festival, Concert & Scène Musicale</option>
                  <option value="Course & Événement Sportif">🏃 Course & Événement Sportif (Marathon, Trail, Tournoi...)</option>
                  <option value="Fête Municipale & Rassemblement Populaire">🎉 Fête Municipale & Rassemblement Populaire (Fête de ville, Feux d’artifice...)</option>
                  <option value="Foire, Salon & Exposition">🏛️ Foire, Salon & Congrès d’Exposition (Parc des expos...)</option>
                  <option value="Grand Événement International">🌐 Grand Événement International (JO, Sommet d’État, Mondial...)</option>
                  <option value="Culture, Spectacle & Théâtre">🎭 Culture, Spectacle & Arts de Rue (Son & Lumière...)</option>
                  <option value="Exercice de Sécurité Civile & Plan NOVI">🚨 Exercice de Sécurité Civile & Plan NOVI (Sinistre simulé...)</option>
                  <option value="Soutien aux Populations & Sinistres">⛺ Soutien aux Populations & Sinistres (CAI, Hébergement...)</option>
                  <option value="Maraude Sociale d’Urgence">❄️ Maraude Sociale d’Urgence & Plan Grand Froid</option>
                  <option value="Cérémonie & Commémoration Officielle">🎖️ Cérémonie & Commémoration Officielle (14 Juillet, Défilés...)</option>
                  <option value="custom">✍️ Autre / Type personnalisé...</option>
                </select>
              </div>
            </div>

            <!-- Bloc Saisie Valeur Personnalisée avec suggestions intelligentes -->
            <div id="evt-custom-category-box" class="hidden p-3 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-2">
              <label class="block font-bold text-amber-950 text-[11px]">Saisissez votre type d'événement personnalisé :</label>
              <input 
                type="text" 
                id="evt-input-custom-category" 
                placeholder="Ex: Course de caisses à savon, Gala caritatif, Régate nautique..." 
                oninput="window.ProtecMultiplayer.onCustomCategoryInput(this.value)" 
                class="w-full px-3 py-1.5 rounded-xl border border-amber-300 font-bold text-slate-800 bg-white" 
              />
              <div id="evt-category-suggestion-box" class="hidden"></div>
            </div>
          </div>

          <!-- ADRESSE & LOCALISATION PRÉCISE (OBLIGATOIRE COMME TOUTES LES MISSIONS) -->
          <div class="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="font-black text-sky-950 flex items-center gap-1.5">
                <i data-lucide="map-pin" class="w-4 h-4 text-sky-600"></i>
                Adresse du Dispositif & Coordonnées Cartographiques
              </span>
              <span class="text-[10px] text-sky-700 font-semibold">Requis pour l'intervention</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div class="sm:col-span-2">
                <label class="block font-bold text-slate-700 text-[11px] mb-1">Adresse postale précise :</label>
                <div class="flex flex-col sm:flex-row gap-1.5">
                  <input type="text" id="evt-input-address" placeholder="Ex: 15 Place de l'Hôtel de Ville" value="15 Place de la Mairie" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" />
                  <button type="button" onclick="window.ProtecMultiplayer.pickEventLocationOnMap()" class="px-3.5 py-1.5 rounded-xl bg-pc-blue hover:bg-blue-700 active:scale-95 text-white font-extrabold text-[11px] whitespace-nowrap shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer" title="Cliquer directement sur la carte pour définir l'emplacement précis du dispositif">
                    <i data-lucide="map-pin" class="w-3.5 h-3.5 text-amber-300"></i>
                    <span>Placer un point sur la map</span>
                  </button>
                </div>
              </div>
              <div>
                <label class="block font-bold text-slate-700 text-[11px] mb-1">Ville & Commune :</label>
                <input type="text" id="evt-input-city" value="${defaultCity}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" />
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div>
                <label class="block font-semibold text-slate-600 mb-0.5">Latitude (GPS) :</label>
                <input type="number" step="0.0001" id="evt-input-lat" value="${defaultLat.toFixed(4)}" class="w-full px-2.5 py-1 rounded-lg border border-slate-300 font-mono text-slate-800 bg-white text-xs" />
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-0.5">Longitude (GPS) :</label>
                <input type="number" step="0.0001" id="evt-input-lng" value="${defaultLng.toFixed(4)}" class="w-full px-2.5 py-1 rounded-lg border border-slate-300 font-mono text-slate-800 bg-white text-xs" />
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-0.5">Date & Heure :</label>
                <input type="text" id="evt-input-date" value="${curDay}/${curMonth}/${curYear} à 14h00" class="w-full px-2.5 py-1 rounded-lg border border-slate-300 font-bold text-slate-800 bg-white text-xs" />
              </div>
            </div>
            <p class="text-[10px] text-sky-800 font-medium italic">
              ℹ️ Comme toutes les missions (hors maraudes qui opèrent par secteur), une adresse ou un point repéré sur la carte est impératif. L'administrateur peut affiner l'emplacement.
            </p>
          </div>

          <!-- Effectif, Durée, Moyens Véhicules -->
          <div class="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Public Attendu :</label>
              <input type="number" id="evt-input-public" min="100" max="100000" step="500" value="6000" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-black text-slate-800 text-xs bg-white" />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Secouristes Requis :</label>
              <input type="number" id="evt-input-volunteers" min="2" max="30" value="8" oninput="window.ProtecMultiplayer.updateIndemnisationPreviewInModal()" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-black text-slate-800 text-xs bg-white" />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Durée (Heures) :</label>
              <input type="number" id="evt-input-duration" min="2" max="24" value="6" oninput="window.ProtecMultiplayer.updateIndemnisationPreviewInModal()" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-black text-slate-800 text-xs bg-white" />
            </div>
          </div>

          <!-- INDEMNISATION BASÉE SUR PERSONNEL × DURÉE + MOYENS ENGAGÉS -->
          <div class="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-black text-emerald-950 flex items-center gap-1.5">
                <i data-lucide="badge-euro" class="w-4 h-4 text-emerald-700"></i>
                Indemnisation Opérationnelle de l'Événement
              </span>
              <span id="evt-indemnisation-breakdown" class="text-[10px] font-bold text-emerald-800">
                8 sec. × 6h (720 €) + Moyens (120 €) = 840 €
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Moyens Véhicules / Matériel :</label>
                <input type="text" id="evt-input-vehicles" value="1 VPSP, 1 VTU" oninput="window.ProtecMultiplayer.updateIndemnisationPreviewInModal()" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-xs bg-white" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Indemnisation Totale (€) :</label>
                <input type="number" id="evt-input-reward" min="100" max="15000" step="50" value="840" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black text-emerald-700 text-xs bg-white" />
              </div>
            </div>
            <p class="text-[10px] text-emerald-900 font-medium">
              ⚖️ <em>Calcul réglementaire :</em> Taux horaire de 15 €/h par secouriste + Forfait d'engagement des véhicules et matériels logistiques. L'administrateur a le plein pouvoir de réajuster l'indemnisation lors de la validation.
            </p>
          </div>

          <!-- SECTION ÉCUSSON : LIEN D'IMAGE ET INTITULÉ (RARETÉ ATTRIBUÉE À LA VALIDATION ADMIN) -->
          <div class="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/80 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-black text-indigo-950 flex items-center gap-1.5">
                <i data-lucide="award" class="w-4 h-4 text-indigo-600"></i>
                Proposition de l'Écusson Fédéral (Lien d'image & Intitulé)
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                ⏳ Rareté définie par l'Admin à la validation
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div class="sm:col-span-2">
                <label class="block font-bold text-slate-700 text-[11px] mb-1">Lien / URL de l'image de l'écusson :</label>
                <div class="flex gap-2 items-center">
                  <input type="url" id="badge-input-image-url" placeholder="https://exemple.fr/mon_ecusson.png" value="" oninput="window.ProtecMultiplayer.previewBadgeImageInModal()" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-medium text-slate-800 text-xs bg-white" />
                  <div id="badge-modal-preview-thumb" class="w-9 h-9 rounded-xl bg-purple-100 border border-purple-300 flex items-center justify-center flex-shrink-0 overflow-hidden text-purple-700 font-bold text-[9px]">
                    Aperçu
                  </div>
                </div>
              </div>
              <div>
                <label class="block font-bold text-slate-700 text-[11px] mb-1">Nom de l'Écusson :</label>
                <input type="text" id="badge-input-name" placeholder="Ex: Écusson Fête 2026" value="Écusson Rassemblement 2026" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-xs bg-white" />
              </div>
            </div>

            <div class="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-[11px] flex items-start gap-2 leading-relaxed">
              <i data-lucide="info" class="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5"></i>
              <div>
                <strong class="font-bold">Réglementation de la Rareté :</strong>
                La rareté n'est pas choisie par le joueur lors de la proposition. Elle est calculée et fixée par l'administrateur une fois l'événement validé, en fonction de son accessibilité réelle (mission ouverte en accès libre = Commun, événement spécial ou régional = Rare/Très Rare, événement unique = Légendaire).
              </div>
            </div>
          </div>

        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button onclick="document.getElementById('create-community-event-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer">
            Annuler
          </button>
          <button onclick="window.ProtecMultiplayer.submitCommunityEvent(window.game)" class="px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="send" class="w-4 h-4"></i>
            Soumettre à Validation Administrative
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
    this.updateIndemnisationPreviewInModal();
  },

  pickEventLocationOnMap() {
    if (!window.game) return;

    const latInput = document.getElementById('evt-input-lat');
    const lngInput = document.getElementById('evt-input-lng');
    const addrInput = document.getElementById('evt-input-address');
    const cityInput = document.getElementById('evt-input-city');

    window.game.startLocationPicker({
      title: "Emplacement de l'Événement",
      subtitle: "Cliquez sur la carte à l'endroit précis où se déroulera la manifestation",
      onConfirm: (loc) => {
        if (latInput) latInput.value = loc.lat.toFixed(4);
        if (lngInput) lngInput.value = loc.lng.toFixed(4);
        if (loc.address && addrInput) addrInput.value = loc.address;
        if (loc.city && cityInput) cityInput.value = loc.city;
        window.game.showToast('Emplacement Enregistré', `Point placé sur la carte : ${loc.address ? loc.address + ', ' : ''}${loc.city || ''} (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`, 'green');
      }
    });
  },

  geocodeAddressInModal() {
    const addrInput = document.getElementById('evt-input-address');
    const cityInput = document.getElementById('evt-input-city');
    const latInput = document.getElementById('evt-input-lat');
    const lngInput = document.getElementById('evt-input-lng');

    const query = `${addrInput?.value || ''} ${cityInput?.value || ''}`.trim();
    if (!query) return;

    fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.features && data.features.length > 0) {
          const feat = data.features[0];
          const coords = feat.geometry.coordinates;
          if (lngInput) lngInput.value = coords[0].toFixed(4);
          if (latInput) latInput.value = coords[1].toFixed(4);
          if (feat.properties.label && addrInput) addrInput.value = feat.properties.name || feat.properties.label;
          if (feat.properties.city && cityInput) cityInput.value = feat.properties.city;
          if (window.game) window.game.showToast('Adresse Localisée', `Coordonnées GPS synchronisées : ${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`, 'green');
        } else {
          if (window.game) window.game.showToast('Adresse Introuvable', 'Conservez les coordonnées GPS manuelles ou ajustez l’adresse.', 'orange');
        }
      })
      .catch(() => {});
  },

  previewBadgeImageInModal() {
    const urlInput = document.getElementById('badge-input-image-url');
    const thumb = document.getElementById('badge-modal-preview-thumb');
    if (!thumb) return;

    const val = urlInput?.value.trim() || '';
    if (val.length > 5) {
      thumb.innerHTML = `<img src="${val}" alt="Écusson" class="w-full h-full object-cover" onerror="this.parentElement.textContent='Erreur';" />`;
    } else {
      thumb.textContent = 'Aperçu';
    }
  },

  updateIndemnisationPreviewInModal() {
    const volInput = document.getElementById('evt-input-volunteers');
    const durInput = document.getElementById('evt-input-duration');
    const vehInput = document.getElementById('evt-input-vehicles');
    const rewInput = document.getElementById('evt-input-reward');
    const breakdown = document.getElementById('evt-indemnisation-breakdown');

    const vol = parseInt(volInput?.value || '8', 10);
    const dur = parseInt(durInput?.value || '6', 10);
    const veh = (vehInput?.value || '1 VPSP').split(',');

    const calc = this.calculateEventIndemnisation(vol, dur, veh);
    if (breakdown) {
      breakdown.textContent = `${vol} sec. × ${dur}h (${calc.basePersonnel} €) + Moyens (${calc.totalMoyens} €) = ${calc.total} €`;
    }
    if (rewInput && (!rewInput.dataset.manuallyEdited || rewInput.dataset.manuallyEdited === 'false')) {
      rewInput.value = calc.total;
    }
  },

  updateRarityPreviewInModal() {
    const accessSelect = document.getElementById('badge-select-access-type');
    const unitsInput = document.getElementById('badge-input-units');
    const badgeEl = document.getElementById('evt-rarity-preview-badge');
    if (!badgeEl) return;

    const access = accessSelect?.value || 'evenement_special';
    const units = parseInt(unitsInput?.value || '4', 10);

    const rarity = this.calculateBadgeRarity(access, units);
    badgeEl.textContent = `Rareté : ${rarity.tier} (⭐ ${rarity.score}/100)`;
    badgeEl.className = `px-2.5 py-0.5 rounded-full text-[10px] font-black border ${rarity.color}`;
  },

  submitCommunityEvent(game) {
    const titleInput = document.getElementById('evt-input-title');
    const catSelect = document.getElementById('evt-select-category');
    const addrInput = document.getElementById('evt-input-address');
    const cityInput = document.getElementById('evt-input-city');
    const latInput = document.getElementById('evt-input-lat');
    const lngInput = document.getElementById('evt-input-lng');
    const pubInput = document.getElementById('evt-input-public');
    const volInput = document.getElementById('evt-input-volunteers');
    const durInput = document.getElementById('evt-input-duration');
    const rewInput = document.getElementById('evt-input-reward');
    const vehInput = document.getElementById('evt-input-vehicles');

    const title = titleInput?.value.trim() || 'Grand DPS Fédéral';
    let category = catSelect?.value || 'DPS Grande Envergure';
    if (category === 'custom') {
      const customVal = document.getElementById('evt-input-custom-category')?.value.trim();
      category = customVal || 'Événement Personnalisé';
    }

    const city = cityInput?.value.trim() || (game.stations?.[0]?.city || 'Paris');
    const address = addrInput?.value.trim() || `Place Centrale, ${city}`;
    const lat = parseFloat(latInput?.value || game.stations?.[0]?.lat || 48.8566);
    const lng = parseFloat(lngInput?.value || game.stations?.[0]?.lng || 2.3522);

    const pub = parseInt(pubInput?.value || '6000', 10);
    const reqVol = parseInt(volInput?.value || '8', 10);
    const durationHours = parseInt(durInput?.value || '6', 10);
    const vehText = vehInput?.value.trim() || '1 VPSP';

    const indemnisation = this.calculateEventIndemnisation(reqVol, durationHours, vehText);
    const rewardMoney = parseInt(rewInput?.value || indemnisation.total, 10);

    const badgeNameInput = document.getElementById('badge-input-name');
    const badgeUrlInput = document.getElementById('badge-input-image-url');

    // La rareté et les quotas d'unités sont déterminés par l'administration lors de la validation
    const badge = {
      id: `badge-${Date.now()}`,
      name: badgeNameInput?.value.trim() || `Écusson ${title}`,
      imageUrl: badgeUrlInput?.value.trim() || '',
      accessType: 'en_attente',
      availableUnits: null,
      icon: 'shield',
      colorTheme: 'purple',
      rarityScore: null,
      rarityTier: 'En attente de validation',
      rarityColor: 'bg-slate-100 text-slate-700 border-slate-300',
      desc: 'Rareté et modalité d’obtention fixées par l’administration lors de la validation.',
      eventName: title,
      obtainedAt: new Date().toLocaleDateString('fr-FR'),
      originalOrganizer: game.player?.name || 'Responsable d’antenne'
    };

    const newEvent = {
      id: `evt-comm-${Date.now()}`,
      organizerPlayerId: game.player?.id || 'directeur-local',
      organizerPlayerName: game.player?.name || 'Responsable d’antenne',
      organizerDiscord: game.player?.discord || (window.ProtecAuth?.currentUser?.discord) || null,
      stationName: game.stations?.[0]?.name || 'Antenne Locale',
      title: title,
      category: category,
      address: address,
      locationName: address.split(',')[0] || 'Lieu Central',
      city: city,
      lat: lat,
      lng: lng,
      departmentCode: game.stations?.[0]?.departmentCode || '75',
      eventDate: { day: (game.clock?.day || 1) + 2, month: (game.clock?.month || 0) + 1, year: game.clock?.year || 2026, hour: 14 },
      durationHours: durationHours,
      publicCount: pub,
      requiredVolunteers: reqVol,
      requiredVehicles: [vehText],
      rewardMoney: rewardMoney,
      indemnisationDetails: indemnisation,
      rewardReputation: 30,
      desc: `Dispositif d’envergure : ${category} à l'adresse « ${address} » (${city}). Affluence prévue de ${pub.toLocaleString('fr-FR')} personnes.`,
      badge: badge,
      registeredAntennas: [
        {
          playerId: game.player?.id || 'directeur-local',
          stationName: game.stations?.[0]?.name || 'Antenne Locale',
          volunteersCount: Math.min(4, reqVol)
        }
      ],
      status: 'pending_approval',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    game.communityEvents = game.communityEvents || [];
    game.communityEvents.unshift(newEvent);

    // API push
    fetch('/api/alliances/events/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    }).catch(() => {});

    const modal = document.getElementById('create-community-event-modal');
    if (modal) modal.classList.add('hidden');

    game.showToast('Proposition Soumise aux Administrateurs !', `« ${title} » a été soumis pour validation avec l'écusson proposé (${badge.name}).`, 'blue');
    game.save();
    game.openModule('alliance');
  },

  // Validation d'un événement par un Administrateur (supporte les modifications préalables)
  approveCommunityEvent(game, eventId, updatedData = null) {
    const event = (game.communityEvents || []).find(e => e.id === eventId);
    if (!event) return;

    if (updatedData) {
      Object.assign(event, updatedData);
    }

    event.status = 'open';
    event.approvedAt = new Date().toISOString();

    // Si le joueur local est l'organisateur, lui décerner l'écusson
    if (event.organizerPlayerId === (game.player?.id || 'directeur-local') && event.badge) {
      this.awardBadgeToPlayer(game, event.badge);
    }

    fetch('/api/admin/events/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('protec_auth_token') || ''}`,
        'x-admin-key': 'protec_admin_secret_2026'
      },
      body: JSON.stringify({ eventId, updatedData: event })
    }).catch(() => {});

    game.showToast('Événement Validé & Publié !', `« ${event.title} » est maintenant ouvert à toutes les antennes alliées avec son écusson (${event.badge?.rarityTier || 'Badge'}) !`, 'green');
    game.save();
    if (window.ProtecAdmin && window.ProtecAdmin.activeTab === 'events') {
      window.ProtecAdmin.renderEventsTable();
    } else {
      game.openModule('alliance');
    }
  },

  // Mise à jour complète d'un événement par l'administrateur
  updateCommunityEvent(game, eventId, updatedData) {
    const event = (game.communityEvents || []).find(e => e.id === eventId);
    if (event) {
      Object.assign(event, updatedData);
    }

    fetch('/api/admin/events/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('protec_auth_token') || ''}`,
        'x-admin-key': 'protec_admin_secret_2026'
      },
      body: JSON.stringify({ eventId, updatedData })
    }).catch(() => {});

    game.save();
  },

  // Rejet d'un événement par un Administrateur
  rejectCommunityEvent(game, eventId, reason) {
    const event = (game.communityEvents || []).find(e => e.id === eventId);
    if (!event) return;

    event.status = 'rejected';
    event.rejectionReason = reason || 'Non conforme aux critères opérationnels';

    fetch('/api/admin/events/reject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('protec_auth_token') || ''}`,
        'x-admin-key': 'protec_admin_secret_2026'
      },
      body: JSON.stringify({ eventId, reason: event.rejectionReason })
    }).catch(() => {});

    game.showToast('Événement Rejeté', `La proposition « ${event.title} » a été refusée (${event.rejectionReason}).`, 'red');
    game.save();
    if (window.ProtecAdmin && window.ProtecAdmin.activeTab === 'events') {
      window.ProtecAdmin.renderEventsTable();
    } else {
      game.openModule('alliance');
    }
  },

  // Inscription / Participation à un événement communautaire
  participateInCommunityEvent(game, eventId) {
    const event = (game.communityEvents || []).find(e => e.id === eventId);
    if (!event) return;

    const myPlayerId = game.player?.id || 'directeur-local';
    const isAlreadyRegistered = (event.registeredAntennas || []).some(a => a.playerId === myPlayerId);

    if (isAlreadyRegistered) {
      game.showToast('Déjà Inscrit', 'Votre antenne est déjà déployée sur ce dispositif.', 'blue');
      return;
    }

    event.registeredAntennas = event.registeredAntennas || [];
    event.registeredAntennas.push({
      playerId: myPlayerId,
      stationName: game.stations?.[0]?.name || 'Antenne Locale',
      volunteersCount: 2
    });

    // Remise de l'écusson exclusif de l'événement au joueur !
    if (event.badge) {
      this.awardBadgeToPlayer(game, event.badge);
    }

    game.resources.money += event.rewardMoney || 500;
    game.resources.reputationScore = Math.min(100, (game.resources.reputationScore || 50) + (event.rewardReputation || 20));

    fetch('/api/alliances/events/participate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, playerId: myPlayerId })
    }).catch(() => {});

    game.showToast('Équipe Déployée & Écusson Obtenu !', `Votre équipe est engagée sur « ${event.title} » ! L’écusson « ${event.badge?.name} » (${event.badge?.rarityTier || 'Commémoratif'}) a été ajouté à votre profil !`, 'green');
    game.save();
    game.updateStatsUI();
    game.openModule('alliance');
  },

  // Attribution d'un écusson à la collection
  awardBadgeToPlayer(game, badgeData) {
    game.badgesCollection = game.badgesCollection || [];
    const exists = game.badgesCollection.some(b => b.id === badgeData.id || b.name === badgeData.name);
    if (!exists) {
      game.badgesCollection.unshift({
        ...badgeData,
        id: badgeData.id || `badge-${Date.now()}`,
        obtainedAt: new Date().toLocaleDateString('fr-FR')
      });
    }

    // Synchronisation avec le nouveau module officiel ProtecEcussons
    if (window.ProtecEcussons) {
      const code = badgeData.code || 'renf_dps_ge';
      window.ProtecEcussons.attribuerEcusson(code, null, true);
    }
  },

  // Rendu de l'onglet Événements Communautaires dans le module Alliance
  isCommunityEventPast(e, game) {
    if (!e) return true;
    if (['finished', 'completed', 'past', 'closed', 'cloture', 'termine'].includes(e.status)) return true;
    const curClockMs = game?.clock ? new Date(game.clock.year, game.clock.month, game.clock.day, game.clock.hour || 0, game.clock.minute || 0).getTime() : Date.now();
    const eventDate = e.eventDate || e.date;
    if (eventDate) {
      if (typeof eventDate === 'object') {
        const y = eventDate.year || game?.clock?.year || 2026;
        let m = eventDate.month;
        if (m > 0 && m <= 12) m = m - 1;
        else m = m || 0;
        const d = eventDate.day || 1;
        const h = (eventDate.hour !== undefined) ? eventDate.hour : 8;
        const dur = e.durationHours || 8;
        const endMs = new Date(y, m, d, h + dur, 0, 0).getTime();
        return curClockMs > endMs;
      } else if (typeof eventDate === 'string') {
        const parsed = new Date(eventDate).getTime();
        if (!isNaN(parsed)) {
          const durMs = (e.durationHours || 8) * 3600 * 1000;
          return curClockMs > (parsed + durMs);
        }
      }
    }
    return false;
  },

  renderCommunityEventsTabHTML(game) {
    this.injectState(game);
    const allEvents = game.communityEvents || [];
    const myPlayerId = game.player?.id || 'directeur-local';
    const isAdmin = (game.player?.role === 'admin') || (localStorage.getItem('protec_admin_auth') === 'true');

    const openEvents = allEvents.filter(e => {
      if (this.isCommunityEventPast(e, game)) {
        if (e.status === 'open') e.status = 'finished';
        return false;
      }
      return e.status === 'open' || !e.status;
    });
    const myPendingEvents = allEvents.filter(e => e.organizerPlayerId === myPlayerId && e.status === 'pending_approval');
    const myRejectedEvents = allEvents.filter(e => e.organizerPlayerId === myPlayerId && e.status === 'rejected');

    return `
      <div class="space-y-4">
        <div class="p-4 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-pc-blue text-white flex items-center justify-between shadow-md">
          <div class="space-y-1">
            <h4 class="text-sm font-black flex items-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4 text-amber-300"></i>
              Grands Événements Communautaires & Écussons
            </h4>
            <p class="text-xs text-white/90">
              Dispositifs créés par les responsables d’antennes (joueurs) : soumis à validation des administrateurs puis ouverts aux alliés pour remporter des écussons commémoratifs uniques !
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.game.openModule('ecussons');" class="px-3.5 py-2 rounded-xl text-[11px] font-black bg-amber-400 hover:bg-amber-300 text-slate-900 transition flex items-center gap-1.5 cursor-pointer flex-shrink-0 shadow-sm" title="Ouvrir le tableau d'écussons et la bourse aux échanges">
              <span>📌</span>
              <span>Tableau d'Écussons & Troc</span>
            </button>
            ${isAdmin ? `
              <button onclick="window.ProtecAdmin.openAdminModal(window.game); window.ProtecAdmin.switchTab('events');" class="px-3 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-900 transition shadow-sm flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="shield" class="w-4 h-4"></i>
                Modération Admin
              </button>
            ` : ''}
            <button onclick="window.ProtecAuth.openAuthModal();" class="px-3.5 py-2 rounded-xl text-[11px] font-bold bg-white/20 hover:bg-white/30 text-white transition flex items-center gap-1.5 cursor-pointer flex-shrink-0" title="Les projets d'événements exceptionnels se déposent depuis votre Profil Joueur">
              <i data-lucide="user" class="w-3.5 h-3.5 text-amber-300"></i>
              Profil Joueur (Dossiers)
            </button>
          </div>
        </div>

        <!-- Section des événements soumis par le joueur en attente de validation admin -->
        ${myPendingEvents.length > 0 ? `
          <div class="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300/80 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                ⏳ Vos Propositions en Attente de Validation Administrative (${myPendingEvents.length})
              </span>
              <span class="text-[10px] text-amber-700 font-bold">Examen en cours par l'administration fédérale</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${myPendingEvents.map(e => {
                const b = e.badge || {};
                return `
                  <div class="p-3.5 rounded-xl bg-white border border-amber-200 shadow-2xs space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800">
                        ${e.category}
                      </span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/70 text-amber-900">
                        ⏳ En cours d'examen
                      </span>
                    </div>
                    <div>
                      <h5 class="text-xs font-black text-slate-900">${e.title}</h5>
                      <div class="text-[11px] text-slate-600 font-semibold flex items-center gap-1 mt-0.5">
                        <i data-lucide="map-pin" class="w-3 h-3 text-sky-600 flex-shrink-0"></i>
                        <span>Adresse : <strong class="text-slate-800">${e.address || (e.lat && e.lng ? `Point GPS: ${e.lat.toFixed(4)}, ${e.lng.toFixed(4)}` : `${e.locationName}, ${e.city}`)}</strong></span>
                      </div>
                      <p class="text-[10px] text-slate-500 mt-0.5">Affluence : ${Number(e.publicCount || 0).toLocaleString('fr-FR')} pers.</p>
                    </div>
                    ${b.name ? `
                      <div class="p-2 rounded-xl bg-purple-50/80 border border-purple-200 flex items-center gap-2 text-xs">
                        <div class="w-8 h-8 rounded-lg bg-purple-100 border border-purple-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                          ${b.imageUrl ? `<img src="${b.imageUrl}" alt="${b.name}" class="w-full h-full object-cover" onerror="this.parentElement.textContent='🏅';" />` : `<i data-lucide="award" class="w-4 h-4 text-purple-700"></i>`}
                        </div>
                        <div class="min-w-0 flex-1">
                          <span class="font-black text-purple-900 block truncate">${b.name}</span>
                          <span class="text-[10px] font-black text-purple-700">Rareté : ${b.rarityTier || 'Commémoratif'} ${b.availableUnits ? `• ${b.availableUnits} max` : ''}</span>
                        </div>
                      </div>
                    ` : ''}
                    <div class="text-[10px] text-slate-600 flex justify-between pt-1 border-t border-slate-100">
                      <span>Effectif : <strong>${e.requiredVolunteers} secouristes (${e.durationHours}h)</strong></span>
                      <span class="text-emerald-700 font-bold">Indemnisation : <strong>+${e.rewardMoney} €</strong></span>
                    </div>
                    ${isAdmin ? `
                      <div class="pt-2 flex gap-2">
                        <button onclick="window.ProtecMultiplayer.approveCommunityEvent(window.game, '${e.id}')" class="flex-1 py-1.5 rounded-lg text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white transition">
                          ✓ Valider maintenant (Admin)
                        </button>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Section des propositions refusées -->
        ${myRejectedEvents.length > 0 ? `
          <div class="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-2">
            <span class="font-black text-rose-950 block">❌ Propositions non retenues :</span>
            ${myRejectedEvents.map(e => `
              <div class="flex items-center justify-between text-[11px] text-rose-800">
                <span>« ${e.title} » — <em>${e.rejectionReason || 'Non conforme'}</em></span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Liste des Événements Officiels Ouverts -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${openEvents.length === 0 ? `
            <div class="col-span-2 p-8 rounded-2xl glass-card text-center text-slate-500 text-xs italic">
              Aucun événement validé pour le moment. Proposez le premier événement fédéral pour votre région !
            </div>
          ` : openEvents.map(e => {
            const isRegistered = (e.registeredAntennas || []).some(a => a.playerId === myPlayerId);
            const isOrganizer = e.organizerPlayerId === myPlayerId;
            const b = e.badge || {};

            return `
              <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3.5 border border-slate-200/90 shadow-xs hover:border-indigo-300 transition">
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase">
                      ${e.category}
                    </span>
                    <span class="text-xs font-black text-emerald-700 mono-num">+${e.rewardMoney} € indemnité</span>
                  </div>

                  <div>
                    <h5 class="text-sm font-black text-slate-900 leading-snug">${e.title}</h5>
                    <div class="text-[11px] text-slate-700 font-semibold flex items-center gap-1.5 mt-1">
                      <i data-lucide="map-pin" class="w-3.5 h-3.5 text-sky-600 flex-shrink-0"></i>
                      <span>Adresse : <strong class="text-slate-900">${e.address || (e.lat && e.lng ? `Point GPS: ${e.lat.toFixed(4)}, ${e.lng.toFixed(4)}` : `${e.locationName}, ${e.city}`)}</strong></span>
                    </div>
                    <p class="text-[10px] text-slate-500 mt-0.5">Affluence attendue : <strong class="text-slate-700">${(e.publicCount || 0).toLocaleString('fr-FR')} pers.</strong></p>
                  </div>

                  <div class="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 space-y-1">
                    <div class="flex justify-between">
                      <span>Effectif : <strong>${e.requiredVolunteers} secouristes</strong></span>
                      <span>Durée : <strong>${e.durationHours}h</strong></span>
                      <span class="text-emerald-700 font-bold">Taux : 15 €/h/sec.</span>
                    </div>
                    <div class="text-slate-500 truncate">Véhicules : <strong>${(window.game && typeof window.game.formatVehicleSummary === 'function' ? window.game.formatVehicleSummary(e.requiredVehicles || []) : (e.requiredVehicles || []).join(', '))}</strong></div>
                  </div>

                  <!-- Vitrine de l'Écusson à débloquer -->
                  ${b.name ? `
                    <div class="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center justify-between gap-2.5">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 to-indigo-900 text-white flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                          ${b.imageUrl ? `
                            <img src="${b.imageUrl}" alt="${b.name}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                            <div class="hidden w-full h-full items-center justify-center">
                              <i data-lucide="${b.icon || 'award'}" class="w-5 h-5"></i>
                            </div>
                          ` : `
                            <i data-lucide="${b.icon || 'award'}" class="w-5 h-5"></i>
                          `}
                        </div>
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-1.5">
                            <span class="text-xs font-black text-purple-950 truncate">${b.name}</span>
                            <span class="text-[9px] font-black px-1.5 py-0.2 rounded-full ${b.rarityColor || 'bg-purple-100 text-purple-800'}">${b.rarityTier}</span>
                          </div>
                          <span class="text-[10px] text-purple-700 font-semibold block">${b.availableUnits ? `${b.availableUnits} antenne(s) max` : (b.accessType === 'mission_ouverte' ? 'Mission Ouverte' : 'Événement Spécial')}</span>
                        </div>
                      </div>
                    </div>
                  ` : ''}

                  <div class="text-[10px] text-slate-400 font-semibold pt-1 flex justify-between items-center flex-wrap gap-1">
                    <span class="flex items-center gap-1.5 flex-wrap">
                      <span>Organisé par : <strong class="text-slate-700">${e.organizerPlayerName}</strong></span>
                      ${(e.organizerDiscord?.username || (isOrganizer && (game.player?.discord?.username || window.ProtecAuth?.currentUser?.discord?.username))) ? `
                        <span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20" title="Discord: @${(e.organizerDiscord?.username || game.player?.discord?.username || window.ProtecAuth?.currentUser?.discord?.username)}">
                          <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                          @${(e.organizerDiscord?.username || game.player?.discord?.username || window.ProtecAuth?.currentUser?.discord?.username)}
                        </span>
                      ` : ''}
                    </span>
                    <span>${(e.registeredAntennas || []).length} antenne(s) inscrite(s)</span>
                  </div>
                </div>

                <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span class="text-[10px] text-slate-400">Date : ${e.eventDate?.day}/${e.eventDate?.month}/${e.eventDate?.year || 2026} à ${e.eventDate?.hour || 14}h</span>
                  ${isOrganizer ? `
                    <span class="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600">Votre organisation</span>
                  ` : isRegistered ? `
                    <span class="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      ✓ Équipe Déployée & Écusson Obtenu
                    </span>
                  ` : `
                    <button onclick="window.ProtecMultiplayer.participateInCommunityEvent(window.game, '${e.id}')" class="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-700 hover:brightness-110 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer">
                      <i data-lucide="award" class="w-3.5 h-3.5"></i>
                      Déployer Équipe (+Écusson)
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // Modal pour Donner un Écusson à une antenne alliée
  openGiveBadgeModal(game, badgeId) {
    const badge = (game.badgesCollection || []).find(b => b.id === badgeId);
    if (!badge) return;

    const allies = (game.allianceStations || []).filter(st => st.playerId !== game.player?.id);

    let modal = document.getElementById('give-badge-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'give-badge-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-base font-black text-slate-900 leading-tight">Faire Don d'un Écusson</h3>
            <p class="text-xs text-slate-500 font-semibold">${badge.name} (${badge.rarityTier || 'Commémoratif'})</p>
          </div>
          <button onclick="document.getElementById('give-badge-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
        </div>

        <p class="text-xs text-slate-600">
          Transférez cet écusson de collection à un responsable d'antenne allié. Votre don solidaire renforce les liens et la coopération au sein de votre réseau !
        </p>

        <div class="space-y-2 text-xs">
          <label class="block font-bold text-slate-700">Sélectionnez l'antenne destinataire :</label>
          ${allies.length === 0 ? `
            <p class="text-amber-700 font-bold p-2.5 bg-amber-50 rounded-xl">Aucune antenne alliée connectée pour le moment.</p>
          ` : `
            <select id="select-give-badge-recipient" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 bg-slate-50">
              ${allies.map(a => `
                <option value="${a.id}">${a.name} (${a.playerName || 'Responsable d’antenne'})</option>
              `).join('')}
            </select>
          `}
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button onclick="document.getElementById('give-badge-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
            Annuler
          </button>
          ${allies.length > 0 ? `
            <button onclick="window.ProtecMultiplayer.confirmGiveBadge(window.game, '${badge.id}')" class="px-5 py-2 rounded-xl text-xs font-black bg-purple-700 hover:bg-purple-800 text-white shadow-md transition flex items-center gap-1.5">
              <i data-lucide="gift" class="w-3.5 h-3.5"></i>
              Confirmer le Don
            </button>
          ` : ''}
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  confirmGiveBadge(game, badgeId) {
    const select = document.getElementById('select-give-badge-recipient');
    const badge = (game.badgesCollection || []).find(b => b.id === badgeId);
    if (!select || !badge) return;

    const targetId = select.value;
    const targetStation = (game.allianceStations || []).find(s => s.id === targetId);

    // Retrait de notre collection
    game.badgesCollection = (game.badgesCollection || []).filter(b => b.id !== badgeId);

    // Récompenses de solidarité
    game.resources.reputationScore = Math.min(100, (game.resources.reputationScore || 50) + 15);
    game.resources.alliancePoints = (game.resources.alliancePoints || 0) + 25;

    fetch('/api/alliances/badges/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ badge, fromPlayerId: game.player?.id, toStationId: targetId })
    }).catch(() => {});

    const modal = document.getElementById('give-badge-modal');
    if (modal) modal.classList.add('hidden');

    game.showToast('Écusson Cédé avec Succès !', `Vous avez offert « ${badge.name} » à ${targetStation?.name || 'votre allié'} ! (+25 pts d’alliance)`, 'green');
    game.save();
    game.updateStatsUI();
    if (window.ProtecAuth) window.ProtecAuth.openAuthModal();
  },

  // Modal pour Proposer un Échange d'Écusson
  openTradeBadgeModal(game, badgeId) {
    const badge = (game.badgesCollection || []).find(b => b.id === badgeId);
    if (!badge) return;

    let modal = document.getElementById('trade-badge-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'trade-badge-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 bg-white border border-slate-200 text-slate-800">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-base font-black text-slate-900 leading-tight">Proposer un Échange d'Écusson</h3>
            <p class="text-xs text-slate-500 font-semibold">${badge.name} (${badge.rarityTier || 'Commémoratif'})</p>
          </div>
          <button onclick="document.getElementById('trade-badge-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
        </div>

        <p class="text-xs text-slate-600">
          Publiez une offre d’échange sur la Bourse de l’Alliance pour troquer cet écusson contre une pièce de collection équivalente.
        </p>

        <div class="space-y-2 text-xs">
          <label class="block font-bold text-slate-700">Écusson ou type recherché en contrepartie :</label>
          <input type="text" id="trade-badge-wanted" placeholder="Ex: Écusson NOVI, ou tout écusson de rareté équivalente" value="Tout écusson de rareté équivalente" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white" />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button onclick="document.getElementById('trade-badge-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
            Annuler
          </button>
          <button onclick="window.ProtecMultiplayer.confirmTradeBadge(window.game, '${badge.id}')" class="px-5 py-2 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md transition flex items-center gap-1.5">
            <i data-lucide="repeat" class="w-3.5 h-3.5"></i>
            Publier sur la Bourse
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  confirmTradeBadge(game, badgeId) {
    const badge = (game.badgesCollection || []).find(b => b.id === badgeId);
    const wantedInput = document.getElementById('trade-badge-wanted');
    if (!badge) return;

    const wanted = wantedInput?.value.trim() || 'Écusson équivalent';

    // Publication sur la bourse de l'alliance
    const offer = {
      id: `mkt-badge-${Date.now()}`,
      sellerPlayerId: game.player?.id || 'directeur-local',
      sellerPlayerName: game.player?.name || 'Responsable d’antenne',
      stationName: game.stations?.[0]?.name || 'Antenne Locale',
      category: 'materiel',
      title: `Écusson de Collection : ${badge.name}`,
      desc: `${badge.desc} (${badge.rarityTier || 'Commémoratif'})`,
      dealType: 'echange',
      price: 0,
      tradeWanted: wanted,
      badgeData: badge,
      createdAt: new Date().toLocaleDateString('fr-FR')
    };

    game.marketplace = game.marketplace || [];
    game.marketplace.unshift(offer);

    const modal = document.getElementById('trade-badge-modal');
    if (modal) modal.classList.add('hidden');

    game.showToast('Offre de Troc Publiée !', `Votre écusson « ${badge.name} » est proposé à l’échange sur la Bourse de l’Alliance.`, 'green');
    game.save();
    game.openModule('alliance');
  }
};

