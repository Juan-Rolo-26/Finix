import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Activity,
    LineChart,
    Search,
    Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import TradingViewChart from '@/components/TradingViewChart';
import TradingViewSymbolInfo from '@/components/TradingViewSymbolInfo';
import MarketDashboard, { type MarketDashboardData } from '@/components/markets/MarketDashboard';
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
                            <CardContent className="flex flex-col gap-6 p-6 md:p-8">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 w-full">
                                    <div className="flex-1 w-full relative">
                                        <TradingViewSymbolInfo symbol={selectedAsset?.symbol || 'NASDAQ:AAPL'} theme="dark" locale="es" />
                                    </div>

                                    <div className="shrink-0 pt-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="gap-2 bg-secondary/50 hover:bg-secondary/80 border-border/60 transition-all rounded-xl shadow-sm">
                                                    <Search className="w-4 h-4 text-muted-foreground" />
                                                    <span>Buscar Símbolo de TradingView</span>
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle>Buscar activo en TradingView</DialogTitle>
                                                </DialogHeader>
                                                <MarketAssetSearch onSelect={(sym) => {
                                                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); // hack close
                                                    handleOpenMarketSymbol(sym);
                                                }} />
                                            </DialogContent>
                                        </Dialog>
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
                            />
                        )}
                    </TabsContent>


                </Tabs>
            </div>
        </div>
    );
}

function MarketAssetSearch({ onSelect }: { onSelect: (symbol: string) => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.trim().length < 1) {
            setResults([]);
            return;
        }

        setLoading(true);
        const timer = setTimeout(() => {
            apiFetch(`/market/search?query=${encodeURIComponent(query)}`)
                .then(r => r.json())
                .then(d => {
                    if (Array.isArray(d)) setResults(d);
                })
                .finally(() => setLoading(false));
        }, 400);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="space-y-4 py-2">
            <Input
                placeholder="Buscar (Ej. AAPL, BYMA:GGAL, BTC)..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
                className="text-base h-12"
            />

            <div className="max-h-[300px] overflow-y-auto space-y-2">
                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                ) : null}
                {!loading && query.trim().length >= 1 && results.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground p-4">
                        No se encontraron resultados
                    </p>
                )}
                {!loading && results.map(r => (
                    <button
                        key={`${r.symbol}-${r.type}`}
                        onClick={() => onSelect(r.symbol)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors text-left"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="font-bold flex items-center gap-1.5 truncate">
                                {r.symbol}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{r.name}</p>
                        </div>
                        {r.type && <Badge variant="outline" className="shrink-0 uppercase text-[10px]">{r.type}</Badge>}
                    </button>
                ))}
            </div>
        </div>
    );
}
