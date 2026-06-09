/* =============================================================================
 * ENV — shared environment flags & small helpers used across modules
 * ========================================================================== */

// prefers-reduced-motion (live — users can toggle OS setting)
const rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
export let reducedMotion = rmQuery.matches;
rmQuery.addEventListener('change', (e) => (reducedMotion = e.matches));

// Touch / coarse pointer (phones) — drives cursor + interaction choices
export const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

// Fix the mobile "100vh" jump: expose a --vh custom property.
function setVh() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}
setVh();
window.addEventListener('resize', setVh, { passive: true });
window.addEventListener('orientationchange', setVh);

// clamp helper
export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
