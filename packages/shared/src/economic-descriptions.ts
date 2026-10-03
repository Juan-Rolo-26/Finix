/**
 * Diccionario y normalizador de descripciones en español para eventos del calendario económico.
 * Garantiza que cada evento tenga una descripción concisa, profesional y de máximo ~7 renglones.
 */

interface IndicatorRule {
    pattern: RegExp;
    description: string;
}

const INDICATOR_RULES: IndicatorRule[] = [
    // --- Regional Fed Manufacturing & Services ---
    {
        pattern: /dallas fed (manufacturing|general activity|business)/i,
        description: 'Mide la actividad del sector manufacturero en Texas según una encuesta a directores ejecutivos. Valores superiores a 0 indican expansión fabril y bajo 0 contracción. Es un indicador clave de la producción industrial en EE. UU.',
    },
    {
        pattern: /dallas fed/i,
        description: 'Encuesta regional de la Reserva Federal de Dallas sobre la actividad económica, empleo y perspectivas del sector industrial y de servicios en Texas.',
    },
    {
        pattern: /empire state|ny fed|new york fed/i,
        description: 'Encuesta mensual sobre la actividad manufacturera en el estado de Nueva York. Lecturas superiores a 0 señalan expansión industrial y bajo 0 contracción.',
    },
    {
        pattern: /philly fed|philadelphia fed/i,
        description: 'Encuesta de manufactura del distrito de Filadelfia. Anticipa el dinamismo de la producción nacional, nuevos pedidos y presión en los costos fabriles.',
    },
    {
        pattern: /richmond fed/i,
        description: 'Evalúa la salud manufacturera y de servicios en el distrito de Richmond. Cifras positivas indican crecimiento en pedidos y despachos industriales.',
    },
    {
        pattern: /kansas.*fed/i,
        description: 'Mide el desempeño industrial y expectativas de negocios en el distrito de la Reserva Federal de Kansas City (Medio Oeste estadounidense).',
    },
    {
        pattern: /chicago pmi/i,
        description: 'Índice de actividad empresarial en la región de Chicago. Lecturas sobre 50 puntos señalan expansión en la actividad económica y bajo 50 contracción.',
    },

    // --- ISM & S&P Global PMIs ---
    {
        pattern: /ism (manufacturing|manuf)/i,
        description: 'Principal barómetro de la actividad industrial en EE. UU. Un registro superior a 50 puntos señala expansión del sector fabril y nuevos pedidos.',
    },
    {
        pattern: /ism (services|non-manufacturing)/i,
        description: 'Mide la actividad del sector de servicios en EE. UU. (mayor componente del PIB). Registros sobre 50 reflejan crecimiento económico sostenido.',
    },
    {
        pattern: /ism/i,
        description: 'Índice del Institute for Supply Management que evalúa compras, empleo y nuevos pedidos. Sobre 50 puntos refleja expansión del sector.',
    },
    {
        pattern: /s&p global.*(manufacturing|manuf).*pmi/i,
        description: 'Índice de gestores de compras sobre la salud del sector fabril de EE. UU. Mide producción, pedidos entrantes, empleo e inflación de costos.',
    },
    {
        pattern: /s&p global.*(services|servicios).*pmi/i,
        description: 'Evalúa las condiciones comerciales y demanda en el sector servicios privado. Sobre 50 puntos marca expansión de la actividad.',
    },
    {
        pattern: /s&p global.*composite.*pmi/i,
        description: 'Mide de forma agregada la actividad manufacturera y de servicios en el sector privado estadounidense.',
    },
    {
        pattern: /\bpmi\b/i,
        description: 'Índice de Gerentes de Compras. Valores sobre 50 reflejan expansión respecto al mes anterior; cifras menores señalan contracción de la actividad.',
    },

    // --- Empleo & Trabajo ---
    {
        pattern: /nonfarm payrolls|non-farm employment|\bnfp\b|nóminas no agrícolas/i,
        description: 'Mide la creación neta de empleos en EE. UU. excluyendo el sector agropecuario. Es el dato laboral más influyente en las decisiones de tasas de la Fed.',
    },
    {
        pattern: /unemployment rate|tasa de desempleo/i,
        description: 'Porcentaje de la fuerza laboral activa que no tiene empleo y busca trabajo activamente. Una suba sostenida anticipa enfriamiento económico.',
    },
    {
        pattern: /initial jobless claims|solicitudes iniciales de desempleo/i,
        description: 'Cantidad de personas que solicitan subsidio por desempleo por primera vez en la semana. Es un termómetro semanal líder del mercado de trabajo.',
    },
    {
        pattern: /continuing jobless claims|continuing claims|solicitudes continuas/i,
        description: 'Número de trabajadores desempleados que siguen cobrando asistencia estatal tras su solicitud inicial. Mide la dificultad para reinsertarse laboralmente.',
    },
    {
        pattern: /jobless claims|solicitudes de desempleo/i,
        description: 'Reporte semanal del Departamento de Trabajo sobre subsidios de desempleo. Refleja despidos recientes y la tensión en la contratación laboral.',
    },
    {
        pattern: /jolts|job openings|ofertas de empleo/i,
        description: 'Cantidad de puestos de trabajo vacantes en EE. UU. Un elevado número de vacantes por desempleado indica tensión salarial e inflación persistente.',
    },
    {
        pattern: /adp.*employment/i,
        description: 'Estimación mensual privada de la creación de puestos en el sector corporativo estadounidense, previa al informe oficial del gobierno.',
    },
    {
        pattern: /average hourly earnings|salarios medios por hora/i,
        description: 'Variación de las remuneraciones horarias de los trabajadores. Mide las presiones inflacionarias originadas por los costos salariales.',
    },

    // --- Inflación & Precios ---
    {
        pattern: /core cpi|ipc subyacente/i,
        description: 'Índice de Precios al Consumidor excluyendo alimentos frescos y energía volátil. Muestra la tendencia de fondo de la inflación minorista en EE. UU.',
    },
    {
        pattern: /cpi|consumer price index|ipc|inflación/i,
        description: 'Mide la evolución promedio de los precios de una canasta de bienes y servicios para los hogares. Dato clave que guía la política monetaria de la Fed.',
    },
    {
        pattern: /core pce|pce subyacente/i,
        description: 'Índice de Gasto en Consumo Personal Subyacente. Es la medida de inflación predilecta de la Reserva Federal para orientar la tasa de interés.',
    },
    {
        pattern: /pce price index|pce|gasto en consumo personal/i,
        description: 'Mide la variación en los precios que pagan los consumidores estadounidenses. Seguida de cerca por la Fed por su canasta de consumo actualizada.',
    },
    {
        pattern: /core ppi|ipp subyacente/i,
        description: 'Inflación mayorista a nivel de producción excluyendo componentes volátiles. Anticipa presiones que más tarde se trasladan al consumidor.',
    },
    {
        pattern: /producer price index|\bppi\b|precios de producción|ipp/i,
        description: 'Mide el cambio en los precios de venta recibidos por los productores nacionales. Señala costos industriales antes de llegar al canal minorista.',
    },
    {
        pattern: /import price index|export price index/i,
        description: 'Mide la variación de precios en bienes importados y exportados, reflejando el impacto de divisas y aranceles sobre la inflación.',
    },

    // --- Crecimiento & PIB ---
    {
        pattern: /gdp|gross domestic product|pib/i,
        description: 'Valor monetario total de bienes y servicios finales producidos en el período. Principal medida de la salud y ritmo de expansión económica.',
    },

    // --- Consumo & Confianza ---
    {
        pattern: /retail sales|ventas minoristas/i,
        description: 'Mide el gasto total de los consumidores en tiendas físicas y plataformas online. El consumo representa cerca del 70% de la economía de EE. UU.',
    },
    {
        pattern: /michigan.*(sentiment|consumer|expectations)/i,
        description: 'Encuesta de la Universidad de Michigan sobre el estado de ánimo de los consumidores, perspectivas de empleo e inflación proyectada a 1 y 5 años.',
    },
    {
        pattern: /consumer confidence|confianza del consumidor/i,
        description: 'Índice del Conference Board sobre la percepción ciudadana del mercado laboral y expectativas económicas a corto y mediano plazo.',
    },
    {
        pattern: /personal income|personal spending/i,
        description: 'Ingresos y gastos personales de los hogares estadounidenses. Permite evaluar la capacidad de ahorro y fortaleza de la demanda agregada.',
    },

    // --- Construcción & Vivienda ---
    {
        pattern: /building permits|permisos de construcción/i,
        description: 'Número de autorizaciones oficiales para nuevas construcciones residenciales. Indicador adelantado de la inversión inmobiliaria.',
    },
    {
        pattern: /housing starts|inicios de viviendas/i,
        description: 'Cantidad de viviendas residenciales que comenzaron obras durante el mes reportado. Refleja la actividad del sector de la construcción.',
    },
    {
        pattern: /existing home sales|ventas de viviendas existentes/i,
        description: 'Mide el volumen de compraventa de casas usadas en EE. UU. Representa la mayor parte del mercado inmobiliario residencial.',
    },
    {
        pattern: /new home sales|ventas de viviendas nuevas/i,
        description: 'Ventas de casas unifamiliares recién construidas. Altamente sensible a la evolución de las tasas de interés hipotecarias.',
    },
    {
        pattern: /case-shiller|home price index/i,
        description: 'Evolución de los precios inmobiliarios residenciales en las principales áreas metropolitanas estadounidenses.',
    },

    // --- Reserva Federal & Política Monetaria ---
    {
        pattern: /fed interest rate decision|fomc rate decision|decisión de tasas fed|interest rate decision/i,
        description: 'Decisión del Comité de Mercado Abierto (FOMC) sobre la tasa de interés de referencia. Determina el costo del dinero e impacta en todos los activos.',
    },
    {
        pattern: /fomc minutes|minutas de la fed|minutas fomc/i,
        description: 'Registro pormenorizado de las discusiones entre funcionarios de la Fed sobre inflación, actividad económica y proyecciones de tasas futuras.',
    },
    {
        pattern: /powell speaks|fed chair powell|discurso de powell/i,
        description: 'Intervención del presidente de la Reserva Federal. Los inversores analizan cada frase en busca de pistas sobre el rumbo de la política monetaria.',
    },
    {
        pattern: /fed.*speaks|fomc member.*speaks|discurso.*fed/i,
        description: 'Discurso de un gobernador o presidente regional de la Reserva Federal, aportando perspectivas sobre la economía y expectativas de tasas.',
    },
    {
        pattern: /beige book|libro beige/i,
        description: 'Informe cualitativo de la Reserva Federal sobre las condiciones económicas y comerciales vigentes en sus 12 distritos regionales.',
    },

    // --- Subastas del Tesoro (Treasury Auctions) ---
    {
        pattern: /(3-month|6-month|1-month|4-week|8-week|13-week|26-week|52-week).*bill auction/i,
        description: 'Subasta de letras del Tesoro de EE. UU. a corto plazo. Determina el rendimiento de descuento y el nivel de liquidez inmediata en dólares.',
    },
    {
        pattern: /(2-year|3-year|5-year|7-year|10-year).*note auction/i,
        description: 'Subasta de bonos del Tesoro de EE. UU. La tasa de corte y el ratio de demanda reflejan el apetito global de los inversores por renta fija soberana.',
    },
    {
        pattern: /(20-year|30-year).*bond auction/i,
        description: 'Subasta de títulos soberanos a largo plazo. Su rendimiento influye en los costos de financiamiento hipotecario y corporativo a largo plazo.',
    },
    {
        pattern: /tips auction/i,
        description: 'Subasta de bonos del Tesoro protegidos contra la inflación (TIPS). Refleja las expectativas del mercado sobre la inflación futura.',
    },
    {
        pattern: /treasury.*auction|subasta del tesoro/i,
        description: 'Emisión de deuda pública por parte del Tesoro de EE. UU. Sirve para calibrar la demanda internacional de activos libres de riesgo.',
    },

    // --- Energía & Materias Primas ---
    {
        pattern: /crude oil inventories|inventarios de petróleo/i,
        description: 'Variación semanal en la cantidad de barriles de crudo comercial almacenados en EE. UU. según la EIA. Impacta en el precio del barril WTI.',
    },
    {
        pattern: /natural gas storage|inventarios de gas/i,
        description: 'Variación semanal en las reservas subterráneas de gas natural en EE. UU., clave para los precios energéticos estacionales.',
    },

    // --- Comercio Exterior & Pedidos ---
    {
        pattern: /trade balance|balanza comercial/i,
        description: 'Diferencia entre el valor de las exportaciones e importaciones de bienes y servicios. Un superávit o déficit afecta la demanda del dólar.',
    },
    {
        pattern: /durable goods|pedidos de bienes duraderos/i,
        description: 'Mide los nuevos pedidos recibidos por fabricantes para artículos con vida útil prolongada (maquinaria, transporte). Señala la inversión empresarial.',
    },

    // --- Argentina: INDEC & BCRA ---
    {
        pattern: /indec.*ipc|ipc.*indec|inflación.*argentina/i,
        description: 'Índice de Precios al Consumidor mensual elaborado por el INDEC. Determina la tasa de inflación en Argentina y el rendimiento de bonos en pesos.',
    },
    {
        pattern: /ipim|precios mayoristas/i,
        description: 'Índice de Precios Internos al Por Mayor medido por el INDEC. Refleja la variación de costos de producción nacional e importada en Argentina.',
    },
    {
        pattern: /bcra.*tasa|tasa.*bcra|política monetaria.*bcra/i,
        description: 'Decisión del Banco Central de la República Argentina sobre la tasa de interés de referencia. Influye en plazos fijos, Lecaps y tipo de cambio.',
    },
    {
        pattern: /emae|actividad económica.*indec/i,
        description: 'Estimador Mensual de Actividad Económica del INDEC. Anticipa el comportamiento del PIB nacional midiendo sectores clave como agro e industria.',
    },
    {
        pattern: /resultado fiscal|superávit fiscal|déficit fiscal/i,
        description: 'Informe de las cuentas públicas del Sector Público Nacional. El equilibrio o superávit fiscal es el eje central del ancla económica argentina.',
    },
    {
        pattern: /balanza comercial.*indec|ica.*indec/i,
        description: 'Intercambio Comercial Argentino medido por el INDEC. Muestra el saldo neto de divisas generado por exportaciones agroindustriales e importaciones.',
    },
    {
        pattern: /reservas.*bcra|reservas internacionales/i,
        description: 'Nivel y variación de las reservas del Banco Central. Es una métrica crítica para la solvencia externa, deuda y estabilidad cambiaria.',
    },
];

