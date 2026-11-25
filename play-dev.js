// Play page colour panel. Open play.html?dev to try table, button, card and
// info-box colours for each game mode live, then "Copy settings" and paste the
// result to Claude (or into SETTINGS in table.js) to make them the defaults.
// Tweaks are remembered in this browser while you experiment; visitors never see the panel.
(function () {
  if (!/(^|[?&#])dev\b/.test(location.search + location.hash)) return;
  const T = window.ShodhTable, G = window.__shodhGame;
  if (!T || !G) return;
  const STORE = 'shodh-play-dev';

  const TABS = { journey: 'Kolam journey', clock: 'Beat the clock', box: 'Boxes' };
  const TABLE_FIELDS = {
    floor: 'Table', line: 'Border lines and dots', accent: 'Border accent dots', text: 'Text',
    number: 'Numbers (score, time)', btnText: 'Button text', btnLine: 'Button outline',
    btnOn: 'Button when on', btnOnText: 'Button text when on', start: 'Start button', startText: 'Start button text',
    cardEdge: 'Card edge', back: 'Card back', backMark: 'Card back शोध',
  };
  const BOX_FIELDS = { bg: 'Background', text: 'Text', number: 'Numbers, labels, links', ring: 'Timer ring', pile: 'Pile card rims' };

  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved) Object.keys(saved).forEach(k => T.settings[k] && Object.assign(T.settings[k], saved[k]));
  } catch (e) { /* ignore */ }
  T.apply(G.mode);

  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(T.settings)); } catch (e) { /* ignore */ } };
  const exportText = () => JSON.stringify(T.settings, null, 2);

  const css = `
  .pdev { position: fixed; right: 16px; bottom: 16px; z-index: 1000; width: 320px; max-height: min(80vh, 720px);
    display: flex; flex-direction: column; background: #fffdf8; color: #2b1b12; border: 1px solid #d8c9a3;
    box-shadow: 0 18px 50px -20px rgba(0,0,0,.35); font: 13px/1.4 Mukta, system-ui, sans-serif; }
  .pdev.is-min .pdev-body { display: none; }
  .pdev-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; background: #0f6e6e; color: #fff; }
  .pdev-head strong { font-size: 13px; letter-spacing: .08em; text-transform: uppercase; }
  .pdev button { font: inherit; cursor: pointer; border: 1px solid #c9a227; background: #fff; color: #2b1b12; padding: 4px 10px; }
  .pdev-head button { border-color: rgba(255,255,255,.6); background: transparent; color: #fff; padding: 2px 8px; }
  .pdev-body { overflow: auto; padding: 10px 12px 12px; }
  .pdev-tabs { display: flex; gap: 4px; margin-bottom: 10px; flex-wrap: wrap; }
  .pdev-tabs button.is-on { background: #0f6e6e; border-color: #0f6e6e; color: #fff; }
  .pdev-row { display: grid; grid-template-columns: 1fr 64px 62px; align-items: center; gap: 8px; margin: 5px 0; }
  .pdev-row select { grid-column: 2 / -1; width: 100%; font: inherit; padding: 2px 4px; border: 1px solid #d8c9a3; background: #fff; }
  .pdev-row input[type=color] { width: 100%; height: 24px; padding: 0; border: 1px solid #d8c9a3; background: none; }
  .pdev-row output { font: 11.5px ui-monospace, Menlo, monospace; color: #6b5a4c; }
  .pdev-note { margin: 0 0 8px; color: #6b5a4c; }
  .pdev-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  .pdev textarea { width: 100%; height: 120px; margin-top: 8px; font: 11.5px/1.35 ui-monospace, Menlo, monospace; border: 1px solid #d8c9a3; padding: 6px; resize: vertical; }
  .pdev-msg { min-height: 1.3em; margin-top: 4px; color: #0f6e6e; }`;
  document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);

  const panel = document.createElement('div');
  panel.className = 'pdev';
  panel.innerHTML = `
    <div class="pdev-head"><strong>Play colours</strong><button type="button" data-act="min">–</button></div>
    <div class="pdev-body">
      <div class="pdev-tabs"></div>
      <div class="pdev-fields"></div>
      <div class="pdev-actions"></div>
      <textarea readonly aria-label="Exported settings"></textarea>
      <div class="pdev-msg" role="status"></div>
    </div>`;
  document.body.appendChild(panel);
  const tabs = panel.querySelector('.pdev-tabs'), fields = panel.querySelector('.pdev-fields');
  const actions = panel.querySelector('.pdev-actions'), out = panel.querySelector('textarea'), msg = panel.querySelector('.pdev-msg');

  let current = G.mode === 'clock' ? 'clock' : 'journey';
  const modeFor = tab => (tab === 'box' ? G.mode : tab);

  const colorRow = (name, label, value) =>
    `<label class="pdev-row"><span>${label}</span><input type="color" data-name="${name}" value="${value}"><output>${value}</output></label>`;
  const selectRow = (name, label, options, value) =>
    `<label class="pdev-row"><span>${label}</span><select data-name="${name}">${options.map(o => `<option${o === value ? ' selected' : ''}>${o}</option>`).join('')}</select></label>`;

  function render() {
    tabs.innerHTML = Object.keys(TABS).map(k => `<button type="button" data-tab="${k}" class="${k === current ? 'is-on' : ''}">${TABS[k]}</button>`).join('');
    const s = T.settings[current];
    if (current === 'box') {
      fields.innerHTML = `<p class="pdev-note">The boxes on the table: the clock box in Beat the clock, the card about each symbol you find, and the finish card. Same in both modes.</p>`
        + selectRow('preset', 'Preset', Object.keys(T.boxPresets), s.preset)
        + Object.keys(BOX_FIELDS).map(k => colorRow(k, BOX_FIELDS[k], s[k])).join('');
    } else {
      fields.innerHTML = `<p class="pdev-note">${current === 'journey' ? 'The table in Kolam journey.' : 'The table in Beat the clock.'} A preset fills in every colour; then fine-tune.</p>`
        + selectRow('preset', 'Preset', Object.keys(T.presets), s.preset)
        + Object.keys(TABLE_FIELDS).map(k => colorRow(k, TABLE_FIELDS[k], s[k])).join('');
    }
    actions.innerHTML = (current === 'journey'
      ? '<button type="button" data-act="step">Draw next section</button><button type="button" data-act="clear">Clear border</button><button type="button" data-act="wave">Finish ripple</button>'
      : '')
      + '<button type="button" data-act="reset">Reset this tab</button><button type="button" data-act="copy">Copy settings</button>';
    out.value = exportText();
  }

  function show(tab) {
    current = tab;
    if (G.mode !== modeFor(tab)) G.setMode(modeFor(tab));
    T.apply(modeFor(tab));
    render();
  }

  fields.addEventListener('input', e => {
    const input = e.target.closest('input, select');
    if (!input) return;
    const name = input.dataset.name, s = T.settings[current];
    s[name] = input.value;
    if (name === 'preset') {
      Object.assign(s, (current === 'box' ? T.boxPresets : T.presets)[input.value]);
      render();
    } else if (input.type === 'color') {
      input.nextElementSibling.textContent = input.value;
      out.value = exportText();
    }
    T.apply(modeFor(current));
    save();
  });

  panel.addEventListener('click', async e => {
    const tab = e.target.closest('[data-tab]');
    if (tab) return show(tab.dataset.tab);
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    const B = G.border;
    if (act === 'min') { panel.classList.toggle('is-min'); e.target.textContent = panel.classList.contains('is-min') ? '+' : '–'; }
    if (act === 'step' && B) B.setProgress(B.done >= B.steps ? 0 : B.done + 1, B.done < B.steps);
    if (act === 'clear' && B) B.setProgress(0, false);
    if (act === 'wave' && B) { B.setProgress(B.steps, false); B.wave(); }
    if (act === 'reset') {
      T.settings[current] = Object.assign(T.settings[current], JSON.parse(JSON.stringify(T.defaults[current])));
      T.apply(modeFor(current)); save(); render();
      msg.textContent = 'Reset to the built-in defaults.';
    }
    if (act === 'copy') {
      out.value = exportText();
      try { await navigator.clipboard.writeText(out.value); msg.textContent = 'Copied. Paste it to Claude to make these the defaults.'; }
      catch (err) { out.focus(); out.select(); msg.textContent = 'Selected below. Press Cmd+C (Ctrl+C) to copy.'; }
    }
  });

  // follow the game when you switch modes on the page
  document.querySelectorAll('.mode[data-mode]').forEach(b => b.addEventListener('click', () => {
    if (current !== 'box') { current = b.dataset.mode; render(); }
  }));

  render();
})();
