// The tutorial checks must run the kid's game, not just look for blocks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TUTORIALS } from '../src/studio/tutorials.js';
import { parseProgram } from '../src/engine/text.js';
import { makeSprite, newProject } from '../src/studio/projects.js';

const WALK = (extra = '') => `when I press Run:
    forever:
        if I am pressing right arrow:
            point right
            move 10 steps
        if I am pressing left arrow:
            point left
            move 10 steps
        if I am pressing up arrow:
            point up
            move 10 steps
        if I am pressing down arrow:
            point down
            move 10 steps${extra}`;
const STAR = (win = 'if score is more than 5:\n        you win!') => `when it touches Bit:
    change score by 1
    go to a random place
    ${win}`;
function game({ bit = WALK(), star = STAR(), vars = ['score'] } = {}) {
  const p = newProject(); p.vars = vars;
  p.sprites.push(makeSprite('star', p, { x: 400, y: 300 }));
  p.sprites[0].scripts = parseProgram(bit, { studio: true }).scripts;
  p.sprites[1].scripts = parseProgram(star, { studio: true }).scripts;
  return p;
}
const first = TUTORIALS[0];
const results = (p) => first.steps.slice(0, -1).map((s) => !!s.check(p, { ended: null }, {}));

test('a correct first game passes every checked step', () => {
  assert.deepEqual(results(game()), first.steps.slice(0, -1).map(() => true));
});

test('an empty project passes only "add a star"', () => {
  const p = newProject(); p.sprites.push(makeSprite('star', p));
  assert.deepEqual(results(p), [true, ...first.steps.slice(1, -1).map(() => false)]);
});

test('arrow "if" with nothing inside does not count as walking', () => {
  const bit = `when I press Run:\n    forever:\n        if I am pressing right arrow:\n            point right`;
  assert.equal(first.steps[3].check(game({ bit }), {}, {}), false);
});

test('the wrong key does not pass the right-arrow step', () => {
  const bit = WALK().replace('pressing right arrow', 'pressing space');
  assert.equal(first.steps[3].check(game({ bit }), {}, {}), false);
});

test('moving only 1 step is too small to count as walking', () => {
  const bit = WALK().replace(/move 10 steps/g, 'move 1 steps');
  assert.equal(first.steps[3].check(game({ bit }), {}, {}), false);
});

test('up/down must really move Bit up and down', () => {
  const bit = WALK().replace('point up', 'point left').replace('point down', 'point left');
  assert.equal(first.steps[5].check(game({ bit }), {}, {}), false);
});

test('touching the star only counts if score really goes up', () => {
  assert.equal(first.steps[7].check(game({ star: 'when it touches Bit:\n    go to a random place' }), {}, {}), false);
  assert.equal(first.steps[7].check(game({ star: 'when it touches Bit:\n    change score by 1' }), {}, {}), true);
});

test('the star must jump away after it is caught', () => {
  assert.equal(first.steps[8].check(game({ star: 'when it touches Bit:\n    change score by 1' }), {}, {}), false);
});

test('"you win!" must really end the game, and not too early or never', () => {
  assert.equal(first.steps[9].check(game({ star: STAR('if score is more than 50:\n        you win!') }), {}, {}), false);
  assert.equal(first.steps[9].check(game({ star: STAR('you win!') }), {}, {}), true, 'a bare win also ends the game');
});

test('final step needs a real win from playing, not a skipped game', () => {
  const last = first.steps[first.steps.length - 1];
  assert.equal(last.check({}, { ended: null }, {}), false);
  assert.equal(last.check({}, { ended: 'lose' }, {}), false);
  assert.equal(last.check({}, { ended: 'win' }, {}), true);
});

test('the story tutorial hears the friend answer through a message', () => {
  const t = TUTORIALS[1];
  const p = newProject(); p.sprites.push(makeSprite('pip', p));
  p.sprites[0].scripts = parseProgram('when I press Run:\n    say Hello! for 2 seconds\n    send the message hello', { studio: true }).scripts;
  const noFriend = t.steps[3].check(p, {}, {});
  p.sprites[1].scripts = parseProgram('when I get the message hello:\n    say Hi! for 2 seconds', { studio: true }).scripts;
  assert.equal(noFriend, false);
  assert.equal(t.steps[3].check(p, {}, {}), true);
  p.sprites[1].scripts = parseProgram('when I get the message bye:\n    say Hi! for 2 seconds', { studio: true }).scripts;
  assert.equal(t.steps[3].check(p, {}, {}), false, 'a different message name never arrives');
});

test('the rain tutorial needs copies that fall and then go away', () => {
  const t = TUTORIALS[2];
  const mk = (clone) => { const p = newProject(); p.sprites.push(makeSprite('apple', p));
    p.sprites[1].scripts = parseProgram(`when I press Run:\n    hide\n    forever:\n        make a copy of me\n        wait 1 seconds\nwhen I start as a copy:\n${clone}`, { studio: true }).scripts; return p; };
  const good = mk('    go to the top\n    show\n    repeat 70 times:\n        change y by -5\n    delete this copy');
  assert.equal(t.steps[2].check(good, {}, {}), true);
  assert.equal(t.steps[3].check(good, {}, {}), true);
  const noDelete = mk('    go to the top\n    show\n    repeat 70 times:\n        change y by -5');
  assert.equal(t.steps[3].check(noDelete, {}, {}), false, 'copies pile up without delete');
});
