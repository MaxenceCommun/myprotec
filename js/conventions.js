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

    modal.classList.remove('hidden');
    title.textContent = 'Conventions Opérationnelles & Partenariats Officiels';
    subtitle.textContent = 'Accords-cadres avec les services de l\'État, SAMU, SDIS, SNCF et collectivités territoriales';
    icon.setAttribute('data-lucide', 'file-text');

    const cump = game.cumpConvention || {};
    const sdis = game.sdisGarde || {};

    body.innerHTML = `
      <div class="space-y-6">

        <!-- En-tête informatif -->
        <div class="p-4 rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-pc-blue text-white shadow-xl flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl">
              📜
            </div>
            <div>
              <h4 class="text-base font-black">Conventions Officielles d'Antenne</h4>
              <p class="text-xs text-white/80">Partenariats formels définissant les astreintes, indemnisations et obligations de service.</p>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Cadre Réglementaire
          </span>
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
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${game.samuConvention?.signed ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}">
                  ${game.samuConvention?.signed ? 'Convention Signée ✓' : 'Non Signée'}
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
                  <span>Prérequis :</span>
                  <span>Convention AASC, 1 VPSP, 3 secouristes qualifiés</span>
                </div>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              ${game.samuConvention?.signed ? `
                <button onclick="window.game.openModule('samu')" class="px-3.5 py-1.5 rounded-xl bg-pc-blue hover:brightness-110 text-white font-extrabold text-xs shadow-sm transition">
                  Gérer la Garde SAMU 15
                </button>
                <button onclick="window.game.terminateSamuConvention()" class="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition border border-rose-200">
                  Résilier
                </button>
              ` : `
                <button onclick="window.game.signSamuConvention()" ${!game.aascConvention?.signed ? 'disabled class="w-full px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed"' : 'class="w-full px-3.5 py-1.5 rounded-xl bg-pc-blue hover:brightness-110 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"'}>
                  <span>✍️</span>
                  <span>Signer la Convention SAMU 15 (+350 €)</span>
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
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${game.sdisConvention?.signed ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}">
                  ${game.sdisConvention?.signed ? 'Convention Signée ✓' : 'Non Signée'}
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
                  <span>Prérequis :</span>
                  <span>Convention AASC, 1 VPSP, 3 secouristes</span>
                </div>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              ${game.sdisConvention?.signed ? `
                <button onclick="window.game.openModule('pompiers')" class="px-3.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs shadow-sm transition">
                  Gérer la Garde SDIS
                </button>
                <button onclick="window.game.terminateSdisConvention()" class="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition border border-rose-200">
                  Résilier
                </button>
              ` : `
                <button onclick="window.game.signSdisConvention()" ${!game.aascConvention?.signed ? 'disabled class="w-full px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed"' : 'class="w-full px-3.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"'}>
                  <span>✍️</span>
                  <span>Signer la Convention SDIS (+350 €)</span>
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
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${cump.normCompliant ? 'bg-emerald-600 text-white' : cump.signed ? 'bg-amber-400 text-amber-950' : 'bg-slate-100 text-slate-700'}">
                  ${cump.normCompliant ? 'Conforme H24' : cump.signed ? 'En mise aux normes 48h' : 'Non signée'}
                </span>
              </div>

              <div>
                <h5 class="text-xs font-black text-slate-900">Convention AASC & CUMP / SAMU 15</h5>
                <p class="text-[11px] text-slate-600 mt-1">Astreinte 24h/24 pour l'armement de Centres d'Accueil des Impliqués (CAI) sous 2 heures avec malles pré-conditionnées.</p>
              </div>

              <div class="p-2.5 rounded-xl bg-slate-50 text-[10px] space-y-1 font-semibold text-slate-700">
                <div class="flex justify-between">
                  <span>Prérequis AASC :</span>
                  <span>10 bénévoles min, Agréments A et B, 2 véhicules</span>
                </div>
                <div class="flex justify-between">
                  <span>Délai de mise aux normes :</span>
                  <span>48 heures après signature</span>
                </div>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button onclick="window.ProtecCump.renderCumpTab(window.game)" class="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-sm transition">
                Gérer la Convention CUMP
              </button>
            </div>
          </div>

          <!-- 3. CONVENTION SNCF (NAUFRAGÉS DU RAIL & CHU) -->
          <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3 border ${game.sncfConvention?.signed ? 'border-purple-300 ring-1 ring-purple-300/30' : 'border-slate-200'}">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-200">
                  SNCF Voyageurs • Crise
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${game.sncfConvention?.signed ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}">
                  ${game.sncfConvention?.signed ? 'Convention Signée ✓' : 'Non Signée'}
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
                  <span>Prestation CHU gare :</span>
                  <span>+420 € à +480 €</span>
                </div>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
              ${game.sncfConvention?.signed ? `
                <span class="text-[10px] font-bold text-emerald-700">✓ En vigueur</span>
                <button onclick="window.game.terminateSncfConvention(); window.game.openModule('conventions');" class="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition border border-rose-200">
                  Résilier
                </button>
              ` : `
                <button onclick="window.game.signSncfConvention(); window.game.openModule('conventions');" class="w-full px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-1.5">
                  <span>✍️</span>
                  <span>Signer la Convention SNCF (+400 €)</span>
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

        <!-- 3. SIMULATEUR ET GRILLE OFFICIELLE RNMSC - DPS -->
        <div class="p-5 rounded-3xl glass-card border border-slate-200 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">📐</span>
              <div>
                <h4 class="text-sm font-black text-slate-900">Grille Officielle RNMSC • Dimensionnement des DPS</h4>
                <p class="text-xs text-slate-500">Référentiel National des Missions de Sécurité Civile : Calcul de l'indicateur de risque (RIS) et composition obligatoire.</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-pc-blue/10 text-pc-blue border border-pc-blue/20">
              Norme Ministère Intérieur
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <!-- P1 : Public -->
            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <label class="font-extrabold text-slate-700 block text-[11px]">P1 : Posture du Public</label>
              <select id="rnmsc-p1" onchange="window.ProtecRNMSC.updateSimulatorUI()" class="w-full text-xs font-semibold p-1.5 rounded-xl border border-slate-300 bg-white">
                <option value="0.25">Assis calme (0.25)</option>
                <option value="0.30">Debout statique (0.30)</option>
                <option value="0.35" selected>Debout dynamique (0.35)</option>
                <option value="0.40">Foule dense / festival (0.40)</option>
              </select>
            </div>

            <!-- P2 : Comportement -->
            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <label class="font-extrabold text-slate-700 block text-[11px]">P2 : Âge & Ambiance</label>
              <select id="rnmsc-p2" onchange="window.ProtecRNMSC.updateSimulatorUI()" class="w-full text-xs font-semibold p-1.5 rounded-xl border border-slate-300 bg-white">
                <option value="0.25">Familial / Calme (0.25)</option>
                <option value="0.30">Tout public (0.30)</option>
                <option value="0.35" selected>Jeunesse / Alcool / Fête (0.35)</option>
                <option value="0.40">Supporters / Haute tension (0.40)</option>
              </select>
            </div>

            <!-- E1 : Environnement -->
            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <label class="font-extrabold text-slate-700 block text-[11px]">E1 : Site & Accès</label>
              <select id="rnmsc-e1" onchange="window.ProtecRNMSC.updateSimulatorUI()" class="w-full text-xs font-semibold p-1.5 rounded-xl border border-slate-300 bg-white">
                <option value="0.25">Salle fermée facile (0.25)</option>
                <option value="0.30" selected>Plein air plat clos (0.30)</option>
                <option value="0.35">Grande étendue (0.35)</option>
                <option value="0.40">Terrain accidenté / Forêt (0.40)</option>
              </select>
            </div>

            <!-- E2 : Délais Secours -->
            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <label class="font-extrabold text-slate-700 block text-[11px]">E2 : Délai SDIS / SAMU</label>
              <select id="rnmsc-e2" onchange="window.ProtecRNMSC.updateSimulatorUI()" class="w-full text-xs font-semibold p-1.5 rounded-xl border border-slate-300 bg-white">
                <option value="0.25">< 10 minutes (0.25)</option>
                <option value="0.30" selected>10 à 20 minutes (0.30)</option>
                <option value="0.35">> 20 minutes (0.35)</option>
                <option value="0.40">Zone très isolée (0.40)</option>
              </select>
            </div>
          </div>

          <!-- Effectif attendu -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200">
            <div class="flex items-center gap-3">
              <span class="text-xs font-extrabold text-slate-800">Effectif de public simultané attendu (N) :</span>
              <input type="number" id="rnmsc-n" value="2500" min="50" max="100000" step="50" onchange="window.ProtecRNMSC.updateSimulatorUI()" oninput="window.ProtecRNMSC.updateSimulatorUI()" class="w-28 text-xs font-black p-1.5 rounded-xl border border-slate-300 bg-white font-mono text-center">
            </div>
            <div id="rnmsc-result-box" class="flex items-center gap-3 text-xs">
              <!-- Rempli dynamiquement -->
            </div>
          </div>
        </div>

        <!-- 4. SEGMENTATION DES REVENUS ET SUBVENTIONS PUBLIQUES -->
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

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      if (window.ProtecRNMSC) window.ProtecRNMSC.updateSimulatorUI();
    }, 50);
  }
};

