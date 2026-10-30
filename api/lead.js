// POST /api/lead: recibe el formulario.
// En paralelo y sin depender una cosa de otra:
//   a) Lead a la API de conversiones de Meta (mismo event_id que el navegador).
//   b) Guardado en Google Sheets (Apps Script) con reintentos.
//   c) Copia opcional en base de datos propia (desactivada por defecto).
// Responde {ok: true, saved}. Si el Sheet no ha podido guardarla, deja el lead
// completo en el log y responde 503 para que el navegador lo reintente.

import { createHash } from 'node:crypto';
import { readJson, json, clientIp, sameOrigin } from '../lib/http.js';
import { buildLead } from '../lib/lead.js';
import { sendEvent, capiAllowed, cleanEventId, cleanFbc, cleanFbp, sourceUrl, eventTime, leadUserData } from '../lib/meta.js';
import { saveToSheet } from '../lib/sheet.js';
import { saveToDb } from '../lib/db.js';

const MAX_BODY = 16 * 1024;
const MIN_MS = 3000;

const settle = (results) => results.map((r) => (r.status === 'fulfilled' ? r.value : { error: String(r.reason) }));

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

    let p;
    try {
      p = await readJson(request, MAX_BODY);
    } catch (err) {
      return json({ ok: false, error: err.code || 'bad-request' }, err.status || 400);
    }

    const { lead, phoneOk, e164, country } = buildLead(p);

    // Antispam: campo trampa relleno o envío en menos de 3 s. Se responde ok
    // para no dar pistas y se deja en el log por si fuera una persona real.
    const honeypot = typeof p.hp === 'string' && p.hp.trim() !== '';
    const tooFast = !(Number(p.elapsed_ms) >= MIN_MS);
    if (honeypot || tooFast) {
      console.warn('[lead] Posible spam, no se guarda:', JSON.stringify({ ...lead, motivo: honeypot ? 'campo trampa' : 'demasiado rápido' }));
      return json({ ok: true, saved: false });
    }
    if (lead.whatsapp.replace(/\D/g, '').length < 6) {
      console.warn('[lead] Sin teléfono utilizable:', JSON.stringify(lead));
      return json({ ok: false, error: 'phone' }, 422);
    }
    if (!phoneOk) console.warn('[lead] Teléfono sin normalizar, se guarda tal cual:', lead.whatsapp);

    const eventId = cleanEventId(p.event_id) || crypto.randomUUID();
    // Clave para que el Apps Script no duplique filas si un envío se reintenta.
    const dedupe = createHash('sha256').update(eventId).digest('hex').slice(0, 32);
    const fromSite = sameOrigin(request);

    const meta = fromSite && capiAllowed(p.consent === true, p.optout === true)
      ? sendEvent({
        name: 'Lead',
        id: eventId,
        time: eventTime(p.ts),
        url: sourceUrl(p.page_url, request),
        ip: clientIp(request),
        ua: request.headers.get('user-agent'),
        fbc: cleanFbc(p.fbc),
        fbp: cleanFbp(p.fbp),
        userData: leadUserData({ e164, name: lead.nombre, country }),
        customData: { content_name: 'Estrategia gratis' },
      })
      : Promise.resolve({ sent: false, reason: !fromSite ? 'origin' : p.optout === true ? 'optout' : 'no-consent' });

    const [sheet, db] = settle(await Promise.allSettled([saveToSheet(lead, dedupe), saveToDb(lead, dedupe), meta]));
    const saved = !!(sheet.saved || db.saved);
    if (!sheet.saved) {
      console.error('[lead] NO SE HA GUARDADO EN EL SHEET. Lead completo para recuperarlo:', JSON.stringify({ ...lead, llegada: p.landing_at || '' }));
    }
    // El Sheet (configurado) no la ha guardado: 503 y el navegador conserva la
    // solicitud para reintentarla, aunque haya copia en la base de datos (sin
    // la fila tampoco sale el correo). No se duplica nada: el Apps Script y la
    // base de datos descartan la misma solicitud durante 8 días y Meta, el Lead
    // con el mismo event_id.
    if (!sheet.saved && sheet.reason !== 'not-configured') return json({ ok: false, saved: !!db.saved }, 503);
    return json({ ok: true, saved });
  },
};
