# Laboratorio Financiero FINIX

Nueva ruta pública local: `/laboratorio`, cargada de forma independiente. Disponible desde Herramientas en escritorio, Más en celular y la Biblioteca Educativa.

## Funcionalidad
- Ocho calculadoras: interés compuesto, objetivos, inflación, costos, escenarios, tasas, préstamos y equilibrio de una operación.
- Supuestos editables, validación inmediata, gráficos interactivos, métricas, tablas mensuales paginadas y exportación CSV con entradas.
- Aportes al inicio o al cierre, TEA mensual equivalente, rendimiento real exacto y comparación de tres escenarios.
- Unidades ARS/USD; cambiar la unidad no convierte importes. Ejemplos sin cotizaciones en vivo.
- Hasta seis simulaciones guardadas explícitamente por el usuario en su navegador; cargar y eliminar. Sin envío de valores al servidor.
- Fuentes públicas y enlaces a Educación junto a cada cálculo. Supuestos y límites visibles en la interfaz.
- Modos claro/oscuro, controles accesibles, navegación por teclado y resultados grandes en notación científica.

## Revisión en Antigravity
El agente del IDE revisó y desarrolló el motor, agregó `scripts/laboratorio-calculos.test.cjs` con 29 pruebas y produjo `revision-calculos.md`. Se respetaron las tareas previas del usuario.

Revisión adicional: `scripts/laboratorio-formulas.test.cjs` contrasta fórmulas cerradas y límites en 109 combinaciones. Para evitar errores de cancelación numérica, los préstamos calculan el saldo restante mediante el valor presente de las cuotas pendientes. Así no aparece una cuota final artificialmente grande en tasas/plazos extremos.

## Verificación visual y de uso
`scripts/laboratorio-ui.test.cjs`: ocho herramientas × cuatro anchos (320, 390, 768, 1440) × dos temas. Comprueba ausencia de desborde global, carga de gráficos, errores de JavaScript, tablas y tres métricas. Prueba búsqueda y vacío, datos inválidos, tasa cero, guardar/recargar/cargar/eliminar, CSV, menú móvil y valores extremos. Evidencia en `ui-checks.json` y capturas locales.

## Referencias
- Investor.gov: interés compuesto y objetivos de ahorro.
- SEC: efectos de costos recurrentes sobre patrimonio.
- BCRA: metodología y convenciones de tasas.
- CFPB: amortización de préstamos.

Se implementaron las herramientas dentro de FINIX con su diseño y cálculos propios, tomando referencias públicas; no se incorporaron calculadoras externas ni dependencias nuevas.

Estado: implementación local. La publicación anterior en VPS sigue disponible; esta sección nueva todavía no fue desplegada.
