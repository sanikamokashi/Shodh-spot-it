// Feature flags. Load this in <head>, before styles.css, on every page, so the
// right version shows from the first paint with no flash of the other one.
//
// waitlist  off: the printable site (Download page, Print it, From our family, Say hello on home)
//           on:  the ship-to-you site (Join the waitlist, the family's favourite symbols,
//                Say hello on the Play page; the printables aren't linked)
//
// Turn a flag on for everyone by setting it to true below. To preview it in
// your own browser only, add ?waitlist=on to any page address (remembered in
// this browser until you visit with ?waitlist=off).
//
// In the HTML, mark what belongs to each version:
//   data-flag="waitlist"      shows only when the flag is on
//   data-flag-off="waitlist"  shows only when it is off
(function () {
  const DEFAULTS = { waitlist: true };

  const flags = Object.assign({}, DEFAULTS);
  const q = new URLSearchParams(location.search);
  Object.keys(DEFAULTS).forEach(name => {
    const key = 'shodh-flag-' + name;
    const asked = q.get(name);
    try {
      if (asked === 'on' || asked === 'off') localStorage.setItem(key, asked);
      const saved = localStorage.getItem(key);
      if (saved) flags[name] = saved === 'on';
    } catch (e) {
      if (asked) flags[name] = asked === 'on';
    }
  });

  const root = document.documentElement;
  Object.keys(flags).forEach(name => root.classList.toggle('flag-' + name, flags[name]));
  // hide what the flags say isn't part of this version, before anything draws
  const css = Object.keys(flags).map(name => flags[name]
    ? `[data-flag-off~="${name}"]{display:none!important}`
    : `[data-flag~="${name}"]{display:none!important}`).join('');
  const style = document.createElement('style');
  style.id = 'flag-styles';
  style.textContent = css;
  document.head.appendChild(style);

  window.SHODH_FLAGS = flags;
})();
