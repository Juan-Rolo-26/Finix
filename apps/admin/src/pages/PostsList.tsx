import { FormEvent, useEffect, useState } from 'react';
import { adminFetch, readAdminErrorMessage } from '../lib/api';
import { AlertTriangle, EyeOff, FileText, RefreshCw, Search, Trash2 } from 'lucide-react';

type AdminPostRow = {
    id: string;
    content: string;
    visibility: string;
    type: string;
    assetSymbol?: string | null;
    media?: { url: string; mediaType: string }[] | null;
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
    const [typeFilter, setTypeFilter] = useState('');
    const [hasReportsFilter, setHasReportsFilter] = useState(false);
    const [authorFilter, setAuthorFilter] = useState('');
    const [submittedAuthor, setSubmittedAuthor] = useState('');
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
                if (submittedAuthor) {
                    params.set('author', submittedAuthor);
                }
                if (visibilityFilter) {
                    params.set('visibility', visibilityFilter);
                }
                if (typeFilter) {
                    params.set('type', typeFilter);
                }
                if (hasReportsFilter) {
                    params.set('hasReports', 'true');
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
    }, [page, refreshTick, submittedSearch, submittedAuthor, visibilityFilter, typeFilter, hasReportsFilter]);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFeedback(null);
        setPage(1);
        setSubmittedSearch(search.trim());
        setSubmittedAuthor(authorFilter.trim());
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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Publicaciones</h1>
                    <p className="text-sm text-muted-foreground">
                        Moderación rápida, ocultado, borrado lógico y eliminación permanente con auditoría.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
                    <form onSubmit={handleSearch} className="flex gap-2 relative w-full xl:w-auto">
                        <div className="relative w-full xl:w-64">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar en contenido..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="relative w-full xl:w-48">
                            <input
                                type="text"
                                placeholder="Autor (@username)"
                                value={authorFilter}
                                onChange={(event) => setAuthorFilter(event.target.value)}
                                className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <button type="submit" className="hidden" />
                    </form>

                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
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
                    <div key={card.label} className="rounded-2xl border border-border bg-card/90 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{card.label}</p>
                                <p className="mt-2 text-2xl font-bold text-foreground">{card.value.toLocaleString()}</p>
                            </div>
                            <div className={`rounded-2xl border p-3 ${card.tone}`}>
                                <card.icon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-border bg-card/80 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                    <label className="space-y-2 text-sm">
                        <span className="text-muted-foreground">Visibilidad</span>
                        <select
                            value={visibilityFilter}
                            onChange={(event) => {
                                setPage(1);
                                setVisibilityFilter(event.target.value);
                            }}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground focus:border-emerald-500 focus:outline-none"
                        >
                            <option value="">Todas</option>
                            <option value="VISIBLE">VISIBLE</option>
                            <option value="HIDDEN">HIDDEN</option>
                        </select>
                    </label>

                    <label className="space-y-2 text-sm">
                        <span className="text-muted-foreground">Tipo de publicación</span>
                        <select
                            value={typeFilter}
                            onChange={(event) => {
                                setPage(1);
                                setTypeFilter(event.target.value);
                            }}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground focus:border-emerald-500 focus:outline-none"
                        >
                            <option value="">Todos</option>
                            <option value="post">Texto/Normal</option>
                            <option value="image">Imagen</option>
                            <option value="reel">Video/Reel</option>
                            <option value="chart">TradingView</option>
                        </select>
                    </label>

                    <label className="flex items-center gap-2 text-sm mt-8 mr-4 cursor-pointer">
                        <input 
                            type="checkbox"
                            checked={hasReportsFilter}
                            onChange={(e) => {
                                setPage(1);
                                setHasReportsFilter(e.target.checked);
                            }}
                            className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="text-foreground">Solo con reportes</span>
                    </label>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setSubmittedSearch('');
                                setAuthorFilter('');
                                setSubmittedAuthor('');
                                setVisibilityFilter('');
                                setTypeFilter('');
                                setHasReportsFilter(false);
                                setPage(1);
                                setFeedback(null);
                                setRefreshTick((current) => current + 1);
                            }}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground/90 transition-colors hover:bg-secondary"
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
                            className="relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-border"
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
                                        className="h-10 w-10 rounded-full border border-border object-cover"
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-xs text-muted-foreground">
                                        {post.author.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-foreground">{post.author.username}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(post.createdAt).toLocaleString('es-AR', {
                                            dateStyle: 'short',
                                            timeStyle: 'short',
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                <span className="rounded-full border border-border bg-background px-2.5 py-1">
                                    {post.type}
                                </span>
                                {post.assetSymbol && (
                                    <span className="rounded-full border border-border bg-background px-2.5 py-1">
                                        {post.assetSymbol}
                                    </span>
                                )}
                                <span className="rounded-full border border-border bg-background px-2.5 py-1">
                                    ID {post.id.slice(0, 8)}
                                </span>
                            </div>

                            <p className="min-h-24 rounded-xl border border-border bg-background/50 p-3 text-sm leading-relaxed text-foreground/90">
                                {post.content || <span className="italic text-muted-foreground">Sin texto. Post de media o chart.</span>}
                            </p>

                            {/* Chart / media preview */}
                            {(post.type === 'chart' || post.type === 'image') && (() => {
                                const imgs = (post.media ?? []).filter(m => m.mediaType === 'image');
                                if (imgs.length > 0) {
                                    return (
                                        <div className={`grid gap-1.5 ${imgs.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                            {imgs.slice(0, 4).map((m, i) => (
                                                <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden bg-black/30">
                                                    <img src={m.url} alt="media" className="w-full max-h-52 object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    );
                                }
                                if (post.type === 'chart' && post.assetSymbol) {
                                    // Show a static TradingView mini-embed for the chart
                                    return (
                                        <div className="rounded-xl overflow-hidden border border-border/40" style={{ height: 220 }}>
                                            <iframe
                                                src={`https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(post.assetSymbol)}&interval=D&theme=dark&style=1&locale=es&hide_side_toolbar=1&allow_symbol_change=0&save_image=0&width=100%25&height=220`}
                                                className="w-full h-full border-0"
                                                allow="clipboard-write"
                                                title={`Chart ${post.assetSymbol}`}
                                            />
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <div className="flex items-center justify-between gap-4 text-xs font-medium text-muted-foreground">
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
                                            : 'bg-secondary text-foreground hover:bg-secondary/80'
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
                <div className="rounded-2xl border border-border bg-card py-12 text-center text-muted-foreground">
                    No hay publicaciones que coincidan con los filtros.
                </div>
            )}

            {loading && (
                <div className="rounded-2xl border border-border bg-card py-12 text-center text-muted-foreground">
                    Cargando publicaciones...
                </div>
            )}

            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                    Página {page} de {totalPages}. Total: {total.toLocaleString()} publicaciones.
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}
