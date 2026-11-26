#!/usr/bin/env python3
"""Lays out every round card so no two symbols touch and nothing crosses the edge.

Reads deck.js, places each card's symbols (one in the middle, the rest in a ring;
mixed sizes, tilted, now and then upside down) using the transparent symbol
pictures in images/symbols-cut/, retries until every symbol keeps a clear gap
from its neighbours and from the edge, and writes card-layouts.js for cards.html.
Needs Pillow and numpy:  python3 tools/card-layouts.py
"""
import re, random, numpy as np
from PIL import Image

S = 600                      # a card drawn 600px across while checking
GAP = 7                      # clear space kept between symbols, in those pixels (about 0.04in)
EDGE = 0.035 * S             # clear space kept inside the cutting line

def read_deck(name):
    js = open('deck.js').read()
    body = re.search(r'window\.' + name + r' = \[(.*?)\n\];', js, re.S).group(1)
    return [re.findall(r"'([a-z-]+)'", line) for line in body.strip().split('\n')]

_cache = {}
def outline(sid, size, rot):
    key = (sid, size, rot)
    if key not in _cache:
        im = Image.open(f'images/symbols-cut/{sid}.png').convert('RGBA').resize((size, size), Image.LANCZOS)
        a = np.array(im.rotate(-rot, resample=Image.BICUBIC, expand=True).getchannel('A')) > 40
        _cache[key] = a
    return _cache[key]

def grow(m, r):
    out = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy <= r * r:
                out |= np.roll(np.roll(m, dy, 0), dx, 1)
    return out

yy, xx = np.mgrid[0:S, 0:S]
INSIDE = (xx - S / 2) ** 2 + (yy - S / 2) ** 2 <= (S / 2 - EDGE) ** 2

def try_card(ids, rand, scale):
    n = len(ids)
    ring, r, w = n - 1, (31 if n > 6 else 29), (23 if n > 6 else 27)
    turn = rand.random() * 360
    slots = [(50, 50, w * 1.25 * scale)]
    for i in range(ring):
        a = np.radians(turn + i * 360 / ring + rand.uniform(-5, 5))
        slots.append((50 + r * np.cos(a), 50 + r * np.sin(a), w * rand.uniform(0.86, 1.10) * scale))
    order = ids[:]; rand.shuffle(order)
    taken = np.zeros((S, S), bool); placed = []
    for sid, (cx, cy, sw) in zip(order, slots):
        rot = (180 if rand.random() < 0.12 else 0) + rand.randint(-35, 35)
        m = outline(sid, round(sw / 100 * S), rot)
        big = np.zeros((S + 2 * S, S + 2 * S), bool)
        y0, x0 = int(round(cy / 100 * S - m.shape[0] / 2)) + S, int(round(cx / 100 * S - m.shape[1] / 2)) + S
        big[y0:y0 + m.shape[0], x0:x0 + m.shape[1]] = m
        mm = big[S:2 * S, S:2 * S]
        if mm.sum() != m.sum() or (mm & ~INSIDE).any():   # past the edge
            return None
        if (grow(mm, GAP) & taken).any():                  # too close to a neighbour
            return None
        taken |= mm
        placed.append([sid, round(cx, 1), round(cy, 1), round(sw, 1), rot])
    return placed

def lay_out(deck, seed):
    out = []
    for k, ids in enumerate(deck):
        rand = random.Random(seed * 1000 + k)
        for attempt in range(4000):
            scale = 1.0 - 0.04 * (attempt // 400)          # if it won't fit, shrink a little and keep trying
            got = try_card(ids, rand, scale)
            if got: break
        else:
            raise SystemExit(f'card {k + 1} would not fit')
        out.append(got)
        print(f'  card {k + 1}: {attempt + 1} tries, scale {scale:.2f}', flush=True)
    return out

def to_js(name, cards):
    rows = ',\n'.join('  [' + ', '.join(f"['{s}', {x}, {y}, {w}, {r}]" for s, x, y, w, r in c) + ']' for c in cards)
    return f'window.{name} = [\n{rows}\n];\n'

if __name__ == '__main__':
    js = ('// Where each symbol sits on each round card: [symbol, x %, y %, width %, rotation deg].\n'
          '// Made by tools/card-layouts.py so no two symbols touch and nothing crosses the edge.\n')
    for name, seed in (('SHODH_DECK', 1), ('SHODH_DECK_6', 2)):
        print(name)
        js += to_js(name.replace('DECK', 'LAYOUT'), lay_out(read_deck(name), seed))
    open('card-layouts.js', 'w').write(js)
    print('wrote card-layouts.js')
