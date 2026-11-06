/* Word Bot levels: Stage 1 "Move".
 *
 * Map legend:  .=floor  #=wall  o=hole/water  B=Bit  *=star  c=coin  k=key  D=door  F=friend
 * par = fewest blocks that solve it (checked by tests/levels.test.js, so it cannot drift).
 * blocks = palette order; newBlocks = blocks first met in this level (get a NEW badge).
 * numMax > 1 turns on the number slot on movement blocks.
 */
(function (root) {
  'use strict';

  const levels = [
    {
      id: 1, title: 'Hello, Bit', ja: 'こんにちは、ビット', theme: 'park',
      goal: 'Tap "go right". Then press Run!', goalJa: '「go right」を タップして、Run ボタンを おそう！',
      map: ['.....', '..B*.', '.....'],
      blocks: ['right'], newBlocks: ['right'], numMax: 1, maxBlocks: 5, par: 1,
    },
    {
      id: 2, title: 'Go right 3', ja: 'みぎへ 3マス', theme: 'park',
      goal: 'Make Bit go right 3.', goalJa: 'かずを タップして 3に しよう。',
      map: ['......', 'B..*..', '......'],
      blocks: ['right'], newBlocks: [], numMax: 5, maxBlocks: 5, par: 1, tip: 'number',
    },
    {
      id: 3, title: 'Up and over', ja: 'うえへ いこう', theme: 'park',
      goal: 'Take Bit to the star.', goalJa: 'ビットを ほしまで つれていこう。',
      map: ['.....*', '......', '..##..', '......', 'B.....'],
      blocks: ['right', 'up'], newBlocks: ['up'], numMax: 5, maxBlocks: 6, par: 2,
    },
    {
      id: 4, title: 'Jump the water', ja: 'みずを とびこえよう', theme: 'beach',
      goal: 'Jump over the water!', goalJa: 'みずを ジャンプで こえよう！',
      map: ['..o....', 'B.o..*.', '..o....'],
      blocks: ['right', 'jump'], newBlocks: ['jump'], numMax: 5, maxBlocks: 6, par: 3,
    },
    {
      id: 5, title: 'Bonk!', ja: 'ゴン！', theme: 'beach',
      goal: 'Find the way to the star.', goalJa: 'ほしまでの みちを みつけよう。Step ボタンも つかってみよう！',
      map: ['B....#', '####.#', '*....#'],
      blocks: ['right', 'left', 'up', 'down'], newBlocks: ['left', 'down'], numMax: 5, maxBlocks: 6, par: 3, tip: 'step',
    },
    {
      id: 6, title: 'Get the coin', ja: 'コインを とろう', theme: 'roof',
      goal: 'Get the coin. Then go to the star.', goalJa: 'コインを とってから ほしへ いこう。',
      map: ['..c....', '.......', 'B.....*', '.......'],
      blocks: ['right', 'left', 'up', 'down', 'coin'], newBlocks: ['coin'], numMax: 6, maxBlocks: 8, par: 5,
    },
    {
      id: 7, title: 'The red door', ja: 'あかい ドア', theme: 'roof',
      goal: 'Get the key. Open the door.', goalJa: 'かぎを とって ドアを あけよう。',
      map: ['...#...', 'Bk.D..*', '...#...'],
      blocks: ['right', 'left', 'up', 'down', 'coin', 'key', 'door'], newBlocks: ['key', 'door'], numMax: 6, maxBlocks: 8, par: 5,
    },
    {
      id: 8, title: 'Hello, friend', ja: 'こんにちは、ともだち', theme: 'park',
      goal: 'Say hello to the friend!', goalJa: 'ともだちに あいさつしよう！',
      map: ['..F...', 'B....*', '......'],
      blocks: ['right', 'left', 'up', 'down', 'say'], newBlocks: ['say'], numMax: 6, maxBlocks: 8, par: 3,
      sayWords: ['Hello!', 'Goodbye!', 'Thank you!'], friendWants: 'Hello!',
    },
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = levels;
  else { root.WB = root.WB || {}; root.WB.levels = levels; }
})(typeof window !== 'undefined' ? window : globalThis);
