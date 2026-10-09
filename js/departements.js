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
  }
};

// Alias de rétrocompatibilité pour accéder directement aux 101 départements
window.ProtecDepartements.DEPARTEMENTS_DATA = window.ProtecDepartements.list;
