/**
 * portfolio-performance.service.ts
 *
 * Dedicated service for portfolio analytics calculations.
 * Handles: Summary, Performance series (TWR), Allocation, Sectors,
 * Monthly Returns, Drawdown, Dividends, Risk/Return, Benchmarks.
 *
 * Financial methodology:
 *  - Returns: linked flow-adjusted return — deposits don't inflate returns
 *  - Drawdown: peak-to-trough as % from rolling maximum
 *  - Volatility: annualized std dev of daily log returns × √252
 *  - Sharpe: (E[Rp] - Rf) / σ(Rp), Rf = 0 (ARS), 4.5% (USD)
 *  - CAGR: (VF/VI)^(1/years) - 1
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MarketService } from '../market/market.service';
import { getCedearDefinition } from '../market/cedear.data';
import { buildPerformanceCashLedger } from './performance-cash-ledger';

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

    private assetTicker(asset: any) {
        const ticker = this.normalizeTicker(asset?.ticker || '');
        return asset?.type === 'CEDEAR' && !/^(BCBA|BYMA):/.test(ticker)
            ? `BCBA:${ticker.replace(/^[A-Z]+:/, '')}`
            : ticker;
    }

    private cedearForTicker(ticker: string) {
        // A US share and its Argentine certificate can share the same ticker.
        // Only local certificates require the CEDEAR ratio.
        return /^(BCBA|BYMA):/.test(ticker)
            ? getCedearDefinition(ticker.replace(/^(BCBA|BYMA):/, ''))
            : undefined;
    }

    private async getLiveQuoteMap(holdings: any[]) {
        const symbols = new Set<string>();
        for (const h of holdings) {
            const t = this.assetTicker(h?.asset);
            if (!t) continue;

            const cleanTicker = t.replace(/^(BCBA|BYMA|NASDAQ|NYSE|AMEX):/i, '').toUpperCase();
            const cedear = this.cedearForTicker(t);
            const isCedear = h?.asset?.type === 'CEDEAR' || t.startsWith('BCBA:') || Boolean(cedear);

            symbols.add(t);
            if (isCedear) {
                symbols.add(`BCBA:${cedear?.ticker || cleanTicker}`);
                if (cedear?.underlyingTicker) {
                    symbols.add(cedear.underlyingTicker);
                    if (cedear.underlyingExchange) {
                        symbols.add(`${cedear.underlyingExchange}:${cedear.underlyingTicker}`);
                    }
                }
            }
        }
        if (!symbols.size) return new Map<string, any>();
        const quotes = await this.marketService.getQuotes([...symbols]).catch(() => []);
        const map = new Map<string, any>();
        for (const q of quotes) {
            if (!q.inputSymbol) continue;
            const key = this.normalizeTicker(q.inputSymbol);
            map.set(key, q);
            if (key.includes(':') && !/^(BCBA|BYMA):/.test(key)) {
                const short = key.split(':')[1];
                if (short && !map.has(short)) map.set(short, q);
            }
        }
        return map;
    }

    private async getCclRate(strict = false) {
        const ccl = await this.marketService.getDolarCcl().catch(() => null);
        const rate = Number(ccl?.venta || ccl?.compra || (strict ? NaN : 1590));
        return Number.isFinite(rate) && rate > 0 ? rate : (strict ? NaN : 1590);
    }

    private isUsdCurrency(currency: string) {
        return String(currency || '').trim().toUpperCase().startsWith('USD');
    }

    private convertCurrencyAmount(amount: number, sourceCurrency: string, targetCurrency: string, cclRate: number) {
        const source = String(sourceCurrency || 'USD').trim().toUpperCase();
        if (this.isUsdCurrency(targetCurrency) && source === 'ARS') return amount / cclRate;
        if (!this.isUsdCurrency(targetCurrency) && source.startsWith('USD')) return amount * cclRate;
        return amount;
    }

    private getQuote(quoteMap: Map<string, any>, keys: Array<string | undefined>) {
        for (const key of keys) {
            if (!key) continue;
            const quote = quoteMap.get(this.normalizeTicker(key));
            if (quote && Number.isFinite(Number(quote.price)) && Number(quote.price) > 0) return quote;
        }
        return null;
    }

    /** Returns a price in the requested portfolio currency. CEDEARs are quoted
     * in ARS locally while their underlying is quoted in USD. */
    private resolveHoldingPrice(
        ticker: string,
        quoteMap: Map<string, any>,
        currency: string,
        cclRate: number,
        fallbackPrice?: number,
        underlyingOnly = false,
    ) {
        const normalized = this.normalizeTicker(ticker);
        const cleanTicker = normalized.replace(/^(BCBA|BYMA|NASDAQ|NYSE|AMEX):/i, '').toUpperCase();
        const cedear = this.cedearForTicker(normalized);

        if (cedear && cedear.ratio > 0) {
            const localQuote = this.getQuote(quoteMap, [
                `BCBA:${cedear.ticker}`,
                `BYMA:${cedear.ticker}`,
                normalized,
            ]);
            const underlyingQuote = this.getQuote(quoteMap, [
                `${cedear.underlyingExchange}:${cedear.underlyingTicker}`,
                cedear.underlyingTicker,
            ]);

            if (underlyingOnly) return underlyingQuote
                ? this.convertCurrencyAmount(Number(underlyingQuote.price) / cedear.ratio, 'USD', currency, cclRate) : 0;

            if (this.isUsdCurrency(currency)) {
                if (underlyingQuote) return Number(underlyingQuote.price) / cedear.ratio;
                if (localQuote) return Number(localQuote.price) / cclRate;
            } else {
                if (localQuote) return Number(localQuote.price);
                if (underlyingQuote) return (Number(underlyingQuote.price) * cclRate) / cedear.ratio;
            }
        }

        const quote = this.getQuote(quoteMap, [normalized, cleanTicker]);
        const sourceCurrency = /^(BCBA|BYMA):/.test(normalized) ? 'ARS' : 'USD';
        return this.convertCurrencyAmount(quote ? Number(quote.price) : (Number.isFinite(Number(fallbackPrice)) ? Number(fallbackPrice) : 0), sourceCurrency, currency, cclRate);
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
            case '3Y': return '5y';
            case '5Y':
            case 'ALL': return 'max';
            default: return '1y';
        }
    }

    private getMarketHistoryInterval(range: string) {
        return range === '1D' ? '1h' : '1d';
    }

    private candleAvailabilityTime(time: number, ticker: string, range: string, asOf: Date) {
        const clean = ticker.replace(/^[A-Z]+:/, '').replace(/-USD$/, '').toUpperCase();
        const crypto = /^(BTC|ETH|SOL|BNB|XRP|ADA|DOGE|AVAX|DOT|LINK|MATIC|NEAR|LTC|ATOM)(USDT|USD)?$/.test(clean) || clean.endsWith('USDT');
        // Providers timestamp bars at their OPEN. Historical closes become
        // usable after the bar finishes; an in-progress bar is known only at
        // the current observation, never retrospectively.
        // US regular session: 09:30–16:00 ET; crypto daily bars span 24h.
        const duration = range === '1D' ? 3600 : crypto ? 86400 : 6.5 * 3600;
        const observedAt = asOf.getTime() / 1000;
        return time <= observedAt ? Math.min(time + duration, observedAt) : time + duration;
    }

    private async getHistoricalPriceMaps(tickers: string[], range: string, asOf = new Date()) {
        const uniqueTickers = Array.from(new Set(tickers.map((ticker) => this.normalizeTicker(ticker)).filter(Boolean)));
        const yahooRange = this.getMarketHistoryRange(range);
        const interval = this.getMarketHistoryInterval(range);
        const histories = await Promise.all(
            uniqueTickers.map(async (ticker) => {
                const cleanTicker = ticker.replace(/^(BCBA|BYMA|NASDAQ|NYSE|AMEX):/i, '').toUpperCase();
                const cedear = this.cedearForTicker(ticker);
                // Yahoo returns the US underlying for a CEDEAR ticker. Keep the
                // map keyed by the portfolio ticker so valuation can convert it
                // back to local ARS using the CEDEAR ratio and CCL.
                if (/^(BCBA|BYMA):/.test(ticker) && !cedear) return [ticker, [] as Array<{ time: number; close: number }>] as const;
                const sourceTicker = cedear?.underlyingTicker || ticker;
                const response = await this.marketService.getCandles(sourceTicker, interval, yahooRange).catch(() => ({ candles: [] }));
                const candles = Array.isArray(response.candles)
                    ? response.candles
                        .map((c) => ({ time: this.candleAvailabilityTime(Number(c.time), sourceTicker, range, asOf), close: Number(c.close) }))
                        .filter((c) => Number.isFinite(c.time) && Number.isFinite(c.close) && c.close > 0)
                        .sort((a, b) => a.time - b.time)
                    : [];
                return [ticker, candles] as const;
            }),
        );

        return new Map(histories);
    }

    private getHistoricalHoldingPrice(
        ticker: string,
        historicalPriceMaps: Map<string, Array<{ time: number; close: number }>> | undefined,
        cutoff: Date,
        currency: string,
        cclRate: number,
    ) {
        const normalized = this.normalizeTicker(ticker);
        const cleanTicker = normalized.replace(/^(BCBA|BYMA|NASDAQ|NYSE|AMEX):/i, '').toUpperCase();
        const historicalPrice = this.getHistoricalPriceAtDate(historicalPriceMaps?.get(normalized), cutoff);
        if (!historicalPrice) return null;

        const cedear = this.cedearForTicker(normalized);
        if (!cedear || cedear.ratio <= 0) return this.convertCurrencyAmount(historicalPrice, /^(BCBA|BYMA):/.test(normalized) ? 'ARS' : 'USD', currency, cclRate);

        return this.isUsdCurrency(currency)
            ? historicalPrice / cedear.ratio
            : (historicalPrice * cclRate) / cedear.ratio;
    }

    private getHistoricalPriceAtDate(
        candles: Array<{ time: number; close: number }> | undefined,
        cutoff: Date,
    ) {
        if (!candles?.length) return null;

        const cutoffSeconds = cutoff.getTime() / 1000;
        let left = 0;
        let right = candles.length - 1;
        let latest = -1;
        while (left <= right) {
            const middle = Math.floor((left + right) / 2);
            if (candles[middle].time <= cutoffSeconds) {
                latest = middle;
                left = middle + 1;
            } else right = middle - 1;
        }
        const candle = latest >= 0 ? candles[latest] : null;
        // Carry the last close over weekends/holidays, but never turn missing
        // weeks of market data into a fabricated flat return.
        return candle && cutoffSeconds - candle.time <= 7 * 86400 ? candle.close : null;
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
            const ticker = this.assetTicker(tx.asset) || 'CASH';
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
        currency = 'USD',
        cclRate = 1590,
        strictHistory = false,
        currentPoint = false,
        executionPrices?: Map<string, number>,
    ): number {
        let total = 0;
        for (const [ticker, h] of holdings.entries()) {
            if (h.qty <= 0) continue;
            const executionPrice = executionPrices?.get(ticker);
            if (executionPrice != null) { total += h.qty * executionPrice; continue; }
            const historicalPrice = cutoff
                ? this.getHistoricalHoldingPrice(ticker, historicalPriceMaps, cutoff, currency, cclRate)
                : null;
            const livePrice = currentPoint
                ? this.resolveHoldingPrice(ticker, quoteMap, currency, cclRate, undefined, strictHistory)
                : 0;
            if (strictHistory && historicalPrice == null && !(currentPoint && livePrice > 0)) return NaN;
            const price = currentPoint && livePrice > 0 ? livePrice
                : historicalPrice ?? this.resolveHoldingPrice(ticker, quoteMap, currency, cclRate, h.lastPrice);
            total += h.qty * price;
        }
        return total;
    }

    private computeInvestedCapital(transactions: any[], cutoff: Date, currency = 'USD', cclRate = 1590): number {
        const converted = transactions.map((tx) => ({
            ...tx,
            pricePerUnit: this.convertCurrencyAmount(Number(tx.pricePerUnit || 0), tx.currency || 'USD', currency, cclRate),
            fee: this.convertCurrencyAmount(Number(tx.fee || 0), tx.currency || 'USD', currency, cclRate),
        }));
        return [...this.computeHoldingsAtDate(converted, cutoff).values()]
            .reduce((total, holding) => total + holding.qty * holding.wac, 0);
    }

    // ── Cash balance helpers ────────────────────────────────────────────────────

    private computeCashAtDate(transactions: any[], cutoff: Date, currency = 'USD', cclRate = 1590): number {
        let cash = 0;
        for (const event of buildPerformanceCashLedger(transactions)) {
            if (event.date > cutoff) break;
            cash += this.convertCurrencyAmount(event.cashDelta, event.currency, currency, cclRate);
        }
        return cash;
    }

    private holdingsFromPortfolio(portfolioHoldings: any[]) {
        const holdings = new Map<string, { qty: number; wac: number; lastPrice: number }>();
        for (const holding of portfolioHoldings ?? []) {
            const ticker = this.assetTicker(holding?.asset);
            const qty = Number(holding?.quantity || 0);
            if (!ticker || qty <= 0) continue;
            const averageCost = Number(holding?.averageCost || 0);
            holdings.set(ticker, {
                qty,
                wac: averageCost,
                lastPrice: averageCost,
            });
        }
        return holdings;
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

        const [quoteMap, cclRate] = await Promise.all([
            this.getLiveQuoteMap(portfolio.holdings),
            this.getCclRate(),
        ]);
        const txs = portfolio.transactions;
        const now = new Date();

        // Current value
        const currentHoldings = txs.length > 0
            ? this.computeHoldingsAtDate(txs, now)
            : this.holdingsFromPortfolio(portfolio.holdings);
        const assetsValue = this.computeValueFromHoldings(currentHoldings, quoteMap, undefined, undefined, currency, cclRate);
        const cashBalance = this.computeCashAtDate(txs, now, currency, cclRate);
        const totalValue = assetsValue + cashBalance;

        // Invested capital (sum of qty × WAC for all current positions)
        const investedCapital = txs.length > 0
            ? this.computeInvestedCapital(txs, now, currency, cclRate)
            : Array.from(currentHoldings.entries()).reduce((sum, [ticker, holding]) => {
                const cleanTicker = ticker.replace(/^(BCBA|BYMA):/i, '');
                const cedear = this.cedearForTicker(ticker);
                const value = holding.qty * holding.wac;
                return sum + (cedear && this.isUsdCurrency(currency) ? value / cclRate : value);
            }, 0);

        // Total PnL
        const totalPnl = totalValue - investedCapital;
        const returnPct = investedCapital > 0 ? (totalPnl / investedCapital) * 100 : 0;

        // YTD return
        const ytdStart = new Date(now.getFullYear(), 0, 1);
        const ytdHoldings = txs.length > 0 ? this.computeHoldingsAtDate(txs, ytdStart) : currentHoldings;
        const ytdStartValue = this.computeValueFromHoldings(ytdHoldings, quoteMap, undefined, undefined, currency, cclRate)
            + this.computeCashAtDate(txs, ytdStart, currency, cclRate);
        const ytdReturn = ytdStartValue > 0 ? ((totalValue - ytdStartValue) / ytdStartValue) * 100 : 0;

        // 1Y return
        const oneYearAgo = new Date(now.getTime() - 365 * 86400000);
        const oneYearHoldings = txs.length > 0 ? this.computeHoldingsAtDate(txs, oneYearAgo) : currentHoldings;
        const oneYearStartValue = this.computeValueFromHoldings(oneYearHoldings, quoteMap, undefined, undefined, currency, cclRate)
            + this.computeCashAtDate(txs, oneYearAgo, currency, cclRate);
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

        const now = new Date();
        const txs = portfolio.transactions.filter((tx) => new Date(tx.date) <= now);
        const needsConversion = txs.some(tx => this.isUsdCurrency(tx.currency || 'USD') !== this.isUsdCurrency(currency))
            || [...portfolio.holdings, ...txs].some(item => item.asset &&
                this.isUsdCurrency(currency) !== (!/^(BCBA|BYMA):/.test(this.assetTicker(item.asset)) || Boolean(this.cedearForTicker(this.assetTicker(item.asset)))));
        const [quoteMap, cclRate] = await Promise.all([
            this.getLiveQuoteMap([...portfolio.holdings, ...txs]),
            needsConversion ? this.getCclRate(true) : Promise.resolve(1),
        ]);
        if (!Number.isFinite(cclRate)) {
            return { range, currency, series: [], markers: [], insufficientData: true,
                message: 'No hay cotización CCL disponible para convertir las monedas de la cartera.' };
        }
        const valuationNotices: string[] = [range === '1D' ? 'Historial con cierres horarios y precios de operaciones registradas.' : 'Historial con cierres diarios y precios de operaciones registradas; no reconstruye cada cotización intradiaria.'];
        if (txs.some(tx => this.cedearForTicker(this.assetTicker(tx.asset)))) valuationNotices.push('Los CEDEAR se comparan mediante el precio del subyacente y su ratio; no incluye cambios de prima local.');
        if (needsConversion) valuationNotices.push('La conversión de monedas usa el CCL actual; no mide la variación histórica del tipo de cambio.');
        const valuationMessage = valuationNotices.join(' ') || undefined;
        if (!txs.length) {
            const holdings = this.holdingsFromPortfolio(portfolio.holdings);
            const value = this.computeValueFromHoldings(holdings, quoteMap, undefined, undefined, currency, cclRate);
            const series = value > 0
                ? [{ date: new Date().toISOString(), value: Number(value.toFixed(2)), returnPct: 0, pnl: 0, invested: 0 }]
                : [];
            return { range, currency, series, markers: [], insufficientData: true, message: 'Sin operaciones registradas.' };
        }

        const firstTxDate = new Date(txs[0].date);
        const { start: requestedStart } = this.resolveRange(range, firstTxDate);
        const start = new Date(Math.max(requestedStart.getTime(), firstTxDate.getTime()));
        const historicalPriceMaps = await this.getHistoricalPriceMaps(
            txs.map((tx) => this.assetTicker(tx.asset)), range, now,
        );

        // Daily (hourly for 1D) valuations and every operation share exact
        // timestamps with SPY. Never substitute today's price for a past day.
        const stepMs = range === '1D' ? 3600000 : 86400000;
        const timestamps = new Set<number>([start.getTime(), now.getTime()]);
        for (let time = start.getTime() + stepMs; time < now.getTime(); time += stepMs) timestamps.add(time);
        for (const tx of txs) {
            const time = new Date(tx.date).getTime();
            if (time >= start.getTime()) timestamps.add(time);
        }
        const replayedHoldings = this.computeHoldingsAtDate(txs, now);
        const currentHoldings = this.holdingsFromPortfolio(portfolio.holdings);
        const tickers = new Set([...replayedHoldings.keys(), ...currentHoldings.keys()]);
        if ([...tickers].some((ticker) => Math.abs((replayedHoldings.get(ticker)?.qty ?? 0) - (currentHoldings.get(ticker)?.qty ?? 0)) > 1e-6)) {
            return { range, currency, series: [], markers: [], insufficientData: true,
                message: 'Faltan operaciones en el historial para reconstruir el rendimiento de esta cartera.' };
        }
        const cashLedger = buildPerformanceCashLedger(txs).map(event => ({
            ...event,
            cashDelta: this.convertCurrencyAmount(event.cashDelta, event.currency, currency, cclRate),
            externalFlow: this.convertCurrencyAmount(event.externalFlow, event.currency, currency, cclRate),
        }));
        const cashAt = (date: Date, inclusive: boolean) => cashLedger.reduce((total, event) =>
            total + ((inclusive ? event.date <= date : event.date < date) ? event.cashDelta : 0), 0);
        const series: PerformancePoint[] = [];
        let cumulativeReturnFactor = 1;
        let previousValue = 0;

        for (const timestamp of [...timestamps].sort((a, b) => a - b)) {
            const pointDate = new Date(timestamp);
            const dateStr = pointDate.toISOString();
            const pastTx = txs.filter((tx) => new Date(tx.date) <= pointDate);
            if (!pastTx.length) continue;

            const executionPrices = new Map<string, number>();
            if (timestamp !== now.getTime()) {
                for (const tx of pastTx) {
                    if (new Date(tx.date).getTime() !== timestamp || !tx.asset || !['BUY', 'SELL'].includes(tx.type)) continue;
                    const price = Number(tx.pricePerUnit);
                    if (Number.isFinite(price) && price > 0) executionPrices.set(this.assetTicker(tx.asset),
                        this.convertCurrencyAmount(price, tx.currency || 'USD', currency, cclRate));
                }
            }
            const holdings = this.computeHoldingsAtDate(pastTx, pointDate);
            const assetsValue = this.computeValueFromHoldings(
                holdings,
                quoteMap,
                historicalPriceMaps,
                pointDate,
                currency,
                cclRate,
                true,
                timestamp === now.getTime(),
                executionPrices,
            );
            if (!Number.isFinite(assetsValue)) {
                return { range, currency, startDate: start.toISOString(), series: [], markers: [], insufficientData: true,
                    message: 'No hay precios históricos suficientes para calcular un rendimiento fiable en este período.' };
            }
            const cashValue = cashAt(pointDate, true);
            const value = assetsValue + cashValue;
            const invested = this.computeInvestedCapital(pastTx, pointDate, currency, cclRate);

            const pnl = value - invested;

            // Value immediately before each operation as well as after it.
            // Link market and operation returns separately, so contributions
            // cannot dilute earlier gains or amplify trade gains and fees.
            // https://www.gipsstandards.org/standards/gips-standards-for-firms/gips-standards-handbook-for-firms/
            const prevPoint = series[series.length - 1];
            let returnPct = 0;
            let dailyReturn: number | undefined;
            if (prevPoint) {
                const beforeTx = pastTx.filter(tx => new Date(tx.date) < pointDate);
                const beforeAssetsValue = this.computeValueFromHoldings(
                    this.computeHoldingsAtDate(beforeTx, pointDate), quoteMap, historicalPriceMaps,
                    pointDate, currency, cclRate, true, timestamp === now.getTime(), executionPrices,
                );
                if (!Number.isFinite(beforeAssetsValue)) {
                    return { range, currency, startDate: start.toISOString(), series: [], markers: [], insufficientData: true,
                        message: 'No hay precios históricos suficientes para calcular un rendimiento fiable en este período.' };
                }
                const beforeValue = beforeAssetsValue + cashAt(pointDate, false);
                const flows = cashLedger.filter(event => event.date.getTime() === timestamp);
                const netFlow = flows.reduce((total, event) => total + event.externalFlow, 0);
                const contributions = flows.reduce((total, event) => total + Math.max(0, event.externalFlow), 0);
                const marketFactor = previousValue > 1e-6 ? Math.max(0, beforeValue / previousValue) : 1;
                const operationBase = beforeValue + contributions;
                const operationGain = value - beforeValue - netFlow;
                const operationFactor = operationBase > 1e-6 ? Math.max(0, 1 + operationGain / operationBase) : 1;
                const periodFactor = marketFactor * operationFactor;
                cumulativeReturnFactor *= periodFactor;
                returnPct = (cumulativeReturnFactor - 1) * 100;
                dailyReturn = (periodFactor - 1) * 100;
            }

            series.push({
                date: dateStr,
                value: Number(value.toFixed(2)),
                returnPct: Number(returnPct.toFixed(4)),
                pnl: Number(pnl.toFixed(2)),
                invested: Number(invested.toFixed(2)),
                dailyReturn: dailyReturn !== undefined ? Number(dailyReturn.toFixed(4)) : undefined,
            });
            previousValue = value;
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

        const distinctDates = new Set(series.map((point) => point.date)).size;
        if (series.length < 2 || distinctDates < 2) {
            return {
                range,
                currency,
                startDate: start.toISOString(),
                valuationMessage,
                series,
                markers,
                insufficientData: true,
                message: 'Datos insuficientes para el rango seleccionado.',
            };
        }

        return { range, currency, startDate: start.toISOString(), valuationMessage, series, markers, insufficientData: false };
    }

    // ── 3. Allocation ───────────────────────────────────────────────────────────

    async getAllocation(portfolioId: string, userId: string, groupBy = 'asset', currency = 'USD') {
        await this.assertOwner(portfolioId, userId);

        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: { holdings: { include: { asset: true } }, cashAccounts: true },
        });

        if (!portfolio) throw new NotFoundException('Portafolio no encontrado');

        const [quoteMap, cclRate] = await Promise.all([
            this.getLiveQuoteMap(portfolio.holdings),
            this.getCclRate(),
        ]);
        const groups = new Map<string, { value: number; ticker?: string }>();

        for (const h of portfolio.holdings) {
            const qty = Number(h.quantity || 0);
            const ticker = this.assetTicker(h.asset);
            const price = this.resolveHoldingPrice(ticker, quoteMap, currency, cclRate, Number(h.averageCost || 0));
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
            const cashCurrency = String(ca.currency || 'USD').toUpperCase();
            const normalizedBalance = this.isUsdCurrency(currency) && cashCurrency === 'ARS'
                ? balance / cclRate
                : !this.isUsdCurrency(currency) && cashCurrency.startsWith('USD')
                    ? balance * cclRate
                    : balance;
            const key = groupBy === 'currency' ? ca.currency : 'EFECTIVO';
            const prev = groups.get(key) ?? { value: 0 };
            groups.set(key, { value: prev.value + normalizedBalance, ticker: undefined });
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

        const [quoteMap, cclRate] = await Promise.all([
            this.getLiveQuoteMap(portfolio.holdings),
            this.getCclRate(),
        ]);
        const totalPortfolioValue = portfolio.holdings.reduce((sum, h) => {
            const qty = Number(h.quantity || 0);
            const ticker = this.assetTicker(h.asset);
            const price = this.resolveHoldingPrice(ticker, quoteMap, currency, cclRate, Number(h.averageCost || 0));
            return sum + qty * price;
        }, 0);

        return portfolio.holdings.map((h) => {
            const qty = Number(h.quantity || 0);
            const wac = Number(h.averageCost || 0);
            const ticker = this.assetTicker(h.asset);
            const currentPrice = this.resolveHoldingPrice(ticker, quoteMap, currency, cclRate, wac);
            const currentValue = qty * currentPrice;
            const costBasis = this.convertCurrencyAmount(qty * wac, h.asset?.currency || (this.cedearForTicker(ticker) ? 'ARS' : 'USD'), currency, cclRate);
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

    async getReturns(portfolioId: string, userId: string, currency = 'USD') {
        // Use the same historical closes and flow-adjusted returns as the
        // portfolio/benchmark curves, never today's quote for a past month.
        const performance = await this.getPerformance(portfolioId, userId, 'ALL', currency);
        if (performance.insufficientData) return [];
        const months = new Map<string, { factor: number; observations: number; hasBalance: boolean }>();
        const movementMonths = new Set((performance.markers ?? []).map(marker => marker.date.slice(0, 7)));
        for (const point of performance.series) {
            const key = point.date.slice(0, 7);
            const month = months.get(key) ?? { factor: 1, observations: 0, hasBalance: false };
            month.hasBalance ||= point.value > 1e-6;
            if ('dailyReturn' in point && typeof point.dailyReturn === 'number' && Number.isFinite(point.dailyReturn)) {
                month.factor *= Math.max(0, 1 + point.dailyReturn / 100);
                month.observations += 1;
            }
            months.set(key, month);
        }
        return [...months.entries()]
            .filter(([key, month]) => month.observations > 0 && (month.hasBalance || movementMonths.has(key) || Math.abs(month.factor - 1) > 1e-8))
            .map(([monthKey, month]) => {
                const [year, monthNumber] = monthKey.split('-').map(Number);
                return { monthKey, label: MONTH_LABELS_ES[monthNumber - 1], year, month: monthNumber,
                    value: Number(((month.factor - 1) * 100).toFixed(4)) };
            });
    }

    // ── 6. Drawdown ─────────────────────────────────────────────────────────────

    async getDrawdown(portfolioId: string, userId: string, range = 'ALL', currency = 'USD') {
        await this.assertOwner(portfolioId, userId);

        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: {
                holdings: { include: { asset: true } },
                transactions: { include: { asset: true }, orderBy: { date: 'asc' } },
            },
        });

        if (!portfolio) throw new NotFoundException('Portafolio no encontrado');

        const [quoteMap, cclRate] = await Promise.all([
            this.getLiveQuoteMap(portfolio.holdings),
            this.getCclRate(),
        ]);
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
            const value = this.computeValueFromHoldings(holdings, quoteMap, undefined, undefined, currency, cclRate)
                + this.computeCashAtDate(pastTx, d, currency, cclRate);
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
        const cclRate = await this.getCclRate();
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
            byMonthMap.set(key, prev + this.convertCurrencyAmount(Number(d.total || 0), d.currency || 'USD', currency, cclRate));
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
            const amount = this.convertCurrencyAmount(Number(d.total || 0), d.currency || 'USD', currency, cclRate);
            byAssetMap.set(ticker, { total: prev.total + amount, count: prev.count + 1 });
        }

        const byAsset = Array.from(byAssetMap.entries())
            .map(([ticker, { total, count }]) => ({ ticker, total: Number(total.toFixed(2)), count }))
            .sort((a, b) => b.total - a.total);

        // Accumulated
        let cum = 0;
        const accumulated = dividends.map((d) => {
            cum += this.convertCurrencyAmount(Number(d.total || 0), d.currency || 'USD', currency, cclRate);
            return { date: new Date(d.date).toISOString().slice(0, 10), cumulative: Number(cum.toFixed(2)) };
        });

        const totalReceived = dividends.reduce(
            (s, d) => s + this.convertCurrencyAmount(Number(d.total || 0), d.currency || 'USD', currency, cclRate),
            0,
        );

        // Estimated yield (total dividends / current portfolio value, annualized)
        const quoteMap = await this.getLiveQuoteMap(portfolio.holdings);
        const portfolioValue = portfolio.holdings.reduce((s, h) => {
            const ticker = this.assetTicker(h.asset);
            const price = this.resolveHoldingPrice(ticker, quoteMap, currency, cclRate, Number(h.averageCost || 0));
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
                amount: Number(this.convertCurrencyAmount(Number(d.total || 0), d.currency || 'USD', currency, cclRate).toFixed(2)),
                currency,
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

        const [quoteMap, cclRate] = await Promise.all([
            this.getLiveQuoteMap(portfolio.holdings),
            this.getCclRate(),
        ]);
        const txs = portfolio.transactions;
        const now = new Date();
        const oneYearAgo = new Date(now.getTime() - 365 * 86400000);

        // Portfolio total value for weights
        const totalValue = portfolio.holdings.reduce((sum, h) => {
            const ticker = this.assetTicker(h.asset);
            const price = this.resolveHoldingPrice(ticker, quoteMap, currency, cclRate, Number(h.averageCost || 0));
            return sum + Number(h.quantity || 0) * price;
        }, 0);

        const assets = portfolio.holdings.map((h) => {
            const qty = Number(h.quantity || 0);
            const wac = Number(h.averageCost || 0);
            const ticker = this.assetTicker(h.asset);
            const currentPrice = this.resolveHoldingPrice(ticker, quoteMap, currency, cclRate, wac);
            const currentValue = qty * currentPrice;
            const cleanTicker = ticker.replace(/^(BCBA|BYMA):/i, '');
            const cedear = this.cedearForTicker(ticker);
            const costBasis = this.convertCurrencyAmount(qty * wac, h.asset?.currency || (cedear ? 'ARS' : 'USD'), currency, cclRate);
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

    async getBenchmarks(portfolioId: string, userId: string, range = '1Y', benchmarks = ['sp500'], currency = 'USD') {
        const perfData = await this.getPerformance(portfolioId, userId, range, currency);
        const returns: Record<string, number> = {};
        const portSeries = perfData.series;
        const lastPortfolioPoint = portSeries[portSeries.length - 1];
        returns['portfolio'] = Number(lastPortfolioPoint?.returnPct ?? 0);

        const portfolioBase100 = portSeries.map((pt) => ({
            date: pt.date,
            normalized: Number(Math.max(0, 100 + Number(pt.returnPct || 0)).toFixed(2)),
        }));

        const sp500Requested = benchmarks.some((benchmark) => benchmark.toLowerCase() === 'sp500');
        const sp500Response = sp500Requested
            ? await this.marketService.getCandles('SPY', this.getMarketHistoryInterval(range), this.getMarketHistoryRange(range)).catch(() => ({ candles: [] }))
            : { candles: [] };
        const sp500Candles = (sp500Response.candles ?? [])
            .map((c) => ({ time: this.candleAvailabilityTime(Number(c.time), 'SPY', range, new Date(portSeries[portSeries.length - 1]?.date || Date.now())), close: Number(c.close) }))
            .filter((c) => Number.isFinite(c.time) && Number.isFinite(c.close) && c.close > 0)
            .sort((a, b) => a.time - b.time);

        const candleAtDate = (date: string) => this.getHistoricalPriceAtDate(sp500Candles, new Date(date));

        const firstSp500Close = portfolioBase100.length > 0 ? candleAtDate(portfolioBase100[0].date) : null;
        const lastSp500Close = portfolioBase100.length > 0 ? candleAtDate(portfolioBase100[portfolioBase100.length - 1].date) : null;
        const benchmarkAvailable = typeof firstSp500Close === 'number' && firstSp500Close > 0 && lastSp500Close != null;

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
            performance: perfData,
            benchmarkAvailable,
            series,
            benchmarks,
            returns,
        };
    }
}
