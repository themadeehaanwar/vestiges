/* Living overlays: butterflies, petals, swaying flowers, stains, rain, stars… drawn on canvas. */
class FX {
  constructor(back, front) {
    this.layers = [back, front].map(c => ({ c, x: c ? c.getContext('2d') : null }));
    this.ps = []; this.t = 0; this.wind = 0; this.gust = 0; this.mood = null; this.timers = {};
    this.pointer = { x: -999, y: -999 };
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.sprites = {};
    this.resize(); addEventListener('resize', () => this.resize());
    addEventListener('pointermove', e => { this.pointer.x = e.clientX; this.pointer.y = e.clientY; });
    let last = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!document.hidden) this.step(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  resize() {
    this.dpr = Math.min(1.5, devicePixelRatio || 1);
    this.W = innerWidth; this.H = innerHeight;
    this.k = Math.max(0.45, Math.min(1.4, (this.W * this.H) / (1280 * 800))) * (this.reduced ? 0.4 : 1);
    for (const l of this.layers) if (l.c) { l.c.width = this.W * this.dpr; l.c.height = this.H * this.dpr; l.x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); }
    this.ps.filter(p => p.kind === 'flower').forEach(p => this.placeFlower(p));
  }
  glow(color, r = 32) {
    const key = color + r; if (this.sprites[key]) return this.sprites[key];
    const c = document.createElement('canvas'); c.width = c.height = r * 2; const x = c.getContext('2d');
    const n = parseInt(color.slice(1), 16), clear = color[0] === '#' ? `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},0)` : 'rgba(255,255,255,0)';
    const g = x.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, color); g.addColorStop(.25, color); g.addColorStop(1, clear);
    x.globalAlpha = 1; x.fillStyle = g; x.beginPath(); x.arc(r, r, r, 0, 7); x.fill();
    return (this.sprites[key] = c);
  }
  rnd(a, b) { return a + Math.random() * (b - a); }
  pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  col() { return this.pick(this.mood.colors || ['#fff']); }

  setMood(mood) {
    this.mood = mood;
    this.ps.forEach(p => p.dying = true);
    Object.values(this.timers).forEach(clearInterval); this.timers = {};
    const k = this.k, fx = mood.fx || [];
    const n = (base) => Math.max(1, Math.round(base * k));
    const add = (kind, count, f) => { for (let i = 0; i < count; i++) this.ps.push(Object.assign({ kind, a: 0, life: 0 }, f(i, count))); };
    if (fx.includes('butterflies')) add('fly', n(5), () => this.newFly(false));
    if (fx.includes('moths')) add('fly', n(5), () => this.newFly(true));
    if (fx.includes('petals')) add('petal', n(20), () => this.newPetal(true));
    if (fx.includes('dust')) add('dust', n(45), () => this.newDust(true));
    if (fx.includes('stars')) add('star', n(90), () => ({ x: this.rnd(0, this.W), y: this.rnd(0, this.H), r: this.rnd(.4, 1.6), ph: this.rnd(0, 7), sp: this.rnd(.6, 2.4), layer: 0 }));
    if (fx.includes('rain')) add('rain', n(110), () => this.newRain(true));
    if (fx.includes('embers')) add('ember', n(40), () => this.newEmber(true));
    if (fx.includes('bubbles')) add('bubble', n(22), () => this.newBubble(true));
    if (fx.includes('sparkles')) add('spark', n(16), () => this.newSpark());
    if (fx.includes('fog')) add('fog', 7, () => ({ x: this.rnd(-200, this.W), y: this.rnd(this.H * .2, this.H), r: this.rnd(220, 420), v: this.rnd(6, 18), layer: Math.random() < .35 ? 1 : 0 }));
    if (fx.includes('clouds')) add('cloud', 6, () => ({ x: this.rnd(-300, this.W), y: this.rnd(-40, this.H), r: this.rnd(120, 240), v: this.rnd(5, 14), layer: 0 }));
    if (fx.includes('rays')) add('ray', 4, (i) => ({ ang: .55 + i * .16 + this.rnd(-.05, .05), w: this.rnd(60, 160), ph: this.rnd(0, 7), layer: 0 }));
    if (fx.includes('flowers')) add('flower', n(4) * 2, (i, c) => { const p = { side: i % 2, i: Math.floor(i / 2), ph: this.rnd(0, 7), len: this.rnd(.7, 1.15), petals: Math.round(this.rnd(9, 14)), layer: 1 }; this.placeFlower(p); return p; });
    if (fx.includes('scratches')) add('scratch', 1, () => ({ layer: 1 }));
    if (fx.includes('stains')) {
      this.timers.stain = setInterval(() => {
        if (this.ps.filter(p => p.kind === 'stain' && !p.dying).length < 5) this.addStain();
      }, 2600);
      setTimeout(() => this.addStain(), 600);
    }
    if (fx.includes('blooms')) {
      this.timers.creep = setInterval(() => { // they keep growing, slowly crowding in
        if (this.ps.filter(p => p.kind === 'bloom' && !p.dying).length < 9) this.bloomAt(null, null);
      }, 5200);
      setTimeout(() => this.bloomAt(null, null), 900);
    }
    if (fx.includes('flowers') && fx.includes('petals')) {
      this.timers.shed = setInterval(() => {
        const f = this.pick(this.ps.filter(p => p.kind === 'flower' && !p.dying)); if (!f) return;
        const p = this.newPetal(false); p.x = f.hx; p.y = f.hy; p.c = this.mood.flower === 'ixora' ? this.col() : '#ffffff'; this.ps.push(Object.assign({ kind: 'petal', a: 0, life: 0 }, p));
      }, 3500);
    }
  }
  placeFlower(p) {
    const per = Math.max(1, Math.round(4 * this.k));
    const span = Math.min(this.W * .22, 260);
    p.bx = p.side ? this.W - 20 - (p.i / per) * span : 20 + (p.i / per) * span;
    p.L = Math.min(this.H * (this.W < 700 ? .17 : .3), 240) * p.len;
    p.sz = Math.max(10, Math.min(20, this.W / 70)) * this.rnd(.85, 1.2);
  }
  newFly(moth) {
    const s = moth ? this.rnd(7, 11) : this.rnd(13, 20);
    return { x: this.rnd(0, this.W), y: this.rnd(0, this.H), h: this.rnd(0, 7), sp: moth ? this.rnd(60, 110) : this.rnd(40, 80), s, moth,
      fph: this.rnd(0, 7), fs: moth ? this.rnd(22, 30) : this.rnd(9, 13), tx: this.rnd(0, this.W), ty: this.rnd(0, this.H), tt: 0,
      c: moth ? this.pick(['#5a4636', '#7a6450', '#3d3028']) : this.pick(this.mood.flyColors || this.mood.colors || ['#fff']), c2: moth ? '#2a1e16' : null, layer: 1 };
  }
  newPetal(anywhere) {
    return { x: this.rnd(-50, this.W), y: anywhere ? this.rnd(-this.H, this.H) : -20, vy: this.rnd(22, 55), s: this.rnd(5, 11),
      rot: this.rnd(0, 7), vr: this.rnd(-2, 2), fl: this.rnd(1, 3), ph: this.rnd(0, 7), c: this.col(), layer: 1 };
  }
  newDust(any) { return { x: this.rnd(0, this.W), y: any ? this.rnd(0, this.H) : this.H + 10, r: this.rnd(.6, 2.4), vx: this.rnd(-6, 6), vy: this.rnd(-10, -2), ph: this.rnd(0, 7), c: this.col(), layer: Math.random() < .6 ? 1 : 0 }; }
  newRain(any) { return { x: this.rnd(-100, this.W + 100), y: any ? this.rnd(-this.H, this.H) : this.rnd(-80, -10), v: this.rnd(650, 950), l: this.rnd(10, 24), layer: Math.random() < .5 ? 1 : 0 }; }
  newEmber(any) { return { x: this.rnd(0, this.W), y: any ? this.rnd(0, this.H) : this.H + 10, vy: this.rnd(-70, -25), r: this.rnd(1, 3.2), ph: this.rnd(0, 7), c: this.pick(['#ffcf6b', '#ff8a2a', '#ff5a1f']), layer: 1 }; }
  newBubble(any) { return { x: this.rnd(0, this.W), y: any ? this.rnd(0, this.H) : this.H + 20, r: this.rnd(3, 13), vy: this.rnd(-45, -15), ph: this.rnd(0, 7), layer: Math.random() < .5 ? 1 : 0 }; }
  newSpark(x, y) { return { x: x ?? this.rnd(0, this.W), y: y ?? this.rnd(0, this.H), s: this.rnd(3, 8), T: this.rnd(1.2, 2.4), t0: x != null ? 0 : -this.rnd(0, 3), c: this.col(), rot: this.rnd(0, 1), vx: 0, vy: 0, layer: 1 }; }

  addStain(x, y, scale = 1, quick = false) {
    const W = this.W, H = this.H;
    if (x == null) { // prefer the desk around the page
      const edge = Math.random();
      x = edge < .5 ? (Math.random() < .5 ? this.rnd(0, W * .2) : this.rnd(W * .8, W)) : this.rnd(0, W);
      y = edge < .5 ? this.rnd(H * .15, H) : this.rnd(H * .86, H);
    }
    const r = this.rnd(25, 70) * scale * Math.max(.7, this.k), pts = [];
    const N = 34, f1 = this.rnd(2, 4), f2 = this.rnd(5, 9), o1 = this.rnd(0, 7), o2 = this.rnd(0, 7);
    for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; pts.push(1 + .22 * Math.sin(a * f1 + o1) + .1 * Math.sin(a * f2 + o2) + this.rnd(-.05, .05)); }
    const dots = Array.from({ length: Math.round(this.rnd(4, 11)) }, () => { const a = this.rnd(0, 7), d = this.rnd(1.15, 2.2); return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, r: this.rnd(.03, .11) }; });
    this.ps.push({ kind: 'stain', x, y, r, pts, dots, rot: this.rnd(0, 7), born: this.t, hold: quick ? 3 : this.rnd(7, 12), c: this.mood.stain || '#5a3a1a', a: 1, life: 0, layer: quick ? 1 : 0 });
  }

  burst(x, y) {
    const fx = (this.mood && this.mood.fx) || [];
    for (let i = 0; i < 4; i++) { const s = this.newSpark(x + this.rnd(-30, 30), y + this.rnd(-30, 30)); s.s *= .7; s.vx = this.rnd(-60, 60); s.vy = this.rnd(-80, 10); this.ps.push(Object.assign({ kind: 'spark', a: 1, life: 0, once: true }, s)); }
    if (fx.includes('blooms')) this.bloomAt(x, y);
    if (fx.includes('petals')) for (let i = 0; i < (fx.includes('blooms') ? 4 : 10); i++) { const p = this.newPetal(false); p.x = x; p.y = y; p.vx0 = this.rnd(-140, 140); p.vy = this.rnd(-60, 30); this.ps.push(Object.assign({ kind: 'petal', a: 1, life: 0, once: true }, p)); }
    if ((fx.includes('butterflies') || fx.includes('moths')) && this.ps.filter(p => p.kind === 'fly').length < 16) {
      const b = this.newFly(fx.includes('moths') && !fx.includes('butterflies')); b.x = x; b.y = y; b.h = this.rnd(0, 7); this.ps.push(Object.assign({ kind: 'fly', a: 0, life: 0, once: true }, b));
    }
    if (fx.includes('stains')) this.addStain(x, y, .35, true);
    if (fx.includes('bubbles')) for (let i = 0; i < 6; i++) { const b = this.newBubble(false); b.x = x + this.rnd(-20, 20); b.y = y; this.ps.push(Object.assign({ kind: 'bubble', a: 0, life: 0, once: true }, b)); }
  }

  step(dt) {
    this.t += dt; const t = this.t;
    if (Math.random() < dt * .08) this.gust = this.rnd(.6, 1.6);
    this.gust *= Math.pow(.6, dt);
    this.wind = Math.sin(t * .13) * .5 + Math.sin(t * .41) * .25 + this.gust;
    for (const l of this.layers) if (l.x) l.x.clearRect(0, 0, this.W, this.H);
    const keep = [];
    for (const p of this.ps) {
      p.life += dt;
      if (p.kind !== 'stain') p.a = p.dying ? p.a - dt * .8 : Math.min(1, p.a + dt * .7);
      if (p.a <= 0 && p.dying) continue;
      const alive = this[p.kind](p, dt, this.layers[p.layer || 0].x || this.layers[1 - (p.layer || 0)].x);
      if (alive !== false) keep.push(p);
    }
    this.ps = keep;
  }

  /* ---------- particle kinds ---------- */
  fly(p, dt, x) {
    p.tt -= dt;
    if (p.tt <= 0) { p.tx = this.rnd(this.W * .05, this.W * .95); p.ty = this.rnd(this.H * .05, this.H * .9); p.tt = this.rnd(2, 5); }
    let ang = Math.atan2(p.ty - p.y, p.tx - p.x);
    const dx = p.x - this.pointer.x, dy = p.y - this.pointer.y, d = Math.hypot(dx, dy);
    if (d < 130) { ang = Math.atan2(dy, dx); p.tt = Math.min(p.tt, .5); }
    let diff = ((ang - p.h + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    p.h += diff * dt * (p.moth ? 4 : 1.6) + (Math.random() - .5) * dt * (p.moth ? 9 : 2.5);
    const flap = Math.cos(this.t * p.fs + p.fph);
    const sp = p.sp * (d < 130 ? 2.2 : 1) * (.75 + .35 * Math.max(0, flap));
    p.x += Math.cos(p.h) * sp * dt + this.wind * 10 * dt; p.y += Math.sin(p.h) * sp * dt + flap * 12 * dt;
    if (p.once && p.life > 14) p.dying = true;
    // draw
    x.save(); x.globalAlpha = p.a * (p.moth ? .8 : .95); x.translate(p.x, p.y); x.rotate(p.h + Math.PI / 2);
    const s = p.s, open = .18 + .82 * Math.abs(flap);
    for (const side of [1, -1]) {
      x.save(); x.scale(side * open, 1);
      const g = x.createLinearGradient(0, 0, s * 1.25, 0); g.addColorStop(0, p.c2 || this.shade(p.c, -.35)); g.addColorStop(.6, p.c); g.addColorStop(1, p.moth ? p.c : this.shade(p.c, -.5));
      x.fillStyle = g; x.strokeStyle = p.moth ? 'rgba(0,0,0,.35)' : this.shade(p.c, -.6); x.lineWidth = p.moth ? .6 : .9;
      x.beginPath(); x.moveTo(0, -s * .1); x.bezierCurveTo(s * .5, -s * 1.25, s * 1.35, -s * 1.05, s * 1.05, -s * .05); x.quadraticCurveTo(s * .6, s * .05, 0, 0); x.fill(); x.stroke();
      x.beginPath(); x.moveTo(0, s * .05); x.bezierCurveTo(s * .95, s * .1, s * .9, s * .85, s * .35, s * .8); x.quadraticCurveTo(s * .1, s * .5, 0, s * .2); x.fill(); x.stroke();
      if (!p.moth) { x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(s * .85, -s * .62, s * .08, 0, 7); x.arc(s * 1.0, -s * .35, s * .06, 0, 7); x.fill(); x.fillStyle = this.shade(p.c, -.5); x.beginPath(); x.arc(s * .45, s * .45, s * .09, 0, 7); x.fill(); }
      x.restore();
    }
    x.fillStyle = p.moth ? '#20160f' : '#2b2118'; x.beginPath(); x.ellipse(0, s * .15, s * .09, s * .55, 0, 0, 7); x.fill();
    x.strokeStyle = x.fillStyle; x.lineWidth = .7; x.beginPath(); x.moveTo(0, -s * .35); x.quadraticCurveTo(-s * .2, -s * .8, -s * .35, -s * .9); x.moveTo(0, -s * .35); x.quadraticCurveTo(s * .2, -s * .8, s * .35, -s * .9); x.stroke();
    x.restore();
  }
  floret(x, cx, cy, r, c, rot = 0) {
    x.save(); x.translate(cx, cy); x.rotate(rot); x.fillStyle = c;
    for (let i = 0; i < 4; i++) { x.rotate(Math.PI / 2); x.beginPath(); x.ellipse(0, -r * .55, r * .32, r * .55, 0, 0, 7); x.fill(); }
    x.fillStyle = '#ffd34d'; x.beginPath(); x.arc(0, 0, r * .14, 0, 7); x.fill(); x.restore();
  }
  mix(a, b, t) {
    const h = v => [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
    const A = h(a), B = h(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
  }
  /* --- big flowers whose stems curl around the poem, then slowly wilt --- */
  bloomAt(x, y) {
    const b = this.rect ? this.rect() : { left: this.W * .3, top: this.H * .2, right: this.W * .7, bottom: this.H * .8 };
    const L = b.left, T = b.top, Wd = b.right - b.left, Ht = b.bottom - b.top, P = 2 * (Wd + Ht);
    const perim = s => { s = ((s % P) + P) % P;
      if (s < Wd) return [L + s, T, 0, -1]; s -= Wd;
      if (s < Ht) return [L + Wd, T + s, 1, 0]; s -= Ht;
      if (s < Wd) return [L + Wd - s, T + Ht, 0, 1]; s -= Wd;
      return [L, T + Ht - s, -1, 0]; };
    if (x == null) { const s = this.rnd(0, P), [px, py, nx, ny] = perim(s), o = this.rnd(-30, 90); x = px + nx * o + this.rnd(-40, 40) * ny; y = py + ny * o + this.rnd(-40, 40) * nx; }
    // nearest point on the page border
    const cands = [[Math.max(L, Math.min(L + Wd, x)) - L, T], [Wd + Math.max(0, Math.min(Ht, y - T)), 0], [Wd + Ht + (L + Wd - Math.max(L, Math.min(L + Wd, x))), 0], [2 * Wd + Ht + (T + Ht - Math.max(T, Math.min(T + Ht, y))), 0]];
    let s0 = 0, best = 1e9; for (const [s] of cands) { const [px, py] = perim(s), d = Math.hypot(px - x, py - y); if (d < best) { best = d; s0 = s; } }
    const dir = Math.random() < .5 ? 1 : -1, len = this.rnd(140, 300), M = Math.round(len / 9), ph = this.rnd(0, 7), pts = [];
    for (let j = 0; j <= M; j++) { const [px, py, nx, ny] = perim(s0 + dir * len * (1 - j / M)), o = 3 + Math.sin(j * .55 + ph) * 8; pts.push([px + nx * o, py + ny * o]); }
    const [ax, ay] = pts[pts.length - 1], mx = (ax + x) / 2 + (y - ay) * .35 * dir, my = (ay + y) / 2 - (x - ax) * .35 * dir;
    for (let j = 1; j <= 18; j++) { const u = j / 18; pts.push([(1 - u) ** 2 * ax + 2 * (1 - u) * u * mx + u * u * x, (1 - u) ** 2 * ay + 2 * (1 - u) * u * my + u * u * y]); }
    const lens = [0]; for (let j = 1; j < pts.length; j++) lens.push(lens[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
    const tendrils = Array.from({ length: 3 }, () => ({ at: Math.floor(this.rnd(.1, .85) * pts.length), side: Math.random() < .5 ? 1 : -1, r: this.rnd(7, 13) }));
    const live = this.ps.filter(p => p.kind === 'bloom' && !p.dying);
    if (live.length >= 16) live[0].born -= 16; // oldest rots faster
    this.ps.push({ kind: 'bloom', x, y, pts, lens, tendrils, born: this.t, R: this.rnd(30, 52) * Math.max(.75, Math.min(1.1, this.k)), n: Math.round(this.rnd(6, 9)), rot: this.rnd(0, 7), c: this.col(), a: 1, life: 0, layer: 1 });
  }
  bloom(p, dt, x) {
    const age = this.t - p.born, grow = Math.min(1, age / 1.8), eg = 1 - (1 - grow) ** 3;
    const open = Math.max(0, Math.min(1, (age - 1.3) / 1.4)), eo = 1 - (1 - open) ** 3;
    const wilt = Math.max(0, Math.min(1, (age - 16) / 14));
    let al = 1 - Math.max(0, Math.min(1, (age - 30) / 6)); if (p.dying) { p.a -= dt * .5; al *= Math.max(0, p.a); }
    if (al <= 0) return false;
    x.save(); x.globalAlpha = al; x.lineCap = 'round'; x.lineJoin = 'round';
    const stem = this.mix('#4f7a34', '#7a6440', wilt), total = p.lens[p.lens.length - 1] * eg;
    x.strokeStyle = stem; x.lineWidth = 2.8; x.beginPath(); x.moveTo(p.pts[0][0], p.pts[0][1]);
    let last = 0;
    for (let j = 1; j < p.pts.length && p.lens[j] <= total; j++) { x.lineTo(p.pts[j][0], p.pts[j][1]); last = j; }
    x.stroke();
    // leaves + tendrils along the grown part
    x.fillStyle = this.mix('#5f8f3e', '#8a7348', wilt);
    for (let j = 4; j <= last; j += 5) {
      const [a0, b0] = p.pts[j - 1], [a1, b1] = p.pts[j], ang = Math.atan2(b1 - b0, a1 - a0) + (j % 10 ? .9 : -.9) + wilt * .6;
      x.save(); x.translate(a1, b1); x.rotate(ang); x.beginPath(); x.ellipse(8, 0, 9, 3.6 * (1 - wilt * .4), 0, 0, 7); x.fill(); x.restore();
    }
    x.lineWidth = 1.2;
    for (const td of p.tendrils) if (td.at <= last && td.at > 0) {
      const [cx, cy] = p.pts[td.at]; x.beginPath();
      for (let k = 0; k <= 30; k++) { const u = k / 30, a = u * Math.PI * 3 * td.side, r = td.r * (1 - u); const X = cx + td.side * td.r + Math.cos(a + Math.PI) * r, Y = cy + Math.sin(a + Math.PI) * r; k ? x.lineTo(X, Y) : x.moveTo(X, Y); }
      x.stroke();
    }
    // the flower head
    if (eo > 0) {
      x.translate(p.x, p.y + wilt * 14); x.rotate(p.rot + wilt * .5);
      const R = p.R * eo, col = this.mix(p.c.length === 7 ? p.c : '#f2a7c9', '#7d5f45', wilt * .9), droop = 1 - wilt * .35;
      for (const ring of [[1, 0, 1], [.68, Math.PI / p.n, .85], [.42, 0, .7]]) {
        for (let i = 0; i < p.n; i++) {
          x.save(); x.rotate(i / p.n * Math.PI * 2 + ring[1] + Math.sin(this.t * .8 + i) * .02);
          const pr = R * ring[0];
          const g = x.createLinearGradient(0, 0, 0, -pr); g.addColorStop(0, this.shade(col.startsWith('#') ? col : '#c08aa0', -.3)); g.addColorStop(1, col);
          x.fillStyle = col; x.globalAlpha = al * ring[2] + (1 - ring[2]) * al * .3;
          x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(pr * .55, -pr * .3 * droop, pr * .45, -pr * droop, 0, -pr * droop); x.bezierCurveTo(-pr * .45, -pr * droop, -pr * .55, -pr * .3 * droop, 0, 0); x.fill();
          x.globalAlpha = al * .25; x.strokeStyle = 'rgba(80,30,50,.6)'; x.lineWidth = .8; x.stroke();
          x.restore();
        }
      }
      x.globalAlpha = al; x.fillStyle = this.mix('#e9b52f', '#6b4a2a', wilt); x.beginPath(); x.arc(0, 0, R * .16, 0, 7); x.fill();
      if (wilt > .2 && Math.random() < dt * .6) { const q = this.newPetal(false); q.x = p.x; q.y = p.y; q.c = this.mix(p.c, '#7d5f45', wilt); q.brown = true; this.ps.push(Object.assign({ kind: 'petal', a: 1, life: 0, once: true }, q)); }
    }
    x.restore();
  }
  shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.max(0, Math.min(255, Math.round(v + (amt < 0 ? v * amt : (255 - v) * amt))));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }
  petal(p, dt, x) {
    p.vx0 = (p.vx0 || 0) * Math.pow(.3, dt);
    p.vy += (p.vy < 40 ? 30 : 0) * dt;
    p.x += (this.wind * 45 + Math.sin(this.t * p.fl + p.ph) * 22 + p.vx0) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    if (p.y > this.H + 30 || p.x > this.W + 60 || p.x < -80) { if (p.once || p.dying) return false; Object.assign(p, this.newPetal(false)); }
    x.save(); x.globalAlpha = p.a * .9; x.translate(p.x, p.y); x.rotate(p.rot); x.scale(1, Math.cos(this.t * p.fl * 1.3 + p.ph) * .8 + .2);
    if (this.mood && this.mood.petal === 'floret' && !p.brown) { this.floret(x, 0, 0, p.s * .8, p.c); x.restore(); return; }
    x.fillStyle = p.c; x.beginPath(); x.moveTo(0, -p.s); x.bezierCurveTo(p.s * .9, -p.s * .5, p.s * .6, p.s * .8, 0, p.s); x.bezierCurveTo(-p.s * .6, p.s * .8, -p.s * .9, -p.s * .5, 0, -p.s); x.fill();
    x.globalAlpha *= .35; x.strokeStyle = '#000'; x.lineWidth = .5; x.beginPath(); x.moveTo(0, -p.s * .7); x.lineTo(0, p.s * .7); x.stroke();
    x.restore();
  }
  flower(p, dt, x) {
    const sway = Math.sin(this.t * 1.1 + p.ph) * .07 + Math.sin(this.t * 2.3 + p.ph) * .02 + this.wind * .12;
    const bx = p.bx, by = this.H + 6, L = p.L;
    const hx = bx + Math.sin(sway) * L * 1.1, hy = by - Math.cos(sway) * L;
    p.hx = hx; p.hy = hy;
    x.save(); x.globalAlpha = p.a;
    x.strokeStyle = '#5d7a3a'; x.lineWidth = 2.2; x.lineCap = 'round';
    x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + Math.sin(sway) * L * .2, by - L * .55, hx, hy); x.stroke();
    // leaf
    const lx = bx + Math.sin(sway) * L * .25, ly = by - L * .35;
    x.fillStyle = '#6f8f45'; x.beginPath(); x.ellipse(lx + 9 * (p.side ? -1 : 1), ly, 12, 4.5, (p.side ? 1 : -1) * (.6 + sway), 0, 7); x.fill();
    // head
    x.translate(hx, hy); x.rotate(sway * 1.6 + (p.side ? -.15 : .15));
    const s = p.sz, c = (this.mood.colors || ['#fff'])[0];
    if (this.mood.flower === 'ixora') {
      if (!p.fl) p.fl = Array.from({ length: 16 }, (_, j) => { const a = j * 2.4, r = Math.sqrt(j / 16) * s * 1.15; return { x: Math.cos(a) * r, y: Math.sin(a) * r * .8 - s * .2, c: this.col(), rot: Math.random() * 2 }; });
      x.fillStyle = '#2f5a24'; for (const sd of [-1, 1]) { x.beginPath(); x.ellipse(sd * s * .9, s * .55, s * .95, s * .32, sd * .45, 0, 7); x.fill(); }
      for (const f of p.fl) this.floret(x, f.x, f.y, s * .34, f.c, f.rot + Math.sin(this.t * 1.5 + f.rot) * .1);
      x.restore(); return;
    }
    for (let i = 0; i < p.petals; i++) {
      x.save(); x.rotate(i / p.petals * Math.PI * 2 + Math.sin(this.t * 2 + i) * .03);
      x.fillStyle = c; x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = .6;
      x.beginPath(); x.ellipse(0, -s * .62, s * .2, s * .55, 0, 0, 7); x.fill(); x.stroke(); x.restore();
    }
    x.fillStyle = '#e9b52f'; x.beginPath(); x.arc(0, 0, s * .26, 0, 7); x.fill();
    x.fillStyle = 'rgba(120,70,0,.4)'; x.beginPath(); x.arc(s * .05, s * .05, s * .14, 0, 7); x.fill();
    x.restore();
  }
  dust(p, dt, x) {
    p.x += (p.vx + this.wind * 10) * dt + Math.sin(this.t * .7 + p.ph) * 4 * dt; p.y += p.vy * dt;
    if (p.y < -10 || p.x < -20 || p.x > this.W + 20) { if (p.dying) return false; Object.assign(p, this.newDust(false)); p.x = this.rnd(0, this.W); }
    const tw = .45 + .55 * Math.sin(this.t * 1.5 + p.ph) ** 2;
    x.globalAlpha = p.a * tw * .75; const sp = this.glow(p.c, 16); const r = p.r * 3;
    x.drawImage(sp, p.x - r, p.y - r, r * 2, r * 2); x.globalAlpha = 1;
  }
  star(p, dt, x) {
    const tw = .3 + .7 * Math.abs(Math.sin(this.t * p.sp + p.ph));
    x.globalAlpha = p.a * tw; x.fillStyle = '#fff';
    x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill();
    if (p.r > 1.3) { x.globalAlpha *= .5; x.fillRect(p.x - p.r * 4, p.y - .3, p.r * 8, .6); x.fillRect(p.x - .3, p.y - p.r * 4, .6, p.r * 8); }
    x.globalAlpha = 1;
    if (!p.dying && Math.random() < dt * .0016) this.ps.push({ kind: 'shoot', x: this.rnd(0, this.W), y: this.rnd(0, this.H * .4), a: 1, life: 0, layer: 0, ang: this.rnd(.3, .7) });
  }
  shoot(p, dt, x) {
    const d = p.life * 900; if (p.life > .9) return false;
    const hx = p.x + Math.cos(p.ang) * d, hy = p.y + Math.sin(p.ang) * d;
    const g = x.createLinearGradient(hx, hy, hx - Math.cos(p.ang) * 140, hy - Math.sin(p.ang) * 140);
    g.addColorStop(0, `rgba(255,255,255,${.9 * (1 - p.life)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.strokeStyle = g; x.lineWidth = 1.4; x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx - Math.cos(p.ang) * 140, hy - Math.sin(p.ang) * 140); x.stroke();
  }
  rain(p, dt, x) {
    const ang = this.wind * .25;
    p.x += Math.sin(ang) * p.v * dt; p.y += Math.cos(ang) * p.v * dt;
    if (p.y > this.H) {
      if (p.layer === 1 && Math.random() < .3 && !p.dying) this.ps.push({ kind: 'splash', x: p.x, y: this.H - this.rnd(2, 60), a: 1, life: 0, layer: 1 });
      if (p.dying) return false; Object.assign(p, this.newRain(false));
    }
    x.globalAlpha = p.a * (p.layer ? .35 : .22); x.strokeStyle = '#dfe8f0'; x.lineWidth = p.layer ? 1.1 : .8;
    x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(p.x - Math.sin(ang) * p.l, p.y - Math.cos(ang) * p.l); x.stroke(); x.globalAlpha = 1;
  }
  splash(p, dt, x) {
    if (p.life > .45) return false;
    x.globalAlpha = .4 * (1 - p.life / .45); x.strokeStyle = '#e8f0f8'; x.lineWidth = .8;
    x.beginPath(); x.ellipse(p.x, p.y, 2 + p.life * 26, 1 + p.life * 6, 0, 0, 7); x.stroke(); x.globalAlpha = 1;
  }
  ember(p, dt, x) {
    p.y += p.vy * dt; p.x += (Math.sin(this.t * 2 + p.ph) * 18 + this.wind * 20) * dt;
    if (p.y < -10) { if (p.dying) return false; Object.assign(p, this.newEmber(false)); }
    const fl = .5 + .5 * Math.sin(this.t * 9 + p.ph * 3);
    x.globalAlpha = p.a * (.5 + .5 * fl); x.globalCompositeOperation = 'lighter';
    const r = p.r * 4; x.drawImage(this.glow(p.c, 16), p.x - r, p.y - r, r * 2, r * 2);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  }
  bubble(p, dt, x) {
    p.y += p.vy * dt; p.x += Math.sin(this.t * 1.6 + p.ph) * 14 * dt;
    if (p.y < -20 || (p.once && p.life > 6)) { if (p.dying || p.once) return false; Object.assign(p, this.newBubble(false)); }
    x.globalAlpha = p.a * .55; x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = .9;
    x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.12)'; x.fill();
    x.globalAlpha = p.a * .8; x.beginPath(); x.arc(p.x - p.r * .35, p.y - p.r * .35, p.r * .22, 0, 7); x.fillStyle = '#fff'; x.fill(); x.globalAlpha = 1;
  }
  spark(p, dt, x) {
    const lt = this.t - (p.born ?? (p.born = this.t)) + p.t0;
    if (lt < 0) return;
    const k = lt / p.T; if (k > 1) { if (p.dying || p.once) return false; Object.assign(p, this.newSpark(), { born: this.t }); return; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 30 * dt;
    const sc = Math.sin(k * Math.PI);
    x.save(); x.globalAlpha = p.a * sc; x.translate(p.x, p.y); x.rotate(p.rot + k); x.globalCompositeOperation = 'lighter';
    const s = p.s * sc; x.drawImage(this.glow(p.c, 16), -s * 1.6, -s * 1.6, s * 3.2, s * 3.2);
    x.fillStyle = p.c; x.beginPath();
    x.moveTo(0, -s * 1.6); x.quadraticCurveTo(0, 0, s * 1.6, 0); x.quadraticCurveTo(0, 0, 0, s * 1.6); x.quadraticCurveTo(0, 0, -s * 1.6, 0); x.quadraticCurveTo(0, 0, 0, -s * 1.6); x.fill();
    x.restore();
  }
  fog(p, dt, x) {
    p.x += (p.v + this.wind * 12) * dt; if (p.x - p.r > this.W) { if (p.dying) return false; p.x = -p.r; }
    x.globalAlpha = p.a * (p.layer ? .08 : .2); const c = (this.mood.colors || ['#ccc'])[0];
    x.drawImage(this.glow(c, 64), p.x - p.r, p.y - p.r * .55, p.r * 2, p.r * 1.1); x.globalAlpha = 1;
  }
  cloud(p, dt, x) {
    p.x += p.v * dt; if (p.x - p.r * 2 > this.W) { if (p.dying) return false; p.x = -p.r * 2; }
    x.globalAlpha = p.a * .5; const sp = this.glow('#ffffff', 64);
    for (let i = 0; i < 4; i++) { const ox = (i - 1.5) * p.r * .5, oy = Math.sin(i * 2.1) * p.r * .15, rr = p.r * (.6 + .15 * Math.cos(i)); x.drawImage(sp, p.x + ox - rr, p.y + oy - rr, rr * 2, rr * 2); }
    x.globalAlpha = 1;
  }
  ray(p, dt, x) {
    const pulse = .5 + .5 * Math.sin(this.t * .35 + p.ph);
    x.save(); x.globalAlpha = p.a * .12 * pulse; x.globalCompositeOperation = 'lighter';
    x.translate(-this.W * .05, -this.H * .1); x.rotate(p.ang + Math.sin(this.t * .05 + p.ph) * .03);
    const g = x.createLinearGradient(0, 0, Math.hypot(this.W, this.H), 0); g.addColorStop(0, this.mood.accent || '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, -p.w / 2, Math.hypot(this.W, this.H) * 1.2, p.w); x.restore();
  }
  scratch(p, dt, x) {
    x.globalAlpha = p.a * .35;
    for (let i = 0; i < 3; i++) if (Math.random() < .35) {
      const sx = Math.random() * this.W; x.strokeStyle = Math.random() < .5 ? 'rgba(0,0,0,.7)' : 'rgba(255,255,255,.5)'; x.lineWidth = Math.random() * 1.2 + .3;
      x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx + this.rnd(-6, 6), this.H); x.stroke();
    }
    if (Math.random() < .25) { x.fillStyle = 'rgba(0,0,0,.6)'; x.beginPath(); x.arc(Math.random() * this.W, Math.random() * this.H, Math.random() * 2.5 + .5, 0, 7); x.fill(); }
    x.globalAlpha = 1;
  }
  stain(p, dt, x) {
    const age = this.t - p.born, grow = Math.min(1, age / 2.4), e = 1 - Math.pow(1 - grow, 3);
    let al = 1; if (age > p.hold) al = Math.max(0, 1 - (age - p.hold) / 3);
    if (p.dying) p.a -= dt * .6; al *= Math.max(0, p.a);
    if (al <= 0) return false;
    x.save(); x.translate(p.x, p.y); x.rotate(p.rot);
    const R = p.r * e, N = p.pts.length;
    const path = (m) => { x.beginPath(); for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, rr = R * p.pts[i % N] * m; i ? x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); };
    x.fillStyle = p.c;
    x.globalAlpha = .22 * al; path(1); x.fill();
    x.globalAlpha = .18 * al; path(.78); x.fill();
    x.globalAlpha = .4 * al; x.strokeStyle = p.c; x.lineWidth = 1.6; path(1); x.stroke();
    x.globalAlpha = .45 * al;
    for (const d of p.dots) { const de = Math.min(1, Math.max(0, (age - .3) / 1)); x.beginPath(); x.arc(d.dx * p.r * de, d.dy * p.r * de, d.r * p.r, 0, 7); x.fill(); }
    x.restore();
  }
}
