// The stage: a floating sky island drawn on a canvas, with Bit and every animation.
// The engine runs ahead; the play screen feeds trace events here one at a time and awaits each.
import { DX, DY } from '../engine/world.js';
import { COLORS } from '../engine/blocks.js';
import { drawBit, INK } from '../art/bit.js';

const TAU = Math.PI * 2;
export const CANCEL = { cancelled: true };

export const THEMES = {
  meadow: { sky: ['#56bdff', '#cdf1ff'], top: '#93dd5c', top2: '#86d350', edge: '#3c7a2c', cliff: '#c98d50', cliff2: '#b0733a', cliffEdge: '#5f3816', tree: 'oak', deco: ['#ffffff', '#ffd6ec'] },
  beach: { sky: ['#43b8ff', '#ffeccb'], top: '#ffe4a1', top2: '#f8d88a', edge: '#b17d33', cliff: '#e9b577', cliff2: '#d39657', cliffEdge: '#7d4c1c', tree: 'palm', deco: ['#ffffff', '#ffb8a0'] },
  orchard: { sky: ['#6ac3ff', '#ffe4d2'], top: '#bfe05d', top2: '#b0d54d', edge: '#5e7b2a', cliff: '#cc8a4f', cliff2: '#b26f37', cliffEdge: '#5e3514', tree: 'apple', deco: ['#fff3b0', '#ffd0a0'] },
  canyon: { sky: ['#72c8ff', '#ffd6ae'], top: '#f7c78f', top2: '#f0b97d', edge: '#9a5428', cliff: '#d98149', cliff2: '#bd6532', cliffEdge: '#5f2c10', tree: 'cactus', deco: ['#fff0dc', '#e9a36b'] },
  snow: { sky: ['#5ea6ff', '#e7f2ff'], top: '#f8fcff', top2: '#ebf5fc', edge: '#5f84ab', cliff: '#acd1ee', cliff2: '#90bbde', cliffEdge: '#3e6489', tree: 'pine', deco: ['#cfe6fa', '#ffffff'] },
};

