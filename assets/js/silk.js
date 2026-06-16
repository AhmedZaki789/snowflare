/* =====================================================================
   Silk — animated flowing background (minimal WebGL, no dependencies)
   Shader ported from reactbits.dev <Silk/>. Auto-mounts on every .silk
   element; renders only while on-screen (IntersectionObserver-gated).
   ===================================================================== */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
  const FRAG = [
    'precision highp float;',
    'uniform float uTime,uSpeed,uScale,uRotation,uNoise;',
    'uniform vec3 uColor;uniform vec2 uRes;',
    'const float e=2.71828182845904523536;',
    'float noise(vec2 t){float G=e;vec2 r=G*sin(G*t);return fract(r.x*r.y*(1.0+t.x));}',
    'vec2 rot(vec2 uv,float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c)*uv;}',
    'void main(){',
    '  vec2 fc=gl_FragCoord.xy;',
    '  vec2 uv0=fc/uRes;',
    '  float rnd=noise(fc);',
    '  vec2 uv=rot(uv0*uScale,uRotation);',
    '  vec2 tex=uv*uScale;',
    '  float tO=uSpeed*uTime;',
    '  tex.y+=0.03*sin(8.0*tex.x-tO);',
    '  float pattern=0.6+0.4*sin(5.0*(tex.x+tex.y+cos(3.0*tex.x+5.0*tex.y)+0.02*tO)+sin(20.0*(tex.x+tex.y-0.1*tO)));',
    '  vec3 col=uColor*pattern-(rnd/15.0)*uNoise;',
    '  gl_FragColor=vec4(col,1.0);',
    '}'
  ].join('\n');

  function hexToRGB(hex) {
    hex = (hex || '#A9D6FF').replace('#', '');
    return [parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255];
  }
  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn('Silk shader:', gl.getShaderInfoLog(s));
    return s;
  }

  function mount(container) {
    const color = hexToRGB(container.dataset.color);
    const speed = parseFloat(container.dataset.speed || '4');
    const scale = parseFloat(container.dataset.scale || '1');
    const noise = parseFloat(container.dataset.noise || '1.5');
    const rotation = parseFloat(container.dataset.rotation || '0');

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    if (!gl) { container.style.background = 'var(--navy-2, #101c38)'; return null; }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {};
    ['uTime', 'uSpeed', 'uScale', 'uRotation', 'uNoise', 'uColor', 'uRes'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
    gl.uniform1f(U.uSpeed, speed);
    gl.uniform1f(U.uScale, scale);
    gl.uniform1f(U.uRotation, rotation);
    gl.uniform1f(U.uNoise, noise);
    gl.uniform3f(U.uColor, color[0], color[1], color[2]);

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    function size() {
      const w = container.clientWidth || 2, h = container.clientHeight || 2;
      canvas.width = Math.max(2, Math.round(w * DPR));
      canvas.height = Math.max(2, Math.round(h * DPR));
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
    }
    size();

    let t = Math.random() * 50, raf = null, running = false;
    function frame() { t += 0.016; gl.uniform1f(U.uTime, t); gl.drawArrays(gl.TRIANGLES, 0, 3); if (running) raf = requestAnimationFrame(frame); }
    function draw1() { gl.uniform1f(U.uTime, t); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    draw1(); // paint an initial frame immediately

    return {
      start() { if (running || reduce) return; running = true; frame(); },
      stop() { running = false; if (raf) cancelAnimationFrame(raf); },
      size() { size(); draw1(); }
    };
  }

  function init() {
    const nodes = [...document.querySelectorAll('.silk')];
    const insts = nodes.map(n => ({ n, s: mount(n) })).filter(x => x.s);
    if (!insts.length) return;
    let to;
    window.addEventListener('resize', () => { clearTimeout(to); to = setTimeout(() => insts.forEach(i => i.s.size()), 150); }, { passive: true });
    if (reduce || !('IntersectionObserver' in window)) return; // static single frame already painted
    const io = new IntersectionObserver(es => {
      es.forEach(e => { const i = insts.find(x => x.n === e.target); if (i) (e.isIntersecting ? i.s.start() : i.s.stop()); });
    }, { rootMargin: '160px 0px' });
    insts.forEach(i => io.observe(i.n));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
