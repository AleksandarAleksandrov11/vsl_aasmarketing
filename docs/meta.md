# Medición con Meta: guía desde cero

Esta guía es para dejar el píxel y la API de conversiones funcionando sin tener
nada creado todavía. La landing ya está preparada: en cuanto rellenes
`META_PIXEL_ID` y `META_CAPI_TOKEN` en Vercel y hagas **Redeploy**, todo se
activa sin tocar código. Mientras estén vacías, la landing funciona igual y el
formulario sigue guardando en el Sheet.

> Los nombres de los menús de Meta cambian a menudo. Si algo no aparece con el
> mismo nombre, busca la opción equivalente en el buscador de la configuración.

## Qué mide la landing

Solo cuatro eventos. Cada uno lleva un `event_id` único que es **el mismo** en
el navegador y en el servidor, para que Meta los cuente una sola vez.

| Evento | Cuándo | Servidor (API de conversiones) | Navegador (píxel) |
|---|---|---|---|
| PageView | Al cargar la página | Siempre* | Solo si aceptan las cookies de marketing |
| ViewContent | La primera vez que el formulario entra en pantalla | Siempre* | Solo con consentimiento |
| Lead | Al enviar el formulario | Siempre*, desde `/api/lead`, sin depender del Sheet | Solo con consentimiento |
| Contact | Al abrir WhatsApp desde la pantalla de éxito | Siempre* (con `sendBeacon`) | Solo con consentimiento |

\* Salvo que el visitante se oponga: en "Configurar cookies" hay un interruptor
"Medición desde el servidor" (activado por defecto). Si lo desactiva o pulsa
"Rechazar todo", ese navegador deja de mandar eventos por servidor. La ley
obliga a ofrecerlo porque la medición sin consentimiento se basa en el interés
legítimo; lo usará muy poca gente.

- Por servidor se envían la IP, el navegador, la página y `fbc`/`fbp`. En el
  Lead, además, el teléfono, el nombre y el país transformados con SHA-256.
- Si alguien acepta las cookies después de entrar, el píxel manda el PageView
  con el **mismo** `event_id` que ya se envió por servidor: nunca hay dos
  PageView distintos.
- El píxel se carga con los eventos automáticos desactivados (`autoConfig`
  falso), así que no aparecen eventos que no hemos pedido.
- El píxel no manda PageView automáticos al cambiar el ancla (los CTA bajan a
  `#formulario`) ni al volver atrás: solo los cuatro eventos de la tabla.
- `CAPI_WITHOUT_CONSENT=true` (por defecto) envía por servidor aunque no acepten
  las cookies. Con `false` y Redeploy, solo se envía con consentimiento. El aviso
  de cookies y la política de privacidad se adaptan solos a la opción activa
  (párrafos marcados [REVISAR]).
- El token de la API de conversiones va en el cuerpo de la petición, no en la
  URL, para que no aparezca en los registros de Vercel.

## 1. Crear el portfolio empresarial

