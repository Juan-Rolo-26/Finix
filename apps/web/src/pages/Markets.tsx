import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ProGate } from '@/components/ProGate';
import {
    Activity,
    LineChart,
    Search,
    Loader2,
    CandlestickChart,
    TrendingUp,
    Globe,
    Coins,
    BarChart3,
    ArrowUpRight,
    X,
    Sparkles,
    SearchX,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import TradingViewChart from '@/components/TradingViewChart';
import TradingViewSymbolInfo from '@/components/TradingViewSymbolInfo';
import MarketDashboard, { type MarketDashboardData } from '@/components/markets/MarketDashboard';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useTranslation } from '@/i18n';

interface MarketAsset {
    symbol: string;
    name: string;
    type: string;
    exchange?: string;
}


const DEFAULT_ASSET: MarketAsset = {
    symbol: 'NASDAQ:AAPL',
    name: 'Apple Inc.',
    type: 'stock',
    exchange: 'NASDAQ',
};

const CHART_INTERVALS = [
    { value: '15', label: '15m' },
    { value: '60', label: '1H' },
    { value: '240', label: '4H' },
    { value: 'D', label: '1D' },
    { value: 'W', label: '1S' },
];

function toShortSymbol(symbol: string) {
    const clean = (symbol || '').trim().toUpperCase();
    if (!clean) return '';
    return clean.includes(':') ? clean.split(':').pop() || clean : clean;
}

function inferExchange(symbol: string) {
    const clean = (symbol || '').trim().toUpperCase();
    return clean.includes(':') ? clean.split(':')[0] : undefined;
}

function inferType(symbol: string) {
    const clean = (symbol || '').trim().toUpperCase();
    const short = toShortSymbol(clean);

    if (clean.includes('BINANCE') || clean.includes('CRYPTO') || short.endsWith('USDT')) {
        return 'crypto';
    }
    if (clean.includes('OANDA') || clean.includes('OIL') || short.startsWith('XAU') || short.startsWith('XAG')) {
        return 'commodity';
    }
    if (clean.includes('FX:') || (/^[A-Z]{6}$/.test(short) && short.endsWith('USD'))) {
        return 'forex';
    }
    if (['SPY', 'QQQ', 'VTI', 'GLD', 'VNQ'].includes(short)) {
        return 'etf';
    }
    return 'stock';
}

function buildFallbackAsset(symbol: string): MarketAsset {
    const normalized = (symbol || '').trim().toUpperCase();
    const short = toShortSymbol(normalized);

    return {
        symbol: normalized,
        name: short || 'Activo',
        type: inferType(normalized),
        exchange: inferExchange(normalized),
    };
}





