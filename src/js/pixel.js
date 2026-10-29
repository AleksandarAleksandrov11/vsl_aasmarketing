// Píxel de Meta en el navegador: es un extra que solo se carga con el
// consentimiento de marketing (es lo que crea cookies). El ID llega en
// <meta name="aas-pixel">, que el build rellena con META_PIXEL_ID de Vercel.

import { $, readCookie, cookieDomain } from './util.js';
import { getAttribution } from './attribution.js';
import { hasMarketing } from './consent.js';

const meta = $('meta[name="aas-pixel"]');
export const PIXEL_ID = meta ? meta.content.trim() : '';
let loaded = false;
let revoked = false;

// Mismo fbp/fbc en navegador y servidor: si aún no existen las cookies, se
// crean con los valores que ya se están mandando por la API de conversiones.
function seedCookies() {
  const a = getAttribution();
  const tail = `; max-age=7776000; path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}${cookieDomain()}`;
  if (a.fbp && !readCookie('_fbp')) document.cookie = `_fbp=${a.fbp}${tail}`;
  if (a.fbc && !readCookie('_fbc')) document.cookie = `_fbc=${a.fbc}${tail}`;
}

function inject() {
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
}

export function loadPixel() {
  if (loaded || !PIXEL_ID) return;
  loaded = true;
  seedCookies();
  // Cola estándar de fbq: los eventos esperan hasta que llega fbevents.js.
  const n = (window.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  });
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];
  // Sin eventos automáticos (clics, metadatos): solo los cuatro que mandamos.
  window.fbq('set', 'autoConfig', false, PIXEL_ID);
  window.fbq('init', PIXEL_ID);
  // El script de Meta va después del contenido para no frenar la carga.
  if (document.readyState === 'complete') inject();
  else window.addEventListener('load', inject, { once: true });
}

export function pixelTrack(name, params, eventID) {
  if (!PIXEL_ID || !hasMarketing()) return;
  loadPixel();
  if (revoked) {
    window.fbq('consent', 'grant');
    revoked = false;
  }
  window.fbq('track', name, params || {}, { eventID });
}

export function revokePixel() {
  if (loaded && window.fbq) {
    window.fbq('consent', 'revoke');
    revoked = true;
  }
  const gone = `=; max-age=0; path=/${cookieDomain()}`;
  document.cookie = `_fbp${gone}`;
  document.cookie = `_fbc${gone}`;
}
