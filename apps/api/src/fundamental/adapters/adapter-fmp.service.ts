import { Injectable } from '@nestjs/common';
import { FundamentalProviderAdapter } from './fundamental-provider.adapter';
import { ProviderDescriptor } from '../types/provider.types';
import { ProviderFundamentalPayload, ResolvedSymbol, StatementPoint, EarningsPoint } from '../types/fundamental.types';
import { cagrFromSeries, safeRatio, toNumber } from '../utils/number.util';
import { fetchJsonWithRetry } from '../utils/http.util';
import { ProviderApiError } from '../utils/provider-error.util';

@Injectable()
export class AdapterFMPService implements FundamentalProviderAdapter {
    readonly provider = 'fmp' as const;

    private readonly apiKey =
        process.env.FMP_API_KEY || process.env.FINANCIAL_MODELING_PREP_API_KEY || process.env.FMP_KEY || '';

    private readonly baseUrl = process.env.FMP_BASE_URL || 'https://financialmodelingprep.com/api/v3';

    getDescriptor(): ProviderDescriptor {
        const keyConfigured = !!this.apiKey;
        return {
            id: this.provider,
            name: 'Financial Modeling Prep',
            enabled: keyConfigured,
            supportsSearch: false,
            supportsFundamentals: true,
            notes: keyConfigured ? undefined : 'Sin API key configurada.',
        };
    }

    supportsAssetType(assetType: string): boolean {
        return ['stock', 'etf', 'index', 'cedear'].includes((assetType || '').toLowerCase());
    }

    private buildUrl(path: string, params?: Record<string, string | number>): string {
        const search = new URLSearchParams({ apikey: this.apiKey });
        if (params) {
            Object.entries(params).forEach(([key, value]) => search.set(key, String(value)));
        }
        return `${this.baseUrl.replace(/\/$/, '')}${path}?${search.toString()}`;
    }

