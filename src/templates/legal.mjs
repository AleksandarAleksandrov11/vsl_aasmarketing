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

// «A, B y C»
const list = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`);

const privacidad = (ctx) => {
  let n = 0;
  const h2 = (text) => `<h2>${++n}. ${text}</h2>`;
  const meta = !!ctx.pixelId; // sin píxel no se manda nada a Meta, ni por servidor
  const server = meta && ctx.capiWithoutConsent;
  const mail = `<a href="mailto:${SITE.email}">${SITE.email}</a>`;
  const consentFor = meta && ctx.analytics ? 'Las cookies del píxel de Meta y la analítica de Vercel se basan'
    : meta ? 'Las cookies del píxel de Meta se basan' : 'La analítica de Vercel se basa';
  return `
<h1>Política de privacidad</h1>
<!-- [REVISAR] Párrafo nuevo: alcance de esta política. -->
<p>Esta política explica qué datos se tratan en vsl.aasmarketing.com, para qué y con qué base, y cómo puedes ejercer tus derechos.</p>
${h2('Responsable del tratamiento')}
${TITULAR}

${h2('Datos que se recogen')}
<!-- [REVISAR] Párrafo modificado: datos del formulario de esta landing. -->
<p>A través del formulario de esta página se recogen tu nombre, tu número de WhatsApp, el servicio que te interesa, el sector de tu negocio y el perfil de redes sociales o la web del negocio que indiques. Con la solicitud se guardan también la fecha, la página desde la que la envías y, si llegas desde un anuncio, los parámetros de la campaña (utm). No se recogen datos especialmente protegidos.</p>
<!-- [REVISAR] Párrafo nuevo: si dar los datos es obligatorio (art. 13.2.e RGPD). -->
<p>Los cinco datos del formulario son necesarios para preparar y enviarte la estrategia. No estás obligado a darlos, pero sin ellos no se puede atender tu solicitud.</p>
${meta ? `<!-- [REVISAR] Párrafo nuevo: datos técnicos para medir los anuncios. -->
<p>Para medir los anuncios se tratan además datos técnicos de la visita: la dirección IP, el navegador y el dispositivo, la página visitada y los identificadores de Meta del clic en el anuncio y del navegador (fbc y fbp), como se explica en el punto 6.</p>` : ''}
${ctx.analytics ? `<!-- [REVISAR] Párrafo nuevo: analítica de Vercel con consentimiento. Datos según la documentación de Vercel (Web Analytics, junio de 2026; Speed Insights, marzo de 2026). -->
<p>Si aceptas la analítica, Vercel Web Analytics y Speed Insights registran, para estadísticas agregadas, la fecha y la hora, la página visitada con sus parámetros de campaña (utm), la página de procedencia, tu ubicación aproximada (país, región y ciudad), el tipo de dispositivo, el sistema operativo y el navegador con sus versiones, la velocidad de la conexión y las métricas de velocidad de carga. No usan cookies ni guardan nada en tu navegador: para distinguir las visitas, Vercel calcula un código a partir de la petición que se descarta a las 24 horas. Antes de enviar la dirección de la página se quitan los identificadores de clic de los anuncios.</p>` : ''}

${h2('Finalidad')}
<!-- [REVISAR] Párrafo modificado: finalidad de la oferta de estrategia gratis. -->
<p>Los datos del formulario se usan para analizar el perfil público que indiques y enviarte por WhatsApp la estrategia gratuita que pides, con el precio de los servicios por si quieres que la ejecute AAS Marketing. Los parámetros de campaña sirven para saber qué anuncio trajo la solicitud. No se envían comunicaciones comerciales sin tu consentimiento expreso.</p>
${meta ? `<!-- [REVISAR] Párrafo nuevo: medición de anuncios. -->
<p>Los datos técnicos de la visita y, si envías el formulario, tu teléfono, tu nombre y tu país convertidos en un código (punto 6) se usan para medir la eficacia de los anuncios en Meta (Facebook e Instagram).</p>` : ''}
${ctx.analytics ? `<!-- [REVISAR] Párrafo nuevo: finalidad de la analítica. -->
<p>Con tu consentimiento, la analítica sirve para saber cuántas visitas recibe la página y lo rápido que carga, y así mejorarla.</p>` : ''}

