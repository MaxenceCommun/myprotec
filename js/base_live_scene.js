/**
 * =========================================================================
 * PROTEC LIVE - SCÈNE VIVANTE DE LA BASE (MOTEUR ISOMÉTRIQUE 2.5D TEMPS RÉEL)
 * =========================================================================
 *
 * Remplace le plan statique du module Locaux (hors mode Aménagement) par une
 * scène de jeu animée : les bénévoles de l'antenne sont des avatars qui se
 * déplacent entre les pièces et adoptent des routines liées à l'état réel du jeu.
 *
 * Architecture (aucune dépendance, Canvas 2D pur) :
 *   1. Projection isométrique 2:1 (monde en mètres -> écran)
 *   2. NavGrid  : grille de navigation 20 cm construite depuis le modèle architecte
 *                 (murs + portes + mobilier + véhicules) et pathfinding A* lissé
 *   3. POI      : points d'interaction générés depuis le mobilier (sièges, poste radio,
 *                 étagères, casiers, mannequins…) avec réservation exclusive
 *   4. Director : lit window.game (bénévoles, missions/DPS, gardes SAMU/CODIS,
 *                 sessions de formation, opérations logistiques) toutes les 500 ms
 *                 et calcule l'état cible de chaque bénévole
 *   5. Agents   : machine à états finis IDLE / MOVING / IN_TRAINING / LOGISTICS /
 *                 WAITING_CREW / ON_DUTY_WAIT
 *   6. Renderer : sol mis en cache (offscreen), tri topologique des volumes
 *                 (murs, mobilier, véhicules) avec insertion des avatars
 *
 * Point d'entrée : window.ProtecBaseLive (attach / detach / toggleLiveMode)
 * Données lues uniquement (jamais d'écriture dans l'état du jeu).
 */
