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

export const mockPortfolioValueByRange: Record<TimeRange, PortfolioValuePoint[]> = {
    '1D': [
        { date: '09:30', portfolio: 14820, sp500: 14760 },
        { date: '10:30', portfolio: 14910, sp500: 14820 },
        { date: '11:30', portfolio: 14980, sp500: 14870 },
        { date: '13:00', portfolio: 15060, sp500: 14910 },
        { date: '14:30', portfolio: 15120, sp500: 14960 },
        { date: '16:00', portfolio: 15080, sp500: 14920 },
    ],
    '1W': [
        { date: 'Lun', portfolio: 14540, sp500: 14480 },
        { date: 'Mar', portfolio: 14680, sp500: 14530 },
        { date: 'Mie', portfolio: 14820, sp500: 14640 },
        { date: 'Jue', portfolio: 14980, sp500: 14710 },
        { date: 'Vie', portfolio: 15080, sp500: 14810 },
    ],
    '1M': [
        { date: 'Sem 1', portfolio: 13920, sp500: 13880 },
        { date: 'Sem 2', portfolio: 14160, sp500: 13990 },
        { date: 'Sem 3', portfolio: 14540, sp500: 14130 },
        { date: 'Sem 4', portfolio: 14780, sp500: 14240 },
        { date: 'Sem 5', portfolio: 15080, sp500: 14410 },
    ],
    '3M': [
        { date: 'Ene', portfolio: 13200, sp500: 12940 },
        { date: 'Feb', portfolio: 13640, sp500: 13160 },
        { date: 'Mar', portfolio: 14120, sp500: 13440 },
        { date: 'Abr', portfolio: 14560, sp500: 13780 },
        { date: 'May', portfolio: 14940, sp500: 14080 },
        { date: 'Jun', portfolio: 15080, sp500: 14320 },
    ],
    '1Y': [
        { date: 'Ene', portfolio: 12000, sp500: 11800 },
        { date: 'Feb', portfolio: 12500, sp500: 11950 },
        { date: 'Mar', portfolio: 13200, sp500: 12200 },
        { date: 'Abr', portfolio: 14000, sp500: 12600 },
        { date: 'May', portfolio: 15000, sp500: 13000 },
    ],
    ALL: [
        { date: '2021', portfolio: 8200, sp500: 8000 },
        { date: '2022', portfolio: 9600, sp500: 8700 },
        { date: '2023', portfolio: 11200, sp500: 9600 },
        { date: '2024', portfolio: 12800, sp500: 10350 },
        { date: '2025', portfolio: 14100, sp500: 11020 },
        { date: '2026', portfolio: 15000, sp500: 11650 },
    ],
};

export const mockAllocation: AllocationDatum[] = [
    { name: 'Acciones', value: 45 },
    { name: 'Cripto', value: 25 },
    { name: 'ETFs', value: 20 },
    { name: 'Efectivo', value: 10 },
];

export const mockAssetPerformance: AssetPerformanceDatum[] = [
    { asset: 'AAPL', return: 12, contribution: 4.1, weight: 21 },
    { asset: 'BTC', return: 8, contribution: 2.8, weight: 17 },
    { asset: 'TSLA', return: -3, contribution: -0.7, weight: 11 },
    { asset: 'NVDA', return: 22, contribution: 6.2, weight: 26 },
    { asset: 'ETH', return: 5, contribution: 1.3, weight: 9 },
];

export const mockComparisonByRange: Record<TimeRange, ComparisonDatum[]> = {
    '1D': [
        { date: '09:30', portfolio: 100, sp500: 100 },
        { date: '10:30', portfolio: 100.4, sp500: 100.1 },
        { date: '11:30', portfolio: 100.9, sp500: 100.4 },
        { date: '13:00', portfolio: 101.3, sp500: 100.6 },
        { date: '14:30', portfolio: 101.8, sp500: 100.9 },
        { date: '16:00', portfolio: 101.5, sp500: 101.1 },
    ],
    '1W': [
        { date: 'Lun', portfolio: 100, sp500: 100 },
        { date: 'Mar', portfolio: 101.1, sp500: 100.4 },
        { date: 'Mie', portfolio: 102.2, sp500: 101.1 },
        { date: 'Jue', portfolio: 103.1, sp500: 101.5 },
        { date: 'Vie', portfolio: 103.7, sp500: 102.2 },
    ],
    '1M': [
        { date: 'Sem 1', portfolio: 100, sp500: 100 },
        { date: 'Sem 2', portfolio: 101.7, sp500: 100.8 },
        { date: 'Sem 3', portfolio: 103.9, sp500: 101.9 },
        { date: 'Sem 4', portfolio: 105.6, sp500: 102.7 },
        { date: 'Sem 5', portfolio: 108.3, sp500: 103.9 },
    ],
    '3M': [
        { date: 'Ene', portfolio: 100, sp500: 100 },
        { date: 'Feb', portfolio: 103.2, sp500: 101.5 },
        { date: 'Mar', portfolio: 106.9, sp500: 103.2 },
        { date: 'Abr', portfolio: 110.3, sp500: 105.1 },
        { date: 'May', portfolio: 113.1, sp500: 106.8 },
        { date: 'Jun', portfolio: 114.2, sp500: 108.1 },
    ],
    '1Y': [
        { date: 'Ene', portfolio: 100, sp500: 100 },
        { date: 'Feb', portfolio: 105, sp500: 101 },
        { date: 'Mar', portfolio: 110, sp500: 104 },
        { date: 'Abr', portfolio: 118, sp500: 108 },
        { date: 'May', portfolio: 125, sp500: 112 },
    ],
    ALL: [
        { date: '2021', portfolio: 100, sp500: 100 },
        { date: '2022', portfolio: 117, sp500: 108 },
        { date: '2023', portfolio: 137, sp500: 120 },
        { date: '2024', portfolio: 156, sp500: 129 },
        { date: '2025', portfolio: 172, sp500: 138 },
        { date: '2026', portfolio: 183, sp500: 146 },
    ],
};

export const mockSectors: SectorDatum[] = [
    { name: 'Tecnologia', size: 40 },
    { name: 'Finanzas', size: 20 },
    { name: 'Salud', size: 15 },
    { name: 'Energia', size: 15 },
    { name: 'Consumo', size: 10 },
];

export const mockPortfolioDashboardData: PortfolioDashboardData = {
    portfolioValueByRange: mockPortfolioValueByRange,
    allocation: mockAllocation,
    assetPerformance: mockAssetPerformance,
    comparisonByRange: mockComparisonByRange,
    sectors: mockSectors,
};
