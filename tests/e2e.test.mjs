// Pruebas de extremo a extremo con Playwright:
//   · WebKit a 390 px con el user agent del navegador de Instagram en iPhone.
//   · Chromium a 1440 px (y a 390 px para medir el CLS, que WebKit no expone).
// Levantan un build de prueba (con un píxel ficticio), el servidor local y un
// Apps Script simulado. Uso: npm run test:e2e
// Requiere Playwright con WebKit y Chromium (ver README, "Pruebas").

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let pw = null;
try {
  pw = require('playwright');
} catch {}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = process.env.SHOTS_DIR || '';
const IG_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G86 Instagram 400.0.0.32.97 (iPhone16,2; iOS 18_6; es_ES; es; scale=3.00; 1290x2796; 789012345)';
const MOBILE = { viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, userAgent: IG_UA, locale: 'es-ES' };
const DESKTOP = { viewport: { width: 1440, height: 900 }, locale: 'es-ES' };
const PIXEL = '123456789012345';

const skip = !pw && 'Playwright no está instalado';
let base;
let serverProc;
let sheet;
const sheetState = { mode: 'ok', calls: [] };

// Apps Script simulado
function startSheet() {
  return new Promise((resolve) => {
    const srv = http.createServer(async (req, res) => {
      let body = '';
      for await (const c of req) body += c;
      sheetState.calls.push(JSON.parse(body || '{}'));
      const reply = () => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end('{"ok":true}');
      };
      if (sheetState.mode === 'slow') setTimeout(reply, 9000);
      else if (sheetState.mode === 'fail') {
        res.writeHead(500);
        res.end('error');
      } else reply();
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function waitFor(url, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`No arranca ${url}`);
}

before(async () => {
  if (skip) return;
  const build = spawnSync(process.execPath, ['scripts/build.mjs'], {
    cwd: root, env: { ...process.env, OUT_DIR: 'dist-test', META_PIXEL_ID: PIXEL }, encoding: 'utf8',
  });
  assert.equal(build.status, 0, build.stderr);
  sheet = await startSheet();
  const port = 4300 + Math.floor(Math.random() * 500);
  serverProc = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: root,
    env: {
      ...process.env, PORT: String(port), DIST: 'dist-test',
      SHEET_WEBHOOK_URL: `http://127.0.0.1:${sheet.address().port}/exec`, SHEET_SECRET: 'secreto-de-prueba',
      META_PIXEL_ID: PIXEL, META_CAPI_TOKEN: '',
    },
    stdio: 'ignore',
  });
  base = `http://localhost:${port}/`;
  await waitFor(base);
});

after(() => {
  serverProc?.kill();
  sheet?.close();
});

/** Abre una página con registro de errores, eventos y peticiones a Meta simuladas. */
async function open(browserType, ctxOptions, { url = base, before: setup } = {}) {
  const browser = await browserType.launch();
  const context = await browser.newContext(ctxOptions);
  const page = await context.newPage();
  const log = { errors: [], events: [], leads: [], wa: [] };
  page.on('console', (m) => m.type() === 'error' && log.errors.push(m.text()));
  page.on('pageerror', (e) => log.errors.push(e.message));
  page.on('request', (r) => {
    const body = r.postData();
    if (r.url().endsWith('/api/event') && body) log.events.push(JSON.parse(body));
    if (r.url().endsWith('/api/lead') && body) log.leads.push(JSON.parse(body));
  });
  // fbevents.js simulado: registra cada uso de fbq.
  await context.route('https://connect.facebook.net/**', (route) => route.fulfill({
    contentType: 'text/javascript',
    body: 'window.__fbq=[];(window.fbq.queue||[]).forEach(function(a){window.__fbq.push([].slice.call(a))});window.fbq.queue=[];window.fbq.callMethod=function(){window.__fbq.push([].slice.call(arguments))};',
  }));
  await context.route('https://www.facebook.com/**', (route) => route.fulfill({ status: 204, body: '' }));
  await context.route('https://wa.me/**', (route) => {
    log.wa.push(route.request().url());
    return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>WhatsApp</title><p>WhatsApp</p>' });
  });
  if (setup) await setup(page, context);
  await page.goto(url, { waitUntil: 'load' });
  return { browser, context, page, log };
}

/**
 * Espera a que la página deje de desplazarse (scroll suave al cambiar de paso,
 * ancla o restauración del scroll al volver atrás): si se pulsa mientras se
 * mueve, el toque puede caer fuera del botón.
 */
const settle = (page) => page.waitForFunction(() => new Promise((resolve) => {
  let last = -1;
  let same = 0;
  const tick = () => {
    same = scrollY === last ? same + 1 : 0;
    last = scrollY;
    if (same >= 5) resolve(true);
    else requestAnimationFrame(tick);
  };
  tick();
}), null, { timeout: 5000 });

async function fillForm(page, { otro = true } = {}) {
  await page.locator('#formulario').scrollIntoViewIfNeeded();
  await settle(page);
  await page.locator('.lf-opt', { hasText: 'Las dos' }).click();
  await page.locator('[data-step="2"]').waitFor({ state: 'visible' });
  await settle(page);
  if (otro) {
    await page.locator('.lf-chip', { hasText: 'Otro' }).click();
    await page.fill('#f-otro', 'Escuela de música');
    await page.locator('[data-step="2"] [data-next]').click();
  } else {
    await page.locator('.lf-chip', { hasText: 'Motor y talleres' }).click();
  }
  await page.locator('[data-step="3"]').waitFor({ state: 'visible' });
  await settle(page);
  await page.fill('#f-perfil', 'instagram.com/prueba');
  await page.locator('[data-step="3"] [data-next]').click();
  await page.locator('[data-step="4"]').waitFor({ state: 'visible' });
  await settle(page);
  await page.fill('#f-nombre', 'PRUEBA');
  await page.locator('[data-step="4"] [data-next]').click();
  await page.locator('[data-step="5"]').waitFor({ state: 'visible' });
  await settle(page);
  await page.fill('#f-tel', '600 000 000');
}

const expectedText = [
  'Hola Aleks, acabo de pedir mi estrategia gratis desde la web.',
  'Nombre: PRUEBA',
  'Necesito: Las dos (redes y Meta Ads)',
  'Negocio: Escuela de música',
  'Perfil: @prueba',
].join('\n');

test('móvil (WebKit, Instagram): primer pantallazo, enlaces y CTA fijo', { skip, timeout: 60000 }, async () => {
  const { browser, page, log } = await open(pw.webkit, MOBILE);
  try {
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/390-primer-pantallazo.png` });
    // CTA, titular y línea de confianza dentro del hueco real del navegador de Instagram (390x664).
    for (const sel of ['h1', '[data-hero-cta]', '.trust']) {
      const b = await page.locator(sel).boundingBox();
      assert.ok(b.y >= 0 && b.y + b.height <= 664, `${sel} fuera del primer pantallazo (${b.y + b.height})`);
    }
    // Primer pantallazo limpio: el banner de cookies aún no ha salido.
    assert.equal(await page.isVisible('#ck'), false, 'el banner tapa el primer pantallazo');
    await page.waitForTimeout(3300);
    assert.equal(await page.isVisible('#ck'), true, 'el banner sale a los 3 s');
    const cta = await page.locator('[data-hero-cta]').boundingBox();
    assert.ok((await page.locator('#ck').boundingBox()).y >= cta.y + cta.height, 'el banner tapa el CTA');

    // Ningún enlace a WhatsApp, teléfono, correo ni Instagram antes del formulario.
    const leaks = await page.evaluate(() => {
      const form = document.getElementById('formulario');
      return [...document.querySelectorAll('a[href]')]
        .filter((a) => a.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING)
        .map((a) => a.getAttribute('href'))
        .filter((h) => /wa\.me|whatsapp|^tel:|^mailto:|instagram\.com|tiktok\.com/i.test(h));
    });
    assert.deepEqual(leaks, []);
    // Todos los CTA bajan al formulario y dicen lo mismo.
    const ctas = await page.$$eval('a.btn:not(.btn-s):not(.btn-wa)', (as) => as.map((a) => [a.getAttribute('href'), a.textContent.trim()]));
    for (const [href, text] of ctas) {
      assert.equal(href, '#formulario');
      assert.equal(text, 'Quiero mi estrategia gratis');
    }
    // No hay vídeo de ventas ni autoplay.
    assert.equal(await page.locator('video').count(), 0);

    // CTA fijo: oculto arriba, visible al pasar el hero, oculto con el formulario a la vista.
    const sticky = () => page.evaluate(() => document.documentElement.classList.contains('has-sticky'));
    assert.equal(await sticky(), false);
    // Pasado el formulario (que ahora va justo después de las cifras).
    await page.evaluate(() => window.scrollTo(0, document.getElementById('casos').offsetTop + 200));
    await page.waitForTimeout(500);
    assert.equal(await sticky(), true);
    // Con el banner abierto, el banner queda encima del CTA fijo sin solaparlo.
    await page.waitForTimeout(400);
    const ck = await page.locator('#ck').boundingBox();
    const bar = await page.locator('[data-sticky]').boundingBox();
    assert.ok(ck.y + ck.height <= bar.y + 1, `el banner solapa el CTA fijo (${ck.y + ck.height} > ${bar.y})`);
    await page.locator('#formulario').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    assert.equal(await sticky(), false);
    assert.deepEqual(log.errors, []);
  } finally {
    await browser.close();
  }
});

test('móvil (WebKit): formulario completo con "Otro", éxito y WhatsApp bien codificado', { skip, timeout: 60000 }, async () => {
  sheetState.mode = 'ok';
  sheetState.calls.length = 0;
  const { browser, page, log } = await open(pw.webkit, MOBILE);
  try {
    await page.click('[data-ck="reject"]');
    await fillForm(page);
    // Atrás conserva las respuestas.
    await page.click('[data-back]');
    assert.equal(await page.inputValue('#f-nombre'), 'PRUEBA');
    await page.locator('[data-step="4"] [data-next]').click();
    assert.equal(await page.inputValue('#f-tel'), '600 000 000');
    if (SHOTS) await page.locator('[data-lead]').screenshot({ path: `${SHOTS}/390-formulario-paso5.png` });
    const waRequest = page.waitForRequest('https://wa.me/**', { timeout: 15000 });
    await page.click('[data-submit]');
    await page.locator('[data-done]').waitFor({ state: 'visible', timeout: 9000 });
    assert.equal(await page.textContent('[data-done-title]'), '¡Listo, PRUEBA!');
    if (SHOTS) await page.locator('[data-lead]').screenshot({ path: `${SHOTS}/390-exito.png` });
    const url = new URL((await waRequest).url());
    assert.equal(url.origin + url.pathname, 'https://wa.me/34695850590');
    assert.equal(url.searchParams.get('text'), expectedText);
    assert.match(url.search, /%C3%BA/, 'acentos codificados (música)');
    assert.match(url.search, /%0A/, 'saltos de línea codificados');

    // Lo que llega al Sheet: columnas nuevas y sin IDs de Meta.
    await new Promise((r) => setTimeout(r, 300));
    const row = sheetState.calls.at(-1).lead;
    assert.equal(row.nombre, 'PRUEBA');
    assert.equal(row.whatsapp, '+34600000000');
    assert.equal(row.negocio, 'Escuela de música');
    assert.equal(row.perfil, '@prueba');
    assert.equal(row.perfil_url, 'https://www.instagram.com/prueba/');
    assert.ok(!/fbclid|fbp|fbc|event_id/.test(Object.keys(row).join()), 'IDs de Meta en el Sheet');

    // Eventos por servidor: PageView, ViewContent y Contact (el Lead va por /api/lead).
    const names = log.events.map((e) => e.event_name);
    assert.ok(names.includes('PageView') && names.includes('ViewContent') && names.includes('Contact'), names.join());
    assert.ok(names.every((n) => ['PageView', 'ViewContent', 'Contact'].includes(n)));
    assert.equal(log.leads.length, 1);
    assert.match(log.leads[0].event_id, /^[0-9a-f-]{36}$/);

    // Al volver de WhatsApp sigue la pantalla de éxito.
    await page.goBack();
    await page.locator('[data-done]').waitFor({ state: 'visible' });
    assert.equal(await page.isVisible('[data-form]'), false);
    // "Enviar otra solicitud" vuelve al paso 1 vacío.
    await settle(page);
    await page.click('[data-again]');
    await page.locator('[data-step="1"]').waitFor({ state: 'visible' });
    assert.equal(await page.inputValue('#f-perfil'), '');
    assert.deepEqual(log.errors, []);
  } finally {
    await browser.close();
  }
});

test('éxito aunque /api/lead falle, tarde o no haya red; reintento en la próxima visita', { skip, timeout: 90000 }, async () => {
  // a) Error 500: éxito y el envío queda guardado para reintentar.
  let ctx = await open(pw.webkit, MOBILE, {
    url: `${base}?utm_source=ig&fbclid=IwAR0prueba`,
    before: (page) => page.route('**/api/lead', (r) => r.fulfill({ status: 500, body: 'x' })),
  });
  await ctx.page.click('[data-ck="reject"]');
  await fillForm(ctx.page, { otro: false });
  await ctx.page.click('[data-submit]');
  await ctx.page.locator('[data-done]').waitFor({ state: 'visible', timeout: 9000 });
  const copy = await ctx.page.evaluate(() => JSON.parse(localStorage.getItem('aas_pending')));
  assert.equal(copy.length, 1);
  // Sin consentimiento de marketing, la copia del navegador no guarda identificadores
  // de Meta, datos de campaña ni la dirección con el fbclid.
  const c = copy[0].p;
  assert.deepEqual([c.fbp, c.fbc, c.fbclid, c.utm_source, c.landing_at, c.page_url, c.nombre], ['', '', '', '', '', base, 'PRUEBA']);
  const sent = ctx.log.leads.at(-1);
  assert.match(sent.fbp, /^fb\.1\.\d+\.\d+$/, 'la petición sí lleva el fbp (medición por servidor)');
  assert.deepEqual([sent.utm_source, sent.fbclid], ['ig', 'IwAR0prueba'], 'y los datos de campaña');
  await ctx.browser.close();

  // b) Respuesta lenta: éxito antes de 7 s.
  ctx = await open(pw.webkit, MOBILE, { before: (page) => page.route('**/api/lead', async (r) => {
    await new Promise((res) => setTimeout(res, 12000));
    r.fulfill({ status: 200, body: '{"ok":true}' }).catch(() => {});
  }) });
  await ctx.page.click('[data-ck="reject"]');
  await fillForm(ctx.page, { otro: false });
  const t0 = Date.now();
  await ctx.page.click('[data-submit]');
  await ctx.page.locator('[data-done]').waitFor({ state: 'visible', timeout: 9000 });
  assert.ok(Date.now() - t0 < 7500, `tardó ${Date.now() - t0} ms`);
  await ctx.browser.close();

  // c) Sin red: éxito, guardado en localStorage y reenviado en la siguiente visita.
  sheetState.mode = 'ok';
  sheetState.calls.length = 0;
  const browser = await pw.webkit.launch();
  const context = await browser.newContext(MOBILE);
  await context.route('https://wa.me/**', (r) => r.fulfill({ contentType: 'text/html', body: 'wa' }));
  const page = await context.newPage();
  await page.route('**/api/lead', (r) => r.abort('internetdisconnected'));
  await page.goto(base);
  await page.click('[data-ck="reject"]');
  await fillForm(page, { otro: false });
  await page.click('[data-submit]');
  await page.locator('[data-done]').waitFor({ state: 'visible', timeout: 9000 });
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('aas_pending')).length), 1);
  await page.unroute('**/api/lead');
  const next = await context.newPage();
  await next.goto(base);
  await next.waitForFunction(() => !localStorage.getItem('aas_pending'), null, { timeout: 15000 });
  assert.equal(sheetState.calls.at(-1).lead.nombre, 'PRUEBA');
  await browser.close();

  // d) El Sheet no responde: /api/lead contesta 503, el navegador conserva la
  // solicitud y la reintenta en la siguiente visita, cuando el Sheet ya funciona.
  sheetState.mode = 'fail';
  const b2 = await pw.webkit.launch();
  try {
  const c2 = await b2.newContext(MOBILE);
  await c2.route('https://wa.me/**', (r) => r.fulfill({ contentType: 'text/html', body: 'wa' }));
  const p2 = await c2.newPage();
  const status = [];
  p2.on('response', (r) => r.url().endsWith('/api/lead') && status.push(r.status()));
  await p2.goto(base);
  await p2.click('[data-ck="reject"]');
  await fillForm(p2, { otro: false });
  await p2.click('[data-submit]');
  await p2.locator('[data-done]').waitFor({ state: 'visible', timeout: 9000 });
  assert.deepEqual(status, [503]);
  assert.equal(await p2.evaluate(() => JSON.parse(localStorage.getItem('aas_pending')).length), 1);
  sheetState.mode = 'ok';
  sheetState.calls.length = 0;
  const p3 = await c2.newPage();
  await p3.goto(base);
  await p3.waitForFunction(() => !localStorage.getItem('aas_pending'), null, { timeout: 15000 });
  assert.equal(sheetState.calls.at(-1).lead.nombre, 'PRUEBA');
  } finally {
    sheetState.mode = 'ok';
    await b2.close();
  }
});

test('escritorio (Chromium 1440): formulario solo con teclado y sin errores', { skip, timeout: 60000 }, async () => {
  sheetState.calls.length = 0;
  const { browser, page, log } = await open(pw.chromium, DESKTOP);
  try {
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/1440-primer-pantallazo.png` });
    assert.equal(await page.isVisible('[data-sticky]'), false, 'el CTA fijo no aparece en escritorio');
    await page.keyboard.press('Tab'); // "Saltar al formulario"
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Saltar al formulario');
    await page.click('[data-ck="reject"]');
    await page.locator('#formulario').scrollIntoViewIfNeeded();
    await page.focus('input[name="servicio"][value="redes"]');
    await page.keyboard.press('ArrowDown'); // Meta Ads (no avanza solo con flechas)
    assert.equal(await page.isVisible('[data-step="1"]'), true);
    await page.keyboard.press('Enter');
    await page.locator('[data-step="2"]').waitFor({ state: 'visible' });
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.locator('[data-step="3"]').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => document.activeElement.id), 'f-perfil');
    await page.keyboard.press('Enter'); // vacío: error
    assert.equal(await page.textContent('#e-perfil'), 'Escribe tu Instagram, tu TikTok o tu web.');
    await page.keyboard.type('@prueba');
    assert.equal(await page.textContent('#e-perfil'), '', 'el error se quita al escribir');
    await page.keyboard.press('Enter');
    await page.keyboard.type('PRUEBA');
    await page.keyboard.press('Enter');
    await page.keyboard.type('612');
    await page.keyboard.press('Enter');
    assert.match(await page.textContent('#e-tel'), /9 cifras/);
    await page.keyboard.type('345678');
    if (SHOTS) await page.locator('[data-lead]').screenshot({ path: `${SHOTS}/1440-formulario-paso5.png` });
    await page.keyboard.press('Enter');
    await page.locator('[data-done]').waitFor({ state: 'visible', timeout: 9000 });
    if (SHOTS) await page.locator('[data-lead]').screenshot({ path: `${SHOTS}/1440-exito.png` });
    assert.equal(log.leads[0].servicio, 'ads');
    assert.equal(log.leads[0].sector, 'entrenamiento');
    assert.equal(log.leads[0].telefono, '612345678');
    assert.deepEqual(log.errors, []);
  } finally {
    await browser.close();
  }
});

