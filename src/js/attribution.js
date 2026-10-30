// Datos de atribución de la visita: utm, identificador del clic de Meta (fbc) y
// del navegador (fbp). Se mandan con cada evento al servidor para que la API de
// conversiones case bien los eventos con los anuncios.
// Sin consentimiento de marketing solo viven en memoria (salen de la URL de esta
// carga) y no se lee ninguna cookie. Con él se leen _fbp y _fbc y se guardan en
// sessionStorage (aas_attr) para el resto de la visita.

import { session, readCookie } from './util.js';
import { hasMarketing, onConsentChange } from './consent.js';

const KEY = 'aas_attr';
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
let current = null;

export function captureAttribution() {
  const consent = hasMarketing();
  const a = { ...(consent ? session.get(KEY) : null), ...current };
  const params = new URLSearchParams(location.search);
  const now = Date.now();

  if (!a.landing_at) a.landing_at = new Date(now).toISOString();
  if (UTM.some((k) => params.has(k))) {
    for (const k of UTM) a[k] = (params.get(k) || '').slice(0, 150);
  }

  // fbc = fb.1.{timestamp ms}.{fbclid}, salvo que ya exista la cookie _fbc de ese clic.
  const fbclid = (params.get('fbclid') || '').slice(0, 500);
  const cookieFbc = consent ? readCookie('_fbc') : '';
  if (fbclid) {
    a.fbclid = fbclid;
    if (cookieFbc.endsWith('.' + fbclid)) a.fbc = cookieFbc;
    else if (!a.fbc || !a.fbc.endsWith('.' + fbclid)) a.fbc = `fb.1.${now}.${fbclid}`;
  } else if (cookieFbc) {
    a.fbc = cookieFbc;
  }

  // fbp: la cookie _fbp si existe (con consentimiento); si no, una con el mismo formato.
  const cookieFbp = consent ? readCookie('_fbp') : '';
  if (cookieFbp) a.fbp = cookieFbp;
  else if (!a.fbp) a.fbp = `fb.1.${now}.${Math.floor(Math.random() * 2147483647)}`;

  if (consent) session.set(KEY, a);
  current = a;
  return a;
}

export const getAttribution = () => current || captureAttribution();

/** Al aceptar el marketing se guarda para el resto de la visita; al retirarlo, se borra. */
export function initAttribution() {
  onConsentChange((state) => {
    if (state.marketing) captureAttribution();
    else session.del(KEY);
  });
}
