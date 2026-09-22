import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { TV_SYMBOL_SLUGS } from '../market-ranking/services/tv-slugs.const';
import { ValueCreationService } from './value-creation.service';

type OpportunityCategory = 'ALL' | 'UNDERVALUED' | 'HEALTH' | 'GROWTH' | 'DIVIDEND';
type ScoreBreakdown = { valuation: number | null; quality: number | null; growth: number | null; profitability: number | null; balance: number | null };

export interface OpportunityItem {
    symbol: string; ticker: string; name: string; sector: string; industry: string | null; country: string | null;
    price: number | null; change: number | null; volume: number | null; marketCap: number | null; beta: number | null;
    fairValue: number | null; fairValueModel: 'DCF_FCF_SIMPLIFICADO' | null; upside: number | null;
    pe: number | null; forwardPe: number | null; peg: number | null; evToEbitda: number | null; priceToSales: number | null; priceToBook: number | null;
    fcf: number | null; fcfYield: number | null; dividendYield: number | null; payoutRatio: number | null;
    roic: number | null; roe: number | null; roa: number | null; operatingMargin: number | null; netMargin: number | null;
    currentRatio: number | null; quickRatio: number | null; debtToEquity: number | null; netDebt: number | null; netDebtToEbitda: number | null; interestCoverage: number | null;
    revenueGrowth: number | null; epsGrowth: number | null; ebitdaGrowth: number | null; fcfGrowth: number | null; operatingCashFlowGrowth: number | null;
    piotroskiScore: number | null; altmanZScore: number | null; rsi: number | null; sma50Distance: number | null; sma200Distance: number | null; technicalRating: number | null;
    wacc: number | null; valueCreationSpread: number | null;
    opportunityScore: number | null; scoreCoverage: number; scoreBreakdown: ScoreBreakdown;
}

export interface OpportunityQuery {
    category?: OpportunityCategory; sector?: string; query?: string; minMarketCap?: number; maxPe?: number; minRoic?: number;
    minRevenueGrowth?: number; minFcfGrowth?: number; maxNetDebtToEbitda?: number; minPiotroski?: number; minAltman?: number;
    minUpside?: number; minDividendYield?: number; sort?: 'score' | 'upside' | 'health' | 'growth' | 'dividend'; limit?: number; forceRefresh?: boolean;
}

interface OpportunityPayload { updatedAt: string; stale: boolean; items: OpportunityItem[]; }

