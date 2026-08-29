import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import {
    Heart, MessageSquare, Repeat2, Share2,
    MoreHorizontal, ExternalLink, Flag, Trash2,
    Bookmark, BadgeCheck, MessageCircle,
} from 'lucide-react';
import CreatePostWidget from './CreatePostWidget';
import TradingViewWidget from './TradingViewWidget';
import CommentsPanel from './posts/CommentsPanel';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Types ─────────────────────────────────────────────────────── */
interface Comment {
    id: string; content: string; createdAt: string;
    author: { id: string; username: string; avatarUrl?: string };
}
interface Post {
    id: string; content: string; createdAt: string;
    tickers?: string; mediaUrl?: string;
    postType?: 'analysis' | 'opinion' | 'education' | 'news' | 'question';
    likes: unknown[]; comments: Comment[];
    author: { id: string; username: string; role: string; isInfluencer: boolean; avatarUrl?: string };
    media?: { url: string; mediaType: string }[];
    parent?: Post; quotedPost?: Post; replies?: Post[];
    likedByMe?: boolean; repostedByMe?: boolean; savedByMe?: boolean;
    likesCount?: number; commentsCount?: number; repostsCount?: number;
    _count?: { likes: number; comments: number; reposts: number; quotes: number; replies: number };
}
interface SocialFeedProps { initialPosts: Post[]; onPostCreated: (post: Post) => void; }

/* ── Post type config ───────────────────────────────────────────── */
const POST_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    analysis: { label: 'Análisis', color: 'hsl(142 70% 45%)', bg: 'hsl(142 70% 45% / 0.1)', dot: '#22c55e' },
    opinion: { label: 'Opinión', color: 'hsl(215 90% 60%)', bg: 'hsl(215 90% 60% / 0.1)', dot: '#3b82f6' },
    education: { label: 'Educación', color: 'hsl(280 65% 65%)', bg: 'hsl(280 65% 65% / 0.1)', dot: '#a855f7' },
    news: { label: 'Noticia', color: 'hsl(38 88% 52%)', bg: 'hsl(38 88% 52% / 0.1)', dot: '#f59e0b' },
    question: { label: 'Pregunta', color: 'hsl(350 80% 58%)', bg: 'hsl(350 80% 58% / 0.1)', dot: '#f43f5e' },
};

/* ── Skeleton ───────────────────────────────────────────────────── */
function PostSkeleton() {
    return (
        <div className="rounded-2xl overflow-hidden p-4 space-y-3 animate-pulse"
            style={{ background: 'hsl(var(--card) / 0.5)', border: '1px solid hsl(var(--border) / 0.3)' }}>
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: 'hsl(var(--muted) / 0.6)' }} />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3 rounded-full w-[35%]" style={{ background: 'hsl(var(--muted) / 0.6)' }} />
                    <div className="h-2.5 rounded-full w-[20%]" style={{ background: 'hsl(var(--muted) / 0.4)' }} />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 rounded-full w-full" style={{ background: 'hsl(var(--muted) / 0.5)' }} />
                <div className="h-3 rounded-full w-[85%]" style={{ background: 'hsl(var(--muted) / 0.4)' }} />
                <div className="h-3 rounded-full w-[65%]" style={{ background: 'hsl(var(--muted) / 0.3)' }} />
            </div>
        </div>
    );
}

