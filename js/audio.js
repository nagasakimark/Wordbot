/* Word Bot audio: tiny synthesised sound effects + browser speech (synthetic English voice).
 * No audio files, so nothing to download on school Wi-Fi. Everything is a no-op when sound is off. */
(function (root) {
  'use strict';
  const WB = (root.WB = root.WB || {});

  let ctx = null;
  let enabled = true;

  function ensure() {
    if (!ctx) {
      try { ctx = new (root.AudioContext || root.webkitAudioContext)(); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  function tone(freq, dur, type, vol, delay, slideTo) {
    if (!enabled) return;
    const c = ensure();
    if (!c) return;
    const t = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.03);
  }

  const sfx = {
    tap: () => tone(660, 0.06, 'triangle', 0.08),
    drop: () => tone(440, 0.09, 'triangle', 0.1),
    step: () => tone(520, 0.07, 'triangle', 0.07),
    jump: () => tone(280, 0.22, 'square', 0.06, 0, 760),
    bonk: () => { tone(150, 0.2, 'sawtooth', 0.14, 0, 70); },
    fall: () => tone(700, 0.55, 'sine', 0.1, 0, 90),
    coin: () => { tone(880, 0.08, 'square', 0.06); tone(1320, 0.2, 'square', 0.06, 0.08); },
    door: () => { tone(220, 0.12, 'triangle', 0.1); tone(330, 0.16, 'triangle', 0.1, 0.1); },
    happy: () => { tone(660, 0.1, 'triangle', 0.1); tone(880, 0.16, 'triangle', 0.1, 0.1); },
    hmm: () => tone(300, 0.2, 'triangle', 0.08, 0, 220),
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.11, i * 0.12)),
  };

  // ---- speech ------------------------------------------------------------
  function synth() { return root.speechSynthesis || null; }
  function pickVoice() {
    const s = synth();
    if (!s) return null;
    const vs = s.getVoices() || [];
    return vs.find((v) => /^en[-_]US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  }
  // Speak English text. Resolves when finished (or after a safety timeout: some Chromebook voices never fire onend).
  function speak(text) {
    return new Promise((resolve) => {
      const s = synth();
      if (!enabled || !s || !root.SpeechSynthesisUtterance) { resolve(); return; }
      try {
        s.cancel();
        const u = new root.SpeechSynthesisUtterance(text);
        const v = pickVoice();
        if (v) u.voice = v;
        u.lang = 'en-US'; u.rate = 0.85; u.pitch = 1.15;
        let done = false;
        const finish = () => { if (!done) { done = true; resolve(); } };
        u.onend = finish; u.onerror = finish;
        s.speak(u);
        setTimeout(finish, 1200 + text.length * 110);
      } catch (e) { resolve(); }
    });
  }
  function stopSpeech() { const s = synth(); if (s) { try { s.cancel(); } catch (e) {} } }

  WB.audio = {
    sfx: sfx, speak: speak, stopSpeech: stopSpeech, unlock: ensure,
    setEnabled: (v) => { enabled = !!v; if (!enabled) stopSpeech(); },
    isEnabled: () => enabled,
    hasSpeech: () => !!synth(),
  };
})(window);