/**
 * Traduce o sintetiza un párrafo en inglés a un texto conciso en español de máximo ~7 renglones.
 */
function translateAndCondenseEnglish(text: string): string {
    let clean = text
        .replace(/\s+/g, ' ')
        .trim();

    // Reemplazos de frases comunes de TradingView / FMP
    const replacements: [RegExp, string][] = [
        [/the\s+([a-z\s]+)\s+measures the performance of/gi, 'Mide el desempeño de'],
        [/the\s+([a-z\s]+)\s+measures the/gi, 'Mide la'],
        [/measures the change in/gi, 'Mide la variación en'],
        [/tracks variables such as output, employment, orders and prices/gi, 'Evalúa variables clave como producción, empleo, pedidos y costos'],
        [/a reading above 0 indicates an expansion.*?below 0 represents a contraction.*?while 0 indicates no change/gi, 'Valores sobre 0 indican expansión y bajo 0 contracción'],
        [/a reading above 50 indicates expansion.*?below 50 indicates contraction/gi, 'Registros sobre 50 marcan expansión del sector y bajo 50 contracción'],
        [/a reading above 0 indicates.*?below 0 indicates.*/gi, 'Valores sobre 0 reflejan crecimiento y bajo 0 retroceso'],
        [/compared to the previous month/gi, 'respecto al mes anterior'],
        [/the index is derived from a survey of/gi, 'Surge de un relevamiento a'],
        [/business executives/gi, 'directivos de empresas'],
        [/factory activity/gi, 'actividad fabril'],
        [/manufacturing output/gi, 'producción manufacturera'],
        [/first as an exporter/gi, 'primer exportador'],
        [/in the state of/gi, 'en el estado de'],
        [/united states|u\.s\./gi, 'EE. UU.'],
    ];

    for (const [pattern, rep] of replacements) {
        clean = clean.replace(pattern, rep);
    }

    // Si aún tiene mucho inglés residual o es muy largo, recortamos a las primeras 2-3 oraciones
    const sentences = clean.split(/(?<=[.?!])\s+/).filter(Boolean);
    if (sentences.length > 2) {
        clean = sentences.slice(0, 2).join(' ');
    }

    // Límite de caracteres estricto para no superar 7 renglones (unos 280 caracteres aprox.)
    if (clean.length > 280) {
        clean = clean.slice(0, 277).replace(/[,;.\s]+$/, '') + '...';
    }

    return clean;
}

