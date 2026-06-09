/* =============================================================================
 * PRELOADER — a brief, branded loading beat so the first sight is intentional
 * (no font-swap flash, no asset pop-in). Waits for fonts to be ready + a small
 * minimum on-screen time, then cross-dissolves away. Resolves a promise the
 * boot sequence awaits before showing the gate.
 * ========================================================================== */

import gsap from 'gsap';
import { reducedMotion } from './env.js';

export function showPreloader() {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'preloader';
    el.innerHTML = `
      <div class="preloader__mark" aria-hidden="true">💌</div>
      <div class="preloader__bar"><span class="preloader__fill" data-fill></span></div>
    `;
    document.body.appendChild(el);
    const fill = el.querySelector('[data-fill]');

    const startedAt = performance.now();
    const MIN_MS = reducedMotion ? 150 : 850; // read as intentional, not a flash

    if (!reducedMotion) {
      gsap.fromTo(
        el.querySelector('.preloader__mark'),
        { scale: 0.8, autoAlpha: 0, y: 8 },
        { scale: 1, autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }
      );
      gsap.to(fill, { scaleX: 0.9, duration: 1.1, ease: 'power2.out' });
    } else {
      gsap.set(fill, { scaleX: 0.9 });
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      const remaining = Math.max(0, MIN_MS - (performance.now() - startedAt));
      setTimeout(() => {
        gsap.to(fill, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
        gsap.to(el, {
          autoAlpha: 0,
          duration: reducedMotion ? 0.001 : 0.6,
          delay: 0.2,
          ease: 'expo.inOut',
          onComplete: () => {
            el.remove();
            resolve();
          },
        });
      }, remaining);
    };

    // Wait for webfonts so the gate title doesn't swap fonts after paint.
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    Promise.resolve(fontsReady).then(finish);
    // Hard safety: never hang the boot if fonts.ready never settles.
    setTimeout(finish, 4000);
  });
}
