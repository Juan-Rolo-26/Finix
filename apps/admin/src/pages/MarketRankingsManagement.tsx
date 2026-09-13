import { useState, useEffect } from 'react';
import {
    TrendingUp,
    Play,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Layers,
    Loader2
} from 'lucide-react';
import { adminFetch } from '../lib/api';

interface TopGainer {
    rank: number;
    ticker: string;
    companyName: string;
    price: number;
    previousClose: number;
    change: number;
    changePercent: number;
    volume: number;
    logoUrl: string;
    timestamp: string;
}

interface ExecutionLog {
    id: string;
    executedAt: string;
    rankingType: string;
    targetDate: string;
    status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
    providerUsed: string;
    assetsProcessed: number;
    errorsCount: number;
    durationMs: number;
    topResultsJson?: string;
    errorMessage?: string;
}

export default function MarketRankingsManagement() {
    const [latestRankings, setLatestRankings] = useState<TopGainer[]>([]);
    const [rankingDate, setRankingDate] = useState<string>('');
    const [isStale, setIsStale] = useState<boolean>(false);
    const [logs, setLogs] = useState<ExecutionLog[]>([]);
    const [totalSP500, setTotalSP500] = useState<number>(0);
    const [serverDateNY, setServerDateNY] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isTriggering, setIsTriggering] = useState<boolean>(false);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await adminFetch('/market/rankings/admin/overview');
            if (res.ok) {
                const data = await res.json();
                setLatestRankings(data.latestRankings?.items || []);
                setRankingDate(data.latestRankings?.date || '');
                setIsStale(Boolean(data.latestRankings?.isStale));
                setLogs(data.logs || []);
                setTotalSP500(data.totalSP500Assets || 0);
                setServerDateNY(data.serverDateNY || '');
            }
        } catch (err: any) {
            setFeedbackMsg({ type: 'error', text: 'Error al cargar datos del ranking' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleTriggerManual = async () => {
        setIsTriggering(true);
        setFeedbackMsg(null);
        try {
            const res = await adminFetch('/market/rankings/admin/trigger', {
                method: 'POST',
                body: JSON.stringify({ rankingType: 'TOP_GAINERS' }),
            });
            if (res.ok) {
                const data = await res.json();
                setFeedbackMsg({
                    type: 'success',
                    text: `Ranking procesado exitosamente para ${data.date}. ${data.count} activos analizados.`,
                });
                await loadData();
            } else {
                throw new Error('Falló el procesamiento del ranking');
            }
        } catch (err: any) {
            setFeedbackMsg({ type: 'error', text: err.message || 'Error al ejecutar ranking' });
        } finally {
            setIsTriggering(false);
        }
    };

    const handleSyncUniverse = async () => {
        setIsSyncing(true);
        setFeedbackMsg(null);
        try {
            const res = await adminFetch('/market/rankings/admin/sync-universe', {
                method: 'POST',
            });
            if (res.ok) {
                const data = await res.json();
                setFeedbackMsg({
                    type: 'success',
                    text: `Universo S&P 500 sincronizado: ${data.count} componentes actualizados.`,
                });
                await loadData();
            } else {
                throw new Error('Falló la sincronización de constituyentes');
            }
        } catch (err: any) {
            setFeedbackMsg({ type: 'error', text: err.message || 'Error al sincronizar componentes' });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                        Rankings de Mercado
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gestión del motor de rankings del S&P 500, ejecución manual y logs de auditoría.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSyncUniverse}
                        disabled={isSyncing || isTriggering}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-secondary/80 hover:bg-secondary text-foreground border border-border transition-colors disabled:opacity-50"
                    >
                        {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                        Sincronizar S&P 500
                    </button>

                    <button
                        onClick={handleTriggerManual}
                        disabled={isTriggering || isSyncing}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors disabled:opacity-50"
                    >
                        {isTriggering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        Ejecutar Ranking Ahora
                    </button>
                </div>
            </div>

            {/* Feedback alert */}
            {feedbackMsg && (
                <div
                    className={`p-4 rounded-xl text-sm border flex items-center gap-3 ${feedbackMsg.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}
                >
                    {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <span>{feedbackMsg.text}</span>
                </div>
            )}

            {/* Status KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border p-5 rounded-2xl">
                    <p className="text-xs text-muted-foreground mb-1">Componentes S&P 500</p>
                    <h3 className="text-2xl font-bold text-foreground">{totalSP500}</h3>
                    <p className="text-[11px] text-emerald-500 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Universo verificado
                    </p>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl">
                    <p className="text-xs text-muted-foreground mb-1">Fecha Mercado (NY)</p>
                    <h3 className="text-xl font-bold text-foreground">{serverDateNY || '--'}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1">America/New_York (16:05 ET)</p>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl">
                    <p className="text-xs text-muted-foreground mb-1">Último Ranking Guardado</p>
                    <h3 className="text-xl font-bold text-foreground">{rankingDate || '--'}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1">
                        {isStale ? 'Datos del cierre previo' : 'Datos al día'}
                    </p>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl">
                    <p className="text-xs text-muted-foreground mb-1">Estado de Ejecución</p>
                    <h3 className="text-xl font-bold text-emerald-400">ACTIVO</h3>
                    <p className="text-[11px] text-muted-foreground mt-1">Cron configurado 16:05 L-V</p>
                </div>
            </div>

            {/* Current Top 5 Preview */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-foreground">Último TOP 5 Generado (S&P 500)</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Fecha de ranking: <strong>{rankingDate || 'Sin registro'}</strong>
                        </p>
                    </div>
                    <button
                        onClick={loadData}
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="Refrescar vista"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
                    </button>
                </div>

                {latestRankings.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        No hay registros de rankings activos. Presioná "Ejecutar Ranking Ahora".
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-border/40 text-[11px] font-semibold text-muted-foreground uppercase bg-secondary/20">
                                    <th className="py-3 px-4 w-12 text-center">Rank</th>
                                    <th className="py-3 px-4">Activo</th>
                                    <th className="py-3 px-4 text-right">Precio</th>
                                    <th className="py-3 px-4 text-right">Cierre Prev.</th>
                                    <th className="py-3 px-4 text-right">Variación %</th>
                                    <th className="py-3 px-4 text-right">Volumen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {latestRankings.map((item) => (
                                    <tr key={item.ticker} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 px-4 text-center font-black text-emerald-400">
                                            #{item.rank}
                                        </td>
                                        <td className="py-3 px-4 flex items-center gap-3">
                                            <img
                                                src={item.logoUrl}
                                                alt={item.ticker}
                                                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                                className="w-7 h-7 rounded-lg object-contain bg-secondary p-0.5"
                                            />
                                            <div>
                                                <p className="font-bold text-foreground">{item.ticker}</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-xs">{item.companyName}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-foreground">
                                            ${item.price.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                                            ${item.previousClose.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-bold text-emerald-400 bg-emerald-500/10">
                                                +{Math.abs(item.changePercent).toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right text-xs text-muted-foreground font-mono">
                                            {(item.volume / 1_000_000).toFixed(1)}M
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Execution Logs Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-base font-bold text-foreground">Historial de Ejecuciones y Auditoría</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Registro cronológico de procesos automáticos y manuales de ranking.
                    </p>
                </div>

                {logs.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        No se han registrado ejecuciones previas todavía.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-border/40 text-[11px] font-semibold text-muted-foreground uppercase bg-secondary/20">
                                    <th className="py-3 px-4">Fecha Ejecución</th>
                                    <th className="py-3 px-4">Fecha Objetivo</th>
                                    <th className="py-3 px-4">Tipo</th>
                                    <th className="py-3 px-4">Proveedor</th>
                                    <th className="py-3 px-4 text-center">Procesados</th>
                                    <th className="py-3 px-4 text-center">Errores</th>
                                    <th className="py-3 px-4 text-center">Duración</th>
                                    <th className="py-3 px-4 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                                            {new Date(log.executedAt).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-foreground">
                                            {log.targetDate}
                                        </td>
                                        <td className="py-3 px-4 font-medium text-foreground">
                                            {log.rankingType}
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground">
                                            {log.providerUsed}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono">
                                            {log.assetsProcessed}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                                            {log.errorsCount}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                                            {(log.durationMs / 1000).toFixed(1)}s
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.status === 'SUCCESS'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    }`}
                                            >
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
