/* =============================================================================
 * TEXT REVEAL — split text into lines/words wrapped in overflow-hidden masks,
 * then animate each up from below with a stagger. Honors reduced motion.
 * ========================================================================== */

import gsap from 'gsap';
import { reducedMotion } from './env.js';

/**
 * Wrap each provided string in a masked line element and append to `container`.
 * @returns {HTMLElement[]} the inner .reveal-line nodes (for animating).
 */
export function buildMaskedLines(container, lines) {
  const inners = [];
  lines.forEach((text) => {
    const mask = document.createElement('span');
    mask.className = 'reveal-mask';
    const inner = document.createElement('span');
    inner.className = 'reveal-line';
    inner.textContent = text;
    mask.appendChild(inner);
    container.appendChild(mask);
    inners.push(inner);
  });
  return inners;
}

/** Animate masked lines rising into view. Returns the gsap timeline. */
export function revealLines(inners, { delay = 0, stagger = 0.12, duration = 1 } = {}) {
  if (reducedMotion) {
    gsap.set(inners, { y: 0, opacity: 1 });
    return gsap.timeline();
  }
  gsap.set(inners, { yPercent: 120, opacity: 0 });
  return gsap.to(inners, {
    yPercent: 0,
    opacity: 1,
    duration,
    delay,
    stagger,
    ease: 'expo.out',
  });
}
