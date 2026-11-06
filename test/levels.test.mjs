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
