# Apps Script: guardar las solicitudes en Google Sheets y avisar por correo

Cada vez que alguien envía el formulario, `/api/lead` (Vercel) manda la
solicitud a este script, que:

1. comprueba la clave compartida `SHEET_SECRET` (para que nadie más pueda escribir),
2. añade una fila al Sheet (con `LockService`, sin pisarse si llegan dos a la vez),
3. envía un correo a **aaswebmarketing@gmail.com** con todos los datos, un enlace
   `https://wa.me/...` para escribirle con un toque y el enlace directo a su perfil.

Columnas del Sheet, en este orden y nada más:

| Fecha | Nombre | WhatsApp | Necesita | Negocio | Perfil | Enlace al perfil | utm_source | utm_medium | utm_campaign | Página |
|---|---|---|---|---|---|---|---|---|---|---|

En el Sheet **nunca** se guardan fbclid, fbc, fbp, event_id ni ningún ID de Meta.
La columna Página guarda solo la dirección de la página, sin parámetros.

Si llega otra vez un envío que en realidad ya se había guardado (Vercel reintenta
si el script tarda más de 4 segundos en contestar, y el navegador del visitante
reintenta hasta 7 días si no recibió la confirmación), el script lo reconoce
durante 8 días y no duplica ni la fila ni el correo. Para eso guarda una huella
de cada envío en las propiedades del script (como `lead_...`, nunca en el Sheet)
y borra sola las de más de 8 días.

## Instalación paso a paso (una sola vez)