    async fetchFundamentals(symbol: ResolvedSymbol): Promise<ProviderFundamentalPayload> {
        if (!this.apiKey) {
            throw new ProviderApiError({
                provider: this.provider,
                message: 'FMP_API_KEY no configurada',
                retryable: false,
            });
        }

        const ticker = symbol.normalizedTicker;

        const [profileRaw, ratiosRaw, keyMetricsRaw, incomeRaw, balanceRaw, cashRaw, earningsRaw] = await Promise.all([
            fetchJsonWithRetry<any[]>({ provider: this.provider, url: this.buildUrl(`/profile/${ticker}`), retries: 2 }),
            fetchJsonWithRetry<any[]>({ provider: this.provider, url: this.buildUrl(`/ratios/${ticker}`, { limit: 8 }), retries: 2 }),
            fetchJsonWithRetry<any[]>({ provider: this.provider, url: this.buildUrl(`/key-metrics/${ticker}`, { limit: 8 }), retries: 2 }),
            fetchJsonWithRetry<any[]>({ provider: this.provider, url: this.buildUrl(`/income-statement/${ticker}`, { limit: 8 }), retries: 2 }),
            fetchJsonWithRetry<any[]>({ provider: this.provider, url: this.buildUrl(`/balance-sheet-statement/${ticker}`, { limit: 8 }), retries: 2 }),
            fetchJsonWithRetry<any[]>({ provider: this.provider, url: this.buildUrl(`/cash-flow-statement/${ticker}`, { limit: 8 }), retries: 2 }),
            fetchJsonWithRetry<any[]>({ provider: this.provider, url: this.buildUrl(`/historical/earning_calendar/${ticker}`, { limit: 8 }), retries: 2 }),
        ]);

        const profile = Array.isArray(profileRaw) ? profileRaw[0] || {} : {};
        const ratios = Array.isArray(ratiosRaw) ? ratiosRaw[0] || {} : {};
        const keyMetrics = Array.isArray(keyMetricsRaw) ? keyMetricsRaw[0] || {} : {};
        const incomeArr = Array.isArray(incomeRaw) ? incomeRaw : [];
        const balanceArr = Array.isArray(balanceRaw) ? balanceRaw : [];
        const cashArr = Array.isArray(cashRaw) ? cashRaw : [];

        if (!profile && incomeArr.length === 0 && balanceArr.length === 0 && cashArr.length === 0) {
            throw new ProviderApiError({
                provider: this.provider,
                message: `FMP sin datos para ${ticker}`,
                retryable: false,
            });
        }

        const incomeStatement: StatementPoint[] = incomeArr.map((row: any) => ({
            date: String(row?.date || ''),
            period: row?.period || null,
            fiscalYear: toNumber(row?.calendarYear),
            currency: row?.reportedCurrency || null,
            revenue: toNumber(row?.revenue),
            grossProfit: toNumber(row?.grossProfit),
            operatingIncome: toNumber(row?.operatingIncome),
            netIncome: toNumber(row?.netIncome),
            eps: toNumber(row?.eps),
            ebitda: toNumber(row?.ebitda),
        }));

        const balanceSheet: StatementPoint[] = balanceArr.map((row: any) => ({
            date: String(row?.date || ''),
            period: row?.period || null,
            fiscalYear: toNumber(row?.calendarYear),
            currency: row?.reportedCurrency || null,
            totalAssets: toNumber(row?.totalAssets),
            totalLiabilities: toNumber(row?.totalLiabilities),
            totalEquity: toNumber(row?.totalStockholdersEquity),
            cashAndEquivalents: toNumber(row?.cashAndCashEquivalents),
            totalDebt: toNumber(row?.totalDebt),
        }));

        const cashFlow: StatementPoint[] = cashArr.map((row: any) => ({
            date: String(row?.date || ''),
            period: row?.period || null,
            fiscalYear: toNumber(row?.calendarYear),
            currency: row?.reportedCurrency || null,
            operatingCashFlow: toNumber(row?.operatingCashFlow),
            capex: toNumber(row?.capitalExpenditure),
            freeCashFlow: toNumber(row?.freeCashFlow),
        }));

        const earnings: EarningsPoint[] = (Array.isArray(earningsRaw) ? earningsRaw : []).map((row: any) => ({
            date: String(row?.date || row?.fiscalDateEnding || ''),
            actualEps: toNumber(row?.epsActual || row?.eps),
            estimatedEps: toNumber(row?.epsEstimated),
            surprisePct: toNumber(row?.epsDifferencePercent || row?.surprisePercentage),
        }));

        const latestIncome = incomeStatement[0] || null;
        const latestBalance = balanceSheet[0] || null;
        const latestCash = cashFlow[0] || null;

        const enterpriseValue = toNumber(keyMetrics?.enterpriseValue) || toNumber(profile?.enterpriseValue);
        const peRatio =
            toNumber(ratios?.priceEarningsRatio) ||
            toNumber(ratios?.priceEarningsToGrowthRatio) ||
            toNumber(profile?.pe);
        const roe = toNumber(ratios?.returnOnEquity) || toNumber(keyMetrics?.roe);
        const roic = toNumber(ratios?.returnOnInvestedCapital) || toNumber(keyMetrics?.roic);
        const debtToEquity =
            toNumber(ratios?.debtEquityRatio) ||
            safeRatio(latestBalance?.totalDebt || null, latestBalance?.totalEquity || null);
        const netMargin =
            toNumber(ratios?.netProfitMargin) ||
            safeRatio(latestIncome?.netIncome || null, latestIncome?.revenue || null);
        const freeCashFlow = toNumber(latestCash?.freeCashFlow) || toNumber(keyMetrics?.freeCashFlow);

        const incomeChronological = [...incomeStatement].sort((a, b) => (a.date > b.date ? 1 : -1));
        const revenues = incomeChronological.map((row) => row.revenue || null);
        const cagrYears = Math.max(1, revenues.length - 1);

        return {
            instrument: {
                normalizedTicker: ticker,
                tvSymbol: symbol.tvSymbol,
                exchange: (profile?.exchangeShortName || symbol.exchange || '').toUpperCase(),
                assetType: symbol.assetType,
                name: profile?.companyName || symbol.name,
            },
            statements: {
                incomeStatement,
                balanceSheet,
                cashFlow,
                earnings,
            },
            metrics: {
                marketCap: toNumber(profile?.mktCap) || toNumber(profile?.marketCap),
                enterpriseValue,
                peRatio,
                roe,
                roic,
                debtToEquity,
                netMargin: netMargin !== null ? netMargin * 100 : null,
                freeCashFlow,
                revenueGrowthCagr: cagrFromSeries(revenues, cagrYears),
            },
            meta: {
                sector: profile?.sector || null,
                currency: profile?.currency || null,
            },
        };
    }
}
