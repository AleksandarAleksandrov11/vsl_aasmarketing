// Eventos de Meta: PageView, ViewContent, Lead y Contact. Ninguno más.
// Cada evento lleva un event_id único que se usa igual en el navegador
// (píxel) y en el servidor (API de conversiones) para que Meta deduplique.
// El servidor recibe el evento acepten o no las cookies, salvo que el visitante
// se haya opuesto a esa medición; el píxel, solo con consentimiento de marketing.

import { getAttribution } from './attribution.js';
import { hasMarketing, hasOptedOut, onConsentChange } from './consent.js';
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
    optout: hasOptedOut(),
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
  const server = !hasOptedOut(); // quien se ha opuesto no manda nada por servidor
  if (replay) fired.push({ name, id, params, server });
  pixelTrack(name, params, id);
  if (server) sendServer(payload(name, id), beacon);
  return id;
}

// Si aceptan las cookies más tarde: el píxel manda PageView (y ViewContent si
// ya ocurrió) con el MISMO event_id que el servidor. Nunca dos PageView distintos.
export function initTracking() {
  onConsentChange((state, before) => {
    const granted = state.marketing && !before.marketing;
    for (const e of fired) {
      if (granted) pixelTrack(e.name, e.params, e.id);
      if (state.optout) continue;
      // Si no salió por servidor (se había opuesto), sale ahora. Si salió, al
      // aceptar se avisa al servidor, que solo lo repite con CAPI_WITHOUT_CONSENT=false.
      if (!e.server) sendServer(payload(e.name, e.id));
      else if (granted) sendServer(payload(e.name, e.id, { replay: true }));
      e.server = true;
    }
    // Cualquier decisión sin marketing borra _fbp y _fbc (también las que
    // quedaran de una decisión anterior). Se puede llamar varias veces.
    if (!state.marketing) revokePixel();
  });
}
