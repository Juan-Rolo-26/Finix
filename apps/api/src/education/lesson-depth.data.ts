/** Finix original worked examples; all numeric assumptions are hypothetical. */
export type LessonDepth = { slug: string; title: string; metrics: [string,string][]; explanation: string; worked: string; review: string; exercise: string; answer: string };
export const LESSON_DEPTH: LessonDepth[] = [
  {
    "slug": "que-es-el-roic",
    "title": "Del beneficio operativo al capital",
    "metrics": [
      [
        "NOPAT",
        "120"
      ],
      [
        "Capital promedio",
        "800"
      ],
      [
        "ROIC",
        "15%"
      ]
    ],
    "explanation": "El capital promedio conecta el beneficio de todo un período con los recursos que lo generaron. Una adquisición al cierre puede distorsionar el ratio si solo tomás el balance final. Aclarar si incluís goodwill permite distinguir la eficiencia operativa del rendimiento sobre el precio efectivamente pagado.",
    "worked": "EBIT de 160 con impuesto operativo normalizado del 25% deja NOPAT de 120. Dividido por capital promedio de 800, produce 15% de ROIC. Con WACC de 10%, el diferencial es de 5 puntos porcentuales: no es una predicción sobre la acción.",
    "review": "Contrastá varios años y definiciones consistentes. Una rentabilidad alta no asegura oportunidades para reinvertir más capital al mismo retorno.",
    "exercise": "Si NOPAT sube a 132 y el capital a 1.100, ¿mejora el ROIC?",
    "answer": "No: baja al 12%. El resultado creció menos que los recursos empleados."
  },
  {
    "slug": "que-es-el-per",
    "title": "El precio depende de qué beneficio uses",
    "metrics": [
      [
        "Precio",
        "60"
      ],
      [
        "EPS recurrente",
        "2"
      ],
      [
        "P/E normalizado",
        "30 veces"
      ]
    ],
    "explanation": "Antes de comparar múltiplos, identificá si las ganancias son históricas o previstas. Una compañía cíclica puede mostrar un P/E bajo porque atraviesa un máximo de beneficios transitorio. Revisar deuda, márgenes y recurrencia del resultado ayuda a interpretar la aparente oportunidad.",
    "worked": "Una acción a 60 con EPS de 3 tiene P/E de 20. Si 1 de ese EPS viene de una venta extraordinaria, el beneficio recurrente sería 2 y el múltiplo normalizado 30. El precio no cambió; cambió la calidad del denominador.",
    "review": "Usá EPS diluido de períodos comparables y verificá los ajustes en el informe original. Un múltiplo negativo suele ser poco útil para ordenar empresas con pérdidas.",
    "exercise": "Una acción vale 48 y genera EPS anual comparable de 4. ¿Qué P/E tiene? ¿Eso prueba que está barata?",
    "answer": "12 veces. Faltan perspectivas, riesgos y una comparación apropiada para juzgar su valoración."
  },
  {
    "slug": "que-es-el-rsi",
    "title": "La intensidad no anticipa el desenlace",
    "metrics": [
      [
        "Media de avances",
        "2"
      ],
      [
        "Media de retrocesos",
        "1"
      ],
      [
        "RSI",
        "66,7"
      ]
    ],
    "explanation": "El RSI diario y el semanal describen horizontes distintos. Los umbrales habituales de 70 y 30 son referencias de impulso; en tendencias persistentes pueden mantenerse durante bastante tiempo. Una divergencia tampoco determina la fecha ni el precio de una reversión.",
    "worked": "Con medias suavizadas de avances de 2 y retrocesos de 1, la fuerza relativa es 2. RSI = 100 − 100 / (1 + 2) = 66,7 aproximadamente. Es un cálculo didáctico; la serie del gráfico de mercado de esta clase usa cotizaciones reales.",
    "review": "Contrastá estructura, volumen y volatilidad. La inicialización del suavizado y los datos incluidos pueden explicar diferencias pequeñas entre plataformas.",
    "exercise": "Si las medias de avances y retrocesos son iguales, ¿cuánto vale el RSI? ¿Eso demuestra lateralidad?",
    "answer": "Vale 50. La igualdad de impulso en esa ventana no basta para clasificar toda la estructura del precio."
  },
  {
    "slug": "que-es-el-macd",
    "title": "Tres magnitudes diferentes",
    "metrics": [
      [
        "EMA rápida",
        "105"
      ],
      [
        "EMA lenta",
        "102"
      ],
      [
        "MACD",
        "3"
      ]
    ],
    "explanation": "El MACD mide distancia entre dos medias exponenciales. Su señal suaviza esa diferencia y el histograma compara ambas. Un cruce puede aparecer por aceleración, desaceleración o un rebote dentro de una tendencia mayor. Cambiar la temporalidad cambia el horizonte del análisis.",
    "worked": "Si la EMA rápida vale 105 y la lenta 102, MACD vale 3. Con señal de 2,4, el histograma es 0,6. Que el histograma sea positivo no demuestra que el precio haya marcado un máximo nuevo ni que ambas medias estén subiendo.",
    "review": "En mercados laterales pueden repetirse cruces que generan costos sin continuidad. Contrastá la posición frente a cero y la estructura del gráfico real antes de interpretar la señal.",
    "exercise": "Con MACD de −1 y señal de −1,5, ¿el histograma es positivo o negativo?",
    "answer": "Positivo: −1 − (−1,5) = 0,5. Ambas líneas todavía están por debajo de cero."
  },
  {
    "slug": "que-es-el-flujo-de-caja-libre",
    "title": "No toda ganancia se convierte en caja",
    "metrics": [
      [
        "Flujo operativo",
        "200"
      ],
      [
        "Capex",
        "80"
      ],
      [
        "FCF simplificado",
        "120"
      ]
    ],
    "explanation": "La caja libre requiere una definición coherente. El flujo para la firma y el flujo para el accionista no se descuentan con la misma tasa. Un aumento también puede venir de postergar mantenimiento o cobrar anticipadamente, en lugar de mejorar el negocio.",
    "worked": "Con flujo operativo de 200 y capex de 80, el FCF simplificado es 120. Una adquisición de 150 requiere explicación aparte: tratarla automáticamente como inversión recurrente puede distorsionar la comparación. El estado de flujos permite reconciliar estas partidas.",
    "review": "Revisá capital de trabajo, impuestos, intereses y clasificación contable. Compará varios períodos: EBITDA no equivale a caja disponible para repartir.",
    "exercise": "Si el flujo operativo es 180 y el capex 100, ¿cuánto FCF simplificado queda? ¿Todo puede distribuirse?",
    "answer": "Quedan 80. Todavía hay que evaluar deuda, compromisos y otras necesidades de financiación."
  },
  {
    "slug": "modelos-de-valuacion-dcf",
    "title": "Un flujo y una tasa compatibles",
    "metrics": [
      [
        "FCFF del año 1",
        "110"
      ],
      [
        "WACC",
        "10%"
      ],
      [
        "Valor presente",
        "100"
      ]
    ],
    "explanation": "El trabajo central de un DCF es justificar ventas, margen, reinversión y riesgo. Un flujo nominal en dólares requiere una tasa nominal coherente en dólares. El FCFF se descuenta al WACC; el flujo para el accionista, al costo del equity. Mezclarlos puede producir precisión aparente sin coherencia económica.",
    "worked": "Un FCFF de 110 dentro de un año vale hoy 100 con tasa del 10%: 110 / 1,10. Para pasar del valor operativo al equity, agregá activos no operativos y descontá deuda y otros derechos relevantes antes de dividir por acciones diluidas.",
    "review": "Probá escenarios de tasa y crecimiento terminal. El crecimiento perpetuo necesita reinversión compatible con una rentabilidad sostenible; no se elige para alcanzar una cotización deseada.",
    "exercise": "Con tasa de 12% y el mismo flujo de 110, ¿cuánto vale hoy ese único flujo?",
    "answer": "98,21 aproximadamente. No representa por sí solo el valor completo de la empresa."
  },
  {
    "slug": "tendencias-alcista-bajista-lateral",
    "title": "Primero elegí el horizonte",
    "metrics": [
      [
        "Escala",
        "Diaria"
      ],
      [
        "Observación",
        "Máximos y mínimos"
      ],
      [
        "Referencia",
        "Gráfico real"
      ]
    ],
    "explanation": "Una corrección diaria puede convivir con una estructura semanal alcista. Antes de etiquetar una tendencia, fijá una temporalidad y una regla consistente para identificar pivotes. Cambiar la regla después de conocer el desenlace convierte la lectura en una explicación retrospectiva.",
    "worked": "En el gráfico real, elegí un activo y varios meses de historia. Identificá dos máximos y dos mínimos confirmados y registrá sus fechas. Si la secuencia es contradictoria, dejala sin clasificar: reconocer incertidumbre también es un resultado válido.",
    "review": "Separá una perforación intradía de un cierre y revisá ajustes por dividendos o splits. Un extremo aislado no demuestra un nuevo régimen ni garantiza continuidad.",
    "exercise": "¿Una baja diaria invalida necesariamente una tendencia semanal alcista?",
    "answer": "No. Son horizontes diferentes; hay que revisar la secuencia de pivotes del marco semanal."
  },
  {
    "slug": "soportes-resistencias-polaridad",
    "title": "Una zona admite incertidumbre",
    "metrics": [
      [
        "Referencia",
        "Área de precios"
      ],
      [
        "Prueba",
        "Reacciones repetidas"
      ],
      [
        "Límite",
        "Puede romperse"
      ]
    ],
    "explanation": "Soportes y resistencias son áreas donde oferta y demanda interactuaron, no barreras exactas. Su relevancia depende de temporalidad, volumen, antigüedad y contexto. Una línea demasiado precisa puede esconder que cada participante opera con distintos plazos y costos.",
    "worked": "Elegí en el gráfico real una zona con varias reacciones. Anotá el rango completo y observá qué sucede tras un cierre fuera de él. El cambio de polaridad necesita observación posterior; una resistencia no se vuelve soporte automáticamente por haber sido cruzada una vez.",
    "review": "Definí qué invalidaría tu hipótesis antes de conocer el resultado. Los huecos de apertura pueden atravesar una zona sin permitir operar al precio previsto.",
    "exercise": "¿Una mecha por encima de una resistencia prueba una ruptura sostenida?",
    "answer": "No. Faltan cierre, continuidad y contexto; ninguna combinación ofrece una garantía futura."
  },
  {
    "slug": "lectura-de-velas-japonesas",
    "title": "Cuatro precios, una ventana",
    "metrics": [
      [
        "Apertura",
        "100"
      ],
      [
        "Máximo / mínimo",
        "106 / 98"
      ],
      [
        "Cierre",
        "104"
      ]
    ],
    "explanation": "Una vela comprime apertura, máximo, mínimo y cierre. Su forma depende de la duración y la sesión incluida. Una vela diaria resume movimientos que, vistos intradía, pueden resultar contradictorios. Los nombres de patrones no sustituyen ubicación, volumen y contexto.",
    "worked": "El cuerpo va de 100 a 104; las mechas llegan a 106 y 98. El rango total es 8 y el cuerpo 4. Es una cuenta hipotética que explica los componentes, no una cotización ni un gráfico de precios inventado.",
    "review": "En el gráfico real compará una misma sesión en distintas temporalidades. Conservá moneda, ajustes y horario para evitar conclusiones basadas en series diferentes.",
    "exercise": "¿La vela permite saber si el máximo ocurrió antes o después del mínimo?",
    "answer": "No. Los cuatro precios no conservan el orden exacto de las transacciones del período."
  },
  {
    "slug": "que-es-invertir-vs-ahorrar",
    "title": "El saldo y el poder de compra",
    "metrics": [
      [
        "Capital inicial",
        "1.000"
      ],
      [
        "Saldo final",
        "1.100"
      ],
      [
        "Inflación",
        "15%"
      ]
    ],
    "explanation": "El objetivo, la moneda y la fecha de uso del dinero importan antes de elegir un instrumento. Una reserva de emergencia necesita liquidez; una inversión de largo plazo puede soportar riesgos diferentes. Comparar solo tasas oculta inflación, comisiones, impuestos y posibilidad de pérdida.",
    "worked": "Si 1.000 se convierten en 1.100, el rendimiento nominal es 10%. Con inflación de 15%, el rendimiento real es 1,10 / 1,15 − 1 = −4,35%. El saldo creció en unidades monetarias, pero compra menos de la canasta usada como referencia.",
    "review": "Las proyecciones compuestas suponen reinversión y tasas que quizás no se mantengan. Diferenciá el supuesto de un resultado garantizado y preservá la liquidez necesaria para tus compromisos.",
    "exercise": "¿Un rendimiento nominal de 20% con inflación de 20% aumenta el poder de compra antes de gastos?",
    "answer": "No. El rendimiento real es 0%; con costos podría ser negativo."
  },
  {
    "slug": "gestion-del-riesgo-stop-loss-posicion",
    "title": "Del presupuesto de pérdida al tamaño",
    "metrics": [
      [
        "Capital",
        "10.000"
      ],
      [
        "Riesgo previsto",
        "100"
      ],
      [
        "Distancia al stop",
        "5"
      ]
    ],
    "explanation": "El stop es una instrucción o referencia de salida, no un seguro de ejecución. Noticias, escasa liquidez y huecos de apertura pueden producir un precio efectivo distinto. El tamaño debe considerar tanto esa incertidumbre como el riesgo conjunto de posiciones correlacionadas.",
    "worked": "Capital de 10.000 con riesgo previsto del 1% da un presupuesto de 100. Entrada a 50 y stop a 45 dejan 5 de distancia: 100 / 5 = 20 unidades antes de gastos. La posición vale 1.000; arriesgar 1% no equivale a invertir solo 1%.",
    "review": "Incluí comisiones y deslizamiento. Alejar el stop sin reducir unidades aumenta el riesgo respecto del plan original, aunque mantengas el mismo importe invertido.",
    "exercise": "Si la distancia al stop se duplica a 10, ¿cuántas unidades mantienen un riesgo previsto de 100?",
    "answer": "10 unidades. La pérdida real todavía podría superar ese presupuesto ante un salto de precio."
  },
  {
    "slug": "que-es-el-ev-ebitda",
    "title": "Operación, deuda y conversión a caja",
    "metrics": [
      [
        "Equity",
        "700"
      ],
      [
        "Deuda menos caja",
        "200"
      ],
      [
        "Enterprise value",
        "900"
      ]
    ],
    "explanation": "EV/EBITDA reduce algunas diferencias de financiación, pero no elimina diferencias contables ni necesidades de inversión. Dos negocios con el mismo múltiplo pueden convertir proporciones muy distintas de EBITDA en caja. Conviene reconciliar los ajustes y revisar el tratamiento de arrendamientos.",
    "worked": "Con equity de 700, deuda de 250 y caja excedente de 50, el EV simplificado es 900. Un EBITDA de 100 da 9 veces. Si una empresa requiere 70 de capex recurrente y otra 20, el mismo múltiplo no implica igual economía.",
    "review": "Usá períodos comparables y un perímetro consistente: el EV consolidado debe compararse con resultados de las operaciones que incluye. Un EBITDA ajustado necesita explicación de cada exclusión.",
    "exercise": "Si EV vale 1.200 y EBITDA 150, ¿cuál es el múltiplo? ¿Alcanza para comprar?",
    "answer": "8 veces. Faltan crecimiento, riesgo, deuda y conversión a caja para evaluar la inversión."
  },
  {
    "slug": "que-es-el-peg-ratio",
    "title": "Una expectativa puede cambiar el ratio",
    "metrics": [
      [
        "P/E",
        "24 veces"
      ],
      [
        "Crecimiento previsto",
        "12%"
      ],
      [
        "PEG",
        "2"
      ]
    ],
    "explanation": "El PEG divide un múltiplo por una tasa de crecimiento expresada en puntos porcentuales. Sirve para organizar preguntas, pero no recoge suficientemente riesgo, reinversión o duración del crecimiento. Una expectativa optimista puede reducirlo sin mejorar la calidad del negocio.",
    "worked": "P/E de 24 dividido por crecimiento previsto de 12% produce PEG de 2: se usa 12, no 0,12. Si el crecimiento revisado baja al 6%, el PEG pasa a 4 sin movimiento de la cotización.",
    "review": "Indicá si el crecimiento es histórico o estimado y a cuántos años corresponde. Con pérdidas, crecimiento negativo o beneficios extraordinarios el indicador pierde utilidad.",
    "exercise": "¿PEG de 1 demuestra que la acción está a valor razonable?",
    "answer": "No. No existe un umbral universal que reemplace una valoración y una revisión de riesgos."
  },
  {
    "slug": "que-es-el-roe-retorno-patrimonio",
    "title": "Un porcentaje alto puede esconder deuda",
    "metrics": [
      [
        "Beneficio",
        "60"
      ],
      [
        "Patrimonio medio",
        "300"
      ],
      [
        "ROE",
        "20%"
      ]
    ],
    "explanation": "Un aumento del ROE puede venir de mejoras operativas o de reducir la base patrimonial con deuda, recompras o pérdidas acumuladas. La descomposición de DuPont separa margen, rotación de activos y apalancamiento. Esa distinción evita confundir eficiencia con mayor riesgo financiero.",
    "worked": "Beneficio de 60 sobre patrimonio medio de 300 produce 20%. Si el patrimonio baja a 200 y la ganancia sigue en 60, el ROE sube a 30% sin que las ventas hayan mejorado. La cuenta cambió por el denominador.",
    "review": "Revisá el balance y la evolución de varios años. Con patrimonio muy pequeño o negativo, el ratio puede ser extremo o perder significado; en bancos también importa el capital regulatorio.",
    "exercise": "Si beneficio cae a 40 sobre patrimonio medio de 200, ¿qué ROE resulta?",
    "answer": "20%. Para juzgarlo faltan sostenibilidad operativa y riesgos de la estructura financiera."
  },
  {
    "slug": "medias-moviles-sma-ema",
    "title": "Suavizar implica demorar la reacción",
    "metrics": [
      [
        "Valores de ejemplo",
        "10 · 12 · 14"
      ],
      [
        "SMA de 3",
        "12"
      ],
      [
        "Nuevo dato",
        "16"
      ]
    ],
    "explanation": "La SMA asigna igual peso a cada dato de la ventana. La EMA responde con más peso a observaciones recientes. Ninguna conoce precios futuros. Una ventana más larga suaviza más y suele reaccionar después a los giros, mientras una corta puede producir más señales alternadas.",
    "worked": "Con tres valores didácticos de 10, 12 y 14, la SMA es 12. Al entrar 16 sale 10; la nueva media es 14. Esta cuenta explica el mecanismo: el gráfico interactivo de la clase usa una serie de mercado real identificada.",
    "review": "Un cruce depende de parámetros, temporalidad y régimen. Evitá mezclar medias semanales con conclusiones intradía sin explicarlo y compará siempre series ajustadas de modo consistente.",
    "exercise": "Si el siguiente dato es 18, ¿cuál será la SMA de tres valores?",
    "answer": "16: se promedian 14, 16 y 18. El valor 12 deja la ventana."
  },
  {
    "slug": "bandas-de-bollinger",
    "title": "Las bandas siguen a la dispersión",
    "metrics": [
      [
        "Media",
        "100"
      ],
      [
        "Desvío",
        "4"
      ],
      [
        "Bandas a 2 desvíos",
        "92 y 108"
      ]
    ],
    "explanation": "La amplitud se expande al aumentar la dispersión y se contrae cuando disminuye. Tocar una banda no demuestra infravaloración ni sobrevaloración fundamental, ni obliga a un retorno inmediato hacia la media. Una compresión tampoco revela la dirección de la próxima ruptura.",
    "worked": "Media de 100 y desvío de 4 dan bandas de 92 y 108 con multiplicador 2. Si el desvío sube a 6 manteniendo la media, quedan en 88 y 112. Son números para entender la fórmula, separados de la serie de mercado real.",
    "review": "No conviertas dos desvíos en una probabilidad fija de éxito: los rendimientos no mantienen necesariamente una distribución normal estable. Contrastá volumen, estructura y riesgo de ruptura.",
    "exercise": "¿Qué ocurre al subir el desvío si la media no cambia?",
    "answer": "Las bandas se alejan del centro. Aumenta el ancho sin establecer una dirección del precio."
  },
  {
    "slug": "que-son-los-cedears",
    "title": "El ratio une dos referencias",
    "metrics": [
      [
        "Subyacente",
        "100 USD"
      ],
      [
        "CCL hipotético",
        "1.000 ARS/USD"
      ],
      [
        "Ratio",
        "10 por acción"
      ]
    ],
    "explanation": "El precio local depende del subyacente, tipo de cambio implícito, ratio, liquidez y costos. La equivalencia debe comprobarse para el certificado exacto: no todos representan la misma fracción y los eventos corporativos pueden modificarla. Una suba en pesos no implica siempre una ganancia en dólares.",
    "worked": "Con subyacente de 100 USD, CCL de 1.000 ARS por USD y 10 certificados por acción, la referencia es 100 × 1.000 / 10 = 10.000 ARS por certificado. No es una cotización actual ni un precio ejecutable.",
    "review": "Consultá el programa del depositario, ratio y especie. Dividendos, retenciones y cargos pueden hacer que el importe acreditado difiera de la distribución bruta del subyacente.",
    "exercise": "Si el ratio pasa a 20 manteniendo los otros valores, ¿qué referencia resulta?",
    "answer": "5.000 ARS por certificado; revisá también el ajuste en la cantidad de certificados que posee el inversor."
  },
  {
    "slug": "que-son-los-etfs",
    "title": "Muchas posiciones no aseguran equilibrio",
    "metrics": [
      [
        "Mayor posición",
        "40%"
      ],
      [
        "Segunda posición",
        "30%"
      ],
      [
        "Resto de la cartera",
        "30%"
      ]
    ],
    "explanation": "Un ETF tiene reglas y exposiciones propias. Un fondo sectorial puede reunir muchas empresas y seguir dependiendo de un único ciclo económico. Revisar solo el número de componentes no basta: hay que observar pesos, domicilio, réplica y riesgos del mandato.",
    "worked": "En la canasta hipotética dos empresas concentran 70%, aunque existan decenas de posiciones menores. Una variación del fondo no se reparte por igual entre componentes: cada aporte depende del peso y rendimiento de la posición.",
    "review": "Contrastá prospecto, composición oficial, gastos, spread y diferencia de seguimiento. Los productos apalancados o inversos con objetivo diario necesitan un análisis específico y no equivalen a un fondo amplio tradicional.",
    "exercise": "Si ya tenés las dos empresas directamente, ¿el ETF garantiza suficiente diversificación adicional?",
    "answer": "No. Sumá exposición directa e indirecta y medí la concentración de la cartera completa."
  },
  {
    "slug": "inflacion-y-tasas-de-interes",
    "title": "Comparar tasas del mismo período",
    "metrics": [
      [
        "Retorno nominal",
        "12%"
      ],
      [
        "Inflación",
        "8%"
      ],
      [
        "Retorno real",
        "3,70%"
      ]
    ],
    "explanation": "Una tasa mensual no se compara directamente con una inflación anual. Separá tasa nominal, efectiva y expectativas. La política monetaria influye sobre crédito y valuaciones, pero no elimina factores de oferta, moneda y actividad. Para una inversión también importan costos y tasas futuras de renovación.",
    "worked": "Con retorno efectivo anual del 12% e inflación anual del 8%, el retorno real es 1,12 / 1,08 − 1 = 3,70%. Restar ambas tasas da una aproximación de 4 puntos; no es el cálculo exacto.",
    "review": "Una inflación mensual menor sigue describiendo aumentos de precios. Identificá canasta, jurisdicción y fecha del dato, y distinguí la medición publicada de un pronóstico para el futuro.",
    "exercise": "Si la inflación mensual pasa de 5% a 3%, ¿el nivel general de precios bajó?",
    "answer": "No. Bajó el ritmo de aumento, pero los precios siguieron subiendo durante el segundo mes."
  },
  {
    "slug": "dollar-cost-averaging-dca",
    "title": "El costo medio pondera cantidades",
    "metrics": [
      [
        "Dos aportes",
        "100 y 100"
      ],
      [
        "Precios ilustrativos",
        "10 y 5"
      ],
      [
        "Unidades acumuladas",
        "30"
      ]
    ],
    "explanation": "Aportar en fechas distintas reduce la dependencia de una única entrada y facilita disciplina. No elimina el riesgo del activo ni garantiza superar a una inversión inicial completa. Los costos fijos pueden afectar mucho las compras pequeñas y repetidas.",
    "worked": "El primer aporte compra 10 unidades a 10; el segundo, 20 a 5. El total de 200 compra 30 unidades: costo medio de 6,67 antes de gastos. El promedio simple de los precios, 7,50, sería incorrecto para calcular ese costo.",
    "review": "Relacioná frecuencia, costos y horizonte. Seguir aportando a un activo deteriorado no lo vuelve seguro: revisar la tesis sigue siendo necesario y la exposición acumulada puede crecer demasiado.",
    "exercise": "Si el precio posterior es 6, ¿las 30 unidades recuperan los 200?",
    "answer": "No: valen 180. La pérdida es 20 antes de comisiones, aunque el segundo aporte haya bajado el costo medio."
  },
  {
    "slug": "diversificacion-y-drawdown",
    "title": "La recuperación parte de una base menor",
    "metrics": [
      [
        "Capital inicial",
        "100"
      ],
      [
        "Capital tras la caída",
        "80"
      ],
      [
        "Suba necesaria",
        "25%"
      ]
    ],
    "explanation": "El drawdown mide pérdida desde un máximo, no la variación frente a cualquier fecha. Su historial no limita la pérdida futura. Diversificar distribuye fuentes de riesgo, pero posiciones con nombres distintos pueden reaccionar igual ante tasas, liquidez o actividad económica.",
    "worked": "Caer de 100 a 80 equivale a perder 20%. Recuperar desde 80 hasta 100 exige ganar 25%: 20 / 80. Un aporte posterior puede elevar el saldo sin que la inversión haya recuperado su rendimiento.",
    "review": "Revisá pesos, correlaciones y moneda. Las correlaciones históricas pueden cambiar durante crisis. Separá entradas y salidas de dinero de la rentabilidad para no atribuir aportes a la gestión.",
    "exercise": "Después de una caída del 50%, ¿alcanza una suba del 50% para recuperar?",
    "answer": "No: hace falta subir 100%. Subir 50% desde 50 solo lleva el capital a 75."
  },
  {
    "slug": "wacc-y-spread-creacion-valor",
    "title": "Crear valor después del costo de financiarse",
    "metrics": [
      [
        "ROIC",
        "14%"
      ],
      [
        "WACC",
        "10%"
      ],
      [
        "Capital invertido",
        "1.000"
      ]
    ],
    "explanation": "El diferencial entre ROIC y WACC debe medirse con supuestos consistentes de moneda, impuestos y período. Un resultado contable positivo no demuestra creación de valor económico: también hay que remunerar el riesgo de los proveedores de capital. El WACC no se observa directamente como una cotización; es una estimación que cambia con sus supuestos.",
    "worked": "Con capital de 1.000, ROIC de 14% y WACC de 10%, el beneficio económico ilustrativo es (14% − 10%) × 1.000 = 40. Ese excedente no es el retorno bursátil anual ni un dividendo automáticamente distribuible.",
    "review": "Revisá sostenibilidad y oportunidades de reinversión. Crecer con retorno inferior al costo de capital puede destruir valor aunque aumenten ventas y beneficio total.",
    "exercise": "¿Qué pasa si el ROIC cae a 8% con los otros valores iguales?",
    "answer": "El beneficio económico sería −20. La operación no cubriría el costo estimado de ese capital."
  },
  {
    "slug": "eps-beneficio-por-accion",
    "title": "La ganancia total se divide entre acciones",
    "metrics": [
      [
        "Beneficio atribuible",
        "120"
      ],
      [
        "Acciones medias",
        "40"
      ],
      [
        "EPS básico",
        "3"
      ]
    ],
    "explanation": "El EPS usa acciones promedio ponderadas del período, no necesariamente las acciones existentes al cierre. Las emisiones, recompras y compensaciones pueden alterar el denominador. El beneficio atribuible debe corresponder a los accionistas comunes y al mismo período analizado.",
    "worked": "Con beneficio atribuible de 120 y 40 acciones promedio, EPS básico es 3. Si el cálculo diluido incorpora 4 acciones equivalentes adicionales sin ajustar el beneficio de este ejemplo, el EPS diluido baja a 2,73. En instrumentos convertibles reales también puede requerirse ajustar el numerador.",
    "review": "Compará básico, diluido y ajustado sin intercambiarlos. Revisá la conciliación de la empresa y no confundas EPS trimestral con EPS de los últimos doce meses.",
    "exercise": "Si el beneficio crece 10% y las acciones también 10%, ¿aumenta el EPS?",
    "answer": "No: ambos efectos se compensan. El accionista participa de más beneficio total repartido entre más acciones."
  },
  {
    "slug": "pb-precio-valor-libros",
    "title": "El patrimonio contable no es un precio de liquidación",
    "metrics": [
      [
        "Capitalización",
        "600"
      ],
      [
        "Patrimonio",
        "400"
      ],
      [
        "P/B",
        "1,5 veces"
      ]
    ],
    "explanation": "El P/B compara el valor que asigna el mercado al equity con su patrimonio contable. Las normas, deterioros, recompras e intangibles afectan esa base. Un múltiplo bajo puede reflejar dudas sobre rentabilidad o calidad de activos, no necesariamente una oportunidad de comprar por debajo del valor recuperable.",
    "worked": "Una capitalización de 600 frente a patrimonio de 400 produce P/B de 1,5. Si parte relevante del patrimonio corresponde a activos de difícil realización, no puede asumirse que venderlos permitiría recuperar ese importe. El balance y sus notas importan tanto como la división.",
    "review": "Compará modelos de negocio semejantes. Una firma intensiva en conocimiento puede registrar pocos activos pese a tener ventajas valiosas; el patrimonio negativo vuelve poco interpretable el ratio.",
    "exercise": "Si patrimonio cae a 300 y la capitalización queda en 600, ¿qué ocurre con el múltiplo?",
    "answer": "Sube a 2 veces sin que la cotización necesariamente haya aumentado. Cambió el denominador."
  },
  {
    "slug": "ps-precio-ventas",
    "title": "Las ventas no pertenecen enteras al accionista",
    "metrics": [
      [
        "Capitalización",
        "500"
      ],
      [
        "Ventas anuales",
        "1.000"
      ],
      [
        "P/S",
        "0,5 veces"
      ]
    ],
    "explanation": "El P/S puede utilizarse cuando las ganancias son bajas o negativas, pero no informa cuánto queda después de pagar costos. Tampoco refleja directamente la deuda, porque el numerador usa equity. Empresas con márgenes muy distintos no deberían compararse solo por este múltiplo.",
    "worked": "Con capitalización de 500 y ventas de 1.000, P/S es 0,5. Un margen neto de 2% dejaría 20 de beneficio y un P/E implícito de 25, si no existen ajustes adicionales. Un múltiplo de ventas pequeño puede convivir con ganancias relativamente caras.",
    "review": "Identificá si se usan ventas históricas o estimadas, su calidad y la estructura financiera. EV/ventas permite incorporar financiación, pero tampoco reemplaza el análisis de márgenes.",
    "exercise": "Con iguales ventas de 1.000 y margen neto de 10%, ¿cuánto beneficio resultaría?",
    "answer": "100. La misma cifra de ventas puede sostener ganancias muy diferentes según la rentabilidad."
  },
  {
    "slug": "margenes-bruto-operativo-neto",
    "title": "Cada margen responde una pregunta distinta",
    "metrics": [
      [
        "Ventas",
        "1.000"
      ],
      [
        "Beneficio bruto",
        "400"
      ],
      [
        "Resultado operativo",
        "150"
      ]
    ],
    "explanation": "El margen bruto resume lo que queda tras costos directos según la clasificación de la compañía. El operativo incorpora gastos de funcionamiento y el neto añade financiación, impuestos y otras partidas. La clasificación puede variar entre empresas, de modo que comparar porcentajes exige revisar definiciones.",
    "worked": "Sobre ventas de 1.000, costo de ventas de 600 deja margen bruto de 40%. Gastos operativos de 250 reducen el resultado operativo a 150 y su margen a 15%. Si el beneficio final es 90, el margen neto es 9%. Cada nivel explica una etapa diferente.",
    "review": "Buscá cambios de mezcla, precios, costos y partidas extraordinarias. Un margen que mejora por una reclasificación contable no demuestra una mejora económica equivalente.",
    "exercise": "Si las ventas crecen pero el margen operativo baja de 15% a 10%, ¿siempre cae el resultado operativo?",
    "answer": "No. Depende del crecimiento de ventas: hay que calcular el importe, no mirar solo el porcentaje."
  },
  {
    "slug": "deuda-solvencia-cobertura",
    "title": "La capacidad de pagar depende también del calendario",
    "metrics": [
      [
        "Deuda neta",
        "300"
      ],
      [
        "EBITDA",
        "100"
      ],
      [
        "Deuda neta / EBITDA",
        "3 veces"
      ]
    ],
    "explanation": "La deuda neta descuenta caja de la deuda financiera, pero no toda caja está libremente disponible. Restricciones, moneda y necesidades de operación importan. Un ratio de apalancamiento no muestra por sí solo vencimientos, costo variable, garantías o cláusulas contractuales.",
    "worked": "Deuda financiera de 380 menos caja disponible de 80 deja deuda neta de 300. Con EBITDA de 100, el ratio es 3 veces. Si EBIT es 60 e intereses 20, la cobertura de intereses basada en EBIT es 3. Ninguna cuenta asegura acceso a refinanciación.",
    "review": "Revisá el calendario, liquidez y escenarios de caída de resultados. Compará EBIT o EBITDA con intereses usando una definición explícita y no mezcles ratios de proveedores distintos.",
    "exercise": "Si EBITDA cae a 75 con deuda neta estable, ¿qué apalancamiento resulta?",
    "answer": "4 veces. El deterioro operativo puede elevar el riesgo aun sin tomar deuda nueva."
  },
  {
    "slug": "dividendos-yield-payout",
    "title": "El porcentaje necesita cobertura",
    "metrics": [
      [
        "Dividendo anual",
        "2"
      ],
      [
        "Precio",
        "40"
      ],
      [
        "Dividend yield",
        "5%"
      ]
    ],
    "explanation": "El rendimiento por dividendos depende del precio y del importe distribuido. Si cae la cotización, el yield puede subir sin que la empresa pague más. Hay que distinguir dividendos declarados, históricos y esperados, y revisar si la caja permite sostenerlos después de invertir en la operación.",
    "worked": "Con dividendo anual de 2 y precio de 40, yield es 5%. Si EPS anual es 4, payout sobre beneficio es 50%. Si el precio cae a 20 y el dividendo todavía se supone estable, el yield aparente sube a 10%; eso no garantiza continuidad.",
    "review": "Contrastá distribución con ganancias y flujo libre, deuda y política de capital. Dividendos extraordinarios pueden inflar el dato de los últimos doce meses; retenciones y comisiones afectan el cobro neto.",
    "exercise": "¿Un yield alto prueba que el dividendo futuro está asegurado?",
    "answer": "No. Puede reflejar riesgo de recorte, precio deprimido o una distribución excepcional ya terminada."
  },
  {
    "slug": "capitalizacion-y-enterprise-value",
    "title": "El valor de la acción y el de la operación",
    "metrics": [
      [
        "Capitalización",
        "800"
      ],
      [
        "Deuda",
        "300"
      ],
      [
        "Caja excedente",
        "100"
      ]
    ],
    "explanation": "La capitalización usa el precio de la acción y las acciones existentes bajo una definición explícita. Enterprise value aproxima el valor operativo ajustando financiación y activos no operativos. Puede incluir minoritarios, preferidas u otros derechos; no siempre basta con sumar deuda y restar toda la caja.",
    "worked": "Precio de 20 por 40 acciones da capitalización de 800. Con deuda de 300 y caja excedente de 100, EV simplificado es 1.000. Si comparás ese valor con resultados, verificá que ambos correspondan al mismo perímetro de consolidación.",
    "review": "Separá acciones actuales de promedio diluido usado para EPS. Revisá fecha y moneda: una capitalización de hoy combinada con deuda antigua puede necesitar actualización por emisiones o adquisiciones recientes.",
    "exercise": "Si la empresa toma 50 de deuda y conserva esos 50 como caja, ¿cambia el EV simplificado inmediatamente?",
    "answer": "No por esos dos movimientos aislados: deuda y caja aumentan por igual. El riesgo y los costos de financiación sí merecen revisión."
  },
  {
    "slug": "atr-average-true-range",
    "title": "El rango también considera los huecos",
    "metrics": [
      [
        "Máximo / mínimo",
        "105 / 100"
      ],
      [
        "Cierre previo",
        "98"
      ],
      [
        "True range",
        "7"
      ]
    ],
    "explanation": "El ATR resume amplitud de movimientos, no dirección. El true range incluye la distancia respecto del cierre previo, de modo que incorpora huecos entre sesiones. Comparar ATR en unidades monetarias entre activos de precios muy distintos puede resultar engañoso; normalizar por precio ayuda a dar contexto.",
    "worked": "Con máximo de 105, mínimo de 100 y cierre previo de 98, las tres distancias son 5, 7 y 2. El true range es la mayor: 7. El ATR suaviza una secuencia de esos rangos, por lo que este único cálculo no equivale al indicador completo.",
    "review": "Usá la misma temporalidad y método de suavizado. Un ATR mayor puede justificar revisar tamaño o tolerancia a fluctuaciones, pero no demuestra que el precio vaya a subir o bajar.",
    "exercise": "Si el ATR vale 4 y el precio 80, ¿qué porcentaje aproximado representa?",
    "answer": "5%. No es una probabilidad de pérdida ni una predicción del rango exacto de mañana."
  },
  {
    "slug": "adx-fuerza-de-tendencia",
    "title": "Fuerza y dirección se leen por separado",
    "metrics": [
      [
        "ADX",
        "30"
      ],
      [
        "+DI",
        "25"
      ],
      [
        "−DI",
        "15"
      ]
    ],
    "explanation": "El ADX resume fuerza tendencial mediante movimientos direccionales suavizados. Un valor creciente no significa necesariamente suba del precio: puede acompañar una tendencia bajista fuerte. La dirección se estudia con +DI, −DI y la propia estructura del mercado.",
    "worked": "En la lectura ilustrativa, ADX de 30 indica una intensidad distinta de un valor bajo, mientras +DI superior a −DI aporta información direccional. No existe un umbral que garantice éxito. El gráfico real permite comprobar cómo ambas lecturas evolucionan durante una misma ventana.",
    "review": "En rangos y transiciones las señales pueden retrasarse o alternarse. Documentá parámetros y frecuencia antes de comparar con otro activo o con capturas de otra plataforma.",
    "exercise": "¿Un ADX que sube mientras domina −DI contradice una tendencia bajista?",
    "answer": "No. Puede indicar que esa tendencia bajista gana fuerza; ADX no asigna signo alcista o bajista."
  },
  {
    "slug": "oscilador-estocastico",
    "title": "La posición del cierre dentro del rango",
    "metrics": [
      [
        "Mínimo de ventana",
        "90"
      ],
      [
        "Máximo de ventana",
        "110"
      ],
      [
        "Cierre",
        "105"
      ]
    ],
    "explanation": "El estocástico ubica el cierre respecto del rango observado. No mide por sí mismo una valoración fundamental ni garantiza un giro cuando alcanza una zona extrema. La longitud de la ventana y el suavizado de %K y %D cambian la sensibilidad.",
    "worked": "Con mínimo 90, máximo 110 y cierre 105, el %K sin suavizar es (105 − 90) / (110 − 90) × 100 = 75. Si todos los valores de la ventana fueran iguales, el denominador sería cero y el tratamiento dependería de la plataforma.",
    "review": "Una lectura elevada puede persistir durante una tendencia. Contrastá cruces, estructura y volatilidad en el gráfico real, evitando convertir una sobrecompra en una venta automática.",
    "exercise": "Si el cierre queda exactamente a mitad del rango, ¿qué %K sin suavizar resulta?",
    "answer": "50. Es una posición relativa dentro de la ventana, no una probabilidad de suba del 50%."
  },
  {
    "slug": "vwap-precio-ponderado-por-volumen",
    "title": "El volumen modifica el promedio",
    "metrics": [
      [
        "Operación A",
        "100 × 10"
      ],
      [
        "Operación B",
        "110 × 30"
      ],
      [
        "VWAP",
        "107,50"
      ]
    ],
    "explanation": "VWAP pondera precios por volumen y depende del período o ancla elegidos. Un VWAP de sesión se reinicia según su calendario; uno anclado a un evento responde otra pregunta. No deben compararse como si fueran la misma referencia.",
    "worked": "Dos operaciones didácticas: 10 unidades a 100 y 30 a 110. El valor negociado suma 4.300 sobre volumen de 40, por lo que VWAP es 107,50. El promedio simple de precios sería 105 e ignoraría que hubo más negociación al precio alto.",
    "review": "En datos agregados pueden utilizarse aproximaciones del precio por vela. El volumen de un mercado no representa automáticamente todo el volumen mundial del activo; identificá fuente, sesión y modalidad.",
    "exercise": "¿Cotizar por encima del VWAP prueba que conviene comprar?",
    "answer": "No. Solo describe la relación con un promedio ponderado del período; faltan estructura, costos y riesgo."
  },
  {
    "slug": "volumen-y-confirmacion",
    "title": "La actividad necesita una base comparable",
    "metrics": [
      [
        "Volumen actual",
        "1.500"
      ],
      [
        "Promedio comparable",
        "1.000"
      ],
      [
        "Volumen relativo",
        "1,5 veces"
      ]
    ],
    "explanation": "El volumen informa actividad negociada; cada intercambio tiene una contraparte compradora y otra vendedora. Por eso un volumen alto no significa simplemente que existen más compradores que vendedores. Su interpretación depende del movimiento de precios y de la referencia usada.",
    "worked": "Volumen de 1.500 frente a un promedio comparable de 1.000 da 1,5 veces. Comparar media jornada con el total de jornadas completas puede distorsionar ese ratio. El ejemplo explica una comparación, no describe negociaciones de una empresa real.",
    "review": "Contrastá el mismo mercado, franja horaria y tratamiento de eventos. Subastas, vencimientos y rebalanceos pueden elevar volumen sin constituir una nueva tesis de inversión. La confirmación es evidencia contextual, no una garantía.",
    "exercise": "¿El mismo volumen de 1.500 sigue siendo alto si el promedio habitual es 3.000?",
    "answer": "No respecto de esa referencia: el volumen relativo sería 0,5 veces. La base cambia la lectura."
  },
  {
    "slug": "bonos-tir-duration",
    "title": "Una sensibilidad aproximada a la tasa",
    "metrics": [
      [
        "Precio inicial",
        "100"
      ],
      [
        "Duration modificada",
        "4"
      ],
      [
        "Suba de TIR",
        "1 punto"
      ]
    ],
    "explanation": "La TIR resume una tasa implícita en precio y flujos contractuales bajo supuestos. La duration modificada aproxima sensibilidad ante pequeños cambios de rendimiento, pero no incorpora por sí sola incumplimiento, grandes movimientos ni todas las formas de la curva. La convexidad mejora la aproximación para cambios mayores.",
    "worked": "Con duration modificada de 4, una suba de TIR de 1 punto porcentual sugiere variación cercana a −4%: −4 × 0,01. Un precio de 100 pasaría aproximadamente a 96, manteniendo los otros factores. No es una predicción exacta del precio negociado.",
    "review": "Revisá moneda, legislación, cupón, amortizaciones, liquidez y riesgo de crédito. La reinversión de cupones y una venta previa al vencimiento pueden hacer que el retorno realizado difiera de la TIR inicial.",
    "exercise": "Si la TIR baja 0,5 puntos con igual duration, ¿qué variación aproximada resulta?",
    "answer": "+2%, antes de convexidad y otros cambios. La relación aproximada entre precio y tasa es inversa."
  },
  {
    "slug": "dolar-mep-y-ccl",
    "title": "Comparar la misma especie y plazo",
    "metrics": [
      [
        "Precio local",
        "120.000 ARS"
      ],
      [
        "Precio en dólares",
        "100 USD"
      ],
      [
        "Tipo implícito",
        "1.200 ARS/USD"
      ]
    ],
    "explanation": "MEP y CCL son referencias implícitas obtenidas al comparar precios de instrumentos negociados en monedas o plazas diferentes. La comparación necesita cantidades equivalentes, plazos consistentes y considerar comisiones. No es suficiente dividir dos precios con nombres parecidos sin revisar sus unidades.",
    "worked": "Un precio de 120.000 ARS y otro de 100 USD por la misma cantidad del instrumento producen 1.200 ARS por USD antes de gastos. Si una especie cotiza por distinto valor nominal o ratio, primero hay que normalizar las cantidades.",
    "review": "Las condiciones de acceso, liquidación y restricciones pueden cambiar. Verificá las reglas vigentes con el intermediario y fuentes oficiales antes de una operación; esta cuenta no explica por sí sola cómo ejecutarla.",
    "exercise": "Si los gastos reducen los dólares netos recibidos, ¿el costo efectivo en pesos por dólar sube o baja?",
    "answer": "Sube: los mismos pesos se reparten entre menos dólares acreditados."
  },
  {
    "slug": "riesgo-pais-embi",
    "title": "Un diferencial, no una probabilidad",
    "metrics": [
      [
        "Spread",
        "600 puntos básicos"
      ],
      [
        "Equivalencia",
        "6 puntos porcentuales"
      ],
      [
        "Referencia",
        "Deuda soberana"
      ]
    ],
    "explanation": "El riesgo país sintetiza un diferencial de rendimiento bajo la metodología de un índice. No es una tasa de plazo fijo ni una probabilidad directa de default. Refleja crédito y también condiciones de mercado, liquidez, composición y duración de los bonos incluidos.",
    "worked": "Un spread de 600 puntos básicos equivale a 6 puntos porcentuales. Sumarlos a una referencia de 4% ofrece una aproximación ilustrativa de 10%, pero no determina la TIR exacta de todos los bonos argentinos ni sus precios individuales.",
    "review": "Consultá fuente, fecha y metodología. Dos bonos del mismo país pueden tener rendimientos distintos por legislación, moneda, vencimiento y liquidez. Un descenso del spread no elimina el riesgo crediticio.",
    "exercise": "¿Bajar de 600 a 500 puntos equivale a caer un punto básico?",
    "answer": "No. Son 100 puntos básicos, equivalentes a 1 punto porcentual de diferencial."
  },
  {
    "slug": "calendario-economico-y-eventos",
    "title": "Una sorpresa depende de qué se esperaba",
    "metrics": [
      [
        "Publicado",
        "3,2%"
      ],
      [
        "Consenso",
        "3,0%"
      ],
      [
        "Sorpresa",
        "+0,2 puntos"
      ]
    ],
    "explanation": "Un calendario reúne dato publicado, consenso, previo y revisiones, pero cada campo responde una pregunta diferente. La reacción del mercado depende de expectativas, composición y contexto. Un dato mejor en términos económicos puede provocar una reacción bursátil negativa si altera las perspectivas de tasas.",
    "worked": "Si se publica 3,2% frente a consenso de 3,0%, la sorpresa es +0,2 puntos porcentuales. Si el período previo se revisa de 2,8% a 3,1%, esa revisión también cambia la lectura. No debe describirse todo como una única mejora de 0,4 puntos.",
    "review": "Identificá unidad, frecuencia, ajuste estacional, país y zona horaria. Un horario pendiente no debe convertirse en una hora inventada, y un dato no publicado debe conservarse como pendiente.",
    "exercise": "¿La diferencia entre 3,2% y 3,0% es 0,2% o 0,2 puntos porcentuales?",
    "answer": "Son 0,2 puntos porcentuales. La variación porcentual relativa sería otro cálculo distinto."
  },
  {
    "slug": "beta-volatilidad-mercado",
    "title": "Sensibilidad histórica no es riesgo total",
    "metrics": [
      [
        "Movimiento del índice",
        "2%"
      ],
      [
        "Beta ilustrativa",
        "1,5"
      ],
      [
        "Componente asociado",
        "3%"
      ]
    ],
    "explanation": "Beta estima sensibilidad a un benchmark mediante datos históricos. Depende de ventana, frecuencia y referencia elegidas. No representa el rango máximo de pérdidas ni incluye todo el riesgo específico de una empresa. Tampoco implica una relación mecánica en cada rueda.",
    "worked": "Con beta de 1,5 y un movimiento del índice de 2%, el componente asociado al mercado sería aproximadamente 3% dentro del modelo. El retorno observado puede diferir mucho por noticias propias, ruido y otros factores. No es una predicción diaria.",
    "review": "Compará betas calculadas de forma consistente. Cambios de deuda, negocio o régimen de mercado pueden volver poco representativa la historia; una beta baja no asegura preservar capital.",
    "exercise": "¿Una beta de 0,5 garantiza perder como máximo la mitad de lo que pierda el índice?",
    "answer": "No. Es una estimación de sensibilidad media, no un límite contractual de pérdidas."
  },
  {
    "slug": "cotizaciones-ohlc-volumen-variacion",
    "title": "Una variación necesita referencia y moneda",
    "metrics": [
      [
        "Cierre previo",
        "100"
      ],
      [
        "Precio actual",
        "103"
      ],
      [
        "Variación",
        "3%"
      ]
    ],
    "explanation": "Precio, variación y volumen deben acompañarse de mercado, moneda, hora y sesión. Un precio de preapertura, rueda regular o posmercado describe negociaciones diferentes. Una hora de consulta reciente no demuestra que la última operación haya ocurrido en ese momento.",
    "worked": "Con cierre previo de 100 y precio actual de 103, el cambio es 3%. Si el proveedor muestra 103 con demora, la cuenta puede ser correcta para esa observación sin representar el precio instantáneo. OHLC resume una ventana; no es una secuencia completa de transacciones.",
    "review": "Revisá ajustes por dividendos y splits antes de comparar períodos. Distinguir falta de dato de una variación de 0% evita interpretar una falla de cobertura como estabilidad del activo.",
    "exercise": "Si el proveedor no informa variación, ¿corresponde mostrar 0%?",
    "answer": "No. La falta de información debe mostrarse como no disponible, con su contexto."
  },
  {
    "slug": "crecimiento-cagr-comparaciones",
    "title": "El promedio compuesto usa extremos y tiempo",
    "metrics": [
      [
        "Valor inicial",
        "100"
      ],
      [
        "Valor final",
        "144"
      ],
      [
        "Períodos anuales",
        "2"
      ]
    ],
    "explanation": "CAGR resume una tasa compuesta equivalente entre dos extremos. No describe la trayectoria ni la volatilidad entre ambos. Usar años incompletos como períodos completos o comparar ventanas distintas puede producir conclusiones engañosas sobre crecimiento.",
    "worked": "De 100 a 144 en dos años, CAGR = (144 / 100)^(1 / 2) − 1 = 20%. No es 22%, que surgiría de dividir el crecimiento total de 44% por dos. La composición cambia la base sobre la que se aplica cada período.",
    "review": "Aclarar si medís ventas, beneficio, precio o retorno total es parte de la interpretación. Con base negativa o cruce por cero, el CAGR estándar puede perder sentido y requerir otra presentación.",
    "exercise": "¿CAGR de 20% demuestra que cada año creció exactamente 20%?",
    "answer": "No. Distintas trayectorias pueden terminar en el mismo valor; el indicador solo resume los extremos."
  },
  {
    "slug": "portafolio-pnl-costo-aportes",
    "title": "Un aporte no es rentabilidad",
    "metrics": [
      [
        "Saldo inicial",
        "1.000"
      ],
      [
        "Aporte",
        "200"
      ],
      [
        "Saldo final",
        "1.250"
      ]
    ],
    "explanation": "El saldo mezcla rendimiento, aportes, retiros y movimientos de efectivo. Para medir resultados hay que separar los flujos externos de las ganancias de inversión. El PnL de posiciones y la rentabilidad de toda la cartera tampoco son necesariamente el mismo indicador.",
    "worked": "Si empezás con 1.000, aportás 200 y terminás con 1.250, no ganaste 25% por inversión. Hay 50 por encima del capital aportado, pero la tasa depende de cuándo ingresaron esos 200. Un cálculo ponderado por tiempo divide períodos alrededor de los flujos.",
    "review": "Registrá fechas, moneda y comisiones. Evitá mezclar ARS y USD sin una referencia de conversión consistente; separar resultado realizado y no realizado mejora la lectura del portafolio.",
    "exercise": "¿Se puede calcular una tasa exacta solo con esos tres importes si no sabemos cuándo ocurrió el aporte?",
    "answer": "No. La fecha del flujo es necesaria para atribuir correctamente la rentabilidad."
  },
  {
    "slug": "negocio-directivos-y-estructura-accionaria",
    "title": "Los incentivos también forman parte del negocio",
    "metrics": [
      [
        "Acciones del fundador",
        "10"
      ],
      [
        "Acciones totales",
        "100"
      ],
      [
        "Participación económica",
        "10%"
      ]
    ],
    "explanation": "Conocer qué vende una empresa no basta para entender quién decide y quién recibe el resultado. Hay que revisar clientes, geografía, segmentos, incentivos y derechos de voto. La participación económica y el control pueden diferir cuando existen clases de acciones con votos distintos.",
    "worked": "Un fundador con 10 acciones sobre 100 posee 10% económico si todas tienen iguales derechos de reparto. Si sus acciones otorgan más votos, su influencia puede ser mayor. El porcentaje de acciones por sí solo no permite inferir control sin leer la estructura de clases.",
    "review": "Consultá el informe anual, la documentación de gobierno corporativo y operaciones con partes relacionadas. La experiencia del directivo no reemplaza evaluar incentivos, dilución y asignación de capital.",
    "exercise": "¿Un directivo con mayor porcentaje accionario garantiza decisiones beneficiosas para todos los minoritarios?",
    "answer": "No. Puede alinear algunos incentivos, pero persisten conflictos, diferencias de voto y riesgos de gobierno."
  },
  {
    "slug": "revenue-ingresos-reconocimiento",
    "title": "Facturar, reconocer y cobrar son momentos distintos",
    "metrics": [
      [
        "Contrato anual",
        "1.200"
      ],
      [
        "Servicio mensual",
        "100"
      ],
      [
        "Cobro inicial",
        "1.200"
      ]
    ],
    "explanation": "El reconocimiento de ingresos responde a obligaciones de desempeño y condiciones del contrato. Cobrar anticipadamente no significa necesariamente haber generado toda la venta contable. A su vez, registrar una venta a crédito no implica que el cliente ya haya pagado. Separar esas fechas permite comprender tanto crecimiento como necesidades de financiación.",
    "worked": "Un servicio anual hipotético cuesta 1.200, se cobra al comienzo y se presta uniformemente durante doce meses. Si corresponde reconocer el ingreso a lo largo del tiempo, cada mes aporta 100. Al inicio aparece caja, pero queda una obligación pendiente por el servicio aún no prestado.",
    "review": "Leé la política de reconocimiento y los cambios de estimaciones. Devoluciones, descuentos, pagos variables y diferencias entre principal y agente pueden alterar los importes reportados sin un cambio equivalente en demanda.",
    "exercise": "¿Cobrar los 1.200 por adelantado permite atribuir todo ese importe al primer mes de servicio?",
    "answer": "No en este supuesto de prestación uniforme. El ingreso se distribuye según el cumplimiento de la obligación."
  },
  {
    "slug": "crecimiento-organico-precio-volumen-divisas",
    "title": "Crecer no siempre significa vender más unidades",
    "metrics": [
      [
        "Ventas iniciales",
        "100"
      ],
      [
        "Suba de precio",
        "10%"
      ],
      [
        "Suba de volumen",
        "5%"
      ]
    ],
    "explanation": "Descomponer crecimiento ayuda a distinguir demanda, capacidad de fijar precios, adquisiciones y efecto cambiario. Las definiciones de crecimiento orgánico y moneda constante pueden variar por empresa. Para comparar, revisá la conciliación desde ventas reportadas y no sumes ajustes de compañías distintas como si fueran idénticos.",
    "worked": "Si una empresa vende la misma mezcla y aumenta precios 10% y volumen 5%, las ventas pasan de 100 a 115,5: 1,10 × 1,05. El crecimiento es 15,5%, no exactamente 15%, porque ambos efectos se componen. Es una simplificación sin cambios de mezcla ni divisas.",
    "review": "Una adquisición puede elevar ventas totales sin mejorar el negocio comparable. Contrastá volumen, precio, mezcla y margen para evaluar si la expansión exige descuentos o más capital de trabajo.",
    "exercise": "Si sube precio 10% pero cae volumen 10%, ¿las ventas permanecen iguales?",
    "answer": "No: 1,10 × 0,90 = 0,99. Caerían 1% bajo estos supuestos."
  },
  {
    "slug": "pe-trailing-forward-beneficios-normalizados",
    "title": "La expectativa también tiene incertidumbre",
    "metrics": [
      [
        "Precio",
        "60"
      ],
      [
        "EPS histórico",
        "3"
      ],
      [
        "EPS previsto",
        "4"
      ]
    ],
    "explanation": "El múltiplo trailing utiliza ganancias ya reportadas; el forward depende de estimaciones. Una revisión del pronóstico cambia el múltiplo sin modificar el precio. Normalizar beneficios requiere justificar exclusiones, impuestos y ciclo, manteniendo una definición que no cambie oportunistamente entre períodos.",
    "worked": "Con acción a 60 y EPS histórico de 3, trailing P/E es 20. Con EPS esperado de 4, forward P/E es 15. Esa reducción no demuestra que el mercado ofrezca un descuento seguro: supone que el beneficio previsto se materializa.",
    "review": "Buscá rango de estimaciones, fecha de revisión y sensibilidad a margen o actividad. Un beneficio excepcional pasado y un pronóstico optimista futuro pueden producir comparaciones aparentemente atractivas pero poco útiles.",
    "exercise": "Si la estimación de EPS baja de 4 a 2,5 manteniendo precio 60, ¿qué forward P/E resulta?",
    "answer": "24 veces. La acción no cambió de precio; empeoró el beneficio esperado del denominador."
  },
  {
    "slug": "eps-diluido-recompras-sbc",
    "title": "Una recompra puede compensar emisiones",
    "metrics": [
      [
        "Acciones iniciales",
        "100"
      ],
      [
        "Recompras",
        "5"
      ],
      [
        "Nuevas acciones",
        "5"
      ]
    ],
    "explanation": "La cantidad de acciones debe analizarse junto con emisiones, compensación basada en acciones y posibles convertibles. Un programa de recompras anunciado no equivale a recompras ejecutadas. Si la compañía emite a la vez nuevas acciones, el efecto neto puede ser pequeño aunque el gasto de caja sea significativo.",
    "worked": "Con 100 acciones iniciales, recomprar 5 y emitir 5 deja 100, antes de ponderar fechas. La empresa utilizó caja sin reducir el número final. Para EPS corresponde el promedio temporal y, cuando aplique, la dilución potencial conforme a las reglas contables.",
    "review": "Compará acciones básicas, diluidas y al cierre. Revisá el costo de la compensación, sus condiciones y cómo afecta al accionista. No trates toda recompra como creación automática de valor: importa también el precio pagado.",
    "exercise": "Si el beneficio queda constante y las acciones promedio bajan de 100 a 90, ¿qué pasa con EPS?",
    "answer": "Aumenta aproximadamente 11,11%, aun sin crecimiento del beneficio total. La mejora proviene del denominador."
  },
  {
    "slug": "ebit-ebitda-reconciliacion-caja",
    "title": "Sumar amortizaciones no crea efectivo",
    "metrics": [
      [
        "EBIT",
        "80"
      ],
      [
        "Depreciación y amortización",
        "20"
      ],
      [
        "EBITDA",
        "100"
      ]
    ],
    "explanation": "EBITDA recupera depreciaciones y amortizaciones a partir del resultado operativo bajo una definición consistente. No descuenta mantenimiento de activos, intereses, impuestos ni cambios de capital de trabajo. Las versiones ajustadas necesitan una conciliación: excluir cargos habituales puede exagerar la capacidad económica.",
    "worked": "Con EBIT de 80 y depreciación y amortización de 20, EBITDA es 100. Si el negocio necesita 35 de capex, no podés concluir que esos 100 están libres para repartir. Todavía faltan otros cobros, pagos y obligaciones para llegar a un flujo de caja.",
    "review": "Compará el mismo perímetro y revisá ajustes por arrendamientos o gastos de reestructuración. Las necesidades de inversión suelen diferir entre sectores, aunque coincidan sus márgenes EBITDA.",
    "exercise": "¿Puede una empresa presentar EBITDA positivo y flujo operativo negativo?",
    "answer": "Sí. Por ejemplo, podría acumular cuentas por cobrar o inventario que absorban más caja que el resultado generado."
  },
  {
    "slug": "nopat-impuestos-operativos",
    "title": "Separar la operación de su financiación",
    "metrics": [
      [
        "EBIT",
        "200"
      ],
      [
        "Tasa operativa supuesta",
        "25%"
      ],
      [
        "NOPAT",
        "150"
      ]
    ],
    "explanation": "NOPAT estima el resultado operativo después de impuestos sin mezclar la estructura de deuda. No coincide necesariamente con beneficio neto ni con impuestos efectivamente pagados en el período. La tasa elegida debe reflejar la operación y estar explicada: una tasa transitoriamente baja puede inflar la rentabilidad aparente.",
    "worked": "Con EBIT de 200 y tasa operativa normalizada de 25%, NOPAT = 200 × 0,75 = 150. Restar después intereses de deuda cambiaría el concepto y mezclaría financiación con la medida operativa que busca usarse para ROIC o FCFF.",
    "review": "Separá tasa legal, efectiva contable y tasa de caja. Pérdidas fiscales, diferencias temporarias y operaciones internacionales pueden hacer que diverjan. Una normalización razonable necesita reconciliación, no un porcentaje arbitrario.",
    "exercise": "Si EBIT aumenta a 220 con la misma tasa, ¿cuál es NOPAT?",
    "answer": "165. El crecimiento de NOPAT sería 10% en este ejemplo sin otros ajustes."
  },
  {
    "slug": "capital-invertido-goodwill-caja",
    "title": "La caja operativa y la excedente no son iguales",
    "metrics": [
      [
        "Deuda financiera",
        "300"
      ],
      [
        "Patrimonio",
        "500"
      ],
      [
        "Caja excedente",
        "100"
      ]
    ],
    "explanation": "El capital invertido puede estimarse desde financiación o desde activos operativos, siempre reconciliando los componentes. La caja necesaria para funcionar no debe tratarse igual que la excedente. Incluir o excluir goodwill cambia la pregunta sobre adquisiciones y rentabilidad; ambas lecturas requieren explicitar la definición.",
    "worked": "En una versión simplificada, deuda de 300 más patrimonio de 500 menos caja excedente de 100 produce capital invertido de 700. No se restó toda la caja automáticamente. Arrendamientos, minoritarios y activos no operativos podrían exigir ajustes adicionales.",
    "review": "Usá capital promedio para relacionarlo con resultados de un período. Revisá adquisiciones y deterioros: una baja contable del capital puede elevar el ROIC posterior sin mejorar la operación.",
    "exercise": "Si caja total es 150 pero 50 se necesita para operar, ¿cuánto se resta como excedente en este supuesto?",
    "answer": "100. Restar 150 subestimaría los recursos requeridos por el negocio."
  },
  {
    "slug": "roic-incremental-reinversion-crecimiento",
    "title": "El retorno del capital nuevo puede diferir",
    "metrics": [
      [
        "Aumento de NOPAT",
        "20"
      ],
      [
        "Aumento de capital",
        "100"
      ],
      [
        "ROIC incremental",
        "20%"
      ]
    ],
    "explanation": "El retorno incremental intenta estudiar qué genera la inversión nueva, no el rendimiento promedio de todo el capital histórico. Entre invertir y obtener resultados puede haber varios años. Medir solo dos fechas sin considerar adquisiciones, ciclo y maduración puede producir conclusiones demasiado fuertes.",
    "worked": "Si NOPAT pasa de 100 a 120 y el capital invertido de 500 a 600, la relación incremental simple es 20 / 100 = 20%. No prueba que una fábrica concreta gane 20%: resume cambios agregados que podrían tener múltiples causas.",
    "review": "Usá ventanas plurianuales y revisá la procedencia del crecimiento. La relación entre reinversión, retorno y expansión funciona bajo supuestos; no convierte un retorno pasado en una promesa para inversiones futuras.",
    "exercise": "Si el capital nuevo todavía no está plenamente operativo, ¿un retorno incremental bajo demuestra fracaso definitivo?",
    "answer": "No. Puede reflejar el desfase de maduración, aunque sigue siendo necesario contrastar plazos y resultados con el plan."
  },
  {
    "slug": "wacc-sensibilidad-deuda-patrimonio",
    "title": "Los pesos de financiación importan",
    "metrics": [
      [
        "Peso equity",
        "60%"
      ],
      [
        "Peso deuda",
        "40%"
      ],
      [
        "WACC del ejemplo",
        "10,4%"
      ]
    ],
    "explanation": "El WACC pondera costos de financiación bajo una estructura objetivo consistente. Habitualmente se trabaja con valores de mercado, no solo contables. El beneficio fiscal de intereses depende de condiciones reales; asumir que toda deuda siempre genera el mismo ahorro puede subestimar el costo de capital.",
    "worked": "Con equity al 60%, costo de equity del 14%, deuda al 40%, costo de deuda del 8% y tasa fiscal del 37,5%, el WACC es 0,60 × 14% + 0,40 × 8% × (1 − 37,5%) = 10,4%. Son supuestos ilustrativos, no parámetros recomendados.",
    "review": "Probá sensibilidad tanto al costo del equity como a deuda, impuestos y pesos. Más deuda puede elevar el riesgo y encarecer ambas fuentes: cambiar solo el peso sin revisar costos puede ser inconsistente.",
    "exercise": "¿Una empresa siempre reduce su WACC tomando más deuda?",
    "answer": "No. El apalancamiento puede aumentar riesgo, costos y restricciones hasta compensar o superar cualquier ventaja fiscal."
  },
  {
    "slug": "capm-costo-equity-beta-prima",
    "title": "Separar riesgo de mercado de supuestos",
    "metrics": [
      [
        "Tasa libre de riesgo",
        "4%"
      ],
      [
        "Beta",
        "1,2"
      ],
      [
        "Prima de mercado",
        "5%"
      ]
    ],
    "explanation": "CAPM aproxima el costo del equity a partir de una tasa libre de riesgo y exposición al mercado. La beta depende de muestra y benchmark; la prima de mercado es una estimación. Moneda, inflación y fecha deben ser coherentes. El resultado es un supuesto de valoración, no una tasa que el accionista vaya a cobrar.",
    "worked": "Con tasa libre de riesgo de 4%, beta de 1,2 y prima de 5%, costo de equity = 4% + 1,2 × 5% = 10%. Si se incorporan riesgos adicionales, explicá metodología y evitá contarlos dos veces mediante diferentes primas.",
    "review": "Distinguir beta de activo y beta apalancada ayuda a comparar estructuras financieras. Una gran precisión decimal no elimina la incertidumbre de los componentes ni del modelo.",
    "exercise": "Si beta sube a 1,5 con las otras hipótesis iguales, ¿qué costo de equity resulta?",
    "answer": "11,5%. La mayor sensibilidad al mercado aumenta el retorno requerido dentro de este modelo."
  },
  {
    "slug": "ciclo-conversion-caja-dso-dio-dpo",
    "title": "El crecimiento puede consumir financiación",
    "metrics": [
      [
        "DSO",
        "45 días"
      ],
      [
        "DIO",
        "60 días"
      ],
      [
        "DPO",
        "30 días"
      ]
    ],
    "explanation": "El ciclo de conversión estima cuánto tiempo transcurre entre financiar inventarios y recuperar efectivo de ventas. DSO relaciona cuentas a cobrar con ventas; DIO y DPO requieren bases de costos y definiciones coherentes. Estacionalidad, impuestos y compras pueden distorsionar una lectura de cierre.",
    "worked": "Con DSO de 45, DIO de 60 y DPO de 30, el ciclo es 45 + 60 − 30 = 75 días. Aumentar ventas puede elevar la caja inmovilizada aunque el margen sea positivo. No es una suma de saldos monetarios, sino una aproximación temporal.",
    "review": "Compará promedios de balance y varios períodos. Extender pagos puede mejorar caja a corto plazo, pero tensionar proveedores; un ciclo negativo tampoco elimina otros riesgos operativos.",
    "exercise": "Si DPO aumenta a 45 sin cambios en DSO ni DIO, ¿qué ciclo resulta?",
    "answer": "60 días. La financiación de proveedores reduce el tiempo neto que debe cubrir la empresa."
  },
  {
    "slug": "acciones-capital-derechos-dividendos",
    "title": "Participación económica y voto",
    "metrics": [
      [
        "Acciones propias",
        "10"
      ],
      [
        "Acciones totales",
        "1.000"
      ],
      [
        "Participación",
        "1%"
      ]
    ],
    "explanation": "Una acción implica derechos económicos y políticos definidos por su clase y documentación. Dividendos no son pagos obligatorios universales y pueden suspenderse. La cotización tampoco equivale a una porción fija del patrimonio recuperable: depende de expectativas, liquidez y riesgos.",
    "worked": "Diez acciones sobre 1.000 representan 1% si todas tienen los mismos derechos económicos. Si la compañía emite 100 nuevas acciones y el inversor conserva 10, su participación baja a 10 / 1.100 = 0,91% aproximadamente. El efecto económico depende también de qué recibe la empresa por emitir.",
    "review": "Consultá clases, derechos de suscripción, voto y documentos corporativos. Más acciones no implican automáticamente destrucción de valor si financian proyectos rentables, pero cambian la participación relativa del tenedor.",
    "exercise": "Si todas las acciones duplican su cantidad por un split proporcional, ¿se duplica tu porcentaje del negocio?",
    "answer": "No. Cambian unidades, mientras el porcentaje económico permanece igual bajo ese split."
  },
  {
    "slug": "bonos-cupon-amortizacion-valor-nominal",
    "title": "El cupón se calcula sobre una base contractual",
    "metrics": [
      [
        "Valor nominal",
        "1.000"
      ],
      [
        "Cupón anual",
        "6%"
      ],
      [
        "Cupón del año",
        "60"
      ]
    ],
    "explanation": "El valor nominal sirve como referencia contractual, pero no es necesariamente el precio negociado. El cupón puede aplicarse al capital original o residual según las condiciones. Un bono amortizable devuelve principal antes del vencimiento final, modificando pagos e intereses futuros.",
    "worked": "Sobre nominal de 1.000 con cupón anual de 6% y capital constante, el interés anual es 60. Comprar a 900 no cambia ese cupón contractual: la rentabilidad depende además del precio, amortizaciones, reinversión y cumplimiento del emisor.",
    "review": "Leé fechas, base de cálculo, frecuencia y amortización. Diferenciá precio limpio de precio con intereses corridos cuando corresponda. El rendimiento corriente no reemplaza una TIR calculada sobre todos los flujos.",
    "exercise": "¿Cobrar 60 sobre precio pagado de 900 implica que la TIR sea exactamente 6,67%?",
    "answer": "No. Ese es el rendimiento corriente aproximado; la TIR incorpora también devolución de capital y calendario completo."
  },
  {
    "slug": "letras-tesoro-descuento-capitalizacion",
    "title": "El rendimiento usa el precio pagado",
    "metrics": [
      [
        "Precio pagado",
        "950"
      ],
      [
        "Cobro al vencimiento",
        "1.000"
      ],
      [
        "Ganancia del período",
        "50"
      ]
    ],
    "explanation": "Una letra puede emitirse a descuento o capitalizar según sus términos. Comparar tasas exige revisar plazo, base anual, convención y emisor. La tasa calculada sobre nominal no es igual al rendimiento sobre el dinero efectivamente invertido, y anualizar agrega supuestos de reinversión.",
    "worked": "Pagar 950 para recibir 1.000 deja 50 de ganancia bruta: rendimiento del período de 50 / 950 = 5,26%. Dividir por 1.000 daría 5%, una medida distinta. Sin conocer el plazo no corresponde presentar ninguna de ellas como tasa anual.",
    "review": "Leé las condiciones de emisión y riesgo soberano. Vender antes del vencimiento expone al precio de mercado; el pago pactado depende del cumplimiento del emisor. No traslades convenciones de un país a otro automáticamente.",
    "exercise": "¿Podés comparar ese 5,26% del período con una TEA sin saber los días hasta vencimiento?",
    "answer": "No. Primero hay que llevar ambas medidas a plazos y convenciones consistentes."
  },
  {
    "slug": "obligaciones-negociables-on-credito",
    "title": "La moneda de denominación no alcanza",
    "metrics": [
      [
        "Nominal",
        "1.000 USD"
      ],
      [
        "Cupón anual",
        "8%"
      ],
      [
        "Interés contractual",
        "80 USD"
      ]
    ],
    "explanation": "Una ON es deuda corporativa con condiciones particulares. Deben revisarse moneda de pago, legislación, garantías, prioridad, amortización y posibilidad de rescate. Estar denominada en dólares no significa que todos los riesgos sean iguales a los de otro instrumento en dólares.",
    "worked": "Nominal de 1.000 USD con cupón de 8% genera 80 USD anuales si el capital permanece constante y el contrato se cumple. Si se compra por encima o debajo del nominal, el rendimiento cambia aunque el cupón siga igual. La TIR requiere todos los flujos y sus fechas.",
    "review": "Revisá capacidad de pago, deuda, cobertura y vencimientos de la compañía. Una calificación es una opinión de riesgo, no una garantía. Las condiciones de rescate pueden limitar la ganancia si bajan tasas o mejora el crédito.",
    "exercise": "¿Dos ON con el mismo cupón tienen necesariamente igual rendimiento y riesgo?",
    "answer": "No. Pueden cotizar a precios diferentes y tener distintos vencimientos, garantías, prioridad y calidad crediticia."
  },
  {
    "slug": "cedears-ratio-precio-dividendos",
    "title": "El dividendo sigue el ratio y los cargos",
    "metrics": [
      [
        "Dividendo por acción",
        "2 USD"
      ],
      [
        "Ratio",
        "10 certificados"
      ],
      [
        "Bruto por certificado",
        "0,20 USD"
      ]
    ],
    "explanation": "El ratio conecta cada certificado con la participación subyacente. El dividendo bruto debe ajustarse a esa equivalencia antes de considerar retenciones, costos y fechas de acreditación. La distribución extranjera no garantiza que el importe neto recibido localmente coincida con una simple división.",
    "worked": "Si la acción paga 2 USD y se necesitan 10 CEDEARs por acción, el bruto teórico por certificado es 0,20 USD. Tener 50 certificados equivaldría a 5 acciones y 10 USD brutos bajo ese ratio. El neto requiere aplicar las condiciones efectivas del programa.",
    "review": "Verificá ratio vigente y eventos corporativos en el depositario. No mezcles rentabilidad del subyacente en dólares con variación local en pesos, donde también interviene el tipo de cambio implícito.",
    "exercise": "Si el ratio fuera 20 manteniendo el dividendo, ¿cuánto bruto correspondería por certificado?",
    "answer": "0,10 USD. La cantidad de certificados equivalentes por acción es indispensable para interpretar el importe."
  },
  {
    "slug": "etf-nav-costos-tracking-error",
    "title": "El precio de mercado puede diferir del NAV",
    "metrics": [
      [
        "NAV por participación",
        "100"
      ],
      [
        "Precio de mercado",
        "101"
      ],
      [
        "Prima sobre NAV",
        "1%"
      ]
    ],
    "explanation": "El NAV representa el valor neto de los activos por participación bajo la metodología del fondo. El precio se negocia en mercado y puede mostrar prima o descuento. La diferencia de seguimiento mide divergencia de retorno frente al índice; tracking error suele describir variabilidad de esa diferencia, según su definición.",
    "worked": "Con NAV de 100 y precio de 101, la prima es 1%. No implica que el fondo haya generado 1% adicional de rentabilidad de cartera. Pagar esa prima puede afectar el resultado si desaparece posteriormente, aun con activos sin cambios.",
    "review": "Contrastá prospecto, costo total, liquidez y horario de negociación de los subyacentes. Una cotización del fondo en un horario donde parte de su cartera no opera puede complicar la comparación instantánea.",
    "exercise": "Si NAV sube a 102 pero el precio sigue en 101, ¿hay prima o descuento?",
    "answer": "Hay descuento aproximado de 0,98%: 101 / 102 − 1. Precio y valor de activos no son conceptos idénticos."
  },
  {
    "slug": "plazo-fijo-tna-tea-uva",
    "title": "La tasa anual no es el rendimiento de 30 días",
    "metrics": [
      [
        "Capital",
        "100.000"
      ],
      [
        "TNA hipotética",
        "36,5%"
      ],
      [
        "Plazo",
        "30 días"
      ]
    ],
    "explanation": "TNA expresa una convención nominal anual; para calcular un período necesitás su base de días. TEA incorpora capitalización bajo una frecuencia especificada. Renovar supone que el instrumento y las condiciones futuras estén disponibles; no hay que tratar la tasa actual como garantizada durante todo un año.",
    "worked": "Con TNA ilustrativa del 36,5% y base de 365 días, 30 días rinden 36,5% × 30 / 365 = 3%. Sobre 100.000 son 3.000 antes de otras condiciones. Es un ejemplo matemático, no una tasa bancaria vigente ni una recomendación.",
    "review": "En productos UVA, revisá actualización, plazo y condiciones de precancelación aplicables. Verificá información actual del banco y BCRA: reglas y tasas pueden cambiar. Compará también liquidez y rendimiento real frente a inflación.",
    "exercise": "¿Esa TNA equivale a cobrar 36,5% en cualquier colocación de 30 días?",
    "answer": "No. Es una tasa nominal anual; en el supuesto del ejemplo el período rinde 3%."
  },
  {
    "slug": "bitcoin-red-custodia-exposicion",
    "title": "Precio y custodia son riesgos distintos",
    "metrics": [
      [
        "Exposición",
        "0,02 BTC"
      ],
      [
        "Precio hipotético",
        "50.000 USD/BTC"
      ],
      [
        "Valor bruto",
        "1.000 USD"
      ]
    ],
    "explanation": "Poseer bitcoin directamente, una participación en un fondo o un saldo en una plataforma no implica los mismos derechos ni riesgos de custodia. La exposición al precio puede parecer similar, pero cambian intermediarios, costos y mecanismos de acceso. La volatilidad puede ser elevada y el valor no está asegurado.",
    "worked": "Una tenencia de 0,02 BTC a referencia hipotética de 50.000 USD por BTC vale 1.000 USD antes de costos. Si esa referencia cae 20%, el valor pasa a 800. La cantidad de unidades puede seguir igual mientras cambia su valor monetario.",
    "review": "En autocustodia, la pérdida de claves o frase de recuperación puede impedir el acceso; en custodia delegada existe riesgo del proveedor. No compartas credenciales y diferenciá la red de las condiciones comerciales del intermediario.",
    "exercise": "¿Tener las mismas unidades garantiza conservar los mismos dólares o el mismo poder de compra?",
    "answer": "No. La exposición de precio y, según el producto, los costos y riesgos de contraparte afectan el valor."
  },
  {
    "slug": "opciones-call-put-prima-strike",
    "title": "El derecho tiene un costo inicial",
    "metrics": [
      [
        "Strike de la call",
        "100"
      ],
      [
        "Prima pagada",
        "5"
      ],
      [
        "Precio al vencimiento",
        "112"
      ]
    ],
    "explanation": "Una call comprada da un derecho de compra y una put comprada, de venta, bajo las condiciones del contrato. No son acciones: vencen, pueden perder toda la prima y su precio depende de tiempo, volatilidad y otros factores. El riesgo de vender opciones puede ser mucho mayor que el de comprarlas.",
    "worked": "Para una call comprada con strike 100 y prima de 5 por unidad, un subyacente a 112 al vencimiento da valor intrínseco de 12 y resultado bruto de 7. Se omiten gastos y se debe multiplicar por el tamaño contractual real. Antes de vencer, el precio incluye otros componentes.",
    "review": "Revisá estilo de ejercicio, liquidación, multiplicador y vencimiento. El punto de equilibrio al vencimiento no es una regla de valuación intradía. Una opción puede perder valor aunque el movimiento direccional parezca favorable.",
    "exercise": "Si el subyacente termina en 102, ¿la call del ejemplo produce ganancia neta?",
    "answer": "No. Su valor intrínseco es 2 y, después de la prima de 5, pierde 3 por unidad antes de gastos."
  }
];
