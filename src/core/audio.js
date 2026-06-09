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
}

// Called from the sound gate (a real user gesture) to unlock audio + start music.
export function startMusic() {
  if (started) return;
  started = true;
  if (!music) return;
  try {
    music.play();
    music.fade(0, CONFIG.audio.musicVolume, 1600);
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
