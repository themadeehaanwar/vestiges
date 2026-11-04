/* All sounds are generated live in the browser — no audio files needed. */
const Sound = (() => {
  let ctx = null, master = null, on = false, current = null, currentName = null, noiseBuf = null, brownBuf = null;

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const len = ctx.sampleRate * 3;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    brownBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const w = noiseBuf.getChannelData(0), b = brownBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const r = Math.random() * 2 - 1; w[i] = r;
      last = (last + 0.02 * r) / 1.02; b[i] = last * 3.5;
    }
  }
  const now = () => ctx.currentTime;
  function noise(brown) { const s = ctx.createBufferSource(); s.buffer = brown ? brownBuf : noiseBuf; s.loop = true; s.start(); return s; }
  function filt(type, f, q = 1) { const x = ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; }
  function gain(v) { const g = ctx.createGain(); g.gain.value = v; return g; }
  function lfo(rate, depth, target) { const o = ctx.createOscillator(), g = gain(depth); o.frequency.value = rate; o.connect(g); g.connect(target); o.start(); return o; }
  function chain(...n) { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; }

  // each ambient returns {out, stop()}
  const AMB = {
    ocean() {
      const out = gain(0), g = gain(0.35);
      const n = noise(true), f = filt('lowpass', 500);
      chain(n, f, g, out); const l1 = lfo(0.09, 0.28, g.gain); const l2 = lfo(0.07, 300, f.frequency);
      return { out, nodes: [n, l1, l2] };
    },
    rain() {
      const out = gain(0);
      const n = noise(), hp = filt('highpass', 900), lp = filt('lowpass', 7000), g = gain(0.09);
      chain(n, hp, lp, g, out);
      const t = setInterval(() => { if (Math.random() < .7) drip(out, 2000 + Math.random() * 3000, .04); }, 90);
      return { out, nodes: [n], timers: [t] };
    },
    wind() {
      const out = gain(0);
      const n = noise(), bp = filt('bandpass', 420, 0.8), g = gain(0.25);
      chain(n, bp, g, out); const l1 = lfo(0.13, 260, bp.frequency); const l2 = lfo(0.05, 0.15, g.gain);
      return { out, nodes: [n, l1, l2] };
    },
    vinyl() {
      const out = gain(0);
      const n = noise(), bp = filt('bandpass', 3000, .5), g = gain(0.018); chain(n, bp, g, out);
      const hum = ctx.createOscillator(); hum.frequency.value = 55; const hg = gain(0.012); chain(hum, hg, out); hum.start();
      const t = setInterval(() => { if (Math.random() < .55) click(out, .06 + Math.random() * .12); }, 70);
      const t2 = setInterval(() => softNote(out, [392, 440, 523, 587, 659][Math.floor(Math.random() * 5)] / 2, 3.5, .035), 2600);
      return { out, nodes: [n, hum], timers: [t, t2] };
    },
    heartbeat() {
      const out = gain(0);
      const d1 = ctx.createOscillator(), d2 = ctx.createOscillator(); d1.frequency.value = 49; d2.frequency.value = 49.6;
      const dg = gain(0.05); d1.connect(dg); d2.connect(dg); dg.connect(out); d1.start(); d2.start();
      const n = noise(true), lp = filt('lowpass', 180), ng = gain(0.12); chain(n, lp, ng, out);
      const beat = () => { thump(out, 0); thump(out, 0.28, .7); };
      beat(); const t = setInterval(beat, 1150);
      return { out, nodes: [d1, d2, n], timers: [t] };
    },
    drone() {
      const out = gain(0);
      const fr = [55, 82.4, 110.3];
      const os = fr.map(f => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const g = gain(0.022); chain(o, g, out); o.start(); return o; });
      const n = noise(true), lp = filt('lowpass', 260), g = gain(0.14); chain(n, lp, g, out);
      const l = lfo(0.04, 120, lp.frequency);
      return { out, nodes: [...os, n, l] };
    },
    chimes() {
      const out = gain(0);
      const scale = [523, 587, 659, 784, 880, 1047];
      const t = setInterval(() => { if (Math.random() < .65) bell(out, scale[Math.floor(Math.random() * scale.length)], .05); }, 900);
      const pad = ctx.createOscillator(); pad.frequency.value = 261.6; const pg = gain(0.01); chain(pad, pg, out); pad.start();
      return { out, nodes: [pad], timers: [t] };
    },
    night() {
      const out = gain(0);
      const pads = [130.8, 196, 246.9].map(f => { const o = ctx.createOscillator(); o.frequency.value = f; const g = gain(0.014); chain(o, g, out); o.start(); return o; });
      const t = setInterval(() => { if (Math.random() < .4) bell(out, [1568, 1760, 2093, 2349][Math.floor(Math.random() * 4)], .025); }, 1100);
      const t2 = setInterval(() => { if (Math.random() < .6) click(out, .03); }, 140);
      return { out, nodes: pads, timers: [t, t2] };
    },
    room() {
      const out = gain(0);
      const n = noise(true), lp = filt('lowpass', 320), g = gain(0.1); chain(n, lp, g, out);
      const h = noise(), hp = filt('highpass', 5000), hg = gain(0.004); chain(h, hp, hg, out);
      const l = lfo(0.05, 0.04, g.gain);
      return { out, nodes: [n, h, l] };
    },
    sleep() {
      const out = gain(0);
      const n = noise(true), lp = filt('lowpass', 520), g = gain(0.12); chain(n, lp, g, out);
      const l = lfo(0.18, 0.1, g.gain); const l2 = lfo(0.18, 180, lp.frequency); // slow breathing
      return { out, nodes: [n, l, l2] };
    },
    fire() {
      const out = gain(0);
      const n = noise(true), lp = filt('lowpass', 400), g = gain(0.22); chain(n, lp, g, out);
      const t = setInterval(() => { if (Math.random() < .6) click(out, .05 + Math.random() * .1, 1200); }, 60);
      const l = lfo(0.3, 0.06, g.gain);
      return { out, nodes: [n, l], timers: [t] };
    },
  };

  function env(g, peak, a, d, t0 = now()) { g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d); }
  function click(dest, v, f = 2500) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; const bp = filt('bandpass', f + Math.random() * 2000, 2); const g = gain(0);
    chain(s, bp, g, dest); const t = now(); env(g, v, 0.001, 0.02, t); s.start(t, Math.random() * 2, 0.05);
  }
  function drip(dest, f, v) {
    const o = ctx.createOscillator(); o.type = 'sine'; const g = gain(0); chain(o, g, dest); const t = now();
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .5, t + .05); env(g, v, .002, .06, t); o.start(t); o.stop(t + .1);
  }
  function thump(dest, delay, v = 1) {
    const o = ctx.createOscillator(); const g = gain(0); chain(o, g, dest); const t = now() + delay;
    o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(38, t + .18); env(g, .5 * v, .008, .22, t); o.start(t); o.stop(t + .3);
  }
  function bell(dest, f, v) { // warm music-box tone (harmonic, not eerie)
    [1, 2, 3].forEach((m, i) => { const o = ctx.createOscillator(); const g = gain(0); chain(o, g, dest); o.frequency.value = f * m; const t = now(); env(g, v / (i * 2 + 1), .004, 1.6 / (i + 1), t); o.start(t); o.stop(t + 2); });
  }
  function softNote(dest, f, dur, v) {
    const o = ctx.createOscillator(); o.type = 'triangle'; const lp = filt('lowpass', 900); const g = gain(0); chain(o, lp, g, dest);
    o.frequency.value = f; const t = now(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .8); g.gain.linearRampToValueAtTime(0, t + dur); o.start(t); o.stop(t + dur + .1);
  }

  function stopAmb(a) {
    if (!a) return; const t = now();
    a.out.gain.cancelScheduledValues(t); a.out.gain.setValueAtTime(a.out.gain.value, t); a.out.gain.linearRampToValueAtTime(0, t + 1.5);
    (a.timers || []).forEach(clearInterval);
    setTimeout(() => { (a.nodes || []).forEach(n => { try { n.stop(); } catch (e) {} }); a.out.disconnect(); }, 1700);
  }
  function setAmbient(name) {
    currentName = name;
    if (!ctx || !on) return;
    if (current && current.name === name) return;
    stopAmb(current); current = null;
    if (!AMB[name]) return;
    const a = AMB[name](); a.name = name; a.out.connect(master);
    a.out.gain.linearRampToValueAtTime(1, now() + 2.5); current = a;
  }
  function pageTurn() {
    if (!ctx || !on) return;
    const r = (a, b) => a + Math.random() * (b - a), t = now();
    const dur = r(.32, .7), f0 = r(500, 1300), f1 = r(2400, 5800), peak = r(.18, .38);
    const s = ctx.createBufferSource(); s.buffer = Math.random() < .5 ? noiseBuf : brownBuf; s.playbackRate.value = r(.8, 1.25);
    const bp = filt('bandpass', f0, r(.5, 1.2)); const g = gain(0); chain(s, bp, g, master);
    bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur * .6);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + r(.03, .1)); g.gain.linearRampToValueAtTime(peak * r(.2, .5), t + dur * .5); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.start(t, Math.random() * 2, dur + .1);
    const crinkles = Math.floor(r(2, 7)); // paper crackle grains
    for (let k = 0; k < crinkles; k++) setTimeout(() => click(master, r(.03, .09), r(1500, 4000)), r(0, dur * 900));
    if (Math.random() < .6) setTimeout(() => { // soft landing of the page
      const n = ctx.createBufferSource(); n.buffer = brownBuf; const lp = filt('lowpass', r(250, 500)); const gg = gain(0); chain(n, lp, gg, master);
      const t2 = now(); env(gg, r(.15, .3), .01, .18, t2); n.start(t2, Math.random(), .3);
    }, dur * 800);
  }
  function touch(kind) {
    if (!ctx || !on) return;
    const t = now(), r = (a, b) => a + Math.random() * (b - a);
    if (kind === 'ink') { // a muffled blot
      const n = ctx.createBufferSource(); n.buffer = brownBuf; const lp = filt('lowpass', r(300, 600)); const g = gain(0); chain(n, lp, g, master);
      env(g, .5, .005, .25, t); n.start(t, Math.random(), .35); thump(master, 0, .35); return;
    }
    if (kind === 'bloom') { // airy unfurling swish
      const n = ctx.createBufferSource(); n.buffer = noiseBuf; const bp = filt('bandpass', 400, 1.4); const g = gain(0); chain(n, bp, g, master);
      bp.frequency.setValueAtTime(350, t); bp.frequency.exponentialRampToValueAtTime(1800, t + .9);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.08, t + .4); g.gain.linearRampToValueAtTime(0, t + 1.1); n.start(t, Math.random(), 1.2);
    }
    // soft felt-piano pluck
    const f = [196, 220, 262, 294, 330, 392][Math.floor(Math.random() * 6)];
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const lp = filt('lowpass', 750); const g = gain(0); chain(o, lp, g, master);
    env(g, .1, .006, .7, t); o.start(t); o.stop(t + .8);
  }
  function sparkle() { if (ctx && on) bell(master, [1047, 1319, 1568, 2093][Math.floor(Math.random() * 4)], .04); }
  function setOn(v) {
    init(); if (!ctx) return; on = v;
    if (ctx.state === 'suspended') ctx.resume();
    master.gain.cancelScheduledValues(now());
    master.gain.linearRampToValueAtTime(v ? 0.9 : 0, now() + 0.8);
    if (v) { current = null; setAmbient(currentName); } else { const c = current; current = null; setTimeout(() => stopAmb(c), 800); }
  }
  return { setOn, isOn: () => on, setAmbient, pageTurn, sparkle, touch };
})();
