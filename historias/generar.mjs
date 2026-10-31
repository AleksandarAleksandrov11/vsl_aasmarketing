// Historias destacadas de Instagram (1080x1920) con el estilo de la web:
// blanco, gris y negro, Manrope, mucho aire y capturas reales.
// Cifras, casos, cuentas y opiniones salen de src/data/content.mjs, así que si
// cambia un caso en la web, basta con volver a generar.
//
// Uso (necesita Playwright con Chromium, como scripts/og.mjs):
//   node historias/generar.mjs
// Salida: historias/salida/ (una carpeta por destacada y otra con las portadas
// redondas), más historias/salida/historias-aas.zip.

import { chromium } from 'playwright';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { esc, sprite, icon, stars } from '../scripts/lib/html.mjs';
import { RESULTS, VDN, EXONERIS, ACCOUNTS, TESTIMONIALS, WORK, ABOUT, STATS, RATING } from '../src/data/content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'historias', 'salida');
const CACHE = path.join(root, 'node_modules', '.cache', 'historias');
const asset = (rel) => pathToFileURL(path.join(root, 'assets', rel)).href;
// El logo va como máscara CSS: desde file:// el navegador no la carga, así que va en línea.
const LOGO = `data:image/svg+xml;base64,${(await readFile(path.join(root, 'assets/img/logo-aas.svg'))).toString('base64')}`;

// Recorte (en píxeles del original) a un PNG en caché; devuelve su URL file://.
async function cropped(rel, box) {
  const key = createHash('sha1').update(rel + JSON.stringify(box || {})).digest('hex').slice(0, 12);
  const file = path.join(CACHE, `${key}.png`);
  let img = sharp(path.join(root, 'assets', rel));
  if (box) img = img.extract(box);
  await img.png().toFile(file);
  return pathToFileURL(file).href;
}

// ---------- Textos propios de las historias (el resto viene de content.mjs)

const HANDLE = '@aas_webmarketing';
const LINK = 'vsl.aasmarketing.com';
const stat = (value) => STATS.find((s) => s.value === value);
const SERVICIOS = {
  redes: ['Estrategia', 'Guiones', 'Grabación en tu negocio', 'Edición', 'Publicación', 'Comunidad', 'Informe mensual'],
  ads: ['Campañas en Instagram y Facebook', 'Creatividades en vídeo', 'Optimización semanal', 'Leads directos a tu WhatsApp'],
};
const PASOS_ESTRATEGIA = [
  'Me dejas tu perfil en 30 segundos.',
  'Lo analizo y preparo tu estrategia con los cambios que haría.',
  'Te la mando por WhatsApp en menos de 24 horas, gratis.',
];
// Opinión larga de Alex Zsurzs: fragmentos literales, marcados con […].
const ALEX = TESTIMONIALS.find((t) => t.name === 'Alex Zsurzs');
const alexExcerpt = [
  'Aleks fue el primero en enseñarme algo real, algo que yo podía ver, y cuadraba exactamente con lo que tenía en la cabeza',
  'Me presta atención, me escucha, no me presiona cuando me tomo mis tiempos',
  'Siempre voy a recomendar a Aleks en cualquier proyecto: sé que nunca me dejará mal.',
];
for (const part of alexExcerpt) if (!ALEX.text.includes(part)) throw new Error(`Fragmento que no está en la opinión: ${part}`);

// Iconos que no están en el sprite de la web (trazo de 24x24).
const extra = {
  user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.9-3.6 3.7-5.6 7.2-5.6s6.3 2 7.2 5.6"/>',
  quote: '<path d="M5 17.5V20l3.6-2.5H17a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v7a3 3 0 0 0 1 2.3z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/>',
  trend: '<path d="M4 17l5.5-5.5 4 4L20 9"/><path d="M15 9h5v5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
};
const line = (body, size = 24, sw = 1.8) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

// ---------- Estilos

