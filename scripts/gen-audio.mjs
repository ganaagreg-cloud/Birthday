/* =============================================================================
 * gen-audio.mjs — generates small placeholder WAV files into /public/audio.
 * These are stand-ins so the experience has sound out of the box. Replace them
 * with your own files (see README) and update src/config.js if you change names.
 *
 * Run:  node scripts/gen-audio.mjs
 * ========================================================================== */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/audio');
mkdirSync(OUT, { recursive: true });

const RATE = 22050;

// Encode a mono Float32 [-1,1] buffer to a 16-bit PCM WAV.
function toWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE((s * 32767) | 0, i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const env = (i, n, a = 0.01, d = 0.2) => {
  const t = i / n;
  const atk = Math.min(1, t / a);
  const rel = Math.min(1, (1 - t) / d);
  return Math.min(atk, rel);
};

// Dial tick — very short click
function dialClick() {
  const n = (RATE * 0.05) | 0;
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++)
    s[i] = Math.sin((2 * Math.PI * 1400 * i) / RATE) * env(i, n, 0.002, 0.6) * 0.5;
  return s;
}

// Page turn — short filtered noise swish
function pageTurn() {
  const n = (RATE * 0.22) | 0;
  const s = new Float32Array(n);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1;
    last = last * 0.92 + white * 0.08; // low-pass
    s[i] = last * env(i, n, 0.05, 0.5) * 0.6;
  }
  return s;
}

// Unlock — pleasant rising two-note chime
function unlock() {
  const n = (RATE * 0.5) | 0;
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const f = t < 0.18 ? 660 : 990; // up a fifth
    s[i] = Math.sin(2 * Math.PI * f * t) * env(i, n, 0.01, 0.4) * 0.4;
  }
  return s;
}

// Background music — gentle 8s ambient chord loop (warm, soft)
function bgMusic() {
  const dur = 8;
  const n = (RATE * dur) | 0;
  const s = new Float32Array(n);
  const chord = [220, 277.18, 329.63]; // A, C#, E — warm major
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    let v = 0;
    for (const f of chord) v += Math.sin(2 * Math.PI * f * t);
    v /= chord.length;
    // slow breathing amplitude + soft fade at loop seam
    const breathe = 0.6 + 0.4 * Math.sin(2 * Math.PI * (t / dur));
    const seam = Math.min(1, t / 0.4, (dur - t) / 0.4);
    s[i] = v * breathe * seam * 0.18;
  }
  return s;
}

const files = {
  'dial-click.wav': dialClick(),
  'page-turn.wav': pageTurn(),
  'unlock.wav': unlock(),
  'bg-music.wav': bgMusic(),
};

for (const [name, samples] of Object.entries(files)) {
  writeFileSync(resolve(OUT, name), toWav(samples));
  console.log('wrote', name, `(${(samples.length / RATE).toFixed(2)}s)`);
}
console.log('Done. Placeholder audio in public/audio/');
