/* =============================================================================
 * SCENE 1 · ДУГТУЙ (Envelope)
 * Sealed envelope with a wax seal. Click the seal → flap folds open in 3D,
 * the letter slides up out of the pocket, then "Нээх" advances.
 * ========================================================================== */

import gsap from 'gsap';
import { reducedMotion } from '../core/env.js';

export default function envelopeScene(ctx) {
  const el = document.createElement('section');
  el.className = 'scene envelope-scene';
  el.innerHTML = `
    <div class="scene-glow" data-depth="-22" aria-hidden="true"></div>
    <div class="scene__inner">
      <p class="eyebrow">Чамд нэгэн захидал ирлээ</p>
      <div class="envelope-stage" data-depth="14" style="margin: 2rem 0;">
        <div class="envelope" data-envelope>
          <div class="envelope__back"></div>
          <div class="envelope__letter" data-letter>
            <span class="envelope__letter-mark">Чамд хайртай…</span>
          </div>
          <div class="envelope__front"></div>
          <div class="envelope__pocket"></div>
          <div class="envelope__flap" data-flap></div>
          <button class="wax-seal" data-seal aria-label="Лацыг дарж нээх">
            <span class="wax-seal__mark">&amp;</span>
          </button>
          <span class="seal-puff" data-puff aria-hidden="true"></span>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn" data-magnetic data-open hidden>Нээх</button>
      </div>
      <p class="eyebrow" data-hint style="margin-top:1rem;opacity:.7;">Лацыг дар</p>
    </div>
  `;

  const flap = el.querySelector('[data-flap]');
  const letter = el.querySelector('[data-letter]');
  const seal = el.querySelector('[data-seal]');
  const puff = el.querySelector('[data-puff]');
  const openBtn = el.querySelector('[data-open]');
  const hint = el.querySelector('[data-hint]');
  let opened = false;
  let particles;
  let parallax;

  function openEnvelope() {
    if (opened) return;
    opened = true;
    ctx.sfx('pageTurn');

    const tl = gsap.timeline();
    // a soft puff ring bursts out from where the seal was
    tl.fromTo(
      puff,
      { scale: 0, autoAlpha: 0.65 },
      { scale: 1, autoAlpha: 0, duration: reducedMotion ? 0.001 : 0.8, ease: 'expo.out' },
      0
    );
    // seal pops off
    tl.to(seal, {
      scale: 0,
      autoAlpha: 0,
      rotateZ: 40,
      duration: reducedMotion ? 0.001 : 0.5,
      ease: 'back.in(2)',
    });
    // flap folds back and up (3D)
    tl.to(
      flap,
      {
        rotateX: -180,
        duration: reducedMotion ? 0.001 : 1,
        ease: 'expo.inOut',
      },
      '-=0.1'
    );
    // letter rises out
    tl.to(
      letter,
      {
        yPercent: -64,
        scale: 1.04,
        duration: reducedMotion ? 0.001 : 1.1,
        ease: 'expo.out',
      },
      '-=0.4'
    );
    // reveal the Нээх button + swap hint
    tl.add(() => {
      hint.textContent = '';
      openBtn.hidden = false;
    });
    tl.from(openBtn, {
      y: 16,
      autoAlpha: 0,
      duration: reducedMotion ? 0.001 : 0.7,
      ease: 'expo.out',
    });
  }

  // Tactile squish on press, before the click opens it
  seal.addEventListener('pointerdown', () => {
    if (opened) return;
    gsap.killTweensOf(seal); // stop the idle heartbeat so the squish reads
    gsap.to(seal, { scale: 0.84, duration: 0.12, ease: 'power2.out' });
  });
  seal.addEventListener('click', openEnvelope);
  openBtn.addEventListener('click', () => ctx.next());

  return {
    el,
    enter() {
      particles = ctx.particles(el);
      parallax = ctx.parallax(el);
      if (reducedMotion) return;
      // gentle idle float on the whole envelope to feel alive
      gsap.to(el.querySelector('[data-envelope]'), {
        y: -8,
        duration: 3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
      // seal heartbeat to invite the click
      gsap.to(seal, {
        scale: 1.06,
        duration: 0.9,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    },
    destroy() {
      particles?.destroy();
      parallax?.destroy();
      gsap.killTweensOf([el.querySelector('[data-envelope]'), seal]);
    },
  };
}
