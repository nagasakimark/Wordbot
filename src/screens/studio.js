// Studio: make your own games and stories with English blocks.
import { h, btn, icon, toast, modal, rectInStage } from '../ui/dom.js';
import { sfx, speak, stopSpeech } from '../audio/sfx.js';
import { Editor, staticBlocks } from '../editor/editor.js';
import { VM, W, H } from '../studio/vm.js';
import { createStageView } from '../studio/stage.js';
import { LIBRARY, BACKDROPS, spriteThumb, backdropThumb } from '../studio/art.js';
import { makeSprite, RECIPES, applyRecipe, projectsStore, exportProject, STARTERS, duplicateScripts } from '../studio/projects.js';
import { WORDS, VARS, PHRASES, SAY_WORDS, KEYS_JA, PLACES, MOODS, SOUNDS_JA, NOTES, MESSAGES, studioCondText, studioCondJa, cloneNode, newId } from '../engine/blocks.js';
import { parseProgram } from '../engine/text.js';
import { bitPortrait } from '../art/bit.js';
import { TUTORIALS } from '../studio/tutorials.js';
import { save } from '../progress/save.js';

const KEYS = ['right arrow', 'left arrow', 'up arrow', 'down arrow', 'space'];
const KEYMAP = { ArrowRight: 'right arrow', ArrowLeft: 'left arrow', ArrowUp: 'up arrow', ArrowDown: 'down arrow', ' ': 'space' };
const TABS = [
  { id: 'event', cat: 'event', en: 'Events', ja: 'きっかけ' },
  { id: 'move', cat: 'move', en: 'Motion', ja: 'うごき' },
  { id: 'look', cat: 'look', en: 'Looks', ja: 'みため' },
  { id: 'sound', cat: 'sound', en: 'Sound', ja: 'おと' },
  { id: 'loop', cat: 'loop', en: 'Control', ja: 'せいぎょ' },
  { id: 'logic', cat: 'logic', en: 'If', ja: 'もし' },
  { id: 'num', cat: 'num', en: 'Numbers', ja: 'かず' },
  { id: 'word', cat: 'word', en: 'New words', ja: 'ことば' },
  { id: 'game', cat: 'game', en: 'Game', ja: 'ゲーム' },
];

