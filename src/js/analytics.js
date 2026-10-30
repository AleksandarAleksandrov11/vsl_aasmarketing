// Vercel Web Analytics y Speed Insights: solo con el consentimiento de analítica.
// Scripts del propio dominio (/_vercel/insights y /_vercel/speed-insights), sin
// cookies. El build añade <meta name="aas-analytics" content="1"> salvo que
// VERCEL_ANALYTICS=false.

import { $ } from './util.js';
import { hasAnalytics, onConsentChange } from './consent.js';

const ENABLED = $('meta[name="aas-analytics"]')?.content === '1';
// Identificadores de clic de anuncios: no se mandan a Vercel (sí los utm).
const CLICK_IDS = ['fbclid', 'gclid', 'gbraid', 'wbraid', 'ttclid', 'msclkid'];
let loaded = false;

function stripClickIds(url) {
  try {
    const u = new URL(url, location.href);
    CLICK_IDS.forEach((k) => u.searchParams.delete(k));
    return u.href;
  } catch {
    return url;
  }
}

// Vercel llama a beforeSend antes de cada envío: si se retira la analítica con la
// página abierta, devolver null descarta el evento (los scripts ya cargados no se
// pueden quitar, pero dejan de enviar desde ese momento).
const clean = (event) => {
  if (!hasAnalytics()) return null;
  return event && typeof event.url === 'string' ? { ...event, url: stripClickIds(event.url) } : event;
};

function inject(src) {
  const s = document.createElement('script');
  s.src = src;
  s.defer = true;
  document.head.appendChild(s);
}

function load() {
  if (loaded || !ENABLED || !hasAnalytics()) return;
  loaded = true;
  // Colas oficiales de Vercel para HTML: los scripts las leen al cargar.
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
  window.va('beforeSend', clean);
  window.si('beforeSend', clean);
  const go = () => {
    inject('/_vercel/insights/script.js');
    inject('/_vercel/speed-insights/script.js');
  };
  // Después del contenido, como el píxel, para no frenar la carga.
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });
}

export function initAnalytics() {
  load();
  onConsentChange((state) => {
    if (state.analytics) load();
  });
}
