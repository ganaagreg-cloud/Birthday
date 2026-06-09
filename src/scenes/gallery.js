/* =============================================================================
 * SCENE 3 · ДУРСАМЖ (3D Polaroid Gallery)
 * A stack of polaroids. Click/tap a polaroid to flip it in 3D; swipe or use the
 * arrows to move through the stack. Subtle parallax tilt follows the pointer.
 * ========================================================================== */

import gsap from 'gsap';
import { CONFIG } from '../config.js';
import { reducedMotion, isTouch } from '../core/env.js';

export default function galleryScene(ctx) {
  const photos = CONFIG.photos;
  const el = document.createElement('section');
  el.className = 'scene gallery-scene';
  el.innerHTML = `
    <div class="scene-glow" data-depth="-16" aria-hidden="true"></div>
    <div class="scene__inner">
      <p class="eyebrow">Дурсамж</p>
      <div class="gallery">
        <p class="gallery__caption">Зургийг дарж 3D хэлбэрээр үзнэ үү</p>
        <div class="gallery__track" data-track></div>
        <div class="gallery__nav">
          <button class="gallery__arrow" data-prev aria-label="Өмнөх">‹</button>
          <div class="gallery__dots" data-dots></div>
          <button class="gallery__arrow" data-next-photo aria-label="Дараах">›</button>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn" data-magnetic data-finish>Үргэлжлүүлэх</button>
      </div>
    </div>
  `;

  const track = el.querySelector('[data-track]');
  const dotsWrap = el.querySelector('[data-dots]');
  let particles;
  let parallax;
  let active = 0;
  const cards = [];

  // Build polaroids (lazy-loaded images)
  photos.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'polaroid';
    card.innerHTML = `
      <div class="polaroid__inner">
        <div class="polaroid__face polaroid__face--front">
          <img class="polaroid__photo" src="${p.src}" alt="${p.caption}" loading="lazy" decoding="async" />
          <div class="polaroid__caption">${p.caption}</div>
        </div>
        <div class="polaroid__face polaroid__face--back">
          <div class="polaroid__back-text">${p.caption}</div>
        </div>
      </div>
    `;
    // Flip on click (ignore drags handled below by checking movement)
    card.addEventListener('click', () => {
      if (i !== active) return;
      card.classList.toggle('is-flipped');
      ctx.sfx('pageTurn');
    });
    track.appendChild(card);
    cards.push(card);

    const dot = document.createElement('span');
    dot.className = 'gallery__dot';
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = [...dotsWrap.children];

  // Arrange the stack: active centered, others fanned behind with depth.
  function arrange() {
    cards.forEach((card, i) => {
      const offset = i - active;
      const abs = Math.abs(offset);
      const isActive = offset === 0;
      gsap.to(card, {
        xPercent: offset * 12,
        yPercent: abs * 4,
        z: -abs * 80,
        rotateZ: offset * 4,
        scale: isActive ? 1 : 0.9 - abs * 0.04,
        autoAlpha: abs > 2 ? 0 : 1 - abs * 0.18,
        duration: reducedMotion ? 0.001 : 0.8,
        ease: 'expo.out',
        zIndex: 100 - abs,
        overwrite: 'auto',
      });
      card.style.pointerEvents = isActive ? 'auto' : 'none';
      card.style.zIndex = String(100 - abs);
    });
    dots.forEach((d, i) => d.classList.toggle('is-active', i === active));
  }

  function goTo(i) {
    const clamped = Math.max(0, Math.min(photos.length - 1, i));
    if (clamped === active) return;
    // un-flip the one we leave
    cards[active].classList.remove('is-flipped');
    active = clamped;
    arrange();
  }

  el.querySelector('[data-prev]').addEventListener('click', () => goTo(active - 1));
  el.querySelector('[data-next-photo]').addEventListener('click', () => goTo(active + 1));
  el.querySelector('[data-finish]').addEventListener('click', () => ctx.next());

  // Swipe (horizontal) on the track
  let downX = 0;
  let downT = 0;
  let moved = false;
  track.addEventListener('pointerdown', (e) => {
    downX = e.clientX;
    downT = Date.now();
    moved = false;
  });
  track.addEventListener('pointermove', (e) => {
    if (downT && Math.abs(e.clientX - downX) > 8) moved = true;
  });
  track.addEventListener('pointerup', (e) => {
    const dx = e.clientX - downX;
    if (moved && Math.abs(dx) > 40) {
      goTo(active + (dx < 0 ? 1 : -1));
    }
    downT = 0;
  });

  // Pointer-parallax tilt on the active card (desktop only)
  function onMove(e) {
    if (reducedMotion) return;
    const card = cards[active];
    if (!card || card.classList.contains('is-flipped')) return;
    const r = track.getBoundingClientRect();
    const rx = ((e.clientY - (r.top + r.height / 2)) / r.height) * -12;
    const ry = ((e.clientX - (r.left + r.width / 2)) / r.width) * 12;
    gsap.to(card.querySelector('.polaroid__inner'), {
      rotateX: rx,
      rotateY: ry,
      duration: 0.5,
      ease: 'power3.out',
    });
  }
  function onLeave() {
    const inner = cards[active]?.querySelector('.polaroid__inner');
    if (inner && !cards[active].classList.contains('is-flipped'))
      gsap.to(inner, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
  }
  if (!isTouch) {
    track.addEventListener('mousemove', onMove);
    track.addEventListener('mouseleave', onLeave);
  }

  return {
    el,
    enter() {
      particles = ctx.particles(el);
      parallax = ctx.parallax(el);
      arrange();
      if (reducedMotion) return;
      gsap.from(cards, {
        yPercent: 60,
        autoAlpha: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.06,
      });
      // gentle idle float on the whole stack so it feels held, not pinned
      gsap.to(track, { y: -6, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    },
    destroy() {
      particles?.destroy();
      parallax?.destroy();
      gsap.killTweensOf(cards);
      gsap.killTweensOf(track);
    },
  };
}
