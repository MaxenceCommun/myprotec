/**
 * PROTEC LIVE - MODULE CONTRATS ANNUELS & POSTES RÉGULIERS
 * Gestion des accords-cadres pluriannuels et récurrents :
 * 1. Club de Football Résident (Matchs tous les 15 jours)
 * 2. Zénith & Grande Salle de Spectacles (Spectacles chaque semaine)
 * 3. Convention Cadre Municipale (Tous les événements organisés par la Ville)
 * 4. Parc des Expositions & Foire Internationale (Salons mensuels)
 */

window.ProtecContratsAnnuels = {
  CATALOG: [
    {
      id: 'foot_club',
      title: 'Club de Football Résident (Stade Municipal)',
      client: 'F.C. Métropole & Ligue Régionale de Football',
      icon: '⚽',
      category: 'Sport & Championnat',
      badge: 'Matchs toutes les 2 semaines',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      recurrenceDays: 14,
      recurrenceLabel: 'Toutes les 2 semaines (1 match / quinzaine)',
      dpsScale: 'DPS-PE',
      volunteersPerEvent: 6,
      vehiclesPerEvent: ['VPSP'],
      revenuePerEvent: 650,
      annualGrantBonus: 3500,
      minVolunteersRequired: 6,
      minVehiclesRequired: 1,
      minReputationRequired: 40,
      requiredAgrement: 'D',
      desc: 'Couverture sanitaire de l’ensemble des matchs officiels à domicile (championnat + coupes au stade municipal). Rencontres programmées un week-end sur deux avec ambulance VPSP en bord de pelouse.',
      eventsNames: [
        'Match de Championnat Régional (Journée {n})',
        'Coupe Régionale - Tour Éliminatoire',
        'Derby Métropolitain à domicile',
        'Match de Championnat - Rencontre du Samedi',
        'Match d’Ouverture de Phase Finale'
      ]
    },
    {
      id: 'zenith_spectacles',
      title: 'Zénith & Grande Salle de Spectacles',
      client: 'Direction d’Exploitation Zénith Aréna',
      icon: '🎤',
      category: 'Culture & Grands Concerts',
      badge: 'Spectacles chaque semaine',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      recurrenceDays: 7,
      recurrenceLabel: 'Toutes les semaines (vendredi / samedi soir)',
      dpsScale: 'DPS-ME',
      volunteersPerEvent: 8,
      vehiclesPerEvent: ['VPSP', 'VTU'],
      revenuePerEvent: 850,
      annualGrantBonus: 6500,
      minVolunteersRequired: 8,
      minVehiclesRequired: 2,
      minReputationRequired: 75,
      requiredAgrement: 'D',
      desc: 'Convention cadre d’exclusivité sanitaire pour la saison culturelle : concerts d’artistes majeurs, humoristes et festivals en salle comble (jusqu’à 6 000 spectateurs en fosse et gradins).',
      eventsNames: [
        'Concert Live Tournée Nationale au Zénith',
        'Grand Spectacle d’Humour & One-Man-Show',
        'Festival Musiques Actuelles & Électro',
        'Soirée Musique du Monde & Variété',
        'Concert Symphonique & Comédie Musicale'
      ]
    },
    {
      id: 'convention_mairie',
      title: 'Convention Cadre Municipale (Mairie & Ville)',
      client: 'Hôtel de Ville & Direction des Événements',
      icon: '🏛️',
      category: 'Collectivité Territoriale',
      badge: 'Tous événements de la Ville',
      badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
      recurrenceDays: 15,
      recurrenceLabel: 'Tous les événements officiels de la Ville (~2 / mois)',
      dpsScale: 'DPS-ME',
      volunteersPerEvent: 10,
      vehiclesPerEvent: ['VPSP', 'VTU'],
      revenuePerEvent: 980,
      annualGrantBonus: 10000,
      minVolunteersRequired: 10,
      minVehiclesRequired: 2,
      minReputationRequired: 60,
      requiredAgrement: 'D',
      desc: 'Délégation officielle de la ville pour tous les événements municipaux de l’année : Fête de la Musique, Fête Nationale du 14 Juillet, Marché de Noël, cérémonies patriotiques et semi-marathon de la ville.',
      eventsNames: [
        'Événement Ville • Cérémonie & Fête Républicaine',
        'Fête de la Musique & Festival Urbain Municipal',
        'Foulées Populaires & Semi-Marathon de la Ville',
        'Marché Festif & Spectacle Nocturne de la Ville',
        'Forum des Associations & Fête de Quartier'
      ]
    },
    {
      id: 'parc_expos',
      title: 'Parc des Expositions & Foire Internationale',
      client: 'Société d’Économie Mixte des Foires et Salons',
      icon: '🎪',
      category: 'Foires & Salons Grand Public',
      badge: 'Salons chaque mois',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      recurrenceDays: 30,
      recurrenceLabel: 'Chaque mois (Grands Salons Grand Public sur 3-4 jours)',
      dpsScale: 'DPS-GE',
      volunteersPerEvent: 12,
      vehiclesPerEvent: ['VPSP', 'VPSP', 'VTU'],
      revenuePerEvent: 1450,
      annualGrantBonus: 5000,
      minVolunteersRequired: 12,
      minVehiclesRequired: 2,
      minReputationRequired: 120,
      requiredAgrement: 'D',
      desc: 'Couverture sanitaire de grande envergure pour les foires commerciales, salons de l’habitat et rassemblements d’entreprises accueillant un flux continu de plusieurs dizaines de milliers de visiteurs.',
      eventsNames: [
        'Foire Internationale d’Automne (Parc Expo)',
        'Grand Salon de l’Habitat & Décoration',
        'Salon Régional de l’Auto & Mobilités',
        'Salon de la Gastronomie & Terroirs',
        'Congrès & Salon des Nouvelles Technologies'
      ]
    }
  ],

  // Catalogue dynamique contextualisé avec l'ancrage territorial de l'antenne
  getContractsCatalog(game) {
    if (!game) game = window.game;
    const station = (game?.stations && game.stations[0]) || { name: 'Antenne', city: 'Metz', departmentCode: '57' };
    const deptCode = String(station.departmentCode || game?.currentDepartmentCode || game?.player?.departmentCode || '75').trim().toUpperCase();
    const deptInfo = (window.ProtecDepartements && typeof window.ProtecDepartements.getByCode === 'function')
      ? (window.ProtecDepartements.getByCode(deptCode) || { code: deptCode, name: 'France', chefLieu: station.city || 'Chef-Lieu', region: 'France' })
      : { code: deptCode, name: 'France', chefLieu: station.city || 'Chef-Lieu', region: 'France' };
    const city = station.city || deptInfo.chefLieu || 'Métropole';

    // 1. Club Sportif Résident du Territoire (ASNL, FC Metz, OM, OL, PSG, MHSC, etc.)
    let realClub = null;
    if (window.ProtecEvenementsReels && window.ProtecEvenementsReels.REAL_SPORTS_CLUBS) {
      const clubsList = window.ProtecEvenementsReels.REAL_SPORTS_CLUBS[deptCode] || [];
      if (clubsList.length > 0) {
        realClub = clubsList.find(c => c.city && c.city.toLowerCase().includes(city.toLowerCase())) || clubsList[0];
      }
    }
    const clubTitle = realClub ? `Club Résident : ${realClub.name} (${realClub.venue})` : `Club Résident de ${city} (Stade Municipal)`;
    const clubClient = realClub ? (realClub.client || `${realClub.name} SASP`) : `Direction Sportive • ${city}`;
    const clubDesc = realClub 
      ? `Convention cadre d'exclusivité sanitaire avec le club résident ${realClub.name} au stade ${realClub.venue} (${realClub.capacity ? realClub.capacity.toLocaleString('fr-FR') : '15 000'} places). Tous les matchs officiels à domicile avec ambulance VPSP en bord de pelouse.`
      : `Couverture sanitaire de l'ensemble des matchs officiels à domicile au stade municipal de ${city}. Rencontres un week-end sur deux avec ambulance VPSP en bord de pelouse.`;

    // 2. Grande Salle de Spectacles / Zénith du Territoire
    let venueName = `Zénith & Grande Salle de ${city}`;
    if (['54', '57', '67', '68'].includes(deptCode)) {
      if (deptCode === '54') venueName = 'Zénith du Grand Nancy (Maxéville)';
      else if (deptCode === '57') venueName = 'Les Arènes de Metz & Galaxie Amnéville';
      else if (deptCode === '67') venueName = 'Zénith de Strasbourg Europe';
      else if (deptCode === '68') venueName = 'Parc Expo & Salle des Musiques de Colmar';
    } else if (deptCode === '75') {
      venueName = 'Zénith Paris - La Villette & Accor Arena';
    } else if (deptCode === '13') {
      venueName = 'Le Dôme de Marseille & Arena du Pays d’Aix';
    } else if (deptCode === '69') {
      venueName = 'Halle Tony Garnier & LDLC Arena (Lyon)';
    } else if (deptCode === '59') {
      venueName = 'Zénith de Lille Grand Palais';
    } else if (deptCode === '31') {
      venueName = 'Zénith Toulouse Métropole';
    } else if (deptCode === '33') {
      venueName = 'Arkéa Arena de Bordeaux (Floirac)';
    } else if (deptCode === '44') {
      venueName = 'Zénith Nantes Métropole';
    } else if (deptCode === '34') {
      venueName = 'Sud de France Arena (Montpellier)';
    } else if (deptCode === '06') {
      venueName = 'Palais Nikaïa de Nice';
    } else if (deptCode === '21') {
      venueName = 'Zénith de Dijon';
    } else if (deptCode === '63') {
      venueName = 'Zénith d’Auvergne (Cournon-d’Auvergne)';
    } else if (deptCode === '76') {
      venueName = 'Zénith de Rouen';
    } else if (deptCode === '80') {
      venueName = 'Zénith d’Amiens';
    } else if (deptCode === '87') {
      venueName = 'Zénith de Limoges';
    } else if (deptCode === '42') {
      venueName = 'Zénith de Saint-Étienne';
    } else if (deptCode === '83') {
      venueName = 'Zénith Oméga de Toulon';
    } else if (deptCode === '30') {
      venueName = 'Arènes & Palissades de Nîmes';
    } else if (deptCode === '29') {
      venueName = 'Brest Arena';
    } else if (deptCode === '51') {
      venueName = 'Reims Arena';
    }

    // 3. Convention Cadre Municipale
    const mairieTitle = `Convention Cadre Municipale (Ville de ${city})`;
    const mairieClient = `Mairie de ${city} & Direction de la Sécurité Publique`;
    const mairieDesc = `Délégation officielle exclusive de la Mairie de ${city} pour l'ensemble des manifestations de la ville : Fête de la Musique, festivités du 14 Juillet, cérémonies républicaines, marché de saison et événements associatifs municipaux.`;

    // 4. Parc des Expositions / Salons
    let parcTitle = `Parc des Expositions de ${city}`;
    if (deptCode === '75') parcTitle = 'Paris Expo Porte de Versailles & Villepinte';
    else if (deptCode === '69') parcTitle = 'Eurexpo Lyon (Chassieu)';
    else if (deptCode === '13') parcTitle = 'Parc Chanot • Marseille Palais des Congrès';
    else if (deptCode === '59') parcTitle = 'Lille Grand Palais';
    else if (deptCode === '33') parcTitle = 'Parc des Expositions de Bordeaux (Lac)';
    else if (deptCode === '31') parcTitle = 'MEETT • Parc des Expositions de Toulouse';
    else if (deptCode === '67') parcTitle = 'Parc des Expositions de Strasbourg (Wacken)';
    else if (deptCode === '54') parcTitle = 'Parc des Expositions du Grand Nancy (Vandœuvre)';
    else if (deptCode === '57') parcTitle = 'Metz Expo Événements (Grigy)';
    else if (deptCode === '44') parcTitle = 'Exponantes Le Parc (Nantes)';

    return [
      {
        ...this.CATALOG[0],
        title: clubTitle,
        client: clubClient,
        desc: clubDesc,
        city: realClub?.city || city,
        venue: realClub?.venue || 'Stade Municipal',
        eventsNames: realClub ? [
          `Rencontre Officielle : ${realClub.name} (Journée {n})`,
          `Coupe Officielle : ${realClub.name} à domicile`,
          `Grand Match : ${realClub.name} au ${realClub.venue}`,
          `Championnat : ${realClub.name} devant ses supporters`,
          `Phase Décisive : ${realClub.name} à ${realClub.venue}`
        ] : this.CATALOG[0].eventsNames
      },
      {
        ...this.CATALOG[1],
        title: venueName,
        client: `Direction d’Exploitation • ${venueName}`,
        desc: `Convention cadre d'exclusivité sanitaire pour la programmation artistique et culturelle de « ${venueName} ». Concerts majeurs, humoristes, festivals et tournées nationales chaque semaine.`,
        city: city,
        venue: venueName
      },
      {
        ...this.CATALOG[2],
        title: mairieTitle,
        client: mairieClient,
        desc: mairieDesc,
        city: city
      },
      {
        ...this.CATALOG[3],
        title: parcTitle,
        client: `Société d’Exploitation des Salons • ${parcTitle}`,
        desc: `Couverture sanitaire de grande envergure pour les salons, foires et congrès grand public accueillis au « ${parcTitle} ». Salons de l'habitat, de l'auto, de la gastronomie et foires d'envergure.`,
        city: city,
        venue: parcTitle
      }
    ];
  },

  // Initialisation de l'état
  ensureState(game) {
    if (!game) game = window.game;
    if (!game) return;
    if (!Array.isArray(game.annualContracts)) {
      game.annualContracts = [];
    }
  },

  // Vérifier si un contrat est déjà signé
  isSigned(game, contractId) {
    this.ensureState(game);
    return (game?.annualContracts || []).some(c => c.id === contractId && c.signed);
  },

  // Récupérer les données de signature d'un contrat
  getContractData(game, contractId) {
    this.ensureState(game);
    return (game?.annualContracts || []).find(c => c.id === contractId) || null;
  },

  // Vérification de l'éligibilité d'une antenne pour un contrat
  checkEligibility(game, item) {
    if (!game) game = window.game;
    const errors = [];

    // 1. Convention AASC obligatoire
    if (!game?.aascConvention?.signed) {
      errors.push("Absence de Convention Préfectorale d'AASC en cours de validité (cadre légal régalien obligatoire).");
    }

    // 2. Agrément D obligatoire
    if (!game?.resources?.agrements?.D) {
      errors.push("Agrément D (Dispositifs Prévisionnels de Secours) non détenu par votre antenne.");
    }

    // 3. Effectif suffisant de secouristes
    const volCount = (game?.volunteers || []).filter(v => !v.isBurnout && v.status !== 'burnout').length;
    if (volCount < item.minVolunteersRequired) {
      errors.push("Effectif de secouristes opérationnels insuffisant pour garantir la couverture récurrente de l'ensemble des dates.");
    }

    // 4. Flotte de véhicules
    const vehCount = (game?.vehicles || []).filter(v => v.status !== 'panne').length;
    if (vehCount < item.minVehiclesRequired) {
      errors.push("Parc de véhicules insuffisant pour mobiliser les moyens roulants exigés par le cahier des charges.");
    }

    // 5. Réputation / Notoriété
    const repScore = game?.resources?.reputationScore || 0;
    if (repScore < item.minReputationRequired) {
      errors.push(`Notoriété et assise locale insuffisantes auprès de « ${item.client} » pour un engagement exclusif de cette ampleur.`);
    }

    return {
      eligible: errors.length === 0,
      errors
    };
  },

  // Signature officielle d'un contrat cadre annuel
  async signContract(game, contractId) {
    if (!game) game = window.game;
    const item = this.getContractsCatalog(game).find(c => c.id === contractId);
    if (!item) return;

    this.ensureState(game);

    if (this.isSigned(game, contractId)) {
      if (game.showToast) game.showToast('Contrat Déjà Actif', `Le contrat cadre « ${item.title} » est déjà en vigueur.`, 'blue');
      return;
    }

    const check = this.checkEligibility(game, item);
    if (!check.eligible) {
      const rejectReason = check.errors.join(' ');
      if (!game.annualContractReviews) game.annualContractReviews = {};
      game.annualContractReviews[contractId] = {
        status: 'rejected',
        reason: rejectReason,
        rejectedAt: Date.now()
      };
      game.saveGame();

      const rejectDetails = `Décision de la Commission d'Attribution (« ${item.client} ») :\n\n` +
        `Votre dossier de candidature pour « ${item.title} » a été examiné.\n` +
        `Après délibération, la commission a émis un AVIS DÉFAVORABLE pour les motifs suivants :\n\n` +
        check.errors.map(e => `• ${e}`).join('\n') +
        `\n\nConseil : Poursuivez vos missions et le développement de votre antenne afin d'asseoir votre réputation avant de renouveler votre demande.`;

      if (window.ProtecDialog) {
        await window.ProtecDialog.alert(rejectDetails, 'Candidature Non Retenue ❌');
      } else {
        alert(rejectDetails);
      }

      if (game.showToast) {
        game.showToast('Candidature Non Retenue ❌', `La commission de « ${item.client} » a rejeté votre dossier.`, 'red');
      }

      // Rafraîchir l'interface active
      if (game.currentModalKey === 'devis') {
        game.openModule('devis', true);
      } else if (game.currentModalKey === 'conventions') {
        window.ProtecConventions.renderModal(game);
      }
      return;
    }

    // Réinitialiser tout ancien rejet si désormais accepté
    if (game.annualContractReviews && game.annualContractReviews[contractId]) {
      delete game.annualContractReviews[contractId];
    }

    const confirmMsg = `Félicitations ! Votre dossier a reçu un AVIS FAVORABLE de « ${item.client} ».\n\n` +
      `Confirmez-vous la signature de la convention cadre annuelle ?\n\n` +
      `• Fréquence : ${item.recurrenceLabel}\n` +
      `• Indemnité par poste : ${item.revenuePerEvent} €\n` +
      `• Prime annuelle de partenariat : +${item.annualGrantBonus} € (versée immédiatement)\n` +
      `• Durée : 1 an renouvelable`;

    let confirmed = true;
    if (window.ProtecDialog) {
      confirmed = await window.ProtecDialog.confirm(confirmMsg, 'Signature de Contrat Cadre Annuel', {
        confirmText: 'Signer la Convention Cadre',
        cancelText: 'Annuler'
      });
    }

    if (!confirmed) return;

    // Enregistrement du contrat
    const grantBonus = item.annualGrantBonus || 0;
    const record = {
      id: item.id,
      title: item.title,
      client: item.client,
      signed: true,
      signedAt: Date.now(),
      expiresAt: Date.now() + (365 * 24 * 3600 * 1000),
      eventsCompleted: 0,
      totalEarned: grantBonus,
      nextScheduledDay: (game.clock?.day || 5) + 3
    };

    game.annualContracts.push(record);

    // Versement de la dotation / prime annuelle
    game.resources.money = (game.resources.money || 0) + grantBonus;
    game.resources.reputationScore = (game.resources.reputationScore || 0) + 20;

    // Traçabilité financière
    if (window.ProtecFinances && typeof window.ProtecFinances.recordTransaction === 'function') {
      window.ProtecFinances.recordTransaction(game, grantBonus, `Prime Partenariat Annuel : ${item.title}`, 'subvention');
    }

    // Planification immédiate du premier événement régulier
    this.scheduleNextMission(game, item.id, 3);

    game.saveGame();
    game.updateStatsUI();

    if (game.showToast) {
      game.showToast(
        'Contrat Cadre Signé ! 📜',
        `Partenariat annuel validé avec « ${item.client} ». +${grantBonus} € versés sur votre trésorerie et premier poste inscrit au calendrier !`,
        'green'
      );
    }

    // Rafraîchir l'interface active
    if (game.currentModalKey === 'devis') {
      game.openModule('devis', true);
    } else if (game.currentModalKey === 'conventions') {
      window.ProtecConventions.renderModal(game);
    }
  },

  // Résiliation d'un contrat annuel
  async terminateContract(game, contractId) {
    if (!game) game = window.game;
    const item = this.CATALOG.find(c => c.id === contractId);
    if (!item) return;

    this.ensureState(game);

    let confirmed = true;
    if (window.ProtecDialog) {
      confirmed = await window.ProtecDialog.confirm(
        `Confirmez-vous la résiliation de la convention avec « ${item.client} » ?\nLes postes réguliers futurs seront supprimés de votre planning opérationnel.`,
        'Résiliation de Contrat Cadre',
        { isDestructive: true, confirmText: 'Résilier le contrat', cancelText: 'Conserver' }
      );
    }

    if (!confirmed) return;

    // Retirer le contrat
    game.annualContracts = game.annualContracts.filter(c => c.id !== contractId);

    // Supprimer les missions planifiées non encore débutées
    game.missions = game.missions.filter(m => !(m.annualContractId === contractId && m.status === 'planifie'));

    game.saveGame();
    game.updateStatsUI();

    if (game.showToast) {
      game.showToast('Contrat Résilié', `La convention cadre « ${item.title} » a été résiliée. Les futurs créneaux ont été retirés de l'agenda.`, 'slate');
    }

    if (game.currentModalKey === 'devis') {
      game.openModule('devis', true);
    } else if (game.currentModalKey === 'conventions') {
      window.ProtecConventions.renderModal(game);
    }
  },

  // Planifier le prochain événement régulier au calendrier
  scheduleNextMission(game, contractId, dayOffset = null) {
    if (!game) game = window.game;
    const item = this.getContractsCatalog(game).find(c => c.id === contractId);
    if (!item) return null;

    const contractData = this.getContractData(game, contractId);
    const completedCount = contractData ? (contractData.eventsCompleted || 0) : 0;
    const matchNum = completedCount + 1;

    // Choix d'un intitulé vivant
    const templateName = item.eventsNames[Math.floor(Math.random() * item.eventsNames.length)];
    const eventTitle = templateName.replace('{n}', matchNum);

    const curDay = game.clock?.day || 5;
    const curMonth = game.clock?.month ?? 9;
    const curYear = game.clock?.year || 2026;

    const offset = (dayOffset !== null) ? Number(dayOffset) : item.recurrenceDays;
    const targetDate = new Date(curYear, curMonth, curDay + offset);
    const dayName = game.clock?.daysNames ? game.clock.daysNames[targetDate.getDay()] : 'Samedi';

    // Position géographique cohérente (stade, salle ou centre-ville)
    const baseStation = (game.stations && game.stations[0]) || { lat: 48.8566, lng: 2.3522, name: 'Antenne' };
    const randAngle = Math.random() * Math.PI * 2;
    const randDist = 0.015 + Math.random() * 0.025; // 1.5 à 4 km de la base
    const eventLat = Number(baseStation.lat) + Math.cos(randAngle) * randDist;
    const eventLng = Number(baseStation.lng) + Math.sin(randAngle) * randDist;

    const newMission = {
      id: `m-annual-${contractId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'dps',
      isAnnualContract: true,
      annualContractId: contractId,
      categoryLabel: `Contrat Annuel • ${item.title}`,
      title: eventTitle,
      desc: `Poste régulier d'accord-cadre pour « ${item.client} ». ${item.dpsScale} récurrent (${item.volunteersPerEvent} secouristes requis).`,
      lat: eventLat,
      lng: eventLng,
      scale: item.dpsScale,
      eventDate: {
        year: targetDate.getFullYear(),
        month: targetDate.getMonth(),
        day: targetDate.getDate(),
        dayName: dayName,
        hour: item.id === 'zenith_spectacles' ? 19 : (item.id === 'foot_club' ? 15 : 14),
        startHour: item.id === 'zenith_spectacles' ? 19 : 14
      },
      durationHours: item.id === 'zenith_spectacles' ? 5 : (item.id === 'parc_expos' ? 8 : 4),
      duration: (item.id === 'zenith_spectacles' ? 5 : 4) * 10,
      durationSeconds: (item.id === 'zenith_spectacles' ? 5 : 4) * 3600,
      requiredVolunteers: item.volunteersPerEvent,
      requiredVehicles: [...item.vehiclesPerEvent],
      requiredRanks: ['PSE1', 'PSE2'],
      rewardMoney: item.revenuePerEvent,
      rewardReputation: 15,
      clientName: item.client,
      status: 'planifie',
      registeredVolunteers: [],
      volunteerRoles: {},
      assignedCrew: { volunteers: [], vehicles: [] },
      address: `${item.title} - Site Officiel Conventionné`,
      consumableCost: 25,
      progress: 0
    };

    if (typeof game.enrichMissionLocationWithCity === 'function') {
      game.enrichMissionLocationWithCity(newMission);
    }

    game.missions.push(newMission);

    if (contractData) {
      contractData.nextScheduledDay = targetDate.getDate();
    }

    if (typeof game.renderMissions === 'function') {
      game.renderMissions();
    }

    return newMission;
  },

  // Boucle périodique : s'assure qu'un contrat annuel actif a toujours son prochain événement au calendrier
  checkRecurringSchedules(game) {
    if (!game) game = window.game;
    this.ensureState(game);

    const signedList = (game.annualContracts || []).filter(c => c.signed);
    if (signedList.length === 0) return;

    const catalog = this.getContractsCatalog(game);
    signedList.forEach(contractRecord => {
      const item = catalog.find(c => c.id === contractRecord.id);
      if (!item) return;

      // Y a-t-il déjà une mission planifiée ou en cours pour ce contrat ?
      const hasActiveMission = (game.missions || []).some(m => 
        m.annualContractId === contractRecord.id && ['planifie', 'prealerte', 'declenche', 'ongoing'].includes(m.status)
      );

      // Si aucune mission active ou planifiée n'existe pour ce contrat, programmer la suivante
      if (!hasActiveMission) {
        this.scheduleNextMission(game, contractRecord.id, item.recurrenceDays);
        if (game.showToast) {
          game.showToast(
            'Poste Régulier Planifié 📅',
            `Nouvelle date programmée pour « ${item.title} » (${item.recurrenceLabel}) au calendrier opérationnel.`,
            'blue'
          );
        }
      }
    });
  },

  // Callback appelé lorsqu'une mission issue d'un contrat annuel est terminée
  onMissionCompleted(game, mission) {
    if (!game || !mission || !mission.isAnnualContract || !mission.annualContractId) return;
    this.ensureState(game);

    const contractRecord = (game.annualContracts || []).find(c => c.id === mission.annualContractId);
    if (contractRecord) {
      contractRecord.eventsCompleted = (contractRecord.eventsCompleted || 0) + 1;
      contractRecord.totalEarned = (contractRecord.totalEarned || 0) + (mission.rewardMoney || 0);

      // Programmer automatiquement la session suivante selon la récurrence
      const item = this.getContractsCatalog(game).find(c => c.id === mission.annualContractId);
      if (item) {
        this.scheduleNextMission(game, item.id, item.recurrenceDays);
      }
    }
  },

  // Rendu HTML des contrats annuels
  renderContractsHTML(game) {
    if (!game) game = window.game;
    this.ensureState(game);

    return `
      <div class="space-y-4">
        <div class="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-pc-blue text-white shadow-xl flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl font-black">
              📜
            </div>
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-indigo-300">Accords-Cadres & Prestations Récurrentes</span>
              <h4 class="text-sm sm:text-base font-black">Contrats Annuels & Postes Réguliers</h4>
              <p class="text-xs text-white/80">Partenariats pluriannuels garantissant des dispositifs réguliers et des revenus fixes planifiés.</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Revenus Garantis
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${this.getContractsCatalog(game).map(item => {
            const isSigned = this.isSigned(game, item.id);
            const contractData = this.getContractData(game, item.id);
            const check = this.checkEligibility(game, item);

            return `
              <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3.5 border ${isSigned ? 'border-emerald-400/80 bg-emerald-50/30 ring-2 ring-emerald-300/30' : 'border-slate-200'}">
                <div class="space-y-2.5">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="text-2xl">${item.icon}</span>
                      <div>
                        <span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${item.badgeColor}">
                          ${item.badge}
                        </span>
                        <h4 class="text-sm font-black text-slate-900 leading-tight mt-1">${item.title}</h4>
                      </div>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${isSigned ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}">
                      ${isSigned ? 'Actif ✓' : 'Disponible'}
                    </span>
                  </div>

                  <p class="text-xs text-slate-600 leading-relaxed">${item.desc}</p>

                  <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1.5 text-slate-700">
                    <div class="flex items-center justify-between">
                      <span class="font-semibold text-slate-500">Organisateur :</span>
                      <span class="font-extrabold text-slate-800">${item.client}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="font-semibold text-slate-500">Cadence :</span>
                      <span class="font-bold text-pc-blue">${item.recurrenceLabel}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="font-semibold text-slate-500">Rémunération par poste :</span>
                      <span class="font-black text-emerald-700">${item.revenuePerEvent} € / événement</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="font-semibold text-slate-500">Prime annuelle de partenariat :</span>
                      <span class="font-black text-indigo-700">+${item.annualGrantBonus.toLocaleString('fr-FR')} € à la signature</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="font-semibold text-slate-500">Équipage type requis :</span>
                      <span class="font-bold text-slate-700">${item.volunteersPerEvent} secouristes (${item.vehiclesPerEvent.join(' + ')})</span>
                    </div>
                  </div>

                  ${isSigned ? `
                    <div class="p-2.5 rounded-xl bg-emerald-100/60 border border-emerald-300 text-emerald-950 text-[11px] font-semibold flex items-center justify-between">
                      <span>✓ Postes assurés cette saison : <strong>${contractData?.eventsCompleted || 0}</strong></span>
                      <span>Total perçu : <strong>${(contractData?.totalEarned || 0).toLocaleString('fr-FR')} €</strong></span>
                    </div>
                  ` : (game.annualContractReviews?.[item.id]?.status === 'rejected') ? `
                    <div class="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-[10px] space-y-0.5">
                      <div class="font-bold flex items-center gap-1">
                        <span>⚠️ Avis défavorable de la commission :</span>
                      </div>
                      <div class="leading-relaxed">${game.annualContractReviews[item.id].reason}</div>
                    </div>
                  ` : ''}
                </div>

                <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  ${isSigned ? `
                    <button onclick="window.game.openModule('planning')" class="px-3.5 py-2 rounded-xl bg-pc-blue hover:brightness-110 text-white font-extrabold text-xs shadow-sm transition flex items-center gap-1.5">
                      <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                      <span>Voir au Planning</span>
                    </button>
                    <button onclick="window.ProtecContratsAnnuels.terminateContract(window.game, '${item.id}')" class="px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition">
                      Résilier
                    </button>
                  ` : `
                    <button onclick="window.ProtecContratsAnnuels.signContract(window.game, '${item.id}')" class="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-pc-blue hover:brightness-110 active:scale-95 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
                      <span>📑</span>
                      <span>${game.annualContractReviews?.[item.id]?.status === 'rejected' ? 'Renouveler le Dossier de Candidature' : 'Déposer un Dossier de Candidature'} (+${item.annualGrantBonus} €)</span>
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
};
