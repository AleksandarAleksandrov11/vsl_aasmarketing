// Consentimiento: necesarias (siempre), analítica (Vercel Web Analytics y Speed
// Insights) y marketing (píxel de Meta). Aparte, la medición desde el servidor
// (API de conversiones) va por interés legítimo aunque no acepten las cookies,
// con su propio interruptor para oponerse. La decisión se guarda en localStorage
// durante 24 meses; la oposición, en su propia clave y sin caducidad.
// El banner es una capa fija: no empuja la página y sube por encima del CTA fijo.

import { $, local } from './util.js';

const KEY = 'aas_consent';
const OPTOUT = 'aas_optout'; // la oposición no caduca ni se pierde al volver a preguntar
const VERSION = 2; // v2 añade la analítica: quien decidió con v1 vuelve a ver el banner
const MAX_AGE = 730 * 24 * 3600 * 1000; // la AEPD recomienda volver a preguntar a los 24 meses
// Lo que ofrece esta build: sin píxel o sin analítica no se pregunta por ellos.
const OFFERED = [
  $('meta[name="aas-analytics"]') && 'analytics',
  $('meta[name="aas-pixel"]') && 'marketing',
  $('meta[name="aas-capi"]') && 'server',
].filter(Boolean);
const listeners = new Set();
// Una oposición guardada antes de existir aas_optout (dentro de aas_consent) también cuenta.
const readOptout = () => OFFERED.includes('server') && !!(local.get(OPTOUT) || local.get(KEY)?.optout);
let optout = readOptout();
if (optout && !local.get(OPTOUT)) local.set(OPTOUT, { ts: Date.now() });
let state = read();

function read() {
  const v = local.get(KEY);
  if (!v) return null;
  // Caducada, de otra versión o sin algo que ahora se ofrece: se borra y se vuelve a preguntar.
  const valid = v.v === VERSION && Date.now() - Number(v.ts || 0) < MAX_AGE && OFFERED.every((c) => (v.cats || []).includes(c));
  if (!valid) local.del(KEY);
  return valid ? v : null;
}

export const hasDecision = () => !!state;
export const hasMarketing = () => !!state?.marketing;
export const hasAnalytics = () => !!state?.analytics;
/** Se ha opuesto a la medición desde el servidor: no se manda nada por la API de conversiones. */
export const hasOptedOut = () => optout;
export const onConsentChange = (fn) => listeners.add(fn);

const snapshot = () => ({ analytics: hasAnalytics(), marketing: hasMarketing(), optout: hasOptedOut() });

function apply(next, nextOptout) {
  const before = snapshot();
  state = next;
  optout = nextOptout;
  const now = snapshot();
  listeners.forEach((fn) => fn(now, before));
}

export function setConsent({ analytics, marketing, optout: objects = hasOptedOut() }) {
  const nextOptout = !!objects && OFFERED.includes('server');
  if (nextOptout) local.set(OPTOUT, { ts: Date.now() });
  else if (OFFERED.includes('server')) local.del(OPTOUT);
  const next = {
    v: VERSION,
    analytics: !!analytics && OFFERED.includes('analytics'),
    marketing: !!marketing && OFFERED.includes('marketing'),
    optout: nextOptout,
    cats: OFFERED,
    ts: Date.now(),
  };
  local.set(KEY, next);
  apply(next, nextOptout);
}

// Otra pestaña cambió la decisión, o la página vuelve de la caché del navegador
// con el botón Atrás: se relee para no seguir midiendo con una decisión antigua.
function sync() {
  const nextOptout = readOptout(); // antes de read(), que borra un registro caducado
  const next = read();
  if ((next?.ts || 0) !== (state?.ts || 0) || nextOptout !== optout) apply(next, nextOptout);
}

