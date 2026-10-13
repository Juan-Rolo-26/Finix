# Revisión y Validación Técnica de Cálculos · Laboratorio Financiero FINIX

Este documento detalla la revisión exhaustiva, verificación matemática y validación de casos extremos del motor de cálculo financiero de FINIX implementado en [`apps/web/src/lib/laboratory.ts`](file:///home/juampi26/Finix/apps/web/src/lib/laboratory.ts).

Las 8 calculadoras fueron verificadas de acuerdo con los estándares y metodologías de referencia de **Investor.gov (SEC)**, la **Metodología de Tasas de Interés del Banco Central de la República Argentina (BCRA)** y las directrices de amortización del **Consumer Financial Protection Bureau (CFPB)**.

---

## 1. Resumen de Ejecución y Cobertura

- **Archivo del motor:** `apps/web/src/lib/laboratory.ts`
- **Suite de pruebas independiente:** `scripts/laboratorio-calculos.test.cjs`
- **Total de pruebas ejecutadas:** 29 pruebas automatizadas
- **Resultado:** **29/29 aprobadas (100% PASS)**
- **Verificación estática:** `tsc --noEmit` en `apps/web` con **0 errores**.

---

## 2. Metodología y Fórmulas por Calculadora

### 1. Interés Compuesto (`compuesto`)
- **Referencia:** *Investor.gov Compound Interest Calculator (SEC)*.
- **Fórmula de tasa periódica:**
  $$r_{\text{mensual}} = (1 + \text{TEA})^{1/12} - 1$$
- **Dinámica temporal:**
  - **Aporte al cierre (`beginning = 0` / Ordinary Annuity):**
    $$S_n = S_{n-1} \cdot (1 + r) + A$$
  - **Aporte al inicio (`beginning = 1` / Annuity Due):**
    $$S_n = (S_{n-1} + A) \cdot (1 + r)$$
  - **Poder adquisitivo (dinero de hoy):**
    $$\text{Saldo Real}_n = \frac{S_n}{(1 + \pi)^{n/12}}$$
- **Casos límite verificados:**
  - **Tasa 0% e inflación 0%:** Saldo final igual exactamente a la suma de aportes ($10.000 + 200 \times 120 = 34.000$).
  - **Tasa negativa (-5% TEA):** Crecimiento neto inferior a la suma aportada, saldo finito y positivo.
  - **Deflación (-3% anual):** El saldo real es mayor que el saldo nominal debido a la apreciación del poder de compra de la moneda.

---

### 2. Objetivos de Ahorro (`objetivos`)
- **Referencia:** *Investor.gov Savings Goal Calculator*.
- **Fórmula de meta nominal ajustada por inflación:**
  $$\text{Meta Futura} = \text{Meta Hoy} \cdot (1 + \pi)^{\text{años}}$$
- **Aporte mensual requerido:**
  $$A = \max\left(0, \frac{\text{Meta Futura} - C_0 \cdot (1 + r)^n}{\text{Factor de Aportes}}\right)$$
  donde el factor de aportes es el valor futuro de una anualidad unitaria de \$1 durante $n$ meses.
- **Casos límite verificados:**
  - **Tasa 0% e inflación 0%:** Para una meta de \$60.000 en 60 meses con \$0 de capital inicial, el aporte requerido es exactamente de \$1.000/mes.
  - **Capital inicial suficiente:** Si $C_0 \cdot (1 + r)^n \ge \text{Meta Futura}$, el aporte requerido es estrictamente \$0.
  - **Aportes al inicio vs al cierre:** Aportar al inicio reduce la cuota mensual requerida al ganar un mes adicional de reinversión en cada período.

---

### 3. Inflación y Poder Adquisitivo (`inflacion`)
- **Referencia:** *Relación exacta de Fisher (BCRA / Finanzas Cuantitativas)*.
- **Fórmula de Fisher:**
  $$1 + r_{\text{real}} = \frac{1 + r_{\text{nominal}}}{1 + \pi} \implies r_{\text{real}} = \frac{1 + r_{\text{nominal}}}{1 + \pi} - 1$$
- **Casos límite verificados:**
  - **Rendimiento 30% e inflación 35%:** Rendimiento real exacto de $-3.7037\%$ (la aproximación lineal $30 - 35 = -5\%$ falla por no contemplar la erosión compuesta).
  - **Inflación 0%:** Saldo real y saldo nominal idénticos a lo largo de todo el horizonte.
  - **Rendimiento negativo (-10%) e inflación (20%):** Rendimiento real exacto de $-25.0\%$.

---

### 4. Impacto de Costos y Comisiones (`comisiones`)
- **Referencia:** *SEC Investor Bulletin: How Fees and Expenses Affect Your Investment Portfolio*.
- **Fórmula de factor neto:**
  $$\text{Factor Anual Neto} = (1 + r_{\text{bruto}}) \cdot (1 - \text{costo anual})$$
  $$r_{\text{neto mensual}} = \text{Factor Anual Neto}^{1/12} - 1$$
- **Métrica de Costo de Oportunidad:**
  $$\Delta = \text{Saldo Alternativa A} - \text{Saldo Alternativa B}$$
- **Casos límite verificados:**
  - **0.25% vs 1.00% anual a 20 años:** Se constató una diferencia superior a \$10.000 en el patrimonio final por costo de oportunidad reinvertido.
  - **Comisiones 0%:** Ambas alternativas convergen exactamente al saldo bruto sin costos.

---

### 5. Comparador de Escenarios (`escenarios`)
- **Fórmula:** Simulación trifurcada simultánea aplicando $\text{TEA}_{\text{low}}$, $\text{TEA}_{\text{base}}$, $\text{TEA}_{\text{high}}$ a la misma base de capital y aportes.
- **Casos límite verificados:**
  - Escenario adverso negativo (-2%), base moderado (7%) y favorable (12%) conservan estrictamente la relación $\text{Saldo}_{\text{low}} < \text{Saldo}_{\text{base}} < \text{Saldo}_{\text{high}}$.
  - Validación de orden: si el usuario intenta ingresar un escenario adverso mayor al base, el validador emite la advertencia correspondiente.

---

### 6. Conversor de Tasas (`tasas`)
- **Referencia:** *BCRA: Metodología de Tasas de Interés y Regulación de Operaciones de Crédito*.
- **Fórmulas de equivalencia para $m$ capitalizaciones anuales:**
  $$\text{TEA} = \left(1 + \frac{\text{TNA}}{m}\right)^m - 1$$
  $$\text{TNA} = m \cdot \left((1 + \text{TEA})^{1/m} - 1\right)$$
  $$\text{TEM} = (1 + \text{TEA})^{1/12} - 1$$
- **Casos límite verificados:**
  - **TNA 30% con $m=12$:** TEM exacta de $2.5000\%$, TEA exacta de $34.4889\%$.
  - **TEA 40%:** Conversión a TEM ($2.8436\%$) y TNA mensual ($34.1235\%$).
  - **TEM 3%:** Conversión a TNA ($36.0000\%$) y TEA ($42.5761\%$).
  - **Tasa 0%:** Todas las tasas equivalentes son estrictamente 0%.

---

### 7. Simulador de Préstamos (`prestamos`)
- **Referencia:** *CFPB: Loan Amortization Schedule & Regulation Z*.
- **Fórmula de cuota francesa (tasa fija):**
  $$r = \frac{\text{TNA}}{12}$$
  $$\text{Cuota} = \begin{cases} \dfrac{\text{Principal}}{n} & \text{si } r = 0 \\ \dfrac{\text{Principal} \cdot r}{1 - (1 + r)^{-n}} & \text{si } r > 0 \end{cases}$$
- **Ajuste de Cuota Final (CFPB Reconciliation):**
  En el mes $n = \text{meses}$, la amortización de capital se iguala al saldo residual exacto ($\text{Capital}_n = \text{Saldo}_{n-1}$), garantizando que el saldo remanente sea **estrictamente \$0.00**.
- **Casos límite verificados:**
  - **Préstamo de \$100.000 a 24 meses (40% TNA):** Saldo final de la cuota 24 igual a \$0.00; suma acumulada de capital amortizado igual exactamente a \$100.000.
  - **Tasa 0%:** Cuota fija igual a $\text{Principal} / n$, intereses totales iguales a \$0.00.
  - **Préstamo a 1 solo mes:** Cuota única que cancela el capital más el interés mensual devengado, con saldo final en \$0.00.

---

### 8. Punto de Equilibrio (`operacion`)
- **Fórmula de Break-even:**
  $$\text{Desembolso Total} = P_{\text{compra}} \cdot Q \cdot (1 + f_{\text{compra}}) + \text{Costos Fijos}$$
  $$P_{\text{equilibrio}} = \frac{\text{Desembolso Total}}{Q \cdot (1 - f_{\text{venta}})}$$
- **Casos límite verificados:**
  - **Comisiones y costos fijos:** Precio de venta de equilibrio cubre comisiones bidireccionales y costos fijos.
  - **Comisiones 0% y costos fijos 0%:** $P_{\text{equilibrio}} = P_{\text{compra}}$.
  - **Venta al precio de equilibrio exacto:** Resultado neto es estrictamente \$0.00 y rendimiento neto sobre costo es $0.00\%$.

---

## 3. Validación de Entradas Inválidas

El validador [`validate()`](file:///home/juampi26/Finix/apps/web/src/lib/laboratory.ts#L33) asegura la integridad previa a cualquier cálculo:
1. **Rechazo de valores no finitos:** `NaN`, `Infinity` y `-Infinity` son detectados y señalados por campo.
2. **Rechazo de fuera de límites:** Verificación estricta de `min` y `max` para cada variable.
3. **Control de tipos discretos:** Campos con `step: 1` (`years`, `months`, `quantity`, `kind`, `periods`, `beginning`) exigen números enteros (`Number.isInteger`).
4. **Validaciones de negocio contextuales:**
   - Préstamos: Principal estrictamente mayor a 0.
   - Operación: Precio de compra unitario estrictamente mayor a 0.
   - Escenarios: Verificación de orden monótono $\text{low} \le \text{base} \le \text{high}$.

---

## 4. Registro de Pruebas Automatizadas

```bash
$ node scripts/laboratorio-calculos.test.cjs
=== PRUEBAS INDEPENDIENTES DEL LABORATORIO FINANCIERO FINIX ===

1. Interés Compuesto (compuesto):
  ✓ Crecimiento compuesto estándar (10.000 capital, 200/mes, 10a, 7% TEA, 3% infl)
  ✓ Caso tasa cero: 0% anual, 0% inflación
  ✓ Caso tasa negativa (-5% TEA)
  ✓ Aportes al inicio vs al cierre (Annuity Due vs Ordinary Annuity)
  ✓ Deflación (-3% anual): aumento del poder adquisitivo

2. Objetivos de ahorro (objetivos):
  ✓ Cálculo estándar de meta y aporte requerido
  ✓ Caso tasa cero en objetivos (meta 60.000 en 5 años sin capital inicial)
  ✓ Capital inicial ya supera la meta requerida
  ✓ Objetivos con aportes al inicio (beginning = 1)

3. Inflación y poder adquisitivo (inflacion):
  ✓ Ecuación de Fisher exacta (1 + r_real) = (1 + r_nom) / (1 + i)
  ✓ Inflación 0% preserva valor nominal y real idénticos
  ✓ Rendimiento nominal negativo con inflación

4. Impacto de comisiones y costos (comisiones):
  ✓ Erosión por costos anuales (0.25% vs 1.00% en 20 años)
  ✓ Comisiones cero (feeA = 0%, feeB = 0%) igualan al saldo bruto

5. Comparador de escenarios (escenarios):
  ✓ Tres escenarios: adverso (-2%), base (7%), favorable (12%)
  ✓ Validación de orden incorrecto en escenarios

6. Conversor de tasas (tasas - BCRA):
  ✓ BCRA TNA 30% a capitalización mensual (m=12) -> TEA y TEM
  ✓ BCRA TEA 40% a TNA y TEM
  ✓ BCRA TEM 3% mensual a TEA y TNA
  ✓ Tasas con tasa 0%

7. Simulador de préstamos (prestamos - CFPB):
  ✓ Amortización francesa estándar: saldo final exactamente 0
  ✓ Préstamo tasa 0% (sin interés)
  ✓ Préstamo a 1 solo mes

8. Punto de equilibrio (operacion):
  ✓ Cálculo de precio de equilibrio con comisiones y costo fijo
  ✓ Operación vendiendo al precio de equilibrio da resultado 0

9. Validación de entradas inválidas y límites:
  ✓ Rechazo de valores no numéricos, NaN o infinitos
  ✓ Rechazo de valores decimales donde se requiere entero
  ✓ Rechazo de préstamos con capital cero o negativo
  ✓ Calculate arroja error explicativo si se invoca con datos inválidos

======================================================
RESULTADO: 29/29 PRUEBAS EXITOSAS (100% PASS)
======================================================
```
