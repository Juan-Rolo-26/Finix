import type { SeedArticle, SeedCategory } from './education-seed.data';

export const ASSET_CATEGORY: SeedCategory = {
  "name": "Tipos de activos",
  "slug": "tipos-de-activos",
  "description": "Cómo funcionan acciones, bonos, letras, ON, CEDEARs, ETF, depósitos, Bitcoin y opciones. Derechos, rendimientos y riesgos de cada instrumento.",
  "icon": "Landmark",
  "order": 6,
  "subcategories": [
    {
      "name": "Renta variable",
      "slug": "activos-renta-variable",
      "description": "Acciones y CEDEARs",
      "order": 1
    },
    {
      "name": "Renta fija",
      "slug": "activos-renta-fija",
      "description": "Bonos, letras y obligaciones negociables",
      "order": 2
    },
    {
      "name": "Fondos cotizados",
      "slug": "activos-fondos",
      "description": "ETF y exposición a carteras",
      "order": 3
    },
    {
      "name": "Depósitos bancarios",
      "slug": "activos-depositos",
      "description": "Plazos fijos tradicionales y ajustables",
      "order": 4
    },
    {
      "name": "Activos digitales",
      "slug": "activos-digitales",
      "description": "Bitcoin y custodia",
      "order": 5
    },
    {
      "name": "Derivados",
      "slug": "activos-derivados",
      "description": "Opciones call y put",
      "order": 6
    }
  ]
};