export function initConsent() {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === OPTOUT || e.key === null) sync();
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) sync();
  });

  const box = $('#ck');
  if (!box) return;
  const panel = $('#ck-panel', box);
  const toggles = { analytics: $('#ck-ana', box), marketing: $('#ck-mkt', box), server: $('#ck-srv', box) };
  const btn = (name) => $(`[data-ck="${name}"]`, box);
  const firstToggle = () => toggles.analytics || toggles.marketing || toggles.server;
  let trigger = null; // botón que abrió el panel: recupera el foco al cerrar

  const fill = () => {
    if (toggles.analytics) toggles.analytics.checked = hasAnalytics();
    if (toggles.marketing) toggles.marketing.checked = hasMarketing();
    if (toggles.server) toggles.server.checked = !hasOptedOut();
  };
  const open = (withPanel) => {
    box.hidden = false;
    box.classList.toggle('is-config', withPanel);
    panel.hidden = !withPanel;
    // Con los interruptores a la vista, los dos botones grandes dicen que afectan a todo.
    btn('reject').textContent = withPanel ? 'Rechazar todo' : 'Rechazar';
    btn('accept').textContent = withPanel ? 'Aceptar todo' : 'Aceptar';
    btn('config').hidden = withPanel;
    btn('save').hidden = !withPanel;
    fill();
  };
  const close = () => {
    const hadFocus = box.contains(document.activeElement);
    box.hidden = true;
    if (hadFocus && trigger?.isConnected) trigger.focus();
    trigger = null;
  };

  box.addEventListener('click', (e) => {
    const action = e.target.closest('[data-ck]')?.dataset.ck;
    if (!action) return;
    if (action === 'config') {
      open(true);
      firstToggle()?.focus();
      return;
    }
    let choice;
    if (action === 'accept') choice = { analytics: true, marketing: true, optout: false };
    // «Rechazar» quita las cookies opcionales; «Rechazar todo» (con el panel
    // abierto) quita también la medición desde el servidor.
    else if (action === 'reject') choice = { analytics: false, marketing: false, optout: panel.hidden ? hasOptedOut() : true };
    else choice = { analytics: !!toggles.analytics?.checked, marketing: !!toggles.marketing?.checked, optout: toggles.server ? !toggles.server.checked : false };
    close();
    setConsent(choice);
  });

  box.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (hasDecision()) close();
    else if (!panel.hidden) {
      open(false);
      btn('config').focus();
    }
  });

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open-cookies]');
    if (!opener) return;
    trigger = opener;
    open(true);
    firstToggle()?.focus();
  });

  // Decisión tomada en otra pestaña: se quita el banner o se actualizan los interruptores.
  onConsentChange(() => {
    if (box.hidden) return;
    if (hasDecision() && panel.hidden) close();
    else fill();
  });

  // Primer pantallazo limpio: el banner sale al primer scroll o a los 3 s, pero
  // nunca encima del botón principal del hero ni de la nota de debajo; si los
  // taparía, espera a que el visitante baje. Hasta que decida no se carga nada
  // que use cookies, así que esperar no cambia lo que se guarda en su navegador.
  if (hasDecision()) return;
  const zone = [$('[data-hero-cta]'), $('.hero-note')].filter(Boolean);
  let timer = 0;
  let frame = 0;
  const covers = () => {
    const rects = zone.map((el) => el.getBoundingClientRect()).filter((r) => r.bottom > 0 && r.top < window.innerHeight);
    if (!rects.length) return false;
    // Se mide en su sitio final, sin la animación de entrada y sin que se vea.
    box.style.visibility = 'hidden';
    box.style.animation = 'none';
    box.hidden = false;
    const b = box.getBoundingClientRect();
    box.hidden = true;
    box.style.visibility = '';
    box.style.animation = '';
    return rects.some((r) => r.bottom > b.top && r.top < b.bottom && r.right > b.left && r.left < b.right);
  };
  const stop = () => {
    clearTimeout(timer);
    window.removeEventListener('scroll', onMove);
    window.removeEventListener('resize', onMove);
  };
  const show = () => {
    frame = 0;
    if (hasDecision() || !box.hidden) return stop();
    if (covers()) return;
    stop();
    open(false);
  };
  const onMove = () => {
    if (!frame) frame = requestAnimationFrame(show);
  };
  timer = setTimeout(show, 3000);
  window.addEventListener('scroll', onMove, { passive: true });
  window.addEventListener('resize', onMove, { passive: true });
}
