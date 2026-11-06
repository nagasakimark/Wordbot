// The block editor. Scratch-style stacks with C-blocks that hold other blocks.
//   • Tap a block in the palette: it goes where the blinking cursor is.
//   • Drag a block anywhere: a shadow shows where it will snap. Drag it away to delete.
//   • Tap a chip (number, colour, condition…) to change it.
// The editor owns the program model and reports every change through onChange.
import { h, icon, toStage, rectInStage, toast } from '../ui/dom.js';
import { sfx, speak } from '../audio/sfx.js';
import { BLOCKS, CATS, CONDS, COLORS, WORDS, VARS, SAY_WORDS, PHRASES, NUM_KINDS, makeNode, cloneNode, countBlocks, blockSpoken, blockJa, argJa, argText, newId, studioCondText } from '../engine/blocks.js';
import { printProgram } from '../engine/text.js';

const CAT_ORDER = ['move', 'act', 'loop', 'logic', 'num', 'word'];

export class Editor {
  constructor({ palette, workspace, level, program, onChange }) {
    this.paletteEl = palette;
    this.wsEl = workspace;
    this.level = level;
    this.program = program;
    this.onChange = onChange || (() => {});
    this.history = [];
    this.locked = false;
    this.mode = 'blocks';
    this.cursor = this.defaultCursor();
    this.paletteTab = level.tabs ? level.tabs[0].id : null;
    this.inner = h('div.ws-inner');
    this.caret = h('div.caret');
    this.dropMark = h('div.dropmark');
    this.wsEl.append(this.inner);
    this.wsEl.addEventListener('pointerdown', (e) => this.wsPointer(e));
    this.buildPalette();
    this.render();
  }

  // ------------------------------------------------------------ model helpers
  find(id) {
    let hit = null;
    const go = (list, key) => list.forEach((n, i) => {
      if (hit) return;
      if (n.id === id) { hit = { node: n, list, key, index: i }; return; }
      if (n.body) go(n.body, n.id + ':b');
      if (n.else) go(n.else, n.id + ':e');
    });
    go(this.program.main, 'main');
    this.program.defs.forEach((d) => go(d.body, 'def:' + d.id));
    (this.program.scripts || []).forEach((sc) => go(sc.body, 'script:' + sc.id));
    return hit;
  }
  listFor(key) {
    if (key === 'main') return this.program.main;
    if (key.startsWith('def:')) { const d = this.program.defs.find((x) => x.id === key.slice(4)); return d && d.body; }
    if (key.startsWith('script:')) { const d = (this.program.scripts || []).find((x) => x.id === key.slice(7)); return d && d.body; }
    const [id, part] = key.split(':');
    const f = this.find(id);
    return f ? (part === 'b' ? f.node.body : f.node.else) : null;
  }
  snapshot() {
    this.history.push(JSON.stringify(this.program));
    if (this.history.length > 60) this.history.shift();
  }
  undo() {
    if (this.locked || !this.history.length) return false;
    const p = JSON.parse(this.history.pop());
    this.program.main = p.main; this.program.defs = p.defs; if (p.scripts) this.program.scripts = p.scripts;
    this.cursor = this.defaultCursor();
    this.buildPalette(); this.render(); this.changed();
    sfx.play('back');
    return true;
  }
  changed() { this.onChange(this.program); }
  count() { return countBlocks(this.program); }
  defaultCursor() {
    const sc = this.program.scripts;
    if (this.level.studio) return sc && sc.length ? { key: 'script:' + sc[sc.length - 1].id, index: sc[sc.length - 1].body.length } : { key: 'none', index: 0 };
    return { key: 'main', index: this.program.main.length };
  }
  setTarget(p) {
    this.program = p;
    this.history = [];
    this.cursor = this.defaultCursor();
    this.buildPalette(); this.render();
  }
  setProgram(p) {
    this.program.main = p.main; this.program.defs = p.defs; if (p.scripts) this.program.scripts = p.scripts;
    this.cursor = this.defaultCursor();
    this.buildPalette(); this.render(); this.changed();
  }

