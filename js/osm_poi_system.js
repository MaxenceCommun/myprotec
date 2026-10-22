/**
 * PROTEC LIVE / MYPROTEC - SYSTÈME UNIFIÉ DE RÉCUPÉRATION ET D'INTÉGRATION DES POI OSM
 * (Overpass API / Overpass Turbo)
 * 
 * RÔLE :
 * Récupère en temps réel les données géographiques réelles (POI OpenStreetMap) pour :
 * 1. Gares et haltes ferroviaires (railway=station|halt)
 * 2. Centres commerciaux, hypermarchés et galeries (shop=mall|supermarket|department_store)
 * 3. Hôpitaux, CHU et cliniques (amenity=hospital|clinic)
 * 4. Stades, terrains de sport et gymnases (leisure=stadium|sports_centre|pitch, amenity=dojo)
 * 5. Plans d'eau, lacs, fleuves, rivières et canaux (natural=water, waterway=riverbank)
 * 6. Monuments, châteaux, musées et patrimoine (historic=monument|memorial|castle, tourism=attraction|museum)
 * 7. Aéroports, aérodromes et héliports (aeroway=aerodrome|terminal|helipad)
 * 8. Centres de secours / Casernes de pompiers (amenity=fire_station)
 * 9. Commissariats et gendarmeries (amenity=police|gendarmerie)
 * 10. Parcs publics, jardins et promenades (leisure=park|garden)
 * 11. Plages et espaces de baignade (natural=beach, leisure=beach_resort)
 * 12. Autoroutes, échangeurs et péages (highway=motorway|motorway_junction|toll_gantry)
 * 
 * UTILISATIONS DANS LE JEU :
 * - Dispositifs Prévisionnels de Secours (DPS)
 * - Missions d'urgence et Crises NOVI
 * - Évacuations & Transports sanitaires SAMU 15 (vers les hôpitaux réels)
 * - Renforts Pompiers / SDIS
 * - Missions Nautiques avec embarcations (ERS, BRS, Bateau)
 * 
 * PERFORMANCE & RÉSILIENCE :
 * - Cache mémoire de session (TTL 15 min) indexé par catégorie et coordonnées arrondies.
 * - Multiples miroirs Overpass en fallback avec timeout court (3.5s) non-bloquant.
 * - Préchauffage en arrière-plan autour de l'antenne active dès le chargement.
 * - Fallbacks procéduraux géographiquement cohérents en cas d'indisponibilité réseau.
 */

