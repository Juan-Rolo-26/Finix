import { resolveTradingViewSymbol } from '@/lib/tradingViewSymbols';
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

    const canonicalSymbol = resolveTradingViewSymbol(symbol);

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
