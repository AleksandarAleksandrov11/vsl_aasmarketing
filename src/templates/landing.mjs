// Landing: una sola página con un único objetivo, que rellenen el formulario.
// Antes del formulario no hay enlaces a WhatsApp, teléfono, correo ni
// Instagram: todos los CTA bajan a #formulario.
// Orden: hero, cifras, formulario, casos, resultados, ¿Te suena? + Así trabajo,
// cuentas y opiniones, Soy Aleks, preguntas y cierre.

import { esc, icon, picture, sprite, stars } from '../../scripts/lib/html.mjs';
import {
  SITE, CTA, RATING, META, HERO, HEADLINES, STATS, PAINS, RESULTS, VDN, EXONERIS, WORK, ACCOUNTS, TESTIMONIALS,
  ABOUT, FORM, FAQS, CLOSING,
} from '../data/content.mjs';
import { SERVICIOS, SECTORES } from '../../shared/options.js';
import { COUNTRIES, OTHER } from '../../shared/phone.js';
import { head, header, footer, stickyCta, cookieBanner, serverMeasurement } from './layout.mjs';

const ctaBtn = (cls = 'btn', attrs = '') => `<a class="${cls}" href="#formulario"${attrs}>${CTA} ${icon.arrow()}</a>`;
const initials = (name) => name.replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

// Captura de un reel: todas con el mismo recorte 4:5 y el contador de visitas igual.
async function reelCard(ctx, r, { sizes, widths = [300, 450, 600], priority = false, eager = false, caption = true, cls = '' }) {
  const img = await picture(ctx.assets, r.src, { alt: r.alt, widths, sizes, crop: r.crop, priority, eager });
  return `<figure class="rc${cls ? ` ${cls}` : ''}">
        <div class="rc-img">${img}<span class="rc-views" aria-hidden="true">${icon.play({ size: 14 })}${esc(r.views)}</span></div>
        ${caption ? `<figcaption><b>${esc(r.views)} visitas</b><span>${esc(r.who)}</span></figcaption>` : ''}
      </figure>`;
}

async function hero(ctx) {
  const [left, main, right] = HERO.cards;
  const side = '(min-width: 1024px) 230px, calc((100vw - 40px) * 0.35)';
  return `<section class="hero" aria-labelledby="hero-title">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <h1 class="hero-title" id="hero-title">${HERO.title.map((l) => `<span>${esc(l)}</span>`).join(' ')}</h1>
      <p class="hero-sub">${esc(HERO.sub)}</p>
      <div class="hero-cta">${ctaBtn('btn', ' data-hero-cta')}</div>
      <p class="hero-note">${esc(HERO.note)}</p>
      <ul class="trust">
        ${HERO.trust.map((t, i) => `<li>${i === 0 ? `${icon.star()} ` : ''}${esc(t)}</li>`).join('\n        ')}
      </ul>
    </div>
    <div class="hero-visual">
      ${await reelCard(ctx, left, { sizes: side, eager: true, caption: false, cls: 'rc-side' })}
      ${await reelCard(ctx, main, { sizes: '(min-width: 1024px) 300px, calc((100vw - 40px) * 0.48)', widths: [270, 400, 540, 800], priority: true, caption: false, cls: 'rc-main' })}
      ${await reelCard(ctx, right, { sizes: side, eager: true, caption: false, cls: 'rc-side' })}
    </div>
  </div>
</section>`;
}

// Bucle infinito: la lista se repite una vez para que no haya corte. La copia
// no se lee dos veces (aria-hidden) y sus botones no reciben el foco con el
// tabulador. Con "reducir movimiento" se queda quieto y se desliza con el dedo.
const loop = (tag, items, cls = '', attrs = '') => `<div class="mq${cls ? ` ${cls}` : ''}" data-marquee${attrs}>
    <${tag} class="mq-track">${items}</${tag}>
    <${tag} class="mq-track" aria-hidden="true">${items.replace(/<button /g, '<button tabindex="-1" ')}</${tag}>
  </div>`;

// Cifras: siempre en movimiento hacia la izquierda.
function stats() {
  const items = STATS.map((s) => `<li class="mq-item"><b>${s.star ? icon.star({ size: 22 }) : ''}${esc(s.value)}</b><span>${esc(s.label)}</span></li>`).join('');
  return `<section class="band" aria-label="Resultados en cifras">
  ${loop('ul', items)}
</section>`;
}

async function caseCard(ctx, c, { id, avatar }) {
  const shots = await Promise.all(c.shots.map((s) => picture(ctx.assets, s.src, { alt: s.alt, widths: [450, 900, 1206], sizes: '(min-width: 1024px) 520px, calc(100vw - 72px)' })));
  return `<article class="case" id="caso-${id}" aria-labelledby="t-${id}">
        <div class="case-who">${avatar}<p><b>${esc(c.client)}</b><span>${esc(c.sector)}</span></p></div>
        <h3 class="case-title" id="t-${id}">${esc(c.title)}</h3>
        <dl class="case-kpis">
          ${c.kpis.map((k) => `<div><dt>${esc(k.value)}</dt><dd>${esc(k.label)}</dd></div>`).join('\n          ')}
        </dl>
        <div class="case-proof">${shots.join('')}</div>
      </article>`;
}

