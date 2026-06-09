/* =============================================================================
 * SCENE 2 · ЗАХИДАЛ (The Letter)
 * Masked, line-by-line reveal of the Mongolian message. Greeting + body lines
 * rise from behind overflow-hidden masks with an expo stagger. "Алгасах" jumps
 * to the end of the reveal; "Дараах" advances.
 * ========================================================================== */

import gsap from 'gsap';
import { CONFIG, fill } from '../config.js';
import { reducedMotion } from '../core/env.js';
import { buildMaskedLines, revealLines } from '../core/textReveal.js';

export default function letterScene(ctx) {
  const el = document.createElement('section');
  el.className = 'scene letter-scene';
  el.innerHTML = `
    <div class="scene__inner">
      <article class="letter-paper" data-paper title="Бүхэлд нь харах">
        <div class="letter-greeting" data-greeting></div>
        <div class="letter-body" data-body></div>
        <div class="letter-signoff" data-signoff></div>
      </article>
      <div class="btn-row">
        <button class="btn" data-magnetic data-next>Үргэлжлүүлэх</button>
      </div>
      <button class="btn-soft" data-magnetic data-cake>🎂 Төрсөн өдрийн бялуугаа нээх</button>
    </div>
  `;

  const greetingEl = el.querySelector('[data-greeting]');
  const bodyEl = el.querySelector('[data-body]');
  const signoffEl = el.querySelector('[data-signoff]');
  let particles;
  let tl;

  // Build masked lines: greeting + each body line + signoff
  const greetInners = buildMaskedLines(greetingEl, [fill(CONFIG.letter.greetingTemplate)]);
  const bodyInners = buildMaskedLines(bodyEl, CONFIG.letter.lines);
  const signInners = buildMaskedLines(signoffEl, [fill(CONFIG.letter.signoffTemplate)]);
  const allInners = [...greetInners, ...bodyInners, ...signInners];

  // Quiet skip: clicking the letter itself fast-forwards the reveal (no button).
  el.querySelector('[data-paper]').addEventListener('click', () => {
    if (tl && tl.progress() < 1) tl.progress(1);
  });
  el.querySelector('[data-next]').addEventListener('click', () => {
    ctx.sfx('pageTurn');
    ctx.next();
  });
  // Side-trip into the orbiting photo-cake scene (same cinematic transition).
  el.querySelector('[data-cake]').addEventListener('click', () => {
    ctx.sfx('pageTurn');
    ctx.goTo('cake');
  });

  return {
    el,
    enter() {
      particles = ctx.particles(el);
      tl = gsap.timeline();
      tl.add(revealLines(greetInners, { duration: 1.1, stagger: 0.1 }));
      tl.add(revealLines(bodyInners, { duration: 1, stagger: 0.14 }), reducedMotion ? 0 : '-=0.6');
      tl.add(revealLines(signInners, { duration: 1, stagger: 0.1 }), reducedMotion ? 0 : '-=0.2');
    },
    leave() {
      if (reducedMotion) return;
      return gsap.to(allInners, {
        yPercent: -40,
        autoAlpha: 0,
        duration: 0.5,
        ease: 'power3.in',
        stagger: 0.02,
      });
    },
    destroy() {
      particles?.destroy();
      tl?.kill();
    },
  };
}
