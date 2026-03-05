import { Injectable } from '@nestjs/common';
import { FundamentalProviderAdapter } from './fundamental-provider.adapter';
import { ProviderDescriptor } from '../types/provider.types';
import { ProviderFundamentalPayload, ResolvedSymbol, StatementPoint, EarningsPoint } from '../types/fundamental.types';
import { cagrFromSeries, safeRatio, toNumber } from '../utils/number.util';
import { fetchJsonWithRetry } from '../utils/http.util';
import { ProviderApiError } from '../utils/provider-error.util';

interface ConceptValue {
    concept?: string;
    value?: number | string;
    unit?: string;
}

interface FinancialReportRow {
    year?: number;
    quarter?: number;
    report?: {
        ic?: ConceptValue[];
        bs?: ConceptValue[];
        cf?: ConceptValue[];
    };
}

@Injectable()
export class AdapterFinnhubService implements FundamentalProviderAdapter {
    readonly provider = 'finnhub' as const;

    private readonly apiToken = process.env.FINNHUB_API_KEY || process.env.FINNHUB_TOKEN || '';
    private readonly baseUrl = process.env.FINNHUB_BASE_URL || 'https://finnhub.io/api/v1';

    getDescriptor(): ProviderDescriptor {
        return {
            id: this.provider,
            name: 'Finnhub',
            enabled: !!this.apiToken,
            supportsSearch: true,
            supportsFundamentals: true,
            notes: this.apiToken ? undefined : 'Sin API key configurada.',
        };
    }

    supportsAssetType(assetType: string): boolean {
        return ['stock', 'etf', 'index', 'cedear'].includes((assetType || '').toLowerCase());
    }

    private buildUrl(path: string, params?: Record<string, string | number>): string {
        const query = new URLSearchParams({ token: this.apiToken });
        if (params) {
            Object.entries(params).forEach(([key, value]) => query.set(key, String(value)));
        }
        return `${this.baseUrl.replace(/\/$/, '')}${path}?${query.toString()}`;
    }

    private valueFromConcepts(concepts: ConceptValue[] | undefined, candidates: string[]): number | null {
        if (!Array.isArray(concepts)) return null;
        const lowerCandidates = candidates.map((item) => item.toLowerCase());
        const exact = concepts.find((item) => lowerCandidates.includes(String(item?.concept || '').toLowerCase()));
        if (exact) return toNumber(exact.value);

        const partial = concepts.find((item) => {
            const concept = String(item?.concept || '').toLowerCase();
            return lowerCandidates.some((candidate) => concept.includes(candidate));
        });

        return partial ? toNumber(partial.value) : null;
    }

