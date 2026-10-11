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

export const SEED_CATEGORIES: SeedCategory[] = [
    {
        name: 'Fundamentos de Inversión',
        slug: 'fundamentos',
        description: 'Conceptos básicos, instrumentos financieros y los pilares para comenzar a invertir con criterio.',
        icon: 'BookOpen',
        order: 1,
        subcategories: [
            { name: 'Primeros Pasos', slug: 'primeros-pasos', description: 'Conceptos iniciales y mentalidad de inversor', order: 1 },
            { name: 'Instrumentos Financieros', slug: 'instrumentos', description: 'Acciones, bonos, CEDEARs, ETFs y fondos', order: 2 },
            { name: 'Principios Financieros', slug: 'principios', description: 'Interés compuesto, inflación y riesgo', order: 3 },
        ],
    },
    {
        name: 'Análisis Fundamental',
        slug: 'analisis-fundamental',
        description: 'Evaluación de modelos de negocio, balances, ratios financieros y valoración intrínseca de empresas.',
        icon: 'BarChart3',
        order: 2,
        subcategories: [
            { name: 'Estados Financieros', slug: 'estados-financieros', description: 'Balance general, estado de resultados y flujos de caja', order: 1 },
            { name: 'Ratios y Múltiplos', slug: 'ratios', description: 'PER, EV/EBITDA, ROIC, ROE y solvencia', order: 2 },
            { name: 'Modelos de Valoración', slug: 'valoracion', description: 'DCF, múltiplos comparables y valor intrínseco', order: 3 },
            { name: 'Calidad del Negocio', slug: 'calidad', description: 'Foso defensivo (Moat), management y asignación de capital', order: 4 },
        ],
    },
    {
        name: 'Análisis Técnico',
        slug: 'analisis-tecnico',
        description: 'Lectura de gráficos de precios, acción del precio, indicadores cuantitativos y psicología de mercado.',
        icon: 'TrendingUp',
        order: 3,
        subcategories: [
            { name: 'Estructura y Tendencias', slug: 'tendencias', description: 'Estructura de mercado, máximos, mínimos y rupturas', order: 1 },
            { name: 'Soportes y Resistencias', slug: 'soportes-resistencias', description: 'Zonas de oferta y demanda, polaridad y niveles clave', order: 2 },
            { name: 'Velas y Patrones', slug: 'velas-patrones', description: 'Lectura de velas japonesas y formaciones chartistas', order: 3 },
            { name: 'Indicadores Técnicos', slug: 'indicadores', description: 'RSI, MACD, Medias Móviles, Bandas de Bollinger', order: 4 },
        ],
    },
    {
        name: 'Macroeconomía y Mercados',
        slug: 'macroeconomia',
        description: 'Cómo influyen las tasas de interés, la inflación, los bancos centrales y los ciclos globales.',
        icon: 'Landmark',
        order: 4,
        subcategories: [
            { name: 'Variables Macroeconómicas', slug: 'variables-macro', description: 'PIB, inflación, empleo y política monetaria', order: 1 },
            { name: 'Bancos Centrales y Tasas', slug: 'bancos-centrales', description: 'Reserva Federal, curva de rendimientos y liquidez', order: 2 },
            { name: 'Mercado Argentino y Global', slug: 'mercados', description: 'Dólar MEP/CCL, riesgo país y activos internacionales', order: 3 },
        ],
    },
    {
        name: 'Estrategias y Gestión del Riesgo',
        slug: 'estrategias',
        description: 'Construcción de carteras, psicología del inversor, Dollar Cost Averaging y preservación de capital.',
        icon: 'ShieldCheck',
        order: 5,
        subcategories: [
            { name: 'Filosofías de Inversión', slug: 'filosofias', description: 'Value investing, growth investing, dividendos y buy & hold', order: 1 },
            { name: 'Gestión del Riesgo', slug: 'gestion-riesgo', description: 'Diversificación, dimensionamiento de posición y drawdown', order: 2 },
            { name: 'Psicología y Sesgos', slug: 'psicologia', description: 'Control de emociones y toma racional de decisiones', order: 3 },
        ],
    },
];

