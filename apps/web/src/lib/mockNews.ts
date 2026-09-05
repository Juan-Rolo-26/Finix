// ─── Mock News Handler ────────────────────────────────────────────────────────
// Returns realistic financial mock news per category.
// Intercepts /news?category=* calls so the page works without the NestJS backend.

export interface MockNewsItem {
    id: number;
    title: string;
    summary: string;
    url: string;
    image?: string;
    source: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
    publishedAt: string;
}

function ago(minutes: number) {
    return new Date(Date.now() - minutes * 60000).toISOString();
}

// ─── Seed data per category ───────────────────────────────────────────────────

const NEWS_DATA: Record<string, MockNewsItem[]> = {
    cripto: [
        {
            id: 1001, source: 'CoinDesk',
            title: 'Bitcoin supera los $65.000 por primera vez en semanas ante renovado optimismo institucional',
            summary: 'El precio de Bitcoin alcanzó nuevos máximos semanales impulsado por flujos positivos en ETFs spot y declaraciones favorables de grandes gestoras de activos que aumentaron su exposición al activo digital.',
            url: 'https://www.coindesk.com',
            image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=80',
            sentiment: 'positive', publishedAt: ago(28),
        },
        {
            id: 1002, source: 'Cointelegraph',
            title: 'Ethereum completa actualización de red: comisiones bajan un 40% y velocidad de transacciones sube',
            summary: 'La última actualización de la red Ethereum trajo mejoras significativas en eficiencia, reduciendo drásticamente el costo del gas y aumentando el throughput en condiciones de alta demanda.',
            url: 'https://cointelegraph.com',
            image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
            sentiment: 'positive', publishedAt: ago(55),
        },
        {
            id: 1003, source: 'Bloomberg Crypto',
            title: 'SEC aprueba dos nuevos ETFs de Bitcoin: flujos de capital esperados superan los $2.000M en primer mes',
            summary: 'La aprobación de nuevos vehículos de inversión regulados en cripto abre la puerta a capital institucional que hasta ahora permanecía al margen del mercado.',
            url: 'https://bloomberg.com/crypto',
            image: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800&q=80',
            sentiment: 'positive', publishedAt: ago(120),
        },
        {
            id: 1004, source: 'Decrypt',
            title: 'Solana registra récord histórico de transacciones diarias: 85 millones en 24 horas',
            summary: 'La blockchain de alto rendimiento continúa ganando terreno en el mercado de DeFi y NFTs, reportando su mejor jornada en términos de actividad on-chain.',
            url: 'https://decrypt.co',
            sentiment: 'positive', publishedAt: ago(180),
        },
        {
            id: 1005, source: 'The Block',
            title: 'Mercado cripto argentino: volumen en P2P crece 65% interanual ante demanda de cobertura cambiaria',
            summary: 'Los argentinos continúan recurriendo a criptomonedas como USDT y USDC para protegerse de la inflación y acceder a dólares por fuera del mercado oficial.',
            url: 'https://theblock.co',
            sentiment: 'neutral', publishedAt: ago(240),
        },
        {
            id: 1006, source: 'Messari',
            title: 'DeFi: el valor total bloqueado (TVL) supera los $120.000M por primera vez en 2024',
            summary: 'El ecosistema de finanzas descentralizadas experimenta un renacimiento con nuevos protocolos de lending y yield farming atrayendo capital fresco.',
            url: 'https://messari.io',
            sentiment: 'positive', publishedAt: ago(320),
        },
        {
            id: 1007, source: 'CoinDesk',
            title: 'Ripple gana apelación clave: XRP no es valor en ventas secundarias, dice tribunal federal',
            summary: 'El fallo judicial refuerza la posición de Ripple y sienta precedentes importantes para la regulación del ecosistema cripto en Estados Unidos.',
            url: 'https://www.coindesk.com/ripple',
            sentiment: 'positive', publishedAt: ago(480),
        },
        {
            id: 1008, source: 'Cointelegraph',
            title: 'Tether emite $1.500M adicionales de USDT: señal de demanda creciente en mercados emergentes',
            summary: 'La stablecoin dominante continúa expandiendo su oferta para satisfacer la creciente demanda de dólares digitales, especialmente en Latinoamérica y Asia.',
            url: 'https://cointelegraph.com/tether',
            sentiment: 'neutral', publishedAt: ago(600),
        },
    ],

    argentina: [
        {
            id: 2001, source: 'La Nación',
            title: 'Balanza comercial argentina registra superávit de $1.200M en agosto: tercer mes consecutivo positivo',
            summary: 'Las exportaciones agroindustriales y energéticas sostienen el ingreso de divisas, mientras las restricciones a las importaciones mantienen el saldo favorable.',
            url: 'https://lanacion.com.ar',
            image: 'https://images.unsplash.com/photo-1617260557901-cbbb97a85d39?w=800&q=80',
            sentiment: 'positive', publishedAt: ago(45),
        },
        {
            id: 2002, source: 'Infobae',
            title: 'Dólar blue cae a $1.175: brecha cambiaria en mínimos desde la implementación del cepo reforzado',
            summary: 'La demanda de divisas en el mercado informal continuó retrocediendo impulsada por el crawling peg y la mejora en las expectativas de estabilización macroeconómica.',
            url: 'https://infobae.com',
            image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80',
            sentiment: 'positive', publishedAt: ago(90),
        },
        {
            id: 2003, source: 'Ámbito',
            title: 'INDEC: inflación de agosto fue del 3,5%, la más baja en dos años',
            summary: 'El índice de precios al consumidor mostró una desaceleración más pronunciada de lo esperado, aunque los rubros de alimentos y servicios siguen siendo los principales impulsores.',
            url: 'https://ambito.com',
            image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
            sentiment: 'positive', publishedAt: ago(150),
        },
        {
            id: 2004, source: 'El Cronista',
            title: 'El Merval trepa 4,8% y quiebra máximos históricos nominales: YPF lidera las subas',
            summary: 'El panel líder de la bolsa porteña aceleró su tendencia alcista, con energía y bancos al frente. En dólares, el índice alcanza niveles no vistos desde 2018.',
            url: 'https://cronista.com',
            sentiment: 'positive', publishedAt: ago(200),
        },
        {
            id: 2005, source: 'La Nación',
            title: 'Vaca Muerta: producción de shale oil bate récord y consolida a Argentina como potencia energética',
            summary: 'La extracción de petróleo no convencional alcanzó 400.000 barriles diarios, convirtiendo a Neuquén en un hub energético estratégico a nivel latinoamericano.',
            url: 'https://lanacion.com.ar/economia',
            sentiment: 'positive', publishedAt: ago(280),
        },
        {
            id: 2006, source: 'Infobae',
            title: 'Reservas del BCRA superan los $31.000M: el mayor nivel desde 2020 gracias al blanqueo y exportaciones',
            summary: 'El ingreso de divisas por el programa de regularización de activos y la liquidación del agro permitieron reconstruir el colchón de reservas.',
            url: 'https://infobae.com/economia',
            sentiment: 'positive', publishedAt: ago(360),
        },
        {
            id: 2007, source: 'Ámbito',
            title: 'CEDEARs: qué papeles argentinos en Wall Street recomiendan los analistas para el cuarto trimestre',
            summary: 'Expertos del mercado de capitales identifican oportunidades en energía, finanzas y tecnología dentro de las acciones argentinas que cotizan en el mercado estadounidense.',
            url: 'https://ambito.com/cedears',
            sentiment: 'neutral', publishedAt: ago(440),
        },
        {
            id: 2008, source: 'El Cronista',
            title: 'Tasa de desempleo baja al 6,2%: el nivel más bajo en 15 años según INDEC',
            summary: 'El mercado laboral muestra signos de recuperación sostenida, con mejoras en la informalidad y el poder adquisitivo real de los salarios.',
            url: 'https://cronista.com/economia',
            sentiment: 'positive', publishedAt: ago(520),
        },
    ],

    global: [
        {
            id: 3001, source: 'Reuters',
            title: 'Fed decide pausa de tasas: Powell indica que el ciclo de subas llegó a su fin',
            summary: 'La Reserva Federal dejó las tasas sin cambios por tercera reunión consecutiva y señaló que los datos de inflación justifican mantener la política monetaria estable antes de los primeros recortes.',
            url: 'https://reuters.com',
            image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
            sentiment: 'positive', publishedAt: ago(35),
        },
        {
            id: 3002, source: 'Financial Times',
            title: 'S&P 500 supera los 5.600 puntos: tecnología y salud lideran el rally anual del 22%',
            summary: 'El mercado accionario estadounidense continúa su racha alcista impulsada por resultados corporativos superiores a lo esperado y la resiliencia de la economía.',
            url: 'https://ft.com',
            image: 'https://images.unsplash.com/photo-1642790551116-18e4f5a8c7e5?w=800&q=80',
            sentiment: 'positive', publishedAt: ago(80),
        },
        {
            id: 3003, source: 'Bloomberg',
            title: 'China anuncia paquete de estímulo de $500.000M para reactivar su economía',
            summary: 'El gobierno chino presentó un ambicioso plan de infraestructura e incentivos al consumo para contrarrestar la desaceleración del mercado inmobiliario.',
            url: 'https://bloomberg.com',
            image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
            sentiment: 'neutral', publishedAt: ago(140),
        },
        {
            id: 3004, source: 'The Economist',
            title: 'IPC de EE.UU. baja al 2,1% anual: el mercado descuenta tres recortes de tasas para 2026',
            summary: 'Los datos de inflación confirman la tendencia desinflacionaria, abriendo la puerta a una política monetaria más expansiva que podría beneficiar a emerging markets.',
            url: 'https://economist.com',
            sentiment: 'positive', publishedAt: ago(220),
        },
        {
            id: 3005, source: 'Reuters',
            title: 'BCE baja tasas por segunda vez en el año: Lagarde advierte sobre lentitud del crecimiento europeo',
            summary: 'El Banco Central Europeo recortó sus tasas de referencia en 25 puntos básicos y proyectó una expansión modesta para la zona euro en el próximo año.',
            url: 'https://reuters.com/bce',
            sentiment: 'neutral', publishedAt: ago(300),
        },
        {
            id: 3006, source: 'Financial Times',
            title: 'Nvidia reporta ganancias trimestrales récord: ingresos por IA superan los $30.000M',
            summary: 'El fabricante de chips registró un crecimiento sin precedentes impulsado por la demanda insaciable de infraestructura para modelos de lenguaje y centros de datos.',
            url: 'https://ft.com/nvidia',
            sentiment: 'positive', publishedAt: ago(380),
        },
        {
            id: 3007, source: 'Bloomberg',
            title: 'Oro supera los $2.800 por onza: nuevo máximo histórico en medio de incertidumbre geopolítica',
            summary: 'El metal precioso continúa siendo el refugio preferido de los inversores ante tensiones en Medio Oriente y el Mar del Sur de China.',
            url: 'https://bloomberg.com/commodities',
            sentiment: 'neutral', publishedAt: ago(460),
        },
        {
            id: 3008, source: 'The Economist',
            title: 'FMI eleva proyección de crecimiento global a 3,2% para 2026: Latinoamérica es la región más dinámica',
            summary: 'El Fondo Monetario Internacional revisó al alza sus estimaciones para la economía mundial, destacando la solidez de los países emergentes y el fin del ciclo de ajuste monetario.',
            url: 'https://economist.com/fmi',
            sentiment: 'positive', publishedAt: ago(560),
        },
    ],

    economia: [
        {
            id: 4001, source: 'Ámbito',
            title: 'PBI argentino crece 6,8% interanual en el segundo trimestre: la recuperación se acelera',
            summary: 'La actividad económica mostró una expansión mayor a la proyectada, impulsada por la construcción, el agro y los servicios financieros.',
            url: 'https://ambito.com',
            image: 'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?w=800&q=80',
            sentiment: 'positive', publishedAt: ago(40),
        },
        {
            id: 4002, source: 'El Cronista',
            title: 'Bonos Argentina: AL30 sube 3,2% y el riesgo país cae a 580 puntos básicos',
            summary: 'El mercado de deuda soberana argentina registró una jornada positiva luego de datos de reservas y superávit fiscal que superaron las expectativas del mercado.',
            url: 'https://cronista.com',
            image: 'https://images.unsplash.com/photo-1618044733300-9472054094ee?w=800&q=80',
            sentiment: 'positive', publishedAt: ago(95),
        },
        {
            id: 4003, source: 'Infobae',
            title: 'Superávit fiscal primario: el gobierno cierra agosto con $450.000M de excedente',
            summary: 'Por octavo mes consecutivo el sector público registra un resultado positivo, consolidando la disciplina fiscal como ancla del programa macroeconómico.',
            url: 'https://infobae.com',
            image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
            sentiment: 'positive', publishedAt: ago(160),
        },
        {
            id: 4004, source: 'La Nación',
            title: 'Tasa de interés real positiva: el BCRA recorta 200 puntos básicos y la Leliq queda en 60% TNA',
            summary: 'La política de tasas del banco central busca equilibrar la desinflación con la reactivación del crédito, en un contexto de caída sostenida de la inflación mensual.',
            url: 'https://lanacion.com.ar',
            sentiment: 'neutral', publishedAt: ago(240),
        },
        {
            id: 4005, source: 'Reuters',
            title: 'Inversión extranjera directa en Argentina sube 120% en el primer semestre: energía y minería lideran',
            summary: 'Grandes compañías globales aumentaron sus compromisos en Argentina, atraídas por los recursos de Vaca Muerta y el potencial minero del NOA.',
            url: 'https://reuters.com/argentina',
            sentiment: 'positive', publishedAt: ago(320),
        },
        {
            id: 4006, source: 'Ámbito',
            title: 'Salarios reales crecen 8% en agosto: el poder adquisitivo supera niveles pre-crisis por primera vez',
            summary: 'Los ingresos de los trabajadores formales registraron una mejora real acumulada gracias a la desaceleración inflacionaria y las paritarias del sector privado.',
            url: 'https://ambito.com/salarios',
            sentiment: 'positive', publishedAt: ago(400),
        },
        {
            id: 4007, source: 'El Cronista',
            title: 'El consumo privado repunta: ventas minoristas suben 12% en agosto respecto al año anterior',
            summary: 'Los datos de actividad comercial muestran una recuperación gradual del consumo de los hogares, impulsada por la mejora salarial y la estabilidad de precios.',
            url: 'https://cronista.com/economia',
            sentiment: 'positive', publishedAt: ago(490),
        },
        {
            id: 4008, source: 'La Nación',
            title: 'BCRA vuelve a comprar divisas en el mercado oficial: acumula $820M en agosto',
            summary: 'El banco central retomó su posición compradora en el mercado de cambios, señal de que el ingreso de divisas genuinas supera los pagos por importaciones.',
            url: 'https://lanacion.com.ar/bcra',
            sentiment: 'positive', publishedAt: ago(580),
        },
    ],

    acciones: [
        {
            id: 5001, source: 'Rava Bursátil',
            title: 'YPF marca nuevo máximo anual: sube 7% tras resultados del segundo trimestre y guía optimista',
            summary: 'La empresa energética reportó utilidades netas por encima de lo esperado y elevó sus proyecciones de producción en Vaca Muerta para el segundo semestre.',
            url: 'https://rava.com',
            image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&q=80',
            sentiment: 'positive', publishedAt: ago(30),
        },
        {
            id: 5002, source: 'Invertir Online',
            title: 'Banco Galicia supera estimaciones: ganancia neta crece 45% y anuncia recompra de acciones',
            summary: 'El principal banco privado del país presentó resultados excepcionales impulsados por el crecimiento del crédito y la mejora del margen financiero ante la baja de inflación.',
            url: 'https://invertironline.com',
            image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80',
            sentiment: 'positive', publishedAt: ago(75),
        },
        {
            id: 5003, source: 'Bull Market Brokers',
            title: 'Pampa Energía: Deutsche Bank sube el precio objetivo a $35 y mantiene recomendación de compra',
            summary: 'El banco de inversión destacó el potencial de expansión de la empresa en generación eléctrica y su posicionamiento estratégico en Vaca Muerta.',
            url: 'https://bullmarketbrokers.com',
            image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
            sentiment: 'positive', publishedAt: ago(130),
        },
        {
            id: 5004, source: 'Rava Bursátil',
            title: 'Mercado Libre en máximos históricos: MELI supera los $2.100 en Nasdaq impulsado por growth en LatAm',
            summary: 'La empresa tecnológica argentina continúa su expansión regional, con un crecimiento del 38% en el segmento de pagos digitales y nuevos récords en unidades de negocio de crédito.',
            url: 'https://rava.com/meli',
            sentiment: 'positive', publishedAt: ago(190),
        },
        {
            id: 5005, source: 'Invertir Online',
            title: 'Informe semanal: estos son los 5 CEDEARs con mayor potencial alcista según analistas locales',
            summary: 'Morgan Stanley, JPMorgan, Broadcom, Alphabet y Bristol Myers Squibb encabezan el ranking de papeles recomendados para el cuarto trimestre.',
            url: 'https://invertironline.com/cedears',
            sentiment: 'neutral', publishedAt: ago(260),
        },
        {
            id: 5006, source: 'Bull Market Brokers',
            title: 'Sector bancario en la bolsa: Supervielle lidera las ganancias con un 9% semanal',
            summary: 'Los bancos argentinos muestran el mejor desempeño sectorial del Merval, beneficiados por la compresión de spreads y el aumento del crédito al sector privado.',
            url: 'https://bullmarketbrokers.com/bancos',
            sentiment: 'positive', publishedAt: ago(340),
        },
        {
            id: 5007, source: 'Rava Bursátil',
            title: 'Bolsas globales: S&P 500, Dow Jones y Nasdaq cierran semana en verde con ganancias de hasta 2%',
            summary: 'Los mercados internacionales respondieron positivamente a los datos de empleo y la postura conciliadora de la Reserva Federal en su última reunión de política monetaria.',
            url: 'https://rava.com/global',
            sentiment: 'positive', publishedAt: ago(420),
        },
        {
            id: 5008, source: 'Invertir Online',
            title: 'Análisis técnico del S&P 500: soporte en 5.400 y próximo objetivo en 5.800 si consolida el breakout',
            summary: 'El índice americano quebró resistencias clave y la estructura de largo plazo sugiere continuidad alcista, aunque los inversores monitorean de cerca los datos de actividad.',
            url: 'https://invertironline.com/sp500',
            sentiment: 'neutral', publishedAt: ago(500),
        },
    ],
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

export async function handleMockNews(path: string, _init?: RequestInit): Promise<Response | null> {
    if (!path.startsWith('/news')) return null;

    const qs = path.includes('?') ? new URLSearchParams(path.split('?')[1]) : new URLSearchParams();
    const category = (qs.get('category') || 'cripto').toLowerCase();

    const items = NEWS_DATA[category] ?? NEWS_DATA['cripto'];
    return json(items);
}