  // ------------------------------------------------------------ palette
  protos() {
    const L = this.level, out = [];
    if (L.paletteFor) return [...L.paletteFor(this.paletteTab, this.program), ...(this.paletteTab === 'word' || !L.tabs ? this.program.defs.map((d) => ({ type: 'call', args: { name: d.name } })) : [])];
    const firstCond = (pref) => pref.find((c) => L.conds && L.conds.includes(c)) || (L.conds || ['home'])[0];
    for (const p of L.palette) {
      if (p === 'forward') out.push({ type: 'forward' });
      else if (p === 'turn left') out.push({ type: 'turn', args: { dir: 'left' } });
      else if (p === 'turn right') out.push({ type: 'turn', args: { dir: 'right' } });
      else if (p === 'pick') out.push({ type: 'pick' });
      else if (p === 'paint') (L.colors || ['red']).forEach((color) => out.push({ type: 'paint', args: { color } }));
      else if (p === 'say') [...(L.vars || []), ...(L.sayWords || [])].forEach((what) => out.push({ type: 'say', args: { what } }));
      else if (p === 'repeat') out.push({ type: 'repeat', args: { n: 2 } });
      else if (p === 'until') out.push({ type: 'until', args: { cond: (L.conds || ['home'])[0] } });
      else if (p === 'if') out.push({ type: 'if', args: { cond: firstCond(['onGem', 'canForward', 'red']) } });
      else if (p === 'ifelse') out.push({ type: 'ifelse', args: { cond: firstCond(['canForward', 'canRight', 'onGem', 'red']) } });
      else if (p === 'set') (L.vars || []).forEach((v) => out.push({ type: 'set', args: { v, n: v === 'size' ? 1 : 0 } }));
      else if (p === 'add') (L.vars || []).forEach((v) => out.push({ type: 'add', args: { v } }));
      else if (p === 'newword') out.push({ special: 'newword' });
      else if (typeof p === 'object') out.push(p);
    }
    this.program.defs.forEach((d) => out.push({ type: 'call', args: { name: d.name } }));
    return out;
  }
  buildPalette() {
    const groups = new Map();
    for (const p of this.protos()) {
      const cat = p.cat || (p.special || p.note ? 'word' : BLOCKS[p.type].cat);
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(p);
    }
    const kids = [];
    if (this.level.tabs) {
      const strip = h('div.paltabs', ...this.level.tabs.map((tb) => h('button.paltab' + (tb.id === this.paletteTab ? '.on' : ''), {
        style: { '--c': CATS[tb.cat || tb.id]?.color || '#888' },
        onclick: () => { this.paletteTab = tb.id; sfx.play('pick'); this.buildPalette(); this.paletteEl.scrollTop = 0; },
      }, h('i'), h('span', {}, tb.ja), h('small', {}, tb.en))));
      this.tabStrip?.remove();
      this.tabStrip = strip;
      this.paletteEl.parentElement?.insertBefore(strip, this.paletteEl);
    }
    for (const cat of [...CAT_ORDER, 'event', 'look', 'sound', 'game']) {
      if (!groups.has(cat)) continue;
      const C = CATS[cat];
      kids.push(h('div.pal-cat', { style: { '--c': C.color } }, h('i'), h('span', {}, C.ja), h('small', {}, C.en)));
      for (const p of groups.get(cat)) {
        if (p.special === 'newword') {
          kids.push(h('button.newword', { onclick: () => this.newWord() }, icon('plus'), h('span', {}, 'New word'), h('small.hint', {}, 'ことばを つくる')));
          continue;
        }
        if (p.special) {
          kids.push(h('button.newword.' + p.special, { onclick: (e) => this.level.onSpecial?.(p.special, e.currentTarget, this) }, icon('plus'), h('span', {}, p.label), h('small.hint', {}, p.ja)));
          continue;
        }
        if (p.note) { kids.push(h('div.palnote', {}, p.note)); continue; }
        const key = this.blockEl({ id: 'proto', type: p.type, args: { ...(p.args || {}) }, body: BLOCKS[p.type].c ? [] : undefined, else: BLOCKS[p.type].c === 2 ? [] : undefined }, { palette: true });
        key.addEventListener('pointerdown', (e) => this.pointerDown(e, { from: 'palette', proto: p, el: key }));
        kids.push(key);
      }
    }
    this.paletteEl.replaceChildren(...kids);
    const fade = () => { const el = this.paletteEl; el.classList.toggle('more', el.scrollHeight - el.scrollTop - el.clientHeight > 8); };
    if (!this.fadeHooked) { this.paletteEl.addEventListener('scroll', fade); this.fadeHooked = true; }
    requestAnimationFrame(fade);
  }

