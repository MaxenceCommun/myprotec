// js/help.js - Guide Opérationnel & Manuel du Directeur (MyProtec)
window.ProtecHelp = {
  currentTab: 'debuter',

  openModal() {
    let modal = document.getElementById('help-guide-modal');
    if (!modal) {
      this.createModalDOM();
      modal = document.getElementById('help-guide-modal');
    }
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      this.switchTab(this.currentTab);
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
    const tabs = ['debuter', 'missions', 'regles', 'faq', 'glossaire'];
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
    if (tabId === 'glossaire') {
      this.renderGlossaryContent();
    }
    if (window.lucide) window.lucide.createIcons();
  },

  createModalDOM() {
    const div = document.createElement('div');
    div.id = 'help-guide-modal';
    div.className = 'hidden fixed inset-0 z-[70] items-center justify-center bg-slate-950/80 backdrop-blur-xl p-3 sm:p-4 animate-in fade-in select-none';
    div.innerHTML = `
      <div class="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl p-5 sm:p-6 shadow-2xl relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-3 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-orange-500/15 text-pc-orange flex items-center justify-center text-xl font-black shadow-inner">
              <span class="w-7 h-7 rounded-full bg-pc-orange text-white flex items-center justify-center font-black text-sm shadow-sm">?</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">Manuel de Commandement de l'Antenne</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950/60 text-pc-blue dark:text-sky-300 uppercase">Guide Officiel</span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-semibold">Manuel opérationnel pour gérer, structurer et développer votre unité de secours</p>
            </div>
          </div>
          <button onclick="window.ProtecHelp.closeModal()" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition cursor-pointer">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Navigation par Onglets -->
        <div class="flex flex-wrap items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <button id="help-tab-btn-debuter" onclick="window.ProtecHelp.switchTab('debuter')">
            <i data-lucide="compass" class="w-3.5 h-3.5"></i>
            <span>Bien Débuter</span>
          </button>
          <button id="help-tab-btn-missions" onclick="window.ProtecHelp.switchTab('missions')">
            <i data-lucide="activity" class="w-3.5 h-3.5"></i>
            <span>Missions & Dispositifs</span>
          </button>
          <button id="help-tab-btn-regles" onclick="window.ProtecHelp.switchTab('regles')">
            <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
            <span>Flotte & Écussons</span>
          </button>
          <button id="help-tab-btn-faq" onclick="window.ProtecHelp.switchTab('faq')">
            <i data-lucide="help-circle" class="w-3.5 h-3.5"></i>
            <span>Questions Fréquentes</span>
          </button>
          <button id="help-tab-btn-glossaire" onclick="window.ProtecHelp.switchTab('glossaire')">
            <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
            <span>Glossaire des Sigles</span>
          </button>
        </div>

        <!-- Corps Déroulant -->
        <div class="overflow-y-auto pr-1 sm:pr-2 py-3 space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-200 flex-1 no-scrollbar">

          <!-- ================= TAB 1 : BIEN DÉBUTER ================= -->
          <div id="help-tab-content-debuter" class="space-y-3">
            <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-800/60">
              <h4 class="font-black text-pc-blue dark:text-sky-300 text-sm mb-1 flex items-center gap-2">
                <span>📍</span> Étape 1 : Implanter votre antenne opérationnelle
              </h4>
              <p>
                Dès votre arrivée, choisissez l'emplacement géographique de votre antenne locale sur la carte. C'est votre base opérationnelle : tous vos véhicules y sont garés, votre matériel médical y est stocké et vos effectifs s'y rassemblent avant chaque départ.
              </p>
            </div>

            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <h4 class="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <span>👥</span> Étape 2 : Convoquer & Mobiliser vos bénévoles à la base
              </h4>
              <p>
                Une antenne vit grâce à ses secouristes bénévoles. Chaque bénévole possède :
              </p>
              <ul class="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1">
                <li>Des <strong>qualifications de secours</strong> : PSC1 (premiers secours), PSE1, PSE2 (premiers secours en équipe), CI (Chef d'Intervention).</li>
                <li>Des <strong>permis de conduire</strong> : Permis B (acheminement standard) ou P.VPSP (conduite ambulance / transport de victimes).</li>
                <li>Des <strong>disponibilités réalistes</strong> : Vous pouvez utiliser le bouton <strong>« Faire venir à la base »</strong> pour faire converger un bénévole vers l'antenne. Il s'y tient prêt en attendant le rassemblement complet de l'équipage.</li>
              </ul>
            </div>

            <div class="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
              <h4 class="font-black text-indigo-950 dark:text-indigo-200 text-sm flex items-center gap-2">
                <span>🏛️</span> Étape 3 : Structurer les 6 Pôles d'Antenne
              </h4>
              <p>
                Rendez-vous dans le menu <strong>Pôles d'Antenne</strong> pour organiser vos secteurs d'activité : Pôle Opérationnel & Secours, Matériel & Flotte, Recrutement, Mécénat & Action Solidaire, etc.
              </p>
              <p class="text-indigo-900 dark:text-indigo-300">
                <strong>Nommer un Responsable :</strong> Désignez un chef pour chaque pôle afin d'activer des bonus d'antenne permanents (réduction d'usure mécanique, boost d'XP secouristes, gains bonifiés sur les postes).
              </p>
            </div>

            <div class="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/60">
              <h4 class="font-black text-pc-orange dark:text-orange-300 text-sm mb-1 flex items-center gap-2">
                <span>🚑</span> Étape 4 : Équiper votre premier véhicule (VPSP)
              </h4>
              <p>
                Votre antenne dispose d'un premier véhicule de secours (VPSP). Veillez à lui attribuer un lot de matériel et à constituer un équipage adapté avant de l'engager sur le terrain.
              </p>
            </div>
          </div>

          <!-- ================= TAB 2 : MISSIONS & DISPOSITIFS ================= -->
          <div id="help-tab-content-missions" class="hidden space-y-3">
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <h4 class="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <span>📋</span> Les Dispositifs Prévisionnels de Secours (DPS)
              </h4>
              <p>
                Les DPS constituent le cœur de votre activité opérationnelle et de vos revenus associatifs :
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div class="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <strong class="text-pc-blue dark:text-sky-300 block">Petits DPS (PAPS / PEPS)</strong>
                  Manifestations sportives légères, concerts de quartier (1 binôme ou 1 VPSP).
                </div>
                <div class="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <strong class="text-amber-600 dark:text-amber-400 block">Moyens DPS</strong>
                  Tournois, festivals régionaux nécessitant plusieurs équipages et 1 Chef de Dispositif.
                </div>
                <div class="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <strong class="text-rose-600 dark:text-rose-400 block">Grands DPS (GE)</strong>
                  Événements majeurs pouvant nécessiter l'appui d'antennes voisines en renfort inter-départemental.
                </div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/60 space-y-1.5">
              <h4 class="font-black text-amber-950 dark:text-amber-200 text-sm flex items-center gap-2">
                <span>🔒</span> Règle Capitale : Verrouillage de l'Équipage au Départ
              </h4>
              <p class="text-amber-900 dark:text-amber-300">
                <strong>Les équipages ne peuvent pas être modifiés en plein trajet :</strong>
              </p>
              <ul class="list-disc list-inside space-y-1 text-amber-950 dark:text-amber-200 font-medium pl-1">
                <li>Vous pouvez affecter des bénévoles à un véhicule <strong>uniquement tant qu'il est présent à la base</strong>.</li>
                <li>Dès que le véhicule quitte l'antenne pour se rendre sur le lieu de la mission, sa composition est verrouillée.</li>
                <li>Les bénévoles sont officiellement engagés sur le terrain uniquement lorsque leur véhicule est déployé.</li>
              </ul>
            </div>

            <div class="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
              <h4 class="font-black text-emerald-900 dark:text-emerald-200 text-sm mb-1 flex items-center gap-2">
                <span>⏱️</span> Déplacements & Temps de Trajet Réels
              </h4>
              <p>
                Les véhicules ne se téléportent pas instantanément : le simulateur calcule la distance réelle par le réseau routier. Vous pouvez visualiser le déplacement du véhicule sur la carte vers le lieu de la mission et son retour vers l'antenne après la mission.
              </p>
            </div>

            <div class="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60">
              <h4 class="font-black text-purple-900 dark:text-purple-200 text-sm mb-1 flex items-center gap-2">
                <span>🚨</span> Alertes de Crise & Synchronisation Départementale
              </h4>
              <p>
                Lors d'une crise majeure (intempéries, inondations, accident ferroviaire), tous les directeurs d'un même département partagent les alertes en direct. Vous pouvez lancer une <strong>demande de renfort départementale</strong> : les autres joueurs du département recevront votre appel et pourront dépêcher leurs véhicules pour intervenir à vos côtés.
              </p>
            </div>
          </div>

          <!-- ================= TAB 3 : FLOTTE, ÉCUSSONS & RÈGLES ================= -->
          <div id="help-tab-content-regles" class="hidden space-y-3">
            <div class="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/60 space-y-1.5">
              <h4 class="font-black text-amber-950 dark:text-amber-200 text-sm flex items-center gap-2">
                <span>⚠️</span> Permis B vs P.VPSP : Ne bloquez pas vos départs !
              </h4>
              <p class="text-amber-900 dark:text-amber-300">
                <strong>Attention aux idées reçues sur la conduite des véhicules de secours :</strong>
              </p>
              <ul class="list-disc list-inside space-y-1 text-amber-950 dark:text-amber-200 font-medium pl-1">
                <li>Pour déplacer un véhicule (VPSP, VTU, VL) et acheminer l'équipe sur un poste, un <strong>simple Permis B</strong> est suffisant !</li>
                <li>Le permis <strong>P.VPSP</strong> (autorisation préfectorale de conduite ambulance) est <strong>requis UNIQUEMENT pour le transport d'une victime vers l'hôpital</strong>.</li>
                <li>Si aucune évacuation sanitaire de victime n'est prévue, ne bloquez pas le départ d'une équipe sous prétexte que le chauffeur n'a pas P.VPSP.</li>
              </ul>
            </div>

            <div class="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 space-y-1.5">
              <h4 class="font-black text-purple-950 dark:text-purple-200 text-sm flex items-center gap-2">
                <span>🛡️</span> Écussons Officiels & Bourse Inter-Antennes
              </h4>
              <p>
                Les écussons célèbrent les spécialités (PMA, Cynotechnique, Drones, Nautique), les départements et les faits d'armes de votre unité :
              </p>
              <ul class="list-disc list-inside space-y-1 text-purple-900 dark:text-purple-300 pl-1">
                <li><strong>Tableau en Liège :</strong> Affichez fièrement votre collection d'écussons dans le bureau de votre antenne.</li>
                <li><strong>Bourse d'Échange & Troc :</strong> Échangez vos doublons avec d'autres antennes en ligne ou rachetez des patchs rares sur le marché fédéral.</li>
                <li><strong>Attributions officielles :</strong> Les insignes commémoratifs et distinctions fédérales sont décernés lors d'événements nationaux ou par le commandement.</li>
              </ul>
            </div>

            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <h4 class="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <span>🔧</span> Entretien de Flotte & Pharmacie
              </h4>
              <ul class="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1">
                <li><strong>Maintenance :</strong> Surveillez l'état d'usure de vos véhicules et effectuez les révisions régulières pour éviter les pannes en intervention.</li>
                <li><strong>Réarmement Sanitaire :</strong> Après chaque transport, désinfectez la cellule sanitaire du VPSP et renouvelez les bouteilles d'oxygène et électrodes DAE.</li>
              </ul>
            </div>
          </div>

          <!-- ================= TAB 4 : FAQ ================= -->
          <div id="help-tab-content-faq" class="hidden space-y-3">
            <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <strong class="text-slate-900 dark:text-slate-100 font-extrabold flex items-center gap-1.5">
                <span>❓</span> Pourquoi mes bénévoles mettent du temps à répondre ou refusent parfois ?
              </strong>
              <p class="text-slate-600 dark:text-slate-300 text-[11px]">
                Chaque bénévole a une vie personnelle, des créneaux de travail et un temps de réaction variable. Ils ne sont pas des salariés permanents de garde continue. Prévoyez une équipe élargie pour couvrir tous les créneaux horaires.
              </p>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <strong class="text-slate-900 dark:text-slate-100 font-extrabold flex items-center gap-1.5">
                <span>❓</span> Pourquoi ne puis-je plus affecter un bénévole à mon véhicule ?
              </strong>
              <p class="text-slate-600 dark:text-slate-300 text-[11px]">
                Si le véhicule a déjà quitté la base ou est en transit vers une mission, son équipage est verrouillé. Vous devez attendre son retour à l'antenne pour modifier la composition des effectifs.
              </p>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <strong class="text-slate-900 dark:text-slate-100 font-extrabold flex items-center gap-1.5">
                <span>❓</span> Puis-je créer plusieurs comptes ou plusieurs antennes ?
              </strong>
              <p class="text-slate-600 dark:text-slate-300 text-[11px]">
                <strong class="text-rose-600 dark:text-rose-400">Non, le multi-compte est strictement interdit.</strong> Chaque joueur gère une seule antenne sur son compte officiel pour préserver l'équité du classement, la sincérité du réseau et la sécurité anti-fraude du parrainage.
              </p>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <strong class="text-slate-900 dark:text-slate-100 font-extrabold flex items-center gap-1.5">
                <span>❓</span> Comment retrouver mon antenne si je me perds sur la carte ?
              </strong>
              <p class="text-slate-600 dark:text-slate-300 text-[11px]">
                Cliquez simplement sur le bouton <strong>"Mon Antenne"</strong> dans le sélecteur de départements pour replacer immédiatement la caméra au-dessus de vos locaux.
              </p>
            </div>
          </div>

          <!-- ================= TAB 5 : GLOSSAIRE DES SIGLES ================= -->
          <div id="help-tab-content-glossaire" class="hidden space-y-3">
            <div class="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between gap-3">
              <div>
                <h4 class="font-black text-pc-blue dark:text-sky-300 text-xs flex items-center gap-1.5">
                  <i data-lucide="book-open" class="w-4 h-4 text-pc-blue dark:text-sky-400"></i>
                  <span>Glossaire Opérationnel de la Protection Civile</span>
                </h4>
                <p class="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  Consultez la signification de tous les sigles, acronymes et codes radio utilisés en intervention.
                </p>
              </div>
            </div>

            <!-- Barre de recherche et filtres de catégories -->
            <div class="space-y-2">
              <div class="relative">
                <input type="text" id="help-glossary-search" oninput="window.ProtecHelp.filterGlossary(this.value)" placeholder="Rechercher un sigle (ex: VPSP, PSE2, DPS, PMA, CI, SAMU...)" class="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pc-blue font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400" />
                <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              </div>
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px] font-bold" id="help-glossary-filter-bar">
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('all')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-pc-blue text-white shadow-2xs whitespace-nowrap cursor-pointer font-bold" data-cat="all">Tous</button>
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('Flotte')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer font-bold" data-cat="Flotte">Véhicules</button>
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('Secourisme')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer font-bold" data-cat="Secourisme">Secourisme & Grades</button>
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('Dispositif')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer font-bold" data-cat="Dispositif">Missions & DPS</button>
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('Médical')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer font-bold" data-cat="Médical">Matériel & Médical</button>
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('Institution')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer font-bold" data-cat="Institution">Institutions</button>
              </div>
            </div>

            <!-- Grille des termes du glossaire -->
            <div id="help-glossary-list" class="space-y-2 pt-1 max-h-[50vh] overflow-y-auto pr-1">
              <!-- Rempli dynamiquement -->
            </div>
          </div>

        </div>

        <!-- Footer Modal -->
        <div class="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs flex-shrink-0">
          <button onclick="window.ProtecPrivacy.openModal()" class="text-slate-400 hover:text-pc-blue transition text-[11px] font-semibold underline flex items-center gap-1 cursor-pointer">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
            <span>Mentions Légales & Confidentialité RGPD</span>
          </button>
          <button onclick="window.ProtecHelp.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold transition cursor-pointer">
            Fermer le Guide
          </button>
        </div>

      </div>
    `;
    document.body.appendChild(div);
  },

  glossaryQuery: '',
  glossaryCategory: 'all',

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
