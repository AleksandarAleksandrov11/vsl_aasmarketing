/**
 * AAS Marketing · Solicitudes de la landing vsl.aasmarketing.com
 *
 * Recibe cada solicitud desde /api/lead (Vercel), la añade como fila al Sheet
 * y avisa por correo a aaswebmarketing@gmail.com.
 *
 * Columnas, en este orden y nada más:
 * Fecha | Nombre | WhatsApp | Necesita | Negocio | Perfil | Enlace al perfil |
 * utm_source | utm_medium | utm_campaign | Página
 *
 * En el Sheet nunca se guardan fbclid, fbc, fbp, event_id ni ningún ID de Meta.
 * Pasos de instalación: apps-script/README.md
 */

var HEADERS = ['Fecha', 'Nombre', 'WhatsApp', 'Necesita', 'Negocio', 'Perfil', 'Enlace al perfil', 'utm_source', 'utm_medium', 'utm_campaign', 'Página'];
var EMAIL_TO = 'aaswebmarketing@gmail.com';
var SHEET_NAME = ''; // vacío = la primera pestaña del Sheet

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'json' });
  }

  var secret = PropertiesService.getScriptProperties().getProperty('SHEET_SECRET');
  if (!secret || data.secret !== secret) return json_({ ok: false, error: 'secret' });

  var lead = data.lead || {};
  var cache = CacheService.getScriptCache();
  var key = data.dedupe ? 'lead_' + String(data.dedupe).slice(0, 64) : '';
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, error: 'lock' });
  }
  try {
    // Si Vercel reintenta un envío que ya se guardó, no se duplica la fila.
    if (key && cache.get(key)) return json_({ ok: true, duplicate: true });
    var sheet = getSheet_();
    ensureHeaders_(sheet);
    sheet.appendRow([
      new Date(),
      text_(lead.nombre),
      text_(lead.whatsapp),
      text_(lead.necesita),
      text_(lead.negocio),
      text_(lead.perfil),
      text_(lead.perfil_url),
      text_(lead.utm_source),
      text_(lead.utm_medium),
      text_(lead.utm_campaign),
      text_(lead.pagina)
    ]);
    if (key) cache.put(key, '1', 21600); // 6 horas
  } finally {
    lock.releaseLock();
  }

  try {
    sendMail_(lead);
  } catch (err) {
    console.error('No se pudo enviar el correo: ' + err);
  }
  return json_({ ok: true });
}

/** Abrir la URL de la implementación en el navegador debe mostrar {"ok":true}. */
function doGet() {
  return json_({ ok: true, service: 'aas-leads' });
}

/** Ejecútala una vez desde el editor para dar permisos (Sheets y correo). */
function probar() {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('SHEET_SECRET');
  if (!secret) throw new Error('Falta SHEET_SECRET en Configuración del proyecto > Propiedades del script.');
  var res = doPost({ postData: { contents: JSON.stringify({
    secret: secret,
    dedupe: 'prueba-' + new Date().getTime(),
    lead: {
      nombre: 'PRUEBA',
      whatsapp: '+34600000000',
      necesita: 'Las dos (redes y Meta Ads)',
      negocio: 'Salud y bienestar',
      perfil: '@prueba',
      perfil_url: 'https://www.instagram.com/prueba/',
      utm_source: 'prueba',
      utm_medium: 'prueba',
      utm_campaign: 'prueba',
      pagina: 'https://vsl.aasmarketing.com/'
    }
  }) } });
  console.log(res.getContent());
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
  }
}

/** Texto seguro para el Sheet: evita fórmulas (=, +, -, @) y fuerza texto. */
function text_(value) {
  var s = String(value == null ? '' : value).slice(0, 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function sendMail_(lead) {
  var digits = String(lead.whatsapp || '').replace(/\D/g, '');
  var wa = digits ? 'https://wa.me/' + digits : '';
  var subject = 'Nuevo lead: ' + (lead.nombre || 'Sin nombre') + ' · ' + (lead.necesita || '') + ' · ' + (lead.perfil || '');
  var rows = [
    ['Nombre', esc_(lead.nombre)],
    ['WhatsApp', wa ? '<a href="' + wa + '">' + esc_(lead.whatsapp) + '</a> (pulsa para escribirle)' : esc_(lead.whatsapp)],
    ['Necesita', esc_(lead.necesita)],
    ['A qué se dedica', esc_(lead.negocio)],
    ['Perfil', lead.perfil_url ? '<a href="' + esc_(lead.perfil_url) + '">' + esc_(lead.perfil) + '</a>' : esc_(lead.perfil)],
    ['utm_source', esc_(lead.utm_source)],
    ['utm_medium', esc_(lead.utm_medium)],
    ['utm_campaign', esc_(lead.utm_campaign)],
    ['Página', esc_(lead.pagina)]
  ];
  var html = '<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px">'
    + rows.map(function (r) { return '<tr><td style="color:#6d6d75">' + r[0] + '</td><td><b>' + (r[1] || '') + '</b></td></tr>'; }).join('')
    + '</table>';
  var body = [
    'Nombre: ' + (lead.nombre || ''),
    'WhatsApp: ' + (lead.whatsapp || '') + (wa ? ' · ' + wa : ''),
    'Necesita: ' + (lead.necesita || ''),
    'A qué se dedica: ' + (lead.negocio || ''),
    'Perfil: ' + (lead.perfil || '') + (lead.perfil_url ? ' · ' + lead.perfil_url : ''),
    'utm_source: ' + (lead.utm_source || ''),
    'utm_medium: ' + (lead.utm_medium || ''),
    'utm_campaign: ' + (lead.utm_campaign || ''),
    'Página: ' + (lead.pagina || '')
  ].join('\n');
  MailApp.sendEmail({ to: EMAIL_TO, subject: subject, body: body, htmlBody: html, name: 'Landing AAS Marketing' });
}

function esc_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
