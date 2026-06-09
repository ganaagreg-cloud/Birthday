---
name: motion-design
description: >-
  Author premium, award-tier web motion for this birthday-letter site (and
  similar GSAP projects). Use when adding or refining animations, scene
  transitions, scroll effects, 3D transforms, text reveals, cursor/magnetic
  interactions, particles/confetti, or sound-synced motion. Encodes this
  project's stack (GSAP + ScrollTrigger, Lenis, Howler, CSS 3D), easing tokens,
  60fps rules, and the prefers-reduced-motion contract.
---

# Motion Design

Build motion that feels **physical, cinematic, and intentional** — never linear,
never janky. This skill captures the conventions already used across
`src/core/` and `src/scenes/`. Match them; don't reinvent.

## When to use
Adding/editing any animation: scene intros/outros, the envelope fold, lock dials,
masked text reveals, polaroid 3D flips, confetti/particles, magnetic buttons,
the custom cursor, scroll-linked effects, or anything timed to sound.

## Non-negotiables (read first)
1. **Animate only `transform` and `opacity`.** Never animate `width`, `height`,
   `top/left`, `margin`, `box-shadow`, `filter` in a loop. Use `x/y/scale/rotate`
   and `autoAlpha`. This is what keeps it 60fps on phones.
2. **No linear easing, ever.** Use the tokens below.
3. **Respect reduced motion.** Import `reducedMotion` from `src/core/env.js`.
   When true: collapse durations to ~0.001 and skip ambient/looping/parallax
   effects, but still deliver the end state (content visible, scenes advance).
4. **`will-change` only on elements about to move,** and let it settle — don't
   slap it on everything. The CSS already sets it on `.scene`, `.reveal-line`,
   dials, polaroids, cursor.
5. **Kill what you start.** Every looping/infinite tween or ScrollTrigger must be
   torn down in the scene's `destroy()` (`gsap.killTweensOf(...)`, `st.kill()`).
6. **Mobile-first.** Test transforms at 360px wide. Reduce particle counts and
   parallax magnitude on small screens / touch (`isTouch` from `env.js`).

## Easing tokens
CSS (in `:root`, `src/styles/base.css`): `--ease-expo`, `--ease-power4`,
`--ease-soft`. GSAP equivalents:

| Intent | GSAP ease |
|---|---|
| Entrances, reveals, "settling into place" | `expo.out` |
| Smooth UI / drifts | `power3.out` / `power4.out` |
| Cross-scene in/out | `expo.inOut` |
| Tactile snap (dials, seal pop) | `back.out(1.7)` / `back.in(2)` |
| Bouncy release (magnetic return) | `elastic.out(1, 0.4)` |
| Continuous ambient idle | `sine.inOut` (with `yoyo:true, repeat:-1`) |

Never use `none`/linear except for a steady shimmer (e.g. gradient sweep).

## Palette / depth tokens
Pull colors from CSS vars, not hardcoded hex: `--rose-deep #78555e`,
`--rose`, `--rose-soft`, `--cream`, `--gold #d9b27c`, `--gold-bright`, `--ink`.
Confetti/particle colors live in the scene files; reuse those arrays.

## The scene contract (how motion is structured)
Scenes are factories `(ctx) => { el, enter, leave?, destroy }` mounted by
`src/core/sceneManager.js`. Put motion in the right place:
- **`enter()`** — intro timeline + start ambient particles (`ctx.particles(el)`).
- **`leave()`** — return a tween/Promise; the manager waits before removing.
- **`destroy()`** — `particles?.destroy()` + kill every tween/ScrollTrigger.
- `ctx.sfx(name)` fires UI sound; sync it to the motion beat, not after it.

Transitions between scenes are already cinematic (cross fade + scale in
`sceneManager`). Don't add hard cuts.

## Recipes

