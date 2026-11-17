/* ==========================================================================
   Curved work slider — raw WebGL.
   Cards live on the inside of a cylinder: the centre card faces you, the
   neighbours bend towards the camera, with a little RGB split at the edges.
   Scroll drives it (pinned), with a soft "dwell" on every card.
   ========================================================================== */
(function () {
  const VERT = `
    attribute vec2 aPos;
    uniform vec2 uRes, uSize;
    uniform float uX, uY, uR, uF, uScale;
    varying vec2 vUv;
    varying float vEdge;
    void main() {
      vec2 p = aPos * uSize * uScale + vec2(uX, uY);
      float a = clamp(p.x / uR, -1.45, 1.45);       // arc length -> angle on the cylinder
      float x = sin(a) * uR;
      float z = (1.0 - cos(a)) * uR;                // towards the viewer
      float s = uF / (uF - z);                      // perspective
      vec2 sp = vec2(x, p.y) * s;
      gl_Position = vec4(sp / (uRes * 0.5), 0.0, 1.0);
      vUv = aPos + 0.5;
      vEdge = clamp(abs(x * s) / (uRes.x * 0.5), 0.0, 1.0);
    }`;
  const FRAG = `
    precision highp float;
    uniform sampler2D uTex;
    uniform vec2 uSize;
    uniform float uAlpha, uSplit;
    varying vec2 vUv;
    varying float vEdge;
    float rbox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
    void main() {
      vec2 px = (vUv - 0.5) * uSize;
      float d = rbox(px, uSize * 0.5, 16.0);
      float a = 1.0 - smoothstep(-1.0, 0.5, d);
      float off = (vEdge * vEdge * 0.011) + uSplit;
      vec3 c;
      c.r = texture2D(uTex, vUv + vec2(off, 0.0)).r;
      c.g = texture2D(uTex, vUv).g;
      c.b = texture2D(uTex, vUv - vec2(off, 0.0)).b;
      c *= 1.0 - vEdge * 0.38;
      gl_FragColor = vec4(c * a * uAlpha, a * uAlpha);
    }`;

  // ---------- texture drawing ----------
  let fontCSS = null;
  async function embeddedFonts() {
    if (fontCSS !== null) return fontCSS;
    const b64 = async (url) => {
      const buf = await (await fetch(url)).arrayBuffer();
      let s = ''; const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return btoa(s);
    };
    try {
      const [a, m] = await Promise.all([b64('fonts/Archivo.woff2'), b64('fonts/JetBrainsMono.woff2')]);
      fontCSS = `@font-face{font-family:Archivo;src:url(data:font/woff2;base64,${a}) format('woff2');font-weight:100 900;font-stretch:62% 125%}` +
        `@font-face{font-family:'JetBrains Mono';src:url(data:font/woff2;base64,${m}) format('woff2');font-weight:100 900}`;
    } catch { fontCSS = ''; }
    return fontCSS;
  }

  function svgToImage(svg, w, h, css) {
    const sized = svg.replace('<svg ', `<svg width="${w}" height="${h}" `).replace(/(<svg[^>]*>)/, `$1<defs><style>${css}</style></defs>`);
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sized);
    });
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  async function drawCard(p, i, n, portrait) {
    const W = portrait ? 1000 : 1600, H = portrait ? 1250 : 1000;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#242320'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(238,234,225,.075)'; ctx.lineWidth = 1.5;
    for (let x = 0; x <= W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    ctx.strokeStyle = 'rgba(238,234,225,.16)'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, W - 4, H - 4);

    // corner meta
    ctx.fillStyle = 'rgba(238,234,225,.55)';
    ctx.font = '500 24px "JetBrains Mono", monospace'; ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left'; ctx.fillText(String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0'), 50, 70);
    ctx.textAlign = 'right'; ctx.fillText(p.year, W - 50, 70);

    // title + kind
    ctx.textAlign = 'center'; ctx.fillStyle = '#EEEAE1';
    ctx.font = `900 ${portrait ? 118 : 150}px Archivo, "Arial Black", sans-serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '-6px';
    ctx.fillText(p.title, W / 2, portrait ? 190 : 205);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
    ctx.fillStyle = p.accent; ctx.font = '500 26px "JetBrains Mono", monospace';
    ctx.fillText(p.kind.toUpperCase(), W / 2, portrait ? 245 : 262);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

    // browser window with the cover art
    const bw = portrait ? 860 : 820, bh = bw * 0.75 + 46, bx = (W - bw) / 2, by = portrait ? 330 : 312;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
    rr(ctx, bx, by, bw, bh, 18); ctx.fillStyle = '#EEEAE1'; ctx.fill(); ctx.restore();
    ['#FF4F1F', '#D8D2C6', '#D8D2C6'].forEach((col, k) => { ctx.beginPath(); ctx.arc(bx + 30 + k * 24, by + 23, 7, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); });
    rr(ctx, bx + bw / 2 - 170, by + 10, 340, 26, 13); ctx.fillStyle = '#E2DCD0'; ctx.fill();
    ctx.fillStyle = '#5b5750'; ctx.font = '400 17px "JetBrains Mono", monospace'; ctx.fillText(p.url, W / 2, by + 29);
    const img = await svgToImage(p.art, 1200, 900, await embeddedFonts());
    ctx.save(); rr(ctx, bx, by + 46, bw, bh - 46, 0); ctx.clip();
    if (img) ctx.drawImage(img, bx, by + 46, bw, bh - 46);
    ctx.restore();
    ctx.save(); rr(ctx, bx, by, bw, bh, 18); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke(); ctx.restore();
    return c;
  }

  // ---------- slider ----------
  window.initWorkSlider = async function ({ section, projects, onOpen, onIndex, setCursor, scrollTo, lenis, reduced }) {
    const canvas = section.querySelector('.works__gl');
    const pin = section.querySelector('.works__pin');
    let gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true });
    const isGL2 = !!gl;
    if (!gl) gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!gl || reduced) return false;

    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram();
    try {
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { console.warn('slider: falling back', e); return false; }
    gl.useProgram(prog);

    // subdivided plane, -0.5..0.5
    const SX = 32, SY = 16, pos = [], idx = [];
    for (let y = 0; y <= SY; y++) for (let x = 0; x <= SX; x++) pos.push(x / SX - 0.5, y / SY - 0.5);
    for (let y = 0; y < SY; y++) for (let x = 0; x < SX; x++) {
      const a = y * (SX + 1) + x, b = a + 1, c = a + SX + 1, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['uRes', 'uSize', 'uX', 'uY', 'uR', 'uF', 'uScale', 'uTex', 'uAlpha', 'uSplit'].forEach((k) => (U[k] = gl.getUniformLocation(prog, k)));
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let textures = [];
    let portrait = null;
    const n = projects.length;

    section.classList.add('has-gl');

    // layout
    let vw = 0, vh = 0, cw = 0, ch = 0, spacing = 0, R = 0, F = 0, yOff = 0;
    function layout() {
      vw = pin.clientWidth; vh = pin.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const mobile = vw < 700;
      if (portrait !== null && mobile !== portrait) buildTextures(mobile);
      cw = mobile ? Math.min(vw * 0.8, vh * 0.6 * 0.8) : Math.min(vw * 0.56, vh * 0.66 * 1.6);
      ch = cw / (mobile ? 0.8 : 1.6);
      spacing = cw * (mobile ? 1.08 : 1.1);
      R = vw * (mobile ? 0.9 : 0.6);
      F = vw * (mobile ? 1.6 : 1.25);
      yOff = -vh * (mobile ? 0.02 : 0.07);
    }
    layout();

    // state
    let target = 0, cur = 0, prev = 0, hover = 0, hoverT = 0, active = -1, visible = false, dirty = true;
    const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const stepped = (t) => { const i = Math.floor(t); return Math.min(n - 1, i + smooth(0.12, 0.88, t - i)); };

    const st = ScrollTrigger.create({
      trigger: section, start: 'top top', end: () => `+=${(n - 1) * innerHeight * 0.85}`,
      pin: pin, scrub: true, invalidateOnRefresh: true,
      onUpdate: (self) => { target = stepped(self.progress * (n - 1)); dirty = true; },
      onRefresh: () => { layout(); dirty = true; },
    });

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; dirty = true; });
    io.observe(section);
    window.__keepAlive = (window.__keepAlive || []).concat(io);

    function render() {
      if (!visible || !textures.length || window.__caseOpen) return;
      prev = cur;
      cur += (target - cur) * 0.12;
      hover += (hoverT - hover) * 0.12;
      const vel = cur - prev;
      if (!dirty && Math.abs(target - cur) < 0.0005 && Math.abs(hoverT - hover) < 0.001) return;
      dirty = false;

      const a = Math.round(cur);
      if (a !== active) { active = a; onIndex(a); }

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uRes, vw, vh);
      gl.uniform2f(U.uSize, cw, ch);
      gl.uniform1f(U.uY, yOff);
      const bend = Math.min(Math.abs(vel) * 6, 0.35);
      gl.uniform1f(U.uR, R * (1 - bend));
      gl.uniform1f(U.uF, F);
      gl.uniform1f(U.uSplit, Math.min(Math.abs(vel) * 0.02, 0.0035));
      for (let i = 0; i < n; i++) {
        const x = (i - cur) * spacing;
        if (Math.abs(x) > vw * 1.3) continue;
        gl.uniform1f(U.uX, x);
        gl.uniform1f(U.uScale, i === active ? 1 + hover * 0.025 : 1);
        gl.uniform1f(U.uAlpha, 1);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, textures[i]);
        gl.uniform1i(U.uTex, 0);
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      }
    }
    gsap.ticker.add(render);

    // interaction
    const hit = (e) => {
      const r = canvas.getBoundingClientRect();
      const dx = e.clientX - r.left - vw / 2, dy = -(e.clientY - r.top - vh / 2) - yOff;
      if (Math.abs(dx) < cw / 2 && Math.abs(dy) < ch / 2) return 0;
      return dx > 0 ? 1 : -1;
    };
    const goTo = (k) => {
      k = Math.max(0, Math.min(n - 1, k));
      scrollTo(st.start + (st.end - st.start) * (k / (n - 1)) + 2);
    };
    canvas.addEventListener('pointermove', (e) => {
      const h = hit(e);
      hoverT = h === 0 ? 1 : 0; dirty = true;
      const atStart = active === 0, atEnd = active === n - 1;
      if (h === 0) setCursor(projects[active]?.key === 'next' ? 'let’s talk' : 'open the case');
      else if (h > 0 && !atEnd) setCursor('next →');
      else if (h < 0 && !atStart) setCursor('← previous');
      else setCursor('');
    });
    canvas.addEventListener('pointerleave', () => { hoverT = 0; dirty = true; setCursor(''); });
    canvas.addEventListener('click', (e) => {
      const h = hit(e);
      if (h === 0) onOpen(projects[active].key);
      else goTo(active + h);
    });
    addEventListener('keydown', (e) => {
      if (!visible || document.querySelector('.case.is-open')) return;
      if (e.key === 'ArrowRight') goTo(active + 1);
      if (e.key === 'ArrowLeft') goTo(active - 1);
    });
    addEventListener('resize', () => { layout(); dirty = true; });

    // textures (async — the pin & layout above already exist, so nothing jumps)
    async function buildTextures(port) {
      portrait = port;
      await Promise.all([document.fonts.load('900 150px Archivo'), document.fonts.load('500 26px "JetBrains Mono"')]).catch(() => {});
      const cards = await Promise.all(projects.map((p, i) => drawCard(p, i, n, port)));
      if (port !== portrait) return; // a newer build superseded this one
      textures.forEach((t) => gl.deleteTexture(t));
      textures = cards.map((c) => {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (isGL2) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
        else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return t;
      });
      dirty = true;
    }
    await buildTextures(vw < 700);
    dirty = true;
    return true;
  };
})();
