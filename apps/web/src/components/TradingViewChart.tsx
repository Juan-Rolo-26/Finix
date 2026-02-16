import { useEffect, useRef, memo } from 'react';
import { Card, CardContent } from './ui/card';

interface TradingViewChartProps {
    symbol: string;
    interval?: string;
    theme?: 'light' | 'dark';
    height?: number;
}

function TradingViewChart({
    symbol,
    interval = 'D',
    theme = 'dark',
    height = 1000
}: TradingViewChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scriptLoadedRef = useRef(false);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous widget
        containerRef.current.innerHTML = '';

        // Create new container div for the widget
        const widgetContainer = document.createElement('div');
        widgetContainer.id = `tradingview_${Math.random().toString(36).slice(2, 11)}`;
        containerRef.current.appendChild(widgetContainer);

        // Load TradingView script if not already loaded
        const loadWidget = () => {
            if (typeof (window as any).TradingView !== 'undefined') {
                new (window as any).TradingView.widget({
                    container_id: widgetContainer.id,
                    width: '100%',
                    height: height,
                    symbol: symbol,
                    interval: interval,
                    timezone: 'America/Argentina/Buenos_Aires',
                    theme: theme,
                    style: '1',
                    locale: 'es',
                    toolbar_bg: '#0a0a0a',
                    enable_publishing: false,
                    allow_symbol_change: true,
                    save_image: true,
                    hide_side_toolbar: false,
                    show_popup_button: true,
                    popup_width: '1280',
                    popup_height: '900',
                    withdateranges: true,
                    hide_volume: true,
                    support_host: 'https://www.tradingview.com'
                });
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
    }, [symbol, interval, theme, height]);

    return (
        <Card className="overflow-hidden border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-0">
                <div
                    ref={containerRef}
                    style={{ height: `clamp(640px, 84vh, ${height}px)`, width: '100%' }}
                    className="tradingview-widget-container min-h-[640px] md:min-h-[760px] lg:min-h-[860px]"
                />
            </CardContent>
        </Card>
    );
}

export default memo(TradingViewChart);
