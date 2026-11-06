// Title: Bit running real English code on a little island. The code lights up as Bit moves.
import { h, btn } from '../ui/dom.js';
import { sfx, speak } from '../audio/sfx.js';
import { createBoard, CANCEL } from '../play/board.js';
import { parseMap } from '../engine/world.js';
import { parseProgram, printProgram } from '../engine/text.js';
import { runProgram } from '../engine/run.js';
import { save } from '../progress/save.js';

const DEMO = {
  index: 99, world: { theme: 'meadow' }, startOnPad: false, goal: { home: true },
  maps: [['>..g.', 'TT#T.', 'H.g..']],
  code: `repeat until Bit is home:
    if Bit can go forward:
        go forward
    otherwise:
        turn right
    if Bit is on a gem:
        pick it up`,
};

export function titleScreen(root, _params, app) {
  DEMO.parsed = DEMO.maps.map((m) => parseMap(m, DEMO));
  const prog = parseProgram(DEMO.code);
  const lines = printProgram(prog);
  const codeRows = new Map();
  const code = h('div.democode', ...lines.map((l) => {
    const row = h('div.dl', { style: { '--i': l.text.match(/^ */)[0].length / 4 } }, l.text.trim());
    if (l.id && !codeRows.has(l.id)) codeRows.set(l.id, row);
    return row;
  }));
  const canvas = h('canvas');
  const islandBox = h('div.demoboard', canvas);
  const letters = 'Word Bot'.split('').map((ch, i) => h('span.lg' + (ch === ' ' ? '.sp' : ''), { style: { '--i': i } }, ch));
  const stars = save.totalStars();
  root.append(h('div.title',
    h('div.titleleft',
      h('h1.logo', {}, ...letters),
      h('p.tag', {}, 'Tell Bit what to do — in English!'),
      h('p.tagja', {}, 'えいごの ブロックで ロボットを プログラミング！'),
      h('div.titlebtns',
        btn('primary.huge', [h('span', {}, 'Learn'), h('small', {}, 'まなぶ')], () => { sfx.unlock(); speak("Let's learn!"); app.go('worlds', {}); }),
        btn('make.huge', [h('span', {}, 'Make'), h('small', {}, 'つくる')], () => { sfx.unlock(); speak("Let's make something!"); app.go('studioHome', {}); })),
      stars ? h('div.titlestars', {}, '★ ' + stars) : null),
    h('div.titleright', h('div.democard', islandBox, h('div.democodewrap', h('div.demolabel', {}, 'English code', h('small', {}, 'Bit が いま している ところが ひかるよ')), code)))));

  const board = createBoard(canvas);
  board.setMap(DEMO, 0);
  board.setSpeed(1.15);
  let alive = true;
  (async function loop() {
    while (alive) {
      board.reset();
      const r = runProgram(prog, DEMO, 0);
      try {
        await board.wait(700);
        for (const t of r.trace) {
          if (!alive) return;
          const row = codeRows.get(t.id);
          if (row) { code.querySelectorAll('.on').forEach((e) => e.classList.remove('on')); row.classList.add('on'); }
          if (t.k === 'act') for (const ev of t.events) {
            if (ev.t === 'move') await board.move(ev);
            else if (ev.t === 'turn') await board.turn(ev);
            else if (ev.t === 'pick') await board.pick(ev);
          } else if (t.k === 'cond') await board.wait(260);
        }
        code.querySelectorAll('.on').forEach((e) => e.classList.remove('on'));
        await board.celebrate();
        await board.wait(900);
      } catch (e) { if (e !== CANCEL) throw e; return; }
    }
  })();
  return () => { alive = false; board.destroy(); };
}
