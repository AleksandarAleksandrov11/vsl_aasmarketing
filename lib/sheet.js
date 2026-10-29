// Guarda la solicitud en Google Sheets a través del Apps Script
// (apps-script/Code.gs). Hasta 3 reintentos (0,5 s, 1 s y 2 s) con 4 s de
// límite por intento. El Apps Script además envía el correo.

import { sleep } from './http.js';

const WAITS = [0, 500, 1000, 2000];
const TIMEOUT = 4000;

export async function saveToSheet(lead, dedupe) {
  const url = String(process.env.SHEET_WEBHOOK_URL || '').trim();
  const secret = String(process.env.SHEET_SECRET || '').trim();
  if (!url || !secret) {
    console.warn('[sheet] Falta SHEET_WEBHOOK_URL o SHEET_SECRET en Vercel: la solicitud no se guarda en el Sheet.');
    return { saved: false, reason: 'not-configured' };
  }
  const body = JSON.stringify({ secret, dedupe, lead });
  let last = '';
  for (let i = 0; i < WAITS.length; i++) {
    if (WAITS[i]) await sleep(WAITS[i]);
    try {
      // Apps Script responde con una redirección 302: fetch la sigue y lee el JSON.
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT),
      });
      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {}
      if (res.ok && data?.ok === true) return { saved: true, attempts: i + 1, duplicate: !!data.duplicate };
      if (data?.error === 'secret') {
        console.error('[sheet] El Apps Script rechaza la clave: SHEET_SECRET debe ser igual en Vercel y en las propiedades del script.');
        return { saved: false, reason: 'secret' };
      }
      if (/<html|accounts\.google\.com/i.test(text)) {
        console.error('[sheet] El Apps Script devuelve una página HTML: revisa que la implementación sea "Aplicación web" con acceso "Cualquier usuario".');
        return { saved: false, reason: 'html' };
      }
      last = `HTTP ${res.status} ${data ? JSON.stringify(data) : text.slice(0, 160)}`;
    } catch (err) {
      last = `${err.name}: ${err.message}`;
    }
    console.warn(`[sheet] Intento ${i + 1} de ${WAITS.length} fallido: ${last}`);
  }
  return { saved: false, reason: last };
}
