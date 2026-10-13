# FINIX · Cierre de auditoría móvil, escritorio y educación

Estado: completado en local. Fecha de cierre: 12/10/2026. Sin publicación ni cambios en VPS.

## Resultado

- Navegación móvil: Planes retirado del menú Más y de la cabecera pública móvil. El acceso de escritorio permanece visible. Verificado en claro y oscuro.
- Ajustes puntuales: singular/plural de eventos; cifras de portafolio en formato argentino; aviso de error y botón Reintentar adaptados a pantallas estrechas; subtítulos, rangos y leyendas de gráficos sin recortes a 320 px. Tablas y gráficos que requieren desplazamiento interno lo conservan.
- Escritorio: Mercado usa una cabecera más compacta, mayor densidad de cotizaciones, alineación numérica y mejor jerarquía, conservando la identidad FINIX y ambos temas.
- Educación: biblioteca pública local con 43 artículos de consulta, buscador por conceptos/siglas, categorías y nivel de profundidad. Sin cursos, secuencias, botones de completar ni progreso de aprendizaje. Las rutas antiguas de aprendizaje redirigen a la biblioteca. Los datos históricos existentes se conservan.
- Los 66 rótulos de métricas de Analysis tienen enlaces específicos a artículos existentes. Incluye técnico, valoración, estados financieros, crecimiento, rentabilidad, liquidez, estructura accionaria, riesgo, instrumentos argentinos, bonos, calendario y portafolio. La búsqueda incorpora nombres de categorías y alias como P/E, PE, RSI, MACD, media 20/200, ARR e insiders.
- Definiciones, fórmulas, unidades, ejemplos didácticos y límites: se revisaron especialmente ROE/ROA/ROCE, caja/CapEx/FCF, deuda, márgenes, capitalización/EV, beta y volatilidad, WACC y duration. RSI y MACD están clasificados como análisis técnico. Los ejemplos no se presentan como señales garantizadas.
- Siete imágenes reales de internet guardadas en el repositorio, con autor, licencia y vínculo de origen en los artículos. Se distinguen imágenes históricas y diagramas didácticos. El RSI ilustrado es de 21 períodos; la comparación SMA/EMA es de 14 períodos en GBP/CAD horario de 2013, sin confundirla con las medias 20/200 explicadas en el texto. No se generaron imágenes con IA.

## Verificación independiente

- 104 capturas generales: 26 rutas, 320/430 px, claro/oscuro, con datos de prueba para comprobar presentación; sin errores JavaScript ni desbordamiento horizontal global. Educación se probó por separado con su API y contenido reales.
- 18 capturas de escritorio: Mercado, Calendario y Portafolio a 1024/1440/1920 px, claro/oscuro, con datos de prueba de presentación. Sin errores JavaScript ni desbordamiento global.
- Educación: matriz de 16 vistas entre 320 y 1920 px para el catálogo de 42 artículos previo al cierre; siete artículos ilustrados con imágenes cargadas. Tras la ampliación a 43: cuatro vistas de catálogo a 390/1440, doce vistas de seis artículos revisados a 320 en ambos temas, doce búsquedas, navegación atrás y redirección antigua, más comprobación de filtros y navegación en ambos temas. Sin errores JavaScript ni desbordamiento global en esas vistas.
- Filtro final: 17 artículos de fundamental; 5 al combinar con Principiante; Todos restaura 17 y Todas las categorías restaura 43.
- 13 pruebas de búsqueda, enlaces, texto seguro, tablas, activación local y conservación de artículos/personalizaciones. Compilación web y API aprobadas; comprobación TypeScript del último ajuste móvil aprobada; API local reiniciada con éxito.
- Base local: 43 semillas publicadas y cuerpos coincidentes con el código final; siete imágenes presentes. Se conservó el widget DCF personalizado y no se reemplazaron borradores ni artículos archivados. La lectura no escribe progreso de usuario; el contador agregado de vistas sigue funcionando.

## Referencias y alcance

Se investigaron [AlphaSpread](https://www.alphaspread.com/), [Investing](https://es.investing.com/) y [Rava](https://www.rava.com/). Rava pudo inspeccionarse visualmente. AlphaSpread presentó un control de acceso y Investing devolvió 403 en el navegador automatizado: la comparación de esos dos sitios se apoyó en páginas públicas y su organización, sin afirmar una comparación visual completa. No se copió la marca ni se prometió un diseño idéntico.

Contenido respaldado con fuentes específicas: [Fidelity, indicadores técnicos](https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide), [CFA Institute, análisis financiero](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/financial-analysis-techniques), [SEC, estados financieros](https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide), [BYMA, glosario](https://www.bymaeduca.com.ar/pages/glosario1), [Rava, bonos](https://www.rava.com/herramientas/analisis-de-bonos/) y [AlphaSpread, DCF](https://kb.alphaspread.com/hc/en-us/articles/18217888896017-What-is-DCF-Value). Cada artículo incorpora sus propias referencias; la redacción y los ejemplos son propios.

Las pruebas de presentación no certifican exactitud ni disponibilidad de cotizaciones o proveedores financieros en vivo. Durante el cierre se detectó otro trabajo del usuario en Antigravity sobre balances/calendario y rachas; esos cambios se preservaron y no se atribuyen a esta auditoría. El informe registra las vistas probadas en cada momento.

La educación se activa por defecto en desarrollo/preview local y permanece desactivada por defecto en producción externa, respetando el interruptor explícito existente. No se modificó el despliegue. No se tocaron archivos sincronizados bajo sources/.

Vista local: http://localhost:5173/educativa