async function cases(ctx) {
  const logo = await ctx.assets.image(VDN.logo, [104]);
  const vdnAvatar = `<img src="${logo.fallback}" width="48" height="48" alt="" loading="lazy" decoding="async">`;
  const exAvatar = await picture(ctx.assets, EXONERIS.avatar.src, { alt: '', widths: [96], sizes: '48px', crop: EXONERIS.avatar.crop });
  return `<section class="sec" id="casos" aria-labelledby="t-casos">
  <div class="wrap">
    <div class="sec-head"><h2 class="h2" id="t-casos">Casos reales</h2></div>
    <div class="cases">
      ${await caseCard(ctx, VDN, { id: 'vdn', avatar: vdnAvatar })}
      ${await caseCard(ctx, EXONERIS, { id: 'exoneris', avatar: exAvatar })}
    </div>
    <div class="cta-row">${ctaBtn()}</div>
  </div>
</section>`;
}

async function results(ctx) {
  const cards = await Promise.all(RESULTS.map((r) => reelCard(ctx, r, { sizes: '(min-width: 1024px) 280px, (min-width: 640px) 34vw, calc((100vw - 40px) * 0.58)' })));
  return `<section class="sec sec-soft" id="resultados" aria-labelledby="t-resultados">
  <div class="wrap">
    <div class="sec-head"><h2 class="h2" id="t-resultados">${esc(HEADLINES.results)}</h2></div>
    <div class="scroller results" tabindex="0" role="region" aria-label="Capturas de reels de clientes con sus visitas">
      ${cards.join('\n      ')}
    </div>
    <div class="cta-row">${ctaBtn()}</div>
  </div>
</section>`;
}

function work() {
  return `<section class="sec" id="como-trabajo" aria-labelledby="t-suena t-trabajo">
  <div class="wrap">
    <div class="sec-head"><h2 class="h2" id="t-suena">¿Te suena?</h2></div>
    <ul class="pains">
      ${PAINS.map((p) => `<li><span class="pain-x">${icon.x({ size: 18 })}</span>${esc(p)}</li>`).join('\n      ')}
    </ul>
    <div class="sec-head work-head"><h2 class="h2" id="t-trabajo">Así trabajo</h2></div>
    <ul class="work">
      ${WORK.map((w) => `<li${w.wide ? ' class="work-wide"' : ''}><span class="work-ico">${icon[w.icon]({ size: 22 })}</span><b>${esc(w.title)}</b><span>${esc(w.text)}</span></li>`).join('\n      ')}
    </ul>
    <div class="cta-row">${ctaBtn()}</div>
  </div>
</section>`;
}

async function proof(ctx) {
  const accounts = await Promise.all(ACCOUNTS.map(async (a) => {
    const alt = `Perfil de Instagram de ${a.name}${a.sector ? `, ${a.sector}` : ''}, con ${a.followers} seguidores`;
    return `<figure class="acc">${await picture(ctx.assets, `img/accounts/${a.file}.webp`, { alt, widths: [500, 1000], sizes: '(min-width: 1024px) 340px, min(300px, 78vw)' })}</figure>`;
  }));
  const long = (t) => t.text.length > 240;
  const reviews = TESTIMONIALS.map((t) => `<figure class="tcard"${long(t) ? ' data-long' : ''}>
        <span class="stars" role="img" aria-label="5 de 5 estrellas">${stars(16)}</span>
        <blockquote>${esc(t.text)}</blockquote>
        ${long(t) ? '<button type="button" class="more" data-more hidden>Leer más</button>' : ''}
        <figcaption><span class="avatar" aria-hidden="true">${esc(initials(t.name))}</span><span><b>${esc(t.name)}</b><span>${esc(t.role)}</span></span></figcaption>
      </figure>`);
  // Cuentas en bucle hacia la izquierda (empezando por las de más seguidores) y
  // opiniones hacia la derecha (empezando por la primera). Arrancan al llegar a
  // la sección, se pueden arrastrar con el dedo o el ratón y vuelven a moverse
  // solas a los 5 s. "Leer más" abre la opinión entera en una ventana, así todas
  // las tarjetas miden lo mismo.
  return `<section class="sec sec-soft" id="opiniones" aria-labelledby="t-cuentas">
  <div class="wrap">
    <div class="sec-head">
      <h2 class="h2" id="t-cuentas">${esc(HEADLINES.accounts)}</h2>
      <p class="g-rating">${esc(RATING)}</p>
    </div>
  </div>
  <div class="loop-accounts" role="region" aria-label="Perfiles de Instagram de clientes">
  ${loop('div', accounts.join(''), 'mq-pause', ' data-speed="45"')}
  </div>
  <div class="loop-reviews" role="region" aria-label="Opiniones de clientes">
  ${loop('div', reviews.join(''), 'mq-pause mq-rev', ' data-speed="30"')}
  </div>
  <div class="wrap">
    <div class="cta-row">${ctaBtn()}</div>
  </div>
  <dialog class="tdialog" id="tdialog" aria-labelledby="tdialog-name">
    <button type="button" class="tdialog-close" data-close aria-label="Cerrar">${icon.x({ size: 22 })}</button>
    <span class="stars" role="img" aria-label="5 de 5 estrellas">${stars(16)}</span>
    <blockquote data-quote></blockquote>
    <p class="tdialog-who"><b id="tdialog-name" data-name></b> <span data-role></span></p>
  </dialog>
</section>`;
}

