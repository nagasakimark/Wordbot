// The block language. Every block is a real English sentence or phrase.
// This file is pure data + text helpers (no DOM), shared by the editor, the
// interpreter, the English-code view and the tests.

export const CATS = {
  move: { color: '#2f7cf6', dark: '#1a4fb4', en: 'Move', ja: 'うごく' },
  act: { color: '#8b5cf6', dark: '#5a33c2', en: 'Do', ja: 'する' },
  loop: { color: '#ff9b1a', dark: '#c46800', en: 'Loops', ja: 'くりかえし' },
  logic: { color: '#13b3a0', dark: '#0a7a6d', en: 'If', ja: 'もし' },
  word: { color: '#f0468f', dark: '#b01d60', en: 'New words', ja: 'あたらしい ことば' },
  num: { color: '#f2603c', dark: '#b33d1e', en: 'Numbers', ja: 'かず' },
  event: { color: '#f2a900', dark: '#a87400', en: 'Events', ja: 'きっかけ' },
  look: { color: '#a855f7', dark: '#7330c9', en: 'Looks', ja: 'みため' },
  sound: { color: '#de4fc9', dark: '#a12a90', en: 'Sound', ja: 'おと' },
  game: { color: '#22b14c', dark: '#147a32', en: 'Game', ja: 'ゲーム' },
};

export const COLORS = {
  red: { hex: '#f0443f', dark: '#b52520', ja: 'あか' },
  blue: { hex: '#3b82f6', dark: '#1f56c0', ja: 'あお' },
  yellow: { hex: '#ffd23a', dark: '#d19a00', ja: 'きいろ' },
  green: { hex: '#35c25a', dark: '#1d8a3a', ja: 'みどり' },
  pink: { hex: '#ff7bb8', dark: '#d3448a', ja: 'ピンク' },
  purple: { hex: '#9d6bff', dark: '#6a3bd1', ja: 'むらさき' },
};

// Conditions: whole English clauses. Used by "if", "repeat until".
export const CONDS = {
  canForward: { en: 'Bit can go forward', ja: 'まえに すすめる' },
  cantForward: { en: "Bit can't go forward", ja: 'まえに すすめない' },
  canLeft: { en: 'Bit can go left', ja: 'ひだりに いける' },
  canRight: { en: 'Bit can go right', ja: 'みぎに いける' },
  onGem: { en: 'Bit is on a gem', ja: 'ジェムの うえに いる' },
  home: { en: 'Bit is home', ja: 'いえに ついた' },
  red: { en: 'the tile is red', ja: 'タイルが あか' },
  blue: { en: 'the tile is blue', ja: 'タイルが あお' },
};

// Names kids can give to new words (functions). Real English verb phrases.
export const WORDS = {
  'turn around': 'うしろを むく',
  'paint a box': 'はこを ぬる',
  'get the gem': 'ジェムを とってくる',
  'climb': 'のぼる',
  'hop': 'ぴょんと とぶ',
  'dance': 'おどる',
  'zigzag': 'ジグザグに すすむ',
  'look around': 'まわりを みる',
};

// Variables: English nouns.
export const VARS = {
  steps: 'すすんだ かず',
  gems: 'ジェムの かず',
  size: 'ながさ',
  score: 'とくてん',
  lives: 'ライフ',
  time: 'じかん',
  coins: 'コイン',
  speed: 'はやさ',
  level: 'レベル',
};

export const SAY_WORDS = {
  'Hello!': 'こんにちは',
  'Yay!': 'やったー',
  'I did it!': 'できた！',
};

export const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
export const numWord = (n) => (n >= 0 && n <= 20 ? NUM_WORDS[n] : String(n));

