import { apiFetch } from '../api';
import {
    FinixChartState,
    ChartAnalysisEntity,
    ChartAnalysisVersionEntity,
    CandleData,
} from './finix-chart-types';

export async function fetchChartCandles(
    symbol: string,
    interval: string = '1d',
    range: string = '1y'
): Promise<CandleData[]> {
    try {
        const res = await apiFetch(`/market/candles?symbol=${encodeURIComponent(symbol)}&interval=${interval}&range=${range}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data?.candles || [];
    } catch (err) {
        console.warn(`[finix-chart-api] Failed to fetch candles for ${symbol}:`, err);
        return [];
    }
}

export async function createChartAnalysis(data: {
    symbol: string;
    exchange?: string;
    timeframe: string;
    title?: string;
    description?: string;
    chartState: FinixChartState;
    isPublic?: boolean;
}): Promise<ChartAnalysisEntity> {
    const res = await apiFetch('/chart-analysis', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || 'Error al crear análisis');
    }
    return res.json();
}

export async function getUserChartAnalyses(query?: {
    symbol?: string;
    limit?: number;
}): Promise<ChartAnalysisEntity[]> {
    const params = new URLSearchParams();
    if (query?.symbol) params.set('symbol', query.symbol);
    if (query?.limit) params.set('limit', String(query.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`/chart-analysis${qs}`);
    if (!res.ok) return [];
    return res.json();
}

export async function getChartAnalysis(id: string): Promise<ChartAnalysisEntity> {
    const res = await apiFetch(`/chart-analysis/${id}`);
    if (!res.ok) throw new Error('Análisis no encontrado');
    return res.json();
}

export async function updateChartAnalysis(
    id: string,
    data: {
        title?: string;
        description?: string;
        symbol?: string;
        exchange?: string;
        timeframe?: string;
        chartState?: FinixChartState;
        isPublic?: boolean;
    }
): Promise<ChartAnalysisEntity> {
    const res = await apiFetch(`/chart-analysis/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Error al actualizar análisis');
    }
    return res.json();
}

export async function deleteChartAnalysis(id: string): Promise<{ success: boolean }> {
    const res = await apiFetch(`/chart-analysis/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar análisis');
    return res.json();
}

export async function createChartVersion(
    analysisId: string,
    chartState?: FinixChartState
): Promise<ChartAnalysisVersionEntity> {
    const res = await apiFetch(`/chart-analysis/${analysisId}/version`, {
        method: 'POST',
        body: JSON.stringify({ chartState }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Error al congelar versión del análisis');
    }
    return res.json();
}

export async function getChartVersion(versionId: string): Promise<ChartAnalysisVersionEntity> {
    const res = await apiFetch(`/chart-analysis/version/${versionId}`);
    if (!res.ok) throw new Error('Versión no encontrada');
    return res.json();
}

export async function forkChartAnalysis(
    analysisId: string,
    newTitle?: string
): Promise<ChartAnalysisEntity> {
    const res = await apiFetch(`/chart-analysis/${analysisId}/fork`, {
        method: 'POST',
        body: JSON.stringify({ newTitle }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Error al copiar análisis');
    }
    return res.json();
}
