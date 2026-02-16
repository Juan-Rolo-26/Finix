# Sistema de Portafolios - Finix

## 📋 Resumen de Implementación

Se ha implementado un sistema completo de gestión de portafolios para Finix, incluyendo modelo de datos, lógica de negocio y UI/UX profesional.

---

## 🗄️ Modelo de Datos (Prisma)

### Portfolio
- **id**: UUID único
- **userId**: Relación con User
- **nombre**: Nombre del portafolio
- **descripcion**: Descripción opcional
- **objetivo**: largo plazo | retiro | trading | ahorro
- **monedaBase**: USD | ARS | EUR
- **nivelRiesgo**: bajo | medio | alto
- **modoSocial**: Boolean (visibilidad pública)
- **esPrincipal**: Boolean (portafolio por defecto)
- **assets**: Relación 1:N con Asset
- **movements**: Relación 1:N con Movement

### Asset
- **id**: UUID único
- **portfolioId**: Relación con Portfolio
- **ticker**: Símbolo del activo (ej: AAPL)
- **tipoActivo**: acciones | ETF | bonos | cripto | fondos
- **montoInvertido**: Monto total invertido
- **ppc**: Precio Promedio de Compra
- **cantidad**: Calculada automáticamente (montoInvertido / ppc)
- **precioActual**: Precio actual (opcional/editable)

### Movement
- **id**: UUID único
- **portfolioId**: Relación con Portfolio
- **assetId**: Relación con Asset (opcional)
- **fecha**: Timestamp del movimiento
- **tipoMovimiento**: compra | venta | ajuste
- **ticker**: Símbolo del activo
- **claseActivo**: Tipo de activo
- **cantidad**: Cantidad de unidades
- **precio**: Precio por unidad
- **total**: Monto total de la operación

---

## 🔧 Backend (NestJS)

### Endpoints Implementados

#### Portafolios
- `POST /portfolios` - Crear portafolio
- `GET /portfolios` - Listar portafolios del usuario
- `GET /portfolios/:id` - Obtener portafolio específico
- `PUT /portfolios/:id` - Actualizar portafolio
- `DELETE /portfolios/:id` - Eliminar portafolio

#### Activos
- `POST /portfolios/:id/assets` - Agregar activo
- `GET /portfolios/:id/assets` - Listar activos del portafolio
- `PUT /portfolios/assets/:assetId` - Actualizar activo
- `DELETE /portfolios/assets/:assetId` - Eliminar activo

#### Movimientos
- `GET /portfolios/:id/movements` - Listar movimientos (con filtros)

#### Métricas
- `GET /portfolios/:id/metrics` - Obtener métricas calculadas

### Lógica de Negocio Clave

1. **Cálculo Automático de Cantidad**
   ```typescript
   cantidad = montoInvertido / ppc
   ```

2. **Generación Automática de Movimientos**
   - Cada compra de activo genera un movimiento de tipo "compra"
   - Se registra: ticker, cantidad, precio, total

3. **Gestión de Portafolio Principal**
   - Solo un portafolio puede ser principal a la vez
   - Al marcar uno como principal, se desmarcan los demás automáticamente

4. **Métricas Calculadas**
   - Capital Total: Suma de montos invertidos
   - Valor Actual: Suma de (cantidad × precioActual)
   - Ganancia/Pérdida: Valor Actual - Capital Total
   - Variación %: (Ganancia / Capital Total) × 100
   - Diversificación por clase de activo
   - Diversificación por activo individual

---

## 🎨 Frontend (React + TypeScript)

### Componentes Principales

#### 1. Vista de Portafolios
- Selector de portafolios (tabs horizontales)
- Indicador de portafolio principal
- Botón de creación de portafolio

#### 2. Métricas Dashboard
4 cards principales:
- **Capital Total**: Monto invertido total
- **Valor Actual**: Valor de mercado actual
- **Ganancia/Pérdida**: Con color (verde/rojo) y %
- **Cantidad de Activos**: Número total

#### 3. Tabs de Navegación
- **Activos**: Tabla completa con gestión
- **Movimientos**: Historial cronológico
- **Diversificación**: Gráficos de distribución
- **Avanzado**: Placeholders para features futuras

### Formularios

#### Crear Portafolio
- Nombre (requerido)
- Descripción
- Objetivo (select)
- Moneda Base (select)
- Nivel de Riesgo (select)
- Modo Social (toggle)
- Portafolio Principal (toggle)

#### Agregar Activo
- Ticker (requerido)
- Tipo de Activo (select)
- Monto Invertido (requerido)
- PPC (requerido)
- Precio Actual (opcional)
- **Preview**: Muestra cantidad calculada en tiempo real

### Tabla de Activos
Columnas:
- Ticker
- Tipo (badge)
- Cantidad (4 decimales)
- Monto Invertido
- PPC
- Precio Actual
- Variación % (color dinámico)
- Ganancia (color dinámico)
- Acciones (eliminar)

### Tabla de Movimientos
Columnas:
- Fecha
- Tipo (badge con color)
- Activo
- Clase
- Cantidad
- Precio
- Total

Filtros disponibles:
- Tipo de movimiento
- Ticker
- Rango de fechas

### Diversificación
Dos secciones:
1. **Por Clase de Activo**: Barras de progreso con %
2. **Por Activo Individual**: Top 5 activos con %

