// Every sound effect is synthesised with WebAudio, so there are no sound files.
let ctx = null, master = null;
const settings = { sfx: true, voice: true };

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, { type = 'sine', vol = 0.3, at = 0, slide = 0, attack = 0.005 } = {}) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + at;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}
let noiseBuf = null;
function noise(dur, { vol = 0.2, at = 0, freq = 1200, q = 1, sweep = 0 } = {}) {
  const c = ac(); if (!c) return;
  if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = c.currentTime + at;
  const s = c.createBufferSource(); s.buffer = noiseBuf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(60, freq + sweep), t + dur);
  const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

const SOUNDS = {
  press: () => tone(520, 0.07, { type: 'triangle', vol: 0.16, slide: 180 }),
  pick: () => tone(700, 0.06, { type: 'triangle', vol: 0.18, slide: 300 }),
  snap: () => { noise(0.05, { vol: 0.32, freq: 2500, q: 2 }); tone(190, 0.09, { type: 'square', vol: 0.1 }); tone(380, 0.06, { type: 'triangle', vol: 0.14, at: 0.02 }); },
  poof: () => { noise(0.25, { vol: 0.28, freq: 3000, sweep: -2600 }); tone(300, 0.2, { vol: 0.1, slide: -200 }); },
  step: () => { noise(0.05, { vol: 0.1, freq: 900 + Math.random() * 300, q: 3 }); tone(330 + Math.random() * 40, 0.06, { type: 'triangle', vol: 0.06 }); },
  turn: () => noise(0.2, { vol: 0.12, freq: 600, sweep: 1400, q: 2 }),
  bump: () => { tone(110, 0.22, { vol: 0.42, slide: -50 }); noise(0.1, { vol: 0.2, freq: 300 }); },
  fall: () => { tone(800, 0.7, { type: 'sine', vol: 0.16, slide: -700 }); },
  gem: () => { tone(1046, 0.08, { type: 'square', vol: 0.07 }); tone(1568, 0.22, { type: 'square', vol: 0.07, at: 0.08 }); },
  paint: () => { noise(0.18, { vol: 0.22, freq: 1800, sweep: -1200, q: 1.5 }); tone(520, 0.12, { type: 'sine', vol: 0.1, slide: 200 }); },
  yes: () => { tone(880, 0.08, { type: 'triangle', vol: 0.12 }); tone(1175, 0.1, { type: 'triangle', vol: 0.12, at: 0.06 }); },
  no: () => { tone(330, 0.1, { type: 'triangle', vol: 0.12 }); tone(262, 0.12, { type: 'triangle', vol: 0.12, at: 0.07 }); },
  loop: () => tone(660, 0.06, { type: 'sine', vol: 0.08, slide: 120 }),
  error: () => { tone(220, 0.14, { type: 'square', vol: 0.1 }); tone(185, 0.2, { type: 'square', vol: 0.1, at: 0.12 }); },
  fail: () => { tone(392, 0.18, { type: 'triangle', vol: 0.2 }); tone(311, 0.32, { type: 'triangle', vol: 0.2, at: 0.18 }); },
  run: () => [523, 659, 784].forEach((f, i) => tone(f, 0.1, { type: 'triangle', vol: 0.15, at: i * 0.06 })),
  win: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i === 4 ? 0.6 : 0.16, { type: 'triangle', vol: 0.22, at: i * 0.1 })); [262, 392].forEach((f) => tone(f, 0.8, { vol: 0.1, at: 0.4 })); },
  star: () => { tone(1319, 0.12, { type: 'triangle', vol: 0.16 }); tone(1760, 0.2, { type: 'triangle', vol: 0.12, at: 0.06 }); },
};

export const sfx = {
  play(name) { if (settings.sfx && SOUNDS[name]) try { SOUNDS[name](); } catch (e) { /* ignore */ } },
  unlock() { ac(); },
  apply(s) { Object.assign(settings, s); if (!settings.voice) try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } },
  get settings() { return settings; },
};

// English voice (synthetic for now). Resolves when done, or after a timeout
// because some Chromebook voices never fire onend.
let voices = null;
function pickVoice() {
  if (!window.speechSynthesis) return null;
  voices = speechSynthesis.getVoices() || [];
  return voices.find((v) => /en[-_]US/i.test(v.lang) && /google|samantha|aria|jenny/i.test(v.name)) || voices.find((v) => /^en[-_]US/i.test(v.lang)) || voices.find((v) => /^en/i.test(v.lang)) || null;
}
export function speak(text, { rate = 0.9 } = {}) {
  return new Promise((resolve) => {
    if (!settings.voice || !window.speechSynthesis || !window.SpeechSynthesisUtterance || !text) { resolve(); return; }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice(); if (v) u.voice = v;
      u.lang = 'en-US'; u.rate = rate; u.pitch = 1.15;
      let done = false; const fin = () => { if (!done) { done = true; resolve(); } };
      u.onend = fin; u.onerror = fin;
      speechSynthesis.speak(u);
      setTimeout(fin, 900 + text.length * 95);
    } catch (e) { resolve(); }
  });
}
export const stopSpeech = () => { try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { /* ignore */ } };
