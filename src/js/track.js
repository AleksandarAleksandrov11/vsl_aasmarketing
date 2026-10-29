// Eventos de Meta: PageView, ViewContent, Lead y Contact. Ninguno más.
// Cada evento lleva un event_id único que se usa igual en el navegador
// (píxel) y en el servidor (API de conversiones) para que Meta deduplique.
// El servidor recibe siempre el evento; el píxel solo si hay consentimiento.

import { getAttribution } from './attribution.js';
import { hasMarketing, onConsentChange } from './consent.js';
import { PIXEL_ID, pixelTrack, revokePixel } from './pixel.js';
import { uuid } from './util.js';

const fired = []; // eventos de esta página que se repiten en el navegador si aceptan después

function payload(name, id, extra) {
  const a = getAttribution();
  return {
    event_name: name,
    event_id: id,
    event_source_url: location.href,
    fbc: a.fbc || '',
    fbp: a.fbp || '',
    consent: hasMarketing(),
    ...extra,
  };
}

export function sendServer(body, beacon = false) {
  if (!PIXEL_ID) return; // sin píxel configurado no hay nada que mandar a Meta
  const data = JSON.stringify(body);
  // sendBeacon sobrevive a la salida hacia WhatsApp; fetch keepalive como respaldo.
  if (beacon && navigator.sendBeacon) {
    try {
      if (navigator.sendBeacon('/api/event', data)) return;
    } catch {}
  }
  fetch('/api/event', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: data, keepalive: true }).catch(() => {});
}

export function track(name, { params, beacon = false, replay = false } = {}) {
  const id = uuid();
  if (replay) fired.push({ name, id, params });
  pixelTrack(name, params, id);
  sendServer(payload(name, id), beacon);
  return id;
}

// Si aceptan las cookies más tarde: el píxel manda PageView (y ViewContent si
// ya ocurrió) con el MISMO event_id que el servidor. Nunca dos PageView distintos.
export function initTracking() {
  onConsentChange((marketing, before) => {
    if (marketing && !before) {
      for (const e of fired) {
        pixelTrack(e.name, e.params, e.id);
        sendServer(payload(e.name, e.id, { replay: true }));
      }
    } else if (!marketing && before) {
      revokePixel();
    }
  });
}