export function studioScreen(root, params, app) {
  const project = params.project;
  if (!project.sprites.length) project.sprites.push(makeSprite('bit', project));
  project.sprites.forEach((s) => { s.main = s.main || []; s.scripts = s.scripts || []; s.defs = s.defs || []; });
  let selected = project.sprites[0];
  const settings = save.get().settings;
  if (params.tutorial) project.tutorial = { id: params.tutorial, step: 0 };
  const tut = project.tutorial ? TUTORIALS.find((t) => t.id === project.tutorial.id) : null;
  const tutState = { heardFriend: false };

  // ---------- the block palette for the selected sprite ----------
  const others = () => project.sprites.filter((s) => s !== selected).map((s) => s.name);
  const firstOther = () => others()[0];
  const level = {
    studio: true, max: Infinity, par: 0, palette: [], tabs: TABS, words: Object.keys(WORDS),
    paletteFor(tab) {
      const o = firstOther();
      const v = project.vars[0];
      const cond = o ? 'touch:' + o : 'key:space';
      switch (tab) {
        case 'event': return [{ type: 'whenRun' }, { type: 'whenTap' }, { type: 'whenKey', args: { key: 'space' } }, { type: 'whenTouch', args: { who: o || 'the edge' } }, { type: 'whenMsg', args: { msg: 'hello' } }, { type: 'whenClone' }, { type: 'send', args: { msg: 'hello' } }];
        case 'move': return [{ type: 'move', args: { n: 10 } }, { type: 'turnBy', args: { dir: 'right', deg: 15 } }, { type: 'turnBy', args: { dir: 'left', deg: 15 } }, { type: 'point', args: { to: 'right' } }, { type: 'pointAt', args: { at: o || 'the finger' } }, { type: 'goTo', args: { place: 'a random place' } }, { type: 'glide', args: { place: 'a random place', secs: 1 } }, { type: 'changeX', args: { n: 10 } }, { type: 'changeY', args: { n: 10 } }, { type: 'bounce' }, { type: 'hop' }];
        case 'look': return [{ type: 'sayFor', args: { text: 'Hello!', secs: 2 } }, { type: 'sayIt', args: { text: 'Hello!' } }, { type: 'mood', args: { mood: 'happy' } }, { type: 'recolor' }, { type: 'grow' }, { type: 'shrink' }, { type: 'setSize', args: { n: 100 } }, { type: 'hide' }, { type: 'show' }];
        case 'sound': return [{ type: 'playSound', args: { s: 'pop' } }, { type: 'playNote', args: { note: 'do' } }];
        case 'loop': return [{ type: 'wait', args: { secs: 1 } }, { type: 'repeat', args: { n: 10 } }, { type: 'forever' }, { type: 'until', args: { cond } }, { type: 'waitUntil', args: { cond } }, { type: 'clone' }, { type: 'unclone' }, { type: 'stopScript' }, { type: 'stopAll' }];
        case 'logic': return [{ type: 'if', args: { cond } }, { type: 'ifelse', args: { cond } }];
        case 'num': return [{ special: 'newvar', label: 'New variable', ja: 'へんすうを つくる', cat: 'num' },
          ...(v ? [{ type: 'set', args: { v, n: 0 } }, { type: 'changeVar', args: { v, n: 1 } }, { type: 'sayIt', args: { text: v } }] : [{ note: 'へんすう（score など）を つくると ブロックが でるよ', cat: 'num' }])];
        case 'word': return [{ special: 'newword' }];
        case 'game': return [{ type: 'win' }, { type: 'lose' }];
      }
      return [];
    },
    optionsFor(kind) {
      const vars = project.vars;
      switch (kind) {
        case 'key': return KEYS;
        case 'sprite': return [...others(), 'the edge'];
        case 'msg': return [...MESSAGES];
        case 'place': return [...Object.keys(PLACES), ...others()];
        case 'towards': return ['the finger', ...others()];
        case 'dir4': return ['up', 'right', 'down', 'left'];
        case 'mood': return Object.keys(MOODS);
        case 'sound': return Object.keys(SOUNDS_JA);
        case 'note': return NOTES;
        case 'text': return ['Hello!', ...Object.keys(PHRASES), ...vars, '__type'];
        case 'steps': return [1, 2, 3, 5, 10, 15, 20, 30, 50, ...vars, 'random', '__num'];
        case 'deg': return [5, 10, 15, 30, 45, 90, 180, '__num'];
        case 'secs': return [0.1, 0.2, 0.5, 1, 1.5, 2, 3, 5, '__num'];
        case 'count': return [2, 3, 4, 5, 6, 8, 10, 20, 50, ...vars, 'random', '__num'];
        case 'delta': return [-10, -5, -2, -1, 1, 2, 5, 10, ...vars, 'random', '__num'];
        case 'size': return [25, 50, 75, 100, 150, 200, '__num'];
        case 'num0': return [0, 1, 2, 3, 5, 10, ...vars.filter((x) => x), 'random', '__num'];
        case 'var': return vars.length ? vars : null;
        case 'cond': return [
          ...others().map((n) => 'touch:' + n), 'edge', ...KEYS.map((k) => 'key:' + k),
          ...vars.flatMap((v) => ['var:' + v + ':eq:0', 'var:' + v + ':eq:10', 'var:' + v + ':gt:5', '__cmp:' + v]),
        ];
      }
      return null;
    },
    async special(v, chip, ed) {
      if (v.startsWith('__cmp:')) {
        const name = v.slice(6);
        const op = await new Promise((res) => ed.popup(chip, ['is', 'is more than', 'is less than'].map((o) => name + ' ' + o + ' …'), null, 'cmp', (o) => res(o)));
        const n = await ed.keypad(chip, 0);
        if (n === null) return null;
        return 'var:' + name + ':' + (op.includes('more') ? 'gt' : op.includes('less') ? 'lt' : 'eq') + ':' + n;
      }
      return null;
    },
    onSpecial(kind, el, ed) {
      if (kind === 'newvar') {
        const free = Object.keys(VARS).filter((x) => !['steps', 'gems', 'size'].includes(x) && !project.vars.includes(x));
        ed.popup(el, [...free, '__type'], null, 'var', async (name) => {
          if (name === '__type') { name = await ed.typeText(el, ''); if (!name) return; name = name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12); if (!name) return; }
          if (project.vars.includes(name)) return;
          project.vars.push(name);
          sfx.play('snap'); speak(name);
          ed.buildPalette(); changed(); drawMonitors();
        });
      }
    },
  };

  // ---------- layout ----------
  const nameBtn = h('button.projname', { onclick: () => rename() }, project.name);
  const runBtn = btn('run.studiorun', [h('span.runico', { html: PLAY }), h('span', {}, 'Run')], () => start());
  const stopBtn = btn('stopbtn', [h('span.runico', { html: STOP }), h('span', {}, 'Stop')], () => stopRun());
  const codeBtn = btn('icon.ghost', icon('code'), () => { editor.setMode(editor.mode === 'text' ? 'blocks' : 'text'); codeBtn.classList.toggle('on', editor.mode === 'text'); }, { title: 'English code' });
  const hintBtn = btn('icon.ghost', h('span.kana', {}, 'あ'), () => { settings.hints = !settings.hints; save.write(); document.getElementById('stage').classList.toggle('hints', settings.hints); hintBtn.classList.toggle('on', settings.hints); });
  hintBtn.classList.toggle('on', settings.hints);
  const soundBtn = btn('icon.ghost', icon(settings.sfx ? 'sound' : 'mute'), () => { settings.sfx = settings.voice = !settings.sfx; save.write(); sfx.apply(settings); soundBtn.replaceChildren(icon(settings.sfx ? 'sound' : 'mute')); });
  const ideasBtn = btn('ghost.ideas', [icon('hint'), h('span', {}, 'Ideas'), h('small', {}, 'アイデア')], () => showIdeas());
  const starter = STARTERS.find((s) => s.id === project.starter);
  const challengeBtn = starter ? btn('ghost.ideas', [h('span.flag', {}, '🏁'), h('span', {}, 'Challenges')], () => showChallenges()) : null;
  const top = h('div.topbar',
    btn('icon.back', icon('back'), () => { saveNow(); app.go('studioHome'); }),
    h('div.makepill', {}, 'Make'), nameBtn,
    h('div.spacer'), runBtn, stopBtn, h('div.tbsep'), ideasBtn, challengeBtn,
    btn('icon.ghost', icon('full'), () => toggleBig(), { title: 'big stage' }),
    btn('icon.ghost', icon('download'), () => { saveNow(); exportProject(project); toast('ファイルに ほぞん しました（Download）'); }, { title: 'save as a file' }),
    codeBtn, hintBtn, soundBtn, btn('icon.ghost', icon('help'), () => showHelp()));

  const paletteEl = h('div.palette');
  const wsEl = h('div.ws.studiows');
  const undoBtn = btn('tool', [icon('undo'), h('span', {}, 'Undo')], () => editor.undo());
  const wsHead = h('div.panel-label.wshead', h('span.whose', {}), h('small', {}, 'の プログラム'));
  const codePanel = h('div.codepanel.studiocode',
    h('div.palwrap', h('div.panel-label', {}, 'Blocks', h('small', {}, 'ブロック')), paletteEl),
    h('div.wswrap', wsHead, wsEl, h('div.runbar.studiobar', undoBtn, h('div.wsnote', {}, h('b', {}, 'Tip: '), 'when … の ブロックの したに つなげよう'))));

  const canvas = h('canvas');
  const monitors = h('div.monitors');
  const endBanner = h('div.endbanner.hidden');
  const dpad = h('div.dpad.hidden', ...['up arrow', 'left arrow', 'space', 'right arrow', 'down arrow'].map((k) => {
    const b = h('button.dp.' + k.split(' ')[0], {}, { 'up arrow': '▲', 'down arrow': '▼', 'left arrow': '◀', 'right arrow': '▶', space: '●' }[k]);
    const up = () => { vm.keyUp(k); b.classList.remove('on'); };
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); b.setPointerCapture?.(e.pointerId); vm.keyDown(k); b.classList.add('on'); });
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    return b;
  }));
  const stageBox = h('div.stagebox', canvas, monitors, endBanner, dpad);
  const stageWrap = h('div.stagewrap', stageBox);
  const tray = h('div.tray');
  const info = h('div.spriteinfo');
  const tutCard = h('div.tutcard');
  const right = h('div.studioright', h('div.stagerow', stageWrap, tut ? tutCard : info), tray);
  const shell = h('div.studio', top, h('div.studiobody', codePanel, right));
  root.append(shell);

  // ---------- VM + stage ----------
  let vm = new VM(project, hooks());
  function hooks() {
    return {
      sound: (n) => sfx.play(SOUND_MAP[n] || 'pop'),
      note: (hz) => sfx.note(hz),
      say: (text, inst) => { if (inst && inst.kind !== 'bit') tutState.heardFriend = true; if (settings.voice && text.length < 60) speak(text); },
      end: (kind) => showEnd(kind),
    };
  }
  const view = createStageView(canvas);
  function fitStage() {
    const r = stageWrap.getBoundingClientRect(), s = rectInStage(stageWrap);
    void r;
    const w = Math.min(s.w, s.h * 4 / 3), hgt = w * 3 / 4;
    stageBox.style.width = w + 'px'; stageBox.style.height = hgt + 'px';
    view.resize();
  }
  const ro = new ResizeObserver(() => fitStage());
  ro.observe(stageWrap);

  let last = performance.now(), raf = 0, alive = true, glowT = 0, tutCheckT = 0;
  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (vm.running) vm.step(dt);
    view.draw(vm, { bg: project.bg, selected, editing: !vm.running && !vm.ended, now });
    if (now - glowT > 90) {
      glowT = now;
      const ids = new Set();
      if (vm.running) {
        for (const t of vm.threads) if (t.inst.base === selected && t.cur) ids.add(t.cur);
        for (const id in vm.lit) if (vm.time - vm.lit[id] < 0.35) ids.add(id); // blocks that just ran (e.g. an if whose arrow key is held)
      }
      editor.glow(ids);
      updateMonitors();
      runBtn.classList.toggle('going', vm.running);
      if (tut && now - (tutCheckT || 0) > 250) { tutCheckT = now; checkTutorial(); }
    }
    raf = requestAnimationFrame(frame);
  }

  // ---------- editor ----------
  const editor = new Editor({ palette: paletteEl, workspace: wsEl, level, program: selected, onChange: changed });
  let saveTimer = 0;
  function changed() {
    clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 600);
    if (!vm.running) { vm.reset(); }
    updateDpad();
  }
  function saveNow() { clearTimeout(saveTimer); if (!projectsStore.save(project)) toast('ほぞん できませんでした', 'warn'); }

  // ---------- running ----------
  function start() {
    sfx.unlock(); sfx.play('run');
    endBanner.className = 'endbanner hidden';
    vm.start();
    shell.classList.add('is-running');
  }
  function stopRun() {
    vm.stop(); stopSpeech();
    shell.classList.remove('is-running');
    endBanner.className = 'endbanner hidden';
    editor.glow(new Set());
  }
  function showEnd(kind) {
    shell.classList.remove('is-running');
    sfx.play(kind === 'win' ? 'win' : 'fail');
    speak(kind === 'win' ? 'You win!' : 'Game over');
    endBanner.className = 'endbanner ' + kind;
    endBanner.replaceChildren(h('div.endtitle', {}, kind === 'win' ? 'You win!' : 'Game over'), h('div.endja', {}, kind === 'win' ? 'かった！' : 'ゲームオーバー'),
      btn('primary.small', [icon('retry'), h('span', {}, 'Play again')], () => start()));
  }

  // ---------- stage pointer: tap sprites when running, drag them when editing ----------
  canvas.addEventListener('pointerdown', (e) => {
    const p = view.toStage(e.clientX, e.clientY);
    if (vm.running) { vm.tap(p.x, p.y); return; }
    const hit = [...vm.insts].reverse().find((i) => !i.isClone && Math.hypot(i.x - p.x, i.y - p.y) < vm.radius(i) + 10);
    if (!hit) return;
    select(hit.base);
    const base = hit.base, off = { x: base.x - p.x, y: base.y - p.y };
    canvas.setPointerCapture(e.pointerId);
    const move = (ev) => { const q = view.toStage(ev.clientX, ev.clientY); base.x = clamp(Math.round(q.x + off.x), 0, W); base.y = clamp(Math.round(q.y + off.y), 0, H); hit.x = base.x; hit.y = base.y; drawInfo(); };
    const up = () => { canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); changed(); };
    canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up);
  });
  canvas.addEventListener('pointermove', (e) => { const p = view.toStage(e.clientX, e.clientY); vm.movePointer(p.x, p.y); });
  const onKey = (e) => {
    if (e.target.closest?.('input, textarea')) return;
    const k = KEYMAP[e.key];
    if (!k) return;
    if (vm.running) e.preventDefault();
    if (e.type === 'keydown') vm.keyDown(k); else vm.keyUp(k);
  };
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);

  // ---------- sprites, backdrop, variables ----------
  function select(s) {
    if (selected === s) return;
    selected = s; s.main = s.main || [];
    editor.setTarget(s);
    drawTray(); drawInfo();
    wsHead.querySelector('.whose').textContent = s.name;
    sfx.play('pick');
  }
  function drawTray() {
    const cards = project.sprites.map((s) => {
      const card = h('button.spritecard' + (s === selected ? '.on' : ''), { onclick: () => select(s) },
        spriteThumb(s.kind, 64, { hue: s.hue }), h('span', {}, s.name), s.scripts.length ? h('i.count', {}, String(s.scripts.length)) : null);
      return card;
    });
    tray.replaceChildren(
      h('button.bgcard', { onclick: () => pickBackdrop() }, backdropThumb(project.bg, 96), h('span', {}, 'Backdrop'), h('small', {}, BACKDROPS[project.bg]?.ja)),
      h('div.traysep'),
      ...cards,
      h('button.spritecard.add', { onclick: () => pickSprite() }, icon('plus'), h('span', {}, 'Add'), h('small', {}, 'ついか')));
    wsHead.querySelector('.whose').textContent = selected ? selected.name : '';
  }
  function drawInfo() {
    if (!selected) { info.replaceChildren(); return; }
    const s = selected;
    info.replaceChildren(
      h('div.infohead', spriteThumb(s.kind, 56, { hue: s.hue }), h('div', {}, h('b', {}, s.name), h('small', {}, LIBRARY[s.kind].ja))),
      h('div.inforow', {}, h('span', {}, 'x'), h('b', {}, String(Math.round(s.x))), h('span', {}, 'y'), h('b', {}, String(Math.round(s.y)))),
      h('div.infolabel', {}, 'Size', h('small', {}, 'おおきさ')),
      h('div.inforow.btns', {}, btn('mini', '−', () => { s.size = Math.max(20, s.size - 20); changed(); drawInfo(); }), h('b', {}, s.size + '%'), btn('mini', '+', () => { s.size = Math.min(300, s.size + 20); changed(); drawInfo(); })),
      h('div.infolabel', {}, 'Start', h('small', {}, 'はじめ')),
      h('div.inforow.btns', {}, btn('mini' + (s.visible ? '.on' : ''), s.visible ? 'Show' : 'Hide', () => { s.visible = !s.visible; changed(); drawInfo(); })),
      h('div.inforow.btns', {}, btn('mini', [icon('copy')], () => duplicateSprite(s), { title: 'copy' }), btn('mini.danger', [icon('trash')], () => deleteSprite(s), { title: 'delete' })));
  }
  function pickSprite() {
    const grid = h('div.libgrid', ...Object.entries(LIBRARY).map(([kind, L]) => h('button.libitem', {
      onclick: () => {
        const sp = makeSprite(kind, project, { x: 60 + Math.round(Math.random() * 360), y: 60 + Math.round(Math.random() * 240) });
        sp.main = [];
        project.sprites.push(sp);
        m.close(); vm.reset(); select(sp); drawTray(); changed(); speak(L.name); sfx.play('snap');
      },
    }, spriteThumb(kind, 84), h('b', {}, L.name), h('small', {}, L.ja))));
    const m = modal(h('div.libmodal', h('h2.mtitle', {}, 'Add a sprite', h('small', {}, 'キャラクターを えらぼう')), grid), { cls: 'libcard' });
  }
  function pickBackdrop() {
    const grid = h('div.libgrid.bgs', ...Object.entries(BACKDROPS).map(([name, B]) => h('button.libitem' + (name === project.bg ? '.on' : ''), {
      onclick: () => { project.bg = name; m.close(); drawTray(); changed(); sfx.play('snap'); speak(B.en); },
    }, backdropThumb(name, 150), h('b', {}, B.en), h('small', {}, B.ja))));
    const m = modal(h('div.libmodal', h('h2.mtitle', {}, 'Choose a backdrop', h('small', {}, 'はいけいを えらぼう')), grid), { cls: 'libcard' });
  }
  function duplicateSprite(s) {
    const sp = makeSprite(s.kind, project, { x: Math.min(W, s.x + 40), y: s.y, dir: s.dir, size: s.size });
    sp.scripts = duplicateScripts(s.scripts);
    sp.defs = s.defs.map((d) => ({ id: newId(), name: d.name, body: d.body.map(cloneNode) }));
    sp.main = [];
    project.sprites.push(sp);
    vm.reset(); select(sp); drawTray(); changed();
  }
  function deleteSprite(s) {
    if (project.sprites.length <= 1) { toast('キャラクターは 1つ いるよ', 'warn'); return; }
    project.sprites = project.sprites.filter((x) => x !== s);
    sfx.play('poof');
    vm.reset(); selected = null; select(project.sprites[0]); drawTray(); changed();
  }
  function drawMonitors() { monitors.replaceChildren(...project.vars.map((v) => h('div.monitor', { 'data-v': v }, h('span', {}, v), h('b', {}, '0')))); }
  function updateMonitors() {
    for (const el of monitors.children) { const v = el.dataset.v, b = el.querySelector('b'), val = String(vm.vars[v] ?? 0); if (b.textContent !== val) b.textContent = val; }
  }
  function usesKeys() {
    return project.sprites.some((s) => JSON.stringify(s.scripts).match(/"key"|key:/));
  }
  function updateDpad() { dpad.classList.toggle('hidden', !usesKeys()); }
  function toggleBig() { shell.classList.toggle('big'); requestAnimationFrame(fitStage); }
  function rename() {
    editor.typeText(nameBtn, project.name).then((v) => { if (v) { project.name = v.slice(0, 30); nameBtn.textContent = project.name; saveNow(); } });
  }

  // ---------- ideas, challenges, help ----------
  function showIdeas() {
    const cards = RECIPES.map((r) => {
      const other = project.sprites.find((s) => s !== selected)?.name || 'the finger';
      const preview = staticBlocks(parseProgram(r.code(other), { studio: true }), level);
      return h('button.recipe', {
        onclick: () => {
          const added = applyRecipe(project, selected, r);
          m.close(); editor.setTarget(selected); drawMonitors(); drawTray(); changed();
          sfx.play('snap'); speak(r.en);
          toast(`「${r.ja}」を ${selected.name} に いれたよ`);
          void added;
        },
      }, h('div.rtitle', {}, h('b', {}, r.en), h('small', {}, r.ja)), h('div.rprev', preview));
    });
    const m = modal(h('div.ideas', h('h2.mtitle', {}, 'Ideas for ' + selected.name, h('small', {}, 'タップすると プログラムが はいるよ。なかみを かえてみよう！')), h('div.recipegrid', ...cards)), { cls: 'ideascard' });
  }
  function showChallenges() {
    project.done = project.done || [];
    const list = h('div.challist', ...starter.challenges.map(([en, ja], i) => {
      const row = h('button.chal' + (project.done.includes(i) ? '.done' : ''), {
        onclick: () => { const k = project.done.indexOf(i); if (k >= 0) project.done.splice(k, 1); else { project.done.push(i); sfx.play('star'); } row.classList.toggle('done'); saveNow(); },
      }, h('span.box', {}, '✓'), h('span.ctxt', {}, h('b', {}, en), h('small', {}, ja)));
      return row;
    }));
    modal(h('div.challenges', h('h2.mtitle', {}, 'Remix challenges', h('small', {}, 'できたら チェック！')), h('p.cabout', {}, starter.aboutJa), list), { cls: 'ideascard' });
  }
  function showHelp() {
    const hm = modal(h('div.intro',
      h('div.introbit', bitPortrait(160, { mood: 'happy' })),
      h('div.intromain',
        h('h2', {}, 'Make anything!'), h('div.introja', {}, 'じぶんの ゲームや おはなしを つくろう'),
        h('ul.introlines',
          h('li', {}, 'したの トレイで キャラクターを えらぶ。＋ で ふやせるよ。'),
          h('li', {}, '「きっかけ」の ブロック（when I press Run など）から スクリプトを はじめる。'),
          h('li', {}, 'その したに ブロックを つなげて、▶ Run！ ぜんぶの スクリプトが いっしょに うごくよ。'),
          h('li', {}, 'こまったら 💡 Ideas。タップすると プログラムの れいが はいるよ。')),
        h('div.introbtns', btn('primary', [h('span', {}, 'OK!'), h('small', {}, 'わかった')], () => hm.close())))), { cls: 'introcard' });
  }

  // ---------- guided tutorial ----------
  let stepSince = Date.now();
  const setCard = (...kids) => tutCard.replaceChildren(...kids.filter(Boolean));
  function drawTutorial(justDone) {
    if (!tut) return;
    const st = project.tutorial;
    const n = tut.steps.length;
    stepSince = Date.now();
    if (st.step >= n) {
      const skipped = st.skipped || 0;
      setCard(
        h('div.tuthead', {}, h('b', {}, tut.en), h('small', {}, tut.ja)),
        skipped
          ? h('div.tutdone', bitPortrait(110, { mood: 'normal' }), h('b', {}, 'Almost! You skipped ' + skipped + (skipped > 1 ? ' steps.' : ' step.')), h('span', {}, 'とばした ステップが あるよ。もういちど じぶんで ためしてみよう。'))
          : h('div.tutdone', bitPortrait(110, { mood: 'happy' }), h('b', {}, tut.done.en), h('span', {}, tut.done.ja)),
        btn('primary.small', [h('span', {}, 'Keep making'), h('small', {}, 'つづける')], () => { delete project.tutorial; saveNow(); app.go('studio', { project }); }));
      return;
    }
    const step = tut.steps[st.step];
    setCard(
      h('div.tuthead', {}, h('b', {}, tut.en), h('small', {}, tut.ja)),
      h('div.tutdots', ...tut.steps.map((_, i) => h('i' + (i < st.step ? '.done' : i === st.step ? '.now' : '')))),
      h('div.tutstep' + (justDone ? '.fresh' : ''), {}, h('span.tutnum', {}, 'Step ' + (st.step + 1) + ' / ' + n), h('b', {}, step.en), h('span.tutja', {}, step.ja)),
      step.code ? h('div.tutcode', staticBlocks(parseProgram(dedent(step.code), { studio: true }), level)) : null,
      step.tip ? h('div.tuttip', {}, h('b', {}, '💡 ' + step.tip), h('span', {}, step.tipJa || '')) : null,
      step.real ? h('div.tutlive', {}, vm.running ? 'Playing… keep going!' : 'Press ▶ Run to play') : null,
      h('button.tutskip', { onclick: () => { st.step++; st.skipped = (st.skipped || 0) + 1; saveNow(); drawTutorial(); } }, 'skip ›'));
    if (justDone) speak(step.en);
  }
  function checkTutorial() {
    const st = project.tutorial;
    if (!st || st.step >= tut.steps.length) return;
    // a stuck kid gets a hint after a while, and a skip button after a longer while
    const waited = Date.now() - stepSince;
    tutCard.classList.toggle('showtip', waited > 12000);
    tutCard.classList.toggle('showskip', waited > 40000);
    const live = tutCard.querySelector('.tutlive');
    if (live) live.textContent = vm.running ? 'Playing… keep going!' : (vm.ended === 'lose' ? 'Game over. Press ▶ Run to try again' : 'Press ▶ Run to play');
    let ok = false;
    try { ok = tut.steps[st.step].check(project, vm, tutState); } catch (e) { ok = false; }
    if (!ok) return;
    st.step++;
    sfx.play('star'); speak(st.step >= tut.steps.length ? tut.done.en : 'Great!');
    saveNow();
    setTimeout(() => drawTutorial(true), 350);
  }

  // ---------- go ----------
  drawTray(); drawInfo(); drawMonitors(); updateDpad(); drawTutorial(true);
  raf = requestAnimationFrame(frame);
  if (!save.seen('studio:help') && !tut) { save.markSeen('studio:help'); setTimeout(showHelp, 300); }
  window.__studio = { project, get vm() { return vm; }, editor, start, stop: stopRun, select: (name) => select(project.sprites.find((s) => s.name === name)),
    setCode: (name, code) => { const sp = project.sprites.find((s) => s.name === name); const pr = parseProgram(code, { studio: true }); sp.scripts = pr.scripts || []; sp.defs = pr.defs || []; select(sp); changed(); } };

  return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); vm.stop(); saveNow(); stopSpeech(); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); };
}

// remove the indentation shared by every line, so a snippet can be shown on its own
function dedent(code) {
  const lines = code.split('\n').filter((l) => l.trim());
  const k = Math.min(...lines.map((l) => l.match(/^ */)[0].length));
  return code.split('\n').map((l) => l.slice(k)).join('\n');
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SOUND_MAP = { pop: 'press', jump: 'jumpfx', coin: 'gem', boing: 'bump', laser: 'laser', win: 'win', oops: 'fail', drum: 'drum', magic: 'star' };
const PLAY = '<svg viewBox="0 0 48 48"><path d="M15 9 39 24 15 39z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>';
const STOP = '<svg viewBox="0 0 48 48"><rect x="11" y="11" width="26" height="26" rx="5" fill="currentColor"/></svg>';
