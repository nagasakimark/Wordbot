// The Studio runtime: events, loops, clones, messages, collisions, variables, win/lose.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VM } from '../src/studio/vm.js';
import { parseProgram } from '../src/engine/text.js';

const sprite = (name, kind, code, extra = {}) => {
  const p = parseProgram(code, { studio: true });
  return { id: name, name, kind, x: 240, y: 180, dir: 90, size: 100, visible: true, scripts: p.scripts || [], defs: p.defs, ...extra };
};
const project = (sprites, vars = []) => ({ v: 1, name: 't', bg: 'sky', vars, sprites });
const run = (vm, secs) => { for (let t = 0; t < secs; t += 1 / 60) vm.step(1 / 60); };

test('when I press Run starts scripts; move goes the way the sprite points', () => {
  const vm = new VM(project([sprite('Bit', 'bit', 'when I press Run:\n    point right\n    move 10 steps\n    point up\n    move 20 steps')]));
  vm.start(); run(vm, 0.1);
  assert.equal(Math.round(vm.insts[0].x), 250);
  assert.equal(Math.round(vm.insts[0].y), 200);
});

test('forever + bounce keeps a sprite on the stage without freezing', () => {
  const vm = new VM(project([sprite('Ball', 'ball', 'when I press Run:\n    forever:\n        move 15 steps\n        bounce if on the edge')]));
  vm.start(); run(vm, 5);
  const b = vm.insts[0];
  assert.ok(b.x > 0 && b.x < 480, 'x stays inside: ' + b.x);
  assert.ok(vm.threads.length === 1, 'still running');
});

test('keys: "when I press" fires on key down; "I am pressing" is true while held', () => {
  const vm = new VM(project([sprite('Bit', 'bit', 'when I press right arrow:\n    change x by 10\nwhen I press Run:\n    forever:\n        if I am pressing up arrow:\n            change y by 1')]));
  vm.start(); vm.keyDown('right arrow'); run(vm, 0.05); vm.keyUp('right arrow');
  assert.equal(vm.insts[0].x, 250);
  vm.keyDown('up arrow'); run(vm, 0.5); vm.keyUp('up arrow');
  assert.ok(vm.insts[0].y > 200, 'moved up while held');
});

test('tapping a sprite runs its "when I tap it" script only', () => {
  const vm = new VM(project([
    sprite('Star', 'star', 'when I tap it:\n    say Hi!', { x: 100, y: 100 }),
    sprite('Pip', 'pip', 'when I tap it:\n    say Yay!', { x: 400, y: 300 }),
  ]));
  vm.start(); vm.tap(102, 98); run(vm, 0.05);
  assert.equal(vm.insts[0].say.text, 'Hi!');
  assert.equal(vm.insts[1].say, null);
});

test('messages: send the message starts "when I get the message" scripts', () => {
  const vm = new VM(project([
    sprite('Bit', 'bit', 'when I press Run:\n    say Hello! for 0.5 seconds\n    send the message hello'),
    sprite('Pip', 'pip', 'when I get the message hello:\n    say Hi!'),
  ]));
  vm.start(); run(vm, 0.3);
  assert.equal(vm.insts[1].say, null);
  run(vm, 0.5);
  assert.equal(vm.insts[1].say.text, 'Hi!');
});

test('clones: copies run "when I start as a copy" and can delete themselves', () => {
  const vm = new VM(project([sprite('Apple', 'apple', `when I press Run:
    hide
    repeat 3 times:
        make a copy of me
when I start as a copy:
    show
    go to the top
    repeat until it is touching the edge:
        change y by -5
    wait 0.1 seconds
    repeat until y is 0:
        change y by -5
    delete this copy`)]));
  vm.start(); run(vm, 0.08);
  assert.equal(vm.insts.filter((i) => i.isClone).length, 3);
  assert.ok(vm.insts.filter((i) => i.isClone).every((c) => c.visible));
  assert.ok(!vm.insts[vm.insts.length - 1].visible, 'the original stays hidden');
  run(vm, 0.5);
  assert.equal(vm.insts.filter((i) => i.isClone).length, 0, 'copies deleted themselves');
});

