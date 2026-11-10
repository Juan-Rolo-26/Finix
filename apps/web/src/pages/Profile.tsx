import { UiText as FinixUiText } from '@/i18n/UiText';
import { useTranslation as useFinixUiTranslation } from '@/i18n';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore, isJuanUser } from '../stores/authStore';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { uploadProfileImage } from '@/lib/profileMedia';
import { motion, AnimatePresence } from 'framer-motion';
import { SymbolLogo } from '@/components/SymbolLogo';
import { UserConnectionsDialog, type ConnectionsListType } from '@/components/UserConnectionsDialog';
import { resolveAssetInfo } from '@/lib/tradingview';
import { ImagePreviewButton } from '@/components/common/ImagePreviewButton';
import {
    User, MapPin, Briefcase, Calendar, Award, TrendingUp,
    Linkedin, Twitter, Youtube, Instagram,
    Edit, Check, X, Camera, Globe,
    BarChart3, Target, UserPlus,
    Star, Search, Plus, Wallet, DollarSign,
    ArrowUpRight, ArrowDownRight, Layers, Activity, Loader2, Lock, Flag,
    Share2, Settings as SettingsIcon, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import ReportModal from '@/components/ReportModal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProfilePortfolio } from '@/components/portfolio/summary/useProfilePortfolio';
import { AllocationSummary, MonthlyReturnChart } from '@/components/portfolio/summary/PortfolioSummaryCharts';
import VerifiedBadge from '@/components/common/VerifiedBadge';
import { InvestorStreakPill } from '@/components/common/InvestorStreakPill';


/* ─── Brand tokens ─────────────────────────────────────────── */
const PRIMARY = 'hsl(158 100% 45%)';
const PRIMARY_DIM = 'hsl(158 100% 45% / 0.12)';
const PRIMARY_BRD = 'hsl(158 100% 45% / 0.25)';
const PROFILE_CURRENCY_FORMATTERS = {
    USD: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', currencyDisplay: 'symbol', maximumFractionDigits: 2 }),
    ARS: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', currencyDisplay: 'code', maximumFractionDigits: 2 }),
} as const;

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
    showExactReturns: boolean;
    returnsVisibilityMode: string;
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

function formatSignedPercentage(value?: number | null, fractionDigits = 2, returnsVisibilityMode = 'exact', showExactReturns = true) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return '—';
    }

    if (!showExactReturns || returnsVisibilityMode === 'range') {
        if (value > 50) return "+50%";
        if (value > 20) return "20% - 50%";
        if (value > 5) return "5% - 20%";
        if (value > 0) return "0% - 5%";
        if (value > -5) return "-5% - 0%";
        if (value > -20) return "-20% - -5%";
        return "Menos de -20%";
    }

    return `${value >= 0 ? '+' : ''}${value.toFixed(fractionDigits)}%`;
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
                    <span key={l} className="text-sm" style={{ color: i === idx ? colors[idx] : 'hsl(var(--muted-foreground))' }}>{l}</span>
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
    showExactReturns?: boolean;
    returnsVisibilityMode?: string;
}

