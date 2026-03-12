import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useLocation, useNavigate } from 'react-router-dom';
import PostCard from '@/components/posts/PostCard';
import CreatePostModal from '@/components/posts/CreatePostModal';
import { StoryComposerModal } from '@/components/stories/StoryComposerModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
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
    ChevronDown,
    Sparkles,
} from 'lucide-react';
import type { StoryAuthor, StoryItem } from '@/components/stories/storyTypes';

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
    quotedPost?: Post;
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
    { key: 'post', label: 'Publicaciones', icon: PenSquare },
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
    const [showStoryComposer, setShowStoryComposer] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const loaderRef = useRef<HTMLDivElement>(null);

    const storyComposerUser: StoryAuthor | null = user ? {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        bio: user.bio,
        title: (user as any).title,
    } : null;

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
        setPosts((prev) => {
            if (showSaved && !updated.savedByMe) {
                return prev.filter((p) => p.id !== updated.id);
            }
            return prev.map((p) => (p.id === updated.id ? updated : p));
        });
    };

    const handlePostDeleted = (postId: string) => {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
    };

    const handleStoryCreated = (_story: StoryItem) => {
        setShowStoryComposer(false);
    };

    return (
        <div className="min-h-screen w-full">
            <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-6 md:px-6 xl:px-8">

                <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_34%)]" />
                        <div className="relative flex flex-col gap-6 p-6 md:p-8">
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                <div className="max-w-3xl space-y-3">
                                    <Badge
                                        variant="outline"
                                        className="w-fit border-primary/20 bg-primary/10 text-primary"
                                    >
                                        {showSaved ? 'Coleccion personal' : 'Actividad de mercado'}
                                    </Badge>
                                    <div className="space-y-2">
                                        <h1 className="text-3xl font-semibold tracking-tight">Explorar</h1>
                                        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                                            Descubrí ideas, publicaciones, ediciones y gráficos con una superficie más amplia,
                                            limpia y profesional para navegar la actividad de Finix.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        variant={showSaved ? 'secondary' : 'outline'}
                                        onClick={() => setShowSaved(!showSaved)}
                                        className={`gap-2 ${showSaved ? 'text-primary' : ''}`}
                                    >
                                        <Bookmark className={`w-5 h-5 ${showSaved ? 'fill-primary' : ''}`} />
                                        <span>{showSaved ? 'Volver a la actividad' : 'Guardados'}</span>
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
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button className="gap-2 bg-gradient-to-r from-primary to-emerald-400 text-black font-bold shadow-glow">
                                                <PenSquare className="w-4 h-4" />
                                                <span>Crear</span>
                                                <ChevronDown className="w-4 h-4 opacity-70" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-52">
                                            <DropdownMenuLabel>Nuevo contenido</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setShowCreate(true)}>
                                                <PenSquare className="w-4 h-4" />
                                                Publicación
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setShowStoryComposer(true)}>
                                                <Sparkles className="w-4 h-4" />
                                                Historia
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {!showSaved && (
                                <div className="grid gap-4">
                                    <div className="grid gap-2 rounded-2xl border border-border/60 bg-background/70 p-2 md:grid-cols-2 xl:grid-cols-4">
                                        {SORT_TABS.map(({ key, label, icon: Icon }) => (
                                            <button
                                                key={key}
                                                onClick={() => setSort(key)}
                                                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${sort === key
                                                    ? 'bg-card text-foreground shadow-sm ring-1 ring-border/70'
                                                    : 'text-muted-foreground hover:bg-background hover:text-foreground'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {TYPE_FILTERS.map(({ key, label, icon: Icon }) => (
                                            <button
                                                key={key}
                                                onClick={() => setTypeFilter(key)}
                                                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${typeFilter === key
                                                    ? 'border-primary/40 bg-primary/10 text-primary'
                                                    : 'border-border/60 bg-background/50 text-muted-foreground hover:border-border hover:text-foreground'
                                                    }`}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {showSaved && (
                                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 text-primary">
                                    <Bookmark className="w-5 h-5 fill-primary" />
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-semibold">Publicaciones guardadas</p>
                                        <p className="text-sm text-muted-foreground">
                                            Un espacio dedicado para volver rápido a tus ideas y análisis más relevantes.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                <div className="min-w-0 space-y-4">
                        {isLoading && posts.length === 0 ? (
                            <div className="space-y-4">
                                {[0, 1, 2].map((item) => (
                                    <Card key={item} className="border-border/60 bg-card/70 shadow-sm">
                                        <CardContent className="space-y-5 p-6">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-11 w-11 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-[82%]" />
                                                <Skeleton className="h-4 w-[68%]" />
                                            </div>
                                            <Skeleton className="h-52 w-full rounded-2xl" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <>
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

                                {!isLoading && posts.length === 0 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <Card className="border-border/60 bg-card/70 shadow-sm">
                                            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                                                <span className="emoji-glyph text-6xl">📭</span>
                                                <div className="space-y-2">
                                                    <h3 className="text-lg font-semibold">
                                                        {showSaved ? 'No tenés publicaciones guardadas' : 'No hay publicaciones aún'}
                                                    </h3>
                                                    <p className="mx-auto max-w-md text-sm text-muted-foreground">
                                                        {showSaved
                                                            ? 'Guardá publicaciones para revisitarlas acá con una vista limpia y enfocada.'
                                                            : sort === 'following'
                                                                ? 'Seguí a otros usuarios para ver su contenido en esta vista.'
                                                                : 'Todavía no hay contenido cargado para este filtro. Probá cambiar la vista o crear una publicación.'}
                                                    </p>
                                                </div>
                                                {!showSaved && (
                                                    <Button onClick={() => setShowCreate(true)} className="mt-2">
                                                        Crear publicación
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </>
                        )}

                        <div ref={loaderRef} className="flex justify-center py-4">
                            {isLoading && posts.length > 0 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Cargando más publicaciones...
                                </div>
                            )}
                            {!isLoading && !hasMore && posts.length > 0 && (
                                <p className="text-xs text-muted-foreground">Fin de la actividad</p>
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

            <StoryComposerModal
                open={showStoryComposer}
                onOpenChange={setShowStoryComposer}
                onCreated={handleStoryCreated}
                currentUser={storyComposerUser}
            />
        </div>
    );
}
