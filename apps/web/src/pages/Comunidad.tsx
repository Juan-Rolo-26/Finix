import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Hash, Send, Pin, Trash2, Plus, Calendar, BookOpen,
    LayoutDashboard, AlertCircle, X, ExternalLink,
    Shield, MessageSquare, FileText, Users,
    Play, Image as ImageIcon, FileCode, Link2,
    Search, Filter, Volume2, Download,
    Video, Headphones, Globe, File, Pencil, RefreshCw,
    BarChart3, Settings2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { useAuthStore } from '@/stores/authStore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaType = 'video' | 'audio' | 'pdf' | 'image' | 'article' | 'link' | 'file';

interface HubChannel {
    id: string; slug: string; name: string; description?: string;
    icon?: string; type: 'CHAT' | 'FEED'; order: number;
}

interface HubAuthor {
    id: string; username: string; avatarUrl?: string; role: string; isVerified?: boolean;
}

interface HubMessage {
    id: string; channelId: string; content: string; mediaUrl?: string;
    isPinned: boolean; createdAt: string; author: HubAuthor;
}

interface HubPost {
    id: string; channelId: string; title?: string; content: string; mediaUrl?: string;
    isPinned: boolean; createdAt: string; author: HubAuthor;
    channel?: { id: string; name: string; slug: string; icon?: string };
    _count?: { comments: number };
}

interface HubComment {
    id: string; content: string; createdAt: string; author: HubAuthor;
}

interface HubEvent {
    id: string; title: string; description?: string; startsAt: string;
    endsAt?: string; link?: string; author: { id: string; username: string };
}

interface HubResource {
    id: string; title: string; description?: string; url: string;
    mediaType: MediaType; thumbnailUrl?: string; duration?: string;
    category?: string; author: { id: string; username: string };
}

interface AdminStats {
    totalMessages: number; totalPosts: number; totalComments: number; totalChannels: number;
    totalResources: number; totalEvents: number; totalMembers: number;
}

interface HubMember {
    id: string; username: string; avatarUrl?: string; role: string;
    isVerified?: boolean; createdAt: string;
    _count: { hubMessages: number; hubPosts: number; hubComments: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);
const isAdmin = (role?: string) => !!role && ADMIN_ROLES.has(role);

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateShort(iso: string) {
    return new Date(iso).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ─── Media detection helpers ──────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return m?.[1] ?? null;
}

function getVimeoId(url: string): string | null {
    const m = url.match(/vimeo\.com\/(\d+)/);
    return m?.[1] ?? null;
}

function getSpotifyEmbed(url: string): string | null {
    // https://open.spotify.com/episode/xxx → https://open.spotify.com/embed/episode/xxx
    const m = url.match(/open\.spotify\.com\/(episode|show|track)\/([^?]+)/);
    return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null;
}

function detectMediaType(url: string): MediaType {
    const u = url.toLowerCase().split('?')[0];
    if (getYouTubeId(url) || getVimeoId(url)) return 'video';
    if (u.match(/\.(mp4|webm|mov|avi|mkv)$/)) return 'video';
    if (u.match(/\.(mp3|wav|ogg|m4a|aac|flac|opus)$/) || getSpotifyEmbed(url)) return 'audio';
    if (u.match(/\.pdf$/)) return 'pdf';
    if (u.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/)) return 'image';
    return 'article';
}

function autoThumbnail(url: string): string | null {
    const ytId = getYouTubeId(url);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return null;
}

// ─── Media type config ────────────────────────────────────────────────────────

const MEDIA_CONFIG: Record<MediaType, { label: string; icon: typeof Video; color: string }> = {
    video:   { label: 'Video',    icon: Video,       color: 'text-red-400 bg-red-400/10' },
    audio:   { label: 'Audio',    icon: Headphones,  color: 'text-purple-400 bg-purple-400/10' },
    pdf:     { label: 'PDF',      icon: FileCode,    color: 'text-orange-400 bg-orange-400/10' },
    image:   { label: 'Imagen',   icon: ImageIcon,   color: 'text-blue-400 bg-blue-400/10' },
    article: { label: 'Artículo', icon: Globe,       color: 'text-green-400 bg-green-400/10' },
    link:    { label: 'Link',     icon: Link2,       color: 'text-cyan-400 bg-cyan-400/10' },
    file:    { label: 'Archivo',  icon: File,        color: 'text-yellow-400 bg-yellow-400/10' },
};

// ─── Disclaimer ───────────────────────────────────────────────────────────────

function Disclaimer() {
    return (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-400/80">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
                Todo el contenido es <strong>educativo e informativo</strong>. Nada de lo que se comparte constituye
                asesoramiento financiero, recomendación de inversión ni garantía de rentabilidad. Invertir implica riesgos.
            </span>
        </div>
    );
}

function AuthorBadge({ role }: { role: string }) {
    if (!isAdmin(role)) return null;
    return (
        <span className="inline-flex items-center gap-0.5 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            <Shield className="h-2.5 w-2.5" /> Admin
        </span>
    );
}

// ─── Media Player Modal ───────────────────────────────────────────────────────

