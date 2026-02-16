import { useRef, useEffect } from 'react';

// Declaration for TradingView widget global
declare global {
    interface Window {
        TradingView: any;
    }
}

interface TradingViewTickerTapeProps {
    symbols?: { proName: string; title: string }[];
    colorTheme?: 'light' | 'dark';
}

export default function TradingViewTickerTape({
    symbols = [
        { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
        { proName: "FOREXCOM:NSXUSD", title: "US 100" },
        { proName: "FX_IDC:EURUSD", title: "EUR to USD" },
        { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
        { proName: "BITSTAMP:ETHUSD", title: "Ethereum" }
    ],
    colorTheme = 'dark'
}: TradingViewTickerTapeProps) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!container.current) return;

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            symbols: symbols,
            showSymbolLogo: true,
            colorTheme: colorTheme,
            isTransparent: true,
            displayMode: "adaptive",
            locale: "en"
        });

        container.current.appendChild(script);

        return () => {
            // Cleanup is hard with this widget as it replaces content, but we try to clear innerHTML
            if (container.current) container.current.innerHTML = '';
        };
    }, [symbols, colorTheme]);

    return (
        <div className="tradingview-widget-container" ref={container}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    );
}
