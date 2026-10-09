/**
 * PROTEC LIVE - RÉFÉRENTIEL DES DÉPARTEMENTS ET RÉGIONS DE FRANCE
 * Contient les 101 départements métropolitains et d'outre-mer avec leur VRAIE RÉGION OFFICIELLE DE FRANCE,
 * chefs-lieux, coordonnées centrales et boîtes englobantes (bounding box) pour la carte et les canaux de tchat.
 */

window.ProtecDepartements = {
  // Liste officielle des 18 vraies régions administratives de France (13 métropolitaines + 5 d'outre-mer)
  REGIONS: [
    'Auvergne-Rhône-Alpes',
    'Bourgogne-Franche-Comté',
    'Bretagne',
    'Centre-Val de Loire',
    'Corse',
    'Grand Est',
    'Hauts-de-France',
    'Île-de-France',
    'Normandie',
    'Nouvelle-Aquitaine',
    'Occitanie',
    'Pays de la Loire',
    'Provence-Alpes-Côte d’Azur',
    'Guadeloupe',
    'Martinique',
    'Guyane',
    'La Réunion',
    'Mayotte'
  ],

  // Liste exhaustive des 101 départements français avec leur VRAIE région officielle
  list: [
    { code: '01', name: 'Ain', chefLieu: 'Bourg-en-Bresse', region: 'Auvergne-Rhône-Alpes', lat: 46.10, lng: 5.35, zoom: 10, bbox: [45.65, 4.70, 46.55, 6.10] },
    { code: '02', name: 'Aisne', chefLieu: 'Laon', region: 'Hauts-de-France', lat: 49.56, lng: 3.62, zoom: 10, bbox: [48.85, 2.95, 50.10, 4.30] },
    { code: '03', name: 'Allier', chefLieu: 'Moulins', region: 'Auvergne-Rhône-Alpes', lat: 46.39, lng: 3.16, zoom: 10, bbox: [45.90, 2.30, 46.80, 3.90] },
    { code: '04', name: 'Alpes-de-Haute-Provence', chefLieu: 'Digne-les-Bains', region: 'Provence-Alpes-Côte d’Azur', lat: 44.09, lng: 6.24, zoom: 10, bbox: [43.60, 5.50, 44.60, 6.95] },
    { code: '05', name: 'Hautes-Alpes', chefLieu: 'Gap', region: 'Provence-Alpes-Côte d’Azur', lat: 44.66, lng: 6.30, zoom: 10, bbox: [44.20, 5.50, 45.10, 7.15] },
    { code: '06', name: 'Alpes-Maritimes', chefLieu: 'Nice', region: 'Provence-Alpes-Côte d’Azur', lat: 43.93, lng: 7.17, zoom: 10, bbox: [43.45, 6.70, 44.35, 7.75] },
    { code: '07', name: 'Ardèche', chefLieu: 'Privas', region: 'Auvergne-Rhône-Alpes', lat: 44.75, lng: 4.45, zoom: 10, bbox: [44.25, 3.85, 45.35, 4.90] },
    { code: '08', name: 'Ardennes', chefLieu: 'Charleville-Mézières', region: 'Grand Est', lat: 49.60, lng: 4.65, zoom: 10, bbox: [49.15, 4.10, 50.25, 5.35] },
    { code: '09', name: 'Ariège', chefLieu: 'Foix', region: 'Occitanie', lat: 42.95, lng: 1.50, zoom: 10, bbox: [42.55, 0.80, 43.35, 2.20] },
    { code: '10', name: 'Aube', chefLieu: 'Troyes', region: 'Grand Est', lat: 48.30, lng: 4.10, zoom: 10, bbox: [47.90, 3.40, 48.70, 4.85] },
    { code: '11', name: 'Aude', chefLieu: 'Carcassonne', region: 'Occitanie', lat: 43.15, lng: 2.40, zoom: 10, bbox: [42.60, 1.70, 43.45, 3.25] },
    { code: '12', name: 'Aveyron', chefLieu: 'Rodez', region: 'Occitanie', lat: 44.35, lng: 2.60, zoom: 10, bbox: [43.70, 1.85, 44.95, 3.45] },
    { code: '13', name: 'Bouches-du-Rhône', chefLieu: 'Marseille', region: 'Provence-Alpes-Côte d’Azur', lat: 43.53, lng: 5.08, zoom: 10, bbox: [43.15, 4.25, 43.90, 5.80] },
    { code: '14', name: 'Calvados', chefLieu: 'Caen', region: 'Normandie', lat: 49.10, lng: -0.35, zoom: 10, bbox: [48.75, -1.15, 49.45, 0.45] },
    { code: '15', name: 'Cantal', chefLieu: 'Aurillac', region: 'Auvergne-Rhône-Alpes', lat: 45.05, lng: 2.70, zoom: 10, bbox: [44.60, 2.05, 45.45, 3.35] },
    { code: '16', name: 'Charente', chefLieu: 'Angoulême', region: 'Nouvelle-Aquitaine', lat: 45.72, lng: 0.17, zoom: 10, bbox: [45.15, -0.55, 46.15, 0.95] },
    { code: '17', name: 'Charente-Maritime', chefLieu: 'La Rochelle', region: 'Nouvelle-Aquitaine', lat: 45.85, lng: -0.80, zoom: 10, bbox: [45.10, -1.60, 46.40, -0.10] },
    { code: '18', name: 'Cher', chefLieu: 'Bourges', region: 'Centre-Val de Loire', lat: 47.08, lng: 2.40, zoom: 10, bbox: [46.40, 1.85, 47.70, 3.10] },
    { code: '19', name: 'Corrèze', chefLieu: 'Tulle', region: 'Nouvelle-Aquitaine', lat: 45.35, lng: 1.90, zoom: 10, bbox: [44.90, 1.15, 45.80, 2.50] },
    { code: '21', name: 'Côte-d’Or', chefLieu: 'Dijon', region: 'Bourgogne-Franche-Comté', lat: 47.32, lng: 4.85, zoom: 10, bbox: [46.85, 4.10, 47.95, 5.55] },
    { code: '22', name: 'Côtes-d’Armor', chefLieu: 'Saint-Brieuc', region: 'Bretagne', lat: 48.45, lng: -2.85, zoom: 10, bbox: [48.05, -3.70, 48.90, -1.90] },
    { code: '23', name: 'Creuse', chefLieu: 'Guéret', region: 'Nouvelle-Aquitaine', lat: 46.05, lng: 2.05, zoom: 10, bbox: [45.60, 1.35, 46.45, 2.65] },
    { code: '24', name: 'Dordogne', chefLieu: 'Périgueux', region: 'Nouvelle-Aquitaine', lat: 45.15, lng: 0.70, zoom: 10, bbox: [44.55, -0.10, 45.75, 1.50] },
    { code: '25', name: 'Doubs', chefLieu: 'Besançon', region: 'Bourgogne-Franche-Comté', lat: 47.15, lng: 6.35, zoom: 10, bbox: [46.70, 5.65, 47.60, 7.00] },
    { code: '26', name: 'Drôme', chefLieu: 'Valence', region: 'Auvergne-Rhône-Alpes', lat: 44.70, lng: 5.15, zoom: 10, bbox: [44.10, 4.60, 45.30, 5.80] },
    { code: '27', name: 'Eure', chefLieu: 'Évreux', region: 'Normandie', lat: 49.05, lng: 1.05, zoom: 10, bbox: [48.65, 0.35, 49.50, 1.80] },
    { code: '28', name: 'Eure-et-Loir', chefLieu: 'Chartres', region: 'Centre-Val de Loire', lat: 48.40, lng: 1.45, zoom: 10, bbox: [47.95, 0.75, 48.95, 2.05] },
    { code: '29', name: 'Finistère', chefLieu: 'Quimper', region: 'Bretagne', lat: 48.25, lng: -4.10, zoom: 10, bbox: [47.70, -4.90, 48.75, -3.40] },
    { code: '2A', name: 'Corse-du-Sud', chefLieu: 'Ajaccio', region: 'Corse', lat: 41.90, lng: 8.95, zoom: 10, bbox: [41.35, 8.50, 42.40, 9.45] },
    { code: '2B', name: 'Haute-Corse', chefLieu: 'Bastia', region: 'Corse', lat: 42.45, lng: 9.30, zoom: 10, bbox: [41.80, 8.70, 43.05, 9.60] },
    { code: '30', name: 'Gard', chefLieu: 'Nîmes', region: 'Occitanie', lat: 44.05, lng: 4.20, zoom: 10, bbox: [43.45, 3.25, 44.45, 4.90] },
    { code: '31', name: 'Haute-Garonne', chefLieu: 'Toulouse', region: 'Occitanie', lat: 43.40, lng: 1.25, zoom: 10, bbox: [42.65, 0.45, 43.95, 2.10] },
    { code: '32', name: 'Gers', chefLieu: 'Auch', region: 'Occitanie', lat: 43.65, lng: 0.55, zoom: 10, bbox: [43.30, -0.30, 44.10, 1.20] },
    { code: '33', name: 'Gironde', chefLieu: 'Bordeaux', region: 'Nouvelle-Aquitaine', lat: 44.85, lng: -0.55, zoom: 10, bbox: [44.15, -1.30, 45.60, 0.35] },
    { code: '34', name: 'Hérault', chefLieu: 'Montpellier', region: 'Occitanie', lat: 43.60, lng: 3.40, zoom: 10, bbox: [43.15, 2.50, 44.00, 4.25] },
    { code: '35', name: 'Ille-et-Vilaine', chefLieu: 'Rennes', region: 'Bretagne', lat: 48.15, lng: -1.70, zoom: 10, bbox: [47.60, -2.35, 48.70, -1.00] },
    { code: '36', name: 'Indre', chefLieu: 'Châteauroux', region: 'Centre-Val de Loire', lat: 46.80, lng: 1.65, zoom: 10, bbox: [46.30, 0.85, 47.30, 2.30] },
    { code: '37', name: 'Indre-et-Loire', chefLieu: 'Tours', region: 'Centre-Val de Loire', lat: 47.30, lng: 0.70, zoom: 10, bbox: [46.75, 0.05, 47.70, 1.40] },
    { code: '38', name: 'Isère', chefLieu: 'Grenoble', region: 'Auvergne-Rhône-Alpes', lat: 45.25, lng: 5.65, zoom: 10, bbox: [44.75, 4.80, 45.85, 6.40] },
    { code: '39', name: 'Jura', chefLieu: 'Lons-le-Saunier', region: 'Bourgogne-Franche-Comté', lat: 46.75, lng: 5.75, zoom: 10, bbox: [46.30, 5.25, 47.30, 6.25] },
    { code: '40', name: 'Landes', chefLieu: 'Mont-de-Marsan', region: 'Nouvelle-Aquitaine', lat: 43.90, lng: -0.85, zoom: 10, bbox: [43.45, -1.60, 44.60, 0.20] },
    { code: '41', name: 'Loir-et-Cher', chefLieu: 'Blois', region: 'Centre-Val de Loire', lat: 47.60, lng: 1.35, zoom: 10, bbox: [47.15, 0.55, 48.15, 2.25] },
    { code: '42', name: 'Loire', chefLieu: 'Saint-Étienne', region: 'Auvergne-Rhône-Alpes', lat: 45.65, lng: 4.15, zoom: 10, bbox: [45.20, 3.65, 46.30, 4.80] },
    { code: '43', name: 'Haute-Loire', chefLieu: 'Le Puy-en-Velay', region: 'Auvergne-Rhône-Alpes', lat: 45.10, lng: 3.85, zoom: 10, bbox: [44.70, 3.10, 45.45, 4.55] },
    { code: '44', name: 'Loire-Atlantique', chefLieu: 'Nantes', region: 'Pays de la Loire', lat: 47.35, lng: -1.70, zoom: 10, bbox: [46.85, -2.60, 47.85, -1.00] },
    { code: '45', name: 'Loiret', chefLieu: 'Orléans', region: 'Centre-Val de Loire', lat: 47.95, lng: 2.25, zoom: 10, bbox: [47.50, 1.50, 48.35, 3.10] },
    { code: '46', name: 'Lot', chefLieu: 'Cahors', region: 'Occitanie', lat: 44.65, lng: 1.60, zoom: 10, bbox: [44.20, 1.00, 45.05, 2.15] },
    { code: '47', name: 'Lot-et-Garonne', chefLieu: 'Agen', region: 'Nouvelle-Aquitaine', lat: 44.35, lng: 0.40, zoom: 10, bbox: [43.95, -0.20, 44.80, 1.10] },
    { code: '48', name: 'Lozère', chefLieu: 'Mende', region: 'Occitanie', lat: 44.55, lng: 3.50, zoom: 10, bbox: [44.10, 3.00, 44.95, 4.00] },
    { code: '49', name: 'Maine-et-Loire', chefLieu: 'Angers', region: 'Pays de la Loire', lat: 47.45, lng: -0.55, zoom: 10, bbox: [46.95, -1.35, 47.85, 0.25] },
    { code: '50', name: 'Manche', chefLieu: 'Saint-Lô', region: 'Normandie', lat: 49.10, lng: -1.35, zoom: 10, bbox: [48.45, -2.00, 49.75, -0.75] },
    { code: '51', name: 'Marne', chefLieu: 'Châlons-en-Champagne', region: 'Grand Est', lat: 49.00, lng: 4.25, zoom: 10, bbox: [48.50, 3.40, 49.45, 5.05] },
    { code: '52', name: 'Haute-Marne', chefLieu: 'Chaumont', region: 'Grand Est', lat: 48.15, lng: 5.25, zoom: 10, bbox: [47.55, 4.60, 48.70, 5.90] },
    { code: '53', name: 'Mayenne', chefLieu: 'Laval', region: 'Pays de la Loire', lat: 48.15, lng: -0.65, zoom: 10, bbox: [47.75, -1.30, 48.60, -0.10] },
    { code: '54', name: 'Meurthe-et-Moselle', chefLieu: 'Nancy', region: 'Grand Est', lat: 48.75, lng: 6.15, zoom: 10, bbox: [48.35, 5.40, 49.60, 7.05] },
    { code: '55', name: 'Meuse', chefLieu: 'Bar-le-Duc', region: 'Grand Est', lat: 49.05, lng: 5.35, zoom: 10, bbox: [48.40, 4.85, 49.65, 5.85] },
    { code: '56', name: 'Morbihan', chefLieu: 'Vannes', region: 'Bretagne', lat: 47.85, lng: -2.85, zoom: 10, bbox: [47.25, -3.75, 48.20, -2.05] },
    { code: '57', name: 'Moselle', chefLieu: 'Metz', region: 'Grand Est', lat: 49.10, lng: 6.65, zoom: 10, bbox: [48.55, 5.85, 49.50, 7.65] },
    { code: '58', name: 'Nièvre', chefLieu: 'Nevers', region: 'Bourgogne-Franche-Comté', lat: 47.10, lng: 3.55, zoom: 10, bbox: [46.65, 2.80, 47.60, 4.30] },
    { code: '59', name: 'Nord', chefLieu: 'Lille', region: 'Hauts-de-France', lat: 50.45, lng: 3.25, zoom: 10, bbox: [49.95, 2.05, 51.10, 4.30] },
    { code: '60', name: 'Oise', chefLieu: 'Beauvais', region: 'Hauts-de-France', lat: 49.40, lng: 2.40, zoom: 10, bbox: [49.05, 1.70, 49.80, 3.15] },
    { code: '61', name: 'Orne', chefLieu: 'Alençon', region: 'Normandie', lat: 48.60, lng: 0.15, zoom: 10, bbox: [48.15, -0.85, 48.95, 1.05] },
    { code: '62', name: 'Pas-de-Calais', chefLieu: 'Arras', region: 'Hauts-de-France', lat: 50.50, lng: 2.30, zoom: 10, bbox: [50.00, 1.50, 51.05, 3.25] },
    { code: '63', name: 'Puy-de-Dôme', chefLieu: 'Clermont-Ferrand', region: 'Auvergne-Rhône-Alpes', lat: 45.75, lng: 3.15, zoom: 10, bbox: [45.25, 2.40, 46.20, 3.90] },
    { code: '64', name: 'Pyrénées-Atlantiques', chefLieu: 'Pau', region: 'Nouvelle-Aquitaine', lat: 43.30, lng: -0.75, zoom: 10, bbox: [42.75, -1.80, 43.60, 0.05] },
    { code: '65', name: 'Hautes-Pyrénées', chefLieu: 'Tarbes', region: 'Occitanie', lat: 43.10, lng: 0.15, zoom: 10, bbox: [42.65, -0.35, 43.60, 0.65] },
    { code: '66', name: 'Pyrénées-Orientales', chefLieu: 'Perpignan', region: 'Occitanie', lat: 42.60, lng: 2.50, zoom: 10, bbox: [42.30, 1.70, 42.95, 3.20] },
    { code: '67', name: 'Bas-Rhin', chefLieu: 'Strasbourg', region: 'Grand Est', lat: 48.70, lng: 7.55, zoom: 10, bbox: [48.20, 6.90, 49.10, 8.25] },
    { code: '68', name: 'Haut-Rhin', chefLieu: 'Colmar', region: 'Grand Est', lat: 47.90, lng: 7.30, zoom: 10, bbox: [47.40, 6.80, 48.30, 7.75] },
    { code: '69', name: 'Rhône & Métropole de Lyon', chefLieu: 'Lyon', region: 'Auvergne-Rhône-Alpes', lat: 45.85, lng: 4.70, zoom: 10, bbox: [45.45, 4.30, 46.30, 5.15] },
    { code: '70', name: 'Haute-Saône', chefLieu: 'Vesoul', region: 'Bourgogne-Franche-Comté', lat: 47.65, lng: 6.10, zoom: 10, bbox: [47.20, 5.35, 48.05, 6.85] },
    { code: '71', name: 'Saône-et-Loire', chefLieu: 'Mâcon', region: 'Bourgogne-Franche-Comté', lat: 46.65, lng: 4.55, zoom: 10, bbox: [46.10, 3.65, 47.15, 5.50] },
    { code: '72', name: 'Sarthe', chefLieu: 'Le Mans', region: 'Pays de la Loire', lat: 48.00, lng: 0.20, zoom: 10, bbox: [47.55, -0.45, 48.45, 0.90] },
    { code: '73', name: 'Savoie', chefLieu: 'Chambéry', region: 'Auvergne-Rhône-Alpes', lat: 45.50, lng: 6.50, zoom: 10, bbox: [45.05, 5.65, 45.95, 7.20] },
    { code: '74', name: 'Haute-Savoie', chefLieu: 'Annecy', region: 'Auvergne-Rhône-Alpes', lat: 46.05, lng: 6.45, zoom: 10, bbox: [45.65, 5.80, 46.45, 7.10] },
    { code: '75', name: 'Paris', chefLieu: 'Paris', region: 'Île-de-France', lat: 48.8566, lng: 2.3522, zoom: 12, bbox: [48.815, 2.225, 48.902, 2.470] },
    { code: '76', name: 'Seine-Maritime', chefLieu: 'Rouen', region: 'Normandie', lat: 49.65, lng: 1.05, zoom: 10, bbox: [49.30, 0.05, 50.10, 1.85] },
    { code: '77', name: 'Seine-et-Marne', chefLieu: 'Melun', region: 'Île-de-France', lat: 48.60, lng: 2.95, zoom: 10, bbox: [48.10, 2.35, 49.15, 3.60] },
    { code: '78', name: 'Yvelines', chefLieu: 'Versailles', region: 'Île-de-France', lat: 48.80, lng: 1.90, zoom: 10, bbox: [48.45, 1.45, 49.10, 2.25] },
    { code: '79', name: 'Deux-Sèvres', chefLieu: 'Niort', region: 'Nouvelle-Aquitaine', lat: 46.55, lng: -0.35, zoom: 10, bbox: [46.05, -0.90, 47.10, 0.15] },
    { code: '80', name: 'Somme', chefLieu: 'Amiens', region: 'Hauts-de-France', lat: 49.95, lng: 2.30, zoom: 10, bbox: [49.55, 1.35, 50.40, 3.25] },
    { code: '81', name: 'Tarn', chefLieu: 'Albi', region: 'Occitanie', lat: 43.80, lng: 2.20, zoom: 10, bbox: [43.35, 1.50, 44.25, 2.95] },
    { code: '82', name: 'Tarn-et-Garonne', chefLieu: 'Montauban', region: 'Occitanie', lat: 44.10, lng: 1.25, zoom: 10, bbox: [43.75, 0.70, 44.40, 1.95] },
    { code: '83', name: 'Var', chefLieu: 'Toulon', region: 'Provence-Alpes-Côte d’Azur', lat: 43.45, lng: 6.25, zoom: 10, bbox: [42.95, 5.60, 43.85, 6.95] },
    { code: '84', name: 'Vaucluse', chefLieu: 'Avignon', region: 'Provence-Alpes-Côte d’Azur', lat: 44.00, lng: 5.15, zoom: 10, bbox: [43.65, 4.60, 44.45, 5.80] },
    { code: '85', name: 'Vendée', chefLieu: 'La Roche-sur-Yon', region: 'Pays de la Loire', lat: 46.65, lng: -1.35, zoom: 10, bbox: [46.25, -2.45, 47.10, -0.55] },
    { code: '86', name: 'Vienne', chefLieu: 'Poitiers', region: 'Nouvelle-Aquitaine', lat: 46.60, lng: 0.45, zoom: 10, bbox: [46.10, -0.15, 47.15, 1.15] },
    { code: '87', name: 'Haute-Vienne', chefLieu: 'Limoges', region: 'Nouvelle-Aquitaine', lat: 45.85, lng: 1.25, zoom: 10, bbox: [45.40, 0.60, 46.40, 1.85] },
    { code: '88', name: 'Vosges', chefLieu: 'Épinal', region: 'Grand Est', lat: 48.20, lng: 6.35, zoom: 10, bbox: [47.80, 5.35, 48.55, 7.20] },
    { code: '89', name: 'Yonne', chefLieu: 'Auxerre', region: 'Bourgogne-Franche-Comté', lat: 47.85, lng: 3.55, zoom: 10, bbox: [47.30, 2.80, 48.45, 4.45] },
    { code: '90', name: 'Territoire de Belfort', chefLieu: 'Belfort', region: 'Bourgogne-Franche-Comté', lat: 47.64, lng: 6.90, zoom: 11, bbox: [47.45, 6.75, 47.80, 7.15] },
    { code: '91', name: 'Essonne', chefLieu: 'Évry-Courcouronnes', region: 'Île-de-France', lat: 48.55, lng: 2.25, zoom: 11, bbox: [48.25, 1.90, 48.75, 2.60] },
    { code: '92', name: 'Hauts-de-Seine', chefLieu: 'Nanterre', region: 'Île-de-France', lat: 48.85, lng: 2.23, zoom: 11, bbox: [48.72, 2.15, 48.95, 2.33] },
    { code: '93', name: 'Seine-Saint-Denis', chefLieu: 'Bobigny', region: 'Île-de-France', lat: 48.91, lng: 2.45, zoom: 11, bbox: [48.85, 2.30, 49.02, 2.60] },
    { code: '94', name: 'Val-de-Marne', chefLieu: 'Créteil', region: 'Île-de-France', lat: 48.77, lng: 2.46, zoom: 11, bbox: [48.68, 2.30, 48.86, 2.60] },
    { code: '95', name: 'Val-d’Oise', chefLieu: 'Cergy-Pontoise', region: 'Île-de-France', lat: 49.05, lng: 2.10, zoom: 10, bbox: [48.98, 1.60, 49.25, 2.60] },
    { code: '971', name: 'Guadeloupe', chefLieu: 'Basse-Terre', region: 'Guadeloupe', lat: 16.25, lng: -61.55, zoom: 10, bbox: [15.80, -61.85, 16.55, -61.00] },
    { code: '972', name: 'Martinique', chefLieu: 'Fort-de-France', region: 'Martinique', lat: 14.65, lng: -61.00, zoom: 10, bbox: [14.35, -61.25, 14.90, -60.80] },
    { code: '973', name: 'Guyane', chefLieu: 'Cayenne', region: 'Guyane', lat: 4.00, lng: -53.00, zoom: 7, bbox: [2.10, -54.60, 5.80, -51.60] },
    { code: '974', name: 'La Réunion', chefLieu: 'Saint-Denis', region: 'La Réunion', lat: -21.15, lng: 55.50, zoom: 10, bbox: [-21.40, 55.20, -20.85, 55.85] },
    { code: '976', name: 'Mayotte', chefLieu: 'Mamoudzou', region: 'Mayotte', lat: -12.80, lng: 45.15, zoom: 10, bbox: [-13.00, 45.00, -12.60, 45.30] }
  ],

  // Récupère un département par son code (ex: '75', '69', '13', '2A')
  getByCode(code) {
    if (!code) return null;
    const clean = String(code).trim().toUpperCase();
    return this.list.find(d => d.code === clean || d.code === clean.padStart(2, '0'));
  },

  // Récupère la vraie région officielle d'un département
  getRegion(deptCode) {
    const d = this.getByCode(deptCode);
    return d ? d.region : 'Île-de-France';
  },

  // Récupère tous les départements appartenant à une région donnée
  getDepartmentsByRegion(regionName) {
    if (!regionName) return [];
    return this.list.filter(d => d.region === regionName);
  },

  // Vérifie si des coordonnées [lat, lng] se trouvent dans la boîte englobante du département
  isCoordinateInside(deptCode, lat, lng) {
    const d = this.getByCode(deptCode);
    if (!d || !d.bbox) return true; // tolérance si manquant
    const [minLat, minLng, maxLat, maxLng] = d.bbox;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  },

  // Récupère la Zone de Défense et de Sécurité officielle du département
  getZoneDefense(deptCode) {
    const d = this.getByCode(deptCode);
    const code = d ? d.code : '75';
    const reg = d ? d.region : 'Île-de-France';

    if (['75', '77', '78', '91', '92', '93', '94', '95'].includes(code) || reg === 'Île-de-France') {
      return {
        id: 'idf',
        code: 'IDF',
        name: 'Zone de Défense et de Sécurité de Paris',
        shortName: 'Zone Île-de-France',
        siege: 'Préfecture de Police de Paris',
        regions: ['Île-de-France']
      };
    }
    if (['08', '10', '21', '25', '39', '51', '52', '54', '55', '57', '58', '67', '68', '70', '71', '88', '89', '90'].includes(code) || ['Grand Est', 'Bourgogne-Franche-Comté'].includes(reg)) {
      return {
        id: 'est',
        code: 'EST',
        name: 'Zone de Défense et de Sécurité Est',
        shortName: 'Zone Est',
        siege: 'Metz / Strasbourg',
        regions: ['Grand Est', 'Bourgogne-Franche-Comté']
      };
    }
    if (['02', '59', '60', '62', '80'].includes(code) || reg === 'Hauts-de-France') {
      return {
        id: 'nord',
        code: 'NORD',
        name: 'Zone de Défense et de Sécurité Nord',
        shortName: 'Zone Nord',
        siege: 'Lille',
        regions: ['Hauts-de-France']
      };
    }
    if (['14', '18', '22', '27', '28', '29', '35', '36', '37', '41', '44', '45', '49', '50', '53', '56', '61', '72', '76', '85'].includes(code) || ['Bretagne', 'Normandie', 'Pays de la Loire', 'Centre-Val de Loire'].includes(reg)) {
      return {
        id: 'ouest',
        code: 'OUEST',
        name: 'Zone de Défense et de Sécurité Ouest',
        shortName: 'Zone Ouest',
        siege: 'Rennes',
        regions: ['Bretagne', 'Normandie', 'Pays de la Loire', 'Centre-Val de Loire']
      };
    }
    if (['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'].includes(code) || reg === 'Nouvelle-Aquitaine') {
      return {
        id: 'sud-ouest',
        code: 'SO',
        name: 'Zone de Défense et de Sécurité Sud-Ouest',
        shortName: 'Zone Sud-Ouest',
        siege: 'Bordeaux',
        regions: ['Nouvelle-Aquitaine']
      };
    }
    if (['04', '05', '06', '09', '11', '12', '13', '2A', '2B', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82', '83', '84'].includes(code) || ['Occitanie', 'Provence-Alpes-Côte d’Azur', 'Corse'].includes(reg)) {
      return {
        id: 'sud',
        code: 'SUD',
        name: 'Zone de Défense et de Sécurité Sud',
        shortName: 'Zone Sud',
        siege: 'Marseille',
        regions: ['Occitanie', 'Provence-Alpes-Côte d’Azur', 'Corse']
      };
    }
    if (['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'].includes(code) || reg === 'Auvergne-Rhône-Alpes') {
      return {
        id: 'sud-est',
        code: 'SE',
        name: 'Zone de Défense et de Sécurité Sud-Est',
        shortName: 'Zone Sud-Est',
        siege: 'Lyon',
        regions: ['Auvergne-Rhône-Alpes']
      };
    }
    return {
      id: 'outre-mer',
      code: 'OM',
      name: `Zone de Défense et de Sécurité ${reg}`,
      shortName: reg,
      siege: d ? d.chefLieu : 'Chef-lieu',
      regions: [reg]
    };
  },

  // Calcul mathématique précis de distance Haversine en kilomètres
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 999;
    const R = 6371; // Rayon moyen de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  },

  // Référentiel des communes et centres-villes réels par département (centres administratifs, mairies, sous-préfectures)
  COMMUNES_PAR_DEPARTEMENT: {
    '01': [
      { nom: 'Bourg-en-Bresse', cp: '01000', lat: 46.2052, lng: 5.2258 },
      { nom: 'Oyonnax', cp: '01100', lat: 46.2575, lng: 5.6567 },
      { nom: 'Ambérieu-en-Bugey', cp: '01500', lat: 45.9583, lng: 5.3583 },
      { nom: 'Bellegarde-sur-Valserine', cp: '01200', lat: 46.1086, lng: 5.8258 },
      { nom: 'Gex', cp: '01170', lat: 46.3333, lng: 6.0583 },
      { nom: 'Miribel', cp: '01700', lat: 45.8239, lng: 4.9547 },
      { nom: 'Belley', cp: '01300', lat: 45.7597, lng: 5.6881 },
      { nom: 'Trévoux', cp: '01600', lat: 45.9408, lng: 4.7750 }
    ],
    '02': [
      { nom: 'Laon', cp: '02000', lat: 49.5641, lng: 3.6238 },
      { nom: 'Saint-Quentin', cp: '02100', lat: 49.8486, lng: 3.2864 },
      { nom: 'Soissons', cp: '02200', lat: 49.3817, lng: 3.3236 },
      { nom: 'Château-Thierry', cp: '02400', lat: 49.0467, lng: 3.4031 },
      { nom: 'Vervins', cp: '02140', lat: 49.8344, lng: 3.9086 },
      { nom: 'Chauny', cp: '02300', lat: 49.6144, lng: 3.2181 }
    ],
    '03': [
      { nom: 'Moulins', cp: '03000', lat: 46.5681, lng: 3.3328 },
      { nom: 'Montluçon', cp: '03100', lat: 46.3408, lng: 2.6033 },
      { nom: 'Vichy', cp: '03200', lat: 46.1278, lng: 3.4267 },
      { nom: 'Cusset', cp: '03300', lat: 46.1325, lng: 3.4547 },
      { nom: 'Yzeure', cp: '03400', lat: 46.5667, lng: 3.3556 }
    ],
    '04': [
      { nom: 'Digne-les-Bains', cp: '04000', lat: 44.0922, lng: 6.2361 },
      { nom: 'Manosque', cp: '04100', lat: 43.8339, lng: 5.7831 },
      { nom: 'Sisteron', cp: '04200', lat: 44.1958, lng: 5.9431 },
      { nom: 'Forcalquier', cp: '04300', lat: 43.9592, lng: 5.7806 }
    ],
    '05': [
      { nom: 'Gap', cp: '05000', lat: 44.5594, lng: 6.0797 },
      { nom: 'Briançon', cp: '05100', lat: 44.8967, lng: 6.6358 },
      { nom: 'Embrun', cp: '05200', lat: 44.5639, lng: 6.4958 },
      { nom: 'Laragne-Montéglin', cp: '05300', lat: 44.3150, lng: 5.8236 }
    ],
    '06': [
      { nom: 'Nice', cp: '06000', lat: 43.7102, lng: 7.2620 },
      { nom: 'Cannes', cp: '06400', lat: 43.5528, lng: 7.0174 },
      { nom: 'Antibes', cp: '06600', lat: 43.5808, lng: 7.1239 },
      { nom: 'Grasse', cp: '06130', lat: 43.6600, lng: 6.9239 },
      { nom: 'Cagnes-sur-Mer', cp: '06800', lat: 43.6644, lng: 7.1489 },
      { nom: 'Menton', cp: '06500', lat: 43.7745, lng: 7.4975 },
      { nom: 'Le Cannet', cp: '06110', lat: 43.5764, lng: 7.0197 },
      { nom: 'Saint-Laurent-du-Var', cp: '06700', lat: 43.6681, lng: 7.1889 }
    ],
    '07': [
      { nom: 'Privas', cp: '07000', lat: 44.7350, lng: 4.5986 },
      { nom: 'Annonay', cp: '07100', lat: 45.2403, lng: 4.6703 },
      { nom: 'Aubenas', cp: '07200', lat: 44.6206, lng: 4.3900 },
      { nom: 'Guilherand-Granges', cp: '07500', lat: 44.9333, lng: 4.8750 },
      { nom: 'Tournon-sur-Rhône', cp: '07300', lat: 45.0683, lng: 4.8322 }
    ],
    '08': [
      { nom: 'Charleville-Mézières', cp: '08000', lat: 49.7719, lng: 4.7161 },
      { nom: 'Sedan', cp: '08200', lat: 49.7028, lng: 4.9439 },
      { nom: 'Rethel', cp: '08300', lat: 49.5083, lng: 4.3667 },
      { nom: 'Givet', cp: '08600', lat: 50.1367, lng: 4.8236 },
      { nom: 'Revin', cp: '08500', lat: 49.9419, lng: 4.6397 },
      { nom: 'Vouziers', cp: '08400', lat: 49.3986, lng: 4.7014 }
    ],
    '09': [
      { nom: 'Foix', cp: '09000', lat: 42.9644, lng: 1.6053 },
      { nom: 'Pamiers', cp: '09100', lat: 43.1167, lng: 1.6111 },
      { nom: 'Saint-Girons', cp: '09200', lat: 42.9847, lng: 1.1458 },
      { nom: 'Lavelanet', cp: '09300', lat: 42.9333, lng: 1.8486 }
    ],
    '10': [
      { nom: 'Troyes', cp: '10000', lat: 48.2975, lng: 4.0744 },
      { nom: 'Romilly-sur-Seine', cp: '10100', lat: 48.5147, lng: 3.7306 },
      { nom: 'La Chapelle-Saint-Luc', cp: '10600', lat: 48.3125, lng: 4.0450 },
      { nom: 'Saint-André-les-Vergers', cp: '10120', lat: 48.2817, lng: 4.0531 },
      { nom: 'Sainte-Savine', cp: '10300', lat: 48.2944, lng: 4.0494 },
      { nom: 'Bar-sur-Aube', cp: '10200', lat: 48.2325, lng: 4.7081 }
    ],
    '11': [
      { nom: 'Carcassonne', cp: '11000', lat: 43.2130, lng: 2.3514 },
      { nom: 'Narbonne', cp: '11100', lat: 43.1839, lng: 3.0042 },
      { nom: 'Castelnaudary', cp: '11400', lat: 43.3183, lng: 1.9536 },
      { nom: 'Limoux', cp: '11300', lat: 43.0533, lng: 2.2178 },
      { nom: 'Lézignan-Corbières', cp: '11200', lat: 43.2014, lng: 2.7583 }
    ],
    '12': [
      { nom: 'Rodez', cp: '12000', lat: 44.3517, lng: 2.5750 },
      { nom: 'Millau', cp: '12100', lat: 44.0986, lng: 3.0786 },
      { nom: 'Villefranche-de-Rouergue', cp: '12200', lat: 44.3519, lng: 2.0369 },
      { nom: 'Onet-le-Château', cp: '12850', lat: 44.3644, lng: 2.5319 },
      { nom: 'Decazeville', cp: '12300', lat: 44.5583, lng: 2.2536 }
    ],
    '13': [
      { nom: 'Marseille', cp: '13001', lat: 43.2965, lng: 5.3698 },
      { nom: 'Aix-en-Provence', cp: '13100', lat: 43.5297, lng: 5.4474 },
      { nom: 'Arles', cp: '13200', lat: 43.6767, lng: 4.6308 },
      { nom: 'Martigues', cp: '13500', lat: 43.4056, lng: 5.0556 },
      { nom: 'Aubagne', cp: '13400', lat: 43.2925, lng: 5.5708 },
      { nom: 'Salon-de-Provence', cp: '13300', lat: 43.6406, lng: 5.0972 },
      { nom: 'Istres', cp: '13800', lat: 43.5147, lng: 4.9889 },
      { nom: 'La Ciotat', cp: '13600', lat: 43.1750, lng: 5.6067 },
      { nom: 'Marignane', cp: '13700', lat: 43.4167, lng: 5.2167 },
      { nom: 'Vitrolles', cp: '13127', lat: 43.4617, lng: 5.2500 }
    ],
    '14': [
      { nom: 'Caen', cp: '14000', lat: 49.1829, lng: -0.3707 },
      { nom: 'Hérouville-Saint-Clair', cp: '14200', lat: 49.2044, lng: -0.3267 },
      { nom: 'Lisieux', cp: '14100', lat: 49.1461, lng: 0.2289 },
      { nom: 'Vire Normandie', cp: '14500', lat: 48.8389, lng: -0.8906 },
      { nom: 'Bayeux', cp: '14400', lat: 49.2789, lng: -0.7036 },
      { nom: 'Honfleur', cp: '14600', lat: 49.4194, lng: 0.2333 }
    ],
    '15': [
      { nom: 'Aurillac', cp: '15000', lat: 44.9261, lng: 2.4408 },
      { nom: 'Saint-Flour', cp: '15100', lat: 45.0333, lng: 3.0889 },
      { nom: 'Arpajon-sur-Cère', cp: '15130', lat: 44.9039, lng: 2.4578 },
      { nom: 'Mauriac', cp: '15200', lat: 45.2183, lng: 2.3333 }
    ],
    '16': [
      { nom: 'Angoulême', cp: '16000', lat: 45.6484, lng: 0.1561 },
      { nom: 'Cognac', cp: '16100', lat: 45.6961, lng: -0.3275 },
      { nom: 'Soyaux', cp: '16800', lat: 45.6417, lng: 0.1983 },
      { nom: 'Ruelle-sur-Touvre', cp: '16600', lat: 45.6767, lng: 0.2217 },
      { nom: 'Confolens', cp: '16500', lat: 46.0150, lng: 0.6728 }
    ],
    '17': [
      { nom: 'La Rochelle', cp: '17000', lat: 46.1603, lng: -1.1511 },
      { nom: 'Saintes', cp: '17100', lat: 45.7464, lng: -0.6331 },
      { nom: 'Rochefort', cp: '17300', lat: 45.9431, lng: -0.9639 },
      { nom: 'Royan', cp: '17200', lat: 45.6283, lng: -1.0281 },
      { nom: 'Aytré', cp: '17440', lat: 46.1333, lng: -1.1167 }
    ],
    '18': [
      { nom: 'Bourges', cp: '18000', lat: 47.0810, lng: 2.3988 },
      { nom: 'Vierzon', cp: '18100', lat: 47.2217, lng: 2.0683 },
      { nom: 'Saint-Amand-Montrond', cp: '18200', lat: 46.7236, lng: 2.5042 },
      { nom: 'Saint-Doulchard', cp: '18230', lat: 47.1008, lng: 2.3556 }
    ],
    '19': [
      { nom: 'Tulle', cp: '19000', lat: 45.2667, lng: 1.7667 },
      { nom: 'Brive-la-Gaillarde', cp: '19100', lat: 45.1583, lng: 1.5333 },
      { nom: 'Ussel', cp: '19200', lat: 45.5486, lng: 2.3086 },
      { nom: 'Malemort', cp: '19360', lat: 45.1717, lng: 1.5647 }
    ],
    '21': [
      { nom: 'Dijon', cp: '21000', lat: 47.3220, lng: 5.0415 },
      { nom: 'Beaune', cp: '21200', lat: 47.0261, lng: 4.8389 },
      { nom: 'Chenôve', cp: '21300', lat: 47.2917, lng: 5.0069 },
      { nom: 'Talant', cp: '21240', lat: 47.3361, lng: 5.0069 },
      { nom: 'Chevigny-Saint-Sauveur', cp: '21800', lat: 47.3039, lng: 5.1311 }
    ],
    '22': [
      { nom: 'Saint-Brieuc', cp: '22000', lat: 48.5142, lng: -2.7658 },
      { nom: 'Lannion', cp: '22300', lat: 48.7328, lng: -3.4589 },
      { nom: 'Plérin', cp: '22190', lat: 48.5333, lng: -2.7667 },
      { nom: 'Lamballe-Armor', cp: '22400', lat: 48.4700, lng: -2.5167 },
      { nom: 'Dinan', cp: '22100', lat: 48.4556, lng: -2.0472 }
    ],
    '23': [
      { nom: 'Guéret', cp: '23000', lat: 46.1708, lng: 1.8708 },
      { nom: 'La Souterraine', cp: '23300', lat: 46.2375, lng: 1.4875 },
      { nom: 'Aubusson', cp: '23200', lat: 45.9575, lng: 2.1694 }
    ],
    '24': [
      { nom: 'Périgueux', cp: '24000', lat: 45.1839, lng: 0.7217 },
      { nom: 'Bergerac', cp: '24100', lat: 44.8539, lng: 0.4839 },
      { nom: 'Boulazac Isle Manoire', cp: '24750', lat: 45.1764, lng: 0.7681 },
      { nom: 'Sarlat-la-Canéda', cp: '24200', lat: 44.8889, lng: 1.2167 }
    ],
    '25': [
      { nom: 'Besançon', cp: '25000', lat: 47.2378, lng: 6.0244 },
      { nom: 'Montbéliard', cp: '25200', lat: 47.5103, lng: 6.7983 },
      { nom: 'Pontarlier', cp: '25300', lat: 46.9067, lng: 6.3550 },
      { nom: 'Audincourt', cp: '25400', lat: 47.4789, lng: 6.8406 },
      { nom: 'Valentigney', cp: '25700', lat: 47.4619, lng: 6.8331 }
    ],
    '26': [
      { nom: 'Valence', cp: '26000', lat: 44.9333, lng: 4.8917 },
      { nom: 'Montélimar', cp: '26200', lat: 44.5583, lng: 4.7508 },
      { nom: 'Romans-sur-Isère', cp: '26100', lat: 45.0456, lng: 5.0506 },
      { nom: 'Bourg-lès-Valence', cp: '26500', lat: 44.9458, lng: 4.8958 },
      { nom: 'Pierrelatte', cp: '26700', lat: 44.3778, lng: 4.6978 }
    ],
    '27': [
      { nom: 'Évreux', cp: '27000', lat: 49.0242, lng: 1.1508 },
      { nom: 'Vernon', cp: '27200', lat: 49.0917, lng: 1.4850 },
      { nom: 'Louviers', cp: '27400', lat: 49.2139, lng: 1.1681 },
      { nom: 'Val-de-Reuil', cp: '27100', lat: 49.2742, lng: 1.2106 },
      { nom: 'Bernay', cp: '27300', lat: 49.0889, lng: 0.5986 }
    ],
    '28': [
      { nom: 'Chartres', cp: '28000', lat: 48.4439, lng: 1.4889 },
      { nom: 'Dreux', cp: '28100', lat: 48.7367, lng: 1.3678 },
      { nom: 'Lucé', cp: '28110', lat: 48.4389, lng: 1.4647 },
      { nom: 'Châteaudun', cp: '28200', lat: 48.0708, lng: 1.3300 },
      { nom: 'Nogent-le-Rotrou', cp: '28400', lat: 48.3208, lng: 0.8197 }
    ],
    '29': [
      { nom: 'Brest', cp: '29200', lat: 48.3904, lng: -4.4861 },
      { nom: 'Quimper', cp: '29000', lat: 47.9961, lng: -4.1028 },
      { nom: 'Concarneau', cp: '29900', lat: 47.8764, lng: -3.9214 },
      { nom: 'Morlaix', cp: '29600', lat: 48.5778, lng: -3.8278 },
      { nom: 'Landerneau', cp: '29800', lat: 48.4508, lng: -4.2508 }
    ],
    '2A': [
      { nom: 'Ajaccio', cp: '20000', lat: 41.9267, lng: 8.7369 },
      { nom: 'Porto-Vecchio', cp: '20137', lat: 41.5911, lng: 9.2794 },
      { nom: 'Propriano', cp: '20110', lat: 41.6750, lng: 8.9042 },
      { nom: 'Sartène', cp: '20100', lat: 41.6217, lng: 8.9725 }
    ],
    '2B': [
      { nom: 'Bastia', cp: '20200', lat: 42.7028, lng: 9.4500 },
      { nom: 'Borgo', cp: '20290', lat: 42.5542, lng: 9.4267 },
      { nom: 'Corte', cp: '20250', lat: 42.3061, lng: 9.1508 },
      { nom: 'Calvi', cp: '20260', lat: 42.5686, lng: 8.7569 }
    ],
    '30': [
      { nom: 'Nîmes', cp: '30000', lat: 43.8367, lng: 4.3601 },
      { nom: 'Alès', cp: '30100', lat: 44.1281, lng: 4.0817 },
      { nom: 'Bagnols-sur-Cèze', cp: '30200', lat: 44.1625, lng: 4.6200 },
      { nom: 'Beaucaire', cp: '30300', lat: 43.8078, lng: 4.6439 },
      { nom: 'Saint-Gilles', cp: '30800', lat: 43.6767, lng: 4.4319 }
    ],
    '31': [
      { nom: 'Toulouse', cp: '31000', lat: 43.6047, lng: 1.4442 },
      { nom: 'Colomiers', cp: '31770', lat: 43.6144, lng: 1.3356 },
      { nom: 'Tournefeuille', cp: '31170', lat: 43.5850, lng: 1.3444 },
      { nom: 'Blagnac', cp: '31700', lat: 43.6361, lng: 1.3917 },
      { nom: 'Muret', cp: '31600', lat: 43.4608, lng: 1.3267 },
      { nom: 'Plaisance-du-Touch', cp: '31830', lat: 43.5658, lng: 1.2961 },
      { nom: 'Cugnaux', cp: '31270', lat: 43.5381, lng: 1.3442 },
      { nom: 'Balma', cp: '31130', lat: 43.6111, lng: 1.4989 },
      { nom: 'Saint-Gaudens', cp: '31800', lat: 43.1083, lng: 0.7236 }
    ],
    '32': [
      { nom: 'Auch', cp: '32000', lat: 43.6467, lng: 0.5858 },
      { nom: 'Condom', cp: '32100', lat: 43.9583, lng: 0.3722 },
      { nom: 'Fleurance', cp: '32500', lat: 43.8497, lng: 0.6636 },
      { nom: 'L’Isle-Jourdain', cp: '32600', lat: 43.6133, lng: 1.0811 }
    ],
    '33': [
      { nom: 'Bordeaux', cp: '33000', lat: 44.8378, lng: -0.5792 },
      { nom: 'Mérignac', cp: '33700', lat: 44.8386, lng: -0.6436 },
      { nom: 'Pessac', cp: '33600', lat: 44.8067, lng: -0.6311 },
      { nom: 'Talence', cp: '33400', lat: 44.8000, lng: -0.5847 },
      { nom: 'Villenave-d’Ornon', cp: '33140', lat: 44.7789, lng: -0.5539 },
      { nom: 'Saint-Médard-en-Jalles', cp: '33160', lat: 44.8967, lng: -0.7181 },
      { nom: 'Bègles', cp: '33130', lat: 44.8081, lng: -0.5489 },
      { nom: 'La Teste-de-Buch', cp: '33260', lat: 44.6297, lng: -1.1444 },
      { nom: 'Libourne', cp: '33500', lat: 44.9142, lng: -0.2444 },
      { nom: 'Arcachon', cp: '33120', lat: 44.6583, lng: -1.1642 }
    ],
    '34': [
      { nom: 'Montpellier', cp: '34000', lat: 43.6108, lng: 3.8767 },
      { nom: 'Béziers', cp: '34500', lat: 43.3442, lng: 3.2158 },
      { nom: 'Sète', cp: '34200', lat: 43.4078, lng: 3.6967 },
      { nom: 'Agde', cp: '34300', lat: 43.3108, lng: 3.4758 },
      { nom: 'Lunel', cp: '34400', lat: 43.6744, lng: 4.1350 },
      { nom: 'Castelnau-le-Lez', cp: '34170', lat: 43.6339, lng: 3.9000 },
      { nom: 'Frontignan', cp: '34110', lat: 43.4475, lng: 3.7553 }
    ],
    '35': [
      { nom: 'Rennes', cp: '35000', lat: 48.1173, lng: -1.6778 },
      { nom: 'Saint-Malo', cp: '35400', lat: 48.6497, lng: -2.0258 },
      { nom: 'Fougères', cp: '35300', lat: 48.3533, lng: -1.2000 },
      { nom: 'Bruz', cp: '35170', lat: 48.0242, lng: -1.7486 },
      { nom: 'Cesson-Sévigné', cp: '35510', lat: 48.1189, lng: -1.6033 },
      { nom: 'Vitré', cp: '35500', lat: 48.1250, lng: -1.2139 }
    ],
    '36': [
      { nom: 'Châteauroux', cp: '36000', lat: 46.8117, lng: 1.6917 },
      { nom: 'Issoudun', cp: '36100', lat: 46.9472, lng: 1.9936 },
      { nom: 'Déols', cp: '36130', lat: 46.8272, lng: 1.7042 },
      { nom: 'Le Blanc', cp: '36300', lat: 46.6333, lng: 1.0628 }
    ],
    '37': [
      { nom: 'Tours', cp: '37000', lat: 47.3941, lng: 0.6848 },
      { nom: 'Joué-lès-Tours', cp: '37300', lat: 47.3517, lng: 0.6622 },
      { nom: 'Saint-Cyr-sur-Loire', cp: '37540', lat: 47.4000, lng: 0.6667 },
      { nom: 'Saint-Pierre-des-Corps', cp: '37700', lat: 47.3900, lng: 0.7236 },
      { nom: 'Chinon', cp: '37500', lat: 47.1667, lng: 0.2417 },
      { nom: 'Amboise', cp: '37400', lat: 47.4128, lng: 0.9828 }
    ],
    '38': [
      { nom: 'Grenoble', cp: '38000', lat: 45.1885, lng: 5.7245 },
      { nom: 'Saint-Martin-d’Hères', cp: '38400', lat: 45.1667, lng: 5.7667 },
      { nom: 'Échirolles', cp: '38130', lat: 45.1436, lng: 5.7178 },
      { nom: 'Vienne', cp: '38200', lat: 45.5256, lng: 4.8767 },
      { nom: 'Bourgoin-Jallieu', cp: '38300', lat: 45.5861, lng: 5.2750 },
      { nom: 'Fontaine', cp: '38600', lat: 45.1931, lng: 5.6853 },
      { nom: 'Voiron', cp: '38500', lat: 45.3644, lng: 5.5897 }
    ],
    '39': [
      { nom: 'Lons-le-Saunier', cp: '39000', lat: 46.6753, lng: 5.5544 },
      { nom: 'Dole', cp: '39100', lat: 47.0931, lng: 5.4925 },
      { nom: 'Saint-Claude', cp: '39200', lat: 46.3875, lng: 5.8647 },
      { nom: 'Champagnole', cp: '39300', lat: 46.7458, lng: 5.9083 }
    ],
    '40': [
      { nom: 'Mont-de-Marsan', cp: '40000', lat: 43.8908, lng: -0.4994 },
      { nom: 'Dax', cp: '40100', lat: 43.7089, lng: -1.0536 },
      { nom: 'Biscarrosse', cp: '40600', lat: 44.3944, lng: -1.1644 },
      { nom: 'Saint-Paul-lès-Dax', cp: '40990', lat: 43.7250, lng: -1.0528 },
      { nom: 'Tarnos', cp: '40220', lat: 43.5406, lng: -1.4608 }
    ],
    '41': [
      { nom: 'Blois', cp: '41000', lat: 47.5861, lng: 1.3358 },
      { nom: 'Romorantin-Lanthenay', cp: '41200', lat: 47.3592, lng: 1.7456 },
      { nom: 'Vendôme', cp: '41100', lat: 47.7925, lng: 1.0658 },
      { nom: 'Vineuil', cp: '41350', lat: 47.5806, lng: 1.3736 }
    ],
    '42': [
      { nom: 'Saint-Étienne', cp: '42000', lat: 45.4397, lng: 4.3872 },
      { nom: 'Saint-Chamond', cp: '42400', lat: 45.4764, lng: 4.5147 },
      { nom: 'Roanne', cp: '42300', lat: 46.0367, lng: 4.0689 },
      { nom: 'Firminy', cp: '42700', lat: 45.3889, lng: 4.2872 },
      { nom: 'Montbrison', cp: '42600', lat: 45.6083, lng: 4.0650 }
    ],
    '43': [
      { nom: 'Le Puy-en-Velay', cp: '43000', lat: 45.0428, lng: 3.8853 },
      { nom: 'Monistrol-sur-Loire', cp: '43120', lat: 45.2928, lng: 4.1722 },
      { nom: 'Yssingeaux', cp: '43200', lat: 45.1436, lng: 4.1242 },
      { nom: 'Brioude', cp: '43100', lat: 45.2944, lng: 3.3847 }
    ],
    '44': [
      { nom: 'Nantes', cp: '44000', lat: 47.2184, lng: -1.5536 },
      { nom: 'Saint-Nazaire', cp: '44600', lat: 47.2736, lng: -2.2139 },
      { nom: 'Saint-Herblain', cp: '44800', lat: 47.2122, lng: -1.6500 },
      { nom: 'Rezé', cp: '44400', lat: 47.1917, lng: -1.5694 },
      { nom: 'Saint-Sébastien-sur-Loire', cp: '44230', lat: 47.2078, lng: -1.5033 },
      { nom: 'Orvault', cp: '44700', lat: 47.2717, lng: -1.6244 },
      { nom: 'Vertou', cp: '44120', lat: 47.1681, lng: -1.4722 },
      { nom: 'Châteaubriant', cp: '44110', lat: 47.7183, lng: -1.3756 }
    ],
    '45': [
      { nom: 'Orléans', cp: '45000', lat: 47.9029, lng: 1.9039 },
      { nom: 'Olivet', cp: '45160', lat: 47.8639, lng: 1.8986 },
      { nom: 'Fleury-les-Aubrais', cp: '45400', lat: 47.9306, lng: 1.9214 },
      { nom: 'Saint-Jean-de-Braye', cp: '45800', lat: 47.9133, lng: 1.9717 },
      { nom: 'Montargis', cp: '45200', lat: 47.9978, lng: 2.7333 },
      { nom: 'Gien', cp: '45500', lat: 47.6850, lng: 2.6300 }
    ],
    '46': [
      { nom: 'Cahors', cp: '46000', lat: 44.4475, lng: 1.4419 },
      { nom: 'Figeac', cp: '46100', lat: 44.6083, lng: 2.0333 },
      { nom: 'Gourdon', cp: '46300', lat: 44.7356, lng: 1.3828 }
    ],
    '47': [
      { nom: 'Agen', cp: '47000', lat: 44.2031, lng: 0.6167 },
      { nom: 'Villeneuve-sur-Lot', cp: '47300', lat: 44.4072, lng: 0.7061 },
      { nom: 'Marmande', cp: '47200', lat: 44.5000, lng: 0.1667 },
      { nom: 'Le Passage', cp: '47520', lat: 44.1989, lng: 0.6033 },
      { nom: 'Nérac', cp: '47600', lat: 44.1350, lng: 0.3400 }
    ],
    '48': [
      { nom: 'Mende', cp: '48000', lat: 44.5181, lng: 3.5000 },
      { nom: 'Marvejols', cp: '48100', lat: 44.5539, lng: 3.2917 },
      { nom: 'Florac Trois Rivières', cp: '48400', lat: 44.3250, lng: 3.5936 }
    ],
    '49': [
      { nom: 'Angers', cp: '49000', lat: 47.4784, lng: -0.5632 },
      { nom: 'Cholet', cp: '49300', lat: 47.0594, lng: -0.8783 },
      { nom: 'Saumur', cp: '49400', lat: 47.2600, lng: -0.0767 },
      { nom: 'Sèvremoine', cp: '49450', lat: 47.0989, lng: -1.0772 },
      { nom: 'Beaupréau-en-Mauges', cp: '49600', lat: 47.2028, lng: -0.9931 },
      { nom: 'Segré-en-Anjou Bleu', cp: '49500', lat: 47.6869, lng: -0.8722 }
    ],
    '50': [
      { nom: 'Cherbourg-en-Cotentin', cp: '50100', lat: 49.6339, lng: -1.6222 },
      { nom: 'Saint-Lô', cp: '50000', lat: 49.1158, lng: -1.0911 },
      { nom: 'Granville', cp: '50400', lat: 48.8389, lng: -1.5972 },
      { nom: 'Avranches', cp: '50300', lat: 48.6867, lng: -1.3589 },
      { nom: 'Coutances', cp: '50200', lat: 49.0469, lng: -1.4442 }
    ],
    '51': [
      { nom: 'Reims', cp: '51100', lat: 49.2583, lng: 4.0317 },
      { nom: 'Châlons-en-Champagne', cp: '51000', lat: 48.9567, lng: 4.3644 },
      { nom: 'Épernay', cp: '51200', lat: 49.0436, lng: 3.9556 },
      { nom: 'Vitry-le-François', cp: '51300', lat: 48.7250, lng: 4.5861 },
      { nom: 'Tinqueux', cp: '51430', lat: 49.2508, lng: 3.9931 }
    ],
    '52': [
      { nom: 'Saint-Dizier', cp: '52100', lat: 48.6381, lng: 4.9497 },
      { nom: 'Chaumont', cp: '52000', lat: 48.1117, lng: 5.1408 },
      { nom: 'Langres', cp: '52200', lat: 47.8631, lng: 5.3339 }
    ],
    '53': [
      { nom: 'Laval', cp: '53000', lat: 48.0733, lng: -0.7689 },
      { nom: 'Mayenne', cp: '53100', lat: 48.3039, lng: -0.6189 },
      { nom: 'Château-Gontier-sur-Mayenne', cp: '53200', lat: 47.8289, lng: -0.7042 }
    ],
    '54': [
      { nom: 'Nancy', cp: '54000', lat: 48.6921, lng: 6.1844 },
      { nom: 'Vandœuvre-lès-Nancy', cp: '54500', lat: 48.6578, lng: 6.1731 },
      { nom: 'Lunéville', cp: '54300', lat: 48.5917, lng: 6.4917 },
      { nom: 'Toul', cp: '54200', lat: 48.6750, lng: 5.8917 },
      { nom: 'Pont-à-Mousson', cp: '54700', lat: 48.9036, lng: 6.0547 },
      { nom: 'Laxou', cp: '54520', lat: 48.6869, lng: 6.1486 },
      { nom: 'Villers-lès-Nancy', cp: '54600', lat: 48.6722, lng: 6.1542 },
      { nom: 'Saint-Max', cp: '54130', lat: 48.7011, lng: 6.2056 },
      { nom: 'Jarville-la-Malgrange', cp: '54140', lat: 48.6697, lng: 6.2069 },
      { nom: 'Maxéville', cp: '54320', lat: 48.7119, lng: 6.1628 },
      { nom: 'Dombasle-sur-Meurthe', cp: '54110', lat: 48.6250, lng: 6.3500 },
      { nom: 'Longwy', cp: '54400', lat: 49.5200, lng: 5.7600 },
      { nom: 'Villerupt', cp: '54190', lat: 49.4689, lng: 5.9286 },
      { nom: 'Neuves-Maisons', cp: '54230', lat: 48.6167, lng: 6.1167 },
      { nom: 'Essey-lès-Nancy', cp: '54270', lat: 48.7078, lng: 6.2222 },
      { nom: 'Heillecourt', cp: '54180', lat: 48.6528, lng: 6.1958 },
      { nom: 'Saint-Nicolas-de-Port', cp: '54210', lat: 48.6319, lng: 6.3014 },
      { nom: 'Baccarat', cp: '54120', lat: 48.4489, lng: 6.7381 },
      { nom: 'Briey', cp: '54150', lat: 49.2486, lng: 5.9400 },
      { nom: 'Jarny', cp: '54800', lat: 49.1578, lng: 5.8778 }
    ],
    '55': [
      { nom: 'Verdun', cp: '55100', lat: 49.1600, lng: 5.3878 },
      { nom: 'Bar-le-Duc', cp: '55000', lat: 48.7739, lng: 5.1606 },
      { nom: 'Commercy', cp: '55200', lat: 48.7633, lng: 5.5925 },
      { nom: 'Saint-Mihiel', cp: '55300', lat: 48.8894, lng: 5.5414 },
      { nom: 'Ligny-en-Barrois', cp: '55500', lat: 48.6917, lng: 5.3228 }
    ],
    '56': [
      { nom: 'Lorient', cp: '56100', lat: 47.7483, lng: -3.3667 },
      { nom: 'Vannes', cp: '56000', lat: 47.6586, lng: -2.7594 },
      { nom: 'Lanester', cp: '56600', lat: 47.7633, lng: -3.3444 },
      { nom: 'Ploemeur', cp: '56270', lat: 47.7333, lng: -3.4278 },
      { nom: 'Pontivy', cp: '56300', lat: 48.0667, lng: -2.9667 },
      { nom: 'Auray', cp: '56400', lat: 47.6667, lng: -2.9833 }
    ],
    '57': [
      { nom: 'Metz', cp: '57000', lat: 49.1193, lng: 6.1757 },
      { nom: 'Thionville', cp: '57100', lat: 49.3589, lng: 6.1681 },
      { nom: 'Montigny-lès-Metz', cp: '57950', lat: 49.1000, lng: 6.1528 },
      { nom: 'Sarreguemines', cp: '57200', lat: 49.1103, lng: 7.0694 },
      { nom: 'Forbach', cp: '57600', lat: 49.1867, lng: 6.9000 },
      { nom: 'Saint-Avold', cp: '57500', lat: 49.1039, lng: 6.7083 },
      { nom: 'Yutz', cp: '57970', lat: 49.3564, lng: 6.1889 },
      { nom: 'Hayange', cp: '57700', lat: 49.2936, lng: 6.0617 }
    ],
    '58': [
      { nom: 'Nevers', cp: '58000', lat: 46.9908, lng: 3.1583 },
      { nom: 'Cosne-Cours-sur-Loire', cp: '58200', lat: 47.4100, lng: 2.9250 },
      { nom: 'Varennes-Vauzelles', cp: '58640', lat: 47.0125, lng: 3.1472 },
      { nom: 'Decize', cp: '58300', lat: 46.8286, lng: 3.4611 },
      { nom: 'Clamecy', cp: '58500', lat: 47.4600, lng: 3.5186 }
    ],
    '59': [
      { nom: 'Lille', cp: '59000', lat: 50.6292, lng: 3.0573 },
      { nom: 'Roubaix', cp: '59100', lat: 50.6928, lng: 3.1781 },
      { nom: 'Tourcoing', cp: '59200', lat: 50.7239, lng: 3.1611 },
      { nom: 'Dunkerque', cp: '59140', lat: 51.0344, lng: 2.3768 },
      { nom: 'Villeneuve-d’Ascq', cp: '59650', lat: 50.6231, lng: 3.1481 },
      { nom: 'Valenciennes', cp: '59300', lat: 50.3581, lng: 3.5233 },
      { nom: 'Douai', cp: '59500', lat: 50.3714, lng: 3.0789 },
      { nom: 'Wattrelos', cp: '59150', lat: 50.7008, lng: 3.2181 },
      { nom: 'Marcq-en-Barœul', cp: '59700', lat: 50.6711, lng: 3.0972 },
      { nom: 'Cambrai', cp: '59400', lat: 50.1764, lng: 3.2356 }
    ],
    '60': [
      { nom: 'Beauvais', cp: '60000', lat: 49.4294, lng: 2.0811 },
      { nom: 'Compiègne', cp: '60200', lat: 49.4178, lng: 2.8261 },
      { nom: 'Creil', cp: '60100', lat: 49.2583, lng: 2.4833 },
      { nom: 'Nogent-sur-Oise', cp: '60180', lat: 49.2747, lng: 2.4681 },
      { nom: 'Senlis', cp: '60300', lat: 49.2069, lng: 2.5847 },
      { nom: 'Clermont', cp: '60600', lat: 49.3789, lng: 2.4136 }
    ],
    '61': [
      { nom: 'Alençon', cp: '61000', lat: 48.4328, lng: 0.0917 },
      { nom: 'Flers', cp: '61100', lat: 48.7483, lng: -0.5694 },
      { nom: 'Argentan', cp: '61200', lat: 48.7439, lng: -0.0189 },
      { nom: 'L’Aigle', cp: '61300', lat: 48.7644, lng: 0.6272 }
    ],
    '62': [
      { nom: 'Calais', cp: '62100', lat: 50.9581, lng: 1.8525 },
      { nom: 'Boulogne-sur-Mer', cp: '62200', lat: 50.7258, lng: 1.6133 },
      { nom: 'Arras', cp: '62000', lat: 50.2917, lng: 2.7778 },
      { nom: 'Lens', cp: '62300', lat: 50.4322, lng: 2.8333 },
      { nom: 'Liévin', cp: '62800', lat: 50.4217, lng: 2.7781 },
      { nom: 'Hénin-Beaumont', cp: '62110', lat: 50.4214, lng: 2.9500 },
      { nom: 'Béthune', cp: '62400', lat: 50.5303, lng: 2.6408 }
    ],
    '63': [
      { nom: 'Clermont-Ferrand', cp: '63000', lat: 45.7772, lng: 3.0870 },
      { nom: 'Cournon-d’Auvergne', cp: '63800', lat: 45.7417, lng: 3.1972 },
      { nom: 'Riom', cp: '63200', lat: 45.8931, lng: 3.1136 },
      { nom: 'Chamalières', cp: '63400', lat: 45.7750, lng: 3.0667 },
      { nom: 'Issoire', cp: '63500', lat: 45.5439, lng: 3.2500 },
      { nom: 'Thiers', cp: '63300', lat: 45.8567, lng: 3.5481 }
    ],
    '64': [
      { nom: 'Pau', cp: '64000', lat: 43.2951, lng: -0.3708 },
      { nom: 'Bayonne', cp: '64100', lat: 43.4933, lng: -1.4750 },
      { nom: 'Anglet', cp: '64600', lat: 43.4833, lng: -1.5167 },
      { nom: 'Biarritz', cp: '64200', lat: 43.4831, lng: -1.5586 },
      { nom: 'Hendaye', cp: '64700', lat: 43.3597, lng: -1.7744 },
      { nom: 'Saint-Jean-de-Luz', cp: '64500', lat: 43.3889, lng: -1.6625 }
    ],
    '65': [
      { nom: 'Tarbes', cp: '65000', lat: 43.2333, lng: 0.0833 },
      { nom: 'Lourdes', cp: '65100', lat: 43.0947, lng: -0.0461 },
      { nom: 'Aureilhan', cp: '65800', lat: 43.2436, lng: 0.0967 },
      { nom: 'Bagnères-de-Bigorre', cp: '65200', lat: 43.0647, lng: 0.1492 }
    ],
    '66': [
      { nom: 'Perpignan', cp: '66000', lat: 42.6986, lng: 2.8956 },
      { nom: 'Canet-en-Roussillon', cp: '66140', lat: 42.7056, lng: 3.0078 },
      { nom: 'Saint-Estève', cp: '66240', lat: 42.7139, lng: 2.8428 },
      { nom: 'Saint-Cyprien', cp: '66750', lat: 42.6181, lng: 3.0044 },
      { nom: 'Argelès-sur-Mer', cp: '66700', lat: 42.5467, lng: 3.0236 }
    ],
    '67': [
      { nom: 'Strasbourg', cp: '67000', lat: 48.5734, lng: 7.7521 },
      { nom: 'Haguenau', cp: '67500', lat: 48.8156, lng: 7.7889 },
      { nom: 'Schiltigheim', cp: '67300', lat: 48.6083, lng: 7.7497 },
      { nom: 'Illkirch-Graffenstaden', cp: '67400', lat: 48.5289, lng: 7.7144 },
      { nom: 'Sélestat', cp: '67600', lat: 48.2597, lng: 7.4539 },
      { nom: 'Lingolsheim', cp: '67380', lat: 48.5556, lng: 7.6833 },
      { nom: 'Bischheim', cp: '67800', lat: 48.6142, lng: 7.7517 },
      { nom: 'Saverne', cp: '67700', lat: 48.7408, lng: 7.3622 },
      { nom: 'Obernai', cp: '67210', lat: 48.4619, lng: 7.4819 }
    ],
    '68': [
      { nom: 'Mulhouse', cp: '68100', lat: 47.7508, lng: 7.3359 },
      { nom: 'Colmar', cp: '68000', lat: 48.0794, lng: 7.3582 },
      { nom: 'Saint-Louis', cp: '68300', lat: 47.5881, lng: 7.5636 },
      { nom: 'Illzach', cp: '68110', lat: 47.7817, lng: 7.3500 },
      { nom: 'Wittenheim', cp: '68270', lat: 47.8078, lng: 7.3364 },
      { nom: 'Rixheim', cp: '68170', lat: 47.7444, lng: 7.3972 },
      { nom: 'Guebwiller', cp: '68500', lat: 47.9078, lng: 7.2144 }
    ],
    '69': [
      { nom: 'Lyon', cp: '69001', lat: 45.7640, lng: 4.8357 },
      { nom: 'Villeurbanne', cp: '69100', lat: 45.7667, lng: 4.8803 },
      { nom: 'Vénissieux', cp: '69200', lat: 45.6981, lng: 4.8864 },
      { nom: 'Vaulx-en-Velin', cp: '69120', lat: 45.7878, lng: 4.9250 },
      { nom: 'Saint-Priest', cp: '69800', lat: 45.6972, lng: 4.9444 },
      { nom: 'Caluire-et-Cuire', cp: '69300', lat: 45.7989, lng: 4.8478 },
      { nom: 'Bron', cp: '69500', lat: 45.7333, lng: 4.9125 },
      { nom: 'Villefranche-sur-Saône', cp: '69400', lat: 45.9903, lng: 4.7189 },
      { nom: 'Meyzieu', cp: '69330', lat: 45.7667, lng: 5.0042 },
      { nom: 'Rillieux-la-Pape', cp: '69140', lat: 45.8208, lng: 4.8986 }
    ],
    '70': [
      { nom: 'Vesoul', cp: '70000', lat: 47.6231, lng: 6.1558 },
      { nom: 'Héricourt', cp: '70400', lat: 47.5786, lng: 6.7606 },
      { nom: 'Lure', cp: '70200', lat: 47.6833, lng: 6.4950 },
      { nom: 'Luxeuil-les-Bains', cp: '70300', lat: 47.8178, lng: 6.3800 },
      { nom: 'Gray', cp: '70100', lat: 47.4447, lng: 5.5925 }
    ],
    '71': [
      { nom: 'Chalon-sur-Saône', cp: '71100', lat: 46.7806, lng: 4.8528 },
      { nom: 'Mâcon', cp: '71000', lat: 46.3069, lng: 4.8286 },
      { nom: 'Le Creusot', cp: '71200', lat: 46.8058, lng: 4.4319 },
      { nom: 'Montceau-les-Mines', cp: '71300', lat: 46.6667, lng: 4.3644 },
      { nom: 'Autun', cp: '71400', lat: 46.9514, lng: 4.2986 }
    ],
    '72': [
      { nom: 'Le Mans', cp: '72000', lat: 48.0061, lng: 0.1996 },
      { nom: 'La Flèche', cp: '72200', lat: 47.6989, lng: -0.0767 },
      { nom: 'Sablé-sur-Sarthe', cp: '72300', lat: 47.8400, lng: -0.3347 },
      { nom: 'Allonnes', cp: '72700', lat: 47.9694, lng: 0.1589 },
      { nom: 'Mamers', cp: '72600', lat: 48.3500, lng: 0.3667 }
    ],
    '73': [
      { nom: 'Chambéry', cp: '73000', lat: 45.5663, lng: 5.9208 },
      { nom: 'Aix-les-Bains', cp: '73100', lat: 45.6886, lng: 5.9150 },
      { nom: 'Albertville', cp: '73200', lat: 45.6756, lng: 6.3928 },
      { nom: 'La Motte-Servolex', cp: '73290', lat: 45.5969, lng: 5.8778 },
      { nom: 'Saint-Jean-de-Maurienne', cp: '73300', lat: 45.2764, lng: 6.3458 }
    ],
    '74': [
      { nom: 'Annecy', cp: '74000', lat: 45.8992, lng: 6.1294 },
      { nom: 'Thonon-les-Bains', cp: '74200', lat: 46.3708, lng: 6.4800 },
      { nom: 'Annemasse', cp: '74100', lat: 46.1958, lng: 6.2361 },
      { nom: 'Cluses', cp: '74300', lat: 46.0600, lng: 6.5786 },
      { nom: 'Sallanches', cp: '74700', lat: 45.9372, lng: 6.6300 },
      { nom: 'Chamonix-Mont-Blanc', cp: '74400', lat: 45.9237, lng: 6.8694 }
    ],
    '75': [
      { nom: 'Paris (1er Louvre)', cp: '75001', lat: 48.8606, lng: 2.3376 },
      { nom: 'Paris (4e Hôtel de Ville)', cp: '75004', lat: 48.8566, lng: 2.3522 },
      { nom: 'Paris (5e Panthéon)', cp: '75005', lat: 48.8462, lng: 2.3444 },
      { nom: 'Paris (8e Élysée)', cp: '75008', lat: 48.8722, lng: 2.3125 },
      { nom: 'Paris (11e Bastille / Voltaire)', cp: '75011', lat: 48.8592, lng: 2.3789 },
      { nom: 'Paris (12e Reuilly / Gare de Lyon)', cp: '75012', lat: 48.8412, lng: 2.3878 },
      { nom: 'Paris (13e Gobelins / Italie)', cp: '75013', lat: 48.8322, lng: 2.3561 },
      { nom: 'Paris (14e Montparnasse)', cp: '75014', lat: 48.8331, lng: 2.3272 },
      { nom: 'Paris (15e Vaugirard)', cp: '75015', lat: 48.8414, lng: 2.3000 },
      { nom: 'Paris (17e Batignolles)', cp: '75017', lat: 48.8836, lng: 2.3219 },
      { nom: 'Paris (18e Montmartre)', cp: '75018', lat: 48.8925, lng: 2.3444 },
      { nom: 'Paris (19e Buttes-Chaumont)', cp: '75019', lat: 48.8828, lng: 2.3822 },
      { nom: 'Paris (20e Ménilmontant)', cp: '75020', lat: 48.8631, lng: 2.3986 }
    ],
    '76': [
      { nom: 'Le Havre', cp: '76600', lat: 49.4944, lng: 0.1078 },
      { nom: 'Rouen', cp: '76000', lat: 49.4431, lng: 1.0993 },
      { nom: 'Sotteville-lès-Rouen', cp: '76300', lat: 49.4089, lng: 1.0911 },
      { nom: 'Saint-Étienne-du-Rouvray', cp: '76800', lat: 49.3781, lng: 1.1044 },
      { nom: 'Dieppe', cp: '76200', lat: 49.9242, lng: 1.0775 },
      { nom: 'Le Grand-Quevilly', cp: '76120', lat: 49.4056, lng: 1.0528 }
    ],
    '77': [
      { nom: 'Chelles', cp: '77500', lat: 48.8814, lng: 2.5936 },
      { nom: 'Meaux', cp: '77100', lat: 48.9603, lng: 2.8883 },
      { nom: 'Melun', cp: '77000', lat: 48.5414, lng: 2.6606 },
      { nom: 'Pontault-Combault', cp: '77340', lat: 48.8033, lng: 2.6075 },
      { nom: 'Savigny-le-Temple', cp: '77176', lat: 48.5833, lng: 2.5833 },
      { nom: 'Torcy', cp: '77200', lat: 48.8508, lng: 2.6506 },
      { nom: 'Fontainebleau', cp: '77300', lat: 48.4083, lng: 2.7014 }
    ],
    '78': [
      { nom: 'Versailles', cp: '78000', lat: 48.8014, lng: 2.1306 },
      { nom: 'Sartrouville', cp: '78500', lat: 48.9417, lng: 2.1644 },
      { nom: 'Saint-Germain-en-Laye', cp: '78100', lat: 48.9000, lng: 2.0917 },
      { nom: 'Mantes-la-Jolie', cp: '78200', lat: 48.9908, lng: 1.7175 },
      { nom: 'Poissy', cp: '78300', lat: 48.9297, lng: 2.0464 },
      { nom: 'Conflans-Sainte-Honorine', cp: '78700', lat: 48.9989, lng: 2.0967 },
      { nom: 'Trappes', cp: '78190', lat: 48.7767, lng: 2.0028 },
      { nom: 'Rambouillet', cp: '78120', lat: 48.6444, lng: 1.8317 }
    ],
    '79': [
      { nom: 'Niort', cp: '79000', lat: 46.3236, lng: -0.4589 },
      { nom: 'Bressuire', cp: '79300', lat: 46.8406, lng: -0.4939 },
      { nom: 'Parthenay', cp: '79200', lat: 46.6475, lng: -0.2472 },
      { nom: 'Thouars', cp: '79100', lat: 46.9744, lng: -0.2147 }
    ],
    '80': [
      { nom: 'Amiens', cp: '80000', lat: 49.8941, lng: 2.2958 },
      { nom: 'Abbeville', cp: '80100', lat: 50.1056, lng: 1.8361 },
      { nom: 'Péronne', cp: '80200', lat: 49.9325, lng: 2.9350 },
      { nom: 'Albert', cp: '80300', lat: 50.0033, lng: 2.6517 },
      { nom: 'Montdidier', cp: '80500', lat: 49.6481, lng: 2.5694 }
    ],
    '81': [
      { nom: 'Albi', cp: '81000', lat: 43.9289, lng: 2.1464 },
      { nom: 'Castres', cp: '81100', lat: 43.6067, lng: 2.2400 },
      { nom: 'Gaillac', cp: '81600', lat: 43.9000, lng: 1.8972 },
      { nom: 'Graulhet', cp: '81300', lat: 43.7611, lng: 1.9897 },
      { nom: 'Mazamet', cp: '81200', lat: 43.4897, lng: 2.3742 }
    ],
    '82': [
      { nom: 'Montauban', cp: '82000', lat: 44.0175, lng: 1.3550 },
      { nom: 'Castelsarrasin', cp: '82100', lat: 44.0397, lng: 1.1075 },
      { nom: 'Moissac', cp: '82200', lat: 44.1042, lng: 1.0847 },
      { nom: 'Caussade', cp: '82300', lat: 44.1611, lng: 1.5369 }
    ],
    '83': [
      { nom: 'Toulon', cp: '83000', lat: 43.1242, lng: 5.9280 },
      { nom: 'La Seyne-sur-Mer', cp: '83500', lat: 43.1000, lng: 5.8833 },
      { nom: 'Hyères', cp: '83400', lat: 43.1206, lng: 6.1286 },
      { nom: 'Fréjus', cp: '83600', lat: 43.4331, lng: 6.7369 },
      { nom: 'Draguignan', cp: '83300', lat: 43.5389, lng: 6.4667 },
      { nom: 'Saint-Raphaël', cp: '83700', lat: 43.4253, lng: 6.7686 },
      { nom: 'Six-Fours-les-Plages', cp: '83140', lat: 43.1056, lng: 5.8406 },
      { nom: 'Brignoles', cp: '83170', lat: 43.4056, lng: 6.0617 }
    ],
    '84': [
      { nom: 'Avignon', cp: '84000', lat: 43.9493, lng: 4.8055 },
      { nom: 'Orange', cp: '84100', lat: 44.1381, lng: 4.8081 },
      { nom: 'Carpentras', cp: '84200', lat: 44.0558, lng: 5.0489 },
      { nom: 'Cavaillon', cp: '84300', lat: 43.8378, lng: 5.0378 },
      { nom: 'Pertuis', cp: '84120', lat: 43.6939, lng: 5.5039 }
    ],
    '85': [
      { nom: 'La Roche-sur-Yon', cp: '85000', lat: 46.6705, lng: -1.4260 },
      { nom: 'Les Sables-d’Olonne', cp: '85100', lat: 46.4967, lng: -1.7833 },
      { nom: 'Challans', cp: '85300', lat: 46.8436, lng: -1.8736 },
      { nom: 'Montaigu-Vendée', cp: '85600', lat: 46.9744, lng: -1.3142 },
      { nom: 'Fontenay-le-Comte', cp: '85200', lat: 46.4667, lng: -0.8000 }
    ],
    '86': [
      { nom: 'Poitiers', cp: '86000', lat: 46.5802, lng: 0.3404 },
      { nom: 'Châtellerault', cp: '86100', lat: 46.8178, lng: 0.5444 },
      { nom: 'Buxerolles', cp: '86180', lat: 46.5986, lng: 0.3547 },
      { nom: 'Saint-Benoît', cp: '86280', lat: 46.5494, lng: 0.3425 },
      { nom: 'Montmorillon', cp: '86500', lat: 46.4264, lng: 0.8694 }
    ],
    '87': [
      { nom: 'Limoges', cp: '87000', lat: 45.8336, lng: 1.2611 },
      { nom: 'Saint-Junien', cp: '87200', lat: 45.8889, lng: 0.9028 },
      { nom: 'Panazol', cp: '87350', lat: 45.8389, lng: 1.3106 },
      { nom: 'Couzeix', cp: '87270', lat: 45.8744, lng: 1.2400 },
      { nom: 'Bellac', cp: '87300', lat: 46.1219, lng: 1.0494 }
    ],
    '88': [
      { nom: 'Épinal', cp: '88000', lat: 48.1744, lng: 6.4511 },
      { nom: 'Saint-Dié-des-Vosges', cp: '88100', lat: 48.2858, lng: 6.9483 },
      { nom: 'Gérardmer', cp: '88400', lat: 48.0722, lng: 6.8789 },
      { nom: 'Golbey', cp: '88190', lat: 48.1958, lng: 6.4389 },
      { nom: 'Remiremont', cp: '88200', lat: 48.0167, lng: 6.5917 },
      { nom: 'Neufchâteau', cp: '88300', lat: 48.3556, lng: 5.6961 }
    ],
    '89': [
      { nom: 'Auxerre', cp: '89000', lat: 47.7986, lng: 3.5672 },
      { nom: 'Sens', cp: '89100', lat: 48.1983, lng: 3.2831 },
      { nom: 'Joigny', cp: '89300', lat: 47.9819, lng: 3.3986 },
      { nom: 'Avallon', cp: '89200', lat: 47.4917, lng: 3.9083 }
    ],
    '90': [
      { nom: 'Belfort', cp: '90000', lat: 47.6397, lng: 6.8638 },
      { nom: 'Delle', cp: '90100', lat: 47.5069, lng: 6.9986 },
      { nom: 'Valdoie', cp: '90300', lat: 47.6681, lng: 6.8417 },
      { nom: 'Beaucourt', cp: '90500', lat: 47.4858, lng: 6.9250 }
    ],
    '91': [
      { nom: 'Évry-Courcouronnes', cp: '91000', lat: 48.6239, lng: 2.4486 },
      { nom: 'Corbeil-Essonnes', cp: '91100', lat: 48.6139, lng: 2.4828 },
      { nom: 'Massy', cp: '91300', lat: 48.7308, lng: 2.2714 },
      { nom: 'Savigny-sur-Orge', cp: '91600', lat: 48.6797, lng: 2.3522 },
      { nom: 'Sainte-Geneviève-des-Bois', cp: '91700', lat: 48.6414, lng: 2.3275 },
      { nom: 'Palaiseau', cp: '91120', lat: 48.7144, lng: 2.2458 },
      { nom: 'Athis-Mons', cp: '91200', lat: 48.7083, lng: 2.3894 },
      { nom: 'Étampes', cp: '91150', lat: 48.4350, lng: 2.1625 }
    ],
    '92': [
      { nom: 'Boulogne-Billancourt', cp: '92100', lat: 48.8353, lng: 2.2408 },
      { nom: 'Nanterre', cp: '92000', lat: 48.8925, lng: 2.2069 },
      { nom: 'Asnières-sur-Seine', cp: '92600', lat: 48.9108, lng: 2.2878 },
      { nom: 'Colombes', cp: '92700', lat: 48.9228, lng: 2.2536 },
      { nom: 'Courbevoie', cp: '92400', lat: 48.8978, lng: 2.2567 },
      { nom: 'Rueil-Malmaison', cp: '92500', lat: 48.8778, lng: 2.1811 },
      { nom: 'Issy-les-Moulineaux', cp: '92130', lat: 48.8239, lng: 2.2700 },
      { nom: 'Levallois-Perret', cp: '92300', lat: 48.8936, lng: 2.2878 },
      { nom: 'Antony', cp: '92160', lat: 48.7539, lng: 2.2975 },
      { nom: 'Neuilly-sur-Seine', cp: '92200', lat: 48.8847, lng: 2.2686 }
    ],
    '93': [
      { nom: 'Saint-Denis', cp: '93200', lat: 48.9356, lng: 2.3539 },
      { nom: 'Montreuil', cp: '93100', lat: 48.8622, lng: 2.4419 },
      { nom: 'Aubervilliers', cp: '93300', lat: 48.9144, lng: 2.3833 },
      { nom: 'Aulnay-sous-Bois', cp: '93600', lat: 48.9386, lng: 2.4939 },
      { nom: 'Drancy', cp: '93700', lat: 48.9239, lng: 2.4450 },
      { nom: 'Noisy-le-Grand', cp: '93160', lat: 48.8486, lng: 2.5528 },
      { nom: 'Pantin', cp: '93500', lat: 48.8958, lng: 2.4089 },
      { nom: 'Bobigny', cp: '93000', lat: 48.9086, lng: 2.4397 },
      { nom: 'Bondy', cp: '93140', lat: 48.9022, lng: 2.4831 }
    ],
    '94': [
      { nom: 'Créteil', cp: '94000', lat: 48.7903, lng: 2.4556 },
      { nom: 'Vitry-sur-Seine', cp: '94400', lat: 48.7875, lng: 2.3928 },
      { nom: 'Champigny-sur-Marne', cp: '94500', lat: 48.8172, lng: 2.5156 },
      { nom: 'Saint-Maur-des-Fossés', cp: '94100', lat: 48.8033, lng: 2.4864 },
      { nom: 'Ivry-sur-Seine', cp: '94200', lat: 48.8156, lng: 2.3847 },
      { nom: 'Villejuif', cp: '94800', lat: 48.7917, lng: 2.3628 },
      { nom: 'Maisons-Alfort', cp: '94700', lat: 48.8056, lng: 2.4378 },
      { nom: 'Fontenay-sous-Bois', cp: '94120', lat: 48.8514, lng: 2.4764 },
      { nom: 'Vincennes', cp: '94300', lat: 48.8478, lng: 2.4394 },
      { nom: 'Alfortville', cp: '94140', lat: 48.7986, lng: 2.4219 }
    ],
    '95': [
      { nom: 'Argenteuil', cp: '95100', lat: 48.9478, lng: 2.2472 },
      { nom: 'Cergy', cp: '95000', lat: 49.0361, lng: 2.0631 },
      { nom: 'Sarcelles', cp: '95200', lat: 48.9958, lng: 2.3783 },
      { nom: 'Garges-lès-Gonesse', cp: '95140', lat: 48.9719, lng: 2.4000 },
      { nom: 'Franconville', cp: '95130', lat: 48.9889, lng: 2.2306 },
      { nom: 'Pontoise', cp: '95300', lat: 49.0514, lng: 2.1008 },
      { nom: 'Goussainville', cp: '95190', lat: 49.0319, lng: 2.4744 },
      { nom: 'Bezons', cp: '95870', lat: 48.9264, lng: 2.2178 }
    ],
    '971': [
      { nom: 'Les Abymes', cp: '97139', lat: 16.2700, lng: -61.5050 },
      { nom: 'Baie-Mahault', cp: '97122', lat: 16.2678, lng: -61.5878 },
      { nom: 'Le Gosier', cp: '97190', lat: 16.2064, lng: -61.4931 },
      { nom: 'Sainte-Anne', cp: '97180', lat: 16.2253, lng: -61.3858 },
      { nom: 'Pointe-à-Pitre', cp: '97110', lat: 16.2411, lng: -61.5331 },
      { nom: 'Basse-Terre', cp: '97100', lat: 15.9986, lng: -61.7256 }
    ],
    '972': [
      { nom: 'Fort-de-France', cp: '97200', lat: 14.6089, lng: -61.0733 },
      { nom: 'Le Lamentin', cp: '97232', lat: 14.6156, lng: -61.0022 },
      { nom: 'Le Robert', cp: '97231', lat: 14.6775, lng: -60.9397 },
      { nom: 'Schoelcher', cp: '97233', lat: 14.6167, lng: -61.1000 },
      { nom: 'Ducos', cp: '97224', lat: 14.5750, lng: -60.9750 }
    ],
    '973': [
      { nom: 'Cayenne', cp: '97300', lat: 4.9372, lng: -52.3261 },
      { nom: 'Saint-Laurent-du-Maroni', cp: '97320', lat: 5.5011, lng: -54.0294 },
      { nom: 'Matoury', cp: '97351', lat: 4.8475, lng: -52.3314 },
      { nom: 'Kourou', cp: '97310', lat: 5.1597, lng: -52.6503 },
      { nom: 'Remire-Montjoly', cp: '97354', lat: 4.9050, lng: -52.2764 }
    ],
    '974': [
      { nom: 'Saint-Denis', cp: '97400', lat: -20.8789, lng: 55.4481 },
      { nom: 'Saint-Paul', cp: '97460', lat: -21.0097, lng: 55.2708 },
      { nom: 'Saint-Pierre', cp: '97410', lat: -21.3394, lng: 55.4781 },
      { nom: 'Le Tampon', cp: '97430', lat: -21.2781, lng: 55.5181 },
      { nom: 'Saint-André', cp: '97440', lat: -20.9631, lng: 55.6500 }
    ],
    '976': [
      { nom: 'Mamoudzou', cp: '97600', lat: -12.7806, lng: 45.2278 },
      { nom: 'Koungou', cp: '97600', lat: -12.7333, lng: 45.2000 },
      { nom: 'Dzaoudzi', cp: '97615', lat: -12.7889, lng: 45.2722 },
      { nom: 'Dembeni', cp: '97660', lat: -12.8436, lng: 45.1847 }
    ]
  },

  // Récupère la liste officielle des communes d'un département donné
  getCommunesForDepartment(deptCode) {
    if (!deptCode) return [];
    const cleanCode = String(deptCode).trim().toUpperCase();
    const normalized = cleanCode.length === 1 ? '0' + cleanCode : cleanCode;
    
    // Si la liste pré-remplie existe, la renvoyer
    if (this.COMMUNES_PAR_DEPARTEMENT[normalized] && this.COMMUNES_PAR_DEPARTEMENT[normalized].length > 0) {
      return this.COMMUNES_PAR_DEPARTEMENT[normalized];
    }

    // Sinon, créer une liste procédurale basée sur le département et son chef-lieu
    const d = this.getByCode(normalized);
    if (!d) return [];

    const baseCpPrefix = normalized.length === 3 ? normalized : (normalized.padStart(2, '0') + '0');
    const result = [
      { nom: d.chefLieu, cp: `${baseCpPrefix}00`, lat: d.lat, lng: d.lng }
    ];

    // Ajouter des communes réalistes périphériques dans la bounding box officielle
    const offsets = [
      { nom: `${d.name} Centre-Nord`, cp: `${baseCpPrefix}10`, dlat: 0.12, dlng: 0.05 },
      { nom: `${d.name} Sud-Est`, cp: `${baseCpPrefix}20`, dlat: -0.15, dlng: 0.14 },
      { nom: `${d.name} Ouest`, cp: `${baseCpPrefix}30`, dlat: 0.04, dlng: -0.18 },
      { nom: `${d.name} Val / Plaine`, cp: `${baseCpPrefix}40`, dlat: -0.08, dlng: -0.12 },
      { nom: `${d.name} Agglomération`, cp: `${baseCpPrefix}50`, dlat: 0.16, dlng: -0.06 }
    ];

    offsets.forEach(off => {
      let lat = d.lat + off.dlat;
      let lng = d.lng + off.dlng;
      if (d.bbox) {
        lat = Math.max(d.bbox[0] + 0.02, Math.min(d.bbox[2] - 0.02, lat));
        lng = Math.max(d.bbox[1] + 0.02, Math.min(d.bbox[3] - 0.02, lng));
      }
      result.push({
        nom: off.nom,
        cp: off.cp,
        lat: parseFloat(lat.toFixed(4)),
        lng: parseFloat(lng.toFixed(4))
      });
    });

    return result;
  }
};

// Alias de rétrocompatibilité pour accéder directement aux 101 départements
window.ProtecDepartements.DEPARTEMENTS_DATA = window.ProtecDepartements.list;
