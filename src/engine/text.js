// "English code": a program written as indented English text, like Python.
//
//   to paint a box:
//       repeat 4 times:
//           paint it red
//           go forward
//           turn right
//   paint a box
//
// printProgram() turns blocks into text (the 📜 view). parseProgram() turns text
// into blocks (used to write level solutions and starting programs, and by tests).
import { BLOCKS, CONDS, WORDS, makeNode, blockEnglish } from './blocks.js';

const COND_BY_TEXT = Object.fromEntries(Object.entries(CONDS).map(([k, v]) => [v.en.toLowerCase(), k]));

export function printProgram(p, { indent = '    ' } = {}) {
  const lines = [];
  const out = (nodes, depth) => nodes.forEach((n) => {
    const pad = indent.repeat(depth);
    const head = blockEnglish(n);
    if (BLOCKS[n.type].c) {
      lines.push({ text: pad + head + ':', id: n.id });
      if (n.body.length) out(n.body, depth + 1); else lines.push({ text: pad + indent + '…', id: null, empty: true });
      if (n.type === 'ifelse') {
        lines.push({ text: pad + 'otherwise:', id: n.id });
        if (n.else.length) out(n.else, depth + 1); else lines.push({ text: pad + indent + '…', id: null, empty: true });
      }
    } else lines.push({ text: pad + head, id: n.id });
  });
  p.defs.forEach((d) => {
    lines.push({ text: 'to ' + d.name + ':', id: d.id, def: true });
    if (d.body.length) out(d.body, 1); else lines.push({ text: indent + '…', id: null, empty: true });
    lines.push({ text: '', id: null });
  });
  out(p.main, 0);
  return lines;
}

function parseLine(raw, words) {
  const s = raw.trim().replace(/:$/, '').trim();
  const lower = s.toLowerCase();
  let m;
  if (lower === 'go forward') return makeNode('forward');
  if ((m = lower.match(/^turn (left|right)$/))) return makeNode('turn', { dir: m[1] });
  if (lower === 'pick it up') return makeNode('pick');
  if ((m = lower.match(/^paint it (\w+)$/))) return makeNode('paint', { color: m[1] });
  if ((m = s.match(/^say (.+)$/i))) return makeNode('say', { what: m[1] });
  if ((m = lower.match(/^repeat (\w+) times$/))) return makeNode('repeat', { n: /^\d+$/.test(m[1]) ? Number(m[1]) : m[1] });
  if ((m = lower.match(/^repeat until (.+)$/))) return makeNode('until', { cond: condKey(m[1]) });
  if ((m = lower.match(/^if (.+)$/))) return makeNode('if', { cond: condKey(m[1]) });
  if ((m = lower.match(/^set (\w+) to (\d+)$/))) return makeNode('set', { v: m[1], n: Number(m[2]) });
  if ((m = lower.match(/^add 1 to (\w+)$/))) return makeNode('add', { v: m[1] });
  if (words.has(lower) || lower in WORDS) return makeNode('call', { name: lower });
  throw new Error('English code: I don\'t understand "' + raw.trim() + '"');
}
function condKey(text) {
  const k = COND_BY_TEXT[text.toLowerCase()];
  if (!k) throw new Error('English code: unknown condition "' + text + '"');
  return k;
}

export function parseProgram(text) {
  const rows = text.split('\n').map((l) => l.replace(/\t/g, '    ')).filter((l) => l.trim() && !l.trim().startsWith('#'));
  const words = new Set(rows.map((r) => r.trim().match(/^to (.+):$/i)).filter(Boolean).map((m) => m[1].toLowerCase()));
  const prog = { main: [], defs: [] };
  // stack of { indent, list, node }
  const stack = [{ indent: -1, list: prog.main, node: null }];
  for (const row of rows) {
    const indent = row.match(/^ */)[0].length;
    const line = row.trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const top = stack[stack.length - 1];
    let m;
    if ((m = line.match(/^to (.+):$/i))) {
      const def = { id: 'd' + prog.defs.length + '_' + Math.random().toString(36).slice(2, 7), name: m[1].toLowerCase(), body: [] };
      prog.defs.push(def);
      stack.push({ indent, list: def.body, node: null });
      continue;
    }
    if (/^otherwise:?$/i.test(line)) {
      // attach to the most recent "if" at this indent
      const owner = top.list[top.list.length - 1];
      if (!owner || (owner.type !== 'if' && owner.type !== 'ifelse')) throw new Error('English code: "otherwise" without "if"');
      if (owner.type === 'if') { owner.type = 'ifelse'; owner.else = []; }
      stack.push({ indent, list: owner.else, node: owner });
      continue;
    }
    const n = parseLine(line, words);
    top.list.push(n);
    if (BLOCKS[n.type].c) stack.push({ indent, list: n.body, node: n });
  }
  return prog;
}
