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
  },
  paint: {
    en: 'paint it red', ja: 'いろを ぬる',
    lines: ['しろい タイルに いろを ぬれるよ。', 'タイルの ● と おなじ いろに しよう。', 'くりかえしを つかうと はやいよ。'],
    code: 'go forward\npaint it red',
  },
  nested: {
    en: 'A loop in a loop', ja: 'くりかえしの なかに くりかえし',
    lines: ['repeat の なかに repeat を いれられるよ。', 'そとの repeat が 1かい まわる たびに、なかの repeat が ぜんぶ まわる。', 'しかくの 1つの へんは おなじ うごき。それを 4かい！'],
    code: 'repeat 4 times:\n    repeat 2 times:\n        paint it red\n        go forward\n    turn right',
  },
  words: {
    en: 'Teach Bit a new word', ja: 'あたらしい ことばを おしえる',
    lines: ['「to ○○:」の なかに、やりかたを いれると…', '「○○」の 1ブロックで ぜんぶ できるように なる！', 'これを プログラミングでは「かんすう（function）」と いうよ。'],
    code: 'to turn around:\n    turn right\n    turn right\nturn around',
  },
  name: {
    en: 'Make your own word', ja: 'じぶんで ことばを つくろう',
    lines: ['「＋ New word」を おして、なまえを えらぼう。', '「to …:」の なかに やりかたを いれてね。', 'できた ことばは ブロックに なって、なんかいでも つかえるよ。'],
  },
  until: {
    en: 'repeat until…', ja: '〜まで くりかえす',
    lines: ['こんどは マップが 3つ！ ぜんぶ おなじ プログラムで クリアしよう。', 'マップごとに ながさが ちがうから、かずが きめられない…', '「repeat until Bit is home」なら、いえに つくまで すすむよ。'],
    code: 'repeat until Bit is home:\n    go forward',
  },
  if: {
    en: 'if…', ja: 'もし 〜なら',
    lines: ['ビットは まわりを しらべられるよ。', '「if Bit is on a gem」→ ジェムの うえに いる ときだけ なかを する。', '✓ は「はい」、✗ は「いいえ」。Run の とき ブロックに でるよ。'],
    code: 'if Bit is on a gem:\n    pick it up',
  },
  ifelse: {
    en: 'if… otherwise…', ja: 'もし〜なら… そうでなければ…',
    lines: ['「otherwise」は「そうでなければ」。', 'はい なら うえの ブロック、いいえ なら したの ブロックを するよ。', 'repeat until と くみあわせると、どんな みちでも すすめる！'],
    code: 'if Bit can go forward:\n    go forward\notherwise:\n    turn right',
  },
  maze: {
    en: 'The right-hand rule', ja: 'みぎての ルール',
    lines: ['めいろの ひみつ：みぎてを かべに つけたまま あるくと、いつか でぐちに つく！', '① みぎに いけたら、みぎを むいて すすむ。', '② だめなら まっすぐ。③ それも だめなら ひだりを むく。'],
  },
  vars: {
    en: 'Variables', ja: 'へんすう（かずを おぼえる）',
    lines: ['ビットは かずを おぼえられるよ。これを「へんすう（variable）」と いうよ。', '「set steps to 0」で 0から スタート。「add 1 to steps」で 1 ふえる。', 'さいごに「say steps」で こたえを いおう！'],
    code: 'set steps to 0\ngo forward\nadd 1 to steps\nsay steps',
  },
  loopvar: {
    en: 'repeat size times', ja: 'へんすうの かずだけ くりかえす',
    lines: ['repeat の かずの ところに、へんすうも いれられるよ。', 'size が 1、2、3… と ふえると、せんも ながく なる。', 'かずの チップを タップして「size」を えらぼう。'],
    code: 'set size to 1\nrepeat size times:\n    paint it red\n    go forward\nadd 1 to size',
  },
};
