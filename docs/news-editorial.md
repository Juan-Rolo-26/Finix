# Noticias de Finix

Cada categoría tiene 10 posiciones editoriales. La selección automática prioriza
relevancia y actualidad; la imagen no es un requisito. Se conservan los artículos
previos si una fuente falla y las posiciones reservadas por el administrador.
En escritorio aparecen cuatro destacados y seis noticias en la lista, sin repetir
los destacados. Las tarjetas usan el color de la categoría y admiten fotos ausentes
o fallidas. El administrador puede editar las diez posiciones.

## Regla de idioma

La API valida el texto real de cada título y resumen, incluidos los campos de
traducción guardados. Una fuente marcada `es` no puede saltarse la validación.
Esta regla también se aplica a titulares del inicio, noticias por activo,
tendencias y consultas de la API anterior.

Un título sin español validado oculta el artículo hasta que se traduzca. Un resumen
sin español validado se omite. El contenido de la API anterior solo se entrega si
está validado en español. Nunca se devuelve el original extranjero como sustituto
ni se incluye un campo público con el título original. Nombres propios, marcas,
fuentes y símbolos de activos se conservan.

Se prueban Google, LibreTranslate y MyMemory. Cada respuesta se valida antes de
aceptarse: una respuesta vacía, un eco del original o texto en otro idioma no cuenta
como traducción. Los fallos se reintentan tras 10 minutos; las solicitudes iguales
se comparten y la concurrencia de traducción está limitada. Si no hay diez noticias
relevantes y validadas disponibles, se muestran las disponibles, sin inventar
noticias ni completar los espacios con inglés.

Las fuentes españolas adicionales se verificaron por RSS el 6 de octubre de 2026:
FundsPeople ETF, CriptoNoticias, elEconomista Mercados, El Economista Finanzas y
Cinco Días. Se agregan a las fuentes configuradas; se respetan las desactivaciones
y prioridades administradas. [RSS de EL PAÍS/Cinco Días](https://elpais.com/info/rss/),
[RSS de El Economista Argentina](https://eleconomista.com.ar/servicios/rss).

## Actualizaciones

Se mantienen los trabajos y horarios existentes, incluidos los horarios editables
de cada categoría, la recuperación cada cinco minutos y la sincronización horaria.
La página vuelve a consultar la edición cada cinco minutos, al recuperar la conexión
y al volver a la pestaña. Agregar diez posiciones no cambia estos horarios.

No hace falta una migración del esquema: las posiciones 6–10 se crean por `upsert`
al preparar las categorías y sus contenidos se completan con artículos publicados.
Para validar los cambios:

```bash
npm run build --workspace api
node --test scripts/news-spanish.test.cjs scripts/news-coverage.test.cjs scripts/news-publication-images.test.cjs scripts/news-images.test.cjs scripts/performance-regression.test.cjs
npm run build --workspace web
npm run build --workspace admin
FINIX_BROWSER_TEST_URL=http://127.0.0.1:5173 node scripts/news-desktop.browser.cjs
FINIX_BROWSER_TEST_URL=http://127.0.0.1:5173 node scripts/news-coverage.browser.cjs
```
