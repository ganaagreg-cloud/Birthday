/* =============================================================================
 * gen-photos.mjs — writes 5 warm-toned placeholder SVG "photos" into
 * /public/images. Swap these for your real photos (keep the filenames, or
 * change them in src/config.js). Run: node scripts/gen-photos.mjs
 * ========================================================================== */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/images');
mkdirSync(OUT, { recursive: true });

const palettes = [
  ['#9c6b74', '#78555e'],
  ['#c79aa1', '#9c6b74'],
  ['#d9b27c', '#9c6b74'],
  ['#78555e', '#3d2730'],
  ['#c79aa1', '#d9b27c'],
  ['#d9b27c', '#78555e'],
];

const svg = (a, b, n) => `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/>
      <stop offset="1" stop-color="${b}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="800" fill="url(#g)"/>
  <circle cx="300" cy="320" r="120" fill="rgba(255,255,255,0.12)"/>
  <path d="M300 250c-18-34-78-30-78 14 0 40 78 86 78 86s78-46 78-86c0-44-60-48-78-14z" fill="rgba(255,255,255,0.5)"/>
  <text x="300" y="640" font-family="Georgia, serif" font-size="44" fill="rgba(255,255,255,0.85)" text-anchor="middle">Зураг ${n}</text>
  <text x="300" y="690" font-family="Georgia, serif" font-size="22" fill="rgba(255,255,255,0.6)" text-anchor="middle">Энд өөрийн зургаа тавина уу</text>
</svg>`;

palettes.forEach(([a, b], i) => {
  const name = `photo-${i + 1}.svg`;
  writeFileSync(resolve(OUT, name), svg(a, b, i + 1));
  console.log('wrote', name);
});
console.log('Done. Placeholder photos in public/images/');
