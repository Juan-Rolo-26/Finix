import { useEffect } from 'react';

declare global {
    interface Window {
        TradingView: any;
    }
}

interface TradingViewWidgetProps {
    symbol?: string;
    theme?: 'light' | 'dark';
    autosize?: boolean;
    height?: number;
}

export default function TradingViewWidget({
    symbol = "NASDAQ:AAPL",
    theme = "dark",
    height = 540,
}: TradingViewWidgetProps) {
    const containerId = `tradingview_${Math.random().toString(36).substring(7)}`;

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            if (window.TradingView) {
                new window.TradingView.widget({
                    autosize: false,
                    width: '100%',
                    height: height,
                    symbol: symbol,
                    interval: "D",
                    timezone: "America/Argentina/Buenos_Aires",
                    theme: theme,
                    style: "1",
                    locale: "es",
                    enable_publishing: false,
                    allow_symbol_change: true,
                    container_id: containerId
                });
            }
        };
        document.body.appendChild(script);

        return () => {
            // Cleanup if needed
        };
    }, [symbol, height, theme]);

    return (
        <div className='tradingview-widget-container w-full shrink-0' style={{ height: `${height}px`, minHeight: `${height}px`, width: "100%" }}>
            <div id={containerId} style={{ height: `${height}px`, minHeight: `${height}px`, width: "100%" }} />
        </div>
    );
}
