// The Studio's characters, objects and backdrops, all drawn with canvas paths.
import { drawBit, INK } from '../art/bit.js';
import { drawTree, drawRock, drawHouse, drawGem } from '../play/board.js';

const TAU = Math.PI * 2;
export const BASE = 70; // a sprite at size 100 is about this tall on the 480x360 stage

// face: how the picture follows the sprite's direction.
//   'views' Bit's own front/back/side pictures   'flip' mirror when going left
//   'rotate' turn the whole picture               'none' always upright
export const LIBRARY = {
  bit: { name: 'Bit', ja: 'ビット', face: 'views', moods: true },
  pip: { name: 'Pip', ja: 'ピップ', face: 'flip', moods: true },
  cat: { name: 'Cat', ja: 'ねこ', face: 'flip', moods: true },
  ghost: { name: 'Ghost', ja: 'おばけ', face: 'flip', moods: true },
  fish: { name: 'Fish', ja: 'さかな', face: 'flip' },
  rocket: { name: 'Rocket', ja: 'ロケット', face: 'rotate' },
  ball: { name: 'Ball', ja: 'ボール', face: 'rotate' },
  star: { name: 'Star', ja: 'ほし', face: 'none', moods: true },
  apple: { name: 'Apple', ja: 'りんご', face: 'none' },
  gem: { name: 'Gem', ja: 'ジェム', face: 'none' },
  coin: { name: 'Coin', ja: 'コイン', face: 'none' },
  heart: { name: 'Heart', ja: 'ハート', face: 'none' },
  cloud: { name: 'Cloud', ja: 'くも', face: 'flip' },
  tree: { name: 'Tree', ja: 'き', face: 'none' },
  rock: { name: 'Rock', ja: 'いわ', face: 'none' },
  house: { name: 'House', ja: 'いえ', face: 'none' },
};

export const BACKDROPS = {
  meadow: { en: 'Meadow', ja: 'のはら' }, sky: { en: 'Sky', ja: 'そら' }, beach: { en: 'Beach', ja: 'うみ' },
  night: { en: 'Night', ja: 'よる' }, space: { en: 'Space', ja: 'うちゅう' }, snow: { en: 'Snow', ja: 'ゆき' },
  room: { en: 'Room', ja: 'へや' }, grid: { en: 'Grid', ja: 'マスめ' },
};