${h2('Legitimación')}
<!-- [REVISAR] Párrafo modificado: ya no hay casilla; la base es la solicitud del interesado. -->
<p>La base jurídica para atender tu solicitud y enviarte la estrategia y el precio es la aplicación de medidas precontractuales a petición del interesado (art. 6.1.b RGPD). Por eso el formulario no tiene casilla de aceptación: al enviarlo se te informa de esta política.</p>
${server ? `<!-- [REVISAR] Párrafo nuevo: medición por servidor sin consentimiento (CAPI_WITHOUT_CONSENT=true). Confirmar con un asesor: la AEPD suele exigir consentimiento para la medición publicitaria. Con CAPI_WITHOUT_CONSENT=false en Vercel y un nuevo despliegue, este párrafo cambia solo. -->
<p>La medición de los anuncios desde el servidor (API de conversiones de Meta) se basa en el interés legítimo del responsable en conocer la eficacia de su publicidad (art. 6.1.f RGPD) y se hace aunque no aceptes las cookies. Puedes oponerte en cualquier momento en «Configurar cookies», al pie de la página: desactiva «Medición desde el servidor» y pulsa «Guardar selección», o pulsa «Rechazar todo». Desde ese momento el servidor deja de enviar a Meta los datos de ese navegador.</p>` : meta ? `<!-- [REVISAR] Párrafo nuevo: con CAPI_WITHOUT_CONSENT=false la medición desde el servidor solo se hace con consentimiento. -->
<p>La medición de los anuncios desde el servidor (API de conversiones de Meta) solo se hace si aceptas las cookies de marketing y se basa en tu consentimiento (art. 6.1.a RGPD).</p>` : ''}
<!-- [REVISAR] Párrafo nuevo: base jurídica de los parámetros de campaña que se guardan con la solicitud. -->
<p>Guardar con tu solicitud los parámetros de campaña (utm), para saber qué anuncio la trajo, se basa en el interés legítimo del responsable en conocer de dónde vienen sus solicitudes (art. 6.1.f RGPD), al que también puedes oponerte.</p>
${meta || ctx.analytics ? `<!-- [REVISAR] Párrafo modificado: consentimiento para las cookies y la analítica, y su retirada. -->
<p>${consentFor} en tu consentimiento (art. 6.1.a RGPD${meta ? ' y art. 22.2 LSSI-CE' : ''}). Puedes retirarlo cuando quieras desde «Configurar cookies», al pie de la página, sin que eso afecte a la licitud del tratamiento anterior.</p>` : ''}

