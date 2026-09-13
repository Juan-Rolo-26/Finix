import { FormEvent, useEffect, useState } from 'react';
import { adminFetch, readAdminErrorMessage } from '../lib/api';
import { RefreshCw, ScrollText, Search } from 'lucide-react';

type AuditLogRow = {
    id: string;
    action: string;
    targetId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    metadata: string | null;
    createdAt: string;
    actor: {
        id: string;
        username: string;
        email: string;
        role: string;
    };
};

const PAGE_SIZE = 50;

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLogRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionInput, setActionInput] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshTick, setRefreshTick] = useState(0);
    const [error, setError] = useState('');

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    useEffect(() => {
        let cancelled = false;

        const loadLogs = async () => {
            setLoading(true);
            setError('');

            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(PAGE_SIZE),
                });

                if (actionFilter) {
                    params.set('action', actionFilter);
                }

                const res = await adminFetch(`/admin/audit-logs?${params.toString()}`);
                if (!res.ok) {
                    throw new Error(await readAdminErrorMessage(res, 'No se pudieron cargar los logs'));
                }

                const data = await res.json();
                if (cancelled) {
                    return;
                }

                setLogs(data.data || []);
                setTotal(data.total || 0);
            } catch (nextError: any) {
                if (!cancelled) {
                    setError(nextError?.message || 'No se pudieron cargar los logs');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadLogs();

        return () => {
            cancelled = true;
        };
    }, [actionFilter, page, refreshTick]);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPage(1);
        setActionFilter(actionInput.trim());
        setRefreshTick((current) => current + 1);
    };

    const renderMetadata = (value: string | null) => {
        if (!value) {
            return 'Sin metadata';
        }

        try {
            const parsed = JSON.parse(value) as Record<string, unknown>;
            return Object.entries(parsed)
                .slice(0, 3)
                .map(([key, entry]) => `${key}: ${String(entry)}`)
                .join(' | ');
        } catch {
            return value;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Auditoría</h1>
                    <p className="text-sm text-muted-foreground">
                        Historial operativo del admin para revisar acciones críticas y borrados permanentes.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
                    <form onSubmit={handleSearch} className="relative w-full xl:w-96">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Filtrar por acción..."
                            value={actionInput}
                            onChange={(event) => setActionInput(event.target.value)}
                            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                    </form>

                    <button
                        type="button"
                        onClick={() => setRefreshTick((current) => current + 1)}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/90 p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Logs totales</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">{total.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
                        <ScrollText className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-foreground/90">
                        <thead className="sticky top-0 bg-secondary/60 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Fecha</th>
                                <th className="px-6 py-4 font-semibold">Actor</th>
                                <th className="px-6 py-4 font-semibold">Acción</th>
                                <th className="px-6 py-4 font-semibold">Target</th>
                                <th className="px-6 py-4 font-semibold">Metadata</th>
                                <th className="px-6 py-4 font-semibold">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                            {logs.map((log) => (
                                <tr key={log.id} className="transition-colors hover:bg-secondary/20">
                                    <td className="px-6 py-4 text-xs text-muted-foreground">
                                        {new Date(log.createdAt).toLocaleString('es-AR', {
                                            dateStyle: 'short',
                                            timeStyle: 'short',
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-foreground">{log.actor?.username || 'Sistema'}</span>
                                            <span className="text-xs text-muted-foreground">{log.actor?.email || 'Sin email'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground/90">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                                        {log.targetId || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-muted-foreground">
                                        {renderMetadata(log.metadata)}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-muted-foreground">
                                        {log.ipAddress || '-'}
                                    </td>
                                </tr>
                            ))}

                            {logs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        No hay logs para esos filtros.
                                    </td>
                                </tr>
                            )}

                            {loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        Cargando logs...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                    Página {page} de {totalPages}. Total: {total.toLocaleString()} eventos.
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}
