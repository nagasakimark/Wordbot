// The play screen: code on the left, Bit's island on the right.
import { h, btn, icon, toast, modal, wait } from '../ui/dom.js';
import { sfx, speak, stopSpeech } from '../audio/sfx.js';
import { Editor, staticBlocks } from '../editor/editor.js';
import { createBoard, mapThumb, CANCEL } from '../play/board.js';
import { runProgram } from '../engine/run.js';
import { blockSpoken, cloneProgram, countBlocks, VARS } from '../engine/blocks.js';
import { printProgram, parseProgram } from '../engine/text.js';
import { LEVELS } from '../content/levels.js';
import { INTROS } from '../content/intros.js';
import { save } from '../progress/save.js';
import { bitPortrait } from '../art/bit.js';

const SPEEDS = [{ f: 1.7, label: '🐢', ja: 'ゆっくり' }, { f: 1, label: '🚶', ja: 'ふつう' }, { f: 0.45, label: '🐇', ja: 'はやい' }];

const FAIL = {
  fall: ['Oops! Bit fell off the island.', 'ビットが おちちゃった！ どこで まがれば いいかな？'],
  bump: ['Bonk! Something is in the way.', 'いわや きに ぶつかった。みちを よく みてね。'],
  nogem: ['There is no gem here.', 'ここには ジェムが ないよ。ジェムの うえで ひろおう。'],
  nopad: ['Bit can only paint white tiles.', 'しろい タイルの うえで「paint」しよう。'],
  novar: ["Bit doesn't know that number yet.", 'さきに「set … to …」で かずを きめよう。'],
  noword: ["Bit doesn't know that word.", 'その ことばの やりかたを おしえてね。'],
  tired: ['Bit is tired! The loop never ends.', 'おわらない くりかえしかも？ じょうけんを みなおそう。'],
  home: ['Bit is not home.', 'プログラムの さいごに、いえに ついて いないよ。'],
  gems: ['There are more gems.', 'まだ ジェムが のこっているよ。'],
  paint: ['The picture is not right yet.', '● の いろと ちがう タイルが あるよ。'],
  nosay: ["Bit didn't say the answer.", 'さいごに「say」で こたえを いおう。'],
  wrongsay: ['', 'かぞえかたを みなおそう。'],
  word: ['Teach Bit a new word. Use it twice.', 'あたらしい ことばを つくって、2かい つかおう。'],
};

