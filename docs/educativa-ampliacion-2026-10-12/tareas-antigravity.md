# FINIX · Ampliación de biblioteca educativa

Pedido de Juan: 20 tarjetas nuevas, mayor profundidad en fundamentales y categoría Tipos de activos. Implementación de Codex en el repositorio compartido, sin ejecutar un agente en Antigravity.

- [x] Investigar fuentes primarias: SEC/Investor.gov, IFRS, CFA Institute, Damodaran, BYMA, BCRA y Secretaría de Finanzas.
- [x] Redactar 11 artículos fundamentales y 9 de instrumentos, con fórmulas, ejemplos ficticios, riesgos y errores frecuentes.
- [x] Descargar 10 fotografías reales de Wikimedia Commons y conservar autor, licencia y origen. Sin IA.
- [x] Añadir imágenes a cada nuevo artículo y miniaturas de tarjetas en catálogo y categoría.
- [x] Añadir búsqueda por siglas y sinónimos, incluido put y el alias pull.
- [x] Preservar artículos, borradores, personalizaciones y esquema de base de datos existente.
- [x] Compilar API/web y verificar búsqueda, 20 rutas y carga de imágenes: aprobado. Catálogo público: 63 artículos. Pruebas de búsqueda por revenue, PE, ROIC, WACC, ONs, call, pull, Bitcoin, plazos fijos y letras; sin falsos positivos para RSI inexistente.
- [x] Verificar móvil/escritorio y temas claro/oscuro: categoría a 390 px y 1280 px, revenue a 320 px y 1280 px, opciones a 390 px. Sin desbordamiento global en las vistas revisadas. Fotografías y enlaces de créditos cargados.

Diseño: conservar los tokens FINIX de fondo, tarjeta, texto, borde y verde primario; tipografía existente. Fotografías horizontales de contexto, sin texto superpuesto, texto alineado a izquierda y créditos visibles dentro del artículo. No son gráficas de cotizaciones actuales. El documento histórico de deuda de 1910 no ilustra una emisión argentina vigente. La pieza Casascius no se presenta como BTC digital. Conservar niveles como filtros de consulta, sin cursos ni progreso.

## Cierre

11 artículos fundamentales y 9 de Tipos de activos, 6.657 palabras aproximadas de contenido nuevo, 10 fotografías reales reutilizadas por tema. Cada tarjeta nueva tiene miniatura y cada artículo tiene imagen, autor, licencia y fuente. Se conserva la distinción entre imagen contextual/documento histórico y ejemplo numérico ficticio.

Se corrigieron dos problemas detectados: carga parcial de 50 tarjetas por un tercer pedido en ráfaga (ahora una página de hasta 200 y categorías en paralelo), y filtros de subcategorías comprimidos en móvil (filas flexibles con botones de al menos 44 px). Créditos en cursiva ahora admiten enlaces completos, también URLs con paréntesis, sin HTML inseguro.

Pruebas: `node scripts/education-expansion.test.cjs` y `node scripts/education-text-links.test.cjs`, compilación API/web y git diff --check aprobados. La sincronización repetida conserva contenido, estado, fórmula y widgets existentes, incluidos campos vacíos. No se recrearon cursos ni progreso.

Disponible en local: http://localhost:5173/educativa/tipos-de-activos. No desplegado al VPS en este pedido. El documento de tareas está en el repositorio compartido para revisión en Antigravity; no se ejecutó un agente allí.
