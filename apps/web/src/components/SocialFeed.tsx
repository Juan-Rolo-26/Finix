import { useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '../stores/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
    Heart,
    MessageSquare,
    Share2,
    MoreHorizontal,
    Send,
    TrendingUp,
    Image as ImageIcon,
    X
} from 'lucide-react';
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
    _count?: {
        likes: number;
        comments: number;
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
    const { user } = useAuthStore();
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [newPostContent, setNewPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [attachedImage, setAttachedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync state when props change
    const [prevInitialPosts, setPrevInitialPosts] = useState(initialPosts);
    if (initialPosts !== prevInitialPosts) {
        setPrevInitialPosts(initialPosts);
        setPosts(initialPosts);
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAttachedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setAttachedImage(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() && !attachedImage) return;
        setIsPosting(true);

        try {
            // Upload image first if exists
            let mediaUrl = '';
            if (attachedImage) {
                const formData = new FormData();
                formData.append('file', attachedImage);
                const uploadRes = await apiFetch('/posts/upload', {
                    method: 'POST',
                    // Don't set Content-Type header manually for FormData, fetch does it
                    headers: {},
                    body: formData,
                });
                if (!uploadRes.ok) throw new Error('Image upload failed');
                const uploadData = await uploadRes.json();
                mediaUrl = uploadData.url;
            }

            // Simple ticker extraction regex
            const matches = newPostContent.match(/\$[A-Za-z][A-Za-z0-9]{0,9}/g) || [];
            const tickers = Array.from(new Set(matches.map((t) => t.toUpperCase())));

            const res = await apiFetch('/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newPostContent,
                    tickers,
                    mediaUrl: mediaUrl || undefined
                }),
            });

            if (!res.ok) throw new Error('Error creating post');

            const savedPost = await res.json();
            setPosts([savedPost, ...posts]);
            setNewPostContent('');
            handleRemoveImage();
            onPostCreated(savedPost);
        } catch (error) {
            console.error(error);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Create Post Widget */}
            <Card className="p-4 border-border/50 bg-secondary/10 backdrop-blur-sm">
                <div className="flex gap-4">
                    <Avatar className="w-10 h-10 border border-primary/20">
                        <AvatarImage src={user?.avatarUrl} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                        <Textarea
                            placeholder="¿Qué estás analizando hoy? (ej. $BTC rompiendo resistencia...)"
                            className="w-full bg-transparent border-none focus-visible:ring-0 text-lg placeholder:text-muted-foreground/50 resize-none min-h-[60px]"
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                        />

                        {/* Image Preview */}
                        {previewUrl && (
                            <div className="relative inline-block mt-2">
                                <img src={previewUrl} alt="Preview" className="h-32 rounded-lg border border-border/50 object-cover" />
                                <button
                                    onClick={handleRemoveImage}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-border/30">
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-primary h-8 px-2 gap-2"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImageIcon className="w-4 h-4" /> Media
                                </Button>
                                {/* Disabled for now as we focus on image upload which supports snapshots */}
                                {/* 
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-emerald-400 h-8 px-2 gap-2">
                                    <TrendingUp className="w-4 h-4" /> Chart
                                </Button> 
                                */}
                            </div>
                            <Button
                                size="sm"
                                className="rounded-full font-bold px-6 bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                                onClick={handleCreatePost}
                                disabled={isPosting || (!newPostContent.trim() && !attachedImage)}
                            >
                                {isPosting ? 'Publicando...' : 'Publicar'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

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
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>(post.comments || []);
    const [newComment, setNewComment] = useState('');
    const [loadingComment, setLoadingComment] = useState(false);

    const handleLike = async () => {
        // Optimistic UI
        const prevLikes = likes;
        const prevIsLiked = isLiked;

        setIsLiked(!isLiked);
        setLikes(prevIsLiked ? prevLikes - 1 : prevLikes + 1);

        try {
            const res = await apiFetch(`/posts/${post.id}/like`, { method: 'POST' });
            if (!res.ok) throw new Error();
        } catch {
            // Revert on error
            setIsLiked(prevIsLiked);
            setLikes(prevLikes);
        }
    };

    const handleComment = async () => {
        if (!newComment.trim()) return;
        setLoadingComment(true);
        try {
            const res = await apiFetch(`/posts/${post.id}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });
            if (res.ok) {
                const savedComment = await res.json();
                setComments([savedComment, ...comments]);
                setNewComment('');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingComment(false);
        }
    };

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
                    {post.mediaUrl && (
                        <div className="rounded-xl overflow-hidden border border-border/40 shadow-inner">
                            {/* Assuming backend serves uploads at /api/uploads/... however usually it's root /uploads if proxied. 
                                Since we did app.use('/uploads'...), the URL returned was /uploads/filename.
                                If the frontend is on 5173 and backend on 3001, we might need full URL unless proxied.
                                Finix usually has proxy in vite.config. Let's assume proxy handles /api.
                                But we mounted /uploads at root of app, so it's http://localhost:3001/uploads/...
                                We should probably prepend API_URL if it's relative.
                             */}
                            <img
                                src={getFileUrl(post.mediaUrl)}
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
                    {!post.mediaUrl && tvSymbol && (
                        <div className="h-[350px] w-full bg-background rounded-xl border border-border/40 overflow-hidden shadow-inner">
                            <TradingViewWidget symbol={tvSymbol} autosize={true} />
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
                        <span className="font-medium">{comments.length}</span>
                    </Button>

                    <Button variant="ghost" size="sm" className="gap-2 hover:text-green-400 hover:bg-green-400/10">
                        <Share2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="p-4 bg-muted/30 border-t border-border/30 space-y-4">
                    {comments.map(comment => (
                        <div key={comment.id} className="flex gap-3 text-sm group">
                            <Avatar className="w-8 h-8">
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

                    <div className="flex gap-2 items-end pt-2">
                        <Textarea
                            placeholder="Escribe un comentario..."
                            className="min-h-[40px] h-[40px] py-2 resize-none text-sm bg-background/50"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleComment();
                                }
                            }}
                        />
                        <Button
                            size="icon"
                            disabled={!newComment.trim() || loadingComment}
                            onClick={handleComment}
                            className="h-10 w-10 shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}
