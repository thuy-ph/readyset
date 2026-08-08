import { readFileSync, writeFileSync } from 'node:fs';
const css = readFileSync('fonts.css', 'utf8');
// Google CSS emits: /* subset */\n@font-face{...}
const blocks = css.split('/*').slice(1).map(b => '/*' + b);
const latin = blocks.filter(b => b.trimStart().startsWith('/* latin */') || /^\/\*\s*latin\s*\*\//.test(b.trim()));
let out = '';
for (const b of latin) {
  const url = b.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
  if (!url) continue;
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const family = b.match(/font-family:\s*'([^']+)'/)?.[1];
  const weight = b.match(/font-weight:\s*(\d+)/)?.[1] || '400';
  out += `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;`
       + `src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2');}\n`;
  console.log(`${family} ${weight}  ${(buf.length/1024).toFixed(1)}KB`);
}
writeFileSync('fonts-inline.css', out);
console.log('TOTAL', (Buffer.byteLength(out)/1024).toFixed(0) + 'KB');
