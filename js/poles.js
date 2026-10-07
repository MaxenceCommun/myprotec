/**
 * PROTEC LIVE - GESTION DES PÔLES OPÉRATIONNELS D'ANTENNE
 * Permet d'organiser l'antenne en 4 pôles majeurs :
 * 1. Pôle Opérationnel (Secours, DPS, SAMU, Pompiers)
 * 2. Pôle Logistique & Parc Véhicules (Maintenance, Ravitaillement, Pharmacie)
 * 3. Pôle Communication & Événementiel (Visibilité, Réseaux, Recrutement)
 * 4. Pôle Mécénat, Partenariats & Finances (Subventions, Dons, Conventions d'État)
 * 
 * Chaque pôle a un nom personnalisable, un responsable nommé et une équipe affectée.
 * L'avancement (XP et compétences) est différencié : les salariés progressent plus régulièrement
 * grâce à leur temps plein, tandis que les bénévoles progressent par engagement et passion.
 */

window.ProtecPoles = {
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
      missionLabel: 'Maintenance, Pharmacie & Bionettoyage',
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
      // Affectation initiale des bénévoles de départ si aucun pôle n'est assigné
      if (game.volunteers && game.volunteers.length > 0) {
        game.volunteers.forEach((v, idx) => {
          const poleIdx = idx % game.poles.length;
          game.poles[poleIdx].assignedVolunteerIds.push(v.id);
          v.assignedPoleId = game.poles[poleIdx].id;
        });
      }
    } else {
      // Vérification de cohérence
      this.defaultPoles.forEach(def => {
        if (!game.poles.some(p => p.id === def.id)) {
          game.poles.push(JSON.parse(JSON.stringify(def)));
        }
      });
    }
  },

  // Renommer un pôle
  renamePole(game, poleId, newName) {
    const pole = game.poles.find(p => p.id === poleId);
    if (!pole) return;
    const clean = (newName || '').trim();
    if (clean.length < 3) {
      game.showToast('Nom trop court', 'Le nom du pôle doit comporter au moins 3 caractères.', 'orange');
      return;
    }
    pole.name = clean;
    game.saveGame();
    game.showToast('Pôle Renommé', `Le pôle s'appelle désormais « ${clean} ».`, 'green');
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
    game.saveGame();
    const resp = game.volunteers.find(v => v.id === volunteerId);
    game.showToast('Responsable Nommé', `${resp ? resp.name : 'Poste vacant'} est à la tête du ${pole.name}.`, 'green');
    this.renderModal(game);
  },

  // Assigner un personnel à un pôle
  assignVolunteerToPole(game, volunteerId, targetPoleId) {
    const v = game.volunteers.find(vol => vol.id === volunteerId);
    if (!v) return;

    // Retirer des anciens pôles
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
      game.showToast('Affectation Pôle', `${v.name} a rejoint le ${targetPole.name}.`, 'blue');
    } else {
      v.assignedPoleId = null;
    }

    game.saveGame();
    this.renderModal(game);
  },

  // Rendu de l'interface du modal Pôles d'Antenne
  renderModal(game) {
    this.injectState(game);
    const body = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');

    if (!body || !title) return;

    title.textContent = 'Organisation des Pôles d’Antenne';
    subtitle.textContent = 'Structure interne, responsables désignés et répartition des personnels';
    icon.setAttribute('data-lucide', 'network');

    body.innerHTML = `
      <div class="space-y-6">
        <!-- Bannière explicative -->
        <div class="p-4 rounded-2xl glass-card space-y-1.5 border border-indigo-200">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase text-pc-blue flex items-center gap-1.5">
              <i data-lucide="layers" class="w-4 h-4"></i> Fonctionnement des Pôles
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-pc-blue/10 text-pc-blue">
              ${game.volunteers.length} effectifs répartis
            </span>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed">
            Organisez votre antenne selon 4 spécialités. Chaque pôle confère des bonus d’efficacité. Les salariés permanents progressent plus vite en compétences professionnelles (+40% XP), tandis que les bénévoles s’épanouissent par les missions terrain.
          </p>
        </div>

        <!-- Grille des 4 Pôles -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${game.poles.map(p => {
            const leader = game.volunteers.find(v => v.id === p.responsibleId);
            const members = game.volunteers.filter(v => p.assignedVolunteerIds.includes(v.id));

            return `
              <div class="p-4 rounded-2xl glass-card space-y-4 border border-white/80 shadow-sm flex flex-col justify-between">
                <div class="space-y-3">
                  <!-- Header Pôle avec Renommage -->
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-xl bg-${p.color}-100 text-${p.color}-700 flex items-center justify-center font-bold">
                        <i data-lucide="${p.icon}" class="w-4 h-4"></i>
                      </div>
                      <div>
                        <h4 class="text-xs font-black text-slate-900">${p.name}</h4>
                        <span class="text-[10px] text-slate-400 font-semibold">${p.missionLabel}</span>
                      </div>
                    </div>
                    <button onclick="const n = prompt('Renommer ce pôle :', '${p.name}'); if(n) window.ProtecPoles.renamePole(window.game, '${p.id}', n);" class="p-1.5 rounded-lg text-slate-400 hover:text-pc-blue hover:bg-slate-100 transition" title="Renommer le pôle">
                      <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>

                  <p class="text-xs text-slate-600">${p.desc}</p>
                  
                  <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-700 font-semibold flex items-center gap-1.5">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-500"></i>
                    <span>${p.bonusDesc}</span>
                  </div>

                  <!-- Responsable du Pôle -->
                  <div class="p-3 rounded-xl bg-slate-100/70 space-y-1.5">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="font-bold text-slate-500 uppercase text-[9px]">Responsable du pôle :</span>
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
                              <div class="text-[9px] text-slate-400 font-medium">${m.rank} • ${m.dispoType === 'salarié' ? '👔 Salarié permanent' : '🤝 Bénévole'}</div>
                            </div>
                          </div>
                          <span class="px-2 py-0.5 rounded text-[9px] font-black ${m.dispoType === 'salarié' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}">
                            ${m.id === p.responsibleId ? 'Chef' : (m.dispoType === 'salarié' ? '+40% XP' : 'Membre')}
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