export const EDUCATION_EXPANSION: SeedArticle[] = [
  {
    "title": "Revenue: ingresos, ventas y reconocimiento contable",
    "slug": "revenue-ingresos-reconocimiento",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "estados-financieros",
    "level": "INTERMEDIATE",
    "order": 50,
    "isFeatured": false,
    "summary": "Qué representa la facturación, cuándo se reconoce y por qué vender, cobrar y ganar dinero son cosas diferentes.",
    "formula": "Crecimiento de ingresos = (ingresos actuales / ingresos comparables anteriores − 1) × 100",
    "sources": [
      {
        "title": "IFRS Foundation · IFRS 15",
        "url": "https://www.ifrs.org/issued-standards/list-of-standards/ifrs-15-revenue-from-contracts-with-customers/"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:2020-03-15_Empty_supermarket_shelves_in_Australian_supermarket_01.jpg"
      }
    ],
    "keyTakeaways": [
      "Revenue no es beneficio ni efectivo cobrado.",
      "Comparar períodos, monedas y criterios equivalentes."
    ],
    "commonMistakes": [
      "Comparar facturación anual con trimestral.",
      "Dar por cobradas todas las ventas reconocidas."
    ],
    "content": "![Fotografía de góndolas de supermercado en Australia en marzo de 2020](/images/education/assets/store.jpg)\n\n*Imagen real de contexto: Fotografía de góndolas de supermercado en Australia en marzo de 2020. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Maksym Kozlenko. Licencia: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2020-03-15_Empty_supermarket_shelves_in_Australian_supermarket_01.jpg).*\n\n### Qué significa revenue\n**Revenue** es el ingreso reconocido por las actividades ordinarias durante un período. Se denomina ingresos, ventas o facturación según la compañía. No es beneficio neto: todavía deben descontarse costos, gastos, intereses e impuestos. Tampoco equivale automáticamente a dinero cobrado. El estado de resultados y el estado de flujos de efectivo responden preguntas distintas.\n\n### Cuándo aparece en el balance\nBajo IFRS 15, el ingreso se reconoce cuando se satisface una obligación de desempeño transfiriendo bienes o servicios al cliente; puede ocurrir en un momento o a lo largo del tiempo. Un adelanto de un cliente puede convertirse primero en una obligación contractual. Una venta a crédito puede generar ingresos y una cuenta a cobrar antes de que entre efectivo.\n\n### Ejemplo numérico\nUna empresa ficticia vende 100 unidades a 20: reconoce ingresos de 2.000 si entregó el producto y se cumplen las condiciones contables. Cobra 1.200 y deja 800 pendientes: revenue continúa siendo 2.000, mientras el cobro fue 1.200. Si los costos y gastos suman 1.700, el beneficio antes de otros conceptos sería 300, no 2.000.\n\n### Qué comparar en FINIX\nContrastar un trimestre con el mismo trimestre del año anterior evita parte de la estacionalidad. Un dato TTM suma los últimos cuatro trimestres; no debe compararse directamente con un único trimestre. Revisar moneda, perímetro de consolidación, ventas por segmentos y notas sobre reconocimiento. Para una plataforma que actúa como intermediaria, presentar ventas brutas o comisiones netas depende de su función de principal o agente. Esa diferencia puede cambiar la escala del revenue sin cambiar por sí sola la economía del negocio.",
    "readTimeMinutes": 2
  },
  {
    "title": "Crecimiento orgánico: volumen, precio, adquisiciones y divisas",
    "slug": "crecimiento-organico-precio-volumen-divisas",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "estados-financieros",
    "level": "INTERMEDIATE",
    "order": 51,
    "isFeatured": false,
    "summary": "Separá cuánto crece el negocio existente de lo que aportan compras de empresas, cambios de precio y monedas.",
    "formula": "Crecimiento reportado = (ventas actuales / ventas previas − 1) × 100",
    "sources": [
      {
        "title": "SEC · Análisis de resultados y estados financieros",
        "url": "https://www.sec.gov/about/reports-publications/beginners-guide-financial-statements"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:Am_Kamerunkai,_Container_crane,_WPAhoi,_Hamburg_(P1080281).jpg"
      }
    ],
    "keyTakeaways": [
      "Separar precio, volumen, mix, adquisiciones y moneda.",
      "Crecimiento orgánico requiere la definición del emisor."
    ],
    "commonMistakes": [
      "Sumar porcentajes de precio y volumen sin efecto combinado.",
      "Interpretar crecimiento nominal como crecimiento real."
    ],
    "content": "![Fotografía de una grúa de contenedores del puerto de Hamburgo](/images/education/assets/port.jpg)\n\n*Imagen real de contexto: Fotografía de una grúa de contenedores del puerto de Hamburgo. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Matti Blume. Licencia: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Am_Kamerunkai,_Container_crane,_WPAhoi,_Hamburg_(P1080281).jpg).*\n\n### Un porcentaje puede esconder varios motores\nLas ventas pueden aumentar porque se venden más unidades, sube el precio, cambia la mezcla de productos, se compra otra empresa o se convierte moneda extranjera a un tipo de cambio diferente. El **crecimiento orgánico** intenta aislar la evolución de un perímetro comparable. No tiene una definición universal: leer la metodología y la conciliación publicadas por el emisor.\n\n### Precio y volumen\nSi se venden 100 unidades a 10, las ventas son 1.000. Si el año siguiente se venden 105 a 11, son 1.155: crecimiento total de 15,5%. No es exactamente 5% más 10%, porque existe un efecto combinado. La composición de ventas también importa: vender más productos premium puede elevar el ingreso por unidad aunque ningún precio individual cambie.\n\n### Adquisiciones y moneda constante\nUna compañía ficticia pasa de 1.000 a 1.300 de revenue. Si una adquisición incorporó 200, el negocio comparable aportó 1.100 y creció 10%, bajo un perímetro simplificado. Esa cuenta requiere ajustar fechas de consolidación y ventas comparables; restar cualquier compra anunciada no alcanza. El crecimiento a moneda constante recalcula las ventas con tipos de cambio comparables para aislar la traducción cambiaria, pero no elimina el impacto económico de la moneda sobre costos y competitividad.\n\n### Cómo interpretar la calidad\nBuscar una tabla puente en la presentación de resultados o en MD&A. Preguntar si el volumen se sostiene, si los aumentos de precios deterioran la demanda y si la compra exigió deuda o emisión de acciones. Revenue creciente con margen y caja cayendo describe un resultado distinto de crecer manteniendo rentabilidad. En economías inflacionarias, una expansión nominal puede coexistir con menor actividad real. Estas medidas sirven para explicar cambios; no sustituyen los estados financieros ni son comparables sin revisar sus definiciones.",
    "readTimeMinutes": 2
  },
  {
    "title": "P/E trailing y forward: qué ganancias estás pagando",
    "slug": "pe-trailing-forward-beneficios-normalizados",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "estados-financieros",
    "level": "INTERMEDIATE",
    "order": 52,
    "isFeatured": false,
    "summary": "Cómo cambia el PER al usar beneficios históricos, esperados o normalizados, y por qué un múltiplo bajo puede engañar.",
    "formula": "P/E = precio por acción / EPS del período elegido",
    "sources": [
      {
        "title": "Investor.gov · Price earnings ratio",
        "url": "https://www.investor.gov/introduction-investing/investing-basics/glossary/price-earnings-ratio"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:New_York_City_(New_York,_USA),_Wall_Street_--_2012_--_6614.jpg"
      }
    ],
    "keyTakeaways": [
      "Trailing y forward utilizan beneficios diferentes.",
      "Con pérdidas el PER deja de ser comparable de forma convencional."
    ],
    "commonMistakes": [
      "Mezclar EPS ajustado con EPS contable.",
      "Interpretar un PER bajo como garantía de rentabilidad."
    ],
    "content": "![Fotografía histórica de Wall Street y la Bolsa de Nueva York](/images/education/assets/exchange.jpg)\n\n*Imagen real de contexto: Fotografía histórica de Wall Street y la Bolsa de Nueva York. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Dietmar Rabich. Licencia: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:New_York_City_(New_York,_USA),_Wall_Street_--_2012_--_6614.jpg).*\n\n### El denominador cambia la lectura\nEl **trailing P/E** suele usar beneficios de los últimos doce meses. El **forward P/E** usa una estimación futura, como el próximo ejercicio o los próximos doce meses; esas dos ventanas no son idénticas. Un P/E normalizado intenta representar un resultado recurrente o de ciclo medio y depende de los ajustes del analista. La etiqueta, la fecha y la metodología son parte del dato.\n\n### Ejemplo comparable\nUna acción ficticia cuesta 60. Su EPS TTM es 3 y el EPS esperado del próximo año es 4. El trailing P/E es 20 veces y el forward es 15 veces. No hay dos precios: hay dos beneficios diferentes. Si la estimación baja a 2,5 sin cambiar el precio, el forward sube a 24 veces. La aparente baja valoración dependía de una previsión que no se cumplió.\n\n### Pérdidas y resultados extraordinarios\nCuando el beneficio es negativo, el PER convencional deja de ser una referencia útil para ordenar empresas como baratas o caras. Un EPS de cero vuelve indefinida la división. Una venta de activos o un crédito fiscal puede elevar transitoriamente el beneficio y hacer caer el P/E. En negocios cíclicos, beneficios máximos pueden producir un PER mínimo cerca del techo del ciclo. Revisar ganancias operativas, conciliaciones y promedio de varios años.\n\n### Qué necesita una comparación\nUsar precios de una misma fecha y beneficios en la misma moneda y por la misma unidad accionaria. Comparar crecimiento, márgenes, deuda, estabilidad y necesidades de reinversión. Un negocio puede merecer un múltiplo diferente por sus riesgos; no existe un PER universal que garantice una compra atractiva. En FINIX, el ratio debe leerse junto con el tipo de EPS y el horizonte. El resultado es una relación de valoración, no la cantidad de años asegurada para recuperar la inversión.",
    "readTimeMinutes": 2
  },
  {
    "title": "EPS diluido: acciones nuevas, recompras y beneficio por acción",
    "slug": "eps-diluido-recompras-sbc",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "estados-financieros",
    "level": "INTERMEDIATE",
    "order": 53,
    "isFeatured": false,
    "summary": "Por qué el beneficio total y el beneficio por acción pueden crecer a ritmos distintos, y cómo leer la dilución.",
    "formula": "EPS básico = beneficio atribuible a acciones ordinarias / acciones promedio ponderadas",
    "sources": [
      {
        "title": "IFRS Foundation · IAS 33 Earnings per Share",
        "url": "https://www.ifrs.org/content/dam/ifrs/publications/pdf-standards/english/2022/issued/part-a/ias-33-earnings-per-share.pdf?bypass=on"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:Boston_Financial_District._Post_Office_Square,_Boston,_MA.jpg"
      }
    ],
    "keyTakeaways": [
      "EPS usa acciones promedio ponderadas.",
      "El EPS puede subir aunque el beneficio total no aumente."
    ],
    "commonMistakes": [
      "Usar acciones al cierre como promedio del año.",
      "Ignorar la dilución de la compensación en acciones."
    ],
    "content": "![Fotografía del distrito financiero de Boston y Post Office Square](/images/education/assets/office.jpg)\n\n*Imagen real de contexto: Fotografía del distrito financiero de Boston y Post Office Square. No muestra cotizaciones actuales ni una fórmula financiera. Autor: David Adam Kess. Licencia: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Boston_Financial_District._Post_Office_Square,_Boston,_MA.jpg).*\n\n### Una empresa y muchas participaciones\nEl beneficio por acción distribuye el resultado atribuible a los accionistas ordinarios entre las acciones promedio del período. El promedio ponderado considera cuándo se emitieron o recompraron los títulos; no es necesariamente el número de acciones al cierre. El **EPS diluido** incorpora acciones ordinarias potenciales dilutivas, con los ajustes exigidos por la norma. Los instrumentos antidilutivos se excluyen.\n\n### Ejemplo de dilución\nUna empresa ficticia gana 100 millones y tiene 50 millones de acciones promedio: EPS básico de 2. Si, bajo los supuestos del ejemplo, las acciones potenciales dilutivas elevan el denominador a 55 millones sin ajustar el numerador, el EPS diluido es aproximadamente 1,82. El beneficio total no cambió, pero la participación por título es menor. Los convertibles pueden exigir también un ajuste del numerador; dividir siempre por el total potencial sería incorrecto.\n\n### Recompras y compensación en acciones\nSi el beneficio permanece en 100 y las acciones promedio bajan a 45, el EPS sube a 2,22. Eso no prueba crecimiento de ventas ni mejora operativa. Revisar el efectivo gastado, el precio pagado y si la recompra se financió con deuda. La compensación en acciones, o SBC, puede ser un gasto contable y producir dilución; excluirla de resultados ajustados no la vuelve económicamente gratuita.\n\n### Qué datos cruzar\nConsultar beneficio neto atribuible, EPS básico, EPS diluido y notas de opciones, warrants y convertibles. Contrastar la evolución de acciones promedio con acciones en circulación al cierre. Distinguir split, que modifica unidades y requiere datos comparables ajustados, de una emisión que incorpora nuevos accionistas. En FINIX, una mejora del EPS debe descomponerse entre beneficio y denominador. Ninguna recompra garantiza creación de valor: su efecto depende de financiación, precio y usos alternativos de esos fondos.",
    "readTimeMinutes": 2
  },
  {
    "title": "EBIT y EBITDA: reconciliación y límites frente a la caja",
    "slug": "ebit-ebitda-reconciliacion-caja",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "estados-financieros",
    "level": "INTERMEDIATE",
    "order": 54,
    "isFeatured": false,
    "summary": "Diferenciá resultado operativo, depreciación y efectivo disponible; aprendé a revisar los ajustes del EBITDA.",
    "formula": "EBITDA = EBIT + depreciación + amortización, bajo una definición consistente",
    "sources": [
      {
        "title": "SEC · Non-GAAP Financial Measures",
        "url": "https://www.sec.gov/rules-regulations/staff-guidance/corporation-finance-interpretations/non-gaap-financial-measures"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:001_Car_factory_assembly_line_-_Opel_factory_in_Gliwice,_Poland.jpg"
      }
    ],
    "keyTakeaways": [
      "EBITDA requiere una definición y conciliación.",
      "EBITDA no descuenta todas las necesidades de efectivo."
    ],
    "commonMistakes": [
      "Tratar EBITDA como dinero distribuible.",
      "Comparar EBITDA ajustados con exclusiones distintas."
    ],
    "content": "![Fotografía de una línea de montaje de automóviles en Polonia](/images/education/assets/industry.jpg)\n\n*Imagen real de contexto: Fotografía de una línea de montaje de automóviles en Polonia. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Marek Ślusarczyk (Tupungato) Photo portfolio. Licencia: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:001_Car_factory_assembly_line_-_Opel_factory_in_Gliwice,_Poland.jpg).*\n\n### Qué intenta mostrar cada medida\nEBIT significa resultado antes de intereses e impuestos; no siempre coincide exactamente con el resultado operativo publicado por la empresa. EBITDA añade depreciación y amortización a una base consistente. Son medidas útiles para analizar operación y financiación, pero las definiciones y ajustes pueden variar. En reportes estadounidenses, las medidas no GAAP deben analizarse junto con su conciliación a la medida contable correspondiente.\n\n### Ejemplo ilustrativo\nUna compañía ficticia informa beneficio neto de 50, impuestos de 20 e intereses de 10. Bajo este ejemplo simplificado, EBIT es 80. Si depreciación y amortización suman 30, EBITDA es 110. Una presentación de EBITDA ajustado que añada otros 15 produciría 125. Antes de comparar con otra compañía, identificar qué representa cada ajuste y si ocurre de manera repetida.\n\n### Por qué EBITDA no es flujo de caja\nLa depreciación distribuye un costo histórico, pero los activos físicos deben mantenerse o reemplazarse. Si EBITDA es 110, inversiones de capital de 60, aumento de capital de trabajo de 25 y pagos de intereses e impuestos de 30 consumen más que ese importe. Ese puente es didáctico: un cálculo de caja riguroso parte del estado de flujos y evita duplicar partidas. Que un gasto no sea efectivo en ese trimestre no implica que carezca de costo económico.\n\n### Qué revisar en FINIX\nLeer la conciliación, la periodicidad y el tratamiento de arrendamientos, reestructuraciones y SBC. Ajustes llamados excepcionales que aparecen todos los años merecen atención. Comparar EBITDA con CapEx, capital de trabajo y flujo operativo. En bancos y aseguradoras, excluir intereses puede quitar una parte central del negocio. EBITDA positivo no demuestra capacidad para pagar deuda, distribuir dividendos o financiar crecimiento; es una pieza del análisis, no un sustituto del efectivo disponible.",
    "readTimeMinutes": 2
  },
  {
    "title": "NOPAT: beneficio operativo después de impuestos",
    "slug": "nopat-impuestos-operativos",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "estados-financieros",
    "level": "INTERMEDIATE",
    "order": 55,
    "isFeatured": false,
    "summary": "La medida que conecta rentabilidad operativa con ROIC, sin mezclar el costo de la financiación.",
    "formula": "NOPAT aproximado = EBIT operativo ajustado × (1 − tasa impositiva operativa)",
    "sources": [
      {
        "title": "Damodaran · Economic Value Added",
        "url": "https://pages.stern.nyu.edu/~adamodar/New_Home_Page/invfables/eva.htm"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:001_Car_factory_assembly_line_-_Opel_factory_in_Gliwice,_Poland.jpg"
      }
    ],
    "keyTakeaways": [
      "NOPAT aísla operación después de impuestos.",
      "La tasa y los ajustes deben ser explícitos."
    ],
    "commonMistakes": [
      "Confundir NOPAT con flujo de caja libre.",
      "Restar intereses dos veces en la valoración."
    ],
    "content": "![Fotografía de una línea de montaje de automóviles en Polonia](/images/education/assets/industry.jpg)\n\n*Imagen real de contexto: Fotografía de una línea de montaje de automóviles en Polonia. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Marek Ślusarczyk (Tupungato) Photo portfolio. Licencia: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:001_Car_factory_assembly_line_-_Opel_factory_in_Gliwice,_Poland.jpg).*\n\n### Una medida para analizar la operación\nNOPAT significa **Net Operating Profit After Taxes**: beneficio operativo después de impuestos. Busca aislar el resultado de la actividad económica sin la estructura de deuda. Es habitual en ROIC y valoración por flujos de la firma. No es una línea contable universal ni equivale al beneficio neto disponible para accionistas.\n\n### Cómo construirlo con cuidado\nPartir de un resultado operativo consistente y estimar el impuesto atribuible a esa operación. La aproximación EBIT × (1 − tasa) funciona bajo supuestos simplificados. La tasa efectiva del estado de resultados puede contener efectos extraordinarios, créditos fiscales o impuestos sobre ingresos no operativos. Las pérdidas fiscales y sus límites de uso también cambian los impuestos pagados. Documentar la tasa y los ajustes evita dar apariencia de precisión a un supuesto.\n\n### Ejemplo y conexión con ROIC\nUna empresa ficticia tiene EBIT operativo de 100 y tasa normalizada del 25%. NOPAT aproximado = 100 × 0,75 = 75. Si el capital invertido promedio es 500, ROIC = 75 / 500 = 15%. Si el EBIT incluye una ganancia no operativa de 20 que se retira para el análisis, la base pasa a 80 y el NOPAT simplificado a 60. La conclusión depende de clasificar correctamente el resultado.\n\n### Lo que NOPAT no resuelve\nNo descuenta automáticamente reinversión en activos ni aumento de inventarios o cuentas a cobrar. Tampoco es el flujo de caja libre: deben considerarse depreciación, CapEx y capital de trabajo. No restar intereses al NOPAT si después se lo compara con un costo de capital que ya incorpora la deuda. Bancos y negocios financieros requieren un enfoque diferente porque la financiación forma parte de la operación. En FINIX, entender el numerador ayuda a interpretar ROIC y el spread frente a WACC con criterios comparables.",
    "readTimeMinutes": 2
  },
  {
    "title": "Capital invertido: operación, deuda y caja excedente",
    "slug": "capital-invertido-goodwill-caja",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "estados-financieros",
    "level": "INTERMEDIATE",
    "order": 56,
    "isFeatured": false,
    "summary": "Cómo construir el denominador del ROIC y por qué goodwill, arrendamientos y caja excedente cambian la comparación.",
    "formula": "Capital invertido operativo ≈ activos operativos − pasivos operativos sin interés",
    "sources": [
      {
        "title": "Damodaran · Return measures",
        "url": "https://people.stern.nyu.edu/adamodar/pdfiles/papers/returnmeasures.pdf"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:Boston_Financial_District._Post_Office_Square,_Boston,_MA.jpg"
      }
    ],
    "keyTakeaways": [
      "Capital operativo no es simplemente activo total.",
      "Una adquisición cambia fechas y comparabilidad."
    ],
    "commonMistakes": [
      "Eliminar todo el efectivo sin evaluar caja operativa.",
      "Comparar ROIC con y sin goodwill como si fueran iguales."
    ],
    "content": "![Fotografía del distrito financiero de Boston y Post Office Square](/images/education/assets/office.jpg)\n\n*Imagen real de contexto: Fotografía del distrito financiero de Boston y Post Office Square. No muestra cotizaciones actuales ni una fórmula financiera. Autor: David Adam Kess. Licencia: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Boston_Financial_District._Post_Office_Square,_Boston,_MA.jpg).*\n\n### Qué capital está trabajando\nEl capital invertido representa recursos comprometidos en la operación. Puede aproximarse por activos operativos menos pasivos operativos sin interés, o por una visión de financiación que suma deuda y patrimonio y ajusta activos no operativos. Las dos rutas deben reconciliarse con criterios consistentes; no basta sumar partidas sin distinguir operación de financiación.\n\n### Promedio y fecha\nROIC suele contrastar un flujo anual con capital promedio del período. Una adquisición al final del año aumenta el capital al cierre aunque aporte pocos meses de resultados. Usar solo el saldo final puede reducir artificialmente el ratio; usar solo el inicial puede inflarlo. El promedio inicial/final es una aproximación, y movimientos grandes requieren considerar su fecha efectiva.\n\n### Ejemplo didáctico\nSupongamos activos operativos de 900 y pasivos operativos sin interés de 300: capital invertido de 600. Con NOPAT de 90, ROIC sería 15%, si ese capital representa adecuadamente el período. Una segunda aproximación de deuda 250 más patrimonio 450 menos caja excedente 100 también da 600. Esa coincidencia es del ejemplo, no una identidad automática sin ajustes de balance.\n\n### Goodwill y otros ajustes\nEl goodwill recoge parte del precio pagado por adquisiciones y puede incluirse para evaluar disciplina de compra. Excluirlo puede ayudar a estudiar rentabilidad de activos operativos, pero evita medir parte del capital realmente desembolsado. Una baja contable del goodwill puede elevar el ROIC posterior sin mejorar las ventas. Revisar arrendamientos, I+D capitalizada y activos intangibles cuando las metodologías difieren. Separar caja excedente de caja necesaria para operar requiere juicio; no toda la caja es prescindible. En FINIX, comparar ROIC solo es razonable después de revisar cómo se construye el capital invertido.",
    "readTimeMinutes": 2
  },
  {
    "title": "ROIC incremental: rentabilidad de la nueva reinversión",
    "slug": "roic-incremental-reinversion-crecimiento",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "estados-financieros",
    "level": "ADVANCED",
    "order": 57,
    "isFeatured": false,
    "summary": "El ROIC histórico describe el negocio acumulado; el incremental intenta evaluar cuánto producen las nuevas inversiones.",
    "formula": "ROIC incremental aproximado = variación de NOPAT / variación de capital invertido",
    "sources": [
      {
        "title": "Damodaran · Fundamental determinants of growth",
        "url": "https://pages.stern.nyu.edu/~adamodar/New_Home_Page/valquestions/growth.htm"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:001_Car_factory_assembly_line_-_Opel_factory_in_Gliwice,_Poland.jpg"
      }
    ],
    "keyTakeaways": [
      "ROIC promedio y retorno nuevo pueden diferir.",
      "El crecimiento depende de reinversión y rendimiento."
    ],
    "commonMistakes": [
      "Inferir retorno de proyectos con un solo año volátil.",
      "Tratar el crecimiento modelado como certeza."
    ],
    "content": "![Fotografía de una línea de montaje de automóviles en Polonia](/images/education/assets/industry.jpg)\n\n*Imagen real de contexto: Fotografía de una línea de montaje de automóviles en Polonia. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Marek Ślusarczyk (Tupungato) Photo portfolio. Licencia: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:001_Car_factory_assembly_line_-_Opel_factory_in_Gliwice,_Poland.jpg).*\n\n### Rentabilidad acumulada frente a marginal\nEl ROIC promedio mide el rendimiento de la base operativa existente. El **ROIC incremental** intenta estudiar el capital añadido: una compañía puede conservar activos antiguos muy rentables y destinar dinero nuevo a proyectos con menor retorno. Esa distinción ayuda a analizar si crecer mantiene la creación de valor.\n\n### Ejemplo comparativo\nUna empresa ficticia aumenta su capital invertido de 500 a 600 y su NOPAT de 75 a 87. El ROIC final es 87 / 600 = 14,5%, mientras la aproximación incremental es 12 / 100 = 12%. Con WACC hipotético de 10%, ese incremento supera el costo de capital bajo los supuestos del ejemplo. Si el NOPAT solo llegara a 83, el retorno incremental sería 8%, por debajo del mismo costo. Facturar más no garantiza que la reinversión sea atractiva.\n\n### Crecimiento y reinversión\nEn un modelo estable y consistente, el crecimiento operativo esperado puede aproximarse por tasa de reinversión × retorno del capital nuevo. Reinvestir el 40% del NOPAT a un retorno incremental supuesto de 15% sugiere 6% de crecimiento. Es una relación de modelización, no un pronóstico garantizado; capacidades, competencia y tiempos de maduración pueden impedirlo.\n\n### Cuándo puede engañar\nEl cociente entre cambios de dos años es sensible a adquisiciones, inflación, divisas, bajas contables y retrasos de proyectos. Con variación de capital cercana a cero, el resultado puede ser extremo e inútil. Una fábrica en construcción aún no genera ventas y una compra puede aportar beneficios de inmediato; comparar ambos casos sin contexto es incorrecto. Revisar varios períodos, segmentos y presupuestos, manteniendo criterios fiscales y contables. En FINIX, el ROIC histórico es un punto de partida: la tesis de crecimiento requiere juzgar qué oportunidades quedan para reinvertir.",
    "readTimeMinutes": 2
  },
  {
    "title": "WACC: pesos de financiación y sensibilidad del DCF",
    "slug": "wacc-sensibilidad-deuda-patrimonio",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "estados-financieros",
    "level": "ADVANCED",
    "order": 58,
    "isFeatured": false,
    "summary": "Cómo pesan deuda y patrimonio en el costo de capital, y por qué pequeñas variaciones afectan la valoración.",
    "formula": "WACC = E/(D+E) × Ke + D/(D+E) × Kd × (1−T)",
    "sources": [
      {
        "title": "CFA Institute · Valuation handbook, cost of capital",
        "url": "https://rpc.cfainstitute.org/research/foundation/2024/valuation-handbook-2023"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:Banco_Central_de_la_Rep%C3%BAblica_Argentina_(Reconquista).JPG"
      }
    ],
    "keyTakeaways": [
      "WACC necesita pesos y costos coherentes.",
      "Pequeños cambios afectan especialmente el valor terminal."
    ],
    "commonMistakes": [
      "Mezclar tasa real con flujos nominales.",
      "Suponer que endeudarse siempre reduce el costo de capital."
    ],
    "content": "![Fotografía del edificio del Banco Central de la República Argentina](/images/education/assets/bank.jpg)\n\n*Imagen real de contexto: Fotografía del edificio del Banco Central de la República Argentina. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Elsapucai. Licencia: [Public domain](https://creativecommons.org/publicdomain/mark/1.0/). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Banco_Central_de_la_Rep%C3%BAblica_Argentina_(Reconquista).JPG).*\n\n### Una tasa con varios supuestos\nEl WACC combina costo del patrimonio, costo de deuda y ponderaciones de financiación. E y D representan valores de mercado o aproximaciones justificadas de patrimonio y deuda; Ke es el retorno exigido al accionista, Kd el costo de endeudamiento y T la tasa aplicable al escudo fiscal. No es la tasa del plazo fijo ni el rendimiento garantizado de la acción.\n\n### Ejemplo verificable\nCon patrimonio de 700, deuda de 300, Ke de 12%, Kd de 6% y tasa fiscal de 25%, los pesos son 70% y 30%. WACC = 0,70 × 12% + 0,30 × 6% × 0,75 = 9,75%. Usar deuda contable cuando difiere mucho de su valor económico cambia los pesos. La deducibilidad de intereses puede estar limitada: no asumir siempre un beneficio fiscal completo.\n\n### Sensibilidad en la valoración\nPara una perpetuidad hipotética de flujo libre operativo de 10 al próximo año y crecimiento g de 2%, el valor terminal simplificado sería 10 / (9,75% − 2%) ≈ 129,03. Si WACC subiera a 10,75%, sería aproximadamente 114,29. Es un ejemplo aislado de la sensibilidad; un DCF completo incorpora períodos explícitos, valor terminal descontado y el puente a patrimonio.\n\n### Coherencia antes de calcular\nLa tasa debe compartir moneda y tratamiento de inflación con el flujo. Descontar flujos nominales con una tasa real mezcla unidades. Usar WACC para flujo a la firma y costo de equity para flujo al accionista. En modelos de perpetuidad se requiere WACC mayor que g, además de supuestos sostenibles. Más deuda puede elevar riesgo y costos futuros, aunque la fórmula incluya escudo fiscal. En FINIX, revisar rangos y escenarios tiene más valor que confiar en una sola cifra con muchos decimales.",
    "readTimeMinutes": 2
  },
  {
    "title": "CAPM y costo de equity: tasa libre de riesgo, beta y prima",
    "slug": "capm-costo-equity-beta-prima",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "estados-financieros",
    "level": "ADVANCED",
    "order": 59,
    "isFeatured": false,
    "summary": "Una explicación del retorno exigido al accionista y de las hipótesis que conectan beta, mercado y valoración.",
    "formula": "Ke = Rf + beta × prima de riesgo del mercado",
    "sources": [
      {
        "title": "CFA Institute · Portfolio risk and return, CAPM",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/portfolio-risk-return-part-2"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:New_York_City_(New_York,_USA),_Wall_Street_--_2012_--_6614.jpg"
      }
    ],
    "keyTakeaways": [
      "Ke es un retorno exigido, no garantizado.",
      "Moneda, beta e índice deben ser consistentes."
    ],
    "commonMistakes": [
      "Usar una tasa soberana riesgosa como libre de riesgo sin ajuste.",
      "Duplicar la prima de país."
    ],
    "content": "![Fotografía histórica de Wall Street y la Bolsa de Nueva York](/images/education/assets/exchange.jpg)\n\n*Imagen real de contexto: Fotografía histórica de Wall Street y la Bolsa de Nueva York. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Dietmar Rabich. Licencia: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:New_York_City_(New_York,_USA),_Wall_Street_--_2012_--_6614.jpg).*\n\n### Para qué se usa\nEl CAPM es un modelo para estimar un retorno exigido al patrimonio a partir de riesgo sistemático. Rf es una referencia libre de riesgo coherente con moneda y horizonte, beta mide sensibilidad al mercado y la prima representa retorno adicional esperado frente a Rf. Ese costo de equity alimenta WACC o el descuento de flujos al accionista.\n\n### Ejemplo y unidades\nCon Rf hipotética de 4%, beta 1,2 y prima de mercado de 5%, Ke = 4% + 1,2 × 5% = 10%. Si beta fuera 0,8, el mismo modelo daría 8%. No se suman beta y porcentaje directamente: beta multiplica la prima. La tasa de un bono soberano riesgoso puede incluir riesgo de crédito y no ser una referencia libre de riesgo pura.\n\n### De dónde sale beta\nUna beta estimada por regresión depende del índice, frecuencia, ventana y calidad de precios. Cambios de deuda alteran el riesgo del accionista; por eso, en valoración se pueden usar betas de comparables desapalancadas y luego reapalancadas con supuestos consistentes. Beta mide una relación histórica o modelada, no volatilidad total ni la pérdida máxima posible.\n\n### Riesgo de país y límites\nAlgunos enfoques agregan primas de país o riesgo específico, pero es necesario justificar exposición y evitar contar dos veces un riesgo incluido en los flujos o en otras primas. Un CAPM con datos diferentes puede producir Ke diferentes sin que exista una única respuesta observable. El modelo supone una representación del mercado y del comportamiento de los inversores que no describe perfectamente todas las empresas. En FINIX, Ke sirve para formular una exigencia de retorno y comparar escenarios. No representa la ganancia que efectivamente se obtendrá ni una promesa asociada a beta alta.",
    "readTimeMinutes": 2
  },
  {
    "title": "Ciclo de conversión de caja: inventario, cobros y pagos",
    "slug": "ciclo-conversion-caja-dso-dio-dpo",
    "categorySlug": "analisis-fundamental",
    "subcategorySlug": "estados-financieros",
    "level": "INTERMEDIATE",
    "order": 60,
    "isFeatured": false,
    "summary": "Entendé cuánto tarda la operación en recuperar el efectivo y por qué crecer puede consumir capital de trabajo.",
    "formula": "Ciclo de caja = DIO + DSO − DPO",
    "sources": [
      {
        "title": "CFA Institute · Working Capital and Liquidity",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/working-capital-and-liquidity"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:2020-03-15_Empty_supermarket_shelves_in_Australian_supermarket_01.jpg"
      }
    ],
    "keyTakeaways": [
      "Un ciclo menor puede liberar efectivo operativo.",
      "El período y denominadores deben ser equivalentes."
    ],
    "commonMistakes": [
      "Usar ventas para todas las partidas del ciclo.",
      "Interpretar un ciclo negativo como garantía de solvencia."
    ],
    "content": "![Fotografía de góndolas de supermercado en Australia en marzo de 2020](/images/education/assets/store.jpg)\n\n*Imagen real de contexto: Fotografía de góndolas de supermercado en Australia en marzo de 2020. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Maksym Kozlenko. Licencia: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2020-03-15_Empty_supermarket_shelves_in_Australian_supermarket_01.jpg).*\n\n### La operación también inmoviliza efectivo\nLa empresa compra materiales o inventario, vende y después cobra. Entre esos momentos necesita financiación. El ciclo de conversión de caja resume días de inventario (DIO), días de cobro (DSO) y días de pago a proveedores (DPO). Se mide en días, no en porcentaje, y describe una dinámica operativa que el beneficio contable no muestra por sí solo.\n\n### Cálculos consistentes\nUna aproximación anual usa DIO = inventario promedio / costo de ventas × 365; DSO = cuentas comerciales a cobrar promedio / ventas a crédito × 365; DPO = cuentas comerciales a pagar promedio / compras a crédito × 365. Cuando compras o ventas a crédito no están disponibles, se usan aproximaciones declaradas, como costo de ventas o ventas totales. Con un trimestre, adaptar el número de días y no mezclar flujos trimestrales con 365 sin anualizar.\n\n### Ejemplo operativo\nCon 50 días de inventario, 40 de cobro y 30 de pago, el ciclo es 60 días. Si el plazo de cobro baja a 25 y lo demás se mantiene, pasa a 45. En un ejemplo simplificado, ventas diarias a crédito de 10.000 y 15 días menos de cobro liberan aproximadamente 150.000 de cuentas a cobrar. Ese efectivo no es una nueva venta: surge de cobrar antes.\n\n### Interpretación y riesgos\nUn ciclo negativo puede darse cuando se cobra antes de pagar, pero no asegura un negocio sano. Extender pagos puede deteriorar proveedores; inventario demasiado bajo puede generar faltantes; cobrar más rápido puede exigir descuentos. Comparar modelos de negocio semejantes y períodos equivalentes. Revenue y beneficios crecientes con cuentas a cobrar e inventarios aumentando todavía más pueden consumir caja. En FINIX, combinar márgenes y crecimiento con flujo operativo y capital de trabajo permite evaluar si la expansión necesita financiación adicional.",
    "readTimeMinutes": 2
  },
  {
    "title": "Acciones: participación, dividendos y derechos del inversor",
    "slug": "acciones-capital-derechos-dividendos",
    "categorySlug": "tipos-de-activos",
    "subcategorySlug": "activos-renta-variable",
    "level": "BEGINNER",
    "order": 61,
    "isFeatured": false,
    "summary": "Qué comprás al adquirir una acción, de dónde puede venir el rendimiento y qué diferencia hay entre precio y participación.",
    "formula": "Retorno total = (precio final − precio inicial + dividendos) / precio inicial",
    "sources": [
      {
        "title": "BYMA · Acciones",
        "url": "https://www.byma.com.ar/productos/productos-financieros/acciones"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:New_York_City_(New_York,_USA),_Wall_Street_--_2012_--_6614.jpg"
      }
    ],
    "keyTakeaways": [
      "Una acción es participación patrimonial.",
      "El retorno incluye precio y dividendos, con riesgos."
    ],
    "commonMistakes": [
      "Confundir precio unitario bajo con empresa barata.",
      "Suponer que los dividendos están garantizados."
    ],
    "content": "![Fotografía histórica de Wall Street y la Bolsa de Nueva York](/images/education/assets/exchange.jpg)\n\n*Imagen real de contexto: Fotografía histórica de Wall Street y la Bolsa de Nueva York. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Dietmar Rabich. Licencia: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:New_York_City_(New_York,_USA),_Wall_Street_--_2012_--_6614.jpg).*\n\n### Participar en una empresa\nUna acción representa una fracción del capital de una sociedad. El inversor asume el riesgo del negocio y puede participar en sus resultados mediante dividendos o cambios del precio. Los derechos de voto y económicos dependen de la clase accionaria y del estatuto. Comprar una acción no convierte el precio de mercado en un capital que la empresa deba devolver en una fecha determinada.\n\n### Dos fuentes de rendimiento\nEn un ejemplo ficticio, comprar a 100, cobrar 3 de dividendos y vender a 110 produce un retorno bruto de 13%. Si se vende a 90, el retorno es −7% aun con el dividendo. Comisiones, impuestos y moneda de referencia modifican el resultado neto. Un dividendo no es una ganancia adicional gratuita: al desprenderse el derecho, el precio suele ajustar, aunque el mercado también se mueve por otros factores.\n\n### Precio, capitalización y clases\nEl precio de una acción solo tiene sentido junto con las acciones en circulación. Diez millones de títulos a 20 implican una capitalización de 200 millones. Un split cambia cantidad de títulos y precio por unidad, no crea riqueza por sí mismo. Diferentes clases pueden tener distinto voto y liquidez. Revisar si se compra una acción local, una extranjera o un certificado representativo como un CEDEAR.\n\n### Riesgos y documentos\nLa renta variable no promete una tasa fija ni dividendos periódicos. En una insolvencia, los accionistas ordinarios cobran después de los acreedores y pueden perder toda su inversión. Revisar estados financieros, comunicaciones del emisor, gobierno corporativo, flotante y volumen. Una orden con poco volumen puede ejecutarse a un precio muy distinto del último operado. En FINIX, relacionar cotización con revenue, beneficios, flujo de caja y valoración ayuda a interpretar qué expectativas está reflejando el mercado.",
    "readTimeMinutes": 2
  },
  {
    "title": "Bonos: cupón, amortización y precio frente al valor nominal",
    "slug": "bonos-cupon-amortizacion-valor-nominal",
    "categorySlug": "tipos-de-activos",
    "subcategorySlug": "activos-renta-fija",
    "level": "BEGINNER",
    "order": 62,
    "isFeatured": false,
    "summary": "Leé los flujos de una deuda soberana o corporativa, diferenciando interés contractual, paridad y rendimiento de compra.",
    "formula": "Paridad = precio / valor nominal residual × 100",
    "sources": [
      {
        "title": "BYMA · Renta fija",
        "url": "https://www.byma.com.ar/productos/productos-financieros/renta-fija"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:Russo-Asiatic_Bank_Bond_(1910)_St._Petersburg,_Russian_and_French_text_-_NumisBids.jpg"
      }
    ],
    "keyTakeaways": [
      "Cupón contractual y TIR de compra son diferentes.",
      "Revisar amortización, valor residual y convención de precio."
    ],
    "commonMistakes": [
      "Dar por garantizado el cobro porque es renta fija.",
      "Confundir cupón/precio con TIR."
    ],
    "content": "![Fotografía de un certificado de deuda del Russo-Asiatic Bank de 1910](/images/education/assets/bond.jpg)\n\n*Imagen real de contexto: Fotografía de un certificado de deuda del Russo-Asiatic Bank de 1910. No muestra cotizaciones actuales ni una fórmula financiera. Autor: The Russo-Asiatic Bank.. Licencia: [Public domain](https://creativecommons.org/publicdomain/mark/1.0/). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Russo-Asiatic_Bank_Bond_(1910)_St._Petersburg,_Russian_and_French_text_-_NumisBids.jpg).*\n\n### Qué promete un bono\nUn bono representa una deuda del emisor con sus tenedores. Sus condiciones fijan moneda, intereses, vencimiento, amortización y otros derechos. El cupón puede ser fijo, variable o ajustable; algunos instrumentos no pagan intereses intermedios. Que el flujo esté contractualmente definido no garantiza que el deudor cumpla ni que el precio permanezca estable.\n\n### Cupón frente a rendimiento\nUn bono ficticio de valor nominal 1.000 paga 6% anual: cupón de 60 por año si el principal se mantiene. Comprarlo a 900 produce una relación cupón/precio de 6,67%, pero esa no es su TIR: falta incluir devolución de capital, plazo y fechas de todos los flujos. Si se compra a 1.050, el mismo cupón continúa siendo 60 y la relación baja a 5,71%. Precio de compra y tasa contractual son conceptos distintos.\n\n### Amortización y precio de operación\nUn bono bullet devuelve el principal al vencimiento; uno amortizable lo hace en cuotas y puede calcular intereses sobre el saldo. Consultar valor residual y calendario. En mercados donde se cotiza precio limpio, se añade interés corrido para llegar al precio efectivo; otras convenciones pueden incluirlo. Una paridad debe usar la base de cotización correcta, sin mezclar precio por cien nominales con saldo residual o moneda distinta.\n\n### Qué revisar antes de comparar\nIdentificar emisor, prioridad de cobro, ley aplicable, moneda, indexación y cláusulas. Un bono denominado en dólares puede tener condiciones de pago diferentes de otro con exposición cambiaria, como un dollar-linked. Vender antes del vencimiento expone a variaciones de tasas, crédito y liquidez. En FINIX, complementar esta ficha con la explicación de TIR y duration: la renta fija tiene flujos pactados, pero el rendimiento efectivo depende del precio, los pagos y la reinversión.",
    "readTimeMinutes": 2
  },
  {
    "title": "Letras del Tesoro: descuento, capitalización y vencimiento",
    "slug": "letras-tesoro-descuento-capitalizacion",
    "categorySlug": "tipos-de-activos",
    "subcategorySlug": "activos-renta-fija",
    "level": "BEGINNER",
    "order": 63,
    "isFeatured": false,
    "summary": "Cómo leer letras de corto plazo, su rendimiento implícito y las diferencias entre precio de compra y monto a cobrar.",
    "formula": "Retorno del período = monto al vencimiento / desembolso − 1",
    "sources": [
      {
        "title": "Secretaría de Finanzas · Licitaciones de letras y bonos",
        "url": "https://www.argentina.gob.ar/economia/licitaciones"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:America_Treasury_Department_Building_20240601.jpg"
      }
    ],
    "keyTakeaways": [
      "El rendimiento del período no es automáticamente anual.",
      "Cada serie tiene sus propias condiciones."
    ],
    "commonMistakes": [
      "Confundir tasa de descuento con rendimiento sobre el desembolso.",
      "Suponer que corto plazo elimina riesgo soberano."
    ],
    "content": "![Fotografía del edificio del Departamento del Tesoro de Estados Unidos](/images/education/assets/treasury.jpg)\n\n*Imagen real de contexto: Fotografía del edificio del Departamento del Tesoro de Estados Unidos. No muestra cotizaciones actuales ni una fórmula financiera. Autor: 颐园居. Licencia: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:America_Treasury_Department_Building_20240601.jpg).*\n\n### Financiar al Tesoro a corto plazo\nLas letras son instrumentos de deuda pública cuyo plazo suele ser menor que el de los bonos, aunque la clasificación y condiciones concretas dependen de cada emisión. Pueden emitirse a descuento, capitalizar intereses o aplicar otros ajustes. El nombre comercial no basta para conocer el flujo: el llamado a licitación y las condiciones de emisión describen cómo se calcula y paga.\n\n### Una letra a descuento\nEn un ejemplo hipotético, se pagan 980 y se reciben 1.000 en 90 días si el emisor cumple. El rendimiento del período es 1.000 / 980 − 1 = 2,0408%. La diferencia de 20 no es una tasa anual de 2%. La anualización efectiva sería (1.000 / 980) elevado a 365/90, menos 1, bajo esa convención. Una tasa de descuento calculada sobre el nominal tendrá un denominador distinto.\n\n### Letras capitalizables y ajustables\nUna letra capitalizable acumula intereses según la fórmula pactada y puede pagarlos junto al principal al vencimiento. Un instrumento ligado a un índice necesita revisar fecha base, rezago, coeficiente y mecanismo de cálculo. No todas las letras pagan una tasa fija ni todas protegen de inflación o devaluación. Evitar convertir un ejemplo educativo en una descripción de una serie vigente.\n\n### Licitación y mercado secundario\nEl mercado primario coloca la emisión; en el secundario se negocia a precios que pueden cambiar. El rendimiento depende del precio pagado y del plazo restante, no solo del resultado de una licitación anterior. Consultar fechas de liquidación, lote, comisiones y calendario de cobro. Hay riesgo soberano, reinversión y liquidez aunque el horizonte sea corto. En FINIX, comparar letras requiere uniformar moneda, plazo y convención de tasa. Para términos actuales, usar siempre el llamado oficial de la serie correspondiente.",
    "readTimeMinutes": 2
  },
  {
    "title": "Obligaciones negociables: deuda corporativa y condiciones de pago",
    "slug": "obligaciones-negociables-on-credito",
    "categorySlug": "tipos-de-activos",
    "subcategorySlug": "activos-renta-fija",
    "level": "INTERMEDIATE",
    "order": 64,
    "isFeatured": false,
    "summary": "Qué son las ON, cómo revisar al emisor y por qué moneda, garantías, ley y amortización importan tanto como el cupón.",
    "formula": "Cobertura de intereses aproximada = EBIT / gasto de intereses",
    "sources": [
      {
        "title": "BYMA · Obligaciones negociables",
        "url": "https://www.byma.com.ar/productos/productos-financieros/obligaciones-negociables"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:001_Car_factory_assembly_line_-_Opel_factory_in_Gliwice,_Poland.jpg"
      }
    ],
    "keyTakeaways": [
      "ON es deuda empresarial, no participación accionaria.",
      "El prospecto define moneda, derechos y cláusulas."
    ],
    "commonMistakes": [
      "Comprar solo por cupón o TIR sin analizar crédito.",
      "Confundir denominación en dólares con cualquier mecanismo de pago."
    ],
    "content": "![Fotografía de una línea de montaje de automóviles en Polonia](/images/education/assets/industry.jpg)\n\n*Imagen real de contexto: Fotografía de una línea de montaje de automóviles en Polonia. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Marek Ślusarczyk (Tupungato) Photo portfolio. Licencia: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:001_Car_factory_assembly_line_-_Opel_factory_in_Gliwice,_Poland.jpg).*\n\n### Prestar a una empresa\nLas **obligaciones negociables**, u ON, son títulos de deuda emitidos por empresas. Otorgan derechos de cobro según un prospecto y un suplemento de emisión. Pueden negociarse después de la colocación inicial, hasta su vencimiento, sujeto a condiciones y liquidez. Ser acreedor es diferente de ser accionista: existe un compromiso contractual, pero también riesgo de incumplimiento.\n\n### Una emisión no es igual a otra\nComparar moneda de denominación, moneda efectiva de pago, tipo de cambio aplicable, tasa, vencimientos y amortizaciones. Revisar ley, prioridad, garantías y cláusulas financieras o covenants. Una emisión garantizada no equivale a garantía de cobro inmediato: importa qué activo respalda y cómo se ejecuta. La posibilidad de rescate anticipado por el emisor puede limitar el rendimiento cuando bajan las tasas.\n\n### Ejemplo y crédito\nUna ON ficticia de 1.000 paga 8% anual en dos cuotas: 40 cada seis meses, si no hay amortización intermedia. A un precio distinto de 1.000, su TIR no coincide necesariamente con 8%. Si la empresa tiene EBIT de 200 y gasto de intereses de 50, la cobertura simplificada es 4 veces. Eso no sustituye el análisis de flujo de caja, deuda que vence, caja disponible y restricciones legales.\n\n### Qué preguntar en FINIX\n¿La operación genera fondos en la moneda de la deuda? ¿Hay vencimientos concentrados? ¿La caja pertenece a filiales que pueden transferirla? Una calificación de riesgo es una opinión, no una garantía. Revisar último balance y hechos relevantes, además de la TIR. Una rentabilidad muy alta puede reflejar precio bajo por dudas de pago. Invertir en varias ON del mismo sector también puede concentrar riesgos. En esta ficha no se atribuyen términos concretos a una emisión vigente: el documento de la serie es la referencia contractual.",
    "readTimeMinutes": 2
  },
  {
    "title": "CEDEARs: ratio, precio en pesos y dividendos del subyacente",
    "slug": "cedears-ratio-precio-dividendos",
    "categorySlug": "tipos-de-activos",
    "subcategorySlug": "activos-renta-variable",
    "level": "BEGINNER",
    "order": 65,
    "isFeatured": false,
    "summary": "La mecánica de un certificado extranjero: equivalencia accionaria, tipo de cambio implícito y eventos corporativos.",
    "formula": "Precio local teórico ≈ precio extranjero × tipo de cambio implícito / ratio",
    "sources": [
      {
        "title": "BYMA · CEDEARs y ratio de conversión",
        "url": "https://www.byma.com.ar/en/products/financial-products/cedears"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:Bolsa_de_Comercio_(Buenos_Aires).jpg"
      }
    ],
    "keyTakeaways": [
      "Ratio y moneda conectan certificado y subyacente.",
      "Dividendos netos pueden diferir del monto extranjero bruto."
    ],
    "commonMistakes": [
      "Usar un ratio antiguo.",
      "Calcular PER con precio de CEDEAR y EPS de una acción sin ajustar."
    ],
    "content": "![Fotografía del edificio de la Bolsa de Comercio de Buenos Aires](/images/education/assets/buenos-aires.jpg)\n\n*Imagen real de contexto: Fotografía del edificio de la Bolsa de Comercio de Buenos Aires. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Samuel Boote (1844 - 1921). Licencia: [Public domain](https://creativecommons.org/publicdomain/mark/1.0/). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bolsa_de_Comercio_(Buenos_Aires).jpg).*\n\n### Un certificado representativo\nUn CEDEAR es un certificado de depósito argentino que representa valores extranjeros. Puede referirse a una acción o a otro instrumento habilitado, como ciertos ETF. El certificado y el activo de origen se conectan mediante un programa y un ratio de conversión. No es la misma especie que una acción local ni un depósito bancario en dólares.\n\n### Cómo leer el ratio\nSi el ratio ficticio es 10 certificados por una acción, diez CEDEARs representan una acción del subyacente. Con acción extranjera a USD 100 y tipo de cambio implícito de ARS 1.000, el precio local teórico sería ARS 10.000 por certificado. Es una relación orientativa antes de costos, diferencias de horarios, oferta y demanda. Los ratios reales deben verificarse para cada programa y fecha, porque pueden cambiar.\n\n### Dos movimientos de precio\nSi la acción extranjera sube 10% y el tipo de cambio implícito baja 5%, manteniendo el ratio, el efecto combinado sería 1,10 × 0,95 − 1 = 4,5% en pesos, no 15%. La exposición no asegura que el precio local siga exactamente a una cotización cambiaria particular. El último precio puede estar desactualizado si casi no hubo operaciones.\n\n### Dividendos y eventos corporativos\nUn dividendo del subyacente se traslada según derechos, ratio, retenciones, gastos y procedimientos del programa. Monto bruto extranjero y monto neto recibido pueden diferir; las fechas tampoco deben confundirse. Splits y cambios de ratio modifican unidades y exigen comparar posiciones ajustadas. Consultar emisor del certificado y depositario para conversiones y eventos. En FINIX, identificar siempre la unidad: EPS y precio de la acción extranjera no pueden combinarse directamente con precio del CEDEAR sin ajustar el ratio y la moneda.",
    "readTimeMinutes": 2
  },
  {
    "title": "ETF: cartera, NAV, costos y diferencia frente al índice",
    "slug": "etf-nav-costos-tracking-error",
    "categorySlug": "tipos-de-activos",
    "subcategorySlug": "activos-fondos",
    "level": "BEGINNER",
    "order": 66,
    "isFeatured": false,
    "summary": "Cómo funciona un fondo cotizado y qué revisar más allá de su nombre: cartera, réplica, comisiones y tracking.",
    "formula": "Prima o descuento = (precio del ETF / NAV por cuota − 1) × 100",
    "sources": [
      {
        "title": "Investor.gov · Exchange-Traded Funds",
        "url": "https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-2"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:New_York_City_(New_York,_USA),_Wall_Street_--_2012_--_6614.jpg"
      }
    ],
    "keyTakeaways": [
      "Un ETF puede ser concentrado, activo o indexado.",
      "Precio, NAV, costos y seguimiento son medidas diferentes."
    ],
    "commonMistakes": [
      "Suponer que todo ETF replica un índice amplio.",
      "Confundir tracking error con pérdida acumulada frente al índice."
    ],
    "content": "![Fotografía histórica de Wall Street y la Bolsa de Nueva York](/images/education/assets/exchange.jpg)\n\n*Imagen real de contexto: Fotografía histórica de Wall Street y la Bolsa de Nueva York. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Dietmar Rabich. Licencia: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:New_York_City_(New_York,_USA),_Wall_Street_--_2012_--_6614.jpg).*\n\n### Un fondo que cotiza\nUn ETF, o exchange-traded fund, reúne activos y sus participaciones se negocian en bolsa. Puede seguir un índice o gestionarse activamente. Tener muchos instrumentos no garantiza diversificación: un ETF de un sector o una temática puede concentrar riesgos. Leer el objetivo y las posiciones permite saber qué exposición se está adquiriendo.\n\n### Precio y valor de cartera\nNAV es el valor neto de los activos del fondo por participación, bajo su método de cálculo. El precio de negociación puede diferir. Si NAV por cuota es 100 y el precio es 102, la prima es 2%; si cotiza a 98, el descuento es 2%. Los mecanismos de creación y rescate ayudan a conectar precios, pero no eliminan diferencias en momentos de estrés o cuando el mercado subyacente está cerrado.\n\n### Costos y seguimiento\nEl expense ratio es un costo anual expresado como proporción del patrimonio, normalmente incorporado en el valor del fondo; no suele cobrarse como una comisión aislada al comprar. Un costo hipotético de 0,2% sobre 1.000 equivale aproximadamente a 2 al año si el patrimonio fuera constante. Se suman posibles comisiones y spread de compra/venta. Tracking difference es la diferencia de rentabilidad frente al índice; tracking error mide variabilidad de esa diferencia, no lo mismo.\n\n### Revisiones esenciales\nIdentificar réplica física o sintética, índice, domicilio, política de distribución y moneda de los activos. La moneda de cotización no elimina por sí sola el riesgo cambiario del subyacente. Los ETF apalancados e inversos suelen tener objetivos diarios y pueden apartarse de un múltiplo simple durante períodos largos. Un CEDEAR de ETF agrega además su programa local y ratio. En FINIX, la ficha debe leerse como exposición a una cartera concreta, no como una promesa de rendimiento estable.",
    "readTimeMinutes": 2
  },
  {
    "title": "Plazo fijo: tasa nominal, rendimiento efectivo y UVA",
    "slug": "plazo-fijo-tna-tea-uva",
    "categorySlug": "tipos-de-activos",
    "subcategorySlug": "activos-depositos",
    "level": "BEGINNER",
    "order": 67,
    "isFeatured": false,
    "summary": "Cómo calcular intereses de un depósito y distinguir tasa anual, inflación, capitalización y condiciones de retiro.",
    "formula": "Interés simple = capital × TNA × días / base anual contractual",
    "sources": [
      {
        "title": "BCRA · Opciones y herramientas para ahorrar en pesos",
        "url": "https://www.bcra.gob.ar/noticias/opciones-y-herramientas-para-ahorrar-en-pesos/"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:Banco_Central_de_la_Rep%C3%BAblica_Argentina_(Reconquista).JPG"
      }
    ],
    "keyTakeaways": [
      "TNA es anual y requiere convertir al período.",
      "UVA y precancelación tienen condiciones específicas."
    ],
    "commonMistakes": [
      "Tomar la TNA como ganancia de 30 días.",
      "Suponer que una renovación futura conserva la tasa actual."
    ],
    "content": "![Fotografía del edificio del Banco Central de la República Argentina](/images/education/assets/bank.jpg)\n\n*Imagen real de contexto: Fotografía del edificio del Banco Central de la República Argentina. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Elsapucai. Licencia: [Public domain](https://creativecommons.org/publicdomain/mark/1.0/). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Banco_Central_de_la_Rep%C3%BAblica_Argentina_(Reconquista).JPG).*\n\n### Un depósito con condiciones pactadas\nEl plazo fijo es un depósito bancario constituido por un plazo y bajo condiciones acordadas. No es una acción ni un bono que se negocia habitualmente en bolsa. La entidad, modalidad, moneda, tasa y posibilidad de cancelación definen el producto. Las condiciones regulatorias y comerciales pueden cambiar; esta explicación no presenta una tasa vigente ni un plazo mínimo universal.\n\n### TNA no es el interés de un mes\nEn un ejemplo exclusivamente didáctico, un capital de ARS 1.000.000 con TNA hipotética de 60%, plazo de 30 días y base de 365 genera 1.000.000 × 0,60 × 30 / 365 = ARS 49.315,07. La tasa del período es 4,9315%. La TEA incorpora capitalización bajo una frecuencia supuesta; renovar repetidamente no garantiza mantener esa TNA. Consultar qué base utiliza el contrato y qué pasa al vencimiento.\n\n### Inflación y UVA\nEl rendimiento real puede aproximarse como (1 + retorno nominal) / (1 + inflación del mismo período) − 1. Con retorno de 4,9315% e inflación hipotética de 4%, sería aproximadamente 0,90% real. Un depósito UVA ajusta capital según la unidad correspondiente y condiciones pactadas, con una eventual tasa adicional. La precancelación, cuando está permitida, puede aplicar un mecanismo distinto del ajuste al vencimiento. Revisar rezagos del índice, aviso previo y tasa de salida.\n\n### Liquidez y garantías\nEl dinero puede quedar inmovilizado; una necesidad antes del vencimiento cambia el análisis. La cobertura de depósitos depende del sistema vigente, entidad, límites y exclusiones, y no debe confundirse con ausencia de cualquier riesgo. Comparar rendimiento neto, moneda y horizonte frente a inflación y otras alternativas. En FINIX, TNA y TEA son útiles solo con su período y supuesto de reinversión. Consultar la información del banco y del BCRA para contratar una modalidad actual.",
    "readTimeMinutes": 2
  },
  {
    "title": "Bitcoin: red, unidades, custodia y exposición de precio",
    "slug": "bitcoin-red-custodia-exposicion",
    "categorySlug": "tipos-de-activos",
    "subcategorySlug": "activos-digitales",
    "level": "INTERMEDIATE",
    "order": 68,
    "isFeatured": false,
    "summary": "Diferenciá BTC, la red Bitcoin, la custodia y un producto bursátil que sigue su precio; conocé sus riesgos específicos.",
    "formula": "Valor de una posición = cantidad de BTC × precio por BTC",
    "sources": [
      {
        "title": "Bitcoin · Documento original de Satoshi Nakamoto",
        "url": "https://bitcoin.org/bitcoin.pdf"
      },
      {
        "title": "Investor.gov · ETPs con exposición a Bitcoin y Ether",
        "url": "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/ETPBulletinSeptember2024"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:Physical_Bitcoin_2011_Casascius_1_Bitcoin_Coin_Token.png"
      }
    ],
    "keyTakeaways": [
      "BTC no es una acción ni una moneda física.",
      "Custodia directa y productos bursátiles tienen riesgos diferentes."
    ],
    "commonMistakes": [
      "Compartir claves o frase de recuperación.",
      "Confundir un ETP con control directo del activo."
    ],
    "content": "![Fotografía de una pieza física Casascius de 2011 que representa bitcoin](/images/education/assets/bitcoin.png)\n\n*Imagen real de contexto: Fotografía de una pieza física Casascius de 2011 que representa bitcoin. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Tiberiandusk. Licencia: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Physical_Bitcoin_2011_Casascius_1_Bitcoin_Coin_Token.png).*\n\n### Red y activo\nBitcoin es una red de transferencias basada en un registro compartido y mecanismos criptográficos; BTC es la unidad utilizada en ella. No representa una acción de una empresa ni un derecho contractual a cobrar intereses. El documento original describe una propuesta de efectivo electrónico entre pares; el precio de mercado depende de oferta, demanda y expectativas, no de beneficios corporativos distribuidos.\n\n### Se pueden comprar fracciones\nUn bitcoin se divide en 100 millones de satoshis. Tener 0,01 BTC equivale a un millón de satoshis. Si el precio hipotético fuera 10.000.000 en una moneda determinada por BTC, esa posición valdría 100.000 en esa moneda antes de costos. Una caída del precio de 30% reduciría su valor a 70.000. La foto de una moneda física es una pieza representativa histórica, no el activo digital que se posee en la red.\n\n### Custodia y control\nEn autocustodia, las claves privadas permiten autorizar movimientos. Perderlas puede impedir recuperar los fondos; divulgarlas puede permitir su transferencia. Una plataforma custodial introduce riesgo operativo, de contraparte y de acceso. Las transferencias no deben entenderse como pagos bancarios con reversión garantizada. Nunca entregar una frase de recuperación a quien promete soporte o rendimientos.\n\n### Exposición bursátil y límites\nUn ETP o fondo que sigue bitcoin permite exposición a su precio bajo una estructura bursátil, con costos y custodios propios; no implica controlar BTC directamente. Leer prospecto y distinguir productos spot de futuros. Su tratamiento no equivale necesariamente al de un fondo regulado tradicional. Bitcoin no genera por sí mismo dividendos o cupones; las promesas de renta sobre BTC añaden otras contrapartes o estrategias. En FINIX, evaluar volatilidad, liquidez, custodia y tamaño de exposición, sin atribuir a un precio creciente una garantía futura.",
    "readTimeMinutes": 2
  },
  {
    "title": "Opciones call y put: derechos, primas y vencimiento",
    "slug": "opciones-call-put-prima-strike",
    "categorySlug": "tipos-de-activos",
    "subcategorySlug": "activos-derivados",
    "level": "ADVANCED",
    "order": 69,
    "isFeatured": false,
    "summary": "Qué significa comprar o vender una opción, cómo leer el strike y por qué acertar la dirección puede no alcanzar.",
    "formula": "Call al vencimiento = máximo(S − K, 0); put = máximo(K − S, 0)",
    "sources": [
      {
        "title": "Investor.gov · Introduction to Options",
        "url": "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-63"
      },
      {
        "title": "Fotografía real · autor y licencia en el pie",
        "url": "https://commons.wikimedia.org/wiki/File:Bolsa_de_Comercio_(Buenos_Aires).jpg"
      }
    ],
    "keyTakeaways": [
      "Call es derecho a comprar; put, a vender.",
      "Prima, plazo y multiplicador cambian el resultado."
    ],
    "commonMistakes": [
      "Suponer que acertar la dirección asegura beneficio.",
      "Confundir riesgo de comprador con riesgo de vendedor descubierto."
    ],
    "content": "![Fotografía del edificio de la Bolsa de Comercio de Buenos Aires](/images/education/assets/buenos-aires.jpg)\n\n*Imagen real de contexto: Fotografía del edificio de la Bolsa de Comercio de Buenos Aires. No muestra cotizaciones actuales ni una fórmula financiera. Autor: Samuel Boote (1844 - 1921). Licencia: [Public domain](https://creativecommons.org/publicdomain/mark/1.0/). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bolsa_de_Comercio_(Buenos_Aires).jpg).*\n\n### Un derecho con plazo\nUna **call** otorga al comprador el derecho a comprar un subyacente al precio de ejercicio, o strike. Una **put** otorga el derecho a venderlo. El comprador paga una prima; el vendedor asume obligaciones si corresponde el ejercicio o asignación. Las condiciones del contrato definen subyacente, vencimiento, estilo de ejercicio, multiplicador y liquidación. El término correcto es put, no pull.\n\n### Ejemplo de una call comprada\nEn cifras ficticias por unidad, strike K = 100 y prima = 5. Al vencimiento, con subyacente S = 120, el valor intrínseco es 20 y el resultado antes de gastos es 15. Con S = 103, el valor intrínseco es 3 y el resultado es −2: el activo subió sobre el strike pero no cubrió la prima. El punto de equilibrio al vencimiento es 105, bajo ese ejemplo sin costos.\n\n### Ejemplo de una put comprada\nCon strike 100 y prima 4, si el subyacente termina en 80, el valor intrínseco es 20 y el resultado neto de prima es 16. Si termina en 110, la put vence sin valor y se pierde la prima. Multiplicar por las unidades contractuales y sumar gastos cambia los importes efectivos. No asumir que todos los mercados usan el mismo multiplicador.\n\n### Antes y después del vencimiento\nAntes del vencimiento, la prima también depende de tiempo, volatilidad implícita, tasas y dividendos esperados; puede caer aunque la dirección sea favorable. El estilo americano permite ejercicio bajo las condiciones del contrato antes del vencimiento; el europeo lo concentra al vencimiento. Un comprador puede perder toda la prima. Una call vendida sin cobertura puede generar pérdidas teóricamente ilimitadas, y las ventas requieren entender margen y asignación. En FINIX, esta ficha describe contratos y riesgos; no propone una estrategia de trading ni sustituye la lectura de las especificaciones de la serie.",
    "readTimeMinutes": 2
  }
];
