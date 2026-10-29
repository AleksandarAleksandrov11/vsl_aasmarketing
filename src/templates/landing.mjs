// Landing: una sola página con un único objetivo, que rellenen el formulario.
// Antes del formulario no hay enlaces a WhatsApp, teléfono, correo ni
// Instagram: todos los CTA bajan a #formulario.

import { esc, icon, picture, sprite, stars } from '../../scripts/lib/html.mjs';
import {
  SITE, CTA, META, HERO, STATS, PAINS, RESULTS, VDN, EXONERIS, SERVICES, COMPARE, STEPS,
  VIDEOS, ACCOUNTS, TESTIMONIALS, ABOUT, FORM, FAQS, CLOSING,
} from '../data/content.mjs';
import { SERVICIOS, SECTORES } from '../../shared/options.js';
import { COUNTRIES, OTHER } from '../../shared/phone.js';
import { head, header, footer, stickyCta, cookieBanner } from './layout.mjs';

const ctaBtn = (cls = 'btn', attrs = '') => `<a class="${cls}" href="#formulario"${attrs}>${CTA} ${icon.arrow()}</a>`;
const initials = (name) => name.replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

async function hero(ctx) {
  const [left, main, right] = HERO.phones;
  const phone = async (p, cls, priority) => `<figure class="phone ${cls}">${await picture(ctx.assets, p.src, {
    alt: p.alt,
    widths: [270, 400, 540, 800],
    sizes: cls === 'phone-main' ? '(min-width: 1024px) 220px, calc((100vw - 40px) * 0.44 - 10px)' : '(min-width: 1024px) 168px, calc((100vw - 40px) * 0.34 - 10px)',
    priority,
  })}</figure>`;
  return `<section class="hero" aria-labelledby="hero-title">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <h1 id="hero-title">${esc(HERO.titleBefore)}<span class="serif">${esc(HERO.titleSerif)}</span>${esc(HERO.titleAfter)}</h1>
      <p class="hero-sub">${esc(HERO.sub)}</p>
      <div class="hero-cta">${ctaBtn('btn', ' data-hero-cta')}</div>
      <p class="hero-note">${esc(HERO.note)}</p>
      <ul class="trust">
        <li>${icon.star()} 5,0 en Google</li>
        <li>+25 cuentas</li>
        <li>+10 M de visitas</li>
      </ul>
    </div>
    <div class="hero-visual">
      ${await phone(left, 'phone-side', false)}
      ${await phone(main, 'phone-main', true)}
      ${await phone(right, 'phone-side', false)}
    </div>
  </div>
</section>`;
}

function stats() {
  return `<section class="sec-tight" aria-label="Resultados en cifras">
  <div class="wrap">
    <ul class="stats">
      ${STATS.map((s) => `<li class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></li>`).join('\n      ')}
    </ul>
  </div>
</section>`;
}

function pains() {
  return `<section class="sec sec-soft" aria-labelledby="t-suena">
  <div class="wrap">
    <div class="sec-head"><h2 class="h2" id="t-suena">¿Te <span class="serif">suena</span>?</h2></div>
    <ul class="pains">
      ${PAINS.map((p) => `<li><span class="ico">${icon.x()}</span>${esc(p)}</li>`).join('\n      ')}
    </ul>
    <div class="cta-row">${ctaBtn()}</div>
  </div>
</section>`;
}

async function results(ctx) {
  const cards = await Promise.all(RESULTS.map(async (r) => `<figure class="rcard">
        <div class="rcard-img">${await picture(ctx.assets, r.src, { alt: r.alt, widths: [300, 450, 600], sizes: '(min-width: 1024px) 280px, calc((100vw - 40px) * 0.62)' })}</div>
        <figcaption><b>${esc(r.views)} visitas</b><span>${esc(r.who)}</span></figcaption>
      </figure>`));
  return `<section class="sec" aria-labelledby="t-resultados">
  <div class="wrap">
    <div class="sec-head"><h2 class="h2" id="t-resultados">Más de 10 millones de <span class="serif">visitas</span>.</h2></div>
    <div class="scroller results">
      ${cards.join('\n      ')}
    </div>
    <div class="cta-row">${ctaBtn()}</div>
  </div>
</section>`;
}

