import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { cn } from '@/lib/utils';

export type HeatmapMarket = 'argentina' | 'merval' | 'sp500' | 'nasdaq';

interface MarketOption {
    id: HeatmapMarket;
    label: string;
    code: string;
    dataSource: string;
    exchanges: string[];
    description: string;
}

const MARKET_OPTIONS: MarketOption[] = [
    {
        id: 'argentina',
        label: 'Acciones BYMA',
        code: 'ARG',
        dataSource: 'AllAR',
        exchanges: ['BCBA'],
        description: 'Mercado de Acciones y CEDEARs operados en BYMA / BCBA',
    },
    {
        id: 'merval',
        label: 'S&P Merval',
        code: 'IMV',
        dataSource: 'BCBAIMV',
        exchanges: ['BCBA'],
        description: 'Panel Líder de las principales empresas argentinas',
    },
    {
        id: 'sp500',
        label: 'S&P 500',
        code: 'SPX',
        dataSource: 'SPX500',
        exchanges: [],
        description: 'Las 500 empresas líderes de Wall Street',
    },
    {
        id: 'nasdaq',
        label: 'Nasdaq 100',
        code: 'NDX',
        dataSource: 'NASDAQ100',
        exchanges: [],
        description: 'Las mayores empresas tecnológicas y globales',
    },
];

export function FinvizHomeHeatmapCard() {
    const navigate = useNavigate();
    const { theme } = usePreferencesStore();
    const isDark =
        theme === 'dark' ||
        (theme === 'system' &&
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

    const [activeMarket, setActiveMarket] = useState<HeatmapMarket>(() => {
        try {
            const saved = localStorage.getItem('finix_home_heatmap_market');
            if (saved && ['argentina', 'merval', 'sp500', 'nasdaq'].includes(saved)) {
                return saved as HeatmapMarket;
            }
        } catch {}
        return 'argentina';
    });
    const [refreshNonce, setRefreshNonce] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const handleSelectMarket = (id: HeatmapMarket) => {
        setActiveMarket(id);
        try {
            localStorage.setItem('finix_home_heatmap_market', id);
        } catch {}
    };

    // Auto-refresh heatmap periodically in real-time
    useEffect(() => {
        const timer = setInterval(() => {
            setRefreshNonce((n) => n + 1);
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const containerRef = useRef<HTMLDivElement>(null);

    const currentConfig = MARKET_OPTIONS.find((m) => m.id === activeMarket) || MARKET_OPTIONS[0];

    useEffect(() => {
        if (!containerRef.current) return;
        setIsLoading(true);
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

        const widgetSettings = {
            exchanges: currentConfig.exchanges,
            dataSource: currentConfig.dataSource,
            grouping: 'sector',
            blockSize: 'market_cap_basic',
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
            height: '100%',
        };

        script.innerHTML = JSON.stringify(widgetSettings);

        script.onload = () => {
            setIsLoading(false);
        };

        const timer = window.setTimeout(() => {
            containerRef.current?.appendChild(script);
            // Hide loading state after brief delay for iframe setup
            window.setTimeout(() => setIsLoading(false), 900);
        }, 10);

        return () => {
            window.clearTimeout(timer);
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [activeMarket, isDark, refreshNonce]);

    return (
        <div className="rounded-xl border border-border/80 bg-card text-card-foreground overflow-hidden shadow-xs transition-colors flex flex-col">
            {/* ─── Header: Title on Left & Direct Action Icons on Right ─── */}
            <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-muted/20 border-b border-border/60">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Flame className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <h3 className="text-xs sm:text-[0.8125rem] font-bold text-foreground tracking-tight select-none">
                            Mapa de Calor del Mercado
                        </h3>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[0.59375rem] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Realtime
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => setRefreshNonce((n) => n + 1)}
                        className="w-6 h-6 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                        title="Recargar mapa de calor"
                        aria-label="Recargar mapa de calor"
                    >
                        <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin text-emerald-500")} />
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/market')}
                        className="w-6 h-6 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                        title="Ir a vista completa de mercados"
                        aria-label="Ir a vista completa de mercados"
                    >
                        <ExternalLink className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* ─── Market Switcher: Full Width Distribution & Ultra-Slim ("Flacos") Buttons ─── */}
            <div className="px-2 py-1 bg-muted/30 dark:bg-muted/15 border-b border-border/50">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-1.5 w-full">
                    {MARKET_OPTIONS.map((opt) => {
                        const isSelected = activeMarket === opt.id;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                data-theme-ignore
                                onClick={() => handleSelectMarket(opt.id)}
                                className={cn(
                                    'w-full h-[22px] max-h-[22px] px-1.5 rounded-md text-[0.6875rem] font-semibold leading-none flex items-center justify-center gap-1 transition-all cursor-pointer select-none border',
                                    isSelected
                                        ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-2xs dark:bg-emerald-500 dark:border-emerald-500 text-white-force'
                                        : 'bg-card/80 hover:bg-card text-muted-foreground hover:text-foreground border-border/70 hover:border-border'
                                )}
                                style={isSelected ? { color: '#ffffff' } : undefined}
                                title={opt.description}
                            >
                                <span
                                    data-theme-ignore
                                    className={cn(
                                        'text-[0.5rem] font-mono font-bold tracking-tight px-1 py-0.5 rounded-[3px] leading-none shrink-0',
                                        isSelected
                                            ? 'bg-black/25 text-white dark:bg-black/30 text-white-force'
                                            : 'bg-muted text-muted-foreground'
                                    )}
                                    style={isSelected ? { color: '#ffffff' } : undefined}
                                >
                                    {opt.code}
                                </span>
                                <span className="truncate leading-none" style={isSelected ? { color: '#ffffff' } : undefined}>{opt.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ─── Sub-bar context ─── */}
            <div className="px-3.5 py-1 bg-muted/10 border-b border-border/40 flex items-center justify-between text-[0.65625rem] text-muted-foreground">
                <span className="font-medium flex items-center gap-1.5 truncate mr-2">
                    <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{currentConfig.description}</span>
                </span>
                <span className="text-[0.625rem] opacity-75 font-mono shrink-0">
                    TradingView Treemap
                </span>
            </div>

            {/* ─── Heatmap Treemap Container ─── */}
            <div className="relative w-full h-[540px] sm:h-[580px] bg-background/50">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-card/60 backdrop-blur-[2px] transition-opacity">
                        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-xs font-semibold text-muted-foreground">
                            Cargando mapa de calor de {currentConfig.label}...
                        </span>
                    </div>
                )}
                <div
                    ref={containerRef}
                    className="tradingview-widget-container w-full h-full"
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
        </div>
    );
}
