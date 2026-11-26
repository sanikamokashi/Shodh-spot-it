// The online game on play.html. Two modes share one board and toolbar:
//   journey  Kolam journey. Ten matches on the card table; each draws one more
//            section of the kolam border around it (table.js) and shows a small
//            card about the symbol for STAY_MS (or until "Next cards").
//            Best = fastest total time.
//   clock    Beat the clock. One minute; the border is complete and a box on
//            the table counts down and piles up your cards; the next pair is
//            dealt straight away. Best = most cards.
// Shared: Hints (after HINT_AFTER a wrong symbol fades every hintEvery(),
// alternating cards), Pause (blurs the cards, stops every clock), Reset.
// Symbols per card: Classic 8 (like the printed deck) or Easy 6. Remembered,
// and each mode keeps a separate best for each.
// Uses window.Shodh from app.js and window.ShodhTable from table.js (colours, border).
(function () {
  const S = window.Shodh;
  const cardA = document.getElementById('card-a');
  const cardB = document.getElementById('card-b');
  if (!S || !cardA || !cardB) return;
  const { describe, nameFor, pref, makePair, renderCard, canSpeak, speak, SPEAKER, src } = S;

  const ROUNDS = 10, CLOCK_MS = 60000, HINT_AFTER = 5000, STAY_MS = 6500, FLASH_MS = 650, MISS_MS = 900;
  const LEVELS = { 8: 'Classic', 6: 'Easy' };
  const LEVEL_NOTE = { 8: 'Like the printed cards.', 6: 'Bigger symbols, quicker to spot. Good for little ones.' };
  const $ = id => document.getElementById(id);
  const gameEl = $('game'), board = $('game-board'), msgEl = $('game-msg');
  const startBtn = $('game-start'), hintBox = $('hint-mode'), pauseBtn = $('game-pause'), resetBtn = $('game-reset');
  const pausedEl = $('game-paused'), resumeBtn = $('game-resume');
  const scoreEl = $('score'), scoreLabel = $('score-label'), scoreOf = $('score-of'), timerEl = $('timer'), timerLabel = $('timer-label');
  const bestEl = $('game-best'), startRow = $('game-start-row');
  const clockBox = $('clock-box'), clockLast = $('clock-last');
  const clockRing = $('clock-ring'), clockSecs = $('clock-secs'), clockCount = $('clock-count'), pileEl = $('clock-pile');
  const modeBtns = [...document.querySelectorAll('.mode[data-mode]')];
  const T = window.ShodhTable;
  const border = T ? T.makeBorder($('table-frame')) : null;

  const levelBtns = [...document.querySelectorAll('.level-btn')], levelNote = $('level-note');
  let perCard = 8;
  try { perCard = +localStorage.getItem('shodh-per-card') === 6 ? 6 : 8; } catch (e) { /* ignore */ }
  const hintEvery = () => (perCard === 8 ? 1500 : 2000);   // more wrong symbols to get through on Classic

  let mode = 'journey';
  let found = 0, total = 0, shared = null, started = 0, endAt = 0, tick = null, locked = true, playing = false;
  let nextTimer = null, nextDue = 0, hintTimer = null, hintSide = 0, recent = [], paused = 0, collected = [];
  let misses = 0, missing = false;   // a wrong tap deals new cards; in Kolam journey the round's clock keeps running

  const fmt = ms => { const s = ms / 1000; return s < 60 ? s.toFixed(1) + 's' : Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0'); };
  // Easy keeps the original keys (scores from when the game had 6 symbols); Classic has its own
  const bestKey = m => (m === 'journey' ? 'shodh-best' : 'shodh-best-clock') + (perCard === 8 ? '-8' : '');
  const getBest = m => { try { return +localStorage.getItem(bestKey(m)) || 0; } catch (e) { return 0; } };
  const setBest = (m, v) => { try { localStorage.setItem(bestKey(m), String(Math.round(v))); } catch (e) { /* ignore */ } };
  const bestText = m => { const b = getBest(m); return !b ? '' : m === 'journey' ? `Your best: ${fmt(b)} for all ${ROUNDS}` : `Your best: ${b} card${b === 1 ? '' : 's'} in a minute`; };
  function showBest() {
    bestEl.textContent = bestText(mode);
    // Beat the clock: the best score shows in the box, under the count, until you start
    if (mode === 'clock' && !playing) clockLast.textContent = bestText('clock');
    modeBtns.forEach(b => { b.querySelector('.mode-best').textContent = bestText(b.dataset.mode); });
  }
  const setTools = on => { pauseBtn.disabled = !on; resetBtn.disabled = !on; };
  const stopTimers = () => { clearInterval(tick); clearTimeout(nextTimer); clearTimeout(hintTimer); };
  const elapsed = () => performance.now() - started;
  const startLabel = () => (mode === 'journey'
    ? (found ? 'Play again' : 'Start playing')
    : (found ? 'Play again' : 'Start the clock')) + ' <span aria-hidden="true">→</span>';
  const showStart = on => { startRow.hidden = !on; };

  function setCount() {
    scoreEl.textContent = found;
    if (mode === 'clock') clockCount.innerHTML = playing || found ? `<strong>${found}</strong> card${found === 1 ? '' : 's'} collected` : 'Collect as many cards as you can in one minute.';
  }
  function setRing(msLeft) {
    const left = Math.max(0, msLeft);
    clockSecs.textContent = Math.ceil(left / 1000);
    clockRing.style.strokeDashoffset = String(100 - (left / CLOCK_MS) * 100);
    clockBox.classList.toggle('is-low', playing && left <= 10000);
  }
  function runClock() {
    clearInterval(tick);
    tick = setInterval(() => {
      if (mode === 'journey') { timerEl.textContent = fmt(elapsed()); return; }
      const left = endAt - performance.now();
      timerEl.textContent = fmt(Math.max(0, left));
      setRing(left);
      if (left <= 0) finish();
    }, 100);
  }

  function showBacks() {
    [cardA, cardB].forEach(c => {
      c.classList.add('is-back');
      c.innerHTML = '<svg class="card-back-mark" viewBox="0 0 1672 794" aria-hidden="true"><use href="#shodh-word"/></svg>';
    });
  }

  /* ---- Hints ---- */
  function hintStep() {
    const cards = hintSide % 2 ? [cardB, cardA] : [cardA, cardB];
    hintSide++;
    for (const card of cards) {
      const left = [...card.querySelectorAll('.sym-btn:not(.is-hinted)')].filter(b => b.dataset.id !== shared.id);
      if (left.length) { left[Math.floor(Math.random() * left.length)].classList.add('is-hinted'); break; }
    }
    if (board.querySelectorAll('.sym-btn:not(.is-hinted)').length > 2) hintTimer = setTimeout(hintStep, hintEvery());
  }
  function scheduleHints() {
    clearTimeout(hintTimer);
    if (!hintBox.checked || locked || paused) return;
    const e = elapsed();
    hintTimer = setTimeout(hintStep, e < HINT_AFTER ? HINT_AFTER - e : hintEvery());
  }
  hintBox.addEventListener('change', () => {
    if (hintBox.checked) scheduleHints();
    else { clearTimeout(hintTimer); board.querySelectorAll('.is-hinted').forEach(b => b.classList.remove('is-hinted')); }
  });

  /* ---- Pause / reset ---- */
  function setPausedUI(on) {
    gameEl.classList.toggle('is-paused', on);
    pausedEl.hidden = !on;
    pauseBtn.setAttribute('aria-pressed', String(on));
    pauseBtn.querySelector('.tool-label').textContent = on ? 'Resume' : 'Pause';
  }
  function pause() {
    if (!playing || paused) return;
    paused = performance.now();
    stopTimers();
    setPausedUI(true);
    resumeBtn.focus({ preventScroll: true });
  }
  function resume() {
    if (!paused) return;
    const gap = performance.now() - paused;
    paused = 0;
    setPausedUI(false);
    endAt += gap;
    if (locked) { nextDue += gap; if (missing) started += gap; scheduleNext(nextDue - performance.now()); }   // between rounds
    else { started += gap; scheduleHints(); }
    if (mode === 'clock' || !locked) runClock();
  }
  function reset() {
    stopTimers();
    if (paused) { paused = 0; setPausedUI(false); }
    playing = false; locked = true; found = 0; total = 0; collected = []; misses = 0; missing = false;
    document.body.classList.remove('is-playing');
    timerEl.textContent = mode === 'journey' ? fmt(0) : fmt(CLOCK_MS);
    setRing(CLOCK_MS);
    pileEl.innerHTML = '';
    setCount();
    if (border) border.setProgress(mode === 'clock' ? border.steps : 0, false);
    showBacks();
    msgEl.innerHTML = '';
    clockLast.innerHTML = '';
    clockBox.hidden = mode !== 'clock';
    gameEl.classList.remove('is-over');
    setTools(false);
    showStart(true);
    startBtn.innerHTML = startLabel();
    showBest();
  }
  pauseBtn.addEventListener('click', () => (paused ? resume() : pause()));
  resumeBtn.addEventListener('click', resume);
  resetBtn.addEventListener('click', () => { reset(); startBtn.focus({ preventScroll: true }); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  /* ---- Rounds ---- */
  const advance = () => (mode === 'journey' && found >= ROUNDS ? finish() : deal());
  function scheduleNext(ms) { clearTimeout(nextTimer); nextDue = performance.now() + ms; nextTimer = setTimeout(advance, ms); }

  function learnCard(s, ms) {
    const n = nameFor(s);
    const say = canSpeak ? `<button type="button" class="name-say" data-dev="${n.dev}" data-tr="${n.tr}" aria-label="Hear ${n.tr}">${SPEAKER}</button>` : '';
    return `<div class="learn"><img src="${src(s)}" alt="">
      <p class="game-found">Found in ${fmt(ms)}. ${found} of ${ROUNDS} pieces of the border drawn.</p>
      <h3>${s.name} <span class="dev" lang="${pref.lang}">${n.dev}</span> <span class="tr">${n.tr}</span> ${say}</h3>
      <p class="meaning">${s.text}</p>
      <button type="button" class="link-arrow game-next">${found < ROUNDS ? 'Next cards' : 'See the finished border'} <span aria-hidden="true">→</span></button></div>`;
  }

  function guess(btn) {
    if (locked || paused) return;
    if (btn.dataset.id !== shared.id) {
      // a wrong tap costs these cards: shake, then new ones (so tapping everything doesn't pay)
      locked = true; missing = true; misses += 1;
      clearTimeout(hintTimer);
      btn.classList.add('is-wrong');
      board.querySelectorAll('.sym-btn').forEach(el => { if (el !== btn) el.classList.add('is-dim'); });
      const note = '<span class="miss-note">Not that one. New cards!</span>';
      if (mode === 'journey') msgEl.innerHTML = `<p>${note}</p>`; else clockLast.innerHTML = note;
      scheduleNext(MISS_MS);
      return;
    }
    locked = true;
    clearTimeout(hintTimer);
    const ms = elapsed();
    total += ms;
    found += 1;
    setCount();
    board.querySelectorAll(`.sym-btn[data-id="${shared.id}"]`).forEach(el => el.classList.add('is-match'));
    board.querySelectorAll('.sym-btn:not(.is-match)').forEach(el => el.classList.add('is-dim'));
    collected.push(shared);
    if (mode === 'journey') {
      clearInterval(tick);
      timerEl.textContent = fmt(ms);
      msgEl.innerHTML = learnCard(shared, ms);
      if (border) border.setProgress(found);
      scheduleNext(STAY_MS);
    } else {
      // onto the pile, then straight to the next pair (the clock keeps running)
      const n = nameFor(shared);
      pileEl.insertAdjacentHTML('afterbegin', `<li title="${shared.name}"><img src="${src(shared)}" alt="${shared.name}"></li>`);
      clockLast.innerHTML = `<span class="plus-one">+1 &nbsp;<strong>${shared.name}</strong> <span lang="${pref.lang}">${n.dev}</span></span>`;
      scheduleNext(FLASH_MS);
    }
  }

  function deal() {
    clearTimeout(nextTimer);
    clearTimeout(hintTimer);
    let p, tries = 0;
    do { p = makePair(perCard); } while (recent.includes(p.shared.id) && ++tries < 20);   // avoid repeating a recent match
    recent = [p.shared.id, ...recent].slice(0, 12);
    shared = p.shared;
    [cardA, cardB].forEach(c => c.classList.remove('is-back'));
    renderCard(cardA, p.a, { interactive: true, onPick: guess });
    renderCard(cardB, p.b, { interactive: true, onPick: guess });
    if (mode === 'journey') {
      msgEl.innerHTML = `<p>Round ${found + 1} of ${ROUNDS}: find the one symbol on both cards.</p>`;
      if (!missing) started = performance.now();   // after a wrong tap the round's time carries on
      runClock();
    } else {
      if (!found) clockLast.textContent = 'Go! Tap the symbol that’s on both cards.';
      started = performance.now();
    }
    locked = false; missing = false;
    hintSide = Math.round(Math.random());
    scheduleHints();
  }

  function finish() {
    stopTimers();
    locked = true; playing = false;
    document.body.classList.remove('is-playing');
    setTools(false);
    board.querySelectorAll('.sym-btn').forEach(el => el.classList.add('is-dim'));
    const page = location.href.split('#')[0];
    let html, isBest, shareText;
    if (mode === 'journey') {
      const best = getBest('journey');
      isBest = !best || total < best;
      if (isBest) setBest('journey', total);
      if (border) border.wave();
      shareText = `I found ${ROUNDS} matches in ${fmt(total)} on Shodh! It’s a quick spot-the-match game: two cards, one Indian symbol in common, find it fast. Can you beat my time? `;
      html = `<h3>The kolam border is complete!</h3>
        <p class="meaning">${ROUNDS} matches in ${fmt(total)}, about ${fmt(total / ROUNDS)} each, on ${LEVELS[perCard]}${misses ? `, with ${misses} wrong tap${misses === 1 ? '' : 's'}` : ''}.${isBest ? ' That’s your best yet.' : ''}</p>`;
    } else {
      timerEl.textContent = fmt(0);
      setRing(0);
      const best = getBest('clock');
      isBest = found > 0 && found > best;
      if (isBest) setBest('clock', found);
      shareText = `I spotted ${found} match${found === 1 ? '' : 'es'} in one minute on Shodh! It’s a quick spot-the-match game: two cards, one Indian symbol in common, find it fast. Can you beat me? `;
      const chips = collected.map(s => { const n = nameFor(s); return `<li><img src="${src(s)}" alt=""><span>${s.name}</span><span class="dev" lang="${pref.lang}">${n.dev}</span></li>`; }).join('');
      html = `<h3>Time’s up! ${found} card${found === 1 ? '' : 's'}</h3>
        <p class="meaning">${found ? `About ${fmt(CLOCK_MS / found)} a card, on ${LEVELS[perCard]}.` : 'Give it another go!'}${isBest ? ' That’s your best yet.' : ''}</p>
        ${chips ? `<ul class="pile-recap" aria-label="The symbols you collected">${chips}</ul>` : ''}`;
    }
    showBest();
    const shareUrl = page + (mode === 'clock' ? '#clock' : '');
    const wa = 'https://wa.me/?text=' + encodeURIComponent(shareText + shareUrl);
    msgEl.innerHTML = `<div class="learn is-finish">${html}
      <div class="actions"><button type="button" class="cta game-again">Play again <span aria-hidden="true">→</span></button>
      <a class="link-arrow share-wa" href="${wa}" target="_blank" rel="noopener">Share on WhatsApp <span aria-hidden="true">→</span></a>
      <a class="link-arrow share-pic" hidden>Save the picture <span aria-hidden="true">↓</span></a>
      ${(window.SHODH_FLAGS || {}).waitlist ? '<a class="link-arrow deck-link" href="index.html#waitlist">Get the real deck <span aria-hidden="true">→</span></a>' : ''}</div></div>`;
    // the finish card has its own "Play again"; in Beat the clock it takes the box's place
    clockBox.hidden = true;
    gameEl.classList.add('is-over');
    showStart(false);
    startBtn.innerHTML = startLabel();
    prepareShare(shareText, shareUrl);
  }

  /* ---- Sharing with a picture ----
     A WhatsApp link can only carry text, so we also draw a result picture.
     On phones that can share files (most iPhones and Androids) "Share on
     WhatsApp" opens the phone's share menu with the picture and the message;
     everywhere else it stays a text link and "Save the picture" appears. */
  async function shareCard() {
    const W = 1080, H = 1080, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    try { await Promise.all(['400 40px "Rozha One"', '500 30px Mukta', '600 30px Mukta'].map(f => document.fonts.load(f))); } catch (e) { /* draw with fallbacks */ }
    // ivory card, peacock frame with a gold rule, a dotted kolam grid
    g.fillStyle = '#0d5c63'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fbf6ea'; g.fillRect(36, 36, W - 72, H - 72);
    g.strokeStyle = '#c9a227'; g.lineWidth = 3; g.strokeRect(52, 52, W - 104, H - 104);
    g.fillStyle = 'rgba(201,162,39,.22)';
    for (let x = 84; x < W - 70; x += 28) for (let y = 84; y < H - 70; y += 28) { g.beginPath(); g.arc(x, y, 2, 0, Math.PI * 2); g.fill(); }
    // शोध wordmark
    const d = document.querySelector('#shodh-word path');
    if (d) {
      g.save(); g.translate(W / 2 - 165, 112); g.scale(330 / 1672, 330 / 1672); g.translate(20, 790);
      g.fillStyle = '#b8913f'; g.fill(new Path2D(d.getAttribute('d'))); g.restore();
    }
    g.textAlign = 'center';
    g.fillStyle = '#3f3a2e'; g.font = '500 30px Mukta, sans-serif'; g.fillText('The Culture Search', W / 2, 310);
    // the result
    const big = mode === 'journey' ? `${found} matches in ${fmt(total)}` : `${found} match${found === 1 ? '' : 'es'} in a minute`;
    g.fillStyle = '#0d5c63'; g.font = '400 76px "Rozha One", Georgia, serif'; g.fillText(big, W / 2, 420);
    g.fillStyle = '#6b5a4c'; g.font = '500 30px Mukta, sans-serif';
    g.fillText(mode === 'journey' ? 'Kolam journey' : 'Beat the clock', W / 2, 470);
    // the symbols found, on little round cards
    const list = collected.slice(-12);
    const imgs = await Promise.all(list.map(s => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src(s); })));
    const per = Math.min(6, Math.max(1, list.length)), R = 62, gap = 22, rows = Math.ceil(list.length / per);
    list.forEach((s, k) => {
      const row = Math.floor(k / per), inRow = Math.min(per, list.length - row * per), col = k % per;
      const x = W / 2 + (col - (inRow - 1) / 2) * (2 * R + gap), y = 600 + row * (2 * R + gap) + (rows === 1 ? 50 : 0);
      g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#0d5c63'; g.stroke();
      if (imgs[k]) g.drawImage(imgs[k], x - R * .68, y - R * .68, R * 1.36, R * 1.36);
    });
    g.fillStyle = '#3f3a2e'; g.font = '600 40px Mukta, sans-serif'; g.fillText('Can you beat me?', W / 2, 890);
    g.fillStyle = '#6b5a4c'; g.font = '500 28px Mukta, sans-serif'; g.fillText('Spot the one symbol two cards share', W / 2, 934);
    // where to play: the site's own address, whatever it's hosted at
    if (/^https?:$/.test(location.protocol)) { g.fillStyle = '#0d5c63'; g.font = '600 30px Mukta, sans-serif'; g.fillText('Play free at ' + location.host + location.pathname.replace(/\/[^/]*$/, '/').replace(/\/$/, ''), W / 2, 990); }
    return new Promise((ok, no) => { try { c.toBlob(b => (b ? ok(b) : no(new Error('no picture'))), 'image/png'); } catch (e) { no(e); } });
  }

  async function prepareShare(text, url) {
    const card = msgEl.querySelector('.learn.is-finish');
    if (!card) return;
    let blob;
    try { blob = await shareCard(); } catch (e) { return; }   // e.g. a page opened from a file: keep the text link
    if (!card.isConnected) return;
    const file = new File([blob], 'shodh-score.png', { type: 'image/png' });
    const waLink = card.querySelector('.share-wa'), picLink = card.querySelector('.share-pic');
    // phones: their share menu has WhatsApp in it. Computers often don't, so there
    // the WhatsApp link stays text and the picture can be saved and attached.
    const phone = window.matchMedia('(pointer: coarse)').matches;
    if (phone && navigator.canShare && navigator.canShare({ files: [file] })) {
      // the share menu has WhatsApp in it; the picture goes with the message
      waLink.addEventListener('click', e => {
        e.preventDefault();
        navigator.share({ files: [file], text: text + url }).catch(() => {});
      });
    } else {
      picLink.href = URL.createObjectURL(blob);
      picLink.download = 'shodh-score.png';
      picLink.hidden = false;
    }
  }

  function start() {
    reset();
    playing = true;
    document.body.classList.add('is-playing');
    setTools(true);
    showStart(false);
    found = 0; total = 0; collected = []; misses = 0; missing = false;
    setCount();
    if (mode === 'clock') { endAt = performance.now() + CLOCK_MS; runClock(); }
    deal();
    // phones: bring the whole board into view
    if (window.matchMedia('(max-width: 960px)').matches) gameEl.scrollIntoView({ block: 'start', behavior: S.reducedMotion ? 'auto' : 'smooth' });
    cardA.querySelector('.sym-btn')?.focus({ preventScroll: true });
  }

  msgEl.addEventListener('click', e => {
    const say = e.target.closest('.name-say');
    if (say) return speak(say, say.dataset.dev, say.dataset.tr, pref.lang);
    if (e.target.closest('.game-next')) { clearTimeout(nextTimer); advance(); }
    if (e.target.closest('.game-again')) start();
  });
  startBtn.addEventListener('click', start);

  /* ---- Modes ---- */
  function setMode(m, { fromHash = false } = {}) {
    if (!['journey', 'clock'].includes(m)) m = 'journey';
    mode = m;
    modeBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    gameEl.classList.toggle('is-clock', m === 'clock');
    // Beat the clock: the Start button sits inside the clock box, so the box doesn't move when you start
    (m === 'clock' ? clockBox : $('game-foot')).appendChild(startRow);
    if (T) T.apply(m);
    scoreLabel.textContent = m === 'journey' ? 'Match' : 'Cards';
    scoreOf.hidden = m !== 'journey';
    timerLabel.textContent = m === 'journey' ? 'Time' : 'Left';
    reset();
    showBest();
    if (!fromHash) { try { history.replaceState(null, '', m === 'journey' ? location.pathname + location.search : '#' + m); } catch (e) { /* file:// previews */ } }
  }
  modeBtns.forEach(b => b.addEventListener('click', () => { if (b.dataset.mode !== mode || playing) setMode(b.dataset.mode); }));

  /* ---- Symbols per card ---- */
  function setLevel(n, { save = true } = {}) {
    perCard = n === 6 ? 6 : 8;
    levelBtns.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.n === perCard)));
    levelNote.textContent = LEVEL_NOTE[perCard];
    gameEl.dataset.perCard = perCard;
    if (save) { try { localStorage.setItem('shodh-per-card', String(perCard)); } catch (e) { /* ignore */ } }
    reset();
    showBest();
  }
  levelBtns.forEach(b => b.addEventListener('click', () => { if (+b.dataset.n !== perCard || playing) setLevel(+b.dataset.n); }));

  setLevel(perCard, { save: false });
  setMode(location.hash.slice(1), { fromHash: true });
  window.__shodhGame = { get mode() { return mode; }, get shared() { return shared; }, get found() { return found; }, get paused() { return !!paused; }, get perCard() { return perCard; }, get border() { return border; }, shareCard, setLevel, deal, finish, pause, resume, reset, setMode, start };
})();
