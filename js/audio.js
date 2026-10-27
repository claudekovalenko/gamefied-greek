// Sound: every effect is synthesized with the Web Audio API (no sound files),
// so each moment of play can have its own sound: footsteps on grass, stone,
// snow or wood, coins, portals, spells, hits, each mini-game, and a quiet
// background for each world (birds, wind, water, crickets, embers, a hushed hall).
window.KG = window.KG || {};
(function () {
  'use strict';
  let ctx = null, master, sfxBus, ambBus, noiseBuf = null;
  const on = () => { const s = KG.engine && KG.engine.state.settings; return !s || s.sound !== false; };
  const ambOn = () => { const s = KG.engine && KG.engine.state.settings; return on() && (!s || s.ambient !== false); };
  function init() {
    if (ctx) return ctx;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    master = ctx.createDynamicsCompressor(); master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    ambBus = ctx.createGain(); ambBus.gain.value = 0; ambBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  // phones only allow sound after a touch
  const unlock = () => { if (init() && ctx.state === 'suspended') ctx.resume(); };
  addEventListener('pointerdown', unlock, { passive: true }); addEventListener('keydown', unlock);

  const now = () => ctx.currentTime;
  function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  // a pitched tone, optionally gliding to another pitch
  function tone(freq, at, dur, { type = 'sine', vol = 0.12, to = null, attack = 0.005, bus = sfxBus } = {}) {
    const t = now() + at, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    env(g, t, attack, vol, dur);
    o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.05);
  }
  // filtered noise: steps, whooshes, splashes, cracks
  function noise(at, dur, { type = 'bandpass', freq = 1000, to = null, q = 1, vol = 0.15, attack = 0.004, bus = sfxBus } = {}) {
    const t = now() + at, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true;
    f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    env(g, t, attack, vol, dur);
    s.connect(f).connect(g).connect(bus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  const notes = (list, gap, opts) => list.forEach((f, i) => tone(f, i * gap, opts.dur || 0.2, opts));
  // a step up the scale for each combo, so a streak climbs
  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
  const step12 = (base, n) => base * Math.pow(2, SCALE[Math.min(SCALE.length - 1, n)] / 12);

  const SOUNDS = {
    tap: () => tone(440, 0, 0.05, { type: 'triangle', vol: 0.05 }),
    good: n => { const b = step12(660, n || 0); tone(b, 0, 0.12); tone(b * 1.5, 0.07, 0.2); },
    bad: () => { tone(220, 0, 0.25, { type: 'sawtooth', vol: 0.05, to: 140 }); noise(0, 0.15, { freq: 300, vol: 0.05 }); },
    combo: n => notes([880, 1175, 1568].map(f => step12(f, Math.max(0, (n || 0) - 3) >> 1)), 0.07, { dur: 0.18, type: 'triangle' }),
    win: () => notes([523, 659, 784, 1047], 0.11, { dur: 0.3, type: 'triangle' }),
    level: () => notes([392, 523, 659, 784, 1047, 1319], 0.09, { dur: 0.35, type: 'triangle' }),
    // ── walking the worlds ──
    step: surface => {
      if (surface === 'snow') noise(0, 0.12, { type: 'highpass', freq: 2500, vol: 0.05 });
      else if (surface === 'wood') { tone(140, 0, 0.08, { type: 'triangle', vol: 0.08, to: 90 }); noise(0, 0.05, { freq: 700, vol: 0.03 }); }
      else if (surface === 'stone') { noise(0, 0.05, { freq: 1800, q: 2, vol: 0.05 }); tone(220, 0, 0.04, { vol: 0.03 }); }
      else noise(0, 0.09, { freq: surface === 'sand' ? 900 : 500, q: 0.7, vol: 0.05 });
    },
    jump: () => noise(0, 0.18, { freq: 400, to: 1400, vol: 0.05 }),
    land: () => { noise(0, 0.1, { type: 'lowpass', freq: 400, vol: 0.12 }); tone(90, 0, 0.1, { vol: 0.08, to: 60 }); },
    splash: () => noise(0, 0.35, { type: 'lowpass', freq: 1800, to: 500, vol: 0.1 }),
    coin: () => { tone(988, 0, 0.08, { type: 'square', vol: 0.04 }); tone(1319, 0.06, 0.18, { type: 'square', vol: 0.04 }); },
    letter: n => { const b = step12(784, (n || 0) % 11); tone(b, 0, 0.5, { vol: 0.08 }); tone(b * 2, 0.02, 0.4, { vol: 0.04 }); tone(b * 3, 0.04, 0.3, { vol: 0.02 }); },
    scroll: () => { noise(0, 0.3, { freq: 3000, to: 1500, q: 0.5, vol: 0.04 }); notes([523, 784, 1047], 0.1, { dur: 0.4, vol: 0.07 }); },
    portal: () => { noise(0, 0.9, { freq: 200, to: 3000, q: 3, vol: 0.12, attack: 0.3 }); tone(110, 0, 1, { type: 'sine', vol: 0.1, to: 880, attack: 0.3 }); },
    gateOpen: () => { tone(55, 0, 1.4, { type: 'sawtooth', vol: 0.06, to: 110, attack: 0.2 }); notes([392, 523, 659, 784], 0.18, { dur: 0.6, vol: 0.08 }); },
    talk: () => { const b = 280 + Math.random() * 160; tone(b, 0, 0.06, { type: 'square', vol: 0.025 }); tone(b * 1.2, 0.07, 0.06, { type: 'square', vol: 0.02 }); },
    shade: () => { tone(110, 0, 0.6, { type: 'sawtooth', vol: 0.05, to: 70, attack: 0.1 }); noise(0, 0.6, { freq: 300, to: 120, q: 5, vol: 0.06, attack: 0.1 }); },
    banish: () => { noise(0, 0.5, { freq: 800, to: 5000, q: 2, vol: 0.06 }); notes([659, 880, 1319], 0.06, { dur: 0.35, vol: 0.06 }); },
    hurt: () => { tone(160, 0, 0.3, { type: 'square', vol: 0.06, to: 80 }); noise(0, 0.2, { type: 'lowpass', freq: 600, vol: 0.1 }); },
    heartLost: () => { notes([440, 330, 220], 0.12, { dur: 0.25, type: 'triangle', vol: 0.08 }); },
    // ── spells and trials ──
    cast: () => { noise(0, 0.3, { freq: 1500, to: 4000, q: 4, vol: 0.05 }); tone(600, 0, 0.3, { type: 'triangle', vol: 0.04, to: 1400 }); },
    hit: () => { noise(0, 0.15, { type: 'lowpass', freq: 1200, vol: 0.14 }); tone(180, 0, 0.15, { vol: 0.1, to: 90 }); },
    strike: () => { noise(0, 0.25, { freq: 500, to: 200, q: 2, vol: 0.08 }); tone(300, 0, 0.3, { type: 'sawtooth', vol: 0.04, to: 120 }); },
    shatter: () => { noise(0, 0.25, { type: 'highpass', freq: 1500, vol: 0.1 }); noise(0.03, 0.2, { freq: 600, q: 3, vol: 0.06 }); },
    chime: () => { tone(1568, 0, 0.5, { vol: 0.05 }); tone(2093, 0.05, 0.45, { vol: 0.03 }); },
    poof: () => noise(0, 0.4, { freq: 600, to: 2000, q: 1, vol: 0.06 }),
    roar: () => { tone(70, 0, 0.9, { type: 'sawtooth', vol: 0.09, to: 45, attack: 0.08 }); noise(0, 0.8, { type: 'lowpass', freq: 500, vol: 0.12, attack: 0.08 }); },
    defeat: () => { noise(0, 0.7, { type: 'lowpass', freq: 900, to: 200, vol: 0.12 }); tone(200, 0, 0.8, { type: 'triangle', vol: 0.06, to: 60 }); },
    whoosh: () => noise(0, 0.28, { freq: 500, to: 1600, q: 1.2, vol: 0.07 }),
    reel: () => [660, 740, 830, 990].forEach((f, i) => tone(f, i * 0.05, 0.08, { type: 'triangle', vol: 0.06 })),
    page: () => noise(0, 0.15, { freq: 2500, to: 1200, q: 0.8, vol: 0.04 }),
    // ── mini-games ──
    rainDrop: () => tone(1200 + Math.random() * 600, 0, 0.08, { vol: 0.03, to: 500 }),
    catch: n => { const b = step12(523, n || 0); tone(b, 0, 0.15, { type: 'triangle', vol: 0.08 }); tone(b * 2, 0.05, 0.2, { vol: 0.05 }); },
    thud: () => { tone(80, 0, 0.18, { vol: 0.12, to: 50 }); noise(0, 0.1, { type: 'lowpass', freq: 300, vol: 0.08 }); },
    march: () => { tone(110, 0, 0.08, { type: 'square', vol: 0.03 }); },
    anvil: () => { tone(1760, 0, 0.6, { type: 'square', vol: 0.03 }); tone(2637, 0, 0.5, { vol: 0.04 }); noise(0, 0.08, { type: 'highpass', freq: 3000, vol: 0.1 }); },
    hiss: () => noise(0, 0.6, { type: 'highpass', freq: 3000, to: 1500, vol: 0.06 }),
    tick: () => tone(1500, 0, 0.03, { type: 'square', vol: 0.03 }),
    // ── power-ups and rewards ──
    hint: () => notes([1047, 1319, 1568], 0.05, { dur: 0.3, vol: 0.06 }),
    shield: () => { tone(330, 0, 0.6, { vol: 0.08, to: 660, attack: 0.05 }); noise(0, 0.5, { freq: 2000, q: 8, vol: 0.04 }); },
    block: () => { tone(880, 0, 0.3, { type: 'triangle', vol: 0.1 }); tone(1320, 0.02, 0.4, { vol: 0.05 }); noise(0, 0.1, { type: 'highpass', freq: 2500, vol: 0.06 }); },
    slow: () => { tone(880, 0, 0.9, { vol: 0.08, to: 220 }); tone(1320, 0.05, 0.9, { vol: 0.04, to: 330 }); },
    medal: () => notes([784, 988, 1175, 1568], 0.08, { dur: 0.4, type: 'triangle', vol: 0.1 }),
    chest: () => { tone(220, 0, 0.2, { type: 'square', vol: 0.04 }); notes([523, 659, 784, 1047, 1319], 0.07, { dur: 0.3, vol: 0.07 }); },
  };
  // ── a quiet background for each world ─────────────────────
  let amb = null;
  const AMBIENT = [
    { wind: 0.25, birds: 1 },             // Alphabet Hollow
    { wind: 0.35, birds: 1.4, owl: 0.3 }, // Wordwood
    { wind: 0.5, birds: 0.7 },            // Fields
    { water: 0.7, birds: 0.6 },           // Verb River
    { wind: 0.6, hammer: 0.5 },           // Builders' Ridge
    { wind: 0.4, fire: 0.6 },             // Ruins of Time
    { water: 0.3, crickets: 1 },          // Mirror Lake
    { wind: 1 },                          // Declension Peaks
    { wind: 0.15, birds: 0.4, fountain: 0.5 }, // Great Library
  ];
  function loopNoise(type, freq, q, vol) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
    s.connect(f).connect(g).connect(ambBus); s.start();
    return { s, f, g };
  }
  function startAmbient(i) {
    stopAmbient();
    if (!ambOn() || !init()) return;
    const A = AMBIENT[i] || {}, nodes = [];
    if (A.wind) nodes.push(loopNoise('lowpass', 500, 0.5, 0.05 * A.wind));
    if (A.water || A.fountain) nodes.push(loopNoise('bandpass', A.fountain ? 2500 : 900, 0.6, 0.06 * (A.water || A.fountain)));
    if (A.fire) nodes.push(loopNoise('lowpass', 300, 0.8, 0.04 * A.fire));
    const wind = nodes[0];
    amb = { i, A, nodes, timer: setInterval(() => {
      if (!ctx || ctx.state !== 'running') return;
      // gusts, chirps, crickets, crackles and distant hammers come and go
      if (wind && A.wind) wind.f.frequency.setTargetAtTime(300 + Math.random() * 700 * A.wind, now(), 1.5);
      if (A.birds && Math.random() < 0.35 * A.birds) { const b = 2000 + Math.random() * 1500, n = 2 + Math.floor(Math.random() * 3); for (let k = 0; k < n; k++) tone(b, k * 0.11, 0.08, { vol: 0.015, to: b * (Math.random() < 0.5 ? 1.3 : 0.8), bus: ambBus }); }
      if (A.owl && Math.random() < 0.06) { tone(380, 0, 0.35, { vol: 0.02, to: 330, attack: 0.08, bus: ambBus }); tone(380, 0.5, 0.5, { vol: 0.02, to: 320, attack: 0.08, bus: ambBus }); }
      if (A.crickets && Math.random() < 0.7) for (let k = 0; k < 4; k++) tone(4200 + Math.random() * 300, k * 0.06, 0.03, { type: 'square', vol: 0.004, bus: ambBus });
      if (A.fire && Math.random() < 0.5) noise(Math.random() * 0.5, 0.03, { type: 'highpass', freq: 2500, vol: 0.02, bus: ambBus });
      if (A.hammer && Math.random() < 0.12) for (let k = 0; k < 3; k++) tone(900, k * 0.35, 0.06, { type: 'square', vol: 0.006, bus: ambBus });
    }, 700) };
    ambBus.gain.cancelScheduledValues(now()); ambBus.gain.setTargetAtTime(0.9, now(), 1.2);
  }
  function stopAmbient() {
    if (!amb) return;
    const a = amb; amb = null; clearInterval(a.timer);
    if (ctx) { ambBus.gain.cancelScheduledValues(now()); ambBus.gain.setTargetAtTime(0, now(), 0.3); setTimeout(() => a.nodes.forEach(n => { try { n.s.stop(); } catch (e) { /* already stopped */ } }), 1200); }
  }

  KG.audio = {
    play(kind, arg) { if (!on() || !init() || !SOUNDS[kind]) return; try { SOUNDS[kind](arg); } catch (e) { /* audio unavailable */ } },
    ambient: i => startAmbient(i), stopAmbient,
    // a shade's hum grows as it closes in (0 = far, 1 = touching)
    menace(v) {
      if (!on() || !ctx || ctx.state !== 'running') return;
      if (!KG.audio._hum) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = 55; g.gain.value = 0; o.connect(g).connect(sfxBus); o.start(); KG.audio._hum = { o, g }; }
      const h = KG.audio._hum; h.g.gain.setTargetAtTime(v * 0.035, now(), 0.2); h.o.frequency.setTargetAtTime(50 + v * 30, now(), 0.2);
    },
    get sounds() { return Object.keys(SOUNDS); },
  };
})();