async function vdn(ctx) {
  const shot = async (src, alt, caption, widths, sizes, cls = '') => `<figure class="shot ${cls}">
          <div class="shot-img">${await picture(ctx.assets, src, { alt, widths, sizes })}</div>
          <figcaption>${caption}</figcaption>
        </figure>`;
  const logo = await ctx.assets.image('img/cases/vdn-logo.webp', [104]);
  return `<section class="sec sec-dark" id="caso-vdn" aria-labelledby="t-vdn">
  <div class="wrap">
    <div class="case-head">
      <h2 class="h2" id="t-vdn">${esc(VDN.title)}</h2>
      <div class="case-client">
        <img src="${logo.fallback}" width="52" height="52" alt="Logotipo de VDN Performance" loading="lazy" decoding="async">
        <div><b>${esc(VDN.client)}</b><span>${esc(VDN.sector)}</span></div>
      </div>
      <p class="lead">${esc(VDN.text)}</p>
    </div>
    <dl class="case-stats">
      ${VDN.stats.map((s) => `<div><dt>${esc(s.value)}</dt><dd>${esc(s.label)}</dd></div>`).join('\n      ')}
    </dl>
    <div class="case-media">
      <div class="case-side">
        ${await shot('img/cases/vdn-perfil-instagram.webp', 'Perfil de Instagram de VDN Performance con 1.768 seguidores', 'Instagram', [450, 900], '(min-width: 900px) 420px, 92vw', 'shot-wide')}
        ${await shot('img/cases/vdn-perfil-tiktok.webp', 'Perfil de TikTok de VDN Performance con 3.541 seguidores y 74,2 mil me gusta', 'TikTok', [450, 900], '(min-width: 900px) 420px, 92vw', 'shot-wide')}
        <figure class="shot shot-wide">
          <div class="shot-pair">
            <div class="shot-img">${await picture(ctx.assets, 'img/cases/vdn-anuncio-meta-1.webp', { alt: 'Anuncio de VDN Performance en Meta Ads sobre la reprogramación Stage 1', widths: [220, 396], sizes: '(min-width: 900px) 200px, 45vw' })}</div>
            <div class="shot-img">${await picture(ctx.assets, 'img/cases/vdn-anuncio-meta-2.webp', { alt: 'Anuncio de VDN Performance en Meta Ads sobre los motores más fiables', widths: [220, 396], sizes: '(min-width: 900px) 200px, 45vw' })}</div>
          </div>
          <figcaption>Anuncios en Meta Ads</figcaption>
        </figure>
      </div>
      ${await shot('img/cases/vdn-videos-instagram.webp', 'Cuadrícula de vídeos de VDN Performance en Instagram con sus visualizaciones', 'Vídeos en Instagram', [350, 700], '(min-width: 900px) 360px, 45vw')}
      ${await shot('img/cases/vdn-videos-tiktok.webp', 'Cuadrícula de vídeos de VDN Performance en TikTok con sus visualizaciones', 'Vídeos en TikTok', [350, 700], '(min-width: 900px) 360px, 45vw')}
    </div>
    <div class="cta-row">${ctaBtn('btn btn-light')}</div>
  </div>
</section>`;
}

