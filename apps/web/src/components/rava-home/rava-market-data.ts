export interface MarketTickerRow {
    symbol: string;
    name?: string;
    last: number | string;
    dayChangePct?: number | null;
    monthChangePct?: number | null;
    yearChangePct?: number | null;
    currency?: 'ARS' | 'USD';
    unit?: string;
    updatedAt?: string;
}

export interface TechnicalSignalRow {
    symbol: string;
    date: string;
    type: 'Compra' | 'Venta';
    price: number;
}

export interface BalanceReportRow {
    symbol: string;
    date: string;
    previousYear: number | string;
    estimated: number | string;
    actual: number | string;
}

export interface CorporateBondRow {
    symbol: string;
    name: string;
    maturity: string;
    last: number;
    parity: number;
    tir: number;
    volume: number;
    dayChangePct: number;
}

export interface HeatmapTile {
    symbol: string;
    changePct: number;
    weight: number;
    category?: string;
}

// ─── DÓLARES ────────────────────────────────────────────────────────────────
export const DEFAULT_DOLLARS: MarketTickerRow[] = [
    { symbol: 'BLUE', last: 1560.0, dayChangePct: 0.0, monthChangePct: 1.8, yearChangePct: 6.2 },
    { symbol: 'MEP (BOLSA)', last: 1565.70, dayChangePct: 0.4, monthChangePct: 1.3, yearChangePct: 5.5 },
    { symbol: 'CCL', last: 1652.40, dayChangePct: 1.1, monthChangePct: 2.3, yearChangePct: 8.7 },
    { symbol: 'OFICIAL', last: 1560.0, dayChangePct: -0.04, monthChangePct: 1.3, yearChangePct: 5.4 },
    { symbol: 'MAYORISTA', last: 1536.0, dayChangePct: -0.06, monthChangePct: 1.4, yearChangePct: 5.6 },
    { symbol: 'TARJETA', last: 2028.0, dayChangePct: 0.0, monthChangePct: 1.3, yearChangePct: 5.4 },
    { symbol: 'CRIPTO', last: 1651.94, dayChangePct: 0.11, monthChangePct: 2.4, yearChangePct: 8.2 },
];

