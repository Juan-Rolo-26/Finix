/**
 * portfolio-performance.service.ts
 *
 * Dedicated service for portfolio analytics calculations.
 * Handles: Summary, Performance series (TWR), Allocation, Sectors,
 * Monthly Returns, Drawdown, Dividends, Risk/Return, Benchmarks.
 *
 * Financial methodology:
 *  - Returns: Time-Weighted Return (TWR) — deposits don't inflate returns
 *  - Drawdown: peak-to-trough as % from rolling maximum
 *  - Volatility: annualized std dev of daily log returns × √252
 *  - Sharpe: (E[Rp] - Rf) / σ(Rp), Rf = 0 (ARS), 4.5% (USD)
 *  - CAGR: (VF/VI)^(1/years) - 1
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MarketService } from '../market/market.service';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PerformancePoint {
    date: string;
    value: number;
    returnPct: number;
    pnl: number;
    invested: number;
    dailyReturn?: number;
}

export interface PerformanceMarker {
    date: string;
    type: 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAW';
    ticker?: string;
    amount: number;
}

const RANGE_DAYS: Record<string, number> = {
    '1D': 1,
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '6M': 180,
    'YTD': 0,    // Calculated dynamically
    '1Y': 365,
    '3Y': 1095,
    '5Y': 1825,
    'ALL': 0,    // From first transaction
};

const MONTH_LABELS_ES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

@Injectable()
export class PortfolioPerformanceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly marketService: MarketService,
    ) { }

    // ── Auth helpers ────────────────────────────────────────────────────────────

    private async assertOwner(portfolioId: string, userId: string) {
        const p = await this.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
            select: { id: true },
        });
        if (!p) throw new NotFoundException('Portafolio no encontrado');
    }

    // ── Market helpers ──────────────────────────────────────────────────────────

    private normalizeTicker(t: string) {
        return String(t || '').trim().toUpperCase();
    }

    private async getLiveQuoteMap(holdings: any[]) {
        const symbols = new Set<string>();
        for (const h of holdings) {
            const t = this.normalizeTicker(h?.asset?.ticker || '');
            if (t) symbols.add(t);
        }
        if (!symbols.size) return new Map<string, any>();
        const quotes = await this.marketService.getQuotes([...symbols]).catch(() => []);
        const map = new Map<string, any>();
        for (const q of quotes) {
            if (q.inputSymbol) map.set(this.normalizeTicker(q.inputSymbol), q);
        }
        return map;
    }

    private getMarketHistoryRange(range: string) {
        switch (range) {
            case '1D': return '5d';
            case '1W': return '1mo';
            case '1M': return '3mo';
            case '3M': return '6mo';
            case '6M':
            case 'YTD': return '1y';
            case '1Y': return '2y';
            case 'ALL': return 'max';
            default: return '1y';
        }
    }

    private getMarketHistoryInterval(range: string) {
        return range === '1D' ? '1h' : '1d';
    }

    private async getHistoricalPriceMaps(tickers: string[], range: string) {
        const uniqueTickers = Array.from(new Set(tickers.map((ticker) => this.normalizeTicker(ticker)).filter(Boolean)));
        const yahooRange = this.getMarketHistoryRange(range);
        const interval = this.getMarketHistoryInterval(range);
        const histories = await Promise.all(
            uniqueTickers.map(async (ticker) => {
                const response = await this.marketService.getCandles(ticker, interval, yahooRange).catch(() => ({ candles: [] }));
                const candles = Array.isArray(response.candles)
                    ? response.candles
                        .map((c) => ({ time: Number(c.time), close: Number(c.close) }))
                        .filter((c) => Number.isFinite(c.time) && Number.isFinite(c.close) && c.close > 0)
                    : [];
                return [ticker, candles] as const;
            }),
        );

        return new Map(histories);
    }

    private getHistoricalPriceAtDate(
        candles: Array<{ time: number; close: number }> | undefined,
        cutoff: Date,
    ) {
        if (!candles?.length) return null;

        const cutoffSeconds = cutoff.getTime() / 1000;
        let latest: number | null = null;
        let firstAfter: number | null = null;

        for (const candle of candles) {
            if (candle.time <= cutoffSeconds) {
                latest = candle.close;
            } else if (firstAfter == null) {
                firstAfter = candle.close;
            }
        }

        return latest ?? firstAfter;
    }

    // ── Date range helpers ──────────────────────────────────────────────────────

    private resolveRange(range: string, firstTxDate: Date | null): { start: Date; daysBack: number } {
        const now = new Date();

        if (range === 'YTD') {
            const start = new Date(now.getFullYear(), 0, 1);
            return { start, daysBack: Math.ceil((now.getTime() - start.getTime()) / 86400000) };
        }

        if (range === 'ALL' && firstTxDate) {
            const daysBack = Math.max(1, Math.ceil((now.getTime() - firstTxDate.getTime()) / 86400000));
            const start = new Date(firstTxDate.getTime());
            return { start, daysBack };
        }

        const days = RANGE_DAYS[range] ?? 30;
        const start = new Date(now.getTime() - days * 86400000);
        return { start, daysBack: days };
    }

    // ── Portfolio valuation at a point in time ──────────────────────────────────

    private computeHoldingsAtDate(
        transactions: any[],
        cutoff: Date,
    ): Map<string, { qty: number; wac: number; lastPrice: number }> {
        const holdings = new Map<string, { qty: number; wac: number; lastPrice: number }>();

        for (const tx of transactions) {
            if (new Date(tx.date) > cutoff) break;
            const ticker = this.normalizeTicker(tx.asset?.ticker || 'CASH');
            const qty = Number(tx.quantity || 0);
            const price = Number(tx.pricePerUnit || 0);
            const fee = Number(tx.fee || 0);

            if (tx.type === 'BUY') {
                const prev = holdings.get(ticker) || { qty: 0, wac: 0, lastPrice: price };
                const newQty = prev.qty + qty;
                const newWac = newQty > 0 ? ((prev.qty * prev.wac) + (qty * price) + fee) / newQty : 0;
                holdings.set(ticker, { qty: newQty, wac: newWac, lastPrice: price });
            } else if (tx.type === 'SELL') {
                const prev = holdings.get(ticker) || { qty: 0, wac: 0, lastPrice: price };
                const newQty = Math.max(0, prev.qty - qty);
                holdings.set(ticker, { qty: newQty, wac: prev.wac, lastPrice: price });
            }
        }

        return holdings;
    }

    private computeValueFromHoldings(
        holdings: Map<string, { qty: number; wac: number; lastPrice: number }>,
        quoteMap: Map<string, any>,
        historicalPriceMaps?: Map<string, Array<{ time: number; close: number }>>,
        cutoff?: Date,
    ): number {
        let total = 0;
        for (const [ticker, h] of holdings.entries()) {
            if (h.qty <= 0) continue;
            const quote = quoteMap.get(ticker);
            const historicalPrice = cutoff
                ? this.getHistoricalPriceAtDate(historicalPriceMaps?.get(ticker), cutoff)
                : null;
            const price = historicalPrice ?? ((quote && typeof quote.price === 'number') ? quote.price : h.lastPrice);
            total += h.qty * price;
        }
        return total;
    }

    private computeInvestedCapital(transactions: any[], cutoff: Date): number {
        const holdings = this.computeHoldingsAtDate(transactions, cutoff);
        let invested = 0;
        for (const [, h] of holdings.entries()) {
            if (h.qty > 0) invested += h.qty * h.wac;
        }
        return invested;
    }

    // ── Cash balance helpers ────────────────────────────────────────────────────

    private computeCashAtDate(transactions: any[], cutoff: Date): number {
        let cash = 0;
        for (const tx of transactions) {
            if (new Date(tx.date) > cutoff) break;
            const total = Number(tx.total || 0);
            const fee = Number(tx.fee || 0);
            if (tx.type === 'BUY') cash -= total + fee;
            else if (tx.type === 'SELL') cash += total - fee;
            else if (tx.type === 'DIVIDEND') cash += total;
            else if (tx.type === 'DEPOSIT') cash += total;
            else if (tx.type === 'WITHDRAW') cash -= total;
            else if (tx.type === 'FEE') cash -= total;
        }
        return Math.max(0, cash);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────────

    // ── 1. Summary ──────────────────────────────────────────────────────────────

    async getSummary(portfolioId: string, userId: string, currency = 'USD') {
        await this.assertOwner(portfolioId, userId);

        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: {
                holdings: { include: { asset: true } },
                transactions: { include: { asset: true }, orderBy: { date: 'asc' } },
                cashAccounts: true,
            },
        });

        if (!portfolio) throw new NotFoundException('Portafolio no encontrado');

        const quoteMap = await this.getLiveQuoteMap(portfolio.holdings);
        const txs = portfolio.transactions;
        const now = new Date();

        // Current value
        const currentHoldings = this.computeHoldingsAtDate(txs, now);
        const assetsValue = this.computeValueFromHoldings(currentHoldings, quoteMap);
        const cashBalance = this.computeCashAtDate(txs, now);
        const totalValue = assetsValue + cashBalance;

        // Invested capital (sum of qty × WAC for all current positions)
        const investedCapital = this.computeInvestedCapital(txs, now);

        // Total PnL
        const totalPnl = totalValue - investedCapital;
        const returnPct = investedCapital > 0 ? (totalPnl / investedCapital) * 100 : 0;

        // YTD return
        const ytdStart = new Date(now.getFullYear(), 0, 1);
        const ytdHoldings = this.computeHoldingsAtDate(txs, ytdStart);
        const ytdStartValue = this.computeValueFromHoldings(ytdHoldings, quoteMap) + this.computeCashAtDate(txs, ytdStart);
        const ytdReturn = ytdStartValue > 0 ? ((totalValue - ytdStartValue) / ytdStartValue) * 100 : 0;

        // 1Y return
        const oneYearAgo = new Date(now.getTime() - 365 * 86400000);
        const oneYearHoldings = this.computeHoldingsAtDate(txs, oneYearAgo);
        const oneYearStartValue = this.computeValueFromHoldings(oneYearHoldings, quoteMap) + this.computeCashAtDate(txs, oneYearAgo);
        const oneYearReturn = oneYearStartValue > 0 ? ((totalValue - oneYearStartValue) / oneYearStartValue) * 100 : 0;

        // CAGR
        let cagr: number | null = null;
        if (txs.length > 0) {
            const firstTxDate = new Date(txs[0].date);
            const yearsDiff = (now.getTime() - firstTxDate.getTime()) / (365.25 * 86400000);
            if (yearsDiff >= 0.1 && investedCapital > 0 && totalValue > 0) {
                cagr = (Math.pow(totalValue / investedCapital, 1 / yearsDiff) - 1) * 100;
            }
        }

        // Dividends total
        const dividendsTotal = txs
            .filter((tx) => tx.type === 'DIVIDEND')
            .reduce((sum, tx) => sum + Number(tx.total || 0), 0);

        return {
            totalValue: Number(totalValue.toFixed(2)),
            investedCapital: Number(investedCapital.toFixed(2)),
            pnl: Number(totalPnl.toFixed(2)),
            returnPct: Number(returnPct.toFixed(4)),
            ytdReturn: Number(ytdReturn.toFixed(4)),
            oneYearReturn: Number(oneYearReturn.toFixed(4)),
            cagr: cagr !== null ? Number(cagr.toFixed(4)) : null,
            volatility: null,   // Computed in /risk
            sharpe: null,       // Computed in /risk
            maxDrawdown: null,  // Computed in /drawdown
            dividendsTotal: Number(dividendsTotal.toFixed(2)),
            cashBalance: Number(cashBalance.toFixed(2)),
            currency,
            lastUpdated: now.toISOString(),
        };
    }

    // ── 2. Performance series ───────────────────────────────────────────────────

    async getPerformance(portfolioId: string, userId: string, range = '1M', currency = 'USD') {
        await this.assertOwner(portfolioId, userId);

        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: {
                holdings: { include: { asset: true } },
                transactions: { include: { asset: true }, orderBy: { date: 'asc' } },
            },
        });

        if (!portfolio) throw new NotFoundException('Portafolio no encontrado');

        const txs = portfolio.transactions;
        if (!txs.length) {
            return { range, currency, series: [], markers: [], insufficientData: true, message: 'Sin operaciones registradas.' };
        }

        const quoteMap = await this.getLiveQuoteMap(portfolio.holdings);
        const firstAssetTransaction = txs.find((tx) =>
            Boolean(tx.asset?.ticker) && (tx.type === 'BUY' || tx.type === 'SELL'),
        );
        const firstTxDate = new Date((firstAssetTransaction ?? txs[0]).date);
        const now = new Date();

        const { start, daysBack } = this.resolveRange(range, firstTxDate);
        const historicalPriceMaps = await this.getHistoricalPriceMaps(
            txs.map((tx) => tx.asset?.ticker || ''),
            range,
        );

        // Determine step count
        let stepCount: number;
        if (daysBack <= 1) stepCount = 48;
        else if (daysBack <= 7) stepCount = 7;
        else if (daysBack <= 30) stepCount = 30;
        else if (daysBack <= 90) stepCount = 45;
        else if (daysBack <= 180) stepCount = 60;
        else if (daysBack <= 365) stepCount = 52;
        else stepCount = Math.min(daysBack, 60);

        const stepMs = (now.getTime() - start.getTime()) / Math.max(1, stepCount - 1);
        const series: PerformancePoint[] = [];
        let firstValue: number | null = null;

        for (let i = 0; i < stepCount; i++) {
            const pointDate = new Date(start.getTime() + i * stepMs);
            if (pointDate > now) break;

            const dateStr = range === '1D'
                ? pointDate.toISOString()
                : pointDate.toISOString().slice(0, 10);
            const pastTx = txs.filter((tx) => new Date(tx.date) <= pointDate);
            if (!pastTx.length) continue;

            const holdings = this.computeHoldingsAtDate(pastTx, pointDate);
            const assetsValue = this.computeValueFromHoldings(holdings, quoteMap, historicalPriceMaps, pointDate);
            const cashValue = this.computeCashAtDate(pastTx, pointDate);
            const value = assetsValue + cashValue;
            const invested = this.computeInvestedCapital(pastTx, pointDate);

            if (firstValue === null && value > 0) firstValue = value;

            const returnPct = firstValue && firstValue > 0 ? ((value - firstValue) / firstValue) * 100 : 0;
            const pnl = value - invested;

            // Daily return (compared to previous point)
            const prevPoint = series[series.length - 1];
            const dailyReturn = prevPoint && prevPoint.value > 0 ? ((value - prevPoint.value) / prevPoint.value) * 100 : undefined;

            series.push({
                date: dateStr,
                value: Number(value.toFixed(2)),
                returnPct: Number(returnPct.toFixed(4)),
                pnl: Number(pnl.toFixed(2)),
                invested: Number(invested.toFixed(2)),
                dailyReturn: dailyReturn !== undefined ? Number(dailyReturn.toFixed(4)) : undefined,
            });
        }

        // Build markers for significant operations
        const markers: PerformanceMarker[] = txs
            .filter((tx) => new Date(tx.date) >= start)
            .filter((tx) => ['BUY', 'SELL', 'DIVIDEND', 'DEPOSIT', 'WITHDRAW'].includes(tx.type))
            .map((tx) => ({
                date: new Date(tx.date).toISOString().slice(0, 10),
                type: tx.type as PerformanceMarker['type'],
                ticker: tx.asset?.ticker ?? undefined,
                amount: Number(tx.total || 0),
            }));

        if (series.length < 2) {
            return {
                range,
                currency,
                startDate: firstTxDate.toISOString(),
                series,
                markers,
                insufficientData: true,
                message: 'Datos insuficientes para el rango seleccionado.',
            };
        }

        return { range, currency, startDate: firstTxDate.toISOString(), series, markers, insufficientData: false };
    }

    // ── 3. Allocation ───────────────────────────────────────────────────────────

    async getAllocation(portfolioId: string, userId: string, groupBy = 'asset', currency = 'USD') {
        await this.assertOwner(portfolioId, userId);

        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: { holdings: { include: { asset: true } }, cashAccounts: true },
        });

        if (!portfolio) throw new NotFoundException('Portafolio no encontrado');

        const quoteMap = await this.getLiveQuoteMap(portfolio.holdings);
        const groups = new Map<string, { value: number; ticker?: string }>();

        for (const h of portfolio.holdings) {
            const qty = Number(h.quantity || 0);
            const ticker = this.normalizeTicker(h.asset?.ticker || '');
            const quote = quoteMap.get(ticker);
            const price = (quote?.price && Number.isFinite(quote.price)) ? quote.price : Number(h.averageCost || 0);
            const value = qty * price;
            if (value <= 0) continue;

            let groupKey: string;
            switch (groupBy) {
                case 'type': groupKey = h.asset?.type ?? 'OTRO'; break;
                case 'currency': groupKey = h.asset?.currency ?? 'USD'; break;
                default: groupKey = ticker; break; // 'asset'
            }

            const prev = groups.get(groupKey) ?? { value: 0, ticker };
            groups.set(groupKey, { value: prev.value + value, ticker: groupKey === ticker ? ticker : undefined });
        }

        // Add cash
        for (const ca of portfolio.cashAccounts ?? []) {
            const balance = Number(ca.balance || 0);
            if (balance <= 0) continue;
            const key = groupBy === 'currency' ? ca.currency : 'EFECTIVO';
            const prev = groups.get(key) ?? { value: 0 };
            groups.set(key, { value: prev.value + balance, ticker: undefined });
        }

        const total = Array.from(groups.values()).reduce((sum, g) => sum + g.value, 0);

        const items = Array.from(groups.entries())
            .map(([name, g]) => ({
                name,
                ticker: g.ticker ?? undefined,
                value: Number(g.value.toFixed(2)),
                percent: total > 0 ? Number(((g.value / total) * 100).toFixed(2)) : 0,
                currency,
            }))
            .sort((a, b) => b.value - a.value);

        return { groupBy, total: Number(total.toFixed(2)), items };
    }

    // ── 4. Asset P&L ────────────────────────────────────────────────────────────

    async getAssetPnL(portfolioId: string, userId: string, currency = 'USD') {
        await this.assertOwner(portfolioId, userId);

        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: { holdings: { include: { asset: true } } },
        });

        if (!portfolio) throw new NotFoundException('Portafolio no encontrado');

        const quoteMap = await this.getLiveQuoteMap(portfolio.holdings);
        const totalPortfolioValue = portfolio.holdings.reduce((sum, h) => {
            const qty = Number(h.quantity || 0);
            const ticker = this.normalizeTicker(h.asset?.ticker || '');
            const quote = quoteMap.get(ticker);
            const price = (quote?.price && Number.isFinite(quote.price)) ? quote.price : Number(h.averageCost || 0);
            return sum + qty * price;
        }, 0);

        return portfolio.holdings.map((h) => {
            const qty = Number(h.quantity || 0);
            const wac = Number(h.averageCost || 0);
            const ticker = this.normalizeTicker(h.asset?.ticker || '');
            const quote = quoteMap.get(ticker);
            const currentPrice = (quote?.price && Number.isFinite(quote.price)) ? quote.price : wac;
            const currentValue = qty * currentPrice;
            const costBasis = qty * wac;
            const pnlUsd = currentValue - costBasis;
            const returnPct = costBasis > 0 ? (pnlUsd / costBasis) * 100 : 0;
            const weight = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;

            return {
                ticker,
                name: h.asset?.name ?? ticker,
                returnPct: Number(returnPct.toFixed(4)),
                pnlUsd: Number(pnlUsd.toFixed(2)),
                pnlArs: null, // Multi-currency future iteration
                weight: Number(weight.toFixed(4)),
                currentValue: Number(currentValue.toFixed(2)),
                costBasis: Number(costBasis.toFixed(2)),
            };
        });
    }

    // ── 5. Monthly returns ──────────────────────────────────────────────────────

    async getReturns(portfolioId: string, userId: string) {
        await this.assertOwner(portfolioId, userId);

        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: {
                holdings: { include: { asset: true } },
                transactions: { include: { asset: true }, orderBy: { date: 'asc' } },
                cashAccounts: true,
            },
        });

        if (!portfolio) throw new NotFoundException('Portafolio no encontrado');

        const quoteMap = await this.getLiveQuoteMap(portfolio.holdings);
        const txs = portfolio.transactions;

        if (!txs.length) return [];

        const firstDate = new Date(txs[0].date);
        const now = new Date();

        // Build all months from first transaction to today
        const allMonths: Array<{ year: number; month: number; label: string; monthKey: string }> = [];
        const cursor = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);

        while (cursor <= now) {
            allMonths.push({
                year: cursor.getFullYear(),
                month: cursor.getMonth() + 1,
                label: MONTH_LABELS_ES[cursor.getMonth()],
                monthKey: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`,
            });
            cursor.setMonth(cursor.getMonth() + 1);
        }

        const results = [];

        for (const m of allMonths) {
            const monthStart = new Date(m.year, m.month - 1, 1);
            const monthEnd = new Date(m.year, m.month, 0, 23, 59, 59);

            const startTxs = txs.filter((tx) => new Date(tx.date) < monthStart);
            const endTxs = txs.filter((tx) => new Date(tx.date) <= monthEnd);

            const startHoldings = this.computeHoldingsAtDate(startTxs, monthStart);
            const endHoldings = this.computeHoldingsAtDate(endTxs, monthEnd);

            const startValue = this.computeValueFromHoldings(startHoldings, quoteMap) + this.computeCashAtDate(startTxs, monthStart);
            const endValue = this.computeValueFromHoldings(endHoldings, quoteMap) + this.computeCashAtDate(endTxs, monthEnd);

            // Net external flows during this month (deposits/withdraws only)
            const monthFlows = txs
                .filter((tx) => {
                    const d = new Date(tx.date);
                    return d >= monthStart && d <= monthEnd && (tx.type === 'DEPOSIT' || tx.type === 'WITHDRAW');
                })
                .reduce((sum, tx) => {
                    const amount = Number(tx.total || 0);
                    return sum + (tx.type === 'DEPOSIT' ? amount : -amount);
                }, 0);

            // TWR for this month
            const denominator = startValue + monthFlows * 0.5; // mid-month weighting
            const rawReturn = denominator > 1e-6 ? ((endValue - startValue - monthFlows) / denominator) * 100 : 0;

            results.push({
                monthKey: m.monthKey,
                label: m.label,
                year: m.year,
                month: m.month,
                value: Number((Number.isFinite(rawReturn) ? rawReturn : 0).toFixed(4)),
            });
        }

        return results;
    }

    // ── 6. Drawdown ─────────────────────────────────────────────────────────────

    async getDrawdown(portfolioId: string, userId: string, range = 'ALL') {
        await this.assertOwner(portfolioId, userId);

        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: {
                holdings: { include: { asset: true } },
                transactions: { include: { asset: true }, orderBy: { date: 'asc' } },
            },
        });

        if (!portfolio) throw new NotFoundException('Portafolio no encontrado');

        const quoteMap = await this.getLiveQuoteMap(portfolio.holdings);
        const txs = portfolio.transactions;

        if (txs.length < 2) {
            return {
                maxDrawdown: 0, maxDrawdownDate: '', recoveryDate: null, currentDrawdown: 0,
                peakValue: 0, peakDate: '', series: [],
            };
        }

        const firstDate = new Date(txs[0].date);
        const now = new Date();
        const { start } = this.resolveRange(range, firstDate);

        // Build daily series from start to now
        const days = Math.min(
            Math.ceil((now.getTime() - start.getTime()) / 86400000),
            730, // Max 2 years for performance
        );

        const series: Array<{ date: string; value: number }> = [];

        for (let i = 0; i <= days; i += Math.max(1, Math.floor(days / 120))) {
            const d = new Date(start.getTime() + i * 86400000);
            if (d > now) break;

            const pastTx = txs.filter((tx) => new Date(tx.date) <= d);
            if (!pastTx.length) continue;

            const holdings = this.computeHoldingsAtDate(pastTx, d);
            const value = this.computeValueFromHoldings(holdings, quoteMap) + this.computeCashAtDate(pastTx, d);
            if (value > 0) {
                series.push({ date: d.toISOString().slice(0, 10), value });
            }
        }

        if (!series.length) {
            return { maxDrawdown: 0, maxDrawdownDate: '', recoveryDate: null, currentDrawdown: 0, peakValue: 0, peakDate: '', series: [] };
        }

        // Compute drawdown from rolling peak
        let peak = series[0].value;
        let peakDate = series[0].date;
        let maxDrawdown = 0;
        let maxDrawdownDate = '';
        let recoveryDate: string | null = null;
        let inDrawdown = false;

        const drawdownSeries = series.map((pt) => {
            if (pt.value > peak) {
                peak = pt.value;
                peakDate = pt.date;
                if (inDrawdown) {
                    recoveryDate = pt.date;
                    inDrawdown = false;
                }
            }
            const dd = peak > 0 ? ((pt.value - peak) / peak) * 100 : 0;
            if (dd < maxDrawdown) {
                maxDrawdown = dd;
                maxDrawdownDate = pt.date;
                inDrawdown = true;
            }
            return { date: pt.date, drawdown: Number(dd.toFixed(4)), peakValue: peak };
        });

        const lastPt = series[series.length - 1];
        const currentDrawdown = peak > 0 ? ((lastPt.value - peak) / peak) * 100 : 0;

        return {
            maxDrawdown: Number(maxDrawdown.toFixed(4)),
            maxDrawdownDate,
            recoveryDate,
            currentDrawdown: Number(currentDrawdown.toFixed(4)),
            peakValue: Number(peak.toFixed(2)),
            peakDate,
            series: drawdownSeries,
        };
    }

    // ── 7. Dividends ────────────────────────────────────────────────────────────

    async getDividends(portfolioId: string, userId: string, range = 'ALL', currency = 'USD') {
        await this.assertOwner(portfolioId, userId);

        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: {
                holdings: { include: { asset: true } },
                transactions: { include: { asset: true }, orderBy: { date: 'asc' } },
            },
        });

        if (!portfolio) throw new NotFoundException('Portafolio no encontrado');

        const now = new Date();
        const { start } = this.resolveRange(range, null);

        const dividends = portfolio.transactions
            .filter((tx) => tx.type === 'DIVIDEND' && new Date(tx.date) >= start);

        // By month
        const byMonthMap = new Map<string, number>();
        for (const d of dividends) {
            const date = new Date(d.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = `${MONTH_LABELS_ES[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
            const prev = byMonthMap.get(key) ?? 0;
            byMonthMap.set(key, prev + Number(d.total || 0));
        }

        const byMonth = Array.from(byMonthMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([monthKey, amount]) => {
                const [year, month] = monthKey.split('-').map(Number);
                return {
                    monthKey,
                    label: `${MONTH_LABELS_ES[month - 1]} ${String(year).slice(-2)}`,
                    amount: Number(amount.toFixed(2)),
                };
            });

        // By asset
        const byAssetMap = new Map<string, { total: number; count: number }>();
        for (const d of dividends) {
            const ticker = this.normalizeTicker(d.asset?.ticker || 'N/D');
            const prev = byAssetMap.get(ticker) ?? { total: 0, count: 0 };
            byAssetMap.set(ticker, { total: prev.total + Number(d.total || 0), count: prev.count + 1 });
        }

        const byAsset = Array.from(byAssetMap.entries())
            .map(([ticker, { total, count }]) => ({ ticker, total: Number(total.toFixed(2)), count }))
            .sort((a, b) => b.total - a.total);

        // Accumulated
        let cum = 0;
        const accumulated = dividends.map((d) => {
            cum += Number(d.total || 0);
            return { date: new Date(d.date).toISOString().slice(0, 10), cumulative: Number(cum.toFixed(2)) };
        });

        const totalReceived = dividends.reduce((s, d) => s + Number(d.total || 0), 0);

        // Estimated yield (total dividends / current portfolio value, annualized)
        const quoteMap = await this.getLiveQuoteMap(portfolio.holdings);
        const portfolioValue = portfolio.holdings.reduce((s, h) => {
            const ticker = this.normalizeTicker(h.asset?.ticker || '');
            const q = quoteMap.get(ticker);
            const price = (q?.price && Number.isFinite(q.price)) ? q.price : Number(h.averageCost || 0);
            return s + Number(h.quantity || 0) * price;
        }, 0);

        const daysCovered = dividends.length > 0
            ? Math.max(1, (now.getTime() - new Date(dividends[0].date).getTime()) / 86400000)
            : 365;
        const annualizedDiv = totalReceived * (365 / daysCovered);
        const estimatedYield = portfolioValue > 0 ? (annualizedDiv / portfolioValue) * 100 : 0;

        return {
            byMonth,
            byAsset,
            accumulated,
            totalReceived: Number(totalReceived.toFixed(2)),
            estimatedYield: Number(estimatedYield.toFixed(4)),
            confirmed: dividends.map((d) => ({
                date: new Date(d.date).toISOString().slice(0, 10),
                ticker: this.normalizeTicker(d.asset?.ticker || 'N/D'),
                amount: Number(d.total || 0),
                currency: d.currency || 'USD',
            })),
        };
    }

    // ── 8. Risk / Return ────────────────────────────────────────────────────────

    async getRisk(portfolioId: string, userId: string, currency = 'USD') {
        await this.assertOwner(portfolioId, userId);

        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: {
                holdings: { include: { asset: true } },
                transactions: { include: { asset: true }, orderBy: { date: 'asc' } },
            },
        });

        if (!portfolio) throw new NotFoundException('Portafolio no encontrado');

        const quoteMap = await this.getLiveQuoteMap(portfolio.holdings);
        const txs = portfolio.transactions;
        const now = new Date();
        const oneYearAgo = new Date(now.getTime() - 365 * 86400000);

        // Portfolio total value for weights
        const totalValue = portfolio.holdings.reduce((sum, h) => {
            const ticker = this.normalizeTicker(h.asset?.ticker || '');
            const q = quoteMap.get(ticker);
            const price = (q?.price && Number.isFinite(q.price)) ? q.price : Number(h.averageCost || 0);
            return sum + Number(h.quantity || 0) * price;
        }, 0);

        const assets = portfolio.holdings.map((h) => {
            const qty = Number(h.quantity || 0);
            const wac = Number(h.averageCost || 0);
            const ticker = this.normalizeTicker(h.asset?.ticker || '');
            const q = quoteMap.get(ticker);
            const currentPrice = (q?.price && Number.isFinite(q.price)) ? q.price : wac;
            const currentValue = qty * currentPrice;
            const costBasis = qty * wac;
            const returnPct = costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0;
            const weight = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;

            // Approximate daily volatility from transaction history (simplified)
            const assetTxs = txs
                .filter((tx) => tx.asset?.ticker === h.asset?.ticker && new Date(tx.date) >= oneYearAgo && tx.type === 'BUY')
                .map((tx) => Number(tx.pricePerUnit || 0))
                .filter((p) => p > 0);

            let volatility = 0;
            if (assetTxs.length > 2) {
                const avg = assetTxs.reduce((s, p) => s + p, 0) / assetTxs.length;
                const variance = assetTxs.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / assetTxs.length;
                // Normalize to percentage of mean, annualize
                volatility = avg > 0 ? (Math.sqrt(variance) / avg) * Math.sqrt(252) * 100 : 15;
            } else {
                // Default by asset type
                const type = h.asset?.type ?? 'STOCK';
                volatility = type === 'BOND' ? 5 : type === 'REIT' ? 18 : type === 'CEDEAR' ? 25 : type === 'CRYPTO' ? 60 : 20;
            }

            const sharpe = volatility > 0 ? (returnPct / volatility) : null;

            return {
                ticker,
                name: h.asset?.name ?? ticker,
                returnPct: Number(returnPct.toFixed(4)),
                volatility: Number(volatility.toFixed(4)),
                weight: Number(weight.toFixed(4)),
                sharpe: sharpe !== null ? Number(sharpe.toFixed(4)) : null,
            };
        });

        // Portfolio aggregate: weighted average
        const portVolatility = assets.reduce((s, a) => s + (a.weight / 100) * a.volatility, 0);
        const portReturn = assets.reduce((s, a) => s + (a.weight / 100) * a.returnPct, 0);

        return {
            assets,
            portfolio: assets.length > 0
                ? { volatility: Number(portVolatility.toFixed(4)), returnPct: Number(portReturn.toFixed(4)) }
                : null,
        };
    }

    // ── 9. Benchmarks ───────────────────────────────────────────────────────────

    async getBenchmarks(portfolioId: string, userId: string, range = '1Y', benchmarks = ['sp500']) {
        await this.assertOwner(portfolioId, userId);

        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: {
                transactions: { include: { asset: true }, orderBy: { date: 'asc' } },
            },
        });

        if (!portfolio) throw new NotFoundException('Portafolio no encontrado');

        const perfData = await this.getPerformance(portfolioId, userId, range);
        const returns: Record<string, number> = {};
        const portSeries = perfData.series;
        const portFirstVal = portSeries[0]?.value ?? 0;
        const portLastVal = portSeries[portSeries.length - 1]?.value ?? 0;
        returns['portfolio'] = portFirstVal > 0 ? ((portLastVal - portFirstVal) / portFirstVal) * 100 : 0;

        const portfolioBase100 = portSeries.map((pt) => ({
            date: pt.date,
            normalized: portFirstVal > 0 ? Number(((pt.value / portFirstVal) * 100).toFixed(2)) : 100,
        }));

        const sp500Requested = benchmarks.some((benchmark) => benchmark.toLowerCase() === 'sp500');
        const sp500Response = sp500Requested
            ? await this.marketService.getCandles('SPY', this.getMarketHistoryInterval(range), this.getMarketHistoryRange(range)).catch(() => ({ candles: [] }))
            : { candles: [] };
        const sp500Candles = (sp500Response.candles ?? [])
            .map((c) => ({ time: Number(c.time), close: Number(c.close) }))
            .filter((c) => Number.isFinite(c.time) && Number.isFinite(c.close) && c.close > 0)
            .sort((a, b) => a.time - b.time);

        const candleAtDate = (date: string) => {
            const target = new Date(date.includes('T') ? date : `${date}T00:00:00Z`).getTime() / 1000;
            let latest: number | null = null;
            let firstAfter: number | null = null;

            for (const candle of sp500Candles) {
                if (candle.time <= target) latest = candle.close;
                else if (firstAfter == null) firstAfter = candle.close;
            }

            return latest ?? firstAfter;
        };

        const firstSp500Close = portfolioBase100.length > 0 ? candleAtDate(portfolioBase100[0].date) : null;
        const benchmarkAvailable = typeof firstSp500Close === 'number' && firstSp500Close > 0;

        const series = portfolioBase100.map((pt) => {
            const sp500Close = benchmarkAvailable ? candleAtDate(pt.date) : null;
            const result: { date: string; portfolio: number; sp500?: number } = {
                date: pt.date,
                portfolio: pt.normalized,
            };

            if (typeof sp500Close === 'number' && firstSp500Close) {
                result.sp500 = Number(((sp500Close / firstSp500Close) * 100).toFixed(2));
            }

            return result;
        });

        if (benchmarkAvailable && series.length > 0) {
            const lastSp500 = series[series.length - 1].sp500;
            if (typeof lastSp500 === 'number') {
                returns.sp500 = Number((lastSp500 - 100).toFixed(4));
            }
        }

        return {
            range,
            startDate: perfData.startDate,
            benchmarkAvailable,
            series,
            benchmarks,
            returns,
        };
    }
}
