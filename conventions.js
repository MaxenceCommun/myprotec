/**
 * PROTEC LIVE - MODULE CONVENTIONS OPÉRATIONNELLES ET PARTENARIATS OFFICIELS
 * Onglet à part entière dédié aux conventions de l'antenne :
 * 1. CUMP (SAMU 15)
 * 2. SDIS (Sapeurs-Pompiers)
 * 3. SNCF (Naufragés du Rail)
 * 4. Plan Communal de Sauvegarde (PCS & Mairies)
 */

window.ProtecConventions = {
  renderModal(game) {
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');
    const prevScroll = body ? body.scrollTop : 0;

    modal.classList.remove('hidden');
    title.textContent = 'Conventions Opérationnelles & Partenariats Officiels';
    subtitle.textContent = 'Accords-cadres avec les services de l\'État, SAMU, SDIS, SNCF et collectivités territoriales';
    icon.setAttribute('data-lucide', 'file-text');

    const cump = game.cumpConvention || {};
    const sdis = game.sdisGarde || {};

    // Initialisation des scores de réputation institutionnels et communaux
    game.reputation_samu = game.reputation_samu !== undefined ? game.reputation_samu : 50;
    game.reputation_sdis = game.reputation_sdis !== undefined ? game.reputation_sdis : 50;
    game.reputation_prefecture = game.reputation_prefecture !== undefined ? game.reputation_prefecture : 50;
    game.reputation_villes = game.reputation_villes || {};

    // S'assurer qu'au moins la ville de la caserne principale est initialisée
    const baseCity = game.stations?.[0]?.city || 'Nancy';
    if (game.reputation_villes[baseCity] === undefined) {
      game.reputation_villes[baseCity] = 55;
    }

    body.innerHTML = `
      <div class="space-y-6">

        <!-- En-tête informatif -->
        <div class="p-4 rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-pc-blue text-white shadow-xl flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl">
              📜
            </div>
            <div>
              <h4 class="text-base font-black">Conventions Opérationnelles & Partenariats Officiels</h4>
              <p class="text-xs text-white/80">Accords-cadres avec les services de l'État, SAMU, SDIS, SNCF et collectivités territoriales</p>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Cadre Réglementaire
          </span>
        </div>

        <!-- 3. TABLEAU DE BORD : RELATIONS INSTITUTIONNELLES & RÉPUTATION PAR COMMUNE -->
        <div class="p-5 rounded-3xl glass-card border border-indigo-200/70 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-lg">🏛️</span>
              <div>
                <h4 class="text-xs font-black text-indigo-950 uppercase tracking-wider">Relations Institutionnelles & Ancrage Communal</h4>
                <p class="text-[11px] text-slate-500">Confiance des services de secours de l'État et des Mairies du département</p>
              </div>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
              RNMSC & Agrément Sécurité Civile
            </span>
          </div>

          <!-- Jauges Institutionnelles Globales (SAMU, SDIS, Préfecture) -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- SAMU 15 -->
            ${(() => {
              const r = game.reputation_samu !== undefined ? game.reputation_samu : 50;
              const emoji = r >= 70 ? '😊' : (r >= 45 ? '🙂' : (r >= 30 ? '😐' : '😟'));
              const label = r >= 70 ? 'Très favorable' : (r >= 45 ? 'Favorable' : (r >= 30 ? 'Neutre' : 'Tendue'));
              const color = r >= 70 ? 'bg-emerald-500' : (r >= 45 ? 'bg-sky-500' : (r >= 30 ? 'bg-amber-500' : 'bg-rose-500'));
              const textCol = r >= 70 ? 'text-emerald-700' : (r >= 45 ? 'text-sky-700' : (r >= 30 ? 'text-amber-700' : 'text-rose-700'));
              return `
                <div class="p-3 rounded-2xl bg-white/80 border border-slate-200/80 space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>🚑</span> SAMU 15
                    </span>
                    <span class="flex items-center gap-1 font-bold ${textCol}">
                      <span class="text-sm">${emoji}</span>
                      <span>${label}</span>
                    </span>
                  </div>
                  <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div class="h-full rounded-full ${color} transition-all duration-500" style="width: ${Math.min(100, Math.max(5, r))}%"></div>
                  </div>
                  <p class="text-[10px] text-slate-500 leading-tight">
                    ${r >= 65 ? '✓ Renforts d’urgence & gardes VPSP débloquées avec indemnités conventionnées.' : 'Relation de régulation active pour les départs réflexes et transferts sanitaires.'}
                  </p>
                </div>
              `;
            })()}

            <!-- SDIS 18 -->
            ${(() => {
              const r = game.reputation_sdis !== undefined ? game.reputation_sdis : 50;
              const emoji = r >= 70 ? '😊' : (r >= 45 ? '🙂' : (r >= 30 ? '😐' : '😟'));
              const label = r >= 70 ? 'Très favorable' : (r >= 45 ? 'Favorable' : (r >= 30 ? 'Neutre' : 'Tendue'));
              const color = r >= 70 ? 'bg-emerald-500' : (r >= 45 ? 'bg-sky-500' : (r >= 30 ? 'bg-amber-500' : 'bg-rose-500'));
              const textCol = r >= 70 ? 'text-emerald-700' : (r >= 45 ? 'text-sky-700' : (r >= 30 ? 'text-amber-700' : 'text-rose-700'));
              return `
                <div class="p-3 rounded-2xl bg-white/80 border border-slate-200/80 space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>🚒</span> SDIS 18
                    </span>
                    <span class="flex items-center gap-1 font-bold ${textCol}">
                      <span class="text-sm">${emoji}</span>
                      <span>${label}</span>
                    </span>
                  </div>
                  <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div class="h-full rounded-full ${color} transition-all duration-500" style="width: ${Math.min(100, Math.max(5, r))}%"></div>
                  </div>
                  <p class="text-[10px] text-slate-500 leading-tight">
                    ${r >= 60 ? '✓ Conventions casernes actives : prêt de vecteurs et formations conjointes.' : 'Coordination CTA-CODIS active pour les gardes et soutiens feux de forêt.'}
                  </p>
                </div>
              `;
            })()}

            <!-- Préfecture -->
            ${(() => {
              const r = game.reputation_prefecture !== undefined ? game.reputation_prefecture : 50;
              const emoji = r >= 70 ? '😊' : (r >= 45 ? '🙂' : (r >= 30 ? '😐' : '😟'));
              const label = r >= 70 ? 'Très favorable' : (r >= 45 ? 'Favorable' : (r >= 30 ? 'Neutre' : 'Tendue'));
              const color = r >= 70 ? 'bg-emerald-500' : (r >= 45 ? 'bg-sky-500' : (r >= 30 ? 'bg-amber-500' : 'bg-rose-500'));
              const textCol = r >= 70 ? 'text-emerald-700' : (r >= 45 ? 'text-sky-700' : (r >= 30 ? 'text-amber-700' : 'text-rose-700'));
              return `
                <div class="p-3 rounded-2xl bg-white/80 border border-slate-200/80 space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>🏛️</span> Préfecture (COD)
                    </span>
                    <span class="flex items-center gap-1 font-bold ${textCol}">
                      <span class="text-sm">${emoji}</span>
                      <span>${label}</span>
                    </span>
                  </div>
                  <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div class="h-full rounded-full ${color} transition-all duration-500" style="width: ${Math.min(100, Math.max(5, r))}%"></div>
                  </div>
                  <p class="text-[10px] text-slate-500 leading-tight">
                    ${r < 40 ? '⚠️ Vigilance : risque de refus administratifs de dossiers DPS.' : 'Commissions de sécurité bienveillantes et accès aux réquisitions prioritaires.'}
                  </p>
                </div>
              `;
            })()}
          </div>

          <!-- Réputation individualisée par Mairie / Commune partenaire avec jauge et emoji -->
          <div class="pt-3 border-t border-slate-100 space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Communes conventionnées & Mairies partenaires</span>
              <span class="text-[10px] text-slate-400">Impact direct sur les subventions annuelles et budgets organisateurs</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              ${Object.keys(game.reputation_villes || {}).map(cityName => {
                const repScore = game.reputation_villes[cityName] !== undefined ? game.reputation_villes[cityName] : 50;
                const isStationCity = cityName.toLowerCase() === (baseCity || '').toLowerCase();
                const emoji = repScore >= 65 ? '😊' : (repScore >= 40 ? '🙂' : (repScore >= 25 ? '😐' : '😟'));
                const label = repScore >= 65 ? 'Très favorable' : (repScore >= 40 ? 'Favorable' : (repScore >= 25 ? 'Neutre' : 'Tendue'));
                const color = repScore >= 65 ? 'bg-emerald-500' : (repScore >= 40 ? 'bg-sky-500' : (repScore >= 25 ? 'bg-amber-500' : 'bg-rose-500'));
                const textCol = repScore >= 65 ? 'text-emerald-700' : (repScore >= 40 ? 'text-sky-700' : (repScore >= 25 ? 'text-amber-700' : 'text-rose-700'));
                let badgeHTML = '';

                if (repScore >= 65) {
                  badgeHTML = '<span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">Partenaire Privilégié</span>';
                } else if (repScore < 25) {
                  badgeHTML = '<span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-100 text-red-800 animate-pulse">Risque Concurrence</span>';
                } else {
                  badgeHTML = '<span class="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">Standard</span>';
                }

                return `
                  <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5 ${isStationCity ? 'ring-1 ring-pc-blue/30 bg-blue-50/20' : ''}">
                    <div class="flex items-center justify-between">
                      <strong class="font-bold text-slate-800 truncate max-w-[130px]">${cityName}${isStationCity ? ' 📍' : ''}</strong>
                      <span class="flex items-center gap-1 font-bold ${textCol}">
                        <span class="text-sm">${emoji}</span>
                        <span>${label}</span>
                      </span>
                    </div>
                    <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div class="h-full rounded-full ${color} transition-all duration-500" style="width: ${Math.min(100, Math.max(5, repScore))}%"></div>
                    </div>
                    <div class="flex items-center justify-between text-[10px]">
                      ${badgeHTML}
                      <span class="text-slate-400">${repScore >= 65 ? 'Budgets bonifiés' : (repScore < 25 ? 'Vigilance mairie' : 'Normal')}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
<!-- CONVENTION CADRE D'AASC (FONDATRICE & PRÉFECTURE) -->
        <div class="p-5 rounded-3xl glass-card border-2 ${game.aascConvention?.signed ? 'border-emerald-400 bg-emerald-50/40' : 'border-amber-400 bg-amber-50/40 shadow-lg ring-2 ring-amber-300/30'} space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-900 text-white tracking-wider flex items-center gap-1">
                <span>🏛️</span> MINISTÈRE DE L'INTÉRIEUR • PRÉFECTURE
              </span>
              <span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${game.aascConvention?.signed ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white animate-pulse'}">
                ${game.aascConvention?.signed ? 'Convention AASC Active ✓' : 'Obligatoire pour Opérer (Non Signée)'}
              </span>
            </div>
            <div class="text-xs font-black text-slate-800">
              ${game.aascConvention?.signed ? '<span class="text-emerald-700 font-bold">Agrément de Sécurité Civile délivré</span>' : '<span class="text-amber-800 font-bold">Frais de dossier : 800 €</span>'}
            </div>
          </div>

          <div class="space-y-1">
            <h4 class="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <span>📜</span> Convention Préfectorale d'AASC (Agrément de Sécurité Civile)
            </h4>
            <p class="text-xs text-slate-600 leading-relaxed">
              Base légale absolue pour commencer le jeu. Cette convention cadre délivrée par l'autorité préfectorale attribue les <strong>Agréments Nationaux de Sécurité Civile</strong> (Missions A, B, C et D). Sans cette convention, aucun bénévole ne peut être légalement engagé en mission opérationnelle ni sur un poste de secours (DPS).
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-semibold text-slate-700">
            <div class="p-2.5 rounded-xl bg-white/80 border border-slate-200">
              <span class="text-[10px] text-slate-500 block uppercase">Missions autorisées</span>
              <span class="font-bold text-slate-900">DPS, SAMU 15, SDIS & Réquisitions</span>
            </div>
            <div class="p-2.5 rounded-xl bg-white/80 border border-slate-200">
              <span class="text-[10px] text-slate-500 block uppercase">Autorité de Tutelle</span>
              <span class="font-bold text-slate-900">Préfecture & État-Major COZ</span>
            </div>
            <div class="p-2.5 rounded-xl bg-white/80 border border-slate-200">
              <span class="text-[10px] text-slate-500 block uppercase">Statut Légal</span>
              <span class="font-bold ${game.aascConvention?.signed ? 'text-emerald-700' : 'text-amber-700'}">${game.aascConvention?.signed ? 'Habilité Sécurité Civile' : 'En attente de souscription'}</span>
            </div>
          </div>

          <div class="pt-1 flex items-center justify-between">
            ${game.aascConvention?.signed ? `
              <div class="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Convention signée avec la Préfecture • Agréments A, B, C et D en vigueur.</span>
              </div>
            ` : `
              <button onclick="window.game.signAascConvention()" class="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-pc-blue to-pc-blue-light hover:brightness-110 active:scale-95 text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer animate-pulse">
                <span>✍️</span>
                <span>Acheter & Signer la Convention d’AASC (800 €)</span>
              </button>
            `}
          </div>
        </div>

        <!-- Grille des autres conventions partenariales -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <!-- 1. CONVENTION CADRE SAMU 15 (GARDES RÉFLEXES VPSP) -->
          <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3 border ${game.samuConvention?.signed ? 'border-sky-300 ring-1 ring-sky-300/30' : 'border-slate-200'}">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-sky-100 text-sky-900 border border-sky-200">
                  SAMU 15 • Urgences VPSP
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  game.samuConvention?.signed 
                    ? 'bg-emerald-600 text-white' 
                    : (game.samuConvention?.requestStatus === 'instruction' 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' 
                        : (game.samuConvention?.requestStatus === 'accepted' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : (game.samuConvention?.requestStatus === 'rejected' 
                                ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                                : 'bg-slate-100 text-slate-700')))
                }">
                  ${
                    game.samuConvention?.signed 
                      ? 'Convention Signée ✓' 
                      : (game.samuConvention?.requestStatus === 'instruction' 
                          ? 'Instruction en cours ⏳' 
                          : (game.samuConvention?.requestStatus === 'accepted' 
                              ? 'Demande Acceptée ✓' 
                              : (game.samuConvention?.requestStatus === 'rejected' 
                                  ? 'Demande Ajournée ✗' 
                                  : 'Non Conventionnée')))
                  }
                </span>
              </div>

              <div>
                <h5 class="text-xs font-black text-slate-900">Convention Cadre SAMU 15 (Permanence & Gardes VPSP)</h5>
                <p class="text-[11px] text-slate-600 mt-1">Mise à disposition conventionnée d'une ambulance VPSP armée pour départs réflexes et interventions d'urgence sous régulation médicale 15.</p>
              </div>

              <div class="p-2.5 rounded-xl bg-slate-50 text-[10px] space-y-1 font-semibold text-slate-700">
                <div class="flex justify-between">
                  <span>Indemnisation SAMU :</span>
                  <span class="text-emerald-700 font-bold">280 à 480 € / intervention</span>
                </div>
                <div class="flex justify-between">
                  <span>Dotation de signature :</span>
                  <span class="text-emerald-700 font-bold">+350 €</span>
                </div>
                <div class="flex justify-between">
                  <span>Cadre d'intervention :</span>
                  <span>Missions de secours d'urgence & départs réflexes sous régulation médicale 15</span>
                </div>
              </div>

              ${game.samuConvention?.requestStatus === 'rejected' && game.samuConvention?.rejectReason ? `
                <div class="p-2 rounded-xl bg-rose-50 border border-rose-200 text-[10px] text-rose-800 space-y-0.5">
                  <div class="font-bold flex items-center gap-1">
                    <span>⚠️ Motif de refus de la commission médicale :</span>
                  </div>
                  <div>${game.samuConvention.rejectReason}</div>
                </div>
              ` : ''}

              ${game.samuConvention?.requestStatus === 'instruction' ? `
                <div class="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800 space-y-1">
                  <div class="font-bold flex items-center justify-between">
                    <span>Dossier en cours d'instruction par le SAMU 15</span>
                    <span>${Math.max(1, Math.ceil((game.samuConvention.reviewTimer || 0) / 60))} min</span>
                  </div>
                  <div class="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-amber-600 h-full rounded-full transition-all duration-300" style="width: ${Math.min(100, Math.max(5, 100 - (((game.samuConvention.reviewTimer || 1) / (game.samuConvention.initialTimer || 120)) * 100)))}%"></div>
                  </div>
                  <div class="text-[9px] text-amber-700 italic">La direction du SAMU examine le sérieux et l'implantation de votre antenne...</div>
                </div>
              ` : ''}
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              ${game.samuConvention?.signed ? `
                <button onclick="window.game.openModule('samu')" class="px-3.5 py-1.5 rounded-xl bg-pc-blue hover:brightness-110 text-white font-extrabold text-xs shadow-sm transition">
                  Gérer la Garde SAMU 15
                </button>
                <button onclick="window.game.terminateSamuConvention()" class="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition border border-rose-200">
                  Résilier
                </button>
              ` : game.samuConvention?.requestStatus === 'instruction' ? `
                <button disabled class="w-full px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-wait flex items-center justify-center gap-1.5">
                  <span>⏳</span>
                  <span>Instruction en cours (Décision sous peu...)</span>
                </button>
              ` : game.samuConvention?.requestStatus === 'accepted' ? `
                <button onclick="window.game.signSamuConvention()" class="w-full px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer animate-bounce">
                  <span>✍️</span>
                  <span>Convention Validée : Parapher & Activer (+350 €)</span>
                </button>
              ` : `
                <button onclick="window.game.requestSamuConvention()" class="w-full px-3.5 py-1.5 rounded-xl bg-pc-blue hover:brightness-110 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer">
                  <span>📑</span>
                  <span>${game.samuConvention?.requestStatus === 'rejected' ? 'Renouveler la Demande au SAMU 15' : 'Déposer une Demande de Conventionnement SAMU 15'}</span>
                </button>
              `}
            </div>
          </div>

          <!-- 2. CONVENTION SDIS (POMPIERS) -->
          <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3 border ${game.sdisConvention?.signed ? 'border-orange-300 ring-1 ring-orange-300/30' : 'border-slate-200'}">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-orange-100 text-orange-900 border border-orange-200">
                  SDIS • Gardes Pompiers
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  game.sdisConvention?.signed 
                    ? 'bg-emerald-600 text-white' 
                    : (game.sdisConvention?.requestStatus === 'instruction' 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' 
                        : (game.sdisConvention?.requestStatus === 'accepted' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : (game.sdisConvention?.requestStatus === 'rejected' 
                                ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                                : 'bg-slate-100 text-slate-700')))
                }">
                  ${
                    game.sdisConvention?.signed 
                      ? 'Convention Signée ✓' 
                      : (game.sdisConvention?.requestStatus === 'instruction' 
                          ? 'Instruction en cours ⏳' 
                          : (game.sdisConvention?.requestStatus === 'accepted' 
                              ? 'Demande Acceptée ✓' 
                              : (game.sdisConvention?.requestStatus === 'rejected' 
                                  ? 'Demande Ajournée ✗' 
                                  : 'Non Conventionnée')))
                  }
                </span>
              </div>

              <div>
                <h5 class="text-xs font-black text-slate-900">Convention Partenariale SDIS (Pompiers)</h5>
                <p class="text-[11px] text-slate-600 mt-1">Mise à disposition conventionnée d'un équipage VPSP pour gardes caserne ou astreintes renforcées au profit du CODIS.</p>
              </div>

              <div class="p-2.5 rounded-xl bg-slate-50 text-[10px] space-y-1 font-semibold text-slate-700">
                <div class="flex justify-between">
                  <span>Indemnisation SDIS :</span>
                  <span class="text-emerald-700 font-bold">45 € / heure de garde VPSP</span>
                </div>
                <div class="flex justify-between">
                  <span>Dotation de signature :</span>
                  <span class="text-emerald-700 font-bold">+350 €</span>
                </div>
                <div class="flex justify-between">
                  <span>Cadre d'intervention :</span>
                  <span>Gardes caserne VPSP & renforts secours d'urgence au profit du CODIS</span>
                </div>
              </div>

              ${game.sdisConvention?.requestStatus === 'rejected' && game.sdisConvention?.rejectReason ? `
                <div class="p-2 rounded-xl bg-rose-50 border border-rose-200 text-[10px] text-rose-800 space-y-0.5">
                  <div class="font-bold flex items-center gap-1">
                    <span>⚠️ Motif du refus du commandement SDIS :</span>
                  </div>
                  <div>${game.sdisConvention.rejectReason}</div>
                </div>
              ` : ''}

              ${game.sdisConvention?.requestStatus === 'instruction' ? `
                <div class="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800 space-y-1">
                  <div class="font-bold flex items-center justify-between">
                    <span>Dossier en cours d'instruction par l'État-Major SDIS</span>
                    <span>${Math.max(1, Math.ceil((game.sdisConvention.reviewTimer || 0) / 60))} min</span>
                  </div>
                  <div class="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-amber-600 h-full rounded-full transition-all duration-300" style="width: ${Math.min(100, Math.max(5, 100 - (((game.sdisConvention.reviewTimer || 1) / (game.sdisConvention.initialTimer || 120)) * 100)))}%"></div>
                  </div>
                  <div class="text-[9px] text-amber-700 italic">Le SDIS vérifie l'expérience opérationnelle et la fiabilité de vos équipages...</div>
                </div>
              ` : ''}
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              ${game.sdisConvention?.signed ? `
                <button onclick="window.game.openModule('pompiers')" class="px-3.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs shadow-sm transition">
                  Gérer la Garde SDIS
                </button>
                <button onclick="window.game.terminateSdisConvention()" class="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition border border-rose-200">
                  Résilier
                </button>
              ` : game.sdisConvention?.requestStatus === 'instruction' ? `
                <button disabled class="w-full px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-wait flex items-center justify-center gap-1.5">
                  <span>⏳</span>
                  <span>Instruction en cours (Décision sous peu...)</span>
                </button>
              ` : game.sdisConvention?.requestStatus === 'accepted' ? `
                <button onclick="window.game.signSdisConvention()" class="w-full px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer animate-bounce">
                  <span>✍️</span>
                  <span>Convention Validée : Parapher & Activer (+350 €)</span>
                </button>
              ` : `
                <button onclick="window.game.requestSdisConvention()" class="w-full px-3.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer">
                  <span>📑</span>
                  <span>${game.sdisConvention?.requestStatus === 'rejected' ? 'Renouveler la Demande au SDIS' : 'Déposer une Demande de Conventionnement SDIS'}</span>
                </button>
              `}
            </div>
          </div>

          <!-- 3. CONVENTION CUMP (SAMU 15 - URGENCE PSYCHO) -->
          <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3 border ${cump.signed ? 'border-red-400/50 ring-1 ring-red-400/20' : 'border-slate-200'}">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-200">
                  SAMU 15 • Urgence Psycho
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  cump.normCompliant 
                    ? 'bg-emerald-600 text-white' 
                    : (cump.signed 
                        ? 'bg-amber-400 text-amber-950' 
                        : (cump.requestStatus === 'instruction' 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' 
                            : (cump.requestStatus === 'accepted' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : (cump.requestStatus === 'rejected' 
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                                    : 'bg-slate-100 text-slate-700'))))
                }">
                  ${
                    cump.normCompliant 
                      ? 'Conforme H24' 
                      : (cump.signed 
                          ? 'En mise aux normes 48h' 
                          : (cump.requestStatus === 'instruction' 
                              ? 'Instruction en cours ⏳' 
                              : (cump.requestStatus === 'accepted' 
                                  ? 'Demande Acceptée ✓' 
                                  : (cump.requestStatus === 'rejected' 
                                      ? 'Demande Ajournée ✗' 
                                      : 'Non signée'))))
                  }
                </span>
              </div>

              <div>
                <h5 class="text-xs font-black text-slate-900">Convention AASC & CUMP / SAMU 15</h5>
                <p class="text-[11px] text-slate-600 mt-1">Astreinte 24h/24 pour l'armement de Centres d'Accueil des Impliqués (CAI) sous 2 heures avec malles pré-conditionnées.</p>
              </div>

              <div class="p-2.5 rounded-xl bg-slate-50 text-[10px] space-y-1 font-semibold text-slate-700">
                <div class="flex justify-between">
                  <span>Cadre d'intervention :</span>
                  <span>Armement de Centre d'Accueil des Impliqués (CAI) & soutien médico-psychologique</span>
                </div>
                <div class="flex justify-between">
                  <span>Mise aux normes :</span>
                  <span>48 heures après signature</span>
                </div>
              </div>

              ${cump.requestStatus === 'rejected' && cump.rejectReason ? `
                <div class="p-2 rounded-xl bg-rose-50 border border-rose-200 text-[10px] text-rose-800 space-y-0.5">
                  <div class="font-bold flex items-center gap-1">
                    <span>⚠️ Motif du refus de la CUMP / CHU :</span>
                  </div>
                  <div>${cump.rejectReason}</div>
                </div>
              ` : ''}

              ${cump.requestStatus === 'instruction' ? `
                <div class="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800 space-y-1">
                  <div class="font-bold flex items-center justify-between">
                    <span>Dossier en cours d'instruction par la Cellule CUMP</span>
                    <span>${Math.max(1, Math.ceil((cump.reviewTimer || 0) / 60))} min</span>
                  </div>
                  <div class="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-amber-600 h-full rounded-full transition-all duration-300" style="width: ${Math.min(100, Math.max(5, 100 - (((cump.reviewTimer || 1) / (cump.initialTimer || 150)) * 100)))}%"></div>
                  </div>
                  <div class="text-[9px] text-amber-700 italic">La coordination hospitalière évalue la solidité psychologique et l'expérience de votre unité...</div>
                </div>
              ` : ''}
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              ${cump.signed ? `
                <button onclick="window.ProtecCump.renderCumpTab(window.game)" class="w-full px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-sm transition">
                  Gérer la Convention CUMP
                </button>
              ` : cump.requestStatus === 'instruction' ? `
                <button disabled class="w-full px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-wait flex items-center justify-center gap-1.5">
                  <span>⏳</span>
                  <span>Instruction en cours (Décision sous peu...)</span>
                </button>
              ` : cump.requestStatus === 'accepted' ? `
                <button onclick="window.ProtecCump.renderCumpTab(window.game)" class="w-full px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer animate-bounce">
                  <span>✍️</span>
                  <span>Demande Validée : Signer dans le module CUMP</span>
                </button>
              ` : `
                <button onclick="window.game.requestCumpConvention ? window.game.requestCumpConvention() : (window.ProtecConventions && window.ProtecConventions.requestConvention ? window.ProtecConventions.requestConvention(window.game, 'cump') : window.ProtecCump.requestConvention(window.game))" class="w-full px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer">
                  <span>📑</span>
                  <span>${cump.requestStatus === 'rejected' ? 'Renouveler la Demande CUMP' : 'Déposer une Demande de Conventionnement CUMP'}</span>
                </button>
              `}
            </div>
          </div>

          <!-- 4. CONVENTION SNCF (NAUFRAGÉS DU RAIL & CHU) -->
          <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3 border ${game.sncfConvention?.signed ? 'border-purple-300 ring-1 ring-purple-300/30' : 'border-slate-200'}">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-200">
                  SNCF Voyageurs • Crise
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  game.sncfConvention?.signed 
                    ? 'bg-emerald-600 text-white' 
                    : (game.sncfConvention?.requestStatus === 'instruction' 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' 
                        : (game.sncfConvention?.requestStatus === 'accepted' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : (game.sncfConvention?.requestStatus === 'rejected' 
                                ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                                : 'bg-slate-100 text-slate-700')))
                }">
                  ${
                    game.sncfConvention?.signed 
                      ? 'Convention Signée ✓' 
                      : (game.sncfConvention?.requestStatus === 'instruction' 
                          ? 'Instruction en cours ⏳' 
                          : (game.sncfConvention?.requestStatus === 'accepted' 
                              ? 'Demande Acceptée ✓' 
                              : (game.sncfConvention?.requestStatus === 'rejected' 
                                  ? 'Demande Ajournée ✗' 
                                  : 'Non Signée')))
                  }
                </span>
              </div>

              <div>
                <h5 class="text-xs font-black text-slate-900">Convention Nationale SNCF - Naufragés du Rail</h5>
                <p class="text-[11px] text-slate-600 mt-1">Prise en charge des voyageurs bloqués en gare ou pleine voie lors d'avaries majeures du réseau ferré (eau, réconfort, hébergement d'urgence en gare).</p>
              </div>

              <div class="p-2.5 rounded-xl bg-slate-50 text-[10px] space-y-1 font-semibold text-slate-700">
                <div class="flex justify-between">
                  <span>Dotation initiale :</span>
                  <span class="text-emerald-700 font-bold">+400 €</span>
                </div>
                <div class="flex justify-between">
                  <span>Indemnité de veille :</span>
                  <span>+120 € / levée</span>
                </div>
                <div class="flex justify-between">
                  <span>Cadre d'intervention :</span>
                  <span>Prise en charge, eau et réconfort des voyageurs bloqués en gare ou pleine voie</span>
                </div>
              </div>

              ${game.sncfConvention?.requestStatus === 'rejected' && game.sncfConvention?.rejectReason ? `
                <div class="p-2 rounded-xl bg-rose-50 border border-rose-200 text-[10px] text-rose-800 space-y-0.5">
                  <div class="font-bold flex items-center gap-1">
                    <span>⚠️ Motif du refus de la SNCF :</span>
                  </div>
                  <div>${game.sncfConvention.rejectReason}</div>
                </div>
              ` : ''}

              ${game.sncfConvention?.requestStatus === 'instruction' ? `
                <div class="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800 space-y-1">
                  <div class="font-bold flex items-center justify-between">
                    <span>Dossier en cours d'instruction par la SNCF</span>
                    <span>${Math.max(1, Math.ceil((game.sncfConvention.reviewTimer || 0) / 60))} min</span>
                  </div>
                  <div class="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-amber-600 h-full rounded-full transition-all duration-300" style="width: ${Math.min(100, Math.max(5, 100 - (((game.sncfConvention.reviewTimer || 1) / (game.sncfConvention.initialTimer || 90)) * 100)))}%"></div>
                  </div>
                  <div class="text-[9px] text-amber-700 italic">La direction de crise SNCF analyse la capacité de mobilisation rapide de votre antenne...</div>
                </div>
              ` : ''}
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              ${game.sncfConvention?.signed ? `
                <span class="text-[10px] font-bold text-emerald-700">✓ En vigueur</span>
                <button onclick="window.game.terminateSncfConvention(); window.game.openModule('conventions');" class="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition border border-rose-200">
                  Résilier
                </button>
              ` : game.sncfConvention?.requestStatus === 'instruction' ? `
                <button disabled class="w-full px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-wait flex items-center justify-center gap-1.5">
                  <span>⏳</span>
                  <span>Instruction en cours (Décision sous peu...)</span>
                </button>
              ` : game.sncfConvention?.requestStatus === 'accepted' ? `
                <button onclick="window.game.signSncfConvention(); window.game.openModule('conventions');" class="w-full px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer animate-bounce">
                  <span>✍️</span>
                  <span>Convention Validée : Parapher & Activer (+400 €)</span>
                </button>
              ` : `
                <button onclick="window.game.requestSncfConvention(); window.game.openModule('conventions');" class="w-full px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer">
                  <span>📑</span>
                  <span>${game.sncfConvention?.requestStatus === 'rejected' ? 'Renouveler la Demande à la SNCF' : 'Déposer une Demande de Conventionnement SNCF'}</span>
                </button>
              `}
            </div>
          </div>

          <!-- 4. PLAN COMMUNAL DE SAUVEGARDE (PCS) -->
          <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3 border border-slate-200">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-sky-100 text-sky-900 border border-sky-200">
                  Mairies • Préfecture
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-600 text-white">
                  En Vigueur
                </span>
              </div>

              <div>
                <h5 class="text-xs font-black text-slate-900">Convention Municipale PCS (Plan de Sauvegarde)</h5>
                <p class="text-[11px] text-slate-600 mt-1">Assistance aux communes de secteur pour l'évacuation de populations sinistrées (inondations, tempêtes) et armement de gymnases.</p>
              </div>

              <div class="p-2.5 rounded-xl bg-slate-50 text-[10px] space-y-1 font-semibold text-slate-700">
                <div class="flex justify-between">
                  <span>Agréments requis :</span>
                  <span>Agrément B & Agrément C</span>
                </div>
                <div class="flex justify-between">
                  <span>Subvention annuelle d'antenne :</span>
                  <span>2 000 € / an par commune conventionnée</span>
                </div>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button onclick="window.game.showToast('PCS Actif', 'Conventions de sauvegarde communale opérationnelles.', 'blue')" class="px-3.5 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-extrabold text-xs shadow-sm transition">
                Détails Plan Communal
              </button>
            </div>
          </div>

        </div>

        <!-- 3. SEGMENTATION DES REVENUS ET SUBVENTIONS PUBLIQUES -->
        <div class="p-5 rounded-3xl glass-card border border-slate-200 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">💰</span>
              <div>
                <h4 class="text-sm font-black text-slate-900">Segmentation des Flux Financiers de l'Antenne</h4>
                <p class="text-xs text-slate-500">Traçabilité budgétaire stricte des 3 flux réglementaires d'une AASC.</p>
              </div>
            </div>
            <button onclick="window.game.openFinancesModal()" class="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
              Grand Livre →
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- Flux 1 : DPS Privés/Publics -->
            <div class="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-amber-900">1. DPS Événementiels</span>
                <span class="text-lg">📋</span>
              </div>
              <p class="text-[11px] text-amber-800 leading-tight">Facturation des organisateurs selon devis, grille horaire bénévole, consommables et amortissement véhicules.</p>
              <div class="text-[10px] font-bold text-amber-900 pt-1 border-t border-amber-200/60">
                Taux horaire : 18 €/h/secouriste + Forfait VPSP
              </div>
            </div>

            <!-- Flux 2 : Gardes et Conventions d'urgence -->
            <div class="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-sky-900">2. Gardes SAMU & SDIS</span>
                <span class="text-lg">🚑</span>
              </div>
              <p class="text-[11px] text-sky-800 leading-tight">Forfaits conventionnés d'astreinte et de sorties réflexes pour le compte du SAMU 15 et des Sapeurs-Pompiers.</p>
              <div class="text-[10px] font-bold text-sky-900 pt-1 border-t border-sky-200/60">
                Astreinte : +250 €/garde • Sortie : +120 €
              </div>
            </div>

            <!-- Flux 3 : Subventions publiques annuelles -->
            <div class="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-indigo-900">3. Subventions Publiques</span>
                <span class="text-lg">🏛️</span>
              </div>
              <p class="text-[11px] text-indigo-800 leading-tight">Dotations annuelles Mairie & FDVA (Fonds de Développement de la Vie Associative) indexées sur l'activité.</p>
              <div class="pt-1 border-t border-indigo-200/60 flex items-center justify-between">
                <span class="text-[10px] font-black text-indigo-900">Dotation calculée</span>
                <button onclick="window.ProtecRNMSC.claimAnnualGrant(window.game)" class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 text-white transition">
                  Demande FDVA
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. CONTRATS ANNUELS & PARTENARIATS CADRES RÉGULIERS -->
        <div class="p-5 rounded-3xl glass-card border border-indigo-200/90 bg-indigo-50/40 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">📜</span>
              <div>
                <h4 class="text-sm font-black text-indigo-950">Contrats Cadres Annuels & Postes Réguliers</h4>
                <p class="text-xs text-indigo-800">Conventions récurrentes : Club de Foot (quinzaine), Zénith (hebdo), Mairie (mensuel), Parc Expos.</p>
              </div>
            </div>
            <button onclick="window.game.devisTab = 'contrats'; window.game.openModule('devis');" class="px-3.5 py-1.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1.5">
              <span>Gérer les Contrats (${(game.annualContracts || []).filter(c => c.signed).length})</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <p class="text-[11px] text-indigo-900 leading-relaxed">
            Ces accords-cadres inscrivent des postes de secours récurrents et automatiques dans votre planning tout en versant des primes annuelles d'équipement.
          </p>
        </div>

      </div>
    `;

    if (body && prevScroll > 0) {
      body.scrollTop = prevScroll;
    }

    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      if (body && prevScroll > 0) {
        body.scrollTop = prevScroll;
      }
    }, 50);
  }
};

// ============================================================================
// MOTEUR OFFICIEL RNMSC (DISPOSITIFS PRÉVISIONNELS DE SECOURS)
// Grille P1/P2/E1/E2, Calcul du RIS et Règle d'Équipage Stricte VPSP
// ============================================================================
window.ProtecRNMSC = {
  // Calcul officiel RNMSC selon l'arrêté ministériel (Référentiel National DPS)
  // Formule officielle :
  // i = P2 + E1 + E2
  // Si P1 <= 100 000 : P = P1 ; Si P1 > 100 000 : P = 100 000 + (P1 - 100 000)/2
  // RIS = i * (P / 1000)
  // Type de DPS selon les seuils réels :
  // RIS <= 0.25 : Diligence de l'autorité de police compétente (Dispense ou PAPS facultatif)
  // 0.25 < RIS <= 1.125 : Point d'alerte et de premiers secours (PAPS) - 2 secouristes
  // 1.125 < RIS <= 12 : DPS de petite envergure (DPS-PE) - 4 à 12 secouristes
  // 12 < RIS <= 36 : DPS de moyenne envergure (DPS-ME) - 14 à 36 secouristes
  // RIS > 36 : DPS de grande envergure (DPS-GE) - > 36 secouristes
  // Règle secouristes : Effectif pair = ceil(RIS), arrondi au nombre pair supérieur (min 2 si > 0.25)
  calculateRIS({ p1 = 2500, p2 = 0.35, e1 = 0.30, e2 = 0.30, n = null }) {
    // Rétrocompatibilité si n est passé à la place de p1
    const p1Val = Number(n !== null && n !== undefined ? n : p1) || 0;
    const p2Val = Number(p2) || 0.30;
    const e1Val = Number(e1) || 0.25;
    const e2Val = Number(e2) || 0.25;

    // Indice total de risque : i = P2 + E1 + E2
    const i = Math.round((p2Val + e1Val + e2Val) * 100) / 100;

    // Effectif prévisible pris en compte (P)
    let p = p1Val;
    if (p1Val > 100000) {
      p = 100000 + Math.floor((p1Val - 100000) / 2);
    }

    // Ratio d'intervenants secouristes : RIS = i * (P / 1000)
    const ris = Math.round(((i * p) / 1000) * 100) / 100;

    let type = 'DILIGENCE_POLICE';
    let label = 'Diligence de l\'autorité de police';
    let minVolunteers = 0;
    let requiredVehicles = [];
    let requiredRanks = [];
    let badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';

    if (ris <= 0.25) {
      type = 'DILIGENCE_POLICE';
      label = 'Diligence de l\'autorité de police (RIS ≤ 0,25)';
      minVolunteers = 0; // Pas d'obligation légale de DPS associatif
      requiredVehicles = [];
      requiredRanks = [];
      badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';
    } else if (ris <= 1.125) {
      type = 'PAPS';
      label = 'Point d’Alerte et de Premiers Secours (0,25 < RIS ≤ 1,125)';
      minVolunteers = 2; // Strictement 2 secouristes (1 binôme)
      requiredVehicles = [];
      requiredRanks = ['PSE2', 'PSE1'];
      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (ris <= 12) {
      type = 'DPS-PE';
      label = 'DPS de Petite Envergure (1,125 < RIS ≤ 12)';
      // Au moins 4 secouristes, arrondi au pair supérieur
      let needed = Math.ceil(ris);
      if (needed % 2 !== 0) needed += 1;
      minVolunteers = Math.max(4, Math.min(12, needed));
      requiredVehicles = ['VPSP'];
      requiredRanks = ['CE', 'Driver', 'PSE2', 'PSE1'];
      badgeColor = 'bg-sky-100 text-sky-800 border-sky-300';
    } else if (ris <= 36) {
      type = 'DPS-ME';
      label = 'DPS de Moyenne Envergure (12 < RIS ≤ 36)';
      let needed = Math.ceil(ris);
      if (needed % 2 !== 0) needed += 1;
      minVolunteers = Math.max(14, Math.min(36, needed));
      requiredVehicles = ['VPSP', 'VTU'];
      requiredRanks = ['CD', 'CE', 'Driver', 'PSE2', 'PSE1'];
      badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
    } else {
      type = 'DPS-GE';
      label = 'DPS de Grande Envergure (RIS > 36)';
      let needed = Math.ceil(ris);
      if (needed % 2 !== 0) needed += 1;
      minVolunteers = Math.max(38, needed);
      requiredVehicles = ['VPSP', 'VPSP', 'VTU', 'PMA'];
      requiredRanks = ['CD', 'CE', 'Driver', 'PSE2', 'PSE1'];
      badgeColor = 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
    }

    return {
      i,
      p1: p1Val,
      p,
      ris,
      type,
      label,
      minVolunteers,
      requiredVehicles,
      requiredRanks,
      badgeColor
    };
  },

  // Génération du bloc HTML officiel complet RNMSC pour les devis et conventions
  renderRNMSCSimulatorCardHTML(prefix = 'rnmsc') {
    return `
      <div class="p-4 sm:p-5 rounded-3xl glass-card border border-slate-200/90 shadow-sm space-y-4">
        <!-- En-tête officiel -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">📐</span>
            <div>
              <h4 class="text-sm font-black text-slate-900">Grille Officielle RNMSC • Dimensionnement des DPS</h4>
              <p class="text-xs text-slate-500">Référentiel National des Missions de Sécurité Civile : Calcul du ratio d'intervenants (RIS)</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-pc-blue/10 text-pc-blue border border-pc-blue/20 flex-shrink-0 self-start sm:self-auto">
            Norme Ministère de l'Intérieur
          </span>
        </div>

        <!-- 3 Sélecteurs d'indicateurs P2, E1, E2 conformes au référentiel d'État -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <!-- P2 : Activité du rassemblement -->
          <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 flex flex-col justify-between">
            <div>
              <label class="font-extrabold text-slate-800 block text-[11px]">Indicateur P2 • Activité du rassemblement</label>
              <span class="text-[10px] text-slate-500 block">Comportement, posture et public</span>
            </div>
            <select id="${prefix}-p2" onchange="window.ProtecRNMSC.updateSimulatorUI('${prefix}')" class="w-full text-xs font-semibold p-2 rounded-xl border border-slate-300 bg-white">
              <option value="0.25">0,25 - Public assis (spectacle, cérémonie, réunion, sport)</option>
              <option value="0.30" selected>0,30 - Public debout (exposition, foire, salon, comice)</option>
              <option value="0.35">0,35 - Public debout statique (fête foraine, fête avec protection)</option>
              <option value="0.40">0,40 - Public debout dynamique (danse, féria, carnaval, multi-jours)</option>
            </select>
          </div>

          <!-- E1 : Caractéristiques de l'environnement ou accessibilité du site -->
          <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 flex flex-col justify-between">
            <div>
              <label class="font-extrabold text-slate-800 block text-[11px]">Indicateur E1 • Environnement & Accessibilité</label>
              <span class="text-[10px] text-slate-500 block">Structure, superficie et relief</span>
            </div>
            <select id="${prefix}-e1" onchange="window.ProtecRNMSC.updateSimulatorUI('${prefix}')" class="w-full text-xs font-semibold p-2 rounded-xl border border-slate-300 bg-white">
              <option value="0.25">0,25 - Bâtiment en dur, rues avec accès dégagés</option>
              <option value="0.30" selected>0,30 - Gradins/chapiteaux, terrain ≤ 2 ha, brancardage ≤ 300m</option>
              <option value="0.35">0,35 - Espace 2 à 5 ha, brancardage 300 à 600m, pente > 150m</option>
              <option value="0.40">0,40 - Espace > 5 ha, brancardage > 600m, talus ou escaliers</option>
            </select>
          </div>

          <!-- E2 : Délai d'intervention des secours publics -->
          <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 flex flex-col justify-between">
            <div>
              <label class="font-extrabold text-slate-800 block text-[11px]">Indicateur E2 • Délai Secours Publics (15 / 18)</label>
              <span class="text-[10px] text-slate-500 block">Délai d'accès pompiers et SAMU</span>
            </div>
            <select id="${prefix}-e2" onchange="window.ProtecRNMSC.updateSimulatorUI('${prefix}')" class="w-full text-xs font-semibold p-2 rounded-xl border border-slate-300 bg-white">
              <option value="0.25">0,25 - Délais ≤ 10 minutes</option>
              <option value="0.30" selected>0,30 - Délais de 10 à 20 minutes</option>
              <option value="0.35">0,35 - Délais de 20 à 30 minutes</option>
              <option value="0.40">0,40 - Délais > 30 minutes (zone isolée)</option>
            </select>
          </div>
        </div>

        <!-- Effectif prévisible déclaré (P1) et Synthèse de la formule -->
        <div class="p-3.5 rounded-2xl bg-slate-100/90 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div>
              <span class="text-xs font-extrabold text-slate-800 block">Effectif déclaré du public (P₁) :</span>
              <span class="text-[10px] text-slate-500">Public simultané maximal attendu</span>
            </div>
            <input type="number" id="${prefix}-n" value="2500" min="50" max="250000" step="50" onchange="window.ProtecRNMSC.updateSimulatorUI('${prefix}')" oninput="window.ProtecRNMSC.updateSimulatorUI('${prefix}')" class="w-28 text-xs font-black p-2 rounded-xl border border-slate-300 bg-white font-mono text-center">
          </div>

          <div id="${prefix}-result-box" class="flex items-center gap-3 text-xs">
            <!-- Rempli dynamiquement -->
          </div>
        </div>
      </div>
    `;
  },

  // Mise à jour visuelle du simulateur dans la vue conventions ou la vue devis
  updateSimulatorUI(prefix = 'rnmsc') {
    const p2 = Number(document.getElementById(`${prefix}-p2`)?.value || 0.30);
    const e1 = Number(document.getElementById(`${prefix}-e1`)?.value || 0.30);
    const e2 = Number(document.getElementById(`${prefix}-e2`)?.value || 0.30);
    const n = Number(document.getElementById(`${prefix}-n`)?.value || 2500);

    const calc = this.calculateRIS({ p1: n, p2, e1, e2 });
    const box = document.getElementById(`${prefix}-result-box`);
    if (box) {
      box.innerHTML = `
        <div class="text-right">
          <span class="text-[10px] text-slate-500 font-bold block">i = ${calc.i} • RIS = ${calc.ris}</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black border ${calc.badgeColor}">
            ${calc.label}
          </span>
        </div>
        <div class="p-2.5 rounded-xl bg-pc-blue text-white text-center font-mono font-black text-xs shadow-xs">
          ${calc.minVolunteers > 0 ? `${calc.minVolunteers} secouristes requis (pair)` : 'Aucun DPS requis'}
        </div>
      `;
    }
  },

  // =========================================================================
  // RÈGLES OPÉRATIONNELLES STRICTES RNMSC (Lots, Équipes, CP, CE & Véhicules)
  // =========================================================================

  // Détection des structures fixes déployées (PSA et PMA)
  getDeployedStructures(mission) {
    if (!mission) return { psaCount: 0, pmaCount: 0, totalFixedPosts: 0 };
    let psa = 0;
    let pma = 0;

    if (mission.psaCount !== undefined && mission.psaCount !== null) psa += Number(mission.psaCount) || 0;
    if (mission.pmaCount !== undefined && mission.pmaCount !== null) pma += Number(mission.pmaCount) || 0;
    if (mission.hasPSA && psa === 0) psa = 1;
    if (mission.hasPMA && pma === 0) pma = 1;

    if (Array.isArray(mission.structures)) {
      mission.structures.forEach(s => {
        const str = String(s).toUpperCase();
        if (str.includes('PMA')) pma++;
        else if (str.includes('PSA')) psa++;
      });
    }

    const text = `${mission.title || ''} ${mission.desc || ''} ${mission.scale || ''} ${mission.categoryLabel || ''}`.toUpperCase();
    if ((mission.requiredVehicles || []).some(v => String(v).toUpperCase().includes('PMA'))) {
      if (pma === 0) pma = 1;
    }
    if (text.includes('PMA') || text.includes('POSTE MÉDICAL AVANCÉ') || text.includes('POSTE MEDICAL AVANCE')) {
      if (pma === 0) pma = 1;
    }
    if (text.includes('PSA') || text.includes('POINT DE SECOURS AVANCÉ') || text.includes('POINT DE SECOURS AVANCE')) {
      if (psa === 0) psa = 1;
    }

    // Dans la grille officielle RNMSC :
    // Un DPS-GE déploie obligatoirement au moins 1 PMA / Poste lourd de coordination
    if (mission.scale === 'DPS-GE' && psa === 0 && pma === 0) {
      pma = 1;
    }

    return {
      psaCount: psa,
      pmaCount: pma,
      totalFixedPosts: psa + pma
    };
  },

  // Qualifications opérationnelles individuelles RNMSC
  isCpQualified(v) {
    if (!v) return false;
    const rank = String(v.rank || '').toUpperCase();
    const skills = (v.skills || []).map(s => String(s).toLowerCase());
    return ['CP', 'CD', 'CHEF DE POSTE', 'CHEF DE DISPOSITIF', 'CADRE'].includes(rank) ||
           skills.some(s => ['cp', 'cd', 'chef_poste', 'chef_dispositif'].includes(s));
  },

  isCeQualified(v) {
    if (!v) return false;
    if (this.isCpQualified(v)) return true;
    const rank = String(v.rank || '').toUpperCase();
    const skills = (v.skills || []).map(s => String(s).toLowerCase());
    return ['CE', 'CHEF D’ÉQUIPE', 'CHEF D\'ÉQUIPE', 'CHEF EQUIPE'].includes(rank) ||
           skills.some(s => ['ce', 'chef_equipe'].includes(s));
  },

  isDriverQualified(v) {
    if (!v) return false;
    if (v.isDriver) return true;
    const skills = (v.skills || []).map(s => String(s).toLowerCase());
    return skills.some(s => ['permis_b', 'conducteur', 'permis_vpsp', 'pilotage'].includes(s));
  },

  isPse2Qualified(v) {
    if (!v) return false;
    if (this.isCeQualified(v)) return true;
    const rank = String(v.rank || '').toUpperCase();
    const skills = (v.skills || []).map(s => String(s).toLowerCase());
    return ['PSE2', 'ÉQUIPIER', 'EQUIPIER', 'ÉQUIPIER-SECOURISTE'].includes(rank) ||
           skills.some(s => ['pse2'].includes(s));
  },

  isPse1Qualified(v) {
    if (!v) return false;
    if (this.isPse2Qualified(v)) return true;
    const rank = String(v.rank || '').toUpperCase();
    const skills = (v.skills || []).map(s => String(s).toLowerCase());
    return ['PSE1', 'SECOURISTE'].includes(rank) ||
           skills.some(s => ['pse1'].includes(s));
  },

  // RÈGLE STRICTE D'ÉQUIPAGE ET CONFORMITÉ RNMSC
  validateCrewCompliance(mission, volunteers = [], vehicles = [], game = null) {
    if (!game) game = window.game;
    const errors = [];
    const warnings = [];

    if (!mission) {
      return { valid: true, errors: [], warnings: [] };
    }

    const totalCrew = volunteers.length;
    const structures = this.getDeployedStructures(mission);
    const fixedPostsCount = structures.totalFixedPosts;
    const roles = mission.volunteerRoles || {};

    // -------------------------------------------------------------------------
    // 1. DOTATION MATÉRIELLE OBLIGATOIRE (LOT A PAR PSA / PMA)
    // -------------------------------------------------------------------------
    if (fixedPostsCount > 0) {
      const ownedLotsA = (game?.workplaceEquipment?.['lot_secours_a'] || 0) + (game?.workplaceEquipment?.['lot_a'] || 0);
      const assignedLotsA = (mission.assignedEquipment?.lot_secours_a || 0) + (mission.assignedEquipment?.lot_a || 0) +
        (Array.isArray(mission.assignedLots) ? mission.assignedLots.filter(l => l === 'lot_secours_a' || l === 'lot_a').length : 0);

      if (ownedLotsA < fixedPostsCount && assignedLotsA < fixedPostsCount) {
        errors.push(`Dotation matérielle obligatoire RNMSC : Chaque structure fixe déployée (PSA / PMA : ${fixedPostsCount}) exige obligatoirement l'affectation d'au moins 1 Lot A (Secours à personne). Vous possédez ${ownedLotsA}/${fixedPostsCount} Lot(s) A disponible(s). Équipez votre antenne dans l'onglet Équipements.`);
      } else {
        // Auto-sécurisation de l'assignation du matériel
        mission.assignedEquipment = mission.assignedEquipment || {};
        mission.assignedEquipment.lot_secours_a = Math.max(mission.assignedEquipment.lot_secours_a || 0, fixedPostsCount);
      }
    }

    // -------------------------------------------------------------------------
    // 2. RÈGLES DE COMPOSITION ET DE COMMANDEMENT
    // -------------------------------------------------------------------------
    if (totalCrew > 0) {
      const cpVols = volunteers.filter(v => (roles[v.id] === 'chef_poste' || roles[v.id] === 'chef_dispositif') && this.isCpQualified(v));
      const ceVols = volunteers.filter(v => roles[v.id] === 'chef_equipe' && this.isCeQualified(v));
      const allQualifiedCp = volunteers.filter(v => this.isCpQualified(v));
      const allQualifiedCe = volunteers.filter(v => this.isCeQualified(v));

      // 2.1 Commandement PSA / PMA : 1 Chef de Poste (CP) par structure fixe
      if (fixedPostsCount > 0) {
        const totalCpAssigned = cpVols.length || allQualifiedCp.length;
        if (totalCpAssigned < fixedPostsCount) {
          errors.push(`Commandement RNMSC : 1 Chef de Poste (CP) qualifié est obligatoire pour chaque PSA/PMA déployé (${totalCpAssigned}/${fixedPostsCount} désigné(s)).`);
        }
      }

      // 2.2 Commandement général selon effectif total
      if (totalCrew >= 6) {
        // Effectif >= 6 intervenants : commandement général = Chef de Poste (CP ou CD)
        const hasGeneralCp = cpVols.length > 0 || allQualifiedCp.length > 0;
        if (!hasGeneralCp) {
          errors.push(`Commandement général RNMSC : Le dispositif compte ${totalCrew} intervenants (≥ 6). Le commandement général doit obligatoirement être un Chef de Poste qualifié (CP ou CD).`);
        }
      } else {
        // Effectif < 6 intervenants : commandement assuré par un Chef d'Équipe (CE)
        const hasLeader = cpVols.length > 0 || ceVols.length > 0 || allQualifiedCe.length > 0;
        if (!hasLeader) {
          errors.push(`Commandement RNMSC : Dispositif sans commandement. Au moins 1 Chef d’Équipe (CE) qualifié est obligatoire.`);
        }
      }

      // 2.3 Tranches d'encadrement : 1 Chef d'Équipe (CE) par tranche de 3 ou 4 secouristes
      const numTeams = Math.max(1, Math.ceil(totalCrew / 4));
      const totalCadresCount = (cpVols.length + ceVols.length) || allQualifiedCe.length;
      if (totalCadresCount < numTeams) {
        errors.push(`Tranches d'encadrement RNMSC : 1 Chef d'Équipe (CE) est exigé par tranche de 3 à 4 secouristes (${totalCadresCount}/${numTeams} cadre(s) présent(s) pour ${totalCrew} intervenants).`);
      }

      // 2.4 Normes d'équipe :
      // Composition minimale (3 intervenants) : 1 CE + 1 PSE2 + 1 PSE1
      // Composition optimale (4 intervenants) : 1 CE + 2 PSE2 + 1 PSE1
      const pse2Count = volunteers.filter(v => this.isPse2Qualified(v) && v.rank !== 'Stagiaire').length;
      const pse1Count = volunteers.filter(v => this.isPse1Qualified(v) && v.rank !== 'Stagiaire').length;

      // Il faut au moins 1 Équipier-Secouriste PSE2 par équipe
      if (pse2Count < numTeams) {
        errors.push(`Norme d'équipe RNMSC : Au moins 1 Équipier-Secouriste PSE2 par équipe est obligatoire (${pse2Count}/${numTeams} PSE2 qualifié(s)).`);
      }

      // Et au moins 1 Secouriste PSE1 par équipe
      if (pse1Count < numTeams) {
        errors.push(`Norme d'équipe RNMSC : Au moins 1 Secouriste PSE1 par équipe est obligatoire (${pse1Count}/${numTeams} PSE1 présent(s)).`);
      }

      // Composition minimale d'une équipe : au moins 3 secouristes opérationnels
      if (totalCrew < 3 && mission.scale !== 'PAPS') {
        errors.push(`Effectif insuffisant RNMSC : Une équipe de secours opérationnelle comporte au minimum 3 intervenants (1 CE + 1 PSE2 + 1 PSE1).`);
      }
    }

    // -------------------------------------------------------------------------
    // 3. VÉHICULES & CONDUITE OPÉRATIONNELLE
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // 3. VÉHICULES, RÉARMEMENT POST-MISSION & CONDUITE OPÉRATIONNELLE
    // -------------------------------------------------------------------------
    const engagedVehicles = (vehicles && vehicles.length > 0) ? vehicles : (mission.requiredVehicles || []);
    const numVehicles = engagedVehicles.length;

    // Règle stricte de logistique post-mission : blocage si véhicule non réarmé ou en panne
    if (vehicles && vehicles.length > 0) {
      vehicles.forEach(veh => {
        const vObj = typeof veh === 'object' ? veh : (game?.vehicles?.find(v => v.id === veh || v.type === veh));
        if (vObj) {
          if (vObj.status === 'a_rearme' || vObj.a_rearme || vObj.needsRearming) {
            errors.push(`Véhicule non réarmé : « ${vObj.name || vObj.type} » est au statut "À réarmer". Réarmement matériel complet (O2 médical, compresses, gants) et désinfection obligatoires avant tout départ opérationnel.`);
          }
          if (vObj.status === 'en_panne' || vObj.isBrokenDown) {
            errors.push(`Avarie mécanique : « ${vObj.name || vObj.type} » est actuellement en panne au garage. Réparation indispensable.`);
          }
        }
      });
    }

    // Règle Préfecture : si réputation < 40, aucune dérogation tolérée
    if (game && game.reputation_prefecture !== undefined && game.reputation_prefecture < 40) {
      if (errors.length > 0) {
        errors.unshift(`Avis Préfectoral Défavorable : Réputation Préfecture critique (${game.reputation_prefecture}/100 < 40). La commission de sécurité municipale et préfectorale bloque ce prévisionnel non conforme.`);
      }
    }
