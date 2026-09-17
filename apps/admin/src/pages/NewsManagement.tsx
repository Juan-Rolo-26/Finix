import { useState, useEffect, useCallback } from 'react';
import {
    Newspaper, Loader2, ExternalLink, CheckCircle, XCircle,
    Edit3, EyeOff, ToggleLeft, ToggleRight, Clock,
    RefreshCw, AlertCircle, Image, FileText, Globe
} from 'lucide-react';
import { adminFetch } from '../lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Category {
    id: string;
    name: string;
    slug: string;
    color?: string;
    icon?: string;
    isActive: boolean;
    displayOrder: number;
    _count?: { slots: number; articles: number };
}

interface Article {
    id: string;
    url: string;
    title: string;
    description?: string;
    imageUrl?: string;
    sourceName?: string;
    publishedAt?: string;
    author?: string;
    status: string;
    isPublished: boolean;
    isActive: boolean;
    customTitle: boolean;
    customDescription: boolean;
    customImage: boolean;
}

interface SlotHistory {
    id: string;
    changedAt: string;
    previousArticle?: { title: string; url: string } | null;
    newArticle?: { title: string; url: string } | null;
}

interface Slot {
    id: string;
    slotKey: string;
    position: number;
    isActive: boolean;
    article: Article | null;
    history?: SlotHistory[];
}

