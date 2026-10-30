import { $, $$ } from './util.js';
import { whenNear } from './ui.js';

/**
 * Bucles de cuentas y opiniones, movidos desde JS (las cifras van solo con CSS):
 * - Quietos hasta que la sección se ve: así se ven primero las cuentas con más
 *   seguidores y la primera opinión.
 * - Se arrastran con el dedo o con el ratón (con algo de inercia) y la rueda
 *   horizontal del trackpad también los mueve. Al tocarlos se paran y vuelven a
 *   moverse solos 5 s después de la última interacción.
 * - Con el ratón encima, con el foco dentro o con una opinión abierta, quietos.
 * - Con "reducir movimiento" no se mueven solos: el CSS deja una fila que se
 *   desliza con el dedo.
 */
const RESUME_MS = 5000;

export function initLoops() {
  const loops = $$('.mq-pause');
  for (const loop of loops) {
    // Las imágenes recortadas por el bucle no cuentan como "cerca de la pantalla"
    // para la carga diferida de Chrome: se piden todas al acercarse a la sección.
    whenNear(loop, () => $$('img[loading="lazy"]', loop).forEach((img) => { img.loading = 'eager'; }));
  }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  loops.forEach(runLoop);
}

function runLoop(loop) {
  const tracks = $$('.mq-track', loop);
  const dir = loop.classList.contains('mq-rev') ? 1 : -1; // 1: hacia la derecha
  const speed = Number(loop.dataset.speed) || 40; // px por segundo
  let width = 0; // ancho de una copia: el bucle se repite cada `width` px
  let x = 0;
  let placed = false;
  let started = false;
  let visible = false;
  let hovered = false;
  let holdUntil = 0;
  let velocity = 0; // inercia al soltar, en px/ms
  let drag = null;
  let suppressClick = false;
  let raf = 0;
  let last = 0;

  loop.classList.add('is-js');
  const wrap = () => {
    if (width) x = (((x % width) + width) % width) - width; // siempre en [-width, 0)
  };
  const apply = () => {
    const t = `translate3d(${x.toFixed(2)}px,0,0)`;
    for (const track of tracks) track.style.transform = t;
  };
  // Primera tarjeta (en el orden del HTML) a la altura del margen de la página.
  const place = () => {
    width = tracks[0].getBoundingClientRect().width;
    if (!width) return;
    const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 20;
    const first = tracks[0].firstElementChild;
    const left = first.getBoundingClientRect().left - tracks[0].getBoundingClientRect().left;
    x = gutter - left;
    wrap();
    apply();
    placed = true;
  };
  const hold = (ms = RESUME_MS) => { holdUntil = performance.now() + ms; };
  const paused = () => hovered || drag || loop.matches(':focus-within') || loop.classList.contains('is-reading') || performance.now() < holdUntil;

  const frame = (t) => {
    raf = visible ? requestAnimationFrame(frame) : 0;
    const dt = Math.min(64, t - (last || t));
    last = t;
    if (drag) return;
    if (Math.abs(velocity) > 0.02) {
      x += velocity * dt;
      velocity *= 0.9 ** (dt / 16); // se frena en menos de un segundo
    } else if (started && !paused()) {
      x += (dir * speed * dt) / 1000;
    } else {
      return;
    }
    wrap();
    apply();
  };
  const run = () => {
    if (!raf && visible) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  place();
  // Al cargar main.css (o girar el móvil) cambian las medidas: mientras no haya
  // arrancado se recoloca al principio; después solo se ajusta el bucle.
  new ResizeObserver(() => {
    if (!started || !placed) place();
    else {
      width = tracks[0].getBoundingClientRect().width;
      wrap();
      apply();
    }
  }).observe(tracks[0]);

  // Arranca cuando se ve más de la mitad del bucle (y un momento después).
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !started && e.intersectionRatio >= 0.5) {
      started = true;
      hold(900);
    }
    if (visible) run();
  }, { threshold: [0, 0.5] }).observe(loop);

  // Ratón encima: quieto (solo con ratón; en el móvil el "hover" se queda pegado).
  loop.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovered = true; });
  loop.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hovered = false; });

  // Arrastrar: el desplazamiento vertical de la página sigue siendo del navegador
  // (touch-action: pan-y); el horizontal mueve el bucle.
  loop.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    velocity = 0;
    hold(Infinity);
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, from: x, axis: '', lastX: e.clientX, lastT: e.timeStamp, v: 0 };
  });
  loop.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    if (!drag.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      drag.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      if (drag.axis === 'x') {
        try { loop.setPointerCapture(e.pointerId); } catch {}
        loop.classList.add('is-dragging');
      }
    }
    if (drag.axis !== 'x') return;
    const dt = e.timeStamp - drag.lastT;
    if (dt > 0) drag.v = 0.8 * ((e.clientX - drag.lastX) / dt) + 0.2 * drag.v;
    drag.lastX = e.clientX;
    drag.lastT = e.timeStamp;
    x = drag.from + dx;
    wrap();
    apply();
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.axis === 'x') {
      suppressClick = true; // soltar tras arrastrar no es un clic
      setTimeout(() => { suppressClick = false; }, 0);
      velocity = Math.max(-1.5, Math.min(1.5, drag.v));
    }
    loop.classList.remove('is-dragging');
    drag = null;
    hold();
    run();
  };
  loop.addEventListener('pointerup', end);
  loop.addEventListener('pointercancel', end);
  loop.addEventListener('click', (e) => {
    if (!suppressClick) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  loop.addEventListener('dragstart', (e) => e.preventDefault());

  // Rueda o trackpad en horizontal.
  loop.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    velocity = 0;
    x -= e.deltaX;
    wrap();
    apply();
    hold();
  }, { passive: false });

  // Al cerrar una opinión abierta, 5 s de pausa antes de seguir.
  loop.addEventListener('loop:hold', () => hold());
}

/**
 * Opiniones: todas las tarjetas miden lo mismo. Las largas se recortan con
 * "Leer más", que abre la opinión entera en una ventana. Si un texto cabe
 * entero, el botón se oculta sin perder su hueco. Sin JS se lee completo.
 */
export function initTestimonials() {
  const cards = $$('.tcard[data-long]');
  const dialog = $('#tdialog');
  for (const card of cards) $('[data-more]', card).hidden = false;
  cards.forEach((card) => card.classList.add('is-clamped'));
  whenNear($('.loop-reviews') || document.body, () => requestAnimationFrame(() => {
    for (const card of cards) {
      const quote = $('blockquote', card);
      if (quote.scrollHeight <= quote.clientHeight + 2) $('[data-more]', card).style.visibility = 'hidden';
    }
  }));
  if (!dialog || typeof dialog.showModal !== 'function') {
    // Navegador sin <dialog>: el texto se abre en la propia tarjeta.
    document.addEventListener('click', (e) => {
      const card = e.target.closest('[data-more]')?.closest('.tcard');
      if (!card) return;
      card.classList.remove('is-clamped');
      $('[data-more]', card).hidden = true;
    });
    return;
  }
  let loop = null;
  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-more]')?.closest('.tcard');
    if (!card) return;
    loop = card.closest('.mq-pause');
    $('[data-quote]', dialog).textContent = $('blockquote', card).textContent;
    $('[data-name]', dialog).textContent = $('figcaption b', card).textContent;
    $('[data-role]', dialog).textContent = $('figcaption span span', card).textContent;
    loop?.classList.add('is-reading');
    dialog.showModal();
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
  });
  dialog.addEventListener('close', () => {
    loop?.classList.remove('is-reading');
    loop?.dispatchEvent(new Event('loop:hold'));
    loop = null;
  });
}
