// Kolam dev panel. Open the page with ?dev on the end of the address
// (e.g. index.html?dev) to tweak each kolam's colours, speed, sizes and rotation
// live, then "Copy settings" to export them. Paste the result back to Claude
// (or into SETTINGS in kolam.js) to make them the defaults.
// Tweaks are remembered in this browser while you experiment; visitors never see the panel.
(function () {
  if (!/(^|[?&#])dev\b/.test(location.search + location.hash)) return;
  const K = window.ShodhKolam;
  if (!K) return;
  const STORE = 'shodh-kolam-dev';

  const LABELS = { firstStrip: 'First strip (under the hero)', symbolsStrip: 'Lower strips (after Symbols, before Family)', border: 'Border strips', hero: 'Hero (behind the cards)', math: 'Green “The math” band' };
  const FIELDS = {
    design:    { label: 'Design', type: 'select' },
    anim:      { label: 'Animation', type: 'select', options: ['loop', 'sweep', 'wave', 'bloom', 'static', 'hover'], note: 'sweep: draws left to right, again on hover · wave: sweeps once, then dots ripple from the pointer · bloom: sweeps once, then redraws from the pointer · hover: dots ripple under the pointer' },
    placement: { label: 'Placement', type: 'select', options: ['between', 'accent'], note: 'between: own strip · accent: under “A keepsake with a story”' },
    density:   { label: 'Density', min: 1, max: 2, step: 1, unit: '× grid', note: '2 = half size, twice as many dots' },
    shift:     { label: 'Shift down', min: 0, max: 8, step: 1, unit: ' rows', note: 'grid rows; between only' },
    length:    { label: 'Length', min: 0, max: 43, step: 1, unit: ' dots', note: '0 = full width' },
    line:      { label: 'Line colour', type: 'color' },
    dot:       { label: 'Dot colour', type: 'color' },
    accent:    { label: 'Accent dots', type: 'color', note: 'petal design only' },
    lineWidth: { label: 'Line width', min: 0.5, max: 4, step: 0.1, unit: 'px' },
    dotSize:   { label: 'Dot size', min: 0.5, max: 8, step: 0.1, unit: 'px' },
    speed:     { label: 'Speed', min: 0.25, max: 3, step: 0.05, unit: '×' },
    part:      { label: 'Part at mouse', min: 0, max: 1, step: 1, note: '1 = line clears around the mouse, redraws after' },
    opacity:   { label: 'Opacity', min: 0.1, max: 1, step: 0.05 },
    size:      { label: 'Size', min: 200, max: 900, step: 10, unit: 'px' },
    rotation:  { label: 'Rotation', min: -180, max: 180, step: 1, unit: '°' },
    x:         { label: 'Centre across', min: 0, max: 100, step: 1, unit: '%' },
    y:         { label: 'Centre down', min: -30, max: 100, step: 1, unit: '%' },
  };
  const OVERRIDE = { hero: { size: { label: 'Dot spacing', min: 28, max: 168, step: 28, unit: 'px', note: 'steps of 28px keep dots on the grid' },
                             rotation: { note: 'dots leave the grid unless 0, ±90 or 180' } } };
  const LIVE = new Set(['line', 'dot', 'accent', 'lineWidth', 'opacity', 'speed']);   // no rebuild needed

  // Restore experiments from last time
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved) {
      Object.keys(saved).forEach(key => K.settings[key] && Object.assign(K.settings[key], saved[key]));
      Object.keys(K.settings).forEach(key => { if ('design' in K.defaults[key] && !K.settings[key].design) K.settings[key].design = K.defaults[key].design; });
      K.refresh();
    }
  } catch (e) { /* ignore */ }

  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(K.settings)); } catch (e) { /* ignore */ } };
  const els = key => [...document.querySelectorAll(`.kolam[data-key="${key}"]`)];
  const fmt = v => (Math.round(v * 100) / 100).toString();

  function applyLive(key) {
    const s = K.settings[key];
    els(key).forEach(el => {
      el.style.setProperty('--k-line', s.line);
      el.style.setProperty('--k-dot', s.dot);
      if (s.accent) el.style.setProperty('--k-accent', s.accent);
      el.style.setProperty('--k-lw', s.lineWidth / (el._ppu || 1) + 'px');
      if (s.opacity != null) el.style.opacity = s.opacity;
    });
  }

  let timers = {};
  function rebuildSoon(key) {
    clearTimeout(timers[key]);
    timers[key] = setTimeout(() => K.refresh(key), 180);
  }

  // ---- Panel ----
  const css = `
  .kdev { position: fixed; right: 16px; bottom: 16px; z-index: 1000; width: 320px; max-height: min(80vh, 720px);
    display: flex; flex-direction: column; background: #fffdf8; color: #2b1b12; border: 1px solid #d8c9a3;
    box-shadow: 0 18px 50px -20px rgba(0,0,0,.35); font: 13px/1.4 Mukta, system-ui, sans-serif; }
  .kdev.is-min .kdev-body { display: none; }
  .kdev-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; background: #0f6e6e; color: #fff; }
  .kdev-head strong { font-size: 13px; letter-spacing: .08em; text-transform: uppercase; }
  .kdev button { font: inherit; cursor: pointer; border: 1px solid #c9a227; background: #fff; color: #2b1b12; padding: 4px 10px; }
  .kdev-head button { border-color: rgba(255,255,255,.6); background: transparent; color: #fff; padding: 2px 8px; }
  .kdev-body { overflow: auto; padding: 10px 12px 12px; }
  .kdev-tabs { display: flex; gap: 4px; margin-bottom: 10px; flex-wrap: wrap; }
  .kdev-tabs button.is-on { background: #0f6e6e; border-color: #0f6e6e; color: #fff; }
  .kdev-row { display: grid; grid-template-columns: 92px 1fr 48px; align-items: center; gap: 8px; margin: 6px 0; }
  .kdev-row input[type=range] { width: 100%; accent-color: #0f6e6e; }
  .kdev-row select { width: 100%; font: inherit; padding: 2px 4px; border: 1px solid #d8c9a3; background: #fff; }
  .kdev-row input[type=color] { width: 100%; height: 26px; padding: 0; border: 1px solid #d8c9a3; background: none; }
  .kdev-row output { text-align: right; font-variant-numeric: tabular-nums; color: #6b5a4c; }
  .kdev-note { grid-column: 2 / -1; margin-top: -4px; font-size: 11.5px; color: #8a7a6a; }
  .kdev-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  .kdev textarea { width: 100%; height: 130px; margin-top: 8px; font: 11.5px/1.35 ui-monospace, Menlo, monospace; border: 1px solid #d8c9a3; padding: 6px; resize: vertical; }
  .kdev-msg { min-height: 1.3em; margin-top: 4px; color: #0f6e6e; }`;
  document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);

  const panel = document.createElement('div');
  panel.className = 'kdev';
  panel.innerHTML = `
    <div class="kdev-head"><strong>Kolam settings</strong><button type="button" data-act="min">–</button></div>
    <div class="kdev-body">
      <div class="kdev-tabs"></div>
      <div class="kdev-fields"></div>
      <div class="kdev-actions">
        <button type="button" data-act="replay">Replay</button>
        <button type="button" data-act="reset">Reset this kolam</button>
        <button type="button" data-act="copy">Copy settings</button>
      </div>
      <textarea readonly aria-label="Exported settings"></textarea>
      <div class="kdev-msg" role="status"></div>
    </div>`;
  document.body.appendChild(panel);

  const keys = Object.keys(K.settings);
  let current = keys.includes('hero') ? 'hero' : keys[0];
  const tabs = panel.querySelector('.kdev-tabs');
  const fields = panel.querySelector('.kdev-fields');
  const out = panel.querySelector('textarea');
  const msg = panel.querySelector('.kdev-msg');

  const exportText = () => JSON.stringify(K.settings, null, 2);
  const showExport = () => { out.value = exportText(); };

  function renderTabs() {
    tabs.innerHTML = keys.map(k => `<button type="button" data-key="${k}" class="${k === current ? 'is-on' : ''}">${(LABELS[k] || k).split(' (')[0]}</button>`).join('');
  }

  function renderFields() {
    const s = K.settings[current];
    fields.innerHTML = `<p style="margin:0 0 6px;color:#6b5a4c">${LABELS[current] || current}</p>` + Object.keys(s).map(name => {
      const f = Object.assign({}, FIELDS[name] || { label: name, min: 0, max: 100, step: 1 }, (OVERRIDE[current] || {})[name]);
      const id = `kdev-${current}-${name}`;
      const note = f.note ? `<span class="kdev-note">${f.note}</span>` : '';
      if (f.type === 'select') {
        const opts = (f.options || K.designsFor(current)).map(o => `<option value="${o}"${o === s[name] ? ' selected' : ''}>${o}</option>`).join('');
        return `<label class="kdev-row" for="${id}"><span>${f.label}</span><select id="${id}" data-name="${name}">${opts}</select><output></output>${note}</label>`;
      }
      if (f.type === 'color') {
        return `<label class="kdev-row" for="${id}"><span>${f.label}</span><input id="${id}" type="color" data-name="${name}" value="${s[name]}"><output>${s[name]}</output>${note}</label>`;
      }
      return `<label class="kdev-row" for="${id}"><span>${f.label}</span><input id="${id}" type="range" data-name="${name}" min="${f.min}" max="${f.max}" step="${f.step}" value="${s[name]}"><output>${fmt(s[name])}${f.unit || ''}</output>${note}</label>`;
    }).join('');
  }

  fields.addEventListener('input', e => {
    const input = e.target.closest('input, select');
    if (!input) return;
    const name = input.dataset.name;
    const s = K.settings[current];
    const f = Object.assign({}, FIELDS[name], (OVERRIDE[current] || {})[name]);
    const text = input.tagName === 'SELECT' || input.type === 'color';
    s[name] = text ? input.value : Number(input.value);
    input.nextElementSibling.textContent = input.tagName === 'SELECT' ? '' : input.type === 'color' ? input.value : fmt(s[name]) + (f.unit || '');
    if (LIVE.has(name)) applyLive(current); else rebuildSoon(current);
    save(); showExport();
  });

  tabs.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    current = b.dataset.key;
    renderTabs(); renderFields();
  });

  panel.addEventListener('click', async e => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'min') { panel.classList.toggle('is-min'); e.target.textContent = panel.classList.contains('is-min') ? '+' : '–'; }
    if (act === 'replay') K.refresh(current);
    if (act === 'reset') {
      K.settings[current] = Object.assign(K.settings[current], JSON.parse(JSON.stringify(K.defaults[current])));
      K.refresh(current); renderFields(); save(); showExport();
      msg.textContent = 'Reset to the built-in defaults.';
    }
    if (act === 'copy') {
      showExport();
      try { await navigator.clipboard.writeText(out.value); msg.textContent = 'Copied. Paste it to Claude to make these the defaults.'; }
      catch (err) { out.focus(); out.select(); msg.textContent = 'Selected below. Press Cmd+C (Ctrl+C) to copy.'; }
    }
  });

  renderTabs(); renderFields(); showExport();
})();
