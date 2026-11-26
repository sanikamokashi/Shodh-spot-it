#!/bin/sh
# Rebuilds the round printable card PDFs from cards.html (needs Google Chrome).
# Run from the project folder:  sh tools/build-cards.sh
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p downloads
for size in letter a4; do
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=8000 \
    --print-to-pdf="$PWD/downloads/shodh-cards-round-$size.pdf" "file://$PWD/cards.html?size=$size"
done
