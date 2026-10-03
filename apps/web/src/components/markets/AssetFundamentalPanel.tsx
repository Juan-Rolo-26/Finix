import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { financialNumber } from '@finix/shared';
import {
    Activity,
    Building2,
    ExternalLink,
    Loader2,
    RefreshCw,
    Wallet,
    Newspaper,
    TrendingUp,
    Bookmark,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import SymbolLogo from '@/components/SymbolLogo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AddToWatchlistModal from '@/components/watchlist/AddToWatchlistModal';

function number(value: number | null | undefined, digits = 2) {
    if (
        value === null ||
        value === undefined ||
        financialNumber(value) === undefined
    )
        return '—';
    return new Intl.NumberFormat('es-AR', {
        maximumFractionDigits: digits,
    }).format(Number(value));
}

function money(value: number | null | undefined, currency: string | null = 'USD') {
    if (
        value === null ||
        value === undefined ||
        financialNumber(value) === undefined
    )
        return '—';
    if (!currency || !/^[A-Z]{3}$/.test(currency)) return number(value);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        currencyDisplay: currency === 'USD' ? 'symbol' : 'code',
        maximumFractionDigits: 2,
    }).format(Number(value));
}

function compactMoney(value: number | null | undefined, currency: string | null = 'USD') {
    if (
        value === null ||
        value === undefined ||
        financialNumber(value) === undefined
    )
        return '—';
    const prefix = currency === 'USD' ? '$' : currency && /^[A-Z]{3}$/.test(currency) ? currency + ' ' : '';
    const absolute = Math.abs(Number(value));
    if (absolute >= 1e12) return `${prefix}${(Number(value) / 1e12).toFixed(2)}T`;
    if (absolute >= 1e9) return `${prefix}${(Number(value) / 1e9).toFixed(2)}B`;
    if (absolute >= 1e6) return `${prefix}${(Number(value) / 1e6).toFixed(2)}M`;
    return money(value, currency);
}

function Metric({ label, value }: { label: string; value: string }) {
    if (!value || value === '—' || value === '—%') return null;
    return (
        <div className="market-fundamental-metric">
            <p className="market-metric-label">
                {label}
            </p>
            <p className="mt-2 text-foreground">{value}</p>
        </div>
    );
}