  // ------------------------------------------------------------ rendering
  blockEl(node, { palette = false } = {}) {
    const def = BLOCKS[node.type], C = CATS[def.cat];
    const el = h('div.blk.cat-' + def.cat + (def.c ? '.cblk' : '') + (palette ? '.pkey' : '') + (def.event ? '.evhat' : '') + (def.end ? '.endblk' : ''), { style: { '--c': C.color, '--d': C.dark }, 'data-id': node.id });
    const head = h('div.bhead');
    const ic = typeof def.icon === 'function' ? def.icon(node.args) : def.icon;
    head.append(h('span.bicon', { html: iconSvg(ic) }));
    const words = h('span.bwords');
    for (const part of def.parts(node.args)) {
      if (typeof part === 'string') { words.append(h('span.bt', {}, part)); continue; }
      const kind = def.args[part.arg], v = node.args[part.arg];
      if (node.type === 'call') { words.append(h('span.bt.callname', {}, v)); continue; }
      const chip = h('span.chip.k-' + kind, { 'data-arg': part.arg }, chipText(kind, v));
      if (kind === 'color') chip.style.setProperty('--sw', COLORS[v]?.hex || '#ccc');
      if (!palette) chip.addEventListener('click', (e) => { e.stopPropagation(); this.pickArg(node, part.arg, kind, chip); });
      words.append(chip);
    }
    head.append(words);
    head.append(h('span.badge'));
    const top = h('div.btop', {}, head, h('div.bjp', {}, blockJa(node)));
    el.append(top);
    if (def.c) {
      const inner = palette ? h('div.cbody.mini') : h('div.cbody', {}, this.listEl(node.id + ':b', node.body));
      el.append(inner);
      if (def.c === 2) {
        el.append(h('div.cmid', {}, h('span.bt', {}, def.elseText), h('span.bjp.inline', {}, 'そうでなければ')));
        el.append(palette ? h('div.cbody.mini') : h('div.cbody', {}, this.listEl(node.id + ':e', node.else)));
      }
      el.append(h('div.cfoot'));
    }
    if (!palette) this.blockEls.set(node.id, el);
    return el;
  }
  listEl(key, nodes) {
    const l = h('div.list', { 'data-key': key });
    nodes.forEach((n) => l.append(this.blockEl(n)));
    if (!nodes.length) l.append(h('div.slot-empty', {}, key === 'main' ? 'ここに ブロックを ならべよう' : key.startsWith('def:') ? 'この ことばの やりかたを ここに ならべよう' : 'ここに いれる'));
    this.listEls.set(key, l);
    return l;
  }
  render() {
    this.blockEls = new Map();
    this.listEls = new Map();
    const stacks = [];
    const defStacks = [];
    for (const d of this.program.defs) {
      const C = CATS.word;
      const hat = h('div.hat.defhat', { style: { '--c': C.color, '--d': C.dark }, 'data-def': d.id },
        h('span.bicon', { html: iconSvg('book') }),
        h('span.bt', {}, 'to'),
        h('span.chip.k-word', { onclick: (e) => { e.stopPropagation(); this.renameWord(d); } }, d.name),
        h('span.bt', {}, ':'),
        h('span.bjp.inline', {}, '「' + d.name + '」の やりかた'),
        d.given ? null : h('button.defdel', { title: 'delete', onclick: (e) => { e.stopPropagation(); this.deleteWord(d); } }, '×'));
      defStacks.push(h('div.stack.defstack', {}, hat, h('div.defbody', { style: { '--c': C.color } }, this.listEl('def:' + d.id, d.body)), h('div.deffoot', { style: { '--c': C.color } })));
    }
    if (defStacks.length) {
      stacks.push(h('div.defzone', {},
        h('div.defzone-head', {}, h('span.bicon', { html: iconSvg('book') }),
          h('div', {}, h('b', {}, 'New words'), h('span', {}, 'Build a word here once. Then use it like any block, as many times as you like.'), h('small', {}, 'ここで ことばを つくる。ブロックと おなじように なんども つかえるよ。'))),
        ...defStacks));
    }
    if (this.level.studio) {
      const scripts = (this.program.scripts || []).map((sc) => {
        const hat = this.blockEl(sc.hat, {});
        hat.classList.add('scripthat'); hat.dataset.script = sc.id;
        hat.append(h('button.defdel', { title: 'delete', onclick: (e) => { e.stopPropagation(); this.deleteScript(sc); } }, '×'));
        return h('div.stack.scriptstack', { 'data-script': sc.id }, hat, this.listEl('script:' + sc.id, sc.body));
      });
      if (!scripts.length) stacks.unshift(h('div.ws-hint', {}, h('b', {}, 'Start with an Event block'), h('span', {}, '「きっかけ」の ブロック（when …）を ここに おこう')));
      stacks.unshift(...scripts);
    } else {
      const start = h('div.hat.starthat', {}, h('span.bicon', { html: iconSvg('start') }), h('span.bt', {}, 'start'), h('span.bjp.inline', {}, 'Run で スタート'));
      stacks.unshift(h('div.stack.mainstack', {}, start, this.listEl('main', this.program.main)));
    }
    if (this.mode === 'text') {
      this.inner.replaceChildren(this.codeView());
    } else {
      this.inner.replaceChildren(...stacks, this.caret, this.dropMark);
    }
    this.wsEl.classList.toggle('textmode', this.mode === 'text');
    requestAnimationFrame(() => this.placeCaret());
  }

  codeView() {
    const lines = printProgram(this.program);
    this.codeLines = new Map();
    const pre = h('div.codeview');
    if (!this.program.main.length && !this.program.defs.length) pre.append(h('div.code-empty', {}, 'まだ ブロックが ないよ'));
    lines.forEach((ln, i) => {
      const indent = ln.text.match(/^ */)[0].length;
      const row = h('div.cl' + (ln.empty ? '.empty' : '') + (ln.def ? '.def' : ''), { style: { '--i': indent / 4 } },
        h('span.ln', {}, String(i + 1)), h('span.ct', {}, ln.text.trim()));
      if (ln.id) {
        const f = this.find(ln.id) || null;
        const type = f ? f.node.type : ln.hat ? 'whenRun' : 'def';
        row.classList.add('cat-' + (BLOCKS[type] ? BLOCKS[type].cat : 'word'));
        if (!this.codeLines.has(ln.id)) this.codeLines.set(ln.id, row);
        row.addEventListener('click', () => speak(ln.text.trim().replace(/:$/, '')));
      }
      pre.append(row);
    });
    return pre;
  }
  setMode(m) { this.mode = m; this.render(); }

