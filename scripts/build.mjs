// Build estático: genera dist/ con HTML pregenerado, CSS crítico en línea,
// el resto del CSS sin bloquear, un único JS pequeño y las imágenes en AVIF/WebP.
// Uso: npm run build   (Vercel lo ejecuta en cada despliegue)
//
// Variables de entorno que lee en el build (las mismas de Vercel):
//   META_PIXEL_ID     ID del píxel. Si falta, la página no carga el píxel.
//   VERCEL_ANALYTICS  Vercel Web Analytics y Speed Insights (por defecto sí; "false" los quita).
//                     Se cargan solo si aceptan la analítica en el aviso de cookies.
//   LEADS_DB_ENABLED  "true" si se usa la copia en Upstash (la política de privacidad la nombra).
//   OUT_DIR           carpeta de salida (por defecto dist; las pruebas usan otra).

import { createHash } from 'node:crypto';
import { readFile, writeFile, rm, mkdir, readdir } from 'node:fs/promises';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { Assets } from './lib/assets.mjs';
import { minifyHtml } from './lib/html.mjs';
import { landing } from '../src/templates/landing.mjs';
import { legalPages, notFound } from '../src/templates/legal.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(root, process.env.OUT_DIR || 'dist');
const started = Date.now();

const flag = (v) => /^(1|true|yes|on)$/i.test(String(v || '').trim());

function pixelIdFromEnv() {
  const id = String(process.env.META_PIXEL_ID || '').trim();
  if (!id) return '';
  if (!/^\d{5,20}$/.test(id)) {
    console.warn(`[build] META_PIXEL_ID="${id}" no parece un ID de píxel (solo cifras). Se ignora.`);
    return '';
  }
  return id;
}

async function buildCss(assets, file) {
  let src = await readFile(path.join(root, 'src/css', file), 'utf8');
  for (const [, ref] of src.matchAll(/url\((\/assets\/[^)]+)\)/g)) {
    src = src.replaceAll(ref, await assets.file(ref.slice('/assets/'.length)));
  }
  const { code } = await esbuild.transform(src, { loader: 'css', minify: true, target: ['safari15', 'chrome100', 'firefox100'] });
  return code;
}

async function buildJs() {
  const result = await esbuild.build({
    entryPoints: [path.join(root, 'src/js/main.js')],
    bundle: true,
    format: 'esm',
    minify: true,
    target: ['es2020', 'safari15'],
    legalComments: 'none',
    write: false,
  });
  return result.outputFiles[0].contents;
}

async function findAleksPhoto() {
  const dir = path.join(root, 'assets/img/aleks');
  const files = await readdir(dir).catch(() => []);
  const photo = files.find((f) => /^foto\.(jpe?g|png|webp|avif)$/i.test(f));
  return photo ? `img/aleks/${photo}` : null;
}

async function svgSize(rel) {
  const svg = await readFile(path.join(root, 'assets', rel), 'utf8');
  const [, , width, height] = svg.match(/viewBox="([\d.\s-]+)"/)[1].trim().split(/\s+/).map(Number);
  return { width: Math.round(width), height: Math.round(height) };
}

async function writeOut(rel, content) {
  const dest = path.join(out, rel);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, content);
}

async function main() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  const assets = new Assets({ root, out });

  const [criticalCss, mainCss, js] = await Promise.all([buildCss(assets, 'critical.css'), buildCss(assets, 'main.css'), buildJs()]);
  const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);
  const cssName = `assets/css/main.${hash(mainCss)}.css`;
  const jsName = `assets/js/app.${hash(js)}.js`;
  await writeOut(cssName, mainCss);
  await writeOut(jsName, js);

  const ctx = {
    assets,
    criticalCss,
    pixelId: pixelIdFromEnv(),
    analytics: !/^(0|false|no|off)$/i.test(String(process.env.VERCEL_ANALYTICS ?? '').trim()),
    leadsDb: flag(process.env.LEADS_DB_ENABLED),
    aleksPhoto: await findAleksPhoto(),
    mapSize: await svgSize('img/mapa-europa.svg'),
    asset: {
      css: '/' + cssName,
      js: '/' + jsName,
      manrope: await assets.file('fonts/manrope-var-latin.woff2'),
      serif: await assets.file('fonts/instrument-serif-italic-latin.woff2'),
      favicon: await assets.file('img/favicon.svg'),
      favicon16: await assets.file('img/favicon-16x16.png'),
      favicon32: await assets.file('img/favicon-32x32.png'),
      appleTouch: await assets.file('img/apple-touch-icon.png'),
      map: await assets.file('img/mapa-europa.svg'),
    },
  };

  const finish = (html) => minifyHtml(html);

  await writeOut('index.html', finish(await landing(ctx)));
  for (const page of legalPages(ctx)) await writeOut(page.file, finish(page.html));
  await writeOut('404.html', finish(notFound(ctx)));

  await assets.copyToRoot('favicon.ico');
  await assets.copyToRoot('img/og.jpg', 'og.jpg');
  await writeOut('robots.txt', 'User-agent: *\nAllow: /\n');
  await writeOut('site.webmanifest', JSON.stringify({
    name: 'AAS Marketing',
    short_name: 'AAS',
    icons: [
      { src: await assets.file('img/android-chrome-192x192.png'), sizes: '192x192', type: 'image/png' },
      { src: await assets.file('img/android-chrome-512x512.png'), sizes: '512x512', type: 'image/png' },
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
  }));

  await report(ctx);
}

async function report(ctx) {
  const html = await readFile(path.join(out, 'index.html'));
  const css = await readFile(path.join(out, ctx.asset.css));
  const js = await readFile(path.join(out, ctx.asset.js));
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  const line = (name, buf) => `  ${name.padEnd(14)} ${kb(buf.length).padStart(9)}  gzip ${kb(gzipSync(buf).length).padStart(8)}  brotli ${kb(brotliCompressSync(buf).length).padStart(8)}`;
  console.log(`\nBuild listo en ${((Date.now() - started) / 1000).toFixed(1)} s`);
  console.log(line('index.html', html));
  console.log(line('main.css', css));
  console.log(line('app.js', js));
  console.log(`  Píxel de Meta: ${ctx.pixelId ? ctx.pixelId : 'no configurado (META_PIXEL_ID vacío)'}`);
  console.log(`  Vercel Analytics: ${ctx.analytics ? 'sí (tras el consentimiento de analítica)' : 'no'}  ·  Foto de Aleks: ${ctx.aleksPhoto || 'no (se muestra el logo)'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
