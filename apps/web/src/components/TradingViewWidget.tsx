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
    autosize = true,
    height = 500,
}: TradingViewWidgetProps) {
    const containerId = `tradingview_${Math.random().toString(36).substring(7)}`;

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            if (window.TradingView) {
                new window.TradingView.widget({
                    autosize: autosize,
                    symbol: symbol,
                    interval: "D",
                    timezone: "Etc/UTC",
                    theme: theme,
                    style: "1",
                    locale: "en",
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
    }, [symbol]);

    return (
        <div className='tradingview-widget-container' style={{ height: `${height}px`, width: "100%" }}>
            <div id={containerId} style={{ height: "calc(100% - 32px)", width: "100%" }} />
        </div>
    );
}
