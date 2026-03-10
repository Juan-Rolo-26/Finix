import { useEffect, useState } from 'react';
import { adminFetch } from '../lib/api';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ReportsList() {
    const [reports, setReports] = useState<any[]>([]);

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

    const handleResolve = async (id: string) => {
        const note = prompt('Nota de resolución (Opcional):');
        if (note === null) return;

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

    return (
        <div className="space-y-6 animate-in fade-in">
            <h1 className="text-2xl font-bold tracking-tight text-white mb-6">Gestión de Reportes</h1>

            <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-zinc-300">
                    <thead className="bg-zinc-800/50 text-xs uppercase text-zinc-500">
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
                        {reports.map((r) => (
                            <tr key={r.id}>
                                <td className="px-6 py-4">{r.reporter?.username}</td>
                                <td className="px-6 py-4">{r.targetType}</td>
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
                                    {r.status === 'OPEN' && (
                                        <button
                                            onClick={() => handleResolve(r.id)}
                                            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-md font-semibold text-xs hover:bg-emerald-500/20 transition-colors"
                                        >
                                            Marcar Resuelto
                                        </button>
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
