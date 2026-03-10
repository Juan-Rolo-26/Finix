import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import PostCard from '@/components/posts/PostCard';
import type { Post } from '@/pages/Explore';
import { useAuthStore } from '@/stores/authStore';

export default function PostDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuthStore();
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            setIsLoading(false);
            return;
        }

        const loadPost = async () => {
            setIsLoading(true);
            try {
                const res = await apiFetch(`/posts/${id}`);
                if (!res.ok) {
                    setPost(null);
                    return;
                }

                const data = await res.json();
                setPost(data);
            } catch {
                setPost(null);
            } finally {
                setIsLoading(false);
            }
        };

        void loadPost();
    }, [id]);

    return (
        <div className="flex-1 w-full bg-background text-foreground">
            <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                </button>

                {isLoading ? (
                    <div className="rounded-2xl border border-border bg-card/40 py-16 text-center">
                        <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Cargando publicación...</p>
                    </div>
                ) : post ? (
                    <PostCard
                        post={post}
                        currentUserId={user?.id}
                        onUpdated={setPost}
                        onDeleted={() => navigate('/explore')}
                    />
                ) : (
                    <div className="rounded-2xl border border-border bg-card/40 py-16 text-center">
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm text-muted-foreground">No se encontró la publicación</p>
                    </div>
                )}
            </div>
        </div>
    );
}
