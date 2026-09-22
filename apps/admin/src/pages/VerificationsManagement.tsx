import { useState, useEffect } from 'react';
import { BadgeCheck, Check, X, Loader2, User, Eye } from 'lucide-react';
import { adminFetch } from '../lib/api';

export default function VerificationsManagement() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

    const getDocumentUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) return path;
        if (path.startsWith('/uploads/') || path.startsWith('uploads/')) {
            const clean = path.startsWith('/') ? path : `/${path}`;
            return `/api${clean}`;
        }
        if (path.startsWith('/api/uploads/')) {
            return path;
        }
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (supabaseUrl) {
            return `${supabaseUrl}/storage/v1/object/public/financial-verifications/${path}`;
        }
        return `https://pfyzdohllcxhztmldqou.supabase.co/storage/v1/object/public/financial-verifications/${path}`;
    };

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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <BadgeCheck className="w-6 h-6 text-emerald-500" />
                        Solicitudes de Verificación
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Gestiona las solicitudes de usuarios que desean ser verificados como Asesores Financieros.
                    </p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/50 border-b border-border text-muted-foreground font-medium">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Datos Personales</th>
                                <th className="px-6 py-4">Profesión / Entidad</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-foreground/90">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        No hay solicitudes de verificación pendientes.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-secondary/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                                    <User className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-foreground font-medium">@{req.user?.username}</p>
                                                    <p className="text-xs text-muted-foreground">{req.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-foreground">{req.fullName}</p>
                                            <p className="text-xs text-muted-foreground">{req.documentType}: {req.documentNumber} ({req.documentCountry})</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-foreground">{req.professionalCategory}</p>
                                            <p className="text-xs text-muted-foreground">Reg: {req.registrationNumber} en {req.registrationEntity}</p>
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
                                                <button
                                                    onClick={() => setSelectedRequest(req)}
                                                    className="p-2 text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                                                    title="Ver Detalles Completos"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {req.status !== 'approved' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(req.id, 'approved')}
                                                        disabled={processingId === req.id}
                                                        className="p-2 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors disabled:opacity-50"
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
                                                        className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
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

            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Detalles de Verificación</h2>
                                <p className="text-sm text-muted-foreground">Usuario: @{selectedRequest.user?.username}</p>
                            </div>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-emerald-500 border-b border-border pb-2">Datos Personales</h3>
                                    <div className="space-y-2">
                                        <p><span className="text-muted-foreground">Nombre Completo:</span> {selectedRequest.fullName}</p>
                                        <p><span className="text-muted-foreground">Documento:</span> {selectedRequest.documentType} - {selectedRequest.documentNumber}</p>
                                        <p><span className="text-muted-foreground">País Emisor:</span> {selectedRequest.documentCountry}</p>
                                    </div>

                                    <h3 className="text-lg font-semibold text-emerald-500 border-b border-border pb-2 mt-6">Archivos de Identidad</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">DNI / Documento (Frente)</p>
                                            <a href={getDocumentUrl(selectedRequest.identityDocumentFrontPath)} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm flex items-center gap-2">
                                                <Eye className="w-4 h-4" /> Ver Archivo Frente
                                            </a>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">DNI / Documento (Dorso)</p>
                                            <a href={getDocumentUrl(selectedRequest.identityDocumentBackPath)} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm flex items-center gap-2">
                                                <Eye className="w-4 h-4" /> Ver Archivo Dorso
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-emerald-500 border-b border-border pb-2">Datos Profesionales</h3>
                                    <div className="space-y-2">
                                        <p><span className="text-muted-foreground">Categoría:</span> {selectedRequest.professionalCategory}</p>
                                        <p><span className="text-muted-foreground">Entidad:</span> {selectedRequest.registrationEntity}</p>
                                        <p><span className="text-muted-foreground">N° Registro/Matrícula:</span> {selectedRequest.registrationNumber}</p>
                                        <p><span className="text-muted-foreground">País Profesional:</span> {selectedRequest.professionalCountry}</p>
                                    </div>

                                    <h3 className="text-lg font-semibold text-emerald-500 border-b border-border pb-2 mt-6">Archivo Profesional</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Certificado / Matrícula</p>
                                            <a href={getDocumentUrl(selectedRequest.professionalDocumentPath)} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm flex items-center gap-2">
                                                <Eye className="w-4 h-4" /> Ver Archivo Profesional
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-emerald-500 border-b border-border pb-2">Información Adicional (Opcional)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <p><span className="text-muted-foreground">Años Exp:</span> {selectedRequest.experienceYears || '-'}</p>
                                    <p><span className="text-muted-foreground">Especialización:</span> {selectedRequest.specialization || '-'}</p>
                                    <p><span className="text-muted-foreground">Empresa:</span> {selectedRequest.company || '-'}</p>
                                    <p><span className="text-muted-foreground">Cargo:</span> {selectedRequest.professionalPosition || '-'}</p>
                                    <p><span className="text-muted-foreground">Website:</span> {selectedRequest.website ? <a href={selectedRequest.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{selectedRequest.website}</a> : '-'}</p>
                                    <p><span className="text-muted-foreground">LinkedIn:</span> {selectedRequest.linkedin ? <a href={selectedRequest.linkedin} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{selectedRequest.linkedin}</a> : '-'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Descripción Profesional:</p>
                                    <div className="bg-secondary/20 p-3 rounded-lg text-sm whitespace-pre-wrap">
                                        {selectedRequest.professionalDescription || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-border bg-card sticky bottom-0 flex justify-end gap-3 z-10">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg transition-colors font-medium"
                            >
                                Cerrar
                            </button>
                            {selectedRequest.status !== 'approved' && (
                                <button
                                    onClick={() => {
                                        handleUpdateStatus(selectedRequest.id, 'approved');
                                        setSelectedRequest(null);
                                    }}
                                    disabled={processingId === selectedRequest.id}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" /> Aprobar
                                </button>
                            )}
                            {selectedRequest.status !== 'rejected' && (
                                <button
                                    onClick={() => {
                                        const reason = prompt('Rechazar - Motivo (Opcional):');
                                        if (reason !== null) {
                                            handleUpdateStatus(selectedRequest.id, 'rejected', reason);
                                            setSelectedRequest(null);
                                        }
                                    }}
                                    disabled={processingId === selectedRequest.id}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" /> Rechazar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
