import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { normalizeWatchlistHistory, watchlistChartSymbol, type WatchlistHistory } from './watchlistData';

export function useWatchlistHistory(items: any[], revision: number) {
    const symbolsKey = JSON.stringify([...new Set(items.map(watchlistChartSymbol))].sort());
    const [result, setResult] = useState<{ key: string; histories: Record<string, WatchlistHistory> }>({ key: '', histories: {} });
    useEffect(() => {
        const symbols: string[] = JSON.parse(symbolsKey);
        const controller = new AbortController();
        let running = false;
        const load = async () => {
            if (running || controller.signal.aborted || document.visibilityState === 'hidden') return;
            running = true;
            let index = 0;
            const worker = async () => {
                while (index < symbols.length && !controller.signal.aborted) {
                    const symbol = symbols[index++];
                    setResult(previous => ({ key: symbolsKey, histories: { ...(previous.key === symbolsKey ? previous.histories : {}),
                        [symbol]: { points: previous.key === symbolsKey ? previous.histories[symbol]?.points || [] : [], loading: true, error: false } } }));
                    try {
                        const params = new URLSearchParams({ symbol, interval: '1d', range: '3mo' });
                        const response = await apiFetch(`/market/candles?${params}`, { signal: controller.signal });
                        if (!response.ok) throw new Error('No se pudo cargar el historial');
                        const data = await response.json();
                        if (controller.signal.aborted) return;
                        const points = normalizeWatchlistHistory(data?.candles);
                        setResult(previous => ({ key: symbolsKey, histories: { ...previous.histories, [symbol]: { points, loading: false, error: false } } }));
                    } catch {
                        if (controller.signal.aborted) return;
                        setResult(previous => ({ key: symbolsKey, histories: { ...previous.histories,
                            [symbol]: { points: previous.histories[symbol]?.points || [], loading: false, error: true } } }));
                    }
                }
            };
            await Promise.all(Array.from({ length: Math.min(4, symbols.length) }, worker));
            running = false;
        };
        void load();
        const timer = window.setInterval(() => void load(), 60000);
        const refresh = () => void load();
        window.addEventListener('focus', refresh);
        window.addEventListener('online', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', refresh); };
    }, [symbolsKey, revision]);
    return result.key === symbolsKey ? result.histories : {};
}
