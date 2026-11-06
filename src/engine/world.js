// The world Bit lives in: floating sky islands made of tiles.
//
// Map legend (one string per row, all rows the same length):
//   ' ' sky (Bit falls)     '.' grass        '#' rock        'T' tree
//   'p' white paint pad      'g' gem          'H' Bit's house (home)
//   '1' red tile             '2' blue tile
//   '^' '>' 'v' '<'  Bit's start and the way Bit faces (on grass, or on a pad if level.startOnPad)
//
// Directions: 0 = up, 1 = right, 2 = down, 3 = left. "turn left/right" is from Bit's point of view.

export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];
const START = { '^': 0, '>': 1, 'v': 2, '<': 3 };

export function parseMap(rows, opts = {}) {
  const h = rows.length, w = Math.max(...rows.map((r) => r.length));
  const cells = [];
  let bit = null, gems = 0, home = null;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x] || ' ';
      const c = { k: 'grass', color: null, gem: false, home: false };
      if (ch === ' ') c.k = 'void';
      else if (ch === '#') c.k = 'rock';
      else if (ch === 'T') c.k = 'tree';
      else if (ch === 'p') c.k = 'pad';
      else if (ch === '1') { c.k = 'sign'; c.color = 'red'; }
      else if (ch === '2') { c.k = 'sign'; c.color = 'blue'; }
      else if (ch === 'g') { c.gem = true; gems++; }
      else if (ch === 'H') { c.home = true; home = { x, y }; }
      else if (ch in START) { bit = { x, y, d: START[ch] }; if (opts.startOnPad) c.k = 'pad'; }
      else if (ch !== '.') throw new Error('Unknown map character "' + ch + '"');
      cells.push(c);
    }
  }
  if (!bit) throw new Error('Map has no Bit start (^ > v <)');
  return { w, h, cells, bit, gems, home };
}

export function newState(map) {
  return {
    w: map.w, h: map.h,
    cells: map.cells.map((c) => ({ ...c })),
    bit: { ...map.bit },
    got: 0, totalGems: map.gems,
    vars: {}, said: [],
  };
}

export const cellAt = (st, x, y) => (x < 0 || y < 0 || x >= st.w || y >= st.h ? null : st.cells[y * st.w + x]);
export const walkable = (c) => !!c && (c.k === 'grass' || c.k === 'pad' || c.k === 'sign');

function relCell(st, turn) {
  const d = (st.bit.d + turn + 4) % 4;
  return cellAt(st, st.bit.x + DX[d], st.bit.y + DY[d]);
}

export function sense(st, cond) {
  const here = cellAt(st, st.bit.x, st.bit.y);
  switch (cond) {
    case 'canForward': return walkable(relCell(st, 0));
    case 'cantForward': return !walkable(relCell(st, 0));
    case 'canLeft': return walkable(relCell(st, -1));
    case 'canRight': return walkable(relCell(st, 1));
    case 'onGem': return here.gem;
    case 'home': return here.home;
    case 'red': return here.color === 'red';
    case 'blue': return here.color === 'blue';
  }
  throw new Error('Unknown condition ' + cond);
}

// Apply one action block. Returns { events, fail }.
export function act(st, node) {
  const b = st.bit, a = node.args || {};
  const here = () => cellAt(st, b.x, b.y);
  switch (node.type) {
    case 'forward': {
      const nx = b.x + DX[b.d], ny = b.y + DY[b.d];
      const c = cellAt(st, nx, ny);
      const from = { x: b.x, y: b.y };
      if (!c || c.k === 'void') { b.x = nx; b.y = ny; return { events: [{ t: 'fall', from, to: { x: nx, y: ny }, d: b.d }], fail: 'fall' }; }
      if (c.k === 'rock' || c.k === 'tree') return { events: [{ t: 'bump', d: b.d, what: c.k }], fail: 'bump' };
      b.x = nx; b.y = ny;
      return { events: [{ t: 'move', from, to: { x: nx, y: ny }, d: b.d }] };
    }
    case 'turn': {
      const from = b.d;
      b.d = (b.d + (a.dir === 'left' ? 3 : 1)) % 4;
      return { events: [{ t: 'turn', from, to: b.d, dir: a.dir }] };
    }
    case 'pick': {
      const c = here();
      if (!c.gem) return { events: [{ t: 'oops' }], fail: 'nogem' };
      c.gem = false; st.got++;
      return { events: [{ t: 'pick', x: b.x, y: b.y, got: st.got }] };
    }
    case 'paint': {
      const c = here();
      if (c.k !== 'pad') return { events: [{ t: 'oops' }], fail: 'nopad' };
      c.color = a.color;
      return { events: [{ t: 'paint', x: b.x, y: b.y, color: a.color }] };
    }
    case 'say': {
      let v = a.what;
      if (v in VAR_NAMES) {
        if (!(v in st.vars)) return { events: [{ t: 'oops' }], fail: 'novar', };
        v = st.vars[v];
      }
      st.said.push(v);
      return { events: [{ t: 'say', text: String(v), value: v }] };
    }
    case 'set': {
      st.vars[a.v] = a.n;
      return { events: [{ t: 'var', name: a.v, value: a.n }] };
    }
    case 'add': {
      if (!(a.v in st.vars)) return { events: [{ t: 'oops' }], fail: 'novar' };
      st.vars[a.v] += 1;
      return { events: [{ t: 'var', name: a.v, value: st.vars[a.v] }] };
    }
  }
  throw new Error('Not an action block: ' + node.type);
}

const VAR_NAMES = { steps: 1, gems: 1, size: 1 };
export const isVarName = (v) => typeof v === 'string' && v in VAR_NAMES;

// Answers for "say" goals, worked out from the map so every test map has its own answer.
export function answerFor(kind, map) {
  if (typeof kind === 'number') return kind;
  if (kind === 'gems') return map.gems;
  if (kind === 'distance') {
    const st = newState(map);
    let n = 0;
    while (walkable(cellAt(st, st.bit.x + DX[st.bit.d], st.bit.y + DY[st.bit.d]))) { st.bit.x += DX[st.bit.d]; st.bit.y += DY[st.bit.d]; n++; }
    return n;
  }
  throw new Error('Unknown answer kind ' + kind);
}
