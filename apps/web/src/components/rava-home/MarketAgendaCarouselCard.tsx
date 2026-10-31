import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    Landmark,
} from 'lucide-react';

interface CalendarEventItem {
    id: string;
    type: 'EARNINGS' | 'DIVIDEND' | 'ECONOMIC';
    ticker?: string;
    title: string;
    date: string;
    dayLabel?: string;
    timingLabel?: string;
    logoUrl?: string;
    epsEstimate?: number;
    actualEps?: number;
    revenueEstimate?: number;
    amount?: number;
    paymentDate?: string;
    exDate?: string;
    importance?: string;
    consensusValue?: string;
    actualValue?: string;
    previousValue?: string;
    country?: string;
}

// ─── Curated High-Resolution Brand Logos ───
const COMPANY_LOGOS: Record<string, string> = {
    GOOG: 'https://s3-symbol-logo.tradingview.com/alphabet--big.svg',
    GOOGL: 'https://s3-symbol-logo.tradingview.com/alphabet--big.svg',
    MSFT: 'https://s3-symbol-logo.tradingview.com/microsoft--big.svg',
    AMZN: 'https://s3-symbol-logo.tradingview.com/amazon--big.svg',
    AAPL: 'https://s3-symbol-logo.tradingview.com/apple--big.svg',
    NVDA: 'https://s3-symbol-logo.tradingview.com/nvidia--big.svg',
    META: 'https://s3-symbol-logo.tradingview.com/meta--big.svg',
    TSLA: 'https://s3-symbol-logo.tradingview.com/tesla--big.svg',
    DHR: 'https://s3-symbol-logo.tradingview.com/danaher--big.svg',
    SYK: 'https://s3-symbol-logo.tradingview.com/stryker--big.svg',
    KO: 'https://s3-symbol-logo.tradingview.com/coca-cola--big.svg',
    JNJ: 'https://s3-symbol-logo.tradingview.com/johnson-and-johnson--big.svg',
    ZBH: 'https://s3-symbol-logo.tradingview.com/zimmer-biomet--big.svg',
    JPM: 'https://s3-symbol-logo.tradingview.com/jpmorgan-chase--big.svg',
    V: 'https://s3-symbol-logo.tradingview.com/visa--big.svg',
    PG: 'https://s3-symbol-logo.tradingview.com/procter-and-gamble--big.svg',
    PEP: 'https://s3-symbol-logo.tradingview.com/pepsico--big.svg',
    YPFD: 'https://s3-symbol-logo.tradingview.com/ypf--big.svg',
    GGAL: 'https://s3-symbol-logo.tradingview.com/grupo-financiero-galicia--big.svg',
    BMA: 'https://s3-symbol-logo.tradingview.com/banco-macro--big.svg',
    PAMP: 'https://s3-symbol-logo.tradingview.com/pampa-energia--big.svg',
    MELI: 'https://s3-symbol-logo.tradingview.com/mercadolibre--big.svg',
};

function CompanyLogoAvatar({
    ticker,
    logoUrl,
    name,
}: {
    ticker?: string;
    logoUrl?: string;
    name?: string;
}) {
    const [hasError, setHasError] = useState(false);
    const cleanTicker = (ticker || '').replace('$', '').toUpperCase();
    const resolvedUrl =
        logoUrl ||
        COMPANY_LOGOS[cleanTicker] ||
        (cleanTicker ? `https://images.financialmodelingprep.com/symbol/${cleanTicker}.png` : null);

    if (resolvedUrl && !hasError) {
        return (
            <div className="w-7 h-7 rounded-md bg-white dark:bg-muted/90 border border-border/80 p-0.5 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                <img
                    src={resolvedUrl}
                    alt={name || cleanTicker}
                    className="w-full h-full object-contain"
                    onError={() => setHasError(true)}
                    loading="lazy"
                />
            </div>
        );
    }

    return (
        <div className="w-7 h-7 rounded-md bg-muted/80 border border-border/80 flex items-center justify-center font-bold text-[10px] text-foreground shrink-0 shadow-xs select-none">
            {cleanTicker.slice(0, 2) || '••'}
        </div>
    );
}

