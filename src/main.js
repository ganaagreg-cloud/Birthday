/* =============================================================================
 * MAIN — bootstraps the experience.
 *   1. Register GSAP + Lenis (smooth inertia scroll for any overflowing scene).
 *   2. Init cursor + audio.
 *   3. Show the opening gate (fullscreen + sound opt-in).
 *   4. Hand control to the scene manager, which plays scenes 1 → 5.
 * ========================================================================== */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import './styles/base.css';
import './styles/cursor.css';
import './styles/scenes.css';

import { reducedMotion } from './core/env.js';
import { initCursor } from './core/cursor.js';
import { initAudio } from './core/audio.js';
import { showPreloader } from './core/preloader.js';
import { showGate, mountAudioToggle } from './core/gate.js';
import { createSceneManager } from './core/sceneManager.js';

import envelopeScene from './scenes/envelope.js';
import letterScene from './scenes/letter.js';
import galleryScene from './scenes/gallery.js';
import finaleScene from './scenes/finale.js';
import cakeScene from './scenes/cake.js';

// The cake is a side-trip off the Letter scene: name it so it's reachable via
// goTo('cake'), and mark it a branch so it doesn't take a progress dot.
letterScene.sceneName = 'letter';
cakeScene.sceneName = 'cake';
cakeScene.isBranch = true;

gsap.registerPlugin(ScrollTrigger);

// --- Lenis smooth scroll (premium inertia for any scene that overflows) -----
if (!reducedMotion) {
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

// --- Core singletons --------------------------------------------------------
initCursor();
initAudio();
mountAudioToggle();

const root = document.getElementById('app');
const manager = createSceneManager(root, [
  envelopeScene,
  letterScene,
  galleryScene,
  finaleScene,
  cakeScene, // branch scene — entered from the Letter, not part of the linear flow
]);

// --- Go: preloader → gate → scene 1 ----------------------------------------
showPreloader()
  .then(showGate)
  .then(() => manager.start());
