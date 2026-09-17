export type DrawingType =
    | 'trendline'
    | 'horizontal_line'
    | 'vertical_line'
    | 'ray'
    | 'fibonacci'
    | 'rectangle'
    | 'channel'
    | 'text';

export interface FinixChartPoint {
    time: number; // epoch timestamp in seconds
    price: number;
}

export interface FibLevel {
    level: number;
    color: string;
    price?: number;
}

export interface FinixDrawingStyle {
    color: string;
    lineWidth?: number;
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    fillColor?: string;
    opacity?: number;
    text?: string;
    fontSize?: number;
    fibLevels?: FibLevel[];
}

export interface FinixDrawing {
    id: string;
    type: DrawingType;
    points: FinixChartPoint[];
    style: FinixDrawingStyle;
    locked?: boolean;
    name?: string;
}

export interface FinixChartState {
    symbol: string;
    exchange?: string;
    timeframe: string;
    visibleRange?: { from: number; to: number };
    drawings: FinixDrawing[];
    indicators?: Array<{ id: string; name: string; params?: Record<string, any> }>;
    theme?: 'dark' | 'light';
}

export interface ChartAnalysisEntity {
    id: string;
    userId: string;
    title: string;
    description?: string | null;
    symbol: string;
    exchange?: string | null;
    timeframe: string;
    chartState: FinixChartState;
    isPublic: boolean;
    forkedFromId?: string | null;
    forkedFrom?: {
        id: string;
        title: string;
        user?: { username: string };
    } | null;
    user?: {
        id: string;
        username: string;
        avatarUrl?: string | null;
        accountType?: string;
        isVerified?: boolean;
    };
    createdAt: string;
    updatedAt: string;
}

export interface ChartAnalysisVersionEntity {
    id: string;
    analysisId: string;
    versionNumber: number;
    chartState: FinixChartState;
    analysis?: {
        id: string;
        title: string;
        symbol: string;
        exchange?: string | null;
        timeframe: string;
        userId: string;
        user?: {
            id: string;
            username: string;
            avatarUrl?: string | null;
            isVerified?: boolean;
        };
    };
    createdAt: string;
}

export interface CandleData {
    time: number; // Unix timestamp in seconds
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}