export default function AssetFundamentalPanel({ symbol }: { symbol: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [news, setNews] = useState<any[]>([]);
    const [candles, setCandles] = useState<any[]>([]);
    const [isAddToWatchlistOpen, setIsAddToWatchlistOpen] = useState(false);
    const activeRequest = useRef<AbortController | null>(null);
    const ticker = useMemo(
        () =>
            symbol
                .split(':')
                .pop()
                ?.replace(/[^A-Z0-9.\-]/gi, '')
                .toUpperCase() || symbol,
        [symbol],
    );
    const exchange = symbol.includes(':')
        ? symbol.split(':')[0].toUpperCase()
        : 'NASDAQ';

    const load = useCallback(async (force = false) => {
        activeRequest.current?.abort();
        const request = new AbortController();
        activeRequest.current = request;
        force ? setRefreshing(true) : setLoading(true);
        setError('');
        try {
            const query = new URLSearchParams({
                provider: 'alphavantage',
                fallback: 'true',
                tvSymbol: symbol,
            });
            if (force) query.set('force', 'true');
            const [response, newsResponse, candlesResponse] = await Promise.all(
                [
                    apiFetch(
                        `/fundamental/${encodeURIComponent(ticker)}?${query.toString()}`,
                        { signal: request.signal },
                    ).catch(() => null),
                    apiFetch(
                        `/market/news?symbol=${encodeURIComponent(ticker)}`,
                        { signal: request.signal },
                    ).catch(() => null),
                    apiFetch(
                        `/market/candles?symbol=${encodeURIComponent(symbol)}&interval=1d&range=6mo`,
                        { signal: request.signal },
                    ).catch(() => null),
                ],
            );
            if (request.signal.aborted) return;
            if (response?.ok) {
                const fundamentalData = await response.json();
                if (request.signal.aborted) return;
                setData(fundamentalData);
            } else {
                if (!force) setData(null);
                setError(
                    'Los fundamentales están temporalmente en actualización. El gráfico y los datos de mercado siguen disponibles.',
                );
            }
            if (newsResponse?.ok) {
                const newsData = await newsResponse.json();
                if (request.signal.aborted) return;
                setNews(Array.isArray(newsData) ? newsData.slice(0, 5) : []);
            }
            if (candlesResponse?.ok) {
                const candleData = await candlesResponse.json();
                if (request.signal.aborted) return;
                const rawCandles = Array.isArray(candleData)
                    ? candleData
                    : Array.isArray(candleData?.candles)
                      ? candleData.candles
                      : Array.isArray(candleData?.data)
                        ? candleData.data
                        : [];
                setCandles(
                    rawCandles
                        .filter((item: any) =>
                            financialNumber(item.close) !== undefined && Number(item.close) > 0,
                        )
                        .slice(-180),
                );
            }
        } catch (err: any) {
            if (request.signal.aborted) return;
            setError(
                err?.message || 'No se pudo cargar la información del activo',
            );
        } finally {
            if (!request.signal.aborted) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, [ticker, symbol]);

    useEffect(() => {
        setData(null);
        setNews([]);
        setCandles([]);
        void load();
        return () => activeRequest.current?.abort();
    }, [load]);

    if (loading)
        return (
            <Card className="rounded-lg border-border/60 bg-card/60">
                <CardContent className="flex min-h-40 items-center justify-center gap-2 text-[16px] text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />{' '}
                    Cargando información fundamental…
                </CardContent>
            </Card>
        );

    if (!data)
        return (
            <Card className="rounded-lg border-border/60 bg-card/60">
                <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                    <p className="text-[16px] text-muted-foreground">
                        {error || 'No hay información financiera disponible para este activo.'}
                    </p>
                    <Button variant="outline" onClick={() => void load(true)}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
                    </Button>
                </CardContent>
            </Card>
        );

    const metrics = data.metrics || {};
    const latestIncome = data.statements?.incomeStatement?.[0] || {};
    const latestBalance = data.statements?.balanceSheet?.[0] || {};
    const latestCash = data.statements?.cashFlow?.[0] || {};
    const hasValues = (values: unknown[]) => values.some(value => financialNumber(value) !== undefined);
    const hasMetrics = hasValues([metrics.marketCap, metrics.enterpriseValue, metrics.peRatio, metrics.roe, metrics.roic, metrics.debtToEquity]);
    const hasIncome = hasValues([latestIncome.revenue, latestIncome.netIncome, latestIncome.ebitda, latestIncome.eps]);
    const hasBalance = hasValues([latestBalance.totalAssets, latestBalance.totalLiabilities, latestBalance.cashAndEquivalents, latestBalance.totalDebt]);
    const hasCash = hasValues([latestCash.operatingCashFlow, metrics.freeCashFlow, latestCash.freeCashFlow, metrics.netMargin, metrics.revenueGrowthCagr]);
    const source =
        data.source?.providersTried?.join(', ') ||
        'Alpha Vantage / fallback Finix';
    const alphaSpreadUrl = `https://www.alphaspread.com/security/${exchange}/${ticker.toLowerCase()}/discount-rate`;
    const closes = candles.map((item) => Number(item.close));
    const minClose = Math.min(...closes);
    const maxClose = Math.max(...closes);
    const chartPoints = closes
        .map(
            (value, index) =>
                `${(index / Math.max(1, closes.length - 1)) * 100},${90 - ((value - minClose) / Math.max(0.0001, maxClose - minClose)) * 78}`,
        )
        .join(' ');

    return (
        <section className="market-fundamentals space-y-5">
            {error && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[16px] text-amber-700 dark:text-amber-300">
                    {error}{' '}
                    <button
                        type="button"
                        onClick={() => void load(true)}
                        className="ml-2 font-semibold underline"
                    >
                        Actualizar
                    </button>
                </div>
            )}
            <Card className="market-fundamentals-band">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-border/40 pb-4">
                    <div className="flex items-center gap-3">
                        <SymbolLogo symbol={symbol} size={48} />
                        <div>
                            <CardTitle className="text-[18px]">
                                Información del activo
                            </CardTitle>
                            <p className="mt-1 text-[14px] text-muted-foreground">
                                {data.instrument?.name || ticker} · {ticker} ·{' '}
                                {data.instrument?.exchange || exchange}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddToWatchlistOpen(true)}
                            className="market-icon-action"
                            title="Agregar a seguimiento"
                            aria-label="Agregar a seguimiento"
                        >
                            <Bookmark size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void load(true)}
                            disabled={refreshing}
                            className="market-icon-action"
                            title="Actualizar fundamentales"
                            aria-label="Actualizar fundamentales"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                            />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5 p-5">
                    {!hasMetrics && !hasIncome && !hasBalance && !hasCash && <p className="text-muted-foreground">No hay información financiera disponible para este activo.</p>}
                    {hasMetrics && <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                        <Metric
                            label="Capitalización"
                            value={compactMoney(metrics.marketCap)}
                        />
                        <Metric
                            label="Enterprise value"
                            value={compactMoney(metrics.enterpriseValue)}
                        />
                        <Metric label="P/E" value={number(metrics.peRatio)} />
                        <Metric
                            label="ROE"
                            value={
                                metrics.roe == null
                                    ? '—'
                                    : `${number(metrics.roe)}%`
                            }
                        />
                        <Metric
                            label="ROIC"
                            value={
                                metrics.roic == null
                                    ? '—'
                                    : `${number(metrics.roic)}%`
                            }
                        />
                        <Metric
                            label="Deuda / patrimonio"
                            value={number(metrics.debtToEquity)}
                        />
                    </div>}

                    {(hasIncome || hasBalance || hasCash) && <div className="grid gap-4 lg:grid-cols-3">
                        {hasIncome && <Card className="market-financial-band">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-[16px]">
                                    <Building2 className="h-4 w-4 text-emerald-500" />{' '}
                                    Estado de resultados
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">{latestIncome.date || ''}{latestIncome.date ? ' · ' : ''}{latestIncome.currency || 'Moneda no informada'}</p>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-2 text-[14px]">
                                <Metric
                                    label="Ingresos"
                                    value={compactMoney(latestIncome.revenue, latestIncome.currency ?? null)}
                                />
                                <Metric
                                    label="Resultado neto"
                                    value={compactMoney(latestIncome.netIncome, latestIncome.currency ?? null)}
                                />
                                <Metric
                                    label="EBITDA"
                                    value={compactMoney(latestIncome.ebitda, latestIncome.currency ?? null)}
                                />
                                <Metric
                                    label="EPS"
                                    value={money(latestIncome.eps, latestIncome.currency ?? null)}
                                />
                            </CardContent>
                        </Card>}
                        {hasBalance && <Card className="market-financial-band">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-[16px]">
                                    <Wallet className="h-4 w-4 text-emerald-500" />{' '}
                                    Balance
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">{latestBalance.date || ''}{latestBalance.date ? ' · ' : ''}{latestBalance.currency || 'Moneda no informada'}</p>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-2 text-[14px]">
                                <Metric
                                    label="Activos"
                                    value={compactMoney(
                                        latestBalance.totalAssets, latestBalance.currency ?? null,
                                    )}
                                />
                                <Metric
                                    label="Pasivos"
                                    value={compactMoney(
                                        latestBalance.totalLiabilities, latestBalance.currency ?? null,
                                    )}
                                />
                                <Metric
                                    label="Caja"
                                    value={compactMoney(
                                        latestBalance.cashAndEquivalents, latestBalance.currency ?? null,
                                    )}
                                />
                                <Metric
                                    label="Deuda"
                                    value={compactMoney(
                                        latestBalance.totalDebt, latestBalance.currency ?? null,
                                    )}
                                />
                            </CardContent>
                        </Card>}
                        {hasCash && <Card className="market-financial-band">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-[16px]">
                                    <Activity className="h-4 w-4 text-emerald-500" />{' '}
                                    Flujo y calidad
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">{latestCash.date || ''}{latestCash.date ? ' · ' : ''}{latestCash.currency || 'Moneda no informada'}</p>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-2 text-[14px]">
                                <Metric
                                    label="Flujo operativo"
                                    value={compactMoney(
                                        latestCash.operatingCashFlow, latestCash.currency ?? null,
                                    )}
                                />
                                <Metric
                                    label="Free cash flow"
                                    value={compactMoney(
                                        metrics.freeCashFlow ??
                                            latestCash.freeCashFlow, latestCash.currency ?? null,
                                    )}
                                />
                                <Metric
                                    label="Margen neto"
                                    value={
                                        metrics.netMargin == null
                                            ? '—'
                                            : `${number(metrics.netMargin)}%`
                                    }
                                />
                                <Metric
                                    label="Crecimiento CAGR"
                                    value={
                                        metrics.revenueGrowthCagr == null
                                            ? '—'
                                            : `${number(metrics.revenueGrowthCagr)}%`
                                    }
                                />
                            </CardContent>
                        </Card>}
                    </div>}

                    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
                        <Card className="market-financial-band">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-[16px]">
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />{' '}
                                    Evolución de precio · 6 meses
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {candles.length > 1 ? (
                                    <>
                                        <div className="h-40 rounded-md bg-gradient-to-b from-emerald-500/10 to-transparent p-2">
                                            <svg
                                                viewBox="0 0 100 100"
                                                preserveAspectRatio="none"
                                                className="h-full w-full"
                                            >
                                                <polyline
                                                    points={chartPoints}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    vectorEffect="non-scaling-stroke"
                                                    className="text-emerald-500"
                                                />
                                            </svg>
                                        </div>
                                        <div className="mt-2 flex justify-between text-[12px] text-muted-foreground">
                                            <span>Mín. {money(minClose)}</span>
                                            <span>Máx. {money(maxClose)}</span>
                                            <span>
                                                Último{' '}
                                                {money(
                                                    closes[closes.length - 1],
                                                )}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="py-12 text-center text-[14px] text-muted-foreground">
                                        No hay histórico disponible.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="market-financial-band">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                                <CardTitle className="flex items-center gap-2 text-[16px]">
                                    <Newspaper className="h-4 w-4 text-emerald-500" />
                                    <span>
                                        Noticias relacionadas · {ticker}
                                    </span>
                                </CardTitle>
                                <a
                                    href={alphaSpreadUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                                >
                                    <span>AlphaSpread</span>
                                    <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {news.length ? (
                                    <>
                                        {news.map((item: any, index) => (
                                            <a
                                                key={item.id || index}
                                                href={
                                                    item.url ||
                                                    item.link ||
                                                    alphaSpreadUrl
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block border-b border-border/40 pb-2.5 last:border-0 group transition-colors"
                                            >
                                                <p className="line-clamp-2 text-[14px] font-semibold text-foreground group-hover:text-emerald-500 transition-colors">
                                                    {item.title ||
                                                        item.headline}
                                                </p>
                                                <div className="mt-1 flex items-center justify-between text-[12px] text-muted-foreground">
                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                        {item.sourceName ||
                                                            item.source?.name ||
                                                            'AlphaSpread / Mercado'}
                                                    </span>
                                                    <span>
                                                        {item.publishedAt
                                                            ? new Date(
                                                                  item.publishedAt,
                                                              ).toLocaleDateString(
                                                                  'es-AR',
                                                              )
                                                            : 'Reciente'}
                                                    </span>
                                                </div>
                                            </a>
                                        ))}
                                        <div className="pt-1 border-t border-border/40">
                                            <a
                                                href={alphaSpreadUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-md text-[13px] font-bold text-muted-foreground hover:text-foreground bg-secondary/30 hover:bg-secondary/60 border border-border/50 transition-colors text-center"
                                            >
                                                <span>
                                                    Ver análisis de valoración y
                                                    noticias de {ticker} en
                                                    AlphaSpread
                                                </span>
                                                <ExternalLink className="h-3 w-3 text-emerald-500" />
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-8 text-center space-y-2">
                                        <p className="text-[14px] text-muted-foreground">
                                            No hay noticias recientes para este
                                            activo.
                                        </p>
                                        <a
                                            href={alphaSpreadUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[14px] font-bold text-emerald-500 hover:underline"
                                        >
                                            Ver noticias y DCF en AlphaSpread{' '}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4 text-[14px] text-muted-foreground">
                        <span>Fuente fundamental: {source}</span>
                        <div className="flex gap-2">
                            <a
                                href={`https://www.tradingview.com/symbols/${ticker}/`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-border/60 px-3 py-2 font-semibold hover:border-emerald-500/50 hover:text-emerald-500"
                            >
                                TradingView <ExternalLink className="h-3 w-3" />
                            </a>
                            <a
                                href={alphaSpreadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-border/60 px-3 py-2 font-semibold hover:border-emerald-500/50 hover:text-emerald-500"
                            >
                                AlphaSpread <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AddToWatchlistModal
                symbol={ticker}
                name={data.instrument?.name || ticker}
                isOpen={isAddToWatchlistOpen}
                onClose={() => setIsAddToWatchlistOpen(false)}
            />
        </section>
    );
}
