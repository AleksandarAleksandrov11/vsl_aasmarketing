// Formulario de 5 preguntas, una por pantalla.
// "Guarda primero, avisa después": el envío se guarda en localStorage antes de
// mandarlo; pase lo que pase (ok, error o 6 s sin respuesta) se muestra la
// pantalla de éxito y a los 1,5 s se abre WhatsApp con las respuestas.

import { $, $$, uuid, sleep, session, local } from './util.js';
import { servicioLabel, negocioLabel, clean } from '../../shared/options.js';
import { normalizePhone, detectCountry, PHONE_ERRORS, OTHER, COUNTRIES } from '../../shared/phone.js';
import { normalizeProfile } from '../../shared/profile.js';
import { getAttribution } from './attribution.js';
import { hasMarketing } from './consent.js';
import { pixelTrack } from './pixel.js';
import { track } from './track.js';

const WA_NUMBER = '34695850590';
const DRAFT = 'aas_form'; // sessionStorage: respuestas en curso
const DONE = 'aas_done'; // sessionStorage: pantalla de éxito al volver de WhatsApp
const PENDING = 'aas_pending'; // localStorage: envíos sin confirmar por el servidor
const TOTAL = 5;
const MIN_MS = 3000; // antispam: tiempo mínimo entre abrir el formulario y enviarlo
const WAIT_MS = 6000; // espera máxima de la respuesta de /api/lead
const REDIRECT_MS = 1500;

const ERR = {
  choose: 'Elige una opción para continuar.',
  otro: 'Cuéntame a qué te dedicas.',
  perfil: 'Escribe tu Instagram, tu TikTok o tu web.',
  nombre: 'Escribe tu nombre.',
};