(function () {
  'use strict';

  // =========================================================================
  // 0. CONSTANTES
  // =========================================================================

  const AgentState = Object.freeze({
    IDLE: 'IDLE',
    MOVING: 'MOVING',
    IN_TRAINING: 'IN_TRAINING',
    LOGISTICS: 'LOGISTICS',
    WAITING_CREW: 'WAITING_CREW',
    ON_DUTY_WAIT: 'ON_DUTY_WAIT'
  });

  const STATE_META = {
    IDLE:         { label: 'Vie de base',            icon: '☕', color: '#64748b' },
    MOVING:       { label: 'Déplacement',            icon: '🚶', color: '#0ea5e9' },
    IN_TRAINING:  { label: 'Formation',              icon: '🎓', color: '#2563eb' },
    LOGISTICS:    { label: 'Logistique',             icon: '📦', color: '#d97706' },
    WAITING_CREW: { label: 'Rassemblement départ',   icon: '⏱️', color: '#dc2626' },
    ON_DUTY_WAIT: { label: 'Garde active',           icon: '📻', color: '#059669' }
  };

  // Priorités d'affectation (la plus haute l'emporte)
  const PRIORITY = { WAITING_CREW: 90, IN_TRAINING: 70, LOGISTICS: 60, ON_DUTY_WAIT: 50, IDLE: 10 };

  // Statuts bénévoles = parti sur le terrain (embarquement si encore visible)
  const MISSION_AWAY = ['transit', 'mission', 'sur_les_lieux', 'in_transit', 'on_site', 'intervention', 'retrait', 'urgences_chu'];
  // Statuts bénévoles = absent de la base (domicile, repos…)
  const HOME_AWAY = ['repos', 'repos_legal', 'indispo', 'unavailable', 'sdis_astreinte', 'astreinte', 'conge', 'malade', 'suspendu', 'demission'];
  // Statuts véhicules = hors base
  const VEH_AWAY = ['transit', 'mission', 'sur_les_lieux', 'in_transit', 'on_site', 'intervention', 'en_route', 'retour', 'vendu', 'garage_externe'];

  const ROOM_ROLE_BY_TYPE = {
    formation: 'TRAINING', bureau: 'OFFICE', pc_radio: 'RADIO', stockage: 'STORAGE', reserve: 'STORAGE',
    garage: 'GARAGE', detente: 'LOUNGE', foyer: 'LOUNGE', dortoir: 'DORM', salle_garde: 'DORM',
    vestiaire: 'LOCKER', douche: 'SANITARY', wc: 'SANITARY', libre: 'FREE'
  };

  const CELL = 0.2;          // Taille de cellule de navigation (m)
  const AGENT_R = 0.16;      // Rayon de collision d'un avatar (m)
  const HZ = 1.05;           // Facteur d'échelle verticale de la projection
  const S_FLOOR = 20;        // Échelle virtuelle (px/m) pour réutiliser les routines de dessin 2D existantes
  const MAX_AGENTS = 22;
  const MAX_IDLE = 6;
  const MAX_CIVILIANS = 6;

  // =========================================================================
  // 1. UTILITAIRES
  // =========================================================================

  const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

  function hashStr(str) {
    let h = 2166136261 >>> 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shade(hex, f) {
    let c = String(hex || '#888888').replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const n = parseInt(c, 16);
    if (isNaN(n)) return hex;
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (f >= 0) {
      r = r + (255 - r) * f; g = g + (255 - g) * f; b = b + (255 - b) * f;
    } else {
      r = r * (1 + f); g = g * (1 + f); b = b * (1 + f);
    }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }

  function pickWeighted(rng, entries) {
    let total = 0;
    for (const e of entries) total += e.w;
    if (total <= 0) return null;
    let r = rng() * total;
    for (const e of entries) {
      r -= e.w;
      if (r <= 0) return e.v;
    }
    return entries[entries.length - 1].v;
  }

  function nowMs(game) {
    return Date.now() + ((game && game.serverTimeOffset) || 0);
  }

  function eventTs(ed) {
    if (!ed || ed.year === undefined) return null;
    return new Date(ed.year, ed.month || 0, ed.day || 1, ed.hour || 0, ed.minute || 0, 0).getTime();
  }

  function roleOfRoom(room) {
    if (!room) return 'FREE';
    const t = String(room.type || '').toLowerCase();
    if (ROOM_ROLE_BY_TYPE[t]) {
      if (t !== 'libre') return ROOM_ROLE_BY_TYPE[t];
    }
    const n = String(room.name || '').toLowerCase();
    if (n.includes('formation') || n.includes('cours')) return 'TRAINING';
    if (n.includes('radio') || n.includes('régulation') || n.includes('regulation') || n.includes('alerte')) return 'RADIO';
    if (n.includes('foyer') || n.includes('détente') || n.includes('detente') || n.includes('repos')) return 'LOUNGE';
    if (n.includes('réserve') || n.includes('reserve') || n.includes('stock') || n.includes('magasin') || n.includes('logist')) return 'STORAGE';
    if (n.includes('garage') || n.includes('remise') || n.includes('hangar')) return 'GARAGE';
    if (n.includes('vestiaire')) return 'LOCKER';
    if (n.includes('dortoir') || n.includes('garde')) return 'DORM';
    if (n.includes('bureau') || n.includes('accueil') || n.includes('direction')) return 'OFFICE';
    return ROOM_ROLE_BY_TYPE[t] || 'FREE';
  }

  // Tas binaire minimal pour A*
  class MinHeap {
    constructor() { this.k = []; this.v = []; }
    get size() { return this.k.length; }
    push(key, val) {
      const k = this.k, v = this.v;
      let i = k.length;
      k.push(key); v.push(val);
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (k[p] <= key) break;
        k[i] = k[p]; v[i] = v[p];
        i = p;
      }
      k[i] = key; v[i] = val;
    }
    pop() {
      const k = this.k, v = this.v;
      const top = v[0];
      const lk = k.pop(), lv = v.pop();
      if (k.length > 0) {
        let i = 0;
        const n = k.length;
        while (true) {
          let l = 2 * i + 1, r = l + 1, m = i;
          let mk = lk;
          if (l < n && k[l] < mk) { m = l; mk = k[l]; }
          if (r < n && k[r] < mk) { m = r; }
          if (m === i) break;
          k[i] = k[m]; v[i] = v[m];
          i = m;
        }
        k[i] = lk; v[i] = lv;
      }
      return top;
    }
  }

  // =========================================================================
  // 2. GRILLE DE NAVIGATION + PATHFINDING A*
  // =========================================================================

  class NavGrid {
    constructor(bounds) {
      this.minX = bounds.minX;
      this.minY = bounds.minY;
      this.cols = Math.ceil((bounds.maxX - bounds.minX) / CELL);
      this.rows = Math.ceil((bounds.maxY - bounds.minY) / CELL);
      this.walk = new Uint8Array(this.cols * this.rows).fill(1);
    }

    idx(c, r) { return r * this.cols + c; }
    inB(c, r) { return c >= 0 && r >= 0 && c < this.cols && r < this.rows; }
    toCell(x, y) { return [Math.floor((x - this.minX) / CELL), Math.floor((y - this.minY) / CELL)]; }
    center(c, r) { return [this.minX + (c + 0.5) * CELL, this.minY + (r + 0.5) * CELL]; }

    isWalkableCell(c, r) { return this.inB(c, r) && this.walk[this.idx(c, r)] === 1; }
    isWalkable(x, y) { const [c, r] = this.toCell(x, y); return this.isWalkableCell(c, r); }

    // Marque toutes les cellules dont le centre est dans le rectangle
    fillRect(x0, y0, x1, y1, val) {
      const c0 = Math.max(0, Math.floor((Math.min(x0, x1) - this.minX) / CELL - 0.5));
      const c1 = Math.min(this.cols - 1, Math.ceil((Math.max(x0, x1) - this.minX) / CELL));
      const r0 = Math.max(0, Math.floor((Math.min(y0, y1) - this.minY) / CELL - 0.5));
      const r1 = Math.min(this.rows - 1, Math.ceil((Math.max(y0, y1) - this.minY) / CELL));
      for (let r = r0; r <= r1; r++) {
        const cy = this.minY + (r + 0.5) * CELL;
        if (cy < Math.min(y0, y1) || cy > Math.max(y0, y1)) continue;
        for (let c = c0; c <= c1; c++) {
          const cx = this.minX + (c + 0.5) * CELL;
          if (cx < Math.min(x0, x1) || cx > Math.max(x0, x1)) continue;
          this.walk[this.idx(c, r)] = val;
        }
      }
    }

    nearestWalkable(x, y, maxR = 3) {
      if (this.isWalkable(x, y)) return [x, y];
      const [sc, sr] = this.toCell(x, y);
      const maxRing = Math.ceil(maxR / CELL);
      for (let ring = 1; ring <= maxRing; ring++) {
        let best = null, bestD = Infinity;
        for (let dr = -ring; dr <= ring; dr++) {
          for (let dc = -ring; dc <= ring; dc++) {
            if (Math.abs(dr) !== ring && Math.abs(dc) !== ring) continue;
            const c = sc + dc, r = sr + dr;
            if (!this.isWalkableCell(c, r)) continue;
            const [cx, cy] = this.center(c, r);
            const d = (cx - x) * (cx - x) + (cy - y) * (cy - y);
            if (d < bestD) { bestD = d; best = [cx, cy]; }
          }
        }
        if (best) return best;
      }
      return null;
    }

    lineOfSight(ax, ay, bx, by) {
      const d = dist(ax, ay, bx, by);
      const steps = Math.max(1, Math.ceil(d / (CELL * 0.45)));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        if (!this.isWalkable(ax + (bx - ax) * t, ay + (by - ay) * t)) return false;
      }
      return true;
    }

    findPath(ax, ay, bx, by) {
      const start = this.nearestWalkable(ax, ay, 2);
      const goal = this.nearestWalkable(bx, by, 2.5);
      if (!start || !goal) return null;
      const [sc, sr] = this.toCell(start[0], start[1]);
      const [gc, gr] = this.toCell(goal[0], goal[1]);
      const N = this.cols * this.rows;
      const sIdx = this.idx(sc, sr), gIdx = this.idx(gc, gr);
      if (sIdx === gIdx) return [[goal[0], goal[1]], [bx, by]];

      const g = new Float32Array(N).fill(Infinity);
      const came = new Int32Array(N).fill(-1);
      const closed = new Uint8Array(N);
      const heap = new MinHeap();
      const h = (c, r) => {
        const dx = Math.abs(c - gc), dy = Math.abs(r - gr);
        return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
      };
      g[sIdx] = 0;
      heap.push(h(sc, sr), sIdx);
      const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
      let found = false, iter = 0;
      while (heap.size > 0 && iter++ < 60000) {
        const cur = heap.pop();
        if (closed[cur]) continue;
        if (cur === gIdx) { found = true; break; }
        closed[cur] = 1;
        const c = cur % this.cols, r = (cur / this.cols) | 0;
        for (const [dc, dr, cost] of DIRS) {
          const nc = c + dc, nr = r + dr;
          if (!this.isWalkableCell(nc, nr)) continue;
          // Pas de coupe de coin en diagonale (évite de raser les murs)
          if (dc !== 0 && dr !== 0 && (!this.isWalkableCell(c + dc, r) || !this.isWalkableCell(c, r + dr))) continue;
          const ni = this.idx(nc, nr);
          if (closed[ni]) continue;
          const ng = g[cur] + cost;
          if (ng < g[ni]) {
            g[ni] = ng;
            came[ni] = cur;
            heap.push(ng + h(nc, nr), ni);
          }
        }
      }
      if (!found) return null;

      const cells = [];
      let cur = gIdx;
      while (cur !== -1) {
        cells.push(this.center(cur % this.cols, (cur / this.cols) | 0));
        if (cur === sIdx) break;
        cur = came[cur];
      }
      cells.reverse();
      cells[0] = [start[0], start[1]];

      // Lissage "string pulling" par ligne de vue
      const out = [cells[0]];
      let anchor = 0;
      for (let i = 2; i < cells.length; i++) {
        const a = cells[anchor];
        if (!this.lineOfSight(a[0], a[1], cells[i][0], cells[i][1])) {
          out.push(cells[i - 1]);
          anchor = i - 1;
        }
      }
      out.push(cells[cells.length - 1]);
      // Dernier segment exact vers la cible (siège, poste… éventuellement non marchable)
      if (dist(goal[0], goal[1], bx, by) > 0.01) out.push([bx, by]);
      return out;
    }
  }

  // =========================================================================
  // 3. MODÈLE DU MONDE (géométrie, véhicules, POI)
  // =========================================================================

  const PASSABLE_DOOR = (d) => !d.type || ['door', 'double_door', 'garage_shutter', 'porte', 'main'].includes(d.type) || !['glass_partition', 'bay_window', 'window'].includes(d.type);

  function doorRect(d, pad) {
    const len = Number(d.len) || 0.83;
    if (d.wall === 'W' || d.wall === 'E') return { x0: d.x - pad, x1: d.x + pad, y0: d.y, y1: d.y + len, vertical: true };
    return { x0: d.x, x1: d.x + len, y0: d.y - pad, y1: d.y + pad, vertical: false };
  }

  // Hauteurs & teintes du mobilier pour l'extrusion isométrique
  const FURN_STYLE = {
    bureau:            { h: 0.76, kind: 'table', color: '#475569' },
    chaise:            { h: 0.46, kind: 'chair', color: '#0284c7' },
    table_formation:   { h: 0.74, kind: 'table', color: '#ea580c' },
    table_repas_equipe:{ h: 0.74, kind: 'table', color: '#b45309' },
    tableau_blanc:     { h: 1.9, kind: 'panel', color: '#f8fafc', z0: 0.8 },
    ecran_tactique_interactif: { h: 1.85, kind: 'panel', color: '#0f172a', z0: 0.75 },
    tv_foyer:          { h: 1.75, kind: 'panel', color: '#0f172a', z0: 1.0 },
    mannequin_rcp:     { h: 0.14, kind: 'mannequin', color: '#f59e0b' },
    mannequin_pediatrique: { h: 0.12, kind: 'mannequin', color: '#fb923c' },
    dsa_demonstration: { h: 0.35, kind: 'box', color: '#10b981' },
    dae_mural:         { h: 1.5, kind: 'box', color: '#10b981', z0: 1.1 },
    armoire_pharmacie: { h: 1.8, kind: 'cabinet', color: '#dc2626' },
    armoire_forte_securisee: { h: 1.8, kind: 'cabinet', color: '#334155' },
    etagere_lots:      { h: 1.9, kind: 'shelf', color: '#475569' },
    rack_palettes_lourd:{ h: 2.2, kind: 'shelf', color: '#1e293b' },
    casiers_vestiaire: { h: 1.85, kind: 'lockers', color: '#1e3a8a' },
    casiers_tenues_xl: { h: 1.85, kind: 'lockers', color: '#1e3a8a' },
    lit_garde:         { h: 0.45, kind: 'bed', color: '#a855f7' },
    lits_superposes:   { h: 1.6, kind: 'bunk', color: '#6d28d9' },
    canape_detente:    { h: 0.42, kind: 'sofa', color: '#059669' },
    machine_cafe:      { h: 1.25, kind: 'box', color: '#92400e' },
    distributeur_snacks:{ h: 1.8, kind: 'vending', color: '#dc2626' },
    kitchenette_foyer: { h: 0.92, kind: 'counter', color: '#0f766e' },
    babyfoot:          { h: 0.9, kind: 'gametable', color: '#16a34a' },
    ping_pong:         { h: 0.76, kind: 'gametable', color: '#0284c7' },
    console_jeux:      { h: 0.55, kind: 'box', color: '#6366f1' }
  };

  class WorldModel {
    constructor(model, vehicles) {
      this.model = model || {};
      this.rooms = (this.model.rooms || []).map(r => ({ ...r, role: roleOfRoom(r), altRoles: [] }));
      this.assignFallbackRoles();
      this.walls = this.model.walls || [];
      this.doors = this.model.doors || [];
      this.windows = this.model.windows || [];
      this.furniture = (this.model.furniture || []).filter(f => f && isFinite(f.x) && isFinite(f.y) && f.w > 0 && f.d > 0);
      this.parking = this.model.parking || null;
      this.vehicles = vehicles || [];
      this.computeBounds();
      this.buildWallPieces();
      this.buildNav();
      this.buildPOIs();
    }

    computeBounds() {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const add = (x, y) => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); };
      this.rooms.forEach(r => { add(r.x, r.y); add(r.x + r.w, r.y + r.h); });
      this.walls.forEach(w => { add(w.x1, w.y1); add(w.x2, w.y2); });
      if (this.parking) { add(this.parking.x, this.parking.y); add(this.parking.x + this.parking.w, this.parking.y + this.parking.h); }
      if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 16; maxY = 12; }
      // Bâtiment seul (pour hauteur des murs de fond)
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      this.rooms.forEach(r => { bx0 = Math.min(bx0, r.x); by0 = Math.min(by0, r.y); bx1 = Math.max(bx1, r.x + r.w); by1 = Math.max(by1, r.y + r.h); });
      if (!isFinite(bx0)) { bx0 = minX; by0 = minY; bx1 = maxX; by1 = maxY; }
      this.building = { x0: bx0, y0: by0, x1: bx1, y1: by1, cx: (bx0 + bx1) / 2, cy: (by0 + by1) / 2 };
      this.site = { minX, minY, maxX, maxY };
      // Rue d'accès du côté du parking (le bâtiment est en retrait)
      let side = 'W';
      if (this.parking) {
        const dx = (this.parking.x + this.parking.w / 2) - this.building.cx;
        const dy = (this.parking.y + this.parking.h / 2) - this.building.cy;
        side = Math.abs(dx) >= Math.abs(dy) ? (dx <= 0 ? 'W' : 'E') : (dy <= 0 ? 'N' : 'S');
      }
      this.roadSide = side;
      this.roadVertical = side === 'W' || side === 'E';
      const margin = 1.6;
      const roadW = 3.2;
      const R = {
        W: { x0: minX - margin - roadW, x1: minX - margin, y0: minY - 3, y1: maxY + 3 },
        E: { x0: maxX + margin, x1: maxX + margin + roadW, y0: minY - 3, y1: maxY + 3 },
        N: { x0: minX - 3, x1: maxX + 3, y0: minY - margin - roadW, y1: minY - margin },
        S: { x0: minX - 3, x1: maxX + 3, y0: maxY + margin, y1: maxY + margin + roadW }
      };
      this.road = R[side];
      this.bounds = {
        minX: Math.min(minX - margin, this.road.x0) - 0.4,
        maxX: Math.max(maxX + margin, this.road.x1) + 0.4,
        minY: Math.min(minY - margin, this.road.y0) - 0.4,
        maxY: Math.max(maxY + margin, this.road.y1) + 0.4
      };
      if (this.roadVertical) { this.bounds.minY = minY - margin - 0.4; this.bounds.maxY = maxY + margin + 0.4; }
      else { this.bounds.minX = minX - margin - 0.4; this.bounds.maxX = maxX + margin + 0.4; }
      // Point d'apparition piéton (trottoir, au bout de la rue visible)
      const sp = {
        W: [this.road.x1 - 0.5, this.bounds.maxY - 0.6],
        E: [this.road.x0 + 0.5, this.bounds.maxY - 0.6],
        N: [this.bounds.maxX - 0.6, this.road.y1 - 0.5],
        S: [this.bounds.maxX - 0.6, this.road.y0 + 0.5]
      };
      this.spawnPoint = sp[side];
    }

    // Pièces "libres" non affectées : on leur attribue un usage de repli pour que la vie de base reste crédible
    assignFallbackRoles() {
      const has = (role) => this.rooms.some(r => r.role === role);
      const free = this.rooms.filter(r => r.role === 'FREE' || r.role === 'OFFICE').sort((a, b) => (b.w * b.h) - (a.w * a.h));
      if (!free.length) return;
      const plan = [
        ['TRAINING', () => free[0]],
        ['LOUNGE', () => free[1] || free[0]],
        ['RADIO', () => free[free.length - 1]],
        ['STORAGE', () => this.rooms.find(r => r.role === 'GARAGE') || free[0]],
        ['LOCKER', () => this.rooms.find(r => r.role === 'STORAGE') || free[0]]
      ];
      plan.forEach(([role, pick]) => {
        if (has(role)) return;
        const r = pick();
        if (r && r.role !== role && !r.altRoles.includes(role)) r.altRoles.push(role);
      });
    }

    roomHasRole(room, role) { return !!room && (room.role === role || (room.altRoles || []).includes(role)); }

    roomAt(x, y) {
      for (const r of this.rooms) {
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r;
      }
      return null;
    }

    insideBuilding(x, y) { return !!this.roomAt(x, y); }

    // Découpe des murs en tronçons (trous de portes, fenêtres, linteaux) pour le rendu
    buildWallPieces() {
      const pieces = [];
      const b = this.building;
      const segOverlaps = (w, items) => {
        const vertical = Math.abs(w.x1 - w.x2) < 0.01;
        const res = [];
        items.forEach(it => {
          const itVertical = it.wall === 'W' || it.wall === 'E';
          if (itVertical !== vertical) return;
          const len = Number(it.len) || 0.83;
          if (vertical) {
            if (Math.abs(it.x - w.x1) > 0.2) return;
            const lo = Math.min(w.y1, w.y2), hi = Math.max(w.y1, w.y2);
            const a = Math.max(lo, it.y), c = Math.min(hi, it.y + len);
            if (c - a > 0.05) res.push({ a, b: c, it });
          } else {
            if (Math.abs(it.y - w.y1) > 0.2) return;
            const lo = Math.min(w.x1, w.x2), hi = Math.max(w.x1, w.x2);
            const a = Math.max(lo, it.x), c = Math.min(hi, it.x + len);
            if (c - a > 0.05) res.push({ a, b: c, it });
          }
        });
        return res.sort((p, q) => p.a - q.a);
      };

      this.walls.forEach(w => {
        const vertical = Math.abs(w.x1 - w.x2) < 0.01;
        const horizontal = Math.abs(w.y1 - w.y2) < 0.01;
        if (!vertical && !horizontal) return;
        const th = Number(w.th) || 0.15;
        const lo = vertical ? Math.min(w.y1, w.y2) : Math.min(w.x1, w.x2);
        const hi = vertical ? Math.max(w.y1, w.y2) : Math.max(w.x1, w.x2);
        const isBack = !!w.outer && (vertical ? w.x1 <= b.cx : w.y1 <= b.cy);
        const tall = isBack;
        const holes = segOverlaps(w, this.doors).map(h => ({ ...h, kind: 'door' }))
          .concat(segOverlaps(w, this.windows).map(h => ({ ...h, kind: 'window' })))
          .sort((p, q) => p.a - q.a);
        const mk = (a, c, extra) => {
          if (c - a < 0.02) return;
          const box = vertical
            ? { x0: w.x1 - th / 2, x1: w.x1 + th / 2, y0: a, y1: c }
            : { x0: a, x1: c, y0: w.y1 - th / 2, y1: w.y1 + th / 2 };
          pieces.push({ type: 'wall', ...box, outer: !!w.outer, tall, ...extra });
        };
        let cur = lo;
        holes.forEach(hl => {
          if (hl.a > cur) mk(cur, hl.a, {});
          if (hl.kind === 'door') {
            const dType = hl.it.type || 'door';
            if (!PASSABLE_DOOR(hl.it)) mk(hl.a, hl.b, { glass: true });
            else mk(hl.a, hl.b, { door: dType, lintel: true });
          } else {
            mk(hl.a, hl.b, { windowPane: true });
          }
          cur = Math.max(cur, hl.b);
        });
        if (cur < hi) mk(cur, hi, {});
      });
      this.wallPieces = pieces;
    }

    buildNav() {
      const nav = new NavGrid(this.bounds);
      this.nav = nav;
      const pad = AGENT_R;
      // Murs
      this.walls.forEach(w => {
        const th = Number(w.th) || 0.15;
        const x0 = Math.min(w.x1, w.x2) - th / 2 - pad, x1 = Math.max(w.x1, w.x2) + th / 2 + pad;
        const y0 = Math.min(w.y1, w.y2) - th / 2 - pad, y1 = Math.max(w.y1, w.y2) + th / 2 + pad;
        nav.fillRect(x0, y0, x1, y1, 0);
      });
      // Portes franchissables (percement de l'ouverture dans la bande bloquée)
      this.doors.forEach(d => {
        if (!PASSABLE_DOOR(d)) return;
        const r = doorRect(d, 0.45);
        const shrink = 0.06;
        if (r.vertical) nav.fillRect(r.x0, r.y0 + shrink, r.x1, r.y1 - shrink, 1);
        else nav.fillRect(r.x0 + shrink, r.y0, r.x1 - shrink, r.y1, 1);
      });
      // Mobilier
      this.furniture.forEach(f => {
        const st = FURN_STYLE[f.type];
        if (st && (st.z0 || 0) >= 1.0) return; // éléments muraux en hauteur
        nav.fillRect(f.x - 0.06, f.y - 0.06, f.x + f.w + 0.06, f.y + f.d + 0.06, 0);
      });
      // Véhicules garés
      this.vehicles.forEach(v => {
        if (!v.present) return;
        nav.fillRect(v.box.x0 - 0.1, v.box.y0 - 0.1, v.box.x1 + 0.1, v.box.y1 + 0.1, 0);
      });
    }

    // Côté "accessible" d'un meuble : milieu d'arête marchable le plus proche du centre de la pièce
    accessPoints(f, off, opts = {}) {
      const room = this.roomAt(f.x + f.w / 2, f.y + f.d / 2);
      const rc = room ? [room.x + room.w / 2, room.y + room.h / 2] : [f.x + f.w / 2, f.y + f.d / 2 + 1];
      const cx = f.x + f.w / 2, cy = f.y + f.d / 2;
      const sides = [
        { side: 'N', x: cx, y: f.y - off, face: Math.PI / 2, len: f.w },
        { side: 'S', x: cx, y: f.y + f.d + off, face: -Math.PI / 2, len: f.w },
        { side: 'W', x: f.x - off, y: cy, face: 0, len: f.d },
        { side: 'E', x: f.x + f.w + off, y: cy, face: Math.PI, len: f.d }
      ];
      let cands = sides.filter(s => this.nav.isWalkable(s.x, s.y));
      if (opts.longSides) {
        const longIsW = f.w >= f.d;
        cands = cands.filter(s => longIsW ? (s.side === 'N' || s.side === 'S') : (s.side === 'W' || s.side === 'E'));
      }
      cands.forEach(s => { s.score = -dist(s.x, s.y, rc[0], rc[1]); });
      cands.sort((a, b) => b.score - a.score);
      return cands;
    }

    buildPOIs() {
      const pois = [];
      let n = 0;
      const SOFT = ['wander', 'yard', 'gather_yard'];
      const add = (p) => {
        // Deux postes ne se superposent jamais (le premier déclaré l'emporte)
        if (!SOFT.includes(p.kind) && pois.some(q => !SOFT.includes(q.kind) && Math.abs(q.x - p.x) < 0.42 && Math.abs(q.y - p.y) < 0.42)) return null;
        if (SOFT.includes(p.kind) && pois.some(q => !SOFT.includes(q.kind) && Math.abs(q.x - p.x) < 0.4 && Math.abs(q.y - p.y) < 0.4)) return null;
        p.id = `poi_${n++}`; p.occupant = null; p.room = this.roomAt(p.x, p.y) || (p.furnitureId ? this.roomAt(p.fx, p.fy) : null); p.role = p.room ? p.room.role : 'EXTERIOR'; pois.push(p); return p;
      };

      this.furniture.forEach(f => {
        const cx = f.x + f.w / 2, cy = f.y + f.d / 2;
        const base = { furnitureId: f.id, fx: cx, fy: cy };
        const room = this.roomAt(cx, cy);
        const role = room ? room.role : 'FREE';
        const t = f.type;
        f._front = null;
        if (t === 'chaise') {
          const tgt = room ? [room.x + room.w / 2, room.y + room.h / 2] : [cx, cy + 1];
          add({ ...base, x: cx, y: cy, face: Math.atan2(tgt[1] - cy, tgt[0] - cx), kind: role === 'TRAINING' ? 'study_seat' : 'seat', pose: 'sit', seatOn: f.id });
        } else if (t === 'table_formation' || t === 'table_repas_equipe') {
          const kind = t === 'table_formation' ? 'study_seat' : 'lounge_seat';
          const longIsW = f.w >= f.d;
          const L = longIsW ? f.w : f.d;
          const nSeats = Math.max(1, Math.floor(L / 0.62));
          ['A', 'B'].forEach(sideKey => {
            for (let i = 0; i < nSeats; i++) {
              const u = (i + 0.5) / nSeats;
              let x, y, face;
              if (longIsW) {
                x = f.x + u * f.w;
                y = sideKey === 'A' ? f.y - 0.38 : f.y + f.d + 0.38;
                face = sideKey === 'A' ? Math.PI / 2 : -Math.PI / 2;
              } else {
                y = f.y + u * f.d;
                x = sideKey === 'A' ? f.x - 0.38 : f.x + f.w + 0.38;
                face = sideKey === 'A' ? 0 : Math.PI;
              }
              if (this.nav.isWalkable(x, y)) add({ ...base, x, y, face, kind, pose: 'sit', stool: true });
            }
          });
        } else if (t === 'canape_detente') {
          const acc = this.accessPoints(f, 0.5)[0];
          const longIsW = f.w >= f.d;
          const L = longIsW ? f.w : f.d;
          const nSeats = Math.max(1, Math.floor(L / 0.7));
          const face = acc ? acc.face : -Math.PI / 2;
          f._front = acc ? acc.side : 'S';
          for (let i = 0; i < nSeats; i++) {
            const u = (i + 0.5) / nSeats;
            const x = longIsW ? f.x + u * f.w : cx;
            const y = longIsW ? cy : f.y + u * f.d;
            add({ ...base, x, y, face, kind: 'lounge_seat', pose: 'sit', seatOn: f.id });
          }
        } else if (t === 'lit_garde' || t === 'lits_superposes') {
          add({ ...base, x: cx, y: cy, face: 0, kind: 'bed', pose: 'sleep', seatOn: f.id, bed: f });
        } else if (t === 'babyfoot' || t === 'ping_pong') {
          const longIsW = f.w >= f.d;
          const ends = longIsW
            ? [[f.x - 0.35, cy, 0], [f.x + f.w + 0.35, cy, Math.PI]]
            : [[cx, f.y - 0.35, Math.PI / 2], [cx, f.y + f.d + 0.35, -Math.PI / 2]];
          ends.forEach(([x, y, face]) => { if (this.nav.isWalkable(x, y)) add({ ...base, x, y, face, kind: 'game', pose: 'play' }); });
        } else {
          let kind = null, pose = 'stand', off = 0.38;
          if (t === 'machine_cafe' || t === 'distributeur_snacks' || t === 'kitchenette_foyer') { kind = 'coffee'; pose = 'coffee'; }
          else if (t === 'tv_foyer') { kind = 'lounge_spot'; pose = 'watch'; off = 1.4; }
          else if (t === 'console_jeux') { kind = 'game'; pose = 'play'; off = 0.9; }
          else if (t === 'bureau') { kind = role === 'RADIO' ? 'radio_desk' : 'desk'; pose = 'desk'; off = 0.42; }
          else if (t === 'tableau_blanc' || t === 'ecran_tactique_interactif') { kind = 'teach'; pose = 'teach'; off = 0.65; }
          else if (t === 'mannequin_rcp' || t === 'mannequin_pediatrique') { kind = 'practice'; pose = 'cpr'; off = 0.32; }
          else if (t === 'dsa_demonstration') { kind = 'practice'; pose = 'kneel'; off = 0.35; }
          else if (['etagere_lots', 'rack_palettes_lourd', 'armoire_pharmacie', 'armoire_forte_securisee', 'dae_mural'].includes(t)) { kind = 'storage'; pose = 'shelf'; off = 0.42; }
          else if (t === 'casiers_vestiaire' || t === 'casiers_tenues_xl') { kind = 'locker'; pose = 'locker'; off = 0.42; }
          if (kind) {
            const cands = this.accessPoints(f, off, { longSides: ['etagere_lots', 'casiers_vestiaire', 'rack_palettes_lourd', 'kitchenette_foyer', 'mannequin_rcp'].includes(t) });
            if (cands.length) {
              f._front = cands[0].side;
              const s = cands[0];
              // Grands meubles : plusieurs postes le long de la face accessible
              const slots = (kind === 'storage' || kind === 'locker') ? Math.max(1, Math.min(3, Math.floor(s.len / 0.8))) : 1;
              for (let i = 0; i < slots; i++) {
                const u = slots === 1 ? 0.5 : (i + 0.5) / slots;
                let x = s.x, y = s.y;
                if (s.side === 'N' || s.side === 'S') x = f.x + u * f.w;
                else y = f.y + u * f.d;
                if (this.nav.isWalkable(x, y)) add({ ...base, x, y, face: s.face, kind, pose });
              }
              if (kind === 'radio_desk' || kind === 'desk') {
                // Bureau : le siège est derrière, face au meuble
              }
            }
          }
        }
      });

      // Points de déambulation & POI virtuels par pièce
      this.rooms.forEach(room => {
        const pts = [];
        const step = 0.9;
        for (let y = room.y + 0.6; y < room.y + room.h - 0.4; y += step) {
          for (let x = room.x + 0.6; x < room.x + room.w - 0.4; x += step) {
            if (this.nav.isWalkable(x, y) && this.nav.isWalkable(x + 0.2, y) && this.nav.isWalkable(x, y + 0.2)) pts.push([x, y]);
          }
        }
        pts.forEach(([x, y]) => add({ x, y, face: null, kind: 'wander', pose: 'stand', roomId: room.id }));

        const hasKind = (k) => pois.some(p => p.kind === k && p.room && p.room.id === room.id);
        const is = (role) => this.roomHasRole(room, role);
        // Salle de formation sans mobilier : rangs de stagiaires debout + poste formateur virtuel
        if (is('TRAINING')) {
          if (!hasKind('teach')) {
            const tx = room.x + room.w / 2, ty = room.y + 0.75;
            if (this.nav.isWalkable(tx, ty)) add({ x: tx, y: ty, face: Math.PI / 2, kind: 'teach', pose: 'teach', virtual: true });
          }
          if (!hasKind('study_seat')) {
            pts.filter(([, y]) => y > room.y + 1.4).slice(0, 10).forEach(([x, y]) => add({ x, y, face: -Math.PI / 2, kind: 'study_seat', pose: 'stand', virtual: true }));
          }
          if (!hasKind('practice')) {
            pts.filter(([, y]) => y > room.y + 1.4).slice(-3).forEach(([x, y]) => add({ x, y, face: -Math.PI / 2, kind: 'practice', pose: 'cpr', virtual: true, floorMannequin: true }));
          }
        }
        if (is('LOUNGE') && !hasKind('lounge_seat')) {
          pts.slice(0, 6).forEach(([x, y]) => add({ x, y, face: null, kind: 'lounge_spot', pose: 'chat', virtual: true }));
        }
        if (is('RADIO') && !hasKind('radio_desk')) {
          const tx = room.x + room.w / 2, ty = room.y + 0.7;
          if (this.nav.isWalkable(tx, ty)) add({ x: tx, y: ty, face: Math.PI / 2, kind: 'radio_desk', pose: 'stand_radio', virtual: true });
        }
        if ((is('STORAGE') || is('GARAGE')) && !hasKind('storage')) {
          pts.filter(([x, y]) => x < room.x + 1.2 || y < room.y + 1.2).slice(0, 4).forEach(([x, y]) => add({ x, y, face: x < room.x + 1.2 ? Math.PI : -Math.PI / 2, kind: 'storage', pose: 'shelf', virtual: true }));
        }
      });

      // Cour extérieure : points d'attente devant l'entrée principale
      const main = this.doors.find(d => d.isMain) || this.doors[0];
      this.mainDoor = main || null;
      if (main) {
        const r = doorRect(main, 0);
        const mx = (r.x0 + r.x1) / 2, my = (r.y0 + r.y1) / 2;
        const outward = [];
        if (r.vertical) outward.push([mx - 0.9, my], [mx + 0.9, my]);
        else outward.push([mx, my - 0.9], [mx, my + 0.9]);
        const outside = outward.find(([x, y]) => !this.insideBuilding(x, y) && this.nav.isWalkable(x, y));
        this.mainDoorOutside = outside || null;
        if (outside) {
          for (let i = 0; i < 6; i++) {
            const a = i / 6 * Math.PI * 2;
            const x = outside[0] + Math.cos(a) * 1.1, y = outside[1] + Math.sin(a) * 1.1;
            if (this.nav.isWalkable(x, y) && !this.insideBuilding(x, y)) add({ x, y, face: null, kind: 'gather_yard', pose: 'wait' });
          }
        }
      }
      // Cour : déambulation extérieure (pause dehors)
      if (this.parking) {
        const pk = this.parking;
        for (let i = 0; i < 4; i++) {
          const x = pk.x + 0.5 + (i % 2) * (pk.w - 1), y = pk.y + pk.h - 0.5 - Math.floor(i / 2) * 0.8;
          if (this.nav.isWalkable(x, y)) add({ x, y, face: null, kind: 'yard', pose: 'stand' });
        }
      }

      // Véhicules : hayon arrière (chargement), portes (embarquement), points de rassemblement
      this.vehicles.forEach(v => {
        if (!v.present) return;
        const b = v.box;
        const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
        const base = { vehicleId: v.id };
        const cand = [];
        v.rear = v.horizontal ? (this.roadSide === 'E' ? 'W' : 'E') : (this.roadSide === 'S' ? 'N' : 'S');
        if (v.horizontal) {
          // Nez côté rue, hayon côté opposé
          const noseWest = v.rear === 'E';
          const rearX = noseWest ? b.x1 + 0.45 : b.x0 - 0.45;
          const faceRear = noseWest ? Math.PI : 0;
          cand.push({ x: rearX, y: cy, face: faceRear, kind: 'load', pose: 'shelf' });
          cand.push({ x: rearX, y: cy - 0.55, face: faceRear, kind: 'load', pose: 'shelf' });
          cand.push({ x: cx, y: b.y1 + 0.4, face: -Math.PI / 2, kind: 'board', pose: 'stand' });
          cand.push({ x: cx, y: b.y0 - 0.4, face: Math.PI / 2, kind: 'board', pose: 'stand' });
          [[rearX + (noseWest ? 0.5 : -0.5), cy + 0.6], [rearX + (noseWest ? 0.5 : -0.5), cy - 0.6], [cx + 0.9, b.y1 + 0.75], [cx - 0.3, b.y1 + 0.75], [cx + 0.9, b.y0 - 0.75], [cx - 0.3, b.y0 - 0.75]].forEach(([x, y]) => {
            cand.push({ x, y, face: Math.atan2(cy - y, cx - x), kind: 'gather', pose: 'wait' });
          });
          cand.push({ x: cx - 0.6, y: b.y1 + 0.45, face: -Math.PI / 2, kind: 'bagcheck', pose: 'kneel' });
        } else {
          const south = v.rear === 'S';
          const rearY = south ? b.y1 + 0.45 : b.y0 - 0.45;
          const fr = south ? -Math.PI / 2 : Math.PI / 2;
          cand.push({ x: cx, y: rearY, face: fr, kind: 'load', pose: 'shelf' });
          cand.push({ x: cx + 0.5, y: rearY, face: fr, kind: 'load', pose: 'shelf' });
          cand.push({ x: b.x1 + 0.4, y: cy, face: Math.PI, kind: 'board', pose: 'stand' });
          cand.push({ x: b.x0 - 0.4, y: cy, face: 0, kind: 'board', pose: 'stand' });
          [[cx - 0.6, rearY + (south ? 0.5 : -0.5)], [cx + 0.6, rearY + (south ? 0.5 : -0.5)], [b.x1 + 0.75, cy + 0.9], [b.x1 + 0.75, cy - 0.3], [b.x0 - 0.75, cy + 0.9], [b.x0 - 0.75, cy - 0.3]].forEach(([x, y]) => {
            cand.push({ x, y, face: Math.atan2(cy - y, cx - x), kind: 'gather', pose: 'wait' });
          });
          cand.push({ x: b.x1 + 0.45, y: cy + 0.6, face: Math.PI, kind: 'bagcheck', pose: 'kneel' });
        }
        cand.forEach(c => { if (this.nav.isWalkable(c.x, c.y)) add({ ...base, ...c }); });
      });

      this.pois = pois;
    }
  }

  // =========================================================================
  // 4. DIRECTOR : LIEN AVEC L'ÉTAT DU JEU (lecture seule)
  // =========================================================================

  const Director = {
    stationOf(game, locaux) {
      if (!game || !Array.isArray(game.stations) || game.stations.length === 0) return null;
      const sid = locaux && locaux.currentStationId;
      return game.stations.find(s => s.id === sid) || game.stations[0];
    },

    stationVehicles(game, st) {
      if (!game || !Array.isArray(game.vehicles) || !st) return [];
      // Même règle d'affectation aux places que le plan 2D existant (render2D)
      return game.vehicles.filter(v => (st.vehicles || []).includes(v.id) || v.stationId === st.id);
    },

    stationVolunteers(game, st) {
      const vols = Array.isArray(game && game.volunteers) ? game.volunteers : [];
      if (!st) return vols;
      const multi = (game.stations || []).length > 1;
      return vols.filter(v => !multi || !v.stationId || v.stationId === st.id || (st.volunteers || []).includes(v.id));
    },

    isPresenceSlot(vol, game, now) {
      const d = new Date(now);
      const h = d.getHours();
      const dow = d.getDay();
      const weekend = dow === 0 || dow === 6;
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const staff = ['salarie', 'service_civique'].includes(vol.contractType) || ['salarie', 'service_civique'].includes(vol.dispoType);
      let p;
      if (h < 7 || h >= 23) p = 0.02;
      else if (staff && !weekend && h >= 8 && h < 18) p = 0.85;
      else if (weekend) p = h >= 9 && h < 20 ? 0.32 : 0.12;
      else if (h >= 18) p = 0.3;
      else p = 0.08;
      if (Array.isArray(vol.dispoJours) && vol.dispoJours.length) p *= vol.dispoJours.includes(days[dow]) ? 1.25 : 0.45;
      if (typeof vol.energy === 'number' && vol.energy < 25) p *= 0.4;
      const slot = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${Math.floor(h / 2)}`;
      return (hashStr(`${vol.id}|${slot}`) / 4294967296) < Math.min(0.95, p);
    },

    /**
     * Retourne { assignments: Map<volId, assignment>, civilians, alerts, vehicleOps }
     * assignment = { state, priority, role?, missionId?, vehicleId?, label?, phase? }
     */
    compute(game, locaux) {
      const out = { assignments: new Map(), civilians: 0, alerts: [], station: null, trainingActive: false, guardLabel: null };
      if (!game) return out;
      const st = this.stationOf(game, locaux);
      out.station = st;
      const now = nowMs(game);
      const vols = this.stationVolunteers(game, st);
      const volById = new Map(vols.map(v => [v.id, v]));
      const missions = (Array.isArray(game.missions) ? game.missions : []).filter(m => m && (!m.stationId || !st || m.stationId === st.id));
      const set = (vid, a) => {
        const vol = volById.get(vid);
        if (!vol) return false;
        const status = vol.status || 'dispo';
        if (MISSION_AWAY.includes(status) || HOME_AWAY.includes(status)) return false;
        const cur = out.assignments.get(vid);
        if (cur && cur.priority >= a.priority) return false;
        out.assignments.set(vid, a);
        return true;
      };

      // --- 1. Alertes / départs immédiats / crises : rassemblement de l'équipage
      missions.forEach(m => {
        const isAlert = m.status === 'declenche' || m.status === 'prealerte' || ((m.isCrisis || m.type === 'crise') && m.status !== 'completed' && m.status !== 'canceled' && m.status !== 'prealerte_levee' && m.status !== 'ongoing');
        if (!isAlert) return;
        const reg = Array.isArray(m.registeredVolunteers) ? m.registeredVolunteers : [];
        const vt = m.volunteerTransit || {};
        const arrived = reg.filter(vid => {
          const vol = volById.get(vid);
          if (!vol || MISSION_AWAY.includes(vol.status) || HOME_AWAY.includes(vol.status)) return false;
          return !vt[vid] || now >= (vt[vid].arrivalBaseAt || 0);
        });
        const required = m.requiredVolunteers || Math.max(reg.length, 1);
        const vehicleId = (Array.isArray(m.assignedVehicleIds) && m.assignedVehicleIds[0]) || m.vehicleId || null;
        arrived.forEach(vid => set(vid, { state: AgentState.WAITING_CREW, priority: PRIORITY.WAITING_CREW, missionId: m.id, vehicleId, label: m.title }));
        out.alerts.push({ missionId: m.id, title: String(m.title || 'Départ').replace(/^\[[^\]]*\]\s*/, ''), arrived: arrived.length, required, crisis: !!(m.isCrisis || m.type === 'crise'), vehicleId, enRoute: reg.length - arrived.length });
      });

      // --- 2. DPS / missions planifiées : préparation logistique puis rassemblement
      missions.forEach(m => {
        if (m.status !== 'planifie' || m.type === 'garde_samu' || m.type === 'samu') return;
        if (m.isRearmamentWorkshop || m.type === 'logistique' || m.type === 'rearmement') return;
        const S = eventTs(m.eventDate);
        if (!S) return;
        const dtMin = (S - now) / 60000;
        const reg = Array.isArray(m.registeredVolunteers) ? m.registeredVolunteers : [];
        const vehicleId = (Array.isArray(m.assignedVehicleIds) && m.assignedVehicleIds[0]) || m.vehicleId || null;
        if (dtMin > 0 && dtMin <= 20) {
          let arrived = 0;
          reg.forEach(vid => { if (set(vid, { state: AgentState.WAITING_CREW, priority: PRIORITY.WAITING_CREW - 5, missionId: m.id, vehicleId, label: m.title })) arrived++; });
          if (reg.length) out.alerts.push({ missionId: m.id, title: String(m.title || 'DPS'), arrived, required: m.requiredVolunteers || reg.length, planned: true, startsInMin: Math.ceil(dtMin), vehicleId, enRoute: 0 });
        } else if (dtMin > 20 && dtMin <= 90) {
          reg.forEach(vid => set(vid, { state: AgentState.LOGISTICS, priority: PRIORITY.LOGISTICS, missionId: m.id, vehicleId, label: `Préparation ${m.title || 'DPS'}` }));
        }
      });

      // --- 3. Formations (sessions en cours ou imminentes)
      const sessions = Array.isArray(game.sessionsFormation) ? game.sessionsFormation : [];
      sessions.forEach(s => {
        if (!s || s.status === 'completed' || s.isCompleted || s.isExternal || s.isStageExterne || s.locationType === 'externe') return;
        if (st && s.stationId && s.stationId !== st.id) return;
        const running = !!(s.startedCourseAt && now < (s.courseEndsAt || 0));
        const S = eventTs(s.eventDate);
        const pre = !s.startedCourseAt && S && (S - now) <= 45 * 60000 && (now - S) <= 60 * 60000;
        if (!running && !pre) return;
        out.trainingActive = true;
        const phase = running ? 'course' : 'waiting';
        if (s.trainerId) set(s.trainerId, { state: AgentState.IN_TRAINING, priority: PRIORITY.IN_TRAINING + 2, role: 'trainer', sessionId: s.id, phase, label: s.title });
        (s.registeredCandidates || []).forEach(vid => set(vid, { state: AgentState.IN_TRAINING, priority: PRIORITY.IN_TRAINING, role: 'trainee', sessionId: s.id, phase, label: s.title }));
        const ext = (s.publicSeatsBooked || (Array.isArray(s.publicAttendees) ? s.publicAttendees.length : 0) || 0) + ((s.registeredProtecReinforcements || []).length);
        out.civilians = Math.min(MAX_CIVILIANS, out.civilians + ext);
      });
      vols.forEach(v => { if (v.status === 'formation') set(v.id, { state: AgentState.IN_TRAINING, priority: PRIORITY.IN_TRAINING + 1, role: 'trainer', phase: 'course', label: 'Animation de formation' }); });

      // --- 4. Ateliers logistiques (réarmement planifié/en cours)
      missions.forEach(m => {
        if (!(m.isRearmamentWorkshop || m.type === 'logistique' || m.type === 'rearmement')) return;
        if (m.status === 'completed' || m.status === 'canceled') return;
        const S = eventTs(m.eventDate);
        const active = m.status === 'ongoing' || m.status === 'en_cours' || (S && Math.abs(S - now) < 45 * 60000);
        if (!active) return;
        const vehicleId = m.targetVehicleId || (Array.isArray(m.targetVehicleIds) && m.targetVehicleIds[0]) || null;
        (m.registeredVolunteers || []).forEach(vid => set(vid, { state: AgentState.LOGISTICS, priority: PRIORITY.LOGISTICS + 1, missionId: m.id, vehicleId, label: m.title || 'Atelier réarmement' }));
      });

      // --- 5. Gardes SAMU 15 / CODIS : attente en garde active à la base
      const guardIds = new Set();
      let guardLabel = null;
      try {
        const g = window.ProtecGardesSamu && typeof window.ProtecGardesSamu.getCurrentActiveGuard === 'function' ? window.ProtecGardesSamu.getCurrentActiveGuard(game) : null;
        if (g) { (g.registeredVolunteers || []).forEach(id => guardIds.add(id)); guardLabel = 'Garde SAMU 15'; }
      } catch (e) { /* lecture best-effort */ }
      if (game.samuGarde && game.samuGarde.active) { (game.samuGarde.crewVolunteerIds || []).forEach(id => guardIds.add(id)); guardLabel = guardLabel || 'Garde SAMU 15'; }
      if (game.sdisGarde && game.sdisGarde.active) { (game.sdisGarde.caserneCrew || []).forEach(id => guardIds.add(id)); guardLabel = guardLabel || (game.sdisGarde.label || 'Garde CODIS'); }
      vols.forEach(v => {
        if (v.status === 'samu_garde') { guardIds.add(v.id); guardLabel = guardLabel || 'Garde SAMU 15'; }
        if (v.status === 'sdis_caserne') { guardIds.add(v.id); guardLabel = guardLabel || 'Garde CODIS'; }
      });
      out.guardLabel = guardLabel;
      guardIds.forEach(vid => {
        const vol = volById.get(vid);
        const gType = vol && vol.status === 'sdis_caserne' ? 'CODIS' : 'SAMU';
        set(vid, { state: AgentState.ON_DUTY_WAIT, priority: PRIORITY.ON_DUTY_WAIT, guardType: gType, label: guardLabel || 'Garde active' });
      });

      // --- 6. Vie de caserne : bénévoles disponibles présents à la base (créneau horaire)
      const idleCands = vols.filter(v => !out.assignments.has(v.id) && (!v.status || v.status === 'dispo' || v.status === 'disponible' || v.status === 'base'));
      let present = idleCands.filter(v => this.isPresenceSlot(v, game, now));
      const h = new Date(now).getHours();
      if (present.length < 2 && h >= 7 && h < 23) {
        // Une base n'est jamais complètement vide en journée : les plus motivés passent
        const extra = idleCands.filter(v => !present.includes(v)).sort((a, b) => (b.motivation || 0) - (a.motivation || 0) || hashStr(a.id) - hashStr(b.id));
        present = present.concat(extra.slice(0, 2 - present.length));
      }
      present.slice(0, MAX_IDLE).forEach(v => set(v.id, { state: AgentState.IDLE, priority: PRIORITY.IDLE, label: 'Vie de caserne' }));

      // --- 7. Opérations logistiques véhicules (chargement/déchargement/réarmement) sans atelier dédié
      const vehs = this.stationVehicles(game, st);
      vehs.forEach(veh => {
        const busy = veh.logOperation || veh.status === 'chargement' || veh.status === 'dechargement';
        if (!busy) return;
        const already = [...out.assignments.values()].filter(a => a.state === AgentState.LOGISTICS && a.vehicleId === veh.id).length;
        if (already >= 2) return;
        const label = (veh.logOperation && veh.logOperation.label) || `Logistique ${veh.name || ''}`;
        let pool = [...out.assignments.entries()].filter(([, a]) => a.state === AgentState.IDLE).map(([id]) => id);
        if (pool.length < 2 - already) {
          // Des manutentionnaires viennent exprès si personne n'est sur place
          pool = pool.concat(idleCands.filter(v => !out.assignments.has(v.id)).map(v => v.id));
        }
        pool.slice(0, 2 - already).forEach(vid => set(vid, { state: AgentState.LOGISTICS, priority: PRIORITY.LOGISTICS, vehicleId: veh.id, label }));
      });

      // Limite globale d'avatars (les priorités hautes d'abord)
      if (out.assignments.size > MAX_AGENTS) {
        const sorted = [...out.assignments.entries()].sort((a, b) => b[1].priority - a[1].priority);
        out.assignments = new Map(sorted.slice(0, MAX_AGENTS));
      }
      return out;
    },

    // Véhicule à rejoindre pour un bénévole qui vient de partir en mission
    boardingVehicleFor(game, volId) {
      const missions = Array.isArray(game && game.missions) ? game.missions : [];
      const m = missions.find(x => Array.isArray(x.registeredVolunteers) && x.registeredVolunteers.includes(volId) && x.status !== 'completed');
      if (m) return (Array.isArray(m.assignedVehicleIds) && m.assignedVehicleIds[0]) || m.vehicleId || null;
      if (game && game.samuGarde && (game.samuGarde.crewVolunteerIds || []).includes(volId)) return game.samuGarde.vehicleId || null;
      if (game && game.sdisGarde && (game.sdisGarde.caserneCrew || []).includes(volId)) return game.sdisGarde.vehicleId || null;
      return null;
    }
  };

  // =========================================================================
  // 5. AGENTS (MACHINE À ÉTATS FINIS)
  // =========================================================================

  const SKIN = ['#f1c7a5', '#e0ac85', '#c68863', '#8d5a3b', '#f5d3b8', '#a86b48'];
  const HAIR = ['#2b1d14', '#4a3222', '#0f0f0f', '#7a5230', '#e3b04b', '#5c5c5c', '#9a3412'];
  const TEE = ['#ef4444', '#22c55e', '#0ea5e9', '#a855f7', '#eab308', '#14b8a6', '#e11d48', '#64748b', '#f8fafc', '#111827'];

  class Agent {
    constructor(scene, opts) {
      this.scene = scene;
      this.id = opts.id;
      this.vol = opts.vol || null;
      this.civilian = !!opts.civilian;
      this.name = opts.name || (this.vol && this.vol.name) || 'Stagiaire';
      this.rank = (this.vol && this.vol.rank) || (this.civilian ? 'Grand public' : '');
      const hs = hashStr(this.id);
      this.rng = mulberry32(hs);
      this.skin = SKIN[hs % SKIN.length];
      this.hair = HAIR[(hs >> 3) % HAIR.length];
      this.tee = TEE[(hs >> 6) % TEE.length];
      this.hs = hs;
      this.hairStyle = (hs >> 9) % 4;            // 0 court, 1 queue de cheval, 2 très court, 3 long
      this.jeans = ['#3b5b92', '#334155', '#1e3a5f', '#57534e', '#4b5563'][(hs >> 12) % 5];
      this.shoe = ['#f8fafc', '#111827', '#e2e8f0', '#7c2d12'][(hs >> 15) % 4];
      this.shortSleeve = ((hs >> 17) % 2) === 0;
      this.hoodie = !this.shortSleeve && ((hs >> 18) % 2) === 0;
      this.x = opts.x; this.y = opts.y;
      this.dir = this.rng() * Math.PI * 2;
      this.speed = 1.15 + this.rng() * 0.3;
      this.state = AgentState.IDLE;     // État FSM courant
      this.nextState = null;            // État visé à l'arrivée (quand state === MOVING)
      this.assignment = { state: AgentState.IDLE, priority: 0 };
      this.path = null; this.pathIdx = 0;
      this.poi = null;
      this.pose = 'stand';
      this.activityUntil = 0;
      this.walkPhase = this.rng() * 10;
      this.t = this.rng() * 100;
      this.alpha = opts.fadeIn ? 0 : 1;
      this.leaving = false;             // Sortie de la scène (domicile ou embarquement)
      this.boardVehicleId = null;
      this.removed = false;
      this.carry = false;
      this.dressed = false;             // Tenue d'intervention enfilée
      this.bubble = null;               // { icon, until }
      this.logiStep = 0;
      this.trainingPractice = false;
      this.seatOn = null;
      this.stuck = 0;
    }

    get outfit() {
      // Stagiaires (bénévoles en formation ou grand public) : tenue civile ; tous les autres : tenue Protection Civile
      if (this.civilian) return 'civil';
      if (this.logicalState === AgentState.IN_TRAINING && this.assignment.role !== 'trainer') return 'civil';
      return 'duty';
    }

    // Équipement porté selon la situation (sac de secours, radio, DAE)
    get gear() {
      if (this.outfit === 'civil') return {};
      const s = this.logicalState;
      const h = this.hs;
      const lead = ['CE', 'CD', 'Cadre'].includes(this.rank);
      if (s === AgentState.WAITING_CREW || (this.leaving && this.boardVehicleId)) {
        return { backpack: h % 3 !== 0, radio: lead || h % 4 === 0, dae: !lead && h % 5 === 1 };
      }
      if (s === AgentState.ON_DUTY_WAIT) return { radio: lead || (this.poi && this.poi.kind === 'radio_desk') };
      return {};
    }

    get logicalState() { return this.state === AgentState.MOVING ? (this.nextState || AgentState.IDLE) : this.state; }

    say(icon, sec = 2.5) { this.bubble = { icon, until: this.t + sec }; }

    releasePOI() {
      if (this.poi && this.poi.occupant === this.id) this.poi.occupant = null;
      this.poi = null;
      this.seatOn = null;
    }

    goTo(x, y, nextState, poi) {
      const nav = this.scene.world.nav;
      const p = nav.findPath(this.x, this.y, x, y);
      this.releasePOI();
      if (poi) { this.poi = poi; poi.occupant = this.id; }
      this.nextState = nextState;
      if (!p || p.length < 1) {
        // Inaccessible : on reste sur place dans l'état visé
        this.path = null;
        this.arrive();
        return false;
      }
      this.path = p; this.pathIdx = 0;
      this.state = AgentState.MOVING;
      this.pose = 'walk';
      return true;
    }

    goToPOI(poi, nextState) {
      if (!poi) return false;
      return this.goTo(poi.x, poi.y, nextState, poi);
    }

    arrive() {
      this.path = null;
      const target = this.nextState || AgentState.IDLE;
      this.state = target;
      this.nextState = null;
      if (this.leaving) {
        if (this.boardVehicleId) { this.state = AgentState.MOVING; return; } // fondu d'embarquement
        this.removed = true;
        return;
      }
      if (this.plannedDur) this.activityUntil = this.t + this.plannedDur;
      if (this.poi) {
        if (this.poi.face !== null && this.poi.face !== undefined) this.dir = this.poi.face;
        this.pose = this.poi.pose || 'stand';
        this.seatOn = this.poi.seatOn || null;
      } else {
        this.pose = 'stand';
      }
      this.onArrive();
    }

    // Transition FSM déclenchée par le Director
    applyAssignment(a, force) {
      const prev = this.assignment;
      this.assignment = a;
      const changed = force || prev.state !== a.state || prev.missionId !== a.missionId || prev.vehicleId !== a.vehicleId || prev.role !== a.role || prev.phase !== a.phase;
      if (!changed || this.leaving) return;
      this.carry = false;
      this.trainingPractice = false;
      if (a.state !== AgentState.WAITING_CREW) this.dressed = false;
      this.planNext(true);
    }

    dur(sec) { this.plannedDur = sec; this.activityUntil = this.t + sec; }

    // Choix de la prochaine activité selon l'état logique
    planNext(entering) {
      const sc = this.scene;
      const a = this.assignment;
      const S = a.state;
      const r = this.rng;
      this.dur(8 + r() * 14);

      if (S === AgentState.IN_TRAINING) {
        if (a.role === 'trainer') {
          const usePractice = a.phase === 'course' && !entering && r() < 0.35;
          const poi = usePractice ? sc.pickPOI(this, ['practice'], ['TRAINING']) : sc.pickPOI(this, ['teach'], ['TRAINING'], { keep: true });
          if (poi) { this.goToPOI(poi, S); this.dur((usePractice ? 9 : 18) + r() * 10); return; }
          return this.wanderIn(['TRAINING', 'OFFICE', 'LOUNGE'], S);
        }
        if (this.trainingPractice) {
          this.trainingPractice = false;
          const seat = sc.pickPOI(this, ['study_seat', 'seat'], ['TRAINING']);
          if (seat) return this.goToPOI(seat, S);
        }
        if (a.phase === 'course' && !entering && r() < 0.28) {
          const poi = sc.pickPOI(this, ['practice'], ['TRAINING']);
          if (poi) { this.trainingPractice = true; this.goToPOI(poi, S); this.dur(8 + r() * 8); return; }
        }
        if (this.poi && ['study_seat', 'seat'].includes(this.poi.kind) && !entering) { this.dur(10 + r() * 15); return; }
        const seat = sc.pickPOI(this, ['study_seat', 'seat', 'lounge_seat'], ['TRAINING', 'OFFICE', 'LOUNGE']);
        if (seat) { this.goToPOI(seat, S); this.dur(15 + r() * 20); return; }
        return this.wanderIn(['TRAINING'], S);
      }

      if (S === AgentState.LOGISTICS) {
        // Boucle : prendre du matériel en réserve -> le charger dans le véhicule
        const veh = sc.vehicleById(a.vehicleId) || sc.firstPresentVehicle();
        this.logiStep = (this.logiStep + 1) % 2;
        if (this.logiStep === 1 || !veh) {
          const poi = sc.pickPOI(this, ['storage'], ['STORAGE', 'GARAGE', 'LOCKER'], { anyRoom: true, near: veh ? [veh.cx, veh.cy] : null });
          if (poi) { this.goToPOI(poi, S); this.dur(3 + r() * 3); return; }
        }
        if (veh) {
          const kinds = r() < 0.25 ? ['bagcheck', 'load'] : ['load', 'bagcheck'];
          const poi = sc.pickPOI(this, kinds, null, { vehicleId: veh.id });
          if (poi) { this.goToPOI(poi, S); this.dur((poi.kind === 'bagcheck' ? 6 : 3) + r() * 3); return; }
        }
        return this.wanderIn(['STORAGE', 'GARAGE'], S);
      }

      if (S === AgentState.WAITING_CREW) {
        // 1. Habillage au vestiaire, 2. rassemblement près du véhicule
        if (!this.dressed) {
          const locker = sc.pickPOI(this, ['locker'], ['LOCKER', 'STORAGE', 'GARAGE'], { anyRoom: true });
          if (locker && entering) { this.goToPOI(locker, S); this.dur(3.5 + r() * 2); this.dressNext = true; return; }
          this.dressed = true;
        }
        const veh = sc.vehicleById(a.vehicleId) || sc.firstPresentVehicle();
        const poi = veh ? sc.pickPOI(this, ['gather', 'board'], null, { vehicleId: veh.id }) : null;
        const fallback = poi || sc.pickPOI(this, ['gather_yard', 'yard'], null, {});
        if (fallback) { this.goToPOI(fallback, S); this.dur(600); return; }
        return this.wanderIn(['GARAGE', 'LOCKER'], S);
      }

      if (S === AgentState.ON_DUTY_WAIT) {
        const night = sc.isNight;
        const radioTaken = sc.agents.some(o => o !== this && o.poi && o.poi.kind === 'radio_desk');
        const isLead = ['CE', 'CD', 'PSE2', 'Cadre'].includes(this.rank);
        if (!radioTaken && (isLead || r() < 0.5)) {
          const poi = sc.pickPOI(this, ['radio_desk'], ['RADIO', 'OFFICE']);
          if (poi) { this.goToPOI(poi, S); this.dur(40 + r() * 40); return; }
        }
        const choice = pickWeighted(r, [
          { v: 'bed', w: night ? 5 : 0 },
          { v: 'lounge', w: 4 },
          { v: 'desk', w: 1.5 },
          { v: 'coffee', w: night ? 0.5 : 1.2 },
          { v: 'tv', w: 1 }
        ]);
        let poi = null;
        if (choice === 'bed') poi = sc.pickPOI(this, ['bed'], ['DORM', 'LOUNGE'], { anyRoom: true });
        else if (choice === 'desk') poi = sc.pickPOI(this, ['desk', 'radio_desk'], ['OFFICE', 'RADIO']);
        else if (choice === 'coffee') poi = sc.pickPOI(this, ['coffee'], null, { anyRoom: true });
        else if (choice === 'tv') poi = sc.pickPOI(this, ['lounge_spot', 'lounge_seat'], ['LOUNGE']);
        if (!poi) poi = sc.pickPOI(this, ['lounge_seat', 'seat', 'lounge_spot'], ['LOUNGE', 'RADIO', 'OFFICE', 'DORM'], { anyRoom: true });
        if (poi) { this.goToPOI(poi, S); this.dur((choice === 'bed' ? 90 : 25) + r() * 35); return; }
        return this.wanderIn(['LOUNGE', 'RADIO', 'OFFICE'], S);
      }

      // IDLE : vie de caserne
      const choice = pickWeighted(r, [
        { v: 'coffee', w: 2.4 },
        { v: 'sit', w: 3 },
        { v: 'wander', w: 2.2 },
        { v: 'game', w: 1.2 },
        { v: 'chat', w: 1.6 },
        { v: 'yard', w: 0.6 }
      ]);
      let poi = null;
      if (choice === 'coffee') poi = sc.pickPOI(this, ['coffee'], null, { anyRoom: true });
      else if (choice === 'sit') poi = sc.pickPOI(this, ['lounge_seat', 'seat'], ['LOUNGE', 'OFFICE', 'FREE'], { anyRoom: true });
      else if (choice === 'game') poi = sc.pickPOI(this, ['game', 'lounge_spot'], ['LOUNGE'], { anyRoom: true });
      else if (choice === 'chat') poi = sc.pickChatSpot(this);
      else if (choice === 'yard') poi = sc.pickPOI(this, ['yard', 'gather_yard'], null, {});
      if (poi) {
        this.goToPOI(poi, AgentState.IDLE);
        this.dur((choice === 'coffee' ? 7 : 14) + r() * 16);
        return;
      }
      return this.wanderIn(['LOUNGE', 'FREE', 'OFFICE', 'TRAINING', 'STORAGE', 'GARAGE', 'RADIO'], AgentState.IDLE);
    }

    wanderIn(roles, nextState) {
      const poi = this.scene.pickPOI(this, ['wander'], roles, { anyRoom: true });
      if (poi) { this.goToPOI(poi, nextState); this.dur(4 + this.rng() * 6); return true; }
      this.state = nextState; this.pose = 'stand';
      this.dur(5);
      return false;
    }

    onArrive() {
      const S = this.state;
      if (S === AgentState.LOGISTICS && this.poi) {
        if (this.poi.kind === 'storage') { this.carryNext = true; }
        else if (this.poi.kind === 'load') { this.carry = false; this.say('📦', 1.6); }
        else if (this.poi.kind === 'bagcheck') { this.carry = false; this.say('🎒', 2.2); }
      }
      if (S === AgentState.WAITING_CREW && this.poi && this.poi.kind === 'locker') this.say('🦺', 2.5);
      if (S === AgentState.WAITING_CREW && this.poi && (this.poi.kind === 'gather' || this.poi.kind === 'board' || this.poi.kind === 'gather_yard')) this.say('⏱️', 3);
      if (S === AgentState.ON_DUTY_WAIT && this.poi && this.poi.kind === 'radio_desk') this.say('📻', 3);
      if (S === AgentState.IN_TRAINING && this.poi && this.poi.kind === 'teach') this.say('🗣️', 2.5);
      if (S === AgentState.IN_TRAINING && this.poi && this.poi.kind === 'practice') this.say('🫀', 2.5);
      if (S === AgentState.IDLE && this.poi && this.poi.kind === 'coffee') this.say('☕', 3);
      if (this.pose === 'sleep') this.say('💤', 4);
    }

    // Sortie de scène : domicile (vers la rue) ou embarquement dans un véhicule
    leave(boardVehicle) {
      if (this.leaving) return;
      this.leaving = true;
      this.carry = false;
      const sc = this.scene;
      if (boardVehicle) {
        const poi = sc.pickPOI(this, ['board'], null, { vehicleId: boardVehicle.id, allowTaken: true });
        this.boardVehicleId = boardVehicle.id;
        this.speed = 2.4; // départ réflexe : on court
        this.dressed = true;
        if (poi) { this.goTo(poi.x, poi.y, AgentState.MOVING, null); this.dir = poi.face; return; }
      }
      const [sx, sy] = sc.world.spawnPoint;
      if (!this.goTo(sx, sy, AgentState.MOVING, null)) this.removed = true;
    }

    update(dt) {
      this.t += dt;
      if (this.bubble && this.t > this.bubble.until) this.bubble = null;
      // Fondu d'apparition / disparition
      if (this.leaving && this.boardVehicleId && !this.path) this.alpha -= dt * 3;
      else this.alpha = Math.min(1, this.alpha + dt * 2);
      if (this.alpha <= 0) { this.removed = true; return; }

      if (this.state === AgentState.MOVING && this.path) {
        this.followPath(dt);
        return;
      }
      if (this.leaving) {
        if (!this.boardVehicleId) this.removed = true;
        return;
      }
      if (this.carryNext && this.t > this.activityUntil - 0.6) { this.carry = true; this.carryNext = false; }
      if (this.dressNext && this.t > this.activityUntil - 0.3) { this.dressed = true; this.dressNext = false; }

      // Animations d'attente contextuelles
      if (this.state === AgentState.WAITING_CREW && this.rng() < dt * 0.15) this.say(this.rng() < 0.5 ? '⏱️' : '📱', 2);
      if (this.state === AgentState.ON_DUTY_WAIT && this.poi && this.poi.kind === 'radio_desk' && this.rng() < dt * 0.08) this.say('📻', 2.2);
      if (this.pose === 'chat' && this.rng() < dt * 0.35) this.say('💬', 1.6);
      if (this.pose === 'sleep' && this.rng() < dt * 0.1) this.say('💤', 3);

      if (this.t >= this.activityUntil) {
        if (this.state === AgentState.WAITING_CREW && this.dressed && this.poi && ['gather', 'board', 'gather_yard'].includes(this.poi.kind)) {
          this.activityUntil = this.t + 30; // reste au rassemblement
          return;
        }
        this.planNext(false);
      }
    }

    followPath(dt) {
      const p = this.path[this.pathIdx];
      if (!p) { this.arrive(); return; }
      const dx = p[0] - this.x, dy = p[1] - this.y;
      const d = Math.hypot(dx, dy);
      // Ralentissement si un autre avatar bloque juste devant
      let spd = this.speed;
      for (const o of this.scene.agents) {
        if (o === this || o.removed) continue;
        const ox = o.x - this.x, oy = o.y - this.y;
        const od = Math.hypot(ox, oy);
        if (od < 0.42 && od > 0.001 && (ox * dx + oy * dy) > 0 && o.state !== AgentState.MOVING) { spd *= 0.55; break; }
      }
      const step = spd * dt;
      if (d <= step) {
        this.x = p[0]; this.y = p[1];
        this.pathIdx++;
        if (this.pathIdx >= this.path.length) this.arrive();
      } else {
        this.x += dx / d * step;
        this.y += dy / d * step;
        const targetDir = Math.atan2(dy, dx);
        let diff = targetDir - this.dir;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.dir += diff * Math.min(1, dt * 12);
      }
      this.walkPhase += step * 7.2;
    }
  }

  // =========================================================================
  // 6. RENDU : PRIMITIVES ISOMÉTRIQUES
  // =========================================================================

  class Iso {
    constructor() { this.k = 40; this.ox = 0; this.oy = 0; }
    p(x, y, z = 0) { return [this.ox + (x - y) * this.k, this.oy + (x + y) * this.k * 0.5 - z * this.k * HZ]; }
    // Transformation du plan horizontal (z) pour dessiner en coordonnées virtuelles S_FLOOR px/m
    planeTransform(ctx, z = 0, S = S_FLOOR) {
      const k = this.k / S;
      ctx.setTransform(k, k * 0.5, -k, k * 0.5, this.ox, this.oy - z * this.k * HZ);
    }
    unproject(sx, sy) {
      const a = (sx - this.ox) / this.k;        // x - y
      const b = (sy - this.oy) / (this.k * 0.5); // x + y
      return [(a + b) / 2, (b - a) / 2];
    }
  }

  function poly(ctx, pts, fill, stroke, lw) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }

  // Pavé aligné sur les axes : faces visibles +x (est), +y (sud) et dessus
  function drawBox(ctx, iso, x0, y0, x1, y1, z0, z1, color, opts = {}) {
    const P = (x, y, z) => iso.p(x, y, z);
    const top = opts.top || shade(color, 0.12);
    const south = opts.south || shade(color, -0.22);
    const east = opts.east || shade(color, -0.08);
    const edge = opts.edge === undefined ? 'rgba(15,23,42,0.18)' : opts.edge;
    if (!opts.noSides) {
      poly(ctx, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], south, edge, 0.6);
      poly(ctx, [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], east, edge, 0.6);
    }
    poly(ctx, [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], top, edge, 0.6);
  }

  // =========================================================================
  // 7. SCÈNE VIVANTE (moteur principal)
  // =========================================================================

  // =========================================================================
  // 6ter. VÉHICULES : ILLUSTRATIONS 3/4 DU DOSSIER images/vehicles
  // =========================================================================

  const ISO_IMG_CACHE = new Map();

  // Sprites générés à l'angle exact de la caméra (images/vehicles/iso, 4 caps par modèle)
  const SPRITES = { manifest: null, loading: false, imgs: new Map() };
  function loadSpriteManifest(onReady) {
    if (SPRITES.manifest || SPRITES.loading || typeof fetch !== 'function') return;
    SPRITES.loading = true;
    fetch('images/vehicles/iso/manifest.json').then(r => (r.ok ? r.json() : null)).then(m => {
      if (m && m.models) { SPRITES.manifest = m; if (onReady) onReady(); }
    }).catch(() => { /* pas de sprites : repli sur les illustrations */ });
  }
  function spriteModelKey(veh) {
    if (!veh) return null;
    const type = String(veh.type || veh.vehicleType || '').toUpperCase();
    const name = String(veh.name || '').toLowerCase();
    const img = String(veh.image || veh.variant || '').toLowerCase();
    if (type.includes('VPSP') || type === 'ASSU' || img.includes('vpsp')) return 'vpsp';
    if (type.includes('VTU') || img.includes('vtu')) return (veh.capacity_log > 0 || name.includes('log') || img.includes('log')) ? 'vtu_log' : 'vtu_pop';
    if (type.includes('VTP') || img.includes('vtp')) return 'vtp';
    if (type === 'VL' || type.includes('VLHR') || type === 'VLM') return 'vl';
    if (type.includes('PCM') || type.includes('VPC') || type === 'PC' || img.includes('midlum_pc')) return 'pc';
    if (type.includes('VTD') || type.includes('VST') || type.includes('PL') || type.includes('FLIT') || img.includes('pl_pop') || img.includes('flit')) return 'pl_pop';
    return null;
  }
  // Modèle + facteur d'échelle (le véhicule garde ses proportions réelles, légèrement réduit si la place est courte)
  function spriteInfo(veh, spotLen) {
    const m = SPRITES.manifest;
    const key = spriteModelKey(veh);
    if (!m || !key || !m.models[key]) return null;
    const ref = m.models[key].se;
    const s = clamp((spotLen * 1.06) / ref.L, 0.8, 1);
    return { key, model: m.models[key], ref, s };
  }
  function spriteImage(file) {
    let e = SPRITES.imgs.get(file);
    if (!e) {
      e = { img: new Image(), ready: false };
      e.img.onload = () => { e.ready = true; };
      e.img.src = 'images/vehicles/iso/' + file;
      SPRITES.imgs.set(file, e);
    }
    return e.ready ? e.img : null;
  }
  const ISO_FILE_RX = /(master\d|trafic|trm_|pl_pop|midlum|flit_pop|midliners)/i;

  function isoImagePath(veh) {
    if (!veh) return null;
    const base = String(veh.image || veh.imageIso || '').split('/').pop().replace(/^top_/, '');
    if (base && ISO_FILE_RX.test(base)) return 'images/vehicles/' + base;
    const variant = String(veh.variant || veh.model || '').toLowerCase().replace(/^top_/, '');
    if (variant && ISO_FILE_RX.test(variant)) return `images/vehicles/${variant.replace(/\.png$/, '')}.png`;
    const type = String(veh.type || veh.vehicleType || '').toUpperCase();
    const name = String(veh.name || '').toLowerCase();
    if (type.includes('VPSP') || type === 'ASSU') return 'images/vehicles/master3_vpsp.png';
    if (type.includes('VTU')) return (veh.capacity_log > 0 || name.includes('log')) ? 'images/vehicles/master3_vtu_log.png' : 'images/vehicles/master3_vtu_pop.png';
    if (type.includes('VTP')) return 'images/vehicles/master3_vtp.png';
    if (type.includes('PCM') || type.includes('VPC') || type === 'PC') return 'images/vehicles/midlum_pc.png';
    if (type.includes('FLIT')) return 'images/vehicles/flit_pop.png';
    if (type.includes('VTD') || type.includes('VST') || type.includes('PL')) return 'images/vehicles/pl_pop.png';
    return null;
  }

  // Charge l'image et calcule sa zone utile (rognage des marges transparentes)
  function getIsoVehicleImage(veh) {
    const path = isoImagePath(veh);
    if (!path) return null;
    let e = ISO_IMG_CACHE.get(path);
    if (!e) {
      e = { img: new Image(), ready: false, failed: false, trim: null };
      ISO_IMG_CACHE.set(path, e);
      e.img.onload = () => {
        const w = e.img.naturalWidth, h = e.img.naturalHeight;
        e.trim = { x: 0, y: 0, w, h };
        try {
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          const cx = c.getContext('2d');
          cx.drawImage(e.img, 0, 0);
          const d = cx.getImageData(0, 0, w, h).data;
          let x0 = w, y0 = h, x1 = 0, y1 = 0;
          for (let y = 0; y < h; y += 2) {
            for (let x = 0; x < w; x += 2) {
              if (d[(y * w + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
            }
          }
          if (x1 > x0 && y1 > y0) e.trim = { x: x0, y: y0, w: x1 - x0 + 2, h: y1 - y0 + 2 };
        } catch (err) { /* image d'une autre origine : pas de rognage */ }
        e.ready = true;
      };
      e.img.onerror = () => { e.failed = true; };
      e.img.src = path;
    }
    return e.ready ? e : null;
  }

  // =========================================================================
  // 6bis. ROTATION DE LA VUE (quart de tour autour du centre du site)
  // =========================================================================

  function modelCenter(model) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
    (model.rooms || []).forEach(r => { add(r.x, r.y); add(r.x + r.w, r.y + r.h); });
    if (model.parking) { add(model.parking.x, model.parking.y); add(model.parking.x + model.parking.w, model.parking.y + model.parking.h); }
    if (!isFinite(x0)) return [8, 6];
    return [(x0 + x1) / 2, (y0 + y1) / 2];
  }

  function rotPt(x, y, r, c) {
    let dx = x - c[0], dy = y - c[1];
    for (let i = 0; i < ((r % 4) + 4) % 4; i++) { const t = dx; dx = -dy; dy = t; }
    return [c[0] + dx, c[1] + dy];
  }

  function rotRect(x, y, w, h, r, c) {
    const [ax, ay] = rotPt(x, y, r, c), [bx, by] = rotPt(x + w, y + h, r, c);
    return { x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(bx - ax), h: Math.abs(by - ay) };
  }

  function rotateModel(model, r) {
    if (!model) return model;
    const c = modelCenter(model);
    if (!r) return { ...model, _rot: 0, _center: c };
    const rr = (o, wKey = 'w', hKey = 'h') => { const q = rotRect(o.x, o.y, o[wKey], o[hKey], r, c); return { ...o, x: q.x, y: q.y, [wKey]: q.w, [hKey]: q.h }; };
    const rotLinear = (d) => {
      const len = Number(d.len) || 0.83;
      const vertical = d.wall === 'W' || d.wall === 'E';
      const [ax, ay] = rotPt(d.x, d.y, r, c);
      const [bx, by] = vertical ? rotPt(d.x, d.y + len, r, c) : rotPt(d.x + len, d.y, r, c);
      const nv = Math.abs(bx - ax) < Math.abs(by - ay);
      return { ...d, x: Math.min(ax, bx), y: Math.min(ay, by), len, wall: nv ? 'W' : 'N' };
    };
    return {
      ...model,
      _rot: r, _center: c,
      rooms: (model.rooms || []).map(o => rr(o)),
      walls: (model.walls || []).map(w => { const [a, b] = rotPt(w.x1, w.y1, r, c); const [d, e] = rotPt(w.x2, w.y2, r, c); return { ...w, x1: a, y1: b, x2: d, y2: e }; }),
      doors: (model.doors || []).map(rotLinear),
      windows: (model.windows || []).map(rotLinear),
      furniture: (model.furniture || []).filter(f => f && isFinite(f.x)).map(f => rr(f, 'w', 'd')),
      parking: model.parking ? { ...rr(model.parking), spots: (model.parking.spots || []).map(sp => rr(sp, 'w', 'd')) } : null
    };
  }

  // Rotation qui place la cour / le parking face à la caméra
  function autoRotation(model) {
    if (!model || !model.parking) return 0;
    let best = 0, bestScore = -Infinity;
    for (let r = 0; r < 4; r++) {
      const m = rotateModel(model, r);
      const pk = m.parking;
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      (m.rooms || []).forEach(o => { bx0 = Math.min(bx0, o.x); by0 = Math.min(by0, o.y); bx1 = Math.max(bx1, o.x + o.w); by1 = Math.max(by1, o.y + o.h); });
      if (!isFinite(bx0)) return 0;
      const score = (pk.x + pk.w / 2 + pk.y + pk.h / 2) - ((bx0 + bx1) / 2 + (by0 + by1) / 2) - r * 0.01;
      if (score > bestScore) { bestScore = score; best = r; }
    }
    return best;
  }

  class LiveScene {
    constructor(canvas, locaux) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.locaux = locaux;
      this.iso = new Iso();
      this.agents = [];
      this.agentById = new Map();
      this.world = null;
      this.worldSig = '';
      this.vehStates = new Map();   // id -> { present, anim, t, ... }
      this.lastDirector = 0;
      this.directorOut = null;
      this.running = false;
      this.paused = false;
      this.lastFrame = 0;
      this.time = 0;
      this.fitted = false;
      this.groundCache = null;
      this.hover = null;
      this.selected = null;
      this.showLabels = this.pref('labels', true);
      this.wallsUp = this.pref('wallsUp', false);
      this.rotationMode = (function () { try { return localStorage.getItem('protec_live_rot') || 'auto'; } catch (e) { return 'auto'; } })();
      this.firstSync = true;
      this.isNight = false;
      this._loop = this.loop.bind(this);
      loadSpriteManifest(() => { this.worldSig = ''; });
      this.bindPointer();
      this.mountOverlay();
    }

    pref(key, def) {
      try { const v = localStorage.getItem('protec_live_' + key); return v === null ? def : v === '1'; } catch (e) { return def; }
    }
    savePref(key, val) { try { localStorage.setItem('protec_live_' + key, val ? '1' : '0'); } catch (e) { /* stockage indisponible */ } }

    // ---------- Construction / synchronisation du monde ----------

    getModel() {
      let raw = null;
      try { raw = this.locaux.getArchitectModel(this.locaux.currentStationId); } catch (e) { return null; }
      if (!raw) return null;
      const r = this.rotationMode === 'auto' ? autoRotation(raw) : (Number(this.rotationMode) || 0);
      const m = rotateModel(raw, r);
      if (this.currentRot !== undefined && this.currentRot !== r && this.agents.length) this.reorientAgents(this.currentRot, r, m._center);
      this.currentRot = r;
      return m;
    }

    // Changement d'orientation : les avatars suivent la rotation du monde
    reorientAgents(oldR, newR, c) {
      const delta = ((newR - oldR) % 4 + 4) % 4;
      this.agents.forEach(a => {
        const [x, y] = rotPt(a.x, a.y, delta, c);
        a.x = x; a.y = y;
        a.dir += delta * Math.PI / 2;
        a.path = null;
        a.releasePOI();
        if (a.state === AgentState.MOVING) { a.state = a.nextState || AgentState.IDLE; a.nextState = null; }
        a.activityUntil = 0; a.plannedDur = 0;
      });
      this.vehStates.forEach(vs => { if (vs.anim === 'leaving' || vs.anim === 'arriving') { vs.anim = vs.anim === 'leaving' ? 'away' : 'parked'; vs.offset = vs.anim === 'away' ? 1 : 0; } });
      this.groundCache = null;
      this.userMoved = false;
      this.fitted = false;
    }

    rotate() {
      const cur = this.currentRot || 0;
      this.rotationMode = String((cur + 1) % 4);
      try { localStorage.setItem('protec_live_rot', this.rotationMode); } catch (e) { /* stockage indisponible */ }
    }

    vehicleLayout(game, model) {
      model = model || this._lastModel || this.getModel();
      const st = Director.stationOf(game, this.locaux);
      const vehs = Director.stationVehicles(game, st);
      const spots = (model && model.parking && model.parking.spots) || [];
      const list = [];
      spots.forEach((spot, idx) => {
        const veh = vehs[idx];
        if (!veh) return;
        const horizontal = spot.w >= spot.d;
        const spotLen = horizontal ? spot.w : spot.d;
        const si = spriteInfo(veh, spotLen);
        let len = horizontal ? Math.min(spot.w * 0.85, 4.5) : Math.min(spot.d * 0.85, 4.5);
        let wid = horizontal ? Math.min(spot.d * 0.76, 2.1) : Math.min(spot.w * 0.76, 2.1);
        if (si) { len = si.ref.L * si.s; wid = si.ref.W * si.s; }
        const cx = spot.x + spot.w / 2, cy = spot.y + spot.d / 2;
        const box = horizontal
          ? { x0: cx - len / 2, x1: cx + len / 2, y0: cy - wid / 2, y1: cy + wid / 2 }
          : { x0: cx - wid / 2, x1: cx + wid / 2, y0: cy - len / 2, y1: cy + len / 2 };
        const status = veh.status || 'dispo';
        const statusPresent = !VEH_AWAY.includes(status);
        const vs = this.vehStates.get(veh.id);
        // Présent pour la navigation tant que l'animation de départ n'est pas terminée
        const present = vs ? (vs.anim !== 'away' || statusPresent) : statusPresent;
        list.push({ id: veh.id, veh, spot, idx, horizontal, box, cx, cy, present, statusPresent, sprite: si, spriteSig: si ? si.key : '' });
      });
      return list;
    }

    syncWorld(game) {
      const model = this.getModel();
      if (!model) return false;
      this._lastModel = model;
      const vehLayout = this.vehicleLayout(game, model);
      const sig = JSON.stringify({
        r: (model.rooms || []).map(r => [r.id, r.type, r.x, r.y, r.w, r.h, r.name]),
        w: (model.walls || []).length,
        wl: (model.walls || []).map(w => [w.x1, w.y1, w.x2, w.y2]),
        d: (model.doors || []).map(d => [d.x, d.y, d.wall, d.len, d.type]),
        f: (model.furniture || []).map(f => [f.id, f.type, +f.x.toFixed(2), +f.y.toFixed(2), f.w, f.d]),
        p: model.parking ? [model.parking.x, model.parking.y, model.parking.w, model.parking.h, (model.parking.spots || []).length] : null,
        rot: model._rot,
        v: vehLayout.map(v => [v.id, v.present, v.spriteSig])
      });
      if (sig === this.worldSig && this.world) return false;
      this.worldSig = sig;
      const oldPois = this.world ? this.world.pois : null;
      this.world = new WorldModel(model, vehLayout);
      this.groundCache = null;
      // Les avatars relâchent leurs anciens POI et repartent proprement
      if (oldPois) {
        this.agents.forEach(a => {
          if (a.poi) {
            const np = this.world.pois.find(p => Math.abs(p.x - a.poi.x) < 0.05 && Math.abs(p.y - a.poi.y) < 0.05 && p.kind === a.poi.kind);
            a.poi = np || null;
            if (np) np.occupant = a.id; else a.seatOn = null;
          }
          if (a.path) {
            // Recalcul de l'itinéraire avec la nouvelle géométrie
            const end = a.path[a.path.length - 1];
            const p = this.world.nav.findPath(a.x, a.y, end[0], end[1]);
            if (p) { a.path = p; a.pathIdx = 0; } else { a.path = null; a.arrive(); }
          } else if (!this.world.nav.isWalkable(a.x, a.y) && !a.seatOn && !(a.poi && a.poi.seatOn)) {
            const nw = this.world.nav.nearestWalkable(a.x, a.y, 3);
            if (nw) { a.x = nw[0]; a.y = nw[1]; }
          }
        });
      }
      if (!this.fitted) this.fitView();
      if (this.agents.length) this.agents.forEach(a => { if (!a.poi && !a.path && !a.leaving && a.activityUntil === 0) a.planNext(true); });
      return true;
    }

    vehicleById(id) {
      if (!id || !this.world) return null;
      return this.world.vehicles.find(v => v.id === id && v.present) || null;
    }
    firstPresentVehicle() {
      if (!this.world) return null;
      return this.world.vehicles.find(v => v.present && (this.vehStates.get(v.id) || {}).anim !== 'leaving') || null;
    }

    // Sélection d'un POI libre (kinds par ordre de préférence, rôles de pièces par ordre de préférence)
    pickPOI(agent, kinds, roles, opts = {}) {
      if (!this.world) return null;
      const pois = this.world.pois;
      const free = (p) => opts.allowTaken || !p.occupant || p.occupant === agent.id;
      for (const kind of kinds) {
        let cands = pois.filter(p => p.kind === kind && free(p) && (!opts.vehicleId || p.vehicleId === opts.vehicleId));
        if (opts.vehicleId === undefined) cands = cands.filter(p => !p.vehicleId || p.kind === 'load' || p.kind === 'bagcheck');
        if (opts.keep && agent.poi && agent.poi.kind === kind) return agent.poi;
        if (!cands.length) continue;
        if (roles && roles.length) {
          for (const role of roles) {
            const inRole = cands.filter(p => p.role === role || (p.room && (p.room.altRoles || []).includes(role)));
            if (inRole.length) return this.choose(agent, inRole, opts);
          }
          if (!opts.anyRoom) continue;
        }
        return this.choose(agent, cands, opts);
      }
      return null;
    }

    choose(agent, cands, opts) {
      if (opts.near) {
        cands = cands.slice().sort((a, b) => dist(a.x, a.y, opts.near[0], opts.near[1]) - dist(b.x, b.y, opts.near[0], opts.near[1]));
        return cands[Math.floor(agent.rng() * Math.min(2, cands.length))];
      }
      // Préférence légère pour les POI proches (déplacements plausibles)
      const weighted = cands.map(p => ({ v: p, w: 1 / (1 + dist(agent.x, agent.y, p.x, p.y) * 0.25) }));
      return pickWeighted(agent.rng, weighted);
    }

    // Discussion : rejoindre un autre bénévole immobile au foyer
    pickChatSpot(agent) {
      const partners = this.agents.filter(o => o !== agent && !o.removed && !o.leaving && o.state !== AgentState.MOVING && o.logicalState === AgentState.IDLE && o.pose !== 'sleep');
      if (!partners.length) return null;
      const o = partners[Math.floor(agent.rng() * partners.length)];
      const nav = this.world.nav;
      for (let i = 0; i < 8; i++) {
        const a = agent.rng() * Math.PI * 2;
        const x = o.x + Math.cos(a) * 0.75, y = o.y + Math.sin(a) * 0.75;
        if (nav.isWalkable(x, y) && this.world.roomAt(x, y) === this.world.roomAt(o.x, o.y)) {
          const face = Math.atan2(o.y - y, o.x - x);
          return { x, y, face, kind: 'chat', pose: 'chat', occupant: null, virtual: true, transient: true };
        }
      }
      return null;
    }

    // ---------- Director -> agents ----------

    runDirector(game) {
      const out = Director.compute(game, this.locaux);
      this.directorOut = out;
      const desired = out.assignments;
      const volById = new Map((game.volunteers || []).map(v => [v.id, v]));
      const initial = this.firstSync;
      this.firstSync = false;

      // Bénévoles qui doivent quitter la scène
      this.agents.forEach(a => {
        if (a.civilian || a.leaving) return;
        if (!desired.has(a.id)) {
          const vol = volById.get(a.id);
          const status = vol ? (vol.status || 'dispo') : 'gone';
          let board = null;
          if (vol && MISSION_AWAY.includes(status)) {
            const vid = Director.boardingVehicleFor(game, a.id);
            board = (vid && this.world.vehicles.find(v => v.id === vid)) || this.world.vehicles.find(v => (this.vehStates.get(v.id) || {}).anim === 'waitingCrew') || null;
          }
          a.releasePOI();
          a.leave(board);
        }
      });

      // Bénévoles présents : création ou mise à jour d'état
      desired.forEach((asg, vid) => {
        let a = this.agentById.get(vid);
        if (a && a.leaving) {
          // Revenu (ex : départ annulé) : annulation de la sortie et nouveau plan
          a.leaving = false; a.boardVehicleId = null; a.speed = 1.15 + a.rng() * 0.3; a.removed = false; a.alpha = Math.max(a.alpha, 0.3);
          a.applyAssignment(asg, true);
          return;
        }
        if (!a) {
          const vol = volById.get(vid);
          let x, y, fadeIn = true;
          if (initial) {
            // Premier affichage : chacun est déjà à son poste (pas de défilé depuis la rue)
            a = new Agent(this, { id: vid, vol, x: 0, y: 0, fadeIn: false });
            a.assignment = asg;
            this.addAgent(a);
            this.placeDirectly(a);
            return;
          }
          // Arrivée depuis la rue -> portail -> porte principale
          [x, y] = this.world.spawnPoint;
          a = new Agent(this, { id: vid, vol, x, y, fadeIn });
          this.addAgent(a);
          if (asg.state === AgentState.WAITING_CREW) { a.speed = 2.0; }
          a.applyAssignment(asg, true);
          return;
        }
        a.vol = volById.get(vid) || a.vol;
        a.applyAssignment(asg, false);
      });

      // Stagiaires grand public (formations ouvertes au public)
      const civs = this.agents.filter(a => a.civilian && !a.leaving);
      const want = out.civilians;
      if (civs.length < want) {
        for (let i = civs.length; i < want; i++) {
          const id = `civ_${i}`;
          const old = this.agentById.get(id);
          if (old && !old.removed) { old.leaving = false; continue; }
          const asg = { state: AgentState.IN_TRAINING, priority: PRIORITY.IN_TRAINING, role: 'trainee', phase: 'course', label: 'Stagiaire grand public' };
          const sessionLabel = [...desired.values()].find(x => x.state === AgentState.IN_TRAINING);
          if (sessionLabel) { asg.phase = sessionLabel.phase; asg.label = sessionLabel.label; }
          const [sx, sy] = this.world.spawnPoint;
          const a = new Agent(this, { id, civilian: true, name: `Stagiaire ${i + 1}`, x: sx, y: sy, fadeIn: true });
          this.addAgent(a);
          if (initial) { a.assignment = asg; this.placeDirectly(a); }
          else a.applyAssignment(asg, true);
        }
      } else if (civs.length > want) {
        civs.slice(want).forEach(a => { a.releasePOI(); a.leave(null); });
      }
      civs.slice(0, want).forEach(a => {
        const ref = [...desired.values()].find(x => x.state === AgentState.IN_TRAINING);
        if (ref && ref.phase !== a.assignment.phase) a.applyAssignment({ ...a.assignment, phase: ref.phase, label: ref.label }, false);
      });

      this.syncVehicles(game);
    }

    addAgent(a) {
      const prev = this.agentById.get(a.id);
      if (prev) { prev.releasePOI(); this.agents = this.agents.filter(x => x !== prev); }
      this.agents.push(a);
      this.agentById.set(a.id, a);
    }

    // Placement instantané (premier rendu)
    placeDirectly(a) {
      if (a.assignment.state === AgentState.WAITING_CREW) a.dressed = true;
      a.planNext(true);
      if (a.path && a.path.length) {
        const end = a.path[a.path.length - 1];
        a.x = end[0]; a.y = end[1];
        a.pathIdx = a.path.length;
        a.arrive();
      }
      if (a.logicalState === AgentState.WAITING_CREW) a.dressed = true;
      a.dressNext = false;
      if (a.carryNext) { a.carry = false; }
    }

    // Animation des véhicules : départ en intervention (attente équipage puis sortie gyros allumés) et retour
    syncVehicles(game) {
      const layout = this.vehicleLayout(game);
      layout.forEach(v => {
        let vs = this.vehStates.get(v.id);
        const wantPresent = v.statusPresent;
        if (!vs) {
          vs = { anim: wantPresent ? 'parked' : 'away', t: 0, offset: wantPresent ? 0 : 1 };
          this.vehStates.set(v.id, vs);
          return;
        }
        if (wantPresent && (vs.anim === 'away' || vs.anim === 'leaving')) { vs.anim = 'arriving'; vs.t = 0; }
        if (!wantPresent && (vs.anim === 'parked' || vs.anim === 'arriving')) { vs.anim = 'waitingCrew'; vs.t = 0; }
      });
      const ids = new Set(layout.map(v => v.id));
      [...this.vehStates.keys()].forEach(id => { if (!ids.has(id)) this.vehStates.delete(id); });
    }

    updateVehicles(dt) {
      if (!this.world) return;
      this.vehStates.forEach((vs, id) => {
        vs.t += dt;
        if (vs.anim === 'waitingCrew') {
          const boarding = this.agents.some(a => a.boardVehicleId === id && !a.removed);
          if (!boarding || vs.t > 9) { vs.anim = 'leaving'; vs.t = 0; }
        } else if (vs.anim === 'leaving') {
          vs.offset = Math.min(1, (vs.t / 4.2) ** 1.6);
          if (vs.offset >= 1) { vs.anim = 'away'; this.worldSig = ''; }
        } else if (vs.anim === 'arriving') {
          vs.offset = Math.max(0, 1 - (vs.t / 3.6));
          if (vs.offset <= 0) { vs.anim = 'parked'; this.worldSig = ''; }
        }
      });
    }

    // ---------- Boucle ----------

    start() {
      if (this.running) return;
      this.running = true;
      this.lastFrame = performance.now();
      requestAnimationFrame(this._loop);
    }
    stop() { this.running = false; }

    loop(ts) {
      if (!this.running) return;
      if (!this.canvas.isConnected) { this.destroy(); return; }
      const dt = Math.min(0.1, Math.max(0, (ts - this.lastFrame) / 1000));
      this.lastFrame = ts;
      if (!document.hidden) {
        try {
          this.step(this.paused ? 0 : dt);
          this.render();
        } catch (e) {
          if (!this._errLogged) { console.error('[ProtecBaseLive]', e); this._errLogged = true; }
        }
      }
      requestAnimationFrame(this._loop);
    }

    step(dt) {
      const game = window.game;
      this.time += dt;
      this.syncWorld(game);
      if (!this.world) return;
      const hNow = new Date(nowMs(game)).getHours();
      const night = hNow < 6 || hNow >= 22;
      if (night !== this.isNight) { this.isNight = night; this.groundCache = null; }
      const now = performance.now();
      if (game && (now - this.lastDirector > 500 || this.firstSync)) {
        this.lastDirector = now;
        this.runDirector(game);
      }
      this.updateVehicles(dt);
      this.agents.forEach(a => a.update(dt));
      const before = this.agents.length;
      this.agents = this.agents.filter(a => {
        if (a.removed) { a.releasePOI(); if (this.agentById.get(a.id) === a) this.agentById.delete(a.id); return false; }
        return true;
      });
      if (before !== this.agents.length && this.selected && this.selected.removed) this.closeCard();
    }

    // ---------- Caméra ----------

    fitView() {
      if (!this.world) return;
      const w = this.canvas.width, h = this.canvas.height;
      const s = this.world.site;
      const b = this.world.bounds;
      const corners = [[s.minX - 0.5, s.minY - 0.5], [s.maxX + 0.5, s.minY - 0.5], [s.maxX + 0.5, s.maxY + 0.5], [s.minX - 0.5, s.maxY + 0.5]];
      const proj = corners.map(([x, y]) => [(x - y), (x + y) * 0.5]);
      const minSX = Math.min(...proj.map(p => p[0])), maxSX = Math.max(...proj.map(p => p[0]));
      const minSY = Math.min(...proj.map(p => p[1])) - 2.6 * HZ, maxSY = Math.max(...proj.map(p => p[1]));
      const k = Math.min((w * 0.92) / (maxSX - minSX), (h * 0.84) / (maxSY - minSY));
      this.iso.k = clamp(k, 8, 200);
      this.iso.ox = w / 2 - ((minSX + maxSX) / 2) * this.iso.k;
      this.iso.oy = h / 2 - ((minSY + maxSY) / 2) * this.iso.k + h * 0.02;
      this.fitted = true;
      void b;
    }

    zoomAt(factor, sx, sy) {
      const iso = this.iso;
      const nk = clamp(iso.k * factor, 10 * (window.devicePixelRatio || 1), 120 * (window.devicePixelRatio || 1));
      const f = nk / iso.k;
      sx = sx === undefined ? this.canvas.width / 2 : sx;
      sy = sy === undefined ? this.canvas.height / 2 : sy;
      iso.ox = sx - (sx - iso.ox) * f;
      iso.oy = sy - (sy - iso.oy) * f;
      iso.k = nk;
      this.zoomIdleAt = performance.now();
      this.userMoved = true;
    }

    // ---------- Rendu ----------

    ensureSize() {
      const c = this.canvas;
      const rect = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (rect.width < 20 || rect.height < 20) return false;
      const w = Math.round(rect.width * dpr), h = Math.round(rect.height * dpr);
      if (c.width !== w || c.height !== h) {
        const ow = c.width || w, oh = c.height || h;
        c.width = w; c.height = h;
        if (!this.userMoved) this.fitView();
        else if (this.fitted) { this.iso.ox += (w - ow) / 2; this.iso.oy += (h - oh) / 2; }
      }
      return true;
    }

    buildGroundCache() {
      const iso = this.iso;
      const W = this.world;
      const b = W.bounds;
      const kc = iso.k;
      const corners = [[b.minX, b.minY], [b.maxX, b.minY], [b.maxX, b.maxY], [b.minX, b.maxY]].map(([x, y]) => [(x - y) * kc, (x + y) * kc * 0.5]);
      const minSX = Math.min(...corners.map(p => p[0])) - 4, maxSX = Math.max(...corners.map(p => p[0])) + 4;
      const minSY = Math.min(...corners.map(p => p[1])) - 4, maxSY = Math.max(...corners.map(p => p[1])) + 4;
      const cw = Math.ceil(maxSX - minSX), ch = Math.ceil(maxSY - minSY);
      if (cw * ch > 30e6 || cw <= 0 || ch <= 0) { this.groundCache = { direct: true, k: kc }; return this.groundCache; }
      const off = document.createElement('canvas');
      off.width = cw; off.height = ch;
      const ctx = off.getContext('2d');
      const tmp = new Iso();
      tmp.k = kc; tmp.ox = -minSX; tmp.oy = -minSY;
      this.paintGround(ctx, tmp);
      this.groundCache = { canvas: off, k: kc, minSX, minSY };
      return this.groundCache;
    }

    // Peinture du sol (pelouse, rue, cour, parking, sols des pièces) dans un repère isométrique donné
    paintGround(ctx, tmp) {
      const W = this.world;
      const b = W.bounds;
      const night = this.isNight;
      const P = (x, y) => tmp.p(x, y, 0);

      // Pelouse / terrain
      poly(ctx, [P(b.minX, b.minY), P(b.maxX, b.minY), P(b.maxX, b.maxY), P(b.minX, b.maxY)], night ? '#14281c' : '#4ade80');
      // Motif d'herbe léger
      tmp.planeTransform(ctx, 0, S_FLOOR);
      ctx.globalAlpha = night ? 0.25 : 0.18;
      const rng = mulberry32(42);
      ctx.fillStyle = night ? '#0b1a11' : '#16a34a';
      for (let i = 0; i < 900; i++) {
        const x = (b.minX + rng() * (b.maxX - b.minX)) * S_FLOOR, y = (b.minY + rng() * (b.maxY - b.minY)) * S_FLOOR;
        ctx.fillRect(x, y, 3 + rng() * 5, 2);
      }
      ctx.globalAlpha = 1;

      // Rue d'accès
      const rd = W.road;
      ctx.fillStyle = night ? '#1f2937' : '#475569';
      ctx.fillRect(rd.x0 * S_FLOOR, rd.y0 * S_FLOOR, (rd.x1 - rd.x0) * S_FLOOR, (rd.y1 - rd.y0) * S_FLOOR);
      ctx.strokeStyle = night ? '#94a3b8' : '#f8fafc';
      ctx.lineWidth = 2;
      ctx.setLineDash([22, 18]);
      ctx.beginPath();
      if (W.roadVertical) {
        const midX = (rd.x0 + rd.x1) / 2 * S_FLOOR;
        ctx.moveTo(midX, rd.y0 * S_FLOOR); ctx.lineTo(midX, rd.y1 * S_FLOOR);
      } else {
        const midY = (rd.y0 + rd.y1) / 2 * S_FLOOR;
        ctx.moveTo(rd.x0 * S_FLOOR, midY); ctx.lineTo(rd.x1 * S_FLOOR, midY);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // Trottoir côté antenne
      ctx.fillStyle = night ? '#334155' : '#cbd5e1';
      const sw = {
        W: [rd.x1, rd.y0, 0.5, rd.y1 - rd.y0], E: [rd.x0 - 0.5, rd.y0, 0.5, rd.y1 - rd.y0],
        N: [rd.x0, rd.y1, rd.x1 - rd.x0, 0.5], S: [rd.x0, rd.y0 - 0.5, rd.x1 - rd.x0, 0.5]
      }[W.roadSide];
      ctx.fillRect(sw[0] * S_FLOOR, sw[1] * S_FLOOR, sw[2] * S_FLOOR, sw[3] * S_FLOOR);

      // Cour pavée autour du bâtiment + parking
      const s = W.site;
      ctx.fillStyle = night ? '#273244' : '#d6d3d1';
      ctx.fillRect((s.minX - 0.8) * S_FLOOR, (s.minY - 0.8) * S_FLOOR, (s.maxX - s.minX + 1.6) * S_FLOOR, (s.maxY - s.minY + 1.6) * S_FLOOR);
      // Accès cour -> rue (bateau de trottoir)
      if (W.parking) {
        const pk = W.parking;
        let acc;
        if (W.roadSide === 'W') acc = [rd.x1, pk.y + 0.4, (s.minX - 0.8) - rd.x1, pk.h - 0.8];
        else if (W.roadSide === 'E') acc = [s.maxX + 0.8, pk.y + 0.4, rd.x0 - (s.maxX + 0.8), pk.h - 0.8];
        else if (W.roadSide === 'N') acc = [pk.x + 0.4, rd.y1, pk.w - 0.8, (s.minY - 0.8) - rd.y1];
        else acc = [pk.x + 0.4, s.maxY + 0.8, pk.w - 0.8, rd.y0 - (s.maxY + 0.8)];
        ctx.fillRect(acc[0] * S_FLOOR, acc[1] * S_FLOOR, acc[2] * S_FLOOR, acc[3] * S_FLOOR);
        ctx.fillStyle = night ? '#1e293b' : '#334155';
        ctx.fillRect(pk.x * S_FLOOR, pk.y * S_FLOOR, pk.w * S_FLOOR, pk.h * S_FLOOR);
        ctx.strokeStyle = night ? '#64748b' : '#f8fafc';
        ctx.lineWidth = 1.6;
        (pk.spots || []).forEach(sp => ctx.strokeRect(sp.x * S_FLOOR, sp.y * S_FLOOR, sp.w * S_FLOOR, sp.d * S_FLOOR));
        // Bande jaune "zone de départ"
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([10, 8]);
        ctx.strokeRect((pk.x + 0.15) * S_FLOOR, (pk.y + 0.15) * S_FLOOR, (pk.w - 0.3) * S_FLOOR, (pk.h - 0.3) * S_FLOOR);
        ctx.setLineDash([]);
      }

      // Sols des pièces (réutilise les textures du plan 2D existant)
      W.rooms.forEach(room => {
        const style = typeof this.locaux._getRoomStyle === 'function' ? this.locaux._getRoomStyle(room.type) : { floor: '#e2e8f0', floorType: 'neutral' };
        try {
          if (typeof this.locaux.drawRoomFloor === 'function') {
            this.locaux.drawRoomFloor(ctx, room.x * S_FLOOR, room.y * S_FLOOR, room.w * S_FLOOR, room.h * S_FLOOR, room, style, night, S_FLOOR);
          } else {
            ctx.fillStyle = style.floor; ctx.fillRect(room.x * S_FLOOR, room.y * S_FLOOR, room.w * S_FLOOR, room.h * S_FLOOR);
          }
        } catch (e) {
          ctx.fillStyle = style.floor || '#e2e8f0'; ctx.fillRect(room.x * S_FLOOR, room.y * S_FLOOR, room.w * S_FLOOR, room.h * S_FLOOR);
        }
        // Liseré de plinthe
        ctx.strokeStyle = 'rgba(15,23,42,0.18)';
        ctx.lineWidth = 2;
        ctx.strokeRect(room.x * S_FLOOR + 1, room.y * S_FLOOR + 1, room.w * S_FLOOR - 2, room.h * S_FLOOR - 2);
      });
      // Seuils de portes
      W.doors.forEach(d => {
        if (!PASSABLE_DOOR(d)) return;
        const r = doorRect(d, 0.13);
        ctx.fillStyle = d.type === 'garage_shutter' ? '#facc15' : (night ? '#475569' : '#a8a29e');
        ctx.fillRect(r.x0 * S_FLOOR, r.y0 * S_FLOOR, (r.x1 - r.x0) * S_FLOOR, (r.y1 - r.y0) * S_FLOOR);
      });
      // Tapis pédagogiques au sol des postes de pratique virtuels
      W.pois.forEach(p => {
        if (p.floorMannequin) {
          ctx.fillStyle = 'rgba(37,99,235,0.35)';
          ctx.fillRect((p.x - 0.35) * S_FLOOR, (p.y - 1.05) * S_FLOOR, 0.7 * S_FLOOR, 0.8 * S_FLOOR);
          // Mannequin de secourisme allongé sur le tapis
          const mx = p.x * S_FLOOR, my = (p.y - 0.62) * S_FLOOR;
          ctx.fillStyle = '#fcd9b6';
          ctx.beginPath(); ctx.arc(mx, my - 6, 3.2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath(); ctx.ellipse(mx, my + 2, 3.6, 5, 0, 0, Math.PI * 2); ctx.fill();
        }
      });
      ctx.setTransform(1, 0, 0, 1, 0, 0);

    }

    // Liste des volumes statiques triés topologiquement (murs, mobilier)
    buildStaticDrawables() {
      const W = this.world;
      const items = [];
      W.wallPieces.forEach(p => items.push({ kind: 'wall', x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y1, ref: p }));
      W.furniture.forEach(f => items.push({ kind: 'furn', x0: f.x, y0: f.y, x1: f.x + f.w, y1: f.y + f.d, ref: f }));
      // Tri topologique : A devant B si séparé sur un axe avec A du côté +x ou +y
      const n = items.length;
      const behind = items.map(() => []);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const A = items[i], B = items[j];
          // B derrière A ?
          const aFront = (A.x0 >= B.x1 - 0.001 && !(A.y1 <= B.y0 + 0.001)) || (A.y0 >= B.y1 - 0.001 && !(A.x1 <= B.x0 + 0.001));
          if (aFront) behind[i].push(j);
        }
      }
      const order = [];
      const mark = new Uint8Array(n);
      const visit = (i) => {
        if (mark[i] === 2) return;
        if (mark[i] === 1) return; // cycle : on ignore
        mark[i] = 1;
        behind[i].forEach(visit);
        mark[i] = 2;
        order.push(items[i]);
      };
      // Ordre de départ stable par profondeur pour limiter les artefacts
      const seed = items.map((it, i) => i).sort((a, b) => (items[a].x0 + items[a].y0) - (items[b].x0 + items[b].y0));
      seed.forEach(visit);
      order.forEach((it, i) => { it.order = i; });
      this.staticItems = order;
      this.staticSig = this.worldSig;
    }

    render() {
      if (!this.ensureSize() || !this.world) return;
      const ctx = this.ctx;
      const c = this.canvas;
      const iso = this.iso;
      const night = this.isNight;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // Fond
      const grad = ctx.createLinearGradient(0, 0, 0, c.height);
      if (night) { grad.addColorStop(0, '#0b1324'); grad.addColorStop(1, '#13261a'); }
      else { grad.addColorStop(0, '#bbf7d0'); grad.addColorStop(1, '#4ade80'); }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, c.width, c.height);

      // Sol en cache (reconstruit après stabilisation du zoom)
      const zoomSettled = !this.zoomIdleAt || performance.now() - this.zoomIdleAt > 160;
      if (!this.groundCache || (zoomSettled && Math.abs(this.groundCache.k - iso.k) > 0.01)) this.buildGroundCache();
      const gc = this.groundCache;
      if (gc && gc.direct) {
        this.paintGround(ctx, iso);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else if (gc) {
        const f = iso.k / gc.k;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(gc.canvas, iso.ox + gc.minSX * f, iso.oy + gc.minSY * f, gc.canvas.width * f, gc.canvas.height * f);
      }

      if (this.staticSig !== this.worldSig || !this.staticItems) this.buildStaticDrawables();

      // Ombres des avatars (au sol, sous tout le reste)
      this.agents.forEach(a => {
        if (a.pose === 'sleep') return;
        const [sx, sy] = iso.p(a.x, a.y, a.seatOn ? 0 : 0);
        ctx.globalAlpha = 0.28 * a.alpha;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(sx, sy, iso.k * 0.22, iso.k * 0.11, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Insertion des éléments dynamiques (avatars, véhicules) dans l'ordre statique
      const statics = this.staticItems;
      const buckets = new Map();
      const insert = (item, px0, py0, px1, py1) => {
        let idx = -1;
        for (let i = statics.length - 1; i >= 0; i--) {
          const s = statics[i];
          const front = (px0 >= s.x1 - 0.001) || (py0 >= s.y1 - 0.001);
          if (front && this.screenOverlap(s, px0, py0, px1, py1)) { idx = i; break; }
        }
        // Assis / couché sur ce meuble : dessiné au-dessus
        if (item.agent && item.agent.seatOn) {
          const si = statics.findIndex(s => s.kind === 'furn' && s.ref.id === item.agent.seatOn);
          if (si > idx) idx = si;
        }
        if (!buckets.has(idx)) buckets.set(idx, []);
        buckets.get(idx).push(item);
      };
      // Véhicules
      this.world.vehicles.forEach(v => {
        const vs = this.vehStates.get(v.id) || { anim: v.present ? 'parked' : 'away', offset: 0 };
        if (vs.anim === 'away') return;
        const [dx, dy] = this.vehicleOffset(v, vs.offset || 0);
        const b = v.box;
        insert({ veh: v, vs, dx, dy, depth: (b.x1 + dx) + (b.y1 + dy) }, b.x0 + dx, b.y0 + dy, b.x1 + dx, b.y1 + dy);
      });
      this.agents.forEach(a => insert({ agent: a, depth: a.x + a.y }, a.x, a.y, a.x, a.y));

      const drawBucket = (idx) => {
        const list = buckets.get(idx);
        if (!list) return;
        list.sort((p, q) => p.depth - q.depth);
        list.forEach(it => {
          if (it.agent) this.drawAgent(ctx, it.agent);
          else this.drawVehicle(ctx, it.veh, it.vs, it.dx, it.dy);
        });
      };
      drawBucket(-1);
      statics.forEach((s, i) => {
        if (s.kind === 'wall') this.drawWall(ctx, s.ref);
        else this.drawFurniture(ctx, s.ref);
        drawBucket(i);
      });

      // Éclairage nocturne : halos chauds dans les pièces occupées
      if (night) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        this.world.rooms.forEach(r => {
          const occ = this.agents.some(a => a.x >= r.x && a.x <= r.x + r.w && a.y >= r.y && a.y <= r.y + r.h);
          if (!occ) return;
          const [sx, sy] = iso.p(r.x + r.w / 2, r.y + r.h / 2, 0.5);
          const rad = Math.max(r.w, r.h) * iso.k * 0.9;
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad);
          g.addColorStop(0, 'rgba(253,186,116,0.20)');
          g.addColorStop(1, 'rgba(253,186,116,0)');
          ctx.fillStyle = g;
          ctx.fillRect(sx - rad, sy - rad, rad * 2, rad * 2);
        });
        ctx.restore();
      }

      // Overlays : étiquettes de pièces, bulles, compteurs d'équipage, HUD
      if (this.showLabels) this.drawRoomLabels(ctx);
      this.agents.forEach(a => this.drawAgentOverlay(ctx, a));
      this.drawCrewCounters(ctx);
      this.drawHUD(ctx, dpr);
      this.updateCursor();
    }

    screenOverlap(s, px0, py0, px1, py1) {
      // Recouvrement approximatif en écran (projection des emprises + hauteur)
      const a0 = (s.x0 - s.y1), a1 = (s.x1 - s.y0);
      const b0 = (px0 - py1) - 0.6, b1 = (px1 - py0) + 0.6;
      if (a1 < b0 || b1 < a0) return false;
      const c0 = (s.x0 + s.y0) * 0.5 - 2.6, c1 = (s.x1 + s.y1) * 0.5;
      const d0 = (px0 + py0) * 0.5 - 2.4, d1 = (px1 + py1) * 0.5;
      return !(c1 < d0 || d1 < c0);
    }

    vehicleOffset(v, off) {
      if (!off) return [0, 0];
      const W = this.world, b = v.box, r = W.road;
      switch (W.roadSide) {
        case 'W': return [(r.x0 - 4 - b.x1) * off, 0];
        case 'E': return [(r.x1 + 4 - b.x0) * off, 0];
        case 'N': return [0, (r.y0 - 4 - b.y1) * off];
        default: return [0, (r.y1 + 4 - b.y0) * off];
      }
    }

    drawWall(ctx, p) {
      const iso = this.iso;
      const night = this.isNight;
      const H = p.tall || this.wallsUp ? 2.5 : (p.outer ? 0.45 : 1.0);
      const base = night ? '#334155' : (p.outer ? '#e7e5e4' : '#f5f5f4');
      const capCol = night ? '#475569' : (p.outer ? '#b45309' : '#d6d3d1');
      if (p.door) {
        if (H > 2.2) drawBox(ctx, iso, p.x0, p.y0, p.x1, p.y1, 2.15, H, base, { top: capCol });
        // Montants de porte
        const vertical = (p.y1 - p.y0) > (p.x1 - p.x0);
        const fc = p.door === 'garage_shutter' ? '#facc15' : (night ? '#64748b' : '#78716c');
        const fh = Math.min(H, 2.15);
        if (vertical) {
          drawBox(ctx, iso, p.x0, p.y0, p.x1, p.y0 + 0.05, 0, fh, fc, { edge: null });
          drawBox(ctx, iso, p.x0, p.y1 - 0.05, p.x1, p.y1, 0, fh, fc, { edge: null });
        } else {
          drawBox(ctx, iso, p.x0, p.y0, p.x0 + 0.05, p.y1, 0, fh, fc, { edge: null });
          drawBox(ctx, iso, p.x1 - 0.05, p.y0, p.x1, p.y1, 0, fh, fc, { edge: null });
        }
        return;
      }
      if (p.glass) {
        ctx.globalAlpha = 0.55;
        drawBox(ctx, iso, p.x0, p.y0, p.x1, p.y1, 0, Math.max(H, 1.0), '#7dd3fc', { top: '#bae6fd' });
        ctx.globalAlpha = 1;
        return;
      }
      if (p.windowPane && H > 1.5) {
        drawBox(ctx, iso, p.x0, p.y0, p.x1, p.y1, 0, 0.95, base, { top: capCol });
        ctx.globalAlpha = 0.6;
        drawBox(ctx, iso, p.x0 + 0.02, p.y0 + 0.02, p.x1 - 0.02, p.y1 - 0.02, 0.95, 2.05, night ? '#fde68a' : '#7dd3fc', { top: '#e0f2fe', edge: null });
        ctx.globalAlpha = 1;
        drawBox(ctx, iso, p.x0, p.y0, p.x1, p.y1, 2.05, H, base, { top: capCol });
        return;
      }
      drawBox(ctx, iso, p.x0, p.y0, p.x1, p.y1, 0, H, base, { top: capCol });
      if (p.windowPane) {
        // Mur bas avec fenêtre : simple liseré cyan
        const [ax, ay] = iso.p(p.x0, p.y1, H), [bx, by] = iso.p(p.x1, p.y1, H);
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = Math.max(1.5, iso.k * 0.05);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
    }

    drawFurniture(ctx, f) {
      const iso = this.iso;
      const st = FURN_STYLE[f.type] || { h: 0.8, kind: 'box', color: f.color || '#8a9bb0' };
      const col = f.color || st.color;
      const x0 = f.x, y0 = f.y, x1 = f.x + f.w, y1 = f.y + f.d;
      const hov = this.hover && this.hover.furn === f;
      const P = (x, y, z) => iso.p(x, y, z);
      switch (st.kind) {
        case 'table': {
          const z = st.h;
          const lg = 0.06;
          [[x0 + 0.05, y0 + 0.05], [x1 - 0.05 - lg, y0 + 0.05], [x0 + 0.05, y1 - 0.05 - lg], [x1 - 0.05 - lg, y1 - 0.05 - lg]].forEach(([lx, ly]) => drawBox(ctx, iso, lx, ly, lx + lg, ly + lg, 0, z - 0.04, '#334155', { edge: null }));
          drawBox(ctx, iso, x0, y0, x1, y1, z - 0.05, z, col);
          if (f.type === 'bureau') {
            // Écran + clavier
            const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
            drawBox(ctx, iso, cx - 0.25, cy - 0.04, cx + 0.25, cy + 0.02, z, z + 0.38, '#0f172a', { top: '#1e293b' });
            drawBox(ctx, iso, cx - 0.2, cy + 0.12, cx + 0.2, cy + 0.26, z, z + 0.02, '#e2e8f0', { edge: null });
          } else if (f.type === 'table_formation') {
            // Classeurs & supports pédagogiques
            const rng = mulberry32(hashStr(f.id));
            for (let i = 0; i < 3; i++) {
              const px = lerp(x0 + 0.2, x1 - 0.4, rng()), py = lerp(y0 + 0.15, y1 - 0.35, rng());
              drawBox(ctx, iso, px, py, px + 0.22, py + 0.3, z, z + 0.015, ['#fde68a', '#bfdbfe', '#fecaca'][i], { edge: null });
            }
          }
          break;
        }
        case 'chair': {
          drawBox(ctx, iso, x0 + 0.05, y0 + 0.05, x1 - 0.05, y1 - 0.05, 0.4, 0.46, col);
          drawBox(ctx, iso, (x0 + x1) / 2 - 0.02, (y0 + y1) / 2 - 0.02, (x0 + x1) / 2 + 0.02, (y0 + y1) / 2 + 0.02, 0, 0.4, '#334155', { edge: null });
          drawBox(ctx, iso, x0 + 0.05, y0 + 0.05, x1 - 0.05, y0 + 0.1, 0.46, 0.9, shade(col, -0.1));
          break;
        }
        case 'sofa': {
          drawBox(ctx, iso, x0, y0, x1, y1, 0, 0.42, col);
          const fr = f._front || 'S';
          const t = 0.22;
          if (fr === 'S') drawBox(ctx, iso, x0, y0, x1, y0 + t, 0.42, 0.85, shade(col, -0.08));
          else if (fr === 'N') drawBox(ctx, iso, x0, y1 - t, x1, y1, 0.42, 0.85, shade(col, -0.08));
          else if (fr === 'E') drawBox(ctx, iso, x0, y0, x0 + t, y1, 0.42, 0.85, shade(col, -0.08));
          else drawBox(ctx, iso, x1 - t, y0, x1, y1, 0.42, 0.85, shade(col, -0.08));
          break;
        }
        case 'bed':
        case 'bunk': {
          drawBox(ctx, iso, x0, y0, x1, y1, 0, 0.3, '#475569');
          drawBox(ctx, iso, x0 + 0.04, y0 + 0.04, x1 - 0.04, y1 - 0.04, 0.3, 0.45, '#f8fafc', { top: '#ffffff' });
          const longIsW = f.w >= f.d;
          if (longIsW) drawBox(ctx, iso, x0 + 0.08, y0 + 0.12, x0 + 0.45, y1 - 0.12, 0.45, 0.53, '#e0e7ff');
          else drawBox(ctx, iso, x0 + 0.12, y0 + 0.08, x1 - 0.12, y0 + 0.45, 0.45, 0.53, '#e0e7ff');
          if (st.kind === 'bunk') {
            [[x0, y0], [x1 - 0.06, y0], [x0, y1 - 0.06], [x1 - 0.06, y1 - 0.06]].forEach(([lx, ly]) => drawBox(ctx, iso, lx, ly, lx + 0.06, ly + 0.06, 0, 1.6, '#334155', { edge: null }));
            drawBox(ctx, iso, x0, y0, x1, y1, 1.25, 1.4, col);
            drawBox(ctx, iso, x0 + 0.04, y0 + 0.04, x1 - 0.04, y1 - 0.04, 1.4, 1.52, '#f8fafc', { top: '#ffffff' });
          }
          break;
        }
        case 'shelf': {
          const H = st.h;
          const posts = [[x0, y0], [x1 - 0.05, y0], [x0, y1 - 0.05], [x1 - 0.05, y1 - 0.05]];
          const levels = [0.08, 0.6, 1.15, 1.7].filter(z => z < H);
          const rng = mulberry32(hashStr(f.id));
          levels.forEach((z, li) => {
            drawBox(ctx, iso, x0, y0, x1, y1, z, z + 0.04, col, { edge: null });
            // Caisses / lots de secours colorés
            const longIsW = f.w >= f.d;
            const L = longIsW ? f.w : f.d;
            const n = Math.max(1, Math.floor(L / 0.45));
            for (let i = 0; i < n; i++) {
              if (rng() < 0.22) continue;
              const u0 = i / n + 0.02, u1 = (i + 1) / n - 0.02;
              const bc = ['#ef4444', '#f97316', '#3b82f6', '#a3a3a3', '#16a34a'][Math.floor(rng() * 5)];
              const bh = 0.28 + rng() * 0.16;
              if (longIsW) drawBox(ctx, iso, x0 + u0 * f.w, y0 + 0.05, x0 + u1 * f.w, y1 - 0.05, z + 0.04, z + 0.04 + bh, bc);
              else drawBox(ctx, iso, x0 + 0.05, y0 + u0 * f.d, x1 - 0.05, y0 + u1 * f.d, z + 0.04, z + 0.04 + bh, bc);
            }
            void li;
          });
          posts.forEach(([px, py]) => drawBox(ctx, iso, px, py, px + 0.05, py + 0.05, 0, H, shade(col, -0.2), { edge: null }));
          break;
        }
        case 'lockers':
        case 'cabinet':
        case 'vending': {
          const H = st.h;
          drawBox(ctx, iso, x0, y0, x1, y1, 0, H, col);
          // Portes sur les faces visibles
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = Math.max(1, iso.k * 0.02);
          const longIsW = f.w >= f.d;
          const L = longIsW ? f.w : f.d;
          const n = st.kind === 'lockers' ? Math.max(2, Math.round(L / 0.4)) : 2;
          for (let i = 1; i < n; i++) {
            const u = i / n;
            let a, b;
            if (longIsW) { a = P(x0 + u * f.w, y1, 0.05); b = P(x0 + u * f.w, y1, H - 0.05); }
            else { a = P(x1, y0 + u * f.d, 0.05); b = P(x1, y0 + u * f.d, H - 0.05); }
            ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
          }
          if (st.kind === 'cabinet' && f.type === 'armoire_pharmacie') {
            const [cx, cy] = longIsW ? P((x0 + x1) / 2, y1, H * 0.62) : P(x1, (y0 + y1) / 2, H * 0.62);
            ctx.fillStyle = '#ffffff';
            const s = iso.k * 0.09;
            ctx.fillRect(cx - s, cy - s * 0.3, s * 2, s * 0.6);
            ctx.fillRect(cx - s * 0.3, cy - s, s * 0.6, s * 2);
          }
          if (st.kind === 'vending') {
            ctx.globalAlpha = 0.7;
            if (longIsW) poly(ctx, [P(x0 + 0.1, y1, 0.7), P(x1 - 0.35, y1, 0.7), P(x1 - 0.35, y1, 1.65), P(x0 + 0.1, y1, 1.65)], '#bae6fd');
            else poly(ctx, [P(x1, y0 + 0.1, 0.7), P(x1, y1 - 0.35, 0.7), P(x1, y1 - 0.35, 1.65), P(x1, y0 + 0.1, 1.65)], '#bae6fd');
            ctx.globalAlpha = 1;
          }
          break;
        }
        case 'panel': {
          const z0 = st.z0 || 0.8;
          drawBox(ctx, iso, x0, y0, x1, y1, z0, st.h, f.type === 'tableau_blanc' ? '#94a3b8' : '#0f172a', { top: '#475569' });
          // Surface d'écriture / écran
          const longIsW = f.w >= f.d;
          const scr = f.type === 'tableau_blanc' ? '#ffffff' : (this.isNight ? '#38bdf8' : '#1d4ed8');
          if (longIsW) poly(ctx, [P(x0 + 0.06, y1 + 0.001, z0 + 0.06), P(x1 - 0.06, y1 + 0.001, z0 + 0.06), P(x1 - 0.06, y1 + 0.001, st.h - 0.06), P(x0 + 0.06, y1 + 0.001, st.h - 0.06)], scr);
          else poly(ctx, [P(x1 + 0.001, y0 + 0.06, z0 + 0.06), P(x1 + 0.001, y1 - 0.06, z0 + 0.06), P(x1 + 0.001, y1 - 0.06, st.h - 0.06), P(x1 + 0.001, y0 + 0.06, st.h - 0.06)], scr);
          if (f.type === 'tableau_blanc') {
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = Math.max(1, iso.k * 0.02);
            const a = longIsW ? P(x0 + 0.3, y1, z0 + 0.6) : P(x1, y0 + 0.3, z0 + 0.6);
            const b = longIsW ? P(x0 + 1.0, y1, z0 + 0.75) : P(x1, y0 + 1.0, z0 + 0.75);
            ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
          }
          break;
        }
        case 'mannequin': {
          drawBox(ctx, iso, x0 - 0.1, y0 - 0.05, x1 + 0.1, y1 + 0.05, 0, 0.03, '#2563eb', { edge: null });
          this.drawMannequinFlat(ctx, f);
          break;
        }
        case 'gametable': {
          [[x0 + 0.1, y0 + 0.1], [x1 - 0.18, y0 + 0.1], [x0 + 0.1, y1 - 0.18], [x1 - 0.18, y1 - 0.18]].forEach(([lx, ly]) => drawBox(ctx, iso, lx, ly, lx + 0.08, ly + 0.08, 0, st.h - 0.1, '#334155', { edge: null }));
          drawBox(ctx, iso, x0, y0, x1, y1, st.h - 0.12, st.h, col, { top: f.type === 'ping_pong' ? '#1d4ed8' : '#15803d' });
          if (f.type === 'ping_pong') {
            const longIsW = f.w >= f.d;
            if (longIsW) drawBox(ctx, iso, (x0 + x1) / 2 - 0.01, y0, (x0 + x1) / 2 + 0.01, y1, st.h, st.h + 0.15, '#f8fafc', { edge: null });
            else drawBox(ctx, iso, x0, (y0 + y1) / 2 - 0.01, x1, (y0 + y1) / 2 + 0.01, st.h, st.h + 0.15, '#f8fafc', { edge: null });
          }
          break;
        }
        case 'counter': {
          drawBox(ctx, iso, x0, y0, x1, y1, 0, st.h, col, { top: '#e7e5e4' });
          break;
        }
        default: {
          const z0 = st.z0 || 0;
          drawBox(ctx, iso, x0, y0, x1, y1, z0, st.h, col);
          if (f.type === 'machine_cafe') {
            const [cx, cy] = P((x0 + x1) / 2, (y0 + y1) / 2, st.h + 0.15);
            ctx.font = `${Math.max(10, iso.k * 0.32)}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('☕', cx, cy);
          }
        }
      }
      if (hov) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = Math.max(2, iso.k * 0.05);
        ctx.setLineDash([6, 4]);
        poly(ctx, [P(x0, y0, 0), P(x1, y0, 0), P(x1, y1, 0), P(x0, y1, 0)], null, '#38bdf8', Math.max(2, iso.k * 0.05));
        ctx.restore();
      }
    }

    drawMannequinFlat(ctx, f) {
      const iso = this.iso;
      const ped = f.type === 'mannequin_pediatrique';
      this.iso.planeTransform(ctx, 0.04, S_FLOOR);
      const cx = (f.x + f.w / 2) * S_FLOOR, cy = (f.y + f.d / 2) * S_FLOOR;
      const longIsW = f.w >= f.d;
      ctx.translate(cx, cy);
      if (longIsW) ctx.rotate(Math.PI / 2);
      const s = ped ? 0.55 : 1;
      ctx.fillStyle = '#fcd9b6';
      ctx.beginPath(); ctx.ellipse(0, -8 * s, 6 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.ellipse(0, 6 * s, 7 * s, 9 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-5 * s, 14 * s, 4 * s, 9 * s); ctx.fillRect(1 * s, 14 * s, 4 * s, 9 * s);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      void iso;
    }

    drawVehicle(ctx, v, vs, dx, dy = 0) {
      if (this.drawVehicleSprite(ctx, v, vs, dx, dy)) return;
      if (this.drawVehiclePhoto(ctx, v, vs, dx, dy)) return;
      const iso = this.iso;
      const b = v.box;
      const x0 = b.x0 + dx, x1 = b.x1 + dx, y0 = b.y0 + dy, y1 = b.y1 + dy;
      const veh = v.veh;
      const type = String(veh.type || veh.vehicleType || '').toUpperCase();
      const H = type.includes('VL') && !type.includes('VLHR') ? 1.5 : (type.includes('PL') || type.includes('PC') ? 2.9 : 2.4);
      const body = '#f8fafc';
      const night = this.isNight;
      // Ombre portée
      ctx.globalAlpha = 0.25;
      poly(ctx, [iso.p(x0 + 0.15, y0 + 0.2), iso.p(x1 + 0.25, y0 + 0.2), iso.p(x1 + 0.25, y1 + 0.3), iso.p(x0 + 0.15, y1 + 0.3)], '#0f172a');
      ctx.globalAlpha = 1;
      // Roues
      const wr = 0.34;
      const wheels = v.horizontal ? [[x0 + 0.7, y1], [x1 - 0.8, y1], [x1, y0 + 0.4]] : [[x1, y0 + 0.7], [x1, y1 - 0.8]];
      wheels.forEach(([wx, wy]) => {
        const [sx, sy] = iso.p(wx, wy, wr);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.ellipse(sx, sy, iso.k * wr * 0.75, iso.k * wr, 0, 0, Math.PI * 2); ctx.fill();
      });
      drawBox(ctx, iso, x0, y0, x1, y1, 0.3, H, body, { south: '#cbd5e1', east: '#e2e8f0', top: '#f1f5f9' });
      // Bandes rétro-réfléchissantes Protection Civile (orange + bleu) sur les flancs visibles
      const stripe = (z0, z1, c) => {
        poly(ctx, [iso.p(x0, y1, z0), iso.p(x1, y1, z0), iso.p(x1, y1, z1), iso.p(x0, y1, z1)], c);
        poly(ctx, [iso.p(x1, y0, z0), iso.p(x1, y1, z0), iso.p(x1, y1, z1), iso.p(x1, y0, z1)], shade(c, 0.08));
      };
      stripe(0.75, 0.95, '#f97316');
      stripe(0.95, 1.08, '#1e40af');
      // Vitrage cabine côté nez (le nez pointe vers la rue)
      const glass = night ? '#1e293b' : '#334155';
      const zA = H > 2 ? 1.3 : 0.95, zB = H - 0.22;
      ctx.globalAlpha = 0.88;
      if (v.horizontal) {
        const noseE = this.world.roadSide === 'E';
        const n0 = noseE ? x1 - 1.05 : x0 + 0.15, n1 = noseE ? x1 - 0.15 : x0 + 1.05;
        poly(ctx, [iso.p(n0, y1, zA), iso.p(n1, y1, zA), iso.p(n1, y1, zB), iso.p(n0, y1, zB)], glass);
        if (noseE) poly(ctx, [iso.p(x1, y0 + 0.15, zA), iso.p(x1, y1 - 0.15, zA), iso.p(x1, y1 - 0.15, zB), iso.p(x1, y0 + 0.15, zB)], glass);
      } else {
        const noseS = this.world.roadSide === 'S';
        const n0 = noseS ? y1 - 1.05 : y0 + 0.15, n1 = noseS ? y1 - 0.15 : y0 + 1.05;
        poly(ctx, [iso.p(x1, n0, zA), iso.p(x1, n1, zA), iso.p(x1, n1, zB), iso.p(x1, n0, zB)], glass);
        if (noseS) poly(ctx, [iso.p(x0 + 0.15, y1, zA), iso.p(x1 - 0.15, y1, zA), iso.p(x1 - 0.15, y1, zB), iso.p(x0 + 0.15, y1, zB)], glass);
      }
      ctx.globalAlpha = 1;
      // Toit : image vue du dessus existante si disponible
      try {
        if (typeof this.locaux.drawTopDownVehicle === 'function') {
          iso.planeTransform(ctx, H + 0.01, S_FLOOR);
          const spot = v.spot;
          // L'image vue du dessus pointe à gauche (place horizontale) ou en haut (verticale) : on la retourne si la rue est de l'autre côté
          const flipNose = (v.horizontal && this.world.roadSide === 'E') || (!v.horizontal && this.world.roadSide === 'S');
          ctx.translate((spot.x + spot.w / 2 + dx) * S_FLOOR, (spot.y + spot.d / 2 + dy) * S_FLOOR);
          if (flipNose) ctx.rotate(Math.PI);
          this.locaux.drawTopDownVehicle(ctx, 0, 0, spot.w * S_FLOOR, spot.d * S_FLOOR, veh, night, this.hover && this.hover.veh === v);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
      } catch (e) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      // Rampe de gyrophares
      const moving = vs.anim === 'leaving' || vs.anim === 'waitingCrew' || vs.anim === 'arriving';
      const alertMode = moving || (this.directorOut && this.directorOut.alerts.some(a => a.vehicleId === v.id));
      const lx = v.horizontal ? x0 + 1.2 : (x0 + x1) / 2, ly = v.horizontal ? (y0 + y1) / 2 : y0 + 1.2;
      const blink = Math.floor(this.time * 6) % 2 === 0;
      const [s1x, s1y] = iso.p(lx, ly - 0.35, H + 0.12);
      const [s2x, s2y] = iso.p(lx, ly + 0.35, H + 0.12);
      ctx.fillStyle = alertMode ? (blink ? '#3b82f6' : '#1e3a8a') : '#1e3a8a';
      ctx.beginPath(); ctx.arc(s1x, s1y, iso.k * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = alertMode ? (!blink ? '#3b82f6' : '#1e3a8a') : '#1e3a8a';
      ctx.beginPath(); ctx.arc(s2x, s2y, iso.k * 0.12, 0, Math.PI * 2); ctx.fill();
      if (alertMode) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const [gx, gy] = blink ? [s1x, s1y] : [s2x, s2y];
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, iso.k * 1.4);
        g.addColorStop(0, 'rgba(59,130,246,0.55)');
        g.addColorStop(1, 'rgba(59,130,246,0)');
        ctx.fillStyle = g;
        ctx.fillRect(gx - iso.k * 1.4, gy - iso.k * 1.4, iso.k * 2.8, iso.k * 2.8);
        ctx.restore();
      }
      // Nom du véhicule
      if (this.showLabels || (this.hover && this.hover.veh === v)) {
        const [tx, ty] = iso.p((x0 + x1) / 2, (y0 + y1) / 2, H + 0.6);
        this.chip(ctx, tx, ty, veh.name || type || 'Véhicule', '#0f172a', '#ffffff');
      }
    }

    // Véhicule rendu avec les sprites isométriques générés (4 caps, nez vers la rue)
    drawVehicleSprite(ctx, v, vs, dx, dy) {
      const si = v.sprite;
      if (!si) return false;
      const W = this.world;
      const dir = v.horizontal ? (W.roadSide === 'W' ? 'nw' : 'se') : (W.roadSide === 'N' ? 'ne' : 'sw');
      const meta = si.model[dir];
      const img = meta && spriteImage(meta.file);
      if (!img) return false;
      const iso = this.iso;
      const [sx, sy] = iso.p(v.cx + dx, v.cy + dy, 0);
      const sc = (iso.k / meta.k) * si.s;
      ctx.save();
      if (this.hover && this.hover.veh === v) { ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = iso.k * 0.5; }
      if (this.isNight) ctx.filter = 'brightness(0.72) saturate(0.85)';
      ctx.drawImage(img, sx - meta.ax * sc, sy - meta.ay * sc, meta.w * sc, meta.h * sc);
      ctx.restore();
      // Gyrophares (alerte, départ, retour)
      const moving = vs.anim === 'leaving' || vs.anim === 'waitingCrew' || vs.anim === 'arriving';
      const alertMode = moving || (this.directorOut && this.directorOut.alerts.some(a => a.vehicleId === v.id));
      if (alertMode && meta.lights && meta.lights.length) {
        const blink = Math.floor(this.time * 6) % 2;
        const L = meta.lights[blink % meta.lights.length];
        const gx = sx + (L[0] - meta.ax) * sc, gy = sy + (L[1] - meta.ay) * sc;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, iso.k * 1.5);
        g.addColorStop(0, 'rgba(59,130,246,0.8)');
        g.addColorStop(1, 'rgba(59,130,246,0)');
        ctx.fillStyle = g;
        ctx.fillRect(gx - iso.k * 1.5, gy - iso.k * 1.5, iso.k * 3, iso.k * 3);
        ctx.restore();
      }
      if (this.showLabels || (this.hover && this.hover.veh === v)) {
        const [tx, ty] = iso.p(v.cx + dx, v.cy + dy, meta.H * si.s + 0.55);
        this.chip(ctx, tx, ty, v.veh.name || v.veh.type || 'Véhicule', '#0f172a', '#ffffff');
      }
      return true;
    }

    // Véhicule rendu avec l'illustration 3/4 du jeu (nez vers la rue, côté visible face caméra)
    drawVehiclePhoto(ctx, v, vs, dx, dy) {
      const iso = this.iso;
      const W = this.world;
      // L'illustration montre le nez en bas à droite : cap +x (place horizontale, rue à l'est) ; miroir pour cap +y (rue au sud)
      let mirror;
      if (v.horizontal && W.roadSide === 'E') mirror = false;
      else if (!v.horizontal && W.roadSide === 'S') mirror = true;
      else return false;
      const e = getIsoVehicleImage(v.veh);
      if (!e) return false;
      const b = v.box;
      const x0 = b.x0 + dx, x1 = b.x1 + dx, y0 = b.y0 + dy, y1 = b.y1 + dy;
      const pts = [iso.p(x0, y0), iso.p(x1, y0), iso.p(x1, y1), iso.p(x0, y1)];
      const minX = Math.min(...pts.map(p => p[0])), maxX = Math.max(...pts.map(p => p[0]));
      const maxY = Math.max(...pts.map(p => p[1]));
      // Ombre portée au sol
      ctx.globalAlpha = 0.22;
      poly(ctx, [iso.p(x0 + 0.1, y0 + 0.15), iso.p(x1 + 0.3, y0 + 0.15), iso.p(x1 + 0.3, y1 + 0.35), iso.p(x0 + 0.1, y1 + 0.35)], '#0f172a');
      ctx.globalAlpha = 1;
      const tr = e.trim;
      const dw = (maxX - minX) * 1.06;
      const dh = dw * tr.h / tr.w;
      const cx = (minX + maxX) / 2;
      const bottom = maxY + iso.k * 0.08;
      ctx.save();
      ctx.translate(cx, bottom - dh);
      if (mirror) ctx.scale(-1, 1);
      if (this.hover && this.hover.veh === v) { ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = iso.k * 0.6; }
      if (this.isNight) ctx.filter = 'brightness(0.72) saturate(0.85)';
      ctx.drawImage(e.img, tr.x, tr.y, tr.w, tr.h, -dw / 2, 0, dw, dh);
      ctx.restore();
      // Gyrophares en alerte / en mouvement
      const moving = vs.anim === 'leaving' || vs.anim === 'waitingCrew' || vs.anim === 'arriving';
      const alertMode = moving || (this.directorOut && this.directorOut.alerts.some(a => a.vehicleId === v.id));
      if (alertMode) {
        const blink = Math.floor(this.time * 6) % 2 === 0;
        const gx = cx + (mirror ? -1 : 1) * dw * (blink ? 0.12 : 0.3);
        const gy = bottom - dh * (blink ? 0.92 : 0.86);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, iso.k * 1.5);
        g.addColorStop(0, 'rgba(59,130,246,0.75)');
        g.addColorStop(1, 'rgba(59,130,246,0)');
        ctx.fillStyle = g;
        ctx.fillRect(gx - iso.k * 1.5, gy - iso.k * 1.5, iso.k * 3, iso.k * 3);
        ctx.restore();
      }
      if (this.showLabels || (this.hover && this.hover.veh === v)) {
        this.chip(ctx, cx, bottom - dh - 4 * (window.devicePixelRatio || 1), v.veh.name || v.veh.type || 'Véhicule', '#0f172a', '#ffffff');
      }
      return true;
    }

    // ---------- Avatars ----------

    drawAgent(ctx, a) {
      const iso = this.iso;
      if (a.pose === 'sleep' && a.poi && a.poi.bed) { this.drawSleeper(ctx, a); return; }
      const seated = a.state !== AgentState.MOVING && (a.pose === 'sit' || a.pose === 'desk');
      if (seated && !a.seatOn) {
        // Tabouret / chaise d'appoint
        const cs = 0.17, bx = a.x - Math.cos(a.dir) * 0.05, by = a.y - Math.sin(a.dir) * 0.05;
        drawBox(ctx, iso, bx - cs, by - cs, bx + cs, by + cs, 0.4, 0.45, '#0369a1');
        drawBox(ctx, iso, bx - 0.02, by - 0.02, bx + 0.02, by + 0.02, 0, 0.4, '#334155', { edge: null });
      }
      const [sx, sy] = iso.p(a.x, a.y, 0);
      const u = iso.k * HZ / 40;           // 40 unités sprite = 1 m
      const cosd = Math.cos(a.dir), sind = Math.sin(a.dir);
      const sdx = cosd - sind, sdy = (cosd + sind) / 2;
      const front = sdy >= -0.05;
      const flip = sdx < 0;
      ctx.save();
      ctx.globalAlpha = a.alpha;
      ctx.translate(sx, sy);
      ctx.scale(flip ? -u : u, u);
      this.drawPersonSprite(ctx, a, front);
      ctx.restore();
      if (this.hover && this.hover.agent === a) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = Math.max(2, iso.k * 0.04);
        ctx.beginPath();
        ctx.ellipse(sx, sy, iso.k * 0.3, iso.k * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    drawSleeper(ctx, a) {
      const iso = this.iso;
      const bed = a.poi.bed;
      const longIsW = bed.w >= bed.d;
      const z = FURN_STYLE[bed.type] && FURN_STYLE[bed.type].kind === 'bunk' ? 0.47 : 0.47;
      iso.planeTransform(ctx, z + 0.04, S_FLOOR);
      ctx.globalAlpha = a.alpha;
      const cx = (bed.x + bed.w / 2) * S_FLOOR, cy = (bed.y + bed.d / 2) * S_FLOOR;
      ctx.translate(cx, cy);
      if (longIsW) ctx.rotate(-Math.PI / 2);
      const breathe = 1 + Math.sin(a.t * 1.6) * 0.03;
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-7 * breathe, -8, 14 * breathe, 26, 5); else ctx.rect(-7, -8, 14, 26);
      ctx.fill();
      ctx.fillStyle = a.skin;
      ctx.beginPath(); ctx.arc(0, -13, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = a.hair;
      ctx.beginPath(); ctx.arc(0, -15, 4.2, Math.PI, Math.PI * 2); ctx.fill();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
    }

    // Avatar style illustration isométrique Protection Civile (combinaison marine, empiècement orange, bandes blanches)
    drawPersonSprite(ctx, a, front) {
      const t = a.t;
      const pose = a.state === AgentState.MOVING ? 'walk' : a.pose;
      const civil = a.outfit === 'civil';
      const gear = a.gear || {};
      const NAVY = '#1d3c8c', NAVY_D = '#152c69', ORANGE = '#f7941d', ORANGE_D = '#e07a0c', WHITE = '#eef2f7';
      const pal = civil
        ? { top: a.tee, topD: shade(a.tee, -0.22), pants: a.jeans, pantsD: shade(a.jeans, -0.25), shoe: a.shoe, sleeveShort: a.shortSleeve }
        : { top: NAVY, topD: NAVY_D, pants: NAVY, pantsD: NAVY_D, shoe: '#1f2933', sleeveShort: false };

      const walk = pose === 'walk';
      const ph = a.walkPhase;
      const swing = walk ? Math.sin(ph) : 0;
      const sitting = pose === 'sit' || pose === 'desk';
      const kneeling = pose === 'cpr' || pose === 'kneel';
      let hip = 34;
      let bob = walk ? Math.abs(Math.cos(ph)) * 1.4 : Math.sin(t * 1.8) * 0.35;
      if (sitting) { hip = 19; bob = 0; }
      if (kneeling) { hip = 14; bob = 0; }
      if (pose === 'cpr') bob = -Math.max(0, Math.sin(t * 11.5)) * 2.4;
      const hipY = -hip - bob;
      const torsoH = 27;
      const topY = hipY - torsoH + (kneeling ? 3 : 0);

      // --- Sac de secours rouge (vu de face : dépasse derrière les épaules)
      if (gear.backpack && front) {
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-12, topY + 1, 24, 21, 4); else ctx.rect(-12, topY + 1, 24, 21); ctx.fill();
      }
      // --- Queue de cheval (vue de face : derrière la tête)
      const headCY = topY - 8.5;
      if (front && a.hairStyle === 1) {
        ctx.fillStyle = a.hair;
        ctx.beginPath(); ctx.ellipse(-5.5, headCY + 3, 2.6, 6.5, 0.35, 0, Math.PI * 2); ctx.fill();
      }

      // --- Jambes
      const drawLeg = (cx, y0, y1, lift, dark) => {
        const w = 6.6;
        ctx.fillStyle = dark ? pal.pantsD : pal.pants;
        ctx.fillRect(cx - w / 2, y0, w, (y1 - lift) - y0 - 2.5);
        if (!civil) {
          // Bande rétro-réfléchissante basse + liseré orange latéral
          const len = (y1 - lift) - y0;
          if (len > 14) {
            ctx.fillStyle = WHITE; ctx.fillRect(cx - w / 2, y1 - lift - 10, w, 2.4);
            ctx.fillStyle = ORANGE; ctx.fillRect(cx + (dark ? w / 2 - 1.1 : -w / 2), y0 + 2, 1.1, len - 13);
          }
        }
        // Chaussure / ranger
        ctx.fillStyle = pal.shoe;
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(cx - w / 2 - 0.6, y1 - lift - 3.2, w + 2.4, 3.6, 1.4); else ctx.rect(cx - w / 2, y1 - lift - 3.2, w + 2, 3.6); ctx.fill();
        if (civil) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(cx - w / 2 - 0.6, y1 - lift - 0.6, w + 2.4, 0.9); }
      };
      if (sitting) {
        drawLeg(-3.6, hipY + 1, 0, 0, false); drawLeg(3.6, hipY + 1, 0, 0, true);
      } else if (kneeling) {
        drawLeg(-4, hipY + 1, 0, 0, false); drawLeg(4, hipY + 1, 0, 0, true);
      } else {
        const lift1 = walk ? Math.max(0, Math.sin(ph)) * 2.4 : 0;
        const lift2 = walk ? Math.max(0, -Math.sin(ph)) * 2.4 : 0;
        const tap = pose === 'wait' ? Math.max(0, Math.sin(t * 7)) * 1.4 : 0;
        drawLeg(-3.6 + swing * 2.2, hipY + 1, 0, lift1, false);
        drawLeg(3.6 - swing * 2.2, hipY + 1, 0, lift2 + tap, true);
      }

      // --- Bras
      let armL = swing * 0.45, armR = -swing * 0.45, armLen = 24;
      if (pose === 'teach') { armR = -2.3 + Math.sin(t * 2.2) * 0.3; armL = 0.12; }
      else if (pose === 'cpr') { armL = -0.3; armR = 0.3; armLen = 20 + bob * 0.5; }
      else if (pose === 'kneel') { armL = -0.6; armR = 0.5 + Math.sin(t * 3) * 0.2; }
      else if (pose === 'desk') { armL = -0.9 + Math.sin(t * 13) * 0.05; armR = 0.9 + Math.cos(t * 11) * 0.05; }
      else if (pose === 'shelf' || pose === 'locker') { armL = -2.6 + Math.sin(t * 3) * 0.25; armR = 2.4 + Math.cos(t * 3) * 0.25; }
      else if (pose === 'play') { armL = -1.1 + Math.sin(t * 6) * 0.3; armR = 1.1 + Math.sin(t * 6) * 0.3; }
      else if (pose === 'coffee') { armR = Math.sin(t * 0.9) > 0.6 ? -2.5 : -0.9; }
      else if (pose === 'chat') { armR = -0.5 + Math.sin(t * 2.7) * 0.5; armL = 0.15; }
      else if (pose === 'wait') { const watch = Math.sin(t * 0.7) > 0.75; armL = watch ? -1.6 : 0.05; armR = gear.radio ? -0.7 : -0.05; }
      else if (pose === 'stand_radio') { armR = -2.6; }
      if (a.carry) { armL = -1.15; armR = 1.15; }
      const holding = (side) => {
        if (a.carry) return null;
        if (side > 0 && gear.radio && (pose === 'wait' || pose === 'stand' || pose === 'stand_radio' || walk)) return 'radio';
        if (side < 0 && gear.dae && !walk && pose !== 'cpr') return 'dae';
        if (side < 0 && gear.dae && walk) return 'dae';
        return null;
      };
      const drawArm = (side, angle, dark) => {
        ctx.save();
        ctx.translate(side * 8.6, topY + 3.2);
        ctx.rotate(angle);
        const sleeve = dark ? pal.topD : pal.top;
        if (civil && pal.sleeveShort) {
          ctx.fillStyle = sleeve; ctx.fillRect(-2.7, -1, 5.4, armLen * 0.36);
          ctx.fillStyle = shade(a.skin, dark ? -0.12 : 0); ctx.fillRect(-2.1, armLen * 0.34, 4.2, armLen * 0.62);
        } else {
          ctx.fillStyle = sleeve; ctx.fillRect(-2.7, -1, 5.4, armLen * 0.92);
          if (!civil) { ctx.fillStyle = dark ? ORANGE_D : ORANGE; ctx.fillRect(-2.7, -1, 5.4, 5.5); ctx.fillStyle = WHITE; ctx.fillRect(-2.7, armLen * 0.62, 5.4, 1.6); }
        }
        ctx.fillStyle = shade(a.skin, dark ? -0.12 : 0);
        ctx.beginPath(); ctx.arc(0, armLen, 2.5, 0, Math.PI * 2); ctx.fill();
        const item = holding(side);
        if (item === 'radio') {
          ctx.fillStyle = '#111827'; ctx.fillRect(-1.6, armLen - 1, 3.2, 6.5);
          ctx.fillRect(-0.5, armLen - 4, 1, 3.5);
        } else if (item === 'dae') {
          ctx.fillStyle = '#dc2626'; ctx.fillRect(-4, armLen + 1, 8, 7);
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-0.9, armLen + 4, 1.2, 0, Math.PI * 2); ctx.arc(0.9, armLen + 4, 1.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      };
      // Bras arrière (dessiné avant le buste)
      if (front) drawArm(1, armR, true); else { drawArm(-1, armL, false); drawArm(1, armR, true); }

      // --- Buste (trapèze épaules > taille) avec ombrage latéral
      const torso = () => {
        ctx.beginPath();
        ctx.moveTo(-7.4, hipY + 1.5);
        ctx.lineTo(7.4, hipY + 1.5);
        ctx.lineTo(9.6, topY + 4);
        ctx.quadraticCurveTo(9.6, topY, 6, topY);
        ctx.lineTo(-6, topY);
        ctx.quadraticCurveTo(-9.6, topY, -9.6, topY + 4);
        ctx.closePath();
      };
      ctx.save();
      torso();
      ctx.fillStyle = pal.top; ctx.fill();
      ctx.clip();
      if (!civil) {
        // Empiècement orange haute visibilité + bande blanche
        ctx.fillStyle = ORANGE; ctx.fillRect(-11, topY - 1, 22, 11.5);
        ctx.fillStyle = WHITE; ctx.fillRect(-11, topY + 10.5, 22, 2.6);
      } else if (a.hoodie) {
        ctx.fillStyle = shade(a.tee, 0.15); ctx.fillRect(-3, topY + 2, 6, torsoH - 6);
      }
      // Ceinture
      ctx.fillStyle = civil ? 'rgba(0,0,0,0.18)' : '#0f1f4d';
      ctx.fillRect(-11, hipY - 1, 22, 2.5);
      // Ombre du côté opposé à la lumière
      ctx.fillStyle = 'rgba(8,15,40,0.18)';
      ctx.fillRect(1.5, topY - 2, 12, torsoH + 6);
      ctx.restore();

      // Bretelles du sac (vue de face) / sac complet (vue de dos)
      if (gear.backpack) {
        if (front) {
          ctx.fillStyle = '#111827';
          ctx.fillRect(-6.2, topY + 0.5, 2, 14); ctx.fillRect(4.2, topY + 0.5, 2, 14);
        } else {
          ctx.fillStyle = '#c81e1e';
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-8, topY + 2, 16, 20, 4); else ctx.rect(-8, topY + 2, 16, 20); ctx.fill();
          ctx.fillStyle = '#991b1b'; ctx.fillRect(-8, topY + 2, 16, 6);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(-1.8, topY + 12, 3.6, 1.2); ctx.fillRect(-0.6, topY + 10.8, 1.2, 3.6);
        }
      }
      if (!front && !civil && !gear.backpack) {
        // Marquage dorsal
        ctx.fillStyle = WHITE; ctx.fillRect(-6, topY + 15, 12, 2.2);
      }
      // Grade (CE / CD) : galon jaune sur la poitrine
      if (front && !civil && ['CE', 'CD', 'Cadre', 'Formateur'].includes(a.rank)) {
        ctx.fillStyle = '#facc15'; ctx.fillRect(-6.5, topY + 14.5, 4, 1.4);
      }

      // Carton porté (logistique)
      if (a.carry) {
        ctx.fillStyle = '#b7791f';
        ctx.fillRect(-9, topY + 9, 18, 13);
        ctx.fillStyle = '#d69e2e'; ctx.fillRect(-9, topY + 9, 18, 3);
        ctx.fillStyle = '#dc2626'; ctx.fillRect(-2, topY + 14, 4, 1.3); ctx.fillRect(-0.65, topY + 12.6, 1.3, 4);
      }
      // Bras avant
      if (front) drawArm(-1, armL, false);
      if (pose === 'coffee' && front) {
        ctx.save(); ctx.translate(8.6, topY + 3.2); ctx.rotate(armR);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-2.4, armLen + 0.5, 4.8, 4.8); ctx.restore();
      }

      // --- Tête (style illustration : visage sans traits)
      const nod = pose === 'wait' ? Math.sin(t * 1.3) * 1 : (pose === 'chat' ? Math.sin(t * 3.1) * 0.7 : 0);
      const hx = nod * 0.4;
      ctx.fillStyle = shade(a.skin, -0.1);
      ctx.fillRect(-2.2, topY - 3.5, 4.4, 4.5);
      ctx.fillStyle = a.skin;
      ctx.beginPath(); ctx.ellipse(hx, headCY, 5.6, 6.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath(); ctx.ellipse(hx + 2.2, headCY + 0.5, 3, 6, 0, -Math.PI / 2, Math.PI / 2); ctx.fill();
      ctx.fillStyle = a.hair;
      const hs = a.hairStyle;
      if (front) {
        if (hs === 2) { // très court
          ctx.beginPath(); ctx.ellipse(hx, headCY - 3.2, 5.7, 3.6, 0, Math.PI, Math.PI * 2); ctx.fill();
        } else {
          ctx.beginPath(); ctx.ellipse(hx, headCY - 2.4, 6, 4.8, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
          ctx.beginPath(); ctx.ellipse(hx - 4.4, headCY - 0.5, 1.8, 3.6, 0, 0, Math.PI * 2); ctx.fill();
          if (hs === 3) { ctx.fillRect(hx - 6, headCY - 2, 2.4, 9); ctx.fillRect(hx + 3.6, headCY - 2, 2.4, 9); }
        }
      } else {
        ctx.beginPath(); ctx.ellipse(hx, headCY - 0.6, 6, 6.8, 0, 0, Math.PI * 2); ctx.fill();
        if (hs === 1) { ctx.beginPath(); ctx.ellipse(hx, headCY + 7, 2.4, 5, 0, 0, Math.PI * 2); ctx.fill(); }
        if (hs === 3) ctx.fillRect(hx - 5.5, headCY, 11, 9);
      }
    }

    drawAgentOverlay(ctx, a) {
      const iso = this.iso;
      const dpr = window.devicePixelRatio || 1;
      const sitting = a.pose === 'sit' || a.pose === 'desk';
      const z = a.pose === 'sleep' ? 0.9 : (sitting ? 1.55 : (a.pose === 'cpr' || a.pose === 'kneel' ? 1.25 : 2.05));
      const [sx, sy] = iso.p(a.x, a.y, z);
      ctx.save();
      ctx.globalAlpha = a.alpha;
      if (a.bubble) {
        const s = Math.max(16, iso.k * 0.42);
        const life = Math.min(1, (a.bubble.until - a.t) * 3);
        const pop = Math.min(1, (a.t - (a.bubble.until - 3)) * 6);
        ctx.globalAlpha = a.alpha * Math.max(0, life);
        const r = s * 0.62 * Math.max(0.6, Math.min(1, pop));
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.strokeStyle = 'rgba(15,23,42,0.25)';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath(); ctx.arc(sx, sy - r - 4 * dpr, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx - 3 * dpr, sy - 5 * dpr); ctx.lineTo(sx, sy); ctx.lineTo(sx + 3 * dpr, sy - 5 * dpr); ctx.fill();
        ctx.font = `${Math.round(r * 1.15)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText(a.bubble.icon, sx, sy - r - 4 * dpr + 1);
      } else if (this.showLabels && iso.k > 26 * dpr) {
        // Pastille d'état discrète
        const meta = STATE_META[a.logicalState] || STATE_META.IDLE;
        ctx.globalAlpha = a.alpha * 0.9;
        ctx.fillStyle = meta.color;
        ctx.beginPath(); ctx.arc(sx, sy - 6 * dpr, 3.2 * dpr, 0, Math.PI * 2); ctx.fill();
      }
      if (this.hover && this.hover.agent === a) {
        ctx.globalAlpha = 1;
        const meta = STATE_META[a.logicalState] || STATE_META.IDLE;
        this.chip(ctx, sx, sy - (a.bubble ? 34 : 14) * dpr, `${a.name}${a.rank ? ' · ' + a.rank : ''} — ${meta.icon} ${meta.label}`, '#0f172a', '#ffffff');
      }
      ctx.restore();
    }

    chip(ctx, x, y, text, bg, fg) {
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.font = `700 ${Math.round(10.5 * dpr)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      const w = ctx.measureText(text).width + 14 * dpr;
      const h = 19 * dpr;
      ctx.fillStyle = bg;
      ctx.globalAlpha *= 0.9;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h, w, h, 7 * dpr); else ctx.rect(x - w / 2, y - h, w, h);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = fg;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y - h / 2 + 0.5);
      ctx.restore();
    }

    drawRoomLabels(ctx) {
      const iso = this.iso;
      const dpr = window.devicePixelRatio || 1;
      this.world.rooms.forEach(r => {
        const style = typeof this.locaux._getRoomStyle === 'function' ? this.locaux._getRoomStyle(r.type) : { name: r.type };
        const label = r.type && r.type !== 'libre' ? (style.name || r.type) : String(r.name || '').split('\n')[0];
        const [sx, sy] = iso.p(r.x + 0.25, r.y + r.h - 0.25, 0);
        ctx.save();
        ctx.font = `800 ${Math.round(9.5 * dpr)}px "Plus Jakarta Sans", system-ui, sans-serif`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const w = ctx.measureText(label).width + 10 * dpr;
        ctx.fillStyle = this.isNight ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.78)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(sx - 2 * dpr, sy - 8 * dpr, w, 16 * dpr, 5 * dpr); else ctx.rect(sx, sy - 8 * dpr, w, 16 * dpr);
        ctx.fill();
        ctx.fillStyle = this.isNight ? '#e2e8f0' : (style.label || '#334155');
        ctx.fillText(label, sx + 3 * dpr, sy + 0.5);
        ctx.restore();
      });
    }

    drawCrewCounters(ctx) {
      const out = this.directorOut;
      if (!out || !out.alerts.length) return;
      const iso = this.iso;
      out.alerts.forEach(al => {
        const v = this.vehicleById(al.vehicleId) || this.firstPresentVehicle();
        let anchor;
        if (v) anchor = iso.p(v.cx, v.cy, 3.4);
        else if (this.world.mainDoorOutside) anchor = iso.p(this.world.mainDoorOutside[0], this.world.mainDoorOutside[1], 2.6);
        else return;
        const complete = al.arrived >= al.required;
        const txt = `${complete ? '✅' : '👥'} Équipage ${al.arrived}/${al.required}${al.enRoute > 0 ? ` · ${al.enRoute} en route` : ''}`;
        const pulse = complete ? '#16a34a' : (Math.floor(this.time * 2) % 2 ? '#dc2626' : '#b91c1c');
        this.chip(ctx, anchor[0], anchor[1], txt, pulse, '#ffffff');
      });
    }

    drawHUD(ctx, dpr) {
      const c = this.canvas;
      const out = this.directorOut;
      // Bandeau d'alerte départ
      if (out && out.alerts.length) {
        const al = out.alerts[0];
        const complete = al.arrived >= al.required;
        const label = al.planned
          ? `🚑 ${al.title} — rassemblement (départ dans ${al.startsInMin} min) · ${al.arrived}/${al.required}`
          : `🚨 ${al.crisis ? 'RENFORT CRISE' : 'DÉPART'} — ${al.title} · Équipage ${al.arrived}/${al.required}${complete ? ' · complet' : ''}`;
        ctx.save();
        ctx.font = `800 ${Math.round(11.5 * dpr)}px "Plus Jakarta Sans", system-ui, sans-serif`;
        const w = Math.min(c.width - 20 * dpr, ctx.measureText(label).width + 28 * dpr);
        const x = (c.width - w) / 2, y = 84 * dpr;
        const a = 0.75 + Math.sin(this.time * 5) * 0.2;
        ctx.fillStyle = complete ? `rgba(22,163,74,${a})` : `rgba(220,38,38,${a})`;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, 26 * dpr, 9 * dpr); else ctx.rect(x, y, w, 26 * dpr);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, c.width / 2, y + 13.5 * dpr, w - 16 * dpr);
        ctx.restore();
        // Vignette rouge pulsée
        if (!complete && !al.planned) {
          ctx.save();
          const g = ctx.createRadialGradient(c.width / 2, c.height / 2, Math.min(c.width, c.height) * 0.35, c.width / 2, c.height / 2, Math.max(c.width, c.height) * 0.75);
          g.addColorStop(0, 'rgba(220,38,38,0)');
          g.addColorStop(1, `rgba(220,38,38,${0.12 + Math.sin(this.time * 5) * 0.06})`);
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.restore();
        }
      }

      // Légende des états (bas gauche)
      const counts = {};
      this.agents.forEach(a => { if (a.leaving) return; const s = a.logicalState; counts[s] = (counts[s] || 0) + 1; });
      const order = [AgentState.WAITING_CREW, AgentState.ON_DUTY_WAIT, AgentState.IN_TRAINING, AgentState.LOGISTICS, AgentState.IDLE];
      const items = order.filter(s => counts[s]).map(s => `${STATE_META[s].icon} ${counts[s]}`);
      const civ = this.agents.filter(a => a.civilian && !a.leaving).length;
      const header = `👥 ${this.agents.filter(a => !a.leaving).length} présent${this.agents.length > 1 ? 's' : ''}`;
      const txt = [header].concat(items).join('   ');
      ctx.save();
      ctx.font = `700 ${Math.round(10.5 * dpr)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      const w = ctx.measureText(txt).width + 20 * dpr;
      const x = 10 * dpr, y = c.height - 62 * dpr;
      ctx.fillStyle = this.isNight ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, 24 * dpr, 8 * dpr); else ctx.rect(x, y, w, 24 * dpr);
      ctx.fill();
      ctx.fillStyle = this.isNight ? '#e2e8f0' : '#0f172a';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, x + 10 * dpr, y + 12.5 * dpr);
      ctx.restore();
      void civ;
      if (this.paused) this.chip(ctx, c.width / 2, c.height / 2, '⏸️ Scène en pause', '#0f172a', '#fff');
    }

    // ---------- Interaction ----------

    toCanvas(e) {
      const rect = this.canvas.getBoundingClientRect();
      const pt = e.touches ? (e.touches[0] || e.changedTouches[0]) : e;
      return [(pt.clientX - rect.left) * (this.canvas.width / rect.width), (pt.clientY - rect.top) * (this.canvas.height / rect.height)];
    }

    hitTest(sx, sy) {
      const iso = this.iso;
      // Avatars (boîte écran)
      let best = null, bestD = Infinity;
      this.agents.forEach(a => {
        if (a.leaving) return;
        const [ax, ay] = iso.p(a.x, a.y, 0);
        const hw = iso.k * 0.32, hh = iso.k * 2.0;
        if (sx >= ax - hw && sx <= ax + hw && sy <= ay + iso.k * 0.15 && sy >= ay - hh) {
          const d = Math.abs(sx - ax) + (a.x + a.y) * -0.01;
          if (d < bestD) { bestD = d; best = { agent: a }; }
        }
      });
      if (best) return best;
      const [wx, wy] = iso.unproject(sx, sy);
      // Véhicules (emprise au sol élargie pour la hauteur)
      for (const v of this.world.vehicles) {
        const vs = this.vehStates.get(v.id);
        if (vs && vs.anim === 'away') continue;
        const b = v.box;
        for (let z = 0; z <= 2.4; z += 0.6) {
          const [px, py] = iso.unproject(sx, sy + z * iso.k * HZ);
          if (px >= b.x0 && px <= b.x1 && py >= b.y0 && py <= b.y1) return { veh: v };
        }
      }
      // Mobilier
      for (let i = this.world.furniture.length - 1; i >= 0; i--) {
        const f = this.world.furniture[i];
        const st = FURN_STYLE[f.type] || { h: 0.8 };
        for (let z = 0; z <= st.h; z += 0.3) {
          const [px, py] = iso.unproject(sx, sy + z * iso.k * HZ);
          if (px >= f.x && px <= f.x + f.w && py >= f.y && py <= f.y + f.d) return { furn: f };
        }
      }
      void wx; void wy;
      return null;
    }

    bindPointer() {
      const c = this.canvas;
      const opt = { capture: true, passive: false };
      const stop = (e) => { e.stopImmediatePropagation(); };
      let drag = null;
      let pinch = null;
      this._handlers = [];
      const on = (target, type, fn, o) => { target.addEventListener(type, fn, o || opt); this._handlers.push([target, type, fn, o || opt]); };

      on(c, 'mousedown', (e) => {
        if (!this.running) return;
        stop(e); e.preventDefault();
        const [sx, sy] = this.toCanvas(e);
        drag = { sx, sy, ox: this.iso.ox, oy: this.iso.oy, moved: false };
      });
      on(window, 'mousemove', (e) => {
        if (!this.running) return;
        const [sx, sy] = this.toCanvas(e);
        if (drag) {
          const dx = sx - drag.sx, dy = sy - drag.sy;
          if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
          this.iso.ox = drag.ox + dx; this.iso.oy = drag.oy + dy;
          if (drag.moved) this.userMoved = true;
          return;
        }
        const rect = c.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) { this.hover = null; return; }
        this.hover = this.hitTest(sx, sy);
      }, { capture: false, passive: true });
      on(window, 'mouseup', (e) => {
        if (!this.running || !drag) return;
        const wasClick = !drag.moved;
        drag = null;
        if (wasClick) { const [sx, sy] = this.toCanvas(e); this.onClick(sx, sy, e); }
      }, { capture: false, passive: true });
      on(c, 'wheel', (e) => {
        if (!this.running) return;
        stop(e); e.preventDefault();
        const [sx, sy] = this.toCanvas(e);
        this.zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, sx, sy);
      });
      on(c, 'dblclick', (e) => { if (!this.running) return; stop(e); e.preventDefault(); });
      on(c, 'contextmenu', (e) => { if (!this.running) return; e.preventDefault(); });
      on(c, 'touchstart', (e) => {
        if (!this.running) return;
        stop(e); e.preventDefault();
        if (e.touches.length === 2) {
          const r = c.getBoundingClientRect();
          const k = c.width / r.width;
          const [t1, t2] = [e.touches[0], e.touches[1]];
          pinch = { d: Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY), k: this.iso.k, cx: ((t1.clientX + t2.clientX) / 2 - r.left) * k, cy: ((t1.clientY + t2.clientY) / 2 - r.top) * k };
          drag = null;
        } else if (e.touches.length === 1) {
          const [sx, sy] = this.toCanvas(e);
          drag = { sx, sy, ox: this.iso.ox, oy: this.iso.oy, moved: false };
        }
      });
      on(c, 'touchmove', (e) => {
        if (!this.running) return;
        stop(e); e.preventDefault();
        if (pinch && e.touches.length === 2) {
          const [t1, t2] = [e.touches[0], e.touches[1]];
          const d = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          const target = clamp(pinch.k * d / pinch.d, 10, 240);
          this.zoomAt(target / this.iso.k, pinch.cx, pinch.cy);
        } else if (drag && e.touches.length === 1) {
          const [sx, sy] = this.toCanvas(e);
          const dx = sx - drag.sx, dy = sy - drag.sy;
          if (Math.abs(dx) + Math.abs(dy) > 8) drag.moved = true;
          this.iso.ox = drag.ox + dx; this.iso.oy = drag.oy + dy;
        }
      });
      on(c, 'touchend', (e) => {
        if (!this.running) return;
        stop(e); e.preventDefault();
        if (drag && !drag.moved && e.touches.length === 0) {
          const [sx, sy] = this.toCanvas(e);
          this.hover = this.hitTest(sx, sy);
          this.onClick(sx, sy, e);
        }
        if (e.touches.length === 0) { drag = null; pinch = null; }
      });
    }

    updateCursor() {
      const cur = this.hover ? 'pointer' : 'grab';
      if (this.canvas.style.cursor !== cur) this.canvas.style.cursor = cur;
    }

    onClick(sx, sy) {
      const hit = this.hitTest(sx, sy);
      if (!hit) { this.closeCard(); return; }
      if (hit.agent) { this.openCard(hit.agent); return; }
      this.closeCard();
      if (hit.veh && window.game && typeof window.game.openVehicleDetailsModal === 'function') {
        window.game.openVehicleDetailsModal(hit.veh.id);
        return;
      }
      if (hit.furn && typeof this.locaux.openFurnitureInteractionModal === 'function') {
        this.locaux.selectedFurnitureId = hit.furn.id;
        this.locaux.openFurnitureInteractionModal(hit.furn.id);
      }
    }

    // ---------- Overlay HTML (barre d'outils + fiche bénévole) ----------

    mountOverlay() {
      const parent = this.canvas.parentElement;
      if (!parent) return;
      const old = parent.querySelector('.protec-live-toolbar');
      if (old) old.remove();
      const bar = document.createElement('div');
      bar.className = 'protec-live-toolbar';
      bar.style.cssText = 'position:absolute;left:10px;top:46px;z-index:25;display:flex;gap:6px;flex-wrap:wrap;pointer-events:auto;';
      const narrow = parent.clientWidth > 0 && parent.clientWidth < 560;
      const btn = (id, label, title) => `<button type="button" data-act="${id}" title="${title}" style="height:30px;padding:0 10px;border-radius:10px;border:1px solid rgba(148,163,184,.6);background:rgba(255,255,255,.92);font:700 11px 'Plus Jakarta Sans',system-ui,sans-serif;color:#0f172a;box-shadow:0 2px 6px rgba(15,23,42,.12);cursor:pointer;">${narrow ? label.split(' ')[0] : label}</button>`;
      bar.innerHTML = [
        `<span style="height:30px;display:inline-flex;align-items:center;gap:6px;padding:0 10px;border-radius:10px;background:#dc2626;color:#fff;font:800 11px 'Plus Jakarta Sans',system-ui,sans-serif;box-shadow:0 2px 6px rgba(220,38,38,.35);"><span style="width:7px;height:7px;border-radius:50%;background:#fff;animation:pulse 1.2s infinite"></span>LIVE</span>`,
        btn('walls', '🧱 Murs', 'Murs hauts / coupés'),
        btn('rotate', '🔄 Pivoter', 'Faire pivoter la vue d’un quart de tour'),
        btn('labels', '🏷️ Étiquettes', 'Afficher les noms des pièces et véhicules'),
        btn('pause', '⏸️', 'Mettre en pause la scène'),
        btn('plan', '📐 Plan 2D', 'Revenir au plan d’architecte 2D')
      ].join('');
      bar.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-act]');
        if (!b) return;
        const act = b.dataset.act;
        if (act === 'walls') { this.wallsUp = !this.wallsUp; this.savePref('wallsUp', this.wallsUp); }
        if (act === 'rotate') { this.rotate(); }
        if (act === 'labels') { this.showLabels = !this.showLabels; this.savePref('labels', this.showLabels); }
        if (act === 'pause') { this.paused = !this.paused; b.textContent = this.paused ? '▶️' : '⏸️'; }
        if (act === 'plan') { window.ProtecBaseLive.toggleLiveMode(false); }
      });
      parent.appendChild(bar);
      this.toolbar = bar;
    }

    openCard(a) {
      this.selected = a;
      const parent = this.canvas.parentElement;
      if (!parent) return;
      let card = parent.querySelector('.protec-live-card');
      if (!card) {
        card = document.createElement('div');
        card.className = 'protec-live-card';
        card.style.cssText = 'position:absolute;left:10px;bottom:72px;z-index:26;width:250px;max-width:calc(100% - 20px);padding:12px;border-radius:16px;background:rgba(255,255,255,.97);border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(15,23,42,.18);font:500 12px "Plus Jakarta Sans",system-ui,sans-serif;color:#0f172a;';
        parent.appendChild(card);
        card.addEventListener('click', (e) => {
          const b = e.target.closest('[data-act]');
          if (!b) return;
          if (b.dataset.act === 'close') this.closeCard();
          if (b.dataset.act === 'module' && window.game && typeof window.game.openModule === 'function') window.game.openModule(b.dataset.module);
        });
      }
      const meta = STATE_META[a.logicalState] || STATE_META.IDLE;
      const asg = a.assignment || {};
      const moduleByState = { IN_TRAINING: ['formation', 'Formations'], LOGISTICS: ['logistique', 'Logistique'], WAITING_CREW: ['planning', 'Planning'], ON_DUTY_WAIT: ['samu', 'Garde SAMU'] };
      const mod = moduleByState[a.logicalState];
      const v = a.vol || {};
      const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <div style="font-weight:800;font-size:13px;">${esc(v.avatar || (a.civilian ? '🧑' : '🦺'))} ${esc(a.name)}</div>
          <button data-act="close" style="border:none;background:#f1f5f9;border-radius:8px;width:24px;height:24px;cursor:pointer;">✕</button>
        </div>
        <div style="color:#64748b;font-size:11px;margin-top:2px;">${esc(a.rank || '')}${v.role ? ' · ' + esc(v.role) : ''}</div>
        <div style="margin-top:8px;display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;background:${meta.color}1a;color:${meta.color};font-weight:800;font-size:11px;">${meta.icon} ${meta.label}</div>
        ${asg.label ? `<div style="margin-top:6px;font-size:11px;color:#334155;">${esc(asg.label)}</div>` : ''}
        ${typeof v.energy === 'number' ? `<div style="margin-top:8px;font-size:10px;color:#64748b;">Énergie ${Math.round(v.energy)}% · Moral ${Math.round(v.humeur ?? v.motivation ?? 0)}%</div>` : ''}
        ${mod ? `<button data-act="module" data-module="${mod[0]}" style="margin-top:10px;width:100%;height:30px;border:none;border-radius:10px;background:#002E6D;color:#fff;font-weight:800;font-size:11px;cursor:pointer;">Ouvrir ${mod[1]}</button>` : ''}
      `;
    }

    closeCard() {
      this.selected = null;
      const parent = this.canvas.parentElement;
      const card = parent && parent.querySelector('.protec-live-card');
      if (card) card.remove();
    }

    // Reprise de l'état d'une scène précédente (re-rendu de la modale = nouveau <canvas>)
    adopt(old) {
      ['agents', 'agentById', 'vehStates', 'world', 'worldSig', 'staticItems', 'staticSig', 'fitted', 'userMoved', 'directorOut', 'time', 'isNight', 'groundCache', 'paused'].forEach(k => { this[k] = old[k]; });
      this.iso.k = old.iso.k; this.iso.ox = old.iso.ox; this.iso.oy = old.iso.oy;
      this.firstSync = false;
      this.agents.forEach(a => { a.scene = this; });
      if (this.paused && this.toolbar) { const b = this.toolbar.querySelector('[data-act="pause"]'); if (b) b.textContent = '▶️'; }
    }

    destroy(keepAgents) {
      this.running = false;
      (this._handlers || []).forEach(([t, type, fn, o]) => t.removeEventListener(type, fn, o));
      this._handlers = [];
      if (this.toolbar) this.toolbar.remove();
      this.closeCard();
      if (!keepAgents) this.agents.forEach(a => a.releasePOI());
      if (window.ProtecBaseLive && window.ProtecBaseLive.scene === this) window.ProtecBaseLive.scene = null;
    }
  }

  // =========================================================================
  // 8. API PUBLIQUE
  // =========================================================================

  const ProtecBaseLive = {
    AgentState,
    Director,
    NavGrid,
    WorldModel,
    scene: null,
    liveMode: (function () { try { return localStorage.getItem('protec_live_mode') !== '0'; } catch (e) { return true; } })(),

    // La scène vivante remplace le plan 2D hors mode Aménagement
    shouldRun(locaux, canvas) {
      if (!this.liveMode || !locaux || !canvas) return false;
      if (locaux.isEditing || locaux._currentSetupModel) return false;
      if (locaux.activeTab && locaux.activeTab !== 'plan') return false;
      return true;
    },

    isActive(canvas) {
      return !!(this.scene && this.scene.running && (!canvas || this.scene.canvas === canvas));
    },

    attach(canvas, locaux) {
      if (this.scene && this.scene.canvas === canvas && this.scene.running) return this.scene;
      const old = this.scene;
      this.scene = null;
      const sc = new LiveScene(canvas, locaux);
      if (old) {
        // Même antenne : on conserve les avatars, la caméra et les animations en cours
        const sameStation = old.locaux === locaux && (old.directorOut && old.directorOut.station ? old.directorOut.station.id : null) === ((Director.stationOf(window.game, locaux) || {}).id || null);
        if (sameStation && old.world) sc.adopt(old);
        old.destroy(sameStation);
      }
      this.scene = sc;
      sc.start();
      return sc;
    },

    detach() {
      if (this.scene) { const s = this.scene; this.scene = null; s.destroy(); }
    },

    toggleLiveMode(force) {
      this.liveMode = typeof force === 'boolean' ? force : !this.liveMode;
      try { localStorage.setItem('protec_live_mode', this.liveMode ? '1' : '0'); } catch (e) { /* stockage indisponible */ }
      const L = window.ProtecLocaux;
      if (!this.liveMode) this.detach();
      if (L && typeof L.renderModal === 'function' && window.game) L.renderModal(window.game);
      else if (L) L.renderArchitectScene();
    },

    zoom(factor) { if (this.scene) this.scene.zoomAt(factor); },
    resetCamera() { if (this.scene) { this.scene.userMoved = false; this.scene.fitView(); } },

    // Outil de debug : état courant des avatars
    debug() {
      if (!this.scene) return [];
      return this.scene.agents.map(a => ({ id: a.id, name: a.name, state: a.state, logical: a.logicalState, pose: a.pose, x: +a.x.toFixed(2), y: +a.y.toFixed(2), poi: a.poi && a.poi.kind, leaving: a.leaving }));
    }
  };

  window.ProtecBaseLive = ProtecBaseLive;
})();
