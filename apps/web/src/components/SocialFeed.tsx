import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import {
    Heart,
    MessageSquare,
    Repeat2,
    Share2,
    MoreHorizontal,
    ExternalLink,
    Flag,
    Trash2,
} from 'lucide-react';
import CreatePostWidget from './CreatePostWidget';
import TradingViewWidget from './TradingViewWidget';
import CommentsPanel from './posts/CommentsPanel';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author: {
        id: string;
        username: string;
        avatarUrl?: string;
    };
}

interface Post {
    id: string;
    content: string;
    createdAt: string;
    tickers?: string;
    mediaUrl?: string;
    likes: unknown[];
    comments: Comment[];
    author: {
        id: string;
        username: string;
        role: string;
        isInfluencer: boolean;
        avatarUrl?: string;
    };
    media?: { url: string; mediaType: string }[];
    parent?: Post;
    quotedPost?: Post;
    replies?: Post[];
    likedByMe?: boolean;
    repostedByMe?: boolean;
    likesCount?: number;
    commentsCount?: number;
    repostsCount?: number;
    _count?: {
        likes: number;
        comments: number;
        reposts: number;
        quotes: number;
        replies: number;
    };
}

interface SocialFeedProps {
    initialPosts: Post[];
    onPostCreated: (post: Post) => void;
}

const getFileUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    // If base ends with /api, remove it. If it doesn't, assume it's root + /api or just root.
    // Actually, usually VITE_API_URL includes /api. 
    // But serving static files is usually at root.
    const cleanBase = base.replace(/\/api\/?$/, '');
    return `${cleanBase}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function SocialFeed({ initialPosts, onPostCreated }: SocialFeedProps) {
    const [posts, setPosts] = useState<Post[]>(initialPosts);

    // Sync state when props change
    const [prevInitialPosts, setPrevInitialPosts] = useState(initialPosts);
    if (initialPosts !== prevInitialPosts) {
        setPrevInitialPosts(initialPosts);
        setPosts(initialPosts);
    }

    const handlePostCreated = (post: Post) => {
        setPosts([post, ...posts]);
        onPostCreated(post);
    };

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            {/* Create Post Widget */}
            <CreatePostWidget onPostCreated={handlePostCreated} />

            {/* Feed Stream */}
            <div className="space-y-3">
                {posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50 gap-3">
                        <MessageSquare className="w-10 h-10 opacity-40" />
                        <p className="text-sm font-medium">No hay publicaciones aún. ¡Sé el primero!</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <FeedItem key={post.id} post={post} />
                    ))
                )}
            </div>
        </div>
    );
}

function FeedItem({ post }: { post: Post }) {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [likes, setLikes] = useState(post.likesCount ?? post.likes?.length ?? 0);
    const [isLiked, setIsLiked] = useState(Boolean(post.likedByMe));
    const [isReposting, setIsReposting] = useState(false);
    const [isReposted, setIsReposted] = useState(Boolean(post.repostedByMe));
    const [repostsCount, setRepostsCount] = useState(
        post.repostsCount ?? post._count?.reposts ?? post._count?.quotes ?? 0,
    );
    const [showQuoteBox, setShowQuoteBox] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentsCount, setCommentsCount] = useState(
        post.commentsCount ?? post.comments?.length ?? post.replies?.length ?? 0,
    );
    const [showMenu, setShowMenu] = useState(false);
    const [isRemoved, setIsRemoved] = useState(false);

    const isOwner = user?.id === post.author.id;

    if (isRemoved) {
        return null;
    }

    const handleLike = async () => {
        const prevLikes = likes;
        const prevIsLiked = isLiked;

        setIsLiked(!isLiked);
        setLikes(prevIsLiked ? prevLikes - 1 : prevLikes + 1);

        try {
            const res = await apiFetch(`/posts/${post.id}/like`, { method: 'POST' });
            if (!res.ok) throw new Error();
        } catch {
            setIsLiked(prevIsLiked);
            setLikes(prevLikes);
        }
    };

    const handleRepost = async () => {
        setIsReposting(true);
        try {
            const res = await apiFetch(`/posts/${post.id}/repost`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                if (typeof data?.reposted === 'boolean') {
                    setIsReposted(data.reposted);
                    setRepostsCount((prev) => Math.max(prev + (data.reposted ? 1 : -1), 0));
                }
            }
        } catch (e) {
            console.error("error reposting", e);
        } finally {
            setIsReposting(false);
            setShowQuoteBox(false);
        }
    };

    const getPrimaryMedia = (postObject: Post) => {
        if (postObject.media && postObject.media.length > 0) {
            return postObject.media[0].url;
        }
        if (postObject.mediaUrl) return postObject.mediaUrl;
        return null;
    };

    const mediaUrl = getPrimaryMedia(post);
    const hasTickers = post.tickers && post.tickers.length > 0;
    const primaryTicker = hasTickers
        ? post.tickers?.split(',')[0].replace('$', '')
        : null;

    // Detect chart symbol for TradingView
    const tvSymbol = primaryTicker === 'BTC' ? 'BITSTAMP:BTCUSD'
        : primaryTicker === 'ETH' ? 'BITSTAMP:ETHUSD'
            : primaryTicker ? `NASDAQ:${primaryTicker}` : null;

    const handleDelete = async () => {
        if (!isOwner) return;
        if (!window.confirm('¿Eliminar esta publicación?')) return;
        try {
            const res = await apiFetch(`/posts/${post.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            setIsRemoved(true);
        } catch {
            // noop
        } finally {
            setShowMenu(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
        } catch {
            // noop
        } finally {
            setShowMenu(false);
        }
    };

    return (
        <article
            className="group rounded-[20px] border border-border/50 bg-card/60 hover:bg-card/80 hover:border-border/80 transition-all duration-200 overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-400"
            style={{ boxShadow: '0 1px 4px hsl(220 42% 3% / 0.05)' }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px hsl(220 42% 3% / 0.09)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px hsl(220 42% 3% / 0.05)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
        >
            <div className="p-5 pb-0">
                {/* ── Author Header ── */}
                <div className="flex items-center justify-between mb-4">
                    <Link to={`/profile/${post.author.username}`} className="flex items-center gap-3 group/author">
                        <Avatar className="w-9 h-9 ring-1 ring-border/50 ring-offset-1 ring-offset-card">
                            <AvatarImage src={post.author.avatarUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-primary font-bold text-[13px]">
                                {post.author.username[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h4 className="text-[14px] font-semibold text-foreground leading-tight group-hover/author:text-primary transition-colors">
                                    {post.author.username}
                                </h4>
                                {post.author.isInfluencer && (
                                    <span className="px-1.5 py-px rounded-md bg-amber-500/15 text-amber-500 text-[9px] font-bold uppercase tracking-wider border border-amber-500/20">
                                        PRO
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}
                            </p>
                        </div>
                    </Link>

                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/50 hover:text-foreground hover:bg-secondary/80 rounded-xl"
                            onClick={() => setShowMenu((prev) => !prev)}
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        {showMenu && (
                            <div
                                className="absolute right-0 top-10 z-20 min-w-[172px] rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/10 overflow-hidden backdrop-blur-sm"
                                onMouseLeave={() => setShowMenu(false)}
                            >
                                <button
                                    onClick={() => { navigate(`/profile/${post.author.username}`); setShowMenu(false); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] font-medium hover:bg-secondary/60 transition-colors text-foreground/80 hover:text-foreground"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Ver perfil
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] font-medium hover:bg-secondary/60 transition-colors text-foreground/80 hover:text-foreground"
                                >
                                    <Share2 className="w-3.5 h-3.5" />
                                    Copiar enlace
                                </button>
                                {isOwner ? (
                                    <button
                                        onClick={handleDelete}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-500/8 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Eliminar
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowMenu(false)}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                                    >
                                        <Flag className="w-3.5 h-3.5" />
                                        Cerrar
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="space-y-4">
                    <p className="text-[14.5px] leading-[1.65] text-foreground/90 whitespace-pre-wrap">
                        {post.content}
                    </p>

                    {mediaUrl && (
                        <div className="rounded-2xl overflow-hidden border border-border/30">
                            <img
                                src={getFileUrl(mediaUrl)}
                                alt="Post attachment"
                                className="w-full h-auto max-h-[480px] object-cover"
                            />
                        </div>
                    )}

                    {!mediaUrl && tvSymbol && (
                        <div className="h-[340px] w-full bg-background rounded-2xl border border-border/30 overflow-hidden">
                            <TradingViewWidget symbol={tvSymbol} autosize={true} />
                        </div>
                    )}

                    {post.quotedPost && (
                        <button
                            type="button"
                            onClick={() => navigate(`/posts/${post.quotedPost!.id}`)}
                            className="w-full text-left rounded-2xl border border-border/50 bg-background/40 hover:bg-background/60 hover:border-border/80 p-4 transition-all group/quote"
                        >
                            <div className="flex items-center gap-2 mb-2.5">
                                <Avatar className="w-5 h-5">
                                    <AvatarImage src={post.quotedPost.author.avatarUrl} />
                                    <AvatarFallback className="bg-secondary text-[9px]">{post.quotedPost.author.username[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-[12px] font-semibold group-hover/quote:text-primary transition-colors">{post.quotedPost.author.username}</span>
                                <span className="text-[10px] text-muted-foreground/60">
                                    {formatDistanceToNow(new Date(post.quotedPost.createdAt), { locale: es })}
                                </span>
                            </div>
                            <p className="text-[13px] leading-relaxed text-foreground/80 line-clamp-3">{post.quotedPost.content}</p>
                            {getPrimaryMedia(post.quotedPost) && (
                                <img src={getFileUrl(getPrimaryMedia(post.quotedPost) as string)} className="w-full h-28 object-cover rounded-xl mt-2.5" alt="Quote media" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Actions Bar ── */}
            <div className="px-3 py-1 mt-3 flex items-center gap-1 border-t border-border/20">
                <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1.5 h-9 px-3 rounded-xl text-[13px] font-medium transition-all ${isLiked
                        ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-500/8'
                        : 'text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/8'
                        }`}
                    onClick={handleLike}
                >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likes > 0 ? likes : ''}</span>
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-9 px-3 rounded-xl text-[13px] font-medium text-muted-foreground/60 hover:text-sky-400 hover:bg-sky-500/8 transition-all"
                    onClick={() => setShowComments(!showComments)}
                >
                    <MessageSquare className="w-4 h-4" />
                    <span>{commentsCount > 0 ? commentsCount : ''}</span>
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1.5 h-9 px-3 rounded-xl text-[13px] font-medium transition-all ${isReposted
                        ? 'text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/8'
                        : 'text-muted-foreground/60 hover:text-emerald-400 hover:bg-emerald-500/8'
                        }`}
                    onClick={() => setShowQuoteBox(!showQuoteBox)}
                    disabled={isReposting}
                >
                    <Repeat2 className="w-4 h-4" />
                    {repostsCount > 0 ? <span>{repostsCount}</span> : null}
                </Button>
            </div>

            {/* Quote Box */}
            {showQuoteBox && (
                <div className="px-4 pb-4 border-t border-border/20 pt-3 space-y-3 bg-muted/20">
                    <Button
                        variant="default"
                        size="sm"
                        className="w-full gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                        onClick={handleRepost}
                        disabled={isReposting}
                    >
                        <Repeat2 className="w-4 h-4" />
                        {isReposted ? 'Quitar repost' : 'Repost simple'}
                    </Button>
                    <div className="divider-label text-[9px]">O citar publicación</div>
                    <CreatePostWidget
                        isReply={true}
                        quotedPostId={post.id}
                        placeholder="Añade un comentario a este repost..."
                        onPostCreated={() => setShowQuoteBox(false)}
                    />
                </div>
            )}

            {/* Comments */}
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
