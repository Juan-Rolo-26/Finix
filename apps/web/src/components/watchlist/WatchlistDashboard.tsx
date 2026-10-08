import { useState, useMemo } from 'react';
import { watchlistChartSymbol, watchlistPeriodChange, type WatchlistHistory, type WatchlistPricePoint, type WatchlistPeriod } from './watchlistData';
import SymbolLogo from '@/components/SymbolLogo';
import WatchlistValueCreation from './WatchlistValueCreation';
import WatchlistNews from './WatchlistNews';
import WatchlistSectorCharts from './WatchlistSectorCharts';
import {
    TrendingUp,
    TrendingDown,
    Target,
    Calendar,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Info,
    Filter,
    ShieldCheck,
    Newspaper,
    PieChart,
} from 'lucide-react';

interface WatchlistDashboardProps {
    items: any[];
    onItemClick: (item: any) => void;
    histories: Record<string, WatchlistHistory>;
    defaultSubView?: DashboardSubView;
}

export type DashboardSubView = 'radar' | 'value' | 'news' | 'charts';

type EventCategory = 'prices' | 'earnings';

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
    prices: { label: 'Cotizaciones', icon: TrendingUp, color: 'text-sky-400', bg: 'bg-sky-500/15 border-sky-500/30' },
    earnings: { label: 'Balances', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
};

function generateTimelineEvents(items: any[]): TimelineEvent[] {
    const events: TimelineEvent[] = [];
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    for (const item of items) {
        const date = item.nextEarnings?.date;
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date))) {
            events.push({ id: `earnings-${item.id}`, category: 'earnings', symbol: item.symbol,
                title: item.nextEarnings.title || `${item.symbol} reporta balances`, date,
                dayGroup: date === today ? 'Hoy' : date, description: `Resultados de ${item.name || item.symbol}.`, badge: 'Próx. balance' });
        }
        if (!item.isUnavailable && Number.isFinite(item.changePercent) && typeof item.quoteUpdatedAt === 'string' && Number.isFinite(Date.parse(item.quoteUpdatedAt))) {
            const date = new Date(item.quoteUpdatedAt).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
            events.push({ id: `price-${item.id}`, category: 'prices', symbol: item.symbol,
                title: `Variación de ${item.symbol}`, date, dayGroup: date === today ? 'Hoy' : date,
                description: `Última variación informada de ${item.name || item.symbol}.`, meta: `${item.changePercent > 0 ? '+' : ''}${item.changePercent.toFixed(2)}%` });
        }
    }
    return events.sort((a, b) => a.date.localeCompare(b.date));
}

