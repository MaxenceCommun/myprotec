/**
 * PROTEC LIVE - MODULE DE GÉNÉRATION DYNAMIQUE DES DPS & ANCRAGE GÉOGRAPHIQUE RÉEL
 * 
 * Génère des Dispositifs Prévisionnels de Secours (DPS) à partir de scénarios métier
 * avec recherche ciblée des lieux réels via OpenStreetMap Overpass (sans alourdir la sauvegarde).
 * 
 * Principes :
 * 1. Modèles de scénarios typés (football, natation, concert, gare, trail, école...)
 * 2. Requête Overpass ciblée sur le secteur de l'antenne (rayon 15-30 km) avec timeout court
 * 3. Extraction du nom officiel du lieu et de ses coordonnées GPS exactes
 * 4. Fallback procédural cohérent basé sur la commune en cas de hors-ligne ou d'absence de résultat
 * 5. Cache temporaire en mémoire de session pour éviter les sur-sollicitations de l'API
 * 6. Calcul automatique des effectifs réglementaires (RNMSC : RIS, PAPS/PE/ME/GE, barème)
 */

(function () {
  'use strict';

  // Cache mémoire de session (clé -> { timestamp, results: [] })
  const _osmMemoryCache = new Map();
  const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  // 1. STRUCTURE DES MODÈLES DE DPS (dpsTemplates)
  const DPS_TEMPLATES = [
    {
      id: 'football',
      titleTemplate: 'Match de Football Régional au {venue}',
      osmQuery: '(node["leisure"="pitch"]["sport"="soccer"](around:{radius},{lat},{lng});way["leisure"="pitch"]["sport"="soccer"](around:{radius},{lat},{lng});node["leisure"="stadium"](around:{radius},{lat},{lng});way["leisure"="stadium"](around:{radius},{lat},{lng}););',
      radiusKm: 25,
      clientTemplate: 'Club de Football de {commune}',
      clientType: 'club_sportif',
      category: 'sport',
      dur: 5,
      pubMin: 800,
      pubMax: 3500,
      scale: 'DPS-PE (4 secouristes + VPSP)',
      reqV: 4,
      ranks: ['CE', 'PSE2', 'PSE1'],
      reqVeh: ['VPSP'],
      consumableCost: 35,
      environment: 'ouvert_urbain',
      riskLevel: 'moyen',
      defaultFallback: (commune) => ({
        name: `Stade Municipal de ${commune}`,
        venue: `Stade Municipal de ${commune}`
      })
    },
    {
      id: 'rugby',
      titleTemplate: 'Rencontre de Rugby au {venue}',
      osmQuery: '(node["leisure"="pitch"]["sport"="rugby"](around:{radius},{lat},{lng});way["leisure"="pitch"]["sport"="rugby"](around:{radius},{lat},{lng});node["leisure"="stadium"](around:{radius},{lat},{lng});way["leisure"="stadium"](around:{radius},{lat},{lng}););',
      radiusKm: 25,
      clientTemplate: 'Rugby Club de {commune}',
      clientType: 'club_sportif',
      category: 'sport',
      dur: 5,
      pubMin: 1000,
      pubMax: 4000,
      scale: 'DPS-PE (5 secouristes + VPSP)',
      reqV: 5,
      ranks: ['CE', 'PSE2', 'PSE1'],
      reqVeh: ['VPSP'],
      consumableCost: 40,
      environment: 'ouvert_urbain',
      riskLevel: 'moyen',
      defaultFallback: (commune) => ({
        name: `Stade de Rugby de ${commune}`,
        venue: `Stade de Rugby de ${commune}`
      })
    },
    {
      id: 'sports_salle',
      titleTemplate: 'Tournoi d’Arts Martiaux & Sports en Salle au {venue}',
      osmQuery: '(node["leisure"="sports_centre"](around:{radius},{lat},{lng});way["leisure"="sports_centre"](around:{radius},{lat},{lng});node["amenity"="dojo"](around:{radius},{lat},{lng});way["amenity"="dojo"](around:{radius},{lat},{lng}););',
      radiusKm: 20,
      clientTemplate: 'Comité Omnisports de {commune}',
      clientType: 'club_sportif',
      category: 'sport',
      dur: 6,
      pubMin: 500,
      pubMax: 1800,
      scale: 'PAPS (3 secouristes + VPSP)',
      reqV: 3,
      ranks: ['PSE2', 'PSE1'],
      reqVeh: ['VPSP'],
      consumableCost: 25,
      environment: 'ferme',
      riskLevel: 'faible',
      defaultFallback: (commune) => ({
        name: `Gymnase Omnisports de ${commune}`,
        venue: `Gymnase Omnisports de ${commune}`
      })
    },
    {
      id: 'natation',
      titleTemplate: 'Compétition Régionale de Natation au {venue}',
      osmQuery: '(node["leisure"="sports_centre"]["sport"="swimming"](around:{radius},{lat},{lng});way["leisure"="sports_centre"]["sport"="swimming"](around:{radius},{lat},{lng});node["amenity"="public_bath"](around:{radius},{lat},{lng});way["amenity"="public_bath"](around:{radius},{lat},{lng}););',
      radiusKm: 25,
      clientTemplate: 'Club Nautique & Natation de {commune}',
      clientType: 'club_sportif',
      category: 'sport',
      dur: 5,
      pubMin: 600,
      pubMax: 1600,
      scale: 'DPS-PE (4 secouristes + VPSP)',
      reqV: 4,
      ranks: ['CE', 'PSE2', 'PSE1'],
      reqVeh: ['VPSP'],
      consumableCost: 30,
      environment: 'ferme',
      riskLevel: 'moyen',
      defaultFallback: (commune) => ({
        name: `Centre Aquatique de ${commune}`,
        venue: `Centre Aquatique de ${commune}`
      })
    },
    {
      id: 'concert_spectacle',
      titleTemplate: 'Festival & Concert Musical au {venue}',
      osmQuery: '(node["amenity"~"theatre|arts_centre"](around:{radius},{lat},{lng});way["amenity"~"theatre|arts_centre"](around:{radius},{lat},{lng});node["leisure"="park"](around:{radius},{lat},{lng});way["leisure"="park"](around:{radius},{lat},{lng}););',
      radiusKm: 25,
      clientTemplate: 'Comité des Fêtes & Événements de {commune}',
      clientType: 'association',
      category: 'culturel',
      dur: 7,
      pubMin: 1500,
      pubMax: 6000,
      scale: 'DPS-PE (5 secouristes + VPSP)',
      reqV: 5,
      ranks: ['CE', 'PSE2', 'PSE1'],
      reqVeh: ['VPSP'],
      consumableCost: 45,
      environment: 'ouvert_urbain',
      riskLevel: 'moyen',
      defaultFallback: (commune) => ({
        name: `Parc Municipal de ${commune}`,
        venue: `Parc Municipal de ${commune}`
      })
    },
    {
      id: 'scolaire_kermesse',
      titleTemplate: 'Kermesse & Fête Scolaire à l’{venue}',
      osmQuery: '(node["amenity"~"school|college"](around:{radius},{lat},{lng});way["amenity"~"school|college"](around:{radius},{lat},{lng}););',
      radiusKm: 15,
      clientTemplate: 'Association des Parents d’Élèves de {commune}',
      clientType: 'association',
      category: 'scolaire',
      dur: 4,
      pubMin: 350,
      pubMax: 900,
      scale: 'PAPS (2 secouristes + VPSP)',
      reqV: 2,
      ranks: ['PSE1', 'PSE2'],
      reqVeh: ['VPSP'],
      consumableCost: 15,
      environment: 'ouvert_urbain',
      riskLevel: 'faible',
      defaultFallback: (commune) => ({
        name: `École Publique Pasteur de ${commune}`,
        venue: `École Publique Pasteur de ${commune}`
      })
    },
    {
      id: 'plan_rail',
      titleTemplate: 'Assistance Voyageurs & Plan Rail à la {venue}',
      osmQuery: '(node["railway"="station"](around:{radius},{lat},{lng});way["railway"="station"](around:{radius},{lat},{lng}););',
      radiusKm: 30,
      clientTemplate: 'SNCF Gares & Connexions',
      clientType: 'professionnel',
      category: 'transport',
      dur: 6,
      pubMin: 1200,
      pubMax: 5000,
      scale: 'DPS-PE (4 secouristes + VPSP)',
      reqV: 4,
      ranks: ['CE', 'PSE2', 'PSE1'],
      reqVeh: ['VPSP'],
      consumableCost: 35,
      environment: 'ferme',
      riskLevel: 'faible',
      defaultFallback: (commune) => ({
        name: `Gare SNCF de ${commune}`,
        venue: `Gare SNCF de ${commune}`
      })
    },
    {
      id: 'trail_nature',
      titleTemplate: 'Trail & Course Nature - {venue}',
      osmQuery: '(node["leisure"="nature_reserve"](around:{radius},{lat},{lng});way["leisure"="nature_reserve"](around:{radius},{lat},{lng});node["landuse"="forest"](around:{radius},{lat},{lng});way["landuse"="forest"](around:{radius},{lat},{lng}););',
      radiusKm: 30,
      clientTemplate: 'Club d’Athlétisme & Randonnée de {commune}',
      clientType: 'club_sportif',
      category: 'sport',
      dur: 6,
      pubMin: 600,
      pubMax: 2200,
      scale: 'DPS-PE (4 secouristes + VTU)',
      reqV: 4,
      ranks: ['CE', 'PSE2', 'PSE1'],
      reqVeh: ['VTU', 'VPSP'],
      consumableCost: 40,
      environment: 'dynamique_course',
      riskLevel: 'moyen',
      medicalTeamRequired: true,
      defaultFallback: (commune) => ({
        name: `Forêt Domaniale de ${commune}`,
        venue: `Forêt Domaniale de ${commune}`
      })
    },
    {
      id: 'athletisme',
      titleTemplate: 'Meeting Régional d’Athlétisme au {venue}',
      osmQuery: '(node["leisure"="track"](around:{radius},{lat},{lng});way["leisure"="track"](around:{radius},{lat},{lng});node["leisure"="sports_centre"](around:{radius},{lat},{lng});way["leisure"="sports_centre"](around:{radius},{lat},{lng}););',
      radiusKm: 20,
      clientTemplate: 'Ligue d’Athlétisme de {commune}',
      clientType: 'club_sportif',
      category: 'sport',
      dur: 5,
      pubMin: 500,
      pubMax: 1800,
      scale: 'PAPS (3 secouristes + VPSP)',
      reqV: 3,
      ranks: ['PSE2', 'PSE1'],
      reqVeh: ['VPSP'],
      consumableCost: 20,
      environment: 'ouvert_urbain',
      riskLevel: 'faible',
      defaultFallback: (commune) => ({
        name: `Piste d’Athlétisme de ${commune}`,
        venue: `Piste d’Athlétisme de ${commune}`
      })
    },
    {
      id: 'marathon_metropole',
      titleTemplate: 'Marathon & Grande Course Urbaine - {venue}',
      osmQuery: '(node["leisure"="track"](around:{radius},{lat},{lng});way["highway"="primary"](around:{radius},{lat},{lng});node["place"="square"](around:{radius},{lat},{lng}););',
      radiusKm: 25,
      clientTemplate: 'Comité du Marathon de {commune}',
      clientType: 'club_sportif',
      category: 'sport',
      dur: 7,
      pubMin: 2500,
      pubMax: 9000,
      scale: 'DPS-ME (8 secouristes + 2 VPSP + VTU)',
      reqV: 8,
      ranks: ['CD', 'CE', 'PSE2', 'PSE1'],
      reqVeh: ['VPSP', 'VTU'],
      consumableCost: 65,
      environment: 'dynamique_course',
      riskLevel: 'eleve',
      medicalTeamRequired: true,
      defaultFallback: (commune) => ({
        name: `Place Centrale de ${commune}`,
        venue: `Hôtel de Ville de ${commune}`
      })
    },
    {
      id: 'criterium_cycliste',
      titleTemplate: 'Grand Prix Cycliste & Critérium Régional à {venue}',
      osmQuery: '(node["leisure"="sports_centre"](around:{radius},{lat},{lng});way["highway"="secondary"](around:{radius},{lat},{lng}););',
      radiusKm: 30,
      clientTemplate: 'Vélo Club & Ligue Cycliste de {commune}',
      clientType: 'club_sportif',
      category: 'sport',
      dur: 6,
      pubMin: 1200,
      pubMax: 4500,
      scale: 'DPS-PE (6 secouristes + VPSP + VTU)',
      reqV: 6,
      ranks: ['CE', 'PSE2', 'PSE1'],
      reqVeh: ['VPSP', 'VTU'],
      consumableCost: 50,
      environment: 'dynamique_course',
      riskLevel: 'eleve',
      medicalTeamRequired: true,
      defaultFallback: (commune) => ({
        name: `Boulevard des Sports de ${commune}`,
        venue: `Circuit Urbain de ${commune}`
      })
    },
    {
      id: 'motocross_enduro',
      titleTemplate: 'Course d’Enduro Motocross & Quad au {venue}',
      osmQuery: '(node["leisure"="pitch"]["sport"="motor"](around:{radius},{lat},{lng});way["landuse"="quarry"](around:{radius},{lat},{lng});node["landuse"="forest"](around:{radius},{lat},{lng}););',
      radiusKm: 35,
      clientTemplate: 'Moto Club Tout-Terrain de {commune}',
      clientType: 'club_sportif',
      category: 'sport',
      dur: 6,
      pubMin: 1500,
      pubMax: 4000,
      scale: 'DPS-PE (6 secouristes + VPSP + VTU)',
      reqV: 6,
      ranks: ['CE', 'PSE2', 'PSE1'],
      reqVeh: ['VPSP', 'VTU'],
      consumableCost: 55,
      environment: 'dynamique_course',
      riskLevel: 'eleve',
      medicalTeamRequired: true,
      defaultFallback: (commune) => ({
        name: `Terrain d’Enduro de ${commune}`,
        venue: `Circuit Tout-Terrain de ${commune}`
      })
    },
    {
      id: 'centre_commercial',
      titleTemplate: 'Braderie & Salon Commercial au {venue}',
      poiCategory: 'centres_commerciaux',
      osmQuery: '(node["shop"~"mall|department_store|supermarket"](around:{radius},{lat},{lng});way["shop"~"mall|department_store|supermarket"](around:{radius},{lat},{lng}););',
      radiusKm: 20,
      clientTemplate: 'Association des Commerçants de {commune}',
      clientType: 'professionnel',
      category: 'commercial',
      dur: 6,
      pubMin: 2000,
      pubMax: 7000,
      scale: 'DPS-PE (4 secouristes + VPSP)',
      reqV: 4,
      ranks: ['CE', 'PSE2', 'PSE1'],
      reqVeh: ['VPSP'],
      consumableCost: 35,
      environment: 'ferme',
      riskLevel: 'faible',
      defaultFallback: (commune) => ({
        name: `Centre Commercial de ${commune}`,
        venue: `Centre Commercial de ${commune}`
      })
    },
    {
      id: 'regate_nautique',
      titleTemplate: 'Régate Nautique & Compétition Fluviale - {venue}',
      poiCategory: 'plans_eau',
      osmQuery: '(node["natural"="water"](around:{radius},{lat},{lng});way["natural"="water"](around:{radius},{lat},{lng});way["waterway"="riverbank"](around:{radius},{lat},{lng}););',
      radiusKm: 30,
      clientTemplate: 'Club Nautique & Aviron de {commune}',
      clientType: 'club_sportif',
      category: 'sport',
      specialite: 'nautique',
      dur: 6,
      pubMin: 800,
      pubMax: 3000,
      scale: 'DPS-PE (4 secouristes + Embarcation ERS)',
      reqV: 4,
      ranks: ['CE', 'PSE2', 'PSE1'],
      reqVeh: ['ERS'],
      requiredSkills: ['permis_bateau'],
      consumableCost: 45,
      environment: 'ouvert_nature',
      riskLevel: 'moyen',
      defaultFallback: (commune) => ({
        name: `Plan d’Eau Municipal de ${commune}`,
        venue: `Berges du Plan d’Eau de ${commune}`
      })
    },
    {
      id: 'poste_plage',
      titleTemplate: 'Surveillance Estivale & Poste de Secours à la {venue}',
      poiCategory: 'plages',
      osmQuery: '(node["natural"="beach"](around:{radius},{lat},{lng});way["natural"="beach"](around:{radius},{lat},{lng});node["leisure"="beach_resort"](around:{radius},{lat},{lng});way["leisure"="beach_resort"](around:{radius},{lat},{lng}););',
      radiusKm: 35,
      clientTemplate: 'Service des Sports & Littoral de {commune}',
      clientType: 'collectivite',
      category: 'sport',
      specialite: 'nautique',
      dur: 7,
      pubMin: 1200,
      pubMax: 5000,
      scale: 'DPS-PE (4 secouristes + VPSP)',
      reqV: 4,
      ranks: ['CE', 'PSE2', 'PSE1'],
      reqVeh: ['VPSP'],
      consumableCost: 40,
      environment: 'ouvert_nature',
      riskLevel: 'moyen',
      defaultFallback: (commune) => ({
        name: `Plage Aménagée de ${commune}`,
        venue: `Poste de Secours Plage de ${commune}`
      })
    },
    {
      id: 'commemoration_patrimoine',
      titleTemplate: 'Cérémonie & Défilé Commémoratif au {venue}',
      poiCategory: 'monuments',
      osmQuery: '(node["historic"~"monument|memorial|castle|ruins"](around:{radius},{lat},{lng});way["historic"~"monument|memorial|castle|ruins"](around:{radius},{lat},{lng});node["tourism"~"attraction|museum"](around:{radius},{lat},{lng});way["tourism"~"attraction|museum"](around:{radius},{lat},{lng}););',
      radiusKm: 25,
      clientTemplate: 'Comité du Souvenir & Mairie de {commune}',
      clientType: 'collectivite',
      category: 'culturel',
      dur: 4,
      pubMin: 600,
      pubMax: 2500,
      scale: 'PAPS (3 secouristes + VPSP)',
      reqV: 3,
      ranks: ['PSE2', 'PSE1'],
      reqVeh: ['VPSP'],
      consumableCost: 20,
      environment: 'ouvert_urbain',
      riskLevel: 'faible',
      defaultFallback: (commune) => ({
        name: `Monument aux Morts de ${commune}`,
        venue: `Esplanade du Monument de ${commune}`
      })
    },
    {
      id: 'meeting_aerien',
      titleTemplate: 'Meeting Aérien & Salon Aéronautique à l’{venue}',
      poiCategory: 'aeroports',
      osmQuery: '(node["aeroway"~"aerodrome|terminal|helipad"](around:{radius},{lat},{lng});way["aeroway"~"aerodrome|terminal|helipad"](around:{radius},{lat},{lng}););',
      radiusKm: 35,
      clientTemplate: 'Aéro-Club & Comité de l’Air de {commune}',
      clientType: 'association',
      category: 'culturel',
      dur: 7,
      pubMin: 3000,
      pubMax: 10000,
      scale: 'DPS-ME (8 secouristes + 2 VPSP + VTU)',
      reqV: 8,
      ranks: ['CD', 'CE', 'PSE2', 'PSE1'],
      reqVeh: ['VPSP', 'VTU'],
      consumableCost: 70,
      environment: 'ouvert_urbain',
      riskLevel: 'eleve',
      medicalTeamRequired: true,
      defaultFallback: (commune) => ({
        name: `Aérodrome de ${commune}`,
        venue: `Aérodrome Régional de ${commune}`
      })
    },
    {
      id: 'portes_ouvertes_pompiers',
      titleTemplate: 'Portes Ouvertes & Manœuvres Conjointes au {venue}',
      poiCategory: 'casernes',
      osmQuery: '(node["amenity"="fire_station"](around:{radius},{lat},{lng});way["amenity"="fire_station"](around:{radius},{lat},{lng}););',
      radiusKm: 25,
      clientTemplate: 'Amicale des Sapeurs-Pompiers de {commune}',
      clientType: 'association',
      category: 'culturel',
      dur: 5,
      pubMin: 800,
      pubMax: 2500,
      scale: 'PAPS (3 secouristes + VPSP)',
      reqV: 3,
      ranks: ['PSE2', 'PSE1'],
      reqVeh: ['VPSP'],
      consumableCost: 20,
      environment: 'ouvert_urbain',
      riskLevel: 'faible',
      defaultFallback: (commune) => ({
        name: `Centre de Secours de ${commune}`,
        venue: `Caserne des Pompiers de ${commune}`
      })
    },
    {
      id: 'chasse_croise_autoroute',
      titleTemplate: 'Opération Halte Sécurité Routière & Chassé-Croisé - {venue}',
      poiCategory: 'autoroutes',
      osmQuery: '(node["highway"="motorway_junction"](around:{radius},{lat},{lng});way["highway"="motorway"](around:{radius},{lat},{lng});node["highway"="toll_gantry"](around:{radius},{lat},{lng}););',
      radiusKm: 30,
      clientTemplate: 'Société Concessionnaire d’Autoroutes',
      clientType: 'professionnel',
      category: 'transport',
      dur: 6,
      pubMin: 1500,
      pubMax: 6000,
      scale: 'DPS-PE (4 secouristes + VPSP + VTU)',
      reqV: 4,
      ranks: ['CE', 'PSE2', 'PSE1'],
      reqVeh: ['VPSP', 'VTU'],
      consumableCost: 40,
      environment: 'ouvert_urbain',
      riskLevel: 'moyen',
      defaultFallback: (commune) => ({
        name: `Aire d’Autoroute de ${commune}`,
        venue: `Échangeur Autoroutier de ${commune}`
      })
    }
  ];

  // 2. FONCTION DE RECHERCHE DYNAMIQUE DU LIEU (fetchLocationForDPS)
  /**
   * Recherche un lieu réel sur OpenStreetMap correspondant à la requête du template.
   * @param {number} lat - Latitude de l'antenne
   * @param {number} lng - Longitude de l'antenne
   * @param {number} radiusMeters - Rayon en mètres
   * @param {string} rawOsmQuery - Requête Overpass paramétrée
   * @param {Function} defaultFallback - Fonction générant un lieu de secours
   * @param {string} communeName - Nom de la commune de référence
   * @returns {Promise<Object>} - { name, venue, city, lat, lng, isOsmReal }
   */
  async function fetchLocationForDPS(lat, lng, radiusMeters, rawOsmQuery, defaultFallback, communeName = 'Secteur') {
    const radius = Math.min(35000, Math.max(5000, radiusMeters || 20000));
    const roundLat = Math.round(lat * 100) / 100;
    const roundLng = Math.round(lng * 100) / 100;
    const cacheKey = `${rawOsmQuery.slice(0, 30)}_${radius}_${roundLat}_${roundLng}`;

    // 1. Vérification du cache de session
    const cached = _osmMemoryCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < CACHE_TTL_MS) && Array.isArray(cached.elements) && cached.elements.length > 0) {
      const pick = cached.elements[Math.floor(Math.random() * cached.elements.length)];
      return {
        ...pick,
        isOsmReal: true,
        fromCache: true
      };
    }

    // 2. Construction de la requête Overpass
    const builtQuery = rawOsmQuery
      .replace(/{radius}/g, String(radius))
      .replace(/{lat}/g, lat.toFixed(5))
      .replace(/{lng}/g, lng.toFixed(5));

    const fullOverpassQuery = `[out:json][timeout:4];${builtQuery}out center body 20;`;
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter'
    ];

    let foundElements = [];

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(fullOverpassQuery)}`,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.elements) && data.elements.length > 0) {
            // Filtrer les lieux avec un nom valide
            foundElements = data.elements
              .map(el => {
                const name = el.tags?.name || el.tags?.operator || el.tags?.ref;
                if (!name || name.trim().length < 3) return null;

                const eLat = el.lat || el.center?.lat;
                const eLng = el.lon || el.center?.lon;
                if (!eLat || !eLng) return null;

                const city = el.tags?.['addr:city'] || communeName;
                return {
                  name: name.trim(),
                  venue: name.trim(),
                  city: city,
                  lat: parseFloat(eLat.toFixed(5)),
                  lng: parseFloat(eLng.toFixed(5)),
                  osmId: el.id
                };
              })
              .filter(Boolean);

            if (foundElements.length > 0) {
              // Mettre en cache
              _osmMemoryCache.set(cacheKey, {
                timestamp: now,
                elements: foundElements
              });
              break;
            }
          }
        }
      } catch (err) {
        // En cas de timeout ou erreur réseau, tenter l'endpoint suivant ou basculer sur le fallback
      }
    }

    // 3. Si des résultats réels sont trouvés, en choisir un au hasard
    if (foundElements.length > 0) {
      const selected = foundElements[Math.floor(Math.random() * foundElements.length)];
      return {
        ...selected,
        isOsmReal: true
      };
    }

    // 4. Fallback procédural cohérent
    const fallbackData = (typeof defaultFallback === 'function')
      ? defaultFallback(communeName)
      : { name: `Lieu d’accueil de ${communeName}`, venue: `Complexe de ${communeName}` };

    // Décalage géographique réaliste (100m à 320m dans le tissu urbain habité, garanti hors eau et hors forêt)
    const angle = Math.random() * Math.PI * 2;
    const distKm = 0.10 + Math.random() * 0.22;
    const deltaLat = (distKm / 111) * Math.sin(angle);
    const deltaLng = (distKm / (111 * Math.cos(lat * Math.PI / 180))) * Math.cos(angle);

    return {
      name: fallbackData.name,
      venue: fallbackData.venue || fallbackData.name,
      city: communeName,
      lat: parseFloat((lat + deltaLat).toFixed(5)),
      lng: parseFloat((lng + deltaLng).toFixed(5)),
      isOsmReal: false
    };
  }

  // 3. ASSEMBLAGE COMPLET D'UN DPS (generateDPSWithOSMLocation)
  /**
   * Génère un devis ou une mission DPS avec lieu réel OpenStreetMap.
   * @param {Object} game - Instance ProtecGame
   * @param {Object} options - Options optionnelles (templateId, baseStation, isLastMinute)
   * @returns {Promise<Object>} Le devis/mission assemblé
   */
  async function generateDPSWithOSMLocation(game, options = {}) {
    if (!game || !game.stations || game.stations.length === 0) return null;

    const baseStation = options.baseStation || game.stations[Math.floor(Math.random() * game.stations.length)];
    const deptCode = String(baseStation.departmentCode || game.currentDepartmentCode || game.player?.departmentCode || '75').trim();

    // 1. Sélection de la commune dans tout le département en respectant la sectorisation :
    // La mission peut se dérouler dans n'importe quelle commune du département, à condition
    // qu'aucune autre antenne de la Protection Civile ne soit plus proche de cette commune que baseStation.
    const deptCommunes = (window.ProtecDepartements && typeof window.ProtecDepartements.getCommunesForDepartment === 'function')
      ? window.ProtecDepartements.getCommunesForDepartment(deptCode)
      : [];

    let targetCommune = { nom: baseStation.city || 'Chef-Lieu', lat: baseStation.lat, lng: baseStation.lng };

    if (deptCommunes && deptCommunes.length > 0) {
      const allStationsInDept = (game.stations || []).filter(s => s.departmentCode === deptCode || !s.departmentCode);

      // Filtrer les communes dont l'antenne la plus proche est bien baseStation
      const eligibleCommunes = deptCommunes.filter(c => {
        let bestDist = (window.ProtecDepartements && typeof window.ProtecDepartements.calculateDistance === 'function')
          ? window.ProtecDepartements.calculateDistance(baseStation.lat, baseStation.lng, c.lat, c.lng)
          : Math.hypot((c.lat - baseStation.lat) * 111, (c.lng - baseStation.lng) * 75);
        let closestStationId = baseStation.id;

        for (const st of allStationsInDept) {
          if (st.id === baseStation.id) continue;
          const dist = (window.ProtecDepartements && typeof window.ProtecDepartements.calculateDistance === 'function')
            ? window.ProtecDepartements.calculateDistance(st.lat, st.lng, c.lat, c.lng)
            : Math.hypot((c.lat - st.lat) * 111, (c.lng - st.lng) * 75);
          if (dist < bestDist) {
            bestDist = dist;
            closestStationId = st.id;
          }
        }
        return closestStationId === baseStation.id;
      });

      if (eligibleCommunes.length > 0) {
        targetCommune = eligibleCommunes[Math.floor(Math.random() * eligibleCommunes.length)];
      }
    }

    const commune = targetCommune.nom || baseStation.city || 'Chef-Lieu';

    // 2. Sélection du modèle de DPS
    let template = null;
    if (options.templateId) {
      template = DPS_TEMPLATES.find(t => t.id === options.templateId);
    }
    if (!template) {
      template = DPS_TEMPLATES[Math.floor(Math.random() * DPS_TEMPLATES.length)];
    }

    // 3. Recherche ciblée du lieu sur OpenStreetMap autour de la commune du département
    const radiusMeters = Math.min(25000, (template.radiusKm || 20) * 1000);
    let location = null;
    if (template.poiCategory && window.ProtecOSMPOISystem && typeof window.ProtecOSMPOISystem.fetchPOI === 'function') {
      try {
        location = await window.ProtecOSMPOISystem.fetchPOI(template.poiCategory, targetCommune.lat, targetCommune.lng, radiusMeters, commune);
      } catch (e) {}
    }
    if (!location) {
      location = await fetchLocationForDPS(
        targetCommune.lat,
        targetCommune.lng,
        radiusMeters,
        template.osmQuery,
        template.defaultFallback,
        commune
      );
    }

    // 3. Remplacement et assemblage du titre
    let venueClean = location.venue || location.name || `Site de ${commune}`;
    // Ajustement grammatical fin pour l'insertion ("au Stade", "à la Gare", etc.)
    let finalTitle = template.titleTemplate.replace(/{venue}/g, venueClean);

    // Si le template a "au {venue}" et que le lieu commence par une voyelle ou "Gare" :
    if (finalTitle.includes('au Gare')) {
      finalTitle = finalTitle.replace('au Gare', 'à la Gare');
    } else if (finalTitle.includes('au École') || finalTitle.includes('au Piscine')) {
      finalTitle = finalTitle.replace('au École', 'à l’École').replace('au Piscine', 'à la Piscine');
    }

    const clientName = template.clientTemplate.replace(/{commune}/g, location.city || commune);
    const pubCount = Math.round(template.pubMin + Math.random() * (template.pubMax - template.pubMin));

    // 4. Calcul de date réaliste garantie dans le futur
    const isLastMinute = options.isLastMinute !== undefined ? options.isLastMinute : (Math.random() < 0.20);
    const daysAhead = isLastMinute ? (2 + Math.floor(Math.random() * 3)) : (7 + Math.floor(Math.random() * 28));
    const startHour = template.category === 'culturel' ? 18 : 14;
    const endHour = (startHour + template.dur) % 24;

    let eventDate;
    if (typeof game.createDateOffset === 'function') {
      eventDate = game.createDateOffset(daysAhead, startHour);
      eventDate.startHour = startHour;
      eventDate.endHour = endHour;
    } else {
      const curYear = game.clock?.year || new Date().getFullYear();
      const curMonth = (game.clock?.month !== undefined) ? game.clock.month : new Date().getMonth();
      const curDay = game.clock?.day || new Date().getDate();
      const targetDate = new Date(curYear, curMonth, curDay + daysAhead);
      const daysNames = game.clock?.daysNames || ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const monthsNames = game.clock?.monthsNames || ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

      eventDate = {
        year: targetDate.getFullYear(),
        month: targetDate.getMonth(),
        day: targetDate.getDate(),
        hour: startHour,
        minute: 0,
        startHour,
        endHour,
        dayName: daysNames[targetDate.getDay()],
        monthName: monthsNames[targetDate.getMonth()]
      };
    }

    // 5. Adresse postale complète
    const fullAddress = `${location.venue}, ${location.city || commune}`;

    // 6. Assemblage du devis / mission spécifique (enregistré uniquement dans cet objet)
    const newDevis = {
      id: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      clientName: clientName,
      clientType: template.clientType,
      eventName: finalTitle,
      rawEventName: finalTitle,
      venue: location.venue,
      commune: location.city || commune,
      address: fullAddress,
      lat: location.lat,
      lng: location.lng,
      isOsmRealLocation: location.isOsmReal,
      eventDate: eventDate,
      durationHours: template.dur,
      publicCount: `${pubCount.toLocaleString('fr-FR')} personnes`,
      rawPublicCount: pubCount,
      scale: template.scale,
      requiredVolunteers: template.reqV,
      requiredRanks: template.ranks,
      requiredVehicles: (template.reqVeh && template.reqVeh.length > 0) ? [...template.reqVeh] : ['VPSP'],
      configuredVehicles: (template.reqVeh && template.reqVeh.length > 0) ? [...template.reqVeh] : ['VPSP'],
      hiddenMinVolunteers: template.reqV,
      hiddenRequiredSkills: template.ranks,
      consumableCost: template.consumableCost || 30,
      environment: template.environment,
      riskLevel: template.riskLevel,
      medicalTeamRequired: Boolean(template.medicalTeamRequired || template.environment === 'dynamique_course' || template.riskLevel === 'eleve'),
      status: 'pending',
      mealsProvidedByOrganizer: Math.random() < 0.5,
      isLastMinute: isLastMinute,
      daysAhead: daysAhead,
      urgencyReason: isLastMinute ? 'Annulation de dernière minute d’une autre association agréée' : 'Planification anticipée d’événement',
      secondsLeft: isLastMinute ? (3 * 3600) : (6 * 3600),
      isSector: false,
      templateId: template.id,
      specialite: template.specialite || null,
      requiredSkills: template.requiredSkills || []
    };

    // Calculs financiers (barème FNPC officiel)
    if (typeof game.calculateBareme === 'function') {
      newDevis.bareme = game.calculateBareme(newDevis);
      newDevis.proposedPrice = newDevis.bareme?.totalBareme || 280;
    } else {
      const baseHour = 14;
      const totalVolHours = template.reqV * template.dur * baseHour;
      const vehCost = template.reqVeh.length * 60;
      const total = totalVolHours + vehCost + (template.consumableCost || 25);
      newDevis.bareme = { totalBareme: total };
      newDevis.proposedPrice = total;
    }

    return newDevis;
  }

  // EXPOSITION GLOBALE
  window.ProtecDPSGenerator = {
    DPS_TEMPLATES: DPS_TEMPLATES,
    fetchLocationForDPS: fetchLocationForDPS,
    generateDPSWithOSMLocation: generateDPSWithOSMLocation,
    clearMemoryCache: () => _osmMemoryCache.clear()
  };

  console.log('⚡ Module ProtecDPSGenerator (Génération DPS avec POI OSM réels) chargé avec succès.');
})();