function MediaPlayerModal({ resource, onClose }: { resource: HubResource; onClose: () => void }) {
    const ytId = getYouTubeId(resource.url);
    const vimeoId = getVimeoId(resource.url);
    const spotifyEmbed = getSpotifyEmbed(resource.url);

    const renderPlayer = () => {
        if (ytId) {
            return (
                <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                    className="w-full aspect-video rounded-xl"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                />
            );
        }
        if (vimeoId) {
            return (
                <iframe
                    src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
                    className="w-full aspect-video rounded-xl"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                />
            );
        }
        if (spotifyEmbed && resource.mediaType === 'audio') {
            return (
                <iframe
                    src={spotifyEmbed}
                    className="w-full rounded-xl"
                    height="232"
                    allow="encrypted-media"
                />
            );
        }
        if (resource.mediaType === 'video') {
            return (
                <video src={resource.url} controls autoPlay className="w-full rounded-xl" />
            );
        }
        if (resource.mediaType === 'audio') {
            return (
                <div className="flex flex-col items-center gap-4 py-8">
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-purple-400/10">
                        <Volume2 className="h-10 w-10 text-purple-400" />
                    </div>
                    <p className="font-semibold text-center">{resource.title}</p>
                    <audio src={resource.url} controls className="w-full" autoPlay />
                </div>
            );
        }
        if (resource.mediaType === 'pdf') {
            return (
                <iframe src={resource.url} className="w-full rounded-xl" style={{ height: '70vh' }} title={resource.title} />
            );
        }
        if (resource.mediaType === 'image') {
            return (
                <img src={resolveMediaUrl(resource.url)} alt={resource.title} className="w-full rounded-xl max-h-[70vh] object-contain" />
            );
        }
        // fallback: open external
        window.open(resource.url, '_blank', 'noopener');
        onClose();
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-3xl rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <div className="flex items-center gap-2 min-w-0">
                        {(() => {
                            const cfg = MEDIA_CONFIG[resource.mediaType] ?? MEDIA_CONFIG.link;
                            const Icon = cfg.icon;
                            return <Icon className={`h-4 w-4 shrink-0 ${cfg.color.split(' ')[0]}`} />;
                        })()}
                        <p className="font-semibold text-sm truncate">{resource.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 hover:bg-muted transition-colors text-muted-foreground"
                            title="Abrir en nueva pestaña"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>
                        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <div className="p-4">
                    {renderPlayer()}
                    {resource.description && (
                        <p className="mt-3 text-sm text-muted-foreground">{resource.description}</p>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Resource Card ────────────────────────────────────────────────────────────

function ResourceCard({
    resource,
    currentUserRole,
    onDelete,
    onPlay,
}: {
    resource: HubResource;
    currentUserRole?: string;
    onDelete: (id: string) => void;
    onPlay: (r: HubResource) => void;
}) {
    const cfg = MEDIA_CONFIG[resource.mediaType] ?? MEDIA_CONFIG.link;
    const Icon = cfg.icon;
    const thumb = resource.thumbnailUrl || autoThumbnail(resource.url);
    const isPlayable = ['video', 'audio', 'pdf', 'image'].includes(resource.mediaType);
    const isExternal = ['article', 'link', 'file'].includes(resource.mediaType);

    const handleClick = () => {
        if (isExternal) {
            window.open(resource.url, '_blank', 'noopener noreferrer');
        } else {
            onPlay(resource);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors cursor-pointer"
            onClick={handleClick}
        >
            {/* Thumbnail / top area */}
            <div className="relative aspect-video bg-muted overflow-hidden">
                {thumb ? (
                    <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className={`flex h-full w-full items-center justify-center ${cfg.color.split(' ')[1]}`}>
                        <Icon className={`h-10 w-10 ${cfg.color.split(' ')[0]} opacity-60`} />
                    </div>
                )}
                {/* Overlay */}
                {isPlayable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        {resource.mediaType === 'video' && (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                                <Play className="h-5 w-5 text-black ml-0.5" />
                            </div>
                        )}
                        {resource.mediaType === 'audio' && (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/90 shadow-lg">
                                <Headphones className="h-5 w-5 text-white" />
                            </div>
                        )}
                        {resource.mediaType === 'pdf' && (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/90 shadow-lg">
                                <FileCode className="h-5 w-5 text-white" />
                            </div>
                        )}
                        {resource.mediaType === 'image' && (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/90 shadow-lg">
                                <ImageIcon className="h-5 w-5 text-white" />
                            </div>
                        )}
                    </div>
                )}
                {/* Type badge */}
                <div className={`absolute top-2 left-2 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${cfg.color}`}>
                    <Icon className="h-2.5 w-2.5" />
                    {cfg.label}
                </div>
                {/* Duration badge */}
                {resource.duration && (
                    <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-white">
                        {resource.duration}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-3">
                <p className="font-semibold text-sm text-foreground line-clamp-2 leading-snug mb-1">
                    {resource.title}
                </p>
                {resource.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                        {resource.description}
                    </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                    {resource.category && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            {resource.category}
                        </span>
                    )}
                    <div className="flex items-center gap-1 ml-auto" onClick={e => e.stopPropagation()}>
                        {isExternal && (
                            <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded p-1 hover:bg-muted transition-colors text-muted-foreground"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        )}
                        {resource.mediaType === 'file' && (
                            <a
                                href={resource.url}
                                download
                                className="rounded p-1 hover:bg-muted transition-colors text-muted-foreground"
                            >
                                <Download className="h-3.5 w-3.5" />
                            </a>
                        )}
                        {isAdmin(currentUserRole) && (
                            <button
                                onClick={() => onDelete(resource.id)}
                                className="rounded p-1 hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="h-3.5 w-3.5 text-destructive/60" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Library View ─────────────────────────────────────────────────────────────

const MEDIA_FILTERS: { key: MediaType | 'all'; label: string; icon: typeof Video }[] = [
    { key: 'all',     label: 'Todo',      icon: BookOpen },
    { key: 'video',   label: 'Videos',    icon: Video },
    { key: 'audio',   label: 'Audio',     icon: Headphones },
    { key: 'pdf',     label: 'PDFs',      icon: FileCode },
    { key: 'image',   label: 'Imágenes',  icon: ImageIcon },
    { key: 'article', label: 'Artículos', icon: Globe },
    { key: 'file',    label: 'Archivos',  icon: File },
];

const LIB_CATEGORIES = [
    'Trading', 'Inversión', 'Crypto', 'Análisis técnico', 'Análisis fundamental',
    'Macroeconomía', 'CEDEARs', 'ETFs', 'Opciones', 'Bonos', 'Psicología', 'Herramienta', 'Otro',
];

function LibraryView({ currentUserRole }: { currentUserRole?: string }) {
    const [resources, setResources] = useState<HubResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<MediaType | 'all'>('all');
    const [search, setSearch] = useState('');
    const [playingResource, setPlayingResource] = useState<HubResource | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);

    const [form, setForm] = useState({
        title: '', description: '', url: '', mediaType: 'link' as MediaType,
        thumbnailUrl: '', duration: '', category: '',
    });

    useEffect(() => {
        apiFetch('/hub/resources')
            .then(r => r.json())
            .then(d => setResources(Array.isArray(d) ? d : []))
            .finally(() => setLoading(false));
    }, []);

    // Auto-detect media type when URL changes
    const handleUrlChange = (url: string) => {
        const detected = detectMediaType(url);
        const thumb = autoThumbnail(url);
        setForm(f => ({
            ...f,
            url,
            mediaType: detected,
            thumbnailUrl: f.thumbnailUrl || thumb || '',
        }));
    };

    const createResource = async () => {
        if (!form.title.trim() || !form.url.trim()) return;
        setCreating(true);
        try {
            const payload = {
                ...form,
                thumbnailUrl: form.thumbnailUrl || undefined,
                duration: form.duration || undefined,
                category: form.category || undefined,
            };
            const res = await apiFetch('/hub/resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const r: HubResource = await res.json();
                setResources(prev => [r, ...prev]);
                setForm({ title: '', description: '', url: '', mediaType: 'link', thumbnailUrl: '', duration: '', category: '' });
                setShowCreate(false);
            }
        } finally {
            setCreating(false);
        }
    };

    const deleteResource = async (id: string) => {
        await apiFetch(`/hub/resources/${id}`, { method: 'DELETE' });
        setResources(prev => prev.filter(r => r.id !== id));
    };

    const filtered = resources.filter(r => {
        const matchType = filterType === 'all' || r.mediaType === filterType;
        const q = search.toLowerCase();
        const matchSearch = !q || r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q);
        return matchType && matchSearch;
    });

    if (loading) {
        return <div className="flex flex-1 items-center justify-center"><div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
    }

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="border-b border-border bg-background/80 backdrop-blur px-4 py-3 space-y-3">
                {/* Search */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                        <input
                            className="w-full rounded-xl bg-muted pl-8 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                            placeholder="Buscar en la biblioteca..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    {isAdmin(currentUserRole) && (
                        <button
                            onClick={() => setShowCreate(v => !v)}
                            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shrink-0"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Agregar</span>
                        </button>
                    )}
                </div>

                {/* Type filter pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    {MEDIA_FILTERS.map(f => {
                        const Icon = f.icon;
                        const active = filterType === f.key;
                        return (
                            <button
                                key={f.key}
                                onClick={() => setFilterType(f.key)}
                                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                                    }`}
                            >
                                <Icon className="h-3 w-3" />
                                {f.label}
                                {f.key !== 'all' && (
                                    <span className={`text-[10px] ${active ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>
                                        {resources.filter(r => r.mediaType === f.key).length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Create form */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-border bg-card/50"
                    >
                        <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold text-sm">Nuevo recurso</p>
                                <button onClick={() => setShowCreate(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
                            </div>

                            {/* URL first — auto-detect */}
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">URL del recurso *</label>
                                <input
                                    className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                                    placeholder="https://youtube.com/watch?v=... o cualquier URL"
                                    value={form.url}
                                    onChange={e => handleUrlChange(e.target.value)}
                                />
                                {form.url && (
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Filter className="h-2.5 w-2.5" />
                                        Tipo detectado: <strong>{MEDIA_CONFIG[form.mediaType]?.label}</strong>
                                        {' '}· Podés cambiarlo abajo
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="col-span-2 sm:col-span-1 space-y-1">
                                    <label className="text-xs text-muted-foreground">Título *</label>
                                    <input
                                        className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                                        placeholder="Título del recurso"
                                        value={form.title}
                                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Tipo de media</label>
                                    <select
                                        className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                                        value={form.mediaType}
                                        onChange={e => setForm(f => ({ ...f, mediaType: e.target.value as MediaType }))}
                                    >
                                        {Object.entries(MEDIA_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <textarea
                                className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/60"
                                placeholder="Descripción breve (opcional)"
                                rows={2}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            />

                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Categoría</label>
                                    <select
                                        className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                                        value={form.category}
                                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    >
                                        <option value="">Sin categoría</option>
                                        {LIB_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Duración (opcional)</label>
                                    <input
                                        className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                                        placeholder="ej: 45:30"
                                        value={form.duration}
                                        onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Thumbnail URL</label>
                                    <input
                                        className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                                        placeholder="https://..."
                                        value={form.thumbnailUrl}
                                        onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Preview thumb */}
                            {(form.thumbnailUrl || autoThumbnail(form.url)) && (
                                <div className="flex items-center gap-2">
                                    <img
                                        src={form.thumbnailUrl || autoThumbnail(form.url) || ''}
                                        alt=""
                                        className="h-12 w-20 object-cover rounded-lg border border-border"
                                    />
                                    <p className="text-xs text-muted-foreground">Vista previa del thumbnail</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                                    Cancelar
                                </button>
                                <button
                                    onClick={createResource}
                                    disabled={creating || !form.title.trim() || !form.url.trim()}
                                    className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
                                >
                                    {creating ? 'Agregando...' : 'Agregar recurso'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="mx-auto max-w-5xl">
                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground/50">
                            <BookOpen className="h-10 w-10" />
                            <p className="text-sm">
                                {search || filterType !== 'all' ? 'No hay resultados para esa búsqueda' : 'La biblioteca está vacía'}
                            </p>
                            {isAdmin(currentUserRole) && !showCreate && filterType === 'all' && !search && (
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="mt-1 flex items-center gap-1.5 text-sm text-primary"
                                >
                                    <Plus className="h-4 w-4" /> Agregar el primer recurso
                                </button>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filtered.map(r => (
                            <ResourceCard
                                key={r.id}
                                resource={r}
                                currentUserRole={currentUserRole}
                                onDelete={deleteResource}
                                onPlay={setPlayingResource}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {playingResource && (
                    <MediaPlayerModal resource={playingResource} onClose={() => setPlayingResource(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function detectYouTubeInText(text: string): string | null {
    const match = text.match(/(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+)/);
    return match?.[1] ?? null;
}

function MessageBubble({
    msg, currentUserId, currentUserRole, onDelete, onPin,
}: {
    msg: HubMessage; currentUserId?: string; currentUserRole?: string;
    onDelete: (id: string) => void; onPin: (id: string, pinned: boolean) => void;
}) {
    const isMine = msg.author.id === currentUserId;
    const canDelete = isMine || isAdmin(currentUserRole);
    const canPin = isAdmin(currentUserRole);
    const ytUrl = detectYouTubeInText(msg.content);
    const ytId = ytUrl ? getYouTubeId(ytUrl) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group flex items-start gap-2.5 ${isMine ? 'flex-row-reverse' : ''}`}
        >
            <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                <AvatarImage src={msg.author.avatarUrl} />
                <AvatarFallback className="text-[10px]">{msg.author.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={`flex max-w-[80%] flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground">
                        {isMine ? 'Vos' : `@${msg.author.username}`}
                    </span>
                    <AuthorBadge role={msg.author.role} />
                    {msg.isPinned && (
                        <span className="text-[10px] text-primary flex items-center gap-0.5">
                            <Pin className="h-2.5 w-2.5" /> fijado
                        </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/50">{fmtTime(msg.createdAt)}</span>
                </div>
                <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${isMine ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                    {msg.content}
                    {msg.mediaUrl && (
                        <img src={resolveMediaUrl(msg.mediaUrl)} alt="" className="mt-2 rounded-lg max-h-48 object-cover" />
                    )}
                </div>
                {/* YouTube embed preview */}
                {ytId && !isMine && (
                    <div className="mt-1 w-full max-w-xs rounded-xl overflow-hidden border border-border">
                        <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" className="w-full" />
                        <a
                            href={ytUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-muted px-3 py-2 text-xs hover:bg-muted/80 transition-colors"
                        >
                            <Play className="h-3 w-3 text-red-500" />
                            <span className="truncate text-foreground/80">Ver en YouTube</span>
                        </a>
                    </div>
                )}
            </div>
            <div className={`flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center ${isMine ? 'flex-row-reverse order-first' : ''}`}>
                {canPin && (
                    <button onClick={() => onPin(msg.id, !msg.isPinned)} className="rounded p-1 hover:bg-muted transition-colors" title={msg.isPinned ? 'Desfijar' : 'Fijar'}>
                        <Pin className={`h-3.5 w-3.5 ${msg.isPinned ? 'text-primary' : 'text-muted-foreground'}`} />
                    </button>
                )}
                {canDelete && (
                    <button onClick={() => onDelete(msg.id)} className="rounded p-1 hover:bg-destructive/10 transition-colors" title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
    post, currentUserId, currentUserRole, onDelete, onPin, onSelect,
}: {
    post: HubPost; currentUserId?: string; currentUserRole?: string;
    onDelete: (id: string) => void; onPin: (id: string, pinned: boolean) => void;
    onSelect: (post: HubPost) => void;
}) {
    const canDelete = post.author.id === currentUserId || isAdmin(currentUserRole);
    const canPin = isAdmin(currentUserRole);
    const ytId = post.mediaUrl ? null : getYouTubeId(post.content);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-4 hover:border-border/80 transition-colors"
        >
            {post.isPinned && (
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Pin className="h-3 w-3" /> Publicación fijada
                </div>
            )}
            <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={post.author.avatarUrl} />
                    <AvatarFallback className="text-xs">{post.author.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">@{post.author.username}</span>
                        <AuthorBadge role={post.author.role} />
                        {post.channel && (
                            <span className="text-xs text-muted-foreground">{post.channel.icon} {post.channel.name}</span>
                        )}
                        <span className="text-xs text-muted-foreground/50 ml-auto">{fmtDate(post.createdAt)}</span>
                    </div>
                    {post.title && <h3 className="font-semibold text-base mb-1">{post.title}</h3>}
                    <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line line-clamp-5">
                        {post.content}
                    </p>
                    {post.mediaUrl && (
                        <img src={resolveMediaUrl(post.mediaUrl)} alt="" className="mt-3 w-full rounded-xl max-h-72 object-cover cursor-pointer" onClick={() => onSelect(post)} />
                    )}
                    {/* Auto YouTube embed from content */}
                    {ytId && !post.mediaUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-border">
                            <div className="relative">
                                <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="" className="w-full" />
                                <a
                                    href={`https://www.youtube.com/watch?v=${ytId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                                >
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600/90 shadow-lg">
                                        <Play className="h-6 w-6 text-white ml-1" />
                                    </div>
                                </a>
                            </div>
                            <div className="bg-muted px-3 py-2 text-xs text-muted-foreground flex items-center gap-1">
                                <Play className="h-3 w-3 text-red-500" /> YouTube
                            </div>
                        </div>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                        <button onClick={() => onSelect(post)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {post._count?.comments ?? 0} comentarios
                        </button>
                        {canPin && (
                            <button onClick={() => onPin(post.id, !post.isPinned)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                                <Pin className="h-3.5 w-3.5" />
                                {post.isPinned ? 'Desfijar' : 'Fijar'}
                            </button>
                        )}
                        {canDelete && (
                            <button onClick={() => onDelete(post.id)} className="flex items-center gap-1 text-xs text-destructive/70 hover:text-destructive transition-colors ml-auto">
                                <Trash2 className="h-3.5 w-3.5" /> Eliminar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Post Detail Modal ────────────────────────────────────────────────────────

function PostDetailModal({
    post, currentUserId, currentUserRole, onClose,
}: {
    post: HubPost; currentUserId?: string; currentUserRole?: string; onClose: () => void;
}) {
    const [comments, setComments] = useState<HubComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        apiFetch(`/hub/posts/${post.id}/comments`).then(r => r.json()).then(d => setComments(Array.isArray(d) ? d : []));
    }, [post.id]);

    const submit = async () => {
        if (!newComment.trim()) return;
        setSending(true);
        try {
            const res = await apiFetch(`/hub/posts/${post.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment.trim() }),
            });
            if (res.ok) { const added = await res.json(); setComments(prev => [...prev, added]); setNewComment(''); }
        } finally { setSending(false); }
    };

    const handleDeleteComment = async (id: string) => {
        await apiFetch(`/hub/comments/${id}`, { method: 'DELETE' });
        setComments(prev => prev.filter(c => c.id !== id));
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-5 py-3">
                    <span className="font-semibold text-sm">Publicación</span>
                    <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={post.author.avatarUrl} />
                            <AvatarFallback>{post.author.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">@{post.author.username}</span>
                                <AuthorBadge role={post.author.role} />
                                <span className="text-xs text-muted-foreground">{fmtDate(post.createdAt)}</span>
                            </div>
                            {post.title && <h2 className="font-bold text-lg mb-2">{post.title}</h2>}
                            <p className="text-sm leading-relaxed whitespace-pre-line">{post.content}</p>
                            {post.mediaUrl && <img src={resolveMediaUrl(post.mediaUrl)} alt="" className="mt-3 w-full rounded-xl" />}
                        </div>
                    </div>
                    <Disclaimer />
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            {comments.length} comentario{comments.length !== 1 ? 's' : ''}
                        </p>
                        <div className="space-y-3">
                            {comments.map(c => (
                                <div key={c.id} className="flex items-start gap-2.5 group">
                                    <Avatar className="h-7 w-7 shrink-0">
                                        <AvatarImage src={c.author.avatarUrl} />
                                        <AvatarFallback className="text-[10px]">{c.author.username[0]?.toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 rounded-xl bg-muted px-3 py-2">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-semibold">@{c.author.username}</span>
                                            <AuthorBadge role={c.author.role} />
                                            <span className="text-[10px] text-muted-foreground/50">{fmtTime(c.createdAt)}</span>
                                            {(c.author.id === currentUserId || isAdmin(currentUserRole)) && (
                                                <button onClick={() => handleDeleteComment(c.id)} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="h-3 w-3 text-destructive/60" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm">{c.content}</p>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Sé el primero en comentar</p>}
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border">
                        <input
                            className="flex-1 rounded-xl bg-muted px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary"
                            placeholder="Escribí tu comentario..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
                            maxLength={500}
                        />
                        <button
                            onClick={submit}
                            disabled={sending || !newComment.trim()}
                            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
                        >
                            <Send className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Chat View ────────────────────────────────────────────────────────────────

function ChatView({ channel, currentUserId, currentUserRole }: {
    channel: HubChannel; currentUserId?: string; currentUserRole?: string;
}) {
    const [messages, setMessages] = useState<HubMessage[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    const loadMessages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/hub/channels/${channel.id}/messages`);
            if (res.ok) { const d = await res.json(); setMessages(d.messages ?? []); }
        } finally { setLoading(false); }
    }, [channel.id]);

    useEffect(() => { loadMessages(); }, [loadMessages]);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const send = async () => {
        if (!input.trim()) return;
        setSending(true);
        try {
            const res = await apiFetch(`/hub/channels/${channel.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: input.trim() }),
            });
            if (res.ok) { const msg = await res.json(); setMessages(prev => [...prev, msg]); setInput(''); }
        } finally { setSending(false); }
    };

    const handleDelete = async (id: string) => {
        await apiFetch(`/hub/messages/${id}`, { method: 'DELETE' });
        setMessages(prev => prev.filter(m => m.id !== id));
    };

    const handlePin = async (id: string, pinned: boolean) => {
        const res = await apiFetch(`/hub/messages/${id}/pin`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pinned }),
        });
        if (res.ok) setMessages(prev => prev.map(m => m.id === id ? { ...m, isPinned: pinned } : m));
    };

    if (loading) return <div className="flex flex-1 items-center justify-center"><div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground/50">
                        <MessageSquare className="h-8 w-8" />
                        <p className="text-sm">Sé el primero en escribir en #{channel.name}</p>
                    </div>
                )}
                {messages.map(msg => (
                    <MessageBubble
                        key={msg.id} msg={msg}
                        currentUserId={currentUserId} currentUserRole={currentUserRole}
                        onDelete={handleDelete} onPin={handlePin}
                    />
                ))}
                <div ref={bottomRef} />
            </div>
            <div className="px-4 pb-1"><Disclaimer /></div>
            <div className="px-4 pb-4 pt-2">
                <div className="flex gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
                    <input
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                        placeholder={`Mensaje en #${channel.name}...`}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                        maxLength={1000}
                    />
                    <button
                        onClick={send}
                        disabled={sending || !input.trim()}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
                    >
                        <Send className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Feed View ────────────────────────────────────────────────────────────────

function FeedView({ channel, currentUserId, currentUserRole }: {
    channel: HubChannel | null; currentUserId?: string; currentUserRole?: string;
}) {
    const [posts, setPosts] = useState<HubPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<HubPost | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ title: '', content: '' });
    const [creating, setCreating] = useState(false);

    const loadPosts = useCallback(async () => {
        setLoading(true);
        try {
            const url = channel ? `/hub/channels/${channel.id}/posts` : '/hub/posts';
            const res = await apiFetch(url);
            if (res.ok) { const d = await res.json(); setPosts(d.posts ?? []); }
        } finally { setLoading(false); }
    }, [channel?.id]);

    useEffect(() => { loadPosts(); }, [loadPosts]);

    const createPost = async () => {
        if (!form.content.trim() || !channel) return;
        setCreating(true);
        try {
            const res = await apiFetch(`/hub/channels/${channel.id}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) { const post = await res.json(); setPosts(prev => [post, ...prev]); setForm({ title: '', content: '' }); setShowCreate(false); }
        } finally { setCreating(false); }
    };

    const handleDelete = async (id: string) => {
        await apiFetch(`/hub/posts/${id}`, { method: 'DELETE' });
        setPosts(prev => prev.filter(p => p.id !== id));
    };

    const handlePin = async (id: string, pinned: boolean) => {
        const res = await apiFetch(`/hub/posts/${id}/pin`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pinned }),
        });
        if (res.ok) setPosts(prev =>
            [...prev.map(p => p.id === id ? { ...p, isPinned: pinned } : p)]
                .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
        );
    };

    if (loading) return <div className="flex flex-1 items-center justify-center"><div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;

    return (
        <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="mx-auto w-full max-w-2xl px-4 py-4 space-y-4">
                {isAdmin(currentUserRole) && channel && (
                    <div>
                        {!showCreate ? (
                            <button onClick={() => setShowCreate(true)} className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary/70 hover:border-primary/60 hover:text-primary transition-colors">
                                <Plus className="h-4 w-4" /> Nueva publicación en {channel.icon} {channel.name}
                            </button>
                        ) : (
                            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold">Nueva publicación</span>
                                    <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                                </div>
                                <input className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary" placeholder="Título (opcional)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                                <textarea className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary resize-none" placeholder="Contenido... (podés pegar links de YouTube y se embeden automáticamente)" rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Play className="h-2.5 w-2.5 text-red-500" /> Los links de YouTube se muestran como previews automáticamente</p>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
                                    <button onClick={createPost} disabled={creating || !form.content.trim()} className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-40">
                                        {creating ? 'Publicando...' : 'Publicar'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {posts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground/50">
                        <FileText className="h-8 w-8" />
                        <p className="text-sm">No hay publicaciones aún</p>
                    </div>
                )}
                {posts.map(post => (
                    <PostCard
                        key={post.id} post={post}
                        currentUserId={currentUserId} currentUserRole={currentUserRole}
                        onDelete={handleDelete} onPin={handlePin} onSelect={setSelectedPost}
                    />
                ))}
                <Disclaimer />
            </div>
            <AnimatePresence>
                {selectedPost && (
                    <PostDetailModal post={selectedPost} currentUserId={currentUserId} currentUserRole={currentUserRole} onClose={() => setSelectedPost(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Events View ──────────────────────────────────────────────────────────────

function EventsView({ currentUserRole }: { currentUserRole?: string }) {
    const [events, setEvents] = useState<HubEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', startsAt: '', endsAt: '', link: '' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        apiFetch('/hub/events').then(r => r.json()).then(d => setEvents(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
    }, []);

    const createEvent = async () => {
        if (!form.title.trim() || !form.startsAt) return;
        setCreating(true);
        try {
            const res = await apiFetch('/hub/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            if (res.ok) {
                const e: HubEvent = await res.json();
                setEvents(prev => [...prev, e].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()));
                setForm({ title: '', description: '', startsAt: '', endsAt: '', link: '' });
                setShowCreate(false);
            }
        } finally { setCreating(false); }
    };

    const deleteEvent = async (id: string) => {
        await apiFetch(`/hub/events/${id}`, { method: 'DELETE' });
        setEvents(prev => prev.filter(e => e.id !== id));
    };

    if (loading) return <div className="flex flex-1 items-center justify-center"><div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;

    // Group by month
    const grouped = events.reduce<Record<string, HubEvent[]>>((acc, ev) => {
        const key = new Date(ev.startsAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
        if (!acc[key]) acc[key] = [];
        acc[key].push(ev);
        return acc;
    }, {});

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-2xl px-4 py-4 space-y-4">
                {isAdmin(currentUserRole) && (
                    <div>
                        {!showCreate ? (
                            <button onClick={() => setShowCreate(true)} className="flex w-full items-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary/70 hover:border-primary/60 hover:text-primary transition-colors">
                                <Plus className="h-4 w-4" /> Crear evento
                            </button>
                        ) : (
                            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-sm">Nuevo evento</span>
                                    <button onClick={() => setShowCreate(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
                                </div>
                                <input className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60" placeholder="Título del evento *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                                <textarea className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/60" placeholder="Descripción" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Inicio *</label>
                                        <input type="datetime-local" className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Fin</label>
                                        <input type="datetime-local" className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} />
                                    </div>
                                </div>
                                <input className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60" placeholder="Link del evento (Zoom, Meet, etc.)" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
                                    <button onClick={createEvent} disabled={creating || !form.title.trim() || !form.startsAt} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-40">
                                        {creating ? 'Creando...' : 'Crear evento'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {events.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground/50">
                        <Calendar className="h-8 w-8" />
                        <p className="text-sm">No hay eventos próximos</p>
                    </div>
                )}

                {Object.entries(grouped).map(([month, evs]) => (
                    <div key={month}>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3 capitalize">{month}</p>
                        <div className="space-y-2">
                            {evs.map(ev => {
                                const d = new Date(ev.startsAt);
                                const isPast = d < new Date();
                                return (
                                    <motion.div key={ev.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                        className={`rounded-xl border bg-card p-4 ${isPast ? 'border-border/40 opacity-60' : 'border-border'}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-center ${isPast ? 'bg-muted' : 'bg-primary/10 text-primary'}`}>
                                                <span className="text-lg font-bold leading-none">{d.getDate()}</span>
                                                <span className="text-[10px] uppercase font-medium opacity-80">
                                                    {d.toLocaleDateString('es-AR', { month: 'short' })}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-semibold text-sm">{ev.title}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {fmtDateShort(ev.startsAt)} · {fmtTime(ev.startsAt)}
                                                            {ev.endsAt && ` → ${fmtTime(ev.endsAt)}`}
                                                        </p>
                                                        {ev.description && <p className="text-xs text-foreground/70 mt-1">{ev.description}</p>}
                                                    </div>
                                                    {isAdmin(currentUserRole) && (
                                                        <button onClick={() => deleteEvent(ev.id)} className="shrink-0 rounded p-1 hover:bg-destructive/10 transition-colors">
                                                            <Trash2 className="h-3.5 w-3.5 text-destructive/60" />
                                                        </button>
                                                    )}
                                                </div>
                                                {ev.link && (
                                                    <a href={ev.link} target="_blank" rel="noopener noreferrer"
                                                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                                                    >
                                                        <ExternalLink className="h-3 w-3" /> Unirse al evento
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Admin Panel View ─────────────────────────────────────────────────────────

type AdminTab = 'overview' | 'channels' | 'posts' | 'members';

function AdminPanelView({ channels, onRefreshChannels }: { channels: HubChannel[]; onRefreshChannels: () => void }) {
    const [adminTab, setAdminTab] = useState<AdminTab>('overview');
    const [stats, setStats] = useState<AdminStats | null>(null);

    // ── Overview ──
    const [seeding, setSeeding] = useState(false);

    // ── Channels ──
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [channelForm, setChannelForm] = useState({ slug: '', name: '', icon: '', type: 'CHAT', description: '', order: 0 });
    const [creatingChannel, setCreatingChannel] = useState(false);
    const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', icon: '', description: '', type: 'CHAT', order: 0 });

    // ── Posts ──
    const [allPosts, setAllPosts] = useState<HubPost[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [postsLoaded, setPostsLoaded] = useState(false);
    const [postsChannelFilter, setPostsChannelFilter] = useState('all');

    // ── Members ──
    const [members, setMembers] = useState<HubMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersLoaded, setMembersLoaded] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');

    useEffect(() => {
        apiFetch('/hub/admin/stats').then(r => r.json()).then(d => setStats(d));
    }, []);

    useEffect(() => {
        if (adminTab === 'posts' && !postsLoaded) {
            setPostsLoading(true);
            apiFetch('/hub/posts?limit=100').then(r => r.json()).then(d => { setAllPosts(d.posts ?? []); setPostsLoaded(true); }).finally(() => setPostsLoading(false));
        }
        if (adminTab === 'members' && !membersLoaded) {
            setMembersLoading(true);
            apiFetch('/hub/admin/members').then(r => r.json()).then(d => { setMembers(Array.isArray(d) ? d : []); setMembersLoaded(true); }).finally(() => setMembersLoading(false));
        }
    }, [adminTab]);

    const refreshStats = () => apiFetch('/hub/admin/stats').then(r => r.json()).then(d => setStats(d));

    const seedChannels = async () => {
        setSeeding(true);
        try { await apiFetch('/hub/seed', { method: 'POST' }); onRefreshChannels(); await refreshStats(); }
        finally { setSeeding(false); }
    };

    const createChannel = async () => {
        if (!channelForm.slug.trim() || !channelForm.name.trim()) return;
        setCreatingChannel(true);
        try {
            const res = await apiFetch('/hub/channels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(channelForm) });
            if (res.ok) { setChannelForm({ slug: '', name: '', icon: '', type: 'CHAT', description: '', order: 0 }); setShowCreateChannel(false); onRefreshChannels(); await refreshStats(); }
        } finally { setCreatingChannel(false); }
    };

    const startEditChannel = (ch: HubChannel) => {
        setEditingChannelId(ch.id);
        setEditForm({ name: ch.name, icon: ch.icon ?? '', description: ch.description ?? '', type: ch.type, order: ch.order });
    };

    const saveEditChannel = async (id: string) => {
        const res = await apiFetch(`/hub/channels/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm),
        });
        if (res.ok) { setEditingChannelId(null); onRefreshChannels(); }
    };

    const deleteChannel = async (id: string) => {
        if (!confirm('¿Eliminar este canal y todo su contenido? Esta acción no se puede deshacer.')) return;
        await apiFetch(`/hub/channels/${id}`, { method: 'DELETE' });
        onRefreshChannels(); await refreshStats();
    };

    const deletePost = async (id: string) => {
        await apiFetch(`/hub/posts/${id}`, { method: 'DELETE' });
        setAllPosts(prev => prev.filter(p => p.id !== id));
        setStats(s => s ? { ...s, totalPosts: s.totalPosts - 1 } : s);
    };

    const pinPost = async (id: string, pinned: boolean) => {
        const res = await apiFetch(`/hub/posts/${id}/pin`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pinned }),
        });
        if (res.ok) setAllPosts(prev => prev.map(p => p.id === id ? { ...p, isPinned: pinned } : p));
    };

    const StatCard = ({ label, value, icon: Icon, color = 'text-primary' }: { label: string; value?: number; icon: typeof FileText; color?: string }) => (
        <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon className={`h-4 w-4 ${color}`} />
            </div>
            {value !== undefined
                ? <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                : <div className="h-7 w-16 rounded-md bg-muted animate-pulse" />
            }
        </div>
    );

    const TabBtn = ({ tab, label, icon: Icon }: { tab: AdminTab; label: string; icon: typeof Shield }) => (
        <button
            onClick={() => setAdminTab(tab)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${adminTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
        >
            <Icon className="h-3.5 w-3.5" />
            {label}
        </button>
    );

    const filteredPosts = allPosts.filter(p => postsChannelFilter === 'all' || p.channelId === postsChannelFilter);
    const filteredMembers = memberSearch
        ? members.filter(m => m.username.toLowerCase().includes(memberSearch.toLowerCase()))
        : members;

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-4 space-y-5">

                {/* Tab navigation */}
                <div className="flex items-center gap-1.5 flex-wrap border-b border-border pb-4">
                    <TabBtn tab="overview" label="Resumen" icon={BarChart3} />
                    <TabBtn tab="channels" label={`Canales (${channels.length})`} icon={Hash} />
                    <TabBtn tab="posts" label="Publicaciones" icon={FileText} />
                    <TabBtn tab="members" label="Miembros" icon={Users} />
                </div>

                {/* ─── OVERVIEW ─── */}
                {adminTab === 'overview' && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold">Estadísticas de la comunidad</h2>
                            <button onClick={refreshStats} className="rounded-lg p-1.5 hover:bg-muted transition-colors" title="Actualizar">
                                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatCard label="Miembros" value={stats?.totalMembers} icon={Users} color="text-blue-400" />
                            <StatCard label="Mensajes" value={stats?.totalMessages} icon={MessageSquare} color="text-green-400" />
                            <StatCard label="Publicaciones" value={stats?.totalPosts} icon={FileText} color="text-orange-400" />
                            <StatCard label="Comentarios" value={stats?.totalComments} icon={MessageSquare} color="text-purple-400" />
                            <StatCard label="Canales" value={stats?.totalChannels} icon={Hash} color="text-cyan-400" />
                            <StatCard label="Recursos" value={stats?.totalResources} icon={BookOpen} color="text-yellow-400" />
                            <StatCard label="Eventos" value={stats?.totalEvents} icon={Calendar} color="text-red-400" />
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <Settings2 className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-sm">Inicializar canales por defecto</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Crea los 8 canales predeterminados (General, Noticias, Argentina, Crypto, Acciones USA, ETFs, Macro, Principiantes).
                                Es idempotente — no duplica canales existentes.
                            </p>
                            <button onClick={seedChannels} disabled={seeding} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">
                                {seeding ? 'Inicializando...' : '🚀 Inicializar canales'}
                            </button>
                        </div>

                        {/* Quick access cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setAdminTab('channels')} className="rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40 transition-colors group">
                                <Hash className="h-5 w-5 text-primary mb-2" />
                                <p className="font-medium text-sm">Gestionar canales</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Crear, editar y eliminar canales</p>
                            </button>
                            <button onClick={() => setAdminTab('posts')} className="rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40 transition-colors group">
                                <FileText className="h-5 w-5 text-primary mb-2" />
                                <p className="font-medium text-sm">Moderar publicaciones</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Fijar y eliminar posts</p>
                            </button>
                            <button onClick={() => setAdminTab('members')} className="rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40 transition-colors group">
                                <Users className="h-5 w-5 text-primary mb-2" />
                                <p className="font-medium text-sm">Ver miembros</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{stats?.totalMembers ?? '—'} usuarios registrados</p>
                            </button>
                            <div className="rounded-xl border border-border bg-card p-4">
                                <BookOpen className="h-5 w-5 text-muted-foreground mb-2" />
                                <p className="font-medium text-sm text-muted-foreground">Biblioteca y Eventos</p>
                                <p className="text-xs text-muted-foreground/60 mt-0.5">Gestionarlos desde sus secciones en el sidebar</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── CHANNELS ─── */}
                {adminTab === 'channels' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">{channels.length} canales activos</p>
                            <button
                                onClick={() => setShowCreateChannel(v => !v)}
                                className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                            >
                                <Plus className="h-3 w-3" /> Nuevo canal
                            </button>
                        </div>

                        <AnimatePresence>
                            {showCreateChannel && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
                                        <p className="text-xs font-semibold text-primary">Nuevo canal</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input className="rounded-lg bg-background px-3 py-1.5 text-sm border border-border outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60" placeholder="slug (ej: opciones)" value={channelForm.slug} onChange={e => setChannelForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} />
                                            <input className="rounded-lg bg-background px-3 py-1.5 text-sm border border-border outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60" placeholder="Nombre visible" value={channelForm.name} onChange={e => setChannelForm(f => ({ ...f, name: e.target.value }))} />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <input className="rounded-lg bg-background px-3 py-1.5 text-sm border border-border outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60" placeholder="Emoji 📈" value={channelForm.icon} onChange={e => setChannelForm(f => ({ ...f, icon: e.target.value }))} />
                                            <select className="rounded-lg bg-background px-3 py-1.5 text-sm border border-border outline-none focus:ring-1 focus:ring-primary" value={channelForm.type} onChange={e => setChannelForm(f => ({ ...f, type: e.target.value }))}>
                                                <option value="CHAT">💬 Chat</option>
                                                <option value="FEED">📰 Feed</option>
                                            </select>
                                            <input type="number" className="rounded-lg bg-background px-3 py-1.5 text-sm border border-border outline-none focus:ring-1 focus:ring-primary" placeholder="Orden" value={channelForm.order} onChange={e => setChannelForm(f => ({ ...f, order: Number(e.target.value) }))} />
                                        </div>
                                        <input className="w-full rounded-lg bg-background px-3 py-1.5 text-sm border border-border outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60" placeholder="Descripción del canal" value={channelForm.description} onChange={e => setChannelForm(f => ({ ...f, description: e.target.value }))} />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setShowCreateChannel(false)} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
                                            <button onClick={createChannel} disabled={creatingChannel || !channelForm.slug || !channelForm.name} className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40">
                                                {creatingChannel ? 'Creando...' : 'Crear canal'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-2">
                            {channels.map(ch => (
                                <div key={ch.id} className="rounded-xl border border-border bg-card overflow-hidden">
                                    {editingChannelId === ch.id ? (
                                        <div className="p-3 space-y-2 bg-muted/30">
                                            <div className="grid grid-cols-2 gap-2">
                                                <input className="rounded-lg bg-background px-3 py-1.5 text-sm border border-border outline-none focus:ring-1 focus:ring-primary" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre" />
                                                <input className="rounded-lg bg-background px-3 py-1.5 text-sm border border-border outline-none focus:ring-1 focus:ring-primary" value={editForm.icon} onChange={e => setEditForm(f => ({ ...f, icon: e.target.value }))} placeholder="Emoji" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <select className="rounded-lg bg-background px-3 py-1.5 text-sm border border-border outline-none focus:ring-1 focus:ring-primary" value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}>
                                                    <option value="CHAT">💬 Chat</option>
                                                    <option value="FEED">📰 Feed</option>
                                                </select>
                                                <input type="number" className="rounded-lg bg-background px-3 py-1.5 text-sm border border-border outline-none focus:ring-1 focus:ring-primary" value={editForm.order} onChange={e => setEditForm(f => ({ ...f, order: Number(e.target.value) }))} placeholder="Orden" />
                                            </div>
                                            <input className="w-full rounded-lg bg-background px-3 py-1.5 text-sm border border-border outline-none focus:ring-1 focus:ring-primary" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción" />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingChannelId(null)} className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
                                                <button onClick={() => saveEditChannel(ch.id)} className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">Guardar cambios</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 px-3 py-2.5">
                                            <span className="text-xl w-8 text-center shrink-0">{ch.icon || '#'}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">{ch.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    #{ch.slug} · {ch.type === 'CHAT' ? '💬 Chat' : '📰 Feed'} · orden {ch.order}
                                                </p>
                                                {ch.description && <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">{ch.description}</p>}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button onClick={() => startEditChannel(ch)} className="rounded-lg p-1.5 hover:bg-muted transition-colors" title="Editar">
                                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                                </button>
                                                <button onClick={() => deleteChannel(ch.id)} className="rounded-lg p-1.5 hover:bg-destructive/10 transition-colors" title="Eliminar">
                                                    <Trash2 className="h-3.5 w-3.5 text-destructive/60" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {channels.length === 0 && (
                                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground/50">
                                    <Hash className="h-8 w-8" />
                                    <p className="text-sm">No hay canales. Usá "Inicializar canales" en Resumen.</p>
                                    <button onClick={() => setAdminTab('overview')} className="text-xs text-primary">Ir a Resumen →</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── POSTS ─── */}
                {adminTab === 'posts' && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <select
                                className="rounded-lg bg-muted px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                                value={postsChannelFilter}
                                onChange={e => setPostsChannelFilter(e.target.value)}
                            >
                                <option value="all">Todos los canales</option>
                                {channels.filter(c => c.type === 'FEED').map(ch => (
                                    <option key={ch.id} value={ch.id}>{ch.icon} {ch.name}</option>
                                ))}
                            </select>
                            <span className="text-xs text-muted-foreground">{filteredPosts.length} publicaciones</span>
                            <button onClick={() => { setPostsLoaded(false); setPostsLoading(true); apiFetch('/hub/posts?limit=100').then(r => r.json()).then(d => { setAllPosts(d.posts ?? []); setPostsLoaded(true); }).finally(() => setPostsLoading(false)); }} className="ml-auto rounded-lg p-1.5 hover:bg-muted transition-colors" title="Actualizar">
                                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                        </div>

                        {postsLoading ? (
                            <div className="flex items-center justify-center py-16"><div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground/50">
                                <FileText className="h-8 w-8" />
                                <p className="text-sm">No hay publicaciones en este canal</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredPosts.map(post => (
                                    <div key={post.id} className={`rounded-xl border bg-card p-3 ${post.isPinned ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
                                        <div className="flex items-start gap-2.5">
                                            <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                                                <AvatarImage src={post.author.avatarUrl} />
                                                <AvatarFallback className="text-[10px]">{post.author.username[0]?.toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                                    <span className="text-xs font-semibold">@{post.author.username}</span>
                                                    {post.channel && (
                                                        <span className="text-[10px] rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
                                                            {post.channel.icon} {post.channel.name}
                                                        </span>
                                                    )}
                                                    {post.isPinned && (
                                                        <span className="text-[10px] text-primary flex items-center gap-0.5 font-medium">
                                                            <Pin className="h-2.5 w-2.5" /> Fijado
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground/50 ml-auto">{fmtDate(post.createdAt)}</span>
                                                </div>
                                                {post.title && <p className="text-sm font-semibold mb-0.5">{post.title}</p>}
                                                <p className="text-xs text-foreground/70 line-clamp-3 leading-relaxed">{post.content}</p>
                                                <div className="flex items-center gap-1 mt-2">
                                                    <span className="text-[10px] text-muted-foreground mr-auto">
                                                        {post._count?.comments ?? 0} comentarios
                                                    </span>
                                                    <button
                                                        onClick={() => pinPost(post.id, !post.isPinned)}
                                                        className={`flex items-center gap-1 text-[11px] rounded-lg px-2 py-1 transition-colors ${post.isPinned ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted'}`}
                                                    >
                                                        <Pin className="h-3 w-3" /> {post.isPinned ? 'Desfijar' : 'Fijar'}
                                                    </button>
                                                    <button
                                                        onClick={() => deletePost(post.id)}
                                                        className="flex items-center gap-1 text-[11px] text-destructive/70 hover:text-destructive rounded-lg px-2 py-1 hover:bg-destructive/10 transition-colors"
                                                    >
                                                        <Trash2 className="h-3 w-3" /> Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── MEMBERS ─── */}
                {adminTab === 'members' && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                <input
                                    className="w-full rounded-xl bg-muted pl-8 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                                    placeholder="Buscar por usuario..."
                                    value={memberSearch}
                                    onChange={e => setMemberSearch(e.target.value)}
                                />
                            </div>
                            <button onClick={() => { setMembersLoaded(false); setMembersLoading(true); apiFetch('/hub/admin/members').then(r => r.json()).then(d => { setMembers(Array.isArray(d) ? d : []); setMembersLoaded(true); }).finally(() => setMembersLoading(false)); }} className="rounded-lg p-2 hover:bg-muted transition-colors" title="Actualizar">
                                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                        </div>

                        {membersLoading ? (
                            <div className="flex items-center justify-center py-16"><div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
                        ) : (
                            <>
                                <p className="text-xs text-muted-foreground">{filteredMembers.length} de {members.length} miembros</p>
                                <div className="space-y-1.5">
                                    {filteredMembers.map(m => (
                                        <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
                                            <Avatar className="h-9 w-9 shrink-0">
                                                <AvatarImage src={m.avatarUrl} />
                                                <AvatarFallback className="text-xs">{m.username[0]?.toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-medium">@{m.username}</span>
                                                    {isAdmin(m.role) && <AuthorBadge role={m.role} />}
                                                </div>
                                                <p className="text-[11px] text-muted-foreground">Se unió {fmtDate(m.createdAt)}</p>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                                <span className="flex items-center gap-0.5" title="Mensajes">
                                                    <MessageSquare className="h-3 w-3" />{m._count.hubMessages}
                                                </span>
                                                <span className="flex items-center gap-0.5" title="Posts">
                                                    <FileText className="h-3 w-3" />{m._count.hubPosts}
                                                </span>
                                                <span className="flex items-center gap-0.5" title="Comentarios">
                                                    <MessageSquare className="h-3 w-3 opacity-60" />{m._count.hubComments}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredMembers.length === 0 && (
                                        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground/50">
                                            <Users className="h-8 w-8" />
                                            <p className="text-sm">{memberSearch ? 'Sin resultados' : 'No hay miembros registrados'}</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

// ─── Channel Sidebar ──────────────────────────────────────────────────────────

type ActiveView =
    | { type: 'channel'; channel: HubChannel }
    | { type: 'feed' }
    | { type: 'events' }
    | { type: 'library' }
    | { type: 'admin' };

function ChannelSidebar({
    channels, activeView, onSelect, isAdminUser, onMobileSelect,
}: {
    channels: HubChannel[]; activeView: ActiveView;
    onSelect: (view: ActiveView) => void;
    isAdminUser: boolean; onMobileSelect?: () => void;
}) {
    const isActive = (view: ActiveView) => {
        if (view.type !== activeView.type) return false;
        if (view.type === 'channel' && activeView.type === 'channel') return view.channel.id === activeView.channel.id;
        return true;
    };

    const btn = (view: ActiveView, icon: React.ReactNode, label: string) => (
        <button
            key={view.type === 'channel' ? (view as { type: 'channel'; channel: HubChannel }).channel.id : view.type}
            onClick={() => { onSelect(view); onMobileSelect?.(); }}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${isActive(view)
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
        >
            {icon}
            <span className="truncate">{label}</span>
        </button>
    );

    return (
        <div className="flex h-full flex-col overflow-y-auto py-3 px-2">
            <div className="px-2 mb-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <img src="/logo.png" alt="Finix" className="h-5 w-5 object-contain" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">Comunidad de Finix</p>
                        <p className="text-[10px] text-muted-foreground/60">Red social</p>
                    </div>
                </div>
            </div>

            <div className="mb-1">
                {btn({ type: 'feed' }, <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />, 'Feed general')}
            </div>

            {channels.length > 0 && (
                <div className="mb-1">
                    <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Canales</p>
                    {channels.map(ch => btn(
                        { type: 'channel', channel: ch },
                        <span className="text-sm shrink-0 w-4 text-center">{ch.icon || <Hash className="h-3.5 w-3.5" />}</span>,
                        ch.name,
                    ))}
                </div>
            )}

            <div className="mb-1">
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Explorar</p>
                {btn({ type: 'library' }, <BookOpen className="h-3.5 w-3.5 shrink-0" />, 'Biblioteca')}
                {btn({ type: 'events' }, <Calendar className="h-3.5 w-3.5 shrink-0" />, 'Eventos')}
            </div>

            {isAdminUser && (
                <div className="mt-auto pt-3 border-t border-border">
                    {btn({ type: 'admin' }, <Shield className="h-3.5 w-3.5 shrink-0" />, 'Panel Admin')}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Comunidad() {
    const { user } = useAuthStore();
    const userRole = (user as any)?.role as string | undefined;
    const userId = (user as any)?.id as string | undefined;
    const isAdminUser = isAdmin(userRole);

    const [channels, setChannels] = useState<HubChannel[]>([]);
    const [loadingChannels, setLoadingChannels] = useState(true);
    const [activeView, setActiveView] = useState<ActiveView>({ type: 'feed' });
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const loadChannels = useCallback(async () => {
        try {
            const res = await apiFetch('/hub/channels');
            if (res.ok) setChannels(await res.json());
        } finally { setLoadingChannels(false); }
    }, []);

    useEffect(() => { loadChannels(); }, [loadChannels]);

    const viewTitle = () => {
        if (activeView.type === 'channel') return `${activeView.channel.icon ?? '#'} ${activeView.channel.name}`;
        if (activeView.type === 'feed') return 'Feed general';
        if (activeView.type === 'events') return 'Eventos';
        if (activeView.type === 'library') return 'Biblioteca';
        if (activeView.type === 'admin') return 'Panel de administración';
        return 'Comunidad';
    };

    const viewDescription = () => {
        if (activeView.type === 'channel') return activeView.channel.description;
        if (activeView.type === 'feed') return 'Todas las publicaciones del hub';
        if (activeView.type === 'events') return 'Próximos eventos de la comunidad';
        if (activeView.type === 'library') return 'Videos, podcasts, PDFs y más recursos educativos';
        return undefined;
    };

    return (
        <div className="flex h-[calc(100vh)] overflow-hidden">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-border bg-background/60 backdrop-blur-sm">
                <ChannelSidebar
                    channels={channels} activeView={activeView}
                    onSelect={setActiveView} isAdminUser={isAdminUser}
                />
            </aside>

            {/* Mobile sidebar overlay */}
            <AnimatePresence>
                {mobileSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                            onClick={() => setMobileSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -224 }} animate={{ x: 0 }} exit={{ x: -224 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed left-0 top-0 z-50 h-full w-56 border-r border-border bg-background shadow-2xl lg:hidden"
                        >
                            <ChannelSidebar
                                channels={channels} activeView={activeView}
                                onSelect={setActiveView} isAdminUser={isAdminUser}
                                onMobileSelect={() => setMobileSidebarOpen(false)}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <div className="flex shrink-0 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3">
                    <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted transition-colors lg:hidden"
                    >
                        <Hash className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-bold leading-none">{viewTitle()}</h1>
                        {viewDescription() && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{viewDescription()}</p>
                        )}
                    </div>
                    {activeView.type === 'channel' && activeView.channel.type === 'CHAT' && (
                        <span className="text-xs text-muted-foreground/60 flex items-center gap-1 shrink-0">
                            <MessageSquare className="h-3 w-3" /> Chat
                        </span>
                    )}
                    {activeView.type === 'library' && (
                        <span className="text-xs text-muted-foreground/60 flex items-center gap-1 shrink-0">
                            <BookOpen className="h-3 w-3" /> Biblioteca
                        </span>
                    )}
                </div>

                {/* View content */}
                {loadingChannels ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                ) : (
                    <>
                        {activeView.type === 'feed' && (
                            <FeedView channel={null} currentUserId={userId} currentUserRole={userRole} />
                        )}
                        {activeView.type === 'channel' && activeView.channel.type === 'CHAT' && (
                            <ChatView channel={activeView.channel} currentUserId={userId} currentUserRole={userRole} />
                        )}
                        {activeView.type === 'channel' && activeView.channel.type === 'FEED' && (
                            <FeedView channel={activeView.channel} currentUserId={userId} currentUserRole={userRole} />
                        )}
                        {activeView.type === 'library' && (
                            <LibraryView currentUserRole={userRole} />
                        )}
                        {activeView.type === 'events' && (
                            <EventsView currentUserRole={userRole} />
                        )}
                        {activeView.type === 'admin' && isAdminUser && (
                            <AdminPanelView channels={channels} onRefreshChannels={loadChannels} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
