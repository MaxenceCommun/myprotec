/**
 * PROTEC LIVE - MODULE ÉVÉNEMENTS RÉELS DU TERRITOIRE & ANCRAGE RÉEL DPS
 * 
 * Génère et actualise un vivier d'une vingtaine d'événements réels ou fortement ancrés
 * dans le territoire pour chaque antenne (clubs sportifs réels, festivals, marathons,
 * foires, manifestations locales avec leur commune et public attendu).
 * Calcule automatiquement selon le RNMSC toutes les informations manquantes :
 * RIS (Ratio d'Intervenants Secouristes), dimensionnement (PAPS/DPS-PE/DPS-ME/DPS-GE),
 * effectifs (PSE1/PSE2/CE/CD), vecteurs (VPSP/VTU/VL) et barèmes.
 * 
 * Déclencheurs :
 * 1. Lors du placement de l'antenne (fondation/implantation sur la carte).
 * 2. Avec une mise à jour automatique 1 fois par mois (cycle calendaire).
 */

(function() {
  'use strict';

  window.ProtecEvenementsReels = {

    // =========================================================================
    // 1. BASE DE DONNÉES DES CLUBS DE SPORT RÉELS FRANÇAIS (PAR DÉPARTEMENT)
    // =========================================================================
    REAL_SPORTS_CLUBS: {
      '75': [
        { name: 'Paris Saint-Germain (PSG)', sport: 'Football', venue: 'Parc des Princes', capacity: 48000, avgAttendance: 46500, city: 'Paris', client: 'Société d’Exploitation PSG' },
        { name: 'Paris Basketball', sport: 'Basketball', venue: 'Adidas Arena', capacity: 8000, avgAttendance: 7500, city: 'Paris', client: 'Paris Basketball SASP' },
        { name: 'Stade Français Paris', sport: 'Rugby', venue: 'Stade Jean-Bouin', capacity: 20000, avgAttendance: 14500, city: 'Paris', client: 'Stade Français Paris Rugby' },
        { name: 'PSG Handball', sport: 'Handball', venue: 'Stade Pierre-de-Coubertin', capacity: 4000, avgAttendance: 3600, city: 'Paris', client: 'Section Handball PSG' }
      ],
      '92': [
        { name: 'Racing 92', sport: 'Rugby', venue: 'Paris La Défense Arena', capacity: 30000, avgAttendance: 18000, city: 'Nanterre', client: 'Racing Arena SASP' },
        { name: 'Nanterre 92', sport: 'Basketball', venue: 'Palais des Sports Maurice Thorez', capacity: 3000, avgAttendance: 2800, city: 'Nanterre', client: 'Nanterre 92 Basket' }
      ],
      '93': [
        { name: 'Red Star FC', sport: 'Football', venue: 'Stade Bauer', capacity: 10000, avgAttendance: 5500, city: 'Saint-Ouen-sur-Seine', client: 'Red Star FC SASP' }
      ],
      '13': [
        { name: 'Olympique de Marseille (OM)', sport: 'Football', venue: 'Orange Vélodrome', capacity: 67000, avgAttendance: 62500, city: 'Marseille', client: 'Olympique de Marseille SASP' },
        { name: 'Provence Rugby', sport: 'Rugby', venue: 'Stade Maurice-David', capacity: 8500, avgAttendance: 7200, city: 'Aix-en-Provence', client: 'Provence Rugby SAS' },
        { name: 'Fos Provence Basket', sport: 'Basketball', venue: 'Complexe Parsemain', capacity: 2000, avgAttendance: 1700, city: 'Fos-sur-Mer', client: 'Fos Provence Basket' }
      ],
      '69': [
        { name: 'Olympique Lyonnais (OL)', sport: 'Football', venue: 'Groupama Stadium', capacity: 59186, avgAttendance: 45000, city: 'Décines-Charpieu', client: 'Olympique Lyonnais Groupe' },
        { name: 'LDLC ASVEL Basket', sport: 'Basketball', venue: 'LDLC Arena / Astroballe', capacity: 12500, avgAttendance: 9800, city: 'Villeurbanne', client: 'ASVEL Basket SASP' },
        { name: 'LOU Rugby', sport: 'Rugby', venue: 'Matmut Stadium de Gerland', capacity: 35000, avgAttendance: 16500, city: 'Lyon', client: 'Lyon Olympique Universitaire' }
      ],
      '59': [
        { name: 'LOSC Lille', sport: 'Football', venue: 'Decathlon Arena - Stade Pierre-Mauroy', capacity: 50186, avgAttendance: 41000, city: 'Villeneuve-d’Ascq', client: 'LOSC Lille SASP' },
        { name: 'Valenciennes FC (VAFC)', sport: 'Football', venue: 'Stade du Hainaut', capacity: 25172, avgAttendance: 8500, city: 'Valenciennes', client: 'Valenciennes FC' },
        { name: 'Dunkerque HGL', sport: 'Handball', venue: 'Stades de Flandres', capacity: 2400, avgAttendance: 2200, city: 'Dunkerque', client: 'US Dunkerque Handball' },
        { name: 'BCM Gravelines-Dunkerque', sport: 'Basketball', venue: 'Sportica / Salle Calypso', capacity: 3000, avgAttendance: 2800, city: 'Gravelines', client: 'BCM Dunkerque' }
      ],
      '62': [
        { name: 'RC Lens', sport: 'Football', venue: 'Stade Bollaert-Delelis', capacity: 38223, avgAttendance: 37800, city: 'Lens', client: 'Racing Club de Lens SASP' }
      ],
      '33': [
        { name: 'Girondins de Bordeaux', sport: 'Football', venue: 'Matmut Atlantique', capacity: 42115, avgAttendance: 18500, city: 'Bordeaux', client: 'FC Girondins de Bordeaux' },
        { name: 'Union Bordeaux Bègles (UBB)', sport: 'Rugby', venue: 'Stade Chaban-Delmas', capacity: 34694, avgAttendance: 29000, city: 'Bordeaux', client: 'Union Bordeaux Bègles Rugby' }
      ],
      '31': [
        { name: 'Stade Toulousain', sport: 'Rugby', venue: 'Stade Ernest-Wallon', capacity: 19000, avgAttendance: 18800, city: 'Toulouse', client: 'Stade Toulousain Rugby' },
        { name: 'Toulouse Football Club (TFC)', sport: 'Football', venue: 'Stadium de Toulouse', capacity: 33150, avgAttendance: 26000, city: 'Toulouse', client: 'Toulouse FC SASP' },
        { name: 'Fenix Toulouse Handball', sport: 'Handball', venue: 'Palais des Sports André Brouat', capacity: 4300, avgAttendance: 3400, city: 'Toulouse', client: 'Fenix Handball' }
      ],
      '44': [
        { name: 'FC Nantes', sport: 'Football', venue: 'Stade de la Beaujoire - Louis Fonteneau', capacity: 35322, avgAttendance: 29500, city: 'Nantes', client: 'FC Nantes SASP' },
        { name: 'HBC Nantes', sport: 'Handball', venue: 'H Arena (Palais des Sports)', capacity: 5900, avgAttendance: 5800, city: 'Nantes', client: 'HBC Nantes SASP' },
        { name: 'Hermine de Nantes Basket', sport: 'Basketball', venue: 'Salle de la Trocardière', capacity: 4200, avgAttendance: 3100, city: 'Rezé', client: 'Nantes Basket Hermine' }
      ],
      '35': [
        { name: 'Stade Rennais FC', sport: 'Football', venue: 'Roazhon Park', capacity: 29778, avgAttendance: 27500, city: 'Rennes', client: 'Stade Rennais FC' },
        { name: 'Cesson Rennes MHB', sport: 'Handball', venue: 'Glaz Arena', capacity: 4500, avgAttendance: 3900, city: 'Cesson-Sévigné', client: 'Cesson Rennes Handball' }
      ],
      '67': [
        { name: 'RC Strasbourg Alsace (RCSA)', sport: 'Football', venue: 'Stade de la Meinau', capacity: 26109, avgAttendance: 25400, city: 'Strasbourg', client: 'Racing Club de Strasbourg Alsace' },
        { name: 'SIG Strasbourg', sport: 'Basketball', venue: 'Rhénus Sport', capacity: 6200, avgAttendance: 5400, city: 'Strasbourg', client: 'SIG Basket SASP' }
      ],
      '06': [
        { name: 'OGC Nice', sport: 'Football', venue: 'Allianz Riviera', capacity: 36178, avgAttendance: 24500, city: 'Nice', client: 'OGC Nice Côte d’Azur' },
        { name: 'AS Monaco FC', sport: 'Football', venue: 'Stade Louis-II', capacity: 18523, avgAttendance: 11000, city: 'Monaco / Cap-d’Ail', client: 'AS Monaco FC SAM' }
      ],
      '34': [
        { name: 'Montpellier Hérault SC (MHSC)', sport: 'Football', venue: 'Stade de la Mosson', capacity: 22000, avgAttendance: 14000, city: 'Montpellier', client: 'Montpellier Hérault SC' },
        { name: 'Montpellier Hérault Rugby (MHR)', sport: 'Rugby', venue: 'GGL Stadium', capacity: 15697, avgAttendance: 11500, city: 'Montpellier', client: 'Montpellier HR SASP' },
        { name: 'Montpellier Handball (MHB)', sport: 'Handball', venue: 'FDI Stadium / Sud de France Arena', capacity: 3000, avgAttendance: 2900, city: 'Montpellier', client: 'Montpellier Handball' }
      ],
      '54': [
        { name: 'AS Nancy-Lorraine (ASNL)', sport: 'Football', venue: 'Stade Marcel-Picot', capacity: 20087, avgAttendance: 11500, city: 'Tomblaine / Nancy', client: 'AS Nancy-Lorraine SASP' },
        { name: 'SLUC Nancy Basket', sport: 'Basketball', venue: 'Palais des Sports Jean Weille', capacity: 6027, avgAttendance: 5800, city: 'Nancy', client: 'SLUC Nancy Basket' }
      ],
      '57': [
        { name: 'FC Metz', sport: 'Football', venue: 'Stade Saint-Symphorien', capacity: 28786, avgAttendance: 22000, city: 'Metz', client: 'Football Club de Metz' },
        { name: 'Metz Handball', sport: 'Handball Féminin', venue: 'Les Arènes de Metz', capacity: 4500, avgAttendance: 4100, city: 'Metz', client: 'Metz Handball SASP' }
      ],
      '42': [
        { name: 'AS Saint-Étienne (ASSE)', sport: 'Football', venue: 'Stade Geoffroy-Guichard (Le Chaudron)', capacity: 41965, avgAttendance: 35000, city: 'Saint-Étienne', client: 'AS Saint-Étienne SASP' }
      ],
      '63': [
        { name: 'Clermont Foot 63', sport: 'Football', venue: 'Stade Gabriel-Montpied', capacity: 13000, avgAttendance: 9500, city: 'Clermont-Ferrand', client: 'Clermont Foot SASP' },
        { name: 'ASM Clermont Auvergne', sport: 'Rugby', venue: 'Stade Marcel-Michelin', capacity: 19022, avgAttendance: 17800, city: 'Clermont-Ferrand', client: 'ASM Clermont Auvergne SASP' }
      ],
      '29': [
        { name: 'Stade Brestois 29', sport: 'Football', venue: 'Stade Francis-Le Blé', capacity: 15220, avgAttendance: 14800, city: 'Brest', client: 'Stade Brestois 29 SASP' }
      ],
      '51': [
        { name: 'Stade de Reims', sport: 'Football', venue: 'Stade Auguste-Delaune', capacity: 21029, avgAttendance: 16500, city: 'Reims', client: 'Stade de Reims SASP' }
      ],
      '17': [
        { name: 'Stade Rochelais', sport: 'Rugby', venue: 'Stade Marcel-Deflandre', capacity: 16700, avgAttendance: 16700, city: 'La Rochelle', client: 'Stade Rochelais Rugby' }
      ],
      '64': [
        { name: 'Section Paloise', sport: 'Rugby', venue: 'Stade du Hameau', capacity: 18324, avgAttendance: 13500, city: 'Pau', client: 'Section Paloise Rugby Pro' },
        { name: 'Aviron Bayonnais', sport: 'Rugby', venue: 'Stade Jean-Dauger', capacity: 14370, avgAttendance: 13800, city: 'Bayonne', client: 'Aviron Bayonnais Rugby Pro' },
        { name: 'Élan Béarnais Pau-Lacq-Orthez', sport: 'Basketball', venue: 'Palais des Sports de Pau', capacity: 7700, avgAttendance: 4800, city: 'Pau', client: 'EBPLO Basket' }
      ],
      '30': [
        { name: 'Nîmes Olympique', sport: 'Football', venue: 'Stade des Antonins', capacity: 8000, avgAttendance: 3500, city: 'Nîmes', client: 'Nîmes Olympique' },
        { name: 'USAM Nîmes Gard', sport: 'Handball', venue: 'Le Parnasse', capacity: 3391, avgAttendance: 3100, city: 'Nîmes', client: 'USAM Nîmes Gard' }
      ],
      '83': [
        { name: 'Rugby Club Toulonnais (RCT)', sport: 'Rugby', venue: 'Stade Mayol', capacity: 17500, avgAttendance: 16000, city: 'Toulon', client: 'RC Toulonnais Rugby' },
        { name: 'Hyères Toulon Var Basket', sport: 'Basketball', venue: 'Palais des Sports de Toulon', capacity: 4200, avgAttendance: 2400, city: 'Toulon / Hyères', client: 'HTV Basket' }
      ],
      '38': [
        { name: 'Grenoble Foot 38 (GF38)', sport: 'Football', venue: 'Stade des Alpes', capacity: 20068, avgAttendance: 6500, city: 'Grenoble', client: 'Grenoble Foot 38' },
        { name: 'FC Grenoble Rugby (FCG)', sport: 'Rugby', venue: 'Stade des Alpes', capacity: 20068, avgAttendance: 11000, city: 'Grenoble', client: 'FC Grenoble Rugby' }
      ],
      '21': [
        { name: 'Dijon FCO (DFCO)', sport: 'Football', venue: 'Stade Gaston-Gérard', capacity: 15995, avgAttendance: 6000, city: 'Dijon', client: 'Dijon Football Côte-d’Or' },
        { name: 'JDA Dijon Basket', sport: 'Basketball', venue: 'Palais des Sports Jean-Michel Geoffroy', capacity: 4147, avgAttendance: 3900, city: 'Dijon', client: 'JDA Dijon SASP' }
      ],
      '49': [
        { name: 'Angers SCO', sport: 'Football', venue: 'Stade Raymond-Kopa', capacity: 19800, avgAttendance: 12500, city: 'Angers', client: 'Angers SCO SASP' },
        { name: 'Cholet Basket', sport: 'Basketball', venue: 'Salle de la Meilleraie', capacity: 5191, avgAttendance: 4900, city: 'Cholet', client: 'Cholet Basket SASP' }
      ],
      '87': [
        { name: 'Limoges CSP', sport: 'Basketball', venue: 'Palais des Sports de Beaublanc', capacity: 5516, avgAttendance: 5200, city: 'Limoges', client: 'Limoges CSP SASP' },
        { name: 'Limoges Handball 87', sport: 'Handball', venue: 'Salle Henri-Normand / Zénith', capacity: 3500, avgAttendance: 2800, city: 'Limoges', client: 'Limoges Hand SASP' }
      ],
      '80': [
        { name: 'Amiens SC', sport: 'Football', venue: 'Stade Crédit Agricole la Licorne', capacity: 12097, avgAttendance: 7800, city: 'Amiens', client: 'Amiens SC Football' }
      ],
      '76': [
        { name: 'Le Havre AC (HAC)', sport: 'Football', venue: 'Stade Océane', capacity: 25178, avgAttendance: 21500, city: 'Le Havre', client: 'Le Havre Athletic Club' },
        { name: 'FC Rouen 1899', sport: 'Football', venue: 'Stade Robert-Diochon', capacity: 12018, avgAttendance: 6200, city: 'Le Petit-Quevilly / Rouen', client: 'FC Rouen SASP' }
      ],
      '14': [
        { name: 'Stade Malherbe Caen (SMC)', sport: 'Football', venue: 'Stade Michel-d’Ornano', capacity: 20300, avgAttendance: 15500, city: 'Caen', client: 'SM Caen SASP' }
      ],
      '72': [
        { name: 'Le Mans FC', sport: 'Football', venue: 'Stade Marie-Marvingt (MMArena)', capacity: 25064, avgAttendance: 6500, city: 'Le Mans', client: 'Le Mans FC' },
        { name: 'MSB Le Mans Sarthe Basket', sport: 'Basketball', venue: 'Antarès', capacity: 6023, avgAttendance: 5300, city: 'Le Mans', client: 'MSB Sarthe' }
      ],
      '25': [
        { name: 'FC Sochaux-Montbéliard (FCSM)', sport: 'Football', venue: 'Stade Auguste-Bonal', capacity: 20005, avgAttendance: 12000, city: 'Montbéliard', client: 'FC Sochaux-Montbéliard' }
      ],
      '66': [
        { name: 'USA Perpignan (USAP)', sport: 'Rugby', venue: 'Stade Aimé-Giral', capacity: 14593, avgAttendance: 14200, city: 'Perpignan', client: 'Union Sportive Arlequins Perpignan' },
        { name: 'Dragons Catalans', sport: 'Rugby à XIII', venue: 'Stade Gilbert-Brutus', capacity: 11800, avgAttendance: 9000, city: 'Perpignan', client: 'Dragons Catalans SASP' }
      ],
      '81': [
        { name: 'Castres Olympique (CO)', sport: 'Rugby', venue: 'Stade Pierre-Fabre', capacity: 12500, avgAttendance: 11800, city: 'Castres', client: 'Castres Olympique Rugby' }
      ],
      '73': [
        { name: 'Chambéry Savoie Mont-Blanc HB', sport: 'Handball', venue: 'Le Phare - Grand Chambéry', capacity: 4400, avgAttendance: 4100, city: 'Chambéry', client: 'Chambéry SMB Handball' }
      ]
    },

    // =========================================================================
    // 2. BASE DE DONNÉES DES GRANDS ÉVÉNEMENTS RÉELS PAR RÉGION / DÉPARTEMENT
    // =========================================================================
    REAL_REGIONAL_EVENTS: {
      'Île-de-France': [
        { name: 'Schneider Electric Marathon de Paris', category: 'sport', pub: 54000, dur: 9, venue: 'Champs-Élysées & Bois de Vincennes', city: 'Paris', month: 3, env: 'dynamique_course', client: 'A.S.O. (Amaury Sport Organisation)' },
        { name: 'Harmonie Mutuelle Semi-Marathon de Paris', category: 'sport', pub: 40000, dur: 6, venue: 'Pont de Sully & Bois de Vincennes', city: 'Paris', month: 2, env: 'dynamique_course', client: 'A.S.O.' },
        { name: 'Festival Solidays', category: 'culturel', pub: 85000, dur: 10, venue: 'Hippodrome de ParisLongchamp', city: 'Paris', month: 5, env: 'ouvert_urbain', client: 'Solidarité Sida' },
        { name: 'Festival Rock en Seine', category: 'culturel', pub: 40000, dur: 8, venue: 'Domaine National de Saint-Cloud', city: 'Saint-Cloud', month: 7, env: 'ouvert_urbain', client: 'Rock en Seine SAS' },
        { name: 'Salon International de l’Agriculture (SIA)', category: 'foire', pub: 60000, dur: 9, venue: 'Paris Expo Porte de Versailles', city: 'Paris', month: 1, isMultiDays: true, durationDays: 9, weekdayDaysCount: 6, weekendDaysCount: 3, weekdayHours: 8, weekendHours: 10, env: 'ferme', client: 'Ceneca & Comexposium' },
        { name: 'Foire de Paris', category: 'foire', pub: 50000, dur: 8, venue: 'Paris Expo Porte de Versailles', city: 'Paris', month: 4, isMultiDays: true, durationDays: 12, weekdayDaysCount: 8, weekendDaysCount: 4, weekdayHours: 8, weekendHours: 10, env: 'ferme', client: 'Comexposium' },
        { name: '20 km de Paris', category: 'sport', pub: 25000, dur: 5, venue: 'Pont d’Iéna & Tour Eiffel', city: 'Paris', month: 9, env: 'dynamique_course', client: 'AS 20 km de Paris' },
        { name: 'Paris-Versailles La Grande Course', category: 'sport', pub: 25000, dur: 5, venue: 'Quai Branly vers Château de Versailles', city: 'Versailles', month: 8, env: 'dynamique_course', client: 'Paris-Versailles Association' },
        { name: 'Japan Expo Paris', category: 'culturel', pub: 65000, dur: 9, venue: 'Parc des Expositions de Paris-Nord Villepinte', city: 'Villepinte', month: 6, env: 'ferme', client: 'SEFA Event' },
        { name: 'Fête de l’Humanité', category: 'festif', pub: 110000, dur: 12, venue: 'Base 217', city: 'Le Plessis-Pâté', month: 8, env: 'ouvert_urbain', client: 'L’Humanité SA' },
        { name: 'EcoTrail Paris', category: 'sport', pub: 14000, dur: 8, venue: 'Parc de Saint-Cloud & 1er étage Tour Eiffel', city: 'Paris', month: 2, env: 'dynamique_course', client: 'EcoTrail International' }
      ],
      'Grand Est': [
        { name: 'Foire Attractive de Nancy', category: 'foire', pub: 35000, dur: 8, venue: 'Place Carnot & Cours Léopold', city: 'Nancy', month: 3, isMultiDays: true, durationDays: 28, weekdayDaysCount: 20, weekendDaysCount: 8, weekdayHours: 6, weekendHours: 10, env: 'ouvert_urbain', client: 'Comité Forain de Nancy & Mairie' },
        { name: 'Fêtes Historiques de la Saint-Nicolas', category: 'festif', pub: 100000, dur: 7, venue: 'Place Stanislas & Rues Historiques', city: 'Nancy', month: 11, env: 'ouvert_urbain', client: 'Ville de Nancy' },
        { name: 'Semi-Marathon du Grand Nancy', category: 'sport', pub: 8500, dur: 5, venue: 'Stade Marcel-Picot & Boulevards', city: 'Nancy', month: 2, env: 'dynamique_course', client: 'Nancy Athlétisme Métropole' },
        { name: 'Nancy Jazz Pulsations (NJP)', category: 'culturel', pub: 18000, dur: 7, venue: 'Parc de la Pépinière & Chapiteau', city: 'Nancy', month: 9, env: 'ouvert_urbain', client: 'Association NJP' },
        { name: 'Marché de Noël de Strasbourg (Christkindelsmärik)', category: 'festif', pub: 80000, dur: 9, venue: 'Place Kléber & Grande Île', city: 'Strasbourg', month: 11, isMultiDays: true, durationDays: 28, weekdayDaysCount: 20, weekendDaysCount: 8, weekdayHours: 6, weekendHours: 10, env: 'ouvert_urbain', client: 'Ville de Strasbourg' },
        { name: 'Foire Internationale de Metz (FIM)', category: 'foire', pub: 25000, dur: 8, venue: 'Metz Expo Événements', city: 'Metz', month: 8, isMultiDays: true, durationDays: 11, weekdayDaysCount: 7, weekendDaysCount: 4, weekdayHours: 7, weekendHours: 9, env: 'ferme', client: 'Metz Événements' },
        { name: 'Fêtes de la Mirabelle de Metz', category: 'festif', pub: 60000, dur: 7, venue: 'Plan d’Eau & Esplanade', city: 'Metz', month: 7, env: 'ouvert_urbain', client: 'Ville de Metz' },
        { name: 'Festival Le Cabaret Vert', category: 'culturel', pub: 32000, dur: 9, venue: 'Square Bayard & Berges de Meuse', city: 'Charleville-Mézières', month: 7, env: 'ouvert_urbain', client: 'FLAP Asso' },
        { name: 'Triathlon International de Gérardmer', category: 'sport', pub: 7500, dur: 8, venue: 'Lac de Gérardmer', city: 'Gérardmer', month: 8, env: 'dynamique_course', client: 'Triathlon Vallée des Lacs' },
        { name: 'Foire de Châlons-en-Champagne', category: 'foire', pub: 30000, dur: 8, venue: 'Le Capitole en Champagne', city: 'Châlons-en-Champagne', month: 8, isMultiDays: true, durationDays: 11, weekdayDaysCount: 7, weekendDaysCount: 4, weekdayHours: 7, weekendHours: 9, env: 'ouvert_urbain', client: 'Comité Foire de Châlons' },
        { name: 'Marathon du Vignoble d’Alsace', category: 'sport', pub: 6000, dur: 6, venue: 'Région de Molsheim & Vignobles', city: 'Molsheim', month: 5, env: 'dynamique_course', client: 'Marathon Vignoble Alsace' }
      ],
      'Hauts-de-France': [
        { name: 'Grande Braderie de Lille', category: 'foire', pub: 250000, dur: 12, venue: 'Rues du Centre & Esplanade', city: 'Lille', month: 8, env: 'ouvert_urbain', client: 'Ville de Lille' },
        { name: 'Carnaval de Dunkerque & Bal du Chat Noir', category: 'festif', pub: 45000, dur: 8, venue: 'Rues de Dunkerque & Kursaal', city: 'Dunkerque', month: 1, env: 'ouvert_urbain', client: 'Comité Carnavalesque Dunkerquois' },
        { name: 'Semi-Marathon & 10 km de Lille', category: 'sport', pub: 15000, dur: 5, venue: 'Boulevard de la Liberté', city: 'Lille', month: 2, env: 'dynamique_course', client: 'Lille Métropole Athlétisme' },
        { name: 'Main Square Festival d’Arras', category: 'culturel', pub: 42000, dur: 9, venue: 'Citadelle d’Arras', city: 'Arras', month: 6, env: 'ouvert_urbain', client: 'Live Nation France' },
        { name: 'Enduropale du Touquet-Pas-de-Calais', category: 'sport', pub: 150000, dur: 8, venue: 'Plage du Touquet & Digue', city: 'Le Touquet-Paris-Plage', month: 1, env: 'ouvert_urbain', client: 'Ville du Touquet & FFM' },
        { name: 'Foire aux Manèges de Lille', category: 'foire', pub: 25000, dur: 7, venue: 'Champ de Mars', city: 'Lille', month: 7, isMultiDays: true, durationDays: 28, weekdayDaysCount: 20, weekendDaysCount: 8, weekdayHours: 6, weekendHours: 10, env: 'ouvert_urbain', client: 'Comité Forain Lillois' },
        { name: 'Paris-Roubaix Challenge Cyclotourisme', category: 'sport', pub: 7000, dur: 8, venue: 'Vélodrome André-Pétrieux', city: 'Roubaix', month: 3, env: 'dynamique_course', client: 'A.S.O.' },
        { name: 'Trail de la Côte d’Opale', category: 'sport', pub: 8000, dur: 7, venue: 'Site des Deux Caps', city: 'Wissant', month: 8, env: 'dynamique_course', client: 'Trail Côte d’Opale' }
      ],
      'Auvergne-Rhône-Alpes': [
        { name: 'Fête des Lumières de Lyon', category: 'festif', pub: 450000, dur: 7, venue: 'Presqu’île, Fourvière & Berges du Rhône', city: 'Lyon', month: 11, env: 'ouvert_urbain', client: 'Ville de Lyon' },
        { name: 'Festival Nuits Sonores', category: 'culturel', pub: 25000, dur: 8, venue: 'Quartier Confluence & Grandes Usines', city: 'Lyon', month: 4, env: 'ouvert_urbain', client: 'Arty Farty' },
        { name: 'Run In Lyon (Marathon & Semi)', category: 'sport', pub: 32000, dur: 7, venue: 'Place Bellecour & Berges', city: 'Lyon', month: 9, env: 'dynamique_course', client: 'A.S.O.' },
        { name: 'La SaintéLyon (Raid Nocturne Historique)', category: 'sport', pub: 17000, dur: 12, venue: 'Parcours Saint-Étienne vers Halle Tony Garnier Lyon', city: 'Saint-Étienne / Lyon', month: 11, env: 'dynamique_course', client: 'Extra Sports' },
        { name: 'Festival Musilac', category: 'culturel', pub: 30000, dur: 8, venue: 'Esplanade du Lac du Bourget', city: 'Aix-les-Bains', month: 6, env: 'ouvert_urbain', client: 'Tremplin Production' },
        { name: 'Marathon International du Lac d’Annecy', category: 'sport', pub: 11000, dur: 6, venue: 'Paquier & Rives du Lac', city: 'Annecy', month: 3, env: 'dynamique_course', client: 'Annecy Haute-Savoie Athlétisme' },
        { name: 'Fête du Lac d’Annecy & Grand Feu Pyrotechnique', category: 'festif', pub: 100000, dur: 5, venue: 'Baie d’Annecy & Paquier', city: 'Annecy', month: 7, env: 'ouvert_urbain', client: 'Ville d’Annecy' },
        { name: 'Festival Europavox', category: 'culturel', pub: 22000, dur: 7, venue: 'Place de Jaude', city: 'Clermont-Ferrand', month: 5, env: 'ouvert_urbain', client: 'Europavox SAS' }
      ],
      'Provence-Alpes-Côte d’Azur': [
        { name: 'Marseille-Cassis (Classique Internationale 20 km)', category: 'sport', pub: 20000, dur: 6, venue: 'Stade Vélodrome vers Baie de Cassis (Col de la Gineste)', city: 'Marseille / Cassis', month: 9, env: 'dynamique_course', client: 'SCO Sainte-Marguerite Athlétisme' },
        { name: 'Carnaval de Nice & Bataille de Fleurs', category: 'festif', pub: 55000, dur: 6, venue: 'Place Masséna & Promenade des Anglais', city: 'Nice', month: 1, isMultiDays: true, durationDays: 14, weekdayDaysCount: 10, weekendDaysCount: 4, weekdayHours: 6, weekendHours: 8, env: 'ouvert_urbain', client: 'Ville de Nice' },
        { name: 'Marathon des Alpes-Maritimes Nice-Cannes', category: 'sport', pub: 14000, dur: 7, venue: 'Promenade des Anglais vers Croisette', city: 'Nice / Cannes', month: 10, env: 'dynamique_course', client: 'Azur Sport Organisation' },
        { name: 'Foire Internationale de Marseille', category: 'foire', pub: 40000, dur: 8, venue: 'Parc Chanot', city: 'Marseille', month: 8, isMultiDays: true, durationDays: 11, weekdayDaysCount: 7, weekendDaysCount: 4, weekdayHours: 7, weekendHours: 9, env: 'ouvert_urbain', client: 'SAFIM Marseille' },
        { name: 'Festival d’Avignon', category: 'culturel', pub: 25000, dur: 7, venue: 'Cour d’Honneur du Palais des Papes & Rues', city: 'Avignon', month: 6, env: 'ouvert_urbain', client: 'Association Festival d’Avignon' },
        { name: 'Féria Pascale d’Arles', category: 'festif', pub: 60000, dur: 7, venue: 'Arènes d’Arles & Boulevards', city: 'Arles', month: 3, env: 'ouvert_urbain', client: 'Comité de la Féria & Mairie' },
        { name: 'Festival Marsatac', category: 'culturel', pub: 20000, dur: 8, venue: 'Parc Borély', city: 'Marseille', month: 5, env: 'ouvert_urbain', client: 'Orane Organisation' }
      ],
      'Occitanie': [
        { name: 'Féria de Pentecôte de Nîmes', category: 'festif', pub: 200000, dur: 9, venue: 'Arènes de Nîmes & Écusson', city: 'Nîmes', month: 4, env: 'ouvert_urbain', client: 'Ville de Nîmes' },
        { name: 'Semi-Marathon & Marathon de Toulouse Métropole', category: 'sport', pub: 14000, dur: 6, venue: 'Pont Neuf & Capitole', city: 'Toulouse', month: 9, env: 'dynamique_course', client: 'Toulouse Métropole Athlétisme' },
        { name: 'Festival Rio Loco', category: 'culturel', pub: 28000, dur: 7, venue: 'Prairie des Filtres', city: 'Toulouse', month: 5, env: 'ouvert_urbain', client: 'Mairie de Toulouse' },
        { name: 'Festival de Carcassonne', category: 'culturel', pub: 15000, dur: 6, venue: 'Théâtre Jean-Deschamps & Cité Médiévale', city: 'Carcassonne', month: 6, env: 'ouvert_urbain', client: 'Ville de Carcassonne' },
        { name: 'Festival Pause Guitare d’Albi', category: 'culturel', pub: 22000, dur: 7, venue: 'Base de Loisirs de Pratgraussals', city: 'Albi', month: 6, env: 'ouvert_urbain', client: 'Arpèges & Trémolos' },
        { name: 'Grands Tournois des Fêtes de la Saint-Louis', category: 'festif', pub: 35000, dur: 7, venue: 'Cadre Royal & Canaux', city: 'Sète', month: 7, env: 'ouvert_urbain', client: 'Ville de Sète' },
        { name: 'Festival Jazz in Marciac', category: 'culturel', pub: 25000, dur: 8, venue: 'Chapiteau de Marciac & Place centrale', city: 'Marciac', month: 7, env: 'ouvert_urbain', client: 'Jazz in Marciac' },
        { name: 'Festival des Templiers (Grand Trail)', category: 'sport', pub: 12500, dur: 9, venue: 'Gorges de la Dourbie & Grands Causses', city: 'Millau', month: 9, env: 'dynamique_course', client: 'Club des Templiers' }
      ],
      'Nouvelle-Aquitaine': [
        { name: 'Fêtes Traditionnelles de Bayonne', category: 'festif', pub: 250000, dur: 10, venue: 'Rues du Grand & Petit Bayonne', city: 'Bayonne', month: 6, env: 'ouvert_urbain', client: 'Ville de Bayonne' },
        { name: 'Féria de Dax', category: 'festif', pub: 120000, dur: 9, venue: 'Arènes de Dax & Rues du Centre', city: 'Dax', month: 7, env: 'ouvert_urbain', client: 'Ville de Dax' },
        { name: 'Festival Francofolies de La Rochelle', category: 'culturel', pub: 35000, dur: 8, venue: 'Scène Jean-Louis Foulquier & Esplanade', city: 'La Rochelle', month: 6, env: 'ouvert_urbain', client: 'Francofolies SAS' },
        { name: 'Marathon de La Rochelle Serge Vigot', category: 'sport', pub: 13000, dur: 6, venue: 'Vieux Port & Tours de La Rochelle', city: 'La Rochelle', month: 10, env: 'dynamique_course', client: 'Association Marathon de La Rochelle' },
        { name: 'Marathon du Médoc', category: 'sport', pub: 9000, dur: 7, venue: 'Châteaux Viticoles & Quais', city: 'Pauillac', month: 8, env: 'dynamique_course', client: 'AMCM Pauillac' },
        { name: 'Bordeaux Fête le Vin / Fête le Fleuve', category: 'festif', pub: 80000, dur: 8, venue: 'Quais de Garonne', city: 'Bordeaux', month: 5, env: 'ouvert_urbain', client: 'Office de Tourisme de Bordeaux Métropole' },
        { name: 'Festival International de la Bande Dessinée (FIBD)', category: 'culturel', pub: 45000, dur: 8, venue: 'Espaces d’Exposition & Centre-ville', city: 'Angoulême', month: 0, env: 'ferme', client: '9e Art+ Organisation' },
        { name: 'Festival Garorock', category: 'culturel', pub: 38000, dur: 9, venue: 'Plaine de la Filhole', city: 'Marmande', month: 5, env: 'ouvert_urbain', client: 'Garorock SAS' }
      ],
      'Bretagne': [
        { name: 'Festival des Vieilles Charrues', category: 'culturel', pub: 70000, dur: 10, venue: 'Site de Kerampuilh', city: 'Carhaix-Plouguer', month: 6, env: 'ouvert_urbain', client: 'Association Les Vieilles Charrues' },
        { name: 'Festival Interceltique de Lorient (FIL)', category: 'culturel', pub: 90000, dur: 9, venue: 'Stade du Moustoir & Port de Plaisance', city: 'Lorient', month: 7, env: 'ouvert_urbain', client: 'Association FIL' },
        { name: 'Festival de Cornouaille', category: 'culturel', pub: 35000, dur: 7, venue: 'Rues Historiques & Quais de l’Odet', city: 'Quimper', month: 6, env: 'ouvert_urbain', client: 'Festival de Cornouaille' },
        { name: 'Festival Art Rock', category: 'culturel', pub: 25000, dur: 7, venue: 'Place Poulain Corbion & Centre', city: 'Saint-Brieuc', month: 4, env: 'ouvert_urbain', client: 'Wild Rose Asso' },
        { name: 'Marathon Vert de Rennes Konica Minolta', category: 'sport', pub: 11000, dur: 6, venue: 'Mail François-Mitterrand & Rues de Rennes', city: 'Rennes', month: 9, env: 'dynamique_course', client: 'Rennes Métropole Athlétisme' },
        { name: 'Festival Fête du Bruit dans Landerneau', category: 'culturel', pub: 20000, dur: 8, venue: 'Jardins de la Palud', city: 'Landerneau', month: 7, env: 'ouvert_urbain', client: 'Régie Scène' },
        { name: 'Fêtes Maritimes Internationales de Brest', category: 'festif', pub: 120000, dur: 9, venue: 'Port Militaire & Port de Commerce', city: 'Brest', month: 6, env: 'ouvert_urbain', client: 'Brest Événements Nautiques' },
        { name: 'Semi-Marathon Auray-Vannes', category: 'sport', pub: 6500, dur: 5, venue: 'Manoir de Kerbastic vers Stade de Kercado', city: 'Vannes', month: 8, env: 'dynamique_course', client: 'Courir à Vannes' }
      ],
      'Pays de la Loire': [
        { name: 'Festival Hellfest Open Air', category: 'culturel', pub: 60000, dur: 12, venue: 'Val de Moine & Complexe Clisson', city: 'Clisson', month: 5, env: 'ouvert_urbain', client: 'Hellfest Productions' },
        { name: '24 Heures du Mans Auto', category: 'sport', pub: 85000, dur: 14, venue: 'Circuit des 24 Heures', city: 'Le Mans', month: 5, env: 'ouvert_urbain', client: 'Automobile Club de l’Ouest (ACO)' },
        { name: '24 Heures Moto du Mans', category: 'sport', pub: 75000, dur: 12, venue: 'Circuit Bugatti', city: 'Le Mans', month: 3, env: 'ouvert_urbain', client: 'ACO' },
        { name: 'Marathon de Nantes', category: 'sport', pub: 13000, dur: 6, venue: 'Nefs des Machines de l’Île vers Cité des Congrès', city: 'Nantes', month: 3, env: 'dynamique_course', client: 'Courir à Nantes' },
        { name: 'Les Rendez-vous de l’Erdre', category: 'culturel', pub: 40000, dur: 7, venue: 'Bords de l’Erdre & Bassin Ceineray', city: 'Nantes', month: 7, env: 'ouvert_urbain', client: 'Association Rendez-vous de l’Erdre' },
        { name: 'Vendée Globe - Village Course', category: 'festif', pub: 110000, dur: 9, venue: 'Port Olona & Esplanade du Globe', city: 'Les Sables-d’Olonne', month: 10, env: 'ouvert_urbain', client: 'SAEM Vendée' }
      ],
      'Normandie': [
        { name: 'L’Armada de Rouen (Grands Voiliers)', category: 'festif', pub: 400000, dur: 10, venue: 'Quais de Seine Rive Droite & Rive Gauche', city: 'Rouen', month: 5, env: 'ouvert_urbain', client: 'Association Armada de Rouen' },
        { name: 'Festival Beauregard', category: 'culturel', pub: 32000, dur: 8, venue: 'Parc du Château de Beauregard', city: 'Hérouville-Saint-Clair', month: 6, env: 'ouvert_urbain', client: 'Beauregard SAS' },
        { name: 'Marathon de la Liberté (D-Day Race)', category: 'sport', pub: 22000, dur: 7, venue: 'Plages du Débarquement vers Stade Hélitas Caen', city: 'Caen', month: 5, env: 'dynamique_course', client: 'Les Courants de la Liberté' },
        { name: 'Foire Saint-Romain de Rouen', category: 'foire', pub: 45000, dur: 8, venue: 'Esplanade Saint-Gervais', city: 'Rouen', month: 9, isMultiDays: true, durationDays: 28, weekdayDaysCount: 20, weekendDaysCount: 8, weekdayHours: 6, weekendHours: 10, env: 'ouvert_urbain', client: 'Comité de la Foire Saint-Romain' },
        { name: 'Festival Papillons de Nuit', category: 'culturel', pub: 28000, dur: 8, venue: 'Site de l’Aubinière', city: 'Saint-Laurent-de-Cuves', month: 4, env: 'ouvert_urbain', client: 'R.O.C. en Baie' }
      ],
      'Centre-Val de Loire': [
        { name: 'Le Printemps de Bourges Crédit Mutuel', category: 'culturel', pub: 45000, dur: 8, venue: 'Le W, Place Séraucourt & Rues', city: 'Bourges', month: 3, env: 'ouvert_urbain', client: 'Printemps de Bourges SAS' },
        { name: 'Fêtes Johanniques d’Orléans', category: 'festif', pub: 60000, dur: 6, venue: 'Place du Martroi & Cathédrale Sainte-Croix', city: 'Orléans', month: 4, env: 'ouvert_urbain', client: 'Mairie d’Orléans' },
        { name: 'Running Loire Valley - Marathon & 10-20 km de Tours', category: 'sport', pub: 16000, dur: 6, venue: 'Place Anatole France & Bords de Loire', city: 'Tours', month: 8, env: 'dynamique_course', client: 'Ligue d’Athlétisme du Centre' },
        { name: 'Festival Terres du Son', category: 'culturel', pub: 20000, dur: 7, venue: 'Domaine de Candé', city: 'Monts', month: 6, env: 'ouvert_urbain', client: 'ASSO Terres du Son' }
      ],
      'Bourgogne-Franche-Comté': [
        { name: 'Festival des Eurockéennes de Belfort', category: 'culturel', pub: 34000, dur: 9, venue: 'Presqu’île du Malsaucy', city: 'Belfort / Sermamagny', month: 6, env: 'ouvert_urbain', client: 'Territoire de Musiques' },
        { name: 'Foire Internationale et Gastronomique de Dijon', category: 'foire', pub: 30000, dur: 8, venue: 'Dijon Congrexpo', city: 'Dijon', month: 10, isMultiDays: true, durationDays: 11, weekdayDaysCount: 7, weekendDaysCount: 4, weekdayHours: 7, weekendHours: 9, env: 'ferme', client: 'Dijon Congrexpo' },
        { name: 'Trail des Forts de Besançon', category: 'sport', pub: 6500, dur: 7, venue: 'Citadelle de Vauban & Forêts', city: 'Besançon', month: 4, env: 'dynamique_course', client: 'Besançon Triathlon & Trail' },
        { name: 'Vente des Vins des Hospices de Beaune', category: 'festif', pub: 35000, dur: 7, venue: 'Hôtel-Dieu & Place Carnot', city: 'Beaune', month: 10, env: 'ouvert_urbain', client: 'Hospices Civils de Beaune' }
      ],
      'Corse': [
        { name: 'Festival Calvi on the Rocks', category: 'culturel', pub: 8000, dur: 7, venue: 'Plage de Calvi & Théâtre de Verdure', city: 'Calvi', month: 6, env: 'ouvert_urbain', client: 'Calvi On The Rocks' },
        { name: 'Restonica Trail', category: 'sport', pub: 3500, dur: 8, venue: 'Vallée de la Restonica & Citadelle', city: 'Corte', month: 6, env: 'dynamique_course', client: 'Restonica Trail Asso' },
        { name: 'Trail Napoléon d’Ajaccio', category: 'sport', pub: 2500, dur: 5, venue: 'Sentier des Crêtes & Place d’Austerlitz', city: 'Ajaccio', month: 4, env: 'dynamique_course', client: 'Corsica Run' }
      ]
    },

    // =========================================================================
    // 3. CATALOGUE DES FORMATS D'ÉVÉNEMENTS CONTEXTUELS PAR VILLE (COMPLÉMENT)
    // =========================================================================
    CONTEXTUAL_EVENT_TEMPLATES: [
      {
        nameTpl: 'Urban Trail Historique de {commune}',
        category: 'sport',
        clientTpl: 'Athlétic Club & Ville de {commune}',
        cType: 'club_sportif',
        venueTpl: 'Hôtel de Ville & Rues du Centre Ancien',
        minPub: 1200, maxPub: 3800, dur: 5, env: 'dynamique_course', risk: 'moyen', delayMin: 12,
        ranks: ['CE', 'PSE2', 'PSE1'], vehicles: ['VPSP']
      },
      {
        nameTpl: 'Foulées Nocturnes & 10 km de {commune}',
        category: 'sport',
        clientTpl: 'Fédération Française d’Athlétisme - Section {commune}',
        cType: 'club_sportif',
        venueTpl: 'Parc des Sports & Boulevards Éclairés',
        minPub: 1000, maxPub: 2800, dur: 4, env: 'dynamique_course', risk: 'moyen', delayMin: 10,
        ranks: ['CE', 'PSE2', 'PSE1'], vehicles: ['VPSP']
      },
      {
        nameTpl: 'Tournoi National des Jeunes U15 & U17 de {commune}',
        category: 'sport',
        clientTpl: 'Club Omnisports de {commune}',
        cType: 'club_sportif',
        venueTpl: 'Complexe Sportif Municipal & Terrains Synthétiques',
        minPub: 800, maxPub: 2200, dur: 6, env: 'ouvert_urbain', risk: 'faible', delayMin: 10,
        ranks: ['PSE2', 'PSE1'], vehicles: []
      },
      {
        nameTpl: 'Triathlon & Aquathlon du Bassin de {commune}',
        category: 'sport',
        clientTpl: 'Comité Départemental de Triathlon',
        cType: 'club_sportif',
        venueTpl: 'Base de Plein Air & Berges du Plan d’Eau',
        minPub: 1100, maxPub: 2600, dur: 6, env: 'dynamique_course', risk: 'moyen', delayMin: 15,
        ranks: ['CE', 'PSE2', 'PSE1'], vehicles: ['VPSP', 'VTU']
      },
      {
        nameTpl: 'Grand Prix Cycliste & Critérium de {commune}',
        category: 'sport',
        clientTpl: 'Vélo Club de {commune}',
        cType: 'club_sportif',
        venueTpl: 'Circuit Sécurisé du Centre-Ville',
        minPub: 1500, maxPub: 4200, dur: 5, env: 'dynamique_course', risk: 'élevé', delayMin: 10,
        ranks: ['CE', 'PSE2', 'PSE1'], vehicles: ['VPSP']
      },
      {
        nameTpl: 'Fête Patronale, Bal Populaire & Feu d’Artifice de {commune}',
        category: 'festif',
        clientTpl: 'Direction de la Culture - Mairie de {commune}',
        cType: 'collectivite',
        venueTpl: 'Place Centrale & Bords de Rivière',
        minPub: 2500, maxPub: 7500, dur: 6, env: 'ouvert_urbain', risk: 'moyen', delayMin: 12,
        ranks: ['CE', 'PSE2', 'PSE1'], vehicles: ['VPSP']
      },
      {
        nameTpl: 'Grande Braderie & Foire aux Puces de {commune}',
        category: 'foire',
        clientTpl: 'Association des Commerçants et Artisans de {commune}',
        cType: 'association',
        venueTpl: 'Grande Rue Piétonne & Place du Marché',
        minPub: 3000, maxPub: 8500, dur: 8, env: 'ouvert_urbain', risk: 'faible', delayMin: 12,
        ranks: ['CE', 'PSE2', 'PSE1'], vehicles: ['VPSP']
      },
      {
        nameTpl: 'Festival Musiques & Guinguette d’Été de {commune}',
        category: 'culturel',
        clientTpl: 'Comité des Fêtes de {commune}',
        cType: 'association',
        venueTpl: 'Parc Municipal & Esplanade Verdoyante',
        minPub: 2000, maxPub: 6000, dur: 7, env: 'ouvert_urbain', risk: 'moyen', delayMin: 14,
        ranks: ['CE', 'PSE2', 'PSE1'], vehicles: ['VPSP']
      },
      {
        nameTpl: 'Salon des Vins, du Terroir & de la Gastronomie de {commune}',
        category: 'foire',
        clientTpl: 'Confrérie Gastronomique Régionale',
        cType: 'association',
        venueTpl: 'Salle Polyvalente & Halle Couverte',
        minPub: 1500, maxPub: 4500, dur: 7, env: 'ferme', risk: 'faible', delayMin: 10,
        ranks: ['PSE2', 'PSE1'], vehicles: []
      },
      {
        nameTpl: 'Meeting Régional d’Athlétisme & Perche de {commune}',
        category: 'sport',
        clientTpl: 'Ligue Régionale d’Athlétisme',
        cType: 'club_sportif',
        venueTpl: 'Stade d’Athlétisme Jean-Bouin',
        minPub: 800, maxPub: 2400, dur: 5, env: 'ouvert_urbain', risk: 'faible', delayMin: 10,
        ranks: ['PSE2', 'PSE1'], vehicles: []
      },
      {
        nameTpl: 'Carnaval Municipal & Corso Fleuri de {commune}',
        category: 'festif',
        clientTpl: 'Service Jeunesse & Festivités de {commune}',
        cType: 'collectivite',
        venueTpl: 'Départ Gare vers Parvis de l’Hôtel de Ville',
        minPub: 3500, maxPub: 9000, dur: 5, env: 'ouvert_urbain', risk: 'moyen', delayMin: 12,
        ranks: ['CE', 'PSE2', 'PSE1'], vehicles: ['VPSP']
      },
      {
        nameTpl: 'Gala Régional des Arts Martiaux & Boxe à {commune}',
        category: 'sport',
        clientTpl: 'Comité Régional de Judo & Karaté',
        cType: 'club_sportif',
        venueTpl: 'Dojo Municipal & Salle Omnisports',
        minPub: 600, maxPub: 1800, dur: 5, env: 'ferme', risk: 'moyen', delayMin: 10,
        ranks: ['PSE2', 'PSE1'], vehicles: []
      },
      {
        nameTpl: 'Fête de la Musique - Scène Principale de {commune}',
        category: 'culturel',
        clientTpl: 'Mairie de {commune}',
        cType: 'collectivite',
        venueTpl: 'Kiosque à Musique & Place Stanislas/République',
        minPub: 4000, maxPub: 11000, dur: 7, env: 'ouvert_urbain', risk: 'élevé', delayMin: 10,
        ranks: ['CD', 'CE', 'PSE2', 'PSE1'], vehicles: ['VPSP', 'VTU']
      },
      {
        nameTpl: 'Course de Baignoires & Randonnée Nautique de {commune}',
        category: 'festif',
        clientTpl: 'Club Nautique & Canoë-Kayak',
        cType: 'association',
        venueTpl: 'Berges Fluviales & Quai des Pêcheurs',
        minPub: 1200, maxPub: 3400, dur: 5, env: 'ouvert_urbain', risk: 'moyen', delayMin: 15,
        ranks: ['CE', 'PSE2', 'PSE1'], vehicles: ['VPSP']
      }
    ],

    // Arrondi réglementaire et réaliste du public attendu
    roundExpectedPublic(n) {
      const val = Math.max(50, Math.round(Number(n) || 100));
      if (val < 200) return Math.round(val / 10) * 10;
      if (val < 1000) return Math.round(val / 50) * 50;
      if (val < 5000) return Math.round(val / 100) * 100;
      if (val < 20000) return Math.round(val / 500) * 500;
      return Math.round(val / 1000) * 1000;
    },

    // =========================================================================
    // 4. MOTEUR DU RIS & DÉDUCTION DES INFORMATIONS MANQUANTES (RNMSC OFFICIEL)
    // =========================================================================
    /**
     * Calcule le Ratio d'Intervenants Secouristes (RIS) selon la doctrine RNMSC :
     * RIS = (P * (E1 + E2)) / 1000
     * @param {number} publicCount - Nombre instantané de spectateurs/participants
     * @param {string} env - 'ferme', 'ouvert_urbain', 'dynamique_course'
     * @param {string} risk - 'faible', 'moyen', 'élevé'
     * @param {number} accessMinutes - Délai d'accès secours extérieurs
     */
    calculateRis(publicCount, env, risk, accessMinutes = 12) {
      const P = Math.max(100, publicCount || 1000);

      // Facteur d'environnement E1
      let E1 = 0.30;
      if (env === 'ferme') E1 = 0.25;
      else if (env === 'ouvert_urbain') E1 = 0.32;
      else if (env === 'dynamique_course') E1 = 0.40;

      // Modulation par le niveau de risque de l'activité
      if (risk === 'faible') E1 -= 0.05;
      else if (risk === 'élevé') E1 += 0.08;

      // Facteur d'accès aux secours publics E2
      let E2 = 0.25;
      if (accessMinutes <= 10) E2 = 0.25;
      else if (accessMinutes <= 20) E2 = 0.30;
      else if (accessMinutes <= 30) E2 = 0.35;
      else E2 = 0.42;

      const risScore = parseFloat(((P * (E1 + E2)) / 1000).toFixed(3));

      // Catégorie réglementaire du dispositif
      let scale = 'PAPS (Point d’Alerte - 2 à 3 secouristes)';
      let scaleKey = 'PAPS';
      let minVolunteers = 2;
      let requiredVehicles = [];
      let requiredRanks = ['PSE1', 'PSE2'];
      let requiredLots = ['Lot A'];

      if (risScore <= 0.25 && P <= 1500) {
        scale = 'PAPS (Point d’Alerte - 2 à 3 secouristes)';
        scaleKey = 'PAPS';
        minVolunteers = P > 800 ? 3 : 2;
        requiredVehicles = [];
        requiredRanks = ['PSE1', 'PSE2'];
        requiredLots = ['Lot A'];
      } else if (risScore <= 1.125) {
        scale = 'DPS-PE (Petite Envergure : 4 à 10 secouristes + VPSP)';
        scaleKey = 'DPS-PE';
        minVolunteers = Math.max(4, Math.min(10, Math.round(risScore * 6) + 3));
        requiredVehicles = ['VPSP'];
        requiredRanks = ['CE', 'PSE2', 'PSE1'];
        requiredLots = ['Lot A', 'Lot B'];
      } else if (risScore <= 12) {
        scale = 'DPS-ME (Moyenne Envergure : 11 à 36 secouristes + 2 VPSP)';
        scaleKey = 'DPS-ME';
        minVolunteers = Math.max(11, Math.min(36, Math.round(risScore * 2.5) + 8));
        requiredVehicles = ['VPSP', 'VTU'];
        requiredRanks = ['CD', 'CE', 'PSE2', 'PSE1'];
        requiredLots = ['Lot A', 'Lot B', 'Tente PMA'];
      } else {
        scale = 'DPS-GE (Grande Envergure : Poste Majeur Inter-Secteurs)';
        scaleKey = 'DPS-GE';
        minVolunteers = Math.max(16, Math.min(48, Math.round(risScore * 1.5) + 12));
        requiredVehicles = ['VPSP', 'VTU', 'VL'];
        requiredRanks = ['CD', 'CE', 'PSE2', 'PSE1'];
        requiredLots = ['Lot A', 'Lot B', 'Tente PMA', 'Poste Médical'];
      }

      return {
        risScore,
        scale,
        scaleKey,
        minVolunteers,
        requiredVehicles,
        requiredRanks,
        requiredLots,
        E1,
        E2
      };
    },

    /**
     * Calcule le barème financier conforme et le budget organisateur
     */
    /**
     * Calcule le barème financier conforme et le budget organisateur
     */
    calculateFinancials(minVolunteers, durationHours, requiredVehicles, scaleKey, multiDaysMeta = null) {
      const ratePerHour = 18;
      let personnelCost = 0;
      let vehicleCost = 0;
      let matCost = 35;
      let adminCost = 40;

      // Facturation par vacation journalière (8h à 10h) même pour les événements multi-jours
      const vacHours = (multiDaysMeta && multiDaysMeta.isMultiDays)
        ? (multiDaysMeta.weekendHours || Math.max(8, durationHours || 8))
        : durationHours;

      personnelCost = minVolunteers * vacHours * ratePerHour;
      (requiredVehicles || []).forEach(v => {
        if (v === 'VPSP') vehicleCost += 110;
        else if (v === 'VTU') vehicleCost += 55;
        else if (v === 'VL') vehicleCost += 35;
      });

      if (scaleKey === 'PAPS') matCost = 25;
      else if (scaleKey === 'DPS-PE') matCost = 65;
      else if (scaleKey === 'DPS-ME' || scaleKey === 'DPS-GE') matCost = 130;

      const totalBareme = personnelCost + vehicleCost + matCost + adminCost;
      const budgetMax = Math.round(totalBareme * (1.10 + Math.random() * 0.15));

      return {
        bareme: {
          ratePerHour,
          personnelCost,
          vehicleCost,
          matCost,
          adminCost,
          totalBareme
        },
        budgetMax
      };
    },

    // Helper pour générer une date pour un événement calé sur son mois réel de calendrier
    createEventDateForSpecificMonth(targetMonth, currentYear, currentMonth, currentDay, startHour, dur, daysNames, monthsNames, preferWeekend = true) {
      let year = currentYear;
      // Si le mois cible est déjà passé dans l'année en cours, ou si on est dans le mois cible mais qu'il reste moins de 3 jours dans le mois
      if (targetMonth < currentMonth || (targetMonth === currentMonth && currentDay >= 28)) {
        year = currentYear + 1;
      }

      let day = 10 + Math.floor(Math.random() * 12);
      if (targetMonth === currentMonth) {
        if (year === currentYear) {
          // Événement d'ici la fin du mois en cours (garanti dans 2 à 5 jours)
          day = Math.min(28, currentDay + 2 + Math.floor(Math.random() * 4));
        } else {
          // Si le mois courant est dépassé et reporté à l'an prochain, caler sur une date normale du mois
          day = 10 + Math.floor(Math.random() * 12);
        }
      }

      let dObj = new Date(year, targetMonth, day);
      if (preferWeekend) {
        const dow = dObj.getDay();
        if (dow !== 6 && dow !== 0) {
          const shift = (6 - dow + 7) % 7;
          dObj = new Date(year, targetMonth, day + shift);
        }
      }

      const finalYear = dObj.getFullYear();
      const finalMonth = dObj.getMonth();
      const finalDay = dObj.getDate();
      const dayName = (Array.isArray(daysNames) && daysNames[dObj.getDay()]) || 'Samedi';
      const monthName = (Array.isArray(monthsNames) && monthsNames[finalMonth]) || 'Mois';

      const nowMs = new Date(currentYear, currentMonth, currentDay).getTime();
      const eventMs = new Date(finalYear, finalMonth, finalDay).getTime();
      const daysAhead = Math.max(1, Math.round((eventMs - nowMs) / (1000 * 3600 * 24)));

      return {
        eventDate: {
          year: finalYear,
          month: finalMonth,
          day: finalDay,
          hour: startHour,
          minute: 0,
          startHour,
          endHour: (startHour + dur) % 24,
          dayName,
          monthName
        },
        daysAhead
      };
    },

    // Helper pour générer une date d'événement garantie dans le futur
    createFutureEventDate(currentYear, currentMonth, currentDay, daysAhead, startHour, dur, daysNames, monthsNames) {
      const targetDate = new Date(currentYear, currentMonth, currentDay + daysAhead);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const day = targetDate.getDate();
      const dayName = (Array.isArray(daysNames) && daysNames[targetDate.getDay()]) || 'Samedi';
      const monthName = (Array.isArray(monthsNames) && monthsNames[month]) || 'Mois';

      return {
        year,
        month,
        day,
        hour: startHour,
        minute: 0,
        startHour,
        endHour: (startHour + dur) % 24,
        dayName,
        monthName
      };
    },

    // Garantit qu'un événement prévisionnel ou devis a une date strictement située dans le futur
    ensureFutureEventDate(evt, game) {
      if (!evt || !game || !game.clock) return;
      const curYear = game.clock.year || new Date().getFullYear();
      const curMonth = (game.clock.month !== undefined) ? game.clock.month : new Date().getMonth();
      const curDay = game.clock.day || new Date().getDate();

      const evtDate = evt.eventDate;
      let isPast = false;
      if (!evtDate || evtDate.year == null || evtDate.month == null || evtDate.day == null) {
        isPast = true;
      } else {
        if (evtDate.year < curYear) isPast = true;
        else if (evtDate.year === curYear && evtDate.month < curMonth) isPast = true;
        else if (evtDate.year === curYear && evtDate.month === curMonth && evtDate.day <= curDay) isPast = true;
      }

      if (isPast) {
        const daysNames = game.clock.daysNames || ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const monthsNames = game.clock.monthsNames || ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        const daysAhead = evt.isLastMinute ? (2 + Math.floor(Math.random() * 3)) : (4 + Math.floor(Math.random() * 14));
        const startHour = (evtDate && evtDate.startHour) || 14;
        const dur = evt.durationHours || 5;

        evt.eventDate = this.createFutureEventDate(curYear, curMonth, curDay, daysAhead, startHour, dur, daysNames, monthsNames);
        evt.daysAhead = daysAhead;
      }
    },

    // Recale ou nettoie tous les devis actifs dont la date serait passée ou incohérente
    cleanPastDevis(game) {
      if (!game || !Array.isArray(game.devis)) return;
      const curYear = game.clock?.year || new Date().getFullYear();
      const curMonth = (game.clock?.month !== undefined) ? game.clock.month : new Date().getMonth();
      const curDay = game.clock?.day || new Date().getDate();
      const daysNames = game.clock?.daysNames || ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const monthsNames = game.clock?.monthsNames || ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

      const isPast = (evtDate) => {
        if (!evtDate || evtDate.year == null || evtDate.month == null || evtDate.day == null) return true;
        if (evtDate.year < curYear) return true;
        else if (evtDate.year === curYear && evtDate.month < curMonth) return true;
        else if (evtDate.year === curYear && evtDate.month === curMonth && evtDate.day < curDay) return true;
        return false;
      };

      let modified = false;

      const sanitizeDevisOrEvt = (d) => {
        if (!d) return;

        // 1. Correction du saut d'année erroné (ex: événement repoussé à l'année suivante alors qu'il a lieu cette année)
        if (d.eventDate && d.eventDate.year > curYear) {
          // Si le mois de l'événement est le mois courant ou si c'est une urgence de reprise de dernière minute
          if (d.eventDate.month === curMonth || d.isLastMinute) {
            d.eventDate.year = curYear;
            // Si le jour dans le mois est dépassé, on recale à J+2 à J+4 dans le futur
            if (d.eventDate.day < curDay) {
              const newOffset = d.isLastMinute ? (2 + Math.floor(Math.random() * 3)) : (4 + Math.floor(Math.random() * 7));
              const targetD = new Date(curYear, curMonth, curDay + newOffset);
              d.eventDate.year = targetD.getFullYear();
              d.eventDate.month = targetD.getMonth();
              d.eventDate.day = targetD.getDate();
              d.eventDate.dayName = daysNames[targetD.getDay()];
              d.eventDate.monthName = monthsNames[targetD.getMonth()];
            }
            modified = true;
          }
        }

        // 2. Calcul dynamique et fiable du délai réel restant
        const daysUntil = (typeof game.getDaysUntilEvent === 'function')
          ? game.getDaysUntilEvent(d)
          : (d.eventDate && d.eventDate.year != null
              ? Math.max(0, Math.round((new Date(d.eventDate.year, d.eventDate.month, d.eventDate.day) - new Date(curYear, curMonth, curDay)) / (1000 * 3600 * 24)))
              : (d.daysAhead || 3));

        d.daysAhead = daysUntil;

        // 3. Règle opérationnelle d'urgence : Une annulation de dernière minute (autre AASC) ne peut exister que sous 7 jours
        if (d.daysAhead > 7 && d.isLastMinute) {
          d.isLastMinute = false;
          d.urgencyReason = "Planification anticipée d'événement";
          modified = true;
        }

        // 4. Si la date est passée, recaler proprement dans le futur
        if (isPast(d.eventDate)) {
          this.ensureFutureEventDate(d, game);
          modified = true;
        }
      };

      game.devis.forEach(d => {
        if (['pending', 'previsionnel', 'sent'].includes(d.status)) {
          sanitizeDevisOrEvt(d);
        }
      });

      if (Array.isArray(game.territoryEventsPool)) {
        game.territoryEventsPool.forEach(evt => {
          sanitizeDevisOrEvt(evt);
        });
      }

      if (modified && typeof game.updateStatsUI === 'function') {
        game.updateStatsUI();
      }
    },

    // =========================================================================
    // 5. GÉNÉRATION DU VIVIER DE ~20 ÉVÉNEMENTS DU TERRITOIRE
    // =========================================================================
    /**
     * Génère une sélection complète de 20 événements réels ou contextuels
     * pour le secteur territorial d'une antenne donnée.
     * @param {Object} game - Instance de jeu
     * @param {Object} station - Antenne cible (city, lat, lng, departmentCode)
     * @param {number} count - Nombre cible d'événements (défaut: 20)
     */
    generateTerritoryEventsPool(game, station, count = 20) {
      if (!station) return [];

      const deptCode = String(station.departmentCode || game.currentDepartmentCode || game.player?.departmentCode || '75').trim().toUpperCase();
      const deptInfo = (window.ProtecDepartements && typeof window.ProtecDepartements.getByCode === 'function')
        ? (window.ProtecDepartements.getByCode(deptCode) || { code: deptCode, name: 'France', chefLieu: station.city || 'Chef-Lieu', region: 'France' })
        : { code: deptCode, name: 'France', chefLieu: station.city || 'Chef-Lieu', region: 'France' };

      const communes = (window.ProtecDepartements && typeof window.ProtecDepartements.getCommunesForDepartment === 'function')
        ? window.ProtecDepartements.getCommunesForDepartment(deptCode)
        : [{ nom: station.city || deptInfo.chefLieu, cp: `${deptCode}000`, lat: station.lat, lng: station.lng }];

      const currentYear = game.clock?.year || new Date().getFullYear();
      const currentMonth = (game.clock?.month !== undefined) ? game.clock.month : new Date().getMonth();
      const currentDay = game.clock?.day || new Date().getDate();
      const daysNames = game.clock?.daysNames || ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const monthsNames = game.clock?.monthsNames || ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

      const generatedEvents = [];
      const usedEventTitles = new Set();

      // --- SOUS-VIVIER A : ÉQUIPES DE SPORT RÉELLES DU DÉPARTEMENT / VILLES PROCHES ---
      const realClubs = this.REAL_SPORTS_CLUBS[deptCode] || [];
      realClubs.forEach((club, cIdx) => {
        const title = `Rencontre Officielle : ${club.name}`;
        if (!usedEventTitles.has(title)) {
          usedEventTitles.add(title);

          const dur = 5;
          const pub = this.roundExpectedPublic(club.avgAttendance * (0.85 + Math.random() * 0.30));
          const env = (club.sport === 'Basketball' || club.sport === 'Handball') ? 'ferme' : 'ouvert_urbain';
          const ris = this.calculateRis(pub, env, 'moyen', 10);
          const fin = this.calculateFinancials(ris.minVolunteers, dur, ris.requiredVehicles, ris.scaleKey);

          // Géolocalisation : coordonnées réelles de l'antenne ou de la ville du club
          const clubCommuneObj = communes.find(c => c.nom.toLowerCase().includes((club.city || '').toLowerCase())) || communes[0];
          const lat = parseFloat(((clubCommuneObj?.lat || station.lat) + (Math.random() - 0.5) * 0.015).toFixed(4));
          const lng = parseFloat(((clubCommuneObj?.lng || station.lng) + (Math.random() - 0.5) * 0.015).toFixed(4));

          // Date garantie dans le futur : échelonnée de J+4 à J+24
          const daysAhead = 4 + (cIdx * 4) + Math.floor(Math.random() * 3);
          const startHour = (club.sport === 'Football' || club.sport === 'Rugby') ? 19 : 20;
          const eventDateObj = this.createFutureEventDate(currentYear, currentMonth, currentDay, daysAhead, startHour, dur, daysNames, monthsNames);

          generatedEvents.push({
            id: `real-sport-${deptCode}-${cIdx}-${Date.now()}`,
            eventName: title,
            rawEventName: club.name,
            clientName: club.client,
            clientType: 'club_sportif',
            commune: club.city || station.city,
            venue: club.venue,
            address: `${club.venue}, ${club.city || station.city}`,
            lat,
            lng,
            eventDate: eventDateObj,
            durationHours: dur,
            publicCount: `${pub.toLocaleString('fr-FR')} supporters & spectateurs`,
            rawPublicCount: pub,
            environment: env,
            emergencyAccess: '< 10 min (Centre-ville)',
            riskLevel: 'moyen',
            risScore: ris.risScore,
            scale: ris.scale,
            scaleKey: ris.scaleKey,
            requiredVolunteers: ris.minVolunteers,
            requiredRanks: ris.requiredRanks,
            requiredVehicles: ris.requiredVehicles,
            requiredLots: ris.requiredLots,
            hiddenMinVolunteers: ris.minVolunteers,
            hiddenRequiredSkills: ris.requiredRanks,
            consumableCost: ris.scaleKey === 'PAPS' ? 20 : 45,
            status: 'pending',
            isLastMinute: (daysAhead <= 5) ? (Math.random() < 0.25) : false,
            daysAhead: daysAhead,
            secondsLeft: 3600 * 24 * 7,
            budgetMax: fin.budgetMax,
            bareme: fin.bareme,
            proposedPrice: fin.bareme.totalBareme,
            isRealTerritoryEvent: true,
            realEventCategory: 'club_sportif',
            sportsClubMeta: { club: club.name, sport: club.sport, venue: club.venue, capacity: club.capacity }
          });
        }
      });

      // --- SOUS-VIVIER B : GRANDS ÉVÉNEMENTS RÉELS DE LA RÉGION (CALÉS SUR LEUR BON MOIS) ---
      const regionalPool = this.REAL_REGIONAL_EVENTS[deptInfo.region] || [];
      // Normalisation des noms de communes (casse, accents, tirets) pour vérifier le département
      const normCity = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      regionalPool.forEach((regEvt, rIdx) => {
        if (generatedEvents.length >= 12) return;
        // Réalisme : seuls les grands événements situés DANS le département du joueur
        // (la Foire de Metz relève de la Moselle, pas d'une antenne de Meurthe-et-Moselle)
        const cityInDept = communes.find(c => normCity(c.nom) === normCity(regEvt.city));
        if (!cityInDept) return;
        // Réalisme : un organisateur sollicite un DPS au plus ~4 mois avant l'événement
        if (regEvt.month !== undefined && regEvt.month !== null) {
          const probe = this.createEventDateForSpecificMonth(regEvt.month, currentYear, currentMonth, currentDay, 14, regEvt.dur || 7, daysNames, monthsNames, true);
          if (!probe || probe.daysAhead > 120) return;
        }
        if (!usedEventTitles.has(regEvt.name)) {
          usedEventTitles.add(regEvt.name);

          const dur = regEvt.dur || 7;
          const pub = this.roundExpectedPublic(regEvt.pub * (0.90 + Math.random() * 0.20));
          const ris = this.calculateRis(pub, regEvt.env, 'élevé', 12);
          const fin = this.calculateFinancials(ris.minVolunteers, dur, ris.requiredVehicles, ris.scaleKey, regEvt);
          const pubWeekday = regEvt.isMultiDays ? this.roundExpectedPublic(pub * (0.40 + Math.random() * 0.20)) : pub;
          const risWeekday = regEvt.isMultiDays ? this.calculateRis(pubWeekday, regEvt.env, 'élevé', 12) : ris;

          const regCommuneObj = cityInDept;
          const lat = parseFloat(((regCommuneObj?.lat || station.lat) + (Math.random() - 0.5) * 0.02).toFixed(4));
          const lng = parseFloat(((regCommuneObj?.lng || station.lng) + (Math.random() - 0.5) * 0.02).toFixed(4));

          // Date calée sur la BONNE PÉRIODE DE L'ANNÉE selon regEvt.month
          const startHour = regEvt.category === 'culturel' ? 18 : 14;
          let eventDateObj;
          let daysAhead;

          if (regEvt.month !== undefined && regEvt.month !== null) {
            const dateRes = this.createEventDateForSpecificMonth(regEvt.month, currentYear, currentMonth, currentDay, startHour, dur, daysNames, monthsNames, true);
            eventDateObj = dateRes.eventDate;
            daysAhead = dateRes.daysAhead;
          } else {
            daysAhead = 6 + (rIdx * 5) + Math.floor(Math.random() * 3);
            eventDateObj = this.createFutureEventDate(currentYear, currentMonth, currentDay, daysAhead, startHour, dur, daysNames, monthsNames);
          }

          generatedEvents.push({
            id: `real-reg-${deptCode}-${rIdx}-${Date.now()}`,
            eventName: regEvt.name,
            rawEventName: regEvt.name,
            clientName: regEvt.client,
            clientType: regEvt.category === 'sport' ? 'club_sportif' : (regEvt.category === 'foire' ? 'professionnel' : 'association'),
            commune: regEvt.city,
            venue: regEvt.venue,
            address: `${regEvt.venue}, ${regEvt.city}`,
            lat,
            lng,
            month: regEvt.month,
            isMultiDays: !!regEvt.isMultiDays,
            durationDays: regEvt.durationDays || (regEvt.isMultiDays ? 28 : 1),
            weekdayDaysCount: regEvt.weekdayDaysCount || (regEvt.isMultiDays ? 20 : 0),
            weekendDaysCount: regEvt.weekendDaysCount || (regEvt.isMultiDays ? 8 : 0),
            weekdayHours: regEvt.weekdayHours || (regEvt.isMultiDays ? 6 : dur),
            weekendHours: regEvt.weekendHours || (regEvt.isMultiDays ? 10 : dur),
            // Poste étalé : affluence différente en semaine et le week-end (effectifs calculés sur chaque public)
            publicWeekend: regEvt.isMultiDays ? pub : undefined,
            publicWeekday: regEvt.isMultiDays ? pubWeekday : undefined,
            configuredVolunteersWeekday: regEvt.isMultiDays ? Math.max(2, risWeekday.minVolunteers) : null,
            configuredVolunteersWeekend: regEvt.isMultiDays ? ris.minVolunteers : null,
            eventDate: eventDateObj,
            durationHours: dur,
            publicCount: `${pub.toLocaleString('fr-FR')} participants & public`,
            rawPublicCount: pub,
            environment: regEvt.env,
            emergencyAccess: '10 à 15 min',
            riskLevel: 'moyen',
            risScore: ris.risScore,
            scale: ris.scale,
            scaleKey: ris.scaleKey,
            requiredVolunteers: ris.minVolunteers,
            requiredRanks: ris.requiredRanks,
            requiredVehicles: ris.requiredVehicles,
            requiredLots: ris.requiredLots,
            hiddenMinVolunteers: ris.minVolunteers,
            hiddenRequiredSkills: ris.requiredRanks,
            consumableCost: 50,
            status: 'pending',
            isLastMinute: (daysAhead <= 5) ? (Math.random() < 0.20) : false,
            daysAhead: daysAhead,
            secondsLeft: 3600 * 24 * 7,
            budgetMax: fin.budgetMax,
            bareme: fin.bareme,
            proposedPrice: fin.bareme.totalBareme,
            isRealTerritoryEvent: true,
            realEventCategory: 'grand_evenement_regional',
            regionalMeta: { originalCity: regEvt.city, venue: regEvt.venue, originalPub: regEvt.pub }
          });
        }
      });

      // --- SOUS-VIVIER C : ÉVÉNEMENTS CONTEXTUELS PAR COMMUNE DU TERRITOIRE ---
      // Complète pour atteindre exactement `count` événements (20 par défaut)
      let templateIdx = 0;
      let communeIdx = 0;

      while (generatedEvents.length < count) {
        const tpl = this.CONTEXTUAL_EVENT_TEMPLATES[templateIdx % this.CONTEXTUAL_EVENT_TEMPLATES.length];
        const comObj = communes[communeIdx % communes.length] || { nom: station.city, lat: station.lat, lng: station.lng };

        const title = tpl.nameTpl.replace(/{commune}/g, comObj.nom);
        if (!usedEventTitles.has(title)) {
          usedEventTitles.add(title);

          const dur = tpl.dur;
          const pub = this.roundExpectedPublic(tpl.minPub + Math.random() * (tpl.maxPub - tpl.minPub));
          const ris = this.calculateRis(pub, tpl.env, tpl.risk, tpl.delayMin);
          const fin = this.calculateFinancials(ris.minVolunteers, dur, ris.requiredVehicles, ris.scaleKey);

          const lat = parseFloat(((comObj.lat || station.lat) + (Math.random() - 0.5) * 0.012).toFixed(4));
          const lng = parseFloat(((comObj.lng || station.lng) + (Math.random() - 0.5) * 0.012).toFixed(4));

          const isLastMinute = Math.random() < 0.20;
          const daysAhead = isLastMinute 
            ? (2 + Math.floor(Math.random() * 3))
            : (7 + (generatedEvents.length * 2) + Math.floor(Math.random() * 3));
          const startHour = (title.includes('Nocturne') || title.includes('Fête Patronale') || title.includes('Musique')) ? 19 : 14;
          const eventDateObj = this.createFutureEventDate(currentYear, currentMonth, currentDay, daysAhead, startHour, dur, daysNames, monthsNames);

          const venueName = tpl.venueTpl.replace(/{commune}/g, comObj.nom);
          const clientName = tpl.clientTpl.replace(/{commune}/g, comObj.nom);

          generatedEvents.push({
            id: `real-ctx-${deptCode}-${generatedEvents.length}-${Date.now()}`,
            eventName: title,
            rawEventName: title,
            clientName: clientName,
            clientType: tpl.cType,
            commune: comObj.nom,
            venue: venueName,
            address: `${venueName}, ${comObj.nom}`,
            lat,
            lng,
            eventDate: eventDateObj,
            durationHours: dur,
            publicCount: `${pub.toLocaleString('fr-FR')} personnes`,
            rawPublicCount: pub,
            environment: tpl.env,
            emergencyAccess: `${tpl.delayMin} min`,
            riskLevel: tpl.risk,
            risScore: ris.risScore,
            scale: ris.scale,
            scaleKey: ris.scaleKey,
            requiredVolunteers: ris.minVolunteers,
            requiredRanks: ris.requiredRanks,
            requiredVehicles: ris.requiredVehicles,
            requiredLots: ris.requiredLots,
            hiddenMinVolunteers: ris.minVolunteers,
            hiddenRequiredSkills: ris.requiredRanks,
            consumableCost: ris.scaleKey === 'PAPS' ? 15 : 35,
            status: 'pending',
            isLastMinute: isLastMinute,
            daysAhead: daysAhead,
            secondsLeft: 3600 * 24 * 7,
            budgetMax: fin.budgetMax,
            bareme: fin.bareme,
            proposedPrice: fin.bareme.totalBareme,
            isRealTerritoryEvent: true,
            realEventCategory: 'contextuel_commune',
            contextualMeta: { commune: comObj.nom, venue: venueName }
          });
        }

        templateIdx++;
        communeIdx++;
        // Sécurité boucle infinie
        if (templateIdx > 60) break;
      }

      console.log(`[MyProtec EvenementsReels] Génération réussie de ${generatedEvents.length} événements réels pour ${deptInfo.name} (${deptCode})`);
      return generatedEvents;
    },

    // =========================================================================
    // 6. INJECTION ET SYNCHRONISATION AVEC LES DEVIS DU JOUEUR (AVEC LIMITE INVISIBLE)
    // =========================================================================
    /**
     * Conserve le vivier complet des événements du territoire en réserve (territoryEventsPool)
     * et n'injecte dans les devis du joueur que le nombre autorisé par la limite invisible
     * afin de ne jamais submerger une antenne débutante sans campagne de publicité.
     */
    injectEventsIntoGame(game, eventsList) {
      if (!game || !Array.isArray(eventsList) || eventsList.length === 0) return 0;
      if (!Array.isArray(game.devis)) game.devis = [];
      if (!Array.isArray(game.territoryEventsPool)) game.territoryEventsPool = [];

      const existingNames = new Set([
        ...game.devis.map(d => (d.eventName || '').trim().toLowerCase()),
        ...game.territoryEventsPool.map(d => (d.eventName || '').trim().toLowerCase())
      ]);

      // 1. Ajouter les nouveaux événements dans le vivier territorial en évitant les doublons
      eventsList.forEach(evt => {
        const normName = (evt.eventName || '').trim().toLowerCase();
        if (!existingNames.has(normName)) {
          existingNames.add(normName);
          game.territoryEventsPool.push(evt);
        }
      });

      // 2. Limite invisible de demandes en simultané
      const maxLimit = typeof game.getSimultaneousDevisLimit === 'function'
        ? game.getSimultaneousDevisLimit()
        : 2;

      // 3. Si le carnet de devis a un excédent de demandes en attente (ex: ancienne injection massive de 20 devis),
      // basculer le surplus dans le vivier territorial pour ne conserver que la limite autorisée en attente
      const pendingDevis = game.devis.filter(d => d.status === 'pending');
      if (pendingDevis.length > maxLimit) {
        const toKeep = pendingDevis.slice(0, maxLimit);
        const toMoveToPool = pendingDevis.slice(maxLimit);
        
        // Transférer l'excédent dans le vivier
        toMoveToPool.forEach(d => {
          if (!game.territoryEventsPool.some(p => (p.eventName || '').toLowerCase() === (d.eventName || '').toLowerCase())) {
            game.territoryEventsPool.push(d);
          }
        });

        // Conserver uniquement les devis validés, refusés et les devis pending autorisés
        game.devis = [
          ...game.devis.filter(d => d.status !== 'pending'),
          ...toKeep
        ];
      }

      // 4. Injecter au compte-goutte depuis le vivier si la file n'est pas encore pleine
      let currentPending = game.devis.filter(d => d.status === 'pending').length;
      let addedCount = 0;

      while (currentPending < maxLimit && game.territoryEventsPool.length > 0) {
        const nextEvt = game.territoryEventsPool.shift();
        this.ensureFutureEventDate(nextEvt, game);
        nextEvt.status = 'pending';
        nextEvt.secondsLeft = nextEvt.isLastMinute ? (3 * 3600) : (6 * 3600);
        game.devis.push(nextEvt);
        currentPending++;
        addedCount++;
      }

      if (addedCount > 0 || pendingDevis.length > maxLimit) {
        if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
        if (typeof game.saveGame === 'function') game.saveGame();
      }

      return addedCount;
    },

    // =========================================================================
    // 7. DÉCLENCHEURS : PLACEMENT D'ANTENNE & CYCLE MENSUEL
    // =========================================================================
    /**
     * DÉCLENCHEUR 1 : Lors du placement de l'antenne sur la carte.
     * Génère le vivier d'événements du territoire et alimente modérément le carnet de devis.
     */
    initStationEvents(game, station) {
      if (!game || !station) return 0;

      console.log(`[MyProtec EvenementsReels] 📍 Vivier d'ancrage territorial initialisé pour ${station.name} (${station.city})`);

      const pool = this.generateTerritoryEventsPool(game, station, 20);

      // Si l'antenne vient de démarrer et n'a pas encore communiqué, conserver le vivier en réserve dormante
      const hasComm = !!(game.resources?.campaigns?.social || game.resources?.campaigns?.posters || game.resources?.campaigns?.presse || (game.activeCampaigns || []).length > 0);
      const hasWebsite = !!(game.antenneWebsite && game.antenneWebsite.published && (game.antenneWebsite.freshness || 0) >= 40);
      const rep = game.resources?.reputationScore || 0;
      const completedDps = (game.missions || []).filter(m => m.type === 'dps' && m.status === 'completed').length;

      let added = 0;
      if (hasComm || hasWebsite || rep >= 80 || completedDps > 0) {
        added = this.injectEventsIntoGame(game, pool);
      } else {
        // Enregistrer le vivier sans pousser de devis en boîte de réception
        if (!Array.isArray(game.territoryEventsPool)) game.territoryEventsPool = [];
        pool.forEach(evt => {
          if (!game.territoryEventsPool.some(p => (p.eventName || '').toLowerCase() === (evt.eventName || '').toLowerCase())) {
            game.territoryEventsPool.push(evt);
          }
        });
      }

      station.territoryEventsPoolCount = pool.length;
      station.lastTerritoryEventsGeneratedAt = Date.now();

      if (added > 0 && typeof game.showToast === 'function') {
        game.showToast(
          'Ancrage Territorial Activé 📍',
          `${added} opportunité(s) de DPS issue(s) du secteur de ${station.city || 'votre antenne'} disponible(s).`,
          'blue'
        );
      }

      return added;
    },

    /**
     * DÉCLENCHEUR 2 : Mise à jour mensuelle (1 fois par mois).
     * Renouvelle le vivier territorial avec 20 événements du nouveau mois.
     */
    checkMonthlyTerritoryRefresh(game) {
      if (!game || !game.clock || !game.stations || game.stations.length === 0) return;

      const year = game.clock.year || new Date().getFullYear();
      const month = game.clock.month !== undefined ? game.clock.month : new Date().getMonth();
      const monthKey = `${year}-${month}`;

      if (game.lastTerritoryRefreshMonthKey === monthKey) {
        return; // Déjà actualisé pour ce mois
      }

      console.log(`[MyProtec EvenementsReels] 📅 Renouvellement mensuel des événements réels pour le mois ${monthKey}`);
      game.lastTerritoryRefreshMonthKey = monthKey;

      let totalAdded = 0;
      game.stations.forEach(station => {
        const monthlyPool = this.generateTerritoryEventsPool(game, station, 20);
        totalAdded += this.injectEventsIntoGame(game, monthlyPool);
      });

      if (totalAdded > 0) {
        if (typeof game.showToast === 'function') {
          game.showToast(
            'Nouveau Mois : Vivier Territorial 📅',
            `Le calendrier mensuel est actualisé : ${totalAdded} nouveaux événements réels du secteur ajoutés à vos demandes de DPS !`,
            'green'
          );
        }

        if (window.ProtecNotifications && typeof window.ProtecNotifications.recordNotification === 'function') {
          window.ProtecNotifications.recordNotification({
            title: '📅 Renouvellement Mensuel des DPS',
            message: `Un nouveau mois débute. ${totalAdded} événements territoriaux sont prêts pour étude de dimensionnement et établissement de devis.`,
            category: 'dps',
            level: 'info'
          });
        }
      }

      return totalAdded;
    },

    /**
     * Sécurité au chargement du jeu : assure que si une antenne est posée,
     * les 20 événements territoriaux existent et que tous les devis passés sont régularisés.
     */
    ensureTerritoryEvents(game) {
      if (!game || !game.stations || game.stations.length === 0) return;

      // Nettoyage et recalage systématique de tout devis dont la date serait passée
      this.cleanPastDevis(game);

      const hasRealEvents = (Array.isArray(game.devis) && game.devis.some(d => d.isRealTerritoryEvent)) ||
                            (Array.isArray(game.territoryEventsPool) && game.territoryEventsPool.length > 0);

      if (!hasRealEvents) {
        console.log('[MyProtec EvenementsReels] Initialisation de rattrapage des événements du territoire...');
        this.initStationEvents(game, game.stations[0]);
      } else {
        // Nettoyage systématique de tout excédent de devis pending existant
        this.injectEventsIntoGame(game, []);
      }
    }
  };

  window.roundExpectedPublic = window.ProtecEvenementsReels.roundExpectedPublic;

  console.log('[MyProtec] Module EvenementsReels (Ancrage Réel & DPS Territoire) initialisé avec succès.');
})();
