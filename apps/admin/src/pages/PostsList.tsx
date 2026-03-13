import { FormEvent, useEffect, useState } from 'react';
import { adminFetch, readAdminErrorMessage } from '../lib/api';
import { AlertTriangle, EyeOff, FileText, RefreshCw, Search, Trash2 } from 'lucide-react';

type AdminPostRow = {
    id: string;
    content: string;
    visibility: string;
    type: string;
    assetSymbol?: string | null;
    author: {
        id: string;
        username: string;
        avatarUrl?: string | null;
    };
    createdAt: string;
    _count: {
        likes: number;
        comments: number;
        reports: number;
    };
};

type FeedbackState = {
    tone: 'success' | 'error';
    message: string;
} | null;

const PAGE_SIZE = 50;

export default function PostsList() {
    const [posts, setPosts] = useState<AdminPostRow[]>([]);
    const [search, setSearch] = useState('');
    const [submittedSearch, setSubmittedSearch] = useState('');
    const [visibilityFilter, setVisibilityFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<FeedbackState>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshTick, setRefreshTick] = useState(0);
    const [pendingPostId, setPendingPostId] = useState<string | null>(null);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const hiddenOnPage = posts.filter((post) => post.visibility === 'HIDDEN').length;
    const reportedOnPage = posts.filter((post) => post._count.reports > 0).length;
    const totalReportsOnPage = posts.reduce((sum, post) => sum + post._count.reports, 0);

    useEffect(() => {
        let cancelled = false;

        const loadPosts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(PAGE_SIZE),
                });

                if (submittedSearch) {
                    params.set('search', submittedSearch);
                }
                if (visibilityFilter) {
                    params.set('visibility', visibilityFilter);
                }

                const res = await adminFetch(`/admin/posts?${params.toString()}`);
                if (!res.ok) {
                    throw new Error(await readAdminErrorMessage(res, 'No se pudieron cargar las publicaciones'));
                }

                const data = await res.json();
                if (cancelled) {
                    return;
                }

                setPosts(data.data || []);
                setTotal(data.total || 0);
            } catch (error: any) {
                if (!cancelled) {
                    setFeedback({
                        tone: 'error',
                        message: error?.message || 'No se pudieron cargar las publicaciones',
                    });
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadPosts();

        return () => {
            cancelled = true;
        };
    }, [page, refreshTick, submittedSearch, visibilityFilter]);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFeedback(null);
        setPage(1);
        setSubmittedSearch(search.trim());
        setRefreshTick((current) => current + 1);
    };

    const handleRefresh = () => {
        setFeedback(null);
        setRefreshTick((current) => current + 1);
    };

    const handlePatchAction = async (
        postId: string,
        updates: Record<string, unknown>,
        successMessage: string,
        confirmationMessage: string,
    ) => {
        if (!window.confirm(confirmationMessage)) {
            return;
        }

        setFeedback(null);
        setPendingPostId(postId);

        try {
            const res = await adminFetch(`/admin/posts/${postId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (!res.ok) {
                throw new Error(await readAdminErrorMessage(res, 'No se pudo actualizar la publicación'));
            }

            setFeedback({ tone: 'success', message: successMessage });
            setRefreshTick((current) => current + 1);
        } catch (error: any) {
            setFeedback({
                tone: 'error',
                message: error?.message || 'No se pudo actualizar la publicación',
            });
        } finally {
            setPendingPostId(null);
        }
    };

    const handlePermanentDelete = async (post: AdminPostRow) => {
        const expectedConfirmation = `ELIMINAR ${post.id}`;
        const typedConfirmation = window.prompt(
            `Esta acción borra la publicación para siempre.\n\nEscribe exactamente:\n${expectedConfirmation}`,
            '',
        );

        if (typedConfirmation === null) {
            return;
        }

        if (typedConfirmation.trim() !== expectedConfirmation) {
            setFeedback({
                tone: 'error',
                message: `Confirmación inválida. Debes escribir exactamente "${expectedConfirmation}".`,
            });
            return;
        }

        setFeedback(null);
        setPendingPostId(post.id);

        try {
            const res = await adminFetch(`/admin/posts/${post.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error(await readAdminErrorMessage(res, 'No se pudo eliminar la publicación'));
            }

            setFeedback({
                tone: 'success',
                message: `La publicación ${post.id.slice(0, 8)} fue eliminada permanentemente.`,
            });
            setRefreshTick((current) => current + 1);
        } catch (error: any) {
            setFeedback({
                tone: 'error',
                message: error?.message || 'No se pudo eliminar la publicación',
            });
        } finally {
            setPendingPostId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-white">Gestión de Publicaciones</h1>
                    <p className="text-sm text-zinc-500">
                        Moderación rápida, ocultado, borrado lógico y eliminación permanente con auditoría.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
                    <form onSubmit={handleSearch} className="relative w-full xl:w-96">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar en contenido..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                    </form>

                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Resultados', value: total, icon: FileText, tone: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
                    { label: 'Ocultas en página', value: hiddenOnPage, icon: EyeOff, tone: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                    { label: 'Con reportes', value: reportedOnPage, icon: AlertTriangle, tone: 'text-red-400 bg-red-500/10 border-red-500/20' },
                    { label: 'Reportes totales', value: totalReportsOnPage, icon: Trash2, tone: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20' },
                ].map((card) => (
                    <div key={card.label} className="rounded-2xl border border-zinc-800/70 bg-zinc-900/90 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">{card.label}</p>
                                <p className="mt-2 text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
                            </div>
                            <div className={`rounded-2xl border p-3 ${card.tone}`}>
                                <card.icon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <label className="space-y-2 text-sm">
                        <span className="text-zinc-500">Visibilidad</span>
                        <select
                            value={visibilityFilter}
                            onChange={(event) => {
                                setPage(1);
                                setVisibilityFilter(event.target.value);
                            }}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none"
                        >
                            <option value="">Todas</option>
                            <option value="VISIBLE">VISIBLE</option>
                            <option value="HIDDEN">HIDDEN</option>
                        </select>
                    </label>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setSubmittedSearch('');
                                setVisibilityFilter('');
                                setPage(1);
                                setFeedback(null);
                                setRefreshTick((current) => current + 1);
                            }}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>

            {feedback && (
                <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                        feedback.tone === 'success'
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                            : 'border-red-500/20 bg-red-500/10 text-red-300'
                    }`}
                >
                    {feedback.message}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                {posts.map((post) => {
                    const isPending = pendingPostId === post.id;

                    return (
                        <article
                            key={post.id}
                            className="relative flex flex-col gap-4 rounded-2xl border border-zinc-800/60 bg-zinc-900 p-5 shadow-sm transition-colors hover:border-zinc-700"
                        >
                            {post.visibility === 'HIDDEN' && (
                                <span className="absolute right-4 top-4 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                    HIDDEN
                                </span>
                            )}

                            <div className="flex items-center gap-3">
                                {post.author.avatarUrl ? (
                                    <img
                                        src={post.author.avatarUrl}
                                        alt={post.author.username}
                                        className="h-10 w-10 rounded-full border border-zinc-800 object-cover"
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs text-zinc-400">
                                        {post.author.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-zinc-100">{post.author.username}</p>
                                    <p className="text-xs text-zinc-500">
                                        {new Date(post.createdAt).toLocaleString('es-AR', {
                                            dateStyle: 'short',
                                            timeStyle: 'short',
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1">
                                    {post.type}
                                </span>
                                {post.assetSymbol && (
                                    <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1">
                                        {post.assetSymbol}
                                    </span>
                                )}
                                <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1">
                                    ID {post.id.slice(0, 8)}
                                </span>
                            </div>

                            <p className="min-h-24 rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-3 text-sm leading-relaxed text-zinc-300">
                                {post.content || <span className="italic text-zinc-500">Sin texto. Post de media o chart.</span>}
                            </p>

                            <div className="flex items-center justify-between gap-4 text-xs font-medium text-zinc-500">
                                <div className="flex flex-wrap gap-3">
                                    <span>Likes {post._count.likes}</span>
                                    <span>Comentarios {post._count.comments}</span>
                                    <span className={post._count.reports > 0 ? 'text-red-300' : ''}>
                                        Reportes {post._count.reports}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-auto grid gap-2 sm:grid-cols-3">
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handlePatchAction(
                                        post.id,
                                        { visibility: post.visibility === 'HIDDEN' ? 'VISIBLE' : 'HIDDEN' },
                                        post.visibility === 'HIDDEN'
                                            ? `La publicación ${post.id.slice(0, 8)} volvió a visible.`
                                            : `La publicación ${post.id.slice(0, 8)} quedó oculta.`,
                                        post.visibility === 'HIDDEN'
                                            ? '¿Volver a mostrar esta publicación?'
                                            : '¿Ocultar esta publicación?',
                                    )}
                                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                        post.visibility === 'HIDDEN'
                                            ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                                            : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                                    }`}
                                >
                                    {post.visibility === 'HIDDEN' ? 'Mostrar' : 'Ocultar'}
                                </button>

                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handlePatchAction(
                                        post.id,
                                        { deleted: true },
                                        `La publicación ${post.id.slice(0, 8)} fue borrada del feed.`,
                                        '¿Borrar esta publicación del feed? Podrás auditar la acción luego.',
                                    )}
                                    className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Borrado logico
                                </button>

                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handlePermanentDelete(post)}
                                    className="rounded-xl bg-red-700/10 px-3 py-2 text-xs font-semibold text-red-200 transition-colors hover:bg-red-700/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Eliminar para siempre
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>

            {posts.length === 0 && !loading && (
                <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900 py-12 text-center text-zinc-500">
                    No hay publicaciones que coincidan con los filtros.
                </div>
            )}

            {loading && (
                <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900 py-12 text-center text-zinc-500">
                    Cargando publicaciones...
                </div>
            )}

            <div className="flex flex-col gap-3 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                <p>
                    Página {page} de {totalPages}. Total: {total.toLocaleString()} publicaciones.
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}
