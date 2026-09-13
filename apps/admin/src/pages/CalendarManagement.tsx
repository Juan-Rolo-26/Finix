import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { adminFetch } from '../lib/api';

interface CalendarEvent {
    id: string;
    eventType: string;
    country: string;
    title: string;
    category: string;
    importance: string;
    marketImpactScore: number;
    date: string;
    time?: string;
    consensusValue?: string;
    actualValue?: string;
    sourceType: string;
    isPublished: boolean;
}

interface EarningsEvent {
    id: string;
    ticker: string;
    companyName: string;
    date: string;
    time?: string;
    dateStatus: string;
    reportTiming?: string;
    epsEstimate?: number;
    revenueEstimate?: number;
    earningsImpactScore: number;
    isPublished: boolean;
}

export default function CalendarManagement() {
    const [activeTab, setActiveTab] = useState<'ECONOMIC' | 'EARNINGS'>('ECONOMIC');
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Formulario de creación manual
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [createForm, setCreateForm] = useState({
        country: 'US',
        title: '',
        description: '',
        category: 'CENTRAL_BANK',
        importance: 'HIGH',
        marketImpactScore: 90,
        date: new Date().toISOString().substring(0, 10),
        time: '16:00',
        consensusValue: '',
        previousValue: '',
        source: 'Admin Manual',
    });

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await adminFetch(`/calendar/admin/overview`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data.recentEconomic || []);
                setEarnings(data.recentEarnings || []);
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

    const triggerSync = async () => {
        setIsSyncing(true);
        setFeedback(null);
        try {
            const res = await adminFetch('/calendar/admin/sync', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setFeedback({
                    type: 'success',
                    message: `Sincronización completada: ${data.eventsProcessed} eventos procesados`,
                });
                await loadData();
            } else {
                throw new Error('Error en sincronización');
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Error al sincronizar' });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCreateManual = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await adminFetch('/calendar/admin/events', {
                method: 'POST',
                body: JSON.stringify(createForm),
            });
            if (res.ok) {
                setFeedback({ type: 'success', message: 'Evento manual creado con éxito' });
                setShowCreateModal(false);
                await loadData();
            }
        } catch {
            setFeedback({ type: 'error', message: 'Error al crear evento manual' });
        }
    };

    const togglePublish = async (id: string, current: boolean) => {
        try {
            await adminFetch(`/calendar/admin/events/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isPublished: !current }),
            });
            await loadData();
        } catch {
            setFeedback({ type: 'error', message: 'Error al actualizar visibilidad' });
        }
    };

    const deleteEvent = async (id: string) => {
        if (!confirm('¿Eliminar este evento permanentemente?')) return;
        try {
            await adminFetch(`/calendar/admin/events/${id}`, { method: 'DELETE' });
            await loadData();
        } catch {
            setFeedback({ type: 'error', message: 'Error al eliminar evento' });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-primary" />
                        Gestión de Calendario
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Control de eventos económicos macro y resultados corporativos.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1.5 hover:opacity-90 shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        Crear evento manual
                    </button>
                    <button
                        onClick={triggerSync}
                        disabled={isSyncing}
                        className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
                        Sincronizar ahora
                    </button>
                </div>
            </div>

            {/* Feedback Alert */}
            {feedback && (
                <div className={`p-4 rounded-xl flex items-center gap-3 border text-sm ${feedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                    {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-border pb-3">
                <button
                    onClick={() => setActiveTab('ECONOMIC')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'ECONOMIC'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-zinc-800/40 text-zinc-400 hover:text-white'
                        }`}
                >
                    Eventos Económicos ({events.length})
                </button>
                <button
                    onClick={() => setActiveTab('EARNINGS')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'EARNINGS'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-zinc-800/40 text-zinc-400 hover:text-white'
                        }`}
                >
                    Resultados Empresariales ({earnings.length})
                </button>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span>Cargando eventos...</span>
                </div>
            ) : activeTab === 'ECONOMIC' ? (
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-border/60 bg-zinc-900/40 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                <th className="p-4">País</th>
                                <th className="p-4">Fecha/Hora</th>
                                <th className="p-4">Título</th>
                                <th className="p-4">Impacto</th>
                                <th className="p-4">Consenso</th>
                                <th className="p-4">Origen</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {events.map((e) => (
                                <tr key={e.id} className="hover:bg-zinc-800/20 transition-colors">
                                    <td className="p-4 font-bold">{e.country === 'AR' ? '🇦🇷 AR' : '🇺🇸 US'}</td>
                                    <td className="p-4 text-zinc-400 font-mono text-xs">{e.date} {e.time || ''}</td>
                                    <td className="p-4 font-bold text-foreground max-w-xs truncate">{e.title}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${e.importance === 'HIGH' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                            Score {e.marketImpactScore} ({e.importance})
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-zinc-300">{e.consensusValue || '—'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${e.sourceType === 'MANUAL' ? 'bg-purple-500/10 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                            {e.sourceType}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => togglePublish(e.id, e.isPublished)}
                                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                                            title={e.isPublished ? 'Ocultar' : 'Publicar'}
                                        >
                                            {e.isPublished ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-zinc-500" />}
                                        </button>
                                        <button
                                            onClick={() => deleteEvent(e.id)}
                                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-border/60 bg-zinc-900/40 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                <th className="p-4">Ticker</th>
                                <th className="p-4">Empresa</th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Timing</th>
                                <th className="p-4">EPS Est.</th>
                                <th className="p-4">Score</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {earnings.map((e) => (
                                <tr key={e.id} className="hover:bg-zinc-800/20 transition-colors">
                                    <td className="p-4 font-bold text-primary">{e.ticker}</td>
                                    <td className="p-4 font-medium text-foreground">{e.companyName}</td>
                                    <td className="p-4 font-mono text-xs text-zinc-400">{e.date}</td>
                                    <td className="p-4 text-xs text-zinc-300">{e.reportTiming || 'AMC'}</td>
                                    <td className="p-4 font-mono text-xs">${e.epsEstimate != null ? e.epsEstimate.toFixed(2) : '—'}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-400">
                                            {e.earningsImpactScore} pts
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => togglePublish(e.id, e.isPublished)}
                                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                                        >
                                            {e.isPublished ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-zinc-500" />}
                                        </button>
                                        <button
                                            onClick={() => deleteEvent(e.id)}
                                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de Creación Manual */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                            <h3 className="font-bold text-lg text-foreground">Crear Evento Manual</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleCreateManual} className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">País</label>
                                    <select
                                        value={createForm.country}
                                        onChange={e => setCreateForm({ ...createForm, country: e.target.value })}
                                        className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-foreground"
                                    >
                                        <option value="US">🇺🇸 Estados Unidos</option>
                                        <option value="AR">🇦🇷 Argentina</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Categoría</label>
                                    <select
                                        value={createForm.category}
                                        onChange={e => setCreateForm({ ...createForm, category: e.target.value })}
                                        className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-foreground"
                                    >
                                        <option value="CENTRAL_BANK">Banco Central / Fed</option>
                                        <option value="INFLATION">Inflación / Precios</option>
                                        <option value="EMPLOYMENT">Empleo</option>
                                        <option value="ACTIVITY">Actividad / PIB</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Título del Evento</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Discurso extraordinario de Jerome Powell"
                                    value={createForm.title}
                                    onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                                    className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-foreground"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        value={createForm.date}
                                        onChange={e => setCreateForm({ ...createForm, date: e.target.value })}
                                        className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Hora</label>
                                    <input
                                        type="text"
                                        placeholder="16:00"
                                        value={createForm.time}
                                        onChange={e => setCreateForm({ ...createForm, time: e.target.value })}
                                        className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-foreground"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold"
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