// ─── ACCIONES / ETFS EE. UU. (TABS) ──────────────────────────────────────────
export const US_STOCKS_DATA: Record<string, MarketTickerRow[]> = {
    principal: [
        { symbol: 'NVDA', last: 141.50, dayChangePct: 1.2, monthChangePct: 12.4, yearChangePct: 185.0 },
        { symbol: 'AAPL', last: 232.40, dayChangePct: 0.2, monthChangePct: 4.8, yearChangePct: 35.2 },
        { symbol: 'MSFT', last: 428.15, dayChangePct: -0.4, monthChangePct: 2.1, yearChangePct: 22.8 },
        { symbol: 'AMZN', last: 187.60, dayChangePct: -0.3, monthChangePct: 5.2, yearChangePct: 38.6 },
        { symbol: 'GOOGL', last: 169.80, dayChangePct: 0.8, monthChangePct: 3.5, yearChangePct: 29.4 },
        { symbol: 'META', last: 582.10, dayChangePct: 0.5, monthChangePct: 8.1, yearChangePct: 92.3 },
        { symbol: 'TSLA', last: 260.40, dayChangePct: -1.1, monthChangePct: 14.6, yearChangePct: -9.4 },
        { symbol: 'SPY', last: 581.20, dayChangePct: 0.1, monthChangePct: 2.3, yearChangePct: 24.5 },
        { symbol: 'QQQ', last: 495.30, dayChangePct: 0.3, monthChangePct: 3.1, yearChangePct: 28.2 },
        { symbol: 'AVGO', last: 178.90, dayChangePct: 1.8, monthChangePct: 11.2, yearChangePct: 88.4 },
        { symbol: 'AMD', last: 156.40, dayChangePct: 1.5, monthChangePct: 6.8, yearChangePct: 42.0 },
        { symbol: 'NFLX', last: 754.20, dayChangePct: 0.8, monthChangePct: 9.2, yearChangePct: 84.5 },
    ],
    dow30: [
        { symbol: 'JPM', last: 224.50, dayChangePct: 1.4, monthChangePct: 6.1, yearChangePct: 42.1 },
        { symbol: 'PG', last: 172.30, dayChangePct: 0.2, monthChangePct: 1.8, yearChangePct: 18.5 },
        { symbol: 'UNH', last: 588.40, dayChangePct: 0.9, monthChangePct: 4.2, yearChangePct: 15.2 },
        { symbol: 'HD', last: 395.20, dayChangePct: -0.5, monthChangePct: 2.8, yearChangePct: 26.4 },
        { symbol: 'V', last: 284.10, dayChangePct: 0.3, monthChangePct: 3.9, yearChangePct: 20.1 },
        { symbol: 'DIS', last: 96.50, dayChangePct: -0.8, monthChangePct: 1.2, yearChangePct: 14.0 },
        { symbol: 'KO', last: 67.80, dayChangePct: 0.3, monthChangePct: 2.1, yearChangePct: 16.5 },
        { symbol: 'CSCO', last: 56.40, dayChangePct: 0.1, monthChangePct: 4.0, yearChangePct: 8.9 },
        { symbol: 'BA', last: 154.20, dayChangePct: -1.5, monthChangePct: -4.2, yearChangePct: -28.0 },
        { symbol: 'CAT', last: 388.10, dayChangePct: 0.7, monthChangePct: 5.4, yearChangePct: 51.2 },
        { symbol: 'MCD', last: 298.40, dayChangePct: -0.2, monthChangePct: 3.1, yearChangePct: 12.4 },
        { symbol: 'IBM', last: 215.20, dayChangePct: 0.4, monthChangePct: 4.6, yearChangePct: 48.0 },
    ],
    etfs: [
        { symbol: 'SPY', last: 581.20, dayChangePct: 0.1, monthChangePct: 2.3, yearChangePct: 24.5 },
        { symbol: 'QQQ', last: 495.30, dayChangePct: 0.3, monthChangePct: 3.1, yearChangePct: 28.2 },
        { symbol: 'DIA', last: 423.80, dayChangePct: 0.2, monthChangePct: 1.9, yearChangePct: 19.8 },
        { symbol: 'IWM', last: 221.50, dayChangePct: 0.7, monthChangePct: 4.8, yearChangePct: 21.3 },
        { symbol: 'XLF', last: 47.90, dayChangePct: 1.1, monthChangePct: 5.2, yearChangePct: 34.2 },
        { symbol: 'XLK', last: 231.40, dayChangePct: 0.4, monthChangePct: 3.8, yearChangePct: 27.6 },
        { symbol: 'GLD', last: 253.20, dayChangePct: 0.8, monthChangePct: 6.4, yearChangePct: 38.5 },
        { symbol: 'SLV', last: 31.40, dayChangePct: 1.5, monthChangePct: 8.9, yearChangePct: 44.2 },
        { symbol: 'ARKK', last: 48.20, dayChangePct: 2.1, monthChangePct: 10.4, yearChangePct: 24.1 },
        { symbol: 'SMH', last: 254.80, dayChangePct: 1.4, monthChangePct: 9.1, yearChangePct: 74.0 },
    ],
    adrs: [
        { symbol: 'GGAL', last: 48.90, dayChangePct: 2.1, monthChangePct: 14.5, yearChangePct: 162.0 },
        { symbol: 'YPF', last: 27.40, dayChangePct: 1.8, monthChangePct: 8.2, yearChangePct: 115.4 },
        { symbol: 'BMA', last: 74.20, dayChangePct: 1.5, monthChangePct: 12.1, yearChangePct: 140.2 },
        { symbol: 'PAM', last: 62.80, dayChangePct: 0.9, monthChangePct: 6.8, yearChangePct: 85.3 },
        { symbol: 'MELI', last: 2045.0, dayChangePct: 0.6, monthChangePct: 5.4, yearChangePct: 46.2 },
        { symbol: 'GLOB', last: 182.50, dayChangePct: -0.4, monthChangePct: 3.2, yearChangePct: 8.5 },
        { symbol: 'CEPU', last: 12.80, dayChangePct: 0.5, monthChangePct: 4.9, yearChangePct: 78.4 },
        { symbol: 'CRESY', last: 11.40, dayChangePct: -0.2, monthChangePct: 2.1, yearChangePct: 45.0 },
        { symbol: 'SUPV', last: 9.45, dayChangePct: -1.2, monthChangePct: 11.4, yearChangePct: 154.0 },
        { symbol: 'EDN', last: 21.80, dayChangePct: 0.4, monthChangePct: 8.9, yearChangePct: 92.0 },
        { symbol: 'TGS', last: 23.40, dayChangePct: 0.8, monthChangePct: 5.6, yearChangePct: 88.5 },
        { symbol: 'VIST', last: 52.10, dayChangePct: 1.7, monthChangePct: 7.8, yearChangePct: 98.4 },
    ],
    varias: [
        { symbol: 'AMD', last: 156.40, dayChangePct: 1.5, monthChangePct: 6.8, yearChangePct: 42.0 },
        { symbol: 'NFLX', last: 754.20, dayChangePct: 0.8, monthChangePct: 9.2, yearChangePct: 84.5 },
        { symbol: 'INTC', last: 22.80, dayChangePct: -1.2, monthChangePct: -3.4, yearChangePct: -38.2 },
        { symbol: 'PLTR', last: 44.80, dayChangePct: 2.8, monthChangePct: 18.2, yearChangePct: 165.0 },
        { symbol: 'COIN', last: 218.40, dayChangePct: 3.4, monthChangePct: 14.2, yearChangePct: 98.4 },
        { symbol: 'BABA', last: 98.50, dayChangePct: -0.6, monthChangePct: 8.5, yearChangePct: 14.2 },
        { symbol: 'PYPL', last: 81.20, dayChangePct: 0.4, monthChangePct: 6.2, yearChangePct: 38.0 },
        { symbol: 'CRM', last: 288.40, dayChangePct: 0.9, monthChangePct: 4.1, yearChangePct: 41.5 },
    ],
};

