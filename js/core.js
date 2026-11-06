/* Word Bot core: pure game logic, no DOM.
 * Runs in the browser (window.WB.core) and in Node (module.exports) so levels can be tested.
 *
 * A program is a list of items: { id: 'right', n: 3 } | { id: 'jump' } | { id: 'say', word: 'Hello!' } ...
 * exec() applies ONE item to the game state and returns the events the renderer should animate.
 * The level is won if the program ENDS with Bit standing on an awake star.
 */
(function (root) {
  'use strict';

  const DIRS = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };
  const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const SAY_JA = { 'Hello!': 'こんにちは', 'Goodbye!': 'さようなら', 'Thank you!': 'ありがとう' };
  const DIR_JA = { right: 'みぎへ', left: 'ひだりへ', up: 'うえへ', down: 'したへ' };

  // Block catalogue. Words are real English sentences/commands, never code-speak.
  const BLOCKS = {
    right: { kind: 'move', dir: 'right', color: 'move', word: 'go right', hasNum: true },
    left: { kind: 'move', dir: 'left', color: 'move', word: 'go left', hasNum: true },
    up: { kind: 'move', dir: 'up', color: 'move', word: 'go up', hasNum: true },
    down: { kind: 'move', dir: 'down', color: 'move', word: 'go down', hasNum: true },
    jump: { kind: 'jump', color: 'move', word: 'jump' },
    coin: { kind: 'coin', color: 'do', word: 'get the coin' },
    key: { kind: 'key', color: 'do', word: 'get the key' },
    door: { kind: 'door', color: 'do', word: 'open the door' },
    say: { kind: 'say', color: 'say', word: 'say', hasWord: true },
  };

  // ---- text helpers ------------------------------------------------------
  function blockEnglish(item) {
    const b = BLOCKS[item.id];
    if (b.kind === 'say') return 'say "' + item.word + '"';
    if (b.hasNum && item.n > 1) return b.word + ' ' + item.n;
    return b.word;
  }
  // What the voice reads when the block is tapped / run.
  function blockSpoken(item) {
    const b = BLOCKS[item.id];
    if (b.kind === 'say') return 'say ' + item.word;
    if (b.hasNum && item.n > 1) return b.word + ' ' + NUM_WORDS[item.n];
    return b.word;
  }
  function blockJa(item) {
    const b = BLOCKS[item.id];
    switch (b.kind) {
      case 'move': return DIR_JA[b.dir] + ' ' + (item.n || 1) + 'マス すすむ';
      case 'jump': return 'ジャンプ（2マス とぶ）';
      case 'coin': return 'コインを とる';
      case 'key': return 'かぎを とる';
      case 'door': return 'ドアを あける';
      case 'say': return '「' + (SAY_JA[item.word] || item.word) + '」と いう';
    }
    return '';
  }
  function defaultItem(id, level) {
    const b = BLOCKS[id];
    const item = { id: id };
    if (b.hasNum) item.n = 1;
    if (b.hasWord) item.word = (level.sayWords || ['Hello!'])[0];
    return item;
  }

  // ---- state -------------------------------------------------------------
  function newState(level) {
    const rows = level.map, H = rows.length, W = rows[0].length;
    const st = {
      cols: W, rows: H, tiles: [], coins: [], key: null, doors: [], star: null, friend: null,
      bit: { x: 0, y: 0, dir: level.facing || 'right' }, inv: { coins: 0, key: false }, total: 0, won: false,
    };
    for (let y = 0; y < H; y++) {
      st.tiles.push([]);
      for (let x = 0; x < W; x++) {
        const ch = rows[y][x];
        let tile = 'floor';
        if (ch === '#') tile = 'wall';
        else if (ch === 'o') tile = 'hole';
        else if (ch === 'D') st.doors.push({ x: x, y: y, open: false });
        else if (ch === 'B') { st.bit.x = x; st.bit.y = y; }
        else if (ch === '*') st.star = { x: x, y: y };
        else if (ch === 'c') st.coins.push({ x: x, y: y, got: false });
        else if (ch === 'k') st.key = { x: x, y: y, got: false };
        else if (ch === 'F') st.friend = { x: x, y: y, want: level.friendWants || 'Hello!', happy: false };
        st.tiles[y].push(tile);
      }
    }
    st.total = st.coins.length;
    return st;
  }

  function doorAt(st, x, y) {
    for (const d of st.doors) if (d.x === x && d.y === y) return d;
    return null;
  }
  // Why can't Bit enter (x,y)? null = free. Holes are NOT blocked: you can walk in and fall.
  function blocked(st, x, y) {
    if (x < 0 || y < 0 || x >= st.cols || y >= st.rows) return 'edge';
    if (st.tiles[y][x] === 'wall') return 'wall';
    const d = doorAt(st, x, y);
    if (d && !d.open) return 'door';
    if (st.friend && st.friend.x === x && st.friend.y === y) return 'friend';
    return null;
  }
  function starAwake(st) {
    return st.inv.coins === st.total && (!st.friend || st.friend.happy);
  }

  // ---- one block ---------------------------------------------------------
  function exec(st, item) {
    const ev = [];
    let failed = null;
    const b = BLOCKS[item.id];
    const bit = st.bit;
    const bonk = (why) => { ev.push({ t: 'bonk', dir: bit.dir, why: why }); failed = why; };
    const land = () => {
      if (st.tiles[bit.y][bit.x] === 'hole') { ev.push({ t: 'fall' }); failed = 'hole'; }
    };

    if (b.kind === 'move') {
      const d = DIRS[b.dir];
      const steps = item.n || 1;
      for (let i = 0; i < steps; i++) {
        bit.dir = b.dir;
        const nx = bit.x + d[0], ny = bit.y + d[1];
        const why = blocked(st, nx, ny);
        if (why) { bonk(why); break; }
        ev.push({ t: 'move', from: { x: bit.x, y: bit.y }, to: { x: nx, y: ny }, dir: b.dir });
        bit.x = nx; bit.y = ny;
        land();
        if (failed) break;
      }
    } else if (b.kind === 'jump') {
      const d = DIRS[bit.dir];
      const mx = bit.x + d[0], my = bit.y + d[1], lx = bit.x + 2 * d[0], ly = bit.y + 2 * d[1];
      const why = blocked(st, mx, my) || blocked(st, lx, ly);
      if (why) bonk(why);
      else {
        ev.push({ t: 'jump', from: { x: bit.x, y: bit.y }, to: { x: lx, y: ly }, dir: bit.dir });
        bit.x = lx; bit.y = ly;
        land();
      }
    } else if (b.kind === 'coin') {
      const c = st.coins.find((c) => c.x === bit.x && c.y === bit.y && !c.got);
      if (!c) { ev.push({ t: 'oops' }); failed = 'nocoin'; }
      else { c.got = true; st.inv.coins++; ev.push({ t: 'coin', x: c.x, y: c.y }); }
    } else if (b.kind === 'key') {
      if (!st.key || st.key.got || st.key.x !== bit.x || st.key.y !== bit.y) { ev.push({ t: 'oops' }); failed = 'nokey'; }
      else { st.key.got = true; st.inv.key = true; ev.push({ t: 'key', x: st.key.x, y: st.key.y }); }
    } else if (b.kind === 'door') {
      // Prefer the door Bit is facing, then any neighbouring closed door.
      const order = [bit.dir].concat(Object.keys(DIRS).filter((k) => k !== bit.dir));
      let door = null;
      for (const k of order) {
        const dd = doorAt(st, bit.x + DIRS[k][0], bit.y + DIRS[k][1]);
        if (dd && !dd.open) { door = dd; break; }
      }
      if (!door) { ev.push({ t: 'oops' }); failed = 'nodoor'; }
      else if (!st.inv.key) { ev.push({ t: 'oops' }); failed = 'needkey'; }
      else { door.open = true; ev.push({ t: 'door', x: door.x, y: door.y }); }
    } else if (b.kind === 'say') {
      ev.push({ t: 'say', text: item.word });
      const f = st.friend;
      if (f && Math.abs(f.x - bit.x) + Math.abs(f.y - bit.y) === 1) {
        if (item.word === f.want) { f.happy = true; ev.push({ t: 'friend', ok: true }); }
        else ev.push({ t: 'friend', ok: false });
      }
    }
    return { events: ev, failed: failed };
  }

  // After the last block: did Bit finish on the star?
  function evaluateEnd(st) {
    const bit = st.bit;
    const onStar = st.star && st.star.x === bit.x && st.star.y === bit.y;
    if (onStar && starAwake(st)) { st.won = true; return { won: true }; }
    if (onStar) return { won: false, reason: st.inv.coins < st.total ? 'needcoin' : 'needfriend' };
    return { won: false, reason: 'notat' };
  }

  function runProgram(level, program) {
    const st = newState(level);
    const events = [];
    for (const item of program) {
      const r = exec(st, item);
      events.push.apply(events, r.events);
      if (r.failed) return { st: st, won: false, failed: r.failed, events: events };
    }
    const end = evaluateEnd(st);
    return { st: st, won: end.won, reason: end.reason, events: events };
  }

  // ---- solver (for tests and a future hint button): fewest blocks, breadth first ----
  function solve(level, maxDepth) {
    maxDepth = maxDepth || 10;
    const actions = [];
    for (const id of level.blocks) {
      const b = BLOCKS[id];
      if (b.hasNum) for (let n = 1; n <= (level.numMax || 1); n++) actions.push({ id: id, n: n });
      else if (b.hasWord) for (const w of level.sayWords) actions.push({ id: id, word: w });
      else actions.push({ id: id });
    }
    const key = (st) => JSON.stringify([st.bit, st.inv, st.coins.map((c) => c.got), st.doors.map((d) => d.open), st.friend && st.friend.happy]);
    const start = newState(level);
    let frontier = [{ st: start, prog: [] }];
    const seen = new Set([key(start)]);
    for (let depth = 0; depth < maxDepth; depth++) {
      const next = [];
      for (const node of frontier) {
        for (const a of actions) {
          const st = JSON.parse(JSON.stringify(node.st));
          const r = exec(st, a);
          if (r.failed) continue;
          const prog = node.prog.concat([a]);
          const probe = JSON.parse(JSON.stringify(st));
          if (evaluateEnd(probe).won) return prog;
          const k = key(st);
          if (!seen.has(k)) { seen.add(k); next.push({ st: st, prog: prog }); }
        }
      }
      frontier = next;
    }
    return null;
  }

  const core = {
    DIRS, BLOCKS, NUM_WORDS, SAY_JA,
    blockEnglish, blockSpoken, blockJa, defaultItem,
    newState, exec, evaluateEnd, runProgram, solve, starAwake,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  else { root.WB = root.WB || {}; root.WB.core = core; }
})(typeof window !== 'undefined' ? window : globalThis);
