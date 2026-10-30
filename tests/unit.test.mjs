// Pruebas unitarias (node --test). Sin dependencias.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { normalizePhone, detectCountry, OTHER } from '../shared/phone.js';
import { normalizeProfile } from '../shared/profile.js';
import { buildLead, pageOnly, countryFor } from '../lib/lead.js';
import { leadUserData, normalizeName, eventTime, cleanFbc, cleanFbp, sendEvent, capiAllowed, pixelId, PRODUCTION_PIXEL_ID } from '../lib/meta.js';
import { saveToSheet } from '../lib/sheet.js';
import leadApi from '../api/lead.js';
import eventApi from '../api/event.js';

const sha = (v) => createHash('sha256').update(v).digest('hex');

test('teléfono: móviles españoles y E.164', () => {
  assert.deepEqual(normalizePhone('600 123 456', 'ES'), { ok: true, e164: '+34600123456' });
  assert.deepEqual(normalizePhone('712-345-678', 'ES'), { ok: true, e164: '+34712345678' });
  assert.equal(normalizePhone('+34 600 123 456', 'ES').e164, '+34600123456');
  assert.equal(normalizePhone('0034600123456', 'ES').e164, '+34600123456');
  assert.equal(normalizePhone('34600123456', 'ES').e164, '+34600123456');
  assert.equal(normalizePhone('912345678', 'ES').error, 'es'); // fijo
  assert.equal(normalizePhone('60012345', 'ES').error, 'es');
  assert.equal(normalizePhone('', 'ES').error, 'empty');
});

test('teléfono: otros países y "Otro"', () => {
  assert.equal(normalizePhone('55 1234 5678', 'MX').e164, '+525512345678');
  assert.equal(normalizePhone('11 2345 6789', 'AR').e164, '+541123456789');
  assert.equal(normalizePhone('123', 'MX').error, 'len');
  assert.equal(normalizePhone('+44 7911 123456', OTHER).e164, '+447911123456');
  assert.equal(normalizePhone('7911 123456', OTHER).e164, '+7911123456');
  assert.equal(normalizePhone('123', OTHER).error, 'intl');
  assert.equal(normalizePhone('+44 7911 123456', 'ES').e164, '+447911123456');
});

test('prefijo detectado por el idioma', () => {
  assert.equal(detectCountry(['es-ES', 'es']), 'ES');
  assert.equal(detectCountry(['es-MX']), 'MX');
  assert.equal(detectCountry(['en-GB', 'es-AR']), 'AR');
  assert.equal(detectCountry(['ca-ES', 'en-US']), 'ES');
  assert.equal(detectCountry(['es-419']), 'ES');
});

test('perfil: Instagram, TikTok, web y texto', () => {
  const ig = { ok: true, kind: 'instagram', display: '@pepe.garcia', url: 'https://www.instagram.com/pepe.garcia/' };
  assert.deepEqual(normalizeProfile('@Pepe.Garcia'), ig);
  assert.deepEqual(normalizeProfile('pepe.garcia'), ig);
  assert.deepEqual(normalizeProfile('https://www.instagram.com/pepe.garcia/?igsh=abc123'), ig);
  assert.deepEqual(normalizeProfile('instagram.com/pepe.garcia'), ig);
  assert.equal(normalizeProfile('mi insta es @pepe.garcia').display, '@pepe.garcia');
  const tk = normalizeProfile('tiktok.com/@pepe');
  assert.equal(tk.kind, 'tiktok');
  assert.equal(tk.display, 'tiktok.com/@pepe');
  assert.equal(tk.url, 'https://tiktok.com/@pepe');
  const web = normalizeProfile('minegocio.es');
  assert.deepEqual([web.kind, web.display, web.url], ['web', 'minegocio.es', 'https://minegocio.es/']);
  assert.equal(normalizeProfile('https://www.instagram.com/p/Cx1/').kind, 'web');
  assert.deepEqual(normalizeProfile('Peluquería Ana'), { ok: true, kind: 'text', display: 'Peluquería Ana', url: '' });
  assert.equal(normalizeProfile('javascript:alert(1)').url, '');
  assert.equal(normalizeProfile(' ').ok, false);
});

