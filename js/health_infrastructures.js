/**
 * PROTEC LIVE - MODULE DES INFRASTRUCTURES DE SANTÉ & D'URGENCE TERRITORIALES
 * 
 * Gestion des structures hospitalières, plateaux techniques et casernes de secours par département :
 * 1. Dictionnaire et référentiel des spécialités médicales hospitalières
 * 2. Base nationale des CHU, CH, SMUR et Casernes par département
 * 3. Enrichissement via OpenStreetMap Overpass (géolocalisation réelle et tags)
 * 4. Algorithme d'orientation des victimes en régulation SAMU 15 selon la pathologie
 * 5. Intégration avec les gardes SAMU/Pompiers et affichage UI
 * 
 * RÈGLE ABSOLUE : Les hôpitaux ne sont JAMAIS affichés comme marqueurs sur la carte Leaflet.
 */

(function () {
  'use strict';

  // 1. RÉFÉRENTIEL DES SPÉCIALITÉS MÉDICALES D'URGENCE
  const MEDICAL_SPECIALTIES = {
    urgences_generales: {
      id: 'urgences_generales',
      label: 'Urgences Générales & SAU',
      icon: 'stethoscope',
      shortLabel: 'SAU Général',
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
      badgeColor: '#1d4ed8',
      desc: 'Accueil polyvalent des urgences médico-chirurgicales adultes 24h/24.'
    },
    pediatrie: {
      id: 'pediatrie',
      label: 'Urgences Pédiatriques',
      icon: 'baby',
      shortLabel: 'Pédiatrie',
      badgeClass: 'bg-pink-100 text-pink-900 border-pink-300',
      badgeColor: '#be185d',
      desc: 'Prise en charge spécialisée pour nourrissons, enfants et adolescents (< 16 ans).'
    },
    cardiologie: {
      id: 'cardiologie',
      label: 'Cardiologie & USIC (Infarctus)',
      icon: 'heart-pulse',
      shortLabel: 'Cardiologie / USIC',
      badgeClass: 'bg-red-100 text-red-900 border-red-300',
      badgeColor: '#b91c1c',
      desc: 'Unité de Soins Intensifs Cardiologiques, angioplastie et prise en charge SCA / ACR.'
    },
    neurologie: {
      id: 'neurologie',
      label: 'Neurologie & UNV (AVC)',
      icon: 'brain',
      shortLabel: 'UNV (AVC)',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
      badgeColor: '#7e22ce',
      desc: 'Unité Neuro-Vasculaire de recours régional, thrombolyse et thrombectomie mécanique.'
    },
    traumatologie: {
      id: 'traumatologie',
      label: 'Trauma Center & Déchocage',
      icon: 'shield-alert',
      shortLabel: 'Trauma Center',
      badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
      badgeColor: '#c2410c',
      desc: 'Prise en charge polytraumatisés graves, déchocage lourd et chirurgie d’urgence.'
    },
    sos_main: {
      id: 'sos_main',
      label: 'SOS Main & Microchirurgie',
      icon: 'hand',
      shortLabel: 'SOS Main FESUM',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      badgeColor: '#b45309',
      desc: 'Centre agréé FESUM pour traumatismes de la main, réimplantations et sections digitales.'
    },
    brules: {
      id: 'brules',
      label: 'Centre Grands Brûlés (CTB)',
      icon: 'flame',
      shortLabel: 'Grands Brûlés',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
      badgeColor: '#be123c',
      desc: 'Traitement hautement spécialisé des brûlures thermiques, chimiques et étendues.'
    },
    reanimation: {
      id: 'reanimation',
      label: 'Réanimation & Soins Critiques',
      icon: 'activity',
      shortLabel: 'Réanimation',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      badgeColor: '#047857',
      desc: 'Lits de réanimation polyvalente avec assistance respiratoire et hémodynamique lourde.'
    },
    psychiatrie: {
      id: 'psychiatrie',
      label: 'Urgences Psychiatriques & CUMP',
      icon: 'smile',
      shortLabel: 'Psychiatrie / CUMP',
      badgeClass: 'bg-violet-100 text-violet-900 border-violet-300',
      badgeColor: '#6d28d9',
      desc: 'Prise en charge de crises psychiques aiguës et soutien médico-psychologique d’urgence.'
    },
    maternite: {
      id: 'maternite',
      label: 'Maternité & Néonatalogie (Type 3)',
      icon: 'heart',
      shortLabel: 'Maternité Type 3',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
      badgeColor: '#9d174d',
      desc: 'Urgences obstétricales, accouchements inopinés et réanimation néonatale.'
    }
  };

  // 2. BASE NATIONALE DE RÉFÉRENCE DES INFRASTRUCTURES PAR DÉPARTEMENT
  const DEFAULT_DEPARTMENT_DATA = {
    // 54 Meurthe-et-Moselle (Nancy)
    '54': {
      deptCode: '54',
      deptName: 'Meurthe-et-Moselle',
      samuCenter: 'SAMU 54 - CRRA 15 Nancy',
      hospitals: [
        {
          id: 'hosp-54-central',
          name: 'CHRU de Nancy - Hôpital Central',
          type: 'chu',
          city: 'Nancy',
          address: '29 Avenue du Maréchal de Lattre de Tassigny, 54000 Nancy',
          lat: 48.6882,
          lng: 6.1895,
          hasSmur: true,
          smurVehiclesCount: 3,
          capacity: 45,
          samuStation: true,
          specialites: ['urgences_generales', 'traumatologie', 'cardiologie', 'neurologie', 'sos_main', 'reanimation'],
          description: 'Centre Hospitalier Universitaire de référence et Trauma Center régional. Siège du SAMU 54 et déchocage.'
        },
        {
          id: 'hosp-54-brabois-enfants',
          name: 'CHRU de Nancy - Hôpital d’Enfants (Brabois)',
          type: 'chu',
          city: 'Vandœuvre-lès-Nancy',
          address: 'Rue du Morvan, 54511 Vandœuvre-lès-Nancy',
          lat: 48.6491,
          lng: 6.1482,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 35,
          samuStation: false,
          specialites: ['urgences_generales', 'pediatrie', 'maternite', 'reanimation'],
          description: 'Pôle Mère-Enfant de référence Lorraine avec Urgences Pédiatriques, Maternité Type 3 et SMUR Pédiatrique.'
        },
        {
          id: 'hosp-54-luneville',
          name: 'Centre Hospitalier de Lunéville',
          type: 'ch',
          city: 'Lunéville',
          address: '25 Rue Émile Gallé, 54300 Lunéville',
          lat: 48.5915,
          lng: 6.4952,
          hasSmur: true,
          smurVehiclesCount: 1,
          capacity: 20,
          samuStation: false,
          specialites: ['urgences_generales', 'cardiologie'],
          description: 'Hôpital général de secteur avec antenne SMUR et urgences médico-chirurgicales polyvalentes.'
        },
        {
          id: 'hosp-54-toul',
          name: 'Centre Hospitalier de Toul (Saint-Charles)',
          type: 'ch',
          city: 'Toul',
          address: '1 Cours Raymond Poincaré, 54200 Toul',
          lat: 48.6744,
          lng: 5.8856,
          hasSmur: true,
          smurVehiclesCount: 1,
          capacity: 18,
          samuStation: false,
          specialites: ['urgences_generales'],
          description: 'Urgences de proximité du Toulois avec service de médecine d’urgence et SMUR de secteur.'
        },
        {
          id: 'hosp-54-cump-cpg',
          name: 'Centre Psychothérapique de Nancy-Laxou (CPN)',
          type: 'ch',
          city: 'Laxou',
          address: '1 Rue du Docteur Archambault, 54520 Laxou',
          lat: 48.6837,
          lng: 6.1425,
          hasSmur: false,
          smurVehiclesCount: 0,
          capacity: 25,
          samuStation: false,
          specialites: ['psychiatrie'],
          description: 'Pôle de crise psychiatrique et base de ralliement de la CUMP 54 (Cellule d’Urgence Médico-Psychologique).'
        }
      ],
      casernes: [
        { id: 'cas-54-gentilly', name: 'CSP Nancy-Gentilly', type: 'CSP', city: 'Nancy', lat: 48.7052, lng: 6.1523, authority: 'SDIS' },
        { id: 'cas-54-tomblaine', name: 'CSP Nancy-Tomblaine', type: 'CSP', city: 'Tomblaine', lat: 48.6881, lng: 6.2084, authority: 'SDIS' },
        { id: 'cas-54-vandoeuvre', name: 'CS Vandœuvre', type: 'CIS', city: 'Vandœuvre-lès-Nancy', lat: 48.6572, lng: 6.1712, authority: 'SDIS' },
        { id: 'cas-54-toul', name: 'CS Toul', type: 'CIS', city: 'Toul', lat: 48.6720, lng: 5.8810, authority: 'SDIS' },
        { id: 'cas-54-luneville', name: 'CS Lunéville', type: 'CIS', city: 'Lunéville', lat: 48.5890, lng: 6.4910, authority: 'SDIS' }
      ]
    },

    // 75 Paris
    '75': {
      deptCode: '75',
      deptName: 'Paris',
      samuCenter: 'SAMU 75 - Hôpital Necker',
      hospitals: [
        {
          id: 'hosp-75-pitie',
          name: 'AP-HP Sorbonne Université - Pitié-Salpêtrière',
          type: 'chu',
          city: 'Paris 13e',
          address: '47-83 Boulevard de l’Hôpital, 75013 Paris',
          lat: 48.8385,
          lng: 2.3650,
          hasSmur: true,
          smurVehiclesCount: 4,
          capacity: 65,
          samuStation: true,
          specialites: ['urgences_generales', 'traumatologie', 'cardiologie', 'neurologie', 'reanimation'],
          description: 'Plus grand Trauma Center de France, pôle mondial en neurologie / AVC (UNV) et cardiologie interventionnelle.'
        },
        {
          id: 'hosp-75-necker',
          name: 'AP-HP Hôpital Necker - Enfants Malades',
          type: 'chu',
          city: 'Paris 15e',
          address: '149 Rue de Sèvres, 75015 Paris',
          lat: 48.8458,
          lng: 2.3155,
          hasSmur: true,
          smurVehiclesCount: 3,
          capacity: 50,
          samuStation: true,
          specialites: ['urgences_generales', 'pediatrie', 'maternite', 'reanimation'],
          description: 'Premier hôpital pédiatrique au monde. Siège du SAMU 75 de Paris et SMUR Pédiatrique de référence IDF.'
        },
        {
          id: 'hosp-75-saint-louis',
          name: 'AP-HP Hôpital Saint-Louis (Centre Grands Brûlés)',
          type: 'chu',
          city: 'Paris 10e',
          address: '1 Avenue Claude Vellefaux, 75010 Paris',
          lat: 48.8741,
          lng: 2.3684,
          hasSmur: false,
          smurVehiclesCount: 0,
          capacity: 30,
          samuStation: false,
          specialites: ['urgences_generales', 'brules', 'sos_main'],
          description: 'Centre de référence national pour le Traitement des Grands Brûlés (CTB) et chirurgie plastique/SOS Main.'
        },
        {
          id: 'hosp-75-lariboisiere',
          name: 'AP-HP Hôpital Lariboisière',
          type: 'chu',
          city: 'Paris 10e',
          address: '2 Rue Ambroise Paré, 75010 Paris',
          lat: 48.8827,
          lng: 2.3533,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 40,
          samuStation: false,
          specialites: ['urgences_generales', 'neurologie', 'sos_main', 'psychiatrie'],
          description: 'Centre d’urgence du nord parisien avec SOS Main FESUM de référence, neurochirurgie et accueil psychiatrique.'
        },
        {
          id: 'hosp-75-hegp',
          name: 'AP-HP Hôpital Européen Georges-Pompidou (HEGP)',
          type: 'chu',
          city: 'Paris 15e',
          address: '20 Rue Leblanc, 75015 Paris',
          lat: 48.8388,
          lng: 2.2736,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 40,
          samuStation: false,
          specialites: ['urgences_generales', 'traumatologie', 'cardiologie', 'reanimation'],
          description: 'Trauma Center de l’ouest parisien et pôle cardiologique et vasculaire d’urgence de premier plan.'
        }
      ],
      casernes: [
        { id: 'cas-75-massena', name: 'Caserne Masséna (BSPP)', type: 'CSP', city: 'Paris 13e', lat: 48.8228, lng: 2.3782, authority: 'BSPP' },
        { id: 'cas-75-chaligny', name: 'Caserne Chaligny (BSPP)', type: 'CSP', city: 'Paris 12e', lat: 48.8504, lng: 2.3842, authority: 'BSPP' },
        { id: 'cas-75-port-royal', name: 'Caserne Port-Royal (BSPP)', type: 'CIS', city: 'Paris 5e', lat: 48.8382, lng: 2.3421, authority: 'BSPP' },
        { id: 'cas-75-menilmontant', name: 'Caserne Ménilmontant (BSPP)', type: 'CIS', city: 'Paris 20e', lat: 48.8682, lng: 2.3905, authority: 'BSPP' },
        { id: 'cas-75-dauphine', name: 'Caserne Dauphine (BSPP)', type: 'CIS', city: 'Paris 16e', lat: 48.8710, lng: 2.2750, authority: 'BSPP' }
      ]
    },

    // 92 Hauts-de-Seine (Petite Couronne BSPP)
    '92': {
      deptCode: '92',
      deptName: 'Hauts-de-Seine',
      samuCenter: 'SAMU 92 - Hôpital Raymond-Poincaré (Garches)',
      hospitals: [
        {
          id: 'hosp-92-beaujon',
          name: 'AP-HP Hôpital Beaujon',
          type: 'chu',
          city: 'Clichy',
          address: '100 Boulevard du Général Leclerc, 92110 Clichy',
          lat: 48.9075,
          lng: 2.3082,
          hasSmur: true,
          smurVehiclesCount: 3,
          capacity: 45,
          samuStation: true,
          specialites: ['urgences_generales', 'traumatologie', 'reanimation'],
          description: 'Trauma Center de niveau 1 majeur pour le nord-ouest parisien et la petite couronne.'
        },
        {
          id: 'hosp-92-ambroise-pare',
          name: 'AP-HP Hôpital Ambroise-Paré',
          type: 'chu',
          city: 'Boulogne-Billancourt',
          address: '9 Avenue Charles de Gaulle, 92100 Boulogne-Billancourt',
          lat: 48.8420,
          lng: 2.2350,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 35,
          samuStation: false,
          specialites: ['urgences_generales', 'cardiologie', 'sos_main'],
          description: 'Urgences et chirurgie orthopédique de référence avec unité de soins intensifs cardiologiques.'
        },
        {
          id: 'hosp-92-beclere',
          name: 'AP-HP Hôpital Antoine-Béclère',
          type: 'chu',
          city: 'Clamart',
          address: '157 Rue de la Porte de Trivaux, 92140 Clamart',
          lat: 48.7915,
          lng: 2.2470,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 35,
          samuStation: false,
          specialites: ['urgences_generales', 'pediatrie', 'maternite'],
          description: 'Pôle d’urgences pédiatriques et Maternité Type 3 de recours pour le sud des Hauts-de-Seine.'
        }
      ],
      casernes: [
        { id: 'cas-92-nanterre', name: 'Caserne Nanterre (BSPP)', type: 'CSP', city: 'Nanterre', lat: 48.8920, lng: 2.2060, authority: 'BSPP' },
        { id: 'cas-92-boulogne', name: 'Caserne Boulogne (BSPP)', type: 'CIS', city: 'Boulogne-Billancourt', lat: 48.8350, lng: 2.2410, authority: 'BSPP' },
        { id: 'cas-92-clamart', name: 'Caserne Clamart (BSPP)', type: 'CIS', city: 'Clamart', lat: 48.7990, lng: 2.2610, authority: 'BSPP' }
      ]
    },

    // 93 Seine-Saint-Denis (Petite Couronne BSPP)
    '93': {
      deptCode: '93',
      deptName: 'Seine-Saint-Denis',
      samuCenter: 'SAMU 93 - Hôpital Avicenne (Bobigny)',
      hospitals: [
        {
          id: 'hosp-93-avicenne',
          name: 'AP-HP Hôpital Avicenne',
          type: 'chu',
          city: 'Bobigny',
          address: '125 Rue de Stalingrad, 93000 Bobigny',
          lat: 48.9142,
          lng: 2.4243,
          hasSmur: true,
          smurVehiclesCount: 3,
          capacity: 50,
          samuStation: true,
          specialites: ['urgences_generales', 'traumatologie', 'cardiologie', 'reanimation', 'neurologie'],
          description: 'Hôpital Universitaire et Trauma Center du 93, siège du SAMU 93 départemental.'
        },
        {
          id: 'hosp-93-jean-verdier',
          name: 'AP-HP Hôpital Jean-Verdier',
          type: 'chu',
          city: 'Bondy',
          address: 'Avenue du 14 Juillet, 93140 Bondy',
          lat: 48.8970,
          lng: 2.4860,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 35,
          samuStation: false,
          specialites: ['urgences_generales', 'pediatrie', 'maternite'],
          description: 'Service d’urgences pédiatriques et pôle mère-enfant de Seine-Saint-Denis.'
        },
        {
          id: 'hosp-93-delafontaine',
          name: 'Centre Hospitalier de Saint-Denis (Delafontaine)',
          type: 'ch',
          city: 'Saint-Denis',
          address: '2 Rue du Docteur Delafontaine, 93200 Saint-Denis',
          lat: 48.9410,
          lng: 2.3720,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 40,
          samuStation: false,
          specialites: ['urgences_generales', 'cardiologie', 'sos_main'],
          description: 'Grand centre hospitalier général avec SAU haute intensité et antenne SMUR.'
        }
      ],
      casernes: [
        { id: 'cas-93-saint-denis', name: 'Caserne Saint-Denis (BSPP)', type: 'CSP', city: 'Saint-Denis', lat: 48.9350, lng: 2.3580, authority: 'BSPP' },
        { id: 'cas-93-montreuil', name: 'Caserne Montreuil (BSPP)', type: 'CIS', city: 'Montreuil', lat: 48.8620, lng: 2.4410, authority: 'BSPP' },
        { id: 'cas-93-bobigny', name: 'Caserne Bobigny (BSPP)', type: 'CIS', city: 'Bobigny', lat: 48.9080, lng: 2.4400, authority: 'BSPP' }
      ]
    },

    // 94 Val-de-Marne (Petite Couronne BSPP)
    '94': {
      deptCode: '94',
      deptName: 'Val-de-Marne',
      samuCenter: 'SAMU 94 - Hôpital Henri-Mondor (Créteil)',
      hospitals: [
        {
          id: 'hosp-94-mondor',
          name: 'AP-HP Hôpital Henri-Mondor',
          type: 'chu',
          city: 'Créteil',
          address: '51 Avenue du Maréchal de Lattre de Tassigny, 94010 Créteil',
          lat: 48.7963,
          lng: 2.4512,
          hasSmur: true,
          smurVehiclesCount: 3,
          capacity: 55,
          samuStation: true,
          specialites: ['urgences_generales', 'traumatologie', 'cardiologie', 'neurologie', 'reanimation'],
          description: 'Trauma Center majeur du sud francilien, siège du SAMU 94 et grand pôle cardiovasculaire / UNV.'
        },
        {
          id: 'hosp-94-bicetre',
          name: 'AP-HP Hôpital Bicêtre',
          type: 'chu',
          city: 'Le Kremlin-Bicêtre',
          address: '78 Rue du Général Leclerc, 94270 Le Kremlin-Bicêtre',
          lat: 48.8115,
          lng: 2.3540,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 45,
          samuStation: false,
          specialites: ['urgences_generales', 'pediatrie', 'neurologie', 'maternite'],
          description: 'Centre de référence pour les urgences pédiatriques spécialisées et la neurochirurgie pédiatrique.'
        }
      ],
      casernes: [
        { id: 'cas-94-creteil', name: 'Caserne Créteil (BSPP)', type: 'CSP', city: 'Créteil', lat: 48.7880, lng: 2.4600, authority: 'BSPP' },
        { id: 'cas-94-vincennes', name: 'Caserne Vincennes (BSPP)', type: 'CIS', city: 'Vincennes', lat: 48.8470, lng: 2.4380, authority: 'BSPP' },
        { id: 'cas-94-villejuif', name: 'Caserne Villejuif (BSPP)', type: 'CIS', city: 'Villejuif', lat: 48.7930, lng: 2.3610, authority: 'BSPP' }
      ]
    },

    // 13 Bouches-du-Rhône (Marseille BMPM & SDIS 13)
    '13': {
      deptCode: '13',
      deptName: 'Bouches-du-Rhône',
      samuCenter: 'SAMU 13 - Hôpital de La Timone (Marseille)',
      hospitals: [
        {
          id: 'hosp-13-timone',
          name: 'AP-HM Hôpital de La Timone',
          type: 'chu',
          city: 'Marseille',
          address: '264 Rue Saint-Pierre, 13005 Marseille',
          lat: 43.2894,
          lng: 5.4011,
          hasSmur: true,
          smurVehiclesCount: 4,
          capacity: 65,
          samuStation: true,
          specialites: ['urgences_generales', 'pediatrie', 'traumatologie', 'cardiologie', 'neurologie', 'sos_main', 'reanimation'],
          description: 'Hôpital amiral AP-HM, plus grand centre d’urgences de la région PACA, Trauma Center et Timone Enfants.'
        },
        {
          id: 'hosp-13-nord',
          name: 'AP-HM Hôpital Nord',
          type: 'chu',
          city: 'Marseille',
          address: 'Chemin des Bourrely, 13015 Marseille',
          lat: 43.3712,
          lng: 5.3619,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 45,
          samuStation: false,
          specialites: ['urgences_generales', 'brules', 'maternite', 'traumatologie'],
          description: 'Centre Régional de Traitement des Grands Brûlés (CTB PACA/Corse) et Trauma Center du nord marseillais.'
        },
        {
          id: 'hosp-13-aix',
          name: 'Centre Hospitalier du Pays d’Aix',
          type: 'ch',
          city: 'Aix-en-Provence',
          address: 'Avenue des Tamaris, 13100 Aix-en-Provence',
          lat: 43.5350,
          lng: 5.4410,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 35,
          samuStation: false,
          specialites: ['urgences_generales', 'cardiologie', 'pediatrie'],
          description: 'Centre hospitalier pivot du Pays d’Aix avec urgences adultes et pédiatriques et antenne SMUR.'
        }
      ],
      casernes: [
        { id: 'cas-13-plombieres', name: 'Caserne Plombières (BMPM)', type: 'CSP', city: 'Marseille 3e', lat: 43.3150, lng: 5.3850, authority: 'BMPM' },
        { id: 'cas-13-louvain', name: 'Caserne Louvain (BMPM)', type: 'CSP', city: 'Marseille 8e', lat: 43.2720, lng: 5.3900, authority: 'BMPM' },
        { id: 'cas-13-st-pierre', name: 'Caserne Saint-Pierre (BMPM)', type: 'CIS', city: 'Marseille 5e', lat: 43.2870, lng: 5.4120, authority: 'BMPM' },
        { id: 'cas-13-aix', name: 'CSP Aix-en-Provence (SDIS 13)', type: 'CSP', city: 'Aix-en-Provence', lat: 43.5180, lng: 5.4320, authority: 'SDIS' }
      ]
    },

    // 69 Rhône (Lyon HCL)
    '69': {
      deptCode: '69',
      deptName: 'Rhône & Métropole de Lyon',
      samuCenter: 'SAMU 69 - Hôpital Édouard Herriot (Lyon)',
      hospitals: [
        {
          id: 'hosp-69-herriot',
          name: 'HCL Hôpital Édouard Herriot (Pavillon H)',
          type: 'chu',
          city: 'Lyon 3e',
          address: '5 Place d’Arsonval, 69003 Lyon',
          lat: 45.7438,
          lng: 4.8821,
          hasSmur: true,
          smurVehiclesCount: 4,
          capacity: 60,
          samuStation: true,
          specialites: ['urgences_generales', 'traumatologie', 'brules', 'sos_main', 'reanimation'],
          description: 'Hôpital historique lyonnais, grand Trauma Center et Centre des Grands Brûlés Pierre Colson.'
        },
        {
          id: 'hosp-69-hfme',
          name: 'HCL Hôpital Femme Mère Enfant (HFME)',
          type: 'chu',
          city: 'Bron',
          address: '59 Boulevard Pinel, 69500 Bron',
          lat: 45.7441,
          lng: 4.8988,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 45,
          samuStation: false,
          specialites: ['urgences_generales', 'pediatrie', 'maternite', 'reanimation'],
          description: 'Pôle pédiatrique d’excellence d’Auvergne-Rhône-Alpes avec réanimation néonatale et maternité Type 3.'
        },
        {
          id: 'hosp-69-lyon-sud',
          name: 'HCL Centre Hospitalier Lyon Sud',
          type: 'chu',
          city: 'Pierre-Bénite',
          address: '165 Chemin du Grand Revoyet, 69495 Pierre-Bénite',
          lat: 45.7001,
          lng: 4.8192,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 40,
          samuStation: false,
          specialites: ['urgences_generales', 'cardiologie', 'neurologie'],
          description: 'Centre hospitalier universitaire du sud lyonnais avec soins intensifs de cardiologie et UNV.'
        }
      ],
      casernes: [
        { id: 'cas-69-gerland', name: 'Caserne Lyon-Gerland (SDMIS)', type: 'CSP', city: 'Lyon 7e', lat: 45.7310, lng: 4.8350, authority: 'SDIS' },
        { id: 'cas-69-corneille', name: 'Caserne Lyon-Corneille (SDMIS)', type: 'CSP', city: 'Lyon 3e', lat: 45.7610, lng: 4.8480, authority: 'SDIS' },
        { id: 'cas-69-villeurbanne', name: 'Caserne Villeurbanne-Cusset', type: 'CIS', city: 'Villeurbanne', lat: 45.7650, lng: 4.9010, authority: 'SDIS' }
      ]
    },

    // 33 Gironde (Bordeaux)
    '33': {
      deptCode: '33',
      deptName: 'Gironde',
      samuCenter: 'SAMU 33 - CHU Pellegrin (Bordeaux)',
      hospitals: [
        {
          id: 'hosp-33-pellegrin',
          name: 'CHU de Bordeaux - Groupe Hospitalier Pellegrin',
          type: 'chu',
          city: 'Bordeaux',
          address: 'Place Amélie Raba Léon, 33076 Bordeaux',
          lat: 44.8299,
          lng: -0.6053,
          hasSmur: true,
          smurVehiclesCount: 4,
          capacity: 65,
          samuStation: true,
          specialites: ['urgences_generales', 'pediatrie', 'traumatologie', 'brules', 'neurologie', 'reanimation'],
          description: 'Hôpital Tripode Pellegrin : Trauma Center niveau 1 d’Aquitaine, Centre Grands Brûlés et Hôpital des Enfants.'
        },
        {
          id: 'hosp-33-haut-leveque',
          name: 'CHU de Bordeaux - Hôpital Haut-Lévêque',
          type: 'chu',
          city: 'Pessac',
          address: 'Avenue du Haut-Lévêque, 33604 Pessac',
          lat: 44.7920,
          lng: -0.6480,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 45,
          samuStation: false,
          specialites: ['urgences_generales', 'cardiologie', 'reanimation'],
          description: 'Institut de rythmologie et cardiologie de renommée mondiale (LIRYC), cathétérisme et soins intensifs.'
        },
        {
          id: 'hosp-33-st-andre',
          name: 'CHU de Bordeaux - Hôpital Saint-André',
          type: 'chu',
          city: 'Bordeaux Centre',
          address: '1 Rue Jean Burguet, 33000 Bordeaux',
          lat: 44.8344,
          lng: -0.5815,
          hasSmur: false,
          smurVehiclesCount: 0,
          capacity: 30,
          samuStation: false,
          specialites: ['urgences_generales', 'sos_main', 'psychiatrie'],
          description: 'Urgences de centre-ville et centre SOS Main FESUM de référence de Bordeaux.'
        }
      ],
      casernes: [
        { id: 'cas-33-ornano', name: 'CSP Bordeaux-Ornano', type: 'CSP', city: 'Bordeaux', lat: 44.8320, lng: -0.5930, authority: 'SDIS' },
        { id: 'cas-33-bruges', name: 'CS Bruges', type: 'CIS', city: 'Bruges', lat: 44.8780, lng: -0.6020, authority: 'SDIS' },
        { id: 'cas-33-merignac', name: 'CS Mérignac', type: 'CIS', city: 'Mérignac', lat: 44.8390, lng: -0.6550, authority: 'SDIS' }
      ]
    },

    // 59 Nord (Lille)
    '59': {
      deptCode: '59',
      deptName: 'Nord',
      samuCenter: 'SAMU 59 - CHU de Lille (Salengro)',
      hospitals: [
        {
          id: 'hosp-59-salengro',
          name: 'CHU de Lille - Hôpital Roger Salengro',
          type: 'chu',
          city: 'Lille',
          address: 'Rue Émile Laine, 59037 Lille',
          lat: 50.6095,
          lng: 3.0338,
          hasSmur: true,
          smurVehiclesCount: 4,
          capacity: 65,
          samuStation: true,
          specialites: ['urgences_generales', 'traumatologie', 'neurologie', 'sos_main', 'reanimation'],
          description: 'Trauma Center de référence des Hauts-de-France, pôle d’urgence et neurosciences régionales.'
        },
        {
          id: 'hosp-59-flandre',
          name: 'CHU de Lille - Hôpital Jeanne de Flandre',
          type: 'chu',
          city: 'Lille',
          address: 'Avenue Eugène Avinée, 59000 Lille',
          lat: 50.6070,
          lng: 3.0290,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 40,
          samuStation: false,
          specialites: ['pediatrie', 'maternite', 'reanimation'],
          description: 'Hôpital mère-enfant et urgences pédiatriques de recours régional pour les Hauts-de-France.'
        },
        {
          id: 'hosp-59-cardiologique',
          name: 'CHU de Lille - Institut Cœur Poumon',
          type: 'chu',
          city: 'Lille',
          address: 'Boulevard du Professeur Jules Leclercq, 59000 Lille',
          lat: 50.6080,
          lng: 3.0350,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 45,
          samuStation: false,
          specialites: ['urgences_generales', 'cardiologie', 'reanimation'],
          description: 'Grand centre cardiovasculaire du nord de la France, angioplastie primaire 24h/24.'
        }
      ],
      casernes: [
        { id: 'cas-59-bouvines', name: 'CSP Lille-Bouvines', type: 'CSP', city: 'Lille', lat: 50.6220, lng: 3.0650, authority: 'SDIS' },
        { id: 'cas-59-malus', name: 'CS Lille-Malus', type: 'CIS', city: 'Lille', lat: 50.6380, lng: 3.0720, authority: 'SDIS' },
        { id: 'cas-59-tourcoing', name: 'CSP Tourcoing', type: 'CSP', city: 'Tourcoing', lat: 50.7250, lng: 3.1550, authority: 'SDIS' }
      ]
    },

    // 67 Bas-Rhin (Strasbourg)
    '67': {
      deptCode: '67',
      deptName: 'Bas-Rhin',
      samuCenter: 'SAMU 67 - HUS Hautepierre (Strasbourg)',
      hospitals: [
        {
          id: 'hosp-67-hautepierre',
          name: 'Hôpitaux Universitaires de Strasbourg - Hautepierre',
          type: 'chu',
          city: 'Strasbourg',
          address: '1 Avenue Molière, 67200 Strasbourg',
          lat: 48.5912,
          lng: 7.7051,
          hasSmur: true,
          smurVehiclesCount: 4,
          capacity: 60,
          samuStation: true,
          specialites: ['urgences_generales', 'pediatrie', 'traumatologie', 'sos_main', 'neurologie', 'reanimation'],
          description: 'Grand Trauma Center d’Alsace, urgences médico-chirurgicales adultes et pédiatriques et SOS Main.'
        },
        {
          id: 'hosp-67-nhc',
          name: 'HUS - Nouvel Hôpital Civil (NHC)',
          type: 'chu',
          city: 'Strasbourg',
          address: '1 Place de l’Hôpital, 67091 Strasbourg',
          lat: 48.5771,
          lng: 7.7408,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 45,
          samuStation: false,
          specialites: ['urgences_generales', 'cardiologie', 'reanimation'],
          description: 'Pôle cardio-vasculaire et thoracique de Strasbourg, soins intensifs de pointe.'
        }
      ],
      casernes: [
        { id: 'cas-67-ouest', name: 'CSP Strasbourg-Ouest', type: 'CSP', city: 'Strasbourg', lat: 48.5850, lng: 7.7120, authority: 'SDIS' },
        { id: 'cas-67-sud', name: 'CS Strasbourg-Sud', type: 'CIS', city: 'Illkirch-Graffenstaden', lat: 48.5420, lng: 7.7310, authority: 'SDIS' },
        { id: 'cas-67-nord', name: 'CS Strasbourg-Nord', type: 'CIS', city: 'Schiltigheim', lat: 48.6110, lng: 7.7430, authority: 'SDIS' }
      ]
    },

    // 31 Haute-Garonne (Toulouse)
    '31': {
      deptCode: '31',
      deptName: 'Haute-Garonne',
      samuCenter: 'SAMU 31 - CHU Purpan (Toulouse)',
      hospitals: [
        {
          id: 'hosp-31-purpan',
          name: 'CHU de Toulouse - Hôpital Purpan (Urgences)',
          type: 'chu',
          city: 'Toulouse',
          address: 'Place du Docteur Joseph Baylac, 31059 Toulouse',
          lat: 43.6112,
          lng: 1.4005,
          hasSmur: true,
          smurVehiclesCount: 4,
          capacity: 60,
          samuStation: true,
          specialites: ['urgences_generales', 'pediatrie', 'traumatologie', 'brules', 'sos_main', 'reanimation'],
          description: 'Trauma Center de référence Midi-Pyrénées, Hôpital des Enfants et Centre Régional des Brûlés.'
        },
        {
          id: 'hosp-31-rangueil',
          name: 'CHU de Toulouse - Hôpital Rangueil',
          type: 'chu',
          city: 'Toulouse',
          address: '1 Avenue du Professeur Jean Poulhès, 31400 Toulouse',
          lat: 43.5583,
          lng: 1.4642,
          hasSmur: true,
          smurVehiclesCount: 2,
          capacity: 45,
          samuStation: false,
          specialites: ['urgences_generales', 'cardiologie', 'neurologie', 'reanimation'],
          description: 'Pôle cardiologique et neurologique majeur avec unité de soins intensifs et UNV.'
        }
      ],
      casernes: [
        { id: 'cas-31-vion', name: 'CSP Toulouse-Vion', type: 'CSP', city: 'Toulouse', lat: 43.5950, lng: 1.4310, authority: 'SDIS' },
        { id: 'cas-31-ramonville', name: 'CS Ramonville', type: 'CIS', city: 'Ramonville-Saint-Agne', lat: 43.5410, lng: 1.4720, authority: 'SDIS' },
        { id: 'cas-31-colomiers', name: 'CS Colomiers', type: 'CIS', city: 'Colomiers', lat: 43.6140, lng: 1.3320, authority: 'SDIS' }
      ]
    },

    // 44 Loire-Atlantique (Nantes)
    '44': {
      deptCode: '44',
      deptName: 'Loire-Atlantique',
      samuCenter: 'SAMU 44 - Hôtel-Dieu (Nantes)',
      hospitals: [
        {
          id: 'hosp-44-hotel-dieu',
          name: 'CHU de Nantes - Hôtel-Dieu',
          type: 'chu',
          city: 'Nantes',
          address: '1 Place Alexis-Ricordeau, 44093 Nantes',
          lat: 47.2120,
          lng: -1.5528,
          hasSmur: true,
          smurVehiclesCount: 4,
          capacity: 55,
          samuStation: true,
          specialites: ['urgences_generales', 'traumatologie', 'brules', 'cardiologie', 'neurologie', 'sos_main', 'reanimation'],
          description: 'Hôpital central de Nantes, Trauma Center régional, Centre des Brûlés et siège du SAMU 44.'
        },
        {
          id: 'hosp-44-mere-enfant',
          name: 'CHU de Nantes - Hôpital Mère-Enfant',
          type: 'chu',
          city: 'Nantes',
          address: '38 Boulevard Jean Monnet, 44093 Nantes',
          lat: 47.2110,
          lng: -1.5540,
          hasSmur: true,
          smurVehiclesCount: 1,
          capacity: 35,
          samuStation: false,
          specialites: ['pediatrie', 'maternite', 'reanimation'],
          description: 'Urgences médico-chirurgicales pédiatriques et Maternité Type 3 de Loire-Atlantique.'
        }
      ],
      casernes: [
        { id: 'cas-44-gouze', name: 'CSP Nantes-Gouzé', type: 'CSP', city: 'Nantes', lat: 47.2180, lng: -1.5380, authority: 'SDIS' },
        { id: 'cas-44-nord', name: 'CS Nantes-Nord', type: 'CIS', city: 'Nantes', lat: 47.2510, lng: -1.5620, authority: 'SDIS' },
        { id: 'cas-44-reze', name: 'CS Rezé', type: 'CIS', city: 'Rezé', lat: 47.1850, lng: -1.5450, authority: 'SDIS' }
      ]
    }
  };

  // 3. FONCTIONS UTILITAIRES & ANALYSE DE LA PATHOLOGIE D'UNE VICTIME
  function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Analyse intelligente d'une mission ou d'un bilan pour détecter la spécialité médicale requise.
   */
  function detectRequiredMedicalSpecialty(mission) {
    if (!mission) return 'urgences_generales';

    const textToScan = [
      mission.title || '',
      mission.desc || '',
      mission.description || '',
      mission.scenarioType || '',
      mission.pathology || '',
      mission.victimType || '',
      mission.bilanText || ''
    ].join(' ').toLowerCase();

    // 1. PÉDIATRIE (Nourrisson, enfant, bébé, bambin, scolaire, crèche, < 15 ans)
    if (
      /enfant|nourrisson|b[ée]b[ée]|p[ée]diatr|scolaire|cr[èe]che|bambin|ado|jeune fille|gar[çc]onnet|nouveau-n[ée]|maternelle|coll[èe]ge|primaire/i.test(textToScan) ||
      (mission.victimAge && mission.victimAge < 16)
    ) {
      return 'pediatrie';
    }

    // 2. GRANDS BRÛLÉS (Centre CTB)
    if (
      /br[ûu]l[ée]|flammes|explosion|vitriol|acide|hydrocarbure|immolation|[ée]lectrisation|arc [ée]lectrique|br[ûu]lure/i.test(textToScan)
    ) {
      return 'brules';
    }

    // 3. SOS MAIN & MICROCHIRURGIE (Section, amputation, main écrasée, scie)
    if (
      /main|doigt|pouce|section digital|amputation|scie circulaire|écrasement main|plaie par vitre main|phalange|arrachement/i.test(textToScan)
    ) {
      return 'sos_main';
    }

    // 4. NEUROLOGIE / UNV (AVC, perte de motricité, aphasie, hémiplégie)
    if (
      /avc|accident vasculaire|isch[ée]mi|h[ée]mipl[ée]gie|aphasie|paralysie facial|perte de parole|d[ée]ficit moteur|faci[èe]s asym[ée]trique/i.test(textToScan)
    ) {
      return 'neurologie';
    }

    // 5. CARDIOLOGIE / USIC (Infarctus, ACR, douleur thoracique, arrêt cardiaque)
    if (
      /cardiaque|infarctus|acr|arr[êe]t cardiaque|douleur thoracique|coronarien|d[ée]fibrillation|angor|oppression retro-sternale|fibrillation/i.test(textToScan)
    ) {
      return 'cardiologie';
    }

    // 6. MATERNITÉ / OBSTÉTRIQUE (Accouchement inopiné, contractions, femme enceinte)
    if (
      /accouchement|femme enceinte|contractions|parturiente|travail en cours|amniotique|perte des eaux|grossesse|maternité/i.test(textToScan)
    ) {
      return 'maternite';
    }

    // 7. TRAUMATOLOGIE LOURDE / TRAUMA CENTER (Polytraumatisé, défenestration, AVP haute vélocité)
    if (
      /polytraumatis|d[ée]chocage|d[ée]fenestration|chute de grande hauteur|avp violent|choc frontal|fracture f[ée]mur|bassin instable|traumatisme cr[âa]nien grave|haute v[ée]locit[ée]/i.test(textToScan)
    ) {
      return 'traumatologie';
    }

    // 8. PSYCHIATRIE / CUMP (Choc psychologique, détresse émotionnelle, tentative de suicide)
    if (
      /psychiatri|cump|impliqu[ée]|d[ée]tresse psych|tentative de suicide|crise d['’]angoisse|choc psychologique|agitation aigu[ëe]|d[ée]lire/i.test(textToScan) ||
      mission.type === 'cump'
    ) {
      return 'psychiatrie';
    }

    // 9. Par défaut : Urgences générales
    return 'urgences_generales';
  }

  /**
   * Trouve le meilleur établissement hospitalier pour évacuer la victime en tenant compte de la pathologie.
   * L'algorithme privilégie les structures possédant la spécialité requise dans un rayon acceptable (< 65 km),
   * et replie vers le centre d'urgences généraliste le plus proche si aucune structure spécialisée n'est accessible.
   */
  function findBestEvacuationHospital(game, mission, originCoords) {
    const lat = originCoords?.lat || mission?.lat || 48.6882;
    const lng = originCoords?.lng || mission?.lng || 6.1895;

    const requiredSpecialty = detectRequiredMedicalSpecialty(mission);
    const specialtyInfo = MEDICAL_SPECIALTIES[requiredSpecialty] || MEDICAL_SPECIALTIES.urgences_generales;

    // Récupérer le vivier d'hôpitaux : département courant + tous ceux enregistrés dans gameState
    let pool = [];

    if (game.departmentInfrastructures) {
      Object.keys(game.departmentInfrastructures).forEach(dCode => {
        const deptData = game.departmentInfrastructures[dCode];
        if (deptData && deptData.hospitals && Array.isArray(deptData.hospitals)) {
          pool.push(...deptData.hospitals);
        }
      });
    }

    // Si le pool est vide, initialiser le département courant
    if (pool.length === 0) {
      const deptCode = game.currentDepartmentCode || game.player?.departmentCode || '54';
      ensureDepartmentInfrastructures(game, deptCode, { lat, lng });
      if (game.departmentInfrastructures[deptCode]?.hospitals) {
        pool.push(...game.departmentInfrastructures[deptCode].hospitals);
      }
    }

    // Dédupliquer par id ou nom
    const uniqueHospitals = [];
    const seen = new Set();
    pool.forEach(h => {
      const key = h.id || h.name;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueHospitals.push(h);
      }
    });

    if (uniqueHospitals.length === 0) {
      // Fallback ultime : hôpital généré cohérent
      const fallbackHosp = {
        id: 'hosp-fallback',
        name: `Centre Hospitalier de Secteur (Urgences Générales)`,
        type: 'ch',
        city: game.stations?.[0]?.city || 'Secteur',
        lat: lat + 0.015,
        lng: lng + 0.012,
        hasSmur: true,
        smurVehiclesCount: 1,
        capacity: 25,
        specialites: ['urgences_generales'],
        description: 'Urgences de proximité avec accueil polyvalent.'
      };
      return {
        hospital: fallbackHosp,
        requiredSpecialty: 'urgences_generales',
        specialtyInfo: MEDICAL_SPECIALTIES.urgences_generales,
        isSpecialized: false,
        distanceKm: calculateDistanceKm(lat, lng, fallbackHosp.lat, fallbackHosp.lng),
        reason: 'Orientation vers les urgences de proximité les plus proches.'
      };
    }

    // Calcul des distances et filtrage
    let candidates = uniqueHospitals.map(h => {
      const distKm = calculateDistanceKm(lat, lng, h.lat, h.lng);
      const hasSpecialty = (h.specialites || []).includes(requiredSpecialty);
      return {
        hospital: h,
        distKm: distKm,
        hasSpecialty: hasSpecialty
      };
    });

    // 1. Si la spécialité est spécifique (autre que urgences générales)
    if (requiredSpecialty !== 'urgences_generales') {
      const specializedCandidates = candidates.filter(c => c.hasSpecialty);

      // On recherche une structure spécialisée à distance raisonnable (< 65 km, toléré par le SAMU pour une urgence vitale)
      if (specializedCandidates.length > 0) {
        specializedCandidates.sort((a, b) => a.distKm - b.distKm);
        const bestSpec = specializedCandidates[0];

        // Si le centre spécialisé est à moins de 65 km, le SAMU impose l'orientation vers ce pôle d'excellence
        if (bestSpec.distKm <= 65) {
          return {
            hospital: bestSpec.hospital,
            requiredSpecialty: requiredSpecialty,
            specialtyInfo: specialtyInfo,
            isSpecialized: true,
            distanceKm: bestSpec.distKm,
            reason: `Orientation Régulation SAMU 15 vers ${bestSpec.hospital.name} : plateau technique adapté requis en ${specialtyInfo.label} (${bestSpec.distKm.toFixed(1)} km).`
          };
        }
      }
    }

    // 2. Repli vers le centre d'urgences le plus proche (avec SAU)
    candidates.sort((a, b) => a.distKm - b.distKm);
    const nearest = candidates[0];
    const isSpecializedMatch = (nearest.hospital.specialites || []).includes(requiredSpecialty);

    return {
      hospital: nearest.hospital,
      requiredSpecialty: requiredSpecialty,
      specialtyInfo: specialtyInfo,
      isSpecialized: isSpecializedMatch,
      distanceKm: nearest.distKm,
      reason: requiredSpecialty !== 'urgences_generales' && !isSpecializedMatch
        ? `Repli d’urgence : centre spécialisé trop éloigné (> 65 km). Orientation vers ${nearest.hospital.name} (SAU le plus proche, ${nearest.distKm.toFixed(1)} km) avec régulation SAMU.`
        : `Orientation standard vers le service d'urgences de secteur : ${nearest.hospital.name} (${nearest.distKm.toFixed(1)} km).`
    };
  }

  // 4. PARSING INTELLIGENT DES TAGS OSM
  function detectSpecialtiesFromOsmElement(el) {
    const specs = new Set(['urgences_generales']);
    const name = ((el.tags && el.tags.name) || '').toLowerCase();
    const specTag = ((el.tags && el.tags['healthcare:speciality']) || '').toLowerCase();
    const operator = ((el.tags && el.tags.operator) || '').toLowerCase();
    const fullText = `${name} ${specTag} ${operator}`;

    if (/p[ée]diatr|enfant|maternel|m[èe]re/i.test(fullText)) {
      specs.add('pediatrie');
      specs.add('maternite');
    }
    if (/cardio|c[œo]ur|vasculaire/i.test(fullText)) {
      specs.add('cardiologie');
    }
    if (/neuro|avc|cerveau|t[êe]te/i.test(fullText)) {
      specs.add('neurologie');
    }
    if (/trauma|urgences|d[ée]choc/i.test(fullText) || /chu|centre hospitalier universitaire/i.test(fullText)) {
      specs.add('traumatologie');
      specs.add('reanimation');
    }
    if (/br[ûu]l[ée]|brulure/i.test(fullText)) {
      specs.add('brules');
    }
    if (/main|orthop[ée]d/i.test(fullText)) {
      specs.add('sos_main');
    }
    if (/psy|sant[ée] mentale|psychoth/i.test(fullText)) {
      specs.add('psychiatrie');
    }

    // Tout CHU a au minimum cardiologie, traumatologie et réanimation
    if (/chu|universitaire/i.test(fullText)) {
      specs.add('cardiologie');
      specs.add('traumatologie');
      specs.add('reanimation');
    }

    return Array.from(specs);
  }

  // 5. SYNCHRONISATION / INITIALISATION DES INFRASTRUCTURES D'UN DÉPARTEMENT
  function ensureDepartmentInfrastructures(game, deptCode, centerCoords) {
    if (!game) return;
    if (!game.departmentInfrastructures) {
      game.departmentInfrastructures = {};
    }

    const dCode = String(deptCode || '54');

    // Si le département est déjà complet avec des hôpitaux, on ne l'écrase pas
    if (game.departmentInfrastructures[dCode] &&
        game.departmentInfrastructures[dCode].hospitals &&
        game.departmentInfrastructures[dCode].hospitals.length > 0) {
      return game.departmentInfrastructures[dCode];
    }

    // 1. Vérifier si on a une base de référence nationale pour ce département
    if (DEFAULT_DEPARTMENT_DATA[dCode]) {
      const def = DEFAULT_DEPARTMENT_DATA[dCode];
      game.departmentInfrastructures[dCode] = {
        deptCode: dCode,
        deptName: def.deptName,
        samuCenter: def.samuCenter,
        hospitals: JSON.parse(JSON.stringify(def.hospitals)),
        casernes: JSON.parse(JSON.stringify(def.casernes || []))
      };
      console.log(`🏥 [Infrastructures] Département ${dCode} (${def.deptName}) initialisé depuis la base nationale de référence.`);
    } else {
      // 2. Génération procédurale ultra-réaliste pour les départements non listés
      const baseLat = centerCoords?.lat || (game.stations?.[0]?.lat) || 48.8566;
      const baseLng = centerCoords?.lng || (game.stations?.[0]?.lng) || 2.3522;
      const cityName = (game.stations?.[0]?.city) || `Préfecture (${dCode})`;

      const pompiersAuth = (window.ProtecDepartements && typeof window.ProtecDepartements.getPompiersAuthority === 'function')
        ? window.ProtecDepartements.getPompiersAuthority(dCode)
        : { shortName: 'SDIS', fullName: `SDIS ${dCode}` };

      game.departmentInfrastructures[dCode] = {
        deptCode: dCode,
        deptName: `Département ${dCode}`,
        samuCenter: `SAMU ${dCode} - CRRA 15`,
        hospitals: [
          {
            id: `hosp-${dCode}-chu`,
            name: `Centre Hospitalier Universitaire de ${cityName} (Trauma Center)`,
            type: 'chu',
            city: cityName,
            address: `Avenue de l'Hôpital, ${cityName}`,
            lat: baseLat + 0.018,
            lng: baseLng + 0.015,
            hasSmur: true,
            smurVehiclesCount: 3,
            capacity: 50,
            samuStation: true,
            specialites: ['urgences_generales', 'traumatologie', 'cardiologie', 'neurologie', 'reanimation', 'sos_main'],
            description: `Grand centre hospitalier de référence départementale avec siège du SAMU ${dCode} et Trauma Center.`
          },
          {
            id: `hosp-${dCode}-enfants`,
            name: `Pôle Mère-Enfant & Urgences Pédiatriques de ${cityName}`,
            type: 'chu',
            city: cityName,
            address: `Boulevard de la Santé, ${cityName}`,
            lat: baseLat - 0.014,
            lng: baseLng + 0.019,
            hasSmur: true,
            smurVehiclesCount: 1,
            capacity: 35,
            samuStation: false,
            specialites: ['urgences_generales', 'pediatrie', 'maternite', 'reanimation'],
            description: `Hôpital pédiatrique et néonatalogie de recours pour l'ensemble du département ${dCode}.`
          },
          {
            id: `hosp-${dCode}-ch`,
            name: `Centre Hospitalier Général de ${cityName} (Urgences)`,
            type: 'ch',
            city: cityName,
            address: `Rue des Urgences, ${cityName}`,
            lat: baseLat + 0.022,
            lng: baseLng - 0.025,
            hasSmur: true,
            smurVehiclesCount: 1,
            capacity: 25,
            samuStation: false,
            specialites: ['urgences_generales', 'cardiologie'],
            description: `Service des urgences polyvalentes et unité SMUR de proximité.`
          }
        ],
        casernes: [
          {
            id: `cas-${dCode}-csp`,
            name: `CSP ${cityName} (${pompiersAuth.shortName})`,
            type: 'CSP',
            city: cityName,
            lat: baseLat + 0.012,
            lng: baseLng - 0.008,
            authority: pompiersAuth.shortName
          },
          {
            id: `cas-${dCode}-cis`,
            name: `CIS ${cityName}-Sud (${pompiersAuth.shortName})`,
            type: 'CIS',
            city: cityName,
            lat: baseLat - 0.020,
            lng: baseLng + 0.010,
            authority: pompiersAuth.shortName
          }
        ]
      };
      console.log(`🏥 [Infrastructures] Département ${dCode} généré avec succès.`);
    }

    // 3. Déclenchement de l'enrichissement asynchrone OpenStreetMap (Overpass) en tâche de fond (sans bloquer le jeu)
    fetchOsmInfrastructuresForDept(game, dCode, centerCoords);

    return game.departmentInfrastructures[dCode];
  }

  /**
   * Interroge l'API Overpass OpenStreetMap pour enrichir la liste d'hôpitaux avec les coordonnées et noms réels.
   * Ne bloque JAMAIS l'UI et gère un timeout strict de 4 secondes.
   */
  async function fetchOsmInfrastructuresForDept(game, deptCode, centerCoords) {
    const lat = centerCoords?.lat || (game.stations?.[0]?.lat);
    const lng = centerCoords?.lng || (game.stations?.[0]?.lng);
    if (!lat || !lng) return;

    try {
      const query = `[out:json][timeout:4];(node["amenity"="hospital"](around:35000,${lat},${lng});way["amenity"="hospital"](around:35000,${lat},${lng}););out center body 10;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.elements && data.elements.length > 0) {
          const deptObj = game.departmentInfrastructures[deptCode];
          if (!deptObj) return;

          const existingNames = new Set(deptObj.hospitals.map(h => h.name.toLowerCase()));

          data.elements.forEach(el => {
            const hLat = el.lat || el.center?.lat;
            const hLng = el.lon || el.center?.lon;
            const rawName = el.tags?.name;
            if (!rawName || !hLat || !hLng) return;

            // Éviter les doublons
            const normName = rawName.toLowerCase();
            if (existingNames.has(normName)) return;

            const specialites = detectSpecialtiesFromOsmElement(el);
            const isChu = /chu|universitaire|chru/i.test(rawName);
            const hasSmur = /urgence|hospital|smur|samu/i.test(el.tags?.emergency || '') || isChu;

            const newHosp = {
              id: `osm-hosp-${el.id}`,
              name: rawName,
              type: isChu ? 'chu' : (el.tags?.healthcare === 'clinic' ? 'clinique' : 'ch'),
              city: el.tags?.['addr:city'] || deptObj.deptName || 'Secteur',
              address: [el.tags?.['addr:housenumber'], el.tags?.['addr:street'], el.tags?.['addr:postcode'], el.tags?.['addr:city']].filter(Boolean).join(' ') || 'Adresse répertoriée OSM',
              lat: hLat,
              lng: hLng,
              hasSmur: hasSmur,
              smurVehiclesCount: hasSmur ? (isChu ? 3 : 1) : 0,
              capacity: isChu ? 50 : 25,
              samuStation: isChu && /samu/i.test(rawName),
              specialites: specialites,
              description: `Établissement de santé réel détecté par cartographie officielle OpenStreetMap.`
            };

            deptObj.hospitals.push(newHosp);
            existingNames.add(normName);
          });

          console.log(`🏥 [OSM Overpass] Infrastructures enrichies pour le département ${deptCode} (${deptObj.hospitals.length} hôpitaux au total).`);
        }
      }
    } catch (err) {
      // Échec silencieux ou mode hors-ligne : la base locale garantit le fonctionnement
    }
  }

  // 6. COMPOSANTS D'AFFICHAGE UI (BADGES & CARTES D'ORIENTATION)
  function renderHospitalSpecialtiesBadges(hospital, options = {}) {
    if (!hospital || !hospital.specialites || !Array.isArray(hospital.specialites)) {
      return '';
    }

    const highlightSpecialty = options.highlightSpecialty || null;
    const maxItems = options.maxItems || 6;

    let html = '<div class="flex flex-wrap gap-1.5 items-center">';
    hospital.specialites.slice(0, maxItems).forEach(specId => {
      const spec = MEDICAL_SPECIALTIES[specId];
      if (!spec) return;

      const isTarget = highlightSpecialty === specId;
      const borderClass = isTarget ? 'ring-2 ring-emerald-500 font-black scale-105' : '';

      html += `
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${spec.badgeClass} ${borderClass}" title="${spec.desc}">
          <i data-lucide="${spec.icon}" class="w-3 h-3"></i>
          <span>${spec.shortLabel}</span>
          ${isTarget ? '<span class="text-emerald-700 ml-0.5">✓</span>' : ''}
        </span>
      `;
    });

    if (hospital.specialites.length > maxItems) {
      html += `
        <span class="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
          +${hospital.specialites.length - maxItems} autres
        </span>
      `;
    }

    html += '</div>';
    return html;
  }

  /**
   * Génère le bloc UI explicatif d'orientation de la victime pour les modales de suivi de mission et drawer.
   */
  function renderEvacuationRoutingCard(evacData) {
    if (!evacData || !evacData.hospital) return '';

    const hosp = evacData.hospital;
    const spec = evacData.specialtyInfo || MEDICAL_SPECIALTIES[evacData.requiredSpecialty] || MEDICAL_SPECIALTIES.urgences_generales;
    const isSpecialized = evacData.isSpecialized;

    return `
      <div class="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-indigo-200/80 shadow-xs space-y-2.5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-2.5">
            <div class="w-9 h-9 rounded-xl ${isSpecialized ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-white'} flex items-center justify-center shrink-0 shadow-xs">
              <i data-lucide="${isSpecialized ? spec.icon : 'hospital'}" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h5 class="text-xs font-black text-slate-900 leading-tight">${hosp.name}</h5>
                <span class="px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${hosp.type === 'chu' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-slate-200 text-slate-700'}">
                  ${hosp.type === 'chu' ? 'CHU / Référence' : 'Centre Hospitalier'}
                </span>
              </div>
              <p class="text-[10px] text-slate-500 mt-0.5">${hosp.address || hosp.city || 'Secteur départemental'}</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="text-xs font-black text-indigo-900">${(evacData.distanceKm || 0).toFixed(1)} km</span>
            <span class="block text-[9px] font-semibold text-slate-500">Distance transport</span>
          </div>
        </div>

        <!-- Motif d'orientation médicale SAMU -->
        <div class="p-2.5 rounded-xl bg-white/90 border border-indigo-100 text-[11px] space-y-1">
          <div class="flex items-center justify-between">
            <strong class="font-extrabold text-indigo-950 flex items-center gap-1.5">
              <span>🩺</span> Orientation Régulation SAMU 15
            </strong>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black border ${spec.badgeClass}">
              <i data-lucide="${spec.icon}" class="w-3 h-3"></i>
              ${spec.label}
            </span>
          </div>
          <p class="text-slate-600 text-[10.5px] leading-relaxed">
            ${evacData.reason}
          </p>
        </div>

        <!-- Plateaux techniques & spécialités de l'établissement -->
        <div class="space-y-1">
          <span class="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">Plateaux techniques & Spécialités disponibles :</span>
          ${renderHospitalSpecialtiesBadges(hosp, { highlightSpecialty: evacData.requiredSpecialty, maxItems: 6 })}
        </div>

        <!-- Indicateur SMUR & Capacités -->
        <div class="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
          <span>Capacité SAU : <strong>${hosp.capacity || 25} lits</strong></span>
          <span>Base SMUR : <strong>${hosp.hasSmur ? `Oui (${hosp.smurVehiclesCount || 1} UMH)` : 'Non (SMUR extérieur)'}</strong></span>
        </div>
      </div>
    `;
  }

  // EXPOSITION GLOBALE
  window.ProtecHealthInfrastructures = {
    MEDICAL_SPECIALTIES: MEDICAL_SPECIALTIES,
    DEFAULT_DEPARTMENT_DATA: DEFAULT_DEPARTMENT_DATA,
    detectRequiredMedicalSpecialty: detectRequiredMedicalSpecialty,
    findBestEvacuationHospital: findBestEvacuationHospital,
    ensureDepartmentInfrastructures: ensureDepartmentInfrastructures,
    fetchOsmInfrastructuresForDept: fetchOsmInfrastructuresForDept,
    renderHospitalSpecialtiesBadges: renderHospitalSpecialtiesBadges,
    renderEvacuationRoutingCard: renderEvacuationRoutingCard,
    calculateDistanceKm: calculateDistanceKm
  };

  console.log('🏥 Module ProtecHealthInfrastructures chargé avec succès.');
})();
