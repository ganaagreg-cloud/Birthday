/* =============================================================================
 * SCENE 4 · ТӨГСГӨЛ (Finale)
 * Big title reveal + confetti burst + ambient particles. "Дахин үзэх" replays
 * the whole experience from the first scene.
 * ========================================================================== */

import gsap from 'gsap';
import { CONFIG } from '../config.js';
import { reducedMotion } from '../core/env.js';

const CONFETTI_COLORS = ['#d9b27c', '#f0cf9a', '#c79aa1', '#9c6b74', '#f5ece2'];

export default function finaleScene(ctx) {
  const title = CONFIG.finaleTitleTemplate.replace('{name}', CONFIG.recipientName);
  const el = document.createElement('section');
  el.className = 'scene finale';
  el.innerHTML = `
    <canvas class="confetti-canvas" data-confetti aria-hidden="true"></canvas>
    <div class="scene__inner">
      <p class="eyebrow">Төгсгөл</p>
      <h1 class="finale__title" data-title>${title}</h1>
      <p class="finale__wish" data-wish>${CONFIG.finaleWish}</p>
      <p class="finale__sub">Чамайг хайрладаг хүн чинь энэ бүхнийг чамд зориулав ❤</p>
      <div class="btn-row">
        <button class="btn" data-magnetic data-replay>Дахин үзэх</button>
      </div>
    </div>
  `;

  const canvas = el.querySelector('[data-confetti]');
  const ctx2d = canvas.getContext('2d');
  let particles;
  let confetti = [];
  let raf = null;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = el.clientWidth * dpr;
    canvas.height = el.clientHeight * dpr;
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function burst() {
    if (reducedMotion) return;
    const cx = el.clientWidth / 2;
    const cy = el.clientHeight * 0.42;
    const N = el.clientWidth < 600 ? 90 : 160;
    confetti = Array.from({ length: N }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 4;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        size: Math.random() * 8 + 4,
        color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        life: 1,
      };
    });
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function tick() {
    ctx2d.clearRect(0, 0, el.clientWidth, el.clientHeight);
    let alive = false;
    for (const c of confetti) {
      c.vy += 0.22; // gravity
      c.vx *= 0.99;
      c.x += c.vx;
      c.y += c.vy;
      c.rot += c.vr;
      c.life -= 0.006;
      if (c.life > 0 && c.y < el.clientHeight + 40) {
        alive = true;
        ctx2d.save();
        ctx2d.translate(c.x, c.y);
        ctx2d.rotate(c.rot);
        ctx2d.globalAlpha = Math.max(0, c.life);
        ctx2d.fillStyle = c.color;
        ctx2d.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
        ctx2d.restore();
      }
    }
    if (alive) raf = requestAnimationFrame(tick);
    else {
      raf = null;
      ctx2d.clearRect(0, 0, el.clientWidth, el.clientHeight);
    }
  }

  const onResize = () => resize();
  window.addEventListener('resize', onResize, { passive: true });

  el.querySelector('[data-replay]').addEventListener('click', () => {
    ctx.sfx('pageTurn');
    ctx.replay();
  });

  return {
    el,
    enter() {
      particles = ctx.particles(el, { count: 60 });
      resize();
      ctx.sfx('unlock');

      const tl = gsap.timeline();
      if (!reducedMotion) {
        tl.from(el.querySelector('[data-title]'), {
          scale: 0.8,
          autoAlpha: 0,
          y: 30,
          duration: 1.2,
          ease: 'expo.out',
        });
        tl.from(
          el.querySelectorAll('.finale__wish, .finale__sub, .btn-row'),
          { y: 20, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.15 },
          '-=0.7'
        );
      }
      // confetti on a couple of beats for a "swell"
      tl.add(burst, reducedMotion ? 0 : 0.4);
      if (!reducedMotion) {
        tl.add(burst, 1.4);
        // gentle title shimmer
        gsap.to(el.querySelector('[data-title]'), {
          backgroundPositionX: '200%',
          duration: 6,
          ease: 'none',
          repeat: -1,
        });
      }
    },
    destroy() {
      particles?.destroy();
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
      gsap.killTweensOf(el.querySelector('[data-title]'));
    },
  };
}