export const SEED_ARTICLES: SeedArticle[] = [
    {
        title: '¿Qué es el ROIC (Retorno sobre el Capital Invertido)?',
        slug: 'que-es-el-roic',
        categorySlug: 'analisis-fundamental',
        subcategorySlug: 'ratios',
        level: 'INTERMEDIATE',
        readTimeMinutes: 7,
        order: 1,
        isFeatured: true,
        interactiveWidget: 'roic_wacc',
        formula: 'ROIC = NOPAT / Capital Invertido\nNOPAT = Beneficio Operativo (EBIT) × (1 − Tasa Impositiva)\nCapital Invertido = Patrimonio Neto + Deuda Financiera − Caja Neta',
        summary: 'El ROIC es la métrica reina de calidad corporativa: mide cuánta ganancia genera una compañía por cada dólar real invertido en sus operaciones.',
        content: `### Introducción al ROIC

El **Retorno sobre el Capital Invertido (ROIC)** es ampliamente considerado por inversores profesionales e institucionales como el indicador individual más riguroso para medir la ventaja competitiva y la rentabilidad económica de una compañía.

A diferencia de métricas como el ROE (que puede inflarse artificialmente añadiendo deuda extrema), el ROIC examina todo el capital productivo inmovilizado en la empresa —tanto el provisto por los accionistas como el aportado por acreedores— y evalúa cuánta caja operativa neta genera dicho capital.

---

### ¿Cómo funciona el mecanismo del ROIC?

Una empresa toma dinero de dos fuentes principales:
1. **Capital propio (Equity):** aportes de accionistas y beneficios retenidos.
2. **Deuda financiera con interés:** préstamos bancarios y emisión de bonos u obligaciones negociables.

Con ese dinero acumulado (el capital invertido), la compañía compra fábricas, contrata talento, invierte en I+D o abre locales. Al final del ejercicio, ese capital rinde un beneficio operativo libre de impuestos (**NOPAT**).

El ROIC expresa este rendimiento como un porcentaje:
- Si el ROIC es del **25%**, significa que por cada US$ 100 colocados en las entrañas del negocio, la compañía produce US$ 25 de beneficio operativo limpio cada año.

---

### La relación decisiva: ROIC vs WACC

Un negocio no crea valor para sus accionistas simplemente por tener beneficios contables; **crea valor únicamente cuando su ROIC es superior a su Costo Medio Ponderado de Capital (WACC)**.

- **Spread de Valor = ROIC − WACC**
- **Si ROIC > WACC:** la empresa genera valor económico real. Cada dólar reinvertido se multiplica a una tasa superior al costo de financiarlo.
- **Si ROIC = WACC:** la empresa opera en punto de equilibrio económico, sin agregar valor por encima del costo de capital.
- **Si ROIC < WACC:** la empresa está **destruyendo valor**. Aunque reporte utilidades contables en su estado de resultados, la rentabilidad obtenida es menor al rendimiento mínimo que exigen los proveedores de capital.

---

### Ejemplo Práctico

Imaginemos dos compañías del mismo sector:

| Métrica | Empresa A (Gran Calidad) | Empresa B (Baja Eficiencia) |
| :--- | :--- | :--- |
| **Capital Invertido** | US$ 1.000 M | US$ 1.000 M |
| **NOPAT Anual** | US$ 240 M | US$ 60 M |
| **ROIC** | **24,0%** | **6,0%** |
| **WACC (Costo de Capital)** | 8,5% | 8,5% |
| **Spread de Creación de Valor** | **+15,5 pp (Crea valor)** | **-2,5 pp (Destruye valor)** |

Para crecer un 10% en beneficios, la Empresa A solo necesita reinvertir una pequeña fracción de sus ganancias anuales, repartiendo el resto en recompras de acciones o dividendos. La Empresa B, en cambio, debe endeudarse fuertemente solo para mantener su posición competitiva.`,
        keyTakeaways: [
            'El ROIC mide la rentabilidad del negocio independientemente de su estructura de deuda.',
            'Un ROIC superior al 15% sostenido a lo largo de 5 a 10 años es la marca distintiva de un Foso Defensivo (Economic Moat).',
            'La creación de valor genuina ocurre únicamente cuando el ROIC supera al WACC.',
        ],
        commonMistakes: [
            'Confundir ROIC con ROE: el ROE ignora el nivel de deuda y puede estar distorsionado por apalancamiento excesivo.',
            'Analizar el ROIC de un solo año extraordinario en lugar de la media histórica a lo largo del ciclo económico.',
            'No comparar el ROIC con el costo de capital de la industria.',
        ],
        prosCons: {
            pros: [
                'No está distorsionado por recompras de acciones o deuda financiera como el ROE.',
                'Permite comparar empresas de diferentes estructuras de capital.',
                'Es el mejor predictor de retornos compuestos a largo plazo.',
            ],
            cons: [
                'Menos útil en empresas de servicios financieros o bancos donde la deuda es materia prima.',
                'Puede variar según el tratamiento contable de gastos de I+D y arrendamientos operativos.',
            ],
        },
        practicalExample: 'Apple (AAPL) o Microsoft (MSFT) mantienen históricamente ROICs superiores al 30-50%, lo que les permite autofinanciar su expansión sin necesidad de diluir accionistas ni recurrir a deuda costosa.',
        sources: [
            { title: 'Michael Mauboussin — Measuring the Moat: Assessing the Magnitude and Sustainability of Value Creation' },
            { title: 'McKinsey & Company — Valuation: Measuring and Managing the Value of Companies' },
        ],
    },
    {
        title: '¿Qué es el PER o Ratio P/E (Price to Earnings)?',
        slug: 'que-es-el-per',
        categorySlug: 'analisis-fundamental',
        subcategorySlug: 'ratios',
        level: 'BEGINNER',
        readTimeMinutes: 6,
        order: 2,
        isFeatured: true,
        interactiveWidget: 'per',
        formula: 'PER = Precio por Acción / Beneficio por Acción (EPS)\nTambién equivalente a: Capitalización Bursátil / Beneficio Neto Total',
        summary: 'El PER indica cuántos años de beneficios anuales está pagando el inversor al comprar una acción, o cuántas veces sus ganancias anuales cotiza la empresa.',
        content: `### Definición del PER

El **Price-to-Earnings Ratio (P/E o PER)** es el múltiplo de valoración más conocido en el mundo bursátil. Refleja la relación directa entre el precio al que cotiza una acción en el mercado secundario y los beneficios netos que genera la empresa por cada acción.

Por ejemplo, si una acción cotiza a **USD 100** y su beneficio neto anual por acción (EPS) es de **USD 5**, su PER es de **20x** (100 / 5).

---

### ¿Cómo se interpreta?

1. **Años de recuperación teórica:** Un PER de 20x significa que, si la empresa mantuviese constantes sus beneficios actuales y los distribuyera al 100%, tardarías 20 años en recuperar tu inversión.
2. **Expectativa de crecimiento:** Un PER alto no significa necesariamente que una empresa esté "cara"; frecuentemente refleja que el mercado anticipa que sus ganancias se duplicarán o triplicarán en los próximos años.
3. **Inverso del PER (Earnings Yield):** 1 / PER representa el rendimiento del beneficio. Si el PER es 20x, el Earnings Yield es del 5% anual.

---

### Tipos de PER

- **Trailing P/E (TTM):** Calculado con los beneficios reales de los últimos 12 meses ya reportados. Es objetivo porque usa datos comprobables.
- **Forward P/E:** Calculado con las estimaciones de beneficios de los analistas para los próximos 12 meses. Depende de proyecciones y supuestos futuros.
- **Shiller P/E (CAPE):** Promedio de los beneficios ajustados por inflación durante 10 años, muy usado para medir si un índice como el S&P 500 está sobrevalorado.`,
        keyTakeaways: [
            'El PER relaciona el precio de mercado con el beneficio por acción.',
            'Un PER bajo puede ser una oportunidad de valor, pero también una "trampa de valor" si los beneficios van a desplomarse.',
            'Siempre debe compararse contra competidores directos, contra la media histórica de la empresa y con su tasa de crecimiento (vía ratio PEG).',
        ],
        commonMistakes: [
            'Pensar que una acción con PER 10 siempre es más barata que una con PER 25 sin considerar crecimiento o calidad.',
            'Calcular el PER con beneficios extraordinarios de una sola vez (venta de inmuebles o filiales).',
            'Aplicar PER a empresas en pérdidas (PER negativo no tiene interpretación analítica estándar).',
        ],
        prosCons: {
            pros: [
                'Extremadamente fácil de calcular y ampliamente disponible.',
                'Excelente para comparar compañías maduras y rentables de un mismo sector.',
            ],
            cons: [
                'Inútil para empresas jóvenes o en etapas tempranas que reinvierten todo y reportan beneficios contables cero.',
                'Los beneficios contables pueden ser manipulados por políticas de amortización o provisiones.',
            ],
        },
        practicalExample: 'Si Uber cotiza a USD 75 con un EPS esperado de USD 4,87, su Forward P/E es de 15,4x. Comparado con su promedio de 16,5x y el promedio del S&P 500 (21x), refleja una valoración razonable si la empresa continúa expandiendo márgenes.',
        sources: [
            { title: 'Benjamin Graham — El Inversor Inteligente' },
            { title: 'Peter Lynch — One Up On Wall Street' },
        ],
    },
    {
        title: '¿Qué es el RSI (Índice de Fuerza Relativa)?',
        slug: 'que-es-el-rsi',
        categorySlug: 'analisis-tecnico',
        subcategorySlug: 'indicadores',
        level: 'INTERMEDIATE',
        readTimeMinutes: 7,
        order: 1,
        isFeatured: true,
        interactiveWidget: 'rsi',
        formula: 'RSI = 100 − (100 / (1 + RS))\nRS (Fuerza Relativa) = Ganancia Promedio de N períodos / Pérdida Promedio de N períodos\nPeríodo estándar sugerido por J. Welles Wilder: 14 velas',
        summary: 'El RSI es un oscilador de momentum que mide la velocidad y la magnitud de los movimientos recientes de precio para evaluar condiciones de sobrecompra o sobreventa.',
        content: `### ¿Qué es el RSI?

Desarrollado por **J. Welles Wilder en 1978**, el **Índice de Fuerza Relativa (Relative Strength Index o RSI)** oscila en una escala cerrada entre **0 y 100**.

Evalúa el equilibrio de poder entre compradores y vendedores durante un período determinado (generalmente 14 velas, ya sean diarias o semanales).

---

### Zonas Clave del RSI

- **Sobrecompra (RSI > 70):** El precio ha experimentado subidas aceleradas en poco tiempo. Indica posible agotamiento del impulso alcista o necesidad de una pausa/consolidación.
- **Sobreventa (RSI < 30):** El precio ha sufrido ventas agresivas y unilaterales. Sugiere que la presión vendedora podría estar perdiendo fuerza, abriendo la puerta a un rebote técnico.
- **Línea media (50):** Funciona como termómetro de la tendencia general. RSI por encima de 50 refleja control de los compradores; por debajo de 50, predominio vendedor.

---

### Criterio en Velas Semanales (1W) en Finix

En gráficos semanales de mediano plazo (como los empleados en el mapa de calor de Finix):
- **Zona de Acumulación (RSI < 45):** Acciones sólidas con correcciones saludables donde el riesgo bajista suele estar acotado.
- **Zona de Cautela (RSI > 55):** Activos que ya han recorrido gran parte de su movimiento impulsivo.

---

### Divergencias: La Señal Más Potente del RSI

- **Divergencia Alcista (Bullish Divergence):** El precio marca mínimos más bajos (**Lower Lows**), pero el RSI marca mínimos más altos (**Higher Lows**). Advierte que la fuerza bajista se está extinguiendo.
- **Divergencia Bajista (Bearish Divergence):** El precio marca máximos más altos (**Higher Highs**), pero el RSI marca máximos decrecientes (**Lower Highs**). Alerta temprana de corrección inminente.`,
        keyTakeaways: [
            'El RSI oscila entre 0 y 100 con zonas clásicas en 30 (sobreventa) y 70 (sobrecompra).',
            'En tendencias alcistas muy fuertes, el RSI puede permanecer en sobrecompra durante semanas sin que el precio caiga.',
            'Las divergencias entre el precio y el RSI son señales de reversión de alta probabilidad técnica.',
        ],
        commonMistakes: [
            'Comprar ciegamente apenas el RSI toca 30: una acción en desplome libre puede continuar cayendo mientras el RSI sigue aplastado.',
            'Vender una posición ganadora solo porque el RSI supera 70 en un activo en pleno descubrimiento de precio.',
            'No contextualizar el RSI con la tendencia mayor y con zonas de soporte o resistencia.',
        ],
        prosCons: {
            pros: [
                'Excelente para detectar agotamiento de momentum.',
                'Las divergencias ofrecen advertencias tempranas antes de que el precio se dé la vuelta.',
                'Fácil de interpretar tanto en gráficos diarios como semanales.',
            ],
            cons: [
                'Genera señales falsas en mercados con tendencias parabólicas persistentes.',
                'No mide volumen directamente, solo variaciones de cierre.',
            ],
        },
        practicalExample: 'Cuando el S&P 500 marcó soporte en octubre de 2022, el gráfico diario del índice presentaba una clara divergencia alcista en el RSI de 14 períodos que precedió al inicio del nuevo ciclo alcista.',
        sources: [
            { title: 'J. Welles Wilder Jr. — New Concepts in Technical Trading Systems (1978)' },
            { title: 'John J. Murphy — Análisis Técnico de los Mercados Financieros' },
        ],
    },
    {
        title: '¿Qué es el MACD (Convergencia/Divergencia de Medias Móviles)?',
        slug: 'que-es-el-macd',
        categorySlug: 'analisis-tecnico',
        subcategorySlug: 'indicadores',
        level: 'INTERMEDIATE',
        readTimeMinutes: 7,
        order: 2,
        isFeatured: true,
        interactiveWidget: 'macd',
        formula: 'Línea MACD = EMA(12) − EMA(26)\nLínea de Señal = EMA(9) del MACD\nHistograma = Línea MACD − Línea de Señal',
        summary: 'El MACD combina seguimiento de tendencia y momentum mediante el cruce de medias móviles exponenciales y un histograma de aceleración.',
        content: `### Componentes del MACD

Creado por **Gerald Appel** a finales de los años 70, el MACD consta de tres elementos visuales:

1. **Línea MACD (rápida):** Es la diferencia matemática entre la media móvil exponencial de 12 períodos y la de 26 períodos.
2. **Línea de Señal (lenta):** Es la media móvil exponencial de 9 períodos calculada sobre la propia línea MACD.
3. **Histograma:** La distancia vertical entre la línea MACD y la línea de señal. Cuando el histograma está por encima de cero, el MACD está por encima de su señal; cuando está por debajo, está por debajo.

---

### Señales Principales

1. **Cruce de la Línea de Señal:**
   - **Cruce alcista:** La línea MACD cruza hacia arriba a la línea de señal (el histograma pasa de negativo a positivo). Señal de compra de momentum.
   - **Cruce bajista:** La línea MACD cruza hacia abajo a la línea de señal. Advertencia de presión vendedora.
2. **Cruce de la Línea Cero:**
   - Cruzar por encima de 0 confirma que la media rápida de 12 está por encima de la media de 26 (tendencia alcista de corto plazo consolidada).
3. **Contracción del Histograma:**
   - Antes de que las líneas se crucen, las barras del histograma comienzan a achicarse hacia la línea cero. Esto permite anticipar el giro con días de anticipación.`,
        keyTakeaways: [
            'El MACD es un indicador dual: mide tendencia y velocidad del precio simultáneamente.',
            'El histograma es el barómetro más sensible para anticipar cruces de medias.',
            'Un cruce alcista por debajo de la línea cero tiene mayor potencial de recorrido que uno ocurrido en zonas ya sobreextendidas.',
        ],
        commonMistakes: [
            'Operar cada cruce en rangos laterales: el MACD se vuelve ruidoso e ineficiente en consolidaciones.',
            'Esperar a la confirmación de la línea cero para entrar, perdiendo gran parte del movimiento inicial.',
        ],
        prosCons: {
            pros: [
                'Filtra el ruido mejor que osciladores más rápidos.',
                'El histograma brinda alertas tempranas de desaceleración del impulso.',
            ],
            cons: [
                'Es un indicador retrasado (lagging indicator) por basarse en medias móviles.',
                'Requiere confirmación de volumen y soportes para evitar señales falsas.',
            ],
        },
        sources: [
            { title: 'Gerald Appel — Technical Analysis: Power Tools for Active Investors' },
        ],
    },
    {
        title: '¿Qué es el Flujo de Caja Libre (Free Cash Flow - FCF)?',
        slug: 'que-es-el-flujo-de-caja-libre',
        categorySlug: 'analisis-fundamental',
        subcategorySlug: 'estados-financieros',
        level: 'INTERMEDIATE',
        readTimeMinutes: 6,
        order: 1,
        isFeatured: true,
        formula: 'FCF = Flujo de Caja Operativo − Gastos de Capital (CapEx)',
        summary: 'El Flujo de Caja Libre es el dinero en efectivo real que le queda a la empresa tras pagar todas sus operaciones e invertir en el mantenimiento de su infraestructura.',
        content: `### Beneficio Contable vs. Caja Real

"Las ventas son vanidad, el beneficio es opinión, pero la caja es la realidad". Esta famosa máxima financiera sintetiza la importancia del **Free Cash Flow (FCF)**.

El beneficio neto contable puede estar distorsionado por ventas a crédito aún no cobradas, amortizaciones aceleradas o ajustes contables sin movimiento de fondos. El FCF, en cambio, registra el dinero contante y sonante que entró en la cuenta bancaria de la empresa y quedó disponible tras cubrir el gasto de capital (**CapEx**) necesario para que el negocio siga funcionando.

---

### ¿Para qué se utiliza el Free Cash Flow?

Una vez que la empresa dispone de FCF, el directorio puede destinarlo a:
1. **Recompra de acciones propias:** aumentando la participación porcentual de los accionistas existentes.
2. **Pago de dividendos en efectivo:** remunerando directamente a los inversores.
3. **Reducción de deuda financiera:** cancelando préstamos para bajar el riesgo de quiebra.
4. **Adquisición de competidores estratégicos:** sin necesidad de endeudarse a tasas altas.
5. **Acumulación de caja de seguridad:** para resistir recesiones o crisis macroeconómicas.`,
        keyTakeaways: [
            'El FCF es la medida más pura de rentabilidad real de un negocio.',
            'Las empresas que crecen su FCF por acción de forma constante suelen ser los mejores valores en bolsa a largo plazo.',
            'El FCF Yield (FCF por acción / Precio) permite comparar la rentabilidad de una acción frente a los bonos del tesoro.',
        ],
        commonMistakes: [
            'Evaluar solo el beneficio neto sin verificar si se convierte efectivamente en flujo de caja.',
            'Olvidar que un CapEx recortado temporalmente puede inflar el FCF de corto plazo a costa del futuro de la empresa.',
        ],
        sources: [
            { title: 'Warren Buffett — Cartas a los accionistas de Berkshire Hathaway' },
        ],
    },
    {
        title: 'Modelos de Valuación DCF (Descuento de Flujos de Caja) y Fair Value',
        slug: 'modelos-de-valuacion-dcf',
        categorySlug: 'analisis-fundamental',
        subcategorySlug: 'valoracion',
        level: 'ADVANCED',
        readTimeMinutes: 9,
        order: 1,
        isFeatured: true,
        interactiveWidget: 'dcf_simulator',
        formula: 'Valor Intrínseco = Σ [ FCFt / (1 + WACC)^t ] + [ Valor Terminal / (1 + WACC)^n ]\nValor Terminal = [ FCFn × (1 + g) ] / (WACC − g)',
        summary: 'El DCF determina el valor intrínseco de un negocio sumando todos los flujos de caja futuros que generará la empresa, descontados al presente a su costo de capital.',
        content: `### El Fundamento Teórico del Valor

Tal como formuló John Burr Williams en 1938, **el valor intrínseco de cualquier activo financiero es igual al valor presente de todos los flujos de caja libres que repartirá a lo largo de su vida útil restante**.

El modelo de **Flujos de Caja Descontados (Discounted Cash Flow o DCF)** es el estándar de oro en banca de inversión y valoración cuantitativa.

---

### Pasos para Construir un Modelo DCF

1. **Proyección del FCF:** Se estiman los ingresos, márgenes operativos y necesidades de reinversión para los próximos 5 a 10 años.
2. **Determinación de la Tasa de Descuento (WACC):** Representa el costo de capital ponderado (riesgo país, tasa libre de riesgo, beta de la acción y prima de riesgo de mercado).
3. **Cálculo del Valor Terminal:** El valor del negocio más allá del horizonte de proyección explícito, asumiendo una tasa de crecimiento perpetuo sostenible (**g**, usualmente entre 2% y 3%).
4. **Descuento al Presente:** Cada flujo futuro se divide por (1 + WACC)^t para traer su valor a dólares de hoy.
5. **Valor por Acción (Fair Value):** Al valor de la empresa resultante se le suma la caja neta disponible, se resta la deuda financiera, y se divide entre el número de acciones en circulación.`,
        keyTakeaways: [
            'El DCF no intenta adivinar el precio de mañana, sino calcular cuánto vale razonablemente el negocio hoy.',
            'Un inversor prudente busca un "Margen de Seguridad": comprar con al menos 15% a 30% de descuento respecto al Fair Value calculado.',
        ],
        commonMistakes: [
            'Asumir tasas de crecimiento desmedidas a perpetuidad que inflan el Fair Value.',
            'Usar una tasa de descuento demasiado baja en entornos de tasas de interés elevadas.',
        ],
        sources: [
            { title: 'Aswath Damodaran — Investment Valuation: Tools and Techniques for Determining the Value of Any Asset' },
        ],
    },
    {
        title: 'Estructura de Mercado y Tendencias: Alcista, Bajista y Lateral',
        slug: 'tendencias-alcista-bajista-lateral',
        categorySlug: 'analisis-tecnico',
        subcategorySlug: 'tendencias',
        level: 'BEGINNER',
        readTimeMinutes: 6,
        order: 1,
        isFeatured: true,
        interactiveWidget: 'trend',
        summary: 'La tendencia es la dirección predominante en la que se desplaza el precio en el tiempo. Comprender su estructura de máximos y mínimos es el primer paso del análisis técnico.',
        content: `### Los Tres Estados del Mercado

Los precios nunca se mueven en línea recta; oscilan en patrones de avance y retroceso (ondas de impulso y corrección).

1. **Tendencia Alcista (Uptrend):**
   - Estructura de **Máximos más Altos (Higher Highs - HH)** y **Mínimos más Altos (Higher Lows - HL)**.
   - Cada corrección frena en un nivel superior al mínimo anterior. Los compradores tienen el control estructural.
2. **Tendencia Bajista (Downtrend):**
   - Estructura de **Máximos más Bajos (Lower Highs - LH)** y **Mínimos más Bajos (Lower Lows - LL)**.
   - Cada intento de rebote es rechazado en un nivel inferior al anterior. Los vendedores dominan el mercado.
3. **Tendencia Lateral o Consolidación (Range):**
   - El precio oscila entre un soporte inferior y una resistencia superior definidos, sin definir nuevos extremos claros. Es una fase de acumulación o distribución.

---

### Cómo se invalida una tendencia

Una tendencia alcista continúa siendo formalmente válida mientras el precio **no pierda con claridad el último mínimo creciente (Higher Low)**. La pérdida de este nivel invalida la tesis técnica y advierte de un cambio de carácter de mercado.`,
        keyTakeaways: [
            'Operar a favor de la tendencia predominante incrementa significativamente las probabilidades de éxito.',
            'Una tendencia alcista se define por una sucesión ininterrumpida de HH y HL.',
            'Identificar el nivel de invalidación antes de entrar en una operación es la base de la gestión del riesgo.',
        ],
        commonMistakes: [
            'Intentar "adivinar techos" en tendencias alcistas sanas o "atrapar cuchillos cayendo" en tendencias bajistas.',
            'Confundir una corrección normal de corto plazo con un cambio de tendencia mayor.',
        ],
        sources: [
            { title: 'Charles H. Dow — Teoría de Dow' },
            { title: 'Stan Weinstein — Secrets for Profiting in Bull and Bear Markets' },
        ],
    },
    {
        title: 'Soportes, Resistencias y Cambio de Polaridad',
        slug: 'soportes-resistencias-polaridad',
        categorySlug: 'analisis-tecnico',
        subcategorySlug: 'soportes-resistencias',
        level: 'BEGINNER',
        readTimeMinutes: 6,
        order: 2,
        isFeatured: true,
        interactiveWidget: 'support_resistance',
        summary: 'Los soportes y resistencias son niveles de precio donde la oferta y la demanda entran en conflicto, frenando caídas o techando subidas.',
        content: `### Concepto de Soporte y Resistencia

- **Soporte:** Es un nivel o zona de precios donde el interés comprador es lo suficientemente fuerte como para superar la presión vendedora, frenando la caída del precio e impulsando un rebote.
- **Resistencia:** Es un nivel o zona donde la presión vendedora (toma de ganancias u órdenes límite de venta) supera el apetito comprador, deteniendo la subida del precio.

---

### Principio de Cambio de Polaridad

Uno de los principios más sólidos del análisis técnico es el **cambio de polaridad**:
- Cuando una **resistencia histórica es rota con convicción y volumen al alza**, pasa a convertirse en un nuevo **soporte** ante futuros retrocesos (**Pullback**).
- Cuando un **soporte clave es perforado a la baja**, pasa a transformarse en una fuerte **resistencia** ante eventuales rebotes técnicos.`,
        keyTakeaways: [
            'Los soportes y resistencias no son líneas milimétricas fijas, sino zonas de congestión de liquidez.',
            'Cuantas más veces reaccione el precio a un nivel sin romperlo, mayor relevancia psicológica adquiere.',
            'El retesteo de un soporte previo roto como resistencia ofrece puntos de entrada óptimos con bajo riesgo.',
        ],
        commonMistakes: [
            'Colocar el Stop Loss exactamente sobre el número redondo en lugar de dejar un margen por debajo del soporte.',
            'Comprar en el techo de una resistencia antes de que ocurra una ruptura confirmada.',
        ],
        sources: [
            { title: 'Al Brooks — Reading Price Charts Bar by Bar' },
        ],
    },
    {
        title: 'Lectura de Velas Japonesas (Candlesticks): Cuerpos, Mechas y Patrones',
        slug: 'lectura-de-velas-japonesas',
        categorySlug: 'analisis-tecnico',
        subcategorySlug: 'velas-patrones',
        level: 'BEGINNER',
        readTimeMinutes: 7,
        order: 3,
        isFeatured: true,
        interactiveWidget: 'candles',
        summary: 'Las velas japonesas condensan en una sola figura visual el precio de apertura, máximo, mínimo y cierre de un período, revelando la batalla entre toros y osos.',
        content: `### Anatomía de una Vela Japonesa

Inventadas por los comerciantes de arroz en Japón en el siglo XVIII y popularizadas en occidente por Steve Nison, cada vela representa cuatro precios clave (**OHLC**):
- **Open (Apertura)**
- **High (Máximo)**
- **Low (Mínimo)**
- **Close (Cierre)**

El **cuerpo** refleja la diferencia entre la apertura y el cierre. Las **mechas o sombras** marcan los extremos alcanzados durante la sesión.

---

### Patrones de Reversión Fundamentales

1. **Martillo (Hammer):** Cuerpo pequeño en la parte superior y mecha inferior larga (al menos el doble del cuerpo). Ocurre tras una caída y refleja rechazo violento de precios bajos por entrada masiva de compradores.
2. **Estrella Fugaz (Shooting Star):** Mecha superior larga y cuerpo pequeño inferior en zona de resistencia. Señala rechazo de nuevos máximos.
3. **Envolvente Alcista (Bullish Engulfing):** Una vela verde cuyo cuerpo cubre y supera por completo el cuerpo de la vela roja precedente.
4. **Doji:** La apertura y el cierre ocurren prácticamente al mismo precio, denotando indecisión absoluta en el mercado.`,
        keyTakeaways: [
            'Una mecha larga siempre representa rechazo de precios por parte del mercado.',
            'Un patrón de velas solo tiene valor predictivo cuando aparece en zonas de soporte, resistencia o medias móviles clave.',
        ],
        commonMistakes: [
            'Memorizar decenas de nombres exóticos de velas sin comprender la dinámica de oferta y demanda subyacente.',
            'Operar patrones aislados en mitad de la nada sin confluencia con niveles estructurales.',
        ],
        sources: [
            { title: 'Steve Nison — Japanese Candlestick Charting Techniques' },
        ],
    },
    {
        title: '¿Qué es Invertir y cómo se diferencia del Ahorro? Interés Compuesto e Inflación',
        slug: 'que-es-invertir-vs-ahorrar',
        categorySlug: 'fundamentos',
        subcategorySlug: 'primeros-pasos',
        level: 'BEGINNER',
        readTimeMinutes: 5,
        order: 1,
        isFeatured: true,
        summary: 'Ahorrar es preservar capital postergando consumo; invertir es poner el capital a trabajar para generar rendimientos por encima de la inflación.',
        content: `### La Diferencia Fundamental

- **Ahorrar:** Guardar dinero líquido (en efectivo o cuenta corriente) para atender contingencias o compras de corto plazo. Su riesgo nominal es cero, pero sufre la pérdida silenciosa de poder adquisitivo por efecto de la **inflación**.
- **Invertir:** Asignar capital a activos productivos (empresas, propiedades, bonos del estado o corporativos) con la expectativa razonable de recibir un flujo de fondos futuro y un incremento patrimonial superior a la inflación.

---

### La Fuerza del Interés Compuesto

Albert Einstein definió el interés compuesto como "la octava maravilla del mundo: quien lo entiende se beneficia de él, quien no lo entiende, lo paga".

Cuando reinvertís los dividendos o intereses generados, tus ganancias comienzan a generar ganancias adicionales año tras año, acelerando el crecimiento patrimonial de forma exponencial en horizontes de 10, 20 o 30 años.`,
        keyTakeaways: [
            'Ahorrar sin invertir garantiza una pérdida constante de poder adquisitivo por inflación.',
            'El tiempo y la consistencia son las dos variables más poderosas del interés compuesto.',
            'Invertir implica asumir volatilidad a corto plazo para ganar rentabilidad real a largo plazo.',
        ],
        commonMistakes: [
            'Invertir dinero que se necesitará para pagar el alquiler o deudas en menos de 6 meses.',
            'Dejar todos los ahorros inmovilizados en cuentas bancarias a la vista perdiendo valor cada año.',
        ],
        sources: [
            { title: 'Burton G. Malkiel — A Random Walk Down Wall Street' },
        ],
    },
    {
        title: 'Gestión del Riesgo: Stop Loss, Take Profit y Tamaño de Posición',
        slug: 'gestion-del-riesgo-stop-loss-posicion',
        categorySlug: 'estrategias',
        subcategorySlug: 'gestion-riesgo',
        level: 'INTERMEDIATE',
        readTimeMinutes: 7,
        order: 1,
        isFeatured: true,
        formula: 'Riesgo Monetario = Capital Total × % Riesgo Máximo (ej: 1%)\nDistancia de Stop = Precio de Entrada − Stop Loss\nTamaño de Posición (Acciones) = Riesgo Monetario / Distancia de Stop',
        summary: 'La gestión del riesgo es lo único que separa al inversor profesional del apostador. Determina cuánto capital podés arriesgar en cada operación para sobrevivir y prosperar.',
        content: `### La Regla de Oro de la Supervivencia

Un inversor puede equivocarse en el 50% de sus análisis y aun así ser sumamente rentable a lo largo de los años si mantiene una estricta **gestión del riesgo y asimetría favorable (Relación Riesgo/Beneficio)**.

---

### La Fórmula del Tamaño de Posición

Nunca decidas cuántas acciones comprar en función de un número redondo o de una corazonada. La fórmula matemática es:

1. **Definí tu riesgo máximo por operación:** Usualmente entre el **1% y el 2%** de tu cuenta total. Si tu cuenta es de US$ 10.000, tu riesgo máximo tolerado por operación es de US$ 100.
2. **Ubicá el Stop Loss técnico:** El nivel donde tu tesis queda invalidada (por ejemplo, debajo del soporte en US$ 65 si comprás a US$ 70; distancia = US$ 5).
3. **Calculá el número de acciones:**
   - US$ 100 / US$ 5 = **20 acciones**.
   - De este modo, si la operación sale mal y toca el Stop Loss, solo perderás exactamente el 1% de tu capital, preservando el 99% restante para nuevas oportunidades.`,
        keyTakeaways: [
            'El tamaño de posición debe calcularse en función del riesgo asumido y nunca al revés.',
            'El Stop Loss se coloca en el punto técnico de invalidación de la tesis, no en un porcentaje arbitrario.',
            'La preservación del capital es la prioridad número uno para alcanzar el éxito financiero a largo plazo.',
        ],
        commonMistakes: [
            'Arriesgar el 20% o 50% de la cuenta en una sola operación creyendo tener "certeza absoluta".',
            'Mover el Stop Loss más abajo cuando el precio se acerca para no asumir la pérdida.',
            'Promediar a la baja en posiciones que continúan deteriorando sus fundamentales.',
        ],
        sources: [
            { title: 'Mark Douglas — Trading in the Zone' },
            { title: 'Nassim Nicholas Taleb — Fooled by Randomness' },
        ],
    },
    {
        title: '¿Qué es el EV/EBITDA y cómo usarlo en valoración?',
        slug: 'que-es-el-ev-ebitda',
        categorySlug: 'analisis-fundamental',
        subcategorySlug: 'ratios',
        level: 'INTERMEDIATE',
        readTimeMinutes: 7,
        order: 5,
        isFeatured: true,
        formula: 'EV/EBITDA = (Capitalización + Deuda Neta) / EBITDA',
        summary: 'El múltiplo que neutraliza la estructura de deuda, impuestos y amortizaciones para comparar empresas de un mismo sector con justicia.',
        content: `### ¿Qué es el Enterprise Value sobre EBITDA?

El **EV/EBITDA** es uno de los múltiplos de valoración favoritos de los analistas de Wall Street y fondos de capital privado. A diferencia del PER, que solo observa la capitalización bursátil y el beneficio neto final, el EV/EBITDA evalúa a la empresa **completa**, teniendo en cuenta cuánto costaría adquirir tanto su capital accionario como asumir su deuda financiera neta.

---

### Los dos componentes del ratio

#### 1. Enterprise Value (EV o Valor de Empresa)
Representa el costo teórico de comprar toda la compañía: compras las acciones y cancelas toda su deuda usando la caja disponible.

#### 2. EBITDA (Earnings Before Interest, Taxes, Depreciation & Amortization)
Representa la generación bruta de caja operativa antes de que intervengan las decisiones de financiamiento (intereses), las políticas fiscales (impuestos) y las convenciones contables de desgaste de activos fijos (depreciaciones y amortizaciones).

---

### ¿Por qué suele ser superior al PER en sectores de capital intensivo?
- **Neutraliza el apalancamiento**: Dos empresas con idénticos negocios pueden tener PER radicalmente distintos si una está endeudada y la otra no. El EV/EBITDA las equipara.
- **Evita distorsiones contables**: Amortizaciones aceleradas o beneficios extraordinarios fiscales no alteran el EBITDA.

---

### Cómo interpretar los valores
- **Bajo (< 8x - 10x)**: Posible infravaloración o negocio en un sector maduro/cíclico de bajo crecimiento.
- **Promedio histórico S&P 500 (12x - 16x)**: Valoración razonable para empresas estables.
- **Elevado (> 20x - 25x)**: Prima por alto crecimiento futuro o ventajas competitivas excepcionales (ej. Software SaaS).`,
        keyTakeaways: [
            'El EV/EBITDA toma en cuenta la deuda neta de la empresa, evitando la trampa de empresas que parecen baratas por PER pero están sobreendeudadas.',
            'Es ideal para comparar empresas intensivas en capital (telecomunicaciones, energía, industria pesada).',
            'No debe usarse en bancos ni entidades financieras, donde la deuda es parte intrínseca de su inventario operativo.',
        ],
        commonMistakes: [
            'Olvidar que el EBITDA no descuenta el CAPEX de mantenimiento: una empresa puede tener gran EBITDA pero quemar caja para renovar maquinaria.',
            'Comparar múltiplos EV/EBITDA entre sectores dispares (ej. una minera contra una tecnológica).',
        ],
        prosCons: {
            pros: ['Independiente de la estructura de capital', 'Excelente para comparaciones entre competidores directos', 'Evita distorsiones fiscales'],
            cons: ['Ignora el gasto de capital (CAPEX)', 'No aplica a servicios financieros', 'Puede ocultar excesivo gasto de depreciación'],
        },
        sources: [
            { title: 'Aswath Damodaran — Investment Valuation' },
            { title: 'McKinsey & Company — Valuation: Measuring and Managing the Value of Companies' },
        ],
    },
    {
        title: '¿Qué es el PEG Ratio (Price/Earnings to Growth)?',
        slug: 'que-es-el-peg-ratio',
        categorySlug: 'analisis-fundamental',
        subcategorySlug: 'ratios',
        level: 'INTERMEDIATE',
        readTimeMinutes: 6,
        order: 6,
        isFeatured: false,
        formula: 'PEG = (PER) / (Tasa de Crecimiento del EPS en %)',
        summary: 'El ratio popularizado por Peter Lynch que ajusta el PER en función de la tasa esperada de crecimiento de los beneficios.',
        content: `### ¿Por qué nació el PEG?
Un PER de 30x puede parecer costoso a simple vista, mientras que un PER de 10x parece una ganga. Sin embargo, si la primera empresa duplica sus ganancias al 35% anual y la segunda está estancada al 2%, la primera en realidad resulta mucho más económica en el mediano plazo.

El **PEG Ratio** fue popularizado por **Peter Lynch** (legendario gestor del fondo Fidelity Magellan) para resolver este dilema: relaciona el precio pagado con la velocidad a la que crecen los beneficios de la compañía.

---

### La regla de oro de Peter Lynch
- **PEG = 1.0**: La empresa cotiza a un precio justo acorde a su crecimiento (un PER de 20x para una empresa que crece al 20% anual).
- **PEG < 1.0**: La empresa cotiza con descuento relativo a su crecimiento esperado (posible oportunidad de valor).
- **PEG < 0.5**: Oportunidad extraordinaria según Lynch (crecimiento masivo a precio de ganga).
- **PEG > 1.5 - 2.0**: El mercado ya descuenta un optimismo elevado y exige altas tasas de ejecución sin margen de error.`,
        keyTakeaways: [
            'El PEG ajusta el PER por la tasa de crecimiento anual compuesta de las ganancias por acción (EPS).',
            'Un PEG inferior a 1.0 suele indicar que estás pagando menos de una unidad de PER por cada punto porcentual de crecimiento.',
            'La calidad de la proyección de crecimiento determina la confiabilidad del ratio.',
        ],
        commonMistakes: [
            'Usar crecimientos pasados irrepetibles en lugar de expectativas de crecimiento sostenible a 3-5 años.',
            'Aplicar el PEG en empresas maduras o en declive con crecimiento cercano a cero, donde el ratio se distorsiona matemáticamente.',
        ],
        prosCons: {
            pros: ['Permite comparar empresas de alto crecimiento contra empresas maduras', 'Fácil de calcular e intuitivo', 'Filtro rápido de sobrevaloración en Growth'],
            cons: ['Altamente dependiente de estimaciones de analistas futuros', 'Ignora la rentabilidad del capital (ROIC) y dividendos'],
        },
        sources: [
            { title: 'Peter Lynch — One Up On Wall Street' },
        ],
    },
    {
        title: '¿Qué es el ROE (Return on Equity)?',
        slug: 'que-es-el-roe-retorno-patrimonio',
        categorySlug: 'analisis-fundamental',
        subcategorySlug: 'ratios',
        level: 'BEGINNER',
        readTimeMinutes: 5,
        order: 7,
        isFeatured: false,
        formula: 'ROE = (Beneficio Neto) / (Patrimonio Neto)',
        summary: 'Mide cuántos centavos de beneficio neto genera una empresa por cada dólar que los accionistas tienen invertido en ella.',
        content: `### Rentabilidad sobre el Patrimonio Neto
El **ROE (Return on Equity)** responde a una pregunta esencial para el inversor en acciones: ¿Qué tan eficientemente está utilizando el equipo directivo los fondos propios aportados por los accionistas y los beneficios retenidos a lo largo de los años?

---

### ¿Qué nivel de ROE es atractivo?
- **ROE < 10%**: Rendimiento pobre que apenas cubre el costo de oportunidad del capital en muchos sectores.
- **ROE entre 15% y 20%**: Nivel saludable, indicativo de empresas bien gestionadas con ventajas competitivas.
- **ROE > 20%**: Nivel excelente (como Apple, Microsoft o Alphabet), típico de negocios ligeros en activos con fuerte poder de marca o foso económico.

---

### La trampa del endeudamiento (Análisis DuPont)
Un ROE alto puede lograrse de dos formas:
1. **Genuina**: Alto margen neto y gran rotación de activos (calidad del negocio).
2. **Artificial**: Endeudamiento excesivo. Si reduces el patrimonio neto financiándote con deuda bancaria, el denominador se achica y el ROE se dispara, pero aumenta el riesgo de insolvencia. Por eso siempre debe analizarse junto al ROIC y la Deuda Neta.`,
        keyTakeaways: [
            'El ROE mide el retorno generado sobre los fondos propios de los accionistas.',
            'Warren Buffett prioriza empresas con ROE superior al 15% sostenido a lo largo de una década.',
            'Siempre se debe verificar que un ROE elevado no provenga de un apalancamiento financiero peligroso.',
        ],
        commonMistakes: [
            'Confundir ROE con ROIC: el ROIC considera toda la estructura de capital y no se distorsiona con deuda.',
            'No revisar el Patrimonio Neto: recompras masivas pueden dejar un patrimonio neto negativo que distorsiona el cálculo.',
        ],
        sources: [
            { title: 'Warren Buffett — Cartas a los Accionistas de Berkshire Hathaway' },
        ],
    },
    {
        title: 'Medias Móviles (SMA y EMA): Tendencias y Cruces Clave',
        slug: 'medias-moviles-sma-ema',
        categorySlug: 'analisis-tecnico',
        subcategorySlug: 'indicadores',
        level: 'BEGINNER',
        readTimeMinutes: 6,
        order: 5,
        isFeatured: true,
        interactiveWidget: 'trend',
        summary: 'Suavizan el ruido diario del precio para identificar la dirección dominante y niveles dinámicos de soporte y resistencia.',
        content: `### ¿Qué son las Medias Móviles?
Una media móvil calcula el precio promedio de un activo durante un número determinado de velas anteriores. A medida que se forma una nueva vela, el dato más antiguo se descarta, haciendo que el promedio se mueva junto con el gráfico.

---

### Tipos principales
1. **SMA (Simple Moving Average)**: Otorga el mismo peso a todos los días del período. Es más suave y menos propensa a señales falsas.
2. **EMA (Exponential Moving Average)**: Da mayor ponderación a los precios más recientes. Reacciona más rápido a giros inmediatos del mercado.

---

### Los períodos institucionales más seguidos
- **SMA de 20 períodos**: Seguimiento de tendencia a muy corto plazo y retrocesos rápidos.
- **SMA de 50 períodos**: La media de mediano plazo por excelencia para inversores swing e institucionales.
- **SMA de 200 períodos**: La frontera que define si un mercado está en régimen alcista (Bull Market) o bajista (Bear Market) de largo plazo.

---

### Cruces Clásicos
- **Cruce Dorado (Golden Cross)**: La media de 50 cruza hacia arriba a la de 200 períodos. Señal alcista de largo plazo.
- **Cruce de la Muerte (Death Cross)**: La media de 50 cruza hacia abajo a la de 200 períodos. Señal de cautela o tendencia bajista estructural.`,
        keyTakeaways: [
            'Las medias móviles son indicadores rezagados (lagging): confirman tendencias existentes pero no predicen techos exactos.',
            'El precio por encima de la SMA 200 indica predominio de compradores a largo plazo.',
            'Funcionan como soportes y resistencias dinámicas en tendencias bien establecidas.',
        ],
        commonMistakes: [
            'Operar cruces de medias en mercados laterales: generará múltiples señales falsas y pérdidas consecutivas.',
            'Llenar el gráfico con demasiadas medias provocando parálisis por análisis.',
        ],
        sources: [
            { title: 'John J. Murphy — Technical Analysis of the Financial Markets' },
        ],
    },
    {
        title: 'Bandas de Bollinger: Volatilidad, Compresión y Ruptura',
        slug: 'bandas-de-bollinger',
        categorySlug: 'analisis-tecnico',
        subcategorySlug: 'indicadores',
        level: 'INTERMEDIATE',
        readTimeMinutes: 7,
        order: 6,
        isFeatured: false,
        summary: 'Miden la volatilidad relativa del mercado trazando bandas a dos desviaciones estándar de una media móvil simple.',
        content: `### Estructura de las Bandas de Bollinger
Diseñadas por John Bollinger en la década de 1980, constan de tres líneas:
1. **Banda Media**: Generalmente una SMA de 20 períodos.
2. **Banda Superior**: Media + 2 Desviaciones Estándar.
3. **Banda Inferior**: Media - 2 Desviaciones Estándar.

Debido a los principios estadísticos de la distribución normal, aproximadamente el 90% al 95% de la acción del precio transcurre dentro de estas dos bandas.

---

### Conceptos operacionales clave

#### 1. La Compresión (The Squeeze)
Cuando la volatilidad desaparece y el mercado entra en calma, las bandas se estrechan notablemente. Históricamente, las fases de extrema compresión anticipan movimientos explosivos de gran tendencia direccional.

#### 2. Expansión y Ruptura
Cuando el precio rompe con fuerza una banda mientras se ensanchan velozmente, indica inicio de una tendencia con momentum institucional.

#### 3. Toques en bandas en mercados en rango
En ausencia de tendencia fuerte, los toques en la banda inferior actúan como soporte de sobreventa y los toques en la banda superior como resistencia de sobrecompra.`,
        keyTakeaways: [
            'Las bandas se ensanchan en alta volatilidad y se estrechan en baja volatilidad.',
            'El Squeeze es la antesala de grandes expansiones de precio.',
            'Tocar la banda superior NO es automáticamente una señal de venta; en tendencias fuertes el precio puede caminar sobre la banda.',
        ],
        commonMistakes: [
            'Vender inmediatamente en cuanto el precio toca la banda superior durante una fuerte tendencia alcista.',
        ],
        sources: [
            { title: 'John Bollinger — Bollinger on Bollinger Bands' },
        ],
    },
    {
        title: '¿Qué son los CEDEARs y cómo utilizarlos para invertir en Argentina?',
        slug: 'que-son-los-cedears',
        categorySlug: 'fundamentos',
        subcategorySlug: 'instrumentos',
        level: 'BEGINNER',
        readTimeMinutes: 6,
        order: 4,
        isFeatured: true,
        summary: 'Certificados que permiten invertir en pesos argentinos en las empresas más grandes del mundo con cobertura contra el dólar libre (CCL).',
        content: `### ¿Qué significa CEDEAR?
**CEDEAR** significa **Certificado de Depósito Argentino**. Son títulos que cotizan en la Bolsa argentina (BYMA) en pesos o en dólares, pero que representan acciones reales de empresas extranjeras (como Apple, Coca-Cola, Tesla o Microsoft) depositadas en bancos custodios del exterior.

---

### La fórmula de cotización del CEDEAR
El precio de un CEDEAR en pesos sigue una lógica simple:
Precio CEDEAR = (Precio Acción en EE.UU. en USD * Dólar CCL) / Ratio de Conversión

Esto significa que el rendimiento del inversor argentino depende de dos factores:
1. **La variación del activo en Wall Street**.
2. **La cotización del tipo de cambio Contado con Liquidación (CCL)**.

Si el dólar libre sube un 10% en Argentina y la acción en EE.UU. no se mueve, el CEDEAR subirá un 10% en pesos, protegiendo el poder adquisitivo del inversor local.

---

### ¿Qué es el Ratio de Conversión?
Es la cantidad de CEDEARs que equivalen a 1 acción original de la empresa en Nueva York. Por ejemplo, si Apple tiene un ratio de 10:1, se necesitan 10 CEDEARs para igualar 1 acción completa de AAPL.`,
        keyTakeaways: [
            'Permiten diversificar fuera del riesgo soberano argentino operando en pesos desde un broker local (ALyC).',
            'Brindan cobertura cambiaria automática vinculada al Dólar CCL.',
            'Pagan dividendos en dólares billete depositados directamente en la cuenta comitente.',
        ],
        commonMistakes: [
            'Creer que son acciones argentinas: el subyacente es 100% extranjero.',
            'Olvidar el ratio de conversión al comparar precios contra las pantallas de Wall Street.',
        ],
        sources: [
            { title: 'Bolsas y Mercados Argentinos (BYMA) — Guía Operativa de CEDEARs' },
            { title: 'Comisión Nacional de Valores (CNV)' },
        ],
    },
    {
        title: '¿Qué son los ETFs (Exchange Traded Funds)?',
        slug: 'que-son-los-etfs',
        categorySlug: 'fundamentos',
        subcategorySlug: 'instrumentos',
        level: 'BEGINNER',
        readTimeMinutes: 6,
        order: 5,
        isFeatured: true,
        summary: 'Fondos de inversión diversificados que cotizan en bolsa con la misma liquidez, sencillez y bajos costos que una acción ordinaria.',
        content: `### ¿Qué es un ETF?
Un **ETF (Exchange Traded Fund)** es una canasta de cientos o miles de activos financieros (acciones, bonos, materias primas) que se negocia en los mercados como si fuera una única acción.

En lugar de investigar y comprar las 500 empresas del S&P 500 una por una, puedes comprar una sola cuota de un ETF como **SPY** o **VOO** y convertirte al instante en copropietario de Apple, Microsoft, Amazon, Berkshire Hathaway, Nvidia y 495 líderes más.

---

### Principales ventajas de los ETFs
- **Diversificación instantánea**: Elimina el riesgo de quiebra de una sola compañía (riesgo no sistemático).
- **Costos de gestión mínimos**: Los ETFs pasivos cobran comisiones anuales ínfimas (0.03% a 0.20%), mucho menores que los fondos tradicionales.
- **Transparencia total**: Se conoce exactamente qué activos componen la canasta en cada momento.

---

### ETFs más populares del mundo
- **SPY / VOO**: Replican las 500 empresas más representativas de EE.UU. (S&P 500).
- **QQQ**: Replica las 100 empresas no financieras con mayor componente tecnológico del Nasdaq.
- **DIA**: Replica el índice industrial Dow Jones.
- **IWM**: Replica el índice Russell 2000 de empresas de pequeña capitalización (Small Caps).
- **GLD**: Replica el precio del oro físico bullion.`,
        keyTakeaways: [
            'Permiten construir un portafolio global diversificado con mínimos montos de entrada.',
            'La inversión indexada mediante ETFs ha batido históricamente a más del 85% de los fondos de gestión activa a plazos mayores a 10 años.',
        ],
        commonMistakes: [
            'Invertir en ETFs apalancados creyendo que son para largo plazo (el decaimiento por volatilidad destruye el valor temporal).',
        ],
        sources: [
            { title: 'John C. Bogle — El pequeño libro para invertir con sentido común' },
        ],
    },
    {
        title: 'Inflación, Tasas de Interés y Política Monetaria',
        slug: 'inflacion-y-tasas-de-interes',
        categorySlug: 'macroeconomia',
        subcategorySlug: 'variables-macro',
        level: 'INTERMEDIATE',
        readTimeMinutes: 8,
        order: 4,
        isFeatured: true,
        summary: 'La fuerza gravitacional de los mercados: cómo las tasas de la Fed y la inflación determinan las valoraciones de todos los activos financieros.',
        content: `### ¿Cómo interactúan la inflación y las tasas?
Warren Buffett suele describir a las tasas de interés como **"la fuerza de gravedad de las valoraciones financieras"**: cuando las tasas están cerca de cero, las valoraciones de las acciones pueden flotar alto; cuando las tasas suben, ejercen una atracción gravitacional hacia abajo sobre los múltiplos de mercado.

---

### El mandato de los Bancos Centrales
Instituciones como la Reserva Federal de EE.UU. (Fed) o el Banco Central Europeo tienen el objetivo de mantener la inflación baja y estable (alrededor del 2% anual en economías desarrolladas).
- **Cuando la inflación sube**: El banco central eleva las tasas de interés (política contractiva). Al encarecer el crédito para hipotecas, empresas y tarjetas, se frena el consumo y la inversión para enfriar la economía.
- **Cuando la economía cae en recesión**: El banco central recorta las tasas de interés (política expansiva) para abaratar el dinero e incentivar el crecimiento.

---

### Impacto directo en los activos
1. **Acciones de Crecimiento (Tech / Growth)**: Son las más sensibles a la subida de tasas porque la mayor parte de sus flujos de caja se proyectan hacia el futuro lejano. Al descontar esos flujos a una tasa más alta, su valor presente cae sensiblemente.
2. **Bonos del Tesoro**: Tienen relación inversa con las tasas: si las tasas del mercado suben, el precio de los bonos emitidos previamente a tasas más bajas cae.`,
        keyTakeaways: [
            'Las tasas de interés representan la tasa libre de riesgo contra la cual compiten todos los demás activos.',
            'Tasas altas encarecen el financiamiento corporativo y reducen el múltiplo PER que los inversores están dispuestos a pagar.',
        ],
        commonMistakes: [
            'Ignorar las decisiones de la Reserva Federal al evaluar oportunidades de renta variable.',
        ],
        sources: [
            { title: 'Ray Dalio — How the Economic Machine Works' },
        ],
    },
    {
        title: 'Dollar Cost Averaging (DCA): La Estrategia Defensiva',
        slug: 'dollar-cost-averaging-dca',
        categorySlug: 'estrategias',
        subcategorySlug: 'filosofias',
        level: 'BEGINNER',
        readTimeMinutes: 5,
        order: 4,
        isFeatured: true,
        summary: 'Invertir una suma fija en intervalos regulares para neutralizar el estrés del market timing y promediar precios de compra en el tiempo.',
        content: `### ¿En qué consiste el Dollar Cost Averaging?
El **Dollar Cost Averaging (DCA)** consiste en destinar una cantidad fija de dinero a un activo financiero con una frecuencia constante (cada quincena o cada mes), independientemente de si el mercado está en máximos históricos o en plena corrección bajista.

---

### La matemática detrás de la ventaja
- **Cuando el mercado cae**: Con tu suma fija compras **más títulos** a precios baratos.
- **Cuando el mercado sube**: Con tu suma fija compras **menos títulos** a precios caros.

Como resultado natural, tu precio promedio de compra resulta inferior al promedio aritmético de las cotizaciones del período, eliminando por completo la necesidad de adivinar el piso del mercado.

---

### Ejemplo práctico
Imagina que inviertes $300 cada mes en un ETF durante 3 meses con precios de $100, $50 y $100:
- Mes 1 ($100): compras 3 cuotas.
- Mes 2 ($50): compras 6 cuotas.
- Mes 3 ($100): compras 3 cuotas.
- **Total invertido**: $900 por 12 cuotas.
- **Costo medio por cuota**: $75 (a pesar de que el precio inicial y final fue $100). Valor final de tu cartera: $1.200 (ganancia de +33%).`,
        keyTakeaways: [
            'Elimina el sesgo emocional de esperar el momento perfecto para entrar.',
            'Aprovecha las caídas del mercado convirtiéndolas en acumulaciones de más acciones por el mismo dinero.',
            'Es el estándar recomendado para inversores minoristas con ingresos salariales recurrentes.',
        ],
        commonMistakes: [
            'Interrumpir los aportes justo durante los meses de pánico de mercado, que es precisamente cuando el DCA genera sus mayores rendimientos futuros.',
        ],
        sources: [
            { title: 'Benjamin Graham — El Inversor Inteligente' },
        ],
    },
    {
        title: 'Diversificación y Control de Drawdown en tu Portafolio',
        slug: 'diversificacion-y-drawdown',
        categorySlug: 'estrategias',
        subcategorySlug: 'gestion-riesgo',
        level: 'INTERMEDIATE',
        readTimeMinutes: 7,
        order: 5,
        isFeatured: true,
        summary: 'El único almuerzo gratis en las finanzas: cómo estructurar carteras descorrelacionadas para limitar la caída máxima (Max Drawdown).',
        content: `### El único almuerzo gratis en inversiones
El premio Nobel **Harry Markowitz** denominó a la diversificación como el único almuerzo gratis en las finanzas, porque permite reducir el riesgo global de un portafolio sin necesariamente sacrificar su rentabilidad esperada.

---

### ¿Qué es el Drawdown?
El **Drawdown** mide la pérdida porcentual acumulada desde el punto máximo alcanzado por tu portafolio hasta su punto más bajo posterior, antes de volver a marcar un nuevo máximo.
- **Max Drawdown (MDD)**: La mayor caída histórica que ha experimentado una estrategia.
- **Impacto psicológico**: La mayoría de los inversores no abandonan sus planes por falta de ganancias, sino porque no logran tolerar un Drawdown del -30% o -50% en su cuenta.

---

### La matemática de la recuperación
Las pérdidas no se recuperan con el mismo porcentaje:
- Para recuperar una caída del **-10%**, necesitas ganar un **+11.1%**.
- Para recuperar una caída del **-20%**, necesitas ganar un **+25%**.
- Para recuperar una caída del **-50%**, necesitas ganar un **+100%**.
- Para recuperar una caída del **-80%**, necesitas ganar un **+400%**.

Limitar el Drawdown es el pilar primordial para que el interés compuesto funcione a lo largo de décadas.`,
        keyTakeaways: [
            'Diversificar significa combinar activos con baja correlación entre sí (ej. acciones globales, bonos del tesoro, activos reales, efectivo).',
            'Evitar drawdowns severos es más importante que cazar la acción con mayor subida momentánea.',
        ],
        commonMistakes: [
            'Falsa diversificación: poseer 10 acciones diferentes pero que pertenecen todas al mismo subsector tecnológico.',
        ],
        sources: [
            { title: 'Harry Markowitz — Portfolio Selection' },
            { title: 'Ray Dalio — Principles for Navigating Big Debt Crises' },
        ],
    },];

