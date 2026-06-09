/* =============================================================================
 * GATE — the opening overlay (letter4u style).
 * Offers fullscreen ("бүтэн дэлгэц") + a sound opt-in, since browsers block
 * autoplay. Resolves once the user chooses, starting music if they opted in.
 * ========================================================================== */

import gsap from 'gsap';
import { startMusic } from './audio.js';
import { reducedMotion } from './env.js';
import { bindMagnetic } from './magnetic.js';

export function showGate() {
  return new Promise((resolve) => {
    const gate = document.createElement('div');
    gate.className = 'gate';
    gate.innerHTML = `
      <div class="gate__heart">💌</div>
      <h1 class="gate__title">Чамд зориулсан захидал</h1>
      <p class="gate__sub">
        Хамгийн сайхан мэдрэмжийг авахын тулд бүтэн дэлгэцээр,
        чимээтэйгээр нээнэ үү.
      </p>
      <div class="btn-row">
        <button class="btn" data-magnetic data-action="sound">
          🎵 Хөгжимтэйгээр үргэлжлүүлэх
        </button>
        <button class="btn btn--ghost" data-magnetic data-action="silent">
          Чимээгүйгээр нээх
        </button>
      </div>
    `;
    document.body.appendChild(gate);
    bindMagnetic(gate);

    // Intro pop-in
    if (!reducedMotion) {
      gsap.from(gate.children, {
        y: 26,
        autoAlpha: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.1,
        delay: 0.15,
      });
    }

    async function requestFullscreen() {
      const el = document.documentElement;
      try {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      } catch {
        /* user/browser declined — fine, continue anyway */
      }
    }

    function close(withSound) {
      if (withSound) startMusic();
      requestFullscreen();
      gsap.to(gate, {
        autoAlpha: 0,
        duration: reducedMotion ? 0.001 : 0.7,
        ease: 'expo.inOut',
        onComplete: () => {
          gate.remove();
          resolve();
        },
      });
    }

    gate.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      close(btn.dataset.action === 'sound');
    });
  });
}

/* Persistent mute/unmute toggle, mounted once for the whole experience. */
import { toggleMute, isMuted } from './audio.js';

export function mountAudioToggle() {
  const btn = document.createElement('button');
  btn.className = 'audio-toggle';
  btn.setAttribute('aria-label', 'Хөгжим асаах/унтраах');
  btn.innerHTML = soundIcon(false);
  btn.addEventListener('click', () => {
    const muted = toggleMute();
    btn.innerHTML = soundIcon(muted);
  });
  document.body.appendChild(btn);
  return btn;
}

function soundIcon(muted) {
  return muted ? '🔇' : '🔊';
}
