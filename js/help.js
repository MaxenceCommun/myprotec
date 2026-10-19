// js/help.js - Guide Opérationnel, Manuel de Commandement & Centre d'Aide (MyProtec)
window.ProtecHelp = {
  currentTab: 'debuter',
  currentMissionSubTab: 'dps',
  glossaryQuery: '',
  glossaryCategory: 'all',

  openModal(targetTab = null, targetSubTab = null) {
    let modal = document.getElementById('help-guide-modal');
    if (!modal) {
      this.createModalDOM();
      modal = document.getElementById('help-guide-modal');
    }
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      if (targetTab) this.currentTab = targetTab;
      if (targetSubTab) this.currentMissionSubTab = targetSubTab;
      this.switchTab(this.currentTab);
      if (this.currentTab === 'missions') {
        this.switchMissionSubTab(this.currentMissionSubTab);
      }
      if (window.lucide) window.lucide.createIcons();
    }
  },

  closeModal() {
    const modal = document.getElementById('help-guide-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  switchTab(tabId) {
    this.currentTab = tabId;
    const tabs = ['debuter', 'missions', 'faq', 'glossaire'];
    tabs.forEach(t => {
      const btn = document.getElementById(`help-tab-btn-${t}`);
      const content = document.getElementById(`help-tab-content-${t}`);
      if (btn && content) {
        if (t === tabId) {
          btn.className = 'px-3 py-2 rounded-xl text-xs font-black bg-pc-blue text-white shadow-md transition flex items-center gap-1.5 cursor-pointer';
          content.classList.remove('hidden');
        } else {
          btn.className = 'px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5 cursor-pointer';
          content.classList.add('hidden');
        }
      }
    });

    if (tabId === 'missions') {
      this.switchMissionSubTab(this.currentMissionSubTab || 'dps');
    } else if (tabId === 'glossaire') {
      this.updateGlossaryTooltipButtonState();
      this.renderGlossaryContent();
    }
    if (window.lucide) window.lucide.createIcons();
  },

  switchMissionSubTab(subTabId) {
    this.currentMissionSubTab = subTabId;
    const subTabs = [
      'logistique',
      'vehicule',
      'batiment',
      'formation',
      'convention',
      'communication',
      'dps',
      'gardes',
      'crise',
      'ecussons',
      'personnel'
    ];

    subTabs.forEach(s => {
      const btn = document.getElementById(`help-subtab-btn-${s}`);
      const content = document.getElementById(`help-subtab-content-${s}`);
      if (btn && content) {
        if (s === subTabId) {
          btn.className = 'help-subtab-pill px-3 py-1.5 rounded-xl text-[11px] font-black bg-gradient-to-r from-pc-orange to-amber-500 text-white shadow-sm transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ring-2 ring-orange-400/40';
          content.classList.remove('hidden');
        } else {
          btn.className = 'help-subtab-pill px-3 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5';
          content.classList.add('hidden');
        }
      }
    });

    if (window.lucide) window.lucide.createIcons();
  },

  toggleGlossaryTooltips() {
    let nextState = true;
    if (window.ProtecGlossaire && typeof window.ProtecGlossaire.toggle === 'function') {
      nextState = window.ProtecGlossaire.toggle();
    } else {
      try {
        const cur = localStorage.getItem('protec_enable_acronym_tooltips') !== 'false';
        nextState = !cur;
        localStorage.setItem('protec_enable_acronym_tooltips', nextState ? 'true' : 'false');
      } catch (e) {}
    }
    this.updateGlossaryTooltipButtonState();

    if (window.game && typeof window.game.showToast === 'function') {
      if (nextState) {
        window.game.showToast('Bulles d’aide activées', 'Survolez les sigles dans l’interface pour afficher leur définition.', 'green');
      } else {
        window.game.showToast('Bulles d’aide désactivées', 'Les infobulles automatiques sur les abréviations sont masquées.', 'slate');
      }
    }
  },

  updateGlossaryTooltipButtonState() {
    const btn = document.getElementById('help-toggle-tooltips-btn');
    if (!btn) return;
    let isEnabled = true;
    if (window.ProtecGlossaire && typeof window.ProtecGlossaire.isEnabled === 'function') {
      isEnabled = window.ProtecGlossaire.isEnabled();
    } else {
      try {
        isEnabled = localStorage.getItem('protec_enable_acronym_tooltips') !== 'false';
      } catch (e) {}
    }

    if (isEnabled) {
      btn.className = 'px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition flex items-center gap-2 cursor-pointer';
      btn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i><span>Bulles d’Info au Survol : ACTIVÉES ✓</span>`;
    } else {
      btn.className = 'px-3.5 py-2 rounded-xl text-xs font-black bg-slate-700 hover:bg-slate-600 text-slate-200 shadow-md transition flex items-center gap-2 cursor-pointer';
      btn.innerHTML = `<i data-lucide="eye-off" class="w-4 h-4"></i><span>Bulles d’Info au Survol : DÉSACTIVÉES ✗</span>`;
    }
    if (window.lucide) window.lucide.createIcons();
  },

  createModalDOM() {
    const div = document.createElement('div');
    div.id = 'help-guide-modal';
    div.className = 'hidden fixed inset-0 z-[70] items-center justify-center bg-slate-950/80 backdrop-blur-xl p-3 sm:p-4 animate-in fade-in select-none';
    div.innerHTML = `
      <div class="w-full max-w-[96vw] 2xl:max-w-[1760px] max-h-[94vh] flex flex-col rounded-3xl p-5 sm:p-6 shadow-2xl relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
        
        <!-- Header Principal -->
        <div class="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800 mb-3 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center text-xl font-black shadow-md flex-shrink-0">
              <span class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-black text-sm">?</span>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">Manuel de Commandement & Centre d'Aide</h3>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950/70 text-pc-blue dark:text-sky-300 uppercase tracking-wide border border-blue-200 dark:border-blue-800">MyProtec 2.5</span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-semibold">Guide exhaustif des systèmes, des règles opérationnelles et des incidences sur vos effectifs</p>
            </div>
          </div>
          <button onclick="window.ProtecHelp.closeModal()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition cursor-pointer flex-shrink-0" title="Fermer le manuel">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Navigation par Grands Onglets -->
        <div class="flex flex-wrap items-center gap-1.5 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <button id="help-tab-btn-debuter" onclick="window.ProtecHelp.switchTab('debuter')">
            <i data-lucide="compass" class="w-3.5 h-3.5"></i>
            <span>Bien Débuter</span>
          </button>
          <button id="help-tab-btn-missions" onclick="window.ProtecHelp.switchTab('missions')">
            <i data-lucide="activity" class="w-3.5 h-3.5"></i>
            <span>Missions & Systèmes</span>
          </button>
          <button id="help-tab-btn-faq" onclick="window.ProtecHelp.switchTab('faq')">
            <i data-lucide="help-circle" class="w-3.5 h-3.5"></i>
            <span>Questions Fréquentes</span>
          </button>
          <button id="help-tab-btn-glossaire" onclick="window.ProtecHelp.switchTab('glossaire')">
            <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
            <span>Glossaire & Infobulles</span>
          </button>
        </div>

        <!-- Corps Déroulant Principal -->
        <div class="overflow-y-auto pr-1 sm:pr-2 py-3 space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-200 flex-1 no-scrollbar">

          <!-- ================= ONGLET 1 : BIEN DÉBUTER ================= -->
          <div id="help-tab-content-debuter" class="space-y-3.5">
            <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-sky-500/10 to-transparent border border-blue-200 dark:border-blue-800/80 space-y-1.5">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-pc-blue text-white">Prise de Commandement</span>
              <h4 class="font-black text-slate-900 dark:text-slate-100 text-sm">Bienvenue à la tête de votre Antenne de la Protection Civile</h4>
              <p class="text-slate-600 dark:text-slate-300 text-xs">
                En tant que Directeur d'Antenne, vous pilotez l'ensemble des dimensions de l'unité : ressources humaines bénévoles et salariées, flotte opérationnelle, pharmacie et stocks médicaux, relations institutionnelles avec le SAMU et les Sapeurs-Pompiers, santé financière et couverture sanitaire des événements de votre territoire.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <!-- Étape 1 -->
              <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-2xs">
                <div class="flex items-center gap-2 font-black text-pc-blue dark:text-sky-400">
                  <span class="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-pc-blue flex items-center justify-center text-xs">1</span>
                  <span>Implantation Territoriale</span>
                </div>
                <p class="text-slate-600 dark:text-slate-300 text-[11.5px]">
                  Choisissez l'emplacement géographique de votre antenne sur la carte du département. Vos locaux abritent vos véhicules, votre matériel et vos secouristes. Les temps de transit sur les interventions sont calculés sur le réseau routier réel depuis cette adresse.
                </p>
              </div>

              <!-- Étape 2 -->
              <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-2xs">
                <div class="flex items-center gap-2 font-black text-amber-600 dark:text-amber-400">
                  <span class="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center text-xs">2</span>
                  <span>Convention Cadre AASC</span>
                </div>
                <p class="text-slate-600 dark:text-slate-300 text-[11.5px]">
                  Faites signer votre Convention Préfectorale d'AASC (Association Agréée de Sécurité Civile). Sans cet agrément obligatoire, vous ne pouvez déployer aucun poste de secours officiel ni signer de convention avec le SAMU ou le SDIS.
                </p>
              </div>

              <!-- Étape 3 -->
              <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-2xs">
                <div class="flex items-center gap-2 font-black text-emerald-600 dark:text-emerald-400">
                  <span class="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-xs">3</span>
                  <span>Recrutement & Effectifs</span>
                </div>
                <p class="text-slate-600 dark:text-slate-300 text-[11.5px]">
                  Constituez un vivier mixte de bénévoles motivés, complété si besoin de jeunes en Service Civique et de salariés coordinateurs. Chaque bénévole possède son métier, ses disponibilités réelles et sa propre jauge d'énergie.
                </p>
              </div>

              <!-- Étape 4 -->
              <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-2xs">
                <div class="flex items-center gap-2 font-black text-pc-orange dark:text-orange-400">
                  <span class="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950 text-pc-orange flex items-center justify-center text-xs">4</span>
                  <span>Flotte & Premier VPSP</span>
                </div>
                <p class="text-slate-600 dark:text-slate-300 text-[11.5px]">
                  Acquérez votre premier Véhicule de Premiers Secours à Personnes (VPSP). Assurez-vous de le doter des sacs de prompt secours, d'oxygène médical et d'un DAE fonctionnel avant de l'envoyer sur son premier départ.
                </p>
              </div>
            </div>

            <!-- Focus 6 Pôles -->
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 class="font-black text-slate-900 dark:text-slate-100 text-xs flex items-center gap-2">
                <span>🏛️</span> Structuration des 6 Pôles d'Antenne
              </h4>
              <p class="text-slate-600 dark:text-slate-300 text-[11.5px]">
                Dès que vos effectifs s'étoffent, rendez-vous dans le module <strong>Pôles d'Antenne</strong> et nommez un responsable pour chaque secteur stratégique :
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                <div class="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">🚑 Pôle Opérationnel & Secours</div>
                <div class="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">📦 Pôle Matériel & Flotte</div>
                <div class="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">👥 Pôle Recrutement & RH</div>
                <div class="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">🎓 Pôle Formation Interne/Externe</div>
                <div class="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">📢 Pôle Communication & Médias</div>
                <div class="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">🤝 Pôle Mécénat & Action Sociale</div>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
                Chaque responsable en poste confère des bonus d'antenne permanents (réduction des pannes, accélération des recrutements, rentabilité bonifiée des devis).
              </p>
            </div>
          </div>

          <!-- ================= ONGLET 2 : MISSIONS & SYSTÈMES ================= -->
          <div id="help-tab-content-missions" class="hidden space-y-3.5">
            
            <!-- Barre horizontale de sous-onglets système -->
            <div class="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button type="button" id="help-subtab-btn-logistique" onclick="window.ProtecHelp.switchMissionSubTab('logistique')">
                  <span>📦 Logistique</span>
                </button>
                <button type="button" id="help-subtab-btn-vehicule" onclick="window.ProtecHelp.switchMissionSubTab('vehicule')">
                  <span>🚐 Véhicule</span>
                </button>
                <button type="button" id="help-subtab-btn-batiment" onclick="window.ProtecHelp.switchMissionSubTab('batiment')">
                  <span>🏛️ Bâtiment</span>
                </button>
                <button type="button" id="help-subtab-btn-formation" onclick="window.ProtecHelp.switchMissionSubTab('formation')">
                  <span>🎓 Formation</span>
                </button>
                <button type="button" id="help-subtab-btn-convention" onclick="window.ProtecHelp.switchMissionSubTab('convention')">
                  <span>📜 Convention</span>
                </button>
                <button type="button" id="help-subtab-btn-communication" onclick="window.ProtecHelp.switchMissionSubTab('communication')">
                  <span>📢 Communication</span>
                </button>
                <button type="button" id="help-subtab-btn-dps" onclick="window.ProtecHelp.switchMissionSubTab('dps')">
                  <span>🚨 DPS</span>
                </button>
                <button type="button" id="help-subtab-btn-gardes" onclick="window.ProtecHelp.switchMissionSubTab('gardes')">
                  <span>🚑 Garde SAMU/SDIS</span>
                </button>
                <button type="button" id="help-subtab-btn-crise" onclick="window.ProtecHelp.switchMissionSubTab('crise')">
                  <span>⚡ Crise</span>
                </button>
                <button type="button" id="help-subtab-btn-ecussons" onclick="window.ProtecHelp.switchMissionSubTab('ecussons')">
                  <span>🛡️ Écussons</span>
                </button>
                <button type="button" id="help-subtab-btn-personnel" onclick="window.ProtecHelp.switchMissionSubTab('personnel')">
                  <span>👥 Bénévolat & Salariat</span>
                </button>
              </div>
            </div>

            <!-- CONTENU SOUS-ONGLET : LOGISTIQUE -->
            <div id="help-subtab-content-logistique" class="space-y-3">
              <div class="p-4 rounded-2xl bg-orange-500/10 border border-orange-300 dark:border-orange-800/80 space-y-1.5">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-pc-orange text-white">Logistique, Pharmacie & Consommables</span>
                <h4 class="font-black text-slate-900 dark:text-slate-100 text-sm">Gestion des Stocks Médicaux & Réarmement</h4>
                <p class="text-slate-600 dark:text-slate-300 text-xs">
                  Le pôle logistique assure l'approvisionnement permanent des trousses de soins, bouteilles d'oxygène médical (O2), électrodes DAE, brancards, lits picot et matériel d'hébergement d'urgence. Après chaque mission, les véhicules doivent être nettoyés et réarmés.
                </p>
              </div>

              <!-- Incidences Logistique -->
              <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 space-y-2">
                <h5 class="font-black text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                  <span>⚠️</span> Incidences d'un Manquement Logistique en Intervention
                </h5>
                <ul class="list-disc list-inside space-y-1 text-[11.5px] text-rose-950 dark:text-rose-300 font-medium pl-1">
                  <li><strong>Impact direct sur les bénévoles :</strong> Envoyer un équipage sur le terrain avec du matériel manquant ou défectueux (ex: bouteille d'oxygène vide, pas d'électrodes adultes, trousse incomplète) place les secouristes dans une situation d'impuissance face aux victimes. Leur stress augmente drastiquement et leur moral s'effondre.</li>
                  <li><strong>Aggravation si aucune solution n'est trouvée :</strong> Si l'antenne ne parvient pas à réapprovisionner ou à faire parvenir du matériel de secours en urgence, le sentiment d'abandon grandit chez les bénévoles. Cette frustration répétée détruit la confiance envers le commandement et favorise les défections.</li>
                  <li><strong>Baisse de réputation et litiges clients :</strong> Un dispositif de secours incapable d'assurer un soin basique faute de consommables s'expose à un rapport défavorable de l'organisateur et à des sanctions administratives.</li>
                </ul>
              </div>
            </div>

            <!-- CONTENU SOUS-ONGLET : VÉHICULE -->
            <div id="help-subtab-content-vehicule" class="hidden space-y-3">
              <div class="p-4 rounded-2xl bg-blue-500/10 border border-blue-300 dark:border-blue-800/80 space-y-1.5">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-pc-blue text-white">Parc Mobile & Vecteurs</span>
                <h4 class="font-black text-slate-900 dark:text-slate-100 text-sm">Flotte Opérationnelle, Entretien & Permis</h4>
                <p class="text-slate-600 dark:text-slate-300 text-xs">
                  Votre flotte se compose de VPSP (premiers secours à personnes), VTU (véhicules tout usage et logistique), VL (liaison et reconnaissance), VTP (minibus 9 places), VLHR (4x4 franchissement) et VPC/PCM (postes de commandement). Chaque vecteur consomme du carburant et subit une usure kilométrique.
                </p>
              </div>

              <!-- Permis B vs P.VPSP -->
              <div class="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 space-y-1.5">
                <h5 class="font-black text-amber-950 dark:text-amber-200 text-xs flex items-center gap-1.5">
                  <span>🚗</span> Règle de Conduite : Permis B vs Habilitation P.VPSP
                </h5>
                <p class="text-[11.5px] text-amber-900 dark:text-amber-300">
                  Le <strong>Permis B standard</strong> suffit pour conduire n'importe quel véhicule léger de l'antenne et acheminer les secouristes sur le poste. L'autorisation préfectorale interne <strong>P.VPSP</strong> n'est exigée que lors d'un <em>transport effectif de victime</em> vers un centre hospitalier. Ne bloquez jamais un départ au prétexte qu'un chauffeur n'a pas encore l'habilitation P.VPSP si aucune évacuation sanitaire n'est engagée.
                </p>
              </div>

              <!-- Incidences Véhicules -->
              <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 space-y-2">
                <h5 class="font-black text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                  <span>⚠️</span> Incidences de l'Entretien et de l'État Mécanique
                </h5>
                <ul class="list-disc list-inside space-y-1 text-[11.5px] text-rose-950 dark:text-rose-300 font-medium pl-1">
                  <li><strong>Pannes en route :</strong> Un véhicule négligé (contrôle technique dépassé, révision ignorée, freins usés) risque une panne mécanique en plein trajet. L'équipage se retrouve bloqué sur le bas-côté et la mission ne peut pas être assurée dans les délais.</li>
                  <li><strong>Sécurité des équipages :</strong> Des pneumatiques lisses ou un gyrophare défaillant mettent directement en danger la sécurité des secouristes. Si un accident survient par manque d'entretien, la responsabilité de la direction est engagée.</li>
                  <li><strong>Propreté & Image :</strong> Un véhicule sale ou non désinfecté après une prise en charge médicale dégrade la réputation de l'antenne auprès du grand public et des soignants de l'hôpital.</li>
                </ul>
              </div>
            </div>

            <!-- CONTENU SOUS-ONGLET : BÂTIMENT -->
            <div id="help-subtab-content-batiment" class="hidden space-y-3">
              <div class="p-4 rounded-2xl bg-slate-500/10 border border-slate-300 dark:border-slate-700 space-y-1.5">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-800 text-white">Infrastructures & Caserne</span>
                <h4 class="font-black text-slate-900 dark:text-slate-100 text-sm">Gestion des Locaux, Garage & Espace de Vie</h4>
                <p class="text-slate-600 dark:text-slate-300 text-xs">
                  Vos locaux constituent le lieu de vie de votre communauté : garage sécurisé pour la flotte, vestiaires hommes/femmes, standard opérationnel, pharmacie fermée à clé, salle de cours pour les formations et foyer de repos pour les veilles de nuit.
                </p>
              </div>

              <!-- Incidences Bâtiment -->
              <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 space-y-2">
                <h5 class="font-black text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                  <span>⚠️</span> Incidences de la Qualité et du Confort des Locaux
                </h5>
                <ul class="list-disc list-inside space-y-1 text-[11.5px] text-rose-950 dark:text-rose-300 font-medium pl-1">
                  <li><strong>Récupération et fatigue des bénévoles :</strong> Sans salle de repos convenable ni espace chaleureux entre deux interventions nocturnes, la fatigue physiologique s'accumule. Des secouristes épuisés commettent davantage d'erreurs et leur motivation s'érode.</li>
                  <li><strong>Vitesse de mobilisation :</strong> Un garage trop étroit, mal éclairé ou un stockage anarchique rallonge le temps nécessaire pour charger le matériel et faire partir les véhicules en urgence.</li>
                  <li><strong>Fidélisation des effectifs :</strong> Des locaux froids, délabrés ou sans vestiaires découragent les nouvelles recrues, tandis qu'une base moderne et conviviale crée un esprit de corps solide.</li>
                </ul>
              </div>
            </div>

            <!-- CONTENU SOUS-ONGLET : FORMATION -->
            <div id="help-subtab-content-formation" class="hidden space-y-3">
              <div class="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-300 dark:border-indigo-800/80 space-y-1.5">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white">Filière Pédagogique & Compétences</span>
                <h4 class="font-black text-slate-900 dark:text-slate-100 text-sm">Formations Internes & Sessions Grand Public</h4>
                <p class="text-slate-600 dark:text-slate-300 text-xs">
                  La formation s'articule autour de deux axes complémentaires : former les citoyens aux gestes qui sauvent (PSC1) pour générer des recettes financières indispensables, et former vos secouristes en interne (PSE1, PSE2, Chef d'Équipe CE, Chef de Dispositif CD, Formateur PAE FPS) pour élever les qualifications de l'antenne.
                </p>
              </div>

              <!-- Incidences Formation -->
              <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 space-y-2">
                <h5 class="font-black text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                  <span>⚠️</span> Incidences de la Politique de Formation
                </h5>
                <ul class="list-disc list-inside space-y-1 text-[11.5px] text-rose-950 dark:text-rose-300 font-medium pl-1">
                  <li><strong>Stagnation et démotivation :</strong> Si vos bénévoles restent bloqués au même niveau sans possibilité de monter en compétences ou de passer le PSE2 / Chef d'Équipe, ils finissent par se lasser et quittent l'antenne par manque de perspectives.</li>
                  <li><strong>Blocage des dispositifs d'envergure :</strong> Les grands événements exigent obligatoirement des Chefs de Dispositif et des secouristes qualifiés PSE2. Si vous n'avez pas anticipé les promotions, vous ne pourrez pas postuler aux missions les plus prestigieuses et rémunératrices.</li>
                  <li><strong>Sécurité des gestes :</strong> Une formation rigoureuse diminue le stress en intervention et garantit des prises en charge professionnelles saluées par les médecins du SAMU.</li>
                </ul>
              </div>
            </div>

            <!-- CONTENU SOUS-ONGLET : CONVENTION -->
            <div id="help-subtab-content-convention" class="hidden space-y-3">
              <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300 dark:border-emerald-800/80 space-y-1.5">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">Partenariats & Accords Cadres</span>
                <h4 class="font-black text-slate-900 dark:text-slate-100 text-sm">Conventions Institutionnelles & Contrats Annuels</h4>
                <p class="text-slate-600 dark:text-slate-300 text-xs">
                  Les conventions encadrent vos relations avec l'État (AASC), la santé publique (SAMU 15), les pompiers (SDIS) et les grands partenaires privés (clubs sportifs de football/rugby, exploitants de zéniths et grandes salles de spectacle). Elles apportent des rentrées d'argent prévisibles et régulières.
                </p>
              </div>

              <!-- Incidences Conventions -->
              <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 space-y-2">
                <h5 class="font-black text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                  <span>⚠️</span> Incidences du Respect des Engagements Conventionnels
                </h5>
                <ul class="list-disc list-inside space-y-1 text-[11.5px] text-rose-950 dark:text-rose-300 font-medium pl-1">
                  <li><strong>Rupture de convention et pénalités :</strong> Ne pas honorer les critères exigés par un contrat annuel (ex: absence de VPSP sur un match au stade, sous-effectif non annoncé) entraîne des pénalités financières et la perte immédiate de l'exclusivité au profit d'autres associations.</li>
                  <li><strong>Perte de confiance des autorités :</strong> Si le SAMU ou la Préfecture constatent des défaillances répétées sur vos astreintes conventionnées, votre agrément peut être suspendu, ce qui bloque toutes vos activités sur le département.</li>
                  <li><strong>Pérennité financière :</strong> Des partenariats fiables et renouvelés stabilisent le budget de l'antenne et permettent de financer le renouvellement de la flotte et des équipements.</li>
                </ul>
              </div>
            </div>

            <!-- CONTENU SOUS-ONGLET : COMMUNICATION -->
            <div id="help-subtab-content-communication" class="hidden space-y-3">
              <div class="p-4 rounded-2xl bg-sky-500/10 border border-sky-300 dark:border-sky-800/80 space-y-1.5">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-600 text-white">Relations Publiques & Notoriété</span>
                <h4 class="font-black text-slate-900 dark:text-slate-100 text-sm">Réseaux Sociaux, Presse & Image Publique</h4>
                <p class="text-slate-600 dark:text-slate-300 text-xs">
                  La communication valorise le dévouement de vos bénévoles auprès de la population. Elle regroupe les publications sur les réseaux sociaux, les articles de presse locale, les campagnes de sensibilisation aux gestes qui sauvent et les appels aux dons citoyens.
                </p>
              </div>

              <!-- Incidences Communication -->
              <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 space-y-2">
                <h5 class="font-black text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                  <span>⚠️</span> Incidences de la Visibilité et de la Présence Locale
                </h5>
                <ul class="list-disc list-inside space-y-1 text-[11.5px] text-rose-950 dark:text-rose-300 font-medium pl-1">
                  <li><strong>Flux de candidatures :</strong> Une antenne invisible dans les médias ne reçoit aucune candidature spontanée. Plus votre communication est vivante, plus vous attirez des profils motivés et compétents.</li>
                  <li><strong>Reconnaissance du travail des équipes :</strong> Mettre en lumière les secouristes après un gros dispositif ou une garde éprouvante nourrit leur sentiment de fierté et leur attachement à la Protection Civile.</li>
                  <li><strong>Attribution des subventions publiques :</strong> Les municipalités et conseils départementaux allouent plus volontiers des aides financières aux unités dont ils constatent régulièrement l'utilité publique.</li>
                </ul>
              </div>
            </div>

            <!-- CONTENU SOUS-ONGLET : DPS -->
            <div id="help-subtab-content-dps" class="hidden space-y-3">
              <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-800/80 space-y-1.5">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white">Dispositifs Prévisionnels de Secours</span>
                <h4 class="font-black text-slate-900 dark:text-slate-100 text-sm">Postes de Secours, Devis RNMSC & Verrouillage au Départ</h4>
                <p class="text-slate-600 dark:text-slate-300 text-xs">
                  Les DPS représentent l'activité opérationnelle majeure de l'antenne. Du Point d'Alerte et de Premiers Secours (PAPS) au Grand Dispositif (DPS-GE) avec Poste Médical Avancé, vous chiffrez les devis selon la réglementation RNMSC et déployez vos équipes sur le terrain.
                </p>
              </div>

              <!-- Verrouillage des équipages -->
              <div class="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 space-y-1">
                <h5 class="font-black text-pc-blue dark:text-sky-300 text-xs flex items-center gap-1.5">
                  <span>🔒</span> Règle Opérationnelle : Verrouillage de l'Équipage au Départ
                </h5>
                <p class="text-[11.5px] text-slate-600 dark:text-slate-300">
                  Vous pouvez composer et ajuster les équipages librement <strong>tant que les véhicules se trouvent à la base</strong>. Dès le départ en intervention, la composition est scellée pour toute la durée de la mission et du transit. Aucun ajout ni retrait de secouriste n'est autorisé en cours de route.
                </p>
              </div>

              <!-- Incidences DPS -->
              <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 space-y-2">
                <h5 class="font-black text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                  <span>⚠️</span> Incidences des Manquements sur un Poste de Secours
                </h5>
                <ul class="list-disc list-inside space-y-1 text-[11.5px] text-rose-950 dark:text-rose-300 font-medium pl-1">
                  <li><strong>Sous-dimensionnement et épuisement :</strong> Si un poste accueille un public massif avec un nombre insuffisant de secouristes, les bénévoles sur place subissent une surcharge de travail ingérable, des prises en charge simultanées et un stress extrême.</li>
                  <li><strong>Retards d'arrivée sur site :</strong> Un retard au rassemblement à la caserne retarde l'ouverture du poste de secours. L'organisateur mécontent peut appliquer des pénalités financières et refuser de confier ses prochains événements à l'antenne.</li>
                  <li><strong>Dispositif bien dimensionné :</strong> Une équipe reposée, encadrée par un Chef de Dispositif rigoureux, assure une veille sanitaire irréprochable qui suscite les éloges de l'organisateur.</li>
                </ul>
              </div>
            </div>

            <!-- CONTENU SOUS-ONGLET : GARDE SAMU/SDIS -->
            <div id="help-subtab-content-gardes" class="hidden space-y-3">
              <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-300 dark:border-rose-800/80 space-y-1.5">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">Permanence & Urgences Réflexes</span>
                <h4 class="font-black text-slate-900 dark:text-slate-100 text-sm">Astreintes Conventionnées SAMU 15 & Sapeurs-Pompiers</h4>
                <p class="text-slate-600 dark:text-slate-300 text-xs">
                  Sur réquisition du SAMU 15 (CRRA) ou du SDIS (CTA-CODIS 18), votre équipage VPSP assure des départs réflexes immédiats pour secourir des personnes en détresse vitale ou blessées sur la voie publique. Ces gardes procurent une indemnité horaire conventionnée.
                </p>
              </div>

              <!-- Fonctionnement Réaliste du Mode Automatique -->
              <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <h5 class="font-black text-slate-900 dark:text-slate-100 text-xs flex items-center gap-2">
                  <span>📟</span> Mode Automatique & Départs Réflexes Directs
                </h5>
                <p class="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Dans la réalité opérationnelle, le SAMU (CRRA 15) et le CODIS (18) disposent d’un <strong>moyen d’alerte direct avec l’équipage de garde</strong> (bipeur sélectif, terminal radio Antarès, terminal embarqué dans l’ambulance). Lorsque le mode automatique (garde postée en caserne ou à la base) est activé :
                </p>
                <ul class="list-disc list-inside space-y-1 text-[11.5px] text-slate-700 dark:text-slate-300 pl-1">
                  <li><strong>Aucune alerte sonore ni notification intrusive :</strong> L’équipage est bipé directement par la régulation et part immédiatement. L’antenne n’est pas dérangée pour chaque départ de routine.</li>
                  <li><strong>Suivi radio discret :</strong> L'activité est consignée en temps réel dans votre journal radio (Statut 2 Départ, Statut 3 Sur les lieux, Statut 4 Évacuation CHU, Statut 1 Retour base).</li>
                  <li><strong>Mode Astreinte Domicile :</strong> Les secouristes étant chez eux, la régulation alerte l'antenne qui doit coordonner le ralliement et valider le départ (alertes et gestion requises).</li>
                </ul>
              </div>

              <!-- Gestion des Vecteurs & Contingentement -->
              <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <h5 class="font-black text-slate-900 dark:text-slate-100 text-xs flex items-center gap-2">
                  <span>🚑</span> Pas Plus d'Interventions que de Vecteurs Alloués
                </h5>
                <p class="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Le SAMU et le CODIS connaissent précisément le <strong>nombre de vecteurs Protec engagés</strong> sous convention (généralement 1 VPSP armé par garde).
                </p>
                <ul class="list-disc list-inside space-y-1 text-[11.5px] text-slate-700 dark:text-slate-300 pl-1">
                  <li>Un vecteur ne peut être que sur une seule intervention à la fois. Tant que le VPSP est en mission, <strong>aucune intervention ordinaire supplémentaire n'est déclenchée</strong>.</li>
                  <li>Le nombre d'interventions en simultané est strictement plafonné aux effectifs et vecteurs conventionnés par l'antenne.</li>
                </ul>
              </div>

              <!-- Demandes de Renfort Ponctuelles -->
              <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 space-y-2">
                <h5 class="font-black text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                  <span>🚨</span> Demandes de Renfort Ponctuelles (Sans Obligation)
                </h5>
                <p class="text-[11.5px] text-amber-950 dark:text-amber-300 leading-relaxed">
                  De temps en temps (assez rarement), en cas de saturation générale des secours publics sur le département, le SAMU ou le CODIS peut solliciter votre antenne pour un <strong>renfort rapide d’urgence</strong> :
                </p>
                <ul class="list-disc list-inside space-y-1 text-[11.5px] text-amber-950 dark:text-amber-300 pl-1">
                  <li><strong>Notification avec alerte :</strong> Cette demande nécessite de la gestion manuelle (trouver un 2e VPSP disponible et mobiliser des secouristes libres), vous êtes donc immédiatement alerté par notification et sonnerie.</li>
                  <li><strong>Sans aucune obligation :</strong> Si vous n'avez pas le matériel ou le personnel disponible, ou si vous déclinez la demande, <strong>aucune sanction, aucune pénalité financière et 0 perte de réputation</strong> ne sont appliquées.</li>
                  <li><strong>Bonus exceptionnel si réalisé :</strong> Si vous parvenez à armer ce renfort d'urgence, vous recevez une prime financière exceptionnelle (+250 €) et un bond de réputation majeur auprès des autorités de santé.</li>
                </ul>
              </div>

              <!-- Incidences Gardes -->
              <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 space-y-2">
                <h5 class="font-black text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                  <span>⚠️</span> Incidences d'un Manquement lors des Gardes Régulières
                </h5>
                <ul class="list-disc list-inside space-y-1 text-[11.5px] text-rose-950 dark:text-rose-300 font-medium pl-1">
                  <li><strong>Carence opérationnelle :</strong> Si un créneau de garde a été accepté mais qu'aucun secouriste n'a été inscrit sur la garde, le VPSP ne peut pas partir lors d'un appel réflexe. Une carence opérationnelle est notifiée et pénalise la réputation de l'antenne.</li>
                  <li><strong>Gestion de la fatigue :</strong> La garde postée en caserne garantit des départs immédiats (0 min) mais fatigue davantage les secouristes (-15 énergie). L'astreinte à domicile préserve l'énergie (-3 énergie) au prix d'un délai de ralliement.</li>
                  <li><strong>Régularité et ponctualité :</strong> Une antenne ponctuelle et fiable devient le partenaire de référence de la régulation médicale, ouvrant l'accès à des conventions étendues.</li>
                </ul>
              </div>
            </div>

            <!-- CONTENU SOUS-ONGLET : CRISE -->
            <div id="help-subtab-content-crise" class="hidden space-y-3">
              <div class="p-4 rounded-2xl bg-purple-500/10 border border-purple-300 dark:border-purple-800/80 space-y-1.5">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white">Opérations d'Urgence Majeure</span>
                <h4 class="font-black text-slate-900 dark:text-slate-100 text-sm">Sinistres Exceptionnels, NOVI & Renforts Départementaux</h4>
                <p class="text-slate-600 dark:text-slate-300 text-xs">
                  Lorsqu'un sinistre majeur survient (inondations, tempêtes, catastrophe ferroviaire, plan NOVI), le Préfet active le plan ORSEC. Toutes les antennes du département sont synchronisées pour déployer des moyens lourds et accueillir les personnes sinistrées.
                </p>
              </div>

              <!-- Incidences Crise -->
              <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 space-y-2">
                <h5 class="font-black text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                  <span>⚠️</span> Incidences de la Réactivité face à une Crise
                </h5>
                <ul class="list-disc list-inside space-y-1 text-[11.5px] text-rose-950 dark:text-rose-300 font-medium pl-1">
                  <li><strong>Désorganisation et sentiment d'abandon :</strong> Si l'antenne ne mobilise pas ses forces ou manque de matériel d'hébergement d'urgence (lits, couvertures, tentes), les sinistrés restent sans abri et les équipes sur place s'épuisent moralement.</li>
                  <li><strong>Nécessité absolue des appels à renfort :</strong> Ne restez jamais isolé face à un sinistre hors de proportion. Utiliser le réseau inter-antennes pour demander des équipages et des véhicules en renfort permet d'éviter la submersion de vos secouristes.</li>
                  <li><strong>Esprit de corps et honneur associatif :</strong> Une crise gérée avec dévouement et efficacité cimente définitivement la fierté des bénévoles et assoit le respect des institutions républicaines.</li>
                </ul>
              </div>
            </div>

            <!-- CONTENU SOUS-ONGLET : ÉCUSSONS -->
            <div id="help-subtab-content-ecussons" class="hidden space-y-3">
              <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-800/80 space-y-1.5">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white">Traditions & Identité</span>
                <h4 class="font-black text-slate-900 dark:text-slate-100 text-sm">Collection de Patchs, Spécialités & Bourse d'Échange</h4>
                <p class="text-slate-600 dark:text-slate-300 text-xs">
                  Les écussons tissés célèbrent les spécialités opérationnelles (Sauvetage Aquatique, Cynotechnie, Télépilotes Drones, Poste Médical Avancé, Soutien Psychologique CUMP) et l'appartenance départementale. Ils s'affichent sur le tableau en liège de votre bureau.
                </p>
              </div>

              <!-- Incidences Écussons -->
              <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <h5 class="font-black text-slate-900 dark:text-slate-100 text-xs flex items-center gap-2">
                  <span>🛡️</span> Rôle Fédérateur & Incidences sur l'Engagement
                </h5>
                <ul class="list-disc list-inside space-y-1 text-[11.5px] text-slate-600 dark:text-slate-300 font-medium pl-1">
                  <li><strong>Fierté et appartenance :</strong> Les insignes brodés matérialisent les heures d'engagement et les épreuves surmontées sur le terrain. Arborer un écusson de spécialité valorise le secouriste aux yeux de ses pairs.</li>
                  <li><strong>Fraternité inter-antennes :</strong> La bourse d'échange de patchs favorise la convivialité entre directeurs de toute la France et renforce la cohésion nationale de la Protection Civile.</li>
                </ul>
              </div>
            </div>

            <!-- CONTENU SOUS-ONGLET : BÉNÉVOLAT ET SALARIAT -->
            <div id="help-subtab-content-personnel" class="hidden space-y-3">
              <div class="p-4 rounded-2xl bg-teal-500/10 border border-teal-300 dark:border-teal-800/80 space-y-1.5">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-teal-600 text-white">Ressources Humaines & Bien-Être</span>
                <h4 class="font-black text-slate-900 dark:text-slate-100 text-sm">Bénévoles, Services Civiques & Salariés</h4>
                <p class="text-slate-600 dark:text-slate-300 text-xs">
                  La force de votre unité repose sur sa communauté humaine. Les bénévoles donnent de leur temps avec passion ; les jeunes en Service Civique apportent une présence quotidienne sur les missions d'intérêt général ; les salariés coordonnent l'administration et la logistique.
                </p>
              </div>

              <!-- Incidences RH -->
              <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 space-y-2">
                <h5 class="font-black text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                  <span>⚠️</span> Incidences de la Fatigue, du Moral et du Management
                </h5>
                <ul class="list-disc list-inside space-y-1 text-[11.5px] text-rose-950 dark:text-rose-300 font-medium pl-1">
                  <li><strong>Surmenage et risque d'accident :</strong> Enchaîner les postes sans temps de repos physiologique épuise les secouristes. Un bénévole fatigué manque de vigilance au volant et lors des gestes de secours.</li>
                  <li><strong>Iniquité et favoritisme :</strong> Mobiliser constamment les mêmes têtes tout en laissant les autres de côté crée des jalousies internes et un sentiment d'injustice qui fracture l'esprit d'équipe.</li>
                  <li><strong>Démissions et perte de savoir-faire :</strong> Si des tensions ou un épuisement persistent sans écoute ni solution de la direction, des bénévoles finissent par rendre leur tenue. Un management humain et attentif reste le premier garant de la longévité de l'antenne.</li>
                </ul>
              </div>
            </div>

          </div>

          <!-- ================= ONGLET 3 : QUESTIONS FRÉQUENTES ================= -->
          <div id="help-tab-content-faq" class="hidden space-y-3">
            <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <strong class="text-slate-900 dark:text-slate-100 font-extrabold flex items-center gap-1.5 text-xs">
                <span>❓</span> Pourquoi mes bénévoles mettent-ils du temps à répondre ou refusent-ils parfois ?
              </strong>
              <p class="text-slate-600 dark:text-slate-300 text-[11.5px]">
                Vos secouristes sont des bénévoles qui ont une vie professionnelle, familiale et des contraintes personnelles. Ils ne sont pas des salariés mobilisables 24h/24 sans préavis. Veillez à constituer un vivier d'effectifs suffisamment large pour couvrir tous les créneaux.
              </p>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <strong class="text-slate-900 dark:text-slate-100 font-extrabold flex items-center gap-1.5 text-xs">
                <span>❓</span> Pourquoi ne puis-je plus modifier l'équipage d'un véhicule en mission ?
              </strong>
              <p class="text-slate-600 dark:text-slate-300 text-[11.5px]">
                Pour des raisons strictes de sécurité et de réalisme opérationnel, la composition de l'équipage est verrouillée dès que le véhicule quitte la base. Vous devez attendre le retour complet du véhicule à l'antenne pour modifier ses effectifs.
              </p>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <strong class="text-slate-900 dark:text-slate-100 font-extrabold flex items-center gap-1.5 text-xs">
                <span>❓</span> Quels sont les impacts réels si un dispositif part sans matériel complet ?
              </strong>
              <p class="text-slate-600 dark:text-slate-300 text-[11.5px]">
                Un équipage envoyé sur le terrain avec une logistique incomplète subit une détresse morale immédiate face aux victimes. Si aucune solution n'est trouvée pour réapprovisionner le poste, la dégradation du moral des secouristes s'amplifie fortement et peut déboucher sur des démissions.
              </p>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <strong class="text-slate-900 dark:text-slate-100 font-extrabold flex items-center gap-1.5 text-xs">
                <span>❓</span> Le multi-compte est-il toléré sur Protec Live ?
              </strong>
              <p class="text-slate-600 dark:text-slate-300 text-[11.5px]">
                <strong class="text-rose-600 dark:text-rose-400">Non, le multi-compte est strictement interdit.</strong> Chaque joueur gère une seule antenne sur son compte personnel afin de préserver l'équité du classement, la sincérité du réseau et la sécurité des parrainages.
              </p>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <strong class="text-slate-900 dark:text-slate-100 font-extrabold flex items-center gap-1.5 text-xs">
                <span>❓</span> Comment retrouver immédiatement mon antenne sur la carte ?
              </strong>
              <p class="text-slate-600 dark:text-slate-300 text-[11.5px]">
                Cliquez simplement sur le bouton <strong>« Mon Antenne »</strong> dans le sélecteur géographique ou en haut de la carte pour recentrer immédiatement la caméra au-dessus de vos locaux.
              </p>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <strong class="text-slate-900 dark:text-slate-100 font-extrabold flex items-center gap-1.5 text-xs">
                <span>❓</span> Quels agréments de sécurité civile sont indispensables ?
              </strong>
              <p class="text-slate-600 dark:text-slate-300 text-[11.5px]">
                L'agrément <strong>D</strong> (Dispositifs Prévisionnels de Secours) permet d'assurer les postes de secours. L'agrément <strong>A</strong> est requis pour intervenir à la demande du SAMU 15. L'agrément <strong>B</strong> concerne le sauvetage aquatique et le <strong>C</strong> la recherche et les équipes cynotechniques.
              </p>
            </div>
          </div>

          <!-- ================= ONGLET 4 : GLOSSAIRE & INFOBULLES ================= -->
          <div id="help-tab-content-glossaire" class="hidden space-y-3.5">
            
            <!-- Bannière avec Bouton Toggle des Infobulles d'abréviations -->
            <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-200 dark:border-blue-800/80 space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="space-y-1">
                  <h4 class="font-black text-pc-blue dark:text-sky-300 text-xs flex items-center gap-2">
                    <i data-lucide="info" class="w-4 h-4 text-pc-blue dark:text-sky-400"></i>
                    <span>Infobulles Interactives d'Abréviations</span>
                  </h4>
                  <p class="text-[11.5px] text-slate-600 dark:text-slate-300">
                    Survolez n'importe quel sigle ou acronyme dans l'interface (VPSP, PSE2, PAPS, NOVI, CRRA...) pour afficher instantanément sa définition et son rôle officiel.
                  </p>
                </div>
                <button type="button" id="help-toggle-tooltips-btn" onclick="window.ProtecHelp.toggleGlossaryTooltips()" class="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition flex items-center gap-2 cursor-pointer shrink-0">
                  <i data-lucide="check-circle" class="w-4 h-4"></i>
                  <span>Bulles d’Info au Survol : ACTIVÉES ✓</span>
                </button>
              </div>
              <div class="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-blue-100 dark:border-blue-900/50 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span>💡</span>
                <span><strong>Astuce :</strong> Le bouton ci-dessus vous permet d'activer ou de désactiver ces bulles d'aide à tout moment selon votre préférence de navigation.</span>
              </div>
            </div>

            <!-- Barre de recherche et filtres de catégories -->
            <div class="space-y-2">
              <div class="relative">
                <input type="text" id="help-glossary-search" oninput="window.ProtecHelp.filterGlossary(this.value)" placeholder="Rechercher un sigle ou un terme (ex: VPSP, PSE2, DPS, PMA, CI, SAMU, SDIS...)" class="w-full pl-8 pr-3 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pc-blue font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400" />
                <span class="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
              </div>
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px] font-bold" id="help-glossary-filter-bar">
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('all')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-pc-blue text-white shadow-2xs whitespace-nowrap cursor-pointer font-bold" data-cat="all">Tous les sigles</button>
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('Flotte')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer font-bold" data-cat="Flotte">Véhicules & Flotte</button>
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('Secourisme')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer font-bold" data-cat="Secourisme">Secourisme & Grades</button>
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('Dispositif')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer font-bold" data-cat="Dispositif">Missions & DPS</button>
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('Médical')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer font-bold" data-cat="Médical">Matériel & Médical</button>
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('Institution')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer font-bold" data-cat="Institution">Institutions</button>
              </div>
            </div>

            <!-- Grille des termes du glossaire -->
            <div id="help-glossary-list" class="space-y-2 pt-1 max-h-[48vh] overflow-y-auto pr-1">
              <!-- Rempli dynamiquement -->
            </div>
          </div>

        </div>

        <!-- Footer Modal -->
        <div class="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs flex-shrink-0">
          <button onclick="window.ProtecPrivacy ? window.ProtecPrivacy.openModal() : null" class="text-slate-400 hover:text-pc-blue transition text-[11px] font-semibold underline flex items-center gap-1 cursor-pointer">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
            <span>Mentions Légales & Règles de Jeu</span>
          </button>
          <button onclick="window.ProtecHelp.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold transition cursor-pointer">
            Fermer le Manuel
          </button>
        </div>

      </div>
    `;
    document.body.appendChild(div);
  },

  filterGlossary(query) {
    this.glossaryQuery = (query || '').trim().toLowerCase();
    this.renderGlossaryContent();
  },

  filterGlossaryCategory(cat) {
    this.glossaryCategory = cat || 'all';
    const buttons = document.querySelectorAll('.help-glossary-cat-btn');
    buttons.forEach(btn => {
      const bCat = btn.getAttribute('data-cat');
      if (bCat === this.glossaryCategory) {
        btn.className = 'help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-pc-blue text-white shadow-2xs whitespace-nowrap cursor-pointer font-bold';
      } else {
        btn.className = 'help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer font-bold';
      }
    });
    this.renderGlossaryContent();
  },

  renderGlossaryContent() {
    const listEl = document.getElementById('help-glossary-list');
    if (!listEl) return;

    const dict = window.ProtecGlossaire?.dictionary || {};
    const q = this.glossaryQuery;
    const catFilter = this.glossaryCategory;

    const entries = Object.entries(dict).filter(([key, val]) => {
      // Filtre catégorie
      if (catFilter !== 'all') {
        const itemCat = (val.category || '').toLowerCase();
        if (!itemCat.includes(catFilter.toLowerCase())) return false;
      }
      // Filtre recherche
      if (q) {
        const matchKey = key.toLowerCase().includes(q);
        const matchName = (val.fullName || '').toLowerCase().includes(q);
        const matchDesc = (val.desc || '').toLowerCase().includes(q);
        const matchCat = (val.category || '').toLowerCase().includes(q);
        if (!matchKey && !matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });

    if (entries.length === 0) {
      listEl.innerHTML = `
        <div class="py-8 text-center text-xs text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
          Aucun sigle trouvé pour cette recherche.
        </div>
      `;
      return;
    }

    listEl.innerHTML = entries.map(([key, item]) => `
      <div class="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition space-y-1">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded font-mono font-black text-xs bg-pc-blue text-white shadow-2xs">${key}</span>
            <strong class="text-xs text-slate-900 dark:text-slate-100 font-black">${item.fullName}</strong>
          </div>
          <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase tracking-wide flex-shrink-0">${item.category || 'Abréviation'}</span>
        </div>
        ${item.desc ? `
          <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium pl-0.5">
            ${item.desc}
          </p>
        ` : ''}
      </div>
    `).join('');
  }
};
