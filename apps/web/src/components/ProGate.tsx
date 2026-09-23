import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock,
    ChevronRight,
    Crown,
    Check,
    TrendingUp,
    Zap,
    Briefcase,
    LineChart,
    Layers,
    Newspaper,
    Calendar,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Bell,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore, isJuanUser, isProUser } from '@/stores/authStore';

export type ProSectionType = 'market' | 'portfolio' | 'analysis' | 'news' | 'calendar' | 'alerts' | 'general';

interface SectionInfo {
    badge: string;
    icon: any;
    defaultTitle: string;
    defaultDesc: string;
    features: Array<{ title: string; desc: string }>;
}

const SECTION_DATA: Record<ProSectionType, SectionInfo> = {
    market: {
        badge: 'MERCADOS EN TIEMPO REAL & PRE-MARKET',
        icon: LineChart,
        defaultTitle: 'Mercado Financiero Institucional PRO',
        defaultDesc: 'Monitoreo de Wall Street y CEDEARs en tiempo real. Pre-Market con cotizaciones congeladas post-apertura, mapa de calor del S&P 500 y lentes técnicas semanales.',
        features: [
            {
                title: 'Pre-Market & Cotizaciones en Vivo',
                desc: 'Precios en tiempo real durante la rueda y cotización congelada de cierre de premarket a las 10:30 hs para comparar con precisión.',
            },
            {
                title: 'Mapa de Calor Institucional S&P 500',
                desc: 'Treemap interactivo por capitalización bursátil y los 11 sectores GICS con rotación sectorial y variaciones porcentuales.',
            },
            {
                title: 'Lentes Técnicas Semanales Multimétricas',
                desc: 'Filtros confluentes con MACD (impulso), RSI semanal 45/55 (reversión), ADX (fuerza tendencial) y Estocástico rápido.',
            },
            {
                title: 'Screener de Top Gainers, Losers & Volumen',
                desc: 'Ranking institucional de activos más activos, mayores subas y bajas intradiarias para detectar oportunidades al instante.',
            },
        ],
    },
    portfolio: {
        badge: 'GESTIÓN PATRIMONIAL AVANZADA',
        icon: Briefcase,
        defaultTitle: 'Gestión Multi-Portafolio Cuantitativa PRO',
        defaultDesc: 'Seguimiento patrimonial profesional con métricas cuantitativas, análisis de riesgo ponderado y comparativa gráfica contra el S&P 500 ($SPY).',
        features: [
            {
                title: 'Creación de Múltiples Portafolios Ilimitados',
                desc: 'Organizá tus inversiones por estrategia: Dividendos, Crecimiento, Renta Fija, Cripto o Carteras de Valor.',
            },
            {
                title: 'Métricas Institucionales TWR y XIRR',
                desc: 'Tasa Ponderada en el Tiempo (TWR), Tasa Interna de Retorno (XIRR), Alpha acumulado, Beta y Ratio Sharpe en tiempo real.',
            },
            {
                title: 'Benchmark Gráfico Interactivo vs S&P 500 ($SPY)',
                desc: 'Comparación visual de sobre-rendimiento para medir si tu estrategia de inversión supera al mercado general.',
            },
            {
                title: 'Desglose de Riesgo & Proyección de Dividendos',
                desc: 'Distribución porcentual por sector, ponderación de activos y calendario predictivo de cobro de dividendos.',
            },
        ],
    },
    analysis: {
        badge: 'RESEARCH & VALUACIÓN FUNDAMENTAL',
        icon: Layers,
        defaultTitle: 'Modelos de Valuación Cuantitativa & DCF PRO',
        defaultDesc: 'Modelos matemáticos de valuación intrínseca, cálculo de Fair Value por DCF, mapa ROIC vs WACC y balances auditados de 10 años.',
        features: [
            {
                title: 'Modelo de Flujos de Fondos Descontados (DCF)',
                desc: 'Estimación automática de Valor Intrínseco (Fair Value) con supuestos proyectados a 5 años y cálculo de margen de seguridad.',
            },
            {
                title: 'Mapa de Creación de Valor (ROIC vs WACC)',
                desc: 'Matriz visual de retorno sobre capital invertido vs costo de capital con calculadora interactiva de WACC.',
            },
            {
                title: 'Scores de Salud Financiera Piotroski F-Score y Altman Z',
                desc: 'Puntuación matemática de solvencia (0-9), calidad contable y probabilidad de quiebra corporativa.',
            },
            {
                title: 'Balances de 10 Años y Múltiplos Comparables',
                desc: 'Histórico completo de Estado de Resultados, Balance y FCF con múltiplos EV/EBITDA, P/E, P/FCF y PEG.',
            },
        ],
    },
    news: {
        badge: 'FEED & SENTIMIENTO EN TIEMPO REAL',
        icon: Newspaper,
        defaultTitle: 'Inteligencia de Noticias Financieras con IA PRO',
        defaultDesc: 'Cobertura continua de Wall Street, Reserva Federal y macroeconomía con análisis algorítmico de sentimiento e impacto en activos.',
        features: [
            {
                title: 'Feed en Vivo sin Límites de Lectura',
                desc: 'Cobertura ininterrumpida de Wall Street, balances trimestrales, decisiones de tasas y contexto argentino.',
            },
            {
                title: 'Análisis Algorítmico de Sentimiento por IA',
                desc: 'Clasificación de noticias (Alcista / Neutral / Bajista) con puntaje de impacto proyectado en la cotización.',
            },
            {
                title: 'Detección Directa de Tickers Impactados',
                desc: 'Vinculación inteligente de noticias a acciones ($NVDA, $AAPL, $TSLA, etc.) para operar con ventaja inmediata.',
            },
            {
                title: 'Alertas Tempranas de Catalizadores',
                desc: 'Notificaciones sobre reportes de balances, minutas de la Fed y catalizadores que mueven el mercado.',
            },
        ],
    },
    calendar: {
        badge: 'CALENDARIO MACRO, EARNINGS & DIVIDENDOS',
        icon: Calendar,
        defaultTitle: 'Calendario Económico Institucional PRO',
        defaultDesc: 'Eventos económicos de alto impacto de TradingView, reportes trimestrales de ganancias (Earnings Season) y dividendos oficiales.',
        features: [
            {
                title: 'Calendario Macroeconómico de Alto Impacto',
                desc: 'Decisiones de tasas de la Fed (FOMC), datos de inflación (IPC/CPI), empleo (NFP) y actividad económica global.',
            },
            {
                title: 'Temporada de Balances (Earnings) con % Sorpresa',
                desc: 'Fechas de reportes corporativos con consenso de analistas, ingresos y EPS proyectado vs real con sorpresa.',
            },
            {
                title: 'Calendario Oficial de Dividendos S&P 500 y CEDEARs',
                desc: 'Fechas ex-dividend, fechas de pago, montos en efectivo y rendimiento por dividendo (Dividend Yield) anual.',
            },
            {
                title: 'Cuentas Regresivas & Nivel de Impacto',
                desc: 'Temporizadores en tiempo real hasta la apertura de cada evento para proteger tus posiciones de la volatilidad.',
            },
        ],
    },
    alerts: {
        badge: 'ALERTAS & ENVÍOS AUTOMÁTICOS',
        icon: Bell,
        defaultTitle: 'Sistema de Alertas Financieras PRO',
        defaultDesc: 'Monitoreo activo 24/7 en segundo plano con disparadores personalizados de precio, volumen y cruces técnicos vía Email y Telegram.',
        features: [
            {
                title: 'Monitoreo en Servidor 24/7 sin Mantener la App Abierta',
                desc: 'Tus alertas se ejecutan continuamente en la nube detectando movimientos de mercado en tiempo real.',
            },
            {
                title: 'Disparadores por Precio, Variación y Volumen Inusual',
                desc: 'Configurá condiciones exactas (precio mayor/menor, quiebre de soporte/resistencia o saltos porcentuales).',
            },
            {
                title: 'Notificaciones Multicanal Instantáneas',
                desc: 'Recibí el aviso de inmediato con plantilla HTML responsive en tu Email y mensaje directo en tu Telegram.',
            },
            {
                title: 'Auditoría y Tasa de Entrega en Vivo',
                desc: 'Historial completo de alertas disparadas, estado de despacho y contexto técnico del activo en el momento.',
            },
        ],
    },
    general: {
        badge: 'FINIX PRO · ACCESO TOTAL',
        icon: Sparkles,
        defaultTitle: 'Funcionalidad Exclusiva PRO',
        defaultDesc: 'Accedé a herramientas financieras avanzadas, análisis institucional, cotizaciones en tiempo real y alertas automáticas.',
        features: [
            {
                title: 'Mercados en Vivo & Pre-Market',
                desc: 'Cotizaciones en tiempo real sin delay, precios congelados post-apertura y mapa de calor S&P 500.',
            },
            {
                title: 'Modelos de Valuación Fundamental DCF & ROIC/WACC',
                desc: 'Cálculo automático de Valor Intrínseco (Fair Value), múltiplos de mercado y puntuación Piotroski F-Score.',
            },
            {
                title: 'Gestión Multi-Portafolio Cuantitativa',
                desc: 'Métricas TWR, XIRR, Alpha y Ratio Sharpe con comparativa gráfica contra el S&P 500 ($SPY).',
            },
            {
                title: 'Calendario Económico, Dividendos y Alertas 24/7',
                desc: 'Eventos de alto impacto de la Reserva Federal, Earnings corporativos, fechas ex-dividend y alertas multicanal.',
            },
        ],
    },
};

