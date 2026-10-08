import { useMemo } from 'react';
import SymbolLogo from '@/components/SymbolLogo';
import {
    BarChart3,
    Target,
    Layers,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    Shield,
} from 'lucide-react';

interface WatchlistSectorChartsProps {
    items: any[];
    onItemClick: (item: any) => void;
}

const SECTOR_COLORS: Record<string, string> = {
    Tecnología: '#3b82f6',
    'Servicios Financieros': '#10b981',
    Finanzas: '#10b981',
    Salud: '#ec4899',
    'Consumo Cíclico': '#f59e0b',
    'Consumo Defensivo': '#8b5cf6',
    Energía: '#f97316',
    Industrial: '#06b6d4',
    Materiales: '#14b8a6',
    Inmobiliario: '#eab308',
    'Bienes Raíces': '#eab308',
    Comunicaciones: '#6366f1',
    General: '#64748b',
};

export default function WatchlistSectorCharts({ items, onItemClick }: WatchlistSectorChartsProps) {
    // 1. Sector Breakdown
    const sectorStats = useMemo(() => {
        const counts: Record<string, number> = {};
        items.forEach((item) => {
            const sec = item.sector || item.assetType || 'Renta Variable';
            counts[sec] = (counts[sec] || 0) + 1;
        });

        const total = items.length || 1;
        return Object.entries(counts)
            .map(([sector, count]) => ({
                sector,
                count,
                percentage: Math.round((count / total) * 100),
                color: SECTOR_COLORS[sector] || '#10b981',
            }))
            .sort((a, b) => b.count - a.count);
    }, [items]);

    // 2. Target Price Upside Ranking
    const upsideRanking = useMemo(() => {
        const valid = items
            .filter(
                (item) =>
                    item.targetPrice != null &&
                    item.targetPrice > 0 &&
                    item.currentPrice != null &&
                    item.currentPrice > 0
            )
            .map((item) => {
                const upside = ((item.targetPrice - item.currentPrice) / item.currentPrice) * 100;
                return {
                    ...item,
                    upside,
                };
            })
            .sort((a, b) => b.upside - a.upside);

        return valid;
    }, [items]);

    // 3. Status Breakdown
    const statusStats = useMemo(() => {
        const counts: Record<string, number> = {
            RESEARCHING: 0,
            WAITING_PRICE: 0,
            EARNINGS: 0,
            DISCARDED: 0,
        };
        items.forEach((item) => {
            const st = item.personalStatus || 'RESEARCHING';
            if (counts[st] !== undefined) counts[st]++;
            else counts[st] = 1;
        });
        return counts;
    }, [items]);

    const maxUpside = useMemo(() => {
        if (upsideRanking.length === 0) return 50;
        return Math.max(30, ...upsideRanking.map((i) => Math.abs(i.upside)));
    }, [upsideRanking]);

    return (
        <div className="space-y-6">
            {/* Top 2 Columns Grid: Sector & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sector Allocation Card */}
                <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                    <Layers size={18} />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-foreground">
                                        Distribución por Sector
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        Concentración de empresas en tu seguimiento
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-foreground">
                                {sectorStats.length} sectores
                            </span>
                        </div>

                        {/* Multi-segment visual progress bar */}
                        <div className="h-3 w-full rounded-full overflow-hidden flex bg-secondary/50 my-4 p-0.5 gap-0.5">
                            {sectorStats.map((sec) => (
                                <div
                                    key={sec.sector}
                                    style={{
                                        width: `${sec.percentage}%`,
                                        backgroundColor: sec.color,
                                    }}
                                    className="h-full rounded-xs transition-all duration-300"
                                    title={`${sec.sector}: ${sec.percentage}%`}
                                />
                            ))}
                        </div>

                        {/* Sector Breakdown List */}
                        <div className="space-y-3 mt-4">
                            {sectorStats.map((sec) => (
                                <div
                                    key={sec.sector}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: sec.color }}
                                        />
                                        <span className="font-semibold text-foreground truncate">
                                            {sec.sector}
                                        </span>
                                        <span className="text-muted-foreground">
                                            ({sec.count} {sec.count === 1 ? 'activo' : 'activos'})
                                        </span>
                                    </div>
                                    <span className="font-mono font-bold text-foreground ml-2">
                                        {sec.percentage}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-1.5">
                        <Shield size={14} className="text-emerald-500 shrink-0" />
                        <span>
                            {sectorStats.length >= 3
                                ? 'Diversificación equilibrada entre múltiples industrias.'
                                : 'Tu lista se encuentra concentrada en pocos sectores.'}
                        </span>
                    </div>
                </div>

                {/* Pipeline Status Overview */}
                <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                    <BarChart3 size={18} />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-foreground">
                                        Pipeline de Análisis
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        Estado de avance de tus tesis de inversión
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-foreground font-mono">
                                {items.length} total
                            </span>
                        </div>

                        {/* Status Grid Cards */}
                        <div className="grid grid-cols-2 gap-3 my-4">
                            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex flex-col justify-between">
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                    Investigando
                                </span>
                                <div className="text-2xl font-black font-mono text-foreground mt-2">
                                    {statusStats.RESEARCHING || 0}
                                </div>
                                <span className="text-[11px] text-muted-foreground mt-1">
                                    Tesis en desarrollo
                                </span>
                            </div>

                            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col justify-between">
                                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                    Esperando Precio
                                </span>
                                <div className="text-2xl font-black font-mono text-foreground mt-2">
                                    {statusStats.WAITING_PRICE || 0}
                                </div>
                                <span className="text-[11px] text-muted-foreground mt-1">
                                    Cerca de punto de entrada
                                </span>
                            </div>

                            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 flex flex-col justify-between">
                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                                    Resultados
                                </span>
                                <div className="text-2xl font-black font-mono text-foreground mt-2">
                                    {statusStats.EARNINGS || 0}
                                </div>
                                <span className="text-[11px] text-muted-foreground mt-1">
                                    Siguiendo balances trimestrales
                                </span>
                            </div>

                            <div className="p-4 rounded-xl border border-border/60 bg-secondary/30 flex flex-col justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    Descartadas
                                </span>
                                <div className="text-2xl font-black font-mono text-foreground mt-2">
                                    {statusStats.DISCARDED || 0}
                                </div>
                                <span className="text-[11px] text-muted-foreground mt-1">
                                    Sin convicción actual
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-primary shrink-0" />
                        <span>Organiza tus activos asignándoles un estado en la ficha técnica.</span>
                    </div>
                </div>
            </div>

            {/* Target Price Upside Potential Ranking */}
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Target size={18} />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-foreground">
                                Ranking de Potencial de Suba (Target Price Upside)
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Distancia porcentual entre la cotización de mercado y tu precio objetivo fijado
                            </p>
                        </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                        {upsideRanking.length} con objetivo
                    </span>
                </div>

                {upsideRanking.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border/60 rounded-xl">
                        <Target size={28} className="mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-sm font-semibold text-foreground">
                            Aún no definiste precios objetivo
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                            Hacé clic en cualquier activo de tu lista y configurá un precio objetivo para
                            visualizar el ranking de potencial de suba aquí.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {upsideRanking.map((item) => {
                            const isPositive = item.upside >= 0;
                            const barWidth = Math.min(100, Math.max(5, (Math.abs(item.upside) / maxUpside) * 100));
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => onItemClick(item)}
                                    className="p-3.5 rounded-xl border border-border/50 bg-secondary/15 hover:bg-secondary/35 hover:border-border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3 min-w-[200px]">
                                        <SymbolLogo symbol={item.symbol} size={28} />
                                        <div>
                                            <div className="font-bold text-foreground font-mono text-sm flex items-center gap-1.5">
                                                <span>{item.symbol}</span>
                                                <span className="text-xs text-muted-foreground font-normal">
                                                    ${item.currentPrice?.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground line-clamp-1">
                                                Objetivo: ${item.targetPrice?.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visual Horizontal Bar */}
                                    <div className="flex-1 max-w-md mx-2 hidden md:block">
                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                                style={{ width: `${barWidth}%` }}
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                    isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Badge Metric */}
                                    <div className="text-right shrink-0">
                                        <span
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                                                isPositive
                                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                            }`}
                                        >
                                            {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                                            {isPositive ? '+' : ''}
                                            {item.upside.toFixed(1)}% Potencial
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
