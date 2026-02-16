import { useEffect, useRef, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TrendingUp } from 'lucide-react';
import { Badge } from './ui/badge';

interface TradingViewAnalysisProps {
    symbol: string;
    quoteData?: {
        symbol: string;
        price: number | null;
        change: number | null;
        updatedAt: string;
    } | null;
    asset?: {
        name: string;
        type: string;
        exchange?: string;
    } | null;
}

const PRICE_OVERVIEW_HEIGHT = 760;
const TECHNICAL_ANALYSIS_HEIGHT = 520;

const priceFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
});

function inferTypeFromSymbol(symbol: string) {
    if (symbol.startsWith('BINANCE:') || symbol.startsWith('CRYPTO:')) return 'Cripto';
    if (symbol.startsWith('FX:')) return 'Forex';
    if (symbol.startsWith('OANDA:') || symbol.startsWith('TVC:')) return 'Commodities';
    if (symbol.includes('SPY') || symbol.includes('QQQ') || symbol.includes('VTI') || symbol.includes('GLD')) return 'ETF';
    return 'Acción';
}

function getDirection(change?: number | null) {
    if (typeof change !== 'number') return 'Sin dato';
    if (change >= 0.8) return 'Alcista';
    if (change <= -0.8) return 'Bajista';
    return 'Lateral';
}

function getVolatility(change?: number | null) {
    if (typeof change !== 'number') return 'Sin dato';
    const abs = Math.abs(change);
    if (abs < 0.8) return 'Baja';
    if (abs < 2) return 'Media';
    return 'Alta';
}

function getRiskLevel(volatility: string, direction: string) {
    if (volatility === 'Alta') return 'Alto';
    if (volatility === 'Media') return direction === 'Lateral' ? 'Medio' : 'Medio-Alto';
    if (volatility === 'Baja') return 'Bajo';
    return 'Sin dato';
}

function getUsSessionState() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).formatToParts(new Date());

    const weekday = parts.find((part) => part.type === 'weekday')?.value || '';
    const hour = Number(parts.find((part) => part.type === 'hour')?.value || '0');
    const minute = Number(parts.find((part) => part.type === 'minute')?.value || '0');
    const totalMinutes = hour * 60 + minute;
    const isWeekday = weekday !== 'Sat' && weekday !== 'Sun';

    if (!isWeekday) return 'Cerrado (fin de semana)';
    if (totalMinutes >= 570 && totalMinutes < 960) return 'Abierto';
    if (totalMinutes >= 240 && totalMinutes < 570) return 'Pre-market';
    if (totalMinutes >= 960 && totalMinutes < 1200) return 'After-hours';
    return 'Cerrado';
}

function getMarketSession(assetType: string, exchange: string) {
    if (assetType === 'CRYPTO') return '24h continuo';
    if (assetType === 'FOREX') return '24h (lun-vie)';
    if (exchange === 'NASDAQ' || exchange === 'NYSE' || exchange === 'AMEX') return getUsSessionState();
    return 'Sesion internacional';
}