/**
 * Retorna una descripción concisa en español (máx. 7 renglones) para cualquier evento del calendario.
 */
export function formatEconomicEventDescription(
    title: string,
    rawDescription?: string,
    country?: string,
): string {
    const cleanTitle = (title || '').trim();

    // 1. Buscar coincidencia en el diccionario de reglas especializadas
    for (const rule of INDICATOR_RULES) {
        if (rule.pattern.test(cleanTitle)) {
            return rule.description;
        }
    }

    // 2. Si vino descripción previa
    if (rawDescription && rawDescription.trim().length > 0) {
        const desc = rawDescription.trim();
        // Verificar si contiene texto en inglés para adaptarlo
        const isEnglish = /\b(the|measures|indicates|expansion|contraction|survey|index|report|rate|month|year)\b/i.test(desc);
        if (isEnglish) {
            // Revisar si la descripción misma menciona el indicador
            for (const rule of INDICATOR_RULES) {
                if (rule.pattern.test(desc)) {
                    return rule.description;
                }
            }
            return translateAndCondenseEnglish(desc);
        }

        // Si ya está en español, asegurar que no supere 7 renglones
        if (desc.length > 280) {
            return desc.slice(0, 277).replace(/[,;.\s]+$/, '') + '...';
        }
        return desc;
    }

    // 3. Fallback inteligente según país y palabras clave en el título
    const cleanCountry = (country || 'US').toUpperCase();
    if (cleanCountry === 'AR') {
        return `Indicador oficial de la economía argentina. Aporta datos sobre el nivel de actividad, precios o política monetaria nacional.`;
    }

    if (/auction|subasta/i.test(cleanTitle)) {
        return `Subasta de títulos de deuda del Tesoro de EE. UU. Determina el rendimiento de corte y refleja la demanda del mercado de bonos.`;
    }

    if (/index|índice|pmi/i.test(cleanTitle)) {
        return `Indicador macroeconómico de coyuntura en EE. UU. Refleja el dinamismo operativo y las expectativas de los agentes económicos.`;
    }

    return `Indicador económico de EE. UU. con relevancia para la evaluación de la actividad, inflación y perspectivas de tasas de interés.`;
}