// ============================================================================
// MOTEUR OFFICIEL RNMSC (DISPOSITIFS PRÉVISIONNELS DE SECOURS)
// Grille P1/P2/E1/E2, Calcul du RIS et Règle d'Équipage Stricte VPSP
// ============================================================================
window.ProtecRNMSC = {
  // Calcul de l'indicateur de risque RIS selon la formule officielle
  calculateRIS({ p1 = 0.35, p2 = 0.35, e1 = 0.30, e2 = 0.30, n = 2500 }) {
    const i = Number(p1) + Number(p2) + Number(e1) + Number(e2);
    const ris = (i * Number(n)) / 1000;
    
    let type = 'PAPS';
    let label = 'Point d’Alerte et de Premiers Secours (PAPS)';
    let minVolunteers = 2;
    let requiredVehicles = [];
    let requiredRanks = ['PSE2', 'PSE1'];
    let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';

    if (ris <= 0.25) {
      type = 'PAPS';
      label = 'PAPS (Point d’Alerte et de Premiers Secours)';
      minVolunteers = 2;
      requiredVehicles = [];
      requiredRanks = ['PSE2', 'PSE1'];
      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (ris <= 1.15) {
      type = 'DPS-PE';
      label = 'DPS-PE (Petite Envergure)';
      minVolunteers = 4;
      requiredVehicles = ['VPSP'];
      requiredRanks = ['CE', 'Driver', 'PSE2', 'PSE1'];
      badgeColor = 'bg-sky-100 text-sky-800 border-sky-300';
    } else if (ris <= 12) {
      type = 'DPS-ME';
      label = 'DPS-ME (Moyenne Envergure)';
      minVolunteers = Math.max(8, Math.min(24, Math.round(ris * 2.2)));
      requiredVehicles = ['VPSP', 'VTU'];
      requiredRanks = ['CD', 'CE', 'Driver', 'PSE2', 'PSE1'];
      badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
    } else {
      type = 'DPS-GE';
      label = 'DPS-GE (Grande Envergure - Multi-Secteurs)';
      minVolunteers = Math.max(36, Math.min(80, Math.round(ris * 2.5)));
      requiredVehicles = ['VPSP', 'VPSP', 'VTU', 'PMA'];
      requiredRanks = ['CD', 'CE', 'Driver', 'PSE2', 'PSE1'];
      badgeColor = 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
    }

    return {
      i: Math.round(i * 100) / 100,
      ris: Math.round(ris * 100) / 100,
      type,
      label,
      minVolunteers,
      requiredVehicles,
      requiredRanks,
      badgeColor
    };
  },

  // Mise à jour visuelle du simulateur dans la vue conventions
  updateSimulatorUI() {
    const p1 = Number(document.getElementById('rnmsc-p1')?.value || 0.35);
    const p2 = Number(document.getElementById('rnmsc-p2')?.value || 0.35);
    const e1 = Number(document.getElementById('rnmsc-e1')?.value || 0.30);
    const e2 = Number(document.getElementById('rnmsc-e2')?.value || 0.30);
    const n = Number(document.getElementById('rnmsc-n')?.value || 2500);

    const calc = this.calculateRIS({ p1, p2, e1, e2, n });
    const box = document.getElementById('rnmsc-result-box');
    if (box) {
      box.innerHTML = `
        <div class="text-right">
          <span class="text-[10px] text-slate-500 font-bold block">i = ${calc.i} • RIS = ${calc.ris}</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black border ${calc.badgeColor}">
            ${calc.label}
          </span>
        </div>
        <div class="p-2 rounded-xl bg-pc-blue text-white text-center font-mono font-black text-xs">
          ${calc.minVolunteers} secouristes requis
        </div>
      `;
    }
  },

  // RÈGLE STRICTE D'ÉQUIPAGE RNMSC : Invalidation si la composition minimale n'est pas respectée
  // Exemple VPSP : Obligation absolue d'avoir 1 Chef d'agrès/équipe, 1 Conducteur, 1 PSE2 et 1 PSE1 à jour de recyclage
  validateCrewCompliance(mission, volunteers = [], vehicles = []) {
    const errors = [];
    const hasVpsp = (vehicles || []).some(v => v.type === 'VPSP') || (mission.requiredVehicles || []).includes('VPSP');

    if (hasVpsp) {
      if (volunteers.length < 4) {
        errors.push(`Un VPSP exige réglementairement un équipage complet de 4 secouristes (${volunteers.length}/4 présents).`);
      }

      // Vérification Chef d'équipe / Chef d'agrès
      const hasLeader = volunteers.some(v => ['CE', 'CD', 'Cadre'].includes(v.rank) || v.skills?.includes('ce'));
      if (!hasLeader) {
        errors.push("Absence de Chef d’Équipe ou Chef d’Agrès qualifié dans l'équipage VPSP.");
      }

      // Vérification Conducteur
      const hasDriver = volunteers.some(v => v.isDriver || v.skills?.includes('conducteur') || v.skills?.includes('permis_b'));
      if (!hasDriver) {
        errors.push("Aucun membre de l'équipage n'est habilité à la conduite (Permis B / Conducteur VPSP).");
      }

      // Vérification PSE2
      const hasPse2 = volunteers.some(v => v.rank === 'PSE2' || v.skills?.includes('pse2'));
      if (!hasPse2) {
        errors.push("Présence obligatoire d’au moins un Équipier Secouriste PSE2 à bord du VPSP.");
      }

      // Vérification PSE1
      const hasPse1 = volunteers.some(v => v.rank === 'PSE1' || v.skills?.includes('pse1') || v.rank === 'PSE2');
      if (!hasPse1) {
        errors.push("Présence obligatoire d’au moins un Secouriste PSE1 à bord du VPSP.");
      }

      // Vérification du maintien des compétences (Recyclage FC non caduque)
      const expiredVols = volunteers.filter(v => v.qualificationExpired);
      if (expiredVols.length > 0) {
        errors.push(`Recyclage annuel échu : ${expiredVols.map(v => v.name).join(', ')} ont un diplôme caduque non maintenu en FC.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
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
  }
};

