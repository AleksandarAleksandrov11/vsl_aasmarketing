// Utilidades HTTP para las funciones de /api (firma Web estándar de Vercel).

export class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

/** Lee el cuerpo como JSON con límite de tamaño (acepta text/plain de sendBeacon). */
export async function readJson(request, max) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > max) throw new HttpError(413, 'too-large');
  const text = await request.text();
  if (text.length > max) throw new HttpError(413, 'too-large');
  try {
    const data = JSON.parse(text || '{}');
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('not-object');
    return data;
  } catch {
    throw new HttpError(400, 'bad-json');
  }
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/** IP del visitante: la primera de x-forwarded-for (Vercel la rellena). */
export function clientIp(request) {
  const xff = request.headers.get('x-forwarded-for') || '';
  return xff.split(',')[0].trim() || request.headers.get('x-real-ip') || '';
}

/** La petición viene de esta misma web (o no trae Origin). */
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Variable de entorno booleana ("true", "1", "sí"...). */
export function envFlag(name, fallback) {
  const v = process.env[name];
  if (v == null || String(v).trim() === '') return fallback;
  return /^(1|true|yes|si|sí|on)$/i.test(String(v).trim());
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
