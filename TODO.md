# Shodh site: to do

Done (23 Nov 2026), check in your browser:

- [x] 1. Accent strip draws once left to right (both strands together), outer accent dots appear at the end, then stays still. Switch to static or the old loop in `?dev` → First strip → Animation.
- [x] 2. "Spot-It is one of Parth and Rishi's favorite games…" moved into the paragraph below.
- [x] 3. Hero kolam line width 2px.
- [x] 4. Hero cards offset (right card lower). On a match the caption shows the symbol's Marathi/Hindi name and meaning.
- [x] 5. Gold glow behind the matching symbols (hero and game). "Try it out yourself →".
- [x] 6. "About the game" → "The story behind Shodh".
- [x] 7. Less padding below the About section.
- [x] 8. Math section links to Wikipedia's finite projective planes section.
- [x] 9. New Symbols subheading; compact cards with picture beside the names.
- [x] 10. Strip after Symbols: fully drawn; dots ripple out from the pointer on hover (tap on touch screens). `?dev` → Strip after Symbols → Animation.
- [x] 11. Game: Start playing button starts the clock; Hint mode checkbox (after 10s a wrong symbol fades to 50% every 3.5s, alternating cards); after a match the pair stays 6.5s with the full description and a "Next cards →" link.

- [x] Play now restyled as the kolam journey: 10 matches draw a kolam; learn card after each match; finish screen with best time and WhatsApp share.
- [x] Site split into pages (24 Nov): Home (one scroll, side rail of section numbers on wide screens), Symbols (symbols.html), Play (play.html), Download (download.html). Menu = pages only; header/footer live in site.js.
- [x] Hero cards are playable (tap the match; "Play the full game" after 2 finds). Play now section removed from home.
- [x] play.html: Kolam journey + Beat the clock (60s on the kolam table, pile of cards, best score) + "More games coming soon". play.html#clock opens Beat the clock.
- [x] All 57 symbols with real art; See all; printable symbol guide (downloads/, guide.html).

Still open:

Polish list (24 Nov), done, check in your browser:

- [x] शोध: ध loop redrawn as one smooth outline (no step where it meets the letter). Params in tools/wordmark-dha.py.
- [x] More space between शोध and the "Shodh" line; less white space below the hero.
- [x] Hero kolam: no dot hop, draws at about half the speed, and the line gently clears around the mouse and redraws slowly after it (?dev → Hero → Part at mouse).
- [x] Strip under "A keepsake with a story": main dots start at the heading's left edge (left accent dot hangs outside) and end at the text's right edge; draws left to right each time it comes into view and when pointed at.
- [x] Strips below Symbols and above "From our family": draw once on scroll; pointing at them redraws the line outward from the pointer, restarting from the new spot even mid-animation (?dev → Lower strips → bloom).
- [x] Math: "More about the math ↗" on its own line.
- [x] Side rail: names only on hover; shown only on screens 1360px and wider, clear of the content.
- [x] Menu: Play and Download are plain links (no icon, no button).
- [x] Fixes (24 Nov, later): hero kolam back to slow drawing, no mouse parting, lines 2.6px. Hero cards: from 2.5s the wrong symbols fade one by one, then the match glows. Lower strips: sweep once, then the dot waver from the pointer (?dev → Lower strips → wave). "More game modes coming soon". Hints/Pause "on" state keeps its colour on hover. Beat the clock card backs are cream.

- [x] 8 symbols (24 Nov, evening): hero and game cards now carry 8 symbols like the printed deck (one centre, seven around, mixed sizes, now and then one upside down). Hero match glows at about 9s. Play page has "Symbols per card": Classic 8 (default) or Easy 6, remembered; each keeps its own best (Easy keeps your old scores). On phones the game cards stack, offset, and are much bigger.
- [x] Download: rectangular cards PDF built from images/cards (downloads/shodh-cards-rectangular-a4.pdf, and a US Letter version with the A4 page scaled to 94% to fit). Round cards marked "Coming soon".
- [x] Play page colours (24 Nov, night): the card table now shows in both modes. Kolam journey: full-width table, and each match draws one more section of the kolam border around it (3 along the top, 2 down the right, 3 along the bottom, 2 up the left; it starts as dots). Beat the clock: full border, with the countdown panel joined to the table. Colours for each mode and the panel in play.html?dev (presets: maroon, ivory, peacock), defaults in table.js.
- [x] Table look (24 Nov, late): peacock green table with ivory and gold, rounded corners, ivory buttons with soft gradients. Beat the clock has no side panel: the countdown, count and pile sit in a box on the table. Kolam journey's table keeps one height whether or not the symbol box is showing. ?dev → Boxes sets the box colours for both modes.
- [x] Polish (24 Nov, last): the play table is one height in both modes, before, during and after a game. Symbols page: printable guide at the top; only मराठी / हिंदी are boxed. Symbol guide now comes in Marathi and Hindi versions (downloads/shodh-symbol-guide-{marathi,hindi}-{letter,a4}.pdf, sh tools/build-guide.sh), wider intro, new ध. Buttons site-wide have 4px rounded corners.

Waitlist version (branch ship-to-you, behind the waitlist flag in flags.js; preview with ?waitlist=on):

- [x] Menu: Symbols, Play, Join the waitlist. Home: hero points to the waitlist; ५ Join the waitlist (deck facts, form, sharing); ६ From our family to yours (favourite symbols). Say hello on the Play page. Printables not linked.
- Connect the waitlist form: make the Google Form (Email, Country, and a checkbox question "What would you use it for?" with the same three options as the site, word for word: "For our family game nights", "As gifts for friends or family", "Custom event batch (birthdays, Diwali, Munja)"; Country options: United States, India, Other), then fill in WAITLIST_FORM at the top of app.js.
- Deck details in ५ are placeholders. Price ranges (US $20–30, India ₹500–1,000; others "we'll confirm") are in PRICES at the top of the price code in app.js.
- Swap the drawn deck (.deck-art) for a real photo when there is one.
- Shantanu's line is a placeholder: "Nothing beats gully cricket with a season ball."
- To launch: set waitlist: true in flags.js.

Later:

- Card backs: a pattern page the same size as the card sheets, so people can print front and back, then cut.
- Round-card printables.

- Proofread Marathi/Hindi names and meanings for symbols 25–57 (symbols.js).

12. _(to be added)_