// Block catalogue.
//   cat    category (colour)
//   c      number of inner slots (1 = repeat/if, 2 = if/otherwise)
//   hat    a stack header (the definition of a new word)
//   args   argument kinds; the editor shows a tappable chip for each
//   parts  sentence pieces: strings and { arg } markers
export const BLOCKS = {
  forward: { cat: 'move', icon: 'forward', parts: () => ['go forward'] },
  turn: { cat: 'move', icon: (a) => 'turn-' + a.dir, args: { dir: 'dir' }, parts: () => ['turn', { arg: 'dir' }] },
  pick: { cat: 'act', icon: 'pick', parts: () => ['pick it up'] },
  paint: { cat: 'act', icon: 'paint', args: { color: 'color' }, parts: () => ['paint it', { arg: 'color' }] },
  say: { cat: 'act', icon: 'say', args: { what: 'say' }, parts: () => ['say', { arg: 'what' }] },
  repeat: { cat: 'loop', icon: 'repeat', c: 1, args: { n: 'count' }, parts: () => ['repeat', { arg: 'n' }, 'times'] },
  until: { cat: 'loop', icon: 'until', c: 1, args: { cond: 'cond' }, parts: () => ['repeat until', { arg: 'cond' }] },
  if: { cat: 'logic', icon: 'if', c: 1, args: { cond: 'cond' }, parts: () => ['if', { arg: 'cond' }] },
  ifelse: { cat: 'logic', icon: 'if', c: 2, args: { cond: 'cond' }, parts: () => ['if', { arg: 'cond' }], elseText: 'otherwise' },
  call: { cat: 'word', icon: 'word', args: { name: 'word' }, parts: () => [{ arg: 'name' }] },
  def: { cat: 'word', icon: 'book', hat: true, c: 1, args: { name: 'word' }, parts: () => ['to', { arg: 'name' }, ':'] },
  set: { cat: 'num', icon: 'num', args: { v: 'var', n: 'num0' }, parts: () => ['set', { arg: 'v' }, 'to', { arg: 'n' }] },
  add: { cat: 'num', icon: 'plus', args: { v: 'var' }, parts: () => ['add 1 to', { arg: 'v' }] },
};

// ---- text for one argument value ----
export function argText(kind, v) {
  if (kind === 'cond') return CONDS[v] ? CONDS[v].en : studioCondText(v);
  if (v === 'random' && NUM_KINDS.has(kind)) return 'a random number';
  return String(v);
}
export function argJa(kind, v) {
  switch (kind) {
    case 'dir': return v === 'left' ? 'ひだり' : 'みぎ';
    case 'color': return COLORS[v] ? COLORS[v].ja : v;
    case 'cond': return CONDS[v] ? CONDS[v].ja : studioCondJa(v);
    case 'word': return WORDS[v] || v;
    case 'var': return VARS[v] || v;
    case 'say': return SAY_WORDS[v] || VARS[v] || v;
    case 'text': return SAY_WORDS[v] || PHRASES[v] || VARS[v] || v;
    case 'key': return KEYS_JA[v] || v;
    case 'place': return PLACES[v] || v;
    case 'towards': return PLACES[v] || v;
    case 'dir4': return DIR4_JA[v] || v;
    case 'mood': return MOODS[v] || v;
    case 'sound': return SOUNDS_JA[v] || v;
    case 'note': return v;
    case 'msg': return '「' + v + '」';
    case 'sprite': return v === 'the edge' ? 'はし' : v;
    default: return v === 'random' ? 'ランダム' : String(v);
  }
}

// English sentence for a block (what the English-code view shows).
export function blockEnglish(node) {
  const b = BLOCKS[node.type];
  return b.parts(node.args).map((p) => (typeof p === 'string' ? p : argText(b.args[p.arg], node.args[p.arg]))).join(' ').replace(' :', ':');
}

// What the voice reads (numbers as words).
export function blockSpoken(node) {
  const b = BLOCKS[node.type];
  return b.parts(node.args).map((p) => {
    if (typeof p === 'string') return p === ':' ? '' : p;
    const kind = b.args[p.arg], v = node.args[p.arg];
    if (typeof v === 'number') return numWord(v);
    return argText(kind, v);
  }).join(' ').replace(/\s+/g, ' ').trim();
}

// A short Japanese gloss (the ヒント line under a block).
export function blockJa(node) {
  const a = node.args || {};
  switch (node.type) {
    case 'forward': return 'まえに 1マス すすむ';
    case 'turn': return a.dir === 'left' ? 'ひだりを むく' : 'みぎを むく';
    case 'pick': return 'ジェムを ひろう';
    case 'paint': return argJa('color', a.color) + 'に ぬる';
    case 'say': return '「' + argJa('say', a.what) + '」と いう';
    case 'repeat': return (typeof a.n === 'number' ? a.n : argJa('var', a.n)) + ' かい くりかえす';
    case 'until': return '「' + argJa('cond', a.cond) + '」まで くりかえす';
    case 'if': return 'もし ' + argJa('cond', a.cond) + ' なら';
    case 'ifelse': return 'もし ' + argJa('cond', a.cond) + ' なら';
    case 'call': return '「' + a.name + '」を する';
    case 'def': return '「' + a.name + '」の やりかた';
    case 'set': return argJa('var', a.v) + ' を ' + argJa('num0', a.n) + ' に する';
    case 'add': return argJa('var', a.v) + ' に 1 たす';
  }
  const f = STUDIO_JA[node.type];
  return f ? f(a) : '';
}

