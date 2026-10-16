/**
 * Module Officiel de Composition & Mobilisation SMS - Protection Civile
 * Gère la rédaction personnalisée, les consignes d'autonomie et l'évolution de situation.
 */

window.ProtecSmsMobilization = {
  // Consignes opérationnelles disponibles
  CONSIGNES: {
    base_immediat: {
      id: 'base_immediat',
      label: '⚡ Ralliement IMMÉDIAT à la base',
      shortLabel: 'Départ immédiat vers la base',
      badgeClass: 'bg-red-600 text-white animate-pulse',
      icon: 'zap',
      smsText: 'RALLIEMENT IMMÉDIAT À LA BASE D\'ANTENNE. Convergence sous gyrophares à l\'arrivée.',
      volunteerReply: 'Bien reçu ! Je quitte mon domicile immédiatement vers la base.'
    },
    base_horaire: {
      id: 'base_horaire',
      label: '⏱️ Rendez-vous à la base à heure précise',
      shortLabel: 'RDV base à heure fixe',
      badgeClass: 'bg-indigo-600 text-white',
      icon: 'clock',
      smsText: 'Rendez-vous fixé à la base d\'antenne pour armement et briefing.',
      volunteerReply: 'Dispo confirmée ! Je serai à la base à l\'heure du RDV convenu.'
    },
    attente_domicile: {
      id: 'attente_domicile',
      label: '🏠 Attendre à domicile en alerte (Dispo domicile)',
      shortLabel: 'En veille à domicile',
      badgeClass: 'bg-blue-600 text-white',
      icon: 'home',
      smsText: 'Attendre à domicile en alerte réflexe. Gardez votre téléphone à portée, ne venez pas à la base.',
      volunteerReply: 'Présent(e) ! Je reste chez moi en veille active, téléphone sous la main.'
    },
    attente_appel: {
      id: 'attente_appel',
      label: '📞 Attendre l\'appel direct de l\'astreinte',
      shortLabel: 'Attente appel astreinte',
      badgeClass: 'bg-amber-600 text-white',
      icon: 'phone-call',
      smsText: 'Indiquez votre disponibilité mais attendez l\'appel direct du chef de détachement.',
      volunteerReply: 'Disponible ! J\'attends l\'appel de l\'astreinte si mon profil est retenu.'
    },
    attente_consignes: {
      id: 'attente_consignes',
      label: '⏳ Attendre consignes complémentaires (Évolution)',
      shortLabel: 'Attente consignes',
      badgeClass: 'bg-slate-700 text-white',
      icon: 'help-circle',
      smsText: 'Situation évolutive. Merci d\'indiquer votre créneau, consignes définitives à suivre.',
      volunteerReply: 'Bien reçu. En veille à l\'écoute des prochaines consignes opérationnelles.'
    }
  },

  // Profils / Compétences ciblées
  SKILL_PROFILES: {
    tous: { id: 'tous', label: 'Tous profils bienvenus (PSE1, PSE2, Stagiaires)' },
    chauffeur: { id: 'chauffeur', label: 'Conducteurs VPSP indispensables (Permis VPSP)' },
    ce: { id: 'ce', label: 'Chefs d\'équipe / Chefs de poste (CE / CP)' },
    pse2: { id: 'pse2', label: 'Secouristes PSE2 qualifiés' },
    cadre: { id: 'cadre', label: 'Cadres & Commandement (Officiers / Logistique)' }
  },

  // Calcule les valeurs par défaut recommandées selon la mission
  getDefaults(mission, game) {
    if (!mission) return {};
    const isCrisis = Boolean(
      mission.type === 'crise' ||
      mission.status === 'declenche' ||
      mission.isCrisis ||
      mission.isEmergencyPlan ||
      mission.category === 'crise'
    );
    const isPrealert = mission.status === 'prealerte';
    const isUrgent = ['samu', 'pompiers', 'urgence'].includes(mission.type) || mission.urgency === 'critique';
    const isMaraude = mission.type === 'social' || mission.category === 'social';

    let whatHappened = mission.title || 'Dispositif Opérationnel de Secours';
    if (mission.weatherAlertData?.phenomenon) {
      whatHappened = `Vigilance Météo ${mission.weatherAlertData.phenomenon} - Risques majeurs sur le département`;
    } else if (isCrisis) {
      whatHappened = `Sinistre majeur : ${mission.title}`;
    } else if (isUrgent) {
      whatHappened = `Déclenchement d'urgence SAMU 15 / SDIS : ${mission.title}`;
    }

    let pcMissions = 'Secours à personnes, bilans et prise en charge des victimes.';
    if (isCrisis) {
      pcMissions = 'Armement Poste Médical Avancé (PMA), évacuations et soutien des populations sinistrées.';
    } else if (isMaraude) {
      pcMissions = 'Tournée de maraude sociale, écoute active, distribution de couvertures et orientation 115.';
    } else if (isPrealert) {
      pcMissions = 'Pré-positionnement des agrès, reconnaissance et veille opérationnelle renforcée.';
    }

    let defaultConsigne = 'attente_domicile';
    if (isCrisis || (isUrgent && !isPrealert)) {
      defaultConsigne = 'base_immediat';
    } else if (isPrealert) {
      defaultConsigne = 'attente_domicile';
    } else {
      defaultConsigne = 'base_horaire';
    }

    // Heure de RDV suggérée
    let suggestedRdvTime = '18h30';
    if (mission.eventDate) {
      const h = mission.eventDate.hour !== undefined ? mission.eventDate.hour : 14;
      const m = mission.eventDate.minute !== undefined ? mission.eventDate.minute : 0;
      const dt = new Date(2026, 9, 1, h, m);
      dt.setMinutes(dt.getMinutes() - 30);
      suggestedRdvTime = `${String(dt.getHours()).padStart(2, '0')}h${String(dt.getMinutes()).padStart(2, '0')}`;
    }

    const regCount = (mission.registeredVolunteers || []).length;
    const reqCount = mission.requiredVolunteers || 4;
    const neededCount = Math.max(1, reqCount - regCount);

    return {
      whatHappened,
      pcMissions,
      consigne: defaultConsigne,
      rdvTime: suggestedRdvTime,
      requiredSkill: (isCrisis || isUrgent) ? 'chauffeur' : 'tous',
      targetCount: neededCount
    };
  },

  // Génère le texte brut du SMS à partir de la configuration
  generateSmsBody(config) {
    const consigneObj = this.CONSIGNES[config.consigne] || this.CONSIGNES.attente_domicile;
    const skillLabel = this.SKILL_PROFILES[config.requiredSkill]?.label || 'Tous profils';

    let consigneDetail = consigneObj.smsText;
    if (config.consigne === 'base_horaire' && config.rdvTime) {
      consigneDetail = `Rendez-vous à la base d'antenne fixé à ${config.rdvTime} pour armement et briefing.`;
    }

    return `[PROTECTION CIVILE - ALERTE MISSION]\n` +
      `📍 SITUATION : ${config.whatHappened}\n` +
      `🛡️ MISSION PC : ${config.pcMissions}\n` +
      `👥 BESOIN : ${config.targetCount} secouriste(s) [Profil : ${skillLabel}]\n` +
      `⚠️ CONSIGNES : ${consigneDetail}\n` +
      `\nRépondez "1" (DISPO) ou "2" (INDISPO).`;
  },

  // Ouvre la modale complète de composition SMS
  openSmsModal(game, missionId, isUpdate = false) {
    const mission = game.missions.find(m => m.id === missionId);
    if (!mission) return;

    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    const defaults = this.getDefaults(mission, game);
    const existing = mission.smsConsigne || {};
    const config = {
      whatHappened: existing.whatHappened || defaults.whatHappened,
      pcMissions: existing.pcMissions || defaults.pcMissions,
      consigne: isUpdate ? (existing.consigne === 'attente_domicile' ? 'base_immediat' : existing.consigne) : (existing.consigne || defaults.consigne),
      rdvTime: existing.rdvTime || defaults.rdvTime,
      requiredSkill: existing.requiredSkill || defaults.requiredSkill,
      targetCount: defaults.targetCount
    };

    const registeredCount = (mission.registeredVolunteers || []).length;
    const availableVols = game.volunteers.filter(v => 
      !mission.registeredVolunteers.includes(v.id) &&
      v.status !== 'mission' &&
      !v.isBurnout
    );

    title.textContent = isUpdate ? '📱 Évolution de Situation - Mise à Jour des Consignes' : '📱 Composition & Diffusion SMS d\'Alerte';
    subtitle.textContent = isUpdate 
      ? `Transmettez les nouveaux ordres aux ${registeredCount} secouriste(s) déjà mobilisé(s) et/ou recrutez des renforts` 
      : `Définissez les consignes opérationnelles transmises aux ${availableVols.length} secouriste(s) disponible(s)`;
    if (icon) icon.setAttribute('data-lucide', 'send');

    body.innerHTML = `
      <div class="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
        
        <!-- BANDEAU D'AIDE ET D'EXPLICATION SUR L'AUTONOMIE -->
        <div class="p-3 rounded-2xl bg-gradient-to-r from-pc-blue/10 via-indigo-50 to-amber-50 dark:from-pc-blue/20 dark:via-slate-800 dark:to-slate-800 border border-pc-blue/20 text-slate-800 dark:text-slate-200 text-xs space-y-1">
          <div class="flex items-center gap-2 font-black text-pc-blue dark:text-indigo-400">
            <i data-lucide="info" class="w-4 h-4"></i>
            <span>Pilotage Autonome des Consignes</span>
          </div>
          <p class="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            Ce message structure les consignes données aux bénévoles. Selon votre choix, ils convergeront automatiquement vers la base, attendront à domicile ou se tiendront prêts pour un horaire fixe, <strong>sans que vous ayez à intervenir manuellement sur chacun</strong>.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <!-- FORMULAIRE DE COMPOSITION (7 colonnes) -->
          <div class="lg:col-span-7 space-y-3.5">
            
            <!-- 1. QUE SE PASSE-T-IL ? -->
            <div class="space-y-1.5">
              <label class="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span class="w-4 h-4 rounded-full bg-pc-blue text-white text-[9px] flex items-center justify-center font-mono">1</span>
                <span>Que se passe-t-il ? (Contexte & Événement)</span>
              </label>
              <input type="text" id="sms-what" value="${config.whatHappened.replace(/"/g, '&quot;')}" oninput="window.ProtecSmsMobilization.updateSmsPreview('${mission.id}')" class="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-pc-blue shadow-2xs">
              <div class="flex items-center gap-1 flex-wrap">
                <span class="text-[9px] text-slate-400 font-bold">Raccourcis rapides :</span>
                <button type="button" onclick="document.getElementById('sms-what').value='Crues & Inondations rapides avec mise en sécurité'; window.ProtecSmsMobilization.updateSmsPreview('${mission.id}')" class="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 cursor-pointer">Inondations</button>
                <button type="button" onclick="document.getElementById('sms-what').value='Sinistre industriel SEVESO / Évacuation de secteur'; window.ProtecSmsMobilization.updateSmsPreview('${mission.id}')" class="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 cursor-pointer">SEVESO</button>
                <button type="button" onclick="document.getElementById('sms-what').value='Urgence Sanitaire SAMU 15 / Départ Réflexe Immédiat'; window.ProtecSmsMobilization.updateSmsPreview('${mission.id}')" class="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 cursor-pointer">SAMU 15</button>
                <button type="button" onclick="document.getElementById('sms-what').value='Dispositif Prévisionnel de Secours d\'envergure'; window.ProtecSmsMobilization.updateSmsPreview('${mission.id}')" class="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 cursor-pointer">DPS</button>
              </div>
            </div>

            <!-- 2. QUELLES SERONT LES MISSIONS DE LA PROTECTION CIVILE ? -->
            <div class="space-y-1.5">
              <label class="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span class="w-4 h-4 rounded-full bg-pc-blue text-white text-[9px] flex items-center justify-center font-mono">2</span>
                <span>Missions de la Protection Civile sur le terrain</span>
              </label>
              <textarea id="sms-missions" rows="2" oninput="window.ProtecSmsMobilization.updateSmsPreview('${mission.id}')" class="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-pc-blue shadow-2xs leading-relaxed">${config.pcMissions}</textarea>
              <div class="flex items-center gap-1 flex-wrap">
                <span class="text-[9px] text-slate-400 font-bold">Suggestions :</span>
                <button type="button" onclick="document.getElementById('sms-missions').value='Armement PMA, prise en charge des victimes et transport sanitaire CHU.'; window.ProtecSmsMobilization.updateSmsPreview('${mission.id}')" class="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 cursor-pointer">PMA / Soins</button>
                <button type="button" onclick="document.getElementById('sms-missions').value='Ouverture Centre d\'Accueil Impliqués (CAI), soutien psycho et hébergement.'; window.ProtecSmsMobilization.updateSmsPreview('${mission.id}')" class="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 cursor-pointer">CAI / Hébergement</button>
                <button type="button" onclick="document.getElementById('sms-missions').value='Poste de secours fixe, patrouilles binômes et bilans urgence.'; window.ProtecSmsMobilization.updateSmsPreview('${mission.id}')" class="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 cursor-pointer">Poste / PAPS</button>
              </div>
            </div>

            <!-- 3. QUOI FAIRE EN TANT QUE BÉNÉVOLE ? (CONSIGNE CLÉ D'AUTONOMIE) -->
            <div class="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <label class="block text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <span class="w-4 h-4 rounded-full bg-pc-orange text-white text-[9px] flex items-center justify-center font-mono">3</span>
                  <span>Consigne donnée aux bénévoles (Action requise)</span>
                </span>
                <span class="text-[10px] text-pc-orange font-bold font-mono">Mode d'action</span>
              </label>

              <div class="space-y-1.5">
                ${Object.values(this.CONSIGNES).map(c => `
                  <label class="flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition ${config.consigne === c.id ? 'bg-white dark:bg-slate-900 border-pc-blue ring-1 ring-pc-blue' : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'}">
                    <input type="radio" name="sms-consigne" value="${c.id}" ${config.consigne === c.id ? 'checked' : ''} onchange="window.ProtecSmsMobilization.onConsigneChanged('${mission.id}', this.value)" class="mt-0.5 text-pc-blue focus:ring-pc-blue">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-black text-slate-900 dark:text-white">${c.label}</span>
                      </div>
                      <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">${c.smsText}</p>
                    </div>
                  </label>
                `).join('')}
              </div>

              <!-- Sélecteur d'heure si consigne RDV horaire -->
              <div id="sms-rdv-box" class="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 ${config.consigne === 'base_horaire' ? '' : 'hidden'}">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Heure précise du RDV à la base :</span>
                <input type="text" id="sms-rdv-time" value="${config.rdvTime}" oninput="window.ProtecSmsMobilization.updateSmsPreview('${mission.id}')" placeholder="Ex: 18h30" class="w-28 px-2.5 py-1 text-center font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              </div>
            </div>

            <!-- 4. COMPÉTENCES & EFFECTIFS REQUIS -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span class="w-4 h-4 rounded-full bg-pc-blue text-white text-[9px] flex items-center justify-center font-mono">4</span>
                  <span>Profils prioritaires</span>
                </label>
                <select id="sms-skill" onchange="window.ProtecSmsMobilization.updateSmsPreview('${mission.id}')" class="w-full px-2.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-pc-blue cursor-pointer">
                  ${Object.values(this.SKILL_PROFILES).map(p => `
                    <option value="${p.id}" ${config.requiredSkill === p.id ? 'selected' : ''}>${p.label}</option>
                  `).join('')}
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span class="w-4 h-4 rounded-full bg-pc-blue text-white text-[9px] flex items-center justify-center font-mono">5</span>
                  <span>Nombre recherché</span>
                </label>
                <div class="flex items-center gap-2">
                  <input type="number" id="sms-target-count" min="1" max="40" value="${config.targetCount}" oninput="window.ProtecSmsMobilization.updateSmsPreview('${mission.id}')" class="w-24 px-2.5 py-2 text-center font-black text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  <span class="text-[11px] font-semibold text-slate-500">secouriste(s)</span>
                </div>
              </div>
            </div>

            <!-- 5. DESTINATAIRES DU SMS (SI ÉVOLUTION DE SITUATION) -->
            ${isUpdate ? `
              <div class="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 space-y-2">
                <label class="block text-xs font-black uppercase text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <span>🎯 Destinataires de cette mise à jour</span>
                </label>
                <div class="space-y-1.5 text-xs">
                  <label class="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input type="radio" name="sms-recipients" value="registered_only" checked class="text-amber-600">
                    <span>Secouristes déjà inscrits (${registeredCount}) — Appliquer le nouvel ordre immédiatement</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input type="radio" name="sms-recipients" value="both" class="text-amber-600">
                    <span>Tous : Inscrits (${registeredCount}) + Nouveaux secouristes disponibles (${availableVols.length})</span>
                  </label>
                </div>
              </div>
            ` : ''}

          </div>

          <!-- APERÇU EN DIRECT DU SMS (SMARTPHONE MOCKUP - 5 colonnes) -->
          <div class="lg:col-span-5 flex flex-col items-center">
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Aperçu Réaliste sur Smartphone</span>
            
            <div class="w-full max-w-[320px] bg-slate-900 rounded-[32px] p-3 shadow-2xl border-4 border-slate-800 text-white flex flex-col justify-between space-y-3">
              <!-- Haut du smartphone -->
              <div class="flex items-center justify-between text-[10px] text-slate-400 px-2 pt-1">
                <span>06:45</span>
                <div class="w-16 h-3.5 bg-black rounded-full mx-auto"></div>
                <span>5G 📶 100%</span>
              </div>

              <!-- En-tête conversation -->
              <div class="text-center border-b border-slate-800 pb-2">
                <div class="w-9 h-9 rounded-full bg-pc-blue text-white flex items-center justify-center font-black text-xs mx-auto border border-white/20">
                  PC
                </div>
                <div class="font-extrabold text-xs text-white mt-1">PROTECTION CIVILE</div>
                <div class="text-[9px] text-emerald-400 font-semibold">Diffusion Alerte Opérationnelle</div>
              </div>

              <!-- Bulle de message SMS reçu -->
              <div class="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-100 text-[11px] leading-relaxed space-y-1.5 shadow-md">
                <pre id="sms-preview-text" class="whitespace-pre-wrap font-sans font-medium text-[10px] leading-normal text-slate-200 select-all">${this.generateSmsBody(config)}</pre>
                <div class="text-right text-[8px] text-slate-400 mono-num pt-1">Reçu à l'instant • SMS</div>
              </div>

              <!-- Réponses types des bénévoles -->
              <div class="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span class="text-[9px] font-bold text-slate-400 block uppercase">Réponses simulées des bénévoles :</span>
                <div class="flex items-center gap-1.5 text-[9px] text-emerald-300 font-semibold">
                  <span>✅ DISPO :</span>
                  <span id="sms-preview-reply" class="italic truncate">${(this.CONSIGNES[config.consigne] || this.CONSIGNES.attente_domicile).volunteerReply}</span>
                </div>
                <div class="flex items-center gap-1.5 text-[9px] text-rose-300 font-semibold">
                  <span>❌ INDISPO :</span>
                  <span class="italic truncate">« Désolé, indisponible (Travail / Famille) »</span>
                </div>
              </div>

              <!-- Bas smartphone -->
              <div class="w-24 h-1 bg-white/40 rounded-full mx-auto pb-0"></div>
            </div>
          </div>
        </div>

        <!-- ACTIONS FOOTER -->
        <div class="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
          <button type="button" onclick="window.game.closeModal()" class="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition">
            Annuler
          </button>
          <button type="button" onclick="window.ProtecSmsMobilization.submitSms('${mission.id}', ${isUpdate})" class="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-pc-blue to-pc-blue-light hover:brightness-110 text-white shadow-lg shadow-pc-blue/30 active:scale-95 transition flex items-center gap-2 cursor-pointer">
            <i data-lucide="send" class="w-4 h-4"></i>
            <span>${isUpdate ? 'Transmettre les Nouvelles Consignes' : 'Diffuser le SMS d\'Alerte'}</span>
          </button>
        </div>

      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();
  },

  // Changement de la consigne (affiche ou masque l'heure du RDV)
  onConsigneChanged(missionId, consigneId) {
    const rdvBox = document.getElementById('sms-rdv-box');
    if (rdvBox) {
      if (consigneId === 'base_horaire') {
        rdvBox.classList.remove('hidden');
      } else {
        rdvBox.classList.add('hidden');
      }
    }
    this.updateSmsPreview(missionId);
  },

  // Met à jour la prévisualisation du SMS en direct
  updateSmsPreview(missionId) {
    const what = document.getElementById('sms-what')?.value || '';
    const missions = document.getElementById('sms-missions')?.value || '';
    const consigne = document.querySelector('input[name="sms-consigne"]:checked')?.value || 'attente_domicile';
    const rdvTime = document.getElementById('sms-rdv-time')?.value || '18h30';
    const skill = document.getElementById('sms-skill')?.value || 'tous';
    const count = parseInt(document.getElementById('sms-target-count')?.value || '1', 10);

    const config = {
      whatHappened: what,
      pcMissions: missions,
      consigne: consigne,
      rdvTime: rdvTime,
      requiredSkill: skill,
      targetCount: count
    };

    const previewEl = document.getElementById('sms-preview-text');
    if (previewEl) {
      previewEl.textContent = this.generateSmsBody(config);
    }

    const replyEl = document.getElementById('sms-preview-reply');
    if (replyEl) {
      const c = this.CONSIGNES[consigne] || this.CONSIGNES.attente_domicile;
      replyEl.textContent = c.volunteerReply;
    }
  },

  // Soumission et déclenchement de la campagne SMS
  submitSms(missionId, isUpdate = false) {
    const game = window.game;
    if (!game) return;
    const mission = game.missions.find(m => m.id === missionId);
    if (!mission) return;

    const what = document.getElementById('sms-what')?.value || mission.title;
    const missions = document.getElementById('sms-missions')?.value || 'Secours à personnes et logistique';
    const consigne = document.querySelector('input[name="sms-consigne"]:checked')?.value || 'attente_domicile';
    const rdvTime = document.getElementById('sms-rdv-time')?.value || '18h30';
    const skill = document.getElementById('sms-skill')?.value || 'tous';
    const targetCount = parseInt(document.getElementById('sms-target-count')?.value || '4', 10);
    const recipientMode = document.querySelector('input[name="sms-recipients"]:checked')?.value || 'all_available';

    const config = {
      whatHappened: what,
      pcMissions: missions,
      consigne: consigne,
      rdvTime: rdvTime,
      requiredSkill: skill,
      targetCount: targetCount,
      recipientMode: recipientMode
    };

    // Fermer la modale
    game.closeModal();

    // Enregistrer la consigne active sur la mission
    mission.smsConsigne = config;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const fullSmsBody = this.generateSmsBody(config);

    if (!Array.isArray(mission.smsHistory)) mission.smsHistory = [];
    mission.smsHistory.unshift({
      time: timeStr,
      isUpdate: isUpdate,
      consigne: consigne,
      consigneLabel: (this.CONSIGNES[consigne] || {}).label || consigne,
      targetCount: targetCount,
      text: fullSmsBody
    });

    // 1. Si c'est une mise à jour d'évolution pour les secouristes DÉJÀ inscrits
    if (isUpdate && (recipientMode === 'registered_only' || recipientMode === 'both')) {
      let transitionedCount = 0;
      (mission.registeredVolunteers || []).forEach(volId => {
        const vol = game.volunteers.find(v => v.id === volId);
        if (!vol) return;

        // Si la consigne devient "base_immediat" et que le bénévole n'était pas encore parti
        if (consigne === 'base_immediat') {
          if (!mission.volunteerTransit?.[volId]) {
            game.initVolunteerCrisisTransit(mission, volId);
            transitionedCount++;
          }
        } else if (consigne === 'attente_domicile') {
          // Si on repasse en attente à domicile
          if (mission.volunteerTransit && mission.volunteerTransit[volId]) {
            delete mission.volunteerTransit[volId];
          }
        }

        // Ajouter un accusé de réception du bénévole
        if (!Array.isArray(mission.smsResponses)) mission.smsResponses = [];
        mission.smsResponses.unshift({
          volunteerId: vol.id,
          volunteerName: vol.name,
          rank: vol.rank || 'Secouriste',
          isAvailable: true,
          message: `Nouvelle consigne reçue (${this.CONSIGNES[consigne]?.shortLabel || 'Mise à jour'}). Ordre appliqué.`,
          time: timeStr
        });
      });

      if (consigne === 'base_immediat' && transitionedCount > 0) {
        game.showToast('🚨 Ordre d\'Évolution Transmis', `${transitionedCount} secouriste(s) font mouvement immédiatement vers la base d'antenne !`, 'green');
      } else {
        game.showToast('📱 Consigne Mise à Jour', `Consigne « ${this.CONSIGNES[consigne]?.shortLabel} » transmise aux secouristes inscrits.`, 'blue');
      }

      if (recipientMode === 'registered_only') {
        game.saveGame();
        game.renderMissions();
        game.updateStatsUI();
        if (game.selectedMissionId === mission.id) game.openMissionDetails(mission.id);
        return;
      }
    }

    // 2. Diffusion aux secouristes disponibles non encore engagés
    this.launchSmsDispatch(game, mission, config);
  },

  // Diffusion aux bénévoles avec simulation réaliste et autonomie selon la consigne
  launchSmsDispatch(game, mission, config) {
    const unassignedVols = game.volunteers.filter(v => 
      !mission.registeredVolunteers.includes(v.id) &&
      v.status !== 'mission' &&
      !v.isBurnout
    );

    if (unassignedVols.length === 0) {
      game.showToast('Effectif Maximum Atteint', 'Tous vos personnels disponibles ont déjà été mobilisés.', 'orange');
      game.saveGame();
      if (game.selectedMissionId === mission.id) game.openMissionDetails(mission.id);
      return;
    }

    mission.smsCampaignActive = true;
    mission.relancesCount = (mission.relancesCount || 0) + 1;

    const consigneObj = this.CONSIGNES[config.consigne] || this.CONSIGNES.attente_domicile;
    game.showToast('Diffusion SMS Lancée 📱', `Message envoyé à ${unassignedVols.length} secouriste(s) [Consigne : ${consigneObj.shortLabel}].`, 'blue');

    let pendingResponses = unassignedVols.length;

    // Priorisation selon la compétence demandée
    const sortedVols = [...unassignedVols].sort((a, b) => {
      let boostA = 0;
      let boostB = 0;
      if (config.requiredSkill === 'chauffeur') {
        if ((a.skills || []).includes('permis_vpsp') || (a.skills || []).includes('pilotage')) boostA += 40;
        if ((b.skills || []).includes('permis_vpsp') || (b.skills || []).includes('pilotage')) boostB += 40;
      } else if (config.requiredSkill === 'ce') {
        if (a.rank === 'CE' || (a.skills || []).includes('ce')) boostA += 40;
        if (b.rank === 'CE' || (b.skills || []).includes('ce')) boostB += 40;
      } else if (config.requiredSkill === 'pse2') {
        if (a.rank === 'PSE2' || (a.skills || []).includes('pse2')) boostA += 30;
        if (b.rank === 'PSE2' || (b.skills || []).includes('pse2')) boostB += 30;
      }

      const scoreA = (a.motivation || 70) + (a.energy || 70) * 0.4 + boostA + (Math.random() * 15);
      const scoreB = (b.motivation || 70) + (b.energy || 70) * 0.4 + boostB + (Math.random() * 15);
      return scoreB - scoreA;
    });

    let cumulativeDelayMs = 0;

    sortedVols.forEach((vol, idx) => {
      const evalResult = game.evaluateVolunteerAvailability(vol, mission.eventDate, mission);

      const motiv = vol.motivation || 70;
      const speedMod = Math.max(0.5, 1.3 - (motiv / 100));
      const stepMs = Math.round((2800 + Math.random() * 3800) * speedMod);

      if (idx === 0) {
        cumulativeDelayMs = Math.round(2000 + Math.random() * 2000);
      } else {
        cumulativeDelayMs += stepMs;
      }

      const assignedDelayMs = cumulativeDelayMs;

      setTimeout(() => {
        pendingResponses--;
        if (pendingResponses <= 0) {
          mission.smsCampaignActive = false;
        }

        const currentMission = game.missions.find(m => m.id === mission.id);
        if (!currentMission) return;
        if (['completed', 'canceled_favorable'].includes(currentMission.status)) return;

        const isFull = (currentMission.registeredVolunteers || []).length >= (currentMission.requiredVolunteers || 1);
        const willAccept = !isFull && evalResult.isAvailable;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (!Array.isArray(currentMission.smsResponses)) currentMission.smsResponses = [];

        if (willAccept) {
          if (!currentMission.registeredVolunteers.includes(vol.id)) {
            currentMission.registeredVolunteers.push(vol.id);
          }

          let replyMsg = consigneObj.volunteerReply;
          let transitLaunched = false;

          // AUTONOMIE DU BÉNÉVOLE SELON LA CONSIGNE
          if (config.consigne === 'base_immediat') {
            const transit = game.initVolunteerCrisisTransit(currentMission, vol.id);
            transitLaunched = true;
            replyMsg = `Présent(e) ! Je pars immédiatement de chez moi vers la base (trajet ~${transit?.rallyMinutes || 10} min).`;
          } else if (config.consigne === 'base_horaire') {
            replyMsg = `Présent(e) ! Bien noté pour le rendez-vous à la base à ${config.rdvTime}. Je serai là.`;
          } else if (config.consigne === 'attente_domicile') {
            replyMsg = `Présent(e) ! Je reste chez moi en veille réflexe, téléphone à portée.`;
          } else if (config.consigne === 'attente_appel') {
            replyMsg = `Disponible ! J'attends l'appel direct de l'astreinte si retenu(e).`;
          }

          currentMission.smsResponses.unshift({
            volunteerId: vol.id,
            volunteerName: vol.name,
            rank: vol.rank || 'Secouriste',
            isAvailable: true,
            consigne: config.consigne,
            message: replyMsg,
            time: timeStr
          });

          if (transitLaunched) {
            game.showToast('🚗 SMS : DISPO & EN ROUTE !', `${vol.name} : « ${replyMsg} »`, 'green');
          } else {
            game.showToast('📱 SMS Reçu : DISPO !', `${vol.name} (${vol.rank}) : « ${replyMsg} »`, 'green');
          }

          setTimeout(() => {
            game.checkEnginProgressNotification(currentMission);
          }, 900);
        } else if (!isFull) {
          if (Math.random() < 0.75) {
            currentMission.smsResponses.unshift({
              volunteerId: vol.id,
              volunteerName: vol.name,
              rank: vol.rank || 'Secouriste',
              isAvailable: false,
              message: `Désolé, indisponible (${evalResult.rejectReason || 'Contrainte personnelle'})`,
              time: timeStr
            });
            game.showToast('📱 SMS Reçu : Indispo', `${vol.name} : « Désolé, impossible (${evalResult.rejectReason || 'Contrainte'}) »`, 'slate');
          }
        }

        game.saveGame();
        game.renderMissions();
        game.updateStatsUI();

        if (game.selectedMissionId === currentMission.id) {
          game.openMissionDetails(currentMission.id);
        }
      }, assignedDelayMs);
    });

    game.saveGame();
    game.renderMissions();
    game.updateStatsUI();
    if (game.selectedMissionId === mission.id) {
      game.openMissionDetails(mission.id);
    }
  },

  // Rendu HTML de la section SMS dans l'onglet Personnel
  renderSmsSectionHTML(game, mission) {
    if (!mission) return '';
    const consigne = mission.smsConsigne || {};
    const consigneDef = this.CONSIGNES[consigne.consigne] || null;
    const history = mission.smsHistory || [];

    return `
      <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs space-y-3 shadow-2xs">
        
        <!-- EN-TÊTE DE LA SECTION SMS -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-pc-blue/10 dark:bg-pc-blue/30 text-pc-blue dark:text-blue-400 flex items-center justify-center text-base font-bold">
              📱
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-xs font-black uppercase text-slate-800 dark:text-white">Diffusion SMS & Consignes Opérationnelles</h4>
                ${mission.smsCampaignActive ? `
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white animate-pulse flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-white"></span> Diffusion active...
                  </span>
                ` : ''}
              </div>
              <p class="text-[10px] text-slate-500 dark:text-slate-400">Gérez les consignes d'autonomie et adaptez le message selon l'évolution de la situation.</p>
            </div>
          </div>

          <!-- BOUTONS D'ACTION SMS -->
          <div class="flex items-center gap-1.5 ml-auto">
            <button type="button" onclick="window.ProtecSmsMobilization.openSmsModal(window.game, '${mission.id}', ${Boolean(mission.smsConsigne)})" class="px-3 py-1.5 rounded-xl text-xs font-black bg-pc-blue hover:bg-pc-blue-light text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs">
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
              <span>${mission.smsConsigne ? '📱 Nouveau SMS / Évolution' : '📱 Rédiger & Diffuser SMS'}</span>
            </button>
          </div>
        </div>

        <!-- BADGE DE LA CONSIGNE ACTIVE -->
        ${consigneDef ? `
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Consigne active transmise :</span>
              <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black ${consigneDef.badgeClass}">
                ${consigneDef.label}
              </span>
              ${consigne.consigne === 'base_horaire' && consigne.rdvTime ? `
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                  RDV : ${consigne.rdvTime}
                </span>
              ` : ''}
            </div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400 italic">
              « ${consigne.pcMissions || 'Missions de soutien et secours'} »
            </div>
          </div>
        ` : ''}

        <!-- HISTORIQUE DES MESSAGES ENVOYÉS (ACCORDÉON) -->
        ${history.length > 0 ? `
          <details class="group bg-slate-50 dark:bg-black/20 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <summary class="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 cursor-pointer flex items-center justify-between list-none">
              <span class="flex items-center gap-1.5">
                <i data-lucide="history" class="w-3.5 h-3.5 text-pc-blue"></i>
                <span>Historique des SMS diffusés (${history.length})</span>
              </span>
              <span class="text-[10px] font-bold text-slate-400 group-open:rotate-180 transition">▼</span>
            </summary>
            <div class="mt-2 space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-700 max-h-48 overflow-y-auto">
              ${history.map((h, i) => `
                <div class="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div class="flex items-center justify-between text-[10px]">
                    <span class="font-extrabold ${h.isUpdate ? 'text-amber-600 dark:text-amber-400' : 'text-pc-blue dark:text-indigo-400'}">
                      ${h.isUpdate ? '⚡ Mise à Jour Consigne' : '📢 Alerte Initiale'} (${h.consigneLabel || 'Consigne'})
                    </span>
                    <span class="mono-num text-slate-400 font-bold">${h.time}</span>
                  </div>
                  <pre class="whitespace-pre-wrap font-sans text-[9px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2 rounded border border-slate-100 dark:border-slate-800">${h.text}</pre>
                </div>
              `).join('')}
            </div>
          </details>
        ` : ''}

        <!-- FLUX DES RÉPONSES DES BÉNÉVOLES -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
            <span>Réponses reçues des secouristes (${(mission.smsResponses || []).length})</span>
            ${(mission.smsResponses && mission.smsResponses.length > 0) ? `
              <span class="text-emerald-600 dark:text-emerald-400 font-bold">
                ${mission.smsResponses.filter(r => r.isAvailable).length} disponible(s)
              </span>
            ` : ''}
          </div>

          ${(mission.smsResponses && mission.smsResponses.length > 0) ? `
            <div class="space-y-1 max-h-44 overflow-y-auto">
              ${mission.smsResponses.map(r => `
                <div class="p-2 rounded-xl border flex items-center justify-between text-xs ${r.isAvailable ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-500/30 text-slate-800 dark:text-white shadow-2xs' : 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500'}">
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <span class="text-sm shrink-0">${r.isAvailable ? '📱' : '✉️'}</span>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="font-bold text-slate-900 dark:text-white">${r.volunteerName}</span>
                        <span class="text-[9px] font-bold px-1.5 py-0.2 rounded ${r.isAvailable ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'}">
                          ${r.isAvailable ? '✅ Dispo' : '❌ Indispo'}
                        </span>
                        <span class="text-[9px] text-slate-400 font-semibold">${r.rank}</span>
                      </div>
                      <div class="text-[11px] italic truncate text-slate-600 dark:text-slate-300 mt-0.5">« ${r.message} »</div>
                    </div>
                  </div>
                  <span class="text-[10px] mono-num font-bold text-slate-400 shrink-0 ml-2">${r.time}</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-dashed border-slate-200 dark:border-white/10 text-center text-slate-400 text-[11px] italic">
              ${mission.smsCampaignActive ? 'Campagne SMS en cours de diffusion... Les réponses des secouristes apparaîtront ici.' : 'Aucun retour SMS pour l\'instant. Cliquez sur « Rédiger & Diffuser SMS » pour solliciter vos bénévoles.'}
            </div>
          `}
        </div>

      </div>
    `;
  }
};