const css = `
@font-face{font-family:Manrope;src:url(${asset('fonts/manrope-var-latin.woff2')});font-weight:200 800}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px}
body{position:relative;overflow:hidden;font-family:Manrope;color:#0c0c0d;background:#f6f6f4;-webkit-font-smoothing:antialiased}
body.white{background:#fff}
body.dark{background:#0c0c0d;color:#f5f5f3}
img,svg{display:block}
.sprite{position:absolute;width:0;height:0;overflow:hidden}
.logo{display:block;height:var(--lh,30px);aspect-ratio:1673/596;background:currentColor;-webkit-mask:url(${LOGO}) no-repeat center/contain;mask:url(${LOGO}) no-repeat center/contain}
/* Cabecera y pie dentro de la zona que no tapa Instagram */
.top{position:absolute;left:84px;right:84px;top:250px;display:flex;justify-content:space-between;align-items:center;color:#0c0c0d}
.dark .top{color:#f5f5f3}
.top .tag{font-size:23px;font-weight:750;letter-spacing:.18em;text-transform:uppercase;color:#8a8a91}
.foot{position:absolute;left:84px;right:84px;bottom:330px;display:flex;justify-content:center;align-items:center;gap:16px;font-size:24px;font-weight:650;letter-spacing:.04em;color:#8a8a91}
.foot i{width:6px;height:6px;border-radius:50%;background:#c4c4c8}
.safe{position:absolute;left:84px;right:84px;top:350px;bottom:400px;display:flex;flex-direction:column}
.center{justify-content:center}
.eyebrow{font-size:25px;font-weight:750;letter-spacing:.18em;text-transform:uppercase;color:#7a7a82}
.dark .eyebrow{color:rgba(245,245,243,.55)}
.h{margin-top:22px;font-size:96px;font-weight:800;line-height:.98;letter-spacing:-.04em;text-transform:uppercase}
.h.m{font-size:80px}
.lead{margin-top:26px;font-size:38px;line-height:1.45;font-weight:500;color:#4a4a52}
.dark .lead{color:rgba(245,245,243,.7)}
.rule{height:2px;background:rgba(12,12,13,.09);margin:44px 0}
.dark .rule{background:rgba(245,245,243,.14)}
/* Portada de cada destacada */
.cover{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 84px}
.cover-ico{display:grid;place-items:center;width:200px;height:200px;border:2px solid rgba(245,245,243,.22);border-radius:50%;color:#f5f5f3}
.cover-t{margin-top:64px;font-size:132px;font-weight:800;letter-spacing:-.045em;line-height:.95;text-transform:uppercase}
.cover-s{margin-top:30px;font-size:36px;font-weight:500;color:rgba(245,245,243,.62);max-width:20ch;line-height:1.4}
.cover-line{width:72px;height:3px;border-radius:3px;background:rgba(245,245,243,.35);margin-top:56px}
/* Portadas redondas de las destacadas */
.bubble{position:absolute;inset:0;display:grid;place-items:center;color:#f5f5f3}
.bubble.light{background:#f6f6f4;color:#0c0c0d}
/* Captura de un reel (mismo recorte 4:5 y contador que en la web) */
.rc{min-width:0}
.rc-img{position:relative;aspect-ratio:4/5;border-radius:30px;overflow:hidden;background:#1a1a1c;box-shadow:0 30px 60px -24px rgba(16,16,18,.35)}
.rc-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.rc-img::after{content:"";position:absolute;inset:auto 0 0;height:44%;background:linear-gradient(to top,rgba(0,0,0,.7),rgba(0,0,0,0))}
.rc-v{position:absolute;left:24px;bottom:20px;z-index:1;display:flex;align-items:center;gap:10px;color:#fff;font-size:40px;font-weight:800;letter-spacing:-.01em}
.rc-v svg{width:24px;height:24px}
.rc figcaption{margin-top:14px;font-size:26px;font-weight:600;color:#6d6d75;line-height:1.3}
.rc.s .rc-img{border-radius:22px}
.rc.s .rc-v{left:16px;bottom:14px;font-size:30px;gap:8px}
.rc.s .rc-v svg{width:18px;height:18px}
.rc.s figcaption{font-size:22px;margin-top:10px}
/* Casos */
.who{display:flex;align-items:center;gap:22px}
.who img{width:92px;height:92px;border-radius:50%;object-fit:cover;border:2px solid rgba(245,245,243,.18)}
.who b{display:block;font-size:38px;font-weight:750;line-height:1.2}
.who span{display:block;font-size:27px;color:rgba(245,245,243,.6);margin-top:4px}
.case-t{margin-top:44px;font-size:76px;font-weight:800;line-height:1.04;letter-spacing:-.035em}
.kpis{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:20px;margin-top:44px;padding:36px 0;border-top:2px solid rgba(245,245,243,.14);border-bottom:2px solid rgba(245,245,243,.14);text-align:center}
.kpis b{display:block;font-size:66px;font-weight:800;letter-spacing:-.04em;line-height:1}
.kpis span{display:block;margin-top:12px;font-size:25px;line-height:1.3;color:rgba(245,245,243,.62)}
.proof{display:grid;gap:16px;margin-top:40px}
.proof img{width:100%;border-radius:22px;border:2px solid rgba(245,245,243,.12)}
/* Cuentas */
.accs{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:52px}
.accs img{width:100%;border-radius:16px;box-shadow:0 12px 30px -14px rgba(16,16,18,.4)}
.pill{display:inline-flex;align-items:center;gap:14px;align-self:center;margin-top:44px;padding:20px 34px;border-radius:999px;background:#0c0c0d;color:#f5f5f3;font-size:30px;font-weight:700}
.dark .pill{background:#f5f5f3;color:#0c0c0d}
.pill.line{background:none;color:inherit;border:2px solid currentColor}
/* Listas */
.checks{margin-top:48px;display:grid;gap:0}
.checks li{list-style:none;display:flex;align-items:center;gap:24px;padding:24px 0;border-top:2px solid rgba(12,12,13,.08);font-size:38px;font-weight:650;letter-spacing:-.01em}
.checks li:last-child{border-bottom:2px solid rgba(12,12,13,.08)}
.checks .ic{flex:none;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:#0c0c0d;color:#fff}
.dark .checks li{border-color:rgba(245,245,243,.14)}
.dark .checks .ic{background:#f5f5f3;color:#0c0c0d}
.card{border-radius:34px;background:#fff;padding:40px;box-shadow:0 20px 50px -26px rgba(16,16,18,.25)}
.card.dark{background:#0c0c0d;color:#f5f5f3}
/* Pasos */
.steps{margin-top:46px;display:grid;gap:18px}
.step{display:flex;gap:28px;align-items:flex-start;padding:30px 32px;border-radius:30px;background:#fff;box-shadow:0 16px 40px -26px rgba(16,16,18,.3)}
.step .ic{flex:none;display:grid;place-items:center;width:72px;height:72px;border-radius:50%;background:#0c0c0d;color:#fff}
.step b{display:block;font-size:36px;font-weight:800;letter-spacing:-.015em;line-height:1.2}
.step span{display:block;margin-top:6px;font-size:28px;line-height:1.4;color:#6d6d75}
/* Cifras */
.nums{display:grid;gap:0;margin-top:40px}
.num{display:flex;align-items:baseline;gap:28px;padding:30px 0;border-top:2px solid rgba(245,245,243,.14)}
.num:last-child{border-bottom:2px solid rgba(245,245,243,.14)}
.num b{flex:none;width:340px;font-size:84px;font-weight:800;letter-spacing:-.045em;line-height:1}
.num span{font-size:32px;line-height:1.35;color:rgba(245,245,243,.7)}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:52px}
.tile{padding:44px 36px;border-radius:34px;background:#fff;box-shadow:0 16px 40px -26px rgba(16,16,18,.3)}
.tile b{display:flex;align-items:center;gap:10px;font-size:84px;font-weight:800;letter-spacing:-.045em;line-height:1}
.tile b svg{width:56px;height:56px}
.tile span{display:block;margin-top:16px;font-size:30px;line-height:1.3;color:#6d6d75}
/* Opiniones */
.t-stars{display:flex;color:#0c0c0d}
.t-quote{margin-top:46px;color:#d9d9dc}
.t-text{margin-top:30px;font-size:46px;line-height:1.48;font-weight:550;letter-spacing:-.01em;color:#25252a}
.t-text.l{font-size:42px}
.t-who{display:flex;align-items:center;gap:24px;margin-top:56px}
.t-who .t-av{display:grid;margin:0;color:#0c0c0d;place-items:center;width:96px;height:96px;border-radius:50%;background:#f1f1ef;border:2px solid rgba(12,12,13,.08);font-size:32px;font-weight:800}
.t-who b{display:block;font-size:40px;font-weight:800;line-height:1.2}
.t-who span{display:block;font-size:28px;color:#7a7a82;margin-top:4px}
.minis{display:grid;gap:18px;margin-top:40px}
.mini{padding:28px 34px;border-radius:28px;background:#fff;box-shadow:0 16px 40px -26px rgba(16,16,18,.3)}
.mini p{margin-top:12px;font-size:31px;line-height:1.42;font-weight:550;color:#25252a}
.mini b{display:block;margin-top:12px;font-size:26px;font-weight:800}
/* Sobre mí */
.photo{border-radius:44px;overflow:hidden;box-shadow:0 34px 70px -30px rgba(16,16,18,.45)}
.photo img{width:100%;height:100%;object-fit:cover}
.big-q{margin-top:40px;font-size:64px;font-weight:800;line-height:1.12;letter-spacing:-.03em}
.sign{display:flex;align-items:center;gap:22px;margin-top:56px}
.sign img{width:110px;height:110px;border-radius:50%;object-fit:cover}
.sign b{display:block;font-size:34px;font-weight:800}
.sign span{display:block;font-size:26px;color:#7a7a82;margin-top:2px}
/* Cierre con botón: hueco libre para el sticker de enlace */
.cta-link{margin-top:56px;display:flex;flex-direction:column;align-items:center;gap:18px;font-size:30px;font-weight:700;color:#7a7a82}
.cta-link .arrow{display:grid;place-items:center;width:76px;height:76px;border-radius:50%;border:2px solid rgba(12,12,13,.18);color:#0c0c0d}
.dark .cta-link{color:rgba(245,245,243,.6)}
.dark .cta-link .arrow{border-color:rgba(245,245,243,.25);color:#f5f5f3}
`;

