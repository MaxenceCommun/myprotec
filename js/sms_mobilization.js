/**
 * Module Officiel de Composition & Mobilisation SMS - Protection Civile
 * Gère la rédaction personnalisée, les consignes d'autonomie et l'évolution de situation.
 */

window.ProtecSmsMobilization = {
  // Consignes opérationnelles disponibles
  CONSIGNES: {
    base_immediat: {
      id: 'base_immediat',
      label: 'Ralliement IMMÉDIAT à la base',
      shortLabel: 'Départ immédiat vers la base',
      badgeClass: 'bg-red-600 text-white animate-pulse',
      icon: 'zap',
      smsText: 'RALLIEMENT IMMÉDIAT À LA BASE D\'ANTENNE. Convergence sous gyrophares à l\'arrivée.',
      volunteerReply: 'Bien reçu ! Je quitte mon domicile immédiatement vers la base.'
    },
    base_horaire: {
      id: 'base_horaire',
      label: 'Rendez-vous à la base à heure précise',
      shortLabel: 'RDV base à heure fixe',
      badgeClass: 'bg-indigo-600 text-white',
      icon: 'clock',
      smsText: 'Rendez-vous fixé à la base d\'antenne pour armement et briefing.',
      volunteerReply: 'Dispo confirmée ! Je serai à la base à l\'heure du RDV convenu.'
    },
    sur_place_immediat: {
      id: 'sur_place_immediat',
      label: 'Ralliement DIRECT SUR PLACE (Sans passer par la base)',
      shortLabel: 'Départ direct sur place',
      badgeClass: 'bg-emerald-600 text-white animate-pulse',
      icon: 'navigation',
      smsText: 'CONVERGENCE DIRECTE SUR LE LIEU DE MISSION. Sans matériel à récupérer : ne passez pas par la base.',
      volunteerReply: 'Bien reçu ! Je pars directement sur le lieu de l\'intervention sans passer par la base.'
    },
    sur_place_horaire: {
      id: 'sur_place_horaire',
      label: 'Rendez-vous DIRECT SUR PLACE à heure précise',
      shortLabel: 'RDV sur site à heure fixe',
      badgeClass: 'bg-teal-600 text-white',
      icon: 'map-pin',
      smsText: 'Rendez-vous directement sur le lieu de l\'intervention à heure convenue.',
      volunteerReply: 'Dispo confirmée ! Je serai directement sur les lieux de l\'intervention à l\'heure fixée.'
    },
    attente_domicile: {
      id: 'attente_domicile',
      label: 'Attendre à domicile en alerte (Dispo domicile)',
      shortLabel: 'En veille à domicile',
      badgeClass: 'bg-blue-600 text-white',
      icon: 'home',
      smsText: 'Attendre à domicile en alerte réflexe. Gardez votre téléphone à portée, ne venez pas à la base.',
      volunteerReply: 'Présent(e) ! Je reste chez moi en veille active, téléphone sous la main.'
    },
    attente_appel: {
      id: 'attente_appel',
      label: 'Attendre l\'appel direct de l\'astreinte',
      shortLabel: 'Attente appel astreinte',
      badgeClass: 'bg-amber-600 text-white',
      icon: 'phone-call',
      smsText: 'Indiquez votre disponibilité mais attendez l\'appel direct du chef de détachement.',
      volunteerReply: 'Disponible ! J\'attends l\'appel de l\'astreinte si mon profil est retenu.'
    },
    attente_consignes: {
      id: 'attente_consignes',
      label: 'Attendre consignes complémentaires (Évolution)',
      shortLabel: 'Attente consignes',
      badgeClass: 'bg-slate-700 text-white',
      icon: 'help-circle',
      smsText: 'Situation évolutive. Merci d\'indiquer votre créneau, consignes définitives à suivre.',
      volunteerReply: 'Bien reçu. En veille à l\'écoute des prochaines consignes opérationnelles.'
    }
  },

  // Objectifs & Missions terrain sélectionnables par choix
  MISSION_OBJECTIVES: {
    pma: { id: 'pma', label: 'Poste Médical Avancé (PMA)', text: 'Armement Poste Médical Avancé (PMA) et prise en charge des victimes', icon: 'stethoscope' },
    evac: { id: 'evac', label: 'Évacuation & Noria Sanitaire', text: 'Noria d\'évacuation sanitaire VPSP vers les Urgences CHU', icon: 'ambulance' },
    cai: { id: 'cai', label: 'Centre Accueil Impliqués (CAI)', text: 'Ouverture Centre d\'Accueil des Impliqués (CAI) et soutien médico-psychologique', icon: 'users' },
    heberg: { id: 'heberg', label: 'Hébergement d\'Urgence (CHU)', text: 'Mise en place d\'un Centre d\'Hébergement d\'Urgence (CHU) et lits de camp', icon: 'bed' },
    ravitaillement: { id: 'ravitaillement', label: 'Ravitaillement & Vivres', text: 'Distribution d\'eau, vivres et soutien matériel aux sinistrés', icon: 'coffee' },
    logistique: { id: 'logistique', label: 'Éclairage & Soutien Log', text: 'Éclairage autonome, groupes électrogènes et pompage de secteur', icon: 'package' },
    dps: { id: 'dps', label: 'Poste de Secours & Patrouilles', text: 'Poste de secours prévisionnel et surveillance par patrouilles binômes', icon: 'shield-check' }
  },

  // Profils / Compétences ciblées
  SKILL_PROFILES: {
    tous: { id: 'tous', label: 'Tous profils bienvenus (PSE1, PSE2, Stagiaires)' },
    chauffeur: { id: 'chauffeur', label: 'Conducteurs VPSP indispensables (Permis VPSP)' },
    ce: { id: 'ce', label: 'Chefs d\'équipe / Chefs de poste (CE / CP)' },
    pse2: { id: 'pse2', label: 'Secouristes PSE2 qualifiés' },
    cadre: { id: 'cadre', label: 'Cadres & Commandement (Officiers / Logistique)' }
  },

  // =========================================================================
  // COMPÉTENCES REQUISES (SMS DE DÉCLENCHEMENT DE CRISE)
  // Quotas : « Demandé » = prioritaire (d'autres profils peuvent compléter)
  //          « Verrouillé » = places réservées à ce profil uniquement
  // =========================================================================
  SKILL_QUOTA_CATALOG: [
    { group: 'Grades opérationnels', items: [
      { key: 'pse1', label: 'PSE1', short: 'PSE1' },
      { key: 'pse2', label: 'PSE2', short: 'PSE2' },
      { key: 'ce', label: 'Chef d\'équipe (CE)', short: 'CE' },
      { key: 'cp', label: 'Chef de poste (CP)', short: 'CP' },
      { key: 'cs', label: 'Chef de secteur (CS)', short: 'CS' },
      { key: 'cd', label: 'Chef de dispositif (CD)', short: 'CD' },
      { key: 'log', label: 'Logisticien', short: 'Logisticien' }
    ] },
    { group: 'Conduite', items: [
      { key: 'cond_vpsp', label: 'Conducteur VPSP', short: 'Conducteur VPSP' },
      { key: 'permis_c', label: 'Permis PL (C)', short: 'Permis PL' },
      { key: 'conduite_4x4', label: 'Pilote 4x4 tout-terrain', short: 'Pilote 4x4' },
      { key: 'permis_moto', label: 'Pilote moto / quad', short: 'Pilote moto' },
      { key: 'permis_bateau', label: 'Pilote embarcation (permis bateau)', short: 'Pilote bateau' }
    ] },
    { group: 'Spécialités', items: [
      { key: 'telepilote', label: 'Télépilote drone', short: 'Télépilote drone' },
      { key: 'cyno', label: 'Conducteur cynotechnique', short: 'Cynotechnie' },
      { key: 'aquatique', label: 'Sauveteur aquatique', short: 'Sauveteur aquatique' },
      { key: 'soutien_psy', label: 'Soutien psychologique / CAI', short: 'Soutien psy / CAI' },
      { key: 'transmissions', label: 'Opérateur transmissions', short: 'Transmissions' },
      { key: 'tronconnage', label: 'Opérateur tronçonnage', short: 'Tronçonnage' }
    ] }
  ],

  getQuotaDef(key) {
    for (const g of this.SKILL_QUOTA_CATALOG) {
      const it = g.items.find(i => i.key === key);
      if (it) return it;
    }
    return { key, label: key, short: key };
  },

  // Les SMS de déclenchement de crise (y compris en préalerte) portent les compétences requises
  isCrisisMission(mission) {
    if (!mission) return false;
    return Boolean(mission.type === 'crise' || mission.isCrisis || mission.isEmergencyPlan || mission.category === 'crise' || mission.status === 'declenche');
  },

  // Le bénévole possède-t-il la compétence ? (les grades supérieurs couvrent les inférieurs)
  volunteerHasQuotaSkill(vol, key) {
    if (!vol) return false;
    const rank = String(vol.rank || '').toUpperCase().trim();
    const skills = (vol.skills || []).map(x => String(x).toLowerCase().trim());
    const has = (...list) => skills.some(x => list.includes(x));
    const LV = { PSC1: 0, PSE1: 1, PSE2: 2, CE: 3, CP: 4, CS: 5, CD: 6 };
    let level = LV[rank] !== undefined ? LV[rank] : -1;
    ['pse1', 'pse2', 'ce', 'cp', 'cs', 'cd'].forEach(k => { if (skills.includes(k)) level = Math.max(level, LV[k.toUpperCase()]); });
    switch (key) {
      case 'pse1': return level >= 1;
      case 'pse2': return level >= 2;
      case 'ce': return level >= 3;
      case 'cp': return level >= 4;
      case 'cs': return level >= 5;
      case 'cd': return level >= 6;
      case 'log': return rank === 'LOGISTICIEN' || has('logistique', 'log', 'logisticien', 'resp_log') || skills.some(x => x.startsWith('log_'));
      case 'cond_vpsp': return Boolean(vol.isDriverVpsp) || has('permis_vpsp', 'pilotage', 'chauffeur', 'conducteur_vpsp');
      case 'permis_c': return Boolean(vol.permis_c) || has('permis_c', 'c', 'poids_lourd', 'pl');
      case 'conduite_4x4': return has('conduite_4x4', '4x4', 'hors_route');
      case 'permis_moto': return Boolean(vol.permis_moto) || has('permis_moto', 'moto', 'permis_a', 'permis_a2');
      case 'permis_bateau': return has('permis_bateau', 'bateau');
      case 'telepilote': return has('telepilote', 'telepilote_drone', 'drone');
      case 'cyno': return has('cyno', 'cyno_recherche');
      case 'aquatique': return has('bnssa', 'ssa', 'sauvetage_aquatique', 'sauveteur_aquatique', 'nautique');
      case 'soutien_psy': return has('cai', 'soutien_psy', 'psy', 'cump');
      case 'transmissions': return has('transmissions', 'radio', 'operateur_radio');
      case 'tronconnage': return skills.some(x => x.includes('tronc'));
      default: return false;
    }
  },

  // Quotas actifs du SMS de crise d'une mission
  getMissionQuotas(mission) {
    if (!this.isCrisisMission(mission)) return [];
    return ((mission.smsConsigne && mission.smsConsigne.skillQuotas) || []).filter(q => q && q.key && (Number(q.count) || 0) > 0);
  },

  // Bénévoles inscrits occupant chaque quota (recalculé à partir des inscrits encore présents)
  getQuotaFill(mission, quotas) {
    const reg = new Set(mission.registeredVolunteers || []);
    if (!mission.skillQuotaFill || typeof mission.skillQuotaFill !== 'object') mission.skillQuotaFill = {};
    const fill = mission.skillQuotaFill;
    Object.keys(fill).forEach(k => { fill[k] = (fill[k] || []).filter(id => reg.has(id)); });
    quotas.forEach(q => { if (!Array.isArray(fill[q.key])) fill[q.key] = []; });
    return fill;
  },

  // Rattache les inscrits déjà présents aux quotas (ex. après une préalerte ou un nouveau SMS)
  syncQuotaFillFromRegistered(game, mission) {
    const quotas = this.getMissionQuotas(mission);
    if (!quotas.length) return;
    const fill = this.getQuotaFill(mission, quotas);
    const placed = new Set(Object.values(fill).flat());
    (mission.registeredVolunteers || []).forEach(id => {
      if (placed.has(id)) return;
      const vol = (game.volunteers || []).find(v => v.id === id);
      const key = this.findQuotaSlot(mission, quotas, vol);
      if (key) { fill[key].push(id); placed.add(id); }
    });
  },

  // Quota libre que ce bénévole peut occuper (verrouillés en priorité, puis demandés)
  findQuotaSlot(mission, quotas, vol) {
    if (!vol) return null;
    const fill = this.getQuotaFill(mission, quotas);
    const ordered = [...quotas].sort((a, b) => (a.mode === 'verrouille' ? 0 : 1) - (b.mode === 'verrouille' ? 0 : 1));
    const q = ordered.find(x => (fill[x.key] || []).length < x.count && this.volunteerHasQuotaSkill(vol, x.key));
    return q ? q.key : null;
  },

  // Places encore réservées aux profils verrouillés non pourvus
  getReservedRemaining(mission, quotas) {
    const fill = this.getQuotaFill(mission, quotas);
    return quotas.filter(q => q.mode === 'verrouille').reduce((acc, q) => acc + Math.max(0, q.count - (fill[q.key] || []).length), 0);
  },

  formatQuotasLine(quotas) {
    return (quotas || []).filter(q => q && (Number(q.count) || 0) > 0)
      .map(q => `${q.count} ${this.getQuotaDef(q.key).short}${q.mode === 'verrouille' ? ' [VERROUILLÉ]' : ' [demandé]'}`).join(' • ');
  },

  // ----- Éditeur des quotas dans la fenêtre de composition -----
  renderQuotaEditorHTML(missionId) {
    const quotas = this._currentQuotas || [];
    const used = new Set(quotas.map(q => q.key));
    return `
      <select onchange="if(this.value){ window.ProtecSmsMobilization.addQuota('${missionId}', this.value); this.value=''; }" class="w-full px-2.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 cursor-pointer">
        <option value="">+ Ajouter une compétence requise…</option>
        ${this.SKILL_QUOTA_CATALOG.map(g => `<optgroup label="${g.group}">${g.items.filter(i => !used.has(i.key)).map(i => `<option value="${i.key}">${i.label}</option>`).join('')}</optgroup>`).join('')}
      </select>
      ${quotas.length === 0 ? `
        <p class="text-[10px] text-slate-500 dark:text-slate-400 italic">Aucune compétence imposée : tous les profils peuvent répondre.</p>
      ` : `
        <div class="space-y-1.5">
          ${quotas.map(q => {
            const def = this.getQuotaDef(q.key);
            const locked = q.mode === 'verrouille';
            return `
              <div class="flex flex-wrap items-center gap-2 p-2 rounded-xl border ${locked ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-600/50' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}">
                <span class="text-xs font-black text-slate-800 dark:text-slate-100 flex-1 min-w-[120px]">${def.label}</span>
                <div class="flex items-center gap-1">
                  <button type="button" onclick="window.ProtecSmsMobilization.adjustQuota('${missionId}', '${q.key}', -1)" class="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white font-black text-xs cursor-pointer">-</button>
                  <span class="w-6 text-center text-xs font-black text-slate-900 dark:text-white">${q.count}</span>
                  <button type="button" onclick="window.ProtecSmsMobilization.adjustQuota('${missionId}', '${q.key}', 1)" class="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white font-black text-xs cursor-pointer">+</button>
                </div>
                <div class="flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 text-[10px] font-black">
                  <button type="button" onclick="window.ProtecSmsMobilization.setQuotaMode('${missionId}', '${q.key}', 'demande')" class="px-2 py-1 cursor-pointer ${!locked ? 'bg-pc-blue text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}" title="Prioritaire : d'autres profils peuvent compléter">⭐ Demandé</button>
                  <button type="button" onclick="window.ProtecSmsMobilization.setQuotaMode('${missionId}', '${q.key}', 'verrouille')" class="px-2 py-1 cursor-pointer ${locked ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}" title="Places réservées : seuls ces profils peuvent les prendre">🔒 Verrouillé</button>
                </div>
                <button type="button" onclick="window.ProtecSmsMobilization.removeQuota('${missionId}', '${q.key}')" class="w-6 h-6 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-[10px] cursor-pointer" title="Retirer">✕</button>
              </div>`;
          }).join('')}
        </div>
      `}
      <div id="sms-quota-warning">${this.renderQuotaWarningHTML()}</div>
    `;
  },

  renderQuotaWarningHTML() {
    const quotas = this._currentQuotas || [];
    const game = window.game;
    const lockedTotal = quotas.filter(q => q.mode === 'verrouille').reduce((a, q) => a + q.count, 0);
    const target = parseInt(document.getElementById('sms-target-count')?.value || '0', 10) || 0;
    const parts = [];
    if (target && lockedTotal > target) parts.push(`⚠️ ${lockedTotal} places verrouillées pour ${target} recherché(s) : augmentez le nombre recherché.`);
    if (game && Array.isArray(game.volunteers)) {
      quotas.forEach(q => {
        const n = game.volunteers.filter(v => !v.isBurnout && this.volunteerHasQuotaSkill(v, q.key)).length;
        if (n < q.count) parts.push(`⚠️ ${this.getQuotaDef(q.key).label} : seulement ${n} bénévole(s) qualifié(s) dans l'antenne pour ${q.count} demandé(s).`);
      });
    }
    return parts.length ? `<div class="text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-600/40 rounded-lg px-2.5 py-1.5 space-y-0.5">${parts.map(p => `<div>${p}</div>`).join('')}</div>` : '';
  },

  refreshQuotaEditor(missionId) {
    const box = document.getElementById('sms-quota-editor');
    if (box) box.innerHTML = this.renderQuotaEditorHTML(missionId);
    this.updateSmsPreview(missionId);
  },

  addQuota(missionId, key) {
    if (!Array.isArray(this._currentQuotas)) this._currentQuotas = [];
    if (this._currentQuotas.some(q => q.key === key)) return;
    this._currentQuotas.push({ key, count: 1, mode: 'demande' });
    this.refreshQuotaEditor(missionId);
  },

  adjustQuota(missionId, key, delta) {
    const q = (this._currentQuotas || []).find(x => x.key === key);
    if (!q) return;
    q.count = Math.max(1, Math.min(40, q.count + delta));
    this.refreshQuotaEditor(missionId);
  },

  setQuotaMode(missionId, key, mode) {
    const q = (this._currentQuotas || []).find(x => x.key === key);
    if (!q) return;
    q.mode = mode === 'verrouille' ? 'verrouille' : 'demande';
    this.refreshQuotaEditor(missionId);
  },

  removeQuota(missionId, key) {
    this._currentQuotas = (this._currentQuotas || []).filter(q => q.key !== key);
    this.refreshQuotaEditor(missionId);
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

    let defaultObjectiveKeys = ['pma', 'evac'];
    if (isMaraude) {
      defaultObjectiveKeys = ['cai', 'ravitaillement'];
    } else if (isPrealert) {
      defaultObjectiveKeys = ['pma', 'logistique'];
    } else if (!isCrisis && !isUrgent) {
      defaultObjectiveKeys = ['dps'];
    }

    const pcMissions = defaultObjectiveKeys.map(k => this.MISSION_OBJECTIVES[k]?.text).filter(Boolean).join(' • ');

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

    const maxDepartureDelayMinutes = mission.smsConsigne?.maxDepartureDelayMinutes !== undefined
      ? mission.smsConsigne.maxDepartureDelayMinutes
      : (mission.maxDepartureDelayMinutes !== undefined ? mission.maxDepartureDelayMinutes : (isCrisis || isUrgent ? 20 : 30));

    return {
      whatHappened,
      pcMissions,
      defaultObjectiveKeys,
      consigne: defaultConsigne,
      rdvTime: suggestedRdvTime,
      requiredSkill: (isCrisis || isUrgent) ? 'chauffeur' : 'tous',
      targetCount: neededCount,
      maxDepartureDelayMinutes
    };
  },

  // Génère le texte brut du SMS à partir de la configuration (sans emojis superflus)
  generateSmsBody(config) {
    const consigneObj = this.CONSIGNES[config.consigne] || this.CONSIGNES.attente_domicile;
    const skillLabel = this.SKILL_PROFILES[config.requiredSkill]?.label || 'Tous profils';

    let consigneDetail = consigneObj.smsText;
    if (config.consigne === 'base_horaire' && config.rdvTime) {
      consigneDetail = `Rendez-vous à la base d'antenne fixé à ${config.rdvTime} pour armement et briefing.`;
    }

    const maxDelay = parseInt(config.maxDepartureDelayMinutes, 10);
    const delayLine = (maxDelay && maxDelay > 0)
      ? `DÉLAI DÉPART MAX : Présentation sous ${maxDelay} min max (trajet domicile ➔ base)\n`
      : '';

    const quotasLine = this.formatQuotasLine(config.skillQuotas);
    const effectifsLine = quotasLine
      ? `EFFECTIFS : ${config.targetCount} secouriste(s)\nCOMPÉTENCES : ${quotasLine}\n`
      : `EFFECTIFS : ${config.targetCount} secouriste(s) [Profil : ${skillLabel}]\n`;
    return `[PROTECTION CIVILE - ALERTE MISSION]\n` +
      `SITUATION : ${config.whatHappened}\n` +
      `MISSIONS PC : ${config.pcMissions}\n` +
      effectifsLine +
      delayLine +
      `CONSIGNES : ${consigneDetail}\n` +
      `\nRépondez "1" (DISPO) ou "2" (INDISPO).`;
  },

  // Ouvre la modale complète de composition SMS
  openSmsModal(game, missionId, isUpdate = false, opts = {}) {
    // Mode renfort : antenne alliée qui recueille les disponibilités de SES bénévoles pour une crise qu'elle ne dirige pas
    const renfortMode = Boolean(opts && opts.renfortMode);
    const mission = (game.missions || []).find(m => m.id === missionId) || (game.activeCrises || []).find(c => c.id === missionId);
    if (!mission) return;

    const isCrisis = (mission.type === 'crise' || mission.isCrisis);
    const myId = game.player?.id || 'usr_local';
    if (!renfortMode && isCrisis && mission.managerPlayerId && mission.managerPlayerId !== myId) {
      game.showToast('Commandement Exclusif', `Seul le directeur de crise (${mission.managerPlayerName}) peut composer ou modifier les alertes SMS.`, 'orange');
      return;
    }

    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    const defaults = this.getDefaults(mission, game);
    const renfortState = (game.crisisRenfortSmsDispos && game.crisisRenfortSmsDispos[missionId]) || null;
    const existing = renfortMode ? ((renfortState && renfortState.config) || {}) : (mission.smsConsigne || {});
    const config = {
      whatHappened: existing.whatHappened || defaults.whatHappened,
      pcMissions: existing.pcMissions || defaults.pcMissions,
      consigne: isUpdate ? (existing.consigne === 'attente_domicile' ? 'base_immediat' : existing.consigne) : (existing.consigne || defaults.consigne),
      rdvTime: existing.rdvTime || defaults.rdvTime,
      requiredSkill: existing.requiredSkill || defaults.requiredSkill,
      targetCount: defaults.targetCount,
      maxDepartureDelayMinutes: existing.maxDepartureDelayMinutes !== undefined ? existing.maxDepartureDelayMinutes : defaults.maxDepartureDelayMinutes
    };

    // Compétences requises (SMS de crise uniquement)
    const isCrisisSms = renfortMode || this.isCrisisMission(mission);
    this._currentQuotas = isCrisisSms ? (existing.skillQuotas || []).map(q => ({ ...q })) : [];
    // Première alerte d'une crise : compétences et effectif demandés par l'autorité pré-remplis
    if (isCrisisSms && !existing.skillQuotas && window.ProtecCriseMoyens && window.ProtecCriseMoyens.appliesTo(mission)) {
      this._currentQuotas = window.ProtecCriseMoyens.getSuggestedQuotas(game, mission);
      const regNow = (mission.registeredVolunteers || []).length;
      config.targetCount = Math.max(1, window.ProtecCriseMoyens.getSuggestedTarget(game, mission) - regNow);
    }
    if (renfortMode) {
      // Les consignes d'acheminement relèvent du directeur de crise : les bénévoles attendent ses ordres
      config.consigne = 'attente_consignes';
      config.targetCount = existing.targetCount || 4;
      if (!existing.whatHappened) config.whatHappened = `Demande de renfort : ${mission.title}`;
    }
    config.skillQuotas = this._currentQuotas;

    // Objectifs sélectionnés actuels
    this._currentObjectives = existing.selectedObjectives 
      ? [...existing.selectedObjectives] 
      : [...(defaults.defaultObjectiveKeys || ['pma', 'evac'])];

    const registeredCount = (mission.registeredVolunteers || []).length;
    const availableVols = game.volunteers.filter(v => 
      (renfortMode || !(mission.registeredVolunteers || []).includes(v.id)) &&
      v.status !== 'mission' &&
      !v.isBurnout &&
      v.hasUniform !== false
    );

    const isPrealert = (mission.status === 'prealerte');
    title.textContent = isUpdate 
      ? 'Évolution de Situation - Mise à Jour des Consignes' 
      : (isPrealert ? 'Consignes de Préalerte & Message Personnalisé aux Effectifs' : 'Composition & Diffusion SMS d\'Alerte');
    subtitle.textContent = isUpdate 
      ? `Transmettez les nouveaux ordres aux ${registeredCount} secouriste(s) déjà mobilisé(s) et/ou recrutez des renforts` 
      : (isPrealert 
          ? `Transmettez vos consignes de pré-mobilisation et vérifiez la disponibilité de vos ${availableVols.length} secouristes`
          : `Définissez les consignes opérationnelles transmises aux ${availableVols.length} secouriste(s) disponible(s)`);
    if (renfortMode) {
      title.textContent = 'Renfort de crise : demande de disponibilités';
      subtitle.textContent = `SMS à vos ${availableVols.length} secouriste(s) disponible(s). Les consignes d'acheminement seront données par le directeur de crise.`;
    }
    if (icon) icon.setAttribute('data-lucide', 'send');

    // Situations prédéfinies pour choix en 1 clic
    const situationChoices = [
      { id: 'mission', label: defaults.whatHappened, shortLabel: 'Situation Mission', icon: 'radio' },
      { id: 'inondations', label: 'Crues majeures & Inondations rapides avec mise en sécurité', shortLabel: 'Inondations / Crues', icon: 'cloud-rain' },
      { id: 'seveso', label: 'Sinistre industriel SEVESO / Évacuation de secteur', shortLabel: 'SEVESO / Incendie', icon: 'flame' },
      { id: 'samu', label: 'Urgence Sanitaire SAMU 15 / Départ Réflexe Immédiat', shortLabel: 'Urgence SAMU 15', icon: 'activity' },
      { id: 'dps', label: 'Dispositif Prévisionnel de Secours d\'envergure', shortLabel: 'Dispositif DPS', icon: 'shield' },
      { id: 'meteo', label: 'Vigilance Météo Orange / Tempête et intempéries', shortLabel: 'Alerte Météo', icon: 'wind' },
      { id: 'cai_chu', label: 'Soutien aux sinistrés / Accueil et hébergement d\'urgence', shortLabel: 'Accueil Sinistrés', icon: 'life-buoy' }
    ];

    body.innerHTML = `
      <div class="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
        
        <!-- BANDEAU D'AIDE ET D'EXPLICATION SUR L'AUTONOMIE -->
        <div class="p-3 rounded-2xl bg-gradient-to-r from-pc-blue/10 via-indigo-50 to-amber-50 dark:from-pc-blue/20 dark:via-slate-800 dark:to-slate-800 border border-pc-blue/20 text-slate-800 dark:text-slate-200 text-xs space-y-1">
          <div class="flex items-center gap-2 font-black text-pc-blue dark:text-indigo-400">
            <i data-lucide="info" class="w-4 h-4"></i>
            <span>Pilotage Opérationnel par Choix</span>
          </div>
          <p class="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            Construisez votre SMS en sélectionnant la <strong>situation</strong>, vos <strong>objectifs terrain</strong> et le <strong>mode d'action</strong>. Les bénévoles recevront leurs ordres et agiront en toute autonomie.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <!-- FORMULAIRE DE COMPOSITION PAR CHOIX (7 colonnes) -->
          <div class="lg:col-span-7 space-y-3.5">
            
            <!-- 1. QUE SE PASSE-T-IL ? (SÉLECTION PAR CHOIX) -->
            <div class="space-y-2">
              <label class="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <span class="w-4 h-4 rounded-full bg-pc-blue text-white text-[9px] flex items-center justify-center font-mono">1</span>
                  <span>Contexte & Situation Opérationnelle</span>
                </span>
                <span class="text-[10px] text-pc-blue font-bold font-mono">Choix en 1 clic</span>
              </label>

              <input type="hidden" id="sms-what" value="${config.whatHappened.replace(/"/g, '&quot;')}">

              <!-- Affichage du contexte actif sélectionné -->
              <div class="p-2.5 rounded-xl bg-pc-blue/10 dark:bg-pc-blue/20 border border-pc-blue/30 text-xs font-bold text-pc-blue dark:text-blue-300 flex items-center gap-2 shadow-2xs">
                <i id="sms-what-icon" data-lucide="radio" class="w-4 h-4 shrink-0 text-pc-blue dark:text-blue-400"></i>
                <span id="sms-what-text" class="truncate">${config.whatHappened}</span>
              </div>

              <!-- Grille des contextes cliquables -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5" id="sms-situation-buttons">
                ${situationChoices.map(sit => {
                  const isSelected = config.whatHappened === sit.label;
                  return `
                    <button type="button" 
                      onclick="window.ProtecSmsMobilization.selectSituation('${mission.id}', '${sit.label.replace(/'/g, "\\'")}', '${sit.icon}', this)" 
                      class="sms-sit-btn px-2.5 py-1.5 rounded-xl border text-[11px] font-bold text-left flex items-center gap-1.5 transition cursor-pointer ${isSelected ? 'bg-pc-blue text-white border-pc-blue shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-pc-blue/50'}">
                      <i data-lucide="${sit.icon}" class="w-3.5 h-3.5 shrink-0"></i>
                      <span class="truncate">${sit.shortLabel}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- 2. QUELLES SERONT LES MISSIONS DE LA PROTECTION CIVILE ? (CHOIX MULTIPLES) -->
            <div class="space-y-2">
              <label class="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <span class="w-4 h-4 rounded-full bg-pc-blue text-white text-[9px] flex items-center justify-center font-mono">2</span>
                  <span>Missions de la Protection Civile (Cochez les objectifs)</span>
                </span>
                <span class="text-[10px] text-pc-blue font-bold font-mono">Objectifs terrain</span>
              </label>

              <input type="hidden" id="sms-missions" value="${config.pcMissions.replace(/"/g, '&quot;')}">

              <!-- Grille des objectifs opérationnels avec cases à cocher et icônes Lucide -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5" id="sms-objectives-grid">
                ${Object.values(this.MISSION_OBJECTIVES).map(obj => {
                  const isChecked = this._currentObjectives.includes(obj.id);
                  return `
                    <button type="button" 
                      id="sms-obj-btn-${obj.id}"
                      onclick="window.ProtecSmsMobilization.toggleObjective('${mission.id}', '${obj.id}')"
                      class="sms-obj-btn p-2 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${isChecked ? 'bg-pc-blue/10 dark:bg-pc-blue/20 border-pc-blue text-pc-blue dark:text-blue-300 ring-1 ring-pc-blue/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'}">
                      <div class="mt-0.5 shrink-0">
                        <i data-lucide="${obj.icon}" class="w-4 h-4 ${isChecked ? 'text-pc-blue dark:text-blue-400' : 'text-slate-400'}"></i>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between">
                          <span class="text-[11px] font-bold leading-tight">${obj.label}</span>
                          <i data-lucide="${isChecked ? 'check-circle-2' : 'circle'}" class="check-indicator w-3.5 h-3.5 shrink-0 ml-1 ${isChecked ? 'text-pc-blue dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}"></i>
                        </div>
                        <p class="text-[9px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">${obj.text}</p>
                      </div>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- 3. QUOI FAIRE EN TANT QUE BÉNÉVOLE ? (CONSIGNE CLÉ D'AUTONOMIE) -->
            ${renfortMode ? `
              <div class="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-700/50 text-[11px] text-indigo-900 dark:text-indigo-200">
                <strong>Consignes d'acheminement :</strong> elles seront données par le directeur de la gestion de crise lorsqu'il acceptera votre renfort. Vos bénévoles indiquent seulement leur disponibilité et attendent ses ordres.
              </div>
            ` : ''}
            <div class="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 ${renfortMode ? 'hidden' : ''}">
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
                    <i data-lucide="${c.icon}" class="w-4 h-4 mt-0.5 shrink-0 ${c.id === 'base_immediat' ? 'text-rose-500' : c.id === 'base_horaire' ? 'text-indigo-500' : c.id === 'sur_place_immediat' ? 'text-emerald-500' : c.id === 'sur_place_horaire' ? 'text-teal-500' : c.id === 'attente_domicile' ? 'text-blue-500' : c.id === 'attente_appel' ? 'text-amber-500' : 'text-slate-500'}"></i>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-black text-slate-900 dark:text-white">${c.label}</span>
                      </div>
                      <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">${c.smsText}</p>
                    </div>
                  </label>
                `).join('')}
              </div>

              <!-- Sélecteur d'heure si consigne RDV horaire (base ou sur place) -->
              <div id="sms-rdv-box" class="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2 ${(config.consigne === 'base_horaire' || config.consigne === 'sur_place_horaire') ? '' : 'hidden'}">
                <div class="flex items-center justify-between gap-3">
                  <span id="sms-rdv-label" class="text-xs font-bold text-slate-700 dark:text-slate-300">${config.consigne === 'sur_place_horaire' ? 'Heure précise du RDV sur place :' : 'Heure précise du RDV à la base :'}</span>
                  <input type="text" id="sms-rdv-time" value="${config.rdvTime}" oninput="window.ProtecSmsMobilization.updateSmsPreview('${mission.id}')" placeholder="Ex: 18h30" class="w-24 px-2.5 py-1 text-center font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[9px] text-slate-400 font-bold">Raccourcis :</span>
                  <button type="button" onclick="window.ProtecSmsMobilization.setRdvPreset('${mission.id}', 30)" class="px-2 py-0.5 rounded text-[9px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100">Dans 30 min</button>
                  <button type="button" onclick="window.ProtecSmsMobilization.setRdvPreset('${mission.id}', 60)" class="px-2 py-0.5 rounded text-[9px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100">Dans 1h</button>
                  <button type="button" onclick="window.ProtecSmsMobilization.setRdvPreset('${mission.id}', 120)" class="px-2 py-0.5 rounded text-[9px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100">Dans 2h</button>
                  <button type="button" onclick="window.ProtecSmsMobilization.setRdvPreset('${mission.id}', null, '19h00')" class="px-2 py-0.5 rounded text-[9px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100">19h00</button>
                  <button type="button" onclick="window.ProtecSmsMobilization.setRdvPreset('${mission.id}', null, '07h00')" class="px-2 py-0.5 rounded text-[9px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100">07h00</button>
                </div>
              </div>
            </div>

            <!-- 3bis. DÉLAI MAXIMUM DE DÉPART (TRAJET DOMICILE ➔ BASE) -->
            <div class="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <label class="block text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <span class="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-mono">⏱️</span>
                  <span>Délai maximum de départ (Trajet Domicile ➔ Base)</span>
                </span>
                <span class="text-[10px] text-amber-600 dark:text-amber-400 font-bold font-mono">Contrôle de trajet</span>
              </label>

              <div class="flex items-center justify-between gap-3">
                <span class="text-xs text-slate-600 dark:text-slate-300">Temps max pour rallier la base :</span>
                <div class="flex items-center gap-1.5">
                  <input type="number" id="sms-max-delay" min="0" max="180" step="5" value="${config.maxDepartureDelayMinutes || 0}" oninput="window.ProtecSmsMobilization.updateSmsPreview('${mission.id}')" class="w-20 px-2.5 py-1 text-center font-black text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  <span class="text-xs font-bold text-slate-500">min</span>
                </div>
              </div>

              <!-- Raccourcis délai max -->
              <div class="flex items-center gap-1.5 flex-wrap pt-1">
                <span class="text-[9px] text-slate-400 font-bold">Raccourcis :</span>
                <button type="button" onclick="window.ProtecSmsMobilization.setMaxDelayPreset('${mission.id}', 10)" class="px-2 py-0.5 rounded text-[9px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100">10 min</button>
                <button type="button" onclick="window.ProtecSmsMobilization.setMaxDelayPreset('${mission.id}', 15)" class="px-2 py-0.5 rounded text-[9px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100">15 min</button>
                <button type="button" onclick="window.ProtecSmsMobilization.setMaxDelayPreset('${mission.id}', 20)" class="px-2 py-0.5 rounded text-[9px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100">20 min</button>
                <button type="button" onclick="window.ProtecSmsMobilization.setMaxDelayPreset('${mission.id}', 30)" class="px-2 py-0.5 rounded text-[9px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100">30 min</button>
                <button type="button" onclick="window.ProtecSmsMobilization.setMaxDelayPreset('${mission.id}', 45)" class="px-2 py-0.5 rounded text-[9px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100">45 min</button>
                <button type="button" onclick="window.ProtecSmsMobilization.setMaxDelayPreset('${mission.id}', 0)" class="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-500 cursor-pointer hover:bg-slate-300">Illimité (0)</button>
              </div>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                ℹ️ Avant de répondre disponible, chaque bénévole vérifie si son trajet domicile ➔ base respecte ce délai. Modifiable à tout moment selon l'évolution de la situation.
              </p>
            </div>

            <!-- 4. COMPÉTENCES & EFFECTIFS REQUIS -->
            ${isCrisisSms ? `
              <div class="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <label class="block text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span class="flex items-center gap-1.5">
                    <span class="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-mono">🎯</span>
                    <span>Compétences requises</span>
                  </span>
                  <span class="text-[10px] text-rose-600 dark:text-rose-400 font-bold">⭐ Demandé · 🔒 Verrouillé</span>
                </label>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  <strong>Demandé</strong> : ces profils sont sollicités en priorité, d'autres peuvent compléter. <strong>Verrouillé</strong> : les places sont réservées à ce profil ; les autres bénévoles reçoivent le SMS mais ne peuvent pas les prendre.
                </p>
                <div id="sms-quota-editor" class="space-y-2">${this.renderQuotaEditorHTML(mission.id)}</div>
              </div>
            ` : ''}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1.5 ${isCrisisSms ? 'hidden' : ''}">
                <label class="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span class="w-4 h-4 rounded-full bg-pc-blue text-white text-[9px] flex items-center justify-center font-mono">4</span>
                  <span>Profil prioritaire</span>
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
                <div class="flex items-center gap-1.5">
                  <button type="button" onclick="window.ProtecSmsMobilization.adjustTargetCount('${mission.id}', -1)" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-black text-sm flex items-center justify-center cursor-pointer">-</button>
                  <input type="number" id="sms-target-count" min="1" max="40" value="${config.targetCount}" oninput="window.ProtecSmsMobilization.updateSmsPreview('${mission.id}')" class="w-16 px-2 py-1.5 text-center font-black text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  <button type="button" onclick="window.ProtecSmsMobilization.adjustTargetCount('${mission.id}', 1)" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-black text-sm flex items-center justify-center cursor-pointer">+</button>
                  <div class="flex items-center gap-1 ml-1">
                    <button type="button" onclick="window.ProtecSmsMobilization.setTargetCount('${mission.id}', 2)" class="px-1.5 py-1 rounded text-[9px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer">2</button>
                    <button type="button" onclick="window.ProtecSmsMobilization.setTargetCount('${mission.id}', 4)" class="px-1.5 py-1 rounded text-[9px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer">4</button>
                    <button type="button" onclick="window.ProtecSmsMobilization.setTargetCount('${mission.id}', 6)" class="px-1.5 py-1 rounded text-[9px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer">6</button>
                    <button type="button" onclick="window.ProtecSmsMobilization.setTargetCount('${mission.id}', 8)" class="px-1.5 py-1 rounded text-[9px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer">8</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 5. DESTINATAIRES DU SMS (SI ÉVOLUTION DE SITUATION) -->
            ${isUpdate ? `
              <div class="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 space-y-2">
                <label class="block text-xs font-black uppercase text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <i data-lucide="target" class="w-3.5 h-3.5 text-amber-600"></i>
                  <span>Destinataires de cette mise à jour</span>
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
              <div class="flex items-center justify-between text-[10px] text-slate-400 px-2 pt-1 font-mono">
                <span>06:45</span>
                <div class="w-14 h-3 bg-black rounded-full mx-auto"></div>
                <div class="flex items-center gap-1.5 text-[9px]">
                  <span>5G</span>
                  <i data-lucide="wifi" class="w-2.5 h-2.5"></i>
                  <i data-lucide="battery-charging" class="w-3 h-3 text-emerald-400"></i>
                </div>
              </div>

              <!-- En-tête conversation -->
              <div class="text-center border-b border-slate-800 pb-2">
                <div class="w-9 h-9 rounded-full bg-pc-blue text-white flex items-center justify-center font-black text-xs mx-auto border border-white/20">
                  PC
                </div>
                <div class="font-extrabold text-xs text-white mt-1">PROTECTION CIVILE</div>
                <div class="text-[9px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Diffusion Alerte Opérationnelle</span>
                </div>
              </div>

              <!-- Bulle de message SMS reçu -->
              <div class="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-100 text-[11px] leading-relaxed space-y-1.5 shadow-md">
                <pre id="sms-preview-text" class="whitespace-pre-wrap font-sans font-medium text-[10px] leading-normal text-slate-200 select-all">${this.generateSmsBody(config)}</pre>
                <div class="text-right text-[8px] text-slate-400 mono-num pt-1 flex items-center justify-end gap-1">
                  <i data-lucide="check" class="w-2.5 h-2.5 text-slate-400"></i>
                  <span>Reçu à l'instant • SMS</span>
                </div>
              </div>

              <!-- Réponses types des bénévoles -->
              <div class="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                <span class="text-[9px] font-bold text-slate-400 block uppercase">Réponses simulées des bénévoles :</span>
                <div class="flex items-start gap-1.5 text-[9px] text-emerald-300 font-semibold">
                  <i data-lucide="check-circle-2" class="w-3 h-3 text-emerald-400 shrink-0 mt-0.5"></i>
                  <div class="min-w-0 flex-1">
                    <span class="font-bold text-emerald-400">DISPO : </span>
                    <span id="sms-preview-reply" class="italic">${(this.CONSIGNES[config.consigne] || this.CONSIGNES.attente_domicile).volunteerReply}</span>
                  </div>
                </div>
                <div class="flex items-start gap-1.5 text-[9px] text-rose-300 font-semibold">
                  <i data-lucide="x-circle" class="w-3 h-3 text-rose-400 shrink-0 mt-0.5"></i>
                  <div class="min-w-0 flex-1">
                    <span class="font-bold text-rose-400">INDISPO : </span>
                    <span class="italic">« Désolé, indisponible (Travail / Famille) »</span>
                  </div>
                </div>
              </div>

              <!-- Bas smartphone -->
              <div class="w-24 h-1 bg-white/40 rounded-full mx-auto pb-0"></div>
            </div>
          </div>
        </div>

        <!-- ACTIONS FOOTER -->
        <div class="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
          <button type="button" onclick="window.game.closeModal()" class="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer">
            Annuler
          </button>
          <button type="button" onclick="window.ProtecSmsMobilization.submitSms('${mission.id}', ${isUpdate}, ${renfortMode})" class="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-pc-blue to-pc-blue-light hover:brightness-110 text-white shadow-lg shadow-pc-blue/30 active:scale-95 transition flex items-center gap-2 cursor-pointer">
            <i data-lucide="send" class="w-4 h-4"></i>
            <span>${renfortMode ? 'Envoyer la demande de disponibilités' : (isUpdate ? 'Transmettre les Nouvelles Consignes' : (isPrealert ? 'Diffuser le Message de Préalerte' : 'Diffuser le SMS d\'Alerte'))}</span>
          </button>
        </div>

      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();
  },

  // Sélection du contexte opérationnel en 1 clic
  selectSituation(missionId, text, iconName, btnEl) {
    const hiddenWhat = document.getElementById('sms-what');
    const whatText = document.getElementById('sms-what-text');
    const whatIcon = document.getElementById('sms-what-icon');
    if (hiddenWhat) hiddenWhat.value = text;
    if (whatText) whatText.textContent = text;
    if (whatIcon && iconName) whatIcon.setAttribute('data-lucide', iconName);

    // Mettre à jour l'apparence des boutons de situation
    const container = document.getElementById('sms-situation-buttons');
    if (container) {
      container.querySelectorAll('.sms-sit-btn').forEach(btn => {
        btn.className = 'sms-sit-btn px-2.5 py-1.5 rounded-xl border text-[11px] font-bold text-left flex items-center gap-1.5 transition cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-pc-blue/50';
      });
    }
    if (btnEl) {
      btnEl.className = 'sms-sit-btn px-2.5 py-1.5 rounded-xl border text-[11px] font-bold text-left flex items-center gap-1.5 transition cursor-pointer bg-pc-blue text-white border-pc-blue shadow-xs';
    }

    if (window.lucide) window.lucide.createIcons();
    this.updateSmsPreview(missionId);
  },

  // Toggle d'un objectif de mission terrain (choix multiple par cartes)
  toggleObjective(missionId, objKey) {
    if (!Array.isArray(this._currentObjectives)) {
      this._currentObjectives = ['pma', 'evac'];
    }
    const idx = this._currentObjectives.indexOf(objKey);
    if (idx >= 0) {
      if (this._currentObjectives.length > 1) {
        this._currentObjectives.splice(idx, 1);
      }
    } else {
      this._currentObjectives.push(objKey);
    }

    // Mettre à jour visuellement tous les boutons d'objectifs
    Object.keys(this.MISSION_OBJECTIVES).forEach(k => {
      const btn = document.getElementById(`sms-obj-btn-${k}`);
      if (!btn) return;
      const isChecked = this._currentObjectives.includes(k);
      btn.className = `sms-obj-btn p-2 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${isChecked ? 'bg-pc-blue/10 dark:bg-pc-blue/20 border-pc-blue text-pc-blue dark:text-blue-300 ring-1 ring-pc-blue/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'}`;
      
      const checkIcon = btn.querySelector('.check-indicator');
      if (checkIcon) {
        checkIcon.setAttribute('data-lucide', isChecked ? 'check-circle-2' : 'circle');
        checkIcon.className = `check-indicator w-3.5 h-3.5 shrink-0 ml-1 ${isChecked ? 'text-pc-blue dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}`;
      }
    });

    // Reconstituer le texte des missions
    const texts = this._currentObjectives.map(k => this.MISSION_OBJECTIVES[k]?.text).filter(Boolean);
    const hiddenMissions = document.getElementById('sms-missions');
    if (hiddenMissions) {
      hiddenMissions.value = texts.length > 0 ? texts.join(' • ') : 'Soutien opérationnel de la Protection Civile';
    }

    if (window.lucide) window.lucide.createIcons();
    this.updateSmsPreview(missionId);
  },

  // Réglage rapide de l'heure du RDV
  setRdvPreset(missionId, minutesFromNow, fixedHour) {
    let timeStr = '18h30';
    if (fixedHour) {
      timeStr = fixedHour;
    } else if (minutesFromNow) {
      const d = new Date();
      d.setMinutes(d.getMinutes() + minutesFromNow);
      timeStr = `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
    }
    const input = document.getElementById('sms-rdv-time');
    if (input) {
      input.value = timeStr;
      this.updateSmsPreview(missionId);
    }
  },

  // Réglage rapide du délai maximum de départ
  setMaxDelayPreset(missionId, minutes) {
    const input = document.getElementById('sms-max-delay');
    if (input) {
      input.value = minutes;
      this.updateSmsPreview(missionId);
    }
  },

  // Modification rapide du délai maximum de départ à tout moment en fonction de l'évolution de la situation
  async quickEditMaxDelay(missionId) {
    const game = window.game;
    if (!game) return;
    const mission = game.missions.find(m => m.id === missionId);
    if (!mission) return;

    const currentDelay = mission.smsConsigne?.maxDepartureDelayMinutes !== undefined
      ? mission.smsConsigne.maxDepartureDelayMinutes
      : (mission.maxDepartureDelayMinutes !== undefined ? mission.maxDepartureDelayMinutes : 20);

    let inputVal = null;
    if (window.ProtecDialog && typeof window.ProtecDialog.prompt === 'function') {
      inputVal = await window.ProtecDialog.prompt(
        "Indiquez le délai maximum en minutes (trajet domicile ➔ base) exigé pour cette mission :\n\n• Les bénévoles dont le temps de trajet dépasse ce délai seront placés en réserve éloignée.\n• Indiquez 0 pour aucun délai (temps de trajet illimité).",
        currentDelay > 0 ? String(currentDelay) : '20',
        "Délai Maximum de Départ",
        {
          category: "Ajustement Opérationnel SMS",
          icon: "clock",
          inputType: "number",
          placeholder: "Ex: 20",
          inputLabel: "Délai de trajet exigé (en minutes) :",
          confirmText: "Valider le délai",
          cancelText: "Annuler"
        }
      );
    } else {
      inputVal = prompt(
        `MODIFICATION DU DÉLAI MAXIMUM DE DÉPART (Évolution de situation) :\n\nIndiquez le délai maximum en minutes (trajet domicile ➔ base) exigé pour cette mission :\n(0 pour aucun délai / illimité)`,
        currentDelay > 0 ? String(currentDelay) : '20'
      );
    }

    if (inputVal === null) return; // Annulé

    const parsedDelay = Math.max(0, parseInt(String(inputVal).trim(), 10) || 0);

    if (!mission.smsConsigne) mission.smsConsigne = {};
    mission.smsConsigne.maxDepartureDelayMinutes = parsedDelay;
    mission.maxDepartureDelayMinutes = parsedDelay;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const delayLabel = parsedDelay > 0 ? `${parsedDelay} min max` : 'Illimité (sans contrainte)';

    if (!Array.isArray(mission.smsHistory)) mission.smsHistory = [];
    mission.smsHistory.unshift({
      time: timeStr,
      isUpdate: true,
      consigne: mission.smsConsigne.consigne || 'attente_domicile',
      consigneLabel: `Ajustement Délai Départ : ${delayLabel}`,
      targetCount: mission.smsConsigne.targetCount || 1,
      text: `[ÉVOLUTION OPÉRATIONNELLE]\nDélai maximum de départ (trajet domicile ➔ base) réajusté à : ${delayLabel}.`
    });

    // Réévaluation des secouristes en réserve trop éloignés
    if (Array.isArray(mission.distantVolunteers) && mission.distantVolunteers.length > 0) {
      if (!Array.isArray(mission.smsResponses)) mission.smsResponses = [];
      if (!Array.isArray(mission.registeredVolunteers)) mission.registeredVolunteers = [];
      const stillDistant = [];
      let recoveredCount = 0;

      mission.distantVolunteers.forEach(d => {
        const diff = parsedDelay > 0 ? (d.rallyMinutes - parsedDelay) : 0;
        if (parsedDelay === 0 || d.rallyMinutes <= parsedDelay) {
          // Pleinement admissible désormais
          recoveredCount++;
          if (typeof game.registerVolunteerToMission === 'function') {
            game.registerVolunteerToMission(mission, d.volunteerId, true);
          } else {
            if (!mission.registeredVolunteers.includes(d.volunteerId)) {
              mission.registeredVolunteers.push(d.volunteerId);
            }
          }
          if (mission.smsConsigne?.consigne === 'base_immediat') {
            game.initVolunteerCrisisTransit(mission, d.volunteerId);
          }
          mission.smsResponses.unshift({
            volunteerId: d.volunteerId,
            volunteerName: d.volunteerName,
            rank: d.rank,
            isAvailable: true,
            rallyMinutes: d.rallyMinutes,
            message: `Suite au réajustement du délai (${delayLabel}), je suis disponible et je pars (trajet domicile : ${d.rallyMinutes} min).`,
            time: timeStr
          });
        } else if (diff <= 5) {
          // Admissible avec validation
          recoveredCount++;
          mission.smsResponses.unshift({
            volunteerId: d.volunteerId,
            volunteerName: d.volunteerName,
            rank: d.rank,
            isAvailable: false,
            canOverrideDelay: true,
            delayOverrunMinutes: diff,
            rallyMinutes: d.rallyMinutes,
            maxDelay: parsedDelay,
            message: `Suite à l'ajustement du délai : domicile à ${d.rallyMinutes} min (+${diff} min / max ${parsedDelay} min). Disponible si vous validez.`,
            time: timeStr
          });
        } else {
          stillDistant.push(d);
        }
      });

      mission.distantVolunteers = stillDistant;
      if (recoveredCount > 0) {
        game.showToast(
          'Effectifs Réévalués',
          `${recoveredCount} secouriste(s) en réserve deviennent mobilisables avec ce nouveau délai !`,
          'green'
        );
      }
    }

    game.showToast(
      'Délai de Départ Modifié',
      `Le délai maximum a été ajusté à ${delayLabel} en direct.`,
      'blue'
    );

    game.saveGame();
    game.renderMissions();
    game.updateStatsUI();
    if (game.selectedMissionId === mission.id) {
      if (typeof game.refreshMissionDetailsIfOpen === 'function') {
        game.refreshMissionDetailsIfOpen(mission.id);
      } else {
        game.openMissionDetails(mission.id);
      }
    }
  },

  // Déclencher un secouriste quand même malgré un léger dépassement du délai max (<= 5 min)
  overrideDelayAndMobilize(game, missionId, volunteerId) {
    if (!game) game = window.game;
    if (!game) return;
    const mission = game.missions.find(m => m.id === missionId);
    if (!mission) return;

    const vol = (game.volunteers || []).find(v => v.id === volunteerId);
    if (!vol) return;

    if (typeof game.registerVolunteerToMission === 'function') {
      game.registerVolunteerToMission(mission, vol.id, true);
    } else {
      if (!Array.isArray(mission.registeredVolunteers)) mission.registeredVolunteers = [];
      if (!mission.registeredVolunteers.includes(vol.id)) {
        mission.registeredVolunteers.push(vol.id);
      }
    }

    // Rattachement à une compétence requise si le profil correspond
    const quotasOv = this.getMissionQuotas(mission);
    if (quotasOv.length) {
      const k = this.findQuotaSlot(mission, quotasOv, vol);
      if (k) { const f = this.getQuotaFill(mission, quotasOv); if (!f[k].includes(vol.id)) f[k].push(vol.id); }
    }

    // Mettre à jour la réponse SMS dans la liste
    if (Array.isArray(mission.smsResponses)) {
      const resp = mission.smsResponses.find(r => r.volunteerId === vol.id);
      if (resp) {
        resp.isAvailable = true;
        resp.overridden = true;
        resp.canOverrideDelay = false;
        resp.message = `Déclenché(e) quand même par le gestionnaire (domicile à ${resp.rallyMinutes || '?'} min de la base). En route !`;
      }
    }

    // Si la consigne est "base_immediat", lancer le ralliement domicile -> base
    const consigneKey = mission.smsConsigne?.consigne || 'base_immediat';
    if (consigneKey === 'base_immediat') {
      const transit = game.initVolunteerCrisisTransit(mission, vol.id);
      const minutes = transit?.rallyMinutes || 20;
      game.showToast(
        'Secouriste Déclenché d\'office',
        `${vol.name} (${vol.rank}) part immédiatement vers la base (trajet estimé : ${minutes} min).`,
        'green'
      );
    } else {
      game.showToast(
        'Secouriste Déclenché d\'office',
        `${vol.name} (${vol.rank}) a été ajouté(e) aux effectifs mobilisés pour la mission.`,
        'green'
      );
    }

    setTimeout(() => {
      game.checkEnginProgressNotification?.(mission);
    }, 900);

    game.saveGame();
    game.renderMissions();
    game.updateStatsUI();
    if (game.selectedMissionId === mission.id) {
      if (typeof game.refreshMissionDetailsIfOpen === 'function') {
        game.refreshMissionDetailsIfOpen(mission.id);
      } else {
        game.openMissionDetails(mission.id);
      }
    }
  },

  // Ajustement rapide de l'effectif cible
  setTargetCount(missionId, count) {
    const input = document.getElementById('sms-target-count');
    if (input) {
      input.value = count;
      this.updateSmsPreview(missionId);
    }
  },

  adjustTargetCount(missionId, delta) {
    const input = document.getElementById('sms-target-count');
    if (!input) return;
    let val = parseInt(input.value || '1', 10) + delta;
    val = Math.max(1, Math.min(40, val));
    input.value = val;
    this.updateSmsPreview(missionId);
  },

  // Changement de la consigne (affiche ou masque l'heure du RDV)
  onConsigneChanged(missionId, consigneId) {
    const rdvBox = document.getElementById('sms-rdv-box');
    const rdvLabel = document.getElementById('sms-rdv-label');
    if (rdvBox) {
      if (consigneId === 'base_horaire' || consigneId === 'sur_place_horaire') {
        rdvBox.classList.remove('hidden');
        if (rdvLabel) {
          rdvLabel.textContent = consigneId === 'sur_place_horaire' ? 'Heure précise du RDV sur place :' : 'Heure précise du RDV à la base :';
        }
      } else {
        rdvBox.classList.add('hidden');
      }
    }
    if (window.lucide) window.lucide.createIcons();
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
    const maxDelay = parseInt(document.getElementById('sms-max-delay')?.value || '0', 10);

    const config = {
      whatHappened: what,
      pcMissions: missions,
      consigne: consigne,
      rdvTime: rdvTime,
      requiredSkill: skill,
      targetCount: count,
      maxDepartureDelayMinutes: maxDelay,
      skillQuotas: this._currentQuotas || []
    };

    const warnEl = document.getElementById('sms-quota-warning');
    if (warnEl) warnEl.innerHTML = this.renderQuotaWarningHTML();

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
  submitSms(missionId, isUpdate = false, renfortMode = false) {
    const game = window.game;
    if (!game) return;
    const mission = (game.missions || []).find(m => m.id === missionId) || (game.activeCrises || []).find(c => c.id === missionId);
    if (!mission) return;

    const what = document.getElementById('sms-what')?.value || mission.title;
    const missions = document.getElementById('sms-missions')?.value || 'Secours à personnes et logistique';
    const consigne = document.querySelector('input[name="sms-consigne"]:checked')?.value || 'attente_domicile';
    const rdvTime = document.getElementById('sms-rdv-time')?.value || '18h30';
    const skill = document.getElementById('sms-skill')?.value || 'tous';
    const targetCount = parseInt(document.getElementById('sms-target-count')?.value || '4', 10);
    const recipientMode = document.querySelector('input[name="sms-recipients"]:checked')?.value || 'all_available';
    const maxDepartureDelayMinutes = parseInt(document.getElementById('sms-max-delay')?.value || '0', 10);

    const config = {
      whatHappened: what,
      pcMissions: missions,
      selectedObjectives: this._currentObjectives ? [...this._currentObjectives] : ['pma', 'evac'],
      consigne: consigne,
      rdvTime: rdvTime,
      requiredSkill: skill,
      targetCount: targetCount,
      recipientMode: recipientMode,
      maxDepartureDelayMinutes: maxDepartureDelayMinutes,
      skillQuotas: (renfortMode || this.isCrisisMission(mission)) ? (this._currentQuotas || []).filter(q => q.count > 0).map(q => ({ ...q })) : []
    };
    if (config.skillQuotas.length) config.requiredSkill = 'tous';

    // Fermer la modale
    game.closeModal();

    if (renfortMode) {
      config.consigne = 'attente_consignes';
      this.launchRenfortDispatch(game, mission, config);
      return;
    }

    // Enregistrer la consigne active sur la mission
    mission.smsConsigne = config;
    mission.maxDepartureDelayMinutes = maxDepartureDelayMinutes;

    if (mission.status === 'prealerte') {
      mission.prealertDecisionMode = 'premobilisation';
      mission.preMobilisationActive = true;
    }

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
      skillQuotas: config.skillQuotas,
      text: fullSmsBody
    });
    this.syncQuotaFillFromRegistered(game, mission);

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
        game.showToast('Ordre d\'Évolution Transmis', `${transitionedCount} secouriste(s) font mouvement immédiatement vers la base d'antenne !`, 'green');
      } else {
        game.showToast('Consigne Mise à Jour', `Consigne « ${this.CONSIGNES[consigne]?.shortLabel} » transmise aux secouristes inscrits.`, 'blue');
      }

      if (recipientMode === 'registered_only') {
        game.saveGame();
        game.renderMissions();
        game.updateStatsUI();
        if (game.selectedMissionId === mission.id) {
          if (typeof game.refreshMissionDetailsIfOpen === 'function') {
            game.refreshMissionDetailsIfOpen(mission.id);
          } else {
            game.openMissionDetails(mission.id);
          }
        }
        return;
      }
    }

    // 2. Diffusion aux secouristes disponibles non encore engagés
    this.launchSmsDispatch(game, mission, config);
  },

  // Diffusion SMS d'une antenne de RENFORT : les réponses servent à constituer la proposition au directeur
  launchRenfortDispatch(game, mission, config) {
    if (!game.crisisRenfortSmsDispos) game.crisisRenfortSmsDispos = {};
    const state = { sent: true, sentAt: Date.now(), config, responses: {}, text: this.generateSmsBody(config) };
    game.crisisRenfortSmsDispos[mission.id] = state;
    const pool = (game.volunteers || []).filter(v => !v.isBurnout && v.hasUniform !== false && ['dispo', 'disponible', 'base', undefined, null, ''].includes(v.status));
    if (pool.length === 0) {
      game.showToast('Aucun bénévole disponible', 'Tous vos personnels sont engagés ou indisponibles.', 'orange');
      if (window.ProtecCriseMoyens) window.ProtecCriseMoyens.openRenfortOffer(mission.id);
      return;
    }
    const quotas = (config.skillQuotas || []).filter(q => q && q.count > 0);
    const target = Math.max(1, parseInt(config.targetCount, 10) || 1);
    const fillOf = () => {
      const f = {};
      quotas.forEach(q => { f[q.key] = 0; });
      Object.values(state.responses).forEach(r => { if (r.status === 'available' && r.quotaKey) f[r.quotaKey] = (f[r.quotaKey] || 0) + 1; });
      return f;
    };
    const boost = (v) => quotas.reduce((b, q) => (this.volunteerHasQuotaSkill(v, q.key) ? Math.max(b, q.mode === 'verrouille' ? 60 : 40) : b), 0);
    const sorted = [...pool].sort((a, b) => ((b.motivation || 70) + (b.energy || 70) * 0.4 + boost(b) + Math.random() * 15) - ((a.motivation || 70) + (a.energy || 70) * 0.4 + boost(a) + Math.random() * 15));
    game.showToast('📱 Demande de disponibilités envoyée', `SMS de renfort envoyé à ${pool.length} secouriste(s). Les réponses arrivent…`, 'blue');
    if (window.ProtecAudio && typeof window.ProtecAudio.playRadioBeep === 'function') window.ProtecAudio.playRadioBeep();
    if (window.ProtecCriseMoyens) window.ProtecCriseMoyens.openRenfortOffer(mission.id);

    let delay = 0;
    sorted.forEach((vol, idx) => {
      const stepMs = Math.round((2800 + Math.random() * 3800) * Math.max(0.5, 1.3 - ((vol.motivation || 70) / 100)));
      delay = idx === 0 ? Math.round(15000 + Math.random() * 2500) : delay + stepMs;
      setTimeout(() => {
        const live = game.crisisRenfortSmsDispos && game.crisisRenfortSmsDispos[mission.id];
        if (live !== state) return; // un nouveau SMS a remplacé celui-ci
        const evalResult = game.evaluateVolunteerAvailability(vol, mission.eventDate || { dayName: 'Samedi' }, mission);
        if (window.ProtecPersonnel && typeof window.ProtecPersonnel.ensureVolunteerResidence === 'function') window.ProtecPersonnel.ensureVolunteerResidence(vol, game);
        const rally = vol.temps_ralliement_minutes !== undefined ? vol.temps_ralliement_minutes : (vol.temps_trajet_base_minutes !== undefined ? vol.temps_trajet_base_minutes : 12);
        const maxDelay = parseInt(config.maxDepartureDelayMinutes, 10) || 0;
        const delayOk = maxDelay <= 0 || rally <= maxDelay;
        const availCount = Object.values(state.responses).filter(r => r.status === 'available').length;
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        let resp;
        if (!evalResult.isAvailable || !delayOk) {
          resp = { status: 'unavailable', reason: !delayOk ? `Trajet ${rally} min > ${maxDelay} min` : (evalResult.rejectReason || 'Contrainte personnelle'), time };
        } else if (availCount >= target) {
          resp = { status: 'unavailable', reason: 'Effectif recherché déjà atteint', time };
        } else {
          const fill = fillOf();
          const ordered = [...quotas].sort((a, b) => (a.mode === 'verrouille' ? 0 : 1) - (b.mode === 'verrouille' ? 0 : 1));
          const slot = ordered.find(q => (fill[q.key] || 0) < q.count && this.volunteerHasQuotaSkill(vol, q.key));
          const reserved = quotas.filter(q => q.mode === 'verrouille').reduce((a, q) => a + Math.max(0, q.count - (fill[q.key] || 0)), 0);
          if (!slot && reserved > 0 && availCount + reserved >= target) {
            resp = { status: 'profile', reason: 'Places restantes réservées aux profils verrouillés', time };
          } else {
            resp = { status: 'available', quotaKey: slot ? slot.key : null, time, message: 'Disponible pour le renfort, j\'attends les ordres du directeur.' };
          }
        }
        state.responses[vol.id] = resp;
        if (resp.status === 'available') game.showToast('📱 SMS reçu : DISPO', `${vol.name} (${vol.rank || 'Secouriste'}) : « Disponible pour le renfort ! »`, 'green');
        if (window.ProtecCriseMoyens) window.ProtecCriseMoyens.refreshRenfortOffer(mission.id);
      }, delay);
    });
  },

  // Diffusion aux bénévoles avec simulation réaliste et autonomie selon la consigne
  launchSmsDispatch(game, mission, config) {
    const unassignedVols = game.volunteers.filter(v => 
      !mission.registeredVolunteers.includes(v.id) &&
      v.status !== 'mission' &&
      !v.isBurnout &&
      v.hasUniform !== false
    );

    if (unassignedVols.length === 0) {
      game.showToast('Effectif Maximum Atteint', 'Tous vos personnels disponibles ont déjà été mobilisés.', 'orange');
      game.saveGame();
      if (game.selectedMissionId === mission.id) {
        if (typeof game.refreshMissionDetailsIfOpen === 'function') {
          game.refreshMissionDetailsIfOpen(mission.id);
        } else {
          game.openMissionDetails(mission.id);
        }
      }
      return;
    }

    mission.smsCampaignActive = true;
    mission.relancesCount = (mission.relancesCount || 0) + 1;
    mission.distantVolunteers = [];

    const consigneObj = this.CONSIGNES[config.consigne] || this.CONSIGNES.attente_domicile;
    game.showToast('Diffusion SMS Lancée', `Message envoyé à ${unassignedVols.length} secouriste(s) [Consigne : ${consigneObj.shortLabel}].`, 'blue');

    let pendingResponses = unassignedVols.length;

    // Compétences requises du SMS de crise
    const quotas = this.isCrisisMission(mission) ? ((config.skillQuotas || []).filter(q => q && q.count > 0)) : [];
    if (quotas.length) this.syncQuotaFillFromRegistered(game, mission);
    const quotaBoost = (v) => {
      if (!quotas.length) return 0;
      const fill = this.getQuotaFill(mission, quotas);
      let b = 0;
      quotas.forEach(q => {
        if ((fill[q.key] || []).length < q.count && this.volunteerHasQuotaSkill(v, q.key)) b = Math.max(b, q.mode === 'verrouille' ? 60 : 40);
      });
      return b;
    };

    // Priorisation selon la compétence demandée
    const sortedVols = [...unassignedVols].sort((a, b) => {
      let boostA = quotaBoost(a);
      let boostB = quotaBoost(b);
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
        // Règle opérationnelle : Délai incompressible de 15 sec avant les premiers retours de message lors des alertes
        cumulativeDelayMs = Math.round(15000 + Math.random() * 2500);
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

        // 1. S'assurer que le secouriste a ses données de résidence et temps de ralliement
        if (window.ProtecPersonnel && typeof window.ProtecPersonnel.ensureVolunteerResidence === 'function') {
          window.ProtecPersonnel.ensureVolunteerResidence(vol, game);
        }

        // 2. Calcul du trajet entre le domicile et la Base avant de répondre disponible
        const isOnBase = Boolean(vol.onBase || vol.status === 'sdis_caserne' || vol.status === 'poste');
        const rallyMinutes = isOnBase ? 0 : (vol.temps_ralliement_minutes !== undefined ? vol.temps_ralliement_minutes : (vol.temps_trajet_base_minutes !== undefined ? vol.temps_trajet_base_minutes : 12));

        const maxDelay = config.maxDepartureDelayMinutes !== undefined ? parseInt(config.maxDepartureDelayMinutes, 10) : 0;
        const delayRespected = (maxDelay <= 0) || (rallyMinutes <= maxDelay);

        const isFull = (currentMission.registeredVolunteers || []).length >= (currentMission.requiredVolunteers || 1);

        // Compétences verrouillées : places réservées aux profils requis
        let quotaSlot = null;
        let profileRejected = false;
        if (quotas.length && !isFull && evalResult.isAvailable && delayRespected) {
          quotaSlot = this.findQuotaSlot(currentMission, quotas, vol);
          if (!quotaSlot) {
            const reserved = this.getReservedRemaining(currentMission, quotas);
            const regCount = (currentMission.registeredVolunteers || []).length;
            const cap = Math.max(currentMission.requiredVolunteers || 1, parseInt(config.targetCount, 10) || 0);
            if (reserved > 0 && regCount + reserved >= cap) profileRejected = true;
          }
        }
        const willAccept = !isFull && evalResult.isAvailable && delayRespected && !profileRejected;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (!Array.isArray(currentMission.smsResponses)) currentMission.smsResponses = [];

        if (willAccept) {
          if (typeof game.registerVolunteerToMission === 'function') {
            game.registerVolunteerToMission(currentMission, vol.id, true);
          } else {
            if (!currentMission.registeredVolunteers.includes(vol.id)) {
              currentMission.registeredVolunteers.push(vol.id);
            }
          }
          if (quotaSlot && (currentMission.registeredVolunteers || []).includes(vol.id)) {
            const fillNow = this.getQuotaFill(currentMission, quotas);
            if (!fillNow[quotaSlot].includes(vol.id)) fillNow[quotaSlot].push(vol.id);
          }

          let replyMsg = consigneObj.volunteerReply;
          let transitLaunched = false;

          // AUTONOMIE DU BÉNÉVOLE SELON LA CONSIGNE
          if (config.consigne === 'base_immediat') {
            const transit = game.initVolunteerCrisisTransit(currentMission, vol.id);
            transitLaunched = true;
            if (maxDelay > 0) {
              replyMsg = `Présent(e) ! Trajet domicile ➔ base estimé à ${rallyMinutes} min (délai respecté ≤ ${maxDelay} min). Je quitte mon domicile immédiatement.`;
            } else {
              replyMsg = `Présent(e) ! Je pars immédiatement de chez moi vers la base (trajet ~${transit?.rallyMinutes || rallyMinutes} min).`;
            }
          } else if (config.consigne === 'base_horaire') {
            if (maxDelay > 0) {
              replyMsg = `Présent(e) ! Trajet base à ${rallyMinutes} min (conforme au délai max de ${maxDelay} min). RDV bien noté à ${config.rdvTime}.`;
            } else {
              replyMsg = `Présent(e) ! Bien noté pour le rendez-vous à la base à ${config.rdvTime}. Je serai là.`;
            }
          } else if (config.consigne === 'attente_domicile') {
            replyMsg = maxDelay > 0
              ? `Présent(e) ! En veille réflexe chez moi (trajet base à ${rallyMinutes} min, délai ≤ ${maxDelay} min OK). Téléphone à portée.`
              : `Présent(e) ! Je reste chez moi en veille réflexe, téléphone à portée.`;
          } else if (config.consigne === 'attente_appel') {
            replyMsg = maxDelay > 0
              ? `Disponible ! J'attends l'appel de l'astreinte (trajet base : ${rallyMinutes} min ≤ ${maxDelay} min).`
              : `Disponible ! J'attends l'appel direct de l'astreinte si retenu(e).`;
          }

          currentMission.smsResponses.unshift({
            volunteerId: vol.id,
            volunteerName: vol.name,
            rank: vol.rank || 'Secouriste',
            isAvailable: true,
            rallyMinutes: rallyMinutes,
            consigne: config.consigne,
            message: replyMsg,
            time: timeStr
          });

          if (transitLaunched) {
            game.showToast('SMS : Dispo & En Route', `${vol.name} : « ${replyMsg} »`, 'green');
          } else {
            game.showToast('SMS Reçu : Dispo', `${vol.name} (${vol.rank}) : « ${replyMsg} »`, 'green');
          }

          setTimeout(() => {
            game.checkEnginProgressNotification(currentMission);
          }, 900);
        } else if (profileRejected) {
          // Disponible mais sans la compétence des places verrouillées restantes
          const missing = quotas.filter(q => q.mode === 'verrouille' && (this.getQuotaFill(currentMission, quotas)[q.key] || []).length < q.count)
            .map(q => this.getQuotaDef(q.key).short).join(', ');
          currentMission.smsResponses.unshift({
            volunteerId: vol.id,
            volunteerName: vol.name,
            rank: vol.rank || 'Secouriste',
            isAvailable: false,
            profileMismatch: true,
            rallyMinutes: rallyMinutes,
            message: `Disponible, mais je n'ai pas le profil requis : places restantes réservées (${missing}). Je reste joignable si besoin.`,
            time: timeStr
          });
          game.showToast('SMS : Profil non requis', `${vol.name} (${vol.rank || 'Secouriste'}) est dispo mais n'a pas la compétence verrouillée (${missing}).`, 'slate');
        } else if (!isFull) {
          // Si le bénévole est disponible mais que son trajet dépasse le délai maximum imposé
          if (evalResult.isAvailable && !delayRespected) {
            const diffMinutes = Math.max(1, rallyMinutes - maxDelay);

            if (diffMinutes <= 5) {
              // Dépassement léger (<= 5 min) : le bénévole prévient qu'il est à X min et le gestionnaire peut déclencher quand même
              const overrunMsg = `Domicile à ${rallyMinutes} min de la base (+${diffMinutes} min par rapport au délai max de ${maxDelay} min). Disponible si vous validez.`;
              currentMission.smsResponses.unshift({
                volunteerId: vol.id,
                volunteerName: vol.name,
                rank: vol.rank || 'Secouriste',
                isAvailable: false,
                canOverrideDelay: true,
                delayOverrunMinutes: diffMinutes,
                rallyMinutes: rallyMinutes,
                maxDelay: maxDelay,
                message: overrunMsg,
                time: timeStr
              });
              game.showToast(
                `SMS : Délai Limite (+${diffMinutes} min)`,
                `${vol.name} prévient qu'il est à ${rallyMinutes} min de la base (délai max : ${maxDelay} min).`,
                'orange'
              );
            } else {
              // Dépassement > 5 min : n'envoie même pas de message pour ne pas encombrer, garde l'info en cas d'évolution
              if (!Array.isArray(currentMission.distantVolunteers)) {
                currentMission.distantVolunteers = [];
              }
              const existingIdx = currentMission.distantVolunteers.findIndex(d => d.volunteerId === vol.id);
              const distantInfo = {
                volunteerId: vol.id,
                volunteerName: vol.name,
                rank: vol.rank || 'Secouriste',
                rallyMinutes: rallyMinutes,
                diffMinutes: diffMinutes,
                maxDelay: maxDelay,
                time: timeStr
              };
              if (existingIdx >= 0) {
                currentMission.distantVolunteers[existingIdx] = distantInfo;
              } else {
                currentMission.distantVolunteers.push(distantInfo);
              }
            }
          } else if (Math.random() < 0.75) {
            currentMission.smsResponses.unshift({
              volunteerId: vol.id,
              volunteerName: vol.name,
              rank: vol.rank || 'Secouriste',
              isAvailable: false,
              rallyMinutes: rallyMinutes,
              message: `Désolé, indisponible (${evalResult.rejectReason || 'Contrainte personnelle'})`,
              time: timeStr
            });
            game.showToast('SMS Reçu : Indisponible', `${vol.name} : « Désolé, impossible (${evalResult.rejectReason || 'Contrainte'}) »`, 'slate');
          }
        }

        game.saveGame();
        game.renderMissions();
        game.updateStatsUI();

        if (game.selectedMissionId === currentMission.id) {
          if (typeof game.refreshMissionDetailsIfOpen === 'function') {
            game.refreshMissionDetailsIfOpen(currentMission.id);
          } else {
            game.openMissionDetails(currentMission.id);
          }
        }
      }, assignedDelayMs);
    });

    game.saveGame();
    game.renderMissions();
    game.updateStatsUI();
    if (game.selectedMissionId === mission.id) {
      if (typeof game.refreshMissionDetailsIfOpen === 'function') {
        game.refreshMissionDetailsIfOpen(mission.id);
      } else {
        game.openMissionDetails(mission.id);
      }
    }
  },

  // Rendu HTML de la section SMS dans l'onglet Personnel
  renderSmsSectionHTML(game, mission) {
    if (!mission) return '';
    const consigne = mission.smsConsigne || {};
    const consigneDef = this.CONSIGNES[consigne.consigne] || null;
    const history = mission.smsHistory || [];
    const hasSmsActivity = Boolean(mission.smsCampaignActive || (mission.smsResponses && mission.smsResponses.length > 0) || (mission.smsHistory && mission.smsHistory.length > 0) || mission.smsConsigne);

    const myId = game.player?.id || 'usr_local';
    const isCrisis = (mission.type === 'crise' || mission.isCrisis);
    const hasOtherManager = Boolean(isCrisis && mission.managerPlayerId && mission.managerPlayerId !== myId);

    if (!hasSmsActivity) {
      return `
        <div class="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 shadow-2xs">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-xl bg-pc-blue/10 dark:bg-pc-blue/30 text-pc-blue dark:text-blue-400 flex items-center justify-center">
              <i data-lucide="message-square" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="text-xs font-black uppercase text-slate-800 dark:text-white">Diffusion SMS & Consignes</span>
              <p class="text-[10px] text-slate-500 dark:text-slate-400">Envoyez des consignes d'autonomie et mobilisez vos effectifs par SMS.</p>
            </div>
          </div>
          ${hasOtherManager ? `
            <span class="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1 shrink-0">
              <i data-lucide="shield-check" class="w-3 h-3 text-emerald-600"></i>
              <span>Direction : ${mission.managerPlayerName || 'Directeur'}</span>
            </span>
          ` : `
            <button type="button" onclick="window.ProtecSmsMobilization.openSmsModal(window.game, '${mission.id}', false)" class="px-3 py-1.5 rounded-xl text-xs font-black bg-pc-blue hover:bg-pc-blue-light text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0">
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
              <span>Rédiger & Diffuser SMS</span>
            </button>
          `}
        </div>
      `;
    }

    return `
      <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs space-y-3 shadow-2xs">
        
        <!-- EN-TÊTE DE LA SECTION SMS -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-pc-blue/10 dark:bg-pc-blue/30 text-pc-blue dark:text-blue-400 flex items-center justify-center">
              <i data-lucide="message-square" class="w-4 h-4"></i>
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
            ${hasOtherManager ? `
              <span class="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1 shrink-0">
                <i data-lucide="shield-check" class="w-3 h-3 text-emerald-600"></i>
                <span>Direction : ${mission.managerPlayerName || 'Directeur'}</span>
              </span>
            ` : `
              <button type="button" onclick="window.ProtecSmsMobilization.openSmsModal(window.game, '${mission.id}', ${Boolean(mission.smsConsigne)})" class="px-3 py-1.5 rounded-xl text-xs font-black bg-pc-blue hover:bg-pc-blue-light text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs">
                <i data-lucide="send" class="w-3.5 h-3.5"></i>
                <span>${mission.smsConsigne ? 'Nouveau SMS / Évolution' : 'Rédiger & Diffuser SMS'}</span>
              </button>
            `}
          </div>
        </div>

        <!-- BADGE DE LA CONSIGNE ACTIVE ET DÉLAI MAXIMUM -->
        ${consigneDef ? `
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Consigne active :</span>
              <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black ${consigneDef.badgeClass}">
                ${consigneDef.label}
              </span>
              ${consigne.consigne === 'base_horaire' && consigne.rdvTime ? `
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                  RDV : ${consigne.rdvTime}
                </span>
              ` : ''}

              <!-- Badge du délai maximum de départ -->
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${consigne.maxDepartureDelayMinutes > 0 ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'} flex items-center gap-1">
                <i data-lucide="clock" class="w-3 h-3 text-amber-600"></i>
                <span>Délai départ : ${consigne.maxDepartureDelayMinutes > 0 ? `${consigne.maxDepartureDelayMinutes} min max` : 'Illimité'}</span>
              </span>

              ${!hasOtherManager ? `
                <button type="button" onclick="window.ProtecSmsMobilization.quickEditMaxDelay('${mission.id}')" title="Ajuster le délai max de départ en fonction de l'évolution" class="px-2 py-0.5 rounded text-[9px] font-bold bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-600 hover:bg-amber-50 cursor-pointer flex items-center gap-1">
                  <i data-lucide="sliders-horizontal" class="w-2.5 h-2.5"></i>
                  <span>Ajuster délai</span>
                </button>
              ` : ''}
            </div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400 italic">
              « ${consigne.pcMissions || 'Missions de soutien et secours'} »
            </div>
          </div>
        ` : ''}

        <!-- SUIVI DES COMPÉTENCES REQUISES (SMS DE CRISE) -->
        ${(() => {
          const qs = this.getMissionQuotas(mission);
          if (!qs.length) return '';
          this.syncQuotaFillFromRegistered(game, mission);
          const fill = this.getQuotaFill(mission, qs);
          return `
            <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <span class="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">🎯 Compétences requises</span>
              <div class="flex flex-wrap gap-1.5">
                ${qs.map(q => {
                  const n = (fill[q.key] || []).length;
                  const ok = n >= q.count;
                  const locked = q.mode === 'verrouille';
                  return `<span class="px-2 py-0.5 rounded-lg text-[10px] font-black border ${ok ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700' : (locked ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700' : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700')}">${locked ? '🔒' : '⭐'} ${this.getQuotaDef(q.key).short} : ${n}/${q.count}</span>`;
                }).join('')}
              </div>
            </div>`;
        })()}

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
                    <span class="font-extrabold flex items-center gap-1 ${h.isUpdate ? 'text-amber-600 dark:text-amber-400' : 'text-pc-blue dark:text-indigo-400'}">
                      <i data-lucide="${h.isUpdate ? 'zap' : 'radio'}" class="w-3 h-3"></i>
                      <span>${h.isUpdate ? 'Mise à Jour Consigne' : 'Alerte Initiale'} (${h.consigneLabel || 'Consigne'})</span>
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
            <div class="space-y-1.5 max-h-48 overflow-y-auto">
              ${mission.smsResponses.map(r => {
                const isRegistered = Boolean(mission.registeredVolunteers && mission.registeredVolunteers.includes(r.volunteerId));
                const isOverridden = Boolean(r.overridden || (r.canOverrideDelay && isRegistered));
                const isPendingOverride = Boolean(r.canOverrideDelay && !isOverridden && !isRegistered);
                const isAvailable = Boolean(r.isAvailable || isOverridden);

                let badgeHtml = '';
                let containerClass = '';
                let iconClass = '';
                let iconName = 'x';

                if (isPendingOverride) {
                  containerClass = 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 text-slate-800 dark:text-white shadow-2xs';
                  iconClass = 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
                  iconName = 'clock';
                  const overrun = r.delayOverrunMinutes || Math.max(1, (r.rallyMinutes || 0) - (r.maxDelay || 0));
                  badgeHtml = `
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-600 flex items-center gap-1">
                      <i data-lucide="clock" class="w-2.5 h-2.5"></i>
                      <span>À ${r.rallyMinutes || '?'} min (+${overrun} min)</span>
                    </span>
                  `;
                } else if (isAvailable) {
                  containerClass = 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-500/30 text-slate-800 dark:text-white shadow-2xs';
                  iconClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
                  iconName = 'check';
                  badgeHtml = `
                    <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                      ${isOverridden ? 'Déclenché ✓' : 'Dispo'}
                    </span>
                  `;
                } else if (r.profileMismatch) {
                  containerClass = 'bg-slate-50 dark:bg-slate-800/50 border-rose-200 dark:border-rose-700/40 text-slate-700 dark:text-slate-300';
                  iconClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
                  iconName = 'lock';
                  badgeHtml = `
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-600">🔒 Hors profil</span>
                  `;
                } else {
                  containerClass = 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500';
                  iconClass = 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
                  iconName = 'x';
                  badgeHtml = `
                    <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                      Indispo
                    </span>
                  `;
                }

                return `
                  <div class="p-2 rounded-xl border flex items-center justify-between text-xs ${containerClass}">
                    <div class="flex items-center gap-2 min-w-0 flex-1">
                      <div class="w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${iconClass}">
                        <i data-lucide="${iconName}" class="w-3.5 h-3.5"></i>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span class="font-bold text-slate-900 dark:text-white">${r.volunteerName}</span>
                          ${badgeHtml}
                          <span class="text-[9px] text-slate-400 font-semibold">${r.rank}</span>
                        </div>
                        <div class="text-[11px] italic truncate text-slate-600 dark:text-slate-300 mt-0.5">« ${r.message} »</div>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-2 shrink-0 ml-2">
                      ${isPendingOverride && !hasOtherManager ? `
                        <button type="button" onclick="window.ProtecSmsMobilization.overrideDelayAndMobilize(window.game, '${mission.id}', '${r.volunteerId}')" class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-500 hover:bg-amber-600 active:scale-95 text-white transition flex items-center gap-1 cursor-pointer shadow-xs">
                          <i data-lucide="zap" class="w-3 h-3"></i>
                          <span>Déclencher quand même</span>
                        </button>
                      ` : ''}
                      <span class="text-[10px] mono-num font-bold text-slate-400">${r.time}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-dashed border-slate-200 dark:border-white/10 text-center text-slate-400 text-[11px] italic">
              ${mission.smsCampaignActive ? 'Campagne SMS en cours de diffusion... Les réponses des secouristes apparaîtront ici.' : 'Aucun retour SMS pour l\'instant. Cliquez sur « Rédiger & Diffuser SMS » pour solliciter vos bénévoles.'}
            </div>
          `}

          <!-- BANDEAU DES BÉNÉVOLES EN RÉSERVE (> 5 min de dépassement) -->
          ${(mission.distantVolunteers && mission.distantVolunteers.length > 0) ? `
            <div class="p-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <i data-lucide="info" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
                <span><strong>${mission.distantVolunteers.length}</strong> bénévole(s) disponible(s) mais à plus de 5 min du délai max requis (gardé(s) en réserve).</span>
              </div>
              ${!hasOtherManager ? `
                <button type="button" onclick="window.ProtecSmsMobilization.quickEditMaxDelay('${mission.id}')" class="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer shrink-0 flex items-center gap-1">
                  <span>Ajuster délai</span>
                  <i data-lucide="chevron-right" class="w-3 h-3"></i>
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>

      </div>
    `;
  }
};
