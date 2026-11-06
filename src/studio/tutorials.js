// Guided "Learn to make" tutorials. Each step says what to build (English + easy Japanese),
// shows the blocks it needs, and checks the project by itself, so kids never get lost.
const walk = (list, fn) => { for (const n of list || []) { fn(n); walk(n.body, fn); walk(n.else, fn); } };
const sprite = (p, kind) => p.sprites.find((s) => s.kind === kind);
const scripts = (s, type) => (s ? s.scripts.filter((x) => x.hat.type === type) : []);
function has(list, pred) { let ok = false; walk(list, (n) => { if (pred(n)) ok = true; }); return ok; }
function inside(list, outerPred, innerPred) { let ok = false; walk(list, (n) => { if (outerPred(n) && has(n.body, innerPred)) ok = true; }); return ok; }

export const TUTORIALS = [
  {
    id: 'firstgame', en: 'My first game', ja: 'はじめての ゲーム', about: 'Bit catches a star. Make it step by step.', aboutJa: 'ビットが ほしを つかまえる ゲームを、1つずつ つくろう。',
    steps: [
      { en: 'Add a Star.', ja: 'したの「＋ Add」で ほし（Star）を ついかしよう。', check: (p) => !!sprite(p, 'star') },
      { en: 'Tap Bit. Add "when I press Run".', ja: 'Bit を えらんで、きっかけ の「when I press Run」を おこう。', code: 'when I press Run:', check: (p) => scripts(sprite(p, 'bit'), 'whenRun').length > 0 },
      { en: 'Put "forever" under it.', ja: 'その したに せいぎょ の「forever」を つなげよう。', code: 'when I press Run:\n    forever:', check: (p) => scripts(sprite(p, 'bit'), 'whenRun').some((s) => has(s.body, (n) => n.type === 'forever')) },
      { en: 'In "forever": if I am pressing right arrow, move 10 steps.', ja: 'forever の なかに「if」→ もし みぎ ▶ を おしていたら「move 10 steps」。', code: 'when I press Run:\n    forever:\n        if I am pressing right arrow:\n            point right\n            move 10 steps',
        check: (p) => inside(sprite(p, 'bit')?.scripts.flatMap((s) => s.body), (n) => n.type === 'if' && n.args.cond === 'key:right arrow', (n) => n.type === 'move' || n.type === 'changeX') },
      { en: 'Do the same for the left arrow.', ja: 'ひだり ◀ も おなじように つくろう。（point left）', code: '        if I am pressing left arrow:\n            point left\n            move 10 steps',
        check: (p) => inside(sprite(p, 'bit')?.scripts.flatMap((s) => s.body), (n) => n.type === 'if' && n.args.cond === 'key:left arrow', (n) => n.type === 'move' || n.type === 'changeX') },
      { en: 'Make a variable called "score".', ja: 'かず の「New variable」で score を つくろう。', check: (p) => p.vars.includes('score') },
      { en: 'Tap Star. Add "when it touches Bit" and "change score by 1".', ja: 'Star を えらんで「when it touches Bit」→「change score by 1」。', code: 'when it touches Bit:\n    change score by 1',
        check: (p) => scripts(sprite(p, 'star'), 'whenTouch').some((s) => s.hat.args.who === 'Bit' && has(s.body, (n) => n.type === 'changeVar' && n.args.v === 'score')) },
      { en: 'Then: go to a random place.', ja: 'つづけて「go to a random place」で ほしを うごかそう。', code: 'when it touches Bit:\n    change score by 1\n    go to a random place',
        check: (p) => scripts(sprite(p, 'star'), 'whenTouch').some((s) => has(s.body, (n) => n.type === 'goTo')) },
      { en: 'Press Run. Catch the star with the arrow keys!', ja: '▶ Run を おして、やじるしで ほしを つかまえよう！', check: (p, vm) => (vm.vars.score || 0) >= 1 },
    ],
    done: { en: 'You made a game!', ja: 'ゲームが できた！ こんどは じぶんの アイデアを たそう。（おばけ・タイマー・かち など）' },
  },
  {
    id: 'story', en: 'A talking story', ja: 'おしゃべり ストーリー', about: 'Two friends talk using messages.', aboutJa: '2にんが メッセージで じゅんばんに はなす おはなしを つくろう。',
    steps: [
      { en: 'Add Pip (or another friend).', ja: '「＋ Add」で ピップ（Pip）を ついかしよう。', check: (p) => !!sprite(p, 'pip') || p.sprites.length > 1 },
      { en: 'Tap Bit. When I press Run: say "Hello!" for 2 seconds.', ja: 'Bit に「when I press Run」→ みため の「say Hello! for 2 seconds」。', code: 'when I press Run:\n    say Hello! for 2 seconds',
        check: (p) => scripts(sprite(p, 'bit'), 'whenRun').some((s) => has(s.body, (n) => n.type === 'sayFor')) },
      { en: 'Then: send the message "hello".', ja: 'つづけて きっかけ の「send the message hello」。', code: 'when I press Run:\n    say Hello! for 2 seconds\n    send the message hello',
        check: (p) => scripts(sprite(p, 'bit'), 'whenRun').some((s) => has(s.body, (n) => n.type === 'send')) },
      { en: 'Tap your friend. When I get the message hello: say something.', ja: 'ともだちを えらんで「when I get the message hello」→「say … for 2 seconds」。', code: 'when I get the message hello:\n    say Hi! for 2 seconds',
        check: (p) => p.sprites.some((s) => s.kind !== 'bit' && scripts(s, 'whenMsg').some((x) => has(x.body, (n) => n.type === 'sayFor' || n.type === 'sayIt'))) },
      { en: 'Change the words. Tap "✏️ write…" and type in English!', ja: 'セリフの チップを タップして「✏️ write…」で じぶんの えいごを かこう。', check: (p) => p.sprites.some((s) => has(s.scripts.flatMap((x) => x.body), (n) => (n.type === 'sayFor' || n.type === 'sayIt') && !['Hello!', 'Hi!'].includes(n.args.text))) },
      { en: 'Press Run and watch your story.', ja: '▶ Run で おはなしを みよう！', check: (p, vm, st) => st.heardFriend },
    ],
    done: { en: 'What a story!', ja: 'すてきな おはなし！ もっと セリフや キャラクターを ふやそう。' },
  },
  {
    id: 'rain', en: 'Raining apples', ja: 'りんごの あめ', about: 'Copies (clones) make lots of apples from one.', aboutJa: '「コピー」で 1つの りんごから たくさんの りんごを ふらせよう。',
    steps: [
      { en: 'Add an Apple.', ja: '「＋ Add」で りんご（Apple）を ついかしよう。', check: (p) => !!sprite(p, 'apple') },
      { en: 'Tap Apple. When I press Run: hide, then forever make a copy of me and wait 1 second.', ja: 'Apple に「when I press Run」→「hide」→「forever」の なかに「make a copy of me」と「wait 1 seconds」。', code: 'when I press Run:\n    hide\n    forever:\n        make a copy of me\n        wait 1 seconds',
        check: (p) => scripts(sprite(p, 'apple'), 'whenRun').some((s) => inside(s.body, (n) => n.type === 'forever', (n) => n.type === 'clone')) },
      { en: 'When I start as a copy: go to the top, show.', ja: '「when I start as a copy」→「go to the top」→「show」。', code: 'when I start as a copy:\n    go to the top\n    show',
        check: (p) => scripts(sprite(p, 'apple'), 'whenClone').some((s) => has(s.body, (n) => n.type === 'goTo') && has(s.body, (n) => n.type === 'show')) },
      { en: 'Then fall: repeat 70 times, change y by -5. Then delete this copy.', ja: 'つづけて「repeat 70 times」の なかに「change y by -5」。さいごに「delete this copy」。', code: 'when I start as a copy:\n    go to the top\n    show\n    repeat 70 times:\n        change y by -5\n    delete this copy',
        check: (p) => scripts(sprite(p, 'apple'), 'whenClone').some((s) => inside(s.body, (n) => n.type === 'repeat' || n.type === 'forever', (n) => n.type === 'changeY' || n.type === 'move') && has(s.body, (n) => n.type === 'unclone')) },
      { en: 'Press Run. It rains apples!', ja: '▶ Run！ りんごが ふってくるよ。', check: (p, vm) => vm.insts.filter((i) => i.isClone).length >= 2 },
    ],
    done: { en: 'Copies are powerful!', ja: 'コピーは べんり！ キャッチする ゲームに してみよう（Apple Catch を みてね）。' },
  },
];