const ALL_SECTIONS_OVERVIEW = [
    { name: 'Mercados', icon: LineChart, desc: 'Cotizaciones en vivo, Pre-Market congelado a las 10:30 hs, heatmap S&P 500 y lentes técnicas semanales.' },
    { name: 'Portafolios', icon: Briefcase, desc: 'Multi-carteras ilimitadas, métricas TWR, XIRR, Sharpe Ratio y benchmark vs SPY.' },
    { name: 'Análisis', icon: Layers, desc: 'Modelo DCF de Fair Value intrínseco, matriz ROIC vs WACC y balances de 10 años.' },
    { name: 'Noticias', icon: Newspaper, desc: 'Feed financiero en vivo, análisis de sentimiento con IA y alertas por ticker.' },
    { name: 'Calendario', icon: Calendar, desc: 'Datos oficiales TradingView, reportes de Earnings con sorpresa y dividendos S&P 500.' },
    { name: 'Alertas', icon: Bell, desc: 'Disparadores 24/7 por precio y volumen con avisos automáticos por Email y Telegram.' },
];

export interface ProGateProps {
    section?: ProSectionType;
    title?: string;
    description?: string;
    badgeText?: string;
    buttonText?: string;
    features?: Array<{ title: string; desc: string }>;
    onUpgrade?: () => void;
    className?: string;
    children?: React.ReactNode;
}