if (numVehicles > 0 && totalCrew > 0) {
      const drivers = volunteers.filter(v => this.isDriverQualified(v));
      if (drivers.length < numVehicles) {
        errors.push(`Conduite opérationnelle : ${numVehicles} véhicule(s) engagé(s) mais seulement ${drivers.length} conducteur(s) titulaire(s) du Permis B dans l'équipage.`);
      } else {
        // Priorité conducteur distinct qui n'est ni CP ni CE
        const distinctDrivers = drivers.filter(v => !this.isCeQualified(v));
        if (distinctDrivers.length < numVehicles) {
          warnings.push("Information Conduite : Cumul de conduite assuré par le Chef d'Équipe (autorisé faute de conducteur dédié distinct).");
        }
      }

      // Règle spécifique VPSP : habilitation ou équipage complet
      const hasVpsp = engagedVehicles.some(v => (v.type === 'VPSP' || v === 'VPSP'));
      if (hasVpsp && totalCrew < 4) {
        errors.push(`Un VPSP exige réglementairement un équipage complet de 4 secouristes (${totalCrew}/4 présents).`);
      }
    }

    // -------------------------------------------------------------------------
    // 4. MAINTIEN DES COMPÉTENCES (FORMATION CONTINUE / RECYCLAGE FC)
    // -------------------------------------------------------------------------
    const expiredVols = volunteers.filter(v => v.qualificationExpired);
    if (expiredVols.length > 0) {
      errors.push(`Recyclage annuel échu : ${expiredVols.map(v => v.name).join(', ')} ont un diplôme caduque non maintenu en Formation Continue.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  },

  // ---------------------------------------------------------------------------
  // ALGORITHME AUTOMATIQUE "AUTO-RÔLES" (RÈGLES STRICTES RNMSC)
  // ---------------------------------------------------------------------------
  autoAssignMissionRoles(game, missionId) {
    if (!game) game = window.game;
    const mission = (game.missions || []).find(m => m.id === missionId);
    if (!mission) return { valid: false, errors: ['Mission introuvable'] };

    mission.volunteerRoles = mission.volunteerRoles || {};
    const vols = (game.volunteers || []).filter(v => (mission.registeredVolunteers || []).includes(v.id));

    if (vols.length === 0) {
      if (game.showToast) game.showToast('Aucun intervenant', 'Aucun secouriste n’est inscrit sur ce dispositif.', 'orange');
      return { valid: false, errors: ['Aucun bénévole inscrit'] };
    }

    const structures = this.getDeployedStructures(mission);
    const totalCrew = vols.length;
    const reqVehicles = mission.requiredVehicles || [];
    const numVehicles = reqVehicles.length;

    // 1. Calculer le nombre de CP nécessaires (selon PSA/PMA ou effectif >= 6)
    let neededCP = structures.totalFixedPosts;
    if (totalCrew >= 6 || (mission.requiredVolunteers || 0) >= 6) {
      neededCP = Math.max(neededCP, 1);
    }

    // 2. Calculer le nombre de CE nécessaires (1 par tranche de 3 à 4 secouristes)
    const numTeams = Math.max(1, Math.ceil(totalCrew / 4));
    let neededCE = (totalCrew < 6) ? 1 : Math.max(1, numTeams - (neededCP > 0 ? 1 : 0));
    if (totalCrew <= 4 && neededCP > 0) {
      // Équipe unique avec CP sur structure
      neededCE = 0;
    }

    // 3. Dérouler la cascade d'attribution sur les bénévoles répondants
    let assignedCP = 0;
    let assignedCE = 0;
    let assignedDrivers = 0;
    let assignedPse2 = 0;

    const unassigned = [...vols];
    const rolesMap = {};

    // 3.1 Assigner les "Chef de poste" aux qualifiés CP/CD
    for (let i = 0; i < unassigned.length; i++) {
      if (assignedCP >= neededCP) break;
      const v = unassigned[i];
      if (this.isCpQualified(v)) {
        rolesMap[v.id] = (v.rank === 'CD' || (v.skills || []).includes('cd')) && totalCrew >= 12 ? 'chef_dispositif' : 'chef_poste';
        assignedCP++;
        unassigned.splice(i, 1);
        i--;
      }
    }

    // 3.2 Assigner les "Chef d'équipe" aux qualifiés CE restants
    for (let i = 0; i < unassigned.length; i++) {
      if (assignedCE >= neededCE) break;
      const v = unassigned[i];
      if (this.isCeQualified(v)) {
        rolesMap[v.id] = 'chef_equipe';
        assignedCE++;
        unassigned.splice(i, 1);
        i--;
      }
    }
    // Si déficit de CE officiels, promouvoir le secouriste PSE2 le plus expérimenté
    if (assignedCE < neededCE) {
      for (let i = 0; i < unassigned.length; i++) {
        if (assignedCE >= neededCE) break;
        const v = unassigned[i];
        if (this.isPse2Qualified(v) && v.rank !== 'Stagiaire') {
          rolesMap[v.id] = 'chef_equipe';
          assignedCE++;
          unassigned.splice(i, 1);
          i--;
        }
      }
    }

    // 3.3 Assigner les "Conducteur" aux titulaires du permis B
    // Priorité absolue : conducteur distinct qui n'est ni CP ni CE
    for (let i = 0; i < unassigned.length; i++) {
      if (assignedDrivers >= numVehicles) break;
      const v = unassigned[i];
      if (this.isDriverQualified(v) && !this.isCeQualified(v)) {
        rolesMap[v.id] = 'conducteur';
        assignedDrivers++;
        unassigned.splice(i, 1);
        i--;
      }
    }
    // Si aucun conducteur distinct restant parmi les équipiers non-cadres
    if (assignedDrivers < numVehicles) {
      for (let i = 0; i < unassigned.length; i++) {
        if (assignedDrivers >= numVehicles) break;
        const v = unassigned[i];
        if (this.isDriverQualified(v)) {
          rolesMap[v.id] = 'conducteur';
          assignedDrivers++;
          unassigned.splice(i, 1);
          i--;
        }
      }
    }

    // Cumul de conduite par le CE autorisé uniquement si aucun autre conducteur n'est disponible
    let ceCumulConduite = false;
    if (assignedDrivers < numVehicles) {
      const ceDriver = vols.find(v => rolesMap[v.id] === 'chef_equipe' && this.isDriverQualified(v));
      if (ceDriver) {
        ceCumulConduite = true;
        assignedDrivers++;
      }
    }

    // 3.4 Assigner les "Équipier-Secouriste" (titulaires PSE2) pour couvrir le quota
    // Quota : au moins 1 par équipe, 2 si possible (visant la composition optimale 1 CE + 2 PSE2 + 1 PSE1)
    const targetPse2 = Math.min(unassigned.length, numTeams * 2);
    for (let i = 0; i < unassigned.length; i++) {
      if (assignedPse2 >= targetPse2) break;
      const v = unassigned[i];
      if (this.isPse2Qualified(v) && v.rank !== 'Stagiaire') {
        rolesMap[v.id] = 'equipier';
        assignedPse2++;
        unassigned.splice(i, 1);
        i--;
      }
    }

    // 3.5 Assigner les "Secouriste" aux titulaires PSE1 restants
    for (let i = 0; i < unassigned.length; i++) {
      const v = unassigned[i];
      if (v.rank === 'Stagiaire') {
        rolesMap[v.id] = 'stagiaire';
      } else if (this.isPse2Qualified(v)) {
        rolesMap[v.id] = 'equipier';
      } else {
        rolesMap[v.id] = 'secouriste';
      }
    }

    // Application dans l'objet mission
    vols.forEach(v => {
      mission.volunteerRoles[v.id] = rolesMap[v.id] || 'secouriste';
    });

    // Dotation matérielle automatique : affecter au moins 1 Lot A par PSA / PMA si disponible en stock
    if (structures.totalFixedPosts > 0) {
      const ownedLotsA = (game.workplaceEquipment?.['lot_secours_a'] || 0) + (game.workplaceEquipment?.['lot_a'] || 0);
      if (ownedLotsA >= structures.totalFixedPosts) {
        mission.assignedEquipment = mission.assignedEquipment || {};
        mission.assignedEquipment.lot_secours_a = structures.totalFixedPosts;
      }
    }

    // 4. Mettre à jour les sélecteurs <select> dans l'interface DOM
    vols.forEach(v => {
      const selects = document.querySelectorAll(`select[onchange*="${v.id}"]`);
      selects.forEach(sel => {
        sel.value = mission.volunteerRoles[v.id];
      });
    });

    // Recalculer la conformité réglementaire de la convention
    const assignedVehs = (game.vehicles || []).filter(veh => (mission.requiredVehicles || []).includes(veh.type));
    const compliance = this.validateCrewCompliance(mission, vols, assignedVehs, game);

    game.saveGame();

    // Feedback joueur clair et complet
    if (game.showToast) {
      if (compliance.valid) {
        const parts = [];
        if (assignedCP > 0) parts.push(`${assignedCP} CP`);
        if (assignedCE > 0) parts.push(`${assignedCE} CE`);
        if (assignedDrivers > 0) parts.push(`${assignedDrivers} Conducteur${assignedDrivers > 1 ? 's' : ''}`);
        if (assignedPse2 > 0) parts.push(`${assignedPse2} PSE2`);
        const pse1Count = vols.filter(v => mission.volunteerRoles[v.id] === 'secouriste').length;
        if (pse1Count > 0) parts.push(`${pse1Count} PSE1`);

        game.showToast(
          'Auto-Rôles RNMSC Conformes ✓',
          `Dispositif optimisé (${parts.join(', ')}). Règle RNMSC 100% validée.${ceCumulConduite ? ' (Cumul de conduite par le CE).' : ''}`,
          'green'
        );
      } else {
        game.showToast(
          'Auto-Rôles : Dispositif Incomplet ⚠️',
          compliance.errors[0] || 'Dispositif non conforme au référentiel RNMSC.',
          'amber'
        );
      }
    }

    // Rafraîchir l'interface de détails si elle est ouverte
    if (game.selectedMissionId === missionId && typeof game.openMissionDetails === 'function') {
      game.openMissionDetails(missionId);
    }

    return compliance;
  },

  // Réclamation de subvention annuelle FDVA / Mairie
  claimAnnualGrant(game) {
    if (!game) game = window.game;
    const currentYear = game.clock?.year || 2026;
    if (game.lastAnnualGrantYear === currentYear) {
      game.showToast('Subvention Déjà Versée', `La dotation publique annuelle ${currentYear} a déjà été perçue pour cette année.`, 'orange');
      return;
    }

    const volCount = (game.volunteers || []).length;
    const missionsCount = (game.missions || []).filter(m => m.status === 'completed').length;
    
    // Subvention indexée sur l'activité : base 1 500 € + 120 € par bénévole actif + 80 € par mission accomplie
    const amount = Math.min(8500, 1500 + (volCount * 120) + (missionsCount * 80));

    game.resources.money = (game.resources.money || 0) + amount;
    game.lastAnnualGrantYear = currentYear;
    game.saveGame();
    game.updateStatsUI();

    game.showToast(
      'Subvention Publique Accordée ! 🏛️',
      `Le dossier FDVA & Mairie a été validé au titre de l'année ${currentYear} : +${amount} € versés sur le compte de l'antenne.`,
      'green'
    );
    window.ProtecConventions.renderModal(game);
  },

  // =========================================================================
  // GESTION DU CYCLE DE DEMANDE ET D'INSTRUCTION RÉALISTE DES CONVENTIONS
  // (SAMU, SDIS, SNCF, CUMP)
  // =========================================================================

  // Dépôt d'une demande de conventionnement par le joueur
  requestConvention(game, type) {
    if (!game) game = window.game;

    const convKey = type === 'samu' ? 'samuConvention' : (type === 'sdis' ? 'sdisConvention' : (type === 'sncf' ? 'sncfConvention' : 'cumpConvention'));
    game[convKey] = game[convKey] || {};

    if (game[convKey].signed) {
      game.showToast('Convention Active', 'Cette convention est déjà en vigueur.', 'blue');
      return;
    }
    if (game[convKey].requestStatus === 'instruction') {
      game.showToast('Instruction en Cours', 'Votre dossier est déjà entre les mains de la commission compétente.', 'blue');
      return;
    }

    // Définir la durée de l'instruction (en secondes de jeu : 60 à 120s pour dynamisme tout en étant différé)
    const timers = {
      samu: 90,
      sdis: 90,
      sncf: 75,
      cump: 120
    };
    const initialTimer = timers[type] || 90;

    game[convKey].requestStatus = 'instruction';
    game[convKey].reviewTimer = initialTimer;
    game[convKey].initialTimer = initialTimer;
    game[convKey].requestedAt = Date.now();
    game[convKey].rejectReason = null;

    const names = {
      samu: 'SAMU 15 (Centre Hospitalier Universitaire)',
      sdis: 'SDIS (État-Major des Sapeurs-Pompiers)',
      sncf: 'SNCF Voyageurs (Direction de Crise Nationale)',
      cump: 'Cellule CUMP (Coordination Médico-Psychologique SAMU 15)'
    };

    game.showToast(
      '📑 Dossier Déposé !',
      `Demande de conventionnement soumise au ${names[type] || type.toUpperCase()}. Le dossier est en cours d'instruction administrative.`,
      'blue'
    );

    if (window.ProtecNotifications && typeof window.ProtecNotifications.recordNotification === 'function') {
      window.ProtecNotifications.recordNotification({
        title: `📑 Demande déposée : ${names[type] || type.toUpperCase()}`,
        message: `Votre dossier de candidature partenariale est en cours d'examen auprès de l'autorité. Une décision motivée vous parviendra sous peu.`,
        category: 'conventions',
        level: 'info'
      });
    }

    game.saveGame();
    if (game.currentModalKey === 'conventions' && window.ProtecConventions && window.ProtecConventions.renderModal) {
      window.ProtecConventions.renderModal(game);
    }
  },

  // Vérification périodique des dossiers en cours d'instruction (appelée dans la boucle de jeu tick)
  checkConventionDecisions(game) {
    if (!game) return;
    const types = ['samu', 'sdis', 'sncf', 'cump'];

    types.forEach(type => {
      const convKey = type === 'samu' ? 'samuConvention' : (type === 'sdis' ? 'sdisConvention' : (type === 'sncf' ? 'sncfConvention' : 'cumpConvention'));
      const conv = game[convKey];
      if (!conv || conv.signed || conv.requestStatus !== 'instruction') return;

      conv.reviewTimer = (conv.reviewTimer || 60) - 1;
      if (conv.reviewTimer <= 0) {
        this.evaluateConventionDecision(game, type);
      }
    });
  },

  // Évaluation réaliste de la demande : acceptation ou rejet motivé selon l'implantation
  evaluateConventionDecision(game, type) {
    const convKey = type === 'samu' ? 'samuConvention' : (type === 'sdis' ? 'sdisConvention' : (type === 'sncf' ? 'sncfConvention' : 'cumpConvention'));
    const conv = game[convKey] || {};

    const completedDps = (game.missions || []).filter(m => m.status === 'completed' && m.type !== 'formation').length;
    const totalVols = (game.volunteers || []).filter(v => !v.isBurnout && v.status !== 'burnout').length;
    const vpsps = (game.vehicles || []).filter(v => v.type === 'VPSP' && v.status !== 'panne').length;
    const allVehs = (game.vehicles || []).filter(v => v.status !== 'panne').length;
    const ceQualified = (game.volunteers || []).filter(v => ['CE', 'CP', 'CD'].includes(v.rank) || (v.skills || []).includes('CE')).length;
    const pseQualified = (game.volunteers || []).filter(v => ['PSE2', 'PSE1', 'CE', 'CP'].includes(v.rank)).length;

    let accepted = true;
    let reasons = [];

    if (type === 'samu') {
      const samuRep = game.reputation_samu !== undefined ? game.reputation_samu : 50;
      if (!game.aascConvention?.signed) {
        accepted = false;
        reasons.push("Absence de Convention Préfectorale d'AASC en cours de validité (cadre légal régalien obligatoire).");
      }
      if (vpsps < 1) {
        accepted = false;
        reasons.push("Absence d'ambulance de premiers secours à personnes (VPSP) opérationnelle dans votre parc roulant.");
      }
      if (pseQualified < 3) {
        accepted = false;
        reasons.push("Effectif secouriste insuffisant : un équipage complet d'équipiers PSE et d'un Chef d'équipe qualifié est indispensable pour les départs réflexes.");
      }
      if (completedDps < 3) {
        accepted = false;
        reasons.push("Antécédents opérationnels insuffisants : l'antenne doit d'abord démontrer sa régularité et sa rigueur sur le terrain via des postes de secours.");
      }
      if (samuRep < 45) {
        accepted = false;
        reasons.push("Niveau de réputation et de confiance auprès du SAMU 15 insuffisant pour intégrer le dispositif de régulation d'urgence.");
      }
    } else if (type === 'sdis') {
      const sdisRep = game.reputation_sdis !== undefined ? game.reputation_sdis : 50;
      if (!game.aascConvention?.signed) {
        accepted = false;
        reasons.push("Agrément de Sécurité Civile (AASC) non validé par les autorités préfectorales.");
      }
      if (vpsps < 1) {
        accepted = false;
        reasons.push("Aucun véhicule de premiers secours à personnes (VPSP) disponible pour assurer les gardes caserne.");
      }
      if (pseQualified < 3) {
        accepted = false;
        reasons.push("Équipage secouriste incomplet pour assurer la continuité des vacations en centre de secours.");
      }
      if (completedDps < 3) {
        accepted = false;
        reasons.push("Expérience opérationnelle sur le terrain encore trop limitée pour intégrer les renforts départementaux du SDIS.");
      }
      if (sdisRep < 42) {
        accepted = false;
        reasons.push("Niveau de réputation et d'implantation auprès de l'État-Major SDIS encore fragile.");
      }
    } else if (type === 'sncf') {
      if (allVehs < 1) {
        accepted = false;
        reasons.push("Aucun véhicule logistique ou de transport disponible pour l'acheminement des lots de crise en gare.");
      }
      if (totalVols < 4) {
        accepted = false;
        reasons.push("Effectif bénévole mobilisable trop restreint pour garantir une équipe de réconfort en gare.");
      }
      if (completedDps < 2) {
        accepted = false;
        reasons.push("Expérience d'encadrement de foule insuffisante sur des rassemblements grand public.");
      }
    } else if (type === 'cump') {
      const samuRep = game.reputation_samu !== undefined ? game.reputation_samu : 50;
      if (totalVols < 10) {
        accepted = false;
        reasons.push("Capacité de mobilisation H24 insuffisante pour assurer la rotation continue des équipes du Centre d'Accueil des Impliqués.");
      }
      if (allVehs < 2) {
        accepted = false;
        reasons.push("Flotte véhiculaire trop réduite pour assurer le transport simultané des personnels et des malles d'urgence.");
      }
      if (!game.aascConvention?.signed) {
        accepted = false;
        reasons.push("Absence des Agréments Nationaux A & B de Sécurité Civile délivrés par le Ministère de l'Intérieur.");
      }
      if (completedDps < 5) {
        accepted = false;
        reasons.push("Solidité et maturité opérationnelle de l'antenne non confirmées sur des événements de grande ampleur.");
      }
      if (samuRep < 55) {
        accepted = false;
        reasons.push("Niveau de réputation et d'accréditation médico-psychologique insuffisant auprès de la coordination hospitalière.");
      }
    }

    const partnerNames = {
      samu: 'SAMU 15',
      sdis: 'SDIS 18',
      sncf: 'SNCF Voyageurs',
      cump: 'Cellule CUMP SAMU 15'
    };
    const titlePartner = partnerNames[type] || type.toUpperCase();

    if (accepted) {
      conv.requestStatus = 'accepted';
      conv.rejectReason = null;

      game.showToast(
        `Convention ${titlePartner} Acceptée ! 🎉`,
        `La direction a statué favorablement sur votre dossier de conventionnement ! Vous pouvez désormais parapher la convention.`,
        'green'
      );

      if (window.ProtecNotifications && typeof window.ProtecNotifications.recordNotification === 'function') {
        window.ProtecNotifications.recordNotification({
          title: `✅ Convention ${titlePartner} Acceptée`,
          message: `Votre demande de conventionnement a été validée par la commission. Cliquez sur le module Conventions pour signer et ratifier le partenariat.`,
          category: 'conventions',
          level: 'success'
        });
      }
    } else {
      conv.requestStatus = 'rejected';
      conv.rejectReason = reasons.join(' • ');

      game.showToast(
        `Demande ${titlePartner} Ajournée ⚠️`,
        `La commission a ajourné votre demande : ${reasons[0] || 'Critères d’implantation insuffisants.'}`,
        'red'
      );

      if (window.ProtecNotifications && typeof window.ProtecNotifications.recordNotification === 'function') {
        window.ProtecNotifications.recordNotification({
          title: `⚠️ Demande ${titlePartner} Ajournée`,
          message: `Votre antenne est encore trop récente ou incomplète pour ce partenaire. Motif : ${conv.rejectReason}. Développez votre antenne avant de renouveler la demande.`,
          category: 'conventions',
          level: 'alert'
        });
      }
    }

    game.saveGame();
    if (game.currentModalKey === 'conventions' && window.ProtecConventions && window.ProtecConventions.renderModal) {
      window.ProtecConventions.renderModal(game);
    }
  },

  // =========================================================================
  // MOTEUR DE TIMELINE MULTI-ÉTAPES (URGENCES / ALERTES NON PLANIFIÉES)
  // =========================================================================

  // Calcul de la distance routière avec facteur de détour (Haversine * 1.25)
  calculateRoadDistanceKm(p1, p2, detourFactor = 1.25) {
    if (!p1 || !p2) return 1.5;
    const lat1 = Number(p1.lat || 0);
    const lng1 = Number(p1.lng || 0);
    const lat2 = Number(p2.lat || 0);
    const lng2 = Number(p2.lng || 0);
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const directKm = R * c;
    return Math.max(0.6, Math.round(directKm * detourFactor * 10) / 10);
  },

  // 1. Initialiser et enregistrer les 6 jalons temporels stricts pour une mission d'urgence
  creerTimelineUrgence(game, mission, crewVolunteers = [], vehicle = null, baseStation = null) {
    if (!mission) return null;
    const base = baseStation || game?.stations?.find(s => s.id === vehicle?.stationId) || game?.stations?.[0] || { lat: 48.8566, lng: 2.3522 };

    // 1. Identifier l'équipage engagé et le bénévole au plus long délai de ralliement
    let crew = Array.isArray(crewVolunteers) && crewVolunteers.length > 0 ? [...crewVolunteers] : [];
    if (crew.length === 0 && Array.isArray(mission.registeredVolunteers) && mission.registeredVolunteers.length > 0) {
      crew = mission.registeredVolunteers.map(vid => (game?.volunteers || []).find(v => v.id === vid)).filter(Boolean);
    }
    if (crew.length === 0 && Array.isArray(mission.assignedCrew?.volunteers) && mission.assignedCrew.volunteers.length > 0) {
      crew = mission.assignedCrew.volunteers.map(v => typeof v === 'object' ? v : (game?.volunteers || []).find(x => x.id === v)).filter(Boolean);
    }

    // S'assurer de la présence des adresses et temps de ralliement des secouristes
    if (window.ProtecPersonnel && typeof window.ProtecPersonnel.ensureVolunteerResidence === 'function') {
      crew.forEach(v => window.ProtecPersonnel.ensureVolunteerResidence(v, game));
    }

    let slowestVolunteer = null;
    let maxRallyMinutes = 0;

    crew.forEach(v => {
      // Si déjà en garde postée à la caserne/antenne : temps de ralliement nul
      const isAlreadyOnBase = v.isOnBase === true || v.status === 'garde_caserne' || v.status === 'sdis_caserne';
      const rally = isAlreadyOnBase ? 0 : (v.temps_ralliement_minutes !== undefined ? Number(v.temps_ralliement_minutes) : 10);
      if (!slowestVolunteer || rally > maxRallyMinutes) {
        maxRallyMinutes = rally;
        slowestVolunteer = v;
      }
    });

    if (maxRallyMinutes <= 0) {
      maxRallyMinutes = crew.length === 0 ? 8 : 4; // Délai incompressible minimum
    }

    // Coordonnées géographiques strictes
    const coords_domicile_max = (slowestVolunteer && slowestVolunteer.coords_domicile) ? {
      lat: Number(slowestVolunteer.coords_domicile.lat),
      lng: Number(slowestVolunteer.coords_domicile.lng)
    } : {
      lat: Number(base.lat) + 0.022,
      lng: Number(base.lng) + 0.018
    };

    const coords_base = {
      lat: Number(base.lat || 48.8566),
      lng: Number(base.lng || 2.3522)
    };

    const coords_mission = {
      lat: Number(mission.lat || base.lat),
      lng: Number(mission.lng || base.lng)
    };

    // Calculs routiers selon vitesses réalistes
    // Base -> Mission : véhicule d'urgence avec gyrophare à ~65 km/h
    const distBaseMissionKm = this.calculateRoadDistanceKm(coords_base, coords_mission, 1.25);
    const dureeAllerSec = Math.max(50, Math.round((distBaseMissionKm / 65) * 3600));

    // Mission -> Base : retour en allure normale à ~58 km/h
    const dureeRetourSec = Math.max(50, Math.round((distBaseMissionKm / 58) * 3600));

    // Durée sur place de l'intervention opérationnelle
    const dureeInterventionSec = mission.durationSeconds || Math.max(600, Math.round((mission.durationHours ? mission.durationHours * 3600 : 1200)));

    // Durée de ralliement du bénévole le plus lent (en secondes)
    const dureeRalliementSec = Math.max(90, Math.round(maxRallyMinutes * 60));

    // Horodatages stricts des 6 jalons (timestamptz)
    const t_alerte_ms = Number(mission.startedAt || Date.now());
    const t_arrivee_base_ms = t_alerte_ms + (dureeRalliementSec * 1000);
    const t_depart_base_ms = t_arrivee_base_ms + (2 * 60 * 1000); // 2 minutes fixes d'embarquement / armement
    const t_arrivee_mission_ms = t_depart_base_ms + (dureeAllerSec * 1000);
    const t_fin_mission_ms = t_arrivee_mission_ms + (dureeInterventionSec * 1000);
    const t_retour_base_ms = t_fin_mission_ms + (dureeRetourSec * 1000);

    // Enregistrement des jalons ISO timestamptz
    mission.t_alerte = new Date(t_alerte_ms).toISOString();
    mission.t_arrivee_base = new Date(t_arrivee_base_ms).toISOString();
    mission.t_depart_base = new Date(t_depart_base_ms).toISOString();
    mission.t_arrivee_mission = new Date(t_arrivee_mission_ms).toISOString();
    mission.t_fin_mission = new Date(t_fin_mission_ms).toISOString();
    mission.t_retour_base = new Date(t_retour_base_ms).toISOString();

    // Cache numérique pour calculs d'interpolation rapides
    mission.timeline_milestones = {
      t_alerte: t_alerte_ms,
      t_arrivee_base: t_arrivee_base_ms,
      t_depart_base: t_depart_base_ms,
      t_arrivee_mission: t_arrivee_mission_ms,
      t_fin_mission: t_fin_mission_ms,
      t_retour_base: t_retour_base_ms
    };

    mission.coords_domicile_max = coords_domicile_max;
    mission.coords_base = coords_base;
    mission.coords_mission = coords_mission;
    mission.dist_base_mission_km = distBaseMissionKm;

    mission.slowest_volunteer = {
      id: slowestVolunteer?.id || null,
      name: slowestVolunteer?.name || 'Secouriste',
      rallyMinutes: maxRallyMinutes
    };

    mission.isTimelineUrgence = true;
    mission.timeline_phase = 1;
    mission.endsAt = t_retour_base_ms;
    mission.durationSeconds = Math.round((t_retour_base_ms - t_alerte_ms) / 1000);

    // Synchronisation vers Supabase si en ligne
    if (window.ProtecSupabase && game?.player?.id) {
      window.ProtecSupabase.registerMissionOnServer(mission, game.player.id);
    }

    return {
      t_alerte: mission.t_alerte,
      t_arrivee_base: mission.t_arrivee_base,
      t_depart_base: mission.t_depart_base,
      t_arrivee_mission: mission.t_arrivee_mission,
      t_fin_mission: mission.t_fin_mission,
      t_retour_base: mission.t_retour_base,
      coords_domicile_max,
      coords_base,
      coords_mission,
      distBaseMissionKm,
      maxRallyMinutes
    };
  },

  // Alias pour initialisation de timeline
  initMissionTimeline(game, mission, crewVolunteers, vehicle, baseStation) {
    return this.creerTimelineUrgence(game, mission, crewVolunteers, vehicle, baseStation);
  },

  // Widget visuel réactif de la timeline pour l'affichage dans les détails de mission
  renderTimelineWidget(mission, tempsActuel = null) {
    if (!mission || !mission.timeline_milestones) return '';
    const now = tempsActuel ? Number(tempsActuel) : Date.now();
    const pos = window.ProtecSystems?.calculerPositionActuelle ? window.ProtecSystems.calculerPositionActuelle(mission, now) : { phase: 1, ratio: 0, status: 'En cours' };
    const m = mission.timeline_milestones;

    const formatHour = (epochMs) => {
      const d = new Date(epochMs);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const steps = [
      { id: 1, label: 'Alerte & Ralliement', sub: `${mission.slowest_volunteer?.name || 'Secouriste'} (${mission.slowest_volunteer?.rallyMinutes || 10} min)`, time: formatHour(m.t_alerte), icon: '🏃' },
      { id: 2, label: 'Arrivée Base', sub: 'Équipage réuni', time: formatHour(m.t_arrivee_base), icon: '🏢' },
      { id: 3, label: 'Départ Urgent', sub: 'Armement 2 min (Gyro)', time: formatHour(m.t_depart_base), icon: '🚨' },
      { id: 4, label: 'Sur les lieux', sub: 'Intervention soins', time: formatHour(m.t_arrivee_mission), icon: '🏥' },
      { id: 5, label: 'Fin Intervention', sub: 'Bilan & départ retour', time: formatHour(m.t_fin_mission), icon: '📋' },
      { id: 6, label: 'Retour Base', sub: 'Statut 1 disponible', time: formatHour(m.t_retour_base), icon: '🏁' }
    ];

    return `
      <div class="p-4 rounded-3xl bg-slate-900 text-white shadow-xl space-y-3.5 border border-slate-800">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full ${pos.phase === 6 ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}"></span>
            <span class="text-xs font-black uppercase tracking-wider text-slate-200">Timeline Temporelle Opérationnelle</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
            pos.phase === 1 ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
            pos.phase === 2 ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' :
            pos.phase === 3 ? 'bg-red-500/20 text-red-300 border border-red-400/30 animate-pulse' :
            pos.phase === 4 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
            pos.phase === 5 ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30' :
            'bg-emerald-600 text-white'
          }">
            Étape ${pos.phase}/6 : ${pos.status}
          </span>
        </div>

        <!-- Jauge d'avancement globale -->
        <div class="space-y-1">
          <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div class="bg-gradient-to-r from-blue-500 via-orange-500 to-emerald-500 h-full rounded-full transition-all duration-500" style="width: ${Math.round((pos.totalProgress || 0) * 100)}%"></div>
          </div>
          <div class="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Déclenchement : ${formatHour(m.t_alerte)}</span>
            <span>Clôture estimée : ${formatHour(m.t_retour_base)}</span>
          </div>
        </div>

        <!-- Grille des 6 jalons -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 text-[10px]">
          ${steps.map(s => {
            const isCurrent = pos.phase === s.id;
            const isDone = pos.phase > s.id;
            return `
              <div class="p-2.5 rounded-2xl border transition-all ${
                isCurrent ? 'bg-pc-blue/30 border-pc-orange ring-1 ring-orange-400 shadow-md text-white' :
                isDone ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200' :
                'bg-slate-800/60 border-slate-700 text-slate-400'
              }">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs">${s.icon}</span>
                  <span class="font-mono text-[9px] ${isCurrent ? 'text-orange-300 font-bold' : isDone ? 'text-emerald-400 font-semibold' : 'text-slate-400'}">${s.time}</span>
                </div>
                <div class="font-extrabold line-clamp-1 ${isCurrent ? 'text-white' : ''}">${s.label}</div>
                <div class="text-[9px] text-slate-400 line-clamp-1">${s.sub}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // --- 8. FILTRAGE DE CAPACITÉ OPÉRATIONNELLE & INJECTION DES CONVENTIONS MENSUELLES ---
  calculateEventTheoreticalNeeds(evt) {
    const n = Number(evt.public_instantane) || 1000;
    
    // Grille RIS réglementaire : p1 (comportement public), p2 (âge/environnement), e1 (terrain), e2 (délai d'accès secours)
    let p1 = 0.25;
    let p2 = 0.25;
    if (evt.activite_risque === 'élevé') {
      p1 = 0.40;
      p2 = 0.35;
    } else if (evt.activite_risque === 'moyen') {
      p1 = 0.30;
      p2 = 0.30;
    }

    let e1 = 0.25;
    let e2 = 0.25;
    if (evt.environnement === 'dynamique_course') {
      e1 = 0.35;
      e2 = 0.35;
    } else if (evt.environnement === 'ouvert_urbain') {
      e1 = 0.30;
      e2 = 0.30;
    }

    // Majoration si éloignement des secours publics (> 20 min)
    if (Number(evt.delai_acces_secours_minutes || 10) > 20) {
      e2 += 0.05;
    }

    const i = p1 + p2 + e1 + e2;
    const ris = (i * n) / 1000;

    let scale = 'PAPS';
    let minVolunteers = 2;
    let requiredVehicles = [];
    let requiredLots = [];

    if (ris <= 0.25) {
      scale = 'PAPS';
      minVolunteers = 2;
      requiredLots = ['lot_b'];
    } else if (ris <= 1.15) {
      scale = 'DPS-PE';
      minVolunteers = 4;
      requiredVehicles = ['VPSP'];
      requiredLots = ['lot_b'];
    } else if (ris <= 12) {
      scale = 'DPS-ME';
      minVolunteers = Math.max(8, Math.min(22, Math.round(ris * 2.2)));
      requiredVehicles = ['VPSP', 'VTU'];
      requiredLots = ['lot_a', 'lot_b'];
    } else {
      scale = 'DPS-GE';
      minVolunteers = Math.max(24, Math.min(60, Math.round(ris * 2.5)));
      requiredVehicles = ['VPSP', 'VPSP', 'VTU'];
      requiredLots = ['lot_a', 'lot_b'];
    }

    const requiredCP = (requiredLots.includes('lot_a') || minVolunteers >= 6) ? 1 : 0;
    const requiredCE = Math.max(1, Math.ceil(minVolunteers / 4));

    return {
      ris: parseFloat(ris.toFixed(2)),
      scale,
      minVolunteers,
      requiredCP,
      requiredCE,
      requiredVehicles,
      requiredLots
    };
  },

  filterAndInjectMonthlyEvents(game, eventsList, deptInfo) {
    if (!game || !Array.isArray(eventsList) || eventsList.length === 0) return [];

    if (!Array.isArray(game.devis)) game.devis = [];

    // Moyens réels de l'antenne
    const activeVols = (game.volunteers || []).filter(v => !v.isBurnout && v.status !== 'burnout');
    const totalSecouristes = activeVols.length;
    const ceCount = activeVols.filter(v => (this.isCeQualified ? this.isCeQualified(v) : (['CE', 'CP', 'CD'].includes(v.rank) || (v.skills || []).includes('CE')))).length;
    const cpCount = activeVols.filter(v => (this.isCpQualified ? this.isCpQualified(v) : (['CP', 'CD'].includes(v.rank) || (v.skills || []).includes('CP')))).length;
    const driverCount = activeVols.filter(v => (this.isDriverQualified ? this.isDriverQualified(v) : (v.isDriver || (v.permis && v.permis.includes('B'))))).length;

    const activeVehicles = (game.vehicles || []).filter(veh => veh.status !== 'panne' && veh.ctStatus !== 'expire');
    const vpspCount = activeVehicles.filter(veh => veh.type === 'VPSP').length;

    const communes = (window.ProtecDepartements && typeof window.ProtecDepartements.getCommunesForDepartment === 'function')
      ? window.ProtecDepartements.getCommunesForDepartment(deptInfo.code)
      : [];

    const injected = [];
    const year = game.clock.year || new Date().getFullYear();
    const month = game.clock.month ?? new Date().getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    eventsList.forEach((evt, idx) => {
      const needs = this.calculateEventTheoreticalNeeds(evt);
      const ratioVols = needs.minVolunteers > 0 ? (totalSecouristes / needs.minVolunteers) : 1;
      const needsVpsp = needs.requiredVehicles.includes('VPSP');

      let accepted = false;
      let isJointMission = false;
      let finalScale = needs.scale;
      let finalReqVols = needs.minVolunteers;
      let finalReqVehs = [...needs.requiredVehicles];
      let eventTitle = evt.nom;
      const roundedPub = typeof window.roundExpectedPublic === 'function' ? window.roundExpectedPublic(evt.public_instantane) : Math.round(Number(evt.public_instantane) || 100);
      let clientDesc = `Événement organisé à ${evt.commune} (${evt.type}). Public attendu : ${Number(roundedPub).toLocaleString('fr-FR')} personnes.`;

      // Ancrage territorial : Réputation individualisée de la commune hôte
      const cityRepScore = (game.reputation_villes && game.reputation_villes[evt.commune]) !== undefined ? game.reputation_villes[evt.commune] : 50;

      // Si la réputation sur cette commune est dégradée (< 25 pts), la Mairie sollicite une association concurrente
      if (cityRepScore < 25 && Math.random() < 0.45) {
        return; // Éviction par la concurrence locale
      }

      // Si réputation élevée (≥ 65 pts), budget organisateur bonifié de +25%
      let budgetOrganisateur = evt.budget_max_organisateur || 500;
      if (cityRepScore >= 65) {
        budgetOrganisateur = Math.round(budgetOrganisateur * 1.25);
      }

      // BRANCHE 1 : L'antenne dispose d'au moins 60 % des moyens nécessaires
      if (ratioVols >= 0.60 && (!needsVpsp || vpspCount >= 1)) {
        accepted = true;
        isJointMission = false;
      }
      // BRANCHE 2 : Dispositif d'envergure majeure (hors de portée globale), transformé en mission conjointe
      else if (needs.minVolunteers >= 8 || needs.scale === 'DPS-ME' || needs.scale === 'DPS-GE') {
        // L'antenne est capable d'armer un sous-secteur autonome (au moins 3 ou 4 secouristes dont 1 CE)
        if (totalSecouristes >= 3 && ceCount >= 1) {
          accepted = true;
          isJointMission = true;
          finalScale = 'DPS-PE (Secteur Conjoint)';
          finalReqVols = 4;
          finalReqVehs = vpspCount >= 1 ? ['VPSP'] : [];
          eventTitle = `[Renfort Conjoint] ${evt.nom} (Secteur ${evt.commune})`;
          clientDesc = `Dispositif d'envergure majeure (${Number(evt.public_instantane).toLocaleString('fr-FR')} personnes). Votre antenne prend en charge un secteur dédié (4 secouristes + 1 VPSP en coordination avec l'ADPC et les autres antennes).`;
        }
      }
      // BRANCHE 3 : Antenne trop débutante (incapable d'armer même un secteur)
      // Si totalSecouristes < 2 ou pas de cadre disponible : exclu !
      if (!accepted) {
        return; // Exclure la demande pour éviter d'inonder le joueur
      }

      // Éviter les doublons
      if (game.devis.some(d => d.eventName === eventTitle && ['pending', 'previsionnel', 'sent', 'signed'].includes(d.status))) {
        return;
      }

      // Coordonnées géographiques de la commune hôte
      const comObj = communes.find(c => c.nom.toLowerCase() === (evt.commune || '').toLowerCase());
      const baseLat = comObj ? comObj.lat : (deptInfo.lat || 48.85);
      const baseLng = comObj ? comObj.lng : (deptInfo.lng || 2.35);
      const lat = parseFloat((baseLat + (Math.random() - 0.5) * 0.02).toFixed(4));
      const lng = parseFloat((baseLng + (Math.random() - 0.5) * 0.02).toFixed(4));

      // Date répartie sur le mois virtuel
      const dayNum = Math.min(daysInMonth, Math.max(2, 3 + (idx * 4) + Math.floor(Math.random() * 3)));
      const eventDateObj = new Date(year, month, dayNum);
      const daysNames = game.clock.daysNames || ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const monthsNames = game.clock.monthsNames || ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      
      const startHour = (evt.type === 'festif' || evt.nom.toLowerCase().includes('nocturne') || evt.nom.toLowerCase().includes('concert')) ? 19 : 14;
      const endHour = (startHour + (evt.duree_heures || 4)) % 24;

      const eventDate = {
        year: year,
        month: month,
        day: dayNum,
        hour: startHour,
        minute: 0,
        startHour: startHour,
        endHour: endHour,
        dayName: daysNames[eventDateObj.getDay()],
        monthName: monthsNames[month]
      };

      const daysAhead = Math.max(1, dayNum - (game.clock.day || 1));
      const validitySeconds = Math.max(3600 * 12, (daysAhead * 3600 * 6));

      // Création de l'objet convention / devis
      const newDevis = {
        id: `dev-real-${deptInfo.code}-${evt.id || idx}-${Date.now()}`,
        eventName: eventTitle,
        clientName: isJointMission ? `COZ & ADPC ${deptInfo.code}` : `Comité d'Organisation - ${evt.commune}`,
        clientType: evt.type === 'sport' ? 'club_sportif' : (evt.type === 'foire' ? 'professionnel' : 'association'),
        commune: evt.commune,
        address: (typeof game.generateRealisticStreetAddress === 'function') 
          ? game.generateRealisticStreetAddress(evt.commune, lat, lng)
          : `${evt.commune} Centre`,
        lat: lat,
        lng: lng,
        eventDate: eventDate,
        durationHours: evt.duree_heures || 4,
        publicCount: `${Number(roundedPub).toLocaleString('fr-FR')} personnes`,
        rawPublicCount: roundedPub,
        environment: evt.environnement || 'ouvert_urbain',
        emergencyAccess: `${evt.delai_acces_secours_minutes || 15} min`,
        riskLevel: evt.activite_risque || 'moyen',
        scale: finalScale,
        requiredVolunteers: finalReqVols,
        requiredVehicles: finalReqVehs,
        hiddenMinVolunteers: finalReqVols,
        hiddenRequiredSkills: isJointMission ? ['CE', 'PSE2', 'PSE1'] : (needs.requiredCP > 0 ? ['CP', 'CE', 'PSE2'] : ['CE', 'PSE2']),
        status: 'pending',
        isJointMission: isJointMission,
        isMonthlyRealEvent: true,
        secondsLeft: validitySeconds,
        daysAhead: daysAhead,
        budgetMax: evt.budget_max_organisateur || 500,

        // RÈGLE OBLIGATOIRE : Le joueur dimensionne lui-même son poste (pas d'auto-remplissage)
        configuredScale: '',
        configuredVolunteers: 0,
        configuredCE: 0,
        configuredCP: 0,
        configuredVehicles: [],
        configuredLots: [],
        proposedPrice: null,
        sollicitationSent: false,
        relancesCount: 0
      };

      game.devis.push(newDevis);
      injected.push(newDevis);
    });

    if (injected.length > 0) {
      if (typeof game.showToast === 'function') {
        game.showToast(
          'Nouveau Calendrier DPS 📅',
          `${injected.length} demande(s) de conventions reçue(s) pour le mois (${deptInfo.name}) ! Dimensionnez vos postes dans l'onglet Devis.`,
          'blue'
        );
      }
      if (window.ProtecNotifications && typeof window.ProtecNotifications.recordNotification === 'function') {
        window.ProtecNotifications.recordNotification({
          title: '📅 Nouvelles Conventions Mensuelles',
          message: `${injected.length} événements réels proposés pour le mois dans le ${deptInfo.name}. Rendez-vous dans le module Devis pour dimensionner vos dispositifs.`,
          category: 'dps',
          level: 'info'
        });
      }
    }

    return injected;
  }
,

  // Méthodes d'ajustement de la réputation communale et institutionnelle
  adjustLocalReputation(game, cityName, delta, reason = '') {
    if (!game || !cityName) return;
    game.reputation_villes = game.reputation_villes || {};
    const current = game.reputation_villes[cityName] !== undefined ? game.reputation_villes[cityName] : 50;
    const updated = Math.max(0, Math.min(100, current + delta));
    game.reputation_villes[cityName] = updated;

    if (delta > 0 && updated >= 65 && current < 65) {
      if (game.showToast) {
        game.showToast('Partenaire Privilégié 🌟', `La Mairie de ${cityName} élève votre antenne au rang de partenaire privilégié (budgets rehaussés et accès aux infrastructures) !`, 'green');
      }
    } else if (delta < 0 && updated < 25 && current >= 25) {
      if (game.showToast) {
        game.showToast('Alerte Concurrence ⚠️', `La Mairie de ${cityName} est mécontente (réputation < 25). Elle envisage de faire appel à une association concurrente.`, 'red');
      }
    }
  },

  adjustInstitutionalReputation(game, institution, delta, reason = '') {
    if (!game) return;
    if (institution === 'samu') {
      game.reputation_samu = Math.max(0, Math.min(100, (game.reputation_samu || 50) + delta));
    } else if (institution === 'sdis') {
      game.reputation_sdis = Math.max(0, Math.min(100, (game.reputation_sdis || 50) + delta));
    } else if (institution === 'prefecture') {
      game.reputation_prefecture = Math.max(0, Math.min(100, (game.reputation_prefecture || 50) + delta));
    }
  },
};

