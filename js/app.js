/* Word Bot app: screens, block palette/program (tap + drag), and the run loop. */
(function () {
  'use strict';
  const WB = window.WB, core = WB.core, audio = WB.audio, LEVELS = WB.levels, BLOCKS = core.BLOCKS;
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

  const app = $('#app'), canvas = $('#stage'), stageWrap = $('#stageWrap');
  const paletteEl = $('#palette'), programEl = $('#program'), progCol = $('#progCol');
  const renderer = WB.createRenderer(canvas);

  // ---- saved progress (localStorage can be unavailable or empty: always try/catch) ----
  const defaults = { stars: {}, hints: true, sound: true, speed: 1 };
  let save = Object.assign({}, defaults);
  try { const raw = localStorage.getItem('wordbot.v1'); if (raw) save = Object.assign({}, defaults, JSON.parse(raw)); } catch (e) { /* ignore */ }
  function persist() { try { localStorage.setItem('wordbot.v1', JSON.stringify(save)); } catch (e) { /* ignore */ } }
  const params = new URLSearchParams(location.search);
  const UNLOCK_ALL = params.has('unlock');   // teacher shortcut: ?unlock
  const isUnlocked = (id) => UNLOCK_ALL || id === 1 || (save.stars[id - 1] | 0) > 0;

  // ---- state ----
  let level = null, program = [], running = false, runToken = 0;
  let stepMode = false, stepTokens = 0, stepWaiter = null;
  const SPEEDS = [1.7, 1, 0.45];

  // ---- messages ----
  const FAIL = {
    wall: ['Bonk! A wall.', 'かべに ぶつかったよ。ブロックを なおそう！'],
    edge: ['Oops! The edge.', 'ここから さきには いけないよ。'],
    door: ['Bonk! A door.', 'ドアが しまっているよ。'],
    friend: ['Oops! A friend.', 'ともだちに ぶつかっちゃった！'],
    hole: ['Oops! Splash!', 'おちちゃった！ ジャンプを つかおう！'],
    nocoin: ['No coin here.', 'ここには コインが ないよ。'],
    nokey: ['No key here.', 'ここには かぎが ないよ。'],
    nodoor: ['No door here.', 'ちかくに ドアが ないよ。'],
    needkey: ['You need the key.', 'ドアを あけるには かぎが ひつよう！'],
    notat: ['Not there yet!', 'まだ ほしに ついていないよ。ブロックを みなおそう！'],
    needcoin: ['The star is asleep.', 'ほしは ねむっているよ。コインを とろう！'],
    needfriend: ['The star is asleep.', 'ほしは ねむっているよ。ともだちに あいさつしよう！'],
  };

  // ---- helpers ----
  function fit() {
    const r = stageWrap.getBoundingClientRect();
    const s = Math.max(0.2, Math.min(r.width / renderer.size.w, r.height / renderer.size.h));
    canvas.style.width = Math.floor(renderer.size.w * s) + 'px';
    canvas.style.height = Math.floor(renderer.size.h * s) + 'px';
  }
  window.addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stageWrap);

  let bannerTimer = null;
  function showBanner(en, ja, kind, autoHideMs) {
    $('#bannerEn').textContent = en; $('#bannerJa').textContent = ja || '';
    const b = $('#banner'); b.className = 'banner' + (kind ? ' ' + kind : ''); b.hidden = false;
    clearTimeout(bannerTimer);
    if (autoHideMs) bannerTimer = setTimeout(hideBanner, autoHideMs);
  }
  function hideBanner() { clearTimeout(bannerTimer); $('#banner').hidden = true; }

  function starsHtml(n, big) {
    const f = document.createDocumentFragment();
    for (let i = 1; i <= 3; i++) f.appendChild(el('span', i <= n ? '' : 'off', '★'));
    return f;
  }

  // ---- level select ----
  function buildMenu() {
    const grid = $('#levelGrid'); grid.innerHTML = '';
    LEVELS.forEach((lv) => {
      const b = el('button', 'lvcard'); b.disabled = !isUnlocked(lv.id);
      b.appendChild(el('div', 'num', String(lv.id)));
      b.appendChild(el('div', 't', lv.title));
      b.appendChild(el('div', 'hint j', lv.ja));
      const st = el('div', 'stars');
      if (b.disabled) st.textContent = '🔒'; else st.appendChild(starsHtml(save.stars[lv.id] | 0));
      b.appendChild(st);
      b.addEventListener('click', () => { audio.unlock(); startLevel(lv.id); });
      grid.appendChild(b);
    });
  }
  function showMenu() { cancelRun(); buildMenu(); $('#dialog').hidden = true; $('#menu').hidden = false; $('#levelTitle').textContent = ''; }

  // ---- level start ----
  function startLevel(id) {
    cancelRun();
    level = LEVELS[id - 1]; program = [];
    $('#menu').hidden = true; $('#dialog').hidden = true;
    renderer.reset(level); fit(); hideBanner();
    const lt = $('#levelTitle'); lt.textContent = 'Level ' + level.id + ': ' + level.title;
    lt.appendChild(el('small', 'hint', level.ja));
    $('#goalEn').textContent = level.goal; $('#goalJa').textContent = level.goalJa;
    const nw = $('#newWords'); nw.innerHTML = '';
    const words = level.newBlocks.map((id) => core.blockEnglish(core.defaultItem(id, level)));
    if (level.tip === 'number') words.push('go right 3');
    if (words.length) {
      nw.appendChild(el('span', 'lbl', 'NEW'));
      words.forEach((w) => { const p = el('button', 'pill', '🔊 ' + w); p.addEventListener('click', () => audio.speak(w.replace(/"/g, ''))); nw.appendChild(p); });
    }
    $('#btnStep').classList.toggle('pulse', level.tip === 'step');
    buildPalette(); renderProgram();
    setTimeout(() => audio.speak(level.goal.replace(/"/g, '')), 250);
  }

  // ---- blocks ----
  function blockEl(item, pal) {
    const b = BLOCKS[item.id];
    const e = el('div', 'block ' + b.color + (pal ? ' pal' : ''));
    const txt = el('div', 'txt'), en = el('div', 'en');
    en.appendChild(el('span', 'w', b.word));
    if (b.hasNum && level.numMax > 1) en.appendChild(el('span', 'chip', String(item.n)));
    if (b.hasWord) en.appendChild(el('span', 'chip wordchip', '"' + item.word + '"'));
    txt.appendChild(en); txt.appendChild(el('div', 'hint', core.blockJa(item)));
    e.appendChild(txt);
    if (pal) {
      e.dataset.pal = item.id; e.tabIndex = 0; e.setAttribute('role', 'button');
      if (b.kind === 'move' && level.blocks.filter((id) => BLOCKS[id].kind === 'move').length >= 2) e.classList.add('half');
      if (level.newBlocks.indexOf(item.id) >= 0) e.classList.add('is-new');
      e.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); addBlock(core.defaultItem(item.id, level), program.length); } });
    } else {
      const del = el('button', 'del', '×'); del.setAttribute('aria-label', 'delete'); e.appendChild(del);
    }
    return e;
  }
  function buildPalette() {
    paletteEl.innerHTML = '';
    level.blocks.forEach((id) => paletteEl.appendChild(blockEl(core.defaultItem(id, level), true)));
  }
  const blockEls = () => Array.from(programEl.children).filter((c) => c.classList.contains('block'));

  function renderProgram() {
    programEl.innerHTML = '';
    if (!program.length) {
      const m = el('div', 'empty', 'ここに ブロックを ならべよう'); m.appendChild(el('small', '', 'Tap a block, or drag it here.'));
      programEl.appendChild(m);
    }
    program.forEach((item) => programEl.appendChild(blockEl(item, false)));
    const cnt = $('#count'); cnt.textContent = program.length + ' / ' + level.maxBlocks; cnt.classList.remove('full');
  }
  function programChanged() {
    renderer.reset(level); hideBanner(); renderProgram();   // stage goes back to the start so it matches the program
  }
  function addBlock(item, index) {
    if (running) return false;
    if (program.length >= level.maxBlocks) {
      const cnt = $('#count'); cnt.classList.remove('full'); void cnt.offsetWidth; cnt.classList.add('full');
      showBanner('Too many blocks!', 'ブロックが いっぱいだよ。', 'info', 2200); audio.sfx.hmm();
      return false;
    }
    program.splice(Math.max(0, Math.min(index, program.length)), 0, Object.assign({}, item));
    programChanged(); audio.sfx.drop(); audio.speak(core.blockSpoken(item));
    programEl.scrollTop = index >= program.length - 1 ? programEl.scrollHeight : programEl.scrollTop;
    return true;
  }

  // chip and delete buttons inside program blocks
  programEl.addEventListener('click', (e) => {
    if (running) return;
    const blk = e.target.closest('.block'); if (!blk) return;
    const i = blockEls().indexOf(blk); if (i < 0) return;
    const item = program[i];
    if (e.target.closest('.del')) { program.splice(i, 1); programChanged(); audio.sfx.tap(); return; }
    if (e.target.closest('.chip')) {
      if (BLOCKS[item.id].hasNum) item.n = (item.n % level.numMax) + 1;
      else if (BLOCKS[item.id].hasWord) { const ws = level.sayWords; item.word = ws[(ws.indexOf(item.word) + 1) % ws.length]; }
      programChanged(); audio.sfx.tap(); audio.speak(core.blockSpoken(item));
    }
  });
  $('#btnClear').addEventListener('click', () => { if (running || !program.length) return; program = []; programChanged(); audio.sfx.tap(); });

  // ---- drag and drop (pointer events: mouse, touch and pen) ----
  let drag = null;
  document.addEventListener('pointerdown', (e) => {
    if (running || drag || (e.button !== undefined && e.button > 0)) return;
    const blk = e.target.closest('.block'); if (!blk) return;
    const pal = blk.classList.contains('pal');
    if (!pal && e.target.closest('.chip, .del')) return;      // those handle their own clicks
    const idx = pal ? -1 : blockEls().indexOf(blk);
    const item = pal ? core.defaultItem(blk.dataset.pal, level) : program[idx];
    if (!item) return;
    drag = { id: e.pointerId, pal: pal, idx: idx, item: item, el: blk, sx: e.clientX, sy: e.clientY, moved: false, ghost: null, dx: 0, dy: 0, drop: null, slot: null };
    try { blk.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 8) return;
      const r = drag.el.getBoundingClientRect();
      drag.ghost = drag.el.cloneNode(true); drag.ghost.classList.add('ghost'); drag.ghost.style.width = r.width + 'px';
      drag.ghost.classList.remove('is-new', 'active', 'lifted');
      document.body.appendChild(drag.ghost);
      drag.dx = e.clientX - r.left; drag.dy = e.clientY - r.top; drag.moved = true;
      if (!drag.pal) drag.el.classList.add('lifted');
      drag.slot = el('div', 'dropslot');
    }
    drag.ghost.style.transform = 'translate(' + (e.clientX - drag.dx) + 'px,' + (e.clientY - drag.dy) + 'px)';
    const r = progCol.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (inside) {
      const others = blockEls().filter((b) => b !== drag.el);
      let at = others.length;
      for (let i = 0; i < others.length; i++) { const br = others[i].getBoundingClientRect(); if (e.clientY < br.top + br.height / 2) { at = i; break; } }
      drag.drop = at;
      const empty = programEl.querySelector('.empty'); if (empty) empty.style.display = 'none';
      programEl.insertBefore(drag.slot, others[at] || null);
      if (e.clientY > r.bottom - 40) programEl.scrollTop += 12;
    } else {
      drag.drop = null; if (drag.slot.parentNode) drag.slot.remove();
      const empty = programEl.querySelector('.empty'); if (empty) empty.style.display = '';
    }
    drag.ghost.classList.toggle('trash', !drag.pal && !inside);
  });
  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (d.ghost) d.ghost.remove();
    if (d.slot && d.slot.parentNode) d.slot.remove();
    d.el.classList.remove('lifted');
    if (cancelled) { renderProgram(); return; }
    if (!d.moved) {                                           // a tap
      if (d.pal) addBlock(d.item, program.length);
      else audio.speak(core.blockSpoken(d.item));
      return;
    }
    if (d.drop !== null) {
      if (d.pal) { if (!addBlock(d.item, d.drop)) renderProgram(); }
      else { program.splice(d.idx, 1); program.splice(d.drop, 0, d.item); programChanged(); audio.sfx.drop(); }
    } else if (!d.pal) { program.splice(d.idx, 1); programChanged(); audio.sfx.tap(); }   // dragged out = delete
    else renderProgram();
  }
  document.addEventListener('pointerup', (e) => endDrag(e, false));
  document.addEventListener('pointercancel', (e) => endDrag(e, true));

  // ---- running a program ----
  function setHighlight(i, err) {
    blockEls().forEach((b, k) => { b.classList.toggle('active', k === i && !err); b.classList.toggle('err', k === i && !!err); });
    if (i >= 0) { const b = blockEls()[i]; if (b && b.scrollIntoView) b.scrollIntoView({ block: 'nearest' }); }
  }
  function signal() { if (stepWaiter) { const w = stepWaiter; stepWaiter = null; w(); } }
  function updateStepButton() { $('#btnRun').classList.toggle('on', running && !stepMode); }
  function cancelRun() {
    runToken++; running = false; stepMode = false; stepTokens = 0;
    app.classList.remove('running'); renderer.cancel(); audio.stopSpeech(); signal(); setHighlight(-1);
  }
  const CANCEL = renderer.CANCEL;
  const alive = (token) => { if (token !== runToken) throw CANCEL; };

  async function playEvents(events, token, startPos) {
    for (const ev of events) {
      alive(token);
      switch (ev.t) {
        case 'move': audio.sfx.step(); await renderer.move(ev, 360); break;
        case 'jump': audio.sfx.jump(); await renderer.jump(ev, 640); break;
        case 'bonk': audio.sfx.bonk(); await renderer.bonk(ev, 520); break;
        case 'fall': audio.sfx.fall(); await renderer.fall(650); break;
        case 'coin': audio.sfx.coin(); await renderer.collect('coin', ev.x, ev.y, 600); break;
        case 'key': audio.sfx.coin(); await renderer.collect('key', ev.x, ev.y, 600); break;
        case 'door': audio.sfx.door(); await renderer.openDoor(ev.x, ev.y, 600); break;
        case 'say': audio.speak(ev.text); await renderer.say(ev.text, 1000); break;
        case 'friend': (ev.ok ? audio.sfx.happy : audio.sfx.hmm)(); await renderer.friend(ev.ok, 800); break;
        case 'oops': audio.sfx.hmm(); await renderer.wait(120); break;
      }
    }
  }

  async function run(mode) {
    if (running) {                                           // already running: Run/Step control the pace
      if (stepMode) { if (mode === 'run') { stepMode = false; signal(); updateStepButton(); } else { stepTokens++; signal(); } }
      return;
    }
    if (!level) return;
    if (!program.length) { showBanner('Tap a block first!', 'ブロックを ならべてね。', 'info', 2200); audio.sfx.hmm(); return; }
    audio.unlock(); hideBanner(); $('#btnStep').classList.remove('pulse');
    renderer.reset(level);
    const token = ++runToken, st = core.newState(level), start = { x: st.bit.x, y: st.bit.y };
    running = true; app.classList.add('running'); stepMode = mode === 'step'; stepTokens = stepMode ? 1 : 0; updateStepButton();
    try {
      for (let i = 0; i < program.length; i++) {
        while (stepMode && stepTokens <= 0) { await new Promise((res) => { stepWaiter = res; }); alive(token); }
        alive(token);
        if (stepMode) stepTokens--;
        setHighlight(i);
        const item = program[i];
        if (item.id !== 'say') audio.speak(core.blockSpoken(item));
        const r = core.exec(st, item);
        await playEvents(r.events, token);
        if (r.failed) { await onFail(r.failed, i, token, start); return; }
        await renderer.wait(200);
      }
      setHighlight(-1);
      const end = core.evaluateEnd(st);
      if (end.won) await onWin(token); else await onNotThere(end.reason, token);
    } catch (e) { if (e !== CANCEL) console.error(e); }
    finally { if (token === runToken) { running = false; stepMode = false; app.classList.remove('running'); updateStepButton(); } }
  }

  async function onFail(reason, i, token, start) {
    setHighlight(i, true);
    const m = FAIL[reason] || ['Oops!', ''];
    audio.speak(m[0].replace(/!/g, ''));
    if (reason === 'hole' && renderer.respawn) { await renderer.oopsBubble('Oops!', 500); alive(token); await renderer.respawn(start, 450); }
    else await renderer.oopsBubble('Oops!', 700);
    alive(token);
    showBanner(m[0], m[1], '');
  }
  async function onNotThere(reason, token) {
    const m = FAIL[reason] || FAIL.notat;
    audio.sfx.hmm(); await renderer.oopsBubble('Hmm…', 700); alive(token);
    showBanner(m[0], m[1], '');
  }
  async function onWin(token) {
    audio.sfx.win(); audio.speak('Level clear!');
    await renderer.celebrate(); alive(token);
    const n = program.length, stars = n <= level.par ? 3 : n <= level.par + 2 ? 2 : 1;
    if (stars > (save.stars[level.id] | 0)) { save.stars[level.id] = stars; persist(); }
    $('#dlgStars').innerHTML = ''; $('#dlgStars').appendChild(starsHtml(stars));
    const msg = $('#dlgMsg'); msg.innerHTML = '';
    msg.appendChild(document.createTextNode(['', 'Good job!', 'Great!', 'Perfect!'][stars] + '  ' + n + ' block' + (n === 1 ? '' : 's')));
    msg.appendChild(el('small', '', stars === 3 ? 'さいこう！ いちばん すくない ブロックで クリア！' : 'ブロックを へらして ★3を めざそう！ （さいしょう ' + level.par + 'こ）'));
    $('#dlgNext').hidden = level.id >= LEVELS.length;
    $('#dialog').hidden = false;
  }

  async function readIt() {
    if (running) return;
    if (!program.length) { showBanner('Tap a block first!', 'ブロックを ならべてね。', 'info', 2200); return; }
    audio.unlock(); hideBanner();
    const token = ++runToken; running = true; app.classList.add('running');
    try {
      for (let i = 0; i < program.length; i++) {
        alive(token); setHighlight(i);
        await audio.speak(core.blockSpoken(program[i])); alive(token);
        await new Promise((r) => setTimeout(r, 150));
      }
    } catch (e) { if (e !== CANCEL) console.error(e); }
    finally { if (token === runToken) { running = false; app.classList.remove('running'); setHighlight(-1); } }
  }

  // ---- buttons ----
  $('#btnRun').addEventListener('click', () => run('run'));
  $('#btnStep').addEventListener('click', () => run('step'));
  $('#btnReset').addEventListener('click', () => { cancelRun(); if (level) { renderer.reset(level); hideBanner(); } });
  $('#btnRead').addEventListener('click', readIt);
  $('#btnMenu').addEventListener('click', showMenu);
  $('#goalText').addEventListener('click', () => level && audio.speak(level.goal.replace(/"/g, '')));
  $('#dlgNext').addEventListener('click', () => startLevel(level.id + 1));
  $('#dlgAgain').addEventListener('click', () => startLevel(level.id));
  $('#dlgMenu').addEventListener('click', showMenu);

  const btnHint = $('#btnHint'), btnSound = $('#btnSound'), speed = $('#speed');
  function applyPrefs() {
    app.classList.toggle('hints', !!save.hints); btnHint.setAttribute('aria-pressed', String(!!save.hints));
    audio.setEnabled(save.sound); btnSound.textContent = save.sound ? '🔈' : '🔇';
    speed.value = String(save.speed); renderer.setSpeed(SPEEDS[save.speed] || 1);
  }
  btnHint.addEventListener('click', () => { save.hints = !save.hints; persist(); applyPrefs(); });
  btnSound.addEventListener('click', () => { save.sound = !save.sound; persist(); applyPrefs(); if (save.sound) audio.sfx.tap(); });
  speed.addEventListener('input', () => { save.speed = +speed.value; persist(); applyPrefs(); });

  // ---- go ----
  applyPrefs();
  buildMenu();
  const start = parseInt(params.get('level'), 10);
  if (start >= 1 && start <= LEVELS.length) startLevel(start);
  window.WBApp = { startLevel: startLevel, get program() { return program; }, run: run };   // handy for testing
})();
