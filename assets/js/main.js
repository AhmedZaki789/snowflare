/* =====================================================================
   SnowFlare — Immersive edition
   ===================================================================== */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const wrap = document.getElementById('scroll');
  const body = document.body;
  const lerp = (a, b, n) => a + (b - a) * n;

  /* ---------- Hero logo: Nexus convergence via GSAP (Arrow → Bridge → Flare) ----------
     Uses the REAL logo split into 3 layers, so the assembled mark is pixel-exact.
     Spec §09 Nexus Convergence: ~2s, easing cubic-bezier(0.34,1.56,0.64,1) ≈ back.out. */
  const heroLogo = document.querySelector('.hero__logo');
  let heroTL = null;
  if (window.gsap && heroLogo && !reduce) {
    const flare = heroLogo.querySelector('.nx--flare');
    const bridge = heroLogo.querySelector('.nx--bridge');
    const arrow = heroLogo.querySelector('.nx--arrow');
    gsap.set([arrow, bridge, flare], { opacity: 0 });
    gsap.set(arrow,  { yPercent: 60 });
    gsap.set(bridge, { yPercent: -8, scaleY: 0.35, transformOrigin: '50% 75%' });
    gsap.set(flare,  { scale: 0.5, transformOrigin: '50% 92%' });
    heroTL = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    heroTL
      .to(arrow,  { opacity: 1, yPercent: 0, duration: 0.75 }, 0)
      .to(bridge, { opacity: 1, yPercent: 0, scaleY: 1, duration: 0.65, ease: 'back.out(1.7)' }, 0.35)
      .to(flare,  { opacity: 1, scale: 1, duration: 0.65, ease: 'back.out(2)' }, 0.7)
      .add(() => { gsap.to(heroLogo, { y: -12, duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true }); }, 1.5);
  }
  function playHeroLogo() {
    if (!heroTL) return;
    heroTL.play();
    // Safety: if rAF is throttled (e.g. page loaded in a background tab) force the
    // mark to its assembled state so it can never get stuck mid-convergence.
    setTimeout(() => { if (heroTL.progress() < 1) heroTL.progress(1); }, 4500);
  }

  /* ---------- Reveals ---------- */
  let revealsReady = false;
  function initReveals() {
    if (revealsReady) return; revealsReady = true;
    document.querySelectorAll('.line').forEach((line) => {
      const sib = [...line.parentNode.querySelectorAll(':scope > .line')];
      const inner = line.querySelector('.line__in');
      if (inner) inner.style.transitionDelay = (sib.indexOf(line) * 0.09) + 's';
    });
    const targets = [...document.querySelectorAll('.reveal-fade, .hero__title, .statement__big, .end__title')];
    if (reduce || !('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    targets.forEach((t) => io.observe(t));
  }

  /* ---------- Preloader ---------- */
  const pre = document.getElementById('preloader');
  const countEl = document.getElementById('count');
  let revealed = false;
  function reveal() {
    if (revealed) return; revealed = true;
    body.classList.add('ready');
    if (pre) { pre.classList.add('done'); setTimeout(() => { pre.style.display = 'none'; }, 1100); }
    initReveals();
    sizeBody();
    playHeroLogo();
  }
  if (reduce) {
    if (pre) pre.style.display = 'none';
    reveal();
  } else {
    let c = 0;
    const tick = () => {
      c += Math.random() * 9 + 4;
      if (c >= 100) { if (countEl) countEl.textContent = 100; setTimeout(reveal, 260); }
      else { if (countEl) countEl.textContent = Math.floor(c); setTimeout(tick, 55 + Math.random() * 95); }
    };
    let started = false;
    const start = () => { if (started) return; started = true; tick(); };
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
    setTimeout(start, 1600); // fallback if load is slow
    setTimeout(reveal, 6000); // hard safety net
  }

  /* ---------- Native scroll + nav active-tracking ----------
     The custom momentum smooth-scroll (a position:fixed #scroll wrapper
     translate3d-ed on EVERY frame) was the main cause of the scroll lag — it
     turned the whole page into one giant layer repainted continuously. Its
     parallax also clashed with the clients marquee's data-speed (=55), shoving
     it far off-screen on desktop. Removed entirely: native scroll is instant,
     GPU-friendly, and the IntersectionObserver reveals/anim still work. */
  function sizeBody() { body.style.height = ''; }
  sizeBody();
  window.addEventListener('resize', sizeBody, { passive: true });

  const pill = document.getElementById('pill');
  const navLinks = pill ? [...pill.querySelectorAll('.pill__nav a')] : [];
  function updateActive() {
    if (!navLinks.length) return;
    const mid = window.innerHeight / 2;
    let activeId = '';
    navLinks.forEach((a) => {
      const sec = document.querySelector(a.getAttribute('href'));
      if (!sec) return;
      const r = sec.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) activeId = a.getAttribute('href');
    });
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === activeId));
  }
  /* update at most once per frame, and only while actually scrolling — no
     perpetual requestAnimationFrame loop running when the page is idle. */
  let navTick = false;
  window.addEventListener('scroll', () => {
    if (navTick) return; navTick = true;
    requestAnimationFrame(() => { updateActive(); navTick = false; });
  }, { passive: true });
  window.addEventListener('load', updateActive);
  updateActive();

  /* ---------- Anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      const y = t.getBoundingClientRect().top + (window.scrollY || 0);
      window.scrollTo({ top: Math.max(0, y - 8), behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Custom cursor ---------- */
  if (fine && !reduce) {
    const cur = document.getElementById('cursor');
    const label = cur ? cur.querySelector('.cursor__label') : null;
    if (cur) {
      let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
      window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); }, { passive: true });
      (function craf() { cx = lerp(cx, tx, 0.22); cy = lerp(cy, ty, 0.22); cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`; requestAnimationFrame(craf); })();
      document.querySelectorAll('[data-cursor]').forEach((el) => {
        const type = el.dataset.cursor;
        el.addEventListener('mouseenter', () => { body.classList.add(type === 'view' ? 'cur-view' : 'cur-hover'); if (type === 'view' && label) label.textContent = 'View'; });
        el.addEventListener('mouseleave', () => { body.classList.remove('cur-view', 'cur-hover'); if (label) label.textContent = ''; });
      });
    }
  }

  /* ---------- Stat count-up ---------- */
  const stats = document.querySelectorAll('.stat__n[data-count]');
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    if (reduce) { el.textContent = target; return; }
    let s = null; const dur = 1500;
    const step = (t) => { if (s === null) s = t; const p = Math.min((t - s) / dur, 1); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  if (stats.length) {
    if (!('IntersectionObserver' in window)) stats.forEach(runCount);
    else {
      const sIO = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) { runCount(e.target); sIO.unobserve(e.target); } }); }, { threshold: 0.6 });
      stats.forEach((el) => sIO.observe(el));
    }
  }

  /* ---------- Pause the looping background "louver" animations off-screen ----------
     7 sections each run an infinite acSwing transform; only the 1–2 on screen
     need to. Invisible (you can't see off-screen sections) but cuts constant
     GPU compositing. */
  if (!reduce && 'IntersectionObserver' in window) {
    const bgSecs = [...document.querySelectorAll('.hero,#intro,.studio,.statement--alt,.end,.work,.stats,.clients')];
    const bgIO = new IntersectionObserver((es) => {
      es.forEach((e) => e.target.classList.toggle('bg-off', !e.isIntersecting));
    }, { rootMargin: '10% 0px' });
    bgSecs.forEach((s) => { s.classList.add('bg-off'); bgIO.observe(s); });
  }
})();