### Masked line reveal (text rising from behind a mask)
Use the helpers — don't hand-roll.
```js
import { buildMaskedLines, revealLines } from '../core/textReveal.js';
const inners = buildMaskedLines(containerEl, ['line one', 'line two']);
const tl = gsap.timeline();
tl.add(revealLines(inners, { duration: 1, stagger: 0.14 })); // expo.out, yPercent 120→0
```
Each line needs an `overflow:hidden` mask (`.reveal-mask`) wrapping a
`.reveal-line`. Stagger 0.1–0.16. For "skip", call `tl.progress(1)`.

### Intro stagger (cards/buttons in)
```js
gsap.from(nodes, { y: 28, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 });
```

### 3D transform (fold / flip)
Parent needs `perspective` (px) and `transform-style: preserve-3d`; the moving
face needs `backface-visibility: hidden`. Animate `rotateX/rotateY` on the inner
element, keep `translateZ` static. See `.envelope__flap` and `.polaroid__inner`.
```js
gsap.to(flap, { rotateX: -180, duration: 1, ease: 'expo.inOut' });
```

### Cylinder dial (rotating digit drum)
Faces placed at `rotateX(i*36deg) translateZ(radius)`; rotate the *cylinder*
`rotateX(-value*36)` with `back.out(1.7)`. Compute `radius = h/2/tan(18°)` from
the **measured** height in `enter()` via `requestAnimationFrame` (DOM must be
laid out first). Pattern lives in `src/scenes/lock.js`.

### Magnetic button + custom cursor
Add `data-magnetic` to the element; `bindMagnetic()` runs on scene mount. The
cursor (`src/core/cursor.js`) auto-grows near `a, button, .btn, [data-magnetic]`
and other interactive selectors — extend that selector list rather than writing
new cursor logic. Both no-op on touch / reduced motion.

### Ambient particles
`const p = ctx.particles(el, { count, color, speed });` in `enter()`, then
`p.destroy()` in `destroy()`. Canvas-based, DPR-capped, pauses on hidden tab,
static field under reduced motion. Lower `count` on `innerWidth < 600`.

### Confetti burst (finale)
Radial velocity + gravity on a `<canvas>`, one rAF loop that self-stops when all
pieces die. Fire on a timeline beat (`tl.add(burst, 0.4)`), optionally twice for
a "swell". Reuse the implementation in `src/scenes/finale.js`.

### Scroll-linked (only if a scene actually scrolls)
Lenis is wired to GSAP's ticker in `main.js`; `ScrollTrigger.update` is bound to
Lenis scroll. Use `scrollTrigger: { trigger, start, end, scrub: true }` and kill
the trigger in `destroy()`. Most scenes here are full-screen and don't scroll —
don't add ScrollTrigger unless content overflows.

### Pointer parallax / tilt (desktop only)
Guard with `!isTouch && !reducedMotion`. Map pointer offset from center to small
`rotateX/rotateY` (±8–12°) on an inner layer with `power3.out`, and reset to 0 on
`mouseleave`. See the gallery's active-card tilt.

## Timing feel
- Entrances: 0.8–1.2s. Micro-interactions: 0.3–0.6s. Scene transitions: ~0.9s.
- Overlap, don't queue: use negative position offsets (`'-=0.6'`) so beats breathe.
- Idle/ambient loops: 2–4s, `sine.inOut`, `yoyo`, subtle amplitude (≤8px / ≤6%).

## Self-check before finishing
- [ ] Only transform/opacity animated? No layout-thrashing properties.
- [ ] Every ease is a token (no linear)?
- [ ] `reducedMotion` branch gives a calm, complete experience?
- [ ] Looping tweens / ScrollTriggers killed in `destroy()`?
- [ ] Reads/holds at 360px wide; particle + parallax magnitude scaled down?
- [ ] Sound (if any) fired on the motion beat via `ctx.sfx()`?
- [ ] Reused existing helpers (textReveal, particles, magnetic, cursor) instead
      of duplicating?
