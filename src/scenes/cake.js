/* =============================================================================
 * SCENE · ТӨРСӨН ӨДРИЙН БЯЛУУ (Orbiting Photo-Cake)
 * A CSS/SVG birthday cake at the centre. Polaroid memory-cards orbit it in TRUE
 * 3D space (preserve-3d turntable). Click a card → it comes forward and flips
 * into a "Дурсамжийн тэмдэглэл" note (photo left, handwritten message right).
 *
 * The ring does NOT spin on its own — the user drives it: scroll (wheel) or
 * drag spins it, and it coasts to a stop via friction. Clicking a photo opens
 * an envelope with that memory's letter.
 *
 * SMOOTHNESS NOTES (read before editing):
 *   • ONE requestAnimationFrame loop drives the whole turntable. Per frame we
 *     write transform on exactly two elements (orbit group + cake) — nothing
 *     else. Card ring positions are STATIC (set once on layout) on a wrapper
 *     `.cake-slot`; GSAP only ever touches the inner `.cake-card`, so the two
 *     never fight over the same transform.
 *   • translate3d(...) is prepended to force a GPU layer; CSS adds will-change.
 *   • Only transform / opacity animate. No top/left/width/height, ever.
 *   • Scroll / drag add angular velocity; friction coasts it to a stop.
 *   • Photos are decoded BEFORE the orbit fades in, so there's no pop-in.
 *   • prefers-reduced-motion → still user-spinnable, but no cake sway.
 * ========================================================================== */

import gsap from 'gsap';
import { CONFIG } from '../config.js';
import { reducedMotion, clamp } from '../core/env.js';

const DRAG_SENS = 0.45; //  degrees of spin per px dragged
const WHEEL_SENS = 0.03; // degrees of spin added per wheel-delta unit
const FRICTION = 0.93; //   momentum decay each frame → coasts to a stop
const MAX_VEL = 9; //       clamp spin speed (deg/frame)
const CAKE_SWAY = 9; //     cake gentle rotateY amplitude (deg)
const CAKE_BOB = 5; //      cake gentle vertical bob (px)
const RING_TILT = -25; //   tilt the photo ring back so it crowns the cake (deg)
const RING_LIFT = -40; //   raise the ring above centre so it haloes the top (px)

