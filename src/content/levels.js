// The Word Bot course. Five worlds, each built around one big programming idea.
//
// Level fields
//   maps        one or more maps (see engine/world.js for the legend). With several maps the
//               program must work on ALL of them, like tests: kids learn to write general programs.
//   goal        { home, gems, paint, say: 'distance' | 'gems' | n, word }
//   palette     the blocks on offer (calls to new words appear by themselves)
//   conds/colors/vars/words/sayWords   choices inside chips
//   start       a program already in place (English code), e.g. a buggy one to fix
//   solution    a reference solution (English code). Tests prove it passes every map;
//               par (3 stars) = its block count, so par can never drift.
//   max         most blocks allowed (forces the new idea where needed)
//   anti        programs that must NOT pass (proves the level needs the new idea)
//   target      paint levels: rows of colour letters (r b y g k=pink u=purple, '.' = stay white),
//               or 'solution' to take the picture from the reference solution
//   intro       concept card shown before the level (content/intros.js)
import { parseMap } from '../engine/world.js';
import { parseProgram } from '../engine/text.js';
import { runProgram } from '../engine/run.js';
import { countBlocks } from '../engine/blocks.js';

const MOVE = ['forward', 'turn left', 'turn right'];

export const WORLDS = [
  {
    id: 1, en: 'Hello, Bit!', ja: 'はじめての めいれい', idea: 'Commands', ideaJa: 'めいれいと じゅんばん', theme: 'meadow',
    levels: [
      {
        title: 'Go forward', ja: 'まえに すすもう', intro: 'welcome',
        goalEn: 'Take Bit home.', goalJa: 'ビットを いえまで つれていこう。',
        maps: [[' T  ', '>..H', '  ..']], goal: { home: true },
        palette: ['forward'], max: 5,
        solution: `go forward
go forward
go forward`,
      },
      {
        title: 'Turn left', ja: 'ひだりを むこう', intro: 'turn',
        goalEn: 'Turn left to get home.', goalJa: 'ビットから みて ひだりを むこう。',
        maps: [['   H ', ' T . ', '>... ']], goal: { home: true },
        palette: ['forward', 'turn left'], max: 8,
        solution: `go forward
go forward
go forward
turn left
go forward
go forward`,
      },
      {
        title: 'Left and right', ja: 'ひだりと みぎ',
        goalEn: 'Turn right, then turn left.', goalJa: 'みぎ と ひだり、どっちに まがる？',
        maps: [['>..  ', 'T .  ', '  ..H']], goal: { home: true },
        palette: MOVE, max: 10,
        solution: `go forward
go forward
turn right
go forward
go forward
turn left
go forward
go forward`,
      },
      {
        title: 'Pick it up', ja: 'ジェムを ひろおう', intro: 'gems',
        goalEn: 'Pick up the gem. Then go home.', goalJa: 'ジェムを ひろってから いえに かえろう。',
        maps: [['v T ', 'g..H']], goal: { home: true, gems: true },
        palette: [...MOVE, 'pick'], max: 8,
        solution: `go forward
pick it up
turn left
go forward
go forward
go forward`,
      },
      {
        title: 'Find the bug', ja: 'バグを みつけよう', intro: 'bug',
        goalEn: 'This program has a bug. Fix it!', goalJa: 'この プログラムには まちがい（バグ）が 1つ ある。なおそう！',
        maps: [['>.. ', ' T. ', ' H. ']], goal: { home: true },
        palette: MOVE, max: 8,
        start: `go forward
go forward
turn right
go forward
go forward
turn left
go forward`,
        solution: `go forward
go forward
turn right
go forward
go forward
turn right
go forward`,
      },
      {
        title: 'Gem trip', ja: 'ジェムあつめ',
        goalEn: 'Get both gems. Then go home.', goalJa: 'ジェムを 2つ ひろって いえに かえろう。',
        maps: [['g.. ', '.T. ', '^.gH']], goal: { home: true, gems: true },
        palette: [...MOVE, 'pick'], max: 14,
        solution: `go forward
go forward
pick it up
turn right
go forward
go forward
turn right
go forward
go forward
pick it up
turn left
go forward`,
      },
    ],
  },
  {
    id: 2, en: 'Again and again', ja: 'くりかえし', idea: 'Loops', ideaJa: 'くりかえし', theme: 'beach',
    levels: [
      {
        title: 'Repeat!', ja: 'くりかえそう', intro: 'repeat',
        goalEn: 'Go home with only 3 blocks.', goalJa: 'ブロック 3こ までで いえに かえろう。',
        maps: [['  T   T  ', '>.......H']], goal: { home: true },
        palette: [...MOVE, 'repeat'], max: 3,
        anti: [`go forward
go forward
go forward`],
        solution: `repeat 8 times:
    go forward`,
      },
      {
        title: 'Stairs', ja: 'かいだん',
        goalEn: 'Climb the stairs. Find the pattern!', goalJa: 'おなじ うごきを みつけて くりかえそう。',
        maps: [['   H', '  ..', ' .. ', '>.  ']], goal: { home: true },
        palette: [...MOVE, 'repeat'], max: 6,
        solution: `repeat 3 times:
    go forward
    turn left
    go forward
    turn right`,
      },
      {
        title: 'Paint it red', ja: 'あかく ぬろう', intro: 'paint',
        goalEn: 'Paint all the tiles red.', goalJa: 'しろい タイルを ぜんぶ あかに ぬろう。',
        maps: [[' T     ', '>ppppp ']], goal: { paint: true },
        target: [['       ', ' rrrrr ']],
        palette: [...MOVE, 'repeat', 'paint'], colors: ['red'], max: 4,
        solution: `repeat 5 times:
    go forward
    paint it red`,
      },
      {
        title: 'Stripes', ja: 'しましま',
        goalEn: 'Paint red, blue, red, blue…', goalJa: 'あか、あお、あか、あお… の しましまに しよう。',
        maps: [[' T  T  ', '>pppppp']], goal: { paint: true },
        target: [['       ', '.rbrbrb']],
        palette: [...MOVE, 'repeat', 'paint'], colors: ['red', 'blue'], max: 6,
        solution: `repeat 3 times:
    go forward
    paint it red
    go forward
    paint it blue`,
      },
      {
        title: 'Fences', ja: 'さく', intro: 'nested',
        goalEn: 'Build 3 fences. Each fence has 3 posts.', goalJa: 'さくを 3つ つくろう。1つの さくは ポスト 3こ。',
        maps: [['  T       T  ', '>ppp.ppp.ppp.']], goal: { paint: true },
        target: [['             ', ' rrr.rrr.rrr.']],
        palette: [...MOVE, 'repeat', 'paint'], colors: ['red'], max: 6,
        start: `repeat 3 times:
    go forward
    paint it red`,
        anti: [`repeat 3 times:
    go forward
    paint it red
    go forward
    paint it red
    go forward
    paint it red
    go forward`],
        solution: `repeat 3 times:
    repeat 3 times:
        go forward
        paint it red
    go forward`,
      },
      {
        title: 'Big square', ja: 'おおきな しかく',
        goalEn: 'Paint the red square. One side is 4 tiles.', goalJa: 'あかい しかくを ぬろう。1つの へんは 4マス。',
        maps: [['>pppp', 'p...p', 'p.T.p', 'p...p', 'ppppp']], startOnPad: true, goal: { paint: true },
        target: [['rrrrr', 'r...r', 'r...r', 'r...r', 'rrrrr']],
        palette: [...MOVE, 'repeat', 'paint'], colors: ['red', 'blue'], max: 6,
        anti: [`repeat 4 times:
    paint it red
    go forward
    paint it red
    go forward
    paint it red
    go forward
    paint it red
    go forward
    turn right`],
        solution: `repeat 4 times:
    repeat 4 times:
        paint it red
        go forward
    turn right`,
      },
      {
        title: 'Gem stairs', ja: 'ジェムの かいだん',
        goalEn: 'Get every gem on the stairs. Then go home.', goalJa: 'かいだんの ジェムを ぜんぶ ひろって いえへ。',
        maps: [['   gH', '  g. ', ' g.  ', '>.   ']], goal: { home: true, gems: true },
        palette: [...MOVE, 'pick', 'repeat'], max: 8,
        solution: `repeat 3 times:
    go forward
    turn left
    go forward
    pick it up
    turn right
go forward`,
      },
    ],
  },
  {
    id: 3, en: 'New words', ja: 'あたらしい ことば', idea: 'Functions', ideaJa: 'ことばを おしえる（かんすう）', theme: 'orchard',
    levels: [
      {
        title: 'Turn around', ja: 'うしろを むく', intro: 'words',
        goalEn: 'Use the new word "turn around".', goalJa: 'あたらしい ことば「turn around」を つかおう。',
        maps: [['  T    ', 'H..>..g']], goal: { home: true, gems: true },
        palette: [...MOVE, 'pick', 'repeat'], max: 10,
        start: `to turn around:
    turn right
    turn right`,
        solution: `to turn around:
    turn right
    turn right
repeat 3 times:
    go forward
pick it up
turn around
repeat 6 times:
    go forward`,
      },
      {
        title: 'Paint a box', ja: 'はこを ぬる',
        goalEn: 'Teach Bit how to paint a box. Use it twice.', goalJa: '「paint a box」の やりかたを おしえて、2かい つかおう。',
        maps: [['........', '.>p..pp.', '.pp..pp.', '........']], startOnPad: true, goal: { paint: true, word: true },
        target: [['........', '.rr..rr.', '.rr..rr.', '........']],
        palette: [...MOVE, 'repeat', 'paint'], colors: ['red'], max: 9,
        start: `to paint a box:`,
        solution: `to paint a box:
    repeat 4 times:
        paint it red
        go forward
        turn right
paint a box
repeat 4 times:
    go forward
paint a box`,
      },
      {
        title: 'Three boxes', ja: 'はこが 3つ',
        goalEn: 'Three boxes, but the spaces are different.', goalJa: 'はこが 3つ。あいだの ながさが ちがうよ。',
        maps: [['...........', '.>p.pp..pp.', '.pp.pp..pp.', '...........']], startOnPad: true, goal: { paint: true, word: true },
        target: [['...........', '.rr.rr..rr.', '.rr.rr..rr.', '...........']],
        palette: [...MOVE, 'repeat', 'paint'], colors: ['red'], max: 12,
        start: `to paint a box:`,
        solution: `to paint a box:
    repeat 4 times:
        paint it red
        go forward
        turn right
paint a box
repeat 3 times:
    go forward
paint a box
repeat 4 times:
    go forward
paint a box`,
      },
      {
        title: 'Your own word', ja: 'じぶんの ことば', intro: 'name',
        goalEn: 'Make a new word to get a gem. Use it twice.', goalJa: 'ジェムを とってくる ことばを つくって、2かい つかおう。',
        maps: [['  g   g  ', '>.......H']], goal: { home: true, gems: true, word: true },
        palette: [...MOVE, 'pick', 'repeat', 'newword'], words: ['get the gem', 'hop', 'dance', 'climb', 'zigzag'], max: 16,
        solution: `to get the gem:
    turn left
    go forward
    pick it up
    turn right
    turn right
    go forward
    turn left
repeat 2 times:
    go forward
get the gem
repeat 4 times:
    go forward
get the gem
repeat 2 times:
    go forward`,
      },
      {
        title: 'Fix the word', ja: 'ことばの バグ',
        goalEn: 'The word "paint a box" has a bug. Fix it!', goalJa: '「paint a box」の やりかたに バグが ある。なおそう！',
        maps: [['........', '.>p..pp.', '.pp..pp.', '........']], startOnPad: true, goal: { paint: true, word: true },
        target: [['........', '.rr..rr.', '.rr..rr.', '........']],
        palette: [...MOVE, 'repeat', 'paint'], colors: ['red'], max: 9,
        start: `to paint a box:
    repeat 4 times:
        paint it red
        turn right
        go forward
paint a box
repeat 4 times:
    go forward
paint a box`,
        solution: `to paint a box:
    repeat 4 times:
        paint it red
        go forward
        turn right
paint a box
repeat 4 times:
    go forward
paint a box`,
      },
    ],
  },
  {
    id: 4, en: 'If…', ja: 'もしも', idea: 'Conditions', ideaJa: 'じょうけん（もし〜なら）', theme: 'canyon',
    levels: [
      {
        title: 'Until home', ja: 'いえに つくまで', intro: 'until',
        goalEn: 'One program, three maps!', goalJa: '1つの プログラムで 3つの マップ ぜんぶ クリアしよう！',
        maps: [['>...H'], ['>......H'], ['>..H']], goal: { home: true },
        palette: [...MOVE, 'repeat', 'until'], conds: ['home'], max: 3,
        anti: [`repeat 4 times:
    go forward`],
        solution: `repeat until Bit is home:
    go forward`,
      },
      {
        title: 'Is there a gem?', ja: 'ジェムは ある？', intro: 'if',
        goalEn: 'Pick up a gem only if Bit is on one.', goalJa: 'ジェムの うえに いる とき だけ ひろおう。',
        maps: [['>.g..g.H'], ['>..gg..H'], ['>g.g.g.H']], goal: { home: true, gems: true },
        palette: [...MOVE, 'pick', 'repeat', 'until', 'if'], conds: ['home', 'onGem'], max: 6,
        anti: [`repeat until Bit is home:
    go forward
    pick it up`],
        solution: `repeat until Bit is home:
    go forward
    if Bit is on a gem:
        pick it up`,
      },
      {
        title: 'Turn at the end', ja: 'いきどまりで まがる', intro: 'ifelse',
        goalEn: 'Go forward if you can. Otherwise, turn right.', goalJa: 'すすめたら すすむ。すすめなかったら みぎを むく。',
        maps: [['>...', '   .', '   H'], ['>. ', ' . ', 'H. '], ['>....', '    .', '  H .', '  ...']], goal: { home: true },
        palette: [...MOVE, 'repeat', 'until', 'if', 'ifelse'], conds: ['home', 'canForward', 'cantForward'], max: 6,
        solution: `repeat until Bit is home:
    if Bit can go forward:
        go forward
    otherwise:
        turn right`,
      },
      {
        title: 'Left or right?', ja: 'ひだり？ みぎ？',
        goalEn: 'Some paths turn left. Some turn right.', goalJa: 'ひだりに まがる みちも、みぎに まがる みちも ある。',
        maps: [['>..   ', '  .   ', '  ...H'], ['  ..H', '  .  ', '>..  '], ['v    ', '.    ', '...  ', '  .  ', '  ..H']], goal: { home: true },
        palette: [...MOVE, 'repeat', 'until', 'if', 'ifelse'], conds: ['home', 'canForward', 'canLeft', 'canRight'], max: 8,
        solution: `repeat until Bit is home:
    if Bit can go forward:
        go forward
    otherwise:
        if Bit can go left:
            turn left
        otherwise:
            turn right`,
      },
      {
        title: 'Color signs', ja: 'いろの サイン',
        goalEn: 'Red tile: turn right. Blue tile: turn left.', goalJa: 'あかい タイルで みぎ、あおい タイルで ひだりを むこう。',
        maps: [['>..1 ', '   . ', '   2H'], ['  1H', '  . ', '>.2 '], ['>.1   ', '  .   ', '  . 1H', '  2.2 ']], goal: { home: true },
        palette: [...MOVE, 'repeat', 'until', 'if', 'ifelse'], conds: ['home', 'red', 'blue'], max: 8,
        solution: `repeat until Bit is home:
    go forward
    if the tile is red:
        turn right
    if the tile is blue:
        turn left`,
      },
      {
        title: 'The maze', ja: 'めいろ', intro: 'maze',
        goalEn: 'Keep your right hand on the wall!', goalJa: 'みぎての ルール：みぎに いけたら みぎへ！',
        maps: [
          ['>..#H', '#.#..', '..#.#', '.##..', '....#'],
          ['v#...', '.#.#.', '...#H', '##.##', 'T...T'],
          ['>..#.', '#.#..', '..#.#', '.#..H', '...#.'],
        ],
        goal: { home: true },
        palette: [...MOVE, 'repeat', 'until', 'if', 'ifelse'], conds: ['home', 'canForward', 'canLeft', 'canRight'], max: 9,
        solution: `repeat until Bit is home:
    if Bit can go right:
        turn right
        go forward
    otherwise:
        if Bit can go forward:
            go forward
        otherwise:
            turn left`,
      },
    ],
  },
  {
    id: 5, en: 'Count it!', ja: 'かぞえよう', idea: 'Variables', ideaJa: 'へんすう（かずを おぼえる）', theme: 'snow',
    levels: [
      {
        title: 'How far?', ja: 'なんマス？', intro: 'vars',
        goalEn: 'Walk to the rock. Say how many steps.', goalJa: 'いわまで あるいて、なんマス すすんだか いおう。',
        maps: [['>...#'], ['>.....#'], ['>..#']], goal: { say: 'distance' },
        palette: [...MOVE, 'repeat', 'until', 'set', 'add', 'say'], conds: ['cantForward', 'canForward', 'home'], vars: ['steps'], max: 7,
        solution: `set steps to 0
repeat until Bit can't go forward:
    go forward
    add 1 to steps
say steps`,
      },
      {
        title: 'Count the gems', ja: 'ジェムを かぞえる',
        goalEn: 'Pick up the gems. Say how many.', goalJa: 'ジェムを ひろって、いくつ あったか いおう。',
        maps: [['>.g.gg.H'], ['>g...g.H'], ['>.ggg.gH']], goal: { home: true, gems: true, say: 'gems' },
        palette: [...MOVE, 'pick', 'repeat', 'until', 'if', 'set', 'add', 'say'], conds: ['home', 'onGem'], vars: ['gems'], max: 9,
        solution: `set gems to 0
repeat until Bit is home:
    go forward
    if Bit is on a gem:
        pick it up
        add 1 to gems
say gems`,
      },
      {
        title: 'Spiral', ja: 'うずまき', intro: 'loopvar',
        goalEn: 'Each line is one longer. Use "size"!', goalJa: 'せんが 1つずつ ながく なる。「size」を つかおう！',
        maps: [['pppppp', 'pppppp', 'pp>ppp', 'pppppp', 'pppppp']], startOnPad: true, goal: { paint: true },
        target: 'solution',
        palette: [...MOVE, 'repeat', 'paint', 'set', 'add'], colors: ['red', 'blue'], vars: ['size'], max: 9,
        solution: `set size to 1
repeat 5 times:
    repeat size times:
        paint it red
        go forward
    turn right
    add 1 to size`,
      },
      {
        title: 'Treasure maze', ja: 'たからの めいろ',
        goalEn: 'Get all the gems in the maze. Say how many.', goalJa: 'めいろの ジェムを ぜんぶ ひろって、かずを いおう。',
        maps: [
          ['>..#H', '#.#..', 'g.#.#', '.##g.', '.g.g#'],
          ['v#.g.', '.#.#.', 'g..#H', '##.##', 'Tg.gT'],
        ],
        goal: { home: true, gems: true, say: 'gems' },
        palette: [...MOVE, 'pick', 'repeat', 'until', 'if', 'ifelse', 'set', 'add', 'say'], conds: ['home', 'onGem', 'canForward', 'canLeft', 'canRight'], vars: ['gems'], max: 14,
        solution: `set gems to 0
repeat until Bit is home:
    if Bit is on a gem:
        pick it up
        add 1 to gems
    if Bit can go right:
        turn right
        go forward
    otherwise:
        if Bit can go forward:
            go forward
        otherwise:
            turn left
say gems`,
      },
    ],
  },
];

