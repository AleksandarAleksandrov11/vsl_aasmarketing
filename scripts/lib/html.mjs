// Utilidades para las plantillas HTML.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto para HTML (contenido y atributos). */
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** Une clases ignorando las vacías. */
export const cx = (...list) => list.filter(Boolean).join(' ');

/**
 * <picture> con AVIF + WebP, srcset, medidas fijas y carga diferida.
 * `widths`: anchos a generar. `sizes`: ancho real en pantalla.
 */
export async function picture(assets, rel, { alt, widths, sizes, className, eager = false, priority = false, crop = null }) {
  const img = await assets.image(rel, widths, crop);
  const loading = eager || priority ? 'eager' : 'lazy';
  return `<picture>`
    + `<source type="image/avif" srcset="${img.avif}" sizes="${sizes}">`
    + `<source type="image/webp" srcset="${img.webp}" sizes="${sizes}">`
    + `<img src="${img.fallback}" width="${img.width}" height="${img.height}" alt="${esc(alt)}"`
    + `${className ? ` class="${className}"` : ''} loading="${loading}" decoding="${priority ? 'auto' : 'async'}"`
    + `${priority ? ' fetchpriority="high"' : ''}>`
    + `</picture>`;
}

/** Quita comentarios y sangría. Los marcadores [REVISAR]/[PENDIENTE] viven en las plantillas. */
export function minifyHtml(html) {
  return html
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

// Iconos: un sprite SVG al principio del <body> y <use> en cada uso, para no
// repetir los trazados (hay más de 60 estrellas en la página).
const STAR = 'M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z';
const SYMBOLS = {
  arrow: ['stroke', '<path d="M5 12h14M13 6l6 6-6 6"/>'],
  back: ['stroke', '<path d="M19 12H5M11 18l-6-6 6-6"/>'],
  check: ['stroke', '<path d="M5 12.5l4.5 4.5L19 7.5"/>'],
  x: ['stroke', '<path d="M7 7l10 10M17 7L7 17"/>'],
  plus: ['stroke', '<path d="M12 5v14M5 12h14"/>'],
  chevronL: ['stroke', '<path d="M15 6l-6 6 6 6"/>'],
  chevronR: ['stroke', '<path d="M9 6l6 6-6 6"/>'],
  play: ['fill', '<path d="M8 5.5v13l11-6.5z"/>'],
  search: ['stroke', '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'],
  pen: ['stroke', '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'],
  camera: ['stroke', '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/>'],
  film: ['stroke', '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M10 9.2v5.6l4.6-2.8z"/>'],
  chart: ['stroke', '<path d="M4 20h16M7 16v-4M12 16V8M17 16v-7"/>'],
  pin: ['stroke', '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'],
  star: ['fill', `<path d="${STAR}"/>`],
};

const use = (name, { size = 20, cls = '' } = {}) => {
  const [kind] = SYMBOLS[name];
  const paint = kind === 'fill' ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  return `<svg${cls ? ` class="${cls}"` : ''} width="${size}" height="${size}" viewBox="0 0 24 24" ${paint} aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
};

export const sprite = () =>
  `<svg class="sprite" aria-hidden="true" focusable="false"><defs>${Object.entries(SYMBOLS)
    .map(([name, [, body]]) => `<symbol id="i-${name}" viewBox="0 0 24 24">${body}</symbol>`)
    .join('')}<symbol id="i-stars" viewBox="0 0 120 24">${[0, 24, 48, 72, 96]
    .map((x) => `<path transform="translate(${x})" d="${STAR}"/>`)
    .join('')}</symbol></defs></svg>`;

/** Cinco estrellas en un solo SVG. */
export const stars = (size = 16) =>
  `<svg class="stars5" width="${size * 5}" height="${size}" viewBox="0 0 120 24" fill="currentColor" aria-hidden="true" focusable="false"><use href="#i-stars"/></svg>`;

// Iconos de una sola vez (pie de página): en línea.
const inline = (body, { size = 20, fill = 'none', sw = 2 } = {}) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${fill === 'none' ? 'currentColor' : 'none'}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const icon = {
  ...Object.fromEntries(Object.keys(SYMBOLS).map((name) => [name, (o) => use(name, o)])),
  whatsapp: (o) => inline('<path d="M12.04 2a9.9 9.9 0 0 0-8.44 15.12L2.1 21.9l4.9-1.46A9.9 9.9 0 1 0 12.04 2Zm0 18.02a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-2.9.86.87-2.83-.2-.3a8.12 8.12 0 1 1 6.66 3.58Zm4.45-6.08c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06a6.63 6.63 0 0 1-3.31-2.9c-.25-.43.25-.4.71-1.33.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.11 3.64.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.16-.46-.28Z"/>', { fill: 'currentColor', ...o }),
  instagram: (o) => inline('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none"/>', { sw: 1.8, ...o }),
  mail: (o) => inline('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M4 7l8 6 8-6"/>', { sw: 1.8, ...o }),
};