---

## 🚀 Features Avanzadas (Placeholders)

Estructura preparada para:
- ⚖️ **Rebalanceo Automático**: Mantener proporciones objetivo
- 🔔 **Alertas de Precio**: Notificaciones personalizadas
- 📤 **Exportación de Datos**: CSV, Excel, PDF
- 🎯 **Objetivos de Inversión**: Tracking de metas financieras

Estas features tienen:
- UI diseñada (cards con estado disabled)
- Estructura de datos preparada
- Endpoints placeholder en el backend

---

## 📊 Cálculos y Validaciones

### Validaciones Backend
- PPC debe ser > 0
- Monto invertido debe ser > 0
- Verificación de ownership (usuario-portafolio)
- Cascade delete (eliminar portafolio elimina assets y movements)

### Cálculos Frontend
```typescript
// Valor actual de un activo
valorActual = cantidad × (precioActual || ppc)

// Ganancia de un activo
ganancia = valorActual - montoInvertido

// Variación porcentual
variacion = (ganancia / montoInvertido) × 100

// Porcentaje de diversificación
porcentaje = (valorActivo / valorTotalPortafolio) × 100
```

---

## 🔄 Flujos de Usuario

### 1. Crear Portafolio
1. Click en "Crear Portafolio"
2. Llenar formulario
3. Submit → Portafolio creado y seleccionado automáticamente

### 2. Agregar Activo
1. Seleccionar portafolio
2. Click en "Agregar Activo"
3. Ingresar ticker, tipo, monto y PPC
4. Ver cantidad calculada en preview
5. Submit → Activo agregado + Movimiento generado + Métricas actualizadas

### 3. Ver Diversificación
1. Seleccionar portafolio
2. Tab "Diversificación"
3. Ver distribución por clase y por activo

### 4. Historial de Movimientos
1. Seleccionar portafolio
2. Tab "Movimientos"
3. Aplicar filtros (opcional)
4. Ver historial completo

---

## 🎯 Criterios de Calidad Cumplidos

✅ **Código modular y escalable**
- Separación clara: Backend (NestJS) / Frontend (React)
- DTOs para validación
- Servicios reutilizables

✅ **Separación UI/Lógica/Datos**
- Prisma para datos
- Services para lógica
- Components para UI

✅ **UX simple y clara**
- Formularios intuitivos
- Feedback visual inmediato
- Colores semánticos (verde/rojo para ganancias/pérdidas)

✅ **Sin métricas falsas**
- Todos los cálculos basados en datos reales
- Cantidad calculada automáticamente
- Precios actuales opcionales

✅ **Preparado para modo social**
- Campo `modoSocial` en Portfolio
- Estructura lista para compartir portafolios

---

## 📦 Archivos Creados/Modificados

### Backend
- `apps/api/prisma/schema.prisma` - Modelos de datos
- `apps/api/src/portfolio/portfolio.module.ts` - Módulo NestJS
- `apps/api/src/portfolio/portfolio.controller.ts` - Endpoints REST
- `apps/api/src/portfolio/portfolio.service.ts` - Lógica de negocio
- `apps/api/src/portfolio/dto/portfolio.dto.ts` - DTOs
- `apps/api/src/app.module.ts` - Importación del módulo

### Frontend
- `apps/web/src/pages/Portfolio.tsx` - UI completa

### Base de Datos
- Migración generada: `20260129051430_add_portfolio_system`

---

## 🚀 Próximos Pasos Sugeridos

1. **Integración con datos reales de mercado**
   - Conectar con API de precios (Alpha Vantage, Yahoo Finance)
   - Actualización automática de `precioActual`

2. **Gráficos visuales**
   - Implementar Chart.js o Recharts
   - Gráfico de performance histórica
   - Gráfico circular de diversificación

3. **Autenticación real**
   - Reemplazar `mock-user-id` con JWT
   - Guards en endpoints

4. **Features avanzadas**
   - Implementar rebalanceo automático
   - Sistema de alertas con WebSockets
   - Exportación de reportes

5. **Modo social**
   - Feed de portafolios públicos
   - Seguir portafolios de otros usuarios
   - Comentarios y likes

---

## 📝 Notas Técnicas

- **Base de datos**: SQLite (desarrollo) - Migrar a PostgreSQL en producción
- **Validación**: Implementar class-validator en DTOs para producción
- **Autenticación**: Actualmente usa mock user ID - Integrar con sistema auth existente
- **CORS**: Configurado para desarrollo (localhost:5173)
- **Cascade Delete**: Implementado para mantener integridad referencial

---

## ✅ Checklist de Implementación

- [x] Modelo de datos completo
- [x] Endpoints REST funcionales
- [x] Lógica de cálculo automático de cantidad
- [x] Generación automática de movimientos
- [x] UI de gestión de portafolios
- [x] UI de gestión de activos
- [x] Visualización de métricas
- [x] Historial de movimientos
- [x] Análisis de diversificación
- [x] Placeholders para features avanzadas
- [x] Validaciones de negocio
- [x] Formateo de moneda y porcentajes
- [x] Estados vacíos (empty states)
- [x] Confirmaciones de eliminación

---

**Sistema listo para usar y escalar** 🚀
