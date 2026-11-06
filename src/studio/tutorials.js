// Guided "Learn to make" tutorials. Each step says what to build (English + easy Japanese),
// shows the blocks it needs, and checks the project by itself, so kids never get lost.
//
// Checks do not just look for blocks. They RUN the kid's project in a hidden copy of the
// game (the same VM that plays it) and test what actually happens: does Bit move when the
// right arrow is held, does the score go up when the star is touched, can the game be won.
import { VM } from './vm.js';
const walk = (list, fn) => { for (const n of list || []) { fn(n); walk(n.body, fn); walk(n.else, fn); } };
const sprite = (p, kind) => p.sprites.find((s) => s.kind === kind);
const scripts = (s, type) => (s ? s.scripts.filter((x) => x.hat.type === type) : []);
function has(list, pred) { let ok = false; walk(list, (n) => { if (pred(n)) ok = true; }); return ok; }
function inside(list, outerPred, innerPred) { let ok = false; walk(list, (n) => { if (outerPred(n) && has(n.body, innerPred)) ok = true; }); return ok; }

// Play a hidden copy of the project: press Run, set things up, hold keys, run some frames.
export function sim(project, { setup, keys = [], frames = 20, hooks } = {}) {
  const vm = new VM(JSON.parse(JSON.stringify(project)), hooks || {});
  vm.start();
  if (setup) setup(vm);
  for (const k of keys) vm.keyDown(k);
  for (let i = 0; i < frames; i++) vm.step(1 / 60);
  return vm;
}
const first = (vm, kind) => vm.insts.find((i) => i.kind === kind && !i.isClone);
// Hold a key for a moment: does Bit move that way (by at least 15 units)?
const walks = (key, axis, sign) => (p) => {
  if (!sprite(p, 'bit')) return false;
  const vm = sim(p, { setup: (v) => { const b = first(v, 'bit'); b.x = 240; b.y = 180; }, keys: [key], frames: 12 });
  const b = first(vm, 'bit');
  return sign * (b[axis] - (axis === 'x' ? 240 : 180)) > 15;
};
// Put the star right on Bit and see what the star's "touch" script does.
const touchSim = (p, { score = 0 } = {}) => {
  const star = sprite(p, 'star');
  if (!star || !sprite(p, 'bit')) return null;
  return sim(p, { setup: (v) => { const b = first(v, 'bit'), st = first(v, 'star'); b.x = 240; b.y = 180; st.x = 240; st.y = 180; st.visible = true; v.vars.score = score; }, frames: 10 });
};

const bitScripts = (p) => sprite(p, 'bit')?.scripts.flatMap((s) => s.body) || [];
const keyIf = (key) => (p) => inside(bitScripts(p), (n) => n.type === 'if' && n.args.cond === 'key:' + key, () => true);