(function () {
  'use strict';

  // Cache mémoire global des POI OSM
  const _poiCache = new Map();
  const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  // Miroirs Overpass API haute disponibilité
  const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  // 1. DICTIONNAIRE DES CATÉGORIES ET REQUÊTES OVERPASS NORMALISÉES
  const POI_CATEGORIES = {
    gares: {
      id: 'gares',
      label: 'Gares & Halte Ferroviaires',
      icon: 'train',
      overpassQuery: '(node["railway"~"station|halt"](around:{radius},{lat},{lng});way["railway"~"station|halt"](around:{radius},{lat},{lng}););',
      defaultRadiusMeters: 25000,
      keywords: ['gare', 'train', 'sncf', 'rail', 'voyageur', 'quai', 'catenaire', 'caténaire', 'ter', 'tgv', 'ferroviaire', 'plan rail'],
      cleanName: (raw, commune) => {
        let n = (raw || '').trim();
        if (!n) return `Gare SNCF de ${commune}`;
        if (!/gare/i.test(n)) n = `Gare de ${n}`;
        return n;
      },
      fallback: (commune) => ({
        name: `Gare SNCF de ${commune}`,
        venue: `Gare SNCF de ${commune}`,
        category: 'gares'
      })
    },

    centres_commerciaux: {
      id: 'centres_commerciaux',
      label: 'Centres Commerciaux & Grandes Surfaces',
      icon: 'shopping-bag',
      overpassQuery: '(node["shop"~"mall|department_store|supermarket"](around:{radius},{lat},{lng});way["shop"~"mall|department_store|supermarket"](around:{radius},{lat},{lng}););',
      defaultRadiusMeters: 20000,
      keywords: ['commercial', 'commerce', 'supermarche', 'supermarché', 'hypermarché', 'galerie', 'magasin', 'soldes', 'boutique', 'centre commercial', 'grande surface'],
      cleanName: (raw, commune) => {
        let n = (raw || '').trim();
        if (!n) return `Centre Commercial de ${commune}`;
        if (!/centre|galerie|espace|hyper|supermarche/i.test(n)) n = `Centre Commercial ${n}`;
        return n;
      },
      fallback: (commune) => ({
        name: `Centre Commercial de ${commune}`,
        venue: `Centre Commercial de ${commune}`,
        category: 'centres_commerciaux'
      })
    },

    hopitaux: {
      id: 'hopitaux',
      label: 'Hôpitaux, CHU & Cliniques',
      icon: 'hospital',
      overpassQuery: '(node["amenity"~"hospital|clinic"](around:{radius},{lat},{lng});way["amenity"~"hospital|clinic"](around:{radius},{lat},{lng}););',
      defaultRadiusMeters: 30000,
      keywords: ['hopital', 'hôpital', 'chu', 'clinique', 'urgences', 'samu', 'smur', 'sau', 'sante', 'santé', 'medical', 'médical', 'hospitalier', 'evacuation', 'évacuation', 'ch '],
      cleanName: (raw, commune) => {
        let n = (raw || '').trim();
        if (!n) return `Centre Hospitalier de ${commune}`;
        if (!/hopital|hôpital|chu|ch |clinique|centre hospitalier/i.test(n)) n = `Centre Hospitalier ${n}`;
        return n;
      },
      fallback: (commune) => ({
        name: `Centre Hospitalier de ${commune}`,
        venue: `Centre Hospitalier de ${commune}`,
        category: 'hopitaux'
      })
    },

    sports: {
      id: 'sports',
      label: 'Stades, Terrains de sport & Gymnases',
      icon: 'trophy',
      overpassQuery: '(node["leisure"~"stadium|sports_centre|pitch"](around:{radius},{lat},{lng});way["leisure"~"stadium|sports_centre|pitch"](around:{radius},{lat},{lng});node["amenity"="dojo"](around:{radius},{lat},{lng});way["amenity"="dojo"](around:{radius},{lat},{lng}););',
      defaultRadiusMeters: 20000,
      keywords: ['stade', 'gymnase', 'sport', 'football', 'rugby', 'athletisme', 'athlétisme', 'match', 'tournoi', 'dojo', 'complexe sportif', 'terrain de sport', 'omnisport'],
      cleanName: (raw, commune) => {
        let n = (raw || '').trim();
        if (!n) return `Complexe Sportif de ${commune}`;
        if (!/stade|gymnase|complexe|terrain|salle/i.test(n)) n = `Complexe Sportif ${n}`;
        return n;
      },
      fallback: (commune) => ({
        name: `Complexe Sportif Municipal de ${commune}`,
        venue: `Stade Municipal de ${commune}`,
        category: 'sports'
      })
    },

    plans_eau: {
      id: 'plans_eau',
      label: 'Plans d’eau, Lacs, Fleuves & Canaux',
      icon: 'droplets',
      overpassQuery: '(node["natural"="water"](around:{radius},{lat},{lng});way["natural"="water"](around:{radius},{lat},{lng});node["leisure"="swimming_pool"](around:{radius},{lat},{lng});way["waterway"="riverbank"](around:{radius},{lat},{lng});node["waterway"~"dock|lock_gate"](around:{radius},{lat},{lng}););',
      defaultRadiusMeters: 30000,
      keywords: ['eau', 'lac', 'riviere', 'rivière', 'fleuve', 'canal', 'etang', 'étang', 'nautique', 'bateau', 'ers', 'brs', 'crue', 'inondation', 'noyade', 'embarcation', 'sauvetage aquatique', 'aquatique'],
      cleanName: (raw, commune) => {
        let n = (raw || '').trim();
        if (!n) return `Plan d’Eau de ${commune}`;
        if (!/lac|étang|etang|plan d’eau|plan d'eau|rivière|riviere|canal|fleuve|bassin/i.test(n)) n = `Plan d'Eau ${n}`;
        return n;
      },
      fallback: (commune) => ({
        name: `Plan d’Eau Municipal de ${commune}`,
        venue: `Berges du Plan d’Eau de ${commune}`,
        category: 'plans_eau'
      })
    },

    monuments: {
      id: 'monuments',
      label: 'Monuments, Musées & Patrimoine',
      icon: 'landmark',
      overpassQuery: '(node["historic"~"monument|memorial|castle|ruins"](around:{radius},{lat},{lng});way["historic"~"monument|memorial|castle|ruins"](around:{radius},{lat},{lng});node["tourism"~"attraction|museum"](around:{radius},{lat},{lng});way["tourism"~"attraction|museum"](around:{radius},{lat},{lng}););',
      defaultRadiusMeters: 25000,
      keywords: ['monument', 'chateau', 'château', 'memorial', 'mémorial', 'musee', 'musée', 'patrimoine', 'historique', 'visite', 'statue', 'attraction', 'commemoration', 'commémoration', 'défilé', 'defile'],
      cleanName: (raw, commune) => {
        let n = (raw || '').trim();
        if (!n) return `Monument Historique de ${commune}`;
        return n;
      },
      fallback: (commune) => ({
        name: `Monument Historique de ${commune}`,
        venue: `Esplanade du Monument de ${commune}`,
        category: 'monuments'
      })
    },

    aeroports: {
      id: 'aeroports',
      label: 'Aéroports, Aérodromes & Héliports',
      icon: 'plane',
      overpassQuery: '(node["aeroway"~"aerodrome|terminal|helipad"](around:{radius},{lat},{lng});way["aeroway"~"aerodrome|terminal|helipad"](around:{radius},{lat},{lng}););',
      defaultRadiusMeters: 35000,
      keywords: ['aeroport', 'aéroport', 'aerodrome', 'aérodrome', 'avion', 'heliport', 'héliport', 'piste', 'sater', 'crash', 'aerien', 'aérien', 'aeronautique', 'aéronautique', 'atterrissage'],
      cleanName: (raw, commune) => {
        let n = (raw || '').trim();
        if (!n) return `Aérodrome de ${commune}`;
        if (!/aéroport|aeroport|aérodrome|aerodrome|héliport|heliport/i.test(n)) n = `Aérodrome de ${n}`;
        return n;
      },
      fallback: (commune) => ({
        name: `Aérodrome Régional de ${commune}`,
        venue: `Aérodrome Régional de ${commune}`,
        category: 'aeroports'
      })
    },

    casernes: {
      id: 'casernes',
      label: 'Centres de secours & Casernes de Pompiers',
      icon: 'flame',
      overpassQuery: '(node["amenity"="fire_station"](around:{radius},{lat},{lng});way["amenity"="fire_station"](around:{radius},{lat},{lng}););',
      defaultRadiusMeters: 25000,
      keywords: ['pompier', 'pompiers', 'sdis', 'cis', 'csp', 'caserne', 'incendie', 'feu', 'fpt', 'vsav', 'secours incendie', 'renfort sdis', 'sainte-barbe'],
      cleanName: (raw, commune) => {
        let n = (raw || '').trim();
        if (!n) return `Centre d’Incendie et de Secours de ${commune}`;
        if (!/cis|csp|caserne|centre d'incendie|pompiers/i.test(n)) n = `CIS ${n}`;
        return n;
      },
      fallback: (commune) => ({
        name: `Centre d’Incendie et de Secours de ${commune}`,
        venue: `Caserne des Pompiers de ${commune}`,
        category: 'casernes'
      })
    },

    police: {
      id: 'police',
      label: 'Commissariats & Gendarmeries',
      icon: 'shield',
      overpassQuery: '(node["amenity"~"police|gendarmerie"](around:{radius},{lat},{lng});way["amenity"~"police|gendarmerie"](around:{radius},{lat},{lng}););',
      defaultRadiusMeters: 25000,
      keywords: ['police', 'gendarmerie', 'commissariat', 'fdo', 'brigade', 'garde à vue', 'gav', 'securite', 'sécurité', 'ordre public', 'forces de l’ordre'],
      cleanName: (raw, commune) => {
        let n = (raw || '').trim();
        if (!n) return `Commissariat de Police de ${commune}`;
        if (!/commissariat|gendarmerie|hôtel de police|hotel de police|brigade/i.test(n)) n = `Commissariat de Police ${n}`;
        return n;
      },
      fallback: (commune) => ({
        name: `Commissariat de Police de ${commune}`,
        venue: `Commissariat de Police de ${commune}`,
        category: 'police'
      })
    },

    parcs: {
      id: 'parcs',
      label: 'Parcs Publics & Jardins Urbains',
      icon: 'trees',
      overpassQuery: '(node["leisure"~"park|garden"](around:{radius},{lat},{lng});way["leisure"~"park|garden"](around:{radius},{lat},{lng}););',
      defaultRadiusMeters: 20000,
      keywords: ['parc', 'jardin', 'square', 'promenade', 'espace vert', 'maraude', 'canicule', 'plein air', 'nature', 'festival plein air'],
      cleanName: (raw, commune) => {
        let n = (raw || '').trim();
        if (!n) return `Parc Municipal de ${commune}`;
        if (!/parc|jardin|square|promenade/i.test(n)) n = `Parc ${n}`;
        return n;
      },
      fallback: (commune) => ({
        name: `Parc Municipal de ${commune}`,
        venue: `Parc Public de ${commune}`,
        category: 'parcs'
      })
    },

    plages: {
      id: 'plages',
      label: 'Plages & Espaces de Baignade',
      icon: 'sun',
      overpassQuery: '(node["natural"="beach"](around:{radius},{lat},{lng});way["natural"="beach"](around:{radius},{lat},{lng});node["leisure"="beach_resort"](around:{radius},{lat},{lng});way["leisure"="beach_resort"](around:{radius},{lat},{lng}););',
      defaultRadiusMeters: 35000,
      keywords: ['plage', 'baignade', 'sable', 'mer', 'littoral', 'côte', 'cote', 'cotiere', 'côtière', 'sauvetage cotier', 'surveillance plage', 'poste de plage'],
      cleanName: (raw, commune) => {
        let n = (raw || '').trim();
        if (!n) return `Plage de ${commune}`;
        if (!/plage|baignade/i.test(n)) n = `Plage de ${n}`;
        return n;
      },
      fallback: (commune) => ({
        name: `Plage Aménagée de ${commune}`,
        venue: `Poste de Secours Plage de ${commune}`,
        category: 'plages'
      })
    },

    autoroutes: {
      id: 'autoroutes',
      label: 'Autoroutes & Échangeurs',
      icon: 'car',
      overpassQuery: '(node["highway"="motorway_junction"](around:{radius},{lat},{lng});way["highway"="motorway"](around:{radius},{lat},{lng});node["highway"="toll_gantry"](around:{radius},{lat},{lng}););',
      defaultRadiusMeters: 30000,
      keywords: ['autoroute', 'echangeur', 'échangeur', 'peage', 'péage', 'avp', 'carambolage', 'voie rapide', 'naufrages de la route', 'rocade', 'voie express'],
      cleanName: (raw, commune) => {
        let n = (raw || '').trim();
        if (!n) return `Autoroute (Secteur ${commune})`;
        if (!/autoroute|échangeur|echangeur|péage|peage|a[0-9]+/i.test(n)) n = `Échangeur ${n}`;
        return n;
      },
      fallback: (commune) => ({
        name: `Autoroute A (Secteur ${commune})`,
        venue: `Échangeur Autoroutier de ${commune}`,
        category: 'autoroutes'
      })
    }
  };

  // 2. MOTEUR D'INTERROGATION OVERPASS AVEC CACHE & TIMEOUT RÉSISTANT
  /**
   * Interroge l'API Overpass pour une catégorie donnée dans un rayon autour d'un point.
   */
  async function fetchPOIByCategory(categoryKey, lat, lng, radiusMeters = null, fallbackCommune = 'Secteur') {
    const config = POI_CATEGORIES[categoryKey];
    if (!config) {
      console.warn(`[ProtecOSMPOISystem] Catégorie inconnue : ${categoryKey}`);
      return null;
    }

    const radius = Math.min(45000, Math.max(5000, radiusMeters || config.defaultRadiusMeters));
    const roundLat = Math.round(lat * 100) / 100;
    const roundLng = Math.round(lng * 100) / 100;
    const cacheKey = `${categoryKey}_${radius}_${roundLat}_${roundLng}`;

    // A. Consultation du Cache Mémoire
    const cached = _poiCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < CACHE_TTL_MS) && Array.isArray(cached.elements) && cached.elements.length > 0) {
      const pick = cached.elements[Math.floor(Math.random() * cached.elements.length)];
      return {
        ...pick,
        isOsmReal: true,
        fromCache: true,
        category: categoryKey
      };
    }

    // B. Construction de la requête Overpass Turbo QL
    const builtQuery = config.overpassQuery
      .replace(/{radius}/g, String(radius))
      .replace(/{lat}/g, lat.toFixed(5))
      .replace(/{lng}/g, lng.toFixed(5));

    const fullQuery = `[out:json][timeout:4];${builtQuery}out center body 25;`;

    let foundElements = [];

    // C. Tentative sur les miroirs Overpass avec timeout court non-bloquant (3.5s)
    for (const ep of OVERPASS_ENDPOINTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(fullQuery)}`,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.elements) && data.elements.length > 0) {
            foundElements = data.elements
              .map(el => {
                const tags = el.tags || {};
                const rawName = tags.name || tags.operator || tags.ref || tags['addr:housename'] || tags.description;
                if (!rawName || String(rawName).trim().length < 2) return null;

                const eLat = el.lat || el.center?.lat;
                const eLng = el.lon || el.center?.lon;
                if (!eLat || !eLng) return null;

                const cleanName = config.cleanName(rawName, fallbackCommune);
                const city = tags['addr:city'] || tags['addr:municipality'] || fallbackCommune;
                const street = tags['addr:street'] ? `${tags['addr:housenumber'] ? tags['addr:housenumber'] + ' ' : ''}${tags['addr:street']}` : '';

                return {
                  name: cleanName,
                  venue: cleanName,
                  rawName: rawName,
                  city: city,
                  address: street ? `${cleanName}, ${street}, ${city}` : `${cleanName}, ${city}`,
                  lat: parseFloat(Number(eLat).toFixed(5)),
                  lng: parseFloat(Number(eLng).toFixed(5)),
                  osmId: el.id,
                  category: categoryKey,
                  tags: tags
                };
              })
              .filter(Boolean);

            if (foundElements.length > 0) {
              _poiCache.set(cacheKey, {
                timestamp: now,
                elements: foundElements
              });
              break; // Succès, arrêt de la boucle des miroirs
            }
          }
        }
      } catch (err) {
        // En cas de timeout ou indisponibilité, tentative sur le miroir suivant
      }
    }

    // D. Si des éléments réels sont trouvés
    if (foundElements.length > 0) {
      const selected = foundElements[Math.floor(Math.random() * foundElements.length)];
      return {
        ...selected,
        isOsmReal: true,
        category: categoryKey
      };
    }

    // E. Fallback procédural cohérent
    const fb = config.fallback(fallbackCommune);
    const angle = Math.random() * Math.PI * 2;
    const distKm = 0.15 + Math.random() * 0.35;
    const deltaLat = (distKm / 111) * Math.sin(angle);
    const deltaLng = (distKm / (111 * Math.cos(lat * Math.PI / 180))) * Math.cos(angle);

    return {
      name: fb.name,
      venue: fb.venue || fb.name,
      city: fallbackCommune,
      address: `${fb.venue || fb.name}, ${fallbackCommune}`,
      lat: parseFloat((lat + deltaLat).toFixed(5)),
      lng: parseFloat((lng + deltaLng).toFixed(5)),
      isOsmReal: false,
      isFallback: true,
      category: categoryKey
    };
  }

  // 3. DÉTECTION INTELLIGENTE DE LA CATÉGORIE APPROPRIÉE DEPUIS LE CONTEXTE D'UNE MISSION
  function detectCategoryFromMission(mission) {
    if (!mission) return null;

    // Si la mission ou le devis a déjà une catégorie OSM explicite
    if (mission.osmCategory && POI_CATEGORIES[mission.osmCategory]) {
      return mission.osmCategory;
    }

    // Détection par véhicule ou spécialité requise
    const reqVeh = Array.isArray(mission.requiredVehicles) ? mission.requiredVehicles : (mission.reqVeh || []);
    const isNautical = reqVeh.some(v => ['ERS', 'BRS', 'BATEAU'].includes(String(v).toUpperCase())) ||
      (mission.specialite === 'nautique') ||
      (mission.requiredSkills && mission.requiredSkills.includes('permis_bateau'));

    if (isNautical) {
      return 'plans_eau';
    }

    const type = String(mission.type || mission.category || '').toLowerCase();
    const title = String(mission.title || mission.eventName || mission.name || '').toLowerCase();
    const desc = String(mission.desc || mission.description || mission.scenarioText || '').toLowerCase();
    const fullText = `${type} ${title} ${desc}`;

    // Test des mots-clés par ordre de priorité opérationnelle
    // 1. Gares / Ferroviaire
    if (POI_CATEGORIES.gares.keywords.some(kw => fullText.includes(kw))) return 'gares';

    // 2. Aéroports / Crash
    if (POI_CATEGORIES.aeroports.keywords.some(kw => fullText.includes(kw))) return 'aeroports';

    // 3. Autoroutes / Carambolage
    if (POI_CATEGORIES.autoroutes.keywords.some(kw => fullText.includes(kw))) return 'autoroutes';

    // 4. Plages
    if (POI_CATEGORIES.plages.keywords.some(kw => fullText.includes(kw))) return 'plages';

    // 5. Plans d'eau / Crues
    if (POI_CATEGORIES.plans_eau.keywords.some(kw => fullText.includes(kw))) return 'plans_eau';

    // 6. Centres Commerciaux
    if (POI_CATEGORIES.centres_commerciaux.keywords.some(kw => fullText.includes(kw))) return 'centres_commerciaux';

    // 7. Monuments / Patrimoine
    if (POI_CATEGORIES.monuments.keywords.some(kw => fullText.includes(kw))) return 'monuments';

    // 8. Sports / Stades / Gymnases
    if (POI_CATEGORIES.sports.keywords.some(kw => fullText.includes(kw))) return 'sports';

    // 9. Parcs / Jardins
    if (POI_CATEGORIES.parcs.keywords.some(kw => fullText.includes(kw))) return 'parcs';

    // 10. Casernes Pompiers / SDIS
    if (type === 'pompiers' || POI_CATEGORIES.casernes.keywords.some(kw => fullText.includes(kw))) return 'casernes';

    // 11. Police / Gendarmerie
    if (POI_CATEGORIES.police.keywords.some(kw => fullText.includes(kw))) return 'police';

    // 12. Hôpitaux / SAMU
    if (type === 'samu' || POI_CATEGORIES.hopitaux.keywords.some(kw => fullText.includes(kw))) return 'hopitaux';

    // Type DPS standard : fallback sur sports ou parcs
    if (type === 'dps') {
      return (Math.random() < 0.6) ? 'sports' : 'parcs';
    }

    return null;
  }

  // 4. ENRICHISSEMENT ASYNCHRONE D'UNE MISSION AVEC UN VRAI LIEU OSM
  /**
   * Enrichit un objet mission, devis ou crise avec un POI réel extrait d'Overpass.
   * Modifie en place l'objet et renvoie une promesse résolue avec le lieu.
   */
  async function enrichMissionWithRealPOI(mission, baseStation = null) {
    if (!mission) return null;

    // Si la mission a déjà été résolue avec un lieu OSM réel, la laisser intacte
    if (mission.isOsmRealLocation && mission.venue) {
      return {
        name: mission.venue,
        venue: mission.venue,
        city: mission.commune || mission.city,
        lat: mission.lat,
        lng: mission.lng,
        isOsmReal: true
      };
    }

    const cat = detectCategoryFromMission(mission);
    if (!cat) return null;

    const base = baseStation || {
      lat: mission.lat || 48.6921,
      lng: mission.lng || 6.1844,
      city: mission.commune || mission.city || 'Secteur'
    };

    const communeName = mission.commune || mission.city || base.city || 'Secteur';
    const poi = await fetchPOIByCategory(cat, base.lat, base.lng, null, communeName);

    if (poi) {
      mission.lat = poi.lat;
      mission.lng = poi.lng;
      mission.venue = poi.venue || poi.name;
      mission.commune = poi.city || communeName;
      mission.city = poi.city || communeName;
      mission.address = poi.address || `${poi.venue}, ${mission.commune}`;
      mission.isOsmRealLocation = poi.isOsmReal;
      mission.osmCategory = cat;
      mission.osmId = poi.osmId;

      // Si le titre contient une variable {venue}, le remplacer
      if (mission.title && mission.title.includes('{venue}')) {
        mission.title = mission.title.replace('{venue}', poi.venue);
      }
      if (mission.eventName && mission.eventName.includes('{venue}')) {
        mission.eventName = mission.eventName.replace('{venue}', poi.venue);
      }

      // Si Leaflet est présent et que la mission a un marqueur sur la carte, repositionner le marqueur
      if (window.game && window.game.map && mission.marker) {
        try {
          mission.marker.setLatLng([poi.lat, poi.lng]);
        } catch (e) {}
      }
    }

    return poi;
  }

  // 5. PRÉCHAUFFAGE DU CACHE EN ARRIÈRE-PLAN AUTOUR DE L'ANTENNE
  /**
   * Lance des requêtes Overpass en arrière-plan pour alimenter le cache dès le lancement du jeu.
   * Ainsi, lorsque des missions surviennent, les résultats sont déjà en mémoire !
   */
  function warmupCacheAroundStation(lat, lng, communeName = 'Secteur') {
    if (!lat || !lng) return;
    const essentialCategories = ['sports', 'centres_commerciaux', 'gares', 'plans_eau', 'casernes', 'hopitaux'];

    // Échelonnement discret des requêtes en arrière-plan
    essentialCategories.forEach((catKey, index) => {
      setTimeout(() => {
        fetchPOIByCategory(catKey, lat, lng, null, communeName)
          .then(res => {
            if (res && res.isOsmReal) {
              // POI mis en cache avec succès
            }
          })
          .catch(() => {});
      }, 1000 + (index * 1500));
    });
  }

  // 6. EXPOSITION GLOBALE
  window.ProtecOSMPOISystem = {
    POI_CATEGORIES: POI_CATEGORIES,
    fetchPOI: fetchPOIByCategory,
    detectCategoryFromMission: detectCategoryFromMission,
    enrichMissionWithRealPOI: enrichMissionWithRealPOI,
    warmupCacheAroundStation: warmupCacheAroundStation,
    clearCache: () => _poiCache.clear(),
    getCacheSize: () => _poiCache.size
  };

  console.log('⚡ Module ProtecOSMPOISystem (POI Overpass Turbo Réels) chargé avec succès (12 catégories d’infrastructures opérationnelles).');
})();
