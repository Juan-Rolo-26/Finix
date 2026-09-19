import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    ArrowLeft,
    RefreshCw,
    Search,
    ExternalLink,
    Loader2,
    BarChart3,
    Activity,
    Layers,
    X,
    ArrowUpDown,
    Lock,
    Crown,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { AssetLogoImg } from '@/components/TopGainersCard';
import { useAuthStore, isCreatorUser, isJuanUser } from '@/stores/authStore';

interface RankingItem {
    rank: number;
    ticker: string;
    companyName: string;
    price: number;
    previousClose: number;
    change: number;
    changePercent: number;
    volume: number;
    logoUrl: string;
    timestamp: string;
    isLocked?: boolean;
}

type SortField = 'change' | 'volume' | 'price';

export default function TopGainersPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const hasPaidRankingAccess = Boolean(
        ((user as any)?.plan === 'PRO' && (user as any)?.subscriptionStatus === 'ACTIVE') ||
        isCreatorUser(user) ||
        (user as any)?.role === 'ADMIN' ||
        isJuanUser(user)
    );

    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('tab') === 'losers' ? 'TOP_LOSERS' : 'TOP_GAINERS';
    const isLosers = currentTab === 'TOP_LOSERS';

    const [items, setItems] = useState<RankingItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);
    const [selectedLimit, setSelectedLimit] = useState<number>(hasPaidRankingAccess ? 50 : 5);
    const [date, setDate] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isStale, setIsStale] = useState<boolean>(false);
    const [sortBy, setSortBy] = useState<SortField>('change');

    const loadData = async (limitNum: number = selectedLimit, selectedDate?: string, forceRefresh: boolean = false) => {
        setIsLoading(true);
        setIsError(false);
        try {
            const queryParams = new URLSearchParams({
                type: currentTab,
                limit: String(limitNum),
            });
            if (selectedDate) queryParams.set('date', selectedDate);
            if (forceRefresh) queryParams.set('refresh', 'true');

            const res = await apiFetch(`/market/rankings?${queryParams.toString()}`);
            if (!res.ok) throw new Error('Error al cargar rankings');
            const data = await res.json();
            setItems(Array.isArray(data.items) ? data.items : []);
            setDate(data.date || '');
            setIsStale(Boolean(data.isStale));
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData(selectedLimit);
    }, [selectedLimit, currentTab]);

    // Computed summary stats for the KPI cards (using unlocked/visible items for free users)
    const statsItems = useMemo(() => {
        if (hasPaidRankingAccess) return items;
        return items.filter(it => it.rank <= 5 && !it.isLocked);
    }, [items, hasPaidRankingAccess]);

    const stats = useMemo(() => {
        if (!statsItems.length) return null;
        const leader = statsItems[0];
        const avgChange = statsItems.reduce((acc, it) => acc + (it.changePercent || 0), 0) / statsItems.length;
        const topVol = [...statsItems].sort((a, b) => (b.volume || 0) - (a.volume || 0))[0];
        const maxAbsChange = Math.max(...statsItems.map(it => Math.abs(it.changePercent || 0)), 1);

        return {
            leader,
            avgChange,
            topVol,
            maxAbsChange,
            totalCount: statsItems.length,
        };
    }, [statsItems]);

    // Filter and Sort
    const processedItems = useMemo(() => {
        const filtered = items.filter(item => {
            if (item.isLocked) return true;
            return (
                item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.companyName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        });

        return [...filtered].sort((a, b) => {
            // Keep locked items ordered by rank
            if (a.isLocked || b.isLocked) return a.rank - b.rank;
            if (sortBy === 'volume') return b.volume - a.volume;
            if (sortBy === 'price') return b.price - a.price;
            return Math.abs(b.changePercent) - Math.abs(a.changePercent);
        });
    }, [items, searchQuery, sortBy]);

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            {/* ── Top Header / Sticky Bar ── */}
            <div className="border-b border-border/40 bg-card/60 backdrop-blur-md sticky top-0 z-30 shadow-xs">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            title="Volver"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                    {isLosers ? (
                                        <TrendingDown className="w-5 h-5 text-rose-500" />
                                    ) : (
                                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                                    )}
                                    {isLosers ? 'Peores rendimientos' : 'Mejores rendimientos'}
                                </h1>
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${isLosers
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                    S&P 500
                                </span>
                            </div>
                            <p className="text-[12px] text-muted-foreground mt-0.5">
                                {isLosers
                                    ? 'Acciones con mayor retroceso porcentual diario del índice S&P 500.'
                                    : 'Acciones con mayor avance porcentual diario del índice S&P 500.'}
                                {date && <span className="ml-1.5 font-semibold text-foreground">· Fecha: {date}</span>}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {/* Selector de Tipo: Ganadores vs Perdedores */}
                        <div className="flex items-center bg-secondary/60 p-1 rounded-xl border border-border/40 text-xs font-semibold">
                            <button
                                onClick={() => setSearchParams({})}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${!isLosers
                                    ? 'bg-card text-emerald-400 shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <TrendingUp className="w-3.5 h-3.5" />
                                Mejores
                            </button>
                            <button
                                onClick={() => setSearchParams({ tab: 'losers' })}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${isLosers
                                    ? 'bg-card text-rose-400 shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <TrendingDown className="w-3.5 h-3.5" />
                                Peores
                            </button>
                        </div>

                        {/* Selector de Top limit */}
                        <div className="flex items-center bg-secondary/60 p-1 rounded-xl border border-border/40 text-xs font-semibold">
                            {[5, 10, 25, 50].map(limit => (
                                <button
                                    key={limit}
                                    onClick={() => setSelectedLimit(limit)}
                                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${selectedLimit === limit
                                        ? 'bg-card text-foreground shadow-xs font-bold'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <span>TOP {limit}</span>
                                    {limit > 5 && !hasPaidRankingAccess && (
                                        <span className="text-[9px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 inline-flex items-center gap-0.5">
                                            <Crown className="w-2.5 h-2.5" /> PRO
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Botón refrescar con forceRefresh */}
                        <button
                            onClick={() => loadData(selectedLimit, date, true)}
                            disabled={isLoading}
                            className="p-2.5 rounded-xl bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border/40 disabled:opacity-50"
                            title="Refrescar datos en tiempo real"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Container ── */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

                {/* ── Top Summary KPI Cards (Fintech Terminal Header) ── */}
                {stats && !isLoading && !isError && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Líder */}
                        <div className="bg-card/70 border border-border/50 rounded-2xl p-4.5 backdrop-blur-xs flex items-center justify-between gap-3 shadow-xs">
                            <div className="space-y-1 min-w-0">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                    {isLosers ? 'Mayor Caída' : 'Mayor Suba'}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black text-foreground truncate">{stats.leader.ticker}</span>
                                    <span className={`inline-flex items-center gap-0.5 text-xs font-black px-1.5 py-0.5 rounded-md ${isLosers ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                        {stats.leader.changePercent >= 0 ? '+' : ''}{stats.leader.changePercent.toFixed(2)}%
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground/80 truncate">{stats.leader.companyName}</p>
                            </div>
                            <div className="flex-shrink-0">
                                <AssetLogoImg src={stats.leader.logoUrl} ticker={stats.leader.ticker} name={stats.leader.companyName} />
                            </div>
                        </div>

                        {/* 2. Rendimiento Promedio */}
                        <div className="bg-card/70 border border-border/50 rounded-2xl p-4.5 backdrop-blur-xs flex items-center justify-between gap-3 shadow-xs">
                            <div className="space-y-1">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                    Promedio TOP {stats.totalCount}
                                </span>
                                <div className="text-xl font-black num flex items-center gap-1.5">
                                    <span className={stats.avgChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                        {stats.avgChange >= 0 ? '+' : ''}{stats.avgChange.toFixed(2)}%
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground/80">Rendimiento ponderado del grupo</p>
                            </div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white dark:bg-zinc-900 border border-black/30 dark:border-white/35 ${isLosers ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'} shadow-2xs`}>
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>

                        {/* 3. Mayor Volumen */}
                        <div className="bg-card/70 border border-border/50 rounded-2xl p-4.5 backdrop-blur-xs flex items-center justify-between gap-3 shadow-xs">
                            <div className="space-y-1 min-w-0">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                    Mayor Volumen
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black text-foreground truncate">{stats.topVol?.ticker || 'N/A'}</span>
                                    <span className="text-xs font-bold text-muted-foreground num">
                                        {stats.topVol?.volume >= 1_000_000
                                            ? `${(stats.topVol.volume / 1_000_000).toFixed(1)}M`
                                            : `${(stats.topVol.volume / 1_000).toFixed(1)}K`}
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground/80 truncate">Acciones negociadas hoy</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-black/30 dark:border-white/35 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-2xs">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                        </div>

                        {/* 4. Mercado / S&P 500 Info */}
                        <div className="bg-card/70 border border-border/50 rounded-2xl p-4.5 backdrop-blur-xs flex items-center justify-between gap-3 shadow-xs">
                            <div className="space-y-1">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                    Universo S&P 500
                                </span>
                                <div className="text-base font-bold text-foreground flex items-center gap-2">
                                    <span>503 activos</span>
                                    {isStale && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                                            Cierre
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-muted-foreground/80">
                                    {date ? `Jornada del ${date}` : 'Datos oficiales en tiempo real'}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-black/30 dark:border-white/35 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-2xs">
                                <Layers className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Toolbar: Search + Sort + Stats ── */}
                <div className="bg-card/60 border border-border/50 rounded-2xl p-3 sm:p-4 backdrop-blur-xs flex flex-col md:flex-row gap-3 items-center justify-between">
                    {/* Search bar */}
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por ticker o nombre de empresa..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 text-sm bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground/60 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Controls & Counts */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
                        {/* Sort Selector */}
                        <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-xl border border-border/40 text-xs font-semibold">
                            <span className="text-[11px] text-muted-foreground px-2 flex items-center gap-1">
                                <ArrowUpDown className="w-3 h-3" /> Ordenar:
                            </span>
                            <button
                                onClick={() => setSortBy('change')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${sortBy === 'change' ? 'bg-card text-foreground font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                % Cambio
                            </button>
                            <button
                                onClick={() => setSortBy('volume')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${sortBy === 'volume' ? 'bg-card text-foreground font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Volumen
                            </button>
                            <button
                                onClick={() => setSortBy('price')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${sortBy === 'price' ? 'bg-card text-foreground font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Precio
                            </button>
                        </div>

                        {/* Counter */}
                        <div className="text-xs text-muted-foreground font-medium pl-1">
                            Mostrando <strong className="text-foreground">{processedItems.length}</strong> de {items.length} activos
                        </div>
                    </div>
                </div>

                {/* ── Content: Table or Loading ── */}
                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center space-y-3 bg-card/40 rounded-2xl border border-border/40">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">Obteniendo rankings del S&P 500...</p>
                    </div>
                ) : isError ? (
                    <div className="py-20 text-center space-y-3 bg-card border border-border/50 rounded-2xl p-6">
                        <p className="text-sm font-medium text-destructive">No pudimos conectar con los rankings en este momento.</p>
                        <button
                            onClick={() => loadData(selectedLimit)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:opacity-90 transition-opacity"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : processedItems.length === 0 ? (
                    <div className="py-20 text-center bg-card border border-border/50 rounded-2xl p-6">
                        <p className="text-sm font-medium text-muted-foreground">No se encontraron activos que coincidan con la búsqueda.</p>
                    </div>
                ) : (
                    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse table-auto">
                                <thead>
                                    <tr className="border-b border-border/40 text-[11.5px] font-bold text-muted-foreground/70 uppercase tracking-wider bg-secondary/20">
                                        <th className="py-3.5 px-4 w-14 text-center">#</th>
                                        <th className="py-3.5 px-4 min-w-[240px]">Activo</th>
                                        <th className="py-3.5 px-4 text-right min-w-[120px]">Precio</th>
                                        <th className="py-3.5 px-4 text-right min-w-[120px]">Cierre Prev.</th>
                                        <th className="py-3.5 px-4 text-right min-w-[160px]">Cambio</th>
                                        <th className="py-3.5 px-4 text-right min-w-[120px]">Volumen</th>
                                        <th className="py-3.5 px-4 text-center w-20">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20 text-sm">
                                    {processedItems.map(item => {
                                         const isItemLocked = item.isLocked || (!hasPaidRankingAccess && item.rank > 5);

                                         if (isItemLocked) {
                                             const showBannerAbove = !hasPaidRankingAccess && item.rank === 6;
                                             return (
                                                 <React.Fragment key={`locked-row-${item.rank}`}>
                                                     {showBannerAbove && (
                                                         <tr className="bg-gradient-to-r from-emerald-500/10 via-card to-emerald-500/10 border-y-2 border-emerald-500/30">
                                                             <td colSpan={7} className="py-7 px-4 text-center">
                                                                 <div className="max-w-xl mx-auto flex flex-col items-center gap-3">
                                                                     <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                                                                         <Crown className="w-6 h-6" />
                                                                     </div>
                                                                     <div>
                                                                         <h3 className="text-base sm:text-lg font-black text-foreground">
                                                                             Posiciones 6 a {selectedLimit} exclusivas para Finix PRO
                                                                         </h3>
                                                                         <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-lg leading-relaxed">
                                                                             El Top 5 de ganadores y perdedores es 100% gratuito. Desbloqueá el ranking completo ampliado (hasta 50 activos), métricas avanzadas y análisis en tiempo real con tu membresía PRO.
                                                                         </p>
                                                                     </div>
                                                                     <button
                                                                         onClick={() => navigate('/pro')}
                                                                         className="mt-2 flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 active:scale-[0.98] transition-all"
                                                                         style={{
                                                                             background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                                                             color: '#ffffff',
                                                                         }}
                                                                     >
                                                                         <Crown className="w-4 h-4 text-amber-300" />
                                                                         <span>Activar Finix PRO — Desbloquear Todo</span>
                                                                     </button>
                                                                 </div>
                                                             </td>
                                                         </tr>
                                                     )}
                                                     <tr
                                                         className="opacity-60 select-none hover:bg-muted/5 transition-colors cursor-pointer"
                                                         onClick={() => navigate('/pro')}
                                                     >
                                                         <td className="py-4 px-4 text-center">
                                                             <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-lg text-muted-foreground/60">
                                                                 {item.rank}
                                                             </span>
                                                         </td>
                                                         <td className="py-4 px-4">
                                                             <div className="flex items-center gap-3">
                                                                 <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                                                                     <Lock className="w-3.5 h-3.5 text-muted-foreground/80" />
                                                                 </div>
                                                                 <div>
                                                                     <span className="font-bold text-foreground filter blur-xs">TICKER</span>
                                                                     <p className="text-xs text-muted-foreground/60">Exclusivo PRO</p>
                                                                 </div>
                                                             </div>
                                                         </td>
                                                         <td className="py-4 px-4 text-right text-muted-foreground/60 filter blur-xs font-mono">
                                                             $***.**
                                                         </td>
                                                         <td className="py-4 px-4 text-right text-muted-foreground/60 filter blur-xs font-mono">
                                                             $***.**
                                                         </td>
                                                         <td className="py-4 px-4 text-right">
                                                             <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold text-muted-foreground bg-muted/40 filter blur-xs">
                                                                 +*.**%
                                                             </span>
                                                         </td>
                                                         <td className="py-4 px-4 text-right text-muted-foreground/60 filter blur-xs font-mono">
                                                             ***K
                                                         </td>
                                                         <td className="py-4 px-4 text-center">
                                                             <button
                                                                 onClick={(e) => {
                                                                     e.stopPropagation();
                                                                     navigate('/pro');
                                                                 }}
                                                                 className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                                                                 title="Desbloquear con PRO"
                                                             >
                                                                 <Lock className="w-3.5 h-3.5" />
                                                             </button>
                                                         </td>
                                                     </tr>
                                                 </React.Fragment>
                                             );
                                         }

                                         const volM = item.volume >= 1_000_000
                                             ? `${(item.volume / 1_000_000).toFixed(1)}M`
                                             : `${(item.volume / 1_000).toFixed(1)}K`;

                                         const changeAbs = Math.abs(item.changePercent);
                                         const maxChange = stats?.maxAbsChange || 10;
                                         const barWidthPct = Math.min(Math.round((changeAbs / maxChange) * 100), 100);

                                         return (
                                             <tr
                                                 key={item.ticker}
                                                 className="hover:bg-muted/10 transition-colors cursor-pointer group"
                                                 onClick={() => navigate(`/market?symbol=NASDAQ:${item.ticker}`)}
                                             >
                                                 {/* Rank */}
                                                 <td className="py-4 px-4 text-center">
                                                     <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-black rounded-lg ${item.rank === 1
                                                         ? isLosers ? 'bg-rose-500/20 text-rose-400 font-black' : 'bg-emerald-500/20 text-emerald-400 font-black'
                                                         : item.rank === 2
                                                             ? isLosers ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
                                                             : item.rank === 3
                                                                 ? isLosers ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                                                                 : 'text-muted-foreground/60'
                                                         }`}>
                                                         {item.rank}
                                                     </span>
                                                 </td>

                                                 {/* Logo + Ticker + Name */}
                                                 <td className="py-4 px-4">
                                                     <div className="flex items-center gap-3">
                                                         <AssetLogoImg src={item.logoUrl} ticker={item.ticker} name={item.companyName} />
                                                         <div className="min-w-0">
                                                             <div className="flex items-center gap-2">
                                                                 <span className="font-bold text-foreground group-hover:text-primary transition-colors text-[14px]">
                                                                     {item.ticker}
                                                                 </span>
                                                             </div>
                                                             <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[320px]">
                                                                 {item.companyName || item.ticker}
                                                             </p>
                                                         </div>
                                                     </div>
                                                 </td>

                                                 {/* Price */}
                                                 <td className="py-4 px-4 text-right font-bold text-foreground num text-[14px]">
                                                     {formatCurrency(item.price, 'USD')}
                                                 </td>

                                                 {/* Previous Close */}
                                                 <td className="py-4 px-4 text-right text-muted-foreground num text-xs">
                                                     {formatCurrency(item.previousClose, 'USD')}
                                                 </td>

                                                 {/* Change % with Visual Strength Indicator Bar */}
                                                 <td className="py-4 px-4 text-right">
                                                     <div className="inline-flex flex-col items-end gap-1">
                                                         {item.changePercent >= 0 ? (
                                                             <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black text-emerald-400 bg-emerald-500/10 num">
                                                                 <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                                                                 +{item.changePercent.toFixed(2)}%
                                                             </span>
                                                         ) : (
                                                             <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black text-rose-400 bg-rose-500/10 num">
                                                                 <TrendingDown className="w-3 h-3 stroke-[2.5]" />
                                                                 {item.changePercent.toFixed(2)}%
                                                             </span>
                                                         )}
                                                         {/* Relative move mini-bar */}
                                                         <div className="w-16 h-1 rounded-full bg-secondary overflow-hidden">
                                                             <div
                                                                 className={`h-full rounded-full transition-all ${item.changePercent >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                                                                 style={{ width: `${barWidthPct}%` }}
                                                             />
                                                         </div>
                                                     </div>
                                                 </td>

                                                 {/* Volume */}
                                                 <td className="py-4 px-4 text-right num text-xs">
                                                     <span className="font-semibold text-foreground/90">{volM}</span>
                                                     <span className="text-[10px] text-muted-foreground/60 block">acciones</span>
                                                 </td>

                                                 {/* Action */}
                                                 <td className="py-4 px-4 text-center">
                                                     <button
                                                         onClick={(e) => {
                                                             e.stopPropagation();
                                                             navigate(`/market?symbol=NASDAQ:${item.ticker}`);
                                                         }}
                                                         className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                                         title="Ver gráfico y análisis"
                                                     >
                                                         <ExternalLink className="w-4 h-4" />
                                                     </button>
                                                 </td>
                                             </tr>
                                         );
                                     })}
                                 </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
