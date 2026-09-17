import { useState, useEffect, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    RefreshCw,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Search,
    Zap,
    Sun,
    Moon,
    Building2,
    Sparkles,
    ExternalLink,
    Edit2,
    Check,
    Globe,
    Flame,
    ShieldCheck,
    Database,
    HelpCircle,
} from 'lucide-react';
import { adminFetch } from '../lib/api';

interface CalendarEvent {
    id: string;
    eventType: string;
    country: string;
    countryCode?: string;
    currency?: string;
    title: string;
    description?: string;
    category: string;
    subcategory?: string;
    importance: string;
    impact?: string;
    impactScore?: number;
    marketImpactScore: number;
    date: string;
    time?: string;
    timezone?: string;
    timestampUtc?: string;
    previousValue?: string;
    forecastValue?: string;
    consensusValue?: string;
    actualValue?: string;
    unit?: string;
    surprise?: number;
    surprisePercent?: number;
    source?: string;
    sourceName?: string;
    sourceUrl?: string;
    sourceType: string;
    companyName?: string;
    ticker?: string;
    status?: string;
    isManual?: boolean;
    isAutomatic?: boolean;
    isVerified?: boolean;
    isPublished: boolean;
    eventFingerprint?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface EarningsEvent {
    id: string;
    ticker: string;
    companyName: string;
    logoUrl?: string;
    date: string;
    time?: string;
    dateStatus: string;
    reportTiming?: 'BMO' | 'AMC' | 'DMH' | string;
    epsEstimate?: number;
    revenueEstimate?: number;
    actualEps?: number;
    actualRevenue?: number;
    marketCap?: number;
    earningsImpactScore: number;
    isPublished: boolean;
    source?: string;
}

interface CalendarSource {
    id: string;
    name: string;
    type: string;
    country: string;
    baseUrl?: string;
    apiUrl?: string;
    isActive: boolean;
    priority: number;
    lastSyncAt?: string;
    syncStatus?: string;
    errorMessage?: string;
}

interface SyncSummary {
    success: boolean;
    message: string;
    eventsFound: number;
    eventsCreated: number;
    eventsUpdated: number;
    duplicatesIgnored: number;
    errorsCount: number;
    durationMs: number;
}

export default function CalendarManagement() {
    const [activeTab, setActiveTab] = useState<'ECONOMIC' | 'EARNINGS'>('ECONOMIC');
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
    const [sources, setSources] = useState<CalendarSource[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSyncingMacro, setIsSyncingMacro] = useState<boolean>(false);
    const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
    const [isSyncingTV, setIsSyncingTV] = useState<boolean>(false);
    const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [syncResult, setSyncResult] = useState<SyncSummary | null>(null);

    // Filtros para Eventos Macroeconómicos y de Mercado
    const todayStr = useMemo(() => new Date().toISOString().substring(0, 10), []);
    const [macroCategoryFilter, setMacroCategoryFilter] = useState<string>('ALL');
    const [macroCountryFilter, setMacroCountryFilter] = useState<string>('ALL');
    const [macroImpactFilter, setMacroImpactFilter] = useState<string>('ALL');
    const [macroStatusFilter, setMacroStatusFilter] = useState<string>('ALL');
    const [macroPeriodFilter, setMacroPeriodFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
    const [macroCustomDate, setMacroCustomDate] = useState<string>(todayStr);
    const [macroSearch, setMacroSearch] = useState<string>('');

    // Filtros específicos para Resultados S&P 500 (Preservados tal cual)
    const [earningsPeriod, setEarningsPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL' | 'CUSTOM'>('TODAY');
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);
    const [earningsSearch, setEarningsSearch] = useState<string>('');

    // Modales
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [createEventType, setCreateEventType] = useState<'ECONOMIC' | 'CORPORATE_EVENT' | 'EARNINGS'>('ECONOMIC');
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
    const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
    const [showSourcesModal, setShowSourcesModal] = useState<boolean>(false);

    // Formulario de Creación Manual
    const [createForm, setCreateForm] = useState({
        eventType: 'ECONOMIC',
        country: 'US',
        title: '',
        description: '',
        category: 'MONETARY_POLICY',
        subcategory: '',
        importance: 'HIGH',
        impact: 'HIGH',
        impactScore: 85,
        date: todayStr,
        time: '14:00',
        timezone: 'America/New_York',
        previousValue: '',
        forecastValue: '',
        consensusValue: '',
        actualValue: '',
        unit: '%',
        companyName: '',
        ticker: '',
        sourceName: 'Admin Manual',
        sourceUrl: '',
        status: 'PUBLISHED',
    });

    // Formulario de Earnings (Preservado para S&P 500)
    const [earningsForm, setEarningsForm] = useState({
        ticker: '',
        companyName: '',
        date: todayStr,
        time: '16:30',
        reportTiming: 'AMC',
        epsEstimate: '',
        revenueEstimate: '',
        earningsImpactScore: 85,
    });

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [overviewRes, earningsRes, sourcesRes] = await Promise.all([
                adminFetch('/calendar/admin/overview'),
                adminFetch('/calendar/admin/events?type=EARNINGS&limit=500'),
                adminFetch('/calendar/admin/sources'),
            ]);

            if (overviewRes.ok) {
                const data = await overviewRes.json();
                setEvents(data.recentEconomic || []);
            }

            if (earningsRes.ok) {
                const earnData = await earningsRes.json();
                setEarnings(earnData.items || []);
            }

            if (sourcesRes.ok) {
                const sourcesData = await sourcesRes.json();
                setSources(sourcesData || []);
            }
        } catch {
            setFeedback({ type: 'error', message: 'Error al cargar datos del calendario' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Sincronización Inteligente Macro
    const triggerSyncMacro = async () => {
        setIsSyncingMacro(true);
        setFeedback(null);
        try {
            const res = await adminFetch('/calendar/admin/sync-macro', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            if (res.ok) {
                const data = await res.json();
                setSyncResult(data);
                setFeedback({
                    type: 'success',
                    message: data.message || `Sincronización completada: ${data.eventsCreated || 0} nuevos, ${data.eventsUpdated || 0} actualizados.`,
                });
                await loadData();
            } else {
                throw new Error('Error en sincronización');
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Error al sincronizar datos macro' });
        } finally {
            setIsSyncingMacro(false);
        }
    };

    // Sincronizar Todo (Macro + Balances S&P 500)
    const triggerSyncAll = async () => {
        setIsSyncingAll(true);
        setFeedback(null);
        try {
            const res = await adminFetch('/calendar/admin/sync-all', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            if (res.ok) {
                const data = await res.json();
                setFeedback({
                    type: 'success',
                    message: `Sincronización global completada: ${data.eventsProcessed || 0} eventos procesados.`,
                });
                await loadData();
            } else {
                throw new Error('Error en sincronización global');
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Error al sincronizar todo' });
        } finally {
            setIsSyncingAll(false);
        }
    };

    // Sincronizar una fuente institucional específica
    const triggerSyncSource = async (sourceId: string, sourceName: string) => {
        setSyncingSourceId(sourceId);
        setFeedback(null);
        try {
            const res = await adminFetch(`/calendar/admin/sync-source/${sourceId}`, {
                method: 'POST',
                body: JSON.stringify({}),
            });
            if (res.ok) {
                const data = await res.json();
                setSyncResult(data);
                setFeedback({
                    type: 'success',
                    message: `Fuente "${sourceName}" sincronizada correctamente.`,
                });
                await loadData();
            } else {
                throw new Error(`Error sincronizando fuente ${sourceName}`);
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Error al sincronizar fuente' });
        } finally {
            setSyncingSourceId(null);
        }
    };

    // Activar/Desactivar fuente
    const toggleSourceActive = async (sourceId: string, currentStatus: boolean) => {
        try {
            const res = await adminFetch(`/calendar/admin/sources/${sourceId}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            if (res.ok) {
                setSources(prev => prev.map(s => s.id === sourceId ? { ...s, isActive: !currentStatus } : s));
            }
        } catch {
            setFeedback({ type: 'error', message: 'No se pudo actualizar el estado de la fuente' });
        }
    };

    // Sincronización directa con TradingView Scanner para S&P 500 (Preservada)
    const triggerTradingViewSync = async () => {
        setIsSyncingTV(true);
        setFeedback(null);
        try {
            const res = await adminFetch('/calendar/admin/sync-tradingview-earnings', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            if (res.ok) {
                const data = await res.json();
                setFeedback({
                    type: 'success',
                    message: `Balances S&P 500 sincronizados con TradingView Scanner (${data.eventsProcessed} empresas actualizadas)`,
                });
                await loadData();
            } else {
                throw new Error('No se pudo sincronizar con TradingView');
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Error al sincronizar con TradingView' });
        } finally {
            setIsSyncingTV(false);
        }
    };

    // Crear Evento Manual
    const handleCreateManual = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let payload: any;
            if (createEventType === 'EARNINGS') {
                payload = {
                    ...earningsForm,
                    type: 'EARNINGS',
                };
            } else {
                payload = {
                    ...createForm,
                    eventType: createEventType,
                    type: 'ECONOMIC',
                };
            }

            const res = await adminFetch('/calendar/admin/events', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setFeedback({ type: 'success', message: 'Evento manual guardado con éxito' });
                setShowCreateModal(false);
                await loadData();
            } else {
                const errData = await res.json();
                throw new Error(errData.message || 'Error al guardar');
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Error al crear evento manual' });
        }
    };

    // Actualizar Evento Editado
    const handleUpdateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEvent) return;

        try {
            const res = await adminFetch(`/calendar/admin/events/${editingEvent.id}`, {
                method: 'PATCH',
                body: JSON.stringify(editingEvent),
            });
            if (res.ok) {
                setFeedback({ type: 'success', message: 'Evento actualizado exitosamente' });
                setShowEditModal(false);
                setEditingEvent(null);
                await loadData();
            }
        } catch {
            setFeedback({ type: 'error', message: 'Error al actualizar el evento' });
        }
    };

    // Cambiar Estado (Publicar, Aprobar, Ocultar)
    const updateEventStatus = async (id: string, newStatus: string) => {
        try {
            const isPub = newStatus === 'PUBLISHED' || newStatus === 'APPROVED';
            await adminFetch(`/calendar/admin/events/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus, isPublished: isPub }),
            });
            setEvents(prev => prev.map(item => item.id === id ? { ...item, status: newStatus, isPublished: isPub } : item));
            setFeedback({ type: 'success', message: `Estado cambiado a ${newStatus}` });
        } catch {
            setFeedback({ type: 'error', message: 'Error al cambiar estado' });
        }
    };

    const deleteEvent = async (id: string) => {
        if (!confirm('¿Eliminar este evento permanentemente?')) return;
        try {
            await adminFetch(`/calendar/admin/events/${id}`, { method: 'DELETE' });
            setEarnings(prev => prev.filter(item => item.id !== id));
            setEvents(prev => prev.filter(item => item.id !== id));
            setFeedback({ type: 'success', message: 'Evento eliminado' });
        } catch {
            setFeedback({ type: 'error', message: 'Error al eliminar evento' });
        }
    };

    // Formateadores de moneda y cifras
    const formatRevenue = (val?: number) => {
        if (val == null) return '—';
        if (val >= 1e9) return `$${(val / 1e9).toFixed(2)} B`;
        if (val >= 1e6) return `$${(val / 1e6).toFixed(1)} M`;
        return `$${val.toLocaleString()}`;
    };

    const formatMarketCap = (val?: number) => {
        if (val == null) return '—';
        if (val >= 1e12) return `$${(val / 1e12).toFixed(2)} T`;
        if (val >= 1e9) return `$${(val / 1e9).toFixed(1)} B`;
        return `$${(val / 1e6).toFixed(0)} M`;
    };

    // Helper de impacto y colores
    const getImpactBadge = (score?: number, imp?: string) => {
        const s = score ?? 50;
        if (s >= 90 || imp === 'CRITICAL') {
            return {
                label: 'CRITICAL',
                badgeClass: 'bg-purple-600/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-black',
                dotClass: 'bg-purple-500',
            };
        }
        if (s >= 70 || imp === 'HIGH') {
            return {
                label: 'HIGH',
                badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold',
                dotClass: 'bg-rose-500',
            };
        }
        if (s >= 40 || imp === 'MEDIUM') {
            return {
                label: 'MEDIUM',
                badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold',
                dotClass: 'bg-amber-500',
            };
        }
        return {
            label: 'LOW',
            badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30',
            dotClass: 'bg-slate-400',
        };
    };

    // Filtrado dinámico de Balances S&P 500 (Preservado)
    const filteredEarnings = useMemo(() => {
        return earnings.filter((item) => {
            if (earningsSearch.trim()) {
                const q = earningsSearch.toLowerCase().trim();
                const matchTicker = item.ticker.toLowerCase().includes(q);
                const matchName = item.companyName.toLowerCase().includes(q);
                if (!matchTicker && !matchName) return false;
            }

            if (earningsPeriod === 'TODAY') {
                return item.date === todayStr;
            }

            if (earningsPeriod === 'CUSTOM') {
                return item.date === selectedDate;
            }

            if (earningsPeriod === 'WEEK') {
                const now = new Date();
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(now.setDate(diff));
                const sunday = new Date(monday.getTime() + 6 * 24 * 3600 * 1000);
                const monStr = monday.toISOString().substring(0, 10);
                const sunStr = sunday.toISOString().substring(0, 10);
                return item.date >= monStr && item.date <= sunStr;
            }

            if (earningsPeriod === 'MONTH') {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().substring(0, 10);
                return item.date >= start && item.date <= end;
            }

            return true;
        });
    }, [earnings, earningsPeriod, selectedDate, earningsSearch, todayStr]);

    // Filtrado dinámico de Eventos Macroeconómicos / Mercado
    const filteredMacroEvents = useMemo(() => {
        return events.filter((e) => {
            // Filtro por Búsqueda
            if (macroSearch.trim()) {
                const q = macroSearch.toLowerCase().trim();
                const matchTitle = e.title.toLowerCase().includes(q);
                const matchDesc = e.description?.toLowerCase().includes(q);
                const matchTicker = e.ticker?.toLowerCase().includes(q);
                const matchCompany = e.companyName?.toLowerCase().includes(q);
                const matchSource = e.sourceName?.toLowerCase().includes(q) || e.source?.toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchTicker && !matchCompany && !matchSource) return false;
            }

            // Filtro por Categoría
            if (macroCategoryFilter !== 'ALL') {
                if (macroCategoryFilter === 'MACRO' && (e.category === 'MACROECONOMIC' || e.category === 'ACTIVITY')) {
                    // Match
                } else if (macroCategoryFilter === 'RATES' && (e.category === 'MONETARY_POLICY' || e.category === 'INTEREST_RATES')) {
                    // Match
                } else if (macroCategoryFilter === 'INFLATION' && e.category === 'INFLATION') {
                    // Match
                } else if (macroCategoryFilter === 'EMPLOYMENT' && e.category === 'EMPLOYMENT') {
                    // Match
                } else if (macroCategoryFilter === 'GDP' && (e.category === 'GDP' || e.category === 'ACTIVITY')) {
                    // Match
                } else if (macroCategoryFilter === 'CENTRAL_BANK' && (e.category === 'CENTRAL_BANK' || e.category === 'MONETARY_POLICY')) {
                    // Match
                } else if (macroCategoryFilter === 'CORPORATE' && (e.category === 'CORPORATE_EVENT' || e.eventType === 'CORPORATE_EVENT')) {
                    // Match
                } else if (macroCategoryFilter === 'IPO' && e.category === 'IPO') {
                    // Match
                } else if (macroCategoryFilter === 'DIVIDEND' && e.category === 'DIVIDEND') {
                    // Match
                } else if (e.category !== macroCategoryFilter) {
                    return false;
                }
            }

            // Filtro por País
            if (macroCountryFilter !== 'ALL') {
                if (e.country !== macroCountryFilter) return false;
            }

            // Filtro por Impacto
            if (macroImpactFilter !== 'ALL') {
                const s = e.impactScore ?? e.marketImpactScore ?? 50;
                if (macroImpactFilter === 'CRITICAL' && s < 90) return false;
                if (macroImpactFilter === 'HIGH' && (s < 70 || s >= 90)) return false;
                if (macroImpactFilter === 'MEDIUM' && (s < 40 || s >= 70)) return false;
                if (macroImpactFilter === 'LOW' && s >= 40) return false;
            }

            // Filtro por Estado
            if (macroStatusFilter !== 'ALL') {
                if (e.status !== macroStatusFilter) return false;
            }

            // Filtro por Fecha
            if (macroPeriodFilter === 'TODAY') {
                if (e.date !== todayStr) return false;
            } else if (macroPeriodFilter === 'CUSTOM') {
                if (e.date !== macroCustomDate) return false;
            } else if (macroPeriodFilter === 'WEEK') {
                const now = new Date();
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(now.setDate(diff));
                const sunday = new Date(monday.getTime() + 6 * 24 * 3600 * 1000);
                const monStr = monday.toISOString().substring(0, 10);
                const sunStr = sunday.toISOString().substring(0, 10);
                if (e.date < monStr || e.date > sunStr) return false;
            } else if (macroPeriodFilter === 'MONTH') {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().substring(0, 10);
                if (e.date < start || e.date > end) return false;
            }

            return true;
        });
    }, [events, macroSearch, macroCategoryFilter, macroCountryFilter, macroImpactFilter, macroStatusFilter, macroPeriodFilter, macroCustomDate, todayStr]);

    // Estadísticas para Eventos Macroeconómicos
    const macroStats = useMemo(() => {
        const total = events.length;
        const published = events.filter(e => e.status === 'PUBLISHED' || e.isPublished).length;
        const critical = events.filter(e => (e.impactScore ?? e.marketImpactScore ?? 0) >= 90).length;
        const pending = events.filter(e => e.status === 'PENDING_REVIEW').length;
        const activeSourcesCount = sources.filter(s => s.isActive).length;
        return { total, published, critical, pending, activeSourcesCount };
    }, [events, sources]);

    // Estadísticas para Balances
    const bmoCount = useMemo(() => filteredEarnings.filter(e => e.reportTiming === 'BMO').length, [filteredEarnings]);
    const amcCount = useMemo(() => filteredEarnings.filter(e => e.reportTiming === 'AMC').length, [filteredEarnings]);
    const avgScore = useMemo(() => {
        if (filteredEarnings.length === 0) return 0;
        const total = filteredEarnings.reduce((acc, curr) => acc + (curr.earningsImpactScore || 0), 0);
        return Math.round(total / filteredEarnings.length);
    }, [filteredEarnings]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-primary" />
                        Gestión de Calendario
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Agregador institucional de eventos de mercado, política monetaria y balances del S&P 500.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 rounded-xl bg-card border border-border text-foreground hover:bg-muted text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Crear manual
                    </button>

                    {activeTab === 'ECONOMIC' ? (
                        <>
                            <button
                                onClick={() => setShowSourcesModal(true)}
                                className="px-3.5 py-2 rounded-xl bg-card border border-border text-foreground hover:bg-muted text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                                title="Configurar fuentes activas"
                            >
                                <Database className="w-4 h-4 text-primary" />
                                Fuentes ({sources.length})
                            </button>
                            <button
                                onClick={triggerSyncMacro}
                                disabled={isSyncingMacro}
                                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:opacity-90 shadow-md transition-all disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isSyncingMacro ? 'animate-spin' : ''}`} />
                                {isSyncingMacro ? 'Sincronizando...' : 'Sincronizar Macro'}
                            </button>
                            <button
                                onClick={triggerSyncAll}
                                disabled={isSyncingAll}
                                className="px-3.5 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold flex items-center gap-1.5 hover:bg-secondary/80 transition-colors disabled:opacity-50"
                                title="Sincronizar fuentes oficiales y balances corporativos"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                                Todo
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={triggerTradingViewSync}
                            disabled={isSyncingTV}
                            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:opacity-90 shadow-md transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isSyncingTV ? 'animate-spin' : ''}`} />
                            {isSyncingTV ? 'Sincronizando...' : 'Sincronizar S&P 500 (TradingView)'}
                        </button>
                    )}
                </div>
            </div>

            {/* Feedback Alert */}
            {feedback && (
                <div className={`p-4 rounded-xl flex items-center justify-between gap-3 border text-sm animate-in fade-in duration-200 ${
                    feedback.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}>
                    <div className="flex items-center gap-2">
                        {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                        <span>{feedback.message}</span>
                    </div>
                    <button onClick={() => setFeedback(null)} className="text-xs hover:underline font-semibold">Cerrar</button>
                </div>
            )}

            {/* Sync Summary Modal / Alert */}
            {syncResult && (
                <div className="bg-card border border-primary/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> Última Sincronización Inteligente
                            </span>
                            <h4 className="text-sm font-bold text-foreground">{syncResult.message}</h4>
                        </div>
                        <button onClick={() => setSyncResult(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-border/50 text-xs">
                        <div className="bg-muted/40 p-2 rounded-xl">
                            <span className="text-muted-foreground block text-[11px]">Encontrados</span>
                            <span className="font-bold text-foreground text-sm">{syncResult.eventsFound}</span>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                            <span className="text-emerald-600 dark:text-emerald-400 block text-[11px] font-medium">Nuevos Creados</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{syncResult.eventsCreated}</span>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded-xl">
                            <span className="text-blue-600 dark:text-blue-400 block text-[11px] font-medium">Actualizados</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{syncResult.eventsUpdated}</span>
                        </div>
                        <div className="bg-muted/40 p-2 rounded-xl">
                            <span className="text-muted-foreground block text-[11px]">Duplicados Filtrados</span>
                            <span className="font-bold text-foreground text-sm">{syncResult.duplicatesIgnored}</span>
                        </div>
                        <div className="bg-muted/40 p-2 rounded-xl">
                            <span className="text-muted-foreground block text-[11px]">Tiempo</span>
                            <span className="font-mono text-foreground font-semibold text-sm">{(syncResult.durationMs / 1000).toFixed(1)}s</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs Principales */}
            <div className="flex items-center gap-2 border-b border-border pb-3">
                <button
                    onClick={() => setActiveTab('ECONOMIC')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'ECONOMIC'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Globe className="w-4 h-4" />
                    Eventos Macroeconómicos y de Mercado ({events.length})
                </button>
                <button
                    onClick={() => setActiveTab('EARNINGS')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'EARNINGS'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Building2 className="w-4 h-4" />
                    Balances S&P 500 (TradingView) ({earnings.length})
                </button>
            </div>

            {/* ========================================================================= */}
            {/* TAB MACRO / MERCADO: GESTIÓN PROFESIONAL                                  */}
            {/* ========================================================================= */}
            {activeTab === 'ECONOMIC' && (
                <div className="space-y-5">
                    {/* Tarjetas KPI Superiores */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="bg-card border border-border rounded-2xl p-3.5 shadow-sm">
                            <span className="text-xs text-muted-foreground block font-medium">Total Eventos</span>
                            <span className="text-xl font-bold text-foreground mt-0.5 block">{macroStats.total}</span>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-3.5 shadow-sm">
                            <span className="text-xs text-muted-foreground block font-medium flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck className="w-3.5 h-3.5" /> Publicados
                            </span>
                            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{macroStats.published}</span>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-3.5 shadow-sm">
                            <span className="text-xs text-muted-foreground block font-medium flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                <Flame className="w-3.5 h-3.5" /> Críticos / Alta Relevancia
                            </span>
                            <span className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">{macroStats.critical}</span>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-3.5 shadow-sm">
                            <span className="text-xs text-muted-foreground block font-medium flex items-center gap-1 text-amber-500">
                                <HelpCircle className="w-3.5 h-3.5" /> Por Revisar
                            </span>
                            <span className="text-xl font-bold text-amber-500 mt-0.5 block">{macroStats.pending}</span>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-3.5 shadow-sm">
                            <span className="text-xs text-muted-foreground block font-medium flex items-center gap-1">
                                <Database className="w-3.5 h-3.5 text-primary" /> Fuentes Activas
                            </span>
                            <span className="text-xl font-bold text-foreground mt-0.5 block">{macroStats.activeSourcesCount} / {sources.length}</span>
                        </div>
                    </div>

                    {/* Categorías Rápidas (Pills) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
                        {[
                            { key: 'ALL', label: 'Todos los Eventos' },
                            { key: 'MACRO', label: 'Macroeconómico' },
                            { key: 'RATES', label: 'Tasas & Fed' },
                            { key: 'INFLATION', label: 'Inflación / CPI' },
                            { key: 'EMPLOYMENT', label: 'Empleo / NFP' },
                            { key: 'GDP', label: 'PIB / Actividad' },
                            { key: 'CENTRAL_BANK', label: 'Bancos Centrales' },
                            { key: 'CORPORATE', label: 'Corporativos / Tech' },
                            { key: 'IPO', label: 'Salidas a Bolsa (IPO)' },
                            { key: 'DIVIDEND', label: 'Dividendos' },
                        ].map((cat) => (
                            <button
                                key={cat.key}
                                onClick={() => setMacroCategoryFilter(cat.key)}
                                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
                                    macroCategoryFilter === cat.key
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                        : 'bg-card border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Barra de Filtros Avanzados */}
                    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                {/* País */}
                                <select
                                    value={macroCountryFilter}
                                    onChange={e => setMacroCountryFilter(e.target.value)}
                                    className="p-2 bg-muted/60 border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none"
                                >
                                    <option value="ALL">🌍 Todos los Países</option>
                                    <option value="US">🇺🇸 Estados Unidos</option>
                                    <option value="AR">🇦🇷 Argentina</option>
                                    <option value="GLOBAL">🌐 Global</option>
                                </select>

                                {/* Impacto */}
                                <select
                                    value={macroImpactFilter}
                                    onChange={e => setMacroImpactFilter(e.target.value)}
                                    className="p-2 bg-muted/60 border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none"
                                >
                                    <option value="ALL">⚡ Impacto: Todos</option>
                                    <option value="CRITICAL">🔥 CRITICAL (Score 90-100)</option>
                                    <option value="HIGH">🔴 HIGH (Score 70-89)</option>
                                    <option value="MEDIUM">🟡 MEDIUM (Score 40-69)</option>
                                    <option value="LOW">⚪ LOW (Score 0-39)</option>
                                </select>

                                {/* Estado */}
                                <select
                                    value={macroStatusFilter}
                                    onChange={e => setMacroStatusFilter(e.target.value)}
                                    className="p-2 bg-muted/60 border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none"
                                >
                                    <option value="ALL">📋 Estado: Todos</option>
                                    <option value="PUBLISHED">✅ Publicados</option>
                                    <option value="APPROVED">🔵 Aprobados</option>
                                    <option value="PENDING_REVIEW">⏳ Por Revisar</option>
                                    <option value="DRAFT">📝 Borrador</option>
                                    <option value="HIDDEN">👁️‍🗨️ Ocultos</option>
                                </select>

                                {/* Período */}
                                <div className="flex items-center bg-muted/60 border border-border rounded-xl p-0.5 text-xs font-semibold">
                                    <button
                                        onClick={() => setMacroPeriodFilter('ALL')}
                                        className={`px-2.5 py-1 rounded-lg transition-colors ${macroPeriodFilter === 'ALL' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        onClick={() => setMacroPeriodFilter('TODAY')}
                                        className={`px-2.5 py-1 rounded-lg transition-colors ${macroPeriodFilter === 'TODAY' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Hoy
                                    </button>
                                    <button
                                        onClick={() => setMacroPeriodFilter('WEEK')}
                                        className={`px-2.5 py-1 rounded-lg transition-colors ${macroPeriodFilter === 'WEEK' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Semana
                                    </button>
                                    <button
                                        onClick={() => setMacroPeriodFilter('MONTH')}
                                        className={`px-2.5 py-1 rounded-lg transition-colors ${macroPeriodFilter === 'MONTH' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Mes
                                    </button>
                                </div>

                                {macroPeriodFilter === 'CUSTOM' && (
                                    <input
                                        type="date"
                                        value={macroCustomDate}
                                        onChange={e => setMacroCustomDate(e.target.value)}
                                        className="p-1.5 bg-muted/60 border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none"
                                    />
                                )}
                            </div>

                            {/* Buscador */}
                            <div className="relative min-w-[260px]">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar por título, ticker, fuente..."
                                    value={macroSearch}
                                    onChange={e => setMacroSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-muted/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                {macroSearch && (
                                    <button
                                        onClick={() => setMacroSearch('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Eventos Macroeconómicos */}
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <span>Cargando eventos de mercado...</span>
                        </div>
                    ) : filteredMacroEvents.length === 0 ? (
                        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-4 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-base text-foreground">
                                    No se encontraron eventos con los filtros seleccionados
                                </h3>
                                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                    Podés sincronizar las fuentes automáticas o crear un evento manualmente.
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 pt-2">
                                <button
                                    onClick={triggerSyncMacro}
                                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                                >
                                    Sincronizar Macro Ahora
                                </button>
                                <button
                                    onClick={() => {
                                        setMacroCategoryFilter('ALL');
                                        setMacroCountryFilter('ALL');
                                        setMacroImpactFilter('ALL');
                                        setMacroStatusFilter('ALL');
                                        setMacroPeriodFilter('ALL');
                                        setMacroSearch('');
                                    }}
                                    className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
                                >
                                    Limpiar Filtros
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-border/60 bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            <th className="p-3.5">País</th>
                                            <th className="p-3.5">Fecha / Hora</th>
                                            <th className="p-3.5">Título & Categoría</th>
                                            <th className="p-3.5">Impacto</th>
                                            <th className="p-3.5">Consenso / Datos</th>
                                            <th className="p-3.5">Origen & Estado</th>
                                            <th className="p-3.5 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {filteredMacroEvents.map((e) => {
                                            const impactBadge = getImpactBadge(e.impactScore ?? e.marketImpactScore, e.importance);
                                            const flag = e.country === 'AR' ? '🇦🇷' : e.country === 'US' ? '🇺🇸' : '🌐';
                                            const hasActual = Boolean(e.actualValue);

                                            return (
                                                <tr key={e.id} className="hover:bg-muted/40 transition-colors">
                                                    {/* País */}
                                                    <td className="p-3.5">
                                                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                                                            <span className="text-base">{flag}</span>
                                                            <span className="text-xs">{e.country}</span>
                                                        </div>
                                                    </td>

                                                    {/* Fecha / Hora */}
                                                    <td className="p-3.5">
                                                        <div className="space-y-0.5">
                                                            <div className="font-mono text-xs font-semibold text-foreground">{e.date}</div>
                                                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                                                                <span>{e.time || '14:00'}</span>
                                                                <span className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground">
                                                                    {e.timezone?.includes('Argentina') ? 'ART' : e.timezone?.includes('York') ? 'ET' : 'UTC'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Título & Categoría */}
                                                    <td className="p-3.5 max-w-sm">
                                                        <div className="space-y-1">
                                                            <div className="font-bold text-foreground text-sm leading-snug">
                                                                {e.ticker && (
                                                                    <span className="inline-block px-1.5 py-0.2 mr-1.5 rounded text-[10px] font-black bg-primary/15 text-primary border border-primary/25">
                                                                        {e.ticker}
                                                                    </span>
                                                                )}
                                                                {e.title}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary/80 text-muted-foreground border border-border/50">
                                                                    {e.category}
                                                                </span>
                                                                {e.companyName && (
                                                                    <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                                                                        {e.companyName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Impacto */}
                                                    <td className="p-3.5">
                                                        <div className="space-y-1">
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs ${impactBadge.badgeClass}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${impactBadge.dotClass}`} />
                                                                {impactBadge.label}
                                                            </span>
                                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                                Score: <span className="font-bold text-foreground">{e.impactScore ?? e.marketImpactScore ?? 50}</span>/100
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Consenso & Datos */}
                                                    <td className="p-3.5 font-mono text-xs">
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-muted-foreground text-[11px]">Consenso:</span>
                                                                <span className="font-bold text-foreground">{e.consensusValue || '—'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[11px]">
                                                                <span className="text-muted-foreground">Anterior:</span>
                                                                <span className="text-foreground">{e.previousValue || '—'}</span>
                                                            </div>
                                                            {hasActual && (
                                                                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                                                    <span>Actual:</span>
                                                                    <span>{e.actualValue}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Origen & Estado */}
                                                    <td className="p-3.5">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs font-semibold text-foreground max-w-[140px] truncate block" title={e.sourceName || e.source}>
                                                                    {e.sourceName || e.source || 'Oficial'}
                                                                </span>
                                                                {e.sourceUrl && (
                                                                    <a
                                                                        href={e.sourceUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-primary hover:opacity-80 inline-flex"
                                                                        title="Ver sitio web original"
                                                                    >
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                    e.status === 'PUBLISHED'
                                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                                        : e.status === 'APPROVED'
                                                                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                                                            : e.status === 'PENDING_REVIEW'
                                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                                                : 'bg-muted text-muted-foreground border border-border'
                                                                }`}>
                                                                    {e.status || (e.isPublished ? 'PUBLISHED' : 'DRAFT')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Acciones */}
                                                    <td className="p-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {/* Ver Detalle */}
                                                            <button
                                                                onClick={() => {
                                                                    setViewingEvent(e);
                                                                    setShowDetailModal(true);
                                                                }}
                                                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                                title="Ver detalle completo"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>

                                                            {/* Editar */}
                                                            <button
                                                                onClick={() => {
                                                                    setEditingEvent({ ...e });
                                                                    setShowEditModal(true);
                                                                }}
                                                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                                title="Editar evento"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>

                                                            {/* Toggle Publicar / Aprobar */}
                                                            <button
                                                                onClick={() => updateEventStatus(e.id, e.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED')}
                                                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                                title={e.status === 'PUBLISHED' ? 'Ocultar evento' : 'Publicar evento'}
                                                            >
                                                                {e.status === 'PUBLISHED' ? (
                                                                    <Check className="w-4 h-4 text-emerald-500" />
                                                                ) : (
                                                                    <EyeOff className="w-4 h-4 text-muted-foreground/60" />
                                                                )}
                                                            </button>

                                                            {/* Eliminar */}
                                                            <button
                                                                onClick={() => deleteEvent(e.id)}
                                                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                                                                title="Eliminar evento"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
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
            )}

            {/* ========================================================================= */}
            {/* TAB EARNINGS S&P 500 (PRESERVADO INTACTO Y TOTALMENTE FUNCIONAL)           */}
            {/* ========================================================================= */}
            {activeTab === 'EARNINGS' && (
                <div className="space-y-4">
                    {/* Barra de Filtros de Balances */}
                    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            {/* Filtros Rápidos de Tiempo */}
                            <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                    onClick={() => setEarningsPeriod('TODAY')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        earningsPeriod === 'TODAY'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Hoy ({earnings.filter(e => e.date === todayStr).length})
                                </button>
                                <button
                                    onClick={() => setEarningsPeriod('WEEK')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        earningsPeriod === 'WEEK'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    Esta Semana
                                </button>
                                <button
                                    onClick={() => setEarningsPeriod('MONTH')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        earningsPeriod === 'MONTH'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    Este Mes
                                </button>
                                <button
                                    onClick={() => setEarningsPeriod('ALL')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        earningsPeriod === 'ALL'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    Todos ({earnings.length})
                                </button>
                            </div>

                            {/* Selector de Fecha Personalizada & Buscador */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <div className="flex items-center gap-1.5 bg-muted/60 border border-border px-2.5 py-1 rounded-xl text-xs">
                                    <span className="text-muted-foreground font-medium">Fecha:</span>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => {
                                            setSelectedDate(e.target.value);
                                            setEarningsPeriod('CUSTOM');
                                        }}
                                        className="bg-transparent border-0 text-foreground font-semibold text-xs focus:outline-none"
                                    />
                                </div>

                                <div className="relative min-w-[220px]">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por ticker o empresa..."
                                        value={earningsSearch}
                                        onChange={(e) => setEarningsSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-muted/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    {earningsSearch && (
                                        <button
                                            onClick={() => setEarningsSearch('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tarjetas de Métricas Rápidas */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50">
                            <div className="bg-muted/30 border border-border/40 rounded-xl p-2.5">
                                <span className="text-[11px] text-muted-foreground block font-medium">Empresas en Vista</span>
                                <span className="text-lg font-bold text-foreground">{filteredEarnings.length}</span>
                            </div>
                            <div className="bg-muted/30 border border-border/40 rounded-xl p-2.5">
                                <span className="text-[11px] text-muted-foreground block font-medium flex items-center gap-1">
                                    <Sun className="w-3 h-3 text-amber-500" /> Antes de Apertura (BMO)
                                </span>
                                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{bmoCount}</span>
                            </div>
                            <div className="bg-muted/30 border border-border/40 rounded-xl p-2.5">
                                <span className="text-[11px] text-muted-foreground block font-medium flex items-center gap-1">
                                    <Moon className="w-3 h-3 text-indigo-400" /> Tras el Cierre (AMC)
                                </span>
                                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{amcCount}</span>
                            </div>
                            <div className="bg-muted/30 border border-border/40 rounded-xl p-2.5">
                                <span className="text-[11px] text-muted-foreground block font-medium flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-primary" /> Impacto Promedio
                                </span>
                                <span className="text-lg font-bold text-primary">{avgScore} pts</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Balances */}
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <span>Cargando balances de TradingView...</span>
                        </div>
                    ) : filteredEarnings.length === 0 ? (
                        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-4 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                                <CalendarIcon className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-base text-foreground">
                                    No hay empresas del S&P 500 con balances en esta selección
                                </h3>
                                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                    {earningsPeriod === 'TODAY'
                                        ? `Hoy (${todayStr}) no hay reportes de resultados programados para empresas del S&P 500 según TradingView Scanner.`
                                        : earningsPeriod === 'CUSTOM'
                                            ? `Para la fecha ${selectedDate} no se registran presentaciones de balances del S&P 500.`
                                            : 'No se encontraron resultados con los filtros aplicados.'}
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 pt-2">
                                <button
                                    onClick={() => setEarningsPeriod('WEEK')}
                                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                                >
                                    Ver balances de esta semana
                                </button>
                                <button
                                    onClick={() => setEarningsPeriod('ALL')}
                                    className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
                                >
                                    Ver todos los balances ({earnings.length})
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-border/60 bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            <th className="p-4">Empresa (S&P 500)</th>
                                            <th className="p-4">Fecha Reporte</th>
                                            <th className="p-4">Horario / Sesión</th>
                                            <th className="p-4">EPS Est. (TV)</th>
                                            <th className="p-4">Facturación Est.</th>
                                            <th className="p-4">Market Cap</th>
                                            <th className="p-4">Impacto</th>
                                            <th className="p-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {filteredEarnings.map((e) => {
                                            const isToday = e.date === todayStr;
                                            const timing = e.reportTiming || 'AMC';

                                            return (
                                                <tr key={e.id} className="hover:bg-muted/40 transition-colors">
                                                    {/* Empresa & Logo */}
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            {e.logoUrl ? (
                                                                <img
                                                                    src={e.logoUrl}
                                                                    alt={e.ticker}
                                                                    className="w-8 h-8 rounded-full border border-border/50 object-contain bg-white dark:bg-card p-0.5 flex-shrink-0"
                                                                    onError={(ev) => {
                                                                        (ev.target as HTMLElement).style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                                                                    {e.ticker.substring(0, 2)}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-bold text-foreground text-sm">{e.ticker}</span>
                                                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                                                        S&P 500
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-muted-foreground block truncate max-w-[200px]" title={e.companyName}>
                                                                    {e.companyName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Fecha */}
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-mono text-xs font-medium text-foreground">{e.date}</span>
                                                            {isToday && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
                                                                    HOY
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Horario / Timing */}
                                                    <td className="p-4">
                                                        {timing === 'BMO' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                                <Sun className="w-3.5 h-3.5" />
                                                                Antes de Apertura (08:30)
                                                            </span>
                                                        ) : timing === 'AMC' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                                                <Moon className="w-3.5 h-3.5" />
                                                                Tras el Cierre (16:30)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-muted text-muted-foreground">
                                                                Durante la Rueda
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* EPS Estimado */}
                                                    <td className="p-4 font-mono text-xs font-bold text-foreground">
                                                        {e.epsEstimate != null ? `$${e.epsEstimate.toFixed(2)}` : '—'}
                                                    </td>

                                                    {/* Facturación */}
                                                    <td className="p-4 font-mono text-xs text-foreground">
                                                        {formatRevenue(e.revenueEstimate)}
                                                    </td>

                                                    {/* Market Cap */}
                                                    <td className="p-4 font-mono text-xs text-muted-foreground">
                                                        {formatMarketCap(e.marketCap)}
                                                    </td>

                                                    {/* Score de Impacto */}
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                                                                e.earningsImpactScore >= 80
                                                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                            }`}>
                                                                Score {e.earningsImpactScore}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Acciones */}
                                                    <td className="p-4 text-right">
                                                        <button
                                                            onClick={() => deleteEvent(e.id)}
                                                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                                                            title="Eliminar registro"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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
            )}

            {/* ========================================================================= */}
            {/* MODAL DE DETALLE DEL EVENTO                                               */}
            {/* ========================================================================= */}
            {showDetailModal && viewingEvent && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-start justify-between pb-3 border-b border-border">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                    {viewingEvent.country} • {viewingEvent.category}
                                </span>
                                <h3 className="font-bold text-lg text-foreground mt-0.5">{viewingEvent.title}</h3>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>

                        {viewingEvent.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/50">
                                {viewingEvent.description}
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-muted/40 p-3 rounded-xl border border-border/40">
                                <span className="text-muted-foreground block text-[11px]">Fecha & Hora</span>
                                <span className="font-semibold text-foreground">{viewingEvent.date} {viewingEvent.time || '14:00'} ({viewingEvent.timezone || 'UTC'})</span>
                            </div>
                            <div className="bg-muted/40 p-3 rounded-xl border border-border/40">
                                <span className="text-muted-foreground block text-[11px]">Impacto de Mercado</span>
                                <span className="font-bold text-foreground">{viewingEvent.impactScore ?? viewingEvent.marketImpactScore ?? 50}/100 ({viewingEvent.importance})</span>
                            </div>
                            <div className="bg-muted/40 p-3 rounded-xl border border-border/40">
                                <span className="text-muted-foreground block text-[11px]">Consenso / Pronóstico</span>
                                <span className="font-semibold text-foreground">Consenso: {viewingEvent.consensusValue || '—'} | Anterior: {viewingEvent.previousValue || '—'}</span>
                            </div>
                            <div className="bg-muted/40 p-3 rounded-xl border border-border/40">
                                <span className="text-muted-foreground block text-[11px]">Dato Actual Publicado</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{viewingEvent.actualValue || 'Pendiente de publicación'}</span>
                            </div>
                        </div>

                        {/* Fuente y Fingerprint */}
                        <div className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Fuente Proveedora:</span>
                                <span className="font-semibold text-foreground">{viewingEvent.sourceName || viewingEvent.source || 'Oficial'}</span>
                            </div>
                            {viewingEvent.sourceUrl && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Enlace Oficial:</span>
                                    <a
                                        href={viewingEvent.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline flex items-center gap-1 font-semibold"
                                    >
                                        Ver fuente original <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            )}
                            {viewingEvent.eventFingerprint && (
                                <div className="pt-1 border-t border-border/40">
                                    <span className="text-[10px] text-muted-foreground block">Huella Canónica (Deduplicación):</span>
                                    <span className="font-mono text-[10px] text-muted-foreground break-all">{viewingEvent.eventFingerprint}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground font-semibold text-xs transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL DE GESTIÓN DE FUENTES                                               */}
            {/* ========================================================================= */}
            {showSourcesModal && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-border flex-shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                    <Database className="w-5 h-5 text-primary" />
                                    Fuentes Institucionales del Calendario
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Adaptadores oficiales, financieros y APIs institucionales con deduplicación y prioridad.
                                </p>
                            </div>
                            <button onClick={() => setShowSourcesModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>

                        <div className="overflow-y-auto divide-y divide-border/40 flex-1 pr-1 space-y-2">
                            {sources.map((src) => {
                                const isSyncingThis = syncingSourceId === src.id;

                                return (
                                    <div key={src.id} className="py-2.5 flex items-center justify-between gap-4">
                                        <div className="space-y-0.5 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-foreground">{src.name}</span>
                                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                                                    Prioridad {src.priority}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {src.country}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate" title={src.baseUrl}>
                                                {src.baseUrl || src.apiUrl || 'Feed Directo Institucional'}
                                            </p>
                                            {src.lastSyncAt && (
                                                <span className="text-[10px] text-muted-foreground/70 block">
                                                    Última sincr: {new Date(src.lastSyncAt).toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {/* Sincronizar Fuente */}
                                            <button
                                                onClick={() => triggerSyncSource(src.id, src.name)}
                                                disabled={isSyncingThis || !src.isActive}
                                                className="px-2.5 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                                title="Sincronizar eventos de esta fuente ahora"
                                            >
                                                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin' : ''}`} />
                                                {isSyncingThis ? 'Sincronizando...' : 'Sincronizar'}
                                            </button>

                                            {/* Toggle Activo */}
                                            <button
                                                onClick={() => toggleSourceActive(src.id, src.isActive)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                                    src.isActive
                                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                        : 'bg-muted text-muted-foreground border-border'
                                                }`}
                                            >
                                                {src.isActive ? 'Activa' : 'Inactiva'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end pt-3 border-t border-border flex-shrink-0">
                            <button
                                onClick={() => setShowSourcesModal(false)}
                                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity"
                            >
                                Listo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL DE EDICIÓN DE EVENTO                                                */}
            {/* ========================================================================= */}
            {showEditModal && editingEvent && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                            <h3 className="font-bold text-lg text-foreground">Editar Evento de Mercado</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>

                        <form onSubmit={handleUpdateEvent} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">País</label>
                                    <select
                                        value={editingEvent.country}
                                        onChange={e => setEditingEvent({ ...editingEvent, country: e.target.value })}
                                        className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                    >
                                        <option value="US">🇺🇸 Estados Unidos</option>
                                        <option value="AR">🇦🇷 Argentina</option>
                                        <option value="GLOBAL">🌐 Global</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Categoría</label>
                                    <select
                                        value={editingEvent.category}
                                        onChange={e => setEditingEvent({ ...editingEvent, category: e.target.value })}
                                        className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                    >
                                        <option value="MONETARY_POLICY">Tasas & Política Monetaria</option>
                                        <option value="INFLATION">Inflación / Precios</option>
                                        <option value="EMPLOYMENT">Empleo / NFP</option>
                                        <option value="GDP">PIB / Crecimiento</option>
                                        <option value="CENTRAL_BANK">Banco Central / Fed</option>
                                        <option value="CORPORATE_EVENT">Evento Corporativo / Tech</option>
                                        <option value="IPO">IPO / Salida a Bolsa</option>
                                        <option value="DIVIDEND">Dividendos</option>
                                        <option value="MACROECONOMIC">Macroeconómico General</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    value={editingEvent.title}
                                    onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                                    className="w-full p-2.5 bg-background border border-input rounded-xl text-foreground text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Descripción / Análisis</label>
                                <textarea
                                    rows={2}
                                    value={editingEvent.description || ''}
                                    onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })}
                                    className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        value={editingEvent.date}
                                        onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value })}
                                        className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Hora</label>
                                    <input
                                        type="text"
                                        value={editingEvent.time || ''}
                                        onChange={e => setEditingEvent({ ...editingEvent, time: e.target.value })}
                                        className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Consenso</label>
                                    <input
                                        type="text"
                                        value={editingEvent.consensusValue || ''}
                                        onChange={e => setEditingEvent({ ...editingEvent, consensusValue: e.target.value })}
                                        className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Anterior</label>
                                    <input
                                        type="text"
                                        value={editingEvent.previousValue || ''}
                                        onChange={e => setEditingEvent({ ...editingEvent, previousValue: e.target.value })}
                                        className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Actual</label>
                                    <input
                                        type="text"
                                        value={editingEvent.actualValue || ''}
                                        onChange={e => setEditingEvent({ ...editingEvent, actualValue: e.target.value })}
                                        className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Impact Score (0-100)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={editingEvent.impactScore ?? editingEvent.marketImpactScore ?? 50}
                                        onChange={e => setEditingEvent({ ...editingEvent, impactScore: parseInt(e.target.value, 10) || 50 })}
                                        className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Estado</label>
                                    <select
                                        value={editingEvent.status || (editingEvent.isPublished ? 'PUBLISHED' : 'DRAFT')}
                                        onChange={e => setEditingEvent({ ...editingEvent, status: e.target.value })}
                                        className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                    >
                                        <option value="PUBLISHED">PUBLISHED (Público)</option>
                                        <option value="APPROVED">APPROVED (Aprobado)</option>
                                        <option value="PENDING_REVIEW">PENDING_REVIEW (Por Revisar)</option>
                                        <option value="DRAFT">DRAFT (Borrador)</option>
                                        <option value="HIDDEN">HIDDEN (Oculto)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Enlace Fuente Original (URL)</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={editingEvent.sourceUrl || ''}
                                    onChange={e => setEditingEvent({ ...editingEvent, sourceUrl: e.target.value })}
                                    className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground font-semibold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 shadow-sm transition-opacity"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL DE CREACIÓN MANUAL                                                  */}
            {/* ========================================================================= */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                            <h3 className="font-bold text-lg text-foreground">Crear Evento Manual</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>

                        {/* Selector de Tipo de Evento */}
                        <div className="flex rounded-xl bg-muted p-1 border border-border/50 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setCreateEventType('ECONOMIC')}
                                className={`flex-1 py-1.5 rounded-lg transition-all ${
                                    createEventType === 'ECONOMIC'
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Macroeconómico
                            </button>
                            <button
                                type="button"
                                onClick={() => setCreateEventType('CORPORATE_EVENT')}
                                className={`flex-1 py-1.5 rounded-lg transition-all ${
                                    createEventType === 'CORPORATE_EVENT'
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Corporativo / Keynote
                            </button>
                            <button
                                type="button"
                                onClick={() => setCreateEventType('EARNINGS')}
                                className={`flex-1 py-1.5 rounded-lg transition-all ${
                                    createEventType === 'EARNINGS'
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Balances S&P 500
                            </button>
                        </div>

                        <form onSubmit={handleCreateManual} className="space-y-4 text-xs">
                            {createEventType !== 'EARNINGS' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">País</label>
                                            <select
                                                value={createForm.country}
                                                onChange={e => setCreateForm({ ...createForm, country: e.target.value })}
                                                className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                            >
                                                <option value="US">🇺🇸 Estados Unidos</option>
                                                <option value="AR">🇦🇷 Argentina</option>
                                                <option value="GLOBAL">🌐 Global</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Categoría</label>
                                            <select
                                                value={createForm.category}
                                                onChange={e => setCreateForm({ ...createForm, category: e.target.value })}
                                                className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                            >
                                                <option value="MONETARY_POLICY">🏛️ Tasas / Fed / BCRA</option>
                                                <option value="INFLATION">📈 Inflación / CPI</option>
                                                <option value="EMPLOYMENT">💼 Empleo / NFP</option>
                                                <option value="GDP">📊 PIB / Actividad</option>
                                                <option value="CENTRAL_BANK">🏦 Banco Central</option>
                                                <option value="CORPORATE_EVENT">🚀 Corporativo / Keynote</option>
                                                <option value="IPO">🔔 IPO</option>
                                                <option value="DIVIDEND">💰 Dividendo</option>
                                                <option value="MACROECONOMIC">🌐 Macroeconómico General</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Título del Evento</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej: FOMC Interest Rate Decision o Apple Keynote"
                                            value={createForm.title}
                                            onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                                            className="w-full p-2.5 bg-background border border-input rounded-xl text-foreground text-xs"
                                        />
                                    </div>

                                    {createEventType === 'CORPORATE_EVENT' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-muted-foreground mb-1">Ticker</label>
                                                <input
                                                    type="text"
                                                    placeholder="AAPL, NVDA, TSLA..."
                                                    value={createForm.ticker}
                                                    onChange={e => setCreateForm({ ...createForm, ticker: e.target.value.toUpperCase() })}
                                                    className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs uppercase font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-muted-foreground mb-1">Empresa</label>
                                                <input
                                                    type="text"
                                                    placeholder="Apple Inc."
                                                    value={createForm.companyName}
                                                    onChange={e => setCreateForm({ ...createForm, companyName: e.target.value })}
                                                    className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Descripción</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Breve contexto del evento para inversores..."
                                            value={createForm.description}
                                            onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                                            className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha</label>
                                            <input
                                                type="date"
                                                required
                                                value={createForm.date}
                                                onChange={e => setCreateForm({ ...createForm, date: e.target.value })}
                                                className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Hora</label>
                                            <input
                                                type="text"
                                                placeholder="14:00"
                                                value={createForm.time}
                                                onChange={e => setCreateForm({ ...createForm, time: e.target.value })}
                                                className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Timezone</label>
                                            <select
                                                value={createForm.timezone}
                                                onChange={e => setCreateForm({ ...createForm, timezone: e.target.value })}
                                                className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                            >
                                                <option value="America/New_York">America/New_York</option>
                                                <option value="America/Argentina/Buenos_Aires">America/Buenos_Aires</option>
                                                <option value="America/Argentina/Cordoba">America/Cordoba</option>
                                                <option value="Europe/London">Europe/London</option>
                                                <option value="UTC">UTC</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Consenso Est.</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: 3.4%"
                                                value={createForm.consensusValue}
                                                onChange={e => setCreateForm({ ...createForm, consensusValue: e.target.value })}
                                                className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Anterior</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: 3.2%"
                                                value={createForm.previousValue}
                                                onChange={e => setCreateForm({ ...createForm, previousValue: e.target.value })}
                                                className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Impact Score (0-100)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={createForm.impactScore}
                                                onChange={e => {
                                                    const s = parseInt(e.target.value, 10) || 50;
                                                    setCreateForm({
                                                        ...createForm,
                                                        impactScore: s,
                                                        importance: s >= 90 ? 'CRITICAL' : s >= 70 ? 'HIGH' : s >= 40 ? 'MEDIUM' : 'LOW',
                                                    });
                                                }}
                                                className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Enlace Fuente Original (URL)</label>
                                        <input
                                            type="url"
                                            placeholder="https://..."
                                            value={createForm.sourceUrl}
                                            onChange={e => setCreateForm({ ...createForm, sourceUrl: e.target.value })}
                                            className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Ticker (S&P 500)</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ej: NVDA"
                                                value={earningsForm.ticker}
                                                onChange={e => setEarningsForm({ ...earningsForm, ticker: e.target.value.toUpperCase() })}
                                                className="w-full p-2.5 bg-background border border-input rounded-xl text-foreground uppercase font-bold text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Timing del Reporte</label>
                                            <select
                                                value={earningsForm.reportTiming}
                                                onChange={e => setEarningsForm({ ...earningsForm, reportTiming: e.target.value })}
                                                className="w-full p-2.5 bg-background border border-input rounded-xl text-foreground text-xs"
                                            >
                                                <option value="AMC">🌙 Tras el Cierre (AMC)</option>
                                                <option value="BMO">☀️ Antes de Apertura (BMO)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre de la Empresa</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej: NVIDIA Corporation"
                                            value={earningsForm.companyName}
                                            onChange={e => setEarningsForm({ ...earningsForm, companyName: e.target.value })}
                                            className="w-full p-2.5 bg-background border border-input rounded-xl text-foreground text-xs"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha</label>
                                            <input
                                                type="date"
                                                required
                                                value={earningsForm.date}
                                                onChange={e => setEarningsForm({ ...earningsForm, date: e.target.value })}
                                                className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">EPS Est. ($)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.75"
                                                value={earningsForm.epsEstimate}
                                                onChange={e => setEarningsForm({ ...earningsForm, epsEstimate: e.target.value })}
                                                className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Facturación Est. ($B)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                placeholder="32.5"
                                                value={earningsForm.revenueEstimate}
                                                onChange={e => setEarningsForm({ ...earningsForm, revenueEstimate: e.target.value })}
                                                className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Impact Score (0-100)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={earningsForm.earningsImpactScore}
                                            onChange={e => setEarningsForm({ ...earningsForm, earningsImpactScore: parseInt(e.target.value, 10) || 80 })}
                                            className="w-full p-2 bg-background border border-input rounded-xl text-foreground text-xs"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground font-semibold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 shadow-sm transition-opacity"
                                >
                                    Guardar Evento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
