const fs = require('fs');
const path = require('path');

const SEED_DATA_PATH = '/home/juampi26/Finix/apps/api/src/education/education-seed.data.ts';
const DRAFTS_PATH = '/mnt/c/Users/juanp/.codex/.chatgpt-projects/g-p-6a74dcf60a148191bd8dd77d512e0c09/outputs/auditoria-finix-2026-10-11/articulos-apoyo.json';
const MANIFEST_PATH = '/mnt/c/Users/juanp/.codex/.chatgpt-projects/g-p-6a74dcf60a148191bd8dd77d512e0c09/outputs/auditoria-finix-2026-10-11/imagenes-educativas/manifest.json';

const drafts = JSON.parse(fs.readFileSync(DRAFTS_PATH, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

// Read existing seed data file
const seedContent = fs.readFileSync(SEED_DATA_PATH, 'utf8');

// Parse SEED_ARTICLES from compiled or existing module
const { SEED_CATEGORIES, SEED_ARTICLES, SEED_LEARNING_PATHS } = require(SEED_DATA_PATH);

console.log('Original SEED_ARTICLES count:', SEED_ARTICLES.length);

const articlesMap = new Map();
SEED_ARTICLES.forEach(a => articlesMap.set(a.slug, { ...a }));

// 1. Incorporate and enrich drafts from articulos-apoyo.json
drafts.forEach(d => {
  const existing = articlesMap.get(d.slug);
  const enriched = {
    title: d.title,
    slug: d.slug,
    categorySlug: d.categorySlug,
    subcategorySlug: d.subcategorySlug,
    level: d.level,
    readTimeMinutes: d.readTimeMinutes,
    order: existing?.order ?? d.order,
    isFeatured: existing?.isFeatured ?? d.isFeatured ?? false,
    formula: d.formula || existing?.formula,
    summary: d.summary,
    content: d.content,
    keyTakeaways: d.keyTakeaways || existing?.keyTakeaways || [],
    commonMistakes: d.commonMistakes || existing?.commonMistakes || [],
    prosCons: existing?.prosCons,
    practicalExample: existing?.practicalExample,
    sources: d.sources || existing?.sources || [],
    interactiveWidget: existing?.interactiveWidget,
  };
  articlesMap.set(d.slug, enriched);
});

// 2. Add images and rigor corrections to specific articles:

// A. que-es-el-rsi
if (articlesMap.has('que-es-el-rsi')) {
  const rsi = articlesMap.get('que-es-el-rsi');
  rsi.content = `### ¿Qué es el RSI?

Desarrollado por **J. Welles Wilder en 1978**, el **Índice de Fuerza Relativa (Relative Strength Index o RSI)** oscila en una escala cerrada entre **0 y 100**.

Evalúa el impulso relativo de los avances frente a los retrocesos durante un período determinado. La fórmula estándar de Wilder emplea **14 períodos**.

![Gráfico histórico de LEVEL 3 COMM con RSI de 21 períodos](/images/education/rsi.png)
*Gráfico histórico de LEVEL 3 COMM con RSI de 21 períodos. La configuración habitual de 14 períodos se explica en el texto; esta imagen usa 21. Autor: FeRR@ ([CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)), Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Analisi_tecnica_rsi.png).*

---

### Zonas Clave del RSI

- **Zona de Sobrecompra (RSI > 70):** El precio ha experimentado avances acelerados en el período analizado. Sugiere que el impulso alcista es maduro y puede dar lugar a consolidaciones o tomas de ganancia, aunque en tendencias sostenidas puede mantenerse en sobrecompra prolongada.
- **Zona de Sobreventa (RSI < 30):** El precio ha acumulado ventas pronunciadas. Indica presión bajista extrema que podría dar lugar a pausas o rebotes técnicos, sin garantizar por sí misma el fin de una caída.
- **Línea media (50):** Referencia neutral del oscilador. RSI superior a 50 refleja predominio del impulso alcista; inferior a 50, predominio del impulso bajista.

---

### Criterio en Velas Semanales (1W) en Finix

En gráficos semanales de mediano plazo (como los empleados en el radar de Finix):
- **Zona de Seguimiento Inferior (RSI < 45):** Activos donde el momentum bajista ha desacelerado o corregido con fuerza. No garantiza un piso ni limita pérdidas: requiere validar fundamentos y estructura técnica.
- **Zona de Alerta de Extensión (RSI > 55):** Activos con tramo impulsivo desarrollado donde la relación riesgo/beneficio para nuevas compras se reduce.

*Nota:* Los umbrales de 45 y 55 responden a la calibración de mediano plazo de la plataforma, no a reglas universales de mercado.

---

### Divergencias de Momentum

- **Divergencia Alcista (Bullish Divergence):** El precio marca mínimos decrecientes mientras el RSI registra mínimos ascendentes. Señala desaceleración en la presión vendedora.
- **Divergencia Bajista (Bearish Divergence):** El precio marca máximos ascendentes mientras el RSI registra máximos decrecientes. Alerta sobre pérdida de fuerza compradora que sugiere prudencia, sin constituir una certeza matemática de giro inmediato.`;

  rsi.keyTakeaways = [
    'El RSI oscila entre 0 y 100 midiendo la velocidad y magnitud del momentum.',
    'En tendencias alcistas fuertes, el RSI puede permanecer en niveles elevados (>70) sin que el precio caiga de inmediato.',
    'Las divergencias alertan sobre pérdida de fuerza de la tendencia, pero deben combinarse con soportes y volumen.',
  ];
  rsi.commonMistakes = [
    'Comprar únicamente porque el RSI tocó 30: una tendencia bajista fuerte puede mantener el RSI deprimido mientras el precio continúa cayendo.',
    'Vender una posición alcista rentable solo porque el RSI supera 70 sin señales de cambio en la tendencia.',
    'Confundir el parámetro estándar de 14 períodos con configuraciones particulares como la de 21 períodos vista en ejemplos históricos.',
  ];
  rsi.sources = [
    { title: 'J. Welles Wilder — New Concepts in Technical Trading Systems (1978)' },
    { title: 'Fidelity Learning Center — Relative Strength Index (RSI)', url: 'https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/RSI' },
  ];
}

// B. que-es-el-macd
if (articlesMap.has('que-es-el-macd')) {
  const macd = articlesMap.get('que-es-el-macd');
  macd.content = `### ¿Qué es el MACD?

Diseñado por **Gerald Appel en 1979**, el **Moving Average Convergence Divergence (MACD)** es un indicador de seguimiento de tendencia y momentum basado en la relación entre dos medias móviles exponenciales (EMAs).

![MACD (12, 26, 9): línea MACD, señal e histograma](/images/education/macd.gif)
*Ejemplo histórico de MACD (12,26,9): línea MACD, señal e histograma. No es una cotización actual. Autor: Tradermatt ([CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)), Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:MACDpicwiki.gif).*

---

### Componentes del Indicador

1. **Línea MACD:** Diferencia entre la EMA rápida (típicamente 12 períodos) y la EMA lenta (26 períodos). Mide la aceleración del precio.
2. **Línea de Señal (Signal Line):** EMA de 9 períodos calculada sobre la propia Línea MACD. Suaviza la serie para identificar giros.
3. **Histograma MACD:** Distancia vertical entre la Línea MACD y la Línea de Señal (\`Línea MACD − Señal\`). Cuando es positivo (verde), el MACD está sobre su señal; cuando es negativo (rojo), está por debajo.

---

### Señales Técnicas Habituales

- **Cruce de Señal Alcista:** La línea MACD cruza de abajo hacia arriba la línea de señal. El histograma pasa a terreno positivo.
- **Cruce de Señal Bajista:** La línea MACD cruza de arriba hacia abajo la línea de señal. El histograma entra en terreno negativo.
- **Cruce de la Línea Cero:** Cuando la EMA 12 cruza a la EMA 26, el MACD cruza el nivel cero, confirmando cambio de tendencia de mediano plazo.
- **Divergencias:** Discrepancia entre la pendiente de los máximos/mínimos del precio y los del MACD. Alertan sobre posible agotamiento del impulso previo.`;

  macd.sources = [
    { title: 'Gerald Appel — Technical Analysis: Power Tools for Active Investors' },
    { title: 'Fidelity Learning Center — MACD Indicator Guide', url: 'https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/macd' },
  ];
}

// C. medias-moviles-sma-ema
if (articlesMap.has('medias-moviles-sma-ema')) {
  const ma = articlesMap.get('medias-moviles-sma-ema');
  ma.content = `### ¿Qué son las Medias Móviles?

Una **media móvil** suaviza los datos de precios creando un valor medio continuamente actualizado a lo largo de un período determinado. Al eliminar las fluctuaciones aleatorias diarias, permite visualizar la dirección de la tendencia subyacente.

![Comparación entre media simple (SMA) y media exponencial (EMA)](/images/education/sma-ema.png)
*Captura histórica que compara media simple y exponencial. Los parámetros se leen en el gráfico; no es un gráfico actual de FINIX. Autor: Alex Kofman ([CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)), Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Moving_Average_Types_comparison_-_Simple_and_Exponential.png).*

---

### Tipos Principales: SMA vs EMA

- **Media Móvil Simple (SMA):** Asigna el mismo peso aritmético a cada uno de los últimos N días. Es estable y filtra bien el ruido, pero reacciona con mayor rezago ante giros bruscos.
- **Media Móvil Exponencial (EMA):** Asigna mayor ponderación matemática a las sesiones más recientes mediante un factor de suavizado. Reacciona con mayor rapidez a los cambios recientes de cotización.

---

### Períodos Clave en el Mercado

- **20 períodos:** Tendencia de muy corto plazo / ritmo de swing.
- **50 períodos:** Tendencia intermedia; utilizada frecuentemente como soporte dinámico en avances sostenidos.
- **200 períodos:** Referencia institucional de largo plazo. Cuando el precio cotiza por encima, predomina una estructura de largo plazo positiva; por debajo, negativa. Como todo indicador rezagado, no predice giros anticipadamente sino que resume el régimen vigente.

---

### Cruces Tradicionales

- **Golden Cross (Cruce Dorado):** La media de 50 períodos supera a la de 200 períodos. Señal de fortalecimiento tendencial de mediano plazo.
- **Death Cross (Cruce de la Muerte):** La media de 50 períodos cae por debajo de la de 200 períodos. Refleja deterioro tendencial.`;

  ma.sources = [
    { title: 'John J. Murphy — Technical Analysis of the Financial Markets' },
    { title: 'Fidelity Learning Center — Moving Averages', url: 'https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/moving-averages' },
  ];
}

// D. soportes-resistencias-polaridad
if (articlesMap.has('soportes-resistencias-polaridad')) {
  const sr = articlesMap.get('soportes-resistencias-polaridad');
  sr.content = `### Concepto de Soporte y Resistencia

Los niveles de soporte y resistencia representan zonas de precios donde las fuerzas de oferta y demanda confluyen históricamente con suficiente intensidad para pausar o revertir un movimiento.

![Diagrama didáctico de soporte y resistencia](/images/education/soporte-resistencia.png)
*Diagrama didáctico de soporte y resistencia. Es una ilustración, no una serie de precios actual. Autor: Jonlaw16 ([CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)), Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Support_and_Resistance.png).*

---

### Fundamento de Mercado

- **Soporte:** Nivel o franja de precios donde el interés comprador supera la presión vendedora. El precio rebota o frena su descenso.
- **Resistencia:** Nivel o franja de precios donde la oferta supera a la demanda. El avance del precio se detiene o retrocede.

---

### Principio de Polaridad

Uno de los principios técnicos más consistentes:
- Cuando una **resistencia** relevante es superada al alza de forma confirmada, tiende a convertirse en un nuevo nivel de **soporte** ante futuros retrocesos.
- Cuando un **soporte** se perfora a la baja, la antigua zona de compra suele transformarse en **resistencia** en rebotes posteriores.`;

  sr.sources = [
    { title: 'Thomas Bulkowski — Encyclopedia of Chart Patterns' },
    { title: 'Fidelity Learning Center — Support and Resistance', url: 'https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/support-resistance' },
  ];
}

// E. tendencias-alcista-bajista-lateral
if (articlesMap.has('tendencias-alcista-bajista-lateral')) {
  const tend = articlesMap.get('tendencias-alcista-bajista-lateral');
  tend.content = `### Las Tres Direcciones del Mercado

De acuerdo con la Teoría de Dow, los precios de los activos financieros no se desplazan en línea recta, sino en zigzag mediante ondas de avance y retroceso. Existen tres regímenes fundamentales:

---

### 1. Tendencia Alcista (Uptrend)

Se caracteriza por una sucesión de **máximos crecientes (Higher Highs)** y **mínimos crecientes (Higher Lows)**. Los compradores tienen el control del flujo y compran cada corrección a precios más altos que en la ronda anterior.

![Línea de tendencia alcista](/images/education/tendencia-alcista.jpg)
*Diagrama de una línea de tendencia alcista. Ilustración didáctica; una ruptura por sí sola no garantiza un cambio de tendencia. Autor: LCB / Leomty ([Dominio público](https://commons.wikimedia.org/wiki/File:Linea_de_tendencia_alcista.jpg)).*

---

### 2. Tendencia Bajista (Downtrend)

Se define por una secuencia continua de **máximos decrecientes (Lower Highs)** y **mínimos decrecientes (Lower Lows)**. La presión vendedora predomina y los participantes utilizan los rebotes para liquidar posiciones.

![Diagrama didáctico de tendencia bajista](/images/education/tendencia-bajista.png)
*Diagrama didáctico de tendencia bajista. No es una cotización actual. Autor: BourseIran ([CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)), Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Down_Trend.png).*

---

### 3. Rango Lateral o Consolidación (Sideways / Trading Range)

Ocurre cuando el precio oscila entre un soporte definido y una resistencia definida sin lograr marcar nuevos extremos en ninguna de las dos direcciones. Refleja equilibrio temporal entre oferta y demanda.

![Ejemplo histórico de rango lateral](/images/education/tendencia-lateral.jpg)
*Ejemplo histórico de EUR/USD en un rango lateral. Se retiraron los ejes en el archivo original; no permite interpretar precios o fechas concretos. Autor: Ahardy42 ([CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)), Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:EUR-USD-trading-range.jpg).*`;

  tend.sources = [
    { title: 'Charles H. Dow — The Dow Theory' },
    { title: 'Robert D. Edwards & John Magee — Technical Analysis of Stock Trends' },
  ];
}

// F. modelos-de-valuacion-dcf
if (articlesMap.has('modelos-de-valuacion-dcf')) {
  const dcf = articlesMap.get('modelos-de-valuacion-dcf');
  dcf.formula = 'Enterprise Value (EV) = Σ [ FCFF_t / (1 + WACC)^t ] + [ Terminal Value / (1 + WACC)^n ]\nTerminal Value = [ FCFF_n × (1 + g) ] / (WACC − g)\nEquity Value = EV + Caja no operativa − Deuda financiera con interés\nValor por Acción = Equity Value / Acciones en Circulación';
  dcf.summary = 'El modelo DCF descuenta los flujos de caja libres esperados de la empresa a su costo de capital (WACC), sumando la caja y deduciendo la deuda para estimar el valor intrínseco por acción.';
  dcf.content = `### El Fundamento del Valor Intrínseco

El modelo de **Flujos de Caja Descontados (Discounted Cash Flow o DCF)** establece que el valor económico de un activo equivale a la suma de todos los flujos de caja libres que producirá en el futuro, descontados al presente a una tasa que compense el valor temporal del dinero y el riesgo de la inversión.

---

### Flujo a la Firma (FCFF) vs Flujo al Accionista (FCFE)

- **FCFF (Free Cash Flow to Firm):** Flujo de caja libre generado por las operaciones después de inversiones en capital (CapEx) y variaciones en capital de trabajo, antes de pagos de deuda o intereses. Se descuenta al **WACC** para obtener el **Enterprise Value (EV)**.
- **FCFE (Free Cash Flow to Equity):** Flujo remanente tras atender el servicio de la deuda financiera (intereses y amortizaciones) y sumar nuevo endeudamiento neto. Se descuenta directamente al **Costo del Equity (Ke)** para obtener el valor del patrimonio de los accionistas.

---

### Pasos Rigurosos para Construir un DCF (Enfoque FCFF)

1. **Proyección Explícita de Flujos (5 a 10 años):** Se proyectan ingresos, margen operativo, tasa efectiva de impuestos, inversiones en capital fijo (CapEx) y necesidades de capital de trabajo operativo (NWC).
2. **Determinación de la Tasa de Descuento (WACC):** Ponderación del costo de la deuda (neta de efecto impositivo) y el costo del patrimonio neto (mediante CAPM: tasa libre de riesgo, beta desapalancada/reapalancada y prima de riesgo de mercado).
3. **Cálculo del Valor Terminal (Terminal Value):** Resume el valor de la empresa más allá del período explícito. Mediante el modelo de Gordon-Shapiro: \`[ FCFF_n × (1 + g) ] / (WACC − g)\`.
   *Requisito:* La tasa de crecimiento a perpetuidad **g** debe ser menor a la tasa de descuento (\`g < WACC\`) y congruente con el crecimiento del PIB de largo plazo y la moneda del modelo.
4. **Descuento al Presente:** Cada flujo proyectado y el valor terminal se descuentan dividiendo por \`(1 + WACC)^t\`. La suma representa el **Enterprise Value (EV)**.
5. **Paso de Enterprise Value a Equity Value (Valor para los Accionistas):**
   \`Equity Value = Enterprise Value + Caja y Equivalentes no operativos − Deuda Financiera con Interés\`
   *(Equivalente a restar la Deuda Neta en un solo paso, evitando restar dos veces la deuda).*
6. **Valor Intrínseco por Acción (Fair Value):** Se divide el Equity Value entre el número total de acciones diluidas en circulación.`;

  dcf.keyTakeaways = [
    'El DCF no busca predecir el precio a corto plazo, sino estimar el valor económico del negocio bajo supuestos explícitos.',
    'Diferenciar claramente FCFF (descontado al WACC) de FCFE (descontado al costo del equity).',
    'El cálculo de Equity Value suma el efectivo no operativo y resta la deuda financiera al Enterprise Value una sola vez.',
  ];
  dcf.commonMistakes = [
    'Doble deducción de deuda: restar deuda financiera y a la vez restar deuda neta al Enterprise Value.',
    'Asumir tasas terminales g superiores al WACC o incompatibles con el crecimiento económico de largo plazo.',
    'Ignorar la sensibilidad del valor intrínseco ante variaciones pequeñas en el WACC o en los márgenes proyectados.',
  ];
  dcf.sources = [
    { title: 'Aswath Damodaran — Investment Valuation: Tools and Techniques for Determining the Value of Any Asset', url: 'https://pages.stern.nyu.edu/~adamodar/' },
    { title: 'AlphaSpread — DCF Valuation Methodology & Free Cash Flow Models', url: 'https://kb.alphaspread.com/hc/en-us/articles/18217888896017-What-is-DCF-Value' },
  ];
}

// G. que-es-el-roic
if (articlesMap.has('que-es-el-roic')) {
  const roic = articlesMap.get('que-es-el-roic');
  roic.keyTakeaways = [
    'El ROIC mide la rentabilidad del capital operativo de la compañía con independencia de cómo esté financiada.',
    'Un ROIC superior al costo de capital (WACC) sostenido durante varios años es un indicio cuantitativo relevante de posibles ventajas competitivas (economic moat).',
    'La confirmación de una ventaja defensiva requiere análisis cualitativo adicional sobre barreras de entrada, costos de cambio o economías de escala.',
  ];
  roic.commonMistakes = [
    'Considerar que un ROIC histórico elevado garantiza inmunidad futura frente a cambios tecnológicos o competencia agresiva.',
    'Confundir ROIC con ROE: el ROE puede elevarse aumentando el endeudamiento sin mejorar la eficiencia operativa.',
    'Evaluar el ROIC de un único ejercicio atípico en lugar de observar la trayectoria a lo largo de un ciclo económico completo.',
  ];
}

// H. bonos-tir-duration
if (articlesMap.has('bonos-tir-duration')) {
  const bonos = articlesMap.get('bonos-tir-duration');
  bonos.sources = [
    { title: 'CFA Institute — Yield-Based Bond Duration Measures and Properties (2026)', url: 'https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/yield-based-bond-duration-measures-and-properties' },
    { title: 'U.S. Securities and Exchange Commission (Investor.gov) — Bonds & Fixed Income Products', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds' },
    { title: 'BYMA Educa — Glosario y Mercados de Renta Fija', url: 'https://www.bymaeduca.com.ar/pages/glosario1' },
  ];
}

const finalArticles = Array.from(articlesMap.values());
console.log('Final updated articles count:', finalArticles.length);

// Generate formatted TypeScript file
const header = `// Auto-generated & verified Education Seed Data for Finix
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

export const SEED_ARTICLES: SeedArticle[] = ${JSON.stringify(finalArticles, null, 4)};

export const SEED_LEARNING_PATHS: SeedLearningPath[] = ${JSON.stringify(SEED_LEARNING_PATHS, null, 4)};
`;

fs.writeFileSync(SEED_DATA_PATH, header, 'utf8');
console.log('Successfully wrote', finalArticles.length, 'articles to', SEED_DATA_PATH);