// ---- program model ----
let uid = 0;
export const newId = () => 'n' + (++uid).toString(36);
export function makeNode(type, args = {}) {
  const b = BLOCKS[type];
  const node = { id: newId(), type, args: { ...args } };
  if (b.c >= 1) node.body = [];
  if (b.c === 2) node.else = [];
  return node;
}
export function cloneNode(n) {
  const c = { id: newId(), type: n.type, args: { ...n.args } };
  if (n.body) c.body = n.body.map(cloneNode);
  if (n.else) c.else = n.else.map(cloneNode);
  return c;
}
export const emptyProgram = () => ({ main: [], defs: [] });
export function cloneProgram(p) {
  return { main: p.main.map(cloneNode), defs: p.defs.map((d) => ({ id: newId(), name: d.name, body: d.body.map(cloneNode), given: d.given })) };
}

// Every block a student placed (not counting the "start" or "to …:" headers).
export function countBlocks(p) {
  const count = (list) => list.reduce((s, n) => s + 1 + (n.body ? count(n.body) : 0) + (n.else ? count(n.else) : 0), 0);
  return count(p.main) + p.defs.reduce((s, d) => s + count(d.body), 0);
}
export function walk(p, fn) {
  const go = (list, owner) => list.forEach((n) => { fn(n, owner); if (n.body) go(n.body, owner); if (n.else) go(n.else, owner); });
  go(p.main, null);
  p.defs.forEach((d) => go(d.body, d));
}


// =====================================================================
// Studio blocks: everything kids need to make their own games and stories.
// =====================================================================
export const NUM_KINDS = new Set(['steps', 'deg', 'secs', 'count', 'delta', 'size', 'num0']);
export const PHRASES = {
  'Hi!': 'やあ', "Let's go!": 'いこう！', 'Oops!': 'おっと', 'Help!': 'たすけて！', 'Thank you!': 'ありがとう',
  'Good job!': 'よくできました', 'Yum!': 'おいしい！', 'Ouch!': 'いたい！', 'Bye!': 'ばいばい', 'I win!': 'かった！',
  "What's your name?": 'なまえは なに？', "I'm Bit.": 'ぼくは ビット', 'Nice to meet you!': 'よろしくね', 'How are you?': 'げんき？',
  "I'm happy!": 'うれしい！', 'Catch me!': 'つかまえて！', 'Look!': 'みて！', 'I like apples.': 'りんごが すき', 'Can you swim?': 'およげる？', 'Yes, I can!': 'うん、できる！',
};
export const KEYS_JA = { 'right arrow': 'みぎ ▶', 'left arrow': 'ひだり ◀', 'up arrow': 'うえ ▲', 'down arrow': 'した ▼', space: 'スペース ●' };
export const PLACES = { 'a random place': 'どこか', 'the middle': 'まんなか', 'the finger': 'ゆびの ところ', 'the top': 'うえの はし', 'the bottom': 'したの はし' };
export const DIR4_JA = { up: 'うえ', down: 'した', left: 'ひだり', right: 'みぎ' };
export const MOODS = { happy: 'うれしい かお', sad: 'かなしい かお', surprised: 'びっくり', normal: 'ふつう' };
export const SOUNDS_JA = { pop: 'ポン', jump: 'ジャンプ', coin: 'コイン', boing: 'ボヨン', laser: 'ビーム', win: 'ファンファーレ', oops: 'ブブー', drum: 'ドン', magic: 'キラキラ' };
export const NOTES = ['do', 're', 'mi', 'fa', 'so', 'la', 'ti', 'high do'];
export const MESSAGES = ['hello', 'go', 'win', 'boom', 'next'];

