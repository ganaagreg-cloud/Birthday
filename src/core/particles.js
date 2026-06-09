/* =============================================================================
 * PARTICLES — subtle ambient drifting embers/dust behind every scene.
 * Lightweight canvas, capped particle count, DPR-aware, pauses when hidden.
 * Returns a controller with .destroy().
 * ========================================================================== */

import { reducedMotion } from './env.js';

export function createParticles(parent, opts = {}) {
  const {
    count = window.innerWidth < 600 ? 26 : 46,
    color = '217, 178, 124', // gold rgb
    maxSize = 2.6,
    speed = 0.18,
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.className = 'particles';
  parent.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let w, h, dpr;
  let particles = [];
  let raf = null;
  let running = true;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = parent.clientWidth;
    h = parent.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn() {
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * maxSize + 0.4,
      vx: (Math.random() - 0.5) * speed,
      vy: -(Math.random() * speed + 0.05),
      a: Math.random() * 0.5 + 0.1,
      tw: Math.random() * Math.PI * 2, // twinkle phase
    }));
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.tw += 0.02;
      if (p.y < -10) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      const alpha = p.a * (0.6 + 0.4 * Math.sin(p.tw));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${alpha})`;
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  resize();
  spawn();

  if (reducedMotion) {
    // Draw a single static field, no animation loop.
    frame.call({ running: false });
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${p.a})`;
      ctx.fill();
    }
  } else {
    raf = requestAnimationFrame(frame);
  }

  const onResize = () => {
    resize();
    spawn();
  };
  window.addEventListener('resize', onResize, { passive: true });

  // Pause when tab hidden to save battery
  const onVis = () => {
    running = !document.hidden && !reducedMotion;
    if (running && !raf) raf = requestAnimationFrame(frame);
  };
  document.addEventListener('visibilitychange', onVis);

  return {
    destroy() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      canvas.remove();
    },
  };
}