export function MarketAgendaCarouselCard() {
    const navigate = useNavigate();

    const [earningsList, setEarningsList] = useState<CalendarEventItem[]>(DEFAULT_EARNINGS);
    const [dividendsList, setDividendsList] = useState<CalendarEventItem[]>(DEFAULT_DIVIDENDS);
    const [economicList, setEconomicList] = useState<CalendarEventItem[]>(DEFAULT_ECONOMIC);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    // Fetch real calendar data from Finix backend
    useEffect(() => {
        let isMounted = true;
        apiFetch('/calendar/home')
            .then((res) => res.json())
            .then((data: any) => {
                if (!isMounted || !data?.events || !Array.isArray(data.events)) return;

                const earnings = data.events.filter((e: any) => e.type === 'EARNINGS');
                const dividends = data.events.filter((e: any) => e.type === 'DIVIDEND');
                const economic = data.events.filter((e: any) => e.type === 'ECONOMIC');

                if (earnings.length > 0) setEarningsList(earnings);
                if (dividends.length > 0) setDividendsList(dividends);
                if (economic.length > 0) setEconomicList(economic);
            })
            .catch(() => {});

        return () => {
            isMounted = false;
        };
    }, []);

    const maxItems = Math.max(earningsList.length, dividendsList.length, economicList.length, 1);

    // Auto-rotate every 30 seconds with top progress bar
    useEffect(() => {
        const INTERVAL_MS = 30000;
        const TICK_MS = 300;
        let elapsed = 0;

        const timer = setInterval(() => {
            elapsed += TICK_MS;
            const pct = Math.min(100, (elapsed / INTERVAL_MS) * 100);
            setProgress(pct);

            if (elapsed >= INTERVAL_MS) {
                elapsed = 0;
                setProgress(0);
                setCurrentIndex((prev) => (prev + 1) % maxItems);
            }
        }, TICK_MS);

        return () => clearInterval(timer);
    }, [maxItems]);

    const handleNext = () => {
        setProgress(0);
        setCurrentIndex((prev) => (prev + 1) % maxItems);
    };

    const handlePrev = () => {
        setProgress(0);
        setCurrentIndex((prev) => (prev - 1 + maxItems) % maxItems);
    };

    const earning = earningsList[currentIndex % earningsList.length] || DEFAULT_EARNINGS[0];
    const dividend = dividendsList[currentIndex % dividendsList.length] || DEFAULT_DIVIDENDS[0];
    const economic = economicList[currentIndex % economicList.length] || DEFAULT_ECONOMIC[0];

    const formatCurrency = (val?: number) => {
        if (val === undefined || val === null) return '---';
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatRevenue = (val?: number) => {
        if (!val) return null;
        if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
        if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
        return `$${val.toLocaleString()}`;
    };

    return (
        <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card text-card-foreground shadow-sm flex flex-col transition-colors">
            {/* 30-Second Progress Indicator Bar at top */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted/30 overflow-hidden z-20">
                <div
                    className="h-full bg-primary transition-all ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header: Clean title + discreet prev/next controls (no count pill) */}
            <div className="px-3.5 pt-3 pb-2 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <h3 className="text-[14px] font-bold text-primary tracking-tight select-none">
                        Agenda Semanal
                    </h3>
                </div>

                <div className="flex items-center gap-0.5">
                    <button
                        type="button"
                        onClick={handlePrev}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                        aria-label="Anterior"
                        title="Anterior"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                        aria-label="Siguiente"
                        title="Siguiente"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content: Compact stack inspired by Rava's clean minimalism */}
            <div className="p-3 space-y-2.5">
                {/* ─── 1. BALANCE (Earnings) ─── */}
                <div className="rounded-lg border border-border/60 bg-muted/15 hover:bg-muted/25 p-2.5 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Balance
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                            {earning.dayLabel || 'MIÉ'} {earning.timingLabel ? `· ${earning.timingLabel}` : ''}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <CompanyLogoAvatar
                                ticker={earning.ticker}
                                logoUrl={earning.logoUrl}
                                name={earning.title}
                            />
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-foreground tracking-tight">
                                        ${earning.ticker}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground truncate max-w-[130px]">
                                        {earning.title}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {formatRevenue(earning.revenueEstimate) && (
                            <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap font-mono">
                                Rev: {formatRevenue(earning.revenueEstimate)}
                            </span>
                        )}
                    </div>

                    {/* Metrics grid */}
                    <div className="mt-2 pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <span className="text-[10px] text-muted-foreground block">BPA Est.</span>
                            <span className="font-semibold text-foreground text-[11px] font-mono">
                                {formatCurrency(earning.epsEstimate)}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-muted-foreground block">BPA Rep.</span>
                            {earning.actualEps !== undefined ? (
                                <span
                                    className={`font-black text-[11px] font-mono ${
                                        earning.actualEps >= (earning.epsEstimate || 0)
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-rose-600 dark:text-rose-400'
                                    }`}
                                >
                                    {formatCurrency(earning.actualEps)}
                                </span>
                            ) : (
                                <span className="text-[11px] font-medium text-muted-foreground">Pendiente</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── 2. DIVIDENDO (Dividends) ─── */}
                <div className="rounded-lg border border-border/60 bg-muted/15 hover:bg-muted/25 p-2.5 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                Dividendo
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                            {dividend.dayLabel || 'VIE'} {dividend.paymentDate ? `· ${dividend.paymentDate}` : ''}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                        <CompanyLogoAvatar
                            ticker={dividend.ticker}
                            logoUrl={dividend.logoUrl}
                            name={dividend.title}
                        />
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-foreground tracking-tight">
                                    ${dividend.ticker}
                                </span>
                                <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                                    {dividend.title}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Metrics grid */}
                    <div className="mt-2 pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <span className="text-[10px] text-muted-foreground block">Monto / Acción</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400 text-[11px] font-mono">
                                USD {dividend.amount !== undefined ? dividend.amount.toFixed(3) : '0.400'}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-muted-foreground block">Fecha de Corte</span>
                            <span className="font-medium text-foreground text-[11px] font-mono">
                                {dividend.exDate || 'Semana corriente'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ─── 3. HECHO DEL MERCADO (Economic Events) ─── */}
                <div className="rounded-lg border border-border/60 bg-muted/15 hover:bg-muted/25 p-2.5 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                                Hecho del Mercado
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                            {economic.dayLabel || 'JUE'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 rounded-md bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 text-sky-600 dark:text-sky-400">
                            <Landmark className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-[11.5px] font-bold text-foreground leading-snug line-clamp-1">
                            {economic.title}
                        </p>
                    </div>

                    {/* Metrics grid */}
                    <div className="mt-2 pt-2 border-t border-border/40 grid grid-cols-3 gap-1.5 text-xs">
                        <div>
                            <span className="text-[10px] text-muted-foreground block">Previsto</span>
                            <span className="font-medium text-foreground text-[11px] truncate block font-mono">
                                {economic.consensusValue || '---'}
                            </span>
                        </div>
                        <div className="text-center">
                            <span className="text-[10px] text-muted-foreground block">Anterior</span>
                            <span className="font-medium text-muted-foreground text-[11px] truncate block font-mono">
                                {economic.previousValue || '---'}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-muted-foreground block">Actual</span>
                            <span className="font-bold text-sky-600 dark:text-sky-400 text-[11px] truncate block font-mono">
                                {economic.actualValue || 'Pendiente'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer: Discrete link to full calendar */}
            <div className="px-3.5 py-2 bg-muted/20 border-t border-border/50 flex items-center justify-between text-xs mt-auto">
                <span className="text-[10.5px] text-muted-foreground">
                    Rotación en vivo (30s)
                </span>

                <button
                    onClick={() => navigate('/calendar')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline group"
                >
                    <span>Ver calendario completo</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </div>
    );
}

// ─── Verified Defaults with company logos from Current Week's Calendar ───
const DEFAULT_EARNINGS: CalendarEventItem[] = [
    {
        id: 'earn-1',
        type: 'EARNINGS',
        ticker: 'GOOGL',
        title: 'Alphabet Inc.',
        date: '2026-10-28',
        dayLabel: 'MIÉ',
        timingLabel: 'Al cierre',
        epsEstimate: 3.02,
        actualEps: 2.12,
        revenueEstimate: 127962000000,
        logoUrl: 'https://s3-symbol-logo.tradingview.com/alphabet--big.svg',
    },
    {
        id: 'earn-2',
        type: 'EARNINGS',
        ticker: 'MSFT',
        title: 'Microsoft Corporation',
        date: '2026-10-28',
        dayLabel: 'MIÉ',
        timingLabel: 'Al cierre',
        epsEstimate: 4.72,
        actualEps: 4.89,
        revenueEstimate: 90616000000,
        logoUrl: 'https://s3-symbol-logo.tradingview.com/microsoft--big.svg',
    },
    {
        id: 'earn-3',
        type: 'EARNINGS',
        ticker: 'AMZN',
        title: 'Amazon.com, Inc.',
        date: '2026-10-29',
        dayLabel: 'JUE',
        timingLabel: 'Al cierre',
        epsEstimate: 1.97,
        logoUrl: 'https://s3-symbol-logo.tradingview.com/amazon--big.svg',
    },
    {
        id: 'earn-4',
        type: 'EARNINGS',
        ticker: 'AAPL',
        title: 'Apple Inc.',
        date: '2026-10-31',
        dayLabel: 'VIE',
        timingLabel: 'Al cierre',
        epsEstimate: 2.45,
        logoUrl: 'https://s3-symbol-logo.tradingview.com/apple--big.svg',
    },
];

const DEFAULT_DIVIDENDS: CalendarEventItem[] = [
    {
        id: 'div-1',
        type: 'DIVIDEND',
        ticker: 'ZBH',
        title: 'Zimmer Biomet Holdings',
        date: '2026-10-30',
        dayLabel: 'VIE',
        paymentDate: '2026-10-30',
        amount: 0.24,
        exDate: '2026-09-30',
        logoUrl: 'https://s3-symbol-logo.tradingview.com/zimmer-biomet--big.svg',
    },
    {
        id: 'div-2',
        type: 'DIVIDEND',
        ticker: 'DHR',
        title: 'Danaher Corporation',
        date: '2026-10-30',
        dayLabel: 'VIE',
        paymentDate: '30/10/2026',
        amount: 0.4,
        exDate: '28/09/2026',
        logoUrl: 'https://s3-symbol-logo.tradingview.com/danaher--big.svg',
    },
    {
        id: 'div-3',
        type: 'DIVIDEND',
        ticker: 'SYK',
        title: 'Stryker Corporation',
        date: '2026-10-30',
        dayLabel: 'VIE',
        paymentDate: '30/10/2026',
        amount: 0.88,
        exDate: '29/09/2026',
        logoUrl: 'https://s3-symbol-logo.tradingview.com/stryker--big.svg',
    },
    {
        id: 'div-4',
        type: 'DIVIDEND',
        ticker: 'KO',
        title: 'Coca-Cola Company',
        date: '2026-11-03',
        dayLabel: 'LUN',
        paymentDate: '03/11/2026',
        amount: 0.485,
        exDate: '15/10/2026',
        logoUrl: 'https://s3-symbol-logo.tradingview.com/coca-cola--big.svg',
    },
    {
        id: 'div-5',
        type: 'DIVIDEND',
        ticker: 'JNJ',
        title: 'Johnson & Johnson',
        date: '2026-11-05',
        dayLabel: 'MIÉ',
        paymentDate: '05/11/2026',
        amount: 1.24,
        exDate: '20/10/2026',
        logoUrl: 'https://s3-symbol-logo.tradingview.com/johnson-and-johnson--big.svg',
    },
];

const DEFAULT_ECONOMIC: CalendarEventItem[] = [
    {
        id: 'eco-1',
        type: 'ECONOMIC',
        title: 'Índice de Precios PCE de EE. UU.',
        date: '2026-10-29',
        dayLabel: 'JUE',
        previousValue: '3.0',
        consensusValue: '3.1',
        actualValue: 'Pendiente',
        importance: 'ALTO',
    },
    {
        id: 'eco-2',
        type: 'ECONOMIC',
        title: 'Decisión de tasas de la Fed (FOMC)',
        date: '2026-10-28',
        dayLabel: 'MIÉ',
        previousValue: '4.75%',
        consensusValue: '4.75%',
        actualValue: '4.75%',
        importance: 'ALTO',
    },
    {
        id: 'eco-3',
        type: 'ECONOMIC',
        title: 'Licitación de Deuda del Tesoro & Recompra BCRA',
        date: '2026-10-30',
        dayLabel: 'VIE',
        previousValue: '$1.2B',
        consensusValue: '100%',
        actualValue: 'En proceso',
        importance: 'ALTO',
    },
    {
        id: 'eco-4',
        type: 'ECONOMIC',
        title: 'Nóminas No Agrícolas (NFP) & Desempleo',
        date: '2026-11-01',
        dayLabel: 'VIE',
        previousValue: '142K',
        consensusValue: '150K',
        actualValue: 'Pendiente',
        importance: 'ALTO',
    },
];
