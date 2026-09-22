import { useEffect, useRef, memo } from 'react';
import { usePreferencesStore } from '../stores/preferencesStore';

export interface TradingViewChartProps {
    symbol: string;
    interval?: string;
    theme?: 'light' | 'dark';
    height?: number | string;
    chartStorageId?: string;
    loadLastChart?: boolean;
    autoSave?: boolean;
    studies?: string[];
    hideSideToolbar?: boolean;
    withDateRanges?: boolean;
    allowSymbolChange?: boolean;
    className?: string;
    onWidgetReady?: (widget: any) => void;
}

function TradingViewChart({
    symbol,
    interval = 'D',
    theme,
    height = 540,
    studies = [],
    hideSideToolbar = false,
    withDateRanges = true,
    allowSymbolChange = true,
    className,
    onWidgetReady,
}: TradingViewChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scriptLoadedRef = useRef(false);
    const { theme: storeTheme } = usePreferencesStore();

    // Resolve theme dynamically
    const activeTheme: 'light' | 'dark' = theme || (
        storeTheme === 'system'
            ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : (storeTheme === 'light' ? 'light' : 'dark')
    );

    const studiesKey = JSON.stringify(studies);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous widget
        containerRef.current.innerHTML = '';

        // Create new container div for the widget
        const widgetContainer = document.createElement('div');
        widgetContainer.id = `tradingview_${Math.random().toString(36).slice(2, 11)}`;
        widgetContainer.style.width = '100%';
        widgetContainer.style.height = '100%';
        widgetContainer.style.minHeight = typeof height === 'number' ? `${height}px` : (height === '100%' ? '100%' : height);
        widgetContainer.style.display = 'block';
        containerRef.current.appendChild(widgetContainer);

        const resolveSymbol = (sym: string): string => {
            if (!sym) return 'NASDAQ:AAPL';
            const upper = sym.trim().toUpperCase();
            if (upper.includes(':')) return upper;
            if (['SPY', 'VOO', 'IVV', 'DIA', 'IWM', 'VTI'].includes(upper)) return `AMEX:${upper}`;
            if (['BTC', 'BTCUSDT'].includes(upper)) return 'BINANCE:BTCUSDT';
            if (['ETH', 'ETHUSDT'].includes(upper)) return 'BINANCE:ETHUSDT';
            if (['SOL', 'SOLUSDT'].includes(upper)) return 'BINANCE:SOLUSDT';
            if (['BNB', 'XRP', 'ADA', 'DOGE', 'AVAX'].includes(upper)) return `BINANCE:${upper}USDT`;
            return `NASDAQ:${upper}`;
        };

        const cleanSymbol = resolveSymbol(symbol);

        // Load TradingView script if not already loaded
        const loadWidget = () => {
            if (typeof (window as any).TradingView !== 'undefined') {
                const widget = new (window as any).TradingView.widget({
                    container_id: widgetContainer.id,
                    autosize: true,
                    width: '100%',
                    height: '100%',
                    symbol: cleanSymbol,
                    interval: interval || 'D',
                    timezone: 'America/Argentina/Buenos_Aires',
                    theme: activeTheme,
                    style: '1',
                    locale: 'es',
                    toolbar_bg: activeTheme === 'dark' ? '#09090b' : '#ffffff',
                    enable_publishing: false,
                    allow_symbol_change: allowSymbolChange,
                    save_image: true,
                    hide_side_toolbar: hideSideToolbar,
                    show_popup_button: false,
                    withdateranges: withDateRanges,
                    hide_volume: false,
                    disabled_features: [],
                    enabled_features: ['study_templates', 'header_indicators', 'header_widget'],
                    studies: studies,
                    support_host: 'https://www.tradingview.com',
                });
                if (onWidgetReady) {
                    onWidgetReady(widget);
                }
            }
        };

        if (!scriptLoadedRef.current && !(window as any).TradingView) {
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/tv.js';
            script.async = true;
            script.onload = () => {
                scriptLoadedRef.current = true;
                loadWidget();
            };
            document.head.appendChild(script);
        } else {
            loadWidget();
        }

        // Cleanup
        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [symbol, interval, activeTheme, height, studiesKey, hideSideToolbar, withDateRanges, allowSymbolChange]);

    const resolvedHeightStyle = typeof height === 'number' ? `${height}px` : height;

    return (
        <div
            className={`overflow-hidden border border-border/60 bg-card rounded-2xl shadow-xs w-full relative ${className || ''}`}
            style={{
                height: resolvedHeightStyle,
                minHeight: resolvedHeightStyle,
            }}
        >
            <div
                ref={containerRef}
                style={{ height: '100%', minHeight: '100%', width: '100%' }}
                className="tradingview-widget-container w-full h-full"
            />
        </div>
    );
}

export default memo(TradingViewChart);