export function waLink({ nombre, necesita, negocio, perfil }) {
  const text = [
    'Hola Aleks, acabo de pedir mi estrategia gratis desde la web.',
    `Nombre: ${nombre}`,
    `Necesito: ${necesita}`,
    `Negocio: ${negocio}`,
    `Perfil: ${perfil}`,
  ].join('\n');
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

// ---------- Envíos pendientes (red caída o página cerrada antes de la respuesta)

const pending = () => local.get(PENDING) || [];
const savePending = (list) => (list.length ? local.set(PENDING, list) : local.del(PENDING));
const dropPending = (id) => savePending(pending().filter((x) => x.p.event_id !== id));
let retryTimer = 0;

const inFlight = new Set();

async function postLead(payload) {
  inFlight.add(payload.event_id);
  try {
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    return res.status < 500; // 2xx/4xx: el servidor lo ha recibido (y lo deja en el log si no pudo guardarlo)
  } catch {
    return false;
  } finally {
    inFlight.delete(payload.event_id);
  }
}

async function flushPending() {
  const week = 7 * 24 * 3600 * 1000;
  savePending(pending().filter((x) => Date.now() - x.at < week && x.n < 20));
  for (const item of pending()) {
    if (inFlight.has(item.p.event_id)) continue;
    savePending(pending().map((x) => (x.p.event_id === item.p.event_id ? { ...x, n: x.n + 1 } : x)));
    if (await postLead(item.p)) dropPending(item.p.event_id);
  }
  if (pending().length) scheduleRetry();
}

function scheduleRetry(ms = 15000) {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(flushPending, ms);
}

// ---------- Formulario

export function initForm() {
  const card = $('[data-lead]');
  if (!card) return;
  const form = $('[data-form]', card);
  const done = $('[data-done]', card);
  const steps = $$('.lf-step', form);
  const back = $('[data-back]', form);
  const count = $('[data-count]', form);
  const bar = $('[data-bar]', form);
  const live = $('[data-live]', form);
  const other = $('[data-other]', form);
  const prefixLabel = $('[data-prefix-label]', form);
  const submitBtn = $('[data-submit]', form);
  const waBtn = $('[data-wa]', done);
  const el = form.elements;

  let step = 1;
  let t0 = 0;
  let submitting = false;
  let arrowKey = false;
  let advanceTimer = 0;
  let redirectTimer = 0;
  const touched = new Set();

  const val = (name) => (el[name] ? String(el[name].value || '') : '');
  const current = () => steps[step - 1];
  const markStart = () => {
    if (!t0) {
      t0 = Date.now();
      saveDraft();
    }
  };

  function saveDraft() {
    session.set(DRAFT, {
      step, t0,
      servicio: val('servicio'), sector: val('sector'), sector_otro: val('sector_otro'),
      perfil: val('perfil'), nombre: val('nombre'), prefijo: val('prefijo'), telefono: val('telefono'),
    });
  }

  function setError(input, message) {
    const box = document.getElementById(input.getAttribute('aria-describedby').split(' ').pop());
    box.textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  // Valida un paso. `show` decide si se pintan los errores.
  function validate(n, show = true) {
    if (n === 1) return !!val('servicio');
    if (n === 2) {
      if (!val('sector')) return false;
      if (val('sector') !== 'otro') return true;
      const ok = clean(val('sector_otro')).length >= 2;
      if (show) setError(el.sector_otro, ok ? '' : ERR.otro);
      return ok;
    }
    if (n === 3) {
      const ok = normalizeProfile(val('perfil')).ok;
      if (show) setError(el.perfil, ok ? '' : ERR.perfil);
      return ok;
    }
    if (n === 4) {
      const ok = clean(val('nombre')).length >= 2;
      if (show) setError(el.nombre, ok ? '' : ERR.nombre);
      return ok;
    }
    const r = normalizePhone(val('telefono'), val('prefijo'));
    if (show) setError(el.telefono, r.ok ? '' : PHONE_ERRORS[r.error]);
    return r.ok;
  }

  function focusStep() {
    const s = current();
    let target;
    if (step === 2 && val('sector') === 'otro') target = el.sector_otro;
    else if (step === 5) target = el.telefono;
    else target = $('input:checked', s) || $('input', s);
    target?.focus({ preventScroll: true });
    // Que la tarjeta quede a la vista bajo el header fijo.
    const top = card.getBoundingClientRect().top;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
    if (top < header) window.scrollBy({ top: top - header - 12, behavior: 'smooth' });
  }

  function go(n, focus = true) {
    step = n;
    for (const s of steps) {
      const on = Number(s.dataset.step) === n;
      s.hidden = !on;
      s.classList.remove('is-in');
      if (on && focus) {
        void s.offsetWidth; // reinicia la animación de entrada
        s.classList.add('is-in');
      }
    }
    back.hidden = n === 1;
    count.textContent = String(n);
    bar.style.setProperty('--p', String(n / TOTAL));
    saveDraft();
    if (!focus) return;
    live.textContent = `Paso ${n} de ${TOTAL}: ${$('.lf-q', current()).textContent}`;
    focusStep();
  }

  function next() {
    clearTimeout(advanceTimer);
    if (!validate(step)) {
      if (step === 1 || (step === 2 && !val('sector'))) {
        live.textContent = ERR.choose;
        return;
      }
      const input = step === 2 ? el.sector_otro : $('.lf-input', current());
      touched.add(input.name);
      input.focus();
      return;
    }
    if (step < TOTAL) go(step + 1);
  }

  function updatePrefix() {
    const iso = val('prefijo');
    const c = COUNTRIES.find((x) => x.iso === iso);
    prefixLabel.textContent = c ? `+${c.code}` : 'Otro';
    el.telefono.placeholder = iso === OTHER ? '+44 7911 123456' : iso === 'ES' ? '600 000 000' : 'Tu número';
  }

  // ---------- Eventos

  form.addEventListener('pointerdown', () => {
    arrowKey = false;
  });

  form.addEventListener('keydown', (e) => {
    arrowKey = e.key.startsWith('Arrow');
    if (e.key !== 'Enter') return;
    const tag = e.target.tagName;
    if (tag === 'BUTTON' || tag === 'A' || tag === 'SELECT') return;
    e.preventDefault();
    if (step === TOTAL) form.requestSubmit ? form.requestSubmit() : submit();
    else next();
  });

  form.addEventListener('change', (e) => {
    const t = e.target;
    markStart();
    if (t.name === 'servicio') {
      saveDraft();
      if (!arrowKey) advanceTimer = setTimeout(next, 220);
    } else if (t.name === 'sector') {
      const isOther = t.value === 'otro';
      other.hidden = !isOther;
      saveDraft();
      if (isOther) {
        if (!arrowKey) el.sector_otro.focus();
      } else if (!arrowKey) {
        advanceTimer = setTimeout(next, 220);
      }
    } else if (t.name === 'prefijo') {
      updatePrefix();
      if (touched.has('telefono')) validate(5);
      saveDraft();
    }
  });

  form.addEventListener('input', (e) => {
    const t = e.target;
    if (!t.classList.contains('lf-input')) return;
    markStart();
    if (touched.has(t.name)) validate(Number(t.closest('.lf-step').dataset.step));
    saveDraft();
  });

  form.addEventListener('focusout', (e) => {
    const t = e.target;
    if (t.classList?.contains('lf-input') && t.value.trim()) {
      touched.add(t.name);
      validate(Number(t.closest('.lf-step').dataset.step));
    }
  });

  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) {
      const input = $('.lf-input', current());
      if (input) touched.add(input.name);
      next();
    } else if (e.target.closest('[data-back]')) {
      clearTimeout(advanceTimer);
      if (step > 1) go(step - 1);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit();
  });

  // ---------- Envío

  async function submit() {
    if (submitting) return; // bloqueo del doble clic
    touched.add('telefono');
    for (let n = 1; n <= TOTAL; n++) {
      if (!validate(n)) {
        if (n !== step) go(n);
        else el.telefono.focus();
        return;
      }
    }
    submitting = true;
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    markStart();
    const elapsed = Date.now() - t0;
    if (elapsed < MIN_MS) await sleep(MIN_MS - elapsed);

    const a = getAttribution();
    const profile = normalizeProfile(val('perfil'));
    const answers = {
      nombre: clean(val('nombre'), 60),
      necesita: servicioLabel(val('servicio')),
      negocio: negocioLabel(val('sector'), val('sector_otro')),
      perfil: profile.display,
    };
    const payload = {
      event_id: uuid(),
      servicio: val('servicio'),
      sector: val('sector'),
      sector_otro: val('sector') === 'otro' ? clean(val('sector_otro'), 80) : '',
      perfil: val('perfil').trim(),
      nombre: answers.nombre,
      prefijo: val('prefijo'),
      telefono: val('telefono').trim(),
      hp: val('hp_check'),
      elapsed_ms: Date.now() - t0,
      consent: hasMarketing(),
      fbp: a.fbp || '',
      fbc: a.fbc || '',
      fbclid: a.fbclid || '',
      utm_source: a.utm_source || '',
      utm_medium: a.utm_medium || '',
      utm_campaign: a.utm_campaign || '',
      utm_content: a.utm_content || '',
      utm_term: a.utm_term || '',
      page_url: location.href,
      landing_at: a.landing_at || '',
      ts: Date.now(),
    };

    // 1. Lead en el navegador (solo con consentimiento), mismo event_id que el servidor.
    pixelTrack('Lead', { content_name: 'Estrategia gratis' }, payload.event_id);
    // 2. Guardar primero: si la red falla o se cierra la página, se reenvía después.
    savePending([...pending(), { p: payload, n: 1, at: Date.now() }]);
    // 3. Enviar y esperar como mucho 6 s. El Lead por servidor no depende del Sheet.
    const request = postLead(payload).then((ok) => {
      if (ok) dropPending(payload.event_id);
      else scheduleRetry();
    });
    await Promise.race([request, sleep(WAIT_MS)]);
    // 4. Pase lo que pase, pantalla de éxito.
    submitting = false;
    submitBtn.disabled = false;
    submitBtn.removeAttribute('aria-busy');
    showDone({ nombre: answers.nombre, wa: waLink(answers), contact: false }, true);
  }

  function contact() {
    const d = session.get(DONE);
    if (!d || d.contact) return;
    track('Contact', { beacon: true, params: { content_name: 'WhatsApp' } });
    session.set(DONE, { ...d, contact: true });
  }

  function showDone(info, redirect) {
    session.set(DONE, info);
    session.del(DRAFT);
    card.style.minHeight = `${card.offsetHeight}px`; // lo de debajo no se mueve
    form.hidden = true;
    done.hidden = false;
    $('[data-done-title]', done).textContent = `¡Listo, ${info.nombre}!`;
    $('[data-done-redirect]', done).hidden = !redirect;
    waBtn.href = info.wa;
    done.focus({ preventScroll: true });
    if (redirect) {
      // Al volver de WhatsApp, la página abre directamente en la confirmación.
      try {
        history.replaceState(null, '', '#formulario');
      } catch {}
      redirectTimer = setTimeout(() => {
        contact();
        window.location.href = info.wa; // window.open lo bloquea el navegador de Instagram
      }, REDIRECT_MS);
    }
  }

  waBtn.addEventListener('click', () => {
    clearTimeout(redirectTimer);
    contact();
  });

  $('[data-again]', done).addEventListener('click', () => {
    clearTimeout(redirectTimer); // si aún no se había abierto WhatsApp, ya no se abre
    session.del(DONE);
    form.reset();
    el.prefijo.value = detectCountry(navigator.languages || [navigator.language]);
    updatePrefix();
    other.hidden = true;
    for (const input of $$('.lf-input', form)) setError(input, '');
    touched.clear();
    t0 = Date.now();
    card.style.minHeight = '';
    done.hidden = true;
    form.hidden = false;
    go(1);
  });

  // ViewContent: la primera vez que el formulario entra en pantalla.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      markStart();
      track('ViewContent', { replay: true, params: { content_name: 'Formulario estrategia gratis' } });
    }, { threshold: 0.35 });
    io.observe(card);
  }

  // ---------- Estado inicial

  const saved = session.get(DONE);
  if (saved) {
    showDone(saved, false);
  } else {
    const d = session.get(DRAFT) || {};
    for (const name of ['sector_otro', 'perfil', 'nombre', 'telefono']) if (d[name]) el[name].value = d[name];
    for (const name of ['servicio', 'sector']) {
      const input = d[name] && $(`input[name="${name}"][value="${d[name]}"]`, form);
      if (input) input.checked = true;
    }
    other.hidden = val('sector') !== 'otro';
    el.prefijo.value = d.prefijo || detectCountry(navigator.languages || [navigator.language]);
    if (!el.prefijo.value) el.prefijo.value = 'ES';
    t0 = d.t0 || 0;
    let start = 1;
    while (start < Math.min(d.step || 1, TOTAL) && validate(start, false)) start++;
    updatePrefix();
    go(start, false);
  }

  window.addEventListener('online', flushPending);
  if (pending().length) setTimeout(flushPending, 2500);
}