// ─── LO MEJOR DE ARGENTINA (TOP GAINERS) ────────────────────────────────────
export const TOP_GAINERS_ARG: MarketTickerRow[] = [
    { symbol: 'SEMI', last: 12.25, dayChangePct: 0.8 },
    { symbol: 'BOLT', last: 61.20, dayChangePct: 0.3 },
    { symbol: 'CRES', last: 1647.0, dayChangePct: -0.2 },
    { symbol: 'MORI', last: 20.30, dayChangePct: -0.5 },
    { symbol: 'BHIP', last: 221.0, dayChangePct: -0.9 },
    { symbol: 'IRSA', last: 2155.0, dayChangePct: -0.9 },
    { symbol: 'TXAR', last: 726.0, dayChangePct: -1.2 },
    { symbol: 'LOMA', last: 3000.0, dayChangePct: -1.2 },
    { symbol: 'VALO', last: 506.0, dayChangePct: -1.4 },
    { symbol: 'BMA', last: 9955.0, dayChangePct: -1.4 },
];

// ─── LO PEOR DE ARGENTINA (TOP LOSERS) ──────────────────────────────────────
export const TOP_LOSERS_ARG: MarketTickerRow[] = [
    { symbol: 'TGSU2', last: 7745.0, dayChangePct: -6.7 },
    { symbol: 'MIRG', last: 1780.0, dayChangePct: -5.1 },
    { symbol: 'AGRO', last: 27.20, dayChangePct: -4.9 },
    { symbol: 'CEPU', last: 1754.0, dayChangePct: -4.0 },
    { symbol: 'BYMA', last: 214.5, dayChangePct: -3.7 },
    { symbol: 'EDN', last: 1320.0, dayChangePct: -3.6 },
    { symbol: 'PAMP', last: 4767.5, dayChangePct: -3.5 },
    { symbol: 'TRAN', last: 2166.0, dayChangePct: -3.3 },
    { symbol: 'TECO2', last: 3535.0, dayChangePct: -3.3 },
    { symbol: 'SUPV', last: 2149.0, dayChangePct: -3.1 },
];

// ─── TREEMAP HEATMAPS ────────────────────────────────────────────────────────
export const LEADER_STOCKS_HEATMAP: HeatmapTile[] = [
    { symbol: 'GGAL', changePct: 1.25, weight: 28 },
    { symbol: 'YPFD', changePct: 1.50, weight: 26 },
    { symbol: 'PAMP', changePct: 0.85, weight: 18 },
    { symbol: 'ALUA', changePct: 0.40, weight: 15 },
    { symbol: 'TXAR', changePct: -0.20, weight: 14 },
    { symbol: 'BMA', changePct: 1.10, weight: 14 },
    { symbol: 'SUPV', changePct: -3.90, weight: 12 },
    { symbol: 'TRAN', changePct: -3.60, weight: 11 },
    { symbol: 'EDN', changePct: 0.70, weight: 10 },
    { symbol: 'CEPU', changePct: 0.60, weight: 10 },
    { symbol: 'CRES', changePct: -0.30, weight: 9 },
    { symbol: 'BYMA', changePct: 1.50, weight: 9 },
    { symbol: 'VALO', changePct: 0.20, weight: 8 },
    { symbol: 'TGSU2', changePct: 0.90, weight: 8 },
    { symbol: 'TGNO4', changePct: 0.40, weight: 8 },
    { symbol: 'MIRG', changePct: -1.01, weight: 7 },
    { symbol: 'IRSA', changePct: -0.93, weight: 7 },
    { symbol: 'ECOG', changePct: -2.96, weight: 7 },
    { symbol: 'SAMI', changePct: 2.00, weight: 6 },
    { symbol: 'MORI', changePct: 1.80, weight: 6 },
];

export const BONDS_PESOS_HEATMAP: HeatmapTile[] = [
    { symbol: 'AL30', changePct: -0.16, weight: 35 },
    { symbol: 'GD30', changePct: -0.05, weight: 28 },
    { symbol: 'GD35', changePct: -0.09, weight: 16 },
    { symbol: 'AL35', changePct: 0.12, weight: 12 },
    { symbol: 'AE38', changePct: 0.20, weight: 11 },
    { symbol: 'GD38', changePct: 0.10, weight: 9 },
    { symbol: 'AL41', changePct: 0.05, weight: 8 },
    { symbol: 'GD41', changePct: -0.08, weight: 8 },
    { symbol: 'TX26', changePct: 0.10, weight: 8 },
    { symbol: 'TX28', changePct: -0.20, weight: 7 },
    { symbol: 'DICP', changePct: -0.20, weight: 6 },
    { symbol: 'PARP', changePct: -0.10, weight: 5 },
];

export const BONDS_USD_HEATMAP: HeatmapTile[] = [
    { symbol: 'AL30D', changePct: -0.06, weight: 42 },
    { symbol: 'GD30D', changePct: 0.08, weight: 30 },
    { symbol: 'GD35D', changePct: -0.04, weight: 16 },
    { symbol: 'AL35D', changePct: 0.05, weight: 12 },
    { symbol: 'AE38D', changePct: 0.15, weight: 10 },
    { symbol: 'GD38D', changePct: 0.12, weight: 8 },
    { symbol: 'GD46D', changePct: -0.12, weight: 7 },
    { symbol: 'AL41D', changePct: 0.02, weight: 7 },
];

