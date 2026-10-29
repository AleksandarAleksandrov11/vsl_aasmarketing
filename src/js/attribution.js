// Datos de atribución, capturados al cargar y antes de cualquier consentimiento
// (sessionStorage). Se mandan con cada evento al servidor para que la API de
// conversiones case bien los eventos con los anuncios.

import { session, readCookie } from './util.js';

const KEY = 'aas_attr';
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
let current = null;

export function captureAttribution() {
  const a = { ...(session.get(KEY) || {}) };
  const params = new URLSearchParams(location.search);
  const now = Date.now();

  if (!a.landing_at) a.landing_at = new Date(now).toISOString();
  if (UTM.some((k) => params.has(k))) {
    for (const k of UTM) a[k] = (params.get(k) || '').slice(0, 150);
  }

  // fbc = fb.1.{timestamp ms}.{fbclid}, salvo que ya exista la cookie _fbc de ese clic.
  const fbclid = (params.get('fbclid') || '').slice(0, 500);
  const cookieFbc = readCookie('_fbc');
  if (fbclid) {
    a.fbclid = fbclid;
    if (cookieFbc.endsWith('.' + fbclid)) a.fbc = cookieFbc;
    else if (!a.fbc || !a.fbc.endsWith('.' + fbclid)) a.fbc = `fb.1.${now}.${fbclid}`;
  } else if (cookieFbc) {
    a.fbc = cookieFbc;
  }

  // fbp: la cookie _fbp si existe; si no, una generada con el mismo formato.
  const cookieFbp = readCookie('_fbp');
  if (cookieFbp) a.fbp = cookieFbp;
  else if (!a.fbp) a.fbp = `fb.1.${now}.${Math.floor(Math.random() * 2147483647)}`;

  session.set(KEY, a);
  current = a;
  return a;
}

export const getAttribution = () => current || captureAttribution();
