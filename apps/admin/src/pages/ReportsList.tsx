import { useEffect, useState } from 'react';
import { adminFetch } from '../lib/api';
import { AlertCircle, CheckCircle2, ShieldBan, Trash2 } from 'lucide-react';

export default function ReportsList() {
    const [reports, setReports] = useState<any[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterType, setFilterType] = useState<string>('ALL');

    const loadReports = async () => {
        try {
            const res = await adminFetch('/admin/reports');
            if (res.ok) {
                const data = await res.json();
                setReports(data.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const handleResolve = async (id: string, customNote?: string) => {
        const note = customNote ?? prompt('Nota de resolución (Opcional):');
        if (note === null && customNote === undefined) return;

        try {
            const res = await adminFetch(`/admin/reports/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'RESOLVED', resolutionNote: note })
            });

            if (res.ok) loadReports();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAction = async (report: any) => {
        if (!confirm(`¿Estás seguro de tomar acción sobre este ${report.targetType}?`)) return;

        try {
            if (report.targetType === 'POST') {
                const res = await adminFetch(`/admin/posts/${report.targetId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deleted: true })
                });
                if (res.ok) {
                    alert('Publicación eliminada correctamente.');
                    await handleResolve(report.id, 'Publicación eliminada por administrador.');
                }
            } else if (report.targetType === 'USER') {
                const res = await adminFetch(`/admin/users/${report.targetId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'BANNED' })
                });
                if (res.ok) {
                    alert('Usuario suspendido correctamente.');
                    await handleResolve(report.id, 'Usuario suspendido por administrador.');
                }
            } else {
                alert('La acción directa para este tipo de contenido no está implementada.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filteredReports = reports.filter((r) => {
        if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
        if (filterType !== 'ALL' && r.targetType !== filterType) return false;
        return true;
    });

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">Gestión de Reportes</h1>
                <div className="flex items-center gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-secondary border border-border text-foreground/90 text-sm rounded-lg px-3 py-2 outline-none"
                    >
                        <option value="ALL">Todos los Estados</option>
                        <option value="OPEN">Abierto</option>
                        <option value="RESOLVED">Resuelto</option>
                    </select>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-secondary border border-border text-foreground/90 text-sm rounded-lg px-3 py-2 outline-none"
                    >
                        <option value="ALL">Todos los Tipos</option>
                        <option value="USER">Usuario</option>
                        <option value="POST">Publicación</option>
                        <option value="MESSAGE">Mensaje</option>
                        <option value="CHAT">Chat</option>
                    </select>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-foreground/90">
                    <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Reportado por</th>
                            <th className="px-6 py-4 font-semibold">Tipo</th>
                            <th className="px-6 py-4 font-semibold">Objetivo (ID)</th>
                            <th className="px-6 py-4 font-semibold">Razón</th>
                            <th className="px-6 py-4 font-semibold">Estado</th>
                            <th className="px-6 py-4 text-right font-semibold">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                        {filteredReports.map((r) => (
                            <tr key={r.id}>
                                <td className="px-6 py-4">{r.reporter?.username || 'Usuario Desconocido'}</td>
                                <td className="px-6 py-4">
                                    {r.targetType === 'USER' ? 'Usuario' :
                                        r.targetType === 'POST' ? 'Publicación' :
                                            r.targetType === 'MESSAGE' ? 'Mensaje' :
                                                r.targetType === 'CHAT' ? 'Chat' : r.targetType}
                                </td>
                                <td className="px-6 py-4 text-xs font-mono">{r.targetId}</td>
                                <td className="px-6 py-4 max-w-[200px] truncate">{r.reason}</td>
                                <td className="px-6 py-4">
                                    {r.status === 'OPEN' ? (
                                        <span className="flex items-center gap-1.5 text-yellow-500 font-semibold text-xs">
                                            <AlertCircle className="w-3.5 h-3.5" /> ABIERTO
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-emerald-500 font-semibold text-xs">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> RESUELTO
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {r.status === 'OPEN' ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleResolve(r.id)}
                                                title="Marcar Resuelto (Ignorar)"
                                                className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-md font-semibold text-xs hover:bg-emerald-500/20 transition-colors"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                            {r.targetType === 'USER' && (
                                                <button
                                                    onClick={() => handleAction(r)}
                                                    title="Suspender Usuario"
                                                    className="p-1.5 bg-red-500/10 text-red-500 rounded-md font-semibold text-xs hover:bg-red-500/20 transition-colors"
                                                >
                                                    <ShieldBan className="w-4 h-4" />
                                                </button>
                                            )}
                                            {r.targetType === 'POST' && (
                                                <button
                                                    onClick={() => handleAction(r)}
                                                    title="Ocultar/Eliminar Post"
                                                    className="p-1.5 bg-red-500/10 text-red-500 rounded-md font-semibold text-xs hover:bg-red-500/20 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground truncate block max-w-[150px]" title={r.resolutionNote}>
                                            {r.resolutionNote || 'Sin nota'}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