test('cookies: el píxel solo carga con consentimiento y usa los mismos event_id', { skip, timeout: 60000 }, async () => {
  const { browser, page, log } = await open(pw.chromium, DESKTOP);
  try {
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => typeof window.fbq), 'undefined', 'el píxel no carga sin consentimiento');
    assert.equal((await page.context().cookies()).filter((c) => c.name.startsWith('_fb')).length, 0);
    const pageView = log.events.find((e) => e.event_name === 'PageView');
    assert.ok(pageView, 'PageView por servidor sin consentimiento');
    assert.equal(pageView.consent, false);
    assert.equal(pageView.optout, false);
    assert.match(pageView.fbp, /^fb\.1\.\d+\.\d+$/);
    // Sin consentimiento, los identificadores de Meta no se guardan en el navegador.
    assert.equal(await page.evaluate(() => sessionStorage.getItem('aas_attr')), null);

    assert.equal(await page.evaluate(() => window.__vercelScripts || 0), 0, 'la analítica no carga sin consentimiento');
    await page.click('[data-ck="accept"]');
    await page.waitForFunction(() => Array.isArray(window.__fbq) && window.__fbq.some((c) => c[0] === 'track'));
    await page.waitForFunction(() => window.__vercelScripts === 2);
    assert.equal(typeof (await page.evaluate(() => window.vaq && window.vaq[0] && window.vaq[0][0])), 'string', 'cola de Web Analytics con beforeSend');
    const calls = await page.evaluate(() => window.__fbq);
    // Sin PageView automáticos de Meta al cambiar el #ancla o el historial.
    assert.equal(await page.evaluate(() => window.fbq.disablePushState), true);
    assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('aas_attr')).fbp), pageView.fbp, 'con consentimiento se guarda aas_attr');
    const pv = calls.filter((c) => c[0] === 'track' && c[1] === 'PageView');
    assert.equal(pv.length, 1, 'un solo PageView en el navegador');
    assert.equal(pv[0][3].eventID, pageView.event_id, 'mismo event_id que el servidor');
    assert.ok(calls.some((c) => c[0] === 'set' && c[1] === 'autoConfig' && c[2] === false));
    const cookies = await page.context().cookies();
    assert.equal(cookies.find((c) => c.name === '_fbp')?.value, pageView.fbp, 'la cookie _fbp coincide con el fbp del servidor');
    // Sin "Configurar cookies" duplicado: el pie lo vuelve a abrir.
    await page.click('.ftr [data-open-cookies]');
    assert.equal(await page.isVisible('#ck-panel'), true);
    assert.equal(await page.isChecked('#ck-mkt'), true);
    assert.equal(await page.isChecked('#ck-srv'), true);

    // Lead: mismo event_id en el navegador y en /api/lead.
    await page.click('[data-ck="save"]');
    await fillForm(page, { otro: false });
    await page.click('[data-submit]');
    await page.locator('[data-done]').waitFor({ state: 'visible', timeout: 9000 });
    const lead = (await page.evaluate(() => window.__fbq)).find((c) => c[0] === 'track' && c[1] === 'Lead');
    assert.equal(lead[3].eventID, log.leads.at(-1).event_id);
    assert.equal(log.leads.at(-1).consent, true);
    assert.deepEqual(log.errors, []);
  } finally {
    await browser.close();
  }
});

