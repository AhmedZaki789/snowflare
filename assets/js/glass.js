/* =====================================================================
   GlassSurface — vanilla port of reactbits.dev <GlassSurface/>.
   Liquid glass via backdrop-filter + an SVG displacement map (Chromium).
   Frosted-blur fallback on Safari/Firefox/unsupported. Mounts on [data-glass].
   Options via data- attrs: data-radius, data-distortion, data-blur,
   data-brightness, data-glassopacity, data-displace, data-saturation,
   data-red/green/blue, data-borderwidth.
   ===================================================================== */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  let uid = 0;

  const supports = (id) => {
    const ua = navigator.userAgent;
    if ((/Safari/.test(ua) && !/Chrome/.test(ua)) || /Firefox/.test(ua)) return false;
    const d = document.createElement('div');
    d.style.backdropFilter = `url(#${id})`;
    return d.style.backdropFilter !== '';
  };
  const n = (el, k, def) => (el.dataset[k] !== undefined ? parseFloat(el.dataset[k]) : def);

  function mount(el) {
    const id = `glass-f-${uid++}`;
    const o = {
      radius: n(el, 'radius', parseFloat(getComputedStyle(el).borderRadius) || 20),
      borderWidth: n(el, 'borderwidth', 0.07),
      brightness: n(el, 'brightness', 55),
      opacity: n(el, 'glassopacity', 0.92),
      blur: n(el, 'blur', 11),
      displace: n(el, 'displace', 0.4),
      saturation: n(el, 'saturation', 1.4),
      distortion: n(el, 'distortion', -130),
      red: n(el, 'red', 0), green: n(el, 'green', 12), blue: n(el, 'blue', 22),
      xChannel: el.dataset.xchannel || 'R', yChannel: el.dataset.ychannel || 'G',
      mixBlend: el.dataset.mixblend || 'difference'
    };

    el.classList.add('glass-surface');

    if (!supports(id)) { el.classList.add('glass-surface--fallback'); return; }

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    svg.innerHTML =
      `<defs><filter id="${id}" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">
        <feImage x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"></feImage>
        <feDisplacementMap in="SourceGraphic" in2="map" result="dR"></feDisplacementMap>
        <feColorMatrix in="dR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cR"></feColorMatrix>
        <feDisplacementMap in="SourceGraphic" in2="map" result="dG"></feDisplacementMap>
        <feColorMatrix in="dG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cG"></feColorMatrix>
        <feDisplacementMap in="SourceGraphic" in2="map" result="dB"></feDisplacementMap>
        <feColorMatrix in="dB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cB"></feColorMatrix>
        <feBlend in="cR" in2="cG" mode="screen" result="rg"></feBlend>
        <feBlend in="rg" in2="cB" mode="screen" result="out"></feBlend>
        <feGaussianBlur in="out" stdDeviation="${o.displace}"></feGaussianBlur>
      </filter></defs>`;
    document.body.appendChild(svg);

    const feImage = svg.querySelector('feImage');
    const disps = svg.querySelectorAll('feDisplacementMap');
    const offsets = [o.red, o.green, o.blue];
    disps.forEach((d, i) => {
      d.setAttribute('scale', String(o.distortion + offsets[i]));
      d.setAttribute('xChannelSelector', o.xChannel);
      d.setAttribute('yChannelSelector', o.yChannel);
    });

    function updateMap() {
      const r = el.getBoundingClientRect();
      const w = Math.max(1, r.width), h = Math.max(1, r.height);
      const edge = Math.min(w, h) * (o.borderWidth * 0.5);
      const m =
        `<svg viewBox="0 0 ${w} ${h}" xmlns="${NS}"><defs>` +
        `<linearGradient id="rg" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>` +
        `<linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs>` +
        `<rect width="${w}" height="${h}" fill="black"/>` +
        `<rect width="${w}" height="${h}" rx="${o.radius}" fill="url(#rg)"/>` +
        `<rect width="${w}" height="${h}" rx="${o.radius}" fill="url(#bg)" style="mix-blend-mode:${o.mixBlend}"/>` +
        `<rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="${o.radius}" fill="hsl(0 0% ${o.brightness}% / ${o.opacity})" style="filter:blur(${o.blur}px)"/>` +
        `</svg>`;
      feImage.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(m));
    }
    el.classList.add('glass-surface--svg');
    el.style.backdropFilter = `url(#${id}) saturate(${o.saturation})`;
    updateMap();
    if ('ResizeObserver' in window) new ResizeObserver(() => setTimeout(updateMap, 0)).observe(el);
    window.addEventListener('resize', () => setTimeout(updateMap, 60), { passive: true });
  }

  function init() { document.querySelectorAll('[data-glass]').forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
