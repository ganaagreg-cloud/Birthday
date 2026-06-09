/* =============================================================================
 * SCENE MANAGER — mounts one scene at a time and runs cinematic transitions.
 *
 * Scene contract: a factory `(ctx) => sceneInstance` where sceneInstance is:
 *   {
 *     el:        HTMLElement (a .scene),
 *     enter():   Promise|void  — intro animation when it becomes active,
 *     leave():   Promise|void  — outro animation before it's removed,
 *     destroy(): void          — release listeners / canvases,
 *   }
 *
 * ctx given to every scene:
 *   { next(), goTo(i|name), replay(), index, total, sfx(name), particles(parent) }
 *
 * A scene factory may carry two optional, backward-compatible tags:
 *   factory.sceneName = 'cake'  → reachable via goTo('cake')
 *   factory.isBranch  = true    → a side-trip; gets no progress dot
 * ========================================================================== */

import gsap from 'gsap';
import { reducedMotion } from './env.js';
import { createParticles } from './particles.js';
import { createParallax } from './parallax.js';
import { play } from './audio.js';
import { bindMagnetic } from './magnetic.js';

export function createSceneManager(root, scenes) {
  let index = -1;
  let current = null;
  let busy = false;

  const ctx = (i) => ({
    index: i,
    total: scenes.length,
    next: () => go(i + 1),
    goTo: (n) => go(n),
    replay: () => go(0),
    sfx: play,
    particles: (parent, opts) => createParticles(parent, opts),
    parallax: (scope, opts) => createParallax(scope, opts),
  });

  // Resolve optional scene names → index (for goTo('cake') etc.)
  const nameToIndex = {};
  scenes.forEach((f, i) => {
    if (f.sceneName) nameToIndex[f.sceneName] = i;
  });

  // Progress dots — one per *primary* scene; branch scenes get none.
  const progress = document.createElement('nav');
  progress.className = 'progress';
  progress.setAttribute('aria-hidden', 'true');
  const dotForScene = []; // sceneIndex → dot index, or -1 for branch scenes
  scenes.forEach((factory, i) => {
    if (factory.isBranch) {
      dotForScene[i] = -1;
      return;
    }
    dotForScene[i] = progress.children.length;
    const d = document.createElement('span');
    d.className = 'progress__dot';
    progress.appendChild(d);
  });
  document.body.appendChild(progress);
  const dots = [...progress.children];

  function setProgress(i) {
    const di = dotForScene[i];
    progress.classList.toggle('progress--hidden', di < 0); // hide on branch scenes
    if (di < 0) return;
    dots.forEach((d, n) => d.classList.toggle('is-active', n === di));
  }

  async function go(target) {
    if (typeof target === 'string') target = nameToIndex[target]; // goTo('cake')
    if (busy || target == null || target < 0 || target >= scenes.length || target === index)
      return;
    busy = true;

    const prev = current;
    const inst = scenes[target](ctx(target));
    current = inst;
    index = target;

    // Mount new scene on top, hidden
    root.appendChild(inst.el);
    gsap.set(inst.el, { autoAlpha: 0 });

    // Cinematic cross-transition: old scales/fades out, new fades/scales in.
    const dur = reducedMotion ? 0.001 : 0.9;

    if (prev) {
      await Promise.resolve(prev.leave?.());
      gsap.to(prev.el, {
        autoAlpha: 0,
        scale: 1.06,
        duration: dur,
        ease: 'expo.inOut',
        onComplete: () => {
          prev.destroy?.();
          prev.el.remove();
        },
      });
    }

    gsap.fromTo(
      inst.el,
      { autoAlpha: 0, scale: reducedMotion ? 1 : 0.985 },
      {
        autoAlpha: 1,
        scale: 1,
        duration: dur,
        ease: 'expo.out',
        delay: prev ? dur * 0.35 : 0,
        onComplete: async () => {
          bindMagnetic(inst.el);
          // Move focus to the scene's primary action for keyboard users.
          // :focus-visible keeps the ring hidden for mouse users.
          const primary =
            inst.el.querySelector('.btn:not(.btn--ghost):not([hidden])') ||
            inst.el.querySelector('.btn:not([hidden])');
          primary?.focus?.({ preventScroll: true });
          await Promise.resolve(inst.enter?.());
          busy = false;
        },
      }
    );

    setProgress(target);
  }

  // Keyboard navigation: → / ← step the linear flow, R replays. Enter/Space are
  // left to the focused button so they don't double-advance. Arrows are ignored
  // on branch scenes (e.g. the cake), which have their own "back" control.
  function onKey(e) {
    if (busy) return;
    const branch = scenes[index]?.isBranch;
    if ((e.key === 'ArrowRight' || e.key === 'PageDown') && !branch) go(index + 1);
    else if ((e.key === 'ArrowLeft' || e.key === 'PageUp') && !branch) go(index - 1);
    else if (e.key === 'r' || e.key === 'R') go(0);
  }
  window.addEventListener('keydown', onKey);

  return {
    start: () => go(0),
    go,
    get index() {
      return index;
    },
  };
}
