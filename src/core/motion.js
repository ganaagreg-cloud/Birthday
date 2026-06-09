/* =============================================================================
 * MOTION — shared easing/spring tokens + haptics so every interaction across
 * the site feels weighty and consistent. Import these instead of hand-typing
 * eases in each scene.
 * ========================================================================== */

import { reducedMotion } from './env.js';

/* GSAP ease strings, named by feel. */
export const EASE = {
  out: 'expo.out', //        decisive arrivals
  inOut: 'expo.inOut', //    cinematic cross-transitions
  soft: 'power3.out', //     gentle settle (pointer follows, drift)
  spring: 'elastic.out(1, 0.55)', // bouncy release (press, magnetic snap-back)
  back: 'back.out(1.7)', //  slight overshoot on reveals
};

/* A reusable spring tween config (spread into gsap.to). */
export const SPRING = { duration: 0.7, ease: EASE.spring };

/* Fire a short haptic on supporting devices (no-op on desktop / unsupported). */
export function haptic(pattern = 8) {
  if (reducedMotion) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* not available — ignore */
  }
}