function face(c, u, mood, x = 0, y = 0, spread = 11, dark = INK) {
  c.fillStyle = dark; c.strokeStyle = dark; c.lineCap = 'round';
  for (const s of [-1, 1]) {
    const ex = x + s * spread * u, ey = y;
    if (mood === 'happy') { c.lineWidth = 4 * u; c.beginPath(); c.arc(ex, ey + 2 * u, 5 * u, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    else if (mood === 'sad') { c.beginPath(); c.arc(ex, ey, 4.4 * u, 0, TAU); c.fill(); c.lineWidth = 3 * u; c.beginPath(); c.moveTo(ex - 6 * u, ey - 9 * u + s * -2 * u); c.lineTo(ex + 6 * u, ey - 9 * u + s * 2 * u); c.stroke(); }
    else if (mood === 'surprised') { c.beginPath(); c.arc(ex, ey, 6 * u, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - 2 * u, ey - 2 * u, 2 * u, 0, TAU); c.fill(); c.fillStyle = dark; }
    else { c.beginPath(); c.ellipse(ex, ey, 4.4 * u, 5.6 * u, 0, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - 1.5 * u, ey - 2 * u, 1.7 * u, 0, TAU); c.fill(); c.fillStyle = dark; }
  }
  c.lineWidth = 3.4 * u; c.beginPath();
  if (mood === 'sad') c.arc(x, y + 16 * u, 6 * u, Math.PI * 1.15, Math.PI * 1.85);
  else if (mood === 'surprised') { c.ellipse(x, y + 12 * u, 4 * u, 5 * u, 0, 0, TAU); c.fill(); return; }
  else c.arc(x, y + 6 * u, 7 * u, Math.PI * 0.15, Math.PI * 0.85);
  c.stroke();
}

// Draw a sprite centred on (0,0). s = pixel height. dir in degrees (0 up, 90 right).
export function drawSprite(c, kind, s, { dir = 90, mood = 'normal', t = 0 } = {}) {
  const u = s / 100;
  c.lineJoin = 'round'; c.lineCap = 'round';
  switch (kind) {
    case 'bit': {
      const d = dir > 315 || dir < 45 ? 0 : dir < 135 ? 1 : dir < 225 ? 2 : 3;
      c.save(); c.translate(0, 46 * u); drawBit(c, s * 1.28, d, mood === 'normal' ? 'ok' : mood === 'sad' ? 'oops' : mood === 'surprised' ? 'ok' : mood, t); c.restore(); return;
    }
    case 'pip': {
      const bob = Math.sin(t / 300) * 2 * u;
      c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.ellipse(0, 44 * u, 30 * u, 7 * u, 0, 0, TAU); c.fill();
      c.translate(0, bob);
      c.fillStyle = '#ff8fb8'; c.strokeStyle = '#c94a7c'; c.lineWidth = 4.5 * u;
      c.beginPath(); c.ellipse(0, 4 * u, 38 * u, 40 * u, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#ffb3d0'; c.beginPath(); c.ellipse(-14 * u, -18 * u, 12 * u, 7 * u, -0.5, 0, TAU); c.fill();
      c.fillStyle = '#ff6fa3'; c.beginPath(); c.moveTo(-10 * u, -34 * u); c.quadraticCurveTo(0, -56 * u, 8 * u, -34 * u); c.fill(); c.stroke();
      face(c, u, mood, 0, -2 * u, 13);
      c.fillStyle = 'rgba(255,90,140,.5)'; c.beginPath(); c.arc(-24 * u, 10 * u, 5 * u, 0, TAU); c.arc(24 * u, 10 * u, 5 * u, 0, TAU); c.fill();
      return;
    }
    case 'cat': {
      c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.ellipse(0, 44 * u, 30 * u, 7 * u, 0, 0, TAU); c.fill();
      const fur = '#ffb35c', dark = '#a85b12';
      c.strokeStyle = dark; c.lineWidth = 4.5 * u; c.fillStyle = fur;
      c.beginPath(); c.moveTo(26 * u, 30 * u); c.quadraticCurveTo(52 * u, 18 * u, 40 * u, -8 * u); c.stroke();
      c.beginPath(); c.ellipse(0, 22 * u, 28 * u, 22 * u, 0, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-30 * u, -20 * u); c.lineTo(-26 * u, -50 * u); c.lineTo(-8 * u, -34 * u); c.closePath(); c.moveTo(30 * u, -20 * u); c.lineTo(26 * u, -50 * u); c.lineTo(8 * u, -34 * u); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(0, -16 * u, 32 * u, 26 * u, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#ffe0bd'; c.beginPath(); c.ellipse(0, -6 * u, 14 * u, 10 * u, 0, 0, TAU); c.fill();
      face(c, u, mood, 0, -20 * u, 12, '#4a2a10');
      c.fillStyle = '#ff7b9c'; c.beginPath(); c.moveTo(-4 * u, -12 * u); c.lineTo(4 * u, -12 * u); c.lineTo(0, -8 * u); c.fill();
      return;
    }
    case 'ghost': {
      const bob = Math.sin(t / 380) * 4 * u;
      c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(0, 46 * u, 26 * u, 6 * u, 0, 0, TAU); c.fill();
      c.translate(0, bob - 4 * u);
      c.beginPath(); c.moveTo(-34 * u, 34 * u); c.lineTo(-34 * u, -6 * u); c.arc(0, -6 * u, 34 * u, Math.PI, 0); c.lineTo(34 * u, 34 * u);
      for (let k = 0; k < 4; k++) { const x1 = 34 - (k + 0.5) * 17, x2 = 34 - (k + 1) * 17; c.quadraticCurveTo(x1 * u, (k % 2 ? 26 : 44) * u, x2 * u, 34 * u); }
      c.closePath(); c.fillStyle = '#f4f7ff'; c.fill(); c.strokeStyle = '#5b6aa0'; c.lineWidth = 4.5 * u; c.stroke();
      c.fillStyle = 'rgba(150,170,230,.25)'; c.beginPath(); c.ellipse(18 * u, 8 * u, 10 * u, 24 * u, 0, 0, TAU); c.fill();
      face(c, u, mood, 0, -8 * u, 12, '#2a2f55');
      return;
    }
    case 'fish': {
      c.fillStyle = '#ff9a3c'; c.strokeStyle = '#b3520b'; c.lineWidth = 4.5 * u;
      c.beginPath(); c.moveTo(-30 * u, 0); c.lineTo(-52 * u, -22 * u); c.lineTo(-50 * u, 22 * u); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(4 * u, 0, 38 * u, 28 * u, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#ffd08a'; c.beginPath(); c.ellipse(8 * u, 10 * u, 22 * u, 10 * u, 0, 0, TAU); c.fill();
      c.strokeStyle = '#b3520b'; c.lineWidth = 3 * u; c.beginPath(); c.arc(-6 * u, 0, 14 * u, -0.9, 0.9); c.stroke();
      c.fillStyle = INK; c.beginPath(); c.arc(24 * u, -6 * u, 5 * u, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(22.5 * u, -8 * u, 1.8 * u, 0, TAU); c.fill();
      return;
    }
    case 'rocket': {
      const fl = 0.8 + Math.sin(t / 60) * 0.2;
      c.fillStyle = '#ffb02e'; c.beginPath(); c.moveTo(-10 * u, 34 * u); c.quadraticCurveTo(0, (34 + 26 * fl) * u, 10 * u, 34 * u); c.fill();
      c.fillStyle = '#ff5d5d'; c.strokeStyle = INK; c.lineWidth = 4 * u;
      c.beginPath(); c.moveTo(-14 * u, 14 * u); c.lineTo(-30 * u, 36 * u); c.lineTo(-12 * u, 34 * u); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(14 * u, 14 * u); c.lineTo(30 * u, 36 * u); c.lineTo(12 * u, 34 * u); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#f2f5fb'; c.beginPath(); c.moveTo(0, -46 * u); c.quadraticCurveTo(22 * u, -24 * u, 16 * u, 34 * u); c.lineTo(-16 * u, 34 * u); c.quadraticCurveTo(-22 * u, -24 * u, 0, -46 * u); c.fill(); c.stroke();
      c.fillStyle = '#ff5d5d'; c.beginPath(); c.moveTo(0, -46 * u); c.quadraticCurveTo(13 * u, -34 * u, 16 * u, -24 * u); c.lineTo(-16 * u, -24 * u); c.quadraticCurveTo(-13 * u, -34 * u, 0, -46 * u); c.fill(); c.stroke();
      c.fillStyle = '#8fdcff'; c.beginPath(); c.arc(0, -4 * u, 9 * u, 0, TAU); c.fill(); c.stroke();
      return;
    }
    case 'ball': {
      c.fillStyle = '#ff5d5d'; c.strokeStyle = '#8f1d18'; c.lineWidth = 4.5 * u;
      c.beginPath(); c.arc(0, 0, 32 * u, 0, TAU); c.fill(); c.stroke();
      c.save(); c.clip(); c.fillStyle = '#fff'; c.fillRect(-40 * u, -6 * u, 80 * u, 12 * u); c.restore();
      c.beginPath(); c.arc(0, 0, 32 * u, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-12 * u, -16 * u, 9 * u, 5 * u, -0.6, 0, TAU); c.fill();
      return;
    }
    case 'star': {
      c.save(); c.rotate(Math.sin(t / 500) * 0.08);
      c.beginPath(); for (let i = 0; i < 10; i++) { const r = (i % 2 ? 17 : 40) * u, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath();
      c.fillStyle = '#ffd531'; c.fill(); c.strokeStyle = '#c98400'; c.lineWidth = 4.5 * u; c.stroke();
      face(c, u, mood, 0, 2 * u, 8, '#7a4a00');
      c.restore(); return;
    }
    case 'apple': {
      c.fillStyle = '#e8352f'; c.strokeStyle = '#8f1d18'; c.lineWidth = 4.5 * u;
      c.beginPath(); c.moveTo(0, -20 * u); c.bezierCurveTo(-24 * u, -34 * u, -44 * u, -8 * u, -30 * u, 18 * u); c.bezierCurveTo(-18 * u, 38 * u, -4 * u, 34 * u, 0, 30 * u);
      c.bezierCurveTo(4 * u, 34 * u, 18 * u, 38 * u, 30 * u, 18 * u); c.bezierCurveTo(44 * u, -8 * u, 24 * u, -34 * u, 0, -20 * u); c.fill(); c.stroke();
      c.strokeStyle = '#6b4a22'; c.lineWidth = 4 * u; c.beginPath(); c.moveTo(0, -20 * u); c.quadraticCurveTo(2 * u, -34 * u, 8 * u, -40 * u); c.stroke();
      c.fillStyle = '#4cb84f'; c.strokeStyle = '#22692e'; c.lineWidth = 3 * u; c.beginPath(); c.ellipse(14 * u, -32 * u, 10 * u, 5 * u, -0.5, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-16 * u, -8 * u, 6 * u, 10 * u, 0.4, 0, TAU); c.fill();
      return;
    }
    case 'coin': {
      const w = Math.abs(Math.cos(t / 400)) * 0.5 + 0.5;
      c.fillStyle = '#ffcf33'; c.strokeStyle = '#b07a00'; c.lineWidth = 4.5 * u;
      c.beginPath(); c.ellipse(0, 0, 28 * u * w, 28 * u, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#ffe680'; c.beginPath(); c.ellipse(0, 0, 16 * u * w, 16 * u, 0, 0, TAU); c.fill();
      return;
    }
    case 'heart': {
      const p = 1 + Math.sin(t / 250) * 0.05;
      c.scale(p, p);
      c.beginPath(); c.moveTo(0, 30 * u); c.bezierCurveTo(-46 * u, 2 * u, -32 * u, -40 * u, 0, -16 * u); c.bezierCurveTo(32 * u, -40 * u, 46 * u, 2 * u, 0, 30 * u);
      c.fillStyle = '#ff4f8b'; c.fill(); c.strokeStyle = '#a3164d'; c.lineWidth = 4.5 * u; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-16 * u, -14 * u, 7 * u, 4 * u, -0.6, 0, TAU); c.fill();
      return;
    }
    case 'cloud': {
      c.fillStyle = '#ffffff'; c.strokeStyle = '#8fb3d9'; c.lineWidth = 4 * u;
      const blob = () => { c.beginPath(); [[-22, 6, 18], [0, -6, 24], [24, 4, 18], [6, 12, 16]].forEach(([x, y, r]) => { c.moveTo((x + r) * u, y * u); c.arc(x * u, y * u, r * u, 0, TAU); }); };
      blob(); c.stroke(); blob(); c.fill();
      return;
    }
    case 'gem': drawGem(c, s * 1.5, t, 0); return;
    case 'tree': c.save(); c.translate(0, 18 * u); drawTree(c, s * 1.15, 'oak'); c.restore(); return;
    case 'rock': c.save(); c.translate(0, 8 * u); drawRock(c, s * 1.1); c.restore(); return;
    case 'house': c.save(); c.translate(0, 12 * u); drawHouse(c, s * 1.1, false); c.restore(); return;
  }
}

// ---- backdrops (480 x 360) ----
function rnd(seed) { let x = seed; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); }
function clouds(c, R, n, a = 0.85) {
  c.fillStyle = `rgba(255,255,255,${a})`;
  for (let i = 0; i < n; i++) { const x = R() * 480, y = 20 + R() * 120, s = 14 + R() * 16; c.beginPath(); c.arc(x, y, s, 0, TAU); c.arc(x + s, y + 4, s * 0.8, 0, TAU); c.arc(x - s, y + 5, s * 0.7, 0, TAU); c.fill(); }
}
export function drawBackdrop(c, name) {
  const R = rnd(7);
  const sky = (a, b) => { const g = c.createLinearGradient(0, 0, 0, 360); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, 480, 360); };
  switch (name) {
    case 'sky': sky('#4fb9ff', '#d6f3ff'); clouds(c, R, 7); break;
    case 'meadow':
      sky('#5cc2ff', '#dff6ff'); clouds(c, R, 4);
      c.fillStyle = '#8fd65a'; c.beginPath(); c.moveTo(0, 250); c.quadraticCurveTo(120, 200, 260, 240); c.quadraticCurveTo(380, 270, 480, 225); c.lineTo(480, 360); c.lineTo(0, 360); c.fill();
      c.fillStyle = '#74c346'; c.beginPath(); c.moveTo(0, 300); c.quadraticCurveTo(200, 262, 480, 296); c.lineTo(480, 360); c.lineTo(0, 360); c.fill();
      for (let i = 0; i < 26; i++) { c.fillStyle = ['#ffffff', '#ffd6ec', '#fff3a0'][i % 3]; c.beginPath(); c.arc(R() * 480, 270 + R() * 85, 2.5, 0, TAU); c.fill(); }
      break;
    case 'beach':
      sky('#3eb6ff', '#fff0d0'); clouds(c, R, 3);
      c.fillStyle = '#2f9be8'; c.fillRect(0, 200, 480, 70);
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 3; for (let i = 0; i < 6; i++) { const y = 212 + i * 9; c.beginPath(); for (let x = 0; x <= 480; x += 20) c.lineTo(x, y + Math.sin(x / 30 + i) * 2); c.stroke(); }
      c.fillStyle = '#ffe1a0'; c.beginPath(); c.moveTo(0, 270); c.quadraticCurveTo(240, 250, 480, 272); c.lineTo(480, 360); c.lineTo(0, 360); c.fill();
      c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(410, 60, 26, 0, TAU); c.fill();
      break;
    case 'night':
      sky('#141b45', '#3a3f86');
      for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(255,255,255,${0.4 + R() * 0.6})`; c.fillRect(R() * 480, R() * 260, 2, 2); }
      c.fillStyle = '#fff6c9'; c.beginPath(); c.arc(390, 70, 30, 0, TAU); c.fill(); c.fillStyle = '#141b45'; c.beginPath(); c.arc(404, 60, 26, 0, TAU); c.fill();
      c.fillStyle = '#1f2a5c'; c.beginPath(); c.moveTo(0, 290); c.quadraticCurveTo(150, 250, 300, 285); c.quadraticCurveTo(400, 305, 480, 275); c.lineTo(480, 360); c.lineTo(0, 360); c.fill();
      break;
    case 'space':
      sky('#0d0a2b', '#2a1a5e');
      for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + R() * 0.7})`; const s = R() < 0.1 ? 3 : 1.5; c.fillRect(R() * 480, R() * 360, s, s); }
      c.fillStyle = '#ff9a5c'; c.beginPath(); c.arc(90, 290, 46, 0, TAU); c.fill(); c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.arc(104, 300, 46, 0, TAU); c.fill();
      c.strokeStyle = '#ffd9a8'; c.lineWidth = 5; c.beginPath(); c.ellipse(90, 290, 74, 16, -0.3, 0, TAU); c.stroke();
      c.fillStyle = '#8fd0ff'; c.beginPath(); c.arc(400, 70, 18, 0, TAU); c.fill();
      break;
    case 'snow':
      sky('#8fc4ff', '#eef6ff'); clouds(c, R, 3, 0.7);
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(0, 260); c.quadraticCurveTo(160, 220, 300, 255); c.quadraticCurveTo(400, 278, 480, 245); c.lineTo(480, 360); c.lineTo(0, 360); c.fill();
      c.fillStyle = '#e1eefb'; c.beginPath(); c.moveTo(0, 310); c.quadraticCurveTo(240, 285, 480, 312); c.lineTo(480, 360); c.lineTo(0, 360); c.fill();
      for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(R() * 480, R() * 250, 2 + R() * 2, 0, TAU); c.fill(); }
      break;
    case 'room':
      c.fillStyle = '#ffe9c7'; c.fillRect(0, 0, 480, 260);
      c.fillStyle = 'rgba(255,255,255,.35)'; for (let x = 0; x < 480; x += 40) c.fillRect(x, 0, 18, 260);
      c.fillStyle = '#9fdcff'; c.fillRect(300, 50, 120, 100); c.strokeStyle = '#a0662b'; c.lineWidth = 8; c.strokeRect(300, 50, 120, 100); c.beginPath(); c.moveTo(360, 50); c.lineTo(360, 150); c.moveTo(300, 100); c.lineTo(420, 100); c.stroke();
      c.fillStyle = '#c98a4e'; c.fillRect(0, 260, 480, 100); c.fillStyle = '#b5763c'; for (let x = 0; x < 480; x += 60) c.fillRect(x, 260, 3, 100);
      c.fillStyle = '#a0662b'; c.fillRect(0, 256, 480, 8);
      break;
    case 'grid':
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, 480, 360);
      c.strokeStyle = '#e2e8f4'; c.lineWidth = 1;
      for (let x = 0; x <= 480; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 360); c.stroke(); }
      for (let y = 0; y <= 360; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(480, y); c.stroke(); }
      c.fillStyle = '#9aa7c2'; c.font = '600 11px Fredoka, sans-serif';
      for (let x = 0; x <= 480; x += 80) c.fillText(String(x), x + 3, 354);
      for (let y = 80; y <= 360; y += 80) c.fillText(String(y), 3, 360 - y + 12);
      break;
  }
}

// A small picture of a sprite, for the tray and the library.
export function spriteThumb(kind, px = 64, opts = {}) {
  const cv = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = px * dpr; cv.height = px * dpr; cv.style.width = px + 'px'; cv.style.height = px + 'px';
  const c = cv.getContext('2d'); c.scale(dpr, dpr); c.translate(px / 2, px / 2);
  if (opts.hue) c.filter = `hue-rotate(${opts.hue}deg)`;
  drawSprite(c, kind, px * 0.78, { dir: opts.dir ?? 180, mood: opts.mood || 'normal', t: 0 });
  return cv;
}
export function backdropThumb(name, w = 96) {
  const cv = document.createElement('canvas');
  cv.width = 480; cv.height = 360; cv.style.width = w + 'px'; cv.style.height = Math.round(w * 0.75) + 'px';
  drawBackdrop(cv.getContext('2d'), name);
  return cv;
}
