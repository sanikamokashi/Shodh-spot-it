// Shared by every page: symbols, pronunciation, the Marathi/Hindi switch, card dealing.
// Home page: the playable hero cards, the side rail, sharing and sign-up.
// The online game itself lives in game.js (play.html) and uses window.Shodh from here.
// Images in images/symbols/ are placeholders cropped from the design screenshots;
// swap in the real illustrations with the same file names.
(function () {
  /* ---------- Waitlist sign-ups → Google Form ----------
     Make a Google Form with three questions: Email, Country, and "What would
     you use it for?" as checkboxes whose options match the site's word for word
     (For our own game nights / As gifts / A custom designed deck for our own event),
     link it to a Sheet, then fill these in: `action` is the form's address with
     /viewform at the end changed to /formResponse, and each entry is the number
     after "entry." for that question (open the form's "Get pre-filled link" to
     see them). Until `action` is set, the form thanks people but saves nothing. */
  const WAITLIST_FORM = {
    action: '',            // https://docs.google.com/forms/d/e/…/formResponse
    email: '',             // entry number for Email, e.g. '1234567890'
    country: '',           // entry number for Country
    uses: '',              // entry number for What would you use it for?
  };
  const flags = window.SHODH_FLAGS || {};

  const SYMBOLS = window.SHODH_SYMBOLS;   // symbols.js
  const src = s => `images/symbols/${s.id}.png`;
  const SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path class="wave" d="M16 8.5a5 5 0 0 1 0 7"/><path class="wave wave-2" d="M18.5 6a8.5 8.5 0 0 1 0 12"/></svg>';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Speech ----------
     Uses the device's own voices. Tries Marathi, then Hindi, then reads the
     transliteration with an Indian-English (or default) voice. */
  const synth = window.speechSynthesis;
  const canSpeak = !!synth && typeof SpeechSynthesisUtterance !== 'undefined';
  let voices = canSpeak ? synth.getVoices() : [];
  if (canSpeak && synth.addEventListener) synth.addEventListener('voiceschanged', () => { voices = synth.getVoices(); });
  const voiceFor = code => voices.find(v => new RegExp(`^${code}([-_]|$)`, 'i').test(v.lang));

  function speak(btn, dev, tr, prefer) {
    if (!canSpeak) return;
    synth.cancel();
    const order = prefer === 'hi' ? ['hi'] : ['mr', 'hi'];
    let voice = null;
    for (const c of order) { voice = voiceFor(c); if (voice) break; }
    const english = !voice;
    if (english) voice = voices.find(v => /^en[-_]IN$/i.test(v.lang)) || null;
    const u = new SpeechSynthesisUtterance(english ? tr : dev);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-IN'; }
    u.rate = 0.8;
    u.onstart = () => btn.classList.add('is-speaking');
    u.onend = u.onerror = () => btn.classList.remove('is-speaking');
    synth.speak(u);
  }

  const sayBtn = document.getElementById('say-btn');
  if (sayBtn) {
    if (!canSpeak) sayBtn.hidden = true;
    else sayBtn.addEventListener('click', () => speak(sayBtn, 'शोध', 'Shodh', 'mr'));
  }

  /* ---------- Marathi / Hindi preference (symbol grid, hero caption, game) ---------- */
  const pref = { lang: 'mr' };
  try { if (localStorage.getItem('shodh-lang') === 'hi') pref.lang = 'hi'; } catch (e) { /* storage blocked */ }
  const nameFor = s => s.names.find(n => n.lang === pref.lang) || s.names[0];
  // "Name · देवनागरी (transliteration)" plus meaning, for captions and match messages
  const describe = s => {
    const n = nameFor(s);
    return `<strong>${s.name}</strong> <span class="cap-dev" lang="${pref.lang}">${n.dev}</span> <em class="cap-tr">${n.tr}</em>. <span class="cap-text">${s.text}</span>`;
  };

  /* ---------- Symbol grid + tabs ---------- */
  const grid = document.getElementById('symbol-grid');
  if (grid) {
    // Marathi / Hindi switch: each card shows one name in the chosen language
    let filter = 'all';
    // Home page shows a handful (data-preview="id id …"); symbols.html shows all 57
    const preview = grid.dataset.preview ? grid.dataset.preview.split(/\s+/) : null;
    const list = preview ? preview.map(id => SYMBOLS.find(s => s.id === id)).filter(Boolean) : SYMBOLS;

    function renderSymbols() {
      grid.innerHTML = list.map(s => {
        const n = nameFor(s);
        return `
        <li class="symbol" data-cat="${s.cat}"${filter !== 'all' && s.cat !== filter ? ' hidden' : ''}>
          <h3>${s.name}</h3>
          <img src="${src(s)}" alt="" loading="lazy" width="80" height="80">
          <div class="name">
            <span class="nm"><span class="dev" lang="${pref.lang}">${n.dev}</span><span class="tr">${n.tr}</span></span>
            ${canSpeak ? `<button type="button" class="name-say" data-dev="${n.dev}" data-tr="${n.tr}" aria-label="Hear ${n.tr} in ${pref.lang === 'hi' ? 'Hindi' : 'Marathi'}">${SPEAKER}</button>` : ''}
          </div>
          <button type="button" class="sym-more" aria-expanded="false">What it is</button>
          <p class="meaning">${s.text}</p>
        </li>`;
      }).join('');
      applyLimit();
    }

    // Show the first few rows; "See all" expands the grid in place
    const moreBtn = document.getElementById('symbols-more');
    let expanded = false;
    function applyLimit() {
      if (!moreBtn) return;   // no "See all" button: show everything
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
      const limit = cols * (cols <= 2 ? 4 : 3);
      const shown = [...grid.querySelectorAll('.symbol')].filter(li => !li.hidden);
      shown.forEach((li, i) => li.classList.toggle('is-extra', i >= limit));
      grid.classList.toggle('is-expanded', expanded);
      if (moreBtn) {
        moreBtn.hidden = shown.length <= limit;
        moreBtn.setAttribute('aria-expanded', String(expanded));
        moreBtn.innerHTML = expanded ? 'Show fewer <span aria-hidden="true">↑</span>' : `See all ${shown.length} symbols <span aria-hidden="true">↓</span>`;
      }
    }
    if (moreBtn) moreBtn.addEventListener('click', () => {
      expanded = !expanded;
      applyLimit();
      if (!expanded) grid.closest('section').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
    window.addEventListener('resize', () => requestAnimationFrame(applyLimit));
    renderSymbols();

    grid.addEventListener('click', e => {
      const b = e.target.closest('.name-say');
      if (b) return speak(b, b.dataset.dev, b.dataset.tr, pref.lang);
      // Phones: meanings are folded away to keep the grid short; tap to open one
      const more = e.target.closest('.sym-more');
      if (more) {
        const li = more.closest('.symbol');
        const open = !li.classList.contains('is-open');
        li.classList.toggle('is-open', open);
        more.setAttribute('aria-expanded', String(open));
        more.textContent = open ? 'Close' : 'What it is';
      }
    });

    const pressGroup = (buttons, active) => buttons.forEach(b => {
      const on = b === active;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });

    const langBtns = [...document.querySelectorAll('.lang-switch button')];
    pressGroup(langBtns, langBtns.find(b => b.dataset.lang === pref.lang));
    langBtns.forEach(btn => btn.addEventListener('click', () => {
      pref.lang = btn.dataset.lang;
      try { localStorage.setItem('shodh-lang', pref.lang); } catch (e) { /* ignore */ }
      pressGroup(langBtns, btn);
      renderSymbols();
    }));

    const tabs = [...document.querySelectorAll('.tab')];
    tabs.forEach(tab => tab.addEventListener('click', () => {
      filter = tab.dataset.filter;
      pressGroup(tabs, tab);
      grid.querySelectorAll('.symbol').forEach(li => { li.hidden = filter !== 'all' && li.dataset.cat !== filter; });
      applyLimit();
    }));
  }

  /* ---------- Card dealing (shared by hero and game) ----------
     Classic cards carry 8 symbols, like the printed deck (one centre, seven
     around it); the game also offers Easy with 6. Pairs are dealt at random:
     any two cards that share exactly one symbol play like two from the deck.
     The layout echoes the printed cards: mixed sizes, tilted, now and then one
     upside down. Each symbol's box width is --w (percent of the card). */
  const PER_CARD = 8;
  const RING = { 6: { r: 29, w: 26 }, 8: { r: 31, w: 22 } };
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function makePair(n = PER_CARD) {
    const pool = shuffle(SYMBOLS.slice());
    const shared = pool[0];
    return {
      shared,
      a: shuffle([shared, ...pool.slice(1, n)]),
      b: shuffle([shared, ...pool.slice(n, n * 2 - 1)]),
    };
  }

  function layout(n) {
    const { r, w } = RING[n] || RING[8];
    const ring = n - 1, turn = Math.random() * 360;
    const slots = [[50, 50, w * 1.1]];
    for (let i = 0; i < ring; i++) {
      const a = (turn + (i * 360) / ring + (Math.random() * 10 - 5)) * Math.PI / 180;
      const rr = r + (Math.random() * 3 - 1.5);
      slots.push([50 + rr * Math.cos(a), 50 + rr * Math.sin(a), w]);
    }
    return slots;
  }

  function renderCard(card, items, { interactive = false, onPick } = {}) {
    const slots = layout(items.length);
    card.replaceChildren();
    card.dataset.count = items.length;
    items.forEach((s, i) => {
      const el = document.createElement(interactive ? 'button' : 'span');
      el.className = interactive ? 'sym-btn' : 'sym';
      el.dataset.id = s.id;
      if (interactive) { el.type = 'button'; el.setAttribute('aria-label', s.name); el.addEventListener('click', () => onPick(el)); }
      const [x, y, w] = slots[i];
      el.style.left = x.toFixed(1) + '%';
      el.style.top = y.toFixed(1) + '%';
      el.style.setProperty('--w', w.toFixed(1) + '%');
      const flip = Math.random() < 0.12 ? 180 : 0;                 // now and then upside down, like the printed cards
      el.style.setProperty('--r', (flip + Math.random() * 70 - 35).toFixed(0) + 'deg');
      el.style.setProperty('--s', (0.74 + Math.random() * 0.34).toFixed(2));
      el.innerHTML = `<img src="${src(s)}" alt="">`;
      card.appendChild(el);
    });
  }

  /* ---------- Hero: two live cards you can play with ----------
     Left alone, it plays itself: after FADE_AFTER the wrong symbols start fading
     out one at a time (every FADE_EVERY, alternating cards) so you can see the
     answer coming; when only the match is left it glows and is described for
     SHOW_MS, then a new pair is dealt. Tap a symbol and it
     becomes a tiny game: the auto-play stops for that pair, a wrong tap shakes,
     the right one glows with its name and meaning and a "Next pair" button.
     After a couple of finds the caption invites people to the full game. */
  const stage = document.getElementById('hero-stage');
  if (stage) {
    const ha = document.getElementById('hero-a');
    const hb = document.getElementById('hero-b');
    const link = document.querySelector('#hero-link path');
    const caption = document.getElementById('hero-caption');
    const FADE_AFTER = 2500;           // look on your own this long, then wrong symbols start fading
    const FADE_EVERY = 430;            // one more wrong symbol fades this often (14 to go: the match glows at about 8.5s)
    const SHOW_MS = 6500;              // the revealed match and its description stay up this long
    const IDLE_MS = 20000;             // after a tap, wait this long before playing itself again
    const NUDGE_AFTER = 2;             // finds before the caption points to the full game
    const FULL_GAME = '<a class="hero-play" href="play.html">Play the full game <span aria-hidden="true">→</span></a>';
    let pair, revealTimer, nextTimer, idleTimer, hovering = false, engaged = false, revealed = false, finds = 0, fadeSide = 0;

    function connect() {
      const s = stage.getBoundingClientRect();
      const a = ha.querySelector('.is-match'), b = hb.querySelector('.is-match');
      if (!a || !b) return;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const x1 = ra.left + ra.width / 2 - s.left, y1 = ra.top + ra.height / 2 - s.top;
      const x2 = rb.left + rb.width / 2 - s.left, y2 = rb.top + rb.height / 2 - s.top;
      const lift = Math.max(60, Math.abs(x2 - x1) * 0.35);
      link.setAttribute('d', `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${((x1 + x2) / 2).toFixed(1)} ${(Math.min(y1, y2) - lift).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    }
    const clearTimers = () => { clearTimeout(revealTimer); clearTimeout(nextTimer); };

    function reveal(byPlayer) {
      if (revealed) return;
      revealed = true;
      clearTimers();
      stage.querySelectorAll(`.sym-btn[data-id="${pair.shared.id}"]`).forEach(el => el.classList.add('is-match'));
      stage.querySelectorAll('.sym-btn:not(.is-match)').forEach(el => el.classList.add('is-faded'));
      connect();
      stage.classList.add('is-revealed');
      const next = '<button type="button" class="hero-next">Next pair <span aria-hidden="true">→</span></button>';
      if (byPlayer) {
        finds += 1;
        const nudge = finds >= NUDGE_AFTER ? `<span class="hero-nudge">You’re good at this! Draw a whole kolam in the ${FULL_GAME}</span>` : '';
        caption.innerHTML = `<span class="hero-found">You found it!</span> ${describe(pair.shared)} ${nudge}<span class="hero-links">${next}${finds < NUDGE_AFTER ? FULL_GAME : ''}</span>`;
      } else {
        caption.innerHTML = `Both cards share ${describe(pair.shared)} <span class="hero-links">${next}${FULL_GAME}</span>`;
      }
      if (!engaged && !reducedMotion) nextTimer = setTimeout(autoNext, SHOW_MS);
    }

    function show() {
      pair = makePair();
      renderCard(ha, pair.a, { interactive: true, onPick: pick });
      renderCard(hb, pair.b, { interactive: true, onPick: pick });
      stage.classList.remove('is-revealed');
      revealed = false;
      caption.innerHTML = '<span class="hero-prompt">Can you spot the one symbol on both cards? <strong>Tap it.</strong></span>';
      clearTimers();
      fadeSide = Math.round(Math.random());
      if (!reducedMotion) revealTimer = setTimeout(fadeOne, FADE_AFTER);
    }
    // Fade one more wrong symbol (alternating cards); once only the match is left, reveal it
    function fadeOne() {
      if (revealed) return;
      const cards = fadeSide++ % 2 ? [hb, ha] : [ha, hb];
      for (const card of cards) {
        const left = [...card.querySelectorAll('.sym-btn:not(.is-faded)')].filter(b => b.dataset.id !== pair.shared.id);
        if (left.length) { left[Math.floor(Math.random() * left.length)].classList.add('is-faded'); break; }
      }
      if (stage.querySelectorAll('.sym-btn:not(.is-faded)').length <= 2) revealTimer = setTimeout(() => reveal(false), FADE_EVERY);
      else revealTimer = setTimeout(fadeOne, FADE_EVERY);
    }

    function deal() {
      stage.classList.add('is-out');
      setTimeout(() => { show(); stage.classList.remove('is-out'); }, 380);
    }
    function autoNext() {
      if (engaged) return;
      if (hovering || document.hidden) { nextTimer = setTimeout(autoNext, 1500); return; }
      deal();
    }

    // Any tap on the cards hands them to the player until they go quiet for IDLE_MS
    function engage() {
      engaged = true;
      clearTimeout(nextTimer);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { engaged = false; if (revealed) nextTimer = setTimeout(autoNext, 1500); }, IDLE_MS);
    }

    function pick(btn) {
      engage();
      if (revealed) return;
      if (btn.dataset.id === pair.shared.id) { reveal(true); return; }
      btn.classList.remove('is-wrong');
      void btn.offsetWidth;
      btn.classList.add('is-wrong');
    }

    caption.addEventListener('click', e => {
      if (!e.target.closest('.hero-next')) return;
      engage();
      deal();
    });
    stage.addEventListener('mouseenter', () => { hovering = true; });
    stage.addEventListener('mouseleave', () => { hovering = false; });

    show();
    const reconnect = () => { if (stage.classList.contains('is-revealed')) connect(); };
    window.addEventListener('resize', () => requestAnimationFrame(reconnect));
    document.fonts && document.fonts.ready.then(reconnect);
    window.__shodhHero = { get pair() { return pair; }, get finds() { return finds; }, next: deal, pick, FADE_AFTER, FADE_EVERY };
  }

  /* ---------- Home: side rail of section numbers ----------
     Built from each section's "१ About"-style label. Wide screens only (CSS). */
  if (document.body.dataset.page === 'home') {
    const secs = [...document.querySelectorAll('main section[id]')].filter(sec => sec.querySelector('.sec-num .num') && sec.getClientRects().length);   // skip sections the flags hide
    if (secs.length) {
      const rail = document.createElement('nav');
      rail.className = 'side-rail';
      rail.setAttribute('aria-label', 'On this page');
      rail.innerHTML = '<ol>' + secs.map(sec => {
        const label = sec.querySelector('.sec-num');
        const num = label.querySelector('.num').textContent;
        const text = label.textContent.replace(num, '').trim();
        return `<li><a href="#${sec.id}"><span class="rail-num" lang="hi">${num}</span><span class="rail-label">${text}</span></a></li>`;
      }).join('') + '</ol>';
      document.body.appendChild(rail);
      const links = [...rail.querySelectorAll('a')];
      const hero = document.querySelector('.hero');
      const setCurrent = () => {
        const line = window.innerHeight * 0.35;
        let cur = -1;
        secs.forEach((sec, i) => { if (sec.getBoundingClientRect().top <= line) cur = i; });
        links.forEach((a, i) => a.toggleAttribute('aria-current', i === cur));
        rail.classList.toggle('is-shown', !hero || hero.getBoundingClientRect().bottom < window.innerHeight * 0.6);
      };
      let queued = false;
      window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; setCurrent(); }); } }, { passive: true });
      window.addEventListener('resize', setCurrent);
      setCurrent();
    }
  }

  // For game.js (play.html)
  window.Shodh = { SYMBOLS, src, SPEAKER, canSpeak, speak, pref, nameFor, describe, makePair, renderCard, shuffle, reducedMotion, PER_CARD };

  /* ---------- Share ---------- */
  const shareMsg = flags.waitlist
    ? 'Shodh – The Culture Search: an Indian twist on ‘Spot It!’ for kids, soon shipping as a real deck. Join the waitlist: '
    : 'Shodh – The Culture Search: a free printable Indian twist on ‘Spot It!’ for kids. ';
  const url = location.href.split('#')[0].split('?')[0] + (flags.waitlist ? '#waitlist' : '');
  document.querySelectorAll('[data-share="wa"]').forEach(a => { a.href = 'https://wa.me/?text=' + encodeURIComponent(shareMsg + url); });
  document.querySelectorAll('[data-share="copy"]').forEach(btn => btn.addEventListener('click', async () => {
    const status = btn.closest('.share').querySelector('.share-status');
    try { await navigator.clipboard.writeText(url); status.textContent = 'Link copied.'; }
    catch (e) { status.textContent = url; }
  }));
  if (navigator.share) document.querySelectorAll('[data-share="native"]').forEach(btn => {
    btn.hidden = false;
    btn.addEventListener('click', () => navigator.share({ title: 'Shodh – The Culture Search', text: shareMsg, url }).catch(() => {}));
  });

  /* ---------- Forms: sign-up and feedback ----------
     Both send nothing until their data-endpoint is set to a form service URL. */
  function wireForm(form, msg, { validate, success, notConnected }) {
    const say = (text, isError) => { msg.textContent = text; msg.classList.toggle('is-error', !!isError); };
    form.addEventListener('input', () => say(''));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const problem = validate();
      if (problem) { say(problem, true); return; }
      const endpoint = form.dataset.endpoint;
      if (!endpoint) { say(notConnected); form.reset(); return; }
      try {
        await fetch(endpoint, { method: 'POST', body: new FormData(form), mode: 'no-cors' });
        say(success);
        form.reset();
      } catch (err) {
        say('That didn’t go through. Please try again.', true);
      }
    });
  }

  const notify = document.getElementById('notify');
  if (notify) {
    const email = notify.querySelector('input[type=email]');
    wireForm(notify, document.getElementById('notify-msg'), {
      validate: () => {
        if (!notify.querySelector('input[name=interest]:checked')) return 'Pick at least one thing to hear about.';
        if (!email.value.trim() || !email.checkValidity()) return 'Enter a valid email address.';
        return '';
      },
      success: 'Thanks! We’ll be in touch when there’s news.',
      notConnected: 'Sign-ups open soon. Thanks for your interest!',
    });
  }

  // Waitlist: posts the answers straight to the Google Form, so people stay on the page.
  // Google doesn't let a website read its reply, so a sent form is taken as saved.
  const waitlist = document.getElementById('waitlist-form');
  if (waitlist) {
    const email = waitlist.querySelector('input[type=email]');
    const country = waitlist.querySelector('select');
    const msg = document.getElementById('wl-msg');
    const say = (text, isError) => { msg.textContent = text; msg.classList.toggle('is-error', !!isError); };
    waitlist.addEventListener('input', () => say(''));
    waitlist.addEventListener('submit', async e => {
      e.preventDefault();
      if (!email.value.trim() || !email.checkValidity()) { say('Enter a valid email address.', true); email.focus(); return; }
      if (!country.value) { say('Choose your country.', true); country.focus(); return; }
      const done = () => {
        say('');
        msg.innerHTML = 'You’re on the list! We’ll email you once, when the deck is ready. <a href="play.html">Play online in the meantime <span aria-hidden="true">→</span></a>';
        waitlist.reset();
      };
      if (!WAITLIST_FORM.action) { done(); return; }
      const body = new URLSearchParams();
      body.append('entry.' + WAITLIST_FORM.email, email.value.trim());
      body.append('entry.' + WAITLIST_FORM.country, country.value);
      waitlist.querySelectorAll('input[name=use]:checked').forEach(c => body.append('entry.' + WAITLIST_FORM.uses, c.value));   // one entry per ticked box
      const btn = waitlist.querySelector('button[type=submit]');
      btn.disabled = true;
      try {
        await fetch(WAITLIST_FORM.action, { method: 'POST', mode: 'no-cors', body });
        done();
      } catch (err) {
        say('That didn’t go through. Check your connection and try again.', true);
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ---------- Waitlist: a rough price for the country you pick ----------
     When the page opens, the country is guessed from the browser's own time
     zone (nothing is looked up or sent anywhere) and can be changed in the form;
     the price line follows it. Adjust the ranges here. */
  const PRICES = { 'United States': 'About US $20–30', 'India': 'About ₹500–1,000' };
  const PRICE_BOTH = 'About US $20–30 in the US, ₹500–1,000 in India';
  const PRICE_OTHER = 'We’ll confirm a price for your country once printing and shipping are worked out';
  const ZONES = [
    [/^Asia\/(Kolkata|Calcutta)$/, 'India'],
    [/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Juneau|Adak|Nome|Sitka|Metlakatla|Yakutat|Menominee|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)$|^Pacific\/Honolulu$/, 'United States'],
    [/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Moncton|Whitehorse|Yellowknife|Iqaluit)$/, 'Canada'],
    [/^Europe\/(London|Belfast)$/, 'United Kingdom'],
    [/^Australia\//, 'Australia'],
    [/^Asia\/Dubai$/, 'United Arab Emirates'],
    [/^Asia\/Singapore$/, 'Singapore'],
  ];
  const priceEl = document.getElementById('deck-price');
  const countrySel = document.getElementById('wl-country');
  if (priceEl && countrySel) {
    const showPrice = () => { priceEl.textContent = !countrySel.value ? PRICE_BOTH : PRICES[countrySel.value] || PRICE_OTHER; };
    let zone = '';
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* ignore */ }
    const guess = (ZONES.find(([re]) => re.test(zone)) || [])[1];
    if (guess && !countrySel.value) countrySel.value = guess;
    countrySel.addEventListener('change', showPrice);
    countrySel.closest('form').addEventListener('reset', () => setTimeout(() => { if (guess) countrySel.value = guess; showPrice(); }));
    showPrice();
  }

  // the drawn deck: three cards where, like the real deck, each pair shares exactly one symbol
  const daCards = document.querySelectorAll('.da-card');
  if (daCards.length === 3) {
    const pool = shuffle(SYMBOLS.slice()), [ab, ac, bc] = pool;
    const own = i => pool.slice(3 + i * 4, 7 + i * 4);
    [[ab, ac], [ab, bc], [ac, bc]].forEach((shared, i) => renderCard(daCards[i], shuffle(shared.concat(own(i)))));
  }

  /* ---------- From our family: each person's favourite symbol ----------
     One pick shows still. "toss" (Parth) is a coin with one symbol on each
     side that turns over every few seconds. "changed" (Rishi) shows the last
     pick, with the ones he changed his mind about crossed out above it. */
  const symImg = s => `<img src="${src(s)}" alt="${s.name}">`;
  document.querySelectorAll('.person-sym').forEach(box => {
    const picks = box.dataset.picks.split(/\s+/).map(id => SYMBOLS.find(s => s.id === id)).filter(Boolean);
    const style = box.dataset.style;
    if (style === 'toss' && picks.length === 2) {
      box.innerHTML = `<span class="coin"><span class="face">${symImg(picks[0])}</span><span class="face face-back">${symImg(picks[1])}</span></span>`;
      if (reducedMotion) return;
      const coin = box.firstElementChild;
      let turns = 0;
      setInterval(() => { if (!document.hidden) coin.style.transform = `rotateY(${++turns * 180}deg)`; }, 2600);
      return;
    }
    if (style === 'changed') {
      const last = picks[picks.length - 1];
      box.innerHTML = `<span class="pick">${symImg(last)}</span>`;
      box.insertAdjacentHTML('beforebegin', `<ul class="crossed" aria-label="Not his favourite any more">${picks.slice(0, -1).map(s => `<li>${symImg(s)}</li>`).join('')}</ul>`);
      return;
    }
    box.innerHTML = `<span class="pick">${symImg(picks[0])}</span>`;
  });

  const feedback = document.getElementById('feedback-form');
  if (feedback) {
    const message = feedback.querySelector('textarea');
    const email = feedback.querySelector('input[type=email]');
    wireForm(feedback, document.getElementById('fb-msg'), {
      validate: () => {
        if (!message.value.trim()) return 'Write a message first.';
        if (email.value.trim() && !email.checkValidity()) return 'That email doesn’t look right. Fix it or leave it blank.';
        return '';
      },
      success: 'Thank you! Your message is on its way to us.',
      notConnected: 'Thanks! Messages aren’t connected yet, so this one wasn’t sent.',
    });
  }
})();
