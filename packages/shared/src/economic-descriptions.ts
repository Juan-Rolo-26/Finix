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
        description: 'Índice del Instituto de Gestión del Abastecimiento (ISM) que evalúa compras, empleo y nuevos pedidos. Sobre 50 puntos refleja expansión del sector.',
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
        description: 'Índice de Precios al Consumidor excluyendo alimentos y energía. Muestra la tendencia de fondo de la inflación minorista en EE. UU.',
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
        description: 'Mide el gasto total de los consumidores en tiendas físicas y plataformas digitales. El consumo representa cerca del 70% de la economía de EE. UU.',
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

/** Reviewed names match the complete indicator, never partial English sentences. */
const EVENT_NAMES: Array<[RegExp, string, string?]> = [
    [/MBA Mortgage Refinance Index/i, 'Índice de refinanciación hipotecaria (MBA)', 'Mide el volumen semanal de solicitudes de refinanciación hipotecaria en Estados Unidos, según la encuesta de la MBA.'],
    [/MBA Mortgage Market Index/i, 'Índice del mercado hipotecario (MBA)', 'Mide el volumen de solicitudes de préstamos hipotecarios para compra y refinanciación de viviendas en Estados Unidos.'],
    [/MBA Mortgage Applications/i, 'Solicitudes de hipotecas (MBA)', 'Variación semanal de las solicitudes de préstamos hipotecarios para compra y refinanciación de viviendas en Estados Unidos.'],
    [/MBA Purchase Index/i, 'Índice de solicitudes de hipotecas para compra (MBA)', 'Mide el volumen semanal de solicitudes de préstamos hipotecarios destinados a la compra de viviendas.'],
    [/MBA 30-Year Mortgage Rate/i, 'Tasa hipotecaria a 30 años (MBA)', 'Tasa de interés de las hipotecas a 30 años informada en la encuesta semanal de la MBA.'],
    [/(15|30)-Year Mortgage Rate/i, 'Tasa hipotecaria', 'Tasa de interés informada para préstamos hipotecarios del plazo indicado.'],
    [/ADP Employment Change Weekly/i, 'Variación semanal del empleo privado (ADP)', 'Estimación semanal de la variación del empleo privado en Estados Unidos elaborada por ADP.'],
    [/ADP Employment Change/i, 'Variación del empleo privado (ADP)', 'Variación mensual del empleo privado en Estados Unidos estimada por ADP.'],
    [/GDP Sales/i, 'Ventas finales de la producción interna', 'Mide la producción interna vendida a compradores finales, excluyendo la variación de inventarios del PIB.'],
    [/GDP Price Index/i, 'Índice de precios del PIB', 'Mide la variación de los precios de los bienes y servicios incluidos en el producto interno bruto.'],
    [/GDP Growth Rate|Gross Domestic Product|GDP/i, 'Crecimiento del PIB'],
    [/Goods Trade Balance/i, 'Balanza comercial de bienes', 'Diferencia entre las exportaciones y las importaciones de bienes. Un saldo positivo indica superávit y uno negativo, déficit.'],
    [/Balance of Trade|Trade Balance/i, 'Balanza comercial', 'Diferencia entre el valor de las exportaciones y las importaciones informadas por la fuente.'],
    [/Current Account/i, 'Cuenta corriente', 'Registra operaciones con el exterior de bienes, servicios, ingresos y transferencias corrientes.'],
    [/Exports/i, 'Exportaciones', 'Valor de las ventas de bienes o servicios al exterior informadas por la fuente.'],
    [/Imports/i, 'Importaciones', 'Valor de las compras de bienes o servicios al exterior informadas por la fuente.'],
    [/Core PCE Price Index|Core PCE Prices/i, 'Índice de precios del consumo personal subyacente (PCE)'],
    [/PCE Price Index|PCE Prices/i, 'Índice de precios del consumo personal (PCE)'],
    [/Core CPI|Core Consumer Price Index/i, 'Índice de precios al consumidor subyacente (IPC)'],
    [/CPI|Consumer Price Index|Inflation Rate/i, 'Índice de precios al consumidor (IPC)'],
    [/Core PPI/i, 'Índice de precios al productor subyacente (IPP)'],
    [/PPI|Producer Price Index/i, 'Índice de precios al productor (IPP)'],
    [/Import Price Index/i, 'Índice de precios de importación'],
    [/Export Price Index/i, 'Índice de precios de exportación'],
    [/Corporate Profits/i, 'Ganancias empresariales', 'Resultados agregados de las empresas correspondientes al período informado.'],
    [/Real Consumer Spending/i, 'Gasto real de los consumidores', 'Mide el gasto de consumo ajustado para descontar el efecto de la variación de precios.'],
    [/Real Personal Spending/i, 'Gasto personal real', 'Mide el gasto de los hogares ajustado por la variación de precios.'],
    [/Personal Spending/i, 'Gasto personal'],
    [/Personal Income/i, 'Ingresos personales'],
    [/Consumer Credit Change/i, 'Variación del crédito al consumidor', 'Mide el cambio en el crédito concedido a los consumidores durante el período informado.'],
    [/Consumer Inflation Expectations/i, 'Expectativas de inflación de los consumidores', 'Inflación que los consumidores esperan para el período consultado en la encuesta.'],
    [/CB Consumer Confidence|Consumer Confidence/i, 'Confianza del consumidor'],
    [/Michigan 5 Year Inflation Expectations/i, 'Expectativas de inflación a 5 años de Michigan'],
    [/Michigan Inflation Expectations/i, 'Expectativas de inflación de Michigan'],
    [/Michigan Consumer Expectations/i, 'Expectativas del consumidor de Michigan'],
    [/Michigan Consumer Sentiment/i, 'Confianza del consumidor de Michigan'],
    [/Michigan Current Conditions/i, 'Condiciones actuales del consumidor de Michigan'],
    [/RCM\/TIPP Economic Optimism Index/i, 'Índice de optimismo económico (RCM/TIPP)', 'Encuesta sobre la percepción de las condiciones económicas y las perspectivas de los consumidores.'],
    [/Retail Sales/i, 'Ventas minoristas'],
    [/Redbook/i, 'Ventas minoristas de Redbook', 'Variación de las ventas de una muestra de comercios minoristas relevada por Redbook.'],
    [/Retail Inventories Ex Autos/i, 'Inventarios minoristas sin vehículos', 'Mide las existencias de los comercios minoristas excluyendo los vehículos.'],
    [/Wholesale Inventories/i, 'Inventarios mayoristas', 'Mide las existencias de bienes de los comercios mayoristas.'],
    [/Total Vehicle Sales/i, 'Ventas totales de vehículos', 'Cantidad de vehículos vendidos durante el período informado.'],
    [/Used Car Prices/i, 'Precios de vehículos usados', 'Mide la evolución de los precios de los vehículos usados.'],
    [/Nonfarm Payrolls Private|Non Farm Payrolls Private/i, 'Empleo privado no agrícola'],
    [/Nonfarm Payrolls|Non Farm Payrolls|Non-Farm Employment/i, 'Empleo no agrícola'],
    [/Manufacturing Payrolls/i, 'Empleo manufacturero', 'Cantidad de puestos de trabajo en el sector manufacturero.'],
    [/Government Payrolls/i, 'Empleo público', 'Cantidad de puestos de trabajo en el sector público.'],
    [/U-6 Unemployment Rate/i, 'Tasa ampliada de desempleo (U-6)', 'Incluye personas desempleadas, personas con vinculación marginal al mercado laboral y quienes trabajan a tiempo parcial por razones económicas.'],
    [/Unemployment Rate/i, 'Tasa de desempleo'],
    [/Participation Rate|Labor Force Participation/i, 'Tasa de participación laboral', 'Porcentaje de la población de referencia que trabaja o busca empleo.'],
    [/Average Hourly Earnings/i, 'Salarios medios por hora'],
    [/Average Weekly Hours/i, 'Horas semanales promedio', 'Promedio de horas trabajadas por semana durante el período informado.'],
    [/Challenger Job Cuts/i, 'Despidos anunciados (Challenger)', 'Cantidad de recortes de empleo anunciados por empresas en el informe de Challenger.'],
    [/Jobless Claims 4-week Average/i, 'Promedio de solicitudes de desempleo de 4 semanas'],
    [/Initial Jobless Claims/i, 'Solicitudes iniciales de desempleo'],
    [/Continuing Jobless Claims|Continuing Claims/i, 'Solicitudes continuas de desempleo'],
    [/JOLTs Job Openings|Job Openings/i, 'Puestos de trabajo vacantes (JOLTS)'],
    [/JOLTs Job Quits/i, 'Renuncias laborales (JOLTS)', 'Cantidad de trabajadores que dejan voluntariamente sus empleos, según la encuesta JOLTS.'],
    [/Dallas Fed Services Revenues Index/i, 'Índice de ingresos de servicios de Dallas', 'Encuesta de la Reserva Federal de Dallas sobre la evolución de los ingresos del sector de servicios.'],
    [/Dallas Fed Services Index/i, 'Índice de servicios de Dallas'],
    [/Dallas Fed Manufacturing Index/i, 'Índice manufacturero de Dallas'],
    [/Empire State Manufacturing Index|NY Fed Manufacturing Index/i, 'Índice manufacturero de Nueva York'],
    [/Philadelphia Fed Manufacturing Index|Philly Fed Manufacturing Index/i, 'Índice manufacturero de Filadelfia'],
    [/Richmond Fed Manufacturing Index/i, 'Índice manufacturero de Richmond'],
    [/Kansas City Fed Manufacturing Index/i, 'Índice manufacturero de Kansas City'],
    [/Chicago PMI/i, 'Índice de gestores de compras de Chicago (PMI)'],
    [/ISM Manufacturing Employment/i, 'Empleo manufacturero (ISM)', 'Componente de empleo de la encuesta manufacturera del ISM.'],
    [/ISM Manufacturing New Orders/i, 'Nuevos pedidos manufactureros (ISM)', 'Componente de nuevos pedidos de la encuesta manufacturera del ISM.'],
    [/ISM Manufacturing Prices/i, 'Precios manufactureros (ISM)', 'Componente de precios de la encuesta manufacturera del ISM.'],
    [/ISM Manufacturing PMI/i, 'Índice de gestores de compras manufactureros (ISM)'],
    [/ISM Services Business Activity/i, 'Actividad empresarial de servicios (ISM)', 'Componente de actividad empresarial de la encuesta de servicios del ISM.'],
    [/ISM Services Employment/i, 'Empleo en servicios (ISM)', 'Componente de empleo de la encuesta de servicios del ISM.'],
    [/ISM Services New Orders/i, 'Nuevos pedidos de servicios (ISM)', 'Componente de nuevos pedidos de la encuesta de servicios del ISM.'],
    [/ISM Services Prices/i, 'Precios de servicios (ISM)', 'Componente de precios de la encuesta de servicios del ISM.'],
    [/ISM Services PMI|ISM Non-Manufacturing PMI/i, 'Índice de gestores de compras de servicios (ISM)'],
    [/S&P Global Composite PMI/i, 'Índice compuesto de gestores de compras (S&P Global)'],
    [/S&P Global Manufacturing PMI/i, 'Índice de gestores de compras manufactureros (S&P Global)'],
    [/S&P Global Services PMI/i, 'Índice de gestores de compras de servicios (S&P Global)'],
    [/LMI Logistics Managers Index/i, 'Índice de gestores de logística (LMI)', 'Encuesta sobre las condiciones de la actividad logística, transporte y almacenamiento.'],
    [/Industrial Production/i, 'Producción industrial', 'Mide la evolución de la producción del sector industrial durante el período informado.'],
    [/Factory Orders ex Transportation/i, 'Pedidos industriales sin transporte', 'Mide los nuevos pedidos de la industria excluyendo el sector de transporte.'],
    [/Factory Orders/i, 'Pedidos industriales', 'Mide los nuevos pedidos recibidos por la industria.'],
    [/Durable Goods Orders/i, 'Pedidos de bienes duraderos'],
    [/Construction Spending/i, 'Gasto en construcción', 'Valor del gasto en obras de construcción durante el período informado.'],
    [/Building Permits/i, 'Permisos de construcción'],
    [/Housing Starts/i, 'Inicio de construcción de viviendas'],
    [/Existing Home Sales/i, 'Ventas de viviendas existentes'],
    [/New Home Sales/i, 'Ventas de viviendas nuevas'],
    [/Pending Home Sales/i, 'Ventas pendientes de viviendas', 'Mide contratos firmados para la compra de viviendas cuya operación todavía no se completó.'],
    [/S&P\/Case-Shiller Home Price/i, 'Precios de viviendas (S&P/Case-Shiller)'],
    [/House Price Index|Home Price Index/i, 'Índice de precios de viviendas'],
    [/Fed Balance Sheet/i, 'Balance de la Reserva Federal', 'Informa los activos y pasivos del balance de la Reserva Federal.'],
    [/FOMC Minutes/i, 'Minutas de la Reserva Federal'],
    [/Fed Interest Rate Decision|FOMC Rate Decision/i, 'Decisión de tasas de la Reserva Federal'],
    [/Beige Book/i, 'Libro Beige de la Reserva Federal'],
    [/Fed ([A-Za-z -]+) Speech|Fed ([A-Za-z -]+) Speaks/i, 'Discurso de la Reserva Federal', 'Intervención de un funcionario de la Reserva Federal sobre economía y política monetaria.'],
    [/NY Fed Bill Purchases 1 to 4 months/i, 'Compras de letras de la Reserva Federal de Nueva York a 1–4 meses', 'Operaciones de compra de letras del Tesoro con vencimientos de 1 a 4 meses.'],
    [/NY Fed Bill Purchases 4 to 12 months/i, 'Compras de letras de la Reserva Federal de Nueva York a 4–12 meses', 'Operaciones de compra de letras del Tesoro con vencimientos de 4 a 12 meses.'],
    [/\d+-(Week|Month) Bill Auction/i, 'Subasta de letras del Tesoro'],
    [/\d+-Year (Note|Bond) Auction/i, 'Subasta de bonos del Tesoro'],
    [/TIPS Auction/i, 'Subasta de bonos protegidos contra la inflación (TIPS)'],
    [/API Crude Oil Stock Change/i, 'Variación de inventarios de petróleo (API)', 'Variación semanal de los inventarios de petróleo informada por el Instituto Americano del Petróleo (API).'],
    [/EIA Crude Oil Imports Change/i, 'Variación de importaciones de petróleo (EIA)', 'Cambio semanal en las importaciones de petróleo informado por la EIA.'],
    [/EIA Cushing Crude Oil Stocks Change/i, 'Variación de inventarios de petróleo en Cushing (EIA)', 'Cambio semanal en las existencias de petróleo del centro de almacenamiento de Cushing.'],
    [/EIA Crude Oil Stocks Change|Crude Oil Inventories/i, 'Variación de inventarios de petróleo (EIA)'],
    [/EIA Distillate Fuel Production Change/i, 'Variación de producción de combustibles destilados (EIA)', 'Cambio semanal en la producción de combustibles destilados informado por la EIA.'],
    [/EIA Distillate Stocks Change/i, 'Variación de inventarios de combustibles destilados (EIA)', 'Cambio semanal en las existencias de combustibles destilados informado por la EIA.'],
    [/EIA Gasoline Production Change/i, 'Variación de producción de nafta (EIA)', 'Cambio semanal en la producción de nafta informado por la EIA.'],
    [/EIA Gasoline Stocks Change/i, 'Variación de inventarios de nafta (EIA)', 'Cambio semanal en las existencias de nafta informado por la EIA.'],
    [/EIA Heating Oil Stocks Change/i, 'Variación de inventarios de combustible para calefacción (EIA)', 'Cambio semanal en las existencias de combustible para calefacción informado por la EIA.'],
    [/EIA Natural Gas Stocks Change|Natural Gas Storage/i, 'Variación de inventarios de gas natural (EIA)'],
    [/EIA Refinery Crude Runs Change/i, 'Variación del petróleo procesado en refinerías (EIA)', 'Cambio semanal en el volumen de petróleo que procesan las refinerías.'],
    [/Baker Hughes Oil Rig Count/i, 'Cantidad de equipos petroleros activos (Baker Hughes)', 'Cantidad de equipos de perforación petrolera activos relevada por Baker Hughes.'],
    [/Baker Hughes Total Rigs Count/i, 'Cantidad total de equipos de perforación activos (Baker Hughes)', 'Cantidad de equipos de perforación activos relevada por Baker Hughes.'],
    [/Quarterly Grain Stocks - Corn/i, 'Inventarios trimestrales de maíz', 'Existencias de maíz informadas en el relevamiento trimestral.'],
    [/Quarterly Grain Stocks - Soy/i, 'Inventarios trimestrales de soja', 'Existencias de soja informadas en el relevamiento trimestral.'],
    [/Quarterly Grain Stocks - Wheat/i, 'Inventarios trimestrales de trigo', 'Existencias de trigo informadas en el relevamiento trimestral.'],
    [/WASDE Report/i, 'Informe de oferta y demanda agrícola (WASDE)', 'Informe sobre las estimaciones de oferta y demanda de productos agrícolas.'],
    [/Tax Revenue/i, 'Recaudación tributaria', 'Ingresos recaudados por el Estado mediante impuestos.'],
];

