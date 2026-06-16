/* =====================================================================
   Dome Gallery — faithful vanilla port of reactbits.dev <DomeGallery/>.
   35-segment sphere, 175 tiles sized to tile the sphere seamlessly;
   drag spins horizontally (vertical clamped to ±5°), with inertia +
   a gentle idle auto-spin. Tiles = brand textures (grayscale → colour
   on hover) with a project-name label.
   ===================================================================== */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SEG = 35;
  const MAXV = 5;           // max vertical rotation (deg) — keeps the dome look
  const SENS = 20;          // drag sensitivity

  const IMAGES = Array.from({ length: 9 }, (_, i) => `assets/img/bg/${i + 1}.png`);
  const LABELS = ['Microless', 'Espace', 'Al Majed Perfumes', 'Mira Digital', 'Symax'];

  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const wrapSigned = (d) => { const a = (((d + 180) % 360) + 360) % 360; return a - 180; };

  function buildItems(seg) {
    const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
    const evenYs = [-4, -2, 0, 2, 4], oddYs = [-3, -1, 1, 3, 5];
    return xCols.flatMap((x, c) => (c % 2 === 0 ? evenYs : oddYs).map((y) => ({ x, y, sizeX: 2, sizeY: 2 })));
  }

  function setup(root) {
    const sphere = root.querySelector('.sphere');
    const main = root.querySelector('.sphere-main');
    if (!sphere || !main) return;

    root.style.setProperty('--segments-x', SEG);
    root.style.setProperty('--segments-y', SEG);
    root.style.setProperty('--overlay-blur-color', '#0B1428');
    root.style.setProperty('--tile-radius', '10px');
    root.style.setProperty('--image-filter', 'grayscale(1)');

    const coords = buildItems(SEG);
    coords.forEach((it, i) => {
      const item = document.createElement('div');
      item.className = 'item';
      item.style.setProperty('--offset-x', it.x);
      item.style.setProperty('--offset-y', it.y);
      item.style.setProperty('--item-size-x', it.sizeX);
      item.style.setProperty('--item-size-y', it.sizeY);
      const cell = document.createElement('div');
      cell.className = 'item__image';
      const img = document.createElement('img');
      img.src = IMAGES[i % IMAGES.length]; img.draggable = false; img.alt = '';
      const label = document.createElement('span');
      label.className = 'dome__label';
      label.textContent = LABELS[i % LABELS.length];
      cell.appendChild(img); cell.appendChild(label);
      item.appendChild(cell);
      sphere.appendChild(item);
    });

    let rotX = 0, rotY = 0, radius = 600;
    function applyTransform() { sphere.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${rotX}deg) rotateY(${rotY}deg)`; }

    function sizeRadius() {
      const r = root.getBoundingClientRect();
      const w = Math.max(1, r.width), h = Math.max(1, r.height);
      const minDim = Math.min(w, h), aspect = w / h;
      const basis = aspect >= 1.3 ? w : minDim;
      let rad = basis * 0.5;
      rad = Math.min(rad, h * 1.35);
      rad = clamp(rad, 600, 1100);
      radius = Math.round(rad);
      root.style.setProperty('--radius', radius + 'px');
      applyTransform();
    }
    sizeRadius();
    if ('ResizeObserver' in window) new ResizeObserver(sizeRadius).observe(root);

    /* ---- drag + inertia ---- */
    let dragging = false, moved = false, sx = 0, sy = 0, srx = 0, sry = 0;
    let lastX = 0, lastY = 0, lastT = 0, vX = 0, vY = 0, rafId = null;
    const stopInertia = () => { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } };

    main.addEventListener('pointerdown', (e) => {
      stopInertia(); dragging = true; moved = false; idle = false;
      sx = e.clientX; sy = e.clientY; srx = rotX; sry = rotY;
      lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
      main.classList.add('is-grab');
      try { main.setPointerCapture(e.pointerId); } catch (_) {}
    });
    main.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (dx * dx + dy * dy > 16) moved = true;
      rotX = clamp(srx - dy / SENS, -MAXV, MAXV);
      rotY = wrapSigned(sry + dx / SENS);
      applyTransform();
      const now = performance.now(), dt = Math.max(1, now - lastT);
      vX = (e.clientX - lastX) / dt; vY = (e.clientY - lastY) / dt;
      lastX = e.clientX; lastY = e.clientY; lastT = now;
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false; main.classList.remove('is-grab');
      let ix = clamp(vX, -1.4, 1.4) * 80, iy = clamp(vY, -1.4, 1.4) * 80, frames = 0;
      const fric = 0.985;
      const step = () => {
        ix *= fric; iy *= fric;
        if ((Math.abs(ix) < 0.05 && Math.abs(iy) < 0.05) || ++frames > 360) { rafId = null; return; }
        rotX = clamp(rotX - iy / 200, -MAXV, MAXV);
        rotY = wrapSigned(rotY + ix / 200);
        applyTransform();
        rafId = requestAnimationFrame(step);
      };
      stopInertia(); rafId = requestAnimationFrame(step);
    }
    main.addEventListener('pointerup', endDrag);
    main.addEventListener('pointercancel', endDrag);
    window.addEventListener('pointerup', endDrag);

    /* ---- gentle idle auto-spin ---- */
    let idle = true;
    main.addEventListener('pointerenter', () => { idle = false; });
    main.addEventListener('pointerleave', () => { idle = true; });
    let last = null;
    function autoFrame(ts) {
      if (last === null) last = ts; const dt = (ts - last) / 1000; last = ts;
      if (idle && !dragging && !rafId) { rotY = wrapSigned(rotY + 4 * dt); applyTransform(); }
      requestAnimationFrame(autoFrame);
    }
    if (!reduce) requestAnimationFrame(autoFrame);
  }

  function init() { document.querySelectorAll('.sphere-root').forEach(setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
