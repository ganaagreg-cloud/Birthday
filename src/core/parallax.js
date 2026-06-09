/* =============================================================================
 * PARALLAX — layered depth that follows the pointer (desktop) or device tilt
 * (phone gyro). The single biggest "this is alive" win on a real phone.
 *
 * Usage (mirrors particles): a scene calls ctx.parallax(scene.el) in enter()
 * and keeps the returned controller to .destroy() on leave.
 *
 * Mark depth layers in markup with `data-depth="N"` where N is the max pixel
 * shift for that layer (background small, foreground large). Layers MUST be
 * dedicated to parallax — don't put data-depth on elements GSAP also transforms,
 * or the two will fight over the same `transform`.
 *
 * Respects prefers-reduced-motion (no-op). iOS gyro needs a permission grant on
 * a user gesture — see requestTilt(), called from the opening gate.
 * ========================================================================== */

import { reducedMotion, isTouch, clamp } from './env.js';

let tiltGranted = false;

/* iOS 13+ gates DeviceOrientation behind a permission prompt that must be
 * triggered from a user gesture. Call this from the gate button handler. */
export async function requestTilt() {
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === 'function') {
    try {
      tiltGranted = (await DOE.requestPermission()) === 'granted';
    } catch {
      tiltGranted = false;
    }
  } else {
    tiltGranted = true; // non-iOS: orientation events flow freely
  }
  return tiltGranted;
}

export function createParallax(scope, opts = {}) {
  const { strength = 1, lerp = 0.08 } = opts;
  const layers = scope ? [...scope.querySelectorAll('[data-depth]')] : [];
  if (reducedMotion || !layers.length) return { destroy() {} };

  let tx = 0;
  let ty = 0; // target, normalized -1..1
  let cx = 0;
  let cy = 0; // current
  let raf = null;

  function render() {
    cx += (tx - cx) * lerp;
    cy += (ty - cy) * lerp;
    for (const layer of layers) {
      const depth = parseFloat(layer.dataset.depth) || 0;
      layer.style.transform = `translate3d(${(cx * depth).toFixed(2)}px, ${(cy * depth).toFixed(2)}px, 0)`;
    }
    raf = requestAnimationFrame(render);
  }

  function onPointer(e) {
    tx = clamp((e.clientX / window.innerWidth - 0.5) * 2, -1, 1) * strength;
    ty = clamp((e.clientY / window.innerHeight - 0.5) * 2, -1, 1) * strength;
  }

  function onOrient(e) {
    if (e.gamma == null) return; // no sensor data
    tx = clamp(e.gamma / 28, -1, 1) * strength; // left-right tilt
    ty = clamp((e.beta - 45) / 28, -1, 1) * strength; // front-back, neutral ~45°
  }

  if (isTouch) window.addEventListener('deviceorientation', onOrient, { passive: true });
  else window.addEventListener('pointermove', onPointer, { passive: true });
  raf = requestAnimationFrame(render);

  return {
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('deviceorientation', onOrient);
      for (const layer of layers) layer.style.transform = '';
    },
  };
}
