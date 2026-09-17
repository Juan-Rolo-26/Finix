import { useEffect, useRef, memo } from 'react';
import { Card, CardContent } from './ui/card';
import { usePreferencesStore } from '../stores/preferencesStore';

interface TradingViewChartProps {
    symbol: string;
    interval?: string;
    theme?: 'light' | 'dark';
    height?: number;
    chartStorageId?: string;
    loadLastChart?: boolean;
    autoSave?: boolean;
    onWidgetReady?: (widget: any) => void;
}

function TradingViewChart({
    symbol,
    interval = 'D',
    theme,
    height = 760,
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

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous widget
        containerRef.current.innerHTML = '';

        // Create new container div for the widget with strict dimensions
        const widgetContainer = document.createElement('div');
        widgetContainer.id = `tradingview_${Math.random().toString(36).slice(2, 11)}`;
        widgetContainer.style.width = '100%';
        widgetContainer.style.height = `${height}px`;
        widgetContainer.style.minHeight = `${height}px`;
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
                    autosize: false,
                    width: '100%',
                    height: height,
                    symbol: cleanSymbol,
                    interval: interval || 'D',
                    timezone: 'America/Argentina/Buenos_Aires',
                    theme: activeTheme,
                    style: '1',
                    locale: 'es',
                    toolbar_bg: activeTheme === 'dark' ? '#0a0a0a' : '#ffffff',
                    enable_publishing: false,
                    allow_symbol_change: true,
                    save_image: true,
                    hide_side_toolbar: false,
                    show_popup_button: true,
                    popup_width: '1280',
                    popup_height: '900',
                    withdateranges: true,
                    hide_volume: false,
                    disabled_features: ['use_localstorage_for_settings'],
                    enabled_features: ['study_templates'],
                    support_host: 'https://www.tradingview.com'
                });
                if (onWidgetReady) {
                    onWidgetReady(widget);
                }
            }
        };

        if (!scriptLoadedRef.current) {
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
    }, [symbol, interval, activeTheme, height]);

    return (
        <Card className="overflow-hidden border border-border/60 bg-card rounded-2xl shadow-xs w-full shrink-0">
            <CardContent className="p-0 w-full" style={{ minHeight: `${height}px`, height: `${height}px` }}>
                <div
                    ref={containerRef}
                    style={{ minHeight: `${height}px`, height: `${height}px`, width: '100%' }}
                    className="tradingview-widget-container w-full"
                />
            </CardContent>
        </Card>
    );
}

export default memo(TradingViewChart);
