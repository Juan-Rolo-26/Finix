import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Users, Crown, Lock, BadgeCheck, MessageCircle,
    Heart, Bookmark, Plus, Loader2, AlertCircle,
    FileText, Settings, MoreHorizontal, Calendar,
    Trash2, Globe, Check, X, TrendingUp,
    BookOpen, Play, ExternalLink, Image as ImageIcon,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { useAuthStore } from '@/stores/authStore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Community {
    id: string; name: string; description: string; category: string;
    imageUrl?: string; bannerUrl?: string; privacyType: string; rules?: string;
    creator: { id: string; username: string; avatarUrl?: string; isVerified: boolean; bio?: string; title?: string };
    plans: CommunityPlan[];
    _count: { members: number; posts: number; resources: number; events?: number };
    isMember: boolean; tierLevel: number; membership?: any; createdAt: string;
}

interface CommunityPlan {
    id: string; name: string; price: number; interval: string;
    features: string | string[]; tierLevel: number;
}

interface Post {
    id: string; content: string | null; isLocked: boolean; requiredTierLevel?: number;
    type: string; createdAt: string; targetVisibility: string;
    author: { id: string; username: string; avatarUrl?: string; isVerified: boolean };
    _count: { likes: number; comments: number };
    media?: any[];
}

interface CommunityEvent {
    id: string; title: string; description?: string; eventDate: string;
    requiredTierLevel: number; link?: string;
}