// ─── CRIPTOMONEDAS ──────────────────────────────────────────────────────────
export const CRYPTO_DATA: MarketTickerRow[] = [
    { symbol: 'BTC', name: 'Bitcoin', last: 80366.0, dayChangePct: -0.1, monthChangePct: -3.7, yearChangePct: 118.4 },
    { symbol: 'ETH', name: 'Ethereum', last: 2326.59, dayChangePct: -0.7, monthChangePct: -13.4, yearChangePct: 38.9 },
    { symbol: 'SOL', name: 'Solana', last: 175.40, dayChangePct: 1.2, monthChangePct: 8.4, yearChangePct: 185.2 },
    { symbol: 'BNB', name: 'Binance Coin', last: 592.10, dayChangePct: -0.3, monthChangePct: 1.5, yearChangePct: 82.1 },
    { symbol: 'XRP', name: 'Ripple', last: 0.54, dayChangePct: 0.5, monthChangePct: 2.1, yearChangePct: 12.0 },
    { symbol: 'ADA', name: 'Cardano', last: 0.36, dayChangePct: 0.8, monthChangePct: -4.2, yearChangePct: 22.4 },
    { symbol: 'AVAX', name: 'Avalanche', last: 28.40, dayChangePct: 1.4, monthChangePct: 6.2, yearChangePct: 78.5 },
    { symbol: 'LINK', name: 'Chainlink', last: 11.90, dayChangePct: 0.9, monthChangePct: 4.8, yearChangePct: 45.1 },
];

export const CRYPTO_BOLSA_DATA: MarketTickerRow[] = [
    { symbol: 'BITO_US', name: 'ProShares Bitcoin ETF', last: 10.72, dayChangePct: -0.6, monthChangePct: -4.2, yearChangePct: 105.8 },
    { symbol: 'GBTC_US', name: 'Grayscale Bitcoin Trust', last: 61.99, dayChangePct: -0.5, monthChangePct: -4.0, yearChangePct: 110.3 },
    { symbol: 'ETHE_US', name: 'Grayscale Ethereum Trust', last: 18.65, dayChangePct: -0.9, monthChangePct: -13.0, yearChangePct: 32.5 },
    { symbol: 'LTCN_US', name: 'Grayscale Litecoin Trust', last: 4.29, dayChangePct: 3.9, monthChangePct: -18.4, yearChangePct: -26.5 },
    { symbol: 'COIN_US', name: 'Coinbase Global', last: 218.40, dayChangePct: 3.4, monthChangePct: 14.2, yearChangePct: 98.4 },
    { symbol: 'MSTR_US', name: 'MicroStrategy', last: 254.20, dayChangePct: 4.8, monthChangePct: 28.5, yearChangePct: 340.0 },
];

// ─── ACCIONES GENERAL (BOLSA ARGENTINA) ──────────────────────────────────────
export const GENERAL_STOCKS_ARG: MarketTickerRow[] = [
    { symbol: 'GGAL', last: 5420.0, dayChangePct: 1.3, monthChangePct: 14.2, yearChangePct: 165.0 },
    { symbol: 'YPFD', last: 32450.0, dayChangePct: 1.5, monthChangePct: 8.4, yearChangePct: 122.0 },
    { symbol: 'PAMP', last: 3180.0, dayChangePct: 1.1, monthChangePct: 7.2, yearChangePct: 95.0 },
    { symbol: 'ALUA', last: 980.0, dayChangePct: 0.4, monthChangePct: 3.1, yearChangePct: 54.0 },
    { symbol: 'TXAR', last: 945.0, dayChangePct: -0.2, monthChangePct: 2.8, yearChangePct: 48.0 },
    { symbol: 'BMA', last: 8420.0, dayChangePct: 1.1, monthChangePct: 12.0, yearChangePct: 148.0 },
    { symbol: 'SUPV', last: 2235.0, dayChangePct: -3.9, monthChangePct: 11.2, yearChangePct: 162.0 },
    { symbol: 'TRAN', last: 2175.0, dayChangePct: -3.6, monthChangePct: 6.8, yearChangePct: 88.0 },
    { symbol: 'EDN', last: 1640.0, dayChangePct: 0.7, monthChangePct: 8.5, yearChangePct: 95.0 },
    { symbol: 'CEPU', last: 1420.0, dayChangePct: 0.6, monthChangePct: 5.2, yearChangePct: 82.0 },
    { symbol: 'CRES', last: 1380.0, dayChangePct: -0.3, monthChangePct: 3.4, yearChangePct: 52.0 },
    { symbol: 'BYMA', last: 274.50, dayChangePct: 1.5, monthChangePct: 6.8, yearChangePct: 64.0 },
    { symbol: 'COME', last: 195.0, dayChangePct: 0.8, monthChangePct: 4.5, yearChangePct: 72.0 },
    { symbol: 'VALO', last: 395.0, dayChangePct: 0.2, monthChangePct: 3.8, yearChangePct: 45.0 },
    { symbol: 'TGSU2', last: 5890.0, dayChangePct: 0.9, monthChangePct: 6.1, yearChangePct: 92.0 },
    { symbol: 'TGNO4', last: 3420.0, dayChangePct: 0.4, monthChangePct: 5.8, yearChangePct: 78.0 },
    { symbol: 'MIRG', last: 21400.0, dayChangePct: -1.0, monthChangePct: 4.2, yearChangePct: 42.0 },
    { symbol: 'LOMA', last: 2150.0, dayChangePct: 0.1, monthChangePct: 2.4, yearChangePct: 35.0 },
    { symbol: 'TECO2', last: 2840.0, dayChangePct: 0.5, monthChangePct: 3.9, yearChangePct: 44.0 },
    { symbol: 'IRSA', last: 1580.0, dayChangePct: -0.9, monthChangePct: 4.1, yearChangePct: 51.0 },
    { symbol: 'A3', last: 2650.0, dayChangePct: -1.5, monthChangePct: 1.1, yearChangePct: -18.5 },
    { symbol: 'AGRO', last: 29.60, dayChangePct: -0.7, monthChangePct: -19.8, yearChangePct: -44.6 },
    { symbol: 'AUSO', last: 2685.0, dayChangePct: -0.7, monthChangePct: -6.0, yearChangePct: -33.2 },
    { symbol: 'BHIP', last: 232.0, dayChangePct: -1.1, monthChangePct: -14.0, yearChangePct: -56.7 },
    { symbol: 'BOLT', last: 64.20, dayChangePct: -3.6, monthChangePct: 0.3, yearChangePct: 41.1 },
    { symbol: 'BPAT', last: 1655.0, dayChangePct: null, monthChangePct: -6.2, yearChangePct: -39.7 },
    { symbol: 'CADO', last: 530.0, dayChangePct: 0.4, monthChangePct: null, yearChangePct: -3.8 },
    { symbol: 'CAPX', last: 2990.0, dayChangePct: 1.4, monthChangePct: -11.3, yearChangePct: -48.1 },
    { symbol: 'CARC', last: 17.35, dayChangePct: -0.6, monthChangePct: -13.0, yearChangePct: -39.5 },
    { symbol: 'CECO2', last: 460.0, dayChangePct: 2.2, monthChangePct: -5.0, yearChangePct: -4.4 },
    { symbol: 'CELU', last: 172.50, dayChangePct: -0.3, monthChangePct: -2.3, yearChangePct: -58.7 },
    { symbol: 'CGPA2', last: 1450.0, dayChangePct: -1.0, monthChangePct: -12.1, yearChangePct: -50.6 },
    { symbol: 'CTIO', last: 1675.0, dayChangePct: null, monthChangePct: 0.9, yearChangePct: -30.6 },
    { symbol: 'DOME', last: 62.00, dayChangePct: -0.3, monthChangePct: 23.4, yearChangePct: -25.7 },
    { symbol: 'ECOG', last: 2148.0, dayChangePct: -2.1, monthChangePct: -13.6, yearChangePct: -24.8 },
    { symbol: 'FERR', last: 15.50, dayChangePct: -0.3, monthChangePct: -8.3, yearChangePct: -49.8 },
    { symbol: 'FIPL', last: 115.00, dayChangePct: null, monthChangePct: -6.5, yearChangePct: -56.1 },
    { symbol: 'SAMI', last: 404.00, dayChangePct: 2.0, monthChangePct: -6.5, yearChangePct: -45.6 },
];

