import { useEffect, useState } from 'react';
import { adminFetch } from '../lib/api';
import {
    AlertCircle, CheckCircle2, Trash2, Eye, EyeOff,
    X, MessageSquare, User as UserIcon, FileText,
    RefreshCw, AlertTriangle, Check, Ban
} from 'lucide-react';

interface Report {
    id: string;
    reporterId: string;
    targetType: 'POST' | 'USER' | 'COMMENT' | string;
    targetId: string;
    reason: string;
    status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED' | string;
    resolutionNote?: string | null;
    createdAt: string;
    updatedAt: string;
    reporter?: {
        id: string;
        username: string;
        avatarUrl?: string;
        email?: string;
    };
    target?: any;
}

function formatDate(dateStr?: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1) return 'Hace instantes';
    if (diff < 60) return `Hace ${diff}m`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `Hace ${h}h`;
    const days = Math.floor(h / 24);
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days}d`;
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReportsList() {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const loadReports = async () => {
        setIsLoading(true);
        try {
            const res = await adminFetch('/admin/reports');
            if (res.ok) {
                const data = await res.json();
                setReports(data.data || []);
                // If modal is open, refresh selected report
                if (selectedReport) {
                    const updated = (data.data || []).find((r: Report) => r.id === selectedReport.id);
                    if (updated) setSelectedReport(updated);
                }
            }
        } catch (e) {
            console.error('Error loading reports:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    // Action: Change report status (RESOLVED, DISMISSED, OPEN)
    const handleUpdateReportStatus = async (reportId: string, status: string, note?: string) => {
        setActionLoading(true);
        try {
            const res = await adminFetch(`/admin/reports/${reportId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status,
                    resolutionNote: note || (status === 'RESOLVED' ? 'Resuelto por administrador' : status === 'DISMISSED' ? 'Descartado sin infracción' : 'Reabierto'),
                }),
            });
            if (res.ok) {
                await loadReports();
            } else {
                alert('No se pudo actualizar el estado del reporte');
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        } finally {
            setActionLoading(false);
        }
    };

    // Action: Soft delete post
    const handleDeletePost = async (postId: string, reportId?: string) => {
        if (!confirm('¿Estás seguro de ELIMINAR esta publicación del feed?')) return;
        setActionLoading(true);
        try {
            const res = await adminFetch(`/admin/posts/${postId}`, {
                method: 'PATCH',
                body: JSON.stringify({ deleted: true }),
            });
            if (res.ok) {
                alert('Publicación eliminada correctamente.');
                if (reportId) {
                    await handleUpdateReportStatus(reportId, 'RESOLVED', 'Publicación eliminada por moderador');
                } else {
                    await loadReports();
                }
            } else {
                alert('No se pudo eliminar la publicación.');
            }
        } catch (e) {
            console.error(e);
            alert('Error al eliminar publicación.');
        } finally {
            setActionLoading(false);
        }
    };

    // Action: Toggle visibility (HIDE/SHOW)
    const handleTogglePostVisibility = async (postId: string, currentVisibility: string, reportId?: string) => {
        const nextVisibility = currentVisibility === 'HIDDEN' ? 'VISIBLE' : 'HIDDEN';
        setActionLoading(true);
        try {
            const res = await adminFetch(`/admin/posts/${postId}`, {
                method: 'PATCH',
                body: JSON.stringify({ visibility: nextVisibility }),
            });
            if (res.ok) {
                alert(`Publicación ${nextVisibility === 'HIDDEN' ? 'ocultada' : 'hecha visible'} correctamente.`);
                if (reportId && nextVisibility === 'HIDDEN') {
                    await handleUpdateReportStatus(reportId, 'RESOLVED', 'Publicación ocultada por moderación');
                } else {
                    await loadReports();
                }
            } else {
                alert('No se pudo cambiar la visibilidad.');
            }
        } catch (e) {
            console.error(e);
            alert('Error al cambiar visibilidad.');
        } finally {
            setActionLoading(false);
        }
    };

    // Action: Ban user
    const handleBanUser = async (userId: string, username?: string, reportId?: string) => {
        if (!confirm(`¿Estás seguro de SUSPENDER/BANEAR la cuenta de @${username || userId}?`)) return;
        setActionLoading(true);
        try {
            const res = await adminFetch(`/admin/users/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'BANNED' }),
            });
            if (res.ok) {
                alert('Usuario suspendido correctamente.');
                if (reportId) {
                    await handleUpdateReportStatus(reportId, 'RESOLVED', `Usuario @${username || userId} suspendido`);
                } else {
                    await loadReports();
                }
            } else {
                alert('No se pudo suspender al usuario.');
            }
        } catch (e) {
            console.error(e);
            alert('Error al suspender usuario.');
        } finally {
            setActionLoading(false);
        }
    };

    // Filtered lists
    const openReportsCount = reports.filter(r => r.status === 'OPEN').length;
    const resolvedReportsCount = reports.filter(r => r.status === 'RESOLVED').length;
    const dismissedReportsCount = reports.filter(r => r.status === 'DISMISSED').length;

    const filteredReports = reports.filter((r) => {
        if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
        if (filterType !== 'ALL' && r.targetType !== filterType) return false;
        return true;
    });

    return (
        <div className="space-y-6 animate-in fade-in pb-12">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">Gestión de Reportes</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Modera publicaciones, usuarios y contenido reportado por la comunidad.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadReports}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-all"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-secondary border border-border text-foreground text-sm rounded-lg px-3 py-2 outline-none"
                    >
                        <option value="ALL">Todos los Estados ({reports.length})</option>
                        <option value="OPEN">Abiertos ({openReportsCount})</option>
                        <option value="RESOLVED">Resueltos ({resolvedReportsCount})</option>
                        <option value="DISMISSED">Descartados ({dismissedReportsCount})</option>
                    </select>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-secondary border border-border text-foreground text-sm rounded-lg px-3 py-2 outline-none"
                    >
                        <option value="ALL">Todos los Tipos</option>
                        <option value="POST">Publicaciones</option>
                        <option value="USER">Usuarios</option>
                        <option value="COMMENT">Comentarios</option>
                    </select>
                </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm">
                    <span className="text-xs text-muted-foreground font-medium">Total Reportes</span>
                    <p className="text-2xl font-bold text-foreground mt-1">{reports.length}</p>
                </div>
                <div className="p-4 rounded-xl border bg-yellow-500/5 border-yellow-500/20">
                    <span className="text-xs text-yellow-500 font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Pendientes / Abiertos
                    </span>
                    <p className="text-2xl font-bold text-yellow-500 mt-1">{openReportsCount}</p>
                </div>
                <div className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/20">
                    <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resueltos con Acción
                    </span>
                    <p className="text-2xl font-bold text-emerald-500 mt-1">{resolvedReportsCount}</p>
                </div>
                <div className="p-4 rounded-xl border bg-secondary/40">
                    <span className="text-xs text-muted-foreground font-medium">Descartados (Falsa alarma)</span>
                    <p className="text-2xl font-bold text-muted-foreground mt-1">{dismissedReportsCount}</p>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-foreground/90">
                        <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="px-5 py-3.5 font-semibold">Reportado por</th>
                                <th className="px-4 py-3.5 font-semibold">Tipo</th>
                                <th className="px-5 py-3.5 font-semibold">Contenido / Objetivo</th>
                                <th className="px-5 py-3.5 font-semibold">Motivo Reportado</th>
                                <th className="px-4 py-3.5 font-semibold">Estado</th>
                                <th className="px-5 py-3.5 text-right font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 opacity-50" />
                                        Cargando reportes...
                                    </td>
                                </tr>
                            ) : filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        No hay reportes que coincidan con los filtros seleccionados.
                                    </td>
                                </tr>
                            ) : (
                                filteredReports.map((r) => {
                                    const isPost = r.targetType === 'POST';
                                    const isUser = r.targetType === 'USER';
                                    const isComment = r.targetType === 'COMMENT';
                                    const target = r.target;
                                    const postAuthor = target?.author;
                                    const isDeleted = isPost && (target?.deletedAt !== null && target?.deletedAt !== undefined);
                                    const isHidden = isPost && target?.visibility === 'HIDDEN';

                                    return (
                                        <tr key={r.id} className="hover:bg-secondary/25 transition-colors">
                                            {/* Reporter */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                                                        {r.reporter?.username?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-xs text-foreground">
                                                            {r.reporter?.username || 'Usuario'}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            {formatDate(r.createdAt)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Type */}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    isPost ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                    isUser ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                }`}>
                                                    {isPost ? <FileText className="w-3 h-3" /> : isUser ? <UserIcon className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                                                    {isPost ? 'Publicación' : isUser ? 'Usuario' : isComment ? 'Comentario' : r.targetType}
                                                </span>
                                            </td>

                                            {/* Target Details */}
                                            <td className="px-5 py-4 max-w-xs">
                                                {isPost ? (
                                                    target ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <span className="font-medium text-foreground">@{postAuthor?.username || 'autor'}</span>
                                                                {isDeleted ? (
                                                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-500/15 text-red-500 border border-red-500/30">ELIMINADA</span>
                                                                ) : isHidden ? (
                                                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-yellow-500/15 text-yellow-500 border border-yellow-500/30">OCULTA</span>
                                                                ) : (
                                                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium text-emerald-400 bg-emerald-500/10">ACTIVA</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-foreground/80 line-clamp-2 italic">
                                                                "{target.content || '[Sin texto]'}"
                                                            </p>
                                                            {target.media?.length > 0 && (
                                                                <span className="inline-block text-[10.5px] text-muted-foreground">
                                                                    📷 Contiene {target.media.length} adjunto(s)
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-red-400 italic">Publicación eliminada o no encontrada</span>
                                                    )
                                                ) : isUser ? (
                                                    target ? (
                                                        <div className="text-xs">
                                                            <div className="font-bold text-foreground">@{target.username}</div>
                                                            <div className="text-muted-foreground text-[11px]">{target.email}</div>
                                                            <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                                                target.status === 'BANNED' ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                                                            }`}>
                                                                {target.status}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground font-mono">{r.targetId}</span>
                                                    )
                                                ) : (
                                                    <span className="text-xs font-mono text-muted-foreground">{r.targetId}</span>
                                                )}
                                            </td>

                                            {/* Reason */}
                                            <td className="px-5 py-4 max-w-[220px]">
                                                <span className="text-xs text-foreground font-medium block truncate" title={r.reason}>
                                                    {r.reason}
                                                </span>
                                                {r.resolutionNote && (
                                                    <span className="text-[11px] text-muted-foreground block truncate mt-0.5" title={r.resolutionNote}>
                                                        Nota: {r.resolutionNote}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {r.status === 'OPEN' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/25">
                                                        <AlertCircle className="w-3.5 h-3.5" /> ABIERTO
                                                    </span>
                                                ) : r.status === 'RESOLVED' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> RESUELTO
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                                                        DESCARTADO
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setSelectedReport(r)}
                                                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-1"
                                                        title="Ver detalles completos y moderar"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        Moderar
                                                    </button>

                                                    {/* Quick Post Delete */}
                                                    {isPost && target && !isDeleted && (
                                                        <button
                                                            onClick={() => handleDeletePost(target.id, r.id)}
                                                            className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                                            title="Eliminar publicación"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Quick Resolve / Dismiss */}
                                                    {r.status === 'OPEN' && (
                                                        <button
                                                            onClick={() => handleUpdateReportStatus(r.id, 'RESOLVED')}
                                                            className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors"
                                                            title="Marcar como resuelto"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Moderation Inspection Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <AlertTriangle className="w-5 h-5" />
                                </span>
                                <div>
                                    <h2 className="text-base font-bold text-foreground m-0">
                                        Moderar Reporte: {selectedReport.targetType === 'POST' ? 'Publicación' : selectedReport.targetType === 'USER' ? 'Usuario' : selectedReport.targetType}
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        ID de reporte: {selectedReport.id}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            {/* Report Meta Box */}
                            <div className="p-4 rounded-xl bg-secondary/50 border border-border/80 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Reportado por:</span>
                                    <span className="font-semibold text-foreground">@{selectedReport.reporter?.username || 'Anónimo'}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Fecha del reporte:</span>
                                    <span className="text-foreground">{formatDate(selectedReport.createdAt)}</span>
                                </div>
                                <div className="pt-2 border-t border-border/40">
                                    <span className="text-xs font-bold text-yellow-500 block mb-1">Motivo señalado:</span>
                                    <p className="text-sm font-medium text-foreground bg-background/50 p-2.5 rounded-lg border border-border/40">
                                        {selectedReport.reason}
                                    </p>
                                </div>
                                {selectedReport.resolutionNote && (
                                    <div className="pt-2 text-xs">
                                        <span className="text-muted-foreground font-semibold">Nota de resolución actual:</span>
                                        <p className="text-foreground mt-0.5">{selectedReport.resolutionNote}</p>
                                    </div>
                                )}
                            </div>

                            {/* Reported Target Details */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                    Contenido Reportado en la Plataforma
                                </h3>

                                {selectedReport.targetType === 'POST' && (
                                    selectedReport.target ? (
                                        <div className="p-4 rounded-xl border border-border bg-background space-y-3">
                                            {/* Post Author header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                                                        {selectedReport.target.author?.username?.[0]?.toUpperCase() || 'A'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-xs text-foreground">
                                                            @{selectedReport.target.author?.username}
                                                        </div>
                                                        <div className="text-[10.5px] text-muted-foreground">
                                                            Publicado {formatDate(selectedReport.target.createdAt)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {selectedReport.target.deletedAt ? (
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/15 text-red-500 border border-red-500/30">
                                                            ELIMINADA
                                                        </span>
                                                    ) : selectedReport.target.visibility === 'HIDDEN' ? (
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-500/15 text-yellow-500 border border-yellow-500/30">
                                                            OCULTA
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                            PÚBLICA / VISIBLE
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Post text content */}
                                            <div className="p-3 rounded-lg bg-secondary/30 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                                                {selectedReport.target.content || <span className="italic text-muted-foreground">[Sin texto]</span>}
                                            </div>

                                            {/* Post Media Preview */}
                                            {selectedReport.target.media && selectedReport.target.media.length > 0 && (
                                                <div className="space-y-1.5 pt-1">
                                                    <span className="text-[11px] font-semibold text-muted-foreground">Archivos adjuntos:</span>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {selectedReport.target.media.map((m: any, idx: number) => (
                                                            <div key={idx} className="rounded-lg overflow-hidden border border-border max-h-48 bg-black/40 flex items-center justify-center">
                                                                {m.mediaType?.includes('video') ? (
                                                                    <video src={m.url} controls className="max-h-48 w-full object-contain" />
                                                                ) : (
                                                                    <img src={m.url} alt="Media preview" className="max-h-48 w-full object-cover" />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-[11px] text-muted-foreground flex gap-4 pt-1">
                                                <span>👍 {selectedReport.target._count?.likes || 0} Likes</span>
                                                <span>💬 {selectedReport.target._count?.comments || 0} Comentarios</span>
                                                <span className="font-mono text-[10px]">ID: {selectedReport.target.id}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-red-400 text-xs">
                                            La publicación objetivo no existe o ya fue eliminada permanentemente.
                                        </div>
                                    )
                                )}

                                {selectedReport.targetType === 'USER' && (
                                    selectedReport.target ? (
                                        <div className="p-4 rounded-xl border border-border bg-background space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-lg text-primary">
                                                    {selectedReport.target.username?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-foreground">@{selectedReport.target.username}</h4>
                                                    <p className="text-xs text-muted-foreground">{selectedReport.target.email}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10.5px] px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                                                            Rol: {selectedReport.target.role}
                                                        </span>
                                                        <span className={`text-[10.5px] px-2 py-0.5 rounded font-bold ${
                                                            selectedReport.target.status === 'BANNED' ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                                                        }`}>
                                                            {selectedReport.target.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl border border-border text-xs text-muted-foreground">
                                            Usuario ID: {selectedReport.targetId}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Modal Actions Footer */}
                        <div className="p-5 border-t border-border bg-secondary/20 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'DISMISSED', 'Descartado: Falsa alarma / Sin infracción')}
                                    disabled={actionLoading}
                                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
                                >
                                    Descartar Reporte
                                </button>
                                <button
                                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'RESOLVED', 'Marcado como resuelto')}
                                    disabled={actionLoading}
                                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 transition-all flex items-center gap-1.5"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Resolver Reporte
                                </button>
                            </div>

                            {/* Content Actions */}
                            <div className="flex items-center gap-2">
                                {selectedReport.targetType === 'POST' && selectedReport.target && (
                                    <>
                                        <button
                                            onClick={() => handleTogglePostVisibility(
                                                selectedReport.target.id,
                                                selectedReport.target.visibility,
                                                selectedReport.id
                                            )}
                                            disabled={actionLoading}
                                            className="px-3 py-2 rounded-xl text-xs font-semibold bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 transition-all flex items-center gap-1.5"
                                        >
                                            {selectedReport.target.visibility === 'HIDDEN' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                            {selectedReport.target.visibility === 'HIDDEN' ? 'Hacer Visible' : 'Ocultar Post'}
                                        </button>

                                        {!selectedReport.target.deletedAt && (
                                            <button
                                                onClick={() => handleDeletePost(selectedReport.target.id, selectedReport.id)}
                                                disabled={actionLoading}
                                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-all flex items-center gap-1.5 shadow-lg shadow-red-500/20"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Eliminar Publicación
                                            </button>
                                        )}

                                        {selectedReport.target.author && selectedReport.target.author.status !== 'BANNED' && (
                                            <button
                                                onClick={() => handleBanUser(
                                                    selectedReport.target.author.id,
                                                    selectedReport.target.author.username,
                                                    selectedReport.id
                                                )}
                                                disabled={actionLoading}
                                                className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-all flex items-center gap-1.5"
                                                title="Suspender la cuenta del autor"
                                            >
                                                <Ban className="w-3.5 h-3.5" />
                                                Banear Autor
                                            </button>
                                        )}
                                    </>
                                )}

                                {selectedReport.targetType === 'USER' && selectedReport.target && (
                                    <button
                                        onClick={() => handleBanUser(
                                            selectedReport.target.id,
                                            selectedReport.target.username,
                                            selectedReport.id
                                        )}
                                        disabled={actionLoading || selectedReport.target.status === 'BANNED'}
                                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-all flex items-center gap-1.5"
                                    >
                                        <Ban className="w-3.5 h-3.5" />
                                        {selectedReport.target.status === 'BANNED' ? 'Usuario Baneado' : 'Suspender Usuario'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