// ---------- Piezas

const doc = (body, theme = 'light') => `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${css}</style></head><body class="${theme}">${sprite()}${body}</body></html>`;
const top = (tag) => `<div class="top"><span class="logo"></span><span class="tag">${esc(tag)}</span></div>`;
const foot = () => `<div class="foot"><span>${HANDLE}</span><i></i><span>${LINK}</span></div>`;
const play = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>';

async function reel(r, { small = false, caption = true } = {}) {
  return `<figure class="rc${small ? ' s' : ''}"><div class="rc-img"><img src="${await cropped(r.src, r.crop)}"><span class="rc-v">${play}${esc(r.views)}</span></div>${caption ? `<figcaption>${esc(r.who)}</figcaption>` : ''}</figure>`;
}

const cover = (title, sub, ico) => doc(`<div class="cover">
  <div class="cover-ico">${ico}</div>
  <h1 class="cover-t">${title}</h1>
  <p class="cover-s">${esc(sub)}</p>
  <span class="cover-line"></span>
</div>
<div class="foot" style="color:rgba(245,245,243,.5)"><span class="logo" style="--lh:34px;color:#f5f5f3"></span></div>`, 'dark');

const bubble = (ico, light = false) => doc(`<div class="bubble${light ? ' light' : ''}">${ico}</div>`, light ? 'light' : 'dark');