test('CLS con fuentes lentas y banner (Chromium a 390 px)', { skip, timeout: 60000 }, async () => {
  const { browser, page } = await open(pw.chromium, { viewport: { width: 390, height: 664 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: IG_UA }, {
    before: async (p) => {
      await p.addInitScript(() => {
        window.__cls = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      // Las fuentes llegan 1,5 s tarde: el hero no debe moverse al cambiar de fuente.
      await p.route('**/*.woff2', async (r) => {
        await new Promise((res) => setTimeout(res, 1500));
        r.continue();
      });
    },
  });
  try {
    await page.waitForTimeout(2500);
    const cls = await page.evaluate(() => window.__cls);
    console.log(`CLS medido: ${cls.toFixed(4)}`);
    assert.ok(cls <= 0.02, `CLS ${cls}`);
  } finally {
    await browser.close();
  }
});

// ---------- Estructura de la página en móvil (rediseño): formulario arriba, página corta, hero sin hueco

test('móvil: formulario antes de 2,5 pantallas, página de 10 pantallas como mucho y reels del hero a la vista', { skip, timeout: 60000 }, async () => {
  // 390x844 (iPhone con Safari) y 375x667 (iPhone SE), con el user agent de Instagram.
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
    const { browser, page, log } = await open(pw.webkit, { ...MOBILE, viewport });
    try {
      const m = await page.evaluate(() => {
        const box = (sel) => {
          const r = document.querySelector(sel).getBoundingClientRect();
          return { top: r.top + scrollY, bottom: r.bottom + scrollY };
        };
        return {
          height: document.documentElement.scrollHeight,
          form: box('#formulario').top,
          cta: box('[data-hero-cta]'),
          note: box('.hero-note'),
          reels: box('.hero-visual'),
          main: box('.hero-visual .rc-main'),
          band: box('.band').top,
          heroEnd: box('.hero').bottom,
        };
      });
      const H = viewport.height;
      const where = `${viewport.width}x${H}`;
      if (H === 844) {
        assert.ok(m.form < 2.5 * H, `${where}: el formulario empieza en ${m.form} (más de 2,5 pantallas)`);
        assert.ok(m.height <= 10 * H, `${where}: la página mide ${(m.height / H).toFixed(2)} pantallas`);
      }
      // CTA y nota enteros en el primer pantallazo, y la parte de arriba de los reels también.
      assert.ok(m.cta.bottom <= H && m.note.bottom <= H, `${where}: CTA o nota fuera del primer pantallazo`);
      assert.ok(m.main.top < H - 40, `${where}: los reels del hero empiezan en ${m.main.top}`);
      // Sin hueco: las cifras empiezan donde acaba el hero.
      assert.ok(Math.abs(m.band - m.heroEnd) < 1, `${where}: hueco entre el hero y las cifras`);
      // Todas las capturas de reels con el mismo recorte 4:5.
      const ratios = await page.$$eval('.rc-img img', (imgs) => imgs.map((i) => Number(i.getAttribute('width')) / Number(i.getAttribute('height'))));
      assert.ok(ratios.length >= 14 && ratios.every((r) => Math.abs(r - 0.8) < 0.01), `recortes distintos: ${ratios}`);
      // A los 3 s el banner no tapa el CTA ni la nota.
      await page.waitForTimeout(3300);
      if (await page.isVisible('#ck')) {
        const ck = await page.locator('#ck').boundingBox();
        const note = await page.locator('.hero-note').boundingBox();
        assert.ok(note.y + note.height <= ck.y, `${where}: el banner tapa el CTA o la nota`);
      }
      assert.deepEqual(log.errors, []);
    } finally {
      await browser.close();
    }
  }
});

// ---------- Revisión a fondo: todos los caminos del formulario y del resto de componentes

test('formulario: validaciones de cada paso y prefijos', { skip, timeout: 90000 }, async () => {
  const { browser, page, log } = await open(pw.webkit, { ...MOBILE, locale: 'es-MX' });
  try {
    await page.locator('#formulario').scrollIntoViewIfNeeded();
    // Prefijo detectado por el idioma del navegador (es-MX → +52).
    assert.equal(await page.inputValue('#f-prefijo'), 'MX');
    assert.equal(await page.textContent('[data-prefix-label]'), '+52');
    // Paso 1 con Enter sin elegir: no avanza.
    await page.focus('input[name="servicio"][value="redes"]');
    await page.keyboard.press('Enter');
    assert.equal(await page.isVisible('[data-step="1"]'), true);
    await page.locator('.lf-opt', { hasText: 'Meta Ads' }).click();
    // Paso 2: "Otro" obligatorio solo en ese caso, mínimo 2 letras.
    await page.locator('.lf-chip', { hasText: 'Otro' }).click();
    assert.equal(await page.isVisible('#f-otro'), true);
    await page.locator('[data-step="2"] [data-next]').click();
    assert.equal(await page.textContent('#e-otro'), 'Cuéntame a qué te dedicas.');
    await page.fill('#f-otro', 'a');
    assert.equal(await page.textContent('#e-otro'), 'Cuéntame a qué te dedicas.');
    await page.fill('#f-otro', 'Academia');
    assert.equal(await page.textContent('#e-otro'), '');
    // Cambiar a un sector normal oculta "Otro" y avanza solo.
    await page.locator('.lf-chip', { hasText: 'Belleza y estética' }).click();
    await page.locator('[data-step="3"]').waitFor({ state: 'visible' });
    // Paso 3: vacío no; "no tengo" sí (se guarda tal cual).
    await page.locator('[data-step="3"] [data-next]').click();
    assert.equal(await page.textContent('#e-perfil'), 'Escribe tu Instagram, tu TikTok o tu web.');
    await page.fill('#f-perfil', 'no tengo');
    await page.locator('[data-step="3"] [data-next]').click();
    // Paso 4: mínimo 2 letras.
    await page.fill('#f-nombre', 'A');
    await page.locator('[data-step="4"] [data-next]').click();
    assert.equal(await page.textContent('#e-nombre'), 'Escribe tu nombre.');
    await page.fill('#f-nombre', 'PRUEBA');
    await page.locator('[data-step="4"] [data-next]').click();
    // Paso 5: México (10 cifras), España (móvil) y "Otro" (con prefijo).
    await page.fill('#f-tel', '55 1234');
    await page.click('[data-submit]');
    assert.equal(await page.textContent('#e-tel'), 'Revisa el número: parece que le faltan o le sobran cifras.');
    await page.selectOption('#f-prefijo', 'ES');
    assert.equal(await page.textContent('[data-prefix-label]'), '+34');
    await page.fill('#f-tel', '912 345 678');
    assert.match(await page.textContent('#e-tel'), /empieza por 6 o 7/);
    await page.selectOption('#f-prefijo', 'OTRO');
    assert.equal(await page.textContent('[data-prefix-label]'), 'Otro');
    assert.equal(await page.getAttribute('#f-tel', 'placeholder'), '+44 7911 123456');
    await page.fill('#f-tel', '+44 7911 123456');
    assert.equal(await page.textContent('#e-tel'), '');
    await page.click('[data-ck="reject"]').catch(() => {});
    await page.click('[data-submit]');
    await page.locator('[data-done]').waitFor({ state: 'visible', timeout: 9000 });
    const lead = log.leads.at(-1);
    assert.deepEqual([lead.servicio, lead.sector, lead.sector_otro, lead.perfil, lead.prefijo], ['ads', 'belleza', '', 'no tengo', 'OTRO']);
    const row = sheetState.calls.at(-1).lead;
    assert.deepEqual([row.whatsapp, row.negocio, row.perfil, row.perfil_url], ['+447911123456', 'Belleza y estética', 'no tengo', '']);
    assert.deepEqual(log.errors, []);
  } finally {
    await browser.close();
  }
});

test('formulario: borrador al recargar, doble clic, mínimo de 3 s y Contact una sola vez', { skip, timeout: 90000 }, async () => {
  const { browser, page, log } = await open(pw.chromium, DESKTOP);
  try {
    await page.locator('#formulario').scrollIntoViewIfNeeded();
    await page.locator('.lf-opt', { hasText: 'Gestión de redes sociales' }).click();
    await page.locator('.lf-chip', { hasText: 'Restauración' }).click();
    await page.fill('#f-perfil', '@prueba');
    await page.locator('[data-step="3"] [data-next]').click();
    // Recargar a mitad: vuelve al mismo paso con las respuestas.
    await page.reload();
    await page.locator('[data-step="4"]').waitFor({ state: 'visible' });
    assert.equal(await page.isChecked('input[name="sector"][value="restauracion"]'), true);
    assert.equal(await page.inputValue('#f-perfil'), '@prueba');
    await page.click('[data-back]');
    await page.click('[data-back]');
    assert.equal(await page.isVisible('[data-step="2"]'), true);
    assert.equal(await page.isChecked('input[name="sector"][value="restauracion"]'), true);
    await page.click('[data-back]');
    await page.click('[data-back]').catch(() => {});
    // Recorrido rápido: el envío espera al mínimo de 3 s desde que se abrió el formulario.
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await page.locator('#formulario').scrollIntoViewIfNeeded();
    await page.locator('.lf-opt', { hasText: 'Gestión de redes sociales' }).click();
    await page.locator('.lf-chip', { hasText: 'Restauración' }).click();
    await page.fill('#f-perfil', '@prueba');
    await page.keyboard.press('Enter');
    await page.fill('#f-nombre', 'PRUEBA');
    await page.keyboard.press('Enter');
    await page.fill('#f-tel', '600000000');
    const before = log.leads.length;
    // Momento en que la app dio el formulario por abierto (lo guarda en el borrador).
    const t0 = await page.evaluate(() => JSON.parse(sessionStorage.getItem('aas_form')).t0);
    const sent = page.waitForRequest('**/api/lead');
    await page.locator('[data-submit]').dblclick();
    await sent;
    const sentAt = await page.evaluate(() => Date.now());
    assert.ok(sentAt - t0 >= 3000, `se respeta el mínimo de 3 s (${sentAt - t0} ms)`);
    await page.locator('[data-done]').waitFor({ state: 'visible', timeout: 9000 });
    await page.waitForTimeout(2000); // redirección a WhatsApp
    assert.equal(log.leads.length - before, 1, 'el doble clic no duplica el envío');
    const contacts = () => log.events.filter((e) => e.event_name === 'Contact').length;
    assert.equal(contacts(), 1);
    await page.goBack();
    await page.locator('[data-done]').waitFor({ state: 'visible' });
    await page.click('[data-wa]');
    await page.waitForTimeout(800);
    assert.equal(contacts(), 1, 'Contact no se repite al volver y pulsar Abrir WhatsApp');
    assert.ok(log.leads.at(-1).elapsed_ms >= 3000);
  } finally {
    await browser.close();
  }
});

test('cookies: rechazar se recuerda, configurar activa y desactivar revoca', { skip, timeout: 60000 }, async () => {
  const { browser, page } = await open(pw.chromium, DESKTOP);
  try {
    await page.evaluate(() => scrollTo(0, 300));
    await page.click('[data-ck="reject"]');
    await page.reload();
    await page.evaluate(() => scrollTo(0, 300));
    await page.waitForTimeout(3300);
    assert.equal(await page.isVisible('#ck'), false, 'la decisión se recuerda');
    assert.equal(await page.evaluate(() => window.__vercelScripts || 0), 0, 'rechazar: sin analítica');
    // Solo analítica: carga Vercel Analytics y no el píxel.
    await page.click('.ftr [data-open-cookies]');
    assert.equal(await page.isVisible('#ck-panel'), true);
    assert.equal(await page.isChecked('#ck-ana'), false);
    assert.equal(await page.isChecked('#ck-mkt'), false);
    assert.equal(await page.isChecked('#ck-srv'), true, '«Rechazar» no es oponerse a la medición por servidor');
    await page.check('#ck-ana');
    await page.click('[data-ck="save"]');
    await page.waitForFunction(() => window.__vercelScripts === 2);
    assert.equal(await page.evaluate(() => typeof window.fbq), 'undefined', 'solo analítica: sin píxel');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('aas_consent')));
    assert.deepEqual([stored.v, stored.analytics, stored.marketing, stored.optout], [2, true, false, false]);
    assert.deepEqual(stored.cats, ['analytics', 'marketing', 'server']);
    // La analítica envía mientras está aceptada (beforeSend devuelve el evento sin el fbclid)...
    const sendWith = () => page.evaluate(() => {
      const fn = window.vaq.find((a) => a[0] === 'beforeSend')[1];
      return fn({ type: 'pageview', url: 'https://vsl.aasmarketing.com/?utm_source=ig&fbclid=abc' });
    });
    assert.equal((await sendWith()).url, 'https://vsl.aasmarketing.com/?utm_source=ig');
    // Y ahora también marketing.
    await page.click('.ftr [data-open-cookies]');
    assert.equal(await page.isChecked('#ck-ana'), true);
    await page.check('#ck-mkt');
    await page.click('[data-ck="save"]');
    await page.waitForFunction(() => Array.isArray(window.__fbq));
    assert.ok((await page.context().cookies()).some((c) => c.name === '_fbp'));
    await page.click('.ftr [data-open-cookies]');
    assert.equal(await page.isChecked('#ck-mkt'), true);
    await page.uncheck('#ck-mkt');
    await page.uncheck('#ck-ana');
    await page.click('[data-ck="save"]');
    await page.waitForTimeout(200);
    assert.ok(!(await page.context().cookies()).some((c) => c.name.startsWith('_fb')), 'se borran _fbp y _fbc');
    assert.ok((await page.evaluate(() => window.__fbq)).some((c) => c[0] === 'consent' && c[1] === 'revoke'));
    // ...y al retirarla deja de enviar en esa misma página.
    assert.equal(await sendWith(), null);
  } finally {
    await browser.close();
  }
});

