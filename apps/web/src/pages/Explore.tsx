import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useLocation, useNavigate } from 'react-router-dom';
import PostCard from '@/components/posts/PostCard';
import CreatePostModal from '@/components/posts/CreatePostModal';
import { Button } from '@/components/ui/button';
import {
    Flame,
    Clock,
    Users,
    TrendingUp,
    PenSquare,
    RefreshCw,
    Loader2,
    LayoutGrid,
    Film,
    BarChart2,
    Image,
    Bookmark,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PostMedia {
    id: string;
    url: string;
    mediaType: 'image' | 'video';
    order: number;
}

export interface PostAuthor {
    id: string;
    username: string;
    avatarUrl?: string;
    isVerified?: boolean;
    isInfluencer?: boolean;
    isCreator?: boolean;
}

export interface Post {
    id: string;
    content: string;
    type: 'post' | 'image' | 'reel' | 'chart';
    assetSymbol?: string;
    analysisType?: string;
    riskLevel?: string;
    mediaUrl?: string;
    media: PostMedia[];
    author: PostAuthor;
    likesCount: number;
    commentsCount: number;
    repostsCount: number;
    savesCount: number;
    likedByMe: boolean;
    repostedByMe: boolean;
    savedByMe: boolean;
    contentEditedAt?: string;
    createdAt: string;
    tickers?: string;
}

// ─── Sort tabs ────────────────────────────────────────────────────────────────

const SORT_TABS = [
    { key: 'recent', label: 'Recientes', icon: Clock },
    { key: 'popular', label: 'Populares', icon: Flame },
    { key: 'following', label: 'Siguiendo', icon: Users },
    { key: 'trending', label: 'Tendencias', icon: TrendingUp },
] as const;

const TYPE_FILTERS = [
    { key: '', label: 'Todo', icon: LayoutGrid },
    { key: 'post', label: 'Posts', icon: PenSquare },
    { key: 'image', label: 'Imágenes', icon: Image },
    { key: 'reel', label: 'Ediciones', icon: Film },
    { key: 'chart', label: 'Gráficos', icon: BarChart2 },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExplorePage() {
    const { user } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [sort, setSort] = useState<'recent' | 'popular' | 'following' | 'trending'>('recent');
    const [typeFilter, setTypeFilter] = useState('');
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const loaderRef = useRef<HTMLDivElement>(null);

    const fetchPosts = useCallback(async (reset = false) => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const cursor = reset ? '' : nextCursor;
            const params = new URLSearchParams({
                sort,
                limit: '15',
                ...(cursor ? { cursor } : {}),
                ...(typeFilter ? { type: typeFilter } : {}),
            });

            const endpoint = showSaved ? '/posts/saved' : `/posts/feed?${params}`;
            const res = await apiFetch(endpoint);
            if (!res.ok) return;

            const data = await res.json();
            const newPosts: Post[] = data.posts || [];

            setPosts((prev) => reset ? newPosts : [...prev, ...newPosts]);
            setNextCursor(data.nextCursor || null);
            setHasMore(data.hasMore ?? false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [sort, typeFilter, nextCursor, isLoading, showSaved]);

    // Reset + fetch on filter change
    useEffect(() => {
        setPosts([]);
        setNextCursor(null);
        setHasMore(true);
        fetchPosts(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sort, typeFilter, showSaved]);

    // Check for create param
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('create') === 'true') {
            setShowCreate(true);
            navigate(location.pathname, { replace: true });
        }
    }, [location.search, navigate, location.pathname]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    fetchPosts(false);
                }
            },
            { threshold: 0.1 }
        );
        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [hasMore, isLoading, fetchPosts]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setPosts([]);
        setNextCursor(null);
        setHasMore(true);
        await fetchPosts(true);
    };

    const handlePostCreated = (newPost: Post) => {
        setShowSaved(false);
        setPosts((prev) => [newPost, ...prev]);
        setShowCreate(false);
    };

    const handlePostUpdated = (updated: Post) => {
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    };

    const handlePostDeleted = (postId: string) => {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-heading font-bold">Crear</h1>
                        <p className="text-sm text-muted-foreground">Publica en el feed principal como Instagram: posts, ediciones y gráficos</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowSaved(!showSaved)}
                            className={showSaved ? 'text-primary' : ''}
                            title="Guardados"
                        >
                            <Bookmark className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            title="Actualizar"
                        >
                            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            onClick={() => setShowCreate(true)}
                            className="gap-2 bg-gradient-to-r from-primary to-emerald-400 text-black font-bold shadow-glow"
                        >
                            <PenSquare className="w-4 h-4" />
                            <span className="hidden sm:inline">Crear</span>
                        </Button>
                    </div>
                </div>

                {/* ── Sort tabs ── */}
                {!showSaved && (
                    <div className="flex gap-1 bg-secondary/30 p-1 rounded-xl overflow-x-auto scrollbar-hide">
                        {SORT_TABS.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setSort(key)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${sort === key
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Type filter ── */}
                {!showSaved && (
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                        {TYPE_FILTERS.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setTypeFilter(key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${typeFilter === key
                                    ? 'bg-primary/10 border-primary/40 text-primary'
                                    : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                                    }`}
                            >
                                <Icon className="w-3 h-3" />
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Saved header ── */}
                {showSaved && (
                    <div className="flex items-center gap-2 text-primary">
                        <Bookmark className="w-5 h-5 fill-primary" />
                        <span className="font-semibold">Publicaciones guardadas</span>
                    </div>
                )}

                {/* ── Posts ── */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {posts.map((post, i) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i < 5 ? i * 0.05 : 0 }}
                            >
                                <PostCard
                                    post={post}
                                    currentUserId={user?.id}
                                    onUpdated={handlePostUpdated}
                                    onDeleted={handlePostDeleted}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Empty state */}
                    {!isLoading && posts.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16 space-y-4"
                        >
                            <div className="text-6xl">📭</div>
                            <h3 className="text-lg font-semibold">
                                {showSaved ? 'No tenés publicaciones guardadas' : 'No hay publicaciones aún'}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                {showSaved
                                    ? 'Guardá publicaciones para verlas acá'
                                    : sort === 'following'
                                        ? 'Seguí a usuarios para ver su contenido acá'
                                        : '¡Sé el primero en crear contenido!'}
                            </p>
                            {!showSaved && (
                                <Button onClick={() => setShowCreate(true)} className="mt-2">
                                    Crear publicación
                                </Button>
                            )}
                        </motion.div>
                    )}

                    {/* Infinite scroll loader */}
                    <div ref={loaderRef} className="py-4 flex justify-center">
                        {isLoading && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cargando...
                            </div>
                        )}
                        {!isLoading && !hasMore && posts.length > 0 && (
                            <p className="text-xs text-muted-foreground">— Fin del feed —</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Create Post Modal ── */}
            <AnimatePresence>
                {showCreate && (
                    <CreatePostModal
                        onClose={() => setShowCreate(false)}
                        onCreated={handlePostCreated}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
