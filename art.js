/* Generated cover art — inline SVG so web fonts apply and nothing has to download. */
(function () {
  const P = { paper: '#EEEAE1', ink: '#111010', orange: '#FF4F1F', blue: '#2536C8', green: '#2F5D3A', pink: '#F4B6CE', yellow: '#FFD23F', mint: '#B9DBC2' };
  const F = 'font-family="Archivo, sans-serif"';
  const M = 'font-family="JetBrains Mono, monospace"';

  function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }
  const svg = (inner, vb = '0 0 400 300') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;

  function podtube() {
    const r = rng(7); let bars = '';
    for (let i = 0; i < 46; i++) {
      const h = 6 + Math.abs(Math.sin(i * .55)) * 34 * (.45 + r() * .55);
      bars += `<rect x="${28 + i * 7.5}" y="${222 - h / 2}" width="4.2" height="${h}" rx="2.1" fill="${P.yellow}"/>`;
    }
    return svg(`<rect width="400" height="300" fill="${P.blue}"/>
      <rect x="28" y="34" width="166" height="128" rx="10" fill="${P.paper}"/>
      <rect x="206" y="34" width="166" height="128" rx="10" fill="${P.orange}"/>
      <circle cx="111" cy="88" r="21" fill="${P.blue}"/><path d="M69 162c3-32 22-46 42-46s39 14 42 46z" fill="${P.blue}"/>
      <circle cx="289" cy="88" r="21" fill="${P.paper}"/><path d="M247 162c3-32 22-46 42-46s39 14 42 46z" fill="${P.paper}"/>
      <rect x="38" y="44" width="50" height="17" rx="8.5" fill="${P.ink}"/><circle cx="49" cy="52.5" r="4" fill="${P.orange}"/>
      <text x="58" y="56.5" ${M} font-size="9.5" fill="${P.paper}">REC</text>
      ${bars}
      <text x="28" y="282" ${F} font-weight="900" font-size="24" letter-spacing="-1" fill="${P.paper}">pod-tube</text>
      <text x="372" y="281" text-anchor="end" ${M} font-size="10" fill="${P.paper}" opacity=".75">00:42:17 · 2 live</text>`);
  }

  function parking() {
    let streets = '';
    for (let i = -2; i < 9; i++) streets += `<path d="M${i * 62 - 40} -20 L${i * 62 + 40} 330" stroke="${P.paper}" stroke-width="${i % 3 ? 3 : 9}" opacity="${i % 3 ? .25 : .55}"/>`;
    for (let i = 0; i < 6; i++) streets += `<path d="M-20 ${i * 60 + 10} L420 ${i * 60 - 20}" stroke="${P.paper}" stroke-width="${i % 2 ? 3 : 8}" opacity="${i % 2 ? .25 : .5}"/>`;
    const pin = (x, y, c, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0c-14-16-22-26-22-37a22 22 0 0 1 44 0c0 11-8 21-22 37z" fill="${c}" stroke="${P.ink}" stroke-width="2.5"/><text x="0" y="-30" text-anchor="middle" ${F} font-weight="900" font-size="22" fill="${P.paper}">P</text></g>`;
    return svg(`<rect width="400" height="300" fill="${P.green}"/>${streets}
      <path d="M60 250 C 120 230, 140 160, 210 150 S 300 110, 318 92" fill="none" stroke="${P.yellow}" stroke-width="5" stroke-dasharray="2 11" stroke-linecap="round"/>
      <circle cx="60" cy="250" r="9" fill="${P.yellow}" stroke="${P.ink}" stroke-width="2.5"/>
      ${pin(318, 98, P.orange, 1.25)}${pin(150, 120, P.blue, .8)}${pin(268, 228, P.blue, .8)}
      <rect x="226" y="20" width="150" height="42" rx="21" fill="${P.paper}"/>
      <text x="246" y="46" ${M} font-size="11" fill="${P.ink}">3 SPOTS · 120M</text>
      <text x="24" y="40" ${F} font-weight="900" font-size="24" letter-spacing="-1" fill="${P.paper}">smart parking</text>`);
  }

  function xinterview() {
    const row = (y, q, tag, c) => `
      <rect x="44" y="${y}" width="312" height="30" rx="7" fill="#F7F4EE"/>
      <circle cx="60" cy="${y + 15}" r="7" fill="${c}"/><path d="M56.5 ${y + 15}l2.5 2.5 4.5-5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
      <text x="76" y="${y + 19.5}" ${F} font-weight="600" font-size="11.5" fill="${P.ink}">${q}</text>
      <text x="344" y="${y + 19}" text-anchor="end" ${M} font-size="8.5" fill="#8b867c">${tag}</text>`;
    return svg(`<rect width="400" height="300" fill="${P.orange}"/>
      <rect x="28" y="26" width="344" height="248" rx="14" fill="${P.paper}"/>
      <text x="44" y="54" ${F} font-weight="800" font-size="15" fill="${P.ink}">AI Interview Builder</text>
      <rect x="250" y="40" width="106" height="20" rx="10" fill="${P.ink}"/>
      <text x="303" y="53.5" text-anchor="middle" ${M} font-size="8.5" fill="${P.paper}">✦ GENERATE</text>
      <text x="44" y="78" ${M} font-size="8.5" fill="#8b867c">ROLE</text>
      <rect x="76" y="68" width="128" height="15" rx="7.5" fill="${P.blue}"/>
      <text x="140" y="78.5" text-anchor="middle" ${M} font-size="8" fill="${P.paper}">FRONTEND ENGINEER</text>
      <text x="212" y="78" ${M} font-size="8.5" fill="#8b867c">· MID-LEVEL</text>
      ${row(94, 'How does React decide what to re-render?', 'CONCEPT', P.blue)}
      ${row(130, 'Debug a slow Next.js page, step by step', 'PRACTICAL', P.green)}
      ${row(166, 'Design a rate limiter for a public API', 'SYSTEM', P.orange)}
      <text x="44" y="216" ${M} font-size="8.5" fill="#8b867c">+ 197 MORE, TAILORED TO THE ROLE &amp; CANDIDATE</text>
      <line x1="44" y1="230" x2="356" y2="230" stroke="#dcd6ca"/>
      <text x="44" y="256" ${F} font-weight="900" font-size="20" letter-spacing="-.5" fill="${P.ink}">200+ questions</text>
      <text x="356" y="256" text-anchor="end" ${F} font-weight="900" font-size="20" letter-spacing="-.5" fill="${P.green}">setup −40%</text>`);
  }

  function next() {
    return svg(`<rect width="400" height="300" fill="${P.ink}"/>
      <text x="200" y="210" text-anchor="middle" ${F} font-weight="900" font-size="210" letter-spacing="-10" fill="${P.orange}">?</text>
      <path d="M78 84c30-26 70-30 96-8" fill="none" stroke="${P.paper}" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 9"/>
      <text x="24" y="276" ${F} font-weight="800" font-size="22" fill="${P.paper}">your project here</text>
      <text x="376" y="38" text-anchor="end" ${M} font-size="10" fill="${P.paper}" opacity=".6">SLOT 04 · OPEN</text>`);
  }

  function trophy() {
    return svg(`<rect width="400" height="300" fill="${P.yellow}"/>
      <text x="200" y="190" text-anchor="middle" ${F} font-weight="900" font-size="170" letter-spacing="-12" fill="${P.ink}">1st</text>
      <text x="200" y="250" text-anchor="middle" ${M} font-size="13" fill="${P.ink}">ALGATHON ’24 · 200+ CODERS · 100%</text>`);
  }

  function code() {
    return svg(`<rect width="400" height="300" fill="#151413"/>
      <text ${M} font-size="17" x="30" y="80" fill="#8b867c">// hello, world</text>
      <text ${M} font-size="20" x="30" y="125"><tspan fill="#FF8A65">&lt;</tspan><tspan fill="#8FA2FF">Dev</tspan></text>
      <text ${M} font-size="20" x="60" y="160"><tspan fill="#F4B6CE">name</tspan><tspan fill="#D8D3C8">=</tspan><tspan fill="#8FD9A8">"anshik"</tspan></text>
      <text ${M} font-size="20" x="60" y="195"><tspan fill="#F4B6CE">ships</tspan><tspan fill="#D8D3C8">={</tspan><tspan fill="${P.yellow}">true</tspan><tspan fill="#D8D3C8">}</tspan></text>
      <text ${M} font-size="20" x="30" y="230" fill="#FF8A65">/&gt;</text>
      <rect x="70" y="214" width="11" height="20" fill="${P.orange}"/>`);
  }

  function nFace() {
    return svg(`<rect width="400" height="300" fill="${P.paper}"/>
      <text x="200" y="245" text-anchor="middle" ${F} font-weight="900" font-size="280" fill="${P.orange}">n</text>
      <circle cx="168" cy="140" r="12" fill="${P.paper}"/><circle cx="232" cy="140" r="12" fill="${P.paper}"/>
      <circle cx="171" cy="143" r="6" fill="${P.ink}"/><circle cx="235" cy="143" r="6" fill="${P.ink}"/>
      <text x="24" y="40" ${M} font-size="11" fill="${P.ink}">THE COMMON N</text>`);
  }

  function top10() {
    return svg(`<rect width="400" height="300" fill="${P.pink}"/>
      <text x="200" y="185" text-anchor="middle" ${F} font-weight="900" font-size="120" letter-spacing="-8" fill="${P.blue}">top 10</text>
      <text x="200" y="232" text-anchor="middle" ${M} font-size="12" fill="${P.ink}">BHARAT SHIKSHA EXPO HACKATHON</text>
      <circle cx="350" cy="56" r="26" fill="none" stroke="${P.ink}" stroke-width="2.5"/>
      <text x="350" y="62" text-anchor="middle" ${F} font-weight="800" font-size="18" fill="${P.ink}">★</text>`);
  }

  window.ART = {
    covers: { podtube: podtube(), parking: parking(), xinterview: xinterview(), next: next() },
    trail: [podtube(), trophy(), parking(), code(), xinterview(), nFace(), top10()],
  };
})();
