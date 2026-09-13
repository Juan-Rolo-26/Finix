import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert,
    X,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Megaphone,
    AlertOctagon,
    UserX,
    HelpCircle,
    FileText,
    MessageSquare,
    User,
    MessagesSquare,
    Mail,
    Check,
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetType: 'USER' | 'POST' | 'MESSAGE' | 'COMMENT' | 'CHAT';
    targetId: string;
    targetPreview?: string;
}

interface PresetOption {
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}

const REPORT_PRESETS: PresetOption[] = [
    {
        id: 'fraude',
        label: 'Fraude o Estafa Financiera (Phishing/Scam)',
        description: 'Promesas engañosas, enlaces sospechosos o suplantación comercial',
        icon: AlertOctagon,
    },
    {
        id: 'spam',
        label: 'Spam, Spam de Links o Publicidad engañosa',
        description: 'Mensajes repetitivos, auto-promoción excesiva o links maliciosos',
        icon: Megaphone,
    },
    {
        id: 'inapropiado',
        label: 'Contenido Inapropiado u Ofensivo',
        description: 'Lenguaje de odio, contenido explícito, violencia o discriminación',
        icon: AlertTriangle,
    },
    {
        id: 'cuenta_falsa',
        label: 'Cuenta Falsa, Bot o Suplantación',
        description: 'Finge ser otra persona, trader verificado o entidad financiera',
        icon: UserX,
    },
    {
        id: 'acoso',
        label: 'Acoso o Agresión Directa',
        description: 'Amenazas, hostigamiento, difamación o ataques personales reiterados',
        icon: ShieldAlert,
    },
    {
        id: 'otro',
        label: 'Otro motivo',
        description: 'Cualquier otra infracción a los términos de uso y convivencia de Finix',
        icon: HelpCircle,
    },
];

const TARGET_TYPE_MAP: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    USER: { label: 'Usuario', icon: User },
    POST: { label: 'Publicación', icon: FileText },
    COMMENT: { label: 'Comentario', icon: MessageSquare },
    MESSAGE: { label: 'Mensaje', icon: Mail },
    CHAT: { label: 'Chat', icon: MessagesSquare },
};

export default function ReportModal({ isOpen, onClose, targetType, targetId, targetPreview }: ReportModalProps) {
    const [selectedPreset, setSelectedPreset] = useState<string>('');
    const [specification, setSpecification] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Bloquear scroll y escuchar Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen, onClose]);

    // Reset state al cerrar o cambiar objetivo
    useEffect(() => {
        if (!isOpen) {
            setSelectedPreset('');
            setSpecification('');
            setError('');
            setSuccess(false);
        }
    }, [isOpen, targetId]);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!selectedPreset) {
            setError('Por favor seleccioná un motivo para el reporte');
            return;
        }

        setError('');
        setSubmitting(true);

        const reason = specification.trim()
            ? `${selectedPreset} - ${specification.trim()}`
            : selectedPreset;

        try {
            const res = await apiFetch('/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetType, targetId, reason }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Error al enviar el reporte. Intentá nuevamente.');
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado al enviar el reporte');
        } finally {
            setSubmitting(false);
        }
    };

    const targetInfo = TARGET_TYPE_MAP[targetType] || { label: targetType, icon: ShieldAlert };
    const TargetIcon = targetInfo.icon;

    const modalContent = (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={(e) => {
                    e.stopPropagation();
                    if (e.target === e.currentTarget && !submitting) {
                        onClose();
                    }
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: 'spring', duration: 0.28, bounce: 0 }}
                    className="relative w-full max-w-lg bg-card text-card-foreground border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="report-modal-title"
                >
                    {/* Barra superior de acento con color Finix */}
                    <div className="h-1 w-full bg-gradient-to-r from-primary via-emerald-400 to-primary/80" />

                    {/* Encabezado */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 id="report-modal-title" className="font-semibold text-base text-foreground tracking-tight">
                                    Reportar Infracción
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Tu reporte es anónimo y nos ayuda a mantener Finix seguro
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
                            aria-label="Cerrar modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Contenido scrolleable */}
                    <div className="p-5 overflow-y-auto space-y-4">
                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-10 text-center flex flex-col items-center gap-3"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shadow-sm">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">
                                    Reporte Enviado con Éxito
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                                    El equipo de moderación de Finix revisará este caso a la brevedad. Gracias por cuidar y mejorar la comunidad.
                                </p>
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClose();
                                        }}
                                        className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
                                    >
                                        Aceptar
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Tarjeta resumen de lo que se está reportando */}
                                <div className="rounded-xl border border-border/70 bg-secondary/35 p-3.5 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-card border border-border/70 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                        <TargetIcon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs text-muted-foreground">Estás reportando:</span>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/25">
                                                {targetInfo.label}
                                            </span>
                                        </div>
                                        {targetPreview && (
                                            <p className="mt-1.5 text-xs text-foreground/80 italic line-clamp-2 border-l-2 border-primary/40 pl-2">
                                                "{targetPreview}"
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Selección de motivo */}
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                        Motivo del reporte <span className="text-destructive">*</span>
                                    </label>
                                    <div className="space-y-2">
                                        {REPORT_PRESETS.map((preset) => {
                                            const IconComp = preset.icon;
                                            const isSelected = selectedPreset === preset.label;

                                            return (
                                                <button
                                                    key={preset.id}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedPreset(preset.label);
                                                        setError('');
                                                    }}
                                                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all group ${
                                                        isSelected
                                                            ? 'border-primary bg-primary/10 shadow-sm'
                                                            : 'border-border/60 bg-card hover:bg-secondary/40 hover:border-border'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <div
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                                isSelected
                                                                    ? 'bg-primary text-primary-foreground'
                                                                    : 'bg-secondary text-muted-foreground group-hover:text-foreground'
                                                            }`}
                                                        >
                                                            <IconComp className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p
                                                                className={`text-sm font-medium leading-snug transition-colors ${
                                                                    isSelected ? 'text-foreground font-semibold' : 'text-foreground/90'
                                                                }`}
                                                            >
                                                                {preset.label}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                                {preset.description}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Radio indicator */}
                                                    <div
                                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                                            isSelected
                                                                ? 'border-primary bg-primary text-primary-foreground'
                                                                : 'border-muted-foreground/30 bg-card group-hover:border-primary/50'
                                                        }`}
                                                    >
                                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Campo opcional de detalles adicionales */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Detalles adicionales (opcional)
                                        </label>
                                        <span className="text-[11px] text-muted-foreground">
                                            {specification.length}/300
                                        </span>
                                    </div>
                                    <textarea
                                        value={specification}
                                        maxLength={300}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            setSpecification(e.target.value);
                                        }}
                                        placeholder="Agregá contexto adicional o información relevante para el equipo de moderación..."
                                        rows={3}
                                        className="w-full rounded-xl border border-border/70 bg-secondary/25 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 resize-none transition-all"
                                    />
                                </div>

                                {/* Mensaje de error si falla el envío */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-xs font-medium flex items-center gap-2"
                                    >
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                {/* Botones de acción */}
                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClose();
                                        }}
                                        disabled={submitting}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-border/80 bg-secondary/50 hover:bg-secondary text-foreground text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !selectedPreset}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99]"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Enviando reporte...</span>
                                            </>
                                        ) : (
                                            <span>Enviar Reporte</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