interface ScrapedMetadata {
    title?: string;
    description?: string;
    imageUrl?: string;
    sourceName?: string;
    sourceUrl?: string;
    publishedAt?: string;
    author?: string;
    error?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(value?: string) {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return 'Hace instantes';
    if (diff < 60) return `Hace ${diff}m`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `Hace ${h}h`;
    if (h < 48) return 'Ayer';
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    PUBLISHED: { label: 'Publicado', className: 'bg-green-500/15 text-green-600 border-green-500/30' },
    DRAFT: { label: 'Borrador', className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30' },
    INACTIVE: { label: 'Inactivo', className: 'bg-muted text-muted-foreground border-border' },
    ERROR: { label: 'Error', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
    EMPTY: { label: 'Vacío', className: 'bg-muted/50 text-muted-foreground border-border' },
};

// ─── SlotCard ──────────────────────────────────────────────────────────────────

function SlotPreviewCard({ slot, variant, onEdit }: { slot: Slot; variant: 'hero' | 'standard' | 'banner'; onEdit: () => void }) {
    const article = slot.article;
    const statusKey = !slot.isActive ? 'INACTIVE' : (!article ? 'EMPTY' : article.status);
    const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.EMPTY;
    const isHero = variant === 'hero';
    const isBanner = variant === 'banner';

    return (
        <div
            className={`relative group rounded-2xl border overflow-hidden flex flex-col transition-all hover:shadow-lg
                ${isHero ? 'min-h-[300px]' : isBanner ? 'min-h-[120px]' : 'min-h-[200px]'}
                ${!slot.isActive ? 'opacity-50' : ''}
                bg-card border-border/50`}
        >
            {/* Image area */}
            {article?.imageUrl ? (
                <div className={`relative overflow-hidden shrink-0 ${isHero ? 'h-44' : isBanner ? 'h-full absolute inset-0' : 'h-32'}`}>
                    <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>
            ) : (
                <div className={`shrink-0 flex items-center justify-center bg-secondary/30 ${isHero ? 'h-44' : isBanner ? 'h-24' : 'h-32'}`}>
                    <Image className="w-8 h-8 text-muted-foreground/30" />
                </div>
            )}

            {/* Content */}
            <div className={`flex flex-col flex-1 p-4 ${isBanner && article?.imageUrl ? 'relative z-10' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Slot {slot.position}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusCfg.className}`}>
                            {statusCfg.label}
                        </span>
                    </div>
                    {!slot.isActive && (
                        <span className="text-[10px] text-muted-foreground italic">Desactivado</span>
                    )}
                </div>

                {article ? (
                    <>
                        <p className={`font-semibold leading-snug mb-1 ${isHero ? 'text-base line-clamp-3' : 'text-sm line-clamp-2'}`}>
                            {article.title}
                        </p>
                        {article.sourceName && (
                            <p className="text-xs text-muted-foreground mt-auto flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {article.sourceName}
                                {article.publishedAt && <span>· {formatDate(article.publishedAt)}</span>}
                            </p>
                        )}
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground italic mt-auto">Sin noticia asignada</p>
                )}
            </div>

            {/* Hover overlay with edit button */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl z-20">
                <button
                    onClick={onEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg"
                >
                    <Edit3 className="w-4 h-4" />
                    Editar Slot {slot.position}
                </button>
            </div>
        </div>
    );
}

// ─── Slot mosaic (mirrors the frontend layout) ─────────────────────────────────

function SlotsMosaic({ slots, onEditSlot }: { slots: Slot[]; onEditSlot: (slot: Slot) => void }) {
    const getSlot = (pos: number) => slots.find((s) => s.position === pos);
    const s1 = getSlot(1);
    const s2 = getSlot(2);
    const s3 = getSlot(3);
    const s4 = getSlot(4);
    const s5 = getSlot(5);

    if (!s1 || !s2 || !s3 || !s4 || !s5) return null;

    return (
        <div className="space-y-4">
            {/* Row 1: Slot 1 (hero) + Slot 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
                <SlotPreviewCard slot={s1} variant="hero" onEdit={() => onEditSlot(s1)} />
                <SlotPreviewCard slot={s2} variant="standard" onEdit={() => onEditSlot(s2)} />
            </div>
            {/* Row 2: Slot 3 + Slot 4 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SlotPreviewCard slot={s3} variant="standard" onEdit={() => onEditSlot(s3)} />
                <SlotPreviewCard slot={s4} variant="standard" onEdit={() => onEditSlot(s4)} />
            </div>
            {/* Row 3: Slot 5 (banner) */}
            <SlotPreviewCard slot={s5} variant="banner" onEdit={() => onEditSlot(s5)} />
        </div>
    );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────

function SlotEditModal({
    slot,
    categoryId,
    onClose,
    onSaved,
}: {
    slot: Slot;
    categoryId: string;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [url, setUrl] = useState(slot.article?.url || '');
    const [metadata, setMetadata] = useState<ScrapedMetadata | null>(null);
    const [scraping, setScraping] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [publishing, setPublishing] = useState(false);

    // Manual override fields
    const [customTitle, setCustomTitle] = useState(slot.article?.customTitle ?? false);
    const [customDesc, setCustomDesc] = useState(slot.article?.customDescription ?? false);
    const [customImg, setCustomImg] = useState(slot.article?.customImage ?? false);
    const [manualTitle, setManualTitle] = useState(slot.article?.title || '');
    const [manualDesc, setManualDesc] = useState(slot.article?.description || '');
    const [manualImg, setManualImg] = useState(slot.article?.imageUrl || '');

    const handlePreview = async () => {
        if (!url.trim()) return;
        setScraping(true);
        setError('');
        setMetadata(null);
        try {
            const res = await adminFetch('/admin/news/slots/scrape-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            const data = await res.json();
            setMetadata(data);
            if (!customTitle && data.title) setManualTitle(data.title);
            if (!customDesc && data.description) setManualDesc(data.description);
            if (!customImg && data.imageUrl) setManualImg(data.imageUrl);
        } catch {
            setError('No se pudo conectar con la API');
        } finally {
            setScraping(false);
        }
    };

    const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
        if (!url.trim()) { setError('La URL es obligatoria'); return; }
        setSaving(true);
        setError('');
        try {
            const res = await adminFetch(`/admin/news/slots/${slot.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    title: manualTitle || metadata?.title || 'Sin título',
                    description: manualDesc || metadata?.description,
                    imageUrl: manualImg || metadata?.imageUrl,
                    sourceName: metadata?.sourceName,
                    publishedAt: metadata?.publishedAt,
                    author: metadata?.author,
                    customTitle,
                    customDescription: customDesc,
                    customImage: customImg,
                    status,
                    categoryId,
                }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.message || 'Error al guardar');
            }
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async () => {
        try {
            await adminFetch(`/admin/news/slots/${slot.id}/toggle-active`, { method: 'PATCH' });
            onSaved();
            onClose();
        } catch {
            setError('Error al cambiar estado del slot');
        }
    };

    const displayTitle = customTitle ? manualTitle : (metadata?.title || slot.article?.title || '');
    const displayDesc = customDesc ? manualDesc : (metadata?.description || slot.article?.description || '');
    const displayImg = customImg ? manualImg : (metadata?.imageUrl || slot.article?.imageUrl || '');
    const displaySource = metadata?.sourceName || slot.article?.sourceName || '';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-card border border-border rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Slot {slot.position}</p>
                        <h2 className="text-xl font-bold text-foreground">Editar noticia</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleActive}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${slot.isActive
                                ? 'bg-green-500/10 text-green-600 border-green-500/30 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30'
                                : 'bg-muted text-muted-foreground border-border hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30'
                            }`}
                            title={slot.isActive ? 'Desactivar slot' : 'Activar slot'}
                        >
                            {slot.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                            {slot.isActive ? 'Activo' : 'Inactivo'}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground">
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* URL Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">URL de la noticia *</label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://medio.com/noticia..."
                                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                onKeyDown={(e) => e.key === 'Enter' && handlePreview()}
                            />
                            <button
                                onClick={handlePreview}
                                disabled={scraping || !url.trim()}
                                className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 border border-border disabled:opacity-50"
                            >
                                {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Preview
                            </button>
                        </div>
                        {url && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> Abrir URL
                            </a>
                        )}
                    </div>

                    {/* Error from scraping */}
                    {metadata?.error && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold">No pudimos obtener los datos automáticamente</p>
                                <p className="text-xs mt-1 opacity-80">{metadata.error}</p>
                                <p className="text-xs mt-1 opacity-80">Podés completarlos manualmente abajo.</p>
                            </div>
                        </div>
                    )}

                    {/* Preview section */}
                    {(metadata || slot.article) && (
                        <div className="rounded-2xl border border-border overflow-hidden bg-secondary/20">
                            {/* Preview image */}
                            {displayImg && (
                                <div className="h-48 overflow-hidden">
                                    <img
                                        src={displayImg}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                    />
                                </div>
                            )}
                            <div className="p-4">
                                {displaySource && <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{displaySource}</p>}
                                <p className="font-bold text-foreground leading-snug">{displayTitle || 'Sin título'}</p>
                                {displayDesc && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{displayDesc}</p>}
                                {(metadata?.publishedAt || slot.article?.publishedAt) && (
                                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(metadata?.publishedAt || slot.article?.publishedAt)}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Manual overrides */}
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-foreground">Datos manuales</p>

                        {/* Title */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={customTitle} onChange={(e) => setCustomTitle(e.target.checked)} className="rounded accent-primary" />
                                <span className="text-sm text-foreground">Usar título personalizado</span>
                            </label>
                            {customTitle && (
                                <input
                                    type="text"
                                    value={manualTitle}
                                    onChange={(e) => setManualTitle(e.target.value)}
                                    placeholder="Título personalizado..."
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={customDesc} onChange={(e) => setCustomDesc(e.target.checked)} className="rounded accent-primary" />
                                <span className="text-sm text-foreground">Usar descripción personalizada</span>
                            </label>
                            {customDesc && (
                                <textarea
                                    value={manualDesc}
                                    onChange={(e) => setManualDesc(e.target.value)}
                                    placeholder="Descripción personalizada..."
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            )}
                        </div>

                        {/* Image */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={customImg} onChange={(e) => setCustomImg(e.target.checked)} className="rounded accent-primary" />
                                <span className="text-sm text-foreground">Usar imagen personalizada</span>
                            </label>
                            {customImg && (
                                <input
                                    type="url"
                                    value={manualImg}
                                    onChange={(e) => setManualImg(e.target.value)}
                                    placeholder="https://imagen.com/foto.jpg"
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            )}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
                            <XCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => handleSave('DRAFT')}
                            disabled={saving || !url.trim()}
                            className="flex-1 py-2.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                            Guardar borrador
                        </button>
                        <button
                            onClick={() => handleSave('PUBLISHED')}
                            disabled={saving || !url.trim()}
                            className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Publicar
                        </button>
                    </div>

                    {/* Quick publish/unpublish for existing article */}
                    {slot.article && slot.article.status === 'PUBLISHED' && (
                        <button
                            onClick={async () => {
                                setPublishing(true);
                                try {
                                    await adminFetch(`/admin/news/slots/${slot.id}/unpublish`, { method: 'POST' });
                                    onSaved();
                                    onClose();
                                } catch { setError('Error al despublicar'); }
                                finally { setPublishing(false); }
                            }}
                            disabled={publishing}
                            className="w-full py-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-600 text-sm font-semibold hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-2"
                        >
                            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
                            Despublicar
                        </button>
                    )}

                    {/* Change history */}
                    {slot.history && slot.history.length > 0 && (
                        <div className="pt-4 border-t border-border">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Historial de cambios</p>
                            <div className="space-y-2">
                                {slot.history.slice(0, 3).map((h) => (
                                    <div key={h.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3 shrink-0 mt-0.5" />
                                        <span>
                                            {formatDate(h.changedAt)} — {h.newArticle?.title ? `"${h.newArticle.title.slice(0, 50)}..."` : 'Cambio registrado'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function NewsManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedSlug, setSelectedSlug] = useState<string>('');
    const [slots, setSlots] = useState<Slot[]>([]);
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [editingSlot, setEditingSlot] = useState<Slot | null>(null);

    // Load categories on mount
    useEffect(() => {
        loadCategories();
    }, []);

    // Load slots when selected category changes
    useEffect(() => {
        if (selectedSlug) loadSlots(selectedSlug);
    }, [selectedSlug]);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const res = await adminFetch('/admin/news/slots/categories');
            if (res.ok) {
                const data = await res.json();
                const cats = Array.isArray(data) ? data : [];
                setCategories(cats);
                if (cats.length > 0 && !selectedSlug) {
                    setSelectedSlug(cats[0].slug);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadSlots = async (slug: string) => {
        setSlotsLoading(true);
        try {
            const res = await adminFetch(`/admin/news/slots/category/${slug}`);
            if (res.ok) {
                const data = await res.json();
                setCategory(data.category);
                setSlots(data.slots || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleSlotSaved = useCallback(() => {
        if (selectedSlug) loadSlots(selectedSlug);
    }, [selectedSlug]);

    const selectedCategory = categories.find((c) => c.slug === selectedSlug);
    const publishedCount = slots.filter((s) => s.article?.isPublished).length;
    const totalSlots = slots.length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Newspaper className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Noticias CMS</h1>
                            <p className="text-sm text-muted-foreground">Administrá el contenido de cada slot por categoría</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={loadCategories}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-sm text-muted-foreground transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Actualizar
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Category selector */}
                    <div className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-semibold text-foreground shrink-0">Categoría:</span>
                            <div className="flex flex-wrap gap-2 flex-1">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.slug}
                                        onClick={() => setSelectedSlug(cat.slug)}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${selectedSlug === cat.slug
                                            ? 'bg-primary/10 text-primary border-primary/30 shadow-sm'
                                            : 'bg-secondary/50 text-muted-foreground border-transparent hover:border-border hover:text-foreground'
                                            }`}
                                        style={selectedSlug === cat.slug ? { color: cat.color || undefined } : undefined}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Category stats */}
                    {selectedCategory && (
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-2xl font-bold text-foreground">{publishedCount}/{totalSlots}</p>
                                <p className="text-xs text-muted-foreground">Slots publicados</p>
                            </div>
                            <div className="h-8 w-px bg-border" />
                            <div>
                                <p className="text-lg font-bold text-foreground" style={{ color: selectedCategory.color || undefined }}>
                                    {selectedCategory.name}
                                </p>
                                <p className="text-xs text-muted-foreground">Categoría activa</p>
                            </div>
                            <div className="ml-auto text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full border border-border">
                                Hacé click en cualquier slot para editar
                            </div>
                        </div>
                    )}

                    {/* Mosaic */}
                    {slotsLoading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 animate-pulse">
                            <div className="h-72 rounded-2xl bg-secondary/40" />
                            <div className="h-72 rounded-2xl bg-secondary/40" />
                            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                                <div className="h-48 rounded-2xl bg-secondary/40" />
                                <div className="h-48 rounded-2xl bg-secondary/40" />
                            </div>
                            <div className="lg:col-span-2 h-32 rounded-2xl bg-secondary/40" />
                        </div>
                    ) : slots.length > 0 ? (
                        <SlotsMosaic slots={slots} onEditSlot={setEditingSlot} />
                    ) : (
                        <div className="text-center py-24 text-muted-foreground">
                            <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="font-semibold">No hay slots para esta categoría</p>
                            <p className="text-sm mt-1">Los slots se crean automáticamente al seleccionar la categoría.</p>
                        </div>
                    )}
                </>
            )}

            {/* Edit modal */}
            {editingSlot && category && (
                <SlotEditModal
                    slot={editingSlot}
                    categoryId={category.id}
                    onClose={() => setEditingSlot(null)}
                    onSaved={handleSlotSaved}
                />
            )}
        </div>
    );
}