test('fila del Sheet: columnas y sin IDs de Meta', () => {
  const { lead } = buildLead({
    nombre: '  PRUEBA ', servicio: 'ambas', sector: 'otro', sector_otro: 'Escuela de música',
    perfil: 'instagram.com/prueba', prefijo: 'ES', telefono: '600 000 000',
    utm_source: 'facebook', utm_medium: 'paid', utm_campaign: 'cerrar',
    page_url: 'https://vsl.aasmarketing.com/?fbclid=ABC&utm_source=facebook',
    fbclid: 'ABC', fbc: 'fb.1.1700000000000.ABC', fbp: 'fb.1.1700000000000.123', event_id: 'abc-123-def',
  });
  assert.deepEqual(Object.keys(lead), ['fecha', 'nombre', 'whatsapp', 'necesita', 'negocio', 'perfil', 'perfil_url', 'utm_source', 'utm_medium', 'utm_campaign', 'pagina']);
  assert.equal(lead.nombre, 'PRUEBA');
  assert.equal(lead.whatsapp, '+34600000000');
  assert.equal(lead.necesita, 'Las dos (redes y Meta Ads)');
  assert.equal(lead.negocio, 'Escuela de música');
  assert.equal(lead.perfil, '@prueba');
  assert.equal(lead.perfil_url, 'https://www.instagram.com/prueba/');
  assert.equal(lead.pagina, 'https://vsl.aasmarketing.com/');
  assert.ok(!JSON.stringify(lead).includes('ABC'), 'el fbclid no puede llegar al Sheet');
  assert.equal(buildLead({ sector: 'motor' }).lead.negocio, 'Motor y talleres');
  assert.equal(pageOnly('javascript:alert(1)'), '');
  assert.equal(countryFor('MX'), 'mx');
  assert.equal(countryFor(OTHER, '+447911123456'), '');
});

test('Meta: datos normalizados y hasheados con SHA-256', () => {
  const ud = leadUserData({ e164: '+34600000000', name: 'María José!', country: 'es' });
  assert.deepEqual(ud.ph, [sha('34600000000')]);
  assert.deepEqual(ud.fn, [sha('maría josé')]);
  assert.deepEqual(ud.country, [sha('es')]);
  assert.equal(normalizeName('  Ana-Belén 2 '), 'anabelén');
  assert.equal(cleanFbc('fb.1.1700000000000.IwAR123-abc_X'), 'fb.1.1700000000000.IwAR123-abc_X');
  assert.equal(cleanFbc('<script>'), '');
  assert.equal(cleanFbp('fb.1.1700000000000.1234567890'), 'fb.1.1700000000000.1234567890');
  const now = Math.floor(Date.now() / 1000);
  assert.ok(Math.abs(eventTime(undefined) - now) <= 1);
  assert.ok(Math.abs(eventTime(Date.now() - 3600_000) - (now - 3600)) <= 1);
  assert.ok(Math.abs(eventTime(Date.now() - 30 * 24 * 3600_000) - now) <= 1, 'más de 7 días: hora actual');
});

