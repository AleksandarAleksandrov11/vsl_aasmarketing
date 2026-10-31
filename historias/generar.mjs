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
const LINK = 'aasmarketing.com';
const stat = (value) => STATS.find((s) => s.value === value);
// Servicios: cada punto con una frase que lo explica.
const SERVICIOS = {
  redes: [
    ['Estrategia', 'Estudio tu nicho y tu competencia antes de grabar nada.'],
    ['Guiones', 'Todos los del mes, adaptados a tu estilo.'],
    ['Grabación en tu negocio', 'Voy yo, a cualquier parte de España y de Europa.'],
    ['Edición', 'Gancho en los 3 primeros segundos y subtítulos.'],
    ['Publicación y comunidad', 'Publico por ti y cuido tu comunidad.'],
    ['Informe mensual', 'Qué ha funcionado y qué cambiamos el mes siguiente.'],
  ],
  ads: [
    ['Campañas en Instagram y Facebook', 'Para que te vea la gente que puede ser tu cliente.'],
    ['Creatividades en vídeo', 'Anuncios con el contenido que ya funciona en tus redes.'],
    ['Optimización semanal', 'Reviso las campañas cada semana y ajusto lo que no rinde.'],
    ['Leads directos a tu WhatsApp', 'Los contactos te llegan listos para hablar.'],
  ],
  otros: [
    ['search', 'Google Ads', 'Aparece cuando te buscan en Google.'],
    ['web', 'Páginas web', 'Webs y landings rápidas, pensadas para convertir visitas en clientes.'],
    ['bag', 'Tienda online', 'Vende tus productos por internet, sin complicaciones.'],
  ],
};
const PASOS_ESTRATEGIA = [
  'Me escribes «INFO» por mensaje.',
  'Analizo tu perfil y preparo tu estrategia con los cambios que haría.',
  'Te la mando en menos de 24 horas, gratis.',
];
// Más vídeos de VDN, recortados de sus cuadrículas de Instagram y TikTok (la
// cifra es la que se ve en cada celda; el contador original queda fuera del recorte).
const VDN_EXTRA = [
  { src: '../historias/img/vdn-videos-instagram.webp', crop: { left: 234, top: 436, width: 231, height: 289 }, views: '144 mil', who: 'VDN Performance' },
  { src: '../historias/img/vdn-videos-tiktok.webp', crop: { left: 8, top: 944, width: 216, height: 270 }, views: '114,5 mil', who: 'VDN Performance' },
  { src: '../historias/img/vdn-videos-instagram.webp', crop: { left: 0, top: 850, width: 232, height: 290 }, views: '60,9 mil', who: 'VDN Performance' },
];
// Otros tres de VDN para "Vídeos que traen clientes" (así no se repiten los de su historia).
const VDN_MORE = [
  { src: '../historias/img/vdn-videos-tiktok.webp', crop: { left: 242, top: 634, width: 216, height: 270 }, views: '32,7 mil', who: 'VDN Performance' },
  { src: '../historias/img/vdn-videos-tiktok.webp', crop: { left: 242, top: 14, width: 216, height: 270 }, views: '30,3 mil', who: 'VDN Performance' },
  { src: '../historias/img/vdn-videos-instagram.webp', crop: { left: 467, top: 436, width: 232, height: 290 }, views: '28,9 mil', who: 'VDN Performance' },
];
// Lo que me diferencia (lo que era "Lo de siempre vs AAS" en la web).
const DIFERENCIA = [
  ['Te piden que grabes tú.', 'Voy yo a grabar a tu negocio.'],
  ['Publicar por publicar.', 'Estrategia mensual.'],
  ['Vídeos sin gancho.', 'Gancho en 3 segundos y subtítulos.'],
  ['Anuncios sin contenido detrás.', 'Contenido y anuncios juntos.'],
  ['Nadie te explica nada.', 'Informe y reunión cada mes.'],
  ['Seguidores comprados.', 'Crecimiento real.'],
];

