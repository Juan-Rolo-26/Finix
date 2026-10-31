import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import {
    Sparkles,
    ArrowRight,
    BarChart3,
    TrendingUp,
    ShieldCheck,
    CheckCircle2,
    FileText,
    Calculator,
} from 'lucide-react';

interface AnalysisPreview {
    id: string;
    ticker: string;
    companyName: string;
    slug: string;
    currentPrice?: number;
    logoUrl?: string;
    targetPrice?: number;
    upside?: number;
}

const DEFAULT_FEATURED: AnalysisPreview[] = [
    {
        id: 'uber',
        ticker: 'UBER',
        companyName: 'Uber Technologies, Inc.',
        slug: 'uber',
        currentPrice: 69.08,
        targetPrice: 94.5,
        upside: 36.8,
        logoUrl: 'https://s3-symbol-logo.tradingview.com/uber--big.svg',
    },
    {
        id: 'pypl',
        ticker: 'PYPL',
        companyName: 'PayPal Holdings, Inc.',
        slug: 'pypl',
        currentPrice: 54.61,
        targetPrice: 78.0,
        upside: 42.8,
        logoUrl: 'https://s3-symbol-logo.tradingview.com/paypal--big.svg',
    },
    {
        id: 'mcd',
        ticker: 'MCD',
        companyName: "McDonald's Corporation",
        slug: 'mcd',
        currentPrice: 232.45,
        targetPrice: 295.0,
        upside: 26.9,
        logoUrl: 'https://s3-symbol-logo.tradingview.com/mcdonalds--big.svg',
    },
    {
        id: 'wmt',
        ticker: 'WMT',
        companyName: 'Walmart Inc.',
        slug: 'wmt',
        currentPrice: 107.2,
        targetPrice: 125.0,
        upside: 16.6,
        logoUrl: 'https://s3-symbol-logo.tradingview.com/walmart--big.svg',
    },
    {
        id: 'jpm',
        ticker: 'JPM',
        companyName: 'JPMorgan Chase & Co.',
        slug: 'jpm',
        currentPrice: 331.28,
        targetPrice: 380.0,
        upside: 14.7,
        logoUrl: 'https://s3-symbol-logo.tradingview.com/jpmorgan-chase--big.svg',
    },
];

