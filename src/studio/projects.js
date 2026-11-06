// Studio projects: new projects, starter games to remix, idea recipes, and saving.
import { parseProgram } from '../engine/text.js';
import { newId, cloneNode } from '../engine/blocks.js';
import { LIBRARY } from './art.js';

export function makeSprite(kind, project, at = {}) {
  const taken = new Set((project?.sprites || []).map((s) => s.name));
  let name = LIBRARY[kind].name, n = 2;
  while (taken.has(name)) name = LIBRARY[kind].name + ' ' + n++;
  return { id: newId(), name, kind, x: at.x ?? 240, y: at.y ?? 180, dir: at.dir ?? 90, size: at.size ?? 100, visible: true, scripts: [], defs: [] };
}
export function newProject() {
  const p = { v: 1, id: newId() + Date.now().toString(36), name: 'My project', bg: 'meadow', vars: [], sprites: [] };
  p.sprites.push(makeSprite('bit', p, { y: 140 }));
  return p;
}
function withCode(sprite, code) {
  const prog = parseProgram(code, { studio: true });
  sprite.scripts = prog.scripts || [];
  sprite.defs = prog.defs || [];
  return sprite;
}
function build(def) {
  const p = { v: 1, id: newId() + Date.now().toString(36), name: def.name, bg: def.bg, vars: def.vars || [], sprites: [], starter: def.id };
  for (const s of def.sprites) {
    const sp = makeSprite(s.kind, p, s);
    if (s.name) sp.name = s.name;
    if (s.visible === false) sp.visible = false;
    p.sprites.push(withCode(sp, s.code));
  }
  return p;
}

const WALK4 = `when I press Run:
    forever:
        if I am pressing right arrow:
            point right
            move 6 steps
        if I am pressing left arrow:
            point left
            move 6 steps
        if I am pressing up arrow:
            point up
            move 6 steps
        if I am pressing down arrow:
            point down
            move 6 steps
        bounce if on the edge`;

