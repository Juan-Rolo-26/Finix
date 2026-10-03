import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { buildBenchmarkComparisonSeries } from './benchmarkUtils';
import type { ComparisonDatum, PortfolioValuePoint, TimeRange } from './mockData';

interface HistoryState {
    key: string;
    history: PortfolioValuePoint[];
    comparison: ComparisonDatum[];
    notice: string | null;
}

export function usePortfolioHistory(portfolioId: string | undefined, currency: string, range: TimeRange, revision: string) {
    const key = JSON.stringify([portfolioId, currency, range, revision]);
    const [state, setState] = useState<HistoryState | null>(null);

    useEffect(() => {
        if (!portfolioId) return;
        const controller = new AbortController();
        let inFlight = false;
        const load = async () => {
            if (inFlight || controller.signal.aborted || document.visibilityState === 'hidden') return;
            inFlight = true;
            try {
                // Both curves come from the same performance calculation.
                const response = await apiFetch(`/portfolios/${portfolioId}/benchmarks?range=${range}&benchmarks=sp500&currency=${encodeURIComponent(currency)}`, { signal: controller.signal });
                if (!response.ok) throw new Error('History unavailable');
                const benchmark = await response.json();
                if (controller.signal.aborted) return;
                const performance = benchmark.performance;
                if (!Array.isArray(performance?.series)) throw new Error('Invalid performance response');
                const history: PortfolioValuePoint[] = performance.series
                    .filter((point: any) => typeof point.value === 'number' && Number.isFinite(point.value) && point.value >= 0)
                    .map((point: any) => ({ date: String(point.date || ''), portfolio: point.value, returnPct: point.returnPct }))
                    .filter((point: PortfolioValuePoint) => Number.isFinite(Date.parse(point.date)));
                const comparison: ComparisonDatum[] = (Array.isArray(benchmark.series) ? benchmark.series : [])
                    .filter((point: any) => typeof point.portfolio === 'number' && Number.isFinite(point.portfolio) && point.portfolio >= 0 && Number.isFinite(Date.parse(point.date)))
                    .map((point: any) => ({ date: point.date, portfolio: point.portfolio,
                        ...(typeof point.sp500 === 'number' && Number.isFinite(point.sp500) && point.sp500 > 0 ? { sp500: point.sp500 } : {}),
                    }));
                const notices: string[] = [];
                if (performance.insufficientData) notices.push(performance.message || 'Datos insuficientes para el rango seleccionado.');
                else if (performance.startDate) {
                    const start = new Date(performance.startDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
                    notices.push(`Mediciones del período desde ${start}.`);
                }
                if (!benchmark.benchmarkAvailable) notices.push('SPY no tiene precios históricos suficientes para este período.');
                if (performance.valuationMessage) notices.push(performance.valuationMessage);
                setState({ key, history, comparison: performance.insufficientData ? [] : comparison.length ? comparison : buildBenchmarkComparisonSeries({ apiSeries: history }), notice: notices.join(' ') || null });
            } catch {
                if (controller.signal.aborted) return;
                setState(previous => ({ key, history: previous?.key === key ? previous.history : [], comparison: previous?.key === key ? previous.comparison : [],
                    notice: previous?.key === key && previous.comparison.length
                        ? 'No se pudo actualizar la comparación. Se conserva la última medición; se volverá a intentar automáticamente.'
                        : 'No se pudo cargar el historial real. Se volverá a intentar automáticamente.',
                }));
            } finally {
                inFlight = false;
            }
        };
        const refresh = () => { void load(); };
        refresh();
        const timer = window.setInterval(refresh, 60000);
        window.addEventListener('focus', refresh);
        window.addEventListener('online', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            controller.abort();
            window.clearInterval(timer);
            window.removeEventListener('focus', refresh);
            window.removeEventListener('online', refresh);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [currency, key, portfolioId, range]);

    const current = state?.key === key ? state : null;
    return { history: current?.history ?? [], comparison: current?.comparison ?? [], notice: current?.notice ?? null, loading: Boolean(portfolioId && !current) };
}