function formatUpdatedAt(updatedAt?: string) {
    if (!updatedAt) return '--';
    const date = new Date(updatedAt);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function TradingViewAnalysis({ symbol, quoteData, asset }: TradingViewAnalysisProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const technicalAnalysisRef = useRef<HTMLDivElement>(null);
    const exchange = asset?.exchange || symbol.split(':')[0] || '--';
    const assetType = asset?.type ? asset.type.toUpperCase() : inferTypeFromSymbol(symbol).toUpperCase();
    const direction = getDirection(quoteData?.change);
    const volatility = getVolatility(quoteData?.change);
    const riskLevel = getRiskLevel(volatility, direction);
    const marketSession = getMarketSession(assetType, exchange);
    const scenarios = quoteData?.price
        ? {
            defensiveEntryMin: quoteData.price * 0.994,
            defensiveEntryMax: quoteData.price * 0.998,
            objectiveBase: quoteData.price * 1.01,
            objectiveExtended: quoteData.price * 1.02,
            controlStop: quoteData.price * 0.987
        }
        : null;
    const pnlFor1000 = typeof quoteData?.change === 'number' ? (1000 * quoteData.change) / 100 : null;

    useEffect(() => {
        if (!containerRef.current || !technicalAnalysisRef.current) return;

        const mountWidget = (
            target: HTMLDivElement,
            scriptSrc: string,
            config: Record<string, unknown>,
            height: number
        ) => {
            target.innerHTML = '';

            const widgetRoot = document.createElement('div');
            widgetRoot.className = 'tradingview-widget-container market-overview-widget';
            widgetRoot.style.height = `${height}px`;
            widgetRoot.style.width = '100%';

            const widgetViewport = document.createElement('div');
            widgetViewport.className = 'tradingview-widget-container__widget';
            widgetViewport.style.height = '100%';
            widgetViewport.style.width = '100%';
            widgetRoot.appendChild(widgetViewport);

            const script = document.createElement('script');
            script.src = scriptSrc;
            script.async = true;
            script.type = 'text/javascript';
            script.innerHTML = JSON.stringify({
                ...config,
                width: '100%',
                height
            });

            widgetRoot.appendChild(script);
            target.appendChild(widgetRoot);
        };

        mountWidget(
            containerRef.current,
            'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js',
            {
                symbol: symbol,
                locale: 'es',
                dateRange: '12M',
                colorTheme: 'dark',
                trendLineColor: 'rgba(34, 197, 94, 1)',
                underLineColor: 'rgba(34, 197, 94, 0.3)',
                underLineBottomColor: 'rgba(34, 197, 94, 0)',
                isTransparent: true,
                largeChartUrl: ''
            },
            PRICE_OVERVIEW_HEIGHT
        );

        mountWidget(
            technicalAnalysisRef.current,
            'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js',
            {
                interval: '1D',
                isTransparent: true,
                symbol: symbol,
                showIntervalTabs: true,
                locale: 'es',
                colorTheme: 'dark'
            },
            TECHNICAL_ANALYSIS_HEIGHT
        );

        // Cleanup
        return () => {
            if (containerRef.current) containerRef.current.innerHTML = '';
            if (technicalAnalysisRef.current) technicalAnalysisRef.current.innerHTML = '';
        };
    }, [symbol]);

    return (
        <div className="grid gap-6 grid-cols-1 2xl:grid-cols-2">
            {/* Price Overview */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Resumen de Precios
                    </CardTitle>
                    <CardDescription>Evolución del precio en el tiempo</CardDescription>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                    <div ref={containerRef} className="h-[760px] w-full" />
                </CardContent>
            </Card>

            {/* Technical Analysis */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Análisis Técnico
                    </CardTitle>
                    <CardDescription>Indicadores y señales de mercado</CardDescription>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0 space-y-5">
                    <div ref={technicalAnalysisRef} className="h-[520px] w-full" />

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Sesion</p>
                            <p className="mt-2 text-lg font-semibold">{marketSession}</p>
                            <p className="text-sm text-muted-foreground">{exchange}</p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Volatilidad</p>
                            <div className="mt-2">
                                <Badge
                                    variant="outline"
                                    className={`${volatility === 'Alta'
                                        ? 'border-red-500/40 text-red-400'
                                        : volatility === 'Media'
                                            ? 'border-amber-500/40 text-amber-300'
                                            : volatility === 'Baja'
                                                ? 'border-emerald-500/40 text-emerald-400'
                                                : 'border-slate-500/40 text-slate-300'
                                        }`}
                                >
                                    {volatility}
                                </Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">Cambio diario observado</p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Direccion</p>
                            <div className="mt-2">
                                <Badge
                                    variant="outline"
                                    className={`${direction === 'Alcista'
                                        ? 'border-emerald-500/40 text-emerald-400'
                                        : direction === 'Bajista'
                                            ? 'border-red-500/40 text-red-400'
                                            : direction === 'Lateral'
                                                ? 'border-slate-500/40 text-slate-300'
                                                : 'border-slate-500/40 text-slate-300'
                                        }`}
                                >
                                    {direction}
                                </Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{assetType}</p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Riesgo de Entrada</p>
                            <div className="mt-2">
                                <Badge
                                    variant="outline"
                                    className={`${riskLevel === 'Alto'
                                        ? 'border-red-500/40 text-red-400'
                                        : riskLevel === 'Medio-Alto'
                                            ? 'border-orange-500/40 text-orange-300'
                                        : riskLevel === 'Bajo'
                                            ? 'border-emerald-500/40 text-emerald-400'
                                            : riskLevel === 'Medio'
                                                ? 'border-amber-500/40 text-amber-300'
                                                : 'border-slate-500/40 text-slate-300'
                                        }`}
                                >
                                    {riskLevel}
                                </Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">Actualizado: {formatUpdatedAt(quoteData?.updatedAt)}</p>
                        </div>
                    </div>

                    <div className="grid gap-3 xl:grid-cols-3">
                        <div className="rounded-lg border border-border/60 bg-secondary/20 p-4 xl:col-span-2">
                            <p className="text-sm font-semibold">Escenarios de Operativa (referencia)</p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                <div className="rounded-md bg-background/40 p-3">
                                    <p className="text-xs text-muted-foreground">Entrada defensiva</p>
                                    <p className="font-medium">
                                        {scenarios
                                            ? `${priceFormatter.format(scenarios.defensiveEntryMin)} - ${priceFormatter.format(scenarios.defensiveEntryMax)}`
                                            : '--'}
                                    </p>
                                </div>
                                <div className="rounded-md bg-background/40 p-3">
                                    <p className="text-xs text-muted-foreground">Objetivo base</p>
                                    <p className="font-medium">{scenarios ? priceFormatter.format(scenarios.objectiveBase) : '--'}</p>
                                </div>
                                <div className="rounded-md bg-background/40 p-3">
                                    <p className="text-xs text-muted-foreground">Objetivo extendido</p>
                                    <p className="font-medium">{scenarios ? priceFormatter.format(scenarios.objectiveExtended) : '--'}</p>
                                </div>
                                <div className="rounded-md bg-background/40 p-3">
                                    <p className="text-xs text-muted-foreground">Stop de control</p>
                                    <p className="font-medium">{scenarios ? priceFormatter.format(scenarios.controlStop) : '--'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
                            <p className="text-sm font-semibold">Impacto Rapido</p>
                            <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Posicion simulada: USD 1,000</p>
                            <p className={`mt-2 text-2xl font-semibold ${typeof pnlFor1000 === 'number'
                                ? pnlFor1000 >= 0
                                    ? 'text-emerald-400'
                                    : 'text-red-400'
                                : ''
                                }`}>
                                {typeof pnlFor1000 === 'number'
                                    ? `${pnlFor1000 >= 0 ? '+' : ''}${priceFormatter.format(pnlFor1000)}`
                                    : '--'}
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Variacion basada en el cambio diario actual del activo.
                            </p>
                            <p className="mt-3 text-sm">
                                Activo: <span className="font-medium text-foreground">{asset?.name || symbol}</span>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default memo(TradingViewAnalysis);
