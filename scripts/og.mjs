// Genera assets/img/og.jpg (1200x630) con el estilo de la web: fondo blanco,
// logo AAS, titular con una palabra en Instrument Serif y una captura real.
// Se ejecuta a mano cuando cambie el mensaje (necesita Playwright instalado):
//   node scripts/og.mjs

import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const a = (rel) => 'file://' + path.join(root, 'assets', rel);

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Manrope;src:url(${a('fonts/manrope-var-latin.woff2')});font-weight:200 800}
@font-face{font-family:"Instrument Serif";src:url(${a('fonts/instrument-serif-italic-latin.woff2')});font-style:italic}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#fff;font-family:Manrope;color:#0c0c0d;overflow:hidden}
.wrap{position:relative;height:100%;padding:64px 72px;display:flex;flex-direction:column}
.logo{display:block;width:120px;height:auto}
h1{margin-top:auto;max-width:700px;font-size:66px;font-weight:640;line-height:1.02;letter-spacing:-.042em}
h1 em{font-family:"Instrument Serif";font-style:italic;font-weight:400;letter-spacing:-.01em;font-size:1.06em}
p{margin-top:28px;font-size:24px;font-weight:600;color:#46464d;letter-spacing:-.01em}
.phone{position:absolute;right:84px;top:58px;width:276px;padding:7px;border-radius:38px;background:#0c0c0d;box-shadow:0 18px 50px rgba(16,16,18,.14),0 60px 120px -30px rgba(16,16,18,.2)}
.phone img{display:block;width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:31px}
.url{position:absolute;right:84px;bottom:46px;font-size:18px;font-weight:600;color:#6d6d75}
</style>
<div class="wrap">
  <img class="logo" src="${a('img/logo-aas.svg')}" alt="">
  <h1>Redes sociales y Meta Ads que llenan tu agenda de <em>clientes</em>.</h1>
  <p>Tu estrategia gratis en menos de 24 horas.</p>
  <div class="phone"><img src="${a('img/results/tatuajes-946mil.webp')}"></div>
  <div class="url">vsl.aasmarketing.com</div>
</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const file = path.join(root, 'node_modules', '.cache', 'og.html');
await (await import('node:fs/promises')).mkdir(path.dirname(file), { recursive: true });
await (await import('node:fs/promises')).writeFile(file, html);
await page.goto('file://' + file);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(root, 'assets/img/og.jpg'), type: 'jpeg', quality: 86 });
await browser.close();
console.log('assets/img/og.jpg generado');
