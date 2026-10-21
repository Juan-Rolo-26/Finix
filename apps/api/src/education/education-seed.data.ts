import { deepenLesson, lessonReadTime } from './lesson-depth';
import { TECHNICAL_IMAGES } from './technical-images.data';
import { ASSET_CATEGORY, EDUCATION_EXPANSION } from './education-expansion.data';
// Auto-generated & verified Education Seed Data for Finix
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
        "name": "Fundamentos de Inversión",
        "slug": "fundamentos",
        "description": "Conceptos básicos, instrumentos financieros y los pilares para comenzar a invertir con criterio.",
        "icon": "BookOpen",
        "order": 1,
        "subcategories": [
            {
                "name": "Primeros Pasos",
                "slug": "primeros-pasos",
                "description": "Conceptos iniciales y mentalidad de inversor",
                "order": 1
            },
            {
                "name": "Instrumentos Financieros",
                "slug": "instrumentos",
                "description": "Acciones, bonos, CEDEARs, ETFs y fondos",
                "order": 2
            },
            {
                "name": "Principios Financieros",
                "slug": "principios",
                "description": "Interés compuesto, inflación y riesgo",
                "order": 3
            }
        ]
    },
    {
        "name": "Análisis Fundamental",
        "slug": "analisis-fundamental",
        "description": "Evaluación de modelos de negocio, balances, ratios financieros y valoración intrínseca de empresas.",
        "icon": "BarChart3",
        "order": 2,
        "subcategories": [
            {
                "name": "Estados Financieros",
                "slug": "estados-financieros",
                "description": "Balance general, estado de resultados y flujos de caja",
                "order": 1
            },
            {
                "name": "Ratios y Múltiplos",
                "slug": "ratios",
                "description": "PER, EV/EBITDA, ROIC, ROE y solvencia",
                "order": 2
            },
            {
                "name": "Modelos de Valoración",
                "slug": "valoracion",
                "description": "DCF, múltiplos comparables y valor intrínseco",
                "order": 3
            },
            {
                "name": "Calidad del Negocio",
                "slug": "calidad",
                "description": "Foso defensivo (Moat), management y asignación de capital",
                "order": 4
            }
        ]
    },
    {
        "name": "Análisis Técnico",
        "slug": "analisis-tecnico",
        "description": "Lectura de gráficos de precios, acción del precio, indicadores cuantitativos y psicología de mercado.",
        "icon": "TrendingUp",
        "order": 3,
        "subcategories": [
            {
                "name": "Estructura y Tendencias",
                "slug": "tendencias",
                "description": "Estructura de mercado, máximos, mínimos y rupturas",
                "order": 1
            },
            {
                "name": "Soportes y Resistencias",
                "slug": "soportes-resistencias",
                "description": "Zonas de oferta y demanda, polaridad y niveles clave",
                "order": 2
            },
            {
                "name": "Velas y Patrones",
                "slug": "velas-patrones",
                "description": "Lectura de velas japonesas y formaciones chartistas",
                "order": 3
            },
            {
                "name": "Indicadores Técnicos",
                "slug": "indicadores",
                "description": "RSI, MACD, Medias Móviles, Bandas de Bollinger",
                "order": 4
            }
        ]
    },
    {
        "name": "Macroeconomía y Mercados",
        "slug": "macroeconomia",
        "description": "Cómo influyen las tasas de interés, la inflación, los bancos centrales y los ciclos globales.",
        "icon": "Landmark",
        "order": 4,
        "subcategories": [
            {
                "name": "Variables Macroeconómicas",
                "slug": "variables-macro",
                "description": "PIB, inflación, empleo y política monetaria",
                "order": 1
            },
            {
                "name": "Bancos Centrales y Tasas",
                "slug": "bancos-centrales",
                "description": "Reserva Federal, curva de rendimientos y liquidez",
                "order": 2
            },
            {
                "name": "Mercado Argentino y Global",
                "slug": "mercados",
                "description": "Dólar MEP/CCL, riesgo país y activos internacionales",
                "order": 3
            }
        ]
    },
    {
        "name": "Estrategias y Gestión del Riesgo",
        "slug": "estrategias",
        "description": "Construcción de carteras, psicología del inversor, Dollar Cost Averaging y preservación de capital.",
        "icon": "ShieldCheck",
        "order": 5,
        "subcategories": [
            {
                "name": "Filosofías de Inversión",
                "slug": "filosofias",
                "description": "Value investing, growth investing, dividendos y buy & hold",
                "order": 1
            },
            {
                "name": "Gestión del Riesgo",
                "slug": "gestion-riesgo",
                "description": "Diversificación, dimensionamiento de posición y drawdown",
                "order": 2
            },
            {
                "name": "Psicología y Sesgos",
                "slug": "psicologia",
                "description": "Control de emociones y toma racional de decisiones",
                "order": 3
            }
        ]
    }
];