export function FinixResearchCtaBanner() {
    const navigate = useNavigate();
    const [analyses, setAnalyses] = useState<AnalysisPreview[]>(DEFAULT_FEATURED);
    const [selectedIdx, setSelectedIdx] = useState(0);

    // Fetch real published analyses from Finix backend
    useEffect(() => {
        let isMounted = true;
        apiFetch('/analysis')
            .then((res) => res.json())
            .then((data: any[]) => {
                if (!isMounted || !Array.isArray(data) || data.length === 0) return;

                const mapped: AnalysisPreview[] = data.slice(0, 6).map((item, idx) => {
                    const fallback = DEFAULT_FEATURED[idx] || DEFAULT_FEATURED[0];
                    const price = item.currentPrice || fallback.currentPrice || 100;
                    const target = fallback.targetPrice || price * 1.25;
                    const upside = Number((((target - price) / price) * 100).toFixed(1));

                    return {
                        id: item.id || `analysis-${idx}`,
                        ticker: item.ticker || fallback.ticker,
                        companyName: item.companyName || fallback.companyName,
                        slug: item.slug || fallback.slug,
                        currentPrice: price,
                        targetPrice: target,
                        upside: upside > 0 ? upside : fallback.upside,
                        logoUrl: item.logoUrl || fallback.logoUrl,
                    };
                });

                if (mapped.length > 0) {
                    setAnalyses(mapped);
                }
            })
            .catch(() => {
                // Gracefully retain DEFAULT_FEATURED
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const activeItem = analyses[selectedIdx] || DEFAULT_FEATURED[0];

    return (
        <section className="w-full my-6 select-none" aria-label="Finix Research Banner">
            <div className="relative overflow-hidden rounded-2xl bg-card border border-border/80 p-6 sm:p-8 md:p-9 text-card-foreground shadow-xs transition-colors dark:bg-[#07141b] dark:border-emerald-500/30">
                {/* Subtle decorative background gradient */}
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                    {/* Left Column (7 cols): Strong Pitch & CTA */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                                <span>FINIX RESEARCH & VALUACIÓN DCF</span>
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-muted-foreground">
                                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                                <span>Acceso Abierto & Gratuito</span>
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
                                Tesis de Inversión Fundamentales y Modelos DCF
                            </h2>
                            <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-normal leading-relaxed max-w-2xl">
                                Dejá de operar a ciegas. Accedé a modelos financieros completos con proyecciones de flujo de caja libre, cálculo de WACC, múltiplos comparables y estimación de valor razonable para activos líderes de Wall Street y Argentina.
                            </p>
                        </div>

                        {/* 3 Key Value Props */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs text-foreground font-semibold">
                            <div className="flex items-center gap-2 bg-muted/30 border border-border/60 rounded-lg p-2.5">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                <span>Flujo de Fondos Descontado</span>
                            </div>
                            <div className="flex items-center gap-2 bg-muted/30 border border-border/60 rounded-lg p-2.5">
                                <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                                <span>Precios Objetivo & Margen</span>
                            </div>
                            <div className="flex items-center gap-2 bg-muted/30 border border-border/60 rounded-lg p-2.5">
                                <FileText className="w-4 h-4 text-primary shrink-0" />
                                <span>Tesis Transparentes</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-3">
                            <button
                                onClick={() => navigate('/analysis')}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95 group"
                            >
                                <span>Explorar Finix Research</span>
                                <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => navigate('/laboratorio')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground font-semibold text-xs sm:text-sm border border-border/70 transition-all active:scale-95"
                            >
                                <Calculator className="w-4 h-4 text-primary" />
                                <span>Ir a Simuladores</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Column (5 cols): Interactive Report Card Preview */}
                    <div className="lg:col-span-5 flex flex-col justify-center">
                        <div
                            onClick={() => navigate(`/analysis/${activeItem.slug}`)}
                            className="group relative rounded-xl bg-card border border-border/80 p-5 shadow-xs hover:border-primary/50 transition-all cursor-pointer space-y-4 dark:bg-card/90 dark:border-border/60"
                        >
                            {/* Card Header */}
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2.5">
                                    {activeItem.logoUrl ? (
                                        <img
                                            src={activeItem.logoUrl}
                                            alt={activeItem.ticker}
                                            className="w-8 h-8 rounded-full bg-white p-1 object-contain border border-border/60 shadow-xs"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                                            {activeItem.ticker[0]}
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                                ${activeItem.ticker}
                                            </span>
                                            <span className="text-[0.625rem] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono">
                                                MODELO DCF
                                            </span>
                                        </div>
                                        <p className="text-[0.6875rem] text-muted-foreground truncate max-w-[170px]">
                                            {activeItem.companyName}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="text-[0.625rem] font-mono text-muted-foreground block uppercase">
                                        Precio Actual
                                    </span>
                                    <span className="text-sm font-bold font-mono text-foreground">
                                        ${activeItem.currentPrice?.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Core Valuation Metrics */}
                            <div className="grid grid-cols-2 gap-3 bg-muted/20 border border-border/50 rounded-lg p-3">
                                <div>
                                    <span className="text-[0.625rem] font-medium text-muted-foreground block">
                                        Precio Objetivo
                                    </span>
                                    <span className="text-base font-bold font-mono text-primary">
                                        ${activeItem.targetPrice?.toFixed(2)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[0.625rem] font-medium text-muted-foreground block">
                                        Upside Potencial
                                    </span>
                                    <span className="text-base font-bold font-mono text-primary flex items-center gap-1">
                                        <span>+{activeItem.upside}%</span>
                                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                                    </span>
                                </div>
                            </div>

                            {/* Click to open report */}
                            <div className="flex items-center justify-between text-xs font-bold pt-1">
                                <span className="text-muted-foreground flex items-center gap-1 text-[0.6875rem]">
                                    <BarChart3 className="w-3.5 h-3.5 text-primary" />
                                    <span>Ver valuación y múltiplos</span>
                                </span>
                                <span className="text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                                    <span>Abrir tesis</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                            </div>
                        </div>

                        {/* Mini Selector Pills for Other Reports */}
                        <div className="flex items-center justify-center gap-1.5 mt-3 pt-1">
                            <span className="text-[0.625rem] font-bold text-muted-foreground uppercase mr-1">
                                Ver otros:
                            </span>
                            {analyses.slice(0, 5).map((item, idx) => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedIdx(idx)}
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                                        idx === selectedIdx
                                            ? 'bg-primary text-primary-foreground shadow-xs'
                                            : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40'
                                    }`}
                                >
                                    ${item.ticker}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