test('Meta: el píxel de AAS Marketing solo en Producción; META_PIXEL_ID lo cambia u "off" lo quita', () => {
  const saved = { id: process.env.META_PIXEL_ID, env: process.env.VERCEL_ENV };
  try {
    delete process.env.META_PIXEL_ID;
    delete process.env.VERCEL_ENV;
    assert.equal(pixelId(), '', 'en local, sin píxel');
    process.env.VERCEL_ENV = 'preview';
    assert.equal(pixelId(), '', 'en Preview, sin píxel');
    process.env.VERCEL_ENV = 'production';
    assert.equal(pixelId(), PRODUCTION_PIXEL_ID);
    assert.equal(PRODUCTION_PIXEL_ID, '1137027092146077');
    process.env.META_PIXEL_ID = '123456789012345';
    assert.equal(pixelId(), '123456789012345');
    process.env.META_PIXEL_ID = 'off';
    assert.equal(pixelId(), '');
    const warnings = [];
    process.env.META_PIXEL_ID = 'abc';
    assert.equal(pixelId((m) => warnings.push(m)), PRODUCTION_PIXEL_ID, 'un valor inválido se ignora');
    assert.equal(warnings.length, 1);
  } finally {
    for (const [k, v] of [['META_PIXEL_ID', saved.id], ['VERCEL_ENV', saved.env]]) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

test('Meta: sin variables no se envía nada y no falla', async () => {
  delete process.env.META_PIXEL_ID;
  delete process.env.META_CAPI_TOKEN;
  const r = await sendEvent({ name: 'PageView', id: 'abcdefgh-1', time: 1, url: 'https://x/' });
  assert.deepEqual(r, { sent: false, reason: 'not-configured' });
});

test('Meta: carga útil de la API de conversiones', async () => {
  process.env.META_PIXEL_ID = '123456789012345';
  process.env.META_CAPI_TOKEN = 'TOKEN';
  process.env.META_TEST_EVENT_CODE = 'TEST123';
  const realFetch = globalThis.fetch;
  let call;
  globalThis.fetch = async (url, init) => {
    call = { url: String(url), body: Object.fromEntries(init.body) };
    return new Response('{"events_received":1}', { status: 200 });
  };
  try {
    const r = await sendEvent({
      name: 'Lead', id: 'evt-12345678', time: 1700000000, url: 'https://vsl.aasmarketing.com/',
      ip: '1.2.3.4', ua: 'UA', fbc: 'fb.1.1.x', fbp: 'fb.1.1.2', userData: { ph: ['h'] }, customData: { content_name: 'Estrategia gratis' },
    });
    assert.equal(r.sent, true);
    // El token va en el cuerpo (campos de formulario), nunca en la URL.
    assert.match(call.url, /^https:\/\/graph\.facebook\.com\/v\d+\.0\/123456789012345\/events$/);
    assert.equal(call.body.access_token, 'TOKEN');
    assert.equal(call.body.test_event_code, 'TEST123');
    const e = JSON.parse(call.body.data)[0];
    assert.equal(e.event_name, 'Lead');
    assert.equal(e.event_id, 'evt-12345678');
    assert.equal(e.action_source, 'website');
    assert.equal(e.user_data.client_ip_address, '1.2.3.4');
    assert.equal(e.user_data.client_user_agent, 'UA');
    assert.deepEqual(e.user_data.ph, ['h']);
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.META_PIXEL_ID;
    delete process.env.META_CAPI_TOKEN;
    delete process.env.META_TEST_EVENT_CODE;
  }
});

test('Meta: la oposición manda siempre; sin ella, decide CAPI_WITHOUT_CONSENT', () => {
  delete process.env.CAPI_WITHOUT_CONSENT; // por defecto, true
  assert.equal(capiAllowed(false), true);
  assert.equal(capiAllowed(true), true);
  assert.equal(capiAllowed(false, true), false);
  assert.equal(capiAllowed(true, true), false);
  process.env.CAPI_WITHOUT_CONSENT = 'false';
  try {
    assert.equal(capiAllowed(false), false);
    assert.equal(capiAllowed(true), true);
    assert.equal(capiAllowed(true, true), false);
  } finally {
    delete process.env.CAPI_WITHOUT_CONSENT;
  }
});

// Servidor que hace de Apps Script.
function mockSheet(handler) {
  return new Promise((resolve) => {
    const calls = [];
    const server = http.createServer(async (req, res) => {
      let body = '';
      for await (const c of req) body += c;
      calls.push(JSON.parse(body || '{}'));
      handler(calls.length, res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, calls, url: `http://127.0.0.1:${server.address().port}/exec` }));
  });
}

test('Sheet: reintenta y acaba guardando', async () => {
  const { server, calls, url } = await mockSheet((n, res) => {
    if (n < 3) {
      res.writeHead(500);
      return res.end('error');
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{"ok":true}');
  });
  process.env.SHEET_WEBHOOK_URL = url;
  process.env.SHEET_SECRET = 's3cret';
  try {
    const r = await saveToSheet({ nombre: 'PRUEBA' }, 'dedupe1');
    assert.equal(r.saved, true);
    assert.equal(r.attempts, 3);
    assert.equal(calls[0].secret, 's3cret');
    assert.equal(calls[0].dedupe, 'dedupe1');
  } finally {
    server.close();
  }
});

test('Sheet: clave incorrecta no se reintenta', async () => {
  const { server, calls, url } = await mockSheet((n, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{"ok":false,"error":"secret"}');
  });
  process.env.SHEET_WEBHOOK_URL = url;
  try {
    const r = await saveToSheet({ nombre: 'PRUEBA' }, 'd');
    assert.deepEqual([r.saved, r.reason, calls.length], [false, 'secret', 1]);
  } finally {
    server.close();
  }
});

const post = (body, headers = {}) => new Request('https://vsl.aasmarketing.com/api/lead', {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: 'https://vsl.aasmarketing.com', host: 'vsl.aasmarketing.com', ...headers },
  body: JSON.stringify(body),
});

test('/api/lead: guarda, responde rápido y deja el lead en el log si falla', async () => {
  const { server, calls, url } = await mockSheet((n, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{"ok":true}');
  });
  process.env.SHEET_WEBHOOK_URL = url;
  process.env.SHEET_SECRET = 's3cret';
  try {
    const ok = await leadApi.fetch(post({
      event_id: 'evt-abcdef12', servicio: 'redes', sector: 'salud', perfil: '@prueba', nombre: 'PRUEBA',
      prefijo: 'ES', telefono: '600000000', elapsed_ms: 9000, hp: '',
    }));
    assert.deepEqual(await ok.json(), { ok: true, saved: true });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].lead.perfil, '@prueba');
    assert.equal(calls[0].dedupe, sha('evt-abcdef12').slice(0, 32));

    const spam = await leadApi.fetch(post({ nombre: 'Bot', telefono: '600000000', elapsed_ms: 500 }));
    assert.deepEqual(await spam.json(), { ok: true, saved: false });
    const trap = await leadApi.fetch(post({ nombre: 'Bot', telefono: '600000000', elapsed_ms: 9000, hp: 'http://spam' }));
    assert.deepEqual(await trap.json(), { ok: true, saved: false });
    assert.equal(calls.length, 1, 'el spam no llega al Sheet');

    const big = await leadApi.fetch(post({ nombre: 'x'.repeat(20000) }));
    assert.equal(big.status, 413);
    const get = await leadApi.fetch(new Request('https://vsl.aasmarketing.com/api/lead'));
    assert.equal(get.status, 405);
  } finally {
    server.close();
  }
});

test('/api/lead: si no se guarda en ningún sitio responde 503 para que el navegador reintente', async () => {
  const { server, url } = await mockSheet((n, res) => {
    res.writeHead(500);
    res.end('error');
  });
  process.env.SHEET_WEBHOOK_URL = url;
  process.env.SHEET_SECRET = 's3cret';
  const body = { event_id: 'evt-fail1234', servicio: 'redes', sector: 'salud', perfil: '@prueba', nombre: 'PRUEBA', prefijo: 'ES', telefono: '600000000', elapsed_ms: 9000 };
  try {
    const r = await leadApi.fetch(post(body));
    assert.equal(r.status, 503);
    assert.deepEqual(await r.json(), { ok: false, saved: false });
  } finally {
    server.close();
  }
  // Sin Sheet configurado (por ejemplo, en una preview) no hay nada que reintentar.
  delete process.env.SHEET_WEBHOOK_URL;
  const r = await leadApi.fetch(post({ ...body, event_id: 'evt-noconf12' }));
  assert.deepEqual([r.status, await r.json()], [200, { ok: true, saved: false }]);
});

test('/api/lead: con copia en BD, si el Sheet falla también responde 503 y la BD no duplica', async () => {
  const { server, url } = await mockSheet((n, res) => {
    res.writeHead(500);
    res.end('error');
  });
  process.env.SHEET_WEBHOOK_URL = url;
  process.env.SHEET_SECRET = 's3cret';
  process.env.LEADS_DB_ENABLED = 'true';
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'tok';
  const realFetch = globalThis.fetch;
  const redis = [];
  const seen = new Set();
  globalThis.fetch = async (u, init) => {
    if (String(u).startsWith('https://redis.example.test')) {
      const cmd = JSON.parse(init.body);
      redis.push(cmd);
      // EVAL con SET NX + LPUSH: 1 la primera vez, 0 si la clave ya existe.
      const first = !seen.has(cmd[3]);
      seen.add(cmd[3]);
      return new Response(JSON.stringify({ result: first ? 1 : 0 }), { status: 200 });
    }
    return realFetch(u, init);
  };
  const body = { event_id: 'evt-db123456', servicio: 'redes', sector: 'salud', perfil: '@prueba', nombre: 'PRUEBA', prefijo: 'ES', telefono: '600000000', elapsed_ms: 9000 };
  try {
    const r1 = await leadApi.fetch(post(body));
    assert.equal(r1.status, 503, 'el navegador debe reintentar: sin fila no hay correo');
    assert.deepEqual(await r1.json(), { ok: false, saved: true });
    await leadApi.fetch(post(body)); // reintento
    assert.equal(redis.length, 2);
    assert.equal(redis[0][0], 'EVAL');
    assert.equal(redis[0][3], `aas:lead:${sha('evt-db123456').slice(0, 32)}`);
    assert.equal(redis[0][4], 'leads');
    assert.equal(JSON.parse(redis[0][5]).nombre, 'PRUEBA');
  } finally {
    globalThis.fetch = realFetch;
    server.close();
    delete process.env.LEADS_DB_ENABLED;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  }
});

test('/api/lead: Lead a Meta salvo oposición', async () => {
  const { server, url } = await mockSheet((n, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{"ok":true}');
  });
  process.env.SHEET_WEBHOOK_URL = url;
  process.env.SHEET_SECRET = 's3cret';
  process.env.META_PIXEL_ID = '123456789012345';
  process.env.META_CAPI_TOKEN = 'TOKEN';
  const realFetch = globalThis.fetch;
  const graph = [];
  globalThis.fetch = async (u, init) => {
    if (String(u).startsWith('https://graph.facebook.com/')) {
      graph.push(JSON.parse(new URLSearchParams(init.body).get('data'))[0]);
      return new Response('{"events_received":1}', { status: 200 });
    }
    return realFetch(u, init);
  };
  const body = (extra) => ({ event_id: `evt-${Math.random().toString(36).slice(2, 12)}`, servicio: 'redes', sector: 'salud', perfil: '@prueba', nombre: 'PRUEBA', prefijo: 'ES', telefono: '600000000', elapsed_ms: 9000, ...extra });
  try {
    await leadApi.fetch(post(body({ consent: false })));
    assert.equal(graph.length, 1, 'sin cookies y sin oposición: Lead por servidor');
    assert.equal(graph[0].event_name, 'Lead');
    assert.ok(graph[0].user_data.ph, 'con el teléfono en hash');
    await leadApi.fetch(post(body({ consent: false, optout: true })));
    await leadApi.fetch(post(body({ consent: true, optout: true })));
    assert.equal(graph.length, 1, 'con oposición no se manda nada a Meta');
  } finally {
    globalThis.fetch = realFetch;
    server.close();
    delete process.env.META_PIXEL_ID;
    delete process.env.META_CAPI_TOKEN;
  }
});

test('/api/event: valida el evento y el origen', async () => {
  const ev = (body, origin = 'https://vsl.aasmarketing.com') => eventApi.fetch(new Request('https://vsl.aasmarketing.com/api/event', {
    method: 'POST', headers: { 'content-type': 'text/plain', origin, host: 'vsl.aasmarketing.com' }, body: JSON.stringify(body),
  }));
  assert.equal((await ev({ event_name: 'PageView', event_id: 'evt-12345678' })).status, 200);
  assert.equal((await ev({ event_name: 'Purchase', event_id: 'evt-12345678' })).status, 400);
  assert.equal((await ev({ event_name: 'PageView', event_id: 'x' })).status, 400);
  assert.equal((await ev({ event_name: 'PageView', event_id: 'evt-12345678' }, 'https://otra-web.com')).status, 403);
  const replay = await (await ev({ event_name: 'PageView', event_id: 'evt-12345678', replay: true, consent: true })).json();
  assert.equal(replay.reason, 'already-sent');
  const optout = await (await ev({ event_name: 'PageView', event_id: 'evt-12345678', optout: true })).json();
  assert.deepEqual(optout, { ok: true, sent: false, reason: 'optout' });
  process.env.CAPI_WITHOUT_CONSENT = 'false';
  try {
    assert.equal((await (await ev({ event_name: 'PageView', event_id: 'evt-12345678' })).json()).reason, 'no-consent');
  } finally {
    delete process.env.CAPI_WITHOUT_CONSENT;
  }
});
