import { useState, useEffect } from 'react';
import { BadgeCheck, Check, X, Loader2, User, Eye } from 'lucide-react';
import { adminFetch } from '../lib/api';

export default function VerificationsManagement() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await adminFetch('/admin/verifications');
            const data = await res.json();
            setRequests(data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string, reason?: string) => {
        if (!confirm(`¿Estás seguro de que deseas marcar esta solicitud como ${status.toUpperCase()}?`)) return;

        try {
            setProcessingId(id);
            const res = await adminFetch(`/admin/verifications/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, reason }),
            });
            if (res.ok) {
                // Update local list
                setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                        <BadgeCheck className="w-6 h-6 text-emerald-500" />
                        Solicitudes de Verificación
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1">
                        Gestiona las solicitudes de usuarios que desean ser verificados como Asesores Financieros.
                    </p>
                </div>
            </div>

            <div className="bg-[#121214] border border-zinc-800/60 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#09090b] border-b border-zinc-800/60 text-zinc-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Datos Personales</th>
                                <th className="px-6 py-4">Profesión / Entidad</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                        No hay solicitudes de verificación pendientes.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                                    <User className="w-5 h-5 text-zinc-500" />
                                                </div>
                                                <div>
                                                    <p className="text-zinc-100 font-medium">@{req.user?.username}</p>
                                                    <p className="text-xs text-zinc-500">{req.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-zinc-200">{req.fullName}</p>
                                            <p className="text-xs text-zinc-500">{req.documentType}: {req.documentNumber} ({req.documentCountry})</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-zinc-200">{req.professionalCategory}</p>
                                            <p className="text-xs text-zinc-500">Reg: {req.registrationNumber} en {req.registrationEntity}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                req.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                {req.status === 'approved' ? 'Aprobado' : req.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* In a real app we'd have a modal to view documents */}
                                                <button
                                                    onClick={() => window.alert('Link a documento: ' + req.professionalDocumentPath)}
                                                    className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                                                    title="Ver Documentación"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {req.status !== 'approved' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(req.id, 'approved')}
                                                        disabled={processingId === req.id}
                                                        className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Aprobar Solicitud"
                                                    >
                                                        {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                    </button>
                                                )}

                                                {req.status !== 'rejected' && (
                                                    <button
                                                        onClick={() => {
                                                            const reason = prompt('Rechazar - Motivo (Opcional):');
                                                            if (reason !== null) handleUpdateStatus(req.id, 'rejected', reason);
                                                        }}
                                                        disabled={processingId === req.id}
                                                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Rechazar Solicitud"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
