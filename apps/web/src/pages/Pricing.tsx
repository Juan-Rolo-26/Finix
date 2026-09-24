import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Check, 
    Sparkles, 
    Zap, 
    Shield, 
    ChevronLeft, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight,
    TrendingUp,
    Briefcase,
    BarChart3,
    Newspaper,
    Calendar,
    Crown,
    Star,
    Users,
    Activity,
    Bell
} from 'lucide-react';
import { useAuthStore, isJuanUser, isProUser as checkIsPro } from '@/stores/authStore';
import { apiFetch } from '@/lib/api';
import { SubscriptionRenewalChoice } from '@/components/SubscriptionRenewalChoice';

/* ─── Simple sparkline SVG ──────────────────────────────────────── */
function Sparkline({ data, color, height = 48 }: { data: number[]; color: string; height?: number }) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 120;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');
    const area = `M0,${height} L${pts.split(' ').map(p => p).join(' L')} L${w},${height} Z`;
    return (
        <svg viewBox={`0 0 ${w} ${height}`} className="w-full overflow-visible" style={{ height }}>
            <path d={area} fill={color} fillOpacity={0.12} />
            <path d={`M${pts.split(' ').map(p => p).join(' L')}`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* ─── Metrics comparison data ───────────────────────────────────── */
const STATS = [
    {
        label: 'Retorno anual promedio',
        value: 34.7,
        suffix: '%',
        prefix: '+',
        sub: 'vs. +11.2% del S&P 500',
        color: '#10b981',
        data: [11.2, 14.5, 18.1, 21.0, 24.3, 27.8, 30.1, 31.9, 33.2, 34.0, 34.4, 34.7],
        icon: TrendingUp,
        isDecimal: true,
    },
    {
        label: 'Usuarios activos PRO',
        value: 1840,
        suffix: '',
        prefix: '',
        sub: 'creciendo +23% MoM',
        color: '#6366f1',
        data: [400, 520, 610, 700, 810, 950, 1100, 1280, 1420, 1600, 1720, 1840],
        icon: Users,
        isDecimal: false,
    },
    {
        label: 'Sharpe Ratio promedio PRO',
        value: 1.82,
        suffix: '',
        prefix: '',
        sub: 'vs. 0.91 sin herramientas',
        color: '#f59e0b',
        data: [90, 100, 110, 115, 125, 130, 145, 155, 165, 172, 178, 182],
        icon: Activity,
        isDecimal: true,
    },
    {
        label: 'Portafolios activos',
        value: 5200,
        suffix: '+',
        prefix: '',
        sub: 'con análisis en tiempo real',
        color: '#ec4899',
        data: [800, 1100, 1400, 1700, 2100, 2600, 3100, 3700, 4200, 4700, 5000, 5200],
        icon: Briefcase,
        isDecimal: false,
    },
];

/* ─── Monthly return comparison data ────────────────────────────── */
const MONTHLY_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const PRO_RETURNS    = [4.2, 3.8, 6.1, 2.9, 5.5, 4.7, 7.2, 3.5, 5.8, 6.4, 4.9, 5.3];
const FREE_RETURNS   = [1.5, 1.1, 2.8, 0.9, 2.1, 1.7, 3.0, 1.2, 2.3, 2.5, 1.8, 2.0];

function ReturnBarChart() {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setVisible(true); },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const maxVal = Math.max(...PRO_RETURNS, ...FREE_RETURNS);

    return (
        <div ref={ref} className="w-full">
            <div className="flex items-center gap-4 mb-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Usuarios PRO
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                    <span className="w-3 h-3 rounded-sm bg-zinc-600 inline-block" /> Usuarios Free
                </span>
            </div>
            <div className="flex items-end gap-1.5" style={{ height: '120px' }}>
                {MONTHLY_LABELS.map((label, i) => (
                    <div key={label} className="flex-1 flex flex-col items-center gap-1 h-full">
                        <div className="w-full flex items-end gap-0.5 justify-center flex-1">
                            <motion.div
                                initial={{ scaleY: 0 }}
                                animate={visible ? { scaleY: 1 } : { scaleY: 0 }}
                                transition={{ duration: 0.5, delay: i * 0.04, ease: 'easeOut' }}
                                style={{
                                    height: `${(PRO_RETURNS[i] / maxVal) * 100}%`,
                                    transformOrigin: 'bottom',
                                }}
                                className="w-1/2 rounded-t-sm bg-gradient-to-t from-emerald-500 to-emerald-400 min-h-[4px]"
                            />
                            <motion.div
                                initial={{ scaleY: 0 }}
                                animate={visible ? { scaleY: 1 } : { scaleY: 0 }}
                                transition={{ duration: 0.5, delay: i * 0.04 + 0.05, ease: 'easeOut' }}
                                style={{
                                    height: `${(FREE_RETURNS[i] / maxVal) * 100}%`,
                                    transformOrigin: 'bottom',
                                }}
                                className="w-1/2 rounded-t-sm bg-zinc-600 min-h-[4px]"
                            />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Cumulative growth chart (SVG curved) ────────────────────────── */
const PRO_CUMULATIVE  = [100, 104.2, 108.2, 114.8, 118.1, 124.6, 130.5, 139.9, 144.8, 153.2, 163.0, 171.0, 180.1];
const FREE_CUMULATIVE = [100, 101.5, 102.6, 105.5, 106.4, 108.6, 110.4, 113.7, 115.1, 117.7, 120.6, 122.8, 125.3];

function CumulativeCurve() {
    const w = 480;
    const h = 140;
    const pad = 12;
    const minVal = 95;
    const maxVal = 190;
    const range = maxVal - minVal;

    const toY = (v: number) => h - pad - ((v - minVal) / range) * (h - pad * 2);
    const toX = (i: number) => pad + (i / (PRO_CUMULATIVE.length - 1)) * (w - pad * 2);

    const proPts  = PRO_CUMULATIVE.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
    const freePts = FREE_CUMULATIVE.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

    const proArea = `M${toX(0)},${h - pad} L${proPts.split(' ').join(' L')} L${toX(PRO_CUMULATIVE.length - 1)},${h - pad} Z`;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                        <span className="w-4 h-0.5 bg-emerald-400 inline-block rounded" /> +80.1% PRO
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-zinc-500">
                        <span className="w-4 h-0.5 bg-zinc-500 inline-block rounded" /> +25.3% Free
                    </span>
                </div>
                <span className="text-muted-foreground font-mono text-[11px]">$10.000 USD base</span>
            </div>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible" style={{ height: '140px' }}>
                <defs>
                    <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                <line x1={pad} y1={toY(100)} x2={w - pad} y2={toY(100)} stroke="currentColor" strokeOpacity={0.1} strokeDasharray="3 3" />
                <path d={proArea} fill="url(#proGrad)" />
                <polyline points={freePts} fill="none" stroke="#71717a" strokeWidth={1.5} strokeDasharray="4 3" />
                <polyline points={proPts} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={toX(PRO_CUMULATIVE.length - 1)} cy={toY(PRO_CUMULATIVE[PRO_CUMULATIVE.length - 1])} r={4} fill="#10b981" />
                <circle cx={toX(FREE_CUMULATIVE.length - 1)} cy={toY(FREE_CUMULATIVE[FREE_CUMULATIVE.length - 1])} r={3} fill="#71717a" />
            </svg>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
                <span>Mes 1</span>
                <span>Mes 6</span>
                <span>Mes 12</span>
            </div>
        </div>
    );
}

/* ─── Animated number counter ────────────────────────────────────── */
function AnimatedCounter({ value, isDecimal }: { value: number; isDecimal: boolean }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    let start = 0;
                    const duration = 1200;
                    const step = 16;
                    const steps = duration / step;
                    const inc = value / steps;
                    const timer = setInterval(() => {
                        start += inc;
                        if (start >= value) {
                            setDisplay(value);
                            clearInterval(timer);
                        } else {
                            setDisplay(start);
                        }
                    }, step);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [value]);

    return (
        <span ref={ref}>
            {isDecimal ? display.toFixed(2) : Math.round(display).toLocaleString('es-AR')}
        </span>
    );
}

function StatCard({ stat, delay }: { stat: typeof STATS[0]; delay: number }) {
    const Icon = stat.icon;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay }}
            className="rounded-3xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 4px 24px -4px rgba(0,0,0,0.1)',
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-tight">
                    {stat.label}
                </span>
                <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${stat.color}18`, color: stat.color }}
                >
                    <Icon className="w-4 h-4" />
                </div>
            </div>

            <div className="mb-4 flex flex-col items-center text-center">
                <div className="text-3xl sm:text-4xl font-black tracking-tight flex items-baseline justify-center gap-0.5 text-center" style={{ color: stat.color }}>
                    {stat.prefix}
                    <AnimatedCounter value={stat.value} isDecimal={stat.isDecimal} />
                    {stat.suffix}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-medium text-center">{stat.sub}</div>
            </div>

            <div className="mt-auto pt-2 border-t" style={{ borderColor: 'hsl(var(--border)/0.5)' }}>
                <Sparkline data={stat.data} color={stat.color} height={36} />
            </div>
        </motion.div>
    );
}

const PRO_SECTIONS = [
    {
        id: 'markets',
        title: 'Mercados en Vivo & Pre-Market',
        icon: TrendingUp,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        badge: 'Tiempo Real',
        description: 'Todo el pulso del mercado internacional y local sin delay ni cotizaciones congeladas.',
        features: [
            'Pre-Market en vivo con cotizaciones fijadas post-apertura a las 10:30 hs para referencia exacta',
            'Heatmap institucional del S&P 500 con filtros por capitalización bursátil y 11 sectores GICS',
            'Cotizaciones en tiempo real sin demoras de Wall Street (NYSE/Nasdaq) y CEDEARs en pesos y CCL',
            'Lentes Técnicas Semanales Multimétricas confluentes (MACD impulso, RSI 45/55, ADX de tendencia)',
            'Screener avanzado de Top Gainers, Losers y activos con mayor volumen institucional de la rueda',
        ]
    },
    {
        id: 'portfolio',
        title: 'Gestión Patrimonial & Multi-Portafolio',
        icon: Briefcase,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/20',
        badge: 'Métricas Cuantitativas',
        description: 'Administrá carteras ilimitadas con herramientas que utilizan los hedge funds institucionales.',
        features: [
            'Portafolios múltiples ilimitados para separar estrategias (Dividendos, Crecimiento, CEDEARs, Renta Fija)',
            'Cálculo de retornos ponderados institucionales: TWR (Time-Weighted) y XIRR (Money-Weighted Return)',
            'Métricas de riesgo profesional: Alpha acumulado, Beta, Sharpe Ratio, Volatilidad anualizada y Max Drawdown',
            'Benchmark gráfico en tiempo real frente al S&P 500 ($SPY) para medir tu verdadero sobre-rendimiento',
            'Seguimiento proactivo de cobro de dividendos futuros, fechas de corte (ex-dividend) y fechas de pago',
        ]
    },
    {
        id: 'analysis',
        title: 'Análisis Fundamental Cuantitativo & DCF',
        icon: BarChart3,
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10 border-cyan-500/20',
        badge: 'Valuación DCF & WACC',
        description: 'Descubrí el valor intrínseco real de una acción con modelos matemáticos y balances auditados.',
        features: [
            'Modelos de Flujo de Fondos Descontado (DCF) con cálculo automático de Fair Value y margen de seguridad',
            'Mapa interactivo de Creación de Valor (ROIC vs WACC) con calculadora de costo de capital ponderado',
            'Histórico auditado de balances de 10 años: Estado de Resultados, Balance General y Free Cash Flow',
            'Radar de múltiplos de valuación frente a competidores directos (P/E, EV/EBITDA, P/FCF, PEG)',
            'Scores matemáticos de salud financiera: Piotroski F-Score (0-9) y modelo Altman Z de solvencia',
        ]
    },
    {
        id: 'news',
        title: 'Noticias Financieras en Vivo con IA',
        icon: Newspaper,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10 border-purple-500/20',
        badge: 'Feed Inteligente',
        description: 'Informate al instante con noticias curadas, análisis algorítmico de sentimiento e impacto en precios.',
        features: [
            'Feed sin restricciones con cobertura minuto a minuto de Wall Street y mercado argentino',
            'Análisis algorítmico de sentimiento financiero (Bullish, Neutral, Bearish) por activo y titular',
            'Detección inmediata de tickers impactados ($NVDA, $AAPL, $TSLA, etc.) para operar con ventaja',
            'Filtros inteligentes por acciones de tu portafolio, CEDEARs preferidos o sectores clave',
            'Alertas directas para balances corporativos (Earnings) y minutas de la Reserva Federal (FOMC)',
        ]
    },
    {
        id: 'calendar',
        title: 'Calendario Económico & Dividendos S&P 500',
        icon: Calendar,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/20',
        badge: 'TradingView Oficial',
        description: 'Anticipate a la volatilidad conociendo las fechas exactas de eventos macro, earnings y dividendos.',
        features: [
            'Calendario macroeconómico oficial de TradingView con decisiones de tasas de la Fed (FOMC), IPC y NFP',
            'Temporada de balances corporativos con estimaciones de consenso de analistas, BPA (EPS) e Ingresos',
            'Detección en tiempo real de sorpresas de earnings (% Surprise) y reacción intradiaria del precio',
            'Calendario completo de dividendos S&P 500 y CEDEARs con yield proyectado, fechas ex-dividend y de pago',
            'Temporizadores y cuentas regresivas para eventos de alto impacto para proteger tus posiciones',
        ]
    },
    {
        id: 'alerts',
        title: 'Alertas de Mercado & Notificaciones 24/7',
        icon: Bell,
        color: 'text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/20',
        badge: 'Multicanal en Vivo',
        description: 'Monitoreo automatizado en servidor con envíos instantáneos a tu Email y Telegram.',
        features: [
            'Monitoreo continuo 24/7 de activos en servidor sin necesidad de mantener la web o app abierta',
            'Disparadores configurables por precio objetivo, variación porcentual intradiaria y volumen inusual',
            'Envíos en tiempo real con diseño HTML institucional en tu Email y bot privado de Telegram',
            'Historial completo de alertas disparadas con métricas de entrega, fecha y cotización del momento',
            'Detección de cruces de medias móviles (Golden/Death Cross) y niveles extremos de sobreventa RSI',
        ]
    },
    {
        id: 'creator',
        title: 'Finix Creator: Comunidades Monetizadas',
        icon: Crown,
        color: 'text-amber-300',
        bg: 'bg-amber-500/15 border-amber-500/30',
        badge: 'Plan Creador',
        description: 'Liderá tu propia comunidad de inversores y cobrá suscripciones mensuales en ARS.',
        features: [
            'Fundá comunidades públicas y salas privadas VIP accesibles solo por suscripción paga',
            'Opción de renovación automática mensual por Mercado Pago',
            'Insignia dorada oficial de Creador Verificado para mayor reputación y confianza',
            'Publicación de tesis fundamentadas citando datos de balances y gráficos de Finix en vivo',
            'Compartí la evolución de tu portafolio auditado en tiempo real sin capturas truchas',
        ]
    }
];

export default function Pricing() {
    const navigate = useNavigate();
    const user = useAuthStore(s => s.user);
    const isJuan = isJuanUser(user);
    const syncFromSession = useAuthStore(s => s.syncFromSession);
    const [searchParams] = useSearchParams();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [renewalPlan, setRenewalPlan] = useState<'PRO' | 'Creador' | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<string | null>(searchParams.get('status'));

    useEffect(() => {
        const status = searchParams.get('status');
        if (status === 'approved') { setPaymentStatus('approved'); syncFromSession().catch(() => {}); }
        else if (status === 'failure') setPaymentStatus('failure');
        else if (status === 'pending') setPaymentStatus('pending');
    }, [searchParams, syncFromSession]);

    const handleUpgrade = async (planType: 'PRO' | 'Creador') => {
        if (isJuan) {
            navigate(planType === 'Creador' ? '/comunidades' : '/mercado');
            return;
        }
        if (!user) { navigate(`/?redirect=${encodeURIComponent('/pro')}&plan=${planType}`); return; }
        if (planType === 'PRO') {
            setRenewalPlan('PRO');
            return;
        }
        setRenewalPlan('Creador');
    };

    const confirmCheckout = async (autoRenew: boolean) => {
        if (!renewalPlan) return;
        const planType = renewalPlan;
        setLoadingPlan(planType);
        const endpoint = planType === 'PRO' ? '/mercadopago/checkout/pro' : '/mercadopago/checkout/creator';
        try {
            const res = await apiFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autoRenew }),
            });
            if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Error al conectar con Mercado Pago'); }
            const data = await res.json();
            // Never send production users to Mercado Pago's test checkout.
            const checkoutUrl = data.init_point || (import.meta.env.DEV ? data.sandbox_init_point : undefined) || data.url;
            if (checkoutUrl) { window.location.href = checkoutUrl; } else { throw new Error('No se recibió la URL de checkout de Mercado Pago'); }
        } catch (error: any) {
            alert(error.message || 'Ocurrió un error inesperado al conectar con Mercado Pago.');
            setLoadingPlan(null);
            setRenewalPlan(null);
        }
    };

    const [prices, setPrices] = useState({ proArs: 6300, creatorArs: 29900 });
    useEffect(() => {
        apiFetch('/mercadopago/config').then(r => r.json()).then((mercadoPago) => {
            setPrices({
                proArs: Number(mercadoPago?.proPriceArs) || 6300,
                creatorArs: Number(mercadoPago?.creatorPriceArs) || 29900,
            });
        }).catch(() => {});
    }, []);

    const isProUser = isJuan || checkIsPro(user);
    const isCreator = isJuan || (user as any)?.role === 'ADMIN' || (user as any)?.plan === 'CREATOR' || (user as any)?.accountType === 'CREATOR' || (user as any)?.isCreator;

    const plans = [
        {
            name: 'Free', price: '$0',
            description: 'Funciones básicas para explorar Finix.',
            features: ['Perfil público y feed social', 'Seguir perfiles y comunidades', 'Unite a comunidades gratuitas', 'Ver portafolios públicos'],
            buttonText: !user ? 'Crear cuenta gratis' : (isProUser ? 'Plan Básico (Incluido)' : 'Tu plan actual'),
            highlight: false,
        },
        {
            name: 'PRO', price: isJuan ? '$0' : `$${prices.proArs.toLocaleString('es-AR')}`, period: isJuan ? ' (Vitalicio)' : ' ARS/mes',
            description: 'Datos y herramientas para analizar mercados con más contexto.',
            features: [
                'Todo lo del plan Free',
                'Datos de mercado y Pre-Market',
                'Mapas de calor y filtros sectoriales',
                'Portafolios y métricas de seguimiento',
                'Análisis fundamental y estados financieros',
                'Noticias, calendario y alertas'
            ],
            buttonText: isJuan ? 'Plan Activo Vitalicio (Juan26-08)' : (isProUser ? 'Tu plan actual (Activo)' : 'Mejorar a PRO'),
            highlight: true,
            icon: Sparkles,
        },
        {
            name: 'Creador', price: isJuan ? '$0' : `$${prices.creatorArs.toLocaleString('es-AR')}`, period: isJuan ? ' (Vitalicio)' : ' ARS/mes',
            description: 'Herramientas para crear y gestionar tu comunidad.',
            features: [
                'Todo lo del plan PRO',
                'Comunidades públicas y privadas',
                'Suscripciones vía Mercado Pago',
                'Moderación y canales exclusivos',
                'Estadísticas de comunidad y audiencia'
            ],
            buttonText: isJuan ? 'Acceso Creador Vitalicio Habilitado' : (isCreator ? 'Tu plan actual (Activo)' : 'Empezar como Creador'),
            highlight: false,
            icon: Zap,
        },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full opacity-25" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 70%)', filter: 'blur(90px)' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, hsl(160 80% 50% / 0.4) 0%, transparent 70%)', filter: 'blur(80px)' }} />
                <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6366f180 0%, transparent 70%)', filter: 'blur(60px)' }} />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col">
                {/* Back */}
                <nav className="mb-10">
                    <Link to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors gap-1">
                        <ChevronLeft className="w-4 h-4" /> Volver
                    </Link>
                </nav>

                {/* Hero */}
                <div className="text-center max-w-4xl mx-auto mb-16">
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-primary/10 border border-primary/25 text-primary mb-5">
                        <BarChart3 className="w-3.5 h-3.5" /> Datos y herramientas financieras
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-heading font-extrabold tracking-tight mb-6 leading-[1.05]">
                        Analizá el mercado{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-primary to-cyan-400">con más contexto</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Accedé a datos de mercado, seguimiento de portafolios y herramientas de análisis en un solo lugar. Finix no brinda asesoramiento ni recomendaciones de inversión.
                    </motion.p>
                </div>

                {/* Juan banner */}
                {isJuan && (
                    <div className="max-w-4xl mx-auto mb-10 p-5 sm:p-6 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-5 text-amber-300 animate-in fade-in shadow-2xl backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-lg">
                                <Crown className="w-8 h-8 text-amber-400 fill-amber-400" />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-base text-foreground flex items-center gap-2.5">
                                    Cuenta Administrador Oficial (Juan26-08)
                                    <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-black shadow-sm">PRO Vitalicio Permanente</span>
                                </h4>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                                    Tu cuenta cuenta con membresía PRO y Creador 100% bonificada de por vida ($0 sin pagos mensuales). Acceso total e ilimitado a todas las herramientas actuales y futuras de Finix.
                                </p>
                            </div>
                        </div>
                        <Link to="/mercado" className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm transition-all shrink-0 text-center shadow-lg hover:scale-105 active:scale-95">
                            Ir a la Plataforma
                        </Link>
                    </div>
                )}

                {paymentStatus === 'approved' && (
                    <div className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 animate-in fade-in">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <div><h4 className="font-bold text-sm">¡Pago procesado con éxito!</h4><p className="text-xs text-emerald-400/80 mt-0.5">Tu membresía ha sido activada. Ya tenés acceso a todas las funciones premium de Finix.</p></div>
                    </div>
                )}
                {paymentStatus === 'failure' && (
                    <div className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 animate-in fade-in">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <div><h4 className="font-bold text-sm">El pago no pudo completarse</h4><p className="text-xs text-red-400/80 mt-0.5">La operación fue rechazada o cancelada. Podés intentar nuevamente.</p></div>
                    </div>
                )}
                {paymentStatus === 'pending' && (
                    <div className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3 text-yellow-400 animate-in fade-in">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <div><h4 className="font-bold text-sm">Pago pendiente de acreditación</h4><p className="text-xs text-yellow-400/80 mt-0.5">El proveedor está procesando tu pago. Tu suscripción se activará automáticamente al acreditarse.</p></div>
                    </div>
                )}

                {/* Pricing cards */}
                <div className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto w-full items-stretch">
                    {plans.map((plan, idx) => {
                        const Icon = (plan as any).icon;
                        return (
                            <motion.div key={plan.name} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.12, duration: 0.5 }}
                                className={`relative rounded-[1.5rem] p-5 sm:p-6 flex flex-col h-full transition-transform duration-300 hover:-translate-y-1 ${plan.highlight ? 'pt-10 scale-[1.015] z-10' : ''}`}
                                style={plan.highlight
                                    ? { background: 'linear-gradient(180deg, hsl(var(--primary)/0.12), hsl(var(--card)) 30%)', border: '2px solid hsl(var(--primary))', boxShadow: '0 18px 60px hsl(var(--primary)/0.22)' }
                                    : { background: 'linear-gradient(180deg, hsl(var(--card)/0.8), hsl(var(--card)/0.45))', border: '1px solid hsl(var(--border)/0.55)', backdropFilter: 'blur(10px)', boxShadow: '0 14px 40px hsl(var(--background)/0.12)' }
                                }
                            >
                                {plan.highlight && <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, hsl(var(--primary)), transparent 70%)' }} />}
                                {plan.highlight && (
                                    <div className="absolute top-4 inset-x-0 flex justify-center">
                                        <span className="bg-primary text-primary-foreground text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-lg" style={{ boxShadow: '0 4px 20px hsl(var(--primary)/0.4)' }}>
                                            <Shield className="w-3.5 h-3.5" /> Más popular
                                        </span>
                                    </div>
                                )}
                                <div className="mb-4 flex flex-col items-center text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        {Icon && <Icon className="w-5 h-5 text-primary" />}
                                        <h3 className="text-lg font-bold text-center">{plan.name}</h3>
                                    </div>
                                    <p className="text-xs leading-relaxed text-muted-foreground min-h-[38px] max-w-[18rem] text-center">{plan.description}</p>
                                </div>
                                <div className="mb-5 flex flex-col items-center text-center">
                                    <div className="flex items-end justify-center gap-1">
                                        <span className="text-3xl font-extrabold">{plan.price}</span>
                                        {(plan as any).period && <span className="text-muted-foreground font-medium mb-1">{(plan as any).period}</span>}
                                    </div>
                                    {plan.name !== 'Free' && (
                                        <p className="text-[10px] font-semibold text-emerald-400 mt-1 flex items-center justify-center gap-1 text-center">
                                            <Sparkles className="w-3 h-3 shrink-0" /> Precio mensual informado antes del checkout
                                        </p>
                                    )}
                                </div>
                                <button
                                    disabled={(Boolean(user && plan.name === 'Free') && !isJuan) || loadingPlan === plan.name}
                                    onClick={() => {
                                        if (isJuan) {
                                            navigate(plan.name === 'Creador' ? '/comunidades' : '/mercado');
                                            return;
                                        }
                                        if (plan.name === 'Free') {
                                            if (!user) navigate('/auth?mode=register');
                                        } else if (plan.name === 'PRO') {
                                            if (isProUser) {
                                                navigate('/mercado');
                                            } else {
                                                handleUpgrade('PRO');
                                            }
                                        } else if (plan.name === 'Creador') {
                                            if (isCreator) {
                                                navigate('/comunidades');
                                            } else {
                                                handleUpgrade('Creador');
                                            }
                                        }
                                    }}
                                    style={plan.name === 'PRO' ? { background: 'linear-gradient(135deg, #059669 0%, #10b981 60%, #0d9488 100%)', color: '#fff' } : plan.name === 'Creador' ? { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' } : {}}
                                    className={`w-full h-11 px-4 rounded-xl font-bold text-sm mb-5 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${plan.name === 'PRO' ? 'shadow-lg hover:scale-[1.01] active:scale-[0.99] border border-emerald-400/30' : plan.name === 'Creador' ? 'border border-emerald-500/40 hover:border-emerald-400 hover:scale-[1.01] active:scale-[0.99]' : 'border border-border/80 bg-card hover:bg-muted text-foreground shadow-sm hover:border-primary/40 hover:shadow-md active:scale-[0.99]'}`}
                                >
                                    {loadingPlan === plan.name ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /><span>Conectando...</span></>
                                    ) : (!user && plan.name !== 'Free') ? (
                                        <><span>Iniciar sesión para comprar</span><ArrowRight className="w-4 h-4" /></>
                                    ) : (
                                        <><span>{plan.buttonText}</span><ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                                <div className="mt-1 flex-1 border-t border-border/40 pt-4">
                                    <p className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Incluye</p>
                                    <div className="mx-auto max-w-[18rem] space-y-1">
                                    {plan.features.map(f => (
                                        <div key={f} className="flex items-start gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-primary/5">
                                            <div className="w-4 h-4 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-2.5 h-2.5 text-primary" /></div>
                                            <span className="text-xs font-medium leading-snug">{f}</span>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {false && <>
                {/* ══════════ PRO PERFORMANCE STATS ══════════ */}
                <div className="mt-28 max-w-6xl mx-auto w-full">
                    <div className="text-center mb-14">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                            <Activity className="w-3.5 h-3.5" /> Resultados reales de usuarios PRO
                        </div>
                        <h2 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight mb-3">Los números hablan</h2>
                        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                            Datos agregados y anónimos de la plataforma. Los usuarios con herramientas PRO consistentemente superan al mercado.
                        </p>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
                        {STATS.map((stat, i) => <StatCard key={stat.label} stat={stat} delay={i * 0.1} />)}
                    </div>

                    {/* Charts */}
                    <div className="grid md:grid-cols-2 gap-8 mb-14">
                        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6 }}
                            className="rounded-3xl p-6" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-bold text-base text-foreground">Retorno mensual promedio</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">PRO vs. usuarios Free — últimos 12 meses</p>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Estimado</span>
                            </div>
                            <div className="mt-4"><ReturnBarChart /></div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="rounded-xl p-3" style={{ background: 'hsl(var(--secondary)/0.5)' }}>
                                    <div className="text-xs text-muted-foreground">Total PRO anual</div>
                                    <div className="text-xl font-black text-emerald-400">+{PRO_RETURNS.reduce((a, b) => a + b, 0).toFixed(1)}%</div>
                                </div>
                                <div className="rounded-xl p-3" style={{ background: 'hsl(var(--secondary)/0.5)' }}>
                                    <div className="text-xs text-muted-foreground">Total Free anual</div>
                                    <div className="text-xl font-black text-zinc-500">+{FREE_RETURNS.reduce((a, b) => a + b, 0).toFixed(1)}%</div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6 }}
                            className="rounded-3xl p-6" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-bold text-base text-foreground">Crecimiento acumulado</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">Capital compuesto desde base 100 — 12 meses</p>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Estimado</span>
                            </div>
                            <div className="mt-4"><CumulativeCurve /></div>
                        </motion.div>
                    </div>

                    {/* Comparison table */}
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}
                        className="rounded-3xl overflow-hidden mb-14" style={{ border: '1px solid hsl(var(--border))' }}>
                        <div className="p-6 border-b flex flex-col items-center text-center" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                            <h3 className="font-bold text-lg text-center">Comparativa de métricas clave</h3>
                            <p className="text-xs text-muted-foreground mt-0.5 text-center">Free vs. PRO — basado en comportamiento promedio de la plataforma</p>
                        </div>
                        <div className="overflow-x-auto" style={{ background: 'hsl(var(--card)/0.5)' }}>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                                        <th className="text-left p-4 font-semibold text-muted-foreground">Métrica</th>
                                        <th className="text-center p-4 font-semibold text-muted-foreground">Free</th>
                                        <th className="text-center p-4 font-black text-emerald-400"><span className="flex items-center justify-center gap-1.5"><Crown className="w-3.5 h-3.5 fill-emerald-400" /> PRO</span></th>
                                        <th className="text-center p-4 font-semibold text-muted-foreground">Diferencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { metric: 'Retorno anual promedio', free: '+11.2%', pro: '+34.7%', diff: '+23.5 pp' },
                                        { metric: 'Sharpe Ratio promedio', free: '0.91', pro: '1.82', diff: '+100%' },
                                        { metric: 'Max Drawdown promedio', free: '-24.3%', pro: '-11.8%', diff: '−51% menor' },
                                        { metric: 'Portafolios gestionados', free: '1 (limitado)', pro: 'Ilimitados (TWR & XIRR)', diff: '∞ carteras' },
                                        { metric: 'Mercados en Vivo & Pre-Market', free: '~15 min delay', pro: 'Tiempo real + Pre-Market congelado', diff: '0 delay' },
                                        { metric: 'Valuación DCF & ROIC vs WACC', free: '✗', pro: '✓ Acceso Total con Fair Value', diff: 'Completo' },
                                        { metric: 'Noticias con Sentimiento IA', free: 'Lectura limitada', pro: '✓ Feed ilimitado con impacto por ticker', diff: 'Sin límites' },
                                        { metric: 'Calendario Dividendos & Earnings', free: 'Básico', pro: '✓ TradingView oficial con % sorpresa', diff: 'Institucional' },
                                        { metric: 'Alertas 24/7 Email & Telegram', free: '✗', pro: '✓ Notificaciones multicanal en vivo', diff: '24/7' },
                                    ].map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border)/0.4)' }}>
                                            <td className="p-4 font-medium text-foreground">{row.metric}</td>
                                            <td className="p-4 text-center text-muted-foreground">{row.free}</td>
                                            <td className="p-4 text-center font-bold text-emerald-400">{row.pro}</td>
                                            <td className="p-4 text-center"><span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{row.diff}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* Testimonials */}
                    <div className="grid sm:grid-cols-3 gap-4 mb-20">
                        {[
                            { name: 'Matías R.', handle: '@matias_trader', text: 'Desde que uso Finix PRO mi portafolio creció 41% en un año. El análisis DCF me ayudó a encontrar acciones subvaluadas antes que el mercado.', stars: 5, badge: 'Portafolio +41%' },
                            { name: 'Valentina C.', handle: '@vale_invierte', text: 'El heatmap del S&P 500 y las alertas por Gmail son oro puro. Ya no me pierdo ningún movimiento importante de mercado.', stars: 5, badge: 'Sharpe 2.1' },
                            { name: 'Leandro P.', handle: '@lp_growth', text: 'El calendario de earnings integrado con TradingView me salvó de entrar en balances con sorpresa negativa múltiples veces.', stars: 5, badge: 'Max DD −8%' },
                        ].map((t, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                                <div className="flex items-center gap-0.5 mb-1">
                                    {Array.from({ length: t.stars }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                                </div>
                                <p className="text-sm text-foreground/80 leading-relaxed flex-1">"{t.text}"</p>
                                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                                    <div><div className="font-bold text-xs">{t.name}</div><div className="text-[11px] text-muted-foreground">{t.handle}</div></div>
                                    <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{t.badge}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ══════════ SECTION BREAKDOWN ══════════ */}
                <div className="max-w-6xl mx-auto w-full">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary mb-3">
                            <Sparkles className="w-3.5 h-3.5" /> Desglose Detallado
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight">Todo lo que incluye Finix PRO y Creador</h2>
                        <p className="text-sm sm:text-base text-muted-foreground mt-2">Conocé en detalle cada herramienta y funcionalidad a la que accedés al mejorar tu membresía.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PRO_SECTIONS.map((sec, i) => {
                            const Icon = sec.icon;
                            return (
                                <motion.div key={sec.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: i * 0.07 }}
                                    className="rounded-3xl p-6 flex flex-col justify-between transition-all hover:shadow-2xl" style={{ background: 'hsl(var(--card)/0.7)', border: '1px solid hsl(var(--border)/0.7)', backdropFilter: 'blur(8px)' }}>
                                    <div>
                                        <div className="flex items-center justify-between gap-3 mb-4">
                                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${sec.bg}`}><Icon className={`w-5 h-5 ${sec.color}`} /></div>
                                            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-muted border border-border/60 text-muted-foreground">{sec.badge}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground mb-1 text-center">{sec.title}</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed mb-4 text-center">{sec.description}</p>
                                        <div className="space-y-2.5 pt-2 border-t border-border/40">
                                            {sec.features.map((feat, fi) => (
                                                <div key={fi} className="flex items-start gap-2.5 text-xs text-foreground/90">
                                                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-2.5 h-2.5 text-primary stroke-[3]" /></div>
                                                    <span>{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {sec.id === 'creator' && (
                                        <div className="mt-6 pt-4 border-t border-border/40">
                                            <Link to="/creator" className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                                                <Crown className="w-3.5 h-3.5 fill-amber-400" /><span>Ver todo sobre Finix Creator</span><ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
                </>}

                {/* Billing banner */}
                <div className="max-w-4xl mx-auto mt-16 mb-2 w-full p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl"
                    style={{ border: '1px solid hsl(var(--border)/0.5)', background: 'hsl(var(--card)/0.5)', backdropFilter: 'blur(8px)' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary"><Shield className="w-6 h-6" /></div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-sm text-foreground">Facturación segura y transparente</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                                El plan PRO cuesta ${prices.proArs.toLocaleString('es-AR')} ARS por mes y se procesa con Mercado Pago. Podés pagar un mes o activar la renovación automática. Podés cancelar desde <strong>Configuración &gt; Suscripción</strong>.
                            </p>
                        </div>
                    </div>
                    {user && (
                        <Link to="/settings" className="shrink-0 w-full md:w-auto">
                            <button className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold transition-colors">Gestionar en Configuración</button>
                        </Link>
                    )}
                </div>
            </div>
            <SubscriptionRenewalChoice
                open={renewalPlan !== null}
                planName={renewalPlan === 'Creador' ? 'Creador' : 'Finix PRO'}
                monthlyPrice={(renewalPlan === 'PRO' ? prices.proArs : prices.creatorArs).toLocaleString('es-AR')}
                busy={loadingPlan !== null}
                onClose={() => setRenewalPlan(null)}
                onConfirm={(autoRenew) => { void confirmCheckout(autoRenew); }}
            />
        </div>
    );
}
