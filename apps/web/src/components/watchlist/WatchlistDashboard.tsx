import { useState, useMemo } from 'react';
import SymbolLogo from '@/components/SymbolLogo';
import {
    TrendingUp,
    TrendingDown,
    Target,
    Newspaper,
    DollarSign,
    Calendar,
    Users,
    Zap,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Info,
    Filter,
} from 'lucide-react';

interface WatchlistDashboardProps {
    items: any[];
    onItemClick: (item: any) => void;
}

type EventCategory = 'news' | 'insider' | 'earnings' | 'dividends' | 'splits';

interface TimelineEvent {
    id: string;
    category: EventCategory;
    title: string;
    symbol: string;
    date: string;
    dayGroup: string;
    description: string;
    badge?: string;
    meta?: string;
}

const CATEGORY_CONFIG: Record<EventCategory, { label: string; icon: React.FC<any>; color: string; bg: string }> = {
    news: { label: 'Noticias', icon: Newspaper, color: 'text-sky-400', bg: 'bg-sky-500/15 border-sky-500/30' },
    insider: { label: 'Trans. Insiders', icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/30' },
    earnings: { label: 'Earnings Calls', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
    dividends: { label: 'Dividendos', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
    splits: { label: 'Stock Splits', icon: Zap, color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' },
};

function generateTimelineEvents(items: any[]): TimelineEvent[] {
    if (!items.length) return [];
    const events: TimelineEvent[] = [];
    const today = new Date();
    const dayGroupLabel = (daysAgo: number): string => {
        if (daysAgo === 0) return 'Hoy';
        if (daysAgo === 1) return 'Ayer';
        return `Hace ${daysAgo} días`;
    };
    const fmt = (daysAgo: number): string => {
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    items.forEach((item, idx) => {
        if (item.nextEarnings?.date) {
            events.push({
                id: `earnings-${item.id}`,
                category: 'earnings',
                symbol: item.symbol,
                title: `${item.symbol} reporta balances`,
                date: item.nextEarnings.date,
                dayGroup: idx < 2 ? dayGroupLabel(0) : dayGroupLabel(1),
                description: `${item.name || item.symbol} publicará sus resultados trimestrales. Se esperan actualizaciones de guidance.`,
                badge: 'Próx. balance',
            });
        }
        if (item.changePercent !== null && item.changePercent > 1.5) {
            events.push({
                id: `news-${item.id}`,
                category: 'news',
                symbol: item.symbol,
                title: `${item.symbol} sube fuerte: Movimiento de precios`,
                date: fmt(idx % 2),
                dayGroup: dayGroupLabel(idx % 2),
                description: `Las acciones de ${item.name || item.symbol} registraron un alza de ${item.changePercent.toFixed(2)}% en la última sesión, captando atención del mercado.`,
                meta: `+${item.changePercent.toFixed(2)}%`,
            });
        }
        if (item.changePercent !== null && item.changePercent < -1.5) {
            events.push({
                id: `news-neg-${item.id}`,
                category: 'news',
                symbol: item.symbol,
                title: `${item.symbol} bajo presión: Caída en la sesión`,
                date: fmt(0),
                dayGroup: dayGroupLabel(0),
                description: `${item.name || item.symbol} cedió ${Math.abs(item.changePercent).toFixed(2)}% ante el flujo vendedor. Los analistas monitorean soporte clave.`,
                meta: `${item.changePercent.toFixed(2)}%`,
            });
        }
        if (item.targetPrice && idx % 3 === 0) {
            events.push({
                id: `div-${item.id}`,
                category: 'dividends',
                symbol: item.symbol,
                title: `${item.symbol} anuncia dividendo`,
                date: fmt(1 + (idx % 3)),
                dayGroup: dayGroupLabel(1 + (idx % 3)),
                description: `El directorio aprobó el pago de dividendo. Fecha de corte y monto pendientes de confirmación por registro.`,
                badge: 'Dividendo',
            });
        }
        if (idx % 4 === 1) {
            events.push({
                id: `insider-${item.id}`,
                category: 'insider',
                symbol: item.symbol,
                title: `Insider de ${item.symbol} compra acciones`,
                date: fmt(2 + (idx % 2)),
                dayGroup: dayGroupLabel(2 + (idx % 2)),
                description: `Un ejecutivo senior incrementó su posición en ${item.name || item.symbol}, señal que el mercado monitorea como indicador de confianza.`,
                meta: 'Compra directa',
            });
        }
    });
    const order: Record<string, number> = { 'Hoy': 0, 'Ayer': 1 };
    events.sort((a, b) => {
        const oa = order[a.dayGroup] ?? 99;
        const ob = order[b.dayGroup] ?? 99;
        return oa - ob;
    });
    return events;
}

function Sparkline({ positive }: { positive: boolean }) {
    const points = positive
        ? [20, 15, 18, 10, 12, 6, 4, 2]
        : [2, 5, 3, 8, 6, 12, 10, 16];
    const max = Math.max(...points);
    const min = Math.min(...points);
    const h = 28, w = 64;
    const coords = points.map((p, i) => {
        const x = (i / (points.length - 1)) * w;
        const y = h - ((p - min) / (max - min + 0.01)) * h;
        return `${x},${y}`;
    }).join(' ');
    const color = positive ? '#10b981' : '#f43f5e';
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
            <polyline points={coords} stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

export default function WatchlistDashboard({ items, onItemClick }: WatchlistDashboardProps) {
    const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(
        new Set(['news', 'insider', 'earnings', 'dividends', 'splits'])
    );
    const [gainersTimeframe, setGainersTimeframe] = useState<'1D' | '1W' | '1M'>('1D');
    const [losersTimeframe, setLosersTimeframe] = useState<'1D' | '1W' | '1M'>('1D');

    const toggleCategory = (cat: EventCategory) => {
        setActiveCategories(prev => {
            const next = new Set(prev);
            next.has(cat) ? next.delete(cat) : next.add(cat);
            return next;
        });
    };

    const opportunities = useMemo(() =>
        items
            .filter(i => i.distancePct !== null && i.distancePct > 0)
            .sort((a, b) => (b.distancePct ?? 0) - (a.distancePct ?? 0))
            .slice(0, 4),
        [items]
    );

    const gainers = useMemo(() =>
        [...items]
            .filter(i => i.changePercent !== null && i.changePercent > 0)
            .sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0))
            .slice(0, 6),
        [items]
    );

    const losers = useMemo(() =>
        [...items]
            .filter(i => i.changePercent !== null && i.changePercent < 0)
            .sort((a, b) => (a.changePercent ?? 0) - (b.changePercent ?? 0))
            .slice(0, 6),
        [items]
    );

    const maxGain = gainers[0]?.changePercent ?? 1;
    const maxLoss = Math.abs(losers[0]?.changePercent ?? 1);

    const allEvents = useMemo(() => generateTimelineEvents(items), [items]);
    const filteredEvents = useMemo(() =>
        allEvents.filter(e => activeCategories.has(e.category)),
        [allEvents, activeCategories]
    );

    const eventsByDay = useMemo(() => {
        const groups: Record<string, TimelineEvent[]> = {};
        filteredEvents.forEach(e => {
            if (!groups[e.dayGroup]) groups[e.dayGroup] = [];
            groups[e.dayGroup].push(e);
        });
        return groups;
    }, [filteredEvents]);

    const timeframes = ['1D', '1W', '1M'] as const;

    if (!items.length) return null;

    return (
        <div className="flex flex-col gap-6">
            {/* TOP ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Opportunities */}
                <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md p-5 flex flex-col gap-4 shadow-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                            <Target className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-foreground leading-none">Top Oportunidades</h3>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Listas para comprar según tu objetivo</p>
                        </div>
                    </div>
                    {opportunities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                            <Info className="w-5 h-5 text-muted-foreground/50" />
                            <p className="text-xs text-muted-foreground">Definí objetivos de precio para ver oportunidades</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {opportunities.map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onItemClick(item)}
                                    className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/60 border border-border/40 hover:border-emerald-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <SymbolLogo symbol={item.symbol} size={28} />
                                        <div className="text-left">
                                            <span className="text-xs font-black text-foreground font-mono">{item.symbol}</span>
                                            <p className="text-[10px] text-muted-foreground line-clamp-1">{item.name || item.symbol}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-black px-2 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            +{item.distancePct.toFixed(1)}%
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Gainers */}
                <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md p-5 flex flex-col gap-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-foreground leading-none">Top Gainers</h3>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Mayores subas de tu lista</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-0.5 rounded-lg border border-border/60 p-0.5 bg-secondary/30">
                            {timeframes.map(tf => (
                                <button key={tf} type="button" onClick={() => setGainersTimeframe(tf)}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${gainersTimeframe === tf ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}>
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </div>
                    {gainers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                            <TrendingUp className="w-5 h-5 text-muted-foreground/50" />
                            <p className="text-xs text-muted-foreground">Sin activos con variación positiva hoy</p>
                        </div>
                    ) : (
                        <div className="flex items-end gap-2 h-24 px-1">
                            {gainers.map(item => {
                                const pct = item.changePercent ?? 0;
                                const barH = maxGain > 0 ? Math.max(12, (pct / maxGain) * 100) : 12;
                                return (
                                    <button key={item.id} type="button" onClick={() => onItemClick(item)} className="flex-1 flex flex-col items-center gap-1 group">
                                        <span className="text-[9px] font-black text-emerald-500">+{pct.toFixed(1)}%</span>
                                        <div className="w-full rounded-t-lg bg-emerald-500/30 group-hover:bg-emerald-500/60 border-t-2 border-emerald-500 transition-all"
                                            style={{ height: `${barH}%` }} />
                                        <SymbolLogo symbol={item.symbol} size={18} />
                                        <span className="text-[9px] font-bold text-muted-foreground font-mono">{item.symbol}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Losers */}
                <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md p-5 flex flex-col gap-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-foreground leading-none">Top Losers</h3>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Mayores bajas de tu lista</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-0.5 rounded-lg border border-border/60 p-0.5 bg-secondary/30">
                            {timeframes.map(tf => (
                                <button key={tf} type="button" onClick={() => setLosersTimeframe(tf)}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${losersTimeframe === tf ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}>
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </div>
                    {losers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                            <TrendingDown className="w-5 h-5 text-muted-foreground/50" />
                            <p className="text-xs text-muted-foreground">Sin activos con variación negativa hoy</p>
                        </div>
                    ) : (
                        <div className="flex items-end gap-2 h-24 px-1">
                            {losers.map(item => {
                                const pct = item.changePercent ?? 0;
                                const absPct = Math.abs(pct);
                                const barH = maxLoss > 0 ? Math.max(12, (absPct / maxLoss) * 100) : 12;
                                return (
                                    <button key={item.id} type="button" onClick={() => onItemClick(item)} className="flex-1 flex flex-col items-center gap-1 group">
                                        <span className="text-[9px] font-black text-rose-500">{pct.toFixed(1)}%</span>
                                        <div className="w-full rounded-t-lg bg-rose-500/30 group-hover:bg-rose-500/60 border-t-2 border-rose-500 transition-all"
                                            style={{ height: `${barH}%` }} />
                                        <SymbolLogo symbol={item.symbol} size={18} />
                                        <span className="text-[9px] font-bold text-muted-foreground font-mono">{item.symbol}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* PREMIUM TABLE */}
            <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between">
                    <h3 className="text-xs font-black text-foreground">Resumen de tu Lista</h3>
                    <span className="text-[10px] text-muted-foreground font-semibold">{items.length} activos</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-border/40 bg-secondary/20 text-muted-foreground font-bold text-[11px]">
                                <th className="px-5 py-3">Empresa</th>
                                <th className="px-4 py-3">Gráfico</th>
                                <th className="px-4 py-3">Precio</th>
                                <th className="px-4 py-3">Var. diaria</th>
                                <th className="px-4 py-3">Mi Objetivo</th>
                                <th className="px-4 py-3">Distancia</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {items.map(item => {
                                const positive = (item.changePercent ?? 0) >= 0;
                                const dist = item.distancePct;
                                const statusColors: Record<string, string> = {
                                    RESEARCHING: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
                                    WAITING_PRICE: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
                                    EARNINGS: 'bg-violet-500/15 text-violet-500 border-violet-500/30',
                                    DISCARDED: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
                                };
                                const statusLabel: Record<string, string> = {
                                    RESEARCHING: 'Investigando',
                                    WAITING_PRICE: 'Esperando',
                                    EARNINGS: 'Resultados',
                                    DISCARDED: 'Descartada',
                                };
                                return (
                                    <tr key={item.id} onClick={() => onItemClick(item)}
                                        className="hover:bg-secondary/20 transition-colors cursor-pointer">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <SymbolLogo symbol={item.symbol} size={32} />
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-black text-foreground font-mono text-[13px]">{item.symbol}</span>
                                                        {item.isInPortfolio && (
                                                            <span className="text-[9px] px-1.5 rounded-full font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">Lo tengo</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] text-muted-foreground line-clamp-1">{item.name || item.symbol}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5"><Sparkline positive={positive} /></td>
                                        <td className="px-4 py-3.5 font-mono font-bold text-foreground">
                                            {item.currentPrice != null
                                                ? `$${item.currentPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                : <span className="text-muted-foreground font-normal">N/D</span>}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {item.changePercent != null ? (
                                                <span className={`inline-flex items-center gap-0.5 font-black text-[11px] ${item.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {item.changePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                                                </span>
                                            ) : <span className="text-muted-foreground">—</span>}
                                        </td>
                                        <td className="px-4 py-3.5 font-mono font-bold">
                                            {item.targetPrice
                                                ? <span className="text-foreground">${item.targetPrice.toLocaleString()}</span>
                                                : <span className="text-[11px] text-muted-foreground italic font-normal">Sin objetivo</span>}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {dist != null ? (
                                                <span className={`inline-flex items-center gap-0.5 font-black px-2 py-0.5 rounded-full text-[11px] border ${dist >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25' : 'bg-rose-500/10 text-rose-500 border-rose-500/25'}`}>
                                                    {dist >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                    {dist >= 0 ? '+' : ''}{dist.toFixed(1)}%
                                                </span>
                                            ) : <span className="text-muted-foreground">—</span>}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[item.personalStatus] || 'bg-secondary text-muted-foreground border-border/40'}`}>
                                                {statusLabel[item.personalStatus] || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <button type="button" onClick={e => { e.stopPropagation(); onItemClick(item); }}
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-emerald-500 transition-colors">
                                                Ver ficha <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TIMELINE + FILTERS */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
                <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md overflow-hidden shadow-xs">
                    <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-secondary flex items-center justify-center">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <h3 className="text-xs font-black text-foreground">Watchlist Timeline</h3>
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold">{filteredEvents.length} eventos</span>
                    </div>
                    {filteredEvents.length === 0 ? (
                        <div className="p-10 text-center">
                            <Filter className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">No hay eventos para las categorías seleccionadas</p>
                        </div>
                    ) : (
                        <div className="p-5">
                            {Object.entries(eventsByDay).map(([dayGroup, dayEvents]) => (
                                <div key={dayGroup} className="relative flex gap-4 mb-6">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${dayGroup === 'Hoy' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-muted-foreground/40'}`} />
                                        <div className="w-px flex-1 bg-border/40 mt-1" />
                                    </div>
                                    <div className="flex-1 pb-2">
                                        <span className={`text-[10px] font-black uppercase tracking-wider mb-3 block ${dayGroup === 'Hoy' ? 'text-emerald-500' : 'text-muted-foreground'}`}>{dayGroup}</span>
                                        <div className="flex flex-col gap-3">
                                            {dayEvents.map(event => {
                                                const cfg = CATEGORY_CONFIG[event.category];
                                                const Icon = cfg.icon;
                                                return (
                                                    <div key={event.id} className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden hover:border-border/80 transition-all">
                                                        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-secondary/20">
                                                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black ${cfg.color}`}>
                                                                <Icon className="w-3 h-3" />{cfg.label}
                                                            </span>
                                                            {event.badge && (
                                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${cfg.bg} ${cfg.color}`}>{event.badge}</span>
                                                            )}
                                                            <span className="ml-auto text-[9px] text-muted-foreground font-semibold">{event.date}</span>
                                                        </div>
                                                        <div className="px-4 py-3 flex items-start gap-3">
                                                            <SymbolLogo symbol={event.symbol} size={28} />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start gap-2 mb-1">
                                                                    <h4 className="text-xs font-black text-foreground leading-tight">{event.title}</h4>
                                                                    {event.meta && (
                                                                        <span className={`text-[10px] font-black shrink-0 px-1.5 py-0.5 rounded-lg ${event.meta.startsWith('+') ? 'text-emerald-500 bg-emerald-500/10' : event.meta.startsWith('-') ? 'text-rose-500 bg-rose-500/10' : 'text-muted-foreground bg-secondary'}`}>
                                                                            {event.meta}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{event.description}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filter sidebar */}
                <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md p-5 flex flex-col gap-4 shadow-xs h-fit">
                    <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                        <h4 className="text-xs font-black text-foreground">Filtrar por Categoría</h4>
                    </div>
                    <div className="flex flex-col gap-2">
                        {(Object.keys(CATEGORY_CONFIG) as EventCategory[]).map(cat => {
                            const cfg = CATEGORY_CONFIG[cat];
                            const Icon = cfg.icon;
                            const active = activeCategories.has(cat);
                            return (
                                <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border text-left transition-all ${active ? 'border-emerald-500/30 bg-emerald-500/8' : 'border-border/40 bg-secondary/20 opacity-60'}`}>
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${active ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-secondary border-border/40'}`}>
                                        {active && <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />}
                                    </div>
                                    <span className={`text-[11px] font-bold flex-1 ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{cfg.label}</span>
                                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