const ctaLink = (text) => `<div class="cta-link"><span>${esc(text)}</span><span class="arrow">${line('<path d="M12 5v14M6 13l6 6 6-6"/>', 34, 2)}</span></div>`;

// ---------- Historias

async function clientes() {
  const top12 = ACCOUNTS.slice(0, 12);
  const accs = await Promise.all(top12.map((a) => cropped(`img/accounts/${a.file}.webp`)));
  const [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10] = RESULTS;
  const vdnLogo = await cropped(VDN.logo);
  const vdnShots = await Promise.all(VDN.shots.map((s) => cropped(s.src)));
  const exAvatar = await cropped(EXONERIS.avatar.src, EXONERIS.avatar.crop);
  const exStats = await cropped(EXONERIS.shots[0].src);
  const exReel = RESULTS.find((r) => r.who === 'Exoneris Consulting');
  return [
    ['00-portada', cover('Clientes', 'Resultados reales de las cuentas que llevo.', line(extra.trend, 96, 1.6))],
    ['01-cuentas', doc(`${top('Clientes')}
<div class="safe center">
  <p class="eyebrow">Confían en nosotros</p>
  <h2 class="h">+25 cuentas</h2>
  <p class="lead">Marcas personales y negocios que ya crecen en redes con nosotros.</p>
  <div class="accs">${accs.map((src) => `<img src="${src}">`).join('')}</div>
</div>${foot()}`)],
    ['02-visitas', doc(`${top('Resultados')}
<div class="safe center">
  <p class="eyebrow">Visitas generadas</p>
  <h2 class="h">+10 millones</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px 26px;width:720px;margin:48px auto 0">
    ${(await Promise.all([r1, r2, r3, r4].map((r) => reel(r)))).join('')}
  </div>
</div>${foot()}`)],
    ['03-caso-vdn', doc(`${top('Caso de éxito')}
<div class="safe center">
  <div class="who"><img src="${vdnLogo}"><div><b>${esc(VDN.client)}</b><span>${esc(VDN.sector)}</span></div></div>
  <h2 class="case-t">${esc(VDN.title)}</h2>
  <div class="kpis">${VDN.kpis.map((k) => `<div><b>${esc(k.value)}</b><span>${esc(k.label)}</span></div>`).join('')}</div>
  <div class="proof">${vdnShots.map((s) => `<img src="${s}">`).join('')}</div>
</div>${foot()}`, 'dark')],
    ['04-caso-javier', doc(`${top('Caso de éxito')}
<div class="safe center">
  <div class="who"><img src="${exAvatar}"><div><b>${esc(EXONERIS.client)}</b><span>${esc(EXONERIS.sector)}</span></div></div>
  <h2 class="case-t">${esc(EXONERIS.title)}</h2>
  <div class="kpis">${EXONERIS.kpis.map((k) => `<div><b>${esc(k.value)}</b><span>${esc(k.label)}</span></div>`).join('')}</div>
  <div style="display:grid;grid-template-columns:300px 1fr;gap:24px;align-items:center;margin-top:40px">
    ${await reel(exReel, { small: true, caption: false })}
    <div class="proof" style="margin:0"><img src="${exStats}"></div>
  </div>
</div>${foot()}`, 'dark')],
    ['05-mas-resultados', doc(`${top('Resultados')}
<div class="safe center">
  <p class="eyebrow">Y muchos más</p>
  <h2 class="h m">Vídeos que traen visitas</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:52px">
    ${(await Promise.all([r5, r6, r7, r8, r9, r10].map((r) => reel(r, { small: true })))).join('')}
  </div>
</div>${foot()}`)],
    ['06-tu-turno', doc(`${top('Clientes')}
<div class="safe center" style="text-align:center;align-items:center">
  <p class="eyebrow">Tu negocio puede ser el siguiente</p>
  <h2 class="h" style="font-size:104px">¿Hablamos?</h2>
  <p class="lead" style="max-width:24ch">Te mando gratis la estrategia que seguiría para tu negocio, en menos de 24 horas.</p>
  <span class="pill">Sin llamadas y sin compromiso</span>
  ${ctaLink('Pídela en el enlace')}
</div>`)],
  ];
}

