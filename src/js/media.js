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

/**
 * Cifras en bucle: el botón las para y las vuelve a mover (se mueven más de 5 s
 * junto a otro contenido, WCAG 2.2.2). Sin JS se mueven y el botón no aparece.
 */
export function initMarquee() {
  const band = $('[data-marquee]');
  const btn = band && $('[data-marquee-toggle]', band);
  if (!btn) return;
  btn.hidden = false;
  btn.addEventListener('click', () => {
    btn.setAttribute('aria-pressed', String(band.classList.toggle('is-paused')));
  });
}

/**
 * Testimonios largos: recortados con "Leer más". Se recortan al arrancar (la
 * sección aún está fuera de pantalla, así nada se mueve después) y, si un texto
 * cabe entero, el botón se oculta sin perder su hueco. Sin JS se lee completo.
 */
export function initTestimonials() {
  const cards = $$('.tcard[data-long]');
  for (const card of cards) {
    const btn = $('[data-more]', card);
    card.classList.add('is-clamped');
    btn.hidden = false;
    btn.addEventListener('click', () => {
      card.classList.remove('is-clamped');
      btn.hidden = true;
    });
  }
  whenNear($('.tcards') || document.body, () => requestAnimationFrame(() => {
    for (const card of cards) {
      const quote = $('blockquote', card);
      if (quote.scrollHeight <= quote.clientHeight + 2) $('[data-more]', card).style.visibility = 'hidden';
    }
  }));
}
