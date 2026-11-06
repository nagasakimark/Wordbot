// Progress in this browser only (localStorage can be missing or full: always try/catch).
const KEY = 'wordbot.v2';
const fresh = () => ({ stars: {}, seen: {}, programs: {}, settings: { sfx: true, voice: true, hints: true, speed: 1 } });
let data = fresh();
try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); data = { ...fresh(), ...d, settings: { ...fresh().settings, ...(d.settings || {}) } }; } } catch (e) { /* ignore */ }

export const save = {
  get: () => data,
  write() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ } },
  setStars(id, n) { if (n > (data.stars[id] || 0)) { data.stars[id] = n; this.write(); return true; } return false; },
  stars: (id) => data.stars[id] || 0,
  totalStars: () => Object.values(data.stars).reduce((a, b) => a + b, 0),
  seen(key) { return !!data.seen[key]; },
  markSeen(key) { data.seen[key] = true; this.write(); },
  program: (id) => data.programs[id] || null,
  setProgram(id, p) { data.programs[id] = p; this.write(); },
  reset() { data = fresh(); this.write(); },
};
