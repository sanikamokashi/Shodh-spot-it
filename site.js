// Shared page chrome: the शोध wordmark sprite, the header and the footer.
// Every page loads this first thing in <body> with <body data-page="home|symbols|play|download">,
// so the header is written once here and looks identical everywhere.
// The menu only holds separate pages; sections of the home page are reached
// from the side rail on the home page (see app.js).
(function () {
  const page = document.body.dataset.page || 'home';
  const home = page === 'home' ? '#top' : 'index.html';
  const here = p => (p === page ? ' aria-current="page"' : '');

  const sprite = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="shodh-gold" x1="0" y1="0.37" x2="1" y2="0.63">
        <stop offset="0" style="stop-color:var(--gold-deep)"/>
        <stop offset=".3" style="stop-color:var(--gold)"/>
        <stop offset=".5" style="stop-color:var(--gold-light)"/>
        <stop offset=".7" style="stop-color:var(--gold)"/>
        <stop offset="1" style="stop-color:var(--gold-deep)"/>
      </linearGradient>
      <!-- Rozha One, with ध redrawn to have its closed round loop at the top (tools/wordmark-dha.py) -->
      <symbol id="shodh-word" viewBox="-20 -790 1672 794"><path d="M1028.0 -560.0H-20.0V-540.0H121.0Q66.0 -512.0 66.0 -452.0Q66.0 -415.0 87.0 -393.5Q108.0 -372.0 138.5 -372.0Q169.0 -372.0 186.5 -389.5Q204.0 -407.0 204.0 -433.5Q204.0 -460.0 191.0 -474.5Q178.0 -489.0 162.0 -492.0Q120.0 -500.0 120.0 -512.0Q120.0 -540.0 184.0 -540.0Q214.0 -540.0 238.0 -510.0Q262.0 -480.0 262.0 -421.0Q262.0 -338.0 211.0 -295.5Q160.0 -253.0 63.0 -253.0H20.0V-233.0Q36.0 -226.0 45.0 -219.0Q71.0 -199.0 106.0 -114.0Q157.0 4.0 305.0 4.0Q370.0 4.0 411.0 -18.0L406.0 -32.0Q396.0 -27.0 374.0 -27.0Q308.0 -27.0 278.0 -94.0Q266.0 -122.0 253.0 -151.0Q240.0 -180.0 214.0 -203.0Q188.0 -226.0 149.0 -231.0V-235.0H168.0Q261.0 -235.0 329.5 -277.5Q398.0 -320.0 398.0 -405.0Q398.0 -504.0 320.0 -540.0H488.0V0.0H628.0V-540.0H788.0V0.0H928.0V-540.0H1028.0ZM1366.0 -560.0V-540.0H1412.0V-169.0Q1406.0 -130.0 1377.0 -108.5Q1348.0 -87.0 1305.0 -87.0Q1262.0 -87.0 1231.0 -117.0Q1200.0 -147.0 1200.0 -198.0Q1200.0 -249.0 1226.0 -282.0Q1252.0 -315.0 1303.0 -315.0H1329.0V-335.0H1302.0Q1258.0 -335.0 1233.0 -362.5Q1227.71630859375 -368.31207275390625 1223.5491943359375 -374.9731140136719C1213.0001220703125 -398.5078125 1232.870361328125 -412.01220703125 1254.3096923828125 -426.5827941894531C1273.99365234375 -439.96044921875 1295.0 -454.2368469238281 1295.0 -478.0C1295.0 -525.0 1250.0 -560.0 1180.0 -560.0C1115.0 -560.0 1068.0 -505.0 1068.0 -432.0Q1068.0 -417.7724609375 1071.732177734375 -404.99981689453125Q1078.4927978515625 -381.8628845214844 1097.5 -363.5Q1127.0 -335.0 1175.0 -329.0V-325.0Q1116.0 -314.0 1085.5 -277.0Q1055.0 -240.0 1055.0 -187.0Q1055.0 -117.0 1109.0 -78.0Q1163.0 -39.0 1231.0 -39.0Q1299.0 -39.0 1345.0 -60.0Q1391.0 -81.0 1412.0 -118.0V0.0H1552.0V-540.0H1652.0V-560.0ZM634.0 -691.0Q652.0 -678.0 681.0 -665.5Q710.0 -653.0 761.5 -632.0Q813.0 -611.0 860.0 -589.0L869.0 -603.0Q832.0 -639.0 793.5 -680.0Q755.0 -721.0 733.0 -743.0Q711.0 -765.0 693.5 -777.5Q676.0 -790.0 655.5 -790.0Q635.0 -790.0 620.0 -776.0Q605.0 -762.0 605.0 -736.5Q605.0 -711.0 634.0 -691.0ZM1280.0 -490.0C1280.0 -461.2803955078125 1262.092041015625 -438.0 1240.0 -438.0C1217.907958984375 -438.0 1200.0 -461.2803955078125 1200.0 -490.0C1200.0 -518.7196044921875 1217.907958984375 -542.0 1240.0 -542.0C1262.092041015625 -542.0 1280.0 -518.7196044921875 1280.0 -490.0Z"/></symbol>
    </defs>
  </svg>`;

  const brand = label => `
      <a class="brand" href="${home}" aria-label="Shodh, The Culture Search, home">
        <span class="brand-dev" lang="hi"><svg class="wordmark" viewBox="0 0 1672 794" role="img" aria-label="शोध"><use href="#shodh-word"/></svg></span>
        <span class="brand-en">${label}</span>
      </a>`;

  const header = `
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="container header-inner">${brand('Shodh')}
      <nav class="site-nav" aria-label="Pages">
        <a href="symbols.html"${here('symbols')}>Symbols</a>
        <a href="play.html"${here('play')}>Play</a>
        <a href="download.html"${here('download')}>Download</a>
      </nav>
    </div>
  </header>`;

  const footer = `
    <div class="container footer-inner">${brand('Shodh · The Culture Search')}
      <nav class="footer-nav" aria-label="Footer">
        <a href="${page === 'home' ? '#top' : 'index.html'}">Home</a>
        <a href="symbols.html">Symbols</a>
        <a href="play.html">Play</a>
        <a href="download.html">Download</a>
        <a href="${page === 'home' ? '' : 'index.html'}#feedback">Say hello</a>
      </nav>
      <p>Made with love as a keepsake for Parth’s Munja ceremony.</p>
    </div>`;

  document.currentScript.insertAdjacentHTML('afterend', sprite + header);
  const putFooter = () => {
    let f = document.querySelector('footer.site-footer');
    if (!f) { f = document.createElement('footer'); f.className = 'site-footer'; document.body.appendChild(f); }
    f.innerHTML = footer;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', putFooter); else putFooter();
})();
