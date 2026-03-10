import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Activity,
    ExternalLink,
    LineChart,
    Newspaper,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import TradingViewChart from '@/components/TradingViewChart';
import MarketDashboard, { type MarketDashboardData } from '@/components/markets/MarketDashboard';
import { useTranslation } from '@/i18n';

interface MarketAsset {
    symbol: string;
    name: string;
    type: string;
    exchange?: string;
}

interface QuoteData {
    inputSymbol?: string;
    symbol: string;
    price: number | null;
    change: number | null;
    updatedAt: string;
    unavailable?: boolean;
}

interface MarketNewsItem {
    title: string;
    link: string;
    publishedAt: string;
    source: string;
    summary: string;
    image?: string;
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

function getTypeColor(type: string) {
    const colors: Record<string, string> = {
        stock: 'border-sky-400/30 bg-sky-500/10 text-sky-200',
        crypto: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
        forex: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
        commodity: 'border-yellow-400/30 bg-yellow-500/10 text-yellow-100',
        etf: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
        other: 'border-border/50 bg-secondary/60 text-foreground',
    };
    return colors[type] || colors.other;
}

function formatTime(value?: string) {
    if (!value) return '--:--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(value?: string) {
    if (!value) return 'Sin actualizar';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin actualizar';

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

    if (diffMinutes < 1) return 'Hace instantes';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;

    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function formatQuotePrice(value: number | null) {
    if (value === null || !Number.isFinite(value)) return 'Sin datos';
    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: Math.abs(value) >= 100 ? 2 : 4,
        maximumFractionDigits: Math.abs(value) >= 100 ? 2 : 4,
    }).format(value);
}

function formatQuoteChange(value: number | null) {
    if (value === null || !Number.isFinite(value)) return 'Sin variacion';

    return `${new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: 'always',
    }).format(value)}%`;
}

function NewsListItem({
    item,
    compact = false,
}: {
    item: MarketNewsItem;
    compact?: boolean;
}) {
    const shouldShowSummary = !compact && item.summary && item.summary.trim().toLowerCase() !== item.title.trim().toLowerCase();

    return (
        <a
            href={item.link || '#'}
            target="_blank"
            rel="noreferrer"
            className={cn(
                'group flex gap-3 rounded-2xl border border-border/50 bg-background/30 p-3 transition-all hover:border-primary/30 hover:bg-background/50',
                compact ? 'items-start' : 'flex-col sm:flex-row'
            )}
        >
            {item.image && (
                <div className={cn('overflow-hidden rounded-xl bg-secondary', compact ? 'h-16 w-16 shrink-0' : 'h-32 w-full sm:h-24 sm:w-40 sm:shrink-0')}>
                    <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
            )}

            <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
                    <span>{item.source}</span>
                    <span className="text-border">/</span>
                    <span>{formatRelativeTime(item.publishedAt)}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                    <h3 className={cn('font-semibold leading-tight text-foreground transition-colors group-hover:text-primary', compact ? 'text-sm' : 'text-base')}>
                        {item.title}
                    </h3>
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                {shouldShowSummary && <p className="text-sm leading-6 text-muted-foreground">{item.summary}</p>}
            </div>
        </a>
    );
}

