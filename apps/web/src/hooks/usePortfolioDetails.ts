import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

type Details<M, T> = { id: string; owner: string; metrics: M | null; movements: T[]; nextCursor: string | null; hasMore: boolean };

// Metrics and the first activity page render independently. Full ledgers stay on
// the server for valuation; the browser asks for additional rows only on demand.
export function usePortfolioDetails<M, T extends { id: string }>(portfolio: { id: string } | null) {
    const owner = useAuthStore(state => state.user?.id) || 'anon';
    const [state, setState] = useState<Details<M, T> | null>(null);
    const [movementError, setMovementError] = useState('');
    const [isLoadingMore, setLoadingMore] = useState(false);
    const pending = useRef<AbortController | null>(null);
    const id = portfolio?.id;
    useEffect(() => {
        if (!portfolio) return;
        const controller = new AbortController();
        pending.current?.abort();
        pending.current = null;
        setLoadingMore(false);
        setMovementError('');
        const id = portfolio.id;
        const update = (patch: Partial<Details<M, T>>) => {
            if (controller.signal.aborted) return;
            setState(previous => ({ ...(previous?.id === id && previous.owner === owner ? previous : { id, owner, metrics: null, movements: [], nextCursor: null, hasMore: false }), ...patch }));
        };
        const failed = (error: unknown) => {
            if (controller.signal.aborted) return;
            if (error instanceof Error && ['401', '403', '404'].includes(error.message)) {
                setState(null);
                controller.abort();
            } else setMovementError('No se pudieron actualizar los datos. Reintentá.');
        };
        void apiFetch(`/portfolios/${id}/metrics`, { signal: controller.signal }).then(async res => {
            if (!res.ok) throw new Error(String(res.status));
            update({ metrics: await res.json() as M });
        }).catch(failed);
        void apiFetch(`/portfolios/${id}/movements?limit=12&pagination=true`, { signal: controller.signal }).then(async res => {
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            update({ movements: Array.isArray(data) ? data : data.movements ?? [], nextCursor: data.nextCursor ?? null, hasMore: data.hasMore === true });
        }).catch(failed);
        return () => { controller.abort(); pending.current?.abort(); pending.current = null; };
    }, [portfolio, owner]);
    const current = state?.id === id && state?.owner === owner ? state : null;
    const loadMoreMovements = useCallback(async () => {
        if (!id || !current?.hasMore || !current.nextCursor || pending.current) return;
        const controller = new AbortController();
        pending.current = controller;
        setLoadingMore(true);
        setMovementError('');
        try {
            const res = await apiFetch(`/portfolios/${id}/movements?limit=12&pagination=true&cursor=${encodeURIComponent(current.nextCursor)}`, { signal: controller.signal });
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            if (controller.signal.aborted) return;
            setState(previous => {
                if (previous?.id !== id || previous.owner !== owner) return previous;
                const ids = new Set(previous.movements.map(item => item.id));
                return { ...previous, movements: [...previous.movements, ...(data.movements ?? []).filter((item: T) => !ids.has(item.id))], nextCursor: data.nextCursor ?? null, hasMore: data.hasMore === true };
            });
        } catch (error) {
            if (controller.signal.aborted) return;
            if (error instanceof Error && ['401', '403', '404'].includes(error.message)) setState(null);
            setMovementError('No se pudieron cargar más movimientos. Reintentá.');
        } finally {
            if (pending.current === controller) { pending.current = null; setLoadingMore(false); }
        }
    }, [id, owner, current]);
    return { metrics: current?.metrics ?? null, movements: current?.movements ?? [], hasMoreMovements: current?.hasMore ?? false, loadMoreMovements, isLoadingMore, movementError };
}
