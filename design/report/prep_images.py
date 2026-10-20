"""Prepares the screen images used by design-pages.html at about 2.5x their printed size.

The frame PNGs are 768 px wide but are printed 108-280 px wide, and some are 2000+ px tall while only
the top part is shown. Embedding them as they are made the PDF slow in some viewers, so each one is
cropped to the visible part and resampled here (lossless PNG, Pillow LANCZOS).

usage: python -X utf8 prep_images.py      (needs Pillow, so no -I)
"""
import os

from PIL import Image

SRC = r'E:\YH\design\tr-dark'
OUT = r'E:\YH\design\report\img'

# name: (printed width in css px, visible height in css px or None for the whole frame)
JOBS = {
    '07-home': (108, 206),
    '10-select-disaster': (108, 206),
    '11-status-sent': (108, 206),
    '12-status-queued': (108, 206),
    '18-countdown-fall': (280, None),
    '39-watch-countdown-fall': (160, None),
    '30-vol-join': (208, None),
    '31-vol-hub': (208, None),
    '32-vol-need': (208, None),
    '33-vol-task': (208, None),
    '34-vol-done-dialog': (208, None),
    '35-vol-offline': (208, 460),
}
OVERSAMPLE = 2.5

os.makedirs(OUT, exist_ok=True)
total = 0
for name, (shown_w, shown_h) in JOBS.items():
    im = Image.open(os.path.join(SRC, name + '.png')).convert('RGB')
    w, h = im.size
    target_w = round(shown_w * OVERSAMPLE)
    scale = target_w / w
    if shown_h is not None:
        crop_h = min(h, round(shown_h * OVERSAMPLE / scale))
        im = im.crop((0, 0, w, crop_h))
    im = im.resize((target_w, round(im.size[1] * scale)), Image.LANCZOS)
    path = os.path.join(OUT, name + '.png')
    im.save(path, optimize=True)
    total += im.size[0] * im.size[1]
    print('%-26s %4d x %4d  %6d bytes' % (name, im.size[0], im.size[1], os.path.getsize(path)))
print('total pixels', total)