const ev = (parts, args, extra = {}) => ({ cat: 'event', icon: 'start', hat: true, event: true, args, parts: () => parts, ...extra });
Object.assign(BLOCKS, {
  // events: the start of a script
  whenRun: ev(['when I press Run'], {}, { icon: 'start' }),
  whenTap: ev(['when I tap it'], {}, { icon: 'tap' }),
  whenKey: ev(['when I press', { arg: 'key' }], { key: 'key' }, { icon: 'key' }),
  whenTouch: ev(['when it touches', { arg: 'who' }], { who: 'sprite' }, { icon: 'touch' }),
  whenMsg: ev(['when I get the message', { arg: 'msg' }], { msg: 'msg' }, { icon: 'mail' }),
  whenClone: ev(['when I start as a copy'], {}, { icon: 'copy' }),
  // motion
  move: { cat: 'move', icon: 'forward', args: { n: 'steps' }, parts: () => ['move', { arg: 'n' }, 'steps'] },
  turnBy: { cat: 'move', icon: (a) => 'turn-' + a.dir, args: { dir: 'dir', deg: 'deg' }, parts: () => ['turn', { arg: 'dir' }, { arg: 'deg' }, 'degrees'] },
  point: { cat: 'move', icon: 'compass', args: { to: 'dir4' }, parts: () => ['point', { arg: 'to' }] },
  pointAt: { cat: 'move', icon: 'compass', args: { at: 'towards' }, parts: () => ['point towards', { arg: 'at' }] },
  goTo: { cat: 'move', icon: 'pin', args: { place: 'place' }, parts: () => ['go to', { arg: 'place' }] },
  glide: { cat: 'move', icon: 'pin', args: { place: 'place', secs: 'secs' }, parts: () => ['glide to', { arg: 'place' }, 'in', { arg: 'secs' }, 'seconds'] },
  changeX: { cat: 'move', icon: 'xy', args: { n: 'delta' }, parts: () => ['change x by', { arg: 'n' }] },
  changeY: { cat: 'move', icon: 'xy', args: { n: 'delta' }, parts: () => ['change y by', { arg: 'n' }] },
  bounce: { cat: 'move', icon: 'bounce', parts: () => ['bounce if on the edge'] },
  hop: { cat: 'move', icon: 'hop', parts: () => ['jump'] },
  // looks
  sayIt: { cat: 'look', icon: 'say', args: { text: 'text' }, parts: () => ['say', { arg: 'text' }] },
  sayFor: { cat: 'look', icon: 'say', args: { text: 'text', secs: 'secs' }, parts: () => ['say', { arg: 'text' }, 'for', { arg: 'secs' }, 'seconds'] },
  mood: { cat: 'look', icon: 'face', args: { mood: 'mood' }, parts: () => ['look', { arg: 'mood' }] },
  recolor: { cat: 'look', icon: 'paint', parts: () => ['change my color'] },
  grow: { cat: 'look', icon: 'grow', parts: () => ['get bigger'] },
  shrink: { cat: 'look', icon: 'shrink', parts: () => ['get smaller'] },
  setSize: { cat: 'look', icon: 'grow', args: { n: 'size' }, parts: () => ['set my size to', { arg: 'n' }] },
  hide: { cat: 'look', icon: 'hide', parts: () => ['hide'] },
  show: { cat: 'look', icon: 'show', parts: () => ['show'] },
  // sound
  playSound: { cat: 'sound', icon: 'sound', args: { s: 'sound' }, parts: () => ['play the sound', { arg: 's' }] },
  playNote: { cat: 'sound', icon: 'note', args: { note: 'note' }, parts: () => ['play the note', { arg: 'note' }] },
  // control
  wait: { cat: 'loop', icon: 'clock', args: { secs: 'secs' }, parts: () => ['wait', { arg: 'secs' }, 'seconds'] },
  waitUntil: { cat: 'loop', icon: 'clock', args: { cond: 'cond' }, parts: () => ['wait until', { arg: 'cond' }] },
  forever: { cat: 'loop', icon: 'repeat', c: 1, end: true, parts: () => ['forever'] },
  stopScript: { cat: 'loop', icon: 'stop', end: true, parts: () => ['stop this script'] },
  stopAll: { cat: 'loop', icon: 'stop', end: true, parts: () => ['stop everything'] },
  clone: { cat: 'loop', icon: 'copy', parts: () => ['make a copy of me'] },
  unclone: { cat: 'loop', icon: 'trash', end: true, parts: () => ['delete this copy'] },
  // messages + game
  send: { cat: 'event', icon: 'mail', args: { msg: 'msg' }, parts: () => ['send the message', { arg: 'msg' }] },
  win: { cat: 'game', icon: 'trophy', end: true, parts: () => ['you win!'] },
  lose: { cat: 'game', icon: 'skull', end: true, parts: () => ['game over'] },
  // numbers
  changeVar: { cat: 'num', icon: 'plus', args: { v: 'var', n: 'delta' }, parts: () => ['change', { arg: 'v' }, 'by', { arg: 'n' }] },
});