export const SEED_ARTICLES: SeedArticle[] = [
  {
    "title": "¿Qué es el ROIC (Retorno sobre el Capital Invertido)?",
    "slug": "que-es-el-roic",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "ratios",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 3,
    "order": 1,
    "isFeatured": true,
    "interactiveWidget": "roic_wacc",
    "formula": "ROIC = NOPAT / Capital Invertido\nNOPAT = Beneficio Operativo (EBIT) × (1 − Tasa Impositiva)\nCapital Invertido = Patrimonio Neto + Deuda Financiera − Caja Neta",
    "summary": "El ROIC es la métrica reina de calidad corporativa: mide cuánta ganancia genera una compañía por cada dólar real invertido en sus operaciones.",
    "content": "### Introducción al ROIC\n\nEl **Retorno sobre el Capital Invertido (ROIC)** es ampliamente considerado por inversores profesionales e institucionales como el indicador individual más riguroso para medir la ventaja competitiva y la rentabilidad económica de una compañía.\n\nA diferencia de métricas como el ROE (que puede inflarse artificialmente añadiendo deuda extrema), el ROIC examina todo el capital productivo inmovilizado en la empresa —tanto el provisto por los accionistas como el aportado por acreedores— y evalúa cuánto beneficio operativo después de impuestos genera dicho capital.\n\n---\n\n### ¿Cómo funciona el mecanismo del ROIC?\n\nUna empresa toma dinero de dos fuentes principales:\n1. **Capital propio (Equity):** aportes de accionistas y beneficios retenidos.\n2. **Deuda financiera con interés:** préstamos bancarios y emisión de bonos u obligaciones negociables.\n\nCon ese dinero acumulado (el capital invertido), la compañía compra fábricas, contrata talento, invierte en I+D o abre locales. Al final del ejercicio, ese capital rinde un beneficio operativo libre de impuestos (**NOPAT**).\n\nEl ROIC expresa este rendimiento como un porcentaje:\n- Si el ROIC es del **25%**, significa que por cada US$ 100 colocados en las entrañas del negocio, la compañía produce US$ 25 de beneficio operativo limpio cada año.\n\n---\n\n### La relación decisiva: ROIC vs WACC\n\nUn negocio no crea valor para sus accionistas simplemente por tener beneficios contables; **crea valor únicamente cuando su ROIC es superior a su Costo Medio Ponderado de Capital (WACC)**.\n\n- **Spread de Valor = ROIC − WACC**\n- **Si ROIC > WACC:** la empresa genera valor económico real. Cada dólar reinvertido se multiplica a una tasa superior al costo de financiarlo.\n- **Si ROIC = WACC:** la empresa opera en punto de equilibrio económico, sin agregar valor por encima del costo de capital.\n- **Si ROIC < WACC:** la empresa está **destruyendo valor**. Aunque reporte utilidades contables en su estado de resultados, la rentabilidad obtenida es menor al rendimiento mínimo que exigen los proveedores de capital.\n\n---\n\n### Ejemplo Práctico\n\nImaginemos dos compañías del mismo sector:\n\n| Métrica | Empresa A (Gran Calidad) | Empresa B (Baja Eficiencia) |\n| :--- | :--- | :--- |\n| **Capital Invertido** | US$ 1.000 M | US$ 1.000 M |\n| **NOPAT Anual** | US$ 240 M | US$ 60 M |\n| **ROIC** | **24,0%** | **6,0%** |\n| **WACC (Costo de Capital)** | 8,5% | 8,5% |\n| **Spread de Creación de Valor** | **+15,5 pp (Crea valor)** | **-2,5 pp (Destruye valor)** |\n\nPara crecer un 10% en beneficios, la Empresa A solo necesita reinvertir una pequeña fracción de sus ganancias anuales, repartiendo el resto en recompras de acciones o dividendos. La Empresa B, en cambio, debe endeudarse fuertemente solo para mantener su posición competitiva.\n\n### Definiciones y límites de comparación\nNOPAT es beneficio operativo después de impuestos, no flujo de caja. El capital invertido puede ajustarse por caja excedente, goodwill y arrendamientos, y utilizar un promedio del período. Un ROIC alto no prueba por sí solo un foso competitivo sostenible. Comparar definiciones, sectores, ciclos y partidas extraordinarias. Un spread ROIC−WACC positivo apoya una lectura de creación de valor sobre el capital medido, pero no garantiza rendimiento bursátil ni persistencia futura.",
    "keyTakeaways": [
      "El ROIC mide la rentabilidad del capital operativo de la compañía con independencia de cómo esté financiada.",
      "Un ROIC superior al costo de capital (WACC) sostenido durante varios años es un indicio cuantitativo relevante de posibles ventajas competitivas (economic moat).",
      "La confirmación de una ventaja defensiva requiere análisis cualitativo adicional sobre barreras de entrada, costos de cambio o economías de escala."
    ],
    "commonMistakes": [
      "Considerar que un ROIC histórico elevado garantiza inmunidad futura frente a cambios tecnológicos o competencia agresiva.",
      "Confundir ROIC con ROE: el ROE puede elevarse aumentando el endeudamiento sin mejorar la eficiencia operativa.",
      "Evaluar el ROIC de un único ejercicio atípico en lugar de observar la trayectoria a lo largo de un ciclo económico completo."
    ],
    "prosCons": {
      "pros": [
        "No está distorsionado por recompras de acciones o deuda financiera como el ROE.",
        "Permite comparar empresas de diferentes estructuras de capital.",
        "Es el mejor predictor de retornos compuestos a largo plazo."
      ],
      "cons": [
        "Menos útil en empresas de servicios financieros o bancos donde la deuda es materia prima.",
        "Puede variar según el tratamiento contable de gastos de I+D y arrendamientos operativos."
      ]
    },
    "practicalExample": "Apple (AAPL) o Microsoft (MSFT) mantienen históricamente ROICs superiores al 30-50%, lo que les permite autofinanciar su expansión sin necesidad de diluir accionistas ni recurrir a deuda costosa.",
    "sources": [
      {
        "title": "CFA Institute: Financial Analysis Techniques",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/financial-analysis-techniques"
      },
      {
        "title": "CFA Institute: Capital Structure y WACC",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/capital-structure"
      }
    ]
  },
  {
    "title": "¿Qué es el PER o Ratio P/E (Price to Earnings)?",
    "slug": "que-es-el-per",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "ratios",
    "level": "BEGINNER",
    "readTimeMinutes": 2,
    "order": 2,
    "isFeatured": true,
    "interactiveWidget": "per",
    "formula": "PER = Precio por Acción / Beneficio por Acción (EPS)\nTambién equivalente a: Capitalización Bursátil / Beneficio Neto Total",
    "summary": "El PER indica cuántos años de beneficios anuales está pagando el inversor al comprar una acción, o cuántas veces sus ganancias anuales cotiza la empresa.",
    "content": "### Definición del PER\n\nEl **Price-to-Earnings Ratio (P/E o PER)** es el múltiplo de valoración más conocido en el mundo bursátil. Refleja la relación directa entre el precio al que cotiza una acción en el mercado secundario y los beneficios netos que genera la empresa por cada acción.\n\nPor ejemplo, si una acción cotiza a **USD 100** y su beneficio neto anual por acción (EPS) es de **USD 5**, su PER es de **20x** (100 / 5).\n\n---\n\n### ¿Cómo se interpreta?\n\n1. **Años de recuperación teórica:** Un PER de 20x significa que, si la empresa mantuviese constantes sus beneficios actuales y los distribuyera al 100%, tardarías 20 años en recuperar tu inversión.\n2. **Expectativa de crecimiento:** Un PER alto no significa necesariamente que una empresa esté \"cara\"; frecuentemente refleja que el mercado anticipa que sus ganancias se duplicarán o triplicarán en los próximos años.\n3. **Inverso del PER (Earnings Yield):** 1 / PER representa el rendimiento del beneficio. Si el PER es 20x, el Earnings Yield es del 5% anual.\n\n---\n\n### Tipos de PER\n\n- **Trailing P/E (TTM):** Calculado con los beneficios reales de los últimos 12 meses ya reportados. Es objetivo porque usa datos comprobables.\n- **Forward P/E:** Calculado con las estimaciones de beneficios de los analistas para los próximos 12 meses. Depende de proyecciones y supuestos futuros.\n- **Shiller P/E (CAPE):** Promedio de los beneficios ajustados por inflación durante 10 años, muy usado para medir si un índice como el S&P 500 está sobrevalorado.",
    "keyTakeaways": [
      "El PER relaciona el precio de mercado con el beneficio por acción.",
      "Un PER bajo puede ser una oportunidad de valor, pero también una \"trampa de valor\" si los beneficios van a desplomarse.",
      "Siempre debe compararse contra competidores directos, contra la media histórica de la empresa y con su tasa de crecimiento (vía ratio PEG)."
    ],
    "commonMistakes": [
      "Pensar que una acción con PER 10 siempre es más barata que una con PER 25 sin considerar crecimiento o calidad.",
      "Calcular el PER con beneficios extraordinarios de una sola vez (venta de inmuebles o filiales).",
      "Aplicar PER a empresas en pérdidas (PER negativo no tiene interpretación analítica estándar)."
    ],
    "prosCons": {
      "pros": [
        "Extremadamente fácil de calcular y ampliamente disponible.",
        "Excelente para comparar compañías maduras y rentables de un mismo sector."
      ],
      "cons": [
        "Inútil para empresas jóvenes o en etapas tempranas que reinvierten todo y reportan beneficios contables cero.",
        "Los beneficios contables pueden ser manipulados por políticas de amortización o provisiones."
      ]
    },
    "practicalExample": "Si Uber cotiza a USD 75 con un EPS esperado de USD 4,87, su Forward P/E es de 15,4x. Comparado con su promedio de 16,5x y el promedio del S&P 500 (21x), refleja una valoración razonable si la empresa continúa expandiendo márgenes.",
    "sources": [
      {
        "title": "SEC: guía de estados financieros",
        "url": "https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide"
      },
      {
        "title": "Investing Academy: Price-to-Earnings Ratio",
        "url": "https://www.investing.com/academy/analysis/price-to-earnings-ratio/"
      }
    ]
  },
  {
    "title": "¿Qué es el RSI (Índice de Fuerza Relativa)?",
    "slug": "que-es-el-rsi",
    "categorySlug": "analisis-tecnico",
    "subcategorySlug": "indicadores",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 3,
    "order": 1,
    "isFeatured": true,
    "interactiveWidget": "rsi",
    "formula": "RSI = 100 − (100 / (1 + RS))\nRS (Fuerza Relativa) = Ganancia Promedio de N períodos / Pérdida Promedio de N períodos\nPeríodo estándar sugerido por J. Welles Wilder: 14 velas",
    "summary": "El RSI es un oscilador de momentum que mide la velocidad y la magnitud de los movimientos recientes de precio para evaluar condiciones de sobrecompra o sobreventa.",
    "content": "### ¿Qué es el RSI?\n\nDesarrollado por **J. Welles Wilder en 1978**, el **Índice de Fuerza Relativa (Relative Strength Index o RSI)** oscila en una escala cerrada entre **0 y 100**.\n\nEvalúa el impulso relativo de los avances frente a los retrocesos durante un período determinado. La fórmula estándar de Wilder emplea **14 períodos**.\n\n![Gráfico histórico de LEVEL 3 COMM con RSI de 21 períodos](/images/education/rsi.png)\n*Gráfico histórico de LEVEL 3 COMM con RSI de 21 períodos. La configuración habitual de 14 períodos se explica en el texto; esta imagen usa 21. Autor: FeRR@ ([CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)), Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Analisi_tecnica_rsi.png).*\n\n---\n\n### Zonas Clave del RSI\n\n- **Zona de Sobrecompra (RSI > 70):** El precio ha experimentado avances acelerados en el período analizado. Sugiere que el impulso alcista es maduro y puede dar lugar a consolidaciones o tomas de ganancia, aunque en tendencias sostenidas puede mantenerse en sobrecompra prolongada.\n- **Zona de Sobreventa (RSI < 30):** El precio ha acumulado ventas pronunciadas. Indica presión bajista extrema que podría dar lugar a pausas o rebotes técnicos, sin garantizar por sí misma el fin de una caída.\n- **Línea media (50):** Referencia neutral del oscilador. RSI superior a 50 refleja predominio del impulso alcista; inferior a 50, predominio del impulso bajista.\n\n---\n\n### Criterio en Velas Semanales (1W) en Finix\n\nEn gráficos semanales de mediano plazo (como los empleados en el radar de Finix):\n- **Zona de Seguimiento Inferior (RSI < 45):** Activos donde el momentum bajista ha desacelerado o corregido con fuerza. No garantiza un piso ni limita pérdidas: requiere validar fundamentos y estructura técnica.\n- **Zona de Alerta de Extensión (RSI > 55):** Activos con tramo impulsivo desarrollado donde la relación riesgo/beneficio para nuevas compras se reduce.\n\n*Nota:* Los umbrales de 45 y 55 responden a la calibración de mediano plazo de la plataforma, no a reglas universales de mercado.\n\n---\n\n### Divergencias de Momentum\n\n- **Divergencia Alcista (Bullish Divergence):** El precio marca mínimos decrecientes mientras el RSI registra mínimos ascendentes. Señala desaceleración en la presión vendedora.\n- **Divergencia Bajista (Bearish Divergence):** El precio marca máximos ascendentes mientras el RSI registra máximos decrecientes. Alerta sobre pérdida de fuerza compradora que sugiere prudencia, sin constituir una certeza matemática de giro inmediato.",
    "keyTakeaways": [
      "El RSI oscila entre 0 y 100 midiendo la velocidad y magnitud del momentum.",
      "En tendencias alcistas fuertes, el RSI puede permanecer en niveles elevados (>70) sin que el precio caiga de inmediato.",
      "Las divergencias alertan sobre pérdida de fuerza de la tendencia, pero deben combinarse con soportes y volumen."
    ],
    "commonMistakes": [
      "Comprar únicamente porque el RSI tocó 30: una tendencia bajista fuerte puede mantener el RSI deprimido mientras el precio continúa cayendo.",
      "Vender una posición alcista rentable solo porque el RSI supera 70 sin señales de cambio en la tendencia.",
      "Confundir el parámetro estándar de 14 períodos con configuraciones particulares como la de 21 períodos vista en ejemplos históricos."
    ],
    "prosCons": {
      "pros": [
        "Excelente para detectar agotamiento de momentum.",
        "Las divergencias ofrecen advertencias tempranas antes de que el precio se dé la vuelta.",
        "Fácil de interpretar tanto en gráficos diarios como semanales."
      ],
      "cons": [
        "Genera señales falsas en mercados con tendencias parabólicas persistentes.",
        "No mide volumen directamente, solo variaciones de cierre."
      ]
    },
    "practicalExample": "Ejemplo didáctico: con una ganancia media suavizada de 2 y una pérdida media suavizada de 1, RS = 2 y RSI = 100 − 100 / (1 + 2) = 66,67. Es una medida de impulso; no indica una rentabilidad futura de 66,67 %.",
    "sources": [
      {
        "title": "J. Welles Wilder — New Concepts in Technical Trading Systems (1978)"
      },
      {
        "title": "Fidelity Learning Center — Relative Strength Index (RSI)",
        "url": "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/RSI"
      }
    ]
  },
  {
    "title": "¿Qué es el MACD (Convergencia/Divergencia de Medias Móviles)?",
    "slug": "que-es-el-macd",
    "categorySlug": "analisis-tecnico",
    "subcategorySlug": "indicadores",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 2,
    "isFeatured": true,
    "interactiveWidget": "macd",
    "formula": "Línea MACD = EMA(12) − EMA(26)\nLínea de Señal = EMA(9) del MACD\nHistograma = Línea MACD − Línea de Señal",
    "summary": "El MACD combina seguimiento de tendencia y momentum mediante el cruce de medias móviles exponenciales y un histograma de aceleración.",
    "content": "### ¿Qué es el MACD?\n\nDiseñado por **Gerald Appel en 1979**, el **Moving Average Convergence Divergence (MACD)** es un indicador de seguimiento de tendencia y momentum basado en la relación entre dos medias móviles exponenciales (EMAs).\n\n![MACD (12, 26, 9): línea MACD, señal e histograma](/images/education/macd.gif)\n*Ejemplo histórico de MACD (12,26,9): línea MACD, señal e histograma. No es una cotización actual. Autor: Tradermatt ([CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)), Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:MACDpicwiki.gif).*\n\n---\n\n### Componentes del Indicador\n\n1. **Línea MACD:** Diferencia entre la EMA rápida (típicamente 12 períodos) y la EMA lenta (26 períodos). Mide la aceleración del precio.\n2. **Línea de Señal (Signal Line):** EMA de 9 períodos calculada sobre la propia Línea MACD. Suaviza la serie para identificar giros.\n3. **Histograma MACD:** Distancia vertical entre la Línea MACD y la Línea de Señal (`Línea MACD − Señal`). Cuando es positivo (verde), el MACD está sobre su señal; cuando es negativo (rojo), está por debajo.\n\n---\n\n### Señales Técnicas Habituales\n\n- **Cruce de Señal Alcista:** La línea MACD cruza de abajo hacia arriba la línea de señal. El histograma pasa a terreno positivo.\n- **Cruce de Señal Bajista:** La línea MACD cruza de arriba hacia abajo la línea de señal. El histograma entra en terreno negativo.\n- **Cruce de la Línea Cero:** Cuando la EMA 12 cruza a la EMA 26, el MACD cruza el nivel cero, confirmando cambio de tendencia de mediano plazo.\n- **Divergencias:** Discrepancia entre la pendiente de los máximos/mínimos del precio y los del MACD. Alertan sobre posible agotamiento del impulso previo.",
    "keyTakeaways": [
      "El MACD es un indicador dual: mide tendencia y velocidad del precio simultáneamente.",
      "El histograma es el barómetro más sensible para anticipar cruces de medias.",
      "Un cruce alcista por debajo de la línea cero tiene mayor potencial de recorrido que uno ocurrido en zonas ya sobreextendidas."
    ],
    "commonMistakes": [
      "Operar cada cruce en rangos laterales: el MACD se vuelve ruidoso e ineficiente en consolidaciones.",
      "Esperar a la confirmación de la línea cero para entrar, perdiendo gran parte del movimiento inicial."
    ],
    "prosCons": {
      "pros": [
        "Filtra el ruido mejor que osciladores más rápidos.",
        "El histograma brinda alertas tempranas de desaceleración del impulso."
      ],
      "cons": [
        "Es un indicador retrasado (lagging indicator) por basarse en medias móviles.",
        "Requiere confirmación de volumen y soportes para evitar señales falsas."
      ]
    },
    "sources": [
      {
        "title": "Gerald Appel — Technical Analysis: Power Tools for Active Investors"
      },
      {
        "title": "Fidelity Learning Center — MACD Indicator Guide",
        "url": "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/macd"
      }
    ]
  },
  {
    "title": "¿Qué es el Flujo de Caja Libre (Free Cash Flow - FCF)?",
    "slug": "que-es-el-flujo-de-caja-libre",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "estados-financieros",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 1,
    "isFeatured": true,
    "formula": "FCF = CFO − CapEx; P/FCF = Market Cap / FCF; FCF Yield = FCF / Market Cap × 100; Margen FCF = FCF / Ingresos × 100; Conversión = FCF / Beneficio neto × 100",
    "summary": "El Flujo de Caja Libre es el dinero en efectivo real restante tras operar y mantener la infraestructura productiva. Mide la verdadera capacidad de retribución y crecimiento sin artificios contables.",
    "content": "### Beneficio contable, CFO y CapEx\nEl flujo de caja operativo (CFO) recoge entradas y salidas de efectivo clasificadas como operativas. El beneficio se registra por devengamiento y puede incluir gastos sin pago inmediato. Por eso beneficio y caja no son iguales. El CFO también refleja cambios en cuentas a cobrar, inventarios y proveedores; la clasificación de intereses puede variar según las normas contables.\n\nCapEx es la inversión capitalizada en activos de largo plazo. No todo gasto de mantenimiento o investigación es CapEx: muchos desembolsos se reconocen como gasto operativo. FCF = CFO menos CapEx es una medida frecuente de caja libre, cuya definición debe verificarse con el proveedor.\n\n### Métricas que muestra FINIX\n- P/FCF = capitalización / FCF anual; se expresa en veces.\n- FCF Yield = FCF anual / capitalización ×100; no es el dividendo ni una rentabilidad prometida al inversor.\n- FCF por acción = FCF / número de acciones utilizado.\n- Conversión a caja = FCF / beneficio neto ×100.\n- Margen FCF = FCF / ingresos ×100.\n\n### Ejemplo ilustrativo\nEn millones de USD: CFO30, CapEx10, beneficio25, ingresos200, capitalización400 y100 millones de acciones. FCF20, P/FCF20x, yield5%, conversión80%, margen10% y FCF por acción USD0,20. Son magnitudes del mismo período y moneda.\n\n### Límites de interpretación\nUna conversión baja puede deberse a inversión para crecer, estacionalidad o mayor capital de trabajo; no demuestra manipulación. Con beneficio o FCF negativos, cero o extraordinarios, los múltiplos requieren otra lectura. Esta caja puede necesitarse para deuda, adquisiciones o reservas; no está automáticamente disponible para distribuir.\n\nPara un DCF, distinguir FCFF (para deuda y accionistas, descontado al WACC) de FCFE (para accionistas, descontado al costo del equity). CFO−CapEx no sustituye automáticamente a ninguno sin revisar intereses, deuda y demás ajustes.",
    "keyTakeaways": [
      "Revisar definición, unidad, fecha y período antes de comparar valores.",
      "Los ejemplos numéricos son ilustrativos; una métrica aislada no garantiza un resultado."
    ],
    "commonMistakes": [
      "Comparar empresas o períodos con definiciones y unidades distintas.",
      "Interpretar un umbral o una observación histórica como garantía."
    ],
    "sources": [
      {
        "title": "SEC: guía de estados financieros",
        "url": "https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide"
      },
      {
        "title": "CFA Institute: Free Cash Flow Valuation",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/free-cash-flow-valuation"
      }
    ]
  },
  {
    "title": "Modelos de Valuación DCF (Descuento de Flujos de Caja) y Fair Value",
    "slug": "modelos-de-valuacion-dcf",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "valoracion",
    "level": "ADVANCED",
    "readTimeMinutes": 3,
    "order": 1,
    "isFeatured": true,
    "interactiveWidget": "dcf_simulator",
    "formula": "Enterprise Value (EV) = Σ [ FCFF_t / (1 + WACC)^t ] + [ Terminal Value / (1 + WACC)^n ]\nTerminal Value = [ FCFF_n × (1 + g) ] / (WACC − g)\nEquity Value = EV + Caja no operativa − Deuda financiera con interés\nValor por Acción = Equity Value / Acciones en Circulación",
    "summary": "El modelo DCF descuenta los flujos de caja libres esperados de la empresa a su costo de capital (WACC), sumando la caja y deduciendo la deuda para estimar el valor intrínseco por acción.",
    "content": "### El Fundamento del Valor Intrínseco\n\nEl modelo de **Flujos de Caja Descontados (Discounted Cash Flow o DCF)** establece que el valor económico de un activo equivale a la suma de todos los flujos de caja libres que producirá en el futuro, descontados al presente a una tasa que compense el valor temporal del dinero y el riesgo de la inversión.\n\n---\n\n### Flujo a la Firma (FCFF) vs Flujo al Accionista (FCFE)\n\n- **FCFF (Free Cash Flow to Firm):** Flujo de caja libre generado por las operaciones después de inversiones en capital (CapEx) y variaciones en capital de trabajo, antes de pagos de deuda o intereses. Se descuenta al **WACC** para obtener el **Enterprise Value (EV)**.\n- **FCFE (Free Cash Flow to Equity):** Flujo remanente tras atender el servicio de la deuda financiera (intereses y amortizaciones) y sumar nuevo endeudamiento neto. Se descuenta directamente al **Costo del Equity (Ke)** para obtener el valor del patrimonio de los accionistas.\n\n---\n\n### Pasos Rigurosos para Construir un DCF (Enfoque FCFF)\n\n1. **Proyección Explícita de Flujos (5 a 10 años):** Se proyectan ingresos, margen operativo, tasa efectiva de impuestos, inversiones en capital fijo (CapEx) y necesidades de capital de trabajo operativo (NWC).\n2. **Determinación de la Tasa de Descuento (WACC):** Ponderación del costo de la deuda (neta de efecto impositivo) y el costo del patrimonio neto (mediante CAPM: tasa libre de riesgo, beta desapalancada/reapalancada y prima de riesgo de mercado).\n3. **Cálculo del Valor Terminal (Terminal Value):** Resume el valor de la empresa más allá del período explícito. Mediante el modelo de Gordon-Shapiro: `[ FCFF_n × (1 + g) ] / (WACC − g)`.\n   *Requisito:* La tasa de crecimiento a perpetuidad **g** debe ser menor a la tasa de descuento (`g < WACC`) y congruente con el crecimiento del PIB de largo plazo y la moneda del modelo.\n4. **Descuento al Presente:** Cada flujo proyectado y el valor terminal se descuentan dividiendo por `(1 + WACC)^t`. La suma representa el **Enterprise Value (EV)**.\n5. **Paso de Enterprise Value a Equity Value (Valor para los Accionistas):**\n   `Equity Value = Enterprise Value + Caja y Equivalentes no operativos − Deuda Financiera con Interés`\n   *(Equivalente a restar la Deuda Neta en un solo paso, evitando restar dos veces la deuda).*\n6. **Valor Intrínseco por Acción (Fair Value):** Se divide el Equity Value entre el número total de acciones diluidas en circulación.",
    "keyTakeaways": [
      "El DCF no busca predecir el precio a corto plazo, sino estimar el valor económico del negocio bajo supuestos explícitos.",
      "Diferenciar claramente FCFF (descontado al WACC) de FCFE (descontado al costo del equity).",
      "El cálculo de Equity Value suma el efectivo no operativo y resta la deuda financiera al Enterprise Value una sola vez."
    ],
    "commonMistakes": [
      "Doble deducción de deuda: restar deuda financiera y a la vez restar deuda neta al Enterprise Value.",
      "Asumir tasas terminales g superiores al WACC o incompatibles con el crecimiento económico de largo plazo.",
      "Ignorar la sensibilidad del valor intrínseco ante variaciones pequeñas en el WACC o en los márgenes proyectados."
    ],
    "sources": [
      {
        "title": "Aswath Damodaran — Investment Valuation: Tools and Techniques for Determining the Value of Any Asset",
        "url": "https://pages.stern.nyu.edu/~adamodar/"
      },
      {
        "title": "AlphaSpread — DCF Valuation Methodology & Free Cash Flow Models",
        "url": "https://kb.alphaspread.com/hc/en-us/articles/18217888896017-What-is-DCF-Value"
      }
    ]
  },
  {
    "title": "Estructura de Mercado y Tendencias: Alcista, Bajista y Lateral",
    "slug": "tendencias-alcista-bajista-lateral",
    "categorySlug": "analisis-tecnico",
    "subcategorySlug": "tendencias",
    "level": "BEGINNER",
    "readTimeMinutes": 2,
    "order": 1,
    "isFeatured": true,
    "interactiveWidget": "trend",
    "summary": "La tendencia es la dirección predominante en la que se desplaza el precio en el tiempo. Comprender su estructura de máximos y mínimos es el primer paso del análisis técnico.",
    "content": "### Las Tres Direcciones del Mercado\n\nDe acuerdo con la Teoría de Dow, los precios de los activos financieros no se desplazan en línea recta, sino en zigzag mediante ondas de avance y retroceso. Existen tres regímenes fundamentales:\n\n---\n\n### 1. Tendencia Alcista (Uptrend)\n\nSe caracteriza por una sucesión de **máximos crecientes (Higher Highs)** y **mínimos crecientes (Higher Lows)**. Los compradores tienen el control del flujo y compran cada corrección a precios más altos que en la ronda anterior.\n\n![Línea de tendencia alcista](/images/education/tendencia-alcista.jpg)\n*Diagrama de una línea de tendencia alcista. Ilustración didáctica; una ruptura por sí sola no garantiza un cambio de tendencia. Autor: LCB / Leomty ([Dominio público](https://commons.wikimedia.org/wiki/File:Linea_de_tendencia_alcista.jpg)).*\n\n---\n\n### 2. Tendencia Bajista (Downtrend)\n\nSe define por una secuencia continua de **máximos decrecientes (Lower Highs)** y **mínimos decrecientes (Lower Lows)**. La presión vendedora predomina y los participantes utilizan los rebotes para liquidar posiciones.\n\n![Diagrama didáctico de tendencia bajista](/images/education/tendencia-bajista.png)\n*Diagrama didáctico de tendencia bajista. No es una cotización actual. Autor: BourseIran ([CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)), Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Down_Trend.png).*\n\n---\n\n### 3. Rango Lateral o Consolidación (Sideways / Trading Range)\n\nOcurre cuando el precio oscila entre un soporte definido y una resistencia definida sin lograr marcar nuevos extremos en ninguna de las dos direcciones. Refleja equilibrio temporal entre oferta y demanda.\n\n![Ejemplo histórico de rango lateral](/images/education/tendencia-lateral.jpg)\n*Ejemplo histórico de EUR/USD en un rango lateral. Se retiraron los ejes en el archivo original; no permite interpretar precios o fechas concretos. Autor: Ahardy42 ([CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)), Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:EUR-USD-trading-range.jpg).*",
    "keyTakeaways": [
      "Operar a favor de la tendencia predominante incrementa significativamente las probabilidades de éxito.",
      "Una tendencia alcista se define por una sucesión ininterrumpida de HH y HL.",
      "Identificar el nivel de invalidación antes de entrar en una operación es la base de la gestión del riesgo."
    ],
    "commonMistakes": [
      "Intentar \"adivinar techos\" en tendencias alcistas sanas o \"atrapar cuchillos cayendo\" en tendencias bajistas.",
      "Confundir una corrección normal de corto plazo con un cambio de tendencia mayor."
    ],
    "sources": [
      {
        "title": "Charles H. Dow — The Dow Theory"
      },
      {
        "title": "Robert D. Edwards & John Magee — Technical Analysis of Stock Trends"
      }
    ]
  },
  {
    "title": "Soportes, Resistencias y Cambio de Polaridad",
    "slug": "soportes-resistencias-polaridad",
    "categorySlug": "analisis-tecnico",
    "subcategorySlug": "soportes-resistencias",
    "level": "BEGINNER",
    "readTimeMinutes": 1,
    "order": 2,
    "isFeatured": true,
    "interactiveWidget": "support_resistance",
    "summary": "Los soportes y resistencias son niveles de precio donde la oferta y la demanda entran en conflicto, frenando caídas o techando subidas.",
    "content": "### Concepto de Soporte y Resistencia\n\nLos niveles de soporte y resistencia representan zonas de precios donde las fuerzas de oferta y demanda confluyen históricamente con suficiente intensidad para pausar o revertir un movimiento.\n\n![Diagrama didáctico de soporte y resistencia](/images/education/soporte-resistencia.png)\n*Diagrama didáctico de soporte y resistencia. Es una ilustración, no una serie de precios actual. Autor: Jonlaw16 ([CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)), Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Support_and_Resistance.png).*\n\n---\n\n### Fundamento de Mercado\n\n- **Soporte:** Nivel o franja de precios donde el interés comprador supera la presión vendedora. El precio rebota o frena su descenso.\n- **Resistencia:** Nivel o franja de precios donde la oferta supera a la demanda. El avance del precio se detiene o retrocede.\n\n---\n\n### Principio de Polaridad\n\nUno de los principios técnicos más consistentes:\n- Cuando una **resistencia** relevante es superada al alza de forma confirmada, tiende a convertirse en un nuevo nivel de **soporte** ante futuros retrocesos.\n- Cuando un **soporte** se perfora a la baja, la antigua zona de compra suele transformarse en **resistencia** en rebotes posteriores.",
    "keyTakeaways": [
      "Los soportes y resistencias no son líneas milimétricas fijas, sino zonas de congestión de liquidez.",
      "Cuantas más veces reaccione el precio a un nivel sin romperlo, mayor relevancia psicológica adquiere.",
      "El retesteo de un soporte previo roto como resistencia ofrece puntos de entrada óptimos con bajo riesgo."
    ],
    "commonMistakes": [
      "Colocar el Stop Loss exactamente sobre el número redondo en lugar de dejar un margen por debajo del soporte.",
      "Comprar en el techo de una resistencia antes de que ocurra una ruptura confirmada."
    ],
    "sources": [
      {
        "title": "Thomas Bulkowski — Encyclopedia of Chart Patterns"
      },
      {
        "title": "Fidelity Learning Center — Support and Resistance",
        "url": "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/support-resistance"
      }
    ]
  },
  {
    "title": "Lectura de Velas Japonesas (Candlesticks): Cuerpos, Mechas y Patrones",
    "slug": "lectura-de-velas-japonesas",
    "categorySlug": "analisis-tecnico",
    "subcategorySlug": "velas-patrones",
    "level": "BEGINNER",
    "readTimeMinutes": 1,
    "order": 3,
    "isFeatured": true,
    "interactiveWidget": "candles",
    "summary": "Las velas japonesas condensan en una sola figura visual el precio de apertura, máximo, mínimo y cierre de un período, revelando la batalla entre toros y osos.",
    "content": "### Anatomía de una Vela Japonesa\n\nInventadas por los comerciantes de arroz en Japón en el siglo XVIII y popularizadas en occidente por Steve Nison, cada vela representa cuatro precios clave (**OHLC**):\n- **Open (Apertura)**\n- **High (Máximo)**\n- **Low (Mínimo)**\n- **Close (Cierre)**\n\nEl **cuerpo** refleja la diferencia entre la apertura y el cierre. Las **mechas o sombras** marcan los extremos alcanzados durante la sesión.\n\n---\n\n### Patrones de Reversión Fundamentales\n\n1. **Martillo (Hammer):** Cuerpo pequeño en la parte superior y mecha inferior larga (al menos el doble del cuerpo). Ocurre tras una caída y refleja rechazo violento de precios bajos por entrada masiva de compradores.\n2. **Estrella Fugaz (Shooting Star):** Mecha superior larga y cuerpo pequeño inferior en zona de resistencia. Señala rechazo de nuevos máximos.\n3. **Envolvente Alcista (Bullish Engulfing):** Una vela verde cuyo cuerpo cubre y supera por completo el cuerpo de la vela roja precedente.\n4. **Doji:** La apertura y el cierre ocurren prácticamente al mismo precio, denotando indecisión absoluta en el mercado.",
    "keyTakeaways": [
      "Una mecha larga siempre representa rechazo de precios por parte del mercado.",
      "Un patrón de velas solo tiene valor predictivo cuando aparece en zonas de soporte, resistencia o medias móviles clave."
    ],
    "commonMistakes": [
      "Memorizar decenas de nombres exóticos de velas sin comprender la dinámica de oferta y demanda subyacente.",
      "Operar patrones aislados en mitad de la nada sin confluencia con niveles estructurales."
    ],
    "sources": [
      {
        "title": "Steve Nison — Japanese Candlestick Charting Techniques"
      }
    ]
  },
  {
    "title": "¿Qué es Invertir y cómo se diferencia del Ahorro? Interés Compuesto e Inflación",
    "slug": "que-es-invertir-vs-ahorrar",
    "categorySlug": "fundamentos",
    "subcategorySlug": "primeros-pasos",
    "level": "BEGINNER",
    "readTimeMinutes": 1,
    "order": 1,
    "isFeatured": true,
    "summary": "Ahorrar es preservar capital postergando consumo; invertir es poner el capital a trabajar para generar rendimientos por encima de la inflación.",
    "content": "### La Diferencia Fundamental\n\n- **Ahorrar:** Guardar dinero líquido (en efectivo o cuenta corriente) para atender contingencias o compras de corto plazo. Su riesgo nominal es cero, pero sufre la pérdida silenciosa de poder adquisitivo por efecto de la **inflación**.\n- **Invertir:** Asignar capital a activos productivos (empresas, propiedades, bonos del estado o corporativos) con la expectativa razonable de recibir un flujo de fondos futuro y un incremento patrimonial superior a la inflación.\n\n---\n\n### La Fuerza del Interés Compuesto\n\nAlbert Einstein definió el interés compuesto como \"la octava maravilla del mundo: quien lo entiende se beneficia de él, quien no lo entiende, lo paga\".\n\nCuando reinvertís los dividendos o intereses generados, tus ganancias comienzan a generar ganancias adicionales año tras año, acelerando el crecimiento patrimonial de forma exponencial en horizontes de 10, 20 o 30 años.",
    "keyTakeaways": [
      "Ahorrar sin invertir garantiza una pérdida constante de poder adquisitivo por inflación.",
      "El tiempo y la consistencia son las dos variables más poderosas del interés compuesto.",
      "Invertir implica asumir volatilidad a corto plazo para ganar rentabilidad real a largo plazo."
    ],
    "commonMistakes": [
      "Invertir dinero que se necesitará para pagar el alquiler o deudas en menos de 6 meses.",
      "Dejar todos los ahorros inmovilizados en cuentas bancarias a la vista perdiendo valor cada año."
    ],
    "sources": [
      {
        "title": "Burton G. Malkiel — A Random Walk Down Wall Street"
      }
    ]
  },
  {
    "title": "Gestión del Riesgo: Stop Loss, Take Profit y Tamaño de Posición",
    "slug": "gestion-del-riesgo-stop-loss-posicion",
    "categorySlug": "estrategias",
    "subcategorySlug": "gestion-riesgo",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 1,
    "order": 1,
    "isFeatured": true,
    "formula": "Riesgo Monetario = Capital Total × % Riesgo Máximo (ej: 1%)\nDistancia de Stop = Precio de Entrada − Stop Loss\nTamaño de Posición (Acciones) = Riesgo Monetario / Distancia de Stop",
    "summary": "La gestión del riesgo es lo único que separa al inversor profesional del apostador. Determina cuánto capital podés arriesgar en cada operación para sobrevivir y prosperar.",
    "content": "### La Regla de Oro de la Supervivencia\n\nUn inversor puede equivocarse en el 50% de sus análisis y aun así ser sumamente rentable a lo largo de los años si mantiene una estricta **gestión del riesgo y asimetría favorable (Relación Riesgo/Beneficio)**.\n\n---\n\n### La Fórmula del Tamaño de Posición\n\nNunca decidas cuántas acciones comprar en función de un número redondo o de una corazonada. La fórmula matemática es:\n\n1. **Definí tu riesgo máximo por operación:** Usualmente entre el **1% y el 2%** de tu cuenta total. Si tu cuenta es de US$ 10.000, tu riesgo máximo tolerado por operación es de US$ 100.\n2. **Ubicá el Stop Loss técnico:** El nivel donde tu tesis queda invalidada (por ejemplo, debajo del soporte en US$ 65 si comprás a US$ 70; distancia = US$ 5).\n3. **Calculá el número de acciones:**\n   - US$ 100 / US$ 5 = **20 acciones**.\n   - De este modo, si la operación sale mal y toca el Stop Loss, solo perderás exactamente el 1% de tu capital, preservando el 99% restante para nuevas oportunidades.",
    "keyTakeaways": [
      "El tamaño de posición debe calcularse en función del riesgo asumido y nunca al revés.",
      "El Stop Loss se coloca en el punto técnico de invalidación de la tesis, no en un porcentaje arbitrario.",
      "La preservación del capital es la prioridad número uno para alcanzar el éxito financiero a largo plazo."
    ],
    "commonMistakes": [
      "Arriesgar el 20% o 50% de la cuenta en una sola operación creyendo tener \"certeza absoluta\".",
      "Mover el Stop Loss más abajo cuando el precio se acerca para no asumir la pérdida.",
      "Promediar a la baja en posiciones que continúan deteriorando sus fundamentales."
    ],
    "sources": [
      {
        "title": "Mark Douglas — Trading in the Zone"
      },
      {
        "title": "Nassim Nicholas Taleb — Fooled by Randomness"
      }
    ]
  },
  {
    "title": "¿Qué es el EV/EBITDA y cómo usarlo en valoración?",
    "slug": "que-es-el-ev-ebitda",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "ratios",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 5,
    "isFeatured": true,
    "formula": "EV/EBITDA = (Capitalización + Deuda Neta) / EBITDA",
    "summary": "El múltiplo que neutraliza la estructura de deuda, impuestos y amortizaciones para comparar empresas de un mismo sector con justicia.",
    "content": "### ¿Qué es el Enterprise Value sobre EBITDA?\n\nEl **EV/EBITDA** es uno de los múltiplos de valoración favoritos de los analistas de Wall Street y fondos de capital privado. A diferencia del PER, que solo observa la capitalización bursátil y el beneficio neto final, el EV/EBITDA evalúa a la empresa **completa**, teniendo en cuenta cuánto costaría adquirir tanto su capital accionario como asumir su deuda financiera neta.\n\n---\n\n### Los dos componentes del ratio\n\n#### 1. Enterprise Value (EV o Valor de Empresa)\nRepresenta el costo teórico de comprar toda la compañía: compras las acciones y cancelas toda su deuda usando la caja disponible.\n\n#### 2. EBITDA (Earnings Before Interest, Taxes, Depreciation & Amortization)\nRepresenta la generación bruta de caja operativa antes de que intervengan las decisiones de financiamiento (intereses), las políticas fiscales (impuestos) y las convenciones contables de desgaste de activos fijos (depreciaciones y amortizaciones).\n\n---\n\n### ¿Por qué suele ser superior al PER en sectores de capital intensivo?\n- **Neutraliza el apalancamiento**: Dos empresas con idénticos negocios pueden tener PER radicalmente distintos si una está endeudada y la otra no. El EV/EBITDA las equipara.\n- **Evita distorsiones contables**: Amortizaciones aceleradas o beneficios extraordinarios fiscales no alteran el EBITDA.\n\n---\n\n### Cómo interpretar los valores\n- **Bajo (< 8x - 10x)**: Posible infravaloración o negocio en un sector maduro/cíclico de bajo crecimiento.\n- **Promedio histórico S&P 500 (12x - 16x)**: Valoración razonable para empresas estables.\n- **Elevado (> 20x - 25x)**: Prima por alto crecimiento futuro o ventajas competitivas excepcionales (ej. Software SaaS).",
    "keyTakeaways": [
      "El EV/EBITDA toma en cuenta la deuda neta de la empresa, evitando la trampa de empresas que parecen baratas por PER pero están sobreendeudadas.",
      "Es ideal para comparar empresas intensivas en capital (telecomunicaciones, energía, industria pesada).",
      "No debe usarse en bancos ni entidades financieras, donde la deuda es parte intrínseca de su inventario operativo."
    ],
    "commonMistakes": [
      "Olvidar que el EBITDA no descuenta el CAPEX de mantenimiento: una empresa puede tener gran EBITDA pero quemar caja para renovar maquinaria.",
      "Comparar múltiplos EV/EBITDA entre sectores dispares (ej. una minera contra una tecnológica)."
    ],
    "prosCons": {
      "pros": [
        "Independiente de la estructura de capital",
        "Excelente para comparaciones entre competidores directos",
        "Evita distorsiones fiscales"
      ],
      "cons": [
        "Ignora el gasto de capital (CAPEX)",
        "No aplica a servicios financieros",
        "Puede ocultar excesivo gasto de depreciación"
      ]
    },
    "sources": [
      {
        "title": "CFA Institute: comparación de empresas mediante múltiplos",
        "url": "https://rpc.cfainstitute.org/research/cfa-digest/2013/02/valuation-with-market-multiples-how-to-avoid-pitfalls-when-identifying-and-using-comparable-com"
      },
      {
        "title": "SEC: guía de estados financieros",
        "url": "https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide"
      }
    ]
  },
  {
    "title": "¿Qué es el PEG Ratio (Price/Earnings to Growth)?",
    "slug": "que-es-el-peg-ratio",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "ratios",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 6,
    "isFeatured": false,
    "formula": "PEG = (PER) / (Tasa de Crecimiento del EPS en %)",
    "summary": "El ratio popularizado por Peter Lynch que ajusta el PER en función de la tasa esperada de crecimiento de los beneficios.",
    "content": "### ¿Por qué nació el PEG?\nUn PER de 30x puede parecer costoso a simple vista, mientras que un PER de 10x parece una ganga. Sin embargo, si la primera empresa duplica sus ganancias al 35% anual y la segunda está estancada al 2%, la primera en realidad resulta mucho más económica en el mediano plazo.\n\nEl **PEG Ratio** fue popularizado por **Peter Lynch** (legendario gestor del fondo Fidelity Magellan) para resolver este dilema: relaciona el precio pagado con la velocidad a la que crecen los beneficios de la compañía.\n\n---\n\n### La regla de oro de Peter Lynch\n- **PEG = 1.0**: La empresa cotiza a un precio justo acorde a su crecimiento (un PER de 20x para una empresa que crece al 20% anual).\n- **PEG < 1.0**: La empresa cotiza con descuento relativo a su crecimiento esperado (posible oportunidad de valor).\n- **PEG < 0.5**: Oportunidad extraordinaria según Lynch (crecimiento masivo a precio de ganga).\n- **PEG > 1.5 - 2.0**: El mercado ya descuenta un optimismo elevado y exige altas tasas de ejecución sin margen de error.",
    "keyTakeaways": [
      "El PEG ajusta el PER por la tasa de crecimiento anual compuesta de las ganancias por acción (EPS).",
      "Un PEG inferior a 1.0 suele indicar que estás pagando menos de una unidad de PER por cada punto porcentual de crecimiento.",
      "La calidad de la proyección de crecimiento determina la confiabilidad del ratio."
    ],
    "commonMistakes": [
      "Usar crecimientos pasados irrepetibles en lugar de expectativas de crecimiento sostenible a 3-5 años.",
      "Aplicar el PEG en empresas maduras o en declive con crecimiento cercano a cero, donde el ratio se distorsiona matemáticamente."
    ],
    "prosCons": {
      "pros": [
        "Permite comparar empresas de alto crecimiento contra empresas maduras",
        "Fácil de calcular e intuitivo",
        "Filtro rápido de sobrevaloración en Growth"
      ],
      "cons": [
        "Altamente dependiente de estimaciones de analistas futuros",
        "Ignora la rentabilidad del capital (ROIC) y dividendos"
      ]
    },
    "sources": [
      {
        "title": "Peter Lynch — One Up On Wall Street"
      }
    ]
  },
  {
    "title": "¿Qué es el ROE (Return on Equity)?",
    "slug": "que-es-el-roe-retorno-patrimonio",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "ratios",
    "level": "BEGINNER",
    "readTimeMinutes": 2,
    "order": 7,
    "isFeatured": false,
    "formula": "ROE = Beneficio neto / Patrimonio × 100; ROA = Beneficio neto / Activos × 100; ROCE = EBIT / Capital empleado × 100",
    "summary": "El ROE mide la rentabilidad del capital accionario, complementado rigurosamente por el ROA (retorno sobre activos) y el ROCE (retorno sobre capital empleado) para detectar distorsiones por deuda.",
    "content": "### ROE, ROA y ROCE: tres denominadores distintos\nROE relaciona el beneficio neto con el patrimonio de los accionistas. ROA usa los activos totales. ROCE compara el resultado antes de intereses e impuestos con el capital empleado. Son porcentajes de rentabilidad contable, no rendimientos de la acción ni flujos de efectivo.\n\n### Fórmulas y período\nROE = beneficio neto / patrimonio × 100. ROA = beneficio neto / activos × 100. Al relacionar un flujo anual con un saldo, es habitual utilizar el promedio entre comienzo y cierre del período; algunos proveedores usan el saldo final. Aclarar la convención.\n\nROCE = EBIT / capital empleado × 100. Una definición frecuente del capital empleado es activos totales menos pasivos corrientes. No confundir ROCE con ROIC: pueden diferir el numerador, los impuestos y los ajustes del capital.\n\n### Ejemplo ilustrativo\nUna empresa ficticia tiene beneficio anual de 20, EBIT de 30, activos promedio de 200 y patrimonio promedio de 100, en millones de USD. ROA =10% y ROE =20%. Si el capital empleado es150, ROCE =20%. No se pueden intercambiar estos porcentajes porque miden bases diferentes.\n\n### DuPont y apalancamiento\nROE puede descomponerse en margen neto × rotación de activos × multiplicador del patrimonio. La deuda, las recompras o un patrimonio pequeño pueden elevar el ROE sin mejorar el negocio. ROA calculado con beneficio neto también está afectado por intereses e impuestos; no es independiente del financiamiento.\n\n### Límites\nPatrimonio cero o negativo vuelve el ROE poco interpretable. Las diferencias contables, adquisiciones, antigüedad de activos y sectores regulados alteran las comparaciones. Revisar deuda, márgenes, caja y el capital promedio antes de interpretar un valor elevado.",
    "keyTakeaways": [
      "Revisar definición, unidad, fecha y período antes de comparar valores.",
      "Los ejemplos numéricos son ilustrativos; una métrica aislada no garantiza un resultado."
    ],
    "commonMistakes": [
      "Comparar empresas o períodos con definiciones y unidades distintas.",
      "Interpretar un umbral o una observación histórica como garantía."
    ],
    "sources": [
      {
        "title": "CFA Institute: Financial Analysis Techniques",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/financial-analysis-techniques"
      },
      {
        "title": "ACCA: ROCE y definición de capital empleado",
        "url": "https://www.accaglobal.com/gb/en/student/exam-support-resources/fundamentals-exams-study-resources/f2/technical-articles/ratio-analysis.html"
      }
    ]
  },
  {
    "title": "Medias Móviles (SMA y EMA): Tendencias y Cruces Clave",
    "slug": "medias-moviles-sma-ema",
    "categorySlug": "analisis-tecnico",
    "subcategorySlug": "indicadores",
    "level": "BEGINNER",
    "readTimeMinutes": 3,
    "order": 5,
    "isFeatured": true,
    "interactiveWidget": "trend",
    "summary": "Suavizan el ruido diario del precio para identificar la dirección dominante y niveles dinámicos de soporte y resistencia.",
    "content": "### ¿Qué son las Medias Móviles?\n\nUna **media móvil** suaviza los datos de precios creando un valor medio continuamente actualizado a lo largo de un período determinado. Al eliminar las fluctuaciones aleatorias diarias, permite visualizar la dirección de la tendencia subyacente.\n\n![Comparación entre media simple (SMA) y media exponencial (EMA)](/images/education/sma-ema.png)\n*Captura histórica que compara media simple y exponencial. La imagen compara SMA y EMA de 14 períodos en GBP/CAD horario de 2013; no representa las medias de 20 o200 del texto ni cotizaciones actuales. Autor: Alex Kofman ([CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)), Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Moving_Average_Types_comparison_-_Simple_and_Exponential.png).*\n\n---\n\n### Tipos Principales: SMA vs EMA\n\n- **Media Móvil Simple (SMA):** Asigna el mismo peso aritmético a cada uno de los últimos N días. Es estable y filtra bien el ruido, pero reacciona con mayor rezago ante giros bruscos.\n- **Media Móvil Exponencial (EMA):** Asigna mayor ponderación matemática a las sesiones más recientes mediante un factor de suavizado. Reacciona con mayor rapidez a los cambios recientes de cotización.\n\n---\n\n### Períodos Clave en el Mercado\n\n- **20 períodos:** Tendencia de muy corto plazo / ritmo de swing.\n- **50 períodos:** Tendencia intermedia; utilizada frecuentemente como soporte dinámico en avances sostenidos.\n- **100 períodos:** Filtro de tendencia intermedia de mediano plazo que suaviza correcciones intermedias.\n- **200 períodos:** Referencia institucional de largo plazo. Cuando el precio cotiza por encima, predomina una estructura de largo plazo positiva; por debajo, negativa. Como todo indicador rezagado, no predice giros anticipadamente sino que resume el régimen vigente.\n\n---\n\n### Cruces Tradicionales\n\n- **Golden Cross (Cruce Dorado):** La media de 50 períodos supera a la de 200 períodos. Señal de fortalecimiento tendencial de mediano plazo.\n- **Death Cross (Cruce de la Muerte):** La media de 50 períodos cae por debajo de la de 200 períodos. Refleja deterioro tendencial.\n\n### Cálculo e interpretación\n\nSMA(N) = suma de los últimos N cierres / N. Ejemplo didáctico: si los últimos 20 cierres suman 2.000, la SMA20 vale 100 en la misma moneda que el precio. La SMA200 toma 200 cierres, no los mismos 20 divididos por 200. La EMA usa alfa = 2 / (N + 1) y combina el cierre actual con la EMA previa; su inicialización depende del proveedor.\n\nUn período es una vela del intervalo seleccionado: 20 velas horarias no equivalen a 20 días. Los períodos 20, 50, 100 y 200 son referencias de distinta sensibilidad, no horizontes universales. Las medias rezagan el precio y los cruces pueden generar señales falsas en mercados laterales. Estar por encima de una media no garantiza rendimientos ni convierte esa línea en un soporte seguro.",
    "keyTakeaways": [
      "Las medias móviles son indicadores rezagados (lagging): confirman tendencias existentes pero no predicen techos exactos.",
      "El precio por encima de la SMA 200 indica predominio de compradores a largo plazo.",
      "Funcionan como soportes y resistencias dinámicas en tendencias bien establecidas."
    ],
    "commonMistakes": [
      "Operar cruces de medias en mercados laterales: generará múltiples señales falsas y pérdidas consecutivas.",
      "Llenar el gráfico con demasiadas medias provocando parálisis por análisis."
    ],
    "sources": [
      {
        "title": "John J. Murphy — Technical Analysis of the Financial Markets"
      },
      {
        "title": "Fidelity Learning Center — Moving Averages",
        "url": "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/moving-averages"
      }
    ]
  },
  {
    "title": "Bandas de Bollinger: Volatilidad, Compresión y Ruptura",
    "slug": "bandas-de-bollinger",
    "categorySlug": "analisis-tecnico",
    "subcategorySlug": "indicadores",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 1,
    "order": 6,
    "isFeatured": false,
    "summary": "Miden la volatilidad relativa del mercado trazando bandas a dos desviaciones estándar de una media móvil simple.",
    "content": "### Estructura de las Bandas de Bollinger\nDiseñadas por John Bollinger en la década de 1980, constan de tres líneas:\n1. **Banda Media**: Generalmente una SMA de 20 períodos.\n2. **Banda Superior**: Media + 2 Desviaciones Estándar.\n3. **Banda Inferior**: Media - 2 Desviaciones Estándar.\n\nDebido a los principios estadísticos de la distribución normal, aproximadamente el 90% al 95% de la acción del precio transcurre dentro de estas dos bandas.\n\n---\n\n### Conceptos operacionales clave\n\n#### 1. La Compresión (The Squeeze)\nCuando la volatilidad desaparece y el mercado entra en calma, las bandas se estrechan notablemente. Históricamente, las fases de extrema compresión anticipan movimientos explosivos de gran tendencia direccional.\n\n#### 2. Expansión y Ruptura\nCuando el precio rompe con fuerza una banda mientras se ensanchan velozmente, indica inicio de una tendencia con momentum institucional.\n\n#### 3. Toques en bandas en mercados en rango\nEn ausencia de tendencia fuerte, los toques en la banda inferior actúan como soporte de sobreventa y los toques en la banda superior como resistencia de sobrecompra.",
    "keyTakeaways": [
      "Las bandas se ensanchan en alta volatilidad y se estrechan en baja volatilidad.",
      "El Squeeze es la antesala de grandes expansiones de precio.",
      "Tocar la banda superior NO es automáticamente una señal de venta; en tendencias fuertes el precio puede caminar sobre la banda."
    ],
    "commonMistakes": [
      "Vender inmediatamente en cuanto el precio toca la banda superior durante una fuerte tendencia alcista."
    ],
    "sources": [
      {
        "title": "John Bollinger — Bollinger on Bollinger Bands"
      }
    ]
  },
  {
    "title": "¿Qué son los CEDEARs y cómo utilizarlos para invertir en Argentina?",
    "slug": "que-son-los-cedears",
    "categorySlug": "fundamentos",
    "subcategorySlug": "instrumentos",
    "level": "BEGINNER",
    "readTimeMinutes": 2,
    "order": 4,
    "isFeatured": true,
    "summary": "Certificados que permiten invertir en pesos argentinos en las empresas más grandes del mundo con cobertura contra el dólar libre (CCL).",
    "content": "### ¿Qué significa CEDEAR?\n**CEDEAR** significa **Certificado de Depósito Argentino**. Son títulos que cotizan en la Bolsa argentina (BYMA) en pesos o en dólares, pero que representan acciones reales de empresas extranjeras (como Apple, Coca-Cola, Tesla o Microsoft) depositadas en bancos custodios del exterior.\n\n---\n\n### La fórmula de cotización del CEDEAR\nEl precio de un CEDEAR en pesos sigue una lógica simple:\nPrecio CEDEAR = (Precio Acción en EE.UU. en USD * Dólar CCL) / Ratio de Conversión\n\nEsto significa que el rendimiento del inversor argentino depende de dos factores:\n1. **La variación del activo en Wall Street**.\n2. **La cotización del tipo de cambio Contado con Liquidación (CCL)**.\n\nSi el dólar libre sube un 10% en Argentina y la acción en EE.UU. no se mueve, el CEDEAR subirá un 10% en pesos, protegiendo el poder adquisitivo del inversor local.\n\n---\n\n### ¿Qué es el Ratio de Conversión?\nEs la cantidad de CEDEARs que equivalen a 1 acción original de la empresa en Nueva York. Por ejemplo, si Apple tiene un ratio de 10:1, se necesitan 10 CEDEARs para igualar 1 acción completa de AAPL.",
    "keyTakeaways": [
      "Permiten diversificar fuera del riesgo soberano argentino operando en pesos desde un broker local (ALyC).",
      "Brindan cobertura cambiaria automática vinculada al Dólar CCL.",
      "Pagan dividendos en dólares billete depositados directamente en la cuenta comitente."
    ],
    "commonMistakes": [
      "Creer que son acciones argentinas: el subyacente es 100% extranjero.",
      "Olvidar el ratio de conversión al comparar precios contra las pantallas de Wall Street."
    ],
    "sources": [
      {
        "title": "BYMA: CEDEARs",
        "url": "https://www.byma.com.ar/productos/productos-financieros/cedears"
      }
    ]
  },
  {
    "title": "¿Qué son los ETFs (Exchange Traded Funds)?",
    "slug": "que-son-los-etfs",
    "categorySlug": "fundamentos",
    "subcategorySlug": "instrumentos",
    "level": "BEGINNER",
    "readTimeMinutes": 2,
    "order": 5,
    "isFeatured": true,
    "summary": "Fondos de inversión diversificados que cotizan en bolsa con la misma liquidez, sencillez y bajos costos que una acción ordinaria.",
    "content": "### ¿Qué es un ETF?\nUn **ETF (Exchange Traded Fund)** es una canasta de cientos o miles de activos financieros (acciones, bonos, materias primas) que se negocia en los mercados como si fuera una única acción.\n\nEn lugar de investigar y comprar las 500 empresas del S&P 500 una por una, puedes comprar una sola cuota de un ETF como **SPY** o **VOO** y convertirte al instante en copropietario de Apple, Microsoft, Amazon, Berkshire Hathaway, Nvidia y 495 líderes más.\n\n---\n\n### Principales ventajas de los ETFs\n- **Diversificación instantánea**: Elimina el riesgo de quiebra de una sola compañía (riesgo no sistemático).\n- **Costos de gestión mínimos**: Los ETFs pasivos cobran comisiones anuales ínfimas (0.03% a 0.20%), mucho menores que los fondos tradicionales.\n- **Transparencia total**: Se conoce exactamente qué activos componen la canasta en cada momento.\n\n---\n\n### ETFs más populares del mundo\n- **SPY / VOO**: Replican las 500 empresas más representativas de EE.UU. (S&P 500).\n- **QQQ**: Replica las 100 empresas no financieras con mayor componente tecnológico del Nasdaq.\n- **DIA**: Replica el índice industrial Dow Jones.\n- **IWM**: Replica el índice Russell 2000 de empresas de pequeña capitalización (Small Caps).\n- **GLD**: Replica el precio del oro físico bullion.",
    "keyTakeaways": [
      "Permiten construir un portafolio global diversificado con mínimos montos de entrada.",
      "La inversión indexada mediante ETFs ha batido históricamente a más del 85% de los fondos de gestión activa a plazos mayores a 10 años."
    ],
    "commonMistakes": [
      "Invertir en ETFs apalancados creyendo que son para largo plazo (el decaimiento por volatilidad destruye el valor temporal)."
    ],
    "sources": [
      {
        "title": "Investor.gov: ETFs",
        "url": "https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-2"
      }
    ]
  },
  {
    "title": "Inflación, Tasas de Interés y Política Monetaria",
    "slug": "inflacion-y-tasas-de-interes",
    "categorySlug": "macroeconomia",
    "subcategorySlug": "variables-macro",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 4,
    "isFeatured": true,
    "summary": "La fuerza gravitacional de los mercados: cómo las tasas de la Fed y la inflación determinan las valoraciones de todos los activos financieros.",
    "content": "### ¿Cómo interactúan la inflación y las tasas?\nWarren Buffett suele describir a las tasas de interés como **\"la fuerza de gravedad de las valoraciones financieras\"**: cuando las tasas están cerca de cero, las valoraciones de las acciones pueden flotar alto; cuando las tasas suben, ejercen una atracción gravitacional hacia abajo sobre los múltiplos de mercado.\n\n---\n\n### El mandato de los Bancos Centrales\nInstituciones como la Reserva Federal de EE.UU. (Fed) o el Banco Central Europeo tienen el objetivo de mantener la inflación baja y estable (alrededor del 2% anual en economías desarrolladas).\n- **Cuando la inflación sube**: El banco central eleva las tasas de interés (política contractiva). Al encarecer el crédito para hipotecas, empresas y tarjetas, se frena el consumo y la inversión para enfriar la economía.\n- **Cuando la economía cae en recesión**: El banco central recorta las tasas de interés (política expansiva) para abaratar el dinero e incentivar el crecimiento.\n\n---\n\n### Impacto directo en los activos\n1. **Acciones de Crecimiento (Tech / Growth)**: Son las más sensibles a la subida de tasas porque la mayor parte de sus flujos de caja se proyectan hacia el futuro lejano. Al descontar esos flujos a una tasa más alta, su valor presente cae sensiblemente.\n2. **Bonos del Tesoro**: Tienen relación inversa con las tasas: si las tasas del mercado suben, el precio de los bonos emitidos previamente a tasas más bajas cae.",
    "keyTakeaways": [
      "Las tasas de interés representan la tasa libre de riesgo contra la cual compiten todos los demás activos.",
      "Tasas altas encarecen el financiamiento corporativo y reducen el múltiplo PER que los inversores están dispuestos a pagar."
    ],
    "commonMistakes": [
      "Ignorar las decisiones de la Reserva Federal al evaluar oportunidades de renta variable."
    ],
    "sources": [
      {
        "title": "Ray Dalio — How the Economic Machine Works"
      }
    ]
  },
  {
    "title": "Dollar Cost Averaging (DCA): La Estrategia Defensiva",
    "slug": "dollar-cost-averaging-dca",
    "categorySlug": "estrategias",
    "subcategorySlug": "filosofias",
    "level": "BEGINNER",
    "readTimeMinutes": 2,
    "order": 4,
    "isFeatured": true,
    "summary": "Invertir una suma fija en intervalos regulares para neutralizar el estrés del market timing y promediar precios de compra en el tiempo.",
    "content": "### ¿En qué consiste el Dollar Cost Averaging?\nEl **Dollar Cost Averaging (DCA)** consiste en destinar una cantidad fija de dinero a un activo financiero con una frecuencia constante (cada quincena o cada mes), independientemente de si el mercado está en máximos históricos o en plena corrección bajista.\n\n---\n\n### La matemática detrás de la ventaja\n- **Cuando el mercado cae**: Con tu suma fija compras **más títulos** a precios baratos.\n- **Cuando el mercado sube**: Con tu suma fija compras **menos títulos** a precios caros.\n\nComo resultado natural, tu precio promedio de compra resulta inferior al promedio aritmético de las cotizaciones del período, eliminando por completo la necesidad de adivinar el piso del mercado.\n\n---\n\n### Ejemplo práctico\nImagina que inviertes $300 cada mes en un ETF durante 3 meses con precios de $100, $50 y $100:\n- Mes 1 ($100): compras 3 cuotas.\n- Mes 2 ($50): compras 6 cuotas.\n- Mes 3 ($100): compras 3 cuotas.\n- **Total invertido**: $900 por 12 cuotas.\n- **Costo medio por cuota**: $75 (a pesar de que el precio inicial y final fue $100). Valor final de tu cartera: $1.200 (ganancia de +33%).",
    "keyTakeaways": [
      "Elimina el sesgo emocional de esperar el momento perfecto para entrar.",
      "Aprovecha las caídas del mercado convirtiéndolas en acumulaciones de más acciones por el mismo dinero.",
      "Es el estándar recomendado para inversores minoristas con ingresos salariales recurrentes."
    ],
    "commonMistakes": [
      "Interrumpir los aportes justo durante los meses de pánico de mercado, que es precisamente cuando el DCA genera sus mayores rendimientos futuros."
    ],
    "sources": [
      {
        "title": "Investor.gov: Dollar Cost Averaging",
        "url": "https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging"
      }
    ]
  },
  {
    "title": "Diversificación y Control de Drawdown en tu Portafolio",
    "slug": "diversificacion-y-drawdown",
    "categorySlug": "estrategias",
    "subcategorySlug": "gestion-riesgo",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 5,
    "isFeatured": true,
    "summary": "El único almuerzo gratis en las finanzas: cómo estructurar carteras descorrelacionadas para limitar la caída máxima (Max Drawdown).",
    "content": "### El único almuerzo gratis en inversiones\nEl premio Nobel **Harry Markowitz** denominó a la diversificación como el único almuerzo gratis en las finanzas, porque permite reducir el riesgo global de un portafolio sin necesariamente sacrificar su rentabilidad esperada.\n\n---\n\n### ¿Qué es el Drawdown?\nEl **Drawdown** mide la pérdida porcentual acumulada desde el punto máximo alcanzado por tu portafolio hasta su punto más bajo posterior, antes de volver a marcar un nuevo máximo.\n- **Max Drawdown (MDD)**: La mayor caída histórica que ha experimentado una estrategia.\n- **Impacto psicológico**: La mayoría de los inversores no abandonan sus planes por falta de ganancias, sino porque no logran tolerar un Drawdown del -30% o -50% en su cuenta.\n\n---\n\n### La matemática de la recuperación\nLas pérdidas no se recuperan con el mismo porcentaje:\n- Para recuperar una caída del **-10%**, necesitas ganar un **+11.1%**.\n- Para recuperar una caída del **-20%**, necesitas ganar un **+25%**.\n- Para recuperar una caída del **-50%**, necesitas ganar un **+100%**.\n- Para recuperar una caída del **-80%**, necesitas ganar un **+400%**.\n\nLimitar el Drawdown es el pilar primordial para que el interés compuesto funcione a lo largo de décadas.",
    "keyTakeaways": [
      "Diversificar significa combinar activos con baja correlación entre sí (ej. acciones globales, bonos del tesoro, activos reales, efectivo).",
      "Evitar drawdowns severos es más importante que cazar la acción con mayor subida momentánea."
    ],
    "commonMistakes": [
      "Falsa diversificación: poseer 10 acciones diferentes pero que pertenecen todas al mismo subsector tecnológico."
    ],
    "sources": [
      {
        "title": "Harry Markowitz — Portfolio Selection"
      },
      {
        "title": "Ray Dalio — Principles for Navigating Big Debt Crises"
      }
    ]
  },
  {
    "title": "WACC y Creación de Valor (Spread ROIC - WACC)",
    "slug": "wacc-y-spread-creacion-valor",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "ratios",
    "level": "ADVANCED",
    "readTimeMinutes": 3,
    "order": 9,
    "isFeatured": true,
    "interactiveWidget": "dcf_calculator",
    "formula": "Spread de Creación de Valor = ROIC − WACC\nWACC = (E/V × Ke) + (D/V × Kd × (1 − T))\nEVA (Valor Económico Añadido) = Capital Invertido × (ROIC − WACC)",
    "summary": "El WACC representa el costo de oportunidad promedio de capital. La empresa genera valor económico real únicamente cuando su rentabilidad operativa (ROIC) supera este costo.",
    "content": "### ¿Qué es el WACC y por qué determina el valor?\n\nEl **WACC** (*Weighted Average Cost of Capital* o Costo Promedio Ponderado del Capital) es la tasa de rentabilidad mínima exigida por los proveedores de fondos de una empresa, ponderando tanto a los acreedores financieros (deuda) como a los accionistas (capital propio o equity).\n\n```\nWACC = (E/V × Ke) + (D/V × Kd × (1 − T))\n```\n\nDonde:\n- **E**: Valor de mercado del capital propio (Equity o Capitalización Bursátil).\n- **D**: Valor de mercado de la deuda financiera con interés.\n- **V**: Valor total de la estructura financiera (`E + D`).\n- **Ke**: Costo del capital propio (estimado típicamente mediante el modelo CAPM: tasa libre de riesgo + beta × prima de riesgo de mercado).\n- **Kd**: Costo de la deuda financiera antes de impuestos (tasa de interés media de la deuda).\n- **T**: Tasa marginal de impuesto a las ganancias (el escudo fiscal deduce los intereses).\n\n---\n\n### El Spread de Creación de Valor\n\nUna compañía no crea valor genuino únicamente por reportar utilidades contables; lo genera cuando su rendimiento sobre el capital operativo excede el costo de financiar dicho capital:\n\n- **Spread de Valor = ROIC − WACC**\n- **Si ROIC > WACC**: La empresa genera valor económico por encima del costo de sus recursos. Cada unidad de capital reinvertida rinde más de lo que cuesta captarla.\n- **Si ROIC = WACC**: La empresa opera en punto de equilibrio económico, remunerando a acreedores y accionistas sin generar excedente extraordinario.\n- **Si ROIC < WACC**: La empresa **destruye valor económico**, aun cuando el estado de resultados exhiba beneficios netos positivos.\n\n---\n\n### Consideración Rigurosa sobre el Foso Defensivo (Economic Moat)\n\nMantener un spread positivo (`ROIC > WACC`) a lo largo del tiempo es evidencia cuantitativa de creación de valor presente, pero **no constituye por sí mismo una prueba indiscutible o perpetua de foso defensivo**. Los rendimientos anormalmente altos atraen competencia, imitación tecnológica y cambios regulatorios. La confirmación de una ventaja competitiva duradera exige contrastar el spread cuantitativo con ventajas cualitativas sostenibles, como costos de cambio elevados, efectos de red o patentes protegidas.\n\n### Supuestos, unidades y límites\nLos pesos de deuda y equity suelen estimarse a valor de mercado. Ke, Kd y T se usan como tasas decimales en el cálculo; el resultado se expresa en porcentaje anual. La deducibilidad de intereses y el costo de deuda dependen del caso. ROIC y WACC deben compararse con monedas, períodos y ajustes coherentes. El spread no garantiza que cada reinversión nueva obtenga el ROIC histórico ni que el precio de la acción suba.",
    "keyTakeaways": [
      "El WACC es el costo medio ponderado de financiamiento entre deuda con costo e inversión de accionistas.",
      "La creación de valor genuina ocurre cuando el ROIC supera al WACC (spread positivo).",
      "Un spread positivo en un ejercicio no garantiza un foso defensivo; se requiere consistencia plurianual y análisis cualitativo."
    ],
    "commonMistakes": [
      "Ignorar el costo del equity y asumir que el capital de los accionistas es \"gratis\" por no pagar intereses bancarios.",
      "Calcular el WACC con valores contables de balance en lugar de valores de mercado de deuda y capital propio.",
      "Confundir un spread positivo temporal con una ventaja competitiva estructural inmune a la competencia."
    ],
    "sources": [
      {
        "title": "CFA Institute: Capital Structure y WACC",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/capital-structure"
      },
      {
        "title": "CFA Institute: Free Cash Flow Valuation",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/free-cash-flow-valuation"
      }
    ]
  },
  {
    "title": "EPS o beneficio por acción: básico, diluido y estimado",
    "slug": "eps-beneficio-por-accion",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "ratios",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 10,
    "isFeatured": true,
    "formula": "EPS básico = beneficio atribuible a accionistas ordinarios / acciones ordinarias promedio ponderadas",
    "summary": "EPS expresa resultado contable por acción. Distinguir período, moneda, ajustes y dilución es necesario para leer P/E.",
    "content": "### Definición y variantes\nEPS, también llamado BPA, divide el beneficio atribuible al accionista ordinario entre las acciones promedio ponderadas del período. Se expresa en moneda por acción. El EPS diluido contempla instrumentos potencialmente dilutivos conforme a las normas contables; no es simplemente dividir por las acciones existentes al cierre.\n\n### Ejemplo ilustrativo\nUna empresa ficticia obtiene 12 millones de beneficio atribuible a accionistas ordinarios y tiene 3 millones de acciones promedio: EPS=4. Si el precio es 80 y EPS anual comparable es 4, P/E=20. No combinar un EPS trimestral de 4 con un P/E anual sin ajustar el período.\n\n### Lectura en FINIX\nIdentificar si la fuente informa último trimestre, año fiscal, últimos doce meses o previsión futura. TTM describe historia; forward usa estimaciones que pueden cambiar. EPS ajustado excluye ciertas partidas según proveedor y debe contrastarse con el reportado.\n\n### Límites\nUna recompra puede aumentar EPS sin crecimiento del beneficio total; una emisión puede diluirlo. Ganancias extraordinarias pueden distorsionar comparaciones. EPS positivo no garantiza generación de caja ni pago de dividendos. Si EPS es negativo o cero, el P/E convencional puede dejar de ser interpretable. Revisar moneda y tratamiento de splits antes de comparar series.",
    "keyTakeaways": [
      "EPS expresa resultado contable por acción. Distinguir período, moneda, ajustes y dilución es necesario para leer P/E."
    ],
    "commonMistakes": [],
    "sources": [
      {
        "title": "SEC: estados financieros y EPS",
        "url": "https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide"
      }
    ],
    "interactiveWidget": "pe_calculator"
  },
  {
    "title": "P/B (Price to Book: Precio sobre Valor en Libros)",
    "slug": "pb-precio-valor-libros",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "ratios",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 11,
    "isFeatured": false,
    "formula": "P/B = Cotización / Valor Contable por Acción (BVPS)\nValor Contable (Equity) = Activos Totales − Pasivos Totales\nBVPS = Patrimonio Neto Contable / Acciones en Circulación",
    "summary": "El ratio Precio / Valor en Libros compara la valoración de mercado con el patrimonio neto contable. Relevante en entidades financieras y sectores de capital intensivo, con limitaciones en negocios intangibles.",
    "content": "### Fundamento del Ratio Precio / Valor en Libros (P/B)\n\nEl ratio **Precio / Valor en Libros** (*Price-to-Book* o P/B) compara la capitalización bursátil de una empresa con el valor neto de sus activos reportado en el balance de situación:\n\n```\nP/B = Cotización / Valor Contable por Acción (BVPS)\n```\n\nDonde:\n- **Patrimonio Neto (Equity)**: `Activos Totales − Pasivos Totales`. Es la participación residual de los accionistas tras liquidar todas las obligaciones con terceros.\n- **BVPS (Book Value Per Share)**: `Patrimonio Neto Contable / Acciones Totales en Circulación`.\n\n---\n\n### Interpretación y Uso Sectorial\n\n- **P/B < 1.0x**: La compañía cotiza con descuento sobre su valor contable neto. Puede reflejar una oportunidad de valor si los activos son de calidad, o bien desconfianza del mercado sobre la recuperabilidad de dichos activos (por ejemplo préstamos incobrables en bancos o fábricas obsoletas).\n- **P/B > 3.0x - 5.0x**: Refleja que la empresa genera altos retornos sobre el capital propio (ROE elevado) o que posee activos intangibles no reflejados plenamente en el balance.\n\n*Aplicabilidad óptima*: Es una métrica de referencia en el sector bancario, entidades aseguradoras, empresas inmobiliarias (REITs) e industrias pesadas, donde los balances se ajustan periódicamente a valor razonable o poseen inventarios físicos cuantificables.\n\n---\n\n### Limitaciones Estructurales en la Economía Moderna\n\n1. **Activos Intangibles no Capitalizados**: En empresas de software, farmacéuticas o servicios de plataforma, los mayores motores de valor (algoritmos, marca, patentes internas, capital humano) se registran como gastos operativos y no figuran como activos en el balance, distorsionando el P/B al alza.\n2. **Programas Masivos de Recompra de Acciones**: Compañías maduras con alta rentabilidad que recompran agresivamente sus acciones pueden reducir su patrimonio neto contable a valores negativos, haciendo que el P/B pierda sentido cuantitativo sin que la empresa esté quebrada.",
    "keyTakeaways": [
      "El P/B relaciona la cotización bursátil con el patrimonio neto contable por acción (BVPS).",
      "Resulta especialmente útil para evaluar instituciones financieras y empresas con activos tangibles dominantes.",
      "Pierde representatividad en compañías intensivas en conocimiento, software o con recompras masivas de acciones."
    ],
    "commonMistakes": [
      "Comprar mecánicamente acciones con P/B < 1 sin verificar si existen deterioros de activos o pasivos contingentes no registrados.",
      "Descartar compañías tecnológicas sólidas solo porque exhiben un P/B muy elevado."
    ],
    "sources": [
      {
        "title": "SEC: guía de estados financieros",
        "url": "https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide"
      },
      {
        "title": "CFA Institute: Financial Analysis Techniques",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/financial-analysis-techniques"
      }
    ]
  },
  {
    "title": "P/S (Price to Sales: Precio sobre Ventas)",
    "slug": "ps-precio-ventas",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "ratios",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 12,
    "isFeatured": false,
    "formula": "P/S = Capitalización Bursátil / Ventas Totales TTM = Cotización / Ventas por Acción\nEV / Ingresos = Enterprise Value / Ventas Totales TTM",
    "summary": "El ratio Precio/Ventas y el múltiplo EV/Ingresos evalúan la valoración sobre los ingresos brutos, siendo útiles para comparar empresas de alto crecimiento o en fase de escalamiento.",
    "content": "### Utilidad del Múltiplo Precio / Ventas (P/S)\n\nEl ratio **Precio / Ventas (P/S)** relaciona el valor bursátil total de la empresa con sus ingresos brutos reportados en los últimos doce meses (TTM):\n\n```\nP/S = Capitalización Bursátil / Ventas Totales TTM\n```\n\nVentas y beneficios están sujetos a reglas contables y pueden contener errores o reconocimiento inadecuado; los ingresos tampoco están libres de manipulación. Es una herramienta clásica para valorar empresas en etapas tempranas o en fase de expansión que aún reinvierten agresivamente y operan sin beneficio neto.\n\n---\n\n### P/S vs EV / Ingresos: La Corrección por Estructura de Capital\n\nEn el análisis cuantitativo profesional, el ratio P/S se complementa con el múltiplo **EV / Ingresos (Enterprise Value / Revenue)**:\n\n```\nEV / Ingresos = (Capitalización Bursátil + Deuda Financiera − Caja) / Ventas\n```\n\n- Si dos compañías generan US$ 1.000 millones en ingresos con el mismo P/S de 2.0x, pero una no tiene deuda y la otra adeuda US$ 2.000 millones, el ratio P/S las presentará idénticas, mientras que el ratio **EV / Ingresos** evidenciará de inmediato el mayor costo implícito de adquirir la compañía endeudada.\n\n---\n\n### La Relación Inseparable entre P/S y Margen de Rentabilidad\n\nUn error frecuente es comparar ratios P/S entre empresas de diferentes sectores sin contrastar sus márgenes:\n- Una cadena de supermercados con margen neto del 2% y un P/S de 0,5x puede estar cara.\n- Una firma de software SaaS con margen neto del 30% y un P/S de 6,0x puede estar a una valoración muy razonable.\n\n*Regla de contraste*: Un múltiplo sobre ventas solo tiene significado cuando se analiza conjuntamente con el margen operativo proyectado, la tasa de crecimiento anual (`YoY`) y los múltiplos promedio históricos y sectoriales.\n\n### Ejemplo con unidades y límites\nCapitalización ficticia de 2.000 millones e ingresos anuales1.000 millones dan P/S2x. Si deuda2.000 y caja0, EV/Ingresos4x. Comparar la misma moneda y período TTM. Un múltiplo bajo no demuestra que una acción sea barata: importan rentabilidad, reinversión, deuda y crecimiento. El promedio histórico o sectorial es una referencia, no un valor justo automático.",
    "keyTakeaways": [
      "El ratio P/S mide cuánto paga el mercado por cada dólar o peso de facturación bruta del negocio.",
      "El múltiplo EV/Ingresos proporciona una lectura más rigurosa al incorporar la deuda financiera neta.",
      "Los múltiplos de ingresos deben interpretarse siempre junto con los márgenes de rentabilidad y el crecimiento sostenible."
    ],
    "commonMistakes": [
      "Comparar ratios P/S de empresas de industrias con estructuras de costos totalmente divergentes.",
      "Ignorar el nivel de endeudamiento al utilizar P/S en lugar de EV/Ingresos."
    ],
    "sources": [
      {
        "title": "CFA Institute: comparación de empresas mediante múltiplos",
        "url": "https://rpc.cfainstitute.org/research/cfa-digest/2013/02/valuation-with-market-multiples-how-to-avoid-pitfalls-when-identifying-and-using-comparable-com"
      },
      {
        "title": "SEC: guía de estados financieros",
        "url": "https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide"
      }
    ]
  },
  {
    "title": "Márgenes de Rentabilidad (Bruto, Operativo y Neto)",
    "slug": "margenes-bruto-operativo-neto",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "estados-financieros",
    "level": "BEGINNER",
    "readTimeMinutes": 2,
    "order": 13,
    "isFeatured": true,
    "formula": "Margen bruto = Beneficio bruto / Ingresos × 100; Margen operativo = EBIT / Ingresos × 100; Margen EBITDA = EBITDA / Ingresos × 100; Margen neto = Beneficio neto / Ingresos × 100",
    "summary": "La cascada de márgenes del estado de resultados permite identificar en qué etapa de la operación la empresa retiene o pierde rentabilidad, desde el costo directo hasta la utilidad neta final.",
    "content": "### Qué compara un margen\nUn margen expresa una partida de resultado como porcentaje de los ingresos del mismo período. Permite comparar escalas, pero no elimina diferencias entre modelos de negocio, normas contables o criterios de reconocimiento de ventas.\n\n### La cuenta de resultados\nIngresos menos costo de ventas dan el beneficio bruto. Después se deducen los gastos operativos, como administración, comercialización y la investigación que se reconoce como gasto. El resultado operativo y el EBIT pueden diferir si el proveedor incluye otras partidas antes de intereses e impuestos: revisar su definición.\n\nEBITDA suele calcularse como EBIT más depreciación y amortización. El EBITDA ajustado puede excluir otras partidas, por lo que conviene revisar la conciliación. No es CFO: omite inversiones, cambios de capital de trabajo, impuestos e intereses según la definición utilizada.\n\n### Fórmulas y ejemplo ilustrativo\nEn una empresa ficticia, ingresos100, costo de ventas60, gastos operativos25 (incluyendo depreciación5), intereses3 e impuestos2, en millones de USD. Beneficio bruto40; EBIT15; EBITDA20; beneficio neto10.\n\n| Métrica | Cálculo | Margen |\n| --- | --- | --- |\n| Bruto | 40/100 | 40% |\n| Operativo | 15/100 | 15% |\n| EBITDA | 20/100 | 20% |\n| Neto | 10/100 | 10% |\n\n### Interpretación y límites\nComparar tendencias del mismo negocio y pares con actividades similares. Un margen alto no prueba por sí solo poder de fijación de precios; puede reflejar la clasificación de costos, ingresos extraordinarios o un modelo con gastos que aparecen en otra línea. Un margen neto que cae puede deberse a operación, financiamiento o impuestos.\n\nTTM acumula los últimos doce meses y no necesariamente coincide con el último ejercicio anual. Con ingresos cero o negativos, la división puede perder significado. Ninguno de estos márgenes describe automáticamente caja distribuible o rendimiento bursátil.",
    "keyTakeaways": [
      "Revisar definición, unidad, fecha y período antes de comparar valores.",
      "Los ejemplos numéricos son ilustrativos; una métrica aislada no garantiza un resultado."
    ],
    "commonMistakes": [
      "Comparar empresas o períodos con definiciones y unidades distintas.",
      "Interpretar un umbral o una observación histórica como garantía."
    ],
    "sources": [
      {
        "title": "SEC: guía de estados financieros",
        "url": "https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide"
      },
      {
        "title": "CFA Institute: Financial Analysis Techniques",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/financial-analysis-techniques"
      }
    ]
  },
  {
    "title": "Deuda, Apalancamiento y Cobertura de Intereses",
    "slug": "deuda-solvencia-cobertura",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "estados-financieros",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 14,
    "isFeatured": false,
    "formula": "Ratio corriente = Activo corriente / Pasivo corriente; Prueba ácida = (Caja + Inversiones líquidas + Cuentas a cobrar) / Pasivo corriente; Deuda neta/EBITDA = (Deuda financiera − Caja) / EBITDA; Cobertura = EBIT / Gasto de intereses",
    "summary": "Métricas cuantitativas para evaluar la solvencia de largo plazo, el apalancamiento financiero y la liquidez de corto plazo frente a compromisos inmediatos.",
    "content": "### Balance, liquidez y solvencia\nEl balance presenta saldos a una fecha: activos = pasivos + patrimonio. Los activos son recursos reconocidos; los pasivos incluyen obligaciones, no solamente deuda financiera. El patrimonio es la diferencia contable. Activo corriente y pasivo corriente se clasifican según su realización o vencimiento, normalmente dentro del ciclo operativo o de doce meses.\n\nLa liquidez analiza los compromisos cercanos; la solvencia considera la capacidad de sostener obligaciones en el tiempo. Efectivo y equivalentes no siempre incluye fondos restringidos disponibles para pagar deuda.\n\n### Fórmulas y unidades\n- Ratio corriente = activo corriente / pasivo corriente, en veces.\n- Prueba ácida = (efectivo + inversiones líquidas de corto plazo + cuentas a cobrar) / pasivo corriente. Otra variante deduce inventarios y anticipos del activo corriente; verificar qué incluye FINIX o su proveedor.\n- Deuda neta = deuda financiera menos caja elegible.\n- Deuda neta/EBITDA, en veces, compara un saldo con resultado anual.\n- Cobertura de intereses = EBIT / gasto de intereses del período; no intercambiar intereses brutos y netos sin aclararlo.\n\n### Ejemplo ilustrativo\nActivo corriente100, de los cuales caja20, inversiones10 y cuentas a cobrar40; pasivo corriente60. Ratio corriente1,67x y prueba ácida1,17x. Si la deuda financiera es90 y la caja20, deuda neta70. Con EBITDA35, el ratio es2x; EBIT28 e intereses7 dan cobertura4x. Valores ficticios en una misma moneda.\n\n### Cómo leerlos\nDeuda de corto y largo plazo exige revisar vencimientos, tasas, moneda y garantías. Los umbrales dependen del sector y de la estabilidad de ingresos. Inventarios difíciles de vender, cuentas a cobrar vencidas o falta de refinanciación pueden deteriorar la liquidez incluso con ratios aparentemente altos.\n\nDeuda/EBITDA no indica literalmente años necesarios para cancelar deuda: EBITDA no es caja disponible. Con EBITDA negativo o patrimonio pequeño, los ratios pueden no ser comparables. Complementar con CFO, CapEx y el calendario de pagos.",
    "keyTakeaways": [
      "Revisar definición, unidad, fecha y período antes de comparar valores.",
      "Los ejemplos numéricos son ilustrativos; una métrica aislada no garantiza un resultado."
    ],
    "commonMistakes": [
      "Comparar empresas o períodos con definiciones y unidades distintas.",
      "Interpretar un umbral o una observación histórica como garantía."
    ],
    "sources": [
      {
        "title": "CFA Institute: Financial Analysis Techniques",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/financial-analysis-techniques"
      },
      {
        "title": "CFA Institute: fórmulas de ratios financieros",
        "url": "https://www.cfainstitute.org/sites/default/files/-/media/documents/support/programs/cfa/cfa_program_level_ii_financial_ratio_list.pdf"
      },
      {
        "title": "SEC: guía de estados financieros",
        "url": "https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide"
      }
    ]
  },
  {
    "title": "Dividend Yield y Payout Ratio",
    "slug": "dividendos-yield-payout",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "ratios",
    "level": "BEGINNER",
    "readTimeMinutes": 2,
    "order": 15,
    "isFeatured": false,
    "formula": "Dividend Yield = (Dividendo Anual por Acción / Precio por Acción) × 100\nPayout Ratio (sobre Beneficio) = (Dividendos Totales / Utilidad Neta) × 100\nPayout Ratio (sobre FCF) = (Dividendos Totales / Flujo de Caja Libre) × 100",
    "summary": "El Dividend Yield mide el retorno por dividendos respecto al precio. El Payout Ratio evalúa qué proporción de los resultados o del flujo libre se distribuye, requiriendo análisis de caja y sostenibilidad.",
    "content": "### Dividend Yield: Retorno por Flujo de Caja al Accionista\n\nEl **Dividend Yield (Rendimiento por Dividendo)** refleja el flujo de efectivo anual que una empresa devuelve a sus accionistas en relación con su cotización bursátil actual:\n\n```\nDividend Yield = (Dividendo Anual por Acción / Precio Actual de la Acción) × 100\n```\n\n*Ejemplo*: Si una acción cotiza a US$ 50 y paga US$ 2,00 anuales de dividendo, su rendimiento es del **4,00%**.\n\n---\n\n### Payout Ratio: Rentabilidad Contable vs Flujo de Caja\n\nEl **Payout Ratio** evalúa qué porción de las ganancias generadas se distribuye como dividendo en lugar de reinvertirse en el crecimiento del negocio:\n\n- **Payout sobre Utilidad Neta**: Divide los dividendos entre el beneficio contable. Es el indicador más difundido, pero puede estar distorsionado por partidas no monetarias o devengamientos extraordinarios.\n- **Payout sobre Free Cash Flow (FCF)**: Métrica fundamental preferida por analistas. Compara el dividendo con la caja líquida restante tras atender las operaciones y el CapEx (`Dividendos / FCF`). Si el FCF es inferior a los dividendos pagados, la empresa debe consumir reservas de tesorería o emitir deuda para sostener el pago.\n\n---\n\n### Sostenibilidad y la \"Trampa del Dividendo\" (Yield Trap)\n\nUn rendimiento anormalmente alto (por ejemplo superior al 10% o 12%) no es necesariamente una oportunidad atractiva: con frecuencia refleja una cotización que se ha desplomado porque el mercado anticipa un deterioro del negocio o una reducción en los pagos futuros.\n\n- **Evaluación contextual**: No existen umbrales universales como \"menor a 60% es seguro\" o \"mayor a 90% recortará de inmediato\". Empresas de servicios públicos (utilities) o infraestructura con ingresos regulados y flujos muy estables pueden mantener payouts superiores al 80% de forma sostenible durante décadas; en contraste, compañías cíclicas (materias primas, automotrices) con payouts aparentemente moderados del 40% pueden verse forzadas a suspender pagos si los precios de sus productos se hunden.",
    "keyTakeaways": [
      "El Dividend Yield evalúa el flujo de dividendos respecto al precio, mientras el Payout mide qué fracción de las ganancias o caja se distribuye.",
      "Contrastar el Payout contable con el Payout sobre Free Cash Flow para verificar que la caja operativa financie el dividendo.",
      "La sostenibilidad depende de la predictibilidad del flujo de fondos y de las necesidades de reinversión en CapEx, no de un porcentaje rígido."
    ],
    "commonMistakes": [
      "Guiarse exclusivamente por un Dividend Yield de dos dígitos sin analizar el historial de flujo de caja y la tendencia de ingresos.",
      "Creer que un payout contable bajo garantiza el dividendo en industrias cíclicas donde el flujo de fondos sufre alta volatilidad.",
      "Olvidar el impacto fiscal y las retenciones sobre dividendos según la jurisdicción del inversor."
    ],
    "sources": [
      {
        "title": "Investor.gov: acciones y dividendos",
        "url": "https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks"
      },
      {
        "title": "SEC: guía de estados financieros",
        "url": "https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide"
      }
    ]
  },
  {
    "title": "Capitalización Bursátil y Enterprise Value (EV)",
    "slug": "capitalizacion-y-enterprise-value",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "valoracion",
    "level": "BEGINNER",
    "readTimeMinutes": 2,
    "order": 16,
    "isFeatured": false,
    "formula": "Market Cap = Precio × Acciones en circulación; EV simplificado = Market Cap + Deuda financiera − Caja",
    "summary": "Diferencia fundamental entre el valor del capital accionario (Market Cap) y el valor de la empresa completa (Enterprise Value), integrando métricas de escala recurrente como ARR.",
    "content": "### Capitalización bursátil\nMarket Cap = precio por acción × acciones en circulación. Expresa el valor de mercado del equity a una fecha; no es el precio garantizado de adquirir el100% de una empresa. Una oferta de control puede pagar una prima, y diferentes clases de acciones pueden requerir cálculos separados.\n\n### Enterprise Value\nEV incorpora el financiamiento del negocio. Una versión sencilla es capitalización + deuda financiera − caja. Según el proveedor se añaden acciones preferidas, participaciones no controladoras u otros ajustes, y se distingue caja operativa de excedente. No confundir EV con el valor contable del patrimonio ni con el valor obtenido de un DCF.\n\n### Ejemplo ilustrativo\nDos empresas ficticias tienen capitalización de 10.000 millones. A posee deuda500 y caja2.500: EV8.000. B posee deuda8.000 y caja500: EV17.500. B tiene mayor EV, pero eso no demuestra que esté más cara en relación con sus ingresos, caja, crecimiento o riesgos: falta comparar esas magnitudes.\n\n### Acciones y denominadores\nAcciones en circulación no equivale a free float: el flotante excluye determinadas participaciones que no se negocian libremente. La capitalización suele usar acciones a la fecha, mientras EPS utiliza un promedio ponderado del período. Emisiones, recompras y compensación en acciones pueden alterar el número de títulos. Revisar ajustes por splits y la fecha de reporte.\n\n### ARR y escala del negocio\nARR es el ingreso recurrente anualizado según la definición propia del emisor; en un modelo mensual sencillo, ARR = MRR×12. No es automáticamente facturación contable, cobros, beneficio ni contratos pendientes. Una empresa puede cambiar qué productos incluye; leer su reporte y comparar definiciones consistentes. La ficha de negocio también informa empleados, liderazgo, antigüedad y cuota de mercado: aportan contexto, no una valoración automática.\n\n### Límites\nNo mezclar monedas ni balances viejos con precios sin fecha. Bancos y aseguradoras requieren especial cuidado porque la deuda es parte de su actividad. Un EV reducido por caja no elimina riesgos operativos o restricciones sobre el efectivo.",
    "keyTakeaways": [
      "Revisar definición, unidad, fecha y período antes de comparar valores.",
      "Los ejemplos numéricos son ilustrativos; una métrica aislada no garantiza un resultado."
    ],
    "commonMistakes": [
      "Comparar empresas o períodos con definiciones y unidades distintas.",
      "Interpretar un umbral o una observación histórica como garantía."
    ],
    "sources": [
      {
        "title": "SEC: guía de estados financieros",
        "url": "https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide"
      },
      {
        "title": "CFA Institute: comparación de empresas mediante múltiplos",
        "url": "https://rpc.cfainstitute.org/research/cfa-digest/2013/02/valuation-with-market-multiples-how-to-avoid-pitfalls-when-identifying-and-using-comparable-com"
      },
      {
        "title": "Adobe: Form 10-K 2025, definición reportada de ARR",
        "url": "https://www.sec.gov/Archives/edgar/data/796343/000079634326000003/adbe-20251128.htm"
      }
    ]
  },
  {
    "title": "ATR: rango verdadero y volatilidad",
    "slug": "atr-average-true-range",
    "categorySlug": "analisis-tecnico",
    "subcategorySlug": "indicadores",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 17,
    "isFeatured": false,
    "formula": "TR = max(H − L, |H − C previo|, |L − C previo|); ATR = (ATR previo × (n − 1) + TR) / n",
    "summary": "El Average True Range mide el tamaño de los movimientos e incorpora los gaps. Se expresa en unidades de precio, no indica dirección.",
    "content": "### Qué mide\nEl ATR resume el rango verdadero de las últimas velas mediante un suavizado. El parámetro habitual es 14 períodos. En un gráfico diario son 14 velas diarias; en uno de una hora, 14 velas horarias. Usa máximo, mínimo y cierre anterior para incorporar saltos entre velas.\n\n### Cálculo y unidades\nEl rango verdadero es el mayor entre máximo menos mínimo y las distancias absolutas de máximo y mínimo al cierre previo. La primera media se inicializa con los primeros n rangos; después se aplica el suavizado de Wilder. Un ATR de 2,50 en un activo cotizado en USD expresa dólares por unidad del activo, no 2,50%.\n\n### Ejemplo ilustrativo\nSi H=105, L=101 y el cierre previo=99, los candidatos son 4, 6 y 2: TR=6. Si ATR previo=2 y n=14, el nuevo ATR es (2×13+6)/14=2,2857. Son precios ficticios para comprender la fórmula.\n\n### Cómo interpretarlo\nUn ATR mayor describe movimientos más amplios. Puede aumentar durante subidas o caídas. Comparar ATR entre activos de precios muy distintos exige normalizar, por ejemplo ATR/precio×100.\n\n### Límites y errores frecuentes\nNo predice hacia dónde irá el precio ni garantiza que el próximo movimiento quede dentro de un ATR. Una distancia de stop basada en ATR es una regla de gestión, no un límite garantizado de pérdida: gaps y poca liquidez pueden producir una ejecución peor. Revisar configuración, escala y timeframe antes de comparar gráficos.",
    "keyTakeaways": [
      "El Average True Range mide el tamaño de los movimientos e incorpora los gaps. Se expresa en unidades de precio, no indica dirección."
    ],
    "commonMistakes": [],
    "sources": [
      {
        "title": "Fidelity: Average True Range",
        "url": "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/atr"
      }
    ]
  },
  {
    "title": "ADX y DI: fuerza y dirección de una tendencia",
    "slug": "adx-fuerza-de-tendencia",
    "categorySlug": "analisis-tecnico",
    "subcategorySlug": "indicadores",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 18,
    "isFeatured": false,
    "formula": "DX = 100 × |+DI − −DI| / (+DI + −DI); ADX = suavizado de DX",
    "summary": "ADX mide fuerza, mientras +DI y −DI ayudan a distinguir dirección. Un ADX alto puede acompañar una caída fuerte.",
    "content": "### Tres líneas, dos preguntas diferentes\nEl ADX forma parte del sistema de movimiento direccional de Wilder. +DI y −DI resumen el movimiento positivo y negativo respecto del rango verdadero; ADX suaviza su separación relativa. La dirección se consulta en precio y líneas DI; la fuerza se consulta en ADX.\n\n### Escala y parámetros\nLa lectura suele estar entre 0 y 100 y es habitual trabajar con 14 períodos. Los umbrales 20 y 25 se usan como referencias convencionales, no como fronteras universales: por debajo de 20 suele haber menor definición y por encima de 25 puede existir una tendencia más marcada.\n\n### Ejemplo ilustrativo\nCon +DI=15 y −DI=35, DX=100×20/50=40. La presión direccional del ejemplo es bajista porque −DI supera +DI. ADX no será necesariamente 40: depende de los valores DX anteriores y del suavizado aplicado.\n\n### Lectura conjunta\nADX puede subir mientras el precio cae. ADX puede bajar mientras el precio sigue subiendo: eso expresa menor fuerza medida, sin confirmar una reversión. Observar pendiente, estructura de máximos y mínimos y timeframe.\n\n### Límites\nEl indicador tiene rezago, los cruces DI pueden repetirse en rangos laterales y un valor alto no garantiza continuidad. No confundir fuerza con rentabilidad esperada. Las implementaciones pueden diferir en inicialización y suavizado; usar los mismos parámetros al contrastar proveedores.",
    "keyTakeaways": [
      "ADX mide fuerza, mientras +DI y −DI ayudan a distinguir dirección. Un ADX alto puede acompañar una caída fuerte."
    ],
    "commonMistakes": [],
    "sources": [
      {
        "title": "Fidelity: ADX y movimiento direccional",
        "url": "https://www.fidelity.com/viewpoints/active-investor/average-directional-index-ADX"
      }
    ]
  },
  {
    "title": "Estocástico: posición del cierre dentro del rango",
    "slug": "oscilador-estocastico",
    "categorySlug": "analisis-tecnico",
    "subcategorySlug": "indicadores",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 19,
    "isFeatured": false,
    "formula": "%K = 100 × (C − mínimo de n períodos) / (máximo de n períodos − mínimo de n períodos)",
    "summary": "El estocástico compara el cierre con el rango reciente; sus líneas %K y %D no son una probabilidad de suba.",
    "content": "### Qué representa\nEl oscilador estocástico ubica el cierre dentro del intervalo formado por los máximos y mínimos de las últimas n velas. %K es la lectura principal; %D es una media de %K. Las versiones rápida, lenta y completa usan suavizados diferentes.\n\n### Ejemplo ilustrativo\nSi el máximo de 14 velas fue 120, el mínimo 100 y el cierre 115, %K=100×15/20=75. El cierre se ubica al 75% del rango medido. Eso no significa 75% de probabilidad de ganar. Si %K de tres períodos fuera 60, 75 y 90, una %D simple de tres períodos sería 75.\n\n### Lectura y configuración\n80 y 20 son referencias comunes para zonas altas y bajas del rango. Registrar todos los parámetros: n, suavizado de %K y período de %D. Una configuración 14/3/3 no equivale a todas las implementaciones etiquetadas simplemente 14.\n\n### Límites\nEn una tendencia fuerte puede permanecer cerca de un extremo; sobrecompra no implica caída inmediata ni sobreventa rebote asegurado. Cruces y divergencias pueden fallar. Si máximo y mínimo son iguales, el denominador es cero y debe tratarse como lectura indefinida según la implementación, no inventar un valor.",
    "keyTakeaways": [
      "El estocástico compara el cierre con el rango reciente; sus líneas %K y %D no son una probabilidad de suba."
    ],
    "commonMistakes": [],
    "sources": [
      {
        "title": "Fidelity: Fast Stochastic Oscillator",
        "url": "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/fast-stochastic"
      }
    ]
  },
  {
    "title": "VWAP (Volume Weighted Average Price)",
    "slug": "vwap-precio-ponderado-por-volumen",
    "categorySlug": "analisis-tecnico",
    "subcategorySlug": "indicadores",
    "level": "ADVANCED",
    "readTimeMinutes": 2,
    "order": 20,
    "isFeatured": false,
    "formula": "VWAP = Σ (Precio_t × Volumen_t) / Σ Volumen_t",
    "summary": "El VWAP calcula el precio medio ponderado por el volumen transaccionado durante la sesión. Es el benchmark de ejecución institucional para medir eficiencia operativa.",
    "content": "### El Benchmark Institucional de Negociación\n\nA diferencia de una media móvil simple que otorga el mismo peso a cada vela sin importar la actividad negociada, el **VWAP (Volume-Weighted Average Price)** pondera cada operación por la cantidad de títulos negociados a cada nivel de precio:\n\n```\nVWAP = Σ (Precio_t × Volumen_t) / Σ Volumen_t\n```\n\n---\n\n### Utilidad en la Ejecución de Órdenes\n\nLas mesas de operaciones institucionales y los algoritmos de ejecución emplean el VWAP como referencia de calidad:\n- **Compra Eficiente**: Una orden de compra ejecutada a un precio promedio inferior al VWAP de la sesión se considera una ejecución favorable respecto al mercado.\n- **Venta Eficiente**: Una orden de venta completada por encima del VWAP de la sesión se cataloga como óptima.\n\n---\n\n### Dinámica Técnica Intradía y Limitaciones\n\n- **Soporte / Resistencia Dinámica**: En ruedas con tendencia intradiaria definida, los retrocesos hacia la línea de VWAP suelen actuar como zonas de reactivación de demanda institucional.\n- **Reinicio Diario**: El VWAP estándar se reinicia a cero al inicio de cada jornada bursátil. No debe proyectarse de forma continua entre sesiones sin emplear variantes ancladas (**Anchored VWAP**), que miden el precio ponderado desde un evento específico como un reporte de resultados o un cambio de tendencia relevante.\n\n### Ejemplo y alcance del promedio\nCon 10 unidades operadas a 100 y30 a 102, el promedio ponderado es(10×100+30×102)/40=101,50. En gráficos de velas se puede usar precio típico (H+L+C)/3 y volumen, que es una aproximación al promedio de transacciones. La sesión o ancla define dónde comienza la acumulación. VWAP mide precios negociados históricamente; no define valor intrínseco ni garantiza ejecución o dirección futura.",
    "keyTakeaways": [
      "El VWAP pondera cada nivel de precio por el volumen negociado durante la sesión intradía.",
      "Constituye el parámetro estándar de la industria institucional para medir la calidad de ejecución.",
      "Se reinicia en cada rueda y no reemplaza a las medias móviles en análisis de mediano y largo plazo."
    ],
    "commonMistakes": [
      "Utilizar el VWAP estándar en gráficos diarios o semanales sin anclarlo a una fecha o catalizador específico.",
      "Operar cruces de VWAP de forma mecánica en jornadas laterales sin confirmar volumen y contexto."
    ],
    "sources": [
      {
        "title": "TradingView: cálculo y alcance del VWAP",
        "url": "https://www.tradingview.com/support/solutions/43000502018-volume-weighted-average-price-vwap/"
      }
    ]
  },
  {
    "title": "Volumen y Confirmación de Tendencia",
    "slug": "volumen-y-confirmacion",
    "categorySlug": "analisis-tecnico",
    "subcategorySlug": "tendencias",
    "level": "BEGINNER",
    "readTimeMinutes": 2,
    "order": 21,
    "isFeatured": true,
    "formula": "OBV_t = OBV_(t−1) + Volumen (si Cierre_t > Cierre_(t−1))\nOBV_t = OBV_(t−1) − Volumen (si Cierre_t < Cierre_(t−1))\nOBV_t = OBV_(t−1) (si Cierre_t = Cierre_(t−1))",
    "summary": "El volumen refleja la liquidez y el combustible de los movimientos de precios. Valida la convicción de la tendencia y advierte divergencias de agotamiento.",
    "content": "### El Volumen como Combustible del Mercado\n\nEn el análisis técnico, el precio refleja el consenso de valor en un instante dado, mientras que el **volumen** mide la cantidad de contratos, acciones o unidades negociadas. Representa el grado de convicción y compromiso financiero de los participantes detrás de cada movimiento.\n\n---\n\n### Principios Fundamentales de la Teoría de Dow\n\n1. **Confirmación de Tendencia**: En una tendencia alcista sana, el volumen debe expandirse en los tramos de avance y contraerse durante las correcciones o retrocesos. En una tendencia bajista, el volumen tiende a incrementarse con las caídas y reducirse en los rebotes técnicos.\n2. **Divergencias de Volumen**: Cuando el precio marca nuevos máximos pero el volumen negociado decrece progresivamente, se produce una **divergencia de volumen**, indicando que la suba carece de respaldo institucional y advirtiendo sobre posible agotamiento.\n3. **Clímax de Volumen (Blow-off / Capitulación)**: Un pico extremo de volumen tras una tendencia muy madura suele señalar una fase de liquidación por pánico (capitulación bajista) o de euforia compradora (clímax alcista).\n\n---\n\n### Volumen en Títulos vs Monto Operado\n\nEs indispensable diferenciar:\n- **Volumen Nominal (Títulos)**: Cantidad de acciones o contratos negociados.\n- **Monto Operado (Turnover en Moneda)**: Importe monetario total transaccionado (`Volumen × Precio Medio`). En activos con alta variación de cotización o en mercados con inflación, el monto monetario operado ofrece una visión más certera de la liquidez real.\n\n### Límites y ejemplo\nCada operación tiene comprador y vendedor; volumen alto por sí solo no permite identificar quién compra ni demostrar entrada neta de instituciones. Si OBV empieza en 1.000, un cierre mayor que el anterior con volumen 200 lo lleva a 1.200; un cierre menor con volumen 150 lo lleva a 1.050. La base inicial es arbitraria. En mercados que muestran tick volume se cuentan cambios o eventos, no necesariamente títulos negociados. Comparar fuentes, sesiones y ajustes por splits antes de interpretar divergencias.",
    "keyTakeaways": [
      "El volumen valida la fuerza de una tendencia y permite detectar divergencias de agotamiento.",
      "Una tendencia alcista con volumen decreciente refleja falta de demanda institucional.",
      "Diferenciar volumen en títulos respecto al volumen en valor monetario transaccionado."
    ],
    "commonMistakes": [
      "Analizar velas de precios ignorando el volumen relativo respecto a su promedio móvil.",
      "Confundir un incremento puntual de volumen en un horario atípico con una acumulación institucional genuina."
    ],
    "sources": [
      {
        "title": "Fidelity: cálculo e interpretación de OBV",
        "url": "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/obv"
      }
    ]
  },
  {
    "title": "Bonos, TIR (YTM) y Modified Duration",
    "slug": "bonos-tir-duration",
    "categorySlug": "fundamentos",
    "subcategorySlug": "instrumentos",
    "level": "ADVANCED",
    "readTimeMinutes": 2,
    "order": 22,
    "isFeatured": true,
    "formula": "Para tasas decimales: ΔP/P ≈ −Duration modificada × ΔTIR; Variación porcentual ≈ −Dmod × ΔTIR decimal × 100",
    "summary": "Cómo funciona la renta fija: el mecanismo inverso entre precio y tasa, el cálculo de la Tasa Interna de Retorno (YTM) y la Duration Modificada como medida de sensibilidad.",
    "content": "### Precio, cupón y amortización\nUn bono promete flujos según un contrato: intereses, devolución de capital y fechas. Cupón no es TIR. El precio puede presentarse por 100 de valor nominal; el nominal residual cambia cuando hay amortizaciones. Precio limpio excluye intereses corridos; precio sucio los incorpora. Revisar qué cotización usa el cálculo.\n\n### TIR o rendimiento al vencimiento\nEs la tasa que iguala el precio con el valor presente de los flujos contractuales. No es un pago garantizado: la rentabilidad realizada depende de cumplimiento, reinversión, venta anticipada, costos e impuestos. Con m pagos anuales, la fórmula debe usar tasas y períodos consistentes; para fechas irregulares se utiliza la convención de calendario del instrumento.\n\n### Ejemplo ilustrativo\nUn bono ficticio paga105 dentro de un año y se compra a 100, sin otros flujos: TIR5% antes de costos. Si el emisor incumple o se vende antes, la rentabilidad efectiva será otra. La paridad suele comparar cotización y valor técnico —nominal residual más intereses corridos—, según la convención del mercado.\n\n### Duration y sensibilidad\nMacaulay duration es el promedio de los tiempos de los flujos, ponderados por su valor presente. Duration modificada aproxima la sensibilidad del precio al rendimiento. Usando tasas decimales: ΔP/P ≈ −Dmod×Δy. Con Dmod5 y aumento de TIR de 1punto porcentual (Δy=0,01), el cambio aproximado es−0,05, es decir−5%. No equivale a afirmar que el bono devolverá todo el capital en cinco años.\n\n### Límites\nLa aproximación funciona mejor con cambios pequeños; la convexidad ayuda a considerar curvatura. Bonos con opciones, como rescate anticipado, pueden comportarse de otra manera y requieren medidas efectivas. Variaciones de riesgo crediticio, liquidez, inflación o tipo de cambio también modifican precios. Una TIR alta puede reflejar riesgo de impago, no una oportunidad segura.",
    "keyTakeaways": [
      "Revisar definición, unidad, fecha y período antes de comparar valores.",
      "Los ejemplos numéricos son ilustrativos; una métrica aislada no garantiza un resultado."
    ],
    "commonMistakes": [
      "Comparar empresas o períodos con definiciones y unidades distintas.",
      "Interpretar un umbral o una observación histórica como garantía."
    ],
    "sources": [
      {
        "title": "CFA Institute: medidas y propiedades de duration",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/yield-based-bond-duration-measures-and-properties"
      },
      {
        "title": "Investor.gov: bonos",
        "url": "https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds"
      },
      {
        "title": "Rava: análisis de bonos",
        "url": "https://www.rava.com/herramientas/analisis-de-bonos/"
      }
    ]
  },
  {
    "title": "Dólar MEP y Dólar CCL (Contado con Liquidación)",
    "slug": "dolar-mep-y-ccl",
    "categorySlug": "macroeconomia",
    "subcategorySlug": "mercados",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 1,
    "order": 23,
    "isFeatured": true,
    "formula": "Tipo de Cambio Implícito = Cotización en Pesos (ARS) / Cotización en Dólares (USD)\nMEP = Bono Especie ARS / Bono Especie D (liquidación local)\nCCL = Bono/CEDEAR Especie ARS / Especie C (liquidación exterior cable)",
    "summary": "El mecanismo legal del mercado de capitales argentino para dolarizar carteras y transferir fondos entre cuentas bancarias locales y cuentas en el exterior.",
    "content": "### ¿Qué son el Dólar MEP y el Dólar CCL?\nEn Argentina, el **Dólar MEP** (*Mercado Electrónico de Pagos* o Dólar Bolsa) y el **Dólar CCL** (*Contado con Liquidación*) son tipos de cambio financieros implícitos que surgen de la compraventa simultánea de activos financieros duales (bonos soberanos como AL30/GD30 o acciones/CEDEARs).\n\n---\n\n### Diferencia Clave entre MEP y CCL\n1. **Dólar MEP (Especie D)**: La transacción se liquida íntegramente en el sistema financiero doméstico. Los dólares resultantes se acreditan en una cuenta bancaria radicada en Argentina.\n2. **Dólar CCL (Especie C o Cable)**: La operación se liquida en cuentas del exterior (generalmente en bancos o brokers de Estados Unidos).\n\nLa diferencia de cotización entre el CCL y el MEP se denomina **Canje** o *Spread de Cable*. Refleja el costo o prima por mover divisas entre el circuito local y el internacional.",
    "keyTakeaways": [
      "Operaciones 100% legales reguladas por la Comisión Nacional de Valores (CNV) y cursadas en BYMA / MAE.",
      "Consultar siempre la normativa vigente respecto a plazos de permanencia (parking) antes de operar."
    ],
    "commonMistakes": [
      "Confundir Dólar MEP (cuenta local) con Dólar CCL (cuenta exterior con fondos cable)."
    ],
    "sources": [
      {
        "title": "BYMA — Productos de Datos e Índices Financieros",
        "url": "https://www.byma.com.ar/productos/productos-de-datos"
      },
      {
        "title": "BYMA Educa — Glosario de Instrumentos del Mercado Argentino",
        "url": "https://www.bymaeduca.com.ar/pages/glosario1"
      }
    ]
  },
  {
    "title": "Riesgo País (EMBI+ de J.P. Morgan)",
    "slug": "riesgo-pais-embi",
    "categorySlug": "macroeconomia",
    "subcategorySlug": "mercados",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 24,
    "isFeatured": false,
    "formula": "Riesgo País (pb) = (Rendimiento Bonos Soberanos en USD − Rendimiento Bonos del Tesoro EE.UU.) × 10.000",
    "summary": "El índice EMBI mide la sobretasa que exige el mercado internacional a los bonos de un país emergente frente a los títulos libres de riesgo del Tesoro de Estados Unidos.",
    "content": "### ¿Cómo se calcula y qué significa?\n\nEl **Riesgo País** es medido principalmente a través del índice **EMBI+** (*Emerging Markets Bond Index*) elaborado por la entidad financiera **J.P. Morgan**.\n\nSe expresa en **puntos básicos (pb)**, donde **100 pb equivalen al 1,00% anual**:\n- Si el bono del Tesoro de EE.UU. a 10 años rinde **4,00%** anual y el bono soberano equivalente de un país rinde **12,00%** anual en la misma moneda:\n\n```\nRiesgo País = (12,00% − 4,00%) × 10.000 = 800 puntos básicos\n```\n\n---\n\n### Factores Determinantes\n\n1. **Capacidad y Voluntad de Pago**: Solvencia fiscal, reservas internacionales líquidas en el banco central y perfil de vencimientos de deuda.\n2. **Estabilidad Institucional y Política**: Previsibilidad de políticas macroeconómicas, seguridad jurídica y cumplimiento de contratos.\n3. **Contexto Financiero Global**: Cuando la Reserva Federal sube tasas o se incrementa la aversión global al riesgo, los capitales migran hacia activos seguros (*flight to quality*), ampliando los spreads de países emergentes.\n\n---\n\n### Impacto en la Economía Real\n\nEl riesgo país no solo afecta al gobierno soberano: establece una **tasa de corte mínima** para el financiamiento de las empresas privadas locales. Si el país paga un sobrecosto de 1.000 pb, las compañías difícilmente podrán financiarse a tasas menores, encareciendo la inversión productiva, el crédito hipotecario y los proyectos de infraestructura.",
    "keyTakeaways": [
      "Mide el spread sobre la curva de US Treasuries, considerada la tasa libre de riesgo global.",
      "Un riesgo país a la baja reactiva el financiamiento corporativo y la valuación de activos domésticos."
    ],
    "commonMistakes": [
      "Pensar que el riesgo país mide la inflación; mide estrictamente el riesgo de impago (default) de la deuda pública."
    ],
    "sources": [
      {
        "title": "Rava: Riesgo País y serie EMBI+ Argentina",
        "url": "https://www.rava.com/cotizaciones/historico/riesgo-pais/2025/12/21/"
      },
      {
        "title": "BYMA Educa: glosario financiero",
        "url": "https://www.bymaeduca.com.ar/pages/glosario1"
      }
    ]
  },
  {
    "title": "Calendario: publicado, consenso, previo, revisión y horario",
    "slug": "calendario-economico-y-eventos",
    "categorySlug": "macroeconomia",
    "subcategorySlug": "variables-macro",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 25,
    "isFeatured": false,
    "formula": "Sorpresa absoluta = dato publicado − consenso (con unidades y definición comparables)",
    "summary": "Leer publicaciones económicas, balances y dividendos sin confundir expectativas con resultados ni horarios con fechas de operación.",
    "content": "### Qué muestra cada columna\nPublicado o actual es el dato anunciado; consenso es una expectativa recopilada, no una promesa; previo corresponde al período anterior. Un dato previo puede revisarse al publicarse información adicional. Comparar cifras que usen las mismas unidades y ajuste estacional.\n\n### Ejemplo ilustrativo\nUn indicador ficticio anuncia150 mil empleos frente a un consenso de 180 mil: sorpresa absoluta−30 mil. Si el dato anterior pasa de 200 mil a 170 mil por revisión, esa revisión es información separada. No sumar automáticamente ambos efectos ni concluir que el precio debe subir o bajar.\n\n### Horarios y períodos\nLa hora local depende de zona horaria y cambios estacionales del país emisor. Un evento puede referirse al mes anterior aunque se publique hoy. En FINIX verificar etiqueta de zona horaria, fecha de publicación y período del indicador. Un evento pendiente no debe mostrar cero como si fuera un dato publicado.\n\n### Eventos de empresas\nResultados pueden informarse antes de apertura o después del cierre; distinguir fecha prevista de fecha confirmada. En dividendos no confundir fecha ex-dividendo, registro y pago. Los detalles provienen del emisor o mercado.\n\n### Límites de interpretación\nLa etiqueta de impacto es orientativa. Las reacciones dependen de expectativas ya incorporadas, revisiones, composición del dato y contexto. Una sorpresa positiva para actividad puede interpretarse de otra forma ante cambios de tasas. El calendario informa acontecimientos; no predice retornos.",
    "keyTakeaways": [
      "Leer publicaciones económicas, balances y dividendos sin confundir expectativas con resultados ni horarios con fechas de operación."
    ],
    "commonMistakes": [],
    "sources": [
      {
        "title": "Rava: información de mercado",
        "url": "https://www.rava.com"
      },
      {
        "title": "BYMA Educa: glosario e instrumentos",
        "url": "https://www.bymaeduca.com.ar/pages/glosario1"
      }
    ]
  },
  {
    "title": "Beta (β) y Sensibilidad al Mercado",
    "slug": "beta-volatilidad-mercado",
    "categorySlug": "estrategias",
    "subcategorySlug": "gestion-riesgo",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 26,
    "isFeatured": false,
    "formula": "Beta = Cov(Ractivo, Ríndice) / Var(Ríndice); Volatilidad anual ≈ Volatilidad diaria × √252; Short float = Acciones en corto / Flotante × 100",
    "summary": "Métricas de riesgo sistemático, dispersión de precios, estructura de posiciones cortas en el mercado y variación neta de acciones en circulación.",
    "content": "### Beta: sensibilidad al índice\nBeta es la pendiente de una relación estadística entre rendimientos de un activo y del benchmark. Beta = covarianza(activo, índice) / varianza(índice). No tiene unidades. Debe indicarse el índice, frecuencia, ventana y tratamiento de dividendos utilizados; una estimación de un año puede ser inestable.\n\n### Ejemplo ilustrativo\nSi la covarianza es0,00018 y la varianza del índice0,00012, beta=1,5. En el modelo lineal, un movimiento del índice de 1% se asocia con 1,5% del componente sensible al mercado, manteniendo lo demás constante. El retorno observado también contiene efectos específicos del activo. Beta1 no implica replicar exactamente el índice, y beta baja no garantiza poco riesgo total.\n\n### Volatilidad histórica\nMide dispersión de rendimientos, no pérdidas máximas. Una anualización habitual es desviación estándar diaria×√252. Con volatilidad diaria ficticia de 1%, resulta aproximadamente15,87% anual. La regla depende de supuestos sobre la serie; no predice la volatilidad futura ni asegura que los movimientos queden dentro de ese porcentaje.\n\n### Short interest y flotante en corto\nShort interest es el número de posiciones cortas abiertas a una fecha de reporte; no es volumen diario vendido en corto. Short float = acciones en corto / acciones flotantes ×100. Days to cover = short interest / volumen diario promedio. Con 2 millones de acciones cortas, flotante20 millones y volumen promedio500.000, serían10% y4 días de volumen, no un plazo garantizado para cerrar posiciones.\n\n### Dilución y recompras\nNuevas acciones pueden reducir la participación de cada título existente; recompras netas pueden reducir el conteo. Una emisión también puede financiar activos que generen valor, por lo que dilución no equivale automáticamente a destrucción económica. Revisar EPS diluido, compensación en acciones y acciones promedio.\n\n### Límites\nLas estadísticas dependen de datos y fechas; índices distintos producen betas distintas. Ni beta, volatilidad ni posiciones cortas garantizan una dirección de precio o un short squeeze.",
    "keyTakeaways": [
      "Revisar definición, unidad, fecha y período antes de comparar valores.",
      "Los ejemplos numéricos son ilustrativos; una métrica aislada no garantiza un resultado."
    ],
    "commonMistakes": [
      "Comparar empresas o períodos con definiciones y unidades distintas.",
      "Interpretar un umbral o una observación histórica como garantía."
    ],
    "sources": [
      {
        "title": "CFA Institute: Portfolio Risk and Return",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/portfolio-risk-return-part-2"
      },
      {
        "title": "SEC: posiciones cortas y Regulation SHO",
        "url": "https://www.sec.gov/investor/pubs/regsho.htm"
      },
      {
        "title": "FINRA: Short Interest",
        "url": "https://www.finra.org/filing-reporting/regulatory-filing-systems/short-interest"
      }
    ]
  },
  {
    "title": "Cotizaciones: precio, variación, OHLC, volumen y moneda",
    "slug": "cotizaciones-ohlc-volumen-variacion",
    "categorySlug": "fundamentos",
    "subcategorySlug": "instrumentos",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 104,
    "isFeatured": false,
    "formula": "Variación % = (precio de referencia actual / cierre previo comparable − 1) × 100",
    "summary": "Cómo leer los campos de mercado, sus unidades y la diferencia entre último precio, cierre y una cotización ejecutable.",
    "content": "### Identificar el instrumento\nEl ticker es un identificador usado por el mercado o proveedor; revisar también bolsa, especie y moneda. Dos símbolos parecidos pueden corresponder a instrumentos distintos. Una acción extranjera y su CEDEAR tienen unidades y exposiciones diferentes.\n\n### Precio y variación\nÚltimo precio refiere a una operación informada, no necesariamente al precio disponible para comprar o vender ahora. El cierre previo ofrece una referencia de comparación. En una cotización sin operaciones recientes o fuera de horario, revisar fecha y estado antes de interpretarla.\n\n### Ejemplo ilustrativo\nCierre previo=100 y último=103 produce variación absoluta+3 y relativa+3%. Si el movimiento siguiente llega a 106, será+6% respecto de 100 y aproximadamente+2,91% respecto de 103. Siempre identificar la base. En FINIX, verificar moneda, fecha, mercado y si la fuente marca dato demorado o guardado.\n\n### Campos del gráfico\nOHLC significa apertura, máximo, mínimo y cierre de cada vela. El intervalo del gráfico determina qué período resume. Volumen describe actividad negociada: puede expresarse en títulos, contratos o unidades del activo, según fuente. No confundirlo con monto negociado en moneda.\n\n### Límites de comparación\nSplits, dividendos y ajustes del proveedor pueden modificar series históricas. Un rango de 52 semanas no es una predicción. El color verde o rojo resume variación respecto de una base, no calidad fundamental. M, B y T deben leerse según la escala declarada: evitar confundir billion inglés con billón español.",
    "keyTakeaways": [
      "Cómo leer los campos de mercado, sus unidades y la diferencia entre último precio, cierre y una cotización ejecutable."
    ],
    "commonMistakes": [],
    "sources": [
      {
        "title": "BYMA Educa: glosario",
        "url": "https://www.bymaeduca.com.ar/pages/glosario1"
      },
      {
        "title": "Rava: cotizaciones e indicadores",
        "url": "https://www.rava.com/herramientas/indicadores/"
      }
    ]
  },
  {
    "title": "CAGR: crecimiento compuesto y comparación de períodos",
    "slug": "crecimiento-cagr-comparaciones",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "estados-financieros",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 105,
    "isFeatured": false,
    "formula": "CAGR = ((valor final / valor inicial)^(1/n) − 1) × 100",
    "summary": "CAGR resume una tasa anual equivalente entre dos extremos; no muestra el recorrido ni garantiza crecimiento futuro.",
    "content": "### Qué resume\nCAGR es la tasa anual constante que llevaría un valor inicial a uno final en n años. Se utiliza para describir ingresos, beneficios y otras magnitudes con bases positivas y comparables. La tasa es una equivalencia matemática: los años reales pueden haber sido muy distintos.\n\n### Ejemplo ilustrativo\nIngresos ficticios pasan de 100 a 121 en dos años. CAGR=(121/100)^(1/2)−1=10% anual. Los ingresos intermedios podrían ser 80 o 130; el CAGR será igual porque solo utiliza extremos. Por eso no describe estabilidad.\n\n### Comparaciones útiles\nYoY compara con el mismo período del año anterior; QoQ compara trimestres consecutivos y puede reflejar estacionalidad. Crecimiento porcentual=(actual/previo−1)×100. En períodos trimestrales, especificar si la tasa se anualiza. No comparar ingresos de un trimestre con un año completo.\n\n### Límites\nCon valores iniciales cero o negativos, la fórmula estándar no es una medida económica interpretable; usar diferencias absolutas y explicación del cambio. Inflación, adquisiciones, cambios de moneda y criterios contables pueden inflar el crecimiento nominal. Una recuperación desde una base pequeña produce porcentajes grandes. En portafolio, aportes y retiros impiden tratar el crecimiento del saldo como rentabilidad sin un método apropiado.",
    "keyTakeaways": [
      "CAGR resume una tasa anual equivalente entre dos extremos; no muestra el recorrido ni garantiza crecimiento futuro."
    ],
    "commonMistakes": [],
    "sources": [
      {
        "title": "Zerodha: definición y cálculo del CAGR",
        "url": "https://support.zerodha.com/category/mutual-funds/understanding-mutual-funds/about-mutual-funds/articles/what-does-cagr-mean"
      },
      {
        "title": "SEC: información financiera y períodos",
        "url": "https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide"
      }
    ]
  },
  {
    "title": "Portafolio: costo, PnL, efectivo, aportes y moneda",
    "slug": "portafolio-pnl-costo-aportes",
    "categorySlug": "estrategias",
    "subcategorySlug": "gestion-riesgo",
    "level": "INTERMEDIATE",
    "readTimeMinutes": 2,
    "order": 107,
    "isFeatured": false,
    "formula": "PnL no realizado = valor de posición − costo atribuible; retorno simple sin flujos = (valor final / valor inicial − 1) × 100",
    "summary": "Diferenciar saldo patrimonial y rentabilidad, ganancias realizadas y no realizadas, evitando mezclar monedas o contar aportes como rendimiento.",
    "content": "### Componentes de una cartera\nEl patrimonio incluye posiciones y efectivo, con obligaciones cuando corresponda. Cantidad×precio ofrece una valuación de posición; revisar fecha y moneda de ese precio. El costo debe seguir el criterio de registro aplicado, incluyendo o separando comisiones de forma consistente.\n\n### Ganancias realizadas y no realizadas\nUna ganancia no realizada compara valuación de títulos mantenidos con su costo atribuible; una ganancia realizada nace al vender y depende del costo asignado a los títulos vendidos. Dividendos, intereses y comisiones deben identificarse sin duplicarlos en el resultado.\n\n### Ejemplo ilustrativo\nDiez unidades costaron100 cada una y ahora valen110: valor1100, costo1000, PnL no realizado100 y retorno simple10%, antes de gastos. Si se agrega un aporte de 500 en efectivo, el patrimonio pasa a 1600, pero la ganancia de las posiciones sigue siendo100: el aporte no es rendimiento.\n\n### Rendimiento con flujos\nCuando hay aportes y retiros, crecimiento del saldo no equivale a rentabilidad. TWR separa subperíodos para aislar flujos; MWR/TIR incorpora fechas y montos. Identificar qué método utiliza cada vista. No extrapolar una tasa anualizada de pocos días como resultado esperado.\n\n### Moneda y límites\nPara sumar posiciones en ARS y USD se necesita una moneda base, tipo de cambio identificado y momento de conversión. Una suba nominal puede convivir con pérdida de poder adquisitivo. Cotizaciones guardadas, activos sin liquidez y gastos faltantes limitan la precisión. Los cálculos de FINIX son registros de seguimiento; contrastarlos con operaciones efectivas del intermediario.",
    "keyTakeaways": [
      "Diferenciar saldo patrimonial y rentabilidad, ganancias realizadas y no realizadas, evitando mezclar monedas o contar aportes como rendimiento."
    ],
    "commonMistakes": [],
    "sources": [
      {
        "title": "Investor.gov: asignación de activos",
        "url": "https://www.investor.gov/introduction-investing/getting-started/asset-allocation"
      },
      {
        "title": "BYMA Educa: conceptos de inversión",
        "url": "https://www.bymaeduca.com.ar/pages/glosario1"
      }
    ]
  },
  {
    "slug": "negocio-directivos-y-estructura-accionaria",
    "title": "Negocio, directivos, accionistas y métricas de contexto",
    "summary": "Cómo interpretar CEO, empleados, cuota de mercado, ARR, acciones en circulación, flotante y tenencias institucionales o de directivos.",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "calidad",
    "level": "INTERMEDIATE",
    "isFeatured": false,
    "order": 111,
    "readTimeMinutes": 2,
    "formula": "Cuota de mercado = Ventas de la empresa / Ventas del mercado definido × 100; Tenencia = Acciones reportadas / Acciones del denominador × 100",
    "content": "### La ficha del negocio\nCEO o liderazgo, año de fundación y empleados describen a una empresa. No son señales automáticas de inversión. Verificar la fecha del reporte: un CEO puede cambiar, los empleados pueden contarse como personas o equivalentes de jornada completa y la antigüedad puede referirse a fundación, reorganización o salida a bolsa.\n\n### Cuota de mercado\nEs la participación sobre un mercado definido, por ventas, unidades u otra medida. Empresa ficticia vende50 millones en un mercado de 500 millones: cuota10%. Cambiar país, segmento, moneda o período cambia la comparación. Una cuota alta no demuestra rentabilidad ni poder de precios sin estudiar competencia y márgenes.\n\n### ARR e ingresos reconocidos\nEn negocios recurrentes, ARR anualiza suscripciones según las reglas del emisor. Con MRR ficticio1millón estable, la versión sencilla produce ARR12 millones. Eso no significa que ya se hayan cobrado ni reconocido12 millones como ingresos contables. Revisar inclusiones, cancelaciones, tipo de cambio y cambios de definición; el reporte del emisor es la fuente principal.\n\n### Acciones en circulación y flotante\nAcciones en circulación representan títulos emitidos que siguen fuera de tesorería según la definición reportada. Free float o flotante identifica la porción negociable libremente y puede excluir participaciones restringidas o de control. El número usado en capitalización puede diferir de las acciones promedio utilizadas en EPS.\n\n### Tenencia institucional y de directivos\nLa tenencia institucional informa participaciones reportadas por fondos y otros gestores; insiders se refiere a personas vinculadas a la dirección o control, según el reporte y la jurisdicción. Con 100 millones de acciones y una participación reportada de 5 millones, la tenencia sobre ese denominador es5%. No confundir porcentaje de acciones con porcentaje de votos cuando hay clases distintas.\n\n### Qué no se puede inferir\nUna compra o venta de directivos puede responder a compensación, diversificación o planes previstos; no prueba una expectativa de precio. Los reportes pueden publicarse con rezago, usar fechas distintas o incluir posiciones indirectas. No sumar porcentajes de diferentes fuentes sin comprobar denominadores y posibles duplicaciones. Combinar contexto con estados financieros, valoración y riesgos.",
    "sources": [
      {
        "title": "Investor.gov: investigar empresas, accionistas y directivos en EDGAR",
        "url": "https://www.investor.gov/introduction-investing/getting-started/researching-investments/using-edgar-research-investments"
      },
      {
        "title": "Adobe: Form 10-K 2025, definición reportada de ARR",
        "url": "https://www.sec.gov/Archives/edgar/data/796343/000079634326000003/adbe-20251128.htm"
      }
    ],
    "keyTakeaways": [
      "Identificar fecha, mercado y denominador de cada dato de contexto.",
      "ARR no equivale a ingreso contable; tenencias reportadas no predicen precios."
    ],
    "commonMistakes": [
      "Sumar participaciones de fechas o clases distintas.",
      "Usar empleados, liderazgo o antigüedad como prueba automática de calidad."
    ]
  }
];

for (const article of SEED_ARTICLES) {
    const illustration = TECHNICAL_IMAGES[article.slug];
    if (illustration && !article.content.includes('![')) article.content = illustration + article.content;
}

SEED_CATEGORIES.push(ASSET_CATEGORY);
SEED_ARTICLES.push(...EDUCATION_EXPANSION);
for (const article of SEED_ARTICLES) { article.content = deepenLesson(article.slug, article.content); article.readTimeMinutes = lessonReadTime(article.content); }


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
