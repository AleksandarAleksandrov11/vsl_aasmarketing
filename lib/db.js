// [OPCIONAL, decide Aleks] Copia de cada solicitud en una base de datos propia
// (Upstash Redis, disponible en el Marketplace de Vercel). Desactivada por
// defecto: se activa con LEADS_DB_ENABLED=true y las credenciales de Upstash.
// Cada solicitud se añade a la lista "leads" (LPUSH) con los mismos campos que el Sheet.

import { envFlag } from './http.js';

export async function saveToDb(lead) {
  if (!envFlag('LEADS_DB_ENABLED', false)) return { saved: false, reason: 'disabled' };
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    console.warn('[db] LEADS_DB_ENABLED=true pero faltan UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (o KV_REST_API_URL / KV_REST_API_TOKEN).');
    return { saved: false, reason: 'not-configured' };
  }
  try {
    const res = await fetch(url.replace(/\/$/, ''), {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(['LPUSH', 'leads', JSON.stringify(lead)]),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { saved: true };
  } catch (err) {
    console.error(`[db] No se pudo guardar la copia: ${err.message}`);
    return { saved: false, reason: err.message };
  }
}