// ─── SEÑALES TÉCNICAS Y BALANCES ─────────────────────────────────────────────
export const MOVING_AVERAGE_SIGNALS: TechnicalSignalRow[] = [
    { symbol: 'JNJ_US', date: '28/10', type: 'Compra', price: 271.0 },
    { symbol: 'SHW_US', date: '27/10', type: 'Venta', price: 325.7 },
    { symbol: 'MMM_US', date: '26/10', type: 'Compra', price: 172.5 },
    { symbol: 'AMZN_US', date: '26/10', type: 'Venta', price: 249.0 },
    { symbol: 'QQQ_US', date: '26/10', type: 'Venta', price: 711.9 },
    { symbol: 'AAPL_US', date: '25/10', type: 'Compra', price: 231.4 },
    { symbol: 'NVDA_US', date: '24/10', type: 'Compra', price: 139.8 },
];

export const MACD_SIGNALS: TechnicalSignalRow[] = [
    { symbol: 'AAPL_US', date: '28/10', type: 'Venta', price: 345.6 },
    { symbol: 'SHW_US', date: '28/10', type: 'Venta', price: 321.2 },
    { symbol: 'C_US', date: '28/10', type: 'Compra', price: 124.3 },
    { symbol: 'GOLD_US', date: '27/10', type: 'Compra', price: 39.5 },
    { symbol: 'BA_US', date: '27/10', type: 'Venta', price: 168.0 },
    { symbol: 'MSFT_US', date: '26/10', type: 'Compra', price: 426.5 },
];

export const GLOBAL_EARNINGS: BalanceReportRow[] = [
    { symbol: 'KO_US', date: '27/10', previousYear: '0,80', estimated: '0,90', actual: '0,92' },
    { symbol: 'UNH_US', date: '26/10', previousYear: '2,90', estimated: '4,20', actual: '4,70' },
    { symbol: 'MSFT_US', date: '28/10', previousYear: '2,99', estimated: '3,10', actual: '3,30' },
    { symbol: 'GOOGL_US', date: '28/10', previousYear: '1,55', estimated: '1,84', actual: '2,12' },
    { symbol: 'VIST_US', date: '28/10', previousYear: '1,12', estimated: '1,45', actual: '1,60' },
    { symbol: 'AAPL_US', date: '31/10', previousYear: '1,46', estimated: '1,60', actual: '1,64' },
];

