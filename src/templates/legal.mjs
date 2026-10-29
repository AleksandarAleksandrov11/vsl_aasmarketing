// Páginas legales (aviso legal, privacidad, cookies) y 404.
// Basadas en las de aasmarketing.com con los datos del titular tal cual.
// Los párrafos nuevos o modificados llevan un comentario [REVISAR].

import { head, header, footer, cookieBanner } from './layout.mjs';
import { sprite } from '../../scripts/lib/html.mjs';
import { SITE } from '../data/content.mjs';

const TITULAR = `<p><strong>Denominación:</strong> AAS Marketing (nombre comercial)<br>
<strong>Titular / responsable:</strong> Aleksandar Metodiev Stefanov<br>
<strong>NIF:</strong> X4294288G<br>
<strong>Domicilio:</strong> Calle Las Rosas 1, Collado Villalba, Madrid<br>
<strong>Correo electrónico:</strong> <a href="mailto:${SITE.email}">${SITE.email}</a><br>
<strong>Teléfono:</strong> ${SITE.whatsappDisplay}<br>
<strong>Actividad:</strong> Diseño y desarrollo web, y servicios de marketing digital.</p>
<p>AAS Marketing es el nombre comercial bajo el que opera el titular indicado.</p>`;

const avisoLegal = () => `
<h1>Aviso legal</h1>
<h2>1. Identificación del titular</h2>
${TITULAR}
<h2>2. Objeto</h2>
<!-- [REVISAR] Adaptado: dominio de esta landing. -->
<p>El presente aviso legal regula el uso del sitio web vsl.aasmarketing.com (en adelante, «el sitio web»), del que es titular la persona identificada en el punto anterior. La navegación por el sitio web atribuye la condición de usuario e implica la aceptación plena de las presentes condiciones.</p>
<h2>3. Uso del sitio web</h2>
<p>El usuario se compromete a hacer un uso adecuado de los contenidos y servicios del sitio web y a no emplearlos para actividades ilícitas, contrarias a la buena fe o al orden público.</p>
<h2>4. Propiedad intelectual e industrial</h2>
<!-- [REVISAR] Adaptado: capturas de perfiles, vídeos y anuncios de clientes en lugar del portfolio web. -->
<p>Todos los contenidos del sitio web (diseño, textos, imágenes, logotipos, código fuente y demás elementos) son titularidad de AAS Marketing o de terceros que han autorizado su uso, y están protegidos por la normativa de propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o comunicación pública sin autorización expresa. Las capturas de perfiles, vídeos y anuncios de clientes pertenecen a sus respectivos titulares y se muestran con fines demostrativos del trabajo realizado.</p>
<h2>5. Responsabilidad</h2>
<p>El titular no se hace responsable del mal uso que se realice de los contenidos del sitio web ni de los daños derivados de fallos técnicos ajenos a su control. Los enlaces a sitios de terceros tienen finalidad meramente informativa; el titular no responde de sus contenidos.</p>
<h2>6. Legislación aplicable</h2>
<p>Estas condiciones se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales que correspondan conforme a derecho.</p>
<p class="updated">Última actualización: ${SITE.updated}.</p>`;