async function exoneris(ctx) {
  return `<section class="sec" id="caso-exoneris" aria-labelledby="t-exoneris">
  <div class="wrap ex-grid">
    <figure class="phone ex-phone">${await picture(ctx.assets, 'img/cases/exoneris-primer-video.webp', {
      alt: 'Primer vídeo de Javier Núñez en Instagram, con 106 mil visualizaciones', widths: [280, 401], sizes: '(min-width: 900px) 320px, 62vw',
    })}</figure>
    <div>
      <h2 class="h2 ex-title" id="t-exoneris"><b>${esc(EXONERIS.titleA)}</b> <span>${esc(EXONERIS.titleB)}</span></h2>
      <p class="lead">${esc(EXONERIS.text)}</p>
      <dl class="ex-stats">
        ${EXONERIS.stats.map((s) => `<div><dt>${esc(s.value)}</dt><dd>${esc(s.label)}</dd></div>`).join('\n        ')}
      </dl>
      <div class="ex-shots">
        <figure class="shot"><div class="shot-img">${await picture(ctx.assets, 'img/cases/exoneris-estadisticas.webp', { alt: 'Estadísticas del primer vídeo: 106.866 reproducciones y 652 seguidores nuevos', widths: [450, 900], sizes: '(min-width: 900px) 330px, 92vw' })}</div></figure>
        <figure class="shot"><div class="shot-img">${await picture(ctx.assets, 'img/cases/exoneris-perfil.webp', { alt: 'Perfil de Instagram de Javier Núñez, de Exoneris Consulting', widths: [450, 900], sizes: '(min-width: 900px) 330px, 92vw' })}</div></figure>
      </div>
    </div>
  </div>
</section>`;
}

function services() {
  const card = (s) => `<article class="svc-card">
        <h3 class="h3">${esc(s.title)}</h3>
        <ul class="checks">${s.items.map((i) => `<li>${icon.check()}${esc(i)}</li>`).join('')}</ul>
      </article>`;
  return `<section class="sec sec-soft" id="servicios" aria-labelledby="t-servicios">
  <div class="wrap">
    <div class="sec-head"><h2 class="h2" id="t-servicios">Qué hacemos.</h2></div>
    <div class="svc-grid">
      ${card(SERVICES[0])}
      <span class="svc-plus" aria-hidden="true">${icon.plus()}</span>
      ${card(SERVICES[1])}
    </div>
    <p class="svc-both">Las dos juntas funcionan mejor: contenido para que te conozcan, anuncios para que te elijan.</p>
    <p class="svc-web">Y si hace falta, también tu web.</p>
  </div>
</section>`;
}

function filming(ctx) {
  return `<section class="sec" id="grabacion" aria-labelledby="t-grabacion">
  <div class="wrap">
    <div class="film">
      <div>
        <h2 class="h2" id="t-grabacion">Voy a grabar a tu <span class="serif">negocio</span>.</h2>
        <p class="lead">Me desplazo a cualquier parte de España y de Europa. Tú solo pones el negocio: yo grabo, edito y publico.</p>
        <p class="film-alt">¿Prefieres grabar tú? Te paso los guiones y las indicaciones para que salga bien.</p>
        <div class="cta-row">${ctaBtn()}</div>
      </div>
      <figure class="film-map"><img src="${ctx.asset.map}" width="${ctx.mapSize.width}" height="${ctx.mapSize.height}" alt="Mapa de España y Europa" loading="lazy" decoding="async"></figure>
    </div>
  </div>
</section>`;
}

function compare() {
  return `<section class="sec sec-soft" id="comparativa" aria-labelledby="t-cmp">
  <div class="wrap">
    <div class="sec-head"><h2 class="h2" id="t-cmp">Lo de siempre vs AAS.</h2></div>
    <table class="cmp">
      <caption class="sr-only">Comparativa entre lo habitual y cómo trabaja AAS Marketing</caption>
      <thead><tr><th scope="col">Lo de siempre</th><th scope="col">AAS</th></tr></thead>
      <tbody>
        ${COMPARE.map(([a, b]) => `<tr><td><span class="cell">${icon.x()}<span>${esc(a)}</span></span></td><td><span class="cell">${icon.check()}<span>${esc(b)}</span></span></td></tr>`).join('\n        ')}
      </tbody>
    </table>
    <div class="cta-row">${ctaBtn()}</div>
  </div>
</section>`;
}

function steps() {
  return `<section class="sec" id="como-funciona" aria-labelledby="t-pasos">
  <div class="wrap">
    <div class="sec-head">
      <h2 class="h2" id="t-pasos">Así de <span class="serif">fácil</span>.</h2>
      <p class="lead">Sin llamadas y sin compromiso.</p>
    </div>
    <ol class="steps">
      ${STEPS.map((s, i) => `<li><span class="step-n" aria-hidden="true">${i + 1}</span><p>${esc(s)}</p></li>`).join('\n      ')}
    </ol>
  </div>
</section>`;
}

