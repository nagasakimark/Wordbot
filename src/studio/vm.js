// The Studio runtime. Pure logic (no DOM), so it can be tested in Node.
//
// A project has sprites; each sprite has scripts (an event "hat" + blocks) and new words (defs).
// Every running script is a thread: a generator that runs until it yields. Like Scratch,
// a thread yields at the end of each loop turn and while it waits, so many scripts run
// "at the same time" and forever loops never freeze the page.
//
// Stage coordinates: 480 x 360, x to the right, y UP (0,0 is bottom-left). Directions in
// degrees: 0 = up, 90 = right, 180 = down, 270 = left.
export const W = 480, H = 360;
const MAX_SPRITES = 300;

class StopThread { }
const STOP = new StopThread();

export const KIND_RADIUS = { bit: 30, pip: 28, ghost: 28, star: 26, gem: 22, ball: 22, apple: 22, rocket: 28, fish: 26, heart: 22, coin: 20, cloud: 34, tree: 34, rock: 30, house: 36, cat: 28 };
const NOTE_HZ = { do: 523, re: 587, mi: 659, fa: 698, so: 784, la: 880, ti: 988, 'high do': 1047 };

let uid = 0;

export class VM {
  constructor(project, hooks = {}) {
    this.project = project;
    this.hooks = hooks; // { sound(name), note(hz), say(text) }
    this.reset();
  }

  // ---- setup ----
  reset() {
    this.time = 0;
    this.threads = [];
    this.ended = null;
    this.running = false;
    this.keys = new Set();
    this.pointer = { x: W / 2, y: H / 2 };
    this.vars = {};
    for (const v of this.project.vars || []) this.vars[v] = 0;
    this.insts = this.project.sprites.map((s) => this.instFor(s));
  }
  instFor(s, from) {
    const o = from || s;
    return {
      uid: ++uid, base: s, name: s.name, kind: s.kind,
      x: o.x, y: o.y, dir: o.dir ?? 90, size: o.size ?? 100, visible: o.visible !== false,
      hue: o.hue || 0, mood: o.mood || 'normal', say: null, hop: 0, isClone: !!from, alive: true, touching: new Set(),
    };
  }
  start() {
    this.reset();
    this.running = true;
    this.fire('whenRun');
  }
  stop() { this.threads = []; this.running = false; }

  // ---- events ----
  fire(type, match = () => true, only = null) {
    for (const inst of [...this.insts]) {
      if (!inst.alive || (only && inst !== only)) continue;
      for (const sc of inst.base.scripts || []) {
        if (sc.hat.type !== type || !match(sc.hat.args || {})) continue;
        if (type === 'whenClone' && !inst.isClone) continue;
        this.startThread(inst, sc);
      }
    }
  }
  startThread(inst, sc) {
    // starting a script that is already running restarts it (like Scratch)
    this.threads = this.threads.filter((t) => !(t.inst === inst && t.script === sc));
    const t = { inst, script: sc, cur: null };
    t.gen = this.runScript(t);
    this.threads.push(t);
  }
  keyDown(key) {
    if (!this.keys.has(key)) { this.keys.add(key); if (this.running) this.fire('whenKey', (a) => a.key === key); }
  }
  keyUp(key) { this.keys.delete(key); }
  tap(x, y) {
    this.pointer = { x, y };
    const hit = [...this.insts].reverse().find((i) => i.alive && i.visible && Math.hypot(i.x - x, i.y - y) < this.radius(i) + 8);
    if (hit && this.running) this.fire('whenTap', () => true, hit);
    return hit;
  }
  movePointer(x, y) { this.pointer = { x, y }; }

  // ---- one frame ----
  step(dt) {
    if (!this.running) return;
    this.time += dt;
    for (const t of [...this.threads]) {
      if (!this.threads.includes(t)) continue;
      let r;
      try { r = t.gen.next(); } catch (e) { if (e !== STOP) console.error(e); r = { done: true }; }
      if (r.done) this.threads = this.threads.filter((x) => x !== t);
      if (!this.running) break;
    }
    // speech bubbles with a time limit
    for (const i of this.insts) if (i.say && i.say.until && this.time >= i.say.until) i.say = null;
    // "when it touches …" fires once each time a touch starts
    for (const inst of this.insts) {
      if (!inst.alive) continue;
      const hats = (inst.base.scripts || []).filter((s) => s.hat.type === 'whenTouch');
      if (!hats.length) continue;
      for (const sc of hats) {
        const who = sc.hat.args.who;
        const now = who === 'the edge' ? this.onEdge(inst) : this.touchingName(inst, who);
        const key = sc.id;
        if (now && !inst.touching.has(key)) { inst.touching.add(key); this.startThread(inst, sc); }
        else if (!now) inst.touching.delete(key);
      }
    }
    if (!this.threads.length && !this.hasListeners()) this.running = this.running && true;
  }
  hasListeners() {
    return this.insts.some((i) => (i.base.scripts || []).some((s) => s.hat.type !== 'whenRun' && s.hat.type !== 'whenClone'));
  }