const privacidad = () => `
<h1>Política de privacidad</h1>
<h2>1. Responsable del tratamiento</h2>
${TITULAR}

<h2>2. Datos que se recogen</h2>
<!-- [REVISAR] Párrafo modificado: datos del formulario de esta landing. -->
<p>A través del formulario de esta página se recogen tu nombre, tu número de WhatsApp, el servicio que te interesa, el sector de tu negocio y el perfil de redes sociales o la web del negocio que indiques. No se recogen datos especialmente protegidos.</p>
<!-- [REVISAR] Párrafo nuevo: datos técnicos para medir los anuncios. -->
<p>Además, para medir los anuncios se tratan datos técnicos de la visita: dirección IP, navegador y dispositivo, la página visitada, el identificador del clic en el anuncio de Meta y los parámetros de la campaña (utm), como se explica en el punto 6.</p>

<h2>3. Finalidad</h2>
<!-- [REVISAR] Párrafo modificado: finalidad de la oferta de estrategia gratis. -->
<p>Los datos del formulario se usan para analizar el perfil público que indiques, preparar y enviarte por WhatsApp una estrategia gratuita y, si tú lo pides, una propuesta de servicios con su precio. No se envían comunicaciones comerciales sin tu consentimiento expreso.</p>
<!-- [REVISAR] Párrafo nuevo: medición de anuncios. -->
<p>Los datos técnicos de la visita se usan para medir la eficacia de los anuncios en Meta (Facebook e Instagram).</p>

<h2>4. Legitimación</h2>
<!-- [REVISAR] Párrafo modificado: ya no hay casilla; la base es la solicitud del interesado. -->
<p>La base jurídica para atender tu solicitud y enviarte la estrategia y, en su caso, la propuesta es la aplicación de medidas precontractuales a petición del interesado (art. 6.1.b RGPD). Por eso el formulario no tiene casilla de aceptación: al enviarlo se te informa de esta política.</p>
<!-- [REVISAR] Párrafo nuevo: base jurídica de la medición. Confirmar con un asesor: la AEPD suele exigir consentimiento para la medición publicitaria. -->
<p>La medición de los anuncios desde el servidor (API de conversiones de Meta) se basa en el interés legítimo del responsable en conocer la eficacia de su publicidad (art. 6.1.f RGPD), al que puedes oponerte en cualquier momento. Las cookies del píxel de Meta se basan en tu consentimiento (art. 6.1.a RGPD y art. 22.2 LSSI-CE), que puedes retirar cuando quieras desde «Configurar cookies».</p>

<h2>5. Destinatarios y encargados del tratamiento</h2>
<!-- [REVISAR] Párrafo nuevo: proveedores reales de esta landing. Ya no se usa FormSubmit. -->
<p>No se ceden datos a terceros salvo obligación legal. Para prestar el servicio se usan estos proveedores, que actúan como encargados del tratamiento conforme al art. 28 RGPD o como responsables en lo que les corresponde:</p>
<ul>
<li><strong>Vercel Inc.:</strong> alojamiento de la web y de las funciones que reciben el formulario y los eventos de medición.</li>
<li><strong>Google:</strong> Google Sheets y Apps Script para guardar la solicitud, y Gmail para avisar al responsable por correo.</li>
<li><strong>Meta Platforms Ireland Ltd.:</strong> medición de los anuncios con el píxel de Meta y la API de conversiones.</li>
<li><strong>WhatsApp (Meta):</strong> solo si abres la conversación desde la página; lo que escribas allí se trata según la política de WhatsApp.</li>
</ul>
<!-- [REVISAR] Párrafo nuevo: transferencias internacionales. -->
<p>Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo. En ese caso, las transferencias se amparan en el Marco de Privacidad de Datos UE-EE. UU. o en las cláusulas contractuales tipo de la Comisión Europea.</p>

<h2>6. Medición de los anuncios (píxel y API de conversiones de Meta)</h2>
<!-- [REVISAR] Párrafo nuevo: envío por servidor sin consentimiento (CAPI_WITHOUT_CONSENT=true). Si se pone a false en Vercel, este envío solo se hace con las cookies aceptadas y hay que actualizar este texto. -->
<p>Para saber qué anuncios funcionan, el servidor de esta página envía a Meta eventos de visita (PageView y ViewContent), de solicitud (Lead) y de contacto por WhatsApp (Contact) con tu dirección IP, el navegador, la página visitada y los identificadores de Meta del clic y del navegador (fbc y fbp). En el evento de solicitud se añaden tu teléfono, tu nombre y tu país transformados con SHA-256 en un código irreversible (hash), para que Meta pueda relacionar la solicitud con el anuncio. Este envío desde el servidor se hace aunque no aceptes las cookies.</p>
<!-- [REVISAR] Párrafo nuevo: cookies del píxel solo con consentimiento. -->
<p>Las cookies del píxel de Meta solo se instalan en tu dispositivo si las aceptas en el aviso de cookies. Tienes el detalle en la <a href="/cookies">política de cookies</a>.</p>

<h2>7. Conservación</h2>
<!-- [REVISAR] Conviene fijar un plazo concreto para las solicitudes que no acaban en contrato. -->
<p>Los datos se conservan el tiempo necesario para atender tu solicitud y, como máximo, durante los plazos legales aplicables.</p>

<h2>8. Derechos</h2>
<!-- [REVISAR] Párrafo modificado: añade la oposición a la medición y la retirada del consentimiento. -->
<p>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición (incluida la oposición a la medición de anuncios), limitación y portabilidad, y retirar tu consentimiento, escribiendo a <a href="mailto:${SITE.email}">${SITE.email}</a>. También puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener">aepd.es</a>).</p>

<h2>9. Seguridad</h2>
<!-- [REVISAR] Párrafo modificado: medidas de esta landing. -->
<p>Se aplican medidas técnicas y organizativas razonables para proteger tus datos, como la validación de los campos del formulario, las comunicaciones cifradas (HTTPS) y una clave compartida para que solo esta web pueda escribir en la hoja de solicitudes.</p>
<p class="updated">Última actualización: ${SITE.updated}.</p>`;

