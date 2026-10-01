import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Bookmark, Plus, Check, Loader2 } from 'lucide-react';
import SymbolLogo from '@/components/SymbolLogo';

interface AddToWatchlistModalProps {
    symbol: string;
    name?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddToWatchlistModal({
    symbol,
    name,
    isOpen,
    onClose,
    onSuccess,
}: AddToWatchlistModalProps) {
    const { user } = useAuthStore();
    const [lists, setLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [newListName, setNewListName] = useState('');
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const cleanSymbol = (symbol || '').trim().toUpperCase();

    const fetchLists = async () => {
        if (!user || !cleanSymbol) return;
        setLoading(true);
        try {
            const res = await apiFetch(`/watchlist/membership/${cleanSymbol}`);
            if (res.ok) {
                const data = await res.json();
                setLists(data.lists || []);
            }
        } catch {
            // best effort
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && user) {
            fetchLists();
            setSuccessMessage(null);
        }
    }, [isOpen, cleanSymbol, user]);

    const handleToggleList = async (list: any) => {
        setSavingId(list.id);
        try {
            if (list.containsSymbol) {
                // Quitar de la lista
                const res = await apiFetch(`/watchlist/${list.id}/items/${list.itemId}`, {
                    method: 'DELETE',
                });
                if (res.ok) {
                    setLists((prev) =>
                        prev.map((l) =>
                            l.id === list.id ? { ...l, containsSymbol: false, itemId: null } : l
                        )
                    );
                    setSuccessMessage(`Quitado de "${list.name}"`);
                    onSuccess?.();
                }
            } else {
                // Agregar a la lista
                const res = await apiFetch(`/watchlist/${list.id}/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        symbol: cleanSymbol,
                        name: name || cleanSymbol,
                    }),
                });
                if (res.ok) {
                    const newItem = await res.json();
                    setLists((prev) =>
                        prev.map((l) =>
                            l.id === list.id ? { ...l, containsSymbol: true, itemId: newItem.id } : l
                        )
                    );
                    setSuccessMessage(`Agregado a "${list.name}"`);
                    onSuccess?.();
                }
            }
        } catch {
            // error
        } finally {
            setSavingId(null);
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        setIsCreatingList(true);
        try {
            const res = await apiFetch('/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newListName.trim() }),
            });

            if (res.ok) {
                const newList = await res.json();
                // Agregar el activo directamente a la lista recién creada
                const itemRes = await apiFetch(`/watchlist/${newList.id}/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symbol: cleanSymbol, name }),
                });
                const newItem = itemRes.ok ? await itemRes.json() : null;

                setLists((prev) => [
                    ...prev,
                    {
                        id: newList.id,
                        name: newList.name,
                        color: newList.color,
                        containsSymbol: true,
                        itemId: newItem?.id || null,
                    },
                ]);
                setNewListName('');
                setSuccessMessage(`Creada lista "${newList.name}" y agregado ${cleanSymbol}`);
                onSuccess?.();
            }
        } catch {
            // error
        } finally {
            setIsCreatingList(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl p-6 shadow-2xl">
                <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <SymbolLogo symbol={cleanSymbol} size={42} />
                        <div>
                            <DialogTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                                Agregar a Seguimiento
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                {name ? `${name} (${cleanSymbol})` : cleanSymbol}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {successMessage && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
                        <Check className="h-4 w-4 shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                )}

                <div className="space-y-4 py-2">
                    <p className="text-xs font-medium text-muted-foreground">
                        Elegí una o varias listas de seguimiento personales:
                    </p>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : lists.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border/80 p-5 text-center">
                            <Bookmark className="mx-auto h-7 w-7 text-muted-foreground/60 mb-2" />
                            <p className="text-xs font-semibold text-foreground">Aún no creaste listas</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Creá tu primera lista para organizar tus activos.
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                            {lists.map((list) => {
                                const isSaving = savingId === list.id;
                                return (
                                    <button
                                        key={list.id}
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => handleToggleList(list)}
                                        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${list.containsSymbol
                                                ? 'border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-500/15 text-foreground'
                                                : 'border-border/60 hover:border-border hover:bg-secondary/40 text-foreground'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${list.containsSymbol
                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                        : 'border-muted-foreground/40 bg-background'
                                                    }`}
                                            >
                                                {list.containsSymbol && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                            </div>
                                            <span className="text-xs font-bold">{list.name}</span>
                                        </div>
                                        {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Crear nueva lista rápida */}
                    <form onSubmit={handleCreateList} className="flex items-center gap-2 pt-2 border-t border-border/40">
                        <input
                            type="text"
                            placeholder="Nueva lista (ej. Dividendos)..."
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            className="flex-1 h-9 rounded-xl border border-border/60 bg-background/80 px-3 text-xs outline-none focus:border-emerald-500 transition-colors"
                        />
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!newListName.trim() || isCreatingList}
                            className="h-9 rounded-xl gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isCreatingList ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Plus className="h-3.5 w-3.5" />
                            )}
                            Crear
                        </Button>
                    </form>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
                    >
                        Listo
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