test('componentes: bucles de cifras, cuentas y opiniones, FAQ con schema, "Leer más" y saltar al formulario', { skip, timeout: 60000 }, async () => {
  const { browser, page, log } = await open(pw.chromium, DESKTOP);
  try {
    // Saltar al formulario: primer elemento con Tab.
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    // Espera a que termine el scroll suave.
    let top = Infinity;
    for (let i = 0, last = -1; i < 40; i++) {
      top = await page.locator('#formulario').evaluate((el) => el.getBoundingClientRect().top);
      if (top === last) break;
      last = top;
      await page.waitForTimeout(150);
    }
    assert.ok(Math.abs(top) < 120, `el formulario queda arriba (${top})`);
    // Bucles: cifras y cuentas hacia la izquierda, opiniones hacia la derecha.
    // Sin botón de pausa ni flechas; la copia que cierra el bucle no se lee
    // dos veces ni mete botones en el orden del tabulador.
    assert.equal(await page.locator('video').count(), 0);
    assert.equal(await page.locator('[data-marquee-toggle], .car-nav, [data-carousel]').count(), 0);
    const x = (sel) => page.locator(`${sel} .mq-track`).first().evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
    await page.locator('.loop-reviews').scrollIntoViewIfNeeded();
    await page.mouse.move(5, 5); // sin el ratón encima
    const x0 = { band: await x('.band'), acc: await x('.loop-accounts'), rev: await x('.loop-reviews') };
    await page.waitForTimeout(800);
    assert.ok((await x('.band')) < x0.band, 'las cifras no van a la izquierda');
    assert.ok((await x('.loop-accounts')) < x0.acc, 'las cuentas no van a la izquierda');
    assert.ok((await x('.loop-reviews')) > x0.rev, 'las opiniones no van a la derecha');
    for (const sel of ['.band', '.loop-accounts', '.loop-reviews']) {
      assert.equal(await page.locator(`${sel} .mq-track`).nth(1).getAttribute('aria-hidden'), 'true', sel);
    }
    assert.equal(await page.locator('.mq-track[aria-hidden] button:not([tabindex="-1"])').count(), 0);
    // Con el ratón encima, las opiniones se paran y "Leer más" abre el texto entero.
    const more = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.loop-reviews [data-more]')].find((b) => {
        const r = b.getBoundingClientRect();
        return !b.hidden && getComputedStyle(b).visibility !== 'hidden' && r.left > 40 && r.right < innerWidth - 40 && r.top > 0 && r.bottom < innerHeight;
      });
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    assert.ok(more, 'no hay ningún "Leer más" a la vista');
    await page.mouse.move(more.x, more.y);
    const held = await x('.loop-reviews');
    await page.waitForTimeout(500);
    assert.equal(await x('.loop-reviews'), held, 'con el ratón encima siguen moviéndose');
    await page.mouse.click(more.x, more.y);
    assert.ok((await page.locator('.tcard[data-long]:not(.is-clamped)').count()) >= 1, '"Leer más" no abre el texto');
    // FAQ en acordeón y schema FAQPage con las mismas preguntas.
    const first = page.locator('.faq-item').first();
    await first.locator('summary').click();
    assert.equal(await first.evaluate((d) => d.open), true);
    const schema = JSON.parse(await page.textContent('script[type="application/ld+json"]'));
    const visible = await page.$$eval('.faq-item summary', (s) => s.map((x) => x.textContent.trim()));
    assert.equal(schema['@type'], 'FAQPage');
    assert.deepEqual(schema.mainEntity.map((q) => q.name), visible);
    assert.deepEqual(log.errors, []);
  } finally {
    await browser.close();
  }
});