${h2('Destinatarios y encargados del tratamiento')}
<!-- [REVISAR] Párrafo modificado: proveedores reales de esta landing. Ya no se usa FormSubmit. -->
<p>Fuera de lo que se indica aquí, no se comunican tus datos a terceros salvo obligación legal. Para prestar el servicio se usan estos proveedores, que actúan como encargados del tratamiento con su contrato de tratamiento de datos (art. 28 RGPD), salvo ${meta ? 'Meta y WhatsApp, cuyo papel se explica en su apartado' : 'WhatsApp, cuyo papel se explica en su apartado'}:</p>
<ul>
<li><strong>Vercel Inc.:</strong> alojamiento de la web y de las funciones que reciben el formulario${meta ? ' y los eventos de medición' : ''}.${ctx.analytics ? ' Si la aceptas, también la analítica de visitas y velocidad (Vercel Web Analytics y Speed Insights).' : ''}</li>
<!-- [REVISAR] Con una cuenta gratuita de Gmail no hay contrato de encargado del tratamiento: el anexo de tratamiento de datos es de Google Workspace. Recomendado: Google Workspace con su anexo, o confirmarlo con el asesor. -->
<li><strong>Google Ireland Limited:</strong> Google Sheets y Apps Script para guardar la solicitud, y Gmail para avisar al responsable por correo.</li>${meta ? `
<!-- [REVISAR] Párrafo nuevo: corresponsabilidad con Meta (art. 26 RGPD y condiciones de las herramientas para empresas de Meta). -->
<li><strong>Meta Platforms Ireland Ltd.:</strong> medición de los anuncios con el píxel y la API de conversiones. En la recogida y el envío de esos datos, Meta y el responsable son corresponsables del tratamiento (art. 26 RGPD): el responsable te informa y atiende tus derechos, que también puedes ejercer ante Meta. Después, Meta los trata como responsable según su <a href="https://www.facebook.com/privacy/policy/" rel="noopener">política de privacidad</a>.</li>` : ''}
<!-- [REVISAR] Párrafo modificado: la página abre WhatsApp sola con las respuestas ya escritas. -->
<li><strong>WhatsApp Ireland Limited:</strong> al enviar el formulario, la página abre WhatsApp con un mensaje ya escrito con tus respuestas (nombre, servicio, negocio y perfil). Esos datos llegan a WhatsApp al abrirse el enlace, aunque no envíes el mensaje, y WhatsApp los trata como responsable según su política de privacidad.</li>${ctx.leadsDb ? `
<!-- [REVISAR] Párrafo nuevo: solo aparece si LEADS_DB_ENABLED=true. -->
<li><strong>Upstash Inc.:</strong> copia de seguridad de las solicitudes en una base de datos.</li>` : ''}
</ul>
<!-- [REVISAR] Párrafo nuevo: transferencias internacionales (art. 13.1.f RGPD). Comprobar la adhesión de cada empresa en dataprivacyframework.gov. -->
<p>${list(['Vercel', 'Google', meta && 'Meta', 'WhatsApp', ctx.leadsDb && 'Upstash'].filter(Boolean))} pueden tratar datos en Estados Unidos. Esas transferencias se basan en la decisión de adecuación de la Comisión Europea para el Marco de Privacidad de Datos UE-EE. UU., en el caso de las empresas adheridas, y, si alguna no lo está, en las cláusulas contractuales tipo de la Comisión Europea incluidas en su contrato. Puedes pedir una copia de esas garantías escribiendo a ${mail}.</p>
${meta ? `
${h2('Medición de los anuncios (píxel y API de conversiones de Meta)')}
<!-- [REVISAR] Párrafo nuevo: qué se envía a Meta y cuándo. -->
<p>Para saber qué anuncios funcionan, el servidor de esta página envía a Meta eventos de visita (PageView y ViewContent), de solicitud (Lead) y de contacto por WhatsApp (Contact) con tu dirección IP, el navegador, la página visitada y los identificadores de Meta del clic y del navegador (fbc y fbp). En el evento de solicitud se añaden tu teléfono, tu nombre y tu país convertidos con SHA-256 en un código (hash). Ese código no es anónimo: Meta lo compara con los datos de sus usuarios para relacionar la solicitud con el anuncio, así que sigue siendo un dato personal.</p>
${server ? `<!-- [REVISAR] Párrafo nuevo: envío por servidor sin consentimiento y cómo oponerse (CAPI_WITHOUT_CONSENT=true). -->
<p>Este envío desde el servidor se hace aunque no aceptes las cookies, salvo que te opongas: en «Configurar cookies», desactiva «Medición desde el servidor» y pulsa «Guardar selección», o pulsa «Rechazar todo». Desde ese momento el servidor deja de enviar a Meta los datos de ese navegador, también los de una solicitud que estuviera pendiente de reenviarse. La oposición se guarda en tu navegador sin fecha de caducidad (clave aas_optout): si borras sus datos, usas otro navegador o el tuyo no permite guardarla, tendrás que repetirla.</p>` : `<!-- [REVISAR] Párrafo nuevo: con CAPI_WITHOUT_CONSENT=false, solo con consentimiento. -->
<p>Este envío desde el servidor solo se hace si aceptas las cookies de marketing en el aviso de cookies.</p>`}
<!-- [REVISAR] Párrafo nuevo: cookies del píxel solo con consentimiento. -->
<p>Las cookies del píxel de Meta solo se instalan en tu dispositivo si las aceptas en el aviso de cookies. Tienes el detalle en la <a href="/cookies">política de cookies</a>.</p>` : ''}

