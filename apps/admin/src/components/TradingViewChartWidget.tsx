import { useEffect, useRef, useState, memo } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export interface TradingViewChartWidgetProps {
    symbol: string;
    exchange?: string;
    interval?: string;
    height?: number | string;
    theme?: 'light' | 'dark';
    allowSymbolChange?: boolean;
    studies?: string[];
    className?: string;
}

/**
 * Normaliza cualquier ticker o símbolo interno a su representación canónica en TradingView
 */
export function resolveTradingViewSymbol(rawSymbol: string, preferredExchange?: string): string {
    if (!rawSymbol) return 'NASDAQ:AAPL';
    const clean = rawSymbol.trim().toUpperCase();

    // Si ya viene con prefijo de exchange (e.g. "BINANCE:BTCUSDT")
    if (clean.includes(':')) return clean;

    // Criptomonedas
    const cryptoMap: Record<string, string> = {
        BTC: 'BINANCE:BTCUSDT',
        BTCUSDT: 'BINANCE:BTCUSDT',
        ETH: 'BINANCE:ETHUSDT',
        ETHUSDT: 'BINANCE:ETHUSDT',
        SOL: 'BINANCE:SOLUSDT',
        SOLUSDT: 'BINANCE:SOLUSDT',
        BNB: 'BINANCE:BNBUSDT',
        XRP: 'BINANCE:XRPUSDT',
        ADA: 'BINANCE:ADAUSDT',
        DOGE: 'BINANCE:DOGEUSDT',
        AVAX: 'BINANCE:AVAXUSDT',
        DOT: 'BINANCE:DOTUSDT',
        MATIC: 'BINANCE:MATICUSDT',
        POL: 'BINANCE:POLUSDT',
        LINK: 'BINANCE:LINKUSDT',
    };
    if (cryptoMap[clean]) return cryptoMap[clean];

    // Índices y Commodities
    const indexMap: Record<string, string> = {
        SPX: 'S&P:SPX',
        SP500: 'S&P:SPX',
        NDX: 'NASDAQ:NDX',
        DJI: 'DJ:DJI',
        VIX: 'CBOE:VIX',
        DXY: 'CAPITALCOM:DXY',
        IMV: 'BCBA:IMV',
        MERVAL: 'BCBA:IMV',
        GOLD: 'TVC:GOLD',
        SILVER: 'TVC:SILVER',
        OIL: 'TVC:USOIL',
        US10Y: 'TVC:US10Y',
    };
    if (indexMap[clean]) return indexMap[clean];

    // ETFs conocidos (AMEX / NASDAQ)
    const etfMap: Record<string, string> = {
        SPY: 'AMEX:SPY',
        QQQ: 'NASDAQ:QQQ',
        DIA: 'AMEX:DIA',
        IWM: 'AMEX:IWM',
        VOO: 'AMEX:VOO',
        IVV: 'AMEX:IVV',
        VTI: 'AMEX:VTI',
        XLF: 'AMEX:XLF',
        XLK: 'AMEX:XLK',
        XLE: 'AMEX:XLE',
        ARKK: 'AMEX:ARKK',
        SMH: 'NASDAQ:SMH',
        EEM: 'AMEX:EEM',
    };
    if (etfMap[clean]) return etfMap[clean];

    // Acciones argentinas locales (BCBA) o ADRs
    const bcbaStocks: Record<string, string> = {
        ALUA: 'BCBA:ALUA',
        TXAR: 'BCBA:TXAR',
        COME: 'BCBA:COME',
        VALO: 'BCBA:VALO',
        MIRG: 'BCBA:MIRG',
        CRES: 'NASDAQ:CRESY',
        GGAL: 'NASDAQ:GGAL',
        BMA: 'NYSE:BMA',
        YPF: 'NYSE:YPF',
        YPFD: 'BCBA:YPFD',
        PAMP: 'NYSE:PAM',
        PAM: 'NYSE:PAM',
        TGS: 'NYSE:TGS',
        TGSU2: 'BCBA:TGSU2',
        BBAR: 'NYSE:BBAR',
        EDN: 'NYSE:EDN',
        CEPU: 'NYSE:CEPU',
        LOMA: 'NYSE:LOMA',
        SUPV: 'NYSE:SUPV',
        MELI: 'NASDAQ:MELI',
        GLOB: 'NYSE:GLOB',
        VIST: 'NYSE:VIST',
        DESP: 'NYSE:DESP',
    };
    if (bcbaStocks[clean]) return bcbaStocks[clean];

    // Acciones de NYSE conocidas
    const nyseStocks = new Set([
        'KO', 'DIS', 'JNJ', 'JPM', 'V', 'MA', 'WMT', 'PG', 'HD', 'UNH', 'CVX', 'XOM',
        'BAC', 'PFE', 'ABT', 'CRM', 'NKE', 'MCD', 'IBM', 'BA', 'GE', 'ORCL', 'CAT', 'GS'
    ]);
    if (nyseStocks.has(clean)) return `NYSE:${clean}`;

    // Si viene con un preferredExchange explícito
    if (preferredExchange) {
        return `${preferredExchange.toUpperCase()}:${clean}`;
    }

    // Default general a NASDAQ
    return `NASDAQ:${clean}`;
}

