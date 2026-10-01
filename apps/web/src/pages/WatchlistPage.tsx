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
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Crown,
    X,
} from 'lucide-react';

import AddToWatchlistModal from '@/components/watchlist/AddToWatchlistModal';
import CreateEditWatchlistModal from '@/components/watchlist/CreateEditWatchlistModal';
import DeleteWatchlistModal from '@/components/watchlist/DeleteWatchlistModal';
import ImportWatchlistModal from '@/components/watchlist/ImportWatchlistModal';
import WatchlistDetailDrawer from '@/components/watchlist/WatchlistDetailDrawer';
import WatchlistIdeasSection from '@/components/watchlist/WatchlistIdeasSection';

export default function WatchlistPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuthStore();
    const isPro = isProUser(user);

    // Estado de listas
    const [watchlists, setWatchlists] = useState<any[]>([]);
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [activeListDetail, setActiveListDetail] = useState<any | null>(null);
    const [loadingLists, setLoadingLists] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Vistas y filtros
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [portfolioFilter, setPortfolioFilter] = useState('ALL');
    const [showIdeasSection, setShowIdeasSection] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return localStorage.getItem('finix_watchlist_onboarding_dismissed') !== 'true';
    });

    // Modales y drawers
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingList, setEditingList] = useState<any | null>(null);
    const [deletingListId, setDeletingListId] = useState<string | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedItemForDrawer, setSelectedItemForDrawer] = useState<any | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalSymbol, setAddModalSymbol] = useState('');

    // Selección en lote
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);

    // Cargar listas al iniciar
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

    // Cargar detalle de la lista activa
    const fetchListDetail = async (listId: string) => {
        setLoadingDetail(true);
        try {
            const res = await apiFetch(`/watchlist/${listId}`);
            if (res.ok) {
                const data = await res.json();
                setActiveListDetail(data);
                // Si el drawer está abierto para un ítem, actualizarlo
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

    // Filtrar ítems de la lista activa
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

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* Background glow sutil */}
            <div className="absolute inset-x-0 top-0 -z-10 h-[320px] opacity-40 dark:opacity-100 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />

            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
                {/* Header principal */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                                Seguimiento
                            </h1>
                            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                                <Crown className="h-3 w-3" /> PRO
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Organizá y seguí activos bajo tus propias condiciones.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Botón Explorar ideas */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowIdeasSection(!showIdeasSection)}
                            className={`rounded-xl h-9 text-xs font-bold gap-1.5 transition-all ${showIdeasSection
                                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : 'border-border/60 hover:bg-secondary/40'
                                }`}
                        >
                            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                            {showIdeasSection ? 'Ocultar ideas' : 'Ideas para explorar'}
                        </Button>

                        {/* Botón Importar */}
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!activeListId}
                            onClick={() => setIsImportModalOpen(true)}
                            className="rounded-xl h-9 text-xs font-bold gap-1.5 border-border/60 hover:bg-secondary/40"
                        >
                            <UploadCloud className="h-3.5 w-3.5" />
                            Importar
                        </Button>

                        {/* Botón Exportar */}
                        <div className="relative group">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!activeListId}
                                onClick={() => handleExport('csv')}
                                className="rounded-xl h-9 text-xs font-bold gap-1.5 border-border/60 hover:bg-secondary/40"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Exportar
                            </Button>
                        </div>

                        {/* Botón Nueva lista */}
                        <Button
                            size="sm"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="rounded-xl h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Nueva lista
                        </Button>
                    </div>
                </div>

                {/* Banner de bienvenida y aclaración conceptual */}
                {showOnboarding && (
                    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-5 backdrop-blur-md">
                        <button
                            type="button"
                            onClick={handleDismissOnboarding}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-start gap-3.5 max-w-4xl">
                            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                <Bookmark className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-black text-foreground">
                                    Bienvenido a Seguimiento en Finix
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    <b className="text-foreground">Seguimiento no es un portafolio:</b> agregar una
                                    acción o CEDEAR acá no altera tus saldos, compras ni rendimientos reales. Usá este
                                    espacio para investigar activos, definir tus propios puntos de entrada y recibir
                                    alertas cuando el mercado alcance tus condiciones.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Aviso para usuarios Free */}
                {!isPro && (
                    <div className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
                        <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 shrink-0 text-amber-500" />
                            <span>
                                Estás en el plan Free (1 lista, hasta 5 activos). Pasate a <b>Finix PRO</b> para listas ilimitadas, importación CSV y alertas avanzadas.
                            </span>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => navigate('/settings/plan')}
                            className="h-7 px-3 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shrink-0 ml-2"
                        >
                            Pasar a PRO
                        </Button>
                    </div>
                )}

                {/* Sección opcional: Ideas para explorar */}
                {showIdeasSection && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-200">
                        <WatchlistIdeasSection
                            onAddSymbol={(symbol) => {
                                setAddModalSymbol(symbol);
                                setIsAddModalOpen(true);
                            }}
                        />
                    </div>
                )}

                {/* Selector de listas e información de capacidad */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                    {loadingLists ? (
                        <div className="flex items-center gap-2 py-2">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                            <span className="text-xs text-muted-foreground">Cargando tus listas...</span>
                        </div>
                    ) : watchlists.length === 0 ? (
                        <div className="py-2">
                            <span className="text-xs font-semibold text-muted-foreground">
                                No tenés listas de seguimiento creadas todavía.
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
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
                                        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all shrink-0 ${isActive
                                                ? 'border-emerald-500/60 bg-emerald-500/15 text-foreground shadow-xs'
                                                : 'border-border/60 hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full bg-${wl.color || 'emerald'}-500`} />
                                        <span>{wl.name}</span>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground">
                                            {wl.itemCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Acciones sobre la lista activa */}
                    {activeList && (
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingList(activeList)}
                                className="h-8 px-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground gap-1"
                            >
                                <Edit3 className="w-3.5 h-3.5" /> Editar
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingListId(activeList.id)}
                                className="h-8 px-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-destructive gap-1"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Eliminar
                            </Button>
                        </div>
                    )}
                </div>

                {/* Barra de herramientas: Búsqueda, Filtros y Modo de vista */}
                {activeList && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex flex-1 flex-wrap items-center gap-2">
                            {/* Buscador dentro de la lista */}
                            <div className="relative min-w-[200px] flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar en esta lista por ticker o tag..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-border/60 bg-background/80 text-xs outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>

                            {/* Filtro por estado personal */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-9 px-3 rounded-xl border border-border/60 bg-background text-xs font-bold outline-none focus:border-emerald-500"
                            >
                                <option value="ALL">Todos los estados</option>
                                <option value="RESEARCHING">Investigando</option>
                                <option value="WAITING_PRICE">Esperando precio</option>
                                <option value="EARNINGS">Siguiendo resultados</option>
                                <option value="DISCARDED">Descartada</option>
                            </select>

                            {/* Filtro por portafolio */}
                            <select
                                value={portfolioFilter}
                                onChange={(e) => setPortfolioFilter(e.target.value)}
                                className="h-9 px-3 rounded-xl border border-border/60 bg-background text-xs font-bold outline-none focus:border-emerald-500"
                            >
                                <option value="ALL">Portafolio: Todos</option>
                                <option value="IN_PORTFOLIO">En mi Portafolio</option>
                                <option value="NOT_IN_PORTFOLIO">Solo en seguimiento</option>
                            </select>
                        </div>

                        {/* Switcher de vista y acciones masivas */}
                        <div className="flex items-center gap-2">
                            {selectedItemIds.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-muted-foreground">
                                        {selectedItemIds.length} seleccionados
                                    </span>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={bulkActionLoading}
                                        onClick={handleBulkDelete}
                                        className="h-8 rounded-xl text-xs font-bold gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" /> Quitar
                                    </Button>
                                </div>
                            )}

                            <div className="flex items-center rounded-xl border border-border/60 p-0.5 bg-secondary/30">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table'
                                            ? 'bg-card text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    title="Vista de tabla"
                                >
                                    <TableIcon className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('cards')}
                                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'cards'
                                            ? 'bg-card text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    title="Vista móvil de tarjetas"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contenido principal de la lista */}
                {loadingDetail ? (
                    <div className="rounded-3xl border border-border/60 bg-card/60 p-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
                        <span className="text-xs text-muted-foreground">Actualizando cotizaciones y datos de seguimiento...</span>
                    </div>
                ) : !activeList ? (
                    /* Estado vacío global: Sin listas creadas */
                    <div className="rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center max-w-lg mx-auto">
                        <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
                            <Bookmark className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-black text-foreground">Comenzá tu seguimiento personal</h3>
                        <p className="text-xs text-muted-foreground mt-1 mb-5 leading-relaxed">
                            Creá tu primera lista de seguimiento para agrupar las acciones y CEDEARs que estás evaluando antes de invertir.
                        </p>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="rounded-2xl h-10 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Crear mi primera lista
                        </Button>
                    </div>
                ) : filteredItems.length === 0 ? (
                    /* Estado vacío de la lista seleccionada */
                    <div className="rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mx-auto mb-3">
                            <Search className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-foreground">
                            {searchQuery || statusFilter !== 'ALL' || portfolioFilter !== 'ALL'
                                ? 'No se encontraron activos con estos filtros'
                                : 'Esta lista está vacía'}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 mb-5">
                            {searchQuery || statusFilter !== 'ALL' || portfolioFilter !== 'ALL'
                                ? 'Probá cambiando los términos de búsqueda o limpiando los filtros.'
                                : 'Podés importar tickers en lote o buscar activos en Mercado para agregarlos.'}
                        </p>
                        {searchQuery || statusFilter !== 'ALL' || portfolioFilter !== 'ALL' ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('ALL');
                                    setPortfolioFilter('ALL');
                                }}
                                className="rounded-xl text-xs font-bold"
                            >
                                Limpiar filtros
                            </Button>
                        ) : (
                            <div className="flex justify-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => setIsImportModalOpen(true)}
                                    className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                                >
                                    <UploadCloud className="w-3.5 h-3.5" /> Importar activos
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/market')}
                                    className="rounded-xl text-xs font-bold"
                                >
                                    Explorar Mercado
                                </Button>
                            </div>
                        )}
                    </div>
                ) : viewMode === 'table' ? (
                    /* ── VISTA DE TABLA INTERACTIVA (DESKTOP) ── */
                    <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-border/60 bg-secondary/30 text-muted-foreground font-bold">
                                        <th className="p-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selectedItemIds.length > 0 &&
                                                    selectedItemIds.length === filteredItems.length
                                                }
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                className="rounded border-border/60 cursor-pointer"
                                            />
                                        </th>
                                        <th className="p-4">Activo</th>
                                        <th className="p-4">Precio Actual</th>
                                        <th className="p-4">Variación</th>
                                        <th className="p-4">Objetivo de Precio</th>
                                        <th className="p-4">Distancia</th>
                                        <th className="p-4">Alertas</th>
                                        <th className="p-4">Próx. Balance</th>
                                        <th className="p-4">Estado</th>
                                        <th className="p-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {filteredItems.map((item: any) => {
                                        const isSelected = selectedItemIds.includes(item.id);
                                        const distance = item.distancePct;

                                        return (
                                            <tr
                                                key={item.id}
                                                className={`hover:bg-secondary/20 transition-colors cursor-pointer ${isSelected ? 'bg-emerald-500/5' : ''
                                                    }`}
                                                onClick={() => setSelectedItemForDrawer(item)}
                                            >
                                                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleSelectItem(item.id)}
                                                        className="rounded border-border/60 cursor-pointer"
                                                    />
                                                </td>

                                                {/* Activo / Logo / Ticker */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <SymbolLogo symbol={item.symbol} size={32} />
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-black text-foreground font-mono">
                                                                    {item.symbol}
                                                                </span>
                                                                {item.isInPortfolio && (
                                                                    <span
                                                                        className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                                                        title="Activo en tu portafolio"
                                                                    >
                                                                        Lo tengo
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[11px] text-muted-foreground line-clamp-1">
                                                                {item.name} · {item.market} ({item.currency})
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Precio actual */}
                                                <td className="p-4 font-mono font-bold text-foreground">
                                                    {item.currentPrice !== null
                                                        ? `$${item.currentPrice.toLocaleString()}`
                                                        : 'No disponible'}
                                                </td>

                                                {/* Variación diaria */}
                                                <td className="p-4">
                                                    {item.changePercent !== null ? (
                                                        <span
                                                            className={`font-bold inline-flex items-center gap-0.5 ${item.changePercent >= 0
                                                                    ? 'text-emerald-500'
                                                                    : 'text-rose-500'
                                                                }`}
                                                        >
                                                            {item.changePercent >= 0 ? '+' : ''}
                                                            {item.changePercent.toFixed(2)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>

                                                {/* Objetivo de precio */}
                                                <td className="p-4 font-mono font-bold text-foreground">
                                                    {item.targetPrice ? (
                                                        <span>${item.targetPrice.toLocaleString()} {item.currency}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-[11px] font-normal italic">
                                                            Sin definir
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Distancia al objetivo */}
                                                <td className="p-4">
                                                    {distance !== null ? (
                                                        <span
                                                            className={`inline-flex items-center gap-1 font-black px-2 py-0.5 rounded-full text-[11px] ${distance >= 0
                                                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                                                }`}
                                                        >
                                                            {distance >= 0 ? (
                                                                <ArrowUpRight className="w-3 h-3" />
                                                            ) : (
                                                                <ArrowDownRight className="w-3 h-3" />
                                                            )}
                                                            {distance >= 0 ? '+' : ''}
                                                            {distance.toFixed(1)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>

                                                {/* Alertas */}
                                                <td className="p-4">
                                                    {item.hasActiveAlert ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                            <Bell className="w-3.5 h-3.5 fill-current" /> Activa
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground">Inactiva</span>
                                                    )}
                                                </td>

                                                {/* Próximo balance */}
                                                <td className="p-4 text-[11px] text-muted-foreground">
                                                    {item.nextEarnings?.date ? (
                                                        <span className="font-semibold text-foreground">
                                                            {item.nextEarnings.date}
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>

                                                {/* Estado personal */}
                                                <td className="p-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-secondary text-foreground">
                                                        {item.personalStatus === 'RESEARCHING' && 'Investigando'}
                                                        {item.personalStatus === 'WAITING_PRICE' && 'Esperando precio'}
                                                        {item.personalStatus === 'EARNINGS' && 'Siguiendo resultados'}
                                                        {item.personalStatus === 'DISCARDED' && 'Descartada'}
                                                    </span>
                                                </td>

                                                {/* Acciones */}
                                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedItemForDrawer(item)}
                                                        className="h-8 px-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
                                                    >
                                                        Detalles
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* ── VISTA MÓVIL DE TARJETAS (CARDS) ── */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredItems.map((item: any) => {
                            const distance = item.distancePct;

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedItemForDrawer(item)}
                                    className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur-md p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-emerald-500/30 transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <SymbolLogo symbol={item.symbol} size={36} />
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-black text-foreground font-mono">
                                                        {item.symbol}
                                                    </span>
                                                    {item.isInPortfolio && (
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                                            Lo tengo
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground line-clamp-1">
                                                    {item.name}
                                                </span>
                                            </div>
                                        </div>

                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-foreground">
                                            {item.personalStatus === 'RESEARCHING' && 'Investigando'}
                                            {item.personalStatus === 'WAITING_PRICE' && 'Esperando'}
                                            {item.personalStatus === 'EARNINGS' && 'Resultados'}
                                            {item.personalStatus === 'DISCARDED' && 'Descartada'}
                                        </span>
                                    </div>

                                    {/* Métricas clave */}
                                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary/30 p-2.5 text-xs">
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                                                Precio
                                            </span>
                                            <span className="font-mono font-bold text-foreground">
                                                {item.currentPrice !== null ? `$${item.currentPrice}` : 'N/D'}
                                            </span>
                                            {item.changePercent !== null && (
                                                <span
                                                    className={`text-[10px] font-bold block ${item.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                                        }`}
                                                >
                                                    {item.changePercent >= 0 ? '+' : ''}
                                                    {item.changePercent.toFixed(2)}%
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                                                Objetivo
                                            </span>
                                            <span className="font-mono font-bold text-foreground">
                                                {item.targetPrice ? `$${item.targetPrice}` : 'Sin definir'}
                                            </span>
                                            {distance !== null && (
                                                <span
                                                    className={`text-[10px] font-bold block ${distance >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                                        }`}
                                                >
                                                    {distance >= 0 ? '+' : ''}
                                                    {distance.toFixed(1)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                                        <span>
                                            {item.nextEarnings?.date ? `Balance: ${item.nextEarnings.date}` : 'Sin balance próximo'}
                                        </span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                            {item.notesCount > 0 ? `${item.notesCount} notas` : 'Ver ficha'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal: Crear / Editar Lista */}
            <CreateEditWatchlistModal
                isOpen={isCreateModalOpen || Boolean(editingList)}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingList(null);
                }}
                watchlist={editingList}
                onSuccess={(saved) => {
                    fetchWatchlists();
                    if (!editingList) setActiveListId(saved.id);
                }}
            />

            {/* Modal: Eliminar Lista */}
            <DeleteWatchlistModal
                watchlistId={deletingListId}
                watchlistName={watchlists.find((w) => w.id === deletingListId)?.name}
                isOpen={Boolean(deletingListId)}
                onClose={() => setDeletingListId(null)}
                onSuccess={() => {
                    setDeletingListId(null);
                    fetchWatchlists();
                }}
            />

            {/* Modal: Importar CSV / Tickers */}
            {activeListId && (
                <ImportWatchlistModal
                    watchlistId={activeListId}
                    existingSymbols={activeListDetail?.items?.map((i: any) => i.symbol) || []}
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onSuccess={() => {
                        fetchListDetail(activeListId);
                        fetchWatchlists();
                    }}
                />
            )}

            {/* Drawer: Ficha detallada de activo */}
            {activeListId && (
                <WatchlistDetailDrawer
                    item={selectedItemForDrawer}
                    watchlistId={activeListId}
                    isOpen={Boolean(selectedItemForDrawer)}
                    onClose={() => setSelectedItemForDrawer(null)}
                    onItemUpdated={() => {
                        if (activeListId) fetchListDetail(activeListId);
                    }}
                />
            )}

            {/* Modal genérico: Agregar símbolo a listas (desde Ideas o enlaces) */}
            <AddToWatchlistModal
                symbol={addModalSymbol}
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setAddModalSymbol('');
                }}
                onSuccess={() => {
                    if (activeListId) fetchListDetail(activeListId);
                    fetchWatchlists();
                }}
            />
        </div>
    );
}