/* ── Empty state ────────────────────────────────────────────────── */
function EmptyFeed() {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px dashed hsl(var(--primary) / 0.25)' }}>
                    <MessageCircle className="w-7 h-7" style={{ color: 'hsl(var(--primary) / 0.5)' }} />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                    style={{ background: 'hsl(var(--primary))', color: 'white' }}>0</div>
            </div>
            <div className="text-center space-y-1.5 max-w-[240px]">
                <p className="text-[15px] font-semibold">El feed está vacío</p>
                <p className="text-[12.5px] leading-relaxed" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
                    Sé el primero en publicar o seguí a otros traders para ver su actividad
                </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center mt-1">
                {['Explorar traders', 'Tendencias'].map(label => (
                    <span key={label} className="px-3 py-1.5 rounded-full text-[11.5px] font-medium cursor-pointer transition-all hover:opacity-80"
                        style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
                        {label}
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ── Ticker chips ───────────────────────────────────────────────── */
function TickerChips({ tickers }: { tickers?: string }) {
    if (!tickers) return null;
    const list = tickers.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5);
    return (
        <div className="flex flex-wrap gap-1.5 mb-2">
            {list.map(t => (
                <span key={t}
                    className="px-2 py-0.5 rounded-md text-[11px] font-bold num cursor-pointer transition-all hover:opacity-80"
                    style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                    {t.startsWith('$') ? t : `$${t}`}
                </span>
            ))}
        </div>
    );
}

/* ── Content text with $ticker highlights ───────────────────────── */
function PostContent({ text }: { text: string }) {
    const parts = text.split(/(\$[A-Za-z][A-Za-z0-9]{0,9})/g);
    return (
        <p className="text-[13.5px] leading-[1.7] whitespace-pre-wrap" style={{ color: 'hsl(var(--foreground) / 0.88)' }}>
            {parts.map((part, i) =>
                /^\$[A-Za-z]/.test(part)
                    ? <span key={i} className="font-bold num cursor-pointer hover:underline" style={{ color: 'hsl(var(--primary))' }}>{part}</span>
                    : part
            )}
        </p>
    );
}

/* ── Action button ──────────────────────────────────────────────── */
function ActionBtn({
    icon, count, active, activeColor, hoverColor, onClick, label, className = '',
}: {
    icon: React.ReactNode; count?: number; active?: boolean; activeColor?: string; hoverColor?: string;
    onClick?: () => void; label: string; className?: string;
}) {
    return (
        <button
            aria-label={label}
            onClick={onClick}
            className={`group/action flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-150 ${className}`}
            style={{ color: active ? activeColor : 'hsl(var(--muted-foreground) / 0.55)' }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = hoverColor ?? 'hsl(var(--foreground))'; (e.currentTarget as HTMLElement).style.background = 'hsl(var(--secondary) / 0.6)'; }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.55)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
            <span className="transition-transform duration-150 group-hover/action:scale-110">{icon}</span>
            {(count ?? 0) > 0 && <span className="num">{count}</span>}
        </button>
    );
}

/* ── Main Feed ──────────────────────────────────────────────────── */
export default function SocialFeed({ initialPosts, onPostCreated }: SocialFeedProps) {
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [isLoading] = useState(false);
    const [prevInitialPosts, setPrevInitialPosts] = useState(initialPosts);
    if (initialPosts !== prevInitialPosts) { setPrevInitialPosts(initialPosts); setPosts(initialPosts); }

    const handlePostCreated = (post: Post) => { setPosts([post, ...posts]); onPostCreated(post); };

    return (
        <div className="space-y-3">
            <CreatePostWidget onPostCreated={handlePostCreated} />

            <div className="space-y-2.5">
                {isLoading ? (
                    <> <PostSkeleton /> <PostSkeleton /> <PostSkeleton /> </>
                ) : posts.length === 0 ? (
                    <EmptyFeed />
                ) : (
                    <AnimatePresence initial={false}>
                        {posts.map((post, i) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: i < 5 ? i * 0.04 : 0, duration: 0.25 } }}
                                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                            >
                                <FeedItem post={post} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

/* ── FeedItem ─────────────────────────────────────────────────── */
function FeedItem({ post }: { post: Post }) {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [likes, setLikes] = useState(post.likesCount ?? post.likes?.length ?? 0);
    const [isLiked, setIsLiked] = useState(Boolean(post.likedByMe));
    const [isReposting, setIsReposting] = useState(false);
    const [isReposted, setIsReposted] = useState(Boolean(post.repostedByMe));
    const [isSaved, setIsSaved] = useState(Boolean(post.savedByMe));
    const [repostsCount, setRepostsCount] = useState(post.repostsCount ?? post._count?.reposts ?? post._count?.quotes ?? 0);
    const [showQuoteBox, setShowQuoteBox] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentsCount, setCommentsCount] = useState(post.commentsCount ?? post.comments?.length ?? post.replies?.length ?? 0);
    const [showMenu, setShowMenu] = useState(false);
    const [isRemoved, setIsRemoved] = useState(false);
    const [likeAnim, setLikeAnim] = useState(false);

    const isOwner = user?.id === post.author.id;
    if (isRemoved) return null;

    const typeConfig = post.postType ? POST_TYPE_CONFIG[post.postType] : null;

    const handleLike = async () => {
        const prev = { likes, isLiked };
        setIsLiked(!isLiked);
        setLikes(isLiked ? likes - 1 : likes + 1);
        if (!isLiked) { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 600); }
        try {
            const res = await apiFetch(`/posts/${post.id}/like`, { method: 'POST' });
            if (!res.ok) throw new Error();
        } catch { setIsLiked(prev.isLiked); setLikes(prev.likes); }
    };

    const handleRepost = async () => {
        setIsReposting(true);
        try {
            const res = await apiFetch(`/posts/${post.id}/repost`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                if (typeof data?.reposted === 'boolean') {
                    setIsReposted(data.reposted);
                    setRepostsCount(p => Math.max(p + (data.reposted ? 1 : -1), 0));
                }
            }
        } catch { } finally { setIsReposting(false); setShowQuoteBox(false); }
    };

    const handleSave = async () => {
        setIsSaved(v => !v);
        try { await apiFetch(`/posts/${post.id}/save`, { method: 'POST' }); }
        catch { setIsSaved(v => !v); }
    };

    const handleDelete = async () => {
        if (!isOwner || !window.confirm('¿Eliminar esta publicación?')) return;
        try {
            const res = await apiFetch(`/posts/${post.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            setIsRemoved(true);
        } catch { } finally { setShowMenu(false); }
    };

    const handleCopyLink = async () => {
        try { await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`); }
        catch { } finally { setShowMenu(false); }
    };

    const mediaUrl = post.media?.[0]?.url ?? post.mediaUrl ?? null;
    const primaryTicker = post.tickers?.split(',')[0]?.replace('$', '').trim();
    const tvSymbol = !mediaUrl && primaryTicker
        ? primaryTicker === 'BTC' ? 'BITSTAMP:BTCUSD'
            : primaryTicker === 'ETH' ? 'BITSTAMP:ETHUSD'
                : `NASDAQ:${primaryTicker}`
        : null;

    return (
        <article
            className="rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.45)' }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border) / 0.75)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px hsl(var(--foreground) / 0.04)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border) / 0.45)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
            onClick={e => {
                if ((e.target as HTMLElement).closest('button, a, textarea, input')) return;
                navigate(`/posts/${post.id}`);
            }}
        >
            {/* ── Post type accent bar ─── */}
            {typeConfig && (
                <div className="h-[2px] w-full" style={{ background: typeConfig.color }} />
            )}

            <div className="p-4">
                {/* ── Author row ─── */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <Link
                        to={`/profile/${post.author.username}`}
                        className="flex items-center gap-3 group/author min-w-0 flex-1"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <Avatar className="w-9 h-9 ring-2 ring-border/20">
                                <AvatarImage src={resolveMediaUrl(post.author.avatarUrl)} />
                                <AvatarFallback className="text-[12px] font-bold"
                                    style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
                                    {post.author.username[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {post.author.isInfluencer && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                                    style={{ background: 'hsl(38 88% 52%)' }}>
                                    <BadgeCheck className="w-2.5 h-2.5 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Name + meta */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[13.5px] font-semibold leading-tight group-hover/author:text-primary transition-colors">
                                    {post.author.username}
                                </span>
                                {typeConfig && (
                                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider flex-shrink-0"
                                        style={{ background: typeConfig.bg, color: typeConfig.color }}>
                                        {typeConfig.label}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10.5px]" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}
                            </span>
                        </div>
                    </Link>

                    {/* Right icons */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                            onClick={e => { e.stopPropagation(); handleSave(); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-primary/10"
                            style={{ color: isSaved ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.4)' }}
                            title={isSaved ? 'Guardado' : 'Guardar'}
                        >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                        </button>

                        <div className="relative">
                            <button
                                onClick={e => { e.stopPropagation(); setShowMenu(p => !p); }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-secondary/60"
                                style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}
                            >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        transition={{ duration: 0.12 }}
                                        className="absolute right-0 top-9 z-20 min-w-[168px] rounded-2xl overflow-hidden shadow-xl py-1"
                                        style={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border) / 0.5)' }}
                                        onMouseLeave={() => setShowMenu(false)}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {[
                                            { icon: <ExternalLink className="w-3.5 h-3.5" />, label: 'Ver perfil', action: () => { navigate(`/profile/${post.author.username}`); setShowMenu(false); } },
                                            { icon: <Share2 className="w-3.5 h-3.5" />, label: 'Copiar enlace', action: handleCopyLink },
                                        ].map(item => (
                                            <button key={item.label} onClick={item.action}
                                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-secondary/50"
                                                style={{ color: 'hsl(var(--foreground) / 0.8)' }}>
                                                {item.icon}{item.label}
                                            </button>
                                        ))}
                                        {isOwner ? (
                                            <button onClick={handleDelete}
                                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-red-500/10"
                                                style={{ color: 'hsl(0 68% 55%)' }}>
                                                <Trash2 className="w-3.5 h-3.5" />Eliminar
                                            </button>
                                        ) : (
                                            <button onClick={() => setShowMenu(false)}
                                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-secondary/50"
                                                style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                <Flag className="w-3.5 h-3.5" />Reportar
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* ── Content ─── */}
                <div className="space-y-3 mb-3">
                    <TickerChips tickers={post.tickers} />
                    <PostContent text={post.content} />

                    {/* Media */}
                    {mediaUrl && (
                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border) / 0.25)' }}>
                            <img src={resolveMediaUrl(mediaUrl)} alt="Post attachment" className="w-full h-auto max-h-[400px] object-cover" />
                        </div>
                    )}

                    {/* TradingView chart */}
                    {!mediaUrl && tvSymbol && (
                        <div className="h-[280px] w-full rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border) / 0.25)' }}>
                            <TradingViewWidget symbol={tvSymbol} autosize={true} />
                        </div>
                    )}

                    {/* Quoted post */}
                    {post.quotedPost && (
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); navigate(`/posts/${post.quotedPost!.id}`); }}
                            className="w-full text-left rounded-xl p-3.5 transition-all hover:opacity-80"
                            style={{ background: 'hsl(var(--secondary) / 0.4)', border: '1px solid hsl(var(--border) / 0.35)' }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Avatar className="w-4 h-4">
                                    <AvatarImage src={post.quotedPost.author.avatarUrl} />
                                    <AvatarFallback className="text-[8px]">{post.quotedPost.author.username[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-[11.5px] font-semibold">{post.quotedPost.author.username}</span>
                                <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                                    · {formatDistanceToNow(new Date(post.quotedPost.createdAt), { locale: es })}
                                </span>
                            </div>
                            <p className="text-[12.5px] leading-relaxed line-clamp-2" style={{ color: 'hsl(var(--foreground) / 0.75)' }}>
                                {post.quotedPost.content}
                            </p>
                        </button>
                    )}
                </div>

                {/* ── Actions ─── */}
                <div className="flex items-center gap-0.5 pt-2.5 -mx-1.5"
                    style={{ borderTop: '1px solid hsl(var(--border) / 0.25)' }}
                    onClick={e => e.stopPropagation()}>

                    {/* Like with pulse */}
                    <div className="relative">
                        {likeAnim && (
                            <motion.div
                                initial={{ scale: 1, opacity: 0.8 }}
                                animate={{ scale: 2.5, opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0 rounded-full pointer-events-none"
                                style={{ background: 'hsl(0 68% 54% / 0.2)' }}
                            />
                        )}
                        <ActionBtn
                            icon={<Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''} transition-transform ${likeAnim ? 'scale-125' : 'scale-100'}`} />}
                            count={likes}
                            active={isLiked}
                            activeColor="hsl(0 68% 54%)"
                            hoverColor="hsl(0 68% 54%)"
                            onClick={handleLike}
                            label="Like"
                        />
                    </div>

                    <ActionBtn
                        icon={<MessageSquare className="w-3.5 h-3.5" />}
                        count={commentsCount}
                        hoverColor="hsl(var(--primary))"
                        onClick={() => setShowComments(!showComments)}
                        label="Comentarios"
                    />

                    <ActionBtn
                        icon={<Repeat2 className="w-3.5 h-3.5" />}
                        count={repostsCount}
                        active={isReposted}
                        activeColor="hsl(142 70% 45%)"
                        hoverColor="hsl(142 70% 45%)"
                        onClick={() => !isReposting && setShowQuoteBox(!showQuoteBox)}
                        label="Repost"
                    />

                    <div className="flex-1" />

                    <ActionBtn
                        icon={<Share2 className="w-3.5 h-3.5" />}
                        hoverColor="hsl(var(--foreground))"
                        onClick={handleCopyLink}
                        label="Compartir"
                    />
                </div>
            </div>

            {/* ── Quote box ─── */}
            <AnimatePresence>
                {showQuoteBox && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t overflow-hidden"
                        style={{ borderColor: 'hsl(var(--border) / 0.3)', background: 'hsl(var(--secondary) / 0.25)' }}
                    >
                        <div className="p-4 space-y-3">
                            <button
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[12.5px] font-semibold transition-all hover:opacity-80"
                                style={{ background: 'hsl(142 70% 45% / 0.12)', color: 'hsl(142 70% 45%)', border: '1px solid hsl(142 70% 45% / 0.2)' }}
                                onClick={handleRepost}
                                disabled={isReposting}
                            >
                                <Repeat2 className="w-3.5 h-3.5" />
                                {isReposted ? 'Quitar repost' : 'Repost simple'}
                            </button>
                            <div className="flex items-center gap-2 text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground) / 0.45)' }}>
                                <div className="flex-1 h-px" style={{ background: 'hsl(var(--border) / 0.3)' }} />
                                O citar publicación
                                <div className="flex-1 h-px" style={{ background: 'hsl(var(--border) / 0.3)' }} />
                            </div>
                            <CreatePostWidget
                                isReply={true}
                                quotedPostId={post.id}
                                placeholder="Añade tu análisis a este repost..."
                                onPostCreated={() => setShowQuoteBox(false)}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Comments panel ─── */}
            {showComments && (
                <CommentsPanel
                    postId={post.id}
                    currentUserId={user?.id}
                    onCountChange={setCommentsCount}
                />
            )}
        </article>
    );
}
