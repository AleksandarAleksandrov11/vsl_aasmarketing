import { $ } from './util.js';

/** Aplica main.css (precargado en el <head>) sin bloquear el primer pintado. */
export function loadDeferredCss() {
  const pre = $('link[rel="preload"][as="style"]');
  if (!pre || $(`link[rel="stylesheet"][href="${pre.getAttribute('href')}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = pre.getAttribute('href');
  document.head.appendChild(link);
}

/**
 * Header blanco con desenfoque y borde fino en cuanto hay scroll. Se observa un
 * centinela de 8 px arriba del todo (leer scrollY al cargar forzaría un reflow).
 */
export function initHeader() {
  const hdr = $('[data-header]');
  const sentinel = $('[data-top]');
  if (!hdr || !sentinel || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => hdr.classList.toggle('is-scrolled', !e.isIntersecting)).observe(sentinel);
}

/** Ejecuta `fn` una vez, cuando el elemento se acerca a la pantalla. */
export function whenNear(el, fn) {
  if (!('IntersectionObserver' in window)) return fn();
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    fn();
  }, { rootMargin: '400px 0px' });
  io.observe(el);
}

/**
 * CTA fijo en móvil: aparece cuando el CTA del hero sale de pantalla y se
 * oculta cuando el formulario es visible. En escritorio lo oculta el CSS.
 */
export function initSticky() {
  const bar = $('[data-sticky]');
  const heroCta = $('[data-hero-cta]');
  const form = $('#formulario');
  if (!bar || !heroCta || !form || !('IntersectionObserver' in window)) return;
  const link = $('a', bar);
  let heroVisible = true;
  let formVisible = false;
  const update = () => {
    const show = !heroVisible && !formVisible;
    document.documentElement.classList.toggle('has-sticky', show);
    bar.setAttribute('aria-hidden', String(!show));
    link.tabIndex = show ? 0 : -1;
  };
  new IntersectionObserver(([e]) => {
    // Solo cuenta como "salido" si ha quedado por encima (no por debajo al cargar).
    heroVisible = e.isIntersecting || e.boundingClientRect.top > 0;
    update();
  }).observe(heroCta);
  new IntersectionObserver(([e]) => {
    formVisible = e.isIntersecting;
    update();
  }, { rootMargin: '0px 0px -15% 0px' }).observe(form);
}
