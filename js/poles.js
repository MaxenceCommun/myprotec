/**
 * PROTEC LIVE - GESTION DES PÔLES OPÉRATIONNELS D'ANTENNE
 * Permet d'organiser l'antenne en pôles majeurs :
 * 1. Pôle Opérationnel (Secours, DPS, SAMU, Pompiers)
 * 2. Pôle Logistique & Parc Véhicules (Maintenance, Ravitaillement, Pharmacie)
 * 3. Pôle Communication & Événementiel (Visibilité, Réseaux, Recrutement)
 * 4. Pôle Mécénat, Partenariats & Finances (Subventions, Dons, Conventions d'État)
 * 
 * MODIFICATIONS LIBRES À TOUT MOMENT :
 * - Titre du pôle, intitulé des missions, description, bonus d'efficacité, icône et couleur
 * - Création de nouveaux pôles personnalisés à la demande
 * - Nomination de responsable et assignation de bénévoles / salariés
 */

window.ProtecPoles = {
  editingPoleId: null,

  defaultPoles: [
    {
      id: 'operationnel',
      type: 'operationnel',
      name: 'Pôle Opérationnel & Secours',
      icon: 'shield-alert',
      color: 'blue',
      desc: 'Gestion des dispositifs de secours (DPS), des gardes SAMU 15 et des renforts pompiers SDIS.',
      missionLabel: 'Interventions & Gestion des Dispositifs',
      responsibleId: null,
      assignedVolunteerIds: [],
      xpMultiplierBenevole: 1.0,
      xpMultiplierSalarie: 1.4,
      bonusDesc: '+10% Réussite des bilans et réactivité des équipages'
    },
    {
      id: 'logistique',
      type: 'logistique',
      name: 'Pôle Matériel & Parc Roulant',
      icon: 'package-check',
      color: 'teal',
      desc: 'Entretien de la flotte VPSP/VTU/VL, gestion des stocks d’Oxygène, électrodes DAE et désinfections.',
      missionLabel: 'Maintenance, Pharmacie & Réarmement Flotte',
      responsibleId: null,
      assignedVolunteerIds: [],
      xpMultiplierBenevole: 1.0,
      xpMultiplierSalarie: 1.3,
      bonusDesc: '-20% d’usure mécanique et réduction des coûts de carburant'
    },
    {
      id: 'communication',
      type: 'communication',
      name: 'Pôle Communication & Recrutement',
      icon: 'megaphone',
      color: 'indigo',
      desc: 'Relations publiques, réseaux sociaux, affichage mairie et intégration des nouveaux candidats.',
      missionLabel: 'Promotion, Recrutement & Notoriété',
      responsibleId: null,
      assignedVolunteerIds: [],
      xpMultiplierBenevole: 1.0,
      xpMultiplierSalarie: 1.5,
      bonusDesc: '+25% de candidatures qualifiées et hausse de réputation'
    },
    {
      id: 'mecenat',
      type: 'mecenat',
      name: 'Pôle Mécénat & Action Solidaire',
      icon: 'heart-handshake',
      color: 'amber',
      desc: 'Recherche de donateurs, conventions d’aides d’État, collecte de denrées et distributions alimentaires.',
      missionLabel: 'Collectes de Dons, Mécénat & Aides d’État',
      responsibleId: null,
      assignedVolunteerIds: [],
      xpMultiplierBenevole: 1.1,
      xpMultiplierSalarie: 1.4,
      bonusDesc: '+15% de générosité publique et subventions bonifiées'
    }
  ],

  // Initialisation de l'état des pôles
  injectState(game) {
    if (!game.poles || !Array.isArray(game.poles) || game.poles.length === 0) {
      game.poles = JSON.parse(JSON.stringify(this.defaultPoles));
      if (game.volunteers && game.volunteers.length > 0) {
        game.volunteers.forEach((v, idx) => {
          const poleIdx = idx % game.poles.length;
          game.poles[poleIdx].assignedVolunteerIds.push(v.id);
          v.assignedPoleId = game.poles[poleIdx].id;
        });
      }
    } else {
      this.defaultPoles.forEach(def => {
        if (!game.poles.some(p => p.id === def.id)) {
          game.poles.push(JSON.parse(JSON.stringify(def)));
        }
      });
    }
  },

  // Ouvrir l'éditeur de pôle (Modification du titre, missions, description, etc.)
  openEditModal(game, poleId) {
    this.editingPoleId = poleId;
    this.renderModal(game);
  },

  // Fermer l'éditeur de pôle
  closeEditModal(game) {
    this.editingPoleId = null;
    this.renderModal(game);
  },

  // Sauvegarder les modifications du pôle
  savePoleEdits(game, poleId) {
    const pole = game.poles.find(p => p.id === poleId);
    if (!pole) return;

    const nameInput = document.getElementById('edit-pole-name');
    const missionInput = document.getElementById('edit-pole-mission');
    const descInput = document.getElementById('edit-pole-desc');
    const bonusInput = document.getElementById('edit-pole-bonus');
    const colorInput = document.getElementById('edit-pole-color');

    if (nameInput && nameInput.value.trim().length >= 2) {
      pole.name = nameInput.value.trim();
    }
    if (missionInput && missionInput.value.trim()) {
      pole.missionLabel = missionInput.value.trim();
    }
    if (descInput && descInput.value.trim()) {
      pole.desc = descInput.value.trim();
    }
    if (bonusInput && bonusInput.value.trim()) {
      pole.bonusDesc = bonusInput.value.trim();
    }
    if (colorInput) {
      pole.color = colorInput.value;
    }

    if (window.ProtecAudio) window.ProtecAudio.playClickSound();

    game.saveGame();
    game.showToast('Pôle Modifié', `Les modifications du « ${pole.name} » ont été enregistrées avec succès.`, 'green');
    this.editingPoleId = null;
    this.renderModal(game);
  },

  // Ajouter un nouveau pôle personnalisé
  addNewCustomPole(game) {
    const id = `pole_custom_${Date.now()}`;
    const newPole = {
      id: id,
      type: 'custom',
      name: 'Nouveau Pôle Opérationnel',
      icon: 'sparkles',
      color: 'purple',
      desc: 'Définissez la mission et les objectifs spécifiques de cette section de l’antenne.',
      missionLabel: 'Missions Personnalisées',
      responsibleId: null,
      assignedVolunteerIds: [],
      xpMultiplierBenevole: 1.1,
      xpMultiplierSalarie: 1.4,
      bonusDesc: '+10% d’efficacité sur les missions associées'
    };
    game.poles.push(newPole);
    game.saveGame();
    game.showToast('Nouveau Pôle Créé', 'Personnalisez son titre, ses missions et affectez ses membres.', 'green');
    this.editingPoleId = id;
    this.renderModal(game);
  },

  // Nommer le responsable d'un pôle
  setPoleLeader(game, poleId, volunteerId) {
    const pole = game.poles.find(p => p.id === poleId);
    if (!pole) return;
    pole.responsibleId = volunteerId || null;
    if (volunteerId && !pole.assignedVolunteerIds.includes(volunteerId)) {
      pole.assignedVolunteerIds.push(volunteerId);
      const v = game.volunteers.find(vol => vol.id === volunteerId);
      if (v) v.assignedPoleId = pole.id;
    }
    if (window.ProtecAudio) window.ProtecAudio.playRadioBeep();
    game.saveGame();
    const resp = game.volunteers.find(v => v.id === volunteerId);
    game.showToast('Responsable Nommé', `${resp ? resp.name : 'Poste vacant'} est à la tête du ${pole.name}.`, 'green');
    this.renderModal(game);
  },

  // Assigner un personnel à un pôle
  assignVolunteerToPole(game, volunteerId, targetPoleId) {
    const v = game.volunteers.find(vol => vol.id === volunteerId);
    if (!v) return;

    game.poles.forEach(p => {
      p.assignedVolunteerIds = p.assignedVolunteerIds.filter(id => id !== volunteerId);
      if (p.responsibleId === volunteerId && p.id !== targetPoleId) {
        p.responsibleId = null;
      }
    });

    const targetPole = game.poles.find(p => p.id === targetPoleId);
    if (targetPole) {
      if (!targetPole.assignedVolunteerIds.includes(volunteerId)) {
        targetPole.assignedVolunteerIds.push(volunteerId);
      }
      v.assignedPoleId = targetPole.id;
      if (window.ProtecAudio) window.ProtecAudio.playClickSound();
      game.showToast('Affectation Pôle', `${v.name} a rejoint le ${targetPole.name}.`, 'blue');
    } else {
      v.assignedPoleId = null;
    }

    game.saveGame();
    this.renderModal(game);
  },

  // Rendu de l'interface
  renderModal(game) {
    this.injectState(game);
    const body = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');

    if (!body || !title) return;

    title.textContent = 'Organisation des Pôles d’Antenne';
    subtitle.textContent = 'Personnalisation libre des missions, titres de pôles, responsables et effectifs';
    icon.setAttribute('data-lucide', 'network');

    const editingPole = this.editingPoleId ? game.poles.find(p => p.id === this.editingPoleId) : null;

    body.innerHTML = `
      <div class="space-y-6">
        
        <!-- MODAL D'ÉDITION DU PÔLE (Si activé) -->
        ${editingPole ? `
          <div class="p-5 rounded-3xl bg-slate-900 text-white shadow-2xl border-2 border-indigo-400 space-y-4 animate-in fade-in">
            <div class="flex items-center justify-between border-b border-slate-700 pb-3">
              <div class="flex items-center gap-2.5">
                <span class="text-xl">✏️</span>
                <h4 class="text-sm font-black text-amber-300">Modifier le Pôle : ${editingPole.name}</h4>
              </div>
              <button onclick="window.ProtecPoles.closeEditModal(window.game)" class="text-xs text-slate-400 hover:text-white transition">✕ Annuler</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="space-y-1">
                <label class="font-bold text-slate-300">Titre du Pôle :</label>
                <input id="edit-pole-name" type="text" value="${editingPole.name}" class="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs focus:border-amber-400 outline-none" />
              </div>

              <div class="space-y-1">
                <label class="font-bold text-slate-300">Missions attribuées (Sous-titre) :</label>
                <input id="edit-pole-mission" type="text" value="${editingPole.missionLabel || ''}" class="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-amber-400 outline-none" />
              </div>

              <div class="space-y-1 sm:col-span-2">
                <label class="font-bold text-slate-300">Description du Rôle Opérationnel :</label>
                <textarea id="edit-pole-desc" rows="2" class="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-amber-400 outline-none">${editingPole.desc || ''}</textarea>
              </div>

              <div class="space-y-1 sm:col-span-2">
                <label class="font-bold text-slate-300">Bonus & Impact Opérationnel :</label>
                <input id="edit-pole-bonus" type="text" value="${editingPole.bonusDesc || ''}" class="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-amber-400 outline-none" />
              </div>

              <div class="space-y-1">
                <label class="font-bold text-slate-300">Thème Couleur :</label>
                <select id="edit-pole-color" class="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none">
                  <option value="blue" ${editingPole.color === 'blue' ? 'selected' : ''}>Bleu Protection Civile</option>
                  <option value="teal" ${editingPole.color === 'teal' ? 'selected' : ''}>Sarcelle Logistique</option>
                  <option value="indigo" ${editingPole.color === 'indigo' ? 'selected' : ''}>Indigo Communication</option>
                  <option value="amber" ${editingPole.color === 'amber' ? 'selected' : ''}>Ambre Mécénat / Social</option>
                  <option value="purple" ${editingPole.color === 'purple' ? 'selected' : ''}>Violet Spécialités</option>
                  <option value="emerald" ${editingPole.color === 'emerald' ? 'selected' : ''}>Émeraude Formation</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button onclick="window.ProtecPoles.closeEditModal(window.game)" class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition">Annuler</button>
              <button onclick="window.ProtecPoles.savePoleEdits(window.game, '${editingPole.id}')" class="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:brightness-110 transition flex items-center gap-1.5">
                <i data-lucide="check" class="w-4 h-4"></i>
                Enregistrer les Modifications
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Bannière explicative & bouton création de pôle -->
        <div class="p-4 rounded-2xl glass-card space-y-2 border border-indigo-200">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span class="text-xs font-black uppercase text-pc-blue flex items-center gap-1.5">
              <i data-lucide="layers" class="w-4 h-4"></i> Fonctionnement des Pôles
            </span>
            <div class="flex items-center gap-2">
              <button onclick="window.ProtecPoles.addNewCustomPole(window.game)" class="px-3 py-1 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition flex items-center gap-1">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                + Créer un Pôle
              </button>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-pc-blue/10 text-pc-blue">
                ${game.volunteers.length} effectifs
              </span>
            </div>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed">
            Vous pouvez <strong>modifier à tout moment</strong> le titre, les missions et les bonus de chaque pôle via le bouton « Modifier ». Les salariés permanents bénéficient d'un boost de formation, tandis que les bénévoles s’épanouissent selon leurs affinités.
          </p>
        </div>

        <!-- Grille des Pôles -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${game.poles.map(p => {
            const leader = game.volunteers.find(v => v.id === p.responsibleId);
            const members = game.volunteers.filter(v => p.assignedVolunteerIds.includes(v.id));

            return `
              <div class="p-4 rounded-2xl glass-card space-y-4 border border-white/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div class="space-y-3">
                  <!-- Header Pôle avec Bouton Modifier Complet -->
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <div class="w-9 h-9 rounded-xl bg-${p.color || 'blue'}-100 text-${p.color || 'blue'}-700 flex items-center justify-center font-bold">
                        <i data-lucide="${p.icon || 'shield'}" class="w-4 h-4"></i>
                      </div>
                      <div>
                        <h4 class="text-xs font-black text-slate-900">${p.name}</h4>
                        <span class="text-[10px] text-slate-400 font-semibold">${p.missionLabel || 'Missions'}</span>
                      </div>
                    </div>
                    
                    <button onclick="window.ProtecPoles.openEditModal(window.game, '${p.id}')" class="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition flex items-center gap-1 border border-indigo-200" title="Modifier le titre, les missions et descriptions">
                      <i data-lucide="pencil" class="w-3 h-3"></i>
                      <span>Modifier</span>
                    </button>
                  </div>

                  <p class="text-xs text-slate-600 leading-normal">${p.desc || ''}</p>
                  
                  <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-700 font-semibold flex items-center gap-1.5">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-500 flex-shrink-0"></i>
                    <span>${p.bonusDesc || 'Bonus opérationnel actif'}</span>
                  </div>

                  <!-- Responsable du Pôle -->
                  <div class="p-3 rounded-xl bg-slate-100/70 space-y-1.5">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="font-bold text-slate-500 uppercase text-[9px]">Responsable désigné :</span>
                      <span class="font-black text-slate-800">${leader ? leader.name : 'Poste Vacant'}</span>
                    </div>
                    <select onchange="window.ProtecPoles.setPoleLeader(window.game, '${p.id}', this.value)" class="w-full text-xs p-1.5 rounded-lg border border-slate-200 glass-input font-medium">
                      <option value="">Nommer un responsable...</option>
                      ${game.volunteers.map(v => `
                        <option value="${v.id}" ${p.responsibleId === v.id ? 'selected' : ''}>
                          ${v.name} (${v.role || v.rank} • ${v.dispoType === 'salarié' ? 'Salarié' : 'Bénévole'})
                        </option>
                      `).join('')}
                    </select>
                  </div>

                  <!-- Effectifs affectés -->
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="font-extrabold text-slate-700">Membres affectés (${members.length})</span>
                      <span class="text-[10px] text-slate-400">Salariés & Bénévoles</span>
                    </div>
                    <div class="max-h-28 overflow-y-auto space-y-1 pr-1">
                      ${members.length === 0 ? '<p class="text-[11px] text-slate-400 italic">Aucun secouriste assigné à ce pôle.</p>' : ''}
                      ${members.map(m => `
                        <div class="p-2 rounded-xl glass-card flex items-center justify-between text-xs">
                          <div class="flex items-center gap-2">
                            <span>${m.avatar || '🙋'}</span>
                            <div>
                              <div class="font-bold text-slate-800">${m.name}</div>
                              <div class="text-[9px] text-slate-400 font-medium">${m.rank} • ${m.dispoType === 'salarié' ? '👔 Salarié' : '🤝 Bénévole'}</div>
                            </div>
                          </div>
                          <span class="px-2 py-0.5 rounded text-[9px] font-black ${m.dispoType === 'salarié' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}">
                            ${m.id === p.responsibleId ? 'Responsable' : (m.dispoType === 'salarié' ? '+40% XP' : 'Membre')}
                          </span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>

                <!-- Assigner un membre -->
                <div class="pt-3 border-t border-slate-100">
                  <select onchange="if(this.value) window.ProtecPoles.assignVolunteerToPole(window.game, this.value, '${p.id}'); this.value='';" class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-bold text-pc-blue">
                    <option value="">+ Affecter un bénévole / salarié à ce pôle...</option>
                    ${game.volunteers.filter(v => !p.assignedVolunteerIds.includes(v.id)).map(v => `
                      <option value="${v.id}">${v.name} (${v.rank} • ${v.dispoType === 'salarié' ? 'Salarié' : 'Bénévole'})</option>
                    `).join('')}
                  </select>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};
