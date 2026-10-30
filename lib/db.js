// [OPCIONAL, decide Aleks] Copia de cada solicitud en una base de datos propia
// (Upstash Redis, disponible en el Marketplace de Vercel). Desactivada por
// defecto: se activa con LEADS_DB_ENABLED=true y las credenciales de Upstash.
// Cada solicitud se añade a la lista "leads" (LPUSH) con los mismos campos que el
// Sheet, una sola vez aunque el navegador la reintente: la clave aas:lead:{dedupe}
// se crea a la vez que se añade (8 días, lo que dura el reintento del navegador).

import { envFlag } from './http.js';

const ONCE = "if redis.call('SET', KEYS[1], '1', 'NX', 'EX', ARGV[2]) then return redis.call('LPUSH', KEYS[2], ARGV[1]) end return 0";

export async function saveToDb(lead, dedupe = '') {
  if (!envFlag('LEADS_DB_ENABLED', false)) return { saved: false, reason: 'disabled' };
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    console.warn('[db] LEADS_DB_ENABLED=true pero faltan UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (o KV_REST_API_URL / KV_REST_API_TOKEN).');
    return { saved: false, reason: 'not-configured' };
  }
  try {
    const command = dedupe
      ? ['EVAL', ONCE, '2', `aas:lead:${dedupe}`, 'leads', JSON.stringify(lead), String(8 * 24 * 3600)]
      : ['LPUSH', 'leads', JSON.stringify(lead)];
    const res = await fetch(url.replace(/\/$/, ''), {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { result } = await res.json().catch(() => ({}));
    return { saved: true, duplicate: result === 0 };
  } catch (err) {
    console.error(`[db] No se pudo guardar la copia: ${err.message}`);
    return { saved: false, reason: err.message };
  }
}