test('sin JavaScript, con movimiento reducido, en horizontal y en las páginas legales', { skip, timeout: 90000 }, async () => {
  // Sin JS: se lee todo con estilos (main.css por <noscript>) y el formulario avisa.
  let ctx = await open(pw.chromium, { ...DESKTOP, javaScriptEnabled: false });
  assert.equal(await ctx.page.locator('.mq-track').first().evaluate((el) => getComputedStyle(el).display), 'flex');
  assert.equal(await ctx.page.isVisible('#ck'), false);
  assert.match(await ctx.page.textContent('[data-form]'), /activar JavaScript/);
  await ctx.browser.close();
  // Movimiento reducido: sin animaciones y las cifras quietas (se deslizan con el dedo).
  ctx = await open(pw.webkit, { ...MOBILE, reducedMotion: 'reduce' });
  const dur = await ctx.page.locator('.btn').first().evaluate((el) => getComputedStyle(el).transitionDuration);
  assert.ok(parseFloat(dur) < 0.01, dur);
  assert.equal(await ctx.page.locator('.mq-track').first().evaluate((el) => getComputedStyle(el).animationName), 'none');
  assert.equal(await ctx.page.isVisible('.mq-track[aria-hidden]'), false);
  await ctx.browser.close();
  // Móvil en horizontal: sin scroll lateral.
  ctx = await open(pw.webkit, { ...MOBILE, viewport: { width: 844, height: 390 } });
  assert.equal(await ctx.page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
  await ctx.browser.close();
  // Legales: cargan, el header lleva al formulario de la landing y no hay CTA fijo.
  ctx = await open(pw.webkit, MOBILE, { url: base + 'privacidad' });
  assert.equal(await ctx.page.getAttribute('.hdr .btn', 'href'), '/#formulario');
  assert.equal(await ctx.page.locator('[data-sticky]').count(), 0);
  for (const href of await ctx.page.$$eval('a[href^="/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))])) {
    const r = await fetch(new URL(href, base));
    assert.equal(r.status, 200, href);
  }
  assert.deepEqual(ctx.log.errors, []);
  await ctx.browser.close();
});

test('"Enviar otra solicitud" antes de 1,5 s cancela la apertura de WhatsApp', { skip, timeout: 60000 }, async () => {
  const { browser, page, log } = await open(pw.webkit, MOBILE);
  try {
    await page.evaluate(() => scrollTo(0, 300));
    await page.click('[data-ck="reject"]');
    await fillForm(page, { otro: false });
    await page.click('[data-submit]');
    await page.locator('[data-done]').waitFor({ state: 'visible', timeout: 9000 });
    await page.click('[data-again]');
    await page.waitForTimeout(2500);
    assert.deepEqual(log.wa, [], 'no debe abrir WhatsApp');
    assert.equal(await page.isVisible('[data-step="1"]'), true);
    assert.equal(log.events.filter((e) => e.event_name === 'Contact').length, 0);
  } finally {
    await browser.close();
  }
});

test('cookies: panel con «Rechazar todo», «Aceptar todo» y «Guardar selección», foco y Escape', { skip, timeout: 60000 }, async () => {
  const { browser, page, log } = await open(pw.chromium, DESKTOP);
  try {
    await page.locator('#ck').waitFor({ state: 'visible', timeout: 6000 });
    assert.equal(await page.textContent('[data-ck="reject"]'), 'Rechazar');
    assert.equal(await page.isVisible('[data-ck="save"]'), false);
    // El banner habla de la medición por servidor aunque se rechace.
    assert.match(await page.textContent('#ck p'), /Aunque rechaces, mi servidor envía a Meta datos de tu visita/);
    await page.click('[data-ck="config"]');
    assert.equal(await page.textContent('[data-ck="reject"]'), 'Rechazar todo');
    assert.equal(await page.textContent('[data-ck="accept"]'), 'Aceptar todo');
    assert.equal(await page.isVisible('[data-ck="config"]'), false);
    assert.equal(await page.isVisible('[data-ck="save"]'), true);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'ck-ana', 'el foco va al primer interruptor');
    // Sin decisión, Escape solo pliega el panel.
    await page.keyboard.press('Escape');
    assert.equal(await page.isVisible('#ck-panel'), false);
    assert.equal(await page.isVisible('#ck'), true);
    // «Rechazar todo» con el panel abierto también es oponerse a la medición por servidor.
    await page.click('[data-ck="config"]');
    await page.click('[data-ck="reject"]');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('aas_consent')));
    assert.deepEqual([stored.analytics, stored.marketing, stored.optout], [false, false, true]);
    // Desde el pie: al cerrar con Escape, el foco vuelve a «Configurar cookies».
    await page.focus('.ftr [data-open-cookies]');
    await page.keyboard.press('Enter');
    assert.equal(await page.isVisible('#ck-panel'), true);
    assert.equal(await page.isChecked('#ck-srv'), false);
    await page.keyboard.press('Escape');
    assert.equal(await page.isVisible('#ck'), false);
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Configurar cookies');
    assert.deepEqual(log.errors, []);
  } finally {
    await browser.close();
  }
});

