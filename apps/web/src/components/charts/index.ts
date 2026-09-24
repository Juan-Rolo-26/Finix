/**
 * Finix Charts Library — Public API
 *
 * Import from '@/components/charts' for all chart components, utilities and types.
 */

// ── Shared components ──────────────────────────────────────────────────────────
export { ChartContainer } from './shared/ChartContainer';
export { ChartSkeleton } from './shared/ChartSkeleton';
export { ChartEmptyState } from './shared/ChartEmptyState';
export { ChartErrorState } from './shared/ChartErrorState';
export { ChartLegend } from './shared/ChartLegend';

// ── Financial charts (TradingView Lightweight Charts) ─────────────────────────
export { PortfolioPerformanceChart } from './financial/PortfolioPerformanceChart';
export { DrawdownChart } from './financial/DrawdownChart';

// ── Portfolio analytics charts ────────────────────────────────────────────────
export { AllocationDonut } from './portfolio/AllocationDonut';
export { PortfolioTreemap } from './portfolio/PortfolioTreemap';
export { AssetPnLChart } from './portfolio/AssetPnLChart';
export { MonthlyReturnsChart } from './portfolio/MonthlyReturnsChart';
export { ReturnsHeatmap } from './portfolio/ReturnsHeatmap';
export { RiskReturnChart } from './portfolio/RiskReturnChart';
export { DividendChart } from './portfolio/DividendChart';

// ── Utilities ─────────────────────────────────────────────────────────────────
export * from './utils/chartTheme';
export * from './utils/chartFormatters';
export * from './utils/chartDataAdapters';

// ── Types ─────────────────────────────────────────────────────────────────────
export type { ChartContainerProps } from './shared/ChartContainer';
export type { LegendItem } from './shared/ChartLegend';
