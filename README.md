# Landing de AAS Marketing · Tu estrategia gratis

Landing de venta para los anuncios de Meta (campaña "Cerrar") en
**https://vsl.aasmarketing.com**. Un solo objetivo: que el visitante deje su
perfil en un formulario de 5 preguntas para recibir **su estrategia gratis por
WhatsApp en menos de 24 horas**. Cada solicitud se guarda en Google Sheets, llega
por correo, abre WhatsApp con las respuestas y se mide con el píxel de Meta y la
API de conversiones.

## Stack y por qué

- **HTML estático generado con un script de build pequeño en Node** (plantillas
  en JS, esbuild y sharp). No hay framework: el navegador solo recibe HTML
  pregenerado, el CSS crítico en línea y unos 9 KB de JS propio (comprimido).
- Imágenes en AVIF y WebP con `srcset` y medidas fijas generadas en el build, y
  funciones de Vercel en `/api` (Node 24) para el formulario y la API de conversiones.
- Pediste Node 20, pero Vercel lo retiró el 1 de octubre de 2026. Las funciones
  usan Node 24, fijado con `engines` en `package.json` (Vercel pone 26.x por
  defecto en los proyectos nuevos y sigue admitiendo 24.x); el código también
  funciona en 22.

## Estructura

```
api/lead.js          POST /api/lead: formulario → Meta (Lead) + Google Sheets (+ BD opcional)
api/event.js         POST /api/event: PageView, ViewContent y Contact → API de conversiones
lib/                 Código de servidor (Meta, Sheet, BD opcional, validación)
shared/              Código común navegador/servidor (teléfono, perfil, opciones)
src/data/content.mjs Textos de la landing con TODAS las cifras y plazos (también los de los alt), testimonios y FAQ
src/templates/       Plantillas de la landing (titulares sin cifras y preguntas del formulario), legales y 404
src/css/             critical.css (va en línea) y main.css (se carga sin bloquear)
src/js/              Formulario, medición, cookies, CTA fijo, carruseles y cifras en bucle
assets/              Imágenes, fuente y favicons (originales; el build los optimiza y recorta)
apps-script/         Code.gs y README para el Sheet y el correo
docs/meta.md         Píxel, API de conversiones y portfolio de Meta desde cero
scripts/             build.mjs, serve.mjs (servidor local tipo Vercel) y og.mjs
tests/               Pruebas unitarias, de contenido y de extremo a extremo (Playwright)
```

## Trabajar en local

```bash
npm install
```

```bash
npm run dev
```

Abre http://localhost:3000. Para probar el formulario contra un Sheet, copia
`.env.example` a `.env.local` y rellena `SHEET_WEBHOOK_URL` y `SHEET_SECRET`
(usa siempre el nombre **PRUEBA** en la hoja real).

- **Cambiar textos:** `src/data/content.mjs` (todas las cifras y plazos, también
  los de los textos alternativos de las capturas y de la pantalla de éxito,
  testimonios y preguntas frecuentes). Los titulares de sección sin cifras y las
  preguntas del formulario están en `src/templates/landing.mjs`, las opciones
  que se eligen en el formulario en `shared/options.js` y los textos legales en
  `src/templates/legal.mjs`. Después, `npm run build` o un push para desplegar.
- **Poner tu foto en "Soy Aleks":** guarda la foto como
  `assets/img/aleks/foto.jpg` (también vale .png, .webp o .avif) y despliega. El
  build la optimiza y sustituye al logo (vertical 4:5, mejor de 1000 px de ancho
  o más). Si la borras, vuelve el logo. La actual salió de un selfie de 400 px:
  se amplió a 1600 px con superresolución EDSR (OpenCV, en local, sin servicios
  externos), mezclada con una ampliación normal para que la piel no quede
  plástica, y con un enfoque y un contraste muy suaves. Si tienes una foto
  original más grande, sustitúyela y quedará mejor.