test('oposición a la medición por servidor: nada a Meta hasta que acepten', { skip, timeout: 60000 }, async () => {
  const { browser, page, log } = await open(pw.chromium, DESKTOP, { url: `${base}?utm_source=ig&fbclid=IwAR0prueba` });
  try {
    await page.locator('#ck').waitFor({ state: 'visible', timeout: 6000 });
    assert.equal(log.events.filter((e) => e.event_name === 'PageView').length, 1, 'PageView por servidor antes de decidir');
    await page.click('[data-ck="config"]');
    await page.uncheck('#ck-srv');
    await page.click('[data-ck="save"]');
    const before = log.events.length;
    // ViewContent y Lead después de oponerse: no salen por servidor ni llevan identificadores.
    await fillForm(page, { otro: false });
    await page.waitForTimeout(400);
    assert.equal(log.events.length, before, 'nada por /api/event tras oponerse');
    // El enlace «Configurar cookies» del aviso del formulario abre el mismo panel.
    await page.click('.lf-legal [data-open-cookies]');
    assert.equal(await page.isVisible('#ck-panel'), true);
    assert.equal(await page.isChecked('#ck-srv'), false);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.closest('.lf-legal') !== null), true, 'el foco vuelve al enlace');
    await page.click('[data-submit]');
    await page.locator('[data-done]').waitFor({ state: 'visible', timeout: 9000 });
    const lead = log.leads.at(-1);
    assert.deepEqual([lead.optout, lead.consent, lead.fbp, lead.fbc, lead.fbclid, lead.utm_source], [true, false, '', '', '', 'ig']);
    assert.equal(log.events.filter((e) => e.event_name === 'Contact').length, 0);
  } finally {
    await browser.close();
  }
  // Si después acepta todo, lo que no salió por servidor sale entonces (con el mismo event_id que el píxel).
  const second = await open(pw.chromium, DESKTOP);
  try {
    await second.page.locator('#ck').waitFor({ state: 'visible', timeout: 6000 });
    await second.page.click('[data-ck="config"]');
    await second.page.uncheck('#ck-srv');
    await second.page.click('[data-ck="save"]');
    await second.page.locator('#formulario').scrollIntoViewIfNeeded();
    await second.page.waitForTimeout(400);
    const pending = second.log.events.length;
    await second.page.click('.ftr [data-open-cookies]');
    await second.page.click('[data-ck="accept"]');
    await second.page.waitForFunction(() => Array.isArray(window.__fbq) && window.__fbq.some((c) => c[1] === 'ViewContent'));
    await second.page.waitForTimeout(300);
    const late = second.log.events.slice(pending);
    const vc = late.find((e) => e.event_name === 'ViewContent');
    assert.ok(vc && !vc.replay && vc.consent === true && vc.optout === false, JSON.stringify(late));
    const pixelVc = (await second.page.evaluate(() => window.__fbq)).find((c) => c[0] === 'track' && c[1] === 'ViewContent');
    assert.equal(pixelVc[3].eventID, vc.event_id);
  } finally {
    await second.browser.close();
  }
});