const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
const lerp = (a, b, p) => a + (b - a) * p;
const clamp01 = (p) => Math.max(0, Math.min(1, p));
function rand(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function rr(c, x, y, w, h, r) {
  const R = Array.isArray(r) ? r : [r, r, r, r];
  c.beginPath();
  c.moveTo(x + R[0], y);
  c.lineTo(x + w - R[1], y); R[1] ? c.arcTo(x + w, y, x + w, y + R[1], R[1]) : c.lineTo(x + w, y);
  c.lineTo(x + w, y + h - R[2]); R[2] ? c.arcTo(x + w, y + h, x + w - R[2], y + h, R[2]) : c.lineTo(x + w, y + h);
  c.lineTo(x + R[3], y + h); R[3] ? c.arcTo(x, y + h, x, y + h - R[3], R[3]) : c.lineTo(x, y + h);
  c.lineTo(x, y + R[0]); R[0] ? c.arcTo(x, y, x + R[0], y, R[0]) : c.lineTo(x, y);
  c.closePath();
}

// ---------------------------------------------------------------- objects
function drawTree(c, T, kind) {
  const u = T / 100;
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(0, 28 * u, 30 * u, 9 * u, 0, 0, TAU); c.fill();
  if (kind === 'palm') {
    c.strokeStyle = '#6b4a22'; c.lineWidth = 14 * u; c.beginPath(); c.moveTo(-4 * u, 28 * u); c.quadraticCurveTo(-10 * u, -10 * u, 6 * u, -40 * u); c.stroke();
    c.strokeStyle = '#b07a3c'; c.lineWidth = 8 * u; c.stroke();
    const leaf = (a) => { c.save(); c.translate(6 * u, -42 * u); c.rotate(a); c.beginPath(); c.ellipse(26 * u, 0, 28 * u, 9 * u, 0, 0, TAU); c.fillStyle = '#3fb04c'; c.fill(); c.strokeStyle = '#1f6b2c'; c.lineWidth = 3.5 * u; c.stroke(); c.restore(); };
    [-2.7, -1.9, -0.9, -0.2, 0.5].forEach(leaf);
    c.fillStyle = '#7a4d1e'; c.beginPath(); c.arc(2 * u, -36 * u, 5 * u, 0, TAU); c.arc(12 * u, -34 * u, 5 * u, 0, TAU); c.fill();
    return;
  }
  if (kind === 'cactus') {
    const g = '#46b85a', d = '#1f6b2c';
    c.fillStyle = g; c.strokeStyle = d; c.lineWidth = 4 * u;
    rr(c, -11 * u, -46 * u, 22 * u, 74 * u, 11 * u); c.fill(); c.stroke();
    rr(c, -32 * u, -20 * u, 14 * u, 30 * u, 7 * u); c.fill(); c.stroke();
    rr(c, 18 * u, -32 * u, 14 * u, 28 * u, 7 * u); c.fill(); c.stroke();
    c.fillRect(-21 * u, 2 * u, 12 * u, 8 * u); c.fillRect(10 * u, -12 * u, 10 * u, 8 * u);
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 3 * u; c.beginPath(); c.moveTo(-4 * u, -38 * u); c.lineTo(-4 * u, 18 * u); c.stroke();
    c.fillStyle = '#ff7bb8'; c.beginPath(); c.arc(0, -48 * u, 6 * u, 0, TAU); c.fill();
    return;
  }
  if (kind === 'pine') {
    c.fillStyle = '#7a4d1e'; c.fillRect(-6 * u, 10 * u, 12 * u, 18 * u);
    const tri = (y, w, h) => { c.beginPath(); c.moveTo(0, y - h); c.lineTo(w, y); c.lineTo(-w, y); c.closePath(); c.fillStyle = '#2f8f5a'; c.fill(); c.strokeStyle = '#17543a'; c.lineWidth = 4 * u; c.stroke();
      c.beginPath(); c.moveTo(0, y - h); c.lineTo(w * 0.42, y - h * 0.58); c.lineTo(-w * 0.42, y - h * 0.58); c.closePath(); c.fillStyle = '#ffffff'; c.fill(); };
    tri(14 * u, 36 * u, 34 * u); tri(-6 * u, 29 * u, 32 * u); tri(-26 * u, 21 * u, 30 * u);
    return;
  }
  // oak / apple
  const leafC = kind === 'apple' ? '#f5a03f' : '#4cb84f', leafD = kind === 'apple' ? '#a65a14' : '#22692e', leafH = kind === 'apple' ? '#ffc56e' : '#79d96a';
  c.fillStyle = '#8a5a2b'; c.strokeStyle = '#4e2f12'; c.lineWidth = 4 * u;
  rr(c, -8 * u, -4 * u, 16 * u, 32 * u, 4 * u); c.fill(); c.stroke();
  c.fillStyle = leafC; c.strokeStyle = leafD; c.lineWidth = 4.5 * u;
  const blobs = [[-16, -18, 22], [16, -18, 22], [0, -38, 25]];
  const canopy = () => { c.beginPath(); blobs.forEach(([x, y, r]) => { c.moveTo((x + r) * u, y * u); c.arc(x * u, y * u, r * u, 0, TAU); }); };
  canopy(); c.stroke(); canopy(); c.fill();
  c.fillStyle = leafH; c.beginPath(); c.moveTo(1 * u, -46 * u); c.arc(-8 * u, -46 * u, 9 * u, 0, TAU); c.moveTo(-16 * u, -24 * u); c.arc(-22 * u, -24 * u, 6 * u, 0, TAU); c.fill();
  if (kind === 'apple') { c.fillStyle = '#e8352f'; c.strokeStyle = '#8f1d18'; c.lineWidth = 2 * u; [[10, -30], [-14, -12], [18, -10]].forEach(([x, y]) => { c.beginPath(); c.arc(x * u, y * u, 5.5 * u, 0, TAU); c.fill(); c.stroke(); }); }
}

function drawRock(c, T) {
  const u = T / 100;
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, 27 * u, 38 * u, 10 * u, 0, 0, TAU); c.fill();
  c.lineJoin = 'round';
  const shape = () => {
    c.beginPath(); c.moveTo(-38 * u, 24 * u);
    c.bezierCurveTo(-46 * u, -6 * u, -30 * u, -40 * u, -4 * u, -40 * u);
    c.bezierCurveTo(26 * u, -42 * u, 44 * u, -14 * u, 38 * u, 24 * u);
    c.closePath();
  };
  shape(); c.fillStyle = '#b3bdcb'; c.fill();
  c.save(); shape(); c.clip();
  c.fillStyle = '#909cae'; c.beginPath(); c.ellipse(14 * u, 22 * u, 44 * u, 26 * u, -0.3, 0, TAU); c.fill();
  c.fillStyle = '#d7dde6'; c.beginPath(); c.ellipse(-14 * u, -24 * u, 15 * u, 8 * u, -0.5, 0, TAU); c.fill();
  c.restore();
  c.strokeStyle = '#4b566a'; c.lineWidth = 4.5 * u; shape(); c.stroke();
  c.lineWidth = 3 * u; c.beginPath(); c.moveTo(8 * u, -22 * u); c.lineTo(2 * u, -8 * u); c.lineTo(10 * u, 2 * u); c.stroke();
}