const COLOR_LETTER = { r: 'red', b: 'blue', y: 'yellow', g: 'green', k: 'pink', u: 'purple' };

// Fill in ids, parsed maps, programs, paint targets and par.
export const LEVELS = [];
for (const w of WORLDS) {
  w.levels.forEach((lv, i) => {
    lv.id = w.id + '-' + (i + 1);
    lv.world = w;
    lv.index = LEVELS.length;
    lv.parsed = lv.maps.map((m) => parseMap(m, lv));
    lv.startProgram = lv.start ? parseProgram(lv.start) : { main: [], defs: [] };
    lv.startProgram.defs.forEach((d) => { d.given = true; });
    lv.solutionProgram = parseProgram(lv.solution);
    lv.par = countBlocks(lv.solutionProgram);
    if (lv.goal.paint) {
      if (lv.target === 'solution') {
        lv.targets = lv.parsed.map((_, mi) => {
          const probe = { ...lv, goal: { home: false }, targets: null };
          return runProgram(lv.solutionProgram, probe, mi).state.cells.map((c) => (c.k === 'pad' ? c.color : null));
        });
      } else {
        lv.targets = lv.target.map((rows, mi) => {
          const m = lv.parsed[mi];
          const out = [];
          for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) out.push(COLOR_LETTER[(rows[y] || '')[x]] || null);
          return out;
        });
      }
    }
    LEVELS.push(lv);
  });
}
export const levelById = (id) => LEVELS.find((l) => l.id === id);