1. **Crea el Sheet.** En [sheets.new](https://sheets.new) crea una hoja con el nombre,
   por ejemplo, `Leads landing estrategia`. En la fila 1 escribe las cabeceras de
   arriba, una por celda, de la A a la K. (Si la dejas vacía, el script las
   escribe solo con la primera solicitud.)
2. **Zona horaria.** Archivo > Configuración > Zona horaria: `(GMT+01:00) Madrid`.
3. **Abre el editor.** Extensiones > Apps Script. Borra lo que haya en `Código.gs`
   y pega el contenido completo de [`Code.gs`](./Code.gs). Guarda (icono del disquete).
4. **Zona horaria del script.** En el editor: Configuración del proyecto (rueda
   dentada) > Zona horaria: `(GMT+01:00) Madrid`.
5. **Guarda la clave.** En Configuración del proyecto > Propiedades del script >
   Añadir propiedad del script:
   - Propiedad: `SHEET_SECRET`
   - Valor: una clave larga inventada por ti (por ejemplo, 40 letras y números al
     azar). **La misma** irá en Vercel en la variable `SHEET_SECRET`.
6. **Da permisos.** En el editor, elige la función `probar` en el desplegable de
   arriba y pulsa Ejecutar. Google pedirá permisos para el Sheet y para enviar
   correo: acéptalos (si aparece "Google no ha verificado esta aplicación", pulsa
   Configuración avanzada > Ir a ... y acepta; es tu propio script). Debe
   aparecer una fila con nombre **PRUEBA** y perfil **@prueba** y llegarte un correo. Borra
   esa fila después.
7. **Publica como aplicación web.** Implementar > Nueva implementación > tipo
   **Aplicación web**:
   - Descripción: `Landing estrategia v1`
   - Ejecutar como: **Yo** (tu cuenta)
   - Quién tiene acceso: **Cualquier usuario**

   Pulsa Implementar y copia la **URL de la aplicación web** (termina en `/exec`).
8. **Comprueba la URL.** Ábrela en el navegador: tiene que mostrar
   `{"ok":true,"service":"aas-leads"}`.
9. **Pásala a Vercel.** En el proyecto de Vercel > Settings > Environment Variables:
   - `SHEET_WEBHOOK_URL` = la URL `/exec`
   - `SHEET_SECRET` = la misma clave del paso 5

   Guarda y haz **Redeploy** (Deployments > ⋯ del último despliegue > Redeploy).
   Las variables nuevas solo se aplican tras un Redeploy.
10. **Prueba de verdad.** Rellena el formulario de la landing con el nombre
    **PRUEBA** y el perfil **@prueba** (nunca nombres reales ni nada que no sea
    "PRUEBA" en la hoja real). Comprueba la fila y el correo, y bórralos.

## Actualizar el script sin cambiar la URL

Si cambias el código, no crees una implementación nueva (cambiaría la URL):

1. Pega el código nuevo en el editor y guarda.
2. Implementar > **Gestionar implementaciones**.
3. Selecciona la implementación activa > icono del lápiz (**Editar**).
4. En Versión elige **Nueva versión** y pulsa **Implementar**.

La URL `/exec` sigue siendo la misma, así que en Vercel no hay que tocar nada.

## Si ya habías desplegado una versión anterior del script

Esta versión recuerda los envíos ya guardados durante 8 días (antes, 6 horas) y
no necesita permisos nuevos. Pega el código nuevo y publica una versión nueva de
la misma implementación, como en el apartado anterior.

## Si ya habías desplegado la versión de 9 columnas

La versión anterior tenía 9 columnas
(`Fecha | Nombre | WhatsApp | Necesita | Negocio | utm_source | utm_medium | utm_campaign | Página`).
La nueva añade **Perfil** y **Enlace al perfil** después de Negocio y cambia el
asunto del correo. Para actualizarla:

1. **Cabeceras del Sheet.** Selecciona la columna F (utm_source) > clic derecho >
   Insertar 2 columnas a la izquierda. Escribe en F1 `Perfil` y en G1
   `Enlace al perfil`. La fila 1 debe quedar exactamente así, de la A a la K:
   `Fecha | Nombre | WhatsApp | Necesita | Negocio | Perfil | Enlace al perfil | utm_source | utm_medium | utm_campaign | Página`.
   (Las filas antiguas quedan con esas dos columnas vacías; no pasa nada.)
2. **Código.** Extensiones > Apps Script, sustituye todo el código por el nuevo
   [`Code.gs`](./Code.gs) y guarda.
3. **Publica una versión nueva de la misma implementación**: Implementar >
   Gestionar implementaciones > Editar (lápiz) > Versión: **Nueva versión** >
   Implementar. Así la URL no cambia y en Vercel no hay que tocar nada.
4. Haz un envío de prueba desde la landing con nombre **PRUEBA** y perfil
   **@prueba** y comprueba que la fila tiene las 11 columnas y que el correo
   llega con el asunto `Nuevo lead: PRUEBA · ... · @prueba`. Borra la fila.

## Problemas habituales

- **En el log de Vercel aparece "El Apps Script devuelve una página HTML"**: la
  implementación no está con acceso "Cualquier usuario" o no es "Aplicación web".
- **"El Apps Script rechaza la clave"**: `SHEET_SECRET` no es idéntico en Vercel y
  en las propiedades del script (cuidado con espacios al copiar). Tras cambiarlo
  en Vercel, Redeploy.
- **No llega el correo**: revisa la carpeta de spam y que ejecutaste `probar`
  para dar permisos. Las cuentas gratuitas de Google pueden enviar unos 100
  correos al día con MailApp.
- **Una solicitud no está en el Sheet**: en Vercel > Logs busca
  `NO SE HA GUARDADO EN EL SHEET`; la línea incluye la solicitud completa para
  copiarla a mano. Míralo pronto: el registro dura 1 hora en el plan Hobby y 1
  día en Pro. Mientras tanto, el navegador del visitante reintenta el envío y el
  script no duplica la fila si al final llega dos veces.
- **En Propiedades del script aparecen muchas `lead_...`**: son las huellas para
  no duplicar filas. No las borres a mano; el script elimina solo las de más de
  8 días. No toques `SHEET_SECRET`.
- **Conservación:** la política de privacidad dice que las solicitudes que no
  acaban en contrato se borran como máximo 12 meses después del último
  contacto. Borra a mano esas filas (y sus correos y conversaciones de WhatsApp)
  de vez en cuando.
