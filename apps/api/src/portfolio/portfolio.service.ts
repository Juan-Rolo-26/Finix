import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePortfolioDto, UpdatePortfolioDto, CreateAssetDto, UpdateAssetDto, CreateTransactionDto } from './dto/portfolio.dto';
import { MarketQuote, MarketService } from '../market/market.service';
import { AccessControlService } from '../access/access-control.service';

const normalizeAssetType = (value?: string) => {
    if (!value) return undefined;
    return value.trim().toUpperCase().replace(/\s+/g, '_');
};

const MOVEMENT_TYPE_TO_DB: Record<string, string> = {
    compra: 'BUY',
    buy: 'BUY',
    venta: 'SELL',
    sell: 'SELL',
    dividendo: 'DIVIDEND',
    dividend: 'DIVIDEND',
    fee: 'FEE',
    deposito: 'DEPOSIT',
    deposit: 'DEPOSIT',
    retiro: 'WITHDRAW',
    withdraw: 'WITHDRAW',
};

const DB_TYPE_TO_MOVEMENT: Record<string, string> = {
    BUY: 'compra',
    SELL: 'venta',
    DIVIDEND: 'dividendo',
    FEE: 'fee',
    DEPOSIT: 'deposito',
    WITHDRAW: 'retiro',
};

@Injectable()
export class PortfolioService {
    constructor(
        private prisma: PrismaService,
        private marketService: MarketService,
        private accessControlService: AccessControlService,
    ) { }

