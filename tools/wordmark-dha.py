# Rebuilds the शोध wordmark path used in index.html (#shodh-word).
# Needs: pip install fonttools uharfbuzz skia-pathops, and RozhaOne-Regular.ttf (Google Fonts, OFL).
# Usage: python3 wordmark-dha.py RozhaOne.ttf out.json '<params json>'   (out.json["d"] is the path, in font units, y down)
# Current wordmark (24 Nov): one smooth outline for the loop ("cap"), no seams:
#   '{"cut_y":405,"cap":[["M",1175,329],["Q",1127,335,1097.5,363.5],["Q",1068,392,1068,432],["C",1068,505,1115,560,1180,560],["C",1250,560,1295,520,1295,470],["C",1295,425,1209,440,1209,405],["Z"]],"inner":[1238,478,42,60]}'
# Older version (ellipse + neck ellipses, left a small step where they met):
#   '{"cut_y":400,"outer":[1180,470,115,90],"inner":[1236,476,44,64],"neck":[[1142,408,70,52]]}'
# Redraw Rozha One's ध with a closed round loop at the top (instead of the flat
# headline over an open bowl, which reads as घ). Works in font units, y up.
import sys, json, pathops
from fontTools.ttLib import TTFont
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.svgPathPen import SVGPathPen
import uharfbuzz as hb

P = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
font_path, out = sys.argv[1], sys.argv[2]
tt = TTFont(font_path); gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
blob = hb.Blob.from_file_path(font_path); f = hb.Font(hb.Face(blob))
buf = hb.Buffer(); buf.add_str("शोध"); buf.guess_segment_properties(); hb.shape(f, buf, {})

def glyph_path(name, x):
    p = pathops.Path(); gs[name].draw(TransformPen(p.getPen(), (1, 0, 0, 1, x, 0))); return p

def rect(x0, y0, x1, y1):
    p = pathops.Path(); pen = p.getPen()
    pen.moveTo((x0, y0)); pen.lineTo((x1, y0)); pen.lineTo((x1, y1)); pen.lineTo((x0, y1)); pen.closePath(); return p

def ellipse(cx, cy, rx, ry, rev=False):
    k = 0.5523
    p = pathops.Path(); pen = p.getPen()
    pts = [(cx + rx, cy), (cx, cy + ry), (cx - rx, cy), (cx, cy - ry)]
    if rev: pts = pts[::-1]
    pen.moveTo(pts[0])
    for i in range(4):
        a, b = pts[i], pts[(i + 1) % 4]
        # tangent handles
        def h(pt, toward):
            dx, dy = toward[0] - pt[0], toward[1] - pt[1]
            # handle along the axis perpendicular to the radius
            if pt[1] == cy:  # left/right extreme: vertical tangent
                return (pt[0], pt[1] + (k * ry if toward[1] > cy else -k * ry))
            return (pt[0] + (k * rx if toward[0] > cx else -k * rx), pt[1])
        pen.curveTo(h(a, b), h(b, a), b)
    pen.closePath(); return p

def op(a, b, kind):
    return pathops.op(a, b, kind)

parts = []
x = 0
for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
    name = order[info.codepoint]
    parts.append((name, x)); x += pos.x_advance
width = x

word = pathops.Path()
for name, gx in parts[:2]:
    word = op(word, glyph_path(name, gx), pathops.PathOp.UNION)

dha = glyph_path(parts[2][0], parts[2][1])
cut_y = P.get('cut_y', 330)
# remove the left headline and the open upper bowl
dha = op(dha, rect(970, cut_y, 1345, 600), pathops.PathOp.DIFFERENCE)
# new closed loop: outer ellipse minus an off-centre counter (thick left, hairline top/right)
i = P.get('inner', [1253, 441, 47, 97])
if 'cap' in P:   # explicit outline: [["M",x,y],["Q",cx,cy,x,y],["C",c1x,c1y,c2x,c2y,x,y],["Z"]] in font units, y up
    outer = pathops.Path(); pen = outer.getPen()
    for cmd, *a in P['cap']:
        if cmd == 'M': pen.moveTo((a[0], a[1]))
        elif cmd == 'L': pen.lineTo((a[0], a[1]))
        elif cmd == 'Q': pen.qCurveTo((a[0], a[1]), (a[2], a[3]))
        elif cmd == 'C': pen.curveTo((a[0], a[1]), (a[2], a[3]), (a[4], a[5]))
        elif cmd == 'Z': pen.closePath()
else:
    outer = ellipse(*P.get('outer', [1195, 442, 128, 120]))
loop = op(outer, ellipse(*i), pathops.PathOp.DIFFERENCE)
dha = op(dha, loop, pathops.PathOp.UNION)
for nk in P.get('neck', []):   # optional ellipses joining a smaller loop to the lower bowl
    dha = op(dha, ellipse(*nk), pathops.PathOp.UNION)
word = op(word, dha, pathops.PathOp.UNION)

pen = SVGPathPen(None)
word.draw(TransformPen(pen, (1, 0, 0, -1, 0, 0)))
asc = 900; desc = 300
json.dump({"d": pen.getCommands(), "width": width, "asc": asc, "desc": desc}, open(out, 'w'))
