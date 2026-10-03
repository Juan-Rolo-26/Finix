import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useAuthStore, isProUser } from '@/stores/authStore';
import SymbolLogo from '@/components/SymbolLogo';
import { Button } from '@/components/ui/button';
import {
    Bookmark,
    Plus,
    UploadCloud,
    Download,
    Sparkles,
    Search,
    Table as TableIcon,
    LayoutGrid,
    Trash2,
    Edit3,
    Bell,
    BellOff,
    ArrowDownRight,
    Loader2,
    Crown,
    X,
    LayoutDashboard,
    List,
    TrendingUp,
    ChevronRight,
    Eye,
    Filter,
    RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    MarketHeader,
    MarketChange,
} from '@/components/markets/MarketPrimitives';
import '@/components/markets/market.css';

import AddToWatchlistModal from '@/components/watchlist/AddToWatchlistModal';
import CreateEditWatchlistModal from '@/components/watchlist/CreateEditWatchlistModal';
import DeleteWatchlistModal from '@/components/watchlist/DeleteWatchlistModal';
import ImportWatchlistModal from '@/components/watchlist/ImportWatchlistModal';
import WatchlistDetailDrawer from '@/components/watchlist/WatchlistDetailDrawer';
import WatchlistIdeasSection from '@/components/watchlist/WatchlistIdeasSection';
import WatchlistDashboard from '@/components/watchlist/WatchlistDashboard';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    RESEARCHING: {
        label: 'Investigando',
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
        dot: 'bg-blue-500',
    },
    WAITING_PRICE: {
        label: 'Esperando precio',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        dot: 'bg-amber-500',
    },
    EARNINGS: {
        label: 'Resultados',
        color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
        dot: 'bg-purple-500',
    },
    DISCARDED: {
        label: 'Descartada',
        color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
        dot: 'bg-rose-500',
    },
};

const getStatusConfig = (status: string) =>
    STATUS_CONFIG[status] ?? {
        label: status,
        color: 'bg-muted/60 text-muted-foreground border border-border/40',
        dot: 'bg-muted-foreground',
    };