async function videos(ctx) {
  const items = await Promise.all(VIDEOS.map(async (v) => {
    const src = await ctx.assets.file(`video/${v.file}.mp4`);
    const poster = await picture(ctx.assets, `video/${v.file}.webp`, { alt: '', widths: [270, 405, 540], sizes: '(min-width: 1024px) 270px, calc((100vw - 40px) * 0.64 - 10px)' });
    return `<figure class="reel">
        <div class="phone">
          <button type="button" class="reel-play" data-video="${src}" aria-label="Reproducir vídeo: ${esc(v.title)}">${poster}<span class="play">${icon.play()}</span></button>
        </div>
        <figcaption><b>${esc(v.title)}</b><span>${esc(v.text)}</span></figcaption>
      </figure>`;
  }));
  return `<section class="sec sec-soft" id="videos" aria-labelledby="t-videos">
  <div class="wrap">
    <div class="sec-head"><h2 class="h2" id="t-videos">Vídeos que se ven hasta el <span class="serif">final</span>.</h2></div>
    <div class="scroller reels">
      ${items.join('\n      ')}
    </div>
  </div>
</section>`;
}

async function accounts(ctx) {
  const items = await Promise.all(ACCOUNTS.map(async (a) => {
    const alt = `Perfil de Instagram de ${a.name}${a.sector ? `, ${a.sector}` : ''}, con ${a.followers} seguidores`;
    return `<figure class="acc">${await picture(ctx.assets, `img/accounts/${a.file}.webp`, { alt, widths: [500, 1000], sizes: '(min-width: 1024px) 340px, min(300px, 78vw)' })}</figure>`;
  }));
  return `<section class="sec" id="cuentas" aria-labelledby="t-cuentas">
  <div class="wrap">
    <div class="sec-head"><h2 class="h2" id="t-cuentas">Únete a las más de 25 cuentas que ya confían en nosotros.</h2></div>
    <div class="scroller accounts" data-carousel="cuentas">
      ${items.join('\n      ')}
    </div>
    <div class="car-nav" data-carousel-nav="cuentas">
      <button type="button" class="car-btn" data-dir="-1" aria-label="Ver cuentas anteriores" disabled>${icon.chevronL()}</button>
      <button type="button" class="car-btn" data-dir="1" aria-label="Ver más cuentas">${icon.chevronR()}</button>
    </div>
  </div>
</section>`;
}

function testimonials() {
  const cards = TESTIMONIALS.map((t) => `<figure class="tcard${t.text.length > 300 ? ' is-clamped' : ''}">
        <span class="stars" role="img" aria-label="5 de 5 estrellas">${stars(16)}</span>
        <blockquote>${esc(t.text)}</blockquote>
        ${t.text.length > 300 ? '<button type="button" class="more" data-more hidden>Leer más</button>' : ''}
        <figcaption><span class="avatar" aria-hidden="true">${esc(initials(t.name))}</span><span><b>${esc(t.name)}</b><span>${esc(t.role)}</span></span></figcaption>
      </figure>`);
  return `<section class="sec sec-soft" id="opiniones" aria-labelledby="t-opiniones">
  <div class="wrap">
    <div class="sec-head">
      <h2 class="h2" id="t-opiniones">5,0 en Google.</h2>
      <a class="g-link" href="${SITE.reviews}" target="_blank" rel="noopener"><span class="stars">${stars(17)}</span> <u>5,0 en Google</u> · ver reseñas ${icon.arrow({ size: 16 })}</a>
    </div>
    <div class="scroller tcards" data-carousel="opiniones">
      ${cards.join('\n      ')}
    </div>
    <div class="car-nav" data-carousel-nav="opiniones">
      <button type="button" class="car-btn" data-dir="-1" aria-label="Opiniones anteriores" disabled>${icon.chevronL()}</button>
      <button type="button" class="car-btn" data-dir="1" aria-label="Más opiniones">${icon.chevronR()}</button>
    </div>
  </div>
</section>`;
}

