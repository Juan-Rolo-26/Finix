export const TIME_RANGES = ['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const;

export type TimeRange = (typeof TIME_RANGES)[number];

export interface PortfolioValuePoint {
    date: string;
    portfolio: number;
    sp500: number;
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
    sp500: number;
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

