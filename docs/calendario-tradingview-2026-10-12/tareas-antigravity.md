# FINIX · Calendario: TradingView como única fuente corporativa

Solicitud de Juan, 12/10/2026. Implementación directa de Codex en el mismo repositorio utilizado por Antigravity. Este archivo registra tareas; no implica haber iniciado una conversación o un agente en Antigravity.

- [x] Investigar mezcla de registros de base de datos y TradingView.
- [x] Quitar registros manuales/ajenos del calendario público corporativo; la base solo aporta IDs.
- [x] Evitar heredar EPS, ingresos, estimaciones, horario y reacción bursátil de otro registro.
- [x] Agrupar dividendos exclusivamente en su fecha ex-dividendo; pago como dato informativo.
- [x] Deduplicar distribuciones por símbolo normalizado y ex-fecha, sin generar tarjetas por corrección del importe/pago.
- [x] Omitir dividendos sin ex-fecha válida o importe positivo.
- [x] Mantener períodos diferentes de balances en la vista de todas las fechas.
- [x] Verificar compilación y regresiones: build API, calendar-corporate, calendar-data-quality, calendar-tradingview-strict y 8 pruebas Jest aprobadas.
- [x] Contrastar respuesta real con TradingView y probar API local: 1.890 balances, 466 distribuciones, cero duplicados y cero fechas ex mal agrupadas. Apple, Nvidia y JPMorgan coinciden campo a campo con el Scanner. Pantallas de balances (34) y dividendos (14) comprobadas para la semana del 12/10/2026.

Alcance: balances de acciones de EE. UU. y dividendos del S&P 500 existentes. La imagen no contiene símbolo ni el detalle expandido del evento, por lo que no permite contrastar un balance específico. El Scanner ofrece último reporte y próximo reporte, no el historial completo de cada trimestre; no se completan vacíos con otras fuentes. Se preservan los eventos macroeconómicos, cuyo origen no forma parte de este cambio corporativo.

Referencias primarias: https://www.tradingview.com/support/solutions/43000759913-introduction-to-dividend-calendar/ y https://www.tradingview.com/support/solutions/43000629790-earnings/

## Estado final

Corrección implementada y funcionando en local (http://localhost:5173/calendario). No desplegada al VPS en este pedido. Se restauró el contenedor de Redis local por permisos de un archivo temporal; volúmenes conservados. API y web locales iniciadas.

Evidencia: `verificacion-real.json`, `balances.jpg` y `dividendos.jpg`.
La prueba vieja de `refreshCorporateEvents` refería a un método inexistente: se retiró ese bloque obsoleto, conservando la verificación real de forceRefresh. Los tests ahora exigen exclusión de balances manuales.

No se ejecutó un agente en Antigravity: estas tareas y evidencias están registradas en el repositorio compartido para su revisión allí.