function drawHouse(c, T, open) {
  const u = T / 100;
  c.lineJoin = 'round';
  c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(0, 28 * u, 40 * u, 10 * u, 0, 0, TAU); c.fill();
  // chimney
  c.fillStyle = '#c9634a'; c.strokeStyle = INK; c.lineWidth = 4 * u; rr(c, 14 * u, -48 * u, 12 * u, 22 * u, 2 * u); c.fill(); c.stroke();
  // walls
  c.fillStyle = '#fff3da'; rr(c, -32 * u, -18 * u, 64 * u, 46 * u, 6 * u); c.fill(); c.stroke();
  // roof
  c.beginPath(); c.moveTo(-42 * u, -14 * u); c.lineTo(0, -50 * u); c.lineTo(42 * u, -14 * u); c.closePath();
  c.fillStyle = '#f0543f'; c.fill(); c.lineWidth = 4.5 * u; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(-30 * u, -18 * u); c.lineTo(0, -44 * u); c.lineTo(-4 * u, -36 * u); c.lineTo(-24 * u, -18 * u); c.fill();
  // door
  c.fillStyle = open ? '#ffe27a' : '#8a5a2b'; rr(c, -11 * u, 0, 22 * u, 28 * u, [11 * u, 11 * u, 0, 0]); c.fill(); c.lineWidth = 4 * u; c.stroke();
  if (!open) { c.fillStyle = '#ffd23a'; c.beginPath(); c.arc(5 * u, 15 * u, 2.6 * u, 0, TAU); c.fill(); }
  // window
  c.fillStyle = '#8fdcff'; rr(c, 17 * u, -6 * u, 11 * u, 11 * u, 2 * u); c.fill(); c.lineWidth = 3 * u; c.stroke();
  c.beginPath(); c.moveTo(22.5 * u, -6 * u); c.lineTo(22.5 * u, 5 * u); c.stroke();
}

function drawGem(c, T, t, phase) {
  const u = T / 100, bob = Math.sin(t / 380 + phase) * 4 * u;
  c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(0, 22 * u, 20 * u * (1 - bob / (30 * u)), 6 * u, 0, 0, TAU); c.fill();
  c.save(); c.translate(0, -6 * u + bob);
  c.lineJoin = 'round';
  const top = -24 * u, mid = -8 * u, bot = 22 * u, w = 24 * u;
  c.beginPath(); c.moveTo(-w * 0.55, top); c.lineTo(w * 0.55, top); c.lineTo(w, mid); c.lineTo(0, bot); c.lineTo(-w, mid); c.closePath();
  c.fillStyle = '#35d4ff'; c.fill();
  c.fillStyle = '#1aa6e0'; c.beginPath(); c.moveTo(0, bot); c.lineTo(w, mid); c.lineTo(w * 0.3, mid); c.closePath(); c.fill();
  c.fillStyle = '#9ff0ff'; c.beginPath(); c.moveTo(-w * 0.55, top); c.lineTo(-w * 0.15, top); c.lineTo(-w * 0.3, mid); c.lineTo(-w, mid); c.closePath(); c.fill();
  c.strokeStyle = '#1b4f7a'; c.lineWidth = 4 * u;
  c.beginPath(); c.moveTo(-w * 0.55, top); c.lineTo(w * 0.55, top); c.lineTo(w, mid); c.lineTo(0, bot); c.lineTo(-w, mid); c.closePath(); c.stroke();
  c.lineWidth = 2.4 * u; c.beginPath(); c.moveTo(-w, mid); c.lineTo(w, mid); c.stroke();
  const tw = (Math.sin(t / 300 + phase * 3) + 1) / 2;
  c.fillStyle = `rgba(255,255,255,${0.5 + tw * 0.5})`;
  c.translate(-8 * u, -16 * u); c.rotate(t / 900);
  c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 1.5 * u : 6 * u * (0.6 + tw * 0.4); c.lineTo(Math.cos(i * Math.PI / 4) * r, Math.sin(i * Math.PI / 4) * r); } c.fill();
  c.restore();
}

