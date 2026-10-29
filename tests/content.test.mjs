// Revisión del texto: sin guiones largos ni medios, sin emojis, sin restos de
// la oferta anterior y solo con cifras confirmadas. Necesita `npm run build`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, process.env.DIST || 'dist');

const visibleText = (html) => html
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ');

// Atributos que se leen o se oyen (alt, aria-label, title, placeholder, content de metas).
const attrText = (html) => [...html.matchAll(/\s(?:alt|aria-label|title|placeholder)="([^"]*)"/g)].map((m) => m[1]).join(' ')
  + ' ' + [...html.matchAll(/<meta (?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description)" content="([^"]*)"/g)].map((m) => m[1]).join(' ');

async function pages() {
  const files = (await readdir(dist)).filter((f) => f.endsWith('.html'));
  return Promise.all(files.map(async (f) => ({ file: f, html: await readFile(path.join(dist, f), 'utf8') })));
}

// Palabras de la oferta anterior. "llamada(s)" solo puede aparecer en las
// frases que pidió Aleks: "Sin llamadas y sin compromiso" y la pregunta de la FAQ.
const FORBIDDEN = [/auditor[ií]a/i, /auditar/i, /videollamada/i, /15 minutos/i, /3 cambios/i, /mira si encajas/i];
const allowedCall = (text) => text
  .replace(/sin llamadas y sin compromiso/gi, '')
  .replace(/¿Tengo que hacer una llamada\?/g, '');

test('sin guiones largos ni medios, sin emojis', async () => {
  for (const { file, html } of await pages()) {
    const text = visibleText(html) + ' ' + attrText(html);
    assert.ok(!/[–—]/.test(text), `${file}: guion largo o medio`);
    assert.ok(!/\p{Extended_Pictographic}/u.test(text.replace(/[©★]/g, '')), `${file}: emoji`);
  }
});

test('sin restos de la oferta anterior (páginas y código)', async () => {
  for (const { file, html } of await pages()) {
    const text = allowedCall(visibleText(html) + ' ' + attrText(html) + ' ' + html);
    for (const re of FORBIDDEN) assert.ok(!re.test(text), `${file}: ${re}`);
    assert.ok(!/llamada/i.test(text), `${file}: "llamada" fuera de las frases permitidas`);
  }
  // Repositorio entero (salvo dependencias, builds y esta prueba).
  const skip = new Set(['node_modules', 'dist', 'dist-test', '.git', 'test-results']);
  const walk = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (/\.(m?js|gs|md|html|css|json|txt|example)$/.test(e.name) && e.name !== 'content.test.mjs') {
        const text = allowedCall(await readFile(p, 'utf8'));
        for (const re of FORBIDDEN) assert.ok(!re.test(text), `${path.relative(root, p)}: ${re}`);
        assert.ok(!/llamada/i.test(text), `${path.relative(root, p)}: "llamada" fuera de las frases permitidas`);
      }
    }
  };
  await walk(root);
});

test('el CTA principal dice lo mismo en toda la landing', async () => {
  const html = await readFile(path.join(dist, 'index.html'), 'utf8');
  const ctas = [...html.matchAll(/<a class="btn(?: btn-light)?" href="#formulario"[^>]*>([^<]+)</g)].map((m) => m[1].trim());
  assert.ok(ctas.length >= 8, `solo ${ctas.length} CTA`);
  assert.deepEqual([...new Set(ctas)], ['Quiero mi estrategia gratis']);
  assert.match(html, /<a class="btn btn-s" href="#formulario">Estrategia gratis<\/a>/);
});

test('solo cifras confirmadas en la landing', async () => {
  const html = await readFile(path.join(dist, 'index.html'), 'utf8');
  // Los prefijos telefónicos del selector no son cifras de resultados.
  const body = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<select[\s\S]*?<\/select>/g, '');
  const text = visibleText(body) + ' ' + attrText(html);
  const numbers = new Set((text.match(/(?<![\p{L}\d])[+<]?\d[\d.,]*\d(?:\s?(?:millones|mil|M)\b)?|(?<![\p{L}\d])[+<]?\d(?:\s?(?:millones|mil|M)\b)?/gu) || []).map((n) => n.trim()));
  const allowed = [
    // Agencia y casos (sección 3 del encargo y web aasmarketing.com)
    '+10 M', '10 millones', '+2.500', '2.500', '+300', '+25', '25', '5,0', '+5.000', '2,5 millones', '+2,5 M', '<3', '3', '2',
    '106 mil', '+600', '600', '24',
    // Capturas de reels (alt del origen)
    '946 mil', '+406 mil', '406 mil', '306,9 mil', '257 mil', '110 mil', '80,3 mil', '53,8 mil', '52,4 mil', '37,1 mil', '33,2 mil',
    // Capturas de perfiles y casos (alt del origen)
    '59,1 mil', '19 mil', '8.975', '7.772', '5.784', '4.878', '4.784', '3.878', '3.159', '2.616', '1.777', '1.768', '1.377', '1.368',
    '1.267', '1.057', '1.046', '863', '790', '732', '716', '658', '583', '543', '148', '128', '3.541', '74,2 mil', '106.866', '652',
    '3.000', '5.000', '30', '10',
    // Textos: pasos, plazos, formulario, contacto y legal
    '1', '4', '5', '1/5', '100', '10/10', '100%', '2026', '695', '850', '590', '+34', '34', '0', '000', '1.0', '6',
  ];
  const unknown = [...numbers].filter((n) => !allowed.includes(n.trim()) && !allowed.includes(n.replace(/^[+<]/, '').trim()));
  const where = unknown.map((n) => `${n} → «${text.slice(Math.max(0, text.indexOf(n) - 40), text.indexOf(n) + 40)}»`);
  assert.deepEqual(unknown, [], `cifras sin confirmar:\n${where.join('\n')}`);
});
