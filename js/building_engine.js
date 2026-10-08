/**
 * =========================================================================
 * PROTEC LIVE - BUILDING & LAYOUT SYSTEM (2D GRID ENGINE)
 * Moteur Architectural, Spatial et Opérationnel - Protection Civile
 * =========================================================================
 * 
 * Architecture Game Development 2D :
 * 1. Grille Spatiale Modulaire Orthogonale (1x1m par cellule)
 * 2. Détection de Pièces Fermées (Flood-fill / Composantes Connexes / Room Detection)
 * 3. Système de Mobilier Interactif (Footprints, Orientations & Interaction Nodes)
 * 4. Moteur de Métriques Opérationnelles & Pathfinding A* (Chrono départ, ERP, OPEX)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ProtecBuildingSystem = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // =========================================================================
  // 1. CONSTANTES, ENUMS & TYPES
  // =========================================================================

  /**
   * États possibles d'une cellule de la grille (1m x 1m)
   */
  const CellState = {
    EMPTY: 'empty',                   // Cellule vide / Sol brut non affecté
    LOAD_BEARING_WALL: 'wall_load',   // Mur porteur extérieur (infranchissable, structurel)
    PARTITION_WALL: 'wall_partition', // Cloison de séparation intérieure (infranchissable)
    DOOR: 'door',                     // Porte intérieure ou extérieure (franchissable)
    PASSAGE: 'passage',               // Dégagement / Arche libre sans battant (franchissable)
    RESERVED_FLOOR: 'reserved_floor'  // Sol technique / Emplacement réservé (stationnement, traçage)
  };

  /**
   * Typologies officielles des pièces de l'antenne
   */
  const RoomType = {
    GARAGE: 'GARAGE',                   // Baies véhicules (VL, VPSP, VTU, PL)
    LOGISTIQUE: 'LOGISTIQUE',           // Réserve matériel, Pharmacie d'urgence, DAE, Lots A/B
    VIE: 'VIE',                         // Foyer convivial, Vestiaires tenues F1, Cuisine, Sanitaires
    FORMATION_ADMIN: 'FORMATION_ADMIN', // Salle de cours pédagogique PSC1/SST, Bureaux direction
    CIRCULATION: 'CIRCULATION',         // Couloirs, Sas d'accès, Dégagements
    UNASSIGNED: 'UNASSIGNED',           // Pièce fermée mais non affectée
    EXTERIOR: 'EXTERIOR'                // Espace extérieur non fermé
  };

  /**
   * Orientations cardinales pour le mobilier
   */
  const Direction = {
    NORTH: 'N',
    EAST: 'E',
    SOUTH: 'S',
    WEST: 'W'
  };

  // =========================================================================
  // 2. CATALOGUE DE MOBILIER TECHNIQUE ET INTERACTIF
  // =========================================================================

  const FURNITURE_CATALOG = {
    // --- 1. Stockage brut & Logistique ---
    etagere_rack_lourd: {
      id: 'etagere_rack_lourd',
      name: 'Rack de Stockage Industriel',
      category: 'LOGISTIQUE',
      footprint: { w: 2, h: 1 },
      passable: false,
      cost: 160,
      dailyMaintenance: 0.20,
      interactionNodes: [
        { dx: 0, dy: 1, dir: Direction.SOUTH, tag: 'access' },
        { dx: 1, dy: 1, dir: Direction.SOUTH, tag: 'access' }
      ],
      mechanics: {
        storageCapacityBonus: 50, // +50 slots inventaire
        logisticsSpeedBonus: 0.05
      },
      icon: '📦',
      description: 'Rayonnage métallique lourd pour caisses de collectes et lots de secours B/C.'
    },

    armoire_pharmacie_dae: {
      id: 'armoire_pharmacie_dae',
      name: 'Armoire Pharmacie Sécurisée & DAE',
      category: 'LOGISTIQUE',
      footprint: { w: 1, h: 1 },
      passable: false,
      cost: 320,
      dailyMaintenance: 0.50,
      interactionNodes: [
        { dx: 0, dy: 1, dir: Direction.SOUTH, tag: 'dispense' }
      ],
      mechanics: {
        medicalAutonomyDaysBonus: 5,  // +5 jours d'autonomie soins d'urgence
        storageCapacityBonus: 25,
        daeMaintenanceRate: 1.0       // Maintien DAE à 100%
      },
      icon: '🩺',
      description: 'Armoire sous clé pour solutés, pansements hémostatiques et défibrillateurs.'
    },

    // --- 2. Casiers & Vestiaires ---
    casiers_tenues_f1: {
      id: 'casiers_tenues_f1',
      name: 'Bloc de 4 Casiers Tenues F1',
      category: 'VIE',
      footprint: { w: 2, h: 1 },
      passable: false,
      cost: 210,
      dailyMaintenance: 0.30,
      interactionNodes: [
        { dx: 0, dy: 1, dir: Direction.SOUTH, tag: 'dress_slot_1' },
        { dx: 1, dy: 1, dir: Direction.SOUTH, tag: 'dress_slot_2' }
      ],
      mechanics: {
        volunteerCapacityBonus: 4,      // 4 secouristes équipables
        dressingTimeReductionSec: 15,   // Gain de 15 secondes sur l'habillage départ
        departureChronoBonus: 0.12      // +12% réactivité départ réflexe
      },
      icon: '👕',
      description: 'Vestiaires ventilés permettant l\'équipement rapide en tenue opérationnelle F1.'
    },

    banc_habillage: {
      id: 'banc_habillage',
      name: 'Banc d’Habillage Vestiaire',
      category: 'VIE',
      footprint: { w: 2, h: 1 },
      passable: true, // Traversable avec léger coût de marche
      cost: 75,
      dailyMaintenance: 0.05,
      interactionNodes: [
        { dx: 0, dy: 0, dir: Direction.NORTH, tag: 'sit' },
        { dx: 1, dy: 0, dir: Direction.NORTH, tag: 'sit' }
      ],
      mechanics: {
        dressingTimeReductionSec: 5,
        comfortComfortScore: 5
      },
      icon: '🪑',
      description: 'Facilite le laçage des rangers et l\'enfilage des parkas d\'intervention.'
    },

    // --- 3. Mobilier de confort & Repos ---
    lit_garde_camp: {
      id: 'lit_garde_camp',
      name: 'Lit d’Astreinte & Garde 24h',
      category: 'VIE',
      footprint: { w: 2, h: 1 },
      passable: false,
      cost: 220,
      dailyMaintenance: 0.40,
      interactionNodes: [
        { dx: 0, dy: 1, dir: Direction.SOUTH, tag: 'sleep' }
      ],
      mechanics: {
        nightBedsCapacity: 1,
        energyRegenRatePerHour: 25, // +25% énergie/heure de repos
        burnoutRiskReduction: 0.30   // -30% risque d'épuisement opérationnel
      },
      icon: '🛏️',
      description: 'Couchette confortable isolée pour les équipages d\'astreinte nocturne SAMU 15.'
    },

    canape_foyer: {
      id: 'canape_foyer',
      name: 'Canapé Convivial Foyer',
      category: 'VIE',
      footprint: { w: 2, h: 1 },
      passable: false,
      cost: 280,
      dailyMaintenance: 0.25,
      interactionNodes: [
        { dx: 0, dy: 1, dir: Direction.SOUTH, tag: 'rest_1' },
        { dx: 1, dy: 1, dir: Direction.SOUTH, tag: 'rest_2' }
      ],
      mechanics: {
        moralRegenPerHour: 15,      // +15 moral/heure
        teamBondingScore: 10
      },
      icon: '🛋️',
      description: 'Espace de débriefing et détente favorisant la cohésion d\'équipe.'
    },

    machine_cafe: {
      id: 'machine_cafe',
      name: 'Machine à Café & Bouilloire Foyer',
      category: 'VIE',
      footprint: { w: 1, h: 1 },
      passable: false,
      cost: 95,
      dailyMaintenance: 0.35,
      interactionNodes: [
        { dx: 0, dy: 1, dir: Direction.SOUTH, tag: 'drink' }
      ],
      mechanics: {
        instantMoralBonus: 10,        // Buff immédiat de moral
        fatigueReductionPercent: 15,
        energyRegenRatePerHour: 5
      },
      icon: '☕',
      description: 'Point névralgique de l\'antenne pour maintenir les équipages éveillés en garde.'
    },

    // --- 4. Établis & Postes de charge techniques ---
    poste_charge_radios_dae: {
      id: 'poste_charge_radios_dae',
      name: 'Baie de Charge Radios PMA & DAE',
      category: 'LOGISTIQUE',
      footprint: { w: 1, h: 1 },
      passable: false,
      cost: 380,
      dailyMaintenance: 0.90, // Consommation électrique 230V permanente
      interactionNodes: [
        { dx: 0, dy: 1, dir: Direction.SOUTH, tag: 'charge' }
      ],
      mechanics: {
        radioReliabilityPercent: 100, // 0 panne radio S1-S6 sur le terrain
        deviceReadinessScore: 1.0,
        batteryFailureRiskReduction: 0.95
      },
      icon: '⚡',
      description: 'Rack chargeur régulé assurant l\'autonomie des émetteurs radio et des DAE portables.'
    },

    etabli_maintenance: {
      id: 'etabli_maintenance',
      name: 'Établi de Maintenance Lots Secours',
      category: 'LOGISTIQUE',
      footprint: { w: 2, h: 1 },
      passable: false,
      cost: 290,
      dailyMaintenance: 0.30,
      interactionNodes: [
        { dx: 0, dy: 1, dir: Direction.SOUTH, tag: 'repair_1' },
        { dx: 1, dy: 1, dir: Direction.SOUTH, tag: 'repair_2' }
      ],
      mechanics: {
        materialWearReductionPercent: 40, // -40% d'usure des sacs et civières
        repairSpeedBonus: 0.25
      },
      icon: '🔧',
      description: 'Atelier de reconditionnement des coquilles, attelles et matériel de sauvetage.'
    },

    // --- 5. Formation & Administration ---
    table_formation: {
      id: 'table_formation',
      name: 'Table Pédagogique PSC1 / SST',
      category: 'FORMATION_ADMIN',
      footprint: { w: 2, h: 1 },
      passable: false,
      cost: 180,
      dailyMaintenance: 0.15,
      interactionNodes: [
        { dx: 0, dy: 1, dir: Direction.SOUTH, tag: 'learn_1' },
        { dx: 1, dy: 1, dir: Direction.SOUTH, tag: 'learn_2' }
      ],
      mechanics: {
        studentCapacityBonus: 2,
        pedagogicEfficiencyScore: 1.15
      },
      icon: '🎓',
      description: 'Table modulable permettant d\'accueillir les stagiaires grand public en formation.'
    },

    bureau_direction_pc: {
      id: 'bureau_direction_pc',
      name: 'Bureau Direction & Poste Commandement',
      category: 'FORMATION_ADMIN',
      footprint: { w: 2, h: 1 },
      passable: false,
      cost: 260,
      dailyMaintenance: 0.40,
      interactionNodes: [
        { dx: 0, dy: 1, dir: Direction.SOUTH, tag: 'command' }
      ],
      mechanics: {
        adminSpeedBonus: 0.20,
        devisApprovalBonus: 0.10,
        commandReadinessScore: 1.2
      },
      icon: '💼',
      description: 'Poste informatique et radio de régulation pour la direction et la gestion des devis.'
    },

    // --- 6. Garages & Emplacements Véhicules ---
    station_vpsp: {
      id: 'station_vpsp',
      name: 'Emplacement Aménagé VPSP / Ambulance',
      category: 'GARAGE',
      footprint: { w: 4, h: 2 },
      passable: true,
      cost: 450,
      dailyMaintenance: 0.80, // Maintien de charge batterie 230V VPSP
      interactionNodes: [
        { dx: 0, dy: 0, dir: Direction.WEST, tag: 'driver_side' },
        { dx: 3, dy: 1, dir: Direction.EAST, tag: 'rear_doors' }
      ],
      mechanics: {
        vehicleSlots: 1,
        vehicleTypeAllowed: 'VPSP',
        readinessTimeBonusSec: 20 // Sortie directe hangar
      },
      icon: '🚑',
      description: 'Baie réservée VPSP avec prise de charge 230V et accès direct à la voie publique.'
    }
  };

  // =========================================================================
  // 3. CLASSE GRILLE 2D (BUILDING GRID & SPATIAL PARTITIONING)
  // =========================================================================

  class BuildingGrid {
    /**
     * @param {number} width - Largeur en mètres (colonnes)
     * @param {number} height - Longueur en mètres (lignes)
     */
    constructor(width = 16, height = 12) {
      this.width = Math.max(4, Math.floor(width));
      this.height = Math.max(4, Math.floor(height));
      this.cells = [];
      this.rooms = [];
      this.furniture = [];

      this.initEmptyGrid();
    }

    /**
     * Initialise la matrice de cellules 1m x 1m
     */
    initEmptyGrid() {
      this.cells = new Array(this.height);
      for (let y = 0; y < this.height; y++) {
        this.cells[y] = new Array(this.width);
        for (let x = 0; x < this.width; x++) {
          this.cells[y][x] = {
            x,
            y,
            state: CellState.EMPTY,
            roomId: null,
            furnitureId: null,
            floorType: 'concrete',
            meta: {}
          };
        }
      }
    }

    /**
     * Contrôle si les coordonnées sont dans les bornes
     */
    isInBounds(x, y) {
      return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    /**
     * Récupère la cellule aux coordonnées données
     */
    getCell(x, y) {
      if (!this.isInBounds(x, y)) return null;
      return this.cells[y][x];
    }

    /**
     * Modifie l'état structural d'une cellule
     */
    setCellState(x, y, state, meta = {}) {
      const cell = this.getCell(x, y);
      if (!cell) return false;
      cell.state = state;
      cell.meta = { ...cell.meta, ...meta };
      return true;
    }

    /**
     * Vérifie si une cellule est un obstacle infranchissable pour les déplacements
     */
    isObstacle(x, y) {
      const cell = this.getCell(x, y);
      if (!cell) return true;

      // Murs
      if (cell.state === CellState.LOAD_BEARING_WALL || cell.state === CellState.PARTITION_WALL) {
        return true;
      }

      // Meubles bloquants
      if (cell.furnitureId) {
        const item = this.getFurnitureInstance(cell.furnitureId);
        if (item) {
          const catalog = FURNITURE_CATALOG[item.type];
          if (catalog && !catalog.passable) {
            return true;
          }
        }
      }

      return false;
    }

    /**
     * Vérifie si une cellule est franchissable par les secouristes
     */
    isWalkable(x, y) {
      return !this.isObstacle(x, y);
    }

    /**
     * Vérifie si la cellule est considérée comme une délimitation spatiale fermée
     */
    isBoundary(x, y) {
      const cell = this.getCell(x, y);
      if (!cell) return true; // Hors limites = bordure
      return (
        cell.state === CellState.LOAD_BEARING_WALL ||
        cell.state === CellState.PARTITION_WALL ||
        cell.state === CellState.DOOR
      );
    }

    /**
     * Récupère une instance de meuble par ID
     */
    getFurnitureInstance(id) {
      return this.furniture.find(f => f.id === id) || null;
    }

    /**
     * Récupère tous les voisins orthogonaux (4 directions)
     */
    getOrthogonalNeighbors(x, y) {
      const deltas = [
        { dx: 0, dy: -1, dir: Direction.NORTH },
        { dx: 1, dy: 0, dir: Direction.EAST },
        { dx: 0, dy: 1, dir: Direction.SOUTH },
        { dx: -1, dy: 0, dir: Direction.WEST }
      ];

      const res = [];
      for (const d of deltas) {
        const nx = x + d.dx;
        const ny = y + d.dy;
        if (this.isInBounds(nx, ny)) {
          res.push({ x: nx, y: ny, cell: this.cells[ny][nx], dir: d.dir });
        }
      }
      return res;
    }
  }

  // =========================================================================
  // 4. SYSTÈME DE ZONAGE & DÉTECTION DE PIÈCES (ROOM DETECTOR / FLOOD-FILL)
  // =========================================================================

  class RoomDetector {
    /**
     * Détecte automatiquement l'ensemble des pièces fermées dans la grille via Flood-fill
     * @param {BuildingGrid} grid 
     * @returns {Array<Object>} Liste des pièces détectées avec géométrie et classification
     */
    static detectRooms(grid) {
      const visited = new Array(grid.height);
      for (let y = 0; y < grid.height; y++) {
        visited[y] = new Array(grid.width).fill(false);
      }

      const detectedRooms = [];
      let roomCounter = 1;

      // Réinitialiser les associations de pièces sur les cellules
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          grid.cells[y][x].roomId = null;
        }
      }

      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const cell = grid.cells[y][x];

          // On n'amorce le flood-fill que sur un sol non encore visité et qui n'est pas un mur dur
          if (!visited[y][x] && !grid.isBoundary(x, y)) {
            const region = RoomDetector._floodFillRegion(grid, x, y, visited);

            // Si la région touche le bord extérieur absolu sans mur, c'est l'EXTÉRIEUR
            if (region.touchesEdge) {
              region.type = RoomType.EXTERIOR;
              region.name = 'Extérieur & Cour Opérationnelle';
            } else {
              // Pièce intérieure close
              const roomId = `room_${roomCounter++}`;
              region.id = roomId;
              region.type = RoomDetector._classifyRoomType(region, grid);
              region.name = RoomDetector._getDefaultRoomName(region.type, detectedRooms.length + 1);

              // Marquer les cellules avec l'identifiant de pièce
              for (const c of region.cells) {
                grid.cells[c.y][c.x].roomId = roomId;
              }

              detectedRooms.push(region);
            }
          }
        }
      }

      grid.rooms = detectedRooms;
      return detectedRooms;
    }

    /**
     * Parcours en largeur (BFS) pour délimiter une composante connexe
     */
    static _floodFillRegion(grid, startX, startY, visited) {
      const queue = [{ x: startX, y: startY }];
      visited[startY][startX] = true;

      const cells = [];
      const doorsFound = new Map();
      const enclosingWalls = new Set();
      let touchesEdge = false;

      let minX = startX, maxX = startX;
      let minY = startY, maxY = startY;

      while (queue.length > 0) {
        const curr = queue.shift();
        cells.push(curr);

        if (curr.x === 0 || curr.x === grid.width - 1 || curr.y === 0 || curr.y === grid.height - 1) {
          touchesEdge = true;
        }

        minX = Math.min(minX, curr.x);
        maxX = Math.max(maxX, curr.x);
        minY = Math.min(minY, curr.y);
        maxY = Math.max(maxY, curr.y);

        const neighbors = grid.getOrthogonalNeighbors(curr.x, curr.y);
        for (const n of neighbors) {
          const nx = n.x;
          const ny = n.y;
          const nCell = n.cell;

          // Si le voisin est une délimitation (mur ou porte)
          if (grid.isBoundary(nx, ny)) {
            if (nCell.state === CellState.DOOR) {
              doorsFound.set(`${nx},${ny}`, { x: nx, y: ny, cell: nCell });
            } else {
              enclosingWalls.add(`${nx},${ny}`);
            }
          } else {
            // Sol intérieur continu
            if (!visited[ny][nx]) {
              visited[ny][nx] = true;
              queue.push({ x: nx, y: ny });
            }
          }
        }
      }

      const surfaceM2 = cells.length; // 1 cellule = 1 mètre carré
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      return {
        id: null,
        surfaceM2,
        cells,
        bounds: { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 },
        centroid: { x: centerX, y: centerY },
        doors: Array.from(doorsFound.values()),
        wallPerimeterCount: enclosingWalls.size,
        touchesEdge,
        type: RoomType.UNASSIGNED,
        name: 'Pièce Non Assignée'
      };
    }

    /**
     * Analyse sémantique heuristique pour suggérer ou classifier le type de pièce
     */
    static _classifyRoomType(region, grid) {
      // 1. Détection par mobilier déjà présent dans la zone
      let hasVehicleSlot = false;
      let storageCount = 0;
      let lifeComfortCount = 0;
      let trainingAdminCount = 0;

      for (const c of region.cells) {
        const cell = grid.getCell(c.x, c.y);
        if (cell && cell.furnitureId) {
          const item = grid.getFurnitureInstance(cell.furnitureId);
          if (item) {
            const cat = FURNITURE_CATALOG[item.type]?.category;
            if (cat === 'GARAGE') hasVehicleSlot = true;
            else if (cat === 'LOGISTIQUE') storageCount++;
            else if (cat === 'VIE') lifeComfortCount++;
            else if (cat === 'FORMATION_ADMIN') trainingAdminCount++;
          }
        }
      }

      if (hasVehicleSlot) return RoomType.GARAGE;
      if (storageCount >= 2) return RoomType.LOGISTIQUE;
      if (trainingAdminCount >= 2) return RoomType.FORMATION_ADMIN;
      if (lifeComfortCount >= 2) return RoomType.VIE;

      // 2. Détection par morphologie (ratio et connectivité)
      const isNarrowCorridor = (region.bounds.w >= 4 && region.bounds.h <= 2) || (region.bounds.h >= 4 && region.bounds.w <= 2);
      if (isNarrowCorridor && region.doors.length >= 2) {
        return RoomType.CIRCULATION;
      }

      // Par défaut selon la surface
      if (region.surfaceM2 >= 35) return RoomType.LOGISTIQUE;
      if (region.surfaceM2 >= 18) return RoomType.FORMATION_ADMIN;
      return RoomType.VIE;
    }

    static _getDefaultRoomName(type, index) {
      switch (type) {
        case RoomType.GARAGE: return `Hangar & Garage VPSP / VL (${index})`;
        case RoomType.LOGISTIQUE: return `Réserve Logistique & Lots A/B (${index})`;
        case RoomType.VIE: return `Foyer & Vestiaires Bénévoles (${index})`;
        case RoomType.FORMATION_ADMIN: return `Salle de Formation & PC (${index})`;
        case RoomType.CIRCULATION: return `Couloir & Dégagement (${index})`;
        default: return `Espace Polyvalent (${index})`;
      }
    }
  }

  // =========================================================================
  // 5. GESTION DU MOBILIER ET OBJETS INTERACTIFS (FURNITURE SYSTEM)
  // =========================================================================

  class FurnitureManager {
    /**
     * Calcule l'empreinte pivotée selon l'orientation
     */
    static getRotatedFootprint(defFootprint, orientation) {
      if (orientation === Direction.EAST || orientation === Direction.WEST) {
        return { w: defFootprint.h, h: defFootprint.w };
      }
      return { w: defFootprint.w, h: defFootprint.h };
    }

    /**
     * Calcule la position absolue dans le monde d'un noeud d'interaction
     */
    static getAbsoluteInteractionNodes(furniture) {
      const def = FURNITURE_CATALOG[furniture.type];
      if (!def || !def.interactionNodes) return [];

      const nodes = [];
      for (const node of def.interactionNodes) {
        let rx = node.dx;
        let ry = node.dy;

        // Rotation selon orientation (autour de l'origine du meuble)
        if (furniture.orientation === Direction.EAST) {
          rx = def.footprint.h - 1 - node.dy;
          ry = node.dx;
        } else if (furniture.orientation === Direction.SOUTH) {
          rx = def.footprint.w - 1 - node.dx;
          ry = def.footprint.h - 1 - node.dy;
        } else if (furniture.orientation === Direction.WEST) {
          rx = node.dy;
          ry = def.footprint.w - 1 - node.dx;
        }

        nodes.push({
          x: furniture.x + rx,
          y: furniture.y + ry,
          tag: node.tag,
          dir: node.dir
        });
      }
      return nodes;
    }

    /**
     * Tente de placer un meuble sur la grille
     */
    static placeFurniture(grid, type, x, y, orientation = Direction.NORTH) {
      const def = FURNITURE_CATALOG[type];
      if (!def) {
        return { success: false, reason: `Type de meuble inconnu : ${type}` };
      }

      const rot = FurnitureManager.getRotatedFootprint(def.footprint, orientation);

      // 1. Contrôle des bornes
      if (!grid.isInBounds(x, y) || !grid.isInBounds(x + rot.w - 1, y + rot.h - 1)) {
        return { success: false, reason: 'Le meuble dépasse les limites du bâtiment.' };
      }

      // 2. Contrôle de collision sur l'ensemble de l'empreinte
      for (let cy = y; cy < y + rot.h; cy++) {
        for (let cx = x; cx < x + rot.w; cx++) {
          const cell = grid.getCell(cx, cy);
          if (!cell) return { success: false, reason: 'Emplacement invalide.' };

          // Interdit de poser sur un mur ou une porte
          if (grid.isBoundary(cx, cy)) {
            return { success: false, reason: 'Impossible de superposer un meuble sur un mur ou une porte.' };
          }

          // Interdit de superposer sur un meuble existant
          if (cell.furnitureId) {
            return { success: false, reason: 'La case est déjà occupée par un autre équipement.' };
          }
        }
      }

      // 3. Création de l'instance
      const furnitureInstance = {
        id: `furn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type,
        x,
        y,
        orientation,
        footprint: rot,
        placedAt: Date.now()
      };

      // 4. Inscription dans la grille
      for (let cy = y; cy < y + rot.h; cy++) {
        for (let cx = x; cx < x + rot.w; cx++) {
          grid.cells[cy][cx].furnitureId = furnitureInstance.id;
        }
      }

      grid.furniture.push(furnitureInstance);

      return {
        success: true,
        furniture: furnitureInstance
      };
    }

    /**
     * Supprime un meuble de la grille
     */
    static removeFurniture(grid, furnitureId) {
      const index = grid.furniture.findIndex(f => f.id === furnitureId);
      if (index === -1) return false;

      const f = grid.furniture[index];
      for (let cy = f.y; cy < f.y + f.footprint.h; cy++) {
        for (let cx = f.x; cx < f.x + f.footprint.w; cx++) {
          const cell = grid.getCell(cx, cy);
          if (cell && cell.furnitureId === furnitureId) {
            cell.furnitureId = null;
          }
        }
      }

      grid.furniture.splice(index, 1);
      return true;
    }

    /**
     * Déplace un meuble (100% gratuit)
     */
    static moveFurniture(grid, furnitureId, newX, newY, newOrientation) {
      const current = grid.getFurnitureInstance(furnitureId);
      if (!current) return { success: false, reason: 'Meuble introuvable.' };

      const type = current.type;
      const orient = newOrientation || current.orientation;

      // Retrait temporaire pour tester la nouvelle place
      FurnitureManager.removeFurniture(grid, furnitureId);

      const placed = FurnitureManager.placeFurniture(grid, type, newX, newY, orient);
      if (!placed.success) {
        // Rollback à l'ancienne position
        FurnitureManager.placeFurniture(grid, type, current.x, current.y, current.orientation);
        return placed;
      }

      return { success: true, furniture: placed.furniture };
    }
  }

  // =========================================================================
  // 6. PATHFINDING A* & PARCOURS DE GRAPHE OPÉRATIONNEL
  // =========================================================================

  class GridPathfinder {
    /**
     * Algorithme A* pour calculer le plus court chemin entre 2 cases
     * @returns {{ path: Array<{x, y}>, distanceMeters: number } | null}
     */
    static findPath(grid, startX, startY, goalX, goalY) {
      if (!grid.isInBounds(startX, startY) || !grid.isInBounds(goalX, goalY)) {
        return null;
      }

      // Si le but ou le départ est un obstacle strict (hors porte)
      if (grid.isObstacle(goalX, goalY) && grid.getCell(goalX, goalY)?.state !== CellState.DOOR) {
        // Chercher une case adjacente marchable
        const adj = grid.getOrthogonalNeighbors(goalX, goalY).filter(n => grid.isWalkable(n.x, n.y));
        if (adj.length === 0) return null;
        goalX = adj[0].x;
        goalY = adj[0].y;
      }

      const key = (x, y) => `${x},${y}`;
      const heuristic = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2); // Distance de Manhattan

      const openSet = new Set([key(startX, startY)]);
      const cameFrom = new Map();

      const gScore = new Map();
      gScore.set(key(startX, startY), 0);

      const fScore = new Map();
      fScore.set(key(startX, startY), heuristic(startX, startY, goalX, goalY));

      const nodesMap = new Map();
      nodesMap.set(key(startX, startY), { x: startX, y: startY });

      while (openSet.size > 0) {
        // Trouver le noeud de plus petit fScore
        let currentKey = null;
        let lowestF = Infinity;
        for (const k of openSet) {
          const score = fScore.get(k) ?? Infinity;
          if (score < lowestF) {
            lowestF = score;
            currentKey = k;
          }
        }

        const current = nodesMap.get(currentKey);
        if (current.x === goalX && current.y === goalY) {
          // Reconstruction du chemin
          const path = [];
          let traceKey = currentKey;
          while (cameFrom.has(traceKey)) {
            path.unshift(nodesMap.get(traceKey));
            traceKey = cameFrom.get(traceKey);
          }
          path.unshift({ x: startX, y: startY });

          return {
            path,
            distanceMeters: path.length - 1
          };
        }

        openSet.delete(currentKey);

        const neighbors = grid.getOrthogonalNeighbors(current.x, current.y);
        for (const n of neighbors) {
          if (!grid.isWalkable(n.x, n.y) && !(n.x === goalX && n.y === goalY)) {
            continue;
          }

          // Coût de passage (légère pénalité de 0.5m pour les portes afin de privilégier les couloirs)
          const stepCost = n.cell.state === CellState.DOOR ? 1.5 : 1.0;
          const tentativeG = (gScore.get(currentKey) ?? Infinity) + stepCost;
          const nKey = key(n.x, n.y);

          if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
            cameFrom.set(nKey, currentKey);
            gScore.set(nKey, tentativeG);
            fScore.set(nKey, tentativeG + heuristic(n.x, n.y, goalX, goalY));
            nodesMap.set(nKey, { x: n.x, y: n.y });
            openSet.add(nKey);
          }
        }
      }

      return null; // Aucun chemin possible
    }
  }

  // =========================================================================
  // 7. MOTEUR DE MÉTRIQUES OPÉRATIONNELLES (BUILDING METRICS CALCULATOR)
  // =========================================================================

  class BuildingMetricsCalculator {
    /**
     * Analyse en profondeur et calcule l'ensemble des métriques d'efficacité
     * @param {BuildingGrid} grid 
     * @param {Object} options - Paramètres environnementaux et de flotte
     * @returns {Object} Rapport complet d'efficacité opérationnelle
     */
    static computeFullMetrics(grid, options = {}) {
      // 1. Détection des pièces fermées
      const rooms = RoomDetector.detectRooms(grid);

      // 2. Indexation des noeuds fonctionnels
      const functionalNodes = BuildingMetricsCalculator._indexFunctionalNodes(grid);

      // 3. Calcul du temps moyen d'accès aux véhicules (Chrono de départ réflexe)
      const dispatchFlow = BuildingMetricsCalculator._calculateDispatchFlow(grid, functionalNodes);

      // 4. Capacité d'accueil max (ERP & Sécurité Civile)
      const capacityMetrics = BuildingMetricsCalculator._calculateCapacity(grid, rooms);

      // 5. Autonomie en consommables et inventaire
      const supplyMetrics = BuildingMetricsCalculator._calculateSuppliesAutonomy(grid);

      // 6. Coûts d'entretien journalier (OPEX, énergie, conformité)
      const opexMetrics = BuildingMetricsCalculator._calculateDailyOpex(grid, rooms);

      // 7. Score Global d'Efficacité (0 - 100%)
      const globalScore = BuildingMetricsCalculator._calculateGlobalEfficiencyScore({
        dispatchFlow,
        capacityMetrics,
        supplyMetrics,
        opexMetrics,
        rooms
      });

      return {
        timestamp: Date.now(),
        globalScore, // Score 0 à 100%
        summary: BuildingMetricsCalculator._generateExecutiveSummary(globalScore, dispatchFlow),
        roomsCount: rooms.length,
        roomsDistribution: BuildingMetricsCalculator._getRoomsDistribution(rooms),
        dispatchFlow,
        capacityMetrics,
        supplyMetrics,
        opexMetrics,
        recommendations: BuildingMetricsCalculator._generateTacticalRecommendations({
          dispatchFlow,
          capacityMetrics,
          supplyMetrics,
          opexMetrics,
          rooms
        })
      };
    }

    /**
     * Indexe les points clés : Vestiaires, Stockage, Garages
     */
    static _indexFunctionalNodes(grid) {
      const nodes = {
        lockers: [],      // Casiers F1 / Habillage
        stockPoints: [],  // Racks & Armoire Pharmacie DAE
        garageExits: [],  // Postes de véhicules / Portes de garage
        restAreas: []     // Foyer, Cafetière, Lits
      };

      for (const item of grid.furniture) {
        const def = FURNITURE_CATALOG[item.type];
        if (!def) continue;

        const interactNodes = FurnitureManager.getAbsoluteInteractionNodes(item);
        const primaryNode = interactNodes[0] || { x: item.x, y: item.y };

        if (item.type === 'casiers_tenues_f1' || item.type === 'banc_habillage') {
          nodes.lockers.push(primaryNode);
        } else if (item.type === 'etagere_rack_lourd' || item.type === 'armoire_pharmacie_dae') {
          nodes.stockPoints.push(primaryNode);
        } else if (item.type === 'station_vpsp') {
          nodes.garageExits.push(primaryNode);
        } else if (item.type === 'lit_garde_camp' || item.type === 'canape_foyer' || item.type === 'machine_cafe') {
          nodes.restAreas.push(primaryNode);
        }
      }

      // Si aucun emplacement meuble VPSP, utiliser les portes de garage de la pièce GARAGE
      if (nodes.garageExits.length === 0) {
        const garageRooms = grid.rooms.filter(r => r.type === RoomType.GARAGE);
        for (const gr of garageRooms) {
          for (const d of gr.doors) {
            nodes.garageExits.push({ x: d.x, y: d.y });
          }
        }
      }

      return nodes;
    }

    /**
     * Calcule la chaîne de départ opérationnelle :
     * Vestiaires (Habillage) -> Stockage (Lots A/B) -> Garages (Embarquement VPSP)
     */
    static _calculateDispatchFlow(grid, nodes) {
      // Vitesse moyenne de marche rapide d'un secouriste équipé = 1.4 m/s
      const WALK_SPEED_M_S = 1.4;

      let distLockerToStock = 0;
      let distStockToGarage = 0;
      let routeCalculated = false;

      // 1. Vestiaire -> Stock
      if (nodes.lockers.length > 0 && nodes.stockPoints.length > 0) {
        const path1 = GridPathfinder.findPath(
          grid,
          nodes.lockers[0].x, nodes.lockers[0].y,
          nodes.stockPoints[0].x, nodes.stockPoints[0].y
        );
        if (path1) {
          distLockerToStock = path1.distanceMeters;
          routeCalculated = true;
        }
      }

      // 2. Stock -> Garage
      if (nodes.stockPoints.length > 0 && nodes.garageExits.length > 0) {
        const path2 = GridPathfinder.findPath(
          grid,
          nodes.stockPoints[0].x, nodes.stockPoints[0].y,
          nodes.garageExits[0].x, nodes.garageExits[0].y
        );
        if (path2) {
          distStockToGarage = path2.distanceMeters;
          routeCalculated = true;
        }
      }

      const totalDistanceMeters = distLockerToStock + distStockToGarage;
      const walkTimeSec = totalDistanceMeters / WALK_SPEED_M_S;

      // Base habillage 45s (réduite par le nombre de casiers de qualité)
      const lockerBonuses = grid.furniture
        .filter(f => f.type === 'casiers_tenues_f1')
        .reduce((acc, f) => acc + (FURNITURE_CATALOG[f.type]?.mechanics?.dressingTimeReductionSec || 0), 0);

      const dressingTimeSec = Math.max(15, 45 - lockerBonuses);

      // Temps total estimé pour un départ réflexe
      const totalDispatchTimeSec = Math.round(dressingTimeSec + walkTimeSec);

      let rating = 'CRITIQUE';
      if (totalDispatchTimeSec <= 40) rating = 'EXCELLENT';
      else if (totalDispatchTimeSec <= 65) rating = 'BON';
      else if (totalDispatchTimeSec <= 95) rating = 'MOYEN';

      return {
        routeCalculated,
        distanceLockerToStockMeters: distLockerToStock,
        distanceStockToGarageMeters: distStockToGarage,
        totalWalkDistanceMeters: totalDistanceMeters,
        walkTimeSeconds: Math.round(walkTimeSec),
        dressingTimeSeconds: dressingTimeSec,
        totalDispatchTimeSeconds: totalDispatchTimeSec,
        rating,
        label: `${totalDispatchTimeSec} secondes (${rating})`
      };
    }

    /**
     * Capacité d'accueil selon les normes ERP (Établissement Recevant du Public)
     */
    static _calculateCapacity(grid, rooms) {
      let maxSimultaneousVolunteers = 0;
      let studentCapacity = 0;
      let nightBeds = 0;
      let totalUsableSurfaceM2 = 0;

      for (const room of rooms) {
        totalUsableSurfaceM2 += room.surfaceM2;

        // Normes ERP selon affectation
        if (room.type === RoomType.FORMATION_ADMIN) {
          studentCapacity += Math.floor(room.surfaceM2 / 2.0); // 1 apprenant par 2m²
          maxSimultaneousVolunteers += Math.floor(room.surfaceM2 / 3.0);
        } else if (room.type === RoomType.VIE) {
          maxSimultaneousVolunteers += Math.floor(room.surfaceM2 / 1.5);
        } else if (room.type === RoomType.LOGISTIQUE) {
          maxSimultaneousVolunteers += Math.floor(room.surfaceM2 / 4.0);
        } else if (room.type === RoomType.GARAGE) {
          maxSimultaneousVolunteers += Math.floor(room.surfaceM2 / 6.0);
        }
      }

      // Bonus de casiers & lits physiques
      for (const f of grid.furniture) {
        const mech = FURNITURE_CATALOG[f.type]?.mechanics;
        if (mech?.volunteerCapacityBonus) {
          maxSimultaneousVolunteers += mech.volunteerCapacityBonus;
        }
        if (mech?.nightBedsCapacity) {
          nightBeds += mech.nightBedsCapacity;
        }
        if (mech?.studentCapacityBonus) {
          studentCapacity += mech.studentCapacityBonus;
        }
      }

      return {
        totalUsableSurfaceM2,
        maxSimultaneousVolunteers: Math.max(4, maxSimultaneousVolunteers),
        studentTrainingCapacity: studentCapacity,
        nightDutyBedsCount: nightBeds,
        erpClassification: totalUsableSurfaceM2 >= 300 ? 'ERP 4ème Catégorie' : 'ERP 5ème Catégorie'
      };
    }

    /**
     * Autonomie en consommables, pharmacie et volume logistique
     */
    static _calculateSuppliesAutonomy(grid) {
      let totalStorageSlots = 80; // Base caserne
      let medicalDays = 3;        // Autonomie de base

      for (const f of grid.furniture) {
        const mech = FURNITURE_CATALOG[f.type]?.mechanics;
        if (mech?.storageCapacityBonus) {
          totalStorageSlots += mech.storageCapacityBonus;
        }
        if (mech?.medicalAutonomyDaysBonus) {
          medicalDays += mech.medicalAutonomyDaysBonus;
        }
      }

      // Nombre moyen de DPS consécutifs assurables
      const dpsSupportCapacity = Math.floor(totalStorageSlots / 35);

      return {
        totalStorageSlots,
        medicalAutonomyDays: medicalDays,
        consecutiveDpsAutonomy: Math.max(1, dpsSupportCapacity),
        rating: medicalDays >= 10 ? 'AUTONOME' : (medicalDays >= 5 ? 'STABLE' : 'FLUX_TENDU')
      };
    }

    /**
     * Coûts d'entretien journalier (OPEX : Électricité, Chauffage, Maintenance ERP)
     */
    static _calculateDailyOpex(grid, rooms) {
      const totalSurface = rooms.reduce((acc, r) => acc + r.surfaceM2, 0);

      // Base énergétique au m² (0.12 €/m²/jour pour éclairage + CVC)
      const energyBaseCost = totalSurface * 0.12;

      // Entretien du mobilier technique (baies 230V, racks, etc.)
      const furnitureMaintenance = grid.furniture.reduce((acc, f) => {
        return acc + (FURNITURE_CATALOG[f.type]?.dailyMaintenance || 0.10);
      }, 0);

      // Conformité ERP & Sécurité (Vérifications extincteurs, TGBT, registres)
      const erpComplianceDaily = totalSurface >= 200 ? 6.50 : 3.50;

      const totalDailyOpex = parseFloat((energyBaseCost + furnitureMaintenance + erpComplianceDaily).toFixed(2));

      return {
        energyCostDaily: parseFloat(energyBaseCost.toFixed(2)),
        equipmentMaintenanceDaily: parseFloat(furnitureMaintenance.toFixed(2)),
        erpSafetyComplianceDaily: parseFloat(erpComplianceDaily.toFixed(2)),
        totalDailyOpexEuro: totalDailyOpex,
        monthlyProjectionEuro: Math.round(totalDailyOpex * 30.5)
      };
    }

    /**
     * Note de performance globale sur 100
     */
    static _calculateGlobalEfficiencyScore(data) {
      let score = 50; // Base neutre

      // 1. Réactivité départ (35 pts max)
      const chrono = data.dispatchFlow.totalDispatchTimeSeconds;
      if (chrono <= 35) score += 35;
      else if (chrono <= 55) score += 25;
      else if (chrono <= 80) score += 15;
      else score += 5;

      // 2. Capacité & Autonomie consommables (25 pts max)
      if (data.supplyMetrics.medicalAutonomyDays >= 12) score += 25;
      else if (data.supplyMetrics.medicalAutonomyDays >= 7) score += 18;
      else score += 8;

      // 3. Ergonomie des pièces (20 pts max)
      const hasGarage = data.rooms.some(r => r.type === RoomType.GARAGE);
      const hasLogistique = data.rooms.some(r => r.type === RoomType.LOGISTIQUE);
      const hasVie = data.rooms.some(r => r.type === RoomType.VIE);
      const hasAdmin = data.rooms.some(r => r.type === RoomType.FORMATION_ADMIN);

      let roomBonus = 0;
      if (hasGarage) roomBonus += 5;
      if (hasLogistique) roomBonus += 5;
      if (hasVie) roomBonus += 5;
      if (hasAdmin) roomBonus += 5;
      score += roomBonus;

      // 4. Maîtrise des coûts d'entretien (20 pts max)
      if (data.opexMetrics.totalDailyOpexEuro <= 25) score += 15;
      else if (data.opexMetrics.totalDailyOpexEuro <= 45) score += 10;
      else score += 5;

      return Math.min(100, Math.max(10, Math.round(score)));
    }

    static _getRoomsDistribution(rooms) {
      const dist = {};
      for (const r of rooms) {
        dist[r.type] = (dist[r.type] || 0) + 1;
      }
      return dist;
    }

    static _generateExecutiveSummary(score, dispatchFlow) {
      if (score >= 85) {
        return `Excellente configuration tactique (${score}%). Départ réflexe optimisé en ${dispatchFlow.totalDispatchTimeSeconds}s.`;
      }
      if (score >= 65) {
        return `Antenne fonctionnelle (${score}%). Bon équilibre opérationnel mais des gains sont possibles sur le flux de départ.`;
      }
      return `Configuration perfectible (${score}%). Goulots d'étranglement détectés entre le stockage et les baies véhicules.`;
    }

    static _generateTacticalRecommendations(data) {
      const recs = [];

      if (data.dispatchFlow.totalDispatchTimeSeconds > 60) {
        recs.push({
          type: 'OPTIMIZATION',
          icon: '🏃',
          title: 'Rapprocher les Vestiaires et le Stock du Garage',
          text: `La distance de marche actuelle (${data.dispatchFlow.totalWalkDistanceMeters}m) allonge le temps de départ. Positionnez les casiers F1 au plus près de la porte du garage.`
        });
      }

      if (data.supplyMetrics.medicalAutonomyDays < 7) {
        recs.push({
          type: 'SUPPLY',
          icon: '🩺',
          title: 'Installer une Armoire Pharmacie Sécurisée',
          text: 'Votre réserve ne permet que 3 à 5 jours d\'autonomie de soins. L\'ajout d\'une armoire DAE stabilise vos stocks pour les gros DPS.'
        });
      }

      if (data.capacityMetrics.nightDutyBedsCount === 0) {
        recs.push({
          type: 'PERSONNEL',
          icon: '🛏️',
          title: 'Créer un Espace Dortoir de Garde',
          text: 'Aucun lit d\'astreinte répertorié. Vos équipages ne peuvent pas assurer les gardes nocturnes 24h SAMU 15 sans épuisement.'
        });
      }

      if (recs.length === 0) {
        recs.push({
          type: 'SUCCESS',
          icon: '⭐',
          title: 'Agencement Certifié Conforme',
          text: 'Tous les flux de secours sont impeccablement dégagés. Prêt pour les déclenchements opérationnels réflexes.'
        });
      }

      return recs;
    }
  }

  // =========================================================================
  // 8. PONT D'INTEROPÉRABILITÉ AVEC LE PLAN D'ARCHITECTE EXISTANT
  // =========================================================================

  class BuildingLayoutBridge {
    /**
     * Convertit le modèle géométrique continu de l'antenne (locaux.js) en Grille 2D discrétisée
     * @param {Object} architectModel - Modèle CAD contenant rooms, walls, doors, furniture
     * @param {number} gridW - Largeur de la grille cible (ex: 20m)
     * @param {number} gridH - Hauteur de la grille cible (ex: 16m)
     * @returns {BuildingGrid}
     */
    static convertArchitectModelToGrid(architectModel, gridW = 20, gridH = 16) {
      const grid = new BuildingGrid(gridW, gridH);

      if (!architectModel) return grid;

      // 1. Convertir les murs
      if (Array.isArray(architectModel.walls)) {
        for (const w of architectModel.walls) {
          const x1 = Math.round(w.x1);
          const y1 = Math.round(w.y1);
          const x2 = Math.round(w.x2);
          const y2 = Math.round(w.y2);
          const state = w.outer ? CellState.LOAD_BEARING_WALL : CellState.PARTITION_WALL;

          // Tracer les segments de mur
          const dx = Math.sign(x2 - x1);
          const dy = Math.sign(y2 - y1);
          let cx = x1;
          let cy = y1;

          while (true) {
            grid.setCellState(cx, cy, state);
            if (cx === x2 && cy === y2) break;
            if (cx !== x2) cx += dx;
            if (cy !== y2) cy += dy;
          }
        }
      }

      // 2. Convertir les portes
      if (Array.isArray(architectModel.doors)) {
        for (const d of architectModel.doors) {
          const dx = Math.round(d.x);
          const dy = Math.round(d.y);
          grid.setCellState(dx, dy, CellState.DOOR, { label: d.label, isMain: d.isMain });
        }
      }

      // 3. Détecter et assigner les pièces
      RoomDetector.detectRooms(grid);

      // Si le modèle initial spécifiait des types de pièces, les aligner
      if (Array.isArray(architectModel.rooms)) {
        for (const r of architectModel.rooms) {
          const cx = Math.round(r.x + r.w / 2);
          const cy = Math.round(r.y + r.h / 2);
          const cell = grid.getCell(cx, cy);
          if (cell && cell.roomId) {
            const detectedRoom = grid.rooms.find(rm => rm.id === cell.roomId);
            if (detectedRoom) {
              const mappedType = BuildingLayoutBridge._mapLegacyRoleToRoomType(r.type);
              detectedRoom.type = mappedType;
              detectedRoom.name = r.name.split('\n')[0];
            }
          }
        }
      }

      // 4. Convertir le mobilier
      if (Array.isArray(architectModel.furniture)) {
        for (const item of architectModel.furniture) {
          const type = BuildingLayoutBridge._mapLegacyFurnitureType(item.type);
          const fx = Math.round(item.x);
          const fy = Math.round(item.y);
          FurnitureManager.placeFurniture(grid, type, fx, fy, Direction.NORTH);
        }
      }

      return grid;
    }

    static _mapLegacyRoleToRoomType(role) {
      switch (role) {
        case 'garage': return RoomType.GARAGE;
        case 'stockage': return RoomType.LOGISTIQUE;
        case 'formation': return RoomType.FORMATION_ADMIN;
        case 'bureau': return RoomType.FORMATION_ADMIN;
        case 'detente': return RoomType.VIE;
        case 'dortoir': return RoomType.VIE;
        case 'vestiaires': return RoomType.VIE;
        default: return RoomType.VIE;
      }
    }

    static _mapLegacyFurnitureType(type) {
      const mapping = {
        'etagere_lots': 'etagere_rack_lourd',
        'armoire_pharmacie': 'armoire_pharmacie_dae',
        'casiers_vestiaire': 'casiers_tenues_f1',
        'lit_garde': 'lit_garde_camp',
        'canape_detente': 'canape_foyer',
        'machine_cafe': 'machine_cafe',
        'table_formation': 'table_formation',
        'bureau': 'bureau_direction_pc'
      };
      return mapping[type] || 'etagere_rack_lourd';
    }
  }

  // =========================================================================
  // 9. API PUBLIQUE DU MODULE
  // =========================================================================

  return {
    CellState,
    RoomType,
    Direction,
    FURNITURE_CATALOG,
    BuildingGrid,
    RoomDetector,
    FurnitureManager,
    GridPathfinder,
    BuildingMetricsCalculator,
    BuildingLayoutBridge,

    /**
     * Point d'entrée utilitaire rapide pour analyser un bâtiment
     */
    analyzeLayout(architectModel) {
      const grid = BuildingLayoutBridge.convertArchitectModelToGrid(architectModel);
      return BuildingMetricsCalculator.computeFullMetrics(grid);
    }
  };
}));
