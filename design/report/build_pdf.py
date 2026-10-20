"""Builds YasamHatti-proje-dosyasi-son-v3.pdf.

pages 1-7   original report (untouched, from the original PDF)
pages 8-11  designed UI/UX explanation pages (design-pages.html printed by Edge, see make.ps1)
pages 12-15 the Turkish dark design board (42 screens), cut at section borders into 4 pages:
            [1 Başlangıç + 2 Durum bildirme] [3 Otomatik algılama + 4 Harita]
            [5 Güvenli bağış + 6 Gönüllü] [7 Profil + 8 Akıllı saat]

The board PNG is 4032 x 10102 px (40 MP). As one page it glitched and then lagged in the user's PDF
viewer, so it is split into pages and each page is embedded as one high-quality JPEG (DCTDecode: light
to decode). BOARD_WIDTH is the native width of the board, so nothing is resampled; lower it only if a
viewer gets slow again.

usage: python -X utf8 build_pdf.py <out.pdf> [--raster]
       (needs Pillow, which lives in the user site, so do not use -I; --raster also needs
       pypdfium2 and turns the designed pages 8-11 into images)
"""
import io
import sys

import pypdf
from PIL import Image, ImageChops
from pypdf import PageObject, PdfReader, PdfWriter
from pypdf.generic import (DecodedStreamObject, DictionaryObject, NameObject, NumberObject,
                           StreamObject)

out = sys.argv[1]
RASTER = '--raster' in sys.argv[2:]  # designed pages as images (diagnostic variant)
DESIGN_DPI = 200

SRC = r'E:\YH\design\YasamHatti-proje-dosyasi-son.pdf'
DESIGN_PAGES = r'E:\YH\design\report\design-pages.pdf'
BOARD = r'E:\YH\design\board-tr-dark.png'  # Turkish dark only, as in the original report
PAGE_WIDTH = 742.0  # same width as the old design page
BOARD_WIDTH = 4032  # px = native width of the board PNG (about 390 dpi at the page width)
BOARD_QUALITY = 95  # JPEG quality of the board pages
SECTIONS_PER_PAGE = 2  # 8 sections -> 4 pages
MIN_GAP = 60  # px (full resolution): the blank band that separates two sections
PAD = 60  # px (full resolution) of board background added above and below each page


def section_gaps(board):
    """Centre rows (full resolution) of the blank bands between sections."""
    w, h = board.size
    bg = board.getpixel((5, 5))
    diff = ImageChops.difference(board, Image.new('RGB', board.size, bg)).convert('L')
    column = diff.point(lambda v: 255 if v > 12 else 0).resize((1, h), Image.BOX)
    blank = [v == 0 for v in column.getdata()]
    gaps = []
    y = 0
    while y < h:
        if blank[y]:
            start = y
            while y < h and blank[y]:
                y += 1
            # skip the margins at the very top and bottom of the board
            if y - start >= MIN_GAP and start > 500 and y < h - 500:
                gaps.append((start + y) // 2)
        else:
            y += 1
    return gaps


def jpeg_object(writer, width, height, data):
    image = StreamObject()
    image._data = data
    image.update({
        NameObject('/Type'): NameObject('/XObject'),
        NameObject('/Subtype'): NameObject('/Image'),
        NameObject('/Width'): NumberObject(width),
        NameObject('/Height'): NumberObject(height),
        NameObject('/ColorSpace'): NameObject('/DeviceRGB'),
        NameObject('/BitsPerComponent'): NumberObject(8),
        NameObject('/Filter'): NameObject('/DCTDecode'),
    })
    return writer._add_object(image)


print('pypdf', pypdf.__version__)
src = PdfReader(SRC)
assert len(src.pages) == 8
design = PdfReader(DESIGN_PAGES)
assert len(design.pages) == 4
w = PdfWriter()

for i in range(7):
    w.add_page(src.pages[i])

if RASTER:
    # diagnostic variant: every designed page becomes one JPEG (no vector paths, fonts or clips)
    import pypdfium2 as pdfium
    pdf = pdfium.PdfDocument(DESIGN_PAGES)
    for i, p in enumerate(design.pages):
        pw, ph = float(p.mediabox.width), float(p.mediabox.height)
        img = pdf[i].render(scale=DESIGN_DPI / 72).to_pil().convert('RGB')
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=92, subsampling=0, optimize=True)
        page = PageObject.create_blank_page(width=pw, height=ph)
        page[NameObject('/Resources')] = DictionaryObject({
            NameObject('/XObject'): DictionaryObject({
                NameObject('/Im0'): jpeg_object(w, img.size[0], img.size[1], buf.getvalue())
            })
        })
        content = DecodedStreamObject()
        content.set_data(('q %s 0 0 %s 0 0 cm /Im0 Do Q' % (pw, ph)).encode('ascii'))
        page[NameObject('/Contents')] = w._add_object(content)
        w.add_page(page)
        print('raster design page', img.size)
else:
    for p in design.pages:
        w.add_page(p)

# ---- board: cut at section borders, one page per group of sections
board = Image.open(BOARD).convert('RGB')
bw, bh = board.size
gaps = section_gaps(board)
assert len(gaps) == 7, ('expected 8 sections, found gaps at', gaps)
cuts = [0] + [gaps[i] for i in range(SECTIONS_PER_PAGE - 1, len(gaps), SECTIONS_PER_PAGE)] + [bh]
print('cut rows (full resolution):', cuts)
bg = board.getpixel((5, 5))
factor = BOARD_WIDTH / bw

for top, bottom in zip(cuts, cuts[1:]):
    part = Image.new('RGB', (bw, bottom - top + 2 * PAD), bg)
    part.paste(board.crop((0, top, bw, bottom)), (0, PAD))
    if BOARD_WIDTH != bw:
        part = part.resize((BOARD_WIDTH, round(part.size[1] * factor)), Image.LANCZOS)
    page_h = round(PAGE_WIDTH * part.size[1] / BOARD_WIDTH, 2)
    buf = io.BytesIO()
    part.save(buf, format='JPEG', quality=BOARD_QUALITY, subsampling=0, optimize=True)

    page = PageObject.create_blank_page(width=PAGE_WIDTH, height=page_h)
    page[NameObject('/Resources')] = DictionaryObject({
        NameObject('/XObject'): DictionaryObject({
            NameObject('/Im0'): jpeg_object(w, part.size[0], part.size[1], buf.getvalue())
        })
    })
    content = DecodedStreamObject()
    content.set_data(('q %s 0 0 %s 0 0 cm /Im0 Do Q' % (PAGE_WIDTH, page_h)).encode('ascii'))
    page[NameObject('/Contents')] = w._add_object(content)
    w.add_page(page)
    print('board page', part.size, '%.0f x %.0f pt' % (PAGE_WIDTH, page_h))

if src.metadata:
    w.add_metadata({k: v for k, v in src.metadata.items() if isinstance(v, str)})

with open(out, 'wb') as fh:
    w.write(fh)

r = PdfReader(out)
assert len(r.pages) == 15, len(r.pages)
print('pages', len(r.pages))
for i, p in enumerate(r.pages):
    print(i + 1, round(float(p.mediabox.width), 1), round(float(p.mediabox.height), 1))
