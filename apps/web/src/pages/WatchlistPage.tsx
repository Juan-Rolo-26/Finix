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
    MarketQuoteCard,
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
        color: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
        dot: 'bg-blue-400',
    },
    WAITING_PRICE: {
        label: 'Esperando precio',
        color: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        dot: 'bg-amber-400',
    },
    EARNINGS: {
        label: 'Resultados',
        color: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
        dot: 'bg-purple-400',
    },
    DISCARDED: {
        label: 'Descartada',
        color: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
        dot: 'bg-rose-400',
    },
};

const getStatusConfig = (status: string) =>
    STATUS_CONFIG[status] ?? {
        label: status,
        color: 'bg-secondary text-muted-foreground border border-border/40',
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
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowIdeasSection(!showIdeasSection)}
                                className={cn(
                                    'market-action flex items-center border border-border px-3.5 py-2 hover:bg-secondary/40',
                                    showIdeasSection && 'border-primary text-primary bg-primary/10',
                                )}
                            >
                                <Sparkles size={16} />
                                <span>{showIdeasSection ? 'Ocultar ideas' : 'Ideas para explorar'}</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!activeListId}
                                onClick={() => setIsImportModalOpen(true)}
                                className="market-action flex items-center border border-border px-3.5 py-2 hover:bg-secondary/40 disabled:opacity-40"
                            >
                                <UploadCloud size={16} />
                                <span>Importar</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!activeListId}
                                onClick={() => handleExport('csv')}
                                className="market-action flex items-center border border-border px-3.5 py-2 hover:bg-secondary/40 disabled:opacity-40"
                            >
                                <Download size={16} />
                                <span>Exportar</span>
                            </Button>

                            <Button
                                size="sm"
                                onClick={() => setIsCreateModalOpen(true)}
                                className="market-action flex items-center bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2"
                            >
                                <Plus size={16} />
                                <span>Nueva lista</span>
                            </Button>
                        </>
                    }
                />

                {/* BANNER BIENVENIDA */}
                {showOnboarding && (
                    <div className="relative overflow-hidden rounded-lg border border-primary/25 bg-primary/5 p-4 mb-6">
                        <button
                            type="button"
                            onClick={handleDismissOnboarding}
                            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary/60 transition-colors"
                            aria-label="Cerrar aviso"
                        >
                            <X size={16} />
                        </button>
                        <div className="flex items-start gap-3.5 max-w-4xl">
                            <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                                <Eye size={18} />
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
                    <div className="flex items-center justify-between rounded-lg border border-amber-500/25 bg-amber-500/8 px-4 py-3 mb-6">
                        <div className="flex items-center gap-3">
                            <Crown className="w-5 h-5 text-amber-500 shrink-0" />
                            <span className="text-sm text-amber-300 font-medium">
                                Plan Free — 1 lista y hasta 5 activos. Pasá a{' '}
                                <span className="font-bold text-amber-400">Finix PRO</span> para listas ilimitadas,
                                importación CSV y alertas avanzadas.
                            </span>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => navigate('/settings/plan')}
                            className="market-action h-9 px-4 font-bold bg-amber-500 hover:bg-amber-400 text-black shrink-0 ml-3"
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2 mb-4">
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
                        <div className="market-segments" role="group" aria-label="Listas de seguimiento">
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
                                        className="flex items-center gap-2"
                                    >
                                        <span>{wl.name}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold">
                                            {wl.itemCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {activeList && (
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="market-icon-action"
                                title="Actualizar cotizaciones"
                                aria-label="Actualizar cotizaciones"
                            >
                                <RefreshCw size={17} className={isRefreshing ? 'animate-spin text-primary' : ''} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingList(activeList)}
                                className="market-icon-action"
                                title="Editar lista"
                                aria-label="Editar lista"
                            >
                                <Edit3 size={17} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeletingListId(activeList.id)}
                                className="market-icon-action hover:text-rose-500 hover:border-rose-500/50"
                                title="Eliminar lista"
                                aria-label="Eliminar lista"
                            >
                                <Trash2 size={17} />
                            </button>
                        </div>
                    )}
                </div>

                {/* STATS RAPIDAS */}
                {activeList && totalItems > 0 && (
                    <div className="market-overview">
                        <div className="market-stat">
                            <p className="market-stat__label">
                                <List size={16} /> Activos
                            </p>
                            <p className="market-stat__value">{totalItems}</p>
                            <p className="market-stat__detail">En esta lista</p>
                        </div>
                        <div className="market-stat">
                            <p className="market-stat__label">
                                <TrendingUp size={16} className="text-emerald-500" /> Al alza hoy
                            </p>
                            <p className="market-stat__value text-emerald-500">{gainersCount}</p>
                            <p className="market-stat__detail">Variación positiva</p>
                        </div>
                        <div className="market-stat">
                            <p className="market-stat__label">
                                <ArrowDownRight size={16} className="text-rose-500" /> A la baja
                            </p>
                            <p className="market-stat__value text-rose-500">{losersCount}</p>
                            <p className="market-stat__detail">Variación negativa</p>
                        </div>
                        <div className="market-stat">
                            <p className="market-stat__label">
                                <Bell size={16} className="text-amber-500" /> Con alertas
                            </p>
                            <p className="market-stat__value text-amber-500">{withAlert}</p>
                            <p className="market-stat__detail">Monitoreo activo</p>
                        </div>
                    </div>
                )}

                {/* TABS + TOOLBAR */}
                {activeList && (
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="market-segments" role="tablist" aria-label="Vistas de seguimiento">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'dashboard'}
                                aria-pressed={activeTab === 'dashboard'}
                                onClick={() => setActiveTab('dashboard')}
                            >
                                <LayoutDashboard size={18} />
                                <span>Dashboard</span>
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'list'}
                                aria-pressed={activeTab === 'list'}
                                onClick={() => setActiveTab('list')}
                            >
                                <List size={18} />
                                <span>Lista de seguimiento</span>
                            </button>
                        </div>

                        {activeTab === 'list' && (
                            <div className="market-toolbar">
                                <div className="market-search">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por ticker, nombre o tag..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={cn(
                                        'market-action flex items-center border border-border px-3.5 py-2 hover:bg-secondary/40',
                                        (showFilters || statusFilter !== 'ALL' || portfolioFilter !== 'ALL') &&
                                            'border-primary text-primary',
                                    )}
                                >
                                    <Filter size={16} />
                                    <span>Filtros</span>
                                    {(statusFilter !== 'ALL' || portfolioFilter !== 'ALL') && (
                                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                                            {(statusFilter !== 'ALL' ? 1 : 0) +
                                                (portfolioFilter !== 'ALL' ? 1 : 0)}
                                        </span>
                                    )}
                                </Button>

                                {selectedItemIds.length > 0 && (
                                    <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-md px-3 py-1.5">
                                        <span className="text-sm font-bold text-rose-500">
                                            {selectedItemIds.length} seleccionados
                                        </span>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={bulkActionLoading}
                                            onClick={handleBulkDelete}
                                            className="market-action h-8 px-2.5 rounded text-xs font-bold gap-1"
                                        >
                                            <Trash2 size={14} /> Quitar
                                        </Button>
                                    </div>
                                )}

                                <div className="market-segments ml-auto" role="group" aria-label="Modo de vista">
                                    <button
                                        type="button"
                                        className="market-segment-icon"
                                        aria-pressed={viewMode === 'table'}
                                        onClick={() => setViewMode('table')}
                                        title="Vista tabla"
                                    >
                                        <TableIcon size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        className="market-segment-icon"
                                        aria-pressed={viewMode === 'cards'}
                                        onClick={() => setViewMode('cards')}
                                        title="Vista tarjetas"
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                </div>
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
                    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border bg-secondary/35 text-muted-foreground">
                                        <th className="p-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedItemIds.length > 0 && selectedItemIds.length === filteredItems.length}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                className="rounded border-border cursor-pointer w-4 h-4"
                                            />
                                        </th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-wider">Activo</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-wider">Precio</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-wider">Variación</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-wider">Objetivo</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-wider">Distancia</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-wider">Alertas</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-wider">Balance</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-wider">Estado</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredItems.map((item: any) => {
                                        const isSelected = selectedItemIds.includes(item.id);
                                        const distance = item.distancePct;
                                        const statusCfg = getStatusConfig(item.personalStatus);

                                        return (
                                            <tr
                                                key={item.id}
                                                className={`group hover:bg-secondary/30 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                                                onClick={() => setSelectedItemForDrawer(item)}
                                            >
                                                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleSelectItem(item.id)}
                                                        className="rounded border-border cursor-pointer w-4 h-4"
                                                    />
                                                </td>

                                                {/* Activo */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <SymbolLogo symbol={item.symbol} size={40} />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-bold text-foreground">
                                                                    {item.symbol}
                                                                </span>
                                                                {item.isInPortfolio && (
                                                                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                                                                        Lo tengo
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-sm text-muted-foreground line-clamp-1">
                                                                {item.name} · {item.market} ({item.currency})
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Precio */}
                                                <td className="p-4">
                                                    <span className="font-bold text-foreground text-lg font-mono">
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
                                                        <span className="font-bold text-foreground text-base font-mono">
                                                            ${item.targetPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm italic">Sin definir</span>
                                                    )}
                                                </td>

                                                {/* Distancia */}
                                                <td className="p-4">
                                                    {distance !== null ? (
                                                        <MarketChange value={distance} suffix="%" />
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">—</span>
                                                    )}
                                                </td>

                                                {/* Alertas */}
                                                <td className="p-4">
                                                    {item.hasActiveAlert ? (
                                                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-500">
                                                            <Bell size={15} className="fill-current" /> Activa
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                                                            <BellOff size={15} /> Sin alerta
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Balance */}
                                                <td className="p-4 text-sm text-muted-foreground">
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
                                                        className="market-action inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
                                                    >
                                                        <span>Ver ficha</span>
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer tabla */}
                        <div className="border-t border-border bg-secondary/20 px-5 py-3 flex items-center justify-between">
                            <span className="text-base text-muted-foreground">
                                <span className="font-bold text-foreground">{filteredItems.length}</span> activos
                                {filteredItems.length !== totalItems && ` de ${totalItems}`}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsImportModalOpen(true)}
                                className="market-action flex items-center gap-1.5 text-sm font-semibold"
                            >
                                <Plus size={16} />
                                <span>Agregar activo</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* VISTA CARDS */
                    <div className="market-grid">
                        {filteredItems.map((item: any) => {
                            const distance = item.distancePct;
                            const statusCfg = getStatusConfig(item.personalStatus);

                            return (
                                <MarketQuoteCard
                                    key={item.id}
                                    symbol={item.symbol}
                                    label={item.name || item.symbol}
                                    value={
                                        item.currentPrice !== null
                                            ? `$${item.currentPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : 'N/D'
                                    }
                                    change={item.changePercent}
                                    quoteLabel="Precio actual"
                                    unit={item.currency || 'USD'}
                                    footer={item.market}
                                    footerRight={
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.color}`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}
                                            />
                                            {statusCfg.label}
                                        </span>
                                    }
                                    onSelect={() => setSelectedItemForDrawer(item)}
                                >
                                    <dl className="market-metrics">
                                        <div>
                                            <dt>Precio Objetivo</dt>
                                            <dd>
                                                {item.targetPrice
                                                    ? `$${item.targetPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                    : 'Sin definir'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Distancia al objetivo</dt>
                                            <dd>
                                                {distance !== null ? (
                                                    <span
                                                        className={
                                                            distance >= 0
                                                                ? 'text-emerald-500'
                                                                : 'text-rose-500'
                                                        }
                                                    >
                                                        {distance >= 0 ? '+' : ''}
                                                        {distance.toFixed(1)}%
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Próx. Balance</dt>
                                            <dd>{item.nextEarnings?.date || '—'}</dd>
                                        </div>
                                        <div>
                                            <dt>Alertas</dt>
                                            <dd>
                                                {item.hasActiveAlert ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-500">
                                                        <Bell size={14} className="fill-current" />{' '}
                                                        Activa
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        Sin alerta
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                    </dl>
                                </MarketQuoteCard>
                            );
                        })}

                        {/* Card para agregar activo */}
                        <div
                            onClick={() => setIsImportModalOpen(true)}
                            className="market-card flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary hover:border-primary/50 cursor-pointer transition-all border-dashed min-h-[220px]"
                        >
                            <div className="w-12 h-12 rounded-full border border-dashed border-current flex items-center justify-center">
                                <Plus size={22} />
                            </div>
                            <span className="font-bold text-base text-center">
                                Agregar activo a la lista
                            </span>
                        </div>
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
