import { memo } from 'react';
import TradingViewChart from './TradingViewChart';
import { usePreferencesStore } from '../stores/preferencesStore';

interface TradingViewWidgetProps {
    symbol?: string;
    theme?: 'light' | 'dark';
    autosize?: boolean;
    height?: number | string;
    interval?: string;
    hideSideToolbar?: boolean;
}

/**
 * Normaliza tickers para que TradingView los cargue con su exchange canónico
 */
function resolveSymbol(rawSymbol?: string): string {
    if (!rawSymbol) return 'NASDAQ:AAPL';
    const clean = rawSymbol.trim().toUpperCase().replace('$', '');

    if (clean.includes(':')) return clean;

    const cryptoMap: Record<string, string> = {
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

export function TradingViewWidget({
    symbol = 'NASDAQ:AAPL',
    theme,
    height = 500,
    interval = 'D',
    hideSideToolbar = false,
}: TradingViewWidgetProps) {
    const { theme: storeTheme } = usePreferencesStore();

    const activeTheme: 'light' | 'dark' = theme || (
        storeTheme === 'system'
            ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : (storeTheme === 'light' ? 'light' : 'dark')
    );

    const canonicalSymbol = resolveSymbol(symbol);

    return (
        <TradingViewChart
            symbol={canonicalSymbol}
            height={height}
            interval={interval}
            theme={activeTheme}
            hideSideToolbar={hideSideToolbar}
            allowSymbolChange={true}
        />
    );
}

export default memo(TradingViewWidget);
