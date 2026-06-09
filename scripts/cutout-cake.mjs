/* =============================================================================
 * cutout-cake.mjs — turns a cake photo with a (two-tone) solid backdrop into a
 * transparent-background PNG, so it composites cleanly over the pink scene.
 *
 * Method: region-growing flood fill from the image borders. A neighbour joins
 * the background when it's within LOCAL colour tolerance of an already-background
 * pixel, so it follows smooth backdrop gradients (light pink ↔ darker floor ↔
 * horizon) but stops at the saturated cake and the white stand. Then the
 * background mask is dilated 1px (kills the pink fringe) and edges are feathered.
 *
 * Run:  node scripts/cutout-cake.mjs [inputPath]
 *       (defaults to 1.png → public/images/cake.png)
 * ========================================================================== */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = resolve(__dirname, '..', process.argv[2] || '1.png');
const OUTPUT = resolve(__dirname, '../public/images/cake.png');

const TOL = Number(process.argv[3]) || 30; // local colour tolerance for "bg"
const SEED_FROM_BORDER = true;

const png = PNG.sync.read(readFileSync(INPUT));
const { width: W, height: H, data } = png; // data = RGBA, length W*H*4

const idx = (x, y) => (y * W + x) * 4;
const isBg = new Uint8Array(W * H); // 1 = background
const visited = new Uint8Array(W * H);

function dist(i, j) {
  const dr = data[i] - data[j];
  const dg = data[i + 1] - data[j + 1];
  const db = data[i + 2] - data[j + 2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Seed the stack with every border pixel (the backdrop touches all edges).
const stack = [];
function seed(x, y) {
  const p = y * W + x;
  if (!visited[p]) {
    visited[p] = 1;
    isBg[p] = 1;
    stack.push(p);
  }
}
if (SEED_FROM_BORDER) {
  for (let x = 0; x < W; x++) {
    seed(x, 0);
    seed(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    seed(0, y);
    seed(W - 1, y);
  }
}

// Region grow (4-connected).
const NB = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
while (stack.length) {
  const p = stack.pop();
  const px = p % W;
  const py = (p / W) | 0;
  const pi = p * 4;
  for (const [dx, dy] of NB) {
    const nx = px + dx;
    const ny = py + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
    const np = ny * W + nx;
    if (visited[np]) continue;
    visited[np] = 1;
    if (dist(pi, np * 4) < TOL) {
      isBg[np] = 1;
      stack.push(np);
    }
  }
}

// Dilate the background mask by 1px to remove the anti-aliased pink fringe.
const dil = isBg.slice();
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (isBg[y * W + x]) continue;
    for (const [dx, dy] of NB) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      if (isBg[ny * W + nx]) {
        dil[y * W + x] = 1;
        break;
      }
    }
  }
}

// Write alpha: background → 0. Feather kept-edge pixels for a soft cutline.
let cleared = 0;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const p = y * W + x;
    const a = idx(x, y) + 3;
    if (dil[p]) {
      data[a] = 0;
      cleared++;
    } else {
      // count background neighbours → partial alpha at the silhouette edge
      let bg = 0;
      for (const [dx, dy] of NB) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        if (dil[ny * W + nx]) bg++;
      }
      if (bg > 0) data[a] = Math.round(255 * (1 - bg / 5));
    }
  }
}

writeFileSync(OUTPUT, PNG.sync.write(png));
const pct = ((cleared / (W * H)) * 100).toFixed(1);
console.log(`cutout → ${OUTPUT}`);
console.log(`${W}x${H}, removed ${pct}% as background (tol ${TOL})`);