// ─── LETRAS Y BONOS EN PESOS ────────────────────────────────────────────────
export const LETRAS_BONOS_PESOS: MarketTickerRow[] = [
    { symbol: 'S30O6', last: 135.20, dayChangePct: 0.1, monthChangePct: 1.5, yearChangePct: 26.7 },
    { symbol: 'S13N6', last: 108.61, dayChangePct: 0.1, monthChangePct: 1.8, yearChangePct: 24.1 },
    { symbol: 'S30N6', last: 127.24, dayChangePct: 0.0, monthChangePct: 1.8, yearChangePct: 27.2 },
    { symbol: 'T661O', last: 109.00, dayChangePct: 4.3, monthChangePct: 1.0, yearChangePct: 17.0 },
    { symbol: 'T15E7', last: 152.85, dayChangePct: 0.1, monthChangePct: 2.0, yearChangePct: 28.2 },
    { symbol: 'S29E7', last: 104.94, dayChangePct: 0.1, monthChangePct: 1.9, yearChangePct: 25.0 },
    { symbol: 'T30A7', last: 138.22, dayChangePct: 0.2, monthChangePct: 2.3, yearChangePct: 29.8 },
    { symbol: 'T641O', last: 158760.0, dayChangePct: -1.7, monthChangePct: -0.3, yearChangePct: 10.6 },
    { symbol: 'T31Y7', last: 130.19, dayChangePct: 0.0, monthChangePct: 2.4, yearChangePct: 29.0 },
    { symbol: 'T30J7', last: 132.20, dayChangePct: -0.4, monthChangePct: 3.0, yearChangePct: 26.4 },
];

// ─── CEDEARS (EXPANDIDO) ───────────────────────────────────────────────────
export const CEDEARS_LIST: MarketTickerRow[] = [
    { symbol: 'NVDA', name: 'Nvidia', last: 19610.0, dayChangePct: 1.2, monthChangePct: 14.1, yearChangePct: 195.4 },
    { symbol: 'AAPL', name: 'Apple', last: 28680.0, dayChangePct: 0.1, monthChangePct: 7.6, yearChangePct: 38.4 },
    { symbol: 'AMZN', name: 'Amazon', last: 2910.0, dayChangePct: -0.4, monthChangePct: 3.7, yearChangePct: 18.2 },
    { symbol: 'MSFT', name: 'Microsoft', last: 18600.0, dayChangePct: -0.7, monthChangePct: 4.5, yearChangePct: 22.6 },
    { symbol: 'GOOGL', name: 'Alphabet', last: 9265.0, dayChangePct: 0.8, monthChangePct: 3.2, yearChangePct: 32.6 },
    { symbol: 'META', name: 'Meta', last: 42420.0, dayChangePct: 0.5, monthChangePct: 13.3, yearChangePct: 99.1 },
    { symbol: 'TSLA', name: 'Tesla', last: 28410.0, dayChangePct: -1.1, monthChangePct: 14.6, yearChangePct: 8.4 },
    { symbol: 'SPY', name: 'S&P 500 ETF', last: 27850.0, dayChangePct: 0.1, monthChangePct: 2.1, yearChangePct: 28.4 },
    { symbol: 'QQQ', name: 'Nasdaq 100 ETF', last: 38400.0, dayChangePct: 0.3, monthChangePct: 3.2, yearChangePct: 32.4 },
    { symbol: 'MELI', name: 'MercadoLibre', last: 16840.0, dayChangePct: 0.6, monthChangePct: 5.4, yearChangePct: 48.2 },
    { symbol: 'VIST', name: 'Vista Energy', last: 25750.0, dayChangePct: 1.7, monthChangePct: 13.2, yearChangePct: 94.9 },
    { symbol: 'C', name: 'Citigroup', last: 68650.0, dayChangePct: 1.7, monthChangePct: -1.7, yearChangePct: 15.9 },
    { symbol: 'JPM', name: 'JPMorgan', last: 37580.0, dayChangePct: 1.4, monthChangePct: 6.1, yearChangePct: 44.6 },
    { symbol: 'KO', name: 'Coca-Cola', last: 30380.0, dayChangePct: 0.3, monthChangePct: 9.1, yearChangePct: 43.5 },
    { symbol: 'DIA', name: 'Dow Jones ETF', last: 43460.0, dayChangePct: 0.3, monthChangePct: 6.1, yearChangePct: 22.5 },
    { symbol: 'WMT', name: 'Walmart', last: 19800.0, dayChangePct: 0.4, monthChangePct: 4.8, yearChangePct: 52.0 },
    { symbol: 'BBD', name: 'Banco Bradesco', last: 2450.0, dayChangePct: 0.8, monthChangePct: 3.2, yearChangePct: 12.0 },
    { symbol: 'PBR', name: 'Petrobras', last: 14200.0, dayChangePct: 1.4, monthChangePct: 4.1, yearChangePct: 38.0 },
    { symbol: 'BABA', name: 'Alibaba', last: 8950.0, dayChangePct: -0.6, monthChangePct: 8.5, yearChangePct: 16.2 },
    { symbol: 'AMD', name: 'AMD', last: 18450.0, dayChangePct: 1.5, monthChangePct: 7.2, yearChangePct: 46.0 },
    { symbol: 'INTC', name: 'Intel', last: 2840.0, dayChangePct: -1.2, monthChangePct: -3.4, yearChangePct: -34.0 },
    { symbol: 'DIS', name: 'Disney', last: 11200.0, dayChangePct: -0.8, monthChangePct: 1.2, yearChangePct: 18.0 },
    { symbol: 'GLD', name: 'Gold Trust ETF', last: 42100.0, dayChangePct: 0.8, monthChangePct: 6.4, yearChangePct: 42.0 },
    { symbol: 'XLE', name: 'Energy ETF', last: 14500.0, dayChangePct: 0.9, monthChangePct: 3.8, yearChangePct: 24.0 },
    { symbol: 'COIN', name: 'Coinbase', last: 28400.0, dayChangePct: 3.4, monthChangePct: 14.2, yearChangePct: 115.0 },
    { symbol: 'NFLX', name: 'Netflix', last: 68400.0, dayChangePct: 0.8, monthChangePct: 9.2, yearChangePct: 88.0 },
];

