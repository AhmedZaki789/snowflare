/* =====================================================================
   Gallery3D — a rotating 3D cylinder showcase (RollingGallery-style).
   Vanilla CSS-3D: faces sit on a cylinder; auto-rotates, drag to spin,
   pause on hover, inertia on release. Visibility-gated for performance.
   ===================================================================== */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setup(root) {
    const cyl = root.querySelector('.gallery3d__cylinder');
    const faces = [...root.querySelectorAll('.gallery3d__face')];
    const N = faces.length;
    if (!cyl || !N) return;
    const step = 360 / N;
    let radius = 0;

    function layout() {
      const w = faces[0].offsetWidth || 300;
      radius = Math.round((w / 2) / Math.tan(Math.PI / N) + 26);
      faces.forEach((f, i) => { f.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`; });
      render();
    }

    let rot = 0;
    const AUTO = -7;              // auto-rotate speed (deg/s)
    let vel = AUTO;
    let dragging = false, paused = false, visible = true;
    let lastX = 0, lastDelta = 0;

    function render() { cyl.style.transform = `translateZ(${-radius}px) rotateY(${rot}deg)`; }

    root.addEventListener('pointerdown', (e) => {
      dragging = true; paused = true; lastX = e.clientX; vel = 0; lastDelta = 0;
      root.classList.add('is-grab');
      try { root.setPointerCapture(e.pointerId); } catch (_) {}
    });
    root.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      const d = dx * 0.3; rot += d; lastDelta = d; render();
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false; paused = false; root.classList.remove('is-grab');
      vel = Math.max(-90, Math.min(90, lastDelta * 60 * 0.5)); // fling momentum
    }
    root.addEventListener('pointerup', endDrag);
    root.addEventListener('pointercancel', endDrag);
    window.addEventListener('pointerup', endDrag);

    root.addEventListener('mouseenter', () => { if (!dragging) paused = true; });
    root.addEventListener('mouseleave', () => { if (!dragging) paused = false; });

    let last = null;
    function frame(ts) {
      if (last === null) last = ts;
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      if (visible && !dragging) {
        const targetV = paused ? 0 : AUTO;
        vel += (targetV - vel) * (1 - Math.exp(-dt / 0.6));
        rot += vel * dt;
        render();
      }
      requestAnimationFrame(frame);
    }

    layout();
    let to;
    window.addEventListener('resize', () => { clearTimeout(to); to = setTimeout(layout, 150); }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { rootMargin: '140px' }).observe(root);
    if (reduce) { render(); return; }
    requestAnimationFrame(frame);
  }

  function init() { document.querySelectorAll('.gallery3d').forEach(setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
