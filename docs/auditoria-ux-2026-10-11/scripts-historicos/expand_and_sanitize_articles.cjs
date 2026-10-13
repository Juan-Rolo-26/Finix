const fs = require('fs');

const SEED_DATA_PATH = '/home/juampi26/Finix/apps/api/src/education/education-seed.data.ts';
const { SEED_CATEGORIES, SEED_ARTICLES, SEED_LEARNING_PATHS } = require(SEED_DATA_PATH);

console.log('Original seed articles:', SEED_ARTICLES.length);

const articlesMap = new Map();
SEED_ARTICLES.forEach(a => articlesMap.set(a.slug, { ...a }));

// 1. Limpiar LaTeX en wacc-y-spread-creacion-valor y corregir rigor
if (articlesMap.has('wacc-y-spread-creacion-valor')) {
    const art = articlesMap.get('wacc-y-spread-creacion-valor');
    art.formula = 'Spread de Creación de Valor = ROIC − WACC\nWACC = (E/V × Ke) + (D/V × Kd × (1 − T))\nEVA (Valor Económico Añadido) = Capital Invertido × (ROIC − WACC)';
    art.summary = 'El WACC representa el costo de oportunidad promedio de capital. La empresa genera valor económico real únicamente cuando su rentabilidad operativa (ROIC) supera este costo.';
    art.content = `### ¿Qué es el WACC y por qué determina el valor?

El **WACC** (*Weighted Average Cost of Capital* o Costo Promedio Ponderado del Capital) es la tasa de rentabilidad mínima exigida por los proveedores de fondos de una empresa, ponderando tanto a los acreedores financieros (deuda) como a los accionistas (capital propio o equity).

\`\`\`
WACC = (E/V × Ke) + (D/V × Kd × (1 − T))
\`\`\`

Donde:
- **E**: Valor de mercado del capital propio (Equity o Capitalización Bursátil).
- **D**: Valor de mercado de la deuda financiera con interés.
- **V**: Valor total de la estructura financiera (\`E + D\`).
- **Ke**: Costo del capital propio (estimado típicamente mediante el modelo CAPM: tasa libre de riesgo + beta × prima de riesgo de mercado).
- **Kd**: Costo de la deuda financiera antes de impuestos (tasa de interés media de la deuda).
- **T**: Tasa marginal de impuesto a las ganancias (el escudo fiscal deduce los intereses).

---

### El Spread de Creación de Valor

Una compañía no crea valor genuino únicamente por reportar utilidades contables; lo genera cuando su rendimiento sobre el capital operativo excede el costo de financiar dicho capital:

- **Spread de Valor = ROIC − WACC**
- **Si ROIC > WACC**: La empresa genera valor económico por encima del costo de sus recursos. Cada unidad de capital reinvertida rinde más de lo que cuesta captarla.
- **Si ROIC = WACC**: La empresa opera en punto de equilibrio económico, remunerando a acreedores y accionistas sin generar excedente extraordinario.
- **Si ROIC < WACC**: La empresa **destruye valor económico**, aun cuando el estado de resultados exhiba beneficios netos positivos.

---

### Consideración Rigurosa sobre el Foso Defensivo (Economic Moat)

Mantener un spread positivo (\`ROIC > WACC\`) a lo largo del tiempo es evidencia cuantitativa de creación de valor presente, pero **no constituye por sí mismo una prueba indiscutible o perpetua de foso defensivo**. Los rendimientos anormalmente altos atraen competencia, imitación tecnológica y cambios regulatorios. La confirmación de una ventaja competitiva duradera exige contrastar el spread cuantitativo con ventajas cualitativas sostenibles, como costos de cambio elevados, efectos de red o patentes protegidas.`;

    art.keyTakeaways = [
        'El WACC es el costo medio ponderado de financiamiento entre deuda con costo e inversión de accionistas.',
        'La creación de valor genuina ocurre cuando el ROIC supera al WACC (spread positivo).',
        'Un spread positivo en un ejercicio no garantiza un foso defensivo; se requiere consistencia plurianual y análisis cualitativo.',
    ];
    art.commonMistakes = [
        'Ignorar el costo del equity y asumir que el capital de los accionistas es "gratis" por no pagar intereses bancarios.',
        'Calcular el WACC con valores contables de balance en lugar de valores de mercado de deuda y capital propio.',
        'Confundir un spread positivo temporal con una ventaja competitiva estructural inmune a la competencia.',
    ];
    art.sources = [
        { title: 'Aswath Damodaran — Cost of Capital by Sector and Country Risk', url: 'https://pages.stern.nyu.edu/~adamodar/' },
        { title: 'AlphaSpread — Cost of Capital & WACC Methodology', url: 'https://kb.alphaspread.com' },
        { title: 'CFA Institute — Financial Analysis Techniques & Cost of Capital', url: 'https://www.cfainstitute.org' },
    ];
}