const normalizeWords = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z]+/g) || [];
const extraSpanishWords = 'publicacion informacion economica economia argentino argentina estadounidense estados unidos mundial internacional oficial privado privada indice indices cambio cambios prestamos prestamo hipotecario hipotecaria hipotecas refinanciacion refinanciaciones solicitudes compra compras venta ventas datos dato disponible disponibles detalle consultar consulta consulte mensual trimestral semanal anual definitiva definitivo final finales preliminar preliminares avanzada avance anticipado ajustado ajustada estacionalmente sin con del al los las el la un una unos unas y o de en a por para que se es son sus sobre entre esta este estas estos hay no solo cada mes meses semana semanas ano anos respecto anterior anteriores periodo periodos variacion crecimiento actividad produccion inventarios empleos empleo importacion exportacion importaciones exportaciones industria producto interno bruto condiciones actual actuales proxima proximo presenta resultados manufacturero manufacturera servicios subyacente informacion programado programada pendiente pendientes informe informes manual revisado revisada esperada esperado financiera financiero fuente fuentes calendario economico economicos publicados publicadas datos tasa tasas balanza comercio mercaderias balance banco central consumidor consumidores precios inflacion deflactor argentina indec bcra adp mba ism fomc pmi pce ipc ipp pib eia api jolts lmi wasde tips rcm tipp eps bps ee uu s p global conference board institute supply management redbook case shiller baker hughes';
// Unknown prose is never passed through. Only reviewed Spanish vocabulary and proper names are displayable.
const reviewedWords = new Set(normalizeWords([
    extraSpanishWords + ' evento eventos actualizado actualizada interanual Barkin Bowman Collins Goolsbee Kashkari Logan Musalem Schmid Williams Powell Waller Barr Daly Bostic Hammack Miran Cook Jefferson Kugler Harker enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre',
    ...INDICATOR_RULES.map(rule => rule.description),
    ...EVENT_NAMES.flatMap(([, title, description]) => [title, description || '']),
].join(' ')));
function isReviewedSpanish(text: string): boolean {
    const words = normalizeWords(text);
    return words.length > 0 && words.every(word => reviewedWords.has(word))
        && /\b(de|del|la|el|los|las|en|por|para|sin|con|y|al|no|evento|informe|indice|tasa|variacion|produccion|exportaciones|importaciones|recaudacion|ventas|ingresos|empleo|horas|cuenta|salarios|despidos|renuncias|pedidos|actividad|precios|balanza|inventarios)\b/i.test(normalizeWords(text).join(' '));
}
function concise(text: string): string {
    const clean = text.replace(/\s+/g, ' ').trim();
    return clean.length <= 280 ? clean : clean.slice(0, 277).replace(/[,;.\s]+$/, '') + '…';
}
function indicatorName(raw: string) {
    const title = (raw || '').replace(/\s+/g, ' ').trim();
    for (const [pattern, spanish, description] of EVENT_NAMES) {
        const match = title.match(pattern);
        if (!match || match.index !== 0) continue;
        const tail = title.slice(match[0].length).trim();
        if (!/^(?:(?:MoM|YoY|QoQ|WoW|Final|Prel|Preliminary|Adv|Advance|Flash|SA|NSA|\((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\))\s*)*$/i.test(tail)) continue;
        return { spanish, description, matched: match[0], tail };
    }
    return null;
}

/** A complete translated name; unknown foreign names have a Spanish display fallback. */
export function formatEconomicEventTitle(rawTitle: string, country?: string): string {
    const title = (rawTitle || '').replace(/\s+/g, ' ').trim();
    if (isReviewedSpanish(title)) return title;
    const name = indicatorName(title);
    if (!name) return country?.toUpperCase() === 'AR' ? 'Publicación económica de Argentina' : 'Publicación económica';
    let spanish = name.spanish;
    const maturity = name.matched.match(/^(\d+)-(Week|Month|Year)/i);
    if (maturity) {
        const units: Record<string, string> = { week: 'semanas', month: 'meses', year: 'años' };
        spanish += ` a ${maturity[1]} ${units[maturity[2].toLowerCase()]}`;
    }
    const speech = name.matched.match(/^Fed ([A-Za-z -]+) (?:Speech|Speaks)$/i);
    if (speech && /^(Barkin|Bowman|Collins|Goolsbee|Kashkari|Logan|Musalem|Schmid|Williams|Powell|Waller|Barr|Daly|Bostic|Hammack|Miran|Cook|Jefferson|Kugler|Harker)$/i.test(speech[1])) spanish += `: ${speech[1]}`;
    const qualifiers: string[] = [];
    if (/\bMoM\b/i.test(name.tail)) qualifiers.push('variación mensual');
    if (/\bYoY\b/i.test(name.tail)) qualifiers.push('variación interanual');
    if (/\bQoQ\b/i.test(name.tail)) qualifiers.push('variación trimestral');
    if (/\bWoW\b/i.test(name.tail)) qualifiers.push('variación semanal');
    if (/\bFinal\b/i.test(name.tail)) qualifiers.push('dato definitivo');
    if (/\bPrel(?:iminary)?\b/i.test(name.tail)) qualifiers.push('dato preliminar');
    if (/\bAdv(?:ance)?\b/i.test(name.tail)) qualifiers.push('estimación preliminar');
    if (/\bFlash\b/i.test(name.tail)) qualifiers.push('estimación inicial');
    if (/\bNSA\b/i.test(name.tail)) qualifiers.push('sin ajuste estacional');
    else if (/\bSA\b/i.test(name.tail)) qualifiers.push('ajustado estacionalmente');
    const period = name.tail.match(/\(([A-Za-z]{3})\)/);
    if (period) {
        const months: Record<string, string> = { jan: 'enero', feb: 'febrero', mar: 'marzo', apr: 'abril', may: 'mayo', jun: 'junio', jul: 'julio', aug: 'agosto', sep: 'septiembre', oct: 'octubre', nov: 'noviembre', dec: 'diciembre' };
        qualifiers.push(`período: ${months[period[1].toLowerCase()]}`);
    }
    return qualifiers.length ? `${spanish} · ${qualifiers.join(' · ')}` : spanish;
}

/** No word-by-word replacement: reviewed explanations or a neutral Spanish fallback. */
export function formatEconomicEventDescription(title: string, rawDescription?: string, country?: string): string {
    const name = indicatorName(title);
    if (name?.description) return concise(name.description);
    if (country?.toUpperCase() === 'AR' && /consumer price|inflation|\bcpi\b|\bipc\b|inflación/i.test(title)) {
        return 'Mide la variación de los precios de una canasta de bienes y servicios consumidos por los hogares en Argentina.';
    }
    if (rawDescription && isReviewedSpanish(rawDescription)) return concise(rawDescription);
    // The existing catalog contains reviewed explanations for common indicators.
    const localizedTitle = name?.spanish || title;
    for (const rule of INDICATOR_RULES) {
        if (rule.pattern.test(title) || rule.pattern.test(localizedTitle)) return concise(rule.description);
    }
    if (country?.toUpperCase() === 'AR') return 'Publicación de información económica de Argentina. Consultá la fuente para conocer el detalle del indicador.';
    return 'Publicación de información económica. Consultá la fuente para conocer el detalle del indicador.';
}

/** Provider brands remain intact; generic source labels are displayed in Spanish. */
export function formatEconomicEventSource(source?: string): string {
    return (source || '').replace(/TradingView Economic Calendar/gi, 'Calendario económico de TradingView')
        .replace(/Admin Manual/gi, 'Carga manual').replace(/U\.S\. Bureau of Labor Statistics(?: \(BLS\))?/gi, 'Oficina de Estadísticas Laborales de EE. UU. (BLS)');
}

/** Localize at read time so persisted provider identity, scoring and numeric data stay intact. */
export function localizeEconomicEvent<T extends { title: string; description?: string | null; country?: string | null; source?: string | null; sourceName?: string | null }>(event: T): T {
    return {
        ...event,
        title: formatEconomicEventTitle(event.title, event.country || undefined),
        description: formatEconomicEventDescription(event.title, event.description || undefined, event.country || undefined),
        ...(event.source && { source: formatEconomicEventSource(event.source) }),
        ...(event.sourceName && { sourceName: formatEconomicEventSource(event.sourceName) }),
    };
}