// Export direct des méthodes RNMSC, conventions et de timeline sur window.ProtecConventions
if (window.ProtecConventions && window.ProtecRNMSC) {
  if (typeof window.ProtecRNMSC.requestConvention === 'function') {
    window.ProtecConventions.requestConvention = window.ProtecRNMSC.requestConvention.bind(window.ProtecRNMSC);
  }
  if (typeof window.ProtecRNMSC.checkConventionDecisions === 'function') {
    window.ProtecConventions.checkConventionDecisions = window.ProtecRNMSC.checkConventionDecisions.bind(window.ProtecRNMSC);
  }
  if (typeof window.ProtecRNMSC.evaluateConventionDecision === 'function') {
    window.ProtecConventions.evaluateConventionDecision = window.ProtecRNMSC.evaluateConventionDecision.bind(window.ProtecRNMSC);
  }
  if (typeof window.ProtecRNMSC.adjustLocalReputation === 'function') {
    window.ProtecConventions.adjustLocalReputation = window.ProtecRNMSC.adjustLocalReputation.bind(window.ProtecRNMSC);
  }
  if (typeof window.ProtecRNMSC.adjustInstitutionalReputation === 'function') {
    window.ProtecConventions.adjustInstitutionalReputation = window.ProtecRNMSC.adjustInstitutionalReputation.bind(window.ProtecRNMSC);
  }
  if (typeof window.ProtecRNMSC.claimAnnualGrant === 'function') {
    window.ProtecConventions.claimAnnualGrant = window.ProtecRNMSC.claimAnnualGrant.bind(window.ProtecRNMSC);
  }
  if (typeof window.ProtecRNMSC.getDeployedStructures === 'function') {
    window.ProtecConventions.getDeployedStructures = window.ProtecRNMSC.getDeployedStructures.bind(window.ProtecRNMSC);
  }
  if (typeof window.ProtecRNMSC.validateCrewCompliance === 'function') {
    window.ProtecConventions.validateCrewCompliance = window.ProtecRNMSC.validateCrewCompliance.bind(window.ProtecRNMSC);
  }
  if (typeof window.ProtecRNMSC.autoAssignMissionRoles === 'function') {
    window.ProtecConventions.autoAssignMissionRoles = window.ProtecRNMSC.autoAssignMissionRoles.bind(window.ProtecRNMSC);
  }
  if (typeof window.ProtecRNMSC.calculateRoadDistanceKm === 'function') {
    window.ProtecConventions.calculateRoadDistanceKm = window.ProtecRNMSC.calculateRoadDistanceKm.bind(window.ProtecRNMSC);
  }
  if (typeof window.ProtecRNMSC.creerTimelineUrgence === 'function') {
    window.ProtecConventions.creerTimelineUrgence = window.ProtecRNMSC.creerTimelineUrgence.bind(window.ProtecRNMSC);
  }
  if (typeof window.ProtecRNMSC.initMissionTimeline === 'function') {
    window.ProtecConventions.initMissionTimeline = window.ProtecRNMSC.initMissionTimeline.bind(window.ProtecRNMSC);
  }
  if (typeof window.ProtecRNMSC.renderTimelineWidget === 'function') {
    window.ProtecConventions.renderTimelineWidget = window.ProtecRNMSC.renderTimelineWidget.bind(window.ProtecRNMSC);
  }
}