export function TradingViewChartWidget({
    symbol,
    exchange,
    interval = 'D',
    height = 480,
    theme,
    allowSymbolChange = true,
    studies = ['MASimple@tv-basicstudies', 'RSI@tv-basicstudies'],
    className = '',
}: TradingViewChartWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);

    // Detectar tema si no se pasa explícito
    const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
        if (theme) return theme;
        if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        if (theme) {
            setCurrentTheme(theme);
            return;
        }
        const observer = new MutationObserver(() => {
            const isDark = document.documentElement.classList.contains('dark');
            setCurrentTheme(isDark ? 'dark' : 'light');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, [theme]);

    const canonicalSymbol = resolveTradingViewSymbol(symbol, exchange);

    useEffect(() => {
        if (!containerRef.current) return;
        setLoading(true);
        setHasError(false);

        // Limpiar contenido previo
        containerRef.current.innerHTML = '';

        const containerId = `tv_embed_${Math.random().toString(36).slice(2, 10)}`;
        const widgetContainer = document.createElement('div');
        widgetContainer.id = containerId;
        widgetContainer.style.width = '100%';
        widgetContainer.style.height = '100%';
        widgetContainer.style.minHeight = typeof height === 'number' ? `${height}px` : height;
        containerRef.current.appendChild(widgetContainer);

        let isMounted = true;
        let timeoutId: any = null;

        const initWidget = () => {
            if (!isMounted) return;
            try {
                if (typeof (window as any).TradingView === 'undefined') {
                    setHasError(true);
                    setLoading(false);
                    return;
                }

                new (window as any).TradingView.widget({
                    container_id: containerId,
                    autosize: true,
                    width: '100%',
                    height: '100%',
                    symbol: canonicalSymbol,
                    interval: interval,
                    timezone: 'America/Argentina/Buenos_Aires',
                    theme: currentTheme,
                    style: '1',
                    locale: 'es',
                    toolbar_bg: currentTheme === 'dark' ? '#09090b' : '#ffffff',
                    enable_publishing: false,
                    allow_symbol_change: allowSymbolChange,
                    save_image: true,
                    hide_side_toolbar: false,
                    withdateranges: true,
                    details: false,
                    hotlist: false,
                    calendar: false,
                    studies: studies,
                    support_host: 'https://www.tradingview.com',
                });

                timeoutId = setTimeout(() => {
                    if (isMounted) setLoading(false);
                }, 700);
            } catch (err) {
                console.error('Error inicializando TradingView widget:', err);
                if (isMounted) {
                    setHasError(true);
                    setLoading(false);
                }
            }
        };

        // Cargar script de TradingView si no existe
        if (typeof (window as any).TradingView === 'undefined') {
            const existingScript = document.getElementById('tradingview-widget-script');
            if (!existingScript) {
                const script = document.createElement('script');
                script.id = 'tradingview-widget-script';
                script.src = 'https://s3.tradingview.com/tv.js';
                script.async = true;
                script.onload = () => {
                    if (isMounted) initWidget();
                };
                script.onerror = () => {
                    if (isMounted) {
                        setHasError(true);
                        setLoading(false);
                    }
                };
                document.head.appendChild(script);
            } else {
                existingScript.addEventListener('load', initWidget, { once: true });
            }
        } else {
            initWidget();
        }

        return () => {
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [canonicalSymbol, interval, height, currentTheme, allowSymbolChange, retryKey]);

    return (
        <div className={`relative w-full rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm transition-all duration-300 ${className}`}>
            {/* Header del gráfico */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/20 text-xs">
                <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-foreground tracking-wide">{canonicalSymbol}</span>
                    <span className="text-muted-foreground hidden sm:inline">· TradingView Live Interactive</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setRetryKey(k => k + 1)}
                        title="Recargar gráfico"
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded font-mono">
                        {interval}
                    </span>
                </div>
            </div>

            {/* Container del widget */}
            <div
                ref={containerRef}
                style={{ height: typeof height === 'number' ? `${height}px` : height, minHeight: '380px' }}
                className="w-full relative"
            />

            {/* Loader overlay */}
            {loading && !hasError && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm transition-opacity">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                    <span className="text-xs font-medium text-muted-foreground">
                        Cargando gráfico interactivo de {symbol}...
                    </span>
                </div>
            )}

            {/* Error overlay */}
            {hasError && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/95 p-6 text-center">
                    <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                        No se pudo conectar con TradingView
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-sm mb-4">
                        El símbolo <strong className="text-foreground">{canonicalSymbol}</strong> no respondió o hubo una interrupción de red.
                    </p>
                    <button
                        type="button"
                        onClick={() => setRetryKey(k => k + 1)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reintentar carga
                    </button>
                </div>
            )}
        </div>
    );
}

export default memo(TradingViewChartWidget);
