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
  const VEH_AWAY = ['transit', 'mission', 'sur_les_lieux', 'in_transit', 'on_site', 'intervention', 'en_route', 'retour', 'vendu', 'garage_externe', 'station_lavage', 'station_service'];

  const ROOM_ROLE_BY_TYPE = {
    formation: 'TRAINING', bureau: 'OFFICE', pc_radio: 'RADIO', stockage: 'STORAGE', reserve: 'STORAGE',
    garage: 'GARAGE', detente: 'LOUNGE', foyer: 'LOUNGE', dortoir: 'DORM', salle_garde: 'DORM',
    vestiaire: 'LOCKER', douche: 'SANITARY', wc: 'SANITARY', couloir: 'CORRIDOR', libre: 'FREE'
  };

  const WALL_H = 2.5;        // Hauteur réelle sous plafond (m)
  const WALL_CUT = 0.3;      // Hauteur de coupe des cloisons et façades avant (m)
  const SILL_H = 0.9;        // Allège des fenêtres (m)
  const DOOR_H = 2.04;       // Hauteur de passage des portes (m)
  const CELL = 0.2;          // Taille de cellule de navigation (m)
  const AGENT_R = 0.16;      // Rayon de collision d'un avatar (m)
  const HZ = 1.05;           // Facteur d'échelle verticale de la projection
  const S_FLOOR = 20;        // Échelle virtuelle (px/m) pour réutiliser les routines de dessin 2D existantes
  const MAX_AGENTS = 22;
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
    if (n.includes('foyer') || n.includes('détente') || n.includes('detente') || n.includes('repos') || n.includes('kitchenette') || n.includes('cuisine') || n.includes('pause')) return 'LOUNGE';
    if (n.includes('couloir') || n.includes('dégagement') || n.includes('hall')) return 'CORRIDOR';
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

  // Grille de navigation (murs, ouvertures franchissables, mobilier, véhicules garés)
  function buildNavGrid(bounds, walls, doors, furniture, vehicles) {
    const nav = new NavGrid(bounds);
    const pad = AGENT_R;
    walls.forEach(w => {
      const th = Number(w.th) || 0.15;
      const x0 = Math.min(w.x1, w.x2) - th / 2 - pad, x1 = Math.max(w.x1, w.x2) + th / 2 + pad;
      const y0 = Math.min(w.y1, w.y2) - th / 2 - pad, y1 = Math.max(w.y1, w.y2) + th / 2 + pad;
      nav.fillRect(x0, y0, x1, y1, 0);
    });
    doors.forEach(d => {
      if (!PASSABLE_DOOR(d)) return;
      const r = doorRect(d, 0.45);
      const shrink = 0.06;
      if (r.vertical) nav.fillRect(r.x0, r.y0 + shrink, r.x1, r.y1 - shrink, 1);
      else nav.fillRect(r.x0 + shrink, r.y0, r.x1 - shrink, r.y1, 1);
    });
    furniture.forEach(f => {
      const st = FURN_STYLE[f.type];
      if (st && (st.z0 || 0) >= 1.0) return; // éléments muraux en hauteur
      nav.fillRect(f.x - 0.06, f.y - 0.06, f.x + f.w + 0.06, f.y + f.d + 0.06, 0);
    });
    (vehicles || []).forEach(v => {
      if (!v.present) return;
      nav.fillRect(v.box.x0 - 0.1, v.box.y0 - 0.1, v.box.x1 + 0.1, v.box.y1 + 0.1, 0);
    });
    return nav;
  }

  class WorldModel {
    constructor(model, vehicles, inventory) {
      this.model = model || {};
      this.inventory = inventory || { floor: [] };
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
      this.buildShelfItems();
      this.buildFloorStock();
    }

    // Contenu réel des étagères (storedInventory) posé niveau par niveau
    buildShelfItems() {
      const LEVELS = { etagere_lots: [0.08, 0.6, 1.15, 1.7], rack_palettes_lourd: [0.1, 0.85, 1.6] };
      this.furniture.forEach(f => {
        f._items = null;
        f._contents = Object.entries(f.storedInventory || {}).filter(([, q]) => q > 0);
        const levels = LEVELS[f.type];
        if (!levels || !f._contents.length) return;
        const longIsW = f.w >= f.d;
        const L = longIsW ? f.w : f.d, D = longIsW ? f.d : f.w;
        const units = [];
        f._contents.forEach(([id, q]) => { for (let i = 0; i < Math.min(q, 24); i++) units.push(id); });
        const items = [];
        let li = 0, cursor = 0.04, hidden = 0;
        for (const id of units) {
          if (li >= levels.length) { hidden++; continue; }
          const m = itemModelFor(id);
          const gap = (levels[li + 1] !== undefined ? levels[li + 1] : levels[li] + 0.6) - levels[li] - 0.08;
          const sc = Math.min(1, gap / m.h, (D - 0.08) / Math.min(m.d, m.w));
          let len = Math.max(m.w, m.d) * sc, dep = Math.min(m.w, m.d) * sc;
          if (len > L - 0.08) { const r = (L - 0.08) / len; len *= r; dep *= r; }
          if (cursor + len > L - 0.04) { li++; cursor = 0.04; if (li >= levels.length) { hidden++; continue; } }
          const z = levels[li] + 0.04;
          const off = (D - dep) / 2;
          const it = longIsW
            ? { m, id, x: f.x + cursor, y: f.y + off, z, w: len, d: dep, h: m.h * sc }
            : { m, id, x: f.x + off, y: f.y + cursor, z, w: dep, d: len, h: m.h * sc };
          items.push(it);
          cursor += len + 0.03;
        }
        f._items = items;
        f._hidden = hidden;
      });
    }

    // Matériel non rangé (stock de l'antenne, lots) : déposé le long des murs de la réserve
    buildFloorStock() {
      this.floorStacks = [];
      const list = (this.inventory.floor || []).filter(e => e.qty > 0);
      if (!list.length) return;
      const pickRooms = (role) => this.rooms.filter(r => this.roomHasRole(r, role));
      let rooms = pickRooms('STORAGE');
      if (!rooms.length) rooms = pickRooms('GARAGE');
      if (!rooms.length) rooms = this.rooms.slice().sort((a, b) => b.w * b.h - a.w * a.h).slice(0, 1);
      const doorPts = this.doors.map(d => { const r = doorRect(d, 0); return [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2]; });
      const hardPois = this.pois.filter(p => !['wander', 'yard'].includes(p.kind));
      const slots = [];
      rooms.forEach(room => {
        const inset = 0.42, step = 0.85;
        const sides = [
          { a: [room.x + inset, room.y + inset], dir: [1, 0], len: room.w - 2 * inset, along: 'x' },
          { a: [room.x + inset, room.y + room.h - inset], dir: [1, 0], len: room.w - 2 * inset, along: 'x' },
          { a: [room.x + inset, room.y + inset + step], dir: [0, 1], len: room.h - 2 * inset - step, along: 'y' },
          { a: [room.x + room.w - inset, room.y + inset + step], dir: [0, 1], len: room.h - 2 * inset - step, along: 'y' }
        ];
        sides.forEach(sd => {
          for (let t = 0; t <= sd.len; t += step) {
            const x = sd.a[0] + sd.dir[0] * t, y = sd.a[1] + sd.dir[1] * t;
            if (!this.nav.isWalkable(x, y)) continue;
            if (doorPts.some(([dx, dy]) => Math.hypot(dx - x, dy - y) < 1.2)) continue;
            if (hardPois.some(p => Math.hypot(p.x - x, p.y - y) < 0.65)) continue;
            if (slots.some(s2 => Math.hypot(s2.x - x, s2.y - y) < 0.7)) continue;
            slots.push({ x, y, along: sd.along });
          }
        });
      });
      // Zone de dépôt complémentaire : îlots au centre de la réserve (allées de 1 m conservées)
      rooms.forEach(room => {
        for (let y = room.y + 1.6; y < room.y + room.h - 1.4; y += 1.0) {
          for (let x = room.x + 1.6; x < room.x + room.w - 1.4; x += 1.7) {
            if (!this.nav.isWalkable(x, y)) continue;
            if (doorPts.some(([dx, dy]) => Math.hypot(dx - x, dy - y) < 1.4)) continue;
            if (hardPois.some(p => Math.hypot(p.x - x, p.y - y) < 0.9)) continue;
            if (slots.some(s2 => Math.hypot(s2.x - x, s2.y - y) < 0.8)) continue;
            slots.push({ x, y, along: 'x', island: true });
          }
        }
      });
      // Gros matériel d'abord, petits articles empilés (3 maximum)
      const entries = list.map(e => ({ ...e, m: itemModelFor(e.id) })).sort((a, b) => (b.m.w * b.m.d * b.m.h) - (a.m.w * a.m.d * a.m.h));
      entries.forEach(e => {
        let si = 0;
        const m = e.m;
        const small = m.h <= 0.45 && Math.max(m.w, m.d) <= 0.9;
        const perStack = small ? Math.max(1, Math.min(4, Math.floor(1.1 / m.h))) : 1;
        let remaining = Math.min(e.qty, small ? 12 : 4);
        const sc = Math.min(1, 0.8 / Math.max(m.w, m.d) * (Math.max(m.w, m.d) > 1.3 ? 1.6 : 1));
        const len = Math.max(m.w, m.d) * Math.min(1, sc), dep = Math.min(m.w, m.d) * Math.min(1, sc);
        const fits = (sl) => {
          const w = sl.along === 'x' ? len : dep, d = sl.along === 'x' ? dep : len;
          // L'emprise complète doit être libre (pas de mobilier, pas de mur)
          for (let yy = sl.y - d / 2; yy <= sl.y + d / 2 + 1e-6; yy += 0.15) for (let xx = sl.x - w / 2; xx <= sl.x + w / 2 + 1e-6; xx += 0.15) if (!this.nav.isWalkable(xx, yy)) return false;
          return true;
        };
        while (remaining > 0 && si < slots.length) {
          const sl = slots[si++];
          if (sl.used || !fits(sl)) continue;
          sl.used = true;
          const n = Math.min(perStack, remaining);
          remaining -= n;
          const w = sl.along === 'x' ? len : dep, d = sl.along === 'x' ? dep : len;
          const st = { id: e.id, name: e.name, qty: e.qty, m, n, x: sl.x - w / 2, y: sl.y - d / 2, w, d, h: m.h * Math.min(1, sc) };
          this.floorStacks.push(st);
          this.nav.fillRect(st.x - 0.04, st.y - 0.04, st.x + w + 0.04, st.y + d + 0.04, 0);
        }
      });
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
            else mk(hl.a, hl.b, { door: dType, lintel: true, doorRef: hl.it, vertical });
          } else {
            mk(hl.a, hl.b, { windowPane: true });
          }
          cur = Math.max(cur, hl.b);
          void 0;
        });
        if (cur < hi) mk(cur, hi, {});
      });
      this.wallPieces = pieces;
    }

    buildNav() {
      this.nav = buildNavGrid(this.bounds, this.walls, this.doors, this.furniture, this.vehicles);
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
              if (this.nav.isWalkable(x, y)) add({ ...base, x, y, face, kind, pose: 'sit', stool: true, mealTable: t === 'table_repas_equipe' });
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
          // Contrôle au clipboard : porte latérale et hayon
          cand.push({ x: cx + 0.3, y: b.y1 + 0.5, face: -Math.PI / 2, kind: 'clip', pose: 'clipboard' });
          cand.push({ x: rearX, y: cy + 0.5, face: faceRear, kind: 'clip', pose: 'clipboard' });
          // Lavage : tout autour de la carrosserie
          for (let i = 0; i < 3; i++) {
            const xx = b.x0 + (b.x1 - b.x0) * (i + 0.5) / 3;
            cand.push({ x: xx, y: b.y1 + 0.42, face: -Math.PI / 2, kind: 'wash', pose: 'wash' });
            cand.push({ x: xx, y: b.y0 - 0.42, face: Math.PI / 2, kind: 'wash', pose: 'wash' });
          }
          cand.push({ x: noseWest ? b.x0 - 0.42 : b.x1 + 0.42, y: cy, face: noseWest ? 0 : Math.PI, kind: 'wash', pose: 'wash' });
          cand.push({ x: rearX, y: cy - 0.3, face: faceRear, kind: 'wash', pose: 'wash' });
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
          cand.push({ x: b.x1 + 0.5, y: cy - 0.3, face: Math.PI, kind: 'clip', pose: 'clipboard' });
          cand.push({ x: cx - 0.5, y: rearY, face: fr, kind: 'clip', pose: 'clipboard' });
          for (let i = 0; i < 3; i++) {
            const yy = b.y0 + (b.y1 - b.y0) * (i + 0.5) / 3;
            cand.push({ x: b.x1 + 0.42, y: yy, face: Math.PI, kind: 'wash', pose: 'wash' });
            cand.push({ x: b.x0 - 0.42, y: yy, face: 0, kind: 'wash', pose: 'wash' });
          }
          cand.push({ x: cx, y: south ? b.y0 - 0.42 : b.y1 + 0.42, face: south ? Math.PI / 2 : -Math.PI / 2, kind: 'wash', pose: 'wash' });
          cand.push({ x: cx - 0.3, y: rearY, face: fr, kind: 'wash', pose: 'wash' });
        }
        cand.forEach(c => { if (this.nav.isWalkable(c.x, c.y)) add({ ...base, ...c }); });
      });

      this.pois = pois;
    }
  }

  // =========================================================================
  // 3bis. BIBLIOTHÈQUE DE MODÈLES DU MATÉRIEL (rendu isométrique procédural)
  // =========================================================================
  // shape : forme de base, w/d/h : dimensions réelles (m), color : teinte principale, mark : croix / logo
  // Modèles 3D simplifiés, calqués sur les illustrations de la boutique (caisses ouvertes -> boîte fermée)
  const ITEM_MODELS = {
    lot_secours_a:               { shape: 'tentbag', w: 1.1, d: 0.45, h: 0.42, color: '#e5e7eb', band: '#f97316', label: 'Lot A' },
    lot_secours_b:               { shape: 'backpack', w: 0.45, d: 0.3, h: 0.6, color: '#dc2626', stripe: '#facc15', mark: true },
    lot_secours_c:               { shape: 'bagstretcher', w: 1.85, d: 0.5, h: 0.5, color: '#dc2626', board: '#f97316', stripe: '#facc15' },
    lot_tronconnage:             { shape: 'tote', w: 0.8, d: 0.5, h: 0.42, color: '#f97316', lid: '#111827' },
    lot_pompage:                 { shape: 'pump', w: 0.75, d: 0.6, h: 0.62, color: '#dc2626' },
    lot_eclairage:               { shape: 'tote', w: 0.8, d: 0.5, h: 0.42, color: '#f97316', lid: '#111827' },
    lot_bachage:                 { shape: 'tote', w: 0.8, d: 0.5, h: 0.42, color: '#f97316', lid: '#111827' },
    lot_hebergement:             { shape: 'cots', w: 1.0, d: 0.6, h: 0.5, color: '#1e3a8a' },
    lot_ravitaillement:          { shape: 'alu', w: 0.85, d: 0.5, h: 0.45, color: '#cbd5e1', label: '#dc2626' },
    lot_cai:                     { shape: 'alu', w: 0.85, d: 0.5, h: 0.45, color: '#cbd5e1', label: '#dc2626' },
    lot_soutien_psy:             { shape: 'alu', w: 0.7, d: 0.45, h: 0.4, color: '#cbd5e1', label: '#7c3aed' },
    lot_poste_commandement_mobile:{ shape: 'rugged', w: 0.9, d: 0.55, h: 0.4, color: '#1e293b', logo: true },
    remorque_groupe_electro:     { shape: 'generator', w: 0.9, d: 0.6, h: 0.65, color: '#1f2937', accent: '#2563eb' },
    groupe_electrogene:          { shape: 'generator', w: 0.9, d: 0.6, h: 0.65, color: '#1f2937', accent: '#2563eb' },
    remorque_motopompe:          { shape: 'pump', w: 0.8, d: 0.6, h: 0.65, color: '#dc2626' },
    lot_drone_reco:              { shape: 'drone', w: 0.7, d: 0.5, h: 0.3, color: '#f1f5f9', accent: '#94a3b8' },
    lot_drone_thermique:         { shape: 'drone', w: 0.7, d: 0.5, h: 0.3, color: '#9ca3af', accent: '#374151' },
    caisse_rearmement:           { shape: 'alu', w: 0.65, d: 0.42, h: 0.38, color: '#cbd5e1', label: '#dc2626' },
    caisse_reassort:             { shape: 'alu', w: 0.65, d: 0.42, h: 0.38, color: '#cbd5e1', label: '#dc2626' },
    kit_psc:                     { shape: 'tote', w: 0.7, d: 0.45, h: 0.38, color: '#f97316', lid: '#111827' },
    kit_pse:                     { shape: 'tote', w: 0.7, d: 0.45, h: 0.38, color: '#f97316', lid: '#111827' },
    kit_gqs:                     { shape: 'backpack', w: 0.45, d: 0.3, h: 0.6, color: '#374151', stripe: '#9ca3af' },
    kit_pedago_extincteur:       { shape: 'extinguisher', w: 0.5, d: 0.2, h: 0.55, color: '#dc2626' },
    moniteur_t7:                 { shape: 'medbag', w: 0.6, d: 0.32, h: 0.34, color: '#2563eb', ends: '#111827' },
    schiller:                    { shape: 'medbag', w: 0.55, d: 0.3, h: 0.32, color: '#dc2626', ends: '#111827' },
    prise_parametres:            { shape: 'medbag', w: 0.55, d: 0.3, h: 0.32, color: '#dc2626', ends: '#111827' },
    oxygenBottles:               { shape: 'bottle', w: 0.16, d: 0.16, h: 0.75, color: '#f8fafc', cap: '#16a34a' },
    aedPads:                     { shape: 'box', w: 0.3, d: 0.2, h: 0.12, color: '#16a34a', mark: true },
    woundKits:                   { shape: 'box', w: 0.35, d: 0.25, h: 0.18, color: '#f8fafc', mark: true, markColor: '#dc2626' },
    cervicalCollars:             { shape: 'box', w: 0.4, d: 0.3, h: 0.2, color: '#fb923c' },
    telephone_garde:             { shape: 'slab', w: 0.1, d: 0.18, h: 0.02, color: '#111827' },
    phones:                      { shape: 'slab', w: 0.1, d: 0.18, h: 0.02, color: '#111827' },
    tablette:                    { shape: 'slab', w: 0.2, d: 0.28, h: 0.02, color: '#111827' },
    tablette_tlo:                { shape: 'slab', w: 0.2, d: 0.28, h: 0.02, color: '#111827' },
    lit_picot:                   { shape: 'cots', w: 0.9, d: 0.25, h: 0.25, color: '#1e3a8a' },
    rangers1:                    { shape: 'boots', w: 0.35, d: 0.3, h: 0.3, color: '#111827', accent: '#a3e635' },
    rangers2:                    { shape: 'boots', w: 0.35, d: 0.3, h: 0.3, color: '#111827', accent: '#a3e635' },
    rangers3:                    { shape: 'boots', w: 0.35, d: 0.3, h: 0.3, color: '#111827', accent: '#a3e635' }
  };
  const ITEM_RULES = [
    [/oxyg|o2|bouteille/i, { shape: 'bottle', w: 0.16, d: 0.16, h: 0.75, color: '#f8fafc', cap: '#16a34a' }],
    [/radio|talkie|antares|tpx|tph|relais/i, { shape: 'walkie', w: 0.4, d: 0.15, h: 0.28, color: '#111827', accent: '#f97316' }],
    [/telephone|phone|smartphone|tablette/i, { shape: 'slab', w: 0.1, d: 0.18, h: 0.02, color: '#111827' }],
    [/schiller|dae|dsa|defib|aed/i, { shape: 'medbag', w: 0.5, d: 0.3, h: 0.3, color: '#dc2626', ends: '#111827' }],
    [/moniteur|t7|tensio|param|ecg|scope/i, { shape: 'medbag', w: 0.6, d: 0.32, h: 0.34, color: '#2563eb', ends: '#111827' }],
    [/mannequin|rcp/i, { shape: 'mannequin', w: 0.55, d: 0.35, h: 0.45, color: '#e0a36b' }],
    [/extinct/i, { shape: 'extinguisher', w: 0.5, d: 0.2, h: 0.55, color: '#dc2626' }],
    [/tenue|vetement|parka|f1|eup|uniform|gilet/i, { shape: 'clothes', w: 0.4, d: 0.3, h: 0.25, color: '#1d3c8c' }],
    [/ranger|chaussure|botte/i, { shape: 'boots', w: 0.35, d: 0.3, h: 0.3, color: '#111827', accent: '#a3e635' }],
    [/casque/i, { shape: 'box', w: 0.3, d: 0.3, h: 0.22, color: '#f8fafc' }],
    [/drone/i, { shape: 'drone', w: 0.7, d: 0.5, h: 0.3, color: '#f1f5f9', accent: '#94a3b8' }],
    [/groupe|electro|generat/i, { shape: 'generator', w: 0.9, d: 0.6, h: 0.65, color: '#1f2937', accent: '#2563eb' }],
    [/pomp/i, { shape: 'pump', w: 0.7, d: 0.55, h: 0.6, color: '#dc2626' }],
    [/eclair|lumi|projecteur|lampe/i, { shape: 'tote', w: 0.8, d: 0.5, h: 0.42, color: '#f97316', lid: '#111827' }],
    [/bach|tarp/i, { shape: 'tote', w: 0.8, d: 0.5, h: 0.42, color: '#f97316', lid: '#111827' }],
    [/tente|abri|barnum/i, { shape: 'tentbag', w: 1.2, d: 0.45, h: 0.45, color: '#e5e7eb', band: '#f97316' }],
    [/lit|couchage|picot|hebergement/i, { shape: 'cots', w: 1.0, d: 0.6, h: 0.5, color: '#1e3a8a' }],
    [/cai|ravitaill|repas|ration/i, { shape: 'alu', w: 0.85, d: 0.5, h: 0.45, color: '#cbd5e1', label: '#dc2626' }],
    [/eau/i, { shape: 'water', w: 0.8, d: 0.6, h: 0.45, color: '#38bdf8' }],
    [/tronc|scie|chainsaw/i, { shape: 'tote', w: 0.8, d: 0.5, h: 0.42, color: '#f97316', lid: '#111827' }],
    [/brancard|immobil|attelle|matelas|plan_dur|cuillere/i, { shape: 'board', w: 1.85, d: 0.45, h: 0.12, color: '#facc15' }],
    [/collier|minerve/i, { shape: 'box', w: 0.4, d: 0.3, h: 0.2, color: '#fb923c' }],
    [/pansement|compresse|wound|soin|consommable|reassort|pharma/i, { shape: 'box', w: 0.35, d: 0.25, h: 0.18, color: '#f8fafc', mark: true, markColor: '#dc2626' }],
    [/psc|pse|sst|picf|ssa/i, { shape: 'tote', w: 0.7, d: 0.45, h: 0.38, color: '#f97316', lid: '#111827' }],
    [/sac|lot_b|kit_secours|gqs/i, { shape: 'backpack', w: 0.45, d: 0.3, h: 0.55, color: '#dc2626', stripe: '#facc15', mark: true }],
    [/pedago|formation|kit/i, { shape: 'tote', w: 0.7, d: 0.45, h: 0.38, color: '#f97316', lid: '#111827' }],
    [/caisse|rearm|reassort/i, { shape: 'alu', w: 0.65, d: 0.42, h: 0.38, color: '#cbd5e1', label: '#dc2626' }],
    [/vtt|velo|bike/i, { shape: 'bike', w: 1.7, d: 0.5, h: 1.0, color: '#ef4444' }]
  ];
  const ITEM_MODEL_CACHE = new Map();
  function itemModelFor(id) {
    const key = String(id || '');
    if (ITEM_MODEL_CACHE.has(key)) return ITEM_MODEL_CACHE.get(key);
    let m = ITEM_MODELS[key];
    if (!m) { const rule = ITEM_RULES.find(([rx]) => rx.test(key)); m = rule ? rule[1] : { shape: 'box', w: 0.45, d: 0.35, h: 0.3, color: '#c08a4b', tape: true }; }
    m = { ...m, id: key };
    ITEM_MODEL_CACHE.set(key, m);
    return m;
  }
  function itemName(id) {
    try {
      if (window.ProtecLocaux && typeof window.ProtecLocaux.getItemDisplayName === 'function') return window.ProtecLocaux.getItemDisplayName(id);
    } catch (e) { /* nom par défaut */ }
    return String(id).replace(/_/g, ' ');
  }

  // Dessin d'un matériel : (x0,y0,z0) coin inférieur, emprise w×d (déjà orientée), hauteur h
  function drawItemModel(ctx, iso, m, x0, y0, z0, w, d, h) {
    const x1 = x0 + w, y1 = y0 + d, z1 = z0 + h;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const P = (x, y, z) => iso.p(x, y, z);
    const k = iso.k;
    const cross = (col, z) => {
      const [sx, sy] = P(cx, cy, z);
      const s = Math.max(1.5, Math.min(w, d) * k * 0.28);
      ctx.fillStyle = col;
      ctx.fillRect(sx - s, sy - s * 0.18, s * 2, s * 0.36);
      ctx.fillRect(sx - s * 0.18, sy - s * 0.6, s * 0.36, s * 1.2);
    };
    // Bande colorée sur les faces visibles (+x, +y) d'un volume
    const band = (bx0, by0, bx1, by1, za, zb, col) => {
      poly(ctx, [P(bx0, by1 + 0.002, za), P(bx1, by1 + 0.002, za), P(bx1, by1 + 0.002, zb), P(bx0, by1 + 0.002, zb)], col);
      poly(ctx, [P(bx1 + 0.002, by0, za), P(bx1 + 0.002, by1, za), P(bx1 + 0.002, by1, zb), P(bx1 + 0.002, by0, zb)], shade(col, -0.15));
    };
    switch (m.shape) {
      case 'duffel': {
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z1 - h * 0.12, m.color);
        drawBox(ctx, iso, x0 + w * 0.06, y0 + d * 0.06, x1 - w * 0.06, y1 - d * 0.06, z1 - h * 0.12, z1, shade(m.color, 0.1));
        const along = w >= d;
        [0.3, 0.7].forEach(u => {
          if (along) drawBox(ctx, iso, x0 + w * u - 0.025, y0 - 0.005, x0 + w * u + 0.025, y1 + 0.005, z0, z1 + 0.005, '#1f2937', { edge: null });
          else drawBox(ctx, iso, x0 - 0.005, y0 + d * u - 0.025, x1 + 0.005, y0 + d * u + 0.025, z0, z1 + 0.005, '#1f2937', { edge: null });
        });
        break;
      }
      case 'backpack': {
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z1, m.color);
        drawBox(ctx, iso, x0 + w * 0.15, y1 - 0.02, x1 - w * 0.15, y1 + 0.05, z0 + h * 0.15, z0 + h * 0.6, shade(m.color, -0.15));
        if (m.stripe) { band(x0, y0, x1, y1, z0 + h * 0.28, z0 + h * 0.34, m.stripe); band(x0, y0, x1, y1, z0 + h * 0.66, z0 + h * 0.72, m.stripe); }
        if (m.mark) { const [sx, sy] = P(cx, y1 + 0.05, z0 + h * 0.75); ctx.fillStyle = '#fff'; const s = k * 0.05; ctx.fillRect(sx - s, sy - s * 0.3, s * 2, s * 0.6); ctx.fillRect(sx - s * 0.3, sy - s, s * 0.6, s * 2); }
        break;
      }
      case 'case': {
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z1, m.color);
        drawBox(ctx, iso, x0, y0, x1, y1, z0 + h * 0.62, z0 + h * 0.66, shade(m.color, -0.35), { edge: null });
        const along = w >= d;
        if (along) drawBox(ctx, iso, cx - 0.09, cy - 0.025, cx + 0.09, cy + 0.025, z1, z1 + 0.04, '#111827', { edge: null });
        else drawBox(ctx, iso, cx - 0.025, cy - 0.09, cx + 0.025, cy + 0.09, z1, z1 + 0.04, '#111827', { edge: null });
        if (m.stripe) drawBox(ctx, iso, x0, y0, x1, y1, z0 + h * 0.2, z0 + h * 0.28, m.stripe, { edge: null });
        if (m.mark) cross(m.markColor || '#fff', z1 + 0.001);
        if (m.screen) { const [ax, ay] = P(x0 + w * 0.2, y1, z0 + h * 0.75); const [bx, by] = P(x1 - w * 0.2, y1, z0 + h * 0.3); ctx.fillStyle = '#0ea5e9'; ctx.fillRect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax), Math.abs(by - ay)); }
        if (m.antenna) { const [ax, ay] = P(x1 - 0.08, y0 + 0.08, z1); ctx.strokeStyle = '#111827'; ctx.lineWidth = Math.max(1, k * 0.015); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - k * 0.45); ctx.stroke(); }
        break;
      }
      case 'alu': {
        // Caisse aluminium nervurée, fermoirs et étiquette (caisse de réassort, lot CAI…)
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z1 - h * 0.18, m.color, { top: '#e2e8f0' });
        drawBox(ctx, iso, x0 - 0.01, y0 - 0.01, x1 + 0.01, y1 + 0.01, z1 - h * 0.2, z1, '#94a3b8', { top: '#e5e7eb' });
        drawBox(ctx, iso, x0 + w * 0.08, y0 + d * 0.1, x1 - w * 0.08, y1 - d * 0.1, z1, z1 + 0.015, '#f1f5f9', { edge: null });
        // fermoirs sur la face avant
        [0.22, 0.78].forEach(u => { const fx = x0 + w * u; drawBox(ctx, iso, fx - 0.03, y1, fx + 0.03, y1 + 0.012, z1 - h * 0.32, z1 - h * 0.08, '#475569', { edge: null }); });
        // étiquette
        poly(ctx, [P(cx - w * 0.22, y1 + 0.003, z0 + h * 0.62), P(cx + w * 0.22, y1 + 0.003, z0 + h * 0.62), P(cx + w * 0.22, y1 + 0.003, z0 + h * 0.3), P(cx - w * 0.22, y1 + 0.003, z0 + h * 0.3)], '#ffffff', m.label || '#dc2626', Math.max(1, k * 0.02));
        poly(ctx, [P(cx - w * 0.16, y1 + 0.004, z0 + h * 0.52), P(cx + w * 0.16, y1 + 0.004, z0 + h * 0.52), P(cx + w * 0.16, y1 + 0.004, z0 + h * 0.46), P(cx - w * 0.16, y1 + 0.004, z0 + h * 0.46)], m.label || '#dc2626');
        break;
      }
      case 'tote': {
        // Bac de rangement orange à couvercle noir, fermé
        drawBox(ctx, iso, x0 + 0.02, y0 + 0.02, x1 - 0.02, y1 - 0.02, z0, z1 - h * 0.14, m.color);
        band(x0 + 0.02, y0 + 0.02, x1 - 0.02, y1 - 0.02, z0 + h * 0.45, z0 + h * 0.5, shade(m.color, -0.18));
        drawBox(ctx, iso, x0 - 0.01, y0 - 0.01, x1 + 0.01, y1 + 0.01, z1 - h * 0.14, z1, m.lid || '#111827', { top: '#1f2937' });
        const along = w >= d;
        if (along) drawBox(ctx, iso, cx - w * 0.2, cy - 0.02, cx + w * 0.2, cy + 0.02, z1, z1 + 0.012, '#374151', { edge: null });
        else drawBox(ctx, iso, cx - 0.02, cy - d * 0.2, cx + 0.02, cy + d * 0.2, z1, z1 + 0.012, '#374151', { edge: null });
        break;
      }
      case 'tentbag': {
        // Sac de tente blanc / gris, sangle orange
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z1, m.color, { top: '#f8fafc' });
        const along = w >= d, bc = m.band || '#f97316';
        if (along) {
          const a = x0 + w * 0.44, b = x0 + w * 0.56;
          poly(ctx, [P(a, y0, z1 + 0.002), P(b, y0, z1 + 0.002), P(b, y1, z1 + 0.002), P(a, y1, z1 + 0.002)], bc);
          poly(ctx, [P(a, y1 + 0.002, z0), P(b, y1 + 0.002, z0), P(b, y1 + 0.002, z1), P(a, y1 + 0.002, z1)], shade(bc, -0.1));
        } else {
          const a = y0 + d * 0.44, b = y0 + d * 0.56;
          poly(ctx, [P(x0, a, z1 + 0.002), P(x1, a, z1 + 0.002), P(x1, b, z1 + 0.002), P(x0, b, z1 + 0.002)], bc);
          poly(ctx, [P(x1 + 0.002, a, z0), P(x1 + 0.002, b, z0), P(x1 + 0.002, b, z1), P(x1 + 0.002, a, z1)], shade(bc, -0.15));
        }
        break;
      }
      case 'bagstretcher': {
        // Brancard pliant orange + sac rouge posé dessus (lot C)
        const along = w >= d;
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z0 + 0.1, m.board || '#f97316');
        const bw = along ? Math.min(0.5, w * 0.3) : d * 0.8, bd = along ? d * 0.8 : Math.min(0.5, d * 0.3);
        const bx0 = cx - bw / 2, by0 = cy - bd / 2;
        drawBox(ctx, iso, bx0, by0, bx0 + bw, by0 + bd, z0 + 0.1, z1, m.color);
        drawBox(ctx, iso, bx0, by0 + bd - 0.01, bx0 + bw, by0 + bd + 0.01, z0 + 0.1 + (h - 0.1) * 0.35, z0 + 0.1 + (h - 0.1) * 0.45, m.stripe || '#facc15', { edge: null });
        break;
      }
      case 'medbag': {
        // Sac médical souple : extrémités noires, corps coloré, poignée (ordre de peinture arrière -> avant)
        const along = w >= d, e = 0.18, ec = m.ends || '#111827', zt = z1 - h * 0.08;
        if (along) {
          drawBox(ctx, iso, x0, y0, x0 + w * e, y1, z0, zt, ec);
          drawBox(ctx, iso, x0 + w * e, y0 + 0.01, x1 - w * e, y1 - 0.01, z0, zt - 0.01, m.color);
          drawBox(ctx, iso, x1 - w * e, y0, x1, y1, z0, zt, ec);
          drawBox(ctx, iso, cx - w * 0.16, cy - 0.02, cx + w * 0.16, cy + 0.02, zt, z1, '#111827', { edge: null });
        } else {
          drawBox(ctx, iso, x0, y0, x1, y0 + d * e, z0, zt, ec);
          drawBox(ctx, iso, x0 + 0.01, y0 + d * e, x1 - 0.01, y1 - d * e, z0, zt - 0.01, m.color);
          drawBox(ctx, iso, x0, y1 - d * e, x1, y1, z0, zt, ec);
          drawBox(ctx, iso, cx - 0.02, cy - d * 0.16, cx + 0.02, cy + d * 0.16, zt, z1, '#111827', { edge: null });
        }
        break;
      }
      case 'rugged': {
        // Valise durcie noire (PC mobile)
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z1, m.color, { top: '#334155' });
        drawBox(ctx, iso, x0 - 0.01, y0 - 0.01, x1 + 0.01, y1 + 0.01, z0 + h * 0.48, z0 + h * 0.56, '#0f172a', { edge: null });
        [0.25, 0.75].forEach(u => { const fx = x0 + w * u; drawBox(ctx, iso, fx - 0.035, y1, fx + 0.035, y1 + 0.015, z0 + h * 0.4, z0 + h * 0.64, '#475569', { edge: null }); });
        if (m.logo) { const [lx, ly] = P(cx, cy, z1 + 0.002); const r = Math.max(1.5, k * 0.06); ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(lx, ly, r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#1d3c8c'; ctx.beginPath(); ctx.moveTo(lx, ly - r * 0.7); ctx.lineTo(lx + r * 0.65, ly + r * 0.45); ctx.lineTo(lx - r * 0.65, ly + r * 0.45); ctx.closePath(); ctx.fill(); }
        break;
      }
      case 'extinguisher': {
        // Extincteurs rouges côte à côte (kit pédagogique)
        const n = 3, along = w >= d;
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n;
          const px = along ? x0 + w * u : cx, py = along ? cy : y0 + d * u;
          const [bx, by] = P(px, py, z0), [tx, ty] = P(px, py, z1 - 0.08);
          const r = Math.max(1.2, Math.min(w, d) * k * 0.4);
          ctx.fillStyle = m.color; ctx.fillRect(bx - r, ty, r * 2, by - ty);
          ctx.fillStyle = 'rgba(15,23,42,0.2)'; ctx.fillRect(bx + r * 0.2, ty, r * 0.8, by - ty);
          ctx.beginPath(); ctx.ellipse(tx, ty, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fillStyle = shade(m.color, 0.15); ctx.fill();
          const [hx, hy] = P(px, py, z1); ctx.fillStyle = '#111827'; ctx.fillRect(hx - r * 0.45, hy, r * 0.9, ty - hy);
        }
        break;
      }
      case 'mannequin': {
        // Buste de mannequin de secourisme (couleur peau) sur sa housse
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z0 + h * 0.18, '#1e3a8a');
        drawBox(ctx, iso, x0 + w * 0.15, y0 + d * 0.2, x1 - w * 0.15, y1 - d * 0.2, z0 + h * 0.18, z0 + h * 0.62, m.color);
        const [hx, hy] = P(cx, cy, z0 + h * 0.82); const r = Math.max(1.5, Math.min(w, d) * k * 0.3);
        ctx.fillStyle = m.color; ctx.beginPath(); ctx.ellipse(hx, hy, r, r * 1.1, 0, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'slab': {
        // Téléphone / tablette durcis
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z1 + 0.01, m.color, { top: '#1f2937' });
        poly(ctx, [P(x0 + w * 0.12, y0 + d * 0.08, z1 + 0.012), P(x1 - w * 0.12, y0 + d * 0.08, z1 + 0.012), P(x1 - w * 0.12, y1 - d * 0.08, z1 + 0.012), P(x0 + w * 0.12, y1 - d * 0.08, z1 + 0.012)], '#0f172a');
        break;
      }
      case 'walkie': {
        // Radios portatives noires (liseré orange), antenne
        const n = Math.max(2, Math.round(w / 0.1));
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z0 + 0.04, '#374151', { edge: null });
        for (let i = 0; i < n; i++) {
          const px = x0 + (i + 0.2) * w / n, pw = w / n * 0.6;
          drawBox(ctx, iso, px, cy - 0.03, px + pw, cy + 0.03, z0 + 0.04, z1, m.color, { edge: null });
          drawBox(ctx, iso, px, cy + 0.03, px + pw, cy + 0.032, z0 + (z1 - z0) * 0.55, z0 + (z1 - z0) * 0.62, m.accent || '#f97316', { edge: null });
          const [ax, ay] = P(px + pw * 0.3, cy, z1); ctx.strokeStyle = '#111827'; ctx.lineWidth = Math.max(1, k * 0.012); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - k * 0.1); ctx.stroke();
        }
        break;
      }
      case 'crate': {
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z1 - 0.05, m.color);
        drawBox(ctx, iso, x0 - 0.01, y0 - 0.01, x1 + 0.01, y1 + 0.01, z1 - 0.05, z1, shade(m.color, -0.25));
        if (m.mark) cross(m.markColor || '#dc2626', z1 + 0.001);
        break;
      }
      case 'bottle': {
        const [bx, by] = P(cx, cy, z0), [tx, ty] = P(cx, cy, z1 - 0.08);
        const r = Math.max(1.5, w * k * 0.55);
        ctx.fillStyle = m.color; ctx.fillRect(bx - r, ty, r * 2, by - ty);
        ctx.fillStyle = 'rgba(15,23,42,0.18)'; ctx.fillRect(bx + r * 0.2, ty, r * 0.8, by - ty);
        ctx.beginPath(); ctx.ellipse(bx, by, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fillStyle = shade(m.color, -0.2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(tx, ty, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fillStyle = m.color; ctx.fill();
        const [cx2, cy2] = P(cx, cy, z1);
        ctx.fillStyle = m.cap || '#16a34a'; ctx.fillRect(cx2 - r * 0.5, cy2, r, ty - cy2);
        break;
      }
      case 'generator': {
        // Groupe électrogène : cadre tubulaire noir, carénage sombre à bandeau bleu, roues
        const fr = Math.max(1, k * 0.022);
        drawBox(ctx, iso, x0 + 0.06, y0 + 0.06, x1 - 0.06, y1 - 0.06, z0 + 0.08, z1 - 0.1, m.color);
        drawBox(ctx, iso, x0 + 0.06, y0 + 0.06, x1 - 0.06, y1 - 0.06, z0 + h * 0.55, z0 + h * 0.66, m.accent || '#2563eb', { edge: null });
        drawBox(ctx, iso, x0 + w * 0.25, y0 + d * 0.25, x1 - w * 0.25, y1 - d * 0.25, z1 - 0.1, z1 - 0.04, '#111827');
        ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = fr;
        const fz = [z0 + 0.06, z1];
        [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].forEach(([px, py]) => { const [a, b] = P(px, py, fz[0]), [c, d2] = P(px, py, fz[1]); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d2); ctx.stroke(); });
        fz.forEach(zz => { ctx.beginPath(); [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]].forEach(([px, py], i) => { const [sx, sy] = P(px, py, zz); if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); }); ctx.stroke(); });
        [[x0 + w * 0.15, y1], [x1 - w * 0.15, y1]].forEach(([px, py]) => { const [sx, sy] = P(px, py, z0 + 0.07); ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.ellipse(sx, sy, k * 0.08, k * 0.08, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9ca3af'; ctx.beginPath(); ctx.arc(sx, sy, k * 0.03, 0, Math.PI * 2); ctx.fill(); });
        break;
      }
      case 'pump': {
        // Motopompe : cadre tubulaire noir, moteur rouge, corps de pompe alu avec raccords
        const fr = Math.max(1, k * 0.022);
        const along = w >= d;
        const mid = along ? x0 + w * 0.55 : y0 + d * 0.55;
        if (along) {
          drawBox(ctx, iso, x0 + 0.05, y0 + 0.08, mid, y1 - 0.08, z0 + 0.05, z1 - 0.06, m.color);
          drawBox(ctx, iso, mid, y0 + 0.12, x1 - 0.05, y1 - 0.12, z0 + 0.05, z0 + h * 0.6, '#cbd5e1', { top: '#e2e8f0' });
        } else {
          drawBox(ctx, iso, x0 + 0.08, y0 + 0.05, x1 - 0.08, mid, z0 + 0.05, z1 - 0.06, m.color);
          drawBox(ctx, iso, x0 + 0.12, mid, x1 - 0.12, y1 - 0.05, z0 + 0.05, z0 + h * 0.6, '#cbd5e1', { top: '#e2e8f0' });
        }
        drawBox(ctx, iso, x0 + w * 0.2, y0 + d * 0.3, x0 + w * 0.42, y1 - d * 0.3, z1 - 0.06, z1, '#111827');
        const [hx, hy] = along ? P(x1 - 0.02, cy, z0 + h * 0.32) : P(cx, y1 - 0.02, z0 + h * 0.32);
        ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.ellipse(hx, hy, k * 0.07, k * 0.07, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = fr;
        [z0 + 0.05, z1].forEach(zz => { ctx.beginPath(); [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]].forEach(([px, py], i) => { const [sx, sy] = P(px, py, zz); if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); }); ctx.stroke(); });
        [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].forEach(([px, py]) => { const [a, b] = P(px, py, z0 + 0.05), [c, d2] = P(px, py, z1); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d2); ctx.stroke(); });
        break;
      }
      case 'light': {
        const [bx, by] = P(cx, cy, z0), [tx, ty] = P(cx, cy, z1 - 0.15);
        ctx.strokeStyle = '#111827'; ctx.lineWidth = Math.max(1, k * 0.03);
        [[-0.2, 0.1], [0.2, 0.1], [0, -0.22]].forEach(([dx, dy]) => { const [fx, fy] = P(cx + dx, cy + dy, z0); ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty + (by - ty) * 0.55); ctx.stroke(); });
        ctx.beginPath(); ctx.moveTo(bx, by - (by - ty) * 0.45); ctx.lineTo(tx, ty); ctx.stroke();
        drawBox(ctx, iso, cx - 0.18, cy - 0.06, cx + 0.18, cy + 0.06, z1 - 0.2, z1, '#111827', { top: '#374151' });
        poly(ctx, [P(cx - 0.16, cy + 0.061, z1 - 0.18), P(cx + 0.16, cy + 0.061, z1 - 0.18), P(cx + 0.16, cy + 0.061, z1 - 0.02), P(cx - 0.16, cy + 0.061, z1 - 0.02)], m.color);
        break;
      }
      case 'roll': {
        const along = w >= d;
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z1, m.color);
        if (along) { poly(ctx, [P(x1, y0 + 0.03, z0 + 0.03), P(x1, y1 - 0.03, z0 + 0.03), P(x1, y1 - 0.03, z1 - 0.03), P(x1, y0 + 0.03, z1 - 0.03)], shade(m.color, 0.25)); }
        else { poly(ctx, [P(x0 + 0.03, y1, z0 + 0.03), P(x1 - 0.03, y1, z0 + 0.03), P(x1 - 0.03, y1, z1 - 0.03), P(x0 + 0.03, y1, z1 - 0.03)], shade(m.color, 0.25)); }
        break;
      }
      case 'cots': {
        const n = 4, lh = h / n;
        for (let i = 0; i < n; i++) drawBox(ctx, iso, x0, y0, x1, y1, z0 + i * lh, z0 + i * lh + lh * 0.75, i % 2 ? shade(m.color, 0.12) : m.color);
        break;
      }
      case 'water': {
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z1, m.color, { top: '#e0f2fe' });
        const nx = Math.max(2, Math.round(w / 0.13)), ny = Math.max(2, Math.round(d / 0.13));
        ctx.fillStyle = '#1d4ed8';
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const [sx, sy] = P(x0 + (i + 0.5) * w / nx, y0 + (j + 0.5) * d / ny, z1 + 0.01); ctx.beginPath(); ctx.arc(sx, sy, Math.max(0.8, k * 0.025), 0, Math.PI * 2); ctx.fill(); }
        break;
      }
      case 'drone': {
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z0 + h * 0.65, m.color);
        const zt = z0 + h * 0.65;
        ctx.strokeStyle = '#374151'; ctx.lineWidth = Math.max(1, k * 0.025);
        const arms = [[x0 + 0.1, y0 + 0.1], [x1 - 0.1, y0 + 0.1], [x0 + 0.1, y1 - 0.1], [x1 - 0.1, y1 - 0.1]];
        const [c0x, c0y] = P(cx, cy, zt + 0.05);
        arms.forEach(([ax, ay]) => { const [sx, sy] = P(ax, ay, zt + 0.05); ctx.beginPath(); ctx.moveTo(c0x, c0y); ctx.lineTo(sx, sy); ctx.stroke(); ctx.beginPath(); ctx.ellipse(sx, sy, k * 0.08, k * 0.04, 0, 0, Math.PI * 2); ctx.stroke(); });
        drawBox(ctx, iso, cx - 0.07, cy - 0.07, cx + 0.07, cy + 0.07, zt, zt + 0.08, m.accent || '#e5e7eb');
        break;
      }
      case 'clothes': {
        const n = 3, lh = h / n;
        for (let i = 0; i < n; i++) {
          const top = i === n - 1;
          drawBox(ctx, iso, x0, y0, x1, y1, z0 + i * lh, z0 + (i + 1) * lh - 0.01, top ? '#f7941d' : m.color, top ? { top: '#fb9a2b' } : {});
          drawBox(ctx, iso, x0, y0, x1, y1, z0 + (i + 1) * lh - 0.035, z0 + (i + 1) * lh - 0.02, '#f8fafc', { edge: null });
        }
        break;
      }
      case 'boots': {
        drawBox(ctx, iso, x0, y0, x0 + w * 0.45, y1, z0, z1, m.color);
        drawBox(ctx, iso, x0 + w * 0.55, y0, x1, y1, z0, z1, m.color);
        if (m.accent) { drawBox(ctx, iso, x0, y1 - 0.005, x0 + w * 0.45, y1 + 0.004, z0 + h * 0.35, z0 + h * 0.6, m.accent, { edge: null }); drawBox(ctx, iso, x0 + w * 0.55, y1 - 0.005, x1, y1 + 0.004, z0 + h * 0.35, z0 + h * 0.6, m.accent, { edge: null }); drawBox(ctx, iso, x0, y0, x1, y1, z0, z0 + 0.03, '#0a0a0a', { edge: null }); }
        break;
      }
      case 'radio': {
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z0 + h * 0.35, '#374151');
        const n = Math.max(2, Math.round(w / 0.07));
        for (let i = 0; i < n; i++) {
          const px = x0 + (i + 0.2) * w / n;
          drawBox(ctx, iso, px, cy - 0.025, px + w / n * 0.6, cy + 0.025, z0 + h * 0.35, z1, m.color, { edge: null });
          const [ax, ay] = P(px + w / n * 0.3, cy, z1); ctx.strokeStyle = '#111827'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - k * 0.08); ctx.stroke();
        }
        break;
      }
      case 'board': {
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z1, m.color);
        ctx.fillStyle = '#111827';
        const along = w >= d;
        for (let i = 1; i < 6; i++) { const u = i / 6; const [sx, sy] = along ? P(x0 + w * u, cy, z1 + 0.002) : P(cx, y0 + d * u, z1 + 0.002); ctx.beginPath(); ctx.ellipse(sx, sy, k * 0.05, k * 0.025, 0, 0, Math.PI * 2); ctx.fill(); }
        break;
      }
      case 'bike': {
        const along = w >= d;
        const P2 = (u, z) => along ? P(x0 + w * u, cy, z0 + z) : P(cx, y0 + d * u, z0 + z);
        ctx.strokeStyle = '#111827'; ctx.lineWidth = Math.max(1, k * 0.03);
        [0.2, 0.8].forEach(u => { const [sx, sy] = P2(u, 0.33); ctx.beginPath(); ctx.ellipse(sx, sy, k * 0.3, k * 0.33, 0, 0, Math.PI * 2); ctx.stroke(); });
        ctx.strokeStyle = m.color; ctx.lineWidth = Math.max(1.5, k * 0.04);
        const a = P2(0.2, 0.33), b = P2(0.5, 0.35), c = P2(0.8, 0.33), d2 = P2(0.45, 0.8), e = P2(0.72, 0.85);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(d2[0], d2[1]); ctx.lineTo(a[0], a[1]); ctx.moveTo(b[0], b[1]); ctx.lineTo(e[0], e[1]); ctx.lineTo(c[0], c[1]); ctx.moveTo(d2[0], d2[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
        break;
      }
      default: {
        drawBox(ctx, iso, x0, y0, x1, y1, z0, z1, m.color);
        if (m.tape) { const along = w >= d; if (along) drawBox(ctx, iso, x0, cy - 0.03, x1, cy + 0.03, z1, z1 + 0.003, '#e7c48a', { edge: null }); else drawBox(ctx, iso, cx - 0.03, y0, cx + 0.03, y1, z1, z1 + 0.003, '#e7c48a', { edge: null }); }
        if (m.mark) cross(m.markColor || '#ffffff', z1 + 0.002);
      }
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
        if (m.logV2) return;
        if (m.status === 'completed' || m.status === 'canceled') return;
        const S = eventTs(m.eventDate);
        const active = m.status === 'ongoing' || m.status === 'en_cours' || (S && Math.abs(S - now) < 45 * 60000);
        if (!active) return;
        const vehicleId = m.targetVehicleId || (Array.isArray(m.targetVehicleIds) && m.targetVehicleIds[0]) || null;
        (m.registeredVolunteers || []).forEach(vid => set(vid, { state: AgentState.LOGISTICS, priority: PRIORITY.LOGISTICS + 1, missionId: m.id, vehicleId, label: m.title || 'Atelier réarmement' }));
      });

      // --- 4 bis. Missions logistiques planifiées : seuls les bénévoles arrivés à la base sont présents
      const MLog = window.ProtecMissionsLog;
      if (MLog) {
        missions.forEach(m => {
          if (!m.logV2 || !MLog.isOpen(m)) return;
          MLog.presentIds(game, m, now).forEach(vid => {
            const w = (m.workers || {})[vid];
            const tl = w && MLog.TASKS[w.kind] ? MLog.TASKS[w.kind].label : 'Logistique';
            set(vid, { state: AgentState.LOGISTICS, priority: PRIORITY.LOGISTICS + 1, missionId: m.id, vehicleId: w ? w.vehicleId : null, task: w ? w.kind : 'support', label: `${tl} · ${m.title || ''}` });
          });
        });
      }

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

      // --- 6. Armement / désarmement de véhicules : bénévoles affectés au garage par le module Logistique
      const vehs = this.stationVehicles(game, st);
      vehs.forEach(veh => {
        const queue = Array.isArray(veh.armingQueue) ? veh.armingQueue : [];
        if (!queue.length) return;
        const op = queue[0];
        const label = `${op.type === 'unload' ? 'Déchargement' : 'Armement'} ${veh.name || ''}${op.itemName ? ' · ' + op.itemName : ''}`;
        (veh.assignedArmingVolunteerIds || []).forEach(vid => set(vid, { state: AgentState.LOGISTICS, priority: PRIORITY.LOGISTICS + 2, vehicleId: veh.id, label, itemId: op.itemId || (op.itemData && op.itemData.id) || null }));
      });

      // --- 7. Personne ne vient à la base sans raison. Exceptions :
      //   a) salariés / services civiques pendant leurs heures de travail (lun-ven 8h-18h)
      //   b) moment de cohésion organisé (repas, jeux) pendant sa durée
      const free = (v) => !out.assignments.has(v.id) && (!v.status || v.status === 'dispo' || v.status === 'disponible' || v.status === 'base');
      const d = new Date(now);
      const workHours = d.getDay() >= 1 && d.getDay() <= 5 && d.getHours() >= 8 && d.getHours() < 18;
      if (workHours) {
        vols.filter(v => free(v) && (['salarie', 'service_civique'].includes(v.contractType) || ['salarie', 'service_civique'].includes(v.dispoType)))
          .forEach(v => set(v.id, { state: AgentState.IDLE, priority: PRIORITY.IDLE + 1, role: 'staff', label: v.contractType === 'service_civique' ? 'Mission de service civique' : 'Poste salarié à l’antenne' }));
      }
      let events = Array.isArray(game.baseEvents) ? game.baseEvents : [];
      if (!events.length) {
        // Événements de base non sauvegardés côté serveur : relecture du stockage local (survit à un rechargement)
        try { const ls = JSON.parse(localStorage.getItem('protec_base_events') || '[]'); if (Array.isArray(ls)) events = ls; } catch (e) { /* stockage indisponible */ }
      }
      const cohesion = events.find(e => e && e.type === 'cohesion' && now >= e.start && now < e.end && (!e.stationId || !st || e.stationId === st.id));
      out.cohesion = cohesion || null;
      if (cohesion) {
        vols.filter(free).sort((a, b) => hashStr(a.id + cohesion.id) - hashStr(b.id + cohesion.id)).slice(0, 12)
          .forEach(v => set(v.id, { state: AgentState.IDLE, priority: PRIORITY.IDLE, role: 'cohesion', label: cohesion.label || 'Moment de cohésion' }));
      }

      // --- 8. Chargement / déchargement de lots de crise (sans affectation explicite) : 2 manutentionnaires viennent
      vehs.forEach(veh => {
        const busy = veh.logOperation || veh.status === 'chargement' || veh.status === 'dechargement';
        if (!busy) return;
        const already = [...out.assignments.values()].filter(a => a.state === AgentState.LOGISTICS && a.vehicleId === veh.id).length;
        if (already >= 2) return;
        const label = (veh.logOperation && veh.logOperation.label) || `Logistique ${veh.name || ''}`;
        let pool = [...out.assignments.entries()].filter(([, a]) => a.state === AgentState.IDLE).map(([id]) => id);
        if (pool.length < 2 - already) pool = pool.concat(vols.filter(free).map(v => v.id));
        pool.slice(0, 2 - already).forEach(vid => set(vid, { state: AgentState.LOGISTICS, priority: PRIORITY.LOGISTICS, vehicleId: veh.id, label, itemId: veh.logOperation && veh.logOperation.kitId }));
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
      this.curSpeed = 0;
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
        if (this.mealing && this.poi.mealTable && this.pose === 'sit') this.pose = 'eat_sit';
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
      const changed = force || prev.state !== a.state || prev.missionId !== a.missionId || prev.vehicleId !== a.vehicleId || prev.role !== a.role || prev.phase !== a.phase || prev.task !== a.task;
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

      if (S === AgentState.LOGISTICS && a.task === 'wash') a.task = 'wash_hand';
      if (S === AgentState.LOGISTICS && a.task === 'wash_hand') {
        // Lavage à la main : seau et éponge, tour du véhicule
        const veh = sc.vehicleById(a.vehicleId);
        if (veh) {
          const poi = sc.pickPOI(this, ['wash'], null, { vehicleId: veh.id });
          if (poi) { this.goToPOI(poi, S); this.dur(7 + r() * 6); return; }
        }
        return this.wanderIn(['GARAGE', 'STORAGE'], S);
      }
      if (S === AgentState.LOGISTICS && a.task === 'rearm') {
        // Réarmement : contrôle au clipboard dans / à côté du véhicule, allers-retours vers l'armoire / l'étagère
        const veh = sc.vehicleById(a.vehicleId);
        this.logiStep = (this.logiStep + 1) % 3;
        if (veh && this.logiStep === 0) {
          const poi = sc.pickPOI(this, ['clip'], null, { vehicleId: veh.id });
          if (poi) { this.goToPOI(poi, S); this.dur(7 + r() * 5); return; }
        }
        if (this.logiStep === 1 || !veh) {
          const poi = sc.pickPOI(this, ['storage'], ['STORAGE', 'GARAGE', 'LOCKER'], { anyRoom: true, near: veh ? [veh.cx, veh.cy] : null });
          if (poi) { this.goToPOI(poi, S); this.dur(3 + r() * 3); return; }
        }
        if (veh) {
          const poi = sc.pickPOI(this, ['load', 'clip'], null, { vehicleId: veh.id });
          if (poi) { this.goToPOI(poi, S); this.dur(4 + r() * 3); return; }
        }
        return this.wanderIn(['STORAGE', 'GARAGE'], S);
      }
      if (S === AgentState.LOGISTICS && a.task === 'kit_unload') {
        // Déchargement : prendre au hayon, déposer en réserve
        const veh = sc.vehicleById(a.vehicleId);
        this.logiStep = (this.logiStep + 1) % 2;
        if (veh && this.logiStep === 1) {
          const poi = sc.pickPOI(this, ['load'], null, { vehicleId: veh.id });
          if (poi) { this.goToPOI(poi, S); this.dur(3 + r() * 2); this.unloadPick = true; return; }
        }
        const poi = sc.pickPOI(this, ['storage'], ['STORAGE', 'GARAGE', 'LOCKER'], { anyRoom: true, near: veh ? [veh.cx, veh.cy] : null });
        if (poi) { this.goToPOI(poi, S); this.dur(3 + r() * 2); this.unloadDrop = true; return; }
        return this.wanderIn(['STORAGE', 'GARAGE'], S);
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
        const poi = veh ? sc.pickPOI(this, ['gather', 'board'], null, { vehicleId: veh.id, preferFront: true }) : null;
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

      // IDLE : uniquement salariés au travail ou moment de cohésion
      if (a.role === 'staff') {
        const choice = pickWeighted(r, [{ v: 'desk', w: 6 }, { v: 'coffee', w: 1.2 }, { v: 'storage', w: 1 }, { v: 'wander', w: 0.8 }]);
        let poi = null;
        if (choice === 'desk') poi = sc.pickPOI(this, ['desk', 'radio_desk'], ['OFFICE', 'RADIO'], { anyRoom: true, keep: true });
        else if (choice === 'coffee') poi = sc.pickPOI(this, ['coffee'], null, { anyRoom: true });
        else if (choice === 'storage') poi = sc.pickPOI(this, ['storage'], ['STORAGE', 'GARAGE'], { anyRoom: true });
        if (poi) { this.goToPOI(poi, AgentState.IDLE); this.dur(choice === 'desk' ? 40 + r() * 50 : 8 + r() * 6); return; }
        return this.wanderIn(['OFFICE', 'RADIO', 'STORAGE'], AgentState.IDLE);
      }
      // Moment de cohésion : repas en commun, jeux, discussions
      const choice = pickWeighted(r, [
        { v: 'meal', w: 4 },
        { v: 'coffee', w: 1.5 },
        { v: 'sit', w: 2 },
        { v: 'game', w: 1.6 },
        { v: 'chat', w: 2 }
      ]);
      let poi = null;
      if (choice === 'meal') poi = sc.pickPOI(this, ['lounge_seat'], ['LOUNGE'], { anyRoom: true, mealOnly: true }) || sc.pickPOI(this, ['lounge_seat', 'seat'], ['LOUNGE'], { anyRoom: true });
      else if (choice === 'coffee') poi = sc.pickPOI(this, ['coffee'], null, { anyRoom: true });
      else if (choice === 'sit') poi = sc.pickPOI(this, ['lounge_seat', 'seat'], ['LOUNGE', 'FREE'], { anyRoom: true });
      else if (choice === 'game') poi = sc.pickPOI(this, ['game', 'lounge_spot'], ['LOUNGE'], { anyRoom: true });
      else if (choice === 'chat') poi = sc.pickChatSpot(this) || sc.pickPOI(this, ['lounge_spot'], ['LOUNGE'], { anyRoom: true });
      if (poi) {
        this.goToPOI(poi, AgentState.IDLE);
        if (choice === 'meal') this.mealing = true; else this.mealing = false;
        this.dur(choice === 'meal' ? 50 + r() * 40 : 14 + r() * 16);
        return;
      }
      return this.wanderIn(['LOUNGE', 'FREE'], AgentState.IDLE);
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
      if (S === AgentState.LOGISTICS && this.poi && this.assignment && this.assignment.task === 'kit_unload') {
        if (this.poi.kind === 'load') { this.carryNext = true; this.carryItemNext = this.scene.pickCarryItem(this); }
        else if (this.poi.kind === 'storage') { this.carry = false; this.say('📦', 1.6); }
      } else if (S === AgentState.LOGISTICS && this.poi && this.poi.kind === 'clip') { this.carry = false; this.say('📋', 2.4); }
      else if (S === AgentState.LOGISTICS && this.poi && this.poi.kind === 'wash') { this.carry = false; if (this.rng() < 0.3) this.say('🧽', 2); }
      else if (S === AgentState.LOGISTICS && this.poi) {
        if (this.poi.kind === 'storage') { this.carryNext = true; this.carryItemNext = this.scene.pickCarryItem(this); }
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
      if (this.carryNext && this.t > this.activityUntil - 0.6) { this.carry = true; this.carryItem = this.carryItemNext || null; this.carryNext = false; }
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
      // Accélération au départ, décélération à l'approche de la destination
      const end = this.path[this.path.length - 1];
      const remain = Math.hypot(end[0] - this.x, end[1] - this.y);
      const target = spd * Math.min(1, 0.35 + remain * 0.9);
      this.curSpeed = (this.curSpeed || 0) + (target - (this.curSpeed || 0)) * Math.min(1, dt * 5);
      const step = Math.max(0.05, this.curSpeed) * dt;
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
      this.walkPhase += step * (this.speed > 1.9 ? 5.6 : 6.6);
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
  // 6ter. VÉHICULES : SPRITES ISOMÉTRIQUES GÉNÉRÉS (images/vehicles/iso)
  // =========================================================================


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
      const horiz = (pk.spots || []).filter(sp => sp.w >= sp.d).length >= Math.max(1, (pk.spots || []).length / 2);
      const eastward = (pk.x + pk.w / 2) - (bx0 + bx1) / 2 > 0;
      const score = (pk.x + pk.w / 2 + pk.y + pk.h / 2) - ((bx0 + bx1) / 2 + (by0 + by1) / 2) + (horiz && eastward ? 2.5 : 0) - r * 0.01;
      if (score > bestScore) { bestScore = score; best = r; }
    }
    return best;
  }

  // Véhicule sale : voile de poussière / boue sur la carrosserie (cache par niveau de saleté)
  const DIRT_CACHE = new Map();
  function dirtySprite(img, clean) {
    const lvl = Math.min(6, Math.max(1, Math.round((100 - clean) / 14)));
    const key = img.src + '|' + lvl;
    if (DIRT_CACHE.has(key)) return DIRT_CACHE.get(key);
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    // Voile brun, plus marqué en bas de caisse
    const grad = g.createLinearGradient(0, 0, 0, c.height);
    grad.addColorStop(0, `rgba(120,96,64,${0.06 * lvl})`);
    grad.addColorStop(0.6, `rgba(110,84,52,${0.09 * lvl})`);
    grad.addColorStop(1, `rgba(86,62,36,${0.14 * lvl})`);
    g.fillStyle = grad; g.fillRect(0, 0, c.width, c.height);
    // Projections de boue
    const rng = mulberry32(hashStr(key));
    g.fillStyle = `rgba(74,52,30,${0.08 + 0.05 * lvl})`;
    for (let i = 0; i < 40 * lvl; i++) {
      const x = rng() * c.width, y = c.height * (0.45 + rng() * 0.55);
      g.beginPath(); g.arc(x, y, 0.6 + rng() * 2.2, 0, Math.PI * 2); g.fill();
    }
    DIRT_CACHE.set(key, c);
    return c;
  }

  class LiveScene {
    constructor(canvas, locaux, slot = 'locaux') {
      this.slot = slot;
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
      const nowT = performance.now();
      if (!this._inv || nowT - (this._invAt || 0) > 1000) { this._inv = this.inventorySnapshot(game, model, vehLayout); this._invAt = nowT; }
      const sig = JSON.stringify({
        r: (model.rooms || []).map(r => [r.id, r.type, r.x, r.y, r.w, r.h, r.name]),
        w: (model.walls || []).length,
        wl: (model.walls || []).map(w => [w.x1, w.y1, w.x2, w.y2]),
        d: (model.doors || []).map(d => [d.x, d.y, d.wall, d.len, d.type]),
        f: (model.furniture || []).map(f => [f.id, f.type, +f.x.toFixed(2), +f.y.toFixed(2), f.w, f.d]),
        p: model.parking ? [model.parking.x, model.parking.y, model.parking.w, model.parking.h, (model.parking.spots || []).length] : null,
        rot: model._rot,
        inv: this._inv ? this._inv.sig : '',
        v: vehLayout.map(v => [v.id, v.present, v.spriteSig])
      });
      if (sig === this.worldSig && this.world) return false;
      this.worldSig = sig;
      const oldPois = this.world ? this.world.pois : null;
      this.world = new WorldModel(model, vehLayout, this._inv);
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

    // Inventaire de l'antenne : stock non rangé + lots possédés non embarqués ni rangés
    inventorySnapshot(game, model, vehLayout) {
      const floor = [];
      const st = Director.stationOf(game, this.locaux);
      if (!st) return { floor, sig: '' };
      const stock = st.stock || {};
      const stored = {}, loaded = {};
      (model.furniture || []).forEach(f => Object.entries(f.storedInventory || {}).forEach(([id, q]) => { stored[id] = (stored[id] || 0) + (q || 0); }));
      (vehLayout || []).forEach(v => (v.veh.loadedItems || []).forEach(it => { if (it && it.id) loaded[it.id] = (loaded[it.id] || 0) + 1; }));
      Object.entries(stock).forEach(([id, q]) => { if (typeof q === 'number' && q >= 1) floor.push({ id, qty: Math.floor(q), name: itemName(id) }); });
      const E = window.ProtecEquipements;
      const we = (game && game.workplaceEquipment) || {};
      if (E && Array.isArray(E.LOTS_CATALOG)) {
        E.LOTS_CATALOG.forEach(l => {
          const owned = we[l.id] || 0;
          if (!owned) return;
          const rest = owned - (stored[l.id] || 0) - (loaded[l.id] || 0) - (stock[l.id] || 0);
          if (rest > 0) floor.push({ id: l.id, qty: rest, name: l.name });
        });
      }
      const sig = floor.map(e => e.id + ':' + e.qty).join('|') + '#' + Object.entries(stored).map(([k, q]) => k + ':' + q).join('|');
      return { floor, sig, stored, loaded };
    }

    pickCarryItem(agent) {
      const a = agent.assignment || {};
      if (a.itemId) return a.itemId;
      const W = this.world;
      const f = agent.poi && agent.poi.furnitureId ? W.furniture.find(x => x.id === agent.poi.furnitureId) : null;
      const pool = f && f._contents && f._contents.length ? f._contents.map(([id]) => id) : (W.floorStacks || []).map(sk => sk.id);
      return pool.length ? pool[Math.floor(agent.rng() * pool.length)] : null;
    }

    queueVehLabel(v, x, y) { (this._vehLabels = this._vehLabels || []).push({ v, x, y }); }

    // Statut lisible d'un véhicule (pour l'étiquette et la fiche)
    vehicleStatus(veh) {
      const q = Array.isArray(veh.armingQueue) ? veh.armingQueue : [];
      const arm = veh.armementLevel !== undefined ? veh.armementLevel : (veh.consumables !== undefined ? veh.consumables : (veh.consumablesPercent !== undefined ? veh.consumablesPercent : 100));
      if (q.length) {
        const tot = q.reduce((s2, op) => s2 + (op.totalSec || 180), 0), rem = q.reduce((s2, op) => s2 + Math.max(0, op.remainingSec || 0), 0);
        return { text: `🔧 ${q[0].type === 'unload' ? 'Déchargement' : 'Armement'} ${Math.round((1 - rem / Math.max(1, tot)) * 100)} %`, color: '#d97706', arm };
      }
      if (veh.logOperation || veh.status === 'chargement' || veh.status === 'dechargement') return { text: '📦 ' + ((veh.logOperation && veh.logOperation.label) || 'Chargement'), color: '#d97706', arm };
      if (veh.status === 'samu_garde') return { text: '🚑 Garde SAMU 15', color: '#2563eb', arm };
      if (veh.status === 'sdis_caserne') return { text: '🚒 Garde CODIS', color: '#dc2626', arm };
      if (veh.status === 'station_lavage') return { text: '🚿 Station de lavage', color: '#0284c7', arm };
      if (veh.status === 'station_service') return { text: '⛽ Station-service', color: '#0284c7', arm };
      if (VEH_AWAY.includes(veh.status)) return { text: '🚨 En intervention', color: '#dc2626', arm };
      if (veh.status === 'indispo' || veh.status === 'maintenance' || veh.status === 'garage') return { text: '🛠️ Indisponible', color: '#64748b', arm };
      const ML = window.ProtecMissionsLog;
      const lm = ML && ML.findOpenMissionForVehicle(window.game || {}, veh.id);
      if (lm && lm.status === 'ongoing') return { text: '🔧 Mission logistique', color: '#d97706', arm };
      if (veh.needsRearming || arm < 85) return { text: `⚠️ À réarmer`, color: '#ea580c', arm };
      if (typeof veh.cleanliness === 'number' && veh.cleanliness < 40) return { text: '🧽 À nettoyer', color: '#a16207', arm };
      return { text: '✅ Disponible', color: '#16a34a', arm };
    }

    drawVehicleLabels(ctx) {
      const dpr = window.devicePixelRatio || 1;
      (this._vehLabels || []).forEach(({ v, x, y }) => {
        const veh = v.veh;
        const stt = this.vehicleStatus(veh);
        this.chip(ctx, x, y - 16 * dpr, veh.name || veh.type || 'Véhicule', '#0f172a', '#ffffff');
        this.chip(ctx, x, y + 4 * dpr, stt.text, stt.color, '#ffffff');
        // Jauges armement / carburant
        const bw = 70 * dpr, bh = 4 * dpr, bx = x - bw / 2;
        const bar = (yy, val, col) => {
          ctx.fillStyle = 'rgba(15,23,42,0.55)'; ctx.fillRect(bx, yy, bw, bh);
          ctx.fillStyle = col; ctx.fillRect(bx, yy, bw * clamp(val / 100, 0, 1), bh);
        };
        const arm = clamp(Number(stt.arm) || 0, 0, 100);
        bar(y + 7 * dpr, arm, arm >= 85 ? '#22c55e' : (arm >= 50 ? '#f59e0b' : '#ef4444'));
        if (typeof veh.fuel === 'number') bar(y + 13 * dpr, veh.fuel, '#38bdf8');
        if (typeof veh.cleanliness === 'number') bar(y + 19 * dpr, veh.cleanliness, veh.cleanliness >= 60 ? '#a3e635' : (veh.cleanliness >= 40 ? '#d4a017' : '#92400e'));
      });
      this._vehLabels = [];
    }

    // Emplacements vides : véhicule parti en intervention
    drawAwayVehicles(ctx) {
      const iso = this.iso;
      const dpr = window.devicePixelRatio || 1;
      const game = window.game;
      (this.world.vehicles || []).forEach(v => {
        const vs = this.vehStates.get(v.id);
        if (!vs || vs.anim !== 'away') return;
        const sp = v.spot;
        ctx.save();
        ctx.setLineDash([6 * dpr, 5 * dpr]);
        poly(ctx, [iso.p(sp.x + 0.2, sp.y + 0.2), iso.p(sp.x + sp.w - 0.2, sp.y + 0.2), iso.p(sp.x + sp.w - 0.2, sp.y + sp.d - 0.2), iso.p(sp.x + 0.2, sp.y + sp.d - 0.2)], 'rgba(220,38,38,0.08)', 'rgba(220,38,38,0.7)', 2 * dpr);
        ctx.restore();
        const m = (game && game.missions || []).find(mi => mi.status !== 'completed' && ((mi.assignedVehicleIds || []).includes(v.id) || mi.vehicleId === v.id));
        if (this.showLabels || (this.hover && this.hover.veh === v)) {
          const [tx, ty] = iso.p(sp.x + sp.w / 2, sp.y + sp.d / 2, 0.3);
          const st2 = v.veh.status;
          if (st2 === 'station_lavage' || st2 === 'station_service') this.chip(ctx, tx, ty, `${v.veh.name || 'Véhicule'} · ${st2 === 'station_lavage' ? '🚿 à la station de lavage' : '⛽ à la station-service'}`, '#0369a1', '#ffffff');
          else this.chip(ctx, tx, ty, `${v.veh.name || 'Véhicule'} · ${m ? String(m.title || 'intervention').replace(/^\[[^\]]*\]\s*/, '').slice(0, 34) : 'en intervention'}`, '#b91c1c', '#ffffff');
        }
      });
    }

    // Infobulle des objets survolés (matériel, mobilier de stockage, véhicule)
    drawHoverInfo(ctx) {
      const h = this.hover;
      if (!h) return;
      const iso = this.iso;
      const dpr = window.devicePixelRatio || 1;
      if (h.stack) {
        const sk = h.stack;
        const [x, y] = iso.p(sk.x + sk.w / 2, sk.y + sk.d / 2, sk.h * sk.n + 0.35);
        this.chip(ctx, x, y, `📦 ${sk.name || itemName(sk.id)} × ${sk.qty} · en réserve (clic : inventaire)`, '#0f172a', '#ffffff');
      } else if (h.furn && h.furn._contents && (h.furn._contents.length || /etagere|rack|armoire|casier/.test(h.furn.type))) {
        const f = h.furn;
        const st = FURN_STYLE[f.type] || { h: 1 };
        const [x, y] = iso.p(f.x + f.w / 2, f.y + f.d / 2, (st.h || 1) + 0.35);
        const items = f._contents.slice(0, 3).map(([id, q]) => `${itemName(id)} ×${q}`).join(' · ');
        const label = f._contents.length ? `${f.label || 'Rangement'} : ${items}${f._contents.length > 3 ? ' …' : ''}` : `${f.label || f.type} · vide`;
        this.chip(ctx, x, y, label, '#0f172a', '#ffffff');
      } else if (h.room || h.parking) {
        const act = this.zoneAction(h);
        if (!act) return;
        let pts, cxy;
        if (h.room) { const r = h.room; pts = [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]]; cxy = [r.x + r.w / 2, r.y + r.h / 2]; }
        else { const pk = this.world.parking; pts = [[pk.x, pk.y], [pk.x + pk.w, pk.y], [pk.x + pk.w, pk.y + pk.h], [pk.x, pk.y + pk.h]]; cxy = [pk.x + pk.w / 2, pk.y + pk.h / 2]; }
        ctx.save();
        ctx.globalAlpha = 0.18 + Math.sin(this.time * 4) * 0.05;
        poly(ctx, pts.map(([x, y]) => iso.p(x, y, 0.01)), '#38bdf8');
        ctx.globalAlpha = 0.9;
        poly(ctx, pts.map(([x, y]) => iso.p(x, y, 0.01)), null, '#0284c7', 2 * dpr);
        ctx.restore();
        const [x, y] = iso.p(cxy[0], cxy[1], 1.4);
        this.chip(ctx, x, y, `${act.icon} ${act.label} — ${act.action}`, '#002E6D', '#ffffff');
      } else if (h.veh) {
        const veh = h.veh.veh;
        const loaded = (veh.loadedItems || []).map(it => it.name || itemName(it.id));
        const [x, y] = iso.p(h.veh.cx, h.veh.cy, 0.2);
        const parts = [];
        if (veh.logKit) parts.push('Kit : ' + veh.logKit.replace(/_/g, ' '));
        if (loaded.length) parts.push('À bord : ' + loaded.slice(0, 3).join(', ') + (loaded.length > 3 ? ` +${loaded.length - 3}` : ''));
        if (typeof veh.kilometrage === 'number') parts.push(`${Math.round(veh.kilometrage).toLocaleString('fr-FR')} km`);
        if (parts.length) this.chip(ctx, x, y + 26 * dpr, parts.join(' · '), '#334155', '#ffffff');
      }
    }

    // Menu associé à chaque zone de la base
    zoneAction(hit) {
      if (hit.parking) return { icon: '🚐', label: 'Parking', action: 'Ouvrir la flotte', module: 'flotte' };
      const room = hit.room;
      if (!room) return null;
      // Une pièce sans vocation (libre, couloir, sanitaires) n'ouvre aucun menu
      const t = String(room.type || 'libre').toLowerCase();
      if (t === 'libre' || !ROOM_ROLE_BY_TYPE[t]) return null;
      const roles = [ROOM_ROLE_BY_TYPE[t]];
      const guard = this.directorOut && this.directorOut.guardLabel;
      const MAP = {
        TRAINING: { icon: '🎓', label: 'Salle de formation', action: 'Ouvrir les formations', module: 'formation' },
        RADIO: guard ? { icon: '📻', label: 'PC radio', action: 'Ouvrir la garde SAMU', module: 'samu' } : { icon: '📻', label: 'PC radio', action: 'Ouvrir le planning', module: 'planning' },
        OFFICE: { icon: '💼', label: 'Bureau', action: 'Ouvrir les finances', module: 'finances' },
        LOUNGE: { icon: '🛋️', label: 'Foyer', action: 'Ouvrir les bénévoles', module: 'recrutement' },
        STORAGE: { icon: '📦', label: 'Réserve', action: 'Ouvrir le stock', module: 'logistique', opts: { tab: 'stock' } },
        GARAGE: { icon: '🚐', label: 'Garage', action: 'Ouvrir la flotte', module: 'flotte' },
        LOCKER: { icon: '🦺', label: 'Vestiaires', action: 'Ouvrir la logistique', module: 'logistique' },
        DORM: { icon: '🛏️', label: 'Salle de garde', action: 'Ouvrir la garde SAMU', module: 'samu' }
      };
      const role = roles.find(r => MAP[r]);
      if (!role) return null;
      return { ...MAP[role] };
    }

    // Ouverture d'un module du jeu depuis la scène
    openModule(key, opts = {}) {
      const game = window.game;
      if (!game || typeof game.openModule !== 'function') return;
      try {
        if (key === 'logistique' && window.ProtecLogistique) {
          const st = Director.stationOf(game, this.locaux);
          if (st) window.ProtecLogistique.selectedStationId = st.id;
          if (opts.tab) window.ProtecLogistique.activeTab = opts.tab;
        }
        if (key === 'planning' && typeof game.setPlanningTab === 'function') { game.setPlanningTab('calendar'); return; }
        game.openModule(key);
      } catch (e) { console.warn('[ProtecBaseLive] module', key, e); }
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
        let cands = pois.filter(p => p.kind === kind && free(p) && (!opts.vehicleId || p.vehicleId === opts.vehicleId) && (!opts.mealOnly || p.mealTable));
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
      if (opts.preferFront) {
        // Côté caméra d'abord (le rassemblement doit rester visible)
        const sorted = cands.slice().sort((a, b) => (b.x + b.y) - (a.x + a.y));
        return sorted[Math.floor(agent.rng() * Math.min(2, sorted.length))];
      }
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
          const covered = this.slot === 'base' && (() => { const m = document.getElementById('main-modal'); return m && !m.classList.contains('hidden'); })();
          if (!covered) this.render();
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
      this.updateDoors(dt);
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
      // Zone utile : dans « Ma base », on évite l'en-tête, le dock et les panneaux flottants
      const dprI = window.devicePixelRatio || 1;
      const ins = this.viewInsets ? this.viewInsets() : { l: 0, t: 0, r: 0, b: 0 };
      const L = ins.l * dprI, T = ins.t * dprI, Rr = ins.r * dprI, B = ins.b * dprI;
      const uw = Math.max(w * 0.4, w - L - Rr), uh = Math.max(h * 0.4, h - T - B);
      let k = Math.min((uw * 0.94) / (maxSX - minSX), (uh * 0.9) / (maxSY - minSY));
      if (h > w * 1.15) k *= 1.3; // écran vertical (mobile) : on rapproche la caméra, le joueur peut dézoomer
      this.iso.k = clamp(k, 8, 200);
      this.iso.ox = L + uw / 2 - ((minSX + maxSX) / 2) * this.iso.k;
      this.iso.oy = T + uh / 2 - ((minSY + maxSY) / 2) * this.iso.k + uh * 0.02;
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
      // Places de remisage intérieures (remise / garage) : marquage jaune au sol
      if (W.parking) {
        (W.parking.spots || []).forEach(sp => {
          if (!sp.indoor) return;
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 2.2;
          ctx.strokeRect(sp.x * S_FLOOR, sp.y * S_FLOOR, sp.w * S_FLOOR, sp.d * S_FLOOR);
        });
      }
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
      (W.floorStacks || []).forEach(sk => items.push({ kind: 'stock', x0: sk.x, y0: sk.y, x1: sk.x + sk.w, y1: sk.y + sk.d, ref: sk }));
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
      const darkTheme = document.documentElement.classList.contains('dark');
      if (night) { grad.addColorStop(0, '#0b1324'); grad.addColorStop(1, '#13261a'); }
      else if (darkTheme) { grad.addColorStop(0, '#0b1120'); grad.addColorStop(1, '#14532d'); }
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

      this.drawAwayVehicles(ctx);
      const editing = !!(this.edit && this.edit.active);
      if (editing) this.drawEditFloor(ctx);
      // Ombres des avatars (au sol, sous tout le reste)
      if (!editing) this.agents.forEach(a => {
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
        item.idx = idx;
        pending.push(item);
      };
      const pending = [];
      // Véhicules
      this.world.vehicles.forEach(v => {
        const vs = this.vehStates.get(v.id) || { anim: v.present ? 'parked' : 'away', offset: 0 };
        if (vs.anim === 'away') return;
        const [dx, dy] = this.vehicleOffset(v, vs.offset || 0);
        const b = v.box;
        insert({ veh: v, vs, dx, dy, depth: (b.x1 + dx) + (b.y1 + dy), box: { x0: b.x0 + dx, y0: b.y0 + dy, x1: b.x1 + dx, y1: b.y1 + dy } }, b.x0 + dx, b.y0 + dy, b.x1 + dx, b.y1 + dy);
      });
      if (!editing) this.agents.forEach(a => insert({ agent: a, depth: a.x + a.y }, a.x, a.y, a.x, a.y));
      // Avatars proches d'un véhicule : même groupe de dessin que lui (ordre relatif garanti)
      const vehItems = pending.filter(it => it.veh);
      pending.forEach(it => {
        if (!it.agent) return;
        vehItems.forEach(vi => {
          const b = vi.box;
          if (it.agent.x > b.x0 - 1.5 && it.agent.x < b.x1 + 1.5 && it.agent.y > b.y0 - 1.5 && it.agent.y < b.y1 + 1.5) {
            const m = Math.max(it.idx, vi.idx);
            it.idx = m; vi.idx = m;
          }
        });
      });
      pending.forEach(it => { if (!buckets.has(it.idx)) buckets.set(it.idx, []); buckets.get(it.idx).push(it); });

      const drawBucket = (idx) => {
        const list = buckets.get(idx);
        if (!list) return;
        // Avatar devant un véhicule s'il le dépasse côté +x ou +y ; sinon ordre de profondeur
        const before = (p, q) => {
          if (p.agent && q.veh) { const b = q.box; return !(p.agent.x >= b.x1 || p.agent.y >= b.y1); }
          if (p.veh && q.agent) { const b = p.box; return (q.agent.x >= b.x1 || q.agent.y >= b.y1); }
          return p.depth < q.depth;
        };
        list.sort((p, q) => p.depth - q.depth);
        for (let i = 1; i < list.length; i++) {
          const cur = list[i];
          let j = i - 1;
          while (j >= 0 && before(cur, list[j]) && !before(list[j], cur)) { list[j + 1] = list[j]; j--; }
          list[j + 1] = cur;
        }
        list.forEach(it => {
          if (it.agent) this.drawAgent(ctx, it.agent);
          else this.drawVehicle(ctx, it.veh, it.vs, it.dx, it.dy);
        });
      };
      drawBucket(-1);
      statics.forEach((s, i) => {
        if (s.kind === 'wall') this.drawWall(ctx, s.ref);
        else if (s.kind === 'stock') this.drawStack(ctx, s.ref);
        else if (!(editing && this.edit.drag && s.ref.id === this.edit.drag.id)) this.drawFurniture(ctx, s.ref);
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
      if (editing) {
        this.drawEditOverlay(ctx);
      } else {
        this.agents.forEach(a => this.drawAgentOverlay(ctx, a));
        this.drawVehicleLabels(ctx);
        this.drawHoverInfo(ctx);
        this.drawCrewCounters(ctx);
        this.drawHUD(ctx, dpr);
      }
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

    // Murs : fond à 2,50 m, cloisons et façades avant coupées à 30 cm (ou tout à 2,50 m via le bouton Murs)
    drawWall(ctx, p) {
      const iso = this.iso;
      const night = this.isNight;
      const H = (p.tall || this.wallsUp) ? WALL_H : WALL_CUT;
      const base = night ? '#334155' : (p.outer ? '#e7e5e4' : '#f5f5f4');
      const capCol = night ? '#475569' : (p.tall || this.wallsUp ? (p.outer ? '#b45309' : '#a8a29e') : '#57534e');
      const cut = { top: capCol };
      if (p.door) { this.drawDoor(ctx, p, H, base, capCol); return; }
      if (p.glass) {
        ctx.globalAlpha = 0.5;
        drawBox(ctx, iso, p.x0, p.y0, p.x1, p.y1, 0, H, '#7dd3fc', { top: '#bae6fd' });
        ctx.globalAlpha = 1;
        return;
      }
      if (p.windowPane && H <= SILL_H) {
        // Coupe sous l'allège : simple muret
        drawBox(ctx, iso, p.x0, p.y0, p.x1, p.y1, 0, H, base, cut);
        return;
      }
      if (p.windowPane) {
        // Allège pleine jusqu'à 0,90 m, vitrage au-dessus (jusqu'à 2,10 m), linteau si mur pleine hauteur
        drawBox(ctx, iso, p.x0, p.y0, p.x1, p.y1, 0, SILL_H, base, { top: '#d6d3d1' });
        const gTop = Math.min(H, 2.1);
        ctx.globalAlpha = 0.55;
        drawBox(ctx, iso, p.x0 + 0.03, p.y0 + 0.03, p.x1 - 0.03, p.y1 - 0.03, SILL_H, gTop, night ? '#fde68a' : '#7dd3fc', { top: '#e0f2fe', edge: 'rgba(14,116,144,0.6)' });
        ctx.globalAlpha = 1;
        if (H > 2.1) drawBox(ctx, iso, p.x0, p.y0, p.x1, p.y1, 2.1, H, base, cut);
        else { const [ax, ay] = iso.p(p.x0, p.y1, H), [bx, by] = iso.p(p.x1, p.y1, H); ctx.strokeStyle = capCol; ctx.lineWidth = Math.max(1, iso.k * 0.03); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
        return;
      }
      drawBox(ctx, iso, p.x0, p.y0, p.x1, p.y1, 0, H, base, cut);
    }

    // Ouvrants : bâti, battant(s) qui pivotent à l'approche d'un avatar, rideau métallique qui remonte
    drawDoor(ctx, p, H, base, capCol) {
      const iso = this.iso;
      const night = this.isNight;
      const d = p.doorRef || {};
      const vertical = p.vertical !== undefined ? p.vertical : (p.y1 - p.y0) > (p.x1 - p.x0);
      const st = this.doorState && this.doorState.get(this.doorKey(p));
      const open = st ? st.open : 0;
      const frameH = Math.min(H, DOOR_H + 0.06);
      const fc = night ? '#64748b' : '#57534e';
      // Linteau (mur pleine hauteur)
      if (H > DOOR_H + 0.06) drawBox(ctx, iso, p.x0, p.y0, p.x1, p.y1, DOOR_H + 0.06, H, base, { top: capCol });
      // Montants
      const ft = 0.06;
      if (vertical) {
        drawBox(ctx, iso, p.x0, p.y0, p.x1, p.y0 + ft, 0, frameH, fc, { edge: null });
        drawBox(ctx, iso, p.x0, p.y1 - ft, p.x1, p.y1, 0, frameH, fc, { edge: null });
      } else {
        drawBox(ctx, iso, p.x0, p.y0, p.x0 + ft, p.y1, 0, frameH, fc, { edge: null });
        drawBox(ctx, iso, p.x1 - ft, p.y0, p.x1, p.y1, 0, frameH, fc, { edge: null });
      }
      const cx = (p.x0 + p.x1) / 2, cy = (p.y0 + p.y1) / 2;
      const a0 = vertical ? p.y0 + ft : p.x0 + ft, a1 = vertical ? p.y1 - ft : p.x1 - ft;
      const leafH = Math.min(H, DOOR_H);
      if (p.door === 'garage_shutter') {
        // Rideau métallique : remonte avec l'ouverture
        const zb = leafH * open;
        if (zb < leafH - 0.02) {
          const P = (u, z) => vertical ? iso.p(cx, u, z) : iso.p(u, cy, z);
          poly(ctx, [P(a0, zb), P(a1, zb), P(a1, leafH), P(a0, leafH)], night ? '#475569' : '#cbd5e1', 'rgba(51,65,85,0.7)', 0.8);
          ctx.strokeStyle = 'rgba(71,85,105,0.55)'; ctx.lineWidth = Math.max(0.6, iso.k * 0.012);
          for (let z = zb + 0.12; z < leafH; z += 0.14) { const [x1, y1] = P(a0, z), [x2, y2] = P(a1, z); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
        }
        return;
      }
      // Sens d'ouverture : vers l'intérieur du bâtiment pour une porte extérieure, sinon vers +x / +y
      const W = this.world;
      const n = 0.5;
      const sideA = vertical ? W.roomAt(cx + n, cy) : W.roomAt(cx, cy + n);
      const sideB = vertical ? W.roomAt(cx - n, cy) : W.roomAt(cx, cy - n);
      const swing = sideA ? 1 : (sideB ? -1 : 1);
      const ang = open * 1.48;
      const leafCol = night ? '#94a3b8' : '#f1f5f9';
      const drawLeaf = (hingeU, dirU, len) => {
        const ux = vertical ? 0 : dirU, uy = vertical ? dirU : 0;
        const nx = vertical ? swing : 0, ny = vertical ? 0 : swing;
        const hx = vertical ? cx : hingeU, hy = vertical ? hingeU : cy;
        const ex = hx + len * (Math.cos(ang) * ux + Math.sin(ang) * nx);
        const ey = hy + len * (Math.cos(ang) * uy + Math.sin(ang) * ny);
        const pts = [iso.p(hx, hy, 0.02), iso.p(ex, ey, 0.02), iso.p(ex, ey, leafH), iso.p(hx, hy, leafH)];
        poly(ctx, pts, leafCol, 'rgba(51,65,85,0.75)', Math.max(0.8, iso.k * 0.015));
        // Poignée
        const hxp = hx + (len - 0.08) * (Math.cos(ang) * ux + Math.sin(ang) * nx), hyp = hy + (len - 0.08) * (Math.cos(ang) * uy + Math.sin(ang) * ny);
        if (leafH > 1.0) { const [qx, qy] = iso.p(hxp, hyp, Math.min(1.05, leafH - 0.05)); ctx.fillStyle = '#334155'; ctx.fillRect(qx - iso.k * 0.03, qy - iso.k * 0.02, iso.k * 0.06, iso.k * 0.04); }
      };
      if (p.door === 'double_door') {
        const half = (a1 - a0) / 2;
        drawLeaf(a0, 1, half);
        drawLeaf(a1, -1, half);
      } else {
        drawLeaf(a0, 1, a1 - a0);
      }
    }

    doorKey(p) { return (p.doorRef && p.doorRef.id) || `${p.x0.toFixed(2)}_${p.y0.toFixed(2)}`; }

    // Ouverture automatique des portes à l'approche des avatars / véhicules
    updateDoors(dt) {
      if (!this.world) return;
      if (!this.doorState) this.doorState = new Map();
      const vehMoving = [...this.vehStates.values()].some(v => v.anim === 'leaving' || v.anim === 'arriving');
      this.world.wallPieces.forEach(p => {
        if (!p.door) return;
        const key = this.doorKey(p);
        let st = this.doorState.get(key);
        if (!st) { st = { open: 0, hold: 0 }; this.doorState.set(key, st); }
        const cx = (p.x0 + p.x1) / 2, cy = (p.y0 + p.y1) / 2;
        let near = false;
        for (const a of this.agents) {
          if (a.removed) continue;
          const dd = Math.hypot(a.x - cx, a.y - cy);
          if (dd < 1.15 && (a.state === AgentState.MOVING || dd < 0.6)) { near = true; break; }
        }
        if (p.door === 'garage_shutter' && vehMoving) near = true;
        if (near) st.hold = 1.4; else st.hold = Math.max(0, st.hold - dt);
        const target = st.hold > 0 ? 1 : 0;
        const speed = p.door === 'garage_shutter' ? 0.9 : 3.2;
        st.open += Math.sign(target - st.open) * Math.min(Math.abs(target - st.open), dt * speed);
      });
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
          const lv = f.type === 'rack_palettes_lourd' ? [0.1, 0.85, 1.6] : [0.08, 0.6, 1.15, 1.7];
          void levels; void rng;
          // Étagère : le matériel réellement rangé (storedInventory) est posé sur les niveaux
          lv.filter(z => z < H).forEach(z => {
            drawBox(ctx, iso, x0, y0, x1, y1, z, z + 0.04, col, { edge: null });
            (f._items || []).filter(it => Math.abs(it.z - (z + 0.04)) < 0.01).forEach(it => drawItemModel(ctx, iso, it.m, it.x, it.y, it.z, it.w, it.d, it.h));
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

    drawStack(ctx, sk) {
      for (let i = 0; i < sk.n; i++) drawItemModel(ctx, this.iso, sk.m, sk.x, sk.y, i * sk.h, sk.w, sk.d, sk.h * 0.98);
      if (this.hover && this.hover.stack && this.hover.stack.id === sk.id) {
        const iso = this.iso;
        poly(ctx, [iso.p(sk.x, sk.y), iso.p(sk.x + sk.w, sk.y), iso.p(sk.x + sk.w, sk.y + sk.d), iso.p(sk.x, sk.y + sk.d)], null, '#38bdf8', Math.max(2, iso.k * 0.04));
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
      // Modèles isométriques générés (images/vehicles/iso), justes dans les 4 orientations.
      // Les illustrations de la boutique ne sont plus utilisées dans la scène.
      if (this.drawVehicleSprite(ctx, v, vs, dx, dy)) return;
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
        this.queueVehLabel(v, tx, ty);
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
      const cl = typeof v.veh.cleanliness === 'number' ? v.veh.cleanliness : 100;
      ctx.drawImage(cl < 85 ? dirtySprite(img, cl) : img, sx - meta.ax * sc, sy - meta.ay * sc, meta.w * sc, meta.h * sc);
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
        this.queueVehLabel(v, tx, ty);
      }
      return true;
    }

    // ---------- Avatars ----------

    drawAgent(ctx, a) {
      const iso = this.iso;
      if (a.pose === 'sleep' && a.poi && a.poi.bed) { this.drawSleeper(ctx, a); return; }
      const seated = a.state !== AgentState.MOVING && (a.pose === 'sit' || a.pose === 'desk' || a.pose === 'eat_sit');
      if (seated && !a.seatOn) {
        // Tabouret / chaise d'appoint
        const cs = 0.17, bx = a.x - Math.cos(a.dir) * 0.05, by = a.y - Math.sin(a.dir) * 0.05;
        drawBox(ctx, iso, bx - cs, by - cs, bx + cs, by + cs, 0.4, 0.45, '#0369a1');
        drawBox(ctx, iso, bx - 0.02, by - 0.02, bx + 0.02, by + 0.02, 0, 0.4, '#334155', { edge: null });
      }
      if (a.pose === 'eat_sit' && a.state !== AgentState.MOVING) {
        // Assiette et verre posés sur la table devant le convive
        const px = a.x + Math.cos(a.dir) * 0.42, py = a.y + Math.sin(a.dir) * 0.42;
        drawBox(ctx, iso, px - 0.12, py - 0.12, px + 0.12, py + 0.12, 0.745, 0.76, '#ffffff', { edge: 'rgba(15,23,42,0.25)' });
        drawBox(ctx, iso, px + 0.16, py - 0.03, px + 0.21, py + 0.02, 0.745, 0.86, '#bae6fd', { edge: null });
      }
      if (a.pose === 'wash' && a.state !== AgentState.MOVING) {
        // Seau d'eau savonneuse posé au sol à côté du laveur
        const bx = a.x - Math.sin(a.dir) * 0.32 - Math.cos(a.dir) * 0.1, by = a.y + Math.cos(a.dir) * 0.32 - Math.sin(a.dir) * 0.1;
        drawBox(ctx, iso, bx - 0.11, by - 0.11, bx + 0.11, by + 0.11, 0, 0.26, '#2563eb', { top: '#bfdbfe' });
      }
      const [sx, sy] = iso.p(a.x, a.y, 0);
      const u = iso.k * HZ / 40;           // 40 unités sprite = 1 m
      const cosd = Math.cos(a.dir), sind = Math.sin(a.dir);
      const sdx = cosd - sind, sdy = (cosd + sind) / 2;
      const front = sdy >= -0.05;
      const flip = sdx < 0;
      const sl = Math.hypot(sdx, sdy) || 1;
      a._sdir = [Math.abs(sdx) / sl, sdy / sl];
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

    // Avatar style illustration isométrique Protection Civile
    // Tenue : veste et pantalon bleu marine, empiècement orange épaules/poitrine, bande blanche de séparation,
    // liseré orange sur la jambe jusqu'en bas (sous la bande blanche basse), pantalon rentré dans des rangers montantes.
    drawPersonSprite(ctx, a, front) {
      const t = a.t;
      const moving = a.state === AgentState.MOVING && a.path;
      const pose = moving ? 'walk' : a.pose;
      const civil = a.outfit === 'civil';
      const gear = a.gear || {};
      const NAVY = '#1d3c8c', NAVY_D = '#152c69', ORANGE = '#f7941d', ORANGE_D = '#e07a0c', WHITE = '#eef2f7', BOOT = '#14171f', BOOT_L = '#2a2f3a';
      const pal = civil
        ? { top: a.tee, topD: shade(a.tee, -0.22), pants: a.jeans, pantsD: shade(a.jeans, -0.25), sleeveShort: a.shortSleeve }
        : { top: NAVY, topD: NAVY_D, pants: NAVY, pantsD: NAVY_D, sleeveShort: false };

      // --- Mélange doux entre poses (assis <-> debout, accroupi…)
      const poseHip = (p) => (p === 'sit' || p === 'desk' || p === 'eat_sit') ? 19 : ((p === 'cpr' || p === 'kneel') ? 14 : 34);
      if (a._lastPose !== pose) { a._prevPose = a._lastPose || pose; a._poseAt = t; a._lastPose = pose; }
      const bl = Math.min(1, Math.max(0, (t - (a._poseAt || 0)) / 0.32));
      const ease = bl * bl * (3 - 2 * bl);
      let hip = lerp(poseHip(a._prevPose || pose), poseHip(pose), ease);

      const walk = pose === 'walk';
      const run = walk && a.speed > 1.9;
      const ph = a.walkPhase;
      const sw = walk ? Math.sin(ph) * Math.min(1, a.curSpeed / 0.6 || 1) : 0;
      const dirX = a._sdir ? a._sdir[0] : 1, dirY = a._sdir ? a._sdir[1] : 0.3;
      let bob = walk ? (1 - Math.abs(Math.cos(ph))) * (run ? 2.6 : 1.5) : Math.sin(t * 1.7 + a.hs % 7) * 0.35;
      const sitting = pose === 'sit' || pose === 'desk' || pose === 'eat_sit';
      const kneeling = pose === 'cpr' || pose === 'kneel';
      if (sitting || kneeling) bob = 0;
      if (pose === 'cpr') bob = -Math.max(0, Math.sin(t * 11.5)) * 2.4;
      const lean = walk ? (run ? 2.4 : 1.0) : (pose === 'cpr' ? 3 : 0);  // inclinaison vers l'avant (décalage en x)
      const hipY = -hip - bob;
      const torsoH = 27;
      const topY = hipY - torsoH + (kneeling ? 3 : 0);
      const leanX = lean * dirX, leanY = lean * Math.max(0, dirY) * 0.4;

      // --- Sac de secours (vu de face : dépasse derrière les épaules)
      if (gear.backpack && front) {
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-12 + leanX, topY + 1, 24, 21, 4); else ctx.rect(-12 + leanX, topY + 1, 24, 21); ctx.fill();
      }
      const headCY = topY - 8.5;
      if (front && a.hairStyle === 1) {
        ctx.fillStyle = a.hair;
        ctx.beginPath(); ctx.ellipse(-5.5 + leanX * 1.3, headCY + 3 + Math.sin(t * 3) * 0.3, 2.6, 6.5, 0.35, 0, Math.PI * 2); ctx.fill();
      }

      // --- Jambes : hanche -> cheville, rangers montantes (pantalon rentré dedans)
      const BOOT_H = civil ? 3.4 : 10;   // hauteur de tige (≈ 25 cm)
      const drawLeg = (hx, fx, fy, dark, liftToe) => {
        const top = hipY + 1;
        const ankleY = fy - BOOT_H;
        const wT = 6.6, wB = 5.6;
        // Pantalon (trapèze hanche -> haut de tige)
        ctx.fillStyle = dark ? pal.pantsD : pal.pants;
        ctx.beginPath();
        ctx.moveTo(hx - wT / 2, top); ctx.lineTo(hx + wT / 2, top);
        ctx.lineTo(fx + wB / 2, ankleY + 0.8); ctx.lineTo(fx - wB / 2, ankleY + 0.8);
        ctx.closePath(); ctx.fill();
        if (!civil) {
          const len = ankleY - top;
          // Liseré orange latéral sur toute la hauteur…
          const side = dark ? 1 : -1;
          ctx.strokeStyle = dark ? ORANGE_D : ORANGE; ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.moveTo(hx + side * (wT / 2 - 0.6), top + 2); ctx.lineTo(fx + side * (wB / 2 - 0.6), ankleY + 0.5); ctx.stroke();
          // …recouvert par la bande blanche rétro-réfléchissante basse
          if (len > 12) {
            const bY = ankleY - 6.5;
            const k = (bY - top) / Math.max(1, len);
            const bx = lerp(hx, fx, k), bw = lerp(wT, wB, k);
            ctx.fillStyle = WHITE; ctx.fillRect(bx - bw / 2 - 0.1, bY, bw + 0.2, 2.4);
          }
        }
        // Ranger montante / basket
        ctx.fillStyle = civil ? a.shoe : BOOT;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(fx - wB / 2 - 0.4, ankleY, wB + 0.8, BOOT_H, [1.2, 1.2, 0.6, 0.6]); else ctx.rect(fx - wB / 2 - 0.4, ankleY, wB + 0.8, BOOT_H);
        ctx.fill();
        // Avant-pied (pointe dans le sens du regard)
        const toe = front ? 1.6 : 0.6;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(fx - wB / 2 - 0.6, fy - 3.4 - liftToe, wB + 1.6 + toe, 3.6, 1.6); else ctx.rect(fx - wB / 2 - 0.6, fy - 3.4, wB + 2, 3.6);
        ctx.fill();
        if (!civil) {
          ctx.fillStyle = BOOT_L; ctx.fillRect(fx - wB / 2 - 0.4, ankleY, wB + 0.8, 1.1);      // col rembourré
          ctx.fillStyle = '#0a0c11'; ctx.fillRect(fx - wB / 2 - 0.6, fy - 0.9 - liftToe, wB + 1.6 + toe, 0.9); // semelle crantée
          ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.5;
          for (let yy = ankleY + 2.5; yy < fy - 3.5; yy += 1.8) { ctx.beginPath(); ctx.moveTo(fx - 1.2, yy); ctx.lineTo(fx + 1.2, yy); ctx.stroke(); } // lacets
        } else {
          ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(fx - wB / 2 - 0.6, fy - 0.8, wB + 1.6 + toe, 0.8);
        }
      };
      if (sitting) {
        // Assis : cuisses vers l'avant, mollets verticaux
        const kx = 3.5 * dirX, ky = 2.5 * Math.max(0, dirY);
        drawLeg(-3.4, -3.6 + kx, 0 + ky * 0.2, false, 0);
        drawLeg(3.4, 3.6 + kx, 0 + ky * 0.2, true, 0);
      } else if (kneeling) {
        drawLeg(-4, -4.4 - dirX, 0, false, 0);
        drawLeg(4, 4.4 + dirX * 2, 0, true, 0);
      } else {
        // Marche : pied avant / pied arrière le long de la direction de déplacement à l'écran
        const stride = run ? 7 : 5;
        const f1 = sw * stride, f2 = -sw * stride;
        const lift1 = walk ? Math.max(0, -Math.cos(ph)) * (run ? 3 : 2) * (sw > 0 ? 1 : 0.4) : 0;
        const lift2 = walk ? Math.max(0, Math.cos(ph)) * (run ? 3 : 2) * (sw < 0 ? 1 : 0.4) : 0;
        const tap = pose === 'wait' ? Math.max(0, Math.sin(t * 7)) * 1.2 : 0;
        const shift = pose === 'stand' || pose === 'wait' || pose === 'chat' ? Math.sin(t * 0.5 + a.hs % 5) * 0.6 : 0; // report du poids
        drawLeg(-3.4 + leanX * 0.3, -3.6 + f1 * dirX + shift, f1 * dirY * 0.5 - lift1, false, 0);
        drawLeg(3.4 + leanX * 0.3, 3.6 + f2 * dirX + shift, f2 * dirY * 0.5 - lift2 - tap, true, 0);
      }

      // --- Bras articulés (épaule -> coude -> main, cinématique inverse à 2 segments)
      const UPPER = 11.5, FORE = 11;
      const shY = topY + 3.2;
      const shoulder = (side) => [side * 9.0 + leanX, shY];
      // Cible de la main en coordonnées sprite (avant = +x)
      const hand = (side) => {
        const [sx0, sy0] = shoulder(side);
        const far = side > 0; // bras côté +x (arrière-plan en vue de face)
        const breath = Math.sin(t * 1.7 + a.hs % 5) * 0.4;
        let hx = sx0 + side * 1.2, hy = sy0 + 21.5 + breath;
        if (walk) {
          const swing = (side < 0 ? sw : -sw) * (run ? 8 : 6);
          hx = sx0 + side * 0.8 + swing * dirX;
          hy = sy0 + 21.5 - Math.abs(swing) * (0.18 + (1 - dirX) * 0.25) + (run ? -3 : 0);
          if (run) hx += 2;
        }
        switch (pose) {
          case 'teach': if (far) { hx = sx0 + 11; hy = sy0 - 5 + Math.sin(t * 2.2) * 2.5; } break;
          case 'cpr': hx = leanX + 7 + (far ? 0.6 : 0); hy = sy0 + 15 + bob * 0.6; break;
          case 'kneel': hx = sx0 + 8 + (far ? Math.sin(t * 3) * 1.5 : 0); hy = sy0 + 15; break;
          case 'desk': hx = sx0 + 10 + Math.sin(t * (far ? 13 : 11)) * 0.6; hy = sy0 + 11 + Math.cos(t * 12 + side) * 0.4; break;
          case 'shelf': case 'locker': { const c = Math.sin(t * 2.4 + (far ? 1.6 : 0)); hx = sx0 + 9 + c * 1.5; hy = sy0 + (far ? -2 : 6) + c * 3; break; }
          case 'play': hx = sx0 + 9.5; hy = sy0 + 12 + Math.sin(t * 6 + side) * 1.6; hx += Math.sin(t * 6 + side) * 1.2; break;
          case 'coffee': if (far) { const sip = Math.max(0, Math.sin(t * 0.9) - 0.4) / 0.6; hx = lerp(sx0 + 5, leanX + 4.5, sip); hy = lerp(sy0 + 14, sy0 - 7, sip); } else { hx = sx0 + 4; hy = sy0 + 13; } break;
          case 'eat': case 'eat_sit': if (far) { const bb = Math.max(0, Math.sin(t * 1.6)); hx = lerp(sx0 + 8, leanX + 4.5, bb); hy = lerp(sy0 + 12, sy0 - 6, bb); } else { hx = sx0 + 8; hy = sy0 + 12; } break;
          case 'chat': if (far) { hx = sx0 + 7 + Math.sin(t * 2.7) * 2; hy = sy0 + 12 + Math.sin(t * 2.7 + 1) * 3; } break;
          case 'wait': {
            const watch = Math.sin(t * 0.7) > 0.75;
            if (!far && watch) { hx = leanX + 2; hy = sy0 + 10; }
            if (far && gear.radio) { hx = sx0 + 5; hy = sy0 + 9; }
            break;
          }
          case 'stand_radio': if (far) { hx = leanX + 4; hy = sy0 - 6; } break;
          case 'clipboard': if (!far) { hx = leanX + 5.5; hy = sy0 + 10; } else { hx = leanX + 6.5 + Math.sin(t * 9) * 0.8; hy = sy0 + 8 + Math.cos(t * 7) * 0.6; } break;
          case 'wash': if (far) { hx = sx0 + 10 + Math.cos(t * 5 + a.hs % 3) * 2.6; hy = sy0 + 7 + Math.sin(t * 5 + a.hs % 3) * 2.6; } else { hx = sx0 + 5; hy = sy0 + 16; } break;
          default: break;
        }
        if (sitting && !['desk', 'eat_sit'].includes(pose)) { hx = sx0 + 7; hy = sy0 + 15; } // mains sur les cuisses
        if (a.carry) { hx = side * 7.6 + leanX + 2; hy = topY + 16; }
        return [hx, hy];
      };
      const solveArm = (side) => {
        const [sx0, sy0] = shoulder(side);
        let [tx, ty] = hand(side);
        let dx = tx - sx0, dy = ty - sy0;
        let d = Math.hypot(dx, dy);
        const maxD = UPPER + FORE - 0.05, minD = Math.abs(UPPER - FORE) + 2;
        if (d > maxD) { tx = sx0 + dx / d * maxD; ty = sy0 + dy / d * maxD; d = maxD; }
        if (d < minD) { const k2 = minD / (d || 1); tx = sx0 + dx * k2; ty = sy0 + dy * k2; d = minD; }
        dx = tx - sx0; dy = ty - sy0;
        const base = Math.atan2(dy, dx);
        const cosA = clamp((UPPER * UPPER + d * d - FORE * FORE) / (2 * UPPER * d), -1, 1);
        const al = Math.acos(cosA);
        const e1 = [sx0 + Math.cos(base + al) * UPPER, sy0 + Math.sin(base + al) * UPPER];
        const e2 = [sx0 + Math.cos(base - al) * UPPER, sy0 + Math.sin(base - al) * UPPER];
        // Coude vers l'arrière (−x) et vers le bas
        const elbow = (e1[0] - e1[1] * 0.15) < (e2[0] - e2[1] * 0.15) ? e1 : e2;
        return { S: [sx0, sy0], E: elbow, H: [tx, ty] };
      };
      const holding = (side) => {
        if (a.carry) return null;
        const far = side > 0;
        if (far && gear.radio && (pose === 'wait' || pose === 'stand' || pose === 'stand_radio' || walk)) return 'radio';
        if (!far && gear.dae && pose !== 'cpr') return 'dae';
        if (far && (pose === 'coffee' || pose === 'eat' || pose === 'eat_sit')) return 'cup';
        if (!far && pose === 'clipboard') return 'clipboard';
        if (far && pose === 'clipboard') return 'pen';
        if (far && pose === 'wash') return 'sponge';
        return null;
      };
      // Écussons de manche : logo Protection Civile à droite, écusson départemental à gauche
      const rightSide = front ? -1 : 1;
      const deptPatch = civil ? null : this.deptPatch();
      const drawPatch = (kind, S, E) => {
        const side = S[0] - leanX > 0 ? 1 : -1;
        const px = lerp(S[0], E[0], 0.42) + side * 0.9, py = lerp(S[1], E[1], 0.42);
        const ang = Math.atan2(E[1] - S[1], E[0] - S[0]) - Math.PI / 2;
        ctx.save();
        ctx.translate(px, py); ctx.rotate(ang);
        if (kind === 'pc') {
          // Logo officiel : disque orange, triangle blanc à côtés bombés, triangle bleu au centre
          const R = 2.2;
          ctx.fillStyle = '#f7941d'; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
          const tA = [0, -R], tB = [R * 0.84, R * 0.55], tC = [-R * 0.84, R * 0.55];
          const bulge = (p, q) => { const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; const l = Math.hypot(mx, my) || 1; return [mx + mx / l * R * 0.2, my + my / l * R * 0.2]; };
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(tA[0], tA[1]);
          [[tA, tB], [tB, tC], [tC, tA]].forEach(([p0, q0]) => { const c0 = bulge(p0, q0); ctx.quadraticCurveTo(c0[0], c0[1], q0[0], q0[1]); });
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#004a8f'; ctx.beginPath(); ctx.moveTo(0, -R * 0.7); ctx.lineTo(R * 0.6, R * 0.39); ctx.lineTo(-R * 0.6, R * 0.39); ctx.closePath(); ctx.fill();
        } else if (deptPatch) {
          const img = deptPatch.img && deptPatch.img.complete && deptPatch.img.naturalWidth ? deptPatch.img : null;
          if (img) ctx.drawImage(img, -2.2, -2.6, 4.4, 5.2);
          else {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.moveTo(-2.1, -2.4); ctx.lineTo(2.1, -2.4); ctx.lineTo(2.1, 0.6); ctx.quadraticCurveTo(0, 3, 0, 3); ctx.quadraticCurveTo(0, 3, -2.1, 0.6); ctx.closePath(); ctx.fill();
            ctx.fillStyle = deptPatch.color || '#2563eb';
            ctx.beginPath(); ctx.moveTo(-1.6, -1.9); ctx.lineTo(1.6, -1.9); ctx.lineTo(1.6, 0.4); ctx.lineTo(0, 2.2); ctx.lineTo(-1.6, 0.4); ctx.closePath(); ctx.fill();
          }
        }
        ctx.restore();
      };
      const seg = (A, B, w, color, outline) => {
        ctx.lineCap = 'round';
        if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = w + 1.3; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); }
        ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      };
      const drawArm = (side, dark) => {
        const { S, E, H } = solveArm(side);
        const sleeve = dark ? pal.topD : pal.top;
        const skin = shade(a.skin, dark ? -0.12 : 0);
        if (civil && pal.sleeveShort) {
          const mid = [lerp(S[0], E[0], 0.55), lerp(S[1], E[1], 0.55)];
          seg(E, H, 4.2, skin); seg(mid, E, 4.4, skin); seg(S, mid, 5.4, sleeve);
        } else {
          const ol = shade(sleeve, -0.38);
          seg(E, H, 4.8, sleeve, ol);
          seg(S, E, 5.4, sleeve, ol);
          seg(E, [lerp(E[0], H[0], 0.2), lerp(E[1], H[1], 0.2)], 5, sleeve);
          if (!civil) {
            // Empiècement orange sur le haut de la manche (épaule)
            const o = [lerp(S[0], E[0], 0.34), lerp(S[1], E[1], 0.34)];
            seg(S, o, 5.6, dark ? ORANGE_D : ORANGE);
            // Poignet resserré
            const w = [lerp(E[0], H[0], 0.86), lerp(E[1], H[1], 0.86)];
            seg(w, [lerp(E[0], H[0], 0.9), lerp(E[1], H[1], 0.9)], 5, dark ? '#0f1f4d' : '#162f6e');
          }
        }
        if (!civil) {
          if (side === rightSide) drawPatch('pc', S, E);
          else if (deptPatch) drawPatch('dept', S, E);
        }
        ctx.fillStyle = skin;
        ctx.beginPath(); ctx.arc(H[0], H[1], 2.5, 0, Math.PI * 2); ctx.fill();
        const item = holding(side);
        if (item === 'radio') {
          ctx.fillStyle = '#111827'; ctx.fillRect(H[0] - 1.6, H[1] - 2.5, 3.2, 6.5);
          ctx.fillRect(H[0] - 0.5, H[1] - 5.5, 1, 3.5);
        } else if (item === 'dae') {
          ctx.fillStyle = '#16a34a'; ctx.fillRect(H[0] - 4, H[1] + 1, 8, 7);
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(H[0] - 0.9, H[1] + 4, 1.2, 0, Math.PI * 2); ctx.arc(H[0] + 0.9, H[1] + 4, 1.2, 0, Math.PI * 2); ctx.fill();
        } else if (item === 'clipboard') {
          ctx.fillStyle = '#7c4a1e'; ctx.fillRect(H[0] - 1, H[1] - 6, 7, 9);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(H[0] - 0.2, H[1] - 4.6, 5.4, 7);
          ctx.fillStyle = '#94a3b8'; for (let li = 0; li < 3; li++) ctx.fillRect(H[0] + 0.6, H[1] - 3.4 + li * 2, 3.6, 0.5);
          ctx.fillStyle = '#cbd5e1'; ctx.fillRect(H[0] + 1.2, H[1] - 6.6, 2.6, 1.2);
        } else if (item === 'pen') {
          ctx.fillStyle = '#1e3a8a'; ctx.fillRect(H[0] - 0.4, H[1] - 3.2, 0.9, 3.4);
        } else if (item === 'sponge') {
          ctx.fillStyle = '#facc15'; ctx.fillRect(H[0] - 2.2, H[1] - 1.6, 4.4, 3.2);
          ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(H[0] + 2.4, H[1] - 2, 0.9, 0, Math.PI * 2); ctx.arc(H[0] - 2.6, H[1] + 1, 0.7, 0, Math.PI * 2); ctx.fill();
        } else if (item === 'cup') {
          ctx.fillStyle = '#ffffff'; ctx.fillRect(H[0] - 1.8, H[1] - 4.2, 3.6, 4.6);
          ctx.fillStyle = '#92400e'; ctx.fillRect(H[0] - 1.4, H[1] - 4, 2.8, 0.9);
        }
      };
      if (front) drawArm(1, true);

      // --- Buste
      ctx.save();
      ctx.translate(leanX, leanY);
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
        // Empiècement orange + bande blanche de séparation (seule bande blanche du buste, devant comme dans le dos)
        ctx.fillStyle = ORANGE; ctx.fillRect(-11, topY - 1, 22, 11.5);
        ctx.fillStyle = WHITE; ctx.fillRect(-11, topY + 10.5, 22, 2.6);
        if (front) { ctx.fillStyle = '#0f1f4d'; ctx.fillRect(-0.5, topY + 13, 1, torsoH - 14); } // fermeture éclair
      } else if (a.hoodie) {
        ctx.fillStyle = shade(a.tee, 0.15); ctx.fillRect(-3, topY + 2, 6, torsoH - 6);
      }
      ctx.fillStyle = civil ? 'rgba(0,0,0,0.18)' : '#0f1f4d';
      ctx.fillRect(-11, hipY - 1, 22, 2.5);
      ctx.fillStyle = 'rgba(8,15,40,0.18)';
      ctx.fillRect(1.5, topY - 2, 12, torsoH + 6);
      ctx.restore();

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
      if (front && !civil && ['CE', 'CD', 'Cadre', 'Formateur'].includes(a.rank)) {
        ctx.fillStyle = '#facc15'; ctx.fillRect(-6.5, topY + 15, 4, 1.4);
      }
      if (a.carry) this.drawCarriedItem(ctx, a, topY);
      ctx.restore();

      if (front) drawArm(-1, false);
      else { drawArm(-1, false); drawArm(1, true); }

      // --- Tête (sans traits, style illustration)
      const look = (pose === 'wait' || pose === 'stand') ? Math.sin(t * 0.45 + a.hs % 9) * 1.1 : (pose === 'chat' ? Math.sin(t * 3.1) * 0.7 : 0);
      const hx = look * 0.5 + leanX * 1.4;
      const hy = headCY + leanY;
      ctx.fillStyle = shade(a.skin, -0.1);
      ctx.fillRect(-2.2 + leanX * 1.2, topY - 3.5 + leanY, 4.4, 4.5);
      ctx.fillStyle = a.skin;
      ctx.beginPath(); ctx.ellipse(hx, hy, 5.6, 6.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath(); ctx.ellipse(hx + 2.2, hy + 0.5, 3, 6, 0, -Math.PI / 2, Math.PI / 2); ctx.fill();
      ctx.fillStyle = a.hair;
      const hs = a.hairStyle;
      if (front) {
        if (hs === 2) {
          ctx.beginPath(); ctx.ellipse(hx, hy - 3.2, 5.7, 3.6, 0, Math.PI, Math.PI * 2); ctx.fill();
        } else {
          ctx.beginPath(); ctx.ellipse(hx, hy - 2.4, 6, 4.8, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
          ctx.beginPath(); ctx.ellipse(hx - 4.4, hy - 0.5, 1.8, 3.6, 0, 0, Math.PI * 2); ctx.fill();
          if (hs === 3) { ctx.fillRect(hx - 6, hy - 2, 2.4, 9); ctx.fillRect(hx + 3.6, hy - 2, 2.4, 9); }
        }
      } else {
        ctx.beginPath(); ctx.ellipse(hx, hy - 0.6, 6, 6.8, 0, 0, Math.PI * 2); ctx.fill();
        if (hs === 1) { ctx.beginPath(); ctx.ellipse(hx, hy + 7, 2.4, 5, Math.sin(t * 3) * 0.08, 0, Math.PI * 2); ctx.fill(); }
        if (hs === 3) ctx.fillRect(hx - 5.5, hy, 11, 9);
      }
    }

    // Écusson départemental du joueur (s'il le possède dans sa collection) — mis en cache
    deptPatch() {
      const now = performance.now();
      if (this._deptPatchAt && now - this._deptPatchAt < 3000) return this._deptPatch;
      this._deptPatchAt = now;
      let res = null;
      try {
        const game = window.game;
        const E = window.ProtecEcussons;
        const st = game && Director.stationOf(game, this.locaux);
        const code = String((st && st.departmentCode) || (game && game.currentDepartmentCode) || (game && game.player && game.player.departmentCode) || '').trim();
        if (E && code) {
          const want = 'dept_' + code;
          const owned = (E.playerEcussons || []).find(pe => {
            const ec = pe.ecusson || (E.catalog || []).find(c => c.id === pe.ecusson_id) || {};
            return (ec.code === want || pe.ecusson_id === 'ec-dept-' + code) && (pe.quantite === undefined || pe.quantite > 0);
          });
          if (owned) {
            const ec = owned.ecusson || (E.catalog || []).find(c => c.id === owned.ecusson_id) || {};
            res = { code, color: ec.color || '#2563eb', url: ec.imageUrl || ec.image_url || null };
            if (res.url) {
              if (!this._deptImg || this._deptImg._src !== res.url) { const img = new Image(); img._src = res.url; img.src = res.url; this._deptImg = img; }
              res.img = this._deptImg;
            }
          }
        }
      } catch (e) { res = null; }
      this._deptPatch = res;
      return res;
    }

    // Objet porté (le vrai matériel manipulé quand il est connu, sinon un carton)
    drawCarriedItem(ctx, a, topY) {
      const m = a.carryItem ? itemModelFor(a.carryItem) : null;
      const c = m ? m.color : '#b7791f';
      ctx.fillStyle = c;
      ctx.fillRect(-9, topY + 9, 18, 13);
      ctx.fillStyle = shade(c, 0.18); ctx.fillRect(-9, topY + 9, 18, 3);
      if (m && m.mark) {
        ctx.fillStyle = m.markColor || '#ffffff';
        ctx.fillRect(-2, topY + 14.5, 4, 1.3); ctx.fillRect(-0.65, topY + 13.2, 1.3, 4);
      } else if (!m) {
        ctx.fillStyle = '#dc2626'; ctx.fillRect(-2, topY + 14, 4, 1.3); ctx.fillRect(-0.65, topY + 12.6, 1.3, 4);
      }
    }

    drawAgentOverlay(ctx, a) {
      const iso = this.iso;
      const dpr = window.devicePixelRatio || 1;
      const sitting = a.pose === 'sit' || a.pose === 'desk' || a.pose === 'eat_sit';
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
        const label = String(r.name || '').split('\n')[0] || style.name || r.type;
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
        const x = (c.width - w) / 2, y = (this.slot === 'base' ? 122 : 84) * dpr;
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

      // Légende des états (bas gauche) — dans « Ma base », l'information est dans le panneau d'antenne
      if (this.slot === 'base') return;
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
      // Matériel au sol (réserve)
      for (const sk of (this.world.floorStacks || [])) {
        for (let z = 0; z <= sk.h * sk.n; z += 0.15) {
          const [px, py] = iso.unproject(sx, sy + z * iso.k * HZ);
          if (px >= sk.x - 0.05 && px <= sk.x + sk.w + 0.05 && py >= sk.y - 0.05 && py <= sk.y + sk.d + 0.05) return { stack: sk };
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
      // Pièce ou parking (zones cliquables qui ouvrent les menus)
      const room = this.world.roomAt(wx, wy);
      if (room) return { room };
      const pk = this.world.parking;
      if (pk && wx >= pk.x && wx <= pk.x + pk.w && wy >= pk.y && wy <= pk.y + pk.h) return { parking: true };
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
        if (this.editPointer('down', sx, sy)) return;
        drag = { sx, sy, ox: this.iso.ox, oy: this.iso.oy, moved: false };
      });
      on(window, 'mousemove', (e) => {
        if (!this.running) return;
        const [sx, sy] = this.toCanvas(e);
        if (this.edit && this.edit.active && (this.edit.drag || this.edit.pending || this.edit.placing)) {
          const rect0 = c.getBoundingClientRect();
          const inside = e.clientX >= rect0.left && e.clientX <= rect0.right && e.clientY >= rect0.top && e.clientY <= rect0.bottom;
          if (inside || this.edit.drag || this.edit.pending) { if (this.editPointer('move', sx, sy) && !drag) return; }
          else if (this.edit.placing) this.edit.ghost = null;
        }
        if (drag) {
          const dx = sx - drag.sx, dy = sy - drag.sy;
          if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
          this.iso.ox = drag.ox + dx; this.iso.oy = drag.oy + dy;
          if (drag.moved) this.userMoved = true;
          return;
        }
        const rect = c.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) { this.hover = null; return; }
        if (this.edit && this.edit.active) { const f = this.editHitFurniture(sx, sy); this.hover = f ? { furn: f } : null; return; }
        this.hover = this.hitTest(sx, sy);
      }, { capture: false, passive: true });
      on(window, 'mouseup', (e) => {
        if (!this.running) return;
        if (this.edit && this.edit.active) {
          const [sx, sy] = this.toCanvas(e);
          if (this.edit.drag || this.edit.pending) { if (this.editPointer('up', sx, sy)) { drag = null; return; } }
          else if (this.edit.placing && this.edit.downAt) {
            if (drag && drag.moved) this.edit.downAt = null;
            else { this.editPointer('up', sx, sy); drag = null; return; }
          }
        }
        if (!drag) return;
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
      on(window, 'keydown', (e) => {
        if (!this.running || !this.edit || !this.edit.active) return;
        if (this.editKey(e)) { e.preventDefault(); e.stopPropagation(); }
      }, { capture: true, passive: false });
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
          if (this.edit && this.edit.active && this.edit.placing) { this.editPointer('down', sx, sy); drag = null; return; }
          if (this.editPointer('down', sx, sy)) { drag = null; return; }
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
        } else if (this.edit && this.edit.active && !drag && e.touches.length === 1) {
          const [sx, sy] = this.toCanvas(e);
          this.editPointer('move', sx, sy);
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
        if (this.edit && this.edit.active && !drag && e.touches.length === 0) {
          const [sx, sy] = this.toCanvas(e);
          if (this.edit.placing && !this.edit.downAt) this.edit.downAt = [sx, sy];
          this.editPointer('up', sx, sy);
          pinch = null;
          return;
        }
        if (drag && !drag.moved && e.touches.length === 0) {
          const [sx, sy] = this.toCanvas(e);
          this.hover = this.hitTest(sx, sy);
          this.onClick(sx, sy, e);
        }
        if (e.touches.length === 0) { drag = null; pinch = null; }
      });
    }

    updateCursor() {
      if (this.edit && this.edit.active) {
        const E = this.edit;
        const cur = E.drag ? 'grabbing' : E.placing ? (E.ghost && !E.ghost.valid ? 'not-allowed' : 'copy') : (this.hover && this.hover.furn ? 'grab' : 'default');
        if (this.canvas.style.cursor !== cur) this.canvas.style.cursor = cur;
        return;
      }
      const h = this.hover;
      const clickable = h && !((h.room || h.parking) && !h.agent && !h.veh && !h.stack && !h.furn && !this.zoneAction(h));
      const cur = clickable ? 'pointer' : 'grab';
      if (this.canvas.style.cursor !== cur) this.canvas.style.cursor = cur;
    }

    onClick(sx, sy) {
      if (this.edit && this.edit.active) { if (this.edit.sel) { this.edit.sel = null; this.editRenderPanel(); } return; }
      const hit = this.hitTest(sx, sy);
      if (!hit) { this.closeCard(); return; }
      if (hit.agent) { this.openCard(hit.agent); return; }
      this.closeCard();
      if (hit.room || hit.parking) {
        const act = this.zoneAction(hit);
        if (act) this.openModule(act.module, act.opts || {});
        return;
      }
      if (hit.veh && window.game && typeof window.game.openVehicleDetailsModal === 'function') {
        window.game.openVehicleDetailsModal(hit.veh.id);
        return;
      }
      if (hit.stack) { this.openModule('logistique', { tab: 'stock' }); return; }
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
      bar.style.cssText = this.slot === 'base'
        ? 'position:absolute;right:12px;top:var(--pbv-top,72px);z-index:25;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;pointer-events:auto;max-width:calc(100% - 24px);'
        : 'position:absolute;left:10px;top:46px;z-index:25;display:flex;gap:6px;flex-wrap:wrap;pointer-events:auto;';
      injectBaseStyles();
      const narrow = parent.clientWidth > 0 && parent.clientWidth < 560;
      const btn = (id, label, title) => `<button type="button" data-act="${id}" title="${title}" class="plt-btn">${narrow ? label.split(' ')[0] : label}</button>`;
      bar.innerHTML = [
        `<span class="plt-live" style="height:30px;display:inline-flex;align-items:center;gap:6px;padding:0 10px;border-radius:10px;background:#dc2626;color:#fff;font:800 11px 'Plus Jakarta Sans',system-ui,sans-serif;box-shadow:0 2px 6px rgba(220,38,38,.35);"><span style="width:7px;height:7px;border-radius:50%;background:#fff;animation:pulse 1.2s infinite"></span>LIVE</span>`,
        btn('walls', this.wallsUp ? '🧱 Murs 2,50 m' : '🧱 Murs coupés 30 cm', 'Basculer : murs à hauteur réelle (2,50 m) / cloisons coupées à 30 cm'),
        btn('rotate', '🔄 Pivoter', 'Faire pivoter la vue d’un quart de tour'),
        btn('labels', '🏷️ Étiquettes', 'Afficher les noms des pièces et véhicules'),
        this.slot === 'base' ? `<button type="button" data-act="edit" title="Aménager les locaux : placer, déplacer, pivoter le mobilier" class="plt-btn plt-primary">✏️ Aménager</button>` : ''
      ].join('');
      bar.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-act]');
        if (!b) return;
        const act = b.dataset.act;
        if (act === 'walls') { this.wallsUp = !this.wallsUp; this.savePref('wallsUp', this.wallsUp); b.textContent = this.wallsUp ? '🧱 Murs 2,50 m' : '🧱 Murs coupés 30 cm'; }
        if (act === 'rotate') { this.rotate(); }
        if (act === 'labels') { this.showLabels = !this.showLabels; this.savePref('labels', this.showLabels); }
        if (act === 'edit') { this.editToggle(); }
      });
      parent.appendChild(bar);
      this.toolbar = bar;
    }

    updateToolbarState() {
      if (!this.toolbar) return;
      const b = this.toolbar.querySelector('[data-act="edit"]');
      const on = !!(this.edit && this.edit.active);
      if (b) { b.textContent = on ? '✅ Terminer l’aménagement' : '✏️ Aménager'; b.classList.toggle('plt-on', on); }
      ['walls', 'rotate', 'labels'].forEach(k => { const x = this.toolbar.querySelector(`[data-act="${k}"]`); if (x) x.style.display = ''; });
      const live = this.toolbar.querySelector('.plt-live');
      if (live) live.style.display = on ? 'none' : '';
    }

    openCard(a) {
      this.selected = a;
      const parent = this.canvas.parentElement;
      if (!parent) return;
      let card = parent.querySelector('.protec-live-card');
      if (!card) {
        card = document.createElement('div');
        card.className = 'protec-live-card';
        card.style.cssText = this.slot === 'base'
          ? 'position:absolute;right:12px;bottom:var(--pbv-bottom,118px);z-index:26;width:260px;max-width:calc(100% - 24px);'
          : 'position:absolute;left:10px;bottom:72px;z-index:26;width:250px;max-width:calc(100% - 20px);';
        card.classList.add('glass-panel-heavy');
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
          <button data-act="close" class="plc-close">✕</button>
        </div>
        <div class="plc-muted" style="font-size:11px;margin-top:2px;">${esc(a.rank || '')}${v.role ? ' · ' + esc(v.role) : ''}</div>
        <div style="margin-top:8px;display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;background:${meta.color}1a;color:${meta.color};font-weight:800;font-size:11px;">${meta.icon} ${meta.label}</div>
        ${asg.label ? `<div style="margin-top:6px;font-size:11px;">${esc(asg.label)}</div>` : ''}
        ${typeof v.energy === 'number' ? `<div class="plc-muted" style="margin-top:8px;font-size:10px;">Énergie ${Math.round(v.energy)}% · Moral ${Math.round(v.humeur ?? v.motivation ?? 0)}%</div>` : ''}
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
      this.paused = false;
    }

    destroy(keepAgents) {
      this.running = false;
      (this._handlers || []).forEach(([t, type, fn, o]) => t.removeEventListener(type, fn, o));
      this._handlers = [];
      if (this.toolbar) this.toolbar.remove();
      const ep = this.canvas.parentElement && this.canvas.parentElement.querySelector('.pbe-panel');
      if (ep) ep.remove();
      this.closeCard();
      if (!keepAgents) this.agents.forEach(a => a.releasePOI());
      if (window.ProtecBaseLive) {
        const P = window.ProtecBaseLive;
        Object.keys(P.slots).forEach(k => { if (P.slots[k] === this) P.slots[k] = null; });
        if (P.scene === this) P.scene = P.slots.base || P.slots.locaux || null;
      }
    }
  }

  // =========================================================================
  // 8. VUE PLEIN ÉCRAN « MA BASE » (page antenne : scène + infos + menus)
  // =========================================================================

  // =========================================================================
  // 7 bis. AMÉNAGEMENT DIRECTEMENT DANS LA SCÈNE (mode édition de « Ma base »)
  // Règles : pas dans un mur, pas devant une porte / une fenêtre / une place de
  // véhicule, pas de chevauchement (sauf chaise sous table, écran au-dessus d'un
  // meuble bas), meubles muraux plaqués au mur, passages et accès conservés.
  // =========================================================================

  const EDIT_WALL_TYPES = new Set(['tableau_blanc', 'tv_foyer', 'ecran_tactique_interactif', 'dae_mural', 'etagere_lots', 'casiers_vestiaire', 'casiers_tenues_xl', 'armoire_pharmacie', 'armoire_forte_securisee', 'rack_palettes_lourd', 'kitchenette_foyer', 'distributeur_snacks', 'machine_cafe']);
  const EDIT_TABLE_TYPES = new Set(['bureau', 'table_formation', 'table_repas_equipe']);
  const EDIT_CHAIR_TYPES = new Set(['chaise']);
  const EDIT_CATS = [['all', 'Tout'], ['bureau', '💼 Bureau'], ['formation', '🎓 Formation'], ['secours', '🩹 Secours'], ['stockage', '📦 Stockage'], ['detente', '☕ Détente']];
  const rectsOverlap = (a, b, eps = 0.005) => a.x < b.x + b.w - eps && a.x + a.w > b.x + eps && a.y < b.y + b.d - eps && a.y + a.d > b.y + eps;
  const furnTop = (type) => (FURN_STYLE[type] || { h: 0.8 }).h;
  const furnBottom = (type) => (FURN_STYLE[type] || {}).z0 || 0;
  const r2 = (v) => Math.round(v * 100) / 100;
  const snap5 = (v) => Math.round(v * 20) / 20;

  const SceneEditor = {
    editState() {
      if (!this.edit) this.edit = { active: false, placing: null, drag: null, pending: null, sel: null, ghost: null, cat: 'all', wallPick: 0 };
      return this.edit;
    },

    editToggle(force) {
      const E = this.editState();
      const on = typeof force === 'boolean' ? force : !E.active;
      E.active = on;
      E.placing = null; E.drag = null; E.pending = null; E.ghost = null; E.sel = null;
      this.closeCard();
      this._editBase = null;
      this.editRenderPanel();
      this.updateToolbarState();
      if (on && window.game && typeof window.game.showToast === 'function') {
        window.game.showToast('Mode aménagement', 'Choisissez un meuble à droite, ou faites glisser un meuble existant. R : pivoter · Suppr : revendre · Échap : terminer.', 'purple');
      }
    },

    // Intérieur utile d'une pièce (nu intérieur des murs)
    editInterior(room) {
      const W = this.world;
      const inset = (px, py) => W.rooms.some(r => r !== room && px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h) ? 0.07 : 0.13;
      const mx = room.x + room.w / 2, my = room.y + room.h / 2;
      return {
        x0: room.x + inset(room.x - 0.2, my), y0: room.y + inset(mx, room.y - 0.2),
        x1: room.x + room.w - inset(room.x + room.w + 0.2, my), y1: room.y + room.h - inset(mx, room.y + room.h + 0.2)
      };
    },

    editNearestTable(wx, wy, ignoreId) {
      let best = null, bd = 0.9;
      this.world.furniture.forEach(f => {
        if (!EDIT_TABLE_TYPES.has(f.type) || f.id === ignoreId) return;
        const dx = Math.max(f.x - wx, 0, wx - (f.x + f.w)), dy = Math.max(f.y - wy, 0, wy - (f.y + f.d));
        const dd = Math.hypot(dx, dy);
        if (dd < bd) { bd = dd; best = f; }
      });
      return best;
    },

    // Position proposée (aimantation mur / table / grille 5 cm) + validité
    editComputeGhost(wx, wy) {
      const E = this.edit;
      const src = E.placing || E.drag;
      if (!src || !this.world) return null;
      const W = this.world;
      let w = src.w, d = src.d;
      const type = src.type;
      const g = { type, label: src.label, w, d, x: snap5(wx - w / 2), y: snap5(wy - d / 2), snap: null };
      const room = W.roomAt(wx, wy);
      if (room) {
        const I = this.editInterior(room);
        if (EDIT_WALL_TYPES.has(type)) {
          const L = Math.max(w, d), D = Math.min(w, d);
          const dist = { N: wy - I.y0, S: I.y1 - wy, W: wx - I.x0, E: I.x1 - wx };
          const order = Object.keys(dist).sort((a, b) => dist[a] - dist[b]);
          const s = order[(E.wallPick || 0) % 4];
          if (s === 'N' || s === 'S') { g.w = L; g.d = D; g.x = clamp(snap5(wx - L / 2), I.x0, I.x1 - L); g.y = s === 'N' ? I.y0 : I.y1 - D; }
          else { g.w = D; g.d = L; g.y = clamp(snap5(wy - L / 2), I.y0, I.y1 - L); g.x = s === 'W' ? I.x0 : I.x1 - D; }
          g.snap = 'wall';
        } else if (EDIT_CHAIR_TYPES.has(type)) {
          const t = this.editNearestTable(wx, wy, src.id);
          if (t) {
            const cx = t.x + t.w / 2, cy = t.y + t.d / 2;
            const u = (wx - cx) / (t.w / 2), v = (wy - cy) / (t.d / 2);
            const horizEdge = Math.abs(v) >= Math.abs(u);
            const len = horizEdge ? t.w : t.d;
            const n = t.type === 'bureau' ? 1 : Math.max(1, Math.floor((len + 0.05) / 0.62)); // bureau : chaise centrée
            const start = horizEdge ? t.x : t.y;
            const cur = horizEdge ? wx : wy;
            let k = Math.round((cur - start) / len * n - 0.5);
            k = clamp(k, 0, n - 1);
            const along = start + (k + 0.5) * len / n;
            const cw = Math.min(w, d), ch = Math.min(w, d);
            g.w = cw; g.d = ch;
            if (horizEdge) { g.x = along - cw / 2; g.y = v < 0 ? t.y - 0.1 - ch / 2 : t.y + t.d + 0.1 - ch / 2; }
            else { g.y = along - ch / 2; g.x = u < 0 ? t.x - 0.1 - cw / 2 : t.x + t.w + 0.1 - cw / 2; }
            g.x = r2(g.x); g.y = r2(g.y);
            g.snap = 'table';
          }
        }
      }
      const v = this.editValidate(g, src.id);
      g.valid = v.ok; g.reason = v.reason || '';
      return g;
    },

    editValidate(g, ignoreId) {
      const W = this.world;
      const R = { x: g.x, y: g.y, w: g.w, d: g.d };
      const room = W.roomAt(g.x + g.w / 2, g.y + g.d / 2);
      if (!room) return { ok: false, reason: 'Hors du bâtiment' };
      const I = this.editInterior(room);
      if (R.x < I.x0 - 0.01 || R.y < I.y0 - 0.01 || R.x + R.w > I.x1 + 0.01 || R.y + R.d > I.y1 + 0.01) return { ok: false, reason: 'Dans un mur ou à cheval sur deux pièces' };
      const elevated = furnBottom(g.type) >= 0.75;
      // Débattement et passage des portes
      for (const dr of W.doors) {
        if (!PASSABLE_DOOR(dr)) continue;
        const shutter = dr.type === 'garage_shutter';
        const z = doorRect(dr, elevated ? 0.15 : (shutter ? 1.4 : 0.95));
        const zr = z.vertical ? { x: z.x0, y: z.y0 - 0.1, w: z.x1 - z.x0, d: z.y1 - z.y0 + 0.2 } : { x: z.x0 - 0.1, y: z.y0, w: z.x1 - z.x0 + 0.2, d: z.y1 - z.y0 };
        if (rectsOverlap(R, zr)) return { ok: false, reason: shutter ? 'Devant une porte de garage' : 'Devant une porte (passage de 90 cm)' };
      }
      // Places de stationnement intérieures
      const spots = ((W.parking && W.parking.spots) || []).filter(sp => sp.indoor);
      for (const sp of spots) if (rectsOverlap(R, { x: sp.x - 0.2, y: sp.y - 0.2, w: sp.w + 0.4, d: sp.d + 0.4 })) return { ok: false, reason: 'Sur un emplacement de véhicule' };
      for (const v of W.vehicles) if (v.present && rectsOverlap(R, { x: v.box.x0 - 0.3, y: v.box.y0 - 0.3, w: v.box.x1 - v.box.x0 + 0.6, d: v.box.y1 - v.box.y0 + 0.6 })) return { ok: false, reason: 'Sur un emplacement de véhicule' };
      // Meubles hauts devant une fenêtre
      if (!elevated && furnTop(g.type) > SILL_H + 0.05) {
        for (const wi of W.windows) {
          const z = doorRect(wi, 0.3);
          if (rectsOverlap(R, { x: z.x0, y: z.y0, w: z.x1 - z.x0, d: z.y1 - z.y0 })) return { ok: false, reason: 'Meuble trop haut devant une fenêtre' };
        }
      }
      // Autres meubles
      for (const f of W.furniture) {
        if (f.id === ignoreId || !rectsOverlap(R, f)) continue;
        const a = g.type, b = f.type;
        if ((EDIT_CHAIR_TYPES.has(a) && EDIT_TABLE_TYPES.has(b)) || (EDIT_CHAIR_TYPES.has(b) && EDIT_TABLE_TYPES.has(a))) continue;
        const a0 = furnBottom(a), a1 = furnTop(a), b0 = furnBottom(b), b1 = furnTop(b);
        if (!(a0 < b1 - 0.02 && b0 < a1 - 0.02)) continue; // superposés en hauteur (écran mural au-dessus d'un meuble bas)
        return { ok: false, reason: `Chevauche « ${String(f.label || b).split('(')[0].trim()} »` };
      }
      return this.editPathCheck(g, ignoreId);
    },

    // Accessibilité : depuis l'entrée, toutes les portes et tous les meubles restent atteignables
    editReach(nav) {
      const W = this.world;
      const seen = new Uint8Array(nav.cols * nav.rows);
      const sp = nav.nearestWalkable(W.spawnPoint[0], W.spawnPoint[1], 3);
      if (!sp) return seen;
      const [c0, r0] = nav.toCell(sp[0], sp[1]);
      const q = [c0, r0];
      seen[nav.idx(c0, r0)] = 1;
      for (let i = 0; i < q.length; i += 2) {
        const c = q[i], r = q[i + 1];
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nc = c + dc, nr = r + dr;
          if (!nav.isWalkableCell(nc, nr)) continue;
          const id = nav.idx(nc, nr);
          if (seen[id]) continue;
          seen[id] = 1;
          q.push(nc, nr);
        }
      }
      return seen;
    },

    editReachableFn(nav, seen) {
      return (x, y) => {
        const p = nav.nearestWalkable(x, y, 0.3);
        if (!p) return false;
        const [c, r] = nav.toCell(p[0], p[1]);
        return !!seen[nav.idx(c, r)];
      };
    },

    editDoorSides() {
      const pts = [];
      this.world.doors.forEach((d, i) => {
        if (!PASSABLE_DOOR(d)) return;
        const r = doorRect(d, 0);
        const cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2;
        if (r.vertical) { pts.push({ i, x: cx - 0.5, y: cy }, { i, x: cx + 0.5, y: cy }); }
        else { pts.push({ i, x: cx, y: cy - 0.5 }, { i, x: cx, y: cy + 0.5 }); }
      });
      return pts;
    },

    editAccessible(f, reach) {
      const o = 0.38;
      const cx = f.x + f.w / 2, cy = f.y + f.d / 2;
      const pts = [[cx, f.y - o], [cx, f.y + f.d + o], [f.x - o, cy], [f.x + f.w + o, cy],
        [f.x + f.w * 0.2, f.y - o], [f.x + f.w * 0.8, f.y - o], [f.x + f.w * 0.2, f.y + f.d + o], [f.x + f.w * 0.8, f.y + f.d + o],
        [f.x - o, f.y + f.d * 0.2], [f.x - o, f.y + f.d * 0.8], [f.x + f.w + o, f.y + f.d * 0.2], [f.x + f.w + o, f.y + f.d * 0.8]];
      return pts.some(([x, y]) => reach(x, y));
    },

    editBaseline() {
      if (this._editBase && this._editBase.sig === this.worldSig) return this._editBase;
      const W = this.world;
      const seen = this.editReach(W.nav);
      const reach = this.editReachableFn(W.nav, seen);
      const doorPts = this.editDoorSides().filter(p => reach(p.x, p.y));
      const furnOk = new Set(W.furniture.filter(f => !EDIT_CHAIR_TYPES.has(f.type) && furnBottom(f.type) < 1.0 && this.editAccessible(f, reach)).map(f => f.id));
      this._editBase = { sig: this.worldSig, doorPts, furnOk };
      return this._editBase;
    },

    editPathCheck(g, ignoreId) {
      const key = [g.type, g.x, g.y, g.w, g.d, ignoreId, this.worldSig.length].join('|');
      if (this._editPathKey === key) return this._editPathRes;
      const W = this.world;
      const base = this.editBaseline();
      const list = W.furniture.filter(f => f.id !== ignoreId).concat([{ id: '__ghost', type: g.type, x: g.x, y: g.y, w: g.w, d: g.d }]);
      const nav = buildNavGrid(W.bounds, W.walls, W.doors, list, W.vehicles);
      const seen = this.editReach(nav);
      const reach = this.editReachableFn(nav, seen);
      let res = { ok: true };
      if (base.doorPts.some(p => !reach(p.x, p.y))) res = { ok: false, reason: 'Bloque le passage vers une porte' };
      if (res.ok) {
        for (const f of W.furniture) {
          if (f.id === ignoreId || !base.furnOk.has(f.id)) continue;
          if (!this.editAccessible(f, reach)) { res = { ok: false, reason: `Bloque l’accès à « ${String(f.label || f.type).split('(')[0].trim()} »` }; break; }
        }
      }
      if (res.ok && !EDIT_CHAIR_TYPES.has(g.type) && furnBottom(g.type) < 1.0 && !this.editAccessible(g, reach)) res = { ok: false, reason: 'Aucun accès libre devant ce meuble' };
      this._editPathKey = key; this._editPathRes = res;
      return res;
    },

    // Conversion scène (vue pivotée) -> plan enregistré
    editToRaw(g) {
      const r = this.currentRot || 0;
      const inv = (4 - r) % 4;
      const c = this._lastModel && this._lastModel._center;
      if (!inv || !c) return { x: g.x, y: g.y, w: g.w, d: g.d };
      const q = rotRect(g.x, g.y, g.w, g.d, inv, c);
      return { x: q.x, y: q.y, w: q.w, d: q.h };
    },

    editRawModel() {
      try { return this.locaux.getArchitectModel(this.locaux.currentStationId); } catch (e) { return null; }
    },

    editSave() {
      const game = window.game;
      if (typeof this.locaux.saveCurrentArchitecture === 'function') this.locaux.saveCurrentArchitecture(game);
      this._editPathKey = null;
    },

    editCatalog() {
      return (this.locaux && this.locaux.FURNITURE_CATALOG) || [];
    },

    editStartPlacing(type) {
      const E = this.editState();
      const cat = this.editCatalog().find(c => c.type === type);
      if (!cat) return;
      const game = window.game;
      const money = game && game.resources ? game.resources.money : Infinity;
      if (money < cat.cost) {
        if (game && game.showToast) game.showToast('Trésorerie insuffisante', `« ${cat.name} » coûte ${cat.cost} €.`, 'orange');
        return;
      }
      E.sel = null; E.drag = null;
      E.placing = { type, w: cat.w, d: cat.d, label: cat.name, cost: cat.cost, cat };
      E.wallPick = 0;
      E.ghost = null;
      this.editRenderPanel();
    },

    editPlace(g) {
      const E = this.edit;
      const p = E.placing;
      if (!p || !g) return;
      if (!g.valid) { this.editToast(g.reason); return; }
      const game = window.game;
      const cat = p.cat;
      if (game && game.resources) {
        if (game.resources.money < cat.cost) { this.editToast('Trésorerie insuffisante'); return; }
        game.resources.money -= cat.cost;
        if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
        if (game.showToast) game.showToast(`Mobilier installé (-${cat.cost} €)`, `« ${cat.name} » est en place.`, 'blue');
      }
      const raw = this.editRawModel();
      if (!raw) return;
      const q = this.editToRaw(g);
      const room = (raw.rooms || []).find(rm => q.x + q.w / 2 >= rm.x && q.x + q.w / 2 <= rm.x + rm.w && q.y + q.d / 2 >= rm.y && q.y + q.d / 2 <= rm.y + rm.h);
      const swapped = Math.abs(q.w - cat.w) > 0.01 && Math.abs(cat.w - cat.d) > 0.01;
      const item = {
        id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        roomId: room ? room.id : null,
        type: cat.type, x: r2(q.x), y: r2(q.y), w: r2(q.w), d: r2(q.d),
        color: cat.color, label: cat.name, icon: cat.icon, pole: cat.pole || 'pole_libre',
        rotation: swapped ? Math.PI / 2 : 0, storedInventory: {}, maxWeightKg: cat.maxWeightKg || 0
      };
      raw.furniture = raw.furniture || [];
      raw.furniture.push(item);
      this.editSave();
      E.sel = item.id;
      // On garde l'outil actif pour poser le même meuble à la suite (Maj) sinon on revient à la sélection
      if (!E.keepPlacing) E.placing = null;
      E.ghost = null;
      this.editRenderPanel();
    },

    editMoveCommit(g) {
      const E = this.edit;
      const d = E.drag;
      if (!d || !g) return;
      if (!g.valid) { this.editToast(g.reason); return; }
      const raw = this.editRawModel();
      const it = raw && (raw.furniture || []).find(f => f.id === d.id);
      if (!it) return;
      const q = this.editToRaw(g);
      const swapped = Math.abs(q.w - it.w) > 0.01 && Math.abs(it.w - it.d) > 0.01;
      it.x = r2(q.x); it.y = r2(q.y);
      if (swapped) it.rotation = ((it.rotation || 0) + Math.PI / 2) % (Math.PI * 2);
      it.w = r2(q.w); it.d = r2(q.d);
      const room = (raw.rooms || []).find(rm => it.x + it.w / 2 >= rm.x && it.x + it.w / 2 <= rm.x + rm.w && it.y + it.d / 2 >= rm.y && it.y + it.d / 2 <= rm.y + rm.h);
      if (room) it.roomId = room.id;
      this.editSave();
    },

    editSelected() {
      const E = this.edit;
      return E && E.sel && this.world ? this.world.furniture.find(f => f.id === E.sel) : null;
    },

    editRotateSelected() {
      const E = this.edit;
      if (E.placing || E.drag) {
        const src = E.placing || E.drag;
        if (EDIT_WALL_TYPES.has(src.type)) E.wallPick = (E.wallPick || 0) + 1;
        else { const t = src.w; src.w = src.d; src.d = t; }
        if (E.lastWorld) E.ghost = this.editComputeGhost(E.lastWorld[0], E.lastWorld[1]);
        return;
      }
      const f = this.editSelected();
      if (!f) return;
      let g;
      if (EDIT_WALL_TYPES.has(f.type)) {
        // Meuble mural : on le plaque sur le mur suivant le plus proche
        E.drag = { id: f.id, type: f.type, w: f.w, d: f.d, label: f.label };
        E.wallPick = 1;
        g = this.editComputeGhost(f.x + f.w / 2, f.y + f.d / 2);
        E.drag = null; E.wallPick = 0;
      } else {
        const cx = f.x + f.w / 2, cy = f.y + f.d / 2;
        g = { type: f.type, label: f.label, w: f.d, d: f.w, x: snap5(cx - f.d / 2), y: snap5(cy - f.w / 2) };
        const v = this.editValidate(g, f.id);
        g.valid = v.ok; g.reason = v.reason;
      }
      if (!g || !g.valid) { this.editToast(g ? g.reason : 'Rotation impossible ici'); return; }
      E.drag = { id: f.id, type: f.type, w: g.w, d: g.d, label: f.label };
      this.editMoveCommit(g);
      E.drag = null;
    },

    editSellSelected() {
      const f = this.editSelected();
      if (!f) return;
      const L = this.locaux;
      L.selectedFurnitureId = f.id;
      if (typeof L.deleteSelectedItem === 'function') L.deleteSelectedItem();
      this.edit.sel = null;
      this._editPathKey = null;
      this.editRenderPanel();
    },

    editToast(msg) {
      this.edit.flash = { text: msg || 'Placement impossible', until: performance.now() + 1800 };
    },

    editHitFurniture(sx, sy) {
      if (!this.world) return null;
      const iso = this.iso;
      for (let i = this.world.furniture.length - 1; i >= 0; i--) {
        const f = this.world.furniture[i];
        const top = furnTop(f.type);
        for (let z = furnBottom(f.type); z <= top + 0.001; z += 0.25) {
          const [px, py] = iso.unproject(sx, sy + z * iso.k * HZ);
          if (px >= f.x - 0.04 && px <= f.x + f.w + 0.04 && py >= f.y - 0.04 && py <= f.y + f.d + 0.04) return f;
        }
      }
      return null;
    },

    // Gestion souris / tactile en mode aménagement. Renvoie true si l'événement est consommé.
    editPointer(phase, sx, sy) {
      const E = this.edit;
      if (!E || !E.active || !this.world) return false;
      const [wx, wy] = this.iso.unproject(sx, sy);
      E.lastWorld = [wx, wy];
      if (phase === 'down') {
        if (E.placing) { E.ghost = this.editComputeGhost(wx, wy); E.downAt = [sx, sy]; return false; }
        const f = this.editHitFurniture(sx, sy);
        if (f) { E.pending = { id: f.id, sx, sy, offX: wx - f.x, offY: wy - f.y }; E.sel = f.id; this.editRenderPanel(); return true; }
        return false;
      }
      if (phase === 'move') {
        if (E.pending && !E.drag) {
          if (Math.abs(sx - E.pending.sx) + Math.abs(sy - E.pending.sy) > 5) {
            const f = this.world.furniture.find(o => o.id === E.pending.id);
            if (f) { E.drag = { id: f.id, type: f.type, w: f.w, d: f.d, label: f.label, offX: E.pending.offX, offY: E.pending.offY }; E.wallPick = 0; }
          } else return true;
        }
        if (E.drag) {
          E.ghost = this.editComputeGhost(wx - E.drag.offX + E.drag.w / 2, wy - E.drag.offY + E.drag.d / 2);
          return true;
        }
        if (E.placing) { E.ghost = this.editComputeGhost(wx, wy); return false; }
        return false;
      }
      if (phase === 'up') {
        if (E.drag) {
          const g = E.ghost || this.editComputeGhost(wx - E.drag.offX + E.drag.w / 2, wy - E.drag.offY + E.drag.d / 2);
          this.editMoveCommit(g);
          E.drag = null; E.pending = null; E.ghost = null;
          this.editRenderPanel();
          return true;
        }
        if (E.pending) { E.pending = null; return true; }
        if (E.placing && E.downAt) {
          E.downAt = null;
          const g = this.editComputeGhost(wx, wy);
          this.editPlace(g);
          return true;
        }
        return false;
      }
      return false;
    },

    editKey(e) {
      const E = this.edit;
      if (!E || !E.active) return false;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return false;
      const k = e.key;
      if (k === 'r' || k === 'R') { this.editRotateSelected(); return true; }
      if (k === 'Delete' || k === 'Backspace') { if (E.sel && !E.drag) { this.editSellSelected(); return true; } return false; }
      if (k === 'Escape') {
        if (E.placing || E.drag) { E.placing = null; E.drag = null; E.pending = null; E.ghost = null; this.editRenderPanel(); return true; }
        if (E.sel) { E.sel = null; this.editRenderPanel(); return true; }
        this.editToggle(false);
        return true;
      }
      return false;
    },

    // ---------- Rendu des aides d'aménagement ----------

    drawEditFloor(ctx) {
      const E = this.edit;
      const iso = this.iso;
      const W = this.world;
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      // Grille 50 cm dans chaque pièce
      ctx.strokeStyle = this.isNight ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.10)';
      ctx.lineWidth = 1 * dpr;
      W.rooms.forEach(r => {
        const I = this.editInterior(r);
        ctx.beginPath();
        for (let x = Math.ceil(I.x0 * 2) / 2; x <= I.x1; x += 0.5) { const [ax, ay] = iso.p(x, I.y0, 0), [bx, by] = iso.p(x, I.y1, 0); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); }
        for (let y = Math.ceil(I.y0 * 2) / 2; y <= I.y1; y += 0.5) { const [ax, ay] = iso.p(I.x0, y, 0), [bx, by] = iso.p(I.x1, y, 0); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); }
        ctx.stroke();
      });
      // Zones interdites (passages de portes, places de véhicules) pendant un placement
      if (E.placing || E.drag) {
        ctx.fillStyle = 'rgba(239,68,68,0.16)';
        ctx.strokeStyle = 'rgba(239,68,68,0.45)';
        ctx.setLineDash([4 * dpr, 3 * dpr]);
        W.doors.forEach(dr => {
          if (!PASSABLE_DOOR(dr)) return;
          const z = doorRect(dr, dr.type === 'garage_shutter' ? 1.4 : 0.95);
          poly(ctx, [iso.p(z.x0, z.y0), iso.p(z.x1, z.y0), iso.p(z.x1, z.y1), iso.p(z.x0, z.y1)], 'rgba(239,68,68,0.16)', 'rgba(239,68,68,0.45)', 1 * dpr);
        });
        ((W.parking && W.parking.spots) || []).filter(sp => sp.indoor).forEach(sp => {
          poly(ctx, [iso.p(sp.x, sp.y), iso.p(sp.x + sp.w, sp.y), iso.p(sp.x + sp.w, sp.y + sp.d), iso.p(sp.x, sp.y + sp.d)], 'rgba(239,68,68,0.10)', 'rgba(239,68,68,0.35)', 1 * dpr);
        });
        ctx.setLineDash([]);
      }
      ctx.restore();
    },

    drawEditOverlay(ctx) {
      const E = this.edit;
      const iso = this.iso;
      const dpr = window.devicePixelRatio || 1;
      // Sélection
      const sel = this.editSelected();
      if (sel && !E.drag) {
        const h = furnTop(sel.type);
        ctx.save();
        ctx.setLineDash([5 * dpr, 4 * dpr]);
        poly(ctx, [iso.p(sel.x, sel.y), iso.p(sel.x + sel.w, sel.y), iso.p(sel.x + sel.w, sel.y + sel.d), iso.p(sel.x, sel.y + sel.d)], 'rgba(255,102,0,0.16)', '#ff6600', 2 * dpr);
        ctx.restore();
        const [lx, ly] = iso.p(sel.x + sel.w / 2, sel.y + sel.d / 2, h + 0.35);
        this.chip(ctx, lx, ly, `${sel.icon || '🛋️'} ${String(sel.label || sel.type).split('(')[0].trim()}`, '#ff6600', '#ffffff');
      }
      // Fantôme du meuble en cours de placement / déplacement
      const g = E.ghost;
      if (g && (E.placing || E.drag)) {
        const ok = g.valid;
        const col = ok ? '#16a34a' : '#dc2626';
        const h = Math.max(0.25, Math.min(2.2, furnTop(g.type)));
        const z0 = furnBottom(g.type);
        ctx.save();
        poly(ctx, [iso.p(g.x, g.y), iso.p(g.x + g.w, g.y), iso.p(g.x + g.w, g.y + g.d), iso.p(g.x, g.y + g.d)], ok ? 'rgba(22,163,74,0.30)' : 'rgba(220,38,38,0.30)', col, 2 * dpr);
        ctx.globalAlpha = 0.55;
        drawBox(ctx, iso, g.x, g.y, g.x + g.w, g.y + g.d, z0, Math.max(z0 + 0.05, h), ok ? '#4ade80' : '#f87171', { top: ok ? '#bbf7d0' : '#fecaca', edge: col });
        ctx.restore();
        const [lx, ly] = iso.p(g.x + g.w / 2, g.y + g.d / 2, h + 0.4);
        if (!ok) this.chip(ctx, lx, ly, `⛔ ${g.reason}`, '#dc2626', '#ffffff');
        else if (g.snap === 'wall') this.chip(ctx, lx, ly, '🧲 Contre le mur', '#16a34a', '#ffffff');
        else if (g.snap === 'table') this.chip(ctx, lx, ly, '🪑 Calée à la table', '#16a34a', '#ffffff');
      }
      if (E.flash && performance.now() < E.flash.until) {
        this.chip(ctx, this.canvas.width / 2, this.canvas.height * 0.22, `⛔ ${E.flash.text}`, '#dc2626', '#ffffff');
      }
    },

    // ---------- Panneau HTML d'aménagement ----------

    editRenderPanel() {
      const parent = this.canvas.parentElement;
      if (!parent) return;
      let panel = parent.querySelector('.pbe-panel');
      const E = this.editState();
      if (!E.active) { if (panel) panel.remove(); return; }
      if (!panel) {
        panel = document.createElement('div');
        panel.className = 'pbe-panel glass-panel-heavy';
        parent.appendChild(panel);
        panel.addEventListener('click', (e) => {
          const b = e.target.closest('[data-ed]');
          if (!b) return;
          const a = b.dataset.ed;
          if (a === 'done') return this.editToggle(false);
          if (a === 'cat') { E.cat = b.dataset.cat; return this.editRenderPanel(); }
          if (a === 'pick') return this.editStartPlacing(b.dataset.type);
          if (a === 'cancel') { E.placing = null; E.ghost = null; return this.editRenderPanel(); }
          if (a === 'rotate') return this.editRotateSelected();
          if (a === 'sell') return this.editSellSelected();
          if (a === 'manage') { const f = this.editSelected(); if (f && typeof this.locaux.openFurnitureInteractionModal === 'function') { this.locaux.selectedFurnitureId = f.id; this.locaux.openFurnitureInteractionModal(f.id); } return; }
          if (a === 'unsel') { E.sel = null; return this.editRenderPanel(); }
          if (a === 'keep') { E.keepPlacing = !E.keepPlacing; return this.editRenderPanel(); }
        });
        ['mousedown', 'wheel', 'touchstart'].forEach(t => panel.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
      }
      const esc = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
      const game = window.game;
      const money = game && game.resources && typeof game.resources.money === 'number' ? game.resources.money : null;
      const cat = this.editCatalog().filter(c => E.cat === 'all' || c.cat === E.cat);
      const sel = this.editSelected();
      const keepScroll = panel.querySelector('.pbe-list');
      const st = keepScroll ? keepScroll.scrollTop : 0;
      let selHtml = '';
      if (E.placing) {
        selHtml = `<div class="pbe-sel pbe-sel-place"><div class="pbe-sel-title">${esc(E.placing.cat.icon)} ${esc(E.placing.label)}</div>
          <div class="pbe-hint">Survolez la scène : vert = position valide, rouge = impossible. Cliquez pour poser. <b>R</b> pivote${EDIT_WALL_TYPES.has(E.placing.type) ? ' (change de mur)' : ''}.</div>
          <div class="pbe-row"><button type="button" data-ed="keep" class="pbe-btn ${E.keepPlacing ? 'pbe-on' : ''}">${E.keepPlacing ? '✓ ' : ''}Poser en série</button><button type="button" data-ed="cancel" class="pbe-btn">Annuler</button></div></div>`;
      } else if (sel) {
        const c = this.editCatalog().find(x => x.type === sel.type);
        selHtml = `<div class="pbe-sel"><div class="pbe-sel-title">${esc(sel.icon || (c && c.icon) || '🛋️')} ${esc(String(sel.label || sel.type).split('(')[0].trim())}</div>
          <div class="pbe-hint">Faites glisser le meuble pour le déplacer (gratuit).</div>
          <div class="pbe-row"><button type="button" data-ed="rotate" class="pbe-btn">🔄 Pivoter</button><button type="button" data-ed="manage" class="pbe-btn">⚙️ Gérer</button><button type="button" data-ed="sell" class="pbe-btn pbe-danger">🗑️ Revendre${c ? ` (+${Math.round(c.cost * 0.5)} €)` : ''}</button><button type="button" data-ed="unsel" class="pbe-btn" title="Désélectionner">✕</button></div></div>`;
      }
      panel.innerHTML = `
        <div class="pbe-head"><div><div class="pbe-title">✏️ Aménagement</div><div class="pbe-sub">${money !== null ? `Trésorerie : <b>${Math.round(money).toLocaleString('fr-FR')} €</b>` : ''}</div></div><button type="button" data-ed="done" class="pbe-btn pbe-primary">Terminer</button></div>
        ${selHtml}
        <div class="pbe-cats">${EDIT_CATS.map(([id, label]) => `<button type="button" data-ed="cat" data-cat="${id}" class="pbe-cat ${E.cat === id ? 'pbe-on' : ''}">${label}</button>`).join('')}</div>
        <div class="pbe-list">${cat.map(c => {
          const afford = money === null || money >= c.cost;
          const active = E.placing && E.placing.type === c.type;
          return `<button type="button" data-ed="pick" data-type="${esc(c.type)}" class="pbe-item ${active ? 'pbe-on' : ''} ${afford ? '' : 'pbe-off'}" title="${esc(c.bonus || c.name)}"><span class="pbe-ico">${esc(c.icon)}</span><span class="pbe-name">${esc(c.name)}<small>${c.w} × ${c.d} m${EDIT_WALL_TYPES.has(c.type) ? ' · mural' : ''}</small></span><span class="pbe-price">${c.cost} €</span></button>`;
        }).join('')}</div>
        <div class="pbe-foot">R : pivoter · Suppr : revendre · Échap : annuler / terminer</div>`;
      const list = panel.querySelector('.pbe-list');
      if (list) list.scrollTop = st;
    }
  };
  Object.assign(LiveScene.prototype, SceneEditor);

  // Styles de la vue « Ma base » et de l'overlay de la scène, alignés sur la charte du jeu (thème clair / sombre via html.dark).
  // Les conteneurs flottants portent aussi les classes glass-panel / glass-panel-heavy du jeu (styles.css) pour un rendu identique à la carte.
  function injectBaseStyles() {
    if (document.getElementById('protec-base-style')) return;
    const css = document.createElement('style');
    css.id = 'protec-base-style';
    css.textContent = `
#protec-base-view,.protec-live-toolbar,.protec-live-card{--pbv-bg:#e8eef5;--pbv-panel:rgba(255,255,255,.94);--pbv-border:#cbd5e1;--pbv-soft:#e2e8f0;--pbv-card:#ffffff;--pbv-chip:#f1f5f9;--pbv-text:#0f172a;--pbv-muted:#64748b;--pbv-title:#002E6D;--pbv-hover:#eff6ff;--pbv-link:#0284c7;--pbv-shadow:0 8px 32px rgba(0,46,109,.10),0 1px 3px rgba(15,23,42,.05);}
html.dark #protec-base-view,html.dark .protec-live-toolbar,html.dark .protec-live-card{--pbv-bg:#0b1120;--pbv-panel:rgba(15,23,42,.94);--pbv-border:#334155;--pbv-soft:#1e293b;--pbv-card:#1e293b;--pbv-chip:#1e293b;--pbv-text:#f8fafc;--pbv-muted:#94a3b8;--pbv-title:#7dd3fc;--pbv-hover:rgba(56,189,248,.14);--pbv-link:#38bdf8;--pbv-shadow:0 8px 32px rgba(0,0,0,.5);}
#protec-base-view{--pbv-top:72px;--pbv-bottom:116px;position:fixed;inset:0;z-index:19;background:var(--pbv-bg);color:var(--pbv-text);font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
#protec-base-view *{box-sizing:border-box;font-family:inherit;}
body.protec-base-open header > div:nth-child(2){display:none!important;}
#protec-base-view .pbv-stage{position:absolute;inset:0;}
#protec-base-view .pbv-glass{background:var(--pbv-panel);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1.5px solid var(--pbv-border);box-shadow:var(--pbv-shadow);color:var(--pbv-text);}
#protec-base-view .pbv-top{position:absolute;left:12px;top:var(--pbv-top);z-index:26;display:flex;align-items:center;gap:6px;height:48px;padding:0 6px;border-radius:16px;max-width:calc(100% - 24px);}
#protec-base-view .pbv-titles{display:flex;flex-direction:column;min-width:0;padding:0 6px;}
#protec-base-view .pbv-title{font-weight:900;font-size:14px;color:var(--pbv-title);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px;}
#protec-base-view .pbv-subtitle{font-size:10.5px;color:var(--pbv-muted);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px;}
#protec-base-view .pbv-iconbtn{height:36px;min-width:36px;padding:0 10px;border-radius:12px;border:1.5px solid var(--pbv-soft);background:var(--pbv-chip);color:var(--pbv-text);font-weight:800;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;}
#protec-base-view .pbv-iconbtn:hover{border-color:var(--pbv-link);color:var(--pbv-link);}
#protec-base-view .pbv-side{position:absolute;left:12px;top:calc(var(--pbv-top) + 58px);bottom:var(--pbv-bottom);z-index:25;width:310px;border-radius:24px;display:flex;flex-direction:column;overflow:hidden;}
#protec-base-view .pbv-tabs{display:flex;gap:4px;padding:8px 8px 6px;border-bottom:1.5px solid var(--pbv-soft);}
#protec-base-view .pbv-tab{flex:1;height:32px;border-radius:12px;border:none;background:transparent;color:var(--pbv-muted);font-weight:800;font-size:11.5px;cursor:pointer;}
#protec-base-view .pbv-tab:hover{background:var(--pbv-hover);color:var(--pbv-link);}
#protec-base-view .pbv-tab.on{background:#002E6D;color:#fff;}
html.dark #protec-base-view .pbv-tab.on{background:#0369a1;}
#protec-base-view .pbv-scroll{flex:1;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:10px;}
#protec-base-view .pbv-card{background:var(--pbv-card);border:1.5px solid var(--pbv-border);border-radius:18px;padding:10px 12px;box-shadow:0 2px 8px rgba(15,23,42,.06);}
#protec-base-view .pbv-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;}
#protec-base-view .pbv-card-title{font-weight:900;font-size:11.5px;color:var(--pbv-title);text-transform:uppercase;letter-spacing:.03em;}
#protec-base-view .pbv-row{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11.5px;padding:5px 0;border-top:1px dashed var(--pbv-soft);}
#protec-base-view .pbv-row:first-of-type{border-top:none;}
#protec-base-view .pbv-row-l{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#protec-base-view .pbv-row-r{flex:0 0 auto;font-weight:800;display:flex;align-items:center;gap:6px;}
#protec-base-view .pbv-click{width:100%;text-align:left;border:none;background:none;padding:0 4px;cursor:pointer;color:inherit;border-radius:10px;display:block;}
#protec-base-view .pbv-click:hover{background:var(--pbv-hover);}
#protec-base-view .pbv-muted{font-size:11.5px;color:var(--pbv-muted);}
#protec-base-view .pbv-dim{color:var(--pbv-muted);font-weight:600;}
#protec-base-view .pbv-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
#protec-base-view .pbv-act{height:30px;padding:0 10px;border-radius:11px;border:1.5px solid var(--pbv-soft);background:var(--pbv-chip);color:var(--pbv-text);font-weight:800;font-size:11px;cursor:pointer;}
#protec-base-view .pbv-act:hover{border-color:var(--pbv-link);color:var(--pbv-link);}
#protec-base-view .pbv-act.pri{background:#FF6600;border-color:#FF6600;color:#fff;}
#protec-base-view .pbv-act.pri:hover{background:#E65C00;color:#fff;}
#protec-base-view .pbv-badge{padding:2px 7px;border-radius:999px;font-size:9.5px;font-weight:900;border:1px solid currentColor;white-space:nowrap;}
#protec-base-view .pbv-mini{border:none;background:none;color:var(--pbv-muted);cursor:pointer;font-size:12px;padding:0 2px;}
#protec-base-view .pbv-mini:hover{color:var(--pbv-link);}
#protec-base-view .pbv-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
#protec-base-view .pbv-kpi{background:var(--pbv-chip);border-radius:14px;padding:7px 6px;text-align:center;}
#protec-base-view .pbv-kpi b{display:block;font-size:16px;font-weight:900;font-family:'JetBrains Mono',ui-monospace,monospace;color:var(--pbv-text);}
#protec-base-view .pbv-kpi span{font-size:9.5px;font-weight:700;color:var(--pbv-muted);text-transform:uppercase;}
.protec-live-toolbar .plt-btn{height:34px;padding:0 12px;border-radius:12px;border:1.5px solid var(--pbv-border);background:var(--pbv-panel);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);color:var(--pbv-text);font:800 11.5px 'Plus Jakarta Sans',system-ui,sans-serif;cursor:pointer;box-shadow:var(--pbv-shadow);white-space:nowrap;}
.protec-live-toolbar .plt-btn:hover{border-color:var(--pbv-link);color:var(--pbv-link);}
.protec-live-toolbar .plt-primary{background:#FF6600;border-color:#FF6600;color:#fff;}
.protec-live-toolbar .plt-primary:hover{background:#E65C00;border-color:#E65C00;color:#fff;}
.protec-live-toolbar .plt-primary.plt-on{background:#16a34a;border-color:#16a34a;}
.protec-live-card{padding:12px;border-radius:20px;background:var(--pbv-card);border:1.5px solid var(--pbv-border);box-shadow:0 10px 30px rgba(15,23,42,.18);font:500 12px 'Plus Jakarta Sans',system-ui,sans-serif;color:var(--pbv-text);}
.protec-live-card .plc-muted{color:var(--pbv-muted);}
.protec-live-card .plc-close{border:none;background:var(--pbv-soft);color:var(--pbv-text);border-radius:8px;width:24px;height:24px;cursor:pointer;}
.pbe-panel{position:absolute;right:12px;top:calc(var(--pbv-top,72px) + 46px);bottom:var(--pbv-bottom,116px);width:330px;max-width:calc(100% - 24px);z-index:27;border-radius:24px;display:flex;flex-direction:column;overflow:hidden;font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--pbv-panel);border:1.5px solid var(--pbv-border);box-shadow:var(--pbv-shadow);color:var(--pbv-text);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);}
.pbe-panel{--pbv-panel:rgba(255,255,255,.96);--pbv-border:#cbd5e1;--pbv-soft:#e2e8f0;--pbv-chip:#f1f5f9;--pbv-text:#0f172a;--pbv-muted:#64748b;--pbv-title:#002E6D;--pbv-hover:#eff6ff;--pbv-link:#0284c7;}
html.dark .pbe-panel{--pbv-panel:rgba(15,23,42,.96);--pbv-border:#334155;--pbv-soft:#1e293b;--pbv-chip:#1e293b;--pbv-text:#f8fafc;--pbv-muted:#94a3b8;--pbv-title:#7dd3fc;--pbv-hover:rgba(56,189,248,.14);--pbv-link:#38bdf8;}
.pbe-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 12px 8px;}
.pbe-title{font-weight:900;font-size:14px;color:var(--pbv-title);}
.pbe-sub{font-size:11px;color:var(--pbv-muted);font-weight:600;}
.pbe-btn{height:30px;padding:0 10px;border-radius:11px;border:1.5px solid var(--pbv-soft);background:var(--pbv-chip);color:var(--pbv-text);font-weight:800;font-size:11px;cursor:pointer;white-space:nowrap;}
.pbe-btn:hover{border-color:var(--pbv-link);color:var(--pbv-link);}
.pbe-primary{background:#16a34a;border-color:#16a34a;color:#fff;}
.pbe-primary:hover{background:#15803d;color:#fff;}
.pbe-danger{color:#dc2626;}
.pbe-on{border-color:#FF6600!important;color:#FF6600!important;background:rgba(255,102,0,.08)!important;}
.pbe-sel{margin:0 12px 8px;padding:10px;border-radius:16px;background:rgba(255,102,0,.08);border:1.5px solid rgba(255,102,0,.35);}
.pbe-sel-title{font-weight:900;font-size:12.5px;margin-bottom:4px;}
.pbe-hint{font-size:11px;color:var(--pbv-muted);line-height:1.35;margin-bottom:8px;}
.pbe-row{display:flex;flex-wrap:wrap;gap:6px;}
.pbe-cats{display:flex;gap:4px;flex-wrap:wrap;padding:0 12px 8px;}
.pbe-cat{height:28px;padding:0 9px;border-radius:999px;border:1.5px solid var(--pbv-soft);background:transparent;color:var(--pbv-muted);font-weight:800;font-size:10.5px;cursor:pointer;}
.pbe-list{flex:1;overflow:auto;padding:0 8px 8px;display:flex;flex-direction:column;gap:4px;}
.pbe-item{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:7px 8px;border-radius:14px;border:1.5px solid transparent;background:transparent;color:var(--pbv-text);cursor:pointer;}
.pbe-item:hover{background:var(--pbv-hover);border-color:var(--pbv-soft);}
.pbe-off{opacity:.45;}
.pbe-ico{width:34px;height:34px;flex:0 0 auto;border-radius:11px;background:var(--pbv-chip);display:flex;align-items:center;justify-content:center;font-size:18px;}
.pbe-name{flex:1;min-width:0;font-size:11.5px;font-weight:800;line-height:1.25;}
.pbe-name small{display:block;font-weight:600;color:var(--pbv-muted);font-size:10px;}
.pbe-price{font-weight:900;font-size:11.5px;color:#059669;white-space:nowrap;}
.pbe-foot{padding:8px 12px;border-top:1.5px solid var(--pbv-soft);font-size:10px;color:var(--pbv-muted);font-weight:600;}
@media (max-width:639px){
#protec-base-view{--pbv-top:56px;--pbv-bottom:84px;}
#protec-base-view .pbv-side{left:8px;right:8px;width:auto;top:calc(var(--pbv-top) + 56px);}
#protec-base-view .pbv-top{left:8px;max-width:calc(100% - 16px);}
#protec-base-view .pbv-title{max-width:150px;}#protec-base-view .pbv-subtitle{max-width:170px;}
.protec-live-toolbar{top:calc(var(--pbv-top,56px) + 54px)!important;right:8px!important;}
.protec-live-toolbar .plt-btn{height:30px;padding:0 9px;font-size:10.5px;}
.pbe-panel{left:8px;right:8px;width:auto;top:auto;height:48vh;bottom:var(--pbv-bottom,84px);}
}
`;
    document.head.appendChild(css);
  }

  const BaseView = {
    el: null,
    stationId: null,
    timer: null,
    tab: 'activite',
    sideOpen: null,

    open(stationId, opts = {}) {
      const game = window.game;
      if (!game) return;
      const L = window.ProtecLocaux;
      if (!L) return;
      const st = (game.stations || []).find(s => s.id === stationId) || (game.stations || [])[0];
      if (!st) return;
      if (opts.tab) this.tab = opts.tab;
      const already = this.isOpen() && this.stationId === st.id;
      this.stationId = st.id;
      L.currentStationId = st.id;
      if (typeof game.closeAllDockSubmenus === 'function') { try { game.closeAllDockSubmenus(); } catch (e) { /* ignoré */ } }
      const drawer = document.getElementById('context-drawer');
      if (drawer && !drawer.classList.contains('hidden') && typeof game.closeDrawer === 'function') { try { game.closeDrawer(); } catch (e) { /* ignoré */ } }
      const modal = document.getElementById('main-modal');
      if (modal && !modal.classList.contains('hidden') && typeof game.closeModal === 'function' && opts.closeModal !== false) { try { game.closeModal(); } catch (e) { /* ignoré */ } }
      if (!this.el) this.build();
      if (this.sideOpen === null) this.sideOpen = window.innerWidth >= 760;
      if (opts.tab) this.sideOpen = true;
      this.applySide();
      this.el.style.display = 'block';
      document.body.classList.add('protec-base-open');
      const canvas = this.el.querySelector('#protec-base-canvas');
      const afterAttach = () => {
        const sc = ProtecBaseLive.slots.base;
        if (sc) {
          sc.viewInsets = () => this.insets();
          if (opts.edit && sc.editToggle) sc.editToggle(true);
        }
        this.refresh(true);
      };
      if (already) afterAttach();
      else requestAnimationFrame(() => { ProtecBaseLive.attach(canvas, L, 'base'); afterAttach(); });
      clearInterval(this.timer);
      this.timer = setInterval(() => this.refresh(), 1000);
    },

    insets() {
      const cs = this.el ? getComputedStyle(this.el) : null;
      const top = cs ? parseFloat(cs.getPropertyValue('--pbv-top')) || 72 : 72;
      const bottom = cs ? parseFloat(cs.getPropertyValue('--pbv-bottom')) || 116 : 116;
      const wide = window.innerWidth >= 640;
      return { l: this.sideOpen && wide ? 330 : 0, t: top + 52, r: 0, b: bottom };
    },

    close() {
      if (!this.el) return;
      const sc = ProtecBaseLive.slots.base;
      if (sc && sc.edit && sc.edit.active) sc.editToggle(false);
      this.el.style.display = 'none';
      document.body.classList.remove('protec-base-open');
      clearInterval(this.timer);
      ProtecBaseLive.detach('base');
    },

    isOpen() { return !!(this.el && this.el.style.display !== 'none'); },

    applySide() {
      if (!this.el) return;
      const side = this.el.querySelector('[data-ref="side"]');
      if (side) side.style.display = this.sideOpen ? 'flex' : 'none';
      const t = this.el.querySelector('[data-act="side"]');
      if (t) t.classList.toggle('pbv-on', !!this.sideOpen);
    },

    build() {
      injectBaseStyles();
      const el = document.createElement('div');
      el.id = 'protec-base-view';
      el.style.display = 'none';
      el.innerHTML = `
        <div class="pbv-stage">
          <canvas id="protec-base-canvas" style="width:100%;height:100%;display:block;touch-action:none;"></canvas>
          <div class="pbv-top pbv-glass glass-panel">
            <button type="button" data-act="close" class="pbv-iconbtn" title="Revenir à la carte des opérations">← Carte</button>
            <div class="pbv-titles">
              <div data-ref="title" class="pbv-title">Ma base</div>
              <div data-ref="subtitle" class="pbv-subtitle"></div>
            </div>
            <button type="button" data-act="side" class="pbv-iconbtn" title="Afficher / masquer le panneau de l’antenne">☰</button>
          </div>
          <aside data-ref="side" class="pbv-side pbv-glass glass-panel-heavy">
            <div class="pbv-tabs">
              <button type="button" data-tab="activite" class="pbv-tab">Activité</button>
              <button type="button" data-tab="flotte" class="pbv-tab">Flotte</button>
              <button type="button" data-tab="effectif" class="pbv-tab">Effectif</button>
            </div>
            <div data-ref="scroll" class="pbv-scroll"></div>
          </aside>
        </div>`;
      ['mousedown', 'wheel', 'touchstart'].forEach(t => {
        el.querySelector('.pbv-top').addEventListener(t, (e) => e.stopPropagation(), { passive: true });
        el.querySelector('.pbv-side').addEventListener(t, (e) => e.stopPropagation(), { passive: true });
      });
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-tab],[data-veh],[data-run]');
        if (!b) return;
        const game = window.game;
        const st = game && (game.stations || []).find(s => s.id === this.stationId);
        if (b.dataset.act === 'close') return this.close();
        if (b.dataset.act === 'side') { this.sideOpen = !this.sideOpen; this.applySide(); return; }
        if (b.dataset.tab) { this.tab = b.dataset.tab; this.refresh(true); return; }
        if (b.dataset.veh && game && typeof game.openVehicleDetailsModal === 'function') return game.openVehicleDetailsModal(b.dataset.veh);
        const run = b.dataset.run;
        if (!run || !game) return;
        const sc = ProtecBaseLive.slots.base;
        try {
          if (run === 'stock') { if (window.ProtecLogistique) { window.ProtecLogistique.selectedStationId = this.stationId; window.ProtecLogistique.activeTab = 'stock'; } game.openModule('logistique'); }
          else if (run === 'shops') { if (window.ProtecBoutiques) window.ProtecBoutiques.selectedStationId = this.stationId; game.openModule('boutiques'); }
          else if (run === 'building') { if (window.ProtecLocaux) window.ProtecLocaux.activeTab = 'modulaire'; game.openModule('locaux'); }
          else if (run === 'buyveh' && typeof game.openBuyVehicleModal === 'function') game.openBuyVehicleModal(this.stationId);
          else if (run === 'occasion') game.openModule('marche_occasion');
          else if (run === 'recruit') game.openModule('recrutement');
          else if (run === 'rename' && typeof game.openRenameVolunteerModal === 'function') game.openRenameVolunteerModal(b.dataset.id);
          else if (run === 'edit' && sc) sc.editToggle(true);
          else if (run === 'logmission' && window.ProtecMissionsLog) window.ProtecMissionsLog.openCreateModal(game, {});
        } catch (err) { console.warn('[Ma base]', run, err); }
        void st;
      });
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || !this.isOpen()) return;
        const modal = document.getElementById('main-modal');
        const drawer = document.getElementById('context-drawer');
        if ((modal && !modal.classList.contains('hidden')) || (drawer && !drawer.classList.contains('hidden'))) return;
        this.close();
      });
      document.body.appendChild(el);
      this.el = el;
    },

    // Panneau de l'antenne (activité, flotte, effectif), mis à jour chaque seconde
    refresh(force) {
      if (!this.isOpen()) return;
      const game = window.game;
      const st = game && (game.stations || []).find(s => s.id === this.stationId);
      if (!st) return;
      const sc = ProtecBaseLive.slots.base;
      const out = sc && sc.directorOut;
      const esc = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
      const q = (r) => this.el.querySelector(`[data-ref="${r}"]`);
      const vols = Director.stationVolunteers(game, st);
      const vehs = Director.stationVehicles(game, st);
      const present = sc ? sc.agents.filter(a => !a.leaving).length : 0;
      const onMission = vols.filter(v => MISSION_AWAY.includes(v.status)).length;
      const dispo = vols.filter(v => !v.status || v.status === 'dispo').length;
      const vehDispo = vehs.filter(v => sc ? sc.vehicleStatus(v).color === '#16a34a' : v.status === 'dispo').length;
      const clock = new Date(nowMs(game)).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      q('title').textContent = st.name || 'Ma base';
      q('subtitle').textContent = `${st.city || st.commune || 'Antenne'} · Niveau ${st.level || 1} · ${clock}`;
      this.el.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === this.tab));

      const card = (title, body, extra = '') => `<section class="pbv-card"><div class="pbv-card-head"><span class="pbv-card-title">${title}</span>${extra}</div>${body}</section>`;
      const row = (left, right, color) => `<div class="pbv-row"><span class="pbv-row-l">${left}</span><span class="pbv-row-r"${color ? ` style="color:${color}"` : ''}>${right}</span></div>`;
      const act = (run, label, pri, extraAttr = '') => `<button type="button" data-run="${run}" ${extraAttr} class="pbv-act${pri ? ' pri' : ''}">${label}</button>`;
      let html = '';

      if (this.tab === 'activite') {
        const kpis = `<div class="pbv-kpis"><div class="pbv-kpi"><b>${present}</b><span>À la base</span></div><div class="pbv-kpi"><b>${onMission}</b><span>En mission</span></div><div class="pbv-kpi"><b>${vehDispo}/${vehs.length}</b><span>Véhicules</span></div></div>`;
        const acts = [];
        (out && out.alerts || []).forEach(al => acts.push(row(`🚨 ${esc(al.title)}`, `${al.arrived}/${al.required}${al.planned ? ' · ' + al.startsInMin + ' min' : ''}`, '#dc2626')));
        const counts = {};
        if (sc) sc.agents.forEach(a => { if (!a.leaving) counts[a.logicalState] = (counts[a.logicalState] || 0) + 1; });
        if (counts.IN_TRAINING) { const lab = [...(out ? out.assignments.values() : [])].find(x => x.state === AgentState.IN_TRAINING); acts.push(row(`🎓 ${esc(lab && lab.label || 'Formation')}`, `${counts.IN_TRAINING} pers.`, '#2563eb')); }
        if (counts.ON_DUTY_WAIT) acts.push(row(`📻 ${esc(out && out.guardLabel || 'Garde active')}`, `${counts.ON_DUTY_WAIT} pers.`, '#059669'));
        if (counts.LOGISTICS) acts.push(row('📦 Préparation logistique', `${counts.LOGISTICS} pers.`, '#d97706'));
        if (out && out.cohesion) acts.push(row(`🎉 ${esc(out.cohesion.label)}`, `jusqu’à ${new Date(out.cohesion.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, '#7c3aed'));
        if (counts.IDLE && !(out && out.cohesion)) acts.push(row('💼 Personnel salarié au poste', `${counts.IDLE} pers.`, '#64748b'));
        const actHtml = acts.length ? acts.join('') : `<div class="pbv-muted">Antenne calme : aucun bénévole sur place. ${dispo} disponible(s) à domicile.</div>`;
        const inv = sc && sc._inv;
        let stockRows = [];
        if (inv) {
          const all = {};
          (inv.floor || []).forEach(e => { all[e.id] = (all[e.id] || 0) + e.qty; });
          Object.entries(inv.stored || {}).forEach(([id, n]) => { all[id] = (all[id] || 0) + n; });
          stockRows = Object.entries(all).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, n]) => row(`${esc(itemName(id))}`, `× ${n}`));
        }
        const stockHtml = (stockRows.length ? stockRows.join('') : '<div class="pbv-muted">Réserve vide.</div>') + `<div class="pbv-actions">${act('stock', '📦 Inventaire')}${act('shops', '🛒 Boutiques')}</div>`;
        const p = st.premises || {};
        const occ = p.occupationType === 'location_privee' ? `Location · ${(p.monthlyRent || 0).toLocaleString('fr-FR')} €/mois` : p.occupationType === 'pleine_propriete' || p.tenure === 'owned' ? 'Pleine propriété' : 'Mise à disposition (mairie)';
        const bHtml = row(esc((p.name || 'Locaux').split('•')[0].trim()), esc(p.surfaceM2 ? p.surfaceM2 + ' m²' : '')) + row('Statut', esc(occ)) +
          `<div class="pbv-actions">${act('building', '🏢 Gérer le bâtiment (immobilier, sécurité, travaux)')}</div>`;
        html = kpis + card('Activité de l’antenne', actHtml) + card('Réserve & matériel', stockHtml) + card('Bâtiment', bHtml);
      } else if (this.tab === 'flotte') {
        const vehHtml = vehs.length ? vehs.map(v => {
          const s2 = sc ? sc.vehicleStatus(v) : { text: v.status, color: '#334155', arm: v.armementLevel };
          const arm = Math.round(Number(s2.arm) || 0);
          return `<button type="button" data-veh="${esc(v.id)}" class="pbv-click">${row(`<strong>${esc(v.name || v.type)}</strong> <span class="pbv-dim">· ${esc(v.label || v.type || '')}</span><br><span class="pbv-dim">🎒 ${arm}%${typeof v.fuel === 'number' ? ' · ⛽ ' + Math.round(v.fuel) + '%' : ''}${typeof v.cleanliness === 'number' ? ' · 🧽 ' + Math.round(v.cleanliness) + '%' : ''}</span>`, `<span class="pbv-badge">${esc(s2.text)}</span>`, s2.color)}</button>`;
        }).join('') : '<div class="pbv-muted">Aucun véhicule.</div>';
        html = card(`Véhicules (${vehs.length})`, vehHtml + `<div class="pbv-actions">${act('logmission', '📦 Mission logistique', true)}${act('buyveh', '+ Véhicule neuf')}${act('occasion', '🏷️ Marché occasion')}</div>`);
      } else {
        const lab = (v) => {
          if (MISSION_AWAY.includes(v.status)) return ['En mission', '#dc2626'];
          if (sc && sc.agents.some(a => a.id === v.id && !a.leaving)) return ['À la base', '#2563eb'];
          if (!v.status || v.status === 'dispo') return ['Disponible', '#16a34a'];
          return [String(v.status).replace(/_/g, ' '), '#64748b'];
        };
        const volHtml = vols.length ? vols.map(v => {
          const [t, c] = lab(v);
          return row(`<strong>${esc(v.name)}</strong> <span class="pbv-dim">· ${esc(v.rank || '')}</span>`, `<span class="pbv-badge">${esc(t)}</span><button type="button" class="pbv-mini" data-run="rename" data-id="${esc(v.id)}" title="Modifier l’identité">✏️</button>`, c);
        }).join('') : '<div class="pbv-muted">Aucun membre rattaché.</div>';
        html = card(`Effectif rattaché (${vols.length})`, volHtml + `<div class="pbv-actions">${act('recruit', '👥 Recruter', true)}</div>`);
      }
      const sc2 = q('scroll');
      const top = sc2.scrollTop;
      if (force || sc2._html !== html) { sc2.innerHTML = html; sc2._html = html; sc2.scrollTop = top; }
    }
  };

  // =========================================================================
  // 9. API PUBLIQUE
  // =========================================================================

  const ProtecBaseLive = {
    AgentState,
    Director,
    NavGrid,
    WorldModel,
    ITEM_MODELS,
    itemModelFor,
    _debugDraw: { drawItemModel: (...args) => drawItemModel(...args), Iso },
    BaseView,
    slots: {},
    scene: null,
    liveMode: (function () { try { return localStorage.getItem('protec_live_mode') !== '0'; } catch (e) { return true; } })(),

    // La scène vivante remplace le plan 2D du module Locaux hors mode Aménagement
    shouldRun(locaux, canvas) {
      if (!this.liveMode || !locaux || !canvas) return false;
      if (locaux.isEditing || locaux._currentSetupModel) return false;
      if (locaux.activeTab && locaux.activeTab !== 'plan') return false;
      return true;
    },

    // Sans argument : scène du module Locaux
    isActive(canvas) {
      if (canvas) return Object.values(this.slots).some(s => s && s.running && s.canvas === canvas);
      const s = this.slots.locaux;
      return !!(s && s.running);
    },

    attach(canvas, locaux, slot = 'locaux') {
      const cur = this.slots[slot];
      if (cur && cur.canvas === canvas && cur.running) return cur;
      const sc = new LiveScene(canvas, locaux, slot);
      if (cur) {
        // Même antenne : on conserve les avatars, la caméra et les animations en cours
        const sameStation = cur.locaux === locaux && (cur.directorOut && cur.directorOut.station ? cur.directorOut.station.id : null) === ((Director.stationOf(window.game, locaux) || {}).id || null);
        if (sameStation && cur.world) sc.adopt(cur);
        cur.destroy(sameStation);
      }
      this.slots[slot] = sc;
      this.scene = sc;
      sc.start();
      return sc;
    },

    detach(slot = 'locaux') {
      const s = this.slots[slot];
      if (s) { this.slots[slot] = null; s.destroy(); }
      if (this.scene === s) this.scene = this.slots.base || this.slots.locaux || null;
    },

    toggleLiveMode(force) {
      this.liveMode = typeof force === 'boolean' ? force : !this.liveMode;
      try { localStorage.setItem('protec_live_mode', this.liveMode ? '1' : '0'); } catch (e) { /* stockage indisponible */ }
      const L = window.ProtecLocaux;
      if (!this.liveMode) this.detach('locaux');
      if (L && typeof L.renderModal === 'function' && window.game) L.renderModal(window.game);
      else if (L) L.renderArchitectScene();
    },

    zoom(factor) { const s = this.slots.locaux; if (s) s.zoomAt(factor); },
    resetCamera() { const s = this.slots.locaux; if (s) { s.userMoved = false; s.fitView(); } },

    // Vue plein écran « Ma base »
    openBaseView(stationId, opts) { BaseView.open(stationId, opts || {}); },
    closeBaseView() { BaseView.close(); },

    // Outil de debug : état courant des avatars
    debug(slot) {
      const sc = slot ? this.slots[slot] : this.scene;
      if (!sc) return [];
      return sc.agents.map(a => ({ id: a.id, name: a.name, state: a.state, logical: a.logicalState, pose: a.pose, x: +a.x.toFixed(2), y: +a.y.toFixed(2), poi: a.poi && a.poi.kind, leaving: a.leaving }));
    }
  };

  window.ProtecBaseLive = ProtecBaseLive;
})();