export default function Markets() {
    const t = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    const initialSymbolParam = searchParams.get('symbol');
    const symbolParam = searchParams.get('symbol')?.trim() || '';

    const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(
        initialSymbolParam ? buildFallbackAsset(initialSymbolParam) : DEFAULT_ASSET
    );
    const [dashboardData, setDashboardData] = useState<MarketDashboardData | null>(null);
    const [isDashboardLoading, setIsDashboardLoading] = useState(false);
    const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
    const [marketNews, setMarketNews] = useState<MarketNewsItem[]>([]);
    const [isNewsLoading, setIsNewsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(initialSymbolParam ? 'chart' : 'overview');
    const [chartInterval, setChartInterval] = useState('D');

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

    useEffect(() => {
        if (!selectedAsset) return;

        let cancelled = false;
        setQuoteData(null);

        const fetchQuote = async () => {
            try {
                const res = await apiFetch(`/market/quote?symbol=${encodeURIComponent(selectedAsset.symbol)}`);
                if (!cancelled && res.ok) {
                    const data = await res.json();
                    setQuoteData(data);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Quote error:', error);
                }
            }
        };

        fetchQuote();
        const interval = window.setInterval(fetchQuote, 30000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [selectedAsset]);

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        const fetchNews = async () => {
            try {
                setIsNewsLoading(true);
                const res = await apiFetch('/market/news', {
                    signal: controller.signal,
                });

                if (!controller.signal.aborted && !cancelled) {
                    const data = res.ok ? await res.json() : [];
                    setMarketNews(Array.isArray(data) ? data.slice(0, 10) : []);
                }
            } catch (error) {
                if (!controller.signal.aborted && !cancelled) {
                    console.error('Market news error:', error);
                    setMarketNews([]);
                }
            } finally {
                if (!controller.signal.aborted && !cancelled) {
                    setIsNewsLoading(false);
                }
            }
        };

        fetchNews();

        return () => {
            cancelled = true;
            controller.abort();
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
                    <TabsList className="grid h-auto w-full grid-cols-3 rounded-[24px] border border-border/50 bg-card/50 p-1.5">
                        <TabsTrigger
                            value="overview"
                            className="gap-2 rounded-[18px] py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                            <Activity className="h-4 w-4" />
                            {t.markets.tabs.overview}
                        </TabsTrigger>
                        <TabsTrigger
                            value="chart"
                            className="gap-2 rounded-[18px] py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                            <LineChart className="h-4 w-4" />
                            {t.markets.tabs.chart}
                        </TabsTrigger>
                        <TabsTrigger
                            value="news"
                            className="gap-2 rounded-[18px] py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                            <Newspaper className="h-4 w-4" />
                            {t.markets.tabs.news}
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
                            <CardContent className="flex flex-col gap-6 p-6 md:p-8">
                                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {selectedAsset?.exchange && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-border/60 bg-background/60 uppercase tracking-[0.18em]"
                                                >
                                                    {selectedAsset.exchange}
                                                </Badge>
                                            )}
                                            {selectedAsset?.type && (
                                                <Badge className={getTypeColor(selectedAsset.type)}>
                                                    {selectedAsset.type}
                                                </Badge>
                                            )}
                                            <Badge
                                                variant="outline"
                                                className="border-border/60 bg-background/40 text-muted-foreground"
                                            >
                                                Actualizado {formatRelativeTime(quoteData?.updatedAt).toLowerCase()}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2">
                                            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                                                {selectedAsset?.name || 'Mercado'}
                                            </h1>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedAsset?.symbol || 'Selecciona un activo para abrir el chart.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3 xl:min-w-[560px]">
                                        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                                                Precio actual
                                            </p>
                                            <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                                                {formatQuotePrice(quoteData?.price ?? null)}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                                                Variacion
                                            </p>
                                            <p
                                                className={cn(
                                                    'mt-3 text-2xl font-semibold tracking-tight',
                                                    (quoteData?.change ?? 0) > 0
                                                        ? 'text-emerald-300'
                                                        : (quoteData?.change ?? 0) < 0
                                                            ? 'text-rose-300'
                                                            : 'text-foreground'
                                                )}
                                            >
                                                {formatQuoteChange(quoteData?.change ?? null)}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                                                Ultima lectura
                                            </p>
                                            <p className="mt-3 text-lg font-semibold text-foreground">
                                                {formatRelativeTime(quoteData?.updatedAt)}
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {formatTime(quoteData?.updatedAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px w-full bg-border/60" />

                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
                                            Intervalos
                                        </p>
                                        <p className="text-sm text-muted-foreground">
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
                                                        ? 'border-primary/40 bg-primary text-primary-foreground'
                                                        : 'border-border/60 bg-background/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
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
                                height={1320}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="news" className="space-y-4">
                        <Card className="rounded-[30px] border-border/60 bg-card/60 backdrop-blur-xl">
                            <CardHeader className="pb-4">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-2xl">Noticias de mercado</CardTitle>
                                        <CardDescription className="mt-2 text-base">
                                            Argentina primero, algunas del exterior y siempre en espanol.
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="border-border/60 bg-background/50 uppercase tracking-[0.18em]">
                                        {marketNews.length} items
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isNewsLoading ? (
                                    Array.from({ length: 4 }).map((_, index) => (
                                        <div
                                            key={`news-full-skeleton-${index}`}
                                            className="h-36 animate-pulse rounded-3xl border border-border/50 bg-secondary/30"
                                        />
                                    ))
                                ) : marketNews.length > 0 ? (
                                    marketNews.map((item) => (
                                        <NewsListItem key={`full-${item.link}-${item.title}`} item={item} />
                                    ))
                                ) : (
                                    <div className="rounded-3xl border border-border/60 bg-background/40 px-5 py-10 text-center text-muted-foreground">
                                        No encontramos noticias recientes del mercado.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