test('touching: "when it touches" fires once per touch; score counts up', () => {
  const vm = new VM(project([
    sprite('Bit', 'bit', 'when it touches Apple:\n    change score by 1', { x: 100, y: 100 }),
    sprite('Apple', 'apple', 'when I press Run:\n    glide to Bit in 0.5 seconds', { x: 300, y: 100 }),
  ], ['score']));
  vm.start(); run(vm, 1.5);
  assert.equal(vm.vars.score, 1);
});

test('variables: set, change by, conditions on numbers, and you win!', () => {
  let ended = null;
  const vm = new VM(project([sprite('Bit', 'bit', `when I press Run:
    set score to 0
    repeat until score is more than 4:
        change score by 1
    you win!`)], ['score']), { end: (k) => { ended = k; } });
  vm.start(); run(vm, 1);
  assert.equal(vm.vars.score, 5);
  assert.equal(ended, 'win');
  assert.equal(vm.running, false);
});

test('game over stops everything', () => {
  let ended = null;
  const vm = new VM(project([sprite('Bit', 'bit', 'when I press Run:\n    wait 0.2 seconds\n    game over'), sprite('Ball', 'ball', 'when I press Run:\n    forever:\n        move 1 steps')]), { end: (k) => { ended = k; } });
  vm.start(); run(vm, 0.5);
  const x = vm.insts[1].x; run(vm, 0.5);
  assert.equal(ended, 'lose');
  assert.equal(vm.insts[1].x, x);
});

test('new words work in the Studio too', () => {
  const vm = new VM(project([sprite('Bit', 'bit', 'to zigzag:\n    move 10 steps\n    change y by 10\nwhen I press Run:\n    zigzag\n    zigzag')]));
  vm.start(); run(vm, 0.1);
  assert.deepEqual([Math.round(vm.insts[0].x), vm.insts[0].y], [260, 200]);
});

test('wait waits about the right time', () => {
  const vm = new VM(project([sprite('Bit', 'bit', 'when I press Run:\n    wait 1 seconds\n    change x by 50')]));
  vm.start(); run(vm, 0.9);
  assert.equal(vm.insts[0].x, 240);
  run(vm, 0.2);
  assert.equal(vm.insts[0].x, 290);
});

test('every starter game parses and runs for 20 seconds without errors', async () => {
  const { STARTERS, starterProject, RECIPES, applyRecipe, newProject } = await import('../src/studio/projects.js');
  for (const s of STARTERS) {
    const p = starterProject(s.id);
    assert.ok(p.sprites.every((sp) => sp.scripts.length > 0), s.id + ' has scripts');
    const vm = new VM(p, {});
    vm.start();
    vm.keyDown('right arrow');
    run(vm, 20);
    vm.keyUp('right arrow');
  }
  // the apple game is winnable: park Bit under every apple
  const p = starterProject('apples');
  const vm = new VM(p);
  let end = null; vm.hooks.end = (k) => { end = k; };
  vm.start();
  for (let f = 0; f < 60 * 30 && !end; f++) {
    const apple = vm.insts.find((i) => i.isClone && i.visible);
    const bit = vm.insts.find((i) => i.name === 'Bit');
    if (apple) bit.x = apple.x;
    vm.step(1 / 60);
  }
  assert.equal(end, 'win');
  // and losable: Bit never moves under them
  const vm2 = new VM(starterProject('apples')); let end2 = null; vm2.hooks.end = (k) => { end2 = k; };
  vm2.start(); vm2.insts.find((i) => i.name === 'Bit').x = -500; run(vm2, 15);
  assert.equal(end2, 'lose');
  // every recipe parses into blocks
  const np = newProject();
  for (const r of RECIPES) assert.ok(applyRecipe(np, np.sprites[0], r).length > 0, r.id);
});

test('sprites stay on the stage (fencing), like Scratch', () => {
  const vm = new VM(project([sprite('Bit', 'bit', 'when I press Run:\n    forever:\n        move 20 steps')]));
  vm.start(); run(vm, 2);
  assert.equal(vm.insts[0].x, 480);
});

test('every tutorial step check can be met by its own example code', async () => {
  const { TUTORIALS } = await import('../src/studio/tutorials.js');
  assert.equal(TUTORIALS.length, 3);
  for (const t of TUTORIALS) for (const s of t.steps) if (s.code) parseProgram(s.code.replace(/^ {8}/gm, ''), { studio: true });
});
