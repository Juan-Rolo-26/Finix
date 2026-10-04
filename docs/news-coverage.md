Noticias se recuperan de las fuentes configuradas, con fuentes específicas para ETFs, bienes raíces, fintech, empresas emergentes, inteligencia artificial, tecnología y finanzas personales.

Al consultar una categoría, las tarjetas vacías se completan con artículos publicados y activos. Se permite reutilizar una noticia de otra categoría cuando trata el tema y su fuente tiene habilitada esa categoría. Los borradores, las tarjetas desactivadas y las selecciones editoriales se conservan. La asignación usa una condición de escritura para respetar cambios manuales simultáneos.

Al iniciar la API y cada cinco minutos se repara la cobertura incompleta. La actualización horaria sigue funcionando para todas las categorías. Las fuentes se consultan con un máximo de tres solicitudes simultáneas; un fallo no borra las noticias anteriores ni bloquea futuras sincronizaciones. La deduplicación también reconoce URLs antiguas y noticias guardadas en otras categorías.

El frontend mantiene las noticias al fallar una actualización, cancela respuestas de pestañas anteriores y vuelve a consultar al recuperar el foco o la conexión. Una categoría todavía vacía se consulta nuevamente a los treinta segundos.

Para reparar los datos existentes, usando la conexión de la API:

```bash
npm run build -w api
node apps/api/scripts/repair-news-coverage.cjs
```

El script completa tarjetas, importa hasta ocho artículos reales de cada fuente temática que necesite recuperación y verifica la cobertura. Respeta fuentes desactivadas y aprovecha consultas realizadas durante la última hora. Se puede ejecutar nuevamente si falla una fuente.

Validación:

```bash
node --test scripts/news-coverage.test.cjs scripts/news-images.test.cjs scripts/news-publication-images.test.cjs
npm run build -w web
# Con el frontend en 127.0.0.1:4173:
node scripts/news-coverage.browser.cjs
```
