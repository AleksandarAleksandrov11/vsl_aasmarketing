export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** UUID v4 (crypto.randomUUID no existe en iOS anteriores a 15.4). */
export function uuid() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// localStorage / sessionStorage pueden fallar (modo privado, almacenamiento
// bloqueado): todo va envuelto en try/catch y la página funciona sin ellos.
const store = (kind) => ({
  get(key) {
    try {
      const v = window[kind].getItem(key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window[kind].setItem(key, JSON.stringify(value));
    } catch {}
  },
  del(key) {
    try {
      window[kind].removeItem(key);
    } catch {}
  },
});

export const session = store('sessionStorage');
export const local = store('localStorage');

export function readCookie(name) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : '';
}

// Identificadores de clic de los anuncios (Meta, Google, TikTok, Microsoft).
const CLICK_IDS = ['fbclid', 'gclid', 'gbraid', 'wbraid', 'ttclid', 'msclkid'];

/** La dirección sin los identificadores de clic (los utm se quedan). */
export function withoutClickIds(url) {
  try {
    const u = new URL(url, location.href);
    CLICK_IDS.forEach((k) => u.searchParams.delete(k));
    return u.href;
  } catch {
    return url;
  }
}

/** Solo origen y ruta, sin parámetros. */
export function pageOnly(url) {
  try {
    const u = new URL(url, location.href);
    return u.origin + u.pathname;
  } catch {
    return '';
  }
}

/** Dominio para las cookies _fbp/_fbc: el principal si estamos en aasmarketing.com. */
export function cookieDomain() {
  return /(^|\.)aasmarketing\.com$/.test(location.hostname) ? '; domain=.aasmarketing.com' : '';
}