test('cookies: la decisión se sincroniza entre pestañas', { skip, timeout: 60000 }, async () => {
  const { browser, context, page: a } = await open(pw.chromium, DESKTOP);
  try {
    const b = await context.newPage();
    await b.goto(base, { waitUntil: 'load' });
    await a.locator('#ck').waitFor({ state: 'visible', timeout: 6000 });
    await a.click('[data-ck="accept"]');
    // La otra pestaña quita su banner y carga el píxel sin recargar.
    await b.waitForFunction(() => Array.isArray(window.__fbq) && window.__fbq.some((c) => c[0] === 'track' && c[1] === 'PageView'));
    assert.equal(await b.isVisible('#ck'), false);
    await a.click('.ftr [data-open-cookies]');
    await a.click('[data-ck="reject"]'); // «Rechazar todo»
    await b.waitForFunction(() => window.__fbq.some((c) => c[0] === 'consent' && c[1] === 'revoke'));
    assert.equal(await b.evaluate(() => JSON.parse(localStorage.getItem('aas_consent')).marketing), false);
  } finally {
    await browser.close();
  }
});

test('móvil pequeño (320x480): el banner no tapa el botón del hero', { skip, timeout: 60000 }, async () => {
  const { browser, page, log } = await open(pw.webkit, { ...MOBILE, viewport: { width: 320, height: 480 } });
  try {
    await page.waitForTimeout(3500);
    assert.equal(await page.isVisible('#ck'), false, 'a los 3 s taparía el CTA: espera');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.locator('#ck').waitFor({ state: 'visible', timeout: 3000 });
    const ck = await page.locator('#ck').boundingBox();
    const cta = await page.locator('[data-hero-cta]').boundingBox();
    assert.ok(cta.y + cta.height <= ck.y || cta.y + cta.height <= 0, 'el banner no solapa el CTA');
    // Con el panel abierto cabe en la pantalla (se desplaza por dentro si hace falta).
    await page.click('[data-ck="config"]');
    const panel = await page.locator('#ck').boundingBox();
    assert.ok(panel.y >= 0 && panel.y + panel.height <= 480, `el panel se sale (${panel.y}, ${panel.height})`);
    assert.deepEqual(log.errors, []);
  } finally {
    await browser.close();
  }
});