- **Capturas de reels:** todas se recortan en el build a 4:5 con el mismo
  encuadre (`crop` en `src/data/content.mjs`, en píxeles del original). Fuera
  queda la franja de abajo con el contador de Instagram o TikTok; la página pone
  el contador igual en todas. Para añadir una, copia otra entrada y ajusta `crop`.
- **Imagen para compartir (og.jpg):** `assets/img/og.jpg`. Se generó con
  `node scripts/og.mjs` con el mismo estilo de la web (la de aasmarketing.com
  hablaba de webs y demo gratuita).

## Secciones de la landing

Pensada para el móvil: 9,7 pantallas a 390x844 y el formulario empieza a los
800 px (antes de la primera pantalla y media). Títulos centrados, en mayúsculas,
sin punto final y con una sola tipografía.

1. **Hero:** "Más clientes desde tus redes sociales" en tres líneas fijas, una
   frase, el botón, la nota y la línea de confianza. Debajo, los tres reels con más visitas (946 mil, +406 mil
   y 306,9 mil). Sin altura mínima: las cifras empiezan justo después.
2. **Cifras:** banda negra en bucle infinito hacia la izquierda con diez cifras
   confirmadas, cada una centrada. Siempre en movimiento, sin botón de pausa;
   solo se queda quieta si el móvil tiene activado "reducir movimiento"
   (entonces se desliza con el dedo).
3. **Formulario** (`#formulario`): mismas preguntas, opciones, orden y textos.
   Al enviar no espera al servidor: la solicitud sale en segundo plano (y se
   guarda en el navegador para reenviarla si no llega), la pantalla de éxito
   sale al momento y WhatsApp se abre a los 0,15 s con el mensaje escrito.
4. **Casos reales:** VDN Performance y Exoneris en dos tarjetas iguales
   (cliente, titular, cifras y capturas de perfil o estadísticas).
5. **Más de 10 millones de visitas generadas:** las once capturas de reels, de
   más a menos visitas, todas con el mismo recorte y contador.
6. **¿Te suena? + Así trabajo:** los tres problemas en rojo y cinco pasos
   (estudio tu sector, escribo tus guiones, voy a grabar a tu negocio, edito y
   publico y, a todo el ancho, optimización mensual).
7. **Cuentas y opiniones:** "5,0 en Google" (sin estrellas ni enlace), los
   perfiles de clientes en bucle hacia la izquierda (empezando por los de más
   seguidores) y las opiniones hacia la derecha (empezando por la primera).
   Están quietos hasta que se ve la sección; se pueden arrastrar con el dedo o
   con el ratón y vuelven a moverse solos 5 s después. Con el ratón encima se
   paran. Todas las opiniones miden lo mismo: las largas se cortan con "Leer
   más", que abre la opinión entera en una ventana. Fuera las opiniones de
   "Aleks Nikolaev Antonov" y "Adriana Aleksandrova" (podían parecer tuyas).
8. **Soy Aleks** (con tu foto), **preguntas frecuentes** y **cierre**.
9. **Pie oscuro:** marca, servicios, contacto, legal y "Configurar cookies".

Todos los botones bajan a `#formulario` (también el CTA fijo del móvil). Lo que
se quitó en el rediseño de octubre de 2026 (está en el historial de git):
"Vídeos que se ven hasta el final" (y sus cuatro vídeos), "Lo de siempre vs
AAS", "Qué hacemos", "Voy a grabar a tu negocio" con el mapa, "Así de fácil",
los anuncios y las cuadrículas de vídeos de VDN, el móvil del caso Exoneris y
la captura de su perfil (su foto queda en la tarjeta y sus cifras, en el
titular y en los textos alternativos). Después, en "Así trabajo" se quitaron
"Lanzo tus anuncios" y "Te lo explico cada mes", el botón de pausa de las
cifras, las flechas de cuentas y opiniones y el enlace a las reseñas de Google.

## Desplegar en Vercel (paso a paso)