export function ProGate({
    section,
    title,
    description,
    badgeText,
    buttonText = 'Activar Finix PRO',
    features: customFeatures,
    onUpgrade,
    className = '',
    children,
}: ProGateProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useAuthStore((s) => s.user);
    const [showAllSections, setShowAllSections] = useState(false);

    const isJuan = isJuanUser(user);
    const isPro = isJuan || isProUser(user);

    // Juan26-08 (and active PRO / Admin users) are permanently exempt and never blocked
    if (isPro) {
        return children ? <>{children}</> : null;
    }

    // Auto-detect section if not explicitly passed
    const pathname = (location.pathname || '').toLowerCase();
    const resolvedSection: ProSectionType = section || (
        pathname.includes('/market') || pathname.includes('/mercado') ? 'market' :
        pathname.includes('/portfolio') || pathname.includes('/portafolio') ? 'portfolio' :
        pathname.includes('/analysis') || pathname.includes('/analisis') ? 'analysis' :
        pathname.includes('/news') || pathname.includes('/noticias') ? 'news' :
        pathname.includes('/calendar') || pathname.includes('/calendario') ? 'calendar' :
        pathname.includes('/alert') || pathname.includes('/alerta') || pathname.includes('/email') ? 'alerts' :
        'general'
    );

    const sectionMeta = SECTION_DATA[resolvedSection] || SECTION_DATA.general;
    const displayBadge = badgeText || sectionMeta.badge;
    const displayTitle = title || sectionMeta.defaultTitle;
    const displayDesc = description || sectionMeta.defaultDesc;
    const displayFeatures = customFeatures || sectionMeta.features;

    const handleUpgrade = onUpgrade || (() => {
        if (!user) {
            navigate(`/auth?redirect=${encodeURIComponent('/pricing')}&plan=PRO`);
        } else {
            navigate('/pricing');
        }
    });

    return (
        <div className={`relative w-full flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-60px)] px-4 sm:px-6 py-10 overflow-hidden bg-background ${className}`}>
            
            {/* ── TEASER DE FONDO: INTERFAZ FINANCIERA CON DATOS OCULTOS / DIFUMINADOS ── */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none filter blur-[2px] opacity-55 dark:opacity-45 scale-[0.99] transition-all">
                {children ? (
                    <div className="w-full h-full p-6">
                        {children}
                    </div>
                ) : (
                    <div className="w-full max-w-7xl mx-auto h-full p-4 sm:p-8 flex flex-col gap-6">
                        <section className="rounded-2xl border border-primary/25 bg-card/80 p-4 sm:p-5 shadow-sm">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                                <sectionMeta.icon className="h-4 w-4" />
                                <span>{displayBadge}</span>
                            </div>
                            <h3 className="mt-2 text-lg font-bold text-foreground">{displayTitle}</h3>
                            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">{displayDesc}</p>
                            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                {displayFeatures.map((feature) => (
                                    <div key={feature.title} className="rounded-xl border border-border/60 bg-background/80 p-3">
                                        <p className="text-xs font-semibold text-foreground">{feature.title}</p>
                                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Mock Header & Filter Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/40">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-48 rounded-xl bg-card border border-border/60 flex items-center px-3 gap-2">
                                    <div className="w-4 h-4 rounded-full bg-primary/40" />
                                    <div className="h-3 w-24 rounded bg-muted-foreground/30" />
                                </div>
                                <div className="flex items-center gap-2">
                                    {['$NVDA', '$AAPL', '$MELI', '$SPY', '$BTC'].map((t, idx) => (
                                        <span key={t} className="px-3 py-1 rounded-lg text-xs font-bold bg-card border border-border/60 text-muted-foreground/60 flex items-center gap-1.5">
                                            <span>{t}</span>
                                            <span className={idx % 2 === 0 ? 'text-emerald-500/70' : 'text-primary/70'}>+•.••%</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-28 rounded-lg bg-card border border-border/60" />
                                <div className="h-8 w-20 rounded-lg bg-primary/20 border border-primary/30" />
                            </div>
                        </div>

                        {/* Mock KPI Metric Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Rendimiento Anualizado', val: '+38.45%', change: '+4.2% hoy', positive: true },
                                { label: 'Valor Intrínseco DCF', val: 'US$ 184.20', change: 'Descuento 21%', positive: true },
                                { label: 'Ratio Sharpe & Alpha', val: '2.14 / +6.8%', change: 'Riesgo Óptimo', positive: true },
                                { label: 'Señales Algorítmicas', val: '12 Activas', change: 'Alta Convicción', positive: true },
                            ].map((card, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-card/60 border border-border/50 shadow-sm flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-muted-foreground/70">{card.label}</span>
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <TrendingUp className="w-3.5 h-3.5 text-primary/60" />
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black tracking-tight text-foreground/80 filter blur-[2px]">
                                            {card.val}
                                        </span>
                                        <span className="text-[11px] font-bold text-emerald-500/80 filter blur-[1px]">
                                            {card.change}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden mt-1">
                                        <div className="h-full bg-primary/50 rounded-full" style={{ width: `${60 + idx * 10}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Mock Central Chart Area */}
                        <div className="w-full h-72 rounded-2xl bg-card/40 border border-border/50 p-5 flex flex-col justify-between relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-32 rounded bg-muted/60" />
                                    <div className="h-5 w-20 rounded bg-emerald-500/20" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {['1D', '1S', '1M', '1A', 'TODOS'].map((tf, i) => (
                                        <span key={tf} className={`px-2.5 py-1 rounded text-[11px] font-bold ${i === 2 ? 'bg-primary/20 text-primary' : 'text-muted-foreground/40'}`}>
                                            {tf}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Simulated Candlestick / Line Wave SVG */}
                            <svg className="w-full h-40 overflow-visible text-primary/30" viewBox="0 0 800 160" fill="none" preserveAspectRatio="none">
                                <path
                                    d="M0 130 Q 100 110, 200 70 T 400 90 T 600 30 T 800 50"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="none"
                                />
                                <path
                                    d="M0 130 Q 100 110, 200 70 T 400 90 T 600 30 T 800 50 L 800 160 L 0 160 Z"
                                    fill="url(#emerald-gradient)"
                                    opacity="0.25"
                                />
                                <defs>
                                    <linearGradient id="emerald-gradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            <div className="flex items-center justify-between text-xs text-muted-foreground/40 pt-2 border-t border-border/30">
                                <span>Volumen institucional diario: •••••••</span>
                                <span>RSI(14): •••• | MACD: Bullish | EMA 200: Soporte</span>
                            </div>
                        </div>

                        {/* Mock Asset Rows / Table */}
                        <div className="rounded-2xl bg-card/40 border border-border/50 divide-y divide-border/30">
                            {[
                                { sym: 'NVDA', name: 'Nvidia Corporation', price: 'US$ 124.50', fair: 'US$ 145.00', rec: 'STRONG BUY' },
                                { sym: 'MELI', name: 'MercadoLibre Inc.', price: 'US$ 1,980.00', fair: 'US$ 2,250.00', rec: 'COMPRA' },
                                { sym: 'AAPL', name: 'Apple Inc.', price: 'US$ 228.10', fair: 'US$ 240.00', rec: 'MANTENER' },
                            ].map((item) => (
                                <div key={item.sym} className="p-3.5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs">
                                            {item.sym[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-foreground/80">{item.sym}</p>
                                            <p className="text-xs text-muted-foreground/60">{item.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right filter blur-[2px]">
                                            <p className="font-bold text-sm text-foreground/70">{item.price}</p>
                                            <p className="text-[11px] text-muted-foreground/60">Precio Mercado</p>
                                        </div>
                                        <div className="text-right filter blur-[2px] hidden sm:block">
                                            <p className="font-bold text-sm text-emerald-400/70">{item.fair}</p>
                                            <p className="text-[11px] text-muted-foreground/60">Fair Value DCF</p>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-md text-xs font-black bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20 filter blur-[1px]">
                                            {item.rec}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── AMBIENT GLOW EFFECT ── */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                <div
                    className="w-[600px] h-[450px] rounded-full opacity-25 dark:opacity-30"
                    style={{
                        background: 'radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 70%)',
                        filter: 'blur(100px)',
                    }}
                />
            </div>

            {/* ── MODAL PAYWALL FLOTANTE EN PRIMER PLANO ── */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="relative z-20 w-full max-w-xl mx-auto rounded-[2.5rem] bg-card/95 dark:bg-zinc-950/90 backdrop-blur-2xl border border-primary/35 shadow-[0_0_60px_-15px_rgba(16,185,129,0.25)] p-6 sm:p-8 text-center my-auto"
            >
                {/* Header Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-primary/15 text-primary border border-primary/30 mb-5 shadow-sm">
                    <Crown className="w-3.5 h-3.5 text-primary" />
                    <span>{displayBadge}</span>
                </div>

                {/* Lock Icon with Pulsating Ring */}
                <div className="relative mb-4 flex justify-center">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-primary/20 via-emerald-500/10 to-transparent border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
                        <Lock className="w-8 h-8 sm:w-9 sm:h-9 text-primary" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground tracking-tight mb-2.5">
                    {displayTitle}
                </h2>

                {/* Description */}
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-5 max-w-md mx-auto">
                    {displayDesc}
                </p>

                {/* Section-Specific Key Benefits List */}
                <div className="bg-secondary/40 border border-border/60 rounded-2xl p-4 sm:p-5 mb-5 text-left space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between pb-1 border-b border-border/50">
                        <span>Herramientas activas en esta sección:</span>
                        <span className="text-emerald-500 font-extrabold">FINIX PRO</span>
                    </div>

                    {displayFeatures.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-foreground/90 leading-snug">
                            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                            </div>
                            <div>
                                <strong className="text-foreground font-bold">{item.title}: </strong>
                                <span className="text-muted-foreground">{item.desc}</span>
                            </div>
                        </div>
                    ))}

                    <div className="flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-2 border-t border-border/40">
                        <Zap className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Cobro recurrente mensual automático</strong> a precio fijo protegido. Cancelás cuando quieras en 1 clic.</span>
                    </div>
                </div>

                {/* Toggle All 5 PRO Sections Preview */}
                <div className="mb-5">
                    <button
                        type="button"
                        onClick={() => setShowAllSections(!showAllSections)}
                        className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <span>{showAllSections ? 'Ocultar resumen general' : '¿Qué incluye Finix PRO en toda la plataforma?'}</span>
                        {showAllSections ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <AnimatePresence>
                        {showAllSections && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left"
                            >
                                {ALL_SECTIONS_OVERVIEW.map((s) => {
                                    const SecIcon = s.icon;
                                    return (
                                        <div key={s.name} className="p-2.5 rounded-xl bg-secondary/30 border border-border/50 space-y-0.5">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                                <SecIcon className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>{s.name}</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-tight">
                                                {s.desc}
                                            </p>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* CTA Action Button */}
                <div className="flex flex-col items-center gap-3">
                    <Button
                        onClick={handleUpgrade}
                        className="w-full py-6 px-8 text-base sm:text-lg font-extrabold rounded-2xl bg-gradient-to-r from-emerald-600 via-primary to-emerald-500 hover:from-emerald-500 hover:to-primary text-white border-0 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <span>{buttonText}</span>
                        <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>

                    <p className="text-[11px] text-muted-foreground/80 leading-tight">
                        🔒 Facturación mensual automática sin permanencia mínima. Podés dar de baja tu plan en cualquier momento desde tu Configuración.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default ProGate;
