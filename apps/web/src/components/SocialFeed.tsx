import { useState } from 'react';
import { apiFetch } from '@/lib/api';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Heart,
    MessageSquare,
    Share2,
    MoreHorizontal
} from 'lucide-react';
import CreatePostWidget from './CreatePostWidget';
import TradingViewWidget from './TradingViewWidget';
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
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Create Post Widget */}
            <CreatePostWidget onPostCreated={handlePostCreated} />

            {/* Feed Stream */}
            <div className="space-y-6">
                {posts.length === 0 ? (
                    <div className="text-center py-12 opacity-50">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2" />
                        <p>No hay publicaciones aún. ¡Sé el primero!</p>
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
    const [likes, setLikes] = useState(post.likes?.length || 0);
    const [isLiked, setIsLiked] = useState(false);
    const [isReposting, setIsReposting] = useState(false);
    const [showQuoteBox, setShowQuoteBox] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Post[]>(post.replies || []);

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
                // simple feedback logic: optimistic +1 repost count for now
            }
        } catch (e) {
            console.error("error reposting", e);
        } finally {
            setIsReposting(false);
            setShowQuoteBox(false);
        }
    };

    const handleReplyCreated = (replyPost: Post) => {
        setComments([replyPost, ...comments]); // Using the replies array, mapped back to comments for UI convenience
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

    return (
        <Card className="border-border/50 overflow-hidden bg-card/50 hover:bg-card/80 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-5 pb-0">
                {/* Author Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-primary/20">
                            <AvatarImage src={post.author.avatarUrl} />
                            <AvatarFallback className="bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-bold">
                                {post.author.username[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-foreground">{post.author.username}</h4>
                                {post.author.isInfluencer && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                                        Pro Analyst
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground/90">
                        {post.content}
                    </p>

                    {/* Render Image (Static Chart / drawing) */}
                    {mediaUrl && (
                        <div className="rounded-xl overflow-hidden border border-border/40 shadow-inner">
                            <img
                                src={getFileUrl(mediaUrl)}
                                alt="Post attachment"
                                className="w-full h-auto max-h-[500px] object-cover"
                            />
                        </div>
                    )}

                    {/* Render Chart if Ticker Present AND no image (or both? stick to requirements: static non-editable) */}
                    {/* User requirement: "los graficos de los post no pueden ser editables". A live chart IS editable (interaction).
                        But "el usuario antes de subirlos le puede hacer lineas". This implies the image upload.
                        Maybe we should HIDE the live chart if an image is provided? Or keep both?
                        Let's keep both, as live chart provides current context, image provides the "analysis".
                    */}
                    {!mediaUrl && tvSymbol && (
                        <div className="h-[350px] w-full bg-background rounded-xl border border-border/40 overflow-hidden shadow-inner">
                            <TradingViewWidget symbol={tvSymbol} autosize={true} />
                        </div>
                    )}

                    {/* Quoted Post (Quote Tweet equivalent) */}
                    {post.quotedPost && (
                        <div className="mt-2 text-left rounded-xl border border-border/50 bg-background/30 p-4 hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <Avatar className="w-5 h-5">
                                    <AvatarImage src={post.quotedPost.author.avatarUrl} />
                                    <AvatarFallback className="bg-secondary text-[10px]">{post.quotedPost.author.username[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-sm">{post.quotedPost.author.username}</span>
                                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.quotedPost.createdAt), { locale: es })}</span>
                            </div>
                            <p className="text-sm line-clamp-3 mb-2">{post.quotedPost.content}</p>
                            {/* Short media preview if quoted post has media */}
                            {getPrimaryMedia(post.quotedPost) && (
                                <img src={getFileUrl(getPrimaryMedia(post.quotedPost) as string)} className="w-full h-32 object-cover rounded-lg" alt="Quote media" />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions Bar */}
            <div className="p-3 mt-4 flex items-center justify-between text-sm text-muted-foreground border-t border-border/30 bg-muted/20">
                <div className="flex gap-1 md:gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-2 ${isLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-400'} hover:bg-red-400/10`}
                        onClick={handleLike}
                    >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="font-medium">{likes}</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 hover:text-blue-400 hover:bg-blue-400/10"
                        onClick={() => setShowComments(!showComments)}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-medium">{comments.length + (post.comments?.length || 0)}</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 hover:text-green-400 hover:bg-green-400/10"
                        onClick={() => setShowQuoteBox(!showQuoteBox)}
                        disabled={isReposting}
                    >
                        <Share2 className="w-4 h-4" />
                        {post._count?.reposts ? <span className="font-medium">{post._count?.reposts}</span> : null}
                    </Button>
                </div>
            </div>

            {/* Quick Quote / Reply Actions */}
            {showQuoteBox && (
                <div className="p-4 bg-muted/20 border-t border-border/30">
                    <div className="flex gap-4 items-center mb-4">
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white w-full gap-2"
                            onClick={handleRepost}
                            disabled={isReposting}
                        >
                            <Share2 className="w-4 h-4" /> Repost Simple
                        </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">O citar publicación:</div>
                    <CreatePostWidget
                        isReply={true}
                        quotedPostId={post.id}
                        placeholder="Añade un comentario a este repost..."
                        onPostCreated={() => {
                            setShowQuoteBox(false);
                            // handle locally
                        }}
                    />
                </div>
            )}

            {/* Comments / Replies Section */}
            {showComments && (
                <div className="p-4 bg-muted/30 border-t border-border/30 space-y-6">
                    {/* Integrated Thread-style Comment Form via Post Widget */}
                    <div className="pb-4 border-b border-border/20">
                        <CreatePostWidget
                            isReply={true}
                            parentId={post.id}
                            placeholder="Responde a esta conversación..."
                            onPostCreated={handleReplyCreated}
                            autoFocus={true}
                        />
                    </div>

                    <div className="space-y-5">
                        {/* Render Replies or Legacy Comments safely */}
                        {(comments?.length > 0 ? comments : (post.comments || [])).map((comment: any) => (
                            <div key={comment.id} className="flex gap-3 text-sm group">
                                <Avatar className="w-8 h-8 mt-1 border border-border/50">
                                    <AvatarFallback className="bg-secondary text-xs">
                                        {comment.author.username[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-bold text-foreground mr-2">{comment.author.username}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.createdAt), { locale: es })}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground/90 leading-snug">{comment.content}</p>
                                </div>
                            </div>
                        ))}


                    </div>
                </div>
            )}
        </Card>
    );
}