const cookies = (ctx) => `
<h1>Política de cookies</h1>
<h2>1. ¿Qué son las cookies?</h2>
<p>Las cookies son pequeños archivos que los sitios web almacenan en tu dispositivo para recordar información sobre tu visita.</p>
<!-- [REVISAR] Párrafo nuevo: almacenamiento local del navegador. -->
<p>Esta página también usa el almacenamiento del navegador (localStorage y sessionStorage), que funciona de forma parecida pero no se envía en cada visita.</p>

<h2>2. Cookies y almacenamiento necesarios</h2>
<!-- [REVISAR] Párrafo modificado: lista real de esta landing. -->
<p>Sirven para que la página y el formulario funcionen. No necesitan tu consentimiento y no se comparten con nadie:</p>
<div class="legal-table-wrap"><table class="legal-table">
<thead><tr><th>Nombre</th><th>Dónde</th><th>Para qué</th><th>Duración</th></tr></thead>
<tbody>
<tr><td data-label="Nombre">aas_consent</td><td data-label="Dónde">localStorage</td><td data-label="Para qué">Guarda tu decisión sobre las cookies.</td><td data-label="Duración">Hasta que la cambies</td></tr>
<tr><td data-label="Nombre">aas_form</td><td data-label="Dónde">sessionStorage</td><td data-label="Para qué">Guarda tus respuestas mientras rellenas el formulario para que no se pierdan si vuelves atrás.</td><td data-label="Duración">Hasta cerrar la pestaña</td></tr>
<tr><td data-label="Nombre">aas_done</td><td data-label="Dónde">sessionStorage</td><td data-label="Para qué">Recuerda que ya enviaste la solicitud para seguir mostrando la confirmación al volver de WhatsApp.</td><td data-label="Duración">Hasta cerrar la pestaña</td></tr>
<tr><td data-label="Nombre">aas_pending</td><td data-label="Dónde">localStorage</td><td data-label="Para qué">Guarda una solicitud si falla la conexión, para reenviarla después. Se borra al enviarse.</td><td data-label="Duración">Hasta que se envíe</td></tr>
</tbody>
</table></div>

<h2>3. Almacenamiento para medir los anuncios</h2>
<!-- [REVISAR] Párrafo nuevo: datos de campaña en sessionStorage que se usan en el envío por servidor aunque no se acepten las cookies. -->
<p>Al llegar desde un anuncio, la página guarda en sessionStorage (clave <strong>aas_attr</strong>) el identificador del clic de Meta, los identificadores fbc y fbp y los parámetros de campaña (utm). Se usan para la medición desde el servidor explicada en la <a href="/privacidad">política de privacidad</a> y se borran al cerrar la pestaña.</p>

<h2>4. Cookies de marketing (Meta Pixel)</h2>
<!-- [REVISAR] Párrafo nuevo: antes no había cookies de publicidad. -->
<p>Solo si pulsas «Aceptar» (o activas «Marketing» en «Configurar»), se carga el píxel de Meta, que instala estas cookies para medir los anuncios de Facebook e Instagram:</p>
<div class="legal-table-wrap"><table class="legal-table">
<thead><tr><th>Nombre</th><th>Proveedor</th><th>Para qué</th><th>Duración</th></tr></thead>
<tbody>
<tr><td data-label="Nombre">_fbp</td><td data-label="Proveedor">Meta</td><td data-label="Para qué">Identifica el navegador para medir los anuncios.</td><td data-label="Duración">90 días</td></tr>
<tr><td data-label="Nombre">_fbc</td><td data-label="Proveedor">Meta</td><td data-label="Para qué">Guarda el identificador del clic en el anuncio.</td><td data-label="Duración">90 días</td></tr>
<tr><td data-label="Nombre">Otras de Meta</td><td data-label="Proveedor">Meta</td><td data-label="Para qué">Meta puede usar sus propias cookies en sus dominios (por ejemplo, si tienes sesión iniciada en Facebook o Instagram).</td><td data-label="Duración">Según Meta</td></tr>
</tbody>
</table></div>
<p>Proveedor: Meta Platforms Ireland Ltd. Más información en su <a href="https://www.facebook.com/privacy/policies/cookies/" rel="noopener">política de cookies</a>.</p>
${ctx.analytics ? `
<h2>5. Analítica de Vercel</h2>
<!-- [REVISAR] Párrafo nuevo: solo aparece si VERCEL_ANALYTICS=true. -->
<p>Se usan Vercel Web Analytics y Speed Insights para medir de forma agregada las visitas y la velocidad de la página. No usan cookies ni guardan identificadores en tu navegador.</p>` : ''}

<h2>${ctx.analytics ? 6 : 5}. Cómo cambiar tu decisión</h2>
<!-- [REVISAR] Párrafo modificado: ahora hay enlace para cambiar la decisión. -->
<p>Puedes cambiar tu decisión cuando quieras con el enlace «Configurar cookies» del pie de página. También puedes borrar las cookies y el almacenamiento del sitio desde los ajustes de tu navegador; al volver se te preguntará de nuevo.</p>
<p class="updated">Última actualización: ${SITE.updated}.</p>`;