async function sobreMi() {
  const foto = await cropped('img/aleks/foto.jpg', { left: 160, top: 0, width: 1280, height: 1600 });
  const cara = await cropped('img/aleks/foto.jpg', { left: 420, top: 300, width: 840, height: 840 });
  return [
    ['00-portada', cover('Sobre mí', 'Quién está detrás de tus redes.', line(extra.user, 96, 1.6))],
    ['01-soy-aleks', doc(`${top('Sobre mí')}
<div class="safe" style="align-items:center;text-align:center">
  <div class="photo" style="width:700px;height:875px"><img src="${foto}"></div>
  <h2 class="h" style="margin-top:52px">Soy Aleks</h2>
  <p class="lead" style="margin-top:18px">Redes sociales y Meta Ads para negocios.</p>
</div>${foot()}`, 'white')],
    ['02-como-trabajo', doc(`${top('Sobre mí')}
<div class="safe center">
  <p class="eyebrow">Cómo trabajo</p>
  <p class="big-q">${esc(ABOUT.lines[0])}</p>
  <div class="rule"></div>
  <p class="lead" style="margin-top:0">${esc(ABOUT.lines[1])}</p>
  <p class="lead">Me desplazo a cualquier parte de España y de Europa: tú pones el negocio y yo grabo, edito y publico.</p>
  <div class="sign"><img src="${cara}"><div><b>Aleks</b><span>AAS Marketing</span></div></div>
</div>${foot()}`)],
    ['03-en-numeros', doc(`${top('Sobre mí')}
<div class="safe center">
  <p class="eyebrow">En números</p>
  <h2 class="h m">Lo que llevamos</h2>
  <div class="tiles">
    <div class="tile"><b>+25</b><span>cuentas gestionadas</span></div>
    <div class="tile"><b>+300</b><span>vídeos editados</span></div>
    <div class="tile"><b>+10 M</b><span>visitas generadas</span></div>
    <div class="tile"><b>${icon.star({ size: 56 })}5,0</b><span>${esc(RATING.replace('5,0 ', ''))}</span></div>
  </div>
  <span class="pill line" style="color:#0c0c0d">${icon.pin({ size: 30 })} Grabo en toda España y Europa</span>
</div>${foot()}`)],
  ];
}