export const TUTORIALS = [
  {
    id: 'firstgame', en: 'My first game', ja: 'はじめての ゲーム', about: 'Bit catches stars. Make it step by step.', aboutJa: 'ビットが ほしを あつめる ゲームを、1つずつ つくろう。',
    steps: [
      { en: 'Add a Star.', ja: 'したの「＋ Add」で ほし（Star）を ついかしよう。', check: (p) => !!sprite(p, 'star') },
      { en: 'Tap Bit. Add "when I press Run".', ja: 'Bit を えらんで、きっかけ の「when I press Run」を おこう。', code: 'when I press Run:', check: (p) => scripts(sprite(p, 'bit'), 'whenRun').length > 0 },
      { en: 'Put "forever" under it.', ja: 'その したに せいぎょ の「forever」を つなげよう。', code: 'when I press Run:\n    forever:', check: (p) => scripts(sprite(p, 'bit'), 'whenRun').some((s) => has(s.body, (n) => n.type === 'forever')) },
      { en: 'In "forever": if I am pressing right arrow, point right and move 10 steps.', ja: 'forever の なかに「if」→ もし みぎ ▶ を おしていたら「point right」「move 10 steps」。',
        code: 'when I press Run:\n    forever:\n        if I am pressing right arrow:\n            point right\n            move 10 steps',
        tip: 'Use the "if" block, choose "I am pressing right arrow", then put "move 10 steps" inside it.', tipJa: '「if」を おいて「みぎ ▶ を おしている」を えらぶ。「move 10 steps」は if の なかに いれてね。',
        check: walks('right arrow', 'x', 1) },
      { en: 'Do the same for the left arrow.', ja: 'ひだり ◀ も おなじように つくろう。（point left）', code: '        if I am pressing left arrow:\n            point left\n            move 10 steps',
        tip: 'Another "if" inside "forever": left arrow, point left, move 10 steps.', tipJa: 'forever の なかに もう1つ「if」。ひだり ◀ → point left → move 10 steps。',
        check: (p) => keyIf('left arrow')(p) && walks('left arrow', 'x', -1)(p) },
      { en: 'Now up and down too! (point up / point down)', ja: 'うえ ▲ と した ▼ も つくろう。（point up / point down）', code: '        if I am pressing up arrow:\n            point up\n            move 10 steps\n        if I am pressing down arrow:\n            point down\n            move 10 steps',
        tip: 'Two more "if" blocks inside "forever": up arrow → point up, down arrow → point down. Each one moves 10 steps.', tipJa: 'forever の なかに「if」を 2つ。うえ ▲ → point up、した ▼ → point down。どちらも move 10 steps。',
        check: (p) => walks('up arrow', 'y', 1)(p) && walks('down arrow', 'y', -1)(p) },
      { en: 'Make a variable called "score".', ja: 'かず の「New variable」で score を つくろう。', check: (p) => p.vars.includes('score') },
      { en: 'Tap Star. Add "when it touches Bit" and "change score by 1".', ja: 'Star を えらんで「when it touches Bit」→「change score by 1」。', code: 'when it touches Bit:\n    change score by 1',
        tip: 'Pick the Star on the tray first. Then use the Events tab for "when it touches Bit".', tipJa: 'まず したの Star を タップ。「きっかけ」の「when it touches Bit」を つかうよ。',
        check: (p) => { const vm = touchSim(p); return !!vm && (vm.vars.score || 0) >= 1; } },
      { en: 'Then: go to a random place, so the star jumps away.', ja: 'つづけて「go to a random place」で ほしを べつの ばしょへ！', code: 'when it touches Bit:\n    change score by 1\n    go to a random place',
        check: (p) => {
          for (let i = 0; i < 4; i++) { // random can land close; try a few times
            const vm = touchSim(p); if (!vm) return false;
            const b = first(vm, 'bit'), st = first(vm, 'star');
            if ((vm.vars.score || 0) === 1 && Math.hypot(b.x - st.x, b.y - st.y) > 70) return true;
          }
          return false;
        } },
      { en: 'Add a win! Under "go to…": if score is more than 5, win.', ja: 'かったら おしまい！ さいごに「if」→「score が 5 より おおきい」→ ゲーム の「you win!」。', code: '    if score is more than 5:\n        you win!',
        tip: 'Add an "if" at the bottom of the star\'s script. Choose "score is more than 5". Put "you win!" (Game tab) inside.', tipJa: 'ほしの スクリプトの いちばん したに「if」。「score が 5 より おおきい」を えらんで、ゲーム の「you win!」を なかに いれよう。',
        check: (p) => { const vm = touchSim(p, { score: 6 }); return !!vm && vm.ended === 'win'; } },
      { en: 'Press Run. Catch 6 stars with the arrow keys to win!', ja: '▶ Run を おして、やじるしで ほしを 6こ あつめて かとう！', real: true, check: (p, vm) => vm.ended === 'win' },
    ],
    done: { en: 'You made a game, and you won it!', ja: 'ゲームが できた！ しかも クリア！ こんどは おばけ・タイマー・ライフ を たしてみよう。' },
  },
  {
    id: 'story', en: 'A talking story', ja: 'おしゃべり ストーリー', about: 'Two friends talk using messages.', aboutJa: '2にんが メッセージで じゅんばんに はなす おはなしを つくろう。',
    steps: [
      { en: 'Add Pip (or another friend).', ja: '「＋ Add」で ピップ（Pip）を ついかしよう。', check: (p) => !!sprite(p, 'pip') || p.sprites.length > 1 },
      { en: 'Tap Bit. When I press Run: say "Hello!" for 2 seconds.', ja: 'Bit に「when I press Run」→ みため の「say Hello! for 2 seconds」。', code: 'when I press Run:\n    say Hello! for 2 seconds',
        check: (p) => { const heard = []; sim(p, { frames: 6, hooks: { say: (t, i) => heard.push(i && i.kind) } }); return heard.includes('bit'); } },
      { en: 'Then: send the message "hello".', ja: 'つづけて きっかけ の「send the message hello」。', code: 'when I press Run:\n    say Hello! for 2 seconds\n    send the message hello',
        check: (p) => scripts(sprite(p, 'bit'), 'whenRun').some((s) => has(s.body, (n) => n.type === 'send')) },
      { en: 'Tap your friend. When I get the message hello: say something.', ja: 'ともだちを えらんで「when I get the message hello」→「say … for 2 seconds」。', code: 'when I get the message hello:\n    say Hi! for 2 seconds',
        tip: 'Select your friend on the tray. The message name must be the same: hello.', tipJa: 'したの ともだちを タップ。メッセージの なまえは おなじ「hello」に しよう。',
        check: (p) => { const who = []; sim(p, { frames: 60 * 3.5, hooks: { say: (t, i) => who.push(i && i.kind) } }); return who.includes('bit') && who.some((k) => k && k !== 'bit'); } },
      { en: 'Change the words. Tap "✏️ write…" and type in English!', ja: 'セリフの チップを タップして「✏️ write…」で じぶんの えいごを かこう。', check: (p) => p.sprites.some((s) => has(s.scripts.flatMap((x) => x.body), (n) => (n.type === 'sayFor' || n.type === 'sayIt') && !['Hello!', 'Hi!'].includes(n.args.text))) },
      { en: 'Press Run and watch your story.', ja: '▶ Run で おはなしを みよう！', real: true, check: (p, vm, st) => st.heardFriend },
    ],
    done: { en: 'What a story!', ja: 'すてきな おはなし！ もっと セリフや キャラクターを ふやそう。' },
  },
  {
    id: 'rain', en: 'Raining apples', ja: 'りんごの あめ', about: 'Copies (clones) make lots of apples from one.', aboutJa: '「コピー」で 1つの りんごから たくさんの りんごを ふらせよう。',
    steps: [
      { en: 'Add an Apple.', ja: '「＋ Add」で りんご（Apple）を ついかしよう。', check: (p) => !!sprite(p, 'apple') },
      { en: 'Tap Apple. When I press Run: hide, then forever make a copy of me and wait 1 second.', ja: 'Apple に「when I press Run」→「hide」→「forever」の なかに「make a copy of me」と「wait 1 seconds」。', code: 'when I press Run:\n    hide\n    forever:\n        make a copy of me\n        wait 1 seconds',
        check: (p) => { const vm = sim(p, { frames: 60 * 2.5 }); return vm.insts.filter((i) => i.isClone).length >= 2; } },
      { en: 'When I start as a copy: go to the top, show.', ja: '「when I start as a copy」→「go to the top」→「show」。', code: 'when I start as a copy:\n    go to the top\n    show',
        tip: 'Use the Events tab for "when I start as a copy". Then "go to the top" and "show".', tipJa: '「きっかけ」の「when I start as a copy」→「go to the top」→「show」の じゅん。',
        check: (p) => { const vm = sim(p, { frames: 6 }); return vm.insts.some((i) => i.isClone && i.visible && i.y > 280); } },
      { en: 'Then fall: repeat 70 times, change y by -5. Then delete this copy.', ja: 'つづけて「repeat 70 times」の なかに「change y by -5」。さいごに「delete this copy」。', code: 'when I start as a copy:\n    go to the top\n    show\n    repeat 70 times:\n        change y by -5\n    delete this copy',
        tip: 'Falling means y gets smaller: "change y by -5". Tap the number to make it negative.', tipJa: 'おちる = y が ちいさくなる。「change y by -5」。かずを マイナスに してね。',
        check: (p) => {
          const a = sim(p, { frames: 60 * 2 }), clones = a.insts.filter((i) => i.isClone && i.visible);
          if (clones.length < 1 || !clones.every((c) => c.y < 340)) return false;
          const b = sim(p, { frames: 60 * 20 }); // copies must disappear again, not pile up
          return b.insts.filter((i) => i.isClone).length < 6;
        } },
      { en: 'Press Run. It rains apples!', ja: '▶ Run！ りんごが ふってくるよ。', real: true, check: (p, vm) => vm.running && vm.spawned >= 3 },
    ],
    done: { en: 'Copies are powerful!', ja: 'コピーは べんり！ キャッチする ゲームに してみよう（Apple Catch を みてね）。' },
  },
];