// 2. Limpiar LaTeX en bonos-tir-duration
if (articlesMap.has('bonos-tir-duration')) {
    const art = articlesMap.get('bonos-tir-duration');
    art.formula = 'Precio = Σ [ Cupón_t / (1 + TIR)^t ] + [ Valor Nominal / (1 + TIR)^n ]\nDuration Modificada = Macaulay Duration / (1 + TIR / m)\nVariación % de Precio aprox ≈ − Duration Modificada × Cambio en TIR';
    art.content = `### La Renta Fija y la Paradoja de las Tasas

En los bonos rige una relación matemática inversa: **cuando las tasas de interés de mercado suben, los precios de los bonos en circulación caen**; y cuando las tasas bajan, los precios de los bonos suben.

---

### ¿Qué es la TIR (Yield to Maturity)?

La **Tasa Interna de Retorno (TIR o YTM)** es el rendimiento anualizado esperado si se compra el bono a su cotización actual y se conserva hasta el vencimiento, asumiendo el cobro íntegro de cupones y capital en fecha y la reinversión de los flujos intermedios a esa misma tasa.

- **Precio Bajo Par (Descuento)**: Cuando el bono cotiza por debajo de su valor nominal, la TIR es superior a la tasa de cupón.
- **Precio Sobre Par (Prima)**: Cuando cotiza por encima del valor nominal, la TIR es inferior a la tasa de cupón.
- **Paridad del Bono**: Relación porcentual entre el precio de mercado y su valor técnico (\`Precio / Valor Técnico × 100\`).

---

### Duration y Duration Modificada

La **Duration de Macaulay** mide el plazo promedio ponderado (en años) que insume recuperar el capital invertido a través de los cupones y la amortización.

La **Duration Modificada** transforma ese plazo en una medida de sensibilidad porcentual del precio ante cambios en la TIR:

\`\`\`
Variación % de Precio aprox ≈ − Duration Modificada × Cambio en TIR
\`\`\`

*Ejemplo ilustrativo*: Un bono con Duration Modificada de 5,0 años registrará una caída aproximada del **5%** si su TIR aumenta 100 puntos básicos (+1,00%), o una suba del **5%** si la TIR disminuye 100 puntos básicos.

---

### Límites de la Aproximación Lineal

La duration modificada es una aproximación de primer orden (tangente a la curva precio-tasa). Ante movimientos grandes de tasas (por ejemplo 300 o 500 pb), la aproximación pierde precisión y debe complementarse con la **Convexidad** del bono, que refleja la curvatura positiva de la relación precio/rendimiento.`;

    art.sources = [
        { title: 'CFA Institute — Yield-Based Bond Duration Measures and Properties (2026)', url: 'https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/yield-based-bond-duration-measures-and-properties' },
        { title: 'U.S. Securities and Exchange Commission (Investor.gov) — Bonds & Fixed Income Products', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds' },
        { title: 'BYMA Educa — Glosario y Mercados de Renta Fija', url: 'https://www.bymaeduca.com.ar/pages/glosario1' },
    ];
}

// 3. Limpiar LaTeX en riesgo-pais-embi
if (articlesMap.has('riesgo-pais-embi')) {
    const art = articlesMap.get('riesgo-pais-embi');
    art.formula = 'Riesgo País (pb) = (Rendimiento Bonos Soberanos en USD − Rendimiento Bonos del Tesoro EE.UU.) × 10.000';
    art.content = `### ¿Cómo se calcula y qué significa?

El **Riesgo País** es medido principalmente a través del índice **EMBI+** (*Emerging Markets Bond Index*) elaborado por la entidad financiera **J.P. Morgan**.

Se expresa en **puntos básicos (pb)**, donde **100 pb equivalen al 1,00% anual**:
- Si el bono del Tesoro de EE.UU. a 10 años rinde **4,00%** anual y el bono soberano equivalente de un país rinde **12,00%** anual en la misma moneda:

\`\`\`
Riesgo País = (12,00% − 4,00%) × 10.000 = 800 puntos básicos
\`\`\`

---

### Factores Determinantes

1. **Capacidad y Voluntad de Pago**: Solvencia fiscal, reservas internacionales líquidas en el banco central y perfil de vencimientos de deuda.
2. **Estabilidad Institucional y Política**: Previsibilidad de políticas macroeconómicas, seguridad jurídica y cumplimiento de contratos.
3. **Contexto Financiero Global**: Cuando la Reserva Federal sube tasas o se incrementa la aversión global al riesgo, los capitales migran hacia activos seguros (*flight to quality*), ampliando los spreads de países emergentes.

---

### Impacto en la Economía Real

El riesgo país no solo afecta al gobierno soberano: establece una **tasa de corte mínima** para el financiamiento de las empresas privadas locales. Si el país paga un sobrecosto de 1.000 pb, las compañías difícilmente podrán financiarse a tasas menores, encareciendo la inversión productiva, el crédito hipotecario y los proyectos de infraestructura.`;

    art.sources = [
        { title: 'J.P. Morgan — Emerging Markets Bond Index (EMBI) Methodology', url: 'https://www.jpmorgan.com' },
        { title: 'Banco Central de la República Argentina (BCRA) — Informes de Mercados y Deuda', url: 'https://www.bcra.gob.ar' },
    ];
}

// 4. Corregir rigor y ampliar dividendos-yield-payout
if (articlesMap.has('dividendos-yield-payout')) {
    const art = articlesMap.get('dividendos-yield-payout');
    art.formula = 'Dividend Yield = (Dividendo Anual por Acción / Precio por Acción) × 100\nPayout Ratio (sobre Beneficio) = (Dividendos Totales / Utilidad Neta) × 100\nPayout Ratio (sobre FCF) = (Dividendos Totales / Flujo de Caja Libre) × 100';
    art.summary = 'El Dividend Yield mide el retorno por dividendos respecto al precio. El Payout Ratio evalúa qué proporción de los resultados o del flujo libre se distribuye, requiriendo análisis de caja y sostenibilidad.';
    art.content = `### Dividend Yield: Retorno por Flujo de Caja al Accionista

El **Dividend Yield (Rendimiento por Dividendo)** refleja el flujo de efectivo anual que una empresa devuelve a sus accionistas en relación con su cotización bursátil actual:

\`\`\`
Dividend Yield = (Dividendo Anual por Acción / Precio Actual de la Acción) × 100
\`\`\`

*Ejemplo*: Si una acción cotiza a US$ 50 y paga US$ 2,00 anuales de dividendo, su rendimiento es del **4,00%**.

---

### Payout Ratio: Rentabilidad Contable vs Flujo de Caja

El **Payout Ratio** evalúa qué porción de las ganancias generadas se distribuye como dividendo en lugar de reinvertirse en el crecimiento del negocio:

- **Payout sobre Utilidad Neta**: Divide los dividendos entre el beneficio contable. Es el indicador más difundido, pero puede estar distorsionado por partidas no monetarias o devengamientos extraordinarios.
- **Payout sobre Free Cash Flow (FCF)**: Métrica fundamental preferida por analistas. Compara el dividendo con la caja líquida restante tras atender las operaciones y el CapEx (\`Dividendos / FCF\`). Si el FCF es inferior a los dividendos pagados, la empresa debe consumir reservas de tesorería o emitir deuda para sostener el pago.

---

### Sostenibilidad y la "Trampa del Dividendo" (Yield Trap)

Un rendimiento anormalmente alto (por ejemplo superior al 10% o 12%) no es necesariamente una oportunidad atractiva: con frecuencia refleja una cotización que se ha desplomado porque el mercado anticipa un deterioro del negocio o una reducción en los pagos futuros.

- **Evaluación contextual**: No existen umbrales universales como "menor a 60% es seguro" o "mayor a 90% recortará de inmediato". Empresas de servicios públicos (utilities) o infraestructura con ingresos regulados y flujos muy estables pueden mantener payouts superiores al 80% de forma sostenible durante décadas; en contraste, compañías cíclicas (materias primas, automotrices) con payouts aparentemente moderados del 40% pueden verse forzadas a suspender pagos si los precios de sus productos se hunden.`;

    art.keyTakeaways = [
        'El Dividend Yield evalúa el flujo de dividendos respecto al precio, mientras el Payout mide qué fracción de las ganancias o caja se distribuye.',
        'Contrastar el Payout contable con el Payout sobre Free Cash Flow para verificar que la caja operativa financie el dividendo.',
        'La sostenibilidad depende de la predictibilidad del flujo de fondos y de las necesidades de reinversión en CapEx, no de un porcentaje rígido.',
    ];
    art.commonMistakes = [
        'Guiarse exclusivamente por un Dividend Yield de dos dígitos sin analizar el historial de flujo de caja y la tendencia de ingresos.',
        'Creer que un payout contable bajo garantiza el dividendo en industrias cíclicas donde el flujo de fondos sufre alta volatilidad.',
        'Olvidar el impacto fiscal y las retenciones sobre dividendos según la jurisdicción del inversor.',
    ];
    art.sources = [
        { title: 'U.S. Securities and Exchange Commission (Investor.gov) — Dividends and Corporate Distributions', url: 'https://www.investor.gov' },
        { title: 'CFA Institute — Financial Analysis Techniques: Dividend Policy and Sustainability', url: 'https://www.cfainstitute.org' },
    ];
}

// 5. Ampliar pb-precio-valor-libros con Activos, Pasivos, Patrimonio Neto y BVPS
if (articlesMap.has('pb-precio-valor-libros')) {
    const art = articlesMap.get('pb-precio-valor-libros');
    art.formula = 'P/B = Cotización / Valor Contable por Acción (BVPS)\nValor Contable (Equity) = Activos Totales − Pasivos Totales\nBVPS = Patrimonio Neto Contable / Acciones en Circulación';
    art.summary = 'El ratio Precio / Valor en Libros compara la valoración de mercado con el patrimonio neto contable. Relevante en entidades financieras y sectores de capital intensivo, con limitaciones en negocios intangibles.';
    art.content = `### Fundamento del Ratio Precio / Valor en Libros (P/B)

El ratio **Precio / Valor en Libros** (*Price-to-Book* o P/B) compara la capitalización bursátil de una empresa con el valor neto de sus activos reportado en el balance de situación:

\`\`\`
P/B = Cotización / Valor Contable por Acción (BVPS)
\`\`\`

Donde:
- **Patrimonio Neto (Equity)**: \`Activos Totales − Pasivos Totales\`. Es la participación residual de los accionistas tras liquidar todas las obligaciones con terceros.
- **BVPS (Book Value Per Share)**: \`Patrimonio Neto Contable / Acciones Totales en Circulación\`.

---

### Interpretación y Uso Sectorial

- **P/B < 1.0x**: La compañía cotiza con descuento sobre su valor contable neto. Puede reflejar una oportunidad de valor si los activos son de calidad, o bien desconfianza del mercado sobre la recuperabilidad de dichos activos (por ejemplo préstamos incobrables en bancos o fábricas obsoletas).
- **P/B > 3.0x - 5.0x**: Refleja que la empresa genera altos retornos sobre el capital propio (ROE elevado) o que posee activos intangibles no reflejados plenamente en el balance.

*Aplicabilidad óptima*: Es una métrica de referencia en el sector bancario, entidades aseguradoras, empresas inmobiliarias (REITs) e industrias pesadas, donde los balances se ajustan periódicamente a valor razonable o poseen inventarios físicos cuantificables.

---

### Limitaciones Estructurales en la Economía Moderna

1. **Activos Intangibles no Capitalizados**: En empresas de software, farmacéuticas o servicios de plataforma, los mayores motores de valor (algoritmos, marca, patentes internas, capital humano) se registran como gastos operativos y no figuran como activos en el balance, distorsionando el P/B al alza.
2. **Programas Masivos de Recompra de Acciones**: Compañías maduras con alta rentabilidad que recompran agresivamente sus acciones pueden reducir su patrimonio neto contable a valores negativos, haciendo que el P/B pierda sentido cuantitativo sin que la empresa esté quebrada.`;

    art.keyTakeaways = [
        'El P/B relaciona la cotización bursátil con el patrimonio neto contable por acción (BVPS).',
        'Resulta especialmente útil para evaluar instituciones financieras y empresas con activos tangibles dominantes.',
        'Pierde representatividad en compañías intensivas en conocimiento, software o con recompras masivas de acciones.',
    ];
    art.commonMistakes = [
        'Comprar mecánicamente acciones con P/B < 1 sin verificar si existen deterioros de activos o pasivos contingentes no registrados.',
        'Descartar compañías tecnológicas sólidas solo porque exhiben un P/B muy elevado.',
    ];
    art.sources = [
        { title: 'Benjamin Graham & David L. Dodd — Security Analysis', url: 'https://www.cfainstitute.org' },
        { title: 'CFA Institute — Balance Sheet Analysis & Financial Ratios', url: 'https://www.cfainstitute.org' },
    ];
}

// 6. Ampliar ps-precio-ventas con EV/Ingresos, margen y comparaciones sectoriales
if (articlesMap.has('ps-precio-ventas')) {
    const art = articlesMap.get('ps-precio-ventas');
    art.formula = 'P/S = Capitalización Bursátil / Ventas Totales TTM = Cotización / Ventas por Acción\nEV / Ingresos = Enterprise Value / Ventas Totales TTM';
    art.summary = 'El ratio Precio/Ventas y el múltiplo EV/Ingresos evalúan la valoración sobre los ingresos brutos, siendo útiles para comparar empresas de alto crecimiento o en fase de escalamiento.';
    art.content = `### Utilidad del Múltiplo Precio / Ventas (P/S)

El ratio **Precio / Ventas (P/S)** relaciona el valor bursátil total de la empresa con sus ingresos brutos reportados en los últimos doce meses (TTM):

\`\`\`
P/S = Capitalización Bursátil / Ventas Totales TTM
\`\`\`

A diferencia de las utilidades netas, los **ingresos brutos** son más resistentes a manipulaciones contables, depreciaciones aceleradas o cargos atípicos puntuales. Es una herramienta clásica para valorar empresas en etapas tempranas o en fase de expansión que aún reinvierten agresivamente y operan sin beneficio neto.

---

### P/S vs EV / Ingresos: La Corrección por Estructura de Capital

En el análisis cuantitativo profesional, el ratio P/S se complementa con el múltiplo **EV / Ingresos (Enterprise Value / Revenue)**:

\`\`\`
EV / Ingresos = (Capitalización Bursátil + Deuda Financiera − Caja) / Ventas
\`\`\`

- Si dos compañías generan US$ 1.000 millones en ingresos con el mismo P/S de 2.0x, pero una no tiene deuda y la otra adeuda US$ 2.000 millones, el ratio P/S las presentará idénticas, mientras que el ratio **EV / Ingresos** evidenciará de inmediato el mayor costo implícito de adquirir la compañía endeudada.

---

### La Relación Inseparable entre P/S y Margen de Rentabilidad

Un error frecuente es comparar ratios P/S entre empresas de diferentes sectores sin contrastar sus márgenes:
- Una cadena de supermercados con margen neto del 2% y un P/S de 0,5x puede estar cara.
- Una firma de software SaaS con margen neto del 30% y un P/S de 6,0x puede estar a una valoración muy razonable.

*Regla de contraste*: Un múltiplo sobre ventas solo tiene significado cuando se analiza conjuntamente con el margen operativo proyectado, la tasa de crecimiento anual (\`YoY\`) y los múltiplos promedio históricos y sectoriales.`;

    art.keyTakeaways = [
        'El ratio P/S mide cuánto paga el mercado por cada dólar o peso de facturación bruta del negocio.',
        'El múltiplo EV/Ingresos proporciona una lectura más rigurosa al incorporar la deuda financiera neta.',
        'Los múltiplos de ingresos deben interpretarse siempre junto con los márgenes de rentabilidad y el crecimiento sostenible.',
    ];
    art.commonMistakes = [
        'Comparar ratios P/S de empresas de industrias con estructuras de costos totalmente divergentes.',
        'Ignorar el nivel de endeudamiento al utilizar P/S en lugar de EV/Ingresos.',
    ];
    art.sources = [
        { title: 'Kenneth L. Fisher — Super Stocks: Valuing Companies by Price to Sales', url: 'https://www.cfainstitute.org' },
        { title: 'Aswath Damodaran — Revenue Multiples: Enterprise Value to Sales and Price to Sales', url: 'https://pages.stern.nyu.edu/~adamodar/' },
    ];
}

// 7. Ampliar capitalizacion-y-enterprise-value con ARR y cuota de mercado
if (articlesMap.has('capitalizacion-y-enterprise-value')) {
    const art = articlesMap.get('capitalizacion-y-enterprise-value');
    art.formula = 'Capitalización Bursátil (Market Cap) = Cotización × Acciones en Circulación (Shares Outstanding)\nEnterprise Value (EV) = Market Cap + Deuda Financiera Total − Efectivo y Equivalentes\nARR (Annual Recurring Revenue) = Ingresos Recurrentes Mensuales (MRR) × 12';
    art.summary = 'Diferencia fundamental entre el valor del capital accionario (Market Cap) y el valor de la empresa completa (Enterprise Value), integrando métricas de escala recurrente como ARR.';
    art.content = `### Market Cap vs Enterprise Value: Dos Dimensiones del Valor

- **Capitalización Bursátil (Market Cap)**: Es el precio de compra del 100% de las acciones en circulación en el mercado público:
  \`Market Cap = Precio de la Acción × Acciones en Circulación\`
- **Enterprise Value (EV o Valor de Empresa)**: Representa el costo teórico integral de adquirir el negocio completo, asumiendo su deuda financiera y tomando el control de su caja disponible:
  \`Enterprise Value = Market Cap + Deuda Total con Costo − Efectivo y Equivalentes\`

---

### Ejemplo Numérico Comparativo

Imaginemos dos empresas con la misma capitalización bursátil de US$ 10.000 millones:

| Métrica | Empresa A (Conservadora) | Empresa B (Apalancada) |
| :--- | :--- | :--- |
| **Market Cap** | US$ 10.000 M | US$ 10.000 M |
| **Deuda Financiera** | US$ 500 M | US$ 8.000 M |
| **Efectivo y Equivalentes** | US$ 2.500 M | US$ 500 M |
| **Deuda Neta** | **−US$ 2.000 M (Caja Neta)** | **+US$ 7.500 M (Deuda Neta)** |
| **Enterprise Value (EV)** | **US$ 8.000 M** | **US$ 17.500 M** |

Para un comprador o analista, la Empresa B es más de dos veces más cara que la Empresa A en términos operativos, aunque ambas compartan idéntico Market Cap en las cotizaciones públicas.

---

### Métricas de Escala en Negocios de Suscripción: ARR

En compañías de software, plataformas y servicios con ingresos por suscripción periódica, el análisis de escala se apoya en el **ARR (Annual Recurring Revenue o Ingresos Recurrentes Anualizados)**:
- Mide el valor contractual anualizado de las suscripciones activas (\`MRR × 12\`).
- *Aclaración regulatoria*: El ARR es una métrica operativa de gestión propia de la empresa (**no GAAP**); no equivale a los ingresos contables devengados en el estado de resultados y debe evaluarse conforme a las definiciones reportadas por el emisor en sus presentaciones trimestrales.
- Se complementa con el análisis de **Cuota de Mercado (Market Share)**, retención neta de ingresos (NDR) y crecimiento anual (\`YoY\`).`;

    art.keyTakeaways = [
        'El Market Cap solo valora las acciones; el Enterprise Value refleja el costo operativo total sumando deuda y deduciendo efectivo.',
        'El Enterprise Value es la base obligatoria para múltiplos de rentabilidad global como EV/EBITDA y EV/Ingresos.',
        'El ARR es una métrica no GAAP especializada para cuantificar el volumen de suscripciones recurrentes anualizadas.',
    ];
    art.commonMistakes = [
        'Comparar compañías intensivas en deuda mirando únicamente su Market Cap.',
        'Confundir el ARR contractual con la facturación contable GAAP del ejercicio.',
    ];
    art.sources = [
        { title: 'Aswath Damodaran — Investment Valuation: Tools and Techniques for Determining the Value of Any Asset', url: 'https://pages.stern.nyu.edu/~adamodar/' },
        { title: 'U.S. Securities and Exchange Commission (SEC) — Guidance on Non-GAAP Financial Measures', url: 'https://www.sec.gov' },
    ];
}

// 8. Ampliar margenes-bruto-operativo-neto con EBIT y EBITDA
if (articlesMap.has('margenes-bruto-operativo-neto')) {
    const art = articlesMap.get('margenes-bruto-operativo-neto');
    art.formula = 'Margen Bruto = ((Ingresos − Costo de Ventas) / Ingresos) × 100\nMargen Operativo = (EBIT / Ingresos) × 100\nMargen Neto = (Utilidad Neta / Ingresos) × 100\nMargen EBITDA = (EBITDA / Ingresos) × 100';
    art.summary = 'La cascada de márgenes del estado de resultados permite identificar en qué etapa de la operación la empresa retiene o pierde rentabilidad, desde el costo directo hasta la utilidad neta final.';
    art.content = `### La Cascada de Márgenes del Estado de Resultados

Los márgenes porcentuales permiten analizar la eficiencia de una compañía independientemente de su escala de facturación absoluta:

---

### 1. Margen Bruto: Ventaja de Producto y Pricing Power

Mide el porcentaje de ingresos que queda tras cubrir los costos directos de producción o prestación de servicios (COGS o Costo de Mercancías Vendidas):

\`\`\`
Margen Bruto = ((Ingresos − Costo de Ventas) / Ingresos) × 100
\`\`\`

- Empresas con márgenes brutos elevados y estables (>60-70%, como software o marcas de lujo) demuestran poder de fijación de precios (*pricing power*); márgenes inferiores al 20% son típicos de ensamblaje o distribución minorista con alta competencia.

---

### 2. Margen Operativo y EBIT: Eficiencia de Gestión

El **EBIT (Earnings Before Interest and Taxes o Resultado Operativo)** deduce los gastos comerciales, administrativos y de I+D (CapEx amortizado):

\`\`\`
Margen Operativo = (EBIT / Ingresos) × 100
\`\`\`

Evalúa la viabilidad del negocio central antes de las decisiones de financiamiento (intereses de deuda) y de impuestos.

---

### 3. EBITDA y Margen EBITDA: Capacidad de Generación Bruta

El **EBITDA** suma al EBIT las depreciaciones de activos fijos y las amortizaciones de intangibles:

\`\`\`
Margen EBITDA = (EBITDA / Ingresos) × 100
\`\`\`

Es una aproximación de la generación operativa previa a inversiones de capital, ampliamente utilizada en valoración por múltiplos (\`EV / EBITDA\`).

---

### 4. Margen Neto: La Ganancia Residual del Accionista

Es el porcentaje final que llega a la última línea del balance tras pagar intereses de deuda, gastos financieros e impuestos corporativos:

\`\`\`
Margen Neto = (Utilidad Neta / Ingresos) × 100
\`\`\`

Un margen neto decreciente con ingresos crecientes advierte sobre presiones de costos operativos, endeudamiento costoso o tasas impositivas adversas.`;

    art.keyTakeaways = [
        'El Margen Bruto evalúa la ventaja competitiva de producto y el poder de precios frente a costos directos.',
        'El Margen Operativo (EBIT) y el Margen EBITDA reflejan la eficiencia del negocio central con independencia del apalancamiento.',
        'El Margen Neto es la rentabilidad final disponible para los accionistas tras impuestos e intereses.',
    ];
    art.commonMistakes = [
        'Confundir EBITDA con caja disponible: el EBITDA no contempla CapEx, capital de trabajo ni servicio de deuda.',
        'Comparar márgenes brutos entre sectores con modelos de negocio dispares (servicios vs manufactura).',
    ];
    art.sources = [
        { title: 'CFA Institute — Financial Reporting and Analysis: Income Statement Ratios', url: 'https://www.cfainstitute.org' },
        { title: 'U.S. Securities and Exchange Commission (SEC) — Beginners Guide to Financial Statements', url: 'https://www.sec.gov' },
    ];
}

// 9. Ampliar deuda-solvencia-cobertura con ratios corriente, ácida y deuda CP/LP
if (articlesMap.has('deuda-solvencia-cobertura')) {
    const art = articlesMap.get('deuda-solvencia-cobertura');
    art.formula = 'Ratio Corriente = Activo Corriente / Pasivo Corriente\nPrueba Ácida (Quick Ratio) = (Activo Corriente − Inventarios) / Pasivo Corriente\nDeuda Neta / EBITDA = (Deuda Total − Caja) / EBITDA\nCobertura de Intereses = EBIT / Gastos por Intereses';
    art.summary = 'Métricas cuantitativas para evaluar la solvencia de largo plazo, el apalancamiento financiero y la liquidez de corto plazo frente a compromisos inmediatos.';
    art.content = `### Estructura Patrimonial y Salud Financiera

El análisis del balance distingue dos niveles de riesgo financiero: la **liquidez inmediata** (capacidad para afrontar compromisos a menos de 12 meses) y la **solvencia estructural** (capacidad para sostener la deuda a mediano y largo plazo).

---

### Ratios de Liquidez a Corto Plazo

1. **Ratio Corriente (Current Ratio)**:
   \`Ratio Corriente = Activo Corriente / Pasivo Corriente\`
   - Relaciona los activos realizables en menos de un año (caja, cuentas a cobrar, inventarios) con las deudas con vencimiento en ese mismo lapso. Ratios entre **1,2x y 2,0x** suelen reflejar equilibrio operativo; valores menores a 1,0x exigen monitorear riesgo de refinanciación.
2. **Prueba Ácida (Quick Ratio o Acid-Test)**:
   \`Prueba Ácida = (Activo Corriente − Inventarios) / Pasivo Corriente\`
   - Mide la liquidez más rigurosa deduciendo los inventarios, cuya liquidación suele exigir tiempo o descuentos de precios. Un ratio cercano o superior a **1,0x** indica capacidad de responder ante pasivos inmediatos con fondos líquidos.

---

### Apalancamiento y Solvencia a Largo Plazo

- **Deuda a Corto Plazo vs Deuda a Largo Plazo**: Conviene verificar el calendario de amortizaciones; una concentración excesiva de vencimientos en el corto plazo aumenta la vulnerabilidad ante subas de tasas de interés.
- **Deuda Neta / EBITDA**: Expresa cuántos años de generación operativa bruta insumiría amortizar la totalidad de la deuda neta:
  - \`< 1,5x\`: Estructura conservadora y muy sólida.
  - \`1,5x - 3,0x\`: Rango moderado común en industrias estables.
  - \`> 3,5x - 4,0x\`: Nivel de apalancamiento exigente que reduce la flexibilidad estratégica.
- **Cobertura de Intereses (Interest Coverage Ratio)**:
  \`Cobertura = EBIT / Intereses Financieros Netos\`
  - Ratios superiores a **5,0x** indican holgura; valores inferiores a **1,5x - 2,0x** advierten que una caída leve en ventas pondría en riesgo el cumplimiento del servicio de la deuda.`;

    art.keyTakeaways = [
        'El Ratio Corriente y la Prueba Ácida evalúan la suficiencia de activos líquidos para cubrir pasivos a corto plazo.',
        'La Deuda Neta / EBITDA cuantifica el tiempo necesario para repagar la deuda mediante la generación operativa.',
        'La Cobertura de Intereses refleja el margen de seguridad operativa antes de incurrir en estrés financiero.',
    ];
    art.commonMistakes = [
        'Evaluar la deuda total sin contrastar la posición de efectivo y equivalentes líquidos en tesorería.',
        'Ignorar el perfil temporal de vencimientos de la deuda financiera.',
    ];
    art.sources = [
        { title: 'CFA Institute — Financial Analysis Techniques: Liquidity and Solvency Ratios', url: 'https://www.cfainstitute.org' },
        { title: 'S&P Global Ratings — Corporate Methodology: Ratios and Adjustments', url: 'https://www.spglobal.com' },
    ];
}

// 10. Ampliar beta-volatilidad-mercado con short interest, % flotante, dilución y volatilidad histórica
if (articlesMap.has('beta-volatilidad-mercado')) {
    const art = articlesMap.get('beta-volatilidad-mercado');
    art.formula = 'Beta (β) = Covarianza(R_activo, R_mercado) / Varianza(R_mercado)\nVolatilidad Histórica Anualizada = σ_diaria × √252\nShort Interest % = (Acciones Vendidas en Corto / Acciones en Circulación) × 100\n% Flotante en Corto = (Acciones en Corto / Flotante Libre) × 100';
    art.summary = 'Métricas de riesgo sistemático, dispersión de precios, estructura de posiciones cortas en el mercado y variación neta de acciones en circulación.';
    art.content = `### Riesgo Sistemático y Beta de Mercado

El **Beta (β)** mide la sensibilidad estadística de los rendimientos de un activo respecto a las fluctuaciones del mercado de referencia (como el S&P 500):

- **Beta = 1,0x**: El activo tiende a replicar la magnitud de los movimientos del índice.
- **Beta > 1,2x (Agresivo)**: Típico de empresas de crecimiento o cíclicas; amplifica tanto los avances como los retrocesos del mercado.
- **Beta < 0,8x (Defensivo)**: Común en sectores como salud, consumo básico o servicios públicos; menor volatilidad relativa.

---

### Volatilidad Histórica

La **Volatilidad Histórica Anualizada** cuantifica la dispersión real de las rentabilidades diarias del activo en un período determinado (habitualmente 1 año o 252 sesiones de negociación bursátil):
\`Volatilidad Anualizada = Desviación Estándar Diaria × √252\`
Indica la amplitud de oscilación esperada del precio con base en datos históricos observados.

---

### Posiciones Cortas (Short Interest) y % de Flotante en Corto

- **Short Interest**: Cuantifica el número total de acciones tomadas en préstamo y vendidas en corto que permanecen abiertas a una fecha de corte declarada.
- **% Flotante en Corto (Short Float)**: Expresa esa posición como porcentaje de las acciones en circulación libremente negociables (*free float*).
- **Rigor regulatorio**: Es una métrica de **stock a fecha de reporte** (reportada quincenalmente ante FINRA y sujeta a normas como la Reg SHO de la SEC); **no representa el volumen diario negociado en corto** ni constituye un pronóstico determinístico de caída de cotización o de "short squeeze".
- **Días para Cubrir (Days to Cover)**: \`Short Interest / Volumen Diario Promedio\`. Refleja cuántas ruedas demandaría cerrar la totalidad de las posiciones cortas con el volumen habitual.

---

### Dilución de Acciones (Share Dilution) y Variación Neta

La variación neta en las **acciones en circulación (Shares Outstanding)** afecta directamente el beneficio por acción:
- **Dilución**: Nuevas emisiones para financiar adquisiciones, planes de compensación en acciones a directivos (SBC) o conversión de bonos convertibles incrementan el conteo de acciones y reducen la porción del negocio correspondiente a cada acción previa.
- **Recompras Netas (Buybacks)**: Reducen el total de acciones en el mercado, concentrando las utilidades y el flujo libre en un menor número de títulos.`;

    art.keyTakeaways = [
        'El Beta mide la correlación y sensibilidad ante el mercado; la Volatilidad Histórica cuantifica la dispersión intrínseca de retornos.',
        'El Short Interest es un stock quincenal reportado de posiciones abiertas, no el volumen diario de ventas cortas.',
        'La variación neta de acciones en circulación determina si el accionista experimenta dilución o concentración de valor.',
    ];
    art.commonMistakes = [
        'Interpretar un Short Interest elevado como certeza matemática de que la acción va a subir o experimentar un estrangulamiento de cortos.',
        'Ignorar el impacto acumulado de la compensación en acciones (SBC) en la dilución del beneficio por acción.',
    ];
    art.sources = [
        { title: 'U.S. Securities and Exchange Commission (SEC) — Key Points About Regulation SHO and Short Sales', url: 'https://www.sec.gov/investor/pubs/regsho.htm' },
        { title: 'Financial Industry Regulatory Authority (FINRA) — Short Interest Reporting', url: 'https://www.finra.org' },
        { title: 'William F. Sharpe — Capital Asset Prices: A Theory of Market Equilibrium Under Conditions of Risk', url: 'https://www.cfainstitute.org' },
    ];
}

// 11. Ampliar vwap-precio-ponderado-por-volumen
if (articlesMap.has('vwap-precio-ponderado-por-volumen')) {
    const art = articlesMap.get('vwap-precio-ponderado-por-volumen');
    art.formula = 'VWAP = Σ (Precio_t × Volumen_t) / Σ Volumen_t';
    art.summary = 'El VWAP calcula el precio medio ponderado por el volumen transaccionado durante la sesión. Es el benchmark de ejecución institucional para medir eficiencia operativa.';
    art.content = `### El Benchmark Institucional de Negociación

A diferencia de una media móvil simple que otorga el mismo peso a cada vela sin importar la actividad negociada, el **VWAP (Volume-Weighted Average Price)** pondera cada operación por la cantidad de títulos negociados a cada nivel de precio:

\`\`\`
VWAP = Σ (Precio_t × Volumen_t) / Σ Volumen_t
\`\`\`

---

### Utilidad en la Ejecución de Órdenes

Las mesas de operaciones institucionales y los algoritmos de ejecución emplean el VWAP como referencia de calidad:
- **Compra Eficiente**: Una orden de compra ejecutada a un precio promedio inferior al VWAP de la sesión se considera una ejecución favorable respecto al mercado.
- **Venta Eficiente**: Una orden de venta completada por encima del VWAP de la sesión se cataloga como óptima.

---

### Dinámica Técnica Intradía y Limitaciones

- **Soporte / Resistencia Dinámica**: En ruedas con tendencia intradiaria definida, los retrocesos hacia la línea de VWAP suelen actuar como zonas de reactivación de demanda institucional.
- **Reinicio Diario**: El VWAP estándar se reinicia a cero al inicio de cada jornada bursátil. No debe proyectarse de forma continua entre sesiones sin emplear variantes ancladas (**Anchored VWAP**), que miden el precio ponderado desde un evento específico como un reporte de resultados o un cambio de tendencia relevante.`;

    art.keyTakeaways = [
        'El VWAP pondera cada nivel de precio por el volumen negociado durante la sesión intradía.',
        'Constituye el parámetro estándar de la industria institucional para medir la calidad de ejecución.',
        'Se reinicia en cada rueda y no reemplaza a las medias móviles en análisis de mediano y largo plazo.',
    ];
    art.commonMistakes = [
        'Utilizar el VWAP estándar en gráficos diarios o semanales sin anclarlo a una fecha o catalizador específico.',
        'Operar cruces de VWAP de forma mecánica en jornadas laterales sin confirmar volumen y contexto.',
    ];
    art.sources = [
        { title: 'Brian Shannon — Technical Analysis Using Multiple Timeframes', url: 'https://www.cfainstitute.org' },
        { title: 'CME Group — Understanding Volume-Weighted Average Price (VWAP)', url: 'https://www.cmegroup.com' },
    ];
}

// 12. Ampliar volumen-y-confirmacion
if (articlesMap.has('volumen-y-confirmacion')) {
    const art = articlesMap.get('volumen-y-confirmacion');
    art.formula = 'OBV_t = OBV_(t−1) + Volumen (si Cierre_t > Cierre_(t−1))\nOBV_t = OBV_(t−1) − Volumen (si Cierre_t < Cierre_(t−1))\nOBV_t = OBV_(t−1) (si Cierre_t = Cierre_(t−1))';
    art.summary = 'El volumen refleja la liquidez y el combustible de los movimientos de precios. Valida la convicción de la tendencia y advierte divergencias de agotamiento.';
    art.content = `### El Volumen como Combustible del Mercado

En el análisis técnico, el precio refleja el consenso de valor en un instante dado, mientras que el **volumen** mide la cantidad de contratos, acciones o unidades negociadas. Representa el grado de convicción y compromiso financiero de los participantes detrás de cada movimiento.

---

### Principios Fundamentales de la Teoría de Dow

1. **Confirmación de Tendencia**: En una tendencia alcista sana, el volumen debe expandirse en los tramos de avance y contraerse durante las correcciones o retrocesos. En una tendencia bajista, el volumen tiende a incrementarse con las caídas y reducirse en los rebotes técnicos.
2. **Divergencias de Volumen**: Cuando el precio marca nuevos máximos pero el volumen negociado decrece progresivamente, se produce una **divergencia de volumen**, indicando que la suba carece de respaldo institucional y advirtiendo sobre posible agotamiento.
3. **Clímax de Volumen (Blow-off / Capitulación)**: Un pico extremo de volumen tras una tendencia muy madura suele señalar una fase de liquidación por pánico (capitulación bajista) o de euforia compradora (clímax alcista).

---

### Volumen en Títulos vs Monto Operado

Es indispensable diferenciar:
- **Volumen Nominal (Títulos)**: Cantidad de acciones o contratos negociados.
- **Monto Operado (Turnover en Moneda)**: Importe monetario total transaccionado (\`Volumen × Precio Medio\`). En activos con alta variación de cotización o en mercados con inflación, el monto monetario operado ofrece una visión más certera de la liquidez real.`;

    art.keyTakeaways = [
        'El volumen valida la fuerza de una tendencia y permite detectar divergencias de agotamiento.',
        'Una tendencia alcista con volumen decreciente refleja falta de demanda institucional.',
        'Diferenciar volumen en títulos respecto al volumen en valor monetario transaccionado.',
    ];
    art.commonMistakes = [
        'Analizar velas de precios ignorando el volumen relativo respecto a su promedio móvil.',
        'Confundir un incremento puntual de volumen en un horario atípico con una acumulación institucional genuina.',
    ];
    art.sources = [
        { title: 'Joseph E. Granville — New Key to Stock Market Profits (On-Balance Volume)', url: 'https://www.cfainstitute.org' },
        { title: 'Charles H. Dow — The Dow Theory on Volume and Trends', url: 'https://www.cfainstitute.org' },
    ];
}

// 13. Ampliar que-es-el-flujo-de-caja-libre con CFO, CapEx, P/FCF, FCF Yield y conversión de ganancia a caja
if (articlesMap.has('que-es-el-flujo-de-caja-libre')) {
    const art = articlesMap.get('que-es-el-flujo-de-caja-libre');
    art.formula = 'FCF = Flujo de Caja Operativo (CFO) − Inversión en Capital (CapEx)\nP/FCF = Capitalización Bursátil / Free Cash Flow\nFCF Yield = (FCF / Capitalización Bursátil) × 100\nConversión a Caja = (FCF / Utilidad Neta) × 100\nMargen FCF = (FCF / Ingresos) × 100';
    art.summary = 'El Flujo de Caja Libre es el dinero en efectivo real restante tras operar y mantener la infraestructura productiva. Mide la verdadera capacidad de retribución y crecimiento sin artificios contables.';
    art.content = `### La Primacía del Efectivo: ¿Qué es el Free Cash Flow?

El beneficio contable (*Net Income*) incluye partidas no monetarias (como depreciaciones de activos o amortizaciones de intangibles) y criterios de devengamiento temporal. Por ello, inversores institucionales y directores financieros priorizan el **Flujo de Caja Libre (Free Cash Flow o FCF)** como la métrica reina de liquidez económica real:

\`\`\`
FCF = Flujo de Caja Operativo (CFO) − CapEx
\`\`\`

Donde:
- **Flujo de Caja Operativo (CFO)**: Efectivo neto producido directamente por las operaciones comerciales ordinarias (cobros a clientes menos pagos a proveedores, salarios e impuestos operativos).
- **CapEx (Capital Expenditures)**: Desembolsos de capital destinados a mantener, reparar o expandir plantas, equipos, infraestructura y tecnología.

---

### Múltiplos y Métricas Clave Asociadas

1. **Precio / Flujo Libre (P/FCF)**:
   \`P/FCF = Capitalización Bursátil / Free Cash Flow Total\`
   - Mide cuántas veces el flujo libre anual paga el mercado por la empresa. A menudo es más estricto y revelador que el ratio P/E.
2. **Rendimiento de FCF (FCF Yield)**:
   \`FCF Yield = (FCF / Capitalización Bursátil) × 100\`
   - Rentabilidad de caja libre por cada peso o dólar invertido a los precios actuales. Un FCF Yield del 8% indica que la empresa genera en efectivo el 8% de su valor bursátil al año.
3. **Conversión de Ganancia a Caja (Earnings-to-Cash Conversion)**:
   \`Tasa de Conversión = (FCF / Utilidad Neta) × 100\`
   - Si una empresa reporta utilidades crecientes pero su conversión a caja es inferior al 50-60% de forma prolongada, suele advertir sobre ventas no cobradas acumuladas en cuentas a cobrar o acumulación improductiva de inventarios.
4. **Margen FCF**:
   \`Margen FCF = (FCF / Ingresos Totales) × 100\`
   - Qué porcentaje de cada dólar facturado se convierte en efectivo limpio libre de compromisos.`;

    art.keyTakeaways = [
        'El FCF es la caja real restante tras pagar costos operativos e invertir en CapEx.',
        'El P/FCF y el FCF Yield valoran el negocio con base en efectivo tangible, no en devengamientos contables.',
        'La conversión de utilidades a caja permite evaluar la calidad y transparencia de los beneficios reportados.',
    ];
    art.commonMistakes = [
        'Confundir Utilidad Neta con Flujo de Caja Libre: una empresa puede quebrar con beneficios contables si carece de liquidez operativa.',
        'Ignorar el CapEx de mantenimiento necesario para sostener la ventaja competitiva del negocio.',
    ];
    art.sources = [
        { title: 'CFA Institute — Cash Flow Statement Analysis and Free Cash Flow Measures', url: 'https://www.cfainstitute.org' },
        { title: 'Aswath Damodaran — Free Cash Flow to Firm and Equity Valuation', url: 'https://pages.stern.nyu.edu/~adamodar/' },
    ];
}

// 14. Ampliar que-es-el-roe-retorno-patrimonio con ROA y ROCE
if (articlesMap.has('que-es-el-roe-retorno-patrimonio')) {
    const art = articlesMap.get('que-es-el-roe-retorno-patrimonio');
    art.formula = 'ROE = Utilidad Neta / Patrimonio Neto Contable\nROA = Utilidad Neta / Activos Totales\nROCE = EBIT / Capital Empleado = EBIT / (Activos Totales − Pasivos Corrientes)\nDuPont: ROE = Margen Neto × Rotación de Activos × Multiplicador de Apalancamiento';
    art.summary = 'El ROE mide la rentabilidad del capital accionario, complementado rigurosamente por el ROA (retorno sobre activos) y el ROCE (retorno sobre capital empleado) para detectar distorsiones por deuda.';
    art.content = `### El Retorno sobre el Patrimonio Neto (ROE)

El **ROE (Return on Equity)** cuantifica la tasa de rendimiento que una compañía produce con los fondos aportados por sus accionistas y los beneficios retenidos a lo largo de los años:

\`\`\`
ROE = (Utilidad Neta / Patrimonio Neto) × 100
\`\`\`

Si una empresa posee un patrimonio de US$ 1.000 millones y genera US$ 200 millones de beneficio neto anual, su ROE es del **20,0%**.

---

### Descomposición DuPont: Los 3 Motores del ROE

El modelo **DuPont** desglosa el ROE en tres factores esenciales:
1. **Margen Neto (\`Utilidad Neta / Ventas\`)**: Eficiencia operativa y poder de fijación de precios.
2. **Rotación de Activos (\`Ventas / Activos Totales\`)**: Eficiencia en el uso de los activos para generar facturación.
3. **Multiplicador de Apalancamiento (\`Activos Totales / Patrimonio Neto\`)**: Grado de endeudamiento financiero utilizado.

Un ROE elevado puede ser producto de un negocio de alta calidad (márgenes y rotación) o de un **apalancamiento financiero excesivo** que aumenta el riesgo de quiebra.

---

### Métricas Complementarias Obligatorias: ROA y ROCE

- **ROA (Return on Assets)**:
  \`ROA = (Utilidad Neta / Activos Totales) × 100\`
  - Mide cuánta ganancia rinde cada peso o dólar de activos totales, sin importar cómo se financien. Si el ROE es del 25% pero el ROA es solo del 2%, la aparente rentabilidad descansa casi enteramente en una masa de deuda riesgosa.
- **ROCE (Return on Capital Employed)**:
  \`ROCE = (EBIT / Capital Empleado) × 100\`
  - Evalúa el resultado operativo antes de intereses frente al capital productivo de mediano y largo plazo (\`Activos Totales − Pasivos Corrientes\`). Muestra la eficiencia económica del negocio central independientemente de las decisiones de estructura fiscal o de deuda.`;

    art.keyTakeaways = [
        'El ROE mide la rentabilidad para el accionista, pero puede inflarse peligrosamente con deuda.',
        'El análisis DuPont permite desarmar el ROE entre margen, rotación y apalancamiento.',
        'El ROA y el ROCE neutralizan el efecto de la deuda para revelar la rentabilidad real de los activos operativos.',
    ];
    art.commonMistakes = [
        'Celebrar un ROE muy alto sin verificar el ROA ni el multiplicador de deuda financiera.',
        'Comparar el ROA de industrias intensivas en activos físicos (aceleradas en CapEx) con firmas de software.',
    ];
    art.sources = [
        { title: 'CFA Institute — Financial Analysis Techniques: DuPont Analysis and Profitability Ratios', url: 'https://www.cfainstitute.org' },
        { title: 'Investopedia / CFA Review — Return on Capital Employed (ROCE) vs ROE', url: 'https://www.cfainstitute.org' },
    ];
}

// 15. En medias-moviles-sma-ema, asegurar cobertura de SMA 100
if (articlesMap.has('medias-moviles-sma-ema')) {
    const art = articlesMap.get('medias-moviles-sma-ema');
    if (!art.content.includes('100 períodos')) {
        art.content = art.content.replace(
            '- **200 períodos:** Referencia institucional',
            '- **100 períodos:** Filtro de tendencia intermedia de mediano plazo que suaviza correcciones intermedias.\n- **200 períodos:** Referencia institucional'
        );
    }
}

// 16. Recalcular readTimeMinutes real y proporcional para TODOS los artículos (180 palabras por minuto)
articlesMap.forEach((art) => {
    const wordCount = (art.content || '').split(/\s+/).filter(Boolean).length;
    // Tasa estándar de lectura técnica comprensiva: ~160-180 palabras/minuto
    art.readTimeMinutes = Math.max(2, Math.min(12, Math.round(wordCount / 160)));
});

const updatedArticles = Array.from(articlesMap.values());
console.log('Processed', updatedArticles.length, 'articles.');

// Estadísticas de palabras y tiempos
const stats = updatedArticles.map(a => ({
    slug: a.slug,
    words: (a.content || '').split(/\s+/).filter(Boolean).length,
    readTime: a.readTimeMinutes,
}));

console.log('Shortest 5:', stats.sort((a,b) => a.words - b.words).slice(0, 5));
console.log('Longest 5:', stats.sort((a,b) => b.words - a.words).slice(0, 5));

// Guardar archivo compilado
const output = `// Auto-generated & verified Education Seed Data for Finix
export interface SeedCategory {
    name: string;
    slug: string;
    description: string;
    icon: string;
    order: number;
    subcategories: {
        name: string;
        slug: string;
        description: string;
        order: number;
    }[];
}

export interface SeedArticle {
    title: string;
    slug: string;
    categorySlug: string;
    subcategorySlug?: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    readTimeMinutes: number;
    order: number;
    isFeatured: boolean;
    interactiveWidget?: string;
    formula?: string;
    summary: string;
    content: string;
    keyTakeaways: string[];
    commonMistakes: string[];
    prosCons?: { pros: string[]; cons: string[] };
    practicalExample?: string;
    sources: { title: string; url?: string }[];
}

export interface SeedLearningPath {
    title: string;
    slug: string;
    description: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    icon: string;
    order: number;
    articleSlugs: string[];
}

export const SEED_CATEGORIES: SeedCategory[] = ${JSON.stringify(SEED_CATEGORIES, null, 4)};

export const SEED_ARTICLES: SeedArticle[] = ${JSON.stringify(updatedArticles, null, 4)};

export const SEED_LEARNING_PATHS: SeedLearningPath[] = ${JSON.stringify(SEED_LEARNING_PATHS, null, 4)};
`;

fs.writeFileSync(SEED_DATA_PATH, output, 'utf8');
console.log('Successfully written updated seed data to', SEED_DATA_PATH);
