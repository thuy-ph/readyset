import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const at = (...p) => join(root, ...p);
mkdirSync(at('dist'), { recursive: true });
let html = readFileSync(at('src','index.html'),'utf8');
const fonts = readFileSync(at('assets','fonts-inline.css'),'utf8');
const gsap  = readFileSync(at('vendor','gsap.min.js'),'utf8') + '\n' + readFileSync(at('vendor','ScrollTrigger.min.js'),'utf8');
for (const t of ['/*__FONTS__*/','/*__GSAP__*/']) if (!html.includes(t)) throw new Error('missing '+t);
// Replacer FUNCTIONS: a string replacement expands $& inside the payload, and GSAP contains those.
html = html.replace('/*__FONTS__*/', () => fonts).replace('/*__GSAP__*/', () => gsap);

// Images are matched by filename prefix: 01-*.jpg fills __IMG_01__, and so on.
// An image with no matching token is skipped (not yet placed in the page).
const imgs = readdirSync(at('assets','img')).filter(f => /^\d\d-.*\.jpg$/.test(f)).sort();
let used = 0;
for (const f of imgs) {
  const token = `__IMG_${f.slice(0,2)}__`;
  if (!html.includes(token)) { console.log(`  skip ${f} — no ${token} in page`); continue; }
  html = html.replace(token, () => 'data:image/jpeg;base64,' + readFileSync(at('assets','img',f)).toString('base64'));
  used++;
}
// dist is generated — drop authoring comments (they also carry token names,
// which would otherwise trip the unfilled-token guard below)
html = html.replace(/<!--[\s\S]*?-->/g, '');
const left = html.match(/__IMG_\d+__/g);
if (left) throw new Error('token with no image file: ' + [...new Set(left)].join(', '));
writeFileSync(at('dist','index.html'), html);
console.log(`built: ${(Buffer.byteLength(html)/1024/1024).toFixed(2)}MB · ${used}/${imgs.length} images inlined`);

// ── reel page ────────────────────────────────────────────────────────────
// Separate from the landing page; lives at /reel/ and shows a placeholder
// until reel.mp4 is dropped alongside it.
let reel = readFileSync(at('src', 'reel.html'), 'utf8');
if (!reel.includes('/*__FONTS__*/')) throw new Error('reel: missing /*__FONTS__*/');
reel = reel.replace('/*__FONTS__*/', () => fonts).replace(/<!--[\s\S]*?-->/g, '');
mkdirSync(join(root, '..', 'reel'), { recursive: true });
writeFileSync(join(root, '..', 'reel', 'index.html'), reel);
console.log(`reel/index.html — ${(Buffer.byteLength(reel) / 1024).toFixed(0)}KB`);
