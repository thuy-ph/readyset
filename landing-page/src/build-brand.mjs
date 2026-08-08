import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const at = (...p) => join(root, ...p);
mkdirSync(at('dist'), { recursive: true });
let html = readFileSync(at('src','brand.html'),'utf8');
const fonts = readFileSync(at('assets','fonts-inline.css'),'utf8');
if (!html.includes('/*__FONTS__*/')) throw new Error('missing /*__FONTS__*/');
// Replacer FUNCTION, not a string — see build.mjs trap #1.
html = html.replace('/*__FONTS__*/', () => fonts);

const imgs = readdirSync(at('assets','img')).filter(f => /^\d\d-.*\.jpg$/.test(f)).sort();
let used = 0;
for (const f of imgs) {
  const token = `__IMG_${f.slice(0,2)}__`;
  if (!html.includes(token)) { console.log(`  skip ${f} — no ${token} in page`); continue; }
  html = html.replace(token, () => 'data:image/jpeg;base64,' + readFileSync(at('assets','img',f)).toString('base64'));
  used++;
}
html = html.replace(/<!--[\s\S]*?-->/g, '');
const left = html.match(/__IMG_\d+__/g);
if (left) throw new Error('token with no image file: ' + [...new Set(left)].join(', '));
writeFileSync(at('dist','brand.html'), html);
console.log(`built: ${(Buffer.byteLength(html)/1024/1024).toFixed(2)}MB · ${used}/${imgs.length} images inlined`);
