import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import SymbolLogo from '@/components/SymbolLogo';
import {
    Target,
    Bell,
    MessageSquare,
    ExternalLink,
    Plus,
    Trash2,
    Save,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    Briefcase,
    Tag,
    Clock,
    FileText,
    Check,
    X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WatchlistDetailDrawerProps {
    item: any | null;
    watchlistId: string;
    isOpen: boolean;
    onClose: () => void;
    onItemUpdated: () => void;
}

const STATUS_OPTIONS = [
    { key: 'RESEARCHING', label: 'Investigando', color: 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { key: 'WAITING_PRICE', label: 'Esperando precio', color: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { key: 'EARNINGS', label: 'Siguiendo resultados', color: 'border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    { key: 'DISCARDED', label: 'Descartada', color: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400' },
];

export default function WatchlistDetailDrawer({
    item,
    watchlistId,
    isOpen,
    onClose,
    onItemUpdated,
}: WatchlistDetailDrawerProps) {
    const navigate = useNavigate();

    // Estado editable del activo
    const [targetPrice, setTargetPrice] = useState<string>('');
    const [personalStatus, setPersonalStatus] = useState<string>('RESEARCHING');
    const [reason, setReason] = useState<string>('');
    const [tagInput, setTagInput] = useState<string>('');
    const [tags, setTags] = useState<string[]>([]);
    const [alertEnabled, setAlertEnabled] = useState<boolean>(false);
    const [alertChannel, setAlertChannel] = useState<'EMAIL' | 'PUSH' | 'ALL'>('EMAIL');

    // Notas privadas
    const [notes, setNotes] = useState<any[]>([]);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [addingNote, setAddingNote] = useState(false);

    // Publicaciones comunitarias
    const [communityPosts, setCommunityPosts] = useState<any[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);

    // Estado de guardado
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (item) {
            setTargetPrice(item.targetPrice ? String(item.targetPrice) : '');
            setPersonalStatus(item.personalStatus || 'RESEARCHING');
            setReason(item.reason || '');
            setTags(item.tags || []);
            setNotes(item.notes || []);
            setAlertEnabled(Boolean(item.hasActiveAlert));
            setSavedSuccess(false);
            setError(null);

            // Cargar posts comunitarios relacionados
            setLoadingPosts(true);
            apiFetch(`/watchlist/posts/${item.symbol}`)
                .then(async (res) => {
                    if (res.ok) {
                        const data = await res.json();
                        setCommunityPosts(data.posts || []);
                    }
                })
                .catch(() => {})
                .finally(() => setLoadingPosts(false));
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const currentPrice = item.currentPrice;
    const targetNum = targetPrice ? parseFloat(targetPrice) : null;
    let distancePct: number | null = null;
    let isAbove = false;
    if (targetNum && currentPrice && currentPrice > 0) {
        distancePct = ((targetNum - currentPrice) / currentPrice) * 100;
        isAbove = targetNum > currentPrice;
    }

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const cleanTag = tagInput.trim().replace(/,/g, '');
            if (!tags.includes(cleanTag)) {
                setTags([...tags, cleanTag]);
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    const handleSaveItemChanges = async () => {
        setSaving(true);
        setError(null);

        try {
            const res = await apiFetch(`/watchlist/${watchlistId}/items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetPrice: targetNum,
                    targetDirection: isAbove ? 'ABOVE' : 'BELOW',
                    personalStatus,
                    reason,
                    tags: tags.join(','),
                    alertEnabled,
                    alertChannel,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Error al actualizar el activo.');
            }

            setSavedSuccess(true);
            onItemUpdated();
            setTimeout(() => setSavedSuccess(false), 2500);
        } catch (err: any) {
            setError(err.message || 'Error al guardar.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNoteContent.trim()) return;

        setAddingNote(true);
        try {
            const res = await apiFetch(`/watchlist/items/${item.id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newNoteContent.trim() }),
            });

            if (res.ok) {
                const createdNote = await res.json();
                setNotes([createdNote, ...notes]);
                setNewNoteContent('');
                onItemUpdated();
            }
        } catch {
            // best effort
        } finally {
            setAddingNote(false);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            const res = await apiFetch(`/watchlist/notes/${noteId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setNotes(notes.filter((n) => n.id !== noteId));
                onItemUpdated();
            }
        } catch {
            // best effort
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Slide-over panel */}
            <div className="relative z-50 w-full sm:max-w-xl h-full bg-card border-l border-border/60 shadow-2xl overflow-y-auto flex flex-col">
                {/* Header fijo */}
                <div className="sticky top-0 z-20 bg-card/90 backdrop-blur-md border-b border-border/40 p-6 pb-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <SymbolLogo symbol={item.symbol} size={48} />
                            <div>
                                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                                    {item.symbol}
                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-muted text-muted-foreground uppercase">
                                        {item.market} · {item.currency}
                                    </span>
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {item.name} · {item.assetType}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Botón a Mercado */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onClose();
                                    navigate(`/market/${item.symbol}`);
                                }}
                                className="rounded-xl text-xs font-bold gap-1.5 h-8 border-border/60"
                            >
                                Ver en Mercado <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Banner de portafolio si existe */}
                    {item.isInPortfolio && (
                        <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 shrink-0" />
                                <span>Tenés este activo en tu Portafolio</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    onClose();
                                    navigate('/portfolio');
                                }}
                                className="h-6 px-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-lg"
                            >
                                Ir a Portafolio
                            </Button>
                        </div>
                    )}
                </div>

                <div className="p-6 space-y-6 flex-1">
                    {/* Alerta de guardado */}
                    {savedSuccess && (
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <Check className="w-4 h-4" /> Cambios guardados con éxito.
                        </div>
                    )}
                    {error && (
                        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-semibold">
                            {error}
                        </div>
                    )}

                    {/* Cotización actual y referencia */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                                Precio Actual
                            </span>
                            <span className="text-base font-black text-foreground">
                                {currentPrice !== null ? `$${currentPrice.toLocaleString()}` : 'No disponible'}
                            </span>
                            {item.changePercent !== null && (
                                <span
                                    className={`text-[11px] font-bold block mt-0.5 ${item.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                        }`}
                                >
                                    {item.changePercent >= 0 ? '+' : ''}
                                    {item.changePercent.toFixed(2)}%
                                </span>
                            )}
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                                Precio al Agregar
                            </span>
                            <span className="text-base font-black text-foreground">
                                {item.addedPrice !== null ? `$${item.addedPrice.toLocaleString()}` : 'N/D'}
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                                Sector
                            </span>
                            <span className="text-xs font-bold text-foreground line-clamp-1">
                                {item.sector || 'General'}
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                {item.assetType}
                            </span>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                                Próximo Balance
                            </span>
                            <span className="text-xs font-bold text-foreground line-clamp-1">
                                {item.nextEarnings?.date ? item.nextEarnings.date : 'Sin fecha'}
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                {item.nextEarnings?.impact ? `Impacto ${item.nextEarnings.impact}` : 'Calendario Finix'}
                            </span>
                        </div>
                    </div>

                    {/* Estado personal del seguimiento */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground">Estado personal de seguimiento</label>
                        <div className="grid grid-cols-2 gap-2">
                            {STATUS_OPTIONS.map((opt) => (
                                <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => setPersonalStatus(opt.key)}
                                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${personalStatus === opt.key
                                            ? `${opt.color} ring-1 ring-primary/40`
                                            : 'border-border/60 hover:bg-secondary/40 text-muted-foreground'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Objetivo de precio y alertas */}
                    <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                                <Target className="w-4 h-4 text-emerald-500" />
                                <span>Precio objetivo personal ({item.currency})</span>
                            </div>
                            {distancePct !== null && (
                                <div
                                    className={`flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full ${distancePct >= 0
                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                        }`}
                                >
                                    {distancePct >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                    <span>
                                        {distancePct >= 0 ? '+' : ''}
                                        {distancePct.toFixed(1)}% ({isAbove ? 'por encima' : 'por debajo'})
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] text-muted-foreground block mb-1">
                                    Precio objetivo ($ {item.currency})
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="Ej. 185.50"
                                    value={targetPrice}
                                    onChange={(e) => setTargetPrice(e.target.value)}
                                    className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-xs font-bold text-foreground outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-muted-foreground block mb-1">
                                    Alerta de cruce de precio
                                </label>
                                <div className="flex items-center gap-2 h-10">
                                    <button
                                        type="button"
                                        onClick={() => setAlertEnabled(!alertEnabled)}
                                        className={`flex items-center gap-2 h-full px-3 rounded-xl border text-xs font-bold transition-all ${alertEnabled
                                                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                : 'border-border/60 text-muted-foreground hover:bg-secondary/40'
                                            }`}
                                    >
                                        <Bell className="w-3.5 h-3.5" />
                                        <span>{alertEnabled ? 'Alerta activa' : 'Activar alerta'}</span>
                                    </button>

                                    {alertEnabled && (
                                        <select
                                            value={alertChannel}
                                            onChange={(e: any) => setAlertChannel(e.target.value)}
                                            className="h-full rounded-xl border border-border/60 bg-background px-2 text-xs font-bold text-foreground outline-none"
                                        >
                                            <option value="EMAIL">Email</option>
                                            <option value="PUSH">App</option>
                                            <option value="ALL">Ambos</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>

                        <p className="text-[11px] text-muted-foreground">
                            {item.assetType === 'CEDEAR'
                                ? 'Este objetivo se mide en Pesos Argentinos (ARS) para el CEDEAR local en BYMA.'
                                : 'Este objetivo se mide en Dólares Estadounidenses (USD) en el mercado estadounidense.'}
                        </p>
                    </div>

                    {/* Motivo de seguimiento */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Motivo por el que lo seguís</label>
                        <textarea
                            rows={2}
                            placeholder="Ej. Líder en microchips para IA, esperando retroceso al soporte de $120..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full rounded-xl border border-border/60 bg-background/80 p-3 text-xs text-foreground outline-none focus:border-emerald-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Etiquetas personales */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                            Etiquetas personales
                        </label>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs font-bold text-foreground border border-border/40"
                                >
                                    #{tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="text-muted-foreground hover:text-foreground text-xs"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                placeholder="+ Etiqueta (Enter)..."
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                className="h-7 w-32 rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Botón para guardar cambios de la ficha */}
                    <div className="flex justify-end pt-1">
                        <Button
                            type="button"
                            size="sm"
                            disabled={saving}
                            onClick={handleSaveItemChanges}
                            className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Guardar configuración
                        </Button>
                    </div>

                    {/* Notas privadas con historial */}
                    <div className="space-y-3 pt-4 border-t border-border/40">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-emerald-500" />
                                Notas privadas ({notes.length})
                            </h4>
                            <span className="text-[11px] text-muted-foreground">Solo visibles para vos</span>
                        </div>

                        {/* Formulario nueva nota */}
                        <form onSubmit={handleAddNote} className="space-y-2">
                            <textarea
                                rows={2}
                                placeholder="Escribí una nota fechada sobre el balance, tesis de inversión o noticias..."
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                                className="w-full rounded-xl border border-border/60 bg-background/80 p-3 text-xs text-foreground outline-none focus:border-emerald-500 transition-colors resize-none"
                            />
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={addingNote || !newNoteContent.trim()}
                                    className="h-8 rounded-xl text-xs font-bold gap-1 bg-secondary text-foreground hover:bg-secondary/80 border border-border/60"
                                >
                                    {addingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                    Agregar nota
                                </Button>
                            </div>
                        </form>

                        {/* Lista de notas */}
                        <div className="space-y-2">
                            {notes.length === 0 ? (
                                <p className="text-[11px] text-muted-foreground italic text-center py-2">
                                    No hay notas registradas para este activo.
                                </p>
                            ) : (
                                notes.map((note) => (
                                    <div
                                        key={note.id}
                                        className="rounded-2xl border border-border/50 bg-background/60 p-3 text-xs space-y-1.5"
                                    >
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(note.createdAt).toLocaleString()}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteNote(note.id)}
                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                                title="Eliminar nota"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Publicaciones comunitarias relacionadas con advertencia */}
                    <div className="space-y-3 pt-4 border-t border-border/40">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                Publicaciones de la comunidad sobre {item.symbol}
                            </h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                            Las opiniones de los usuarios no constituyen datos verificados ni recomendaciones de Finix.
                        </p>

                        {loadingPosts ? (
                            <div className="py-4 flex justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : communityPosts.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic text-center py-2">
                                No hay publicaciones recientes etiquetadas con este activo.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {communityPosts.map((post) => (
                                    <div
                                        key={post.id}
                                        className="rounded-2xl border border-border/50 bg-background/50 p-3 text-xs space-y-1.5"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-foreground">
                                                @{post.author?.username || 'usuario'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(post.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground line-clamp-2 leading-relaxed">{post.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