export default function cakeScene(ctx) {
  const cfg = CONFIG.cake;
  const photos = cfg.photos.slice(0, cfg.photoCount || cfg.photos.length);
  const count = photos.length;
  const sens = (cfg.orbitSpeed ?? 0.18) / 0.18; // config tunes spin sensitivity

  const el = document.createElement('section');
  el.className = 'scene cake-scene';
  el.innerHTML = `
    <div class="scene__inner">
      <p class="eyebrow">Төрсөн өдрийн бялуу</p>
      <p class="cake-caption">Гүйлгэж эргүүлээд зургийг дарж захидлыг нь уншина уу 💌</p>

      <div class="cake-stage" data-stage>
        <div class="cake-orbit" data-orbit></div>
        ${cakeMarkup()}
      </div>

      <div class="btn-row">
        <button class="btn btn--ghost" data-magnetic data-back>Захидал руу буцах</button>
      </div>
    </div>

    <!-- Memory envelope: click a photo → it opens and a letter rises out -->
    <div class="cake-detail" data-detail hidden>
      <div class="cake-detail__backdrop" data-detail-close></div>
      <button class="cake-detail__close" data-detail-close aria-label="Хаах">✕</button>
      <div class="memo" data-memo>
        <div class="memo__letter" data-memo-letter>
          <img class="memo__photo" data-memo-photo alt="" decoding="async" />
          <div class="memo__note">
            <p class="memo__eyebrow">Дурсамжийн захидал</p>
            <h3 class="memo__title" data-memo-title></h3>
            <p class="memo__msg" data-memo-msg></p>
          </div>
        </div>
        <div class="memo__env">
          <div class="memo__pocket"></div>
          <div class="memo__flap" data-memo-flap></div>
          <div class="memo__seal" data-memo-seal>♥</div>
        </div>
      </div>
    </div>
  `;

  const stage = el.querySelector('[data-stage]');
  const orbit = el.querySelector('[data-orbit]');
  const cakeIllus = el.querySelector('[data-cake]');
  const detail = el.querySelector('[data-detail]');
  const memo = el.querySelector('[data-memo]');
  const memoLetter = el.querySelector('[data-memo-letter]');
  const memoFlap = el.querySelector('[data-memo-flap]');
  const memoSeal = el.querySelector('[data-memo-seal]');
  const dPhoto = el.querySelector('[data-memo-photo]');
  const dTitle = el.querySelector('[data-memo-title]');
  const dMsg = el.querySelector('[data-memo-msg]');

  let particles;
  let raf = null;
  let angle = 0; //      current orbit rotation (deg)
  let velocity = 0; //   angular velocity (deg/frame), driven by scroll/drag
  let swayT = 0; //      cake sway phase
  let paused = false; // true while a memory is open
  let radius = 220;

  // --- Build the orbiting cards -------------------------------------------
  const slots = [];
  photos.forEach((p, i) => {
    const slot = document.createElement('div');
    slot.className = 'cake-slot';
    slot.innerHTML = `
      <div class="cake-card" data-card data-cursor-grow>
        <div class="cake-card__face cake-card__face--front">
          <img class="cake-card__photo" src="${p.src}" alt="${p.noteTitle}"
               loading="eager" decoding="async" />
        </div>
        <div class="cake-card__face cake-card__face--back">
          <img class="cake-card__photo" src="${p.src}" alt="" decoding="async" />
        </div>
      </div>
    `;
    orbit.appendChild(slot);
    const card = slot.querySelector('[data-card]');
    card.addEventListener('click', () => {
      if (dragMoved) return; // a drag, not a tap — ignore
      openMemory(i);
    });
    slots.push(slot);
  });

  // --- Ring geometry: place each slot once (static transforms) ------------
  function layout() {
    radius = clamp(stage.clientWidth * 0.5, 200, 330);
    slots.forEach((slot, i) => {
      const a = (360 / count) * i; //          even spread around the axis
      const z = radius + (i % 2 ? -18 : 14); // slight depth variance per card
      const lift = ((i % 3) - 1) * 12; //       vary height: -12 / 0 / 12
      const tilt = (i % 2 ? 1 : -1) * 5; //     small playful roll
      slot.style.transform =
        `rotateY(${a}deg) translateZ(${z}px) translateY(${lift}px) rotateZ(${tilt}deg)`;
    });
  }

  // --- The single rAF loop (turntable + cake sway) ------------------------
  function frame() {
    raf = requestAnimationFrame(frame);
    if (paused) return;
    if (!dragging) {
      angle += velocity;
      velocity *= FRICTION; // coast to a stop — the ring never spins by itself
    }
    // Ring is raised + tilted back so the photos crown the cake instead of
    // covering its face; the spin (rotateY) happens inside that tilt.
    orbit.style.transform =
      `translate3d(0,${RING_LIFT}px,0) rotateX(${RING_TILT}deg) rotateY(${angle}deg)`;
    if (!reducedMotion) {
      swayT += 0.012;
      cakeIllus.style.transform =
        `translate3d(0,${Math.sin(swayT * 0.8) * CAKE_BOB}px,0) rotateY(${Math.sin(swayT) * CAKE_SWAY}deg)`;
    }
  }
  function startLoop() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  // --- Drag-to-spin with momentum -----------------------------------------
  let dragging = false;
  let dragMoved = false;
  let lastX = 0;
  let dragVel = 0;

  function onDown(e) {
    if (paused) return;
    dragging = true;
    dragMoved = false;
    lastX = e.clientX;
    dragVel = 0;
    stage.setPointerCapture?.(e.pointerId);
  }
  function onMove(e) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    if (Math.abs(dx) > 0.5) dragMoved = true;
    const delta = dx * DRAG_SENS * sens;
    angle += delta; // applied here; the rAF just renders it while dragging
    dragVel = delta;
    lastX = e.clientX;
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    velocity = dragVel; // hand the flick's speed to the momentum model
  }
  // Scroll up / down spins the ring (the primary control on desktop).
  function onWheel(e) {
    if (paused) return;
    e.preventDefault();
    velocity = clamp(velocity + e.deltaY * WHEEL_SENS * sens, -MAX_VEL, MAX_VEL);
  }
  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
  stage.addEventListener('wheel', onWheel, { passive: false });

  // --- Open / close a memory: envelope opens, the letter rises out ---------
  function openMemory(i) {
    const p = photos[i];
    dPhoto.src = p.src;
    dTitle.textContent = p.noteTitle;
    dMsg.textContent = p.noteMessage;
    detail.hidden = false;
    paused = true;
    ctx.sfx('pageTurn');

    const d = reducedMotion ? 0.001 : 1;
    gsap.killTweensOf([memo, memoLetter, memoFlap, memoSeal, stage]);
    const tl = gsap.timeline();
    tl.to(stage, { scale: 0.82, autoAlpha: 0.16, duration: 0.7 * d, ease: 'power3.out' }, 0);
    // envelope pops in (closed)
    tl.fromTo(
      memo,
      { scale: 0.86, autoAlpha: 0, y: 20 },
      { scale: 1, autoAlpha: 1, y: 0, duration: 0.6 * d, ease: 'expo.out' },
      0.05
    );
    tl.set([memoLetter, memoFlap, memoSeal], { clearProps: 'transform' });
    tl.set(memoLetter, { yPercent: 40, scale: 0.9, autoAlpha: 0, zIndex: 1 });
    // wax seal pops off, flap swings open
    tl.to(memoSeal, { scale: 0, autoAlpha: 0, duration: 0.4 * d, ease: 'back.in(2)' }, '>-0.1');
    tl.to(memoFlap, { rotateX: -172, duration: 0.7 * d, ease: 'expo.inOut' }, '<');
    // letter rises out, comes in front of the envelope, settles fully readable
    tl.set(memoLetter, { zIndex: 5 }, '>-0.3');
    tl.to(
      memoLetter,
      { yPercent: -14, scale: 1, autoAlpha: 1, duration: 0.9 * d, ease: 'expo.out' },
      '<'
    );
  }

  function closeMemory() {
    const d = reducedMotion ? 0.001 : 1;
    ctx.sfx('pageTurn');
    gsap.killTweensOf([memo, memoLetter, memoFlap, memoSeal, stage]);
    const tl = gsap.timeline({
      onComplete: () => {
        detail.hidden = true;
        paused = false; // ring is user-spinnable again
      },
    });
    tl.to(memoLetter, { yPercent: 38, scale: 0.9, autoAlpha: 0, duration: 0.45 * d, ease: 'power3.in' }, 0);
    tl.to(memoFlap, { rotateX: 0, duration: 0.5 * d, ease: 'expo.inOut' }, 0.1);
    tl.to(memo, { scale: 0.86, autoAlpha: 0, duration: 0.4 * d, ease: 'power3.in' }, 0.3 * d);
    tl.to(stage, { scale: 1, autoAlpha: 1, duration: 0.7 * d, ease: 'expo.out' }, 0.25 * d);
  }

  el.querySelectorAll('[data-detail-close]').forEach((b) =>
    b.addEventListener('click', closeMemory)
  );
  el.querySelector('[data-back]').addEventListener('click', () => {
    ctx.sfx('pageTurn');
    ctx.goTo('letter'); // existing cinematic transition, back to the Letter
  });

  // --- Preload + decode photos before the orbit appears (no pop-in) -------
  async function preload() {
    const srcs = photos.map((p) => p.src);
    if (CONFIG.cake.cakeImage) srcs.push(CONFIG.cake.cakeImage); // centerpiece first-class
    await Promise.all(
      srcs.map((src) => {
        const img = new Image();
        img.src = src;
        return img.decode?.().catch(() => {}) ?? Promise.resolve();
      })
    );
  }

  const onResize = () => layout();

  return {
    el,
    async enter() {
      // gold embers, matching every other scene in the warm plum world
      particles = ctx.particles(el);
      layout();
      window.addEventListener('resize', onResize, { passive: true });
      gsap.set(stage, { autoAlpha: 0 });

      await preload();

      gsap.to(stage, { autoAlpha: 1, duration: reducedMotion ? 0.001 : 0.9, ease: 'expo.out' });
      if (!reducedMotion) {
        // cards drift up into the ring (animates the inner .cake-card only)
        gsap.from(el.querySelectorAll('[data-card]'), {
          autoAlpha: 0,
          y: 26,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.05,
        });
      }
      startLoop(); // loop runs so the user can scroll/drag to spin
    },
    destroy() {
      particles?.destroy();
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      gsap.killTweensOf([memo, memoLetter, memoFlap, memoSeal, stage, orbit, cakeIllus]);
    },
  };
}

