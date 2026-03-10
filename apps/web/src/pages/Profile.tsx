import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '@/lib/api';
import { uploadProfileImage } from '@/lib/profileMedia';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from '@/components/posts/PostCard';
import type { Post } from '@/pages/Explore';
import {
    User, MapPin, Briefcase, Calendar, Award, TrendingUp,
    Linkedin, Twitter, Youtube, Instagram,
    Edit, Check, X, Camera, Globe, Shield,
    BarChart3, Target, PieChart, MessageSquare, UserPlus,
    Star, Search, Plus, Wallet, DollarSign,
    ArrowUpRight, ArrowDownRight, Layers, Activity, Loader2, Lock,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';


/* ─── Brand tokens ─────────────────────────────────────────── */
const PRIMARY = 'hsl(158 100% 45%)';
const PRIMARY_DIM = 'hsl(158 100% 45% / 0.12)';
const PRIMARY_BRD = 'hsl(158 100% 45% / 0.25)';

interface UserProfile {
    id: string;
    username: string;
    email: string;
    bio?: string;
    bioLong?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    isInfluencer: boolean;
    isVerified: boolean;
    accountType: string;
    title?: string;
    company?: string;
    location?: string;
    website?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    youtubeUrl?: string;
    instagramUrl?: string;
    yearsExperience?: number;
    specializations?: string;
    certifications?: string;
    totalReturn?: number;
    winRate?: number;
    riskScore?: number;
    isProfilePublic: boolean;
    showPortfolio: boolean;
    showStats: boolean;
    acceptingFollowers: boolean;
    isFollowedByMe?: boolean;
    _count?: { posts: number; following: number; followedBy: number };
    createdAt: string;
}

interface PinnedAsset {
    ticker: string;
    name: string;
    change: number;
    changePercent: number;
    price: number;
}

// ─── Portfolio types ─────────────────────────────────────────────────────────

interface PortfolioAsset {
    id: string;
    ticker: string;
    tipoActivo: string;
    montoInvertido: number;
    ppc: number;
    cantidad: number;
    precioActual?: number;
}

interface PortfolioMovement {
    id: string;
    fecha: string;
    tipoMovimiento: string;
    ticker: string;
    claseActivo: string;
    cantidad: number;
    precio: number;
    total: number;
}

interface PortfolioData {
    id: string;
    nombre: string;
    monedaBase: string;
    nivelRiesgo: string;
    esPrincipal: boolean;
    modoSocial: boolean;
    assets: PortfolioAsset[];
}

interface PortfolioMetricsData {
    capitalTotal: number;
    valorActual: number;
    gananciaTotal: number;
    variacionPorcentual: number;
    diversificacionPorClase: Record<string, number>;
    diversificacionPorActivo: Record<string, number>;
    cantidadActivos: number;
}

// ─── Mini Pie Chart ───────────────────────────────────────────────────────────

function MiniPieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
    const size = 160;
    const cx = size / 2;
    const cy = size / 2;
    const r = 62;
    const innerR = 38;
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return <div className="w-40 h-40 flex items-center justify-center text-xs text-muted-foreground">Sin datos</div>;

    let cum = 0;
    const slices = data.map((d) => {
        const start = (cum / total) * 2 * Math.PI - Math.PI / 2;
        cum += d.value;
        const end = (cum / total) * 2 * Math.PI - Math.PI / 2;
        const large = (d.value / total) > 0.5 ? 1 : 0;
        return {
            ...d,
            path: `M ${cx + r * Math.cos(start)} ${cy + r * Math.sin(start)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(end)} ${cy + r * Math.sin(end)} L ${cx + innerR * Math.cos(end)} ${cy + innerR * Math.sin(end)} A ${innerR} ${innerR} 0 ${large} 0 ${cx + innerR * Math.cos(start)} ${cy + innerR * Math.sin(start)} Z`,
        };
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {slices.map((s, i) => (
                <path key={i} d={s.path} fill={s.color} opacity={0.9} className="transition-all hover:opacity-100" />
            ))}
            <circle cx={cx} cy={cy} r={innerR - 2} fill="hsl(var(--card))" />
            <text x={cx} y={cy - 4} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="9" fontWeight="600">TOTAL</text>
            <text x={cx} y={cy + 11} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="13" fontWeight="800">{data.length}</text>
        </svg>
    );
}

// ─── Monthly Return Bars ──────────────────────────────────────────────────────

function MonthlyBars({ returnsMap }: { returnsMap?: Record<string, number> }) {
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    // If no real data, generate plausible demo values
    const values = months.map((_, i) => {
        if (returnsMap) {
            const key = Object.keys(returnsMap)[i];
            return returnsMap[key] ?? (Math.random() * 10 - 3);
        }
        const demo = [2.1, -0.8, 4.3, 1.2, 3.8, -1.4, 5.2, 2.9, -0.3, 6.1, 3.4, 4.7];
        return demo[i];
    });
    const maxAbs = Math.max(...values.map(Math.abs), 1);

    return (
        <div className="w-full">
            <div className="flex items-end gap-1 h-24 mb-1">
                {values.map((v, i) => {
                    const isPos = v >= 0;
                    const heightPct = Math.abs(v) / maxAbs * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end group relative" style={{ height: '96px' }}>
                            <div
                                className="w-full rounded-t transition-all duration-500"
                                style={{
                                    height: `${heightPct * 0.96}px`,
                                    background: isPos
                                        ? `linear-gradient(180deg, hsl(158 100% 45%) 0%, hsl(158 100% 30%) 100%)`
                                        : `linear-gradient(180deg, hsl(0 90% 58%) 0%, hsl(0 90% 40%) 100%)`,
                                    opacity: i === values.length - 1 ? 1 : 0.7,
                                }}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-popover border border-border rounded px-1.5 py-0.5 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                                style={{ color: isPos ? 'hsl(158 100% 45%)' : 'hsl(0 80% 60%)' }}>
                                {isPos ? '+' : ''}{v.toFixed(1)}%
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between">
                {months.map((m) => (
                    <span key={m} className="text-[9px] text-muted-foreground flex-1 text-center">{m}</span>
                ))}
            </div>
        </div>
    );
}

// ─── Risk Meter ───────────────────────────────────────────────────────────────

function RiskMeter({ level }: { level: string }) {
    const levels = ['bajo', 'medio', 'alto'];
    const idx = levels.indexOf(level.toLowerCase());
    const colors = ['hsl(158 100% 45%)', 'hsl(47 100% 50%)', 'hsl(0 90% 58%)'];
    const labels = ['Conservador', 'Moderado', 'Agresivo'];

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-1.5">
                {levels.map((_, i) => (
                    <div key={i} className="flex-1 h-2 rounded-full transition-all duration-500"
                        style={{ background: i <= idx ? colors[idx] : 'hsl(var(--border))', opacity: i <= idx ? 1 : 0.4 }} />
                ))}
            </div>
            <div className="flex justify-between">
                {labels.map((l, i) => (
                    <span key={l} className="text-[10px]" style={{ color: i === idx ? colors[idx] : 'hsl(var(--muted-foreground))' }}>{l}</span>
                ))}
            </div>
        </div>
    );
}

// ─── Main Portfolio Section Component ────────────────────────────────────────

interface ProfilePortfolioSectionProps {
    profileUserId: string;
    isOwnProfile: boolean;
    showPortfolio: boolean;
    totalReturn?: number;
    winRate?: number;
    riskScore?: number;
    showStats?: boolean;
}

function ProfilePortfolioSection({ profileUserId, isOwnProfile, showPortfolio, totalReturn, winRate, riskScore, showStats }: ProfilePortfolioSectionProps) {
    const [portfolios, setPortfolios] = useState<PortfolioData[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<PortfolioMetricsData | null>(null);
    const [movements, setMovements] = useState<PortfolioMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<'overview' | 'assets' | 'movements'>('overview');

    const selected = portfolios.find(p => p.id === selectedId) ?? null;

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setPortfolios([]);
        setSelectedId(null);
        setMetrics(null);
        setMovements([]);

        (async () => {
            try {
                const endpoint = isOwnProfile ? '/portfolios' : `/portfolios/public/${profileUserId}`;
                const res = await apiFetch(endpoint);
                if (!res.ok) {
                    if (!cancelled) {
                        setPortfolios([]);
                        setSelectedId(null);
                    }
                    return;
                }

                const data: PortfolioData[] = await res.json();
                const list = Array.isArray(data) ? data : [];

                if (cancelled) return;

                setPortfolios(list);
                setSelectedId((current) => {
                    if (current && list.some((portfolio) => portfolio.id === current)) {
                        return current;
                    }
                    return list[0]?.id ?? null;
                });
            } catch {
                if (!cancelled) {
                    setPortfolios([]);
                    setSelectedId(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isOwnProfile, profileUserId]);

    useEffect(() => {
        if (!selectedId) {
            setMetrics(null);
            setMovements([]);
            return;
        }

        let cancelled = false;

        (async () => {
            setMetrics(null);
            setMovements([]);
            try {
                const metricsEndpoint = isOwnProfile
                    ? `/portfolios/${selectedId}/metrics`
                    : `/portfolios/public/portfolio/${selectedId}/metrics`;
                const movementsEndpoint = isOwnProfile
                    ? `/portfolios/${selectedId}/movements`
                    : `/portfolios/public/portfolio/${selectedId}/movements`;

                const [mRes, mvRes] = await Promise.all([
                    apiFetch(metricsEndpoint),
                    apiFetch(movementsEndpoint),
                ]);

                if (mRes.ok) {
                    const metricsData = await mRes.json();
                    if (!cancelled) {
                        setMetrics(metricsData);
                    }
                } else if (!cancelled) {
                    setMetrics(null);
                }

                if (mvRes.ok) {
                    const movementData = await mvRes.json();
                    if (!cancelled) {
                        setMovements(Array.isArray(movementData) ? movementData.slice(0, 6) : []);
                    }
                } else if (!cancelled) {
                    setMovements([]);
                }
            } catch {
                if (!cancelled) {
                    setMetrics(null);
                    setMovements([]);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isOwnProfile, selectedId]);

    const fmt = (n: number, cur = 'USD') =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(n);

    const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

    const PIE_COLORS = ['hsl(158 100% 45%)', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];
    const riskLabels: Record<string, string> = {
        bajo: 'Conservador',
        medio: 'Moderado',
        alto: 'Agresivo',
    };
    const hasTotalReturn = typeof totalReturn === 'number' && Number.isFinite(totalReturn);
    const hasWinRate = typeof winRate === 'number' && Number.isFinite(winRate);
    const hasRiskScore = typeof riskScore === 'number' && Number.isFinite(riskScore);
    const statsCards = [
        {
            label: 'Retorno Total',
            value: hasTotalReturn ? fmtPct(totalReturn) : metrics ? fmtPct(metrics.variacionPorcentual) : '—',
            color: PRIMARY,
            icon: TrendingUp,
        },
        hasWinRate
            ? {
                label: 'Win Rate',
                value: `${winRate.toFixed(0)}%`,
                color: '#3b82f6',
                icon: Target,
            }
            : {
                label: 'Ganancia Actual',
                value: metrics ? fmt(metrics.gananciaTotal, selected?.monedaBase) : '—',
                color: metrics && metrics.gananciaTotal < 0 ? 'hsl(0 90% 58%)' : '#3b82f6',
                icon: metrics && metrics.gananciaTotal < 0 ? ArrowDownRight : DollarSign,
            },
        hasRiskScore
            ? {
                label: 'Risk Score',
                value: riskScore.toFixed(1),
                color: '#f59e0b',
                icon: Activity,
            }
            : {
                label: 'Riesgo',
                value: selected?.nivelRiesgo ? (riskLabels[selected.nivelRiesgo.toLowerCase()] ?? selected.nivelRiesgo) : '—',
                color: '#f59e0b',
                icon: Activity,
            },
    ];

    // ── Not public ──
    if (!isOwnProfile && !showPortfolio) {
        return (
            <div className="rounded-2xl py-12 text-center space-y-3" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px dashed hsl(var(--border))' }}>
                <Lock className="w-8 h-8 mx-auto text-muted-foreground opacity-40" />
                <p className="text-sm font-semibold text-foreground">Portfolio privado</p>
                <p className="text-xs text-muted-foreground">Este usuario mantiene su portfolio oculto</p>
            </div>
        );
    }

    // ── Loading ──
    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // ── No portfolios ──
    if (portfolios.length === 0) {
        return (
            <div className="rounded-2xl py-12 text-center space-y-3" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px dashed hsl(var(--border))' }}>
                <Wallet className="w-8 h-8 mx-auto text-muted-foreground opacity-40" />
                <p className="text-sm font-semibold text-foreground">
                    {isOwnProfile ? 'Aún no tenés portfolios' : 'Sin portfolios públicos'}
                </p>
                {isOwnProfile && (
                    <a href="/portfolio" className="inline-block text-xs font-bold px-4 py-1.5 rounded-xl"
                        style={{ background: PRIMARY_DIM, color: PRIMARY, border: `1px solid ${PRIMARY_BRD}` }}>
                        + Crear portfolio
                    </a>
                )}
            </div>
        );
    }

    // Build pie data from diversificacionPorClase
    const pieData = metrics
        ? Object.entries(metrics.diversificacionPorClase).map(([label, value], i) => ({ label, value, color: PIE_COLORS[i % PIE_COLORS.length] }))
        : [];

    const totalValue = metrics?.valorActual ?? 0;

    return (
        <div className="space-y-4">
            {/* ── Portfolio selector ── */}
            {portfolios.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {portfolios.map(p => (
                        <button key={p.id} onClick={() => { setSelectedId(p.id); setMetrics(null); setMovements([]); }}
                            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                            style={{
                                background: selectedId === p.id ? PRIMARY_DIM : 'hsl(var(--secondary) / 0.5)',
                                color: selectedId === p.id ? PRIMARY : 'hsl(var(--muted-foreground))',
                                border: `1px solid ${selectedId === p.id ? PRIMARY_BRD : 'hsl(var(--border))'}`,
                            }}>
                            <Wallet className="w-3 h-3 inline mr-1.5" />{p.nombre}
                            {p.esPrincipal && <span className="ml-1.5 opacity-60">★</span>}
                        </button>
                    ))}
                </div>
            )}

            {/* ── 4 KPI Cards ── */}
            {metrics && (
                <div className="grid grid-cols-2 gap-2.5">
                    {[
                        { label: 'Capital Invertido', value: fmt(metrics.capitalTotal, selected?.monedaBase), icon: DollarSign, color: '#3b82f6', sub: 'Total aportado' },
                        { label: 'Valor Actual', value: fmt(metrics.valorActual, selected?.monedaBase), icon: TrendingUp, color: PRIMARY, sub: 'A precios de mercado' },
                        { label: 'Ganancia / Pérdida', value: fmt(metrics.gananciaTotal, selected?.monedaBase), icon: metrics.gananciaTotal >= 0 ? ArrowUpRight : ArrowDownRight, color: metrics.gananciaTotal >= 0 ? PRIMARY : 'hsl(0 90% 58%)', sub: fmtPct(metrics.variacionPorcentual) },
                        { label: 'Activos en cartera', value: metrics.cantidadActivos.toString(), icon: Layers, color: '#a855f7', sub: `en ${selected?.nombre ?? ''}` },
                    ].map(({ label, value, icon: Icon, color, sub }) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl p-3.5" style={{ background: 'hsl(var(--secondary) / 0.45)', border: '1px solid hsl(var(--border))' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '18' }}>
                                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                                </div>
                                <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
                            </div>
                            <div className="text-lg font-black text-foreground leading-tight">{value}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── View switcher ── */}
            <div className="flex gap-1 rounded-xl overflow-hidden p-0.5" style={{ background: 'hsl(var(--secondary) / 0.5)', border: '1px solid hsl(var(--border))' }}>
                {(['overview', 'assets', 'movements'] as const).map(v => (
                    <button key={v} onClick={() => setActiveView(v)}
                        className="flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all capitalize"
                        style={{
                            background: activeView === v ? PRIMARY : 'transparent',
                            color: activeView === v ? '#000' : 'hsl(var(--muted-foreground))',
                        }}>
                        {v === 'overview' ? 'Resumen' : v === 'assets' ? 'Activos' : 'Movimientos'}
                    </button>
                ))}
            </div>

            {/* ══ OVERVIEW ══ */}
            <AnimatePresence mode="wait">
                {activeView === 'overview' && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        {/* Monthly returns chart */}
                        <div className="rounded-2xl p-4" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-sm font-bold text-foreground">Rendimiento Mensual</h4>
                                    <p className="text-[11px] text-muted-foreground">Últimos 12 meses</p>
                                </div>
                                {metrics && (
                                    <div className="text-right">
                                        <div className="text-lg font-black" style={{ color: metrics.variacionPorcentual >= 0 ? PRIMARY : 'hsl(0 90% 58%)' }}>
                                            {fmtPct(metrics.variacionPorcentual)}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">Retorno total</div>
                                    </div>
                                )}
                            </div>
                            <MonthlyBars />
                        </div>

                        {/* Diversification + Stats */}
                        <div className="grid grid-cols-5 gap-3">
                            {/* Pie chart */}
                            <div className="col-span-2 rounded-2xl p-4 flex flex-col items-center" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Clases</p>
                                <MiniPieChart data={pieData.length > 0 ? pieData : [
                                    { label: 'Acciones', value: 55, color: PRIMARY },
                                    { label: 'Crypto', value: 25, color: '#3b82f6' },
                                    { label: 'Otros', value: 20, color: '#f59e0b' },
                                ]} />
                            </div>

                            {/* Legend + risk */}
                            <div className="col-span-3 rounded-2xl p-4 space-y-3" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Distribución</p>
                                <div className="space-y-2">
                                    {(pieData.length > 0 ? pieData : [
                                        { label: 'Acciones (Tech)', value: 55, color: PRIMARY },
                                        { label: 'Crypto', value: 25, color: '#3b82f6' },
                                        { label: 'Commodities', value: 20, color: '#f59e0b' },
                                    ]).slice(0, 5).map((d) => {
                                        const pct = totalValue > 0 ? (d.value / (metrics ? Object.values(metrics.diversificacionPorClase).reduce((a, b) => a + b, 0) : 100)) * 100 : d.value;
                                        return (
                                            <div key={d.label} className="space-y-0.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                                                        <span className="text-[11px] text-muted-foreground truncate max-w-[90px]">{d.label}</span>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-foreground">{typeof pct === 'number' ? pct.toFixed(0) : d.value}%</span>
                                                </div>
                                                <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
                                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: d.color }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Risk level */}
                                {selected?.nivelRiesgo && (
                                    <div className="pt-2 border-t border-border/50">
                                        <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-bold">Nivel de Riesgo</p>
                                        <RiskMeter level={selected.nivelRiesgo} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats row */}
                        {(showStats || isOwnProfile) && (
                            <div className="grid grid-cols-3 gap-2.5">
                                {statsCards.map(({ label, value, color, icon: Icon }) => (
                                    <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'hsl(var(--secondary) / 0.5)', border: '1px solid hsl(var(--border))' }}>
                                        <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color }} />
                                        <div className="text-base font-black" style={{ color }}>{value}</div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ══ ASSETS ══ */}
                {activeView === 'assets' && (
                    <motion.div key="assets" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                        {selected && selected.assets.length > 0 ? (
                            <>
                                {/* Header */}
                                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    <span className="col-span-3">Activo</span>
                                    <span className="col-span-2 text-right">Cant.</span>
                                    <span className="col-span-3 text-right">Invertido</span>
                                    <span className="col-span-2 text-right">PPC</span>
                                    <span className="col-span-2 text-right">P&L</span>
                                </div>
                                {selected.assets.map((asset, i) => {
                                    const precio = asset.precioActual ?? asset.ppc;
                                    const actual = asset.cantidad * precio;
                                    const ganancia = actual - asset.montoInvertido;
                                    const pct = asset.montoInvertido > 0 ? (ganancia / asset.montoInvertido) * 100 : 0;
                                    const isUp = pct >= 0;
                                    const weight = totalValue > 0 ? (actual / totalValue) * 100 : 0;

                                    return (
                                        <motion.div key={asset.id}
                                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                            className="rounded-xl p-3 grid grid-cols-12 gap-2 items-center group transition-all"
                                            style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}
                                            onMouseEnter={e => (e.currentTarget.style.borderColor = isUp ? 'hsl(158 100% 45% / 0.3)' : 'hsl(0 90% 58% / 0.3)')}
                                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
                                        >
                                            {/* Ticker */}
                                            <div className="col-span-3 flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black flex-shrink-0"
                                                    style={{ background: PRIMARY_DIM, color: PRIMARY }}>
                                                    {asset.ticker.slice(0, 2)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-foreground truncate">{asset.ticker}</p>
                                                    <p className="text-[9px] text-muted-foreground">{weight.toFixed(1)}%</p>
                                                </div>
                                            </div>
                                            {/* Quantity */}
                                            <div className="col-span-2 text-right">
                                                <span className="text-xs text-muted-foreground">{asset.cantidad.toFixed(3)}</span>
                                            </div>
                                            {/* Invested */}
                                            <div className="col-span-3 text-right">
                                                <span className="text-xs text-foreground font-medium">{fmt(asset.montoInvertido, selected.monedaBase)}</span>
                                            </div>
                                            {/* Avg price */}
                                            <div className="col-span-2 text-right">
                                                <span className="text-xs text-muted-foreground">{fmt(asset.ppc, selected.monedaBase)}</span>
                                            </div>
                                            {/* P&L */}
                                            <div className="col-span-2 text-right">
                                                <span className="text-xs font-bold" style={{ color: isUp ? PRIMARY : 'hsl(0 90% 58%)' }}>
                                                    {isUp ? '+' : ''}{pct.toFixed(1)}%
                                                </span>
                                            </div>

                                            {/* Weight bar (full width) */}
                                            <div className="col-span-12 mt-1">
                                                <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
                                                    <motion.div className="h-full rounded-full"
                                                        initial={{ width: 0 }} animate={{ width: `${weight}%` }} transition={{ delay: i * 0.06, duration: 0.6 }}
                                                        style={{ background: isUp ? PRIMARY : 'hsl(0 90% 58%)' }} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </>
                        ) : (
                            <div className="rounded-2xl py-10 text-center" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px dashed hsl(var(--border))' }}>
                                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs text-muted-foreground">Sin activos en este portfolio</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ══ MOVEMENTS ══ */}
                {activeView === 'movements' && (
                    <motion.div key="movements" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                        {movements.length > 0 ? (
                            movements.map((mv, i) => {
                                const isCompra = mv.tipoMovimiento === 'compra';
                                return (
                                    <motion.div key={mv.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                        className="flex items-center gap-3 rounded-xl p-3"
                                        style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                                        {/* Icon */}
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: isCompra ? 'hsl(158 100% 45% / 0.12)' : 'hsl(0 90% 58% / 0.12)' }}>
                                            {isCompra
                                                ? <ArrowUpRight className="w-4 h-4" style={{ color: PRIMARY }} />
                                                : <ArrowDownRight className="w-4 h-4 text-red-400" />
                                            }
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-foreground">{mv.ticker}</span>
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                                                    style={{
                                                        background: isCompra ? 'hsl(158 100% 45% / 0.12)' : 'hsl(0 90% 58% / 0.12)',
                                                        color: isCompra ? PRIMARY : 'hsl(0 90% 58%)',
                                                    }}>
                                                    {mv.tipoMovimiento}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                                {mv.cantidad.toFixed(3)} × ${mv.precio.toFixed(2)}
                                            </p>
                                        </div>
                                        {/* Amount + date */}
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-xs font-bold" style={{ color: isCompra ? PRIMARY : 'hsl(0 90% 58%)' }}>
                                                {isCompra ? '-' : '+'}{fmt(mv.total, selected?.monedaBase)}
                                            </div>
                                            <div className="text-[9px] text-muted-foreground">
                                                {new Date(mv.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="rounded-2xl py-10 text-center" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px dashed hsl(var(--border))' }}>
                                <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs text-muted-foreground">Sin movimientos registrados</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Profile() {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, updateUser } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
    const [uploadingImage, setUploadingImage] = useState<'avatar' | 'banner' | null>(null);
    const [imageUploadError, setImageUploadError] = useState('');
    const [activeTab, setActiveTab] = useState<'posts' | 'portfolio' | 'saved'>('posts');
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowSubmitting, setIsFollowSubmitting] = useState(false);
    const [profilePosts, setProfilePosts] = useState<Post[]>([]);
    const [savedPosts, setSavedPosts] = useState<Post[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [isLoadingSavedPosts, setIsLoadingSavedPosts] = useState(false);

    // Pinned assets state
    const [pinnedAssets, setPinnedAssets] = useState<PinnedAsset[]>([]);
    const [allPinnedTickers, setAllPinnedTickers] = useState<string[]>([]);
    const [showAssetPicker, setShowAssetPicker] = useState(false);
    const [assetSearch, setAssetSearch] = useState('');
    const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isOwnProfile = !!(currentUser?.username === username || (!username && currentUser));

    useEffect(() => { loadProfile(); }, [username]);
    useEffect(() => {
        if (isOwnProfile) {
            void loadPinnedAssets();
            return;
        }

        setPinnedAssets([]);
        setAllPinnedTickers([]);
    }, [isOwnProfile, profile?.id]);

    useEffect(() => {
        if (!isOwnProfile && activeTab === 'saved') {
            setActiveTab('posts');
        }
    }, [isOwnProfile, activeTab]);

    /* ── Load profile ────────────────────────────── */
    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const targetUsername = username || currentUser?.username;
            if (!targetUsername) { navigate('/auth'); return; }
            const res = await apiFetch(`/users/${targetUsername}`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setEditForm(data);
                setIsFollowing(Boolean(data.isFollowedByMe));
            } else if (currentUser) {
                const fallback = buildFallback(currentUser);
                setProfile(fallback);
                setEditForm(fallback);
                setIsFollowing(false);
            }
        } catch {
            if (currentUser) {
                const fallback = buildFallback(currentUser);
                setProfile(fallback);
                setEditForm(fallback);
                setIsFollowing(false);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const buildFallback = (u: any): UserProfile => ({
        id: u.id || '1', username: u.username || 'User', email: u.email || '',
        bio: u.bio || 'Finix Investor', avatarUrl: u.avatarUrl,
        isInfluencer: false, isVerified: false, accountType: 'BASIC',
        isProfilePublic: true, showPortfolio: false, showStats: false, acceptingFollowers: true,
        _count: { posts: 0, following: 0, followedBy: 0 },
        createdAt: new Date().toISOString(),
    });

    const handleToggleFollow = async () => {
        if (!profile || isOwnProfile || isFollowSubmitting) return;

        const previousFollowing = isFollowing;
        const previousFollowers = profile._count?.followedBy || 0;
        const nextFollowing = !previousFollowing;

        setIsFollowSubmitting(true);
        setIsFollowing(nextFollowing);
        setProfile((prev) => prev ? {
            ...prev,
            _count: {
                posts: prev._count?.posts || 0,
                following: prev._count?.following || 0,
                followedBy: Math.max(previousFollowers + (nextFollowing ? 1 : -1), 0),
            },
            isFollowedByMe: nextFollowing,
        } : prev);

        try {
            const res = await apiFetch(`/users/${profile.username}/follow`, {
                method: 'PATCH',
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.message || 'No se pudo actualizar el seguimiento');
            }

            const data = await res.json();
            setIsFollowing(Boolean(data.following));
            setProfile((prev) => prev ? {
                ...prev,
                _count: {
                    posts: prev._count?.posts || 0,
                    following: prev._count?.following || 0,
                    followedBy: typeof data.followersCount === 'number' ? data.followersCount : prev._count?.followedBy || 0,
                },
                isFollowedByMe: Boolean(data.following),
            } : prev);
        } catch {
            setIsFollowing(previousFollowing);
            setProfile((prev) => prev ? {
                ...prev,
                _count: {
                    posts: prev._count?.posts || 0,
                    following: prev._count?.following || 0,
                    followedBy: previousFollowers,
                },
                isFollowedByMe: previousFollowing,
            } : prev);
        } finally {
            setIsFollowSubmitting(false);
        }
    };

    /* ── Load pinned assets from watchlist "__pinned__" ── */
    const loadPinnedAssets = async () => {
        try {
            const res = await apiFetch('/portfolios/watchlists');
            if (!res.ok) return;
            const watchlists = await res.json();
            const pinned = watchlists.find((w: any) => w.name === '__pinned__');
            if (!pinned) return;

            const tickers: string[] = pinned.tickers ? pinned.tickers.split(',').filter(Boolean) : [];
            setAllPinnedTickers(tickers);

            // Fetch quotes for each ticker
            const quotes = await Promise.all(
                tickers.map(async (ticker: string) => {
                    try {
                        const qRes = await apiFetch(`/market/quote?symbol=${ticker}`);
                        if (qRes.ok) {
                            const q = await qRes.json();
                            return {
                                ticker,
                                name: q.shortName || q.longName || ticker,
                                price: q.price ?? q.regularMarketPrice ?? 0,
                                change: q.change ?? q.regularMarketChange ?? 0,
                                changePercent: q.changePercent ?? q.regularMarketChangePercent ?? ((q.change && q.price) ? (q.change / (q.price - q.change)) * 100 : 0),
                            };
                        }
                    } catch { }
                    return { ticker, name: ticker, price: 0, change: 0, changePercent: 0 };
                })
            );
            setPinnedAssets(quotes.filter(Boolean) as PinnedAsset[]);
        } catch { }
    };

    /* ── Save pinned tickers to DB ────────────────── */
    const savePinnedTickers = async (tickers: string[]) => {
        try {
            // Get existing watchlists
            const pListRes = await apiFetch('/portfolios/watchlists');
            if (!pListRes.ok) return;
            const watchlists = await pListRes.json();
            const pinned = watchlists.find((w: any) => w.name === '__pinned__');

            if (pinned) {
                await apiFetch(`/portfolios/watchlists/${pinned.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tickers: tickers.join(',') }),
                });
            } else {
                await apiFetch('/portfolios/watchlists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: '__pinned__', tickers: tickers.join(',') }),
                });
            }
        } catch { }
    };

    /* ── Search assets ───────────────────────────── */
    useEffect(() => {
        if (!assetSearch.trim()) { setSearchResults([]); return; }
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        setIsSearching(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const res = await apiFetch(`/market/search?query=${encodeURIComponent(assetSearch)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults((data.quotes || data || []).slice(0, 8).map((q: any) => ({
                        symbol: q.symbol,
                        name: q.shortname || q.longname || q.symbol,
                    })));
                }
            } catch { }
            setIsSearching(false);
        }, 350);
    }, [assetSearch]);

    const addPinnedAsset = async (ticker: string, name: string) => {
        if (allPinnedTickers.includes(ticker) || allPinnedTickers.length >= 4) return;
        const newTickers = [...allPinnedTickers, ticker];
        setAllPinnedTickers(newTickers);
        await savePinnedTickers(newTickers);

        // Add preview asset
        const newAsset: PinnedAsset = { ticker, name, price: 0, change: 0, changePercent: 0 };
        setPinnedAssets(prev => [...prev, newAsset]);

        // Fetch real quote
        try {
            const qRes = await apiFetch(`/market/quote?symbol=${ticker}`);
            if (qRes.ok) {
                const q = await qRes.json();
                setPinnedAssets(prev => prev.map(a => a.ticker === ticker ? {
                    ...a,
                    name: q.shortName || name,
                    price: q.price ?? q.regularMarketPrice ?? 0,
                    change: q.change ?? q.regularMarketChange ?? 0,
                    changePercent: q.changePercent ?? q.regularMarketChangePercent ?? ((q.change && q.price) ? (q.change / (q.price - q.change)) * 100 : 0),
                } : a));
            }
        } catch { }

        setShowAssetPicker(false);
        setAssetSearch('');
    };

    const removePinnedAsset = async (ticker: string) => {
        const newTickers = allPinnedTickers.filter(t => t !== ticker);
        setAllPinnedTickers(newTickers);
        setPinnedAssets(prev => prev.filter(a => a.ticker !== ticker));
        await savePinnedTickers(newTickers);
    };

    const loadProfilePosts = async () => {
        const targetUsername = profile?.username || username || currentUser?.username;
        if (!targetUsername) return;

        setIsLoadingPosts(true);
        try {
            const res = await apiFetch(`/posts/user/${encodeURIComponent(targetUsername)}?limit=20`);
            if (!res.ok) {
                setProfilePosts([]);
                return;
            }

            const data = await res.json();
            setProfilePosts(Array.isArray(data?.posts) ? data.posts : []);
        } catch {
            setProfilePosts([]);
        } finally {
            setIsLoadingPosts(false);
        }
    };

    const loadSavedPosts = async () => {
        if (!isOwnProfile) return;

        setIsLoadingSavedPosts(true);
        try {
            const res = await apiFetch('/posts/saved?limit=20');
            if (!res.ok) {
                setSavedPosts([]);
                return;
            }

            const data = await res.json();
            setSavedPosts(Array.isArray(data?.posts) ? data.posts : []);
        } catch {
            setSavedPosts([]);
        } finally {
            setIsLoadingSavedPosts(false);
        }
    };

    useEffect(() => {
        if (!profile) return;

        if (activeTab === 'posts') {
            void loadProfilePosts();
        } else if (activeTab === 'saved' && isOwnProfile) {
            void loadSavedPosts();
        }
    }, [activeTab, profile?.username, isOwnProfile]);

    /* ── Save profile ────────────────────────────── */
    const handleSaveProfile = async () => {
        try {
            const res = await apiFetch('/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            if (res.ok) { const updated = await res.json(); setProfile(updated); setIsEditing(false); }
        } catch { }
    };

    const handleUploadImage = async (type: 'avatar' | 'banner') => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                setUploadingImage(type);
                setImageUploadError('');

                try {
                    const data = await uploadProfileImage(type, file);
                    const nextUrl = type === 'avatar' ? data.avatarUrl : data.bannerUrl;

                    if (!nextUrl) {
                        throw new Error(`No se recibió la URL del ${type === 'avatar' ? 'avatar' : 'banner'}`);
                    }

                    setEditForm((prev) => ({ ...prev, [type === 'avatar' ? 'avatarUrl' : 'bannerUrl']: nextUrl }));
                    setProfile((prev) => (prev ? { ...prev, [type === 'avatar' ? 'avatarUrl' : 'bannerUrl']: nextUrl } : prev));

                    if (type === 'avatar') {
                        updateUser({ avatarUrl: nextUrl });
                    }
                } catch (error: any) {
                    setImageUploadError(error?.message || `No se pudo subir el ${type === 'avatar' ? 'avatar' : 'banner'}`);
                } finally {
                    setUploadingImage(null);
                }
            }
        };
        input.click();
    };

    const parseJsonArray = (str?: string): string[] => {
        if (!str) return [];
        try { return JSON.parse(str); } catch { return str.split(',').filter(Boolean); }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center flex-1 bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: PRIMARY, borderTopColor: 'transparent' }} />
                    <p className="text-sm" style={{ color: PRIMARY }}>Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 gap-4">
                <User className="w-16 h-16 text-gray-600" />
                <h2 className="text-xl font-bold text-white">Perfil no encontrado</h2>
                <button onClick={() => navigate('/dashboard')} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: PRIMARY_DIM, color: PRIMARY, border: `1px solid ${PRIMARY_BRD}` }}>
                    Volver al inicio
                </button>
            </div>
        );
    }

    const specializations = parseJsonArray(profile.specializations);
    const certifications = parseJsonArray(profile.certifications);

    const tabs: { id: 'posts' | 'portfolio' | 'saved'; label: string; count?: number; icon?: JSX.Element }[] = [
        { id: 'posts', label: 'Posts', count: profile._count?.posts },
        { id: 'portfolio', label: 'Portfolio', icon: <PieChart className="w-3.5 h-3.5" /> },
        ...(isOwnProfile ? [{ id: 'saved' as const, label: 'Guardados' }] : []),
    ];

    return (
        <div className="flex-1 w-full pb-20 bg-background text-foreground">
            {/* ── BANNER ─────────────────────────────────────────── */}
            <div className="relative">
                <div
                    className="w-full h-52 relative overflow-hidden"
                    style={{
                        background: profile.bannerUrl
                            ? undefined
                            : 'linear-gradient(135deg, hsl(158 100% 8% / 0.5) 0%, hsl(200 80% 8% / 0.4) 40%, hsl(var(--background)) 100%)',
                    }}
                >
                    {profile.bannerUrl && (
                        <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                    )}
                    {/* Overlay gradient */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, hsl(var(--background) / 0.92) 100%)' }} />

                    {/* Grid pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(0deg, #00e676 0px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #00e676 0px, transparent 1px, transparent 40px)',
                        }}
                    />

                    {isOwnProfile && isEditing && (
                        <button
                            onClick={() => handleUploadImage('banner')}
                            disabled={uploadingImage === 'banner'}
                            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
                            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', backdropFilter: 'blur(8px)' }}
                        >
                            {uploadingImage === 'banner' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                            {uploadingImage === 'banner' ? 'Subiendo...' : 'Cambiar banner'}
                        </button>
                    )}
                </div>

                {/* Avatar + action buttons row */}
                <div className="px-6 relative -mt-16 flex items-end justify-between">
                    {/* Avatar */}
                    <div className="relative z-10">
                        <div
                            className="w-28 h-28 rounded-full border-4 overflow-hidden flex items-center justify-center text-3xl font-black"
                            style={{
                                borderColor: 'hsl(var(--background))',
                                background: 'linear-gradient(135deg, hsl(158 100% 45%) 0%, hsl(158 100% 25%) 100%)',
                                color: '#060a07',
                                boxShadow: `0 0 32px hsl(158 100% 45% / 0.35)`,
                            }}
                        >
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                            ) : (
                                profile.username[0].toUpperCase()
                            )}
                        </div>
                        {isOwnProfile && isEditing && (
                            <button
                                onClick={() => handleUploadImage('avatar')}
                                disabled={uploadingImage === 'avatar'}
                                className="absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: PRIMARY, color: '#000' }}
                            >
                                {uploadingImage === 'avatar' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                            </button>
                        )}
                        {/* Verified badge */}
                        {profile.isVerified && (
                            <div
                                className="absolute bottom-1 right-1 w-7 h-7 rounded-full flex items-center justify-center"
                                style={{ background: PRIMARY, border: '2px solid hsl(var(--background))' }}
                            >
                                <Check className="w-3.5 h-3.5 text-black" />
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pb-2">
                        {isOwnProfile ? (
                            isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border"
                                        style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                                    >
                                        <X className="w-3.5 h-3.5" /> Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                                        style={{ background: PRIMARY, color: '#000' }}
                                    >
                                        <Check className="w-3.5 h-3.5" /> Guardar
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                                    style={{ borderColor: PRIMARY_BRD, color: PRIMARY, background: PRIMARY_DIM }}
                                >
                                    <Edit className="w-3.5 h-3.5" /> Editar perfil
                                </button>
                            )
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate(`/messages?user=${profile.id}`)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                                    style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--secondary))' }}
                                >
                                    <MessageSquare className="w-3.5 h-3.5" /> Mensaje
                                </button>
                                <button
                                    onClick={handleToggleFollow}
                                    disabled={isFollowSubmitting}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                    style={{
                                        background: isFollowing ? 'hsl(var(--secondary))' : PRIMARY,
                                        color: isFollowing ? 'hsl(var(--muted-foreground))' : '#000',
                                        border: isFollowing ? '1px solid hsl(var(--border))' : 'none',
                                        opacity: isFollowSubmitting ? 0.75 : 1,
                                    }}
                                >
                                    {isFollowSubmitting
                                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando</>
                                        : isFollowing
                                            ? <><Check className="w-3.5 h-3.5" /> Siguiendo</>
                                            : <><UserPlus className="w-3.5 h-3.5" /> Seguir</>}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* ── PROFILE INFO ──────────────────────────────── */}
                <div className="px-6 mt-4">
                    {imageUploadError && isEditing ? (
                        <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                            {imageUploadError}
                        </div>
                    ) : null}

                    <div className="flex items-center gap-2 mb-1">
                        {isEditing ? (
                            <Input
                                value={editForm.username || ''}
                                onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                                className="text-2xl font-black max-w-xs bg-transparent border-border text-foreground"
                            />
                        ) : (
                            <h1 className="text-2xl font-black text-foreground">{profile.username}</h1>
                        )}
                        {profile.isVerified && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: PRIMARY }}>
                                <Check className="w-3 h-3 text-black" />
                            </div>
                        )}
                        {profile.isInfluencer && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'hsl(47 100% 50% / 0.15)', color: '#fbbf24', border: '1px solid hsl(47 100% 50% / 0.25)' }}>
                                <Award className="w-3 h-3 inline mr-1" />Influencer
                            </span>
                        )}
                    </div>

                    {isEditing ? (
                        <Input
                            value={editForm.title || ''}
                            placeholder="ej: Value Investor & Macro Strategist"
                            onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                            className="mb-2 bg-transparent border-white/20 text-gray-400 text-sm"
                        />
                    ) : profile.title && (
                        <p className="text-sm mb-2 text-muted-foreground">{profile.title}</p>
                    )}

                    {isEditing ? (
                        <Textarea
                            value={editForm.bio || ''}
                            placeholder="Contá algo sobre vos..."
                            onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                            rows={2}
                            className="mb-3 bg-transparent border-white/20 text-white text-sm"
                        />
                    ) : profile.bio && (
                        <p className="text-sm mb-3 leading-relaxed text-foreground/75">
                            {profile.bio}
                        </p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-4 text-xs mb-4 text-muted-foreground">
                        {profile.location && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>
                        )}
                        {profile.company && (
                            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{profile.company}</span>
                        )}
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Miembro desde {new Date(profile.createdAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                        </span>
                        {profile.website && (
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors" style={{ color: PRIMARY }}>
                                <Globe className="w-3 h-3" />{profile.website.replace(/^https?:\/\//, '')}
                            </a>
                        )}
                    </div>

                    {/* Social links */}
                    <div className="flex gap-1 mb-5">
                        {[
                            { url: profile.linkedinUrl, Icon: Linkedin },
                            { url: profile.twitterUrl, Icon: Twitter },
                            { url: profile.youtubeUrl, Icon: Youtube },
                            { url: profile.instagramUrl, Icon: Instagram },
                        ].filter(s => s.url).map(({ url, Icon }, i) => (
                            <a key={i} href={url!} target="_blank" rel="noopener noreferrer"
                                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 bg-secondary border border-border">
                                <Icon className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                        ))}
                    </div>

                    {/* ── STATS ROW ────────────────────────────── */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[
                            { value: profile._count?.followedBy?.toLocaleString() || '0', label: 'Seguidores' },
                            { value: profile._count?.following?.toLocaleString() || '0', label: 'Siguiendo' },
                            {
                                value: profile.totalReturn ? `+${profile.totalReturn.toFixed(1)}%` : '+0.0%',
                                label: 'Retorno Total',
                                green: true,
                            },
                        ].map((s, i) => (
                            <div key={i} className="rounded-2xl p-4 text-center"
                                style={{
                                    background: s.green ? 'linear-gradient(135deg, hsl(158 100% 45% / 0.12) 0%, hsl(158 100% 45% / 0.04) 100%)' : 'hsl(var(--secondary) / 0.5)',
                                    border: s.green ? `1px solid ${PRIMARY_BRD}` : '1px solid hsl(var(--border))',
                                }}>
                                <div className="text-xl font-black mb-0.5" style={{ color: s.green ? PRIMARY : 'hsl(var(--foreground))' }}>{s.value}</div>
                                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {(profile.bioLong || profile.yearsExperience || specializations.length > 0 || certifications.length > 0) && (
                        <div className="grid gap-4 mb-6 md:grid-cols-2">
                            {profile.bioLong && (
                                <div className="rounded-2xl p-5 md:col-span-2" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Sobre el perfil</p>
                                    <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{profile.bioLong}</p>
                                </div>
                            )}

                            {profile.yearsExperience !== undefined && profile.yearsExperience !== null && (
                                <div className="rounded-2xl p-5" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Experiencia</p>
                                    <p className="text-lg font-black text-foreground">{profile.yearsExperience} años</p>
                                    <p className="text-xs mt-1 text-muted-foreground">Trayectoria declarada en mercados</p>
                                </div>
                            )}

                            {specializations.length > 0 && (
                                <div className="rounded-2xl p-5" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Especializaciones</p>
                                    <div className="flex flex-wrap gap-2">
                                        {specializations.map((item) => (
                                            <span
                                                key={item}
                                                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                                                style={{ background: PRIMARY_DIM, color: PRIMARY, border: `1px solid ${PRIMARY_BRD}` }}
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {certifications.length > 0 && (
                                <div className="rounded-2xl p-5 md:col-span-2" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Certificaciones</p>
                                    <div className="flex flex-wrap gap-2">
                                        {certifications.map((item) => (
                                            <span
                                                key={item}
                                                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                                                style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── ACTIVOS DESTACADOS ───────────────────── */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                Activos Destacados
                            </h3>
                            {isOwnProfile && allPinnedTickers.length < 4 && (
                                <button
                                    onClick={() => setShowAssetPicker(true)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                                    style={{ background: PRIMARY_DIM, color: PRIMARY, border: `1px solid ${PRIMARY_BRD}` }}
                                >
                                    <Plus className="w-3 h-3" /> Agregar
                                </button>
                            )}
                        </div>

                        {pinnedAssets.length === 0 ? (
                            <div className="rounded-2xl p-6 text-center" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px dashed hsl(var(--border))' }}>
                                <Star className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs text-gray-600">
                                    {isOwnProfile ? 'Seleccioná hasta 4 activos favoritos para mostrar en tu perfil' : 'Sin activos destacados'}
                                </p>
                                {isOwnProfile && (
                                    <button
                                        onClick={() => setShowAssetPicker(true)}
                                        className="mt-3 px-4 py-1.5 rounded-xl text-xs font-semibold"
                                        style={{ background: PRIMARY_DIM, color: PRIMARY, border: `1px solid ${PRIMARY_BRD}` }}
                                    >
                                        + Agregar activo
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {pinnedAssets.map((asset) => {
                                    const isUp = asset.changePercent >= 0;
                                    return (
                                        <motion.div
                                            key={asset.ticker}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="relative group rounded-2xl p-3"
                                            style={{
                                                background: 'hsl(var(--secondary) / 0.5)',
                                                border: '1px solid hsl(var(--border))',
                                            }}
                                        >
                                            {isOwnProfile && (
                                                <button
                                                    onClick={() => removePinnedAsset(asset.ticker)}
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-md"
                                                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                            <div className="flex items-center gap-1 mb-2">
                                                <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black" style={{ background: PRIMARY_DIM, color: PRIMARY }}>
                                                    {asset.ticker[0]}
                                                </div>
                                                <span className="text-xs font-black text-foreground">{asset.ticker}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 truncate mb-1">{asset.name}</div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-foreground">
                                                    {asset.price > 0 ? `$${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                                                </span>
                                                <span
                                                    className="px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 opacity-90"
                                                    style={{
                                                        background: isUp ? 'rgba(0,230,118,0.12)' : 'rgba(239,68,68,0.12)',
                                                        color: isUp ? PRIMARY : '#ef4444',
                                                    }}
                                                >
                                                    <span>{isUp ? '+' : '-'}${(Math.abs(asset.change) ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    <span className="opacity-80 text-[9px]">({isUp ? '+' : ''}{(asset.changePercent ?? 0).toFixed(2)}%)</span>
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── TABS ──────────────────────────────────────── */}
                <div className="px-6 border-b border-border">
                    <div className="flex">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="relative flex items-center gap-1.5 px-5 py-3 text-sm font-semibold transition-colors"
                                style={{ color: activeTab === tab.id ? PRIMARY : 'hsl(var(--muted-foreground))' }}
                            >
                                {'icon' in tab && tab.icon}
                                {tab.label}
                                {'count' in tab && tab.count !== undefined && (
                                    <span className="text-xs opacity-60">({tab.count})</span>
                                )}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="profile-tab-underline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                                        style={{ background: PRIMARY }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── TAB CONTENT ───────────────────────────────── */}
                <div className="px-6 py-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'portfolio' && (
                            <motion.div key="portfolio"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                                className="space-y-5"
                            >
                                <ProfilePortfolioSection
                                    key={`${profile.id}-${isOwnProfile ? 'own' : 'public'}`}
                                    profileUserId={profile.id}
                                    isOwnProfile={isOwnProfile}
                                    showPortfolio={profile.showPortfolio}
                                    totalReturn={profile.totalReturn}
                                    winRate={profile.winRate}
                                    riskScore={profile.riskScore}
                                    showStats={profile.showStats}
                                />
                            </motion.div>
                        )}

                        {activeTab === 'posts' && (
                            <motion.div key="posts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                {isLoadingPosts ? (
                                    <div className="rounded-2xl py-16 text-center" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                                        <Loader2 className="w-12 h-12 mx-auto mb-3 opacity-40 animate-spin" />
                                        <p className="text-muted-foreground text-sm">Cargando publicaciones...</p>
                                    </div>
                                ) : profilePosts.length > 0 ? (
                                    <div className="space-y-4">
                                        {profilePosts.map((post) => (
                                            <PostCard
                                                key={post.id}
                                                post={post}
                                                currentUserId={currentUser?.id}
                                                onUpdated={(updatedPost) => {
                                                    setProfilePosts((prev) => prev.map((item) => item.id === updatedPost.id ? updatedPost : item));
                                                    setSavedPosts((prev) => prev.map((item) => item.id === updatedPost.id ? updatedPost : item));
                                                }}
                                                onDeleted={(postId) => {
                                                    setProfilePosts((prev) => prev.filter((item) => item.id !== postId));
                                                    setSavedPosts((prev) => prev.filter((item) => item.id !== postId));
                                                    setProfile((prev) => prev ? {
                                                        ...prev,
                                                        _count: prev._count ? {
                                                            ...prev._count,
                                                            posts: Math.max((prev._count.posts || 0) - 1, 0),
                                                        } : prev._count,
                                                    } : prev);
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl py-16 text-center" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                                        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-muted-foreground text-sm">No hay publicaciones aún</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'saved' && (
                            <motion.div key="saved" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                {isLoadingSavedPosts ? (
                                    <div className="rounded-2xl py-16 text-center" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                                        <Loader2 className="w-12 h-12 mx-auto mb-3 opacity-40 animate-spin" />
                                        <p className="text-muted-foreground text-sm">Cargando guardados...</p>
                                    </div>
                                ) : savedPosts.length > 0 ? (
                                    <div className="space-y-4">
                                        {savedPosts.map((post) => (
                                            <PostCard
                                                key={post.id}
                                                post={post}
                                                currentUserId={currentUser?.id}
                                                onUpdated={(updatedPost) => {
                                                    if (activeTab === 'saved' && !updatedPost.savedByMe) {
                                                        setSavedPosts((prev) => prev.filter((item) => item.id !== updatedPost.id));
                                                        setProfilePosts((prev) => prev.map((item) => item.id === updatedPost.id ? updatedPost : item));
                                                        return;
                                                    }
                                                    setSavedPosts((prev) => prev.map((item) => item.id === updatedPost.id ? updatedPost : item));
                                                    setProfilePosts((prev) => prev.map((item) => item.id === updatedPost.id ? updatedPost : item));
                                                }}
                                                onDeleted={(postId) => {
                                                    setSavedPosts((prev) => prev.filter((item) => item.id !== postId));
                                                    setProfilePosts((prev) => prev.filter((item) => item.id !== postId));
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl py-16 text-center" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                                        <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-muted-foreground text-sm">No hay guardados</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── EDIT FORM (about tab when editing) ───── */}
                    {isEditing && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 rounded-2xl p-5 space-y-4"
                            style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}
                        >
                            <h3 className="font-bold text-foreground mb-4">Editar información</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { field: 'title', placeholder: 'ej: Value Investor', label: 'Título' },
                                    { field: 'company', placeholder: 'ej: Goldman Sachs', label: 'Empresa' },
                                    { field: 'location', placeholder: 'ej: Buenos Aires', label: 'Ubicación' },
                                    { field: 'website', placeholder: 'https://...', label: 'Website' },
                                ].map(({ field, placeholder, label }) => (
                                    <div key={field}>
                                        <label className="text-xs font-semibold mb-1 block text-gray-500 uppercase tracking-wider">{label}</label>
                                        <Input
                                            placeholder={placeholder}
                                            value={(editForm as any)[field] || ''}
                                            onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                                            className="bg-transparent border-border text-foreground"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { field: 'linkedinUrl', placeholder: 'LinkedIn URL', label: 'LinkedIn' },
                                    { field: 'twitterUrl', placeholder: 'Twitter URL', label: 'Twitter/X' },
                                    { field: 'youtubeUrl', placeholder: 'YouTube URL', label: 'YouTube' },
                                    { field: 'instagramUrl', placeholder: 'Instagram URL', label: 'Instagram' },
                                ].map(({ field, placeholder, label }) => (
                                    <div key={field}>
                                        <label className="text-xs font-semibold mb-1 block text-gray-500 uppercase tracking-wider">{label}</label>
                                        <Input
                                            placeholder={placeholder}
                                            value={(editForm as any)[field] || ''}
                                            onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                                            className="bg-transparent border-border text-foreground"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="text-xs font-semibold mb-1 block text-gray-500 uppercase tracking-wider">Bio extendida</label>
                                <Textarea
                                    value={editForm.bioLong || ''}
                                    onChange={e => setEditForm(p => ({ ...p, bioLong: e.target.value }))}
                                    rows={4}
                                    className="bg-transparent border-border text-foreground"
                                />
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Specializations & Certifications */}
                {(specializations.length > 0 || certifications.length > 0) && (
                    <div className="px-6 pb-6 grid md:grid-cols-2 gap-4">
                        {specializations.length > 0 && (
                            <div className="rounded-2xl p-4" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                                    <BarChart3 className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
                                    Especializaciones
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {specializations.map((s, i) => (
                                        <span key={i} className="px-3 py-1 rounded-xl text-xs font-semibold" style={{ background: PRIMARY_DIM, color: PRIMARY, border: `1px solid ${PRIMARY_BRD}` }}>
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {certifications.length > 0 && (
                            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                                    <Award className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
                                    Certificaciones
                                </h4>
                                <div className="space-y-2">
                                    {certifications.map((c, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Check className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY }} />
                                            {c}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── ASSET PICKER MODAL ─────────────────────────── */}
            <AnimatePresence>
                {showAssetPicker && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-40"
                            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => { setShowAssetPicker(false); setAssetSearch(''); }}
                        />
                        <motion.div
                            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        >
                            <div className="rounded-3xl p-5 mx-4 bg-card border border-border/60" style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-foreground">Elegir activo destacado</h3>
                                    <button onClick={() => { setShowAssetPicker(false); setAssetSearch(''); }}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-secondary">
                                        <X className="w-3.5 h-3.5 text-gray-400" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mb-3">{4 - allPinnedTickers.length} lugar(es) disponible(s)</p>

                                <div className="flex items-center gap-2 px-3 rounded-xl mb-4 bg-secondary border border-border">
                                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Buscar símbolo o empresa..."
                                        value={assetSearch}
                                        onChange={e => setAssetSearch(e.target.value)}
                                        className="flex-1 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                                    />
                                    {isSearching && <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: PRIMARY, borderTopColor: 'transparent' }} />}
                                </div>

                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                    {searchResults.length > 0 ? searchResults.map((r) => {
                                        const already = allPinnedTickers.includes(r.symbol);
                                        return (
                                            <button
                                                key={r.symbol}
                                                disabled={already}
                                                onClick={() => addPinnedAsset(r.symbol, r.name)}
                                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left"
                                                style={{
                                                    background: already ? 'rgba(255,255,255,0.03)' : 'transparent',
                                                    opacity: already ? 0.5 : 1,
                                                }}
                                                onMouseEnter={e => !already && ((e.currentTarget as HTMLElement).style.background = 'hsl(var(--secondary) / 0.6)')}
                                                onMouseLeave={e => !already && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black" style={{ background: PRIMARY_DIM, color: PRIMARY }}>
                                                        {r.symbol[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">{r.symbol}</p>
                                                        <p className="text-xs text-gray-500 truncate max-w-[240px]">{r.name}</p>
                                                    </div>
                                                </div>
                                                {already ? <Check className="w-4 h-4 text-gray-600" /> : <Plus className="w-4 h-4 text-gray-500" />}
                                            </button>
                                        );
                                    }) : assetSearch.length > 0 && !isSearching ? (
                                        <p className="text-center py-8 text-sm text-gray-600">Sin resultados para "{assetSearch}"</p>
                                    ) : assetSearch.length === 0 ? (
                                        <div className="py-6 text-center">
                                            <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs text-gray-600">Escribí para buscar acciones, cryptos, ETFs...</p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div >
    );
}
