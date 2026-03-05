import { Injectable } from '@nestjs/common';
import { FundamentalProviderAdapter } from './fundamental-provider.adapter';
import { ProviderDescriptor } from '../types/provider.types';
import { ProviderFundamentalPayload, ResolvedSymbol, StatementPoint, EarningsPoint } from '../types/fundamental.types';
import { cagrFromSeries, safeRatio, toNumber } from '../utils/number.util';
import { fetchJsonWithRetry } from '../utils/http.util';
import { ProviderApiError } from '../utils/provider-error.util';

@Injectable()
export class AdapterAlphaVantageService implements FundamentalProviderAdapter {
    readonly provider = 'alphavantage' as const;

    private readonly apiKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.ALPHAVANTAGE_API_KEY || '';
    private readonly baseUrl = process.env.ALPHA_VANTAGE_BASE_URL || 'https://www.alphavantage.co/query';

    getDescriptor(): ProviderDescriptor {
        return {
            id: this.provider,
            name: 'Alpha Vantage',
            enabled: !!this.apiKey,
            supportsSearch: true,
            supportsFundamentals: true,
            notes: this.apiKey ? undefined : 'Sin API key configurada.',
        };
    }

    supportsAssetType(assetType: string): boolean {
        return ['stock', 'etf', 'cedear', 'index'].includes((assetType || '').toLowerCase());
    }

    private buildUrl(fn: string, symbol: string): string {
        const query = new URLSearchParams({
            function: fn,
            symbol,
            apikey: this.apiKey,
        });

        return `${this.baseUrl}?${query.toString()}`;
    }

    private assertNoRateLimit(payload: any): void {
        const note = typeof payload?.Note === 'string' ? payload.Note : '';
        if (note) {
            throw new ProviderApiError({
                provider: this.provider,
                message: `Alpha Vantage rate limit: ${note.slice(0, 160)}`,
                retryable: true,
                statusCode: 429,
            });
        }
        if (typeof payload?.Information === 'string' && payload.Information) {
            throw new ProviderApiError({
                provider: this.provider,
                message: payload.Information,
                retryable: false,
            });
        }
    }