1. **Crear el proyecto en un equipo con plan Pro.** Es una web comercial
   (anuncia tus servicios) y el plan Hobby de Vercel solo admite uso personal no
   comercial ([Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines));
   con anuncios activos, Vercel podría pausar el proyecto. En Pro, además, los
   registros duran 1 día en lugar de 1 hora y el Instant Rollback puede volver a
   cualquier despliegue anterior. En [vercel.com/new](https://vercel.com/new)
   importa el repositorio `vsl_aasmarketing`. Framework Preset: **Other**. No
   toques los comandos: `vercel.json` ya indica `npm run build` y la carpeta
   `dist`. Pulsa Deploy. Ese primer despliegue ya es de **producción** y tendrá
   una URL `<proyecto>.vercel.app` que usa las variables de Production: cuando
   las pongas, esa URL mide y guarda filas igual que vsl.aasmarketing.com.
2. **Variables de entorno** (Settings > Environment Variables). Ver `.env.example`:
   - `SHEET_WEBHOOK_URL` y `SHEET_SECRET` (después de desplegar el Apps Script, paso 4).
   - `CAPI_WITHOUT_CONSENT` = `true`.
   - `META_CAPI_TOKEN` cuando lo tengas ([docs/meta.md](docs/meta.md)). El ID del
     píxel (`1600434437839020`) ya está en el código y solo se usa en Production;
     `META_PIXEL_ID` solo hace falta para cambiarlo (o `off` para quitarlo).
   - `META_TEST_EVENT_CODE` solo mientras pruebas eventos; en producción, vacío.
   - Elige el tipo al crearlas: **Secret** (no se puede volver a leer) para
     `META_CAPI_TOKEN`, `SHEET_SECRET` y `UPSTASH_REDIS_REST_TOKEN`; **Config**
     para el resto.
   - Entorno: **Production**. En **Preview** (los despliegues de ramas que no
     son `main`) no pongas las de Meta ni las del Sheet real: la landing funciona
     igual sin ellas y así esas pruebas no mandan eventos a tu píxel ni filas a
     tu hoja. Si quieres probar el formulario en preview, usa una hoja de pruebas
     con su propio Apps Script. Las URL de producción (`<proyecto>.vercel.app` y
     vsl.aasmarketing.com) miden siempre: prueba allí solo con el nombre PRUEBA.
   - **Después de guardar variables, Redeploy** (Deployments > ⋯ > Redeploy).
3. **Dominio vsl.aasmarketing.com.** Settings > Domains > Add Domain >
   `vsl.aasmarketing.com`.
   - Si aasmarketing.com usa los servidores de nombres de Vercel (DNS en Vercel,
     en la misma cuenta), Vercel crea el registro solo. Comprueba en tu equipo de
     Vercel > Domains > aasmarketing.com > DNS Records que aparece `vsl`.
   - Si el DNS está en tu registrador, crea allí un registro **CNAME**: nombre
     `vsl`, valor el que te muestre Vercel en esa pantalla (es único por proyecto,
     del tipo `xxxxxxxx.vercel-dns-017.com`). Si Vercel pide verificar con un TXT
     en `_vercel`, añádelo también.
   - Espera a que Vercel marque el dominio como "Valid Configuration" (el
     certificado HTTPS es automático).
4. **Google Sheets y correo:** sigue [apps-script/README.md](apps-script/README.md)
   y pon la URL `/exec` y la clave en Vercel. Redeploy.
5. **Meta:** sigue [docs/meta.md](docs/meta.md) (portfolio, cuenta publicitaria,
   píxel desde el portfolio, verificación del dominio con TXT, token, Redeploy y
   "Probar eventos").
6. **Vercel Analytics:** en el proyecto, pestaña **Analytics** > **Enable** y
   después Redeploy (sin esto, el script de Web Analytics da error 404). Speed
   Insights gratis no hay que activarlo: los despliegues ya incluyen su ruta. En
   la pestaña Speed Insights no pulses Enable salvo que quieras Plus, que es de
   pago. La landing los trae conectados al aviso de cookies: solo se cargan si el
   visitante acepta la analítica (categoría propia en "Configurar") y dejan de
   enviar datos en cuanto la retira. Si no los quieres, pon
   `VERCEL_ANALYTICS=false`. Lo que da cada plan
   ([precios de Speed Insights](https://vercel.com/docs/speed-insights/limits-and-pricing)
   y [de Web Analytics](https://vercel.com/docs/analytics/limits-and-pricing)):
   - **Speed Insights gratis:** solo la puntuación de experiencia real (RES), no
     el LCP, CLS e INP por separado (eso es Speed Insights Plus, solo en Pro: 10 $
     al mes por proyecto más 0,65 $ por cada 10.000 eventos, sin eventos
     incluidos). Admite 10.000 eventos en 30 días para todo el equipo; si se
     superan, Vercel pausa la recogida al menos 14 días (la web sigue igual).
     Cada visita que acepta suele generar entre 3 y 6 eventos.
   - **Web Analytics:** en Hobby, 50.000 eventos al mes y después se pausa; en
     Pro se paga por evento (0,03 $ cada 1.000, con el crédito mensual del plan).
     El desglose por `utm` es de Web Analytics Plus (10 $ al mes por equipo).
7. **Opcional (decide tú):** copia de cada solicitud en una base de datos propia
   (Upstash Redis desde el Marketplace de Vercel). Está hecha y desactivada:
   `LEADS_DB_ENABLED=true` más `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
   (si la integración crea `KV_REST_API_URL` y `KV_REST_API_TOKEN`, también valen).
8. **Barra de Vercel en las previews:** la política de seguridad (CSP) de
   `vercel.json` no deja cargar la Vercel Toolbar. Si te molesta el aviso en la
   consola de las previews, desactívala en Settings > General > Vercel Toolbar.

## Antes de activar anuncios

- [ ] Abre la landing **en un iPhone real desde Instagram** (mándate el enlace
      por mensaje directo y ábrelo dentro de la app). Las pruebas automáticas
      imitan ese navegador, pero no lo sustituyen.
- [ ] Envía el formulario con el nombre **PRUEBA** y el perfil **@prueba**:
      llega la fila, llega el correo y se abre WhatsApp con el mensaje bien escrito.
- [ ] "Probar eventos" de Meta: PageView, ViewContent, Lead y Contact por
      servidor y navegador, deduplicados ([docs/meta.md](docs/meta.md), paso 7).
- [ ] `META_TEST_EVENT_CODE` vacío y Redeploy.
- [ ] Lighthouse móvil sobre la URL de Vercel (PageSpeed Insights:
      [pagespeed.web.dev](https://pagespeed.web.dev)) y apunta las cifras.
- [ ] Con anuncios activos: un cambio cada vez y compara los Lead de Meta con las
      filas del Sheet. Algunas filas no tendrán Lead en Meta: las de quien se
      opuso a la medición en "Configurar cookies".

## Pruebas

```bash
npm test
```

Pruebas unitarias: teléfono y E.164, perfil, fila del Sheet sin IDs de Meta,
hash SHA-256, carga útil de la API de conversiones, reintentos del Sheet y
antispam. También ejecuta `apps-script/Code.gs` con los servicios de Google
simulados: clave, cabeceras y fila de 11 columnas, protección contra fórmulas,
duplicados y correo.

```bash
npm run build && node --test tests/content.test.mjs
```

Revisa el texto publicado: sin guiones largos ni medios, sin emojis, sin restos
de la oferta anterior, el mismo CTA en toda la página y solo cifras confirmadas.

```bash
npm run test:e2e
```

Playwright en WebKit (390 px, user agent del navegador de Instagram en iPhone) y
Chromium (1440 px): primer pantallazo, enlaces antes del formulario, CTA fijo,
banner, formulario completo (también con "Otro" y solo con teclado), éxito
aunque `/api/lead` falle, tarde o no haya red, reintento en la siguiente visita,
texto de WhatsApp, consentimiento y `event_id` compartidos, CLS con fuentes
lentas, validaciones de cada paso y prefijos (también con el idioma es-MX),
borrador al recargar, doble clic, mínimo de 3 s, Contact una sola vez, flujo
completo de "Configurar cookies" (botones del panel, oposición a la medición
por servidor, foco y Escape), retirada de la analítica con la página abierta,
decisión sincronizada entre pestañas, oposición que sobrevive a la caducidad
de la decisión, reintentos con la decisión vigente, sin repeticiones al
retirar y volver a aceptar, banner que no tapa el CTA del hero, píxel sin
PageView automáticos, bucles de cifras, cuentas y opiniones (dirección, pausa
con el ratón encima, copia oculta a lectores de pantalla y quietos con
movimiento reducido), estructura en móvil (formulario antes
de 2,5 pantallas y página de 10 como mucho a 390x844; CTA, nota y reels del hero
en el primer pantallazo a 390x844 y 375x667; capturas con el mismo recorte), FAQ con su schema,
"Leer más" en una ventana, tarjetas de opiniones iguales, bucles que arrancan
al llegar, se arrastran y vuelven solos a los 5 s, WhatsApp al momento aunque
el servidor tarde, saltar al formulario, sin JavaScript, movimiento reducido, móvil
en horizontal y páginas legales. Necesita Playwright con WebKit y Chromium:

```bash
npm i -D playwright && npx playwright install --with-deps webkit chromium
```

## Rendimiento

Medido con Lighthouse 13.5 sobre el build de producción (con un ID de píxel de
prueba, como quedará en Vercel) servido en local con compresión, después del
rediseño de octubre de 2026:

| | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|
| Móvil (4G lenta simulada) | 99-100 | 100 | 100 | 69* |
| Escritorio | 100 | 100 | 100 | 69* |

Móvil: FCP 1,1-1,2 s · LCP 1,7-1,8 s · TBT 10-50 ms · CLS 0,002.
Escritorio: FCP 0,3 s · LCP 0,4 s · TBT 0 ms · CLS 0.
\* El SEO baja solo por el `noindex` que pediste (página solo para anuncios).
Es la única comprobación que falla; con indexación sería 100. (La primera
pasada en frío dio 88 por un pico de TBT del propio equipo; las cinco
siguientes, 99-100.)

Primera carga en móvil: 299 KB en 26 peticiones (HTML 19 KB, CSS 4 KB, JS 9 KB
comprimido y 22 KB sin comprimir, una sola fuente y las imágenes en AVIF). En
escritorio, 246 KB. Sin aceptar cookies no se carga ni el píxel ni la analítica.
La banda de cifras se mueve solo con CSS (transform), sin JavaScript en cada
fotograma. Accesibilidad revisada también con axe-core (WCAG 2.2 AA): sin
incidencias en la landing, en cada paso del formulario, en el banner ni en las legales.

Falta repetir Lighthouse sobre el despliegue de Vercel: no tengo acceso a tu
cuenta de Vercel desde aquí.

## Volver atrás

- **Al instante, sin tocar código:** en la tarjeta del despliegue de producción,
  **Instant Rollback** (o Deployments > ⋮ en el despliegue que funcionaba >
  Instant Rollback) y elige el despliegue al que volver. En Pro puedes volver a
  cualquiera de los que estuvieron en producción; en Hobby, solo al anterior.
  **Ojo:** después de un rollback, los siguientes push no se publican solos
  hasta que pulses **Undo Rollback** en esa misma tarjeta.
- **Deshaciendo un cambio en el código:**

```bash
git revert <commit>
```

```bash
git push
```

  Vercel despliega el commit de reversión solo (si antes hiciste un Instant
  Rollback, primero Undo Rollback). Tras cambiar variables de entorno, Redeploy.

## Pendientes y textos a revisar

Los `[PENDIENTE]` y `[REVISAR]` están como comentarios en el código (no se ven en
la página publicada). Búscalos con `grep -rn "PENDIENTE\|REVISAR" src docs .env.example`.

**[PENDIENTE]**
- `META_CAPI_TOKEN`: generar el token del píxel 1600434437839020 ([docs/meta.md](docs/meta.md)).
- `SHEET_WEBHOOK_URL` y `SHEET_SECRET`: desplegar el Apps Script.
- Lighthouse sobre la URL de Vercel y prueba en un iPhone real desde Instagram.
- Titular: con el rediseño pasa a "Más clientes desde tus redes." (una de las
  alternativas cortas). El anterior era "Redes sociales y Meta Ads que llenan tu
  agenda de clientes."; se cambia en `HERO.title` de `src/data/content.mjs`.
- Decidir si activas la base de datos propia (opcional).
- Crear el proyecto de Vercel en un equipo con plan Pro (el plan Hobby no admite
  webs comerciales) y activar Web Analytics en el panel (Speed Insights gratis no
  necesita activarse).
- Opcional: una captura más grande del reel de 151 mil de Exoneris (1080 px de
  ancho o más, a pantalla completa). La actual mide 405 px y en un iPhone se ve
  algo blanda; basta con sustituir `assets/img/cases/exoneris-primer-video.jpg`.

**[REVISAR]**
- Aviso legal del formulario: lo he cambiado. El texto que pediste ("Al enviar
  aceptas la política de privacidad. Usamos tus datos solo para responderte.")
  no era cierto: también se usan para medir los anuncios en Meta, y con la base
  jurídica de la política no hay nada que "aceptar". Ahora dice: "En AAS
  Marketing usamos tus datos para responderte y, convertidos en un código, para
  medir nuestros anuncios en Meta. Puedes oponerte a esa medición en Configurar
  cookies. Más información y tus derechos en la política de privacidad."
- Medición por servidor sin consentimiento (`CAPI_WITHOUT_CONSENT=true`), con
  interés legítimo y un interruptor para oponerse: confírmalo con un asesor.
- Plazos de conservación propuestos (12 meses si no hay contrato): confírmalos y
  cúmplelos, borrando a mano las filas, los correos y las conversaciones de
  WhatsApp antiguas.
- Google: con una cuenta gratuita de Gmail no hay contrato de encargado del
  tratamiento. Lo recomendable es Google Workspace con su anexo de tratamiento de datos.
- Meta como corresponsable (art. 26 RGPD) y transferencias a Estados Unidos:
  comprueba en dataprivacyframework.gov que Vercel, Google y Meta siguen adheridas.
- FAQ "¿Qué recibo exactamente?": confírmame el contenido.
- FAQ "¿Vienes a mi ciudad?": adaptada a la oferta nueva ("Lo vemos cuando te mande la estrategia.").
- FAQ "¿Qué necesito para empezar?": adaptada de la respuesta de la web.
- Política de privacidad: datos recogidos y si son obligatorios, finalidad, base
  jurídica, analítica de Vercel (datos según su documentación), destinatarios,
  Meta como corresponsable, WhatsApp con el mensaje ya escrito, transferencias,
  hash que no es anónimo, envío por servidor y cómo oponerse, conservación,
  derechos y seguridad. Se adapta sola a las variables de Vercel: sin píxel
  (Preview, local o `META_PIXEL_ID=off`) no habla de Meta y con `CAPI_WITHOUT_CONSENT=false` explica
  que solo se mide con consentimiento.
- Política de cookies: almacenamiento necesario, `aas_attr` solo con
  consentimiento, analítica de Vercel, cookies de Meta Pixel, medición desde el
  servidor, caducidad de la decisión (24 meses) y cómo cambiarla.
- Aviso legal: dominio y capturas de clientes.

## Decisiones que conviene que conozcas

- **Antes del formulario no hay ningún enlace externo:** ni WhatsApp, teléfono,
  correo, Instagram ni Google. La valoración de Google es texto, sin enlace. Los
  únicos enlaces que salen de la página están en el pie (WhatsApp, correo e
  Instagram), después del formulario. El banner de cookies enlaza a la política
  de cookies (primera capa informativa).
- **El banner de cookies sale al primer scroll o a los 3 segundos**, pero nunca
  encima del botón del hero ni de la nota de debajo: en móviles pequeños espera
  a que el visitante baje. Hasta que deciden no se carga nada que use cookies;
  los eventos por servidor no dependen del banner.
- **Aviso de cookies:** necesarias (siempre), analítica (Vercel Web Analytics y
  Speed Insights, sin cookies) y marketing (Meta Pixel). "Aceptar" activa todo,
  "Rechazar" quita las cookies opcionales y "Configurar" deja elegir; con el
  panel abierto los botones dicen "Rechazar todo", "Aceptar todo" y "Guardar
  selección". El banner solo pregunta por lo que esté activado en Vercel. La
  decisión dura 24 meses (lo que recomienda la AEPD) y se vuelve a preguntar si
  activas algo nuevo (por ejemplo, el píxel). A Vercel no se le manda el
  identificador de clic de los anuncios (fbclid y similares).
- **Medición por servidor y derecho de oposición:** como pediste, los eventos van
  por la API de conversiones acepten o no las cookies. La ley obliga a que el
  visitante pueda oponerse de verdad (un correo no sirve con visitas anónimas),
  así que "Configurar cookies" tiene un interruptor "Medición desde el servidor",
  activado por defecto: si lo desactivan (o pulsan "Rechazar todo"), ese
  navegador deja de mandar eventos por servidor, también los de una solicitud
  pendiente de reenviarse. La oposición se guarda aparte (`aas_optout`) y no
  caduca con la decisión de cookies. Lo usará muy poca gente. El banner lo dice:
  "Aunque rechaces, mi servidor envía a Meta datos de tu visita con ese fin;
  puedes oponerte en Configurar."
- **Identificadores de Meta antes del consentimiento:** el fbclid, fbc, fbp y
  los utm se capturan al cargar, como pediste, pero sin consentimiento solo se
  guardan en memoria (no en sessionStorage) y no se leen cookies: guardar
  identificadores publicitarios en el navegador sin permiso no lo admite la
  LSSI. Como el formulario está en la misma página, los eventos llevan los
  mismos datos. Con consentimiento se guardan en sessionStorage como antes.
- **Caso Exoneris actualizado** con tus capturas nuevas: 151 mil visitas, 126 mil
  personas lo vieron y 1.058 seguidores nuevos con su primer vídeo, y 1.032
  seguidores en la cuenta. He quitado "en 24 horas" porque las capturas nuevas no
  indican plazo; si lo sabes, dímelo y lo añado.
- **Perfil del formulario:** acepta @usuario, usuario o una URL de Instagram,
  TikTok o web. Si alguien escribe otra cosa (por ejemplo, el nombre del
  negocio o "no tengo"), se guarda tal cual en lugar de bloquear el envío.
- **País para Meta:** el Lead lleva el país del prefijo elegido (España por
  defecto), no siempre "es", para no mandar datos erróneos si el teléfono es de otro país.
- **Analítica de Vercel por las rutas de siempre:** los scripts se cargan desde
  `/_vercel/insights/script.js` y `/_vercel/speed-insights/script.js`. Vercel
  recomienda ahora rutas únicas por despliegue ("resilient intake", con su
  paquete v2) para que los bloqueadores no las reconozcan; las rutas fijas siguen
  funcionando y en el navegador de Instagram apenas hay bloqueadores.
- **Duplicados:** si llega otra vez un envío que ya se guardó (reintento de
  Vercel o del navegador), el Apps Script no duplica la fila ni el correo: lo
  recuerda 8 días en las propiedades del script, sin guardar ningún ID en el
  Sheet. La copia en base de datos tampoco se duplica.
- **Si el Sheet falla:** `/api/lead` responde 503 (aunque se haya guardado la
  copia en base de datos, porque sin fila tampoco sale el correo) y el navegador
  del visitante conserva la solicitud y la reintenta: cada 15 s mientras la
  página siga abierta y al volver a abrirla, durante 7 días. Cada reintento usa
  la decisión de cookies de ese momento. Además, Vercel > Logs tiene la solicitud
  completa (`NO SE HA GUARDADO EN EL SHEET`), pero el registro solo dura 1 hora
  en Hobby y 1 día en Pro: revísalo pronto o activa la copia en base de datos.
  Los envíos marcados como spam también quedan en el log.
