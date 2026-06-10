/* =============================================================================
 * AUDIO — Howler-backed sound manager.
 *   • Background music (looped, fades in) — only after the user opts in via the
 *     sound gate (browsers block autoplay).
 *   • UI one-shots: dial click, unlock, page turn.
 * Gracefully no-ops if a file is missing so the experience never breaks.
 * ========================================================================== */

import { Howl, Howler } from 'howler';
import { CONFIG } from '../config.js';

let music = null;
let sfx = {};
let muted = false;
let started = false;
let musicBase = 0; // target music volume once started (for ducking math)
let duckTimer = null;

// Build a Howl, swallowing load errors (placeholder files may be silent/empty).
// `src` may be a string OR an array of fallbacks, e.g.
//   ['/audio/x.mp3', '/audio/x.wav'] — Howler plays the first the browser supports.
function makeHowl(src, { loop = false, volume = 1 } = {}) {
  try {
    return new Howl({
      src: Array.isArray(src) ? src : [src],
      loop,
      volume,
      html5: loop, // stream long music via HTML5 audio
      onloaderror: () => console.warn(`[audio] could not load ${src}`),
    });
  } catch (e) {
    console.warn('[audio] init failed', e);
    return null;
  }
}

export function initAudio() {
  music = makeHowl(CONFIG.audio.music, { loop: true, volume: 0 });
  sfx = {
    dialClick: makeHowl(CONFIG.audio.dialClick, { volume: 0.5 }),
    unlock: makeHowl(CONFIG.audio.unlock, { volume: 0.7 }),
    pageTurn: makeHowl(CONFIG.audio.pageTurn, { volume: 0.6 }),
  };
  // Friendly aliases so scenes can speak in intent, not filenames. Point them
  // at distinct real files later; for now they reuse the closest placeholder.
  sfx.tick = sfx.dialClick; //  small UI/press tick
  sfx.flip = sfx.pageTurn; //   polaroid / card flip
  sfx.chime = sfx.unlock; //    celebratory accent (candle, finale)
}

// Briefly duck the music so a one-shot reads clearly over it, then restore.
function duckMusic(depth = 0.55, downMs = 130, upMs = 420) {
  if (!music || !started || muted || musicBase <= 0) return;
  try {
    music.fade(music.volume(), musicBase * depth, downMs);
    clearTimeout(duckTimer);
    duckTimer = setTimeout(() => {
      if (music && started && !muted) music.fade(music.volume(), musicBase, upMs);
    }, downMs + 200);
  } catch {
    /* ignore */
  }
}

// Called from the sound gate (a real user gesture) to unlock audio + start music.
export function startMusic() {
  if (started) return;
  started = true;
  if (!music) return;
  try {
    musicBase = CONFIG.audio.musicVolume;
    music.play();
    music.fade(0, musicBase, 1600);
  } catch (e) {
    console.warn('[audio] music play failed', e);
  }
}

export function play(name) {
  if (muted) return;
  const s = sfx[name];
  if (s) {
    try {
      s.play();
      duckMusic();
    } catch {
      /* ignore */
    }
  }
}

export function toggleMute() {
  muted = !muted;
  Howler.mute(muted);
  return muted;
}

export function isMuted() {
  return muted;
}

export function isStarted() {
  return started;
}
