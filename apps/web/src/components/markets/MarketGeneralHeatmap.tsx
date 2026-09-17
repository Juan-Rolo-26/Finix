import { useEffect, useRef } from 'react';
import { usePreferencesStore } from '@/stores/preferencesStore';

export interface MarketGeneralHeatmapProps {
    onSelectSymbol?: (symbol: string) => void;
}

export default function MarketGeneralHeatmap({ onSelectSymbol: _onSelectSymbol }: MarketGeneralHeatmapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = usePreferencesStore();

    const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';
        widgetContainer.style.width = '100%';
        widgetContainer.style.height = '100%';
        containerRef.current.appendChild(widgetContainer);

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            exchanges: [],
            dataSource: 'SPX500',
            grouping: 'sector',
            blockSize: 'market_cap_calc',
            blockColor: 'change',
            locale: 'es',
            symbolUrl: '',
            colorTheme: isDark ? 'dark' : 'light',
            hasTopBar: true,
            isDataSetEnabled: false,
            isZoomEnabled: true,
            hasSymbolTooltip: true,
            isMonoSize: false,
            width: '100%',
            height: '100%'
        });

        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [isDark]);

    return (
        <div className="w-full h-[760px] md:h-[820px] rounded-2xl overflow-hidden border border-border/60 bg-white dark:bg-card shadow-xs">
            <div className="tradingview-widget-container w-full h-full" ref={containerRef}>
                <div className="tradingview-widget-container__widget w-full h-full" />
            </div>
        </div>
    );
}
