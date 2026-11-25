// Kolam generator + draw-on-scroll.
//
// Builds "pulli kolam"-style drawings with the mirror-curve method: an m × n grid
// of dots, and a line that travels diagonally between them, turning back at the
// edges by looping around the outer dots. Where m and n share no common factor
// the whole design is ONE continuous line, as in a traditional sikku kolam.
// Grids add rings of "mirrors" (points where the line turns back) for rangoli-like petals.
//
// Markup:  <div class="kolam" data-kolam="grid" data-m="6" data-n="6"></div>
//          <div class="kolam" data-kolam="border"></div>   (3-row border, fitted to the content width)
//          <div class="kolam" data-kolam="diamond"></div>  (exported diamond kolam, kolam-diamond.js)
(function () {
  const NS = 'http://www.w3.org/2000/svg';

  // Trace every closed curve on an m × n dot grid, in doubled coordinates:
  // dots sit at (odd, odd); the curve passes through points where x + y is odd.
  // `mirror(x, y)` marks interior points where the line turns back instead of
  // crossing; rings of mirrors give the petals and loops of a real rangoli.
  function curves(m, n, mirror) {
    const W = 2 * m, H = 2 * n;
    const seen = new Set();
    const segKey = (a, b) => (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]))
      ? `${a}|${b}` : `${b}|${a}`;
    const reflect = (p, d) => {
      let [dx, dy] = d;
      const [x, y] = p;
      if (x === 0 && dx < 0) dx = 1;
      if (x === W && dx > 0) dx = -1;
      if (y === 0 && dy < 0) dy = 1;
      if (y === H && dy > 0) dy = -1;
      if (mirror && x > 0 && x < W && y > 0 && y < H && mirror(x, y)) {
        if (x % 2 === 0) dx = -dx; else dy = -dy;
      }
      return [dx, dy];
    };
    const out = [];
    const DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

    for (let x = 0; x <= W; x++) {
      for (let y = 0; y <= H; y++) {
        if ((x + y) % 2 === 0) continue;
        for (const d0 of DIRS) {
          const p0 = [x, y];
          let d = reflect(p0, d0);
          if (seen.has(segKey(p0, [x + d[0], y + d[1]]))) continue;
          const startKey = `${p0}|${d}`;
          const pts = [];
          let p = p0;
          for (let guard = 0; guard < 4 * (W + 1) * (H + 1); guard++) {
            pts.push(p);
            const q = [p[0] + d[0], p[1] + d[1]];
            seen.add(segKey(p, q));
            p = q;
            d = reflect(p, d);
            if (`${p}|${d}` === startKey) break;
          }
          out.push(pts);
        }
      }
    }
    return out;
  }

  // Border kolam: a 3-row sikku kolam (one line looping around every dot), in
  // the style of the artwork exported from the kolam tool (images/kolam-border.svg).
  // It is generated to fit the content width: dots sit exactly 28px apart, the
  // pitch of the page's background dot grid, and alignBorder snaps every kolam
  // dot onto a background dot. At full width (--max: 1204px = 43 columns) the
  // outer loops line up exactly with the content edges.
  //
  // The line is split into PIECES stretches. Each loop starts with a random
  // handful of them missing; those slowly draw themselves in, a few at a time,
  // each with a soft pen tip. When the kolam is complete the dots hop,
  // it rests, the next loop's missing pieces gently fade away, and it repeats.
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GRID = 28;                 // keep in sync with body background-size
  const PIECES = 24;               // shorter pieces, so each fills in quickly at the same pen speed
  const MISSING = [3, 4];          // how many pieces are missing at the start of a loop (min, max)
  const T = {
    firstWait: 1200,               // after the dots rise, the first time it comes into view
    draw: 3500,                    // one piece drawing itself in
    stagger: 900,                  // between one piece starting and the next
    rest: 4500,                    // complete kolam (dots hop at the start of this)
    fade: 3200,                    // next loop's missing pieces fade away
    pause: 900,
  };

  // ---- Look and feel of each kolam (the dev panel, ?dev, edits these live) ----
  // Keys match data-key on each .kolam element. Colours are hex; sizes in px.
  //   speed    1 = normal, 2 = twice as fast
  //   size     hero: dot spacing in px (rounded to the 28px grid so dots stay on it);
  //            math: width of the whole kolam in px. Phones use about 2/3 of it.
  //   rotation degrees. Only 0 (or 90, 180…) keeps the hero dots on the grid.
  //   design   which exported kolam to draw: a key of SHODH_KOLAMS (kolam-diamond.js)
  //   x, y     hero only: centre of the kolam, as % of the card area (desktop)
  //   part     hero only: 1 = the line gently clears away around the mouse and redraws after it (off)
  const SETTINGS = {
    firstStrip: { placement: 'accent', anim: 'sweep', density: 1, shift: 0, length: 0 },
    symbolsStrip: { anim: 'wave' },   // also the strip above "From our family"
    border: { design: 'petal', line: '#eccf9d', dot: '#0f6e6e', accent: '#c9a227', lineWidth: 1.5, dotSize: 2.4, speed: 1 },
    hero:   { design: 'lattice', line: '#087241', dot: '#bf9926', lineWidth: 2.6, dotSize: 2.6, speed: 0.6, opacity: 0.3, size: 84, rotation: 0, x: 100, y: -30, part: 0 },
    math:   { design: 'diamond', line: '#e1cc88', dot: '#e1cc88', lineWidth: 1.3, dotSize: 2.2, speed: 1, opacity: 0.6, size: 460, rotation: 0 },
  };
  const DEFAULTS = JSON.parse(JSON.stringify(SETTINGS));
  const small = window.matchMedia('(max-width: 960px)');
  const settingsOf = el => SETTINGS[el.dataset.key] || SETTINGS.border;

  function applyLook(el) {
    const s = settingsOf(el);
    el.style.setProperty('--k-line', s.line);
    el.style.setProperty('--k-dot', s.dot);
    if (s.accent) el.style.setProperty('--k-accent', s.accent);
    // diamonds are scaled SVGs: give the width in their own units so it shows at lineWidth px
    // (no vector-effect: non-scaling-stroke, which makes some browsers measure the
    // dashes in screen px and leaves pieces that can never finish drawing)
    el.style.setProperty('--k-lw', s.lineWidth / (el._ppu || 1) + 'px');
    if (s.opacity != null) el.style.opacity = s.opacity;
    if (s.x != null) {
      el.style.left = small.matches ? '' : s.x + '%';      // phones keep their CSS position
      el.style.top = small.matches ? '' : s.y + '%';
    }
  }

  const easeSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // Border designs, both generated to fit the width (dots on the 28px grid):
  //   sikku  3 rows, one line weaving around every dot (images/kolam-border.svg)
  //   chain  1 row, a figure-of-eight chain through the dots (images/kolam-border-chain.svg)
  //   petal  1 row with pointed petals over each dot, plus accent dots above and
  //          below every dot and at both ends (images/kolam-border-petal.svg). The
  //          accents sit one grid step out, so they land on background dots too.
  // handle: curve handle as a fraction of half the pitch, matched to each export
  const BORDER_DESIGNS = {
    sikku: { rows: 3, handle: 0.368 },
    chain: { rows: 1, handle: 0.523 },
    petal: { rows: 1, cusp: true, accents: true, height: 4 },
  };
  // Petal handles (fractions of half the pitch) at each kind of point, matched to the export:
  // [across, up/down] — crossings are smooth, tips over the dots and the two ends are pointed
  const CUSP = { crossing: [0.7, 0.7], tip: [0.569, 0.81], end: [0.81, 0.569] };
  const borderDesign = el => BORDER_DESIGNS[settingsOf(el).design] || BORDER_DESIGNS.sikku;

  // Placement of the first border strip (data-place="first", under the hero):
  //   placement  'between' = its own strip between hero and About
  //              'accent'  = a short accent under the "A keepsake with a story" heading
  //   density    1 = dots on every grid dot; 2 = twice as dense (half the size, every
  //              other kolam dot on the grid)
  //   shift      move it down by this many grid rows (between only; the page doesn't move)
  //   length     number of dot columns, 0 = as many as fit
  const isFirst = el => el.dataset.place === 'first';
  // How a border strip animates:
  //   loop   pieces fill in, dots hop, repeat (default)
  //   sweep  draws once, left to right (both strands together), then the outer
  //          accent dots appear together; then stays still
  //   static fully drawn, no animation
  //   hover  fully drawn; the dots ripple outward from the pointer as it passes over
  //   wave   sweeps once the first time it scrolls into view; after that the dots
  //          ripple outward from the pointer as it passes over (lower strips)
  //   bloom  sweeps once the first time it scrolls into view; after that, pointing at
  //          it redraws the line outward from the pointer (restarting from the new
  //          spot even mid-animation)
  // The first strip uses firstStrip.anim; the other strips (below Symbols, above
  // "From our family") use symbolsStrip.anim. Sweep replays each time it comes into
  // view and when pointed at.
  const animOf = el => isFirst(el) ? SETTINGS.firstStrip.anim
    : el.dataset.kolam === 'border' ? SETTINGS.symbolsStrip.anim : 'loop';
  const SWEEP_MS = 2600, BLOOM_MS = 1500;
  const pitchFor = el => GRID / (isFirst(el) ? SETTINGS.firstStrip.density || 1 : 1);

  // Odd column counts keep the kolam centred on the (centred) background grid
  function fitCols(el) {
    const P = pitchFor(el);
    const reserve = borderDesign(el).accents ? 2 * P : 0;   // petal: room for the end accent dots
    const accent = el.classList.contains('kolam-border--accent');
    let n = Math.floor(((accent ? el.parentNode.clientWidth : contentWidth(el)) - reserve) / P);
    const len = isFirst(el) ? SETTINGS.firstStrip.length : 0;
    if (len > 0) n = Math.min(n, len);
    else if (accent) {
      // auto: just longer than the heading's longest line
      // auto: the main dots span the heading's longest line (the end accent dots hang outside)
      const t = headingText();
      if (t) n = Math.min(n, Math.ceil(t.width / P));
      return Math.max(5, n % 2 ? n : n + 1);
    }
    return Math.max(5, n % 2 ? n : n - 1);
  }

  // The About heading's text box: longest line width and bottom of the last line (page px)
  function headingText() {
    const h2 = document.querySelector('#about .sec-head h2');
    if (!h2) return null;
    const range = document.createRange();
    range.selectNodeContents(h2);
    const rects = [...range.getClientRects()].filter(r => r.width > 0);
    if (!rects.length) return null;
    return { width: Math.max(...rects.map(r => r.width)), left: Math.min(...rects.map(r => r.left)) + window.scrollX, bottom: Math.max(...rects.map(r => r.bottom)) + window.scrollY };
  }

  // Move the first strip between its two spots, and apply the shift
  let firstHome = null;
  function placeFirst(el) {
    const s = SETTINGS.firstStrip;
    if (!firstHome) { firstHome = document.createComment('first border strip'); el.before(firstHome); }
    const head = document.querySelector('#about .sec-head');
    if (s.placement === 'accent' && head) { if (el.parentNode !== head) head.appendChild(el); }
    else if (el.previousSibling !== firstHome) firstHome.after(el);
    el.classList.toggle('kolam-border--accent', s.placement === 'accent' && !!head);
    const shift = s.placement === 'accent' ? 0 : (s.shift || 0) * GRID;
    el.style.marginTop = shift ? shift + 'px' : '';
    el.style.marginBottom = shift ? -shift + 'px' : '';
  }

  function contentWidth(el) {
    const cs = getComputedStyle(el);
    return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  }

  let clipCount = 0;
  function buildBorder(el) {
    const D = borderDesign(el);
    const { rows: ROWS, handle: HANDLE } = D;
    if (isFirst(el)) placeFirst(el);
    const P = pitchFor(el);                            // dot spacing in px
    const cols = fitCols(el);
    el.style.height = (D.height || ROWS + 1) * P + 'px';   // in dot rows: sikku 4, chain 2, petal 4
    const h = P / 2;                                   // doubled-coordinate unit, in px
    // accent: shrink-wrap the strip so the kolam starts at the heading's left edge
    el.style.width = el.classList.contains('kolam-border--accent') ? (cols + (D.accents ? 2 : 0)) * P + 'px' : '';
    const dotR = settingsOf(el).dotSize * (P < GRID ? 0.75 : 1);
    const halfW = (cols + (D.accents ? 2 : 0)) * h + 10, halfH = (D.accents ? 2 * h : ROWS * h) + 10;
    const X = x => (x - cols) * h, Y = y => (y - ROWS) * h;
    const f = v => v.toFixed(2);

    // one sub-path per closed curve (a single curve unless cols is a multiple of 3)
    let d = '';
    curves(cols, ROWS, null).forEach(pts => {
      const P = pts.map(([x, y]) => [X(x), Y(y)]);
      const n = P.length;
      if (D.cusp) {
        // handle at point i, pointing towards neighbour j
        const hd = (i, j) => {
          const [x, y] = pts[i], [x2, y2] = pts[j];
          const w = (x === 0 || x === 2 * cols) ? CUSP.end : (y === 0 || y === 2 * ROWS) ? CUSP.tip : CUSP.crossing;
          return [Math.sign(x2 - x) * w[0] * h, Math.sign(y2 - y) * w[1] * h];
        };
        d += `M${f(P[0][0])} ${f(P[0][1])}`;
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n, a = hd(i, j), b = hd(j, i);
          d += `C${f(P[i][0] + a[0])} ${f(P[i][1] + a[1])} ${f(P[j][0] + b[0])} ${f(P[j][1] + b[1])} ${f(P[j][0])} ${f(P[j][1])}`;
        }
        d += 'Z';
        return;
      }
      const tan = P.map((p, i) => {
        const a = P[(i - 1 + n) % n], b = P[(i + 1) % n];
        const tx = b[0] - a[0], ty = b[1] - a[1], m = Math.hypot(tx, ty) || 1;
        return [tx / m * HANDLE * h, ty / m * HANDLE * h];
      });
      d += `M${f(P[0][0])} ${f(P[0][1])}`;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        d += `C${f(P[i][0] + tan[i][0])} ${f(P[i][1] + tan[i][1])} ${f(P[j][0] - tan[j][0])} ${f(P[j][1] - tan[j][1])} ${f(P[j][0])} ${f(P[j][1])}`;
      }
      d += 'Z';
    });

    let dots = '';
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < ROWS; r++) {
        dots += `<circle class="k-dot" cx="${X(2 * c + 1)}" cy="${Y(2 * r + 1)}" r="${dotR}" style="--c:${c}"/>`;
      }
    }
    if (D.accents) {
      const ac = (x, y, c) => `<circle class="k-dot k-accent" cx="${x}" cy="${y}" r="${dotR}" style="--c:${c}"/>`;
      for (let c = 0; c < cols; c++) dots += ac(X(2 * c + 1), -P, c) + ac(X(2 * c + 1), P, c);
      dots += ac(X(-1), 0, 0) + ac(X(2 * cols + 1), 0, cols - 1);
    }
    const clipId = 'kclip-' + (++clipCount);   // for the sweep: a rect that grows left to right
    el.innerHTML = `<svg xmlns="${NS}" viewBox="${-halfW} ${-halfH} ${2 * halfW} ${2 * halfH}" width="${2 * halfW}" height="${2 * halfH}" aria-hidden="true" focusable="false" style="margin-left:${-halfW}px;margin-top:${-halfH}px"><defs><clipPath id="${clipId}"><rect x="${-halfW}" y="${-halfH}" width="${2 * halfW}" height="${2 * halfH}"/></clipPath></defs><g>${dots}</g><g class="k-lines" clip-path="url(#${clipId})"><path d="${d}"/></g></svg>`;
    el.style.setProperty('--sweep-ms', SWEEP_MS + 'ms');
    el.style.setProperty('--dot-step', (SWEEP_MS / (cols + 2)).toFixed(1) + 'ms');
    const svg = el.querySelector('svg');
    const path = svg.querySelector('path');

    el._kolam = { svg, cols, pitch: P, design: settingsOf(el).design };
    applyLook(el);
    makePieces(el, path, 1);
  }

  // Diamond kolam from the kolam tool (kolam-diamond.js), drawn with the same
  // pieces-filling-in loop as the borders; its dots hop outward ring by ring.
  // With a --pitch set in CSS (a multiple of GRID), the kolam is sized so its
  // dots are that far apart and alignDiamond snaps them onto the background grid.
  // Hero: dot spacing from settings, on the 28px grid. Math: no grid snapping.
  const pitchOf = el => {
    if (el.dataset.key !== 'hero') return 0;
    const size = settingsOf(el).size * (small.matches ? 2 / 3 : 1);
    return Math.max(GRID, Math.round(size / GRID) * GRID);
  };

  function buildDiamond(el) {
    const designs = window.SHODH_KOLAMS || {};
    const art = designs[settingsOf(el).design] || designs.diamond || window.SHODH_DIAMOND_KOLAM;
    if (!art) return;
    el.innerHTML = art;
    const svg = el.querySelector('svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const g = svg.querySelector('g[transform]');
    const scale = parseFloat((g.getAttribute('transform').match(/scale\(([\d.]+)\)/) || [, 1])[1]);
    const [, , vbW] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    const dots = [...svg.querySelectorAll('circle')];
    const unitPitch = Math.min(...dots.map(c => Math.abs(+c.getAttribute('cx'))).filter(v => v > 0));
    const pitch = pitchOf(el);
    const s = settingsOf(el);
    const size = pitch ? vbW * pitch / (unitPitch * scale) : s.size * (small.matches ? 0.65 : 1);
    el.style.width = el.style.height = size + 'px';
    const pxPerUnit = (el.clientWidth || 400) / vbW * scale;     // px per artwork unit
    el._ppu = pxPerUnit;
    applyLook(el);
    dots.forEach(c => {
      c.setAttribute('class', 'k-dot');
      c.setAttribute('r', s.dotSize / pxPerUnit);
      c.style.setProperty('--c', Math.round((Math.abs(+c.getAttribute('cx')) + Math.abs(+c.getAttribute('cy'))) / unitPitch));
    });
    el._kolam = { svg, pitch, size: pitch ? 0 : size, design: settingsOf(el).design };
    makePieces(el, svg.querySelector('path'), 1 / pxPerUnit);   // pen tips at a steady on-screen size
  }

  // Snap the diamond's centre dot onto a background dot (rebuilds if --pitch changed)
  function alignDiamond(el) {
    let k = el._kolam;
    if (!k) return;
    const want = pitchOf(el) ? [pitchOf(el), 0] : [0, settingsOf(el).size * (small.matches ? 0.65 : 1)];
    if (want[0] !== k.pitch || want[1] !== k.size || settingsOf(el).design !== k.design) {
      const playing = !!k.raf;
      stopBorder(el);
      buildDiamond(el);
      k = el._kolam;
      if (playing) playBorder(el); else if (still) showFinished(el);
    }
    const rot = settingsOf(el).rotation || 0;
    if (!k.pitch) { k.svg.style.transform = rot ? `rotate(${rot}deg)` : ''; return; }
    k.svg.style.transform = '';
    const r = k.svg.getBoundingClientRect();
    const gx = document.documentElement.clientWidth / 2;
    const cx = r.left + window.scrollX + r.width / 2, cy = r.top + window.scrollY + r.height / 2;
    const dx = gx + Math.round((cx - gx) / GRID) * GRID - cx;
    const dy = Math.round((cy - GRID / 2) / GRID) * GRID + GRID / 2 - cy;
    k.svg.style.transform = `translate(${dx}px, ${dy}px)` + (rot ? ` rotate(${rot}deg)` : '');
  }

  // Split a path into PIECES stretches, each with its own pen; unit = px per drawing unit
  function makePieces(el, path, unit) {
    const k = el._kolam;
    const L = path.getTotalLength();
    const len = L / PIECES;
    const pieces = [];
    for (let i = 0; i < PIECES; i++) {
      const seg = i ? path.cloneNode() : path;
      seg.setAttribute('class', 'k-bline');
      seg.style.strokeDashoffset = -i * len;
      if (i) pieces[i - 1].seg.after(seg);
      const pen = document.createElementNS(NS, 'g');
      pen.setAttribute('class', 'k-pen');
      pen.style.opacity = 0;
      pen.innerHTML = `<circle class="k-pen-halo" r="${4 * unit}"/><circle class="k-pen-tip" r="${1.9 * unit}"/>`;
      pieces.push({ seg, pen, from: i * len, len });
    }
    pieces.forEach(p => path.parentNode.appendChild(p.pen));   // pens above every piece
    if (settingsOf(el).part) {
      // sample points along each piece, to find the ones near the mouse
      pieces.forEach(p => {
        p.clear = 0;
        p.samples = Array.from({ length: 9 }, (_, j) => { const q = path.getPointAtLength(p.from + p.len * j / 8); return [q.x, q.y]; });
      });
    }
    Object.assign(k, { path, pieces, L, raf: 0, start: 0, plan: null });
    pieces.forEach(p => setPiece(k, p, 1));
  }

  // p: 0..1 of a piece drawn, from its start
  function setPiece(k, piece, p) {
    piece.seg.style.strokeDasharray = `${p * piece.len} ${k.L + 1}`;
  }

  // One loop: which pieces are missing, and when each starts drawing
  function planLoop(k, wait) {
    const n = MISSING[0] + Math.floor(Math.random() * (MISSING[1] - MISSING[0] + 1));
    const missing = shuffle(k.pieces.map((_, i) => i)).slice(0, n);
    const starts = missing.map((_, j) => wait + j * T.stagger + Math.random() * 400);
    const complete = Math.max(...starts) + T.draw;
    return { missing, starts, complete, end: complete + T.rest + T.fade + T.pause };
  }

  // Where the mouse is (page-wide), for kolams that part around it (hero)
  const mouse = { x: 0, y: 0, on: false };
  window.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; } }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { mouse.on = false; });
  const PART_PX = 80;                 // radius around the mouse that clears
  const PART_OUT = 700, PART_IN = 2600;   // ms: easing away, then slowly drawing back

  // Ease each piece's "cleared" amount towards 1 near the mouse and 0 away from it
  function partAroundMouse(k, dt) {
    let local = null, R = 0;
    if (mouse.on) {
      const m = k.path.getScreenCTM();
      if (m) { local = new DOMPoint(mouse.x, mouse.y).matrixTransform(m.inverse()); R = PART_PX / (Math.hypot(m.a, m.b) || 1); }
    }
    k.pieces.forEach(p => {
      let target = 0;
      if (local) {
        const d = Math.min(...p.samples.map(([x, y]) => Math.hypot(x - local.x, y - local.y)));
        target = Math.max(0, Math.min(1, (R - d) / (R * 0.5)));
      }
      const rate = target > p.clear ? PART_OUT : PART_IN;
      p.clear += (target - p.clear) * Math.min(1, dt / rate);
    });
  }

  function tick(el, now) {
    const k = el._kolam;
    const parting = !!settingsOf(el).part && k.pieces[0].samples;
    if (parting) { partAroundMouse(k, Math.min(100, now - (k.last || now))); k.last = now; }
    const keep = piece => (parting ? 1 - easeSine(Math.min(1, piece.clear)) : 1);
    let t = (now - k.start) * (settingsOf(el).speed || 1);
    if (t >= k.plan.end) {
      k.plan = k.next || planLoop(k, 600); k.next = null; k.start = now; t = 0;
      el.classList.remove('ripple');
    }
    const plan = k.plan;
    const drawingMissing = new Set(plan.missing);

    k.pieces.forEach((piece, i) => {
      piece.seg.style.opacity = 1;
      if (!drawingMissing.has(i)) { setPiece(k, piece, keep(piece)); piece.pen.style.opacity = 0; return; }
      const j = plan.missing.indexOf(i);
      const raw = Math.min(1, Math.max(0, (t - plan.starts[j]) / T.draw));
      const p = Math.min(easeSine(raw), keep(piece));
      setPiece(k, piece, p);
      if (raw > 0 && raw < 1 && keep(piece) > 0.98) {
        const pt = k.path.getPointAtLength(piece.from + p * piece.len);
        piece.pen.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
        piece.pen.style.opacity = Math.min(1, raw * 8, (1 - raw) * 8);
      } else piece.pen.style.opacity = 0;
    });

    if (t >= plan.complete && !el.classList.contains('ripple')) el.classList.add('ripple');   // dots hop

    // fade away the next loop's missing pieces
    const fadeStart = plan.complete + T.rest;
    if (t >= fadeStart) {
      if (!k.next) k.next = planLoop(k, 600);
      const f = Math.min(1, (t - fadeStart) / T.fade);
      k.next.missing.forEach(i => {
        const seg = k.pieces[i].seg;
        if (f >= 1) { setPiece(k, k.pieces[i], 0); seg.style.opacity = 1; }
        else seg.style.opacity = 1 - easeSine(f);
      });
    }
    k.raf = requestAnimationFrame(n => tick(el, n));
  }

  // Draw the strip's line in with the clip rect; the dots rise as it reaches them.
  // No clientX: left to right (sweep). With clientX: outward from that point (bloom),
  // cutting short whatever was running.
  function drawBorder(el, clientX) {
    const k = el._kolam;
    if (!k) return;
    cancelAnimationFrame(k.raf);
    const rect = k.svg.querySelector('clipPath rect');
    const x0 = k.svg.viewBox.baseVal.x, full = -2 * x0;
    const bloom = clientX != null;
    let origin = x0, R = full, ms = SWEEP_MS;
    if (bloom) {
      const r = k.svg.getBoundingClientRect();
      origin = x0 + (clientX - r.left) / r.width * full;
      R = Math.max(origin - x0, x0 + full - origin);
      ms = BLOOM_MS;
      k.svg.querySelectorAll('.k-dot').forEach(d => {
        const dist = Math.abs(+d.getAttribute('cx') - origin);
        d.style.setProperty('--d', (Math.pow(Math.min(1, dist / R), 0.8) * ms * 0.9).toFixed(0) + 'ms');
      });
    }
    // dots back to their start state at once, then rise again
    el.classList.add('k-reset');
    el.classList.remove('dots-on', 'ripple');
    el.classList.toggle('is-sweep', !bloom);
    el.classList.toggle('is-bloom', bloom);
    rect.setAttribute('x', bloom ? origin : x0);
    rect.setAttribute('width', 0);
    void el.offsetWidth;
    el.classList.remove('k-reset');
    el.classList.add('dots-on');
    const t0 = performance.now();
    const step = now => {
      const p = easeSine(Math.min(1, (now - t0) / ms));
      if (bloom) { rect.setAttribute('x', origin - R * p); rect.setAttribute('width', 2 * R * p); }
      else rect.setAttribute('width', full * p);
      if (p < 1) k.raf = requestAnimationFrame(step);
      else { k.raf = 0; el._swept = true; rect.setAttribute('x', x0); rect.setAttribute('width', full); }
    };
    k.raf = requestAnimationFrame(step);
  }

  // Hover: ripple outward from the column under the pointer
  function hoverWave(el, clientX) {
    const k = el._kolam;
    if (!k) return;
    const r = k.svg.getBoundingClientRect();
    const c0 = Math.round((clientX - r.left) / r.width * (k.cols + 2) - 1.5);
    if (el._waving && Math.abs(c0 - el._waveFrom) < 4) return;   // a new wave only once the pointer has moved on
    el._waveFrom = c0;
    clearTimeout(el._waveTimer);
    el.classList.remove('is-sweep', 'is-bloom');
    k.svg.querySelectorAll('.k-dot').forEach(d => d.style.setProperty('--d', Math.abs((+d.style.getPropertyValue('--c') || 0) - c0) * 45 + 'ms'));
    el.classList.remove('ripple'); void el.offsetWidth; el.classList.add('ripple');
    el._waving = true;
    el._waveTimer = setTimeout(() => { el._waving = false; el.classList.remove('ripple'); }, 900 + (k.cols + 2) * 45);
  }

  function playBorder(el) {
    const k = el._kolam;
    if (!k || k.raf) return;
    const mode = animOf(el);
    if (mode !== 'loop') {
      if ((mode === 'sweep' || mode === 'bloom' || mode === 'wave') && !el._swept) return drawBorder(el);
      return showFinished(el);
    }
    el.classList.add('dots-on');
    el.classList.remove('ripple');
    k.plan = planLoop(k, T.firstWait);
    k.next = null;
    k.plan.missing.forEach(i => setPiece(k, k.pieces[i], 0));
    k.start = performance.now();
    k.raf = requestAnimationFrame(n => tick(el, n));
  }

  function stopBorder(el) {
    const k = el._kolam;
    if (!k) return;
    cancelAnimationFrame(k.raf);
    k.raf = 0;
    const clip = k.svg && k.svg.querySelector('clipPath rect');
    if (clip) { const x0 = k.svg.viewBox.baseVal.x; clip.setAttribute('x', x0); clip.setAttribute('width', -2 * x0); }
    const mode = animOf(el);
    if (mode === 'sweep') { el._swept = false; el.classList.remove('dots-on'); return; }   // replays next time it's in view
    if (mode !== 'loop') { if (el._swept || (mode !== 'bloom' && mode !== 'wave')) showFinished(el); else el.classList.remove('dots-on'); return; }
    el.classList.remove('is-sweep');
    el.classList.remove('dots-on', 'ripple');      // dots rise again next time it comes into view
    k.pieces.forEach(p => { setPiece(k, p, 1); p.seg.style.opacity = 1; p.pen.style.opacity = 0; });
  }

  function showFinished(el) { el.classList.add('dots-on'); }

  // Snap every kolam dot onto a background dot. The background grid is
  // centred on the page (body background-position: 50% 0), so its dots sit at
  // pageCentre + 28k across, and 14 + 28k down. Rebuilds if the content width
  // now fits a different number of columns.
  function alignBorder(el) {
    let k = el._kolam;
    if (!k) return;
    const cols = fitCols(el);
    if (cols !== k.cols || pitchFor(el) !== k.pitch || settingsOf(el).design !== k.design) {
      const playing = !!k.raf;
      stopBorder(el);
      buildBorder(el);
      k = el._kolam;
      if (playing) playBorder(el); else if (still) showFinished(el);
    }
    if (el.classList.contains('kolam-border--accent')) {
      // Sit just under the heading: the kolam's top edge at least half a grid step below
      // the text, with its middle row on the next background dot row down (so roughly
      // one row of background dots shows between text and kolam)
      const t = headingText();
      if (t) {
        const D = borderDesign(el), P = k.pitch;
        const ext = D.accents ? P + settingsOf(el).dotSize : D.rows * P / 2;   // kolam reach above its middle row
        const m0 = parseFloat(el.style.marginTop) || 0;
        const r0 = el.getBoundingClientRect();
        const cy0 = r0.top + window.scrollY + r0.height / 2 - m0;      // centre with no margin
        const want = Math.ceil((t.bottom + GRID / 2 + ext - GRID / 2) / GRID) * GRID + GRID / 2;
        if (Math.abs(want - cy0 - m0) > 0.5) el.style.marginTop = (want - cy0) + 'px';
      }
    }
    const r = el.getBoundingClientRect();
    const gx = document.documentElement.clientWidth / 2;
    // odd columns: the middle dot sits at the strip's centre; snap it to a grid dot
    const mid = r.left + window.scrollX + r.width / 2;
    let dx = gx + Math.round((mid - gx) / GRID - 0.001) * GRID - mid;
    if (el.classList.contains('kolam-border--accent')) {
      // the first main dot sits on the grid dot at (or just after) the heading's left
      // edge, so the leftmost accent dot hangs one step out to the left of the text
      const t = headingText();
      const first = mid - (k.cols - 1) / 2 * k.pitch;
      const left = t ? t.left : first;
      dx = gx + Math.ceil((left - gx) / GRID - 0.001) * GRID - first;
    }
    const cy = r.top + window.scrollY + r.height / 2;
    const dy = Math.round((cy - GRID / 2) / GRID) * GRID + GRID / 2 - cy;
    k.svg.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function build(el) {
    const type = el.dataset.kolam;
    if (type === 'border') return buildBorder(el);
    if (type === 'diamond') return buildDiamond(el);
    const m = Number(el.dataset.m) || 5;
    const n = Number(el.dataset.n) || m;
    const u = 16;
    // concentric rings of mirrors around the centre
    const mirror = (x, y) => (Math.abs(x - m) + Math.abs(y - n)) % 4 === 1;
    const bulge = u * 0.7;
    const pad = bulge + 4;
    const W = 2 * m * u + 2 * pad, H = 2 * n * u + 2 * pad;
    const X = x => pad + x * u + (x === 0 ? -bulge : x === 2 * m ? bulge : 0);
    const Y = y => pad + y * u + (y === 0 ? -bulge : y === 2 * n ? bulge : 0);

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('aria-hidden', 'true');

    curves(m, n, mirror).forEach((pts, i) => {
      const P = pts.map(([x, y]) => [X(x), Y(y)]);
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const f = v => v.toFixed(1);
      const start = mid(P[P.length - 1], P[0]);
      let d = `M${f(start[0])} ${f(start[1])}`;
      for (let k = 0; k < P.length; k++) {
        const c = P[k], e = mid(c, P[(k + 1) % P.length]);
        d += `Q${f(c[0])} ${f(c[1])} ${f(e[0])} ${f(e[1])}`;
      }
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d + 'Z');
      path.setAttribute('class', 'k-line');
      path.setAttribute('pathLength', '1000');
      path.style.strokeDasharray = '1000';
      path.style.strokeDashoffset = '1000';
      path.style.transitionDelay = (0.3 + i * 0.25) + 's';
      svg.appendChild(path);
    });

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', X(2 * i + 1));
        c.setAttribute('cy', Y(2 * j + 1));
        c.setAttribute('r', 2.6);
        c.setAttribute('class', 'k-dot');
        svg.appendChild(c);
      }
    }
    el.replaceChildren(svg);
  }

  const kolams = [...document.querySelectorAll('.kolam[data-kolam]')];
  kolams.forEach(build);

  const grids = kolams.filter(k => k.dataset.kolam === 'grid' || !k.dataset.kolam);
  const borders = kolams.filter(k => (k.dataset.kolam === 'border' || k.dataset.kolam === 'diamond') && k._kolam);

  const alignAll = () => borders.forEach(k => (k.dataset.kolam === 'border' ? alignBorder : alignDiamond)(k));
  alignAll();
  window.addEventListener('resize', alignAll);
  window.addEventListener('load', alignAll);
  if (document.fonts) document.fonts.ready.then(alignAll);
  if ('ResizeObserver' in window) new ResizeObserver(alignAll).observe(document.body);

  if (still) borders.forEach(showFinished);
  // hover wave (mouse, or a tap on touch screens)
  if (!still) borders.forEach(el => {
    if (el.dataset.kolam !== 'border') return;
    const point = e => {
      const mode = animOf(el);
      if (mode === 'bloom') drawBorder(el, e.clientX);
      else if (mode === 'sweep' && !(el._kolam && el._kolam.raf)) drawBorder(el);
    };
    const waves = () => animOf(el) === 'hover' || (animOf(el) === 'wave' && el._swept && !(el._kolam && el._kolam.raf));
    el.addEventListener('pointermove', e => { if (waves()) hoverWave(el, e.clientX); });
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') point(e); });
    el.addEventListener('pointerdown', e => { if (waves()) hoverWave(el, e.clientX); else if (e.pointerType !== 'mouse') point(e); });
  });

  if ('IntersectionObserver' in window) {
    // Grid kolams draw themselves once, when they scroll into view
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-drawn'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    grids.forEach(k => io.observe(k));

    // Border kolams play while on screen, and start over each time they come back
    if (!still) {
      const play = new IntersectionObserver(entries => {
        entries.forEach(e => { e.target._visible = e.isIntersecting; (e.isIntersecting ? playBorder : stopBorder)(e.target); });
      }, { threshold: 0.2 });
      borders.forEach(k => play.observe(k));
    }
  } else {
    grids.forEach(k => k.classList.add('is-drawn'));
    if (!still) borders.forEach(playBorder);
  }

  // Rebuild the kolams for one settings key (or all) after a settings change
  function refresh(key) {
    borders.filter(el => !key || el.dataset.key === key || (key === 'firstStrip' && isFirst(el)) || (key === 'symbolsStrip' && el.dataset.kolam === 'border' && !isFirst(el))).forEach(el => {
      el._swept = false; el.classList.remove('is-sweep');
      const playing = !!(el._kolam && el._kolam.raf) || el._visible;
      stopBorder(el);
      (el.dataset.kolam === 'border' ? buildBorder : buildDiamond)(el);
      (el.dataset.kolam === 'border' ? alignBorder : alignDiamond)(el);
      if (still) showFinished(el); else if (playing) playBorder(el);
    });
  }
  const designsFor = key => key === 'border' ? Object.keys(BORDER_DESIGNS) : Object.keys(window.SHODH_KOLAMS || {});

  window.ShodhKolam = { settings: SETTINGS, defaults: DEFAULTS, refresh, designsFor, applyLook };
})();
