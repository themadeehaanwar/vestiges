(() => {
  const $ = s => document.querySelector(s);
  const IMG = id => `img/${id}.webp`;

  /* ---------- torn paper edges ---------- */
  function tear(el, depth = 1.6) {
    const pts = [], step = () => 2 + Math.random() * 3, j = () => Math.random() * depth;
    for (let x = 0; x <= 100; x += step()) pts.push(`${Math.min(100, x)}% ${j()}%`);
    for (let y = 0; y <= 100; y += step()) pts.push(`${100 - j()}% ${Math.min(100, y)}%`);
    for (let x = 100; x >= 0; x -= step()) pts.push(`${Math.max(0, x)}% ${100 - j()}%`);
    for (let y = 100; y >= 0; y -= step()) pts.push(`${j()}% ${Math.max(0, y)}%`);
    el.style.clipPath = `polygon(${pts.join(',')})`;
  }

  /* ---------- flatten poems into pages ---------- */
  const pages = [];
  POEMS.forEach((p, pi) => p.slides.forEach((s, si) => pages.push({ type: 'slide', pi, si, src: IMG(s) })));
  pages.push({ type: 'end' });
  const END_MOOD = { bg: '#120c09', accent: '#e8c27a', fx: ['embers', 'butterflies', 'dust'], colors: ['#e8c27a', '#ff9a4a', '#fff1d0'], grunge: .2, sound: 'fire' };
  const firstPageOf = pi => pages.findIndex(p => p.pi === pi);

  const stage = $('#stage'), book = $('#book'), scene = $('#scene');
  const fx = new FX($('#fxBack'), $('#fxFront'));
  fx.rect = () => book.getBoundingClientRect();
  let idx = 0, leaf = null, anim = null, poemShown = -2, bgFlip = false, turnedOnce = false;

  /* ---------- INTRO ---------- */
  (function intro() {
    const introFx = new FX(null, $('#introFx'));
    introFx.setMood({ fx: ['embers', 'dust', 'butterflies'], colors: ['#e8c27a', '#ffb070', '#f3e7cf'], accent: '#e8c27a' });
    const col = $('#collage'), picks = ['kiwi-1', 'enormity-1', 'pastelpink-1', 'constellations-1', 'soulcrush-1', 'pebbles-1', 'flowers-1', 'sugar-1', 'wraith-1', 'ixora-1', 'shutter-1', 'lovedeluge-1'];
    const spots = [[2, 4], [20, 0], [70, 2], [86, 10], [0, 40], [88, 44], [4, 72], [22, 80], [66, 78], [84, 74], [40, -4], [44, 86]];
    picks.forEach((id, i) => {
      const d = document.createElement('div'); d.className = 'polaroid';
      d.style.left = spots[i][0] + '%'; d.style.top = spots[i][1] + '%';
      d.style.setProperty('--r', (Math.random() * 24 - 12) + 'deg');
      d.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px'); d.style.setProperty('--dy', (Math.random() * 60 - 30) + 'px');
      d.style.animationDelay = `${-Math.random() * 20}s, ${i * .15}s`;
      d.innerHTML = `<img src="${IMG(id)}" alt="">`; col.appendChild(d);
    });
    tear($('#introCard'), 1.2);
    const nm = $('#introName'); nm.innerHTML = [...SITE.name].map((c, i) => `<span class="ch" style="animation-delay:${.5 + i * .09}s">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    const tag = $('#introTag'); let k = 0;
    setTimeout(function type() { tag.textContent = SITE.tagline.slice(0, ++k); if (k < SITE.tagline.length) setTimeout(type, 35 + Math.random() * 50); }, 1900);
    addEventListener('pointerdown', e => { const it = $('#intro'); if (it && !it.classList.contains('gone')) introFx.burst(e.clientX, e.clientY); });
    document.querySelectorAll('[data-enter]').forEach(b => b.addEventListener('click', () => {
      setSound(b.dataset.enter === 'sound');
      $('#intro').classList.add('gone');
      setTimeout(() => $('#intro').remove(), 1300);
      Sound.pageTurn();
    }));
  })();

  /* ---------- building leaves ---------- */
  function makeLeaf(i) {
    const pg = pages[i], el = document.createElement('div'); el.className = 'leaf';
    let front;
    if (pg.type === 'slide') {
      const p = POEMS[pg.pi];
      front = `<div class="face front"><img src="${pg.src}" alt="${p.title} — moodboard ${pg.si + 1}" draggable="false"><div class="sheen"></div>${i === 0 && !turnedOnce ? '<div class="curl"></div>' : ''}<div class="cast"></div><div class="shade"></div></div>`;
    } else {
      front = `<div class="face front endpage">
        <div class="ty">thank you<br>for reading</div>
        <p class="blurb">for wandering through everything that was too much to keep inside.</p>
        <div class="sig2">Madeeha A.</div>
        <div class="contact"><a href="tel:+91${SITE.phone}">${SITE.phone}</a><a href="mailto:${SITE.email}">${SITE.email}</a></div>
        <button class="again" data-restart>↺ start again</button>
        <div class="cast"></div><div class="shade"></div></div>`;
    }
    el.innerHTML = front + '<div class="face back"></div>';
    const r = el.querySelector('[data-restart]'); if (r) r.addEventListener('click', e => { e.stopPropagation(); goTo(0); });
    return el;
  }
  const STRIPS = 22;
  function makeCurlLeaf(i) { // the page as thin strips, so it can bend like paper
    const pg = pages[i]; if (pg.type !== 'slide') return makeLeaf(i);
    const el = document.createElement('div'); el.className = 'leaf curly';
    const W = book.offsetWidth, H = book.offsetHeight, w = W / STRIPS; let parent = el; el.strips = [];
    for (let k = 0; k < STRIPS; k++) {
      const st = document.createElement('div'); st.className = 'strip';
      st.style.width = w + 'px'; st.style.left = k ? w + 'px' : '0px';
      st.innerHTML = `<div class="sf" style="background-image:url(${pg.src});background-size:${W}px ${H}px;background-position:${-k * w}px 0"><i></i></div><div class="sb"><i></i></div>`;
      parent.appendChild(st); parent = st; el.strips.push(st);
    }
    return el;
  }
  function setAngle(a) {
    const { top, under } = anim;
    if (top.strips) {
      const curl = Math.sin(a * Math.PI / 180) * 42 * (anim.dir > 0 ? 1 : -1), N = top.strips.length; let prev = 0;
      top.strips.forEach((st, k) => {
        const th = a + curl * Math.pow(k / (N - 1), 2.2);
        st.style.transform = `rotateY(${-(th - prev)}deg)`; prev = th;
        st.style.setProperty('--l', ((1 - Math.abs(Math.cos(th * Math.PI / 180))) * .5).toFixed(3));
      });
    } else top.style.transform = `rotateY(${-a}deg)`;
    top.style.setProperty('--shade', (Math.sin(a * Math.PI / 180) * .9).toFixed(3));
    under.style.setProperty('--cast', ((1 - a / 180) * .9 * (a > 0 ? 1 : 0)).toFixed(3));
  }

  /* ---------- turning ---------- */
  function begin(target) {
    if (anim || target === idx) return false;
    if (target < 0 || target >= pages.length) { book.classList.remove('bump'); void book.offsetWidth; book.classList.add('bump'); return false; }
    const dir = target > idx ? 1 : -1;
    if (dir > 0) { const cur = makeCurlLeaf(idx), nl = makeLeaf(target); book.replaceChild(cur, leaf); book.insertBefore(nl, cur); leaf = cur; anim = { dir, target, top: cur, under: nl, a: 0, from: 0, to: 180 }; }
    else { const nl = makeCurlLeaf(target); book.appendChild(nl); anim = { dir, target, top: nl, under: leaf, a: 180, from: 180, to: 0 }; }
    anim.top.style.zIndex = 2; anim.under.style.zIndex = 1;
    setAngle(anim.a);
    return true;
  }
  function settle(commit) {
    const A = anim, end = commit ? A.to : A.from, start = A.a, t0 = performance.now(), dur = 750 * Math.abs(end - start) / 180 + 150;
    if (commit) { Sound.pageTurn(); if (pages[A.target].pi !== pages[idx].pi) applyPage(A.target); }
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      A.a = start + (end - start) * e; setAngle(A.a);
      if (k < 1) return requestAnimationFrame(tick);
      let keep = commit ? (A.dir > 0 ? A.under : A.top) : (A.dir > 0 ? A.top : A.under);
      [A.top, A.under].forEach(l => { if (l !== keep) l.remove(); });
      if (keep.strips) { const flat = makeLeaf(commit ? A.target : idx); book.replaceChild(flat, keep); keep = flat; }
      keep.style.transform = ''; keep.style.zIndex = 1; keep.style.setProperty('--cast', 0); keep.style.setProperty('--shade', 0);
      leaf = keep; anim = null;
      if (commit) { idx = A.target; applyPage(idx); preload(); if (!turnedOnce) { turnedOnce = true; $('#turnHint').classList.add('hide'); } }
    };
    requestAnimationFrame(tick);
  }
  function goTo(target) { if (begin(target)) settle(true); }
  const next = () => goTo(idx + 1), prev = () => goTo(idx - 1);

  /* ---------- drag / swipe ---------- */
  let drag = null;
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('button, a, .note, .thread')) return;
    drag = { x: e.clientX, y: e.clientY, started: false, id: e.pointerId };
  });
  addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!drag.started) {
      if (Math.abs(dx) < 10) return;
      if (!begin(idx + (dx < 0 ? 1 : -1))) { drag = null; return; }
      drag.started = true;
    }
    const W = book.getBoundingClientRect().width;
    const p = Math.max(0, Math.min(1, Math.abs(dx) / (W * 1.1)));
    anim.a = anim.dir > 0 ? p * 180 : 180 - p * 180; setAngle(anim.a);
  });
  addEventListener('pointerup', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (!d.started) { // a tap → magic
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 10) { fx.burst(e.clientX, e.clientY); const f = fx.mood.fx || []; Sound.touch(f.includes('stains') ? 'ink' : f.includes('blooms') ? 'bloom' : 'pluck'); }
      return;
    }
    const prog = anim.dir > 0 ? anim.a / 180 : 1 - anim.a / 180;
    settle(prog > .22);
  });
  addEventListener('pointercancel', () => { if (drag && drag.started && anim) settle(false); drag = null; });
  addEventListener('keydown', e => {
    if (e.key === 'Escape') return closeNote();
    if ($('#note').classList.contains('open')) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
  });
  let wheelLock = 0;
  addEventListener('wheel', e => {
    const it = $('#intro'); if ($('#note').classList.contains('open') || (it && !it.classList.contains('gone'))) return;
    const now = Date.now(); if (now < wheelLock) return;
    const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(d) < 25) return; wheelLock = now + 900; d > 0 ? next() : prev();
  }, { passive: true });
  $('#nextBtn').onclick = next; $('#prevBtn').onclick = prev;

  /* ---------- tilt with pointer ---------- */
  addEventListener('pointermove', e => {
    if (drag && drag.started) return;
    const rx = (e.clientY / innerHeight - .5) * -5, ry = (e.clientX / innerWidth - .5) * 7;
    book.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  });

  /* ---------- mood / page state ---------- */
  function applyPage(i) {
    const pg = pages[i], isEnd = pg.type === 'end';
    const pi = isEnd ? -1 : pg.pi, poem = isEnd ? null : POEMS[pi];
    // dots
    const dots = $('#dots');
    if (poem && poem.slides.length > 1) dots.innerHTML = poem.slides.map((_, k) => `<i class="${k === pg.si ? 'on' : ''}"></i>`).join(''); else dots.innerHTML = '';
    // background image always follows the page
    const src = isEnd ? IMG(POEMS[POEMS.length - 1].slides[0]) : pg.src;
    const a = $(bgFlip ? '#bgA' : '#bgB'), b = $(bgFlip ? '#bgB' : '#bgA');
    if (a.dataset.src !== src) { a.style.backgroundImage = `url(${src})`; a.dataset.src = src; a.classList.add('on'); b.classList.remove('on'); bgFlip = !bgFlip; }
    a.style.opacity = isEnd ? .25 : '';
    if (pi === poemShown) return;
    poemShown = pi;
    const m = isEnd ? END_MOOD : poem.mood;
    stage.style.setProperty('--bg', m.bg); stage.style.setProperty('--accent', m.accent);
    stage.style.setProperty('--grunge', m.grunge || 0);
    stage.classList.toggle('dark', (m.grunge || 0) >= .6);
    stage.classList.toggle('drowsy', !!m.drowsy);
    document.querySelector('meta[name=theme-color]').content = m.bg;
    fx.setMood(m); Sound.setAmbient(m.sound);
    // title tag
    const tt = $('#titleTag'); tt.classList.add('swap');
    setTimeout(() => {
      $('#poemTitle').textContent = isEnd ? 'the end' : poem.title;
      tear(tt, 8); tt.classList.remove('swap');
    }, 280);
    $('#poemNum').textContent = isEnd ? '' : `${String(pi + 1).padStart(2, '0')} / ${String(POEMS.length).padStart(2, '0')}`;
    $('#poemDate').textContent = isEnd ? '' : poem.date || '';
    $('#noteBtn').classList.toggle('hide', !(poem && poem.note));
    document.querySelectorAll('.knot').forEach((k, n) => k.classList.toggle('on', n === (isEnd ? POEMS.length : pi)));
  }
  function preload() { [idx + 1, idx + 2, idx - 1].forEach(i => { const p = pages[i]; if (p && p.src) { const im = new Image(); im.src = p.src; } }); }

  // grunge glitches
  setInterval(() => {
    const g = parseFloat(stage.style.getPropertyValue('--grunge')) || 0;
    if (g >= .6 && !anim && Math.random() < g * .6) { book.classList.remove('glitch'); void book.offsetWidth; book.classList.add('glitch'); setTimeout(() => book.classList.remove('glitch'), 260); }
  }, 3800);

  /* ---------- thread timeline ---------- */
  const thread = $('#thread');
  [...POEMS.map(p => p.title), 'the end'].forEach((t, n) => {
    const k = document.createElement('button'); k.className = 'knot'; k.setAttribute('aria-label', t);
    k.innerHTML = `<span class="lbl">${t}</span>`;
    k.onclick = () => goTo(n === POEMS.length ? pages.length - 1 : firstPageOf(n));
    thread.appendChild(k);
  });

  /* ---------- note ---------- */
  function openNote() {
    const poem = POEMS[pages[idx].pi]; if (!poem || !poem.note) return;
    $('#noteTitle').textContent = `on “${poem.title}”`;
    $('#noteBody').innerHTML = poem.note.split(/\n\s*\n/).map(p => `<p>${p}</p>`).join('');
    tear(document.querySelector('.notepaper'), 1);
    $('#note').classList.add('open'); $('#note').setAttribute('aria-hidden', 'false'); Sound.pageTurn();
  }
  function closeNote() { $('#note').classList.remove('open'); $('#note').setAttribute('aria-hidden', 'true'); }
  $('#noteBtn').onclick = openNote; $('#noteClose').onclick = closeNote;
  $('#note').addEventListener('click', e => { if (e.target.id === 'note') closeNote(); });

  /* ---------- sound ---------- */
  function setSound(v) { Sound.setOn(v); const b = $('#soundBtn'); b.classList.toggle('on', v); b.classList.toggle('off', !v); }
  $('#soundBtn').onclick = () => setSound(!Sound.isOn());

  /* ---------- go ---------- */
  tear($('#noteBtn'), 6);
  leaf = makeLeaf(0); book.appendChild(leaf);
  applyPage(0); preload();
  setTimeout(() => !turnedOnce && $('#turnHint').classList.add('hide'), 9000);
})();
