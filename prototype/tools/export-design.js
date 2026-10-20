/* Exports the design board. Run: node tools/export-design.js [outputDir] [--pdf-only]
   For each language x theme it writes
     <out>/board-<lang>-<theme>.pdf      every frame on one vector page (sharp at any zoom; sends uncompressed in chat apps)
     <out>/board-<lang>-<theme>.png      every frame on one canvas (1x)
     <out>/<lang>-<theme>/NN-<id>.png    one image per screen state (2x, full content height)
   It drives headless Edge/Chrome over board.html and crops frames out of per-section screenshots.
   No dependencies: the PNG read/crop/write below only needs Node's zlib. */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { pathToFileURL } = require('url');
const { spawnSync } = require('child_process');

const proto = path.join(__dirname, '..');
const args = process.argv.slice(2);
const pdfOnly = args.includes('--pdf-only');
const outDir = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(proto, '..', 'design'));
const SETS = [['tr', 'light'], ['tr', 'dark'], ['ar', 'light'], ['ar', 'dark']];
const FRAME_SCALE = 2;
const TIME_BUDGET_MS = 12000;

const BROWSERS = [
  process.env.BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
].filter(Boolean);
const browser = BROWSERS.find((p) => fs.existsSync(p));
if (!browser) {
  console.error('No Edge/Chrome found. Set the BROWSER environment variable to its executable.');
  process.exit(1);
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'yasamhatti-export-'));
const profile = path.join(work, 'profile');

function boardUrl(lang, theme, section) {
  return pathToFileURL(path.join(proto, 'board.html')).href + '?export=1&lang=' + lang + '&theme=' + theme + (section === null ? '' : '&section=' + section);
}

function runBrowser(args) {
  const result = spawnSync(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--user-data-dir=' + profile, '--virtual-time-budget=' + TIME_BUDGET_MS].concat(args),
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, windowsHide: true });
  if (result.error) throw result.error;
  return result.stdout || '';
}

// Frame rectangles published by board.js once every frame has reported its content height.
function readRects(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const dom = runBrowser(['--window-size=1400,1000', '--dump-dom', url]);
    const match = /<pre id="board-rects">([\s\S]*?)<\/pre>/.exec(dom);
    if (match) {
      const json = match[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      const rects = JSON.parse(json);
      if (rects.sized === rects.frames.length) return rects;
    }
  }
  throw new Error('Board did not finish laying out: ' + url);
}

function screenshot(url, width, height, scale, file) {
  runBrowser(['--force-device-scale-factor=' + scale, '--window-size=' + width + ',' + height, '--screenshot=' + file, url]);
  if (!fs.existsSync(file)) throw new Error('Screenshot was not written: ' + file);
}

// ---------- Minimal PNG (8-bit RGB/RGBA, non-interlaced: what Chromium writes) ----------
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function readPng(file) {
  const buf = fs.readFileSync(file);
  let pos = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2) || interlace) throw new Error('Unsupported PNG format in ' + file);
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[dst + x - bpp] : 0;
      const b = y > 0 ? px[dst - stride + x] : 0;
      let v = raw[src + x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const c = x >= bpp && y > 0 ? px[dst - stride + x - bpp] : 0;
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : (pb <= pc ? b : c);
      }
      px[dst + x] = v & 255;
    }
  }
  return { width, height, bpp, px };
}

function crop(img, x, y, w, h) {
  x = Math.max(0, Math.min(x, img.width - 1));
  y = Math.max(0, Math.min(y, img.height - 1));
  w = Math.min(w, img.width - x);
  h = Math.min(h, img.height - y);
  const px = Buffer.alloc(w * h * img.bpp);
  for (let row = 0; row < h; row++) {
    const start = ((y + row) * img.width + x) * img.bpp;
    img.px.copy(px, row * w * img.bpp, start, start + w * img.bpp);
  }
  return { width: w, height: h, bpp: img.bpp, px };
}

function writePng(file, img) {
  const stride = img.width * img.bpp;
  const raw = Buffer.alloc((stride + 1) * img.height);
  for (let y = 0; y < img.height; y++) img.px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc32(body), body.length + 4);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.width, 0); ihdr.writeUInt32BE(img.height, 4);
  ihdr[8] = 8; ihdr[9] = img.bpp === 4 ? 6 : 2;
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))
  ]));
}

// ---------- Export ----------
fs.mkdirSync(outDir, { recursive: true });
let written = 0;
try {
  for (const [lang, theme] of SETS) {
    const set = lang + '-' + theme;
    const setDir = path.join(outDir, set);
    fs.mkdirSync(setDir, { recursive: true });

    const pdf = path.join(outDir, 'board-' + set + '.pdf');
    if (fs.existsSync(pdf)) fs.unlinkSync(pdf);
    runBrowser(['--no-pdf-header-footer', '--print-to-pdf=' + pdf, boardUrl(lang, theme, null)]);
    if (!fs.existsSync(pdf)) throw new Error('PDF was not written: ' + pdf);
    written += 1;
    console.log(set + ': board PDF ' + Math.round(fs.statSync(pdf).size / 1024) + ' KB');
    if (pdfOnly) continue;

    const all = readRects(boardUrl(lang, theme, null));
    screenshot(boardUrl(lang, theme, null), all.width, all.height, 1, path.join(outDir, 'board-' + set + '.png'));
    written += 1;
    console.log(`${set}: board ${all.width}x${all.height}, ${all.frames.length} frames`);

    for (let section = 0; section < all.sections; section++) {
      const url = boardUrl(lang, theme, section);
      const rects = readRects(url);
      const tmp = path.join(work, set + '-section-' + section + '.png');
      screenshot(url, rects.width, rects.height, FRAME_SCALE, tmp);
      const img = readPng(tmp);
      const k = img.width / rects.width; // actual device scale of the screenshot
      for (const frame of rects.frames) {
        const name = String(frame.index).padStart(2, '0') + '-' + frame.id + '.png';
        writePng(path.join(setDir, name), crop(img, Math.round(frame.x * k), Math.round(frame.y * k), Math.round(frame.w * k), Math.round(frame.h * k)));
        written += 1;
      }
      fs.unlinkSync(tmp);
      console.log(`  section ${section + 1}/${all.sections}: ${rects.frames.length} frames (${img.width}x${img.height}, scale ${k})`);
    }
  }
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
console.log(`Done: ${written} files in ${outDir}`);
