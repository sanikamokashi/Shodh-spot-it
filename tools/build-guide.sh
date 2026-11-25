#!/bin/sh
# Rebuilds the printable symbol guide PDFs from guide.html (needs Google Chrome).
# Run from the project folder:  sh tools/build-guide.sh
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p downloads
for lang in marathi hindi; do
  code=mr; [ "$lang" = hindi ] && code=hi
  for size in letter a4; do
    "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=6000 \
      --print-to-pdf="$PWD/downloads/shodh-symbol-guide-$lang-$size.pdf" "file://$PWD/guide.html?lang=$code&size=$size"
  done
done