    async fetchFundamentals(symbol: ResolvedSymbol): Promise<ProviderFundamentalPayload> {
        if (!this.apiToken) {
            throw new ProviderApiError({
                provider: this.provider,
                message: 'FINNHUB_API_KEY no configurada',
                retryable: false,
            });
        }

        const ticker = symbol.normalizedTicker;

        const [profileRaw, metricsRaw, financialsRaw, earningsRaw] = await Promise.all([
            fetchJsonWithRetry<any>({ provider: this.provider, url: this.buildUrl('/stock/profile2', { symbol: ticker }), retries: 2 }),
            fetchJsonWithRetry<any>({ provider: this.provider, url: this.buildUrl('/stock/metric', { symbol: ticker, metric: 'all' }), retries: 2 }),
            fetchJsonWithRetry<any>({ provider: this.provider, url: this.buildUrl('/stock/financials-reported', { symbol: ticker, freq: 'annual' }), retries: 2 }),
            fetchJsonWithRetry<any>({ provider: this.provider, url: this.buildUrl('/stock/earnings', { symbol: ticker, limit: 8 }), retries: 2 }),
        ]);

        const metric = metricsRaw?.metric || {};
        const reports = Array.isArray(financialsRaw?.data) ? (financialsRaw.data as FinancialReportRow[]) : [];

        if (!profileRaw && reports.length === 0 && !metricsRaw) {
            throw new ProviderApiError({
                provider: this.provider,
                message: `Finnhub sin datos para ${ticker}`,
                retryable: false,
            });
        }

        const incomeStatement: StatementPoint[] = reports.map((report) => {
            const ic = report.report?.ic || [];
            const revenue = this.valueFromConcepts(ic, ['Revenue', 'Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax']);
            const netIncome = this.valueFromConcepts(ic, ['NetIncomeLoss', 'NetIncome']);
            const operatingIncome = this.valueFromConcepts(ic, ['OperatingIncomeLoss', 'OperatingIncome']);
            const grossProfit = this.valueFromConcepts(ic, ['GrossProfit']);
            const ebitda = this.valueFromConcepts(ic, ['OperatingIncomeLoss', 'EarningsBeforeInterestTaxesDepreciationAmortization']);

            return {
                date: `${report.year || ''}-12-31`,
                period: 'FY',
                fiscalYear: report.year || null,
                revenue,
                netIncome,
                operatingIncome,
                grossProfit,
                ebitda,
                eps: toNumber(metric?.epsAnnual),
            };
        });

        const balanceSheet: StatementPoint[] = reports.map((report) => {
            const bs = report.report?.bs || [];
            return {
                date: `${report.year || ''}-12-31`,
                period: 'FY',
                fiscalYear: report.year || null,
                totalAssets: this.valueFromConcepts(bs, ['Assets']),
                totalLiabilities: this.valueFromConcepts(bs, ['Liabilities']),
                totalEquity: this.valueFromConcepts(bs, ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest']),
                cashAndEquivalents: this.valueFromConcepts(bs, ['CashAndCashEquivalentsAtCarryingValue', 'CashAndCashEquivalents']),
                totalDebt: this.valueFromConcepts(bs, ['Debt', 'LongTermDebtAndCapitalLeaseObligations', 'LongTermDebtNoncurrent']),
            };
        });

        const cashFlow: StatementPoint[] = reports.map((report) => {
            const cf = report.report?.cf || [];
            const operatingCashFlow = this.valueFromConcepts(cf, ['NetCashProvidedByUsedInOperatingActivities']);
            const capex = this.valueFromConcepts(cf, ['PaymentsToAcquirePropertyPlantAndEquipment', 'CapitalExpenditures']);
            const freeCashFlow =
                operatingCashFlow !== null && capex !== null
                    ? operatingCashFlow - Math.abs(capex)
                    : toNumber(metric?.freeCashFlowTTM);

            return {
                date: `${report.year || ''}-12-31`,
                period: 'FY',
                fiscalYear: report.year || null,
                operatingCashFlow,
                capex,
                freeCashFlow,
            };
        });

        const earnings: EarningsPoint[] = (Array.isArray(earningsRaw) ? earningsRaw : []).map((row: any) => ({
            date: String(row?.period || row?.date || ''),
            actualEps: toNumber(row?.actual),
            estimatedEps: toNumber(row?.estimate),
            surprisePct: toNumber(row?.surprisePercent),
        }));

        const latestIncome = incomeStatement[0] || null;
        const latestBalance = balanceSheet[0] || null;
        const latestCash = cashFlow[0] || null;

        const orderedIncome = [...incomeStatement].sort((a, b) => (a.date > b.date ? 1 : -1));
        const revenues = orderedIncome.map((row) => row.revenue || null);
        const cagrYears = Math.max(1, revenues.length - 1);

        const marketCap = toNumber(metric?.marketCapitalization) || toNumber(profileRaw?.marketCapitalization);

        return {
            instrument: {
                normalizedTicker: ticker,
                tvSymbol: symbol.tvSymbol,
                exchange: String(profileRaw?.exchange || symbol.exchange || '').toUpperCase(),
                assetType: symbol.assetType,
                name: profileRaw?.name || symbol.name,
            },
            statements: {
                incomeStatement,
                balanceSheet,
                cashFlow,
                earnings,
            },
            metrics: {
                marketCap: marketCap !== null ? marketCap * 1_000_000 : null,
                enterpriseValue: toNumber(metric?.enterpriseValue) || toNumber(metric?.enterpriseValueTTM),
                peRatio: toNumber(metric?.peTTM) || toNumber(metric?.peBasicExclExtraTTM),
                roe: toNumber(metric?.roeTTM),
                roic: toNumber(metric?.roicTTM) || toNumber(metric?.roiTTM),
                debtToEquity:
                    toNumber(metric?.totalDebtToEquityQuarterly) ||
                    safeRatio(latestBalance?.totalDebt || null, latestBalance?.totalEquity || null),
                netMargin:
                    toNumber(metric?.netMarginTTM) ||
                    (safeRatio(latestIncome?.netIncome || null, latestIncome?.revenue || null) ?? null),
                freeCashFlow: toNumber(metric?.freeCashFlowTTM) || latestCash?.freeCashFlow || null,
                revenueGrowthCagr: cagrFromSeries(revenues, cagrYears),
            },
            meta: {
                sector: profileRaw?.finnhubIndustry || null,
                currency: profileRaw?.currency || null,
            },
        };
    }
}