${h2('Conservación')}
<!-- [REVISAR] Plazos propuestos: confirmarlos con el asesor y cumplirlos (borrar a mano las filas y los correos de las solicitudes antiguas). -->
<p>Si la solicitud no acaba en contrato, se borra de la hoja de solicitudes, del correo y de la conversación de WhatsApp como máximo 12 meses después del último contacto${ctx.leadsDb ? ', igual que su copia en la base de datos' : ''}. Si contratas, los datos se conservan mientras dure la relación y, después, durante los plazos de prescripción de las obligaciones legales, fiscales y mercantiles (por ejemplo, 4 años según la Ley General Tributaria y 6 según el Código de Comercio).</p>
<!-- [REVISAR] Párrafo modificado: copia en los registros técnicos y su plazo. -->
<p>Si una solicitud no se puede guardar en la hoja de solicitudes, o el sistema la marca como posible envío automático o sin un teléfono válido, queda en los registros técnicos del alojamiento (Vercel) solo para poder revisarla o recuperarla. Esos registros se borran solos en el plazo que fija Vercel según el plan contratado (como máximo, 30 días).</p>
${meta || ctx.analytics ? `<!-- [REVISAR] Párrafo nuevo: conservación en Meta y en Vercel Analytics. -->
<p>${[meta && 'Lo que recibe Meta se conserva según su política de privacidad.', ctx.analytics && 'Los datos de la analítica se guardan en Vercel sin nada que te identifique y según su política de privacidad: Web Analytics garantiza conservarlos durante el periodo de informes del plan (de 1 a 24 meses) y puede guardarlos más tiempo, y Speed Insights no publica un plazo.'].filter(Boolean).join(' ')}</p>` : ''}

${h2('Derechos')}
<!-- [REVISAR] Párrafo modificado: añade cómo oponerse a la medición, la retirada del consentimiento y las decisiones automatizadas. -->
<p>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad escribiendo a ${mail} e indicando qué derecho quieres ejercer.${server ? ' Para oponerte a la medición de los anuncios desde este navegador, desactiva «Medición desde el servidor» en «Configurar cookies» y pulsa «Guardar selección».' : ''}${meta || ctx.analytics ? ' Puedes retirar tu consentimiento cuando quieras desde «Configurar cookies», sin que eso afecte a la licitud del tratamiento anterior.' : ''} No se toman decisiones automatizadas que te afecten de forma significativa.</p>
<p>Si crees que no se han respetado tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener">aepd.es</a>).</p>

