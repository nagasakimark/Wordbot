// Run with: node tests/levels.test.js
// Proves every level is solvable, par is the true minimum, and the rules behave as taught.
const assert = require('assert');
const core = require('../js/core.js');
const levels = require('../js/levels.js');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('  ok  ' + name); }
  catch (e) { failures++; console.log('FAIL  ' + name + '\n      ' + e.message); }
}

console.log('Levels');
for (const lv of levels) {
  check('level ' + lv.id + ' "' + lv.title + '": map is rectangular with exactly one Bit and one star', () => {
    const w = lv.map[0].length;
    lv.map.forEach((r) => assert.strictEqual(r.length, w, 'row length'));
    const flat = lv.map.join('');
    assert.strictEqual((flat.match(/B/g) || []).length, 1);
    assert.strictEqual((flat.match(/\*/g) || []).length, 1);
  });
  check('level ' + lv.id + ': solvable and par = true minimum', () => {
    const sol = core.solve(lv, 10);
    assert(sol, 'no solution found');
    assert.strictEqual(sol.length, lv.par, 'par is ' + lv.par + ' but shortest solution is ' + sol.length + ': ' + JSON.stringify(sol));
    assert(sol.length <= lv.maxBlocks, 'solution does not fit maxBlocks');
    const r = core.runProgram(lv, sol);
    assert(r.won);
  });
  check('level ' + lv.id + ': every block in the palette is defined; new blocks are in the palette', () => {
    lv.blocks.forEach((id) => assert(core.BLOCKS[id], id));
    lv.newBlocks.forEach((id) => assert(lv.blocks.includes(id), id));
  });
}

console.log('Rules');
const L = (id) => levels[id - 1];
const R = (n) => ({ id: 'right', n: n || 1 });
check('walking off the edge bonks', () => {
  const r = core.runProgram(L(1), [R(1), R(1), R(1)]);
  assert.strictEqual(r.failed, 'edge');
});
check('level 1: one "go right" wins', () => assert(core.runProgram(L(1), [R(1)]).won));
check('level 2: go right 3 wins, go right 4 overshoots (numbers matter)', () => {
  assert(core.runProgram(L(2), [R(3)]).won);
  assert(!core.runProgram(L(2), [R(4)]).won);
});
check('level 4: walking into the water falls, jump clears it', () => {
  assert.strictEqual(core.runProgram(L(4), [R(2)]).failed, 'hole');
  assert.strictEqual(core.runProgram(L(4), [{ id: 'jump' }]).failed, 'hole'); // lands in the water from too far
  assert(core.runProgram(L(4), [R(1), { id: 'jump' }, R(2)]).won);
});
check('level 5: going down too early hits a wall', () => {
  assert.strictEqual(core.runProgram(L(5), [{ id: 'down' }]).failed, 'wall');
});
check('level 6: star stays asleep until the coin is taken', () => {
  // Walk straight to the star without the coin.
  const r = core.runProgram(L(6), [R(6)]);
  assert(!r.won);
  assert.strictEqual(r.reason, 'needcoin');
});
check('level 6: "get the coin" with no coin here fails softly', () => {
  assert.strictEqual(core.runProgram(L(6), [{ id: 'coin' }]).failed, 'nocoin');
});
check('level 7: door needs the key and is solid until opened', () => {
  assert.strictEqual(core.runProgram(L(7), [{ id: 'right', n: 2 }, { id: 'door' }]).failed, 'needkey');
  assert.strictEqual(core.runProgram(L(7), [{ id: 'right', n: 3 }]).failed, 'door');
});
check('level 8: friend only reacts to the right word, and only when next to Bit', () => {
  const near = (word) => core.runProgram(L(8), [R(2), { id: 'say', word: word }]);
  assert(near('Hello!').st.friend.happy);
  assert(!near('Goodbye!').st.friend.happy);
  assert(!core.runProgram(L(8), [{ id: 'say', word: 'Hello!' }]).st.friend.happy, 'too far away');
});
check('text helpers read as English and give Japanese hints', () => {
  assert.strictEqual(core.blockEnglish({ id: 'right', n: 3 }), 'go right 3');
  assert.strictEqual(core.blockSpoken({ id: 'right', n: 3 }), 'go right three');
  assert.strictEqual(core.blockEnglish({ id: 'say', word: 'Hello!' }), 'say "Hello!"');
  assert.strictEqual(core.blockJa({ id: 'right', n: 3 }), 'みぎへ 3マス すすむ');
});

console.log(failures ? '\n' + failures + ' FAILED' : '\nall passed');
process.exit(failures ? 1 : 0);