async function about(ctx) {
  // Para poner la foto: deja assets/img/aleks/foto.jpg (o .png/.webp/.avif) y vuelve a desplegar.
  const media = ctx.aleksPhoto
    ? await picture(ctx.assets, ctx.aleksPhoto, { alt: 'Aleks, de AAS Marketing', widths: [400, 640, 800, 1080, 1200], sizes: '(min-width: 768px) 360px, min(320px, calc(100vw - 40px))' })
    : '<span class="brand-mark" role="img" aria-label="AAS Marketing"></span>';
  return `<section class="sec" id="sobre-aleks" aria-labelledby="t-aleks">
  <div class="wrap about${ctx.aleksPhoto ? ' has-photo' : ''}">
    <div class="about-media">${media}</div>
    <div class="about-copy">
      <h2 class="h2" id="t-aleks">${esc(ABOUT.title)}</h2>
      ${ABOUT.lines.map((l) => `<p class="lead">${esc(l)}</p>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

// Primera capa de información junto al botón de envío (art. 13 RGPD). Cambia
// según lo que mida la build: sin Meta, sin oposición que ofrecer.
function formNotice(ctx) {
  const policy = '<a href="/privacidad" target="_blank" rel="noopener">política de privacidad</a>';
  if (!ctx.pixelId) return `En AAS Marketing usamos tus datos para responderte. Más información y tus derechos en la ${policy}.`;
  const measure = serverMeasurement(ctx)
    ? 'convertidos en un código, para medir nuestros anuncios en Meta. Puedes oponerte a esa medición en <button type="button" class="lf-link" data-open-cookies>Configurar cookies</button>.'
    : 'si aceptaste las cookies de marketing, para medir nuestros anuncios en Meta.';
  return `En AAS Marketing usamos tus datos para responderte y, ${measure} Más información y tus derechos en la ${policy}.`;
}

function form(ctx) {
  const options = SERVICIOS.map((s) => `<label class="lf-opt"><input type="radio" name="servicio" value="${s.id}"><span>${esc(s.label)}</span></label>`).join('\n          ');
  const chips = SECTORES.map((s) => `<label class="lf-chip"><input type="radio" name="sector" value="${s.id}"><span>${esc(s.label)}</span></label>`).join('\n          ');
  const prefixes = COUNTRIES.map((c) => `<option value="${c.iso}"${c.iso === 'ES' ? ' selected' : ''}>${esc(c.name)} +${c.code}</option>`).join('')
    + `<option value="${OTHER}">Otro país (escribe el prefijo)</option>`;
  const next = `<button type="button" class="btn lf-next" data-next>Continuar ${icon.arrow()}</button>`;
  return `<section class="sec sec-soft form-sec" id="formulario" aria-labelledby="t-form">
  <div class="wrap">
    <div class="sec-head form-head">
      <h2 class="h2" id="t-form">${esc(FORM.title)}</h2>
      <p class="lead form-intro">${esc(FORM.intro)}</p>
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
          <p class="lf-legal">${formNotice(ctx)}</p>
        </div>
        <noscript><p class="lf-help">Para enviar el formulario necesitas activar JavaScript.</p></noscript>
      </form>

      <div class="lf-done" data-done tabindex="-1" hidden>
        <div class="done-ico">${icon.check()}</div>
        <h3 data-done-title>¡Listo!</h3>
        <p>${esc(FORM.done)}</p>
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
    <div class="sec-head"><h2 class="h2" id="t-faq">Preguntas frecuentes</h2></div>
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
    <h2 class="h2" id="t-cierre">${esc(CLOSING.title)}</h2>
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
${cookieBanner(ctx)}
${header()}
<main id="main">
${await hero(ctx)}
${stats()}
${form(ctx)}
${await cases(ctx)}
${await results(ctx)}
${work()}
${await proof(ctx)}
${await about(ctx)}
${faq()}
${closing()}
</main>
${footer(ctx)}
${stickyCta()}
</body>
</html>`;
}