async function servicios() {
  const check = icon.check({ size: 28 });
  const stepIcons = { search: icon.search({ size: 34 }), pen: icon.pen({ size: 34 }), camera: icon.camera({ size: 34 }), film: icon.film({ size: 34 }), chart: icon.chart({ size: 34 }) };
  return [
    ['00-portada', cover('Servicios', 'Redes sociales y Meta Ads, de la idea al cliente.', line(extra.grid, 96, 1.6))],
    ['01-redes-sociales', doc(`${top('Servicios')}
<div class="safe center">
  <p class="eyebrow">Gestión de redes sociales</p>
  <h2 class="h m">Me encargo de todo</h2>
  <p class="lead">Tú atiendes a tus clientes. Yo hago que tus redes trabajen para ti.</p>
  <ul class="checks">${SERVICIOS.redes.map((s) => `<li><span class="ic">${check}</span>${esc(s)}</li>`).join('')}</ul>
</div>${foot()}`, 'white')],
    ['02-meta-ads', doc(`${top('Servicios')}
<div class="safe center">
  <p class="eyebrow">Meta Ads</p>
  <h2 class="h m">Anuncios que traen clientes</h2>
  <ul class="checks">${SERVICIOS.ads.map((s) => `<li><span class="ic">${check}</span>${esc(s)}</li>`).join('')}</ul>
  <div class="card dark" style="margin-top:48px;display:flex;align-items:center;gap:32px">
    <b style="font-size:84px;font-weight:800;letter-spacing:-.045em;line-height:1">+2.500</b>
    <span style="font-size:30px;line-height:1.35;color:rgba(245,245,243,.7)">leads con Meta Ads en 2 meses para VDN Performance</span>
  </div>
</div>${foot()}`, 'dark')],
    ['03-como-lo-hacemos', doc(`${top('Servicios')}
<div class="safe center">
  <p class="eyebrow">Cómo lo hacemos</p>
  <h2 class="h m">Paso a paso</h2>
  <div class="steps">${WORK.map((w) => `<div class="step"><span class="ic">${stepIcons[w.icon]}</span><div><b>${esc(w.title)}</b><span>${esc(w.text)}</span></div></div>`).join('')}</div>
</div>${foot()}`)],
    ['04-lo-conseguido', doc(`${top('Servicios')}
<div class="safe center">
  <p class="eyebrow">Lo que hemos conseguido</p>
  <h2 class="h m">La meta: clientes</h2>
  <div class="nums">
    ${[stat('+10 M'), stat('946 mil'), stat('+2.500'), stat('+5.000'), stat('1.058')].map((s) => `<div class="num"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}
  </div>
</div>${foot()}`, 'dark')],
    ['05-estrategia-gratis', doc(`${top('Servicios')}
<div class="safe center">
  <p class="eyebrow">Empieza aquí</p>
  <h2 class="h m">Tu estrategia gratis</h2>
  <p class="lead">En menos de 24 horas. Sin llamadas y sin compromiso.</p>
  <div class="steps">${PASOS_ESTRATEGIA.map((p, i) => `<div class="step" style="align-items:center"><span class="ic" style="font-size:32px;font-weight:800">${i + 1}</span><div><b style="font-size:34px;font-weight:700">${esc(p)}</b></div></div>`).join('')}</div>
  ${ctaLink('Pídela en el enlace')}
</div>`, 'white')],
  ];
}

async function testimonios() {
  const quote = line('<path d="M9.5 7C6.5 8 5 10.4 5 13.6V17h4.5v-4.5H7.3c.1-1.9 1-3.2 2.7-3.9zM18.5 7c-3 1-4.5 3.4-4.5 6.6V17h4.5v-4.5h-2.2c.1-1.9 1-3.2 2.7-3.9z" fill="currentColor" stroke="none"/>', 110);
  const initials = (n) => n.replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const one = (t, text = t.text) => doc(`${top('Testimonios')}
<div class="safe center">
  <div class="t-stars">${stars(46)}</div>
  <div class="t-quote">${quote}</div>
  <p class="t-text${text.length > 300 ? ' l' : ''}">${esc(text)}</p>
  <div class="t-who"><span class="t-av">${esc(initials(t.name))}</span><div><b>${esc(t.name)}</b><span>${esc(t.role)}</span></div></div>
</div>${foot()}`, 'white');
  const by = (name) => TESTIMONIALS.find((t) => t.name === name);
  const shorts = ['Mari Trini Cruz', 'Juan José Sánchez', 'Miguel C.', 'Comunidad Herederos'].map(by);
  return [
    ['00-portada', cover('Testimonios', `${RATING}. Lo que dicen mis clientes.`, line(extra.quote, 96, 1.6))],
    ['01-adrian-lopez', one(by('Adrián López'))],
    ['02-aeroflex', one(by('AeroFlex'))],
    ['03-esther-argibay', one(by('Esther Argibay Martín'))],
    ['04-silvia-koeva', one(by('Silvia Koeva'))],
    ['05-alex-zsurzs', one(ALEX, alexExcerpt.join(' […] '))],
    ['06-resenas-google', doc(`${top('Testimonios')}
<div class="safe center">
  <p class="eyebrow">Reseñas en Google</p>
  <h2 class="h m">${esc(RATING)}</h2>
  <div class="minis">${shorts.map((t) => `<div class="mini"><span class="t-stars">${stars(30)}</span><p>${esc(t.text)}</p><b>${esc(t.name)}</b></div>`).join('')}</div>
</div>${foot()}`)],
  ];
}

async function portadas() {
  const big = (body) => line(body, 340, 1.3);
  return [
    ['clientes', bubble(big(extra.trend))],
    ['sobre-mi', bubble(big(extra.user))],
    ['servicios', bubble(big(extra.grid))],
    ['testimonios', bubble(big(extra.quote))],
  ];
}

// ---------- Exportar

await rm(OUT, { recursive: true, force: true });
await mkdir(CACHE, { recursive: true });
const groups = [
  ['00-portadas-destacadas', await portadas()],
  ['01-clientes', await clientes()],
  ['02-sobre-mi', await sobreMi()],
  ['03-servicios', await servicios()],
  ['04-testimonios', await testimonios()],
];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
let n = 0;
for (const [folder, items] of groups) {
  await mkdir(path.join(OUT, folder), { recursive: true });
  for (const [name, html] of items) {
    const file = path.join(CACHE, `${folder}-${name}.html`);
    await writeFile(file, html);
    await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
    });
    await page.screenshot({ path: path.join(OUT, folder, `${name}.png`) });
    n++;
  }
}
await browser.close();
await writeFile(path.join(OUT, 'LEEME.txt'), `Historias destacadas de AAS Marketing (1080x1920).

Cada carpeta es una destacada, en orden de subida (00, 01, 02...):
  01-clientes, 02-sobre-mi, 03-servicios y 04-testimonios.
La 00 de cada carpeta es la portada de la destacada (título), sin numerar.

00-portadas-destacadas: los iconos para la portada redonda de cada destacada.
En Instagram: Editar destacada > Editar portada > elige la imagen del icono.

Las historias que terminan en "Pídela en el enlace" tienen hueco libre abajo
para el sticker de enlace: añade el sticker con ${LINK}.
`);
execFileSync('zip', ['-qr', 'historias-aas.zip', '.', '-x', 'historias-aas.zip'], { cwd: OUT });
console.log(`${n} imágenes en historias/salida (y historias-aas.zip)`);
