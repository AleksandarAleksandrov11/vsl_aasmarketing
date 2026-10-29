// Consentimiento de cookies: dos categorías, necesarias (siempre) y marketing
// (Meta Pixel). La decisión se guarda en localStorage. El banner es una capa
// fija: no empuja la página y sube por encima del CTA fijo del móvil.

import { $, local } from './util.js';

const KEY = 'aas_consent';
const VERSION = 1;
const listeners = new Set();
let state = read();

function read() {
  const v = local.get(KEY);
  return v && v.v === VERSION ? v : null;
}

export const hasDecision = () => !!state;
export const hasMarketing = () => !!state?.marketing;
export const onConsentChange = (fn) => listeners.add(fn);

export function setConsent(marketing) {
  const before = hasMarketing();
  state = { v: VERSION, marketing: !!marketing, ts: Date.now() };
  local.set(KEY, state);
  listeners.forEach((fn) => fn(state.marketing, before));
}

export function initConsent() {
  const box = $('#ck');
  if (!box) return;
  const panel = $('#ck-panel', box);
  const toggle = $('#ck-mkt', box);
  const configBtn = $('[data-ck="config"]', box);

  const open = (withPanel) => {
    box.hidden = false;
    panel.hidden = !withPanel;
    toggle.checked = hasMarketing();
    configBtn.textContent = withPanel ? 'Guardar' : 'Configurar';
    configBtn.dataset.ck = withPanel ? 'save' : 'config';
    configBtn.setAttribute('aria-expanded', String(withPanel));
  };
  const close = () => {
    box.hidden = true;
  };

  box.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ck]');
    if (!btn) return;
    const action = btn.dataset.ck;
    if (action === 'accept') setConsent(true);
    else if (action === 'reject') setConsent(false);
    else if (action === 'save') setConsent(toggle.checked);
    else if (action === 'config') {
      open(true);
      toggle.focus();
      return;
    }
    close();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-open-cookies]')) return;
    open(true);
    toggle.focus();
  });

  // Primer pantallazo limpio: el banner sale al primer scroll o a los 3 s.
  // Hasta que decidan no se instala ninguna cookie, así que esperar no cambia nada.
  if (!hasDecision()) {
    let timer = 0;
    const show = () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', show);
      if (!hasDecision() && box.hidden) open(false);
    };
    timer = setTimeout(show, 3000);
    window.addEventListener('scroll', show, { passive: true, once: true });
  }
}
