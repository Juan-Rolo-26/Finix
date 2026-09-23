import { useEffect, useRef, useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { Post } from '@/pages/Explore';
import {
    Heart,
    MessageCircle,
    Repeat2,
    Bookmark,
    Share2,
    MoreHorizontal,
    Flag,
    Trash2,
    Edit3,
    TrendingUp,
    BarChart2,
    Film,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Volume2,
    VolumeX,
    BadgeCheck,
    ExternalLink,
    Lightbulb,
    BookOpen,
    Newspaper,
    MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import CommentsPanel from './CommentsPanel';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import ReportModal from '@/components/ReportModal';
import DeletePostModal from '@/components/DeletePostModal';
import TradingViewWidget from '@/components/TradingViewWidget';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

const TYPE_BADGE: Record<string, { label: string; icon: any; color: string; borderColor: string }> = {
    analysis: { label: 'Análisis', icon: TrendingUp, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', borderColor: 'border-emerald-500/50' },
    opinion: { label: 'Opinión', icon: Lightbulb, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', borderColor: 'border-blue-500/50' },
    education: { label: 'Educación', icon: BookOpen, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', borderColor: 'border-purple-500/50' },
    news: { label: 'Noticia', icon: Newspaper, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', borderColor: 'border-orange-500/50' },
    question: { label: 'Pregunta', icon: MessageSquare, color: 'text-rose-400 bg-rose-400/10 border-rose-400/20', borderColor: 'border-rose-500/50' },
    chart: { label: 'TradingView', icon: BarChart2, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', borderColor: 'border-blue-500/50' },
    reel: { label: 'Edición', icon: Film, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', borderColor: 'border-purple-500/50' },
    image: { label: 'Imagen', icon: ImageIcon, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', borderColor: 'border-emerald-500/50' },
};

const RISK_COLOR: Record<string, string> = {
    low: 'text-emerald-400 bg-emerald-400/10',
    medium: 'text-yellow-400 bg-yellow-400/10',
    high: 'text-red-400 bg-red-400/10',
};

function getTradingViewUrl(content: string) {
    const match = content.match(/https?:\/\/(?:www\.)?tradingview\.com\/[^\s)]+/i);
    return match ? match[0] : '';
}

// ─── Media Carousel ───────────────────────────────────────────────────────────

function MediaCarousel({ media }: { media: Post['media'] }) {
    const [idx, setIdx] = useState(0);
    const [playing, setPlaying] = useState(true);
    const [muted, setMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    if (!media || media.length === 0) return null;

    const current = media[idx];
    const isVideo = current.mediaType === 'video';

    const prev = () => setIdx((i) => Math.max(0, i - 1));
    const next = () => setIdx((i) => Math.min(media.length - 1, i + 1));

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (playing) { videoRef.current.pause(); setPlaying(false); }
        else { videoRef.current.play(); setPlaying(true); }
    };

    return (
        <div className="relative rounded-xl overflow-hidden bg-black/20 group">
            {isVideo ? (
                <div className="relative">
                    <video
                        ref={videoRef}
                        src={resolveMediaUrl(current.url)}
                        className="w-full max-h-[360px] object-contain"
                        autoPlay
                        loop
                        muted={muted}
                        playsInline
                    />
                    {/* Video controls */}
                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={togglePlay}
                            className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"
                        >
                            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setMuted(!muted)}
                            className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"
                        >
                            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            ) : (
                <img
                    src={resolveMediaUrl(current.url)}
                    alt="Post media"
                    className="w-full max-h-[460px] object-contain"
                    loading="lazy"
                />
            )}

            {/* Carousel nav */}
            {media.length > 1 && (
                <>
                    {idx > 0 && (
                        <button
                            onClick={prev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    {idx < media.length - 1 && (
                        <button
                            onClick={next}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {media.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setIdx(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/50'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

interface PostCardProps {
    post: Post;
    currentUserId?: string;
    onUpdated: (post: Post) => void;
    onDeleted: (postId: string) => void;
}

const PostCard = function PostCard({ post, currentUserId, onUpdated, onDeleted }: PostCardProps) {
    const navigate = useNavigate();
    const [liked, setLiked] = useState(post.likedByMe);
    const [likesCount, setLikesCount] = useState(post.likesCount);
    const [reposted, setReposted] = useState(post.repostedByMe);
    const [repostsCount, setRepostsCount] = useState(post.repostsCount);
    const [saved, setSaved] = useState(post.savedByMe);
    const [showComments, setShowComments] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showRepostModal, setShowRepostModal] = useState(false);
    const [repostComment, setRepostComment] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [commentsCount, setCommentsCount] = useState(post.commentsCount);
    const [showLiveChart, setShowLiveChart] = useState(true);

    const isOwner = currentUserId === post.author.id;
    const canEdit = isOwner && !post.contentEditedAt &&
        (Date.now() - new Date(post.createdAt).getTime() < 15 * 60 * 1000);

    const typeBadge = TYPE_BADGE[post.type];
    const tradingViewUrl = getTradingViewUrl(post.content || '');
    const quotedMediaUrl = post.quotedPost?.media?.[0]?.url || post.quotedPost?.mediaUrl;

    useEffect(() => {
        setLiked(post.likedByMe);
        setLikesCount(post.likesCount);
        setReposted(post.repostedByMe);
        setRepostsCount(post.repostsCount);
        setSaved(post.savedByMe);
        setCommentsCount(post.commentsCount);
        setEditContent(post.content);
    }, [
        post.id,
        post.likedByMe,
        post.likesCount,
        post.repostedByMe,
        post.repostsCount,
        post.savedByMe,
        post.commentsCount,
        post.content,
    ]);

    // ── Actions ──────────────────────────────────────────────────────────────

    const handleLike = async () => {
        const prev = liked;
        setLiked(!liked);
        setLikesCount((c) => c + (liked ? -1 : 1));
        try {
            await apiFetch(`/posts/${post.id}/like`, { method: 'POST' });
        } catch {
            setLiked(prev);
            setLikesCount((c) => c + (liked ? 1 : -1));
        }
    };

    const handleSave = async () => {
        const prev = saved;
        const nextSaved = !saved;
        setSaved(nextSaved);
        try {
            await apiFetch(`/posts/${post.id}/save`, { method: 'POST' });
            onUpdated({ ...post, savedByMe: nextSaved });
        } catch {
            setSaved(prev);
        }
    };

    const handleRepost = async () => {
        try {
            const res = await apiFetch(`/posts/${post.id}/repost`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: repostComment || undefined }),
            });
            const data = await res.json();
            setReposted(data.reposted);
            setRepostsCount((c) => c + (data.reposted ? 1 : -1));
            setShowRepostModal(false);
            setRepostComment('');
        } catch { }
    };

    const confirmDelete = async () => {
        if (!isOwner) return;
        setIsDeleting(true);
        try {
            const res = await apiFetch(`/posts/${post.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            onDeleted(post.id);
        } catch { } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setShowMenu(false);
        }
    };

    const handleDeleteClick = () => {
        setShowMenu(false);
        setShowDeleteModal(true);
    };

    const handleSaveEdit = async () => {
        setIsSavingEdit(true);
        try {
            const res = await apiFetch(`/posts/${post.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editContent }),
            });
            if (res.ok) {
                const updated = await res.json();
                onUpdated({ ...post, ...updated });
                setIsEditing(false);
            }
        } catch { }
        setIsSavingEdit(false);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <motion.article
            layout
            className={`rounded-[18px] border ${typeBadge?.borderColor || 'border-border/50'} bg-card/60 backdrop-blur-sm hover:border-border/80 transition-colors`}
        >
            {/* Header */}
            <div className="flex items-start justify-between p-4 pb-3">
                <Link to={`/profile/${post.author?.username || ''}`} className="flex items-center gap-3 group">
                    {post.author?.avatarUrl ? (
                        <img
                            src={resolveMediaUrl(post.author.avatarUrl)}
                            alt={post.author.username || 'Avatar'}
                            className="w-10 h-10 rounded-full object-cover border-2 border-border/50 group-hover:border-primary/50 transition-colors"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-black font-bold text-sm shrink-0">
                            {(post.author?.username?.[0] || 'U').toUpperCase()}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                                {post.author?.username || 'Usuario'}
                            </span>
                            {post.author?.isVerified && (
                                <BadgeCheck className="w-4 h-4 text-primary" />
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{timeAgo(post.createdAt)}</span>
                            {post.contentEditedAt && <span>· editado</span>}
                            {typeBadge && (
                                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${typeBadge.color}`}>
                                    <typeBadge.icon className="w-2.5 h-2.5" />
                                    {typeBadge.label}
                                </span>
                            )}
                        </div>
                    </div>
                </Link>

                {/* Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                className="absolute right-0 top-9 z-50 min-w-[160px] rounded-xl border border-border/50 bg-card shadow-xl overflow-hidden"
                                onMouseLeave={() => setShowMenu(false)}
                            >
                                {canEdit && (
                                    <button
                                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-secondary/50 transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" /> Editar
                                    </button>
                                )}
                                {isOwner && (
                                    <button
                                        onClick={handleDeleteClick}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-red-500/10"
                                        style={{ color: 'hsl(0 68% 55%)' }}
                                    >
                                        <Trash2 className="w-4 h-4" /> Eliminar
                                    </button>
                                )}
                                {!isOwner && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowReportModal(true); setShowMenu(false); }}
                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-orange-400 hover:bg-orange-400/10 transition-colors"
                                    >
                                        <Flag className="w-4 h-4" /> Reportar
                                    </button>
                                )}
                                <button
                                    onClick={() => { handleShare(); setShowMenu(false); }}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-secondary/50 transition-colors"
                                >
                                    <Share2 className="w-4 h-4" /> Copiar enlace
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Chart metadata */}
            {post.type === 'chart' && post.assetSymbol && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-blue-400/10 border border-blue-400/20 text-blue-400">
                        <TrendingUp className="w-3 h-3" />
                        ${post.assetSymbol}
                    </span>
                    {post.analysisType && (
                        <span className="text-xs px-2 py-1 rounded-lg bg-secondary/50 border border-border/50 text-muted-foreground capitalize">
                            {post.analysisType === 'technical' ? 'Análisis Técnico' : 'Análisis Fundamental'}
                        </span>
                    )}
                    {post.riskLevel && (
                        <span className={`text-xs px-2 py-1 rounded-lg capitalize ${RISK_COLOR[post.riskLevel] || ''}`}>
                            Riesgo {post.riskLevel === 'low' ? 'Bajo' : post.riskLevel === 'medium' ? 'Medio' : 'Alto'}
                        </span>
                    )}
                </div>
            )}

            {/* Tickers */}
            {post.tickers && (
                <div className="px-4 pb-2 flex flex-wrap gap-1">
                    {(Array.isArray(post.tickers) ? post.tickers : post.tickers.split(',')).filter(Boolean).map((t: string) => (
                        <span key={t} className="text-xs text-primary font-medium">#{t.trim()}</span>
                    ))}
                </div>
            )}

            {/* Content */}
            <div className="px-4 pb-3">
                {isEditing ? (
                    <div className="space-y-2">
                        <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="bg-secondary/30 resize-none"
                            rows={4}
                            maxLength={2000}
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button size="sm" onClick={handleSaveEdit} disabled={isSavingEdit}>
                                {isSavingEdit ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
                )}
            </div>

            {/* Auto TradingView Chart if ticker is mentioned and no media provided (for text posts only) */}
            {post.type !== 'chart' && !post.media?.length && !post.mediaUrl && !tradingViewUrl && post.tickers && String(post.tickers).trim() && (
                <div className="px-4 pb-3">
                    <div className="rounded-xl overflow-hidden border border-border/50 h-[380px] sm:h-[450px] w-full bg-card/20">
                        <TradingViewWidget
                            symbol={(Array.isArray(post.tickers) ? post.tickers[0] : String(post.tickers).split(',')[0]).trim().replace('$', '')}
                            height={450}
                        />
                    </div>
                </div>
            )}

            {post.quotedPost && (
                <div className="px-4 pb-3">
                    <button
                        type="button"
                        onClick={() => navigate(`/posts/${post.quotedPost!.id}`)}
                        className="w-full text-left rounded-xl border border-border/50 bg-background/30 p-4 hover:bg-muted/10 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            {post.quotedPost.author?.avatarUrl ? (
                                <img
                                    src={resolveMediaUrl(post.quotedPost.author.avatarUrl)}
                                    alt={post.quotedPost.author.username || 'Usuario'}
                                    className="w-5 h-5 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">
                                    {(post.quotedPost.author?.username?.[0] || 'U').toUpperCase()}
                                </div>
                            )}
                            <span className="font-bold text-sm">{post.quotedPost.author?.username || 'Usuario'}</span>
                            <span className="text-xs text-muted-foreground">{timeAgo(post.quotedPost.createdAt)}</span>
                        </div>
                        <p className="text-sm line-clamp-3 mb-2">{post.quotedPost.content}</p>
                        {quotedMediaUrl && (
                            <img
                                src={resolveMediaUrl(quotedMediaUrl)}
                                alt="Vista previa del post citado"
                                className="w-full h-32 object-cover rounded-lg"
                                loading="lazy"
                            />
                        )}
                    </button>
                </div>
            )}

            {/* TradingView link */}
            {tradingViewUrl && (
                <div className="px-4 pb-3">
                    {tradingViewUrl.includes('/x/') ? (
                        <div className="relative rounded-xl overflow-hidden border border-border/50 bg-black/20 group">
                            <img src={tradingViewUrl} alt="TradingView Chart" className="w-full h-auto object-contain max-h-[460px]" loading="lazy" />
                            <a href={tradingViewUrl} target="_blank" rel="noreferrer" className="absolute bottom-3 right-3 flex flex-row items-center gap-2 p-2 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-xl">
                                <span className="text-xs font-semibold">TradingView</span>
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    ) : (
                        <a
                            href={tradingViewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-400/10 px-3 py-2 text-sm text-blue-300 hover:bg-blue-400/20 transition-colors"
                        >
                            <BarChart2 className="w-4 h-4" />
                            Ver gráfico en TradingView
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    )}
                </div>
            )}

            {/* Media & Chart Projection */}
            {(() => {
                const regularMedia = (post.media || []).filter((m: any) => !m.url?.startsWith('tvchart:'));
                const chartSymbol = post.assetSymbol || (post.tickers ? String(post.tickers).split(',')[0].trim().replace('$', '') : 'AAPL');
                const hasCapturedMedia = regularMedia.length > 0;

                if (post.type === 'chart') {
                    return (
                        <div className="px-4 pb-3 space-y-2.5">
                            {hasCapturedMedia && (
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                                        {showLiveChart ? 'Gráfico interactivo en vivo' : 'Análisis y trazado original'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setShowLiveChart(!showLiveChart)}
                                        className="text-xs font-bold px-2.5 py-1 rounded-lg border border-border/60 bg-secondary/40 hover:bg-secondary text-foreground transition-all flex items-center gap-1.5 shadow-xs"
                                    >
                                        <BarChart2 className="w-3.5 h-3.5 text-primary" />
                                        {showLiveChart ? 'Ver captura con dibujos' : 'Ver en vivo'}
                                    </button>
                                </div>
                            )}

                            {hasCapturedMedia && !showLiveChart ? (
                                <MediaCarousel media={regularMedia} />
                            ) : (
                                <div className="h-[420px] sm:h-[490px] min-h-[420px] w-full shrink-0 rounded-2xl overflow-hidden shadow-xs border border-border/40">
                                    <TradingViewWidget symbol={chartSymbol} height={490} />
                                </div>
                            )}
                        </div>
                    );
                }

                return (
                    <>
                        {/* Media Regular (Imágenes / Vídeos para posts no-chart) */}
                        {regularMedia.length > 0 && (
                            <div className="px-4 pb-3">
                                <MediaCarousel media={regularMedia} />
                            </div>
                        )}

                        {/* Legacy single media */}
                        {!post.media?.length && post.mediaUrl && (
                            <div className="px-4 pb-3">
                                <img
                                    src={resolveMediaUrl(post.mediaUrl)}
                                    alt="Post"
                                    className="w-full rounded-xl max-h-[460px] object-contain"
                                    loading="lazy"
                                    onError={(e) => {
                                        (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </>
                );
            })()}

            {/* Action bar */}
            <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-1">
                    {/* Like */}
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-secondary/50 ${liked ? 'text-red-400' : 'text-muted-foreground'}`}
                    >
                        <Heart className={`w-4 h-4 ${liked ? 'fill-red-400' : ''}`} />
                        <span className="text-xs font-medium">{likesCount > 0 ? likesCount : ''}</span>
                    </button>

                    {/* Comment */}
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-secondary/50 ${showComments ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">{commentsCount > 0 ? commentsCount : ''}</span>
                    </button>

                    {/* Repost */}
                    <button
                        onClick={() => setShowRepostModal(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-secondary/50 ${reposted ? 'text-emerald-400' : 'text-muted-foreground'}`}
                    >
                        <Repeat2 className="w-4 h-4" />
                        <span className="text-xs font-medium">{repostsCount > 0 ? repostsCount : ''}</span>
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    {/* Share */}
                    <button
                        onClick={handleShare}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                        title="Copiar enlace"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>

                    {/* Save */}
                    <button
                        onClick={handleSave}
                        className={`p-2 rounded-lg transition-all hover:bg-secondary/50 ${saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title={saved ? 'Quitar de guardados' : 'Guardar'}
                    >
                        <Bookmark className={`w-4 h-4 ${saved ? 'fill-primary' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Comments panel */}
            <AnimatePresence>
                {showComments && (
                    <CommentsPanel
                        postId={post.id}
                        currentUserId={currentUserId}
                        onCountChange={(n: number) => setCommentsCount(n)}
                    />
                )}
            </AnimatePresence>

            {/* Repost modal */}
            <AnimatePresence>
                {showRepostModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setShowRepostModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-3xl p-6 w-full max-w-md space-y-5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <Repeat2 className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight text-foreground">
                                        {reposted ? 'Quitar repost' : 'Repostear'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {reposted ? 'Esto eliminará el repost de tu feed.' : 'Compartí esta publicación con tus seguidores.'}
                                    </p>
                                </div>
                            </div>
                            
                            {!reposted && (
                                <div className="space-y-2">
                                    <Textarea
                                        placeholder="Añadí un comentario (opcional)..."
                                        value={repostComment}
                                        onChange={(e) => setRepostComment(e.target.value)}
                                        className="bg-secondary/30 resize-none text-sm border-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 min-h-[100px] rounded-xl p-4"
                                        rows={3}
                                        maxLength={500}
                                    />
                                </div>
                            )}
                            
                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={() => setShowRepostModal(false)} className="flex-1 rounded-xl h-11 border-border/50">
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleRepost}
                                    className={`flex-1 rounded-xl h-11 font-bold shadow-glow ${reposted ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-gradient-to-r from-primary to-emerald-400 text-black'}`}
                                >
                                    {reposted ? 'Quitar' : 'Repostear'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Report modal */}
            <AnimatePresence>
                {showReportModal && (
                    <ReportModal
                        isOpen={showReportModal}
                        onClose={() => setShowReportModal(false)}
                        targetType="POST"
                        targetId={post.id}
                        targetPreview={post.content}
                    />
                )}
            </AnimatePresence>

            <DeletePostModal 
                isOpen={showDeleteModal} 
                onClose={() => setShowDeleteModal(false)} 
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
            />
        </motion.article>
    );
}

export default memo(PostCard, (prev, next) => prev.post.id === next.post.id && prev.post.likedByMe === next.post.likedByMe && prev.post.likesCount === next.post.likesCount && prev.post.repostedByMe === next.post.repostedByMe && prev.post.repostsCount === next.post.repostsCount && prev.post.savedByMe === next.post.savedByMe && prev.post.commentsCount === next.post.commentsCount && prev.post.content === next.post.content);
