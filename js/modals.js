/**
 * PROTEC LIVE - RENDU DES MODALES ET VUES DES 6 SYSTÈMES
 */

window.ProtecModals = {
  // --- MODAL RADIO & MAIN COURANTE ---
  renderRadio(game) {
    const logs = game.radioLogs || [];
    return `
      <div class="space-y-4">
        <!-- Bandeau Fréquence Radio Opérationnelle -->
        <div class="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-lg">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-mono font-bold text-sm">
              15.2
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-extrabold tracking-wide">CANAL OPÉRATIONNEL DÉPARTEMENTAL</span>
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p class="text-[11px] text-slate-400">Régulation SAMU 15 • CODIS Pompiers • PC Opérationnel Protection Civile</p>
            </div>
          </div>
          <button onclick="window.ProtecSystems.playRadioChirp()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-400 border border-slate-700 transition flex items-center gap-1.5" title="Tester le bip talkie-walkie">
            <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
            Bip Radio
          </button>
        </div>

        <!-- Légende des codes statuts -->
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px] font-bold">
          <div class="p-2 rounded-xl glass-card text-emerald-800 text-center">
            <strong class="block text-xs">Statut 1</strong> Dispo Antenne
          </div>
          <div class="p-2 rounded-xl glass-card text-sky-800 text-center">
            <strong class="block text-xs">Statut 2</strong> Départ / En route
          </div>
          <div class="p-2 rounded-xl glass-card text-amber-800 text-center">
            <strong class="block text-xs">Statut 3</strong> Sur les lieux
          </div>
          <div class="p-2 rounded-xl glass-card text-red-800 text-center">
            <strong class="block text-xs">Statut 4</strong> Transport CHU
          </div>
          <div class="p-2 rounded-xl glass-card text-purple-800 text-center">
            <strong class="block text-xs">Statut 5</strong> Arrivée Urgences
          </div>
          <div class="p-2 rounded-xl glass-card text-slate-700 text-center">
            <strong class="block text-xs">Statut 6</strong> Retour Antenne
          </div>
        </div>

        <!-- Journal chronologique des transmissions -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Main Courante (${logs.length} transmissions)</h4>
            <span class="text-[11px] text-slate-400">Horodatage temps simulé</span>
          </div>

          <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
            ${logs.length === 0 ? '<p class="text-xs text-slate-400 p-4 glass-card rounded-2xl text-center">Aucune transmission pour le moment. Déclenchez une mission pour initier le trafic radio.</p>' : ''}
            ${logs.map(item => {
              let badgeColor = 'bg-slate-200 text-slate-700';
              if (item.status === 1) badgeColor = 'status-badge-1';
              if (item.status === 2) badgeColor = 'status-badge-2';
              if (item.status === 3) badgeColor = 'status-badge-3';
              if (item.status === 4) badgeColor = 'status-badge-4';
              if (item.status === 5) badgeColor = 'status-badge-5';
              if (item.status === 6) badgeColor = 'status-badge-6';

              return `
                <div class="radio-log-item p-3 rounded-2xl glass-card flex items-start justify-between gap-3 text-xs">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-slate-400 text-[11px]">${item.time}</span>
                      <span class="font-extrabold text-pc-blue">${item.indicatif}</span>
                      <span class="px-2 py-0.2 rounded text-[10px] font-extrabold ${badgeColor}">S${item.status}</span>
                    </div>
                    <p class="text-slate-800 text-xs">${item.message}</p>
                  </div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase flex-shrink-0">Acquitté</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // --- MODAL LOGISTIQUE & PHARMACIE ---
  renderLogistique(game) {
    if (window.ProtecLogistique) {
      window.ProtecLogistique.renderModal(game);
      return '';
    }
    const s = game.logistics || { oxygenBottles: 0, aedPads: 0, woundKits: 0, cervicalCollars: 0 };
    return `
      <div class="space-y-6">
        <!-- Bannière Matériel Opérationnel, Lots de Crise & Conditions de Travail -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              📦
            </div>
            <div>
              <h4 class="text-sm font-black leading-tight">Matériel Opérationnel, Lots de Crise & Équipements</h4>
              <p class="text-xs text-blue-100 mt-0.5">Lots tronçonnage, pompage, éclairage, bâchage, hébergement, ravitaillement, soutien psycho et confort du personnel</p>
            </div>
          </div>
          <button onclick="window.game.openModule('equipements')" class="px-4 py-2 rounded-xl text-xs font-black bg-white text-indigo-700 hover:bg-blue-50 shadow-md transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
            <span>Lots & Matériel</span>
            <span>→</span>
          </button>
        </div>

        <!-- Section Pharmacie & Consommables -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Pharmacie & Consommables de Secours</h4>
              <p class="text-[11px] text-slate-500">Ces articles sont consommés automatiquement lors des interventions et bilans.</p>
            </div>
            <span class="text-xs font-bold text-slate-500">Trésorerie : <strong class="text-pc-blue font-mono">${game.resources.money.toLocaleString('fr-FR')} €</strong></span>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <!-- Oxygène médical -->
            <div class="p-3.5 rounded-2xl glass-card ${s.oxygenBottles <= 2 ? 'ring-2 ring-red-400' : ''} space-y-2 flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-slate-700">Oxygène Médical</span>
                  <span class="font-mono font-black text-sm ${s.oxygenBottles <= 2 ? 'text-red-600' : 'text-pc-blue'}">${s.oxygenBottles} B5</span>
                </div>
                <p class="text-[10px] text-slate-500 mt-1">Inhalations & insufflations d'urgence.</p>
              </div>
              <button onclick="window.ProtecSystems.restockSupply(window.game, 'oxygenBottles', 4, 180)" class="w-full py-1.5 rounded-xl text-[11px] font-extrabold bg-pc-blue text-white hover:bg-pc-blue-light shadow-sm transition">
                +4 Bouteilles (180 €)
              </button>
            </div>

            <!-- Patchs DAE -->
            <div class="p-3.5 rounded-2xl glass-card ${s.aedPads <= 2 ? 'ring-2 ring-red-400' : ''} space-y-2 flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-slate-700">Électrodes DAE</span>
                  <span class="font-mono font-black text-sm ${s.aedPads <= 2 ? 'text-red-600' : 'text-pc-blue'}">${s.aedPads} paires</span>
                </div>
                <p class="text-[10px] text-slate-500 mt-1">Défibrillation adulte & enfant.</p>
              </div>
              <button onclick="window.ProtecSystems.restockSupply(window.game, 'aedPads', 4, 150)" class="w-full py-1.5 rounded-xl text-[11px] font-extrabold bg-pc-blue text-white hover:bg-pc-blue-light shadow-sm transition">
                +4 Paires (150 €)
              </button>
            </div>

            <!-- Trousses Pansements & Soins -->
            <div class="p-3.5 rounded-2xl glass-card ${s.woundKits <= 3 ? 'ring-2 ring-red-400' : ''} space-y-2 flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-slate-700">Plaies & Bandages</span>
                  <span class="font-mono font-black text-sm ${s.woundKits <= 3 ? 'text-red-600' : 'text-pc-blue'}">${s.woundKits} trousses</span>
                </div>
                <p class="text-[10px] text-slate-500 mt-1">Compresses, bandes, pansements.</p>
              </div>
              <button onclick="window.ProtecSystems.restockSupply(window.game, 'woundKits', 6, 120)" class="w-full py-1.5 rounded-xl text-[11px] font-extrabold bg-pc-blue text-white hover:bg-pc-blue-light shadow-sm transition">
                +6 Trousses (120 €)
              </button>
            </div>

            <!-- Colliers cervicaux -->
            <div class="p-3.5 rounded-2xl glass-card space-y-2 flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-slate-700">Colliers Cervicaux</span>
                  <span class="font-mono font-black text-sm text-pc-blue">${s.cervicalCollars} unités</span>
                </div>
                <p class="text-[10px] text-slate-500 mt-1">Immobilisation rachis et trauma.</p>
              </div>
              <button onclick="window.ProtecSystems.restockSupply(window.game, 'cervicalCollars', 4, 90)" class="w-full py-1.5 rounded-xl text-[11px] font-extrabold bg-pc-blue text-white hover:bg-pc-blue-light shadow-sm transition">
                +4 Colliers (90 €)
              </button>
            </div>
          </div>
        </div>

        <!-- Section État de la Flotte & Garage -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-extrabold text-slate-800 uppercase tracking-wider">État Opérationnel des Véhicules (${game.vehicles.length})</h4>
            <span class="text-[11px] text-slate-500">Désinfection obligatoire après transport d'urgence</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${game.vehicles.length === 0 ? '<p class="text-xs text-slate-400 p-4 glass-card rounded-2xl text-center md:col-span-2">Aucun véhicule en dotation. Implantez une antenne et commandez un VPSP.</p>' : ''}
            ${game.vehicles.map(v => {
              const fuel = v.fuel !== undefined ? v.fuel : 90;
              const mech = v.mechanical !== undefined ? v.mechanical : 95;
              const needsDesinf = v.disinfectionNeeded === true;

              return `
                <div class="p-4 rounded-2xl glass-card space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-14 h-10 bg-slate-100 rounded-xl p-1 flex items-center justify-center flex-shrink-0 border border-slate-200/60 shadow-inner">
                        <img src="${v.image || (window.game?.getVehicleImage ? window.game.getVehicleImage(v.type) : `images/vehicles/${v.type}.png`)}" alt="${v.name}" class="max-h-full max-w-full object-contain drop-shadow-sm" onerror="this.outerHTML='<span class=\'text-xl\'>🚑</span>'" />
                      </div>
                      <div>
                        <h5 class="text-xs font-black text-slate-900 leading-tight">${v.name}</h5>
                        <span class="text-[10px] text-slate-500 font-medium">${v.label || v.type}</span>
                      </div>
                    </div>
                    <div class="flex flex-col items-end gap-1">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${v.isBrokenDown ? 'bg-red-600 text-white' : (v.needsRearming ? 'bg-amber-500 text-white' : (v.status === 'dispo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'))}">
                        ${v.isBrokenDown ? 'EN PANNE' : (v.needsRearming ? 'À Réarmer' : (v.status === 'dispo' ? 'Opérationnel' : 'En Mission'))}
                      </span>
                      ${v.quarterlyDisinfectionDone ? '<span class="text-[9px] font-bold text-teal-700">✓ Certifié ARS</span>' : ''}
                    </div>
                  </div>

                  <!-- Jauges -->
                  <div class="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div class="flex justify-between text-[11px] mb-1">
                        <span class="text-slate-500">Carburant</span>
                        <strong class="font-mono text-slate-700">${fuel}%</strong>
                      </div>
                      <div class="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                        <div class="bg-emerald-500 h-full rounded-full" style="width: ${fuel}%"></div>
                      </div>
                    </div>
                    <div>
                      <div class="flex justify-between text-[11px] mb-1">
                        <span class="text-slate-500">Santé mécanique</span>
                        <strong class="font-mono ${mech < 50 ? 'text-red-600' : 'text-slate-700'}">${mech}%</strong>
                      </div>
                      <div class="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                        <div class="${mech < 50 ? 'bg-red-500' : 'bg-pc-blue'} h-full rounded-full" style="width: ${mech}%"></div>
                      </div>
                    </div>
                  </div>

                  <!-- Actions garage complètes -->
                  <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100/80">
                    <!-- Réarmement matériel post-mission -->
                    <button onclick="window.ProtecSystems.serviceVehicle(window.game, '${v.id}', 'rearm')" class="py-1.5 rounded-xl text-[11px] font-bold ${v.needsRearming ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm' : 'glass-button text-slate-700'} transition">
                      ${v.needsRearming ? 'Réarmer Sacs (30 €)' : 'Réarmer (30 €)'}
                    </button>
                    <!-- Carburant -->
                    <button onclick="window.ProtecSystems.serviceVehicle(window.game, '${v.id}', 'fuel')" class="py-1.5 rounded-xl text-[11px] font-bold glass-button text-slate-700 transition">
                      Plein (75 €)
                    </button>
                    <!-- Désinfection Trimestrielle / Bionettoyage -->
                    <button onclick="window.ProtecSystems.serviceVehicle(window.game, '${v.id}', 'disinfection_trimestrielle')" class="py-1.5 rounded-xl text-[10px] font-bold glass-button text-teal-800 hover:bg-teal-50 transition" title="Désinfection approfondie trimestrielle agréée ARS">
                      Désinf. Trimestre (60 €)
                    </button>
                    <!-- Révision & Réparation panne -->
                    <button onclick="window.ProtecSystems.serviceVehicle(window.game, '${v.id}', 'mechanical')" class="py-1.5 rounded-xl text-[11px] font-bold ${v.isBrokenDown || mech < 60 ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm' : 'glass-button text-slate-700'} transition">
                      ${v.isBrokenDown ? 'Réparer Panne (280 €)' : 'Révision (280 €)'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // --- MODAL BULLETIN MÉTÉO & VIGILANCE PRÉFECTORALE ---
  renderMeteo(game) {
    const w = game.weather || { vigilance: 'green', temp: 18, alertTitle: 'Vigilance Verte - Conditions Nominales', alertDesc: 'Nominale' };
    let cardBg = 'bg-emerald-50 border-emerald-200 text-emerald-950';
    let badgeBg = 'bg-emerald-600 text-white';

    const vigLabels = {
      green: 'VERTE',
      yellow: 'JAUNE',
      orange: 'ORANGE',
      red: 'ROUGE'
    };
    const vigFr = vigLabels[w.vigilance] || (w.vigilance ? w.vigilance.toUpperCase() : 'VERTE');

    if (w.vigilance === 'yellow') { cardBg = 'bg-amber-50 border-amber-200 text-amber-950'; badgeBg = 'bg-amber-500 text-white'; }
    if (w.vigilance === 'orange') { cardBg = 'bg-orange-50 border-orange-200 text-orange-950'; badgeBg = 'bg-pc-orange text-white'; }
    if (w.vigilance === 'red') { cardBg = 'bg-red-50 border-red-200 text-red-950'; badgeBg = 'bg-red-600 text-white'; }

    const windText = `${Math.round(w.windGusts || w.windSpeed || 0)} km/h`;
    const rainText = `${(w.precipitation || 0).toFixed(1)} mm/h`;
    const humidityText = `${Math.round(w.humidity || 60)}%`;

    return `
      <div class="space-y-5">
        <!-- Carte Principale Bulletin Météo & Vigilance -->
        <div class="p-5 rounded-2xl border ${cardBg} shadow-sm space-y-3 glass-card">
          <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${badgeBg}">
              VIGILANCE ${vigFr}
            </span>
            <div class="flex items-center gap-2">
              <span class="text-sm font-extrabold font-mono">${Math.round(w.temp)}°C</span>
            </div>
          </div>
          <div>
            <h3 class="text-base font-black text-slate-900 mt-0.5">${w.alertTitle}</h3>
          </div>
          <p class="text-xs text-slate-700 leading-relaxed">${w.alertDesc}</p>
        </div>

        <!-- Données Météorologiques Précises de la Station -->
        <div class="grid grid-cols-3 gap-2.5 text-center">
          <div class="p-3 rounded-2xl glass-card space-y-1">
            <span class="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-center gap-1">
              <i data-lucide="wind" class="w-3 h-3 text-sky-500"></i> Rafales
            </span>
            <div class="text-sm font-black text-slate-800 mono-num">${windText}</div>
          </div>
          <div class="p-3 rounded-2xl glass-card space-y-1">
            <span class="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-center gap-1">
              <i data-lucide="cloud-rain" class="w-3 h-3 text-blue-500"></i> Précipitations
            </span>
            <div class="text-sm font-black text-slate-800 mono-num">${rainText}</div>
          </div>
          <div class="p-3 rounded-2xl glass-card space-y-1">
            <span class="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-center gap-1">
              <i data-lucide="droplets" class="w-3 h-3 text-teal-500"></i> Humidité
            </span>
            <div class="text-sm font-black text-slate-800 mono-num">${humidityText}</div>
          </div>
        </div>

        <!-- Consignes Opérationnelles Spécifiques selon les Aléas -->
        <div class="space-y-3 text-xs">
          <h4 class="font-extrabold text-slate-700 uppercase tracking-wider">Consignes Opérationnelles & Risques Préfectoraux</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="p-3.5 rounded-2xl glass-card space-y-1.5 border border-amber-200">
              <span class="font-extrabold text-amber-700 flex items-center gap-1.5">
                <i data-lucide="sun" class="w-4 h-4 text-amber-500"></i> Canicule & Coups de Chaleur
              </span>
              <p class="text-slate-600">Distribution d’eau minérale, maraudes fraîcheur d’urgence auprès des sans-abri, tentes climatisées.</p>
            </div>
            <div class="p-3.5 rounded-2xl glass-card space-y-1.5 border border-sky-200">
              <span class="font-extrabold text-sky-700 flex items-center gap-1.5">
                <i data-lucide="waves" class="w-4 h-4 text-sky-500"></i> Inondations & Crues (PCS)
              </span>
              <p class="text-slate-600">Activation du Plan Communal de Sauvegarde, ouverture de gymnases pour le Centre d'Accueil des Impliqués (CAI), pompage d’urgence.</p>
            </div>
            <div class="p-3.5 rounded-2xl glass-card space-y-1.5 border border-teal-200">
              <span class="font-extrabold text-teal-700 flex items-center gap-1.5">
                <i data-lucide="wind" class="w-4 h-4 text-teal-500"></i> Vents Violents & Chutes d'Arbres
              </span>
              <p class="text-slate-600">Balisage d’urgence des voies de circulation bloquées, renfort de protection contre les chutes de tuiles et branches.</p>
            </div>
            <div class="p-3.5 rounded-2xl glass-card space-y-1.5 border border-indigo-200">
              <span class="font-extrabold text-indigo-700 flex items-center gap-1.5">
                <i data-lucide="snowflake" class="w-4 h-4 text-indigo-500"></i> Neige, Verglas & Grand Froid
              </span>
              <p class="text-slate-600">Maraudes sociales nocturnes avec le 115, hébergement de crise, chaînes à neige obligatoires sur les véhicules.</p>
            </div>
          </div>
        </div>

        <!-- Statut officiel de la vigilance Météo-France & Préfecture -->
        ${w.vigilance !== 'green' ? `
          <div class="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center font-black text-lg">
                ⚠️
              </div>
              <div>
                <div class="text-xs font-black text-amber-950">Veille Préfectorale Active (${vigFr})</div>
                <div class="text-[11px] text-amber-800">Surveillance continue des données de terrain. En cas d'événement majeur (tempête, rafales, crue), la Préfecture place automatiquement les AASC en préalerte opérationnelle.</div>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-200 text-amber-900 uppercase tracking-wider whitespace-nowrap">
              Veille COGC
            </span>
          </div>
        ` : `
          <div class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <span class="font-bold flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Conditions météorologiques calmes sur le secteur. Aucune préalerte préfectorale en cours.
            </span>
            <span class="text-[10px] font-extrabold uppercase bg-emerald-100 px-2 py-0.5 rounded-lg text-emerald-900">Calme</span>
          </div>
        `}
      </div>
    `;
  },

  // --- MODAL FICHE BILAN SECOURISTE INTERACTIVE (SAMU 15) ---
  openFicheBilan(game, missionId, vehicleId) {
    const mission = game.missions.find(m => m.id === missionId);
    const vehicle = game.vehicles.find(v => v.id === vehicleId) || game.vehicles[0];
    if (!mission) return;

    const modal = document.getElementById('main-modal');
    modal.classList.remove('hidden');

    document.getElementById('modal-title').textContent = 'Fiche Bilan Secouriste - Régulation SAMU 15';
    document.getElementById('modal-subtitle').textContent = `Intervention « ${mission.title} » • Équipage ${vehicle?.name || 'VPSP'}`;
    document.getElementById('modal-icon').setAttribute('data-lucide', 'file-text');

    const pouls = 85 + Math.floor(Math.random() * 30);
    const ta = `${12 + Math.floor(Math.random() * 3)}/${7 + Math.floor(Math.random() * 2)}`;
    const spo2 = 94 + Math.floor(Math.random() * 5);
    const glasgow = 15;

    document.getElementById('modal-body').innerHTML = `
      <div class="space-y-5">
        <!-- En-tête Victime -->
        <div class="p-4 rounded-2xl glass-card grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span class="text-slate-400 block text-[10px] font-bold uppercase">Victime</span>
            <strong class="text-slate-800">Adulte (42 ans)</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px] font-bold uppercase">Motif d'intervention</span>
            <strong class="text-slate-800">Malaise sur voie publique</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px] font-bold uppercase">Lieu</span>
            <strong class="text-slate-800">${mission.title}</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px] font-bold uppercase">Équipage</span>
            <strong class="text-pc-blue font-bold">${vehicle?.name || 'VPSP 01'}</strong>
          </div>
        </div>

        <!-- Décision Opérationnelle avec la Régulation SAMU 15 -->
        <div class="p-5 rounded-2xl glass-card-orange space-y-3">
          <div class="flex items-center gap-2 text-pc-orange font-extrabold text-xs">
            <i data-lucide="phone-call" class="w-4 h-4"></i>
            DÉCISION DE LA RÉGULATION MÉDICALE (CENTRE 15)
          </div>
          <p class="text-xs text-slate-700">Choisissez l'orientation convenue avec la régulation hospitalière :</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <button onclick="window.ProtecModals.validateBilanDecision(window.game, '${mission.id}', '${vehicle?.id}', 'stay')" class="p-3.5 rounded-2xl glass-card text-left transition space-y-1 hover:brightness-105 cursor-pointer">
              <span class="font-extrabold text-xs text-emerald-700 block">✓ Laissé sur place après soins</span>
              <span class="text-[11px] text-slate-500 block">État stabilisé, avis médical favorable. Fin de mission et retour VPSP disponible.</span>
            </button>
            <button onclick="window.ProtecModals.validateBilanDecision(window.game, '${mission.id}', '${vehicle?.id}', 'evac')" class="p-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-pc-orange text-white hover:brightness-110 shadow-lg text-left transition space-y-1 cursor-pointer">
              <span class="font-extrabold text-xs block">🚨 Évacuation vers Hôpital / CHU de secteur (Statut 4)</span>
              <span class="text-[11px] text-white/90 block">Transport sanitaire sous gyrophare vers le service des urgences hospitalières de secteur.</span>
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  validateBilanDecision(game, missionId, vehicleId, decision) {
    const mission = game.missions.find(m => m.id === missionId);
    const vehicle = game.vehicles.find(v => v.id === vehicleId) || game.vehicles[0];
    game.closeModal();

    if (decision === 'stay') {
      window.ProtecSystems.consumeSupply(game, 'woundKits', 1);
      game.completeMission(mission);
      game.showToast('Bilan Clôturé', 'Victime prise en charge et laissée sur place après accord du SAMU 15.', 'green');
    } else if (decision === 'evac') {
      window.ProtecSystems.consumeSupply(game, 'oxygenBottles', 1);
      if (vehicle) vehicle.disinfectionNeeded = true;

      const nearestChu = window.ProtecSystems.getNearestHospital(game, mission.lat, mission.lng);
      const origin = { lat: mission.lat, lng: mission.lng };
      const dest = { lat: nearestChu.lat, lng: nearestChu.lng };

      window.ProtecSystems.startTransit(game, vehicle, origin, dest, mission, 4, () => {
        // Retour antenne après dépôt urgences
        const station = game.stations.find(s => s.id === vehicle.stationId) || game.stations[0];
        const returnOrigin = { lat: nearestChu.lat, lng: nearestChu.lng };
        const returnDest = { lat: station.lat, lng: station.lng };
        
        setTimeout(() => {
          window.ProtecSystems.startTransit(game, vehicle, returnOrigin, returnDest, mission, 6, () => {
            game.completeMission(mission);
          });
        }, 3000);
      });
    }
  }
};

// ============================================================================
// COMPOSANT UNIVERSEL BOTTOM SHEET (FLUIDITÉ TACTILE SMARTPHONES & TABLETTES)
// ============================================================================
window.ProtecBottomSheet = {
  activeSheet: null,
  touchStartY: 0,
  touchCurrentY: 0,

  // Ouverture fluide d'un volet coulissant depuis le bas
  open({ title, subtitle, icon, content, categorySubnav = null, size = 'default', onBack = null, isQuickDispatch = false }) {
    const modal = document.getElementById('main-modal');
    if (!modal) return;

    const modalBox = modal.querySelector('.glass-panel-heavy') || modal.firstElementChild;
    const titleEl = document.getElementById('modal-title');
    const subtitleEl = document.getElementById('modal-subtitle');
    const iconContainer = document.getElementById('modal-icon-container');
    const iconEl = document.getElementById('modal-icon');
    const bodyEl = document.getElementById('modal-body');
    const subnavEl = document.getElementById('modal-category-subnav');
    const backBtn = document.getElementById('modal-back-btn');

    // Assurer la présence de la poignée tactile (drag handle)
    let handle = modalBox.querySelector('.bottom-sheet-handle');
    if (!handle) {
      handle = document.createElement('div');
      handle.className = 'bottom-sheet-handle';
      modalBox.insertBefore(handle, modalBox.firstChild);
      this.attachTouchListeners(handle, modalBox);
    }

    // Mise à jour des textes et icônes
    if (titleEl) titleEl.textContent = title || '';
    if (subtitleEl) {
      if (subtitle) {
        subtitleEl.textContent = subtitle;
        subtitleEl.classList.remove('hidden');
      } else {
        subtitleEl.classList.add('hidden');
      }
    }
    if (iconEl && icon) {
      iconEl.setAttribute('data-lucide', icon);
    }

    // Gestion du bouton retour unifié (évite la superposition opaque)
    if (backBtn) {
      if (onBack) {
        backBtn.classList.remove('hidden');
        backBtn.onclick = onBack;
      } else {
        backBtn.classList.add('hidden');
      }
    }

    // Sous-navigation par onglets
    if (subnavEl) {
      if (categorySubnav) {
        subnavEl.innerHTML = categorySubnav;
        subnavEl.classList.remove('hidden');
      } else {
        subnavEl.innerHTML = '';
        subnavEl.classList.add('hidden');
      }
    }

    // Contenu
    if (bodyEl) {
      bodyEl.innerHTML = content || '';
      bodyEl.scrollTop = 0;
    }

    // Thème d'urgence Quick Dispatch vs Thème standard
    if (isQuickDispatch) {
      modalBox.classList.add('quick-dispatch-sheet');
    } else {
      modalBox.classList.remove('quick-dispatch-sheet');
    }

    // Affichage
    modal.classList.remove('hidden');
    modalBox.classList.remove('bottom-sheet-slide-down');
    modalBox.classList.add('bottom-sheet-slide-up');

    if (window.lucide) window.lucide.createIcons();
    this.activeSheet = { title, onBack };
  },

  // Fermeture douce avec animation vers le bas
  close() {
    const modal = document.getElementById('main-modal');
    if (!modal) return;
    const modalBox = modal.querySelector('.glass-panel-heavy') || modal.firstElementChild;
    if (modalBox) {
      modalBox.classList.remove('bottom-sheet-slide-up');
      modalBox.classList.add('bottom-sheet-slide-down');
      setTimeout(() => {
        modal.classList.add('hidden');
        modalBox.classList.remove('bottom-sheet-slide-down');
      }, 200);
    } else {
      modal.classList.add('hidden');
    }
    this.activeSheet = null;
  },

  // Écouteurs de gestes tactiles (swipe vers le bas pour fermer)
  attachTouchListeners(handle, modalBox) {
    if (!handle || handle._hasTouchListeners) return;
    handle._hasTouchListeners = true;

    handle.addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
      modalBox.style.transition = 'none';
    }, { passive: true });

    handle.addEventListener('touchmove', (e) => {
      this.touchCurrentY = e.touches[0].clientY;
      const deltaY = this.touchCurrentY - this.touchStartY;
      if (deltaY > 0) {
        modalBox.style.transform = `translateY(${deltaY}px)`;
      }
    }, { passive: true });

    handle.addEventListener('touchend', () => {
      const deltaY = this.touchCurrentY - this.touchStartY;
      modalBox.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      if (deltaY > 100) {
        this.close();
      } else {
        modalBox.style.transform = 'translateY(0)';
      }
      this.touchStartY = 0;
      this.touchCurrentY = 0;
    }, { passive: true });
  }
};

// ============================================================================
// PANNEAU D'ACTION RAPIDE (ACTION SHEET D'URGENCE & QUICK DISPATCH)
// ============================================================================
window.ProtecQuickDispatch = {
  open(game) {
    if (!game) game = window.game;
    const ongoingMissions = (game.missions || []).filter(m => m.status === 'ongoing');
    const pendingSamu = (game.missions || []).filter(m => m.type === 'samu' && m.status !== 'completed');
    const availableVehicles = (game.vehicles || []).filter(v => v.status === 'disponible');
    const availableVolunteers = (game.volunteers || []).filter(v => v.status === 'disponible' && (!v.isBurnout));
    const vpspList = (game.vehicles || []).filter(v => v.type === 'VPSP');
    const hasActiveSamuGarde = game.samuGarde?.active;

    const content = `
      <div class="space-y-6">
        <!-- Bandeau d'état d'alerte opérationnelle -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white shadow-xl flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-black animate-pulse">
              ⚡
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-base font-black tracking-wide">CENTRE D'ENGAGEMENT RAPIDE</h4>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/30 uppercase tracking-wider">Alerte Réflexe</span>
              </div>
              <p class="text-xs text-white/90">Mobilisation immédiate des vecteurs d'intervention et suivi des urgences sans changer de vue.</p>
            </div>
          </div>
          <div class="text-right hidden sm:block">
            <span class="text-[11px] font-bold text-white/80 block">Disponibilité Locale</span>
            <span class="text-sm font-black">${availableVolunteers.length} secouristes • ${availableVehicles.length} véhicules</span>
          </div>
        </div>

        <!-- 1. ACTIONS RÉFLEXES EN 1 CLIC -->
        <div class="space-y-2">
          <h5 class="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <i data-lucide="zap" class="w-4 h-4 text-orange-500"></i>
            Départs Réflexes & Prises de Garde
          </h5>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- Bouton Départ Réflexe VPSP -->
            <button onclick="window.ProtecQuickDispatch.dispatchEmergencyVpsp(window.game)" class="p-3.5 rounded-2xl quick-dispatch-btn-urgent text-white text-left flex flex-col justify-between space-y-2 shadow-lg group">
              <div class="flex items-center justify-between">
                <span class="text-2xl">🚑</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-black bg-black/30 uppercase">Départ 1-Clic</span>
              </div>
              <div>
                <h6 class="text-xs font-black">Départ Réflexe VPSP</h6>
                <p class="text-[10px] text-white/80 leading-tight">Arme le 1er VPSP dispo avec un équipage RNMSC complet.</p>
              </div>
            </button>

            <!-- Bouton Garde SAMU 15 -->
            <button onclick="window.ProtecQuickDispatch.toggleSamuGarde(window.game)" class="p-3.5 rounded-2xl ${hasActiveSamuGarde ? 'bg-sky-600 border-2 border-sky-400' : 'bg-slate-900 hover:bg-slate-800'} text-white text-left flex flex-col justify-between space-y-2 shadow-lg transition">
              <div class="flex items-center justify-between">
                <span class="text-2xl">📞</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-black ${hasActiveSamuGarde ? 'bg-emerald-500 text-white animate-pulse' : 'bg-white/20 text-white'} uppercase">
                  ${hasActiveSamuGarde ? 'Garde Active ✓' : 'Prise de Garde'}
                </span>
              </div>
              <div>
                <h6 class="text-xs font-black">Garde Conventionnée SAMU 15</h6>
                <p class="text-[10px] text-slate-300 leading-tight">${hasActiveSamuGarde ? 'Permanence en cours avec le CRRA 15.' : 'Active la permanence ambulance VPSP (indemnité horaire).'}</p>
              </div>
            </button>

            <!-- Réarmement Express -->
            <button onclick="window.ProtecQuickDispatch.refuelAndRestockAll(window.game)" class="p-3.5 rounded-2xl bg-indigo-900 hover:bg-indigo-800 text-white text-left flex flex-col justify-between space-y-2 shadow-lg transition">
              <div class="flex items-center justify-between">
                <span class="text-2xl">📦</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-700 uppercase">Logistique</span>
              </div>
              <div>
                <h6 class="text-xs font-black">Réarmement Express Flotte</h6>
                <p class="text-[10px] text-indigo-200 leading-tight">Ravitaille O2, pansements, brancards et carburant de tous les vecteurs.</p>
              </div>
            </button>
          </div>
        </div>

        <!-- 2. VECTEURS DISPONIBLES ET ÉQUIPAGES RNMSC -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <i data-lucide="truck" class="w-4 h-4 text-pc-blue"></i>
              Vecteurs d'Intervention Prêts (${availableVehicles.length} / ${game.vehicles?.length || 0})
            </h5>
            <span class="text-[11px] text-slate-400 font-semibold">Validation équipage RNMSC en direct</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
            ${(game.vehicles || []).map(veh => {
              const isDispo = veh.status === 'disponible';
              const isVpsp = veh.type === 'VPSP';
              const fuel = veh.fuel || 100;
              const hasCrew = veh.assignedCrew && veh.assignedCrew.length > 0;

              return `
                <div class="p-3 rounded-2xl glass-card flex items-center justify-between gap-3 border ${isDispo ? 'border-slate-200' : 'border-amber-200 bg-amber-50/30'}">
                  <div class="flex items-center gap-2.5">
                    <span class="text-2xl">${isVpsp ? '🚑' : (veh.type === 'VTU' ? '🚐' : '🚗')}</span>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-xs font-black text-slate-900">${veh.name}</span>
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-extrabold ${isDispo ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                          ${isDispo ? 'Dispo' : veh.status}
                        </span>
                      </div>
                      <div class="flex items-center gap-2 text-[10px] text-slate-500 font-semibold mt-0.5">
                        <span>⛽ ${fuel}%</span>
                        <span>•</span>
                        <span>${isVpsp ? 'Lot Sanitaire A' : 'Lot Logistique'}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5">
                    ${isDispo ? `
                      <button onclick="window.ProtecQuickDispatch.armAndDispatchVehicle(window.game, '${veh.id}')" class="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-pc-blue hover:bg-pc-blue-light text-white transition shadow-sm flex items-center gap-1">
                        <i data-lucide="send" class="w-3 h-3"></i>
                        <span>Armer</span>
                      </button>
                    ` : `
                      <span class="text-[10px] font-bold text-slate-400 uppercase">En mission</span>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 3. INTERVENTIONS ET DISPOSITIFS EN COURS -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <i data-lucide="radio" class="w-4 h-4 text-emerald-600"></i>
              Missions & Dispositifs en Cours (${ongoingMissions.length})
            </h5>
          </div>

          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            ${ongoingMissions.length === 0 ? `
              <div class="p-3 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
                Aucune mission en cours actuellement. Prêt pour un engagement d'urgence.
              </div>
            ` : ongoingMissions.map(m => {
              const crewCount = m.assignedCrew?.volunteers?.length || m.registeredVolunteers?.length || 0;
              const vehCount = m.assignedCrew?.vehicles?.length || 0;
              return `
                <div class="p-3 rounded-2xl glass-card flex items-center justify-between text-xs">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-extrabold text-slate-900">${m.title}</span>
                      <span class="px-2 py-0.2 rounded text-[10px] font-bold bg-sky-100 text-sky-800 uppercase">${m.type}</span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-0.5">Engagés : ${crewCount} secouristes • ${vehCount} véhicules</p>
                  </div>
                  <button onclick="window.game.openMissionDetails('${m.id}')" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
                    Détails →
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    window.ProtecBottomSheet.open({
      title: "Panneau d'Action Rapide & Départs Urgence",
      subtitle: "Centre d'engagement réflexe et armement instantané des vecteurs de secours",
      icon: 'siren',
      content: content,
      isQuickDispatch: true
    });
  },

  // Départ réflexe VPSP en 1 clic avec composition conforme RNMSC
  dispatchEmergencyVpsp(game) {
    if (!game) game = window.game;
    const vpsp = (game.vehicles || []).find(v => v.type === 'VPSP' && v.status === 'disponible');
    if (!vpsp) {
      game.showToast('Aucun VPSP Disponible', 'Toutes les ambulances sont actuellement engagées ou indisponibles.', 'orange');
      return;
    }

    // Trouver 4 secouristes conformes RNMSC : 1 CE, 1 Conducteur, 1 PSE2, 1 PSE1 (tous à jour)
    const dispo = (game.volunteers || []).filter(v => v.status === 'disponible' && !v.isBurnout && v.energy >= 25);
    
    // Vérifier les compétences à jour
    const hasValidCert = (vol, skill) => {
      const isUpToDate = !vol.qualificationExpired;
      return vol.skills?.includes(skill.toLowerCase()) && isUpToDate;
    };

    const ce = dispo.find(v => ['CE', 'CD', 'Cadre'].includes(v.rank) || hasValidCert(v, 'ce'));
    const driver = dispo.find(v => v.id !== ce?.id && (v.isDriver || v.skills?.includes('conducteur') || v.skills?.includes('permis_b')));
    const pse2 = dispo.find(v => v.id !== ce?.id && v.id !== driver?.id && (v.rank === 'PSE2' || hasValidCert(v, 'pse2')));
    const pse1 = dispo.find(v => v.id !== ce?.id && v.id !== driver?.id && v.id !== pse2?.id);

    if (!ce || !driver || !pse2 || !pse1) {
      game.showToast('Équipage Incomplet RNMSC', 'Impossible de lancer un VPSP : il manque au moins 1 Chef d’équipe, 1 Conducteur, 1 PSE2 ou 1 PSE1 qualifié et disponible.', 'orange');
      return;
    }

    const crew = [ce, driver, pse2, pse1];
    crew.forEach(v => { v.status = 'mission'; });
    vpsp.status = 'mission';

    // Créer une mission réflexe d'urgence si aucune mission SAMU en attente
    let targetMission = (game.missions || []).find(m => m.type === 'samu' && m.status === 'planifie');
    if (!targetMission) {
      targetMission = {
        id: `urg-${Date.now()}`,
        type: 'samu',
        title: 'Départ Réflexe SAMU 15 - Urgence Préfectorale',
        scale: 'DPS-PE',
        requiredVolunteers: 4,
        status: 'ongoing',
        startedAt: Date.now(),
        durationSeconds: 25 * 60,
        endsAt: Date.now() + (25 * 60 * 1000),
        lat: game.stations[0]?.lat ? game.stations[0].lat + (Math.random() - 0.5) * 0.04 : 48.8566,
        lng: game.stations[0]?.lng ? game.stations[0].lng + (Math.random() - 0.5) * 0.04 : 2.3522,
        assignedCrew: {
          volunteers: crew,
          vehicles: [vpsp]
        }
      };
      game.missions.unshift(targetMission);
    } else {
      targetMission.status = 'ongoing';
      targetMission.startedAt = Date.now();
      targetMission.endsAt = Date.now() + 1500000;
      targetMission.assignedCrew = { volunteers: crew, vehicles: [vpsp] };
    }

    window.ProtecBottomSheet.close();
    game.showToast('🚑 Départ VPSP Immédiat', `L’équipage complet (${ce.name}, ${driver.name}, ${pse2.name}, ${pse1.name}) décolle avec ${vpsp.name} !`, 'blue');
    game.saveGame();
    game.updateStatsUI();
  },

  // Bascule de la garde SAMU 15
  toggleSamuGarde(game) {
    if (!game) game = window.game;
    if (!game.samuGarde) game.samuGarde = { active: false };
    game.samuGarde.active = !game.samuGarde.active;
    game.showToast(
      game.samuGarde.active ? 'Garde SAMU 15 Activée' : 'Fin de Garde SAMU',
      game.samuGarde.active ? 'L’antenne est maintenant en astreinte active pour le SAMU 15.' : 'Astreinte SAMU 15 clôturée.',
      game.samuGarde.active ? 'green' : 'slate'
    );
    game.saveGame();
    this.open(game);
  },

  // Réarmement complet de toute la flotte en 1 clic
  refuelAndRestockAll(game) {
    if (!game) game = window.game;
    const cost = 240;
    if (game.resources.money < cost) {
      game.showToast('Fonds Insuffisants', `Il vous faut ${cost} € pour réapprovisionner l'intégralité de la flotte.`, 'orange');
      return;
    }
    game.resources.money -= cost;
    (game.vehicles || []).forEach(v => {
      v.fuel = 100;
      v.disinfectionNeeded = false;
    });
    if (!game.logistics) game.logistics = {};
    game.logistics.oxygenBottles = Math.min(20, (game.logistics.oxygenBottles || 5) + 6);
    game.logistics.woundKits = Math.min(30, (game.logistics.woundKits || 10) + 10);
    game.showToast('Flotte Entièrement Réarmée', `Tous les véhicules sont pleins (carburant 100%, O2 réarmé, désinfection faite). -${cost} €`, 'green');
    game.saveGame();
    this.open(game);
  },

  // Armement rapide d'un véhicule spécifique
  armAndDispatchVehicle(game, vehicleId) {
    if (!game) game = window.game;
    const veh = (game.vehicles || []).find(v => v.id === vehicleId);
    if (!veh) return;
    if (veh.type === 'VPSP') {
      this.dispatchEmergencyVpsp(game);
    } else {
      game.showToast('Vecteur Armé', `${veh.name} est assigné et prêt au départ.`, 'blue');
    }
  }
};

