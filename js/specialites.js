/**
 * PROTEC LIVE - GESTION DES SPÉCIALITÉS OPÉRATIONNELLES D'ANTENNE
 * 
 * Permet au joueur de proposer et financer l'ouverture de sections spécialisées :
 * 1. Télépilotes Drone (Recherche aérienne & caméra thermique) - Matériel 8 500 €, 50% de réussite à la formation
 * 2. Équipe Cynotechnique (Chiens de quête & recherche de personnes disparues) - Chien personnel requis
 * 3. Unité Sauvetage Aquatique & Embarcation (Permis Bateau requis)
 * 4. Équipe Tout-Terrain / Hors-Route (VLTT 4x4 & franchissement)
 * 5. Équipe Moto & Quad (Intervention rapide & Permis Moto requis)
 * 
 * Gestion des Permis Spécialisés :
 * - P.VPSP : Conduite d'ambulance d'urgence avec victime à bord
 * - Permis Moto (A/A2)
 * - Permis Poids Lourd (C/C1 pour PC lourd ou PMA)
 * - Permis Bateau (Fluvial / Côtier)
 */

window.ProtecSpecialites = {
  // Catalogue des spécialités
  SPECIALTIES_CATALOG: [
    {
      id: 'drone',
      name: 'Unité Télépilotes Drone & Reconnaissance',
      icon: 'camera',
      color: 'sky',
      gearName: 'Drone Professionnel Homologué DGAC avec Caméra Thermique 4K',
      gearCost: 8500,
      trainingCostPerPerson: 900,
      trainingSuccessRate: 0.50, // 50% de réussite comme précisé par l'utilisateur
      skillKey: 'telepilote_drone',
      skillLabel: 'Télépilote Drone DGAC',
      desc: 'Reconnaissance aérienne nocturne, levée de doute sur crues et assistance thermique aux recherches de personnes disparues avec la Gendarmerie.',
      maxCandidates: 2,
      interestRatio: 0.22 // Peu de personnes intéressées
    },
    {
      id: 'cyno',
      name: 'Équipe Cynotechnique (Chiens de Recherche)',
      icon: 'dog',
      color: 'amber',
      gearName: 'Dotation Maître-Chien (Harnais tactique, GPS canin & caisse VTP)',
      gearCost: 1900,
      trainingCostPerPerson: 650,
      trainingSuccessRate: 0.70,
      skillKey: 'cyno_recherche',
      skillLabel: 'Conducteur Chien de Recherche',
      desc: 'Chiens de quête formés au pistage d’odeurs humaines en sous-bois et décombres. Crucial lors des disparitions inquiétantes.',
      maxCandidates: 1,
      interestRatio: 0.15 // Très rare (propriétaire de chien apte)
    },
    {
      id: 'nautique',
      name: 'Unité Sauvetage Aquatique & Embarcation',
      icon: 'anchor',
      color: 'blue',
      gearName: 'Embarcation Pneumatique Semi-Rigide de Secours & Moteur Hors-Bord',
      gearCost: 6200,
      trainingCostPerPerson: 550,
      trainingSuccessRate: 0.80,
      skillKey: 'permis_bateau',
      skillLabel: 'Permis Bateau & Sauveteur Aquatique',
      desc: 'Évacuation de sinistrés lors d’inondations majeures, sauvetage fluvial et surveillance de plans d’eau.',
      maxCandidates: 3,
      interestRatio: 0.28
    },
    {
      id: 'hors_route',
      name: 'Équipe Tout-Terrain & Franchissement (VLTT 4x4)',
      icon: 'compass',
      color: 'emerald',
      gearName: 'Pack Franchissement (Treuil électrique, sangles, projecteurs 4x4)',
      gearCost: 4200,
      trainingCostPerPerson: 400,
      trainingSuccessRate: 0.85,
      skillKey: 'conduite_4x4',
      skillLabel: 'Pilote Hors-Route Tout-Terrain',
      desc: 'Acheminement d’équipes de secours en milieu escarpé, forêts denses, boue et zones isolées lors de tempêtes.',
      maxCandidates: 4,
      interestRatio: 0.40
    },
    {
      id: 'moto',
      name: 'Équipe Motos & Quads d’Intervention Rapide',
      icon: 'zap',
      color: 'purple',
      gearName: 'Motos d’Intervention Médicalisées & Sacoches d’Urgence',
      gearCost: 5800,
      trainingCostPerPerson: 450,
      trainingSuccessRate: 0.75,
      skillKey: 'permis_moto',
      skillLabel: 'Permis Moto A / Pilote d’Intervention',
      desc: 'Progression ultra-rapide à travers la foule lors de marathons et manifestations pour porter les premiers soins.',
      maxCandidates: 3,
      interestRatio: 0.30
    }
  ],

  // Initialisation dans les données du jeu
  injectState(game) {
    if (!game.specialtiesOpened) {
      game.specialtiesOpened = {};
    }
  },

  // Proposer l'ouverture d'une spécialité (Achat du matériel requis)
  openSpecialtySection(game, specId) {
    this.injectState(game);
    const spec = this.SPECIALTIES_CATALOG.find(s => s.id === specId);
    if (!spec) return;

    if (game.specialtiesOpened[specId]) {
      game.showToast('Section Déjà Ouverte', `La section « ${spec.name} » est déjà opérationnelle dans votre antenne.`, 'blue');
      return;
    }

    if (game.resources.money < spec.gearCost) {
      game.showToast('Fonds Insuffisants', `L’acquisition du matériel (${spec.gearName}) requiert ${spec.gearCost.toLocaleString('fr-FR')} €.`, 'orange');
      return;
    }

    if (!confirm(`🚁 OUVERTURE D'UNE NOUVELLE SPÉCIALITÉ :\n\n• Section : ${spec.name}\n• Matériel spécialisé requis : ${spec.gearName} (${spec.gearCost.toLocaleString('fr-FR')} €)\n\nConfirmez-vous l'investissement ? Le jeu proposera ensuite les bénévoles intéressés pour débuter leur formation.`)) {
      return;
    }

    game.resources.money -= spec.gearCost;
    game.specialtiesOpened[specId] = {
      openedAt: Date.now(),
      qualifiedVolunteers: []
    };

    if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();

    game.showToast('Spécialité Ouverte !', `Le matériel « ${spec.gearName} » a été livré à l'antenne !`, 'green');
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Inscrire un bénévole à la formation spécialisée
  sendVolunteerToTraining(game, specId, volunteerId) {
    this.injectState(game);
    const spec = this.SPECIALTIES_CATALOG.find(s => s.id === specId);
    const vol = game.volunteers.find(v => v.id === volunteerId);
    if (!spec || !vol) return;

    if (game.resources.money < spec.trainingCostPerPerson) {
      game.showToast('Trésorerie Insuffisante', `Le stage de formation coûte ${spec.trainingCostPerPerson} €.`, 'orange');
      return;
    }

    if (vol.skills && vol.skills.includes(spec.skillKey)) {
      game.showToast('Déjà Qualifié', `${vol.name} détient déjà la qualification ${spec.skillLabel}.`, 'blue');
      return;
    }

    game.resources.money -= spec.trainingCostPerPerson;

    // Simulation de l'examen de certification
    const isSuccess = Math.random() < spec.trainingSuccessRate;

    if (isSuccess) {
      vol.skills = vol.skills || [];
      vol.skills.push(spec.skillKey);
      vol.experience = Math.min(100, (vol.experience || 30) + 15);

      if (!game.specialtiesOpened[specId].qualifiedVolunteers.includes(vol.id)) {
        game.specialtiesOpened[specId].qualifiedVolunteers.push(vol.id);
      }

      if (window.ProtecAudio) window.ProtecAudio.playRadioBeep();
      game.showToast('Certification Réussie ! 🎓', `Bravo ! ${vol.name} a brillamment validé sa formation de « ${spec.skillLabel} ».`, 'green');
    } else {
      game.showToast('Examen Échoué ⚠️', `${vol.name} n'a pas validé l'examen de « ${spec.skillLabel} » (taux de réussite : ${Math.round(spec.trainingSuccessRate * 100)}%). Vous pourrez le réinscrire plus tard.`, 'orange');
    }

    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Rendu de l'interface des spécialités
  renderModal(game) {
    this.injectState(game);
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');
    title.textContent = 'Spécialités Opérationnelles & Sections d’Appui';
    subtitle.textContent = 'Télépilotes Drone, Maîtres-Chiens Cyno, Sauvetage Aquatique, 4x4 et Motos';
    icon.setAttribute('data-lucide', 'crosshair');

    body.innerHTML = `
      <div class="space-y-6">
        
        <!-- En-tête explicatif -->
        <div class="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-pc-blue to-indigo-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-2xl">🚁</span>
              <div>
                <h3 class="text-base font-black">Sections Spécialisées & Appui Gendarmerie / Préfecture</h3>
                <p class="text-xs text-white/80">Proposez l’ouverture de sections techniques pour intervenir sur les recherches de personnes disparues, inondations et crises.</p>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1.5 rounded-2xl bg-white/10 text-xs font-bold text-amber-300">
              Trésorerie : ${game.resources.money.toLocaleString('fr-FR')} €
            </span>
          </div>
        </div>

        <!-- Grille des Spécialités -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${this.SPECIALTIES_CATALOG.map(spec => {
            const isOpened = !!game.specialtiesOpened[spec.id];
            const qualifiedIds = isOpened ? (game.specialtiesOpened[spec.id].qualifiedVolunteers || []) : [];
            const qualifiedVols = game.volunteers.filter(v => (v.skills && v.skills.includes(spec.skillKey)) || qualifiedIds.includes(v.id));

            // Bénévoles intéressés (filtrage réaliste : seuls certains profils sont motivés)
            const interestedVols = game.volunteers.filter(v => {
              if (v.skills && v.skills.includes(spec.skillKey)) return false;
              // Filtrage d'intérêt réaliste basé sur l'ID
              const hash = (v.id.charCodeAt(0) + spec.id.charCodeAt(0)) % 100;
              return hash < (spec.interestRatio * 100);
            }).slice(0, spec.maxCandidates);

            const canAffordGear = game.resources.money >= spec.gearCost;

            return `
              <div class="p-5 rounded-3xl ${isOpened ? 'glass-card border-indigo-200' : 'glass-card border-slate-200'} space-y-4 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div class="space-y-3">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2.5">
                      <div class="w-10 h-10 rounded-2xl ${isOpened ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'} flex items-center justify-center font-black">
                        <i data-lucide="${spec.icon}" class="w-5 h-5"></i>
                      </div>
                      <div>
                        <h4 class="text-xs font-black text-slate-900">${spec.name}</h4>
                        <span class="text-[10px] font-bold uppercase ${isOpened ? 'text-emerald-600' : 'text-slate-400'}">
                          ${isOpened ? `Section Ouverte (${qualifiedVols.length} qualifié${qualifiedVols.length > 1 ? 's' : ''})` : `Non Ouverte • Matériel requis : ${spec.gearCost.toLocaleString('fr-FR')} €`}
                        </span>
                      </div>
                    </div>

                    <span class="px-2.5 py-1 rounded-xl text-[10px] font-black ${isOpened ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">
                      ${isOpened ? 'Opérationnelle ✓' : 'À Ouvrir'}
                    </span>
                  </div>

                  <p class="text-xs text-slate-600 leading-normal">${spec.desc}</p>

                  <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div class="flex justify-between text-[11px]">
                      <span class="text-slate-500">Dotation Matériel :</span>
                      <strong class="text-slate-800">${spec.gearName}</strong>
                    </div>
                    <div class="flex justify-between text-[11px]">
                      <span class="text-slate-500">Difficulté Certification :</span>
                      <strong class="${spec.trainingSuccessRate < 0.6 ? 'text-rose-600' : 'text-amber-600'} font-bold">
                        ${Math.round(spec.trainingSuccessRate * 100)}% de réussite à l’examen
                      </strong>
                    </div>
                    <div class="flex justify-between text-[11px]">
                      <span class="text-slate-500">Coût du Stage :</span>
                      <strong class="text-emerald-700 font-mono">${spec.trainingCostPerPerson} € / candidat</strong>
                    </div>
                  </div>

                  <!-- Membres Qualifiés -->
                  ${isOpened ? `
                    <div class="space-y-2 pt-2 border-t border-slate-100">
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="font-extrabold text-slate-700">Secouristes Qualifiés (${qualifiedVols.length})</span>
                        <span class="text-[10px] text-slate-400 font-bold">${spec.skillLabel}</span>
                      </div>
                      <div class="flex flex-wrap gap-1.5">
                        ${qualifiedVols.length === 0 ? '<span class="text-[11px] text-slate-400 italic">Aucun bénévole encore breveté. Formez des candidats ci-dessous.</span>' : ''}
                        ${qualifiedVols.map(v => `
                          <span class="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                            <span>👤</span> ${v.name}
                          </span>
                        `).join('')}
                      </div>
                    </div>

                    <!-- Bénévoles intéressés à former -->
                    <div class="space-y-2 pt-2 border-t border-slate-100">
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="font-extrabold text-amber-900">Bénévoles intéressés (${interestedVols.length})</span>
                        <span class="text-[10px] text-slate-500">Candidatures spontanées</span>
                      </div>

                      ${interestedVols.length === 0 ? `
                        <p class="text-[10px] text-slate-400 italic">Aucun autre bénévole de l’antenne n'a manifesté d’intérêt pour cette spécialité pour l’instant.</p>
                      ` : `
                        <div class="space-y-1.5">
                          ${interestedVols.map(iv => `
                            <div class="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                              <div class="flex items-center gap-2">
                                <span>🙋</span>
                                <div>
                                  <strong class="text-slate-800 text-[11px]">${iv.name}</strong>
                                  <div class="text-[9px] text-slate-400">${iv.rank} • Exp. ${iv.experience || 30}%</div>
                                </div>
                              </div>
                              <button onclick="window.ProtecSpecialites.sendVolunteerToTraining(window.game, '${spec.id}', '${iv.id}')" class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition">
                                Envoyer en Formation (${spec.trainingCostPerPerson} €)
                              </button>
                            </div>
                          `).join('')}
                        </div>
                      `}
                    </div>
                  ` : ''}
                </div>

                <!-- Bouton Ouvrir la section si non ouverte -->
                ${!isOpened ? `
                  <button onclick="window.ProtecSpecialites.openSpecialtySection(window.game, '${spec.id}')" ${!canAffordGear ? 'disabled' : ''} class="w-full py-2.5 rounded-2xl font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 ${canAffordGear ? 'bg-gradient-to-r from-pc-blue to-indigo-600 text-white hover:brightness-110 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}">
                    <i data-lucide="plus-circle" class="w-4 h-4"></i>
                    <span>Proposer l’Ouverture (${spec.gearCost.toLocaleString('fr-FR')} €)</span>
                  </button>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};