// ─── ADRS ARGENTINOS (COMPLETO) ─────────────────────────────────────────────
export const ADRS_ARGENTINOS: MarketTickerRow[] = [
    { symbol: 'GGAL_US', name: 'Grupo Financiero Galicia', last: 48.90, dayChangePct: 2.1, monthChangePct: 14.5, yearChangePct: 162.0 },
    { symbol: 'YPF_US', name: 'YPF S.A.', last: 27.40, dayChangePct: 1.8, monthChangePct: 8.2, yearChangePct: 115.4 },
    { symbol: 'BMA_US', name: 'Banco Macro', last: 74.20, dayChangePct: 1.5, monthChangePct: 12.1, yearChangePct: 140.2 },
    { symbol: 'PAM_US', name: 'Pampa Energía', last: 62.80, dayChangePct: 0.9, monthChangePct: 6.8, yearChangePct: 85.3 },
    { symbol: 'MELI_US', name: 'MercadoLibre', last: 2045.0, dayChangePct: 0.6, monthChangePct: 5.4, yearChangePct: 46.2 },
    { symbol: 'VIST_US', name: 'Vista Energy', last: 52.10, dayChangePct: 1.7, monthChangePct: 7.8, yearChangePct: 98.4 },
    { symbol: 'GLOB_US', name: 'Globant', last: 182.50, dayChangePct: -0.4, monthChangePct: 3.2, yearChangePct: 8.5 },
    { symbol: 'CEPU_US', name: 'Central Puerto', last: 12.80, dayChangePct: 0.5, monthChangePct: 4.9, yearChangePct: 78.4 },
    { symbol: 'CRESY_US', name: 'Cresud', last: 11.40, dayChangePct: -0.2, monthChangePct: 2.1, yearChangePct: 45.0 },
    { symbol: 'EDN_US', name: 'Edenor', last: 21.80, dayChangePct: 0.4, monthChangePct: 8.9, yearChangePct: 92.0 },
    { symbol: 'SUPV_US', name: 'Grupo Supervielle', last: 9.45, dayChangePct: -1.2, monthChangePct: 11.4, yearChangePct: 154.0 },
    { symbol: 'TGS_US', name: 'Transportadora de Gas del Sur', last: 23.40, dayChangePct: 0.8, monthChangePct: 5.6, yearChangePct: 88.5 },
    { symbol: 'BBAR_US', name: 'BBVA Argentina', last: 11.93, dayChangePct: 0.4, monthChangePct: 9.2, yearChangePct: 118.0 },
    { symbol: 'IRS_US', name: 'IRSA', last: 14.37, dayChangePct: -0.5, monthChangePct: 2.7, yearChangePct: 42.0 },
    { symbol: 'LOMA_US', name: 'Loma Negra', last: 9.29, dayChangePct: 0.1, monthChangePct: 0.8, yearChangePct: 28.3 },
    { symbol: 'CAAP_US', name: 'Corporación América Airports', last: 23.51, dayChangePct: 0.4, monthChangePct: -2.1, yearChangePct: 48.0 },
    { symbol: 'BIOX_US', name: 'Bioceres Crop Solutions', last: 9.80, dayChangePct: -0.8, monthChangePct: -3.2, yearChangePct: -14.0 },
    { symbol: 'DESP_US', name: 'Despegar.com', last: 15.40, dayChangePct: 0.6, monthChangePct: 8.4, yearChangePct: 62.0 },
];

