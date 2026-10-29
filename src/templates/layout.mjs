// Estructura común: <head>, header, footer, CTA fijo y banner de cookies.

import { esc, icon } from '../../scripts/lib/html.mjs';
import { SITE, CTA, HEADER_CTA } from '../data/content.mjs';

export function head(ctx, { title, description, path = '/', ogTitle, ogDescription, jsonLd = '', robots = 'noindex, follow' }) {
  const url = SITE.url + path;
  const og = `${SITE.url}/og.jpg`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#ffffff">
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="website">
<meta property="og:site_name" content="AAS Marketing">
<meta property="og:locale" content="es_ES">
<meta property="og:title" content="${esc(ogTitle || title)}">
<meta property="og:description" content="${esc(ogDescription || description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="AAS Marketing. Estrategia gratis de redes sociales y Meta Ads.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle || title)}">
<meta name="twitter:description" content="${esc(ogDescription || description)}">
<meta name="twitter:image" content="${og}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="${ctx.asset.favicon}" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="32x32" href="${ctx.asset.favicon32}">
<link rel="icon" type="image/png" sizes="16x16" href="${ctx.asset.favicon16}">
<link rel="apple-touch-icon" href="${ctx.asset.appleTouch}">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="${ctx.asset.manrope}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${ctx.asset.serif}" as="font" type="font/woff2" crossorigin>
<style>${ctx.criticalCss}</style>
<link rel="preload" href="${ctx.asset.css}" as="style">
<noscript><link rel="stylesheet" href="${ctx.asset.css}"></noscript>
<script type="module" src="${ctx.asset.js}"></script>
${ctx.pixelId ? `<meta name="aas-pixel" content="${esc(ctx.pixelId)}">` : ''}
${ctx.analytics ? '<meta name="aas-analytics" content="1">' : ''}
${jsonLd}
</head>`;
}

// En las páginas legales el botón lleva al formulario de la landing.
export function header({ legal = false } = {}) {
  return `<div class="top-sentinel" data-top aria-hidden="true"></div>
<header class="hdr" data-header>
  <div class="wrap hdr-in">
    <a class="brand" href="/" aria-label="AAS Marketing, ir al inicio"><span class="brand-mark" aria-hidden="true"></span></a>
    <a class="btn btn-s" href="${legal ? '/' : ''}#formulario">${HEADER_CTA}</a>
  </div>
</header>`;
}

export function footer() {
  return `<footer class="ftr">
  <div class="wrap ftr-in">
    <a class="brand" href="/" aria-label="AAS Marketing, ir al inicio"><span class="brand-mark" aria-hidden="true"></span></a>
    <ul class="ftr-contact">
      <li><a href="https://wa.me/${SITE.whatsapp}" rel="noopener">${icon.whatsapp()} WhatsApp ${SITE.whatsappDisplay}</a></li>
      <li><a href="mailto:${SITE.email}">${icon.mail()} ${SITE.email}</a></li>
      <li><a href="${SITE.instagram}" rel="noopener">${icon.instagram()} Instagram ${SITE.instagramHandle}</a></li>
    </ul>
    <nav class="ftr-legal" aria-label="Legal">
      <a href="/aviso-legal">Aviso legal</a>
      <a href="/privacidad">Privacidad</a>
      <a href="/cookies">Cookies</a>
      <button type="button" data-open-cookies>Configurar cookies</button>
    </nav>
    <p class="ftr-copy">© 2026 AAS Marketing</p>
  </div>
</footer>`;
}

export function stickyCta() {
  return `<div class="sticky-cta" data-sticky aria-hidden="true">
  <a class="btn" href="#formulario" tabindex="-1">${CTA} ${icon.arrow()}</a>
</div>`;
}

export function cookieBanner() {
  return `<section class="ck" id="ck" aria-label="Cookies" hidden>
  <p>Uso cookies necesarias y, si aceptas, analítica y cookies de Meta para medir mis anuncios. <a href="/cookies">Más info</a></p>
  <div class="ck-panel" id="ck-panel" hidden>
    <div class="ck-row">
      <div><b>Necesarias</b><span>Hacen que la web y el formulario funcionen.</span></div>
      <span class="ck-always">Siempre activas</span>
    </div>
    <div class="ck-row">
      <label for="ck-ana"><b>Analítica</b><span>Vercel Analytics: visitas y velocidad, sin cookies.</span></label>
      <span class="switch"><input type="checkbox" id="ck-ana"><i></i></span>
    </div>
    <div class="ck-row">
      <label for="ck-mkt"><b>Marketing</b><span>Meta Pixel, para medir los anuncios.</span></label>
      <span class="switch"><input type="checkbox" id="ck-mkt"><i></i></span>
    </div>
  </div>
  <div class="ck-actions">
    <button type="button" class="btn" data-ck="reject">Rechazar</button>
    <button type="button" class="btn" data-ck="accept">Aceptar</button>
    <button type="button" class="ck-link" data-ck="config" aria-expanded="false" aria-controls="ck-panel">Configurar</button>
  </div>
</section>`;
}
