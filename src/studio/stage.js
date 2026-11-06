// Draws a Studio VM on a canvas: backdrop, sprites, speech bubbles.
import { W, H } from './vm.js';
import { drawSprite, drawBackdrop, LIBRARY, BASE } from './art.js';
import { INK } from '../art/bit.js';

export function createStageView(canvas) {
  const c = canvas.getContext('2d');
  let cw = 480, ch = 360, dpr = 1, k = 1;
  let bgName = null, bgLayer = null;

  function resize() {
    const box = canvas.parentElement;
    cw = box.offsetWidth; ch = box.offsetHeight;
    const r = box.getBoundingClientRect();
    const scale = r.width / cw || 1;
    dpr = Math.min(2.5, Math.max(0.6, scale * (window.devicePixelRatio || 1)));
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    k = cw / W;
    bgName = null;
  }
  function backdrop(name) {
    if (bgName === name && bgLayer) return bgLayer;
    bgLayer = document.createElement('canvas');
    bgLayer.width = canvas.width; bgLayer.height = canvas.height;
    const g = bgLayer.getContext('2d');
    g.scale(canvas.width / W, canvas.height / H);
    drawBackdrop(g, name);
    bgName = name;
    return bgLayer;
  }

  function bubble(text, x, y) {
    c.save();
    c.font = '600 16px Fredoka, "M PLUS Rounded 1c", sans-serif';
    const words = String(text).split(' '); const lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > 170 && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line);
    const w = Math.max(40, ...lines.map((l) => c.measureText(l).width)) + 22, hh = lines.length * 19 + 14;
    const bx = Math.max(4, Math.min(W - w - 4, x - w / 2)), by = Math.max(4, y - hh - 12);
    c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 2.5;
    c.beginPath(); c.roundRect(bx, by, w, hh, 12); c.fill(); c.stroke();
    const tx = Math.max(bx + 14, Math.min(bx + w - 14, x));
    c.beginPath(); c.moveTo(tx - 7, by + hh - 1.5); c.lineTo(tx, by + hh + 10); c.lineTo(tx + 7, by + hh - 1.5); c.fill();
    c.beginPath(); c.moveTo(tx - 7, by + hh); c.lineTo(tx, by + hh + 10); c.lineTo(tx + 7, by + hh); c.stroke();
    c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'top';
    lines.forEach((l, i) => c.fillText(l, bx + w / 2, by + 8 + i * 19));
    c.restore();
  }

  function draw(vm, { bg, selected, editing, now = performance.now() } = {}) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(backdrop(bg || 'sky'), 0, 0);
    c.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
    for (const i of vm.insts) {
      if (!i.visible && !(editing && !i.isClone)) continue;
      const sx = i.x, sy = H - i.y - (i.hop || 0);
      const px = BASE * i.size / 100;
      const lib = LIBRARY[i.kind] || {};
      c.save();
      c.translate(sx, sy);
      if (!i.visible) c.globalAlpha = 0.35;
      if (i.hue) c.filter = `hue-rotate(${i.hue}deg)`;
      if (lib.face === 'rotate') c.rotate(i.dir * Math.PI / 180);
      else if (lib.face === 'flip' && i.dir > 180 && i.dir < 360) c.scale(-1, 1);
      drawSprite(c, i.kind, px, { dir: i.dir, mood: i.mood, t: now + i.uid * 137 });
      c.restore();
      if (editing && selected && i.base === selected && !i.isClone) {
        c.save(); c.strokeStyle = '#ffb300'; c.lineWidth = 3; c.setLineDash([7, 5]);
        c.beginPath(); c.arc(sx, sy, px * 0.62, 0, Math.PI * 2); c.stroke(); c.restore();
      }
    }
    for (const i of vm.insts) if (i.say && i.visible) bubble(i.say.text, i.x, H - i.y - (i.hop || 0) - BASE * i.size / 100 * 0.5);
  }

  // client coordinates -> stage coordinates (480 x 360, y up)
  function toStage(cx, cy) {
    const r = canvas.getBoundingClientRect();
    return { x: (cx - r.left) / r.width * W, y: H - (cy - r.top) / r.height * H };
  }
  return { resize, draw, toStage };
}