  // ------------------------------------------------------------ cursor
  caretPos(key, index) {
    const l = this.listEls.get(key);
    if (!l) return null;
    const base = rectInStage(this.inner);
    const kids = [...l.children].filter((c) => c.classList.contains('blk'));
    const lr = rectInStage(l);
    let y;
    if (!kids.length) y = lr.y + 4;
    else if (index < kids.length) y = rectInStage(kids[index]).y - 3;
    else { const r = rectInStage(kids[kids.length - 1]); y = r.y + r.h + 1; }
    return { x: lr.x - base.x, y: y - base.y, w: Math.max(120, lr.w) };
  }
  placeCaret() {
    if (this.mode !== 'blocks') return;
    let list = this.listFor(this.cursor.key);
    if (!list) { this.cursor = this.defaultCursor(); list = this.listFor(this.cursor.key); }
    if (!list) { this.caret.classList.add('hidden'); return; }
    this.cursor.index = Math.min(this.cursor.index, list.length);
    const p = this.caretPos(this.cursor.key, this.cursor.index);
    if (!p) return;
    Object.assign(this.caret.style, { left: p.x + 'px', top: p.y - 3 + 'px', width: Math.min(p.w, 260) + 'px' });
    this.caret.classList.toggle('hidden', this.locked);
  }
  setCursor(key, index) { this.cursor = { key, index }; this.placeCaret(); }