export function playScreen(root, { id }, app) {
  const level = LEVELS.find((l) => l.id === id) || LEVELS[0];
  const settings = save.get().settings;
  let mapIndex = 0, running = false, token = 0, stepping = false, stepGate = null, skipGate = false, speedI = settings.speed ?? 1;
  const mapState = level.maps.map(() => null); // null | 'ok' | 'fail'

  // ---------- program ----------
  const saved = save.program(level.id);
  let program;
  try { program = saved ? JSON.parse(saved) : cloneProgram(level.startProgram); } catch (e) { program = cloneProgram(level.startProgram); }

  // ---------- layout ----------
  const counter = h('div.counter');
  const codeBtn = btn('icon.ghost', icon('code'), () => toggleCode(), { title: 'English code' });
  const hintBtn = btn('icon.ghost.hintbtn', h('span.kana', {}, 'あ'), () => toggleHints(), { title: 'ヒント' });
  const soundBtn = btn('icon.ghost', icon(settings.sfx ? 'sound' : 'mute'), () => toggleSound(), { title: 'sound' });
  const helpBtn = btn('icon.ghost', icon('help'), () => showHelp(), { title: 'help' });
  const top = h('div.topbar',
    btn('icon.back', icon('back'), () => app.go('worlds', { world: level.world.id })),
    h('div.lvpill', { style: { '--c': worldColor(level.world.id) } }, level.id),
    h('div.lvtitle', {}, h('b', {}, level.title), h('small', {}, level.ja)),
    h('div.spacer'),
    counter, codeBtn, hintBtn, soundBtn, helpBtn);

  const paletteEl = h('div.palette');
  const wsEl = h('div.ws');
  const runBtn = btn('run', [h('span.runico', { html: '' }), h('span.runtxt', {}, 'Run')], () => (running ? stop() : run(false)));
  const stepBtn = btn('tool.step', [icon('step'), h('span', {}, 'Step')], () => step());
  const undoBtn = btn('tool', [icon('undo'), h('span', {}, 'Undo')], () => { if (!running) editor.undo(); });
  const clearBtn = btn('tool', [icon('trash'), h('span', {}, 'Clear')], () => clearAll());
  const speedBtn = btn('tool.speed', [h('span.sp', {}, SPEEDS[speedI].label), h('span.splabel', {}, 'Speed')], () => cycleSpeed());
  const runbar = h('div.runbar', runBtn, stepBtn, speedBtn, undoBtn, clearBtn);
  const codePanel = h('div.codepanel', h('div.palwrap', h('div.panel-label', {}, 'Blocks', h('small', {}, 'ブロック')), paletteEl),
    h('div.wswrap', h('div.panel-label', {}, 'Program', h('small', {}, 'プログラム')), wsEl, runbar));

  const goalCard = h('div.goalcard', { onclick: () => speak(level.goalEn) },
    h('div.goal-en', {}, icon('sound', 'mini'), h('span', {}, level.goalEn)),
    h('div.goal-ja', {}, level.goalJa));
  const tabs = h('div.maptabs');
  const hud = h('div.hud');
  const banner = h('div.banner.hidden');
  const canvas = h('canvas.boardcv');
  const boardWrap = h('div.boardwrap', canvas);
  const stageCol = h('div.stagecol', h('div.stagehead', goalCard, tabs), h('div.boardbox', boardWrap, hud, banner));

  root.append(h('div.play', top, h('div.playbody', codePanel, stageCol)));

  // ---------- board + editor ----------
  const board = createBoard(canvas);
  board.setMap(level, 0);
  board.setSpeed(SPEEDS[speedI].f);
  const ro = new ResizeObserver(() => board.resize());
  ro.observe(boardWrap);

  const editor = new Editor({ palette: paletteEl, workspace: wsEl, level, program, onChange: changed });
  function changed() {
    updateCounter();
    save.setProgram(level.id, JSON.stringify(editor.program));
    if (!running) { hideBanner(); board.reset(); resetHud(); mapState.fill(null); renderTabs(); }
  }
  function updateCounter() {
    const n = editor.count();
    counter.replaceChildren(
      h('span.cnum' + (n > level.max ? '.over' : ''), {}, String(n)),
      h('span.cof', {}, '/ ' + level.max),
      h('span.cpar', {}, h('span.s', {}, '★★★'), ' ' + level.par + 'こ いか'));
    counter.classList.toggle('good', n > 0 && n <= level.par);
  }
  updateCounter();

  // ---------- map tabs (tests) ----------
  function renderTabs() {
    tabs.replaceChildren();
    if (level.maps.length < 2) return;
    tabs.append(h('span.tablabel', {}, 'Maps', h('small', {}, 'ぜんぶ クリア！')));
    level.maps.forEach((_, i) => {
      const st = mapState[i];
      const t = h('button.maptab' + (i === mapIndex ? '.on' : '') + (st ? '.' + st : ''), {
        onclick: () => { if (running) return; mapIndex = i; board.setMap(level, i); resetHud(); hideBanner(); renderTabs(); sfx.play('pick'); },
      }, mapThumb(level, i, 54), h('span', {}, String(i + 1)), st === 'ok' ? icon('check', 'tick') : st === 'fail' ? icon('cross', 'tick') : null);
      tabs.append(t);
    });
  }
  renderTabs();

  // ---------- HUD (gems / variables) ----------
  let hudVals = {};
  function resetHud() {
    hudVals = {};
    const m = level.parsed[mapIndex];
    const kids = [];
    if (m.gems) kids.push(h('div.hudbox.gem', {}, h('i.gemico'), h('b', { 'data-h': 'gems' }, '0'), h('span', {}, '/ ' + m.gems)));
    for (const v of level.vars || []) kids.push(h('div.hudbox.var', {}, h('span.vname', {}, v), h('b', { 'data-h': 'v:' + v }, '—'), h('small', {}, VARS[v])));
    hud.replaceChildren(...kids);
  }
  function setHud(key, val) {
    const el = hud.querySelector(`[data-h="${key}"]`);
    if (!el) return;
    el.textContent = String(val);
    el.animate([{ transform: 'scale(1.5)' }, { transform: 'none' }], { duration: 260 });
  }
  resetHud();

  // ---------- banners ----------
  function showBanner(kind, en, ja, actions = []) {
    banner.className = 'banner ' + kind;
    banner.replaceChildren(h('div.btxt', {}, h('b', {}, en), h('span', {}, ja)), ...actions);
  }
  function hideBanner() { banner.className = 'banner hidden'; }

  // ---------- running ----------
  function setRunning(on) {
    running = on;
    editor.lock(on);
    runBtn.classList.toggle('going', on);
    runBtn.querySelector('.runtxt').textContent = on ? 'Stop' : 'Run';
    runBtn.querySelector('.runico').innerHTML = on ? STOP_SVG : PLAY_SVG;
    root.querySelector('.play').classList.toggle('is-running', on);
  }
  runBtn.querySelector('.runico').innerHTML = PLAY_SVG;

  function stop() {
    token++;
    stepping = false; if (stepGate) { stepGate(); stepGate = null; }
    board.cancel(); board.reset(); stopSpeech();
    editor.clearRun(); resetHud(); hideBanner();
    setRunning(false);
    stepBtn.classList.remove('on');
  }
  function step() {
    if (!running) { run(true); return; }
    if (stepGate) { const g = stepGate; stepGate = null; g(); }
  }
  async function gate(my) {
    if (!stepping) return;
    if (skipGate) { skipGate = false; return; }
    await new Promise((r) => { stepGate = r; });
    if (my !== token) throw CANCEL;
  }

  async function run(stepMode) {
    if (!editor.program.main.length) { toast('ブロックを ならべてから Run！', 'warn'); sfx.play('error'); return; }
    if (editor.count() > level.max) { toast(`ブロックが おおすぎるよ（${level.max}こ まで）`, 'warn'); sfx.play('error'); return; }
    sfx.unlock(); sfx.play('run');
    const my = ++token;
    stepping = stepMode; skipGate = stepMode; stepBtn.classList.toggle('on', stepMode);
    setRunning(true); hideBanner();
    const prog = editor.program;
    const order = level.maps.map((_, i) => i);
    // start with the map on screen, then test the rest
    order.sort((a, b) => (a === mapIndex ? -1 : b === mapIndex ? 1 : a - b));
    mapState.fill(null); renderTabs();
    try {
      for (let k = 0; k < order.length; k++) {
        const mi = order[k];
        if (mi !== mapIndex || k > 0) { mapIndex = mi; board.setMap(level, mi); renderTabs(); await wait(250); }
        else board.reset();
        resetHud();
        const fast = k > 0 ? 0.55 : 1;
        board.setSpeed(SPEEDS[speedI].f * fast);
        const r = runProgram(prog, level, mi);
        const ok = await play(r, my, fast);
        if (my !== token) return;
        mapState[mi] = ok ? 'ok' : 'fail'; renderTabs();
        if (!ok) { failed(r, mi); return; }
        editor.clearRun();
        if (k < order.length - 1) { sfx.play('yes'); await board.wait(400); }
      }
      if (my !== token) return;
      await won();
    } catch (e) {
      if (e !== CANCEL) console.error(e);
    } finally {
      if (my === token) { setRunning(false); stepping = false; stepBtn.classList.remove('on'); }
    }
  }

  // Animate one trace.
  async function play(r, my, fast) {
    const alive = () => { if (my !== token) throw CANCEL; };
    const pace = (ms) => board.wait(ms);
    const loopNow = new Map();
    let calls = [];
    for (const t of r.trace) {
      alive();
      switch (t.k) {
        case 'act': {
          await gate(my);
          editor.setActive(t.id);
          const node = editor.find(t.id)?.node;
          if (node && node.type !== 'say' && speedI < 2 && fast === 1) speak(blockSpoken(node), { rate: 1 });
          for (const ev of t.events) {
            alive();
            switch (ev.t) {
              case 'move': sfx.play('step'); await board.move(ev); break;
              case 'turn': sfx.play('turn'); await board.turn(ev); break;
              case 'bump': sfx.play('bump'); await board.bump(ev); break;
              case 'fall': sfx.play('fall'); await board.fall(ev); break;
              case 'pick': sfx.play('gem'); setHud('gems', ev.got); await board.pick(ev); break;
              case 'paint': sfx.play('paint'); await board.paint(ev); break;
              case 'say': speak(ev.text, { rate: 0.95 }); await board.say(ev.text, 1100); break;
              case 'var': setHud('v:' + ev.name, ev.value); sfx.play('loop'); await pace(380); break;
              case 'oops': break;
            }
          }
          await pace(120);
          break;
        }
        case 'cond':
          await gate(my);
          editor.setActive(t.id);
          editor.badge(t.id, t.v ? '✓' : '✗', t.v ? 'yes' : 'no');
          sfx.play(t.v ? 'yes' : 'no');
          await pace(420);
          break;
        case 'loop':
          loopNow.set(t.id, t.i);
          editor.setActive(t.id);
          editor.badge(t.id, t.n ? `${t.i}/${t.n}` : `${t.i}`, 'loop');
          sfx.play('loop');
          await pace(160);
          break;
        case 'call':
          editor.setActive(t.id);
          editor.defActive(t.def, true); calls.push(t.def);
          await pace(260);
          break;
        case 'done':
          if (t.def) { editor.defActive(t.def, false); calls = calls.filter((d) => d !== t.def); }
          else editor.clearBadge(t.id);
          break;
        case 'end':
          return t.result.ok;
      }
    }
    return r.result.ok;
  }

  function failed(r, mi) {
    const res = r.result;
    if (res.id) editor.markError(res.id);
    sfx.play('fail');
    const [en0, ja] = FAIL[res.reason] || ['Oops!', ''];
    let en = en0;
    if (res.reason === 'wrongsay') en = `Bit said ${res.got}. The answer is ${res.want}.`;
    const where = level.maps.length > 1 ? `マップ ${mi + 1}: ` : '';
    board.oops(res.reason === 'tired' ? 'Zzz…' : 'Oops!', 900);
    if (res.reason === 'fall') board.respawn(level.parsed[mi].bit).catch(() => {});
    speak(en);
    showBanner('bad', en, where + ja, [btn('small.retry', [icon('retry'), h('span', {}, 'Try again')], () => { stop(); })]);
  }

  async function won() {
    sfx.play('win');
    editor.setActive(null);
    speak(level.goal.home ? "I'm home!" : 'I did it!');
    await board.celebrate();
    const n = editor.count();
    const stars = n <= level.par ? 3 : n <= level.par + 2 ? 2 : 1;
    const isNew = save.setStars(level.id, stars);
    void isNew;
    const next = LEVELS[level.index + 1];
    const lastInWorld = level.world.levels[level.world.levels.length - 1] === level;
    const code = h('div.wincode', ...printProgram(editor.program).filter((l) => !l.empty && l.text).slice(0, 10).map((l) => h('div', { style: { '--i': (l.text.match(/^ */)[0].length) / 4 } }, l.text.trim())));
    const m = modal(h('div.win',
      h('div.winbit', bitPortrait(150, { mood: 'happy' })),
      h('div.winmain',
        h('h2.wintitle', {}, ['', 'Good job!', 'Great!', 'Perfect!'][stars]),
        h('div.winstars', ...[1, 2, 3].map((i) => h('span.wstar' + (i <= stars ? '.on' : ''), { style: { animationDelay: (i * 0.15) + 's' } }, '★'))),
        h('p.winmsg', {}, `${n} ブロック で クリア！`, stars < 3 ? h('small', {}, `★3 は ${level.par}こ いか。もっと みじかく できるかな？`) : h('small', {}, 'いちばん みじかい プログラム！')),
        h('div.winlabel', {}, 'Your program in English', h('small', {}, 'えいごの プログラム')), code,
        h('div.winbtns',
          btn('secondary', [icon('retry'), h('span', {}, 'Again')], () => { m.close(); stop(); }),
          btn('secondary', [icon('home'), h('span', {}, 'Map')], () => { m.close(); app.go('worlds', { world: level.world.id }); }),
          lastInWorld ? btn('make', [icon('make'), h('span', {}, 'Make')], () => { m.close(); app.go('studioHome', {}); }) : null,
          next ? btn('primary', [h('span', {}, 'Next'), icon('next')], () => { m.close(); app.go('play', { id: next.id }); }) : null),
        lastInWorld ? h('p.makehint', {}, `World ${level.world.id} クリア！ 「${level.world.idea}」を つかって、Make で じぶんの ゲームを つくってみよう。`) : null)), { cls: 'wincard', dismiss: false });
    [1, 2, 3].forEach((i) => { if (i <= stars) setTimeout(() => sfx.play('star'), 300 + i * 150); });
  }

  // ---------- toolbar actions ----------
  function clearAll() {
    if (running) return;
    editor.snapshot();
    editor.setProgram(cloneProgram(level.startProgram));
    sfx.play('poof');
  }
  function cycleSpeed() {
    speedI = (speedI + 1) % SPEEDS.length;
    settings.speed = speedI; save.write();
    speedBtn.querySelector('.sp').textContent = SPEEDS[speedI].label;
    board.setSpeed(SPEEDS[speedI].f);
    toast(SPEEDS[speedI].ja, 'info', 1000);
  }
  function toggleCode() {
    editor.setMode(editor.mode === 'text' ? 'blocks' : 'text');
    codeBtn.classList.toggle('on', editor.mode === 'text');
    if (editor.mode === 'text') toast('English code: ブロックを えいごの ぶんで みる', 'info', 1800);
  }
  function toggleHints() {
    settings.hints = !settings.hints; save.write();
    document.getElementById('stage').classList.toggle('hints', settings.hints);
    hintBtn.classList.toggle('on', settings.hints);
  }
  hintBtn.classList.toggle('on', settings.hints);
  function toggleSound() {
    settings.sfx = !settings.sfx; settings.voice = settings.sfx; save.write(); sfx.apply(settings);
    soundBtn.replaceChildren(icon(settings.sfx ? 'sound' : 'mute'));
  }
  function showHelp() {
    const key = level.intro || 'welcome';
    showIntro(key, true);
  }
  function showIntro(key, force) {
    const it = INTROS[key];
    if (!it) return;
    if (!force && save.seen('intro:' + key)) return;
    save.markSeen('intro:' + key);
    const body = h('div.intro',
      h('div.introbit', bitPortrait(170, { mood: it.mood || 'ok' })),
      h('div.intromain',
        h('h2', {}, it.en), h('div.introja', {}, it.ja),
        h('ul.introlines', ...it.lines.map((l) => h('li', {}, l))),
        it.code ? h('div.introcode', it.compare ? [h('div.cmp', staticBlocks(parseProgram(it.compare), level)), h('div.cmparrow', {}, '→'), h('div.cmp', staticBlocks(parseProgram(it.code), level))] : staticBlocks(parseProgram(it.code), level)) : null,
        h('div.introbtns', btn('primary', [h('span', {}, 'OK!'), h('small', {}, 'わかった')], () => m.close()))));
    const m = modal(body, { cls: 'introcard' });
    speak(it.en);
  }

  if (level.intro && !/nointro/.test(location.search)) setTimeout(() => showIntro(level.intro, false), 350);
  else setTimeout(() => speak(level.goalEn), 400);

  // keyboard: Enter/space runs, Ctrl+Z undoes
  const onKey = (e) => {
    if (e.target.closest?.('input, textarea')) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); if (!running) editor.undo(); }
    if (e.key === 'Enter' && !document.querySelector('.modal-back')) { e.preventDefault(); running ? stop() : run(false); }
  };
  window.addEventListener('keydown', onKey);

  // test hook
  window.__wb = { editor, level, run: () => run(false), load: (text) => editor.setProgram(parseProgram(text)), get running() { return running; } };

  return () => { token++; board.destroy(); ro.disconnect(); window.removeEventListener('keydown', onKey); stopSpeech(); };
}

const PLAY_SVG = '<svg viewBox="0 0 48 48"><path d="M15 9 39 24 15 39z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>';
const STOP_SVG = '<svg viewBox="0 0 48 48"><rect x="11" y="11" width="26" height="26" rx="5" fill="currentColor"/></svg>';
export const worldColor = (id) => ['#2f7cf6', '#ff9b1a', '#f0468f', '#13b3a0', '#8b5cf6'][(id - 1) % 5];
