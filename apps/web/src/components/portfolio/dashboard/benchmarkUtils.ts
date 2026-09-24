import type { ComparisonDatum } from './mockData';

/**
 * Convierte una serie de cartera y benchmark ya obtenida desde la API en una
 * serie común con base 100. No genera datos de mercado: si SPY no está
 * disponible, el valor queda ausente para que la interfaz lo indique.
 */
export function buildBenchmarkComparisonSeries({
    apiSeries = [],
    hasHoldings = true,
}: {
    apiSeries?: Array<{ date: string; portfolio?: number; value?: number; sp500?: number }>;
    hasHoldings?: boolean;
}): ComparisonDatum[] {
    if (!hasHoldings || !Array.isArray(apiSeries)) {
        return [];
    }

    const validSeries = apiSeries
        .map((point) => ({
            date: String(point.date || ''),
            portfolio: Number(point.portfolio ?? point.value),
            sp500: point.sp500 == null ? undefined : Number(point.sp500),
        }))
        .filter((point) => point.date && Number.isFinite(point.portfolio) && point.portfolio > 0);

    if (!validSeries.length) {
        return [];
    }

    const firstPortfolio = validSeries[0].portfolio;
    const firstSp500 = validSeries.find((point) => typeof point.sp500 === 'number' && Number.isFinite(point.sp500) && point.sp500 > 0)?.sp500;

    return validSeries.map((point) => ({
        date: point.date,
        portfolio: Number(((point.portfolio / firstPortfolio) * 100).toFixed(2)),
        ...(typeof firstSp500 === 'number' && typeof point.sp500 === 'number' && Number.isFinite(point.sp500)
            ? { sp500: Number(((point.sp500 / firstSp500) * 100).toFixed(2)) }
            : {}),
    }));
}
