/* Word Bot renderer: draws the stage on a canvas and animates events.
 * The renderer keeps its own "view" state (what is on screen right now); the logic in core.js runs ahead
 * of it and the runner feeds the resulting events here one at a time. All animation methods return promises
 * so the runner can simply `await` them; cancel() rejects pending ones (used by Reset).
 */
(function (root) {
  'use strict';
  const WB = (root.WB = root.WB || {});
  const TAU = Math.PI * 2;
  const CW = 640, CH = 480;
  const CANCEL = { cancelled: true };

  const THEMES = {
    park: { bg: ['#bfe8ff', '#e6f7d4'], frame: '#5c9a45', a: '#a5e07f', b: '#97d672', wall: '#2f8f55', wallHi: '#4cb872', hole: '#6b4a34', holeKind: 'pit' },
    beach: { bg: ['#aee3ff', '#fdf1c9'], frame: '#c9a85a', a: '#f8e6ae', b: '#f1d996', wall: '#8b8574', wallHi: '#aaa493', hole: '#3fb0ee', holeKind: 'water' },
    roof: { bg: ['#27335e', '#3d4d85'], frame: '#8591b3', a: '#d3dbec', b: '#c4cee3', wall: '#5e6c92', wallHi: '#7d8bb2', hole: '#161b33', holeKind: 'pit' },
  };

  const lerp = (a, b, p) => a + (b - a) * p;
  const clamp01 = (p) => Math.max(0, Math.min(1, p));

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  WB.createRenderer = function (canvas) {
    const c = canvas.getContext('2d');
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    canvas.width = CW * dpr; canvas.height = CH * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);

    let level = null, theme = THEMES.park, view = null;
    let T = 64, OX = 0, OY = 0;
    let speed = 1;
    const jobs = new Set();
    let bubbles = [];
    let parts = [];
    let celebrating = false;
    let lastNow = performance.now();

    // ---- animation engine ---------------------------------------------------
    function tween(ms, fn) {
      return new Promise((resolve, reject) => {
        jobs.add({ t0: performance.now(), ms: Math.max(1, ms * speed), fn: fn, resolve: resolve, reject: reject });
      });
    }
    function cancel() {
      const old = Array.from(jobs);
      jobs.clear();
      old.forEach((j) => j.reject(CANCEL));
      bubbles = []; parts = []; celebrating = false;
    }

    // ---- view state ---------------------------------------------------------
    function reset(lv) {
      level = lv || level;
      theme = THEMES[level.theme] || THEMES.park;
      const st = WB.core.newState(level);
      const cols = st.cols, rows = st.rows;
      T = Math.floor(Math.min((CW - 56) / cols, (CH - 56) / rows, 92));
      OX = Math.round((CW - T * cols) / 2);
      OY = Math.round((CH - T * rows) / 2) + 6;
      view = {
        st: st,
        bit: { x: st.bit.x, y: st.bit.y, dir: st.bit.dir, z: 0, sx: 1, sy: 1, rot: 0, mood: 'ok' },
        coinsGot: 0,
        coinGot: st.coins.map(() => false),
        keyGot: false,
        doorOpen: st.doors.map(() => 0),
        friendHappy: false,
        friendHmm: 0,
      };
      cancel();
    }

    function awake() {
      return view.coinsGot === view.st.total && (!view.st.friend || view.friendHappy);
    }
    const px = (tx) => OX + (tx + 0.5) * T;
    const py = (ty) => OY + (ty + 0.5) * T;

    // ---- drawing ------------------------------------------------------------
    function drawBackground(time) {
      const g = c.createLinearGradient(0, 0, 0, CH);
      g.addColorStop(0, theme.bg[0]); g.addColorStop(1, theme.bg[1]);
      c.fillStyle = g; c.fillRect(0, 0, CW, CH);
      if (level.theme === 'roof') {
        c.fillStyle = 'rgba(255,255,255,.7)';
        for (let i = 0; i < 24; i++) {
          const sx = (i * 97) % CW, sy = (i * 53) % 150, tw = 1 + ((time / 500 + i) % 3 < 0.3 ? 1 : 0);
          c.fillRect(sx, sy, tw, tw);
        }
      }
    }

    function drawBoard(time) {
      const st = view.st;
      // frame
      c.fillStyle = theme.frame;
      rr(c, OX - 10, OY - 10, T * st.cols + 20, T * st.rows + 20, 18); c.fill();
      c.save();
      rr(c, OX, OY, T * st.cols, T * st.rows, 10); c.clip();
      for (let y = 0; y < st.rows; y++) {
        for (let x = 0; x < st.cols; x++) {
          const tx = OX + x * T, ty = OY + y * T;
          const tile = st.tiles[y][x];
          c.fillStyle = (x + y) % 2 ? theme.b : theme.a;
          c.fillRect(tx, ty, T, T);
          if (tile === 'hole') drawHole(tx, ty, time);
          else if (tile === 'wall') drawWall(tx, ty);
        }
      }
      c.restore();
    }

    function drawHole(tx, ty, time) {
      if (theme.holeKind === 'water') {
        c.fillStyle = theme.hole; c.fillRect(tx, ty, T, T);
        c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = 3; c.lineCap = 'round';
        for (let i = 0; i < 2; i++) {
          const yy = ty + T * (0.35 + i * 0.3);
          c.beginPath();
          for (let k = 0; k <= 8; k++) {
            const xx = tx + T * 0.12 + (T * 0.76 * k) / 8;
            const wy = yy + Math.sin(time / 350 + k * 0.9 + i * 2 + tx) * 3;
            if (k === 0) c.moveTo(xx, wy); else c.lineTo(xx, wy);
          }
          c.stroke();
        }
      } else {
        c.fillStyle = theme.hole; c.fillRect(tx, ty, T, T);
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(tx, ty, T, T * 0.18);
      }
    }

    function drawWall(tx, ty) {
      const m = T * 0.06;
      c.fillStyle = theme.wall; rr(c, tx + m, ty + m, T - 2 * m, T - 2 * m, T * 0.16); c.fill();
      c.fillStyle = theme.wallHi; rr(c, tx + m * 2.2, ty + m * 2.2, T - 4.4 * m, (T - 4.4 * m) * 0.42, T * 0.1); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; rr(c, tx + m, ty + m, T - 2 * m, T - 2 * m, T * 0.16); c.stroke();
    }

    function drawStar(time) {
      const s = view.st.star; if (!s) return;
      const cx = px(s.x), cy = py(s.y), on = awake();
      const wob = on ? Math.sin(time / 260) * 0.12 : 0, sc = on ? 1 + Math.sin(time / 330) * 0.06 : 0.92;
      if (on) {
        const g = c.createRadialGradient(cx, cy, 2, cx, cy, T * 0.62);
        g.addColorStop(0, 'rgba(255,240,150,.85)'); g.addColorStop(1, 'rgba(255,240,150,0)');
        c.fillStyle = g; c.beginPath(); c.arc(cx, cy, T * 0.62, 0, TAU); c.fill();
      }
      c.save(); c.translate(cx, cy); c.rotate(wob); c.scale(sc, sc);
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = (i % 2 ? 0.17 : 0.4) * T, a = -Math.PI / 2 + (i * Math.PI) / 5;
        c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.closePath();
      c.fillStyle = on ? '#ffd531' : '#a9afc4'; c.fill();
      c.lineWidth = 3; c.lineJoin = 'round'; c.strokeStyle = on ? '#e19a00' : '#7c839c'; c.stroke();
      c.restore();
      if (!on) {
        c.font = Math.round(T * 0.3) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('🔒', cx + T * 0.26, cy + T * 0.26);
      }
    }

    function drawCoin(x, y, time, pop) {
      const cx = px(x), cy = py(y) - Math.abs(Math.sin(time / 400 + x)) * 3 - (pop || 0) * T * 0.5;
      const r = T * 0.22, w = Math.abs(Math.cos(time / 500 + x * 2)) * 0.5 + 0.5;
      c.save(); c.translate(cx, cy); c.globalAlpha = 1 - (pop || 0);
      c.fillStyle = '#ffcf33'; c.strokeStyle = '#d99a00'; c.lineWidth = 3;
      c.beginPath(); c.ellipse(0, 0, r * w, r, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#ffe680'; c.beginPath(); c.ellipse(0, 0, r * w * 0.55, r * 0.55, 0, 0, TAU); c.fill();
      c.restore();
    }

    function drawKey(x, y, time, pop) {
      const cx = px(x), cy = py(y) - Math.sin(time / 380) * 3 - (pop || 0) * T * 0.5, s = T / 64;
      c.save(); c.translate(cx, cy); c.scale(s, s); c.rotate(-0.5); c.globalAlpha = 1 - (pop || 0);
      c.fillStyle = '#ffcf33'; c.strokeStyle = '#d99a00'; c.lineWidth = 3;
      c.beginPath(); c.arc(-12, 0, 9, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#d99a00'; c.beginPath(); c.arc(-12, 0, 3.5, 0, TAU); c.fill();
      c.fillStyle = '#ffcf33'; c.fillRect(-4, -3, 24, 6); c.strokeRect(-4, -3, 24, 6);
      c.fillRect(11, 3, 5, 8); c.strokeRect(11, 3, 5, 8); c.fillRect(3, 3, 5, 6); c.strokeRect(3, 3, 5, 6);
      c.restore();
    }

    function drawDoor(d, i) {
      const tx = OX + d.x * T, ty = OY + d.y * T, open = view.doorOpen[i];
      const m = T * 0.08;
      c.save();
      c.fillStyle = 'rgba(0,0,0,.28)'; rr(c, tx + m, ty + m, T - 2 * m, T - 2 * m, T * 0.1); c.fill(); // doorway
      const w = (T - 2 * m) * (1 - open * 0.88);
      if (w > 2) {
        c.fillStyle = '#e8483f'; rr(c, tx + m, ty + m, w, T - 2 * m, T * 0.1); c.fill();
        c.strokeStyle = '#a82820'; c.lineWidth = 3; rr(c, tx + m, ty + m, w, T - 2 * m, T * 0.1); c.stroke();
        if (w > T * 0.4) {
          c.fillStyle = '#ffcf33'; c.beginPath(); c.arc(tx + m + w * 0.74, ty + T * 0.52, T * 0.06, 0, TAU); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2;
          rr(c, tx + m + w * 0.14, ty + m + T * 0.1, w * 0.72, (T - 2 * m) * 0.32, 4); c.stroke();
        }
      }
      c.restore();
    }

    function drawFriend(time) {
      const f = view.st.friend; if (!f) return;
      const cx = px(f.x), cy = py(f.y), bob = Math.sin(time / 300) * 2 + (view.friendHappy ? -Math.abs(Math.sin(time / 180)) * 6 : 0);
      c.save(); c.translate(cx, cy + bob);
      c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(0, T * 0.32 - bob, T * 0.26, T * 0.07, 0, 0, TAU); c.fill();
      c.fillStyle = '#ff8fb8'; c.strokeStyle = '#d6588a'; c.lineWidth = 3;
      c.beginPath(); c.ellipse(0, T * 0.04, T * 0.28, T * 0.3, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(-T * 0.1, -T * 0.05, T * 0.07, 0, TAU); c.arc(T * 0.1, -T * 0.05, T * 0.07, 0, TAU); c.fill();
      c.fillStyle = '#3b2a4a';
      c.beginPath(); c.arc(-T * 0.1, -T * 0.04, T * 0.035, 0, TAU); c.arc(T * 0.1, -T * 0.04, T * 0.035, 0, TAU); c.fill();
      c.strokeStyle = '#3b2a4a'; c.lineWidth = 2.5; c.lineCap = 'round'; c.beginPath();
      if (view.friendHappy) c.arc(0, T * 0.06, T * 0.1, 0.1 * Math.PI, 0.9 * Math.PI); else c.arc(0, T * 0.16, T * 0.07, 1.15 * Math.PI, 1.85 * Math.PI);
      c.stroke();
      c.restore();
      // the friend always shows what it said
      const text = view.friendHmm > 0 ? 'Hmm?' : view.friendHappy ? '♥' : f.want;
      drawBubble(text, cx, cy - T * 0.42, 1, view.friendHappy ? '#ffe3ee' : '#fff');
    }

    function drawBit(time) {
      const b = view.bit, x = px(b.x), y = py(b.y), z = b.z;
      const idle = celebrating ? 0 : Math.sin(time / 420) * 1.5;
      c.save();
      c.fillStyle = 'rgba(0,0,0,.2)';
      c.beginPath(); c.ellipse(x, y + T * 0.32, T * 0.24 * Math.max(0.3, 1 - z / (T * 1.4)), T * 0.07, 0, 0, TAU); c.fill();
      c.translate(x, y - z + idle); c.rotate(b.rot); c.scale(b.sx, b.sy);
      const u = T / 64;
      c.scale(u, u);
      // feet
      c.fillStyle = '#1f5fb5'; rr(c, -17, 19, 13, 9, 4); c.fill(); rr(c, 4, 19, 13, 9, 4); c.fill();
      // body
      c.fillStyle = '#2f7de1'; rr(c, -14, 2, 28, 22, 7); c.fill();
      c.fillStyle = '#ffd531'; c.beginPath(); c.arc(0, 13, 3.5, 0, TAU); c.fill();
      // antenna
      c.strokeStyle = '#1f5fb5'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, -24); c.lineTo(0, -31); c.stroke();
      c.fillStyle = b.mood === 'oops' ? '#ffb02e' : '#ff6b6b'; c.beginPath(); c.arc(0, -33, 4, 0, TAU); c.fill();
      // head
      c.fillStyle = '#5db4ff'; c.strokeStyle = '#2a6fc9'; c.lineWidth = 3;
      rr(c, -21, -26, 42, 31, 9); c.fill(); c.stroke();
      // face screen
      c.fillStyle = '#10305a'; rr(c, -16, -21, 32, 21, 6); c.fill();
      const D = { right: [3, 0], left: [-3, 0], up: [0, -3], down: [0, 3] }[b.dir] || [0, 0];
      c.fillStyle = b.mood === 'oops' ? '#ffd27a' : '#7dffb0';
      if (b.mood === 'happy') {
        c.strokeStyle = '#7dffb0'; c.lineWidth = 3;
        c.beginPath(); c.arc(-6 + D[0], -11 + D[1], 3.5, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
        c.beginPath(); c.arc(6 + D[0], -11 + D[1], 3.5, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
      } else if (b.mood === 'oops') {
        c.strokeStyle = '#ffd27a'; c.lineWidth = 2.5;
        [-6, 6].forEach((ex) => { c.beginPath(); c.moveTo(ex - 3 + D[0], -14 + D[1]); c.lineTo(ex + 3 + D[0], -8 + D[1]); c.moveTo(ex + 3 + D[0], -14 + D[1]); c.lineTo(ex - 3 + D[0], -8 + D[1]); c.stroke(); });
      } else {
        c.beginPath(); c.arc(-6 + D[0], -11 + D[1], 3.4, 0, TAU); c.arc(6 + D[0], -11 + D[1], 3.4, 0, TAU); c.fill();
      }
      c.restore();
    }

    function drawBubble(text, cx, cy, alpha, fill) {
      c.save(); c.globalAlpha = alpha;
      c.font = 'bold 19px system-ui, "Segoe UI", sans-serif';
      const w = Math.max(40, c.measureText(text).width + 26), h = 32;
      const x = Math.max(6, Math.min(CW - w - 6, cx - w / 2)), y = cy - h;
      c.fillStyle = fill || '#fff'; c.strokeStyle = '#3a4a6b'; c.lineWidth = 2.5;
      rr(c, x, y, w, h, 12); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(cx - 6, y + h - 1); c.lineTo(cx, y + h + 8); c.lineTo(cx + 6, y + h - 1); c.fillStyle = fill || '#fff'; c.fill();
      c.fillStyle = '#23304a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x + w / 2, y + h / 2 + 1);
      c.restore();
    }

    function drawHud() {
      const st = view.st;
      if (!st.total && !st.key) return;
      c.save();
      c.fillStyle = 'rgba(255,255,255,.88)'; rr(c, 12, 12, 40 + (st.total ? 74 : 0) + (st.key ? 50 : 0), 38, 12); c.fill();
      let x = 24;
      if (st.total) {
        c.fillStyle = '#ffcf33'; c.strokeStyle = '#d99a00'; c.lineWidth = 2.5;
        c.beginPath(); c.arc(x + 8, 31, 9, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = '#23304a'; c.font = 'bold 20px system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(view.coinsGot + ' / ' + st.total, x + 24, 32); x += 84;
      }
      if (st.key) {
        c.globalAlpha = view.keyGot ? 1 : 0.35;
        c.save(); c.translate(x + 12, 31); c.scale(0.7, 0.7); c.rotate(-0.5);
        c.fillStyle = '#ffcf33'; c.strokeStyle = '#d99a00'; c.lineWidth = 3;
        c.beginPath(); c.arc(-12, 0, 9, 0, TAU); c.fill(); c.stroke(); c.fillRect(-4, -3, 24, 6); c.strokeRect(-4, -3, 24, 6);
        c.restore();
      }
      c.restore();
    }

    function drawBubblesAndParts(dt) {
      bubbles = bubbles.filter((b) => b.age < b.ms);
      bubbles.forEach((b) => {
        b.age += dt;
        const p = b.age / b.ms, a = p < 0.12 ? p / 0.12 : p > 0.8 ? (1 - p) / 0.2 : 1;
        const anchor = b.follow ? { x: px(view.bit.x), y: py(view.bit.y) - view.bit.z } : b;
        drawBubble(b.text, anchor.x, anchor.y - T * 0.5 - 8 - (1 - a) * 6, clamp01(a), b.fill);
      });
      parts = parts.filter((p) => p.life > 0);
      parts.forEach((p) => {
        p.life -= dt; p.vy += 0.0009 * dt * (p.grav === undefined ? 1 : p.grav); p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        c.save(); c.globalAlpha = clamp01(p.life / 400); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.color;
        if (p.shape === 'star') { c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.5 : 6; c.lineTo(Math.cos(i * Math.PI / 5) * r, Math.sin(i * Math.PI / 5) * r); } c.closePath(); c.fill(); }
        else c.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
        c.restore();
      });
    }

    function burst(x, y, n, colors, shape) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, sp = 0.05 + Math.random() * 0.25;
        parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.15, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 0.02, s: 6 + Math.random() * 6, life: 700 + Math.random() * 600, color: colors[i % colors.length], shape: shape });
      }
    }

    function frame(now) {
      const dt = Math.min(60, now - lastNow); lastNow = now;
      if (view) {
        for (const j of Array.from(jobs)) {
          const p = clamp01((now - j.t0) / j.ms);
          try { j.fn(p); } catch (e) { /* keep animating */ }
          if (p >= 1) { jobs.delete(j); j.resolve(); }
        }
        view.friendHmm = Math.max(0, view.friendHmm - dt);
        c.clearRect(0, 0, CW, CH);
        drawBackground(now); drawBoard(now);
        drawStar(now);
        view.st.coins.forEach((co, i) => { if (!view.coinGot[i]) drawCoin(co.x, co.y, now, 0); });
        if (view.st.key && !view.keyGot) drawKey(view.st.key.x, view.st.key.y, now, 0);
        view.st.doors.forEach(drawDoor);
        drawFriend(now);
        drawBit(now);
        drawBubblesAndParts(dt);
        drawHud();
      }
      root.requestAnimationFrame(frame);
    }
    root.requestAnimationFrame(frame);

    // ---- animations the runner can await --------------------------------------
    const api = {
      reset: reset, cancel: cancel, CANCEL: CANCEL,
      setSpeed: (f) => { speed = f; },
      wait: (ms) => tween(ms, () => {}),
      size: { w: CW, h: CH },

      move(ev, ms) {
        view.bit.dir = ev.dir; view.bit.mood = 'ok';
        return tween(ms, (p) => {
          view.bit.x = lerp(ev.from.x, ev.to.x, p); view.bit.y = lerp(ev.from.y, ev.to.y, p);
          view.bit.z = Math.sin(p * Math.PI) * T * 0.1;
        }).then(() => { view.bit.x = ev.to.x; view.bit.y = ev.to.y; view.bit.z = 0; });
      },
      jump(ev, ms) {
        view.bit.dir = ev.dir; view.bit.mood = 'ok';
        return tween(ms, (p) => {
          view.bit.x = lerp(ev.from.x, ev.to.x, p); view.bit.y = lerp(ev.from.y, ev.to.y, p);
          view.bit.z = Math.sin(p * Math.PI) * T * 0.8;
          view.bit.sy = 1 + 0.12 * Math.sin(p * Math.PI); view.bit.sx = 1 - 0.08 * Math.sin(p * Math.PI);
          view.bit.rot = Math.sin(p * Math.PI * 2) * 0.12 * (ev.dir === 'left' ? -1 : 1);
        }).then(() => { view.bit.x = ev.to.x; view.bit.y = ev.to.y; view.bit.z = 0; view.bit.sx = view.bit.sy = 1; view.bit.rot = 0; });
      },
      bonk(ev, ms) {
        const d = WB.core.DIRS[ev.dir] || [1, 0], x0 = view.bit.x, y0 = view.bit.y;
        view.bit.dir = ev.dir;
        let burstDone = false;
        return tween(ms, (p) => {
          const push = p < 0.3 ? p / 0.3 : Math.max(0, 1 - (p - 0.3) / 0.7);
          view.bit.x = x0 + d[0] * 0.32 * push; view.bit.y = y0 + d[1] * 0.32 * push;
          view.bit.rot = p > 0.3 ? Math.sin((p - 0.3) * 36) * 0.18 * (1 - p) : 0;
          if (p >= 0.3 && !burstDone) { burstDone = true; view.bit.mood = 'oops'; burst(px(x0) + d[0] * T * 0.5, py(y0) + d[1] * T * 0.5, 9, ['#ffd531', '#ff8a3d', '#fff'], 'star'); }
        }).then(() => { view.bit.x = x0; view.bit.y = y0; view.bit.rot = 0; });
      },
      fall(ms) {
        view.bit.mood = 'oops';
        return tween(ms, (p) => { const s = 1 - p; view.bit.sx = s; view.bit.sy = s; view.bit.rot = p * 5; view.bit.z = -p * T * 0.1; });
      },
      // After a fall: Bit pops back up at the start tile.
      respawn(pos, ms) {
        view.bit.x = pos.x; view.bit.y = pos.y; view.bit.rot = 0; view.bit.z = 0; view.bit.mood = 'ok';
        return tween(ms, (p) => { view.bit.sx = p; view.bit.sy = p; }).then(() => { view.bit.sx = view.bit.sy = 1; });
      },
      collect(kind, x, y, ms) {
        const i = kind === 'coin' ? view.st.coins.findIndex((co) => co.x === x && co.y === y) : -1;
        burst(px(x), py(y), 10, ['#ffe680', '#ffcf33', '#fff'], 'star');
        view.bit.mood = 'happy';
        if (kind === 'coin') { view.coinGot[i] = true; view.coinsGot++; } else view.keyGot = true;
        return tween(ms, () => {}).then(() => { view.bit.mood = 'ok'; });
      },
      openDoor(x, y, ms) {
        const i = view.st.doors.findIndex((d) => d.x === x && d.y === y);
        return tween(ms, (p) => { view.doorOpen[i] = p; }).then(() => { view.doorOpen[i] = 1; });
      },
      say(text, ms) {
        bubbles.push({ text: text, follow: true, age: 0, ms: ms * speed + 300 });
        return tween(ms, () => {});
      },
      friend(ok, ms) {
        const f = view.st.friend;
        if (ok) { view.friendHappy = true; burst(px(f.x), py(f.y) - T * 0.2, 14, ['#ff8fb8', '#ffd531', '#7dffb0', '#5db4ff'], 'star'); view.bit.mood = 'happy'; }
        else view.friendHmm = 1300;
        return tween(ms, () => {}).then(() => { view.bit.mood = 'ok'; });
      },
      starWakes() { /* the star lights up automatically through awake() */ },
      oopsBubble(text, ms) {
        view.bit.mood = 'oops';
        bubbles.push({ text: text, follow: true, age: 0, ms: ms * speed + 300, fill: '#fff1d6' });
        return tween(ms, () => {});
      },
      celebrate() {
        celebrating = true; view.bit.mood = 'happy';
        const cols = ['#ff6b6b', '#ffd531', '#5db4ff', '#7dffb0', '#ff8fb8', '#b48cff'];
        const s = view.st.star;
        for (let k = 0; k < 4; k++) setTimeout(() => burst(px(s.x), py(s.y), 26, cols), k * 260);
        return tween(1500, (p) => { view.bit.z = Math.abs(Math.sin(p * Math.PI * 4)) * T * 0.35; view.bit.sy = 1 + 0.06 * Math.sin(p * Math.PI * 8); })
          .then(() => { view.bit.z = 0; view.bit.sy = 1; celebrating = false; });
      },
      view: () => view,
    };
    return api;
  };
})(window);
