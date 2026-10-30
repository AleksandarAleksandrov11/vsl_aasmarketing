// Ejecuta apps-script/Code.gs en Node con los servicios de Google simulados.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function load() {
  const code = await readFile(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');
  const rows = [];
  const mails = [];
  const props = new Map([['SHEET_SECRET', 'clave']]);
  const sheet = {
    getLastRow: () => rows.length,
    appendRow: (r) => rows.push(r),
    setFrozenRows: () => {},
    getRange: () => ({ setFontWeight: () => {}, setNumberFormat: () => {} }),
  };
  const ctx = {
    console,
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (props.has(k) ? props.get(k) : null),
        setProperty: (k, v) => props.set(k, String(v)),
        deleteProperty: (k) => props.delete(k),
        getProperties: () => Object.fromEntries(props),
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheets: () => [sheet], getSheetByName: () => sheet }) },
    MailApp: { sendEmail: (m) => mails.push(m) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (text) => ({ text, setMimeType() { return this; }, getContent() { return text; } }),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const post = (body) => ({ ...JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).text) });
  return { ctx, rows, mails, props, post };
}

const lead = {
  nombre: 'PRUEBA', whatsapp: '+34600000000', necesita: 'Meta Ads', negocio: '=HYPERLINK("x")',
  perfil: '@prueba', perfil_url: 'https://www.instagram.com/prueba/', utm_source: 'facebook',
  utm_medium: 'paid', utm_campaign: 'cerrar', pagina: 'https://vsl.aasmarketing.com/',
};

test('Apps Script: clave, fila con las 11 columnas, sin fórmulas y sin duplicados', async () => {
  const { rows, mails, post } = await load();
  assert.deepEqual(post({ secret: 'mala', lead }), { ok: false, error: 'secret' });
  assert.equal(rows.length, 0);

  assert.deepEqual(post({ secret: 'clave', dedupe: 'abc', lead }), { ok: true });
  assert.equal(rows.length, 2, 'cabeceras + fila');
  assert.deepEqual([...rows[0]], ['Fecha', 'Nombre', 'WhatsApp', 'Necesita', 'Negocio', 'Perfil', 'Enlace al perfil', 'utm_source', 'utm_medium', 'utm_campaign', 'Página']);
  const row = [...rows[1]];
  assert.equal(Object.prototype.toString.call(row[0]), '[object Date]');
  // El apóstrofo inicial fuerza texto (evita fórmulas); Google Sheets no lo muestra en la celda.
  assert.deepEqual(row.slice(1), ['PRUEBA', "'+34600000000", 'Meta Ads', "'=HYPERLINK(\"x\")", "'@prueba", 'https://www.instagram.com/prueba/', 'facebook', 'paid', 'cerrar', 'https://vsl.aasmarketing.com/']);

  // Reintento del mismo envío: no duplica la fila ni el correo.
  assert.deepEqual(post({ secret: 'clave', dedupe: 'abc', lead }), { ok: true, duplicate: true });
  assert.equal(rows.length, 2);
  assert.equal(mails.length, 1);

  const m = mails[0];
  assert.equal(m.to, 'aaswebmarketing@gmail.com');
  assert.equal(m.subject, 'Nuevo lead: PRUEBA · Meta Ads · @prueba');
  assert.match(m.htmlBody, /https:\/\/wa\.me\/34600000000/);
  assert.match(m.htmlBody, /href="https:\/\/www\.instagram\.com\/prueba\/"/);
  assert.match(m.htmlBody, /=HYPERLINK\(&quot;x&quot;\)/, 'el HTML del correo va escapado');
  assert.match(m.body, /utm_campaign: cerrar/);
});

test('Apps Script: recuerda cada envío 8 días fuera del Sheet y después lo olvida', async () => {
  const { rows, mails, props, post } = await load();
  const day = 24 * 3600 * 1000;
  // Huella de hace 9 días (se borra) y otra de hace 2 días (se respeta).
  props.set('lead_viejo', String(Date.now() - 9 * day));
  props.set('lead_reciente', String(Date.now() - 2 * day));
  assert.deepEqual(post({ secret: 'clave', dedupe: 'nuevo', lead }), { ok: true });
  assert.equal(props.has('lead_viejo'), false, 'la huella antigua se borra');
  assert.equal(props.get('SHEET_SECRET'), 'clave', 'la clave nunca se toca');
  assert.ok(props.has('lead_nuevo'));
  // Un reintento días después (dentro de los 8) no duplica la fila ni el correo.
  assert.deepEqual(post({ secret: 'clave', dedupe: 'reciente', lead }), { ok: true, duplicate: true });
  assert.equal(rows.length, 2);
  assert.equal(mails.length, 1);
  // Ningún ID en el Sheet: la huella solo está en las propiedades del script.
  assert.ok(!rows.flat().some((c) => String(c).includes('nuevo')));
});

test('Apps Script: JSON roto y comprobación por GET', async () => {
  const { ctx } = await load();
  assert.deepEqual(JSON.parse(ctx.doPost({ postData: { contents: '{roto' } }).text), { ok: false, error: 'json' });
  assert.deepEqual(JSON.parse(ctx.doGet().text), { ok: true, service: 'aas-leads' });
});
