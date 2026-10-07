/**
 * PROTEC LIVE - SYSTÈME COMPLET DE FORMATIONS SECOURISTES & GRAND PUBLIC
 * 1. Formations Grand Public : GQS (Gestes Qui Sauvent), PSC1 (Secourisme de base), SST (Sauveteur Secouriste du Travail).
 * 2. Formations Professionnelles : PSE1, PSE2, Chef d’Équipe (CE), Chef de Dispositif (CP/CD).
 * 3. Formateurs : Les formateurs doivent posséder la compétence "formateur" (mise à jour/recyclée).
 *    Le joueur peut programmer des dates de formation et assigner des salariés formateurs ou laisser les bénévoles formateurs s'inscrire.
 * 4. Tarification & Remises : Prix fixe de base mais le joueur peut offrir une réduction ou la gratuité (ex. pour une mairie) pour faire grimper les relations et la réputation.
 * 5. Formations internes : Le joueur peut décider de financer la formation de ses bénévoles ou de la leur faire payer. Si les bénévoles payent eux-mêmes une formation coûteuse, leur moral et motivation baissent (risque de démission).
 */

window.ProtecFormations = {
  catalog: [
    // Grand Public
    {
      id: 'GQS',
      category: 'grand_public',
      title: 'GQS - Gestes Qui Sauvent (Sensibilisation)',
      desc: 'Sensibilisation de 2 heures aux arrêts cardiaques (massage cardiaque + DAE) et hémorragies.',
      durationHours: 2,
      basePricePublic: 20,
      costOrganization: 15,
      capacity: 10,
      reqTrainerRank: 'PSE1',
      unlocks: null
    },
    {
      id: 'PSC',
      category: 'grand_public',
      title: 'PSC1 - Prévention et Secours Civiques de niveau 1',
      desc: 'Formation certifiante grand public de 7 heures aux gestes d’urgence de base.',
      durationHours: 7,
      basePricePublic: 60,
      costOrganization: 40,
      capacity: 8,
      reqTrainerRank: 'PSE1',
      unlocks: null
    },
    {
      id: 'SST',
      category: 'grand_public',
      title: 'SST - Sauveteur Secouriste du Travail (Entreprises)',
      desc: 'Formation de 14 heures en milieu professionnel. Très demandée par les entreprises locales.',
      durationHours: 14,
      basePricePublic: 180,
      costOrganization: 90,
      capacity: 8,
      reqTrainerRank: 'PSE2',
      unlocks: null
    },
    // Professionnelles / Opérationnelles
    {
      id: 'PSE1',
      category: 'professionnelle',
      title: 'PSE1 - Premiers Secours en Équipe de niveau 1',
      desc: 'Formation de 35 heures pour devenir secouriste opérationnel sur les DPS.',
      durationHours: 35,
      basePricePublic: 250,
      costOrganization: 140,
      capacity: 6,
      reqTrainerRank: 'CE',
      unlocks: 'Secouriste Opérationnel'
    },
    {
      id: 'PSE2',
      category: 'professionnelle',
      title: 'PSE2 - Premiers Secours en Équipe de niveau 2',
      desc: 'Formation de 28 heures : immobilisations, brancardage, matériel VPSP et relevage complexe.',
      durationHours: 28,
      basePricePublic: 280,
      costOrganization: 160,
      capacity: 6,
      reqTrainerRank: 'CE',
      unlocks: 'Équipier Secouriste VPSP'
    },
    {
      id: 'CE',
      category: 'professionnelle',
      title: 'Chef d’Équipe (CE) - Pédagogie & Commandement',
      desc: 'Gestion d’un binôme/équipage, relation régulation SAMU/CODIS et bilans d’urgence.',
      durationHours: 21,
      basePricePublic: 350,
      costOrganization: 220,
      capacity: 4,
      reqTrainerRank: 'CD',
      unlocks: 'Chef d’Équipe VPSP'
    },
    {
      id: 'CD',
      category: 'professionnelle',
      title: 'Chef de Dispositif (CD / CP) - Grands Rassemblements',
      desc: 'Commandement de postes majeurs, coordination inter-services et cellule de crise.',
      durationHours: 24,
      basePricePublic: 450,
      costOrganization: 300,
      capacity: 4,
      reqTrainerRank: 'Cadre',
      unlocks: 'Commandement Grands Dispositifs'
    }
  ],

  // Initialisation de la liste des sessions planifiées
  injectState(game) {
    if (!game.sessionsFormation) {
      game.sessionsFormation = [];
    }
  },

  // Créer une nouvelle session de formation planifiée par le joueur
  createSession(game, courseId, discountType, isInternal, targetAudience) {
    const course = this.catalog.find(c => c.id === courseId);
    if (!course) return;

    // Calcul du tarif appliqué
    let finalPrice = course.basePricePublic;
    let relationshipBonus = 0;
    if (discountType === 'free_mairie') {
      finalPrice = 0;
      relationshipBonus = 35; // Gros boost relation mairie
    } else if (discountType === 'discount_25') {
      finalPrice = Math.round(course.basePricePublic * 0.75);
      relationshipBonus = 15;
    } else if (discountType === 'discount_50') {
      finalPrice = Math.round(course.basePricePublic * 0.50);
      relationshipBonus = 25;
    }

    // Si formation interne, est-elle payée par l'asso ou par le bénévole ?
    let volunteerPayment = false;
    if (isInternal) {
      volunteerPayment = (discountType === 'volunteer_pays');
      finalPrice = volunteerPayment ? course.costOrganization : 0;
    }

    const sessionId = `sess-${Date.now()}`;
    const newSession = {
      id: sessionId,
      courseId: course.id,
      title: course.title,
      category: course.category,
      isInternal: !!isInternal,
      targetAudience: targetAudience || 'Grand Public',
      finalPrice: finalPrice,
      costOrganization: course.costOrganization,
      discountType: discountType,
      relationshipBonus: relationshipBonus,
      volunteerPayment: volunteerPayment,
      trainerId: null,
      maxCandidates: course.capacity,
      registeredCandidates: [],
      dateDesc: `Prévue au calendrier (Durée : ${course.durationHours}h)`,
      status: 'open', // 'open', 'ongoing', 'completed'
      createdAt: Date.now()
    };

    game.sessionsFormation.unshift(newSession);
    game.saveGame();
    game.showToast('Session Programmée', `La session « ${course.id} » (${newSession.targetAudience}) est ouverte aux inscriptions.`, 'green');
    this.renderModal(game);
  },

  // Affecter un formateur (Salarié en priorité ou bénévole qualifié)
  assignTrainer(game, sessionId, trainerId) {
    const session = game.sessionsFormation.find(s => s.id === sessionId);
    if (!session) return;
    const trainer = game.volunteers.find(v => v.id === trainerId);
    if (!trainer) return;

    // Vérification de la compétence de formateur
    const isTrainer = trainer.isTrainer || (trainer.skills && trainer.skills.includes('formateur'));
    if (!isTrainer) {
      game.showToast('Non qualifié', `${trainer.name} ne possède pas encore la qualification de Formateur.`, 'orange');
      return;
    }

    session.trainerId = trainer.id;
    game.saveGame();
    game.showToast('Formateur Affecté', `${trainer.name} (${trainer.dispoType === 'salarié' ? 'Salarié' : 'Bénévole'}) animera la formation.`, 'green');
    this.renderModal(game);
  },

  // Inscrire un bénévole à une formation interne
  registerVolunteerToInternal(game, sessionId, volunteerId) {
    const session = game.sessionsFormation.find(s => s.id === sessionId);
    const vol = game.volunteers.find(v => v.id === volunteerId);
    if (!session || !vol) return;

    if (session.registeredCandidates.includes(volunteerId)) return;
    if (session.registeredCandidates.length >= session.maxCandidates) {
      game.showToast('Session Complète', 'La jauge maximale de stagiaires est atteinte.', 'orange');
      return;
    }

    // Conséquence psychologique si le bénévole doit payer lui-même
    if (session.volunteerPayment) {
      vol.motivation = Math.max(15, (vol.motivation || 80) - 25);
      vol.humeur = Math.max(15, (vol.humeur || 80) - 20);
      game.showToast('Baisse de Moral', `${vol.name} a dû financer lui-même sa formation (${session.finalPrice} €). Sa motivation a baissé !`, 'orange');
    } else {
      vol.motivation = Math.min(100, (vol.motivation || 80) + 10);
      game.showToast('Bénévole Inscrit', `L'antenne prend en charge la formation de ${vol.name} ! Moral boosté.`, 'green');
    }

    session.registeredCandidates.push(volunteerId);
    game.saveGame();
    this.renderModal(game);
  },

  // Clôturer et valider la session de formation
  completeSession(game, sessionId) {
    const session = game.sessionsFormation.find(s => s.id === sessionId);
    if (!session) return;

    if (!session.trainerId) {
      game.showToast('Formateur Manquant', 'Vous devez assigner un formateur qualifié avant de valider la formation.', 'orange');
      return;
    }

    const course = this.catalog.find(c => c.id === session.courseId);
    const count = session.registeredCandidates.length || Math.min(session.maxCandidates, 6);

    // Calcul des gains financiers et relationnels
    let totalRevenue = 0;
    let totalCost = (session.costOrganization || 30) * count;

    if (session.isInternal) {
      if (!session.volunteerPayment) {
        // L'association paye les frais pédagogiques
        if (game.resources.money < totalCost) {
          game.showToast('Fonds insuffisants', `Il vous faut ${totalCost} € pour régler les frais pédagogiques.`, 'orange');
          return;
        }
        game.resources.money -= totalCost;
      }
      // Promotion des bénévoles inscrits
      session.registeredCandidates.forEach(vid => {
        const v = game.volunteers.find(vol => vol.id === vid);
        if (v) {
          v.exp = (v.exp || 0) + 40;
          if (course.unlocks) {
            v.rank = course.id;
            v.role = course.unlocks;
          }
          if (course.id === 'CE' && !v.skills.includes('formateur')) {
            v.skills.push('formateur');
            v.isTrainer = true;
          }
        }
      });
    } else {
      // Formation grand public : encaissement des recettes
      totalRevenue = session.finalPrice * count;
      game.resources.money += (totalRevenue - totalCost);
      game.resources.reputationScore += (25 + (session.relationshipBonus || 0));
    }

    session.status = 'completed';
    game.saveGame();
    game.updateStatsUI();

    const bilanMsg = session.isInternal 
      ? `Formation interne validée : ${session.registeredCandidates.length} bénévole(s) certifié(s) ${session.courseId} !`
      : `Session validée : +${totalRevenue} € encaissés (+${session.relationshipBonus || 15} relation mairie) !`;

    game.showToast('Formation Validée !', bilanMsg, 'green');
    this.renderModal(game);
  },

  // Interface utilisateur modale
  renderModal(game) {
    this.injectState(game);
    const body = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');

    if (!body || !title) return;

    title.textContent = 'Centre de Formation & Pédagogie de Sécurité Civile';
    subtitle.textContent = 'Sessions grand public (PSC1/SST) et cursus pro interne (PSE1, PSE2, CE, CD)';
    icon.setAttribute('data-lucide', 'graduation-cap');

    const trainers = game.volunteers.filter(v => v.isTrainer || (v.skills && v.skills.includes('formateur')));

    body.innerHTML = `
      <div class="space-y-6">
        <!-- Bannière Pédagogique -->
        <div class="p-4 rounded-2xl glass-card space-y-2 border border-emerald-200">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase text-emerald-800 flex items-center gap-1.5">
              <i data-lucide="award" class="w-4 h-4 text-emerald-600"></i> Pôle Formateurs Agréés
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              ${trainers.length} formateur(s) opérationnel(s)
            </span>
          </div>
          <p class="text-xs text-slate-600">
            Les formations renforcent votre trésorerie et la réputation auprès des mairies. Les formateurs salariés ou bénévoles doivent être à jour. Vous pouvez offrir des remises aux partenaires pour bonifier vos relations.
          </p>
        </div>

        <!-- Programmateur de nouvelle session -->
        <div class="p-4 rounded-2xl glass-card space-y-3 border border-slate-200">
          <h4 class="text-xs font-black uppercase text-slate-800">Ouvrir une nouvelle session au calendrier</h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label class="text-[10px] font-bold uppercase text-slate-400">Cursus :</label>
              <select id="new-course-id" class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-bold text-slate-800">
                <optgroup label="Grand Public">
                  <option value="GQS">GQS (2h - Sensibilisation)</option>
                  <option value="PSC" selected>PSC1 (7h - Certifiant)</option>
                  <option value="SST">SST (14h - Entreprises)</option>
                </optgroup>
                <optgroup label="Professionnel / Interne">
                  <option value="PSE1">PSE1 (35h - Secouriste)</option>
                  <option value="PSE2">PSE2 (28h - Équipier VPSP)</option>
                  <option value="CE">Chef d’Équipe (21h)</option>
                  <option value="CD">Chef de Dispositif (24h)</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold uppercase text-slate-400">Public & Tarification :</label>
              <select id="new-course-tariff" class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-semibold text-slate-800">
                <option value="standard">Tarif Standard Normal</option>
                <option value="discount_25">Remise Partenaire (-25%)</option>
                <option value="discount_50">Remise Mairie (-50%)</option>
                <option value="free_mairie">Gratuité Mairie (+35 Relation)</option>
                <option value="internal_free">Interne (Prise en charge Asso)</option>
                <option value="volunteer_pays">Interne (Bénévole paye lui-même)</option>
              </select>
            </div>
            <div class="flex items-end">
              <button onclick="
                const cId = document.getElementById('new-course-id').value;
                const tTar = document.getElementById('new-course-tariff').value;
                const isInt = (tTar === 'internal_free' || tTar === 'volunteer_pays');
                window.ProtecFormations.createSession(window.game, cId, tTar, isInt, isInt ? 'Interne Antenne' : 'Mairie & Citoyens');
              " class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                Programmer la Session
              </button>
            </div>
          </div>
        </div>

        <!-- Sessions en cours & Planifiées -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black uppercase text-slate-800">Sessions Planifiées (${game.sessionsFormation.filter(s => s.status !== 'completed').length})</h4>
            <span class="text-[10px] text-slate-400">Gestion des formateurs et des inscrits</span>
          </div>

          ${game.sessionsFormation.filter(s => s.status !== 'completed').length === 0 ? `
            <div class="p-6 rounded-2xl glass-card text-center text-xs text-slate-500">
              Aucune session de formation n'est actuellement ouverte. Programmez une session ci-dessus.
            </div>
          ` : ''}

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${game.sessionsFormation.filter(s => s.status !== 'completed').map(sess => {
              const assignedTrainer = game.volunteers.find(v => v.id === sess.trainerId);
              const isInternal = sess.isInternal;

              return `
                <div class="p-4 rounded-2xl glass-card border border-white/80 shadow-sm space-y-3 flex flex-col justify-between">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${isInternal ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}">
                        ${isInternal ? 'Session Interne' : 'Grand Public'}
                      </span>
                      <span class="text-xs font-bold font-mono text-slate-700">
                        ${sess.finalPrice === 0 ? '<span class=\"text-emerald-600 font-black\">GRATUIT (Offert)</span>' : `${sess.finalPrice} € / pers.`}
                      </span>
                    </div>

                    <h5 class="text-xs font-black text-slate-900">${sess.title}</h5>
                    <p class="text-[11px] text-slate-500">${sess.targetAudience} • Jauge : <strong>${sess.registeredCandidates.length} / ${sess.maxCandidates}</strong> stagiaires</p>

                    <!-- Formateur affecté -->
                    <div class="p-2.5 rounded-xl bg-slate-50 space-y-1">
                      <span class="text-[9px] font-bold uppercase text-slate-400">Formateur responsable :</span>
                      <div class="flex items-center justify-between text-xs">
                        <span class="font-black text-slate-800">${assignedTrainer ? `${assignedTrainer.name} (${assignedTrainer.dispoType === 'salarié' ? 'Salarié' : 'Bénévole'})` : '<span class=\"text-amber-600 font-bold\">Aucun formateur</span>'}</span>
                      </div>
                      <select onchange="window.ProtecFormations.assignTrainer(window.game, '${sess.id}', this.value)" class="w-full text-[11px] p-1 rounded-lg border border-slate-200 glass-input font-medium mt-1">
                        <option value="">Sélectionner un formateur qualifié...</option>
                        ${trainers.map(t => `
                          <option value="${t.id}" ${sess.trainerId === t.id ? 'selected' : ''}>
                            ${t.name} (${t.role || t.rank} • ${t.dispoType === 'salarié' ? 'Salarié' : 'Bénévole'})
                          </option>
                        `).join('')}
                      </select>
                    </div>

                    ${isInternal ? `
                      <!-- Inscription des bénévoles internes -->
                      <div class="pt-2 border-t border-slate-100">
                        <span class="text-[9px] font-bold uppercase text-slate-400 block mb-1">Inscrire un bénévole de l'antenne :</span>
                        <select onchange="if(this.value) window.ProtecFormations.registerVolunteerToInternal(window.game, '${sess.id}', this.value); this.value='';" class="w-full text-xs p-1.5 rounded-lg border border-slate-200 glass-input font-bold text-pc-blue">
                          <option value="">+ Inscrire un candidat bénévole...</option>
                          ${game.volunteers.filter(v => !sess.registeredCandidates.includes(v.id)).map(v => `
                            <option value="${v.id}">${v.name} (${v.rank} • Moral : ${v.motivation || 80}%)</option>
                          `).join('')}
                        </select>
                      </div>
                    ` : ''}
                  </div>

                  <!-- Bouton de validation -->
                  <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span class="text-[10px] text-slate-400">${sess.relationshipBonus ? `+${sess.relationshipBonus} Relation mairie` : 'Attribution des attestations'}</span>
                    <button onclick="window.ProtecFormations.completeSession(window.game, '${sess.id}')" class="px-3.5 py-2 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white text-xs font-black shadow transition flex items-center gap-1 cursor-pointer">
                      <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                      Valider & Certifier
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};