interface CommunityResource {
    id: string; title: string; description?: string; resourceUrl: string;
    isPublic: boolean; requiredTierLevel: number;
    author?: { id: string; username: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseFeatures(features: string | string[]): string[] {
    if (Array.isArray(features)) return features;
    try { return JSON.parse(features); } catch { return []; }
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso: string) {
    return new Date(iso).toLocaleString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const TABS = [
    { key: 'feed', label: 'Inicio', icon: TrendingUp },
    { key: 'exclusivo', label: 'Exclusivo', icon: Crown },
    { key: 'recursos', label: 'Recursos', icon: BookOpen },
    { key: 'eventos', label: 'Eventos', icon: Calendar },
    { key: 'miembros', label: 'Miembros', icon: Users },
    { key: 'sobre', label: 'Sobre', icon: Globe },
];

// ─── Locked Content Card ──────────────────────────────────────────────────────

function LockedCard({ post, plans, onSubscribe }: {
    post: Post; plans: CommunityPlan[]; onSubscribe: () => void;
}) {
    const plan = plans.find(p => p.tierLevel === post.requiredTierLevel) || plans.find(p => p.tierLevel > 0);
    return (
        <div className="relative rounded-2xl overflow-hidden"
            style={{ border: '1px solid hsl(var(--border))' }}>
            {/* Blurred content placeholder */}
            <div className="px-4 py-3 blur-sm select-none pointer-events-none opacity-40">
                <div className="h-3 w-3/4 rounded mb-2" style={{ background: 'hsl(var(--muted))' }} />
                <div className="h-3 w-full rounded mb-2" style={{ background: 'hsl(var(--muted))' }} />
                <div className="h-3 w-2/3 rounded" style={{ background: 'hsl(var(--muted))' }} />
            </div>
            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
                style={{ background: 'hsl(var(--card) / 0.85)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: 'hsl(var(--primary)/0.1)' }}>
                    <Lock className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <div className="text-center">
                    <p className="font-bold text-sm">Contenido exclusivo</p>
                    {plan && (
                        <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Plan {plan.name} — ${Number(plan.price).toFixed(2)}/{plan.interval === 'monthly' ? 'mes' : 'año'}
                        </p>
                    )}
                </div>
                <button
                    onClick={onSubscribe}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                    <Crown className="w-3.5 h-3.5" /> Desbloquear
                </button>
            </div>
        </div>
    );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, community, onDelete }: {
    post: Post; community: Community; onDelete: (id: string) => void;
}) {
    const { user } = useAuthStore();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post._count.likes);
    const [showMenu, setShowMenu] = useState(false);

    const canDelete = user?.id === post.author.id || user?.id === community.creator.id;

    const handleLike = async () => {
        setLiked(l => !l);
        setLikeCount(c => liked ? c - 1 : c + 1);
        try {
            await apiFetch(`/posts/${post.id}/like`, { method: 'POST' });
        } catch { setLiked(l => !l); setLikeCount(c => liked ? c + 1 : c - 1); }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 space-y-3"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        >
            {/* Author */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={post.author.avatarUrl} />
                        <AvatarFallback className="text-[11px]">{post.author.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-1">
                            <span className="font-semibold text-[13px]">@{post.author.username}</span>
                            {post.author.isVerified && (
                                <BadgeCheck className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                            )}
                        </div>
                        <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {fmtDate(post.createdAt)}
                            {post.targetVisibility !== 'PUBLIC' && (
                                <span className="ml-1.5 inline-flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" />
                                    {post.targetVisibility === 'PREMIUM_TIER' ? 'Premium' : 'Miembros'}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                {canDelete && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(v => !v)}
                            className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                            <MoreHorizontal className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                        </button>
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-8 z-10 rounded-xl shadow-xl overflow-hidden w-36"
                                    style={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}>
                                    <button
                                        onClick={() => { onDelete(post.id); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-medium hover:bg-destructive/10 transition-colors text-destructive">
                                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Content & Media */}
            {post.content && (
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
            )}
            {post.media && post.media.length > 0 && (
                <div className="pt-2">
                    {post.media.map((m: any, i: number) => {
                        const isVideo = m.mediaType?.startsWith('video') || m.url.match(/\.(mp4|webm|mov)$/i);
                        return isVideo ? (
                            <video key={i} src={resolveMediaUrl(m.url)} controls className="w-full h-auto max-h-[500px] object-contain rounded-xl border border-border/20 bg-black/5" />
                        ) : (
                            <img key={i} src={resolveMediaUrl(m.url)} alt="" className="w-full h-auto max-h-[500px] object-contain rounded-xl border border-border/20" />
                        );
                    })}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-1">
                <button
                    onClick={handleLike}
                    className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
                    style={{ color: liked ? 'hsl(0 68% 55%)' : 'hsl(var(--muted-foreground))' }}>
                    <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                    {likeCount > 0 && likeCount}
                </button>
                <button className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
                    style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <MessageCircle className="w-4 h-4" />
                    {post._count.comments > 0 && post._count.comments}
                </button>
                <button className="flex items-center gap-1.5 text-[12px] font-medium transition-colors ml-auto"
                    style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <Bookmark className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

// ─── Create Post ─────────────────────────────────────────────────────────────

function CreatePost({ communityId, plans, onCreated }: {
    communityId: string; plans: CommunityPlan[];
    onCreated: (post: Post) => void;
}) {
    const { user } = useAuthStore();
    const [content, setContent] = useState('');
    const [visibility, setVisibility] = useState('PUBLIC');
    const [tierLevel, setTierLevel] = useState(0);
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImage(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setImage(null);
        setPreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!content.trim() && !image) return;
        setLoading(true);
        try {
            let mediaUrls: any[] = [];
            if (image) {
                const formData = new FormData();
                formData.append('files', image);
                const up = await apiFetch('/posts/upload-media', { method: 'POST', headers: {}, body: formData });
                if (!up.ok) throw new Error('Upload failed');
                mediaUrls = await up.json();
            }

            const res = await apiFetch(`/communities/${communityId}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    targetVisibility: visibility,
                    requiredTierLevel: tierLevel,
                    mediaUrls: mediaUrls.length ? mediaUrls : undefined
                }),
            });
            if (res.ok) {
                const post = await res.json();
                onCreated(post);
                setContent('');
                handleRemoveImage();
            }
        } finally { setLoading(false); }
    };

    return (
        <div className="rounded-2xl p-4 space-y-3"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="text-[11px]">{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <textarea
                    className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
                    placeholder="¿Qué querés compartir con la comunidad?"
                    rows={3}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                />
            </div>

            <AnimatePresence>
                {preview && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-2">
                        <div className="relative inline-block">
                            {image?.type.startsWith('video/') ? (
                                <video src={preview} controls className="h-32 rounded-xl object-contain border border-border/30 bg-black/5" />
                            ) : (
                                <img src={preview} alt="Preview" className="h-32 rounded-xl object-cover border border-border/30" />
                            )}
                            <button onClick={handleRemoveImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-white">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center gap-2 pt-1">
                <input type="file" ref={fileRef} className="hidden" accept="image/*,video/*" onChange={handleImageSelect} />
                <button title="Adjuntar multimedia" onClick={() => fileRef.current?.click()} className="p-1.5 rounded-lg hover:bg-muted transition-colors mr-1">
                    <ImageIcon className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                </button>
                {/* Visibility selector */}
                <select
                    className="rounded-lg px-2 py-1.5 text-[11px] font-semibold outline-none"
                    style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
                    value={visibility}
                    onChange={e => setVisibility(e.target.value)}>
                    <option value="PUBLIC">🌎 Público</option>
                    <option value="MEMBERS">👥 Miembros</option>
                    {plans.filter(p => Number(p.price) > 0).map(p => (
                        <option key={p.id} value="PREMIUM_TIER">🔒 {p.name}</option>
                    ))}
                </select>
                {visibility === 'PREMIUM_TIER' && plans.filter(p => p.tierLevel > 0).length > 0 && (
                    <select
                        className="rounded-lg px-2 py-1.5 text-[11px] font-semibold outline-none"
                        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
                        value={tierLevel}
                        onChange={e => setTierLevel(Number(e.target.value))}>
                        {plans.filter(p => p.tierLevel > 0).map(p => (
                            <option key={p.id} value={p.tierLevel}>{p.name}</option>
                        ))}
                    </select>
                )}
                <button
                    disabled={(!content.trim() && !image) || loading}
                    onClick={handleSubmit}
                    className="ml-auto flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-[12px] font-semibold transition-all disabled:opacity-40"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Publicar
                </button>
            </div>
        </div>
    );
}

// ─── Subscribe Modal ──────────────────────────────────────────────────────────

function SubscribeModal({ community, onClose, onJoined }: {
    community: Community; onClose: () => void; onJoined: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [activePlanId, setActivePlanId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const freePlan = community.plans.find(p => Number(p.price) === 0);
    const paidPlans = community.plans.filter(p => Number(p.price) > 0);

    const handleJoinFree = async () => {
        setLoading(true); setError('');
        try {
            const res = await apiFetch(`/communities/${community.id}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: freePlan?.id }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.message || 'Error al unirse');
            }
            onJoined();
        } catch (e: any) {
            setError(e.message);
        } finally { setLoading(false); }
    };

    const handleJoinPaid = async (planId: string) => {
        setLoading(true); setError(''); setActivePlanId(planId);
        try {
            const res = await apiFetch(`/stripe/communities/${community.id}/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Error al procesar el pago');
            }
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No se pudo generar la sesión de pago');
            }
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
            setActivePlanId(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
            style={{ background: 'hsl(0 0% 0% / 0.7)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                onClick={e => e.stopPropagation()}>

                {/* Handle (mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-8 h-1 rounded-full" style={{ background: 'hsl(var(--border))' }} />
                </div>

                <div className="px-6 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base">Unirte a {community.name}</h3>
                        <button onClick={onClose} className="rounded-xl p-1.5 hover:bg-muted transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
                    {/* Free plan */}
                    {freePlan && (
                        <div className="rounded-xl p-4 space-y-3"
                            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm">{freePlan.name}</p>
                                    <p className="text-xl font-black mt-0.5" style={{ color: 'hsl(145 65% 36%)' }}>Gratis</p>
                                </div>
                            </div>
                            <ul className="space-y-1.5">
                                {parseFeatures(freePlan.features).map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-[12px]">
                                        <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(145 65% 36%)' }} />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                disabled={loading}
                                onClick={handleJoinFree}
                                className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all"
                                style={{ background: 'hsl(145 65% 36%)', color: '#fff' }}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Unirse gratis'}
                            </button>
                        </div>
                    )}

                    {/* Paid plans */}
                    {paidPlans.map(plan => (
                        <div key={plan.id} className="rounded-xl p-4 space-y-3"
                            style={{
                                background: 'hsl(var(--primary)/0.06)',
                                border: '1px solid hsl(var(--primary)/0.25)',
                            }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <Crown className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                                        <p className="font-bold text-sm">{plan.name}</p>
                                    </div>
                                    <p className="text-lg font-black mt-0.5" style={{ color: 'hsl(var(--primary))' }}>
                                        ${Number(plan.price).toFixed(2)}
                                        <span className="text-[11px] font-normal ml-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                            /{plan.interval === 'monthly' ? 'mes' : 'año'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <ul className="space-y-1.5">
                                {parseFeatures(plan.features).map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-[12px]">
                                        <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                disabled={loading}
                                className="w-full flex items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition-all relative"
                                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', opacity: loading ? 0.7 : 1 }}
                                onClick={() => handleJoinPaid(plan.id)}>
                                {loading && activePlanId === plan.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin absolute" />
                                ) : (
                                    `Suscribirme — $${Number(plan.price).toFixed(2)}/${plan.interval === 'monthly' ? 'mes' : 'año'}`
                                )}
                            </button>
                        </div>
                    ))}

                    {error && (
                        <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                            style={{ background: 'hsl(0 60% 50% / 0.08)', color: 'hsl(0 68% 55%)' }}>
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CommunityDetail({ community: initialCommunity, onBack, onRefresh }: {
    community: Community;
    onBack: () => void;
    onRefresh: (c: Community) => void;
}) {
    const { user } = useAuthStore();
    const [community, setCommunity] = useState(initialCommunity);
    const [activeTab, setActiveTab] = useState('feed');
    const [showSubscribe, setShowSubscribe] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [events, setEvents] = useState<CommunityEvent[]>([]);
    const [resources, setResources] = useState<CommunityResource[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [tabLoaded, setTabLoaded] = useState<Record<string, boolean>>({});

    const isOwner = user?.id === community.creator.id;
    const isMember = community.isMember;

    const loadPosts = useCallback(async (tab = 'all', cursor?: string) => {
        setPostsLoading(true);
        try {
            const params = new URLSearchParams({ tab, limit: '20' });
            if (cursor) params.set('cursor', cursor);
            const res = await apiFetch(`/communities/${community.id}/posts?${params}`);
            if (res.ok) {
                const data = await res.json();
                if (cursor) setPosts(prev => [...prev, ...(data.posts || [])]);
                else setPosts(data.posts || []);
                setHasMore(data.hasMore || false);
            }
        } finally { setPostsLoading(false); }
    }, [community.id]);

    const loadTab = useCallback(async (tab: string) => {
        if (tabLoaded[tab]) return;
        try {
            if (tab === 'eventos') {
                const res = await apiFetch(`/communities/${community.id}/events`);
                if (res.ok) setEvents(await res.json());
            } else if (tab === 'recursos') {
                const res = await apiFetch(`/communities/${community.id}/resources`);
                if (res.ok) setResources(await res.json());
            } else if (tab === 'miembros') {
                const res = await apiFetch(`/communities/${community.id}/members?limit=30`);
                if (res.ok) setMembers(await res.json());
            }
            setTabLoaded(prev => ({ ...prev, [tab]: true }));
        } catch { }
    }, [community.id, tabLoaded]);

    useEffect(() => {
        loadPosts(activeTab === 'exclusivo' ? 'exclusive' : 'all');
        if (!['feed', 'exclusivo'].includes(activeTab)) loadTab(activeTab);
    }, [activeTab]);

    const handleJoined = async () => {
        setShowSubscribe(false);
        const res = await apiFetch(`/communities/${community.id}`);
        if (res.ok) {
            const updated = await res.json();
            setCommunity(updated);
            onRefresh(updated);
            loadPosts();
        }
    };

    const handleLeave = async () => {
        if (!confirm('¿Abandonar esta comunidad?')) return;
        await apiFetch(`/communities/${community.id}/leave`, { method: 'DELETE' });
        const res = await apiFetch(`/communities/${community.id}`);
        if (res.ok) {
            const updated = await res.json();
            setCommunity(updated);
            onRefresh(updated);
        }
    };

    const handleDeletePost = async (postId: string) => {
        await apiFetch(`/communities/${community.id}/posts/${postId}`, { method: 'DELETE' });
        setPosts(prev => prev.filter(p => p.id !== postId));
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* ── Banner + Header ── */}
            <div className="flex-shrink-0 relative">
                {/* Banner */}
                <div className="h-32 sm:h-44 relative overflow-hidden"
                    style={{ background: 'hsl(var(--muted))' }}>
                    {community.bannerUrl ? (
                        <img src={resolveMediaUrl(community.bannerUrl)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full"
                            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.2) 0%, hsl(var(--primary)/0.05) 100%)' }} />
                    )}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, hsl(var(--background)/0.8))' }} />
                    {/* Back button */}
                    <button
                        onClick={onBack}
                        className="absolute top-3 left-3 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium"
                        style={{ background: 'hsl(0 0% 0% / 0.5)', color: '#fff', backdropFilter: 'blur(8px)' }}>
                        <ArrowLeft className="w-4 h-4" /> Comunidades
                    </button>
                </div>

                {/* Community info */}
                <div className="px-4 sm:px-6 -mt-10 relative">
                    <div className="flex items-end justify-between gap-3">
                        {/* Avatar */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-3 shadow-lg flex-shrink-0"
                            style={{ borderColor: 'hsl(var(--background))', border: '3px solid hsl(var(--background))', background: 'hsl(var(--muted))' }}>
                            {community.imageUrl ? (
                                <img src={resolveMediaUrl(community.imageUrl)} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-black"
                                    style={{ background: 'hsl(var(--primary)/0.12)', color: 'hsl(var(--primary))' }}>
                                    {community.name[0]}
                                </div>
                            )}
                        </div>
                        {/* CTA */}
                        <div className="flex items-center gap-2 pb-1">
                            {isOwner ? (
                                <button className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold"
                                    style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                                    <Settings className="w-3.5 h-3.5" /> Gestionar
                                </button>
                            ) : isMember ? (
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full"
                                        style={{ background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))' }}>
                                        <Check className="w-3 h-3" /> Miembro
                                    </span>
                                    <button onClick={handleLeave}
                                        className="text-[11px] font-medium px-2.5 py-1.5 rounded-full"
                                        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                                        Salir
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowSubscribe(true)}
                                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold"
                                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                                    <Plus className="w-4 h-4" />
                                    Unirse
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-2">
                        <h1 className="font-black text-lg leading-tight">{community.name}</h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Avatar className="h-4 w-4">
                                <AvatarImage src={community.creator.avatarUrl} />
                                <AvatarFallback className="text-[8px]">{community.creator.username[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                por @{community.creator.username}
                            </span>
                            {community.creator.isVerified && (
                                <BadgeCheck className="w-3 h-3" style={{ color: 'hsl(var(--primary))' }} />
                            )}
                        </div>
                        <p className="text-[12px] mt-2 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {community.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-[11px] font-semibold">
                                <span className="text-foreground">{community._count.members.toLocaleString()}</span>
                                <span className="ml-1" style={{ color: 'hsl(var(--muted-foreground))' }}>miembros</span>
                            </span>
                            <span className="text-[11px] font-semibold">
                                <span className="text-foreground">{community._count.posts}</span>
                                <span className="ml-1" style={{ color: 'hsl(var(--muted-foreground))' }}>posts</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-0 overflow-x-auto scrollbar-hide px-4 sm:px-6 mt-4"
                    style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className="flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold whitespace-nowrap relative shrink-0 transition-colors"
                                style={{ color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                                <Icon className="w-3.5 h-3.5" /> {tab.label}
                                {active && (
                                    <motion.div
                                        layoutId="community-tab-indicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                                        style={{ background: 'hsl(var(--primary))' }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Tab Content ── */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="max-w-2xl mx-auto space-y-4"
                    >
                        {/* Feed & Exclusivo */}
                        {(activeTab === 'feed' || activeTab === 'exclusivo') && (
                            <>
                                {isMember && (
                                    <CreatePost
                                        communityId={community.id}
                                        plans={community.plans}
                                        onCreated={post => setPosts(prev => [post as any, ...prev])}
                                    />
                                )}
                                {!isMember && activeTab === 'exclusivo' && (
                                    <div className="flex flex-col items-center py-12 gap-3"
                                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <Lock className="w-10 h-10 opacity-30" />
                                        <p className="font-semibold text-sm">Contenido exclusivo</p>
                                        <p className="text-xs text-center max-w-xs">
                                            Unite a la comunidad para acceder a publicaciones exclusivas.
                                        </p>
                                        <button onClick={() => setShowSubscribe(true)}
                                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold mt-1"
                                            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                                            <Crown className="w-4 h-4" /> Unirme
                                        </button>
                                    </div>
                                )}
                                {postsLoading && posts.length === 0 ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
                                    </div>
                                ) : posts.length === 0 && !postsLoading ? (
                                    <div className="flex flex-col items-center py-12 gap-3"
                                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <MessageCircle className="w-10 h-10 opacity-30" />
                                        <p className="font-semibold text-sm">Sin publicaciones aún</p>
                                    </div>
                                ) : (
                                    posts.map(post => post.isLocked ? (
                                        <LockedCard
                                            key={post.id} post={post} plans={community.plans}
                                            onSubscribe={() => setShowSubscribe(true)}
                                        />
                                    ) : (
                                        <PostCard
                                            key={post.id} post={post} community={community}
                                            onDelete={handleDeletePost}
                                        />
                                    ))
                                )}
                                {hasMore && (
                                    <button
                                        onClick={() => loadPosts(activeTab === 'exclusivo' ? 'exclusive' : 'all', posts[posts.length - 1]?.createdAt)}
                                        className="w-full py-3 text-sm font-medium rounded-xl"
                                        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                                        Cargar más
                                    </button>
                                )}
                            </>
                        )}

                        {/* Recursos */}
                        {activeTab === 'recursos' && (
                            <div className="space-y-3">
                                {resources.length === 0 ? (
                                    <div className="flex flex-col items-center py-12 gap-3"
                                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <BookOpen className="w-10 h-10 opacity-30" />
                                        <p className="font-semibold text-sm">Sin recursos aún</p>
                                    </div>
                                ) : resources.map(r => (
                                    <div key={r.id} className="flex items-center gap-3 rounded-xl p-3"
                                        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'hsl(var(--primary)/0.1)' }}>
                                            <FileText className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{r.title}</p>
                                            {r.description && (
                                                <p className="text-[11px] truncate"
                                                    style={{ color: 'hsl(var(--muted-foreground))' }}>{r.description}</p>
                                            )}
                                        </div>
                                        {!r.isPublic && r.requiredTierLevel > 0 && !isMember ? (
                                            <Lock className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                        ) : (
                                            <a href={r.resourceUrl} target="_blank" rel="noopener noreferrer"
                                                className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                                                <ExternalLink className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Eventos */}
                        {activeTab === 'eventos' && (
                            <div className="space-y-3">
                                {events.length === 0 ? (
                                    <div className="flex flex-col items-center py-12 gap-3"
                                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <Calendar className="w-10 h-10 opacity-30" />
                                        <p className="font-semibold text-sm">Sin eventos próximos</p>
                                    </div>
                                ) : events.map(ev => (
                                    <div key={ev.id} className="rounded-xl p-4 space-y-2"
                                        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-bold text-sm">{ev.title}</p>
                                                <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--primary))' }}>
                                                    {fmtDateTime(ev.eventDate)}
                                                </p>
                                            </div>
                                            {ev.requiredTierLevel > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                                    style={{ background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))' }}>
                                                    <Crown className="w-2.5 h-2.5" /> Premium
                                                </span>
                                            )}
                                        </div>
                                        {ev.description && (
                                            <p className="text-[12px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                {ev.description}
                                            </p>
                                        )}
                                        {ev.link && (
                                            <a href={ev.link} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
                                                style={{ color: 'hsl(var(--primary))' }}>
                                                <Play className="w-3.5 h-3.5" /> Participar
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Miembros */}
                        {activeTab === 'miembros' && (
                            <div className="space-y-2">
                                {members.length === 0 ? (
                                    <div className="flex flex-col items-center py-12 gap-3"
                                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <Users className="w-10 h-10 opacity-30" />
                                        <p className="font-semibold text-sm">Sin miembros aún</p>
                                    </div>
                                ) : members.map((m: any) => (
                                    <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarImage src={m.user?.avatarUrl} />
                                            <AvatarFallback className="text-[11px]">{m.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <span className="font-semibold text-[13px]">@{m.user?.username}</span>
                                                {m.user?.isVerified && (
                                                    <BadgeCheck className="w-3 h-3" style={{ color: 'hsl(var(--primary))' }} />
                                                )}
                                            </div>
                                            {m.user?.title && (
                                                <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                    {m.user.title}
                                                </p>
                                            )}
                                        </div>
                                        {m.plan && Number(m.plan.price) > 0 && (
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                                style={{ background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))' }}>
                                                {m.plan.name}
                                            </span>
                                        )}
                                        {m.role === 'OWNER' && (
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                                style={{ background: 'hsl(45 95% 55% / 0.15)', color: 'hsl(45 95% 45%)' }}>
                                                <Crown className="w-2.5 h-2.5 inline mr-0.5" /> Creador
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sobre */}
                        {activeTab === 'sobre' && (
                            <div className="space-y-4">
                                {/* Creator card */}
                                <div className="rounded-2xl p-4 space-y-3"
                                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                                    <p className="text-[11px] font-bold uppercase tracking-widest"
                                        style={{ color: 'hsl(var(--muted-foreground))' }}>Creador</p>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={community.creator.avatarUrl} />
                                            <AvatarFallback>{community.creator.username[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold text-sm">@{community.creator.username}</span>
                                                {community.creator.isVerified && (
                                                    <BadgeCheck className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                                                )}
                                            </div>
                                            {community.creator.title && (
                                                <p className="text-[12px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                    {community.creator.title}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {community.creator.bio && (
                                        <p className="text-[12px] leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                            {community.creator.bio}
                                        </p>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Miembros', value: community._count.members.toLocaleString() },
                                        { label: 'Posts', value: community._count.posts.toLocaleString() },
                                        { label: 'Recursos', value: community._count.resources.toLocaleString() },
                                    ].map(s => (
                                        <div key={s.label} className="flex flex-col items-center py-3 rounded-xl"
                                            style={{ background: 'hsl(var(--muted))' }}>
                                            <p className="font-black text-lg">{s.value}</p>
                                            <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Plans */}
                                {community.plans.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold uppercase tracking-widest"
                                            style={{ color: 'hsl(var(--muted-foreground))' }}>Planes</p>
                                        {community.plans.map(plan => (
                                            <div key={plan.id} className="rounded-xl p-3 flex items-center justify-between"
                                                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                                                <div>
                                                    <p className="font-semibold text-sm">{plan.name}</p>
                                                    <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                        {parseFeatures(plan.features).slice(0, 2).join(' · ')}
                                                    </p>
                                                </div>
                                                <span className="font-black text-sm" style={{ color: Number(plan.price) === 0 ? 'hsl(145 65% 36%)' : 'hsl(var(--primary))' }}>
                                                    {Number(plan.price) === 0 ? 'Gratis' : `$${Number(plan.price).toFixed(2)}/mes`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Rules */}
                                {community.rules && (
                                    <div className="rounded-xl p-4 space-y-2"
                                        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                                        <p className="text-[11px] font-bold uppercase tracking-widest"
                                            style={{ color: 'hsl(var(--muted-foreground))' }}>Reglas</p>
                                        <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{community.rules}</p>
                                    </div>
                                )}

                                {/* Disclaimer */}
                                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                                    style={{ background: 'hsl(45 95% 55% / 0.06)', border: '1px solid hsl(45 95% 55% / 0.2)' }}>
                                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(45 95% 50%)' }} />
                                    <p className="text-[11px] leading-relaxed" style={{ color: 'hsl(45 85% 45%)' }}>
                                        Todo el contenido es <strong>educativo e informativo</strong>. Nada constituye
                                        asesoramiento financiero ni garantía de rentabilidad.
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── Subscribe Modal ── */}
            <AnimatePresence>
                {showSubscribe && (
                    <SubscribeModal
                        community={community}
                        onClose={() => setShowSubscribe(false)}
                        onJoined={handleJoined}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
