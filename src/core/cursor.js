/* =============================================================================
 * CURSOR — custom cursor with smooth lerp follow + magnetic "active" state.
 * Dot tracks instantly-ish; ring trails with easing for a premium feel.
 * Disabled entirely on touch devices.
 * ========================================================================== */

import { isTouch } from './env.js';

export function initCursor() {
  if (isTouch) return; // native cursor on phones

  const el = document.querySelector('[data-cursor]');
  if (!el) return;
  const dot = el.querySelector('.cursor__dot');
  const ring = el.querySelector('.cursor__ring');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener(
    'mousemove',
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // dot follows immediately
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    },
    { passive: true }
  );

  // ring trails with smooth lerp (rAF loop)
  function loop() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Grow ring near interactive elements (event delegation so it works for
  // dynamically mounted scenes). Elements may also carry `data-cursor-state`
  // (e.g. "spin", "open") to morph the cursor into a context-specific hint.
  const interactiveSelector =
    'a, button, .btn, .btn-soft, .wax-seal, .polaroid, .gallery__arrow, [data-magnetic], [data-cursor-grow]';

  let stateClass = '';
  const setState = (s) => {
    if (stateClass) el.classList.remove(stateClass);
    stateClass = s ? `cursor--${s}` : '';
    if (stateClass) el.classList.add(stateClass);
  };

  document.addEventListener(
    'mouseover',
    (e) => {
      const hit = e.target.closest(interactiveSelector);
      if (hit) {
        el.classList.add('cursor--active');
        setState(hit.dataset.cursorState || '');
      }
    },
    { passive: true }
  );
  document.addEventListener(
    'mouseout',
    (e) => {
      if (e.target.closest(interactiveSelector)) {
        el.classList.remove('cursor--active');
        setState('');
      }
    },
    { passive: true }
  );

  // Press state for a physical "click" feel
  document.addEventListener('mousedown', () => el.classList.add('cursor--press'), { passive: true });
  document.addEventListener('mouseup', () => el.classList.remove('cursor--press'), { passive: true });

  // Hide cursor when it leaves the window
  document.addEventListener('mouseleave', () => el.classList.add('cursor--hidden'));
  document.addEventListener('mouseenter', () => el.classList.remove('cursor--hidden'));
}
