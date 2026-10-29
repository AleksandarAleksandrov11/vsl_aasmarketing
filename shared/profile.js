// Perfil del negocio: @usuario, usuario o URL de Instagram, TikTok o web.
// Instagram se guarda como "@usuario" con su enlace; lo demás, tal cual.

const IG_USER = /^[a-z0-9._]{1,30}$/i;
const IG_RESERVED = new Set([
  'p', 'reel', 'reels', 'tv', 'stories', 'explore', 'accounts', 'direct', 'about',
  'developer', 'legal', 'web', 'share',
]);
// Terminaciones de dominio habituales. Sirven para distinguir "minegocio.es"
// (web) de "pepe.garcia" (usuario de Instagram con punto).
const TLDS = new Set(`com es net org eu info biz pro me io co app dev shop store online site
  web cat gal eus tv fm link page studio art design agency fit fitness health beauty salon
  cafe bar restaurant club clinic dental care legal madrid barcelona uk fr de it pt ch be nl
  at ie pl ro bg gr se no dk fi cz lu ad mx ar cl pe uy ec bo py ve cr pa do gt hn sv ni cu
  us ca xyz top live life world today academy school news blog media digital marketing
  solutions services consulting group company business global tech cloud ai`.split(/\s+/));

const MAX = 200;

const instagram = (user) => {
  const u = user.toLowerCase();
  return { ok: true, kind: 'instagram', display: '@' + u, url: `https://www.instagram.com/${u}/` };
};

function looksLikeUrl(s) {
  if (/^https?:\/\//i.test(s) || /^www\./i.test(s)) return true;
  const host = s.split(/[/?#]/)[0];
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host)) return false;
  return s.includes('/') || TLDS.has(host.split('.').pop().toLowerCase());
}

function fromUrl(s) {
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol)) return null;
  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, '');
  if (host === 'instagram.com' || host === 'instagr.am') {
    const parts = url.pathname.split('/').filter(Boolean);
    let user = parts[0];
    if (user === 'stories') user = parts[1];
    else if (IG_RESERVED.has((user || '').toLowerCase())) user = '';
    if (user && IG_USER.test(user)) return instagram(user);
  }
  return {
    ok: true,
    kind: host.endsWith('tiktok.com') ? 'tiktok' : 'web',
    display: s,
    url: url.href,
  };
}

/**
 * Devuelve { ok, kind, display, url }. `display` va a la columna "Perfil" y
 * `url` a "Enlace al perfil". Si escriben otra cosa (por ejemplo, el nombre del
 * negocio), se guarda tal cual y sin enlace para no perder la solicitud.
 */
export function normalizeProfile(raw) {
  let s = String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,;:!]+$/, '')
    .slice(0, MAX);
  if (s.length < 2) return { ok: false, error: 'empty' };

  // Con espacios: buscamos dentro un enlace o un @usuario ("mi insta es @pepe").
  if (/\s/.test(s)) {
    const token = s.split(' ').find((t) => looksLikeUrl(t) || /^@[a-z0-9._]{1,30}$/i.test(t));
    if (!token) return { ok: true, kind: 'text', display: s, url: '' };
    s = token;
  }
  if (s.startsWith('@')) {
    const user = s.slice(1);
    return IG_USER.test(user) ? instagram(user) : { ok: true, kind: 'text', display: s, url: '' };
  }
  if (looksLikeUrl(s)) return fromUrl(s) || { ok: true, kind: 'text', display: s, url: '' };
  if (IG_USER.test(s)) return instagram(s);
  return { ok: true, kind: 'text', display: s, url: '' };
}
