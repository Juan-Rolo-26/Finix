import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { subscribePortfolioUpdates } from '@/lib/portfolioUpdates';
import type { PortfolioData, PortfolioMetricsData, PortfolioMovement } from './types';

interface Snapshot {
    owner: string;
    portfolios: PortfolioData[];
    id: string | null;
    metrics: PortfolioMetricsData | null;
    movements: PortfolioMovement[];
    updatedAt: number | null;
}

export function useProfilePortfolio(userId: string, own: boolean, visible: boolean) {
    const owner = JSON.stringify([userId, own]);
    const enabled = own || visible;
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [status, setStatus] = useState({ owner: '', refreshing: false, error: '' });
    const [selection, setSelection] = useState<{ owner: string; id: string } | null>(null);
    const refreshRef = useRef<() => void>(() => {});
    const selectedId = selection?.owner === owner ? selection.id : null;

    useEffect(() => {
        if (!enabled) return;
        const controller = new AbortController();
        let inFlight = false;
        const load = async () => {
            if (inFlight || controller.signal.aborted || document.visibilityState === 'hidden') return;
            inFlight = true;
            setStatus({ owner, refreshing: true, error: '' });
            try {
                const prefix = own ? '/portfolios' : '/portfolios/public/portfolio';
                const listResponse = await apiFetch(own ? '/portfolios' : `/portfolios/public/${userId}`, { signal: controller.signal, cache: 'no-store' });
                if (!listResponse.ok) throw new Error(String(listResponse.status));
                const list: PortfolioData[] = await listResponse.json();
                if (!Array.isArray(list)) throw new Error('Invalid portfolio list');
                const chosen = list.find(p => p.id === selectedId) ?? list.find(p => p.esPrincipal) ?? list[0];
                let metrics: PortfolioMetricsData | null = null;
                let movements: PortfolioMovement[] = [];
                if (chosen) {
                    const [metricsResponse, movementsResponse] = await Promise.all([
                        apiFetch(`${prefix}/${chosen.id}/metrics`, { signal: controller.signal, cache: 'no-store' }),
                        apiFetch(`${prefix}/${chosen.id}/movements?limit=6`, { signal: controller.signal, cache: 'no-store' }),
                    ]);
                    if (!metricsResponse.ok || !movementsResponse.ok) throw new Error(String(!metricsResponse.ok ? metricsResponse.status : movementsResponse.status));
                    metrics = await metricsResponse.json();
                    const items = await movementsResponse.json();
                    movements = Array.isArray(items) ? items.slice(0, 6) : [];
                }
                if (controller.signal.aborted) return;
                if (selectedId && !list.some(p => p.id === selectedId) && chosen) setSelection({ owner, id: chosen.id });
                setSnapshot({ owner, portfolios: list, id: chosen?.id ?? null, metrics, movements, updatedAt: Date.now() });
                setStatus({ owner, refreshing: false, error: '' });
            } catch (error) {
                if (controller.signal.aborted) return;
                // A revoked public portfolio must disappear even when a previous
                // measurement was available. Temporary outages keep the snapshot.
                const denied = error instanceof Error && ['401', '403', '404'].includes(error.message);
                if (denied) setSnapshot(null);
                setStatus({ owner, refreshing: false, error: denied ? 'Este portafolio ya no está disponible.' : 'No se pudieron actualizar los datos. Se conserva la última medición y se volverá a intentar.' });
            } finally {
                inFlight = false;
            }
        };
        const refresh = () => { void load(); };
        refreshRef.current = refresh;
        refresh();
        const timer = window.setInterval(refresh, 60000);
        window.addEventListener('focus', refresh);
        window.addEventListener('online', refresh);
        document.addEventListener('visibilitychange', refresh);
        const unsubscribe = subscribePortfolioUpdates(refresh);
        return () => {
            controller.abort();
            window.clearInterval(timer);
            window.removeEventListener('focus', refresh);
            window.removeEventListener('online', refresh);
            document.removeEventListener('visibilitychange', refresh);
            unsubscribe();
            refreshRef.current = () => {};
        };
    }, [owner, userId, own, enabled, selectedId]);

    const current = enabled && snapshot?.owner === owner ? snapshot : null;
    const samePortfolio = !selectedId || current?.id === selectedId;
    const currentStatus = status.owner === owner ? status : null;
    return {
        portfolios: current?.portfolios ?? [],
        selectedId: selectedId ?? current?.id ?? null,
        selected: current?.portfolios.find(p => p.id === (selectedId ?? current.id)) ?? null,
        metrics: samePortfolio ? current?.metrics ?? null : null,
        movements: samePortfolio ? current?.movements ?? [] : [],
        updatedAt: samePortfolio ? current?.updatedAt ?? null : null,
        loading: enabled && !current && !currentStatus?.error,
        refreshing: currentStatus?.refreshing ?? false,
        error: currentStatus?.error ?? '',
        selectPortfolio: (id: string) => setSelection({ owner, id }),
        refresh: () => refreshRef.current(),
    };
}
