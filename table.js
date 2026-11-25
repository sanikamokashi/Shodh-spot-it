// The card table on play.html: its colours and its kolam border.
//
// Colours: each game mode has its own set (table floor, border, text, buttons,
// card edges and backs), plus one set for the boxes on the table (the clock box
// in Beat the clock, the card about each symbol you find, the finish card).
// Change the defaults in SETTINGS below; open play.html?dev to try colours live
// (play-dev.js) and "Copy settings" to bring them back here.
//
// Border: the rice-flour kolam around the table, drawn as SVG so it can be built
// a piece at a time. It has 10 sections, going clockwise from the top-left
// corner: 3 along the top, 2 down the right, 3 back along the bottom, 2 up the
// left. Each section starts as dots and its line draws in when you get there.
(function () {
  const PRESETS = {
    peacock: {
      floor: '#0d5c63', line: '#f3ead6', accent: '#d9b45a', text: '#f3ead6', number: '#ecc96e',
      btnText: '#f3ead6', btnLine: '#f3ead6', btnOn: '#f6efdf', btnOnText: '#0b4a50',
      start: '#f6efdf', startText: '#0b4a50', cardEdge: '#efe3c4', back: '#f3ead6', backMark: '#b8913f',
    },
    maroon: {
      floor: '#8a3324', line: '#f3e6cc', accent: '#e7b94c', text: '#f3e6cc', number: '#ecc96e',
      btnText: '#f3e6cc', btnLine: '#f3e6cc', btnOn: '#f6efdf', btnOnText: '#6e2618',
      start: '#f6efdf', startText: '#6e2618', cardEdge: '#ecdcb8', back: '#efe5cf', backMark: '#b48f52',
    },
    ivory: {
      floor: '#f1e8d4', line: '#9a4a2c', accent: '#c9a227', text: '#5a3a28', number: '#0d5c63',
      btnText: '#0d5c63', btnLine: '#0d5c63', btnOn: '#0d5c63', btnOnText: '#f6efdf',
      start: '#0d5c63', startText: '#f6efdf', cardEdge: '#c9a227', back: '#0d5c63', backMark: '#e7c77a',
    },
  };
  // The boxes on the table: the clock box (Beat the clock) and the card about
  // the symbol you found (Kolam journey), and the finish card
  const BOX_PRESETS = {
    ivory:   { bg: '#fbf6ea', text: '#3f3a2e', number: '#0d5c63', ring: '#c9a227', pile: '#d9b45a' },
    white:   { bg: '#ffffff', text: '#4a3a2e', number: '#0f6e6e', ring: '#c9a227', pile: '#d9b45a' },
    peacock: { bg: '#0a4a50', text: '#f3ead6', number: '#ecc96e', ring: '#ecc96e', pile: '#ecc96e' },
  };

  const SETTINGS = {
    journey: Object.assign({ preset: 'peacock' }, PRESETS.peacock),
    clock:   Object.assign({ preset: 'peacock' }, PRESETS.peacock),
    box:     Object.assign({ preset: 'ivory' }, BOX_PRESETS.ivory),
  };
  const DEFAULTS = JSON.parse(JSON.stringify(SETTINGS));

  const VARS = {
    floor: '--t-floor', line: '--t-line', accent: '--t-accent', text: '--t-text', number: '--t-number',
    btnText: '--t-btn', btnLine: '--t-btn-line', btnOn: '--t-on', btnOnText: '--t-on-text',
    start: '--t-start', startText: '--t-start-text', cardEdge: '--t-card-edge', back: '--t-back', backMark: '--t-back-mark',
  };
  const BOX_VARS = { bg: '--x-bg', text: '--x-text', number: '--x-number', ring: '--x-ring', pile: '--x-pile' };

  // Colour the table and its boxes for a mode
  function apply(mode) {
    const game = document.getElementById('game');
    if (!game) return;
    const t = SETTINGS[mode] || SETTINGS.journey, x = SETTINGS.box;
    Object.keys(VARS).forEach(k => game.style.setProperty(VARS[k], t[k]));
    Object.keys(BOX_VARS).forEach(k => game.style.setProperty(BOX_VARS[k], x[k]));
    // light floors and boxes want softer shading than dark ones
    const lum = hex => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
    game.classList.toggle('is-light', lum(t.floor) > 0.6);
    game.classList.toggle('box-dark', lum(x.bg) < 0.4);
  }

  /* ---------- The kolam border ---------- */
  // One tile of the two-strand braid, in its own units: 96.47 long, ±44 across.
  const STRAND = [[0, 0], [16.88, -16.88], [10.4, -4.58], [24.12, -24.12], [37.84, -4.58], [31.35, -16.88], [48.24, 0],
    [65.12, 16.88], [58.63, 4.58], [72.35, 24.12], [86.07, 4.58], [79.59, 16.88], [96.47, 0]];
  const TILE = 96.47, HALF = 44;
  const SECTIONS = [['top', 3], ['right', 2], ['bottom', 3], ['left', 2]];   // clockwise, 10 in all
  const STEPS = SECTIONS.reduce((n, s) => n + s[1], 0);

  const f = v => v.toFixed(1);
  const split = (n, parts) => { const out = []; let a = 0; for (let i = 0; i < parts; i++) { const b = Math.round(((i + 1) * n) / parts); out.push([a, b]); a = b; } return out; };

  function makeBorder(frame) {
    if (!frame) return null;
    const NS = 'http://www.w3.org/2000/svg';
    let done = 0;

    function build() {
      const W = frame.clientWidth, H = frame.clientHeight;
      if (!W || !H) return;
      const b = parseFloat(getComputedStyle(frame).getPropertyValue('--b')) || 40;
      const k = b / (2 * HALF);                        // tile units across → px
      const lw = Math.max(1, 3 * k), rDot = Math.max(1.2, 5.5 * k), rAcc = Math.max(1, 4.5 * k);
      // a side: where it starts, which way it runs, how long it is
      const side = {
        top:    { x: b, y: b / 2, dx: 1, dy: 0, len: W - 2 * b, rev: false },
        right:  { x: W - b / 2, y: b, dx: 0, dy: 1, len: H - 2 * b, rev: false },
        bottom: { x: b, y: H - b / 2, dx: 1, dy: 0, len: W - 2 * b, rev: true },
        left:   { x: b / 2, y: b, dx: 0, dy: 1, len: H - 2 * b, rev: true },
      };
      const corner = { top: [b / 2, b / 2], right: [W - b / 2, b / 2], bottom: [W - b / 2, H - b / 2], left: [b / 2, H - b / 2] };

      let svg = `<svg xmlns="${NS}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="--tb-lw:${f(lw)}px">`;
      let sec = 0, dotIndex = 0;
      SECTIONS.forEach(([name, parts]) => {
        const s = side[name];
        const n = Math.max(parts, Math.round(s.len / (1.1 * b)));
        const tw = s.len / n;
        // along: distance along the side; across: offset from its centre line
        const pt = (along, across) => (s.dx ? [s.x + along, s.y + across] : [s.x + across, s.y + along]);
        const ranges = split(n, parts);
        const order = s.rev ? ranges.slice().reverse() : ranges;
        order.forEach(([t0, t1], j) => {
          let lines = '', dots = '', accs = '';
          if (j === 0) {                                   // each side's first section starts with its corner
            const [cx, cy] = corner[name];
            const c = q => (q * k * 2 * HALF / 88);
            const dia = `M${f(cx)} ${f(cy - c(34))}C${f(cx + c(9))} ${f(cy - c(9))} ${f(cx + c(9))} ${f(cy - c(9))} ${f(cx + c(34))} ${f(cy)}C${f(cx + c(9))} ${f(cy + c(9))} ${f(cx + c(9))} ${f(cy + c(9))} ${f(cx)} ${f(cy + c(34))}C${f(cx - c(9))} ${f(cy + c(9))} ${f(cx - c(9))} ${f(cy + c(9))} ${f(cx - c(34))} ${f(cy)}C${f(cx - c(9))} ${f(cy - c(9))} ${f(cx - c(9))} ${f(cy - c(9))} ${f(cx)} ${f(cy - c(34))}Z`;
            lines += `<path class="tb-line" pathLength="1" d="${dia}"/><circle class="tb-line" pathLength="1" cx="${f(cx)}" cy="${f(cy)}" r="${f(c(14))}"/>`;
            dots += `<circle class="tb-dot" style="--c:${dotIndex++}" cx="${f(cx)}" cy="${f(cy)}" r="${f(rDot)}"/>`;
            [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([u, v]) => { accs += `<circle cx="${f(cx + u * c(24))}" cy="${f(cy + v * c(24))}" r="${f(rAcc)}"/>`; });
          }
          [1, -1].forEach(sign => {
            // one strand through tiles t0..t1, in drawing order
            const segs = [];
            for (let t = t0; t < t1; t++) {
              const P = STRAND.map(([u, v]) => pt(t * tw + (u / TILE) * tw, sign * v * k));
              for (let i = 0; i < 12; i += 3) segs.push([P[i], P[i + 1], P[i + 2], P[i + 3]]);
            }
            const seq = s.rev ? segs.reverse().map(([a, c1, c2, z]) => [z, c2, c1, a]) : segs;
            lines += `<path class="tb-line" pathLength="1" d="M${f(seq[0][0][0])} ${f(seq[0][0][1])}${seq.map(g => `C${g.slice(1).map(p => `${f(p[0])} ${f(p[1])}`).join(' ')}`).join('')}"/>`;
          });
          const tiles = [];
          for (let t = t0; t < t1; t++) tiles.push(t);
          (s.rev ? tiles.reverse() : tiles).forEach(t => {
            const us = s.rev ? [72.35, 24.12] : [24.12, 72.35];
            us.forEach(u => {
              const [x, y] = pt(t * tw + (u / TILE) * tw, 0);
              dots += `<circle class="tb-dot" style="--c:${dotIndex++}" cx="${f(x)}" cy="${f(y)}" r="${f(rDot)}"/>`;
              [-1, 1].forEach(v => { const [ax, ay] = pt(t * tw + (u / TILE) * tw, v * 38.59 * k); accs += `<circle cx="${f(ax)}" cy="${f(ay)}" r="${f(rAcc)}"/>`; });
            });
          });
          svg += `<g class="tb-sec${sec < done ? ' is-on' : ''}" data-i="${sec}"><g class="tb-lines">${lines}</g><g class="tb-acc">${accs}</g><g class="tb-dots">${dots}</g></g>`;
          sec++;
        });
      });
      frame.innerHTML = svg + '</svg>';
      frame.style.setProperty('--tb-n', dotIndex);
    }

    // n sections drawn; animate = draw the newest one in
    function setProgress(n, animate = true) {
      done = Math.max(0, Math.min(STEPS, n));
      const svg = frame.querySelector('svg');
      if (!svg) return;
      svg.classList.remove('is-wave');
      svg.classList.toggle('tb-now', !animate);
      svg.querySelectorAll('.tb-sec').forEach(g => g.classList.toggle('is-on', +g.dataset.i < done));
      if (!animate) requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.remove('tb-now')));
    }
    // the finished border: a ripple runs once around the dots
    function wave() {
      const svg = frame.querySelector('svg');
      if (!svg) return;
      svg.classList.remove('is-wave'); void svg.getBoundingClientRect(); svg.classList.add('is-wave');
    }

    build();
    // keep the border fitted to the table: it grows when the "learn" card shows,
    // and changes with the window. ResizeObserver where it fires, plus a check
    // whenever the game's content changes.
    let w = frame.clientWidth, h = frame.clientHeight, timer;
    function fit() {
      if (frame.clientWidth === w && frame.clientHeight === h) return;
      w = frame.clientWidth; h = frame.clientHeight;
      build();
      const svg = frame.querySelector('svg');
      if (svg) svg.classList.add('tb-now');
      setProgress(done, false);
    }
    const soon = () => { clearTimeout(timer); timer = setTimeout(fit, 30); };
    if (window.ResizeObserver) new ResizeObserver(soon).observe(frame);
    window.addEventListener('resize', soon);
    if (frame.parentElement && window.MutationObserver) new MutationObserver(soon).observe(frame.parentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
    return { setProgress, wave, fit, steps: STEPS, get done() { return done; } };
  }

  window.ShodhTable = { settings: SETTINGS, defaults: DEFAULTS, presets: PRESETS, boxPresets: BOX_PRESETS, apply, makeBorder, STEPS };
})();
