// Rules of the language, checked one by one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runProgram, STEP_LIMIT } from '../src/engine/run.js';
import { parseProgram, printProgram } from '../src/engine/text.js';
import { blockEnglish, blockSpoken, blockJa, countBlocks } from '../src/engine/blocks.js';

const lv = (rows, goal = { home: true }, extra = {}) => ({ maps: [rows], goal, ...extra });
const run = (code, level) => runProgram(parseProgram(code), level, 0);

test('go forward moves the way Bit faces; turning is from Bit\'s point of view', () => {
  const L = lv(['  H', '  .', '>..']);
  assert.ok(run('go forward\ngo forward\nturn left\ngo forward\ngo forward', L).result.ok);
  assert.equal(run('go forward\ngo forward\nturn right\ngo forward', L).result.reason, 'fall');
});

test('rocks and trees stop Bit (bump), sky makes Bit fall', () => {
  assert.equal(run('go forward', lv(['>#H'])).result.reason, 'bump');
  assert.equal(run('go forward', lv(['>T'])).result.reason, 'bump');
  assert.equal(run('go forward', lv(['> H'])).result.reason, 'fall');
});

test('the program must END at home', () => {
  assert.equal(run('go forward\ngo forward', lv(['>H.'])).result.reason, 'home');
  assert.equal(run('go forward', lv(['>.H'])).result.reason, 'home');
});

test('repeat runs its inside n times; loops can nest', () => {
  assert.ok(run('repeat 3 times:\n    go forward', lv(['>...H'])).result.ok === false);
  assert.ok(run('repeat 4 times:\n    go forward', lv(['>...H'])).result.ok);
  assert.ok(run('repeat 2 times:\n    repeat 2 times:\n        go forward', lv(['>...H'])).result.ok);
});

test('if / otherwise picks one branch; repeat until checks before each turn', () => {
  const r = run('repeat until Bit is home:\n    if Bit can go forward:\n        go forward\n    otherwise:\n        turn right', lv(['>..', '  .', '  H']));
  assert.ok(r.result.ok);
  const conds = r.trace.filter((t) => t.k === 'cond');
  assert.ok(conds.some((c) => c.v === true) && conds.some((c) => c.v === false));
});

test('an endless loop stops with "tired" instead of freezing', () => {
  const r = run('repeat until Bit is home:\n    turn left', lv(['>.H']));
  assert.equal(r.result.reason, 'tired');
  assert.ok(r.trace.length < STEP_LIMIT * 4);
});

test('new words (functions) run their body where they are used', () => {
  // Bit faces left on 'H.<'; "turn around" makes Bit face right, so going forward falls off.
  assert.equal(run('to turn around:\n    turn right\n    turn right\nturn around\ngo forward', lv(['H.<'])).result.reason, 'fall');
  assert.ok(run('to step:\n    go forward\nstep\nstep', lv(['<.H'.replace('<', '>')])).result.ok);
});

test('a word that is used but never taught is an error', () => {
  const p = parseProgram('to hop:\n    go forward\nhop');
  p.defs = [];
  assert.equal(runProgram(p, lv(['>H']), 0).result.reason, 'noword');
});

test('variables: set, add 1, say, and repeat [variable] times', () => {
  const L = lv(['>...#'], { say: 'distance' });
  assert.ok(run('set steps to 0\nrepeat until Bit can\'t go forward:\n    go forward\n    add 1 to steps\nsay steps', L).result.ok);
  assert.equal(run('add 1 to steps', L).result.reason, 'novar');
  const wrong = run('set steps to 2\nsay steps', L).result;
  assert.equal(wrong.reason, 'wrongsay');
  assert.equal(wrong.want, 3);
  assert.ok(run('set size to 2\nrepeat size times:\n    go forward', lv(['>.H'])).result.ok);
});

test('painting only works on white pads', () => {
  const L = { maps: [['>p']], goal: { paint: true }, targets: [[null, 'red']] };
  assert.ok(run('go forward\npaint it red', L).result.ok);
  assert.equal(run('paint it red', L).result.reason, 'nopad');
});

test('blocks read as English, with Japanese hints and spoken numbers', () => {
  const p = parseProgram('repeat 4 times:\n    paint it red\nif Bit can go forward:\n    go forward\notherwise:\n    turn left');
  assert.equal(blockEnglish(p.main[0]), 'repeat 4 times');
  assert.equal(blockSpoken(p.main[0]), 'repeat four times');
  assert.equal(blockJa(p.main[0].body[0]), 'あかに ぬる');
  assert.equal(blockEnglish(p.main[1]), 'if Bit can go forward');
  assert.equal(p.main[1].type, 'ifelse');
  assert.equal(countBlocks(p), 5);
  const text = printProgram(p).map((l) => l.text);
  assert.deepEqual(text, ['repeat 4 times:', '    paint it red', 'if Bit can go forward:', '    go forward', 'otherwise:', '    turn left']);
});