// Iconos que no están en el sprite de la web (trazo de 24x24).
const extra = {
  user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.9-3.6 3.7-5.6 7.2-5.6s6.3 2 7.2 5.6"/>',
  quote: '<path d="M5 17.5V20l3.6-2.5H17a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v7a3 3 0 0 0 1 2.3z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/>',
  trend: '<path d="M4 17l5.5-5.5 4 4L20 9"/><path d="M15 9h5v5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
  web: '<rect x="3.5" y="4.5" width="17" height="13" rx="2"/><path d="M3.5 8.5h17M9 21h6M12 17.5V21"/>',
  bag: '<path d="M5 8h14l-1.2 11a1.6 1.6 0 0 1-1.6 1.5H7.8A1.6 1.6 0 0 1 6.2 19z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
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
.t-text.xl{font-size:35px;line-height:1.5;margin-top:40px}
.t-text.xxl{font-size:30px;line-height:1.46;margin-top:34px}
.t-text.s{font-size:60px;line-height:1.3;font-weight:650;letter-spacing:-.02em}
.stat-t{font-size:27px;font-weight:700;color:rgba(245,245,243,.7)}
.hl{margin-top:40px;padding:36px 34px;border-radius:30px;background:#1a1a1c}
.hl-t{margin-top:16px;font-size:52px;font-weight:800;line-height:1.1;letter-spacing:-.03em}
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
/* Título de servicio en grande */
.bigt{margin-top:30px;font-size:132px;font-weight:800;line-height:.93;letter-spacing:-.05em;text-transform:uppercase}
/* Puntos con explicación */
.items{margin-top:46px;display:grid}
.item{display:flex;gap:26px;align-items:flex-start;padding:24px 0;border-top:2px solid rgba(12,12,13,.08)}
.item:last-child{border-bottom:2px solid rgba(12,12,13,.08)}
.item .ic{flex:none;display:grid;place-items:center;width:54px;height:54px;margin-top:2px;border-radius:50%;background:#0c0c0d;color:#fff}
.item b{display:block;font-size:36px;font-weight:750;letter-spacing:-.01em;line-height:1.2}
.item span{display:block;margin-top:6px;font-size:28px;line-height:1.4;color:#6d6d75}
.dark .item{border-color:rgba(245,245,243,.14)}
.dark .item .ic{background:#f5f5f3;color:#0c0c0d}
.dark .item span{color:rgba(245,245,243,.62)}
/* Otros servicios */
.svc{display:grid;gap:22px;margin-top:50px}
.svc-card{display:flex;gap:32px;align-items:center;padding:42px 40px;border-radius:34px;background:#fff;box-shadow:0 16px 40px -26px rgba(16,16,18,.3)}
.svc-card .ic{flex:none;display:grid;place-items:center;width:96px;height:96px;border-radius:50%;background:#0c0c0d;color:#fff}
.svc-card b{display:block;font-size:46px;font-weight:800;letter-spacing:-.02em}
.svc-card span{display:block;margin-top:8px;font-size:30px;line-height:1.4;color:#6d6d75}
/* Lo que me diferencia */
.cmp{display:grid;gap:14px;margin-top:46px}
.cmp-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.cmp-row div{display:flex;gap:14px;align-items:center;padding:24px 24px;border-radius:24px;font-size:28px;line-height:1.3}
.cmp-row .no{background:#fff;color:#8a8a91;box-shadow:0 10px 30px -22px rgba(16,16,18,.3)}
.cmp-row .yes{background:#0c0c0d;color:#f5f5f3;font-weight:700}
.cmp-row svg{flex:none}
.cmp-head{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:44px;font-size:24px;font-weight:750;letter-spacing:.14em;text-transform:uppercase;color:#7a7a82}
/* Cierre: escríbeme INFO por mensaje, con la flecha hacia el campo de mensaje */
.dm{position:absolute;left:84px;right:84px;top:420px;display:flex;flex-direction:column;align-items:center;text-align:center}
.dm-t{margin-top:30px;font-size:132px;font-weight:800;line-height:.95;letter-spacing:-.05em;text-transform:uppercase}
.dm-info{display:inline-block;margin-top:30px;padding:14px 56px 22px;border:5px solid #f5f5f3;border-radius:999px;font-size:150px;font-weight:800;letter-spacing:-.04em;line-height:1}
.dm .lead{max-width:22ch;margin-top:44px}
.dm-arrow{position:absolute;left:480px;top:1330px;color:#f5f5f3}
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

// ---------- Historias

// Cierre de cada destacada: que escriban «INFO» por mensaje. La flecha baja
// recta hacia el campo «Enviar mensaje» de Instagram, centrado abajo.
const dm = (eyebrow) => doc(`${top('Escríbeme')}
<div class="dm">
  <p class="eyebrow">${esc(eyebrow)}</p>
  <h2 class="dm-t">Escríbeme</h2>
  <span class="dm-info">INFO</span>
  <p class="lead">por mensaje y te cuento cómo conseguir más clientes desde tus redes.</p>
</div>
<svg class="dm-arrow" width="120" height="300" viewBox="0 0 120 300" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M60 10v270"/>
  <path d="M14 232l46 48 46-48"/>
</svg>`, 'dark');

const items = (list, ic) => `<div class="items">${list.map(([t, d]) => `<div class="item"><span class="ic">${ic}</span><div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join('')}</div>`;

async function clientes() {
  // Sin CreArte en las historias (por petición suya).
  const accs = await Promise.all(ACCOUNTS.filter((a) => a.file !== 'crearte').map((a) => cropped(`img/accounts/${a.file}.webp`)));
  // "+10 millones": las 9 con más visitas. "Vídeos que traen clientes": las
  // demás y tres más de VDN, de más a menos visitas.
  const vdnBest = [...RESULTS.filter((r) => r.who === 'VDN Performance'), ...VDN_EXTRA]
    .sort((a, b) => parseFloat(b.views.replace(',', '.')) - parseFloat(a.views.replace(',', '.')));
  const more = [...RESULTS.slice(9), ...VDN_MORE].sort((a, b) => parseFloat(b.views.replace(',', '.')) - parseFloat(a.views.replace(',', '.')));
  const vdnLogo = await cropped(VDN.logo);
  const exAvatar = await cropped(EXONERIS.avatar.src, EXONERIS.avatar.crop);
  const exProfile = await cropped(EXONERIS.profile.src);
  const exStats = await Promise.all(EXONERIS.shots.map((s) => cropped(s.src)));
  const exEngagement = await cropped(EXONERIS.engagement.src);
  const who = (logo, c) => `<div class="who"><img src="${logo}"><div><b>${esc(c.client)}</b><span>${esc(c.sector)}</span></div></div>`;
  return [
    ['00-portada', cover('Clientes', 'Resultados reales de las cuentas que llevo.', line(extra.trend, 96, 1.6))],
    ['01-cuentas', doc(`${top('Clientes')}
<div class="safe center">
  <p class="eyebrow">Confían en nosotros</p>
  <h2 class="h">+25 cuentas</h2>
  <p class="lead">Marcas personales y negocios que ya crecen en redes con nosotros.</p>
  <div class="accs">${accs.slice(0, 12).map((src) => `<img src="${src}">`).join('')}</div>
</div>${foot()}`)],
    ['02-mas-cuentas', doc(`${top('Clientes')}
<div class="safe center">
  <p class="eyebrow">Y la lista sigue</p>
  <h2 class="h m">Negocios de todo tipo</h2>
  <div class="accs" style="margin-top:44px">${accs.slice(12).map((src) => `<img src="${src}">`).join('')}</div>
</div>${foot()}`)],
    ['03-visitas', doc(`${top('Resultados')}
<div class="safe center">
  <p class="eyebrow">Visitas generadas</p>
  <h2 class="h">+10 millones</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;width:790px;margin:44px auto 0">
    ${(await Promise.all(RESULTS.slice(0, 9).map((r) => reel(r, { small: true, caption: false })))).join('')}
  </div>
</div>${foot()}`)],
    ['04-caso-vdn', doc(`${top('Caso de éxito')}
<div class="safe center">
  ${who(vdnLogo, VDN)}
  <h2 class="case-t" style="margin-top:32px;font-size:64px">${esc(VDN.title)}</h2>
  <div class="kpis" style="margin-top:30px;padding:24px 0"><div><b style="font-size:58px">+2.500</b><span>leads con Meta Ads en 2 meses</span></div><div><b style="font-size:58px">+5.000</b><span>seguidores entre todas las plataformas</span></div></div>
  <p class="stat-t" style="margin-top:28px;text-align:center">Sus 6 mejores vídeos</p>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;width:660px;margin:16px auto 0">
    ${(await Promise.all(vdnBest.map((r) => reel(r, { small: true, caption: false })))).join('')}
  </div>
</div>${foot()}`, 'dark')],
    ['05-caso-javier', doc(`${top('Caso de éxito')}
<div class="safe center">
  ${who(exAvatar, EXONERIS)}
  <h2 class="case-t" style="font-size:70px">${esc(EXONERIS.title)}</h2>
  <div class="kpis" style="padding:30px 0">${EXONERIS.kpis.map((k) => `<div><b style="font-size:60px">${esc(k.value)}</b><span>${esc(k.label)}</span></div>`).join('')}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;width:580px;margin:32px auto 0">
    ${(await Promise.all(EXONERIS.reels.map((r) => reel(r, { small: true, caption: false })))).join('')}
  </div>
  <div class="proof" style="margin-top:26px"><img src="${exProfile}"></div>
</div>${foot()}`, 'dark')],
    ['06-javier-estadisticas', doc(`${top('Caso de éxito')}
<div class="safe center">
  <p class="eyebrow">Javier Núñez · sus estadísticas</p>
  <h2 class="h m">Lo que dicen los números</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:44px">
    ${exStats.map((src) => `<div class="proof" style="margin:0"><img src="${src}"></div>`).join('')}
  </div>
  <div class="hl">
    <p class="eyebrow">Además de visitas, clientes</p>
    <p class="hl-t">+200 comentarios de personas interesadas en un solo vídeo</p>
    <div class="proof" style="margin-top:26px"><img src="${exEngagement}"></div>
  </div>
</div>${foot()}`, 'dark')],
    ['07-mas-resultados', doc(`${top('Resultados')}
<div class="safe center">
  <p class="eyebrow">Y muchos más</p>
  <h2 class="h m">Vídeos que traen clientes</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:52px">
    ${(await Promise.all(more.map((r) => reel(r, { small: true })))).join('')}
  </div>
</div>${foot()}`)],
    ['08-escribeme', dm('¿Quieres resultados así?')],
  ];
}

async function sobreMi() {
  const foto = await cropped('img/aleks/foto.jpg', { left: 160, top: 0, width: 1280, height: 1600 });
  const yes = icon.check({ size: 24 });
  const no = icon.x({ size: 24 });
  return [
    ['00-portada', cover('Sobre mí', 'Quién está detrás de tus redes.', line(extra.user, 96, 1.6))],
    ['01-soy-aleks', doc(`${top('Sobre mí')}
<div class="safe center" style="align-items:center;text-align:center">
  <div class="photo" style="width:640px;height:800px"><img src="${foto}"></div>
  <h2 class="h" style="margin-top:48px">Soy Aleks</h2>
  <p class="lead" style="margin-top:18px;max-width:26ch">Ayudo a negocios a conseguir clientes desde sus redes sociales, con vídeos que enganchan y anuncios en Meta.</p>
</div>${foot()}`, 'white')],
    ['02-mi-historia', doc(`${top('Sobre mí')}
<div class="safe center">
  <p class="eyebrow">Mi historia</p>
  <p class="big-q">Empecé haciendo páginas web para negocios.</p>
  <div class="rule"></div>
  <p class="lead" style="margin-top:0">Hoy me centro en sus redes sociales y sus anuncios en Meta, que es donde están sus clientes.</p>
  <p class="lead">${esc(ABOUT.lines[0])}</p>
  <p class="lead">Y si un negocio lo necesita, también le hago la web.</p>
</div>${foot()}`)],
    ['03-como-trabajo', doc(`${top('Sobre mí')}
<div class="safe center">
  <p class="eyebrow">Cómo trabajo</p>
  <p class="big-q">${esc(ABOUT.lines[1])}</p>
  <div class="rule"></div>
  <p class="lead" style="margin-top:0">Me desplazo a cualquier parte de España y de Europa: tú pones el negocio y yo grabo, edito y publico.</p>
  <p class="lead">Cada mes te explico qué ha funcionado y qué vamos a cambiar. Sin seguidores comprados: crecimiento real.</p>
</div>${foot()}`, 'white')],
    ['04-lo-que-me-diferencia', doc(`${top('Sobre mí')}
<div class="safe center">
  <p class="eyebrow">Lo que me diferencia</p>
  <h2 class="h m">Lo de siempre vs AAS</h2>
  <div class="cmp-head"><span>Lo de siempre</span><span>Conmigo</span></div>
  <div class="cmp" style="margin-top:18px">${DIFERENCIA.map(([a, b]) => `<div class="cmp-row"><div class="no">${no}${esc(a)}</div><div class="yes">${yes}${esc(b)}</div></div>`).join('')}</div>
</div>${foot()}`)],
    ['05-en-numeros', doc(`${top('Sobre mí')}
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
    ['06-escribeme', dm('¿Hablamos?')],
  ];
}

async function servicios() {
  const check = icon.check({ size: 28 });
  const stepIcons = { search: icon.search({ size: 34 }), pen: icon.pen({ size: 34 }), camera: icon.camera({ size: 34 }), film: icon.film({ size: 34 }), chart: icon.chart({ size: 34 }) };
  return [
    ['00-portada', cover('Servicios', 'Redes sociales, Meta Ads y todo lo demás.', line(extra.grid, 96, 1.6))],
    ['01-gestion-de-redes', doc(`${top('Servicios')}
<div class="safe center">
  <p class="eyebrow">Servicio principal</p>
  <h2 class="bigt">Gestión de redes sociales</h2>
  <p class="lead" style="max-width:24ch">Contenido que te trae clientes, de la estrategia a la publicación. Tú atiendes a tus clientes; yo hago que tus redes trabajen para ti.</p>
</div>${foot()}`, 'dark')],
    ['02-redes-que-incluye', doc(`${top('Gestión de redes')}
<div class="safe center">
  <p class="eyebrow">Qué incluye</p>
  <h2 class="h m">Me encargo de todo</h2>
  ${items(SERVICIOS.redes, check)}
</div>${foot()}`, 'white')],
    ['03-redes-resultados', doc(`${top('Gestión de redes')}
<div class="safe center">
  <p class="eyebrow">Resultados</p>
  <h2 class="h m">Lo que consigue</h2>
  <div class="nums" style="margin-top:30px">
    ${[stat('+10 M'), stat('946 mil'), { value: '+20.000', label: 'seguidores generados' }].map((x) => `<div class="num" style="padding:18px 0"><b>${esc(x.value)}</b><span>${esc(x.label)}</span></div>`).join('')}
  </div>
  <p class="stat-t" style="margin-top:26px;text-align:center">Vídeos virales de mis clientes</p>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;width:660px;margin:16px auto 0">${(await Promise.all(RESULTS.slice(0, 6).map((r) => reel(r, { small: true, caption: false })))).join('')}</div>
</div>${foot()}`, 'dark')],
    ['04-gestion-de-meta-ads', doc(`${top('Servicios')}
<div class="safe center">
  <p class="eyebrow">Servicio principal</p>
  <h2 class="bigt">Gestión de Meta Ads</h2>
  <p class="lead" style="max-width:24ch">Anuncios en Instagram y Facebook que llevan contactos directos a tu WhatsApp.</p>
</div>${foot()}`, 'white')],
    ['05-meta-ads-que-incluye', doc(`${top('Meta Ads')}
<div class="safe center">
  <p class="eyebrow">Qué incluye y qué consigue</p>
  <h2 class="h m">Anuncios que traen clientes</h2>
  ${items(SERVICIOS.ads, check)}
  <div class="card dark" style="margin-top:44px;display:flex;align-items:center;gap:32px;background:#1a1a1c">
    <b style="font-size:84px;font-weight:800;letter-spacing:-.045em;line-height:1">+2.500</b>
    <span style="font-size:30px;line-height:1.35;color:rgba(245,245,243,.7)">leads con Meta Ads en 2 meses para VDN Performance</span>
  </div>
</div>${foot()}`, 'dark')],
    ['06-otros-servicios', doc(`${top('Servicios')}
<div class="safe center">
  <p class="eyebrow">Y además</p>
  <h2 class="h m">Otros servicios</h2>
  <p class="lead">Para que tu negocio funcione también fuera de las redes.</p>
  <div class="svc">${SERVICIOS.otros.map(([ic, t, d]) => `<div class="svc-card"><span class="ic">${line(extra[ic], 44, 1.8)}</span><div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join('')}</div>
</div>${foot()}`)],
    ['07-como-lo-hacemos', doc(`${top('Servicios')}
<div class="safe center">
  <p class="eyebrow">Cómo lo hacemos</p>
  <h2 class="h m">Paso a paso</h2>
  <div class="steps">${WORK.map((w) => `<div class="step"><span class="ic">${stepIcons[w.icon]}</span><div><b>${esc(w.title)}</b><span>${esc(w.text)}</span></div></div>`).join('')}</div>
</div>${foot()}`)],
    ['08-estrategia-gratis', doc(`${top('Servicios')}
<div class="safe center">
  <p class="eyebrow">Empieza aquí</p>
  <h2 class="h m">Tu estrategia gratis</h2>
  <p class="lead">En menos de 24 horas. Sin llamadas y sin compromiso.</p>
  <div class="steps">${PASOS_ESTRATEGIA.map((x, i) => `<div class="step" style="align-items:center"><span class="ic" style="font-size:32px;font-weight:800">${i + 1}</span><div><b style="font-size:34px;font-weight:700">${esc(x)}</b></div></div>`).join('')}</div>
</div>${foot()}`, 'white')],
    ['09-escribeme', dm('¿Empezamos?')],
  ];
}

async function testimonios() {
  const quote = line('<path d="M9.5 7C6.5 8 5 10.4 5 13.6V17h4.5v-4.5H7.3c.1-1.9 1-3.2 2.7-3.9zM18.5 7c-3 1-4.5 3.4-4.5 6.6V17h4.5v-4.5h-2.2c.1-1.9 1-3.2 2.7-3.9z" fill="currentColor" stroke="none"/>', 110);
  const initials = (n) => n.replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const slug = (n) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  // Una opinión por historia, entera; las muy largas, con la letra algo menor.
  const one = (t) => {
    const size = t.text.length > 900 ? ' xxl' : t.text.length > 600 ? ' xl' : t.text.length > 300 ? ' l' : t.text.length < 160 ? ' s' : '';
    return doc(`${top('Testimonios')}
<div class="safe center">
  <div class="t-stars">${stars(46)}</div>
  ${size === ' xl' || size === ' xxl' ? '' : `<div class="t-quote">${quote}</div>`}
  <p class="t-text${size}">${esc(t.text)}</p>
  <div class="t-who"><span class="t-av">${esc(initials(t.name))}</span><div><b>${esc(t.name)}</b><span>${esc(t.role)}</span></div></div>
</div>${foot()}`, 'white');
  };
  return [
    ['00-portada', cover('Testimonios', `${RATING}. Lo que dicen mis clientes.`, line(extra.quote, 96, 1.6))],
    ...TESTIMONIALS.map((t, i) => [`${String(i + 1).padStart(2, '0')}-${slug(t.name)}`, one(t)]),
    [`${String(TESTIMONIALS.length + 1).padStart(2, '0')}-escribeme`, dm('¿Te ayudo a ti?')],
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

Cada destacada termina con «Escríbeme INFO por mensaje» y una flecha centrada
que apunta al campo «Enviar mensaje» de Instagram.
`);
execFileSync('zip', ['-qr', 'historias-aas.zip', '.', '-x', 'historias-aas.zip'], { cwd: OUT });
console.log(`${n} imágenes en historias/salida (y historias-aas.zip)`);
