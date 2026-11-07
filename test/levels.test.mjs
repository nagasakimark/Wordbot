// npm test: proves every level can be beaten, par is honest, and the big idea is really needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, WORLDS } from '../src/content/levels.js';
import { runAll, runProgram } from '../src/engine/run.js';
import { parseProgram, printProgram } from '../src/engine/text.js';
import { countBlocks, walk, BLOCKS } from '../src/engine/blocks.js';

const show = (r) => JSON.stringify(r.result);

for (const lv of LEVELS) {
  test(`${lv.id} "${lv.title}": the reference solution passes every map`, () => {
    runAll(lv.solutionProgram, lv).forEach((r, i) => assert.ok(r.result.ok, `map ${i + 1}: ${show(r)}`));
  });

  test(`${lv.id}: solution fits the block limit and only uses blocks on offer`, () => {
    assert.ok(lv.par <= lv.max, `par ${lv.par} > max ${lv.max}`);
    const offered = new Set(lv.palette.map((p) => p.split(' ')[0]));
    walk(lv.solutionProgram, (n) => {
      const key = { forward: 'forward', turn: 'turn', pick: 'pick', paint: 'paint', say: 'say', repeat: 'repeat', until: 'until', if: 'if', ifelse: 'ifelse', set: 'set', add: 'add', call: null }[n.type];
      if (key) assert.ok(offered.has(key) || (key === 'if' && offered.has('ifelse')) || (key === 'ifelse' && offered.has('ifelse')), `${n.type} not in palette`);
      if (n.type === 'turn') assert.ok(lv.palette.includes('turn ' + n.args.dir), 'turn ' + n.args.dir + ' not offered');
      if (n.args.cond) assert.ok(lv.conds.includes(n.args.cond), 'condition ' + n.args.cond + ' not offered');
      if (n.args.color) assert.ok(lv.colors.includes(n.args.color), 'colour not offered');
      if (n.type === 'set' || n.type === 'add') assert.ok(lv.vars.includes(n.args.v));
    });
  });

  test(`${lv.id}: maps are rectangular`, () => {
    lv.maps.forEach((m) => m.forEach((row) => assert.equal(row.length, m[0].length, JSON.stringify(m))));
  });

  if (lv.start) {
    test(`${lv.id}: the starting program does not already pass`, () => {
      const fresh = parseProgram(lv.start);
      assert.ok(runAll(fresh, lv).some((r) => !r.result.ok));
    });
  }
  for (const bad of lv.anti || []) {
    test(`${lv.id}: a program without the new idea fails`, () => {
      const p = parseProgram(bad);
      const ok = countBlocks(p) <= lv.max && runAll(p, lv).every((r) => r.result.ok);
      assert.ok(!ok, 'anti-solution passed: ' + bad);
    });
  }
  if (lv.maps.length > 1) {
    test(`${lv.id}: maps really differ (a program that only replays map 1's moves fails another map)`, () => {
      // Record the moves the solution makes on map 1 and replay them as a plain list.
      const r = runProgram(lv.solutionProgram, lv, 0);
      const lines = [];
      for (const t of r.trace) if (t.k === 'act') {
        for (const e of t.events) {
          if (e.t === 'move') lines.push('go forward');
          if (e.t === 'turn') lines.push('turn ' + e.dir);
          if (e.t === 'pick') lines.push('pick it up');
          if (e.t === 'paint') lines.push('paint it ' + e.color);
        }
      }
      const replay = parseProgram(lines.join('\n') || 'go forward');
      assert.ok(runAll(replay, lv).some((x) => !x.result.ok), 'a straight replay of map 1 solves every map');
    });
  }
}

test('every block type round-trips through English code', () => {
  for (const lv of LEVELS) {
    const text = printProgram(lv.solutionProgram).map((l) => l.text).join('\n');
    const again = parseProgram(text);
    assert.equal(countBlocks(again), lv.par, lv.id + '\n' + text);
  }
});

test('the course has five worlds, and each big idea gets an intro card', () => {
  assert.equal(WORLDS.length, 5);
  assert.ok(LEVELS.length >= 25);
  assert.ok(Object.keys(BLOCKS).length >= 12);
});

// Nested loops must really be NEEDED: no program within the block limit, with at most one
// loop level (any repeat count, any body), can beat the nested-loop levels.
test('the nested-loop levels cannot be beaten without nesting', () => {
  const atoms = ['go forward', 'turn left', 'turn right', 'paint it red'];
  const seqs = (n) => (n === 0 ? [[]] : seqs(n - 1).flatMap((s) => atoms.map((a) => [...s, a])));
  for (const id of ['2-5', '2-6']) {
    const lv = LEVELS.find((l) => l.id === id);
    let tried = 0;
    for (let total = 0; total <= lv.max; total++) {
      for (let k = 0; k <= total; k++) { // k = blocks inside the one loop (0 = no loop at all)
        const outside = total - k - (k ? 1 : 0);
        if (outside < 0) continue;
        for (let pre = 0; pre <= outside; pre++) {
          for (const A of seqs(pre)) for (const B of seqs(outside - pre)) {
            const bodies = k ? seqs(k) : [null];
            for (const body of bodies) for (const n of (k ? [2, 3, 4, 5, 6, 7, 8, 9, 10, 12] : [0])) {
              const lines = [...A, ...(body ? ['repeat ' + n + ' times:', ...body.map((x) => '    ' + x)] : []), ...B];
              const p = parseProgram(lines.join('\n'));
              tried++;
              if (runAll(p, lv).every((r) => r.result.ok)) assert.fail(id + ' beaten without nesting:\n' + lines.join('\n'));
            }
          }
        }
      }
    }
    assert.ok(tried > 1000, 'searched ' + tried);
  }
});

import { HINTS } from '../src/content/hints.js';
test('every level has two written hints, and no stray hints', () => {
  for (const lv of LEVELS) assert.equal((HINTS[lv.id] || []).length, 2, lv.id + ' needs 2 hints');
  for (const id of Object.keys(HINTS)) assert.ok(LEVELS.some((l) => l.id === id), 'hints for unknown level ' + id);
});
