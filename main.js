/* ==========================================================================
   Anshik Jain — portfolio interactions
   GSAP + ScrollTrigger (motion), Lenis (smooth scroll), Matter.js (footer physics)
   ========================================================================== */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const map = (v, a, b) => clamp01((v - a) / (b - a));
  const rand = (a, b) => a + Math.random() * (b - a);

  const KEEP = []; // hold observer references so they are never garbage-collected
  const observe = (el, cb, opts) => { const o = new IntersectionObserver(cb, opts); o.observe(el); KEEP.push(o); return o; };
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isMobile = () => innerWidth <= 900;

  gsap.registerPlugin(ScrollTrigger);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!REDUCED && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else document.querySelector(target)?.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2 || !$(id)) return;
    e.preventDefault();
    scrollToTarget(id === '#top' ? 0 : id);
  }));

  /* ---------- char-roll links ---------- */
  $$('[data-roll]').forEach((a) => {
    const text = a.textContent.trim();
    if (!a.getAttribute('aria-label')) a.setAttribute('aria-label', text);
    const roll = document.createElement('span');
    roll.className = 'roll';
    roll.setAttribute('aria-hidden', 'true');
    [...text].forEach((c, i) => {
      const s = document.createElement('span');
      s.textContent = c; s.dataset.c = c; s.style.transitionDelay = `${i * 12}ms`;
      roll.appendChild(s);
    });
    a.textContent = '';
    a.appendChild(roll);
  });

  /* ---------- clock ---------- */
  const clockEls = $$('[data-clock]');
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const tick = () => clockEls.forEach((el) => (el.textContent = `${fmt.format(new Date())} IST`));
  tick(); setInterval(tick, 20000);

  /* ---------- word splitting ---------- */
  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = part;
            w.appendChild(wi); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return $$('.wi', el);
  }
  const splits = new Map();
  $$('[data-split]').forEach((el) => splits.set(el, splitWords(el)));

  /* ---------- art injection ---------- */
  const ORDER = ['podtube', 'parking', 'xinterview', 'next'];
  const track = $('.preview__track');
  ORDER.forEach((k) => {
    const d = document.createElement('div');
    d.className = 'preview__slide';
    d.innerHTML = ART.covers[k];
    track.appendChild(d);
  });
  $$('.work__row').forEach((row) => ($('.work__thumb', row).innerHTML = ART.covers[row.dataset.project]));

  /* ======================================================================
     HERO NAME — fit, intro ("the common n"), hover, fall
     ====================================================================== */
  const hero = $('.hero');
  const nameEl = $('.name');
  const chs = $$('.ch', nameEl);
  const ns = $$('.ch--n', nameEl);
  const plain = chs.filter((c) => !c.classList.contains('ch--n'));
  const glyph = (c) => c.firstElementChild;
  let introDone = false;

  function fitName() {
    const words = $$('.name__word', nameEl);
    const gap = $('.name__gap', nameEl);
    nameEl.style.fontSize = '100px';
    const w = isMobile()
      ? Math.max(...words.map((x) => x.getBoundingClientRect().width))
      : words.reduce((s, x) => s + x.getBoundingClientRect().width, 0) + gap.getBoundingClientRect().width;
    const pad = parseFloat(getComputedStyle(hero).paddingLeft) || 16;
    const avail = innerWidth - pad * 2;
    let fs = (100 * avail) / w * 0.995;
    if (!isMobile()) fs = Math.min(fs, innerHeight * 0.5);
    nameEl.style.fontSize = `${fs}px`;
    hero.style.setProperty('--name-h', `${nameEl.offsetHeight}px`);
  }

  function hoverLetters() {
    chs.forEach((ch) => ch.addEventListener('mouseenter', () => {
      if (!introDone || scrollY > 40) return;
      const g = glyph(ch);
      if (gsap.isTweening(g)) return;
      gsap.timeline()
        .to(g, { yPercent: -16, rotation: rand(-10, 10), duration: 0.2, ease: 'power2.out' })
        .to(g, { yPercent: 0, rotation: 0, duration: 0.9, ease: 'elastic.out(1, .32)' });
    }));
  }

  function buildFall() {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: hero, start: 'top top', end: () => `+=${innerHeight * 0.85}`, scrub: 0.9, invalidateOnRefresh: true },
    });
    chs.forEach((ch) => {
      const late = ch.classList.contains('ch--n');
      const d = late ? rand(0.32, 0.4) : rand(0, 0.24); // the n's hang on a beat longer — they arrived late, they leave late
      const dx = rand(-0.1, 0.1);
      tl.to(ch, {
        y: () => innerHeight * rand(1.05, 1.4),
        x: () => innerWidth * dx,
        rotation: rand(-140, 140),
        ease: 'power2.in',
        duration: 1 - d,
      }, d);
    });
    tl.to('.hero__top', { y: -120, opacity: 0, ease: 'none', duration: 0.8 }, 0);
    tl.to('.hero__scroll', { opacity: 0, duration: 0.15 }, 0);
  }

  function revealPage(tl, at) {
    const lede = splits.get($('.hero__lede'));
    tl.to('.gridlines i', { scaleY: 1, duration: 1.4, stagger: 0.07, ease: 'expo.inOut' }, at)
      .from('.nav > *', { yPercent: -120, opacity: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, at + 0.2)
      .from(lede, { yPercent: 115, duration: 1.1, stagger: 0.018, ease: 'expo.out' }, at + 0.25)
      .from('.hero__facts li', { y: 16, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'expo.out' }, at + 0.4)
      .to('.hero__scroll', { opacity: 1, duration: 0.6 }, at + 0.8)
      .to('.loader-count', { opacity: 0, duration: 0.4 }, at)
      .to('.hero__note', { opacity: 0, y: -10, duration: 0.5 }, at + 1.4);
  }

  function intro() {
    const note = $('.hero__note');
    const count = $('.loader-count span');
    const widths = ns.map((n) => n.getBoundingClientRect().width);
    const fs = parseFloat(nameEl.style.fontSize);

    gsap.set(ns, { width: 0 });
    gsap.set(ns.map(glyph), { y: () => -innerHeight * 1.1 - fs });
    gsap.set(plain.map(glyph), { yPercent: 110, opacity: 0, rotation: () => rand(-12, 12) });
    gsap.set('.hero__note', { opacity: 0, y: 12 });
    nameEl.style.visibility = 'visible';

    const bump = (els, amt) => {
      const t = gsap.timeline();
      t.to(els.map(glyph), { y: -fs * amt, duration: 0.12, ease: 'power2.out', stagger: 0.03 })
        .to(els.map(glyph), { y: 0, duration: 0.5, ease: 'bounce.out', stagger: 0.03 });
      return t;
    };
    const squash = (g, s = 1, origin = '50% 100%') => gsap.timeline()
      .to(g, { scaleY: 1 - 0.3 * s, scaleX: 1 + 0.18 * s, duration: 0.08, ease: 'power1.out', transformOrigin: origin })
      .to(g, { scaleY: 1, scaleX: 1, duration: 0.7, ease: 'elastic.out(1, .32)' });

    const [n1, n2] = ns; const [g1, g2] = ns.map(glyph);
    const tl = gsap.timeline({ delay: 0.15 });
    const O = '50% 58%'; // rotation origin = centre of the n's x-height

    // 1. "ashik jai" — everyone except the n's shows up (0 → 1.0s)
    tl.to('.loader-count', { opacity: 1, duration: 0.3 }, 0)
      .to(plain.map(glyph), { yPercent: 0, opacity: 1, rotation: 0, duration: 0.7, stagger: 0.04, ease: 'back.out(1.7)' }, 0.05)
      // 2. a pencil note notices
      .to(note, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' }, 0.75)
      // 3. first n drops into "anshik"
      .to(n1, { width: widths[0], duration: 0.38, ease: 'expo.inOut' }, 1.1)
      .to(g1, { y: 0, duration: 0.42, ease: 'power3.in' }, 1.15)
      .add(squash(g1), 1.57)
      .add(bump([plain[0], plain[1]], 0.07), 1.57)
      .call(() => (note.textContent = 'there’s one…'), null, 1.65)
      // 4. second n is late — and arrives upside down ("jaiu")
      .set(g2, { rotation: 180, transformOrigin: O }, 2.0)
      .to(n2, { width: widths[1], duration: 0.38, ease: 'expo.inOut' }, 2.05)
      .to(g2, { y: 0, duration: 0.45, ease: 'power3.in' }, 2.1)
      .add(squash(g2, 0.8, O), 2.55)
      .add(bump(plain.slice(-3), 0.06), 2.55)
      .call(() => (note.textContent = 'uh… wrong way up'), null, 2.65)
      // 5. it notices, hops, flips itself the right way round
      .to(g2, { keyframes: [
        { y: -fs * 0.32, rotation: 270, duration: 0.26, ease: 'power2.out' },
        { y: 0, rotation: 360, duration: 0.28, ease: 'power2.in' },
      ], transformOrigin: O }, 3.05)
      .add(squash(g2, 0.6, O), 3.59)
      .call(() => (note.textContent = 'fashionably late ✓'), null, 3.62)
      // once both n's are home, they settle into the same ink as the rest of the name
      .call(() => ns.forEach((n) => n.classList.add('is-settled')), null, 4.1);

    const total = 3.65;
    const counter = { v: 0 };
    tl.to(counter, { v: 100, duration: total - 0.2, ease: 'power1.inOut', onUpdate: () => (count.textContent = String(Math.round(counter.v)).padStart(3, '0')) }, 0);

    revealPage(tl, total);
    tl.call(finishIntro, null, total + 0.45);

    // impatient? click / key to fast-forward
    const ff = () => tl.timeScale(3.2);
    addEventListener('pointerdown', ff, { once: true });
    addEventListener('keydown', ff, { once: true });
    addEventListener('wheel', ff, { once: true, passive: true });
    addEventListener('touchstart', ff, { once: true, passive: true });
  }

  function finishIntro() {
    if (introDone) return;
    introDone = true;
    gsap.set(ns, { clearProps: 'width' });
    gsap.set(chs.map(glyph), { clearProps: 'transform' });
    document.body.classList.remove('is-loading');
    lenis?.start();
    hoverLetters();
    initNavHide();
    const hint = $('.hero__hint');
    if (FINE && !REDUCED) { hint.classList.add('is-on'); hero.addEventListener('pointermove', () => setTimeout(() => hint.classList.remove('is-on'), 1400), { once: true }); }
    if (!REDUCED) buildFall();
    ScrollTrigger.refresh();
  }

  function initNavHide() {
    const nav = $('.nav');
    let lastY = scrollY;
    const onScroll = () => {
      const y = scrollY;
      if (Math.abs(y - lastY) < 6) return;
      nav.classList.toggle('is-hidden', y > lastY && y > innerHeight * 0.6);
      lastY = y;
    };
    if (lenis) lenis.on('scroll', onScroll); else addEventListener('scroll', onScroll, { passive: true });
  }

  function skipIntro() {
    ns.forEach((n) => n.classList.add('is-settled'));
    nameEl.style.visibility = 'visible';
    $('.hero__note').style.display = 'none';
    $('.loader-count').style.display = 'none';
    gsap.set('.gridlines i', { scaleY: 1 });
    gsap.set('.hero__scroll', { opacity: 1 });
    finishIntro();
  }

  /* ======================================================================
     TRAIL — images spill out behind the name as you move
     ====================================================================== */
  function initTrail() {
    if (!FINE || REDUCED) return;
    const layer = $('.trail');
    const pool = Array.from({ length: 10 }, () => {
      const d = document.createElement('div');
      d.className = 'trail__item';
      layer.appendChild(d);
      return d;
    });
    let i = 0, art = 0, z = 1, last = null;
    hero.addEventListener('pointermove', (e) => {
      if (!introDone || scrollY > innerHeight * 0.45) return;
      const p = { x: e.clientX, y: e.clientY };
      if (!last) { last = p; return; }
      const dx = p.x - last.x, dy = p.y - last.y;
      if (Math.hypot(dx, dy) < 120) return;
      last = p;
      const el = pool[i++ % pool.length];
      el.innerHTML = ART.trail[art++ % ART.trail.length];
      el.style.zIndex = ++z;
      gsap.killTweensOf(el);
      gsap.set(el, { x: p.x, y: p.y, xPercent: -50, yPercent: -50, scale: 0.35, opacity: 1, rotation: rand(-10, 10) });
      gsap.to(el, { x: p.x + dx * 0.35, y: p.y + dy * 0.35, scale: 1, duration: 0.7, ease: 'expo.out' });
      gsap.to(el, { scale: 0.15, opacity: 0, duration: 0.55, delay: 0.6, ease: 'power3.in' });
    });
  }

  /* ======================================================================
     01 — PENCIL SKETCH  →  COMPONENT  →  REAL UI
     ====================================================================== */
  function initSketch() {
    const NS = 'http://www.w3.org/2000/svg';
    const gLines = $('.sk-lines'), gNotes = $('.sk-notes');
    let seed = 11;
    const r = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const jit = (a) => (r() - 0.5) * 2 * a;
    const f = (n) => n.toFixed(1);

    const items = []; const notes = [];
    const push = (d, w = 1.6, o = 0.9) => items.push({ d, w, o });

    function line(x1, y1, x2, y2, w, o) {
      const len = Math.hypot(x2 - x1, y2 - y1) || 1;
      const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      const s = rand(0.5, 3), e = rand(1, 5);
      const ax = x1 - ux * s + jit(0.8), ay = y1 - uy * s + jit(0.8);
      const bx = x2 + ux * e + jit(0.8), by = y2 + uy * e + jit(0.8);
      const bow = jit(len * 0.018);
      const cx = (ax + bx) / 2 - uy * bow, cy = (ay + by) / 2 + ux * bow;
      push(`M${f(ax)} ${f(ay)} Q${f(cx)} ${f(cy)} ${f(bx)} ${f(by)}`, w, o);
    }
    function rect(x1, y1, x2, y2, w, o) { line(x1, y1, x2, y1, w, o); line(x2, y1, x2, y2, w, o); line(x2, y2, x1, y2, w, o); line(x1, y2, x1, y1, w, o); }
    function circle(cx, cy, rad, w, o) {
      const a0 = r() * Math.PI * 2, pts = [], N = 26;
      for (let k = 0; k <= N; k++) {
        const a = a0 + (k / N) * Math.PI * 2.12;
        const rr = rad * (1 + jit(0.05));
        pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
      }
      let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
      for (let k = 1; k < pts.length - 1; k++) {
        const mx = (pts[k][0] + pts[k + 1][0]) / 2, my = (pts[k][1] + pts[k + 1][1]) / 2;
        d += ` Q${f(pts[k][0])} ${f(pts[k][1])} ${f(mx)} ${f(my)}`;
      }
      push(d, w, o);
    }
    function hatch(x1, y1, x2, y2, gap) {
      let d = '', flip = false;
      for (let c = x1 + y1 + gap; c < x2 + y2; c += gap) {
        const xa = Math.max(x1, c - y2), xb = Math.min(x2, c - y1);
        if (xb <= xa) continue;
        const A = [xa + jit(1.5), c - xa + jit(1.5)], B = [xb + jit(1.5), c - xb + jit(1.5)];
        const [p, q] = flip ? [B, A] : [A, B];
        d += `${d ? ' L' : 'M'}${f(p[0])} ${f(p[1])} L${f(q[0])} ${f(q[1])}`;
        flip = !flip;
      }
      push(d, 1, 0.45);
    }
    function polyline(pts, w, o) {
      for (let k = 0; k < pts.length - 1; k++) line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], w, o);
    }
    const note = (text, x, y, rot, arrow) => notes.push({ text, x, y, rot, arrow, at: items.length });

    // — the wireframe (local coords: 560 × 390 browser window) —
    note('v0.1 — don’t judge', 418, 36, -3);
    rect(0, 0, 560, 390, 2.2, 0.95);
    line(0, 40, 560, 40, 1.6);
    circle(22, 20, 6, 1.4); circle(42, 20, 6, 1.4); circle(62, 20, 6, 1.4);
    rect(100, 11, 380, 29, 1.3, 0.7);
    line(30, 80, 290, 80, 4.5, 0.95); line(30, 84, 286, 83, 2, 0.6);
    line(30, 108, 240, 108, 4.5, 0.95); line(30, 112, 236, 111, 2, 0.6);
    note('← loud!', 312, 168, -4);
    line(30, 140, 280, 140, 1.4, 0.6); line(30, 154, 262, 154, 1.4, 0.6); line(30, 168, 230, 168, 1.4, 0.6);
    rect(30, 192, 150, 228, 2);
    hatch(30, 192, 150, 228, 7);
    note('click me!!', 214, 304, -6, 'M214 290 Q 206 276 212 268');
    rect(320, 64, 530, 260, 1.8);
    polyline([[336, 242], [392, 168], [426, 210], [462, 158], [516, 242]], 1.6);
    circle(486, 104, 14, 1.5);
    [[30, 190], [200, 360], [370, 530]].forEach(([a, b], k) => {
      rect(a, 280, b, 365, 1.6);
      circle(a + 20, 302, 8, 1.3);
      line(a + 14, 330, b - 34, 330, 1.3, 0.6);
      line(a + 14, 345, b - 60, 345, 1.3, 0.6);
      if (k === 1) hatch(a, 280, b, 365, 9);
    });
    polyline([[140, 222], [140, 252], [148, 245], [155, 259], [161, 256], [154, 242], [164, 242], [140, 222]], 1.6, 0.95);
    note('ship it →', 452, 484, -3);

    // render paths
    const paths = items.map((it) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', it.d);
      p.setAttribute('stroke-width', it.w);
      p.setAttribute('opacity', it.o);
      gLines.appendChild(p);
      return p;
    });
    const lens = paths.map((p) => p.getTotalLength());
    const cum = []; lens.reduce((s, l, k) => ((cum[k] = s), s + l), 0);
    const total = lens.reduce((a, b) => a + b, 0);
    paths.forEach((p, k) => { p.style.strokeDasharray = `${lens[k]} ${lens[k]}`; p.style.strokeDashoffset = lens[k]; p.style.visibility = 'hidden'; });

    const noteEls = notes.map((n) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', `rotate(${n.rot} ${n.x} ${n.y})`);
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', n.x); t.setAttribute('y', n.y); t.textContent = n.text;
      g.appendChild(t);
      if (n.arrow) {
        const a = document.createElementNS(NS, 'path');
        a.setAttribute('d', n.arrow + ' M206 272 L212 268 L215 275');
        g.appendChild(a);
      }
      g.style.opacity = 0;
      g.style.transition = 'opacity .5s';
      gNotes.appendChild(g);
      return g;
    });

    // waveform bars in the "real" UI
    const wave = $('.real__wave');
    for (let k = 0; k < 18; k++) {
      const b = document.createElement('i');
      b.style.animationDelay = `${-rand(0, 1)}s`;
      b.style.animationDuration = `${rand(0.6, 1.2)}s`;
      wave.appendChild(b);
    }

    const stage = $('.sketch__stage');
    const svgEl = $('.sketch__svg');
    const pencil = $('.sketch__pencil');
    const code = $('.sketch__code');
    const real = $('.sketch__real');
    const steps = $$('.sketch__steps li');
    const title = $('.sketch__title');
    const last = new Array(paths.length).fill(-1);
    let stageW = stage.clientWidth;
    new ResizeObserver(() => { stageW = stage.clientWidth; }).observe(stage);

    function render(p) {
      // a. pencil draws
      const drawP = map(p, 0.02, 0.56);
      const cur = drawP * total;
      let active = 0;
      for (let k = 0; k < paths.length; k++) {
        const v = Math.min(lens[k], Math.max(0, cur - cum[k]));
        if (cur >= cum[k]) active = k;
        const off = Math.round((lens[k] - v) * 10) / 10;
        if (off !== last[k]) { paths[k].style.strokeDashoffset = off; paths[k].style.visibility = v > 0.5 ? 'visible' : 'hidden'; last[k] = off; }
      }
      notes.forEach((n, k) => (noteEls[k].style.opacity = cur >= (cum[n.at] ?? total) ? 1 : 0));

      // pencil follows the tip
      const scale = stageW / 680;
      const lp = Math.min(lens[active], Math.max(0, cur - cum[active]));
      const pt = paths[active].getPointAtLength(lp);
      const pw = stageW * 0.13;
      const px = (pt.x + 60) * scale - pw * 0.253;
      const py = (pt.y + 50) * scale - pw * 0.793;
      const lift = map(p, 0.56, 0.66);
      pencil.style.transform = `translate(${px + lift * pw * 1.4}px, ${py - lift * pw * 1.8}px) rotate(${Math.sin(cur * 0.05) * 3 - lift * 20}deg)`;
      pencil.style.opacity = 1 - lift;

      // b. component in a repo
      const cin = map(p, 0.5, 0.62), cout = map(p, 0.84, 0.95);
      code.style.opacity = cin * (1 - cout);
      code.style.transform = `translate(${-cout * 12}%, ${(1 - cin) * 30 + cout * 20}px) rotate(${(1 - cin) * -3 - cout * 4}deg)`;
      code.querySelector('pre').style.clipPath = `inset(0 ${100 - map(p, 0.54, 0.7) * 100}% 0 0)`;

      // c. real UI wipes in
      const wipe = map(p, 0.66, 0.9);
      const eased = wipe < 0.5 ? 4 * wipe ** 3 : 1 - (-2 * wipe + 2) ** 3 / 2;
      real.style.clipPath = `inset(0 ${(1 - eased) * 100}% 0 0 round 1.4cqw)`;
      svgEl.style.opacity = 1 - eased * 0.82;

      const step = p < 0.5 ? 0 : p < 0.7 ? 1 : 2;
      steps.forEach((s, k) => s.classList.toggle('is-on', k === step));
      title.style.setProperty('--mk', map(p, 0.72, 0.9));
    }

    if (REDUCED) { render(1); return; }
    render(0);
    ScrollTrigger.create({
      trigger: '.sketch', start: 'top top', end: () => `+=${innerHeight * 2.4}`,
      pin: true, scrub: true, invalidateOnRefresh: true,
      onUpdate: (self) => render(self.progress),
    });
  }


  /* ======================================================================
     02 — CURVED WORK SLIDER (WebGL) — falls back to the list
     ====================================================================== */
  const SLIDES = [
    { key: 'podtube', title: 'Pod-Tube', kind: 'Full-stack · WebRTC · FFmpeg', year: '2025', url: 'pod-tube.app', accent: '#8FA2FF' },
    { key: 'parking', title: 'Smart Parking', kind: 'Hackathon · Maps · Turborepo', year: '2025', url: 'smart-parking.vercel.app', accent: '#8FD9A8' },
    { key: 'xinterview', title: 'Xinterview', kind: 'Production · AI · Extensions', year: '2025', url: 'xinterview · dashboard', accent: '#FF8A65' },
    { key: 'next', title: 'Your product?', kind: 'Open slot · Let’s talk', year: '2026', url: 'your-idea.com', accent: '#FFD23F' },
  ];
  function initWorks() {
    const section = $('.works');
    const dots = $('.works__dots');
    dots.innerHTML = SLIDES.map(() => '<i></i>').join('');
    $('.works__total').textContent = String(SLIDES.length).padStart(2, '0');
    const open = (key) => (key === 'next' ? scrollToTarget('#contact') : window.__openCase?.(key));
    if (!window.initWorkSlider) return;
    window.initWorkSlider({
      section, reduced: REDUCED, lenis,
      projects: SLIDES.map((p) => ({ ...p, art: ART.covers[p.key] })),
      onOpen: open,
      onIndex: (i) => {
        $('.works__cur').textContent = String(i + 1).padStart(2, '0');
        $$('i', dots).forEach((d, k) => d.classList.toggle('is-on', k === i));
      },
      setCursor: (t) => window.__cursorLabel?.(t),
      scrollTo: (y) => (lenis ? lenis.scrollTo(y, { duration: 1.1 }) : scrollTo({ top: y, behavior: 'smooth' })),
    }).catch((e) => console.warn('slider', e));
  }

  /* ======================================================================
     SCROLL REVEALS, COUNTERS, MARQUEE
     ====================================================================== */
  function initReveals() {
    splits.forEach((words, el) => {
      if (el.classList.contains('hero__lede')) return;
      if (REDUCED) return;
      gsap.from(words, {
        yPercent: 115, rotation: 3, duration: 1.15, stagger: Math.min(0.03, 0.55 / words.length), ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
    if (!REDUCED) {
      gsap.utils.toArray('.work__row, .timeline li, .stat').forEach((el) => {
        gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
      });
      gsap.from('.intro__sign', { opacity: 0, x: -20, duration: 1, scrollTrigger: { trigger: '.intro__sign', start: 'top 90%', once: true } });
    }
    $$('[data-count]').forEach((el) => {
      const target = +el.dataset.count;
      const o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: () => gsap.to(o, { v: target, duration: REDUCED ? 0 : 1.8, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(o.v)) }),
      });
    });
    ScrollTrigger.create({ trigger: '.footer', start: 'top 40px', end: 'bottom top', toggleClass: { targets: '.nav', className: 'is-dark' } });
    ScrollTrigger.create({ trigger: '.works', start: 'top 40px', end: 'bottom 40px', toggleClass: { targets: '.nav', className: 'is-dark' } });
    // service cards: colour floods in from where the cursor enters
    $$('.svc__card').forEach((c) => c.addEventListener('pointerenter', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - r.left}px`); c.style.setProperty('--my', `${e.clientY - r.top}px`);
    }));
    if (!REDUCED) {
      gsap.from('.works__big span', { yPercent: 100, duration: 1.2, stagger: 0.07, ease: 'expo.out', scrollTrigger: { trigger: '.works', start: 'top 70%', once: true } });
      gsap.from('.process li, .layer, .svc__card', { y: 40, opacity: 0, duration: 1, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '.services', start: 'top 70%', once: true } });
    }
  }

  function initMarquee() {
    const rows = $$('.marquee').map((m) => {
      const t = $('.marquee__track', m);
      t.innerHTML = t.innerHTML + t.innerHTML + t.innerHTML;
      return { t, dir: +m.dataset.dir, x: 0, w: t.scrollWidth / 3 };
    });
    addEventListener('resize', () => rows.forEach((r) => (r.w = r.t.scrollWidth / 3)));
    let visible = false;
    observe($('.toolbox'), ([e]) => (visible = e.isIntersecting));
    gsap.ticker.add((_, dt) => {
      if (!visible || REDUCED) return;
      const v = lenis ? lenis.velocity : 0;
      rows.forEach((r) => {
        r.x -= (0.06 + Math.abs(v) * 0.04) * dt * r.dir * (v < -0.5 ? -1 : 1);
        r.x = gsap.utils.wrap(-r.w, 0, r.x);
        r.t.style.transform = `translate3d(${r.x}px,0,0)`;
      });
    });
  }

  /* ======================================================================
     CURSOR + WORK PREVIEW
     ====================================================================== */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  function initCursor() {
    if (!FINE) return;
    document.body.classList.add('has-cursor');
    const c = $('.cursor'), label = $('.cursor__label');
    const xTo = gsap.quickTo(c, 'x', { duration: 0.12, ease: 'power3' });
    const yTo = gsap.quickTo(c, 'y', { duration: 0.12, ease: 'power3' });
    addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    const setLabel = (t) => { label.textContent = t || ''; c.classList.toggle('is-label', !!t); };
    $$('.work__row').forEach((r) => {
      r.addEventListener('mouseenter', () => setLabel(r.dataset.project === 'next' ? 'say hi' : 'open the case'));
      r.addEventListener('mouseleave', () => setLabel(''));
    });
    $$('a, button').forEach((a) => {
      if (a.closest('.work__row')) return;
      a.addEventListener('mouseenter', () => c.classList.add('is-link'));
      a.addEventListener('mouseleave', () => c.classList.remove('is-link'));
    });
    const footer = $('.footer');
    footer.addEventListener('mouseenter', () => c.classList.add('is-light'));
    footer.addEventListener('mouseleave', () => c.classList.remove('is-light'));
    window.__cursorLabel = setLabel;
  }

  function initPreview() {
    if (!FINE || $('.works').classList.contains('has-gl')) return;
    const prev = $('.preview');
    const list = $('.work__list');
    let px = mouse.x, py = mouse.y, s = 0, target = 0, idx = 0;
    list.addEventListener('mouseenter', () => { target = 1; px = mouse.x; py = mouse.y; });
    list.addEventListener('mouseleave', () => (target = 0));
    $$('.work__row').forEach((row) => row.addEventListener('mouseenter', () => {
      const i = ORDER.indexOf(row.dataset.project);
      if (i === idx) return;
      idx = i;
      gsap.to(track, { yPercent: -100 * i, duration: 0.8, ease: 'expo.out' });
    }));
    const inList = () => { const r = list.getBoundingClientRect(); return mouse.x >= r.left && mouse.x <= r.right && mouse.y >= r.top && mouse.y <= r.bottom; };
    addEventListener('scroll', () => { target = inList() ? 1 : 0; }, { passive: true });
    gsap.ticker.add(() => {
      if (target === 0 && s < 0.001) { if (s !== 0) { s = 0; prev.style.transform = 'translate(-50%,-50%) scale(0)'; } return; }
      px += (mouse.x - px) * 0.14; py += (mouse.y - py) * 0.14;
      s += (target - s) * 0.14;
      const vx = Math.max(-18, Math.min(18, (mouse.x - px) * 0.06));
      prev.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%) rotate(${vx}deg) scale(${s})`;
    });
  }

  /* ======================================================================
     CASE OVERLAY
     ====================================================================== */
  const PROJECTS = {
    podtube: {
      title: 'Pod-Tube', kind: 'Full-stack project', blurb: 'A podcast studio that lives in a browser tab. Two people, one link, studio-quality episodes.',
      meta: [['Role', 'Design, frontend, backend — all of it'], ['Timeline', 'Jul — Aug 2025'], ['Stack', 'Next.js, TypeScript, PostgreSQL, WebRTC, Socket.IO, Cloudflare R2, FFmpeg']],
      points: [
        'Real-time audio and video between two participants over WebRTC, with Socket.IO doing the signalling.',
        'Chunk-based recording with resumable uploads to Cloudflare R2 and integrity validation on every piece.',
        'A 5-stage FFmpeg pipeline: concatenate chunks, sync both timelines, merge the streams, export a downloadable MP4.',
        'Secure auth, session management, REST APIs and background job processing on PostgreSQL + JWT.',
        'Transactions and row-level locking so simultaneous uploads never spawn duplicate processing jobs.',
      ],
      links: [['Live demo ↗︎', 'https://pod-tube-production.up.railway.app/'], ['GitHub ↗︎', 'https://github.com/Anshik-18/Pod_tube', true]],
    },
    parking: {
      title: 'Smart Parking', kind: 'Hackathon · Full-stack', blurb: 'Find a spot, book it, park. Built in a hackathon sprint — and it finished top-10.',
      meta: [['Role', 'Team lead, full-stack'], ['Timeline', 'May — Jul 2025'], ['Stack', 'Next.js, TypeScript, PostgreSQL, Prisma, Tailwind CSS, Google Maps API, Turborepo']],
      points: [
        'Built at the Bharat Shiksha Expo Hackathon — top-10 finish, recognised for its design.',
        'Separate user and merchant interfaces on the Next.js App Router.',
        'Google Maps API for location search, nearby-parking discovery and real-time booking workflows.',
        'Streamlined Prisma + PostgreSQL queries to keep the app responsive.',
        'Turborepo monorepo with shared packages and reusable components, ready to scale.',
      ],
      links: [['Live demo ↗︎', 'https://smart-parking-dev-tw4q.vercel.app/'], ['GitHub ↗︎', 'https://github.com/Anshik-18/Smart-parking-dev', true]],
    },
    xinterview: {
      title: 'Xinterview', kind: 'Frontend Developer Intern · Remote', blurb: 'Five months of hunting bugs, shipping features and teaching a browser extension to think.',
      meta: [['Role', 'Frontend Developer Intern'], ['Timeline', 'Jun — Oct 2025'], ['Stack', 'Next.js, GitLab, OpenAI API, browser extensions']],
      points: [
        'Led debugging on the frontend: 25+ critical bugs fixed and deployed, page load time down 20% for 1,000+ daily users.',
        'Engineered 15+ feature upgrades with Next.js and GitLab — application stability up 15%.',
        'Designed AI-powered browser extensions that cut user task-completion time by 30%.',
        'Built an AI module that generates 200+ interview questions tailored to role and candidate — setup time down 40%.',
        'Refined UI responsiveness through A/B testing, lifting user satisfaction scores by 10%.',
      ],
      links: [['Ask me about it ↗︎', 'mailto:anshikjain56@gmail.com?subject=About%20your%20Xinterview%20work']],
    },
  };

  function initCase() {
    const box = $('.case'), sc = $('.case__scroll');
    let open = false, lastFocus = null;
    // numeric wipe (tweening clip-path strings directly is unreliable: browsers normalise the value)
    const wipe = { top: 100, bottom: 0 };
    const paint = () => (sc.style.clipPath = `inset(${wipe.top}% 0% ${wipe.bottom}% 0%)`);
    function show(key) {
      const p = PROJECTS[key]; if (!p) return;
      lastFocus = document.activeElement;
      $('.case__kind', box).textContent = p.kind;
      $('.case__title', box).textContent = p.title;
      $('.case__blurb', box).textContent = p.blurb;
      $('.case__art', box).innerHTML = ART.covers[key];
      $('.case__meta', box).innerHTML = p.meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
      $('.case__points', box).innerHTML = p.points.map((t) => `<li>${t}</li>`).join('');
      $('.case__links', box).innerHTML = p.links.map(([l, h, ghost]) => `<a href="${h}" ${h.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} class="${ghost ? 'is-ghost' : ''}">${l}</a>`).join('');
      sc.scrollTop = 0;
      box.classList.add('is-open'); box.setAttribute('aria-hidden', 'false');
      open = true; window.__caseOpen = true; lenis?.stop();
      document.body.classList.add('case-open');
      window.__cursorLabel?.('');
      wipe.top = 100; wipe.bottom = 0; paint();
      gsap.killTweensOf(wipe);
      gsap.to(wipe, { top: 0, duration: REDUCED ? 0 : 1, ease: 'expo.inOut', onUpdate: paint });
      gsap.from(['.case__title', '.case__blurb', '.case__art'], { y: 60, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out', delay: REDUCED ? 0 : 0.45 });
      setTimeout(() => $('.case__close', box).focus({ preventScroll: true }), 50);
    }
    function hide() {
      if (!open) return; open = false;
      gsap.killTweensOf(wipe);
      gsap.to(wipe, { bottom: 100, duration: REDUCED ? 0 : 0.8, ease: 'expo.inOut', onUpdate: paint, onComplete: () => {
        box.classList.remove('is-open'); box.setAttribute('aria-hidden', 'true'); window.__caseOpen = false; document.body.classList.remove('case-open'); lenis?.start(); lastFocus?.focus?.({ preventScroll: true });
      } });
    }
    window.__openCase = show;
    $('.case__close', box).addEventListener('click', hide);
    addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
    $$('.work__row').forEach((row) => {
      const go = () => (row.dataset.project === 'next' ? scrollToTarget('#contact') : show(row.dataset.project));
      row.addEventListener('click', go);
      row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  }

  /* ======================================================================
     FOOTER PIT — "anshik" falls, piles up, and can be thrown around
     ====================================================================== */
  function initPit() {
    if (!window.Matter) return;
    const { Engine, Bodies, Body, Composite, Constraint, Query } = Matter;
    const pit = $('.pit'), cv = $('.pit__canvas'), ctx = cv.getContext('2d');
    const WORD = 'anshik';
    const COLORS = { n: '#FF4F1F' };
    let W = 0, H = 0, dpr = 1, fs = 100, engine = null, bodies = [], drag = null;
    let running = false, inView = false, built = false, raf = 0, lastT = 0, acc = 0, still = 0;

    function setup() {
      W = pit.clientWidth; H = pit.clientHeight; dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      fs = Math.min(W / (isMobile() ? 3.1 : 3.9), H * 0.72);
      ctx.font = `900 ${fs}px Archivo, "Arial Black", sans-serif`;
      engine = Engine.create();
      still = 0;
      engine.gravity.y = 1.25;
      const t = 200;
      Composite.add(engine.world, [
        Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true, friction: 0.8 }),
        Bodies.rectangle(-t / 2, H / 2 - H, t, H * 4, { isStatic: true }),
        Bodies.rectangle(W + t / 2, H / 2 - H, t, H * 4, { isStatic: true }),
      ]);
      bodies = [...WORD].map((ch, i) => {
        const m = ctx.measureText(ch);
        const left = m.actualBoundingBoxLeft, right = m.actualBoundingBoxRight;
        const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
        const w = left + right, h = asc + desc;
        const x = W * (0.14 + (0.72 * i) / (WORD.length - 1)) + rand(-W * 0.03, W * 0.03);
        const y = -h * 0.6 - i * h * 0.35 - rand(0, h * 0.4);
        const b = Bodies.rectangle(x, y, w, h, {
          chamfer: { radius: Math.min(w, h) * 0.12 }, restitution: 0.25, friction: 0.55, frictionAir: 0.012, density: 0.0016,
          angle: rand(-0.5, 0.5),
        });
        Body.setAngularVelocity(b, rand(-0.04, 0.04));
        b.plugin = { ch, w, h, left, asc, color: COLORS[ch] || '#EEEAE1' };
        return b;
      });
      Composite.add(engine.world, bodies);
      built = true;
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.font = `900 ${fs}px Archivo, "Arial Black", sans-serif`;
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      for (const b of bodies) {
        const { ch, w, h, left, asc, color } = b.plugin;
        ctx.save();
        ctx.translate(b.position.x, b.position.y);
        ctx.rotate(b.angle);
        ctx.fillStyle = color;
        ctx.fillText(ch, -w / 2 + left, -h / 2 + asc);
        ctx.restore();
      }
    }

    function frame(t) {
      if (!running) return;
      const dt = Math.min(t - lastT || 16.7, 50); lastT = t; acc += dt;
      const step = 1000 / 60;
      while (acc >= step) { Engine.update(engine, step); acc -= step; }
      draw();
      // idle detection: once everything has landed and settled for ~2s, stop the loop entirely
      const settled = !drag && bodies.every((b) => b.position.y > 0 && b.speed < 0.06 && Math.abs(b.angularVelocity) < 0.002);
      still = settled ? still + 1 : 0;
      if (still > 120) { running = false; return; }
      raf = requestAnimationFrame(frame);
    }
    const start = () => { if (running || !built || !inView) return; running = true; lastT = performance.now(); acc = 0; raf = requestAnimationFrame(frame); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    const wake = () => { still = 0; start(); };

    const local = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    cv.addEventListener('pointerdown', (e) => {
      if (!built) return;
      const p = local(e);
      const hit = Query.point(bodies, p)[0];
      if (!hit) return;
      wake();
      if (e.pointerType !== 'mouse') {
        Body.setVelocity(hit, { x: rand(-9, 9), y: -rand(14, 20) });
        Body.setAngularVelocity(hit, rand(-0.35, 0.35));
        return;
      }
      drag = Constraint.create({ pointA: p, bodyB: hit, pointB: { x: p.x - hit.position.x, y: p.y - hit.position.y }, stiffness: 0.2, damping: 0.08, length: 0 });
      Composite.add(engine.world, drag);
      cv.setPointerCapture(e.pointerId);
      cv.style.cursor = 'grabbing';
    });
    cv.addEventListener('pointermove', (e) => {
      if (!built) return;
      const p = local(e);
      if (drag) { drag.pointA = p; return; }
      if (FINE) window.__cursorLabel?.(Query.point(bodies, p).length ? 'drag me' : '');
    });
    const release = () => { if (drag) { Composite.remove(engine.world, drag); drag = null; cv.style.cursor = ''; } };
    cv.addEventListener('pointerup', release);
    cv.addEventListener('pointercancel', release);
    cv.addEventListener('pointerleave', () => { if (!drag) window.__cursorLabel?.(''); });

    const rebuild = () => { stop(); release(); if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); } setup(); start(); };
    $('.pit__reset').addEventListener('click', () => { if (built) rebuild(); });

    observe(pit, ([e]) => {
      inView = e.isIntersecting;
      if (inView) {
        if (!built) document.fonts.load('900 100px Archivo').catch(() => {}).then(() => { try { setup(); start(); } catch (err) { console.error('pit', err); } });
        else wake();
      } else stop();
    }, { threshold: 0.2 });

    let lastW = pit.clientWidth;
    addEventListener('resize', () => {
      if (!built || Math.abs(pit.clientWidth - lastW) < 60) return;
      lastW = pit.clientWidth;
      rebuild();
    });
  }

  /* ======================================================================
     BOOT
     ====================================================================== */
  initSketch();
  initWorks();
  initReveals();
  initMarquee();
  initCursor();
  initPreview();
  initCase();
  initPit();
  initTrail();

  const fontsReady = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
  fontsReady.then(() => {
    fitName();
    if (REDUCED) skipIntro(); else intro();
    ScrollTrigger.refresh();
  });

  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (introDone) { fitName(); ScrollTrigger.refresh(); } }, 150);
  });
})();
