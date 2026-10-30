// Teléfono de WhatsApp: prefijos, detección por idioma, validación y E.164.
// Lo usan el formulario (validación al escribir) y /api/lead (normalización).

export const OTHER = 'OTRO';

// España primero y el resto de países hispanohablantes por orden alfabético.
// `len` es la longitud razonable del número nacional (sin prefijo de país).
export const COUNTRIES = [
  { iso: 'ES', name: 'España', code: '34', len: [9, 9] },
  { iso: 'AR', name: 'Argentina', code: '54', len: [10, 11] },
  { iso: 'BO', name: 'Bolivia', code: '591', len: [8, 8] },
  { iso: 'CL', name: 'Chile', code: '56', len: [9, 9] },
  { iso: 'CO', name: 'Colombia', code: '57', len: [10, 10] },
  { iso: 'CR', name: 'Costa Rica', code: '506', len: [8, 8] },
  { iso: 'CU', name: 'Cuba', code: '53', len: [8, 8] },
  { iso: 'EC', name: 'Ecuador', code: '593', len: [8, 9] },
  { iso: 'SV', name: 'El Salvador', code: '503', len: [8, 8] },
  { iso: 'US', name: 'Estados Unidos', code: '1', len: [10, 10] },
  { iso: 'GT', name: 'Guatemala', code: '502', len: [8, 8] },
  { iso: 'GQ', name: 'Guinea Ecuatorial', code: '240', len: [9, 9] },
  { iso: 'HN', name: 'Honduras', code: '504', len: [8, 8] },
  { iso: 'MX', name: 'México', code: '52', len: [10, 10] },
  { iso: 'NI', name: 'Nicaragua', code: '505', len: [8, 8] },
  { iso: 'PA', name: 'Panamá', code: '507', len: [7, 8] },
  { iso: 'PY', name: 'Paraguay', code: '595', len: [9, 9] },
  { iso: 'PE', name: 'Perú', code: '51', len: [9, 9] },
  { iso: 'PR', name: 'Puerto Rico', code: '1', len: [10, 10] },
  { iso: 'DO', name: 'República Dominicana', code: '1', len: [10, 10] },
  { iso: 'UY', name: 'Uruguay', code: '598', len: [8, 8] },
  { iso: 'VE', name: 'Venezuela', code: '58', len: [10, 10] },
];

export const PHONE_ERRORS = {
  empty: 'Escribe tu número de WhatsApp.',
  es: 'Revisa el número: un móvil español tiene 9 cifras y empieza por 6 o 7.',
  len: 'Revisa el número: parece que le faltan o le sobran cifras.',
  intl: 'Escribe el número completo con el prefijo del país, por ejemplo +44 7911 123456.',
};

const byIso = (iso) => COUNTRIES.find((c) => c.iso === iso);

/** Prefijo por defecto: +34, salvo que el idioma sea de otro país hispanohablante. */
export function detectCountry(languages = []) {
  for (const lang of languages) {
    const [base, region] = String(lang).split('-');
    if (base?.toLowerCase() !== 'es' || !region) continue;
    const c = byIso(region.toUpperCase());
    if (c) return c.iso;
  }
  return 'ES';
}

function national(c, digits) {
  if (c.iso === 'ES') {
    return /^[67]\d{8}$/.test(digits)
      ? { ok: true, e164: '+34' + digits }
      : { ok: false, error: 'es' };
  }
  if (digits.length < c.len[0] || digits.length > c.len[1]) return { ok: false, error: 'len' };
  return { ok: true, e164: '+' + c.code + digits };
}

/**
 * Valida y normaliza a E.164 (+34600000000).
 * `iso` es el país del selector, u OTHER si el número lleva su propio prefijo.
 */
export function normalizePhone(raw, iso = 'ES') {
  const input = String(raw ?? '').trim();
  let digits = input.replace(/\D/g, '');
  if (!digits) return { ok: false, error: 'empty' };

  // Número internacional completo: "+44 ...", "0044 ..." o prefijo "Otro".
  if (iso === OTHER || /^(\+|00)/.test(input)) {
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith('34') && digits.length === 11) return national(byIso('ES'), digits.slice(2));
    if (digits.length < 8 || digits.length > 15) return { ok: false, error: 'intl' };
    return { ok: true, e164: '+' + digits };
  }

  const c = byIso(iso) || byIso('ES');
  // Prefijo del país escrito sin "+" (34600000000).
  if (digits.startsWith(c.code) && digits.length > c.len[1]) {
    const rest = digits.slice(c.code.length);
    if (rest.length >= c.len[0] && rest.length <= c.len[1]) digits = rest;
  }
  digits = digits.replace(/^0+/, '');
  if (c.iso === 'MX' && digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  return national(c, digits);
}

/** Cifras para enlaces wa.me (sin "+"). */
export const waDigits = (e164) => String(e164 || '').replace(/\D/g, '');
