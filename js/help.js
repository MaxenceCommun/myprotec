// js/help.js - Guide Opérationnel & Aide Complète du Directeur (MyProtec)
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
          btn.className = 'px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer';
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
    div.className = 'hidden fixed inset-0 z-50 items-center justify-center bg-slate-950/80 backdrop-blur-xl p-3 sm:p-4 animate-in fade-in select-none';
    div.innerHTML = `
      <div class="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl glass-panel-heavy border border-white/80 p-5 sm:p-6 shadow-2xl relative bg-white/95 text-slate-800">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-3 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-orange-500/15 text-pc-orange flex items-center justify-center text-xl font-black shadow-inner">
              <span class="w-7 h-7 rounded-full bg-pc-orange text-white flex items-center justify-center font-black text-sm shadow-sm">?</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base sm:text-lg font-black text-slate-900">Guide de Commandement de l'Antenne</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-pc-blue uppercase">Aide Officielle</span>
              </div>
              <p class="text-xs text-slate-500 font-semibold">Manuel opérationnel pour gérer et développer votre unité de secours</p>
            </div>
          </div>
          <button onclick="window.ProtecHelp.closeModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Navigation par Onglets -->
        <div class="flex flex-wrap items-center gap-1.5 pb-3 border-b border-slate-100 flex-shrink-0">
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
            <span>Conseils & Véhicules</span>
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
        <div class="overflow-y-auto pr-1 sm:pr-2 py-3 space-y-4 text-xs leading-relaxed text-slate-700 flex-1 no-scrollbar">

          <!-- ================= TAB 1 : BIEN DÉBUTER ================= -->
          <div id="help-tab-content-debuter" class="space-y-3">
            <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80">
              <h4 class="font-black text-pc-blue text-sm mb-1 flex items-center gap-2">
                <span>📍</span> Étape 1 : Implanter votre antenne
              </h4>
              <p>
                Dès votre arrivée, choisissez l'emplacement géographique de votre antenne locale sur la carte. C'est votre base opérationnelle : tous vos véhicules y sont garés, vos bénévoles s'y rassemblent avant le départ, et votre matériel y est stocké.
              </p>
            </div>

            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <h4 class="font-black text-slate-900 text-sm flex items-center gap-2">
                <span>👥</span> Étape 2 : Mobiliser vos bénévoles
              </h4>
              <p>
                Une antenne vit grâce à ses secouristes bénévoles. Chaque bénévole possède :
              </p>
              <ul class="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li>Des <strong>qualifications de secours</strong> : PSC1 (premiers secours civiques), PSE1, PSE2 (premiers secours en équipe), CI (Chef d'Intervention).</li>
                <li>Des <strong>permis de conduire</strong> : Permis B (conduite standard) ou P.VPSP (permis spécifique avec transport de victime).</li>
                <li>Des <strong>plages de disponibilité variables</strong> : ce sont des bénévoles engagés qui ont une vie professionnelle et personnelle. Leurs disponibilités et leurs délais de réponse sont naturels et réalistes.</li>
              </ul>
            </div>

            <div class="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80">
              <h4 class="font-black text-pc-orange text-sm mb-1 flex items-center gap-2">
                <span>🚑</span> Étape 3 : Équiper votre premier véhicule
              </h4>
              <p>
                Votre antenne dispose d'un premier véhicule de secours (VPSP). Veillez à lui attribuer un lot de matériel et à constituer un équipage adapté avant de l'engager sur le terrain.
              </p>
            </div>
          </div>

          <!-- ================= TAB 2 : MISSIONS & DISPOSITIFS ================= -->
          <div id="help-tab-content-missions" class="hidden space-y-3">
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <h4 class="font-black text-slate-900 text-sm flex items-center gap-2">
                <span>📋</span> Les Dispositifs Prévisionnels de Secours (DPS)
              </h4>
              <p>
                Les DPS constituent le cœur de votre activité opérationnelle et de vos revenus associatifs :
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div class="p-2.5 rounded-xl bg-white border border-slate-200">
                  <strong class="text-pc-blue block">Petits DPS (PAPS / PEPS)</strong>
                  Manifestations sportives légères, concerts de quartier (1 binôme ou 1 VPSP).
                </div>
                <div class="p-2.5 rounded-xl bg-white border border-slate-200">
                  <strong class="text-amber-600 block">Moyens DPS</strong>
                  Tournois, festivals régionaux nécessitant plusieurs équipages et 1 Chef de Dispositif.
                </div>
                <div class="p-2.5 rounded-xl bg-white border border-slate-200">
                  <strong class="text-rose-600 block">Grands DPS (GE)</strong>
                  Événements majeurs pouvant nécessiter l'appui d'antennes voisines en renfort inter-départemental.
                </div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
              <h4 class="font-black text-emerald-900 text-sm mb-1 flex items-center gap-2">
                <span>⏱️</span> Déplacements & Temps de Trajet
              </h4>
              <p>
                Les véhicules ne se téléportent pas instantanément : le simulateur calcule la distance réelle par le réseau routier. Vous pouvez visualiser le déplacement du véhicule sur la carte vers le lieu de la mission et son retour vers l'antenne après la mission.
              </p>
            </div>

            <div class="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80">
              <h4 class="font-black text-purple-900 text-sm mb-1 flex items-center gap-2">
                <span>🚨</span> Gardes d'Urgence & Réquisitions (SAMU / SDIS)
              </h4>
              <p>
                En souscrivant aux conventions de garde, votre antenne peut être sollicitée pour des interventions d'urgence de nuit ou en week-end en appui des sapeurs-pompiers et des hôpitaux.
              </p>
            </div>
          </div>

          <!-- ================= TAB 3 : CONSEILS & VÉHICULES ================= -->
          <div id="help-tab-content-regles" class="hidden space-y-3">
            <div class="p-4 rounded-2xl bg-amber-50/80 border border-amber-300/80 space-y-1.5">
              <h4 class="font-black text-amber-950 text-sm flex items-center gap-2">
                <span>⚠️</span> Règle Capitale : Permis B vs P.VPSP
              </h4>
              <p class="text-amber-900">
                <strong>Attention aux idées reçues sur la conduite :</strong>
              </p>
              <ul class="list-disc list-inside space-y-1 text-amber-950 font-medium pl-1">
                <li>Pour déplacer un véhicule (VPSP, VTU, VL) et acheminer l'équipage sur une mission, un <strong>simple Permis B</strong> est suffisant !</li>
                <li>Le permis <strong>P.VPSP</strong> (ou attestation préfectorale de conduite ambulance/secours) est <strong>obligatoire UNIQUEMENT pour le transport d'une victime</strong> (évacuation hospitalière sur un DPS, noria de victimes lors d'une crise, etc.).</li>
                <li>Ne bloquez donc pas un départ en mission sous prétexte que le chauffeur n'a pas P.VPSP si aucun transport sanitaire de victime n'est prévu !</li>
              </ul>
            </div>

            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <h4 class="font-black text-slate-900 text-sm flex items-center gap-2">
                <span>💡</span> Conseils de Gestion Financière & Matériel
              </h4>
              <ul class="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li><strong>Équilibre de trésorerie :</strong> Réalisez régulièrement des DPS et répondez aux conventions locales pour financer l'essence, les tenues et les consommables.</li>
                <li><strong>Formations continues :</strong> Faites monter vos équipiers en grade (PSE1 vers PSE2 puis Chef d'Intervention) pour débloquer des missions de plus grande envergure.</li>
                <li><strong>Marché de l'occasion :</strong> Avant d'acheter du matériel neuf au prix fort, consultez régulièrement les cessions et le marché d'occasion entre antennes.</li>
              </ul>
            </div>

            <div class="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80">
              <h4 class="font-black text-pc-blue text-sm mb-1 flex items-center gap-2">
                <span>🤝</span> Éthique du Bénévolat
              </h4>
              <p>
                Les bénévoles ne peuvent pas être forcés : si un équipier est indisponible ou a besoin de repos, vous devez adapter vos plannings ou former de nouveaux volontaires. C'est l'essence même de la gestion associative en sécurité civile.
              </p>
            </div>
          </div>

          <!-- ================= TAB 4 : FAQ ================= -->
          <div id="help-tab-content-faq" class="hidden space-y-3">
            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <strong class="text-slate-900 font-extrabold flex items-center gap-1.5">
                <span>❓</span> Pourquoi mes bénévoles mettent du temps à répondre ou refusent parfois ?
              </strong>
              <p class="text-slate-600 text-[11px]">
                Chaque bénévole a une vie personnelle, des créneaux de travail et un temps de réaction variable. Ils ne sont pas des salariés permanents de garde continue. Prévoyez une équipe élargie pour couvrir tous les créneaux horaires.
              </p>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <strong class="text-slate-900 font-extrabold flex items-center gap-1.5">
                <span>❓</span> Puis-je créer plusieurs comptes ou plusieurs antennes ?
              </strong>
              <p class="text-slate-600 text-[11px]">
                <strong class="text-rose-600">Non, le multi-compte est strictement interdit.</strong> Chaque joueur gère une seule antenne sur son compte officiel pour préserver l'équité du classement, la sincérité du réseau et la sécurité anti-fraude du parrainage.
              </p>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <strong class="text-slate-900 font-extrabold flex items-center gap-1.5">
                <span>❓</span> Comment fonctionne le programme de Parrainage ?
              </strong>
              <p class="text-slate-600 text-[11px]">
                Votre profil de directeur contient un code de parrainage unique. En invitant un collègue, il reçoit un bonus de bienvenue (+1 500 €) et vous touchez une prime d'encouragement (+2 500 €) dès sa première mission opérationnelle validée. Les comptes frauduleux ou partageant la même connexion sont automatiquement bloqués.
              </p>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <strong class="text-slate-900 font-extrabold flex items-center gap-1.5">
                <span>❓</span> Comment retrouver mon antenne si je me perds sur la carte ?
              </strong>
              <p class="text-slate-600 text-[11px]">
                Cliquez simplement sur le bouton <strong>"Mon Antenne"</strong> dans le sélecteur de départements pour replacer immédiatement la caméra au-dessus de vos locaux.
              </p>
            </div>
          </div>

          <!-- ================= TAB 5 : GLOSSAIRE DES SIGLES ================= -->
          <div id="help-tab-content-glossaire" class="hidden space-y-3">
            <div class="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-3">
              <div>
                <h4 class="font-black text-pc-blue text-xs flex items-center gap-1.5">
                  <i data-lucide="book-open" class="w-4 h-4 text-pc-blue"></i>
                  <span>Glossaire Opérationnel de la Protection Civile</span>
                </h4>
                <p class="text-[11px] text-slate-600 mt-0.5">
                  Consultez la signification de tous les sigles, acronymes et codes radio utilisés en intervention.
                </p>
              </div>
            </div>

            <!-- Barre de recherche et filtres de catégories -->
            <div class="space-y-2">
              <div class="relative">
                <input type="text" id="help-glossary-search" oninput="window.ProtecHelp.filterGlossary(this.value)" placeholder="Rechercher un sigle (ex: VPSP, PSE2, DPS, PMA, CI, SAMU...)" class="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pc-blue font-semibold text-slate-800 placeholder-slate-400" />
                <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              </div>
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px] font-bold" id="help-glossary-filter-bar">
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('all')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-pc-blue text-white shadow-2xs whitespace-nowrap cursor-pointer" data-cat="all">Tous</button>
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('Flotte')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer" data-cat="Flotte">Véhicules</button>
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('Secourisme')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer" data-cat="Secourisme">Secourisme & Grades</button>
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('Dispositif')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer" data-cat="Dispositif">Missions & DPS</button>
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('Médical')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer" data-cat="Médical">Matériel & Médical</button>
                <button type="button" onclick="window.ProtecHelp.filterGlossaryCategory('Institution')" class="help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer" data-cat="Institution">Institutions</button>
              </div>
            </div>

            <!-- Grille des termes du glossaire -->
            <div id="help-glossary-list" class="space-y-2 pt-1 max-h-[50vh] overflow-y-auto pr-1">
              <!-- Rempli dynamiquement -->
            </div>
          </div>

        </div>

        <!-- Footer Modal -->
        <div class="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs flex-shrink-0">
          <button onclick="window.ProtecPrivacy.openModal()" class="text-slate-400 hover:text-pc-blue transition text-[11px] font-semibold underline flex items-center gap-1 cursor-pointer">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
            <span>Mentions Légales & Confidentialité RGPD</span>
          </button>
          <button onclick="window.ProtecHelp.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold transition cursor-pointer">
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
        btn.className = 'help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-pc-blue text-white shadow-2xs whitespace-nowrap cursor-pointer';
      } else {
        btn.className = 'help-glossary-cat-btn px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer';
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
        <div class="py-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-200/80">
          Aucun sigle trouvé pour cette recherche.
        </div>
      `;
      return;
    }

    listEl.innerHTML = entries.map(([key, item]) => `
      <div class="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-1">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded font-mono font-black text-xs bg-pc-blue text-white shadow-2xs">${key}</span>
            <strong class="text-xs text-slate-900 font-black">${item.fullName}</strong>
          </div>
          <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wide flex-shrink-0">${item.category || 'Abréviation'}</span>
        </div>
        ${item.desc ? `
          <p class="text-[11px] text-slate-600 leading-relaxed font-medium pl-0.5">
            ${item.desc}
          </p>
        ` : ''}
      </div>
    `).join('');
  }
};
