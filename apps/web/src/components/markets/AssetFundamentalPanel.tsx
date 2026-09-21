import { useEffect, useMemo, useState } from 'react';
import { Activity, Building2, ExternalLink, Loader2, RefreshCw, Wallet, Newspaper, TrendingUp } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import SymbolLogo from '@/components/SymbolLogo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function number(value: number | null | undefined, digits = 2) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
    return new Intl.NumberFormat('es-AR', { maximumFractionDigits: digits }).format(Number(value));
}

function money(value: number | null | undefined) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value));
}

function compactMoney(value: number | null | undefined) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
    const absolute = Math.abs(Number(value));
    if (absolute >= 1e12) return `$${(Number(value) / 1e12).toFixed(2)}T`;
    if (absolute >= 1e9) return `$${(Number(value) / 1e9).toFixed(2)}B`;
    if (absolute >= 1e6) return `$${(Number(value) / 1e6).toFixed(2)}M`;
    return money(value);
}

function Metric({ label, value }: { label: string; value: string }) {
    return <div className="rounded-2xl border border-border/50 bg-background/50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-base font-black text-foreground">{value}</p></div>;
}

export default function AssetFundamentalPanel({ symbol }: { symbol: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [news, setNews] = useState<any[]>([]);
    const [candles, setCandles] = useState<any[]>([]);
    const ticker = useMemo(() => symbol.split(':').pop()?.replace(/[^A-Z0-9.\-]/gi, '').toUpperCase() || symbol, [symbol]);
    const exchange = symbol.includes(':') ? symbol.split(':')[0].toUpperCase() : 'NASDAQ';

    const load = async (force = false) => {
        force ? setRefreshing(true) : setLoading(true);
        setError('');
        try {
            const query = new URLSearchParams({ provider: 'alphavantage', fallback: 'true', tvSymbol: symbol });
            if (force) query.set('force', 'true');
            const [response, newsResponse, candlesResponse] = await Promise.all([
                apiFetch(`/fundamental/${encodeURIComponent(ticker)}?${query.toString()}`),
                apiFetch(`/market/news?symbol=${encodeURIComponent(ticker)}`),
                apiFetch(`/market/candles?symbol=${encodeURIComponent(symbol)}&interval=1d&range=6mo`),
            ]);
            if (response.ok) {
                setData(await response.json());
            } else {
                setData({
                    instrument: { name: ticker, exchange },
                    metrics: {},
                    derived: {},
                    statements: {},
                    quality: { coverage: 0, warnings: ['El proveedor fundamental está temporalmente no disponible.'] },
                    source: { providersTried: [], errors: [{ message: `HTTP ${response.status}` }] },
                });
                setError('Los fundamentales están temporalmente en actualización. El gráfico y los datos de mercado siguen disponibles.');
            }
            if (newsResponse.ok) {
                const newsData = await newsResponse.json();
                setNews(Array.isArray(newsData) ? newsData.slice(0, 5) : []);
            }
            if (candlesResponse.ok) {
                const candleData = await candlesResponse.json();
                setCandles(Array.isArray(candleData) ? candleData.filter((item: any) => Number.isFinite(Number(item.close))).slice(-90) : []);
            }
        } catch (err: any) {
            setError(err?.message || 'No se pudo cargar la información del activo');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { void load(); }, [symbol]);

    if (loading) return <Card className="rounded-[28px] border-border/60 bg-card/60"><CardContent className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-emerald-500" /> Cargando información fundamental…</CardContent></Card>;

    if (!data) return <Card className="rounded-[28px] border-border/60 bg-card/60"><CardContent className="flex flex-col items-center gap-3 py-10 text-center"><p className="text-sm text-muted-foreground">Cargando información fundamental…</p><Button variant="outline" onClick={() => void load(true)}><RefreshCw className="mr-2 h-4 w-4" /> Actualizar</Button></CardContent></Card>;

    const metrics = data.metrics || {};
    const latestIncome = data.statements?.incomeStatement?.[0] || {};
    const latestBalance = data.statements?.balanceSheet?.[0] || {};
    const latestCash = data.statements?.cashFlow?.[0] || {};
    const source = data.source?.providersTried?.join(', ') || 'Alpha Vantage / fallback Finix';
    const alphaSpreadUrl = `https://www.alphaspread.com/security/${exchange}/${ticker.toLowerCase()}/discount-rate`;
    const closes = candles.map(item => Number(item.close));
    const minClose = Math.min(...closes);
    const maxClose = Math.max(...closes);
    const chartPoints = closes.map((value, index) => `${(index / Math.max(1, closes.length - 1)) * 100},${90 - ((value - minClose) / Math.max(0.0001, maxClose - minClose)) * 78}`).join(' ');

    return <section className="space-y-5">
        {error && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">{error} <button type="button" onClick={() => void load(true)} className="ml-2 font-semibold underline">Actualizar</button></div>}
        <Card className="rounded-[28px] border-border/60 bg-card/60 shadow-sm backdrop-blur-xl">
            <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/40 pb-4">
                <div className="flex items-center gap-3"><SymbolLogo symbol={symbol} size={42} /><div><CardTitle className="text-xl">Información completa del activo</CardTitle><p className="mt-1 text-xs text-muted-foreground">{data.instrument?.name || ticker} · {ticker} · {data.instrument?.exchange || exchange}</p></div></div>
                <Button variant="outline" size="sm" onClick={() => void load(true)} disabled={refreshing}><RefreshCw className={`mr-2 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Actualizar</Button>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                    <Metric label="Capitalización" value={compactMoney(metrics.marketCap)} />
                    <Metric label="Enterprise value" value={compactMoney(metrics.enterpriseValue)} />
                    <Metric label="P/E" value={number(metrics.peRatio)} />
                    <Metric label="ROE" value={metrics.roe == null ? '—' : `${number(metrics.roe)}%`} />
                    <Metric label="ROIC" value={metrics.roic == null ? '—' : `${number(metrics.roic)}%`} />
                    <Metric label="Deuda / patrimonio" value={number(metrics.debtToEquity)} />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="border-border/50 bg-background/40"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-emerald-500" /> Estado de resultados</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2 text-xs"><Metric label="Ingresos" value={compactMoney(latestIncome.revenue)} /><Metric label="Resultado neto" value={compactMoney(latestIncome.netIncome)} /><Metric label="EBITDA" value={compactMoney(latestIncome.ebitda)} /><Metric label="EPS" value={money(latestIncome.eps)} /></CardContent></Card>
                    <Card className="border-border/50 bg-background/40"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Wallet className="h-4 w-4 text-emerald-500" /> Balance</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2 text-xs"><Metric label="Activos" value={compactMoney(latestBalance.totalAssets)} /><Metric label="Pasivos" value={compactMoney(latestBalance.totalLiabilities)} /><Metric label="Caja" value={compactMoney(latestBalance.cashAndEquivalents)} /><Metric label="Deuda" value={compactMoney(latestBalance.totalDebt)} /></CardContent></Card>
                    <Card className="border-border/50 bg-background/40"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4 text-emerald-500" /> Flujo y calidad</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2 text-xs"><Metric label="Flujo operativo" value={compactMoney(latestCash.operatingCashFlow)} /><Metric label="Free cash flow" value={compactMoney(metrics.freeCashFlow ?? latestCash.freeCashFlow)} /><Metric label="Margen neto" value={metrics.netMargin == null ? '—' : `${number(metrics.netMargin)}%`} /><Metric label="Crecimiento CAGR" value={metrics.revenueGrowthCagr == null ? '—' : `${number(metrics.revenueGrowthCagr)}%`} /></CardContent></Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
                    <Card className="border-border/50 bg-background/40"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4 text-emerald-500" /> Evolución de precio · 6 meses</CardTitle></CardHeader><CardContent>{candles.length > 1 ? <><div className="h-40 rounded-xl bg-gradient-to-b from-emerald-500/10 to-transparent p-2"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full"><polyline points={chartPoints} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" className="text-emerald-500" /></svg></div><div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>Mín. {money(minClose)}</span><span>Máx. {money(maxClose)}</span><span>Último {money(closes[closes.length - 1])}</span></div></> : <p className="py-12 text-center text-xs text-muted-foreground">No hay histórico disponible.</p>}</CardContent></Card>
                    <Card className="border-border/50 bg-background/40"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Newspaper className="h-4 w-4 text-emerald-500" /> Noticias relacionadas</CardTitle></CardHeader><CardContent className="space-y-3">{news.length ? news.map((item: any, index) => <a key={item.id || index} href={item.url || item.link || '#'} target="_blank" rel="noreferrer" className="block border-b border-border/40 pb-2 last:border-0"><p className="line-clamp-2 text-xs font-semibold text-foreground hover:text-emerald-500">{item.title || item.headline}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.sourceName || item.source?.name || 'Fuente externa'}{item.publishedAt ? ` · ${new Date(item.publishedAt).toLocaleDateString('es-AR')}` : ''}</p></a>) : <p className="py-8 text-center text-xs text-muted-foreground">No hay noticias recientes para este activo.</p>}</CardContent></Card>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4 text-xs text-muted-foreground"><span>Fuente fundamental: {source}</span><div className="flex gap-2"><a href={`https://www.tradingview.com/symbols/${ticker}/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-border/60 px-3 py-2 font-semibold hover:border-emerald-500/50 hover:text-emerald-500">TradingView <ExternalLink className="h-3 w-3" /></a><a href={alphaSpreadUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-border/60 px-3 py-2 font-semibold hover:border-emerald-500/50 hover:text-emerald-500">AlphaSpread <ExternalLink className="h-3 w-3" /></a></div></div>
                <p className="text-[10px] text-muted-foreground">Datos informativos sujetos a disponibilidad y límites de los proveedores externos. No constituye asesoramiento financiero.</p>
            </CardContent>
        </Card>
    </section>;
}
