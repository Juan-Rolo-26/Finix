export const TIME_RANGES = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', 'ALL'] as const;

export type TimeRange = (typeof TIME_RANGES)[number];

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
    '1D': '1 día',
    '1W': '1 semana',
    '1M': '1 mes',
    '3M': '3 meses',
    '6M': '6 meses',
    YTD: 'Año actual',
    '1Y': '1 año',
    ALL: 'Desde la primera operación',
};

export const TIME_RANGE_SHORT_LABELS: Record<TimeRange, string> = {
    '1D': '1D',
    '1W': '1S',
    '1M': '1M',
    '3M': '3M',
    '6M': '6M',
    YTD: 'YTD',
    '1Y': '1A',
    ALL: 'Inicio',
};

export interface PortfolioValuePoint {
    date: string;
    portfolio: number;
    sp500?: number;
}

export interface AllocationDatum {
    name: string;
    value: number;
}

export interface AssetPerformanceDatum {
    asset: string;
    return: number;
    contribution: number;
    weight: number;
}

export interface ComparisonDatum {
    date: string;
    portfolio: number;
    sp500?: number;
}

export interface SectorDatum {
    name: string;
    size: number;
}

export interface PortfolioDashboardData {
    portfolioValueByRange: Record<TimeRange, PortfolioValuePoint[]>;
    allocation: AllocationDatum[];
    assetPerformance: AssetPerformanceDatum[];
    comparisonByRange: Record<TimeRange, ComparisonDatum[]>;
    sectors: SectorDatum[];
}
