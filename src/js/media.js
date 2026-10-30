import { $, $$ } from './util.js';
import { whenNear } from './ui.js';

/**
 * Bucles de cuentas y opiniones: se paran mientras se tocan y siguen 3 s
 * después de soltar (el ratón y el foco los para el CSS). Al abrir "Leer más"
 * se quedan quietos hasta que la sección sale de la pantalla.
 */
export function initLoops() {
  $$('.mq-pause').forEach((loop) => {
    // Las imágenes recortadas por el bucle no cuentan como "cerca de la pantalla"
    // para la carga diferida de Chrome: se piden todas al acercarse a la sección.
    whenNear(loop, () => $$('img[loading="lazy"]', loop).forEach((img) => { img.loading = 'eager'; }));
    let timer = 0;
    const hold = (e) => {
      if (e.pointerType === 'mouse') return;
      clearTimeout(timer);
      loop.classList.add('is-held');
    };
    const release = () => {
      clearTimeout(timer);
      timer = setTimeout(() => loop.classList.remove('is-held'), 3000);
    };
    loop.addEventListener('pointerdown', hold, { passive: true });
    loop.addEventListener('pointerup', release, { passive: true });
    loop.addEventListener('pointercancel', release, { passive: true });
    loop.addEventListener('click', (e) => {
      if (e.target.closest('[data-more]')) loop.classList.add('is-reading');
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) loop.classList.remove('is-reading');
      }).observe(loop);
    }
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
  whenNear($('.loop-reviews') || document.body, () => requestAnimationFrame(() => {
    for (const card of cards) {
      const quote = $('blockquote', card);
      if (quote.scrollHeight <= quote.clientHeight + 2) $('[data-more]', card).style.visibility = 'hidden';
    }
  }));
}