    private async assertPortfolioOwner(portfolioId: string, userId: string) {
        const portfolio = await this.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
            select: { id: true },
        });

        if (!portfolio) {
            throw new NotFoundException('Portafolio no encontrado');
        }
    }

    private normalizeMovementType(value?: string) {
        if (!value) return undefined;
        return MOVEMENT_TYPE_TO_DB[value.trim().toLowerCase()];
    }

    private normalizeTicker(value?: string) {
        return String(value || '').trim().toUpperCase();
    }

    private normalizeCurrency(value?: string | null) {
        return String(value || 'USD').trim().toUpperCase() || 'USD';
    }

    private sortTransactionsChronologically<T extends { date?: Date | string | null; createdAt?: Date | string | null; id?: string | null }>(transactions: T[]) {
        return [...transactions].sort((left, right) => {
            const leftDate = left?.date ? new Date(left.date).getTime() : 0;
            const rightDate = right?.date ? new Date(right.date).getTime() : 0;

            if (leftDate !== rightDate) {
                return leftDate - rightDate;
            }

            const leftCreatedAt = left?.createdAt ? new Date(left.createdAt).getTime() : leftDate;
            const rightCreatedAt = right?.createdAt ? new Date(right.createdAt).getTime() : rightDate;

            if (leftCreatedAt !== rightCreatedAt) {
                return leftCreatedAt - rightCreatedAt;
            }

            return String(left?.id || '').localeCompare(String(right?.id || ''));
        });
    }

    private addToBalanceMap(target: Map<string, number>, currency: string, amount: number) {
        if (!currency || !Number.isFinite(amount) || Math.abs(amount) <= 1e-8) {
            return;
        }

        target.set(currency, (target.get(currency) ?? 0) + amount);
    }

    private sumBalanceMap(target: Map<string, number>) {
        return Array.from(target.values()).reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
    }

    private getTransactionCashDelta(transaction: any) {
        const type = String(transaction?.type ?? '').toUpperCase();
        const total = Number(transaction?.total ?? 0);
        const fee = Number(transaction?.fee ?? 0);
        const currency = this.normalizeCurrency(transaction?.currency);

        let amount = 0;
        if (type === 'BUY') amount = -(total + fee);
        if (type === 'SELL') amount = total - fee;
        if (type === 'DIVIDEND') amount = total;
        if (type === 'DEPOSIT') amount = total;
        if (type === 'WITHDRAW') amount = -total;
        if (type === 'FEE') amount = -total;

        if (!Number.isFinite(amount) || Math.abs(amount) <= 1e-8) {
            return null;
        }

        return {
            currency,
            amount,
            type,
            date: transaction?.date ? new Date(transaction.date) : new Date(),
        };
    }

    private async getLiveQuoteMap(holdings: any[]) {
        const quoteMap = new Map<string, MarketQuote>();
        const tickers = Array.from(
            new Set(
                holdings
                    .map((holding) => this.normalizeTicker(holding?.asset?.ticker))
                    .filter(Boolean)
            )
        );

        if (tickers.length === 0) {
            return quoteMap;
        }

        try {
            const quotes = await this.marketService.getQuotes(tickers);
            quotes.forEach((quote) => {
                const key = this.normalizeTicker(quote.inputSymbol);
                if (!key) return;
                quoteMap.set(key, quote);
            });
        } catch (error) {
            console.error('[PortfolioService] Failed to load live quotes:', error);
        }

        return quoteMap;
    }

    private toMonthKey(date: Date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    private shiftUtcMonth(date: Date, offset: number) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
    }

    private getTrailingMonthlyWindows() {
        const now = new Date();
        const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        return Array.from({ length: 12 }, (_, index) => {
            const start = this.shiftUtcMonth(currentMonthStart, index - 11);
            const isCurrentMonth = start.getUTCFullYear() === now.getUTCFullYear() && start.getUTCMonth() === now.getUTCMonth();
            const end = isCurrentMonth
                ? now
                : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 23, 59, 59, 999));
            const daysInMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
            const label = new Intl.DateTimeFormat('es-AR', { month: 'short', timeZone: 'UTC' })
                .format(start)
                .replace('.', '')
                .toUpperCase();

            return {
                monthKey: this.toMonthKey(start),
                previousMonthKey: this.toMonthKey(this.shiftUtcMonth(start, -1)),
                start,
                end,
                daysInMonth,
                label,
            };
        });
    }

    private async getHistoricalMonthEndPriceMap(ticker: string, startDate: Date, endDate: Date) {
        const normalizedTicker = this.normalizeTicker(ticker);
        const monthEndPrices = new Map<string, number>();

        if (!normalizedTicker) {
            return monthEndPrices;
        }

        const period1 = Math.floor(startDate.getTime() / 1000);
        const period2 = Math.floor((endDate.getTime() + 24 * 60 * 60 * 1000) / 1000);
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalizedTicker)}?interval=1d&period1=${period1}&period2=${period2}&includePrePost=false&events=div%2Csplits`;

        try {
            const response = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'Mozilla/5.0',
                },
            });

            if (!response.ok) {
                return monthEndPrices;
            }

            const payload = await response.json() as any;
            const result = payload?.chart?.result?.[0];
            const timestamps = result?.timestamp;
            const closes = result?.indicators?.quote?.[0]?.close;

            if (!Array.isArray(timestamps) || !Array.isArray(closes)) {
                return monthEndPrices;
            }

            for (let index = 0; index < timestamps.length; index += 1) {
                const timestamp = timestamps[index];
                const close = closes[index];

                if (!Number.isFinite(timestamp) || !Number.isFinite(close)) {
                    continue;
                }

                monthEndPrices.set(this.toMonthKey(new Date(timestamp * 1000)), Number(close));
            }
        } catch (error) {
            console.error(`[PortfolioService] Failed to load historical prices for ${normalizedTicker}:`, error);
        }

        return monthEndPrices;
    }

    private async getHistoricalMonthEndPriceMaps(tickers: string[], startDate: Date, endDate: Date) {
        const uniqueTickers = Array.from(new Set(tickers.map((ticker) => this.normalizeTicker(ticker)).filter(Boolean)));
        const histories = await Promise.all(
            uniqueTickers.map(async (ticker) => ([ticker, await this.getHistoricalMonthEndPriceMap(ticker, startDate, endDate)] as const)),
        );

        return new Map(histories);
    }

    private buildCurrentHoldingMap(holdings: any[]) {
        const currentHoldings = new Map<string, number>();

        for (const holding of holdings ?? []) {
            const ticker = this.normalizeTicker(holding?.asset?.ticker);
            if (!ticker) continue;

            currentHoldings.set(ticker, Number(holding.quantity ?? 0));
        }

        return currentHoldings;
    }

    private buildCurrentCashMap(cashAccounts: any[]) {
        const currentCash = new Map<string, number>();

        for (const account of cashAccounts ?? []) {
            const currency = this.normalizeCurrency(account?.currency);
            if (!currency) continue;

            this.addToBalanceMap(currentCash, currency, Number(account?.balance ?? 0));
        }

        return currentCash;
    }

    private buildBaselineHoldingMap(holdings: any[], transactions: any[]) {
        const currentHoldings = this.buildCurrentHoldingMap(holdings);
        const transactionHoldings = new Map<string, number>();

        for (const transaction of transactions ?? []) {
            const ticker = this.normalizeTicker(transaction?.asset?.ticker);
            if (!ticker) continue;

            const quantity = Number(transaction.quantity ?? 0);
            const current = transactionHoldings.get(ticker) ?? 0;

            if (transaction.type === 'BUY') {
                transactionHoldings.set(ticker, current + quantity);
            } else if (transaction.type === 'SELL') {
                transactionHoldings.set(ticker, current - quantity);
            }
        }

        const baseline = new Map<string, number>();
        const tickers = new Set([...currentHoldings.keys(), ...transactionHoldings.keys()]);

        tickers.forEach((ticker) => {
            const diff = (currentHoldings.get(ticker) ?? 0) - (transactionHoldings.get(ticker) ?? 0);
            if (Math.abs(diff) > 1e-8) {
                baseline.set(ticker, diff);
            }
        });

        return baseline;
    }

    private buildBaselineCashMap(cashAccounts: any[], transactions: any[]) {
        const baselineCash = this.buildCurrentCashMap(cashAccounts);

        for (const transaction of transactions ?? []) {
            const delta = this.getTransactionCashDelta(transaction);
            if (!delta) continue;

            this.addToBalanceMap(baselineCash, delta.currency, -delta.amount);
        }

        return baselineCash;
    }

    private buildSyntheticFundingEvents(transactions: any[], baselineCash: Map<string, number>) {
        const runningBalances = new Map<string, number>();
        const syntheticEvents: Array<{ date: Date; currency: string; amount: number; synthetic: true }> = [];
        const sortedTransactions = this.sortTransactionsChronologically(transactions ?? []);
        const initialEventDate = sortedTransactions[0]?.date ? new Date(sortedTransactions[0].date) : new Date(0);

        baselineCash.forEach((balance, currency) => {
            if (!Number.isFinite(balance)) {
                return;
            }

            if (balance < 0) {
                syntheticEvents.push({
                    date: initialEventDate,
                    currency,
                    amount: Math.abs(balance),
                    synthetic: true,
                });
                runningBalances.set(currency, 0);
                return;
            }

            runningBalances.set(currency, balance);
        });

        for (const transaction of sortedTransactions) {
            const delta = this.getTransactionCashDelta(transaction);
            if (!delta) continue;

            const currentBalance = runningBalances.get(delta.currency) ?? 0;
            const nextBalance = currentBalance + delta.amount;

            if (nextBalance < 0) {
                syntheticEvents.push({
                    date: new Date(delta.date),
                    currency: delta.currency,
                    amount: Math.abs(nextBalance),
                    synthetic: true,
                });
                runningBalances.set(delta.currency, 0);
                continue;
            }

            runningBalances.set(delta.currency, nextBalance);
        }

        return syntheticEvents;
    }

    private buildCashEventTimeline(
        transactions: any[],
        syntheticFundingEvents: Array<{ date: Date; currency: string; amount: number; synthetic: true }>,
    ) {
        const actualEvents = (transactions ?? [])
            .map((transaction) => {
                const delta = this.getTransactionCashDelta(transaction);
                if (!delta) {
                    return null;
                }

                return {
                    date: new Date(delta.date),
                    currency: delta.currency,
                    amount: delta.amount,
                    synthetic: false as const,
                };
            })
            .filter(Boolean) as Array<{ date: Date; currency: string; amount: number; synthetic: false }>;

        return [...syntheticFundingEvents, ...actualEvents].sort((left, right) => {
            const leftTime = left.date.getTime();
            const rightTime = right.date.getTime();

            if (leftTime !== rightTime) {
                return leftTime - rightTime;
            }

            if (left.synthetic !== right.synthetic) {
                return left.synthetic ? -1 : 1;
            }

            return 0;
        });
    }

    private buildHoldingMapAtDate(transactions: any[], baselineHoldings: Map<string, number>, cutoffMs: number, inclusive: boolean) {
        const holdings = new Map(baselineHoldings);

        for (const transaction of transactions ?? []) {
            const transactionMs = new Date(transaction.date).getTime();
            const shouldApply = inclusive ? transactionMs <= cutoffMs : transactionMs < cutoffMs;

            if (!shouldApply) {
                break;
            }

            const ticker = this.normalizeTicker(transaction?.asset?.ticker);
            if (!ticker) continue;

            const quantity = Number(transaction.quantity ?? 0);
            const current = holdings.get(ticker) ?? 0;

            if (transaction.type === 'BUY') {
                holdings.set(ticker, current + quantity);
            } else if (transaction.type === 'SELL') {
                holdings.set(ticker, current - quantity);
            }
        }

        return holdings;
    }

    private buildCashMapAtDate(
        cashEvents: Array<{ date: Date; currency: string; amount: number; synthetic: boolean }>,
        baselineCash: Map<string, number>,
        cutoffMs: number,
        inclusive: boolean,
    ) {
        const cashBalances = new Map(baselineCash);

        for (const event of cashEvents ?? []) {
            const eventMs = event.date.getTime();
            const shouldApply = inclusive ? eventMs <= cutoffMs : eventMs < cutoffMs;

            if (!shouldApply) {
                break;
            }

            this.addToBalanceMap(cashBalances, event.currency, event.amount);
        }

        return cashBalances;
    }

    private buildHoldingCostMap(holdings: any[], transactions: any[], quoteMap: Map<string, MarketQuote>) {
        const holdingCostMap = new Map<string, number>();

        for (const holding of holdings ?? []) {
            const ticker = this.normalizeTicker(holding?.asset?.ticker);
            if (!ticker) continue;

            const averageCost = Number(holding?.averageCost ?? 0);
            if (averageCost > 0) {
                holdingCostMap.set(ticker, averageCost);
                continue;
            }

            const livePrice = quoteMap.get(ticker)?.price;
            if (typeof livePrice === 'number' && livePrice > 0) {
                holdingCostMap.set(ticker, livePrice);
            }
        }

        for (const transaction of this.sortTransactionsChronologically(transactions ?? [])) {
            const ticker = this.normalizeTicker(transaction?.asset?.ticker);
            if (!ticker || holdingCostMap.has(ticker)) continue;

            const pricePerUnit = Number(transaction?.pricePerUnit ?? 0);
            if (pricePerUnit > 0) {
                holdingCostMap.set(ticker, pricePerUnit);
            }
        }

        return holdingCostMap;
    }

    private calculatePortfolioValueForMonth(
        holdings: Map<string, number>,
        monthKey: string,
        historicalPriceMaps: Map<string, Map<string, number>>,
        quoteMap: Map<string, MarketQuote>,
        fallbackPriceMap: Map<string, number>,
    ) {
        let totalValue = 0;

        holdings.forEach((quantity, ticker) => {
            if (!Number.isFinite(quantity) || quantity <= 0) {
                return;
            }

            const historicalPrice = historicalPriceMaps.get(ticker)?.get(monthKey);
            const livePrice = quoteMap.get(ticker)?.price;
            const fallbackPrice = fallbackPriceMap.get(ticker);
            const price = historicalPrice ?? livePrice ?? fallbackPrice ?? 0;

            totalValue += quantity * price;
        });

        return totalValue;
    }

    private buildEffectiveCashState(portfolio: { cashAccounts?: any[]; transactions?: any[] }) {
        const transactions = this.sortTransactionsChronologically(
            (portfolio.transactions ?? []).filter((transaction: any) => transaction?.date),
        );
        const baselineCash = this.buildBaselineCashMap(portfolio.cashAccounts ?? [], transactions);
        const syntheticFundingEvents = this.buildSyntheticFundingEvents(transactions, baselineCash);
        const cashEvents = this.buildCashEventTimeline(transactions, syntheticFundingEvents);
        const currentCashMap = this.buildCashMapAtDate(cashEvents, baselineCash, Number.MAX_SAFE_INTEGER, true);

        return {
            transactions,
            baselineCash,
            syntheticFundingEvents,
            cashEvents,
            currentCashMap,
            currentCashBalance: this.sumBalanceMap(currentCashMap),
            cashByCurrency: Object.fromEntries(
                Array.from(currentCashMap.entries())
                    .filter(([, balance]) => Number.isFinite(balance) && Math.abs(balance) > 1e-8)
                    .sort(([leftCurrency], [rightCurrency]) => leftCurrency.localeCompare(rightCurrency))
                    .map(([currency, balance]) => [currency, Number(balance.toFixed(2))]),
            ),
            cashAccounts: Array.from(currentCashMap.entries())
                .filter(([, balance]) => Number.isFinite(balance) && Math.abs(balance) > 1e-8)
                .sort(([leftCurrency], [rightCurrency]) => leftCurrency.localeCompare(rightCurrency))
                .map(([currency, balance]) => ({
                    currency,
                    balance: Number(balance.toFixed(2)),
                })),
        };
    }

    private buildFallbackPriceMap(holdings: any[], transactions: any[], quoteMap: Map<string, MarketQuote>) {
        const fallbackPriceMap = new Map<string, number>();

        for (const holding of holdings ?? []) {
            const ticker = this.normalizeTicker(holding?.asset?.ticker);
            if (!ticker) continue;

            const livePrice = quoteMap.get(ticker)?.price;
            const avgCost = Number(holding.averageCost ?? 0);
            fallbackPriceMap.set(ticker, livePrice ?? avgCost);
        }

        for (const transaction of transactions ?? []) {
            const ticker = this.normalizeTicker(transaction?.asset?.ticker);
            if (!ticker) continue;

            const pricePerUnit = Number(transaction.pricePerUnit ?? 0);
            if (!fallbackPriceMap.has(ticker) && pricePerUnit > 0) {
                fallbackPriceMap.set(ticker, pricePerUnit);
            }
        }

        return fallbackPriceMap;
    }

    private async buildMonthlyReturns(
        portfolio: {
            holdings?: Array<{ quantity?: any; averageCost?: any; asset?: { ticker?: string } | null }>;
            transactions?: Array<{ type?: string; date?: Date; createdAt?: Date; quantity?: any; total?: any; fee?: any; pricePerUnit?: any; currency?: string; asset?: { ticker?: string } | null }>;
            cashAccounts?: Array<{ currency?: string; balance?: any }>;
        },
        quoteMap: Map<string, MarketQuote>,
    ) {
        const cashState = this.buildEffectiveCashState(portfolio);
        const transactions = cashState.transactions;
        const months = this.getTrailingMonthlyWindows();
        const historyStart = this.shiftUtcMonth(months[0].start, -1);
        const tickers = Array.from(new Set([
            ...(portfolio.holdings ?? []).map((holding) => holding?.asset?.ticker ?? ''),
            ...transactions.map((transaction) => transaction?.asset?.ticker ?? ''),
        ].map((ticker) => this.normalizeTicker(ticker)).filter(Boolean)));
        const historicalPriceMaps = await this.getHistoricalMonthEndPriceMaps(tickers, historyStart, new Date());
        const fallbackPriceMap = this.buildFallbackPriceMap(portfolio.holdings ?? [], transactions, quoteMap);
        const baselineHoldings = this.buildBaselineHoldingMap(portfolio.holdings ?? [], transactions);

        return months.map((month) => {
            const startHoldings = this.buildHoldingMapAtDate(transactions, baselineHoldings, month.start.getTime(), false);
            const endHoldings = this.buildHoldingMapAtDate(transactions, baselineHoldings, month.end.getTime(), true);
            const startCash = this.buildCashMapAtDate(cashState.cashEvents, cashState.baselineCash, month.start.getTime(), false);
            const endCash = this.buildCashMapAtDate(cashState.cashEvents, cashState.baselineCash, month.end.getTime(), true);
            const startValue = this.calculatePortfolioValueForMonth(
                startHoldings,
                month.previousMonthKey,
                historicalPriceMaps,
                quoteMap,
                fallbackPriceMap,
            ) + this.sumBalanceMap(startCash);
            const endValue = this.calculatePortfolioValueForMonth(
                endHoldings,
                month.monthKey,
                historicalPriceMaps,
                quoteMap,
                fallbackPriceMap,
            ) + this.sumBalanceMap(endCash);

            let netFlows = 0;
            let weightedFlows = 0;

            for (const transaction of transactions) {
                const transactionDate = new Date(transaction.date!);
                if (transactionDate < month.start || transactionDate > month.end) {
                    continue;
                }

                const type = String(transaction.type ?? '').toUpperCase();
                const total = Number(transaction.total ?? 0);
                const dayWeight = (month.daysInMonth - transactionDate.getUTCDate() + 1) / month.daysInMonth;

                if (type === 'DEPOSIT' || type === 'WITHDRAW') {
                    const flow = type === 'DEPOSIT' ? total : -total;
                    netFlows += flow;
                    weightedFlows += flow * dayWeight;
                }
            }

            for (const fundingEvent of cashState.syntheticFundingEvents) {
                if (fundingEvent.date < month.start || fundingEvent.date > month.end) {
                    continue;
                }

                const dayWeight = (month.daysInMonth - fundingEvent.date.getUTCDate() + 1) / month.daysInMonth;
                netFlows += fundingEvent.amount;
                weightedFlows += fundingEvent.amount * dayWeight;
            }

            const numerator = endValue - startValue - netFlows;
            const denominator = startValue + weightedFlows;
            const fallbackBase = Math.abs(weightedFlows) > 1e-6 ? Math.abs(weightedFlows) : Math.max(startValue, endValue, 0);
            const rawReturn = Math.abs(denominator) > 1e-6
                ? (numerator / denominator) * 100
                : fallbackBase > 1e-6
                    ? (numerator / fallbackBase) * 100
                    : 0;

            return {
                monthKey: month.monthKey,
                label: month.label,
                value: Number((Number.isFinite(rawReturn) ? rawReturn : 0).toFixed(2)),
            };
        });
    }

    private toLegacyAsset(holding: any, portfolioCreatedAt?: Date, quoteMap?: Map<string, MarketQuote>) {
        const cantidad = Number(holding.quantity ?? 0);
        const ppc = Number(holding.averageCost ?? 0);
        const ticker = holding.asset?.ticker ?? 'N/A';
        const quote = quoteMap?.get(this.normalizeTicker(ticker));
        const precioActual = quote && typeof quote.price === 'number' ? quote.price : ppc;
        const value = cantidad * precioActual;

        return {
            id: holding.assetId,
            ticker,
            tipoActivo: holding.asset?.type ?? 'UNKNOWN',
            cantidad,
            ppc,
            montoInvertido: cantidad * ppc,
            precioActual,
            value,
            precioTiempoReal: Boolean(quote && typeof quote.price === 'number'),
            precioFuente: quote?.symbol || null,
            precioActualizadoEn: quote?.updatedAt || null,
            createdAt: (portfolioCreatedAt ?? new Date()).toISOString(),
        };
    }

    private toLegacyMovement(transaction: any) {
        return {
            id: transaction.id,
            fecha: transaction.date,
            tipoMovimiento: DB_TYPE_TO_MOVEMENT[transaction.type] ?? String(transaction.type || '').toLowerCase(),
            ticker: transaction.asset?.ticker ?? 'CASH',
            claseActivo: transaction.asset?.type ?? 'CASH',
            cantidad: Number(transaction.quantity ?? 0),
            precio: Number(transaction.pricePerUnit ?? 0),
            total: Number(transaction.total ?? 0),
        };
    }

    private toLegacyPortfolio(portfolio: any, quoteMap?: Map<string, MarketQuote>) {
        const assets = (portfolio.holdings ?? []).map((holding: any) => this.toLegacyAsset(holding, portfolio.createdAt, quoteMap));
        const movements = (portfolio.transactions ?? []).slice(0, 200).map((transaction: any) => this.toLegacyMovement(transaction));
        const cashState = this.buildEffectiveCashState(portfolio);
        const assetsValue = assets.reduce((total: number, asset: any) => total + Number(asset.value ?? 0), 0);
        const cashBalance = cashState.currentCashBalance;
        const totalValue = assetsValue + cashBalance;

        return {
            id: portfolio.id,
            nombre: portfolio.nombre,
            descripcion: portfolio.descripcion,
            objetivo: portfolio.objetivo,
            monedaBase: portfolio.monedaBase,
            nivelRiesgo: portfolio.nivelRiesgo,
            modoSocial: portfolio.modoSocial,
            esPrincipal: portfolio.esPrincipal,
            admiteBienesRaices: portfolio.admiteBienesRaices,
            assets,
            cash: Number(cashBalance.toFixed(2)),
            cashBalance: Number(cashBalance.toFixed(2)),
            cashByCurrency: cashState.cashByCurrency,
            cashAccounts: cashState.cashAccounts,
            assetsValue: Number(assetsValue.toFixed(2)),
            totalValue: Number(totalValue.toFixed(2)),
            movements,
            createdAt: portfolio.createdAt,
            updatedAt: portfolio.updatedAt,
        };
    }

    // ==================== PORTFOLIOS ====================

    async createPortfolio(userId: string, dto: CreatePortfolioDto) {
        await this.accessControlService.limitFreePortfolio(userId);

        if (dto.esPrincipal) {
            await this.prisma.portfolio.updateMany({
                where: { userId, esPrincipal: true },
                data: { esPrincipal: false },
            });
        }

        const created = await this.prisma.portfolio.create({
            data: {
                userId,
                nombre: dto.nombre,
                descripcion: dto.descripcion,
                objetivo: dto.objetivo,
                monedaBase: dto.monedaBase || 'USD',
                nivelRiesgo: dto.nivelRiesgo || 'medio',
                modoSocial: dto.modoSocial || false,
                esPrincipal: dto.esPrincipal || false,
                admiteBienesRaices: dto.admiteBienesRaices || false,
            },
        });

        return this.getPortfolioById(created.id, userId);
    }

    async getUserPortfolios(userId: string) {
        const portfolios = await this.prisma.portfolio.findMany({
            where: { userId },
            include: {
                holdings: { include: { asset: true } },
                transactions: { include: { asset: true }, orderBy: { date: 'desc' } },
                cashAccounts: true,
            },
            orderBy: [
                { esPrincipal: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        const holdings = portfolios.flatMap((portfolio) => portfolio.holdings ?? []);
        const quoteMap = await this.getLiveQuoteMap(holdings);
        return portfolios.map((portfolio) => this.toLegacyPortfolio(portfolio, quoteMap));
    }

    private async canExposePortfoliosPublicly(userId: string) {
        const owner = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                isProfilePublic: true,
                showPortfolio: true,
            },
        });

        return Boolean(owner?.isProfilePublic && owner?.showPortfolio);
    }

    private async getVisiblePublicPortfolioRecords(userId: string, includeTransactions = false) {
        const canExpose = await this.canExposePortfoliosPublicly(userId);
        if (!canExpose) {
            return [];
        }

        const portfolios = await this.prisma.portfolio.findMany({
            where: { userId },
            include: {
                holdings: { include: { asset: true } },
                cashAccounts: true,
                ...(includeTransactions
                    ? {
                        transactions: {
                            include: { asset: true },
                            orderBy: { date: 'desc' as const },
                        },
                    }
                    : {}),
            },
            orderBy: [
                { esPrincipal: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        if (portfolios.length === 0) {
            return [];
        }

        const explicitlyPublic = portfolios.filter((portfolio) => portfolio.modoSocial);
        if (explicitlyPublic.length > 0) {
            return explicitlyPublic;
        }

        // Backward compatibility: if the user exposed the portfolio section but no
        // portfolio has been marked social yet, surface the primary/first one.
        return [portfolios[0]];
    }

    async getPublicPortfolios(userId: string) {
        const portfolios = await this.getVisiblePublicPortfolioRecords(userId, true);
        const holdings = portfolios.flatMap((portfolio) => portfolio.holdings ?? []);
        const quoteMap = await this.getLiveQuoteMap(holdings);
        return portfolios.map((portfolio) => this.toLegacyPortfolio(portfolio, quoteMap));
    }

    async getPortfolioById(portfolioId: string, userId: string) {
        const portfolio = await this.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
            include: {
                holdings: { include: { asset: true } },
                transactions: { include: { asset: true }, orderBy: { date: 'desc' } },
                cashAccounts: true,
            },
        });

        if (!portfolio) {
            throw new NotFoundException('Portafolio no encontrado');
        }

        const quoteMap = await this.getLiveQuoteMap(portfolio.holdings ?? []);
        return this.toLegacyPortfolio(portfolio, quoteMap);
    }

    private async getPublicPortfolioRecord(portfolioId: string, includeTransactions = false) {
        const targetPortfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            select: { userId: true },
        });

        if (!targetPortfolio) {
            throw new NotFoundException('Portafolio publico no encontrado');
        }

        const visiblePortfolios = await this.getVisiblePublicPortfolioRecords(
            targetPortfolio.userId,
            includeTransactions,
        );
        const portfolio = visiblePortfolios.find((item) => item.id === portfolioId);

        if (!portfolio) {
            throw new NotFoundException('Portafolio publico no encontrado');
        }

        return portfolio;
    }

    async updatePortfolio(portfolioId: string, userId: string, dto: UpdatePortfolioDto) {
        await this.assertPortfolioOwner(portfolioId, userId);

        if (dto.esPrincipal) {
            await this.prisma.portfolio.updateMany({
                where: { userId, esPrincipal: true, id: { not: portfolioId } },
                data: { esPrincipal: false },
            });
        }

        await this.prisma.portfolio.update({
            where: { id: portfolioId },
            data: dto,
        });

        return this.getPortfolioById(portfolioId, userId);
    }

    async deletePortfolio(portfolioId: string, userId: string) {
        await this.assertPortfolioOwner(portfolioId, userId);

        await this.prisma.portfolio.delete({
            where: { id: portfolioId },
        });

        return { ok: true };
    }

    // ==================== TRANSACTIONS & HOLDINGS ====================

    async createTransaction(portfolioId: string, userId: string, dto: CreateTransactionDto) {
        const portfolio = await this.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
        });

        if (!portfolio) {
            throw new NotFoundException('Portafolio no encontrado');
        }

        const quantity = Number(dto.quantity);
        const price = Number(dto.price || 0);
        const fee = Number(dto.fee || 0);
        const grossAmount = quantity * price;

        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new BadRequestException('La cantidad debe ser mayor a 0');
        }

        if ((dto.type === 'BUY' || dto.type === 'SELL') && (!Number.isFinite(price) || price <= 0)) {
            throw new BadRequestException('El precio debe ser mayor a 0 para compras/ventas');
        }

        if (!Number.isFinite(fee) || fee < 0) {
            throw new BadRequestException('La comisión no puede ser negativa');
        }

        const cleanedTicker = (dto.assetTicker || '').trim();
        const normalizedTicker = cleanedTicker.toUpperCase();
        const normalizedType = normalizeAssetType(dto.assetType);
        const normalizedName = dto.assetName?.trim();

        let asset: any = null;
        const shouldUseAsset = dto.type === 'BUY' || dto.type === 'SELL' || Boolean(normalizedTicker);

        if (shouldUseAsset) {
            if (!normalizedTicker) {
                throw new BadRequestException('assetTicker es requerido para este tipo de transacción');
            }

            asset = await this.prisma.asset.findUnique({
                where: { ticker: normalizedTicker },
            });

            if (!asset) {
                asset = await this.prisma.asset.create({
                    data: {
                        ticker: normalizedTicker,
                        name: normalizedName || normalizedTicker,
                        type: normalizedType || 'STOCK',
                        currency: dto.currency || portfolio.monedaBase || 'USD',
                    }
                });
            } else if (normalizedName || normalizedType) {
                const updates: { name?: string; type?: string } = {};
                if (normalizedName && asset.name === asset.ticker) {
                    updates.name = normalizedName;
                }
                if (normalizedType && (!asset.type || asset.type === 'STOCK')) {
                    updates.type = normalizedType;
                }
                if (Object.keys(updates).length > 0) {
                    asset = await this.prisma.asset.update({
                        where: { id: asset.id },
                        data: updates,
                    });
                }
            }
        }

        const date = dto.date ? new Date(dto.date) : new Date();

        let total = 0;
        if (dto.type === 'BUY' || dto.type === 'SELL') {
            // El total representa el monto nocional del activo; la comisión se guarda aparte.
            total = grossAmount;
        } else {
            total = Math.abs(quantity);
        }

        const transaction = await this.prisma.transaction.create({
            data: {
                portfolioId,
                assetId: asset?.id || null,
                type: dto.type,
                date,
                quantity,
                pricePerUnit: price,
                fee,
                total,
                currency: dto.currency || portfolio.monedaBase || 'USD',
                notes: dto.notes,
            },
            include: {
                asset: true,
            }
        });

        if (asset && (dto.type === 'BUY' || dto.type === 'SELL')) {
            const holding = await this.prisma.holding.findUnique({
                where: { portfolioId_assetId: { portfolioId, assetId: asset.id } }
            });

            if (dto.type === 'BUY') {
                const currentQty = holding ? Number(holding.quantity) : 0;
                const currentWac = holding ? Number(holding.averageCost) : 0;
                const newQty = currentQty + quantity;
                const newWac = newQty > 0
                    ? ((currentQty * currentWac) + (quantity * price)) / newQty
                    : 0;

                await this.prisma.holding.upsert({
                    where: { portfolioId_assetId: { portfolioId, assetId: asset.id } },
                    create: {
                        portfolioId,
                        assetId: asset.id,
                        quantity: newQty,
                        averageCost: newWac,
                    },
                    update: {
                        quantity: newQty,
                        averageCost: newWac,
                    }
                });
            } else {
                const currentQty = holding ? Number(holding.quantity) : 0;
                if (currentQty < quantity) {
                    throw new BadRequestException('Saldo insuficiente. Venta en corto no habilitada.');
                }

                const remainingQty = currentQty - quantity;
                if (remainingQty <= 0) {
                    await this.prisma.holding.delete({
                        where: { portfolioId_assetId: { portfolioId, assetId: asset.id } },
                    });
                } else {
                    await this.prisma.holding.update({
                        where: { portfolioId_assetId: { portfolioId, assetId: asset.id } },
                        data: { quantity: remainingQty },
                    });
                }
            }
        }

        if (dto.updateCash !== false) {
            const currency = dto.currency || portfolio.monedaBase || 'USD';
            const account = await this.prisma.cashAccount.upsert({
                where: { portfolioId_currency: { portfolioId, currency } },
                create: { portfolioId, currency, balance: 0 },
                update: {},
            });

            let cashChange = 0;
            if (dto.type === 'BUY') cashChange = -(grossAmount + fee);
            if (dto.type === 'SELL') cashChange = grossAmount - fee;
            if (dto.type === 'DIVIDEND') cashChange = total;
            if (dto.type === 'DEPOSIT') cashChange = total;
            if (dto.type === 'WITHDRAW') cashChange = -total;
            if (dto.type === 'FEE') cashChange = -total;

            await this.prisma.cashAccount.update({
                where: { id: account.id },
                data: { balance: { increment: cashChange } },
            });
        }

        return transaction;
    }

    // Legacy Support / Adapters
    async addAsset(portfolioId: string, userId: string, dto: CreateAssetDto) {
        return this.createTransaction(portfolioId, userId, {
            assetTicker: dto.ticker,
            assetName: dto.ticker,
            assetType: dto.tipoActivo,
            type: 'BUY',
            quantity: dto.cantidad,
            price: dto.precioActual || dto.precio,
            currency: 'USD',
            fee: 0,
            updateCash: true,
        });
    }

    async getPortfolioAssets(portfolioId: string, userId: string) {
        await this.assertPortfolioOwner(portfolioId, userId);

        const holdings = await this.prisma.holding.findMany({
            where: { portfolioId },
            include: { asset: true },
        });

        const quoteMap = await this.getLiveQuoteMap(holdings);
        return holdings.map((holding) => this.toLegacyAsset(holding, undefined, quoteMap));
    }

    async deleteAsset(assetId: string, userId: string, portfolioId?: string) {
        if (portfolioId) {
            await this.assertPortfolioOwner(portfolioId, userId);
        }

        const holdings = await this.prisma.holding.findMany({
            where: {
                assetId,
                ...(portfolioId ? { portfolioId } : {}),
                portfolio: { userId },
            },
            include: {
                asset: true,
            },
        });

        if (holdings.length === 0) {
            throw new NotFoundException('Activo no encontrado en tus portafolios');
        }

        if (!portfolioId && holdings.length > 1) {
            throw new BadRequestException('Debes indicar portfolioId para eliminar un activo repetido en varios portafolios.');
        }

        const target = holdings[0];
        await this.prisma.holding.delete({
            where: { id: target.id },
        });

        return {
            ok: true,
            assetId,
            portfolioId: target.portfolioId,
            ticker: target.asset?.ticker,
        };
    }

    private async buildPortfolioMetrics(portfolio: {
        holdings: Array<{ quantity: any; averageCost: any; asset?: { ticker?: string; type?: string } | null }>;
        transactions?: Array<{ type?: string; date?: Date; createdAt?: Date; quantity?: any; total?: any; fee?: any; pricePerUnit?: any; currency?: string; asset?: { ticker?: string; type?: string } | null }>;
        cashAccounts?: Array<{ currency?: string; balance?: any }>;
    }) {
        const quoteMap = await this.getLiveQuoteMap(portfolio.holdings ?? []);
        const cashState = this.buildEffectiveCashState(portfolio);
        const baselineHoldings = this.buildBaselineHoldingMap(portfolio.holdings ?? [], cashState.transactions);
        const holdingCostMap = this.buildHoldingCostMap(portfolio.holdings ?? [], cashState.transactions, quoteMap);
        let capitalInvertido = 0;
        let assetsValue = 0;
        const diversificacionPorClase: Record<string, number> = {};
        const diversificacionPorActivo: Record<string, number> = {};

        for (const holding of portfolio.holdings) {
            const qty = Number(holding.quantity || 0);
            const avgCost = Number(holding.averageCost || 0);
            const invested = qty * avgCost;
            const ticker = holding.asset?.ticker || 'N/A';
            const quote = quoteMap.get(this.normalizeTicker(ticker));
            const currentPrice = quote && typeof quote.price === 'number' ? quote.price : avgCost;
            const currentValue = qty * currentPrice;
            const assetType = holding.asset?.type || 'UNKNOWN';

            capitalInvertido += invested;
            assetsValue += currentValue;

            diversificacionPorClase[assetType] = (diversificacionPorClase[assetType] || 0) + currentValue;
            diversificacionPorActivo[ticker] = (diversificacionPorActivo[ticker] || 0) + currentValue;
        }

        if (cashState.currentCashBalance > 0) {
            diversificacionPorClase.CASH = (diversificacionPorClase.CASH || 0) + cashState.currentCashBalance;
        }

        let initialHoldingsContribution = 0;
        baselineHoldings.forEach((quantity, ticker) => {
            if (!Number.isFinite(quantity) || quantity <= 0) {
                return;
            }

            const unitCost = holdingCostMap.get(ticker) ?? 0;
            if (unitCost > 0) {
                initialHoldingsContribution += quantity * unitCost;
            }
        });

        const initialCashContribution = Array.from(cashState.baselineCash.values()).reduce((total, balance) => (
            balance > 0 ? total + balance : total
        ), 0);

        const explicitNetDeposits = cashState.transactions.reduce((total, transaction) => {
            const type = String(transaction?.type ?? '').toUpperCase();
            const amount = Number(transaction?.total ?? 0);

            if (type === 'DEPOSIT') return total + amount;
            if (type === 'WITHDRAW') return total - amount;
            return total;
        }, 0);

        const syntheticFundingTotal = cashState.syntheticFundingEvents.reduce((total, event) => total + event.amount, 0);
        const capitalTotal = initialHoldingsContribution + initialCashContribution + explicitNetDeposits + syntheticFundingTotal;
        const totalValue = assetsValue + cashState.currentCashBalance;
        const gananciaTotal = totalValue - capitalTotal;
        const retornosMensuales = await this.buildMonthlyReturns(portfolio, quoteMap);

        return {
            capitalTotal: Number(capitalTotal.toFixed(2)),
            capitalInvertido: Number(capitalInvertido.toFixed(2)),
            assetsValue: Number(assetsValue.toFixed(2)),
            cashBalance: Number(cashState.currentCashBalance.toFixed(2)),
            cashByCurrency: cashState.cashByCurrency,
            valorActual: Number(totalValue.toFixed(2)),
            totalValue: Number(totalValue.toFixed(2)),
            gananciaTotal: Number(gananciaTotal.toFixed(2)),
            variacionPorcentual: capitalTotal > 0 ? (gananciaTotal / capitalTotal) * 100 : 0,
            diversificacionPorClase,
            diversificacionPorActivo,
            cantidadActivos: portfolio.holdings.length,
            retornosMensuales,
        };
    }

    async getPortfolioMetrics(portfolioId: string, userId: string) {
        const portfolio = await this.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
            include: {
                holdings: { include: { asset: true } },
                transactions: { include: { asset: true } },
                cashAccounts: true,
            },
        });

        if (!portfolio) {
            throw new NotFoundException('Portafolio no encontrado');
        }

        return this.buildPortfolioMetrics(portfolio);
    }

    async getPublicPortfolioMetrics(portfolioId: string) {
        const portfolio = await this.getPublicPortfolioRecord(portfolioId, true);
        return this.buildPortfolioMetrics(portfolio);
    }

    async updateAsset(assetId: string, userId: string, dto: UpdateAssetDto) {
        throw new BadRequestException('Update Asset not supported. Use Transactions to adjust.');
    }

    async getPortfolioMovements(portfolioId: string, userId: string, filters?: any) {
        await this.assertPortfolioOwner(portfolioId, userId);

        const where: any = { portfolioId };

        const movementType = this.normalizeMovementType(filters?.tipoMovimiento);
        if (movementType) {
            where.type = movementType;
        }

        if (filters?.ticker) {
            const ticker = String(filters.ticker).trim().toUpperCase();
            const assets = await this.prisma.asset.findMany({
                where: {
                    ticker: {
                        contains: ticker,
                    }
                },
                select: { id: true },
            });
            const assetIds = assets.map((asset) => asset.id);
            if (assetIds.length === 0) {
                return [];
            }
            where.assetId = { in: assetIds };
        }

        if (filters?.fechaDesde || filters?.fechaHasta) {
            where.date = {};
            if (filters.fechaDesde) where.date.gte = filters.fechaDesde;
            if (filters.fechaHasta) where.date.lte = filters.fechaHasta;
        }

        const transactions = await this.prisma.transaction.findMany({
            where,
            include: { asset: true },
            orderBy: { date: 'desc' },
        });

        return transactions.map((transaction) => this.toLegacyMovement(transaction));
    }

    async getPublicPortfolioMovements(portfolioId: string) {
        const portfolio = await this.getPublicPortfolioRecord(portfolioId, true);
        return (portfolio.transactions ?? []).map((transaction) => this.toLegacyMovement(transaction));
    }

    // ==================== WATCHLISTS ====================

    async getWatchlists(userId: string) {
        return this.prisma.watchlist.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async createWatchlist(userId: string, name: string, tickers: string) {
        if (!name || name.trim().length === 0) {
            throw new BadRequestException('El nombre de la watchlist es requerido');
        }
        return this.prisma.watchlist.create({
            data: { userId, name: name.trim(), tickers },
        });
    }

    async updateWatchlist(id: string, userId: string, data: { name?: string; tickers?: string }) {
        const existing = await this.prisma.watchlist.findFirst({ where: { id, userId } });
        if (!existing) throw new NotFoundException('Watchlist no encontrada');
        return this.prisma.watchlist.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name.trim() }),
                ...(data.tickers !== undefined && { tickers: data.tickers }),
            },
        });
    }

    async deleteWatchlist(id: string, userId: string) {
        const existing = await this.prisma.watchlist.findFirst({ where: { id, userId } });
        if (!existing) throw new NotFoundException('Watchlist no encontrada');
        await this.prisma.watchlist.delete({ where: { id } });
        return { ok: true };
    }
}
