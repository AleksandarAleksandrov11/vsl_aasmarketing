// POST /api/event: PageView, ViewContent y Contact a la API de conversiones.
// (El Lead se envía desde /api/lead.) Llega por fetch keepalive o sendBeacon.

import { readJson, json, clientIp, sameOrigin, envFlag } from '../lib/http.js';
import { sendEvent, capiAllowed, cleanEventId, cleanFbc, cleanFbp, sourceUrl } from '../lib/meta.js';

const EVENTS = new Set(['PageView', 'ViewContent', 'Contact']);
const CUSTOM = {
  ViewContent: { content_name: 'Formulario estrategia gratis' },
  Contact: { content_name: 'WhatsApp' },
};

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
    if (!sameOrigin(request)) return json({ ok: false, error: 'origin' }, 403);

    let p;
    try {
      p = await readJson(request, 4096);
    } catch (err) {
      return json({ ok: false, error: err.code || 'bad-request' }, err.status || 400);
    }

    const name = String(p.event_name || '');
    const id = cleanEventId(p.event_id);
    if (!EVENTS.has(name) || !id) return json({ ok: false, error: 'event' }, 400);

    // Repetición al aceptar las cookies: solo hace falta si al cargar no se mandó.
    if (p.replay === true && envFlag('CAPI_WITHOUT_CONSENT', true)) return json({ ok: true, sent: false, reason: 'already-sent' });
    if (!capiAllowed(p.consent === true, p.optout === true)) {
      return json({ ok: true, sent: false, reason: p.optout === true ? 'optout' : 'no-consent' });
    }

    const result = await sendEvent({
      name,
      id,
      time: Math.floor(Date.now() / 1000),
      url: sourceUrl(p.event_source_url, request),
      ip: clientIp(request),
      ua: request.headers.get('user-agent'),
      fbc: cleanFbc(p.fbc),
      fbp: cleanFbp(p.fbp),
      customData: CUSTOM[name],
    });
    return json({ ok: true, sent: result.sent });
  },
};