export default function Markets() {
    const t = useTranslation();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const isPro = (user as any)?.plan === 'PRO' || (user as any)?.accountType === 'PRO' || (user as any)?.role === 'ADMIN' || (user as any)?.isPro || (user as any)?.subscriptionTier === 'pro';

    if (!isPro) {
        return (
            <div className="min-h-[calc(100vh-60px)] flex flex-col flex-1 bg-background">
                <ProGate
                    title="Funcionalidad Exclusiva PRO"
                    description="La sección de Mercados es exclusiva para usuarios con Finix PRO. Mejorá tu plan para acceder a cotizaciones en tiempo real y análisis técnico avanzado."
                    buttonText="Activar PRO"
                    onUpgrade={() => navigate('/pro')}
                />
            </div>
        );
    }

    const { theme } = usePreferencesStore();
    const isLight = theme === 'light' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);
    const widgetTheme = isLight ? 'light' : 'dark';

    const [searchParams, setSearchParams] = useSearchParams();

    const initialSymbolParam = searchParams.get('symbol');
    const symbolParam = searchParams.get('symbol')?.trim() || '';

    const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(
        initialSymbolParam ? buildFallbackAsset(initialSymbolParam) : DEFAULT_ASSET
    );
    const [dashboardData, setDashboardData] = useState<MarketDashboardData | null>(null);
    const [isDashboardLoading, setIsDashboardLoading] = useState(false);

    const [activeTab, setActiveTab] = useState(initialSymbolParam ? 'chart' : 'overview');
    const [chartInterval, setChartInterval] = useState('D');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsSearchOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    useEffect(() => {
        const rawSymbol = symbolParam;
        if (!rawSymbol) {
            if (!selectedAsset) {
                setSelectedAsset(DEFAULT_ASSET);
            }
            return;
        }

        const normalized = rawSymbol.toUpperCase();
        const alreadyResolved = Boolean(
            selectedAsset &&
            (
                (normalized.includes(':') && selectedAsset.symbol.toUpperCase() === normalized) ||
                (!normalized.includes(':') &&
                    selectedAsset.symbol.includes(':') &&
                    toShortSymbol(selectedAsset.symbol).toUpperCase() === normalized)
            )
        );

        if (alreadyResolved) {
            return;
        }

        let cancelled = false;
        const controller = new AbortController();

        const resolveAsset = async () => {
            try {
                const res = await apiFetch(`/market/search?query=${encodeURIComponent(normalized)}`, {
                    signal: controller.signal,
                });
                const data = res.ok ? await res.json() : [];
                const options = Array.isArray(data) ? data : [];
                const exactMatch = options.find((asset) => {
                    const full = asset.symbol.toUpperCase();
                    const short = toShortSymbol(asset.symbol).toUpperCase();
                    return full === normalized || short === normalized;
                });

                if (!cancelled) {
                    setSelectedAsset(exactMatch || options[0] || buildFallbackAsset(normalized));
                }
            } catch (error) {
                if (!controller.signal.aborted && !cancelled) {
                    console.error('Resolve symbol error:', error);
                    setSelectedAsset(buildFallbackAsset(normalized));
                }
            }
        };

        resolveAsset();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [selectedAsset, symbolParam]);

    useEffect(() => {
        let disposed = false;
        let currentController: AbortController | null = null;

        const fetchDashboard = async (showLoader: boolean) => {
            if (showLoader) {
                setIsDashboardLoading(true);
            }

            currentController?.abort();
            const controller = new AbortController();
            currentController = controller;

            try {
                const res = await apiFetch('/market/dashboard', {
                    signal: controller.signal,
                });
                const data = res.ok ? await res.json() : null;

                if (!controller.signal.aborted && !disposed) {
                    setDashboardData(data);
                }
            } catch (error) {
                if (!controller.signal.aborted && !disposed) {
                    console.error('Market dashboard error:', error);
                }
            } finally {
                if (!controller.signal.aborted && !disposed) {
                    setIsDashboardLoading(false);
                }
            }
        };

        fetchDashboard(true);
        const intervalId = window.setInterval(() => fetchDashboard(false), 60000);

        return () => {
            disposed = true;
            currentController?.abort();
            window.clearInterval(intervalId);
        };
    }, []);





    const handleOpenMarketSymbol = (symbol: string) => {
        if (!symbol) return;

        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('symbol', symbol);
        setSearchParams(nextParams);
        setActiveTab('chart');
    };

    return (
        <div className="relative w-full overflow-hidden pb-20">
            <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_35%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.18),transparent_30%),linear-gradient(180deg,rgba(5,10,8,0.95),transparent_70%)]" />

            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-4 md:px-6 lg:px-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid h-auto w-full max-w-xl mx-auto mb-4 grid-cols-2 rounded-[24px] border border-border/40 bg-secondary/30 p-1.5 backdrop-blur-sm">
                        <TabsTrigger
                            value="overview"
                            className="gap-2 rounded-[18px] py-2.5 text-muted-foreground transition-all focus:ring-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                        >
                            <Activity className="h-4 w-4" />
                            {t.markets.tabs.overview}
                        </TabsTrigger>
                        <TabsTrigger
                            value="chart"
                            className="gap-2 rounded-[18px] py-2.5 text-muted-foreground transition-all focus:ring-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                        >
                            <LineChart className="h-4 w-4" />
                            {t.markets.tabs.chart}
                        </TabsTrigger>

                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <MarketDashboard
                            data={dashboardData}
                            loading={isDashboardLoading}
                            onSelectSymbol={handleOpenMarketSymbol}
                        />
                    </TabsContent>

                    <TabsContent value="chart" className="space-y-6">
                        <Card className="rounded-[32px] border-border/60 bg-card/60 shadow-sm backdrop-blur-xl">
                            <CardContent className="flex flex-col gap-4 p-5 md:p-6">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 w-full">
                                    <div className="flex-1 w-full relative z-10 mb-2">
                                        <div className="w-full">
                                            <TradingViewSymbolInfo symbol={selectedAsset?.symbol || 'NASDAQ:AAPL'} theme={widgetTheme} locale="es" />
                                        </div>
                                    </div>

                                    <div className="shrink-0 pt-2 relative z-20">
                                        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="gap-2.5 h-11 bg-card/70 hover:bg-card border-border/70 hover:border-emerald-500/40 transition-all rounded-2xl shadow-sm px-4 group"
                                                >
                                                    <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                                                    <span className="text-zinc-800 dark:text-zinc-200 font-semibold text-sm">Buscar Símbolo</span>
                                                    <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-lg border border-border/80 bg-muted/60 px-2 py-0.5 text-[10px] font-mono text-muted-foreground shadow-xs">
                                                        <span>⌘</span>K
                                                    </kbd>
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-xl p-0 overflow-hidden border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl shadow-emerald-950/20 rounded-[28px] gap-0">
                                                <MarketAssetSearch
                                                    onSelect={(sym) => {
                                                        setIsSearchOpen(false);
                                                        handleOpenMarketSymbol(sym);
                                                    }}
                                                />
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>

                                <div className="h-px w-full bg-border/60" />

                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="space-y-1.5 mt-1">
                                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                                            Intervalos
                                        </p>
                                        <p className="text-base font-medium text-zinc-600 dark:text-zinc-300">
                                            Cambia la temporalidad sin perder el contexto del activo ni salir del chart.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {CHART_INTERVALS.map((interval) => (
                                            <button
                                                key={interval.value}
                                                type="button"
                                                onClick={() => setChartInterval(interval.value)}
                                                className={cn(
                                                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                                                    chartInterval === interval.value
                                                        ? 'border-foreground/20 bg-foreground text-background shadow-sm'
                                                        : 'border-border/60 bg-background/50 text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                                                )}
                                            >
                                                {interval.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {selectedAsset && (
                            <TradingViewChart
                                symbol={selectedAsset.symbol}
                                interval={chartInterval}
                                height={760}
                                theme={widgetTheme}
                            />
                        )}
                    </TabsContent>


                </Tabs>
            </div>
        </div>
    );
}

const POPULAR_ASSETS = [
    { symbol: 'NASDAQ:NVDA', name: 'NVIDIA Corporation', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'BYMA:GGAL', name: 'Grupo Financiero Galicia S.A.', type: 'dr', exchange: 'BYMA' },
    { symbol: 'BYMA:YPFD', name: 'YPF Sociedad Anónima', type: 'stock', exchange: 'BYMA' },
    { symbol: 'BYMA:MELI', name: 'MercadoLibre, Inc. CEDEAR', type: 'dr', exchange: 'BYMA' },
    { symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin / TetherUS', type: 'crypto', exchange: 'BINANCE' },
    { symbol: 'BINANCE:ETHUSDT', name: 'Ethereum / TetherUS', type: 'crypto', exchange: 'BINANCE' },
    { symbol: 'AMEX:SPY', name: 'SPDR S&P 500 ETF Trust', type: 'etf', exchange: 'AMEX' },
    { symbol: 'SP:SPX', name: 'S&P 500 Index', type: 'index', exchange: 'S&P' },
    { symbol: 'NASDAQ:TSLA', name: 'Tesla, Inc.', type: 'stock', exchange: 'NASDAQ' },
];

const FILTER_TAGS = [
    { id: 'all', label: 'Todos' },
    { id: 'stock', label: 'Acciones' },
    { id: 'dr', label: 'CEDEARs' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'etf', label: 'ETFs' },
    { id: 'index', label: 'Índices' },
];

function getAssetTypeBadge(type?: string) {
    const t = (type || 'stock').toLowerCase();
    if (t === 'stock') {
        return {
            label: 'STOCK',
            className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            icon: TrendingUp,
            iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
    }
    if (t === 'dr') {
        return {
            label: 'CEDEAR / DR',
            className: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
            icon: Globe,
            iconClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        };
    }
    if (t === 'crypto') {
        return {
            label: 'CRYPTO',
            className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
            icon: Coins,
            iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
    }
    if (t === 'etf') {
        return {
            label: 'ETF',
            className: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
            icon: BarChart3,
            iconClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
        };
    }
    if (t === 'index') {
        return {
            label: 'ÍNDICE',
            className: 'border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400',
            icon: Activity,
            iconClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
        };
    }
    return {
        label: t.toUpperCase(),
        className: 'border-border/60 bg-muted/50 text-muted-foreground',
        icon: TrendingUp,
        iconClass: 'bg-muted text-muted-foreground border-border/40',
    };
}

function parseSymbol(symbolString: string, fallbackExchange?: string) {
    const clean = (symbolString || '').trim();
    const colonIndex = clean.indexOf(':');
    if (colonIndex > 0) {
        return {
            exchange: clean.slice(0, colonIndex),
            ticker: clean.slice(colonIndex + 1),
        };
    }
    return {
        exchange: fallbackExchange || inferExchange(clean) || '',
        ticker: clean,
    };
}

function MarketAssetSearch({ onSelect }: { onSelect: (symbol: string) => void }) {
    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (query.trim().length < 1) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const timer = setTimeout(() => {
            apiFetch(`/market/search?query=${encodeURIComponent(query)}`)
                .then((r) => r.json())
                .then((d) => {
                    if (Array.isArray(d)) {
                        setResults(d);
                        setSelectedIndex(0);
                    }
                })
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, 280);

        return () => clearTimeout(timer);
    }, [query]);

    // Filter items based on active category
    const displayList = (query.trim().length >= 1 ? results : POPULAR_ASSETS).filter((item) => {
        if (activeFilter === 'all') return true;
        const itemType = (item.type || inferType(item.symbol)).toLowerCase();
        if (activeFilter === 'stock') return itemType === 'stock';
        if (activeFilter === 'dr') return itemType === 'dr';
        if (activeFilter === 'crypto') return itemType === 'crypto';
        if (activeFilter === 'etf') return itemType === 'etf';
        if (activeFilter === 'index') return itemType === 'index';
        return true;
    });

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (displayList.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < displayList.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayList.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (displayList[selectedIndex]) {
                onSelect(displayList[selectedIndex].symbol);
            } else if (query.trim()) {
                onSelect(query.trim().toUpperCase());
            }
        }
    };

    return (
        <div className="flex flex-col max-h-[85vh] w-full">
            {/* Header */}
            <div className="relative border-b border-border/50 px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                        <CandlestickChart className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                            Buscar activo en TradingView
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Explora acciones globales, CEDEARs, cripto e índices para tu gráfico
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Input Container */}
            <div className="px-6 pt-4 pb-2">
                <div className="relative flex items-center">
                    <Search className="absolute left-4 h-4 w-4 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Buscar ticker o empresa (ej: NIO, AAPL, GGAL, BTC)..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        spellCheck={false}
                        autoComplete="off"
                        className="w-full h-12 rounded-2xl border border-border/80 bg-secondary/30 dark:bg-secondary/20 pl-11 pr-11 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-emerald-500/80 focus:bg-background focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                    />
                    {loading ? (
                        <div className="absolute right-4 flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                        </div>
                    ) : query ? (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery('');
                                inputRef.current?.focus();
                            }}
                            className="absolute right-3.5 rounded-full p-1 text-muted-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                            aria-label="Limpiar búsqueda"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 px-6 py-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {FILTER_TAGS.map((tag) => (
                    <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                            setActiveFilter(tag.id);
                            setSelectedIndex(0);
                        }}
                        className={cn(
                            'px-3 py-1 text-xs font-semibold rounded-full transition-all shrink-0 select-none',
                            activeFilter === tag.id
                                ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40'
                        )}
                    >
                        {tag.label}
                    </button>
                ))}
            </div>

            {/* Section label */}
            <div className="px-6 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {query.trim().length >= 1 ? 'Resultados de búsqueda' : 'Activos destacados'}
            </div>

            {/* Results List */}
            <div className="max-h-[340px] overflow-y-auto px-4 py-1.5 space-y-1.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 pr-2">
                {!loading && query.trim().length >= 1 && displayList.length === 0 && (
                    <div className="py-8 px-4 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
                            <SearchX className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                            No se encontraron resultados para "{query}"
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                            Verifica que el ticker esté bien escrito o pulsa el botón para buscarlo directamente en TradingView.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 gap-2 rounded-xl border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => onSelect(query.trim().toUpperCase())}
                        >
                            <span>Cargar "{query.trim().toUpperCase()}" en el gráfico</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}

                {displayList.map((r, index) => {
                    const badgeInfo = getAssetTypeBadge(r.type);
                    const { exchange, ticker } = parseSymbol(r.symbol, r.exchange);
                    const isSelected = index === selectedIndex;
                    const IconComponent = badgeInfo.icon;

                    return (
                        <button
                            key={`${r.symbol}-${r.type}-${index}`}
                            type="button"
                            onClick={() => onSelect(r.symbol)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={cn(
                                'w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left group',
                                isSelected
                                    ? 'bg-emerald-500/8 dark:bg-emerald-500/12 border-emerald-500/40 shadow-xs'
                                    : 'bg-transparent border-transparent hover:bg-secondary/60 hover:border-border/60'
                            )}
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', badgeInfo.iconClass)}>
                                    <IconComponent className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-foreground tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                            {ticker}
                                        </span>
                                        {exchange && (
                                            <span className="rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase text-muted-foreground">
                                                {exchange}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{r.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                <Badge
                                    variant="outline"
                                    className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-lg border uppercase tracking-wider', badgeInfo.className)}
                                >
                                    {badgeInfo.label}
                                </Badge>
                                <ArrowUpRight
                                    className={cn(
                                        'h-4 w-4 text-emerald-500 transition-all duration-150',
                                        isSelected ? 'opacity-100 translate-x-0.5 -translate-y-0.5' : 'opacity-0 -translate-x-1 translate-y-1'
                                    )}
                                />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-border/50 bg-secondary/25 text-[11px] text-muted-foreground mt-2">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded border border-border/70 bg-muted/70 font-mono text-[10px]">↑↓</kbd>
                        Navegar
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded border border-border/70 bg-muted/70 font-mono text-[10px]">↵</kbd>
                        Seleccionar
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded border border-border/70 bg-muted/70 font-mono text-[10px]">ESC</kbd>
                        Cerrar
                    </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 font-medium">
                    <Sparkles className="h-3 w-3 text-emerald-500" />
                    <span>TradingView</span>
                </div>
            </div>
        </div>
    );
}