function Sparkline({ points, history }: { points: WatchlistPricePoint[]; history?: WatchlistHistory }) {
    if (points.length < 2) return <span className="text-xs text-muted-foreground">{history?.loading ? 'Cargando…' : history?.error ? 'No disponible' : 'Sin historial'}</span>;
    const prices = points.map(point => point.close);
    const min = Math.min(...prices), max = Math.max(...prices);
    const start = points[0].time, duration = points.at(-1)!.time - start;
    const coords = points.map(point => `${((point.time - start) / duration) * 80},${max === min ? 14 : 28 - ((point.close - min) / (max - min)) * 28}`).join(' ');
    const positive = prices.at(-1)! >= prices[0];
    return <svg width={80} height={28} viewBox="0 0 80 28" fill="none" role="img" aria-label="Historial de precios del último mes">
        <polyline points={coords} stroke={positive ? '#10b981' : '#f43f5e'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>;
}

function MoversCard({ items, period, onPeriodChange, onItemClick, negative = false }: {
    items: any[];
    period: WatchlistPeriod;
    onPeriodChange: (period: WatchlistPeriod) => void;
    onItemClick: (item: any) => void;
    negative?: boolean;
}) {
    const Icon = negative ? TrendingDown : TrendingUp;
    const maximum = Math.max(0.01, ...items.map(item => Math.abs(item.changePercent)));
    return (
        <section className={`watchlist-insight watchlist-movers ${negative ? 'watchlist-movers--negative' : ''}`} aria-label={negative ? 'Mayores bajas' : 'Mayores subas'}>
            <div className="watchlist-insight__header">
                <div className="watchlist-insight__identity">
                    <span className="watchlist-insight__icon"><Icon size={17} /></span>
                    <div>
                        <h3>{negative ? 'Top Losers' : 'Top Gainers'}</h3>
                        <p>{negative ? 'Mayores bajas de tu lista' : 'Mayores subas de tu lista'}</p>
                    </div>
                </div>
                <div className="watchlist-periods" role="group" aria-label="Período de variación">
                    {(['1D', '1W', '1M'] as const).map(timeframe => (
                        <button key={timeframe} type="button" aria-pressed={period === timeframe} onClick={() => onPeriodChange(timeframe)}>{timeframe}</button>
                    ))}
                </div>
            </div>
            {items.length === 0 ? (
                <div className="watchlist-insight__empty"><Icon size={22} /><p>Sin {negative ? 'bajas' : 'subas'} con datos para este período</p></div>
            ) : (
                <div className="watchlist-movers__chart">
                    {items.map(item => {
                        const pct = item.changePercent;
                        return (
                            <button key={item.id} type="button" className="watchlist-movers__asset" onClick={() => onItemClick(item)} aria-label={`Ver ${item.symbol}, ${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}>
                                <span className="watchlist-movers__value">{pct > 0 ? '+' : ''}{pct.toFixed(1)}%</span>
                                <span className="watchlist-movers__plot"><span className="watchlist-movers__bar" style={{ height: `${Math.max(8, Math.abs(pct) / maximum * 100)}%` }} /></span>
                                <span className="watchlist-movers__label"><SymbolLogo symbol={item.symbol} size={22} /><span title={item.symbol}>{item.symbol.split(':').pop()}</span></span>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default function WatchlistDashboard({ items, onItemClick, histories, defaultSubView = 'radar' }: WatchlistDashboardProps) {
    const [subView, setSubView] = useState<DashboardSubView>(defaultSubView);
    const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(
        new Set(['prices', 'earnings'])
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
            .filter(i => !i.isUnavailable && Number.isFinite(i.currentPrice) && Number.isFinite(i.targetPrice) && (i.targetDirection === 'ABOVE' ? i.currentPrice >= i.targetPrice : i.currentPrice <= i.targetPrice))
            .sort((a, b) => (b.distancePct ?? 0) - (a.distancePct ?? 0))
            .slice(0, 4),
        [items]
    );

    const gainers = useMemo(() =>
        items.map(item => ({ ...item, changePercent: watchlistPeriodChange(item, histories[watchlistChartSymbol(item)]?.points || [], gainersTimeframe) }))
            .filter(i => i.changePercent !== null && i.changePercent > 0)
            .sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0))
            .slice(0, 6),
        [items, histories, gainersTimeframe]
    );

    const losers = useMemo(() =>
        items.map(item => ({ ...item, changePercent: watchlistPeriodChange(item, histories[watchlistChartSymbol(item)]?.points || [], losersTimeframe) }))
            .filter(i => i.changePercent !== null && i.changePercent < 0)
            .sort((a, b) => (a.changePercent ?? 0) - (b.changePercent ?? 0))
            .slice(0, 6),
        [items, histories, losersTimeframe]
    );

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

    if (!items.length) return null;

    return (
        <div className="watchlist-dashboard">
            {/* SUB-NAVIGATION BAR */}
            <div className="flex items-center gap-1.5 p-1 bg-secondary/50 border border-border/70 rounded-2xl mb-6 overflow-x-auto scrollbar-none">
                <button
                    type="button"
                    onClick={() => setSubView('radar')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        subView === 'radar'
                            ? 'bg-card text-foreground shadow-xs border border-border/80'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    }`}
                >
                    <TrendingUp size={15} />
                    <span>Radar de Mercado</span>
                </button>
                <button
                    type="button"
                    onClick={() => setSubView('value')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        subView === 'value'
                            ? 'bg-card text-foreground shadow-xs border border-border/80'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    }`}
                >
                    <ShieldCheck size={15} className="text-emerald-500" />
                    <span>Creación de Valor (ROIC vs WACC)</span>
                </button>
                <button
                    type="button"
                    onClick={() => setSubView('news')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        subView === 'news'
                            ? 'bg-card text-foreground shadow-xs border border-border/80'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    }`}
                >
                    <Newspaper size={15} className="text-sky-400" />
                    <span>Noticias de tus Activos</span>
                </button>
                <button
                    type="button"
                    onClick={() => setSubView('charts')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        subView === 'charts'
                            ? 'bg-card text-foreground shadow-xs border border-border/80'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    }`}
                >
                    <PieChart size={15} className="text-purple-400" />
                    <span>Sectores & Gráficos</span>
                </button>
            </div>

            {/* CONDITIONAL SUBVIEW RENDERING */}
            {subView === 'value' && (
                <WatchlistValueCreation items={items} onItemClick={onItemClick} />
            )}

            {subView === 'news' && (
                <WatchlistNews items={items} onItemClick={onItemClick} />
            )}

            {subView === 'charts' && (
                <WatchlistSectorCharts items={items} onItemClick={onItemClick} />
            )}

            {subView === 'radar' && (
                <div className="space-y-6">
            <div className="watchlist-insights">
                {/* Opportunities */}
                <section className="watchlist-insight watchlist-opportunities">
                    <div className="watchlist-insight__identity">
                        <div className="watchlist-insight__icon">
                            <Target className="w-4 h-4" />
                        </div>
                        <div>
                            <h3>Objetivos alcanzados</h3>
                            <p>Activos que alcanzaron tu condición de precio</p>
                        </div>
                    </div>
                    {opportunities.length === 0 ? (
                        <div className="watchlist-insight__empty">
                            <Info className="w-5 h-5 text-muted-foreground/50" />
                            <p className="text-xs text-muted-foreground">{items.some(item => Number.isFinite(item.targetPrice)) ? 'Todavía no se alcanzaron tus objetivos de precio' : 'Definí objetivos de precio para ver oportunidades'}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {opportunities.map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onItemClick(item)}
                                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/60 border border-border/40 hover:border-emerald-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <SymbolLogo symbol={item.symbol} size={32} />
                                        <div className="text-left">
                                            <span className="text-sm font-bold text-foreground font-mono">{item.symbol}</span>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{item.name || item.symbol}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            {Number.isFinite(item.distancePct) ? `${item.distancePct > 0 ? '+' : ''}${item.distancePct.toFixed(1)}%` : 'Alcanzado'}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <MoversCard items={gainers} period={gainersTimeframe} onPeriodChange={setGainersTimeframe} onItemClick={onItemClick} />
                <MoversCard items={losers} period={losersTimeframe} onPeriodChange={setLosersTimeframe} onItemClick={onItemClick} negative />
            </div>

            {/* PREMIUM TABLE */}
            <div className="watchlist-summary rounded-lg border border-border bg-card overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                    <h3 className="text-base font-bold text-foreground">Resumen de tu Lista</h3>
                    <span className="text-xs text-muted-foreground font-semibold">{items.length} activos</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-bold text-xs uppercase tracking-wider">
                                <th className="px-5 py-3.5">Empresa</th>
                                <th className="px-4 py-3.5">Gráfico</th>
                                <th className="px-4 py-3.5">Precio</th>
                                <th className="px-4 py-3.5">Var. diaria</th>
                                <th className="px-4 py-3.5">Mi Objetivo</th>
                                <th className="px-4 py-3.5">Distancia</th>
                                <th className="px-4 py-3.5">Estado</th>
                                <th className="px-4 py-3.5 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {items.map(item => {
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
                                                        <span className="font-bold text-foreground font-mono text-base">{item.symbol}</span>
                                                        {item.isInPortfolio && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">Lo tengo</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground line-clamp-1">{item.name || item.symbol}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5"><Sparkline points={(histories[watchlistChartSymbol(item)]?.points || []).filter(point => point.time >= Date.now() / 1000 - 31 * 86400)} history={histories[watchlistChartSymbol(item)]} /></td>
                                        <td className="px-4 py-3.5 font-mono font-bold text-base text-foreground">
                                            {item.currentPrice != null
                                                ? `$${item.currentPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                : <span className="text-muted-foreground font-normal">N/D</span>}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {item.changePercent != null ? (
                                                <span className={`inline-flex items-center gap-0.5 font-bold text-sm ${item.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {item.changePercent >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                                                </span>
                                            ) : <span className="text-muted-foreground">—</span>}
                                        </td>
                                        <td className="px-4 py-3.5 font-mono font-bold text-base">
                                            {item.targetPrice
                                                ? <span className="text-foreground">${item.targetPrice.toLocaleString()}</span>
                                                : <span className="text-xs text-muted-foreground italic font-normal">Sin objetivo</span>}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {dist != null ? (
                                                <span className={`inline-flex items-center gap-0.5 font-bold px-2.5 py-1 rounded-full text-xs border ${dist >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25' : 'bg-rose-500/10 text-rose-500 border-rose-500/25'}`}>
                                                    {dist >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                                    {dist >= 0 ? '+' : ''}{dist.toFixed(1)}%
                                                </span>
                                            ) : <span className="text-muted-foreground">—</span>}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[item.personalStatus] || 'bg-secondary text-muted-foreground border-border/40'}`}>
                                                {statusLabel[item.personalStatus] || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <button type="button" onClick={e => { e.stopPropagation(); onItemClick(item); }}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-emerald-500 transition-colors">
                                                Ver ficha <ChevronRight className="w-3.5 h-3.5" />
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
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
                <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md overflow-hidden shadow-xs">
                    <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <h3 className="text-base font-bold text-foreground">Actividad de tu lista</h3>
                        <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground font-semibold">{filteredEvents.length} eventos</span>
                    </div>
                    {filteredEvents.length === 0 ? (
                        <div className="p-10 text-center">
                            <Filter className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No hay eventos para las categorías seleccionadas</p>
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
                                        <span className={`text-xs font-bold uppercase tracking-wider mb-3 block ${dayGroup === 'Hoy' ? 'text-emerald-500' : 'text-muted-foreground'}`}>{dayGroup}</span>
                                        <div className="flex flex-col gap-3">
                                            {dayEvents.map(event => {
                                                const cfg = CATEGORY_CONFIG[event.category];
                                                const Icon = cfg.icon;
                                                return (
                                                    <div key={event.id} className="rounded-xl border border-border/50 bg-card/50 overflow-hidden hover:border-border/80 transition-all">
                                                        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-secondary/20">
                                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
                                                                <Icon className="w-3.5 h-3.5" />{cfg.label}
                                                            </span>
                                                            {event.badge && (
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${cfg.bg} ${cfg.color}`}>{event.badge}</span>
                                                            )}
                                                            <span className="ml-auto text-xs text-muted-foreground font-semibold">{event.date}</span>
                                                        </div>
                                                        <div className="px-4 py-3 flex items-start gap-3">
                                                            <SymbolLogo symbol={event.symbol} size={32} />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start gap-2 mb-1">
                                                                    <h4 className="text-sm font-bold text-foreground leading-tight">{event.title}</h4>
                                                                    {event.meta && (
                                                                        <span className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-md ${event.meta.startsWith('+') ? 'text-emerald-500 bg-emerald-500/10' : event.meta.startsWith('-') ? 'text-rose-500 bg-rose-500/10' : 'text-muted-foreground bg-secondary'}`}>
                                                                            {event.meta}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{event.description}</p>
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
                <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-5 flex flex-col gap-4 shadow-xs h-fit">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <h4 className="text-sm font-bold text-foreground">Filtrar por Categoría</h4>
                    </div>
                    <div className="flex flex-col gap-2">
                        {(Object.keys(CATEGORY_CONFIG) as EventCategory[]).map(cat => {
                            const cfg = CATEGORY_CONFIG[cat];
                            const Icon = cfg.icon;
                            const active = activeCategories.has(cat);
                            return (
                                <button key={cat} type="button" aria-pressed={active} onClick={() => toggleCategory(cat)}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${active ? 'border-emerald-500/30 bg-emerald-500/8' : 'border-border/40 bg-secondary/20 opacity-60'}`}>
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${active ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-secondary border-border/40'}`}>
                                        {active && <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />}
                                    </div>
                                    <span className={`text-xs font-semibold flex-1 ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{cfg.label}</span>
                                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            </div>
            )}
        </div>
    );
}
