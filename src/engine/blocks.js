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
  if (kind === 'cond') return CONDS[v] ? CONDS[v].en : String(v);
  return String(v);
}
export function argJa(kind, v) {
  switch (kind) {
    case 'dir': return v === 'left' ? 'ひだり' : 'みぎ';
    case 'color': return COLORS[v] ? COLORS[v].ja : v;
    case 'cond': return CONDS[v] ? CONDS[v].ja : v;
    case 'word': return WORDS[v] || v;
    case 'var': return VARS[v] || v;
    case 'say': return SAY_WORDS[v] || VARS[v] || v;
    default: return String(v);
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
    case 'set': return argJa('var', a.v) + ' を ' + a.n + ' に する';
    case 'add': return argJa('var', a.v) + ' に 1 たす';
  }
  return '';
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