function drawPad(c, x, y, T, color, kind) {
  const m = T * 0.08, s = T - 2 * m, r = T * 0.14;
  const col = color ? COLORS[color] : null;
  c.fillStyle = col ? col.dark : '#c9d2df';
  rr(c, x + m, y + m + T * 0.04, s, s, r); c.fill();
  c.fillStyle = col ? col.hex : '#f7f9fd';
  rr(c, x + m, y + m, s, s - T * 0.03, r); c.fill();
  c.strokeStyle = col ? col.dark : '#9aa7bb'; c.lineWidth = Math.max(2, T * 0.03);
  rr(c, x + m, y + m, s, s + T * 0.01, r); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.45)'; rr(c, x + m + s * 0.12, y + m + s * 0.1, s * 0.5, s * 0.12, s * 0.06); c.fill();
  if (kind === 'sign') {
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = T * 0.04;
    c.beginPath(); c.arc(x + T / 2, y + T / 2, T * 0.17, 0, TAU); c.stroke();
  }
}

// ---------------------------------------------------------------- the board
export function createBoard(canvas) {
  const c = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let level = null, map = null, theme = THEMES.meadow, target = null;
  let T = 64, OX = 0, OY = 0;
  let staticLayer = null;
  let view = null;
  let speed = 1;
  const jobs = new Set();
  let parts = [], bubbles = [];
  let raf = 0, alive = true, last = performance.now();

  // ---- animation engine ----
  function tween(ms, fn) {
    return new Promise((resolve, reject) => jobs.add({ t0: performance.now(), ms: Math.max(1, ms * speed), fn, resolve, reject }));
  }
  function cancel() {
    const old = [...jobs]; jobs.clear(); old.forEach((j) => j.reject(CANCEL));
    parts = []; bubbles = [];
  }

  // ---- layout ----
  function resize() {
    // We draw in design units (the stage is scaled with a CSS transform), but the
    // backing store matches real screen pixels so everything stays crisp.
    const parent = canvas.parentElement;
    const r = parent.getBoundingClientRect();
    W = Math.max(50, parent.offsetWidth); H = Math.max(50, parent.offsetHeight);
    const scale = r.width / W || 1;
    dpr = Math.min(2.5, Math.max(0.5, scale * (window.devicePixelRatio || 1)));
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    if (map) layout();
  }
  function layout() {
    const cliff = 0.55;
    T = Math.floor(Math.min((W - 80) / map.w, (H - 70) / (map.h + cliff), 132));
    OX = Math.round((W - T * map.w) / 2);
    OY = Math.round((H - T * (map.h + cliff)) / 2 + T * 0.12);
    buildStatic();
  }

  const occ = (x, y) => x >= 0 && y >= 0 && x < map.w && y < map.h && map.cells[y * map.w + x].k !== 'void';

  function buildStatic() {
    const cv = document.createElement('canvas');
    cv.width = canvas.width; cv.height = canvas.height;
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // sky
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, theme.sky[0]); sky.addColorStop(1, theme.sky[1]);
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const R = rand(map.w * 31 + map.h * 7 + (level.index || 0) * 101);
    // soft clouds
    for (let i = 0; i < 6; i++) {
      const cx = R() * W, cy = H * (0.08 + R() * 0.8), s = 30 + R() * 50;
      g.fillStyle = 'rgba(255,255,255,.55)';
      g.beginPath(); g.arc(cx, cy, s, 0, TAU); g.arc(cx + s * 1.1, cy + s * 0.2, s * 0.8, 0, TAU); g.arc(cx - s * 1.0, cy + s * 0.25, s * 0.7, 0, TAU); g.fill();
    }
    const o = Math.max(3, T * 0.055), rad = T * 0.2, depth = T * 0.5;
    const cellXY = (x, y) => [OX + x * T, OY + y * T];
    // cliffs (outline pass, then fill pass)
    const cliffCells = [];
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (occ(x, y) && !occ(x, y + 1)) cliffCells.push([x, y]);
    const cliffPath = (x, y, grow) => {
      const [px, py] = cellXY(x, y);
      const l = !(occ(x - 1, y) && !occ(x - 1, y + 1)), r = !(occ(x + 1, y) && !occ(x + 1, y + 1));
      rr(g, px - (l ? grow : 0) - (l ? 0 : 1), py + T * 0.5, T + (l ? grow : 1) + (r ? grow : 1), T * 0.5 + depth + grow, [0, 0, r ? rad + grow : 0, l ? rad + grow : 0]);
    };
    g.fillStyle = theme.cliffEdge; cliffCells.forEach(([x, y]) => { cliffPath(x, y, o); g.fill(); });
    cliffCells.forEach(([x, y]) => {
      cliffPath(x, y, 0); g.fillStyle = theme.cliff; g.fill();
      const [px, py] = cellXY(x, y);
      g.save(); cliffPath(x, y, 0); g.clip();
      g.fillStyle = theme.cliff2; g.fillRect(px - 2, py + T + depth * 0.45, T + 4, depth);
      g.fillStyle = 'rgba(0,0,0,.08)';
      for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(px + T * (0.2 + R() * 0.6), py + T + depth * (0.2 + R() * 0.6), T * 0.05, 0, TAU); g.fill(); }
      g.restore();
    });
    // tops
    const topPath = (x, y, grow) => {
      const [px, py] = cellXY(x, y);
      const n = occ(x, y - 1), s = occ(x, y + 1), w = occ(x - 1, y), e = occ(x + 1, y);
      const L = w ? 1 : grow, Rg = e ? 1 : grow, U = n ? 1 : grow, D = s ? 1 : grow;
      rr(g, px - L, py - U, T + L + Rg, T + U + D, [!n && !w ? rad + grow : 0, !n && !e ? rad + grow : 0, !s && !e ? rad + grow : 0, !s && !w ? rad + grow : 0]);
    };
    g.fillStyle = theme.edge;
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (occ(x, y)) { topPath(x, y, o); g.fill(); }
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (occ(x, y)) {
      g.fillStyle = (x + y) % 2 ? theme.top2 : theme.top; topPath(x, y, 0); g.fill();
    }
    // a soft lip highlight along the top edge
    g.fillStyle = 'rgba(255,255,255,.18)';
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (occ(x, y) && !occ(x, y - 1)) { const [px, py] = cellXY(x, y); g.fillRect(px + T * 0.1, py + T * 0.04, T * 0.8, T * 0.06); }
    // tufts and flowers on plain ground
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const cell = map.cells[y * map.w + x];
      if (cell.k !== 'grass' || cell.home) continue;
      const [px, py] = cellXY(x, y);
      for (let k = 0; k < 2; k++) {
        const tx = px + T * (0.15 + R() * 0.7), ty = py + T * (0.2 + R() * 0.65);
        if (R() < 0.35) { g.fillStyle = theme.deco[k % 2]; g.beginPath(); g.arc(tx, ty, T * 0.035, 0, TAU); g.fill(); }
        else { g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = T * 0.025; g.lineCap = 'round'; g.beginPath(); g.moveTo(tx - T * 0.04, ty - T * 0.05); g.lineTo(tx, ty); g.lineTo(tx + T * 0.04, ty - T * 0.05); g.stroke(); }
      }
    }
    // signs (paint pads are drawn live because they change colour)
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const cell = map.cells[y * map.w + x];
      if (cell.k === 'sign') drawPad(g, OX + x * T, OY + y * T, T, cell.color, 'sign');
    }
    staticLayer = cv;
  }

  // ---- state ----
  function setMap(lv, mapIndex) {
    level = lv; map = lv.parsed[mapIndex];
    theme = THEMES[lv.world.theme] || THEMES.meadow;
    target = lv.targets ? lv.targets[mapIndex] : null;
    reset();
    resize();
  }
  function reset() {
    cancel();
    view = {
      bit: { x: map.bit.x, y: map.bit.y, d: map.bit.d, z: 0, sx: 1, sy: 1, rot: 0, alpha: 1, mood: 'ok', drop: 0 },
      gems: map.cells.map((c) => c.gem),
      colors: map.cells.map((c) => (c.k === 'pad' ? null : c.color)),
      paintAnim: map.cells.map(() => 1),
      homeOpen: false,
    };
  }

  const px = (x) => OX + (x + 0.5) * T;
  const py = (y) => OY + (y + 0.5) * T;

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(50, now - last); last = now;
    for (const j of [...jobs]) {
      const p = clamp01((now - j.t0) / j.ms);
      try { j.fn(p); } catch (e) { console.error(e); }
      if (p >= 1) { jobs.delete(j); j.resolve(); }
    }
    if (view && staticLayer) draw(now, dt);
    raf = requestAnimationFrame(frame);
  }

  function draw(now, dt) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(staticLayer, 0, 0);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // pads
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const i = y * map.w + x, cell = map.cells[i];
      if (cell.k !== 'pad') continue;
      const tx = OX + x * T, ty = OY + y * T;
      drawPad(c, tx, ty, T, null);
      const col = view.colors[i];
      if (col) {
        const p = view.paintAnim[i];
        c.save(); c.beginPath(); c.arc(tx + T / 2, ty + T / 2, T * 0.75 * ease(p), 0, TAU); c.clip();
        drawPad(c, tx, ty, T, col); c.restore();
      }
      const want = target && target[i];
      if (want && col !== want) {
        c.fillStyle = COLORS[want].hex; c.strokeStyle = '#fff'; c.lineWidth = T * 0.035;
        c.beginPath(); c.arc(tx + T / 2, ty + T / 2, T * 0.11, 0, TAU); c.fill(); c.stroke();
      } else if (want === null && target && col) {
        c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = T * 0.05; c.lineCap = 'round';
        c.beginPath(); c.moveTo(tx + T * 0.38, ty + T * 0.38); c.lineTo(tx + T * 0.62, ty + T * 0.62); c.moveTo(tx + T * 0.62, ty + T * 0.38); c.lineTo(tx + T * 0.38, ty + T * 0.62); c.stroke();
      }
    }
    // direction hint: a soft chevron in front of Bit
    const b = view.bit;
    if (b.alpha > 0.5 && !b.falling) {
      const d = b.d, fx = px(b.x) + DX[d] * T * 0.62, fy = py(b.y) + DY[d] * T * 0.62 + T * 0.1;
      const pulse = 0.75 + Math.sin(now / 300) * 0.2;
      c.save(); c.translate(fx, fy); c.rotate(d * Math.PI / 2); c.globalAlpha = pulse;
      c.fillStyle = '#ffffff'; c.strokeStyle = 'rgba(34,48,92,.55)'; c.lineWidth = T * 0.025;
      c.beginPath(); c.moveTo(0, -T * 0.13); c.lineTo(T * 0.14, T * 0.03); c.lineTo(T * 0.06, T * 0.03); c.lineTo(T * 0.06, T * 0.11); c.lineTo(-T * 0.06, T * 0.11); c.lineTo(-T * 0.06, T * 0.03); c.lineTo(-T * 0.14, T * 0.03); c.closePath();
      c.fill(); c.stroke(); c.restore();
    }
    // objects + Bit, back to front
    const bitRow = b.y + (b.falling ? 1 : 0);
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        const i = y * map.w + x, cell = map.cells[i];
        const cx = px(x), cy = py(y) + T * 0.12;
        if (cell.k === 'tree' || cell.k === 'rock' || cell.home) {
          c.save(); c.translate(cx, cy);
          if (cell.k === 'tree') drawTree(c, T, theme.tree);
          else if (cell.k === 'rock') drawRock(c, T);
          else drawHouse(c, T * 0.95, view.homeOpen);
          c.restore();
        }
        if (view.gems[i]) { c.save(); c.translate(cx, cy - T * 0.05); drawGem(c, T, now, i); c.restore(); }
      }
      if (Math.round(bitRow) === y || (y === map.h - 1 && bitRow > map.h - 1)) drawBitNow(now);
    }
    if (b.y < 0) drawBitNow(now);
    // particles
    parts = parts.filter((p) => p.life > 0);
    for (const p of parts) {
      p.life -= dt; p.vy += (p.g ?? 0.0012) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      c.save(); c.globalAlpha = clamp01(p.life / 350); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.color;
      if (p.shape === 'star') { c.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? p.s * 0.4 : p.s; c.lineTo(Math.cos(k * Math.PI / 5) * r, Math.sin(k * Math.PI / 5) * r); } c.fill(); }
      else if (p.shape === 'dot') { c.beginPath(); c.arc(0, 0, p.s, 0, TAU); c.fill(); }
      else c.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
      c.restore();
    }
    // bubbles
    bubbles = bubbles.filter((bb) => bb.age < bb.ms);
    for (const bb of bubbles) {
      bb.age += dt;
      const p = bb.age / bb.ms, a = p < 0.1 ? p / 0.1 : p > 0.85 ? (1 - p) / 0.15 : 1;
      const ax = px(view.bit.x), ay = py(view.bit.y) - view.bit.z - T * 0.78;
      bubble(bb.text, ax, ay - (1 - Math.min(1, p / 0.1)) * 8, clamp01(a), bb.kind);
    }
  }

  function drawBitNow(now) {
    const b = view.bit;
    if (b.alpha <= 0) return;
    const x = px(b.x), y = py(b.y) + T * 0.3 + b.drop;
    c.save();
    c.globalAlpha = b.alpha;
    if (!b.falling) { c.fillStyle = 'rgba(20,30,60,.22)'; c.beginPath(); c.ellipse(x, y, T * 0.24 * (1 - Math.min(0.5, b.z / T)), T * 0.07, 0, 0, TAU); c.fill(); }
    c.translate(x, y - b.z); c.rotate(b.rot); c.scale(b.sx, b.sy);
    drawBit(c, T * 0.98, b.d, b.mood, now);
    c.restore();
  }

  function bubble(text, x, y, alpha, kind) {
    const fs = Math.max(20, Math.round(T * 0.24));
    c.save(); c.globalAlpha = alpha;
    c.font = `600 ${fs}px Fredoka, "M PLUS Rounded 1c", system-ui, sans-serif`;
    const w = c.measureText(text).width + fs * 1.1, h = fs * 1.7;
    const bx = Math.max(6, Math.min(W - w - 6, x - w / 2)), by = Math.max(6, y - h);
    c.fillStyle = kind === 'oops' ? '#fff1d6' : '#ffffff'; c.strokeStyle = INK; c.lineWidth = 3;
    rr(c, bx, by, w, h, h / 2.2); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x - 8, by + h - 1.5); c.lineTo(x, by + h + 10); c.lineTo(x + 8, by + h - 1.5); c.fill();
    c.beginPath(); c.moveTo(x - 8, by + h); c.lineTo(x, by + h + 10); c.lineTo(x + 8, by + h); c.stroke();
    c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, bx + w / 2, by + h / 2 + 1);
    c.restore();
  }

  function burst(x, y, n, colors, shape, power = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = (0.08 + Math.random() * 0.25) * power;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.2 * power, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 0.02, s: (shape === 'dot' ? 4 : 7) + Math.random() * 6, life: 600 + Math.random() * 500, color: colors[i % colors.length], shape });
    }
  }
  function puff(x, y) {
    for (let i = 0; i < 6; i++) parts.push({ x: x + (Math.random() - 0.5) * T * 0.4, y, vx: (Math.random() - 0.5) * 0.08, vy: -0.03 - Math.random() * 0.04, rot: 0, vr: 0, s: T * (0.05 + Math.random() * 0.05), life: 450, color: 'rgba(255,255,255,.85)', shape: 'dot', g: 0 });
  }

  // ---- animations the play screen awaits ----
  const api = {
    CANCEL,
    setMap, reset, resize, cancel,
    setSpeed: (f) => { speed = f; },
    wait: (ms) => tween(ms, () => {}),
    get tile() { return T; },
    move(ev, ms = 380) {
      const b = view.bit; b.d = ev.d; b.mood = 'ok';
      return tween(ms, (p) => {
        const e = ease(p);
        b.x = lerp(ev.from.x, ev.to.x, e); b.y = lerp(ev.from.y, ev.to.y, e);
        b.z = Math.sin(p * Math.PI) * T * 0.13;
        b.sy = 1 + Math.sin(p * Math.PI) * 0.06; b.sx = 1 - Math.sin(p * Math.PI) * 0.04;
      }).then(() => { b.x = ev.to.x; b.y = ev.to.y; b.z = 0; b.sx = b.sy = 1; puff(px(b.x), py(b.y) + T * 0.32); });
    },
    turn(ev, ms = 300) {
      const b = view.bit;
      return tween(ms, (p) => {
        const s = Math.abs(Math.cos(p * Math.PI));
        b.sx = Math.max(0.08, s);
        if (p >= 0.5) b.d = ev.to;
        b.z = Math.sin(p * Math.PI) * T * 0.06;
      }).then(() => { b.sx = 1; b.d = ev.to; b.z = 0; });
    },
    bump(ev, ms = 520) {
      const b = view.bit, x0 = b.x, y0 = b.y;
      let hit = false;
      return tween(ms, (p) => {
        const push = p < 0.3 ? p / 0.3 : Math.max(0, 1 - (p - 0.3) / 0.7);
        b.x = x0 + DX[ev.d] * 0.3 * push; b.y = y0 + DY[ev.d] * 0.3 * push;
        b.rot = p > 0.3 ? Math.sin((p - 0.3) * 40) * 0.16 * (1 - p) : 0;
        if (p >= 0.3 && !hit) { hit = true; b.mood = 'oops'; burst(px(x0) + DX[ev.d] * T * 0.5, py(y0) + DY[ev.d] * T * 0.5, 10, ['#ffd23a', '#ff8a3d', '#ffffff'], 'star'); }
      }).then(() => { b.x = x0; b.y = y0; b.rot = 0; });
    },
    fall(ev, ms = 900) {
      const b = view.bit; b.d = ev.d;
      return tween(ms * 0.35, (p) => { b.x = lerp(ev.from.x, ev.to.x, p); b.y = lerp(ev.from.y, ev.to.y, p); b.z = Math.sin(p * Math.PI) * T * 0.15; })
        .then(() => { b.mood = 'oops'; b.falling = true; return tween(ms * 0.65, (p) => { b.drop = p * p * T * 2.2; b.rot = p * 2.5; b.alpha = 1 - p; b.sx = b.sy = 1 - p * 0.4; }); });
    },
    respawn(start, ms = 450) {
      const b = view.bit;
      Object.assign(b, { x: start.x, y: start.y, d: start.d, z: 0, rot: 0, drop: 0, falling: false, alpha: 1, mood: 'oops' });
      puff(px(start.x), py(start.y) + T * 0.2);
      return tween(ms, (p) => { b.sx = b.sy = ease(p); }).then(() => { b.sx = b.sy = 1; });
    },
    pick(ev, ms = 520) {
      const i = ev.y * map.w + ev.x;
      view.gems[i] = false; view.bit.mood = 'happy';
      burst(px(ev.x), py(ev.y) - T * 0.2, 14, ['#9ff0ff', '#35d4ff', '#ffffff'], 'star');
      return tween(ms, (p) => { view.bit.z = Math.sin(p * Math.PI) * T * 0.2; }).then(() => { view.bit.z = 0; view.bit.mood = 'ok'; });
    },
    paint(ev, ms = 480) {
      const i = ev.y * map.w + ev.x;
      view.colors[i] = ev.color; view.paintAnim[i] = 0;
      const col = COLORS[ev.color];
      burst(px(ev.x), py(ev.y), 12, [col.hex, col.dark, '#ffffff'], 'dot', 0.8);
      return tween(ms, (p) => { view.paintAnim[i] = p; view.bit.sy = 1 - Math.sin(p * Math.PI) * 0.12; }).then(() => { view.paintAnim[i] = 1; view.bit.sy = 1; });
    },
    say(text, ms = 1000, kind) {
      bubbles.push({ text, age: 0, ms: ms * speed + 400, kind });
      return tween(ms, () => {});
    },
    oops(text = 'Oops!', ms = 800) {
      view.bit.mood = 'oops';
      return api.say(text, ms, 'oops');
    },
    mood(m) { view.bit.mood = m; },
    celebrate() {
      const b = view.bit; b.mood = 'happy'; view.homeOpen = true;
      const cols = ['#ff5d5d', '#ffd23a', '#35d4ff', '#7ee07e', '#ff7bb8', '#9d6bff'];
      for (let k = 0; k < 4; k++) setTimeout(() => burst(px(b.x), py(b.y) - T * 0.3, 26, cols, k % 2 ? 'star' : 'rect', 1.3), k * 220);
      return tween(1500, (p) => { b.z = Math.abs(Math.sin(p * Math.PI * 4)) * T * 0.32; b.sy = 1 + 0.06 * Math.sin(p * Math.PI * 8); })
        .then(() => { b.z = 0; b.sy = 1; });
    },
    destroy() { alive = false; cancelAnimationFrame(raf); cancel(); },
  };
  raf = requestAnimationFrame(frame);
  return api;
}

