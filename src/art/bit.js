// Bit, drawn with canvas paths (no image files). Three views: front (facing down),
// back (facing up) and side (facing right; mirrored for left). Moods: ok, happy, oops.
export const INK = '#22305c';
const WHITE = '#f6f9ff', BLUE = '#2f7cf6', BLUE_D = '#1a4fb4', SCREEN = '#1b2a57', EYE = '#72f7ff', BULB = '#ffd23a';

function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

// Draws Bit with feet at (0, 0). size = tile size; Bit is about 0.72 of it tall.
// dir: 0 up, 1 right, 2 down, 3 left. t: time in ms (blink, antenna bob).
export function drawBit(c, size, dir, mood = 'ok', t = 0, opts = {}) {
  const u = size / 100;
  const view = dir === 0 ? 'back' : dir === 2 ? 'front' : 'side';
  c.save();
  if (dir === 3) c.scale(-1, 1);
  c.lineJoin = 'round'; c.lineCap = 'round';
  const lw = 4.4 * u;
  const blink = mood === 'ok' && (t % 3400) < 130;
  const bob = Math.sin(t / 260) * 1.6 * u;
  c.translate(0, -32 * u);

  // antenna
  const ax = view === 'side' ? -4 * u : 0;
  c.strokeStyle = INK; c.lineWidth = 4 * u;
  c.beginPath(); c.moveTo(ax, -28 * u); c.lineTo(ax + bob * 0.6, -44 * u); c.stroke();
  c.fillStyle = mood === 'oops' ? '#ff8a3d' : BULB;
  c.beginPath(); c.arc(ax + bob * 0.6, -48 * u, 6.5 * u, 0, Math.PI * 2); c.fill();
  c.lineWidth = 3.4 * u; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(ax + bob * 0.6 - 2 * u, -50 * u, 2 * u, 0, Math.PI * 2); c.fill();

  // feet
  c.fillStyle = '#2b3a6b';
  if (view === 'side') { rr(c, -16 * u, 22 * u, 34 * u, 11 * u, 5 * u); c.fill(); }
  else { rr(c, -24 * u, 22 * u, 17 * u, 11 * u, 5 * u); c.fill(); rr(c, 7 * u, 22 * u, 17 * u, 11 * u, 5 * u); c.fill(); }

  // ear bolts (behind body edges on front/back, centred on side)
  const ear = (x) => { c.fillStyle = BLUE; c.beginPath(); c.arc(x, -6 * u, 6.5 * u, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 3.6 * u; c.stroke(); };
  if (view !== 'side') { ear(-31 * u); ear(31 * u); }

  // body
  const bw = view === 'side' ? 50 : 62, bx = -bw / 2;
  rr(c, bx * u, -30 * u, bw * u, 56 * u, 19 * u);
  c.fillStyle = WHITE; c.fill();
  c.save(); c.clip();
  c.fillStyle = BLUE; c.fillRect(bx * u, 9 * u, bw * u, 20 * u);
  c.fillStyle = 'rgba(255,255,255,.55)'; rr(c, (bx + 6) * u, -26 * u, (bw - 22) * u, 8 * u, 4 * u); c.fill();
  c.fillStyle = 'rgba(34,48,92,.08)'; c.fillRect((bx + bw - 8) * u, -30 * u, 8 * u, 60 * u);
  c.restore();
  rr(c, bx * u, -30 * u, bw * u, 56 * u, 19 * u);
  c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
  if (view === 'side') { c.fillStyle = BLUE; c.beginPath(); c.arc(-15 * u, -4 * u, 5 * u, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 3 * u; c.stroke(); }

  // belly light
  c.fillStyle = BULB;
  c.beginPath(); c.arc(view === 'side' ? 10 * u : 0, 18 * u, 4.2 * u, 0, Math.PI * 2); c.fill();
  c.strokeStyle = BLUE_D; c.lineWidth = 2 * u; c.stroke();

  if (view === 'back') {
    c.fillStyle = '#dfe7f6'; rr(c, -17 * u, -21 * u, 34 * u, 23 * u, 7 * u); c.fill();
    c.strokeStyle = '#9fb0d2'; c.lineWidth = 3 * u;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-10 * u, (-15 + i * 6) * u); c.lineTo(10 * u, (-15 + i * 6) * u); c.stroke(); }
  } else {
    // face screen
    const sx = view === 'side' ? 1 : -23, sw = view === 'side' ? 22 : 46;
    c.fillStyle = SCREEN; rr(c, sx * u, -23 * u, sw * u, 27 * u, 9 * u); c.fill();
    const eyes = view === 'side' ? [13] : [-11, 11];
    c.fillStyle = mood === 'oops' ? '#ffd27a' : EYE; c.strokeStyle = c.fillStyle;
    for (const ex of eyes) {
      if (mood === 'happy') {
        c.lineWidth = 4 * u; c.beginPath(); c.arc(ex * u, -7 * u, 5 * u, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      } else if (mood === 'oops') {
        c.lineWidth = 3.6 * u; c.beginPath();
        c.moveTo((ex - 4) * u, -14 * u); c.lineTo((ex + 4) * u, -6 * u); c.moveTo((ex + 4) * u, -14 * u); c.lineTo((ex - 4) * u, -6 * u); c.stroke();
      } else {
        const h = blink ? 2 : 13;
        rr(c, (ex - 4.5) * u, (-10 - h / 2) * u, 9 * u, h * u, 4 * u); c.fill();
        if (!blink) { c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect((ex - 2.5) * u, -14 * u, 2.6 * u, 3 * u); c.fillStyle = EYE; }
      }
    }
    if (mood === 'happy') {
      c.strokeStyle = EYE; c.lineWidth = 3 * u;
      c.beginPath(); c.arc((view === 'side' ? 13 : 0) * u, -4 * u, 4.5 * u, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    }
    if (view === 'front' && !opts.noCheeks) {
      c.fillStyle = 'rgba(255,128,180,.55)';
      c.beginPath(); c.arc(-22 * u, 6 * u, 4 * u, 0, Math.PI * 2); c.arc(22 * u, 6 * u, 4 * u, 0, Math.PI * 2); c.fill();
    }
  }
  c.restore();
}

// A <canvas> with Bit on it, for menus and dialogs. Animated (blinks, bobbing antenna).
export function bitPortrait(px, { dir = 2, mood = 'ok', animate = true } = {}) {
  const cv = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = px * dpr; cv.height = px * dpr; cv.style.width = px + 'px'; cv.style.height = px + 'px';
  cv.className = 'bit-portrait';
  const c = cv.getContext('2d');
  const state = { dir, mood };
  const draw = (t) => {
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, px, px);
    c.translate(px / 2, px * 0.93);
    c.fillStyle = 'rgba(34,48,92,.16)'; c.beginPath(); c.ellipse(0, 0, px * 0.26, px * 0.06, 0, 0, Math.PI * 2); c.fill();
    drawBit(c, px * 1.15, state.dir, state.mood, t);
    if (animate && cv.isConnected) requestAnimationFrame(draw);
  };
  requestAnimationFrame(function first(t) { draw(t); if (animate && !cv.isConnected) requestAnimationFrame(first); });
  cv.set = (o) => Object.assign(state, o);
  return cv;
}