export const STARTERS = [
  {
    id: 'apples', name: 'Apple Catch', ja: 'りんごキャッチ', bg: 'meadow', vars: ['score', 'lives'],
    about: 'Catch the falling apples with Bit. Miss three and the game is over.', aboutJa: 'おちてくる りんごを キャッチ！ 3こ おとすと ゲームオーバー。',
    learn: ['forever', 'if I am pressing', 'copies', 'score + lives'],
    challenges: [
      ['Make the apples fall faster.', 'りんごを はやく おとそう。（change y by -5 を かえる）'],
      ['Win with 15 points, not 10.', '15てんで かち に しよう。'],
      ['Make Bit say "Yum!" when it catches an apple.', 'りんごを とったら Bit が「Yum!」と いうように しよう。'],
      ['Add a Gem worth 5 points.', '5てんの ジェムを ついかしよう。'],
    ],
    sprites: [
      { kind: 'bit', x: 240, y: 50, code: `when I press Run:
    set score to 0
    set lives to 3
    forever:
        if I am pressing right arrow:
            point right
            move 8 steps
        if I am pressing left arrow:
            point left
            move 8 steps
        bounce if on the edge` },
      { kind: 'apple', x: 240, y: 330, visible: false, code: `when I press Run:
    hide
    wait 1 seconds
    forever:
        make a copy of me
        wait 1 seconds
when I start as a copy:
    go to the top
    show
    repeat 68 times:
        change y by -5
    change lives by -1
    play the sound oops
    if lives is 0:
        game over
    delete this copy
when it touches Bit:
    change score by 1
    play the sound coin
    if score is 10:
        you win!
    delete this copy` },
    ],
  },
  {
    id: 'chase', name: 'Ghost Chase', ja: 'おばけから にげろ', bg: 'night', vars: ['score'],
    about: 'Get the stars, but stay away from the ghost!', aboutJa: 'ほしを あつめよう。おばけに つかまったら ゲームオーバー！',
    learn: ['point towards', 'go to a random place', 'when it touches'],
    challenges: [
      ['Make the ghost faster when you have 5 points.', '5てんに なったら おばけを はやく しよう。'],
      ['Add a second ghost.', 'おばけを もう 1ぴき ふやそう。'],
      ['Make the star say "Catch me!"', 'ほしが「Catch me!」と いうように しよう。'],
    ],
    sprites: [
      { kind: 'bit', x: 100, y: 100, code: WALK4 + `
when I press Run:
    set score to 0` },
      { kind: 'ghost', x: 400, y: 280, code: `when I press Run:
    look normal
    wait 1 seconds
    forever:
        point towards Bit
        move 2 steps
when it touches Bit:
    look happy
    say Got you! for 1 seconds
    game over` },
      { kind: 'star', x: 300, y: 180, code: `when it touches Bit:
    change score by 1
    play the sound magic
    go to a random place
    if score is 10:
        you win!` },
    ],
  },
  {
    id: 'hello', name: 'Hello, Pip!', ja: 'こんにちは、ピップ', bg: 'meadow', vars: [],
    about: 'A little story. Bit and Pip meet and talk, using messages.', aboutJa: 'ビットと ピップが おはなしする ストーリー。メッセージで じゅんばんに はなすよ。',
    learn: ['say … for … seconds', 'send the message', 'when I get the message'],
    challenges: [
      ['Change what Bit and Pip say. Write your own lines!', 'セリフを じぶんで かえよう。えいごで かいてね！'],
      ['Add a Cat who says "Can you swim?"', 'ねこを ついかして「Can you swim?」と きかせよう。'],
      ['Make Pip jump when it says hello.', 'ピップが あいさつで ジャンプするように しよう。'],
    ],
    sprites: [
      { kind: 'bit', x: 150, y: 110, code: `when I press Run:
    point right
    say Hello! for 2 seconds
    say I'm Bit. for 2 seconds
    say What's your name? for 2 seconds
    send the message hello
when I get the message next:
    say Nice to meet you! for 2 seconds
    jump
    send the message go` },
      { kind: 'pip', x: 330, y: 110, dir: 270, code: `when I press Run:
    look normal
    point left
when I get the message hello:
    say Hi! for 2 seconds
    say I'm Pip. for 2 seconds
    send the message next
when I get the message go:
    look happy
    say Let's go! for 2 seconds` },
    ],
  },
  {
    id: 'music', name: 'Star Music', ja: 'ほしの おんがく', bg: 'space', vars: [],
    about: 'Tap the stars to play music. Press space and Bit dances.', aboutJa: 'ほしを タップすると おとが なるよ。スペースで ビットが おどる！',
    learn: ['when I tap it', 'play the note', 'repeat'],
    challenges: [
      ['Add a star that plays "so".', '「so」の おとの ほしを ふやそう。'],
      ['Play a song when you press Run.', 'Run で きょくが ながれるように しよう。'],
      ['Make Bit change color while it dances.', 'おどりながら いろが かわるように しよう。'],
    ],
    sprites: [
      { kind: 'star', name: 'Do', x: 120, y: 260, code: `when I tap it:
    play the note do
    change my color
    jump` },
      { kind: 'star', name: 'Re', x: 240, y: 280, code: `when I tap it:
    play the note re
    change my color
    jump` },
      { kind: 'star', name: 'Mi', x: 360, y: 260, code: `when I tap it:
    play the note mi
    change my color
    jump` },
      { kind: 'bit', x: 240, y: 90, code: `when I press Run:
    say Tap the stars! for 3 seconds
when I press space:
    repeat 4 times:
        point left
        wait 0.2 seconds
        point right
        wait 0.2 seconds
    point down
    look happy` },
    ],
  },
  {
    id: 'space', name: 'Space Dodge', ja: 'うちゅう よけ', bg: 'space', vars: ['time'],
    about: 'Steer the rocket. Dodge the rocks for 30 seconds to win.', aboutJa: 'ロケットを うごかして いわを よけよう。30びょう がんばれば かち！',
    learn: ['copies', 'wait', 'a timer variable'],
    challenges: [
      ['Make more rocks fall.', 'いわを もっと ふらせよう。（wait を みじかく）'],
      ['Give the rocket 3 lives.', 'ロケットに ライフを 3つ あげよう。'],
      ['Add coins to collect.', 'コインを ついかして あつめよう。'],
    ],
    sprites: [
      { kind: 'rocket', x: 240, y: 50, dir: 0, code: `when I press Run:
    point up
    set time to 0
    forever:
        if I am pressing right arrow:
            change x by 7
        if I am pressing left arrow:
            change x by -7
        bounce if on the edge
when I press Run:
    forever:
        wait 1 seconds
        change time by 1
        if time is 30:
            you win!
when it touches Rock:
    play the sound boing
    game over` },
      { kind: 'rock', x: 240, y: 330, visible: false, code: `when I press Run:
    hide
    forever:
        make a copy of me
        wait 0.7 seconds
when I start as a copy:
    go to the top
    set my size to 70
    show
    repeat 75 times:
        change y by -5
    delete this copy` },
    ],
  },
];
export const starterProject = (id) => build(STARTERS.find((s) => s.id === id));