    async fetchFundamentals(symbol: ResolvedSymbol): Promise<ProviderFundamentalPayload> {
        if (!this.apiKey) {
            throw new ProviderApiError({
                provider: this.provider,
                message: 'ALPHA_VANTAGE_API_KEY no configurada',
                retryable: false,
            });
        }

        const ticker = symbol.normalizedTicker;

        const [overview, incomeRaw, balanceRaw, cashRaw, earningsRaw] = await Promise.all([
            fetchJsonWithRetry<any>({ provider: this.provider, url: this.buildUrl('OVERVIEW', ticker), retries: 2 }),
            fetchJsonWithRetry<any>({ provider: this.provider, url: this.buildUrl('INCOME_STATEMENT', ticker), retries: 2 }),
            fetchJsonWithRetry<any>({ provider: this.provider, url: this.buildUrl('BALANCE_SHEET', ticker), retries: 2 }),
            fetchJsonWithRetry<any>({ provider: this.provider, url: this.buildUrl('CASH_FLOW', ticker), retries: 2 }),
            fetchJsonWithRetry<any>({ provider: this.provider, url: this.buildUrl('EARNINGS', ticker), retries: 2 }),
        ]);

        this.assertNoRateLimit(overview);
        this.assertNoRateLimit(incomeRaw);
        this.assertNoRateLimit(balanceRaw);
        this.assertNoRateLimit(cashRaw);
        this.assertNoRateLimit(earningsRaw);

        const incomeReports = Array.isArray(incomeRaw?.annualReports) ? incomeRaw.annualReports : [];
        const balanceReports = Array.isArray(balanceRaw?.annualReports) ? balanceRaw.annualReports : [];
        const cashReports = Array.isArray(cashRaw?.annualReports) ? cashRaw.annualReports : [];

        if (!overview?.Symbol && incomeReports.length === 0 && balanceReports.length === 0 && cashReports.length === 0) {
            throw new ProviderApiError({
                provider: this.provider,
                message: `Alpha Vantage sin datos para ${ticker}`,
                retryable: false,
            });
        }

        const incomeStatement: StatementPoint[] = incomeReports.map((row: any) => ({
            date: String(row?.fiscalDateEnding || ''),
            period: 'FY',
            fiscalYear: toNumber(String(row?.fiscalDateEnding || '').slice(0, 4)),
            currency: row?.reportedCurrency || null,
            revenue: toNumber(row?.totalRevenue),
            grossProfit: toNumber(row?.grossProfit),
            operatingIncome: toNumber(row?.operatingIncome),
            netIncome: toNumber(row?.netIncome),
            eps: toNumber(row?.reportedEPS),
            ebitda: toNumber(row?.ebitda),
        }));

        const balanceSheet: StatementPoint[] = balanceReports.map((row: any) => ({
            date: String(row?.fiscalDateEnding || ''),
            period: 'FY',
            fiscalYear: toNumber(String(row?.fiscalDateEnding || '').slice(0, 4)),
            currency: row?.reportedCurrency || null,
            totalAssets: toNumber(row?.totalAssets),
            totalLiabilities: toNumber(row?.totalLiabilities),
            totalEquity: toNumber(row?.totalShareholderEquity),
            cashAndEquivalents: toNumber(row?.cashAndCashEquivalentsAtCarryingValue),
            totalDebt:
                toNumber(row?.shortLongTermDebtTotal) ||
                toNumber(row?.longTermDebt) ||
                toNumber(row?.shortTermDebt),
        }));

        const cashFlow: StatementPoint[] = cashReports.map((row: any) => ({
            date: String(row?.fiscalDateEnding || ''),
            period: 'FY',
            fiscalYear: toNumber(String(row?.fiscalDateEnding || '').slice(0, 4)),
            currency: row?.reportedCurrency || null,
            operatingCashFlow: toNumber(row?.operatingCashflow),
            capex: toNumber(row?.capitalExpenditures),
            freeCashFlow:
                toNumber(row?.operatingCashflow) !== null && toNumber(row?.capitalExpenditures) !== null
                    ? (toNumber(row?.operatingCashflow) || 0) - Math.abs(toNumber(row?.capitalExpenditures) || 0)
                    : null,
        }));

        const earnings: EarningsPoint[] = (Array.isArray(earningsRaw?.annualEarnings) ? earningsRaw.annualEarnings : [])
            .slice(0, 8)
            .map((row: any) => ({
                date: String(row?.fiscalDateEnding || row?.reportedDate || ''),
                actualEps: toNumber(row?.reportedEPS),
                estimatedEps: null,
                surprisePct: null,
            }));

        const latestIncome = incomeStatement[0] || null;
        const latestBalance = balanceSheet[0] || null;
        const latestCash = cashFlow[0] || null;

        const orderedIncome = [...incomeStatement].sort((a, b) => (a.date > b.date ? 1 : -1));
        const revenues = orderedIncome.map((row) => row.revenue || null);
        const cagrYears = Math.max(1, revenues.length - 1);

        const debtToEquity =
            safeRatio(latestBalance?.totalDebt || null, latestBalance?.totalEquity || null) ||
            toNumber(overview?.DebtToEquityRatio);

        const netMargin =
            toNumber(overview?.ProfitMargin) !== null
                ? (toNumber(overview?.ProfitMargin) || 0) * 100
                : safeRatio(latestIncome?.netIncome || null, latestIncome?.revenue || null) !== null
                    ? (safeRatio(latestIncome?.netIncome || null, latestIncome?.revenue || null) || 0) * 100
                    : null;

        return {
            instrument: {
                normalizedTicker: ticker,
                tvSymbol: symbol.tvSymbol,
                exchange: String(overview?.Exchange || symbol.exchange || '').toUpperCase(),
                assetType: symbol.assetType,
                name: overview?.Name || symbol.name,
            },
            statements: {
                incomeStatement,
                balanceSheet,
                cashFlow,
                earnings,
            },
            metrics: {
                marketCap: toNumber(overview?.MarketCapitalization),
                enterpriseValue: toNumber(overview?.EnterpriseValue),
                peRatio: toNumber(overview?.PERatio),
                roe: toNumber(overview?.ReturnOnEquityTTM) !== null ? (toNumber(overview?.ReturnOnEquityTTM) || 0) * 100 : null,
                roic: null,
                debtToEquity,
                netMargin,
                freeCashFlow: latestCash?.freeCashFlow || null,
                revenueGrowthCagr: cagrFromSeries(revenues, cagrYears),
            },
            meta: {
                sector: overview?.Sector || null,
                currency: overview?.Currency || null,
            },
        };
    }
}
