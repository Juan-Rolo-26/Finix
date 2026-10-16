export function resolveTradingViewSymbol(rawSymbol?: string): string {
    if (!rawSymbol) return 'NASDAQ:AAPL';
    const clean = rawSymbol.trim().toUpperCase().replace('$', '');

    const legacyEtfs: Record<string, string> = { SPY: 'AMEX:SPY', DIA: 'AMEX:DIA', IWM: 'AMEX:IWM', VOO: 'AMEX:VOO', IVV: 'AMEX:IVV', VTI: 'AMEX:VTI' };
    const [exchange, ticker] = clean.split(':');
    if (ticker && ['NYSE', 'NYSEARCA', 'NASDAQ'].includes(exchange) && legacyEtfs[ticker]) return legacyEtfs[ticker];
    if (clean.includes(':')) return clean;

    const cryptoMap: Record<string, string> = {
        BNBUSDT: 'BINANCE:BNBUSDT', XRPUSDT: 'BINANCE:XRPUSDT', ADAUSDT: 'BINANCE:ADAUSDT', DOGEUSDT: 'BINANCE:DOGEUSDT', AVAX: 'BINANCE:AVAXUSDT', AVAXUSDT: 'BINANCE:AVAXUSDT',
        BTC: 'BINANCE:BTCUSDT',
        BTCUSDT: 'BINANCE:BTCUSDT',
        ETH: 'BINANCE:ETHUSDT',
        ETHUSDT: 'BINANCE:ETHUSDT',
        SOL: 'BINANCE:SOLUSDT',
        SOLUSDT: 'BINANCE:SOLUSDT',
        BNB: 'BINANCE:BNBUSDT',
        XRP: 'BINANCE:XRPUSDT',
        ADA: 'BINANCE:ADAUSDT',
        DOGE: 'BINANCE:DOGEUSDT',
    };
    if (cryptoMap[clean]) return cryptoMap[clean];

    const etfMap: Record<string, string> = {
        SPY: 'AMEX:SPY',
        QQQ: 'NASDAQ:QQQ',
        DIA: 'AMEX:DIA',
        IWM: 'AMEX:IWM',
        VOO: 'AMEX:VOO',
        IVV: 'AMEX:IVV',
        VTI: 'AMEX:VTI',
    };
    if (etfMap[clean]) return etfMap[clean];

    const argMap: Record<string, string> = {
        GGAL: 'NASDAQ:GGAL',
        YPF: 'NYSE:YPF',
        YPFD: 'BCBA:YPFD',
        BMA: 'NYSE:BMA',
        PAMP: 'NYSE:PAM',
        ALUA: 'BCBA:ALUA',
        TXAR: 'BCBA:TXAR',
        MELI: 'NASDAQ:MELI',
    };
    if (argMap[clean]) return argMap[clean];

    const nyse = new Set(['KO', 'DIS', 'JNJ', 'JPM', 'V', 'MA', 'WMT', 'PG', 'HD', 'CVX', 'XOM', 'BAC', 'NKE', 'MCD', 'IBM']);
    if (nyse.has(clean)) return `NYSE:${clean}`;

    return `NASDAQ:${clean}`;
}

