/**
 * PROTEC LIVE - MATÉRIEL PROFESSIONNEL, LOTS D'INTERVENTION & CONDITIONS DE TRAVAIL
 * 
 * 1. LOTS D'INTERVENTION & MATÉRIEL DE CRISE (Stockés en réserve de l'antenne) :
 *    - Lot Tronçonnage / Dégagement (Tempêtes, voiries)
 *    - Lot Épuisement / Pompage (Inondations, caves, parkings)
 *    - Lot Éclairage d'urgence (Nuit, coupures, PMA)
 *    - Lot Bâchage & Consolidation (Toitures arrachées, orages)
 *    - Lot Hébergement d'urgence (Gymnases, lits picots, sinistrés)
 *    - Lot Ravitaillement / Cuisine de crise (Repas chauds, interventions longues)
 *    - Lot Soutien psychologique & Accueil (CAI, CHU, NOVI, enfants)
 * 
 * 2. CONDITIONS DE TRAVAIL & ÉQUIPEMENTS DU PERSONNEL :
 *    - Radios portatives ANTARES (fatigue réduite)
 *    - Tablettes tactiles embarquées TLO (vitesse d'intervention)
 *    - Smartphones d'astreinte sécurisés (taux de réponse SMS boosté)
 *    - Station PC & Ordinateurs Portables (vitesse administrative)
 *    - Fauteuils ergonomiques & Espace repos (récupération d'énergie)
 *    - Machine à café pro (moral des équipages)
 */