// ─── OBLIGACIONES NEGOCIABLES (ONS EXPANDIDAS) ─────────────────────────────
export const CORPORATE_BONDS: CorporateBondRow[] = [
    { symbol: 'VSCXD', name: 'Vista Energy 2038', maturity: '09/04/38', last: 102.40, parity: 102.0, tir: 7.7, volume: 383066, dayChangePct: -0.4 },
    { symbol: 'MGCRD', name: 'Pampa Energy 2037', maturity: '14/11/37', last: 104.10, parity: 100.6, tir: 7.7, volume: 307834, dayChangePct: -0.3 },
    { symbol: 'YM44D', name: 'YPF 2035 u$s', maturity: '18/06/35', last: 101.00, parity: 101.0, tir: 7.7, volume: 713446, dayChangePct: 0.2 },
    { symbol: 'MGCOD', name: 'Pampa Energy 2034', maturity: '16/12/34', last: 107.80, parity: 104.8, tir: 7.2, volume: 108110, dayChangePct: -0.7 },
    { symbol: 'YM34D', name: 'YPF 2034 u$s', maturity: '17/01/34', last: 108.80, parity: 106.3, tir: 7.0, volume: 377850, dayChangePct: -0.2 },
    { symbol: 'VSCVD', name: 'Vista Energy 2033', maturity: '10/06/33', last: 110.70, parity: 107.2, tir: 6.7, volume: 165170, dayChangePct: -0.1 },
    { symbol: 'YM43D', name: 'YPF 2030 u$s', maturity: '14/04/30', last: 100.30, parity: 97.4, tir: 6.5, volume: 696866, dayChangePct: 0.0 },
    { symbol: 'YMCXD', name: 'YPF 2031 u$s', maturity: '11/09/31', last: 109.70, parity: 108.5, tir: 6.4, volume: 205321, dayChangePct: -0.4 },
    { symbol: 'MGCMD', name: 'Pampa Energy 2031', maturity: '10/09/31', last: 108.10, parity: 107.0, tir: 6.3, volume: 344693, dayChangePct: -0.1 },
    { symbol: 'YM37D', name: 'YPF 2027 u$s', maturity: '07/05/27', last: 102.15, parity: 100.6, tir: 6.1, volume: 351566, dayChangePct: 0.1 },
    { symbol: 'YM42D', name: 'YPF 2029 u$s', maturity: '02/03/29', last: 105.20, parity: 102.3, tir: 6.1, volume: 138765, dayChangePct: 0.1 },
    { symbol: 'PN35D', name: 'Pan American 2029', maturity: '27/09/29', last: 104.45, parity: 103.8, tir: 5.9, volume: 141998, dayChangePct: 0.7 },
    { symbol: 'TLC1D', name: 'Telecom Arg 2026', maturity: '18/07/26', last: 101.40, parity: 101.2, tir: 6.8, volume: 215400, dayChangePct: 0.3 },
    { symbol: 'IRC9D', name: 'IRSA 2028 u$s', maturity: '22/06/28', last: 102.80, parity: 101.5, tir: 6.9, volume: 182300, dayChangePct: 0.1 },
    { symbol: 'CRCEO', name: 'Cresud 2026', maturity: '03/03/26', last: 100.50, parity: 100.0, tir: 7.1, volume: 98400, dayChangePct: 0.2 },
    { symbol: 'ARCOR', name: 'Arcor 2027 u$s', maturity: '06/10/27', last: 104.20, parity: 103.1, tir: 5.8, volume: 220000, dayChangePct: 0.0 },
    { symbol: 'GENNE', name: 'Genneia 2027', maturity: '02/09/27', last: 101.80, parity: 100.9, tir: 7.4, volume: 145000, dayChangePct: -0.1 },
    { symbol: 'TECPE', name: 'Tecpetrol 2026', maturity: '12/12/26', last: 103.10, parity: 102.4, tir: 6.2, volume: 178000, dayChangePct: 0.2 },
];

// ─── BONOS BOPREAL ──────────────────────────────────────────────────────────
export const BONOS_BOPREAL: MarketTickerRow[] = [
    { symbol: 'BPOA7', last: 163990.0, dayChangePct: 0.1, monthChangePct: 2.3, yearChangePct: 11.3 },
    { symbol: 'BPOB7', last: 164320.0, dayChangePct: 0.6, monthChangePct: 1.0, yearChangePct: 11.8 },
    { symbol: 'BPOC7', last: 164310.0, dayChangePct: 0.0, monthChangePct: 2.0, yearChangePct: 12.7 },
    { symbol: 'BPOD7', last: 164000.0, dayChangePct: 0.2, monthChangePct: 1.7, yearChangePct: 12.3 },
    { symbol: 'BPOB8', last: 142540.0, dayChangePct: -0.1, monthChangePct: 1.3, yearChangePct: 10.9 },
];

// ─── BONOS DOLLAR-LINKED Y CER ──────────────────────────────────────────────
export const BONOS_DOLLAR_LINKED: MarketTickerRow[] = [
    { symbol: 'TX26', last: 763.0, dayChangePct: 0.1, monthChangePct: 1.6, yearChangePct: -33.9 },
    { symbol: 'TX28', last: 1809.0, dayChangePct: -0.2, monthChangePct: 2.5, yearChangePct: 10.0 },
    { symbol: 'DICP', last: 49115.0, dayChangePct: -0.2, monthChangePct: 1.7, yearChangePct: 14.1 },
    { symbol: 'PARP', last: 33955.0, dayChangePct: -0.1, monthChangePct: -0.3, yearChangePct: 16.1 },
    { symbol: 'CUAP', last: 39785.0, dayChangePct: -0.1, monthChangePct: -2.9, yearChangePct: 6.5 },
    { symbol: 'PR13', last: 12450.0, dayChangePct: 0.2, monthChangePct: 3.1, yearChangePct: 18.2 },
    { symbol: 'D30O6', last: 153780.0, dayChangePct: 0.1, monthChangePct: 1.7, yearChangePct: 14.0 },
    { symbol: 'D31M7', last: 152200.0, dayChangePct: -0.2, monthChangePct: 1.5, yearChangePct: 12.8 },
    { symbol: 'TZV27', last: 149810.0, dayChangePct: -0.2, monthChangePct: 1.3, yearChangePct: 15.0 },
    { symbol: 'TMVE8', last: 146190.0, dayChangePct: 0.3, monthChangePct: 2.7, yearChangePct: 16.2 },
];