1. Entra en [business.facebook.com](https://business.facebook.com) con tu
   perfil personal de Facebook.
2. Crear un portfolio empresarial (antes "Business Manager"). Usa tus datos:
   nombre del negocio **AAS Marketing**, tu nombre y el correo
   **aaswebmarketing@gmail.com**.
3. Confirma el correo que te envía Meta.

## 2. Cuenta publicitaria dentro del portfolio

1. Configuración del negocio > Cuentas > **Cuentas publicitarias** > Añadir.
2. Si ya tienes una cuenta publicitaria personal con historial, elige
   **Añadir una cuenta publicitaria** e indica su ID: así el portfolio pasa a ser
   su dueño. Si no tienes ninguna, **Crear una cuenta publicitaria** (zona horaria
   Europa/Madrid y moneda EUR; no se pueden cambiar después).
3. Asígnate a ti mismo con control total y añade el método de pago.

## 3. Crear el conjunto de datos (píxel) desde el portfolio

Créalo **desde el portfolio**, no desde tu cuenta personal. Si el píxel queda en
una cuenta personal, Meta no deja generar el token de la API de conversiones.

1. Configuración del negocio > Orígenes de datos > **Conjuntos de datos** > Añadir.
2. Nombre: `AAS Marketing landing`. Crear.
3. Asigna la cuenta publicitaria del paso 2 al conjunto de datos y date acceso a ti.
4. Abre el conjunto de datos en el **Administrador de eventos** y copia su
   **ID** (solo cifras). Ese es tu `META_PIXEL_ID`.

## 4. Verificar el dominio aasmarketing.com

1. Configuración del negocio > Seguridad de la marca > **Dominios** > Añadir >
   escribe `aasmarketing.com` (el dominio principal, sin `vsl.`; cubre los subdominios).
2. Elige **Actualizar registro TXT de DNS**. Meta te da un valor como
   `facebook-domain-verification=xxxxxxxx`.
3. Crea ese registro TXT donde gestionas el DNS de aasmarketing.com:
   - Si el dominio usa los servidores de nombres de Vercel: Vercel > Domains >
     aasmarketing.com > **DNS Records** > Add: Type `TXT`, Name `@` (o vacío),
     Value el texto de Meta.
   - Si el DNS está en tu registrador: crea allí el mismo registro TXT en la raíz.
4. Vuelve a Meta y pulsa **Verificar** (puede tardar desde minutos hasta 72 horas).

## 5. Poner el ID del píxel en Vercel

1. Vercel > proyecto de la landing > Settings > **Environment Variables**.
2. `META_PIXEL_ID` = el ID del paso 3, tipo Config, entorno **Production** (en
   Preview déjala vacía: la landing funciona igual y tus visitas de prueba no se
   mezclan con los datos reales).
3. Guarda. Todavía no hagas Redeploy si vas a añadir el token ahora.

## 6. Generar el token de la API de conversiones

1. Administrador de eventos > tu conjunto de datos > **Configuración**.
2. Sección API de conversiones > **Generar token de acceso** (con la integración
   manual / "Configurar manualmente"). Cópialo: solo se muestra una vez.
3. En Vercel: `META_CAPI_TOKEN` = el token, tipo **Secret**, entorno Production. Guarda.
4. **Redeploy**: Deployments > ⋯ en el último despliegue > Redeploy. Sin Redeploy
   las variables no se aplican (este fue el fallo de otra landing: el Lead por
   servidor no llegaba porque faltaba el token o no se había redeployado).

## 7. Comprobar con "Probar eventos" antes de lanzar anuncios

1. Administrador de eventos > conjunto de datos > **Probar eventos**. Copia el
   código de prueba (por ejemplo `TEST12345`).
2. En Vercel: `META_TEST_EVENT_CODE` = ese código > Guardar > Redeploy.
3. Abre `https://vsl.aasmarketing.com` en el móvil **desde Instagram** (mándate
   el enlace por mensaje directo y ábrelo dentro de la app).
4. Comprueba en Probar eventos, en este orden:
   - **PageView** por servidor nada más entrar, aunque no toques el banner.
   - Pulsa **Aceptar** en el banner: aparece PageView por navegador y Meta lo
     marca como **deduplicado** con el de servidor.
   - Baja hasta el formulario: **ViewContent** (servidor y navegador).
   - Envía el formulario con el nombre **PRUEBA** y el perfil **@prueba**:
     **Lead** por servidor y navegador, deduplicado. Comprueba que en el Lead de
     servidor aparecen "Teléfono", "Nombre" y "País" como parámetros de cliente.
   - Al abrirse WhatsApp: **Contact**.
   - Repite sin aceptar cookies: deben llegar los mismos eventos, solo por servidor.
   - Repite en "Configurar cookies" con "Medición desde el servidor"
     desactivada: no debe llegar nada por servidor.
5. Borra la fila PRUEBA del Sheet.
6. **Vacía `META_TEST_EVENT_CODE`** en Vercel y haz Redeploy. El código es solo
   para "Probar eventos" y Meta pide quitarlo en producción.

## 8. Regla de oro con anuncios activos

- **Cambia una sola cosa cada vez** (banner, píxel, evento, formulario, textos)
  y espera a ver datos antes de tocar otra.
- Cada semana compara los **Lead de Meta** (Administrador de anuncios, columna
  Resultados o "Clientes potenciales en el sitio web") con las **filas reales del
  Sheet**. Siempre habrá alguno menos en Meta (quien se opuso a la medición o
  bloquea los envíos). Si Meta cuenta muchos menos, algo falla en la medición; si
  cuenta muchos más, revisa que no haya envíos duplicados.
- Antes de cambiar nada, apunta la fecha y el cambio para poder comparar y, si
  hace falta, volver atrás (ver "Volver atrás" en el README).

## Dónde mirar si algo falla

- **Vercel > Logs**: los avisos llevan prefijo `[meta]`, `[sheet]` o `[lead]`.
  - `[meta] Falta META_PIXEL_ID o META_CAPI_TOKEN`: faltan variables o no se hizo Redeploy.
  - `[meta] Lead rechazado (400)`: token caducado o de otro conjunto de datos.
- La versión de la Graph API está en `lib/meta.js` (`GRAPH_VERSION = 'v26.0'`).
  Meta retira cada versión unos dos años después; cuando avise, sube el número y
  despliega.
