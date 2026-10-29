import { $, $$ } from './util.js';
import { whenNear } from './ui.js';

/** Flechas de los carruseles (solo escritorio; en móvil se desliza con el dedo). */
export function initCarousels() {
  $$('[data-carousel-nav]').forEach((nav) => {
    const track = $(`[data-carousel="${nav.dataset.carouselNav}"]`);
    if (!track) return;
    const [prev, next] = $$('button', nav);
    let frame = 0;
    const update = () => {
      frame = 0;
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      track.scrollBy({ left: Number(btn.dataset.dir) * track.clientWidth * 0.9, behavior: 'smooth' });
    });
    track.addEventListener('scroll', () => {
      if (!frame) frame = requestAnimationFrame(update);
    }, { passive: true });
    whenNear(track, () => requestAnimationFrame(update));
  });
}

/** Vídeos: solo el póster al cargar; el vídeo se descarga y suena al pulsar. */
export function initVideos() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-video]');
    if (!btn) return;
    $$('video[data-playing]').forEach((v) => v.pause());
    const video = document.createElement('video');
    video.src = btn.dataset.video;
    video.controls = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.preload = 'auto';
    video.dataset.playing = '';
    video.setAttribute('aria-label', btn.getAttribute('aria-label').replace('Reproducir vídeo: ', ''));
    btn.replaceWith(video);
    video.play().catch(() => {});
    video.addEventListener('play', () => {
      $$('video[data-playing]').forEach((v) => v !== video && v.pause());
    });
  });
}

/** Testimonios largos: recortados con "Leer más". */
export function initTestimonials() {
  $$('.tcard.is-clamped').forEach((card) => {
    const quote = $('blockquote', card);
    const btn = $('[data-more]', card);
    if (!btn) return;
    const check = () => {
      if (card.classList.contains('is-clamped')) btn.hidden = quote.scrollHeight <= quote.clientHeight + 2;
    };
    btn.addEventListener('click', () => {
      card.classList.remove('is-clamped');
      btn.hidden = true;
    });
    // Se mide al acercarse (main.css ya está aplicado) y no al cargar.
    whenNear(card, () => requestAnimationFrame(check));
  });
}
