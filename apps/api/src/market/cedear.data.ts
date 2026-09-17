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
    AAPL: { ticker: 'AAPL', name: 'Apple Inc.', underlyingTicker: 'AAPL', underlyingExchange: 'NASDAQ', ratio: 20, sector: 'Tecnología' },
    NVDA: { ticker: 'NVDA', name: 'NVIDIA Corp.', underlyingTicker: 'NVDA', underlyingExchange: 'NASDAQ', ratio: 24, sector: 'Semiconductores' },
    MELI: { ticker: 'MELI', name: 'MercadoLibre Inc.', underlyingTicker: 'MELI', underlyingExchange: 'NASDAQ', ratio: 120, sector: 'Comercio Electrónico' },
    MSFT: { ticker: 'MSFT', name: 'Microsoft Corp.', underlyingTicker: 'MSFT', underlyingExchange: 'NASDAQ', ratio: 30, sector: 'Software' },
    AMZN: { ticker: 'AMZN', name: 'Amazon.com Inc.', underlyingTicker: 'AMZN', underlyingExchange: 'NASDAQ', ratio: 144, sector: 'Comercio Electrónico' },
    GOOGL: { ticker: 'GOOGL', name: 'Alphabet Inc. Cl A', underlyingTicker: 'GOOGL', underlyingExchange: 'NASDAQ', ratio: 58, sector: 'Tecnología' },
    TSLA: { ticker: 'TSLA', name: 'Tesla Inc.', underlyingTicker: 'TSLA', underlyingExchange: 'NASDAQ', ratio: 15, sector: 'Automotriz' },
    META: { ticker: 'META', name: 'Meta Platforms Inc.', underlyingTicker: 'META', underlyingExchange: 'NASDAQ', ratio: 24, sector: 'Redes Sociales' },
    SPY: { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', underlyingTicker: 'SPY', underlyingExchange: 'AMEX', ratio: 20, sector: 'ETF Índices' },
    QQQ: { ticker: 'QQQ', name: 'Invesco QQQ Trust', underlyingTicker: 'QQQ', underlyingExchange: 'NASDAQ', ratio: 20, sector: 'ETF Tecnología' },
    DIA: { ticker: 'DIA', name: 'SPDR Dow Jones Industrial ETF', underlyingTicker: 'DIA', underlyingExchange: 'AMEX', ratio: 20, sector: 'ETF Índices' },
    IWM: { ticker: 'IWM', name: 'iShares Russell 2000 ETF', underlyingTicker: 'IWM', underlyingExchange: 'AMEX', ratio: 10, sector: 'ETF Small Cap' },
    EEM: { ticker: 'EEM', name: 'iShares MSCI Emerging Markets', underlyingTicker: 'EEM', underlyingExchange: 'AMEX', ratio: 5, sector: 'ETF Emergentes' },
    XLE: { ticker: 'XLE', name: 'Energy Select Sector SPDR', underlyingTicker: 'XLE', underlyingExchange: 'AMEX', ratio: 2, sector: 'ETF Energía' },
    XLF: { ticker: 'XLF', name: 'Financial Select Sector SPDR', underlyingTicker: 'XLF', underlyingExchange: 'AMEX', ratio: 2, sector: 'ETF Financiero' },
    KO: { ticker: 'KO', name: 'The Coca-Cola Company', underlyingTicker: 'KO', underlyingExchange: 'NYSE', ratio: 5, sector: 'Consumo Masivo' },
    MCD: { ticker: 'MCD', name: 'McDonald\'s Corp.', underlyingTicker: 'MCD', underlyingExchange: 'NYSE', ratio: 24, sector: 'Restaurantes' },
    BBD: { ticker: 'BBD', name: 'Banco Bradesco S.A.', underlyingTicker: 'BBD', underlyingExchange: 'NYSE', ratio: 1, sector: 'Bancos' },
    VALE: { ticker: 'VALE', name: 'Vale S.A.', underlyingTicker: 'VALE', underlyingExchange: 'NYSE', ratio: 2, sector: 'Minería' },
    PBR: { ticker: 'PBR', name: 'Petróleo Brasileiro S.A.', underlyingTicker: 'PBR', underlyingExchange: 'NYSE', ratio: 1, sector: 'Petróleo' },
    V: { ticker: 'V', name: 'Visa Inc.', underlyingTicker: 'V', underlyingExchange: 'NYSE', ratio: 18, sector: 'Pagos Digitales' },
    WMT: { ticker: 'WMT', name: 'Walmart Inc.', underlyingTicker: 'WMT', underlyingExchange: 'NYSE', ratio: 18, sector: 'Retail' },
    DIS: { ticker: 'DIS', name: 'The Walt Disney Company', underlyingTicker: 'DIS', underlyingExchange: 'NYSE', ratio: 12, sector: 'Entretenimiento' },
    JNJ: { ticker: 'JNJ', name: 'Johnson & Johnson', underlyingTicker: 'JNJ', underlyingExchange: 'NYSE', ratio: 15, sector: 'Salud' },
    JPM: { ticker: 'JPM', name: 'JPMorgan Chase & Co.', underlyingTicker: 'JPM', underlyingExchange: 'NYSE', ratio: 15, sector: 'Bancos' },
    BA: { ticker: 'BA', name: 'The Boeing Company', underlyingTicker: 'BA', underlyingExchange: 'NYSE', ratio: 6, sector: 'Aeroespacial' },
    BABA: { ticker: 'BABA', name: 'Alibaba Group Holding Ltd.', underlyingTicker: 'BABA', underlyingExchange: 'NYSE', ratio: 9, sector: 'Comercio Electrónico' },
    PLTR: { ticker: 'PLTR', name: 'Palantir Technologies Inc.', underlyingTicker: 'PLTR', underlyingExchange: 'NYSE', ratio: 1, sector: 'Tecnología' },
    AMD: { ticker: 'AMD', name: 'Advanced Micro Devices', underlyingTicker: 'AMD', underlyingExchange: 'NASDAQ', ratio: 10, sector: 'Semiconductores' },
    INTC: { ticker: 'INTC', name: 'Intel Corp.', underlyingTicker: 'INTC', underlyingExchange: 'NASDAQ', ratio: 5, sector: 'Semiconductores' },
    NFLX: { ticker: 'NFLX', name: 'Netflix Inc.', underlyingTicker: 'NFLX', underlyingExchange: 'NASDAQ', ratio: 48, sector: 'Entretenimiento' },
    PYPL: { ticker: 'PYPL', name: 'PayPal Holdings Inc.', underlyingTicker: 'PYPL', underlyingExchange: 'NASDAQ', ratio: 8, sector: 'Fintech' },
    COIN: { ticker: 'COIN', name: 'Coinbase Global Inc.', underlyingTicker: 'COIN', underlyingExchange: 'NASDAQ', ratio: 26, sector: 'Cripto' },
    NKE: { ticker: 'NKE', name: 'Nike Inc.', underlyingTicker: 'NKE', underlyingExchange: 'NYSE', ratio: 6, sector: 'Consumo' },
    PFE: { ticker: 'PFE', name: 'Pfizer Inc.', underlyingTicker: 'PFE', underlyingExchange: 'NYSE', ratio: 4, sector: 'Farmacéutica' },
    XOM: { ticker: 'XOM', name: 'Exxon Mobil Corp.', underlyingTicker: 'XOM', underlyingExchange: 'NYSE', ratio: 10, sector: 'Energía' },
    CVX: { ticker: 'CVX', name: 'Chevron Corp.', underlyingTicker: 'CVX', underlyingExchange: 'NYSE', ratio: 16, sector: 'Energía' },
    DESP: { ticker: 'DESP', name: 'Despegar.com Corp.', underlyingTicker: 'DESP', underlyingExchange: 'NYSE', ratio: 1, sector: 'Turismo' },
    GLOB: { ticker: 'GLOB', name: 'Globant S.A.', underlyingTicker: 'GLOB', underlyingExchange: 'NYSE', ratio: 18, sector: 'Tecnología' },
    BIOX: { ticker: 'BIOX', name: 'Bioceres Crop Solutions', underlyingTicker: 'BIOX', underlyingExchange: 'NASDAQ', ratio: 1, sector: 'Agrotech' },
    VIST: { ticker: 'VIST', name: 'Vista Energy S.A.B.', underlyingTicker: 'VIST', underlyingExchange: 'NYSE', ratio: 3, sector: 'Energía' },
    TS: { ticker: 'TS', name: 'Tenaris S.A.', underlyingTicker: 'TS', underlyingExchange: 'NYSE', ratio: 1, sector: 'Siderurgia' },
};

export function getCedearDefinition(tickerOrSymbol: string): CedearDefinition | null {
    if (!tickerOrSymbol) return null;
    let clean = tickerOrSymbol.toUpperCase().trim();
    if (clean.startsWith('BCBA:')) {
        clean = clean.replace('BCBA:', '');
    }
    return CEDEAR_REGISTRY[clean] || null;
}