/* The cake at the centre of the orbit.
 * If CONFIG.cake.cakeImage is set → a realistic photo cutout with a soft contact
 * shadow (gentle motion is applied by the rAF loop). Otherwise → the lightweight
 * built-in CSS cake. */
function cakeMarkup() {
  if (CONFIG.cake.cakeImage) {
    // The photo already carries its own stand, reflection and shadow — we just
    // feather its edges (CSS mask) into the matching pink backdrop.
    return `
    <div class="cake-illus cake-illus--photo" data-cake aria-hidden="true">
      <img class="cake-photo__img" src="${CONFIG.cake.cakeImage}" alt="" decoding="async" />
    </div>
  `;
  }
  return cssCakeMarkup();
}

/* Lightweight layered CSS/SVG cake (pink frosting, drips, candle, toppers). */
function cssCakeMarkup() {
  return `
    <div class="cake-illus" data-cake aria-hidden="true">
      <div class="cake-illus__candleflame"></div>
      <div class="cake-illus__candle"></div>
      <div class="cake-illus__tier cake-illus__tier--top">
        <span class="cake-illus__dot" style="left:18%"></span>
        <span class="cake-illus__dot" style="left:50%"></span>
        <span class="cake-illus__dot" style="left:82%"></span>
      </div>
      <div class="cake-illus__tier cake-illus__tier--bottom"></div>
      <div class="cake-illus__plate"></div>
      <div class="cake-illus__stand"></div>
    </div>
  `;
}
