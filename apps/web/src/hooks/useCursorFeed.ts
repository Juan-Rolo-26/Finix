import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

type Page = { posts: any[]; nextCursor: string | null; hasMore: boolean; fetchedAt: number };
const pages = new Map<string, Page>();
function cached(key: string) {
    const page = pages.get(key);
    if (page && Date.now() - page.fetchedAt < 15000) return page;
    pages.delete(key);
    return undefined;
}
function remember(key: string, page: Page) {
    pages.delete(key);
    pages.set(key, { ...page, posts: page.posts.slice(0, 20) });
    while (pages.size > 12) pages.delete(pages.keys().next().value!);
}

export function useCursorFeed(owner: string | undefined, sort: string) {
    const token = useAuthStore(state => state.token);
    const key = `${owner || (token ? `session:${token}` : 'anon')}:${sort}`;
    const [revision, setRevision] = useState(0);
    const [page, setPage] = useState<Page>(() => cached(key) ?? { posts: [], nextCursor: null, hasMore: false, fetchedAt: 0 });
    const [isLoading, setLoading] = useState(!cached(key));
    const [isLoadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const active = useRef(key);
    const pending = useRef<AbortController | null>(null);
    const [displayKey, setDisplayKey] = useState(key);

    useEffect(() => {
        active.current = key;
        pending.current?.abort();
        pending.current = null;
        const previous = cached(key);
        setDisplayKey(key);
        setPage(previous ?? { posts: [], nextCursor: null, hasMore: false, fetchedAt: 0 });
        setLoading(!previous);
        setLoadingMore(false);
        setError(null);
        const controller = new AbortController();
        void apiFetch(`/posts/feed?sort=${sort}&limit=20`, { signal: controller.signal }).then(async res => {
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            if (controller.signal.aborted) return;
            const next = { posts: Array.isArray(data) ? data : data.posts ?? [], nextCursor: data.nextCursor ?? null, hasMore: data.hasMore === true, fetchedAt: Date.now() };
            remember(key, next);
            setPage(next);
        }).catch(error => {
            if (!controller.signal.aborted && error instanceof Error && ['401', '403'].includes(error.message)) {
                pages.delete(key);
                setPage({ posts: [], nextCursor: null, hasMore: false, fetchedAt: 0 });
            }
            if (!controller.signal.aborted) setError('No se pudieron cargar las publicaciones.');
        }).finally(() => {
            if (!controller.signal.aborted) setLoading(false);
        });
        return () => { controller.abort(); pending.current?.abort(); };
    }, [key, sort, revision]);

    const loadMore = useCallback(async () => {
        if (active.current !== key || pending.current || isLoading || !page.hasMore || !page.nextCursor) return;
        const controller = new AbortController();
        pending.current = controller;
        setLoadingMore(true);
        setError(null);
        try {
            const res = await apiFetch(`/posts/feed?sort=${sort}&limit=20&cursor=${encodeURIComponent(page.nextCursor)}`, { signal: controller.signal });
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            if (controller.signal.aborted || active.current !== key) return;
            setPage(previous => {
                const ids = new Set(previous.posts.map(post => post.id));
                return { posts: [...previous.posts, ...(data.posts ?? []).filter((post: any) => !ids.has(post.id))], nextCursor: data.nextCursor ?? null, hasMore: data.hasMore === true, fetchedAt: previous.fetchedAt };
            });
        } catch (error) {
            if (!controller.signal.aborted && error instanceof Error && ['401', '403'].includes(error.message)) {
                pages.delete(key);
                setPage({ posts: [], nextCursor: null, hasMore: false, fetchedAt: 0 });
            }
            if (!controller.signal.aborted) setError('No se pudieron cargar más publicaciones. Reintentá.');
        } finally {
            if (pending.current === controller) {
                pending.current = null;
                setLoadingMore(false);
            }
        }
    }, [key, sort, isLoading, page.hasMore, page.nextCursor]);

    const sentinel = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!sentinel.current || error || !page.hasMore || isLoading || isLoadingMore) return;
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) void loadMore();
        }, { rootMargin: '200px' });
        observer.observe(sentinel.current);
        return () => observer.disconnect();
    }, [loadMore, page.hasMore, isLoading, isLoadingMore, error]);

    const prepend = useCallback((post: any) => {
        pages.delete(key);
        setPage(previous => ({ ...previous, posts: [post, ...previous.posts.filter(item => item.id !== post.id)] }));
    }, [key]);
    // Never flash a previous account/tab while the new effect is waiting to run.
    return { posts: displayKey === key ? page.posts : [], isLoading: displayKey !== key || isLoading, isLoadingMore, hasMore: displayKey === key && page.hasMore, error, loadMore, retry: () => setRevision(previous => previous + 1), prepend, sentinel };
}
