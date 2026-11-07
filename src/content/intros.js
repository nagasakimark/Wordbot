// Concept cards: shown the first time a big idea appears. Very easy Japanese,
// with the English programming words kept in English. `code` is shown as real blocks.
export const INTROS = {
  welcome: {
    en: "Hi! I'm Bit.", ja: 'はじめまして！',
    lines: ['ぼくは ビット。えいごしか わからない ロボットだよ。', 'えいごの ブロックを ならべて、ぼくに めいれいしてね。', 'ブロックを タップ か ドラッグ。そして ▶ Run！'],
    code: 'go forward\ngo forward',
    mood: 'happy',
  },
  turn: {
    en: 'turn left, turn right', ja: 'ひだりを むく・みぎを むく',
    lines: ['「turn」は ビットから みて ひだり・みぎ だよ。', 'ビットの まえの ▲ が すすむ むき。', 'むいても うごかないよ。うごくのは go forward！'],
    code: 'turn left\ngo forward',
    quiz: { q: 'ビットは みぎ ▶ を むいている。turn left すると どっちを むく？', choices: ['うえ ▲', 'した ▼', 'ひだり ◀', 'みぎ ▶'], answer: 0, why: 'ひだりに 1かい まわると、みぎ ▶ から うえ ▲ に なるよ。' },
  },
  gems: {
    en: 'pick it up', ja: 'ひろう',
    lines: ['ジェムの うえで「pick it up」。', 'ジェムが ない ところで ひろうと… Oops!', 'ぜんぶ ひろってから いえに かえろう。'],
    code: 'go forward\npick it up',
  },
  bug: {
    en: 'A bug is a mistake', ja: 'バグ = まちがい',
    lines: ['プログラムの まちがいを「バグ」と いうよ。', '⏭ Step で 1つずつ うごかして、どこで おかしく なるか みよう。', 'プログラマーは みんな バグを なおしているよ！'],
  },
  repeat: {
    en: 'repeat', ja: 'くりかえす',
    lines: ['おなじ ことを なんかいも する ときは「repeat」！', 'なかに いれた ブロックを、かずの ぶんだけ くりかえすよ。', 'かずの ところを タップすると かえられる。'],
    code: 'repeat 4 times:\n    go forward',
    compare: 'go forward\ngo forward\ngo forward\ngo forward',
    quiz: { q: 'ビットは go forward を ぜんぶで なんかい する？', code: 'repeat 3 times:\n    go forward\n    turn right', choices: ['1かい', '3かい', '6かい', '4かい'], answer: 1, why: 'なかの 2つ（go forward と turn right）を 3かい。go forward は 3かい だよ。' },
  },
  paint: {
    en: 'paint it red', ja: 'いろを ぬる',
    lines: ['しろい タイルに いろを ぬれるよ。', 'タイルの ● と おなじ いろに しよう。', 'くりかえしを つかうと はやいよ。'],
    code: 'go forward\npaint it red',
  },
  nested: {
    en: 'A loop in a loop', ja: 'くりかえしの なかに くりかえし',
    lines: ['さくを 3つ つくりたい。1つの さくは ポスト 3こ。', '1つ ぶんは repeat 3 で できる。それを 3かい… つまり「くりかえしを くりかえす」！'],
    steps: [
      { ja: '① まず 1つの さく（ポスト 3こ）。', code: 'repeat 3 times:\n    go forward\n    paint it red' },
      { ja: '② この かたまりを 3かい くりかえしたい。かたまり ぜんぶを あたらしい repeat に いれる。あいだの すきまは go forward。', code: 'repeat 3 times:\n    repeat 3 times:\n        go forward\n        paint it red\n    go forward' },
      { ja: '③ そとが 3かい × なかが 3かい ＝ 9こ ぬる。ブロックは 5こ だけ！', code: null },
    ],
    quiz: { q: 'ビットは go forward を ぜんぶで なんかい する？', code: 'repeat 2 times:\n    repeat 3 times:\n        go forward\n    turn left', choices: ['3かい', '5かい', '6かい', '8かい'], answer: 2, why: 'そとの repeat が 1かい まわる たびに、なかの repeat が 3かい。2 × 3 ＝ 6かい！' },
  },
  words: {
    en: 'Teach Bit a new word', ja: 'あたらしい ことばを おしえる',
    lines: ['「to ○○:」の なかに、やりかたを いれると…', '「○○」の 1ブロックで ぜんぶ できるように なる！', 'これを プログラミングでは「かんすう（function）」と いうよ。'],
    code: 'to turn around:\n    turn right\n    turn right\nturn around',
    quiz: { q: 'ビットは はじめ みぎ ▶ を むいている。さいごは どっちを むく？', code: 'to turn around:\n    turn right\n    turn right\nturn around\nturn around', choices: ['みぎ ▶', 'ひだり ◀', 'うえ ▲', 'した ▼'], answer: 0, why: 'turn around は turn right が 2かい。それを 2かい よぶと 4かい まわって、もとの みぎ ▶ に もどるよ。' },
  },
  name: {
    en: 'Make your own word', ja: 'じぶんで ことばを つくろう',
    lines: ['「＋ New word」を おして、なまえを えらぼう。', '「to …:」の なかに やりかたを いれてね。', 'できた ことばは ブロックに なって、なんかいでも つかえるよ。'],
  },
  until: {
    en: 'repeat until…', ja: '〜まで くりかえす',
    lines: ['こんどは マップが 3つ！ ぜんぶ おなじ プログラムで クリアしよう。', 'マップごとに ながさが ちがうから、かずが きめられない…', '「repeat until Bit is home」なら、いえに つくまで すすむよ。'],
    code: 'repeat until Bit is home:\n    go forward',
    quiz: { q: 'マップが もっと ながく なったら？', code: 'repeat until Bit is home:\n    go forward', choices: ['プログラムを なおす ひつようが ある', 'そのまま クリア できる'], answer: 1, why: '「いえに つくまで」だから、なんマス あっても だいじょうぶ！かずを きめなくて いいんだ。' },
  },
  if: {
    en: 'if…', ja: 'もし 〜なら',
    lines: ['ビットは まわりを しらべられるよ。', '「if Bit is on a gem」→ ジェムの うえに いる ときだけ なかを する。', '✓ は「はい」、✗ は「いいえ」。Run の とき ブロックに でるよ。'],
    code: 'if Bit is on a gem:\n    pick it up',
    quiz: { q: 'ビットの いる ばしょに ジェムが ない。「pick it up」は？', code: 'if Bit is on a gem:\n    pick it up', choices: ['する', 'しない'], answer: 1, why: 'if の なかは、はい（✓）の ときだけ。ジェムが ないから ✗ で、とばされるよ。' },
  },
  ifelse: {
    en: 'if… otherwise…', ja: 'もし〜なら… そうでなければ…',
    lines: ['「otherwise」は「そうでなければ」。', 'はい なら うえの ブロック、いいえ なら したの ブロックを するよ。', 'repeat until と くみあわせると、どんな みちでも すすめる！'],
    code: 'if Bit can go forward:\n    go forward\notherwise:\n    turn right',
    quiz: { q: 'ビットの まえは かべ。どっちを する？', code: 'if Bit can go forward:\n    go forward\notherwise:\n    turn right', choices: ['go forward', 'turn right'], answer: 1, why: 'まえに すすめない（✗）から、「otherwise」の したの ブロック。turn right だよ。' },
  },
  maze: {
    en: 'The right-hand rule', ja: 'みぎての ルール',
    lines: ['めいろの ひみつ：みぎてを かべに つけたまま あるくと、いつか でぐちに つく！', '① みぎに いけたら、みぎを むいて すすむ。', '② だめなら まっすぐ。③ それも だめなら ひだりを むく。'],
  },
  vars: {
    en: 'Variables', ja: 'へんすう（かずを おぼえる）',
    lines: ['ビットは かずを おぼえられるよ。これを「へんすう（variable）」と いうよ。', '「set steps to 0」で 0から スタート。「add 1 to steps」で 1 ふえる。', 'さいごに「say steps」で こたえを いおう！'],
    code: 'set steps to 0\ngo forward\nadd 1 to steps\nsay steps',
    quiz: { q: 'ビットは なんて いう？', code: 'set steps to 0\ngo forward\ngo forward\nadd 1 to steps\nsay steps', choices: ['0', '1', '2', '3'], answer: 1, why: 'へんすうは「add」した ぶんしか ふえないよ。add 1 は 1かい だけ だから 1。2かい すすんでも、かぞえて いないよ！' },
  },
  loopvar: {
    en: 'repeat size times', ja: 'へんすうの かずだけ くりかえす',
    lines: ['repeat の かずの ところに、へんすうも いれられるよ。', 'size が 1、2、3… と ふえると、せんも ながく なる。', 'かずの チップを タップして「size」を えらぼう。'],
    code: 'set size to 1\nrepeat size times:\n    paint it red\n    go forward\nadd 1 to size',
    quiz: { q: 'go forward は ぜんぶで なんかい？', code: 'set size to 1\nrepeat 3 times:\n    repeat size times:\n        go forward\n    add 1 to size', choices: ['3かい', '6かい', '9かい', '4かい'], answer: 1, why: 'size は 1、2、3 と ふえる。1回め 1かい、2かいめ 2かい、3かいめ 3かい。1 + 2 + 3 ＝ 6かい！' },
  },
};
