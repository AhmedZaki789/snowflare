/* =====================================================================
   LogoLoop — vanilla port of the reactbits.dev <LogoLoop/> (horizontal).
   Smooth velocity easing + hover deceleration + seamless wrap.
   Config via data- attrs on .logoloop:
     data-speed (px/s, default 60) · data-hoverspeed (default 0 = pause)
     data-direction ("left"|"right", default "left")
   ===================================================================== */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = 0.25; // smoothing time-constant (matches reactbits SMOOTH_TAU)

  function setup(root) {
    const track = root.querySelector('.logoloop__track');
    const firstList = root.querySelector('.logoloop__list');
    if (!track || !firstList) return;

    const speed = parseFloat(root.dataset.speed || '60');
    const hoverSpeed = root.dataset.hoverspeed !== undefined ? parseFloat(root.dataset.hoverspeed) : 0;
    const dir = root.dataset.direction || 'left';
    const sign = dir === 'right' ? -1 : 1;          // left scrolls content leftwards
    const target = speed * sign;

    let seqWidth = 0;
    function fillCopies() {
      // remove previously-added clones
      track.querySelectorAll('[data-clone]').forEach(n => n.remove());
      seqWidth = firstList.getBoundingClientRect().width;
      if (seqWidth <= 0) return;
      const need = Math.max(2, Math.ceil((root.clientWidth || seqWidth) / seqWidth) + 2);
      for (let i = 1; i < need; i++) {
        const c = firstList.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.setAttribute('data-clone', '');
        track.appendChild(c);
      }
    }
    fillCopies();

    // wait for any images, then re-measure
    const imgs = firstList.querySelectorAll('img');
    let pending = imgs.length;
    if (pending) imgs.forEach(im => { if (im.complete) { if (--pending === 0) fillCopies(); } else im.addEventListener('load', () => { if (--pending === 0) fillCopies(); }, { once: true }); });

    let to;
    window.addEventListener('resize', () => { clearTimeout(to); to = setTimeout(fillCopies, 160); }, { passive: true });

    if (reduce || seqWidth <= 0) return;

    let hovered = false;
    track.addEventListener('mouseenter', () => { hovered = true; });
    track.addEventListener('mouseleave', () => { hovered = false; });

    let offset = 0, vel = 0, last = null;
    function frame(t) {
      if (last === null) last = t;
      const dt = Math.max(0, t - last) / 1000; last = t;
      const tv = hovered && hoverSpeed !== undefined ? hoverSpeed * sign : target;
      const ease = 1 - Math.exp(-dt / TAU);
      vel += (tv - vel) * ease;
      if (seqWidth > 0) {
        offset += vel * dt;
        offset = ((offset % seqWidth) + seqWidth) % seqWidth;
        track.style.transform = `translate3d(${-offset}px,0,0)`;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function init() { document.querySelectorAll('.logoloop').forEach(setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
