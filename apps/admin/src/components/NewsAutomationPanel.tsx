import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    Database,
    Loader2,
    Play,
    RefreshCw,
    Settings2,
    XCircle,
} from 'lucide-react';
import { adminFetch } from '../lib/api';

type Frequency = 'DAILY' | 'WEEKLY' | 'MANUAL';
type SyncStatus = 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'PENDING' | 'RUNNING';

interface AutomationCategory {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    updateFrequency: Frequency;
    updateHour: number;
    updateMinute: number;
    updateDayOfWeek: number;
    lastUpdatedAt?: string | null;
    nextUpdateAt?: string | null;
}

interface AutomationSource {
    id: string;
    name: string;
    baseUrl?: string | null;
    apiUrl?: string | null;
    rssUrl?: string | null;
    isActive: boolean;
    priority: number;
    reliabilityScore: number;
    lastSuccessfulSync?: string | null;
    lastError?: string | null;
    categoryLinks?: Array<{ priority: number; reliabilityScore: number; isActive: boolean; category: { name: string; slug: string } }>;
}

interface SyncLog {
    id: string;
    startedAt: string;
    finishedAt?: string | null;
    frequency: string;
    status: SyncStatus;
    articlesFound: number;
    articlesCreated: number;
    duplicatesDetected: number;
    failedSources: string[];
}

