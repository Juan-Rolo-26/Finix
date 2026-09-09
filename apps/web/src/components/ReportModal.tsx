import { useState } from 'react';
import { ShieldAlert, X, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetType: 'USER' | 'POST' | 'MESSAGE' | 'COMMENT' | 'CHAT';
    targetId: string;
    targetPreview?: string;
}

export default function ReportModal({ isOpen, onClose, targetType, targetId, targetPreview }: ReportModalProps) {
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const res = await apiFetch('/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetType, targetId, reason }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error al enviar reporte');
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setReason('');
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#121214] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2 text-rose-500">
                        <ShieldAlert className="w-5 h-5" />
                        <h2 className="font-semibold text-zinc-100">Reportar Infracción</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    {success ? (
                        <div className="py-8 text-center flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
                                <ShieldAlert className="w-6 h-6 shrink-0" />
                            </div>
                            <p className="text-zinc-100 font-medium text-lg">Reporte Recibido</p>
                            <p className="text-zinc-400 text-sm">Finix revisará este caso a la brevedad. Gracias por mantener la plataforma segura.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="text-sm bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-rose-200">
                                Estás reportando un <strong>{targetType === 'USER' ? 'Usuario' : targetType === 'POST' ? 'Publicación' : targetType === 'CHAT' ? 'Chat' : 'Mensaje'}</strong>.
                                {targetPreview && <p className="mt-1 opacity-75 italic">"{targetPreview.substring(0, 50)}..."</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Motivo del reporte
                                </label>
                                <textarea
                                    required
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Explica qué norma comunitaria infringe (Spam, acoso, contenido ilegal, estafa, etc.)."
                                    className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 resize-none transition-colors"
                                />
                            </div>

                            {error && (
                                <p className="text-rose-500 text-sm">{error}</p>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium rounded-lg text-sm transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !reason.trim()}
                                    className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 focus:ring-2 focus:ring-rose-500 text-white font-medium rounded-lg text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Reporte'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