export const SEED_LEARNING_PATHS: SeedLearningPath[] = [
    {
        title: 'Primeros Pasos en el Mundo Inversor',
        slug: 'primeros-pasos-inversiones',
        description: 'Desde qué significa invertir y la magia del interés compuesto hasta la gestión adecuada del riesgo patrimonial.',
        level: 'BEGINNER',
        icon: 'Compass',
        order: 1,
        articleSlugs: [
            'que-es-invertir-vs-ahorrar',
            'que-es-el-per',
            'gestion-del-riesgo-stop-loss-posicion',
            'dollar-cost-averaging-dca',
        ],
    },
    {
        title: 'Aprende Análisis Técnico Desde Cero',
        slug: 'aprende-analisis-tecnico',
        description: 'Estructura de precios, tendencias, soportes, velas japonesas y los indicadores osciladores más utilizados.',
        level: 'BEGINNER',
        icon: 'TrendingUp',
        order: 2,
        articleSlugs: [
            'tendencias-alcista-bajista-lateral',
            'soportes-resistencias-polaridad',
            'lectura-de-velas-japonesas',
            'medias-moviles-sma-ema',
            'bandas-de-bollinger',
            'que-es-el-rsi',
            'que-es-el-macd',
        ],
    },
    {
        title: 'Maestría en Análisis Fundamental y Valoración',
        slug: 'analisis-fundamental-y-valoracion',
        description: 'Domina los balances, el flujo de caja libre, el ROIC y la valoración cuantitativa por flujos descontados (DCF).',
        level: 'INTERMEDIATE',
        icon: 'BarChart3',
        order: 3,
        articleSlugs: [
            'que-es-el-per',
            'que-es-el-ev-ebitda',
            'que-es-el-peg-ratio',
            'que-es-el-roe-retorno-patrimonio',
            'que-es-el-roic',
            'que-es-el-flujo-de-caja-libre',
            'modelos-de-valuacion-dcf',
        ],
    },
    {
        title: 'Entendé la Economía y Mercados',
        slug: 'entende-la-economia',
        description: 'Desde inflación y tipos de interés hasta el funcionamiento de CEDEARs, ETFs y ciclos de mercado.',
        level: 'INTERMEDIATE',
        icon: 'Globe',
        order: 4,
        articleSlugs: [
            'inflacion-y-tasas-de-interes',
            'que-son-los-cedears',
            'que-son-los-etfs',
            'dollar-cost-averaging-dca',
            'diversificacion-y-drawdown',
        ],
    },
    {
        title: 'Analizá una Empresa Paso a Paso',
        slug: 'analiza-una-empresa',
        description: 'Metodología completa para desglosar un negocio: ratios de valoración, retornos sobre capital y cálculo de valor intrínseco.',
        level: 'ADVANCED',
        icon: 'Search',
        order: 5,
        articleSlugs: [
            'que-es-el-per',
            'que-es-el-ev-ebitda',
            'que-es-el-peg-ratio',
            'que-es-el-roe-retorno-patrimonio',
            'que-es-el-roic',
            'que-es-el-flujo-de-caja-libre',
            'modelos-de-valuacion-dcf',
        ],
    },
];
