// Genera assets/img/og.jpg (1200x630) con el estilo de la web: fondo blanco,
// logo AAS, titular en mayúsculas y el reel con más visitas, con el mismo
// recorte 4:5 que en la página.
// Se ejecuta a mano cuando cambie el mensaje (necesita Playwright instalado):
//   node scripts/og.mjs

import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const a = (rel) => 'file://' + path.join(root, 'assets', rel);

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Manrope;src:url(${a('fonts/manrope-var-latin.woff2')});font-weight:200 800}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#fff;font-family:Manrope;color:#0c0c0d;overflow:hidden}
.wrap{position:relative;height:100%;padding:64px 72px;display:flex;flex-direction:column}
.logo{display:block;width:120px;height:auto}
h1{margin-top:auto;font-size:76px;font-weight:800;line-height:.98;letter-spacing:-.04em;text-transform:uppercase}
h1 span{display:block}
p{margin-top:24px;font-size:26px;font-weight:600;color:#46464d;letter-spacing:-.01em}
.card{position:absolute;right:96px;top:64px;width:316px;aspect-ratio:4/5;border-radius:28px;overflow:hidden;background:#1a1a1c;box-shadow:0 18px 50px rgba(16,16,18,.14),0 60px 120px -30px rgba(16,16,18,.2)}
.card img{position:absolute;left:0;width:100%}
.card::after{content:"";position:absolute;inset:auto 0 0;height:42%;background:linear-gradient(to top,rgba(0,0,0,.66),rgba(0,0,0,0))}
.views{position:absolute;left:22px;bottom:20px;z-index:1;color:#fff;font-size:30px;font-weight:750;letter-spacing:-.01em}
.url{position:absolute;right:96px;bottom:40px;font-size:18px;font-weight:600;color:#6d6d75}
</style>
<div class="wrap">
  <img class="logo" src="${a('img/logo-aas.svg')}" alt="">
  <h1><span>Más clientes</span><span>desde tus</span><span>redes sociales</span></h1>
  <p>Tu estrategia gratis en menos de 24 horas.</p>
  <div class="card"><img src="${a('img/results/tatuajes-946mil.webp')}" style="top:-${(200 / 800) * 316}px"><span class="views">▶ 946 mil</span></div>
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
