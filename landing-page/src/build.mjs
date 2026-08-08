// Builds landing-page/dist/index.html — a single self-contained file.
//
// The published page runs under a strict CSP with no external requests, so
// fonts, GSAP and imagery are all base64-inlined rather than linked.
//
//   node src/build.mjs        (run from landing-page/)

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const at = (...p) => join(root, ...p);

let html = readFileSync(at('src', 'index.html'), 'utf8');

const fonts = readFileSync(at('assets', 'fonts-inline.css'), 'utf8');
const gsap = readFileSync(at('vendor', 'gsap.min.js'), 'utf8') + '\n'
           + readFileSync(at('vendor', 'ScrollTrigger.min.js'), 'utf8');

for (const token of ['/*__FONTS__*/', '/*__GSAP__*/']) {
  if (!html.includes(token)) throw new Error(`missing token ${token}`);
}

// Replacer FUNCTIONS are required: a plain string replacement expands `$&`
// and `$\`` inside the payload, and GSAP's minified source contains both.
html = html.replace('/*__FONTS__*/', () => fonts)
           .replace('/*__GSAP__*/', () => gsap);

const imgs = readdirSync(at('assets', 'img')).filter(f => f.endsWith('.jpg')).sort();
imgs.forEach((f, i) => {
  const token = `__IMG_0${i + 1}__`;
  if (!html.includes(token)) throw new Error(`missing token ${token}`);
  const uri = 'data:image/jpeg;base64,'
    + readFileSync(at('assets', 'img', f)).toString('base64');
  html = html.replace(token, () => uri);
});

if (/__IMG_\d+__|__FONTS__|__GSAP__/.test(html)) throw new Error('unfilled token remains');

mkdirSync(at('dist'), { recursive: true });
writeFileSync(at('dist', 'index.html'), html);
console.log(`dist/index.html — ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)}MB, ${imgs.length} images inlined`);
