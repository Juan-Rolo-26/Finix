import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    BadgeCheck,
    BarChart2,
    Image as ImageIcon,
    Loader2,
    MessageSquare,
    PenSquare,
    X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import type { ComposerAttachment, SharedPostPreview } from './messageTypes';

const TYPE_ICONS = {
    post: PenSquare,
    image: ImageIcon,
    reel: ImageIcon,
    chart: BarChart2,
};

const TYPE_LABELS = {
    post: 'Texto',
    image: 'Imagen',
    reel: 'Edicion',
    chart: 'Grafico',
};

function normalizePost(post: any): SharedPostPreview {
    return {
        id: post.id,
        content: post.content || '',
        type: post.type || 'post',
        assetSymbol: post.assetSymbol ?? null,
        analysisType: post.analysisType ?? null,
        riskLevel: post.riskLevel ?? null,
        createdAt: post.createdAt,
        author: {
            id: post.author.id,
            username: post.author.username,
            avatarUrl: post.author.avatarUrl,
            isVerified: post.author.isVerified,
        },
        media: Array.isArray(post.media)
            ? post.media.map((item: any) => ({
                id: item.id,
                url: item.url,
                mediaType: item.mediaType,
                order: item.order ?? 0,
            }))
            : [],
    };
}

interface PostPickerModalProps {
    currentUsername?: string;
    onClose: () => void;
    onSelect: (attachment: ComposerAttachment) => void;
}

export default function PostPickerModal({
    currentUsername,
    onClose,
    onSelect,
}: PostPickerModalProps) {
    const [activeTab, setActiveTab] = useState<'mine' | 'recent'>(currentUsername ? 'mine' : 'recent');
    const [minePosts, setMinePosts] = useState<SharedPostPreview[]>([]);
    const [recentPosts, setRecentPosts] = useState<SharedPostPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let ignore = false;

        const loadPosts = async () => {
            setLoading(true);
            setError('');

            try {
                const requests: Promise<Response>[] = [apiFetch('/posts/feed?limit=8')];
                if (currentUsername) {
                    requests.unshift(apiFetch(`/posts/user/${currentUsername}?limit=8`));
                }

                const responses = await Promise.all(requests);
                if (ignore) return;

                if (currentUsername) {
                    const [mineRes, recentRes] = responses;
                    const mineData = mineRes.ok ? await mineRes.json() : { posts: [] };
                    const recentData = recentRes.ok ? await recentRes.json() : { posts: [] };
                    setMinePosts((mineData.posts || []).map(normalizePost));
                    setRecentPosts((recentData.posts || []).map(normalizePost));
                } else {
                    const [recentRes] = responses;
                    const recentData = recentRes.ok ? await recentRes.json() : { posts: [] };
                    setRecentPosts((recentData.posts || []).map(normalizePost));
                }
            } catch (nextError: any) {
                if (!ignore) {
                    setError(nextError?.message || 'No se pudieron cargar las publicaciones');
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        loadPosts();

        return () => {
            ignore = true;
        };
    }, [currentUsername]);

    const posts = activeTab === 'mine' ? minePosts : recentPosts;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.98 }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-3xl border border-border/40 bg-card"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border/30 bg-card/95 backdrop-blur-sm">
                    <div>
                        <h2 className="text-lg font-black">Compartir publicacion</h2>
                        <p className="text-xs text-muted-foreground">Selecciona una publicacion para enviarla en el chat</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary/60 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        {currentUsername && (
                            <button
                                onClick={() => setActiveTab('mine')}
                                className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
                                    activeTab === 'mine'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                            >
                                Mis publicaciones
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('recent')}
                            className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
                                activeTab === 'recent'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                        >
                            Recientes
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-14">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="rounded-3xl border border-border/30 bg-secondary/20 px-6 py-12 text-center space-y-3">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">No hay publicaciones para compartir</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Crea una nueva publicacion o prueba con la pestana de recientes.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {posts.map((post) => {
                                const Icon = TYPE_ICONS[post.type] || PenSquare;
                                const firstMedia = post.media[0];

                                return (
                                    <button
                                        key={post.id}
                                        onClick={() => onSelect({ type: 'post', postId: post.id, sharedPost: post })}
                                        className="w-full rounded-3xl border border-border/30 bg-secondary/10 text-left hover:border-primary/30 hover:bg-secondary/20 transition-colors overflow-hidden"
                                    >
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                {post.author.avatarUrl ? (
                                                    <img
                                                        src={resolveMediaUrl(post.author.avatarUrl)}
                                                        alt={post.author.username}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-primary text-black font-bold flex items-center justify-center">
                                                        {post.author.username[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-semibold truncate">{post.author.username}</span>
                                                        {post.author.isVerified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border/30 bg-background/50">
                                                            <Icon className="w-3.5 h-3.5" />
                                                            {TYPE_LABELS[post.type] || 'Post'}
                                                        </span>
                                                        {post.type === 'chart' && post.assetSymbol && (
                                                            <span className="font-mono">{post.assetSymbol}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {post.content && (
                                                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap max-h-20 overflow-hidden">
                                                    {post.content}
                                                </p>
                                            )}

                                            {firstMedia && (
                                                <div className="rounded-2xl overflow-hidden border border-border/30 bg-black/20">
                                                    <img
                                                        src={resolveMediaUrl(firstMedia.url)}
                                                        alt="Vista previa"
                                                        className="w-full max-h-72 object-cover"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
