/* =============================================================================
 * MAGNETIC — buttons drift toward the cursor on hover, then spring back.
 * Apply to any element with [data-magnetic]. No-op on touch / reduced motion.
 * ========================================================================== */

import gsap from 'gsap';
import { isTouch, reducedMotion } from './env.js';

const STRENGTH = 0.4; // how far it drifts (0–1 of distance to cursor)

export function bindMagnetic(root = document) {
  if (isTouch || reducedMotion) return;

  root.querySelectorAll('[data-magnetic]').forEach((el) => {
    if (el.dataset.magneticBound) return;
    el.dataset.magneticBound = '1';

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const relX = e.clientX - (r.left + r.width / 2);
      const relY = e.clientY - (r.top + r.height / 2);
      gsap.to(el, {
        x: relX * STRENGTH,
        y: relY * STRENGTH,
        duration: 0.6,
        ease: 'power3.out',
      });
    };

    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
  });
}
