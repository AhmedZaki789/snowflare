/* =====================================================================
   ChromaGrid — vanilla port of reactbits.dev <ChromaGrid/>.
   A grid that's grayscale/dim by default; a colour spotlight follows the
   cursor (smoothed) and reveals the cards in full colour beneath it.
   ===================================================================== */
(function () {
  'use strict';
  function setup(grid) {
    let r = grid.getBoundingClientRect();
    let tx = r.width / 2, ty = r.height / 2, cx = tx, cy = ty;
    const set = () => { grid.style.setProperty('--x', cx + 'px'); grid.style.setProperty('--y', cy + 'px'); };
    set();
    grid.addEventListener('pointermove', (e) => { r = grid.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; }, { passive: true });
    window.addEventListener('resize', () => { r = grid.getBoundingClientRect(); }, { passive: true });
    (function raf() { cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16; set(); requestAnimationFrame(raf); })();
  }
  function init() { document.querySelectorAll('.chroma').forEach(setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
