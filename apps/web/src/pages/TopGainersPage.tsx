import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    ArrowLeft,
    RefreshCw,
    Search,
    ExternalLink,
    Loader2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { AssetLogoImg } from '@/components/TopGainersCard';
import { useAuthStore } from '@/stores/authStore';
import { ProGate } from '@/components/ProGate';

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
}

export default function TopGainersPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isPro = (user as any)?.plan === 'PRO' || (user as any)?.accountType === 'PRO' || (user as any)?.role === 'ADMIN' || (user as any)?.isPro || (user as any)?.subscriptionTier === 'pro';

    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('tab') === 'losers' ? 'TOP_LOSERS' : 'TOP_GAINERS';
    const isLosers = currentTab === 'TOP_LOSERS';

    const [items, setItems] = useState<RankingItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);
    const [selectedLimit, setSelectedLimit] = useState<number>(50);
    const [date, setDate] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isStale, setIsStale] = useState<boolean>(false);

    if (!isPro) {
        return (
            <div className="min-h-[calc(100vh-60px)] flex flex-col flex-1 bg-background">
                <ProGate
                    title="Funcionalidad Exclusiva PRO"
                    description="El ranking completo del S&P 500 (TOP 10, TOP 25 y TOP 50) es exclusivo para usuarios con Finix PRO. Mejorá tu plan para acceder al ranking ampliado y análisis en tiempo real."
                    buttonText="Activar PRO"
                    onUpgrade={() => navigate('/pro')}
                />
            </div>
        );
    }

    const loadData = async (limitNum: number = selectedLimit, selectedDate?: string) => {
        setIsLoading(true);
        setIsError(false);
        try {
            const queryParams = new URLSearchParams({
                type: currentTab,
                limit: String(limitNum),
            });
            if (selectedDate) queryParams.set('date', selectedDate);

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

    const filteredItems = items.filter(item =>
        item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* ── Top Header / Breadcrumb ── */}
            <div className="border-b border-border/40 bg-card/40 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            title="Volver"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                    {isLosers ? (
                                        <TrendingDown className="w-5 h-5 text-rose-500" />
                                    ) : (
                                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                                    )}
                                    {isLosers ? 'Peores rendimientos' : 'Mejores rendimientos'}
                                </h1>
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${isLosers
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
                                {date && <span className="ml-1.5 font-medium text-foreground">Fecha: {date}</span>}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {/* Selector de Tipo: Ganadores vs Perdedores */}
                        <div className="flex items-center bg-secondary/60 p-1 rounded-xl border border-border/40 text-xs font-semibold">
                            <button
                                onClick={() => setSearchParams({})}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${!isLosers
                                    ? 'bg-card text-emerald-400 shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <TrendingUp className="w-3.5 h-3.5" />
                                Mejores
                            </button>
                            <button
                                onClick={() => setSearchParams({ tab: 'losers' })}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${isLosers
                                    ? 'bg-card text-rose-400 shadow-sm'
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
                                    className={`px-3 py-1.5 rounded-lg transition-all ${selectedLimit === limit
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    TOP {limit}
                                </button>
                            ))}
                        </div>

                        {/* Botón refrescar */}
                        <button
                            onClick={() => loadData(selectedLimit, date)}
                            disabled={isLoading}
                            className="p-2.5 rounded-xl bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border/40 disabled:opacity-50"
                            title="Refrescar"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Body ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Search & Stats Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar ticker o empresa..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground/60"
                        />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground self-end sm:self-auto">
                        <span>Mostrando <strong>{filteredItems.length}</strong> activos</span>
                        {isStale && (
                            <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[11px]">
                                Último cierre disponible
                            </span>
                        )}
                    </div>
                </div>

                {/* Table or Cards */}
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">Obteniendo rankings del S&P 500...</p>
                    </div>
                ) : isError ? (
                    <div className="py-16 text-center space-y-3 bg-card border border-border/50 rounded-2xl p-6">
                        <p className="text-sm font-medium text-destructive">No pudimos conectar con los rankings.</p>
                        <button
                            onClick={() => loadData(selectedLimit)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:opacity-90"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="py-16 text-center bg-card border border-border/50 rounded-2xl p-6">
                        <p className="text-sm font-medium text-muted-foreground">No se encontraron activos para mostrar.</p>
                    </div>
                ) : (
                    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border/40 text-[11.5px] font-semibold text-muted-foreground/70 uppercase tracking-wider bg-secondary/20">
                                        <th className="py-3.5 px-4 w-12 text-center">#</th>
                                        <th className="py-3.5 px-4">Activo</th>
                                        <th className="py-3.5 px-4 text-right">Precio</th>
                                        <th className="py-3.5 px-4 text-right">Cierre Prev.</th>
                                        <th className="py-3.5 px-4 text-right">Cambio</th>
                                        <th className="py-3.5 px-4 text-right">Volumen</th>
                                        <th className="py-3.5 px-4 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20 text-sm">
                                    {filteredItems.map(item => {
                                        const volM = item.volume >= 1_000_000
                                            ? `${(item.volume / 1_000_000).toFixed(1)}M`
                                            : `${(item.volume / 1_000).toFixed(1)}K`;

                                        return (
                                            <tr
                                                key={item.ticker}
                                                className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                                onClick={() => navigate(`/market?symbol=NASDAQ:${item.ticker}`)}
                                            >
                                                {/* Rank */}
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className={`text-xs font-black px-2 py-0.5 rounded-md ${item.rank <= 3
                                                        ? isLosers
                                                            ? 'bg-rose-500/10 text-rose-400 font-black'
                                                            : 'bg-emerald-500/10 text-emerald-400 font-black'
                                                        : 'text-muted-foreground/60'
                                                        }`}>
                                                        {item.rank}
                                                    </span>
                                                </td>

                                                {/* Logo + Ticker + Name */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <AssetLogoImg src={item.logoUrl} ticker={item.ticker} name={item.companyName} />
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                                                                    {item.ticker}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground truncate max-w-[180px] sm:max-w-[240px]">
                                                                {item.companyName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Price */}
                                                <td className="py-3.5 px-4 text-right font-bold text-foreground num">
                                                    {formatCurrency(item.price, 'USD')}
                                                </td>

                                                {/* Previous Close */}
                                                <td className="py-3.5 px-4 text-right text-muted-foreground num text-xs">
                                                    {formatCurrency(item.previousClose, 'USD')}
                                                </td>

                                                {/* Change % */}
                                                <td className="py-3.5 px-4 text-right">
                                                    {item.changePercent >= 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-extrabold text-emerald-400 bg-emerald-500/10 num">
                                                            <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                                                            +{item.changePercent.toFixed(2)}%
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-extrabold text-rose-400 bg-rose-500/10 num">
                                                            <TrendingDown className="w-3 h-3 stroke-[2.5]" />
                                                            {item.changePercent.toFixed(2)}%
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Volume */}
                                                <td className="py-3.5 px-4 text-right text-muted-foreground num text-xs">
                                                    {volM}
                                                </td>

                                                {/* Action */}
                                                <td className="py-3.5 px-4 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/market?symbol=NASDAQ:${item.ticker}`);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                                        title="Ver gráfico en Mercado"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
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