  // ------------------------------------------------------------ inserting / removing
  canAdd(node) {
    if (BLOCKS[node.type].event) return true;
    const add = countBlocks({ main: [node], defs: [] });
    if (this.count() + add > this.level.max) {
      sfx.play('error');
      this.wsEl.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 280 });
      toast(`ブロックは ${this.level.max}こ まで！ くりかえしを つかえないかな？`, 'warn');
      return false;
    }
    return true;
  }
  insert(node, key, index, { fromEl, speakIt = true } = {}) {
    const list = this.listFor(key);
    if (!list) return;
    list.splice(Math.min(index, list.length), 0, node);
    if (BLOCKS[node.type].c) this.cursor = { key: node.id + ':b', index: node.body.length };
    else this.cursor = { key, index: index + 1 };
    this.render();
    const el = this.blockEls.get(node.id);
    if (el && fromEl) {
      const a = fromEl.getBoundingClientRect(), b = el.getBoundingClientRect();
      el.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(.9)`, opacity: 0.6 }, { transform: 'scale(1.05)', opacity: 1, offset: 0.8 }, { transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.3,.8,.3,1)' });
    }
    this.landed(node, fromEl ? 300 : 0, speakIt);
    this.scrollTo(el);
    this.changed();
  }
  landed(node, delay, speakIt) {
    setTimeout(() => {
      sfx.play('snap');
      if (speakIt) speak(blockSpoken(node));
      const el = this.blockEls.get(node.id);
      el?.animate([{ transform: 'scale(1.06,.9)' }, { transform: 'scale(.98,1.03)' }, { transform: 'none' }], { duration: 240, easing: 'ease-out' });
    }, delay);
  }
  scrollTo(el) {
    if (!el) return;
    const ws = this.wsEl, r = rectInStage(el), w = rectInStage(ws);
    if (r.y + r.h > w.y + w.h - 30) ws.scrollBy({ top: r.y + r.h - (w.y + w.h) + 60, behavior: 'smooth' });
    else if (r.y < w.y) ws.scrollBy({ top: r.y - w.y - 30, behavior: 'smooth' });
  }

  // ------------------------------------------------------------ chips
  options(kind, node) {
    const L = this.level;
    if (L.optionsFor) { const o = L.optionsFor(kind, node, this.program); if (o) return o; }
    switch (kind) {
      case 'dir': return ['left', 'right'];
      case 'color': return L.colors || ['red'];
      case 'cond': return L.conds || ['home'];
      case 'count': return [...Array.from({ length: 10 }, (_, i) => i + 1), ...(L.vars || [])];
      case 'num0': return Array.from({ length: 11 }, (_, i) => i);
      case 'var': return L.vars || [];
      case 'say': return [...(L.vars || []), ...(L.sayWords || [])];
    }
    return [];
  }
  pickArg(node, arg, kind, chip) {
    if (this.locked) return;
    const opts = this.options(kind, node);
    if (opts.length < 2) { speak(blockSpoken(node)); return; }
    sfx.play('pick');
    this.popup(chip, opts, node.args[arg], kind, async (v) => {
      if (typeof v === 'string' && v.startsWith('__') && this.level.special && v !== '__num' && v !== '__type') { v = await this.level.special(v, chip, this); if (v === null || v === undefined) return; }
      if (v === '__num') { v = await this.keypad(chip, node.args[arg]); if (v === null) return; }
      if (v === '__type') { v = await this.typeText(chip, node.args[arg]); if (v === null) return; }
      if (typeof v === 'object' && v && v.then) v = await v;
      if (v === null || v === undefined) return;
      this.snapshot();
      node.args[arg] = v;
      this.render(); this.changed();
      sfx.play('snap'); speak(blockSpoken(node));
      const c = this.blockEls.get(node.id)?.querySelector(`.chip[data-arg="${arg}"]`);
      c?.animate([{ transform: 'scale(1.4)' }, { transform: 'none' }], { duration: 260 });
    });
  }
  popup(anchor, opts, current, kind, onPick) {
    const overlay = document.getElementById('overlay');
    const r = rectInStage(anchor);
    const numeric = opts.every((o) => typeof o === 'number' || o === 'random' || o === '__num' || (typeof o === 'string' && o in VARS));
    const pop = h('div.pop' + (numeric ? '.numpop' : '.listpop') + (!numeric && opts.length > 9 ? '.cols2' : ''));
    for (const o of opts) {
      const label = typeof o === 'number' ? String(o) : chipText(kind, o);
      const ja = typeof o === 'number' || String(o).startsWith('__') || o === 'random' ? '' : argJa(kind, o);
      const b = h('button.popbtn' + (o === current ? '.on' : '') + (typeof o === 'string' && (o in VARS || o === 'random' || o === '__num') ? '.isvar' : ''), {
        onclick: () => { close(); onPick(o); },
      }, kind === 'color' ? h('i.sw', { style: { background: COLORS[o].hex } }) : null, h('span', {}, label), ja && ja !== label ? h('small', {}, ja) : null);
      pop.append(b);
    }
    const back = h('div.pop-back', { onpointerdown: (e) => { if (e.target === back) close(); } }, pop);
    const close = () => back.remove();
    overlay.append(back);
    // place under the chip, kept on screen
    const pr = pop.getBoundingClientRect(), sc = rectInStage(pop);
    const W = document.getElementById('stage').offsetWidth;
    let x = Math.min(r.x - 8, W - sc.w - 12), y = r.y + r.h + 10;
    if (y + sc.h > 890) y = Math.max(10, r.y - sc.h - 10);
    pop.style.left = Math.max(10, x) + 'px'; pop.style.top = y + 'px';
    void pr;
  }

  keypad(anchor, current) {
    return new Promise((resolve) => {
      const overlay = document.getElementById('overlay');
      let val = typeof current === 'number' ? String(current) : '';
      const show = h('div.kpshow', {}, val || '0');
      const press = (k) => {
        sfx.play('pick');
        if (k === '⌫') val = val.slice(0, -1);
        else if (k === '-') val = val.startsWith('-') ? val.slice(1) : '-' + val;
        else if (k === '.') { if (!val.includes('.')) val += val ? '.' : '0.'; }
        else if (val.replace('-', '').length < 4) val += k;
        show.textContent = val || '0';
      };
      const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '-', '0', '.'].map((k) => h('button.popbtn', { onclick: () => press(k) }, k));
      const done = (v) => { back.remove(); resolve(v); };
      const pad = h('div.pop.keypad', show, h('div.kpkeys', ...keys, h('button.popbtn', { onclick: () => press('⌫') }, '⌫'),
        h('button.popbtn.ok', { onclick: () => { const n = Number(val); done(Number.isFinite(n) && val !== '' && val !== '-' ? n : null); } }, 'OK')));
      const back = h('div.pop-back', { onpointerdown: (e) => { if (e.target === back) done(null); } }, pad);
      overlay.append(back);
      const r = rectInStage(anchor); pad.style.left = Math.max(10, r.x - 20) + 'px'; pad.style.top = Math.min(900 - 420, r.y + r.h + 10) + 'px';
    });
  }
  typeText(anchor, current) {
    return new Promise((resolve) => {
      const overlay = document.getElementById('overlay');
      const input = h('input.typein', { type: 'text', maxlength: '40', placeholder: 'Type in English…', value: typeof current === 'string' && !current.startsWith('__') ? current : '' });
      const done = (v) => { back.remove(); resolve(v); };
      const ok = () => { const v = input.value.trim(); done(v ? v : null); };
      input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') ok(); if (e.key === 'Escape') done(null); });
      const box = h('div.pop.typebox', h('div.typelabel', {}, 'Write it in English', h('small', {}, 'えいごで かいてね')), input, h('button.popbtn.ok', { onclick: ok }, 'OK'));
      const back = h('div.pop-back', { onpointerdown: (e) => { if (e.target === back) done(null); } }, box);
      overlay.append(back);
      const r = rectInStage(anchor); box.style.left = Math.max(10, Math.min(r.x - 20, 1300)) + 'px'; box.style.top = Math.min(700, r.y + r.h + 10) + 'px';
      setTimeout(() => input.focus(), 30);
    });
  }

  // ------------------------------------------------------------ studio scripts
  addScript(hatNode, { fromEl } = {}) {
    this.snapshot();
    const sc = { id: newId(), hat: hatNode, body: [] };
    (this.program.scripts || (this.program.scripts = [])).push(sc);
    this.cursor = { key: 'script:' + sc.id, index: 0 };
    this.render(); this.changed();
    const el = this.inner.querySelector(`[data-script="${sc.id}"]`);
    if (el && fromEl) { const a = fromEl.getBoundingClientRect(), b = el.getBoundingClientRect(); el.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(.9)`, opacity: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.3,.8,.3,1)' }); }
    setTimeout(() => { sfx.play('snap'); speak(blockSpoken(hatNode)); }, fromEl ? 280 : 0);
    this.scrollTo(el);
  }
  deleteScript(sc) {
    if (this.locked) return;
    this.snapshot();
    this.program.scripts = this.program.scripts.filter((x) => x !== sc);
    this.cursor = this.defaultCursor();
    this.render(); this.changed(); sfx.play('poof');
  }
  glow(ids) {
    for (const e of this.wsEl.querySelectorAll('.blk.running-now')) if (!ids.has(e.dataset.id)) e.classList.remove('running-now');
    for (const id of ids) this.blockEls.get(id)?.classList.add('running-now');
  }

  // ------------------------------------------------------------ new words (functions)
  newWord() {
    if (this.locked) return;
    const used = new Set(this.program.defs.map((d) => d.name));
    const free = (this.level.words || Object.keys(WORDS)).filter((w) => !used.has(w));
    if (!free.length) { toast('もう ことばが ないよ', 'warn'); return; }
    const anchor = this.paletteEl.querySelector('.newword');
    this.popup(anchor, free, null, 'word', (name) => {
      this.snapshot();
      const d = { id: newId(), name, body: [] };
      this.program.defs.push(d);
      this.cursor = { key: 'def:' + d.id, index: 0 };
      this.buildPalette(); this.render(); this.changed();
      sfx.play('snap'); speak('to ' + name);
      this.wsEl.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  renameWord(d) {
    if (this.locked || d.given) { speak('to ' + d.name); return; }
    const used = new Set(this.program.defs.map((x) => x.name));
    const free = (this.level.words || Object.keys(WORDS)).filter((w) => !used.has(w) || w === d.name);
    const anchor = this.inner.querySelector(`[data-def="${d.id}"] .chip`);
    this.popup(anchor, free, d.name, 'word', (name) => {
      this.snapshot();
      const old = d.name; d.name = name;
      const fix = (list) => list.forEach((n) => { if (n.type === 'call' && n.args.name === old) n.args.name = name; if (n.body) fix(n.body); if (n.else) fix(n.else); });
      fix(this.program.main); this.program.defs.forEach((x) => fix(x.body));
      this.buildPalette(); this.render(); this.changed();
    });
  }
  deleteWord(d) {
    if (this.locked) return;
    this.snapshot();
    this.program.defs = this.program.defs.filter((x) => x !== d);
    this.buildPalette(); this.render(); this.changed();
    sfx.play('poof');
  }

  // ------------------------------------------------------------ pointer: taps and drags
  wsPointer(e) {
    if (this.locked || this.mode !== 'blocks' || e.button > 0) return;
    if (e.target.closest('.chip, .defdel, button')) return;
    const blk = e.target.closest('.blk');
    if (blk && blk.classList.contains('scripthat')) {
      const sc = this.program.scripts.find((x) => x.id === blk.dataset.script);
      this.setCursor('script:' + sc.id, sc.body.length); speak(blockSpoken(sc.hat)); sfx.play('pick'); return;
    }
    if (blk && blk.dataset.id && blk.dataset.id !== 'proto') { this.pointerDown(e, { from: 'ws', id: blk.dataset.id, el: blk }); return; }
    // tapping an empty slot or the space under a stack moves the cursor there
    const slot = e.target.closest('.list');
    if (slot) { this.setCursor(slot.dataset.key, this.listFor(slot.dataset.key).length); sfx.play('pick'); return; }
    if (e.target.closest('.starthat')) { this.setCursor('main', 0); return; }
    if (e.target === this.inner || e.target === this.wsEl) { const c = this.defaultCursor(); this.setCursor(c.key, c.index); }
  }

  pointerDown(e, src) {
    if (this.locked || e.button > 0) return;
    e.preventDefault();
    const start = toStage(e.clientX, e.clientY);
    const origin = rectInStage(src.el);
    let drag = null;
    const move = (ev) => {
      const p = toStage(ev.clientX, ev.clientY);
      if (!drag) {
        if (Math.hypot(p.x - start.x, p.y - start.y) < 8) return;
        drag = this.beginDrag(src, start, origin);
        if (!drag) { cleanup(); return; }
      }
      this.dragMove(drag, p);
    };
    const up = (ev) => {
      cleanup();
      if (drag) this.endDrag(drag, toStage(ev.clientX, ev.clientY));
      else this.tap(src);
    };
    const cancel = () => { cleanup(); if (drag) this.endDrag(drag, null, true); };
    const cleanup = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
  }

  tap(src) {
    if (src.from === 'palette') {
      const node = fromProto(src.proto);
      if (BLOCKS[node.type].event) { this.addScript(node, { fromEl: src.el }); return; }
      if (this.level.studio && !this.listFor(this.cursor.key)) { toast('さきに「きっかけ」の ブロックを おこう（when …）', 'warn'); sfx.play('error'); return; }
      if (!this.canAdd(node)) return;
      this.snapshot();
      this.insert(node, this.cursor.key, this.cursor.index, { fromEl: src.el });
    } else {
      const f = this.find(src.id);
      if (!f) return;
      // tapping a C-block puts the cursor inside it; other blocks put it after them
      if (BLOCKS[f.node.type].c) this.setCursor(f.node.id + ':b', f.node.body.length);
      else this.setCursor(f.key, f.index + 1);
      speak(blockSpoken(f.node));
      src.el.animate([{ transform: 'scale(1.04)' }, { transform: 'none' }], { duration: 180 });
    }
  }

  beginDrag(src, start, origin) {
    let node, from = null;
    if (src.from === 'palette') {
      node = fromProto(src.proto);
      if (!this.canAdd(node)) return null;
    } else {
      const f = this.find(src.id);
      if (!f) return null;
      this.snapshot();
      from = { key: f.key, index: f.index };
      f.list.splice(f.index, 1);
      node = f.node;
      if (this.cursor.key === f.key && this.cursor.index > f.index) this.cursor.index--;
      this.render();
    }
    const ghost = this.blockEl(node, {});
    this.blockEls.delete(node.id);
    ghost.classList.add('dragging');
    document.getElementById('drag-layer').append(ghost);
    const off = { x: start.x - origin.x, y: start.y - origin.y };
    sfx.play('pick');
    document.body.classList.add('is-dragging');
    this.paletteEl.classList.toggle('bin-on', src.from === 'ws');
    return { node, from, ghost, off, src, cands: this.candidates(), best: null, scroll0: this.wsEl.scrollTop };
  }
  candidates() {
    const out = [];
    const base = rectInStage(this.inner);
    for (const [key, l] of this.listEls) {
      const kids = [...l.children].filter((c) => c.classList.contains('blk'));
      const lr = rectInStage(l);
      for (let i = 0; i <= kids.length; i++) {
        let y;
        if (!kids.length) y = lr.y + 2;
        else if (i < kids.length) y = rectInStage(kids[i]).y;
        else { const r = rectInStage(kids[kids.length - 1]); y = r.y + r.h; }
        out.push({ key, index: i, x: lr.x, y, ix: lr.x - base.x, iy: y - base.y, w: lr.w });
      }
    }
    return out;
  }
  dragMove(d, p) {
    const gx = p.x - d.off.x, gy = p.y - d.off.y;
    d.ghost.style.left = gx + 'px'; d.ghost.style.top = gy + 'px';
    const ws = rectInStage(this.wsEl);
    const inWs = p.x > ws.x - 20 && p.x < ws.x + ws.w + 20 && p.y > ws.y - 20 && p.y < ws.y + ws.h + 20;
    // auto-scroll near the edges
    if (inWs && p.y > ws.y + ws.h - 50) this.wsEl.scrollTop += 10;
    if (inWs && p.y < ws.y + 40) this.wsEl.scrollTop -= 10;
    let best = null, bestS = 1e9;
    if (inWs) {
      for (const c of d.cands) {
        const cy = c.y - (this.wsEl.scrollTop - d.scroll0);
        const s = Math.abs(gy - cy) + Math.max(0, Math.abs(gx - c.x) - 30) * 0.6;
        if (s < bestS) { bestS = s; best = c; }
      }
      if (bestS > 110) best = null;
    }
    d.best = best;
    if (BLOCKS[d.node.type].event) best = null;
    if (best) {
      Object.assign(this.dropMark.style, { left: best.ix + 'px', top: best.iy - 5 + 'px', width: Math.min(d.ghost.offsetWidth, 320) + 'px', '--c': CATS[BLOCKS[d.node.type].cat].color });
      this.dropMark.style.setProperty('--c', CATS[BLOCKS[d.node.type].cat].color);
      this.dropMark.classList.add('on');
    } else this.dropMark.classList.remove('on');
    d.ghost.classList.toggle('will-delete', !inWs && d.src.from === 'ws');
  }
  endDrag(d, p, cancelled) {
    document.body.classList.remove('is-dragging');
    this.paletteEl.classList.remove('bin-on');
    this.dropMark.classList.remove('on');
    const ghost = d.ghost;
    if (BLOCKS[d.node.type].event) {
      ghost.remove();
      const ws = rectInStage(this.wsEl);
      if (!cancelled && p && p.x > ws.x && p.x < ws.x + ws.w && p.y > ws.y && p.y < ws.y + ws.h) this.addScript(d.node);
      return;
    }
    if (!cancelled && d.best) {
      ghost.remove();
      if (d.src.from === 'palette') this.snapshot();
      this.insert(d.node, d.best.key, d.best.index, { speakIt: d.src.from === 'palette' });
      return;
    }
    if (d.src.from === 'ws') {
      if (cancelled && d.from) { this.listFor(d.from.key)?.splice(d.from.index, 0, d.node); ghost.remove(); this.render(); return; }
      sfx.play('poof');
      ghost.classList.add('poof');
      setTimeout(() => ghost.remove(), 340);
      this.render(); this.changed();
    } else ghost.remove();
  }

  // ------------------------------------------------------------ while a program runs
  lock(on) { this.locked = on; this.wsEl.classList.toggle('running', on); this.paletteEl.classList.toggle('locked', on); this.placeCaret(); }
  el(id) { return this.blockEls.get(id); }
  setActive(id) {
    this.wsEl.querySelectorAll('.blk.active, .cl.active, .hat.active').forEach((e) => e.classList.remove('active'));
    if (!id) return;
    const e = this.mode === 'text' ? this.codeLines?.get(id) : this.blockEls.get(id);
    if (e) { e.classList.add('active'); this.scrollTo(e); }
  }
  defActive(defId, on, callId) {
    const hat = this.inner.querySelector(`[data-def="${defId}"]`);
    hat?.classList.toggle('calling', on);
    hat?.closest('.defstack')?.classList.toggle('calling', on);
    if (callId) this.blockEls.get(callId)?.classList.toggle('callnow', on);
  }
  badge(id, text, kind) {
    const e = this.blockEls.get(id);
    const b = e && e.querySelector(':scope > .btop .badge');
    if (!b) return;
    b.textContent = text; b.className = 'badge on ' + (kind || '');
    if (kind === 'yes' || kind === 'no') b.animate([{ transform: 'scale(1.6)' }, { transform: 'none' }], { duration: 260 });
  }
  clearBadge(id) {
    const b = this.blockEls.get(id)?.querySelector(':scope > .btop .badge');
    if (b) { b.textContent = ''; b.className = 'badge'; }
  }
  clearRun() {
    this.wsEl.querySelectorAll('.active, .err, .calling, .callnow').forEach((e) => e.classList.remove('active', 'err', 'calling', 'callnow'));
    this.wsEl.querySelectorAll('.badge.on').forEach((b) => { b.textContent = ''; b.className = 'badge'; });
  }
  markError(id) {
    const e = this.mode === 'text' ? this.codeLines?.get(id) : this.blockEls.get(id);
    if (e) { e.classList.add('err'); this.scrollTo(e); }
  }
}

function fromProto(p) {
  const n = makeNode(p.type, p.args || {});
  return n;
}

function chipText(kind, v) {
  if (kind === 'cond') return CONDS[v] ? CONDS[v].en : studioCondText(v);
  if (kind === 'say' && v in SAY_WORDS) return v;
  if (v === 'random' && NUM_KINDS.has(kind)) return '🎲 random';
  if (v === '__num') return '123…';
  if (v === '__type') return '✏️ write…';
  return String(v);
}

function iconSvg(name) {
  const tmp = icon(name);
  return tmp.innerHTML;
}

export { cloneNode };

// Blocks drawn for reading only (concept cards, help).
export function staticBlocks(program, level) {
  const fake = Object.create(Editor.prototype);
  Object.assign(fake, { level: level || {}, blockEls: new Map(), listEls: new Map(), locked: true, pickArg() {} });
  const wrap = h('div.static-prog');
  for (const d of program.defs) {
    const C = CATS.word;
    wrap.append(h('div.stack.defstack', {},
      h('div.hat.defhat', { style: { '--c': C.color, '--d': C.dark } }, h('span.bicon', { html: iconSvg('book') }), h('span.bt', {}, 'to'), h('span.chip.k-word', {}, d.name), h('span.bt', {}, ':')),
      h('div.defbody', { style: { '--c': C.color } }, fake.listEl('def:' + d.id, d.body)), h('div.deffoot', { style: { '--c': C.color } })));
  }
  for (const sc of program.scripts || []) {
    const hat = fake.blockEl(sc.hat, {});
    hat.classList.add('scripthat');
    wrap.append(h('div.stack.scriptstack', {}, hat, fake.listEl('script:' + sc.id, sc.body)));
  }
  if (program.main.length) wrap.append(fake.listEl('main', program.main));
  return wrap;
}