// A small picture of a map (for test tabs and the level list).
export function mapThumb(level, mapIndex, px = 120) {
  const m = level.parsed[mapIndex];
  const theme = THEMES[level.world.theme] || THEMES.meadow;
  const t = Math.floor(px / Math.max(m.w, m.h));
  const cv = document.createElement('canvas');
  cv.width = m.w * t; cv.height = m.h * t;
  const g = cv.getContext('2d');
  m.cells.forEach((cell, i) => {
    const x = (i % m.w) * t, y = Math.floor(i / m.w) * t;
    if (cell.k === 'void') return;
    g.fillStyle = cell.k === 'rock' ? '#8d98aa' : cell.k === 'tree' ? '#3d9b4a' : cell.k === 'pad' ? '#f2f5fa' : cell.color ? COLORS[cell.color].hex : ((i + Math.floor(i / m.w)) % 2 ? theme.top2 : theme.top);
    g.fillRect(x, y, t, t);
    if (cell.gem) { g.fillStyle = '#35d4ff'; g.fillRect(x + t * 0.3, y + t * 0.3, t * 0.4, t * 0.4); }
    if (cell.home) { g.fillStyle = '#f0543f'; g.fillRect(x + t * 0.2, y + t * 0.2, t * 0.6, t * 0.6); }
  });
  g.fillStyle = '#2f7cf6'; g.beginPath(); g.arc((m.bit.x + 0.5) * t, (m.bit.y + 0.5) * t, t * 0.35, 0, TAU); g.fill();
  return cv;
}