const J = (k, v) => argJa(k, v);
const N = (v) => (v === 'random' ? 'ランダムな かず' : typeof v === 'number' ? String(v) : J('var', v));
export const STUDIO_JA = {
  whenRun: () => 'Run を おしたら', whenTap: () => 'タップ されたら', whenKey: (a) => J('key', a.key) + ' を おしたら',
  whenTouch: (a) => J('sprite', a.who) + ' に さわったら', whenMsg: (a) => J('msg', a.msg) + ' を うけとったら', whenClone: () => 'コピーが できたら',
  move: (a) => N(a.n) + ' ほ うごく', turnBy: (a) => (a.dir === 'left' ? 'ひだり' : 'みぎ') + 'に ' + N(a.deg) + '° まわる', point: (a) => J('dir4', a.to) + 'を むく',
  pointAt: (a) => J('towards', a.at) + 'の ほうを むく', goTo: (a) => J('place', a.place) + 'へ いく', glide: (a) => N(a.secs) + 'びょうで ' + J('place', a.place) + 'へ',
  changeX: (a) => 'よこに ' + N(a.n) + ' うごく', changeY: (a) => 'たてに ' + N(a.n) + ' うごく', bounce: () => 'はしに きたら はねかえる', hop: () => 'ジャンプする',
  sayIt: (a) => '「' + J('text', a.text) + '」と いう', sayFor: (a) => '「' + J('text', a.text) + '」と ' + N(a.secs) + 'びょう いう', mood: (a) => J('mood', a.mood) + 'に する',
  recolor: () => 'いろを かえる', grow: () => 'おおきく なる', shrink: () => 'ちいさく なる', setSize: (a) => 'おおきさを ' + N(a.n) + '% に', hide: () => 'かくれる', show: () => 'あらわれる',
  playSound: (a) => J('sound', a.s) + ' の おとを ならす', playNote: (a) => a.note + ' の おとを ならす',
  wait: (a) => N(a.secs) + 'びょう まつ', waitUntil: (a) => '「' + J('cond', a.cond) + '」まで まつ', forever: () => 'ずっと くりかえす',
  stopScript: () => 'この スクリプトを とめる', stopAll: () => 'ぜんぶ とめる', clone: () => 'じぶんの コピーを つくる', unclone: () => 'この コピーを けす',
  send: (a) => J('msg', a.msg) + ' を おくる', win: () => 'かち！', lose: () => 'ゲームオーバー', changeVar: (a) => J('var', a.v) + ' を ' + N(a.n) + ' かえる',
};

// Studio conditions are strings with a parameter, e.g. 'touch:Ghost', 'key:space', 'var:score:gt:5'.
export function studioCondText(v) {
  const p = String(v).split(':');
  if (p[0] === 'touch') return 'it is touching ' + p.slice(1).join(':');
  if (p[0] === 'edge') return 'it is touching the edge';
  if (p[0] === 'key') return 'I am pressing ' + p[1];
  if (p[0] === 'var') return p[1] + (p[2] === 'gt' ? ' is more than ' : p[2] === 'lt' ? ' is less than ' : ' is ') + p[3];
  return String(v);
}
export function studioCondJa(v) {
  const p = String(v).split(':');
  if (p[0] === 'touch') return p.slice(1).join(':') + ' に さわっている';
  if (p[0] === 'edge') return 'はしに さわっている';
  if (p[0] === 'key') return (KEYS_JA[p[1]] || p[1]) + ' を おしている';
  if (p[0] === 'var') return (VARS[p[1]] || p[1]) + (p[2] === 'gt' ? ' が ' + p[3] + ' より おおきい' : p[2] === 'lt' ? ' が ' + p[3] + ' より ちいさい' : ' が ' + p[3]);
  return String(v);
}
export function parseStudioCond(text) {
  let m;
  const t = text.trim();
  if (/^it is touching the edge$/i.test(t)) return 'edge';
  if ((m = t.match(/^it is touching (.+)$/i))) return 'touch:' + m[1];
  if ((m = t.match(/^I am pressing (.+)$/i))) return 'key:' + m[1].toLowerCase();
  if ((m = t.match(/^(\w+) is more than (-?\d+)$/i))) return 'var:' + m[1] + ':gt:' + m[2];
  if ((m = t.match(/^(\w+) is less than (-?\d+)$/i))) return 'var:' + m[1] + ':lt:' + m[2];
  if ((m = t.match(/^(\w+) is (-?\d+)$/i))) return 'var:' + m[1] + ':eq:' + m[2];
  return null;
}