test('reintento con la decisión vigente: si se opone después de enviar, el reenvío va con la oposición', { skip, timeout: 60000 }, async () => {
  sheetState.mode = 'ok';
  const browser = await pw.chromium.launch();
  const context = await browser.newContext(DESKTOP);
  await context.route('https://connect.facebook.net/**', (r) => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await context.route('https://wa.me/**', (r) => r.fulfill({ contentType: 'text/html', body: 'wa' }));
  try {
    const page = await context.newPage();
    await page.route('**/api/lead', (r) => r.abort('internetdisconnected'));
    await page.goto(`${base}?utm_source=ig&fbclid=IwAR0prueba`);
    await page.locator('#ck').waitFor({ state: 'visible', timeout: 6000 });
    await page.click('[data-ck="accept"]');
    await fillForm(page, { otro: false });
    await page.click('[data-submit]');
    await page.locator('[data-done]').waitFor({ state: 'visible', timeout: 9000 });
    await page.click('[data-again]'); // antes de 1,5 s: no abre WhatsApp y seguimos en la página
    let copy = await page.evaluate(() => JSON.parse(localStorage.getItem('aas_pending'))[0].p);
    assert.deepEqual([copy.consent, copy.optout, !!copy.fbp, copy.utm_source], [true, false, true, 'ig'], 'con consentimiento la copia va completa');
    // Después de enviar, se opone y retira el marketing: la copia guardada se recorta al momento.
    await page.click('.ftr [data-open-cookies]');
    await page.click('[data-ck="reject"]'); // «Rechazar todo»
    copy = await page.evaluate(() => JSON.parse(localStorage.getItem('aas_pending'))[0].p);
    assert.deepEqual([copy.consent, copy.optout, copy.fbp, copy.fbc, copy.fbclid, copy.utm_source, copy.page_url], [false, true, '', '', '', '', base]);
    // Siguiente visita con red: el reenvío lleva la oposición.
    await page.unroute('**/api/lead');
    const next = await context.newPage();
    const retried = next.waitForRequest((r) => r.url().endsWith('/api/lead'), { timeout: 15000 });
    await next.goto(base);
    const body = JSON.parse((await retried).postData());
    assert.deepEqual([body.optout, body.consent, body.fbp], [true, false, '']);
    await next.waitForFunction(() => !localStorage.getItem('aas_pending'), null, { timeout: 15000 });
  } finally {
    await browser.close();
  }
});

test('la oposición no caduca con la decisión: sin envíos por servidor aunque vuelva a salir el banner', { skip, timeout: 60000 }, async () => {
  const old = Date.now() - 800 * 24 * 3600 * 1000; // decisión de hace más de 24 meses
  const { browser, page, log } = await open(pw.chromium, DESKTOP, {
    before: (p, ctx) => ctx.addInitScript((ts) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('aas_consent', JSON.stringify({ v: 2, analytics: false, marketing: false, optout: true, cats: ['analytics', 'marketing', 'server'], ts }));
      localStorage.setItem('aas_optout', JSON.stringify({ ts }));
    }, old),
  });
  try {
    await page.locator('#ck').waitFor({ state: 'visible', timeout: 6000 });
    assert.equal(await page.evaluate(() => localStorage.getItem('aas_consent')), null, 'la decisión caducada se borra');
    assert.equal(log.events.length, 0, 'nada por servidor: la oposición sigue');
    await page.click('[data-ck="config"]');
    assert.equal(await page.isChecked('#ck-srv'), false);
    await page.keyboard.press('Escape');
    await page.click('[data-ck="reject"]'); // «Rechazar» con el banner cerrado no borra la oposición
    assert.ok(await page.evaluate(() => localStorage.getItem('aas_optout')));
    await page.locator('#formulario').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    assert.equal(log.events.length, 0);
  } finally {
    await browser.close();
  }
});

test('retirar y volver a aceptar no repite eventos en el píxel', { skip, timeout: 60000 }, async () => {
  const { browser, page, log } = await open(pw.chromium, DESKTOP);
  try {
    await page.locator('#ck').waitFor({ state: 'visible', timeout: 6000 });
    await page.click('[data-ck="accept"]');
    await page.waitForFunction(() => Array.isArray(window.__fbq) && window.__fbq.some((c) => c[0] === 'track'));
    await page.click('.ftr [data-open-cookies]');
    await page.uncheck('#ck-mkt');
    await page.click('[data-ck="save"]');
    await page.click('.ftr [data-open-cookies]');
    await page.click('[data-ck="accept"]'); // «Aceptar todo»
    await page.waitForTimeout(300);
    const calls = await page.evaluate(() => window.__fbq);
    const pageViews = calls.filter((c) => c[0] === 'track' && c[1] === 'PageView');
    assert.equal(pageViews.length, 1, JSON.stringify(calls));
    // Por servidor: el PageView de la carga y un solo aviso de repetición (el servidor
    // lo ignora con CAPI_WITHOUT_CONSENT=true), no uno por cada vez que se acepta.
    const pv = log.events.filter((e) => e.event_name === 'PageView');
    assert.deepEqual(pv.map((e) => !!e.replay), [false, true]);
    assert.deepEqual(log.errors, []);
  } finally {
    await browser.close();
  }
});