  // ---- helpers ----
  radius(i) { return (KIND_RADIUS[i.kind] || 26) * i.size / 100; }
  onEdge(i) { const r = this.radius(i) * 0.8; return i.x - r <= 0 || i.x + r >= W || i.y - r <= 0 || i.y + r >= H; }
  touching(a, b) { return a !== b && a.alive && b.alive && a.visible && b.visible && Math.hypot(a.x - b.x, a.y - b.y) < (this.radius(a) + this.radius(b)) * 0.78; }
  touchingName(inst, name) { return this.insts.some((o) => o.name === name && this.touching(inst, o)); }
  find(name) { return this.insts.find((i) => i.alive && i.name === name && !i.isClone) || this.insts.find((i) => i.alive && i.name === name); }
  num(v) {
    if (typeof v === 'number') return v;
    if (v === 'random') return 1 + Math.floor(Math.random() * 10);
    if (v in this.vars) return this.vars[v];
    const n = Number(v); return Number.isFinite(n) ? n : 0;
  }
  place(p, inst) {
    switch (p) {
      case 'a random place': return { x: 30 + Math.random() * (W - 60), y: 30 + Math.random() * (H - 60) };
      case 'the middle': return { x: W / 2, y: H / 2 };
      case 'the finger': return { ...this.pointer };
      case 'the top': return { x: 30 + Math.random() * (W - 60), y: H - 10 };
      case 'the bottom': return { x: 30 + Math.random() * (W - 60), y: 10 };
    }
    const o = this.find(p);
    return o && o !== inst ? { x: o.x, y: o.y } : { x: inst.x, y: inst.y };
  }
  cond(c, inst) {
    const p = String(c).split(':');
    switch (p[0]) {
      case 'touch': return this.touchingName(inst, p.slice(1).join(':'));
      case 'edge': return this.onEdge(inst);
      case 'key': return this.keys.has(p[1]);
      case 'var': { const v = this.num(p[1]), n = Number(p[3]); return p[2] === 'gt' ? v > n : p[2] === 'lt' ? v < n : v === n; }
    }
    return false;
  }
  setVar(v, n) { this.vars[v] = n; }
  end(kind) {
    this.ended = kind; this.running = false; this.threads = [];
    this.hooks.end?.(kind);
  }
  removeInst(inst) {
    inst.alive = false;
    this.insts = this.insts.filter((i) => i !== inst);
    this.threads = this.threads.filter((t) => t.inst !== inst);
  }

  // ---- the interpreter ----
  *runScript(t) {
    try { yield* this.list(t, t.script.body, 0); } catch (e) { if (e !== STOP) throw e; }
  }
  *list(t, nodes, depth) { for (const n of nodes) yield* this.node(t, n, depth); }
  *wait(secs) { const end = this.time + Math.max(0, secs); do { yield; } while (this.time < end); }

