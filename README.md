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
  pregenerado, el CSS crítico en línea y unos 8 KB de JS propio.
- Imágenes en AVIF y WebP con `srcset` y medidas fijas generadas en el build, y
  funciones de Vercel en `/api` (Node 24) para el formulario y la API de conversiones.
- Pediste Node 20, pero Vercel lo retiró el 1 de octubre de 2026. Las funciones
  usan Node 24 (el LTS por defecto de Vercel); el código también funciona en 22.

## Estructura

```
api/lead.js          POST /api/lead: formulario → Meta (Lead) + Google Sheets (+ BD opcional)
api/event.js         POST /api/event: PageView, ViewContent y Contact → API de conversiones
lib/                 Código de servidor (Meta, Sheet, BD opcional, validación)
shared/              Código común navegador/servidor (teléfono, perfil, opciones)
src/data/content.mjs TODOS los textos, cifras, testimonios y preguntas frecuentes
src/templates/       Plantillas de la landing, legales y 404
src/css/             critical.css (va en línea) y main.css (se carga sin bloquear)
src/js/              Formulario, medición, cookies, CTA fijo, carruseles y vídeos
assets/              Imágenes, vídeos, fuentes y favicons (originales; el build los optimiza)
apps-script/         Code.gs y README para el Sheet y el correo
docs/meta.md         Píxel, API de conversiones y portfolio de Meta desde cero
scripts/             build.mjs, serve.mjs (servidor local tipo Vercel), og.mjs y map.mjs
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

- **Cambiar textos:** `src/data/content.mjs` (y las preguntas del formulario en
  `shared/options.js`). Después, `npm run build` o un push para desplegar.
- **Poner tu foto en "Soy Aleks":** guarda la foto como
  `assets/img/aleks/foto.jpg` (también vale .png o .webp) y despliega. El build la
  optimiza y sustituye al logo. Si la borras, vuelve el logo.
- **Imagen para compartir (og.jpg):** `assets/img/og.jpg`. Se generó con
  `node scripts/og.mjs` con el mismo estilo de la web (la de aasmarketing.com
  hablaba de webs y demo gratuita).
- **Mapa de España y Europa:** `assets/img/mapa-europa.svg`, generado con `scripts/map.mjs`.

## Desplegar en Vercel (paso a paso)

1. **Crear el proyecto.** En [vercel.com/new](https://vercel.com/new) importa el
   repositorio `vsl_aasmarketing`. Framework Preset: **Other**. No toques los
   comandos: `vercel.json` ya indica `npm run build` y la carpeta `dist`.
   Pulsa Deploy. Tendrás una URL `*.vercel.app` de preview.
2. **Variables de entorno** (Settings > Environment Variables, entornos
   Production y Preview). Ver `.env.example`:
   - `SHEET_WEBHOOK_URL` y `SHEET_SECRET` (después de desplegar el Apps Script, paso 4).
   - `CAPI_WITHOUT_CONSENT` = `true`.
   - `META_PIXEL_ID` y `META_CAPI_TOKEN` cuando los tengas ([docs/meta.md](docs/meta.md)).
   - `META_TEST_EVENT_CODE` solo mientras pruebas eventos; en producción, vacío.
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
6. **Vercel Analytics:** en el proyecto, pestaña **Analytics** > Enable y pestaña
   **Speed Insights** > Enable, y después Redeploy. La landing ya los trae
   conectados al aviso de cookies: solo se cargan si el visitante acepta la
   analítica (categoría propia en "Configurar"). Speed Insights te dará el LCP,
   CLS e INP reales de las visitas desde Instagram. Si no los quieres, pon
   `VERCEL_ANALYTICS=false`.
7. **Opcional (decide tú):** copia de cada solicitud en una base de datos propia
   (Upstash Redis desde el Marketplace de Vercel). Está hecha y desactivada:
   `LEADS_DB_ENABLED=true` más `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.

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
      filas del Sheet.

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
completo de "Configurar cookies", carruseles, vídeos, FAQ con su schema,
"Leer más", saltar al formulario, sin JavaScript, movimiento reducido, móvil
en horizontal y páginas legales. Necesita Playwright con WebKit y Chromium:

```bash
npm i -D playwright && npx playwright install --with-deps webkit chromium
```

## Rendimiento

Medido con Lighthouse 13.5 sobre el build de producción servido en local con
compresión, como en Vercel:

| | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|
| Móvil (4G lenta simulada) | 99-100 | 100 | 100 | 69* |
| Escritorio | 100 | 100 | 100 | 69* |

Móvil: FCP 1,1-1,2 s · LCP 1,5-1,7 s (el titular) · TBT 20 ms · CLS 0.
Escritorio: FCP 0,3 s · LCP 0,4 s · TBT 0 ms · CLS 0.
\* El SEO baja solo por el `noindex` que pediste (página solo para anuncios).
Es la única comprobación que falla; con indexación sería 100.