const CACHE_KEY = 'market:opportunities:sp500:v2';
const FRESH_FOR_MS = 15 * 60 * 1000;
const STALE_FOR_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class OpportunityScreenerService implements OnModuleInit {
    private readonly logger = new Logger(OpportunityScreenerService.name);
    private memory: { data: OpportunityPayload; fetchedAt: number } | null = null;
    private refreshPromise: Promise<OpportunityPayload> | null = null;

    constructor(private readonly prisma: PrismaService, private readonly valueCreation: ValueCreationService) {}

    onModuleInit() {
        setTimeout(() => void this.getOpportunities({ limit: 1 }).catch(() => undefined), 15_000);
    }

    @Cron('15 18 * * 1-5', { timeZone: 'America/New_York' })
    async refreshAfterClose() {
        await this.getDataset(true);
    }

    async getOpportunities(query: OpportunityQuery = {}) {
        const dataset = await this.getDataset(Boolean(query.forceRefresh));
        const filtered = this.filter(dataset.items, query);
        return {
            summary: this.summary(dataset.items, filtered),
            filters: { sectors: Array.from(new Set(dataset.items.map((item) => item.sector).filter(Boolean))).sort(), categories: ['UNDERVALUED', 'HEALTH', 'GROWTH', 'DIVIDEND'] },
            methodology: {
                score: '30% valuación, 25% calidad financiera, 20% crecimiento, 15% rentabilidad y 10% fortaleza de balance. Si una categoría no tiene cobertura, el score se normaliza sobre las categorías disponibles y expone su cobertura.',
                fairValue: 'DCF de FCF simplificado: FCF TTM, WACC calculado por Finix y crecimiento terminal conservador de 2,5%. No es una recomendación ni un precio objetivo.',
            },
            updatedAt: dataset.updatedAt,
            stale: dataset.stale,
            items: filtered.slice(0, Math.min(Math.max(query.limit || 100, 1), 500)),
        };
    }

    private async getDataset(force: boolean): Promise<OpportunityPayload> {
        if (!force && this.memory && Date.now() - this.memory.fetchedAt < FRESH_FOR_MS) return this.memory.data;
        const persisted = !force ? await this.readPersisted() : null;
        if (persisted && Date.now() - new Date(persisted.updatedAt).getTime() < FRESH_FOR_MS) {
            this.memory = { data: persisted, fetchedAt: Date.now() };
            return persisted;
        }
        if (this.refreshPromise) return this.refreshPromise;
        this.refreshPromise = this.refresh().catch(async (error) => {
            this.logger.error(`No se pudo actualizar oportunidades: ${error.message}`);
            const fallback = persisted || await this.readPersisted();
            return fallback ? { ...fallback, stale: true } : { updatedAt: new Date().toISOString(), stale: true, items: [] };
        }).finally(() => { this.refreshPromise = null; });
        return this.refreshPromise;
    }

    private async refresh(): Promise<OpportunityPayload> {
        const [universe, valueData] = await Promise.all([this.getUniverse(), this.valueCreation.getSP500ValueCreation()]);
        const tickers = universe.map((item) => item.ticker);
        const [rows, optionalRows] = await Promise.all([this.fetchRows(tickers), this.fetchOptionalRows(tickers)]);
        const valueMap = new Map(valueData.items.map((item) => [item.ticker, item]));
        const items = universe.map((fallback) => this.toItem(rows.get(fallback.ticker), optionalRows.get(fallback.ticker), fallback, valueMap.get(fallback.ticker)));
        const payload = { updatedAt: new Date().toISOString(), stale: false, items };
        this.memory = { data: payload, fetchedAt: Date.now() };
        await this.persist(payload);
        this.logger.log(`Screener de oportunidades actualizado: ${items.filter((item) => item.opportunityScore !== null).length}/${items.length} con score.`);
        return payload;
    }

    private async getUniverse(): Promise<Array<{ ticker: string; companyName: string; sector: string }>> {
        try {
            const rows = await this.prisma.sP500Asset.findMany({ where: { isActive: true }, select: { ticker: true, companyName: true, sector: true } });
            if (rows.length >= 400) return rows.map((item) => ({ ticker: item.ticker.replace(/\./g, '-').toUpperCase(), companyName: item.companyName, sector: item.sector || 'Otros' }));
        } catch (error: any) { this.logger.warn(`Universo de oportunidades no disponible: ${error.message}`); }
        return Object.keys(TV_SYMBOL_SLUGS).map((ticker) => ({ ticker: ticker.replace(/\./g, '-'), companyName: ticker, sector: 'Otros' }));
    }

    private async fetchRows(tickers: string[]) {
        const result = new Map<string, any>();
        const columns = [
            'name', 'description', 'sector', 'industry', 'country', 'close', 'change', 'volume', 'market_cap_basic', 'beta_1_year',
            'price_earnings_ttm', 'price_sales_current', 'price_book_fq', 'price_free_cash_flow_ttm', 'enterprise_value_to_ebitda_ttm', 'dividends_yield',
            'earnings_per_share_diluted_ttm', 'total_revenue_ttm', 'operating_margin_ttm', 'net_margin_ttm', 'free_cash_flow_ttm',
            'return_on_equity_fq', 'return_on_assets_fq', 'return_on_invested_capital_fq', 'total_debt_fq', 'net_debt_fq', 'current_ratio_fq', 'quick_ratio_fq',
            'total_assets_fq', 'total_liabilities_fq', 'total_shares_outstanding_fundamental', 'RSI', 'SMA50', 'SMA200', 'Recommend.All',
            'dps_common_stock_prim_issue_fy', 'dividend_amount_recent',
        ];
        for (let index = 0; index < tickers.length; index += 80) {
            const batch = tickers.slice(index, index + 80);
            try {
                const response = await fetch('https://scanner.tradingview.com/america/scan', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Finix-OpportunityScreener/1.0' },
                    body: JSON.stringify({ symbols: { tickers: batch.flatMap((ticker) => [`NASDAQ:${ticker}`, `NYSE:${ticker}`]) }, columns }), signal: AbortSignal.timeout(12_000),
                });
                if (!response.ok) throw new Error(`TradingView HTTP ${response.status}`);
                const json: any = await response.json();
                for (const row of json?.data || []) {
                    const ticker = String(row?.d?.[0] || row?.s?.split(':').pop() || '').toUpperCase().replace(/\./g, '-');
                    if (ticker && !result.has(ticker)) result.set(ticker, row);
                }
            } catch (error: any) { this.logger.warn(`Lote de oportunidades ${Math.floor(index / 80) + 1} falló: ${error.message}`); }
        }
        return result;
    }

    /** Campos no presentes en todos los mercados. Un fallo aquí nunca invalida la lectura base. */
    private async fetchOptionalRows(tickers: string[]) {
        const result = new Map<string, any>();
        const columns = [
            'name', 'revenue_growth_ttm_yoy', 'earnings_per_share_diluted_yoy_growth_ttm', 'ebitda_growth_ttm_yoy',
            'free_cash_flow_growth_ttm_yoy', 'operating_cash_flow_growth_ttm_yoy', 'payout_ratio_ttm', 'net_debt_to_ebitda_fq',
            'interest_coverage_fq', 'Piotroski F-Score', 'Altman Z-Score',
        ];
        for (let index = 0; index < tickers.length; index += 80) {
            const batch = tickers.slice(index, index + 80);
            try {
                const response = await fetch('https://scanner.tradingview.com/america/scan', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Finix-OpportunityScreener/1.0' },
                    body: JSON.stringify({ symbols: { tickers: batch.flatMap((ticker) => [`NASDAQ:${ticker}`, `NYSE:${ticker}`]) }, columns }), signal: AbortSignal.timeout(12_000),
                });
                if (!response.ok) throw new Error(`TradingView HTTP ${response.status}`);
                const json: any = await response.json();
                for (const row of json?.data || []) {
                    const ticker = String(row?.d?.[0] || row?.s?.split(':').pop() || '').toUpperCase().replace(/\./g, '-');
                    if (ticker && !result.has(ticker)) result.set(ticker, row);
                }
            } catch (error: any) { this.logger.warn(`Cobertura avanzada de oportunidades no disponible (lote ${Math.floor(index / 80) + 1}): ${error.message}`); }
        }
        return result;
    }

    private toItem(row: any, optionalRow: any, fallback: { ticker: string; companyName: string; sector: string }, value: any): OpportunityItem {
        const d = Array.isArray(row?.d) ? row.d : [];
        const number = (index: number) => typeof d[index] === 'number' && Number.isFinite(d[index]) ? d[index] : null;
        const pct = (index: number) => this.percent(number(index));
        const ticker = String(d[0] || fallback.ticker).toUpperCase().replace(/\./g, '-');
        const price = number(5), marketCap = number(8), fcf = number(20), wacc = value?.wacc ?? null;
        const fcfYield = fcf !== null && marketCap && marketCap > 0 ? Number(((fcf / marketCap) * 100).toFixed(2)) : null;
        const fairValue = price && fcfYield !== null && wacc && wacc > 2.5 ? Number((price * (fcfYield / 100) * 1.025 / ((wacc - 2.5) / 100)).toFixed(2)) : null;
        const upside = fairValue !== null && price ? Number((((fairValue / price) - 1) * 100).toFixed(2)) : null;
        const currentRatio = number(26), quickRatio = number(27), debt = number(24), equity = number(29) !== null && number(28) !== null ? (number(28) as number) - (number(29) as number) : null;
        const debtToEquity = debt !== null && equity && equity > 0 ? Number((debt / equity).toFixed(2)) : null;
        const operatingMargin = pct(18), netMargin = pct(19), roe = pct(21), roa = pct(22), roic = pct(23);
        const rawDivYield = number(15);
        const dps = number(35);
        const divAmount = number(36);
        let dividendYield: number | null = null;
        if (rawDivYield !== null && rawDivYield > 0) {
            dividendYield = Number(rawDivYield.toFixed(2));
        } else if (dps !== null && dps > 0 && price && price > 0) {
            dividendYield = Number(((dps / price) * 100).toFixed(2));
        } else if (divAmount !== null && divAmount > 0 && price && price > 0) {
            dividendYield = Number(((divAmount * 4 / price) * 100).toFixed(2));
        }
        const advanced = Array.isArray(optionalRow?.d) ? optionalRow.d : [];
        const advancedNumber = (index: number) => typeof advanced[index] === 'number' && Number.isFinite(advanced[index]) ? advanced[index] : null;
        const revenueGrowth = this.percent(advancedNumber(1));
        const epsGrowth = this.percent(advancedNumber(2));
        const ebitdaGrowth = this.percent(advancedNumber(3));
        const fcfGrowth = this.percent(advancedNumber(4));
        const operatingCashFlowGrowth = this.percent(advancedNumber(5));
        const withGrowthScore = this.score({ upside, roic, roe, roa, operatingMargin, netMargin, fcfYield, currentRatio, quickRatio, debtToEquity, revenueGrowth, epsGrowth, ebitdaGrowth, fcfGrowth, operatingCashFlowGrowth });
        const symbol = String(row?.s || `NASDAQ:${ticker}`);
        return {
            symbol, ticker, name: String(d[1] || fallback.companyName), sector: String(d[2] || fallback.sector), industry: d[3] || null, country: d[4] || null,
            price, change: number(6), volume: number(7), marketCap, beta: number(9), fairValue, fairValueModel: fairValue === null ? null : 'DCF_FCF_SIMPLIFICADO', upside,
            pe: number(10), forwardPe: null, peg: null, evToEbitda: number(14), priceToSales: number(11), priceToBook: number(12), fcf, fcfYield,
            dividendYield, payoutRatio: this.percent(advancedNumber(6)), roic, roe, roa, operatingMargin, netMargin, currentRatio, quickRatio, debtToEquity, netDebt: number(25), netDebtToEbitda: advancedNumber(7), interestCoverage: advancedNumber(8),
            revenueGrowth, epsGrowth, ebitdaGrowth, fcfGrowth, operatingCashFlowGrowth, piotroskiScore: advancedNumber(9), altmanZScore: advancedNumber(10),
            rsi: number(32), sma50Distance: this.distance(price, number(33)), sma200Distance: this.distance(price, number(34)), technicalRating: number(35), wacc, valueCreationSpread: value?.spread ?? null,
            opportunityScore: withGrowthScore.score, scoreCoverage: withGrowthScore.coverage, scoreBreakdown: withGrowthScore.breakdown,
        };
    }

    private score(metrics: Record<string, number | null>) {
        const valuation = metrics.upside === null ? null : this.clamp((metrics.upside + 20) * 1.25, 0, 100);
        const qualityValues = [metrics.roic === null ? null : this.clamp(metrics.roic * 4, 0, 100), metrics.roe === null ? null : this.clamp(metrics.roe * 2.5, 0, 100), metrics.roa === null ? null : this.clamp(metrics.roa * 7, 0, 100)];
        const profitabilityValues = [metrics.operatingMargin === null ? null : this.clamp(metrics.operatingMargin * 3, 0, 100), metrics.netMargin === null ? null : this.clamp(metrics.netMargin * 4, 0, 100), metrics.fcfYield === null ? null : this.clamp(metrics.fcfYield * 8, 0, 100)];
        const balanceValues = [metrics.currentRatio === null ? null : this.clamp(metrics.currentRatio * 45, 0, 100), metrics.quickRatio === null ? null : this.clamp(metrics.quickRatio * 50, 0, 100), metrics.debtToEquity === null ? null : this.clamp(100 - metrics.debtToEquity * 35, 0, 100)];
        const average = (values: Array<number | null>) => { const valid = values.filter((value): value is number => value !== null); return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null; };
        const growthValues = [metrics.revenueGrowth === null || metrics.revenueGrowth === undefined ? null : this.clamp(metrics.revenueGrowth * 4, 0, 100), metrics.epsGrowth === null || metrics.epsGrowth === undefined ? null : this.clamp(metrics.epsGrowth * 3, 0, 100), metrics.ebitdaGrowth === null || metrics.ebitdaGrowth === undefined ? null : this.clamp(metrics.ebitdaGrowth * 3, 0, 100), metrics.fcfGrowth === null || metrics.fcfGrowth === undefined ? null : this.clamp(metrics.fcfGrowth * 3, 0, 100), metrics.operatingCashFlowGrowth === null || metrics.operatingCashFlowGrowth === undefined ? null : this.clamp(metrics.operatingCashFlowGrowth * 3, 0, 100)];
        const breakdown: ScoreBreakdown = { valuation, quality: average(qualityValues), growth: average(growthValues), profitability: average(profitabilityValues), balance: average(balanceValues) };
        const weights: Array<[keyof ScoreBreakdown, number]> = [['valuation', .30], ['quality', .25], ['growth', .20], ['profitability', .15], ['balance', .10]];
        const covered = weights.filter(([key]) => breakdown[key] !== null);
        const score = covered.length ? Number((covered.reduce((sum, [key, weight]) => sum + (breakdown[key] as number) * weight, 0) / covered.reduce((sum, [, weight]) => sum + weight, 0)).toFixed(1)) : null;
        return { score, coverage: Math.round(covered.reduce((sum, [, weight]) => sum + weight, 0) * 100), breakdown };
    }

    private filter(items: OpportunityItem[], query: OpportunityQuery) {
        const category = query.category || 'ALL'; const text = (query.query || '').trim().toLowerCase();
        const eligible = items.filter((item) => {
            if (text && !item.ticker.toLowerCase().includes(text) && !item.name.toLowerCase().includes(text)) return false;
            if (query.sector && query.sector !== 'ALL' && item.sector !== query.sector) return false;
            if (!this.min(item.marketCap, query.minMarketCap) || !this.max(item.pe, query.maxPe) || !this.min(item.roic, query.minRoic) || !this.min(item.revenueGrowth, query.minRevenueGrowth) || !this.min(item.fcfGrowth, query.minFcfGrowth) || !this.max(item.netDebtToEbitda, query.maxNetDebtToEbitda) || !this.min(item.piotroskiScore, query.minPiotroski) || !this.min(item.altmanZScore, query.minAltman) || !this.min(item.upside, query.minUpside) || !this.min(item.dividendYield, query.minDividendYield)) return false;
            if (category === 'UNDERVALUED') return item.upside !== null;
            if (category === 'HEALTH') return item.opportunityScore !== null && item.scoreBreakdown.balance !== null;
            if (category === 'GROWTH') return item.revenueGrowth !== null || item.epsGrowth !== null || item.fcfGrowth !== null;
            if (category === 'DIVIDEND') return item.dividendYield !== null && item.dividendYield > 0;
            return true;
        });
        const metric = query.sort === 'upside' ? (item: OpportunityItem) => item.upside : query.sort === 'dividend' ? (item: OpportunityItem) => item.dividendYield : query.sort === 'health' ? (item: OpportunityItem) => item.scoreBreakdown.balance : query.sort === 'growth' ? (item: OpportunityItem) => item.revenueGrowth : (item: OpportunityItem) => item.opportunityScore;
        return eligible.sort((a, b) => (metric(b) ?? -Infinity) - (metric(a) ?? -Infinity));
    }

    private summary(all: OpportunityItem[], filtered: OpportunityItem[]) { return { totalCount: all.length, matchingCount: filtered.length, scoredCount: all.filter((item) => item.opportunityScore !== null).length, undervaluedCount: all.filter((item) => (item.upside ?? 0) >= 20).length, healthyCount: all.filter((item) => (item.scoreBreakdown.balance ?? 0) >= 70).length, dividendCount: all.filter((item) => (item.dividendYield ?? 0) > 0).length }; }
    private min(value: number | null, limit?: number) { return limit === undefined || limit === null || (value !== null && value >= limit); }
    private max(value: number | null, limit?: number) { return limit === undefined || limit === null || (value !== null && value <= limit); }
    private percent(value: number | null) { if (value === null || Math.abs(value) > 300) return null; return Number((Math.abs(value) <= 1.5 ? value * 100 : value).toFixed(2)); }
    private distance(price: number | null, average: number | null) { return price !== null && average && average !== 0 ? Number((((price / average) - 1) * 100).toFixed(2)) : null; }
    private clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
    private async readPersisted(): Promise<OpportunityPayload | null> { try { const row = await this.prisma.fundamentalSnapshot.findUnique({ where: { cacheKey: CACHE_KEY } }); return row && Date.now() - row.fetchedAt.getTime() <= STALE_FOR_MS ? JSON.parse(row.payload) : null; } catch { return null; } }
    private async persist(payload: OpportunityPayload) { try { const now = new Date(); await this.prisma.fundamentalSnapshot.upsert({ where: { cacheKey: CACHE_KEY }, create: { cacheKey: CACHE_KEY, ticker: 'SP500-OPPORTUNITIES', providerRequested: 'finix-opportunity', providerUsed: 'tradingview', payload: JSON.stringify(payload), fetchedAt: now, expiresAt: new Date(now.getTime() + FRESH_FOR_MS), staleAt: new Date(now.getTime() + STALE_FOR_MS) }, update: { payload: JSON.stringify(payload), fetchedAt: now, expiresAt: new Date(now.getTime() + FRESH_FOR_MS), staleAt: new Date(now.getTime() + STALE_FOR_MS) } }); } catch (error: any) { this.logger.warn(`No se pudo persistir screener: ${error.message}`); } }
}
