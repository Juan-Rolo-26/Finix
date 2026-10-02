Todas las noticias se guardan con una foto. El importador prioriza imágenes del RSS (media:content, media:thumbnail, media:group, enclosure y HTML), resuelve rutas relativas y distingue imágenes de audio o video. Si falta la foto, busca Open Graph, Twitter o imágenes del artículo en el sitio del medio. Si la nota tampoco trae una foto, agrega automáticamente una imagen ilustrativa relacionada con el título o la categoría y la guarda en `imageUrl`.

La regla también se verifica antes de escribir en la base de datos y en las cargas manuales. Guardar o publicar una nota completa automáticamente la foto que falta. Al reemplazar una nota no se hereda la foto de la noticia anterior. La selección automática busca primero otras noticias que tengan foto propia y completa los espacios restantes con noticias que llevan una imagen ilustrativa. Una foto original o personalizada no se reemplaza por una ilustración al deduplicar fuentes. Una caída de las fuentes no genera noticias de ejemplo.

La búsqueda de fotos realiza hasta cuatro solicitudes simultáneas, con cuatro segundos por página y un presupuesto de quince segundos por fuente. Sigue hasta tres redirecciones dentro del medio, limita las páginas a 512 KB y guarda los resultados en una caché acotada. Las fuentes inaccesibles no interrumpen la importación del resto.

Las tarjetas conservan la foto original. Si falla, intentan una foto del tema; si también falla, muestran `/news-fallback.jpg`, incluida en el frontend. Esa foto se descargó de la imagen de mercados que Finix ya utilizaba: https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80.

Validación:

```bash
npm run build -w api
node --test scripts/news-images.test.cjs
node --test scripts/news-publication-images.test.cjs
npm run build -w web
# Con el frontend ejecutándose en http://127.0.0.1:5178 y Chromium instalado:
node scripts/news-images.browser.cjs
```

El cambio requiere desplegar tanto la API como el frontend. No modifica los cronogramas de noticias, las pasarelas de pago ni los planes.
