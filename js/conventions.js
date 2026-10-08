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

        <!-- Grille des 4 conventions majeures -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <!-- 1. CONVENTION CUMP (SAMU 15) -->
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

          <!-- 2. CONVENTION SDIS (POMPIERS) -->
          <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3 border border-slate-200">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-orange-100 text-orange-900 border border-orange-200">
                  SDIS • Gardes Pompiers
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${sdis.active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}">
                  ${sdis.active ? 'Dispositif Armé' : 'Convention Active'}
                </span>
              </div>

              <div>
                <h5 class="text-xs font-black text-slate-900">Convention Partenariale SDIS</h5>
                <p class="text-[11px] text-slate-600 mt-1">Mise à disposition conventionnée d'un équipage VPSP pour gardes caserne ou astreintes renforcées au profit du CODIS.</p>
              </div>

              <div class="p-2.5 rounded-xl bg-slate-50 text-[10px] space-y-1 font-semibold text-slate-700">
                <div class="flex justify-between">
                  <span>Indemnisation SDIS :</span>
                  <span>45 € / heure de garde VPSP</span>
                </div>
                <div class="flex justify-between">
                  <span>Agrément requis :</span>
                  <span>Agrément A (Secours à Personnes)</span>
                </div>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button onclick="window.game.openModule('pompiers')" class="px-3.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs shadow-sm transition">
                Gérer la Garde SDIS
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

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};