const PAGES = [
  { slug: 'aviso-legal', title: 'Aviso legal · AAS Marketing', description: 'Aviso legal de vsl.aasmarketing.com, la landing de AAS Marketing.', body: avisoLegal },
  { slug: 'privacidad', title: 'Política de privacidad · AAS Marketing', description: 'Cómo trata AAS Marketing los datos del formulario y de la medición de anuncios.', body: privacidad },
  { slug: 'cookies', title: 'Política de cookies · AAS Marketing', description: 'Cookies y almacenamiento que usa la landing de AAS Marketing.', body: cookies },
];

const shell = (ctx, meta, content) => `${head(ctx, meta)}
<body>
${sprite()}
${header({ legal: true })}
<main id="main" class="legal">
  <div class="wrap legal-in">
${content}
  </div>
</main>
${footer()}
${cookieBanner()}
</body>
</html>`;

export function legalPages(ctx) {
  return PAGES.map((p) => ({
    file: `${p.slug}.html`,
    html: shell(ctx, { title: p.title, description: p.description, path: `/${p.slug}` }, p.body(ctx)),
  }));
}

export function notFound(ctx) {
  return shell(ctx, { title: 'Página no encontrada · AAS Marketing', description: 'Esta página no existe.', path: '/404' }, `
<h1>No encuentro esta página.</h1>
<p>Puede que el enlace esté mal escrito o que la página ya no exista.</p>
<p><a href="/">Volver al inicio</a></p>`);
}