window.ProtecEquipements = {
  activeTab: 'lots', // 'lots' ou 'confort'

  // --- CATALOGUE DES LOTS D'INTERVENTION, SECOURS & MATÉRIEL DE CRISE ---
  LOTS_CATALOG: [
    {
      id: 'lot_secours_a',
      name: 'Lot A (Secours à personne standard)',
      icon: '🎒',
      price: 850,
      storageSize: 1,
      badge: 'Secours à Personne Standard',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      desc: 'Sac d’intervention complet avec oxygénothérapie d’urgence (bouteille O2 2L composite avec manodétendeur débitmètre), BAVU adulte et pédiatrique avec masques, saturomètre de pouls, tensiomètre manuel avec stéthoscope, colliers cervicaux pédiatriques et adultes réglables, garrots tourniquets, pansements compressifs hémostatiques, ciseaux Gesco et consommables de premiers soins.',
      bonus: 'Dotation fondamentale de tout VPSP et PAPS. Améliore la rapidité de prise en charge des malaises et traumatismes de 35% et valorise la qualité du bilan secouriste (+15 pts réputation).'
    },
    {
      id: 'lot_secours_b',
      name: 'Lot B (Immobilisation et relevage)',
      icon: '🩼',
      price: 1250,
      storageSize: 2,
      badge: 'Immobilisation & Traumatologie',
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      desc: 'Matelas immobilisateur à dépression (matelas coquille homologué) avec pompe à dépression manuelle double effet, plan dur pédiatrique et adulte avec jeu complet de sangles araignée et immobilisateur de tête rigide, attelles à dépression pour membres supérieurs et inférieurs (attelles alu et dépression), chaise de transport d’escalier pliable en aluminium.',
      bonus: 'Indispensable pour la traumatologie sportive, chutes et extractions délicates. Prévient toute aggravation neurologique ou ostéo-articulaire (+25 pts de réputation et félicitations du médecin régulateur SAMU).'
    },
    {
      id: 'lot_secours_c',
      name: 'Lot C (Poste de Secours fixe / Renfort)',
      icon: '⛺',
      price: 1750,
      storageSize: 3,
      badge: 'Poste Fixe & Accueil Victimes',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      desc: 'Tente gonflable de poste de secours 16 m² à déploiement rapide ou barnum armé renforcé, 2 brancards de soins sur tréteaux de consultation avec porte-perfusion, rampe d’éclairage LED autonome avec batterie, paravents de confidentialité pour respect de l’intimité des victimes, table d’examen et de secrétariat SINUS, tabourets d’auscultation pliables et poubelles DASRI étanches.',
      bonus: 'Armement des Postes de Secours fixes pour grands dispositifs (DPS-ME, DPS-GE, festivals). Permet de soigner jusqu’à 6 victimes simultanément sans saturer les secours publics (+30 pts réputation).'
    },
    {
      id: 'lot_tronconnage',
      name: 'Lot Tronçonnage / Dégagement',
      icon: '🪚',
      price: 1450,
      storageSize: 2,
      badge: 'Tempêtes & Axes Routiers',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      desc: '2 tronçonneuses thermiques d’abattage et débitage (guides 45 & 50 cm), 1 tronçonneuse d’élagage, bidons de carburant 2T/huile, EPI anti-coupure complets (classe 2), tire-fort 1,6T avec câbles acier, haches d’abattage et serpes.',
      bonus: 'Dégagement express d’arbres tombés sur les voies lors d’intempéries : suppression des risques de blocage, axes prioritaires rétablis et +25 pts de notoriété communale.'
    },
    {
      id: 'lot_pompage',
      name: 'Lot Épuisement / Pompage',
      icon: '🚰',
      price: 1850,
      storageSize: 3,
      badge: 'Inondations & Crues',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      desc: '2 motopompes thermiques gros débit (60 m³/h et 30 m³/h auto-amorçantes), 2 pompes électriques submersibles vide-caves (eaux chargées), 100m de tuyaux de refoulement souples, tuyaux d’aspiration armés avec crépines, coffret électrique étanche IP67.',
      bonus: 'Assèchement rapide des sous-sols, caves et parkings inondés. Permet de traiter jusqu’à 3 chantiers d’épuisement en simultané et rapporte +40% d’indemnité mairie (+160 €).'
    },
    {
      id: 'lot_eclairage',
      name: 'Lot Éclairage d’urgence',
      icon: '💡',
      price: 1600,
      storageSize: 2,
      badge: 'Nuit, Black-out & PMA',
      badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-300',
      desc: 'Groupe électrogène insonorisé 3,5 kVA inverter, 2 mâts d’éclairage télescopiques 4m à projecteurs LED 360° (2x 50 000 lumens), ballon éclairant anti-éblouissant Airstar, 4 projecteurs rechargeables autonomes de chantier, enrouleurs étanches 50m.',
      bonus: 'Illumination complète des Postes Médicaux Avancés (PMA), postes de commandement et zones de recherche de disparus nocturnes. Sécurité maximale des équipiers et +20 pts de réputation.'
    },
    {
      id: 'lot_bachage',
      name: 'Lot Bâchage & Consolidation',
      icon: '🛖',
      price: 980,
      storageSize: 2,
      badge: 'Intempéries & Toitures',
      badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
      desc: '6 grandes bâches armées imperméables 10x12m et 8x10m (250 g/m²), tasseaux et liteaux de fixation, cloueuses et agrafeuses pneumatiques, sangles d’arrimage à cliquet, cordages de fixation, échelles de toit et harnais antichute avec longes absorbantes.',
      bonus: 'Mise hors d’eau d’urgence des toitures arrachées par les vents violents ou perforées par la grêle. Protection immédiate des foyers sinistrés (+30 pts de réputation et félicitations du Maire).'
    },
    {
      id: 'lot_hebergement',
      name: 'Lot Hébergement d’urgence',
      icon: '🛏️',
      price: 2100,
      storageSize: 4,
      badge: 'Gymnases & Plan PCS',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      desc: '30 lits de camp pliants métalliques homologués Sécurité Civile (lits picots), 30 duvets thermiques grand froid, 30 kits d’hygiène individuels complets, paravents de séparation d’intimité, coin jeux et doudous d’urgence.',
      bonus: 'Armement immédiat d’un Centre d’Hébergement d’Urgence (CHU) ou gymnase pour 30 sinistrés évacués lors d’inondations ou d’incendies d’immeubles (+35 pts de notoriété préfectorale).'
    },
    {
      id: 'lot_ravitaillement',
      name: 'Lot Ravitaillement / Cuisine de crise',
      icon: '🍲',
      price: 1350,
      storageSize: 3,
      badge: 'Logistique Alimentaire & Crise',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
      desc: 'Percolateur inox 15L pour boissons chaudes, 4 marmites isothermes 20L de maintien au chaud, réchauds grande puissance à gaz avec détendeurs sécurisés, barnum réfectoire pliant 3x3m avec tables et bancs, caisses de repas d’urgence et gobelets réutilisables.',
      bonus: 'Distribution de boissons chaudes et repas complets aux secouristes, pompiers et personnes sinistrées lors de dispositifs de plus de 4h. Restaure +20% d’énergie et de moral aux équipages sur place.'
    },
    {
      id: 'lot_soutien_psy',
      name: 'Lot Soutien psychologique & Accueil (CAI, CHU)',
      icon: '🫂',
      price: 1200,
      storageSize: 2,
      badge: 'Centre d’Accueil Impliqués (CAI)',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      desc: 'Mobilier ergonomique pliant pour sas d’accueil confidentiel, paravents acoustiques, plaids thermiques douillets, coin jeux/coloriages et peluches d’urgence pour enfants traumatisés, thermos de réconfort, fiches de traçabilité des impliqués et kits CUMP.',
      bonus: 'Déploiement du CAI lors d’accidents collectifs ou de crises NOVI. Décuple l’impact des compétences AEP1 / AEP2 (+40 pts de réputation, apaisement immédiat des familles et traumatisme désamorcé).'
    }
  ],

  // --- CATALOGUE DU MATÉRIEL DE VIE D'ANTENNE & CONDITIONS DE TRAVAIL ---
  WORKPLACE_CATALOG: [
    {
      id: 'radios',
      name: 'Lot de Radios Numériques ANTARES (VHF/UHF)',
      icon: '📻',
      price: 450,
      badge: 'Communication Opérationnelle',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      desc: 'Talkies-walkies professionnels avec micros déportés pour liaison continue avec le CODIS, SAMU et chefs de dispositif.',
      bonus: 'Réduit la fatigue mentale des chefs d’équipe (-15% perte d’énergie sur le terrain) et assure une coordination sans faille.'
    },
    {
      id: 'tablettes',
      name: 'Tablettes Tactiles Embarquées (TLO)',
      icon: '📱',
      price: 650,
      badge: 'Informatique Embarquée',
      badgeColor: 'bg-blue-100 text-pc-blue border-blue-200',
      desc: 'Tablettes durcies montées sur support VPSP avec guidage GPS automatique, plans d’accès et régulation numérique.',
      bonus: '+15% de rapidité sur les interventions et navigation fluide sur le secteur.'
    },
    {
      id: 'phones',
      name: 'Smartphones d’Astreinte Sécurisés',
      icon: '📞',
      price: 320,
      badge: 'Alerte & Disponibilité',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      desc: 'Téléphones d’astreinte avec notifications sonores prioritaires pour les cadres et chefs d’équipages à domicile.',
      bonus: '+25% de taux de réponse favorable lors des mobilisations par SMS d’urgence.'
    },
    {
      id: 'pcs',
      name: 'Station PC & Ordinateurs Portables Antenne',
      icon: '💻',
      price: 1100,
      badge: 'Gestion Administrative & RH',
      badgeColor: 'bg-slate-200 text-slate-800 border-slate-300',
      desc: 'Ordinateurs de bureau pour la planification des gardes, le suivi des heures salariés (Code du Travail) et les devis.',
      bonus: '+25% de rapidité sur les démarches administratives, conventions et déclarations préfectorales.'
    },
    {
      id: 'fauteuils',
      name: 'Fauteuils Ergonomiques & Espace Repos',
      icon: '🛋️',
      price: 750,
      badge: 'Santé au Travail & Ergonomie',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desc: 'Sièges relax inclinables et literie ergonomique pour la salle de veille et le foyer des secouristes en garde.',
      bonus: '+25% de vitesse de régénération de fatigue lors des temps de repos au local.'
    },
    {
      id: 'cafe',
      name: 'Machine à Café Pro & Espace Convivialité',
      icon: '☕',
      price: 380,
      badge: 'Vie d’Antenne & Moral',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      desc: 'Machine expresso haute capacité, bouilloire et distributeur de collations pour les retours d’interventions nocturnes.',
      bonus: '+10% de moral permanent pour l’ensemble des bénévoles et salariés de l’antenne.'
    }
  ],

  // Rétrocompatibilité CATALOG pour le code existant
  get CATALOG() {
    return [...this.LOTS_CATALOG, ...this.WORKPLACE_CATALOG];
  },

  // Initialisation de l'état
  injectState(game) {
    if (!game.workplaceEquipment) {
      game.workplaceEquipment = {};
    }
    const allKeys = [
      'radios', 'tablettes', 'phones', 'pcs', 'fauteuils', 'cafe',
      'lot_tronconnage', 'lot_pompage', 'lot_eclairage', 'lot_bachage',
      'lot_hebergement', 'lot_ravitaillement', 'lot_soutien_psy'
    ];
    allKeys.forEach(k => {
      if (game.workplaceEquipment[k] === undefined) {
        game.workplaceEquipment[k] = 0;
      }
    });
  },

  // Calcul du volume total de stockage consommé par les lots d'intervention
  getLotsStorageUsed(game) {
    this.injectState(game);
    let used = 0;
    this.LOTS_CATALOG.forEach(lot => {
      const count = game.workplaceEquipment[lot.id] || 0;
      used += count * (lot.storageSize || 2);
    });
    return used;
  },

  // Vérifier si un équipement ou lot est possédé
  hasEquipment(game, equipId) {
    this.injectState(game);
    return (game.workplaceEquipment[equipId] || 0) > 0;
  },

  // Récupérer le nombre possédé d'un équipement ou lot
  getEquipmentCount(game, equipId) {
    this.injectState(game);
    return game.workplaceEquipment[equipId] || 0;
  },

  // Acheter un équipement ou lot
  buyEquipment(game, equipId) {
    this.injectState(game);
    const item = this.CATALOG.find(e => e.id === equipId);
    if (!item) return;

    // 1. Contrôle financier
    if (game.resources.money < item.price) {
      game.showToast('Trésorerie Insuffisante', `L’achat de « ${item.name} » nécessite ${item.price.toLocaleString('fr-FR')} €.`, 'orange');
      return;
    }

    // 2. Contrôle du stockage si c'est un lot d'intervention matériel
    const isLot = this.LOTS_CATALOG.some(l => l.id === equipId);
    if (isLot && window.ProtecLocaux) {
      if (!window.ProtecLocaux.hasStorageRoom(game)) {
        game.showToast('Zone de Stockage Requise !', 'Votre antenne ne possède aucune zone de stockage pour entreposer ce lot volumineux. Aménagez une zone de stockage dans l’onglet Locaux !', 'orange');
        return;
      }

      const maxCap = window.ProtecLocaux.getStorageCapacity(game);
      const usedCap = window.ProtecLocaux.getCurrentStorageUsed(game);
      const needed = item.storageSize || 2;

      if (usedCap + needed > maxCap) {
        game.showToast(
          'Stockage Insuffisant !',
          `Votre réserve est trop pleine pour entreposer ce lot (+${needed} unités requises, ${usedCap}/${maxCap} occupées). Agrandissez la zone de stockage dans vos Locaux.`,
          'orange'
        );
        return;
      }
    }

    const storageMsg = isLot ? `\n(Encombrement : ${item.storageSize || 2} unités de stockage)` : '';
    if (!confirm(`Confirmez-vous l'achat de « ${item.name} » pour ${item.price.toLocaleString('fr-FR')} € ?${storageMsg}`)) {
      return;
    }

    // Déduction des fonds et ajout du matériel
    game.resources.money -= item.price;
    game.workplaceEquipment[equipId] = (game.workplaceEquipment[equipId] || 0) + 1;

    // Enregistrement dans les flux financiers
    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(game, -item.price, `Achat Matériel : ${item.name}`, 'equipement');
    }

    // Effet moral immédiat si machine à café
    if (equipId === 'cafe') {
      game.volunteers.forEach(v => {
        v.motivation = Math.min(100, (v.motivation || 70) + 10);
      });
    }

    game.saveGame();
    game.updateStatsUI();

    const notifTitle = isLot ? '📦 Lot Réceptionné à l’Antenne !' : '🛠️ Équipement Livré !';
    game.showToast(notifTitle, `« ${item.name} » est désormais opérationnel et disponible à l’antenne.`, 'green');
    this.renderModal(game);
  },

  searchQuery: '',

  setSearchQuery(query, game) {
    this.searchQuery = query;
    this.renderModal(game);
    const input = document.getElementById('equipment-search-input');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  },

  // Changement d'onglet
  setTab(tabName, game) {
    this.activeTab = tabName;
    this.renderModal(game);
  },

  // Effet opérationnel des lots lors de la fin d'une mission
  checkMissionLotBonus(game, mission) {
    this.injectState(game);
    const mText = `${mission.title || ''} ${mission.desc || ''}`.toLowerCase();

    // 1. Lot Tronçonnage / Dégagement
    if ((mText.includes('arbre') || mText.includes('vent') || mText.includes('tempête') || mText.includes('dégagement') || mText.includes('voie')) && this.hasEquipment(game, 'lot_tronconnage')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 25;
      game.showToast('🪚 Lot Tronçonnage Déployé !', 'Les tronçonneuses et tire-forts ont permis un déblaiement rapide de la voirie (+25 pts de notoriété communale).', 'emerald');
    }

    // 2. Lot Épuisement / Pompage
    if ((mText.includes('inondation') || mText.includes('pompage') || mText.includes('crue') || mText.includes('eau') || mText.includes('pluie')) && this.hasEquipment(game, 'lot_pompage')) {
      const bonusPay = 160;
      game.resources.money += bonusPay;
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 20;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, bonusPay, 'Indemnité Pompage Municipal (Lot Épuisement)', 'prestation');
      }
      game.showToast('🚰 Lot Pompage & Épuisement !', `Motopompes thermiques déployées avec succès : caves et voiries asséchées (+${bonusPay} € indemnité mairie, +20 pts notoriété) !`, 'blue');
    }

    // 3. Lot Bâchage & Consolidation
    if ((mText.includes('toiture') || mText.includes('bâchage') || mText.includes('grêle') || mText.includes('bourrasque')) && this.hasEquipment(game, 'lot_bachage')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 30;
      game.showToast('🛖 Lot Bâchage Déployé !', 'Mise hors d’eau d’urgence des toitures endommagées : habitations préservées des infiltrations (+30 pts notoriété) !', 'amber');
    }

    // 4. Lot Éclairage d'urgence
    if ((mText.includes('nuit') || mText.includes('nocturne') || mText.includes('obscurité') || mText.includes('coupure') || mText.includes('pma') || mText.includes('recherche')) && this.hasEquipment(game, 'lot_eclairage')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 20;
      game.showToast('💡 Lot Éclairage Déployé !', 'Mâts LED 360° et ballon éclairant déployés : zone de travail sécurisée en pleine nuit (+20 pts notoriété) !', 'yellow');
    }

    // 5. Lot Hébergement d'urgence
    if ((mText.includes('gymnase') || mText.includes('hébergement') || mText.includes('sinistrés') || mText.includes('évacuation') || mText.includes('pcs')) && this.hasEquipment(game, 'lot_hebergement')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 35;
      game.showToast('🛏️ Lot Hébergement d’Urgence !', '30 lits de camp et kits d’hygiène installés dans le gymnase d’accueil communal (+35 pts notoriété préfectorale) !', 'emerald');
    }

    // 6. Lot Ravitaillement / Cuisine de crise
    if ((mText.includes('ravitaillement') || mText.includes('longue durée') || (mission.durationHours && mission.durationHours >= 4)) && this.hasEquipment(game, 'lot_ravitaillement')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 15;
      const crew = mission.assignedCrew?.volunteers || [];
      crew.forEach(v => {
        v.energy = Math.min(100, (v.energy || 70) + 15);
        v.motivation = Math.min(100, (v.motivation || 70) + 10);
      });
      game.showToast('🍲 Lot Ravitaillement Déployé !', 'Repas et boissons chaudes servis aux secouristes et impliqués (+15 pts notoriété, énergie équipage restaurée) !', 'rose');
    }

    // 7. Lot Soutien psychologique & Accueil (CAI, CHU)
    if ((mText.includes('cai') || mText.includes('impliqués') || mText.includes('psychologique') || mText.includes('novi') || mText.includes('famille')) && this.hasEquipment(game, 'lot_soutien_psy')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 40;
      game.showToast('🫂 Lot Soutien Psy & Accueil (CAI) !', 'Sas confidentiel et prise en charge humaine déployés avec succès pour les familles et impliqués (+40 pts notoriété) !', 'purple');
    }

    // 8. Lot A (Secours à personne standard)
    if (this.hasEquipment(game, 'lot_secours_a')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 15;
    }

    // 9. Lot B (Immobilisation et relevage)
    if ((mission.type === 'samu' || mission.type === 'pompiers' || mText.includes('sport') || mText.includes('trail') || mText.includes('course') || mText.includes('trauma')) && this.hasEquipment(game, 'lot_secours_b')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 20;
    }

    // 10. Lot C (Poste de Secours fixe / Renfort)
    if ((mission.scale?.includes('ME') || mission.scale?.includes('GE') || (mission.requiredVolunteers && mission.requiredVolunteers >= 6)) && this.hasEquipment(game, 'lot_secours_c')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 25;
      game.showToast('⛺ Lot C Poste Fixe Déployé !', 'Tente de poste de secours et brancards de soins armés : flux de victimes parfaitement absorbé (+25 pts réputation) !', 'purple');
    }
  },

  // Alias pour app.js
  renderEquipementsModal(game) {
    this.renderModal(game);
  },

  // Rendu de la modale Matériel & Lots
  renderModal(game) {
    this.injectState(game);
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');
    title.textContent = 'Matériel Opérationnel, Lots de Crise & Équipements';
    subtitle.textContent = 'Acquisition de lots d’intervention spécialisés et amélioration des conditions de travail';
    icon.setAttribute('data-lucide', 'package-check');

    const equipState = game.workplaceEquipment || {};
    const activeTab = this.activeTab || 'lots';

    // Données de stockage des locaux
    let hasStorage = false;
    let maxStorage = 0;
    let usedStorage = 0;
    if (window.ProtecLocaux) {
      hasStorage = window.ProtecLocaux.hasStorageRoom(game);
      maxStorage = window.ProtecLocaux.getStorageCapacity(game);
      usedStorage = window.ProtecLocaux.getCurrentStorageUsed(game);
    }
    const storagePercent = maxStorage > 0 ? Math.min(100, Math.round((usedStorage / maxStorage) * 100)) : 0;
    const sq = (this.searchQuery || '').toLowerCase().trim();

    const filteredLots = sq ? this.LOTS_CATALOG.filter(l => 
      (l.name && l.name.toLowerCase().includes(sq)) ||
      (l.desc && l.desc.toLowerCase().includes(sq)) ||
      (l.badge && l.badge.toLowerCase().includes(sq)) ||
      (l.bonus && l.bonus.toLowerCase().includes(sq))
    ) : this.LOTS_CATALOG;

    const filteredWorkplace = sq ? this.WORKPLACE_CATALOG.filter(w => 
      (w.name && w.name.toLowerCase().includes(sq)) ||
      (w.desc && w.desc.toLowerCase().includes(sq)) ||
      (w.badge && w.badge.toLowerCase().includes(sq)) ||
      (w.bonus && w.bonus.toLowerCase().includes(sq))
    ) : this.WORKPLACE_CATALOG;

    body.innerHTML = `
      <div class="space-y-6">
        
        <!-- En-tête : Trésorerie & Jauge Stockage -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Carte Trésorerie -->
          <div class="p-4 rounded-3xl bg-gradient-to-r from-pc-blue to-indigo-900 text-white flex items-center justify-between shadow-md">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl">
                💶
              </div>
              <div>
                <span class="text-[10px] uppercase font-bold text-white/70 block">Trésorerie Disponible</span>
                <span class="text-lg font-black mono-num">${game.resources.money.toLocaleString('fr-FR')} €</span>
              </div>
            </div>
            <button onclick="window.game.openFinancesModal()" class="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-[11px] font-bold transition">
              Finances
            </button>
          </div>

          <!-- Carte Capacité Stockage Locaux -->
          <div class="p-4 rounded-3xl glass-card border border-slate-200 flex items-center justify-between shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl ${hasStorage ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'} flex items-center justify-center text-2xl">
                📦
              </div>
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] uppercase font-bold text-slate-500">Zone de Stockage</span>
                  <span class="text-xs font-black mono-num ${usedStorage >= maxStorage ? 'text-red-600' : 'text-slate-800'}">
                    ${hasStorage ? `${usedStorage} / ${maxStorage} unités` : 'Aucun stockage'}
                  </span>
                </div>
                <div class="w-36 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div class="h-full ${storagePercent > 85 ? 'bg-red-500' : (storagePercent > 60 ? 'bg-amber-500' : 'bg-emerald-500')}" style="width: ${storagePercent}%"></div>
                </div>
              </div>
            </div>
            <button onclick="window.game.openModule('locaux')" class="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition" title="Gérer le plan des locaux">
              Locaux
            </button>
          </div>
        </div>

        <!-- Onglets Navigation -->
        <div class="flex p-1 bg-slate-100 rounded-2xl max-w-md mx-auto">
          <button onclick="window.ProtecEquipements.setTab('lots', window.game)" class="flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${activeTab === 'lots' ? 'bg-white text-pc-blue shadow-sm' : 'text-slate-500 hover:text-slate-800'}">
            <span>📦</span>
            <span>Lots d’Intervention & Crise</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700">7</span>
          </button>
          <button onclick="window.ProtecEquipements.setTab('confort', window.game)" class="flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${activeTab === 'confort' ? 'bg-white text-pc-blue shadow-sm' : 'text-slate-500 hover:text-slate-800'}">
            <span>🛠️</span>
            <span>Confort & Conditions RH</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">6</span>
          </button>
        </div>

        <!-- Barre de Recherche Matériel & Équipements -->
        <div class="relative max-w-xl mx-auto w-full">
          <input 
            type="text" 
            id="equipment-search-input"
            value="${this.searchQuery || ''}" 
            oninput="window.ProtecEquipements.setSearchQuery(this.value, window.game)" 
            placeholder="🔍 Rechercher du matériel (ex: pompe, tronçonneuse, radio, sac, tente, café...)" 
            class="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-white border border-slate-300 shadow-sm font-bold text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pc-blue transition"
          />
          ${this.searchQuery ? `
            <button onclick="window.ProtecEquipements.setSearchQuery('', window.game)" class="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
          ` : ''}
        </div>

        ${activeTab === 'lots' ? `
          <!-- ONGLET 1 : LOTS D'INTERVENTION & MATÉRIEL DE CRISE -->
          <div class="space-y-4">
            <div class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
              <span class="text-xl">⚠️</span>
              <p class="text-xs text-amber-900 leading-relaxed">
                Les <strong>lots d'intervention</strong> sont entreposés dans la réserve de votre antenne. Chaque lot occupe un volume spécifique dans votre zone de stockage. Ils se déploient automatiquement lors des interventions d'intempéries, inondations, tempêtes, sinistres ou déclenchements de Plan Communal de Sauvegarde (PCS).
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${filteredLots.length === 0 ? `
                <div class="col-span-full p-8 text-center glass-card rounded-2xl text-slate-500 italic">
                  Aucun lot matériel ne correspond à votre recherche « ${sq} ».
                </div>
              ` : filteredLots.map(lot => {
                const count = equipState[lot.id] || 0;
                const isOwned = count > 0;
                const canAfford = game.resources.money >= lot.price;
                const hasSpace = !hasStorage ? false : (usedStorage + lot.storageSize <= maxStorage);

                return `
                  <div class="p-5 rounded-3xl glass-card border-2 ${isOwned ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'} flex flex-col justify-between space-y-4 hover:shadow-md transition">
                    <div class="space-y-3">
                      <div class="flex items-start justify-between gap-2">
                        <div class="flex items-center gap-3">
                          <span class="text-3xl p-2 rounded-2xl bg-white shadow-sm border border-slate-100">${lot.icon}</span>
                          <div>
                            <h5 class="text-sm font-black text-slate-900 leading-snug">${lot.name}</h5>
                            <div class="flex items-center gap-1.5 mt-0.5">
                              <span class="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${lot.badgeColor}">
                                ${lot.badge}
                              </span>
                              <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                                📦 ${lot.storageSize} unités
                              </span>
                            </div>
                          </div>
                        </div>
                        <div class="text-right">
                          <span class="text-sm font-black text-slate-900 mono-num block">
                            ${lot.price.toLocaleString('fr-FR')} €
                          </span>
                          ${isOwned ? `
                            <span class="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 inline-block mt-0.5">
                              ✓ En stock (${count})
                            </span>
                          ` : ''}
                        </div>
                      </div>

                      <p class="text-xs text-slate-600 leading-relaxed">${lot.desc}</p>

                      <div class="p-3 rounded-2xl bg-white/90 border border-slate-200/80 text-[11px] font-medium text-slate-700 space-y-1">
                        <span class="text-pc-blue block uppercase text-[9px] tracking-wider font-black">Impact Opérationnel en Mission :</span>
                        <p class="text-slate-800 font-semibold">${lot.bonus}</p>
                      </div>
                    </div>

                    <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span class="text-[11px] font-semibold text-slate-400">
                        ${isOwned ? `Armé & disponible (x${count})` : 'Livraison en réserve'}
                      </span>
                      <button onclick="window.ProtecEquipements.buyEquipment(window.game, '${lot.id}')" ${(!canAfford || !hasSpace) ? 'disabled' : ''} class="px-4 py-2 rounded-xl text-xs font-black shadow transition flex items-center gap-1.5 ${(canAfford && hasSpace) ? 'bg-pc-blue hover:bg-pc-blue-light text-white active:scale-95 cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}">
                        <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                        <span>${isOwned ? 'Acheter un autre lot' : 'Acheter le lot'} (${lot.price} €)</span>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : `
          <!-- ONGLET 2 : CONDITIONS DE TRAVAIL & CONFORT RH -->
          <div class="space-y-4">
            <div class="p-3.5 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-start gap-3">
              <span class="text-xl">🛠️</span>
              <p class="text-xs text-blue-900 leading-relaxed">
                Ces équipements permanents modernisent la vie de l'antenne, préservent la santé des secouristes, réduisent l'usure mentale et accélèrent la gestion administrative.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${filteredWorkplace.length === 0 ? `
                <div class="col-span-full p-8 text-center glass-card rounded-2xl text-slate-500 italic">
                  Aucun équipement de confort ne correspond à votre recherche « ${sq} ».
                </div>
              ` : filteredWorkplace.map(item => {
                const count = equipState[item.id] || 0;
                const isOwned = count > 0;
                const canAfford = game.resources.money >= item.price;

                return `
                  <div class="p-5 rounded-3xl glass-card border-2 ${isOwned ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'} flex flex-col justify-between space-y-4 hover:shadow-md transition">
                    <div class="space-y-3">
                      <div class="flex items-start justify-between gap-2">
                        <div class="flex items-center gap-3">
                          <span class="text-3xl p-2 rounded-2xl bg-white shadow-sm border border-slate-100">${item.icon}</span>
                          <div>
                            <h5 class="text-sm font-black text-slate-900 leading-snug">${item.name}</h5>
                            <span class="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${item.badgeColor}">
                              ${item.badge}
                            </span>
                          </div>
                        </div>
                        <div class="text-right">
                          <span class="text-sm font-black text-slate-900 mono-num block">
                            ${item.price.toLocaleString('fr-FR')} €
                          </span>
                          ${isOwned ? `
                            <span class="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 inline-block mt-0.5">
                              ✓ Équipé (${count})
                            </span>
                          ` : ''}
                        </div>
                      </div>

                      <p class="text-xs text-slate-600 leading-relaxed">${item.desc}</p>

                      <div class="p-3 rounded-2xl bg-white/90 border border-slate-200/80 text-[11px] font-medium text-slate-700 space-y-1">
                        <span class="text-pc-blue block uppercase text-[9px] tracking-wider font-black">Bonus Conditions de Travail :</span>
                        <p class="text-slate-800 font-semibold">${item.bonus}</p>
                      </div>
                    </div>

                    <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span class="text-[11px] font-semibold text-slate-400">
                        ${isOwned ? 'Matériel actif à l’antenne' : 'Livraison immédiate'}
                      </span>
                      <button onclick="window.ProtecEquipements.buyEquipment(window.game, '${item.id}')" ${!canAfford ? 'disabled' : ''} class="px-4 py-2 rounded-xl text-xs font-black shadow transition flex items-center gap-1.5 ${canAfford ? 'bg-pc-blue hover:bg-pc-blue-light text-white active:scale-95 cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}">
                        <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                        <span>${isOwned ? 'Renouveler / Améliorer' : 'Acheter'} (${item.price} €)</span>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `}

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};
