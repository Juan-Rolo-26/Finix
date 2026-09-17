import React from 'react';
import TradingViewChart from '../TradingViewChart';
import type { FinixChartState } from '@/lib/chart/finix-chart-types';

export interface FinixTechnicalChartProps {
    symbol?: string;
    timeframe?: string;
    initialState?: FinixChartState;
    analysisId?: string;
    readOnly?: boolean;
    height?: number;
    onSave?: (state: FinixChartState) => void;
    onFork?: () => void;
    className?: string;
}

/**
 * Universal TradingView wrapper replacing all legacy custom canvas charts across the platform.
 * Always renders official TradingView widgets with full drawing extensions and technical indicators.
 */
export const FinixTechnicalChart: React.FC<FinixTechnicalChartProps> = ({
    symbol = 'AAPL',
    timeframe = 'D',
    height = 500,
    className,
}) => {
    return (
        <div className={className}>
            <TradingViewChart
                symbol={symbol}
                interval={timeframe}
                height={height}
            />
        </div>
    );
};

export default FinixTechnicalChart;
