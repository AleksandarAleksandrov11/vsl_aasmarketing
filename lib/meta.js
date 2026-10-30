// API de conversiones de Meta. Si falta el píxel o META_CAPI_TOKEN no se envía
// nada y solo queda un aviso en el log: la landing funciona igual.

import { createHash } from 'node:crypto';
import { envFlag } from './http.js';

// Versión vigente de la Graph API (v26.0, julio de 2026). Meta retira cada
// versión unos dos años después de publicarla: revisar en developers.facebook.com.
export const GRAPH_VERSION = 'v26.0';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
let warned = false;

// Píxel de AAS Marketing. Se usa solo en Producción (VERCEL_ENV=production) y
// solo si META_PIXEL_ID está vacía: META_PIXEL_ID pone otro y "off" lo quita.
// En Preview y en local no hay píxel salvo que se ponga META_PIXEL_ID, para que
// las visitas de prueba no se mezclen con los datos reales.
export const PRODUCTION_PIXEL_ID = '1137027092146077';

/** ID del píxel de esta build o de esta función, o '' si no hay. */
export function pixelId(warn = () => {}) {
  const raw = String(process.env.META_PIXEL_ID || '').trim();
  if (/^(off|false|no|0)$/i.test(raw)) return '';
  if (/^\d{5,20}$/.test(raw)) return raw;
  if (raw) warn(`META_PIXEL_ID="${raw}" no parece un ID de píxel (solo cifras). Se ignora.`);
  return process.env.VERCEL_ENV === 'production' ? PRODUCTION_PIXEL_ID : '';
}

export function metaConfig() {
  return {
    pixelId: pixelId(),
    token: String(process.env.META_CAPI_TOKEN || '').trim(),
    testCode: String(process.env.META_TEST_EVENT_CODE || '').trim(),
  };
}

/**
 * ¿Se puede mandar el evento por servidor? Nunca si el visitante se ha opuesto
 * («Medición desde el servidor» desactivada o «Rechazar todo» en Configurar
 * cookies, art. 21 RGPD). Si no, con CAPI_WITHOUT_CONSENT=true (por defecto)
 * siempre, acepten o no las cookies; con false, solo con las de marketing aceptadas.
 */
export const capiAllowed = (consent, optout = false) => optout !== true && (consent === true || envFlag('CAPI_WITHOUT_CONSENT', true));

export const cleanEventId = (v) => (typeof v === 'string' && /^[\w-]{8,64}$/.test(v) ? v : '');
export const cleanFbc = (v) => (typeof v === 'string' && v.length < 600 && /^fb\.\d\.\d{10,16}\.[\w.-]+$/.test(v) ? v : '');
export const cleanFbp = (v) => (typeof v === 'string' && v.length < 100 && /^fb\.\d\.\d{10,16}\.\d+$/.test(v) ? v : '');

/** URL de la página (para event_source_url). Si no es válida, la home. */
export function sourceUrl(value, request) {
  try {
    const url = new URL(String(value));
    if (/^https?:$/.test(url.protocol)) return url.href.slice(0, 1000);
  } catch {}
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'vsl.aasmarketing.com';
  return `https://${host}/`;
}

/** Hora del evento en segundos. Un envío reintentado conserva su hora (máx. 7 días). */
export function eventTime(clientMs) {
  const now = Date.now();
  const t = Number(clientMs);
  const ok = Number.isFinite(t) && t <= now + 60_000 && t >= now - 6.5 * 24 * 3600 * 1000;
  return Math.floor((ok ? Math.min(t, now) : now) / 1000);
}

/** Nombre normalizado: minúsculas, sin signos ni números. */
export function normalizeName(name) {
  return String(name || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** ph, fn y country hasheados con SHA-256 como pide Meta. */
export function leadUserData({ e164, name, country }) {
  const out = {};
  const digits = String(e164 || '').replace(/\D/g, '');
  if (digits.length >= 8) out.ph = [sha256(digits)];
  const fn = normalizeName(name);
  if (fn) out.fn = [sha256(fn)];
  if (/^[a-z]{2}$/.test(country || '')) out.country = [sha256(country)];
  return out;
}

export async function sendEvent({ name, id, time, url, ip, ua, fbc, fbp, userData = {}, customData }) {
  const { pixelId, token, testCode } = metaConfig();
  if (!pixelId || !token) {
    if (!warned) {
      console.warn('[meta] Falta META_CAPI_TOKEN (o el píxel): no se envían eventos a la API de conversiones.');
      warned = true;
    }
    return { sent: false, reason: 'not-configured' };
  }
  const event = {
    event_name: name,
    event_time: time,
    event_id: id,
    action_source: 'website',
    event_source_url: url,
    user_data: {
      client_ip_address: ip || undefined,
      client_user_agent: ua || undefined,
      fbc: fbc || undefined,
      fbp: fbp || undefined,
      ...userData,
    },
  };
  if (customData) event.custom_data = customData;
  // Campos de formulario como en el ejemplo de Meta: el token va en el cuerpo y
  // no en la URL, para que no aparezca en los registros de peticiones salientes.
  const body = new URLSearchParams({ data: JSON.stringify([event]), access_token: token });
  if (testCode) body.set('test_event_code', testCode);

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      console.error(`[meta] ${name} rechazado (${res.status}): ${(await res.text()).slice(0, 400)}`);
      return { sent: false, reason: `http-${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error(`[meta] ${name} no enviado: ${err.name}: ${err.message}`);
    return { sent: false, reason: 'network' };
  }
}