${h2('Seguridad')}
<!-- [REVISAR] Párrafo modificado: medidas de esta landing. -->
<p>Se aplican medidas técnicas y organizativas razonables para proteger tus datos, como la validación de los campos del formulario, las comunicaciones cifradas (HTTPS) y una clave compartida para que solo esta web pueda escribir en la hoja de solicitudes.</p>
<p class="updated">Última actualización: ${SITE.updated}.</p>`;
};

const row = (cells, heads) => `<tr>${cells.map((c, i) => `<td data-label="${heads[i]}">${c}</td>`).join('')}</tr>`;
const table = (heads, rows) => `<div class="legal-table-wrap"><table class="legal-table">
<thead><tr>${heads.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>
${rows.map((r) => row(r, heads)).join('\n')}
</tbody>
</table></div>`;

const cookies = (ctx) => {
  let n = 0;
  const h2 = (text) => `<h2>${++n}. ${text}</h2>`;
  const meta = !!ctx.pixelId;
  const server = meta && ctx.capiWithoutConsent;
  const banner = meta || ctx.analytics;
  const decision = [ctx.analytics && 'la analítica', meta && 'las cookies de marketing'].filter(Boolean);
  return `
<h1>Política de cookies</h1>
${h2('¿Qué son las cookies?')}
<p>Las cookies son pequeños archivos que los sitios web almacenan en tu dispositivo para recordar información sobre tu visita.</p>
<!-- [REVISAR] Párrafo nuevo: almacenamiento local del navegador. -->
<p>Esta página también usa el almacenamiento del navegador (localStorage y sessionStorage), que funciona de forma parecida pero no se envía en cada visita.</p>

${h2('Cookies y almacenamiento necesarios')}
<!-- [REVISAR] Párrafo modificado: lista real de esta landing. -->
<p>Sirven para que la página y el formulario funcionen. No necesitan tu consentimiento y no se comparten con nadie:</p>
${table(['Nombre', 'Dónde', 'Para qué', 'Duración'], [
    banner && ['aas_consent', 'localStorage', `Guarda tu decisión sobre ${list(decision)}.`, '24 meses, o hasta que la cambies'],
    server && ['aas_optout', 'localStorage', 'Recuerda que te has opuesto a la medición desde el servidor, para no volver a enviar a Meta datos de este navegador. Solo existe si te opones.', 'Sin caducidad, hasta que vuelvas a activarla'],
    ['aas_form', 'sessionStorage', 'Guarda tus respuestas mientras rellenas el formulario para que no se pierdan si vuelves atrás.', 'Hasta cerrar la pestaña'],
    ['aas_done', 'sessionStorage', 'Recuerda que ya enviaste la solicitud para seguir mostrando la confirmación al volver de WhatsApp.', 'Hasta cerrar la pestaña'],
    ['aas_pending', 'localStorage', `Guarda tu solicitud justo antes de enviarla, para reenviarla si falla la conexión${meta ? ' (sin parámetros de campaña ni identificadores de Meta si no has aceptado el marketing)' : ''}. Se borra en cuanto el servidor la recibe.`, 'Hasta que se envíe; si no llega, se descarta al abrir la página pasados 7 días'],
  ].filter(Boolean))}
${ctx.analytics ? `
${h2('Analítica (Vercel Web Analytics y Speed Insights)')}
<!-- [REVISAR] Párrafo nuevo: analítica solo con consentimiento. -->
<p>Solo si pulsas «Aceptar» (o activas «Analítica» en «Configurar») se cargan Vercel Web Analytics y Speed Insights, servidos desde este mismo dominio, para medir de forma agregada las visitas y la velocidad de la página. No instalan cookies ni guardan nada en tu navegador: Vercel distingue las visitas con un código calculado a partir de la petición que se descarta a las 24 horas. Antes de enviar la dirección de la página se quitan los identificadores de clic de los anuncios. Qué datos registran está en la <a href="/privacidad">política de privacidad</a>.</p>
<p>Proveedor: Vercel Inc. Más información en su <a href="https://vercel.com/docs/analytics/privacy-policy" rel="noopener">información de privacidad de Web Analytics</a> y de <a href="https://vercel.com/docs/speed-insights/privacy-policy" rel="noopener">Speed Insights</a>.</p>` : ''}
${meta ? `
${h2('Cookies de marketing (Meta Pixel)')}
<!-- [REVISAR] Párrafo nuevo: antes no había cookies de publicidad. -->
<p>Solo si pulsas «Aceptar» (o activas «Marketing» en «Configurar»), se carga el píxel de Meta, que instala estas cookies para medir los anuncios de Facebook e Instagram:</p>
${table(['Nombre', 'Proveedor', 'Para qué', 'Duración'], [
    ['_fbp', 'Meta', 'Identifica el navegador para medir los anuncios.', '90 días'],
    ['_fbc', 'Meta', 'Guarda el identificador del clic en el anuncio.', '90 días'],
    ['Otras de Meta', 'Meta', 'Meta puede usar sus propias cookies en sus dominios (por ejemplo, si tienes sesión iniciada en Facebook o Instagram).', 'Según Meta'],
  ])}
<!-- [REVISAR] Párrafo nuevo: datos de campaña en sessionStorage, solo con consentimiento de marketing. -->
<p>Con ese mismo consentimiento, la página guarda en sessionStorage (clave <strong>aas_attr</strong>) el identificador del clic de Meta, los identificadores fbc y fbp (si aún no existe la cookie _fbp, genera uno), los parámetros de campaña (utm) y la hora de llegada, para que el píxel y el servidor usen los mismos valores durante la visita. Se borran al cerrar la pestaña o al retirar el consentimiento. Sin consentimiento, esos datos solo se usan mientras la página está abierta y no se guardan en tu navegador.</p>
<p>Proveedor: Meta Platforms Ireland Ltd. Más información en su <a href="https://www.facebook.com/privacy/policies/cookies/" rel="noopener">política de cookies</a>.</p>` : ''}
${server ? `
${h2('Medición desde el servidor (sin cookies)')}
<!-- [REVISAR] Párrafo nuevo: envío por servidor aunque no se acepten las cookies (CAPI_WITHOUT_CONSENT=true). -->
<p>Aunque no aceptes las cookies, el servidor de esta página envía a Meta datos de tu visita para medir los anuncios, sin instalar cookies en tu dispositivo. Puedes oponerte en «Configurar cookies»: desactiva «Medición desde el servidor» y pulsa «Guardar selección», o pulsa «Rechazar todo». Desde ese momento el servidor deja de enviar a Meta los datos de ese navegador. Tienes el detalle en el punto 6 de la <a href="/privacidad">política de privacidad</a>.</p>` : ''}

${h2('Cómo cambiar tu decisión')}
${banner ? `<!-- [REVISAR] Párrafo modificado: enlace para cambiar la decisión, efectos y caducidad. -->
<p>Puedes cambiar tu decisión cuando quieras con el botón «Configurar cookies» del pie de página. ${[
    meta && 'Si retiras el consentimiento de marketing, se borran las cookies _fbp y _fbc y el píxel deja de medir.',
    ctx.analytics && `Si retiras el ${meta ? '' : 'consentimiento '}de analítica, Vercel deja de recibir datos en ese mismo momento.`,
  ].filter(Boolean).join(' ')} Tu decisión se guarda 24 meses; después se te vuelve a preguntar. También puedes borrar las cookies y el almacenamiento del sitio desde los ajustes de tu navegador; al volver se te preguntará de nuevo.</p>` : `<!-- [REVISAR] Párrafo nuevo: sin cookies opcionales, no hay nada que configurar. -->
<p>Esta página no usa cookies ni almacenamiento opcionales, así que no hay nada que configurar. Puedes borrar el almacenamiento del sitio desde los ajustes de tu navegador.</p>`}
<p class="updated">Última actualización: ${SITE.updated}.</p>`;
};

const PAGES = [
  { slug: 'aviso-legal', title: 'Aviso legal · AAS Marketing', description: 'Aviso legal de vsl.aasmarketing.com, la landing de AAS Marketing.', body: avisoLegal },
  { slug: 'privacidad', title: 'Política de privacidad · AAS Marketing', description: 'Cómo trata AAS Marketing los datos del formulario y de la medición de anuncios.', body: privacidad },
  { slug: 'cookies', title: 'Política de cookies · AAS Marketing', description: 'Cookies y almacenamiento que usa la landing de AAS Marketing.', body: cookies },
];

const shell = (ctx, meta, content) => `${head(ctx, meta)}
<body>
${sprite()}
${cookieBanner(ctx)}
${header({ legal: true })}
<main id="main" class="legal">
  <div class="wrap legal-in">
${content}
  </div>
</main>
${footer(ctx, { legal: true })}
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
