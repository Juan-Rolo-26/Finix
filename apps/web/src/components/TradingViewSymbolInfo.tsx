import { useEffect, useRef, memo } from 'react';

interface TradingViewSymbolInfoProps {
    symbol: string;
    theme?: 'light' | 'dark';
    locale?: string;
}

function TradingViewSymbolInfo({
    symbol,
    theme = 'dark',
    locale = 'es'
}: TradingViewSymbolInfoProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        containerRef.current.innerHTML = '';
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';
        containerRef.current.appendChild(widgetContainer);

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js';
        script.type = 'text/javascript';
        script.async = true;

        script.innerHTML = JSON.stringify({
            symbol: symbol,
            width: '100%',
            locale: locale,
            colorTheme: theme,
            isTransparent: true
        });

        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [symbol, theme, locale]);

    return (
        <div className="tradingview-widget-container w-full" ref={containerRef}>
        </div>
    );
}

export default memo(TradingViewSymbolInfo);