// ---- idea recipes: tap one to add ready-made scripts to the chosen sprite ----
export const RECIPES = [
  { id: 'arrows', en: 'Move with the arrow keys', ja: 'やじるしで うごく', code: () => WALK4 },
  { id: 'wander', en: 'Walk around and bounce', ja: 'ずっと あるいて はねかえる', code: () => `when I press Run:
    forever:
        move 4 steps
        bounce if on the edge` },
  { id: 'tap', en: 'Talk when I tap it', ja: 'タップすると しゃべる', code: () => `when I tap it:
    play the sound pop
    say Hello! for 2 seconds` },
  { id: 'chase', en: 'Chase someone', ja: 'だれかを おいかける', code: (o) => `when I press Run:
    forever:
        point towards ${o}
        move 2 steps` },
  { id: 'rain', en: 'Fall like rain (copies)', ja: 'あめのように ふる（コピー）', code: () => `when I press Run:
    hide
    forever:
        make a copy of me
        wait 1 seconds
when I start as a copy:
    go to the top
    show
    repeat 70 times:
        change y by -5
    delete this copy` },
  { id: 'point', en: 'Get a point when touching', ja: 'さわったら 1てん', vars: ['score'], code: (o) => `when it touches ${o}:
    change score by 1
    play the sound coin
    go to a random place` },
  { id: 'win', en: 'Win at 10 points', ja: '10てんで かち', vars: ['score'], code: () => `when I press Run:
    set score to 0
    wait until score is 10
    you win!` },
  { id: 'lose', en: 'Game over when touching', ja: 'さわったら ゲームオーバー', code: (o) => `when it touches ${o}:
    play the sound oops
    game over` },
  { id: 'talk', en: 'Talk, then send a message', ja: 'はなして メッセージを おくる', code: () => `when I press Run:
    say Hello! for 2 seconds
    send the message hello` },
  { id: 'answer', en: 'Answer a message', ja: 'メッセージに こたえる', code: () => `when I get the message hello:
    say Hi! for 2 seconds` },
  { id: 'dance', en: 'Dance when I press space', ja: 'スペースで ダンス', code: () => `when I press space:
    repeat 4 times:
        jump
        change my color
        play the note mi` },
  { id: 'timer', en: 'Count the seconds', ja: 'びょうを かぞえる', vars: ['time'], code: () => `when I press Run:
    set time to 0
    forever:
        wait 1 seconds
        change time by 1` },
];
export function applyRecipe(project, sprite, recipe) {
  const other = project.sprites.find((s) => s !== sprite)?.name || 'the finger';
  const prog = parseProgram(recipe.code(other), { studio: true });
  for (const v of recipe.vars || []) if (!project.vars.includes(v)) project.vars.push(v);
  sprite.scripts.push(...(prog.scripts || []));
  return prog.scripts || [];
}

// ---- saving (this browser), export / import (files) ----
const KEY = 'wordbot.projects';
function readAll() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
function writeAll(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; } }
export const projectsStore = {
  list: () => readAll().sort((a, b) => b.updated - a.updated),
  get: (id) => { const p = readAll().find((x) => x.id === id); return p ? JSON.parse(JSON.stringify(p.data)) : null; },
  save(p) {
    const list = readAll().filter((x) => x.id !== p.id);
    list.push({ id: p.id, name: p.name, updated: Date.now(), bg: p.bg, kinds: p.sprites.slice(0, 4).map((s) => s.kind), data: p });
    return writeAll(list.slice(-40));
  },
  remove(id) { writeAll(readAll().filter((x) => x.id !== id)); },
};
export function exportProject(p) {
  const blob = new Blob([JSON.stringify({ wordbot: 1, project: p }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (p.name || 'project').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') + '.wordbot.json';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export function importProject(file) {
  return file.text().then((t) => {
    const d = JSON.parse(t);
    const p = d.project || d;
    if (!p || !Array.isArray(p.sprites)) throw new Error('Not a Word Bot project');
    p.id = newId() + Date.now().toString(36);
    return p;
  });
}
export function duplicateScripts(scripts) {
  return scripts.map((s) => ({ id: newId(), hat: cloneNode(s.hat), body: s.body.map(cloneNode) }));
}