Primera carga en móvil: 323 KB en 25 peticiones (HTML 16 KB, CSS 5 KB, JS 8 KB
comprimido y 19 KB sin comprimir, dos fuentes 40 KB e imágenes AVIF 243 KB). En
escritorio, 265 KB. Los vídeos solo se descargan al pulsar. Accesibilidad
revisada también con axe-core (WCAG 2.2 AA): sin incidencias en la landing, en
cada paso del formulario, en el banner ni en las legales.

Falta repetir Lighthouse sobre el despliegue de Vercel: no tengo acceso a tu
cuenta de Vercel desde aquí.

## Volver atrás

- **Al instante, sin tocar código:** Vercel > Deployments > elige el despliegue
  anterior que funcionaba > ⋯ > **Promote to Production** (Instant Rollback).
- **Deshaciendo un cambio en el código:**

```bash
git revert <commit>
```

```bash
git push
```

  Vercel despliega el commit de reversión solo. Tras cambiar variables de
  entorno, Redeploy.

## Pendientes y textos a revisar

Los `[PENDIENTE]` y `[REVISAR]` están como comentarios en el código (no se ven en
la página publicada). Búscalos con `grep -rn "PENDIENTE\|REVISAR" src docs .env.example`.

**[PENDIENTE]**
- `META_PIXEL_ID` y `META_CAPI_TOKEN`: crear portfolio, píxel y token ([docs/meta.md](docs/meta.md)).
- `SHEET_WEBHOOK_URL` y `SHEET_SECRET`: desplegar el Apps Script.
- Lighthouse sobre la URL de Vercel y prueba en un iPhone real desde Instagram.
- Elegir titular: se mantiene el tuyo. Alternativas más cortas (comentario en
  `src/data/content.mjs`): "Redes y anuncios que llenan tu agenda." y "Más
  clientes desde tus redes."
- Decidir si activas la base de datos propia (opcional).

**[REVISAR]**
- FAQ "¿Qué recibo exactamente?": confírmame el contenido.
- FAQ "¿Vienes a mi ciudad?": adaptada a la oferta nueva ("Lo vemos cuando te mande la estrategia.").
- FAQ "¿Qué necesito para empezar?": adaptada de la respuesta de la web.
- Política de privacidad: datos recogidos, finalidad, base jurídica (medidas
  precontractuales y, para la medición, interés legítimo: confirmar con un
  asesor), analítica de Vercel con consentimiento, destinatarios (Vercel,
  Google, Meta, WhatsApp y Upstash si activas la copia), transferencias,
  envío por servidor a Meta sin cookies (`CAPI_WITHOUT_CONSENT=true`),
  conservación, derechos y seguridad.
- Política de cookies: lista de almacenamiento, `aas_attr`, analítica de Vercel,
  cookies de Meta Pixel y cómo cambiar la decisión.
- Aviso legal: dominio y capturas de clientes.

## Decisiones que conviene que conozcas

- **El enlace a las reseñas de Google** ("5,0 en Google", en testimonios) es el
  único enlace externo antes del formulario porque lo pediste expresamente; se
  abre en pestaña nueva. Antes del formulario no hay WhatsApp, teléfono, correo
  ni Instagram. El banner de cookies enlaza a la política de cookies (primera
  capa informativa).
- **El banner de cookies sale al primer scroll o a los 3 segundos**, para que el
  primer pantallazo del móvil muestre solo titular, CTA y línea de confianza.
  Hasta que deciden no se carga nada opcional, así que esperar no cambia nada
  legalmente; los eventos por servidor no dependen del banner.
- **Tres categorías en el aviso de cookies:** necesarias (siempre), analítica
  (Vercel Web Analytics y Speed Insights, sin cookies) y marketing (Meta Pixel).
  "Aceptar" activa las dos opcionales, "Rechazar" ninguna y "Configurar" deja
  elegir. A Vercel no se le manda el identificador de clic de los anuncios
  (fbclid y similares): se quita de la dirección antes de enviarla.
- **Caso Exoneris actualizado** con tus capturas nuevas: 151 mil visitas, 126 mil
  personas lo vieron y 1.058 seguidores nuevos con su primer vídeo, y 1.032
  seguidores en la cuenta. He quitado "en 24 horas" porque las capturas nuevas no
  indican plazo; si lo sabes, dímelo y lo añado.
- **Perfil del formulario:** acepta @usuario, usuario o una URL de Instagram,
  TikTok o web. Si alguien escribe otra cosa (por ejemplo, el nombre del
  negocio o "no tengo"), se guarda tal cual en lugar de bloquear el envío.
- **País para Meta:** el Lead lleva el país del prefijo elegido (España por
  defecto), no siempre "es", para no mandar datos erróneos si el teléfono es de otro país.
- **Duplicados:** si Vercel reintenta un envío que ya se guardó, el Apps Script
  no duplica la fila (lo recuerda 6 horas sin guardar ningún ID en el Sheet).
- **Logs:** si una solicitud no se guarda en el Sheet, Vercel > Logs tiene la
  solicitud completa (`NO SE HA GUARDADO EN EL SHEET`). Los envíos marcados como
  spam también quedan en el log por si fueran de una persona real.
