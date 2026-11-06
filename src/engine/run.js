// The interpreter. Runs a whole program instantly and records a trace that the
// play screen then animates step by step (highlighting the block that is running,
// showing loop counters and the yes/no answer of every condition).
import { parseMap, newState, sense, act, answerFor, isVarName } from './world.js';

export const STEP_LIMIT = 2500;

class Stop {
  constructor(reason, id) { this.reason = reason; this.id = id; }
}

export function runProgram(program, level, mapIndex = 0) {
  const map = level.parsed ? level.parsed[mapIndex] : parseMap(level.maps[mapIndex], level);
  const st = newState(map);
  const trace = [];
  let steps = 0;
  const tick = (id) => { if (++steps > STEP_LIMIT) throw new Stop('tired', id); };
  const defs = new Map(program.defs.map((d) => [d.name, d]));

  const list = (nodes, depth) => { for (const n of nodes) node(n, depth); };
  const count = (n) => {
    const v = n.args.n;
    if (typeof v === 'number') return v;
    if (isVarName(v)) { if (!(v in st.vars)) throw new Stop('novar', n.id); return st.vars[v]; }
    return Number(v) || 0;
  };

  function node(n, depth) {
    switch (n.type) {
      case 'repeat': {
        const times = count(n);
        for (let i = 0; i < times; i++) {
          tick(n.id);
          trace.push({ k: 'loop', id: n.id, i: i + 1, n: times });
          list(n.body, depth);
        }
        trace.push({ k: 'done', id: n.id });
        return;
      }
      case 'until': {
        let i = 0;
        for (;;) {
          tick(n.id);
          const v = sense(st, n.args.cond);
          trace.push({ k: 'cond', id: n.id, v });
          if (v) break;
          trace.push({ k: 'loop', id: n.id, i: ++i, n: null });
          list(n.body, depth);
        }
        trace.push({ k: 'done', id: n.id });
        return;
      }
      case 'if':
      case 'ifelse': {
        tick(n.id);
        const v = sense(st, n.args.cond);
        trace.push({ k: 'cond', id: n.id, v });
        if (v) list(n.body, depth);
        else if (n.else) list(n.else, depth);
        trace.push({ k: 'done', id: n.id });
        return;
      }
      case 'call': {
        const d = defs.get(n.args.name);
        if (!d) throw new Stop('noword', n.id);
        if (depth > 12) throw new Stop('tired', n.id);
        tick(n.id);
        trace.push({ k: 'call', id: n.id, def: d.id });
        list(d.body, depth + 1);
        trace.push({ k: 'done', id: n.id, def: d.id });
        return;
      }
      default: {
        tick(n.id);
        const r = act(st, n);
        trace.push({ k: 'act', id: n.id, events: r.events });
        if (r.fail) throw new Stop(r.fail, n.id);
      }
    }
  }

  let result;
  try {
    list(program.main, 0);
    result = evaluate(st, level, map, mapIndex, program);
  } catch (e) {
    if (!(e instanceof Stop)) throw e;
    result = { ok: false, reason: e.reason, id: e.id };
  }
  trace.push({ k: 'end', result });
  return { trace, state: st, result, map };
}

// Did the program do what the level asked?
export function evaluate(st, level, map, mapIndex, program) {
  const g = level.goal;
  const here = st.cells[st.bit.y * st.w + st.bit.x];
  if (g.word) {
    const used = new Map();
    const scan = (nodes) => nodes.forEach((n) => { if (n.type === 'call') used.set(n.args.name, (used.get(n.args.name) || 0) + 1); if (n.body) scan(n.body); if (n.else) scan(n.else); });
    scan(program.main); program.defs.forEach((d) => scan(d.body));
    const ok = program.defs.some((d) => d.body.length > 0 && (used.get(d.name) || 0) >= 2);
    if (!ok) return { ok: false, reason: 'word' };
  }
  if (g.gems && st.got < st.totalGems) return { ok: false, reason: 'gems' };
  if (g.paint) {
    const target = level.targets[mapIndex];
    for (let i = 0; i < st.cells.length; i++) {
      const c = st.cells[i];
      if (c.k !== 'pad') continue;
      if ((c.color || null) !== (target[i] || null)) return { ok: false, reason: 'paint', cell: i };
    }
  }
  if (g.say !== undefined) {
    const want = answerFor(g.say, map);
    if (!st.said.length) return { ok: false, reason: 'nosay', want };
    const last = st.said[st.said.length - 1];
    if (last !== want) return { ok: false, reason: 'wrongsay', want, got: last };
  }
  if (g.home && !here.home) return { ok: false, reason: 'home' };
  return { ok: true };
}

// Run on every map of the level (multi-map levels are like tests: all must pass).
export function runAll(program, level) {
  return level.maps.map((_, i) => runProgram(program, level, i));
}