export default function WatchlistPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuthStore();
    const isPro = isProUser(user);

    const [watchlists, setWatchlists] = useState<any[]>([]);
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [activeListDetail, setActiveListDetail] = useState<any | null>(null);
    const [loadingLists, setLoadingLists] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [portfolioFilter, setPortfolioFilter] = useState('ALL');
    const [showIdeasSection, setShowIdeasSection] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return localStorage.getItem('finix_watchlist_onboarding_dismissed') !== 'true';
    });
    const [showFilters, setShowFilters] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingList, setEditingList] = useState<any | null>(null);
    const [deletingListId, setDeletingListId] = useState<string | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedItemForDrawer, setSelectedItemForDrawer] = useState<any | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalSymbol, setAddModalSymbol] = useState('');

    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchWatchlists = async () => {
        if (!user) return;
        setLoadingLists(true);
        try {
            const res = await apiFetch('/watchlist');
            if (res.ok) {
                const data = await res.json();
                setWatchlists(data.watchlists || []);
                if (data.watchlists?.length > 0) {
                    const paramListId = searchParams.get('list');
                    const found = data.watchlists.find((w: any) => w.id === paramListId);
                    setActiveListId(found ? found.id : data.watchlists[0].id);
                } else {
                    setActiveListId(null);
                    setActiveListDetail(null);
                }
            }
        } catch {
            // best effort
        } finally {
            setLoadingLists(false);
        }
    };

    useEffect(() => {
        fetchWatchlists();
    }, [user]);

    const fetchListDetail = async (listId: string) => {
        setLoadingDetail(true);
        try {
            const res = await apiFetch(`/watchlist/${listId}`);
            if (res.ok) {
                const data = await res.json();
                setActiveListDetail(data);
                if (selectedItemForDrawer) {
                    const updated = data.items?.find((i: any) => i.id === selectedItemForDrawer.id);
                    if (updated) setSelectedItemForDrawer(updated);
                }
            }
        } catch {
            // best effort
        } finally {
            setLoadingDetail(false);
        }
    };

    useEffect(() => {
        if (activeListId) {
            fetchListDetail(activeListId);
            setSelectedItemIds([]);
        }
    }, [activeListId]);

    const handleRefresh = async () => {
        if (!activeListId) return;
        setIsRefreshing(true);
        await fetchListDetail(activeListId);
        setIsRefreshing(false);
    };

    const handleDismissOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem('finix_watchlist_onboarding_dismissed', 'true');
    };

    const handleExport = (format: 'csv' | 'json') => {
        if (!activeListId) return;
        window.open(`/api/watchlist/${activeListId}/export?format=${format}`, '_blank');
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked && activeListDetail?.items) {
            setSelectedItemIds(activeListDetail.items.map((i: any) => i.id));
        } else {
            setSelectedItemIds([]);
        }
    };

    const handleToggleSelectItem = (id: string) => {
        setSelectedItemIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (!activeListId || selectedItemIds.length === 0) return;
        if (!confirm(`¿Eliminar ${selectedItemIds.length} activo(s) de esta lista?`)) return;

        setBulkActionLoading(true);
        try {
            for (const itemId of selectedItemIds) {
                await apiFetch(`/watchlist/${activeListId}/items/${itemId}`, { method: 'DELETE' });
            }
            setSelectedItemIds([]);
            fetchListDetail(activeListId);
        } catch {
            // best effort
        } finally {
            setBulkActionLoading(false);
        }
    };

    const filteredItems = useMemo(() => {
        if (!activeListDetail?.items) return [];
        return activeListDetail.items.filter((item: any) => {
            const matchesQuery =
                !searchQuery.trim() ||
                item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.tags && item.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())));

            const matchesStatus =
                statusFilter === 'ALL' || item.personalStatus === statusFilter;

            const matchesPortfolio =
                portfolioFilter === 'ALL' ||
                (portfolioFilter === 'IN_PORTFOLIO' && item.isInPortfolio) ||
                (portfolioFilter === 'NOT_IN_PORTFOLIO' && !item.isInPortfolio);

            return matchesQuery && matchesStatus && matchesPortfolio;
        });
    }, [activeListDetail, searchQuery, statusFilter, portfolioFilter]);

    const activeList = watchlists.find((w) => w.id === activeListId);

    // Stats rapidas
    const totalItems = activeListDetail?.items?.length ?? 0;
    const gainersCount = activeListDetail?.items?.filter((i: any) => (i.changePercent ?? 0) >= 0).length ?? 0;
    const losersCount = totalItems - gainersCount;
    const withAlert = activeListDetail?.items?.filter((i: any) => i.hasActiveAlert).length ?? 0;

    return (
        <div className="relative w-full overflow-hidden pb-20 markets-view">
            <div className="market-shell">
                {/* HEADER PRINCIPAL */}
                <MarketHeader
                    title="Seguimiento"
                    eyebrow="PORTAFOLIO & MERCADOS · FINIX"
                    icon={Bookmark}
                    description="Organizá y monitoreá activos bajo tus propias condiciones y alertas"
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowIdeasSection(!showIdeasSection)}
                                className={cn(
                                    'rounded-xl border-border/80 px-3.5 py-2 hover:bg-secondary/60 transition-all shadow-2xs',
                                    showIdeasSection && 'border-primary text-primary bg-primary/10',
                                )}
                            >
                                <Sparkles size={15} />
                                <span>{showIdeasSection ? 'Ocultar ideas' : 'Ideas para explorar'}</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!activeListId}
                                onClick={() => setIsImportModalOpen(true)}
                                className="rounded-xl border-border/80 px-3.5 py-2 hover:bg-secondary/60 transition-all shadow-2xs disabled:opacity-40"
                            >
                                <UploadCloud size={15} />
                                <span>Importar</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!activeListId}
                                onClick={() => handleExport('csv')}
                                className="rounded-xl border-border/80 px-3.5 py-2 hover:bg-secondary/60 transition-all shadow-2xs disabled:opacity-40"
                            >
                                <Download size={15} />
                                <span>Exportar</span>
                            </Button>

                            <Button
                                size="sm"
                                onClick={() => setIsCreateModalOpen(true)}
                                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 shadow-xs transition-all"
                            >
                                <Plus size={16} />
                                <span>Nueva lista</span>
                            </Button>
                        </div>
                    }
                />

                {/* BANNER BIENVENIDA */}
                {showOnboarding && (
                    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 mb-6 backdrop-blur-sm shadow-xs">
                        <button
                            type="button"
                            onClick={handleDismissOnboarding}
                            className="absolute top-3.5 right-3.5 text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
                            aria-label="Cerrar aviso"
                        >
                            <X size={16} />
                        </button>
                        <div className="flex items-start gap-4 max-w-4xl">
                            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                                <Eye size={19} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-foreground text-base">
                                    Bienvenido a Seguimiento en Finix
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    <span className="font-bold text-foreground">Seguimiento no es un portafolio:</span> agregar una
                                    acción o CEDEAR acá no altera tus saldos, compras ni rendimientos reales. Usá este
                                    espacio para investigar activos, definir tus propios puntos de entrada y recibir
                                    alertas cuando el mercado alcance tus condiciones.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* AVISO PLAN FREE */}
                {!isPro && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent px-5 py-3.5 mb-6 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                                <Crown className="w-4 h-4 text-amber-500" />
                            </div>
                            <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                                Plan Free — 1 lista y hasta 5 activos. Pasá a{' '}
                                <span className="font-bold text-amber-600 dark:text-amber-400">Finix PRO</span> para listas ilimitadas,
                                importación CSV y alertas avanzadas.
                            </span>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => navigate('/settings/plan')}
                            className="rounded-xl h-9 px-4 font-bold bg-amber-500 hover:bg-amber-400 text-black shrink-0 shadow-xs"
                        >
                            Pasar a PRO
                        </Button>
                    </div>
                )}

                {/* SECCION IDEAS */}
                {showIdeasSection && (
                    <div className="mb-6">
                        <WatchlistIdeasSection
                            onAddSymbol={(symbol) => {
                                setAddModalSymbol(symbol);
                                setIsAddModalOpen(true);
                            }}
                        />
                    </div>
                )}

                {/* SELECTOR DE LISTAS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3 mb-6">
                    {loadingLists ? (
                        <div className="flex items-center gap-2.5 py-2 text-muted-foreground text-sm">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span>Cargando tus listas...</span>
                        </div>
                    ) : watchlists.length === 0 ? (
                        <span className="text-sm font-semibold text-muted-foreground py-2">
                            No tenés listas de seguimiento creadas todavía.
                        </span>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Listas de seguimiento">
                            {watchlists.map((wl) => {
                                const isActive = wl.id === activeListId;
                                return (
                                    <button
                                        key={wl.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveListId(wl.id);
                                            setSearchParams({ list: wl.id });
                                        }}
                                        aria-pressed={isActive}
                                        className={cn(
                                            "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all",
                                            isActive
                                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                                : "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50"
                                        )}
                                    >
                                        <span>{wl.name}</span>
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full font-bold",
                                            isActive
                                                ? "bg-primary-foreground/20 text-primary-foreground"
                                                : "bg-background/80 text-muted-foreground"
                                        )}>
                                            {wl.itemCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {activeList && (
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="w-9 h-9 rounded-xl border border-border/70 flex items-center justify-center hover:bg-secondary/80 transition-all text-muted-foreground hover:text-foreground"
                                title="Actualizar cotizaciones"
                                aria-label="Actualizar cotizaciones"
                            >
                                <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-primary' : ''} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingList(activeList)}
                                className="w-9 h-9 rounded-xl border border-border/70 flex items-center justify-center hover:bg-secondary/80 transition-all text-muted-foreground hover:text-foreground"
                                title="Editar lista"
                                aria-label="Editar lista"
                            >
                                <Edit3 size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeletingListId(activeList.id)}
                                className="w-9 h-9 rounded-xl border border-border/70 flex items-center justify-center hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 transition-all text-muted-foreground"
                                title="Eliminar lista"
                                aria-label="Eliminar lista"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    )}
                </div>

                {/* STATS RAPIDAS */}
                {activeList && totalItems > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
                        <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm p-4 hover:border-border hover:shadow-xs transition-all flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activos</span>
                                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <List size={16} />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight tabular-nums">{totalItems}</span>
                                <span className="text-xs text-muted-foreground">en esta lista</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm p-4 hover:border-border hover:shadow-xs transition-all flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Al alza hoy</span>
                                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <TrendingUp size={16} />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">{gainersCount}</span>
                                <span className="text-xs text-muted-foreground">variación positiva</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm p-4 hover:border-border hover:shadow-xs transition-all flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">A la baja</span>
                                <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                    <ArrowDownRight size={16} />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight tabular-nums">{losersCount}</span>
                                <span className="text-xs text-muted-foreground">variación negativa</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm p-4 hover:border-border hover:shadow-xs transition-all flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alertas activas</span>
                                <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <Bell size={16} />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight tabular-nums">{withAlert}</span>
                                <span className="text-xs text-muted-foreground">monitoreo activo</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* TABS + TOOLBAR */}
                {activeList && (
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center p-1 bg-secondary/50 border border-border/60 rounded-xl" role="tablist" aria-label="Vistas de seguimiento">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === 'dashboard'}
                                    aria-pressed={activeTab === 'dashboard'}
                                    onClick={() => setActiveTab('dashboard')}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                                        activeTab === 'dashboard'
                                            ? "bg-card text-foreground shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <LayoutDashboard size={16} />
                                    <span>Dashboard</span>
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === 'list'}
                                    aria-pressed={activeTab === 'list'}
                                    onClick={() => setActiveTab('list')}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                                        activeTab === 'list'
                                            ? "bg-card text-foreground shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <List size={16} />
                                    <span>Lista de seguimiento</span>
                                </button>
                            </div>

                            {activeTab === 'list' && (
                                <div className="flex items-center p-1 bg-secondary/50 border border-border/60 rounded-xl" role="group" aria-label="Modo de vista">
                                    <button
                                        type="button"
                                        className={cn(
                                            "p-2 rounded-lg transition-all",
                                            viewMode === 'table'
                                                ? "bg-card text-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                        aria-pressed={viewMode === 'table'}
                                        onClick={() => setViewMode('table')}
                                        title="Vista tabla"
                                    >
                                        <TableIcon size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        className={cn(
                                            "p-2 rounded-lg transition-all",
                                            viewMode === 'cards'
                                                ? "bg-card text-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                        aria-pressed={viewMode === 'cards'}
                                        onClick={() => setViewMode('cards')}
                                        title="Vista tarjetas"
                                    >
                                        <LayoutGrid size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {activeTab === 'list' && (
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative flex-1 min-w-[220px]">
                                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por ticker, nombre o tag..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-10 pl-10 pr-4 rounded-xl border border-border/70 bg-card/70 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={cn(
                                        'h-10 px-3.5 rounded-xl border border-border/70 bg-card/70 hover:bg-secondary/60 flex items-center gap-2 text-sm font-medium transition-all shadow-2xs',
                                        (showFilters || statusFilter !== 'ALL' || portfolioFilter !== 'ALL') &&
                                            'border-primary text-primary bg-primary/5',
                                    )}
                                >
                                    <Filter size={15} />
                                    <span>Filtros</span>
                                    {(statusFilter !== 'ALL' || portfolioFilter !== 'ALL') && (
                                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                                            {(statusFilter !== 'ALL' ? 1 : 0) +
                                                (portfolioFilter !== 'ALL' ? 1 : 0)}
                                        </span>
                                    )}
                                </Button>

                                {selectedItemIds.length > 0 && (
                                    <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-1.5 shadow-2xs">
                                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                            {selectedItemIds.length} seleccionados
                                        </span>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={bulkActionLoading}
                                            onClick={handleBulkDelete}
                                            className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1 shadow-xs"
                                        >
                                            <Trash2 size={13} /> Quitar
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'list' && showFilters && (
                            <div className="flex flex-wrap gap-4 p-4 rounded-md border border-border bg-card/60">
                                <div className="flex flex-col gap-1.5">
                                    <label className="market-metric-label">Estado personal</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="market-control min-w-[200px]"
                                    >
                                        <option value="ALL">Todos los estados</option>
                                        <option value="RESEARCHING">Investigando</option>
                                        <option value="WAITING_PRICE">Esperando precio</option>
                                        <option value="EARNINGS">Siguiendo resultados</option>
                                        <option value="DISCARDED">Descartada</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="market-metric-label">Portafolio</label>
                                    <select
                                        value={portfolioFilter}
                                        onChange={(e) => setPortfolioFilter(e.target.value)}
                                        className="market-control min-w-[200px]"
                                    >
                                        <option value="ALL">Todos</option>
                                        <option value="IN_PORTFOLIO">En mi Portafolio</option>
                                        <option value="NOT_IN_PORTFOLIO">Solo en seguimiento</option>
                                    </select>
                                </div>
                                {(statusFilter !== 'ALL' || portfolioFilter !== 'ALL') && (
                                    <div className="flex items-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setStatusFilter('ALL');
                                                setPortfolioFilter('ALL');
                                            }}
                                            className="market-action flex items-center gap-1.5 px-3 py-2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X size={15} /> Limpiar filtros
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* CONTENIDO PRINCIPAL */}
                {loadingDetail ? (
                    <div className="market-empty flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="font-bold text-foreground">Actualizando datos</p>
                        <p className="text-sm text-muted-foreground">Cargando cotizaciones y seguimiento...</p>
                    </div>
                ) : !activeList ? (
                    /* ESTADO VACIO GLOBAL */
                    <div className="market-empty max-w-lg mx-auto flex flex-col items-center">
                        <Bookmark size={36} className="text-primary mb-2" />
                        <h3 className="text-xl font-bold text-foreground mb-2">Comenzá tu seguimiento</h3>
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            Creá tu primera lista de seguimiento para agrupar las acciones y CEDEARs que estás evaluando antes de invertir.
                        </p>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="market-action bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                        >
                            <Plus size={16} /> Crear mi primera lista
                        </Button>
                    </div>
                ) : activeTab === 'dashboard' ? (
                    activeListDetail?.items?.length > 0 ? (
                        <WatchlistDashboard
                            items={activeListDetail.items}
                            onItemClick={setSelectedItemForDrawer}
                        />
                    ) : (
                        <div className="market-empty max-w-lg mx-auto flex flex-col items-center">
                            <LayoutDashboard size={36} className="text-muted-foreground mb-2" />
                            <h3 className="text-lg font-bold text-foreground mb-2">Lista vacía</h3>
                            <p className="text-sm text-muted-foreground mb-5">Agregá activos para ver el dashboard con análisis y timeline.</p>
                            <div className="flex justify-center gap-2.5">
                                <Button size="sm" onClick={() => setIsImportModalOpen(true)} className="market-action bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
                                    <UploadCloud size={16} /> Importar activos
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => navigate('/market')} className="market-action">
                                    Explorar Mercado
                                </Button>
                            </div>
                        </div>
                    )
                ) : filteredItems.length === 0 ? (
                    /* LISTA VACIA / SIN RESULTADOS */
                    <div className="market-empty max-w-lg mx-auto flex flex-col items-center">
                        <Search size={36} className="text-muted-foreground mb-2" />
                        <h3 className="text-lg font-bold text-foreground mb-2">
                            {searchQuery || statusFilter !== 'ALL' || portfolioFilter !== 'ALL'
                                ? 'Sin resultados para estos filtros'
                                : 'Esta lista está vacía'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-5">
                            {searchQuery || statusFilter !== 'ALL' || portfolioFilter !== 'ALL'
                                ? 'Probá cambiando los términos de búsqueda o limpiando los filtros.'
                                : 'Importá tickers en lote o buscá activos en Mercado.'}
                        </p>
                        {searchQuery || statusFilter !== 'ALL' || portfolioFilter !== 'ALL' ? (
                            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setPortfolioFilter('ALL'); }} className="market-action gap-2">
                                <X size={16} /> Limpiar filtros
                            </Button>
                        ) : (
                            <div className="flex justify-center gap-2.5">
                                <Button size="sm" onClick={() => setIsImportModalOpen(true)} className="market-action bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
                                    <UploadCloud size={16} /> Importar activos
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => navigate('/market')} className="market-action">
                                    Explorar Mercado
                                </Button>
                            </div>
                        )}
                    </div>
                ) : viewMode === 'table' ? (
                    /* VISTA TABLA */
                    <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground">
                                        <th className="p-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedItemIds.length > 0 && selectedItemIds.length === filteredItems.length}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                className="rounded border-border/80 cursor-pointer w-4 h-4 accent-primary"
                                            />
                                        </th>
                                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider">Activo</th>
                                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider">Precio</th>
                                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider">Variación</th>
                                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider">Objetivo</th>
                                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider">Distancia</th>
                                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider">Alertas</th>
                                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider">Balance</th>
                                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider">Estado</th>
                                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filteredItems.map((item: any) => {
                                        const isSelected = selectedItemIds.includes(item.id);
                                        const distance = item.distancePct;
                                        const statusCfg = getStatusConfig(item.personalStatus);

                                        return (
                                            <tr
                                                key={item.id}
                                                className={`group hover:bg-muted/35 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                                                onClick={() => setSelectedItemForDrawer(item)}
                                            >
                                                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleSelectItem(item.id)}
                                                        className="rounded border-border/80 cursor-pointer w-4 h-4 accent-primary"
                                                    />
                                                </td>

                                                {/* Activo */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <SymbolLogo symbol={item.symbol} size={40} className="rounded-xl shrink-0" />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                                                                    {item.symbol}
                                                                </span>
                                                                {item.isInPortfolio && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                                        En cartera
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground line-clamp-1">
                                                                {item.name} · {item.market} ({item.currency})
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Precio */}
                                                <td className="p-4">
                                                    <span className="font-bold text-foreground text-base font-mono tabular-nums">
                                                        {item.currentPrice !== null
                                                            ? `$${item.currentPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                            : <span className="text-sm text-muted-foreground font-normal">N/D</span>}
                                                    </span>
                                                </td>

                                                {/* Variacion */}
                                                <td className="p-4">
                                                    <MarketChange value={item.changePercent} />
                                                </td>

                                                {/* Objetivo */}
                                                <td className="p-4">
                                                    {item.targetPrice ? (
                                                        <span className="font-bold text-foreground text-sm font-mono tabular-nums">
                                                            ${item.targetPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground/60 text-xs italic">Sin definir</span>
                                                    )}
                                                </td>

                                                {/* Distancia */}
                                                <td className="p-4">
                                                    {distance !== null ? (
                                                        <MarketChange value={distance} suffix="%" />
                                                    ) : (
                                                        <span className="text-muted-foreground/60 text-sm">—</span>
                                                    )}
                                                </td>

                                                {/* Alertas */}
                                                <td className="p-4">
                                                    {item.hasActiveAlert ? (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                            <Bell size={14} className="fill-current" /> Activa
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60">
                                                            <BellOff size={14} /> Sin alerta
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Balance */}
                                                <td className="p-4 text-xs text-muted-foreground">
                                                    {item.nextEarnings?.date ? (
                                                        <span className="font-semibold text-foreground">{item.nextEarnings.date}</span>
                                                    ) : '—'}
                                                </td>

                                                {/* Estado */}
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                                        {statusCfg.label}
                                                    </span>
                                                </td>

                                                {/* Acciones */}
                                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedItemForDrawer(item)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground group-hover:text-primary hover:bg-secondary/60 transition-all"
                                                    >
                                                        <span>Ver ficha</span>
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer tabla */}
                        <div className="border-t border-border/60 bg-muted/20 px-5 py-3.5 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                <span className="font-bold text-foreground">{filteredItems.length}</span> activos
                                {filteredItems.length !== totalItems && ` de ${totalItems}`}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsImportModalOpen(true)}
                                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                            >
                                <Plus size={15} />
                                <span>Agregar activo</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* VISTA CARDS */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredItems.map((item: any) => {
                            const distance = item.distancePct;
                            const statusCfg = getStatusConfig(item.personalStatus);

                            return (
                                <article
                                    key={item.id}
                                    onClick={() => setSelectedItemForDrawer(item)}
                                    className="group relative flex flex-col justify-between p-5 rounded-2xl border border-border/75 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer min-h-[220px]"
                                >
                                    {/* Header: Logo, Ticker, Name, Status Pill */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <SymbolLogo symbol={item.symbol} size={40} className="rounded-xl shrink-0" />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors">
                                                        {item.symbol}
                                                    </span>
                                                    {item.isInPortfolio && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                            En cartera
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate" title={item.name}>
                                                    {item.name || item.symbol}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${statusCfg.color}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                            {statusCfg.label}
                                        </span>
                                    </div>

                                    {/* Price & Change section */}
                                    <div className="my-3 py-2.5 px-3 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                                                Precio actual
                                            </span>
                                            <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                                                {item.currentPrice !== null
                                                    ? `$${item.currentPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                    : 'N/D'}
                                            </span>
                                        </div>
                                        <div>
                                            <MarketChange value={item.changePercent} />
                                        </div>
                                    </div>

                                    {/* Metrics: Target & Distance */}
                                    <div className="grid grid-cols-2 gap-2 text-xs py-1">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground font-medium">Precio Objetivo</span>
                                            <span className="font-semibold text-foreground font-mono tabular-nums">
                                                {item.targetPrice
                                                    ? `$${item.targetPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                    : <span className="text-muted-foreground/60 italic font-normal">Sin definir</span>}
                                            </span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-muted-foreground font-medium">Distancia</span>
                                            <span className="font-semibold tabular-nums">
                                                {distance !== null ? (
                                                    <span className={distance >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                                                        {distance >= 0 ? '+' : ''}{distance.toFixed(1)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground/60 font-normal">—</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-3 mt-1 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono">
                                                {item.market || 'ACC'}
                                            </span>
                                            {item.nextEarnings?.date && (
                                                <span className="text-[11px] truncate">
                                                    Bal: {item.nextEarnings.date}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {item.hasActiveAlert ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                                                    <Bell size={12} className="fill-current" /> Alerta
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-muted-foreground/60 text-[11px]">
                                                    <BellOff size={12} />
                                                </span>
                                            )}
                                            <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                </article>
                            );
                        })}

                        {/* Card para agregar activo */}
                        <button
                            type="button"
                            onClick={() => setIsImportModalOpen(true)}
                            className="group rounded-2xl border-2 border-dashed border-border/70 hover:border-primary/50 bg-card/40 hover:bg-card/80 flex flex-col items-center justify-center gap-3 p-6 text-muted-foreground hover:text-primary cursor-pointer transition-all duration-200 min-h-[220px]"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-secondary group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-all duration-200 shadow-2xs">
                                <Plus size={22} className="group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="text-center">
                                <span className="font-bold text-sm text-foreground block">
                                    Agregar activo
                                </span>
                                <span className="text-xs text-muted-foreground mt-0.5 block">
                                    Sumá acciones o CEDEARs a esta lista
                                </span>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* MODALES */}
            <CreateEditWatchlistModal
                isOpen={isCreateModalOpen || Boolean(editingList)}
                onClose={() => { setIsCreateModalOpen(false); setEditingList(null); }}
                watchlist={editingList}
                onSuccess={(saved) => {
                    fetchWatchlists();
                    if (!editingList) setActiveListId(saved.id);
                }}
            />

            <DeleteWatchlistModal
                watchlistId={deletingListId}
                watchlistName={watchlists.find((w) => w.id === deletingListId)?.name}
                isOpen={Boolean(deletingListId)}
                onClose={() => setDeletingListId(null)}
                onSuccess={() => { setDeletingListId(null); fetchWatchlists(); }}
            />

            {activeListId && (
                <ImportWatchlistModal
                    watchlistId={activeListId}
                    existingSymbols={activeListDetail?.items?.map((i: any) => i.symbol) || []}
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onSuccess={() => { fetchListDetail(activeListId); fetchWatchlists(); }}
                />
            )}

            {activeListId && (
                <WatchlistDetailDrawer
                    item={selectedItemForDrawer}
                    watchlistId={activeListId}
                    isOpen={Boolean(selectedItemForDrawer)}
                    onClose={() => setSelectedItemForDrawer(null)}
                    onItemUpdated={() => { if (activeListId) fetchListDetail(activeListId); }}
                />
            )}

            <AddToWatchlistModal
                symbol={addModalSymbol}
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); setAddModalSymbol(''); }}
                onSuccess={() => { if (activeListId) fetchListDetail(activeListId); fetchWatchlists(); }}
            />
        </div>
    );
}
