export interface CedearDefinition {
    ticker: string;          // BYMA Ticker (e.g. AAPL)
    name: string;            // Company Name
    underlyingTicker: string;// US Underlying (e.g. AAPL)
    underlyingExchange: string; // NASDAQ / NYSE / AMEX
    ratio: number;           // Conversion ratio (e.g. 20 means 20 CEDEARs = 1 US share)
    sector?: string;
}

/**
 * Official BYMA CEDEARs list with conversion ratios (Ratios oficiales vigentes).
 * 1 Acción Subyacente = N CEDEARs (ratio N:1)
 */
export const CEDEAR_REGISTRY: Record<string, CedearDefinition> = {
    // Top Tech & Mega Caps
    AAPL: { ticker: 'AAPL', name: 'Apple Inc.', underlyingTicker: 'AAPL', underlyingExchange: 'NASDAQ', ratio: 20, sector: 'Tecnología' },
    NVDA: { ticker: 'NVDA', name: 'NVIDIA Corp.', underlyingTicker: 'NVDA', underlyingExchange: 'NASDAQ', ratio: 24, sector: 'Semiconductores' },
    MELI: { ticker: 'MELI', name: 'MercadoLibre Inc.', underlyingTicker: 'MELI', underlyingExchange: 'NASDAQ', ratio: 120, sector: 'Comercio Electrónico' },
    MSFT: { ticker: 'MSFT', name: 'Microsoft Corp.', underlyingTicker: 'MSFT', underlyingExchange: 'NASDAQ', ratio: 30, sector: 'Software' },
    AMZN: { ticker: 'AMZN', name: 'Amazon.com Inc.', underlyingTicker: 'AMZN', underlyingExchange: 'NASDAQ', ratio: 144, sector: 'Comercio Electrónico' },
    GOOGL: { ticker: 'GOOGL', name: 'Alphabet Inc. Cl A', underlyingTicker: 'GOOGL', underlyingExchange: 'NASDAQ', ratio: 58, sector: 'Tecnología' },
    GOOG: { ticker: 'GOOG', name: 'Alphabet Inc. Cl C', underlyingTicker: 'GOOG', underlyingExchange: 'NASDAQ', ratio: 58, sector: 'Tecnología' },
    TSLA: { ticker: 'TSLA', name: 'Tesla Inc.', underlyingTicker: 'TSLA', underlyingExchange: 'NASDAQ', ratio: 15, sector: 'Automotriz' },
    META: { ticker: 'META', name: 'Meta Platforms Inc.', underlyingTicker: 'META', underlyingExchange: 'NASDAQ', ratio: 24, sector: 'Redes Sociales' },
    
    // ETFs
    SPY: { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', underlyingTicker: 'SPY', underlyingExchange: 'AMEX', ratio: 20, sector: 'ETF Índices' },
    QQQ: { ticker: 'QQQ', name: 'Invesco QQQ Trust', underlyingTicker: 'QQQ', underlyingExchange: 'NASDAQ', ratio: 20, sector: 'ETF Tecnología' },
    DIA: { ticker: 'DIA', name: 'SPDR Dow Jones Industrial ETF', underlyingTicker: 'DIA', underlyingExchange: 'AMEX', ratio: 20, sector: 'ETF Índices' },
    IWM: { ticker: 'IWM', name: 'iShares Russell 2000 ETF', underlyingTicker: 'IWM', underlyingExchange: 'AMEX', ratio: 10, sector: 'ETF Small Cap' },
    EEM: { ticker: 'EEM', name: 'iShares MSCI Emerging Markets', underlyingTicker: 'EEM', underlyingExchange: 'AMEX', ratio: 5, sector: 'ETF Emergentes' },
    XLE: { ticker: 'XLE', name: 'Energy Select Sector SPDR', underlyingTicker: 'XLE', underlyingExchange: 'AMEX', ratio: 2, sector: 'ETF Energía' },
    XLF: { ticker: 'XLF', name: 'Financial Select Sector SPDR', underlyingTicker: 'XLF', underlyingExchange: 'AMEX', ratio: 2, sector: 'ETF Financiero' },
    ARKK: { ticker: 'ARKK', name: 'ARK Innovation ETF', underlyingTicker: 'ARKK', underlyingExchange: 'AMEX', ratio: 10, sector: 'ETF Innovación' },
    IBIT: { ticker: 'IBIT', name: 'iShares Bitcoin Trust ETF', underlyingTicker: 'IBIT', underlyingExchange: 'NASDAQ', ratio: 1, sector: 'ETF Cripto' },

    // Semiconductors & Hardware
    AMD: { ticker: 'AMD', name: 'Advanced Micro Devices', underlyingTicker: 'AMD', underlyingExchange: 'NASDAQ', ratio: 10, sector: 'Semiconductores' },
    INTC: { ticker: 'INTC', name: 'Intel Corp.', underlyingTicker: 'INTC', underlyingExchange: 'NASDAQ', ratio: 5, sector: 'Semiconductores' },
    TSM: { ticker: 'TSM', name: 'Taiwan Semiconductor Mfg.', underlyingTicker: 'TSM', underlyingExchange: 'NYSE', ratio: 9, sector: 'Semiconductores' },
    AVGO: { ticker: 'AVGO', name: 'Broadcom Inc.', underlyingTicker: 'AVGO', underlyingExchange: 'NASDAQ', ratio: 1, sector: 'Semiconductores' },
    QCOM: { ticker: 'QCOM', name: 'Qualcomm Inc.', underlyingTicker: 'QCOM', underlyingExchange: 'NASDAQ', ratio: 11, sector: 'Semiconductores' },
    MU: { ticker: 'MU', name: 'Micron Technology Inc.', underlyingTicker: 'MU', underlyingExchange: 'NASDAQ', ratio: 3, sector: 'Semiconductores' },
    ARM: { ticker: 'ARM', name: 'Arm Holdings plc', underlyingTicker: 'ARM', underlyingExchange: 'NASDAQ', ratio: 4, sector: 'Semiconductores' },

    // Consumer & Retail
    KO: { ticker: 'KO', name: 'The Coca-Cola Company', underlyingTicker: 'KO', underlyingExchange: 'NYSE', ratio: 5, sector: 'Consumo Masivo' },
    PEP: { ticker: 'PEP', name: 'PepsiCo Inc.', underlyingTicker: 'PEP', underlyingExchange: 'NASDAQ', ratio: 6, sector: 'Consumo Masivo' },
    MCD: { ticker: 'MCD', name: 'McDonald\'s Corp.', underlyingTicker: 'MCD', underlyingExchange: 'NYSE', ratio: 24, sector: 'Restaurantes' },
    SBUX: { ticker: 'SBUX', name: 'Starbucks Corp.', underlyingTicker: 'SBUX', underlyingExchange: 'NASDAQ', ratio: 6, sector: 'Restaurantes' },
    WMT: { ticker: 'WMT', name: 'Walmart Inc.', underlyingTicker: 'WMT', underlyingExchange: 'NYSE', ratio: 18, sector: 'Retail' },
    COST: { ticker: 'COST', name: 'Costco Wholesale Corp.', underlyingTicker: 'COST', underlyingExchange: 'NASDAQ', ratio: 48, sector: 'Retail' },
    PG: { ticker: 'PG', name: 'Procter & Gamble Co.', underlyingTicker: 'PG', underlyingExchange: 'NYSE', ratio: 15, sector: 'Consumo' },
    NKE: { ticker: 'NKE', name: 'Nike Inc.', underlyingTicker: 'NKE', underlyingExchange: 'NYSE', ratio: 6, sector: 'Consumo' },
    HD: { ticker: 'HD', name: 'The Home Depot Inc.', underlyingTicker: 'HD', underlyingExchange: 'NYSE', ratio: 15, sector: 'Retail' },
    MDLZ: { ticker: 'MDLZ', name: 'Mondelez International Inc.', underlyingTicker: 'MDLZ', underlyingExchange: 'NASDAQ', ratio: 6, sector: 'Consumo' },

    // Digital & Software
    NFLX: { ticker: 'NFLX', name: 'Netflix Inc.', underlyingTicker: 'NFLX', underlyingExchange: 'NASDAQ', ratio: 48, sector: 'Entretenimiento' },
    DIS: { ticker: 'DIS', name: 'The Walt Disney Company', underlyingTicker: 'DIS', underlyingExchange: 'NYSE', ratio: 12, sector: 'Entretenimiento' },
    SPOT: { ticker: 'SPOT', name: 'Spotify Technology S.A.', underlyingTicker: 'SPOT', underlyingExchange: 'NYSE', ratio: 24, sector: 'Streaming' },
    UBER: { ticker: 'UBER', name: 'Uber Technologies Inc.', underlyingTicker: 'UBER', underlyingExchange: 'NYSE', ratio: 5, sector: 'Movilidad' },
    ABNB: { ticker: 'ABNB', name: 'Airbnb Inc.', underlyingTicker: 'ABNB', underlyingExchange: 'NASDAQ', ratio: 15, sector: 'Turismo' },
    BKNG: { ticker: 'BKNG', name: 'Booking Holdings Inc.', underlyingTicker: 'BKNG', underlyingExchange: 'NASDAQ', ratio: 180, sector: 'Turismo' },
    CRM: { ticker: 'CRM', name: 'Salesforce Inc.', underlyingTicker: 'CRM', underlyingExchange: 'NYSE', ratio: 16, sector: 'Software' },
    ORCL: { ticker: 'ORCL', name: 'Oracle Corp.', underlyingTicker: 'ORCL', underlyingExchange: 'NYSE', ratio: 10, sector: 'Software' },
    ADBE: { ticker: 'ADBE', name: 'Adobe Inc.', underlyingTicker: 'ADBE', underlyingExchange: 'NASDAQ', ratio: 22, sector: 'Software' },
    CSCO: { ticker: 'CSCO', name: 'Cisco Systems Inc.', underlyingTicker: 'CSCO', underlyingExchange: 'NASDAQ', ratio: 5, sector: 'Redes' },
    IBM: { ticker: 'IBM', name: 'International Business Machines', underlyingTicker: 'IBM', underlyingExchange: 'NYSE', ratio: 5, sector: 'Tecnología' },
    PLTR: { ticker: 'PLTR', name: 'Palantir Technologies Inc.', underlyingTicker: 'PLTR', underlyingExchange: 'NYSE', ratio: 1, sector: 'Tecnología' },
    SNOW: { ticker: 'SNOW', name: 'Snowflake Inc.', underlyingTicker: 'SNOW', underlyingExchange: 'NYSE', ratio: 15, sector: 'Cloud' },
    SHOP: { ticker: 'SHOP', name: 'Shopify Inc.', underlyingTicker: 'SHOP', underlyingExchange: 'NYSE', ratio: 10, sector: 'E-commerce' },
    BABA: { ticker: 'BABA', name: 'Alibaba Group Holding Ltd.', underlyingTicker: 'BABA', underlyingExchange: 'NYSE', ratio: 9, sector: 'Comercio Electrónico' },

    // Financials & Fintech
    V: { ticker: 'V', name: 'Visa Inc.', underlyingTicker: 'V', underlyingExchange: 'NYSE', ratio: 18, sector: 'Pagos Digitales' },
    MA: { ticker: 'MA', name: 'Mastercard Inc.', underlyingTicker: 'MA', underlyingExchange: 'NYSE', ratio: 33, sector: 'Pagos Digitales' },
    PYPL: { ticker: 'PYPL', name: 'PayPal Holdings Inc.', underlyingTicker: 'PYPL', underlyingExchange: 'NASDAQ', ratio: 8, sector: 'Fintech' },
    COIN: { ticker: 'COIN', name: 'Coinbase Global Inc.', underlyingTicker: 'COIN', underlyingExchange: 'NASDAQ', ratio: 26, sector: 'Cripto' },
    MSTR: { ticker: 'MSTR', name: 'MicroStrategy Inc.', underlyingTicker: 'MSTR', underlyingExchange: 'NASDAQ', ratio: 18, sector: 'Fintech' },
    JPM: { ticker: 'JPM', name: 'JPMorgan Chase & Co.', underlyingTicker: 'JPM', underlyingExchange: 'NYSE', ratio: 15, sector: 'Bancos' },
    BAC: { ticker: 'BAC', name: 'Bank of America Corp.', underlyingTicker: 'BAC', underlyingExchange: 'NYSE', ratio: 4, sector: 'Bancos' },
    WFC: { ticker: 'WFC', name: 'Wells Fargo & Co.', underlyingTicker: 'WFC', underlyingExchange: 'NYSE', ratio: 5, sector: 'Bancos' },
    C: { ticker: 'C', name: 'Citigroup Inc.', underlyingTicker: 'C', underlyingExchange: 'NYSE', ratio: 6, sector: 'Bancos' },
    GS: { ticker: 'GS', name: 'The Goldman Sachs Group Inc.', underlyingTicker: 'GS', underlyingExchange: 'NYSE', ratio: 26, sector: 'Bancos' },
    MS: { ticker: 'MS', name: 'Morgan Stanley', underlyingTicker: 'MS', underlyingExchange: 'NYSE', ratio: 10, sector: 'Bancos' },
    BLK: { ticker: 'BLK', name: 'BlackRock Inc.', underlyingTicker: 'BLK', underlyingExchange: 'NYSE', ratio: 60, sector: 'Gestión de Activos' },
    BBD: { ticker: 'BBD', name: 'Banco Bradesco S.A.', underlyingTicker: 'BBD', underlyingExchange: 'NYSE', ratio: 1, sector: 'Bancos' },

    // Energy & Commodities
    XOM: { ticker: 'XOM', name: 'Exxon Mobil Corp.', underlyingTicker: 'XOM', underlyingExchange: 'NYSE', ratio: 10, sector: 'Energía' },
    CVX: { ticker: 'CVX', name: 'Chevron Corp.', underlyingTicker: 'CVX', underlyingExchange: 'NYSE', ratio: 16, sector: 'Energía' },
    PBR: { ticker: 'PBR', name: 'Petróleo Brasileiro S.A.', underlyingTicker: 'PBR', underlyingExchange: 'NYSE', ratio: 1, sector: 'Petróleo' },
    VIST: { ticker: 'VIST', name: 'Vista Energy S.A.B.', underlyingTicker: 'VIST', underlyingExchange: 'NYSE', ratio: 3, sector: 'Energía' },
    TS: { ticker: 'TS', name: 'Tenaris S.A.', underlyingTicker: 'TS', underlyingExchange: 'NYSE', ratio: 1, sector: 'Siderurgia' },
    VALE: { ticker: 'VALE', name: 'Vale S.A.', underlyingTicker: 'VALE', underlyingExchange: 'NYSE', ratio: 2, sector: 'Minería' },
    GOLD: { ticker: 'GOLD', name: 'Barrick Gold Corp.', underlyingTicker: 'GOLD', underlyingExchange: 'NYSE', ratio: 1, sector: 'Oro y Minería' },
    NEM: { ticker: 'NEM', name: 'Newmont Corp.', underlyingTicker: 'NEM', underlyingExchange: 'NYSE', ratio: 3, sector: 'Oro y Minería' },
    FCX: { ticker: 'FCX', name: 'Freeport-McMoRan Inc.', underlyingTicker: 'FCX', underlyingExchange: 'NYSE', ratio: 3, sector: 'Minería' },
    SLB: { ticker: 'SLB', name: 'Schlumberger Ltd.', underlyingTicker: 'SLB', underlyingExchange: 'NYSE', ratio: 6, sector: 'Servicios Petroleros' },
    BP: { ticker: 'BP', name: 'BP p.l.c.', underlyingTicker: 'BP', underlyingExchange: 'NYSE', ratio: 5, sector: 'Petróleo' },

    // Healthcare & Pharma
    JNJ: { ticker: 'JNJ', name: 'Johnson & Johnson', underlyingTicker: 'JNJ', underlyingExchange: 'NYSE', ratio: 15, sector: 'Salud' },
    PFE: { ticker: 'PFE', name: 'Pfizer Inc.', underlyingTicker: 'PFE', underlyingExchange: 'NYSE', ratio: 4, sector: 'Farmacéutica' },
    LLY: { ticker: 'LLY', name: 'Eli Lilly and Company', underlyingTicker: 'LLY', underlyingExchange: 'NYSE', ratio: 80, sector: 'Farmacéutica' },
    UNH: { ticker: 'UNH', name: 'UnitedHealth Group Inc.', underlyingTicker: 'UNH', underlyingExchange: 'NYSE', ratio: 33, sector: 'Salud' },
    ABT: { ticker: 'ABT', name: 'Abbott Laboratories', underlyingTicker: 'ABT', underlyingExchange: 'NYSE', ratio: 6, sector: 'Salud' },
    MRK: { ticker: 'MRK', name: 'Merck & Co. Inc.', underlyingTicker: 'MRK', underlyingExchange: 'NYSE', ratio: 5, sector: 'Farmacéutica' },
    BMY: { ticker: 'BMY', name: 'Bristol-Myers Squibb', underlyingTicker: 'BMY', underlyingExchange: 'NYSE', ratio: 3, sector: 'Farmacéutica' },

    // Industrials & Aerospace
    BA: { ticker: 'BA', name: 'The Boeing Company', underlyingTicker: 'BA', underlyingExchange: 'NYSE', ratio: 6, sector: 'Aeroespacial' },
    CAT: { ticker: 'CAT', name: 'Caterpillar Inc.', underlyingTicker: 'CAT', underlyingExchange: 'NYSE', ratio: 20, sector: 'Maquinaria' },
    GE: { ticker: 'GE', name: 'General Electric Co.', underlyingTicker: 'GE', underlyingExchange: 'NYSE', ratio: 10, sector: 'Industria' },
    DE: { ticker: 'DE', name: 'Deere & Company', underlyingTicker: 'DE', underlyingExchange: 'NYSE', ratio: 20, sector: 'Maquinaria Agrícola' },
    LMT: { ticker: 'LMT', name: 'Lockheed Martin Corp.', underlyingTicker: 'LMT', underlyingExchange: 'NYSE', ratio: 20, sector: 'Defensa' },

    // Argentina ADRs with CEDEARs or local listings
    DESP: { ticker: 'DESP', name: 'Despegar.com Corp.', underlyingTicker: 'DESP', underlyingExchange: 'NYSE', ratio: 1, sector: 'Turismo' },
    GLOB: { ticker: 'GLOB', name: 'Globant S.A.', underlyingTicker: 'GLOB', underlyingExchange: 'NYSE', ratio: 18, sector: 'Tecnología' },
    BIOX: { ticker: 'BIOX', name: 'Bioceres Crop Solutions', underlyingTicker: 'BIOX', underlyingExchange: 'NASDAQ', ratio: 1, sector: 'Agrotech' },
    CAAP: { ticker: 'CAAP', name: 'Corporación América Airports', underlyingTicker: 'CAAP', underlyingExchange: 'NYSE', ratio: 1, sector: 'Aeropuertos' },

    // Crypto Miners
    BITF: { ticker: 'BITF', name: 'Bitfarms Ltd.', underlyingTicker: 'BITF', underlyingExchange: 'NASDAQ', ratio: 1, sector: 'Minería Cripto' },
    HUT: { ticker: 'HUT', name: 'Hut 8 Corp.', underlyingTicker: 'HUT', underlyingExchange: 'NASDAQ', ratio: 1, sector: 'Minería Cripto' },
    HIVE: { ticker: 'HIVE', name: 'HIVE Digital Technologies', underlyingTicker: 'HIVE', underlyingExchange: 'NASDAQ', ratio: 1, sector: 'Minería Cripto' },
};

export function getCedearDefinition(tickerOrSymbol: string): CedearDefinition | null {
    if (!tickerOrSymbol) return null;
    let clean = tickerOrSymbol.toUpperCase().trim();
    if (clean.startsWith('BCBA:')) {
        clean = clean.replace('BCBA:', '');
    }
    if (clean.startsWith('BYMA:')) {
        clean = clean.replace('BYMA:', '');
    }
    return CEDEAR_REGISTRY[clean] || null;
}
