import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import { Loader2, ListPlus, Edit3 } from 'lucide-react';

interface CreateEditWatchlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    watchlist?: any | null; // Si existe, estamos editando
    onSuccess: (savedWatchlist: any) => void;
}

const COLORS = [
    { key: 'emerald', label: 'Verde Esmeralda', bg: 'bg-emerald-500' },
    { key: 'blue', label: 'Azul', bg: 'bg-blue-500' },
    { key: 'purple', label: 'Púrpura', bg: 'bg-purple-500' },
    { key: 'amber', label: 'Ámbar', bg: 'bg-amber-500' },
    { key: 'rose', label: 'Rosa', bg: 'bg-rose-500' },
    { key: 'cyan', label: 'Cian', bg: 'bg-cyan-500' },
];

export default function CreateEditWatchlistModal({
    isOpen,
    onClose,
    watchlist,
    onSuccess,
}: CreateEditWatchlistModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('emerald');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = Boolean(watchlist);

    useEffect(() => {
        if (watchlist) {
            setName(watchlist.name || '');
            setDescription(watchlist.description || '');
            setColor(watchlist.color || 'emerald');
        } else {
            setName('');
            setDescription('');
            setColor('emerald');
        }
        setError(null);
    }, [watchlist, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('El nombre de la lista es obligatorio.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const url = isEditing ? `/watchlist/${watchlist.id}` : '/watchlist';
            const method = isEditing ? 'PATCH' : 'POST';

            const res = await apiFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    color,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Error al guardar la lista de seguimiento.');
            }

            const data = await res.json();
            onSuccess(data);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al procesar la solicitud.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl p-6 shadow-2xl">
                <DialogHeader className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        {isEditing ? <Edit3 className="h-5 w-5" /> : <ListPlus className="h-5 w-5" />}
                        <DialogTitle className="text-lg font-black tracking-tight text-foreground">
                            {isEditing ? 'Editar lista de seguimiento' : 'Nueva lista de seguimiento'}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {isEditing
                            ? 'Modificá los detalles de tu lista de seguimiento personal.'
                            : 'Organizá los activos que estás investigando bajo tus propios criterios.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {error && (
                        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-semibold">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Nombre de la lista *</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. CEDEARs de dividendos, Semiconductores, Value..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-10 rounded-xl border border-border/60 bg-background/80 px-3 text-xs text-foreground outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Descripción (opcional)</label>
                        <textarea
                            rows={2}
                            placeholder="Notas generales o criterios de selección para esta lista..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-xl border border-border/60 bg-background/80 p-3 text-xs text-foreground outline-none focus:border-emerald-500 transition-colors resize-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Color distintivo</label>
                        <div className="flex items-center gap-2 pt-1">
                            {COLORS.map((c) => (
                                <button
                                    key={c.key}
                                    type="button"
                                    onClick={() => setColor(c.key)}
                                    className={`w-7 h-7 rounded-full ${c.bg} transition-all ${color === c.key
                                            ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card scale-110'
                                            : 'opacity-70 hover:opacity-100'
                                        }`}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="pt-4 flex flex-row items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 px-5 rounded-xl text-sm font-semibold text-muted-foreground border border-border/60 bg-secondary/40 hover:bg-secondary/70 hover:text-foreground transition-all active:scale-[0.98]"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !name.trim()}
                            className="h-10 px-5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:shadow-emerald-500/30 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isEditing ? 'Guardar cambios' : 'Crear lista'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