async function about(ctx) {
  // Para poner una foto: deja assets/img/aleks/foto.jpg (o .png/.webp) y vuelve a desplegar.
  const media = ctx.aleksPhoto
    ? await picture(ctx.assets, ctx.aleksPhoto, { alt: 'Aleks, de AAS Marketing', widths: [480, 720, 960], sizes: '(min-width: 900px) 560px, 92vw' })
    : '<span class="brand-mark" role="img" aria-label="AAS Marketing"></span>';
  return `<section class="sec" id="sobre-aleks" aria-labelledby="t-aleks">
  <div class="wrap about">
    <div class="about-media">${media}</div>
    <div class="about-copy">
      <h2 class="h2" id="t-aleks">${esc(ABOUT.title)}</h2>
      ${ABOUT.lines.map((l) => `<p class="lead">${esc(l)}</p>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

function form() {
  const options = SERVICIOS.map((s) => `<label class="lf-opt"><input type="radio" name="servicio" value="${s.id}"><span>${esc(s.label)}</span></label>`).join('\n          ');
  const chips = SECTORES.map((s) => `<label class="lf-chip"><input type="radio" name="sector" value="${s.id}"><span>${esc(s.label)}</span></label>`).join('\n          ');
  const prefixes = COUNTRIES.map((c) => `<option value="${c.iso}"${c.iso === 'ES' ? ' selected' : ''}>${esc(c.name)} +${c.code}</option>`).join('')
    + `<option value="${OTHER}">Otro país (escribe el prefijo)</option>`;
  const next = `<button type="button" class="btn lf-next" data-next>Continuar ${icon.arrow()}</button>`;
  return `<section class="sec sec-soft" id="formulario" aria-labelledby="t-form">
  <div class="wrap">
    <div class="sec-head center form-head">
      <h2 class="h2" id="t-form">Te mando tu estrategia <span class="serif">gratis</span>.</h2>
      <p class="lead">${esc(FORM.intro)}</p>
      <p class="form-meta">${esc(FORM.sub)}</p>
    </div>
    <div class="lead-card" data-lead>
      <form class="lf" data-form novalidate>
        <div class="lf-top">
          <button type="button" class="lf-back" data-back hidden>${icon.back()} Atrás</button>
          <span class="lf-count" aria-hidden="true"><span data-count>1</span>/5</span>
        </div>
        <div class="lf-bar" aria-hidden="true"><span data-bar></span></div>
        <p class="sr-only" aria-live="polite" data-live></p>
        <div class="hp" aria-hidden="true">
          <label for="f-hp">Deja este campo vacío</label>
          <input id="f-hp" name="hp_check" type="text" tabindex="-1" autocomplete="off">
        </div>

        <fieldset class="lf-step" data-step="1">
          <legend class="lf-q">¿Qué necesitas?</legend>
          <div class="lf-options">
          ${options}
          </div>
        </fieldset>

        <fieldset class="lf-step" data-step="2" hidden>
          <legend class="lf-q">¿A qué se dedica tu negocio?</legend>
          <div class="lf-chips">
          ${chips}
          </div>
          <div class="lf-other" data-other hidden>
            <label class="lf-label" for="f-otro">Cuéntame en pocas palabras</label>
            <input class="lf-input" id="f-otro" name="sector_otro" type="text" maxlength="80" autocomplete="off" enterkeyhint="next" placeholder="Ej.: escuela de música" aria-describedby="e-otro">
            <p class="lf-err" id="e-otro" data-err></p>
            ${next}
          </div>
        </fieldset>

        <div class="lf-step" data-step="3" hidden>
          <label class="lf-q" for="f-perfil">¿Cuál es el Instagram de tu negocio?</label>
          <input class="lf-input" id="f-perfil" name="perfil" type="text" maxlength="200" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="next" placeholder="@tunegocio" aria-describedby="h-perfil e-perfil">
          <p class="lf-help" id="h-perfil">Si no tienes Instagram, pon tu TikTok o tu web.</p>
          <p class="lf-err" id="e-perfil" data-err></p>
          ${next}
        </div>

        <div class="lf-step" data-step="4" hidden>
          <label class="lf-q" for="f-nombre">¿Cómo te llamas?</label>
          <input class="lf-input" id="f-nombre" name="nombre" type="text" maxlength="60" autocomplete="given-name" autocapitalize="words" enterkeyhint="next" placeholder="Tu nombre" aria-describedby="e-nombre">
          <p class="lf-err" id="e-nombre" data-err></p>
          ${next}
        </div>

        <div class="lf-step" data-step="5" hidden>
          <label class="lf-q" for="f-tel">¿A qué WhatsApp te mando la estrategia?</label>
          <div class="lf-phone">
            <div class="lf-prefix">
              <span data-prefix-label aria-hidden="true">+34</span>
              <label class="sr-only" for="f-prefijo">Prefijo del país</label>
              <select id="f-prefijo" name="prefijo" autocomplete="off">${prefixes}</select>
            </div>
            <input class="lf-input" id="f-tel" name="telefono" type="tel" inputmode="tel" autocomplete="tel-national" maxlength="20" enterkeyhint="send" placeholder="600 000 000" aria-describedby="e-tel">
          </div>
          <p class="lf-err" id="e-tel" data-err></p>
          <button type="submit" class="btn lf-submit" data-submit>Enviar y abrir WhatsApp ${icon.arrow()}</button>
          <p class="lf-legal">Al enviar aceptas la <a href="/privacidad" target="_blank" rel="noopener">política de privacidad</a>. Usamos tus datos solo para responderte.</p>
        </div>
        <noscript><p class="lf-help">Para enviar el formulario necesitas activar JavaScript.</p></noscript>
      </form>

      <div class="lf-done" data-done tabindex="-1" hidden>
        <div class="done-ico">${icon.check()}</div>
        <h3 data-done-title>¡Listo!</h3>
        <p>Analizo tu perfil y te mando la estrategia por WhatsApp en menos de 24 horas.</p>
        <p class="done-redirect" data-done-redirect>Abriendo WhatsApp…</p>
        <a class="btn btn-wa" href="https://wa.me/${SITE.whatsapp}" data-wa rel="noopener">${icon.whatsapp()} Abrir WhatsApp</a>
        <button type="button" class="btn-again" data-again>Enviar otra solicitud</button>
      </div>
    </div>
  </div>
</section>`;
}

function faq() {
  return `<section class="sec" id="preguntas" aria-labelledby="t-faq">
  <div class="wrap narrow">
    <div class="sec-head"><h2 class="h2" id="t-faq">Preguntas frecuentes.</h2></div>
    <div class="faq">
      ${FAQS.map((f) => `${f.review ? `<!-- [${f.review}] -->\n      ` : ''}<details class="faq-item"><summary>${esc(f.q)}${icon.plus()}</summary><p>${esc(f.a)}</p></details>`).join('\n      ')}
    </div>
    <div class="cta-row">${ctaBtn()}</div>
  </div>
</section>`;
}

function closing() {
  return `<section class="sec sec-dark closing" aria-labelledby="t-cierre">
  <div class="wrap">
    <h2 class="h2" id="t-cierre">Tus redes pueden traerte <span class="serif">clientes</span>.</h2>
    <p class="lead">${esc(CLOSING.sub)}</p>
    <div class="cta-row">${ctaBtn('btn btn-light')}</div>
  </div>
</section>`;
}

export function faqJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

export async function landing(ctx) {
  return `${head(ctx, { title: META.title, description: META.description, ogTitle: META.ogTitle, ogDescription: META.ogDescription, jsonLd: faqJsonLd() })}
<body>
${sprite()}
<a class="skip" href="#formulario">Saltar al formulario</a>
${header()}
<main id="main">
${await hero(ctx)}
${stats()}
${pains()}
${await results(ctx)}
${await vdn(ctx)}
${await exoneris(ctx)}
${services()}
${filming(ctx)}
${compare()}
${steps()}
${await videos(ctx)}
${await accounts(ctx)}
${testimonials()}
${await about(ctx)}
${form()}
${faq()}
${closing()}
</main>
${footer()}
${stickyCta()}
${cookieBanner()}
</body>
</html>`;
}
