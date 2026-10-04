import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

// Refresh when the portfolio list brings new holdings, even for the same ID.
// Keep results scoped to their ID so a late response cannot mix two portfolios.
export function usePortfolioDetails<M, T>(portfolio: { id: string } | null) {
    const [state, setState] = useState<{ id: string; metrics: M | null; movements: T[] } | null>(null);
    useEffect(() => {
        if (!portfolio) return;
        const controller = new AbortController();
        const id = portfolio.id;
        void (async () => {
            const results = await Promise.allSettled([
                apiFetch(`/portfolios/${id}/metrics`, { signal: controller.signal, cache: 'no-store' }).then(async r => {
                    if (!r.ok) throw new Error(String(r.status));
                    return await r.json() as M;
                }),
                apiFetch(`/portfolios/${id}/movements`, { signal: controller.signal, cache: 'no-store' }).then(async r => {
                    if (!r.ok) throw new Error(String(r.status));
                    const data = await r.json();
                    return Array.isArray(data) ? data as T[] : [];
                }),
            ]);
            if (controller.signal.aborted) return;
            setState(previous => {
                const denied = results.some(result => result.status === 'rejected' && result.reason instanceof Error && ['401', '403', '404'].includes(result.reason.message));
                if (denied) return null;
                const current = previous?.id === id ? previous : null;
                return {
                    id,
                    metrics: results[0].status === 'fulfilled' ? results[0].value : current?.metrics ?? null,
                    movements: results[1].status === 'fulfilled' ? results[1].value : current?.movements ?? [],
                };
            });
        })();
        return () => controller.abort();
    }, [portfolio]);
    const current = state?.id === portfolio?.id ? state : null;
    return { metrics: current?.metrics ?? null, movements: current?.movements ?? [] };
}
