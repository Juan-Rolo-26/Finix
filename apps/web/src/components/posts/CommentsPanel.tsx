import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Reply, ChevronDown, Loader2, BadgeCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommentAuthor {
    id: string;
    username: string;
    avatarUrl?: string;
    isVerified?: boolean;
}

interface Comment {
    id: string;
    content: string;
    author: CommentAuthor;
    likesCount: number;
    repliesCount: number;
    likedByMe: boolean;
    createdAt: string;
    replies?: Comment[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
}

// ─── Single Comment ───────────────────────────────────────────────────────────

function CommentItem({
    comment,
    postId,
    currentUserId,
    onDeleted,
    depth = 0,
}: {
    comment: Comment;
    postId: string;
    currentUserId?: string;
    onDeleted: (id: string) => void;
    depth?: number;
}) {
    const [liked, setLiked] = useState(comment.likedByMe);
    const [likesCount, setLikesCount] = useState(comment.likesCount);
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replies, setReplies] = useState<Comment[]>(comment.replies || []);
    const [showReplies, setShowReplies] = useState(false);

    const isOwner = currentUserId === comment.author.id;

    const handleLike = async () => {
        const prev = liked;
        setLiked(!liked);
        setLikesCount((c) => c + (liked ? -1 : 1));
        try {
            await apiFetch(`/posts/comment/${comment.id}/like`, { method: 'POST' });
        } catch {
            setLiked(prev);
            setLikesCount((c) => c + (liked ? 1 : -1));
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Eliminar este comentario?')) return;
        try {
            await apiFetch(`/posts/comment/${comment.id}`, { method: 'DELETE' });
            onDeleted(comment.id);
        } catch { }
    };

    const handleReply = async () => {
        if (!replyText.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await apiFetch(`/posts/${postId}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: replyText, parentId: comment.id }),
            });
            if (res.ok) {
                const newReply = await res.json();
                setReplies((prev) => [...prev, { ...newReply, likedByMe: false, likesCount: 0, repliesCount: 0 }]);
                setReplyText('');
                setShowReply(false);
                setShowReplies(true);
            }
        } catch { }
        setIsSubmitting(false);
    };

    return (
        <div className={`${depth > 0 ? 'ml-8 border-l border-border/30 pl-4' : ''}`}>
            <div className="flex gap-3 py-2">
                {/* Avatar */}
                <Link to={`/profile/${comment.author.username}`} className="shrink-0">
                    {comment.author.avatarUrl ? (
                        <img src={comment.author.avatarUrl} alt={comment.author.username} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-black text-xs font-bold">
                            {comment.author.username[0].toUpperCase()}
                        </div>
                    )}
                </Link>

                <div className="flex-1 min-w-0">
                    {/* Bubble */}
                    <div className="bg-secondary/30 rounded-2xl rounded-tl-sm px-3 py-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <Link to={`/profile/${comment.author.username}`} className="text-xs font-semibold hover:text-primary transition-colors">
                                {comment.author.username}
                            </Link>
                            {comment.author.isVerified && <BadgeCheck className="w-3 h-3 text-primary" />}
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-1 ml-1">
                        <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-red-400' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Heart className={`w-3 h-3 ${liked ? 'fill-red-400' : ''}`} />
                            {likesCount > 0 && likesCount}
                        </button>
                        {depth === 0 && currentUserId && (
                            <button
                                onClick={() => setShowReply(!showReply)}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Reply className="w-3 h-3" />
                                Responder
                            </button>
                        )}
                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Reply input */}
                    {showReply && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 flex gap-2"
                        >
                            <Textarea
                                placeholder={`Responder a @${comment.author.username}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="bg-secondary/30 resize-none text-sm"
                                rows={2}
                                maxLength={500}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); }
                                }}
                            />
                            <Button size="sm" onClick={handleReply} disabled={isSubmitting || !replyText.trim()} className="shrink-0">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </motion.div>
                    )}

                    {/* Show replies */}
                    {comment.repliesCount > 0 && depth === 0 && (
                        <button
                            onClick={() => setShowReplies(!showReplies)}
                            className="flex items-center gap-1 text-xs text-primary mt-1 ml-1 hover:underline"
                        >
                            <ChevronDown className={`w-3 h-3 transition-transform ${showReplies ? 'rotate-180' : ''}`} />
                            {showReplies ? 'Ocultar' : `Ver ${comment.repliesCount} respuesta${comment.repliesCount > 1 ? 's' : ''}`}
                        </button>
                    )}
                </div>
            </div>

            {/* Replies */}
            {showReplies && replies.map((reply) => (
                <CommentItem
                    key={reply.id}
                    comment={reply}
                    postId={postId}
                    currentUserId={currentUserId}
                    onDeleted={(id) => setReplies((prev) => prev.filter((r) => r.id !== id))}
                    depth={1}
                />
            ))}
        </div>
    );
}

// ─── CommentsPanel ────────────────────────────────────────────────────────────

interface CommentsPanelProps {
    postId: string;
    currentUserId?: string;
    onCountChange: (n: number) => void;
}

export default function CommentsPanel({ postId, currentUserId, onCountChange }: CommentsPanelProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const res = await apiFetch(`/posts/${postId}/comments?limit=10`);
                if (res.ok) {
                    const data = await res.json();
                    setComments(data.comments || []);
                    setNextCursor(data.nextCursor);
                    setHasMore(data.hasMore);
                    onCountChange(data.comments?.length || 0);
                }
            } catch { }
            setIsLoading(false);
        };
        load();
    }, [postId]);

    const handleSubmit = async () => {
        if (!newComment.trim() || !currentUserId) return;
        setIsSubmitting(true);
        try {
            const res = await apiFetch(`/posts/${postId}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });
            if (res.ok) {
                const comment = await res.json();
                const enriched = { ...comment, likedByMe: false, likesCount: 0, repliesCount: 0 };
                setComments((prev) => [enriched, ...prev]);
                setNewComment('');
                onCountChange(comments.length + 1);
            }
        } catch { }
        setIsSubmitting(false);
    };

    const handleLoadMore = async () => {
        if (!nextCursor) return;
        try {
            const res = await apiFetch(`/posts/${postId}/comments?cursor=${nextCursor}&limit=10`);
            if (res.ok) {
                const data = await res.json();
                setComments((prev) => [...prev, ...(data.comments || [])]);
                setNextCursor(data.nextCursor);
                setHasMore(data.hasMore);
            }
        } catch { }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border/30 px-4 py-3 space-y-3"
        >
            {/* Input */}
            {currentUserId && (
                <div className="flex gap-2">
                    <Textarea
                        placeholder="Escribí un comentario..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="bg-secondary/30 resize-none text-sm"
                        rows={2}
                        maxLength={1000}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                        }}
                    />
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !newComment.trim()}
                        className="shrink-0 self-end"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            )}

            {/* Comments list */}
            {isLoading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
            ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                    {currentUserId ? 'Sé el primero en comentar' : 'Sin comentarios aún'}
                </p>
            ) : (
                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                    {comments.map((c) => (
                        <CommentItem
                            key={c.id}
                            comment={c}
                            postId={postId}
                            currentUserId={currentUserId}
                            onDeleted={(id) => {
                                setComments((prev) => prev.filter((x) => x.id !== id));
                                onCountChange(Math.max(0, comments.length - 1));
                            }}
                        />
                    ))}
                    {hasMore && (
                        <button
                            onClick={handleLoadMore}
                            className="w-full text-xs text-primary hover:underline py-2"
                        >
                            Ver más comentarios
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
}
