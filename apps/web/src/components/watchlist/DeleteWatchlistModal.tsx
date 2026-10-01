import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

interface DeleteWatchlistModalProps {
    watchlistId: string | null;
    watchlistName?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (deletedId: string) => void;
}

export default function DeleteWatchlistModal({
    watchlistId,
    watchlistName,
    isOpen,
    onClose,
    onSuccess,
}: DeleteWatchlistModalProps) {
    const [loadingImpact, setLoadingImpact] = useState(true);
    const [impact, setImpact] = useState<any>(null);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && watchlistId) {
            setLoadingImpact(true);
            setError(null);
            apiFetch(`/watchlist/${watchlistId}/delete-impact`)
                .then(async (res) => {
                    if (res.ok) {
                        setImpact(await res.json());
                    }
                })
                .catch(() => {})
                .finally(() => setLoadingImpact(false));
        }
    }, [isOpen, watchlistId]);

    const handleDelete = async () => {
        if (!watchlistId) return;
        setDeleting(true);
        setError(null);

        try {
            const res = await apiFetch(`/watchlist/${watchlistId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'No se pudo eliminar la lista.');
            }

            onSuccess(watchlistId);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al eliminar.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl p-6 shadow-2xl">
                <DialogHeader className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive mx-auto sm:mx-0">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <DialogTitle className="text-lg font-black tracking-tight text-foreground">
                            ¿Eliminar lista de seguimiento?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
                            Estás a punto de eliminar la lista{' '}
                            <span className="font-bold text-foreground">"{watchlistName || impact?.name}"</span>.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                {error && (
                    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-semibold">
                        {error}
                    </div>
                )}

                {loadingImpact ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Calculando impacto...</span>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 space-y-3">
                        <p className="text-xs font-bold text-foreground">Impacto de la eliminación:</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl bg-background/80 p-2.5 border border-border/40">
                                <span className="block text-lg font-black text-foreground">{impact?.itemCount ?? 0}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Activos</span>
                            </div>
                            <div className="rounded-xl bg-background/80 p-2.5 border border-border/40">
                                <span className="block text-lg font-black text-foreground">{impact?.notesCount ?? 0}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Notas</span>
                            </div>
                            <div className="rounded-xl bg-background/80 p-2.5 border border-border/40">
                                <span className="block text-lg font-black text-foreground">{impact?.alertsCount ?? 0}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Alertas vinculadas</span>
                            </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Esta acción eliminará los activos y notas registradas en esta lista. Tus posiciones en{' '}
                            <b className="text-foreground">Portafolio</b> no se verán modificadas.
                        </p>
                    </div>
                )}

                <DialogFooter className="pt-2 gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={deleting}
                        onClick={onClose}
                        className="rounded-xl text-xs font-bold text-muted-foreground"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deleting || loadingImpact}
                        onClick={handleDelete}
                        className="rounded-xl text-xs font-bold gap-1.5"
                    >
                        {deleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Eliminar lista
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
