import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '../lib/api';
import { Activity, BarChart3, Clock3, DollarSign, Eye, FileText, Globe, RotateCcw, Users } from 'lucide-react';

interface StatsData {
    totalUsers: number; proUsers: number; totalPosts: number; totalCommunities: number; totalRevenue: number; usersLast7Days: number;
}
interface VisitsData {
    days: number; visitors: number; newVisitors: number; returningVisitors: number; sessions: number; pageViews: number;
    averageSessionSeconds: number; medianSessionSeconds: number; pagesPerSession: number;
    engagedSessions: number; engagementRate: number; bounceSessions: number; bounceRate: number;
    averageVisibleSecondsPerPage: number;
    topPages: Array<{ page: string; views: number; visibleSeconds: number }>;
    series: Array<{ date: string; visitors: number; sessions: number; pageViews: number }>;
}
function duration(seconds: number) {
    if (seconds < 60) return seconds + ' s';
    const minutes = Math.floor(seconds / 60), remaining = seconds % 60;
    return remaining ? minutes + ' min ' + remaining + ' s' : minutes + ' min';
}
function formatDay(value: string) {
    return new Date(value + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}
export default function Statistics() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [visits, setVisits] = useState<VisitsData | null>(null);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [visitsLoading, setVisitsLoading] = useState(true);
    const [visitsError, setVisitsError] = useState(false);

    const fetchVisits = useCallback(async () => {
        setVisitsLoading(true); setVisitsError(false);
        try {
            const response = await adminFetch('/site-analytics/dashboard?days=' + days);
            if (!response.ok) throw new Error('No se pudieron cargar las visitas.');
            const { data } = await response.json(); setVisits(data);
        } catch { setVisitsError(true); } finally { setVisitsLoading(false); }
    }, [days]);

    useEffect(() => {
        let mounted = true;
        adminFetch('/admin/statistics').then(async response => {
            if (!response.ok) throw new Error('No se pudieron cargar las estadísticas.');
            const { data } = await response.json(); if (mounted) setStats(data);
        }).catch(error => console.error(error)).finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);
    useEffect(() => { void fetchVisits(); }, [fetchVisits]);

    if (loading) return <div className="flex h-64 items-center justify-center text-muted-foreground">Cargando estadísticas...</div>;
    if (!stats) return <div className="text-red-500">Error al cargar las estadísticas.</div>;

    const cards = [
        { label: 'Usuarios Totales', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
        { label: 'Usuarios PRO', value: stats.proUsers, icon: Activity, color: 'text-purple-500' },
        { label: 'Ingresos Totales', value: '$' + stats.totalRevenue.toLocaleString(), icon: DollarSign, color: 'text-emerald-500' },
        { label: 'Nuevos (últimos 7 días)', value: stats.usersLast7Days, icon: BarChart3, color: 'text-orange-500' },
        { label: 'Comunidades', value: stats.totalCommunities, icon: Globe, color: 'text-indigo-500' },
        { label: 'Publicaciones', value: stats.totalPosts, icon: FileText, color: 'text-pink-500' },
    ];
    const maxVisitors = Math.max(1, ...(visits?.series.map(item => item.visitors) || [1]));
    const returningRate = visits?.visitors ? Math.round(visits.returningVisitors / visits.visitors * 100) : 0;
    const maxPageViews = Math.max(1, ...(visits?.topPages.map(item => item.views) || [1]));
    const chartDays = visits?.series || Array.from({ length: days }, () => ({ date: '', visitors: 0, sessions: 0, pageViews: 0 }));

    return (
        <div className="space-y-8">
            <section className="space-y-5">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Estadísticas avanzadas</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Actividad general de Finix y comportamiento de visitas.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {cards.map(card => <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={'rounded-full bg-secondary p-3 ' + card.color}><card.icon className="h-5 w-5" /></div>
                            <div><p className="text-sm font-medium text-muted-foreground">{card.label}</p><p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p></div>
                        </div>
                    </div>)}
                </div>
            </section>
            <section className="space-y-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold text-foreground">Visitas al sitio</h2></div>
                        <p className="mt-1 text-sm text-muted-foreground">Visitantes anónimos, sesiones y tiempo que las páginas estuvieron visibles.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="visits-range" className="text-sm text-muted-foreground">Período</label>
                        <select id="visits-range" value={days} onChange={event => setDays(Number(event.target.value))} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
                            <option value={7}>Últimos 7 días</option><option value={30}>Últimos 30 días</option><option value={90}>Últimos 90 días</option>
                        </select>
                        <button onClick={() => void fetchVisits()} disabled={visitsLoading} aria-label="Actualizar visitas" className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground disabled:opacity-50">
                            <RotateCcw className={'h-4 w-4 ' + (visitsLoading ? 'animate-spin' : '')} />
                        </button>
                    </div>
                </div>
                {visitsError ? <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 text-sm text-red-600">No se pudieron cargar las visitas. Actualizá el panel o volvé a iniciar sesión.</div> : <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                        {[
                            { label: 'Visitantes únicos', value: visits?.visitors ?? 0, icon: Users, hint: 'personas anónimas' },
                            { label: 'Nuevos', value: visits?.newVisitors ?? 0, icon: Users, hint: 'primera visita en el período' },
                            { label: 'Recurrentes', value: visits?.returningVisitors ?? 0, icon: RotateCcw, hint: returningRate + '% del total' },
                            { label: 'Sesiones', value: visits?.sessions ?? 0, icon: Activity, hint: 'se reinician tras 30 min' },
                            { label: 'Páginas vistas', value: visits?.pageViews ?? 0, icon: Eye, hint: (visits?.pagesPerSession ?? 0) + ' por sesión' },
                            { label: 'Sesiones con interacción', value: visits?.engagedSessions ?? 0, icon: Activity, hint: (visits?.engagementRate ?? 0) + '% con 2+ páginas o 10+ s visibles' },
                            { label: 'Rebotes', value: (visits?.bounceRate ?? 0) + '%', icon: RotateCcw, hint: (visits?.bounceSessions ?? 0).toLocaleString('es-AR') + ' sesiones de una página y menos de 10 s' },
                        ].map(item => <div key={item.label} className="min-w-0 rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center gap-2 text-muted-foreground"><item.icon className="h-4 w-4 shrink-0 text-primary" /><span className="truncate text-xs font-medium">{item.label}</span></div>
                            <p className="mt-3 text-2xl font-bold text-foreground">{visitsLoading ? '—' : item.value.toLocaleString('es-AR')}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">{item.hint}</p>
                        </div>)}
                    </div>
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
                        <div className="rounded-xl border border-border bg-card p-5">
                            <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-foreground">Visitantes por día</h3><p className="mt-1 text-xs text-muted-foreground">Visitantes únicos registrados</p></div>
                                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{days} días</span></div>
                            <div className="mt-5 flex h-48 items-end gap-px border-b border-border px-1">
                                {chartDays.map((item, index) => {
                                    const height = Math.max(item.visitors ? 5 : 0, Math.round(item.visitors / maxVisitors * 100));
                                    return <div key={item.date || index} className="group relative flex h-full flex-1 items-end" title={(item.date ? formatDay(item.date) + ': ' : '') + item.visitors + ' visitantes, ' + item.sessions + ' sesiones'}>
                                        <div className="w-full rounded-t bg-primary/80 transition-colors group-hover:bg-primary" style={{ height: height + '%', minHeight: item.visitors ? 3 : 0 }} />
                                    </div>;
                                })}
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                <span>{visits?.series[0]?.date ? formatDay(visits.series[0].date) : 'Sin datos'}</span>
                                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Visitantes únicos</span>
                                <span>{visits?.series.length ? formatDay(visits.series[visits.series.length - 1].date) : ''}</span>
                            </div>
                            {!visitsLoading && !visits?.visitors && <p className="mt-5 text-center text-sm text-muted-foreground">Todavía no hay datos para este período.</p>}
                        </div>
                        <div className="rounded-xl border border-border bg-card p-5">
                            <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" /><h3 className="font-semibold text-foreground">Tiempo de visita</h3></div>
                            <p className="mt-5 text-3xl font-bold text-foreground">{duration(visits?.averageSessionSeconds ?? 0)}</p>
                            <p className="mt-1 text-sm text-muted-foreground">promedio visible por sesión</p>
                            <div className="mt-5 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">Solo se cuenta el tiempo con la pestaña de Finix visible. Las sesiones nuevas comienzan después de 30 minutos de inactividad.</div>
                            <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Mediana por sesión</span><span className="font-semibold text-foreground">{duration(visits?.medianSessionSeconds ?? 0)}</span></div>
                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Tiempo visible por página</span><span className="font-semibold text-foreground">{duration(visits?.averageVisibleSecondsPerPage ?? 0)}</span></div>
                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Visitantes recurrentes</span><span className="font-semibold text-foreground">{returningRate}%</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /><h3 className="font-semibold text-foreground">Páginas más vistas</h3></div>
                        {visits?.topPages.length ? <div className="mt-4 space-y-4">{visits.topPages.map(item => <div key={item.page} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                            <div className="min-w-0"><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium text-foreground">{item.page}</span><span className="shrink-0 text-muted-foreground">{item.views.toLocaleString('es-AR')} vistas</span></div>
                                <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: Math.max(3, item.views / maxPageViews * 100) + '%' }} /></div></div>
                            <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"><Clock3 className="h-3 w-3" />{duration(item.visibleSeconds)}</span>
                        </div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">{visitsLoading ? 'Cargando páginas…' : 'Las páginas consultadas aparecerán acá cuando haya visitas registradas.'}</p>}
                    </div>
                </>}
                <p className="text-xs text-muted-foreground">La medición es anónima y opcional. Los datos empiezan a acumularse cuando cada visitante acepta la analítica en el aviso de cookies.</p>
            </section>
        </div>
    );
}
