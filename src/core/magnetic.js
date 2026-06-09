/* =============================================================================
 * MAGNETIC — tactile buttons. Every device gets press feedback + haptics; fine
 * pointers (desktop) additionally get the cursor-drift "pull". Apply to any
 * element with [data-magnetic]. Idempotent — safe to call on each scene mount.
 * ========================================================================== */

import gsap from 'gsap';
import { isTouch, reducedMotion } from './env.js';
import { haptic, EASE } from './motion.js';

const STRENGTH = 0.4; // how far it drifts (0–1 of distance to cursor)

export function bindMagnetic(root = document) {
  root.querySelectorAll('[data-magnetic]').forEach((el) => {
    if (el.dataset.magneticBound) return;
    el.dataset.magneticBound = '1';

    // --- Press feedback on EVERY device (tiny under reduced motion) ---------
    const press = () => {
      haptic(8);
      gsap.to(el, { scale: reducedMotion ? 0.99 : 0.95, duration: 0.18, ease: 'power2.out' });
    };
    const release = () => {
      gsap.to(el, { scale: 1, duration: reducedMotion ? 0.2 : 0.6, ease: EASE.spring });
    };
    el.addEventListener('pointerdown', press);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);

    // --- Cursor-drift pull: fine pointers only, no reduced motion -----------
    if (isTouch || reducedMotion) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const relX = e.clientX - (r.left + r.width / 2);
      const relY = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: relX * STRENGTH, y: relY * STRENGTH, duration: 0.6, ease: EASE.soft });
    };
    const onLeave = () => gsap.to(el, { x: 0, y: 0, scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
  });
}
