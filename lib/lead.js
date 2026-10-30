// Convierte el envío del formulario en la fila del Sheet (mismas columnas y
// en el mismo orden). En el Sheet nunca van fbclid, fbc, fbp, event_id ni
// ningún otro ID de Meta.

import { normalizePhone, COUNTRIES, OTHER } from '../shared/phone.js';
import { normalizeProfile } from '../shared/profile.js';
import { servicioLabel, negocioLabel, clean } from '../shared/options.js';

/** Solo origen + ruta: sin parámetros (ahí podría ir el fbclid). */
export function pageOnly(value) {
  try {
    const url = new URL(String(value));
    return /^https?:$/.test(url.protocol) ? (url.origin + url.pathname).slice(0, 300) : '';
  } catch {
    return '';
  }
}

/** País para la API de conversiones: el del prefijo elegido (España por defecto). */
export function countryFor(prefijo, e164) {
  if (prefijo && prefijo !== OTHER && COUNTRIES.some((c) => c.iso === prefijo)) return prefijo.toLowerCase();
  if (prefijo === OTHER) return String(e164 || '').startsWith('+34') ? 'es' : '';
  return 'es';
}

export function buildLead(p) {
  const prefijo = p.prefijo === OTHER ? OTHER : COUNTRIES.some((c) => c.iso === p.prefijo) ? p.prefijo : 'ES';
  const phone = normalizePhone(p.telefono, prefijo);
  const profile = normalizeProfile(p.perfil);
  const lead = {
    fecha: new Date().toISOString(),
    nombre: clean(p.nombre, 60),
    // Si el teléfono no se puede normalizar se guarda tal cual: mejor una fila
    // revisable que perder la solicitud.
    whatsapp: phone.ok ? phone.e164 : clean(p.telefono, 30),
    necesita: servicioLabel(p.servicio) || clean(p.servicio, 60),
    negocio: negocioLabel(p.sector, p.sector_otro) || clean(p.sector_otro, 80),
    perfil: profile.ok ? profile.display : clean(p.perfil, 200),
    perfil_url: profile.ok ? profile.url : '',
    utm_source: clean(p.utm_source, 150),
    utm_medium: clean(p.utm_medium, 150),
    utm_campaign: clean(p.utm_campaign, 150),
    pagina: pageOnly(p.page_url),
  };
  return { lead, phoneOk: phone.ok, e164: phone.ok ? phone.e164 : '', country: countryFor(prefijo, phone.e164) };
}