export function ProfilePortfolioSection({ profileUserId, isOwnProfile, showPortfolio, totalReturn, winRate, riskScore, showStats, showExactReturns, returnsVisibilityMode }: ProfilePortfolioSectionProps) {
    const { ui: finixUi } = useFinixUiTranslation();

    const { portfolios, selectedId, selected, selectPortfolio, metrics, movements, loading, refreshing, error, updatedAt, refresh } = useProfilePortfolio(profileUserId, isOwnProfile, showPortfolio);
    const [activeView, setActiveView] = useState<'overview' | 'assets' | 'movements'>('overview');

    const fmt = (n: number, cur = 'USD') => {
        if (!isOwnProfile && (!showExactReturns || returnsVisibilityMode === 'range')) return '***';
        const currencyCode = cur === 'USD MEP' ? 'USD' : cur.toUpperCase();
        const formatter = PROFILE_CURRENCY_FORMATTERS[currencyCode as keyof typeof PROFILE_CURRENCY_FORMATTERS] ?? PROFILE_CURRENCY_FORMATTERS.USD;
        return formatter.format(n);
    };

    const fmtPct = (n: number) => isOwnProfile ? formatSignedPercentage(n) : formatSignedPercentage(n, 2, returnsVisibilityMode, showExactReturns);

    const riskLabels: Record<string, string> = {
        bajo: 'Conservador',
        medio: 'Moderado',
        alto: 'Agresivo',
    };
    const hasTotalReturn = typeof totalReturn === 'number' && Number.isFinite(totalReturn);
    const hasWinRate = Boolean(selected?.esPrincipal) && typeof winRate === 'number' && Number.isFinite(winRate);
    const hasRiskScore = Boolean(selected?.esPrincipal) && typeof riskScore === 'number' && Number.isFinite(riskScore);
    const resolvedTotalReturn = metrics?.variacionPorcentual ?? (selected?.esPrincipal && hasTotalReturn ? totalReturn : undefined);
    const totalReturnDisplay = isOwnProfile ? formatSignedPercentage(resolvedTotalReturn) : formatSignedPercentage(resolvedTotalReturn, 2, returnsVisibilityMode, showExactReturns);
    const totalReturnColor =
        typeof resolvedTotalReturn === 'number' && Number.isFinite(resolvedTotalReturn) && resolvedTotalReturn < 0
            ? 'hsl(0 90% 58%)'
            : PRIMARY;
    const statsCards = [
        {
            label: 'Retorno Total',
            value: totalReturnDisplay,
            color: totalReturnColor,
            icon: TrendingUp,
        },
        hasWinRate
            ? {
                label: 'Tasa de acierto',
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
                label: 'Puntaje de riesgo',
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
                <p className="text-sm font-semibold text-foreground">{""}<FinixUiText text={"Portafolio privado"} />{""}</p>
                <p className="text-sm text-muted-foreground">{""}<FinixUiText text={"Este usuario mantiene su portafolio oculto"} />{""}</p>
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
                    {error || (isOwnProfile ? 'Aún no tenés portafolios' : 'Sin portafolios públicos')}
                </p>
                {error && <button type="button" onClick={refresh} className="rounded-xl border border-border px-5 py-3 text-base font-semibold">{""}<FinixUiText text={"Reintentar"} />{""}</button>}
                {!error && isOwnProfile && (
                    <Link to="/portfolio" className="inline-block text-sm font-bold px-4 py-1.5 rounded-xl"
                        style={{ background: PRIMARY_DIM, color: PRIMARY, border: `1px solid ${PRIMARY_BRD}` }}>
                        {" "}<FinixUiText text={"+ Crear portafolio"} />{" "}</Link>
                )}
            </div>
        );
    }

    const totalValue = metrics?.valorActual ?? 0;

    return (
        <div className="min-w-0 space-y-6" aria-label={finixUi("Resumen del portafolio del perfil")} aria-busy={loading || refreshing}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">{selected?.nombre}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {updatedAt ? `Actualizado a las ${new Date(updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : 'Cargando datos del portafolio…'} · {selected?.monedaBase}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={refresh} disabled={refreshing} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary disabled:opacity-60">
                        <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />{""}<FinixUiText text={"Actualizar"} />{" "}</button>
                    {isOwnProfile && <Link to="/portfolio" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"><Wallet className="h-4 w-4" />{""}<FinixUiText text={"Administrar portafolio"} />{""}<ArrowUpRight className="h-4 w-4" /></Link>}
                </div>
            </div>
            {error && <p role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">{error}</p>}
            {/* ── Portfolio selector ── */}
            {portfolios.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {portfolios.map(p => (
                        <button key={p.id} onClick={() => selectPortfolio(p.id)} aria-pressed={selectedId === p.id}
                            className="flex-shrink-0 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                    {[
                        { label: 'Capital aportado', value: fmt(metrics.capitalTotal, selected?.monedaBase), icon: DollarSign, color: '#3b82f6', sub: 'Aportes netos de retiros' },
                        { label: 'Valor Actual', value: fmt(metrics.valorActual, selected?.monedaBase), icon: TrendingUp, color: PRIMARY, sub: 'A precios de mercado' },
                        { label: 'Ganancia / Pérdida', value: fmt(metrics.gananciaTotal, selected?.monedaBase), icon: metrics.gananciaTotal >= 0 ? ArrowUpRight : ArrowDownRight, color: metrics.gananciaTotal >= 0 ? PRIMARY : 'hsl(0 90% 58%)', sub: fmtPct(metrics.variacionPorcentual) },
                        { label: 'Activos en cartera', value: metrics.cantidadActivos.toString(), icon: Layers, color: '#a855f7', sub: `en ${selected?.nombre ?? ''}` },
                    ].map(({ label, value, icon: Icon, color, sub }) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className="relative min-w-0 overflow-hidden rounded-3xl p-5 shadow-sm sm:p-6" style={{ background: 'linear-gradient(145deg, hsl(var(--card) / 0.94), hsl(var(--secondary) / 0.48))', border: '1px solid hsl(var(--border) / 0.78)' }}>
                            <div className="absolute -right-7 -top-8 h-20 w-20 rounded-full blur-2xl" style={{ background: color, opacity: 0.09 }} />
                            <div className="relative flex items-start justify-between gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 20%, transparent)` }}>
                                    <Icon className="h-4 w-4" style={{ color }} />
                                </div>
                                <span className="pt-1 text-right text-sm font-semibold text-muted-foreground">{label}</span>
                            </div>
                            <div className="relative mt-5 break-words text-3xl font-extrabold leading-tight tracking-tight tabular-nums text-foreground sm:text-[32px]">{value}</div>
                            <div className="relative mt-2 text-sm text-muted-foreground">{sub}</div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── View switcher ── */}
            <div className="flex gap-1 rounded-2xl p-1" style={{ background: 'hsl(var(--card) / 0.72)', border: '1px solid hsl(var(--border) / 0.8)' }}>
                {(['overview', 'assets', 'movements'] as const).map(v => {
                    const ViewIcon = v === 'overview' ? BarChart3 : v === 'assets' ? Layers : Activity;
                    return (
                    <button key={v} onClick={() => setActiveView(v)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl min-h-12 py-3 text-sm font-bold transition-[color,background-color,box-shadow] sm:text-base"
                        style={{
                            background: activeView === v ? 'linear-gradient(135deg, hsl(158 100% 50%), hsl(158 100% 38%))' : 'transparent',
                            color: activeView === v ? '#001b12' : 'hsl(var(--muted-foreground))',
                            boxShadow: activeView === v ? '0 5px 16px hsl(158 100% 35% / 0.2)' : 'none',
                        }}>
                        <ViewIcon className="h-5 w-5" />
                        {v === 'overview' ? 'Resumen' : v === 'assets' ? 'Activos' : 'Movimientos'}
                    </button>
                    );
                })}
            </div>

            {/* ══ OVERVIEW ══ */}
            <AnimatePresence initial={false}>
                {activeView === 'overview' && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <MonthlyReturnChart
                            returns={metrics?.retornosMensuales}
                            loading={!metrics && !error}
                            hidden={!isOwnProfile && (!showExactReturns || returnsVisibilityMode === 'range')}
                            totalReturn={totalReturnDisplay}
                        />
                        <AllocationSummary data={metrics?.diversificacionPorClase ?? {}} loading={!metrics && !error} />
                        {selected?.nivelRiesgo && (
                            <div className="rounded-2xl border border-border bg-card p-5">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-base font-semibold">{""}<FinixUiText text={"Perfil de riesgo declarado"} />{""}</p>
                                    <span className="text-base font-bold">{riskLabels[selected.nivelRiesgo.toLowerCase()] ?? selected.nivelRiesgo}</span>
                                </div>
                                <RiskMeter level={selected.nivelRiesgo} />
                            </div>
                        )}

                        {/* Stats row */}
                        {(showStats || isOwnProfile) && (hasWinRate || hasRiskScore) && (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {statsCards.map(({ label, value, color, icon: Icon }) => (
                                    <div key={label} className="flex items-center gap-3 rounded-2xl p-4 shadow-sm" style={{ background: 'hsl(var(--card) / 0.82)', border: '1px solid hsl(var(--border) / 0.8)' }}>
                                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
                                            <Icon className="h-4 w-4" style={{ color }} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="break-words text-2xl font-bold" style={{ color }}>{value}</div>
                                            <div className="mt-0.5 text-sm font-semibold text-muted-foreground">{<FinixUiText text={label} />}</div>
                                        </div>
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
                            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                              <div className="min-w-[680px] space-y-2 p-3">
                                {/* Header */}
                                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                    <span className="col-span-3">{""}<FinixUiText text={"Activo"} />{""}</span>
                                    <span className="col-span-2 text-right">{""}<FinixUiText text={"Cant."} />{""}</span>
                                    <span className="col-span-3 text-right">{""}<FinixUiText text={"Invertido"} />{""}</span>
                                    <span className="col-span-2 text-right">{""}<FinixUiText text={"PPC"} />{""}</span>
                                    <span className="col-span-2 text-right">{""}<FinixUiText text={"P&L"} />{""}</span>
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
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0"
                                                    style={{ background: PRIMARY_DIM, color: PRIMARY }}>
                                                    {asset.ticker.slice(0, 2)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-foreground truncate">{asset.ticker}</p>
                                                    <p className="text-sm text-muted-foreground">{weight.toFixed(1)}%</p>
                                                </div>
                                            </div>
                                            {/* Quantity */}
                                            <div className="col-span-2 text-right">
                                                <span className="text-sm text-muted-foreground">{asset.cantidad.toFixed(3)}</span>
                                            </div>
                                            {/* Invested */}
                                            <div className="col-span-3 text-right">
                                                <span className="text-sm text-foreground font-medium">{fmt(asset.montoInvertido, selected.monedaBase)}</span>
                                            </div>
                                            {/* Avg price */}
                                            <div className="col-span-2 text-right">
                                                <span className="text-sm text-muted-foreground">{fmt(asset.ppc, selected.monedaBase)}</span>
                                            </div>
                                            {/* P&L */}
                                            <div className="col-span-2 text-right">
                                                <span className="text-sm font-bold" style={{ color: isUp ? PRIMARY : 'hsl(0 90% 58%)' }}>
                                                    {isUp ? '+' : ''}{pct.toFixed(1)}%
                                                </span>
                                            </div>

                                            {/* Weight bar (full width) */}
                                            <div className="col-span-12 mt-1">
                                                <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
                                                    <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(weight, 100))}%`, background: isUp ? PRIMARY : 'hsl(0 90% 58%)' }} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                              </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl py-10 text-center" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px dashed hsl(var(--border))' }}>
                                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm text-muted-foreground">{""}<FinixUiText text={"Sin activos en este portafolio"} />{""}</p>
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
                                                <span className="text-sm font-bold text-foreground">{mv.ticker}</span>
                                                <span className="text-sm font-bold px-1.5 py-0.5 rounded uppercase"
                                                    style={{
                                                        background: isCompra ? 'hsl(158 100% 45% / 0.12)' : 'hsl(0 90% 58% / 0.12)',
                                                        color: isCompra ? PRIMARY : 'hsl(0 90% 58%)',
                                                    }}>
                                                    {mv.tipoMovimiento}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {mv.cantidad.toFixed(3)} × ${mv.precio.toFixed(2)}
                                            </p>
                                        </div>
                                        {/* Amount + date */}
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-sm font-bold" style={{ color: isCompra ? PRIMARY : 'hsl(0 90% 58%)' }}>
                                                {isCompra ? '-' : '+'}{fmt(mv.total, selected?.monedaBase)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {mv.fecha ? new Date(mv.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '—'}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="rounded-2xl py-10 text-center" style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px dashed hsl(var(--border))' }}>
                                <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm text-muted-foreground">{""}<FinixUiText text={"Sin movimientos registrados"} />{""}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Profile() {
    const { ui: finixUi } = useFinixUiTranslation();

    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, updateUser } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
    const [uploadingImage, setUploadingImage] = useState<'avatar' | 'banner' | null>(null);
    const [imageUploadError, setImageUploadError] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowSubmitting, setIsFollowSubmitting] = useState(false);
    const [connectionsOpen, setConnectionsOpen] = useState(false);
    const [connectionsType, setConnectionsType] = useState<ConnectionsListType>('followers');

    // Pinned assets state
    const [pinnedAssets, setPinnedAssets] = useState<PinnedAsset[]>([]);
    const [allPinnedTickers, setAllPinnedTickers] = useState<string[]>([]);
    const [showAssetPicker, setShowAssetPicker] = useState(false);
    const [assetSearch, setAssetSearch] = useState('');
    const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout>>();

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    }, []);

    const isOwnProfile = !!(
        (currentUser?.username && username && currentUser.username.toLowerCase() === username.toLowerCase()) ||
        (!username && currentUser) ||
        (currentUser?.id && profile?.id && currentUser.id === profile.id) ||
        (isJuanUser(currentUser) && (!username || isJuanUser({ username })))
    );

    useEffect(() => { loadProfile(); }, [username]);
    useEffect(() => {
        if (isOwnProfile) {
            void loadPinnedAssets();
            return;
        }

        setPinnedAssets([]);
        setAllPinnedTickers([]);
    }, [isOwnProfile, profile?.id]);

    /* ── Load profile ────────────────────────────── */
    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const targetUsername = username || currentUser?.username;
            if (!targetUsername) {
                if (currentUser) {
                    const fallback = buildFallback(currentUser);
                    setProfile(fallback);
                    setEditForm(fallback);
                    setIsFollowing(false);
                    if (isOwnProfile && !currentUser.username) {
                        setIsEditing(true);
                    }
                } else {
                    navigate('/auth');
                }
                setIsLoading(false);
                return;
            }
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
                if (isOwnProfile && !currentUser.username) {
                    setIsEditing(true);
                }
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
        id: u.id || '1', username: u.username || 'Usuario', email: u.email || '',
        bio: u.bio || 'Inversor de Finix', avatarUrl: u.avatarUrl,
        isInfluencer: false, isVerified: false, accountType: 'BASIC',
        isProfilePublic: true, showPortfolio: false, showStats: u.showStats ?? false, acceptingFollowers: u.acceptingFollowers ?? true,
        showExactReturns: u.showExactReturns ?? true,
        returnsVisibilityMode: u.returnsVisibilityMode || 'exact',
        _count: {
            followedBy: u._count?.followedBy || 0,
            following: u._count?.following || 0,
            posts: u._count?.posts || 0,
        },
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

            const tickers: string[] = pinned.tickers ? (Array.isArray(pinned.tickers) ? pinned.tickers : pinned.tickers.split(',')).filter(Boolean) : [];
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
        if (!assetSearch.trim()) { setSearchResults([]); setIsSearching(false); return; }
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        setIsSearching(true);
        const controller = new AbortController();
        searchTimeout.current = setTimeout(async () => {
            try {
                const res = await apiFetch(`/market/search?query=${encodeURIComponent(assetSearch)}`, { signal: controller.signal });
                if (res.ok) {
                    const data = await res.json();
                    if (controller.signal.aborted) return;
                    setSearchResults((data.quotes || data || []).slice(0, 8).map((q: any) => ({
                        symbol: q.symbol,
                        name: q.shortname || q.longname || q.symbol,
                    })));
                }
            } catch { }
            if (!controller.signal.aborted) setIsSearching(false);
        }, 350);
        return () => {
            controller.abort();
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [assetSearch]);

    const addPinnedAsset = async (ticker: string, name: string) => {
        if (allPinnedTickers.includes(ticker) || allPinnedTickers.length >= 4) return;
        const newTickers = [...allPinnedTickers, ticker];
        setAllPinnedTickers(newTickers);
        await savePinnedTickers(newTickers);

        // Add preview asset
        const newAsset: PinnedAsset = { ticker, name, price: 0, change: 0, changePercent: 0 };
        setPinnedAssets(prev => [...prev, newAsset]);
        showToast(`${ticker} agregado a tus activos destacados`);

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
        showToast(`${ticker} eliminado de tus destacados`);
    };

    /* ── Save profile ────────────────────────────── */
    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            // Whitelist only editable fields to prevent sending read-only / metadata fields (id, _count, createdAt, etc.)
            const allowedFields = [
                'username', 'title', 'bio', 'bioLong', 'avatarUrl', 'bannerUrl',
                'company', 'location', 'website', 'linkedinUrl', 'twitterUrl',
                'youtubeUrl', 'instagramUrl', 'specializations', 'certifications',
                'yearsExperience', 'isProfilePublic', 'showPortfolio', 'showStats',
                'acceptingFollowers', 'showExactReturns', 'returnsVisibilityMode'
            ];
            const payload: Record<string, any> = {};
            for (const key of allowedFields) {
                if ((editForm as any)[key] !== undefined) {
                    payload[key] = (editForm as any)[key];
                }
            }
            if (payload.yearsExperience !== undefined) {
                if (payload.yearsExperience === '' || payload.yearsExperience === null) {
                    delete payload.yearsExperience;
                } else {
                    const num = Number(payload.yearsExperience);
                    if (!isNaN(num)) {
                        payload.yearsExperience = num;
                    } else {
                        delete payload.yearsExperience;
                    }
                }
            }

            const res = await apiFetch('/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                const errMsg = Array.isArray(data?.message) ? data.message.join(', ') : (data?.message || 'Error al guardar el perfil');
                throw new Error(errMsg);
            }
            const updated = await res.json();
            setProfile(updated);
            setEditForm(updated);
            setIsEditing(false);
            updateUser({
                username: updated.username,
                bio: updated.bio,
                avatarUrl: updated.avatarUrl,
            });
            showToast('Perfil actualizado correctamente');
            if (updated.username && updated.username !== username) {
                navigate(`/profile/${encodeURIComponent(updated.username)}`, { replace: true });
            }
        } catch (error: any) {
            showToast(error.message || 'No se pudo actualizar el perfil', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleShareProfile = async () => {
        try {
            const targetUser = profile?.username || currentUser?.username || '';
            const profileUrl = `${window.location.origin}/profile/${encodeURIComponent(targetUser)}`;
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(profileUrl);
                showToast('Enlace de perfil copiado al portapapeles');
            } else {
                showToast(profileUrl);
            }
        } catch {
            showToast('No se pudo copiar el enlace', 'error');
        }
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
                        showToast('Foto de perfil actualizada correctamente');
                    } else {
                        (updateUser as (patch: any) => void)({ bannerUrl: nextUrl });
                        showToast('Banner actualizado correctamente');
                    }
                } catch (error: any) {
                    const msg = error?.message || `No se pudo subir el ${type === 'avatar' ? 'avatar' : 'banner'}`;
                    setImageUploadError(msg);
                    showToast(msg, 'error');
                } finally {
                    setUploadingImage(null);
                }
            }
        };
        input.click();
    };

    const parseJsonArray = (str?: string | string[]): string[] => {
        if (!str) return [];
        if (Array.isArray(str)) return str;
        try { return JSON.parse(str); } catch { return typeof str === 'string' ? str.split(',').filter(Boolean) : []; }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center flex-1 bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: PRIMARY, borderTopColor: 'transparent' }} />
                    <p className="text-sm" style={{ color: PRIMARY }}>{""}<FinixUiText text={"Cargando perfil..."} />{""}</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 gap-4">
                <User className="w-16 h-16 text-gray-600" />
                <h2 className="text-xl font-bold text-white">{""}<FinixUiText text={"Perfil no encontrado"} />{""}</h2>
                <button onClick={() => navigate('/dashboard')} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: PRIMARY_DIM, color: PRIMARY, border: `1px solid ${PRIMARY_BRD}` }}>
                    {" "}<FinixUiText text={"Volver al inicio"} />{" "}</button>
            </div>
        );
    }

    const specializations = parseJsonArray(profile.specializations);
    const certifications = parseJsonArray(profile.certifications);

    return (
        <div className="profile-page mx-auto flex-1 w-full min-w-0 max-w-none px-3 sm:px-4 lg:px-5 py-0 text-foreground relative space-y-6">
            {/* Toast feedback */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.95 }}
                        className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl text-xs font-semibold backdrop-blur-md ${
                            toast.type === 'error'
                                ? 'bg-red-500/15 border-red-500/30 text-red-300'
                                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        }`}
                    >
                        {toast.type === 'error' ? (
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        )}
                        <span>{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── HERO PROFILE CARD (TWITTER / INSTAGRAM REDESIGN) ── */}
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xs transition-colors">
                {/* ── BANNER (3:1 Panoramic Twitter/IG style) ── */}
                <div className="w-full h-44 sm:h-52 md:h-64 relative overflow-hidden bg-slate-950 select-none">
                    {profile.bannerUrl ? (
                        <>
                            <img
                                src={resolveMediaUrl(profile.bannerUrl)}
                                alt={`Banner de ${profile.username}`}
                                className="w-full h-full object-cover"
                                onError={(event) => { event.currentTarget.style.display = 'none'; }}
                            />
                            <div
                                className="absolute inset-0"
                                style={{ background: 'linear-gradient(to bottom, transparent 50%, hsl(var(--card) / 0.85) 100%)' }}
                            />
                        </>
                    ) : (
                        <div className="w-full h-full relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#06241c] to-slate-900">
                            {/* Subtle financial mesh grid */}
                            <div
                                className="absolute inset-0 opacity-15"
                                style={{
                                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                                    backgroundSize: '20px 20px',
                                }}
                            />
                            {/* Radiant ambient glow */}
                            <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
                            <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
                            {/* Vignette fade */}
                            <div
                                className="absolute inset-0"
                                style={{ background: 'linear-gradient(to bottom, transparent 50%, hsl(var(--card) / 0.85) 100%)' }}
                            />
                        </div>
                    )}

                    {isOwnProfile && (
                        <button
                            type="button"
                            onClick={() => handleUploadImage('banner')}
                            disabled={uploadingImage === 'banner'}
                            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md bg-black/40 border border-white/20 text-white hover:bg-black/60"
                            title={finixUi("Cambiar imagen de banner")}
                        >
                            {uploadingImage === 'banner' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <Camera className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">{uploadingImage === 'banner' ? 'Subiendo...' : 'Editar portada'}</span>
                        </button>
                    )}
                    {profile.bannerUrl && (
                        <ImagePreviewButton
                            src={resolveMediaUrl(profile.bannerUrl)}
                            alt={`Banner de ${profile.username}`}
                            label="Ver portada completa"
                            className="absolute top-12 sm:top-14 right-3 sm:right-4 z-20"
                        />
                    )}
                </div>

                {/* ── AVATAR + ACTION BUTTONS ROW (Twitter/IG Inline Level) ── */}
                <div className="px-4 sm:px-6 md:px-8 relative -mt-14 sm:-mt-16 md:-mt-18 flex items-end justify-between gap-3 pb-1">
                    {/* Avatar */}
                    <div className="relative z-10 shrink-0">
                        <div
                            className={cn(
                                "relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full border-4 overflow-hidden flex items-center justify-center text-3xl font-black group shadow-xl",
                                isOwnProfile && "cursor-pointer"
                            )}
                            onClick={() => {
                                if (isOwnProfile && uploadingImage !== 'avatar') {
                                    handleUploadImage('avatar');
                                }
                            }}
                            style={{
                                borderColor: 'hsl(var(--card))',
                                background: 'linear-gradient(135deg, hsl(158 100% 45%) 0%, hsl(158 100% 25%) 100%)',
                                color: '#060a07',
                                boxShadow: `0 8px 30px hsl(158 100% 45% / 0.25)`,
                            }}
                            title={isOwnProfile ? "Clic para cambiar foto de perfil" : undefined}
                        >
                            {(profile.username && profile.username.length > 0) ? profile.username[0].toUpperCase() : 'U'}
                            {profile.avatarUrl && (
                                <img
                                    src={resolveMediaUrl(profile.avatarUrl)}
                                    alt={profile.username || 'Usuario'}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={(event) => { event.currentTarget.style.display = 'none'; }}
                                />
                            )}
                            {isOwnProfile && (
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 z-20 text-white text-[11px] font-bold">
                                    {uploadingImage === 'avatar' ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Camera className="w-5 h-5" />
                                            <span><FinixUiText text={"Cambiar"} /></span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Camera quick button for owner */}
                        {isOwnProfile && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUploadImage('avatar');
                                }}
                                disabled={uploadingImage === 'avatar'}
                                className="absolute bottom-1 right-1 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer z-30 bg-emerald-600 text-white border-2 border-card"
                                title={finixUi("Cambiar foto de perfil")}
                            >
                                {uploadingImage === 'avatar' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                            </button>
                        )}
                    </div>

                    {/* Action buttons (Twitter/IG style) */}
                    <div className="flex items-center gap-2 pb-1">
                        {isOwnProfile ? (
                            isEditing ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditForm(profile || {});
                                        }}
                                        disabled={isSavingProfile}
                                        className="h-9 px-4 rounded-full text-xs font-semibold border border-border/80 bg-background hover:bg-muted text-foreground transition-all cursor-pointer shadow-2xs"
                                    >
                                        <FinixUiText text={"Cancelar"} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveProfile}
                                        disabled={isSavingProfile}
                                        className="h-9 px-5 rounded-full text-xs font-bold cursor-pointer disabled:opacity-75 transition-all hover:scale-105 active:scale-95 shadow-xs bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5"
                                    >
                                        {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                        <span>{isSavingProfile ? 'Guardando...' : 'Guardar'}</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="h-9 px-4 sm:px-5 rounded-full text-xs sm:text-sm font-bold border border-border/80 bg-background hover:bg-muted/70 text-foreground transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center gap-1.5"
                                    >
                                        <Edit className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span><FinixUiText text={"Editar perfil"} /></span>
                                    </button>
                                    <button
                                        onClick={() => navigate('/settings')}
                                        className="w-9 h-9 rounded-full border border-border/80 bg-background hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                                        title={finixUi("Ir a Configuración")}
                                    >
                                        <SettingsIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleShareProfile}
                                        className="w-9 h-9 rounded-full border border-border/80 bg-background hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                                        title={finixUi("Compartir perfil")}
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </>
                            )
                        ) : (
                            <>
                                <button
                                    onClick={handleToggleFollow}
                                    disabled={isFollowSubmitting}
                                    className={cn(
                                        "h-9 px-5 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs cursor-pointer flex items-center gap-1.5",
                                        isFollowing
                                            ? "border border-border/80 bg-muted/60 text-foreground hover:bg-muted"
                                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                                    )}
                                >
                                    {isFollowSubmitting ? (
                                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> <FinixUiText text={"Guardando"} /></>
                                    ) : isFollowing ? (
                                        <><Check className="w-3.5 h-3.5" /> <FinixUiText text={"Siguiendo"} /></>
                                    ) : (
                                        <><UserPlus className="w-3.5 h-3.5" /> <FinixUiText text={"Seguir"} /></>
                                    )}
                                </button>
                                <button
                                    onClick={handleShareProfile}
                                    className="w-9 h-9 rounded-full border border-border/80 bg-background hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                                    title={finixUi("Compartir perfil")}
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className="w-9 h-9 rounded-full border border-border/80 bg-background hover:bg-muted/70 text-rose-500 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                                    title={finixUi("Reportar usuario")}
                                >
                                    <Flag className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {showReportModal && profile && (
                    <ReportModal
                        isOpen={true}
                        targetId={profile.id}
                        targetType="USER"
                        targetPreview={`Perfil: @${profile.username} - ${profile.bio?.slice(0, 50) || 'Sin biografía'}`}
                        onClose={() => setShowReportModal(false)}
                    />
                )}

                {/* ── PROFILE INFO ──────────────────────────────── */}
                <div className="px-5 sm:px-8 mt-3 pb-6">
                    {imageUploadError ? (
                        <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                            {imageUploadError}
                        </div>
                    ) : null}

                    {isEditing && (
                        <div className="mb-4 p-3.5 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/40 flex items-center justify-center shrink-0 bg-secondary/50 font-bold">
                                    {profile.avatarUrl ? (
                                        <img src={resolveMediaUrl(profile.avatarUrl)} alt={finixUi("Avatar")} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-sm text-primary">{(profile.username || 'U')[0].toUpperCase()}</span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground"><FinixUiText text={"Foto de perfil"} /></p>
                                    <p className="text-[11px] text-muted-foreground"><FinixUiText text={"Tu imagen pública visible para toda la comunidad"} /></p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleUploadImage('avatar')}
                                disabled={uploadingImage === 'avatar'}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer shadow-2xs"
                            >
                                {uploadingImage === 'avatar' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                <span>{uploadingImage === 'avatar' ? 'Subiendo...' : 'Cambiar foto de perfil'}</span>
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col gap-1 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            {isEditing ? (
                                <Input
                                    value={editForm.username || ''}
                                    onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                                    className="text-2xl font-black max-w-xs bg-transparent border-border text-foreground"
                                />
                            ) : (
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{profile.username}</h1>
                            )}
                            {profile.isVerified && (
                                <VerifiedBadge isVerified={profile.isVerified} isInfluencer={profile.isInfluencer} username={profile.username} size="md" />
                            )}
                            {profile.isInfluencer && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'hsl(47 100% 50% / 0.15)', color: '#fbbf24', border: '1px solid hsl(47 100% 50% / 0.25)' }}>
                                    <Award className="w-3 h-3 inline mr-1" /><FinixUiText text={"Influencer"} />
                                </span>
                            )}
                            <InvestorStreakPill />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium">@{profile.username}</p>
                    </div>

                    {isEditing ? (
                        <Input
                            value={editForm.title || ''}
                            placeholder={finixUi("ej: Value Investor & Macro Strategist")}
                            onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                            className="mb-2 bg-transparent border-border text-foreground text-sm"
                        />
                    ) : profile.title && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2 w-fit">
                            <Briefcase className="w-3 h-3" />
                            <span>{profile.title}</span>
                        </div>
                    )}

                    {isEditing ? (
                        <Textarea
                            value={editForm.bio || ''}
                            placeholder={finixUi("Contá algo sobre vos...")}
                            onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                            rows={2}
                            className="mb-3 bg-transparent border-border text-foreground text-sm"
                        />
                    ) : profile.bio && (
                        <p className="text-sm sm:text-[14.5px] mb-3 leading-relaxed text-foreground/90 max-w-2xl whitespace-pre-line">
                            {profile.bio}
                        </p>
                    )}

                    {/* Meta info row (Twitter / Instagram style) */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-3">
                        {profile.location && (
                            <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                {profile.location}
                            </span>
                        )}
                        {profile.company && (
                            <span className="inline-flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                                {profile.company}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <FinixUiText text={"Se unió en"} /> {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : 'recientemente'}
                        </span>
                        {profile.website && (
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
                                <Globe className="w-3.5 h-3.5" />
                                {profile.website.replace(/^https?:\/\//, '')}
                            </a>
                        )}
                    </div>

                    {/* Social links */}
                    {[
                        { url: profile.linkedinUrl, Icon: Linkedin, title: 'LinkedIn' },
                        { url: profile.twitterUrl, Icon: Twitter, title: 'Twitter' },
                        { url: profile.youtubeUrl, Icon: Youtube, title: 'YouTube' },
                        { url: profile.instagramUrl, Icon: Instagram, title: 'Instagram' },
                    ].some(s => s.url) && (
                        <div className="flex items-center gap-2 mb-3">
                            {[
                                { url: profile.linkedinUrl, Icon: Linkedin, title: 'LinkedIn' },
                                { url: profile.twitterUrl, Icon: Twitter, title: 'Twitter' },
                                { url: profile.youtubeUrl, Icon: Youtube, title: 'YouTube' },
                                { url: profile.instagramUrl, Icon: Instagram, title: 'Instagram' },
                            ].filter(s => s.url).map(({ url, Icon, title }, i) => (
                                <a key={i} href={url!} target="_blank" rel="noopener noreferrer"
                                    title={title}
                                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-muted/60 hover:bg-muted border border-border/80 text-muted-foreground hover:text-foreground">
                                    <Icon className="w-3.5 h-3.5" />
                                </a>
                            ))}
                        </div>
                    )}

                    {/* ── STATS ROW (Twitter / Instagram style) ── */}
                    <div className="flex flex-wrap items-center gap-5 sm:gap-7 py-3 my-2 border-y border-border/60 text-sm">
                        <button
                            type="button"
                            onClick={() => {
                                setConnectionsType('following');
                                setConnectionsOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer group text-left"
                            aria-label={`Ver la lista de siguiendo de @${profile.username}`}
                        >
                            <span className="font-extrabold text-foreground group-hover:text-primary transition-colors">
                                {profile._count?.following?.toLocaleString('es-AR') ?? (profile.isProfilePublic ? '0' : '—')}
                            </span>
                            <span className="text-muted-foreground text-xs sm:text-sm">Siguiendo</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setConnectionsType('followers');
                                setConnectionsOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer group text-left"
                            aria-label={`Ver la lista de seguidores de @${profile.username}`}
                        >
                            <span className="font-extrabold text-foreground group-hover:text-primary transition-colors">
                                {profile._count?.followedBy?.toLocaleString('es-AR') ?? (profile.isProfilePublic ? '0' : '—')}
                            </span>
                            <span className="text-muted-foreground text-xs sm:text-sm">Seguidores</span>
                        </button>

                        {typeof profile.totalReturn === 'number' && Number.isFinite(profile.totalReturn) && (
                            <div className="sm:ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors"
                                 style={{
                                     background: profile.totalReturn >= 0 ? 'hsl(158 100% 45% / 0.1)' : 'hsl(0 90% 58% / 0.1)',
                                     borderColor: profile.totalReturn >= 0 ? 'hsl(158 100% 45% / 0.25)' : 'hsl(0 90% 58% / 0.25)',
                                     color: profile.totalReturn >= 0 ? 'hsl(158 100% 40%)' : 'hsl(0 90% 58%)'
                                 }}
                            >
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>Rendimiento: <strong>{formatSignedPercentage(profile.totalReturn, 1)}</strong></span>
                            </div>
                        )}
                    </div>

                    {(profile.bioLong || profile.yearsExperience || specializations.length > 0 || certifications.length > 0) && (
                        <div className="space-y-3 my-4 p-3.5 rounded-xl bg-muted/20 border border-border/60">
                            {profile.bioLong && (
                                <div>
                                    <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1"><FinixUiText text={"Sobre el perfil"} /></p>
                                    <p className="text-xs sm:text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{profile.bioLong}</p>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                {profile.yearsExperience !== undefined && profile.yearsExperience !== null && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted border border-border/80 text-foreground">
                                        <Award className="w-3.5 h-3.5 text-primary" />
                                        {profile.yearsExperience} <FinixUiText text={"años de experiencia"} />
                                    </span>
                                )}

                                {specializations.map((item) => (
                                    <span
                                        key={item}
                                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    >
                                        {item}
                                    </span>
                                ))}

                                {certifications.map((item) => (
                                    <span
                                        key={item}
                                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted border border-border/80 text-foreground"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── ACTIVOS DESTACADOS (INSTAGRAM STORY HIGHLIGHTS STYLE) ── */}
                    <div className="mt-4 mb-2">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Star className="w-3.5 h-3.5 text-amber-500" />
                                    <FinixUiText text={"Activos Destacados"} />
                                </h3>
                                <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-muted font-bold text-muted-foreground">
                                    {pinnedAssets.length}/4
                                </span>
                            </div>
                            {isOwnProfile && allPinnedTickers.length < 4 && pinnedAssets.length > 0 && (
                                <button
                                    onClick={() => setShowAssetPicker(true)}
                                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" /> <FinixUiText text={"Agregar"} />
                                </button>
                            )}
                        </div>

                        {pinnedAssets.length === 0 ? (
                            <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border/80 bg-muted/15">
                                {isOwnProfile ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setShowAssetPicker(true)}
                                            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
                                        >
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-border group-hover:border-primary group-hover:bg-primary/10 flex items-center justify-center transition-all">
                                                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground">Agregar</span>
                                        </button>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-bold text-foreground">Destacá tus activos favoritos</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Mostrá en tu perfil las acciones, CEDEARs o bonos que seguís o tenés en cartera.</p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">El usuario aún no seleccionó activos destacados.</p>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none">
                                {pinnedAssets.map((asset) => {
                                    const isUp = asset.changePercent >= 0;
                                    return (
                                        <div
                                            key={asset.ticker}
                                            className="flex flex-col items-center gap-1.5 shrink-0 group relative cursor-pointer"
                                        >
                                            {/* Instagram Story Gradient Ring */}
                                            <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 shadow-xs group-hover:scale-105 transition-transform duration-200">
                                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-card p-1 flex items-center justify-center overflow-hidden border border-background">
                                                    <SymbolLogo symbol={asset.ticker} size={32} />
                                                </div>
                                                {isOwnProfile && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removePinnedAsset(asset.ticker);
                                                        }}
                                                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-rose-600 cursor-pointer z-10"
                                                        title="Quitar activo"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-black text-foreground tracking-tight">${asset.ticker}</p>
                                                <p className={cn(
                                                    "text-[10px] font-bold",
                                                    isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                                )}>
                                                    {isUp ? '+' : ''}{(asset.changePercent ?? 0).toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                {isOwnProfile && allPinnedTickers.length < 4 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAssetPicker(true)}
                                        className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
                                    >
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-border group-hover:border-primary group-hover:bg-primary/10 flex items-center justify-center transition-all">
                                            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground">Nuevo</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── PORTFOLIO & PERFORMANCE SECTION ──────────────────────── */}
            <div className="rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xs overflow-hidden transition-colors">
                <div className="p-5 sm:p-8">
                    <ProfilePortfolioSection
                        profileUserId={profile.id}
                        isOwnProfile={isOwnProfile}
                        showPortfolio={profile.showPortfolio}
                        totalReturn={profile.totalReturn}
                        winRate={profile.winRate}
                        riskScore={profile.riskScore}
                        showStats={profile.showStats}
                        showExactReturns={profile.showExactReturns}
                        returnsVisibilityMode={profile.returnsVisibilityMode}
                    />

                    {/* ── EDIT FORM (about tab when editing) ───── */}
                    {isEditing && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 rounded-2xl p-5 space-y-4"
                            style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border))' }}
                        >
                            <h3 className="font-bold text-foreground mb-4">{""}<FinixUiText text={"Editar información"} />{""}</h3>
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
                                <label className="text-xs font-semibold mb-1 block text-gray-500 uppercase tracking-wider">{""}<FinixUiText text={"Bio extendida"} />{""}</label>
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
                                    <h3 className="font-bold text-foreground">{""}<FinixUiText text={"Elegir activo destacado"} />{""}</h3>
                                    <button onClick={() => { setShowAssetPicker(false); setAssetSearch(''); }}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-secondary">
                                        <X className="w-3.5 h-3.5 text-gray-400" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mb-3">{4 - allPinnedTickers.length} {" "}<FinixUiText text={"lugar(es) disponible(s)"} />{""}</p>

                                <div className="flex items-center gap-2 px-3 rounded-xl mb-4 bg-secondary border border-border">
                                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder={finixUi("Buscar símbolo o empresa...")}
                                        value={assetSearch}
                                        onChange={e => setAssetSearch(e.target.value)}
                                        className="flex-1 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                                    />
                                    {isSearching && <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: PRIMARY, borderTopColor: 'transparent' }} />}
                                </div>

                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                    {searchResults.length > 0 ? searchResults.map((r) => {
                                        const info = resolveAssetInfo(r.symbol);
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
                                                    <SymbolLogo symbol={info.ticker} size={32} />
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">
                                                            {info.exchange ? `${info.exchange}:${info.ticker}` : info.ticker}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate max-w-[240px]">{info.displayName}</p>
                                                    </div>
                                                </div>
                                                {already ? <Check className="w-4 h-4 text-gray-600" /> : <Plus className="w-4 h-4 text-gray-500" />}
                                            </button>
                                        );
                                    }) : assetSearch.length > 0 && !isSearching ? (
                                        <p className="text-center py-8 text-sm text-gray-600">{""}<FinixUiText text={"Sin resultados para \""} />{""}{assetSearch}"</p>
                                    ) : assetSearch.length === 0 ? (
                                        <div className="py-6 text-center">
                                            <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs text-gray-600">{""}<FinixUiText text={"Escribí para buscar acciones, cryptos, ETFs..."} />{""}</p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <UserConnectionsDialog
                open={connectionsOpen}
                username={profile.username}
                listType={connectionsType}
                counts={{ followers: profile._count?.followedBy, following: profile._count?.following }}
                onListTypeChange={setConnectionsType}
                onOpenChange={setConnectionsOpen}
            />
        </div >
    );
}