  fence(i) { i.x = Math.max(0, Math.min(W, i.x)); i.y = Math.max(0, Math.min(H, i.y)); }
  *node(t, n, depth) {
    const i = t.inst, a = n.args || {};
    t.cur = n.id;
    yield* this.exec(t, n, depth, i, a);
    if (MOVES.has(n.type)) this.fence(i);
  }
  *exec(t, n, depth, i, a) {
    switch (n.type) {
      // motion
      case 'move': { const d = this.num(a.n), r = i.dir * Math.PI / 180; i.x += Math.sin(r) * d; i.y += Math.cos(r) * d; break; }
      case 'turnBy': i.dir = norm(i.dir + (a.dir === 'left' ? -1 : 1) * this.num(a.deg)); break;
      case 'point': i.dir = { up: 0, right: 90, down: 180, left: 270 }[a.to] ?? 90; break;
      case 'pointAt': { const p = this.place(a.at, i); if (p.x !== i.x || p.y !== i.y) i.dir = norm(Math.atan2(p.x - i.x, p.y - i.y) * 180 / Math.PI); break; }
      case 'goTo': { const p = this.place(a.place, i); i.x = p.x; i.y = p.y; break; }
      case 'glide': {
        const p = this.place(a.place, i), x0 = i.x, y0 = i.y, secs = Math.max(0.05, this.num(a.secs)), t0 = this.time;
        while (this.time - t0 < secs) { const k = (this.time - t0) / secs; i.x = x0 + (p.x - x0) * k; i.y = y0 + (p.y - y0) * k; yield; }
        i.x = p.x; i.y = p.y; break;
      }
      case 'changeX': i.x += this.num(a.n); break;
      case 'changeY': i.y += this.num(a.n); break;
      case 'bounce': {
        const r = this.radius(i) * 0.8;
        if (i.x - r < 0) { i.x = r; i.dir = norm(-i.dir); } else if (i.x + r > W) { i.x = W - r; i.dir = norm(-i.dir); }
        if (i.y - r < 0) { i.y = r; i.dir = norm(180 - i.dir); } else if (i.y + r > H) { i.y = H - r; i.dir = norm(180 - i.dir); }
        break;
      }
      case 'hop': { this.hooks.sound?.('jump'); const t0 = this.time; while (this.time - t0 < 0.45) { i.hop = Math.sin((this.time - t0) / 0.45 * Math.PI) * 40; yield; } i.hop = 0; break; }
      // looks
      case 'sayIt': i.say = { text: this.text(a.text) }; this.hooks.say?.(i.say.text, i); break;
      case 'sayFor': { const txt = this.text(a.text); const s = { text: txt, until: this.time + this.num(a.secs) }; i.say = s; this.hooks.say?.(txt, i); yield* this.wait(this.num(a.secs)); if (i.say === s) i.say = null; break; }
      case 'mood': i.mood = a.mood; break;
      case 'recolor': i.hue = (i.hue + 45) % 360; break;
      case 'grow': i.size = Math.min(400, i.size * 1.25); break;
      case 'shrink': i.size = Math.max(15, i.size / 1.25); break;
      case 'setSize': i.size = Math.max(10, Math.min(400, this.num(a.n))); break;
      case 'hide': i.visible = false; break;
      case 'show': i.visible = true; break;
      // sound
      case 'playSound': this.hooks.sound?.(a.s); break;
      case 'playNote': this.hooks.note?.(NOTE_HZ[a.note] || 523); yield* this.wait(0.25); break;
      // control
      case 'wait': yield* this.wait(this.num(a.secs)); break;
      case 'waitUntil': while (!this.cond(a.cond, i)) yield; break;
      case 'repeat': { const k = this.num(a.n); for (let j = 0; j < k; j++) { yield* this.list(t, n.body, depth); yield; } break; }
      case 'forever': for (;;) { yield* this.list(t, n.body, depth); yield; }
      case 'until': while (!this.cond(a.cond, i)) { yield* this.list(t, n.body, depth); yield; } break;
      case 'if': if (this.cond(a.cond, i)) yield* this.list(t, n.body, depth); break;
      case 'ifelse': if (this.cond(a.cond, i)) yield* this.list(t, n.body, depth); else yield* this.list(t, n.else, depth); break;
      case 'stopScript': throw STOP;
      case 'stopAll': this.stop(); throw STOP;
      case 'clone': {
        if (this.insts.length >= MAX_SPRITES) break;
        const c = this.instFor(i.base, i);
        c.isClone = true;
        this.insts.splice(this.insts.indexOf(i), 0, c);
        this.fire('whenClone', () => true, c);
        break;
      }
      case 'unclone': if (i.isClone) { this.removeInst(i); throw STOP; } break;
      // messages + game
      case 'send': this.fire('whenMsg', (h) => h.msg === a.msg); break;
      case 'win': this.end('win'); throw STOP;
      case 'lose': this.end('lose'); throw STOP;
      // numbers
      case 'set': this.setVar(a.v, this.num(a.n)); break;
      case 'add': this.setVar(a.v, this.num(a.v) + 1); break;
      case 'changeVar': this.setVar(a.v, this.num(a.v) + this.num(a.n)); break;
      // new words
      case 'call': {
        const d = (i.base.defs || []).find((x) => x.name === a.name);
        if (d && depth < 20) yield* this.list(t, d.body, depth + 1);
        break;
      }
      default: break; // Learn-only blocks do nothing here
    }
  }
  text(v) {
    if (typeof v === 'string' && v in this.vars) return String(this.vars[v]);
    return String(v);
  }
}

const norm = (d) => ((d % 360) + 360) % 360;
// like Scratch, sprites can't leave the stage, so they never get lost
const MOVES = new Set(['move', 'goTo', 'glide', 'changeX', 'changeY']);
