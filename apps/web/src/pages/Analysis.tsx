import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Lock, Star, TrendingUp, DollarSign, Target, Briefcase, 
    Activity, Users, LineChart, ShieldAlert, Zap, Compass, CheckCircle2, 
    AlertTriangle, ArrowUpRight, ArrowDownRight, Search, 
    Sparkles, Loader2, ArrowLeft, BarChart3
} from 'lucide-react';
import { 
    ResponsiveContainer, LineChart as RCLineChart, Line, 
    XAxis, YAxis, Tooltip as RCTooltip, CartesianGrid 
} from 'recharts';
import { useAuthStore } from '@/stores/authStore';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

// Helper para formatear monedas y números grandes
const formatCurrency = (val: number | null | undefined, compact = false) => {
    if (val === null || val === undefined) return null;
    if (compact) {
        if (Math.abs(val) >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
        if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
        if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
};

// ─── PANTALLA PAYWALL PRO ───────────────────────────────────────────────────
function ProPaywallGate({ analysis }: { analysis: any }) {
    const navigate = useNavigate();

    return (
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-card/60 backdrop-blur-md p-8 sm:p-12 text-center my-8 shadow-2xl">
            <div className="absolute inset-0 pointer-events-none">
                <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full"
                    style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.15) 0%, transparent 70%)', filter: 'blur(70px)' }}
                />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-xl mx-auto space-y-6">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-primary/10 border border-primary/20 text-primary shadow-lg shadow-primary/20">
                    <Lock className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary">
                        <Star className="w-3.5 h-3.5 fill-primary" /> Exclusivo Finix Pro
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground tracking-tight">
                        Desbloqueá el Análisis Completo de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">{analysis?.companyName || 'esta acción'}</span>
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Accedé a 22 módulos de research institucional: modelos de valuación (DCF), gráficos históricos de márgenes y Cash Flow, comparativa con competidores y análisis técnico cuantitativo.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left py-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground/90 bg-muted/30 p-2.5 rounded-xl border border-border/40">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Fair Value & Supuestos DCF
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground/90 bg-muted/30 p-2.5 rounded-xl border border-border/40">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Gráficos de Revenue & Márgenes
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground/90 bg-muted/30 p-2.5 rounded-xl border border-border/40">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Ratios frente a Competidores
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground/90 bg-muted/30 p-2.5 rounded-xl border border-border/40">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Soportes, Resistencias y RSI
                    </div>
                </div>

                <div className="pt-2">
                    <Button 
                        onClick={() => navigate('/settings/plan')} 
                        className="h-12 px-8 rounded-full font-bold text-sm shadow-xl shadow-primary/25 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-primary-foreground transition-all duration-300 transform hover:scale-105"
                    >
                        Desbloquear con Finix Pro ($5/mes)
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── SUB-COMPONENTE: TARJETA DE MÉTRICA INDIVIDUAL ───────────────────────────
function MetricBox({ label, value, unit = '', highlight = false, badge = '', tooltip = '' }: { 
    label: string; 
    value: any; 
    unit?: string; 
    highlight?: boolean; 
    badge?: string;
    tooltip?: string;
}) {
    if (value === null || value === undefined || value === '') return null;

    return (
        <div className="p-4 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-sm space-y-1.5 transition-all hover:border-primary/30">
            <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block truncate">
                    {label}
                </span>
                {badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        {badge}
                    </span>
                )}
            </div>
            <div className={`text-lg sm:text-xl font-black tracking-tight ${highlight ? 'text-primary' : 'text-foreground'}`}>
                {value}{unit}
            </div>
            {tooltip && <p className="text-[11px] text-muted-foreground/80 line-clamp-1">{tooltip}</p>}
        </div>
    );
}

// ─── PÁGINA PRINCIPAL: CATÁLOGO O DETALLE ───────────────────────────────────
export default function Analysis() {
    const { slug } = useParams<{ slug?: string }>();
    const navigate = useNavigate();
    const user = useAuthStore(s => s.user);

    const [catalog, setCatalog] = useState<any[]>([]);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [isProRestricted, setIsProRestricted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (slug) {
            fetchDetail(slug);
        } else {
            fetchCatalog();
        }
    }, [slug, user]);

    const fetchCatalog = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/analysis');
            if (res.ok) {
                const data = await res.json();
                setCatalog(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetail = async (targetSlug: string) => {
        try {
            setLoading(true);
            const res = await apiFetch(`/analysis/${targetSlug}`);
            if (res.ok) {
                const json = await res.json();
                setAnalysisData(json.data);
                setIsProRestricted(Boolean(json.isProRestricted));
            } else if (res.status === 404) {
                setAnalysisData(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Cargando Análisis Finix Pro...</span>
            </div>
        );
    }

    // VISTA 1: CATÁLOGO / DIRECTORIO DE ANÁLISIS DISPONIBLES (si no hay slug)
    if (!slug) {
        const filtered = catalog.filter(item => 
            (item.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
            (item.ticker || '').toLowerCase().includes(search.toLowerCase()) ||
            (item.sector || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 mb-2">
                            <Star className="w-3.5 h-3.5 fill-primary" /> Finix Pro Research
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                            Análisis Profundo de Acciones
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                            Informes cuantitativos y fundamentales estructurados por nuestro equipo de analistas.
                        </p>
                    </div>

                    <div className="relative max-w-xs w-full">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar ticker o empresa..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border/50 text-sm focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="p-16 text-center rounded-3xl border border-border/50 bg-card/40 space-y-3">
                        <BarChart3 className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                        <h3 className="text-lg font-bold text-foreground">No se encontraron análisis</h3>
                        <p className="text-sm text-muted-foreground">Pronto publicaremos nuevos informes de activos financieros.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map((item) => (
                            <motion.div 
                                key={item.id} 
                                whileHover={{ y: -4 }}
                                onClick={() => navigate(`/analysis/${item.slug || item.ticker?.toLowerCase()}`)}
                                className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all cursor-pointer space-y-4 shadow-sm group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {item.logoUrl ? (
                                            <img src={item.logoUrl} alt="" className="w-12 h-12 rounded-2xl object-contain bg-white/5 border border-border/50 p-1.5" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center text-sm border border-primary/20">
                                                {item.ticker || 'STK'}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{item.companyName}</h3>
                                            <span className="text-xs text-muted-foreground font-semibold">{item.ticker} • {item.sector || 'Mercado'}</span>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>

                                <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-3 text-xs">
                                    {item.currentPrice && (
                                        <div>
                                            <span className="text-muted-foreground block text-[11px]">Precio Actual</span>
                                            <span className="font-bold text-foreground text-sm">${Number(item.currentPrice).toFixed(2)}</span>
                                            {item.dailyChange && (
                                                <span className={`text-[11px] ml-1 font-semibold ${Number(item.dailyChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {Number(item.dailyChange) >= 0 ? '+' : ''}{Number(item.dailyChange).toFixed(2)}%
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {item.estimatedFairValue && (
                                        <div>
                                            <span className="text-muted-foreground block text-[11px]">Fair Value</span>
                                            <span className="font-bold text-primary text-sm">${Number(item.estimatedFairValue).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // VISTA 2: INFORME DE ANÁLISIS DE LA ACCIÓN
    if (!analysisData) {
        return (
            <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
                <Target className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                <h2 className="text-2xl font-bold text-foreground">Análisis no disponible</h2>
                <p className="text-sm text-muted-foreground">No encontramos un reporte para "{slug}".</p>
                <Button onClick={() => navigate('/analysis')} variant="outline">
                    ← Ver todos los análisis
                </Button>
            </div>
        );
    }

    const a = analysisData;
    const visibility = a.sectionVisibility || {};
    const summary = a.executiveSummary;
    const businessModel = a.businessModel || [];
    const competitors = a.competitorsData || [];
    const series = a.historicalSeries || {};
    const tech = a.technicalData || {};
    const risks = a.risksData || [];
    const catalysts = a.catalystsData || [];
    const scenarios = a.scenariosData;
    const swot = a.swotData;
    const methodology = a.valuationMethodology;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10 pb-32">
            {/* Navegación Superior */}
            <div className="flex items-center justify-between">
                <Link to="/analysis" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver al catálogo de análisis
                </Link>
                <span className="text-xs text-muted-foreground">
                    Actualizado: {new Date(a.updatedAt || Date.now()).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
            </div>

            {/* 1. HEADER PRINCIPAL */}
            <div className="p-6 sm:p-8 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        {a.logoUrl ? (
                            <img src={a.logoUrl} alt="" className="w-16 h-16 rounded-2xl object-contain bg-white/5 border border-border/50 p-2" />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center text-2xl border border-primary/20">
                                {a.ticker || 'STK'}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{a.companyName || a.symbol}</h1>
                                <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-lg border border-border/40">
                                    {a.ticker}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {a.exchange && <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">{a.exchange}</span>}
                                {a.sector && <span className="bg-muted px-2 py-0.5 rounded text-foreground/80 font-medium">{a.sector}</span>}
                                {a.industry && <span>• {a.industry}</span>}
                                {a.country && <span>• {a.country}</span>}
                            </div>
                        </div>
                    </div>

                    {a.currentPrice && (
                        <div className="sm:text-right bg-muted/30 sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-border/40 sm:border-none">
                            <div className="text-3xl sm:text-4xl font-black text-foreground">${Number(a.currentPrice).toFixed(2)}</div>
                            <div className={`text-sm font-bold flex items-center sm:justify-end gap-1 ${Number(a.dailyChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {Number(a.dailyChange) >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                {Number(a.dailyChange) >= 0 ? '+' : ''}{Number(a.dailyChange || 0).toFixed(2)}% hoy
                            </div>
                        </div>
                    )}
                </div>

                {/* Resumen de Métricas de Mercado */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-border/40">
                    {a.marketCap && (
                        <div className="bg-muted/20 p-3 rounded-2xl border border-border/30">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Market Cap</span>
                            <span className="text-sm font-bold text-foreground">{formatCurrency(a.marketCap, true)}</span>
                        </div>
                    )}
                    {a.high52w && (
                        <div className="bg-muted/20 p-3 rounded-2xl border border-border/30">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">52W High</span>
                            <span className="text-sm font-bold text-foreground">${Number(a.high52w).toFixed(2)}</span>
                            {a.distanceToHigh && <span className="text-[10px] text-muted-foreground ml-1">({a.distanceToHigh}%)</span>}
                        </div>
                    )}
                    {a.low52w && (
                        <div className="bg-muted/20 p-3 rounded-2xl border border-border/30">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">52W Low</span>
                            <span className="text-sm font-bold text-foreground">${Number(a.low52w).toFixed(2)}</span>
                            {a.distanceToLow && <span className="text-[10px] text-emerald-400 ml-1">(+{a.distanceToLow}%)</span>}
                        </div>
                    )}
                    {a.peRatio && (
                        <div className="bg-muted/20 p-3 rounded-2xl border border-border/30">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">P/E Ratio</span>
                            <span className="text-sm font-bold text-primary">{Number(a.peRatio).toFixed(1)}x</span>
                        </div>
                    )}
                </div>
            </div>

            {/* PAYWALL PRO SI EL USUARIO NO TIENE SUSCRIPCIÓN ACTIVA */}
            {isProRestricted && (
                <>
                    {/* Teaser parcial del resumen ejecutivo */}
                    {summary?.summary && (
                        <div className="p-6 rounded-3xl border border-border/40 bg-card/40 space-y-2">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Visión General</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{summary.summary}</p>
                        </div>
                    )}

                    <ProPaywallGate analysis={a} />
                </>
            )}

            {/* SECCIONES COMPLETAS SI EL USUARIO TIENE ACCESO FINIX PRO */}
            {!isProRestricted && (
                <div className="space-y-12">
                    {/* 2. RESUMEN EJECUTIVO */}
                    {visibility.showSummary !== false && summary?.title && (
                        <section className="p-6 sm:p-8 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm space-y-5">
                            <div className="flex items-center gap-2.5 text-primary">
                                <Sparkles className="w-5 h-5" />
                                <h2 className="text-lg font-bold text-foreground tracking-tight">Resumen Ejecutivo</h2>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">{summary.title}</h3>
                            {summary.summary && <p className="text-sm text-muted-foreground leading-relaxed">{summary.summary}</p>}

                            {(summary.positivePoints?.length > 0 || summary.negativePoints?.length > 0) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    {summary.positivePoints?.length > 0 && (
                                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2.5">
                                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4" /> Puntos Fuertes
                                            </span>
                                            <ul className="space-y-2 text-xs text-foreground/90">
                                                {summary.positivePoints.map((pt: string, idx: number) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <span className="text-emerald-400 font-bold">•</span>
                                                        <span>{pt}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {summary.negativePoints?.length > 0 && (
                                        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2.5">
                                            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <AlertTriangle className="w-4 h-4" /> Aspectos de Cautela
                                            </span>
                                            <ul className="space-y-2 text-xs text-foreground/90">
                                                {summary.negativePoints.map((pt: string, idx: number) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <span className="text-rose-400 font-bold">•</span>
                                                        <span>{pt}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {summary.conclusion && (
                                <div className="pt-2 text-xs text-muted-foreground italic border-t border-border/40">
                                    {summary.conclusion}
                                </div>
                            )}
                        </section>
                    )}

                    {/* 3. FAIR VALUE & VALUACIÓN INTRÍNSECA */}
                    {visibility.showFairValue !== false && a.estimatedFairValue && (
                        <section className="p-6 sm:p-8 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-primary/20 text-primary border border-primary/30">
                                        <Target className="w-3.5 h-3.5" /> Fair Value & Valoración
                                    </div>
                                    <div className="text-3xl sm:text-4xl font-black text-foreground">
                                        ${Number(a.estimatedFairValue).toFixed(2)}
                                    </div>
                                    <p className="text-xs text-muted-foreground max-w-xl">
                                        Precio objetivo intrínseco calculado mediante {methodology?.method || 'flujos de caja descontados (DCF) y múltiplos comparables'}.
                                    </p>
                                </div>

                                {a.currentPrice && (
                                    <div className="p-5 rounded-2xl bg-card border border-border/50 text-center shrink-0 shadow-lg">
                                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                            {Number(a.estimatedFairValue) >= Number(a.currentPrice) ? 'Potencial Upside' : 'Potencial Downside'}
                                        </span>
                                        <div className={`text-3xl font-black ${Number(a.estimatedFairValue) >= Number(a.currentPrice) ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {((Number(a.estimatedFairValue) / Number(a.currentPrice) - 1) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                )}
                            </div>

                            {methodology?.assumptions && (
                                <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 text-xs space-y-1">
                                    <span className="font-bold text-foreground">Supuestos del Modelo:</span>
                                    <p className="text-muted-foreground leading-relaxed">{methodology.assumptions}</p>
                                </div>
                            )}
                        </section>
                    )}

                    {/* 4. MODELO DE NEGOCIO Y PRODUCTOS */}
                    {visibility.showBusinessModel !== false && businessModel.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-foreground font-bold">
                                <Briefcase className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-bold tracking-tight">Modelo de Negocio y Segmentos</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {businessModel.map((bm: any, idx: number) => (
                                    <div key={idx} className="p-5 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-foreground text-sm">{bm.product}</h4>
                                            {bm.revenuePct && (
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                    {bm.revenuePct}% ingresos
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{bm.description}</p>
                                        <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
                                            {bm.growth && <span>Crecimiento: <strong className="text-foreground font-semibold">{bm.growth}%</strong></span>}
                                            {bm.margin && <span>Margen: <strong className="text-foreground font-semibold">{bm.margin}%</strong></span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 5. INGRESOS Y CRECIMIENTO (CON GRÁFICOS RECHARTS) */}
                    {visibility.showGrowth !== false && (a.revenue || series.revenue?.length > 0) && (
                        <section className="p-6 sm:p-8 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm space-y-6">
                            <div className="flex items-center gap-2.5 text-primary">
                                <TrendingUp className="w-5 h-5" />
                                <h2 className="text-lg font-bold text-foreground tracking-tight">Ingresos y Crecimiento</h2>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <MetricBox label="Revenue TTM" value={formatCurrency(a.revenue, true)} highlight />
                                <MetricBox label="Crecimiento YoY" value={a.revenueGrowthYoY} unit="%" />
                                <MetricBox label="CAGR 3 Años" value={a.revenueCagr3y} unit="%" />
                                <MetricBox label="ARR Anualizado" value={formatCurrency(a.arr, true)} />
                            </div>

                            {/* Gráfico Recharts: Revenue Histórico */}
                            {series.revenue?.length > 1 && (
                                <div className="space-y-2 pt-4">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                                        Evolución Histórica de Ingresos ($M USD)
                                    </span>
                                    <div className="h-64 w-full pt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RCLineChart data={series.revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                                <XAxis dataKey="period" stroke="#71717a" fontSize={12} tickLine={false} />
                                                <YAxis stroke="#71717a" fontSize={12} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}B`} />
                                                <RCTooltip 
                                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                                                    formatter={(val: any) => [`$${val.toLocaleString()} M`, 'Revenue']}
                                                />
                                                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
                                            </RCLineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {a.revenueGuidance && (
                                <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 text-xs text-muted-foreground">
                                    <strong className="text-foreground">Guidance Oficial:</strong> {a.revenueGuidance}
                                </div>
                            )}
                        </section>
                    )}

                    {/* 6. RENTABILIDAD Y MÁRGENES (CON GRÁFICOS RECHARTS) */}
                    {visibility.showProfitability !== false && (a.eps || series.margins?.length > 0) && (
                        <section className="p-6 sm:p-8 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm space-y-6">
                            <div className="flex items-center gap-2.5 text-primary">
                                <DollarSign className="w-5 h-5" />
                                <h2 className="text-lg font-bold text-foreground tracking-tight">Rentabilidad y Retorno de Capital</h2>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <MetricBox label="EPS Diluido" value={a.eps ? `$${Number(a.eps).toFixed(2)}` : null} highlight />
                                <MetricBox label="Margen Bruto" value={a.grossMargin} unit="%" />
                                <MetricBox label="Margen Operativo" value={a.operatingMargin} unit="%" />
                                <MetricBox label="ROIC" value={a.roic} unit="%" badge="Excelente" />
                            </div>

                            {/* Gráfico Recharts: Márgenes Históricos */}
                            {series.margins?.length > 1 && (
                                <div className="space-y-2 pt-4">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                                        Evolución de Márgenes (% Gross, Operating, Net)
                                    </span>
                                    <div className="h-64 w-full pt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RCLineChart data={series.margins} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                                <XAxis dataKey="period" stroke="#71717a" fontSize={12} tickLine={false} />
                                                <YAxis stroke="#71717a" fontSize={12} tickLine={false} tickFormatter={(v) => `${v}%`} />
                                                <RCTooltip 
                                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                                                    formatter={(val: any) => [`${val}%`]}
                                                />
                                                <Line type="monotone" dataKey="grossMargin" name="Bruto" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="operatingMargin" name="Operativo" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="netMargin" name="Neto" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3 }} />
                                            </RCLineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* 7. CASH FLOW & BALANCE */}
                    {visibility.showCashFlow !== false && (a.freeCashFlow || a.cash) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Cash Flow */}
                            <section className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm space-y-4">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <Activity className="w-5 h-5" />
                                    <h3 className="text-base font-bold text-foreground">Generación de Caja (Cash Flow)</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <MetricBox label="Operating Cash Flow" value={formatCurrency(a.operatingCashFlow, true)} />
                                    <MetricBox label="Free Cash Flow" value={formatCurrency(a.freeCashFlow, true)} highlight />
                                    <MetricBox label="CapEx" value={formatCurrency(a.capEx, true)} />
                                    <MetricBox label="FCF Yield" value={a.fcfYield} unit="%" />
                                </div>
                            </section>

                            {/* Balance */}
                            <section className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm space-y-4">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <Briefcase className="w-5 h-5" />
                                    <h3 className="text-base font-bold text-foreground">Balance Financiero & Deuda</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <MetricBox label="Efectivo (Cash)" value={formatCurrency(a.cash, true)} />
                                    <MetricBox label="Deuda Total" value={formatCurrency(a.totalDebt, true)} />
                                    <MetricBox label="Deuda Neta" value={formatCurrency(a.netDebt, true)} />
                                    <MetricBox label="Net Debt / EBITDA" value={a.netDebtToEbitda} unit="x" badge="Bajo" />
                                </div>
                            </section>
                        </div>
                    )}

                    {/* 8. COMPETIDORES (TABLA Y GRÁFICO COMPARATIVO) */}
                    {visibility.showCompetitors !== false && competitors.length > 0 && (
                        <section className="p-6 sm:p-8 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm space-y-6">
                            <div className="flex items-center gap-2.5 text-primary">
                                <Users className="w-5 h-5" />
                                <h2 className="text-lg font-bold text-foreground tracking-tight">Comparación con Competidores Directos</h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted/40 text-muted-foreground uppercase border-b border-border/40">
                                        <tr>
                                            <th className="px-4 py-3 font-bold">Empresa</th>
                                            <th className="px-4 py-3 font-bold">Ticker</th>
                                            <th className="px-4 py-3 font-bold">P/E Ratio</th>
                                            <th className="px-4 py-3 font-bold">ROIC (%)</th>
                                            <th className="px-4 py-3 font-bold">Margen Neto (%)</th>
                                            <th className="px-4 py-3 font-bold">Market Cap</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {competitors.map((c: any, idx: number) => {
                                            const isSelected = c.ticker === a.ticker;
                                            return (
                                                <tr key={idx} className={isSelected ? 'bg-primary/10 font-bold text-primary' : 'text-foreground/90'}>
                                                    <td className="px-4 py-3.5 font-bold">{c.name}</td>
                                                    <td className="px-4 py-3.5 font-semibold">{c.ticker}</td>
                                                    <td className="px-4 py-3.5">{c.pe ? `${c.pe}x` : '-'}</td>
                                                    <td className="px-4 py-3.5">{c.roic ? `${c.roic}%` : '-'}</td>
                                                    <td className="px-4 py-3.5">{c.netMargin ? `${c.netMargin}%` : '-'}</td>
                                                    <td className="px-4 py-3.5">{c.marketCap ? `$${c.marketCap}B` : '-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* 9. ANÁLISIS TÉCNICO CUANTITATIVO */}
                    {visibility.showTechnical !== false && (a.rsi || tech.supports?.length > 0) && (
                        <section className="p-6 sm:p-8 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5 text-primary">
                                    <LineChart className="w-5 h-5" />
                                    <h2 className="text-lg font-bold text-foreground tracking-tight">Análisis Técnico Cuantitativo</h2>
                                </div>
                                {tech.technicalSignal && (
                                    <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                        Señal: {tech.technicalSignal}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <MetricBox label="RSI (14D)" value={a.rsi} badge={Number(a.rsi) > 70 ? 'Sobrecompra' : Number(a.rsi) < 30 ? 'Sobreventa' : 'Neutral'} />
                                <MetricBox label="SMA 50" value={a.sma50 ? `$${Number(a.sma50).toFixed(2)}` : null} />
                                <MetricBox label="SMA 200" value={a.sma200 ? `$${Number(a.sma200).toFixed(2)}` : null} />
                                <MetricBox label="Tendencia" value={a.trend || 'Alcista'} highlight />
                            </div>

                            {/* Gráfico de Precios con Medias */}
                            {tech.priceSeries?.length > 1 && (
                                <div className="space-y-2 pt-2">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                                        Evolución de Precio vs Medias Móviles (SMA 20 & 50)
                                    </span>
                                    <div className="h-60 w-full pt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RCLineChart data={tech.priceSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                                <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} />
                                                <YAxis stroke="#71717a" fontSize={12} tickLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `$${v}`} />
                                                <RCTooltip 
                                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                                                    formatter={(val: any) => [`$${val}`]}
                                                />
                                                <Line type="monotone" dataKey="price" name="Precio" stroke="#ffffff" strokeWidth={3} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="ma20" name="SMA 20" stroke="#10b981" strokeWidth={1.5} dot={false} />
                                                <Line type="monotone" dataKey="ma50" name="SMA 50" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                                            </RCLineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Soportes y Resistencias */}
                            {(a.supports || a.resistances) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    {a.supports && (
                                        <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 space-y-1 text-xs">
                                            <span className="font-bold text-emerald-400 block uppercase tracking-wider">Niveles de Soporte</span>
                                            <p className="text-muted-foreground">{a.supports}</p>
                                        </div>
                                    )}
                                    {a.resistances && (
                                        <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 space-y-1 text-xs">
                                            <span className="font-bold text-rose-400 block uppercase tracking-wider">Niveles de Resistencia</span>
                                            <p className="text-muted-foreground">{a.resistances}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {/* 10. RIESGOS Y CATALIZADORES */}
                    {visibility.showRisks !== false && (risks.length > 0 || catalysts.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Riesgos */}
                            {risks.length > 0 && (
                                <section className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm space-y-4">
                                    <div className="flex items-center gap-2 text-rose-400 font-bold">
                                        <ShieldAlert className="w-5 h-5" />
                                        <h3 className="text-base font-bold text-foreground">Principales Factores de Riesgo</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {risks.map((r: any, idx: number) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="font-bold text-foreground text-xs">{r.title}</h5>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                        r.severity === 'HIGH' || r.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                                                    }`}>
                                                        {r.severity}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Catalizadores */}
                            {catalysts.length > 0 && (
                                <section className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm space-y-4">
                                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                                        <Zap className="w-5 h-5" />
                                        <h3 className="text-base font-bold text-foreground">Catalizadores de Crecimiento</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {catalysts.map((c: any, idx: number) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="font-bold text-foreground text-xs">{c.title}</h5>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                                        {c.horizon}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    {/* 11. ESCENARIOS (BULL / BASE / BEAR) */}
                    {visibility.showScenarios !== false && scenarios && (
                        <section className="p-6 sm:p-8 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm space-y-6">
                            <div className="flex items-center gap-2.5 text-primary">
                                <Compass className="w-5 h-5" />
                                <h2 className="text-lg font-bold text-foreground tracking-tight">Escenarios de Inversión (Bull / Base / Bear)</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {scenarios.bull && (
                                    <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Escenario Alcista (Bull)</span>
                                        <div className="text-2xl font-black text-foreground">{scenarios.bull.fairValue || '$--'}</div>
                                        {scenarios.bull.upside && <span className="text-xs font-bold text-emerald-400 block">{scenarios.bull.upside} potencial</span>}
                                        <p className="text-xs text-muted-foreground pt-2 leading-relaxed">{scenarios.bull.assumptions}</p>
                                    </div>
                                )}
                                {scenarios.base && (
                                    <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Escenario Base (Base)</span>
                                        <div className="text-2xl font-black text-foreground">{scenarios.base.fairValue || '$--'}</div>
                                        {scenarios.base.upside && <span className="text-xs font-bold text-blue-400 block">{scenarios.base.upside} potencial</span>}
                                        <p className="text-xs text-muted-foreground pt-2 leading-relaxed">{scenarios.base.assumptions}</p>
                                    </div>
                                )}
                                {scenarios.bear && (
                                    <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Escenario Bajista (Bear)</span>
                                        <div className="text-2xl font-black text-foreground">{scenarios.bear.fairValue || '$--'}</div>
                                        {scenarios.bear.upside && <span className="text-xs font-bold text-rose-400 block">{scenarios.bear.upside} downside</span>}
                                        <p className="text-xs text-muted-foreground pt-2 leading-relaxed">{scenarios.bear.assumptions}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* 12. MATRIZ DAFO / SWOT */}
                    {swot && (swot.strengths?.length > 0 || swot.weaknesses?.length > 0) && (
                        <section className="p-6 sm:p-8 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm space-y-6">
                            <h2 className="text-lg font-bold text-foreground tracking-tight">Matriz DAFO / SWOT</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {swot.strengths?.length > 0 && (
                                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Fortalezas</span>
                                        <ul className="space-y-1.5 text-xs text-foreground/90">
                                            {swot.strengths.map((s: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-1.5">• <span>{s}</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {swot.opportunities?.length > 0 && (
                                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Oportunidades</span>
                                        <ul className="space-y-1.5 text-xs text-foreground/90">
                                            {swot.opportunities.map((o: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-1.5">• <span>{o}</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {swot.weaknesses?.length > 0 && (
                                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Debilidades</span>
                                        <ul className="space-y-1.5 text-xs text-foreground/90">
                                            {swot.weaknesses.map((w: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-1.5">• <span>{w}</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {swot.threats?.length > 0 && (
                                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Amenazas</span>
                                        <ul className="space-y-1.5 text-xs text-foreground/90">
                                            {swot.threats.map((t: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-1.5">• <span>{t}</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* 13. FUENTES Y AVISO LEGAL */}
                    <div className="p-6 rounded-3xl bg-muted/20 border border-border/40 text-center space-y-2 text-xs text-muted-foreground">
                        {a.sources && <p className="font-semibold text-foreground/80">Fuentes de Información: {a.sources}</p>}
                        <p>{a.legalDisclaimer || 'Este contenido tiene fines informativos y educativos y no constituye asesoramiento financiero ni recomendación de inversión.'}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