interface AutomationOverview {
    timeZone: string;
    daily: { status: SyncStatus; lastExecutionAt?: string | null; nextExecutionAt?: string | null };
    weekly: { status: SyncStatus; lastExecutionAt?: string | null; nextExecutionAt?: string | null };
    categories: AutomationCategory[];
    sources: AutomationSource[];
    logs: SyncLog[];
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function formatScheduleDate(value?: string | null) {
    if (!value) return 'Pendiente de calcular';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Cordoba',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function statusMeta(status: SyncStatus) {
    if (status === 'SUCCESS') return { label: 'Correcto', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
    if (status === 'PARTIAL_SUCCESS') return { label: 'Parcial', icon: AlertTriangle, className: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
    if (status === 'FAILED') return { label: 'Error', icon: XCircle, className: 'text-red-600 bg-red-500/10 border-red-500/20' };
    return { label: 'Pendiente', icon: Clock3, className: 'text-muted-foreground bg-secondary border-border' };
}

export default function NewsAutomationPanel() {
    const [overview, setOverview] = useState<AutomationOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    const loadOverview = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminFetch('/admin/news/slots/automation/overview');
            if (!response.ok) throw new Error('No se pudo cargar la automatización');
            setOverview(await response.json());
        } catch (error: any) {
            setMessage(error?.message || 'No se pudo cargar la automatización');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOverview();
    }, [loadOverview]);

    const categories = overview?.categories || [];
    const dailyCategories = useMemo(() => categories.filter((category) => category.updateFrequency === 'DAILY'), [categories]);
    const weeklyCategories = useMemo(() => categories.filter((category) => category.updateFrequency === 'WEEKLY'), [categories]);

    const run = async (scope: 'ALL' | 'DAILY' | 'WEEKLY' | 'CATEGORY' | 'SOURCE', id?: string) => {
        const key = id || scope;
        setRunning(key);
        setMessage('');
        try {
            const response = await adminFetch('/admin/news/slots/automation/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scope, categoryId: scope === 'CATEGORY' ? id : undefined, sourceId: scope === 'SOURCE' ? id : undefined }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.message || 'La actualización no pudo iniciarse');
            setMessage('Actualización finalizada. Revisá el resultado en el historial.');
            await loadOverview();
        } catch (error: any) {
            setMessage(error?.message || 'No se pudo actualizar Noticias');
        } finally {
            setRunning(null);
        }
    };

    const updateCategory = async (category: AutomationCategory, patch: Partial<AutomationCategory>) => {
        setSaving(category.id);
        try {
            const response = await adminFetch(`/admin/news/slots/automation/categories/${category.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || 'No se pudo guardar la categoría');
            }
            await loadOverview();
        } catch (error: any) {
            setMessage(error?.message || 'No se pudo guardar la categoría');
        } finally {
            setSaving(null);
        }
    };

    const updateSource = async (source: AutomationSource, patch: Partial<AutomationSource>) => {
        setSaving(source.id);
        try {
            const response = await adminFetch(`/admin/news/slots/automation/sources/${source.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || 'No se pudo guardar la fuente');
            }
            await loadOverview();
        } catch (error: any) {
            setMessage(error?.message || 'No se pudo guardar la fuente');
        } finally {
            setSaving(null);
        }
    };

    if (loading && !overview) {
        return <div className="rounded-3xl border border-border bg-card p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
    }

    const renderGroup = (title: string, description: string, frequency: 'DAILY' | 'WEEKLY', group: AutomationCategory[], summary: AutomationOverview['daily']) => {
        const meta = statusMeta(summary.status);
        const StatusIcon = meta.icon;
        return (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-5 border-b border-border bg-secondary/20 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground">{title}</h3>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${meta.className}`}>
                                <StatusIcon className="w-3 h-3" /> {meta.label}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{description}</p>
                    </div>
                    <button
                        onClick={() => run(frequency)}
                        disabled={Boolean(running)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                    >
                        {running === frequency ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Actualizar ahora
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 border-b border-border text-xs">
                    <div><span className="text-muted-foreground">Última ejecución</span><p className="font-semibold mt-1">{formatScheduleDate(summary.lastExecutionAt)}</p></div>
                    <div><span className="text-muted-foreground">Próxima ejecución</span><p className="font-semibold mt-1">{formatScheduleDate(summary.nextExecutionAt)}</p></div>
                </div>
                <div className="divide-y divide-border">
                    {group.map((category) => (
                        <div key={category.id} className="p-4 flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 min-w-[180px] flex-1">
                                <input
                                    type="checkbox"
                                    checked={category.isActive}
                                    onChange={(event) => updateCategory(category, { isActive: event.target.checked })}
                                    className="accent-primary"
                                />
                                <span className="text-sm font-semibold">{category.name}</span>
                            </label>
                            <select
                                value={category.updateFrequency}
                                onChange={(event) => updateCategory(category, { updateFrequency: event.target.value as Frequency })}
                                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                            >
                                <option value="DAILY">Diaria</option>
                                <option value="WEEKLY">Semanal</option>
                                <option value="MANUAL">Manual</option>
                            </select>
                            <label className="flex items-center gap-1 text-xs text-muted-foreground">
                                Hora
                                <input
                                    type="time"
                                    value={`${String(category.updateHour).padStart(2, '0')}:${String(category.updateMinute).padStart(2, '0')}`}
                                    onChange={(event) => {
                                        const [hour, minute] = event.target.value.split(':').map(Number);
                                        updateCategory(category, { updateHour: hour, updateMinute: minute });
                                    }}
                                    className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                                />
                            </label>
                            {category.updateFrequency === 'WEEKLY' && (
                                <select
                                    value={category.updateDayOfWeek}
                                    onChange={(event) => updateCategory(category, { updateDayOfWeek: Number(event.target.value) })}
                                    className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                                >
                                    {DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}
                                </select>
                            )}
                            <div className="text-[11px] text-muted-foreground min-w-[150px]">
                                <div>Próxima: {formatScheduleDate(category.nextUpdateAt)}</div>
                                <div>Última: {formatScheduleDate(category.lastUpdatedAt)}</div>
                            </div>
                            <button
                                onClick={() => run('CATEGORY', category.id)}
                                disabled={Boolean(running)}
                                title="Actualizar esta categoría"
                                className="rounded-lg border border-border p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 disabled:opacity-50"
                            >
                                {running === category.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            </button>
                            {saving === category.id && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                        </div>
                    ))}
                    {!group.length && <p className="p-5 text-sm text-muted-foreground">No hay categorías configuradas en este grupo.</p>}
                </div>
            </div>
        );
    };

    return (
        <section className="space-y-4 rounded-3xl border border-border bg-background/60 p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold">Automatización de Noticias</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">La fuente central que publica las noticias visibles en Finix.</p>
                    <p className="text-xs text-muted-foreground mt-1">Zona horaria: {overview?.timeZone || 'America/Argentina/Cordoba'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => run('ALL')} disabled={Boolean(running)} className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary disabled:opacity-50">
                        <Play className="w-4 h-4" /> Actualizar todo
                    </button>
                    <button onClick={loadOverview} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary">
                        <RefreshCw className="w-4 h-4" /> Recargar
                    </button>
                </div>
            </div>

            {message && <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">{message}</div>}

            <div className="grid gap-4">
                {renderGroup('Actualización diaria', 'Procesa juntas Argentina, Mercados, Commodities, Empresas, Criptomonedas y Global.', 'DAILY', dailyCategories, overview?.daily || { status: 'PENDING' })}
                {renderGroup('Actualización semanal', 'Procesa juntas las categorías WEEKLY y cualquier categoría futura configurada con esa frecuencia.', 'WEEKLY', weeklyCategories, overview?.weekly || { status: 'PENDING' })}
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-5 border-b border-border flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    <div><h3 className="font-bold">Fuentes configuradas</h3><p className="text-xs text-muted-foreground">Cada fuente puede alimentar varias categorías y conserva su último error.</p></div>
                </div>
                <div className="divide-y divide-border">
                    {(overview?.sources || []).map((source) => (
                        <div key={source.id} className="p-4 grid gap-3 lg:grid-cols-[1.1fr_1.3fr_1.3fr_1.3fr_auto_auto_auto] items-center">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={source.isActive} onChange={(event) => updateSource(source, { isActive: event.target.checked })} className="accent-primary" />{source.name}</label>
                                <div className="flex flex-wrap gap-1 mt-1">{source.categoryLinks?.map((link) => <span key={link.category.slug} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{link.category.name}: {link.priority}</span>) || <span className="text-[11px] text-muted-foreground">Sin categorías</span>}</div>
                            </div>
                            <input defaultValue={source.baseUrl || ''} onBlur={(event) => { if (event.target.value !== source.baseUrl) updateSource(source, { baseUrl: event.target.value }); }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs" placeholder="Base URL" />
                            <input defaultValue={source.rssUrl || ''} onBlur={(event) => { if (event.target.value !== source.rssUrl) updateSource(source, { rssUrl: event.target.value }); }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs" placeholder="RSS URL" />
                            <input defaultValue={source.apiUrl || ''} onBlur={(event) => { if (event.target.value !== source.apiUrl) updateSource(source, { apiUrl: event.target.value }); }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs" placeholder="API URL (opcional)" />
                            <label className="text-[11px] text-muted-foreground">Prioridad<input type="number" min="0" max="100" defaultValue={source.priority} onBlur={(event) => updateSource(source, { priority: Number(event.target.value) })} className="mt-1 w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground" /></label>
                            <label className="text-[11px] text-muted-foreground">Confiabilidad<input type="number" min="0" max="100" defaultValue={source.reliabilityScore} onBlur={(event) => updateSource(source, { reliabilityScore: Number(event.target.value) })} className="mt-1 w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground" /></label>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                {source.lastError ? <span className="text-red-600">Último error: {source.lastError.slice(0, 45)}</span> : <span>Última correcta: {formatScheduleDate(source.lastSuccessfulSync)}</span>}
                                <button onClick={() => run('SOURCE', source.id)} disabled={Boolean(running)} title="Actualizar esta fuente" className="rounded-lg border border-border p-1.5 hover:bg-primary/5 hover:text-primary disabled:opacity-50">
                                    {running === source.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                </button>
                                {saving === source.id && <Loader2 className="inline w-3 h-3 animate-spin" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-5 border-b border-border"><h3 className="font-bold">Historial de ejecuciones</h3><p className="text-xs text-muted-foreground">Se registra el resultado aunque falle una fuente individual.</p></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-secondary/30 text-muted-foreground"><tr><th className="text-left p-3">Fecha</th><th className="text-left p-3">Tipo</th><th className="text-left p-3">Estado</th><th className="text-right p-3">Encontradas</th><th className="text-right p-3">Nuevas</th><th className="text-right p-3">Duplicadas</th></tr></thead>
                        <tbody className="divide-y divide-border">{(overview?.logs || []).map((log) => { const meta = statusMeta(log.status); const Icon = meta.icon; return <tr key={log.id}><td className="p-3">{formatScheduleDate(log.startedAt)}</td><td className="p-3">{log.frequency}</td><td className="p-3"><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${meta.className}`}><Icon className="w-3 h-3" />{meta.label}</span></td><td className="p-3 text-right">{log.articlesFound}</td><td className="p-3 text-right">{log.articlesCreated}</td><td className="p-3 text-right">{log.duplicatesDetected}</td></tr>; })}</tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
